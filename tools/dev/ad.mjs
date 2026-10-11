import { loadDataNode } from '../../app/js/sim/data.js';
import { Sim } from '../../app/js/sim/world.js';
const data = await loadDataNode(); const sim = new Sim(data, { seed: 107, scenario: 'quiet_decade', player: 'USA' });
const isos = process.argv.slice(2);
for (let m = 0; m < 30; m++) { sim.advanceMonths(1); if (m % 3 !== 2) continue; for (const iso of isos) { const c = sim.state.countries[sim.geo.idOf[iso]], e = c.econ; console.log(sim.calendar.format(sim.state.day), iso, 'gdp', e.gdp.toFixed(0), 'pot', e.gdpPot.toFixed(0), 'util', e.util.toFixed(3), 'C', (e.cons/e.gdp0).toFixed(3), 'I', (e.inv/e.gdp0).toFixed(3), 'G', (e.govC/e.gdp0).toFixed(3), 'NX', ((e.exp-e.imp)/e.gdp0).toFixed(3), 'dInv', (e.dInv/e.gdp0).toFixed(3), 'infl', (e.infl*100).toFixed(1), 'Yd?', e.Yd?.toFixed?.(0), 'rr', ((c.policy.policyRate-e.inflExp)*100).toFixed(1)); } }
