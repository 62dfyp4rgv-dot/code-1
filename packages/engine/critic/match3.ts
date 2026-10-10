import { simulateMatch, deriveStatsFromEvents } from '../src/match';
import { syntheticSheet, syntheticMatch } from '../src/synth';
import { Rng, hashString } from '../src/rng';
const N = 3000;
let subsBadOrder = 0, htSubs = 0, zeroMinScorers = 0, zeroMinCards = 0, zeroMinLines = 0, minutesOver = 0, goalsPos: Record<string, number> = {}, totalGoals = 0, minSumBad = 0;
let nonMonoMatches = 0;
for (let i = 0; i < N; i++) {
  const h = syntheticSheet({ id: 'H', quality: 60, seed: 'a' + i, acumen: 90 }), a = syntheticSheet({ id: 'A', quality: 60, seed: 'a' + i });
  const r = simulateMatch(syntheticMatch('m' + i, 'c3', h, a));
  // event minute monotonic?
  let prev = 0, bad = false; for (const e of r.events) { if (e.period === 2 && e.minute < prev - 0 && e.type !== 'halftime') { } if (e.minute < prev) bad = true; prev = Math.max(prev, e.minute); }
  if (bad) nonMonoMatches++;
  // half-time subs: sub events in period 2 labelled minute > 46 but followed by events with smaller minute
  const idx = r.events.findIndex((e) => e.period === 2 && e.type === 'sub');
  if (idx >= 0) { const e = r.events[idx]!; const next = r.events.slice(idx + 1).find((x) => x.period === 2 && x.type !== 'sub'); if (next && e.minute > next.minute + 1) subsBadOrder++; htSubs++; }
  for (const l of r.players) {
    if (l.minutes === 0 && l.started) zeroMinLines++;
    if (l.minutes === 0 && (l.goals > 0 || l.assists > 0)) zeroMinScorers++;
    if (l.minutes === 0 && (l.yellow > 0 || l.red > 0)) zeroMinCards++;
    if (l.minutes > 125) minutesOver++;
    const pos = l.position; goalsPos[pos] = (goalsPos[pos] ?? 0) + l.goals; totalGoals += l.goals;
  }
  const sumMin = r.players.filter((l) => l.side === 'home').reduce((s, l) => s + l.minutes, 0);
  if (Math.abs(sumMin - 11 * 90) > 30 + 11 * 6) minSumBad++;
}
console.log('non-monotonic minute labels in event log:', nonMonoMatches, '/', N);
console.log('matches with period-2 sub event whose minute exceeds the next event by >1 (half-time clock bug):', subsBadOrder, '/', htSubs, 'matches having a period-2 sub');
console.log('started players credited 0 minutes:', zeroMinLines, '; zero-minute players with goals/assists:', zeroMinScorers, '; with cards:', zeroMinCards);
console.log('goal share by slot position:', Object.entries(goalsPos).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k} ${(v / totalGoals * 100).toFixed(1)}%`).join(' '));
// seed collision demonstration
const seen = new Map<number, string>(); let coll = 0; const M = 200000;
for (let i = 0; i < M; i++) { const s = `critic:ENG1:2:r${i % 38}:1:${i}`; const n = hashString(s); const k = (n % 4294967296) ^ Math.floor(n / 4294967296); const key = k >>> 0; if (seen.has(key)) coll++; else seen.set(key, s); }
console.log(`[seed space] ${M} distinct fixture-like seeds -> ${coll} collisions of the effective 32-bit Rng seed (Rng.fromSeed folds the 53-bit hash to 32 bits); expected ~ ${(M * M / 2 / 4294967296).toFixed(1)}`);
const a1 = Rng.fromSeed(seen.get([...seen.keys()][0]!)!);
// keyedNoise bias
let sum = 0, c = 0; const buckets = new Array(10).fill(0);
for (let i = 0; i < 400000; i++) { const v = (hashString(['cl001', 'p' + i, 'a'].join('|')) % 100000) / 50000 - 1; sum += v; buckets[Math.min(9, Math.floor((v + 1) * 5))]++; c++; }
console.log('[keyedNoise] mean', (sum / c).toFixed(5), 'decile counts', buckets.join(','));
