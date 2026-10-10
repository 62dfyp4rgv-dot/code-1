import { createWorld, advanceDays } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { encodeWorld, decodeWorld, checksumOf, type Chunk } from '../src/persistence/codec';
import { SaveRepository } from '../src/persistence/repository';
import { NodeSqliteDriver } from '../src/persistence/nodeSqliteDriver';
import { squadOf } from '../src/world/runtime';
import { overall } from '../src/players';
import { validateWorld } from '../src/world/invariants';

const cfg = defaultWorldConfig('critic-p', 'compact');
const w0 = createWorld(cfg);
const world = createWorld({ ...cfg, humanClubId: Object.keys(w0.clubs)[2]! });
advanceDays(world, 120);
const chunks = encodeWorld(world);
const by: Record<string, { n: number; max: number; total: number }> = {};
for (const c of chunks) { const b = (by[c.kind] ??= { n: 0, max: 0, total: 0 }); b.n++; b.max = Math.max(b.max, c.data.length); b.total += c.data.length; }
console.log('[chunk sizes after 120 days, compact 250 clubs] kind: count, max chunk bytes, total bytes');
for (const [k, v] of Object.entries(by)) console.log('  ', k.padEnd(12), v.n, v.max, v.total);

// roundtrip equivalence
const a = world; const b = decodeWorld(encodeWorld(world));
console.log('[roundtrip] checksum equal right after decode:', checksumOf(encodeWorld(a)) === checksumOf(encodeWorld(b)));
advanceDays(a, 200); advanceDays(b, 200);
console.log('[roundtrip] checksum equal after 200 more days on both:', checksumOf(encodeWorld(a)) === checksumOf(encodeWorld(b)));

// prototype pollution via hostile save
{
  const w = createWorld(cfg);
  const club = Object.values(w.clubs)[5]!;
  const gk = [...squadOf(w, club.id)].filter((p) => p.primary === 'GK').sort((x, y) => overall(y) - overall(x))[0]!;
  const ch: Chunk[] = encodeWorld(w).map((c) => ({ ...c }));
  for (const c of ch) if (c.kind === 'players') c.data = c.data.replace(`"id":"${gk.id}"`, '"id":"__proto__"');
  const hostile = decodeWorld(ch);
  console.log('[hostile] decode ok; keys include __proto__ as own key:', Object.prototype.hasOwnProperty.call(hostile.players, '__proto__'));
  try { advanceDays(hostile, 21); } catch (e) { console.log('[hostile] sim threw', String(e).slice(0, 100)); }
  console.log('[hostile] Object.prototype polluted? ({}).apps =', (({}) as any).apps, ' ({}).goals =', (({}) as any).goals, ' ({}).clubId =', (({}) as any).clubId);
  for (const k of Object.keys(Object.prototype as any)) console.log('   enumerable on Object.prototype:', k);
}
// (truncated-attrs probe moved to critic/pers4.ts: it must run in a clean process, this one is polluted by the probe above)
// DoS: many chunks
{
  const w = createWorld(cfg);
  const base = encodeWorld(w);
  for (const n of [2000, 8000, 16000]) {
    const evil: Chunk[] = [...base];
    for (let i = 0; i < n; i++) evil.push({ kind: 'news', idx: i + 10, data: '[]' });
    const t0 = Date.now();
    decodeWorld(evil);
    console.log(`[DoS] decodeWorld with ${n} extra tiny chunks: ${Date.now() - t0} ms`);
  }
}
