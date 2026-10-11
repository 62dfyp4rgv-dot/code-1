// Diplomacy (init part; full rules appended below in later revisions)
import { clamp } from './constants.js';
import { hash01 } from './rng.js';
import { bump } from './achievements.js';

export function initOrgsAndTreaties(sim) {
  const { data, geo, state } = sim;
  const N = geo.N;
  const expand = (m) => {
    if (m === '*') return geo.rows.map((_, i) => i);
    if (m.startsWith('@')) { const r = m.slice(1); return geo.rows.map((x, i) => (x.region === r ? i : -1)).filter((i) => i >= 0); }
    const i = geo.idOf[m]; return i === undefined ? [] : [i];
  };
  for (const o of data.orgs) {
    const members = [...new Set(o.members.flatMap(expand))];
    state.orgs.push({ id: o.id, type: o.type, name: o.name, members, permanent: (o.permanent || []).map((x) => geo.idOf[x]), rotating: [] });
  }
  const un = state.orgs.find((o) => o.id === 'un');
  if (un) {
    const pool = un.members.filter((i) => !un.permanent.includes(i));
    const picks = []; const tmp = pool.slice();
    for (let k = 0; k < (data.orgs.find((o) => o.id === 'un').rotating || 0) && tmp.length; k++) picks.push(tmp.splice(sim.rng.int(0, tmp.length - 1), 1)[0]);
    un.rotating = picks;
  }
  for (const [a, b] of data.defensePacts) {
    const ia = geo.idOf[a], ib = geo.idOf[b]; if (ia === undefined || ib === undefined) continue;
    state.treaties.push({ id: state.nextId++, type: 'defense_pact', parties: [ia, ib], start: 0, active: true, end: null });
  }
  // implicit security guarantees (data: orgs.json "guarantees"): [guarantor, protected]; not alliances, but they deter aggressors
  for (const [g, p] of data.guarantees || []) {
    const ig = geo.idOf[g], ip = geo.idOf[p]; if (ig === undefined || ip === undefined) continue;
    state.treaties.push({ id: state.nextId++, type: 'guarantee', parties: [ig, ip], guarantor: ig, start: 0, active: true, end: null });
  }
}
export function initRelations(sim) {
  const { geo, state, data } = sim; const N = geo.N;
  const op = new Int8Array(N * N), trust = new Int8Array(N * N);
  const orgsOf = Array.from({ length: N }, () => new Set());
  for (const o of state.orgs) if (o.id !== 'un') for (const m of o.members) orgsOf[m].add(o.id + ':' + o.type);
  const rivalry = new Float32Array(N * N);
  for (const [a, b, inten] of data.rivalries) { const i = geo.idOf[a], j = geo.idOf[b]; if (i === undefined || j === undefined) continue; rivalry[i * N + j] = Math.max(rivalry[i * N + j], inten); rivalry[j * N + i] = Math.max(rivalry[j * N + i], inten); }
  const pact = new Uint8Array(N * N);
  for (const t of state.treaties) if (t.type === 'defense_pact' || t.type === 'alliance') { pact[t.parties[0] * N + t.parties[1]] = 1; pact[t.parties[1] * N + t.parties[0]] = 1; }
  const natoLike = (i, j) => { for (const o of state.orgs) if (o.type === 'alliance' && o.members.includes(i) && o.members.includes(j)) return true; return false; };
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (i === j) continue;
    const a = state.countries[i], b = state.countries[j];
    let v = 6;
    let shared = 0; for (const t of orgsOf[i]) if (orgsOf[j].has(t)) shared += t.endsWith('alliance') ? 22 : t.endsWith('trade_bloc') ? 12 : t.endsWith('forum') ? 6 : 3;
    v += Math.min(40, shared);
    if (pact[i * N + j]) v += 20;
    if (geo.rows[i].region === geo.rows[j].region) v += 5;
    v += 0.12 * (22 - Math.abs(a.gov.dem - b.gov.dem) * 0.9);
    if (geo.landNeighbors[i].has(j)) v -= 3;
    v -= 0.85 * rivalry[i * N + j];
    v += (hash01(a.id + b.id) - 0.5) * 14;
    op[i * N + j] = clamp(Math.round(v), -100, 100);
    trust[i * N + j] = clamp(Math.round(v * 0.55 + (pact[i * N + j] ? 15 : 0)), -100, 100);
  }
  state.rel = { op, trust, rivalry };
}

// ============================================================================ relations primitives
export const CB_TYPES = ['claim', 'ally_attacked', 'liberation', 'grievance', 'ultimatum', 'mandate'];

export function opinion(sim, i, j) { return sim.state.rel.op[i * sim.geo.N + j]; }
export function trustOf(sim, i, j) { return sim.state.rel.trust[i * sim.geo.N + j]; }
export function rel(sim, i, j, dOp, dTrust = 0) {
  const N = sim.geo.N, r = sim.state.rel;
  r.op[i * N + j] = clamp(r.op[i * N + j] + dOp, -100, 100);
  r.trust[i * N + j] = clamp(r.trust[i * N + j] + dTrust, -100, 100);
}
export function adjustCredibility(sim, i, d) { const c = sim.state.countries[i]; c.dip.credibility = clamp(c.dip.credibility + d, 0, 100); }
export function worldOpinionShift(sim, i, d, democracyWeight = 0.5) {
  const N = sim.geo.N, cs = sim.state.countries;
  for (let j = 0; j < N; j++) { if (j === i) continue; const w = 0.5 + democracyWeight * (cs[j].gov.dem / 100); rel(sim, j, i, d * w); }
}
export function alliesOf(sim, i) {
  const s = new Set();
  for (const t of sim.state.treaties) if (t.active && (t.type === 'defense_pact' || t.type === 'alliance') && t.parties.includes(i)) for (const p of t.parties) if (p !== i) s.add(p);
  for (const o of sim.state.orgs) if (o.type === 'alliance' && o.members.includes(i)) for (const p of o.members) if (p !== i) s.add(p);
  return s;
}
export function hasCasusBelli(sim, att, def) {
  const st = sim.state, reg = st.reg, geo = sim.geo;
  const a = st.countries[att];
  if (a.dip.cb[def] && a.dip.cb[def] > st.day) return true;
  for (const cl of sim.claimRegions) if (cl.by === att && reg.owner[cl.region] === def) return true;
  for (let r = 0; r < reg.owner.length; r++) if (reg.ctrl[r] === def && reg.owner[r] === att) return true; // liberation
  for (const w of st.wars) if (w.active) { for (const al of alliesOf(sim, att)) if ((w.attackers.includes(al) && w.defenders.includes(att)) || (w.defenders.includes(al) && w.attackers.includes(def))) return true; if (w.attackers.includes(def) && w.defenders.includes(att)) return true; }
  return false;
}
export function initDiplomacyState(sim) {
  const { data, geo, state } = sim;
  for (const c of state.countries) {
    c.dip = { influence: 30, credibility: 55 + Math.round(c.gov.dem / 8), cb: {}, cooldown: {}, grievance: {}, infamy: 0, pending: [], vassalOf: null, lastAction: -9999, offers: [] };
    
  }
  state.sanctions = [];
  sim.claimRegions = [];
  for (const cl of data.claims) {
    const by = geo.idOf[cl.by]; if (by === undefined) continue;
    const r = geo.regionAt(cl.lon, cl.lat); if (r < 0) continue;
    if (!sim.claimRegions.some((x) => x.by === by && x.region === r)) sim.claimRegions.push({ by, region: r, label: cl.label });
  }
}

// ============================================================================ proposals
const COSTS = { improve: 8, trade_agreement: 12, non_aggression: 10, defense_pact: 28, alliance: 38, research_partnership: 14, aid: 12, arms_deal: 12, sanction: 22, lift_sanction: 6, mediate: 18, ultimatum: 14, un_resolution: 22, join_org: 26, leave_org: 8, guarantee: 16, embassy: 6, recognize: 10 };
export function dipCost(type) { return COSTS[type] ?? 10; }

// Acceptance evaluation: pure function of (observer's view of) relations & capabilities. Returns factors for UI transparency.
export function evaluateProposal(sim, from, to, type, params = {}) {
  const N = sim.geo.N, st = sim.state, geo = sim.geo;
  const A = st.countries[from], B = st.countries[to];
  const op = opinion(sim, to, from), tr = trustOf(sim, to, from);
  const f = [];
  let score = 0;
  const add = (label, v) => { f.push({ label, v: +v.toFixed(1) }); score += v; };
  add('Their opinion of you', op * 0.35);
  add('Trust', tr * 0.2);
  const rivalry = st.rel.rivalry[from * N + to]; if (rivalry > 0) add('Standing rivalry', -rivalry * 0.4);
  const atWarWith = sim.atWarWith(from, to); if (atWarWith) add('At war', -100);
  const sharedEnemy = sharedRivals(sim, from, to);
  if (sharedEnemy > 0) add('Shared rivals', Math.min(15, sharedEnemy * 5));
  const ideoGap = Math.abs(A.gov.dem - B.gov.dem) / 100;
  const power = Math.log((A.econ.gdp + 1) / (B.econ.gdp + 1));
  switch (type) {
    case 'trade_agreement': {
      const complement = tradeComplement(sim, from, to); add('Trade complementarity', complement * 18);
      add('Ideological distance', -ideoGap * 8); if (B.econ.tariff0 > 0.1) add('Protectionist leanings', -4);
      score -= 8; break;
    }
    case 'non_aggression': add('Security concern', -4 + (st.rel.rivalry[from * N + to] > 40 ? 6 : 0)); break;
    case 'defense_pact': case 'alliance': {
      add('Ideological distance', -ideoGap * 15); add('Threat alignment', sharedEnemy * 6); score -= type === 'alliance' ? 34 : 24; if (geo.dist[from * N + to] > 9000) add('Remote partners', -6);
      add('Your credibility', (A.dip.credibility - 50) * 0.2);
      if (hasMilitaryRival(sim, to, from)) add('Rival of their partners', -30);
      break;
    }
    case 'research_partnership': add('Tech complementarity', Math.min(10, Math.abs(A.mt - B.mt) * 12)); score -= 6; break;
    case 'arms_deal': add('Defence needs', B.mil.exhaustion * 10 + (sim.atWar(to) ? 10 : 0)); score -= 6; break;
    case 'aid': score += 20; break;
    case 'guarantee': score -= 8; if (st.rel.rivalry[from * N + to] > 0) score -= 10; break;
    case 'join_org': {
      const org = st.orgs.find((o) => o.id === params.org); if (!org) return { accept: false, score: -99, factors: [{ label: 'unknown organisation', v: -99 }] };
      return evaluateAccession(sim, org, from);
    }
    case 'ultimatum': {
      const strength = milPower(sim, from) / Math.max(1, milPower(sim, to)); add('Relative military power', Math.log(strength) * 12); add('Nuclear deterrent', -B.mil.nukes * 12);
      add('Their resolve', -20 - 20 * (1 - B.mil.exhaustion)); add('Allies of target', -alliedPower(sim, to) * 6); break;
    }
    case 'mediate': break;
    default: break;
  }
  const accept = score > 0;
  return { accept, score, factors: f, prob: clamp(0.5 + score / 40, 0.02, 0.98) };
}
function sharedRivals(sim, a, b) { const N = sim.geo.N, r = sim.state.rel.rivalry; let n = 0; for (let k = 0; k < N; k++) if (k !== a && k !== b && r[a * N + k] > 50 && r[b * N + k] > 40) n++; return n; }
function hasMilitaryRival(sim, to, from) { const N = sim.geo.N, r = sim.state.rel.rivalry; for (const al of alliesOf(sim, to)) if (r[al * N + from] > 55) return true; return false; }
export function tradeComplement(sim, a, b) {
  const ea = sim.state.countries[a].econ, eb = sim.state.countries[b].econ; let c = 0;
  for (let k = 0; k < 4; k++) { const na = ea.exports[k] - ea.imports[k], nb = eb.exports[k] - eb.imports[k]; if (na * nb < 0) c += Math.min(Math.abs(na) / (ea.gdp + 1), Math.abs(nb) / (eb.gdp + 1)) * 10; }
  return clamp(c + 0.3, 0, 1.5);
}
export function milPower(sim, i) {
  const c = sim.state.countries[i]; let s = 0;
  for (const f of sim.forcesOf[i]) s += f.size * f.fill * (f.branch === 'land' ? c.mil.q.land : f.branch === 'air' ? 2.2 * c.mil.q.air : 2.5 * c.mil.q.sea) * (0.5 + 0.5 * f.morale);
  return s * (0.6 + 0.4 * c.mil.readiness) * (1 + 0.6 * c.mil.nukes * 0);
}
function alliedPower(sim, i) { let s = 0; for (const a of alliesOf(sim, i)) s += milPower(sim, a); return Math.log10(1 + s) ; }

function evaluateAccession(sim, org, who) {
  const st = sim.state; const c = st.countries[who]; const f = []; let ok = true;
  if (org.members.includes(who)) return { accept: false, score: -99, factors: [{ label: 'already a member', v: -99 }] };
  const votes = org.members.map((m) => opinion(sim, m, who));
  const frac = votes.filter((v) => v > 5).length / Math.max(1, votes.length);
  const need = org.type === 'alliance' ? 0.9 : org.type === 'trade_bloc' ? 0.65 : 0.5;
  f.push({ label: `Members in favour ${(frac * 100).toFixed(0)}% (need ${(need * 100).toFixed(0)}%)`, v: +((frac - need) * 30).toFixed(1) });
  let score = (frac - need) * 30;
  if (org.id === 'eu' || org.id === 'nato') { const d = c.gov.dem >= 65; f.push({ label: 'Democratic standards', v: d ? 6 : -30 }); score += d ? 6 : -30; }
  if (org.id === 'nato') { const atWar = sim.atWar(who); f.push({ label: 'Not at war', v: atWar ? -25 : 0 }); score += atWar ? -25 : 0; }
  if (org.id === 'eu') { const geoOk = ['western_europe', 'northern_europe', 'southern_europe', 'eastern_europe'].includes(c.region); f.push({ label: 'European country', v: geoOk ? 3 : -40 }); score += geoOk ? 3 : -40; }
  return { accept: score > 0, score, factors: f, prob: clamp(0.5 + score / 30, 0.02, 0.98) };
}

// ============================================================================ actions (executed by commands.js for player & AI)
export function actOnProposal(sim, from, to, type, params = {}) {
  const st = sim.state; const A = st.countries[from], B = st.countries[to];
  const cost = COSTS[type] ?? 10;
  if (A.dip.influence < cost) return { ok: false, reason: `needs ${cost} influence` };
  if (A.dip.cooldown[to + ':' + type] > st.day) return { ok: false, reason: 'recently tried' };
  const ev = evaluateProposal(sim, from, to, type, params);
  A.dip.influence -= cost;
  A.dip.cooldown[to + ':' + type] = st.day + 90;
  const rng = sim.rng;
  const accepted = type === 'improve' ? true : rng.chance(ev.prob);
  const res = { ok: true, accepted, eval: ev };
  const add = (t, extra = {}) => { if (from === st.playerId || to === st.playerId) bump(sim, 'treaties'); st.treaties.push({ id: st.nextId++, type: t, parties: [from, to], start: st.day, end: extra.years ? st.day + extra.years * 365 : null, active: true, ...extra }); };
  switch (type) {
    case 'improve': rel(sim, to, from, 8 + A.gov.bureaucracy * 4, 3); rel(sim, from, to, 2, 1); res.accepted = true; break;
    case 'trade_agreement': if (accepted) { add('trade_agreement'); rel(sim, to, from, 6, 4); rel(sim, from, to, 6, 4); } else rel(sim, to, from, -2); break;
    case 'non_aggression': if (accepted) { add('non_aggression', { years: 10 }); rel(sim, to, from, 5, 8); rel(sim, from, to, 5, 8); } break;
    case 'defense_pact': if (accepted) { add('defense_pact'); rel(sim, to, from, 10, 12); rel(sim, from, to, 10, 12); adjustCredibility(sim, from, 1); } break;
    case 'alliance': if (accepted) { add('alliance'); rel(sim, to, from, 14, 16); rel(sim, from, to, 14, 16); } break;
    case 'research_partnership': if (accepted) { add('research_partnership', { years: 8 }); rel(sim, to, from, 4, 5); rel(sim, from, to, 4, 5); } break;
    case 'guarantee': if (accepted) { add('guarantee', { guarantor: from }); rel(sim, to, from, 12, 10); } break;
    case 'aid': { const amt = params.amount || 0.002 * A.econ.gdp; if (A.econ.debt + amt > 3 * A.econ.gdp) return { ok: false, reason: 'cannot afford aid' }; A.econ.debt += amt; B.econ.reserves += amt * 0.5; B.econ.debt -= amt * 0.5; rel(sim, to, from, 10 + 40 * amt / Math.max(1, B.econ.gdp), 6); res.accepted = true; break; }
    case 'arms_deal': if (accepted) { const amt = params.amount || 0.004 * A.econ.gdp; add('arms_deal', { years: 3, amount: amt }); B.mil.k.land += amt * 0.4; B.mil.k.air += amt * 0.3; B.mil.k.sea += amt * 0.1; B.econ.debt += amt * 0.7; A.econ.debt -= amt * 0.7 * 0.5; rel(sim, to, from, 5, 4); } break;
    case 'sanction': { addSanction(sim, from, to, params.mask ?? 0b0110, params.coalition || []); res.accepted = true; break; }
    case 'ultimatum': {
      if (accepted) { rel(sim, to, from, -15, -10); B.gov.approval = clamp(B.gov.approval - 0.05, 0, 1); res.concession = true; }
      else { A.dip.cb[to] = st.day + 365; rel(sim, to, from, -10, -10); }
      break;
    }
    case 'mediate': { res.accepted = mediate(sim, from, to, params); break; }
    case 'join_org': { const org = st.orgs.find((o) => o.id === params.org); if (accepted && org) { org.members.push(from); rel(sim, from, to, 0); for (const m of org.members) { rel(sim, m, from, 3, 3); rel(sim, from, m, 3, 3); } sim.log(from, 'diplomacy', `${A.name} joins ${org.name}`, { org: org.id }, 'normal'); } break; }
    case 'embassy': { A.intel.embassies[to] = true; rel(sim, to, from, 2, 2); break; }
    case 'recognize': { rel(sim, to, from, 6, 2); break; }
  }
  res.accepted = res.accepted ?? accepted;
  A.dip.lastAction = st.day;
  if (accepted || type === 'improve') sim.log(from, 'diplomacy', `${A.name} → ${B.name}: ${type.replace(/_/g, ' ')} ${accepted ? 'accepted' : 'declined'}`, { type, from, to, accepted }, (from === st.playerId || to === st.playerId) ? 'high' : 'low');
  else sim.log(from, 'diplomacy', `${B.name} declines ${A.name}'s ${type.replace(/_/g, ' ')}`, { type, from, to }, (from === st.playerId || to === st.playerId) ? 'normal' : 'low');
  return res;
}
export function addSanction(sim, by, target, mask, coalition = []) {
  const st = sim.state;
  const s = { id: st.nextId++, by, target, mask, coalition: coalition.slice(), start: st.day };
  st.sanctions.push(s);
  rel(sim, target, by, -25, -20); rel(sim, by, target, -8, -5);
  sim.log(by, 'diplomacy', `${st.countries[by].name} imposes sanctions on ${st.countries[target].name}`, { by, target, mask }, 'high');
  return s;
}
export function liftSanction(sim, id) { const st = sim.state; const s = st.sanctions.find((x) => x.id === id); if (!s) return false; st.sanctions = st.sanctions.filter((x) => x.id !== id); rel(sim, s.target, s.by, 6, 4); return true; }
function mediate(sim, med, target, params) {
  const st = sim.state; const w = st.wars.find((x) => x.active && sideOf2(x, target));
  if (!w) return false;
  const sideT = w.attackers.includes(target) ? w.attackers : w.defenders; const other = sideT === w.attackers ? w.defenders : w.attackers;
  const prob = clamp(0.15 + 0.004 * (opinion(sim, other[0], med) + opinion(sim, target, med)) + 0.002 * st.countries[med].dip.credibility, 0.05, 0.8);
  if (sim.rng.chance(prob)) { for (const x of [...w.attackers, ...w.defenders]) st.countries[x].mil.exhaustion = clamp(st.countries[x].mil.exhaustion + 0.12, 0, 1); sim.log(med, 'diplomacy', `${st.countries[med].name}'s mediation increases pressure for peace`, { war: w.id }, 'high'); return true; }
  return false;
}
const sideOf2 = (w, i) => w.attackers.includes(i) || w.defenders.includes(i);

// ============================================================================ call to arms
export function resolveCallToArms(sim, w, call) {
  const st = sim.state; const a = st.countries[call.ally];
  const enemies = call.side === 'd' ? w.attackers : w.defenders; const principal = call.principal;
  if (call.ally === st.playerId) {
    a.dip.pending.push({ kind: 'call', war: w.id, side: call.side, principal, expires: st.day + 30 });
    sim.log(call.ally, 'diplomacy', `${st.countries[principal].name} calls on you to join the ${w.name}`, { war: w.id, principal, side: call.side, decision: true }, 'high');
    return;
  }
  const willing = callWillingness(sim, call.ally, w, call);
  if (willing > 0) sim.joinWar(w, call.ally, call.side);
  else if (call.side === 'd') { adjustCredibility(sim, call.ally, -4); rel(sim, principal, call.ally, -12, -10); sim.log(call.ally, 'diplomacy', `${a.name} declines to honour its commitment to ${st.countries[principal].name}`, { war: w.id }, 'normal'); }
}
export function callWillingness(sim, ally, w, call) {
  const st = sim.state; const A = st.countries[ally]; const foes = call.side === 'd' ? w.attackers : w.defenders;
  const N = sim.geo.N; let s = call.side === 'd' ? 0.35 : -0.15;
  s += 0.012 * opinion(sim, ally, call.principal);
  s += 0.008 * Math.max(...foes.map((f) => st.rel.rivalry[ally * N + f]));
  s -= 0.25 * Math.log10(1 + milPower(sim, foes[0])) / Math.max(0.5, Math.log10(1 + milPower(sim, ally)));
  s -= 1.2 * A.mil.exhaustion; if (sim.atWar(ally)) s -= 0.5;
  s += 0.004 * (A.dip.credibility - 50);
  if (foes.some((f) => st.countries[f].mil.nukes >= 2) && !(A.mil.nukes >= 1)) s -= 0.25;
  s -= 0.3 * (1 - A.gov.stability) * 2;
  s += sim.rng.normal(0, 0.08 * (1 + sim.diff.aiNoise * 3));
  return s;
}
export function respondToCall(sim, who, warId, join) {
  const st = sim.state; const c = st.countries[who]; const idx = c.dip.pending.findIndex((p) => p.kind === 'call' && p.war === warId); if (idx < 0) return false;
  const p = c.dip.pending.splice(idx, 1)[0]; const w = st.wars.find((x) => x.id === warId); if (!w || !w.active) return false;
  if (join) sim.joinWar(w, who, p.side);
  else if (p.side === 'd') { adjustCredibility(sim, who, -4); rel(sim, p.principal, who, -12, -10); }
  return true;
}

// ============================================================================ time steps
export function dailyStep(sim, day) {
  const st = sim.state;
  for (const c of st.countries) { if (c.dip.pending.length) { for (const p of c.dip.pending.slice()) if (p.expires <= day) { c.dip.pending.splice(c.dip.pending.indexOf(p), 1); if (p.kind === 'call') { adjustCredibility(sim, c.idx, -4); rel(sim, p.principal, c.idx, -10, -8); sim.log(c.idx, 'diplomacy', `${c.name} did not answer the call to arms`, {}, 'normal'); } } } }
}
export function initDerived(sim) {
  const { data, geo } = sim; sim.claimRegions = [];
  for (const cl of data.claims) { const by = geo.idOf[cl.by]; if (by === undefined) continue; const r = geo.regionAt(cl.lon, cl.lat); if (r < 0) continue; if (!sim.claimRegions.some((x) => x.by === by && x.region === r)) sim.claimRegions.push({ by, region: r, label: cl.label }); }
}
export function buildIndex(sim) {
  const st = sim.state, N = sim.geo.N;
  const ix = { bonus: new Int16Array(N * N), sanc: new Uint8Array(N * N), ceasefire: new Uint8Array(N * N), tradeT: new Uint8Array(N * N), claims: new Uint8Array(N * N), bloc: new Uint8Array(N * N), sharedOrgs: new Uint8Array(N * N), hostile: new Uint8Array(N * N) };
  const W = { alliance: 28, defense_pact: 20, trade_agreement: 10, non_aggression: 6, research_partnership: 6, guarantee: 8 };
  for (const t of st.treaties) {
    if (!t.active) continue; const [a, b] = t.parties; const w = W[t.type] || 0;
    ix.bonus[a * N + b] += w; ix.bonus[b * N + a] += w;
    if (t.type === 'ceasefire') { ix.ceasefire[a * N + b] = 1; ix.ceasefire[b * N + a] = 1; }
    if (t.type === 'trade_agreement') { ix.tradeT[a * N + b] = 1; ix.tradeT[b * N + a] = 1; }
  }
  for (const s of st.sanctions) { const coal = [s.by, ...(s.coalition || [])]; for (const x of coal) { ix.sanc[x * N + s.target] = 1; ix.sanc[s.target * N + x] = 1; } }
  for (const cl of sim.claimRegions) { const o = st.reg.owner[cl.region]; if (o !== cl.by) ix.claims[cl.by * N + o]++; }
  for (const o of st.orgs) { if (o.id === 'un') continue; for (const a of o.members) for (const b of o.members) if (a !== b) { ix.sharedOrgs[a * N + b]++; if (o.type === 'trade_bloc') ix.bloc[a * N + b] = 1; } }
  for (const w of st.wars) if (w.active) for (const a of w.attackers) for (const d of w.defenders) { ix.hostile[a * N + d] = 1; ix.hostile[d * N + a] = 1; }
  sim.dipIdx = ix; return ix;
}
export function monthlyStep(sim, day) {
  const st = sim.state, N = sim.geo.N, cs = st.countries;
  buildIndex(sim);
  const op = st.rel.op, tr = st.rel.trust;
  // influence income
  for (const c of cs) {
    const orgBonus = st.orgs.filter((o) => o.members.includes(c.idx)).length * 0.04;
    const gain = (0.55 + 0.11 * Math.pow(c.econ.gdp, 0.33)) * (0.55 + c.gov.bureaucracy) * (1 + orgBonus + 0.3 * (c.spendCat ? (c.spendCat.admin / c.econ.gdp) / c.econ.fiscal0.admin - 1 : 0)) * (c.idx === st.playerId ? 1 : 0.8);
    c.dip.influence = clamp(c.dip.influence + gain, 0, 100);
    c.dip.credibility = clamp(c.dip.credibility + (50 + c.gov.dem * 0.1 - c.dip.credibility) * 0.01, 0, 100);
    c.dip.infamy = Math.max(0, c.dip.infamy - 1);
  }
  // opinion drift: toward a structural baseline computed from treaties, blocs, hostility, trade and shared rivals
  const hostile = sim.dipIdx.hostile;
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (i === j) continue;
    const k = i * N + j; let target = 4;
    target += 0.1 * (20 - Math.abs(cs[i].gov.dem - cs[j].gov.dem) * 0.9);
    target -= 0.8 * st.rel.rivalry[k];
    if (hostile[k]) target -= 60;
    if (sim.sanctioned(i, j)) target -= 25;
    const bm = sim.tradeBloc(i, j); target += bm * 12;
    target += sim.treatyBonus(i, j);
    op[k] = clamp(Math.round(op[k] + clamp((target - op[k]) * 0.03, -2, 2)), -100, 100);
    tr[k] = clamp(Math.round(tr[k] + clamp((target * 0.6 - tr[k]) * 0.02, -1.5, 1.5)), -100, 100);
  }
  // treaty expiry
  for (const t of st.treaties) if (t.active && t.end !== null && t.end <= day) { t.active = false; }
  // sanctions: drift effects on trade access
  const world = cs.reduce((s, c) => s + c.econ.gdp, 0);
  for (const c of cs) c.econ.tradeAccess = 1;
  for (const s of st.sanctions) {
    const coal = [s.by, ...(s.coalition || [])]; const g = coal.reduce((a, i) => a + cs[i].econ.gdp, 0) / Math.max(1, world - cs[s.target].econ.gdp);
    const t = cs[s.target].econ; t.tradeAccess = Math.max(0.35, t.tradeAccess - 0.75 * Math.min(1, g * 1.4));
    cs[s.target].econ.sanctionPressure = g;
  }
  // reparations
  for (const c of cs) if (c.reparations) { const r = c.reparations; if (r.until < day) { c.reparations = null; continue; } const amt = r.pct * c.econ.gdp / 12; c.econ.debt += amt; cs[r.to].econ.debt -= amt; }
}
export function yearlyStep(sim, day) {}

// ============================================================================ Global Assembly / Security Council resolutions
export const UN_KINDS = { condemn: 'Condemn', sanction: 'Collective sanctions', ceasefire: 'Call for a ceasefire' };
export function unVote(sim, from, kind, target) {
  const st = sim.state, N = sim.geo.N; const un = st.orgs.find((o) => o.id === 'un'); if (!un) return null;
  const votes = { yes: [], no: [], abstain: [] }; const scores = new Array(N).fill(0);
  const allies = sim.alliesOf(target);
  for (const m of un.members) {
    if (m === from) { votes.yes.push(m); scores[m] = 1; continue; }
    if (m === target) { votes.no.push(m); scores[m] = -1; continue; }
    let s = 0.012 * opinion(sim, m, from) - 0.011 * opinion(sim, m, target);
    if (allies.has(m)) s -= 0.7;
    s += 0.004 * st.rel.rivalry[m * N + target];
    if (sim.atWarWith(m, target)) s += 0.5;
    if (kind === 'ceasefire') { s += 0.25 * (st.countries[m].gov.dem / 100) + (sim.atWar(m) ? -0.5 : 0.15); }
    if (kind === 'sanction') s -= 0.12 * (1 - st.countries[m].gov.dem / 100) + 0.0000 * 0;
    s += (hash01(st.countries[m].id + kind + target) - 0.5) * 0.3;
    scores[m] = s;
    (s > 0.15 ? votes.yes : s < -0.15 ? votes.no : votes.abstain).push(m);
  }
  const vetoBy = un.permanent.filter((p) => p !== from && scores[p] < -0.35);
  const passes = votes.yes.length > votes.no.length && vetoBy.length === 0;
  return { votes, vetoBy, passes, yes: votes.yes.length, no: votes.no.length, abstain: votes.abstain.length, scores };
}
export function unResolution(sim, from, kind, target, preview = false) {
  const st = sim.state; const A = st.countries[from];
  if (!UN_KINDS[kind]) return { ok: false, reason: 'unknown resolution' };
  if (kind === 'ceasefire' && !sim.atWar(target)) return { ok: false, reason: 'target is not at war' };
  const v = unVote(sim, from, kind, target); const cost = COSTS.un_resolution;
  if (preview) return { ok: true, vote: v, cost };
  if (A.dip.influence < cost) return { ok: false, reason: `needs ${cost} influence` };
  if (A.dip.cooldown['un:' + kind + ':' + target] > st.day) return { ok: false, reason: 'recently tabled' };
  A.dip.influence -= cost; A.dip.cooldown['un:' + kind + ':' + target] = st.day + 180;
  const T = st.countries[target];
  if (v.passes) {
    adjustCredibility(sim, from, 1); if (from === st.playerId) bump(sim, 'resolutions');
    if (kind === 'condemn') { T.gov.legitimacy = clamp(T.gov.legitimacy - 0.03, 0, 1); for (const m of v.votes.yes) rel(sim, m, target, -5, -3); }
    else if (kind === 'sanction') { const coalition = v.votes.yes.filter((m) => m !== from && m !== target).sort((a, b) => st.countries[b].econ.gdp - st.countries[a].econ.gdp).slice(0, 40); addSanction(sim, from, target, 0b0110, coalition); }
    else if (kind === 'ceasefire') { for (const w of st.wars) if (w.active && (w.attackers.includes(target) || w.defenders.includes(target))) for (const x of [...w.attackers, ...w.defenders]) st.countries[x].mil.exhaustion = clamp(st.countries[x].mil.exhaustion + 0.12, 0, 1); }
    sim.log(from, 'diplomacy', `Resolution adopted: ${UN_KINDS[kind]} (${T.name}) — ${v.yes} for, ${v.no} against`, { kind, target }, 'high');
  } else {
    adjustCredibility(sim, from, -1);
    sim.log(from, 'diplomacy', v.vetoBy.length ? `Resolution on ${T.name} vetoed by ${v.vetoBy.map((p) => st.countries[p].name).join(', ')}` : `Resolution on ${T.name} fails (${v.yes} for, ${v.no} against)`, { kind, target }, 'high');
  }
  return { ok: true, passed: v.passes, vote: v };
}
