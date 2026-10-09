import { Rng } from '../src/rng';
import { roundRobin, leaguePhasePairings, colourMatchdays, type TeamInfo } from '../src/competition/fixtures';

// round robin balance
for (const n of [18, 20, 30, 7]) {
  const rr = roundRobin(Array.from({ length: n }, (_, i) => `t${i}`), 2, Rng.fromSeed('x' + n));
  const home = new Map<string, number>(); const away = new Map<string, number>(); const pairs = new Set<string>();
  let maxStreak = 0;
  for (const r of rr) for (const p of r) { home.set(p.home, (home.get(p.home) ?? 0) + 1); away.set(p.away, (away.get(p.away) ?? 0) + 1); pairs.add(p.home + '>' + p.away); }
  console.log('n', n, 'rounds', rr.length, 'pairs', pairs.size, 'home counts', [...new Set(home.values())], 'away', [...new Set(away.values())]);
}
const countries = ['ENG', 'ESP', 'ITA', 'GER', 'FRA', 'POR', 'NED', 'BEL', 'TUR', 'SCO'];
let fails = 0, relaxed = 0; const t0 = performance.now();
for (let s = 0; s < 60; s++) {
  const teams: TeamInfo[] = Array.from({ length: 36 }, (_, i) => ({ id: 't' + i, country: countries[[0,0,0,0,0,1,1,1,1,1,2,2,2,2,2,3,3,3,3,4,4,4,5,5,6,6,7,7,8,8,9,9,0,1,2,3][i]!]!, coefficient: 100 - i }));
  const rng = Rng.fromSeed('lp' + s);
  const res = leaguePhasePairings(teams, 4, 2, rng);
  if (res.relaxed !== 'none') relaxed++;
  const col = colourMatchdays(teams.map((t) => t.id), res.pairings, 8, rng.derive('col'));
  if (!col) { fails++; continue; }
  const seen = new Set<string>(); for (let i = 0; i < col.length; i++) { const p = res.pairings[i]!; for (const t of [p.home, p.away]) { const k = t + ':' + col[i]; if (seen.has(k)) throw new Error('dup'); seen.add(k); } }
}
console.log('league phase: failures', fails, 'relaxed', relaxed, 'ms/each', ((performance.now() - t0) / 60).toFixed(1));
