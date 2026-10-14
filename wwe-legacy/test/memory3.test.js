import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playCareer } from '../tools/careersim.js';
import { memoryLines, hooks } from '../src/story/dialogue.js';
import { h2hCounts, buildPairSummary, validateSummary } from '../src/memory/summaries.js';
import { deliverPromo } from '../src/story/media.js';
import { newCareer } from './helpers2.js';

const played = (seed, strategy = 'smart', years = 2) => playCareer({ years, strategy, seed }).game;

test('"every one was clean" is only said when every win really was clean', () => {
  for (const seed of [11, 21, 42]) {
    const g = played(seed, seed === 21 ? 'weak' : 'smart', 3);
    const c = g.career;
    for (const w of g.universe.list(() => true)) {
      const hs = hooks(c.memory, c.player.id, w.id).filter((h) => h.kind === 'clean_dominance');
      for (const h of hs) assert.ok(h.total >= h.n, 'total wins must be at least the clean wins');
      for (const l of memoryLines(c.memory, c.player.id, w.id, w.name, { speaker: 'player', max: 20 })) {
        const m = /Every one of those (\d+) wins/.exec(l.text);
        if (m) assert.equal(hs[0].total, hs[0].n, `"${l.text}" but ${hs[0].total} wins and ${hs[0].n} clean`);
      }
    }
  }
});

test('head-to-head wins agree on every surface: dialogue hooks, story-so-far, opponent card, rivalry', () => {
  for (const seed of [3, 11, 21]) {
    const g = played(seed, 'smart', 2);
    const c = g.career, me = c.player.id;
    for (const rv of Object.values(c.memory.world.rivalries)) {
      if (rv.a !== me && rv.b !== me) continue;
      const other = rv.a === me ? rv.b : rv.a;
      const hc = h2hCounts(c.memory.ledger, me, other);
      const ih = hooks(c.memory, me, other);
      const iBeat = ih.find((h) => h.kind === 'i_beat_you'), theyBeat = ih.find((h) => h.kind === 'you_beat_me');
      assert.equal(iBeat ? iBeat.n : 0, hc.winsA, `hooks vs summary wins for ${other}`);
      assert.equal(theyBeat ? theyBeat.n : 0, hc.winsB);
      assert.equal(rv.wins[me] || 0, hc.winsA, 'rivalry record must match');
      assert.deepEqual(validateSummary(c.memory, buildPairSummary(c.memory, me, other)), []);
    }
  }
});

test('a newer meeting settles an old grudge obligation', () => {
  const g = played(77, 'average', 3);
  const w = g.career.memory.world;
  const pending = w.obligations.filter((o) => o.status === 'pending' && o.kind === 'grudge_rematch');
  const L = g.career.memory.ledger;
  for (const o of pending) {
    const later = L.query({ types: ['match_result'], allParticipants: [o.from] }).filter((e) => e.seq > L.get(o.source).seq && (e.data.opponents || []).includes(o.from));
    assert.equal(later.length, 0, `grudge from ${o.from} is still pending after a later match`);
  }
});

test('a Royal Rumble guarantee names a Rumble that has not happened yet', () => {
  const c = newCareer(3);
  c.day = 401; // 2025-02-06: the 2025 Rumble is already over
  const r = deliverPromo(c, { tone: 'boast', claim: 'win_rumble' });
  assert.ok(r.lines.some((l) => /2026 Royal Rumble/.test(l.text)));
  const d = newCareer(3);
  d.day = 10;
  assert.ok(deliverPromo(d, { tone: 'boast', claim: 'win_rumble' }).lines.some((l) => /2024 Royal Rumble/.test(l.text)));
});

test('repeating an open promise writes no second promise_made event', () => {
  const c = newCareer(5);
  const a = deliverPromo(c, { tone: 'boast', claim: 'win_title' });
  const before = c.memory.ledger.ofType('promise_made').length;
  c.advanceDays(3);
  deliverPromo(c, { tone: 'boast', claim: 'win_title' });
  assert.equal(c.memory.ledger.ofType('promise_made').length, before);
  assert.ok(a);
});

test('a multi-way loss is credited only to the wrestler who won it, on every surface', () => {
  const c = newCareer(13);
  const rec = (n, result, winner, type = 'triple_threat') => c.record({
    key: `mw:${n}`, category: 'match', type: 'match_result', participants: ['player', 'A', 'B'], outcome: result, summary: `m${n}`, importance: 2,
    data: { matchId: `mw${n}`, matchType: type, opponents: ['A', 'B'], partners: [], result, winner, finish: 'pinfall', clean: true, durationSec: 300, rating: 3 },
  });
  rec(1, 'loss', 'A'); rec(2, 'loss', 'B'); rec(3, 'loss', 'A'); rec(4, 'win', 'player');
  const hk = (id) => hooks(c.memory, 'player', id);
  assert.equal(hk('A').find((h) => h.kind === 'you_beat_me').n, 2);
  assert.equal(hk('B').find((h) => h.kind === 'you_beat_me').n, 1);
  assert.equal(hk('A').find((h) => h.kind === 'i_beat_you').n, 1);
  assert.equal(c.stats.s.opponents.A.losses, 2);
  assert.equal(c.stats.s.opponents.B.losses, 1);
  assert.equal(c.stats.s.opponents.B.unresolved, 2);
  const hc = h2hCounts(c.memory.ledger, 'player', 'A');
  assert.deepEqual([hc.matches, hc.winsA, hc.winsB], [4, 1, 2]);
  // a handicap or tag loss is a loss to the whole opposing side
  const t = newCareer(14);
  t.record({ key: 'tg:1', category: 'match', type: 'match_result', participants: ['player', 'A', 'B', 'P'], outcome: 'loss', summary: 'tag', importance: 2, data: { matchId: 'tg1', matchType: 'tag', opponents: ['A', 'B'], partners: ['P'], result: 'loss', winner: 'A', finish: 'pinfall', durationSec: 300, rating: 3 } });
  assert.equal(t.stats.s.opponents.B.losses, 1);
});

import { Game } from '../src/game.js';
import { ScenarioEngine } from '../src/story/scenarios.js';
import { SCENARIO_TEMPLATES } from '../src/story/scenarios/index.js';

test('"the loss still stings" scenes only fire after a loss to that rival, and never after a win', () => {
  const g = new Game(); g.newCareer({ name: 'Trigger Tester', seed: 31, startYear: 2024 });
  const c = g.career, eng = new ScenarioEngine(SCENARIO_TEMPLATES);
  const rival = g.universe.list((w) => w.brand === c.player.brand)[0];
  const meet = (n, result) => c.record({
    key: `trg:${n}`, category: 'match', type: 'match_result', participants: ['player', rival.id], outcome: result, summary: `m${n}`, importance: 2,
    data: { matchId: `trg${n}`, matchType: 'singles', opponents: [rival.id], partners: [], result, winner: result === 'win' ? 'player' : rival.id, finish: 'pinfall', clean: true, durationSec: 300, rating: 3 },
  });
  for (let i = 0; i < 4; i++) { meet(i, i % 2 ? 'loss' : 'win'); c.advanceDays(1); }
  // heat so the rivalry cast can bind
  const ids = (ctxs) => eng.eligible(c, { contexts: ctxs }).map((e) => e.t.id);
  meet(10, 'win'); c.advanceDays(1);
  assert.ok(!ids(['weekly']).includes('riv_loss_gloat'), 'no gloating after a win');
  meet(11, 'loss'); c.advanceDays(1);
  const after = ids(['weekly']);
  assert.ok(after.includes('riv_loss_gloat'), 'gloating is available right after a loss to the rival: ' + after.length);
});

test('a forged achievement unlock in a save is dropped on load; retired wrestlers cannot cut promos or post', async () => {
  const { Career } = await import('../src/career/career.js');
  const g = new Game(); g.newCareer({ name: 'Forger Test', seed: 61, startYear: 2024 });
  const c = g.career;
  const json = JSON.parse(JSON.stringify(c.toJSON()));
  json.achievements.unlocked.fake_ach = { id: 'fake_ach', name: 'Forged', event: 'E999999', evidence: ['E999998'], day: 1 };
  const back = Career.fromJSON(json);
  assert.ok(!back.achievements.unlocked.fake_ach, 'forged unlock must not survive a load');
  c.flags.retired = { day: c.day, reason: 'choice' };
  assert.throws(() => g.socialPost({ tone: 'gratitude' }), /career is over/);
  assert.throws(() => g.startAppearance('interview'), /career is over/);
  assert.throws(() => g.promo({ tone: 'boast' }), /career is over/);
});

test('cast pick lastOpponent names the person the player just faced (the winner of a multi-way loss), and nobody otherwise', () => {
  const g = new Game(); g.newCareer({ name: 'Last Opp', seed: 33, startYear: 2024 });
  const c = g.career, eng = new ScenarioEngine(SCENARIO_TEMPLATES);
  const [x, y] = g.universe.list((w) => w.brand === c.player.brand);
  assert.throws(() => eng.start(c, 'riv_ring_accident', { force: true }), /cannot be filled/);
  c.record({ key: 'lo:1', category: 'match', type: 'match_result', participants: ['player', x.id, y.id], outcome: 'loss', summary: 'm', importance: 2,
    data: { matchId: 'lo1', matchType: 'triple_threat', opponents: [x.id, y.id], partners: [], result: 'loss', winner: y.id, finish: 'pinfall', clean: true, durationSec: 300, rating: 3 } });
  const inst = eng.start(c, 'riv_ring_accident', { force: true });
  assert.equal(inst.cast.opp.id, y.id);
});
