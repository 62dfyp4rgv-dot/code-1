import { createWorld, advanceToEndOfSeason } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { overall, ageOf } from '../src/players';
import { squadOf, allPlayers } from '../src/world/runtime';
import { validateWorld } from '../src/world/invariants';
import { LEAGUE_BY_ID } from '../src/competition/registry';
const preset = (process.argv[2] ?? 'compact') as 'compact' | 'standard';
const seasons = Number(process.argv[3] ?? 8);
const leagueArg = process.argv[5];
const cfg = defaultWorldConfig(process.argv[4] ?? 'longrun', preset);
if (leagueArg) cfg.leagues = leagueArg.split(',');
const w = createWorld(cfg);
const f = (x: number, d = 1): string => x.toFixed(d);
const champs: Record<string, string[]> = {};
const ageBuckets = (): string => {
  const b: Record<string, number[]> = {};
  for (const p of allPlayers(w)) { if (p.retired || !p.clubId) continue; const a = Math.floor(ageOf(p, w.day)); const k = a < 19 ? '<19' : a < 22 ? '19-21' : a < 26 ? '22-25' : a < 30 ? '26-29' : a < 34 ? '30-33' : '34+'; (b[k] ??= []).push(overall(p)); }
  return ['<19', '19-21', '22-25', '26-29', '30-33', '34+'].map((k) => `${k}:${f((b[k] ?? [0]).reduce((x, y) => x + y, 0) / (b[k]?.length || 1), 1)}(${b[k]?.length ?? 0})`).join(' ');
};
for (let s = 0; s < seasons; s++) {
  const t0 = performance.now();
  advanceToEndOfSeason(w);
  const sum = w.history.seasons.at(-1)!;
  for (const lid of Object.keys(sum.tables)) if (LEAGUE_BY_ID[lid]?.tier === 1) (champs[lid] ??= []).push(w.clubs[w.history.champions[lid]![sum.season]!.winner!]!.shortName);
  const players = allPlayers(w).filter((p) => !p.retired);
  const ovs = players.filter((p) => p.contract?.squadRole !== 'prospect').map(overall).sort((a, b) => b - a);
  const clubs = Object.values(w.clubs);
  const cash = clubs.map((c) => c.finance.cash / 1e6).sort((a, b) => a - b);
  const wagesPerClub = clubs.map((c) => squadOf(w, c.id).reduce((a, p) => a + (p.contract?.wageWeekly ?? 0), 0) * 52 / 1e6).sort((a, b) => a - b);
  const viol = validateWorld(w, { checkLedger: true }).filter((v) => v.severity !== 'medium');
  const gpm = Object.entries(sum.leagueStats).filter(([k]) => LEAGUE_BY_ID[k]?.tier === 1);
  console.log(`S${sum.season} ${f((performance.now() - t0) / 1000)}s | G/m ${f(gpm.reduce((a, [, x]) => a + x.goalsPerMatch * x.matches, 0) / gpm.reduce((a, [, x]) => a + x.matches, 0), 2)} | players ${players.length} top5 ${ovs.slice(0, 5).map((x) => f(x, 0)).join('/')} p95 ${f(ovs[Math.floor(ovs.length * 0.05)]!, 0)} med ${f(ovs[Math.floor(ovs.length / 2)]!, 0)} | cash med ${f(cash[Math.floor(cash.length / 2)]!, 0)} p95 ${f(cash[Math.floor(cash.length * 0.95)]!, 0)} max ${f(cash.at(-1)!, 0)}m | wages med ${f(wagesPerClub[Math.floor(wagesPerClub.length / 2)]!, 0)} max ${f(wagesPerClub.at(-1)!, 0)}m | viol ${viol.length}${viol.length ? ' ' + viol[0]!.code + ':' + viol[0]!.message : ''}`);
  console.log('   ages', ageBuckets());
}
console.log('champions per league:'); for (const [k, v] of Object.entries(champs)) console.log(' ', k.padEnd(5), v.join(' '), '| distinct', new Set(v).size);
const rep = clubs().map((c) => c.reputation).sort((a, b) => a - b);
function clubs() { return Object.values(w.clubs); }
console.log('reputation min/med/max', rep[0], rep[Math.floor(rep.length / 2)], rep.at(-1));
