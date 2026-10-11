import { loadDataNode } from '../../app/js/sim/data.js';
import { Sim } from '../../app/js/sim/world.js';
const data = await loadDataNode();
const scen = process.argv[2] || 'fault_lines', seed = +process.argv[3] || 7, years = +process.argv[4] || 5, player = process.argv[5] || 'USA';
const sim = new Sim(data, { seed, scenario: scen, player });
const t0 = performance.now();
let lastWars = 0;
for (let y = 1; y <= years; y++) {
  sim.advanceMonths(12);
  const st = sim.state, cs = st.countries;
  const active = st.wars.filter((w) => w.active);
  const gdp = cs.reduce((s, c) => s + c.econ.gdp, 0);
  console.log(`y${y} wars total ${st.wars.length} active ${active.length} [${active.map((w) => w.name + ' sc ' + w.score.a.toFixed(0) + '/' + w.score.d.toFixed(0)).join('; ')}] worldGDP ${gdp.toFixed(0)} prices ${st.prices.map((x) => x.toFixed(2)).join('/')} T ${st.world.temp.toFixed(2)} pandemic ${st.pandemic ? 'yes' : 'no'} treaties ${st.treaties.filter((t) => t.active).length} sanctions ${st.sanctions.length} events ${st.events.history.length}`);
}
const st = sim.state;
console.log('ms/month', ((performance.now() - t0) / (years * 12)).toFixed(0), 'ai', (sim.perf.ai / sim.perf.monthlyCount).toFixed(0));
const kinds = {}; for (const l of st.log) kinds[l.kind] = (kinds[l.kind] || 0) + 1; console.log('log kinds', JSON.stringify(kinds));
console.log(st.log.filter((l) => ['war', 'peace', 'regime', 'election'].includes(l.kind)).slice(-25).map((l) => `${sim.calendar.format(l.day)} ${l.text}`).join('\n'));
console.log('--- all wars');
for (const w of st.wars) console.log(`${w.name} ${sim.calendar.format(w.start)} → ${w.end ? sim.calendar.format(w.end) : 'ongoing'} ${w.endReason || ''} cas ${JSON.stringify(Object.fromEntries(Object.entries(w.cas).map(([k, v]) => [st.countries[k].id, Math.round(v)])))} score ${w.score.a.toFixed(0)}/${w.score.d.toFixed(0)}`);
