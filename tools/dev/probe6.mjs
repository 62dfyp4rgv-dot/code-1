import { loadDataNode } from '../../app/js/sim/data.js';
import { Sim } from '../../app/js/sim/world.js';
const data = await loadDataNode();
const sim = new Sim(data, { seed: 7, scenario: 'quiet_decade', player: 'USA' });
for (let m = 1; m <= 12; m++) {
  sim.advanceMonths(1);
  if (m % 4) continue;
  let pos = 0, neg = 0, gdp = 0, gdp0 = 0;
  const top = [];
  for (const c of sim.state.countries) { const e = c.econ; if (e.nxgRaw > 0) pos += e.nxgRaw; else neg -= e.nxgRaw; gdp += e.gdp; gdp0 += e.gdp0; top.push([c.id, e.nxgRaw, e.nxg0r * e.gdp0, e.gdp / e.gdp0]); }
  top.sort((a, b) => a[1] - b[1]);
  console.log(m, 'pos', pos.toFixed(0), 'neg', neg.toFixed(0), 'worldGDP', (gdp / gdp0).toFixed(3));
  console.log('  most negative', top.slice(0, 6).map((t) => `${t[0]} ${t[1].toFixed(0)} (init ${t[2].toFixed(0)}, g ${t[3].toFixed(2)})`).join('; '));
  console.log('  most positive', top.slice(-6).map((t) => `${t[0]} ${t[1].toFixed(0)} (init ${t[2].toFixed(0)}, g ${t[3].toFixed(2)})`).join('; '));
}
