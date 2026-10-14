import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newCareer, makeBooking, opp, playHeadless } from './helpers2.js';
import { dueObligations, addObligation } from '../src/memory/world.js';

test('multi-way loss summaries name only the winner; tag losses can be to the opposing partner', () => {
  // a loss in a triple threat names the winner, not both opponents
  for (let seed = 1; seed <= 30; seed++) {
    const c = newCareer(seed);
    const a = opp('brawler'), b = opp('tech');
    const r = playHeadless(c, makeBooking(c, [a, b], { type: 'triple_threat' }), 'weak');
    const d = r.event.data;
    if (d.result !== 'loss' || !d.winner) continue;
    const winner = [a, b].find((x) => x.id === d.winner);
    assert.ok(r.event.summary.includes(winner.name), r.event.summary);
    assert.ok(r.event.summary.includes('one of 2'), r.event.summary);
    return;
  }
  assert.fail('no multi-way loss found in 30 seeds');
});

test('tag partners on the other side are opponents: recorded as participants and credited when they pin', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const c = newCareer(seed);
    const a = opp('brawler'), b = opp('tech'), p = opp('partnerA');
    const r = playHeadless(c, makeBooking(c, [a], { type: 'tag', partners: [p], opponentPartners: [b] }), 'weak');
    const d = r.event.data;
    assert.ok(d.opponents.includes(b.id) && d.opponents.includes(a.id), 'both opposing wrestlers recorded');
    if (d.result === 'loss' && d.winner === b.id) {
      assert.equal(c.stats.s.opponents[b.id].losses, 1);
      return;
    }
  }
});

test('lapsed obligations stop surfacing after four months', () => {
  const c = newCareer(5);
  addObligation(c.memory.world, { id: 'ob:x', kind: 'confront_backstage', from: 'a', to: c.player.id, dueDay: 10 });
  assert.equal(dueObligations(c.memory.world, 12).length, 1);
  assert.equal(dueObligations(c.memory.world, 200).length, 0);
});
