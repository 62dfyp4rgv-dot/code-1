// Intelligence, counter-intelligence, covert influence and cyber incidents - modelled as abstract strategic mechanics
// (networks, probabilities, exposure, consequences). No operational detail is represented.
import { clamp } from './constants.js';
import { modv } from './mods.js';
import { hash01 } from './rng.js';
import { rel, adjustCredibility } from './diplomacy.js';
import { addTimedMod } from './mods.js';

export const OPS = {
  gather:       { name: 'Build intelligence network', cost: 8,  months: 3, risk: 0.10, desc: 'Raises your network level in the target; improves estimates of its true strength.' },
  counterintel: { name: 'Counter-intelligence sweep', cost: 6,  months: 2, risk: 0.0,  desc: 'Temporarily raises security and degrades foreign networks in your country.' },
  influence:    { name: 'Covert influence campaign',  cost: 12, months: 6, risk: 0.18, desc: 'Gradually improves the target public\'s opinion of you; backfires if exposed.' },
  disinfo:      { name: 'Disinformation campaign',    cost: 14, months: 4, risk: 0.22, desc: 'Erodes target approval and stability; resisted by press freedom and information-integrity tools.' },
  sabotage:     { name: 'Strategic sabotage',         cost: 18, months: 3, risk: 0.30, desc: 'Temporarily reduces target industrial output; high exposure risk and diplomatic cost.' },
  cyber:        { name: 'Cyber operation',            cost: 16, months: 2, risk: 0.25, desc: 'Disrupts target digital infrastructure; success depends on its cyber defence.' },
  steal_tech:   { name: 'Technology acquisition',     cost: 15, months: 5, risk: 0.28, desc: 'Gains research progress on a technology the target knows and you do not.' },
  destabilize:  { name: 'Support opposition',         cost: 20, months: 6, risk: 0.35, desc: 'Reduces target stability; very high exposure risk and escalation potential.' },
};
export function initIntel(sim, c, row) {
  const dev = c.dev0;
  c.intel = { level: clamp(0.15 + 0.5 * dev + 0.05 * Math.log10(1 + c.econ.gdp / 100) + (row.gov === 'one_party' || row.gov === 'theocracy' ? 0.1 : 0), 0.1, 0.95), points: 20, nets: {}, ops: [], embassies: {}, counter: 0, exposure: 0, ci: 0.3 };
  c.cyber = { def: clamp(0.15 + 0.45 * dev + (row.gov === 'one_party' ? 0.05 : 0), 0.1, 0.9), off: clamp(0.1 + 0.4 * dev + 0.08 * (c.mil ? 0 : 0), 0.05, 0.9), disruption: 0, incidents: [] };
  c.intel.ci = clamp(0.2 + 0.3 * c.intel.level + 0.2 * (1 - row.dem / 100), 0.1, 0.95);
}
export function netLevel(sim, i, t) {
  if (i === t) return 100;
  const c = sim.state.countries[i]; let n = c.intel.nets[t] || 0;
  if (sim.geo.landNeighbors[i].has(t)) n = Math.max(n, 15 + 20 * c.intel.level);
  if (sim.alliesOf(i).has(t)) n = Math.max(n, 40 + 30 * c.intel.level);
  return n;
}
// Observer's noisy view of a target. Stable per pair (bias) + slowly changing noise; narrower with better networks.
export function perceive(sim, obs, target) {
  if (obs === target) return { exact: true, conf: 1, gdp: sim.state.countries[target].econ.gdp, mil: sim.milPower(target), stability: sim.state.countries[target].gov.stability, mt: sim.state.countries[target].mt, nukes: sim.state.countries[target].mil.nukes };
  const st = sim.state; const c = st.countries[obs]; const t = st.countries[target];
  const month = (st.day / 30) | 0;
  const cache = sim._estCache && sim._estCache.month === month ? sim._estCache : (sim._estCache = { month, map: new Map() });
  const key = obs * 1000 + target;
  let e = cache.map.get(key);
  if (!e) {
    const net = netLevel(sim, obs, target);
    const sigma = clamp(0.38 * (1 - 0.8 * net / 100) * (c.intel.embassies[target] ? 0.88 : 1) * (1 - 0.3 * c.intel.level), 0.03, 0.5);
    const f = {};
    const frac = ((st.day % 30) / 30);
    for (const k of ['gdp', 'mil', 'stab', 'mt']) {
      const bias = (hash01(c.id + t.id + k) - 0.5) * 2 * sigma * 0.8; // stable per pair: the observer's systematic misjudgement
      const n0 = (hash01(c.id + t.id + k + month) - 0.5) * 2 * sigma * 0.6, n1 = (hash01(c.id + t.id + k + (month + 1)) - 0.5) * 2 * sigma * 0.6;
      f[k] = bias + n0 + (n1 - n0) * frac; // deterministic, stateless, smooth month to month
    }
    e = { sigma, f }; cache.map.set(key, e);
  }
  const f = e.f;
  const net = netLevel(sim, obs, target);
  return {
    exact: false, conf: 1 - e.sigma, sigma: e.sigma,
    gdp: t.econ.gdp * Math.exp(f.gdp * 0.5), mil: sim.milPower(target) * Math.exp(f.mil), stability: clamp(t.gov.stability * Math.exp(f.stab * 0.6), 0, 1), mt: t.mt * Math.exp(f.mt * 0.4),
    nukes: net > 20 ? t.mil.nukes : (t.mil.nukes > 0 && hash01(c.id + t.id + 'n') < 0.7 ? t.mil.nukes : 0),
  };
}

// ----------------------------------------------------------------------------- operations
export function startOp(sim, actor, type, target, params = {}) {
  const st = sim.state, def = OPS[type]; if (!def) return { ok: false, reason: 'unknown operation' };
  const c = st.countries[actor];
  if (c.intel.points < def.cost) return { ok: false, reason: `needs ${def.cost} intelligence points` };
  if (type !== 'counterintel' && actor === target) return { ok: false, reason: 'invalid target' };
  if (c.intel.ops.length >= 2 + Math.floor(c.intel.level * 4)) return { ok: false, reason: 'agency at capacity' };
  c.intel.points -= def.cost;
  const op = { id: st.nextId++, type, target, start: st.day, end: st.day + def.months * 30, params };
  c.intel.ops.push(op);
  return { ok: true, op };
}
export function monthlyStep(sim, day) {
  const st = sim.state, cs = st.countries;
  for (const c of cs) {
    const adminRel = c.spendCat ? (c.spendCat.admin / c.econ.gdp) / c.econ.fiscal0.admin : 1;
    c.intel.level = clamp(c.intel.level + 0.004 * (adminRel - 1) + modv(c, 'intel.eff') * 0.004, 0.05, 0.98);
    c.intel.points = clamp(c.intel.points + 1.2 + 4 * c.intel.level * (0.6 + 0.4 * Math.min(1.5, adminRel)) * (1 + modv(c, 'intel.eff')), 0, 60);
    c.intel.ci = clamp(0.2 + 0.3 * c.intel.level + 0.35 * c.policy.surveillance * (c.gov.dem < 60 ? 1 : 0.6) + modv(c, 'ci.eff') + 0.15 * c.intel.counter, 0.1, 0.97);
    c.cyber.def = clamp(c.cyber.def + 0.003 * (adminRel - 1) + 0.0 + modv(c, 'cyber.def') * 0.003, 0.05, 0.97);
    c.cyber.off = clamp(c.cyber.off + 0.002 + modv(c, 'mil.cyber_off') * 0.003, 0.05, 0.95);
    c.cyber.disruption *= 0.65;
    c.intel.counter = Math.max(0, c.intel.counter - 0.3);
    // networks decay slowly and are rolled up by target counter-intelligence
    for (const k of Object.keys(c.intel.nets)) { const t = cs[k]; c.intel.nets[k] = Math.max(0, c.intel.nets[k] - 0.4 - 1.2 * t.intel.ci * (t.intel.counter > 0 ? 1.8 : 1)); }
    // resolve ops
    for (const op of c.intel.ops.slice()) if (op.end <= day) resolveOp(sim, c, op);
  }
  // background cyber incidents (criminal / unattributed): scale with digital exposure, damped by defence
  for (const c of cs) {
    const exposure = 0.012 + 0.03 * c.dev0;
    if (sim.rng.chance(exposure * (1 - 0.6 * c.cyber.def))) {
      const sev = clamp(sim.rng.range(0.1, 0.6) * (1 - c.cyber.def * 0.8), 0.02, 0.7);
      c.cyber.disruption = Math.min(1, c.cyber.disruption + sev);
      if (sev > 0.3) sim.log(c.idx, 'cyber', `${c.name}: major cyber incident disrupts services`, { severity: sev }, c.idx === st.playerId ? 'high' : 'low');
    }
  }
}
function resolveOp(sim, c, op) {
  const st = sim.state; const def = OPS[op.type]; const t = st.countries[op.target];
  c.intel.ops = c.intel.ops.filter((o) => o !== op);
  const net = netLevel(sim, c.idx, op.target);
  const skill = c.intel.level;
  const tdef = op.type === 'cyber' ? t.cyber.def : t.intel.ci;
  const pSuccess = clamp(0.35 + 0.5 * skill + 0.003 * net - 0.5 * tdef * (op.type === 'gather' ? 0.6 : 1), 0.08, 0.92);
  const ok = sim.rng.chance(pSuccess);
  const pExpose = clamp(def.risk + 0.4 * t.intel.ci * (1 - 0.003 * net) - 0.25 * skill + (ok ? 0 : 0.2), 0.01, 0.9);
  const exposed = sim.rng.chance(pExpose);
  let msg = `${OPS[op.type].name} against ${t.name}: `;
  if (ok) {
    switch (op.type) {
      case 'gather': c.intel.nets[op.target] = Math.min(100, (c.intel.nets[op.target] || 0) + 22 + 20 * skill); break;
      case 'counterintel': c.intel.counter = 6; break;
      case 'influence': rel(sim, op.target, c.idx, 6 + 6 * skill, 3); t.gov.popIdeo.nation = clamp(t.gov.popIdeo.nation - 0.01, -1, 1); break;
      case 'disinfo': { const res = clamp(0.2 + 0.5 * t.policy.pressFreedom + modv(t, 'info.def') * 2, 0, 0.85); addTimedMod(t, 'approval.add', -0.05 * (1 - res), st.day + 180, 'disinfo'); addTimedMod(t, 'stab.add', -0.02 * (1 - res), st.day + 180, 'disinfo'); break; }
      case 'sabotage': addTimedMod(t, 'gdp.shock', -0.012 * (0.5 + skill), st.day + 90, 'sabotage'); break;
      case 'cyber': { const sev = clamp((0.2 + 0.7 * c.cyber.off) * (1 - 0.85 * t.cyber.def), 0.02, 0.8); t.cyber.disruption = Math.min(1, t.cyber.disruption + sev); break; }
      case 'steal_tech': stealTech(sim, c, t); break;
      case 'destabilize': addTimedMod(t, 'stab.add', -0.12 * (0.5 + skill), st.day + 240, 'destabilize'); t.gov.unrest = clamp(t.gov.unrest + 0.05, 0, 1); break;
    }
    msg += 'success';
  } else msg += 'failed';
  if (exposed && op.type !== 'counterintel') {
    msg += ' - EXPOSED';
    rel(sim, op.target, c.idx, -22, -28); adjustCredibility(sim, c.idx, -3);
    t.dip.cb[c.idx] = st.day + 240;
    if (c.gov.dem > 55) c.gov.scandal += 0.4;
    if (op.target === st.playerId) sim.log(op.target, 'intel', `${c.name} caught conducting ${OPS[op.type].name.toLowerCase()} against us`, { by: c.idx }, 'high');
  }
  sim.log(c.idx, 'intel', msg, { op: op.type, target: op.target, ok, exposed }, c.idx === st.playerId ? 'high' : 'low');
  sim.emit('intel', { actor: c.idx, op: op.type, target: op.target, ok, exposed });
}
function stealTech(sim, c, t) {
  const cand = t.tech.known.filter((id) => !c.tech.known.includes(id) && sim.data.techById[id].req.every((r) => c.tech.known.includes(r)));
  if (!cand.length) return;
  const id = sim.rng.pick(cand); const tech = sim.data.techById[id];
  let proj = c.tech.queue.find((q) => q.id === id); if (!proj) { proj = { id, progress: 0 }; c.tech.queue.push(proj); }
  proj.progress += 0.45 * tech.cost;
}
