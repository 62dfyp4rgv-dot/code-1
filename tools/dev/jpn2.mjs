import { loadDataNode } from '../../app/js/sim/data.js';
import { Sim } from '../../app/js/sim/world.js';
const data = await loadDataNode(); const sim = new Sim(data, { seed: 107, scenario: 'quiet_decade', player: 'USA' }); const i = sim.geo.idOf[process.argv[2] || 'JPN'];
const pr = (c) => { const e = c.econ, p = c.pop; return [sim.calendar.format(sim.state.day), 'pop', p.total.toFixed(1), 'cohorts', JSON.stringify(p.coh?.map?.(x=>+x.toFixed?.(1)) ?? p.cohorts ?? Object.keys(p)), 'labour', e.labour?.toFixed?.(3), 'K', (e.K/e.gdp).toFixed(2), 'Y', e.gdp.toFixed(0), 'gr', (e.growth*100).toFixed(2), 'unemp', (e.unemp*100).toFixed(1), 'uNat', (e.uNat*100).toFixed(1)].join(' '); };
console.log(pr(sim.state.countries[i]));
for (let y = 0; y < 6; y++) { sim.advanceMonths(12); console.log(pr(sim.state.countries[i])); }
