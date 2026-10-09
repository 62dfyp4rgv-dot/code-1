import { simulateMatch } from '../src/match';
import { syntheticMatch, syntheticSheet } from '../src/synth';
import { defaultTactics, FORMATIONS } from '../src/tactics';
const ids = Object.keys(FORMATIONS);
const n = Number(process.argv[2] ?? 1200);
const avg: Record<string, number> = {};
console.log(''.padEnd(8) + ids.map((i) => i.padStart(9)).join(''));
for (const a of ids) {
  let row = a.padEnd(8); let tot = 0;
  for (const b of ids) {
    let gd = 0;
    for (let i = 0; i < n; i++) {
      const aHome = i % 2 === 0;
      const sa = syntheticSheet({ id: 'A', quality: 64, seed: `${a}${b}${i}`, tactics: defaultTactics(a) });
      const sb = syntheticSheet({ id: 'B', quality: 64, seed: `${a}${b}${i}`, tactics: defaultTactics(b) });
      const r = simulateMatch(aHome ? syntheticMatch(`m${i}`, `s${i}`, sa, sb) : syntheticMatch(`m${i}`, `s${i}`, sb, sa));
      gd += aHome ? r.score.home - r.score.away : r.score.away - r.score.home;
    }
    row += (gd / n).toFixed(2).padStart(9); tot += gd / n;
  }
  avg[a] = tot / ids.length; console.log(row + `   avg ${(tot / ids.length).toFixed(3)}`);
}
