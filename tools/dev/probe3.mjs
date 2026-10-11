import { loadDataNode } from '../../app/js/sim/data.js';
import { Sim } from '../../app/js/sim/world.js';
const data = await loadDataNode();
const sim = new Sim(data, { seed: 7, scenario: 'quiet_decade', player: 'USA' });
const ids = process.argv.slice(2);
console.log('cal', JSON.stringify(sim.cal));
for (const id of ids) {
  const e = sim.country(id).econ;
  console.log(id, 'gdp', e.gdp0.toFixed(0), 'prod', e.prod.map((x) => x.toFixed(0)).join('/'), 'dem0', e.dem0.map((x) => x.toFixed(0)).join('/'), 'net(exp-imp)', [0,1,2,3].map(k=>(e.exports[k]-e.imports[k]).toFixed(0)).join('/'), 'resNX0%', (e.resNX0 / e.gdp0 * 100).toFixed(1), 'ca0%', (e.ca0 * 100).toFixed(1), 'nxg0r%', (e.nxg0r * 100).toFixed(1));
}
let tot = [0,0,0,0]; for (const c of sim.state.countries) for (let k=0;k<4;k++) tot[k]+=c.econ.dem0[k]; console.log('world dem0', tot.map(x=>x.toFixed(0)).join('/'));
