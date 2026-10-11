// Research & technology: RP generation, project queue, adoption (diffusion) with cost, tech modifiers.
import { clamp } from './constants.js';
import { modv, recomputeTechMods } from './mods.js';
import { hash01 } from './rng.js';
import { bump } from './achievements.js';

export function initResearch(sim, c, row) {
  const { data } = sim;
  const dev = c.dev0;
  const mt = c.prof.mt ?? clamp(0.45 + 0.9 * dev, 0.3, 1.3);
  const known = [];
  for (const t of data.techs) {
    const bias = hash01(row.iso3 + t.id) * 0.14 - 0.07;
    const lvl = t.branch === 'military' ? clamp((mt - 0.4) / 1.0, 0, 1) * 0.95 + bias : dev * 1.18 + bias;
    if (lvl >= t.devReq) known.push(t.id);
  }
  // ensure prerequisites closure
  const set = new Set(known);
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of [...set])
      for (const r of data.techById[id].req)
        if (!set.has(r)) {
          set.delete(id);
          changed = true;
          break;
        }
  }
  c.tech = { known: [...set], queue: [], adopting: [], rp: 0, slots: 1, progressLog: [] };
  c.mt = mt;
  recomputeTechMods(c, data);
}
export function researchSlots(c) {
  return clamp(1 + Math.floor(Math.log2(1 + (c.spendCat ? c.spendCat.research : 0.5) / 2)), 1, 5);
}

export function techAvailable(sim, c, t) {
  if (c.tech.known.includes(t.id)) return false;
  return t.req.every((r) => c.tech.known.includes(r));
}
export function adoptionShare(sim, id) {
  return (sim.state.techAdopt[id] || 0) / Math.max(1, sim.state.topEconomies.length);
}
export function techCostRP(sim, c, t) {
  return t.cost * (1 - 0.6 * adoptionShare(sim, t.id)) * (1.0 + (0.04 * c.tech.known.length) / 10);
}
export function adoptionCost(sim, c, t) {
  return Math.max(0.2, 0.0006 * t.cost * Math.pow(c.econ.gdp, 0.6));
}
export function canAdopt(sim, c, t) {
  return techAvailable(sim, c, t) && adoptionShare(sim, t.id) >= 0.2 && !c.tech.adopting.some((a) => a.id === t.id) && c.pop.edu > 0.25;
}

export function researchStep(sim, c, day) {
  const e = c.econ,
    tech = c.tech;
  const spendBn = c.spendCat ? c.spendCat.research : 0;
  const rp =
    0.35 * Math.pow(Math.max(0, spendBn), 0.9) * (0.6 + 0.8 * c.pop.edu) * (1 + modv(c, 'research.eff')) * (0.7 + 0.3 * c.gov.stability);
  tech.rp = rp;
  tech.slots = researchSlots(c);
  e.researchIdx = clamp(spendBn / e.gdp / 0.025, 0, 1.5) * c.pop.edu;
  // projects
  const active = tech.queue.slice(0, tech.slots);
  const per = active.length ? rp / active.length : 0;
  for (const proj of active) {
    const t = sim.data.techById[proj.id];
    if (!t) continue;
    proj.progress += per;
    if (proj.progress >= techCostRP(sim, c, t)) completeTech(sim, c, t, 'research');
  }
  tech.queue = tech.queue.filter((q) => !c.tech.known.includes(q.id));
  // adoption pipelines (costs paid monthly out of the treasury)
  for (const a of tech.adopting) {
    a.left--;
    e.debt += a.monthly;
    if (a.left <= 0) completeTech(sim, c, sim.data.techById[a.id], 'adoption');
  }
  tech.adopting = tech.adopting.filter((a) => a.left > 0);
}
export function completeTech(sim, c, t, how) {
  if (c.tech.known.includes(t.id)) return;
  if (c.idx === sim.state.playerId) bump(sim, 'researched');
  c.tech.known.push(t.id);
  recomputeTechMods(c, sim.data);
  sim.state.techAdopt[t.id] = (sim.state.techAdopt[t.id] || 0) + (sim.state.topEconomies.includes(c.idx) ? 1 : 0);
  sim.log(c.idx, 'tech', `${c.name} completes ${t.name} (${how})`, { tech: t.id, how }, c.idx === sim.state.playerId ? 'high' : 'low');
  sim.emit('tech', { country: c.idx, tech: t.id, how });
}
export function updateTopEconomies(sim) {
  const cs = sim.state.countries;
  sim.state.topEconomies = cs
    .map((c) => c.idx)
    .sort((a, b) => cs[b].econ.gdp - cs[a].econ.gdp)
    .slice(0, 15);
  sim.state.techAdopt = {};
  for (const i of sim.state.topEconomies) for (const id of cs[i].tech.known) sim.state.techAdopt[id] = (sim.state.techAdopt[id] || 0) + 1;
}
