import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playCareer } from '../tools/careersim.js';

test('storySoFar: every line cites a real ledger event and threads are about people the player has history with', () => {
  const g = playCareer({ years: 1, strategy: 'smart', seed: 33 }).game;
  const st = g.storySoFar();
  const L = g.career.memory.ledger;
  assert.ok(st.threads.length >= 1, 'a year of play should leave at least one thread');
  for (const t of st.threads) {
    assert.ok(t.lines.length);
    for (const l of t.lines) assert.ok(L.get(l.eventId), `thread line cites missing event ${l.eventId}`);
  }
  for (const m of st.moments) assert.ok(L.get(m.id));
  for (const p of st.promises) assert.ok(L.get(p.made));
  assert.ok(st.threads.length <= 5 && st.moments.length <= 5);
});
