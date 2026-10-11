// World commodity market. Four traded commodities (food, oil, gas, minerals). Physical flows are cleared bilaterally
// through an iterative proportional allocation over an access matrix (distance, blocs, embargoes, war, chokepoints, blockades).
// Conservation (tested): for each commodity, sum(exports) == sum(imports); and
//   sum(prod - curtailed) == sum(consumption) + sum(stock change)   [flows are annual rates; stocks in annual-rate units]
import { COMMODITIES, COM, clamp } from './constants.js';
import { commodityDemand } from './economy.js';
import { modv } from './mods.js';

const D0 = [5000, 8000, 4000, 8000]; // distance scale (km) per commodity
const PASSES = 4;

export function buildTradeStatic(sim) {
  const { geo } = sim; const N = geo.N;
  const A = COMMODITIES.map(() => new Float32Array(N * N));
  for (let k = 0; k < 4; k++) for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (i === j) continue;
    let a = 1 / (1 + geo.dist[i * N + j] / D0[k]);
    if (geo.landNeighbors[i].has(j)) a *= k === COM.gas ? 1.7 : 1.25;
    A[k][i * N + j] = a;
  }
  sim.tradeA = A;
}

// per-pair dynamic multiplier for commodity k (importer i, exporter j)
function pairFactor(sim, i, j, k, ctx) {
  const st = sim.state;
  let f = 1;
  if (ctx.blocMult[i * ctx.N + j]) f *= ctx.blocMult[i * ctx.N + j];
  if (ctx.embargo[i * ctx.N + j] & (1 << k)) return 0;
  if (ctx.atWar[i * ctx.N + j]) return 0;
  for (const cp of ctx.chokes) {
    if (cp.open >= 0.999) continue;
    if (cp.commodities.has(k) && cp.uses(i, j)) f *= 1 - cp.share * (1 - cp.open);
  }
  f *= (1 - 0.8 * ctx.blockade[i]) * (1 - 0.8 * ctx.blockade[j]);
  return f;
}

export function buildTradeContext(sim) {
  const { geo, state } = sim; const N = geo.N;
  const blocMult = new Float32Array(N * N), embargo = new Uint8Array(N * N), atWar = new Uint8Array(N * N);
  // trade blocs and agreements
  for (const org of state.orgs) {
    if (org.type !== 'trade_bloc') continue;
    for (const a of org.members) for (const b of org.members) if (a !== b) blocMult[a * N + b] = Math.max(blocMult[a * N + b], 1.3);
  }
  for (const t of state.treaties) {
    if (!t.active) continue;
    if (t.type === 'trade_agreement') { const [a, b] = t.parties; blocMult[a * N + b] = Math.max(blocMult[a * N + b], 1.3); blocMult[b * N + a] = Math.max(blocMult[b * N + a], 1.3); }
    if (t.type === 'alliance' || t.type === 'defense_pact') { const [a, b] = t.parties; for (const [x, y] of [[a, b], [b, a]]) blocMult[x * N + y] = Math.max(blocMult[x * N + y], 1.1); }
  }
  for (const s of state.sanctions) {
    // sanction: sanctioner imposes on target: both directions restricted for the listed commodities (mask)
    embargo[s.by * N + s.target] |= s.mask; embargo[s.target * N + s.by] |= s.mask;
    for (const m of s.coalition || []) { embargo[m * N + s.target] |= s.mask; embargo[s.target * N + m] |= s.mask; }
  }
  for (const w of state.wars) {
    if (!w.active) continue;
    for (const a of w.attackers) for (const b of w.defenders) { atWar[a * N + b] = 1; atWar[b * N + a] = 1; }
  }
  const blockade = new Float32Array(N);
  if (sim.navalBlockade) sim.navalBlockade(blockade);
  const chokes = state.chokes.map((cp) => {
    const def = sim.chokeDefs[cp.id];
    return {
      id: cp.id, open: cp.open, share: def.share, commodities: new Set(def.commodities.map((x) => COM[x])),
      uses: def.uses, exporterSet: def.exporterSet,
    };
  });
  return { N, blocMult, embargo, atWar, blockade, chokes };
}

export function clearTrade(sim, { commitStocks = true } = {}) {
  const { geo, state } = sim; const N = geo.N; const cs = state.countries;
  const ctx = buildTradeContext(sim);
  const prices = state.prices;
  const world = { unmet: [0, 0, 0, 0], curtail: [0, 0, 0, 0], supply: [0, 0, 0, 0], demand: [0, 0, 0, 0], stock: [0, 0, 0, 0], traded: [0, 0, 0, 0] };
  // demand
  const dem = cs.map((c) => commodityDemand(sim, c));
  for (let k = 0; k < 4; k++) {
    const need = new Float64Array(N), cap = new Float64Array(N), rem = new Float64Array(N), imp = new Float64Array(N), expo = new Float64Array(N);
    const refill = new Float64Array(N);
    const sup = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const c = cs[i], e = c.econ;
      let s = e.prod[k];
      if (k === COM.oil) s *= 1; // cartel quota already applied in production
      sup[i] = s;
      const d = dem[i][k];
      const room = Math.max(0, e.stockCap[k] * 0.6 - e.stock[k]);
      refill[i] = prices[k] < 1.6 ? Math.min(0.5 * room, 0.06 * d) : 0;
      const shortfall = Math.max(0, d - s);
      // importers reduce purchasing if they cannot afford: reserves-limited
      const importValue = (shortfall + refill[i]) * prices[k];
      const aff = e.reserves <= 0.01 * e.gdp && e.ca < 0 ? 0.6 : 1;
      need[i] = (shortfall + refill[i]) * aff * (1 - 0.0);
      cap[i] = d * (0.8 + 0.5 * e.infra) * (1 - 0.8 * ctx.blockade[i]);
      need[i] = Math.min(need[i], Math.max(cap[i], 0), 0.22 * e.gdp / Math.max(0.3, prices[k])); // a country cannot buy more than ~22% of GDP of one commodity
      rem[i] = Math.max(0, s - d); // exportable surplus
      if (rem[i] > 0 && sup[i] > 0 && c.gov.type === 'military' && false) rem[i] = 0;
    }
    const blocked = new Float64Array(N);
    for (const cp of ctx.chokes) if (cp.exporterSet && cp.open < 0.999 && cp.commodities.has(k)) for (const j of cp.exporterSet) { const cut = rem[j] * cp.share * (1 - cp.open); rem[j] -= cut; blocked[j] += cut; }
    const resid = need.slice();
    const flows = []; // [i,j,qty]
    const A = sim.tradeA[k];
    for (let pass = 0; pass < PASSES; pass++) {
      // requests
      const req = new Float64Array(N); const pend = [];
      for (let i = 0; i < N; i++) {
        if (resid[i] <= 1e-9) continue;
        let wsum = 0; const ws = [];
        for (let j = 0; j < N; j++) {
          if (rem[j] <= 1e-9 || i === j) continue;
          const w = A[i * N + j] * pairFactor(sim, i, j, k, ctx) * rem[j];
          if (w > 0) { ws.push([j, w]); wsum += w; }
        }
        if (!wsum) continue;
        for (const [j, w] of ws) { const q = (resid[i] * w) / wsum; pend.push([i, j, q]); req[j] += q; }
      }
      if (!pend.length) break;
      for (const [i, j, q] of pend) {
        const scale = req[j] > rem[j] ? rem[j] / req[j] : 1;
        const f = q * scale;
        if (f <= 0) continue;
        flows.push([i, j, f]); imp[i] += f; expo[j] += f; resid[i] -= f;
      }
      for (let j = 0; j < N; j++) rem[j] = Math.max(0, rem[j] - Math.min(req[j], rem[j]));
    }
    sim.lastFlows[k] = flows;
    // settle stocks & shortages
    let sumUnmet = 0, sumCurt = 0, sumSup = 0, sumDem = 0, sumStock = 0, traded = 0;
    for (let i = 0; i < N; i++) {
      const e = cs[i].econ, d = dem[i][k], s = sup[i];
      const importsForUse = Math.max(0, imp[i] - refill[i]); // refill goes to stock first
      const refillGot = Math.min(imp[i], refill[i]);
      const avail = s - expo[i] + imp[i]; // domestic supply net of exports plus imports (annual rate)
      let consume = Math.min(d, avail);
      let sh = d - consume; // gap before stock draw
      const draw = Math.min(sh, e.stock[k] * 12); // stock may cover for one month at annual-rate scale
      consume += draw; sh -= draw;
      let toStock = avail - Math.min(d, avail) - 0; // surplus beyond consumption goes to stock (if any)
      if (avail > d) toStock = avail - d; else toStock = 0;
      let curtailed = 0;
      const newStock = e.stock[k] + (toStock - draw) / 12;
      if (newStock > e.stockCap[k]) { curtailed = (newStock - e.stockCap[k]) * 12; }
      // curtailment can only come from domestic production
      curtailed = Math.min(curtailed, Math.max(0, s - expo[i]));
      if (commitStocks) {
        e.stock[k] = clamp(e.stock[k] + (toStock - draw - curtailed) / 12, 0, e.stockCap[k] + 1e-9);
      }
      e.imports[k] = imp[i]; e.exports[k] = expo[i];
      e.shortage[k] = d > 1e-9 ? clamp(sh / d, 0, 1) : 0;
      e.cons = e.cons; e.dem[k] = d; e.curtailed = e.curtailed || [0, 0, 0, 0]; e.curtailed[k] = curtailed; e.consumed = e.consumed || [0, 0, 0, 0]; e.consumed[k] = consume;
      e.unmet = e.unmet || [0, 0, 0, 0]; e.unmet[k] = sh;
      e.curtailPhys = e.curtailPhys || [0, 0, 0, 0]; e.curtailPhys[k] = curtailed;
      curtailed = Math.max(0, curtailed - blocked[i]); // supply physically blocked in a closed lane is not 'surplus' to the market
      e.curtailed[k] = curtailed;
      sumUnmet += sh; sumCurt += curtailed; sumSup += s; sumDem += d; sumStock += e.stock[k]; traded += expo[i];
    }
    world.unmet[k] = sumUnmet; world.curtail[k] = sumCurt; world.supply[k] = sumSup; world.demand[k] = sumDem; world.stock[k] = sumStock; world.traded[k] = traded;
  }
  // prices
  if (commitStocks) {
    for (let k = 0; k < 4; k++) {
      const um = world.unmet[k] / Math.max(1e-9, world.supply[k]);
      const cu = world.curtail[k] / Math.max(1e-9, world.supply[k]);
      const cover = world.stock[k] / Math.max(1e-9, world.demand[k]);
      const normalCover = sim.cal.normalCover[k];
      const lp = Math.log(prices[k]);
      let d = 0.9 * um - 0.7 * cu + 0.04 * (normalCover - cover) - 0.03 * lp;
      // supply-side long-run response is handled by investment (economy.js); here only market tightness
      state.prices[k] = clamp(Math.exp(lp + clamp(d, -0.12, 0.2)), 0.35, 6);
    }
  }
  sim.worldTrade = world;
  return world;
}
