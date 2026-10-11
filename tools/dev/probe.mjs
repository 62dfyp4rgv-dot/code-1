import { loadDataNode } from '../../app/js/sim/data.js';
import { Sim } from '../../app/js/sim/world.js';
const data = await loadDataNode();
const t0 = performance.now();
const sim = new Sim(data, { seed: 7, scenario: process.argv[2] || 'quiet_decade', player: 'USA' });
console.log('init ms', (performance.now() - t0).toFixed(0));
const cs = sim.state.countries;
const top = (n) => cs.slice().sort((a, b) => b.econ.gdp - a.econ.gdp).slice(0, n);
const fmt = (c) => `${c.id} gdp=${c.econ.gdp.toFixed(0)} gr=${(c.econ.growth * 100).toFixed(1)}% inf=${(c.econ.infl * 100).toFixed(1)}% u=${(c.econ.unemp * 100).toFixed(1)}% debt=${(c.econ.debtRatio * 100 || 0).toFixed(0)}% ca=${(c.econ.ca / c.econ.gdp * 100).toFixed(1)}% util=${c.econ.util.toFixed(3)}`;
console.log('prices', sim.state.prices.map((x) => x.toFixed(2)).join(' '));
for (const c of top(8)) console.log(fmt(c));
const months = +process.argv[3] || 24;
for (let m = 1; m <= months; m++) {
  sim.advanceMonths(1);
  if (m % 6 === 0) {
    console.log('--- month', m, 'prices', sim.state.prices.map((x) => x.toFixed(2)).join(' '), 'T', sim.state.world.temp.toFixed(3));
    for (const c of top(6)) console.log(fmt(c));
    for (const id of ['SAU', 'JPN', 'NGA', 'EGY']) console.log(fmt(sim.country(id)));
  }
}
console.log('monthly avg ms', (sim.perf.monthly / sim.perf.monthlyCount).toFixed(1));
