// Economy: sector production (Cobb-Douglas with capacity multipliers), aggregate demand, government finance, prices.
// Units: USD bn, annualised flows (monthly step = /12). Commodity quantities are valued at BASE prices (price index 1.0 at t0).
// Accounting identities enforced / tested (see tests/unit/economy.test.js):
//   GDP_real = sum(sector value added)                         (production approach)
//   GDP_real = C + I + G + NX + dInv, dInv bounded             (expenditure approach; dInv = inventory/statistical residual)
//   debt_{t+1} = debt_t + deficit/12 - inflation erosion        (stock-flow)
//   reserves_{t+1} = reserves_t + CA/12                         (stock-flow)
//   K_s{t+1} = K_s - delta*K_s/12 + I_s/12                      (capital stock-flow)
import { SECTORS, SECTOR_PARAMS, COMMODITIES, COM, SECTOR, WORLD_VALUE, GOV_PROFILE, BUDGET_CATS, clamp } from './constants.js';
import { modv, modd } from './mods.js';
import { hash01 } from './rng.js';

const S = SECTOR;
const NS = SECTORS.length;

// ---------------------------------------------------------------- init
export function initCountryEconomy(sim, c, row) {
  const { data, geo } = sim;
  const prof = data.econProfiles[row.iso3] || {};
  const res = data.resources[row.iso3] || { oil: 0, gas: 0, minerals: 0 };
  const gdp = row.gdp_bn, pop = row.pop_m;
  const gdppc = gdp / pop; // USD k per capita
  const dev = gdppc / (gdppc + 15);
  c.dev0 = dev;
  const rnd = (k) => hash01(row.iso3 + k);
  // --- sector values (USD bn at base price) ---
  const v = new Array(NS).fill(0);
  v[S.oil] = (res.oil / 100) * WORLD_VALUE.oil;
  v[S.gas] = (res.gas / 100) * WORLD_VALUE.gas;
  v[S.mining] = (res.minerals / 100) * WORLD_VALUE.minerals;
  let resSum = v[S.oil] + v[S.gas] + v[S.mining];
  if (resSum > 0.7 * gdp) { const k = (0.7 * gdp) / resSum; v[S.oil] *= k; v[S.gas] *= k; v[S.mining] *= k; resSum *= k; }
  // agriculture from arable potential (derived from terrain), scaled globally later via sim.cal.agriScale
  const farm = geo.cRegions[c.idx].reduce((s, k) => s + geo.regions[k].farm, 0);
  c.farmPotential = farm * (0.35 + 0.65 * dev);
  v[S.agri] = Math.pow(c.farmPotential + 1, 0.35) * Math.pow(pop, 0.65) * (0.7 + 0.6 * rnd('agri')); // land x labour; normalised in calibrateWorld
  v[S.utilities] = gdp * (0.022 + 0.01 * (1 - dev));
  v[S.tech] = gdp * (prof.tech ?? clamp(0.015 + 0.06 * dev * (0.6 + 0.4 * rnd('tech')), 0.01, 0.12));
  const ind = prof.industry ?? clamp(0.14 + 0.16 * Math.sin(Math.PI * Math.min(1, dev * 1.6)) + (rnd('ind') - 0.5) * 0.06, 0.1, 0.4);
  v[S.industry] = gdp * ind;
  c.econ = { _init: v, ind0: ind };
  c.prof = prof; c.res0 = res; c.rowGDP = gdp;
}

// After every country has placeholder values: normalise agriculture to the world pool, fix services residual, and build all stocks.
export function calibrateWorld(sim) {
  const { data, geo, state } = sim;
  const N = geo.N;
  let farmTot = 0;
  for (const c of state.countries) farmTot += c.econ._init[S.agri];
  const agriScale = WORLD_VALUE.agri / farmTot;
  sim.cal = { agriScale, demScale: [1, 1, 1, 1] };
  state.cal = sim.cal;
  for (const c of state.countries) {
    const row = geo.rows[c.idx];
    const gdp = row.gdp_bn, pop = row.pop_m, gdppc = gdp / pop, dev = c.dev0;
    const v = c.econ._init;
    v[S.agri] = clamp(v[S.agri] * agriScale, gdp * (0.01 + 0.2 * Math.pow(1 - dev, 2)), gdp * 0.42);
    let nonServ = 0; for (let k = 0; k < NS; k++) if (k !== S.services) nonServ += v[k];
    if (nonServ > 0.78 * gdp) { const f = (0.78 * gdp) / nonServ; for (let k = 0; k < NS; k++) if (k !== S.services) v[k] *= f; nonServ *= f; }
    v[S.services] = gdp - nonServ;
    const Y = v.slice();
    const pr = c.prof;
    // labour: employment shares by sector
    const agriL = clamp(0.62 * Math.exp(-gdppc / 7), 0.015, 0.7);
    const lab = new Array(NS).fill(0);
    lab[S.agri] = agriL;
    lab[S.industry] = clamp(0.1 + 0.12 * Math.sin(Math.PI * Math.min(1, dev * 1.5)), 0.06, 0.28);
    lab[S.oil] = Math.min(0.02, (Y[S.oil] / gdp) * 0.08 + 0.0005);
    lab[S.gas] = Math.min(0.01, (Y[S.gas] / gdp) * 0.08 + 0.0003);
    lab[S.mining] = Math.min(0.03, (Y[S.mining] / gdp) * 0.15 + 0.002);
    lab[S.utilities] = 0.008;
    lab[S.tech] = clamp((Y[S.tech] / gdp) * 0.8, 0.005, 0.1);
    let sumL = 0; for (let k = 0; k < NS; k++) if (k !== S.services) sumL += lab[k];
    lab[S.services] = Math.max(0.15, 1 - sumL);
    const tot = lab.reduce((a, b) => a + b, 0); for (let k = 0; k < NS; k++) lab[k] /= tot;
    const sp = SECTORS.map((s) => SECTOR_PARAMS[s]);
    const K = Y.map((y, k) => y * sp[k].v * (1 + 0.15 * (rnd2(c, 'k' + k) - 0.5)));
    // demographics -> employment
    const elder = clamp(0.035 + 0.2 * Math.pow(dev, 1.2) + (['east_asia', 'western_europe', 'northern_europe', 'southern_europe', 'eastern_europe', 'russia'].includes(row.region) ? 0.03 : 0) - (row.region.includes('africa') ? 0.01 : 0), 0.025, 0.3);
    const youth = clamp(0.42 - 0.2 * dev - (elder - 0.1) * 0.3, 0.14, 0.45);
    const working = 1 - elder - youth;
    const partic = clamp(0.62 + 0.06 * dev - 0.04 * (row.gov === 'theocracy' ? 1 : 0), 0.5, 0.75);
    const uNat = clamp(0.045 + 0.03 * (1 - dev) * rnd2(c, 'u') * 2 + 0.01 * (row.gov === 'one_party' ? -1 : 0), 0.025, 0.12);
    c.pop = {
      total: pop, elder, youth, working, partic, urban: clamp(0.22 + 0.68 * dev, 0.15, 0.97), fertility: pr.tfr ?? clamp(0.5 + 5 * Math.pow(1 - dev, 1.3) + 1.2 * dev - (row.region === 'east_asia' ? 0.4 : 0), 0.7, 7),
      edu: clamp(0.3 + 0.62 * Math.pow(dev, 0.8) + 0.06 * (rnd2(c, 'e') - 0.5), 0.15, 0.98), health: clamp(0.38 + 0.57 * Math.pow(dev, 0.7) + 0.06 * (rnd2(c, 'h') - 0.5), 0.2, 0.98),
      migrationRate: 0, growth: 0, migNet: 0, births: 0, deaths: 0,
    };
    const emp = pop * working * partic * (1 - uNat);
    // A calibrated so Y0 = A * K^alpha * L^(1-alpha) at multiplier m0 = 1
    const A = Y.map((y, k) => (y > 0 ? y / (Math.pow(K[k], sp[k].alpha) * Math.pow(Math.max(1e-6, lab[k] * emp), 1 - sp[k].alpha)) : 0));
    // ---- infrastructure & institutions ----
    const infra = clamp(0.18 + 0.7 * Math.pow(dev, 0.8) + (rnd2(c, 'inf') - 0.5) * 0.1, 0.12, 0.96);
    // ---- trade & finance ----
    const openness = clamp(1.05 - 0.2 * Math.log10(gdp + 1), 0.14, 0.9);
    const ca0 = (pr.ca ?? (rnd2(c, 'ca') - 0.5) * 3) / 100;
    const debtRatio = pr.debt ?? clamp(0.25 + 0.4 * dev + (rnd2(c, 'd') - 0.5) * 0.3, 0.05, 1.1);
    const invRate = pr.inv ?? clamp(0.23 + 0.05 * (1 - dev) + (rnd2(c, 'i') - 0.5) * 0.04, 0.15, 0.34);
    const clean = pr.clean ?? clamp(0.18 + 0.12 * (rnd2(c, 'cl') - 0.5) * 2 + 0.1 * dev, 0.02, 0.9);
    const fiscal = baselineBudget(c, row, gdp, dev);
    const gni0 = gdp;
    const e = {
      Y, K, A, lab, depl: [1, 1, 1], m0: 1,
      gdp, gdp0: gdp, gdpPot: gdp, gdpHist: new Array(13).fill(gdp), util: 1, growth: 0.0, gni: gni0, tot: 0,
      unemp: uNat, uNat, infl: 0.03, inflExp: 0.03, cpi: 1, emp, lf: pop * working * partic,
      infra, infra0Ref: infra, pubK: 0, pubK0: 0, effYield: 0.04, rerPrev: 1, researchIdx: 0, nxg0r: 0, collect: 0.85,
      cons: 0, inv: invRate * gdp, govC: 0, exp: 0, imp: 0, dInv: 0, nxg: 0, nxg0: 0, openness, ca: ca0 * gdp, ca0, rer: 1, reserves: 0,
      debt: debtRatio * gdp, deficit: 0, interest: 0, revenue: 0, spend: 0, taxRev: 0, tariffRev: 0, rentRev: 0,
      stock: [0, 0, 0, 0], shortage: [0, 0, 0, 0], prod: [0, 0, 0, 0], dem: [0, 0, 0, 0], imports: [0, 0, 0, 0], exports: [0, 0, 0, 0], priceDom: [1, 1, 1, 1],
      clean, clean0: clean, emis: 0, gini: 0, poverty: 0, credit: 0.6, bondYield: 0.04, risk: 0.01, invRate, invRate0: invRate, sav: 0, savBase: 0.2, consK: 0.7, wOil: 0.3, wGas: 0.12, wFood: 0.2,
      cbIndep: ['lib_dem', 'flawed_dem'].includes(row.gov) ? 0.8 : 0.4, welfareLvl: 1, healthLvl: 1, eduLvl: 1, tradeAccess: 1, windfall: 0,
      stateShare: row.gov === 'monarchy' || row.gov === 'one_party' || row.gov === 'theocracy' ? 0.55 : row.gov === 'military' ? 0.5 : 0.28,
      priceLast: [1, 1, 1, 1], fiscal0: fiscal, hdi: 0, realIncGrowth: 0, resRev0: 0, researchStock: 0, techLevel: 0, dem0: [0, 0, 0, 0],
      warLoss: 0, climateDmg: 0, waterStress: 0, drought: 0, unrest0: 0, stab0: c.gov.stability,
    };
    delete c._tmpEcon;
    c.econ = e;
    // water stress derived from desert share and population density
    const cr = geo.cRegions[c.idx].map((k) => geo.regions[k]);
    const area = cr.reduce((s, r) => s + r.area, 0) || 1;
    const desert = cr.reduce((s, r) => s + r.area * (r.mix.desert || 0), 0) / area;
    const dens = pop * 1e6 / area;
    e.waterStress = clamp(0.1 + 0.7 * desert + 0.1 * Math.log10(1 + dens / 50), 0.03, 0.97);
  }
}
const rnd2 = (c, k) => hash01(c.id + k);

function baselineBudget(c, row, gdp, dev) {
  const mil = row.mil_pct / 100;
  const base = {
    defense: mil,
    health: 0.025 + 0.055 * dev,
    education: 0.03 + 0.02 * dev,
    infrastructure: 0.025 + 0.015 * dev,
    welfare: 0.015 + 0.12 * Math.pow(dev, 1.1) * (row.gov === 'lib_dem' ? 1.15 : row.gov === 'flawed_dem' ? 1 : 0.8),
    research: 0.002 + 0.02 * Math.pow(dev, 1.6),
    admin: 0.025 + 0.015 * dev,
    subsidies: 0.004 + 0.01 * (1 - dev),
  };
  return base; // fractions of GDP
}

// Second pass: needs world demand calibration; builds fiscal state, stocks and first trade state.
export function finishEconomyInit(sim) {
  const { state, geo } = sim;
  // ---- demand calibration for traded commodities ----
  const supply = [0, 0, 0, 0];
  for (const c of state.countries) {
    const e = c.econ;
    supply[COM.food] += e.Y[S.agri]; supply[COM.oil] += e.Y[S.oil]; supply[COM.gas] += e.Y[S.gas]; supply[COM.minerals] += e.Y[S.mining];
  }
  const raw = [0, 0, 0, 0];
  for (const c of state.countries) {
    const e = c.econ, row = geo.rows[c.idx], pop = c.pop.total, gdppc = e.gdp / pop;
    const cold = clamp(Math.abs(geo.regions[geo.capitalRegion[c.idx]].lat) / 60, 0.2, 1.1);
    const indSh = e.Y[S.industry] / e.gdp;
    const fpc = Math.min(0.25 + 0.012 * Math.min(gdppc, 40), 0.36 * gdppc);
    c._raw = [
      pop * fpc,
      e.gdp * (0.5 + 1.6 * indSh) * (1.25 - 0.35 * Math.min(1, gdppc / 40)) * (1 - 0.3 * e.clean),
      e.gdp * (0.25 + 0.9 * indSh) * cold * (1.2 - 0.3 * Math.min(1, gdppc / 40)),
      (e.Y[S.industry] * 1.0 + e.Y[S.tech] * 0.8 + e.gdp * 0.004) * (1 + 0.1 * (c.prof.mt ?? 0.5)),
    ];
    for (let k = 0; k < 4; k++) raw[k] += c._raw[k];
  }
  for (let k = 0; k < 4; k++) sim.cal.demScale[k] = (supply[k] * 0.995) / raw[k];
  for (const c of state.countries) {
    const e = c.econ;
    for (let k = 0; k < 4; k++) e.dem0[k] = c._raw[k] * sim.cal.demScale[k];
    delete c._raw;
    e.dem = e.dem0.slice();
    e.prod = [e.Y[S.agri], e.Y[S.oil], e.Y[S.gas], e.Y[S.mining]];
    // initial stocks: ~ 2-3 months of demand (oil strategic reserves for rich importers)
    const dev = c.dev0;
    e.stock = [e.dem0[0] * 0.25, e.dem0[1] * (0.12 + 0.12 * dev), e.dem0[2] * 0.1, e.dem0[3] * 0.2];
    e.stockCap = [e.dem0[0] * 0.5, e.dem0[1] * 0.35, e.dem0[2] * 0.25, e.dem0[3] * 0.5];
    e.wOil = clamp(e.dem0[1] / (e.gdp * 0.1), 0.1, 0.6) * 0.5; e.wGas = clamp(e.dem0[2] / (e.gdp * 0.1), 0.05, 0.5) * 0.5;
    e.wFood = clamp(e.dem0[0] / e.gdp, 0.05, 0.6);
    // gov finance baseline
    const row = geo.rows[c.idx];
    const b = e.fiscal0;
    const spend0 = BUDGET_CATS.reduce((s, k) => s + b[k], 0) * e.gdp;
    e.fxDepth = clamp((dev - 0.6) / 0.3, 0, 1) * (e.gdp > 1000 ? 1 : 0.5);
    e.nfa = e.ca0 * e.gdp * 8;
    e.reserves = e.gdp * e.openness * 0.5 / 12 * clamp(3 + 2 * dev + 80 * Math.max(0, e.ca0), 3, 30);
    e.interest = e.debt * (0.025 + 0.02 * (1 - dev));
    const deficit0 = clamp(0.025 - e.ca0 * 0.4, -0.04, 0.07) * e.gdp;
    const rentRev0 = e.stateShare * (e.Y[S.oil] + e.Y[S.gas] + e.Y[S.mining] * 0.5);
    const collect0 = 1 - 0.45 * c.gov.corruption;
    const tariff0 = clamp(0.03 + 0.08 * (1 - dev) + 0.04 * (e.openness < 0.2 ? 1 : 0), 0.01, 0.2);
    const impVal = e.openness * e.gdp * 0.5;
    const taxNeeded = spend0 + e.interest - deficit0 - tariff0 * impVal - rentRev0;
    const taxRate0 = clamp(taxNeeded / (e.gdp * collect0), 0.05, 0.5);
    c.policy = {
      taxRate: taxRate0, spendRate: spend0 / e.gdp, tariff: tariff0, policyRate: clamp(0.03 + 0.04 * (1 - dev) + (c.prof.pr || 0), 0.02, 0.15),
      regulation: clamp(0.4 + 0.3 * dev, 0.1, 0.9), envRegulation: clamp(0.15 + 0.5 * dev, 0.05, 0.85), cleanPriority: clamp(0.15 + 0.4 * dev, 0.05, 0.8),
      immigration: clamp(0.35 + 0.2 * dev, 0.1, 0.8), pressFreedom: clamp(c.gov.dem / 100, 0.02, 0.98), surveillance: clamp(1 - c.gov.dem / 120, 0.1, 0.95), conscription: row.troops_k > 150 && row.mil_pct > 2.5 ? 1 : 0, focus: 'none',
      budget: Object.fromEntries(BUDGET_CATS.map((k) => [k, b[k] * e.gdp / spend0])),
    };
    c.target = { ...c.policy, budget: { ...c.policy.budget } }; // lagged policy: actual values move toward target
    e.collect0 = collect0; e.tariff0 = tariff0; e.rentRev0 = rentRev0;
    e.spend0 = spend0; e.taxRate0 = taxRate0; e.wage = 1;
    e.priceLast = [1, 1, 1, 1];
    e.dem0Gdp = e.gdp;
    // consumption propensity calibrated so AD(t0) = GDP(t0)
    const nxTotal = e.ca0 * e.gdp;
    const Ig = e.inv; // private investment at t0
    const pubI = (b.infrastructure * e.gdp) * 0.7;
    const govC0 = spend0 - e.fiscal0.welfare * e.gdp - pubI - e.fiscal0.subsidies * e.gdp * 0.5;
    const Yd0 = e.gdp - (taxRate0 * e.gdp * collect0) - tariff0 * impVal - rentRev0 + e.fiscal0.welfare * e.gdp + e.fiscal0.subsidies * e.gdp * 0.5 + 0.7 * e.interest;
    e.impVal0 = impVal;
    const C0 = e.gdp - Ig - pubI - govC0 - nxTotal;
    e.consK = C0 / Yd0; e.Yd0 = Yd0; e.C0 = C0; e.govC0 = govC0; e.pubI0 = pubI;
    e.savBase = 1 - e.consK;
    e.realRate0 = c.policy.policyRate - 0.03;
    e.nxTotal0 = nxTotal;
    // goods net exports (non-resource); resource part set after first clearing
    e.cons = C0; e.exp = 0; e.imp = 0;
    // social
    e.gini = clamp(0.28 + 0.2 * (1 - dev) + 0.06 * rnd2(c, 'g') + (row.region === 'caribbean' || row.region === 'south_america' || row.region === 'southern_africa' ? 0.08 : 0), 0.24, 0.65);
    e.poverty = clamp(0.5 * Math.pow(1 - dev, 3.2) + 0.03, 0.01, 0.75);
    e.hdi = hdiOf(c);
    e.resRev0 = rentRev0;
    e.pubK = e.pubK0 = 22.5 * b.infrastructure * e.gdp;
    e.effYield = 0.025 + 0.02 * (1 - dev);
    e.emis = emissionsOf(c);
  }
  sim.cal.normalCover = [0, 1, 2, 3].map((k) => state.countries.reduce((a, c) => a + c.econ.stock[k], 0) / state.countries.reduce((a, c) => a + c.econ.dem0[k], 0));
  // emissions calibration to 37,000 Mt
  let tot = 0; for (const c of state.countries) tot += c.econ.emis;
  sim.cal.emisScale = 37000 / tot;
  for (const c of state.countries) c.econ.emis *= sim.cal.emisScale;
}
export function hdiOf(c) {
  const e = c.econ;
  const income = clamp(Math.log(e.gdp / c.pop.total * 1000 / 500) / Math.log(100000 / 500), 0, 1);
  return clamp(0.4 * income + 0.3 * c.pop.health + 0.3 * c.pop.edu, 0, 1);
}
function emissionsOf(c) {
  const e = c.econ;
  const coalProxy = (1 - e.clean) * e.Y[S.utilities] * 8;
  return e.dem[1] * 1.0 + e.dem[2] * 0.7 + coalProxy * 0.5 + e.Y[S.industry] * 0.05;
}

// ---------------------------------------------------------------- production
export function productionStep(sim, c) {
  const e = c.econ, g = sim.geo;
  const lc = c.techMods;
  const emp = e.emp;
  // capacity multipliers
  const infraM = (0.82 + 0.36 * e.infra) / (0.82 + 0.36 * e.infra0Ref);
  const regM = 1 - 0.06 * (c.policy.regulation - c.policy0.regulation);
  const envM = 1 - 0.05 * Math.max(0, c.policy.envRegulation - c.policy0.envRegulation) * 2;
  const instM = 1 - 0.15 * (c.gov.corruption - c.gov0.corruption) + (GOV_PROFILE[c.gov.type].tfp - GOV_PROFILE[c.gov0.type].tfp);
  const tarM = 1 - 0.1 * (c.policy.tariff - e.tariff0);
  const stabM = (0.85 + 0.15 * c.gov.stability) / (0.85 + 0.15 * e.stab0);
  const shEnergy = e.wOil * e.shortage[COM.oil] + e.wGas * e.shortage[COM.gas];
  const blackout = clamp(shEnergy * 1.2, 0, 0.6);
  const minShort = e.shortage[COM.minerals];
  // war / devastation (regional)
  let loss = 0;
  for (const ri of sim.regionsOf[c.idx]) {
    const r = sim.regions;
    const lf = (r.ctrl[ri] !== c.idx ? 0.85 : 0) + r.dev[ri] * 0.6;
    loss += g.regions[ri].popW * Math.min(1, lf);
  }
  e.warLoss = Math.min(0.95, loss);
  const warM = 1 - e.warLoss;
  const shock = 1 + modv(c, 'gdp.shock');
  const cyber = 1 - c.cyber.disruption * 0.12;
  const climate = 1 - e.climateDmg;
  let total = 0;
  for (let k = 0; k < NS; k++) {
    const p = SECTOR_PARAMS[SECTORS[k]];
    if (e.A[k] <= 0) { e.Y[k] = 0; continue; }
    let m = infraM * regM * instM * tarM * stabM * warM * shock * cyber * (1 + modd(c, 'tfp.' + SECTORS[k]));
    if (k === S.industry || k === S.oil || k === S.gas || k === S.mining) m *= envM;
    if (k === S.industry || k === S.services || k === S.tech) m *= 1 - blackout * (k === S.services ? 0.6 : 1);
    if (k === S.industry) m *= 1 - 0.5 * minShort;
    if (k === S.tech) m *= 1 - 0.6 * minShort;
    if (k === S.agri) m *= climate * (1 - 0.2 * e.waterStress * e.drought * (1 - Math.min(0.8, modv(c, 'agri.water') + modv(c, 'water.supply'))));
    if (k === S.utilities) m *= 1 - 0.8 * Math.max(0, e.shortage[COM.gas] * e.wGas / Math.max(0.05, e.wGas + e.wOil) + e.shortage[COM.oil] * 0.1);
    let a = e.A[k];
    if (k === S.oil || k === S.gas || k === S.mining) a *= e.depl[k === S.oil ? 0 : k === S.gas ? 1 : 2];
    if (k === S.oil) a *= sim.cartelFactor(c);
    if (k === S.agri || k === S.oil || k === S.gas || k === S.mining) a *= Math.pow(clamp(sim.state.prices[k === S.agri ? 0 : k === S.oil ? 1 : k === S.gas ? 2 : 3], 0.4, 3), 0.2);
    const L = Math.max(1e-6, e.lab[k] * emp);
    e.Y[k] = a * m * Math.pow(e.K[k], p.alpha) * Math.pow(L, 1 - p.alpha);
    total += e.Y[k];
  }
  e.gdpPot = total;
  e.prod = [e.Y[S.agri], e.Y[S.oil], e.Y[S.gas], e.Y[S.mining]];
}

// ---------------------------------------------------------------- demand for traded commodities (physical)
export function commodityDemand(sim, c) {
  const e = c.econ;
  const effGdp = e.gdp / e.gdp0;
  const price = sim.state.prices;
  const eff = 1 - modd(c, 'energy.eff');
  const cleanShift = (1 - e.clean) / (1 - e.clean0);
  const elast = (p) => Math.pow(clamp(p, 0.3, 5), -0.25);
  const popF = c.pop.total / (c.rowPop || (c.rowPop = sim.geo.rows[c.idx].pop_m));
  const dem = [
    e.dem0[0] * Math.pow(popF, 1) * (1 + 0.15 * (effGdp * popF ** -1 - 1)) * elast(price[0] * (1 + (c.policy.tariff - e.tariff0))),
    e.dem0[1] * effGdp * eff * (0.55 + 0.45 * cleanShift) * elast(price[1] * (1 + (c.policy.tariff - e.tariff0) * 0.5)) * (1 - 0.1 * subsidyShield(c) * 0),
    e.dem0[2] * effGdp * eff * (0.5 + 0.5 * cleanShift) * elast(price[2]),
    e.dem0[3] * (e.Y[S.industry] / (e.Y0i || (e.Y0i = Math.max(1e-6, e.Y[S.industry])))) * (1 - modd(c, 'min.recycle')),
  ];
  // military procurement adds mineral demand
  dem[3] *= 1 + 0.05 * c.mil.procRatio;
  return dem;
}
const subsidyShield = (c) => c.policy.budget.subsidies;

// ---------------------------------------------------------------- goods & services trade (non-resource), world-normalised
export function goodsTradeStep(sim) {
  const cs = sim.state.countries;
  let pos = 0, neg = 0;
  for (const c of cs) {
    const e = c.econ;
    const access = clamp(e.tradeAccess + modv(c, 'trade.access') + 0.5 * modd(c, 'trade.eff'), 0.2, 1.3);
    const r = e.nxg0r * Math.min(1, access) - 0.25 * (e.rer - 1) - 0.1 * (c.policy.tariff - e.tariff0);
    e.nxgRaw = r * e.gdp;
    if (e.nxgRaw > 0) pos += e.nxgRaw; else neg -= e.nxgRaw;
  }
  // world goods trade must net to zero: scale the larger side down so structure is preserved (no drift from unequal growth)
  const ratio = pos > 0 && neg > 0 ? Math.sqrt(neg / pos) : 1;
  const sp = ratio, sn = 1 / ratio;
  for (const c of cs) { const e = c.econ; e.nxg = e.nxgRaw > 0 ? e.nxgRaw * sp : e.nxgRaw * sn; }
}

// ---------------------------------------------------------------- monthly national accounts, fiscal, prices
export function financeStep(sim, c, day) {
  const e = c.econ, p = c.policy, st = sim.state, prices = st.prices;
  // ---- terms of trade & trade values ----
  let resNX = 0, resNXval = 0, impVal = 0;
  for (let k = 0; k < 4; k++) {
    const net = e.exports[k] - e.imports[k];
    resNX += net; resNXval += net * prices[k]; impVal += e.imports[k] * prices[k];
  }
  e.tot = resNXval - resNX;
  const goodsImp = e.openness * e.gdp * 0.45 * (1 - 0.3 * (p.tariff - e.tariff0));
  e.gni = e.gdp + e.tot;
  // ---- government revenue ----
  const collect = clamp(e.collect0 + 0.45 * (c.gov0.corruption - c.gov.corruption) + modd(c, 'tax.eff') + 0.1 * (c.gov.bureaucracy - c.gov0.bureaucracy), 0.4, 1.0);
  e.collect = collect;
  e.taxRev = p.taxRate * e.gni * collect;
  e.tariffRev = p.tariff * (goodsImp + impVal);
  e.rentRev = e.stateShare * (e.Y[S.oil] * prices[1] * (1 - 0) + e.Y[S.gas] * prices[2] + 0.5 * e.Y[S.mining] * prices[3]) * (1 - 0.0);
  e.revenue = e.taxRev + e.tariffRev + e.rentRev;
  // ---- spending ----
  const b = p.budget;
  e.spend = p.spendRate * e.gdpPot;
  const sp = {}; for (const k of BUDGET_CATS) sp[k] = b[k] * e.spend;
  const ui = Math.max(0, e.unemp - e.uNat) * e.gdpPot * 0.4 * Math.min(1.5, e.welfareLvl) * (0.4 + c.dev0);
  e.uiBenefit = ui;
  c.spendCat = sp;
  const pubI = 0.7 * sp.infrastructure;
  const govC = e.spend - sp.welfare - pubI - 0.5 * sp.subsidies;
  e.spend += ui;
  // ---- interest and debt market ----
  const debtRatio = e.debt / Math.max(1, e.gdp);
  const reservesMonths = e.reserves / Math.max(1e-6, (impVal + goodsImp) / 12);
  e.reservesMonths = reservesMonths;
  const premium = 0.006 + (0.045 - 0.032 * e.fxDepth) * Math.max(0, debtRatio - 0.5 - 0.5 * e.fxDepth) ** 1.3 + 0.1 * Math.max(0, 0.55 - c.gov.stability) + 0.35 * Math.max(0, e.infl - 0.05) + 0.03 * Math.max(0, 3 * (1 - 0.7 * e.fxDepth) - reservesMonths) / 3 + 0.01 * (1 - c.dev0) + modv(c, 'invest.conf') * -0.02;
  e.risk = premium;
  const y = p.policyRate + premium;
  e.bondYield = y;
  e.effYield += 0.03 * (y - e.effYield);
  e.interest = e.debt >= 0 ? e.debt * e.effYield : e.debt * Math.min(0.03, p.policyRate * 0.6);
  e.deficit = e.spend + e.interest - e.revenue;
  const marketClosed = y > 0.28 || (debtRatio > 2.2 && c.gov.stability < 0.4);
  let monet = 0;
  if (e.deficit > 0 && marketClosed) { monet = 0.6 * e.deficit; }
  e.monet = monet; e.marketClosed = marketClosed;
  const erosion = 0.7 * e.infl * Math.max(0, e.debt);
  const fxReval = 0.25 * Math.max(0, e.debt) * Math.max(-0.1, Math.log(Math.max(0.3, e.rerPrev) / e.rer));
  e.debt = clamp(e.debt + (e.deficit - monet - erosion) / 12 + fxReval, -1.5 * e.gdp, 6 * e.gdp);
  e.debtRatio = e.debt / Math.max(1, e.gdp);
  // ---- aggregate demand ----
  const realRate = p.policyRate - e.inflExp;
  const sav = clamp(e.savBase + 0.35 * (realRate - e.realRate0) + 0.15 * (e.unemp - e.uNat) + 0.1 * Math.max(0, e.infl - 0.1) - modv(c, 'cons.conf'), 0.02, 0.5);
  e.sav = sav;
  const Yd = e.gni - e.taxRev - e.tariffRev - e.rentRev + sp.welfare + ui + 0.5 * sp.subsidies + 0.7 * Math.max(0, e.interest);
  const C = (1 - sav) * Yd;
  const taxDrag = 1 - 1.2 * (p.taxRate - e.taxRate0);
  const conf = 1 + 0.4 * (c.gov.stability - e.stab0) + modv(c, 'invest.conf');
  let invRate = e.invRate0 * (1 - 2.2 * (realRate - e.realRate0)) * taxDrag * conf * ((0.7 + 0.3 * e.credit) / 0.88);
  invRate = clamp(invRate, 0.45 * e.invRate0, 1.45 * e.invRate0);
  e.invRate = invRate;
  const Ipriv = invRate * e.gdpPot;
  const resNXreal = resNX; // base-price physical net exports
  const NX = resNXreal + e.nxg;
  const AD = C + Ipriv + pubI + govC + NX;
  const util = clamp(e.util + 0.3 * (AD / Math.max(1e-6, e.gdpPot) - e.util), 0.72, 1.06);
  e.util = util;
  e.gdp = e.gdpPot * util;
  e.cons = C; e.inv = Ipriv + pubI; e.govC = govC; e.exp = Math.max(0, resNX) + Math.max(0, e.nxg); e.imp = Math.max(0, -resNX) + Math.max(0, -e.nxg);
  e.dInv = e.gdp - (C + Ipriv + pubI + govC + NX);
  e.pubI = pubI; e.Ipriv = Ipriv;
  e.gdpHist.push(e.gdp); e.gdpHist.shift();
  const yoy = Math.log(e.gdp / Math.max(1e-6, e.gdpHist[0]));
  e.growth = yoy;
  // ---- balance of payments & reserves ----
  const ca = resNXval + e.nxg;
  e.ca = ca;
  e.rerPrev = e.rer;
  const caR = ca / Math.max(1e-6, e.gdp);
  const stress = Math.max(0, 3 * (1 - 0.7 * e.fxDepth) - reservesMonths) / 3;
  let drer = 1.5 * (caR - e.ca0) + 0.4 * (1 - e.rer) - 0.25 * stress - (e.reserves <= 0 ? 0.2 : 0) - (e.marketClosed ? 0.15 : 0);
  e.rer = clamp(e.rer * (1 + drer / 12), 0.4, 1.8);
  // ---- inflation ----
  const dp = (k) => Math.log(prices[k] / e.priceLast[k]);
  const shield = clamp(1 - 0.5 * (b.subsidies * p.spendRate / Math.max(1e-6, e.fiscal0.subsidies)) , 0.4, 1) ;
  const cost = (e.wOil * dp(1) + e.wGas * dp(2) + e.wFood * dp(0) * 0.6) * 12 * 0.3 * (0.5 + 0.5 * (b.subsidies * p.spendRate > e.fiscal0.subsidies ? 0.5 : 1));
  for (let k = 0; k < 4; k++) e.priceLast[k] = prices[k];
  const fx = -0.3 * Math.log(e.rer / Math.max(0.01, e.rerPrev || e.rer)) * 12 * e.openness;
  const pull = 0.6 * (util - 1);
  const shortage = 0.04 * (e.shortage[0] + e.shortage[1] * 0.7 + e.shortage[2] * 0.5);
  const moneyPress = 0.8 * (monet / Math.max(1, e.gdp));
  const tight = -0.25 * (realRate - e.realRate0);
  const target = e.inflExp + cost + pull + fx + shortage + moneyPress + tight + modv(c, 'infl.add');
  const prevInfl = e.infl;
  e.infl = clamp(e.infl + 0.28 * (target - e.infl), -0.05, 2.5);
  e.inflExp = clamp(e.inflExp + (0.04 + 0.05 * (1 - e.cbIndep)) * (e.infl - e.inflExp) + 0.012 * e.cbIndep * (0.02 - e.inflExp), 0, 2);
  e.cpi *= 1 + e.infl / 12;
  // ---- labour market ----
  e.unemp = clamp(e.uNat + 0.6 * Math.max(0, 1 - util) - 0.25 * Math.max(0, util - 1) + 0.5 * e.warLoss * 0.2, 0.01, 0.65);
  e.emp = e.lf * (1 - e.unemp);
  const gpc = Math.log((e.gni / c.pop.total) / (e.gniPcPrev || (e.gni / c.pop.total)));
  e.gniPcPrev = e.gni / c.pop.total;
  e.realIncGrowth = (e.realIncGrowth || 0) * 0.9 + 0.1 * (gpc * 12 - Math.max(0, e.infl - 0.03) * 0.3);
  return { sp };
}

// central bank rule (independent of government if cbIndep high). Writes c.target.policyRate; lag applied in policy step.
export function centralBankStep(c) {
  const e = c.econ;
  const taylor = 0.015 + e.inflExp + 1.2 * (e.infl - 0.02) + 1.5 * (e.util - 1);
  const tr = clamp(taylor, -0.005, 0.3);
  const w = 0.6 + 0.3 * e.cbIndep;
  c.target.policyRate = clamp(c.target.policyRate + w * 0.5 * (tr - c.target.policyRate), -0.005, 0.5);
}

// ---------------------------------------------------------------- investment allocation, capital, TFP, depletion, energy transition
export function investmentStep(sim, c) {
  const e = c.econ, p = c.policy, prices = sim.state.prices;
  const Itot = e.Ipriv;
  const w = new Array(NS).fill(0);
  let mpkAvg = 0, kTot = 0;
  for (let k = 0; k < NS; k++) { if (e.K[k] > 0) { mpkAvg += (SECTOR_PARAMS[SECTORS[k]].alpha * e.Y[k]); kTot += e.K[k]; } }
  mpkAvg /= Math.max(1e-9, kTot);
  const focusIdx = p.focus && p.focus !== 'none' ? SECTOR[p.focus] : -1;
  for (let k = 0; k < NS; k++) {
    if (e.K[k] <= 0) continue;
    const par = SECTOR_PARAMS[SECTORS[k]];
    const mpk = (par.alpha * e.Y[k]) / e.K[k];
    let sig = Math.pow(Math.max(0.2, mpk / mpkAvg), 0.8);
    if (k === S.oil) sig *= Math.pow(prices[1], 1.2) * (1 - 0.5 * p.cleanPriority);
    if (k === S.gas) sig *= Math.pow(prices[2], 1.2) * (1 - 0.3 * p.cleanPriority);
    if (k === S.mining) sig *= Math.pow(prices[3], 1.0);
    if (k === S.agri) sig *= Math.pow(prices[0], 0.8);
    if (k === S.utilities) sig *= 1 + 1.2 * (e.shortage[1] + e.shortage[2]) + 1.5 * p.cleanPriority * (1 - e.clean) * 0.5;
    if (k === focusIdx) sig *= 1.5;
    w[k] = (par.delta + 0.03) * e.K[k] * sig;
  }
  const wsum = w.reduce((a, b) => a + b, 0) || 1;
  const keep = e.invKeep || (e.invKeep = new Array(NS).fill(0));
  for (let k = 0; k < NS; k++) {
    const par = SECTOR_PARAMS[SECTORS[k]];
    const Ik = (Itot * w[k]) / wsum;
    keep[k] = Ik;
    e.K[k] = Math.max(0, e.K[k] + (Ik - par.delta * e.K[k]) / 12);
    // TFP growth
    const gap = clamp(1 - (e.gdp / c.pop.total) / 60, 0, 0.9);
    const catchup = 0.018 * Math.pow(gap, 1.5) * (0.5 + 0.5 * clamp(e.openness * 2, 0, 1)) * (0.4 + 0.6 * c.pop.edu);
    const g = par.g * (0.5 + 0.5 * c.gov.stability) + catchup + 0.005 * (c.pop.edu - 0.6) + 0.006 * e.researchIdx * (k === S.tech ? 2 : 1);
    if (k !== S.oil && k !== S.gas && k !== S.mining) e.A[k] *= 1 + (k === S.agri ? g * clamp(prices[0], 0.5, 1.5) : g) / 12;
  }
  // depletion / exploration (oil, gas, mining)
  [[S.oil, 0], [S.gas, 1], [S.mining, 2]].forEach(([k, d]) => {
    if (e.Y0s === undefined) e.Y0s = e.Y.slice();
    if (!(e.Y0s[k] > 1e-9)) return;
    const rel = e.Y[k] / e.Y0s[k];
    const expl = 0.09 * (keep[k] / Math.max(1e-9, e.Y[k])) * (1 + modd(c, 'tfp.' + SECTORS[k]));
    e.depl[d] = clamp(e.depl[d] + (expl - 0.02 * rel) / 12, 0.35, 1.5);
  });
  // energy transition
  const rate = 0.006 + 0.03 * p.cleanPriority * (0.5 + p.envRegulation) + modv(c, 'energy.clean_rate') * 0.6 + 0.01 * Math.max(0, prices[1] - 1) + 0.01 * Math.max(0, prices[2] - 1);
  e.clean = clamp(e.clean + (rate * (0.4 + 2 * Math.min(1, (keep[S.utilities] / Math.max(1e-9, e.Y[S.utilities])) / 0.25)) * (1 - e.clean)) / 12, 0, 0.97);
  // public capital / infrastructure
  const infraSpend = c.spendCat ? c.spendCat.infrastructure : 0;
  e.pubK = Math.max(0, e.pubK + (infraSpend * 0.9 - 0.04 * e.pubK) / 12);
  const infraTarget = clamp(e.infra0Ref * Math.pow(e.pubK / e.pubK0, 0.6) * (1 + modd(c, 'infra.eff')), 0.08, 0.98);
  e.infra += 0.04 * (infraTarget - e.infra);
  e.infra = clamp(e.infra, 0.05, 0.98);
  // emissions
  e.emis = Math.max(0, (e.dem[1] * 1.0 + e.dem[2] * 0.7 + (1 - e.clean) * e.Y[S.utilities] * 4 + e.Y[S.industry] * 0.05) * (1 - modd(c, 'emis.int')) * sim.cal.emisScale);
}

// External financing: deficits are financed by capital inflows from surplus countries (conserving world reserves/NFA); the
// unfinanced part drains reserves. Sum over the world of reserve changes is exactly zero (tested).
export function externalFinanceStep(sim) {
  const cs = sim.state.countries;
  let F = 0, S = 0;
  for (const c of cs) {
    const e = c.econ;
    const a = clamp(0.96 - 0.6 * Math.max(0, e.risk - 0.025) / 0.1 - 0.5 * Math.max(0, -e.nfa / e.gdp - 0.3) - 0.5 * Math.max(0, 0.5 - c.gov.stability) + 0.03 * e.fxDepth, 0, 0.98);
    e.finAccess = a;
    if (e.ca < 0) { e.fin = -e.ca * a; F += e.fin; } else { e.fin = 0; S += e.ca; }
  }
  const scale = F > S ? S / F : 1;
  for (const c of cs) {
    const e = c.econ;
    let d;
    if (e.ca < 0) { d = (e.ca + e.fin * scale) / 12; } else { d = (e.ca - (S > 0 ? F * scale * (e.ca / S) : 0)) / 12; }
    e.dReserves = d;
    e.reserves = e.reserves + d;
    e.nfa += e.ca / 12;
    if (e.reserves < 0) { e.reservesDeficit = -e.reserves; e.reserves = 0; } else e.reservesDeficit = 0;
  }
}
