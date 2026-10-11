import { loadDataNode } from '../../app/js/sim/data.js';
import { Sim } from '../../app/js/sim/world.js';
const data = await loadDataNode();
const sim = new Sim(data, { seed: 7, scenario: 'quiet_decade', player: 'USA' });
const id = process.argv[2] || 'DEU';
const e0 = sim.country(id).econ; const g0 = e0.gdp0;
console.log('init C0', (e0.C0 / g0).toFixed(3), 'Yd0', (e0.Yd0 / g0).toFixed(3), 'consK', e0.consK.toFixed(3), 'inv', (e0.inv / g0).toFixed(3), 'pubI0', (e0.pubI0 / g0).toFixed(3), 'govC0', (e0.govC0 / g0).toFixed(3), 'nx', (e0.ca0).toFixed(3), 'taxRate0', e0.taxRate0.toFixed(3), 'collect0', e0.collect0.toFixed(3), 'tariffRev0', (e0.tariff0 * e0.impVal0 / g0).toFixed(3), 'rent0', (e0.rentRev0 / g0).toFixed(3), 'interest', (e0.interest / g0).toFixed(3), 'spend0', (e0.spend0 / g0).toFixed(3));
for (let m = 1; m <= 3; m++) {
  sim.advanceMonths(1);
  const e = sim.country(id).econ;
  console.log(m, 'Yd', ((e.gni - e.taxRev - e.tariffRev - e.rentRev + (sim.country(id).spendCat.welfare) + 0.5 * sim.country(id).spendCat.subsidies + 0.7 * Math.max(0, e.interest)) / g0).toFixed(3), 'taxRev', (e.taxRev / g0).toFixed(3), 'tariffRev', (e.tariffRev / g0).toFixed(3), 'rent', (e.rentRev / g0).toFixed(3), 'int', (e.interest / g0).toFixed(3), 'spend', (e.spend / g0).toFixed(3), 'collect', e.collect.toFixed(3), 'C', (e.cons / g0).toFixed(3), 'sav', e.sav.toFixed(3), 'savBase', e.savBase.toFixed(3), 'gni', (e.gni / g0).toFixed(3), 'tot', (e.tot / g0).toFixed(3), 'pubI', (e.pubI / g0).toFixed(3), 'Ipriv', (e.Ipriv / g0).toFixed(3), 'invRate', e.invRate.toFixed(3), e.invRate0.toFixed(3));
}
