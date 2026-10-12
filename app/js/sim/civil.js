// Civil conflict: a state that is unstable, restless and under strain can slide into an internal armed conflict (insurgency, separatist
// or factional fighting). It is not a war between countries: there is no second belligerent, but it drains the economy, devastates a
// region, displaces people to neighbours and can end in negotiation, exhaustion or regime change.
import { clamp } from './constants.js';
import { addTimedMod } from './mods.js';
import { worldOpinionShift } from './diplomacy.js';
import { bump } from './achievements.js';

const flag = (c, st) => c.flags.civilWar && c.flags.civilWar > st.day;

export function isCivilConflict(c) {
  return !!c.gov.civil;
}

export function monthlyStep(sim, day) {
  const st = sim.state;
  for (const c of st.countries) {
    const g = c.gov;
    if (!g.civil) {
      if (sim.atWar(c.idx)) continue; // the strain of a foreign war is modelled by exhaustion and regime collapse instead
      const strain =
        0.3 -
        g.stability +
        0.6 * (g.unrest - 0.5) +
        0.3 * (c.econ.gini - 0.45) +
        (c.gov.type === 'hybrid' || c.gov.type === 'military' ? 0.05 : 0);
      if (g.stability < 0.3 && g.unrest > 0.5 && sim.rng.chance(clamp(0.03 + 0.3 * strain, 0, 0.12))) startConflict(sim, c, day);
      continue;
    }
    stepConflict(sim, c, day);
  }
}

function startConflict(sim, c, day) {
  const st = sim.state;
  c.gov.civil = { start: day, intensity: 0.45 + sim.rng.next() * 0.3, calm: 0 };
  c.flags.civilWar = day + 365 * 20;
  sim.log(c.idx, 'war', `Civil conflict erupts in ${c.name}`, { civil: true, c: c.idx }, 'high');
  worldOpinionShift(sim, c.idx, -3, 0.2);
  sim.emit('civil', { country: c.idx, start: true });
  void st;
}

function stepConflict(sim, c, day) {
  const st = sim.state;
  const g = c.gov;
  const cv = g.civil;
  const months = (day - cv.start) / 30;
  // escalation or de-escalation follows how the state is holding up
  const drift = (g.stability < 0.3 ? 0.02 : -0.012) + (g.approval < 0.3 ? 0.01 : -0.005) - 0.004 * (c.econ.util - 0.95);
  cv.intensity = clamp(cv.intensity + drift, 0.05, 1);
  // costs
  addTimedMod(c, 'gdp.shock', -0.0045 * cv.intensity, day + 60, 'civil conflict');
  g.stability = clamp(g.stability - 0.012 * cv.intensity, 0.01, 0.98);
  g.unrest = clamp(g.unrest + 0.006 * cv.intensity, 0, 1);
  c.econ.infra = clamp(c.econ.infra - 0.0015 * cv.intensity, 0.05, 0.98);
  const rs = sim.regionsOf[c.idx];
  if (rs.length && sim.rng.chance(0.5 * cv.intensity)) {
    const r = rs[sim.rng.int(0, rs.length - 1)];
    st.reg.dev[r] = clamp(st.reg.dev[r] + 0.03 * cv.intensity, 0, 0.9);
  }
  // displaced people head for neighbours
  const out = c.pop.total * 0.0007 * cv.intensity;
  const nb = [...sim.geo.neighbors[c.idx]];
  if (out > 0) {
    c.pop.total -= out;
    if (nb.length) st.countries[nb[sim.rng.int(0, nb.length - 1)]].pop.migPending += out;
  }
  // outcomes
  if (g.stability > 0.42 && cv.intensity < 0.3) cv.calm++;
  else cv.calm = Math.max(0, cv.calm - 1);
  if (cv.calm >= 4 || months > 96 || cv.intensity <= 0.06)
    endConflict(sim, c, day, cv.calm >= 4 ? 'a settlement holds' : 'the fighting burns out');
}

export function endConflict(sim, c, day, why) {
  if (!c.gov.civil) return;
  c.gov.civil = null;
  c.flags.civilWar = 0;
  if (c.idx === sim.state.playerId) bump(sim, 'civilEnded');
  c.gov.stability = clamp(c.gov.stability + 0.08, 0.01, 0.98);
  sim.log(c.idx, 'peace', `Civil conflict in ${c.name} ends: ${why}`, { civil: true, c: c.idx }, 'high');
  sim.emit('civil', { country: c.idx, start: false });
}
