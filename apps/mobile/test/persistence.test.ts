import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { DatabaseSync } from 'node:sqlite';
import { beforeAll, describe, expect, it } from 'vitest';
import { SaveCorruptedError, SaveRepository, advanceDays, createWorld, defaultWorldConfig, encodeWorld, setHumanClub, type WorldState } from '@fu/engine';
import { IdbSaveStore } from '../src/core/saves/idbStore';
import { checksumOf } from '../src/core/saves/checksum';
import { ExpoSqliteDriver, type SqliteLike } from '../src/core/saves/sqliteDriver';
import { SerializedSaveStore } from '../src/core/saves/serialized';
// Test-only: the engine's own checksum implementation, to prove byte-compatibility of the app's copy.
import { checksumOf as engineChecksumOf } from '../../../packages/engine/src/persistence/codec';

let world: WorldState;
beforeAll(() => {
  world = createWorld(defaultWorldConfig('app-persist', 'compact'));
  setHumanClub(world, world.leagueMembers.ENG1![1]!);
  advanceDays(world, 9);
});

/** node:sqlite double with the expo-sqlite async surface (execAsync / runAsync / getAllAsync). */
function expoLikeDb(): SqliteLike & { raw: DatabaseSync } {
  const raw = new DatabaseSync(':memory:');
  raw.exec('PRAGMA foreign_keys = ON;'); // same as ExpoSqliteDriver.open()
  return {
    raw,
    async execAsync(sql) { raw.exec(sql); },
    async runAsync(sql, params) { return raw.prepare(sql).run(...params); },
    async getAllAsync<T>(sql: string, params: (string | number | null)[]) { return raw.prepare(sql).all(...params) as T[]; },
  };
}

async function newIdb(name = 'db-' + Math.random()): Promise<{ store: IdbSaveStore; factory: IDBFactory; name: string }> {
  const factory = new IDBFactory();
  const store = new IdbSaveStore({ factory, dbName: name, now: (() => { let n = 0; return () => `2026-01-01T00:00:${String(n++ % 60).padStart(2, '0')}.000Z`; })() });
  await store.init();
  return { store, factory, name };
}

describe('app checksum is byte-compatible with the engine', () => {
  it('matches engine checksumOf over real chunks', () => {
    const chunks = encodeWorld(world);
    expect(checksumOf(chunks)).toBe(engineChecksumOf(chunks));
  });
});

describe('IdbSaveStore (web persistence)', () => {
  it('round-trips a world with metadata and checksum verification', async () => {
    const { store } = await newIdb();
    const info = await store.save(1, 'My save', world);
    expect(info).toMatchObject({ slot: 1, name: 'My save', revision: 1, season: world.season, day: world.day });
    expect(info.clubName).toBe(world.clubs[world.config.humanClubId!]!.name);
    expect(info.bytes).toBeGreaterThan(100_000);
    const { world: back, revision, recoveredFromFallback } = await store.load(1);
    expect(revision).toBe(1);
    expect(recoveredFromFallback).toBe(false);
    expect(back.day).toBe(world.day);
    expect(Object.keys(back.players).length).toBe(Object.keys(world.players).length);
    expect(back.config.humanClubId).toBe(world.config.humanClubId);
    expect(encodeWorld(back).map((c) => c.data)).toEqual(encodeWorld(world).map((c) => c.data)); // lossless
    expect((await store.verify(1)).ok).toBe(true);
  });

  it('keeps only the newest revisions and increments revision numbers', async () => {
    const { store } = await newIdb();
    for (let i = 0; i < 4; i++) await store.save(2, 's', world);
    const slots = await store.listSlots();
    expect(slots.find((s) => s.slot === 2)?.revision).toBe(4);
    const v = await store.verify(2);
    expect(v.revisions.map((r) => r.revision)).toEqual([4, 3]);
  });

  it('falls back to the previous revision when the newest is corrupted, and reports SaveCorruptedError when all are', async () => {
    const { store, factory, name } = await newIdb();
    await store.save(3, 'x', world);
    await store.save(3, 'x', world);
    // corrupt a chunk of revision 2
    const raw = await new Promise<IDBDatabase>((res) => { const r = factory.open(name); r.onsuccess = () => res(r.result); });
    async function corrupt(rev: number): Promise<void> {
      const tx = raw.transaction('chunks', 'readwrite');
      const st = tx.objectStore('chunks');
      const rows = await new Promise<{ slot: number; revision: number; kind: string; idx: number; data: string }[]>((res) => { const r = st.getAll(IDBKeyRange.bound([3, rev, ''], [3, rev, '￿'])); r.onsuccess = () => res(r.result as never); });
      const target = rows.find((r) => r.kind === 'clubs')!;
      st.put({ ...target, data: target.data.slice(0, -5) + 'xxxxx' });
      await new Promise<void>((res) => { tx.oncomplete = () => res(); });
    }
    await corrupt(2);
    const r = await store.load(3);
    expect(r.revision).toBe(1);
    expect(r.recoveredFromFallback).toBe(true);
    expect((await store.verify(3)).ok).toBe(false);
    await corrupt(1);
    await expect(store.load(3)).rejects.toBeInstanceOf(SaveCorruptedError);
  });

  it('supports rename, delete, settings and missing-slot errors', async () => {
    const { store } = await newIdb();
    await store.save(4, 'old', world);
    await store.renameSlot(4, 'new name');
    expect((await store.listSlots())[0]?.name).toBe('new name');
    await store.setSetting('k', 'v1'); await store.setSetting('k', 'v2');
    expect(await store.getSetting('k')).toBe('v2');
    expect(await store.getSetting('missing')).toBeNull();
    await store.deleteSlot(4);
    expect(await store.listSlots()).toEqual([]);
    await expect(store.load(4)).rejects.toThrow(/No save/);
    await expect(store.save(0, 'bad', world)).rejects.toThrow(/slot/);
    await expect(store.save(51, 'bad', world)).rejects.toThrow(/slot/);
  });

  it('exports and imports documents, rejects tampered or foreign files', async () => {
    const { store } = await newIdb();
    await store.save(5, 'e', world);
    const doc = await store.exportSlot(5);
    const info = await store.importSlot(6, 'imported', doc);
    expect(info.day).toBe(world.day);
    const tampered = JSON.parse(doc) as { chunks: { data: string }[] };
    tampered.chunks[1]!.data = tampered.chunks[1]!.data.replace('a', 'b');
    await expect(store.importSlot(7, 't', JSON.stringify(tampered))).rejects.toBeInstanceOf(SaveCorruptedError);
    await expect(store.importSlot(7, 't', '{"hello":1}')).rejects.toThrow(/Not a Football Universe save/);
  });

  it('failed saves leave the previous revision intact (atomic transaction)', async () => {
    const { store } = await newIdb();
    await store.save(8, 'a', world);
    const broken = { ...world, config: world.config, players: new Proxy(world.players, { ownKeys() { throw new Error('encode exploded'); } }) } as WorldState;
    await expect(store.save(8, 'a', broken)).rejects.toThrow();
    const r = await store.load(8);
    expect(r.revision).toBe(1);
    expect(r.recoveredFromFallback).toBe(false);
  });

  it('interoperates with the SQLite repository via export/import in both directions', async () => {
    const { store } = await newIdb();
    await store.save(1, 'web', world);
    const repo = new SaveRepository(new ExpoSqliteDriver(expoLikeDb()));
    await repo.init();
    await repo.importSlot(1, 'from web', await store.exportSlot(1));
    expect((await repo.load(1)).world.day).toBe(world.day);
    const doc2 = await repo.exportSlot(1);
    await store.importSlot(2, 'from sqlite', doc2);
    expect((await store.load(2)).world.season).toBe(world.season);
  });
});

describe('ExpoSqliteDriver adapter (against a node:sqlite double of the expo-sqlite async API)', () => {
  it('runs the engine SaveRepository end to end: save, load, revisions, rename, delete, settings', async () => {
    const db = expoLikeDb();
    const repo = new SaveRepository(new ExpoSqliteDriver(db));
    await repo.init();
    expect(await repo.dbVersion()).toBeGreaterThanOrEqual(1);
    await repo.save(1, 'native', world);
    await repo.save(1, 'native', world);
    await repo.save(1, 'native', world);
    const info = (await repo.listSlots())[0]!;
    expect(info.revision).toBe(3);
    const { world: back } = await repo.load(1);
    expect(back.day).toBe(world.day);
    expect((await repo.verify(1)).ok).toBe(true);
    await repo.renameSlot(1, 'renamed');
    await repo.setSetting('a', 'b');
    expect(await repo.getSetting('a')).toBe('b');
    await repo.deleteSlot(1);
    expect(await repo.listSlots()).toEqual([]);

  });

  it('rolls back the whole transaction when a statement fails, and does not leak the depth counter', async () => {
    const db = expoLikeDb();
    const driver = new ExpoSqliteDriver(db);
    await driver.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT NOT NULL)');
    await expect(driver.transaction(async () => {
      await driver.run('INSERT INTO t(id, v) VALUES (?, ?)', [1, 'a']);
      await driver.run('INSERT INTO t(id, v) VALUES (?, ?)', [2, null]); // NOT NULL violation
    })).rejects.toThrow();
    expect(await driver.all('SELECT * FROM t')).toEqual([]);
    await driver.transaction(async () => { await driver.run('INSERT INTO t(id, v) VALUES (?, ?)', [3, 'ok']); });
    expect(await driver.all('SELECT v FROM t')).toEqual([{ v: 'ok' }]);
    // nested transaction joins the outer one
    await driver.transaction(async () => { await driver.transaction(async () => { await driver.run('INSERT INTO t(id, v) VALUES (?, ?)', [4, 'n']); }); });
    expect((await driver.all('SELECT * FROM t')).length).toBe(2);
  });

  it('SerializedSaveStore runs concurrent calls strictly in order', async () => {
    const order: string[] = [];
    const slow = (name: string, ms: number) => async (): Promise<never[]> => { order.push(`start ${name}`); await new Promise((r) => setTimeout(r, ms)); order.push(`end ${name}`); return []; };
    const inner = { listSlots: slow('a', 20), init: slow('b', 1) } as never;
    const s = new SerializedSaveStore(inner);
    await Promise.all([s.listSlots(), s.init()]);
    expect(order).toEqual(['start a', 'end a', 'start b', 'end b']);
  });
});
