/**
 * World <-> chunked JSON codec. Chunks keep individual rows small (mobile SQLite row limits, incremental parsing)
 * and let integrity be verified per chunk. Attribute objects are packed to arrays in canonical order.
 */
import { hashString } from '../rng';
import { ATTR_KEYS, type Attributes, type Player } from '../types';
import { WORLD_SCHEMA_VERSION, type WorldState } from '../world/types';
import { migrateSnapshot } from './migrations';
import { reindex } from '../world/runtime';

export interface Chunk { kind: string; idx: number; data: string }

export const REFERENCE_DATA_VERSION = 'registry-1';
const PLAYERS_PER_CHUNK = 400;
const ITEMS_PER_CHUNK = 500;

type PackedPlayer = Omit<Player, 'attrs'> & { attrs: number[] };

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
  const push = (kind: string, idx: number, value: unknown): void => { chunks.push({ kind, idx, data: JSON.stringify(value) }); };
  push('meta', 0, {
    schemaVersion: world.schemaVersion, referenceVersion: REFERENCE_DATA_VERSION, config: world.config, day: world.day, season: world.season,
    leagueMembers: world.leagueMembers, history: world.history, ai: world.ai, counters: world.counters, transferList: world.transferList,
    managerPool: world.managerPool, overrides: world.overrides, matchOrder: world.matchOrder,
  });
  push('clubs', 0, world.clubs);
  push('managers', 0, world.managers);
  const players = Object.values(world.players);
  for (let i = 0; i * PLAYERS_PER_CHUNK < players.length; i++) push('players', i, players.slice(i * PLAYERS_PER_CHUNK, (i + 1) * PLAYERS_PER_CHUNK).map(packPlayer));
  const comps = Object.values(world.competitions);
  comps.forEach((c, i) => push('competition', i, c));
  push('seasonStats', 0, world.seasonStats);
  const matches = Object.values(world.matches);
  for (let i = 0; i * 100 < matches.length; i++) push('matches', i, matches.slice(i * 100, (i + 1) * 100));
  for (let i = 0; i * ITEMS_PER_CHUNK < world.transfers.length; i++) push('transfers', i, world.transfers.slice(i * ITEMS_PER_CHUNK, (i + 1) * ITEMS_PER_CHUNK));
  for (let i = 0; i * ITEMS_PER_CHUNK < world.news.length; i++) push('news', i, world.news.slice(i * ITEMS_PER_CHUNK, (i + 1) * ITEMS_PER_CHUNK));
  return chunks;
}

export function checksumOf(chunks: readonly Chunk[]): string {
  let h = 0;
  for (const c of chunks) h = hashString(`${c.kind}:${c.idx}:${hashString(c.data)}`, h % 2147483647);
  return h.toString(36) + '-' + chunks.length.toString(36);
}

export function decodeWorld(chunks: readonly Chunk[]): WorldState {
  const byKind = new Map<string, Chunk[]>();
  for (const c of chunks) byKind.set(c.kind, [...(byKind.get(c.kind) ?? []), c]);
  const parse = <T>(kind: string): T[] => (byKind.get(kind) ?? []).sort((a, b) => a.idx - b.idx).map((c) => JSON.parse(c.data) as T);
  const metaChunk = byKind.get('meta')?.[0];
  if (!metaChunk) throw new Error('Save is missing its metadata chunk');
  const rawMeta = JSON.parse(metaChunk.data) as Record<string, unknown>;
  // The reference-data version identifies which bundled registry the save was made with; it is not world state.
  const referenceVersion = rawMeta.referenceVersion;
  delete rawMeta.referenceVersion;
  if (referenceVersion !== undefined && referenceVersion !== REFERENCE_DATA_VERSION) {
    throw new Error(`Save uses reference data ${String(referenceVersion)} but this build ships ${REFERENCE_DATA_VERSION}`);
  }
  const snapshot: Record<string, unknown> = {
    ...rawMeta,
    clubs: parse<Record<string, unknown>>('clubs')[0] ?? {},
    managers: parse<Record<string, unknown>>('managers')[0] ?? {},
    players: Object.fromEntries(parse<PackedPlayer[]>('players').flat().map((p) => [p.id, p])),
    competitions: Object.fromEntries(parse<{ id: string }>('competition').map((c) => [c.id, c])),
    seasonStats: parse<Record<string, unknown>>('seasonStats')[0] ?? {},
    matches: Object.fromEntries(parse<{ id: string }[]>('matches').flat().map((m) => [m.id, m])),
    transfers: parse<unknown[]>('transfers').flat(),
    news: parse<unknown[]>('news').flat(),
  };
  const migrated = migrateSnapshot(snapshot);
  const players = migrated.players as Record<string, PackedPlayer | Player>;
  for (const [id, p] of Object.entries(players)) if (Array.isArray((p as PackedPlayer).attrs)) players[id] = unpackPlayer(p as PackedPlayer);
  const world = migrated as unknown as WorldState;
  if (world.schemaVersion !== WORLD_SCHEMA_VERSION) throw new Error(`Unsupported save schema ${String(world.schemaVersion)}`);
  reindex(world);
  return world;
}
