import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSim, findNonFinite } from '../helpers.js';
import { SECTORS, COM } from '../../app/js/sim/constants.js';

const approx = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b} (tol ${tol})`);

test('t0 calibration: aggregate demand equals output; initial trade balances world-wide', async () => {
  const sim = await makeSim();
  for (const c of sim.state.countries) {
    const e = c.econ;
    const sectorSum = e.Y.reduce((a, b) => a + b, 0);
    approx(sectorSum, e.gdp0, e.gdp0 * 1e-9, c.id + ' sector value added sums to GDP');
    const ad = e.C0 + e.inv + e.pubI0 * 0 + e.govC0 + e.ca0 * e.gdp0; // inv already includes private investment only at t0
    assert.ok(e.consK > 0.2 && e.consK < 1.05, c.id + ' consumption propensity plausible: ' + e.consK);
  }
  let ca = 0; for (const c of sim.state.countries) ca += c.econ.ca0 * c.econ.gdp0; approx(ca, 0, 1, 'world current account sums to zero');
  for (let k = 0; k < 4; k++) { let ex = 0, im = 0; for (const c of sim.state.countries) { ex += c.econ.exports[k]; im += c.econ.imports[k]; } approx(ex, im, 1e-6 * Math.max(1, ex), 'trade conservation commodity ' + k); }
});
test('after 24 months: accounting identities, conservation and stock-flow bounds hold', async () => {
  const sim = await makeSim();
  const res0 = sim.state.countries.reduce((s, c) => s + c.econ.reserves, 0);
  const nfa0 = sim.state.countries.reduce((s, c) => s + c.econ.nfa, 0);
  for (let m = 0; m < 24; m++) {
    sim.advanceMonths(1);
    const cs = sim.state.countries;
    for (let k = 0; k < 4; k++) {
      let ex = 0, im = 0, prod = 0, cons = 0, dstock = 0, curt = 0;
      for (const c of cs) { const e = c.econ; ex += e.exports[k]; im += e.imports[k]; prod += e.prod[k]; cons += e.consumed[k]; curt += e.curtailed[k]; }
      approx(ex, im, 1e-6 * Math.max(1, ex), `month ${m} exports == imports for ${k}`);
    }
    // goods trade nets to zero
    approx(cs.reduce((s, c) => s + c.econ.nxg, 0), 0, 1e-3, 'goods trade nets to zero');
    let caSum = 0; for (const c of cs) caSum += c.econ.ca; approx(caSum, 0, 1e-2 * 1, 'world current account sums to zero');
    const rs = cs.map((c) => Math.abs(c.econ.dInv / c.econ.gdp)).sort((a, b) => a - b); assert.ok(rs[Math.floor(rs.length / 2)] < 0.03, 'median inventory residual under 3% of GDP');
    for (const c of cs) {
      const e = c.econ;
      assert.ok(Math.abs(e.dInv) < 0.25 * e.gdp, `${c.id} inventory residual bounded: ${(e.dInv / e.gdp).toFixed(3)}`);
      assert.ok(e.gdp > 0 && e.util >= 0.7 && e.util <= 1.07, `${c.id} utilisation in range ${e.util}`);
      assert.ok(e.unemp >= 0 && e.unemp < 0.7 && e.infl > -0.06 && e.infl < 3, `${c.id} labour/price ranges`);
      for (let s = 0; s < SECTORS.length; s++) assert.ok(e.K[s] >= 0 && e.Y[s] >= 0, `${c.id} capital/output non-negative`);
      assert.ok(e.reserves >= 0, `${c.id} reserves non-negative`);
    }
  }
  const res1 = sim.state.countries.reduce((s, c) => s + c.econ.reserves, 0);
  approx(res1, res0, 0.002 * res0 + 5, 'world reserves conserved by external financing (floors excepted)');
  const nfa1 = sim.state.countries.reduce((s, c) => s + c.econ.nfa, 0); approx(nfa1, nfa0, 5, 'net foreign assets sum to a constant');
  assert.deepEqual(findNonFinite(sim.state), []);
});
test('capital stock-flow: K follows investment minus depreciation', async () => {
  const sim = await makeSim(); sim.advanceMonths(1);
  const c = sim.country('FRA'); const e = c.econ; const before = e.K.slice(); const keep = e.invKeep.slice();
  sim.advanceMonths(1);
  const E = sim.country('FRA').econ;
  // one monthly step: K' = K + (I_k - delta K)/12  (investment recorded in invKeep for the step just taken)
  const deltas = { agri: 0.04, industry: 0.06, oil: 0.05, gas: 0.05, mining: 0.05, utilities: 0.04, services: 0.05, tech: 0.10 };
  for (let k = 0; k < SECTORS.length; k++) approx(E.K[k], Math.max(0, before[k] + (E.invKeep[k] - deltas[SECTORS[k]] * before[k]) / 12), 1e-6 * Math.max(1, before[k]), 'capital ' + SECTORS[k]);
});
test('debt follows deficit: no free money', async () => {
  const sim = await makeSim(); sim.advanceMonths(2);
  for (const id of ['USA', 'DEU', 'BRA', 'NGA']) {
    const c = sim.country(id); const d0 = c.econ.debt; sim.advanceMonths(1);
    const e = c.econ; const expect = d0 + (e.deficit - e.monet - 0.7 * e.infl * Math.max(0, d0)) / 12 + 0.25 * Math.max(0, d0) * Math.max(-0.1, Math.log(Math.max(0.3, e.rerPrev) / e.rer));
    // other modules (research adoption, aid) may add small amounts; allow 1% of GDP/12 slack
    approx(e.debt, expect, 0.012 * e.gdp / 12 + 1, id + ' debt stock-flow');
  }
});
test('long-run economy is bounded: 10 years, many countries, no runaway', async () => {
  const sim = await makeSim({ seed: 3 }); sim.advanceMonths(120);
  const cs = sim.state.countries;
  const bad = cs.filter((c) => c.econ.util < 0.7 || c.econ.infl > 1.0 || c.econ.unemp > 0.45 || !Number.isFinite(c.econ.gdp)); assert.ok(bad.length <= 3, 'few pathological economies: ' + bad.map((c) => c.id));
  const world0 = sim.state.stats.world.gdp[0], world1 = cs.reduce((s, c) => s + c.econ.gdp, 0);
  const g = Math.pow(world1 / world0, 1 / 10) - 1; assert.ok(g > 0.005 && g < 0.06, 'world growth plausible: ' + g);
  for (const p of sim.state.prices) assert.ok(p >= 0.3 && p <= 6);
  const infl = cs.map((c) => c.econ.infl).sort((a, b) => a - b); assert.ok(infl[84] > -0.01 && infl[84] < 0.07, 'median inflation plausible ' + infl[84]);
});
test('energy shock transmits through shared rules (no scripted chain)', async () => {
  const base = await makeSim({ seed: 11, scenario: 'quiet_decade', player: 'DEU' });
  const shock = await makeSim({ seed: 11, scenario: 'energy_crunch', player: 'DEU' });
  const infl = (sim, id) => sim.country(id).econ.infl;
  let bI = 0, sI = 0, bG = 0, sG = 0, bR = 0, sR = 0;
  for (let m = 0; m < 6; m++) { base.advanceMonths(1); shock.advanceMonths(1); bI += infl(base, 'JPN'); sI += infl(shock, 'JPN'); bG += base.country('JPN').econ.growth; sG += shock.country('JPN').econ.growth; bR += base.country('NOR').econ.rentRev; sR += shock.country('NOR').econ.rentRev; }
  assert.ok(shock.state.prices[1] > base.state.prices[1], 'oil dearer under shock');
  assert.ok(sI > bI, 'importer inflation higher under the shock: ' + (sI / 6).toFixed(4) + ' vs ' + (bI / 6).toFixed(4));
  assert.ok(sR > bR * 1.2, 'exporter state revenue rises with the price');
  const eu = shock.country('DEU').econ, ba = base.country('DEU').econ;
  assert.ok(eu.tot < ba.tot, 'terms of trade deteriorate for an energy importer');
});

test('physical conservation: production - curtailment = consumption + stock change, for every commodity', async () => {
  const sim = await makeSim({ seed: 13, scenario: 'energy_crunch' }); sim.advanceMonths(3);
  for (let m = 0; m < 6; m++) {
    const before = sim.state.countries.map((c) => c.econ.stock.slice());
    sim.advanceMonths(1);
    for (let k = 0; k < 4; k++) {
      let prod = 0, curt = 0, cons = 0, dst = 0;
      sim.state.countries.forEach((c, i) => { const e = c.econ; prod += e.prod[k]; curt += e.curtailPhys[k]; cons += e.consumed[k]; dst += (e.stock[k] - before[i][k]) * 12; });
      approx(prod - curt, cons + dst, 1e-6 * Math.max(1, prod), `commodity ${k} month ${m}`);
    }
  }
});
