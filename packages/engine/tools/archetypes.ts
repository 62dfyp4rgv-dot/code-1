import { simulateMatch } from '../src/match';
import { syntheticMatch, syntheticSheet } from '../src/synth';
import { archetypeTactics, type TacticalArchetype } from '../src/tactics';
const kinds: TacticalArchetype[] = ['balanced', 'possession', 'counter', 'highPress', 'lowBlock', 'direct'];
const n = Number(process.argv[2] ?? 1200);
const tot: Record<string, { gd: number; g: number; m: number }> = {};
console.log('rows = tactic of team A (home/away alternated), cols = opponent; cell = goal diff per match for A (G/m total)');
console.log(''.padEnd(11) + kinds.map((k) => k.padStart(14)).join(''));
for (const a of kinds) {
  let line = a.padEnd(11);
  for (const b of kinds) {
    let gd = 0, g = 0;
    for (let i = 0; i < n; i++) {
      const aHome = i % 2 === 0;
      const ta = syntheticSheet({ id: 'A', quality: 64, seed: String(i), tactics: archetypeTactics(a) });
      const tb = syntheticSheet({ id: 'B', quality: 64, seed: String(i), tactics: archetypeTactics(b) });
      const r = simulateMatch(aHome ? syntheticMatch(`m${i}`, `s${i}`, ta, tb) : syntheticMatch(`m${i}`, `s${i}`, tb, ta));
      const ga = aHome ? r.score.home : r.score.away; const gb = aHome ? r.score.away : r.score.home;
      gd += ga - gb; g += ga + gb;
    }
    line += `${(gd / n).toFixed(2)} (${(g / n).toFixed(1)})`.padStart(14);
    const t = (tot[a] ??= { gd: 0, g: 0, m: 0 }); t.gd += gd; t.g += g; t.m += n;
  }
  console.log(line);
}
console.log('\nrow averages:', kinds.map((k) => `${k}: gd ${(tot[k]!.gd / tot[k]!.m).toFixed(3)} G/m ${(tot[k]!.g / tot[k]!.m).toFixed(2)}`).join(' | '));
