// Quick headless check: node tools/shot.mjs out.png [width height] -- loads app, logs console errors
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { createServer } from '../serve.mjs';
const [out = 'shot.png', w = 390, h = 844] = process.argv.slice(2);
const srv = createServer().listen(0); const port = srv.address().port;
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const p = await ctx.newPage(); const errs = []; p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); }); p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await p.goto(`http://localhost:${port}/index.html`); await p.waitForTimeout(1500);
await p.screenshot({ path: out }); console.log('errors:', errs.slice(0, 8)); await b.close(); srv.close();
