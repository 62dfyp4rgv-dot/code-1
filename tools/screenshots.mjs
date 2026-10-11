// Captures genuine screenshots of the running game (Chromium device emulation, NOT iOS) into docs/screenshots/.
import fs from 'node:fs';
import path from 'node:path';
import { chromium, newPage, DEVICES } from './pw.mjs';
import { createServer } from './serve.mjs';
const out = path.resolve('docs/screenshots');
fs.mkdirSync(out, { recursive: true });
const srv = createServer().listen(0);
const base = `http://localhost:${srv.address().port}/index.html`;
const b = await chromium.launch();
async function start(page, scenario, country) {
  await page.goto(base);
  await page.waitForSelector('[data-m="new"]');
  await page.screenshot({ path: `${out}/${page.tag}-01-menu.png` });
  await page.click('[data-m="new"]');
  await page.waitForSelector('[data-sc]');
  await page.click(`[data-sc="${scenario}"]`);
  await page.fill('#nq', country);
  await page.waitForTimeout(350);
  await page.waitForSelector(`[data-c]`);
  await page.screenshot({ path: `${out}/${page.tag}-02-newgame.png` });
  await page.evaluate((c) => document.querySelector(`[data-c="${c}"]`)?.click(), country);
  await page.waitForTimeout(150);
  await page.click('[data-n="start"]');
  await page.waitForFunction(() => window.__app && window.__app.sim, null, { timeout: 30000 });
  await page.waitForTimeout(500);
}
const shot = async (page, name) => {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${out}/${page.tag}-${name}.png` });
};
const sets = [
  ['iphone14', DEVICES['iPhone 14 (390x844)']],
  ['iphoneSE', DEVICES['iPhone SE (375x667)']],
  ['iphone14-landscape', DEVICES['iPhone 14 landscape (844x390)']],
];
for (const [tag, dev] of sets) {
  const page = await newPage(b, dev);
  page.tag = tag;
  await start(page, 'fault_lines', tag === 'iphone14' ? 'DEU' : 'UKR');
  await shot(page, '03-tutorial');
  await page.evaluate(() => {
    window.__app.settings.tutorial = false;
    document.querySelector('.coach')?.remove();
    const a = window.__app;
    a.setSpeed(2);
    a.play();
  });
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.__app.pause());
  await shot(page, '04-map');
  if (tag === 'iphone14') {
    await page.evaluate(() => {
      const a = window.__app;
      a.map.setMode('relations');
      a.updateLegend();
    });
    await shot(page, '05-map-relations');
    await page.evaluate(() => {
      const a = window.__app;
      a.map.setMode('political');
      a.updateLegend();
      a.selectCountry(a.sim.geo.idOf.FRA, true);
    });
    await shot(page, '06-country');
    for (const [id, tab, snap] of [
      ['nation', 'policy', 'full'],
      ['economy', 'overview', 'full'],
      ['economy', 'trade', 'full'],
      ['diplomacy', 'relations', 'full'],
      ['military', 'overview', 'full'],
      ['research', 'queue', 'full'],
      ['objectives', 'paths', 'full'],
      ['settings', undefined, 'full'],
    ]) {
      await page.evaluate(
        ([i, t, s]) => {
          if (t) window.__app.sheetTab[i] = t;
          window.__app.openSheet(i, {}, s);
        },
        [id, tab, snap],
      );
      await shot(page, `07-${id}${tab ? '-' + tab : ''}`);
    }
    await page.evaluate(() => {
      const a = window.__app;
      a.closeSheet(true);
      a.map.setMode('trade', 'oil');
      a.updateLegend();
      a.map.focus(60, 30, 4, false);
    });
    await shot(page, '08-map-trade-flows');
  } else if (tag === 'iphone14-landscape') {
    await page.evaluate(() => window.__app.openSheet('economy', {}, 'half'));
    await shot(page, '05-economy');
  } else {
    await page.evaluate(() => {
      window.__app.sheetTab.military = 'war';
      window.__app.openSheet('military', { tab: 'war' }, 'full');
    });
    await shot(page, '05-war');
    await page.evaluate(() => {
      const a = window.__app;
      a.closeSheet(true);
      const g = a.sim.geo;
      const r = g.cRegions[g.idOf.UKR][1];
      a.map.focus(g.regions[r].lon, g.regions[r].lat, 10, false);
    });
    await shot(page, '06-front');
  }
  console.log(tag, 'errors:', page.errors.slice(0, 3));
  await page.context().close();
}
await b.close();
srv.close();
console.log('screenshots in', out, fs.readdirSync(out).length, 'files');
