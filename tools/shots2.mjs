import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from './serve.mjs';
const out = process.argv[2]; const w = +process.argv[3] || 390, h = +process.argv[4] || 844;
const srv = createServer().listen(0); const port = srv.address().port;
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'dark' });
const p = await ctx.newPage(); const errs = []; p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
await p.goto(`http://localhost:${port}/index.html`); await p.waitForFunction(() => window.__app, null, { timeout: 15000 }); await p.waitForTimeout(300);
await p.screenshot({ path: `${out}/menu.png` });
await p.evaluate(() => { const o = document.getElementById('overlay'); o.querySelector('[data-m="new"]').click(); }); await p.waitForTimeout(300);
await p.screenshot({ path: `${out}/newgame.png` });
await p.evaluate(() => { document.querySelector('[data-n="start"]').click(); }); await p.waitForFunction(() => window.__app.sim, null, { timeout: 20000 }); await p.waitForTimeout(800);
await p.screenshot({ path: `${out}/game.png` });
for (const id of ['nation', 'economy', 'diplomacy', 'military']) { await p.evaluate((i) => window.__app.openSheet(i), id); await p.waitForTimeout(450); await p.screenshot({ path: `${out}/${id}.png` }); }
console.log('errors:', errs.slice(0, 6)); await b.close(); srv.close();
