import { simulateMatch } from '../src/match';
import { syntheticMatch, syntheticSheet } from '../src/synth';
const byKind: Record<string, { st: number; all: number }> = {};
let share = 0; const n = 600;
for (let i = 0; i < n; i++) {
  const r = simulateMatch(syntheticMatch(`c${i}`, `s${i}`, syntheticSheet({ id: 'H', quality: 62, seed: String(i) }), syntheticSheet({ id: 'A', quality: 62, seed: String(i) })));
  const stId = 'H-p10';
  for (const e of r.events) if (e.type === 'shot' && e.side === 'home') { const k = (byKind[e.kind] ??= { st: 0, all: 0 }); k.all++; if (e.playerId === stId) k.st++; }
  const t = r.stats.home.shots; share += Math.max(...r.players.filter((p) => p.side === 'home').map((p) => p.shots)) / t;
}
console.log('mean top share', (share / n).toFixed(3));
for (const [k, v] of Object.entries(byKind)) console.log(k.padEnd(10), 'ST share', (v.st / v.all).toFixed(2), 'n/match', (v.all / n).toFixed(2));
