import { createWorld, advanceDay } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { squadOf } from '../src/world/runtime';
import { seasonStartDay } from '../src/world/calendar';
import { LEAGUE_BY_ID } from '../src/competition/registry';

const S = Number(process.env.S ?? 3);
const w = createWorld(defaultWorldConfig('critic-w2', 'compact'));
let ledgerSnap: any = null;
while (w.season <= S) {
  if (w.season === S && w.day === seasonStartDay(S) + 362) {
    ledgerSnap = Object.values(w.clubs).map((c) => ({ id: c.id, name: c.name, lg: c.leagueId, rep: c.reputation, led: { ...c.finance.seasonLedger }, cash: c.finance.cash, debt: c.finance.debt, wageBudget: c.finance.wageBudgetWeekly, bill: squadOf(w, c.id).reduce((a, p) => a + (p.contract && !p.loan ? p.contract.wageWeekly : 0), 0), wealth: c.ownership.wealth, kind: c.ownership.kind }));
  }
  advanceDay(w);
}
const T = w.transfers;
const kinds: Record<string, number> = {};
for (const t of T) kinds[t.kind] = (kinds[t.kind] ?? 0) + 1;
console.log('transfer record kinds over', S, 'seasons:', JSON.stringify(kinds));
// loan then release by borrower
const byPlayer = new Map<string, typeof T>();
for (const t of T) { const l = byPlayer.get(t.playerId) ?? []; l.push(t); byPlayer.set(t.playerId, l); }
let loans = 0, loanRelease = 0, loanThenSoldFree = 0; const ex: string[] = [];
for (const [pid, list] of byPlayer) {
  list.sort((a, b) => a.day - b.day);
  for (let i = 0; i < list.length; i++) {
    const t = list[i]!;
    if (t.kind !== 'loan') continue;
    loans++;
    const nxt = list.slice(i + 1).find((x) => x.kind === 'loanReturn' || x.kind === 'release' || x.kind === 'free');
    if (nxt && nxt.kind === 'release' && nxt.fromClubId === t.toClubId) { loanRelease++; if (ex.length < 3) ex.push(`${pid}: loaned ${t.fromClubId}->${t.toClubId} day ${t.day}, RELEASED by borrower day ${nxt.day}`); }
  }
}
console.log(`[loans] ${loans} loans; ${loanRelease} were ended by the BORROWER releasing the parent's player into free agency`, ex);
// emergency youth outside rollover day
const youth = T.filter((t) => t.kind === 'youth');
const rolloverDays = new Set<number>(); for (let s = 1; s <= S; s++) rolloverDays.add(seasonStartDay(s));
const emerg = youth.filter((t) => !rolloverDays.has(t.day) && !rolloverDays.has(t.day + 1));
console.log(`[youth] ${youth.length} academy/emergency creations; ${emerg.length} outside season-rollover days (ensureFieldable / aiFillSquad cover)`);
// flip: free signing then transfer within 120 days; ping-pong
let flips = 0, pingpong = 0, multi = 0;
for (const [pid, list] of byPlayer) {
  const mv = list.filter((t) => t.kind === 'transfer' || t.kind === 'free');
  for (let i = 0; i + 1 < mv.length; i++) { if (mv[i]!.kind === 'free' && mv[i + 1]!.kind === 'transfer' && mv[i + 1]!.day - mv[i]!.day < 120) flips++; }
  for (let i = 0; i + 2 < mv.length; i++) if (mv[i]!.fromClubId === mv[i + 2]!.toClubId && mv[i + 2]!.day - mv[i]!.day < 365 && mv[i]!.kind === 'transfer') pingpong++;
  const yr = mv.filter((t) => t.day >= 0).length; if (mv.length >= 4) multi++;
}
console.log(`[transfers] free-signing flipped by sale <120d: ${flips}; A->B->A within a year: ${pingpong}; players with >=4 moves: ${multi}`);
// wage compliance
const over = ledgerSnap.filter((c: any) => c.bill > c.wageBudget * 1.1);
console.log(`[wages] clubs whose weekly wage bill exceeds wageBudget by >10% at end of S${S}: ${over.length}/${ledgerSnap.length}; max bill/budget ${Math.max(...ledgerSnap.map((c: any) => c.bill / c.wageBudget)).toFixed(2)}`);
// ledger-based
const rows = ledgerSnap.map((c: any) => {
  const L = c.led; const rev = ['broadcasting', 'sponsorship', 'matchday', 'prizeMoney'].reduce((a, k) => a + (L[k] ?? 0), 0);
  const wages = -(L.wages ?? 0);
  return { ...c, rev, wages, ratio: wages / rev, profit: Object.entries(L).reduce((a: number, [k, v]: any) => a + (['ownerInjection', 'borrowing', 'debtRepayment'].includes(k) ? 0 : v), 0) };
});
rows.sort((a: any, b: any) => b.ratio - a.ratio);
console.log('[finance] highest wages/revenue (season ledger up to day 362):');
for (const r of rows.slice(0, 5)) console.log(`   ${r.name} (${r.lg}, rep ${r.rep}, ${r.kind}) rev ${(r.rev / 1e6).toFixed(0)}M wages ${(r.wages / 1e6).toFixed(0)}M ratio ${r.ratio.toFixed(2)} ownerInjection ${((r.led.ownerInjection ?? 0) / 1e6).toFixed(0)}M borrowing ${((r.led.borrowing ?? 0) / 1e6).toFixed(0)}M dividends ${((r.led.dividends ?? 0) / 1e6).toFixed(0)}M`);
const med = (xs: number[]) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
console.log('[finance] median wages/revenue', med(rows.map((r: any) => r.ratio)).toFixed(2), ' clubs with ratio>1:', rows.filter((r: any) => r.ratio > 1).length, '/', rows.length);
const top = [...rows].sort((a: any, b: any) => b.cash - a.cash).slice(0, 3);
console.log('[finance] top cash:', top.map((r: any) => `${r.name} ${(r.cash / 1e6).toFixed(0)}M (rev ${(r.rev / 1e6).toFixed(0)}M, profit ${(r.profit / 1e6).toFixed(0)}M)`).join(' | '));
const injected = rows.reduce((a: number, r: any) => a + (r.led.ownerInjection ?? 0), 0), borrowed = rows.reduce((a: number, r: any) => a + (r.led.borrowing ?? 0), 0);
console.log(`[money] in one season: owner injections ${(injected / 1e9).toFixed(2)}bn, borrowing ${(borrowed / 1e9).toFixed(2)}bn, total revenue ${(rows.reduce((a: number, r: any) => a + r.rev, 0) / 1e9).toFixed(2)}bn, dividends paid at last rollover (not in ledger yet)`);
