import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playCareer } from '../tools/careersim.js';

const sig = (r) => JSON.stringify([r.matches, r.scenarios, r.wins, r.losses, r.draws, r.events, r.titlesWon, r.popularity, r.money]);

test('a career outcome does not depend on what ran earlier in the process', () => {
  const cfg = { years: 1, strategy: 'average', seed: 17, startYear: 2008, background: 'indie', style: 'highflyer' };
  const first = sig(playCareer(cfg));
  playCareer({ years: 1, strategy: 'smart', seed: 11 }); // different career, same player id, different finisher
  const second = sig(playCareer(cfg));
  assert.equal(second, first);
});

test('the same seed gives identical careers run back to back', () => {
  const cfg = { years: 1, strategy: 'smart', seed: 5 };
  assert.equal(sig(playCareer(cfg)), sig(playCareer(cfg)));
});

import { buildMoveset } from '../src/match/state.js';
import { getMove } from '../src/match/moves.js';

test('custom move ids reused by another profile never keep stale content', () => {
  const a = buildMoveset({ id: 'dup', name: 'A Dup', style: 'brawler' });
  const tplA = getMove(a.signatures[0]).tpl;
  const b = buildMoveset({ id: 'dup', name: 'A Dup', style: 'highflyer' });
  const tplB = getMove(b.signatures[0]).tpl;
  assert.notEqual(tplA, tplB, 'second profile must see its own signature template');
});
