import { simulateMatch } from '../src/match';
import { syntheticMatch, syntheticSheet } from '../src/synth';
import { Rng } from '../src/rng';
const n = 3000;
function scen(label: string, qh: () => number, qa: () => number): void {
  let hw = 0, d = 0, aw = 0, hat = 0, g = 0; const rng = Rng.fromSeed(label);
  void rng;
  for (let i = 0; i < n; i++) {
    const r = simulateMatch(syntheticMatch(`m${i}`, `s${i}`, syntheticSheet({ id: 'H', quality: qh(), seed: String(i) }), syntheticSheet({ id: 'A', quality: qa(), seed: String(i) })));
    if (r.score.home > r.score.away) hw++; else if (r.score.home < r.score.away) aw++; else d++;
    if (r.players.some((p) => p.goals >= 3)) hat++; g += r.score.home + r.score.away;
  }
  console.log(label.padEnd(34), `home W/D/L ${(hw / n * 100).toFixed(0)}/${(d / n * 100).toFixed(0)}/${(aw / n * 100).toFixed(0)}  hat-trick/match ${(hat / n * 100).toFixed(1)}%  G/m ${(g / n).toFixed(2)}`);
}
scen('equal 62 v 62', () => 62, () => 62);
scen('home +15 (72 v 57)', () => 72, () => 57);
scen('away +15 (57 v 72) -> away favourite', () => 57, () => 72);
scen('home +8', () => 66, () => 58);
scen('home +25 (75 v 50)', () => 75, () => 50);
