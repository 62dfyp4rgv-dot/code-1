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

import TH from '../src/story/title_holder_pack.js';
import RX from '../src/story/reactions_pack.js';
import SP from '../src/story/social_pack.js';

test('title-holder, reaction and social packs have the agreed shape and clean lines', () => {
  const lineOk = (l, allowed) => {
    assert.ok(typeof l === 'string' && l.length >= 12 && l.length <= 200, l);
    assert.ok(/^[A-Z{"'(]/.test(l) && /[.!?"')…]$/.test(l), l);
    assert.ok(!/  /.test(l), l);
    for (const m of l.matchAll(/\{(\w+)\}/g)) assert.ok(allowed.includes(m[1]), `${m[1]} in ${l}`);
  };
  for (const st of ['confident', 'humble', 'aggressive', 'honest', 'joking']) {
    assert.ok(TH[st].length >= 7 && new Set(TH[st]).size === TH[st].length);
    TH[st].forEach((l) => lineOk(l, []));
    for (const t of ['great', 'good', 'mid', 'poor']) { assert.ok(RX[st][t].length >= 9); RX[st][t].forEach((l) => lineOk(l, [])); }
  }
  for (const [k, arr] of Object.entries(SP.fan)) { assert.ok(arr.length >= 10, k); arr.forEach((l) => lineOk(l, ['p', 'o', 't'])); }
  for (const [k, arr] of Object.entries(SP.media)) { assert.ok(arr.length >= 8, k); arr.forEach((l) => lineOk(l, ['p', 'o', 't'])); }
});
