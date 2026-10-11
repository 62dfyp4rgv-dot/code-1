import { loadDataNode } from '../app/js/sim/data.js';
import { Sim } from '../app/js/sim/world.js';
const data = await loadDataNode();
const sim = new Sim(data, { seed: 7, scenario: 'quiet_decade', player: 'USA' });
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['USA', 'IND'];
for (let m = 0; m < 5; m++) {
  sim.advanceMonths(1);
  for (const id of ids) {
    const e = sim.country(id).econ;
    console.log(m + 1, id, 'pot/g0', (e.gdpPot / e.gdp0).toFixed(3), 'gdp/g0', (e.gdp / e.gdp0).toFixed(3), 'util', e.util.toFixed(3), 'C', (e.cons / e.gdp0).toFixed(3), 'C0', (e.C0 / e.gdp0).toFixed(3), 'I', (e.inv / e.gdp0).toFixed(3), 'G', (e.govC / e.gdp0).toFixed(3), 'G0', (e.govC0 / e.gdp0).toFixed(3), 'NX', ((e.exp - e.imp) / e.gdp0).toFixed(3), 'nxg', (e.nxg / e.gdp0).toFixed(3), 'sav', e.sav.toFixed(3), 'savB', e.savBase.toFixed(3), 'dInv', (e.dInv / e.gdp0).toFixed(3));
  }
}
