// End-to-end UI tests in headless Chromium with iPhone-sized viewports and touch input.
// NOTE: this is Chromium device emulation, NOT iOS Safari/WebKit. See docs/KNOWN_ISSUES.md.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium, newPage, DEVICES } from '../../tools/pw.mjs';
import { createServer } from '../../tools/serve.mjs';

let browser, server, base;
before(async () => {
  server = createServer().listen(0);
  base = `http://localhost:${server.address().port}/index.html`;
  browser = await chromium.launch();
});
after(async () => {
  await browser.close();
  server.close();
});

async function startGame(page, { scenario = 'fault_lines', country = 'DEU' } = {}) {
  await page.goto(base);
  await page.waitForSelector('[data-m="new"]');
  await page.click('[data-m="new"]');
  await page.waitForSelector('[data-sc]');
  await page.click(`[data-sc="${scenario}"]`);
  await page.waitForSelector(`[data-c="${country}"]`).catch(() => {});
  if (await page.$(`[data-c="${country}"]`)) await page.click(`[data-c="${country}"]`);
  else {
    await page.fill('#nq', country);
    await page.waitForSelector(`[data-c="${country}"]`);
    await page.click(`[data-c="${country}"]`);
  }
  await page.click('[data-n="start"]');
  await page.waitForFunction(() => window.__app && window.__app.sim, null, { timeout: 30000 });
  await page.evaluate(() => {
    window.__app.settings.tutorial = false;
    document.querySelector('.coach')?.remove();
  });
}

// Live games can raise decision / peace-offer modals at any time; tests that tap elsewhere dismiss them first.
async function clearModals(page) {
  for (let i = 0; i < 8; i++) {
    const b = page.locator('#overlay [data-opt], #overlay [data-po="0"]').first();
    if ((await b.count()) === 0) return;
    await b.click();
    await page.waitForTimeout(350);
  }
}

test('boot -> menu -> new game wizard -> map with HUD, no console errors', async () => {
  const page = await newPage(browser);
  await startGame(page);
  assert.equal(await page.locator('.chip-country .name').innerText(), 'Germany');
  assert.ok((await page.locator('#tabbar button').count()) === 6);
  assert.ok((await page.locator('.pill').count()) >= 4);
  await page.waitForTimeout(300);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
test('every management screen renders content without errors', async () => {
  const page = await newPage(browser);
  await startGame(page);
  for (const id of [
    'nation',
    'economy',
    'diplomacy',
    'military',
    'research',
    'intel',
    'inbox',
    'stats',
    'objectives',
    'more',
    'settings',
    'saves',
    'help',
  ]) {
    await page.evaluate((i) => window.__app.openSheet(i), id);
    await page.waitForTimeout(120);
    const body = await page.locator('#sheetBody').innerText();
    assert.ok(body.length > 30, `${id} has content`);
    assert.ok(!/failed to render/.test(body), `${id} rendered`);
  }
  // every sub-tab too
  for (const [id, tabs] of Object.entries({
    nation: ['government', 'policy', 'society'],
    economy: ['overview', 'sectors', 'fiscal', 'trade'],
    diplomacy: ['relations', 'treaties', 'orgs', 'sanctions'],
    military: ['overview', 'forces', 'war', 'build'],
    research: ['queue', 'adopt', 'energy', 'military'],
    stats: ['charts', 'rank', 'world'],
    objectives: ['paths', 'ach'],
    inbox: ['mine', 'world', 'all'],
  }))
    for (const t of tabs) {
      await page.evaluate(
        ([i, tb]) => {
          window.__app.sheetTab[i] = tb;
          window.__app.openSheet(i);
        },
        [id, t],
      );
      await page.waitForTimeout(60);
      const body = await page.locator('#sheetBody').innerText();
      assert.ok(!/failed to render/.test(body), `${id}/${t}`);
      assert.ok(body.length > 15, `${id}/${t} content`);
    }
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
test('touch: tapping the map selects a country and opens its sheet; closing returns to the map', async () => {
  const page = await newPage(browser);
  await startGame(page, { country: 'DEU' });
  const pt = await page.evaluate(() => {
    const a = window.__app,
      g = a.sim.geo,
      c = g.cRegions[g.idOf.FRA][0];
    const [x, y] = a.map.toScreen(g.regions[c].lon, g.regions[c].lat);
    return { x, y };
  });
  await page.evaluate(() => window.__app.map.focusCountry(window.__app.sim.geo.idOf.DEU, 14));
  await page.waitForTimeout(700);
  const pt2 = await page.evaluate(() => {
    const a = window.__app,
      g = a.sim.geo,
      c = g.cRegions[g.idOf.FRA][0];
    const [x, y] = a.map.toScreen(g.regions[c].lon, g.regions[c].lat);
    return { x, y, vh: a.map.vh };
  });
  if (pt2.y > 100 && pt2.y < pt2.vh - 250) {
    await page.touchscreen.tap(pt2.x, pt2.y);
    await page.waitForTimeout(300);
    const t = await page.locator('#sheetHead h2').innerText();
    assert.match(t, /France/);
  }
  await page.evaluate(() => window.__app.selectCountry(window.__app.sim.geo.idOf.POL, true));
  await page.waitForTimeout(250);
  assert.match(await page.locator('#sheetHead h2').innerText(), /Poland/);
  await page.click('[data-act="closeSheet"]');
  await page.waitForTimeout(400);
  assert.ok(!(await page.locator('#sheet.open').count()));
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
test('map gestures: drag pans, wheel/pinch zoom changes scale, double-tap zooms', async () => {
  const page = await newPage(browser);
  await startGame(page);
  const v0 = await page.evaluate(() => ({ ...window.__app.map.view }));
  await page.mouse.move(200, 300);
  await page.mouse.down();
  await page.mouse.move(120, 300, { steps: 6 });
  await page.mouse.up();
  const v1 = await page.evaluate(() => ({ ...window.__app.map.view }));
  assert.ok(Math.abs(v1.tx - v0.tx) > 30, 'dragging pans the map');
  await page.mouse.move(200, 300);
  await page.mouse.wheel(0, -400);
  await page.waitForTimeout(100);
  const v2 = await page.evaluate(() => ({ ...window.__app.map.view }));
  assert.ok(v2.s > v1.s, 'wheel zooms in');
  // two-finger pinch via CDP touch events
  const cdp = await page.context().newCDPSession(page);
  const s0 = await page.evaluate(() => window.__app.map.view.s);
  const tp = (id, x, y) => ({ x, y, id });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [tp(1, 150, 400), tp(2, 240, 400)] });
  for (let i = 1; i <= 8; i++)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [tp(1, 150 - i * 12, 400), tp(2, 240 + i * 12, 400)] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(100);
  const s1 = await page.evaluate(() => window.__app.map.view.s);
  assert.ok(s1 > s0 * 1.3, `pinch zooms (${s0.toFixed(1)} -> ${s1.toFixed(1)})`);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
test('game loop: play advances time at the chosen speed, pauses for decisions, monthly updates do not freeze the page', async () => {
  const page = await newPage(browser);
  await startGame(page);
  await page.evaluate(() => {
    window.__app.setSpeed(2);
    window.__app.play();
  });
  const d0 = await page.evaluate(() => window.__app.sim.state.day);
  await page.waitForTimeout(3000);
  const d1 = await page.evaluate(() => window.__app.sim.state.day);
  assert.ok(d1 - d0 > 15, `time advanced (${d1 - d0} days in 3 s)`);
  await page.evaluate(() => window.__app.pause());
  const d2 = await page.evaluate(() => window.__app.sim.state.day);
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => window.__app.sim.state.day), d2, 'pause stops time');
  // forced decision pauses the game and shows a modal with options
  await page.evaluate(() => {
    const a = window.__app;
    const def = a.sim.eventById.cost_of_living_protests;
    a.play();
    import('/js/sim/events.js').then((m) => m.fire(a.sim, def, a.sim.state.playerId));
  });
  await page.waitForSelector('[data-opt]', { timeout: 5000 });
  assert.equal(await page.evaluate(() => window.__app.paused), true);
  // answer the forced decision (and any further decision the live game raises meanwhile)
  for (let i = 0; i < 6 && (await page.locator('[data-opt]').count()) > 0; i++) {
    await page.click('[data-opt="1"]');
    await page.waitForTimeout(450);
  }
  assert.equal(await page.locator('[data-opt]').count(), 0);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
test('policy slider: previews the political-capital cost and commits on release', async () => {
  const page = await newPage(browser);
  await startGame(page, { country: 'FRA' });
  await page.evaluate(() => {
    window.__app.sheetTab.nation = 'policy';
    window.__app.openSheet('nation', {}, 'full');
  });
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => window.__app.sim.player.gov.pc);
  const key = 'immigration';
  await page.evaluate((k) => {
    const el = document.querySelector(`input[data-key="${k}"]`);
    el.value = 0.9;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, key);
  assert.match(await page.locator(`#sc-p-${key}`).innerText(), /Cost/);
  assert.equal(await page.evaluate(() => window.__app.sim.player.gov.pc), before, 'preview is free');
  await page.evaluate((k) => {
    const el = document.querySelector(`input[data-key="${k}"]`);
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, key);
  await page.waitForTimeout(150);
  assert.ok((await page.evaluate(() => window.__app.sim.player.gov.pc)) < before, 'commit spends capital');
  assert.ok(Math.abs((await page.evaluate(() => window.__app.sim.player.target.immigration)) - 0.9) < 1e-6);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
test('diplomacy flow: open a country, see acceptance odds, propose', async () => {
  const page = await newPage(browser);
  await startGame(page, { country: 'JPN' });
  await page.evaluate(() => {
    const a = window.__app;
    a.sim.player.dip.influence = 100;
    a.openSheet('dipTarget', { id: a.sim.geo.idOf.KOR }, 'full');
  });
  await page.waitForTimeout(300);
  assert.ok((await page.locator('.prob').count()) >= 5, 'acceptance odds are shown');
  const n0 = await page.evaluate(() => window.__app.sim.player.dip.influence);
  await page.click('button[data-act="propose"][data-kind="improve"]');
  await page.waitForTimeout(200);
  assert.ok((await page.evaluate(() => window.__app.sim.player.dip.influence)) < n0, 'influence spent');
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
test('war UI: peace builder shows likelihood and unit orders offer map targets (hot-start scenario)', async () => {
  const page = await newPage(browser);
  await startGame(page, { country: 'UKR' });
  const ok = await page.evaluate(() => {
    const a = window.__app;
    const w = a.sim.state.wars.find((x) => x.active);
    if (!w) return false;
    a.sheetTab.military = 'war';
    a.openSheet('military', { tab: 'war' }, 'full');
    return w.id;
  });
  assert.ok(ok, 'Ukraine starts at war');
  await page.waitForTimeout(300);
  assert.ok((await page.locator('[data-act="stance"]').count()) >= 3, 'stance controls visible');
  await page.click('[data-act="peace"]');
  await page.waitForTimeout(250);
  assert.ok(await page.locator('.prob').count(), 'peace likelihood shown');
  assert.match(await page.locator('#sheetBody').innerText(), /Ceasefire/);
  await page.evaluate(() => {
    const a = window.__app;
    const f = a.sim.forcesOf[a.sim.state.playerId].find((x) => x.branch === 'land');
    a.openSheet('force', { id: f.id }, 'full');
  });
  await page.waitForTimeout(200);
  assert.match(await page.locator('#sheetBody').innerText(), /orders/i);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
test('save, interrupt and recover: autosave on pagehide restores the same game from the menu', async () => {
  const page = await newPage(browser);
  await startGame(page, { country: 'ITA' });
  await page.evaluate(() => {
    window.__app.setSpeed(2);
    window.__app.play();
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.__app.pause());
  const snap = await page.evaluate(async () => {
    const a = window.__app;
    await a.doAutosave();
    return { day: a.sim.state.day, gdp: a.sim.player.econ.gdp, player: a.sim.player.id };
  });
  await page.reload();
  await page.waitForSelector('[data-m="continue"]');
  await page.click('[data-m="continue"]');
  await page.waitForFunction(() => window.__app.sim, null, { timeout: 20000 });
  const back = await page.evaluate(() => ({
    day: window.__app.sim.state.day,
    gdp: window.__app.sim.player.econ.gdp,
    player: window.__app.sim.player.id,
  }));
  assert.deepEqual(back, snap, 'restored state equals saved state');
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
test('accessibility: text size, high contrast, reduced motion and colour-blind palette apply; controls are labelled and touch-sized', async () => {
  const page = await newPage(browser);
  await startGame(page);
  const fs0 = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  await page.evaluate(() => {
    const a = window.__app;
    a.set('textScale', 1.3);
    a.set('highContrast', true);
    a.set('reduceMotion', true);
    a.set('colorBlind', true);
  });
  const st = await page.evaluate(() => ({
    fs: parseFloat(getComputedStyle(document.documentElement).fontSize),
    c: document.documentElement.dataset.contrast,
    r: document.documentElement.dataset.reduce,
    cvd: document.documentElement.dataset.cvd,
  }));
  assert.ok(st.fs > fs0 * 1.25);
  assert.equal(st.c, 'high');
  assert.equal(st.r, '1');
  assert.equal(st.cvd, '1');
  const unlabeled = await page.evaluate(
    () =>
      [...document.querySelectorAll('button,[role=button],input')].filter(
        (b) => b.offsetParent && !(b.getAttribute('aria-label') || b.innerText.trim() || b.title),
      ).length,
  );
  assert.equal(unlabeled, 0, 'all visible controls have an accessible name');
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('#tabbar button, .speedbox button, .iconbtn')]
      .filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width < 38 || r.height < 38;
      })
      .map((b) => b.className),
  );
  assert.deepEqual(small, [], 'primary controls are at least 38px');
  await page.context().close();
});
test('layouts: no horizontal overflow and tab bar visible on all iPhone sizes; sheet fits above the tab bar', async () => {
  for (const [name, dev] of Object.entries(DEVICES)) {
    const page = await newPage(browser, dev);
    await startGame(page);
    await page.evaluate(() => window.__app.openSheet('economy'));
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => {
      const tb = document.getElementById('tabbar').getBoundingClientRect(),
        sh = document.getElementById('sheet').getBoundingClientRect();
      return {
        sw: document.documentElement.scrollWidth,
        iw: innerWidth,
        tbBottom: tb.bottom,
        ih: innerHeight,
        sheetBottom: sh.bottom,
        tbTop: tb.top,
      };
    });
    assert.ok(m.sw <= m.iw + 1, `${name}: no horizontal scroll`);
    assert.ok(m.tbBottom <= m.ih + 1 && m.tbBottom > m.ih - 2, `${name}: tab bar pinned to bottom`);
    assert.ok(m.sheetBottom <= m.tbTop + 2, `${name}: sheet above the tab bar`);
    assert.deepEqual(page.errors, [], name);
    await page.context().close();
  }
});

test('regression: the app shell cannot be scrolled sideways by off-screen (closed) sheets, in every orientation', async () => {
  for (const [name, dev] of Object.entries(DEVICES)) {
    const page = await newPage(browser, dev);
    await startGame(page);
    const r = await page.evaluate(() => {
      const a = document.getElementById('app');
      a.scrollLeft = 120;
      a.scrollTop = 40;
      return { sl: a.scrollLeft, st: a.scrollTop, hud: document.getElementById('hud').getBoundingClientRect().left };
    });
    assert.equal(r.sl, 0, `${name}: #app.scrollLeft stays 0`);
    assert.equal(r.st, 0, `${name}: #app.scrollTop stays 0`);
    assert.ok(r.hud >= 0, `${name}: HUD not shifted off-screen`);
    await page.context().close();
  }
});
test('end of game: final report offers sandbox continuation, which resumes the clock', async () => {
  const page = await newPage(browser);
  await startGame(page, { scenario: 'quiet_decade', country: 'BRA' });
  await page.evaluate(() => {
    const a = window.__app;
    a.sim.endGame('time');
  });
  await page.waitForSelector('[data-e="sandbox"]', { timeout: 5000 });
  assert.match(await page.locator('#overlay').innerText(), /Final report/);
  const d0 = await page.evaluate(() => window.__app.sim.state.day);
  await page.click('[data-e="sandbox"]');
  const ended = await page.evaluate(() => {
    const a = window.__app;
    a.sim.step();
    return !!a.sim.state.ended;
  });
  assert.equal(ended, false, 'sandbox clears the ended flag');
  assert.ok((await page.evaluate(() => window.__app.sim.state.day)) > d0);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
test('saves screen: manual slot saves, lists with metadata, and loads back the same state', async () => {
  const page = await newPage(browser);
  await startGame(page, { country: 'JPN' });
  await page.evaluate(() => {
    window.__app.setSpeed(2);
    window.__app.play();
  });
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.__app.pause());
  await clearModals(page);
  await page.evaluate(() => window.__app.openSheet('saves'));
  await page.waitForTimeout(150);
  await page.click('[data-act="saveslot"][data-slot="manual"]');
  await page.waitForTimeout(800);
  const snap = await page.evaluate(() => ({ day: window.__app.sim.state.day, gdp: window.__app.sim.player.econ.gdp }));
  await page.evaluate(() => {
    window.__app.sim.advanceMonths(2);
  }); // diverge
  await clearModals(page);
  await page.evaluate(() => window.__app.openSheet('saves'));
  await page.waitForTimeout(300);
  const body = await page.locator('#sheetBody').innerText();
  assert.match(body, /JPN/, 'slot lists the country');
  const loadBtn = page.locator('[data-act="loadslot"]').first();
  assert.ok((await loadBtn.count()) >= 1, 'a load button exists');
  await loadBtn.click();
  await page.waitForTimeout(1500);
  const back = await page.evaluate(() => ({ day: window.__app.sim.state.day, gdp: window.__app.sim.player.econ.gdp }));
  assert.deepEqual(back, snap, 'loaded the manual slot state');
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
test('tutorial coach marks step through and can be skipped; new-game search and seed are honoured', async () => {
  const page = await newPage(browser);
  await page.goto(base);
  await page.waitForSelector('[data-m="new"]');
  await page.click('[data-m="new"]');
  await page.waitForSelector('[data-sc]');
  await page.fill('#nq', 'Braz');
  await page.waitForFunction(() => document.querySelectorAll('[data-c]').length === 1, null, { timeout: 5000 });
  assert.equal(await page.locator('[data-c]').count(), 1, 'search narrows the list to one country');
  await page.click('[data-c="BRA"]');
  const shownSeed = +/Seed (\d+)/.exec(await page.locator('#overlay').innerText())[1];
  await page.click('[data-n="start"]');
  await page.waitForFunction(() => window.__app && window.__app.sim, null, { timeout: 30000 });
  assert.equal(await page.evaluate(() => window.__app.sim.state.seed), shownSeed, 'the displayed seed is the one used');
  await page.waitForSelector('.coach', { timeout: 5000 });
  const t1 = await page.locator('.coach b').innerText();
  await page.click('.coach [data-t="next"]');
  const t2 = await page.locator('.coach b').innerText();
  assert.notEqual(t1, t2, 'advances to the next tip');
  await page.click('.coach [data-t="skip"]');
  await page.waitForTimeout(100);
  assert.equal(await page.locator('.coach').count(), 0, 'skip dismisses tips');
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('regression: saving while the monthly update is suspended mid-way loses nothing (snapshot settles first)', async () => {
  const page = await newPage(browser);
  await startGame(page, { scenario: 'quiet_decade', country: 'NOR' });
  const res = await page.evaluate(async () => {
    const { deserialize, serialize } = await import('./js/sim/save.js');
    const a = window.__app,
      sim = a.sim;
    a.pause();
    while (!sim.calendar.isMonthStart(sim.state.day + 1)) sim.step(); // stop the day before a month start
    a.gen = sim.stepGen();
    a.gen.next();
    a.gen.next(); // suspended inside monthlyGen
    const text = a.snapshot('test');
    const copy = deserialize(a.data, text);
    for (let i = 0; i < 70; i++) {
      sim.step();
      copy.step();
    }
    const body = (t) => t.split('\n').slice(2).join('\n');
    return { same: body(serialize(sim, {})) === body(serialize(copy, {})), day: sim.state.day, settled: a.gen === null };
  });
  assert.ok(res.settled, 'snapshot completes the in-flight day');
  assert.ok(res.same, 'resumed game equals the uninterrupted game');
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('peace offer from the AI opens a modal; declining keeps the war, accepting ends it', async () => {
  const page = await newPage(browser);
  await startGame(page, { scenario: 'fault_lines', country: 'UKR' });
  const wid = await page.evaluate(() => {
    const a = window.__app,
      sim = a.sim,
      st = sim.state;
    const w = st.wars.find((x) => (x.active && x.defenders.includes(st.playerId)) || x.attackers.includes(st.playerId));
    const enemy = (w.attackers.includes(st.playerId) ? w.defenders : w.attackers)[0];
    sim.country(st.countries[st.playerId].id).mil.exhaustion = 0.9;
    w.score[w.attackers.includes(enemy) ? 'a' : 'd'] = 60;
    const r = sim.exec({ type: 'proposePeace', actor: enemy, war: w.id, target: st.playerId, terms: [{ kind: 'ceasefire' }] });
    return r.ok && r.offered ? w.id : -1;
  });
  assert.ok(wid >= 0, 'AI offer is parked, not applied');
  await page.waitForSelector('[data-po="0"]', { timeout: 5000 });
  await page.click('[data-po="0"]');
  assert.equal(
    await page.evaluate((id) => window.__app.sim.state.wars.find((w) => w.id === id).active, wid),
    true,
    'declined: war goes on',
  );
  await page.evaluate(() => {
    const sim = window.__app.sim,
      st = sim.state,
      w = st.wars.find((x) => x.active);
    const enemy = (w.attackers.includes(st.playerId) ? w.defenders : w.attackers)[0];
    sim.exec({ type: 'proposePeace', actor: enemy, war: w.id, target: st.playerId, terms: [{ kind: 'ceasefire' }] });
  });
  await page.waitForSelector('[data-po="1"]', { timeout: 5000 });
  await page.click('[data-po="1"]');
  assert.equal(await page.evaluate((id) => window.__app.sim.state.wars.find((w) => w.id === id).active, wid), false, 'accepted: war ends');
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('policy slider: a large (expensive) change asks for confirmation; cancel restores the slider and spends nothing', async () => {
  const page = await newPage(browser);
  await startGame(page, { country: 'FRA' });
  await page.evaluate(() => {
    window.__app.sheetTab.nation = 'policy';
    window.__app.openSheet('nation', {}, 'full');
  });
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => ({ pc: window.__app.sim.player.gov.pc, tax: window.__app.sim.player.target.regulation }));
  await page.evaluate(() => {
    const el = document.querySelector('input[data-key="regulation"]');
    el.value = el.max;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForSelector('[data-pc="0"]', { timeout: 3000 });
  assert.equal(await page.evaluate(() => window.__app.sim.player.gov.pc), before.pc, 'nothing spent before confirming');
  await page.click('[data-pc="0"]');
  await page.waitForTimeout(150);
  assert.deepEqual(
    await page.evaluate(() => ({ pc: window.__app.sim.player.gov.pc, tax: window.__app.sim.player.target.regulation })),
    before,
    'cancel changes nothing',
  );
  await page.waitForSelector('input[data-key="regulation"]');
  await page.evaluate(() => {
    const el = document.querySelector('input[data-key="regulation"]');
    el.value = el.max;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForSelector('[data-pc="1"]');
  await page.click('[data-pc="1"]');
  await page.waitForTimeout(150);
  assert.ok((await page.evaluate(() => window.__app.sim.player.gov.pc)) < before.pc, 'confirmed change spends capital');
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('real taps only: tab bar opens each screen, sheet tabs switch content, close returns to the map', async () => {
  const page = await newPage(browser);
  await startGame(page, { scenario: 'quiet_decade', country: 'FRA' });
  for (const [tab, expect] of [
    ['nation', /Nation|Government|Policy/i],
    ['economy', /Economy/],
    ['diplomacy', /Diplomacy/],
    ['military', /Military/],
  ]) {
    await page.tap(`#tabbar button[data-tab="${tab}"]`);
    await page.waitForSelector('#sheet.open', { timeout: 3000 });
    assert.match(await page.locator('#sheet h2').first().innerText(), expect, `${tab} sheet opened by a real tap`);
    const tabs = page.locator('#sheet [data-sheettab]');
    const n = await tabs.count();
    assert.ok(n >= 2, `${tab} has sheet tabs`);
    const before = await page.locator('#sheetBody').innerText();
    await tabs.nth(1).tap();
    await page.waitForTimeout(250);
    assert.notEqual(await page.locator('#sheetBody').innerText(), before, `${tab}: tapping a sheet tab changes the content`);
    await page.tap('#sheet [data-act="closeSheet"]');
    await page.waitForFunction(() => !document.querySelector('#sheet.open'), null, { timeout: 3000 });
  }
  assert.deepEqual(page.errors, []);
  await page.context().close();
});

test('national projects: the Projects tab lists them, starting one spends political capital and shows progress', async () => {
  const page = await newPage(browser);
  await startGame(page, { scenario: 'quiet_decade', country: 'DEU' });
  await page.evaluate(() => {
    window.__app.sheetTab.nation = 'projects';
    window.__app.openSheet('nation', {}, 'full');
  });
  await page.waitForTimeout(300);
  const pc0 = await page.evaluate(() => window.__app.sim.player.gov.pc);
  await page.locator('#sheetBody [data-cmd*="startProject"]').first().tap();
  await page.waitForTimeout(300);
  assert.ok((await page.evaluate(() => window.__app.sim.player.gov.pc)) < pc0, 'political capital spent');
  assert.equal(await page.evaluate(() => window.__app.sim.player.projects.active.length), 1);
  assert.match(await page.locator('#sheetBody').innerText(), /Progress/);
  assert.deepEqual(page.errors, []);
  await page.context().close();
});
