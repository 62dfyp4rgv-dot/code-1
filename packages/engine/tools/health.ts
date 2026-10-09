import { createWorld, advanceToEndOfSeason } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { overall } from '../src/players';
import { ageOf } from '../src/players';
import { squadOf } from '../src/world/runtime';
const preset = (process.argv[2] ?? 'compact') as 'compact' | 'standard';
const seasons = Number(process.argv[3] ?? 4);
const seed = process.argv[4] ?? 'health';
const w = createWorld(defaultWorldConfig(seed, preset));
const f = (x: number, d = 2): string => x.toFixed(d);
for (let s = 0; s < seasons; s++) {
  const t0 = performance.now();
  advanceToEndOfSeason(w);
  const sum = w.history.seasons.at(-1)!;
  console.log(`\n== season ${sum.season} (${((performance.now() - t0) / 1000).toFixed(1)}s) ==`);
  const rows = Object.entries(sum.leagueStats).filter(([k]) => ['ENG1', 'ESP1', 'ITA1', 'GER1', 'FRA1', 'SAU1', 'POR1', 'NED1', 'BRA1', 'USA1'].includes(k));
  for (const [lid, st] of rows) console.log(lid.padEnd(5), `n=${String(st.matches).padStart(3)} G/m ${f(st.goalsPerMatch)} H/A ${f(st.homeGoals)}/${f(st.awayGoals)} W/D/L ${f(st.homeWinPct * 100, 0)}/${f(st.drawPct * 100, 0)}/${f(st.awayWinPct * 100, 0)} CS ${f(st.cleanSheetPct * 100, 0)}% Y ${f(st.yellowPerMatch)} R ${f(st.redPerMatch, 3)} champ ${st.championPoints} last ${st.lastPlacePoints} sd ${f(st.pointsSd, 1)}`);
  const clubs = Object.values(w.clubs);
  const squads = clubs.map((c) => squadOf(w, c.id).length);
  const cash = clubs.map((c) => c.finance.cash / 1e6).sort((a, b) => a - b);
  const debt = clubs.map((c) => c.finance.debt / 1e6).sort((a, b) => a - b);
  const players = Object.values(w.players).filter((p) => !p.retired);
  const ages = players.filter((p) => p.clubId).map((p) => ageOf(p, w.day));
  console.log(`squad sizes min/avg/max ${Math.min(...squads)}/${f(squads.reduce((a, b) => a + b, 0) / squads.length, 1)}/${Math.max(...squads)}; cash p5/med/p95 ${f(cash[Math.floor(cash.length * 0.05)]!, 0)}/${f(cash[Math.floor(cash.length / 2)]!, 0)}/${f(cash[Math.floor(cash.length * 0.95)]!, 0)}m; debt med/p95 ${f(debt[Math.floor(debt.length / 2)]!, 0)}/${f(debt[Math.floor(debt.length * 0.95)]!, 0)}m; avg age ${f(ages.reduce((a, b) => a + b, 0) / ages.length, 1)}; free agents ${players.filter((p) => !p.clubId).length}; retired total ${Object.values(w.players).filter((p) => p.retired).length}; players total ${Object.keys(w.players).length}`);
  const top = [...players].sort((a, b) => overall(b) - overall(a)).slice(0, 3).map((p) => `${p.name} ${f(overall(p), 0)} (${f(ageOf(p, w.day), 0)})`).join(', ');
  console.log('best players:', top, '| transfers this season', w.transfers.filter((t) => t.kind === 'transfer' && t.day >= (sum.season - 1) * 364).length, 'loans', w.transfers.filter((t) => t.kind === 'loan' && t.day >= (sum.season - 1) * 364).length);
  console.log('champions:', ['ENG1', 'SAU1', 'UCL', 'ACLE', 'COPA', 'CAFCL', 'CCC'].map((k) => `${k}:${w.clubs[sum.champions[k]?.winner ?? '']?.shortName ?? '-'}`).join(' '));
}
