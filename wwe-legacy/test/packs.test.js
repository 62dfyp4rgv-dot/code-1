import { test } from 'node:test';
import assert from 'node:assert/strict';
import COMM from '../src/match/commentary_pack.js';
import ANS from '../src/story/answers_pack.js';
import PROMO from '../src/story/promo_pack.js';
import { checkCommentary, checkAnswers, checkPromos } from '../tools/packcheck.js';

test('authored prose packs pass the schema and prose linter', () => {
  assert.deepEqual(checkCommentary(COMM), []);
  assert.deepEqual(checkAnswers(ANS), []);
  assert.deepEqual(checkPromos(PROMO), []);
});

import { newCareer, fight, W } from './helpers2.js';
import { narrate } from '../src/match/commentary.js';

test('narration built from the pack has no casing, placeholder or agreement artefacts across many matches', () => {
  const bad = [];
  let lines = 0, colors = 0;
  for (let seed = 1; seed <= 12; seed++) {
    const c = newCareer(seed);
    const key = Object.keys(W)[seed % 6];
    const st = fight(c, key).engine.state;
    for (const ev of st.events) {
      if (ev.type === 'color') colors++;
      const t = narrate(st, ev);
      if (!t) continue;
      lines++;
      if (/\{|\}|undefined|NaN|'[ST]\b(?!')|\b(legs|arms) (is|was|pays|takes)\b|  /.test(t)) bad.push(t);
      if (/(^|[.!?]\s)[a-z]/.test(t)) bad.push(`lowercase start: ${t}`);
    }
  }
  assert.deepEqual(bad.slice(0, 5), []);
  assert.ok(lines > 300 && colors >= 1, `${lines} lines, ${colors} colour lines`);
});
