// AI economic layer: budget composition, lever steering (via commands, PC-limited), research & technology adoption.
import { clamp, BUDGET_CATS } from '../sim/constants.js';
import { techAvailable, techCostRP, canAdopt, adoptionCost } from '../sim/research.js';
import { ideologyDistance, policyIdeology } from '../sim/politics.js';

export function manageEconomy(sim, c, view) {
  const e = c.econ, A = c.ai, t = c.target, m = c.mil, p = c.policy;
  const atWar = sim.atWar(c.idx);
  // ---- budget composition (routine administration, free like the player's auto-budget) ----
  const spend = Math.max(0.1, t.spendRate);
  const f0 = e.fiscal0;
  const defWant = clamp((m.D0 / e.gdp0) * (0.75 + 0.9 * A.threat) + (atWar ? 0.025 : 0), 0.004, 0.16);
  const w = {
    health: f0.health * (1 + 1.2 * Math.max(0, 0.62 - c.pop.health) + 0.5 * Math.max(0, c.pop.elder - 0.15)),
    education: f0.education * (1 + 1.2 * Math.max(0, 0.6 - c.pop.edu)),
    welfare: f0.welfare * (1 + 1.0 * Math.max(0, e.poverty - 0.12) + 1.0 * Math.max(0, c.gov.unrest - 0.35) - 0.4 * (c.gov.dem < 30 ? 1 : 0)),
    infrastructure: f0.infrastructure * (1 + 1.4 * Math.max(0, 0.55 - e.infra) + 0.8 * Math.max(0, e.util - 1.02) + 3 * (e.shortage[1] + e.shortage[2]) + 2 * e.warLoss),
    research: f0.research * (1 + 0.8 * A.w.prosperity * (c.dev0 > 0.3 ? 1 : 0.2) - 0.5 * Math.max(0, e.deficit / e.gdp - 0.05) * 5),
    admin: f0.admin * (1 + 1.5 * Math.max(0, c.gov.corruption - 0.45) + 1.0 * Math.max(0, 0.45 - c.gov.stability)),
    subsidies: f0.subsidies * (1 + 8 * Math.max(0, e.infl - 0.06) + 6 * e.shortage[0]),
  };
  let wsum = 0; for (const k in w) wsum += w[k];
  const rest = Math.max(0.05, 1 - defWant / spend);
  for (const k of BUDGET_CATS) {
    const desired = k === 'defense' ? defWant / spend : (w[k] / wsum) * rest;
    t.budget[k] += 0.12 * (desired - t.budget[k]);
  }
  let s = 0; for (const k of BUDGET_CATS) s += t.budget[k]; for (const k of BUDGET_CATS) t.budget[k] /= s;
  // ---- discrete lever steering through commands ----
  const day = sim.state.day; if (((day / 30) | 0) % 3 !== c.idx % 3) { researchMgmt(sim, c); return; }
  const tryPolicy = (key, value) => { if (Math.abs(t[key] - value) > 0.02) sim.exec({ type: 'setPolicy', actor: c.idx, key, value }); };
  const energyDep = (e.imports[1] + e.imports[2] - e.exports[1] - e.exports[2]) / e.gdp;
  if (energyDep > 0.03 || (sim.state.world.temp > 1.4 && c.dev0 > 0.5)) tryPolicy('cleanPriority', clamp(t.cleanPriority + 0.08, 0, 0.9));
  else if (energyDep < -0.02 && c.gov.type !== 'lib_dem') tryPolicy('cleanPriority', clamp(t.cleanPriority - 0.04, 0.05, 1));
  if (c.pop.elder > 0.2 && e.unemp < 0.06) tryPolicy('immigration', clamp(t.immigration + 0.08, 0, 0.9));
  if (e.unemp > 0.11) tryPolicy('immigration', clamp(t.immigration - 0.08, 0.05, 1));
  const idea = c.gov.leader.ideology;
  if (idea) tryPolicy('tariff', clamp(0.07 + 0.08 * idea.nation + (c.dev0 < 0.3 ? 0.04 : 0), 0, 0.3));
  if (A.threat > 1.0 && !atWar && t.conscription < 1) sim.exec({ type: 'setPolicy', actor: c.idx, key: 'conscription', value: 1 });
  if (atWar && A.threat > 1.2 && t.conscription < 2) sim.exec({ type: 'setPolicy', actor: c.idx, key: 'conscription', value: 2 });
  if (!atWar && A.threat < 0.4 && t.conscription > 0 && c.dev0 > 0.5) sim.exec({ type: 'setPolicy', actor: c.idx, key: 'conscription', value: 0 });
  if (c.gov.unrest > 0.5 && c.gov.type !== 'lib_dem') tryPolicy('surveillance', clamp(t.surveillance + 0.08, 0, 1));
  researchMgmt(sim, c);
}

const BRANCH_NEED = (c, A, e) => ({
  military: 0.4 + 1.2 * A.threat, energy: 0.5 + 2 * (e.shortage[1] + e.shortage[2]) + 0.8 * Math.max(0, (e.imports[1] + e.imports[2] - e.exports[1] - e.exports[2]) / e.gdp * 10), civil: 0.8,
  industrial: 0.8 + (c.dev0 < 0.5 ? 0.4 : 0), medical: 0.6 + 0.8 * Math.max(0, 0.65 - c.pop.health) + 0.5 * c.pop.elder * 3, computing: 0.5 + c.dev0, communications: 0.5 + 0.3 * c.dev0, environment: 0.3 + 0.5 * Math.max(0, sim0Temp - 1.3),
});
let sim0Temp = 1.2;
function researchMgmt(sim, c) {
  const A = c.ai, e = c.econ, tech = c.tech;
  sim0Temp = sim.state.world.temp;
  const need = BRANCH_NEED(c, A, e);
  if (tech.queue.length < tech.slots + 1) {
    let best = null, bs = -1;
    for (const t of sim.data.techs) {
      if (!techAvailable(sim, c, t) || tech.queue.some((q) => q.id === t.id) || tech.adopting.some((a) => a.id === t.id)) continue;
      const cost = techCostRP(sim, c, t); const months = cost / Math.max(0.01, tech.rp);
      if (months > 96) continue;
      const sc = (need[t.branch] ?? 0.5) * (1 + 0.1 * t.tier) / Math.sqrt(cost);
      if (sc > bs) { bs = sc; best = t; }
    }
    if (best) sim.exec({ type: 'queueTech', actor: c.idx, tech: best.id });
  }
  if (!tech.adopting.length && c.gov.pc > 20) {
    let best = null, bs = -1;
    for (const t of sim.data.techs) {
      if (!canAdopt(sim, c, t)) continue; const cost = adoptionCost(sim, c, t);
      if (cost > 0.012 * e.gdp || e.deficit / e.gdp > 0.06) continue;
      const sc = (need[t.branch] ?? 0.5) / (cost + 0.1); if (sc > bs) { bs = sc; best = t; }
    }
    if (best) sim.exec({ type: 'adoptTech', actor: c.idx, tech: best.id });
  }
}
