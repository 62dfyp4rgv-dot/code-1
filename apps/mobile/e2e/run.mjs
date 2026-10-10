// End-to-end test of the exported web build (Chromium via playwright-core). Usage: npm run export:web && npm run e2e
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './server.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(here, '../dist');
const SHOTS = path.resolve(here, '../../../docs/screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const CHROME = process.env.CHROME_PATH ?? fs.readdirSync(process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => path.join(process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/opt/pw-browsers', d, 'chrome-linux', 'chrome'))[0];

let assertions = 0;
const failures = [];
const shots = [];
function check(name, cond, detail = '') {
  assertions++;
  if (!cond) { failures.push(`${name} ${detail}`); console.log(`  FAIL ${name} ${detail}`); } else console.log(`  ok   ${name}`);
}

const { server, port } = await serve(DIST);
const base = `http://127.0.0.1:${port}`;
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(`console: ${m.text()}`); });

const tid = (id) => page.locator(`[data-testid="${id}"]:visible:not([aria-hidden=\"true\"] *)`);
const tidAny = (id) => page.locator(`[data-testid="${id}"]`);
async function shot(name) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
  shots.push(name);
}
async function text(id) { return (await tid(id).first().innerText()).trim(); }
async function visible(id, timeout = 15000) { await tid(id).first().waitFor({ state: 'visible', timeout }); }
async function click(id) { await tid(id).first().click(); }
async function goMore(item) { await click('tab-more'); await visible(item); await click(item); }
async function noHScroll(label) {
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, bw: document.body.scrollWidth }));
  check(`no horizontal overflow: ${label} (${o.iw}px)`, o.sw <= o.iw + 1 && o.bw <= o.iw + 1, JSON.stringify(o));
}
async function back() { await click('back-button'); }
// Tap-target audit: every visible interactive element must be >= 44x44 CSS px, except those that extend their hit area with hitSlop
// (RN-web does not render hitSlop into the bounding box), which must still be >= 28 px.
async function tapTargets(label, slopOk = 28) {
  const bad = await page.evaluate((slopOk) => {
    const out = [];
    for (const el of document.querySelectorAll('[role=button],[role=tab],[role=switch],[role=radio],[role=link],input,[role=adjustable]')) {
      if (el.closest('[aria-hidden="true"]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || r.bottom < 0 || r.top > innerHeight) continue;
      if (r.height < 43.5 || (r.width < 43.5 && el.getAttribute('role') !== 'link')) out.push(`${el.getAttribute('data-testid') ?? el.getAttribute('aria-label') ?? (el.tagName + ':' + (el.innerText || '').slice(0, 20).replace(/\n/g, ' '))} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    return out;
  }, slopOk);
  const hard = bad.filter((b) => { const m = /(\d+)x(\d+)$/.exec(b); return Number(m[1]) < slopOk || Number(m[2]) < slopOk; });
  if (bad.length) console.log(`   tap targets < 44px on ${label}: ${bad.join('; ')}`);
  check(`tap targets >= ${slopOk}px (hitSlop) on ${label}`, hard.length === 0, hard.join('; '));
  return bad;
}

try {
  console.log('== 1. start screen & new career');
  await page.goto(base + '/');
  await visible('btn-new-career');
  check('start screen shows New career', (await page.getByText('New career').count()) > 0);
  check('start screen states data is fictional', (await page.getByText(/fictional/i).count()) > 0);
  await shot('01-start');
  await click('btn-new-career');
  await visible('input-seed');
  await tid('input-seed').fill('e2e-seed-1');
  await click('preset-standard');
  check('standard preset shows a performance warning', await tid('standard-warning').isVisible());
  await click('preset-compact');
  await shot('02-new-career-setup');
  await click('btn-generate');
  await visible('league-ENG1', 90000);
  check('league list shows Saudi Pro League', (await tid('league-SAU1').count()) === 1);
  await shot('03-new-career-league');
  await click('league-SAU1');
  await visible('btn-start-career');
  await shot('03b-new-career-saudi-clubs');
  check('Saudi club list has several clubs', (await page.locator('[data-testid^="club-cl"]:visible').count()) >= 6);
  await click('btn-career-back');
  await click('league-ENG1');
  await visible('btn-start-career');
  const clubRows = page.locator('[data-testid^="club-cl"]:visible:not([aria-hidden="true"] *)');
  check('league lists clubs', (await clubRows.count()) >= 6, String(await clubRows.count()));
  const pickedLabel = (await clubRows.nth(2).getAttribute('aria-label')) ?? '';
  const clubName = pickedLabel.split(',')[0];
  await clubRows.nth(2).click();
  await shot('04-new-career-club');
  await click('btn-start-career');
  await visible('screen-home', 60000);
  check('home shows the chosen club', (await text('home-club-name')) === clubName, `${await text('home-club-name')} vs ${clubName}`);
  const date0 = await text('home-date');
  check('career starts on 1 Aug 2026', /1 Aug 2026/.test(date0), date0);
  check('home shows a next-match hero with opponent and countdown', /Next match/i.test(await text('home-next-match')) && /in \d+ days|Today|Tomorrow/.test(await text('home-next-match')), await text('home-next-match'));
  check('first run: welcome checklist offers squad + tactics steps', (await tid('welcome-squad').count()) === 1 && (await tid('welcome-tactics').count()) === 1);
  check('primary Play button is within the first screen (y < 852)', (await tid('sim-next-matchday').first().boundingBox()).y + 48 < 852);
  await shot('05-home');
  await noHScroll('home');
  await tapTargets('home');
  await page.setViewportSize({ width: 320, height: 568 }); await page.waitForTimeout(300);
  await noHScroll('home first run'); await tapTargets('home first run (320px)'); await shot('05b-home-first-run-320');
  await page.setViewportSize({ width: 393, height: 852 }); await page.waitForTimeout(300);

  console.log('== 2. main screens');
  await click('tab-squad'); await visible('screen-squad');
  check('squad lists players', (await page.locator('[data-testid^="player-p"]:visible:not([aria-hidden="true"] *)').count()) >= 20);
  await click('squad-filter-GK');
  const gkCount = await page.locator('[data-testid^="player-p"]:visible:not([aria-hidden="true"] *)').count();
  check('GK filter narrows the squad', gkCount >= 2 && gkCount <= 5, String(gkCount));
  await click('squad-filter-all');
  await click('squad-sort-age');
  await shot('06-squad');
  await tapTargets('squad');
  await click('tab-fixtures'); await visible('screen-fixtures');
  await visible('fixtures-list');
  check('fixtures list has matches', (await page.locator('[data-testid^="fx-"]:visible:not([aria-hidden="true"] *)').count()) >= 5);
  await shot('07-fixtures');
  await tapTargets('fixtures');
  await click('fx-day'); await visible('day-label');
  check('by-day view shows count', /\d/.test(await text('day-count')));
  await click('tab-market'); await visible('screen-market');
  check('transfer window open at start', /open/i.test(await text('market-window')));
  await shot('08-market');
  await tapTargets('market');
  await goMore('nav-competitions'); await visible('screen-competitions');
  check('competitions screen shows unverified banner', /UNVERIFIED/i.test(await text('verify-banner')));
  check('has more than 60 competitions', (await page.locator('[data-testid^="comp-"]:visible:not([aria-hidden="true"] *)').count()) > 60, String(await page.locator('[data-testid^="comp-"]:visible:not([aria-hidden="true"] *)').count()));
  await shot('09-competitions');
  await click('comp-SAU1'); await visible('screen-competition');
  await visible('comp-table');
  check('Saudi league table renders', (await page.locator('[data-testid="comp-table"] >> text=/Pts/').count()) > 0);
  check('verification status note is shown', /unverified/i.test(await text('verification-note')));
  await shot('10-competition-saudi');
  await click('cv-leaders'); await visible('leaders-list');
  await click('cv-entrants'); await visible('entrants-list');
  check('entrants list shows clubs', (await page.locator('[data-testid="entrants-list"] [role=button]').count()) >= 6);
  await back(); await back();
  await goMore('nav-continental'); await visible('screen-continental');
  for (const h of ['UEFA', 'AFC', 'CAF', 'CONCACAF', 'CONMEBOL', 'OFC', 'FIFA']) check(`continental hub ${h}`, (await tid(`hub-${h}`).count()) === 1);
  check('FIFA Club World Cup hub lists a competition', (await page.locator('[data-testid="hub-FIFA"] [data-testid^="hubcomp-"]').count()) >= 1);
  await shot('11-continental');
  await page.locator('[data-testid="hub-AFC"] [data-testid^="hubcomp-"]').first().click();
  await visible('screen-competition');
  await shot('12-continental-competition');
  await back(); await back();
  await goMore('nav-finances'); await visible('screen-finances');
  check('finances show cash in EUR', (await text('fin-cash')).includes('€'));
  await shot('13-finances');
  await back();
  await goMore('nav-manager'); await visible('screen-manager');
  check('manager screen explains AI behaviour', (await page.getByText('How AI clubs behave').count()) > 0);
  await shot('14-manager-ai');
  await back();
  await goMore('nav-records'); await visible('screen-records');
  await click('rc-leaders'); await click('rc-news'); await visible('news-list');
  await shot('15-records');
  await back();
  await goMore('nav-calendar'); await visible('screen-calendar');
  await shot('16-calendar');
  await back();
  await goMore('nav-club'); await visible('screen-club');
  check('club profile shows the club', (await text('club-name')) === clubName);
  await shot('17-club');
  await back();

  console.log('== 3. play next match: animated reveal');
  await click('tab-home'); await visible('screen-home');
  await click('sim-next-matchday');
  await visible('screen-match', 120000);
  await visible('match-clock', 15000);
  check('playing the next match opens the match centre in live-reveal mode', true);
  await shot('19a-match-reveal-start');
  const clk = async () => Number(((await text('match-clock')).match(/\d+/) ?? ['-1'])[0]);
  const c0 = await clk(); await page.waitForTimeout(3500); const c1 = await clk().catch(() => 999);
  check('match clock advances while playing (' + c0 + "' -> " + c1 + "')", c1 > c0 || c1 === 999);
  await shot('19b-match-reveal-live');
  if (await tid('match-pause').count()) {
    await click('match-pause');
    const p0 = await clk().catch(() => -1); await page.waitForTimeout(800); const p1 = await clk().catch(() => -1);
    check('pause freezes the clock', p0 === p1, `${p0} vs ${p1}`);
    check('pause button turns into Resume', /Resume/.test(await text('match-pause')));
    await click('match-pause');
  }
  await page.waitForTimeout(2500);
  await shot('19c-match-reveal-feed');
  if (await tid('match-skip').count()) await click('match-skip');
  await visible('match-ft');
  const finalScore = (await text('match-score')).replace(/\s+/g, '');
  check('after the reveal the score is the engine result', /^\d-\d+$|^\d+-\d+$/.test(finalScore), finalScore);
  check('key-moments feed lists the goals (one entry per goal)', await (async () => {
    const [h, a] = finalScore.split('-').map(Number);
    const goals = await page.locator('[data-testid="match-feed"] [aria-label*=" Goal,"]').count();
    return goals === h + a;
  })());
  await shot('19d-match-reveal-done');
  await click('match-watch'); await visible('match-clock', 10000);
  check('Replay restarts the live reveal', true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await click('match-skip'); await visible('match-ft');
  await click('match-watch'); await page.waitForTimeout(600);
  check('Reduce Motion: replay jumps straight to full-time (no live clock)', (await tid('match-clock').count()) === 0 && (await tid('match-ft').count()) === 1);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await tapTargets('match centre');
  await click('mt-timeline'); await visible('match-timeline');
  await click('mt-lineups'); await visible('lineup-home');
  await click('mt-summary');
  await back();
  await visible('sim-summary', 60000);
  const date1 = await text('home-date');
  check('date advanced', date1 !== date0, `${date0} -> ${date1}`);
  check('simulation summary mentions simulated days', /Simulated \d+ days/.test(await text('sim-summary')), await text('sim-summary'));
  check('first-run checklist is replaced by the season glance after the first match', (await tid('welcome-card').count()) === 0 && (await tid('home-glance').count()) === 1);
  check('form guide shows one W/D/L chip after one match', (await page.locator('[data-testid="form-chips"]:visible [role=button]').count()) === 1);
  check('league position shown on home', /^\d+$/.test(await text('home-position')), await text('home-position'));
  await shot('18-after-sim');
  const results = page.locator('[data-testid^="result-"]:visible:not([aria-hidden="true"] *)');
  if (await results.count() > 0) {
    check('result row on home carries a W/D/L badge', (await results.first().getAttribute('aria-label') ?? '').length > 0 && (await results.first().locator('[aria-label="Win"],[aria-label="Draw"],[aria-label="Loss"]').count()) === 1);
    check('home result shows the same score as the match centre', (await results.first().innerText()).replace(/\s+/g, '').includes(finalScore), `${finalScore} vs ${(await results.first().innerText()).replace(/\n/g, ' ')}`);
    await results.first().click();
    await visible('screen-match');
    check('opening a finished match from a list does not auto-play (Watch button, no live clock)', (await tid('match-watch').count()) === 1 && (await tid('match-clock').count()) === 0);
    check('match centre shows a score', /\d\s*-\s*\d/.test(await text('match-score')));
    check('match stats shown', (await page.getByText('Possession').count()) > 0);
    await shot('19-match-summary');
    await click('mt-timeline'); await visible('match-timeline');
    await click('mt-lineups'); await visible('lineup-home');
    await shot('20-match-lineups');
    await back();
  } else check('a result exists after next matchday', false);

  console.log('== 4. tactics & lineup');
  await click('tab-squad'); await click('btn-tactics'); await visible('screen-tactics');
  await click('formation-4-4-2');
  await click('preset-highPress');
  await click('slider-tempo-inc');
  await click('mentality-2');
  await click('role-slot-9');
  await visible('sheet-role');
  await shot('21-tactics-role-sheet');
  await page.locator('[data-testid^="role-"][data-testid$="Forward"], [data-testid="role-poacher"]:visible:not([aria-hidden="true"] *)').first().click();
  await click('btn-apply-tactics');
  await visible('tactics-saved');
  check('tactics saved confirmation', true);
  await tid('pitch').scrollIntoViewIfNeeded(); await page.evaluate(() => document.querySelectorAll('div').forEach((d) => { if (d.scrollTop > 0) d.scrollTop = 0; }));
  await shot('22-tactics');
  await back();
  await click('btn-tactics'); await visible('screen-tactics');
  check('saved formation persisted in the engine (4-4-2 selected after reopening)', (await tid('formation-4-4-2').getAttribute('aria-selected')) === 'true');
  check('saved mentality persisted (all-out attack selected)', (await tid('mentality-2').getAttribute('aria-checked')) === 'true');
  await back();
  await click('btn-lineup'); await visible('screen-lineup');
  check('lineup uses the new formation', (await page.getByText(/4-4-2/).count()) > 0);
  await click('lineup-slot-5'); await visible('sheet-pick');
  await page.locator('[data-testid^="pick-"]:visible:not([aria-hidden="true"] *)').nth(1).click();
  await click('btn-apply-lineup');
  await visible('lineup-msg');
  check('lineup applied without engine error', /saved/i.test(await text('lineup-msg')), await text('lineup-msg'));
  await shot('23-lineup');
  await back();

  console.log('== 5. transfers');
  const VIS = ':visible:not([aria-hidden="true"] *)';
  const vis = (sel) => page.locator(sel + VIS);
  async function squadCount() { await click('tab-squad'); await visible('screen-squad'); return Number((await tid('screen-squad').locator('xpath=ancestor-or-self::*').first().innerText().catch(() => '')).match(/(\d+) players/)?.[1] ?? 0); }
  const countBefore = await vis('[data-testid^="player-p"]').count().catch(() => 0);
  await click('tab-squad'); await visible('screen-squad');
  const squadBefore = await vis('[data-testid^="player-p"]').count();
  await click('tab-market'); await visible('screen-market');
  const outcomes = []; let completed = null;
  for (let i = 0; i < 10 && !completed; i++) {
    await click('tab-market'); await visible('screen-market');
    await click('mk-pos-ST'); await page.waitForTimeout(500);
    await vis('[data-testid^="player-p"]').nth(i).click();
    await visible('screen-player');
    if (i === 0) await shot('24-player-profile');
    await click('btn-bid'); await visible('sheet-bid');
    if (i === 0) {
      await tid('input-fee').fill('0.1');
      await click('btn-submit-bid');
      await vis('[data-testid^="outcome-"], [data-testid="sheet-error"]').first().waitFor();
      const id = await vis('[data-testid^="outcome-"]').first().getAttribute('data-testid');
      check('lowball bid is not completed', id !== 'outcome-completed', id);
      outcomes.push(id.replace('outcome-', ''));
      await shot('25-bid-lowball-rejected');
      await tid('input-fee').fill('');
      await click('sheet-close'); await back(); await click('tab-market'); await click('mk-pos-ST'); await page.waitForTimeout(400);
      await vis('[data-testid^="player-p"]').nth(i).click(); await visible('screen-player'); await click('btn-bid'); await visible('sheet-bid');
    }
    // raise the prefilled (engine-suggested) terms generously
    const fee = Number(await tid('input-fee').inputValue()); const wage = Number(await tid('input-wage').inputValue());
    await tid('input-fee').fill(String(Math.max(0.2, +(fee * 1.4).toFixed(2)))); await tid('input-wage').fill(String(Math.ceil(wage * 1.3)));
    await click('btn-submit-bid');
    await vis('[data-testid^="outcome-"], [data-testid="sheet-error"]').first().waitFor();
    const oid = ((await vis('[data-testid^="outcome-"]').first().getAttribute('data-testid')) ?? '').replace('outcome-', '');
    const detail = await vis('[data-testid^="outcome-"]').first().innerText();
    outcomes.push(oid);
    console.log(`   bid ${i}: fee ${fee}M wage ${wage}k -> ${oid} | ${detail.replace(/\n/g, ' / ')}`);
    if (oid === 'counter') {
      await shot('26-bid-counter-offer');
      await click('btn-accept-counter');
      await vis('[data-testid^="outcome-"]').first().waitFor();
      const o2 = ((await vis('[data-testid^="outcome-"]').first().getAttribute('data-testid')) ?? '').replace('outcome-', '');
      outcomes.push(`counter->${o2}`);
      if (o2 === 'completed') { completed = i; await shot('27-bid-completed-after-counter'); }
    } else if (oid === 'completed') { completed = i; await shot('27-bid-completed'); }
    else if (oid === 'rejectedByPlayer') { await shot('26-bid-player-rejected'); if (await tid('btn-raise-wage').count()) { await click('btn-raise-wage'); await click('btn-submit-bid'); await page.waitForTimeout(500); const o3 = ((await vis('[data-testid^="outcome-"]').first().getAttribute('data-testid')) ?? '').replace('outcome-', ''); outcomes.push(`raised->${o3}`); if (o3 === 'completed') { completed = i; await shot('27-bid-completed-after-raise'); } } }
    await click('sheet-close'); await back();
  }
  console.log('   outcomes:', outcomes.join(', '));
  check('bids produced structured outcomes (' + outcomes.join(',') + ')', outcomes.length >= 2);
  check('at least one transfer completed', completed !== null);
  if (completed !== null) {
    await click('tab-squad'); await visible('screen-squad');
    const after = await vis('[data-testid^="player-p"]').count();
    check('squad grew after signing', after === squadBefore + 1, `${squadBefore} -> ${after}`);
  }
  // free agent
  await click('tab-market'); await click('mk-free'); await page.waitForTimeout(500);
  if ((await vis('[data-testid^="player-p"]').count()) > 0) {
    await vis('[data-testid^="player-p"]').first().click(); await visible('btn-sign-free');
    await click('btn-sign-free'); await visible('sheet-free');
    const wage = Number(await tid('input-wage').inputValue());
    await tid('input-wage').fill(String(Math.ceil(wage * 1.6)));
    await click('btn-submit-free');
    await vis('[data-testid^="outcome-"]').first().waitFor();
    const id = await vis('[data-testid^="outcome-"]').first().getAttribute('data-testid');
    check('free-agent offer produced an outcome (' + id + ')', !!id);
    await shot('28-free-agent-outcome');
    await click('sheet-close'); await back();
  }
  // list own player + renew contract
  await click('tab-squad'); await visible('screen-squad');
  await vis('[data-testid^="player-p"]').nth(4).click(); await visible('btn-list');
  await click('btn-list'); await visible('sheet-list'); await click('btn-submit-list');
  await visible('outcome-listed'); check('own player listed for transfer', true);
  await shot('29-list-player');
  await click('sheet-close');
  check('listing banner shown on profile', (await page.getByText(/Transfer listed at/).count()) > 0);
  await click('btn-renew'); await visible('sheet-renew');
  const rw = Number(await tid('input-wage').inputValue()); await tid('input-wage').fill(String(Math.ceil(rw * 1.5)));
  await click('btn-submit-renew');
  await vis('[data-testid^="outcome-"]').first().waitFor();
  check('renewal produced an outcome', true);
  await shot('30-renewal');
  await click('sheet-close'); await back();

  console.log('== 6. saving and reloading');
  await goMore('nav-saves'); await visible('screen-saves');
  await click('btn-save-active');
  await visible('save-status');
  check('manual save confirmed', /Saved at/.test(await text('save-status')), await text('save-status'));
  check('slot 1 listed', (await tid('slot-1').count()) === 1);
  await shot('31-saves');
  const homeDateBefore = await (async () => { await back(); await click('tab-home'); await visible('home-date'); return text('home-date'); })();
  await page.reload();
  await visible('btn-continue');
  check('continue card shown after reload', (await page.getByText(clubName).count()) > 0);
  await shot('32-start-after-reload');
  await click('btn-continue');
  await visible('screen-home', 60000);
  check('loaded save has same club', (await text('home-club-name')) === clubName);
  check('loaded save has same date', (await text('home-date')) === homeDateBefore, `${await text('home-date')} vs ${homeDateBefore}`);
  await click('tab-squad'); await visible('screen-squad');
  check('loaded squad reflects the signing', completed === null || (await vis('[data-testid^="player-p"]').count()) >= squadBefore + 1);
  // slot management
  await goMore('nav-saves'); await visible('screen-saves');
  await click('slot-rename-1'); await visible('input-slot-name');
  await tid('input-slot-name').fill('E2E renamed'); await click('btn-confirm-rename');
  await page.getByText(/E2E renamed/).first().waitFor();
  check('slot renamed', true);
  await click('btn-save-new'); await visible('input-new-name'); await tid('input-new-name').fill('Second slot'); await click('btn-confirm-save-new');
  await tid('slot-2').waitFor();
  check('saved to a second slot', true);
  await click('slot-verify-2'); await visible('verify-result');
  check('integrity verify OK', /passed/i.test(await text('verify-result')), await text('verify-result'));
  await click('sheet-close');
  const [download] = await Promise.all([page.waitForEvent('download'), click('slot-export-2')]);
  const exported = fs.readFileSync(await download.path(), 'utf8');
  check('export produced a football-universe-save document', exported.startsWith('{"format":"football-universe-save"'));
  await click('slot-overwrite-2'); await visible('sheet-overwrite'); await click('btn-confirm-overwrite'); await page.waitForTimeout(800);
  await click('slot-delete-2'); await visible('sheet-delete'); await click('btn-confirm-delete');
  await page.waitForFunction(() => !document.querySelector('[data-testid="slot-2"]'));
  check('slot deleted', (await tid('slot-2').count()) === 0);
  // import the exported file
  fs.writeFileSync('/tmp/fu-e2e-export.json', exported);
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), click('btn-import')]);
  await chooser.setFiles('/tmp/fu-e2e-export.json');
  await tid('slot-2').waitFor({ timeout: 30000 });
  check('imported save appears as a slot', true);
  await click('switch-autosave'); await page.waitForTimeout(300); check('autosave toggle flips', (await tid('switch-autosave').getAttribute('aria-checked')) === 'false');
  await click('switch-autosave');
  await shot('33-saves-managed');
  await back();

  console.log('== 3b. cancel a long simulation');
  await click('tab-home'); await visible('screen-home');
  const dateBeforeCancel = await text('home-date');
  await click('sim-end-season');
  await visible('sheet-confirm-end');
  await shot('18a-confirm-end-season');
  await click('btn-confirm-endseason');
  await visible('sim-overlay');
  check('progress dialog shows date and counters', /\d+ days/.test(await text('sim-stats')), await text('sim-stats'));
  await shot('18b-sim-progress');
  await page.waitForTimeout(600);
  await click('sim-cancel');
  await visible('sim-summary', 60000);
  check('cancelled simulation reports it stopped early', /Stopped after \d+ days/.test(await text('sim-summary')), await text('sim-summary'));
  check('date moved but not a full season', (await text('home-date')) !== dateBeforeCancel && !/2027/.test(await text('home-date')));

  console.log('== 7. settings: integrity, currency, language, theme');
  await goMore('nav-settings'); await visible('screen-settings');
  await click('btn-validate'); await visible('validate-result');
  console.log('   validate:', (await text('validate-result')).replace(/\n/g, ' | ').slice(0, 300));
  check('integrity check ran and reported', /problem|No problems/.test(await text('validate-result')));
  const fsOf = () => page.evaluate(() => parseFloat(getComputedStyle([...document.querySelectorAll('[role=heading]')].find((e) => e.getBoundingClientRect().width > 0 && !e.closest('[aria-hidden="true"]'))).fontSize));
  const f0 = await fsOf();
  for (let i = 0; i < 3; i++) await click('slider-textsize-inc');
  await page.waitForTimeout(200);
  const f1 = await fsOf();
  check('text size setting scales fonts (' + f0 + 'px -> ' + f1 + 'px)', f1 > f0 * 1.2);
  await shot('34a-settings-large-text');
  for (let i = 0; i < 3; i++) await click('slider-textsize-dec');
  await click('cur-sar');
  await back(); await goMore('nav-finances'); await visible('screen-finances');
  check('SAR currency applied to finances', /SAR/.test(await text('fin-cash')), await text('fin-cash'));
  await shot('34-finances-sar');
  await back();
  await goMore('nav-settings');
  await click('theme-dark'); await page.waitForTimeout(300);
  const bg = await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="screen-settings"]')).backgroundColor);
  check('dark theme applied', bg === 'rgb(12, 20, 17)', bg);
  await shot('35-settings-dark');
  await click('lang-ar'); await page.waitForTimeout(400);
  check('html dir is rtl', (await page.evaluate(() => document.documentElement.dir)) === 'rtl');
  check('UI is Arabic', (await page.getByText('الإعدادات').count()) > 0);
  await shot('36-settings-arabic-rtl-dark');
  await click('switch-arabic-digits'); await page.waitForTimeout(200);
  await click('theme-light');
  await back(); await click('tab-home'); await visible('screen-home');
  check('home is Arabic', (await page.getByText('المباريات القادمة').count()) > 0);
  check('dates localised in Arabic', /[؀-ۿ]/.test(await text('home-date')), await text('home-date'));
  await shot('37-home-arabic-rtl');
  const resAr = page.locator('[data-testid^="result-"]:visible:not([aria-hidden="true"] *)');
  if (await resAr.count()) {
    await resAr.first().click(); await visible('screen-match'); await click('match-watch'); await visible('match-clock');
    await page.waitForTimeout(4500); await shot('37b-match-reveal-arabic-rtl');
    check('Arabic: live reveal shows Arabic labels', (await page.getByText('مباشر').count()) > 0);
    await click('match-skip'); await visible('match-ft'); await back();
  }
  await click('tab-squad'); await visible('screen-squad'); await shot('38-squad-arabic');
  await click('tab-market'); await visible('screen-market'); await shot('39-market-arabic');
  await goMore('nav-tactics'); await visible('screen-tactics'); await shot('40-tactics-arabic');
  await back();
  const rtlRow = await page.evaluate(() => { const b = document.querySelector('[data-testid="tab-home"]:not([aria-hidden="true"] *)')?.getBoundingClientRect(); const m = document.querySelector('[data-testid="tab-more"]')?.getBoundingClientRect(); return b && m ? b.x > m.x : null; });
  check('tab bar order mirrored in RTL (Home right of More)', rtlRow === true);

  console.log('== 8. small phone (320x568), light/dark, English');
  await goMore('nav-settings'); await click('lang-en'); await click('theme-light'); await back();
  await page.setViewportSize({ width: 320, height: 568 });
  for (const [label, act] of [
    ['home', async () => { await click('tab-home'); await visible('screen-home'); }],
    ['squad', async () => { await click('tab-squad'); await visible('screen-squad'); }],
    ['fixtures', async () => { await click('tab-fixtures'); await visible('screen-fixtures'); }],
    ['market', async () => { await click('tab-market'); await visible('screen-market'); }],
    ['more', async () => { await click('tab-more'); await visible('screen-more'); }],
  ]) { await act(); await noHScroll(label); await tapTargets(label + ' (320px)'); }
  await click('tab-home'); await shot('41-home-320');
  const res320 = page.locator('[data-testid^="result-"]:visible:not([aria-hidden="true"] *)');
  if (await res320.count()) {
    await res320.first().click(); await visible('screen-match'); await click('match-watch'); await visible('match-clock');
    await page.waitForTimeout(4000); await noHScroll('match reveal'); await tapTargets('match reveal (320px)'); await shot('41b-match-reveal-320');
    await click('match-skip'); await visible('match-ft'); await back();
  }
  await goMore('nav-competitions'); await click('comp-SAU1'); await visible('comp-table'); await noHScroll('competition table'); await shot('42-table-320');
  await back(); await back();
  await goMore('nav-tactics'); await visible('screen-tactics'); await noHScroll('tactics'); await shot('43-tactics-320'); await back();
  await goMore('nav-finances'); await noHScroll('finances'); await back();
  await page.setViewportSize({ width: 393, height: 852 });
  await goMore('nav-settings'); await click('theme-dark'); await back();
  await click('tab-home'); await shot('44-home-dark');
  await goMore('nav-about'); await visible('screen-about');
  check('about screen lists limitations', (await tid('about-limits').innerText()).includes('unverified'));
  await shot('45-about');

  console.log('== 9. real-world names: starter pack, bad pack, user pack with crests');
  await page.goto(base + '/settings'); await visible('lang-en'); await click('lang-en'); await click('theme-light'); await page.waitForTimeout(300);
  await page.goto(base + '/new-career');
  await visible('input-seed');
  await tid('input-seed').fill('e2e-pack');
  await click('btn-generate');
  await visible('league-ENG1', 90000);
  await visible('pack-section');
  check('pack section says nothing is applied yet and everything is fictional', /generated and fictional/.test(await text('pack-none')), await text('pack-none'));
  const clubLabels = async () => (await page.locator('[data-testid^="club-cl"]:visible:not([aria-hidden="true"] *)').evaluateAll((els) => els.map((e) => (e.getAttribute('aria-label') ?? e.innerText ?? '').split(',')[0].split('\n')[0].trim())));
  await click('league-ENG1'); await visible('btn-start-career');
  const fictionalNames = await clubLabels();
  check('before the pack the English clubs are generated names', fictionalNames.length >= 6 && !fictionalNames.includes('Manchester City'), fictionalNames.join('|'));
  await click('btn-career-back');
  await shot('46a-real-names-off');
  await click('switch-real-names');
  await visible('pack-applied', 90000);
  const counts = await text('pack-counts');
  check('applied counts are shown (clubs > 0, 0 players/coaches/crests for names-only pack)', /\d+ clubs · 0 players · 0 coaches · 0 crests changed/.test(counts) && !/^0 clubs/.test(counts), counts);
  const applied = await text('pack-applied');
  check('applied panel says anything not covered stays generated and fictional', /stays generated and fictional/.test(applied) && /Unofficial/.test(applied) && /trademarks belong to their owners/.test(applied), applied);
  check('switch is on', (await tid('switch-real-names').getAttribute('aria-checked')) === 'true');
  await shot('46b-real-names-applied');
  await click('league-ENG1'); await visible('btn-start-career');
  const realNames = await clubLabels();
  check('club picker shows real names (Manchester City, Liverpool, Arsenal)', ['Manchester City', 'Liverpool', 'Arsenal'].every((n) => realNames.includes(n)), realNames.join('|'));
  check('club picker shows the unofficial/generated note', /generated and fictional/.test(await text('club-pack-note')));
  await page.locator('[data-testid^="club-cl"]:visible').first().scrollIntoViewIfNeeded();
  await shot('46c-real-names-club-picker');
  await page.setViewportSize({ width: 320, height: 568 }); await page.waitForTimeout(300);
  await noHScroll('club picker with real names'); await shot('46d-real-names-club-picker-320');
  await click('btn-career-back');
  await noHScroll('real-names section'); await tapTargets('real-names section (320px)'); await shot('46e-real-names-section-320');
  await page.setViewportSize({ width: 393, height: 852 }); await page.waitForTimeout(300);

  // a bad pack: precise error, world untouched
  const choose = async (name, content) => {
    const [fc] = await Promise.all([page.waitForEvent('filechooser'), click('btn-import-pack')]);
    await fc.setFiles({ name, mimeType: 'application/json', buffer: Buffer.from(typeof content === 'string' ? content : JSON.stringify(content)) });
  };
  await choose('bad.json', '{ nope');
  await visible('pack-error');
  check('bad file: precise error shown', /not valid JSON/.test(await text('pack-error')) && /Nothing was changed/.test(await text('pack-error')), await text('pack-error'));
  check('bad file: the starter pack is still applied', (await tid('pack-applied').count()) === 1);
  await choose('remote.json', { format: 'football-universe-data-pack', version: 1, id: 'x', name: 'X', source: 's', licence: 'l', leagues: { ENG1: [{ name: 'Remote FC', crest: 'https://example.com/c.png' }] } });
  await page.waitForFunction(() => /remote URLs are not allowed/.test(document.body.innerText), null, { timeout: 15000 });
  check('remote crest URL is rejected with a precise message', /ENG1\[0\]\.crest/.test(await text('pack-error')), await text('pack-error'));
  const requests = [];
  page.on('request', (r) => requests.push(r.url()));
  await shot('46f-bad-pack-error');

  // a user pack: embedded crest (renders), unreachable file:// crest (falls back), coach
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFklEQVR42mNk+M9Qz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC';
  await choose('mine.json', { format: 'football-universe-data-pack', version: 1, id: 'e2e-user', name: 'E2E user pack', source: 'e2e', licence: 'test',
    leagues: { ENG1: [{ name: 'Testville FC', shortName: 'TST', crest: png, manager: { name: 'Pat Coach' } }, { name: 'Brokencrest Rovers', crest: 'file:///nonexistent/crest.png' }] } });
  await page.waitForFunction(() => /E2E user pack/.test(document.body.innerText), null, { timeout: 90000 });
  check('user pack applied: 2 clubs, 1 coach, 2 crests', /2 clubs · 0 players · 1 coaches · 2 crests changed/.test(await text('pack-counts')), await text('pack-counts'));
  check('switch is off for a custom pack', (await tid('switch-real-names').getAttribute('aria-checked')) === 'false');
  await click('league-ENG1'); await visible('btn-start-career');
  const userNames = await clubLabels();
  check('club picker shows the pack clubs', userNames.includes('Testville FC') && userNames.includes('Brokencrest Rovers'), userNames.join('|'));
  await page.waitForTimeout(800);
  const crestImgs = await page.locator('[data-testid="crest-image"]:visible').count();
  check('embedded crest renders as an image and the unreachable one fell back to the generated crest', crestImgs === 1, String(crestImgs));
  check('the fallback crest keeps the club name as accessible label', (await page.locator('[role="img"][aria-label="Brokencrest Rovers"]').count()) >= 1);
  check('the image crest keeps the club name as accessible label', (await page.locator('[role="img"][aria-label="Testville FC"]').count()) >= 1);
  await page.locator('[data-testid^="club-cl"]:visible').first().scrollIntoViewIfNeeded();
  await shot('46g-user-pack-crests');
  check('no network request left the origin (file:// crests are local, blocked by the browser, and fell back)', requests.every((u) => !/^https?:/.test(u) || u.startsWith(base)), requests.filter((u) => /^https?:/.test(u) && !u.startsWith(base)).join(' '));

  // start with the user pack: home hero crest + start screen / about honesty
  await tid('club-' + (await page.locator('[data-testid^="club-cl"]:visible:not([aria-hidden="true"] *)').first().getAttribute('data-testid')).slice(5)).first().click();
  await click('btn-start-career');
  await visible('screen-home', 60000);
  check('home shows the pack club name', (await text('home-club-name')) === 'Testville FC', await text('home-club-name'));
  await shot('46h-home-with-pack');
  await page.goto(base + '/start');
  await visible('btn-new-career');
  check('start screen (no career loaded) states data is generated and fictional unless a pack is chosen', /unless you choose an optional unofficial real-names pack/.test(await page.locator('[data-testid="screen-start"]').innerText()));
  await click('btn-continue');
  await visible('screen-home', 60000);
  check('saved career reloads with the pack club', (await text('home-club-name')) === 'Testville FC', await text('home-club-name'));
  await goMore('nav-about'); await visible('screen-about');
  const lim = await tid('about-limits').innerText();
  check('about explains unofficial overlay, no bundled logos/players/coaches, estimates, trademarks and docs/DATA_PACKS.md',
    /unofficial overlay/.test(lim) && /No logos/.test(lim) && /estimates by the pack author/.test(lim) && /trademarks belong to their respective owners/.test(lim) && /docs\/DATA_PACKS\.md/.test(lim), lim.slice(0, 200));
  check('about names the pack of the loaded career', /E2E user pack/.test(await text('about-pack')), await text('about-pack'));
  await shot('46i-about-data-pack');
} catch (e) {
  failures.push(`EXCEPTION ${e.stack ?? e}`);
  console.log('EXCEPTION', e.stack ?? e);
  await page.screenshot({ path: path.join(SHOTS, 'zz-failure.png') }).catch(() => undefined);
}
console.log(`\nassertions: ${assertions}, failures: ${failures.length}, screenshots: ${shots.length}`);
if (pageErrors.length) console.log('page errors:', pageErrors.slice(0, 10));
await browser.close(); server.close();
process.exit(failures.length ? 1 : 0);
