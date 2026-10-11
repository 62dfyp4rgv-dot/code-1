// war frequency by pair over many seeds: node tools/dev/warfreq.mjs scenario seeds years
import { loadDataNode } from '../../app/js/sim/data.js';
import { Sim } from '../../app/js/sim/world.js';
const data = await loadDataNode(); const [sc, n, years] = [process.argv[2], +process.argv[3], +process.argv[4]];
const cnt = new Map(); let dur = [];
for (let s = 1; s <= n; s++) { const sim = new Sim(data, { seed: 1000 + s, scenario: sc, player: 'DEU' }); sim.advanceMonths(years * 12); for (const w of sim.state.wars) { cnt.set(w.name, (cnt.get(w.name) || 0) + 1); dur.push(((w.end ?? sim.state.day) - w.start) / 30); } console.error('seed', s, 'wars', sim.state.wars.length); }
console.log([...cnt].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}/${n}`).join('\n'));
console.log('median months', dur.sort((a, b) => a - b)[dur.length >> 1]);
