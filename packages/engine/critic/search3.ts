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
  ['control', {}],
  ['full', { directness: 90, pressing: 90, defensiveLine: 10, counterAttack: true }],
  ['dir90 line10 counter', { directness: 90, defensiveLine: 10, counterAttack: true }],
  ['press90 line10 counter', { pressing: 90, defensiveLine: 10, counterAttack: true }],
  ['dir90 press90 line10', { directness: 90, pressing: 90, defensiveLine: 10 }],
  ['dir90 press90 counter', { directness: 90, pressing: 90, counterAttack: true }],
  ['line10 counter', { defensiveLine: 10, counterAttack: true }],
];
for (const [name, mod] of cfgs) console.log(name.padEnd(56), 'GD vs default', gd({ ...base, ...mod }, base, N, name));
