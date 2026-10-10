import { useMemo } from 'react';
import type { WorldState } from '@fu/engine';
import { useGame } from './gameStore';
import { getWorld } from './worldHost';

/**
 * Engine views can be expensive (a league table walks every fixture). Results are memoised per
 * (world version, key, args) in a module-level cache that is dropped whenever the version changes.
 */
const cache = new Map<string, unknown>();
let cacheVersion = -1;

export function queryWorld<T>(version: number, key: string, args: readonly unknown[], compute: (w: WorldState) => T): T | null {
  const w = getWorld();
  if (!w) return null;
  if (cacheVersion !== version) {
    cache.clear();
    cacheVersion = version;
  }
  const k = `${key}|${JSON.stringify(args)}`;
  if (cache.has(k)) return cache.get(k) as T;
  const v = compute(w);
  cache.set(k, v);
  return v;
}

export function useWorldQuery<T>(key: string, args: readonly unknown[], compute: (w: WorldState) => T): T | null {
  const version = useGame((s) => s.version);
  const hasWorld = useGame((s) => s.hasWorld);
  const sig = JSON.stringify(args);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `compute` is intentionally excluded: (key, args, version) identify the result
  return useMemo(() => (hasWorld ? queryWorld(version, key, args, compute) : null), [version, hasWorld, key, sig]);
}

/** Current human club id (stable across renders). */
export function useHumanClubId(): string | null {
  useGame((s) => s.version);
  return getWorld()?.config.humanClubId ?? null;
}

export function __clearQueryCache(): void {
  cache.clear();
  cacheVersion = -1;
}
