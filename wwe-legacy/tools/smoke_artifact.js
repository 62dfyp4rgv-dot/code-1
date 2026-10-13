// Smoke test for the single-file build: wraps dist/artifact.html in the viewer-style skeleton and plays a few taps.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
let chromium;
for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright']) { try { ({ chromium } = require(p)); break; } catch { /* next */ } }
const frag = fs.readFileSync('dist/artifact.html', 'utf8');
const doc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui}[hidden]{display:none!important}</style></head><body>${frag}</body></html>`;
const browser = await chromium.launch({ args: ['--no-sandbox'] });
let ok = true;
for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: scheme });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' && !/font|ERR_|Failed to load/.test(m.text())) errs.push(m.text()); });
  await page.setContent(doc, { waitUntil: 'load' });
  await page.waitForSelector('#btn-new');
  await page.click('#btn-new');
  for (let i = 0; i < 4; i++) await page.click('#btn-next');
  await page.click('#btn-begin');
  await page.waitForSelector('.tabbar');
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, bg: getComputedStyle(document.body).backgroundColor, name: window.__S.g.career.player.name }));
  console.log(scheme, JSON.stringify(o), errs.length ? errs : 'no errors');
  if (errs.length || o.sw > o.iw + 1) ok = false;
  await page.screenshot({ path: `dist/e2e/artifact-${scheme}.png` });
  await ctx.close();
}
await browser.close();
process.exit(ok ? 0 : 1);
