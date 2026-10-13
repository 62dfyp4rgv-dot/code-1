import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playCareer, audit } from '../tools/careersim.js';
import { Career } from '../src/career/career.js';
import { APPEARANCE_KINDS } from '../src/story/appearances.js';

const base = () => playCareer({ years: 0.5, strategy: 'smart', seed: 31 }).game;

function runAppearance(g, kind, pickAnswer = (v) => v.answers[0].id) {
  let v = g.startAppearance(kind);
  let guard = 0;
  while (!v.done && guard++ < 10) v = g.answerAppearance(pickAnswer(v));
  return v;
}

test('an interview is recorded in the ledger with refs that exist, and stats count it', () => {
  const g = base();
  const before = g.career.stats.s.interviews;
  const res = runAppearance(g, 'interview');
  assert.ok(res.done && res.quality >= 5 && res.quality <= 99);
  assert.equal(res.given.length, APPEARANCE_KINDS.interview.questions);
  assert.equal(g.career.stats.s.interviews, before + 1);
  for (const id of res.refs) assert.ok(g.career.memory.ledger.get(id), `ref ${id} must exist`);
  assert.equal(res.event.type, 'interview');
  assert.deepEqual(audit(g), []);
});

test('every question cites only real events and is built from the ledger', () => {
  const g = base();
  const v = g.startAppearance('podcast');
  const s = g.career.flags.appearance;
  for (const q of s.questions) for (const id of q.refs) assert.ok(g.career.memory.ledger.get(id), `question ${q.id} cites missing ${id}`);
  assert.equal(s.questions.length, APPEARANCE_KINDS.podcast.questions);
  assert.ok(v.answers.length >= 5);
  g.cancelAppearance();
});

test('cooldown blocks a second appearance of the same kind; other kinds still work', () => {
  const g = base();
  runAppearance(g, 'interview');
  assert.throws(() => g.startAppearance('interview'), /again in/);
  const opts = g.appearanceOptions();
  assert.equal(opts.find((o) => o.id === 'interview').available, false);
  assert.ok(opts.find((o) => o.id === 'podcast').available);
});

test('a guarantee on air becomes an open promise that the world replay agrees with', () => {
  const g = base();
  let v = g.startAppearance('press_conference');
  let made = false, guard = 0;
  while (!v.done && guard++ < 10) {
    const guar = v.answers.find((a) => a.id === 'guarantee');
    if (guar) made = true;
    v = g.answerAppearance(guar ? guar.id : v.answers[0].id);
  }
  if (made) {
    assert.ok(v.promises.length >= 1);
    const open = g.career.memory.world.promises.filter((p) => p.status === 'open' || p.status === 'kept' || p.status === 'broken');
    assert.ok(open.some((p) => p.madeEvent === v.event.id));
  }
  assert.deepEqual(audit(g), []);
});

test('an appearance in progress survives save and load', () => {
  const g = base();
  g.startAppearance('podcast');
  g.answerAppearance(g.appearanceView().answers[1].id);
  const j = JSON.parse(JSON.stringify(g.career.toJSON()));
  const c2 = Career.fromJSON(j);
  assert.equal(c2.flags.appearance.index, 1);
  assert.equal(c2.flags.appearance.given.length, 1);
});

test('same seed and day give the same questions (deterministic)', () => {
  const a = base(), b = base();
  a.startAppearance('podcast'); b.startAppearance('podcast');
  assert.deepEqual(a.career.flags.appearance.questions.map((q) => q.id), b.career.flags.appearance.questions.map((q) => q.id));
});
