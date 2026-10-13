// Regression tests for findings from the independent memory review (Gauntlet round 2).
import test from 'node:test';
import assert from 'node:assert/strict';
import { Memory } from '../src/memory/memory.js';
import { hooks, memoryLines } from '../src/story/dialogue.js';
import { getRivalry } from '../src/memory/world.js';

const mr = (n, extra = {}) => ({ key: `m${n}`, day: n, category: 'match', type: 'match_result', participants: ['player', 'A'], summary: `m${n}`, data: { result: 'win', winner: 'player', opponents: ['A'], partners: [], finish: 'pinfall', clean: true, ...extra.data }, ...extra, ...(extra.data ? { data: { result: 'win', winner: 'player', opponents: ['A'], partners: [], finish: 'pinfall', clean: true, ...extra.data } } : {}) });
const promise = (n, target, text = 'I will beat A') => ({ key: `p${n}`, day: n, category: 'promo', type: 'promise_made', participants: ['player', target], summary: text, data: { kind: 'win_match', target, text, deadlineDay: 200 } });

test('the same promise made twice is one promise, paid out once', () => {
  const m = new Memory('player');
  m.record(promise(1, 'A')); m.record(promise(2, 'A'));
  assert.equal(m.world.promises.filter((p) => p.target === 'A').length, 1);
  const r = m.record(mr(3));
  assert.equal(r.resolvedPromises.length, 1);
});

test('winning a tag match WITH the promise target does not keep a promise to beat them', () => {
  const m = new Memory('player');
  m.record(promise(1, 'A'));
  m.record(mr(2, { participants: ['player', 'A', 'X'], data: { opponents: ['X'], partners: ['A'] } }));
  assert.equal(m.world.promises[0].status, 'open');
  const r = m.record(mr(3, { data: { opponents: ['A'] } }));
  assert.equal(r.resolvedPromises[0].status, 'kept');
});

test('a lost triple threat credits only the winner with a rivalry win', () => {
  const m = new Memory('player');
  m.record(mr(1, { participants: ['player', 'A', 'B'], data: { result: 'loss', winner: 'B', opponents: ['A', 'B'] } }));
  assert.equal(getRivalry(m.world, 'player', 'A').wins.A || 0, 0);
  assert.equal(getRivalry(m.world, 'player', 'B').wins.B, 1);
});

test('"last time" is only said when the most recent meeting was the controversial one', () => {
  const m = new Memory('player');
  m.record(mr(1, { data: { finish: 'dq', clean: false } }));
  assert.ok(hooks(m, 'player', 'A').some((h) => h.kind === 'controversial_finish'));
  m.record(mr(2, { data: { finish: 'pinfall' } }));
  const hs = hooks(m, 'player', 'A');
  assert.ok(!hs.some((h) => h.kind === 'controversial_finish'));
  assert.ok(hs.some((h) => h.kind === 'controversial_finish_old'));
});

test('a broken promise about A is not thrown back by an unrelated wrestler', () => {
  const m = new Memory('player');
  m.record(promise(1, 'A'));
  m.record(mr(2, { data: { result: 'loss', winner: 'A', opponents: ['A'] } }));
  assert.equal(m.world.promises[0].status, 'broken');
  assert.ok(hooks(m, 'player', 'A').some((h) => h.kind === 'broken_promise'));
  assert.ok(!hooks(m, 'player', 'B').some((h) => h.kind === 'broken_promise'));
});

test('callback lines never print the bare "you, you" slip and respect the cooldown', () => {
  const m = new Memory('player');
  for (let i = 1; i <= 4; i++) m.record(mr(i));
  const cd = { store: {}, day: 10, days: 45 };
  const first = memoryLines(m, 'player', 'A', 'Alpha', { speaker: 'other', max: 3, cooldown: cd });
  assert.ok(first.length > 0);
  for (const l of first) assert.ok(!/you, you|, you\./i.test(l.text), l.text);
  const again = memoryLines(m, 'player', 'A', 'Alpha', { speaker: 'other', max: 3, cooldown: { ...cd, day: 20 } });
  assert.equal(again.length, 0, 'same callbacks are not repeated within the cooldown');
  const later = memoryLines(m, 'player', 'A', 'Alpha', { speaker: 'other', max: 3, cooldown: { ...cd, day: 80 } });
  assert.ok(later.length > 0);
});

test('a stored world that disagrees with the ledger is rebuilt on load', () => {
  const m = new Memory('player');
  for (let i = 1; i <= 3; i++) m.record(mr(i));
  const json = JSON.parse(JSON.stringify(m.toJSON()));
  assert.equal(Memory.fromJSON(json).repaired, undefined);
  json.world.rivalries[Object.keys(json.world.rivalries)[0]].wins.player = 99;
  const loaded = Memory.fromJSON(json);
  assert.equal(loaded.repaired, true);
  assert.equal(getRivalry(loaded.world, 'player', 'A').wins.player, 3);
});

test('world_decay events cool old rivalries deterministically and replay agrees', () => {
  const m = new Memory('player');
  m.record(mr(1));
  const before = getRivalry(m.world, 'player', 'A').heat;
  for (let d = 30; d <= 300; d += 30) m.record({ key: `decay:${d}`, day: d, category: 'world', type: 'world_decay', scope: 'world', canon: false, participants: [], summary: 'decay', data: { days: 30 } });
  const rv = getRivalry(m.world, 'player', 'A');
  assert.ok(rv.heat < before);
  assert.equal(rv.status, 'cooled');
  assert.deepEqual(m.replayWorld(), m.world);
});
