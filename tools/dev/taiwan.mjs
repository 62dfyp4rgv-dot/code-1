import { loadDataNode } from '../../app/js/sim/data.js';
import { Sim } from '../../app/js/sim/world.js';
const data = await loadDataNode();
const [sc, seed, player] = [process.argv[2], +process.argv[3], process.argv[4]];
const sim = new Sim(data, { seed, scenario: sc, player });
const seen = new Set();
for (let d = 0; d < 3650; d++) { sim.step(); for (const w of sim.state.wars) { if (!seen.has(w.id)) { seen.add(w.id); console.log('WAR', sim.calendar.format(sim.state.day), w.name, JSON.stringify({a:w.sideA?.length ?? w.attackers, b:w.sideB?.length ?? w.defenders})); } if (w.end && !w._p) { w._p = 1; console.log('END', sim.calendar.format(sim.state.day), w.name, w.endReason, 'start', sim.calendar.format(w.start)); } } if (seen.size >= 3 && d > 800) break; }
