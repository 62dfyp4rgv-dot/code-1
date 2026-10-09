import { beforeAll, describe, expect, it } from 'vitest';
import { hashString } from '../src/rng';
import { createWorld, advanceDays } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { assertValid } from '../src/world/invariants';
import { NodeSqliteDriver } from '../src/persistence/nodeSqliteDriver';
import { SaveCorruptedError, SaveRepository } from '../src/persistence/repository';
import { migrateSnapshot } from '../src/persistence/migrations';
import { decodeWorld, encodeWorld } from '../src/persistence/codec';
import type { WorldState } from '../src/world/types';

const digest = (w: WorldState): number => hashString(JSON.stringify([w.day, w.season, w.clubs, w.players, w.transfers, w.competitions, w.history, w.news.length]));

async function freshRepo(): Promise<{ repo: SaveRepository; db: NodeSqliteDriver }> {
  const db = new NodeSqliteDriver();
  const repo = new SaveRepository(db, { now: () => '2030-01-01T00:00:00.000Z' });
  await repo.init();
  return { repo, db };
}

describe('save / load', () => {
  let world: WorldState;
  beforeAll(() => {
    world = createWorld({ ...defaultWorldConfig('persist', 'compact'), humanClubId: null });
    advanceDays(world, 45);
  });

  it('round-trips the entire world exactly', async () => {
    const { repo } = await freshRepo();
    const info = await repo.save(1, 'Career A', world);
    expect(info.revision).toBe(1);
    const { world: loaded, recoveredFromFallback } = await repo.load(1);
    expect(recoveredFromFallback).toBe(false);
    // compare as JSON documents: persistence is JSON, so -0/undefined normalise identically on both sides
    expect(JSON.parse(JSON.stringify(loaded))).toEqual(JSON.parse(JSON.stringify(world)));
    assertValid(loaded, { checkLedger: true });
  });

  it('simulation continues identically after save/load (determinism across persistence)', async () => {
    const { repo } = await freshRepo();
    const a = createWorld(defaultWorldConfig('persist-det', 'compact'));
    advanceDays(a, 20);
    await repo.save(2, 'x', a);
    const { world: b } = await repo.load(2);
    advanceDays(a, 25); advanceDays(b, 25);
    expect(digest(a)).toBe(digest(b));
  });

  it('keeps two revisions and prunes older ones; slot listing reports metadata', async () => {
    const { repo, db } = await freshRepo();
    for (let i = 0; i < 4; i++) { advanceDays(world, 1); await repo.save(3, 'Slot', world); }
    const revs = await db.all<{ revision: number }>('SELECT revision FROM save_revisions WHERE slot = 3 ORDER BY revision');
    expect(revs.map((r) => r.revision)).toEqual([3, 4]);
    const chunks = await db.all<{ n: number }>('SELECT COUNT(DISTINCT revision) AS n FROM save_chunks WHERE slot = 3');
    expect(chunks[0]!.n).toBe(2);
    const slots = await repo.listSlots();
    expect(slots).toHaveLength(1);
    expect(slots[0]).toMatchObject({ slot: 3, name: 'Slot', revision: 4, season: world.season, day: world.day });
    expect(slots[0]!.bytes).toBeGreaterThan(1e5);
  });

  it('an interrupted save leaves the previous revision intact (atomicity)', async () => {
    const { repo } = await freshRepo();
    await repo.save(1, 'ok', world);
    const snapshotBefore = JSON.stringify((await repo.load(1)).world);
    advanceDays(world, 3);
    await expect(repo.save(1, 'crash', world, { afterChunk: (i) => { if (i === 5) throw new Error('process killed'); } })).rejects.toThrow('process killed');
    const slots = await repo.listSlots();
    expect(slots[0]!.revision).toBe(1);
    expect(slots[0]!.name).toBe('ok');
    expect(JSON.stringify((await repo.load(1)).world)).toBe(snapshotBefore);
  });

  it('detects corruption and falls back to the previous valid revision', async () => {
    const { repo, db } = await freshRepo();
    await repo.save(1, 'c', world);
    advanceDays(world, 2);
    await repo.save(1, 'c', world);
    await db.run("UPDATE save_chunks SET data = substr(data, 1, length(data) - 3) || 'xx}' WHERE slot = 1 AND revision = 2 AND kind = 'clubs'");
    const v = await repo.verify(1);
    expect(v.ok).toBe(false);
    expect(v.revisions.map((r) => r.ok)).toEqual([false, true]);
    const out = await repo.load(1);
    expect(out.revision).toBe(1);
    expect(out.recoveredFromFallback).toBe(true);
    await db.run("DELETE FROM save_chunks WHERE slot = 1 AND revision = 1 AND kind = 'managers'");
    await expect(repo.load(1)).rejects.toBeInstanceOf(SaveCorruptedError);
  });

  it('export/import produces an identical world and rejects tampered files', async () => {
    const { repo } = await freshRepo();
    await repo.save(1, 'e', world);
    const doc = await repo.exportSlot(1);
    const { repo: other } = await freshRepo();
    await other.importSlot(5, 'imported', doc);
    expect(JSON.parse(JSON.stringify((await other.load(5)).world))).toEqual(JSON.parse(JSON.stringify((await repo.load(1)).world)));
    const bad = JSON.parse(doc) as { chunks: { data: string }[] };
    bad.chunks[2]!.data = bad.chunks[2]!.data.replace('0', '1');
    await expect(other.importSlot(6, 'bad', JSON.stringify(bad))).rejects.toThrow(/checksum/);
    await expect(other.importSlot(7, 'junk', '{"format":"nope"}')).rejects.toThrow(/Not a Football Universe/);
  });

  it('rename, delete (cascades chunks) and settings work; DB constraints are enforced', async () => {
    const { repo, db } = await freshRepo();
    await repo.save(2, 'a', world);
    await repo.renameSlot(2, 'renamed');
    expect((await repo.listSlots())[0]!.name).toBe('renamed');
    await repo.deleteSlot(2);
    expect(await repo.listSlots()).toHaveLength(0);
    expect((await db.all<{ n: number }>('SELECT COUNT(*) AS n FROM save_chunks'))[0]!.n).toBe(0);
    await expect(db.run("INSERT INTO save_slots(slot,name,created_at,updated_at,current_revision,season,day,world_schema) VALUES (99,'x','t','t',1,1,1,1)")).rejects.toThrow();
    await repo.setSetting('language', 'ar'); await repo.setSetting('language', 'en');
    expect(await repo.getSetting('language')).toBe('en');
    expect(await repo.getSetting('missing')).toBeNull();
    expect(await repo.dbVersion()).toBe(1);
    await repo.init(); // idempotent
    expect(await repo.dbVersion()).toBe(1);
  });
});

describe('schema migration', () => {
  it('upgrades a version-0 prototype snapshot to the current schema and the world still validates', () => {
    const w = createWorld(defaultWorldConfig('mig', 'compact'));
    const chunks = encodeWorld(w);
    // simulate an old save: strip fields introduced after v0 and stamp version 0
    const meta = JSON.parse(chunks[0]!.data) as Record<string, unknown>;
    meta.schemaVersion = 0; delete meta.overrides;
    chunks[0]!.data = JSON.stringify(meta);
    const clubsIdx = chunks.findIndex((c) => c.kind === 'clubs');
    const clubs = JSON.parse(chunks[clubsIdx]!.data) as Record<string, { cohesion?: number; finance: Record<string, unknown> }>;
    for (const c of Object.values(clubs)) { delete c.cohesion; delete c.finance.seasonStartCash; delete c.finance.opexAnnual; delete c.finance.ticketPrice; }
    chunks[clubsIdx]!.data = JSON.stringify(clubs);
    const upgraded = decodeWorld(chunks);
    expect(upgraded.schemaVersion).toBe(1);
    expect(upgraded.overrides).toEqual({ clubNames: {}, playerNames: {} });
    expect(Object.values(upgraded.clubs).every((c) => c.cohesion === 0.5 && typeof c.finance.ticketPrice === 'number')).toBe(true);
    // the migrated world can be simulated
    advanceDays(upgraded, 5);
  });
  it('refuses saves from the future and unknown versions', () => {
    expect(() => migrateSnapshot({ schemaVersion: 99 })).toThrow(/newer version/);
  });
});
