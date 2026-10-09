import { Rng } from '../src/rng';
import { roundRobin, colourMatchdays } from '../src/competition/fixtures';
const ids = Array.from({ length: 36 }, (_, i) => 't' + i);
const rng = Rng.fromSeed('c');
const rr = roundRobin(ids, 1, rng);
const edges = rr.slice(0, 8).flat();
for (let k = 0; k < 3; k++) { const t0 = performance.now(); const col = colourMatchdays(ids, edges, 8, rng.derive('k' + k), 300000); console.log('known-class1 graph:', col ? 'ok' : 'FAIL', (performance.now() - t0).toFixed(0) + 'ms'); }
