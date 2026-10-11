import { loadDataNode } from '../app/js/sim/data.js';
import { Sim } from '../app/js/sim/world.js';
const data = await loadDataNode();
const sim = new Sim(data, { seed: 7, scenario: 'quiet_decade', player: 'USA' });
const id = process.argv[2] || 'DEU'; const months = +process.argv[3] || 24; const step = +process.argv[4] || 3;
for (let m = 1; m <= months; m++) {
  sim.advanceMonths(1);
  if (m % step) continue;
  const e = sim.country(id).econ, g0 = e.gdp0;
  const f = (x) => (x / g0).toFixed(3);
  console.log(m, 'pr', sim.state.prices.map((x) => x.toFixed(2)).join('/'), 'pot', f(e.gdpPot), 'gdp', f(e.gdp), 'util', e.util.toFixed(3), 'C', f(e.cons), 'I', f(e.inv), 'G', f(e.govC), 'nxg', f(e.nxg), 'resNX', f(e.exports.reduce((a, b, k) => a + b - e.imports[k], 0)), 'sav', e.sav.toFixed(3), 'rr', (sim.country(id).policy.policyRate - e.inflExp).toFixed(3), 'infl', e.infl.toFixed(3), 'pol', sim.country(id).policy.policyRate.toFixed(3), 'short', e.shortage.map((x) => x.toFixed(2)).join('/'), 'rer', e.rer.toFixed(3), 'defi', (e.deficit / g0).toFixed(3), 'Yd?', f(e.gni - e.taxRev - e.tariffRev - e.rentRev));
}
