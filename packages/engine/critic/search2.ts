import { simulateMatch } from '../src/match';
import { syntheticSheet, syntheticMatch } from '../src/synth';
import { defaultTactics } from '../src/tactics';
import type { Tactics } from '../src/types';
function gd(a: Tactics, b: Tactics, n: number, tag: string) {
  let d = 0, g = 0, fatA = 0;
  for (let i = 0; i < n; i++) {
    const A = syntheticSheet({ id: 'A', quality: 64, tactics: a, seed: tag + (i >> 1) }), B = syntheticSheet({ id: 'B', quality: 64, tactics: b, seed: tag + (i >> 1) });
    const swap = i % 2 === 1; const r = swap ? simulateMatch(syntheticMatch('m' + i, 'ab' + tag, B, A)) : simulateMatch(syntheticMatch('m' + i, 'ab' + tag, A, B));
    d += swap ? r.score.away - r.score.home : r.score.home - r.score.away; g += r.score.home + r.score.away;
  }
  return `${(d / n).toFixed(3)} (total goals ${(g / n).toFixed(2)})`;
}
const base = defaultTactics('4-3-3'); const N = 3000;
const cfgs: [string, Partial<Tactics>][] = [
  ['control (identical)', {}],
  ['tempo 10', { tempo: 10 }],
  ['tempo 10 + line 10', { tempo: 10, defensiveLine: 10 }],
  ['tempo 10 + line 10 + mentality -2', { tempo: 10, defensiveLine: 10, mentality: -2 }],
  ['tempo 10 + line 10 + directness 90', { tempo: 10, defensiveLine: 10, directness: 90 }],
  ['tempo 10 + line 10 + pressing 90 + mentality -2 + man', { tempo: 10, defensiveLine: 10, pressing: 90, mentality: -2, marking: 'man' }],
];
for (const [name, mod] of cfgs) console.log(name.padEnd(56), 'GD vs default', gd({ ...base, ...mod }, base, N, name));
