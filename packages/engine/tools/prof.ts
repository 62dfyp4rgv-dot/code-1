import { simulateMatch } from '../src/match';
import { syntheticMatch, syntheticSheet } from '../src/synth';
const h = syntheticSheet({ id: 'H', quality: 62, seed: 'a' });
const a = syntheticSheet({ id: 'A', quality: 62, seed: 'a' });
const t0 = performance.now();
for (let i = 0; i < 1500; i++) simulateMatch(syntheticMatch(`m${i}`, `s${i}`, h, a));
console.log('ms/match', (performance.now() - t0) / 1500);
