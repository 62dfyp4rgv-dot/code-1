import { simulateMatch } from '../src/match';
import type { TeamSheet } from '../src/match';
import { syntheticSheet, syntheticMatch } from '../src/synth';
import { defaultTactics, formationOf } from '../src/tactics';
const N = Number(process.env.N ?? 3000);
function stats(label: string, mk: (i: number) => [TeamSheet, TeamSheet]) {
  let gh = 0, ga = 0, w = [0, 0, 0], hat = 0, hs = 0;
  for (let i = 0; i < N; i++) {
    const [h, a] = mk(i);
    const r = simulateMatch(syntheticMatch('m' + i, 'crit2', h, a));
    gh += r.score.home; ga += r.score.away;
    w[r.score.home > r.score.away ? 0 : r.score.home === r.score.away ? 1 : 2]++;
    hs += r.stats.home.shots + r.stats.away.shots;
  }
  console.log(`${label.padEnd(36)} goals H ${(gh / N).toFixed(2)} A ${(ga / N).toFixed(2)} tot ${((gh + ga) / N).toFixed(2)} shots ${(hs / N).toFixed(1)}  H/D/A ${(w[0] / N * 100).toFixed(0)}/${(w[1] / N * 100).toFixed(0)}/${(w[2] / N * 100).toFixed(0)}`);
}
console.log('--- absolute level, equal teams');
for (const q of [35, 50, 62, 75, 88]) stats(`equal q=${q}`, (i) => [syntheticSheet({ id: 'H', quality: q, seed: 'l' + i }), syntheticSheet({ id: 'A', quality: q, seed: 'l' + i })]);
console.log('--- gap (home stronger by d)  total goals should not drift if no inflation');
for (const d of [0, 8, 15, 25, 40]) stats(`home +${d}`, (i) => [syntheticSheet({ id: 'H', quality: 62 + d / 2, seed: 'g' + i }), syntheticSheet({ id: 'A', quality: 62 - d / 2, seed: 'g' + i })]);
console.log('--- spread of starters (same mean 62)');
for (const s of [1, 4, 8, 12]) stats(`spread sd=${s}`, (i) => [syntheticSheet({ id: 'H', quality: 62, spread: s, seed: 'p' + i }), syntheticSheet({ id: 'A', quality: 62, spread: s, seed: 'p' + i })]);
console.log('--- left/right mirror: strong players on left side vs on right side, vs same opponent');
function side(tag: 'L' | 'R', i: number): TeamSheet {
  const s = syntheticSheet({ id: 'X', quality: 60, seed: 'm' + i });
  const fm = formationOf(s.tactics.formation);
  s.players.forEach((p, k) => {
    if (k >= 11) return; const pos = fm.slots[k];
    const hit = tag === 'L' ? pos === 'LB' || pos === 'LW' : pos === 'RB' || pos === 'RW';
    if (hit) { for (const key of Object.keys(p.attrs) as (keyof typeof p.attrs)[]) p.attrs[key] = Math.min(99, p.attrs[key] + 15); }
  });
  return s;
}
const opp = (i: number) => syntheticSheet({ id: 'O', quality: 60, seed: 'o' + i });
stats('strong LEFT side home vs avg', (i) => [side('L', i), opp(i)]);
stats('strong RIGHT side home vs avg', (i) => [side('R', i), opp(i)]);
stats('avg home vs strong LEFT away', (i) => [opp(i), side('L', i)]);
stats('avg home vs strong RIGHT away', (i) => [opp(i), side('R', i)]);
