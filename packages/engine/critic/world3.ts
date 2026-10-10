import { createWorld, advanceDay } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { squadOf, loanedOutOf } from '../src/world/runtime';
import { leagueSquadRules, foreignCount } from '../src/world/squad';
import { playerProfile } from '../src/world/views';
import { overall, positionalOverall } from '../src/players';
import { scoutedEstimate } from '../src/world/transfers';

const cfg = defaultWorldConfig('critic-w3', 'compact');
const w0 = createWorld(cfg);
const w = createWorld({ ...cfg, humanClubId: Object.keys(w0.clubs)[2]! });
let maxSenior = 0, over = 0, checks = 0, overRule = 0; const worst: string[] = []; let foreignOver = 0, fchecks = 0;
for (let d = 0; d < 364 * 2; d++) {
  advanceDay(w);
  if (d % 14 !== 0) continue;
  for (const c of Object.values(w.clubs)) {
    const r = leagueSquadRules(w, c);
    const seniors = squadOf(w, c.id).filter((p) => p.contract?.squadRole !== 'prospect').length;
    checks++; maxSenior = Math.max(maxSenior, seniors);
    if (seniors > r.maxSquadSize) { over++; }
    if (seniors > r.maxSquadSize + 4) { overRule++; if (worst.length < 3) worst.push(`${c.name} ${c.leagueId} ${seniors}/${r.maxSquadSize} day ${w.day}`); }
    if (r.maxForeign !== null) { fchecks++; if (foreignCount(w, c) > r.maxForeign) foreignOver++; }
  }
}
console.log(`[squad cap] sampled every 14 days over 2 seasons: ${over}/${checks} club-samples exceed maxSquadSize; ${overRule} exceed even the hard +4 tolerance; max senior squad ${maxSenior}`, worst);
console.log(`[foreign cap] ${foreignOver}/${fchecks} club-samples (leagues with a cap, counting loaned-out) exceed maxForeign`);
// scouting leak
const me = w.clubs[w.config.humanClubId!]!;
let errView = 0, errScout = 0, n = 0;
for (const p of Object.values(w.players)) {
  if (p.retired || p.clubId === null || p.clubId === me.id) continue;
  const prof = playerProfile(w, p.id)!;
  // reconstruct overall from the coarse attribute view
  const attrs: any = {}; for (const g of Object.values(prof.attributes)) for (const a of g) attrs[a.name] = a.value;
  const est = (await import('../src/players')).overallForPosition(attrs, p.primary);
  errView += Math.abs(est - overall(p)); errScout += Math.abs(scoutedEstimate(w, me, p).ability - overall(p)); n++;
  if (n >= 3000) break;
}
console.log(`[info leak] mean |error| of the player's true overall: scouting estimate ${(errScout / n).toFixed(2)} vs rebuilt from playerProfile() 'coarse' attributes ${(errView / n).toFixed(2)} over ${n} non-own players`);
// positions leak
const p0 = Object.values(w.players).find((p) => p.clubId && p.clubId !== me.id && !p.retired)!;
console.log('[info leak] playerProfile positions[].rating is exact positionalOverall:', JSON.stringify(playerProfile(w, p0.id)!.positions), 'true', Math.round(positionalOverall(p0, p0.primary)), 'scouted', Math.round(scoutedEstimate(w, me, p0).ability));
