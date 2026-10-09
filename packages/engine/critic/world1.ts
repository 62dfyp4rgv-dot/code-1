import { createWorld, advanceDay, advanceDays, advanceToNextMatchday } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { simulateMatch } from '../src/match';
import { setTactics, offerRenewal, signFreeAgentAction, freeAgentPool, bidLoan } from '../src/world/actions';
import { validateTactics } from '../src/tactics';
import { validateWorld } from '../src/world/invariants';
import { squadOf } from '../src/world/runtime';

function fresh() {
  const cfg = defaultWorldConfig('critic-1', 'compact');
  const w0 = createWorld(cfg);
  const human = Object.keys(w0.clubs)[3]!;
  return createWorld({ ...cfg, humanClubId: human });
}
// ---- 1 replay aliasing
{
  const w = fresh();
  const reps: { id: string; score: string; input: any }[] = [];
  for (let i = 0; i < 60 && reps.length < 1; i++) {
    advanceDay(w);
    for (const id of w.matchOrder) { const m = w.matches[id]; if (m && m.replay && !reps.find((r) => r.id === id)) reps.push({ id, score: `${m.score.home}-${m.score.away}`, input: m.replay }); }
  }
  const r0 = reps[0]!;
  const again0 = simulateMatch(r0.input);
  console.log('[replay] immediately after match: stored', r0.score, 'replayed', `${again0.score.home}-${again0.score.away}`);
  advanceDays(w, 52 * 7 * 2); // two seasons of development / tactics refresh
  const m = w.matches[r0.id];
  const stored = m?.replay as any;
  if (stored) {
    const again = simulateMatch(stored);
    console.log('[replay] after 2 seasons: stored', r0.score, 'replayed', `${again.score.home}-${again.score.away}`);
  } else console.log('[replay] match pruned from archive');
  // attribute aliasing proof
  const pid = r0.input.home.players[0].id; const live = w.players[pid]!;
  console.log('[replay] sheet attrs object is live player attrs:', r0.input.home.players[0].attrs === live.attrs, ' tactics object identity w/ club:', r0.input.home.tactics === w.clubs[r0.input.home.clubId]!.tactics);
}
// ---- 2/3/4 hostile numeric inputs
{
  const w = fresh();
  const human = w.clubs[w.config.humanClubId!]!;
  const squad = squadOf(w, human.id);
  const p = squad[0]!;
  const before = human.finance.cash;
  const res = offerRenewal(w, p.id, NaN, 3);
  console.log('[NaN renewal] result', JSON.stringify(res), 'wage now', p.contract?.wageWeekly, 'endDay', p.contract?.endDay);
  const bad = validateWorld(w).filter((v) => v.code.includes('WAGE'));
  console.log('[NaN renewal] validateWorld WAGE violations:', bad.length);
  advanceDays(w, 8);
  console.log('[NaN renewal] after 8 days cash', human.finance.cash, 'was', before);
  const w2 = fresh(); const h2 = w2.clubs[w2.config.humanClubId!]!;
  const fa = freeAgentPool(w2)[0]!;
  const r2 = signFreeAgentAction(w2, fa.id, Infinity, 3);
  console.log('[Infinity FA wage] result', JSON.stringify(r2), 'cash', h2.finance.cash);
  const w3 = fresh();
  const t = { ...w3.clubs[w3.config.humanClubId!]!.tactics, maxSubs: NaN };
  console.log('[setTactics maxSubs NaN]', JSON.stringify(setTactics(w3, t)));
  console.log('[validateTactics roles=__proto__]');
  for (const r of ['__proto__', 'toString', 'constructor']) {
    try { const e = validateTactics({ ...w3.clubs[w3.config.humanClubId!]!.tactics, roles: [r, ...w3.clubs[w3.config.humanClubId!]!.tactics.roles.slice(1)] }); console.log('  ', r, '->', e); } catch (e) { console.log('  ', r, 'THROWS', String(e).slice(0, 80)); }
  }
  for (const f of ['toString', 'constructor']) {
    try { const e = validateTactics({ ...w3.clubs[w3.config.humanClubId!]!.tactics, formation: f }); console.log('   formation', f, '->', e); } catch (e) { console.log('   formation', f, 'THROWS', String(e).slice(0, 80)); }
  }
  // sim crash from a corrupt club tactics (as a hostile save would provide)
  const w4 = fresh();
  const victim = Object.values(w4.clubs).find((c) => c.id !== w4.config.humanClubId)!;
  victim.tactics.roles[2] = 'toString';
  try { advanceDays(w4, 400); console.log('[sim w/ role=toString] survived 400 days'); } catch (e) { console.log('[sim w/ role=toString] THROWS', String(e).slice(0, 120)); }
}
