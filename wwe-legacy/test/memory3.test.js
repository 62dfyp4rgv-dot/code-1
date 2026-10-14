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
