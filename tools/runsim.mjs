import { loadDataNode } from '../app/js/sim/data.js';
import { Sim } from '../app/js/sim/world.js';
const data = await loadDataNode();
const sim = new Sim(data, { seed: +process.argv[3] || 7, scenario: process.argv[2] || 'fault_lines', player: 'USA' });
const months = +process.argv[4] || 12;
const t0 = performance.now();
sim.advanceMonths(months);
console.log('months', months, 'ms/month', ((performance.now() - t0) / months).toFixed(0), 'monthly', (sim.perf.monthly / sim.perf.monthlyCount).toFixed(0), 'ai', (sim.perf.ai / sim.perf.monthlyCount).toFixed(0), 'daily', (sim.perf.daily / months).toFixed(0));
console.log('wars', sim.state.wars.filter((w) => w.active).map((w) => w.name).join('; '));
