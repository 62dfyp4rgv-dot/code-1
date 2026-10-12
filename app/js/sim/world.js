// Sim: owns static geography, dynamic state, the scheduler (daily / monthly / yearly) and the event log.
import { buildGeography } from './geography.js';
import { RNG } from './rng.js';
import { Calendar } from './calendar.js';
import { COM, COMMODITIES, BUDGET_CATS, clamp } from './constants.js';
import {
  initCountryEconomy,
  calibrateWorld,
  finishEconomyInit,
  productionStep,
  goodsTradeStep,
  financeStep,
  investmentStep,
  centralBankStep,
  externalFinanceStep,
} from './economy.js';
import { buildTradeStatic, clearTrade, clearTradeGen } from './trade.js';
import { initGovernment, politicsStep, warPressureOf } from './politics.js';
import { initCohorts, demographyStep, servicesStep, yearlyMigration, climateStep } from './society.js';
import { initResearch, researchStep, updateTopEconomies } from './research.js';
import { refreshMods, snapshotBase, addTimedMod } from './mods.js';
import * as MIL from './military.js';
import * as DIP from './diplomacy.js';
import * as INT from './intel.js';
import * as EVT from './events.js';
import * as PRJ from './projects.js';
import * as MAN from './mandates.js';
import * as CIV from './civil.js';
import * as AI from '../ai/ai.js';
import * as CMD from './commands.js';
import * as VIC from './victory.js';
import * as STAT from './stats.js';
import * as WAR from './war.js';
import { checkAchievements } from './achievements.js';
import { GOV_PROFILE } from './constants.js';

export const SAVE_VERSION = 1;

export class Sim {
  constructor(data, opts = {}) {
    this.data = data;
    this.geo = buildGeography(data);
    this.opts = { seed: 12345, scenario: 'fault_lines', player: 'USA', difficulty: 'normal', ...opts };
    this.listeners = [];
    this.perf = { monthly: 0, daily: 0, ai: 0, monthlyCount: 0 };
    this.timers = {};
    if (!opts.blank) this.newGame();
  }
  // ------------------------------------------------------------------ setup
  newGame() {
    const { data, geo } = this;
    const sc = data.scenarioById[this.opts.scenario];
    if (!sc) throw new Error('unknown scenario ' + this.opts.scenario);
    this.scenario = sc;
    this.diff = data.difficulty[this.opts.difficulty] || data.difficulty.normal;
    this.rng = new RNG(this.opts.seed);
    this.calendar = new Calendar(...sc.start);
    const N = geo.N;
    const playerId = geo.idOf[this.opts.player];
    if (playerId === undefined) throw new Error('unknown player country ' + this.opts.player);
    this.state = {
      cal: null,
      lastBlockade: {},
      version: SAVE_VERSION,
      seed: this.opts.seed,
      scenario: sc.id,
      day: 0,
      playerId,
      settings: {
        difficulty: this.opts.difficulty,
        strictElections: false,
        permadeath: false,
        aiAggression: this.diff.aiAggression * (this.opts.aiMult ?? 1),
        aiMult: this.opts.aiMult ?? 1,
      },
      countries: [],
      prices: [1, 1, 1, 1],
      reg: null,
      orgs: [],
      treaties: [],
      sanctions: [],
      wars: [],
      chokes: [],
      world: { temp: 1.2, emis: 0, cumEmis: 0 },
      pandemic: null,
      cartel: { quota: 1 },
      counters: {},
      ach: {},
      forces: [],
      nextId: 1,
      log: [],
      inbox: [],
      events: { fired: {}, cooldown: {}, pending: [] },
      techAdopt: {},
      topEconomies: [],
      ended: null,
      flags: {},
    };
    const st = this.state;
    // countries
    geo.rows.forEach((row, i) => {
      const c = { id: row.iso3, idx: i, name: row.name, region: row.region, capital: { name: row.capital, lat: row.lat, lon: row.lon } };
      st.countries.push(c);
    });
    // regions (dynamic)
    const R = geo.regions.length;
    st.reg = {
      owner: new Int16Array(R),
      ctrl: new Int16Array(R),
      dev: new Float32Array(R),
      fort: new Float32Array(R),
      contestBy: new Int16Array(R).fill(-1),
      contestProg: new Float32Array(R),
      garrison: new Float32Array(R),
    };
    geo.regions.forEach((r, i) => {
      st.reg.owner[i] = r.owner0;
      st.reg.ctrl[i] = r.owner0;
    });
    this.bindRegions();
    for (const c of st.countries) initCountryEconomy(this, c, geo.rows[c.idx]);
    for (const c of st.countries) initGovernment(this, c, geo.rows[c.idx]);
    calibrateWorld(this);
    for (const c of st.countries) {
      initCohorts(c);
      c.pop.health0 = c.pop.health;
      c.pop.edu0 = c.pop.edu;
      c.econ.techShare0 = c.econ.Y[7] / c.econ.gdp;
    }
    DIP.initOrgsAndTreaties(this);
    DIP.initDiplomacyState(this);
    finishEconomyInit(this);
    for (const c of st.countries) {
      c.econ.gini0 = c.econ.gini;
      c.policy0 = { ...c.policy, budget: { ...c.policy.budget } };
      initResearch(this, c, geo.rows[c.idx]);
      MIL.initMilitary(this, c, geo.rows[c.idx]);
      INT.initIntel(this, c, geo.rows[c.idx]);
    }
    updateTopEconomies(this);
    for (const c of st.countries) {
      c.flags = {};
      c.autoCB = true;
      refreshMods(c, 0);
      snapshotBase(c);
    }
    st.chokes = data.chokepoints.map((cp) => ({ id: cp.id, open: 1 }));
    this.buildChokeDefs();
    buildTradeStatic(this);
    DIP.buildIndex(this);
    DIP.initRelations(this);
    MIL.initForces(this);
    this.lastFlows = [[], [], [], []];
    this.applyScenario(sc);
    this.applyVariation(this.opts.variation || 0);
    this.initTradeBaseline();
    EVT.initEvents(this);
    AI.initAI(this);
    STAT.initStats(this);
    VIC.initVictory(this);
    yearlyMigration(this);
    climateStep(this);
    this.snapshotStats();
  }
  bindRegions() {
    this.regions = this.state.reg;
    this.rebuildOwnedRegions();
  }
  rebuildOwnedRegions() {
    const N = this.geo.N;
    this.regionsOf = Array.from({ length: N }, () => []);
    this.controlledBy = Array.from({ length: N }, () => []);
    const r = this.state.reg;
    for (let i = 0; i < r.owner.length; i++) {
      this.regionsOf[r.owner[i]].push(i);
      this.controlledBy[r.ctrl[i]].push(i);
    }
  }
  buildChokeDefs() {
    const geo = this.geo;
    this.chokeDefs = {};
    for (const cp of this.data.chokepoints) {
      let uses;
      let exporterSet = null;
      if (cp.exporters) {
        // lane carries the physical exports of these countries: closure caps what they can ship (any destination)
        exporterSet = new Set(cp.exporters.map((x) => geo.idOf[x]).filter((x) => x !== undefined));
        uses = () => false;
      } else {
        const [A, B] = cp.between;
        const rs = geo.rows;
        uses = (i, j) => (A.includes(rs[i].region) && B.includes(rs[j].region)) || (B.includes(rs[i].region) && A.includes(rs[j].region));
      }
      this.chokeDefs[cp.id] = { share: cp.share, commodities: cp.commodities, uses, exporterSet };
    }
  }
  applyScenario(sc) {
    const st = this.state;
    if (sc.shocks?.prices) for (const [k, v] of Object.entries(sc.shocks.prices)) st.prices[COM[k]] = v;
    if (sc.shocks?.chokepoints)
      for (const [k, v] of Object.entries(sc.shocks.chokepoints)) {
        const cp = st.chokes.find((x) => x.id === k);
        if (cp) cp.open = v;
      }
    if (sc.shocks?.cartelQuota) st.cartel.quota = sc.shocks.cartelQuota;
    for (const c of st.countries) c.econ.priceLast = [1, 1, 1, 1]; // pre-shock price level: the first month sees the shock
    const COMBIT = { oil: 0b0010, gas: 0b0100, minerals: 0b1000, food: 0b0001 };
    for (const sn of sc.sanctions || []) {
      const t = this.geo.idOf[sn.target];
      if (t === undefined) continue;
      const by = [
        ...new Set(
          sn.by
            .flatMap((x) => (x.startsWith('@org:') ? st.orgs.find((o) => o.id === x.slice(5))?.members || [] : [this.geo.idOf[x]]))
            .filter((x) => x !== undefined && x !== t),
        ),
      ];
      if (!by.length) continue;
      const mask = sn.mask.reduce((m, k) => m | COMBIT[k], 0);
      st.sanctions.push({ id: st.nextId++, by: by[0], target: t, mask, coalition: by.slice(1), start: -400, note: sn.note });
      for (const b of by) {
        this.rel(t, b, -12, -10);
      }
    }
    // optional scenario tuning: standing rivalries, starting relations, and temporary modifiers for countries / regions / everyone
    const N = this.geo.N;
    for (const [a, b, v] of sc.rivalries || []) {
      const i = this.geo.idOf[a];
      const j = this.geo.idOf[b];
      if (i === undefined || j === undefined) continue;
      st.rel.rivalry[i * N + j] = Math.max(st.rel.rivalry[i * N + j], v);
      st.rel.rivalry[j * N + i] = Math.max(st.rel.rivalry[j * N + i], v);
    }
    for (const [a, b, dOp] of sc.relations || []) {
      const i = this.geo.idOf[a];
      const j = this.geo.idOf[b];
      if (i !== undefined && j !== undefined) this.rel(i, j, dOp, dOp / 2);
    }
    for (const m of sc.mods || []) {
      const until = st.day + Math.round(m.months * 30.4);
      for (const c of st.countries) {
        const hit = m.all || (m.countries || []).includes(c.id) || (m.regions || []).includes(this.geo.rows[c.idx].region);
        if (hit) addTimedMod(c, m.mod, m.add, until, sc.name);
      }
    }
    if (sc.debtShift || sc.rateShift) {
      for (const c of st.countries) {
        const e = c.econ;
        if (sc.debtShift && e.debt / e.gdp > 0.5) e.debt += sc.debtShift * e.gdp * Math.min(1, e.debt / e.gdp / 1.2); // heavier debts accumulated before the scenario starts
        if (sc.rateShift) {
          c.policy.policyRate += sc.rateShift;
          c.target.policyRate += sc.rateShift;
          e.rStar += sc.rateShift;
        }
      }
    }
    for (const w of sc.wars || []) MIL.startScenarioWar(this, w);
  }
  // Optional seeded "what if" perturbation of the starting world (level 1 = some, 2 = wild): different growth paths, a few boom and
  // trouble stories, and new rivalries between neighbours. Same seed and level give the same world.
  applyVariation(level) {
    if (!level) return;
    const st = this.state;
    const rng = this.rng;
    const geo = this.geo;
    const N = geo.N;
    const FOREVER = 1e9;
    const sigma = level === 1 ? 0.05 : 0.12;
    const keys = ['tfp.agri', 'tfp.industry', 'tfp.services', 'tfp.tech', 'tfp.mining', 'tfp.utilities'];
    for (const c of st.countries) {
      // a country-wide level shift plus two sector-specific ones
      const shift = rng.range(-1, 1) * sigma * 0.6;
      for (const k of ['tfp.industry', 'tfp.services'])
        addTimedMod(c, k, shift + rng.range(-1, 1) * sigma * 0.4, FOREVER, 'world variation');
      addTimedMod(c, keys[rng.int(0, keys.length - 1)], rng.range(-1, 1) * sigma, FOREVER, 'world variation');
    }
    const stories = level === 1 ? 3 : 7;
    for (let k = 0; k < stories; k++) {
      const boom = st.countries[rng.int(0, N - 1)];
      addTimedMod(boom, 'tfp.industry', 0.04 * level, st.day + 365 * 8, 'a boom');
      addTimedMod(boom, 'invest.conf', 0.03, st.day + 365 * 8, 'a boom');
      const bust = st.countries[rng.int(0, N - 1)];
      addTimedMod(bust, 'tfp.services', -0.03 * level, st.day + 365 * 6, 'a long slump');
      addTimedMod(bust, 'unrest.add', 0.01 * level, st.day + 365 * 6, 'a long slump');
    }
    let added = 0;
    for (let tries = 0; tries < 400 && added < 8 * level; tries++) {
      const i = rng.int(0, N - 1);
      const nb = [...geo.neighbors[i]];
      if (!nb.length) continue;
      const j = nb[rng.int(0, nb.length - 1)];
      if (st.rel.rivalry[i * N + j] > 0 || this.alliesOf(i).has(j)) continue;
      const v = rng.range(35, 65);
      st.rel.rivalry[i * N + j] = v;
      st.rel.rivalry[j * N + i] = v;
      added++;
    }
  }
  initTradeBaseline() {
    const cs = this.state.countries;
    const p0 = this.state.prices.slice();
    this.state.prices = [1, 1, 1, 1];
    for (const c of cs) {
      c.econ.nxg = 0;
    }
    clearTrade(this, { commitStocks: false });
    let num = 0,
      den = 0;
    for (const c of cs) {
      const e = c.econ;
      let net = 0;
      for (let k = 0; k < 4; k++) net += e.exports[k] - e.imports[k];
      e.resNX0 = net;
      num += e.ca0 * e.gdp - net;
      den += e.gdp;
    }
    const adj = num / den;
    for (const c of cs) {
      const e = c.econ;
      e.nxg0r = (e.ca0 * e.gdp - e.resNX0 - adj * e.gdp) / e.gdp;
      e.ca0 = e.nxg0r + e.resNX0 / e.gdp;
      e.nxg = e.nxg0r * e.gdp;
      e.ca = e.ca0 * e.gdp;
      const nxTotal = e.ca0 * e.gdp;
      e.C0 = e.gdp - e.inv - e.pubI0 - e.govC0 - nxTotal;
      e.consK = e.C0 / e.Yd0;
      e.savBase = 1 - e.consK;
      e.cons = e.C0;
      e.stock = e.stock.slice();
      // readouts for the first frame (before the first monthly update)
      e.debtRatio = e.debt / e.gdp;
      e.taxRev = c.policy.taxRate * e.gdp * e.collect0;
      e.tariffRev = e.tariff0 * e.impVal0;
      e.rentRev = e.rentRev0;
      e.spend = e.spend0;
      e.revenue = e.taxRev + e.tariffRev + e.rentRev;
      e.deficit = e.spend + e.interest - e.revenue;
      c.spendCat = Object.fromEntries(BUDGET_CATS.map((k) => [k, c.policy.budget[k] * e.spend]));
      e.bondYield = e.effYield;
      e.reservesMonths = e.reserves / Math.max(1e-6, (e.impVal0 + e.openness * e.gdp * 0.45) / 12);
      e.collect = e.collect0;
      e.dInv = 0;
    }
    this.state.prices = p0;
    for (const c of cs)
      for (let k = 0; k < 4; k++) {
        c.econ.prod[k] = c.econ.prod[k];
      }
  }
  // Rebuild every derived/static structure after loading a save (nothing derived is stored).
  postLoad() {
    const { data, geo } = this;
    this.chokeDefs && 0;
    buildTradeStatic(this);
    this.lastFlows = [[], [], [], []];
    this.airCache = new Map();
    this.supplyBy = new Map();
    this.indexForces();
    DIP.initDerived(this);
    DIP.buildIndex(this);
    EVT.initDerived(this);
    this.cartelMembers = null;
    this.hostile = WAR.hostileMask(this);
    this.worldTrade = this.worldTrade || null;
  }
  // ------------------------------------------------------------------ logging / events
  on(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((f) => f !== fn);
    };
  }
  emit(type, payload) {
    for (const l of this.listeners) l(type, payload);
  }
  log(country, kind, text, data = {}, level = 'normal') {
    const entry = { day: this.state.day, c: country, kind, text, data, level };
    const L = this.state.log;
    L.push(entry);
    if (L.length > 600) L.splice(0, L.length - 500);
    if (level === 'high' || (country === this.state.playerId && level !== 'low')) {
      this.state.inbox.push(entry);
      if (this.state.inbox.length > 200) this.state.inbox.shift();
    }
    this.emit('log', entry);
  }
  endGame(reason) {
    if (!this.state.ended) {
      this.state.ended = { reason, day: this.state.day, final: true };
      this.emit('ended', this.state.ended);
    }
  }
  continueSandbox() {
    if (this.state.ended) {
      this.state.ended = null;
      this.state.flags.sandbox = true;
    }
  }
  // ------------------------------------------------------------------ scheduler

  // ------------------------------------------------------------------ helpers shared by modules
  indexForces() {
    const N = this.geo.N;
    this.forcesOf = Array.from({ length: N }, () => []);
    this.forcesAtRegion = new Map();
    this._forceMap = new Map();
    for (const f of this.state.forces) {
      this.forcesOf[f.owner].push(f);
      this._forceMap.set(f.id, f);
      if (f.branch !== 'sea') {
        let l = this.forcesAtRegion.get(f.loc);
        if (!l) this.forcesAtRegion.set(f.loc, (l = []));
        l.push(f);
      }
    }
    this.airCache = this.airCache || new Map();
    this._milDay = -1;
  }
  forceById(id) {
    return this._forceMap.get(id);
  }
  atWar(i) {
    return WAR.atWar(this, i);
  }
  atWarWith(a, b) {
    for (const w of this.state.wars)
      if (w.active && ((w.attackers.includes(a) && w.defenders.includes(b)) || (w.attackers.includes(b) && w.defenders.includes(a))))
        return true;
    return false;
  }
  enemiesOf(i) {
    return WAR.enemiesOf(this, i);
  }
  hostileNow() {
    return WAR.hostileMask(this);
  }
  alliesOf(i) {
    const st = this.state;
    let ver = st.day * 1e6 + st.treaties.length * 1000;
    for (const o of st.orgs) if (o.type === 'alliance') ver += o.members.length;
    if (this._allyVer !== ver) {
      this._allyVer = ver;
      this._allyCache = new Map();
    }
    let s = this._allyCache.get(i);
    if (!s) {
      s = DIP.alliesOf(this, i);
      this._allyCache.set(i, s);
    }
    return s;
  }
  hasCasusBelli(a, d) {
    return DIP.hasCasusBelli(this, a, d);
  }
  adjustCredibility(i, d) {
    DIP.adjustCredibility(this, i, d);
  }
  worldOpinionShift(i, d, w) {
    DIP.worldOpinionShift(this, i, d, w);
  }
  rel(i, j, dop, dtr) {
    DIP.rel(this, i, j, dop, dtr);
  }
  mobilizeFor(i) {
    const m = this.state.countries[i].mil;
    m.mobilizationTarget = Math.max(m.mobilizationTarget || 0, 1);
  }
  resolveCallToArms(w, call) {
    DIP.resolveCallToArms(this, w, call);
  }
  callWillingness(ally, w, call) {
    return DIP.callWillingness(this, ally, w, call);
  }
  joinWar(w, c, side) {
    return WAR.joinWar(this, w, c, side);
  }
  sanctioned(a, b) {
    return !!this.dipIdx.sanc[a * this.geo.N + b];
  }
  tradeBloc(a, b) {
    return this.dipIdx.bloc[a * this.geo.N + b];
  }
  treatyBonus(a, b) {
    return this.dipIdx.bonus[a * this.geo.N + b];
  }
  tradeComplement(a, b) {
    return DIP.tradeComplement(this, a, b);
  }
  milPower(i) {
    if (this._milDay !== this.state.day) {
      this._milDay = this.state.day;
      this._milCache = new Float64Array(this.geo.N).fill(-1);
    }
    if (this._milCache[i] < 0) this._milCache[i] = DIP.milPower(this, i);
    return this._milCache[i];
  }
  netLevelOf(i, t) {
    return INT.netLevel(this, i, t);
  }
  newLeaderName(c) {
    return this.country(c.idx).gov.leader.name + ' II';
  }
  govProfile(c) {
    return GOV_PROFILE[c.gov.type];
  }
  growForces(c, k) {
    MIL.growForces(this, c, k);
  }
  shrinkForces(c, k) {
    MIL.shrinkForces(this, c, k);
  }
  epidemicMortality(c) {
    return EVT.epidemicMortality(this, c);
  }
  get date() {
    return this.calendar.ymd(this.state.day);
  }
  step() {
    for (const _ of this.stepGen()) {
      /* run to completion */
    }
  }
  // Generator form of one simulated day: yields between heavy phases so a UI can spread a monthly update over several frames.
  *stepGen() {
    const st = this.state;
    if (st.ended && st.ended.final) return;
    st.day++;
    const day = st.day;
    this.midDay = true; // cleared when the day (including its monthly phases) completes; saving in between is refused
    const t0 = performance.now();
    MIL.dailyStep(this, day);
    DIP.dailyStep(this, day);
    EVT.dailyStep(this, day);
    this.perf.daily += performance.now() - t0;
    if (this.calendar.isMonthStart(day)) {
      const t1 = performance.now();
      yield* this.monthlyGen(day);
      this.perf.monthly += performance.now() - t1;
      this.perf.monthlyCount++;
      if (this.calendar.isYearStart(day)) this.yearly(day);
    }
    this.midDay = false;
    yield;
  }
  advance(days) {
    for (let i = 0; i < days; i++) {
      this.step();
      if (this.state.ended && this.state.ended.final) break;
    }
  }
  advanceMonths(m) {
    const target = this.calendar.dayOf(...this.addMonths(this.date, m));
    while (this.state.day < target) {
      this.step();
      if (this.state.ended && this.state.ended.final) break;
    }
  }
  addMonths(d, m) {
    let y = d.y,
      mo = d.m + m;
    while (mo > 12) {
      mo -= 12;
      y++;
    }
    return [y, mo, 1];
  }
  monthly(day) {
    for (const _ of this.monthlyGen(day)) {
      /* run to completion */
    }
  }
  *monthlyGen(day) {
    const st = this.state,
      cs = st.countries,
      N = cs.length,
      CH = 42;
    const chunked = function* (fn) {
      for (let i = 0; i < N; i += CH) {
        for (let j = i; j < Math.min(N, i + CH); j++) fn(cs[j]);
        yield;
      }
    };
    for (const c of cs) refreshMods(c, day);
    for (const c of cs) {
      this.policyLag(c);
      if (c.idx !== st.playerId || c.autoCB) centralBankStep(c);
    }
    for (const c of cs) if (c.idx !== st.playerId || c.autoFiscal) AI.fiscalRule(this, c);
    yield;
    yield* chunked((c) => productionStep(this, c));
    goodsTradeStep(this);
    yield* clearTradeGen(this);
    yield* chunked((c) => financeStep(this, c, day));
    externalFinanceStep(this);
    yield* chunked((c) => investmentStep(this, c));
    climateStep(this);
    yield* chunked((c) => {
      servicesStep(this, c);
      demographyStep(this, c);
      researchStep(this, c, day);
    });
    yield* chunked((c) => politicsStep(this, c, day));
    CIV.monthlyStep(this, day);
    MIL.monthlyStep(this, day);
    yield;
    INT.monthlyStep(this, day);
    yield;
    DIP.monthlyStep(this, day);
    yield;
    EVT.monthlyStep(this, day);
    PRJ.monthlyStep(this, day);
    MAN.monthlyStep(this, day);
    yield;
    const ta = performance.now();
    yield* AI.monthlyGen(this, day);
    this.perf.ai += performance.now() - ta;
    VIC.monthlyStep(this, day);
    STAT.monthlyStep(this, day);
    checkAchievements(this);
    yield;
  }
  yearly(day) {
    yearlyMigration(this);
    updateTopEconomies(this);
    DIP.yearlyStep(this, day);
    EVT.yearlyStep(this, day);
    VIC.yearlyStep(this, day);
    this.emit('year', { day });
  }
  snapshotStats() {
    STAT.monthlyStep(this, this.state.day);
  }
  // ------------------------------------------------------------------ hooks used by modules
  policyLag(c) {
    const p = c.policy,
      t = c.target;
    const lag = {
      taxRate: 0.25,
      spendRate: 0.25,
      tariff: 0.3,
      policyRate: 0.5,
      regulation: 0.15,
      envRegulation: 0.15,
      cleanPriority: 0.2,
      immigration: 0.2,
      pressFreedom: 0.2,
      surveillance: 0.2,
      conscription: 1,
    };
    for (const k of Object.keys(lag)) p[k] += lag[k] * (t[k] - p[k]);
    for (const k of BUDGET_CATS) p.budget[k] += 0.3 * (t.budget[k] - p.budget[k]);
    let s = 0;
    for (const k of BUDGET_CATS) s += p.budget[k];
    for (const k of BUDGET_CATS) p.budget[k] /= s;
    p.focus = t.focus;
  }
  warPressure(c) {
    return warPressureOf(this, c);
  }
  occupiedShare(i) {
    return MIL.occupiedShare(this, i);
  }
  cartelFactor(c) {
    const cart = this.cartelMembers || (this.cartelMembers = new Set(this.state.orgs.find((o) => o.id === 'opec')?.members || []));
    return cart.has(c.idx) ? this.state.cartel.quota : 1;
  }
  navalBlockade(arr) {
    MIL.fillBlockade(this, arr);
  }
  shiftPolicyToward(c, ideo, strength) {
    AI.shiftPolicyToward(this, c, ideo, strength);
  }
  exec(cmd) {
    return CMD.exec(this, cmd);
  }
  get player() {
    return this.state.countries[this.state.playerId];
  }
  country(id) {
    return this.state.countries[typeof id === 'number' ? id : this.geo.idOf[id]];
  }
}
export async function createSim(data, opts) {
  return new Sim(data, opts);
}
