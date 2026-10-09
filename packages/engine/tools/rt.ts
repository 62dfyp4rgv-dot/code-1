import { createWorld, advanceDays } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { decodeWorld, encodeWorld } from '../src/persistence/codec';
const w = createWorld({ ...defaultWorldConfig('persist', 'compact'), humanClubId: null });
advanceDays(w, 45);
const l = decodeWorld(encodeWorld(w));
function diff(a: unknown, b: unknown, path: string, out: string[]): void {
  if (out.length > 8) return;
  if (a === b) return;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') { out.push(`${path}: ${JSON.stringify(a)?.slice(0, 60)} vs ${JSON.stringify(b)?.slice(0, 60)}`); return; }
  const ka = Object.keys(a as object); const kb = Object.keys(b as object);
  for (const k of new Set([...ka, ...kb])) diff((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}.${k}`, out);
}
const out: string[] = []; diff(w, l, 'w', out); console.log(out);
