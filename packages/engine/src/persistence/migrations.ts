/**
 * Snapshot migrations. Each function upgrades a raw snapshot from version N to N+1 and must be pure and idempotent.
 * Version 0 is the pre-release prototype layout: it lacked per-club ledger anchors, player move tracking and overrides.
 */
import { WORLD_SCHEMA_VERSION } from '../world/types';

type Snap = Record<string, unknown>;

export const MIGRATIONS: Record<number, (s: Snap) => Snap> = {
  0: (s) => {
    const clubs = (s.clubs ?? {}) as Record<string, { finance?: Record<string, unknown>; cohesion?: number }>;
    for (const c of Object.values(clubs)) {
      if (c.finance) {
        if (c.finance.seasonStartCash === undefined) c.finance.seasonStartCash = (c.finance.cash as number | undefined) ?? 0;
        if (c.finance.opexAnnual === undefined) c.finance.opexAnnual = 0;
        if (c.finance.ticketPrice === undefined) c.finance.ticketPrice = 20;
      }
      if (c.cohesion === undefined) c.cohesion = 0.5;
    }
    const players = (s.players ?? {}) as Record<string, { lastMoveDay?: number | null }>;
    for (const p of Object.values(players)) if (p.lastMoveDay === undefined) p.lastMoveDay = null;
    if (!s.overrides) s.overrides = { clubNames: {}, playerNames: {} };
    return { ...s, schemaVersion: 1 };
  },
};

export function migrateSnapshot(snapshot: Snap): Snap {
  let s = snapshot;
  let v = typeof s.schemaVersion === 'number' ? s.schemaVersion : 0;
  if (v > WORLD_SCHEMA_VERSION) throw new Error(`Save was created by a newer version (schema ${v} > ${WORLD_SCHEMA_VERSION})`);
  while (v < WORLD_SCHEMA_VERSION) {
    const step = MIGRATIONS[v];
    if (!step) throw new Error(`No migration from schema ${v}`);
    s = step(s);
    v = typeof s.schemaVersion === 'number' ? s.schemaVersion : v + 1;
  }
  return s;
}
