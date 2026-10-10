import { createWorld, advanceDay } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { encodeWorld } from '../src/persistence/codec';
const t0 = Date.now();
const w = createWorld(defaultWorldConfig('critic-perf', 'standard'));
console.log('standard createWorld ms', Date.now() - t0, 'clubs', Object.keys(w.clubs).length, 'players', Object.keys(w.players).length);
let slow: { day: number; ms: number }[] = []; const t1 = Date.now(); let rss0 = process.memoryUsage().rss;
for (let d = 0; d < 364; d++) { const t = Date.now(); advanceDay(w); const ms = Date.now() - t; slow.push({ day: d, ms }); }
console.log('standard 1 season ms', Date.now() - t1, 'rss MB', (process.memoryUsage().rss / 1e6).toFixed(0), 'heap MB', (process.memoryUsage().heapUsed / 1e6).toFixed(0), 'players', Object.keys(w.players).length);
slow.sort((a, b) => b.ms - a.ms);
console.log('slowest days', slow.slice(0, 6).map((s) => `d${s.day}:${s.ms}ms`).join(' '), ' median', slow[Math.floor(slow.length / 2)]!.ms, 'ms');
const t2 = Date.now(); const ch = encodeWorld(w); console.log('encodeWorld ms', Date.now() - t2, 'MB', (ch.reduce((a, c) => a + c.data.length, 0) / 1e6).toFixed(1), 'max chunk MB', (Math.max(...ch.map((c) => c.data.length)) / 1e6).toFixed(2), 'chunks', ch.length);
const by: Record<string, number> = {}; for (const c of ch) by[c.kind] = (by[c.kind] ?? 0) + c.data.length; console.log(JSON.stringify(Object.fromEntries(Object.entries(by).map(([k, v]) => [k, +(v / 1e6).toFixed(1)]))));
