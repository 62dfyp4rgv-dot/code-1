import { simulateMatch } from '../src/match';
import { syntheticMatch, syntheticSheet } from '../src/synth';
let passes = 0, shots = 0, tk = 0, ic = 0, n = 300;
const kinds: Record<string, number> = {};
for (let i = 0; i < n; i++) {
  const r = simulateMatch(syntheticMatch(`m${i}`, `s${i}`, syntheticSheet({ id: 'H', quality: 62, seed: String(i) }), syntheticSheet({ id: 'A', quality: 62, seed: String(i) })));
  passes += r.stats.home.passes + r.stats.away.passes; tk += r.stats.home.tackles + r.stats.away.tackles; ic += r.stats.home.interceptions + r.stats.away.interceptions;
  for (const e of r.events) if (e.type === 'shot') kinds[e.kind] = (kinds[e.kind] ?? 0) + 1;
  shots += r.stats.home.shots + r.stats.away.shots;
}
console.log({ passes: passes / n, tackles: tk / n, inter: ic / n, shots: shots / n }, Object.fromEntries(Object.entries(kinds).map(([k, v]) => [k, +(v / n).toFixed(2)])));
