import { Rng } from '../src/rng';
import { leaguePhasePairings, colourMatchdays, type TeamInfo } from '../src/competition/fixtures';
const countries = ['ENG', 'ESP', 'ITA', 'GER', 'FRA', 'POR', 'NED', 'BEL', 'TUR'];
const cmap = [0,0,0,0,0,1,1,1,1,1,2,2,2,2,2,3,3,3,3,4,4,4,5,5,6,6,7,7,8,8,0,1,2,3,5,6];
const teams: TeamInfo[] = Array.from({ length: 36 }, (_, i) => ({ id: 't' + i, country: countries[cmap[i]!]!, coefficient: 100 - i }));
const rng = Rng.fromSeed('lpx');
const res = leaguePhasePairings(teams, 4, 2, rng);
const deg = new Map<string, number>(); for (const p of res.pairings) { deg.set(p.home, (deg.get(p.home) ?? 0) + 1); deg.set(p.away, (deg.get(p.away) ?? 0) + 1); }
console.log('relaxed', res.relaxed, 'matches', res.pairings.length, 'degrees', [...new Set(deg.values())]);
for (let k = 0; k < 5; k++) { const t0 = performance.now(); const col = colourMatchdays(teams.map(t => t.id), res.pairings, 8, rng.derive('c' + k), 300000); console.log('colour', col ? 'ok' : 'FAIL', (performance.now() - t0).toFixed(0) + 'ms'); }
