import { loadDataNode } from '../../app/js/sim/data.js';
import { Sim } from '../../app/js/sim/world.js';
const data = await loadDataNode();
const sim = new Sim(data, { seed: +process.argv[3] || 107, scenario: process.argv[2] || 'fault_lines', player: 'USA' });
for (let y = 1; y <= (+process.argv[4] || 6); y++) { const t = performance.now(); sim.advanceMonths(12); console.log('year', y, ((performance.now() - t) / 12).toFixed(0), 'ms/month', 'treaties', sim.state.treaties.length, 'log', sim.state.log.length, 'forces', sim.state.forces.length, 'wars', sim.state.wars.length, 'mods', sim.state.countries.reduce((s, c) => s + c.mods.length, 0)); }
