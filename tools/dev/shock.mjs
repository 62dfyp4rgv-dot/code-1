import { loadDataNode } from '../../app/js/sim/data.js';
import { Sim } from '../../app/js/sim/world.js';
const data = await loadDataNode(); const sim = new Sim(data, { seed: +process.argv[2], scenario: process.argv[3], player: 'USA' });
sim.advanceMonths(+process.argv[4]);
for (let m = 0; m < 24; m++) { sim.advanceMonths(1); const st = sim.state; const inf = st.countries.map((c) => c.econ.infl).sort((a, b) => a - b); console.log(sim.calendar.format(st.day), 'prices', Array.from(st.prices).map((x) => x.toFixed(2)).join(','), 'medInfl', (inf[inf.length >> 1] * 100).toFixed(1), 'closed', JSON.stringify(st.chokepoints?.filter?.((c) => c.closed || c.state === 'closed').map((c) => c.id) ?? ''), 'wars', st.wars.filter((w) => w.active).map((w) => w.name).join('|')); }
const ev = sim.state.events.history.slice(-15).map((h) => h.id + '@' + sim.calendar.format(h.day)); console.log(ev.join(' '));
