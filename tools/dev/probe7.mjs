import { loadDataNode } from '../../app/js/sim/data.js';
import { Sim } from '../../app/js/sim/world.js';
const data = await loadDataNode();
const sim = new Sim(data, { seed: 7, scenario: 'quiet_decade', player: 'USA' });
const names = ['food', 'oil', 'gas', 'minerals'];
for (let y = 1; y <= 8; y++) {
  sim.advanceMonths(12);
  const w = sim.worldTrade;
  console.log('y' + y, names.map((n, k) => `${n}: sup ${w.supply[k].toFixed(0)} dem ${w.demand[k].toFixed(0)} unmet ${w.unmet[k].toFixed(0)} curt ${w.curtail[k].toFixed(0)} stock ${w.stock[k].toFixed(0)} p ${sim.state.prices[k].toFixed(2)}`).join(' | '));
}
