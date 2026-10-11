// Domestic politics: approval, legitimacy, stability, unrest, corruption, elections, leadership, regime change, political capital.
import { GOV_PROFILE, clamp, BUDGET_CATS } from './constants.js';
import { modv } from './mods.js';
import { hash01 } from './rng.js';
import { leaderName, partyName } from './names.js';

const FRAGILE = {
  SDN: 0.22,
  SSD: 0.2,
  MLI: 0.3,
  BFA: 0.28,
  NER: 0.32,
  HTI: 0.2,
  SYR: 0.3,
  YEM: 0.2,
  LBY: 0.28,
  AFG: 0.35,
  MMR: 0.28,
  SOM: 0.2,
  CAF: 0.25,
  COD: 0.32,
  TCD: 0.35,
  IRQ: 0.45,
  LBN: 0.42,
  VEN: 0.42,
  PAK: 0.45,
  NGA: 0.5,
  MOZ: 0.42,
  BDI: 0.38,
  ETH: 0.45,
  UKR: 0.5,
  ERI: 0.5,
  GNB: 0.35,
  SLE: 0.45,
  LBR: 0.45,
  PSE: 0.35,
  ISR: 0.55,
  GIN: 0.4,
};
const POP_IDEO = {
  north_america: [0.2, 0.1, 0.1],
  caribbean: [-0.1, 0.3, 0.1],
  south_america: [-0.1, 0.3, 0.1],
  western_europe: [-0.1, -0.2, 0],
  northern_europe: [-0.3, -0.4, -0.1],
  southern_europe: [-0.1, 0.0, 0.1],
  eastern_europe: [0.1, 0.35, 0.3],
  russia: [0, 0.5, 0.4],
  central_asia: [0.1, 0.5, 0.3],
  middle_east: [0.1, 0.7, 0.4],
  north_africa: [0, 0.7, 0.3],
  west_africa: [0.1, 0.6, 0.2],
  central_africa: [0.1, 0.55, 0.2],
  east_africa: [0.05, 0.55, 0.2],
  southern_africa: [0, 0.4, 0.2],
  south_asia: [-0.05, 0.5, 0.3],
  east_asia: [0.05, 0.2, 0.3],
  southeast_asia: [0.05, 0.4, 0.2],
  oceania: [0.1, -0.05, 0],
};
export const AXES = ['econ', 'social', 'nation'];

export function initGovernment(sim, c, row) {
  const rng = sim.rng;
  const dev = c.dev0;
  const h = (k) => hash01(row.iso3 + k);
  const frag = FRAGILE[row.iso3];
  const type = row.gov;
  const base = POP_IDEO[row.region] || [0, 0.3, 0.2];
  const popIdeo = {
    econ: clamp(base[0] + (h('pe') - 0.5) * 0.3, -1, 1),
    social: clamp(base[1] + (h('ps') - 0.5) * 0.3, -1, 1),
    nation: clamp(base[2] + (h('pn') - 0.5) * 0.3, -1, 1),
  };
  const corr = clamp(0.78 - 0.5 * dev - 0.2 * (row.dem / 100) + 0.1 * (h('c') - 0.5) + (c.res0.oil > 1 ? 0.06 : 0), 0.05, 0.92);
  const leader = {
    name: leaderName(rng, row.iso3, row.region),
    since: -rng.int(0, type === 'lib_dem' || type === 'flawed_dem' ? 3 * 365 : 12 * 365),
    ideology: null,
  };
  const parties = makeParties(sim, c, row, popIdeo);
  const inc = parties[0];
  leader.ideology = { ...inc.ideology };
  c.gov = {
    type,
    dem: row.dem,
    stability: frag ?? clamp(0.5 + 0.32 * dev + 0.0015 * (row.dem - 50) + (h('s') - 0.5) * 0.1, 0.3, 0.88),
    approval: clamp(0.45 + 0.15 * (h('a') - 0.3) + 0.1 * dev, 0.28, 0.72),
    legitimacy: clamp(0.4 + 0.25 * dev + 0.25 * (row.dem / 100) + 0.1 * h('l'), 0.2, 0.9),
    corruption: corr,
    bureaucracy: clamp(0.18 + 0.62 * dev + 0.1 * (h('b') - 0.5), 0.1, 0.95),
    pc: 40 + rng.int(0, 30),
    unrest: clamp(0.15 + 0.5 * (1 - (frag ?? 0.7)), 0.02, 0.6),
    leader,
    parties,
    popIdeo,
    termYears: type === 'hybrid' ? 5 : 4,
    nextElection: null,
    collapseTimer: 0,
    collapses: 0,
    lastElection: null,
    ruling: 0,
    pcRate: 1,
    repress: GOV_PROFILE[type].repress,
    warSupport: 0.6,
    protestLevel: 0,
    scandal: 0,
  };
  c.gov0 = { type, corruption: corr, bureaucracy: c.gov.bureaucracy };
  c.mods = [];
  c.techMods = Object.create(null);
  c.mc = Object.create(null);
  if (GOV_PROFILE[type].elect) c.gov.nextElection = rng.int(30, c.gov.termYears * 365);
}
function makeParties(sim, c, row, pop) {
  const rng = sim.rng;
  const type = row.gov;
  const mk = (kind, e, s, n) => ({
    name: partyName(rng, kind),
    kind,
    ideology: { econ: clamp(e, -1, 1), social: clamp(s, -1, 1), nation: clamp(n, -1, 1) },
    support: 0,
  });
  const jit = () => (rng.next() - 0.5) * 0.2;
  if (GOV_PROFILE[type].elect) {
    const list = [
      mk('left', pop.econ - 0.6 + jit(), pop.social - 0.5 + jit(), pop.nation - 0.4 + jit()),
      mk('center_left', pop.econ - 0.25 + jit(), pop.social - 0.25 + jit(), pop.nation - 0.2 + jit()),
      mk('center_right', pop.econ + 0.25 + jit(), pop.social + 0.25 + jit(), pop.nation + 0.15 + jit()),
      mk('right', pop.econ + 0.55 + jit(), pop.social + 0.45 + jit(), pop.nation + 0.35 + jit()),
      mk('populist', pop.econ + jit(), pop.social + 0.5 + jit(), pop.nation + 0.7 + jit()),
    ];
    if (c.dev0 > 0.5) list.push(mk('green', pop.econ - 0.4, pop.social - 0.6, pop.nation - 0.6));
    const first = rng.pick(list);
    list.splice(list.indexOf(first), 1);
    list.unshift(first); // incumbent first
    list.forEach((p, i) => {
      p.support = i === 0 ? 0.3 : 0.7 / (list.length - 1);
    });
    return list;
  }
  const ruling = mk('ruling', pop.econ + 0.1 + jit(), pop.social + 0.3 + jit(), pop.nation + 0.3 + jit());
  const opp = mk('center_left', pop.econ - 0.3, pop.social - 0.4, pop.nation - 0.3);
  ruling.support = 0.6;
  opp.support = 0.4;
  return [ruling, opp];
}

export function policyIdeology(c) {
  const p = c.policy,
    e = c.econ;
  const welfareGdp = p.budget.welfare * p.spendRate,
    defGdp = p.budget.defense * p.spendRate;
  const econ = clamp(-((p.taxRate - 0.27) / 0.12 + (welfareGdp - 0.1) / 0.08 + (p.regulation - 0.5) / 0.4) / 2.2, -1, 1);
  const social = clamp(((p.surveillance - 0.4) / 0.4 - (p.pressFreedom - 0.5) / 0.5 - (p.immigration - 0.45) / 0.45) / 2.2, -1, 1);
  const nation = clamp(((p.tariff - 0.08) / 0.1 + (0.45 - p.immigration) / 0.4 + (defGdp - 0.02) / 0.03) / 2.2, -1, 1);
  return { econ, social, nation };
}
export function ideologyDistance(a, b) {
  return Math.sqrt(((a.econ - b.econ) ** 2 + (a.social - b.social) ** 2 + (a.nation - b.nation) ** 2) / 3);
}

export function politicsStep(sim, c, day) {
  const g = c.gov,
    e = c.econ,
    prof = GOV_PROFILE[g.type],
    st = sim.state;
  const diff = sim.diff;
  const isPlayer = c.idx === st.playerId;
  // ---- political capital ----
  const adminRel = c.spendCat ? c.spendCat.admin / e.gdp / e.fiscal0.admin : 1;
  const pcGain =
    1.3 *
    prof.pcRate *
    (0.5 + g.bureaucracy) *
    (1 + modv(c, 'admin.cap')) *
    (0.75 + 0.25 * clamp(adminRel, 0.4, 2)) *
    (isPlayer ? diff.pcMult : 1) *
    (0.6 + 0.6 * g.stability);
  g.pc = clamp(g.pc + pcGain, 0, 100);
  // ---- satisfaction ----
  const ideoGap = ideologyDistance(policyIdeology(c), g.popIdeo);
  const dem = prof.elect ? 1 : 0.35;
  const econSat = clamp(2.2 * e.realIncGrowth, -0.2, 0.18) - 1.1 * Math.max(0, e.unemp - e.uNat - 0.01) - 0.9 * Math.max(0, e.infl - 0.04);
  const svc = 0.14 * (e.welfareLvl - 1) + 0.12 * (e.healthLvl - 1) + 0.08 * (e.eduLvl - 1);
  const shortage = -0.35 * e.shortage[0] - 0.25 * (e.shortage[1] * 0.6 + e.shortage[2] * 0.6);
  const war = sim.warPressure(c);
  const target = clamp(
    0.6 +
      econSat +
      clamp(svc, -0.2, 0.2) +
      shortage -
      0.22 * g.corruption +
      0.1 * (g.legitimacy - 0.5) -
      0.2 * dem * ideoGap -
      0.3 * war.exhaustion -
      0.15 * war.occupied +
      modv(c, 'approval.add') -
      g.scandal * 0.2,
    0.05,
    0.95,
  );
  g.approval += 0.12 * (target - g.approval);
  g.scandal = Math.max(0, g.scandal - 0.03);
  // ---- legitimacy & unrest & stability ----
  const proc = prof.elect ? g.dem / 100 : 0.5 * g.approval + 0.2;
  g.legitimacy = clamp(
    g.legitimacy +
      0.03 * (0.6 * g.approval + 0.4 * proc - g.legitimacy) -
      0.01 * Math.max(0, g.repress * (c.policy.surveillance - 0.5)) * (prof.elect ? 1 : 0.2),
    0.02,
    0.98,
  );
  const unrestT = clamp(
    1.4 * (0.55 - g.approval) +
      0.6 * (e.gini - 0.38) +
      0.9 * (e.unemp - 0.08) +
      0.4 * e.warLoss +
      0.2 * e.shortage[0] * 2 -
      0.35 * prof.repress * c.policy.surveillance -
      0.3 * (g.stability - 0.5) +
      modv(c, 'unrest.add'),
    0,
    1,
  );
  g.unrest = clamp(g.unrest + 0.1 * (unrestT - g.unrest), 0, 1);
  const stabT = clamp(
    0.2 +
      0.42 * g.approval +
      0.28 * g.legitimacy -
      0.4 * g.unrest +
      0.2 * prof.repress * c.policy.surveillance * (1 - g.dem / 200) +
      (prof.elect ? 0.09 * (g.dem / 100) : 0) - // institutions that let voters change governments absorb discontent
      0.25 * war.exhaustion -
      0.15 * e.warLoss,
    0.02,
    0.97,
  );
  g.stability = clamp(g.stability + 0.1 * (stabT - g.stability) + modv(c, 'stab.add') * 0.1, 0.01, 0.98);
  // ---- corruption & bureaucracy ----
  const rentShare = (e.rentRev || 0) / Math.max(1, e.revenue || 1);
  const corrT = clamp(
    0.1 +
      prof.corrBase * 2 +
      0.3 * rentShare * 0.6 -
      0.25 * c.policy.pressFreedom -
      0.3 * g.bureaucracy -
      0.1 * (adminRel - 1) +
      0.1 * (c.policy.regulation - 0.5),
    0.03,
    0.95,
  );
  g.corruption = clamp(g.corruption + 0.012 * (corrT - g.corruption), 0.02, 0.97);
  g.bureaucracy = clamp(g.bureaucracy + 0.004 * (adminRel - 1) + 0.001 * (e.eduLvl - 1), 0.05, 0.98);
  // ---- crises ----
  if (g.stability < 0.2) g.collapseTimer++;
  else g.collapseTimer = Math.max(0, g.collapseTimer - 1);
  const needMonths = prof.elect && g.dem >= 55 ? 10 : 6; // consolidated democracies rarely collapse outright: they change governments instead
  if (g.collapseTimer >= needMonths && sim.rng.chance(0.25 + prof.coupRisk)) regimeChange(sim, c, day);
  // ---- elections / leadership ----
  if (g.nextElection !== null && day >= g.nextElection) holdElection(sim, c, day);
  else if (!prof.elect && sim.rng.chance(1 / 12 / 18)) newLeader(sim, c, day, 'succession');
  // ---- policy drift of AI countries toward leader ideology happens in AI module ----
}

export function warPressureOf(sim, c) {
  const st = sim.state;
  let ex = 0,
    occ = 0;
  ex = c.mil ? c.mil.exhaustion : 0;
  occ = sim.occupiedShare(c.idx);
  return { exhaustion: ex, occupied: occ };
}

function newLeader(sim, c, day, why) {
  const g = c.gov,
    rng = sim.rng;
  const row = sim.geo.rows[c.idx];
  g.leader = { name: leaderName(rng, row.iso3, row.region), since: day, ideology: { ...g.parties[0].ideology } };
  sim.log(c.idx, 'politics', `${c.name}: ${g.leader.name} takes office (${why})`, { leader: g.leader.name });
}

export function holdElection(sim, c, day) {
  const g = c.gov,
    rng = sim.rng;
  const prof = GOV_PROFILE[g.type];
  const incumbent = g.parties[0];
  const sc = g.parties.map((p, i) => {
    const gap = ideologyDistance(p.ideology, g.popIdeo);
    let u =
      -5.5 * gap * gap * 2 +
      (i === 0 ? 3.0 * (g.approval - 0.48) + (g.type === 'hybrid' ? 0.6 : 0) : 0) +
      (p.kind === 'populist' && c.econ.unemp > 0.1 ? 0.3 : 0) +
      (p.kind === 'populist' && c.econ.infl > 0.07 ? 0.3 : 0) +
      rng.normal(0, 0.18);
    if (p.kind === 'green' && c.dev0 > 0.5) u -= 0.3;
    return u;
  });
  const mx = Math.max(...sc);
  const ex = sc.map((u) => Math.exp((u - mx) * 2.5));
  const tot = ex.reduce((a, b) => a + b, 0);
  g.parties.forEach((p, i) => {
    p.support = ex[i] / tot;
  });
  let win = 0;
  g.parties.forEach((p, i) => {
    if (p.support > g.parties[win].support) win = i;
  });
  g.lastElection = {
    day,
    results: g.parties.map((p) => ({ name: p.name, share: p.support })),
    winner: g.parties[win].name,
    incumbentWon: win === 0,
  };
  const isPlayer = c.idx === sim.state.playerId;
  if (win !== 0) {
    const w = g.parties[win];
    g.parties.splice(win, 1);
    g.parties.unshift(w);
    newLeader(sim, c, day, 'election');
    g.approval = clamp(g.approval + 0.1, 0, 0.9);
    g.pc = Math.max(10, g.pc - 10);
    sim.shiftPolicyToward(c, w.ideology, 0.5);
    sim.log(
      c.idx,
      'election',
      `${c.name}: ${w.name} wins the election (${(w.support * 100).toFixed(0)}%)`,
      { winner: w.name, incumbent: false },
      isPlayer ? 'high' : 'normal',
    );
    if (isPlayer && sim.state.settings.strictElections) sim.endGame('lost_election');
  } else {
    g.approval = clamp(g.approval + 0.04, 0, 0.9);
    sim.log(
      c.idx,
      'election',
      `${c.name}: ${incumbent.name} re-elected (${(incumbent.support * 100).toFixed(0)}%)`,
      { winner: incumbent.name, incumbent: true },
      isPlayer ? 'high' : 'normal',
    );
  }
  g.nextElection = day + g.termYears * 365 + rng.int(-60, 60);
  sim.emit('election', { country: c.idx, ...g.lastElection });
}

export function regimeChange(sim, c, day) {
  const g = c.gov,
    rng = sim.rng;
  const old = g.type;
  const dev = c.dev0;
  const opts =
    old === 'lib_dem' || old === 'flawed_dem'
      ? ['military', 'hybrid', 'flawed_dem']
      : old === 'military'
        ? ['hybrid', 'flawed_dem', 'military']
        : ['flawed_dem', 'military', 'hybrid', 'one_party'];
  const w = opts.map((t, i) => (t === 'flawed_dem' ? 0.5 + dev : t === 'military' ? 1.2 - dev : 1));
  const nt = opts[rng.weighted(w)];
  g.type = nt;
  g.collapses++;
  g.collapseTimer = 0;
  g.stability = 0.5;
  g.approval = 0.55;
  g.legitimacy = 0.45;
  g.unrest = 0.25;
  g.pc = 30;
  g.dem = clamp(nt === 'flawed_dem' ? 62 : nt === 'hybrid' ? 40 : nt === 'military' ? 12 : 18, 0, 100);
  g.termYears = nt === 'hybrid' ? 5 : 4;
  g.nextElection = GOV_PROFILE[nt].elect ? day + rng.int(180, 540) : null;
  g.parties = makeParties(sim, c, sim.geo.rows[c.idx], g.popIdeo);
  newLeader(sim, c, day, 'regime change');
  c.econ.cbIndep = ['lib_dem', 'flawed_dem'].includes(nt) ? 0.7 : 0.35;
  sim.log(
    c.idx,
    'regime',
    `${c.name}: government collapses; new ${nt.replace('_', ' ')} regime`,
    { from: old, to: nt },
    c.idx === sim.state.playerId ? 'high' : 'normal',
  );
  sim.emit('regime_change', { country: c.idx, from: old, to: nt });
  if (c.idx === sim.state.playerId && sim.state.settings.permadeath) sim.endGame('regime_collapse');
}
