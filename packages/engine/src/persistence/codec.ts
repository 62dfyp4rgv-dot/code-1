/**
 * World <-> chunked JSON codec. Chunks are bounded by *bytes* (`LIMITS.targetChunkBytes`, ~400 KB) so every stored row
 * stays small (mobile SQLite cursor limits, incremental parsing) and integrity can be verified per chunk.
 * Attribute objects are packed to arrays in canonical order. Decoding treats its input as untrusted (see validate.ts).
 */
import { hashString } from '../rng';
import { ATTR_KEYS, type Attributes, type Player } from '../types';
import { WORLD_SCHEMA_VERSION, type WorldState } from '../world/types';
import { migrateSnapshot } from './migrations';
import { reindex } from '../world/runtime';
import { SaveCorruptedError } from './errors';
import { assertSafeText, isSafeId, LIMITS, validateLoadedWorld, validateSnapshotShape } from './validate';

export interface Chunk { kind: string; idx: number; data: string }

export const REFERENCE_DATA_VERSION = 'registry-1';

/** Canonical chunk order (used for checksums). */
export const CHUNK_ORDER = ['meta', 'hseasons', 'hclubs', 'clubs', 'managers', 'players', 'competition', 'seasonStats', 'matches', 'transfers', 'news'] as const;

type PackedPlayer = Omit<Player, 'attrs'> & { attrs: number[] };
type Obj = Record<string, unknown>;

function packPlayer(p: Player): PackedPlayer {
  const a: number[] = new Array<number>(ATTR_KEYS.length);
  for (let i = 0; i < ATTR_KEYS.length; i++) a[i] = Math.round((p.attrs[ATTR_KEYS[i] as keyof Attributes]) * 100) / 100;
  return { ...p, attrs: a };
}

function unpackPlayer(p: PackedPlayer): Player {
  const attrs = {} as Attributes;
  for (let i = 0; i < ATTR_KEYS.length; i++) attrs[ATTR_KEYS[i] as keyof Attributes] = p.attrs[i] as number;
  return { ...p, attrs };
}

export function encodeWorld(world: WorldState): Chunk[] {
  const chunks: Chunk[] = [];
  const push = (kind: string, idx: number, data: string): void => { chunks.push({ kind, idx, data }); };
  /** Split a list into JSON array chunks of roughly `targetChunkBytes`; an oversized single item gets its own chunk. */
  const pushList = (kind: string, items: Iterable<unknown>): void => {
    let parts: string[] = [];
    let size = 2;
    let idx = 0;
    const flush = (): void => { if (parts.length > 0) { push(kind, idx++, `[${parts.join(',')}]`); parts = []; size = 2; } };
    for (const item of items) {
      const s = JSON.stringify(item);
      if (size + s.length + 1 > LIMITS.targetChunkBytes) flush();
      parts.push(s);
      size += s.length + 1;
    }
    flush();
  };
  // seasons/clubs live in their own chunks; empty placeholders keep the key order of the history object stable
  push('meta', 0, JSON.stringify({
    schemaVersion: world.schemaVersion, referenceVersion: REFERENCE_DATA_VERSION, config: world.config, day: world.day, season: world.season,
    leagueMembers: world.leagueMembers, history: { ...world.history, seasons: [], clubs: {} }, ai: world.ai, counters: world.counters, transferList: world.transferList,
    managerPool: world.managerPool, overrides: world.overrides, matchOrder: world.matchOrder,
  }));
  pushList('hseasons', world.history.seasons);
  pushList('hclubs', Object.entries(world.history.clubs));
  pushList('clubs', Object.values(world.clubs));
  pushList('managers', Object.values(world.managers));
  pushList('players', Object.values(world.players).map(packPlayer));
  Object.values(world.competitions).forEach((c, i) => push('competition', i, JSON.stringify(c)));
  pushList('seasonStats', Object.entries(world.seasonStats));
  pushList('matches', Object.values(world.matches));
  pushList('transfers', world.transfers);
  pushList('news', world.news);
  return chunks;
}

export function checksumOf(chunks: readonly Chunk[]): string {
  let h = 0;
  for (const c of chunks) h = hashString(`${c.kind}:${c.idx}:${hashString(c.data)}`, h % 2147483647);
  return h.toString(36) + '-' + chunks.length.toString(36);
}

/** Sort chunks into canonical (kind, idx) order. Unknown kinds are rejected. */
export function canonicalOrder<T extends { kind: string; idx: number }>(chunks: readonly T[]): T[] {
  for (const c of chunks) if (!(CHUNK_ORDER as readonly string[]).includes(c.kind)) throw new SaveCorruptedError(`unknown chunk kind ${JSON.stringify(String(c.kind).slice(0, 30))}`);
  return [...chunks].sort((a, b) => CHUNK_ORDER.indexOf(a.kind as never) - CHUNK_ORDER.indexOf(b.kind as never) || a.idx - b.idx);
}

/** Structural check of a chunk list received from outside (file import or database rows). */
export function assertChunkList(chunks: unknown): asserts chunks is Chunk[] {
  if (!Array.isArray(chunks)) throw new SaveCorruptedError('chunk list missing');
  if (chunks.length === 0 || chunks.length > LIMITS.maxChunks) throw new SaveCorruptedError(`chunk count ${chunks.length} is outside 1..${LIMITS.maxChunks}`);
  let total = 0;
  const seen = new Set<string>();
  for (const c of chunks as Partial<Chunk>[]) {
    if (typeof c !== 'object' || c === null || typeof c.kind !== 'string' || typeof c.data !== 'string' || !Number.isInteger(c.idx) || (c.idx as number) < 0) throw new SaveCorruptedError('malformed chunk');
    const key = `${c.kind}:${c.idx}`;
    if (seen.has(key)) throw new SaveCorruptedError(`duplicate chunk ${key}`);
    seen.add(key);
    total += c.data.length;
    if (c.data.length > LIMITS.maxChunkBytes || total > LIMITS.maxTotalBytes) throw new SaveCorruptedError('save is too large');
  }
}

export function decodeWorld(chunks: readonly Chunk[]): WorldState {
  assertChunkList(chunks);
  canonicalOrder(chunks);
  const byKind = new Map<string, Chunk[]>();
  for (const c of chunks) {
    const list = byKind.get(c.kind);
    if (list) list.push(c);
    else byKind.set(c.kind, [c]);
  }
  const parse = (kind: string): unknown[] => {
    const out: unknown[] = [];
    for (const c of (byKind.get(kind) ?? []).sort((a, b) => a.idx - b.idx)) {
      assertSafeText(kind, c.data);
      let v: unknown;
      try { v = JSON.parse(c.data); } catch { throw new SaveCorruptedError(`chunk ${kind}:${c.idx} is not valid JSON`); }
      out.push(v);
    }
    return out;
  };
  /** Items of a list-chunked kind (also accepts the legacy single-object layout). */
  const items = (kind: string): unknown[] => {
    const out: unknown[] = [];
    for (const v of parse(kind)) {
      if (!Array.isArray(v)) throw new SaveCorruptedError(`chunk ${kind} is not a list`);
      for (const x of v) out.push(x);
    }
    return out;
  };
  const keyed = (kind: string): Obj => {
    const out: Obj = {};
    for (const v of items(kind)) {
      const id = (v as Obj | null)?.id;
      if (!isSafeId(id)) throw new SaveCorruptedError(`${kind} entry has a missing or unsafe id`);
      out[id] = v;
    }
    return out;
  };
  const metaChunk = byKind.get('meta')?.[0];
  if (!metaChunk) throw new SaveCorruptedError('Save is missing its metadata chunk');
  assertSafeText('meta', metaChunk.data);
  let rawMeta: Obj;
  try { rawMeta = JSON.parse(metaChunk.data) as Obj; } catch { throw new SaveCorruptedError('metadata chunk is not valid JSON'); }
  if (typeof rawMeta !== 'object' || rawMeta === null || Array.isArray(rawMeta)) throw new SaveCorruptedError('metadata chunk is malformed');
  // The reference-data version identifies which bundled registry the save was made with; it is not world state.
  const referenceVersion = rawMeta.referenceVersion;
  delete rawMeta.referenceVersion;
  if (referenceVersion !== undefined && referenceVersion !== REFERENCE_DATA_VERSION) {
    throw new SaveCorruptedError(`Save uses reference data ${String(referenceVersion)} but this build ships ${REFERENCE_DATA_VERSION}`);
  }
  const history = rawMeta.history as Obj | undefined;
  if (typeof history !== 'object' || history === null) throw new SaveCorruptedError('history is missing');
  const hclubs: Obj = {};
  for (const e of items('hclubs')) {
    if (!Array.isArray(e) || !isSafeId(e[0])) throw new SaveCorruptedError('malformed club history entry');
    hclubs[e[0]] = e[1];
  }
  const stats: Obj = {};
  for (const e of items('seasonStats')) {
    if (!Array.isArray(e) || !isSafeId(e[0])) throw new SaveCorruptedError('malformed season stat entry');
    stats[e[0]] = e[1];
  }
  const snapshot: Obj = {
    ...rawMeta,
    history: Object.assign(history, { seasons: items('hseasons'), clubs: hclubs }),
    clubs: keyed('clubs'),
    managers: keyed('managers'),
    players: keyed('players'),
    competitions: Object.fromEntries(parse('competition').map((c) => {
      const id = (c as Obj | null)?.id;
      if (!isSafeId(id)) throw new SaveCorruptedError('competition has a missing or unsafe id');
      return [id, c];
    })),
    seasonStats: stats,
    matches: keyed('matches'),
    transfers: items('transfers'),
    news: items('news'),
  };
  const migrated = migrateSnapshot(snapshot);
  validateSnapshotShape(migrated);
  const players = migrated.players as Record<string, PackedPlayer | Player>;
  for (const [id, p] of Object.entries(players)) players[id] = unpackPlayer(p as PackedPlayer);
  const world = migrated as unknown as WorldState;
  if (world.schemaVersion !== WORLD_SCHEMA_VERSION) throw new SaveCorruptedError(`Unsupported save schema ${String(world.schemaVersion)}`);
  reindex(world);
  validateLoadedWorld(world);
  return world;
}
