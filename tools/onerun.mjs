import { loadDataNode } from '../app/js/sim/data.js';
import { Sim } from '../app/js/sim/world.js';
const data = await loadDataNode();
const [sc, seed, player, years] = [process.argv[2], +process.argv[3], process.argv[4], +process.argv[5] || 10];
const sim = new Sim(data, { seed, scenario: sc, player });
for (let y = 1; y <= years; y++) { const t = performance.now(); sim.advanceMonths(12); console.log(sc, seed, player, 'year', y, ((performance.now() - t) / 12).toFixed(0), 'ms/month', sim.calendar.format(sim.state.day)); }
