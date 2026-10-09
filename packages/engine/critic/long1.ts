import { createWorld, advanceToEndOfSeason } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { allPlayers, squadOf } from '../src/world/runtime';
import { overall } from '../src/players';
import { encodeWorld } from '../src/persistence/codec';
import { validateWorld } from '../src/world/invariants';
import { LEAGUE_BY_ID } from '../src/competition/registry';

const S = Number(process.env.S ?? 8);
const preset = (process.env.PRESET as 'compact' | 'standard') ?? 'compact';
const w = createWorld(defaultWorldConfig('critic-long', preset));
const t00 = Date.now();
console.log('clubs', Object.keys(w.clubs).length, 'players', Object.keys(w.players).length, 'createWorld ms', Date.now() - t00);
const titles: Record<string, Record<string, number>> = {};
for (let s = 1; s <= S; s++) {
  const t0 = Date.now();
  advanceToEndOfSeason(w);
  const ms = Date.now() - t0;
  const all = allPlayers(w);
  const active = all.filter((p) => !p.retired);
  const retired = all.length - active.length;
  const sizes = Object.values(w.clubs).map((c) => squadOf(w, c.id).length);
  const cash = Object.values(w.clubs).map((c) => c.finance.cash).sort((a, b) => a - b);
  const debt = Object.values(w.clubs).map((c) => c.finance.debt).sort((a, b) => a - b);
  const wageBill = Object.values(w.clubs).map((c) => squadOf(w, c.id).reduce((a, p) => a + (p.contract?.wageWeekly ?? 0), 0) * 52);
  const rev = Object.values(w.clubs).map((c) => c.finance.broadcastingAnnual + c.finance.sponsorshipAnnual);
  const ratio = wageBill.map((x, i) => x / rev[i]!);
  const ovs = active.map(overall).sort((a, b) => b - a);
  const mgrAges = Object.values(w.managers).map((m) => (w.day - m.birthDay) / 365.25);
  const noMgr = Object.values(w.clubs).filter((c) => !c.managerId).length;
  const last = w.history.seasons[w.history.seasons.length - 1]!;
  for (const [lid, ch] of Object.entries(last.champions)) if (LEAGUE_BY_ID[lid]) { (titles[lid] ??= {}); if (ch.winner) titles[lid]![ch.winner] = (titles[lid]![ch.winner] ?? 0) + 1; }
  const sz = JSON.stringify(encodeWorld ? 0 : 0);
  let bytes = -1; try { const enc: any = encodeWorld(w); bytes = JSON.stringify(enc).length; } catch (e) { bytes = -2; }
  const warn = w.news.filter((n) => n.text.startsWith('Scheduling warning')).length;
  const gpm = Object.values(last.leagueStats).reduce((a, l) => a + l.goalsPerMatch * l.matches, 0) / Object.values(last.leagueStats).reduce((a, l) => a + l.matches, 0);
  const v = validateWorld(w, { checkLedger: false }).filter((x) => x.severity !== 'medium');
  console.log(`S${s} ${ms}ms players ${all.length} (active ${active.length}, retired ${retired}) squad[min ${Math.min(...sizes)} max ${Math.max(...sizes)}] ov[max ${ovs[0]!.toFixed(1)} p99 ${ovs[Math.floor(ovs.length * .01)]!.toFixed(1)} mean ${(ovs.reduce((a, b) => a + b, 0) / ovs.length).toFixed(1)}]`);
  console.log(`   cash[min ${(cash[0]! / 1e6).toFixed(0)}M max ${(cash[cash.length - 1]! / 1e6).toFixed(0)}M] debt[max ${(debt[debt.length - 1]! / 1e6).toFixed(0)}M] wage/rev[min ${Math.min(...ratio).toFixed(2)} max ${Math.max(...ratio).toFixed(2)}] mgrAge max ${Math.max(...mgrAges).toFixed(0)} noMgr ${noMgr} pool ${w.managerPool.length}`);
  console.log(`   news ${w.news.length} transfers ${w.transfers.length} matches ${Object.keys(w.matches).length} hist ${w.history.seasons.length} saveJSON ${(bytes / 1e6).toFixed(1)}MB goals/match ${gpm.toFixed(2)} schedWarn ${warn} violations ${v.length} ${v.slice(0, 2).map((x) => x.code).join(',')}`);
}
console.log('titles by league (club:count) top share');
for (const [lid, t] of Object.entries(titles)) { const e = Object.entries(t).sort((a, b) => b[1] - a[1]); console.log(' ', lid, e.slice(0, 3).map(([c, n]) => `${w.clubs[c]!.name}(${c}):${n}`).join(' '), `distinct winners ${e.length}/${S}`); }
