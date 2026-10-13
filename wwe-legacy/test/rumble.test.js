import test from 'node:test';
import assert from 'node:assert/strict';
import { RumbleEngine, createRumble, narrateRumble } from '../src/match/rumble.js';
import { generateRoster } from '../src/data/generator.js';
import { Rng } from '../src/core/rng.js';

function field(seed = 1, withPlayer = true) {
  const r = generateRoster(new Rng(seed), { 0: 8, 1: 10, 2: 7, 3: 4, 4: 1 }).slice(0, 30);
  if (withPlayer) r[0] = { ...r[0], id: 'player', name: 'Player One' };
  return r;
}
const sim = (seed, withPlayer, choose) => {
  const e = new RumbleEngine(createRumble({ seed, year: 2025, entrants: field(seed, withPlayer), playerId: withPlayer ? 'player' : null, playerEntry: 12 }), { human: withPlayer });
  let n = 0;
  while (!e.over && n++ < 500) { const d = e.getDecision(); if (!d) break; e.choose(choose(d, n)); }
  return e;
};

test('a Rumble has 30 unique entries, ends with exactly one winner and accounts for every elimination', () => {
  for (let seed = 1; seed <= 12; seed++) {
    const e = sim(seed, true, (d, n) => { const o = d.options.filter((x) => x.enabled !== false); assert.ok(o.length > 0, `no options for ${d.kind}`); return o[n % o.length].id; });
    const s = e.state;
    assert.ok(e.over, 'finishes');
    assert.equal(new Set(s.order).size, 30);
    assert.equal(s.events.filter((x) => x.type === 'rumble_entry').length, 30);
    const elim = s.events.filter((x) => x.type === 'rumble_elimination');
    assert.equal(elim.length, 29);
    assert.equal(Object.values(s.fighters).filter((f) => !f.out).length, 1);
    assert.equal(s.result.winner, Object.values(s.fighters).find((f) => !f.out).id);
    // elimination counters match events
    for (const f of Object.values(s.fighters)) assert.equal(f.elims, elim.filter((x) => x.by === f.id).length);
    assert.equal(s.fighters.player.entry, 12);
    for (const f of Object.values(s.fighters)) assert.ok(f.entered);
  }
});

test('player decisions: 6+ options, danger responses exist, invalid choices rejected', () => {
  const e = new RumbleEngine(createRumble({ seed: 5, year: 2025, entrants: field(5), playerId: 'player', playerEntry: 3 }));
  let sawDanger = false, sawAction = false, min = 99;
  let n = 0;
  while (!e.over && n++ < 400) {
    const d = e.getDecision();
    if (d.kind === 'danger') sawDanger = true; if (d.kind === 'action') { sawAction = true; min = Math.min(min, d.options.filter((o) => o.enabled !== false).length); }
    assert.throws(() => e.choose('nonsense'), /invalid/);
    e.choose(d.options.filter((o) => o.enabled !== false)[0].id);
  }
  assert.ok(sawAction && sawDanger);
  assert.ok(min >= 5, `min action options ${min}`);
  assert.throws(() => e.choose('brawl'), /over/);
});

test('rumble is deterministic and save/resume gives the identical outcome', () => {
  const pick = (d, n) => d.options.filter((o) => o.enabled !== false)[(n * 3) % d.options.filter((o) => o.enabled !== false).length].id;
  const a = sim(9, true, pick), b = sim(9, true, pick);
  assert.equal(JSON.stringify(a.toJSON()), JSON.stringify(b.toJSON()));
  const c = new RumbleEngine(createRumble({ seed: 9, year: 2025, entrants: field(9), playerId: 'player', playerEntry: 12 }));
  let n = 0;
  for (; n < 6 && !c.over; n++) c.choose(pick(c.getDecision(), n + 1));
  const saved = JSON.stringify(c.toJSON());
  const d = RumbleEngine.fromJSON(saved);
  assert.equal(JSON.stringify(d.toJSON()), saved);
  while (!c.over) { n++; c.choose(pick(c.getDecision(), n)); }
  let m = 6; while (!d.over) { m++; d.choose(pick(d.getDecision(), m)); }
  assert.deepEqual(c.result, d.result);
});

test('strength matters: an elite wrestler wins far more often than a prospect, but never always', () => {
  const winRate = (tierPlayer) => {
    let w = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const f = field(seed, true);
      const att = tierPlayer === 'elite' ? 92 : 38;
      f[0] = { ...f[0], attrs: Object.fromEntries(Object.keys(f[0].attrs).map((k) => [k, att])), tier: tierPlayer === 'elite' ? 4 : 0 };
      const e = new RumbleEngine(createRumble({ seed, year: 2025, entrants: f, playerId: 'player', playerEntry: 15 }));
      let n = 0;
      while (!e.over && n++ < 400) {
        const d = e.getDecision();
        const opts = d.options.filter((o) => o.enabled !== false);
        const me = e.state.fighters.player;
        let best;
        if (d.kind === 'danger') best = opts.find((o) => o.id === 'hold') || opts[0];
        else if (d.kind === 'team') best = opts[0];
        else if (me.stamina < me.max * 0.45) best = opts.find((o) => o.id === 'recover') || opts[0];
        else best = opts.filter((o) => o.p).sort((a, b) => b.p - a.p)[0] || opts[0];
        e.choose(best.id);
      }
      if (e.result.winner === 'player') w++;
    }
    return w / 60;
  };
  const elite = winRate('elite'), weak = winRate('weak');
  assert.ok(elite > weak + 0.1, `elite ${elite} vs weak ${weak}`);
  assert.ok(elite < 0.95 && weak < 0.2, `elite ${elite}, weak ${weak}`);
});

test('player summary reports entry number, eliminations and survival from recorded events', () => {
  const e = sim(14, true, (d, n) => { const o = d.options.filter((x) => x.enabled !== false); return (o.find((x) => x.kind === 'elim' || x.id.startsWith('elim')) || o[0]).id; });
  const sum = e.playerSummary();
  assert.equal(sum.entryNumber, 12);
  assert.equal(sum.eliminations, e.state.events.filter((x) => x.type === 'rumble_elimination' && x.by === 'player').length);
  assert.ok(sum.survivalSec > 0);
  assert.equal(sum.won, e.result.winner === 'player');
  for (const ev of e.state.events) assert.equal(typeof narrateRumble(e.state, ev), 'string');
});

test('pure AI rumble (no player) also completes', () => {
  const e = new RumbleEngine(createRumble({ seed: 3, year: 2000, entrants: field(3, false) }), { human: false });
  assert.ok(e.over && e.result.winner);
});

import { AutoGame as Game } from './autogame.js';
import { SaveManager, MemoryAdapter } from '../src/save/save.js';

test('Game: Royal Rumble day offers the Rumble; playing it records rumble_result, feeds achievements and promises, and a win earns a WrestleMania shot', async () => {
  const g = new Game({ saves: new SaveManager(new MemoryAdapter()) });
  const c = g.newCareer({ seed: 21, name: 'Rumble Hopeful', startYear: 2025, background: 'established', style: 'powerhouse', bonus: { power: 10 } });
  for (const k of Object.keys(c.player.attrs)) c.player.attrs[k] = 90;
  c.player.popularity = 80;
  // make a public guarantee first: it must be judged by the result
  c.record({ key: 'g1', category: 'promo', type: 'promise_made', summary: 'I guarantee I will win the 2025 Royal Rumble', importance: 4, data: { promiseId: 'rumble25', kind: 'win_rumble', params: { year: 2025 }, text: 'I will win the 2025 Royal Rumble' } });
  // advance to the Rumble date
  let guard = 0;
  while (!g.rumbleAvailable() && guard++ < 60) { g.advanceToNextEvent(); if (g.rumbleAvailable()) break; if (c.flags.phase === 'home') { c.advanceDays(1); g._universeTick(); } }
  assert.ok(g.rumbleAvailable(), 'Rumble is on the calendar');
  const info = g.startRumble({ entry: 20 });
  assert.equal(info.entry, 20);
  // save/resume in the middle of the Rumble
  for (let i = 0; i < 4; i++) { const d = g.rumble.getDecision(); g.rumbleChoose(d.options.filter((o) => o.enabled !== false)[0].id); }
  await g.save('slot1');
  const g2 = new Game({ saves: g.saves });
  await g2.load('slot1');
  assert.equal(g2.career.flags.phase, 'rumble');
  assert.equal(JSON.stringify(g2.rumble.toJSON()), JSON.stringify(g.rumble.toJSON()));
  let n = 0;
  while (!g.rumble.over && n++ < 400) {
    const d = g.rumble.getDecision(); const opts = d.options.filter((o) => o.enabled !== false); const me = g.rumble.state.fighters[c.player.id];
    const best = d.kind === 'danger' ? opts.find((o) => o.id === 'hold') : d.kind === 'team' ? opts[0] : me.stamina < me.max * 0.45 ? opts.find((o) => o.id === 'recover') : (opts.filter((o) => o.p).sort((a, b) => b.p - a.p)[0] || opts[0]);
    g.rumbleChoose(best.id);
  }
  const res = g.finishRumble();
  assert.equal(res.entryNumber, 20);
  const ev = c.memory.ledger.ofType('rumble_result')[0];
  assert.equal(ev.data.entryNumber, 20);
  assert.ok(c.achievements.unlocked.rumble_entry);
  const promise = c.memory.world.promises.find((p) => p.kind === 'win_rumble');
  assert.equal(promise.status, res.won ? 'kept' : 'broken');
  assert.equal(c.memory.ledger.ofType(res.won ? 'promise_kept' : 'promise_broken').length, 1);
  assert.equal(c.flags.phase, 'home');
  if (res.won) assert.ok(c.flags.maniaShot);
  assert.equal(c.stats.s.rumble.entries, 1);
});
