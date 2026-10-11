// Warfare: wars, allies, fronts & automatic deployment, supply, air, naval, land combat, occupation, war score, exhaustion, peace.
// Operations are resolved daily from doctrine, logistics, terrain, readiness, air superiority and fortification - never by a
// raw headcount comparison. Player and AI use identical orders (setStance / moveForce / attackRegion / declareWar / proposePeace).
import { clamp, TERRAIN, COM } from './constants.js';
import { modv } from './mods.js';
import { UNIT_TYPES } from './military.js';
import { bump } from './achievements.js';

const DOCTRINES = {
  combined:   { atk: 1.0,  def: 1.0,  logi: 1.0,  org: 1.0,  desc: 'Balanced combined-arms doctrine.' },
  mass:       { atk: 1.08, def: 0.96, logi: 0.9,  org: 0.95, desc: 'Large formations and firepower; heavy logistics.' },
  maneuver:   { atk: 1.12, def: 0.92, logi: 1.0,  org: 1.1,  desc: 'Mobile operations; strong when supplied, brittle otherwise.' },
  defensive:  { atk: 0.88, def: 1.18, logi: 1.05, org: 1.0,  desc: 'Fortification and attrition of attackers.' },
  network:    { atk: 1.04, def: 1.04, logi: 1.1,  org: 1.05, desc: 'Information-led operations; needs advanced tech.' },
};
export { DOCTRINES };

// ---------------------------------------------------------------------------------------------------- queries
export function atWar(sim, i) { for (const w of sim.state.wars) if (w.active && (w.attackers.includes(i) || w.defenders.includes(i))) return true; return false; }
export function hostileMask(sim) {
  const N = sim.geo.N; const m = new Uint8Array(N * N);
  for (const w of sim.state.wars) { if (!w.active) continue; for (const a of w.attackers) for (const d of w.defenders) { m[a * N + d] = 1; m[d * N + a] = 1; } }
  return m;
}
export function sideOf(w, i) { return w.attackers.includes(i) ? 'a' : w.defenders.includes(i) ? 'd' : null; }
export function alliedSet(sim, i) { // countries whose controlled regions may supply/host i: itself + co-belligerents on its side + defence-pact partners
  const s = new Set([i]);
  for (const w of sim.state.wars) { if (!w.active) continue; const sd = sideOf(w, i); if (!sd) continue; for (const x of sd === 'a' ? w.attackers : w.defenders) s.add(x); }
  for (const t of sim.state.treaties) if (t.active && (t.type === 'defense_pact' || t.type === 'alliance') && t.parties.includes(i)) for (const p of t.parties) s.add(p);
  for (const o of sim.state.orgs) if (o.type === 'alliance' && o.members.includes(i)) for (const p of o.members) s.add(p);
  return s;
}

// ---------------------------------------------------------------------------------------------------- war lifecycle
export function declareWar(sim, att, def, opts = {}) {
  const st = sim.state, geo = sim.geo;
  if (att === def) return { ok: false, reason: 'same country' };
  for (const w of st.wars) if (w.active && ((w.attackers.includes(att) && w.defenders.includes(def)) || (w.attackers.includes(def) && w.defenders.includes(att)))) return { ok: false, reason: 'already at war' };
  if (!opts.force) {
    const truce = st.treaties.find((t) => t.active && t.type === 'ceasefire' && t.parties.includes(att) && t.parties.includes(def));
    if (truce && !opts.breakTruce) return { ok: false, reason: 'ceasefire in force', truce: true };
    const sameAlliance = sim.alliesOf(att).has(def);
    if (sameAlliance) return { ok: false, reason: 'allied' };
  }
  const w = { id: st.nextId++, attackers: [att], defenders: [def], leaders: [att, def], start: st.day, goals: [{ by: att, kind: opts.goal || 'territory', target: def, region: opts.region ?? -1 }], active: true, score: { a: 0, d: 0 }, cas: { [att]: 0, [def]: 0 }, name: `${st.countries[att].name}-${st.countries[def].name} War`, cb: opts.cb || 'none', occupied: {}, log: [] };
  st.wars.push(w);
  const A = st.countries[att], D = st.countries[def];
  A.mil.lastWar = st.day; D.mil.lastWar = st.day;
  // legitimacy cost of aggression without cause
  const hasCB = sim.hasCasusBelli(att, def);
  if (!hasCB && !opts.force) { A.gov.legitimacy = clamp(A.gov.legitimacy - 0.06, 0, 1); sim.adjustCredibility(att, -6); sim.worldOpinionShift(att, -10, 0.5); }
  else if (opts.force !== 'scenario') sim.adjustCredibility(att, -1);
  sim.log(att, 'war', `${A.name} declares war on ${D.name}`, { war: w.id, att, def }, 'high');
  sim.emit('war', { type: 'declared', war: w.id });
  sim.rel(att, def, -40, -40); sim.rel(def, att, -50, -50);
  if (!opts.noAllies) callAllies(sim, w);
  sim.mobilizeFor(att); sim.mobilizeFor(def);
  return { ok: true, war: w };
}
export function startScenarioWar(sim, spec) {
  const geo = sim.geo; const att = spec.attackers.map((x) => geo.idOf[x]), def = spec.defenders.map((x) => geo.idOf[x]);
  const r = declareWar(sim, att[0], def[0], { goal: spec.goal, force: 'scenario', noAllies: true });
  if (!r.ok) return;
  const w = r.war; w.start = -200; w.cb = 'scenario';
  for (const a of att.slice(1)) w.attackers.push(a); for (const d of def.slice(1)) w.defenders.push(d);
  for (const o of spec.startOccupation || []) {
    const ri = geo.regionAt(o.lon, o.lat); if (ri < 0) continue;
    const by = geo.idOf[o.by];
    if (sim.state.reg.ctrl[ri] !== by && def.includes(sim.state.reg.owner[ri])) { sim.state.reg.ctrl[ri] = by; sim.state.reg.dev[ri] = 0.15; }
  }
  sim.rebuildOwnedRegions();
  for (const c of [...att, ...def]) { sim.state.countries[c].mil.exhaustion = 0.18; sim.state.countries[c].mil.mobilizationTarget = 1; sim.state.countries[c].mil.mobilization = 1; }
  sim.log(att[0], 'war', `${w.name} (ongoing at start)`, { war: w.id }, 'normal');
}
function callAllies(sim, w) {
  const st = sim.state;
  const calls = [];
  for (const d of w.defenders.slice()) for (const a of sim.alliesOf(d)) if (a !== d && !w.attackers.includes(a) && !w.defenders.includes(a)) calls.push({ ally: a, side: 'd', principal: d });
  for (const t of w.attackers.slice()) for (const a of sim.alliesOf(t)) if (a !== t && !w.attackers.includes(a) && !w.defenders.includes(a) && !calls.some((c) => c.ally === a)) calls.push({ ally: a, side: 'a', principal: t });
  for (const c of calls) sim.resolveCallToArms(w, c);
}
export function joinWar(sim, w, country, side) {
  if (!w.active || sideOf(w, country)) return false;
  (side === 'a' ? w.attackers : w.defenders).push(country);
  w.cas[country] = 0;
  const c = sim.state.countries[country]; c.mil.lastWar = sim.state.day;
  const enemies = side === 'a' ? w.defenders : w.attackers; for (const e of enemies) { sim.rel(country, e, -30, -30); sim.rel(e, country, -35, -35); }
  sim.log(country, 'war', `${c.name} joins the ${w.name} on the ${side === 'a' ? 'attacking' : 'defending'} side`, { war: w.id }, 'high');
  sim.mobilizeFor(country);
  return true;
}
export function endWarFor(sim, w, country, reason) {
  w.attackers = w.attackers.filter((x) => x !== country); w.defenders = w.defenders.filter((x) => x !== country);
  if (!w.attackers.length || !w.defenders.length) { w.active = false; w.end = sim.state.day; w.endReason = reason; sim.log(w.leaders[0], 'peace', `${w.name} ends (${reason})`, { war: w.id }, 'high'); sim.emit('war', { type: 'ended', war: w.id }); }
  sim.state.countries[country].mil.mobilizationTarget = 0;
  if (!sim.atWar(country)) sim.state.countries[country].mil.mobilizationTarget = 0;
  relocateStranded(sim);
}

// ---------------------------------------------------------------------------------------------------- pathfinding (generic Dijkstra)
function dijkstra(sim, sources, edgeFn, maxCost = Infinity) {
  const R = sim.geo.regions.length; const dist = new Float64Array(R).fill(Infinity); const prev = new Int32Array(R).fill(-1);
  const heap = []; // simple binary heap of [cost, node]
  const push = (c, n) => { heap.push([c, n]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const top = heap[0]; const last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  for (const s of sources) { dist[s] = 0; push(0, s); }
  while (heap.length) {
    const [d, u] = pop(); if (d > dist[u]) continue; if (d > maxCost) break;
    for (const a of sim.geo.regions[u].adj) {
      const cost = edgeFn(u, a);
      if (cost === null || cost === undefined) continue;
      const nd = d + cost;
      if (nd < dist[a.to]) { dist[a.to] = nd; prev[a.to] = u; push(nd, a.to); }
    }
  }
  return { dist, prev };
}
function pathTo(prev, from, to) { const p = []; let u = to; while (u >= 0 && u !== from) { p.push(u); u = prev[u]; } if (u !== from) return null; return p.reverse(); }
const regDist = (sim, a, b) => sim.geo.regionDistance(a, b);

// ---------------------------------------------------------------------------------------------------- orders (shared by player & AI)
export function moveForce(sim, f, dest) {
  if (f.branch === 'sea') { // BFS over sea zones
    const seas = sim.geo.seas; const from = f.loc; if (from === dest) { f.dest = -1; return true; }
    const q = [from]; const prev = new Map([[from, -1]]);
    while (q.length) { const u = q.shift(); if (u === dest) break; for (const v of seas[u].adj) if (!prev.has(v)) { prev.set(v, u); q.push(v); } }
    if (!prev.has(dest)) return false;
    const path = []; let u = dest; while (u !== from) { path.push(u); u = prev.get(u); } f.path = path.reverse(); f.dest = dest; f.moveProg = 0; return true;
  }
  if (f.branch === 'air') { f.dest = dest; f.path = [dest]; f.moveProg = 0; return true; }
  const friendly = alliedSet(sim, f.owner); const reg = sim.state.reg;
  const { prev } = dijkstra(sim, [f.loc], (u, a) => (friendly.has(reg.ctrl[a.to]) ? regDist(sim, u, a.to) * (a.strait ? 1 + a.gap : 1) : null));
  const p = pathTo(prev, f.loc, dest); if (!p) return false;
  f.path = p; f.dest = dest; f.moveProg = 0; f.order = { kind: 'move', target: dest }; return true;
}
export function attackRegion(sim, f, target) {
  const geo = sim.geo; const adjacent = geo.regions[f.loc].adj.some((a) => a.to === target);
  if (!adjacent) { // move to an adjacent staging region first
    const reg = sim.state.reg; const friendly = alliedSet(sim, f.owner);
    const cands = geo.regions[target].adj.map((a) => a.to).filter((r) => friendly.has(reg.ctrl[r]));
    if (!cands.length) return false;
    cands.sort((a, b) => regDist(sim, f.loc, a) - regDist(sim, f.loc, b));
    if (!moveForce(sim, f, cands[0])) return false;
    f.afterMove = { kind: 'attack', target };
    return true;
  }
  f.order = { kind: 'attack', target }; f.dest = -1; f.prep = 0; return true;
}
export function setStance(sim, owner, enemy, stance, objective = -1) {
  const m = sim.state.countries[owner].mil;
  m.posture[enemy] = { stance, objective };
  return true;
}
export function setDoctrine(sim, c, doctrine) { if (!DOCTRINES[doctrine]) return false; c.mil.doctrine = doctrine; c.mil.doctrineSince = sim.state.day; return true; }

// ---------------------------------------------------------------------------------------------------- daily
export function dailyWar(sim, day) {
  const st = sim.state;
  const activeWars = st.wars.filter((w) => w.active);
  sim.indexForces();
  // movement always runs (peacetime redeployments)
  moveAll(sim, day);
  if (!activeWars.length) return;
  sim.hostile = hostileMask(sim);
  updateSupply(sim);
  if (day % 7 === 0) for (const c of belligerents(sim)) if (!c.mil.manual || c.idx !== st.playerId) autoDeploy(sim, c);
  airPhase(sim);
  navalPhase(sim);
  landPhase(sim, day);
  consumeStocks(sim);
  checkCapitulation(sim, day);
}
function belligerents(sim) { const s = new Set(); for (const w of sim.state.wars) if (w.active) for (const x of [...w.attackers, ...w.defenders]) s.add(x); return [...s].map((i) => sim.state.countries[i]); }

function moveAll(sim, day) {
  const geo = sim.geo; const reg = sim.state.reg;
  for (const f of sim.state.forces) {
    if (f.dest < 0 || !f.path || !f.path.length) { f.dest = -1; continue; }
    const next = f.path[0];
    let km, dkm;
    if (f.branch === 'sea') { const s0 = geo.seas[f.loc], s1 = geo.seas[next]; dkm = Math.hypot((s0.lat - s1.lat) * 111, (s0.lon - s1.lon) * 111 * Math.cos((s0.lat * Math.PI) / 180)); km = 450; }
    else if (f.branch === 'air') { dkm = regDist(sim, f.loc, next); km = 900; }
    else {
      dkm = regDist(sim, f.loc, next);
      const owner = sim.state.countries[reg.owner[next]]; const t = TERRAIN[geo.regions[next].terrain];
      km = 26 * UNIT_TYPES[f.type].mob * t.mobility * (0.55 + 0.45 * (owner ? owner.econ.infra : 0.5)) * (0.6 + 0.4 * f.org);
    }
    f.moveProg += km;
    if (f.moveProg >= dkm) {
      f.moveProg = 0; f.loc = next; f.path.shift(); f.org = Math.max(0.2, f.org - 0.02);
      if (!f.path.length) { f.dest = -1; if (f.afterMoveOrder) { f.order = { kind: f.afterMoveOrder, target: -1 }; f.afterMoveOrder = null; } else if (f.afterMove) { const am = f.afterMove; f.afterMove = null; if (am.kind === 'attack') f.order = { kind: 'attack', target: am.target }; } else f.order = { kind: 'hold', target: -1 }; f.prep = 0; }
    }
  }
}

// ---- supply
function updateSupply(sim) {
  const geo = sim.geo, reg = sim.state.reg, st = sim.state;
  sim.supplyBy = new Map();
  for (const c of belligerents(sim)) {
    const friendly = alliedSet(sim, c.idx);
    const hubs = [];
    for (const ri of sim.controlledBy[c.idx]) { const r = geo.regions[ri]; if (ri === geo.capitalRegion[c.idx] || (r.port >= 0.8 && r.coast.length)) hubs.push(ri); }
    for (const a of friendly) if (a !== c.idx) for (const ri of sim.controlledBy[a]) if (ri === geo.capitalRegion[a]) hubs.push(ri);
    const m = c.mil, logi = 1 + modv(c, 'mil.logi') + 0.3 * c.econ.infra;
    const range = (650 + 850 * logi) * DOCTRINES[m.doctrine].logi;
    const cap = new Float64Array(geo.regions.length);
    const { dist, prev } = dijkstra(sim, hubs, (u, a) => {
      const to = a.to; if (!friendly.has(reg.ctrl[to])) return null;
      const owner = st.countries[reg.owner[to]];
      const inf = clamp(0.25 + 0.75 * (owner ? owner.econ.infra : 0.4), 0.15, 1) * (reg.ctrl[to] !== reg.owner[to] ? 0.55 : 1) * (1 - 0.7 * reg.dev[to]) * TERRAIN[geo.regions[to].terrain].supply;
      cap[to] = cap[u] === 0 ? inf : Math.min(cap[u], inf);
      return regDist(sim, u, to) / inf * (a.strait ? 1 + a.gap : 1);
    });
    for (const h of hubs) cap[h] = 1;
    sim.supplyBy.set(c.idx, { dist, cap, range });
  }
}
function supplyAt(sim, owner, region) {
  const s = sim.supplyBy && sim.supplyBy.get(owner); if (!s) return 1;
  const d = s.dist[region]; if (!isFinite(d)) return 0.05;
  return clamp(1.2 - d / s.range, 0, 1) * clamp(0.4 + 0.8 * s.cap[region], 0.2, 1);
}

// ---- stance based auto-deployment (weekly): front regions weighted by threat & value
function autoDeploy(sim, c) {
  const geo = sim.geo, reg = sim.state.reg, st = sim.state;
  const enemies = enemiesOf(sim, c.idx); if (!enemies.size) return;
  const myForces = sim.forcesOf[c.idx].filter((f) => f.branch === 'land' && f.order.kind !== 'locked');
  if (!myForces.length) return;
  const friendly = alliedSet(sim, c.idx);
  // front regions: controlled by us, adjacent to enemy-controlled region
  const fronts = [];
  for (const ri of sim.controlledBy[c.idx]) {
    const r = geo.regions[ri];
    const foes = r.adj.filter((a) => enemies.has(reg.ctrl[a.to]));
    if (!foes.length) continue;
    let threat = 0; for (const a of foes) for (const ef of sim.forcesAtRegion.get(a.to) || []) if (ef.branch === 'land') threat += ef.size;
    fronts.push({ ri, foes, threat: threat + 3 + 40 * r.popW + (ri === geo.capitalRegion[c.idx] ? 30 : 0) });
  }
  if (!fronts.length) { // no contact: hold around capital; if enemy has no land contact (overseas) stay
    return;
  }
  // desired stance: attack if posture says so or if locally superior; else defend
  const total = fronts.reduce((s, f) => s + f.threat, 0);
  const reserveFrac = 0.2;
  const freeForces = myForces.filter((f) => f.dest < 0 && !(f.order.kind === 'attack' && f.prep > 0 && f.inCombat));
  const stanceOf = (enemy) => (c.mil.posture[enemy] ? c.mil.posture[enemy].stance : 'defend');
  const quota = fronts.map((f) => ({ ...f, want: Math.max(1, Math.round(((1 - reserveFrac) * freeForces.length * f.threat) / total)), have: 0 }));
  for (const f of freeForces) { const q = quota.find((x) => x.ri === f.loc); if (q) q.have++; }
  const unassigned = [];
  for (const f of freeForces) { const q = quota.find((x) => x.ri === f.loc); if (!q || q.have > q.want) { if (q) q.have--; unassigned.push(f); } }
  for (const f of unassigned) {
    const need = quota.filter((q) => q.have < q.want).sort((a, b) => regDist(sim, f.loc, a.ri) - regDist(sim, f.loc, b.ri))[0];
    if (!need) break;
    if (moveForce(sim, f, need.ri)) need.have++;
  }
  // attack orders: each front region with local superiority (or attack stance) targets the most valuable adjacent enemy region
  for (const q of quota) {
    const here = (sim.forcesAtRegion.get(q.ri) || []).filter((f) => f.owner === c.idx && f.branch === 'land');
    if (!here.length) continue;
    let best = null, bv = -1;
    for (const a of q.foes) {
      const enemyCtl = reg.ctrl[a.to]; const st0 = stanceOf(enemyCtl);
      const garrison = (sim.forcesAtRegion.get(a.to) || []).filter((f) => enemies.has(f.owner) && f.branch === 'land').reduce((s, f) => s + f.size * f.fill, 0);
      const mine = here.reduce((s, f) => s + f.size * f.fill, 0);
      const ratio = mine / Math.max(1, garrison);
      const t = TERRAIN[geo.regions[a.to].terrain];
      const obj = c.mil.posture[enemyCtl]?.objective;
      const value = geo.regions[a.to].popW * 10 + (a.to === geo.capitalRegion[reg.owner[a.to]] ? 8 : 0) + (obj === a.to ? 20 : 0) + 2;
      const willing = st0 === 'attack' || (st0 !== 'hold' && ratio > 1.8);
      const sc = willing ? value * ratio / t.defense : -1;
      if (sc > bv) { bv = sc; best = a.to; }
    }
    for (const f of here) {
      if (f.dest >= 0) continue;
      if (best !== null && bv > 0 && f.supply > 0.35 && f.org > 0.4) { if (f.order.kind !== 'attack' || f.order.target !== best) { f.order = { kind: 'attack', target: best }; f.prep = 0; } }
      else if (f.order.kind === 'attack') f.order = { kind: 'defend', target: -1 };
      else if (f.order.kind !== 'defend') f.order = { kind: 'defend', target: -1 };
    }
  }
}
export function enemiesOf(sim, i) {
  const s = new Set();
  for (const w of sim.state.wars) { if (!w.active) continue; const sd = sideOf(w, i); if (!sd) continue; for (const x of sd === 'a' ? w.defenders : w.attackers) s.add(x); }
  return s;
}

// ---- air phase
function airStrength(sim, f, reg) { const m = sim.state.countries[f.owner].mil; const u = UNIT_TYPES[f.type]; return f.size * f.fill * (0.4 + 0.6 * f.morale) * m.q.air * (0.5 + 0.5 * f.supply) * (m.readiness ** 0.5); }
function wingsNear(sim, owner, region, hops = 2) {
  const key = owner * 1000 + region; const c = sim.airCache; if (c.has(key)) return c.get(key);
  const seen = new Set([region]); let frontier = [region];
  for (let h = 0; h < hops; h++) { const nf = []; for (const u of frontier) for (const a of sim.geo.regions[u].adj) if (!seen.has(a.to)) { seen.add(a.to); nf.push(a.to); } frontier = nf; }
  let ap = 0, gp = 0;
  for (const r of seen) for (const f of sim.forcesAtRegion.get(r) || []) if (f.owner === owner && f.branch === 'air' && f.order.kind !== 'rest') { const s = airStrength(sim, f); ap += s * UNIT_TYPES[f.type].air; gp += s * UNIT_TYPES[f.type].ground; }
  const out = { air: ap, ground: gp }; c.set(key, out); return out;
}
export function airSuperiority(sim, attacker, defender, region) { // in [-1, 1], positive favours attacker
  const a = wingsNear(sim, attacker, region).air, d = wingsNear(sim, defender, region).air;
  return (a - d) / (a + d + 0.5);
}
function airPhase(sim) {
  sim.airCache = new Map();
  const reg = sim.state.reg; const st = sim.state;
  for (const c of belligerents(sim)) {
    const enemies = enemiesOf(sim, c.idx);
    const wings = sim.forcesOf[c.idx].filter((f) => f.branch === 'air');
    for (const f of wings) {
      // default mission: counter-air near the nearest front; bombing wings carry target
      if (f.order.kind === 'bomb' && f.order.target >= 0) {
        const T = f.order.target; if (!enemies.has(reg.ctrl[T]) && !enemies.has(reg.owner[T])) { f.order = { kind: 'hold', target: -1 }; continue; }
        const owner = st.countries[reg.owner[T]];
        const inRange = f.loc === T || sim.geo.regions[f.loc].adj.some((a) => a.to === T || sim.geo.regions[a.to].adj.some((b) => b.to === T));
        if (!inRange) continue;
        const ad = clamp(0.15 + modv(owner, 'mil.air_def') * 2 + 0.2 * owner.mil.q.air * 0.3, 0, 0.8);
        const power = airStrength(sim, f) * UNIT_TYPES[f.type].ground;
        const dmg = 0.00035 * power * (1 - ad);
        reg.dev[T] = clamp(reg.dev[T] + dmg, 0, 0.9);
        f.size = Math.max(0.05, f.size * (1 - 0.0018 * (0.5 + ad)));
        f.inCombat = 1;
      }
    }
  }
  // counter-air attrition near fronts
  for (const w of st.wars) {
    if (!w.active) continue;
    for (const a of w.attackers) for (const d of w.defenders) {
      const wa = sim.forcesOf[a].filter((f) => f.branch === 'air'), wd = sim.forcesOf[d].filter((f) => f.branch === 'air');
      if (!wa.length || !wd.length) continue;
      const sa = wa.reduce((s, f) => s + airStrength(sim, f), 0), sd = wd.reduce((s, f) => s + airStrength(sim, f), 0);
      const r = sa / Math.max(0.01, sd);
      const intensity = 0.0012;
      for (const f of wa) f.size = Math.max(0.05, f.size * (1 - intensity * clamp(1 / Math.sqrt(r), 0.3, 2.5)));
      for (const f of wd) f.size = Math.max(0.05, f.size * (1 - intensity * clamp(Math.sqrt(r), 0.3, 2.5)));
    }
  }
}

// ---- naval phase
function seaStrength(sim, f) { const m = sim.state.countries[f.owner].mil; return f.size * f.fill * (0.4 + 0.6 * f.morale) * m.q.sea * UNIT_TYPES[f.type].sea * (0.5 + 0.5 * f.supply) * m.readiness ** 0.5; }
function navalPhase(sim) {
  const bySea = new Map();
  for (const f of sim.state.forces) if (f.branch === 'sea') { if (!bySea.has(f.loc)) bySea.set(f.loc, []); bySea.get(f.loc).push(f); }
  for (const [sea, fl] of bySea) {
    const owners = [...new Set(fl.map((f) => f.owner))];
    for (let i = 0; i < owners.length; i++) for (let j = i + 1; j < owners.length; j++) {
      if (!sim.hostile[owners[i] * sim.geo.N + owners[j]]) continue;
      const A = fl.filter((f) => f.owner === owners[i]), B = fl.filter((f) => f.owner === owners[j]);
      const sa = A.reduce((s, f) => s + seaStrength(sim, f), 0), sb = B.reduce((s, f) => s + seaStrength(sim, f), 0);
      const r = sa / Math.max(0.01, sb);
      const loss = 0.012;
      for (const f of A) { f.size = Math.max(0.05, f.size * (1 - loss * clamp(1 / Math.sqrt(r), 0.3, 3))); f.morale = clamp(f.morale - 0.004 * (r < 1 ? 2 : 0.5), 0, 1); f.inCombat = 1; f.exp = Math.min(1, f.exp + 0.001); }
      for (const f of B) { f.size = Math.max(0.05, f.size * (1 - loss * clamp(Math.sqrt(r), 0.3, 3))); f.morale = clamp(f.morale - 0.004 * (r > 1 ? 2 : 0.5), 0, 1); f.inCombat = 1; f.exp = Math.min(1, f.exp + 0.001); }
      const loser = r > 1 ? B : A;
      for (const f of loser) if (f.morale < 0.3 && f.home !== undefined && f.home !== f.loc && f.dest < 0) moveForce(sim, f, f.home);
    }
  }
}
export function fillBlockade(sim, arr) {
  if (!sim.state.wars.some((w) => w.active)) return;
  const geo = sim.geo, st = sim.state;
  const presence = new Map(); // sea -> Map(owner -> strength)
  for (const f of st.forces) if (f.branch === 'sea' && (f.order.kind === 'blockade' || f.order.kind === 'patrol' || f.order.kind === 'hold')) { if (!presence.has(f.loc)) presence.set(f.loc, new Map()); const m = presence.get(f.loc); m.set(f.owner, (m.get(f.owner) || 0) + seaStrength(sim, f)); }
  for (const c of belligerents(sim)) {
    const enemies = enemiesOf(sim, c.idx); let cap = 0, cov = 0;
    for (const ri of geo.cRegions[c.idx]) { const r = geo.regions[ri]; if (!r.coast.length || r.port <= 0) continue; cap += r.port;
      let blocked = 0;
      for (const co of r.coast) { const m = presence.get(co.sea); if (!m) continue; let foe = 0, own = 0; for (const [o, s] of m) { if (enemies.has(o)) foe += s; else if (o === c.idx || alliedSet(sim, c.idx).has(o)) own += s; } if (foe > own * 1.2 + 0.2) blocked = Math.max(blocked, clamp(foe / (foe + own + 1), 0, 0.9)); }
      cov += r.port * blocked; }
    arr[c.idx] = cap > 0 ? clamp(cov / cap, 0, 0.9) : 0;
    sim.state.lastBlockade[c.idx] = arr[c.idx];
  }
}

// ---- land phase
function landStrength(sim, f, mode, reg) {
  const m = sim.state.countries[f.owner].mil; const u = UNIT_TYPES[f.type];
  const doc = DOCTRINES[m.doctrine];
  const cmd = f.cmd >= 0 && m.commanders[f.cmd] ? 1 + 0.25 * (m.commanders[f.cmd].skill - 0.55) : 1;
  const supplyEff = 0.25 + 0.75 * f.supply;
  const base = f.size * Math.pow(f.fill, 0.8) * (0.55 + 0.45 * f.org) * (0.5 + 0.5 * f.morale) * (1 + 0.5 * f.exp) * m.q.land * supplyEff * (0.7 + 0.3 * m.readiness) * cmd;
  return base * (mode === 'atk' ? u.atk * doc.atk : u.def * doc.def);
}
function landPhase(sim, day) {
  const geo = sim.geo, reg = sim.state.reg, st = sim.state, N = geo.N;
  // reset combat flags
  for (const f of st.forces) f.inCombat = 0;
  // bucket attackers by target
  const buckets = new Map();
  for (const f of st.forces) {
    if (f.branch !== 'land' || f.order.kind !== 'attack' || f.dest >= 0) continue;
    const T = f.order.target;
    if (!geo.regions[f.loc].adj.some((a) => a.to === T)) { f.order = { kind: 'hold', target: -1 }; continue; }
    if (!sim.hostile[f.owner * N + reg.ctrl[T]]) { f.order = { kind: 'hold', target: -1 }; continue; } // target no longer hostile
    if (!buckets.has(T)) buckets.set(T, []);
    buckets.get(T).push(f);
  }
  // supply & fort update for every region with forces
  for (const f of st.forces) {
    if (f.branch === 'sea') { if (f.port !== undefined) f.supply += 0.1 * (1 - f.supply); continue; }
    const mm = st.countries[f.owner].mil;
    const tgt = supplyAt(sim, f.owner, f.loc) * (mm.ammo > 0 ? 1 : 0.45) * (mm.fuel > 0 ? 1 : 0.6);
    f.supply += 0.3 * (tgt - f.supply);
    if (f.supply < 0.25 && f.branch === 'land') { f.morale = clamp(f.morale - 0.006, 0, 1); f.size = Math.max(0.05, f.size * 0.9985); }
    if (f.branch === 'land' && !(f.order.kind === 'attack') && f.dest < 0 && f.loc >= 0) reg.fort[f.loc] = Math.min(0.5, reg.fort[f.loc] + 0.002);
  }
  for (const [T, atk] of buckets) {
    const defCountry = reg.ctrl[T];
    const attackerOwners = new Set(atk.map((f) => f.owner));
    const defenders = []; const reserve = [];
    for (const f of sim.forcesAtRegion.get(T) || []) if (f.branch === 'land' && [...attackerOwners].some((o) => sim.hostile[o * N + f.owner])) defenders.push(f);
    for (const a of geo.regions[T].adj) for (const f of sim.forcesAtRegion.get(a.to) || []) if (f.branch === 'land' && f.dest < 0 && f.order.kind !== 'attack' && reg.ctrl[a.to] === reg.ctrl[T] && [...attackerOwners].some((o) => sim.hostile[o * N + f.owner]) && !defenders.includes(f)) reserve.push(f);
    const terr = TERRAIN[geo.regions[T].terrain];
    // attacker strength
    let A = 0; const types = new Set();
    for (const f of atk) { A += landStrength(sim, f, 'atk'); types.add(f.type); f.prep = (f.prep || 0) + 1; }
    const prepAvg = atk.reduce((s, f) => s + f.prep, 0) / atk.length;
    const combinedArms = 1 + (types.has('art') ? 0.07 : 0) + (types.has('arm') || types.has('mech') ? 0.08 : 0) + (types.has('inf') ? 0.03 : 0);
    const mainOwner = atk[0].owner;
    const airSup = airSuperiority(sim, mainOwner, defCountry, T);
    const air = 1 + 0.22 * airSup + 0.08 * Math.min(1, wingsNear(sim, mainOwner, T).ground / 4);
    const link = geo.regions[atk[0].loc].adj.find((a) => a.to === T);
    const strait = link && link.strait ? Math.max(0.22, 0.5 - 0.08 * link.gap) : 1; // opposed landing: much harder than an overland advance
    if (link && link.strait && link.gap >= 3 && !sim.forcesOf[mainOwner].some((x) => x.branch === 'sea' && x.size > 0.3)) { for (const f of atk) f.order = { kind: 'hold', target: -1 }; continue; }
    A *= combinedArms * (1 + Math.min(0.25, prepAvg * 0.012)) * terr.attack * air * strait;
    // defender strength
    let D = 0;
    for (const f of defenders) D += landStrength(sim, f, 'def');
    for (const f of reserve) D += 0.35 * landStrength(sim, f, 'def');
    const city = 1 + 0.12 * Math.min(1, geo.regions[T].cityPop / 10) + (T === geo.capitalRegion[reg.owner[T]] ? 0.15 : 0);
    const dAir = 1 - 0.18 * airSup;
    D *= terr.defense * (1 + reg.fort[T]) * city * dAir * (reg.ctrl[T] === reg.owner[T] ? 1.0 : 0.9);
    const ratio = A / Math.max(0.0001, D);
    // casualties
    const intensity = 0.0013;
    const aCas = intensity * (0.6 + 1.4 * clamp(1 / Math.sqrt(Math.max(0.05, ratio)), 0.25, 2.2)) * (defenders.length ? 1 : 0.15);
    const dCas = intensity * (0.6 + 1.2 * clamp(Math.sqrt(ratio), 0.25, 2.5));
    applyLosses(sim, atk, aCas, ratio >= 1);
    applyLosses(sim, defenders, dCas, ratio < 1);
    for (const f of atk) { f.inCombat = 1; f.org = clamp(f.org - 0.012 - (ratio < 1 ? 0.01 : 0), 0.05, 1); f.morale = clamp(f.morale + (ratio >= 1.1 ? 0.002 : -0.004), 0, 1); f.exp = Math.min(1, f.exp + 0.0007); }
    for (const f of defenders) { f.inCombat = 1; f.org = clamp(f.org - 0.008 - (ratio > 1.4 ? 0.012 : 0), 0.05, 1); f.morale = clamp(f.morale + (ratio < 0.9 ? 0.002 : -0.004), 0, 1); f.exp = Math.min(1, f.exp + 0.0007); }
    for (const f of reserve) f.inCombat = 1;
    // progress towards capture
    if (reg.contestBy[T] !== mainOwner) { reg.contestBy[T] = mainOwner; reg.contestProg[T] = 0; }
    const sizeF = Math.sqrt(geo.regions[T].area / 220000);
    const adv = defenders.length ? 2.4 * terr.mobility * Math.min(2.2, Math.max(0, ratio - 0.85) ** 0.6) / Math.max(0.9, sizeF) : 2.2 * terr.mobility / Math.max(0.9, sizeF);
    reg.contestProg[T] = clamp(reg.contestProg[T] + adv - (ratio < 0.8 ? 2 : 0), 0, 140);
    if (reg.contestProg[T] >= 100) captureRegion(sim, T, mainOwner, atk, defenders, day);
  }
  // decay contests without attackers
  for (let r = 0; r < reg.contestProg.length; r++) if (reg.contestProg[r] > 0 && !buckets.has(r)) { reg.contestProg[r] = Math.max(0, reg.contestProg[r] - 3); if (reg.contestProg[r] === 0) reg.contestBy[r] = -1; }
  // devastation recovers slowly
  if (day % 10 === 0) for (let r = 0; r < reg.dev.length; r++) if (reg.dev[r] > 0 && !(buckets.has(r))) reg.dev[r] = Math.max(0, reg.dev[r] - 0.004);
}
function applyLosses(sim, forces, frac, winning) {
  const st = sim.state;
  for (const f of forces) {
    const loss = f.size * frac * (f.type === 'arm' ? 1.1 : 1);
    const c = st.countries[f.owner];
    f.size = Math.max(0.05, f.size - loss);
    f.fill = Math.max(0.1, f.fill - frac * 0.8 * (f.type === 'arm' || f.type === 'mech' ? 1.3 : 1));
    c.mil.active = Math.max(0, c.mil.active - loss * 0.55); c.mil.casualties += loss; c.mil.casualtiesMonth = (c.mil.casualtiesMonth || 0) + loss;
    c.mil.k.land = Math.max(0, c.mil.k.land - c.mil.k0.land * frac * 0.5 / Math.max(1, sim.forcesOf[f.owner].filter((x) => x.branch === 'land').length));
    const dead = loss * 0.28; c.pop.coh[1] = Math.max(0.01, c.pop.coh[1] - dead / 1000);
    for (const w of st.wars) if (w.active && sideOf(w, f.owner)) w.cas[f.owner] = (w.cas[f.owner] || 0) + loss;
  }
}
function captureRegion(sim, T, by, atk, defenders, day) {
  const reg = sim.state.reg, geo = sim.geo, st = sim.state;
  const prevCtl = reg.ctrl[T];
  reg.ctrl[T] = by; reg.contestProg[T] = 0; reg.contestBy[T] = -1; reg.fort[T] = 0; reg.dev[T] = Math.min(0.9, reg.dev[T] + 0.06);
  // defenders retreat or are destroyed
  for (const f of defenders) {
    const friendly = alliedSet(sim, f.owner);
    const cands = geo.regions[T].adj.map((a) => a.to).filter((r) => friendly.has(reg.ctrl[r]));
    if (cands.length) { cands.sort((a, b) => (sim.forcesAtRegion.get(a)?.length || 0) - (sim.forcesAtRegion.get(b)?.length || 0)); f.loc = cands[0]; f.org = Math.max(0.1, f.org - 0.15); f.morale = clamp(f.morale - 0.08, 0, 1); f.order = { kind: 'defend', target: -1 }; f.dest = -1; }
    else { const lost = f.size * 0.7; f.size = Math.max(0.05, f.size - lost); sim.state.countries[f.owner].mil.active = Math.max(0, sim.state.countries[f.owner].mil.active - lost); const adjAny = geo.regions[T].adj.map((a) => a.to).filter((r) => reg.ctrl[r] === f.owner); f.loc = adjAny[0] ?? f.loc; f.morale = 0.2; }
  }
  // lead attackers advance
  for (const f of atk) { f.loc = T; f.order = { kind: 'hold', target: -1 }; f.prep = 0; f.org = Math.max(0.2, f.org - 0.05); f.exp = Math.min(1, f.exp + 0.02); }
  sim.rebuildOwnedRegions(); sim.indexForces();
  const owner = reg.owner[T];
  const oc = st.countries[owner];
  sim.log(by, 'war', `${st.countries[by].name} captures ${regionLabel(sim, T)} from ${st.countries[prevCtl].name}`, { region: T, by, from: prevCtl, owner }, (by === st.playerId || prevCtl === st.playerId || owner === st.playerId) ? 'high' : 'low');
  sim.emit('capture', { region: T, by });
  if (T === geo.capitalRegion[owner]) { oc.flags.capitalHeldSince = day; sim.log(owner, 'war', `The capital of ${oc.name} has fallen`, { owner }, 'high'); }
}
export function regionLabel(sim, r) {
  const g = sim.geo; const reg = g.regions[r]; const c = g.cities.find((x) => x.region === r);
  const owner = sim.state.countries[sim.state.reg.owner[r]];
  return c ? `${c.name} region (${owner.name})` : `${owner.name} region ${r}`;
}
function relocateStranded(sim) {
  const reg = sim.state.reg; const geo = sim.geo;
  for (const f of sim.state.forces) {
    if (f.branch === 'sea' || f.branch === 'air') continue;
    const friendly = alliedSet(sim, f.owner);
    if (friendly.has(reg.ctrl[f.loc]) || !sim.atWar(f.owner)) { if (!friendly.has(reg.ctrl[f.loc]) && !sim.atWar(f.owner)) { /* foreign region in peace: send home */ } else continue; }
    if (friendly.has(reg.ctrl[f.loc])) continue;
    // nearest friendly region
    let best = -1, bd = Infinity;
    for (const ri of sim.controlledBy[f.owner]) { const d = regDist(sim, f.loc, ri); if (d < bd) { bd = d; best = ri; } }
    if (best >= 0) { f.loc = best; f.dest = -1; f.order = { kind: 'hold', target: -1 }; }
  }
}
function consumeStocks(sim) {
  for (const c of belligerents(sim)) {
    const fs = sim.forcesOf[c.idx].filter((f) => f.branch === 'land');
    if (!fs.length) continue;
    const tempo = fs.filter((f) => f.inCombat).length / fs.length;
    c.mil.ammo = Math.max(0, c.mil.ammo - (0.05 + 1.1 * tempo) * 0.25);
    c.mil.fuel = Math.max(0, c.mil.fuel - (0.03 + 0.7 * tempo) * 0.2);
    if (c.mil.ammo <= 0) for (const f of fs) if (f.inCombat) f.fill = Math.max(0.1, f.fill * 0.997);
  }
}
function checkCapitulation(sim, day) {
  const st = sim.state, geo = sim.geo, reg = st.reg;
  for (const w of st.wars) {
    if (!w.active) continue;
    for (const side of ['a', 'd']) {
      const members = side === 'a' ? w.attackers : w.defenders;
      for (const i of members.slice()) {
        const c = st.countries[i];
        const capLost = reg.ctrl[geo.capitalRegion[i]] !== i && c.flags.capitalHeldSince !== undefined && day - c.flags.capitalHeldSince > 60;
        const remaining = geo.cRegions[i].filter((r) => reg.ctrl[r] === i).length;
        if (capLost || remaining === 0 || c.mil.exhaustion > 0.97) capitulate(sim, w, i, side, capLost ? 'fall of the capital' : remaining === 0 ? 'total occupation' : 'collapse of the war effort');
      }
    }
  }
}
function capitulate(sim, w, i, side, why) {
  const st = sim.state, geo = sim.geo, reg = st.reg;
  const c = st.countries[i];
  const winners = side === 'a' ? w.defenders : w.attackers;
  // winners keep what they occupy of i's territory (except capital region stays with i); reparations + demilitarisation
  const terms = [];
  for (const ri of geo.cRegions[i]) { const ctl = reg.ctrl[ri]; if (ctl !== i && winners.includes(ctl) && ri !== geo.capitalRegion[i] && geo.cRegions[i].filter((x) => reg.owner[x] === i).length > 1) terms.push({ kind: 'cede', region: ri, to: ctl }); }
  applyTerms(sim, w, winners[0], i, [...terms, { kind: 'reparations', pct: 0.01, years: 5 }, { kind: 'demilitarize' }]);
  sim.log(i, 'peace', `${c.name} capitulates (${why})`, { war: w.id }, 'high');
  endWarFor(sim, w, i, 'capitulation');
}

// ---------------------------------------------------------------------------------------------------- monthly: scores, exhaustion
export function monthlyWar(sim, day) {
  const st = sim.state, geo = sim.geo, reg = st.reg;
  if (!st.wars.some((w) => w.active)) return;
  for (const w of st.wars) {
    if (!w.active) continue;
    for (const [side, members, foes] of [['a', w.attackers, w.defenders], ['d', w.defenders, w.attackers]]) {
      let occ = 0, tot = 0;
      for (const f of foes) {
        const c = st.countries[f]; const gdpW = Math.max(1, c.econ.gdp);
        for (const ri of geo.cRegions[f]) { const val = geo.regions[ri].popW * (ri === geo.capitalRegion[f] ? 1.6 : 1); tot += val * gdpW; if (members.includes(reg.ctrl[ri])) occ += val * gdpW; }
      }
      const cas = foes.reduce((s, f) => s + (w.cas[f] || 0), 0), own = members.reduce((s, f) => s + (w.cas[f] || 0), 0);
      const casScore = 20 * clamp((cas - own) / Math.max(10, cas + own), -1, 1);
      let blk = 0, dv = 0; for (const f of foes) { blk += sim.state.lastBlockade[f] || 0; for (const ri of geo.cRegions[f]) dv += reg.dev[ri] * geo.regions[ri].popW; } blk /= foes.length; dv /= foes.length;
      w.score[side] = clamp(100 * (tot > 0 ? occ / tot : 0) * 1.5 + casScore + 35 * blk + 35 * dv, -50, 100);
    }
  }
  for (const c of st.countries) {
    if (!atWar(sim, c.idx)) { c.mil.casualtiesMonth = 0; continue; }
    const m = c.mil; const prof = sim.govProfile(c);
    const casRate = (m.casualtiesMonth || 0) / Math.max(1, m.active0);
    const occ = sim.occupiedShare(c.idx);
    let d = 0.006 + 1.4 * casRate + 0.03 * occ + 0.004 * (c.econ.warLoss > 0.1 ? 1 : 0) + 0.004 * m.mobilization;
    d /= prof.warSupport;
    // winning countries tire more slowly
    const my = st.wars.filter((w) => w.active && sideOf(w, c.idx));
    const adv = my.length ? my.reduce((s, w) => s + (w.score[sideOf(w, c.idx)] - w.score[sideOf(w, c.idx) === 'a' ? 'd' : 'a']), 0) / my.length : 0;
    d -= 0.004 * clamp(adv / 50, -1, 1) * 1.0;
    m.exhaustion = clamp(m.exhaustion + d, 0, 1);
    m.casualtiesMonth = 0;
  }
}

// ---------------------------------------------------------------------------------------------------- peace
const REGION_COST = (sim, w, ri) => { const c = sim.state.countries[sim.state.reg.owner[ri]]; const total = sim.geo.cRegions[sim.state.reg.owner[ri]].length; return 12 + 70 * sim.geo.regions[ri].popW * (ri === sim.geo.capitalRegion[sim.state.reg.owner[ri]] ? 2 : 1); };
export function termCost(sim, w, term) {
  switch (term.kind) {
    case 'cede': return REGION_COST(sim, w, term.region);
    case 'reparations': return 6 * term.pct * 100 * Math.min(10, term.years) / 5;
    case 'demilitarize': return 18;
    case 'puppet': return 90;
    case 'ceasefire': case 'status_quo': return 0;
    default: return 10;
  }
}
// How willing is `target` to accept `terms` from `proposer`? Pure function of public/own information (used by UI & AI).
export function evaluatePeace(sim, w, proposer, target, terms) {
  const sp = sideOf(w, proposer), st0 = sideOf(w, target);
  if (!sp || !st0 || sp === st0) return { accept: false, margin: -99, reasons: ['not opposing belligerents'] };
  const adv = w.score[sp] - w.score[st0]; // proposer's advantage in [-150,150]
  const c = sim.state.countries[target];
  const cost = terms.reduce((s, t) => s + termCost(sim, w, t), 0);
  const ex = c.mil.exhaustion;
  const stability = c.gov.stability;
  const will = Math.max(0, adv) * 0.85 + 55 * ex + 18 * (1 - stability) + (cost === 0 ? 8 : 0) - (adv < 0 ? 0 : 0);
  const margin = will - cost - (cost > 0 ? 6 : 0);
  const reasons = [`war score advantage ${adv.toFixed(0)}`, `exhaustion ${(ex * 100).toFixed(0)}%`, `terms cost ${cost.toFixed(0)}`];
  return { accept: margin >= 0, margin, cost, will, advantage: adv, reasons };
}
export function proposePeace(sim, w, proposer, target, terms) {
  const ev = evaluatePeace(sim, w, proposer, target, terms);
  if (!ev.accept) return { ok: false, reason: 'rejected', eval: ev };
  applyTerms(sim, w, proposer, target, terms);
  for (const side of [proposer, target]) { /* per-pair peace */ }
  // both leave the war with each other: if the pair are the leaders end the war for everyone
  const leadersPair = (w.leaders.includes(proposer) && w.leaders.includes(target));
  if (leadersPair) { for (const x of [...w.attackers, ...w.defenders]) { if (x !== proposer && x !== target) sim.log(x, 'peace', `${sim.state.countries[x].name}: war ended by leaders' settlement`, {}, 'low'); } w.active = false; w.end = sim.state.day; w.endReason = 'negotiated peace'; for (const x of [...w.attackers, ...w.defenders]) { sim.state.countries[x].mil.mobilizationTarget = atWar(sim, x) ? 1 : 0; } }
  else { endWarFor(sim, w, target, 'separate peace'); if (!w.attackers.includes(proposer) && !w.defenders.includes(proposer)) { /* ended */ } }
  for (const pp of [proposer, target]) if (pp === sim.state.playerId) { bump(sim, 'peace'); if (!Object.keys(sim.state.reg.owner).some((r) => sim.state.reg.owner[r] === pp && sim.state.reg.ctrl[r] !== pp)) bump(sim, 'defended'); }
  if (!w.active) { sim.log(proposer, 'peace', `${w.name} ends: negotiated peace`, { war: w.id }, 'high'); sim.emit('war', { type: 'ended', war: w.id }); }
  for (const x of [proposer, target]) sim.state.countries[x].mil.mobilizationTarget = atWar(sim, x) ? 1 : 0;
  sim.state.treaties.push({ id: sim.state.nextId++, type: 'ceasefire', parties: [proposer, target], start: sim.state.day, end: sim.state.day + 365 * 4, active: true });
  sim.rel(proposer, target, 10, 5); sim.rel(target, proposer, 5, 0);
  relocateStranded(sim);
  return { ok: true, eval: ev };
}
export function applyTerms(sim, w, winner, loser, terms) {
  const st = sim.state, reg = st.reg;
  for (const t of terms) {
    if (t.kind === 'cede') {
      if (reg.owner[t.region] === loser) { reg.owner[t.region] = t.to ?? winner; reg.ctrl[t.region] = t.to ?? winner; }
    } else if (t.kind === 'reparations') { st.countries[loser].reparations = { to: winner, pct: t.pct, until: st.day + 365 * t.years }; }
    else if (t.kind === 'demilitarize') { const m = st.countries[loser].mil; m.demilUntil = st.day + 365 * 5; m.mobilizationTarget = 0; for (const f of sim.forcesOf[loser]) f.size *= 0.7; m.active *= 0.75; }
  }
  // all occupied regions between the pair revert to owners (unless ceded above)
  for (let r = 0; r < reg.owner.length; r++) { if (reg.ctrl[r] !== reg.owner[r] && ((reg.ctrl[r] === winner && reg.owner[r] === loser) || (reg.ctrl[r] === loser && reg.owner[r] === winner))) reg.ctrl[r] = reg.owner[r]; reg.contestProg[r] = 0; reg.contestBy[r] = -1; }
  sim.rebuildOwnedRegions();
}
