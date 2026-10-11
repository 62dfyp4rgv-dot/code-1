// track one country: node tools/dev/country.mjs scenario seed ISO years
import { loadDataNode } from '../../app/js/sim/data.js';
import { Sim } from '../../app/js/sim/world.js';
const data = await loadDataNode(); const [sc, seed, iso, years] = [process.argv[2], +process.argv[3], process.argv[4], +process.argv[5] || 10];
const sim = new Sim(data, { seed, scenario: sc, player: process.argv[6] || 'USA' }); if (process.argv[7]) sim.state.countries[sim.state.playerId].autoAI = true; const i = sim.geo.idOf[iso];
for (let m = 0; m < years * 12; m++) { sim.advanceMonths(1); const c = sim.state.countries[i]; if (m % 6 === 5 || (c.gov.collapses && !c._l)) console.log(sim.calendar.format(sim.state.day), 'stab', c.gov.stability.toFixed(2), 'appr', c.gov.approval.toFixed(2), 'leg', c.gov.legitimacy?.toFixed(2), 'unrest', c.gov.unrest?.toFixed(2), 'gdp g', (c.econ.growth * 100).toFixed(1), 'unemp', (c.econ.unemp * 100).toFixed(1), 'infl', (c.econ.infl * 100).toFixed(1), 'debt', ((c.econ.debtRatio ?? 0) * 100).toFixed(0), 'collapses', c.gov.collapses || 0, c.gov.type); }
