// Data-driven event framework. Events fire from simulation CONDITIONS (stat paths) with a mean-time-to-happen, never from a
// fixed script. Options carry effects from a small whitelisted effect vocabulary; follow-ups can be scheduled with delays.
import { clamp, COM, BUDGET_CATS } from './constants.js';
import { addTimedMod, MODIFIER_KEYS } from './mods.js';
import { rel, adjustCredibility } from './diplomacy.js';
import { bump } from './achievements.js';

// --------------------------------------------------------------------------- stat resolver
const PRICE_IDX = { food: 0, oil: 1, gas: 2, minerals: 3 };
export function stat(sim, c, path, ctx = {}) {
  const e = c.econ, g = c.gov, st = sim.state;
  switch (path) {
    case 'dev': return c.dev0;
    case 'gdp.growth': return e.growth;
    case 'gdp': return e.gdp;
    case 'econ.infl': return e.infl; case 'econ.unemp': return e.unemp; case 'econ.util': return e.util; case 'econ.debtRatio': return e.debtRatio;
    case 'econ.deficit': return e.deficit / e.gdp; case 'econ.ca': return e.ca / e.gdp; case 'econ.reservesMonths': return e.reservesMonths ?? 6;
    case 'econ.gini': return e.gini; case 'econ.poverty': return e.poverty; case 'econ.risk': return e.risk; case 'econ.marketClosed': return e.marketClosed ? 1 : 0;
    case 'econ.waterStress': return e.waterStress; case 'econ.drought': return e.drought; case 'econ.clean': return e.clean; case 'econ.warLoss': return e.warLoss;
    case 'econ.shortage.food': return e.shortage[0]; case 'econ.shortage.oil': return e.shortage[1]; case 'econ.shortage.gas': return e.shortage[2]; case 'econ.shortage.minerals': return e.shortage[3];
    case 'econ.netExport.oil': return (e.exports[1] - e.imports[1]) / e.gdp; case 'econ.netExport.gas': return (e.exports[2] - e.imports[2]) / e.gdp; case 'econ.netExport.food': return (e.exports[0] - e.imports[0]) / e.gdp;
    case 'econ.netImport.oil': return (e.imports[1] - e.exports[1]) / e.gdp; case 'econ.netImport.gas': return (e.imports[2] - e.exports[2]) / e.gdp;
    case 'econ.resourceRent': return (e.rentRev || 0) / Math.max(1, e.revenue || 1);
    case 'gov.approval': return g.approval; case 'gov.stability': return g.stability; case 'gov.unrest': return g.unrest; case 'gov.corruption': return g.corruption;
    case 'gov.legitimacy': return g.legitimacy; case 'gov.pc': return g.pc; case 'gov.dem': return g.dem; case 'gov.elect': return g.nextElection !== null ? 1 : 0;
    case 'gov.monthsToElection': return g.nextElection === null ? 999 : (g.nextElection - st.day) / 30;
    case 'pop.elder': return c.pop.elder; case 'pop.youth': return c.pop.youth; case 'pop.health': return c.pop.health; case 'pop.edu': return c.pop.edu; case 'pop.fertility': return c.pop.fertility; case 'pop.total': return c.pop.total;
    case 'pop.growth': return c.pop.growth;
    case 'mil.exhaustion': return c.mil.exhaustion; case 'mil.atWar': return sim.atWar(c.idx) ? 1 : 0; case 'mil.readiness': return c.mil.readiness; case 'mil.occupied': return sim.occupiedShare(c.idx);
    case 'mil.nukes': return c.mil.nukes; case 'mil.ammo': return c.mil.ammo;
    case 'cyber.disruption': return c.cyber.disruption; case 'cyber.def': return c.cyber.def;
    case 'tech.count': return c.tech.known.length; case 'research.idx': return e.researchIdx;
    case 'world.temp': return st.world.temp; case 'world.pandemic': return st.pandemic ? 1 : 0;
    case 'price.food': case 'price.oil': case 'price.gas': case 'price.minerals': return st.prices[PRICE_IDX[path.slice(6)]];
    case 'policy.surveillance': return c.policy.surveillance; case 'policy.pressFreedom': return c.policy.pressFreedom; case 'policy.immigration': return c.policy.immigration; case 'policy.tariff': return c.policy.tariff;
    case 'policy.taxRate': return c.policy.taxRate; case 'policy.spendRate': return c.policy.spendRate;
    case 'dip.influence': return c.dip.influence; case 'dip.credibility': return c.dip.credibility;
    case 'intel.level': return c.intel.level;
    case 'target.rivalry': return ctx.target !== undefined ? st.rel.rivalry[c.idx * sim.geo.N + ctx.target] : 0;
    case 'target.opinion': return ctx.target !== undefined ? st.rel.op[c.idx * sim.geo.N + ctx.target] : 0;
    case 'target.theirOpinion': return ctx.target !== undefined ? st.rel.op[ctx.target * sim.geo.N + c.idx] : 0;
    case 'target.exhaustion': return ctx.target !== undefined ? st.countries[ctx.target].mil.exhaustion : 0;
    case 'target.atWar': return ctx.target !== undefined && sim.atWar(ctx.target) ? 1 : 0;
    case 'target.gdpRatio': return ctx.target !== undefined ? st.countries[ctx.target].econ.gdp / e.gdp : 1;
    default:
      if (path.startsWith('flag.')) { const f = c.flags[path.slice(5)]; return f && f > st.day ? 1 : 0; }
      throw new Error('unknown stat path ' + path);
  }
}
export const STAT_PATHS = ['dev', 'gdp.growth', 'gdp', 'econ.infl', 'econ.unemp', 'econ.util', 'econ.debtRatio', 'econ.deficit', 'econ.ca', 'econ.reservesMonths', 'econ.gini', 'econ.poverty', 'econ.risk', 'econ.marketClosed', 'econ.waterStress', 'econ.drought', 'econ.clean', 'econ.warLoss', 'econ.shortage.food', 'econ.shortage.oil', 'econ.shortage.gas', 'econ.shortage.minerals', 'econ.netExport.oil', 'econ.netExport.gas', 'econ.netExport.food', 'econ.netImport.oil', 'econ.netImport.gas', 'econ.resourceRent', 'gov.approval', 'gov.stability', 'gov.unrest', 'gov.corruption', 'gov.legitimacy', 'gov.pc', 'gov.dem', 'gov.elect', 'gov.monthsToElection', 'pop.elder', 'pop.youth', 'pop.health', 'pop.edu', 'pop.fertility', 'pop.total', 'pop.growth', 'mil.exhaustion', 'mil.atWar', 'mil.readiness', 'mil.occupied', 'mil.nukes', 'mil.ammo', 'cyber.disruption', 'cyber.def', 'tech.count', 'research.idx', 'world.temp', 'world.pandemic', 'price.food', 'price.oil', 'price.gas', 'price.minerals', 'policy.surveillance', 'policy.pressFreedom', 'policy.immigration', 'policy.tariff', 'policy.taxRate', 'policy.spendRate', 'dip.influence', 'dip.credibility', 'intel.level', 'target.rivalry', 'target.opinion', 'target.theirOpinion', 'target.exhaustion', 'target.atWar', 'target.gdpRatio'];

const OPS = { '>': (a, b) => a > b, '<': (a, b) => a < b, '>=': (a, b) => a >= b, '<=': (a, b) => a <= b, '==': (a, b) => a === b, '!=': (a, b) => a !== b };
export function check(sim, c, cond, ctx = {}) {
  const [path, op, val] = cond;
  if (path === 'gov.type') return op === 'in' ? val.includes(c.gov.type) : OPS[op](c.gov.type, val);
  if (path === 'region') return op === 'in' ? val.includes(c.region) : OPS[op](c.region, val);
  if (path === 'id') return op === 'in' ? val.includes(c.id) : OPS[op](c.id, val);
  if (path === 'isPlayer') return (c.idx === sim.state.playerId) === !!val;
  const v = stat(sim, c, path, ctx);
  return OPS[op](v, val);
}
export const checkAll = (sim, c, conds, ctx) => (conds || []).every((x) => check(sim, c, x, ctx));

// --------------------------------------------------------------------------- targets
function pickTarget(sim, c, kind) {
  const st = sim.state, N = sim.geo.N;
  if (!kind) return undefined;
  let pool = [];
  if (kind === 'rival') { for (let j = 0; j < N; j++) if (j !== c.idx && st.rel.rivalry[c.idx * N + j] > 25) pool.push([j, st.rel.rivalry[c.idx * N + j]]); }
  else if (kind === 'neighbor') { for (const j of sim.geo.neighbors[c.idx]) pool.push([j, 1 + st.rel.rivalry[c.idx * N + j] * 0.05]); }
  else if (kind === 'ally') { for (const j of sim.alliesOf(c.idx)) pool.push([j, 1]); }
  else if (kind === 'partner') { for (let j = 0; j < N; j++) if (j !== c.idx && st.rel.op[j * N + c.idx] > 20) pool.push([j, 1 + st.rel.op[j * N + c.idx] / 40]); }
  else if (kind === 'warEnemy') { for (const j of sim.enemiesOf(c.idx)) pool.push([j, 1]); }
  else pool = Array.from({ length: N }, (_, j) => [j, 1]).filter(([j]) => j !== c.idx);
  if (!pool.length) return null;
  return pool[sim.rng.weighted(pool.map((p) => p[1]))][0];
}

// --------------------------------------------------------------------------- scheduler
export function initDerived(sim) { sim.eventById = Object.fromEntries(sim.data.events.map((e) => [e.id, e])); }
export function initEvents(sim) {
  initDerived(sim);
  sim.state.events = { cooldown: {}, once: {}, pending: [], queue: [], uid: 1, history: [] };
}
export function dailyStep(sim, day) {
  const ev = sim.state.events;
  if (ev.queue.length) for (const q of ev.queue.slice()) if (q.day <= day) { ev.queue.splice(ev.queue.indexOf(q), 1); fire(sim, sim.eventById[q.id], q.country, q.target); }
  if (ev.pending.length) for (const p of ev.pending.slice()) if (p.expires <= day) resolvePending(sim, p, defaultOption(sim, p), true);
}
export function monthlyStep(sim, day) {
  const st = sim.state; const diff = sim.diff.eventSeverity;
  pandemicStep(sim);
  for (const def of sim.data.events) {
    if (def.scope === 'world') { if (checkWorld(sim, def)) { if (sim.rng.chance(1 - Math.pow(0.5, 1 / def.mtth))) fireWorld(sim, def); } continue; }
    const p = 1 - Math.pow(0.5, 1 / def.mtth);
    for (const c of st.countries) {
      if (def.cooldown) { const last = st.events.cooldown[c.idx + ':' + def.id]; if (last !== undefined && day - last < def.cooldown * 30) continue; }
      if (def.once && st.events.once[c.idx + ':' + def.id]) continue;
      if (!checkAll(sim, c, def.when)) continue;
      if (def.target && !pickTargetCheck(sim, c, def)) continue;
      if (sim.rng.next() < p * (def.severe ? diff : 1)) fire(sim, def, c.idx);
    }
  }
}
function pickTargetCheck(sim, c, def) {
  if (!def.target) return true;
  const t = pickTarget(sim, c, def.target); if (t === null || t === undefined) return false;
  def._t = t; return checkAll(sim, c, def.whenTarget, { target: t });
}
export function yearlyStep(sim, day) { const h = sim.state.events.history; if (h.length > 300) h.splice(0, h.length - 200); }

export function fire(sim, def, ci, target) {
  const st = sim.state; const c = st.countries[ci];
  if (!def) return;
  if (def.target && target === undefined) { target = def._t ?? pickTarget(sim, c, def.target); }
  st.events.cooldown[ci + ':' + def.id] = st.day;
  if (def.once) st.events.once[ci + ':' + def.id] = true;
  const inst = { uid: st.events.uid++, id: def.id, country: ci, target, day: st.day, expires: st.day + (def.expireDays || 30) };
  const isPlayer = ci === st.playerId;
  const opts = (def.options || []).map((o, i) => ({ ...o, i })).filter((o) => checkAll(sim, c, o.if, { target }));
  if (!opts.length || def.auto) { applyEffects(sim, c, def.auto ? def.effects : opts[0]?.effects, target, def); st.events.history.push({ day: st.day, id: def.id, c: ci, t: target }); logEvent(sim, c, def, target, null); return; }
  if (isPlayer) { st.events.pending.push(inst); logEvent(sim, c, def, target, null, true); sim.emit('decision', inst); return; }
  resolvePending(sim, inst, aiChoose(sim, c, def, opts, target), false);
}
export function eventText(sim, inst) {
  const def = sim.eventById[inst.id]; const c = sim.state.countries[inst.country]; const t = inst.target !== undefined && inst.target !== null ? sim.state.countries[inst.target] : null;
  const fill = (s) => s.replace(/\{country\}/g, c.name).replace(/\{target\}/g, t ? t.name : 'a neighbour').replace(/\{leader\}/g, c.gov.leader.name);
  return { title: fill(def.title), text: fill(def.text), options: (def.options || []).map((o, i) => ({ i, text: fill(o.text), hint: o.hint || '', ok: checkAll(sim, c, o.if, { target: inst.target }) })) };
}
function defaultOption(sim, inst) { const def = sim.eventById[inst.id]; return def.defaultOption ?? 0; }
function aiChoose(sim, c, def, opts, target) {
  const w = opts.map((o) => Math.max(0.01, (o.aiWeight ?? 1) * (o.aiBias ? 1 + evalBias(sim, c, o.aiBias) : 1)));
  return opts[sim.rng.weighted(w)].i;
}
function evalBias(sim, c, bias) { let b = 0; for (const [path, k] of Object.entries(bias)) { try { b += k * stat(sim, c, path); } catch { /* ignore */ } } return clamp(b, -0.9, 3); }
export function resolvePending(sim, inst, optionIndex, expired) {
  const st = sim.state; const def = sim.eventById[inst.id]; const c = st.countries[inst.country];
  st.events.pending = st.events.pending.filter((p) => p.uid !== inst.uid);
  const opt = (def.options || [])[optionIndex];
  if (opt) applyEffects(sim, c, opt.effects, inst.target, def);
  st.events.history.push({ day: st.day, id: def.id, c: inst.country, t: inst.target, opt: optionIndex });
  if (inst.country === st.playerId) bump(sim, 'decisions');
  if (inst.country === st.playerId) sim.log(inst.country, 'event', `Decision: ${eventText(sim, inst).title} → ${opt ? opt.text : '(no action)'}${expired ? ' (expired)' : ''}`, { id: def.id, opt: optionIndex }, 'low');
  sim.emit('event_resolved', { inst, optionIndex });
  return true;
}
function logEvent(sim, c, def, target, opt, decision) {
  const isPlayer = c.idx === sim.state.playerId;
  const fill = (s) => s.replace(/\{country\}/g, c.name).replace(/\{target\}/g, target !== undefined && target !== null ? sim.state.countries[target].name : 'a neighbour').replace(/\{leader\}/g, c.gov.leader.name);
  sim.log(c.idx, 'event', fill(def.title), { id: def.id, target, decision: !!decision }, isPlayer ? 'high' : (def.severe ? 'normal' : 'low'));
}

// --------------------------------------------------------------------------- effects
export function applyEffects(sim, c, effects, target, def) {
  if (!effects) return;
  const st = sim.state;
  for (const fx of effects) {
    if (fx.stat) { writeStat(sim, c, fx.stat, fx.add, fx.mul, fx.set); }
    else if (fx.mod) {
      if (!MODIFIER_KEYS.includes(fx.mod)) throw new Error('unknown modifier ' + fx.mod + ' in event ' + (def && def.id));
      addTimedMod(c, fx.mod, fx.add, st.day + (fx.months || 6) * 30, def ? def.id : '');
    } else if (fx.price) { const k = PRICE_IDX[fx.price]; st.prices[k] = clamp(st.prices[k] * fx.mul, 0.35, 6); }
    else if (fx.rel) { const t = fx.rel.with === 'target' ? target : fx.rel.with; if (t !== undefined && t !== null) { rel(sim, t, c.idx, fx.rel.op || 0, fx.rel.trust || 0); rel(sim, c.idx, t, (fx.rel.op || 0) * 0.5, (fx.rel.trust || 0) * 0.5); } }
    else if (fx.relAll) { for (const j of sim.geo.neighbors[c.idx]) rel(sim, j, c.idx, fx.relAll, 0); }
    else if (fx.event) { st.events.queue.push({ day: st.day + (fx.delayDays || 30), id: fx.event, country: fx.on === 'target' ? target : c.idx, target: fx.on === 'target' ? c.idx : target }); }
    else if (fx.treasury !== undefined) { c.econ.debt += fx.treasury * (fx.pctGdp ? c.econ.gdp : 1); }
    else if (fx.policy) { const k = fx.policy.key; if (k in c.target) c.target[k] = clamp(c.target[k] + fx.policy.add, fx.policy.min ?? 0, fx.policy.max ?? 1.5); }
    else if (fx.flag) { c.flags[fx.flag] = st.day + (fx.days || 365); }
    else if (fx.infra !== undefined) { c.econ.infra = clamp(c.econ.infra + fx.infra, 0.05, 0.98); }
    else if (fx.devastate) { const rs = sim.regionsOf[c.idx]; const r = rs[sim.rng.int(0, rs.length - 1)]; st.reg.dev[r] = clamp(st.reg.dev[r] + fx.devastate, 0, 0.9); }
    else if (fx.treaty) { const t = target; if (t !== undefined && t !== null) st.treaties.push({ id: st.nextId++, type: fx.treaty, parties: [c.idx, t], start: st.day, end: null, active: true }); }
    else if (fx.cb) { if (target !== undefined && target !== null) c.dip.cb[target] = st.day + (fx.days || 365); }
    else if (fx.log) { sim.log(c.idx, 'event', fx.log.replace(/\{country\}/g, c.name), {}, c.idx === st.playerId ? 'normal' : 'low'); }
    else if (fx.pandemic) { startPandemic(sim, fx.pandemic); }
    else if (fx.newLeader) { c.gov.leader = { ...c.gov.leader, name: sim.newLeaderName(c), since: st.day }; }
    else if (fx.refugees) { const t = target; if (t !== undefined && t !== null) { const m = Math.min(st.countries[t].pop.total * 0.01, fx.refugees); st.countries[t].pop.coh[1] -= m * 0.8; c.pop.coh[1] += m * 0.8; } }
    else if (fx.research) { const projs = c.tech.queue[0]; if (projs) projs.progress += fx.research; else c.tech.rpBank = (c.tech.rpBank || 0) + fx.research; }
    else if (fx.mil) { writeMil(c, fx.mil); }
    else throw new Error('unknown effect ' + JSON.stringify(fx));
  }
}
function writeMil(c, m) { if (m.exhaustion) c.mil.exhaustion = clamp(c.mil.exhaustion + m.exhaustion, 0, 1); if (m.readiness) c.mil.readiness = clamp(c.mil.readiness + m.readiness, 0, 1); if (m.morale) { /* applied lazily */ } }
const WRITABLE = { 'gov.approval': ['gov', 'approval', 0, 1], 'gov.stability': ['gov', 'stability', 0, 1], 'gov.unrest': ['gov', 'unrest', 0, 1], 'gov.legitimacy': ['gov', 'legitimacy', 0, 1], 'gov.corruption': ['gov', 'corruption', 0, 1], 'gov.pc': ['gov', 'pc', 0, 100], 'gov.scandal': ['gov', 'scandal', 0, 2],
  'dip.influence': ['dip', 'influence', 0, 100], 'dip.credibility': ['dip', 'credibility', 0, 100], 'intel.points': ['intel', 'points', 0, 60], 'pop.health': ['pop', 'health', 0.05, 0.99], 'pop.edu': ['pop', 'edu', 0.05, 0.99], 'econ.reserves': ['econ', 'reserves', 0, 1e9], 'econ.inflExp': ['econ', 'inflExp', 0, 2], 'econ.credit': ['econ', 'credit', 0, 1] };
function writeStat(sim, c, path, add, mul, set) {
  const w = WRITABLE[path]; if (!w) throw new Error('stat not writable: ' + path);
  const o = c[w[0]]; let v = o[w[1]];
  if (set !== undefined) v = set; if (add !== undefined) v += add; if (mul !== undefined) v *= mul;
  o[w[1]] = clamp(v, w[2], w[3]);
}
export const WRITABLE_STATS = Object.keys(WRITABLE);

// --------------------------------------------------------------------------- world events (pandemic, shocks)
function checkWorld(sim, def) { return !def.when || def.when.every(([p, op, v]) => OPS[op](worldStat(sim, p), v)); }
function worldStat(sim, p) { const st = sim.state; if (p === 'world.pandemic') return st.pandemic ? 1 : 0; if (p === 'world.temp') return st.world.temp; if (p.startsWith('price.')) return st.prices[PRICE_IDX[p.slice(6)]]; throw new Error('world stat ' + p); }
function fireWorld(sim, def) {
  const st = sim.state;
  sim.log(null, 'world', def.title, { id: def.id }, 'high');
  for (const fx of def.effects || []) {
    if (fx.pandemic) startPandemic(sim, fx.pandemic);
    else if (fx.price) { const k = PRICE_IDX[fx.price]; st.prices[k] = clamp(st.prices[k] * fx.mul, 0.35, 6); }
    else if (fx.chokepoint) { const cp = st.chokes.find((x) => x.id === fx.chokepoint.id); if (cp) cp.open = clamp(cp.open - fx.chokepoint.close, 0.2, 1); }
    else if (fx.cartelQuota) { st.cartel.quota = clamp(st.cartel.quota * fx.cartelQuota, 0.6, 1.1); }
    else if (fx.allMod) { for (const c of st.countries) addTimedMod(c, fx.allMod.k, fx.allMod.add, st.day + fx.allMod.months * 30, def.id); }
    else if (fx.climate) { st.world.temp += fx.climate; }
  }
  sim.emit('world_event', { id: def.id });
}
export function startPandemic(sim, spec) {
  const st = sim.state; if (st.pandemic) return;
  const origin = sim.rng.int(0, sim.geo.N - 1);
  st.pandemic = { name: spec.name || 'Novel pathogen', r0: spec.r0 || 2.6, ifr: spec.ifr || 0.004, start: st.day, infected: new Array(sim.geo.N).fill(0), recovered: new Array(sim.geo.N).fill(0), peak: 0, deaths: 0, origin };
  st.pandemic.infected[origin] = 0.0005;
  sim.log(origin, 'world', `Outbreak of ${st.pandemic.name} reported in ${st.countries[origin].name}`, {}, 'high');
}
// Monthly SIR dynamics per country, coupled by trade/travel (land borders weigh more). Response measures and health reduce transmission.
const GAMMA = 0.7; // recovery rate per month
export function pandemicStep(sim) {
  const st = sim.state, p = st.pandemic; if (!p) return;
  const N = sim.geo.N; const nextI = p.infected.slice(), nextR = p.recovered.slice(); let total = 0;
  for (let i = 0; i < N; i++) {
    const c = st.countries[i]; const I = p.infected[i], R = p.recovered[i], S = Math.max(0, 1 - I - R);
    const resp = clamp(0.3 * c.pop.health + 0.25 * c.gov.bureaucracy + 0.5 * (c.mc['epid.resp'] || 0) + (c.flags.lockdown > st.day ? 0.25 : 0), 0, 0.85);
    const beta = p.r0 * GAMMA * (1 - resp);
    let imp = 0; for (let j = 0; j < N; j++) if (j !== i && p.infected[j] > 0.0001) imp += p.infected[j] * 0.002 * (sim.geo.landNeighbors[i].has(j) ? 8 : 1) * (1 + 8 * c.econ.openness);
    const newInf = Math.min(S, beta * I * S + imp * S);
    nextI[i] = clamp(I + newInf - GAMMA * I, 0, 1); nextR[i] = clamp(R + GAMMA * I, 0, 1);
    total += nextI[i];
    c.econ.pandemicLoad = nextI[i];
    p.deaths += c.pop.total * p.ifr * GAMMA * I * (1.2 - 0.6 * c.pop.health) * (1 - 0.5 * (c.mc['epid.resp'] || 0));
    if (nextI[i] > 0.02) addTimedMod(c, 'gdp.shock', -0.04 * nextI[i] * (c.flags.lockdown > st.day ? 1.8 : 1), st.day + 40, 'pandemic');
    if (nextI[i] > 0.05 && c.idx === st.playerId && !(c.flags.pandemicWarned > st.day)) { c.flags.pandemicWarned = st.day + 120; sim.log(c.idx, 'health', `${p.name}: ${(nextI[i] * 100).toFixed(0)}% of ${c.name} infected`, {}, 'high'); }
  }
  p.infected = nextI; p.recovered = nextR; p.peak = Math.max(p.peak, total);
  if (total < 0.0004 && st.day - p.start > 150) { sim.log(null, 'world', `${p.name} subsides worldwide (${p.deaths.toFixed(1)}M deaths)`, { deaths: p.deaths }, 'high'); st.pandemic = null; for (const c of st.countries) c.econ.pandemicLoad = 0; }
}
export function epidemicMortality(sim, c) { const p = sim.state.pandemic; if (!p) return 0; const I = p.infected[c.idx]; return p.ifr * GAMMA * I * 12 * (1.2 - 0.6 * c.pop.health) * (1 - 0.5 * (c.mc['epid.resp'] || 0)); }
