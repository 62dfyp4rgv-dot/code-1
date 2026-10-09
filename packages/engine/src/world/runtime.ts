import type { Player } from '../types';
import type { WorldState } from './types';

/**
 * Derived, non-persisted indexes. Rebuilt on load. All membership changes must go through `assignPlayer`
 * so the index cannot drift from `player.clubId` (checked by `validateWorld`).
 */
interface Runtime {
  squads: Map<string, Player[]>;
  free: Set<Player>;
  /** Every player ever created (including retired), in creation order. */
  all: Player[];
}

const caches = new WeakMap<WorldState, Runtime>();

function build(world: WorldState): Runtime {
  const squads = new Map<string, Player[]>();
  const free = new Set<Player>();
  for (const p of Object.values(world.players)) {
    if (p.retired) continue;
    if (p.clubId === null) { free.add(p); continue; }
    const list = squads.get(p.clubId);
    if (list) list.push(p);
    else squads.set(p.clubId, [p]);
  }
  const rt = { squads, free, all: Object.values(world.players) };
  caches.set(world, rt);
  return rt;
}

function rt(world: WorldState): Runtime {
  return caches.get(world) ?? build(world);
}

/** Register a newly created player in the world and the runtime indexes. */
export function addPlayer(world: WorldState, player: Player): void {
  world.players[player.id] = player;
  const r = caches.get(world);
  if (r) {
    r.all.push(player);
    if (player.clubId === null && !player.retired) r.free.add(player);
  }
}

/** All players in creation order (cached; includes retired players). */
export function allPlayers(world: WorldState): readonly Player[] {
  return rt(world).all;
}

export function reindex(world: WorldState): void {
  build(world);
}

const EMPTY: Player[] = [];

export function squadOf(world: WorldState, clubId: string): readonly Player[] {
  return rt(world).squads.get(clubId) ?? EMPTY;
}

/** Move a player to a club (or to free agency when `clubId` is null), maintaining the squad index. */
export function assignPlayer(world: WorldState, player: Player, clubId: string | null): void {
  const r = rt(world);
  if (player.clubId !== null) {
    const list = r.squads.get(player.clubId);
    if (list) {
      const i = list.indexOf(player);
      if (i >= 0) list.splice(i, 1);
    }
  }
  r.free.delete(player);
  player.clubId = clubId;
  if (clubId === null && !player.retired) r.free.add(player);
  if (clubId !== null && !player.retired) {
    const list = r.squads.get(clubId);
    if (list) list.push(player);
    else r.squads.set(clubId, [player]);
  }
}

export function removeFromIndex(world: WorldState, player: Player): void {
  const r = rt(world);
  r.free.delete(player);
  if (player.clubId === null) return;
  const list = r.squads.get(player.clubId);
  if (list) {
    const i = list.indexOf(player);
    if (i >= 0) list.splice(i, 1);
  }
}

export function freeAgents(world: WorldState): Player[] {
  return [...rt(world).free];
}
