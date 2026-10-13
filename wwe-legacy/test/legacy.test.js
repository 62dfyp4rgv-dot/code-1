import test from 'node:test';
import assert from 'node:assert/strict';
import { playCareer, audit } from '../tools/careersim.js';
import { legacyScore, HOF_THRESHOLD } from '../src/career/legacy.js';

test('legacy score is a pure function of the ledger and every part cites real events', () => {
  const g = playCareer({ years: 1.5, strategy: 'smart', seed: 41 }).game;
  const a = legacyScore(g.career), b = legacyScore(g.career);
  assert.deepEqual(a, b);
  for (const p of a.parts) for (const id of p.evidence) assert.ok(g.career.memory.ledger.get(id), `${p.id} cites missing ${id}`);
  assert.ok(a.total >= 0 && a.tier);
});

test('retiring records one retirement event, finalises the verdict and blocks further play', () => {
  const g = playCareer({ years: 1, strategy: 'smart', seed: 42 }).game;
  const before = g.career.memory.ledger.ofType('retirement').length;
  const r = g.retire('choice');
  assert.equal(g.career.memory.ledger.ofType('retirement').length, before + 1);
  assert.ok(g.retired && g.career.flags.phase === 'retired');
  assert.equal(r.legacy.total, g.career.flags.retired.legacy);
  assert.throws(() => g.retire(), /already retired/);
  assert.throws(() => g.rest(), /./);
  assert.deepEqual(audit(g), []);
});

test('Hall of Fame induction happens exactly when the score reaches the threshold, with evidence', () => {
  const g = playCareer({ years: 3, strategy: 'smart', seed: 16, startYear: 1998, background: 'established', style: 'brawler' }).game;
  const lg = legacyScore(g.career);
  const r = g.retire();
  assert.equal(!!r.hof, lg.total >= HOF_THRESHOLD);
  if (r.hof) { assert.ok(r.hof.refs.length > 0); assert.equal(g.career.memory.ledger.ofType('hall_of_fame').length, 1); }
  assert.deepEqual(audit(g), []);
});
