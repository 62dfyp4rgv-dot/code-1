import { loadDataNode } from '../../app/js/sim/data.js';
import { Sim } from '../../app/js/sim/world.js';
const data = await loadDataNode();
const [sc, seed, player, from] = [process.argv[2], +process.argv[3], process.argv[4], +process.argv[5]];
const sim = new Sim(data, { seed, scenario: sc, player });
sim.advanceMonths(from);
for (let d = 0; d < 400; d++) { const t = performance.now(); process.stdout.write(`day ${sim.state.day} ${sim.calendar.format(sim.state.day)}\n`); sim.step(); const dt = performance.now() - t; if (dt > 500) console.log('slow day', dt); }
