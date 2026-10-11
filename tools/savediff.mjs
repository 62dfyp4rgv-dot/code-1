import { loadDataNode } from '../app/js/sim/data.js';
import { Sim } from '../app/js/sim/world.js';
import { serialize, deserialize } from '../app/js/sim/save.js';
const data = await loadDataNode();
const A = new Sim(data, { seed: 5, scenario: 'fault_lines', player: 'DEU' });
A.advanceMonths(14);
const B = deserialize(data, serialize(A));
const body = (s) => JSON.parse(serialize(s).split('\n').slice(2).join('\n'));
function firstDiffs(x, y, p, out) { if (out.length > 8) return; if (x && typeof x === 'object') { for (const k of Object.keys(x)) { if (!(k in y)) { out.push('missing ' + p + '.' + k); continue; } firstDiffs(x[k], y[k], p + '.' + k, out); } } else if (x !== y && !(Number.isNaN(x) && Number.isNaN(y))) out.push(`${p}: ${x} vs ${y}`); }
for (let d = 1; d <= 120; d++) {
  A.step(); B.step();
  const out = []; firstDiffs(body(A), body(B), '', out);
  if (out.length) { console.log('first divergence on day +', d, A.calendar.format(A.state.day)); console.log(out.join('\n')); break; }
}
