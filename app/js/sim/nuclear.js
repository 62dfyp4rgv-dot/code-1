// Nuclear escalation: a single-use strike with heavy world consequences.
import { clamp } from './constants.js';
import { addTimedMod } from './mods.js';
import { worldOpinionShift } from './diplomacy.js';
import { sideOf, enemiesOf } from './war.js';

// ---------------------------------------------------------------------------------------------------- nuclear escalation
// A nuclear-armed belligerent can use a weapon against an enemy-held region. It is an irreversible escalation: the target region is
// devastated and loses people and forces, but the user becomes a pariah (opinion, credibility, investment confidence, oil price).
export function nuclearOptions(sim, actor, enemy) {
  const st = sim.state;
  const geo = sim.geo;
  const reg = st.reg;
  const out = [];
  for (let r = 0; r < reg.owner.length; r++) {
    if (reg.owner[r] !== enemy && reg.ctrl[r] !== enemy) continue;
    const near =
      geo.regions[r].adj.some((a) => reg.ctrl[a.to] === actor) || (sim.forcesAtRegion.get(r) || []).some((f) => f.owner === enemy);
    if (near) out.push(r);
  }
  return out;
}
export function nuclearStrike(sim, actor, enemy, region) {
  const st = sim.state;
  const geo = sim.geo;
  const reg = st.reg;
  const c = st.countries[actor];
  const victim = st.countries[enemy];
  if (!(c.mil.nukes > 0)) return { ok: false, reason: 'no nuclear weapons' };
  if (!enemiesOf(sim, actor).has(enemy)) return { ok: false, reason: 'not at war with that country' };
  const opts = nuclearOptions(sim, actor, enemy);
  const r = region !== undefined && region !== null ? region : opts.sort((a, b) => geo.regions[b].popW - geo.regions[a].popW)[0];
  if (r === undefined || !opts.includes(r)) return { ok: false, reason: 'no valid target region' };
  const share = geo.regions[r].popW;
  reg.dev[r] = clamp(reg.dev[r] + 0.7, 0, 0.95);
  const deaths = victim.pop.total * Math.min(0.12, 0.02 + 0.1 * share);
  victim.pop.total = Math.max(0.01, victim.pop.total - deaths);
  for (const f of sim.forcesAtRegion.get(r) || []) f.size = Math.max(0.05, f.size * 0.35);
  victim.econ.infra = clamp(victim.econ.infra - 0.04 - 0.1 * share, 0.05, 0.98);
  victim.gov.stability = clamp(victim.gov.stability - 0.12, 0.01, 0.98);
  victim.mil.exhaustion = clamp(victim.mil.exhaustion + 0.15, 0, 1);
  for (const w of st.wars)
    if (w.active && sideOf(w, actor) && sideOf(w, enemy)) w.score[sideOf(w, actor)] = clamp(w.score[sideOf(w, actor)] + 30, -50, 100);
  // the world reacts
  worldOpinionShift(sim, actor, -35, 0.8);
  c.dip.credibility = clamp(c.dip.credibility - 35, 0, 100);
  c.dip.infamy = (c.dip.infamy || 0) + 40;
  c.gov.legitimacy = clamp(c.gov.legitimacy - 0.08, 0.02, 0.98);
  st.prices[1] = clamp(st.prices[1] * 1.25, 0.35, 6);
  for (const x of st.countries) addTimedMod(x, 'invest.conf', -0.05, st.day + 36 * 30, 'nuclear use');
  st.world.nuclearUse = (st.world.nuclearUse || 0) + 1;
  sim.log(actor, 'war', `${c.name} uses a nuclear weapon against ${victim.name}`, { war: true, att: actor, def: enemy }, 'high');
  sim.emit('nuclear', { by: actor, on: enemy, region: r });
  return { ok: true, region: r, deaths };
}
