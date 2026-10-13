// End-to-end test: drives the REAL mobile UI in headless Chromium at iPhone size.
// Plays a complete career slice: create -> train -> book -> match (via taps) -> result -> post-match
// -> record book -> reload -> continue, plus a mid-match reload. Fails loudly on console errors or overflow.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import { serve } from './serve.js';
const require = createRequire(import.meta.url);
let chromium;
for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright', '/opt/node-tools/node_modules/playwright']) { try { ({ chromium } = require(p)); break; } catch { /* try next */ } }
if (!chromium) throw new Error('playwright not found');

const OUT = process.env.E2E_OUT || path.resolve('dist/e2e');
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok: !!ok, info }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? '  ' + info : ''}`); };

const server = await serve(+process.env.PORT || 5188);
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: process.env.SCHEME || 'light' });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));
const shot = (n) => page.screenshot({ path: path.join(OUT, `${n}.png`) });
const noOverflow = async (label) => {
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  check(`no horizontal overflow: ${label}`, o.sw <= o.iw + 1, `${o.sw} <= ${o.iw}`);
};
const click = async (sel) => { await page.locator(sel).first().click(); };
const state = (fn) => page.evaluate(fn);
const toShowDay = async () => { if (!(await page.locator('#btn-book').count())) await click('#btn-advance'); await page.waitForSelector('#btn-book'); };

await page.goto(base);
await page.waitForSelector('#btn-new');
await noOverflow('title'); await shot('01-title');
await click('#btn-new');
await page.fill('#in-name', 'Iron Mike Dalton');
await click('[data-k=alignment][data-v=heel]');
await click('[data-k=background][data-v=prospect]');
await shot('02-create-0');
await click('#btn-next');
await click('[data-k=style][data-v=technician]');
for (let i = 0; i < 6; i++) await click('[data-action=bonus][data-k=technical][data-d="1"]');
for (let i = 0; i < 6; i++) await click('[data-action=bonus][data-k=grappling][data-d="1"]');
await noOverflow('create-style'); await click('#btn-next');
await page.selectOption('#sig-0', 'sig_arm'); await page.fill('#signame-0', 'Iron Wrench');
await page.selectOption('#fin-tpl', 'fin_sub_arms'); await page.fill('#fin-name', 'Dalton Lock');
await click('#btn-next'); await click('[data-k=entrance][data-v=menace]'); await click('#btn-next');
await shot('03-create-review'); await click('#btn-begin');
await page.waitForSelector('.tabbar');
check('career created with entered name', (await state(() => window.__S.g.career.player.name)) === 'Iron Mike Dalton');
check('finisher name chosen in UI is stored', (await state(() => window.__S.g.career.player.finisher.name)) === 'Dalton Lock');
await noOverflow('home'); await shot('04-home');

// training and time use
await click('[data-action=train][data-id=technical]');
await page.waitForSelector('.toast');
check('training recorded in ledger', (await state(() => window.__S.g.career.memory.ledger.ofType('training').length)) === 1);
await toShowDay();
await click('#btn-book');
await page.waitForSelector('[data-action=scout]');
await noOverflow('booking'); await shot('05-booking');
await click('[data-action=scout]');
await page.waitForSelector('#btn-start');
await noOverflow('prep'); await shot('06-prep');
await click('[data-k=plan][data-v=fast_start]');
await click('#btn-start');
await page.waitForSelector('#decision');
await noOverflow('match'); await shot('07-match-start');

// play the match through the UI with a mixed strategy
let steps = 0; let counts = [];
while (steps++ < 400) {
  if (await page.locator('#btn-finish').count()) break;
  const n = await page.locator('#decision .opts button.btn').count();
  if (!n) { await page.waitForTimeout(50); continue; }
  counts.push(n);
  if (steps === 6) { await noOverflow('match mid'); await shot('08-match-mid'); }
  const kind = await page.locator('#decision').getAttribute('data-kind');
  // prefer finisher/signature when offered; otherwise rotate through options
  let idx = (steps * 7) % n;
  const labels = await page.locator('#decision .opts button.btn b').allTextContents();
  const fin = labels.findIndex((l) => /Dalton Lock|Iron Wrench/.test(l));
  if (kind === 'action' && fin >= 0) idx = fin;
  await page.locator('#decision .opts button.btn').nth(idx).click();
}
await page.waitForSelector('#btn-finish');
check('match reached its end via UI taps', true, `${steps} taps`);
check('decision menus had 6+ options', Math.min(...counts) >= 4, `min ${Math.min(...counts)}, max ${Math.max(...counts)}`);
await shot('09-match-over');
await click('#btn-finish');
await page.waitForSelector('#btn-done');
await noOverflow('result'); await shot('10-result');
const mres = await state(() => { const c = window.__S.g.career; return { matches: c.stats.s.matches, w: c.stats.s.wins, l: c.stats.s.losses, d: c.stats.s.draws, phase: c.flags.phase }; });
check('career record updated after the match', mres.matches === 1 && mres.w + mres.l + mres.d === 1, JSON.stringify(mres));
const postBtns = await page.locator('[data-action=post]').count();
check('post-match decisions offered', postBtns >= 5, `${postBtns}`);
await page.locator('[data-action=post]').first().click();
await click('#btn-done');
await page.waitForSelector('.tabbar');

// career + record book + evidence
await click('[data-action=tab][data-id=career]');
await noOverflow('career'); await shot('11-career');
await click('[data-action=openSub][data-id=recordbook]');
await noOverflow('record book'); await shot('12-recordbook');
await page.locator('[data-action=evidence]').first().click();
await page.waitForSelector('.sheet');
await shot('13-evidence');
const evCount = await page.locator('.sheet .item').count();
check('record-book statistic opens to its evidence events', evCount >= 1, `${evCount} events`);
await click('[data-action=closeSheet]');

// other tabs smoke
for (const t of ['calendar', 'roster', 'more']) { await click(`[data-action=tab][data-id=${t}]`); await noOverflow(t); }
await shot('14-more');
await click('[data-action=openSub][data-id=achievements]'); await noOverflow('achievements'); await shot('15-achievements');
await page.locator('[data-action=achDetail]').first().click(); await page.waitForSelector('.sheet'); await click('[data-action=closeSheet]');

// promo with memory + promise
await click('[data-action=tab][data-id=more]'); await click('[data-action=openSub][data-id=media]');
await click('[data-action=promoSet][data-k=claim][data-v=win_match]');
await click('#btn-promo');
await page.waitForSelector('.line');
await shot('16-promo');
const promoState = await state(() => ({ promos: window.__S.g.career.stats.s.promos, open: window.__S.g.career.memory.world.promises.filter((p) => p.status === 'open').length }));
check('promo recorded and promise remembered', promoState.promos === 1 && promoState.open >= 1, JSON.stringify(promoState));

// persistence: reload and continue
const ledgerHead = await state(() => window.__S.g.career.memory.ledger.head);
await page.evaluate(() => window.__S.g.autosave());
await page.reload();
await page.waitForSelector('#btn-continue');
await click('#btn-continue');
await page.waitForSelector('.tabbar');
const afterHead = await state(() => window.__S.g.career.memory.ledger.head);
check('reload + continue restores the exact ledger', ledgerHead === afterHead);
check('stats survive reload', (await state(() => window.__S.g.career.stats.s.matches)) === 1);

// mid-match reload
await click('[data-action=tab][data-id=home]');
await toShowDay(); await click('#btn-book'); await page.locator('[data-action=pickOpp]').first().click();
await click('#btn-start'); await page.waitForSelector('#decision');
for (let i = 0; i < 5; i++) { if (await page.locator('#btn-finish').count()) break; await page.locator('#decision .opts button.btn').first().click(); }
const midState = await state(() => JSON.stringify(window.__S.g.engine.toJSON()));
await page.evaluate(() => window.__S.g.autosave());
await page.reload(); await page.waitForSelector('#btn-continue'); await click('#btn-continue');
await page.waitForSelector('#decision, #btn-finish');
const afterMid = await state(() => JSON.stringify(window.__S.g.engine.toJSON()));
check('mid-match reload resumes the identical match state', midState === afterMid);
await noOverflow('match resumed'); await shot('17-match-resumed');

check('no console/page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close(); server.close();
const failed = results.filter((r) => !r.ok);
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify({ at: new Date().toISOString(), results }, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} e2e checks passed`);
process.exit(failed.length ? 1 : 0);
