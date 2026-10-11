import { loadDataNode } from '../../app/js/sim/data.js';
import { Sim } from '../../app/js/sim/world.js';
const data = await loadDataNode(); const sim = new Sim(data, { seed: +(process.argv[2]||107), scenario: process.argv[3]||'quiet_decade', player: 'USA' });
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };
const row = () => { const cs = sim.state.countries; const u = cs.map((c) => c.econ.util), g = cs.map((c) => c.econ.growth), ug = cs.map((c) => c.econ.unemp - c.econ.uNat), inf = cs.map((c) => c.econ.infl); return [sim.calendar.format(sim.state.day), 'util p10/50/90', q(u, .1).toFixed(3), q(u, .5).toFixed(3), q(u, .9).toFixed(3), 'growth med', (q(g, .5) * 100).toFixed(1), 'unemp gap med', (q(ug, .5) * 100).toFixed(1), 'infl med', (q(inf, .5) * 100).toFixed(1)].join(' '); };
for (let m = 0; m <= 120; m++) { if (m % 12 === 0) console.log(row()); sim.advanceMonths(1); }
