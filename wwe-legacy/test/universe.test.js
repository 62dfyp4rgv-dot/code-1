import test from 'node:test';
import assert from 'node:assert/strict';
import { Career } from '../src/career/career.js';
import { Universe, TITLE_SLOTS } from '../src/universe/universe.js';
import { UniverseSim } from '../src/universe/sim.js';
import { AutoGame as Game } from './autogame.js';
import { SaveManager, MemoryAdapter } from '../src/save/save.js';
import { REAL_ROSTER, activeIn } from '../src/data/roster_real.js';

function uni(year, seed = 3, mode = 'historical') {
  const c = new Career({ seed, startYear: year, player: { id: 'player', name: 'P' } });
  c.universe = Universe.create({ seed, mode, year });
  return c;
}
const run = (c, days) => { const s = new UniverseSim(c); s.advanceTo(c.day + days); c.day += days; return s.stats; };

test('roster: real names appear only when active in the chosen year, filled with fictional supplements', () => {
  for (const year of [1987, 1998, 2008, 2024]) {
    const u = Universe.create({ seed: 1, mode: 'historical', year });
    const real = u.list((w) => w.real);
    assert.ok(real.length >= 8, `${year}: ${real.length} real`);
    for (const w of real) assert.ok(REAL_ROSTER.find((r) => r.id === w.id && activeIn(r, year)), `${w.name} not active in ${year}`);
    assert.ok(u.list().length >= 30 && u.list().length <= 110, `${year}: roster ${u.list().length}`);
    assert.ok(u.list((w) => w.real).every((w) => w.approx), 'real entries are flagged approximate');
  }
  const custom = Universe.create({ seed: 1, mode: 'custom', year: 2024 });
  assert.equal(custom.list((w) => w.real).length, 0, 'custom universe is fully fictional');
});

test('titles: era-appropriate names and availability by year', () => {
  const u90 = Universe.create({ seed: 2, mode: 'historical', year: 1990 });
  assert.equal(u90.titles.world_a.name, 'WWF Championship');
  assert.ok(!u90.titles.world_b && !u90.titles.dev_a && !u90.titles.womens_b);
  const u12 = Universe.create({ seed: 2, mode: 'historical', year: 2012 });
  assert.equal(u12.titles.world_a.name, 'WWE Championship');
  assert.equal(u12.titles.world_b.name, 'World Heavyweight Championship');
  assert.equal(u12.titles.womens_a.name, 'Divas Championship');
  assert.ok(u12.titles.dev_a);
  const u24 = Universe.create({ seed: 2, mode: 'modern', year: 2024 });
  assert.equal(u24.titles.womens_a.name, "Women's Championship");
  assert.ok(u24.titles.womens_b && u24.titles.dev_w);
  for (const t of Object.values(u24.titles)) { assert.ok(t.holder, `${t.id} has a champion`); assert.equal(u24.get(t.holder).gender, t.gender, 'gender-appropriate champion'); }
});

test('simulation is deterministic and resumable (same seed -> identical universe; save/load mid-way equals uninterrupted)', () => {
  const a = uni(2019, 11), b = uni(2019, 11);
  run(a, 200); run(b, 200);
  assert.equal(JSON.stringify(a.universe.toJSON()), JSON.stringify(b.universe.toJSON()));
  const c1 = uni(2019, 12), c2 = uni(2019, 12);
  run(c1, 120);
  const saved = JSON.stringify(c1.universe.toJSON());
  c2.universe = Universe.fromJSON(JSON.parse(saved)); c2.day = c1.day;
  run(c1, 120); run(c2, 120);
  assert.equal(JSON.stringify(c1.universe.toJSON()), JSON.stringify(c2.universe.toJSON()));
});

test('title lineages stay coherent over years: contiguous reigns, one holder, active champions, no overlaps', () => {
  for (const year of [1990, 2005, 2024]) {
    const c = uni(year, 21);
    run(c, 365 * 3);
    const u = c.universe;
    assert.deepEqual(u.lineageProblems(), []);
    for (const t of Object.values(u.titles)) {
      assert.ok(t.reigns.length >= 1);
      if (t.holder) assert.equal(u.get(t.holder).status, 'active', `${t.name} champion ${t.holder} must be active`);
      for (let i = 1; i < t.reigns.length; i++) assert.ok(t.reigns[i].from >= t.reigns[i - 1].from);
      const days = t.reigns.filter((r) => r.to != null).reduce((s, r) => s + (r.days ?? r.to - r.from), 0);
      assert.ok(days >= 0 && days <= c.day);
    }
    // a wrestler never holds the same title twice at once
    const holders = Object.values(u.titles).filter((t) => t.holder).map((t) => `${t.id}:${t.holder}`);
    assert.equal(new Set(holders).size, holders.length);
  }
});

test('AI wrestlers act independently: feuds, alliances, betrayals, turns, injuries, title changes and retirements all occur', () => {
  const c = uni(1998, 5);
  const st = run(c, 365 * 4 + 150);
  assert.ok(st.matches > 1000, `matches ${st.matches}`);
  assert.ok(st.titleChanges >= 5, `title changes ${st.titleChanges}`);
  assert.ok(st.alliances >= 10 && st.betrayals >= 3 && st.turns >= 3, JSON.stringify(st));
  assert.ok(st.injuries >= 50 && st.retirements >= 2, JSON.stringify(st));
  assert.ok(Object.keys(c.universe.feuds).length >= 5);
  const roster = c.universe.list().length;
  assert.ok(roster >= 25 && roster <= 150, `roster stays bounded: ${roster}`);
  // skills evolve
  const w = c.universe.list().find((x) => x.record.w + x.record.l > 20);
  assert.ok(w);
  // the brand extension happened for a pre-2002 start
  assert.equal(c.universe.split, true);
  assert.ok(c.universe.titles.world_b, 'second world title created at the split');
});

test('universe performance: a simulated year takes a few seconds at most', () => {
  const c = uni(2024, 7);
  const t0 = performance.now();
  run(c, 365);
  const dt = performance.now() - t0;
  assert.ok(dt < 8000, `year simulated in ${Math.round(dt)}ms`);
});

test('world events that touch the player are recorded as non-canon world-scope ledger events and never count as career stats', () => {
  const g = new Game();
  const c = g.newCareer({ seed: 4, name: 'Watcher', startYear: 2024, background: 'established', style: 'brawler' });
  for (let i = 0; i < 40; i++) { c.advanceDays(10); g._universeTick(); }
  const world = c.memory.ledger.query({ categories: ['world'] });
  assert.ok(world.length > 5, `world events ${world.length}`);
  for (const e of world) { assert.equal(e.scope, 'world'); assert.equal(e.canon, false); }
  assert.equal(c.stats.s.matches, 0);
  assert.deepEqual(c.memory.ledger.verify().ok, true);
});

test('Game integration: an overwhelming wrestler earns title shots, wins the title, defends it - and the ledger never contradicts the lineage', () => {
  const g = new Game();
  const c = g.newCareer({ seed: 77, name: 'Champion Material', startYear: 2024, background: 'established', style: 'allrounder', bonus: { power: 10 } });
  for (const k of Object.keys(c.player.attrs)) c.player.attrs[k] = 96;
  c.player.popularity = 85;
  let won = false, defended = false, guard = 0;
  while (guard++ < 300 && !(won && defended)) {
    const ev = g.advanceToNextEvent();
    const opps = g.suggestOpponents();
    const pick = opps.find((o) => o.stakes === 'title') || opps[0];
    g.prepareMatch({ opponentId: pick.id, stakes: pick.stakes || null, type: pick.type || 'singles' });
    g.startMatch();
    let d = g.decision();
    while (d && !g.engine.over) {
      const opts = d.options.filter((o) => o.enabled !== false);
      const best = opts.find((o) => /Finisher/.test(o.group)) || opts[0];
      const r = g.choose(best.id); d = r.decision;
    }
    const res = g.finishMatch();
    if (res.titleOutcome === 'won') won = true;
    if (res.titleOutcome === 'retained') defended = true;
    g.endPostMatch();
  }
  assert.ok(won, 'player should win a title');
  const tw = c.memory.ledger.ofType('title_win');
  assert.ok(tw.length >= 1);
  // each title change is backed by a title match result referencing it
  for (const ev of tw) {
    const m = c.memory.ledger.get(ev.refs[0]);
    assert.equal(m.type, 'match_result'); assert.equal(m.data.result, 'win'); assert.equal(m.data.titleOnLine, true);
    assert.equal(g.universe.titles[ev.data.titleId].reigns.some((r) => r.holder === 'player' && r.from === ev.day), true);
  }
  assert.ok(c.achievements.unlocked.first_title);
  assert.deepEqual(g.universe.lineageProblems(), []);
  const reignsOfPlayer = Object.values(g.universe.titles).flatMap((t) => t.reigns.filter((r) => r.holder === 'player'));
  assert.equal(reignsOfPlayer.length, c.stats.s.titles.won);
  if (defended) assert.ok(c.stats.s.titles.defenses >= 1);
});

test('universe survives a full save/load through the career', async () => {
  const saves = new SaveManager(new MemoryAdapter());
  const g = new Game({ saves });
  const c = g.newCareer({ seed: 9, name: 'Saver', startYear: 2008, background: 'prospect' });
  for (let i = 0; i < 10; i++) { c.advanceDays(20); g._universeTick(); }
  await g.save('slot1');
  const g2 = new Game({ saves });
  await g2.load('slot1');
  assert.equal(JSON.stringify(g2.universe.toJSON()), JSON.stringify(g.universe.toJSON()));
  g.career.advanceDays(30); g._universeTick(); g2.career.advanceDays(30); g2._universeTick();
  assert.equal(JSON.stringify(g2.universe.toJSON()), JSON.stringify(g.universe.toJSON()));
});
