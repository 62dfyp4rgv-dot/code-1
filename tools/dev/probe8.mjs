import { loadDataNode } from '../../app/js/sim/data.js';
import { Sim } from '../../app/js/sim/world.js';
const data = await loadDataNode();
const sim = new Sim(data, { seed: 7, scenario: 'quiet_decade', player: 'USA' });
for (let y = 1; y <= 6; y++) {
  sim.advanceMonths(12);
  const cs = sim.state.countries; const w = sim.worldTrade;
  let prodMin = 0, depl = 0, n = 0, indSum = 0, K = 0; for (const c of cs) { prodMin += c.econ.prod[3]; if (c.econ.Y0s && c.econ.Y0s[4] > 0) { depl += c.econ.depl[2]; n++; } indSum += c.econ.Y[1]; K += c.econ.K[4]; }
  console.log('y' + y, 'minerals sup', w.supply[3].toFixed(0), 'dem', w.demand[3].toFixed(0), 'unmet', w.unmet[3].toFixed(0), 'p', sim.state.prices[3].toFixed(2), 'avg depl', (depl / n).toFixed(3), 'world industry', indSum.toFixed(0), 'mining K', K.toFixed(0), 'cover', (w.stock[3] / w.demand[3]).toFixed(3));
}
