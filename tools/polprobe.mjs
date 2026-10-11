import { loadDataNode } from '../app/js/sim/data.js';
import { Sim } from '../app/js/sim/world.js';
const data = await loadDataNode();
const sim = new Sim(data, { seed: 7, scenario: 'quiet_decade', player: 'USA' });
const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(p * (s.length - 1))]; };
for (let y = 1; y <= 5; y++) {
  sim.advanceMonths(12);
  const cs = sim.state.countries;
  const st = cs.map((c) => c.gov.stability), ap = cs.map((c) => c.gov.approval), un = cs.map((c) => c.gov.unrest), lg = cs.map((c) => c.gov.legitimacy);
  console.log(`y${y} stab ${[0.05, 0.25, 0.5, 0.75, 0.95].map((p) => q(st, p).toFixed(2)).join('/')} appr ${[0.05, 0.25, 0.5, 0.75, 0.95].map((p) => q(ap, p).toFixed(2)).join('/')} unrest ${[0.05, 0.5, 0.95].map((p) => q(un, p).toFixed(2)).join('/')} legit ${[0.05, 0.5, 0.95].map((p) => q(lg, p).toFixed(2)).join('/')} collapses ${cs.reduce((s, c) => s + c.gov.collapses, 0)}`);
}
const c = sim.country(process.argv[2] || 'JPN');
console.log(c.id, 'stab', c.gov.stability.toFixed(2), 'appr', c.gov.approval.toFixed(2), 'unrest', c.gov.unrest.toFixed(2), 'legit', c.gov.legitimacy.toFixed(2), 'real inc growth', c.econ.realIncGrowth.toFixed(3), 'unemp', c.econ.unemp.toFixed(3), 'infl', c.econ.infl.toFixed(3), 'type', c.gov.type, 'ideoGap?');
