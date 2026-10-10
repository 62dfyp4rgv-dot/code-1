import { simulateMatch } from '../src/match';
import { syntheticSheet, syntheticMatch } from '../src/synth';
import { defaultTactics, formationOf, FORMATIONS } from '../src/tactics';
import { Rng } from '../src/rng';
import type { Tactics } from '../src/types';
const rng = Rng.fromSeed('search');
const forms = Object.keys(FORMATIONS);
function randTactics(): Tactics {
  const f = rng.pick(forms); const t = defaultTactics(f);
  const s = () => rng.pick([10, 50, 90]);
  return { ...t, tempo: s(), width: s(), directness: s(), pressing: s(), defensiveLine: s(), mentality: rng.pick([-2, -1, 0, 1, 2]) as Tactics['mentality'], counterAttack: rng.chance(0.4), marking: rng.pick(['zonal', 'man', 'mixed'] as const), setPieceFocus: rng.pick(['near', 'far', 'short', 'mixed'] as const) };
}
function gd(a: Tactics, b: Tactics, n: number, tag: string) {
  let d = 0;
  for (let i = 0; i < n; i++) {
    const A = syntheticSheet({ id: 'A', quality: 64, tactics: a, seed: tag + (i >> 1) }), B = syntheticSheet({ id: 'B', quality: 64, tactics: b, seed: tag + (i >> 1) });
    const r = i % 2 ? simulateMatch(syntheticMatch('m' + i, 'sr' + tag, B, A)) : simulateMatch(syntheticMatch('m' + i, 'sr' + tag, A, B));
    d += i % 2 ? r.score.away - r.score.home : r.score.home - r.score.away;
  }
  return d / n;
}
const base = defaultTactics('4-3-3');
const res: { t: Tactics; gd: number }[] = [];
const K = Number(process.env.K ?? 70);
for (let k = 0; k < K; k++) { const t = randTactics(); res.push({ t, gd: gd(t, base, 300, 'k' + k) }); }
res.sort((a, b) => b.gd - a.gd);
console.log('random configs vs balanced 4-3-3, n=300 each (se~0.09). best 3 / worst 2:');
for (const r of [...res.slice(0, 3), ...res.slice(-2)]) console.log(r.gd.toFixed(3), JSON.stringify({ f: r.t.formation, tempo: r.t.tempo, w: r.t.width, d: r.t.directness, p: r.t.pressing, l: r.t.defensiveLine, m: r.t.mentality, c: r.t.counterAttack, mk: r.t.marking, sp: r.t.setPieceFocus }));
console.log('re-test best 3 on fresh seeds, n=3000 (se~0.03):');
for (const r of res.slice(0, 3)) console.log(gd(r.t, base, 3000, 'confirm').toFixed(3));
const arr = res.map((r) => r.gd); const m = arr.reduce((a, b) => a + b, 0) / arr.length; console.log('mean GD over random configs (should be <0 if configs are mostly worse than a sane default)', m.toFixed(3));
