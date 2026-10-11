// Plays the real UI in headless Chromium (phone viewport, touch): new game, run years at max speed, open every sheet, collect errors & frame stats.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from './serve.mjs';
const years = +process.argv[2] || 2;
const srv = createServer().listen(0); const port = srv.address().port;
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' });
const p = await ctx.newPage(); const errs = []; p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
await p.goto(`http://localhost:${port}/index.html`); await p.waitForFunction(() => window.__app); await p.waitForSelector('[data-m="new"]');
await p.evaluate(() => { document.querySelector('[data-m="new"]').click(); }); await p.waitForTimeout(200);
await p.evaluate(() => { const a = document.querySelector('[data-sc="fault_lines"]'); a.click(); }); await p.waitForTimeout(100);
await p.evaluate(() => { document.querySelector('[data-c="DEU"]')?.click(); }); await p.waitForTimeout(100);
await p.evaluate(() => document.querySelector('[data-n="start"]').click()); await p.waitForFunction(() => window.__app.sim, null, { timeout: 30000 });
await p.evaluate(() => { const a = window.__app; a.settings.tutorial = false; document.querySelector('.coach')?.remove(); a.setSpeed(3); a.play(); });
// frame-time monitor
await p.evaluate(() => { window.__ft = []; let last = performance.now(); const f = (t) => { window.__ft.push(t - last); last = t; requestAnimationFrame(f); }; requestAnimationFrame(f); });
let day0 = await p.evaluate(() => window.__app.sim.state.day); const t0 = Date.now(); const sheets = ['nation', 'economy', 'diplomacy', 'military', 'research', 'intel', 'inbox', 'stats', 'objectives', 'more', 'settings', 'saves', 'help'];
let si = 0;
while (true) {
  await p.waitForTimeout(1500);
  const info = await p.evaluate(() => { const a = window.__app; return { day: a.sim.state.day, date: a.sim.calendar.format(a.sim.state.day), paused: a.paused, pending: a.sim.state.events.pending.length, ended: !!a.sim.state.ended }; });
  if (info.paused || info.pending) { // a decision (or war) paused the game: answer it like a player
    await p.evaluate(() => { const a = window.__app; const pend = a.sim.state.events.pending.find((x) => x.country === a.sim.state.playerId); if (pend) { a.closeOverlay(); a.cmd({ type: 'resolveEvent', uid: pend.uid, option: 0 }); } a.play(); });
  }
  await p.evaluate((id) => { window.__app.openSheet(id); }, sheets[si++ % sheets.length]);
  if (info.day - day0 >= years * 365 || Date.now() - t0 > 150000 || info.ended) { console.log('reached', info.date, 'in', ((Date.now() - t0) / 1000).toFixed(0), 's'); break; }
}
const ft = await p.evaluate(() => window.__ft.slice(5)); ft.sort((a, b) => a - b);
console.log('frames', ft.length, 'median', ft[ft.length >> 1]?.toFixed(1), 'p95', ft[Math.floor(ft.length * 0.95)]?.toFixed(1), 'p99', ft[Math.floor(ft.length * 0.99)]?.toFixed(1), 'max', ft[ft.length - 1]?.toFixed(0), 'ms');
console.log('errors:', errs.slice(0, 8)); await p.screenshot({ path: process.argv[3] || '/tmp/uiplay.png' }); await b.close(); srv.close();
