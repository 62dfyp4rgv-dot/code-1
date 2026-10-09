import { simulateMatch } from '../src/match';
import { syntheticMatch, syntheticSheet } from '../src/synth';
import { Rng } from '../src/rng';
const rng = Rng.fromSeed('calibration');
for (let i = 0; i < 2500; i++) {
  const qh = rng.normal(62, 6); const qa = rng.normal(62, 6);
  const r = simulateMatch(syntheticMatch(`c${i}`, `s${i}`, syntheticSheet({ id: 'H', quality: qh, seed: String(i) }), syntheticSheet({ id: 'A', quality: qa, seed: String(i) })));
  const best = [...r.players].sort((a, b) => b.goals - a.goals)[0]!;
  if (best.goals >= 5) console.log(i, qh.toFixed(1), qa.toFixed(1), 'score', r.score, 'top', best.name, best.position, 'goals', best.goals, 'shots', best.shots, 'xg', best.xg.toFixed(2), 'team shots', r.stats[best.side].shots, 'xg', r.stats[best.side].xg, 'min', best.minutes);
}
