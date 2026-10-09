import { createWorld, advanceDays } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { encodeWorld, decodeWorld } from '../src/persistence/codec';
import { hashString } from '../src/rng';

const cfg = defaultWorldConfig('critic-p', 'compact');
const w0 = createWorld(cfg);
const mk = () => createWorld({ ...cfg, humanClubId: Object.keys(w0.clubs)[2]! });
function cmp(label: string, a: any, b: any) {
  const ca = encodeWorld(a), cb = encodeWorld(b);
  const diff: Record<string, number> = {};
  const keyA = new Map(ca.map((c) => [c.kind + ':' + c.idx, c.data])), keyB = new Map(cb.map((c) => [c.kind + ':' + c.idx, c.data]));
  for (const [k, v] of keyA) if (keyB.get(k) !== v) { const kind = k.split(':')[0]!; diff[kind] = (diff[kind] ?? 0) + 1; }
  console.log(label, 'chunks differing by kind:', JSON.stringify(diff), 'chunk counts', ca.length, cb.length);
}
for (const horizon of [0, 3, 30, 200]) {
  const a = mk(); advanceDays(a, 120);
  const b = decodeWorld(encodeWorld(a));
  advanceDays(a, horizon); advanceDays(b, horizon);
  cmp(`after save/load + ${horizon} days`, a, b);
}
// behavioural divergence ignoring matches archive: compare results of every played fixture
{
  const a = mk(); advanceDays(a, 120);
  const b = decodeWorld(encodeWorld(a));
  advanceDays(a, 250); advanceDays(b, 250);
  let diffFx = 0, total = 0;
  for (const [id, ca] of Object.entries(a.competitions)) for (const f of ca.fixtures) { total++; const g = b.competitions[id]!.fixtures.find((x) => x.id === f.id)!; if (JSON.stringify(f.result) !== JSON.stringify(g.result) || f.day !== g.day) diffFx++; }
  const dp = Object.values(a.players).filter((p) => JSON.stringify(p) !== JSON.stringify(b.players[p.id])).length;
  console.log('[behavioural] fixtures differing', diffFx, '/', total, ' players differing', dp, '/', Object.keys(a.players).length, ' transfers equal', JSON.stringify(a.transfers) === JSON.stringify(b.transfers));
}
