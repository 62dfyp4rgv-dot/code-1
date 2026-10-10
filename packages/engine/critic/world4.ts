import { createWorld, advanceDay } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { squadOf } from '../src/world/runtime';
const cfg = defaultWorldConfig('critic-w4', 'compact');
const w0 = createWorld(cfg);
const w = createWorld({ ...cfg, humanClubId: Object.keys(w0.clubs)[2]! });
const me = w.clubs[w.config.humanClubId!]!;
me.finance.cash = 3e9; me.finance.seasonStartCash = 3e9;
while (w.day < 363) advanceDay(w);
const cashBefore = me.finance.cash;
const wagesBefore = new Map(squadOf(w, me.id).map((p) => [p.id, p.contract!.wageWeekly]));
const fac0 = { ...me.facilities };
const prospects0 = squadOf(w, me.id).filter((p) => p.contract?.squadRole === 'prospect').length;
advanceDay(w); // rollover day
const cashAfter = me.finance.cash;
const raised = squadOf(w, me.id).filter((p) => wagesBefore.has(p.id) && p.contract && p.contract.wageWeekly > wagesBefore.get(p.id)!).length;
console.log(`[human club at rollover] cash ${(cashBefore / 1e6).toFixed(0)}M -> ${(cashAfter / 1e6).toFixed(0)}M (dividends/facility spend taken automatically; includes last-day match income); wages auto-raised for ${raised} of ${wagesBefore.size} players without any user action; prospects ${prospects0} -> ${squadOf(w, me.id).filter((p) => p.contract?.squadRole === 'prospect').length}; facilities ${JSON.stringify(fac0)} -> ${JSON.stringify(me.facilities)}`);
