import { loadDataNode } from '../app/js/sim/data.js';
import { Sim } from '../app/js/sim/world.js';
import { serialize, deserialize } from '../app/js/sim/save.js';
const data = await loadDataNode();
const A = new Sim(data, { seed: 5, scenario: 'fault_lines', player: 'DEU' });
A.advanceMonths(14);
const t0 = performance.now(); const txt = serialize(A); const t1 = performance.now();
console.log('save size MB', (txt.length / 1e6).toFixed(2), 'ser ms', (t1 - t0).toFixed(0));
const B = deserialize(data, txt); console.log('load ms', (performance.now() - t1).toFixed(0));
A.advanceMonths(10); B.advanceMonths(10);
const a = serialize(A), b = serialize(B);
const body = (t) => t.split('\n').slice(2).join('\n'); console.log('state identical after 10 more months:', body(a) === body(b));
if (a !== b) { const ja = JSON.parse(a.split('\n').slice(2).join('\n')), jb = JSON.parse(b.split('\n').slice(2).join('\n')); const walk = (x, y, p) => { if (typeof x !== typeof y) return console.log('type', p); if (x && typeof x === 'object') { for (const k of Object.keys(x)) { if (!(k in y)) { console.log('missing', p + '.' + k); continue; } walk(x[k], y[k], p + '.' + k); } } else if (x !== y && !(Number.isNaN(x) && Number.isNaN(y))) { if (global.__n === undefined) global.__n = 0; if (global.__n++ < 12) console.log('diff', p, x, y); } }; walk(ja, jb, ''); }

const st = JSON.parse(body(serialize(A)));
const sizes = Object.entries(st).map(([k, v]) => [k, JSON.stringify(v).length]).sort((x, y) => y[1] - x[1]).slice(0, 8);
console.log('top-level sizes', sizes.map(([k, n]) => `${k}:${(n / 1e6).toFixed(2)}MB`).join(' '));
const c0 = st.countries[10]; console.log('country field sizes', Object.entries(c0).map(([k, v]) => [k, JSON.stringify(v).length]).sort((x, y) => y[1] - x[1]).slice(0, 10).map(([k, n]) => `${k}:${n}`).join(' '));
console.log('econ fields', Object.entries(c0.econ).map(([k, v]) => [k, JSON.stringify(v).length]).sort((x, y) => y[1] - x[1]).slice(0, 8).map(([k, n]) => `${k}:${n}`).join(' '));
