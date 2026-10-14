// Regression tests for findings from the independent memory review (Gauntlet round 2).
import test from 'node:test';
import assert from 'node:assert/strict';
import { Memory } from '../src/memory/memory.js';
import { hooks, memoryLines } from '../src/story/dialogue.js';
import { getRivalry, getRel } from '../src/memory/world.js';

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
  // one line per fact family per call, so a sibling fact may surface later, but nothing already said is repeated within the cooldown
  assert.ok(again.every((l) => !first.some((f) => f.key === l.key || f.text === l.text)), 'same callbacks are not repeated within the cooldown');
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

// ---- round-4 review findings
import { hasOpenPromise } from '../src/memory/world.js';
import { sha256 } from '../src/core/util.js';

test('sha256 matches the standard test vectors and the ledger chain uses it', () => {
  assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(sha256(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  const m = new Memory('player');
  m.record(mr(1));
  assert.equal(m.ledger.events[0].hash.length, 40);
});

test('when the rival speaks, clean wins/losses are told from THEIR side', () => {
  const m = new Memory('player');
  for (let i = 1; i <= 3; i++) m.record(mr(i)); // player beat A cleanly three times
  const lines = memoryLines(m, 'player', 'A', 'Alpha', { speaker: 'other', max: 6 });
  const text = lines.map((l) => l.text).join(' | ');
  assert.ok(!/wins over you|victories over you|I've beaten you|I beat you/i.test(text), `rival must not boast about losses: ${text}`);
  assert.ok(/clean|lost|beat me|better of me|losses/i.test(text), text);
  const mine = memoryLines(m, 'player', 'A', 'Alpha', { speaker: 'player', max: 6 }).map((l) => l.text).join(' | ');
  assert.ok(/clean|beaten|wins/i.test(mine), mine);
});

test('a tag partner is not counted as an opponent in head-to-head history', () => {
  const m = new Memory('player');
  m.record(mr(1, { participants: ['player', 'P', 'X'], data: { opponents: ['X'], partners: ['P'], winner: 'player' } }));
  assert.equal(hooks(m, 'player', 'P').filter((h) => ['i_beat_you', 'you_beat_me', 'clean_dominance', 'long_rivalry'].includes(h.kind)).length, 0);
});

test('only player-scope events settle promises; world events never break one silently', () => {
  const m = new Memory('player');
  m.record(promise(1, 'A'));
  m.record({ key: 'w1', day: 500, category: 'world', type: 'world_title_change', scope: 'world', canon: false, participants: ['X', 'Y'], summary: 'world', data: {} });
  assert.equal(m.world.promises[0].status, 'open');
  const r = m.record(mr(501, { data: { opponents: ['Z'] } }));
  assert.equal(r.resolvedPromises.length, 1, 'the next player event settles it and returns it for a ledger event');
  assert.equal(m.world.promises[0].status, 'broken');
  assert.deepEqual(m.replayWorld(), m.world);
});

test('a win_streak promise counts from when it was made and breaks on the first loss', () => {
  const m = new Memory('player');
  for (let i = 1; i <= 4; i++) m.record(mr(i, { data: { winStreak: i } })); // an existing streak of 4
  m.record({ key: 'ps', day: 10, category: 'promo', type: 'promise_made', participants: ['player'], summary: 'streak', data: { kind: 'win_streak', params: { n: 3 }, text: 'I will win my next three matches', deadlineDay: 100 } });
  m.record(mr(11, { data: { winStreak: 5 } }));
  assert.equal(m.world.promises[0].status, 'open', 'one win after the promise is not three');
  m.record(mr(12, { data: { result: 'loss', winner: 'A', winStreak: 0, winStreakBefore: 5 } }));
  assert.equal(m.world.promises[0].status, 'broken');
  const m2 = new Memory('player');
  m2.record({ key: 'ps', day: 10, category: 'promo', type: 'promise_made', participants: ['player'], summary: 'streak', data: { kind: 'win_streak', params: { n: 3 }, text: 't', deadlineDay: 100 } });
  for (let i = 1; i <= 3; i++) m2.record(mr(10 + i));
  assert.equal(m2.world.promises[0].status, 'kept');
});

test('hasOpenPromise detects an equivalent open claim', () => {
  const m = new Memory('player');
  m.record(promise(1, 'A'));
  assert.ok(hasOpenPromise(m.world, { by: 'player', kind: 'win_match', target: 'A', params: {} }));
  assert.ok(!hasOpenPromise(m.world, { by: 'player', kind: 'win_match', target: 'B', params: {} }));
});

test('mentorship direction follows data.byPlayer and a reconciled betrayal is no longer thrown back', () => {
  const m = new Memory('player');
  m.record({ key: 'men', day: 1, category: 'relationship', type: 'mentorship', participants: ['player', 'V'], summary: 'V mentors the player', data: { byPlayer: false } });
  const rel = getRel(m.world, 'V', 'player');
  // tags are stored per pair: the mentor tag must point FROM the veteran TO the player (and trust flows to the veteran's mentee)
  assert.ok(rel.tags.includes('mentor'));
  const tagEvent = Object.values(m.world.relationships)[0];
  assert.ok(tagEvent.events.length >= 1);
  const b = new Memory('player');
  b.record({ key: 'bt', day: 1, category: 'relationship', type: 'betrayal', participants: ['A', 'player'], summary: 'A betrayed the player', data: {} });
  assert.ok(hooks(b, 'player', 'A').some((h) => h.kind === 'you_betrayed_me'));
  b.record({ key: 'rc', day: 5, category: 'relationship', type: 'reconciliation', participants: ['player', 'A'], summary: 'made up', data: {} });
  const hs = hooks(b, 'player', 'A');
  assert.ok(!hs.some((h) => h.kind === 'you_betrayed_me'), 'betrayal is settled');
  assert.ok(hs.some((h) => h.kind === 'reconciled'));
});

test('legacy score is the same however much idle time passes after the last recorded event', async () => {
  const { playCareer } = await import('../tools/careersim.js');
  const { legacyScore } = await import('../src/career/legacy.js');
  const g = playCareer({ years: 1, strategy: 'smart', seed: 61 }).game;
  const a = legacyScore(g.career).total;
  g.career.day += 4000; // time passing with nothing recorded
  assert.equal(legacyScore(g.career).total, a);
});
