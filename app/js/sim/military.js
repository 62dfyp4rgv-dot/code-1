// Military: national force structure, budgets/procurement, readiness, mobilisation, formations. Warfare lives in war.js.
// Subsystem contract: inputs = defence budget, industry, tech, policy (conscription), population; outputs = formations with
// strength/equipment/morale/supply, ammo & fuel stocks; invariants = 0 <= fill,morale,org <= 1.2, size >= 0, stocks >= 0.
import { clamp, COM, BUDGET_CATS } from './constants.js';
import { modv, modd } from './mods.js';
import { hash01 } from './rng.js';
import * as WAR from './war.js';

export const UNIT_TYPES = {
  inf:  { branch: 'land', name: 'Infantry Corps',   atk: 0.9,  def: 1.15, mob: 1.0, cost: 1.0, size: 30 },
  mech: { branch: 'land', name: 'Mechanised Corps', atk: 1.1,  def: 1.0,  mob: 1.25, cost: 2.2, size: 28 },
  arm:  { branch: 'land', name: 'Armoured Corps',   atk: 1.35, def: 0.9,  mob: 1.35, cost: 3.5, size: 24 },
  art:  { branch: 'land', name: 'Fires Corps',      atk: 1.1,  def: 1.0,  mob: 0.8, cost: 2.5, size: 20 },
  fighter: { branch: 'air', name: 'Fighter Wing',  air: 1.0, ground: 0.2, cost: 3.0, size: 5 },
  strike:  { branch: 'air', name: 'Strike Wing',   air: 0.5, ground: 1.0, cost: 3.2, size: 5 },
  surface: { branch: 'sea', name: 'Surface Fleet', sea: 1.0, cost: 4.0, size: 12 },
  sub:     { branch: 'sea', name: 'Submarine Flotilla', sea: 0.8, cost: 3.5, size: 6 },
  carrier: { branch: 'sea', name: 'Carrier Group', sea: 1.5, air: 0.6, cost: 9.0, size: 18 },
};
const NAVY_SHARE = { USA: 0.28, GBR: 0.22, FRA: 0.2, JPN: 0.2, CHN: 0.18, RUS: 0.15, IND: 0.14, KOR: 0.14, ITA: 0.2, ESP: 0.2, TUR: 0.15, AUS: 0.2, GRC: 0.18, IDN: 0.14, BRA: 0.14 };

export function initMilitary(sim, c, row) {
  const e = c.econ, dev = c.dev0;
  const active = row.troops_k;
  const D0 = (row.mil_pct / 100) * e.gdp;
  const coastal = sim.geo.coastal[c.idx];
  const navyShare = coastal ? (NAVY_SHARE[row.iso3] ?? clamp(0.04 + 0.1 * dev, 0.03, 0.14)) : 0;
  const airShare = clamp(0.1 + 0.1 * dev, 0.08, 0.2);
  const landShare = 1 - navyShare - airShare;
  const mt = c.mt;
  c.mil = {
    active, active0: active, reserve: active * (row.troops_k > 100 ? 1.0 : 0.6) * (0.5 + 0.5 * (hash01(row.iso3 + 'r'))),
    share: { land: landShare, air: airShare, sea: navyShare },
    D0, k: { land: D0 * 3.0 * landShare * 0.9, air: D0 * 3.0 * airShare * 1.4, sea: D0 * 3.0 * navyShare * 1.6 }, // equipment replacement value (USD bn)
    q: { land: 0.55 + 0.5 * mt, air: 0.55 + 0.5 * mt, sea: 0.55 + 0.5 * mt },
    ammo: 20 + 25 * dev + 20 * (row.mil_pct > 3 ? 1 : 0), fuel: 25 + 25 * dev, ammoCap: 60 + 40 * dev, fuelCap: 70 + 40 * dev,
    readiness: clamp(0.45 + 0.3 * dev + 0.02 * row.mil_pct, 0.3, 0.9), mobilization: 0, conscription: 0, exhaustion: 0, casualties: 0, kills: 0,
    doctrine: 'combined', nukes: row.nuke, procRatio: 0, procBase: 0.4 * D0, costPerSoldier0: active > 0 ? 0.3 * D0 / active : 0, fuelUse: 0, lastWar: -9999,
    commanders: [], posture: {}, manual: false, supplyDist: null, equipFill: { land: 1, air: 1, sea: 1 }, budget: { personnel: 0, om: 0, proc: 0 },
  };
  c.mil.k0 = { ...c.mil.k };
  for (let i = 0; i < 3 + Math.round(dev * 3); i++) {
    c.mil.commanders.push({ name: `Cmdr. ${String.fromCharCode(65 + Math.floor(hash01(row.iso3 + 'c' + i) * 26))}. ${['Varga', 'Reyes', 'Okoro', 'Lund', 'Haddad', 'Tanaka', 'Petrov', 'Singh', 'Costa', 'Meyer'][Math.floor(hash01(row.iso3 + 'n' + i) * 10)]}`, skill: 0.4 + 0.5 * hash01(row.iso3 + 's' + i), assigned: null });
  }
}

export function initForces(sim) {
  const { geo, state } = sim; const st = state;
  st.forces = [];
  const mkForce = (c, type, size, region, n) => {
    const u = UNIT_TYPES[type];
    const f = { id: st.nextId++, owner: c.idx, branch: u.branch, type, name: `${n}${ordinal(n)} ${u.name}`, size, max: size, fill: 1, morale: 0.8, exp: 0.1 + 0.3 * hash01(c.id + type + n), org: 1, supply: 1,
      loc: region, order: { kind: 'hold', target: -1 }, dest: -1, moveProg: 0, prep: 0, cmd: -1, inCombat: 0, home: region };
    st.forces.push(f); return f;
  };
  for (const c of st.countries) {
    const m = c.mil, row = geo.rows[c.idx], dev = c.dev0;
    const landK = m.active * m.share.land, airK = m.active * m.share.air, seaK = m.active * m.share.sea;
    let nLand = landK <= 0 ? 0 : clamp(Math.round(landK / 30), 1, 36);
    if (m.active < 5) nLand = 1;
    const sizeLand = landK / Math.max(1, nLand);
    const regs = geo.cRegions[c.idx];
    const cap = geo.capitalRegion[c.idx];
    // weights: capital 25%, otherwise proportional to popW and border exposure
    const w = regs.map((ri) => geo.regions[ri].popW + (ri === cap ? 0.4 : 0) + 0.05 * geo.regions[ri].adj.filter((a) => geo.regions[a.to].owner0 !== c.idx).length);
    for (let i = 0; i < nLand; i++) {
      const r = regs[sim.rng.weighted(w)];
      const roll = sim.rng.next();
      const type = roll < 0.12 + 0.25 * dev ? 'mech' : roll < 0.22 + 0.35 * dev ? 'arm' : roll < 0.3 + 0.38 * dev ? 'art' : 'inf';
      mkForce(c, type, Math.max(0.1, sizeLand * (type === 'inf' ? 1.1 : 0.8)), r, i + 1);
    }
    const nAir = airK < 1 ? 0 : clamp(Math.round(airK / 5), 1, 24);
    for (let i = 0; i < nAir; i++) mkForce(c, i % 3 === 0 ? 'strike' : 'fighter', Math.max(0.3, airK / nAir), cap, i + 1);
    const nSea = seaK < 1 || !geo.coastal[c.idx] ? 0 : clamp(Math.round(seaK / 12), 1, 14);
    const portRegs = regs.filter((ri) => geo.regions[ri].coast.length);
    for (let i = 0; i < nSea; i++) {
      const pr = portRegs.length ? portRegs.reduce((b, ri) => (geo.regions[ri].port > geo.regions[b].port ? ri : b), portRegs[0]) : cap;
      const f = mkForce(c, i === 0 && seaK > 30 ? 'carrier' : i % 3 === 2 ? 'sub' : 'surface', Math.max(0.5, seaK / nSea), pr, i + 1);
      const coastSea = geo.regions[pr].coast.length ? geo.regions[pr].coast.sort((a, b) => b.n - a.n)[0].sea : -1;
      f.loc = coastSea; f.home = coastSea; f.port = pr;
      if (coastSea < 0) st.forces.pop();
    }
    // fill ratios reflect procurement capacity vs. force size
    const resourced = clamp((D0perSoldier(m) / (0.25 * (1 + 3 * dev))), 0.35, 1.05);
    for (const f of st.forces) if (f.owner === c.idx) { f.fill = clamp(resourced * (0.9 + 0.2 * hash01(c.id + f.id)), 0.3, 1.05); f.morale = clamp(0.6 + 0.2 * dev + 0.15 * hash01(c.id + 'm' + f.id), 0.4, 0.95); }
  }
  sim.indexForces();
}
function D0perSoldier(m) { return m.active > 0 ? (m.D0 * 1000) / m.active / 1000 : 1; } // USD bn per k personnel
const ordinal = (n) => (n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th');

// ---------------------------------------------------------------------------------------------------------------- monthly
export function monthlyStep(sim, day) {
  const st = sim.state;
  sim.indexForces();
  for (const c of st.countries) monthlyCountry(sim, c, day);
  WAR.monthlyWar(sim, day);
}
function monthlyCountry(sim, c, day) {
  const m = c.mil, e = c.econ;
  const D = c.spendCat ? c.spendCat.defense : m.D0;
  const atWar = sim.atWar(c.idx);
  // wage level tracks income per head
  const wageMult = (e.gdp / c.pop.total) / (e.gdp0 / (c.rowPop || sim.geo.rows[c.idx].pop_m));
  const persCost = m.costPerSoldier0 * m.active * wageMult;
  const omCost = 0.30 * m.D0 * (m.active / Math.max(1, m.active0)) * (1 + 0.01 * c.tech.known.filter((t) => t.startsWith('mil_')).length) * (atWar ? 1.5 : 1);
  const proc = Math.max(0, D - persCost - omCost);
  m.budget = { personnel: persCost, om: omCost, proc };
  const omOk = clamp((D - persCost) / Math.max(1e-6, omCost), 0.3, 1.3);
  m.procRatio = clamp(proc / Math.max(1e-6, m.procBase) - 1, -1, 3);
  // readiness follows O&M funding, conscription training, wartime tempo
  const rT = clamp(0.2 + 0.6 * Math.min(1, omOk) + 0.1 * (m.conscription / 3) + 0.1 * (m.exhaustion < 0.5 ? 1 : 0) + 0.1 * c.mil.mobilization / 3, 0.15, 0.97);
  m.readiness += 0.1 * (rT - m.readiness);
  // equipment capital: procurement adds, attrition/wear subtracts
  for (const b of ['land', 'air', 'sea']) {
    const share = m.share[b]; const k0 = m.k0[b];
    const add = (proc * (b === 'air' ? 0.4 : b === 'sea' ? 0.2 : 0.4) * 0.65) / 12 * (0.6 + 0.4 * (e.util > 0.9 ? 1 : 0.7));
    m.k[b] = Math.max(0, m.k[b] + add - 0.06 * m.k[b] / 12 * (0.6 + 0.4 * (atWar ? 1.7 : 1)));
    m.equipFill[b] = k0 > 0 ? clamp(m.k[b] / k0, 0, 1.3) : 0;
    // quality creeps towards tech frontier when procurement is healthy
    const target = 0.55 + 0.5 * c.mt + modd(c, 'mil.' + b) + 0.08 * clamp(m.procRatio, -0.5, 1);
    m.q[b] += 0.03 / 12 * (target - m.q[b]) * 12 * 0.25 * (0.4 + clamp(proc / Math.max(1e-6, m.procBase), 0, 2) * 0.3);
  }
  // munitions & fuel
  const ammoProd = clamp((proc * 0.25 / Math.max(1e-6, m.procBase)) * 1.5, 0, 6) * (c.econ.shortage[COM.minerals] > 0.2 ? 0.5 : 1);
  m.ammo = clamp(m.ammo + ammoProd - 0.5, 0, m.ammoCap);
  const fuelNeed = (atWar ? 6 : 1.2) * (m.active / Math.max(1, m.active0));
  m.fuelUse = fuelNeed * 0.0004 * e.dem0[1] * 12; // annual-rate oil demand attributable to the military
  const oilOk = e.stock[COM.oil] > 0 ? 1 : 0.4;
  m.fuel = clamp(m.fuel + (oilOk ? 1.5 : -1) - fuelNeed * 0.2, 0, m.fuelCap);
  // mobilisation drifts reserves -> active
  const conscTarget = c.policy.conscription; m.conscription += clamp(conscTarget - m.conscription, -0.25, 0.25);
  const mobTarget = m.mobilizationTarget ?? 0;
  if (mobTarget > m.mobilization) m.mobilization = Math.min(mobTarget, m.mobilization + 0.5); else if (mobTarget < m.mobilization) m.mobilization = Math.max(mobTarget, m.mobilization - 0.5);
  const poolActive = m.active0 * (1 + (m.mobilization) * 0.7);
  if (m.active < poolActive && m.reserve > 0) { const take = Math.min(m.reserve, (poolActive - m.active) * 0.2); m.active += take; m.reserve -= take; sim.growForces(c, take); }
  else if (m.active > poolActive * 1.02) { const give = (m.active - poolActive) * 0.15; m.active -= give; m.reserve += give; sim.shrinkForces(c, give); }
  // reserves replenish from the population (conscription) slowly
  m.reserve = Math.min(c.pop.coh[1] * 1000 * 0.04, m.reserve + c.pop.coh[1] * 1000 * 0.0002 * (0.3 + m.conscription));
  // war exhaustion decays in peace
  if (!atWar) m.exhaustion = Math.max(0, m.exhaustion - 0.02);
  // peacetime formation recovery
  for (const f of sim.forcesOf[c.idx]) {
    const share = f.branch === 'land' ? m.equipFill.land : f.branch === 'air' ? m.equipFill.air : m.equipFill.sea;
    f.fill += 0.1 * (clamp(share, 0, 1.05) - f.fill);
    if (!f.inCombat) { f.org = Math.min(1, f.org + 0.12); f.morale += 0.05 * (0.5 + 0.3 * m.readiness + 0.2 * c.gov.approval - f.morale); }
    f.morale = clamp(f.morale, 0, 1);
    f.exp = Math.max(0, f.exp - 0.001);
  }
}

export function occupiedShare(sim, i) {
  const r = sim.state.reg; let s = 0;
  for (const ri of sim.regionsOf[i]) if (r.ctrl[ri] !== i) s += sim.geo.regions[ri].popW;
  return s;
}

// ------- scenario hooks & delegations
export function startScenarioWar(sim, w) { WAR.startScenarioWar(sim, w); }
export function dailyStep(sim, day) { WAR.dailyWar(sim, day); }
export function fillBlockade(sim, arr) { WAR.fillBlockade(sim, arr); }

// ------- helpers used by Sim
export function growForces(sim, c, k) {
  const fs = sim.forcesOf[c.idx].filter((f) => f.branch === 'land'); if (!fs.length) return;
  const add = k * c.mil.share.land / fs.length;
  for (const f of fs) { f.size += add; f.max = Math.max(f.max, f.size); f.fill *= 0.985; f.morale *= 0.995; }
}
export function shrinkForces(sim, c, k) {
  const fs = sim.forcesOf[c.idx].filter((f) => f.branch === 'land'); if (!fs.length) return;
  const sub = k * c.mil.share.land / fs.length;
  for (const f of fs) f.size = Math.max(0.05, f.size - sub);
}
