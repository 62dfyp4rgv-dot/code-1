import { simulateMatch } from '../src/match';
import { syntheticSheet, syntheticMatch } from '../src/synth';
import { archetypeTactics } from '../src/tactics';
import type { Tactics } from '../src/types';
function gd(a: Tactics, b: Tactics, n: number, tag: string) {
  let d = 0;
  for (let i = 0; i < n; i++) {
    const aHome = i % 2 === 0;
    const sa = syntheticSheet({ id: 'A', quality: 64, seed: `${tag}${i}`, tactics: a }); const sb = syntheticSheet({ id: 'B', quality: 64, seed: `${tag}${i}`, tactics: b });
    const r = simulateMatch(aHome ? syntheticMatch(`m${i}`, `s${tag}${i}`, sa, sb) : syntheticMatch(`m${i}`, `s${tag}${i}`, sb, sa));
    d += aHome ? r.score.home - r.score.away : r.score.away - r.score.home;
  }
  return d / n;
}
const c = archetypeTactics('counter'), h = archetypeTactics('highPress');
console.log('counter v highPress', gd(c, h, 3000, 'x1').toFixed(3), 'highPress v counter', gd(h, c, 3000, 'x2').toFixed(3));
