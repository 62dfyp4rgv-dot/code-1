import { loadDataNode } from '../../app/js/sim/data.js';
import { Sim } from '../../app/js/sim/world.js';
const data = await loadDataNode();
const sim = new Sim(data, { seed: +process.argv[3] || 7, scenario: process.argv[2] || 'quiet_decade', player: 'USA' });
const years = +process.argv[4] || 6;
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };
const gdp0 = sim.state.countries.map((c) => c.econ.gdp);
let prev = gdp0.slice();
for (let y = 1; y <= years; y++) {
  sim.advanceMonths(12);
  const cs = sim.state.countries;
  const gr = cs.map((c, i) => Math.log(c.econ.gdp / prev[i]));
  prev = cs.map((c) => c.econ.gdp);
  const inf = cs.map((c) => c.econ.infl), un = cs.map((c) => c.econ.unemp), ut = cs.map((c) => c.econ.util), dr = cs.map((c) => c.econ.debtRatio);
  const wg = Math.log(cs.reduce((s, c) => s + c.econ.gdp, 0) / prev.reduce((s, v) => s + v, 0) );
  const tot = cs.reduce((s, c) => s + c.econ.gdp, 0), tot0 = gdp0.reduce((s, v) => s + v, 0);
  console.log(`y${y} worldGDP ${(tot / tot0).toFixed(3)} | growth p10/50/90 ${(q(gr, 0.1) * 100).toFixed(1)}/${(q(gr, 0.5) * 100).toFixed(1)}/${(q(gr, 0.9) * 100).toFixed(1)} | infl ${(q(inf, 0.1) * 100).toFixed(1)}/${(q(inf, 0.5) * 100).toFixed(1)}/${(q(inf, 0.9) * 100).toFixed(1)} max ${(Math.max(...inf) * 100).toFixed(0)} | unemp ${(q(un, 0.1) * 100).toFixed(1)}/${(q(un, 0.5) * 100).toFixed(1)}/${(q(un, 0.9) * 100).toFixed(1)} | util min/max ${Math.min(...ut).toFixed(2)}/${Math.max(...ut).toFixed(2)} | debt p50/max ${(q(dr, 0.5) * 100).toFixed(0)}/${(Math.max(...dr) * 100).toFixed(0)} | prices ${sim.state.prices.map((x) => x.toFixed(2)).join('/')}`);
}
const cs = sim.state.countries;
const bad = cs.filter((c) => c.econ.util < 0.88 || c.econ.util > 1.06 || c.econ.infl > 0.2).map((c) => `${c.id}(u${c.econ.util.toFixed(2)},i${(c.econ.infl * 100).toFixed(0)}%)`);
console.log('outliers:', bad.join(' ') || 'none');
console.log('avg monthly ms', (sim.perf.monthly / sim.perf.monthlyCount).toFixed(1));
