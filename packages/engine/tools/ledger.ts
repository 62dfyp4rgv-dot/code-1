import { createWorld, advanceToEndOfSeason } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { squadOf } from '../src/world/runtime';
const cfg = defaultWorldConfig('ledger', 'compact'); cfg.leagues = ['ENG1', 'SAU1', 'USA1', 'ESP1'];
const w = createWorld(cfg);
advanceToEndOfSeason(w); advanceToEndOfSeason(w);
// capture ledger BEFORE rollover resets: re-run third season day by day until last day
const season = w.season;
while (w.day < (season) * 364 - 1) { const { advanceDay } = await import('../src/world/sim'); advanceDay(w); }
const tot: Record<string, number> = {}; const clubs = Object.values(w.clubs);
for (const c of clubs) for (const [k, v] of Object.entries(c.finance.seasonLedger)) tot[k] = (tot[k] ?? 0) + v;
console.log('avg per club (m EUR) — season', season);
for (const [k, v] of Object.entries(tot).sort((a, b) => b[1] - a[1])) console.log(' ', k.padEnd(22), (v / clubs.length / 1e6).toFixed(1));
const net = Object.values(tot).reduce((a, b) => a + b, 0) / clubs.length / 1e6; console.log('  NET avg per club', net.toFixed(1));
const rich = [...clubs].sort((a, b) => b.finance.cash - a.finance.cash)[0]!;
console.log('richest', rich.name, 'cash', (rich.finance.cash / 1e6).toFixed(0), 'wageBudget/wk', (rich.finance.wageBudgetWeekly / 1e6).toFixed(2), 'wage bill/wk', (squadOf(w, rich.id).reduce((a, p) => a + (p.contract?.wageWeekly ?? 0), 0) / 1e6).toFixed(2), 'transferBudget', (rich.finance.transferBudget / 1e6).toFixed(0), 'wealth', rich.ownership.wealth, rich.ownership.kind);
console.log(Object.entries(rich.finance.seasonLedger).map(([k, v]) => `${k}:${(v / 1e6).toFixed(0)}`).join(' '));
