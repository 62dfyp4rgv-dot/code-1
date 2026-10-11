import { loadDataNode } from '../app/js/sim/data.js';
import { Sim } from '../app/js/sim/world.js';
const data = await loadDataNode();
const sim = new Sim(data, { seed: 7, scenario: 'fault_lines', player: 'USA' });
// time each yield-slice of a month step
const slices = [];
for (let m = 0; m < 18; m++) {
  let target = sim.state.day; // advance to the day before next month start
  while (!sim.calendar.isMonthStart(sim.state.day + 1)) sim.step();
  const gen = sim.stepGen(); let k = 0;
  for (;;) { const t = performance.now(); const r = gen.next(); const dt = performance.now() - t; slices.push([k++, dt]); if (r.done) break; }
}
const by = new Map(); for (const [k, dt] of slices) { if (!by.has(k)) by.set(k, []); by.get(k).push(dt); }
for (const [k, v] of [...by].sort((a, b) => a[0] - b[0])) console.log('slice', k, 'avg', (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1), 'max', Math.max(...v).toFixed(1));
