/**
 * IndexedDB-backed save store for the web build. Same semantics as the engine's SQLite `SaveRepository`:
 *  - every save writes a NEW revision inside one IDB transaction (all-or-nothing),
 *  - revisions carry a checksum over their chunks; `load` verifies it and falls back to the previous revision,
 *  - the newest `keepRevisions` (>= 2) revisions are retained.
 * The IndexedDB factory is injectable so the logic is unit-tested with `fake-indexeddb`.
 */
import { SaveCorruptedError, assertChunkList, decodeWorld, encodeWorld, type SlotInfo, type WorldState } from '@fu/engine';
import { checksumOf, sortCanonical, type ChunkLike } from './checksum';
import type { LoadResult, SaveStore, VerifyResult } from './types';
import { MAX_SLOT, MIN_SLOT } from './types';

interface SlotRecord {
  slot: number; name: string; createdAt: string; updatedAt: string; revision: number; season: number; day: number; clubName: string | null; worldSchema: number;
}
interface RevisionRecord { slot: number; revision: number; checksum: string; chunkCount: number; bytes: number; createdAt: string }
interface ChunkRecord extends ChunkLike { slot: number; revision: number }

export interface IdbStoreOptions {
  factory?: IDBFactory;
  dbName?: string;
  now?: () => string;
  keepRevisions?: number;
}

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = (): void => resolve(r.result);
    r.onerror = (): void => reject(r.error ?? new Error('IndexedDB request failed'));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = (): void => resolve();
    tx.onerror = (): void => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = (): void => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

const DB_VERSION = 1;

export class IdbSaveStore implements SaveStore {
  private db: IDBDatabase | null = null;
  private readonly factory: IDBFactory;
  private readonly dbName: string;
  private readonly now: () => string;
  private readonly keep: number;

  constructor(opts: IdbStoreOptions = {}) {
    const f = opts.factory ?? (typeof indexedDB !== 'undefined' ? indexedDB : undefined);
    if (!f) throw new Error('IndexedDB is not available in this environment');
    this.factory = f;
    this.dbName = opts.dbName ?? 'football-universe';
    this.now = opts.now ?? ((): string => new Date().toISOString());
    this.keep = Math.max(2, opts.keepRevisions ?? 2);
  }

  async init(): Promise<void> {
    if (this.db) return;
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = this.factory.open(this.dbName, DB_VERSION);
      open.onupgradeneeded = (): void => {
        const db = open.result;
        if (!db.objectStoreNames.contains('slots')) db.createObjectStore('slots', { keyPath: 'slot' });
        if (!db.objectStoreNames.contains('revisions')) db.createObjectStore('revisions', { keyPath: ['slot', 'revision'] });
        if (!db.objectStoreNames.contains('chunks')) db.createObjectStore('chunks', { keyPath: ['slot', 'revision', 'kind', 'idx'] });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
      };
      open.onsuccess = (): void => resolve(open.result);
      open.onerror = (): void => reject(open.error ?? new Error('could not open IndexedDB'));
      open.onblocked = (): void => reject(new Error('IndexedDB open blocked by another tab'));
    });
  }

  private d(): IDBDatabase {
    if (!this.db) throw new Error('IdbSaveStore.init() has not been called');
    return this.db;
  }

  /** Close the connection (tests). */
  close(): void {
    this.db?.close();
    this.db = null;
  }

  private static checkSlot(slot: number): void {
    if (!Number.isInteger(slot) || slot < MIN_SLOT || slot > MAX_SLOT) throw new Error(`slot must be between ${MIN_SLOT} and ${MAX_SLOT}`);
  }

  async listSlots(): Promise<SlotInfo[]> {
    const tx = this.d().transaction(['slots', 'revisions'], 'readonly');
    const slots = (await req(tx.objectStore('slots').getAll())) as SlotRecord[];
    const out: SlotInfo[] = [];
    for (const s of slots.sort((a, b) => a.slot - b.slot)) {
      const rev = (await req(tx.objectStore('revisions').get([s.slot, s.revision]))) as RevisionRecord | undefined;
      out.push({ slot: s.slot, name: s.name, createdAt: s.createdAt, updatedAt: s.updatedAt, revision: s.revision, season: s.season, day: s.day, clubName: s.clubName, bytes: rev?.bytes ?? 0 });
    }
    return out;
  }

  async save(slot: number, name: string, world: WorldState): Promise<SlotInfo> {
    IdbSaveStore.checkSlot(slot);
    const chunks = encodeWorld(world);
    const checksum = checksumOf(chunks);
    const bytes = chunks.reduce((a, c) => a + c.data.length, 0);
    const clubName = world.config.humanClubId ? (world.clubs[world.config.humanClubId]?.name ?? null) : null;
    const ts = this.now();
    const tx = this.d().transaction(['slots', 'revisions', 'chunks'], 'readwrite');
    const done = txDone(tx);
    try {
      const slots = tx.objectStore('slots');
      const existing = (await req(slots.get(slot))) as SlotRecord | undefined;
      const revision = (existing?.revision ?? 0) + 1;
      const revs = tx.objectStore('revisions');
      const chunkStore = tx.objectStore('chunks');
      revs.put({ slot, revision, checksum, chunkCount: chunks.length, bytes, createdAt: ts } satisfies RevisionRecord);
      for (const c of chunks) chunkStore.put({ slot, revision, kind: c.kind, idx: c.idx, data: c.data } satisfies ChunkRecord);
      slots.put({
        slot, name, createdAt: existing?.createdAt ?? ts, updatedAt: ts, revision, season: world.season, day: world.day, clubName, worldSchema: world.schemaVersion,
      } satisfies SlotRecord);
      // prune old revisions (and their chunks)
      for (let r = Math.max(1, revision - this.keep - 3); r <= revision - this.keep; r++) {
        revs.delete([slot, r]);
        chunkStore.delete(IDBKeyRange.bound([slot, r, ''], [slot, r, '￿']));
      }
    } catch (e) {
      try { tx.abort(); } catch { /* already finished */ }
      await done.catch(() => undefined);
      throw e;
    }
    await done;
    const info = (await this.listSlots()).find((s) => s.slot === slot);
    if (!info) throw new Error('save succeeded but slot not found');
    return info;
  }

  private async loadRevision(slot: number, revision: number): Promise<WorldState> {
    const tx = this.d().transaction(['revisions', 'chunks'], 'readonly');
    const rev = (await req(tx.objectStore('revisions').get([slot, revision]))) as RevisionRecord | undefined;
    if (!rev) throw new SaveCorruptedError(`revision ${revision} missing`);
    const rows = (await req(tx.objectStore('chunks').getAll(IDBKeyRange.bound([slot, revision, ''], [slot, revision, '￿'])))) as ChunkRecord[];
    if (rows.length !== rev.chunkCount) throw new SaveCorruptedError(`revision ${revision} has ${rows.length} chunks, expected ${rev.chunkCount}`);
    const sorted = sortCanonical(rows);
    if (checksumOf(sorted) !== rev.checksum) throw new SaveCorruptedError(`revision ${revision} failed its checksum`);
    return decodeWorld(sorted);
  }

  private async revisionNumbers(slot: number): Promise<number[]> {
    const tx = this.d().transaction('revisions', 'readonly');
    const rows = (await req(tx.objectStore('revisions').getAll(IDBKeyRange.bound([slot, 0], [slot, Number.MAX_SAFE_INTEGER])))) as RevisionRecord[];
    return rows.map((r) => r.revision).sort((a, b) => b - a);
  }

  async load(slot: number): Promise<LoadResult> {
    const revs = await this.revisionNumbers(slot);
    if (revs.length === 0) throw new Error(`No save in slot ${slot}`);
    const errors: string[] = [];
    for (let i = 0; i < revs.length; i++) {
      const revision = revs[i] as number;
      try {
        return { world: await this.loadRevision(slot, revision), revision, recoveredFromFallback: i > 0 };
      } catch (e) {
        errors.push(`r${revision}: ${(e as Error).message}`);
      }
    }
    throw new SaveCorruptedError(`Slot ${slot} has no valid revision (${errors.join('; ')})`);
  }

  async verify(slot: number): Promise<VerifyResult> {
    const revs = await this.revisionNumbers(slot);
    const revisions: VerifyResult['revisions'] = [];
    for (const revision of revs) {
      try { await this.loadRevision(slot, revision); revisions.push({ revision, ok: true }); }
      catch (e) { revisions.push({ revision, ok: false, error: (e as Error).message }); }
    }
    return { ok: revisions.length > 0 && revisions[0]?.ok === true, revisions };
  }

  async deleteSlot(slot: number): Promise<void> {
    const tx = this.d().transaction(['slots', 'revisions', 'chunks'], 'readwrite');
    tx.objectStore('slots').delete(slot);
    tx.objectStore('revisions').delete(IDBKeyRange.bound([slot, 0], [slot, Number.MAX_SAFE_INTEGER]));
    tx.objectStore('chunks').delete(IDBKeyRange.bound([slot, 0], [slot, Number.MAX_SAFE_INTEGER, '￿']));
    await txDone(tx);
  }

  async renameSlot(slot: number, name: string): Promise<void> {
    const tx = this.d().transaction('slots', 'readwrite');
    const store = tx.objectStore('slots');
    const rec = (await req(store.get(slot))) as SlotRecord | undefined;
    if (rec) store.put({ ...rec, name, updatedAt: this.now() });
    await txDone(tx);
  }

  async getSetting(key: string): Promise<string | null> {
    const rec = (await req(this.d().transaction('settings', 'readonly').objectStore('settings').get(key))) as { key: string; value: string } | undefined;
    return rec?.value ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const tx = this.d().transaction('settings', 'readwrite');
    tx.objectStore('settings').put({ key, value });
    await txDone(tx);
  }

  async exportSlot(slot: number): Promise<string> {
    const { world } = await this.load(slot);
    const chunks = encodeWorld(world);
    return JSON.stringify({ format: 'football-universe-save', version: 1, checksum: checksumOf(chunks), chunks });
  }

  async importSlot(slot: number, name: string, doc: string): Promise<SlotInfo> {
    let parsed: { format?: string; checksum?: string; chunks?: unknown };
    try { parsed = JSON.parse(doc) as typeof parsed; } catch { throw new Error('Not a Football Universe save file'); }
    if (typeof parsed !== 'object' || parsed === null || parsed.format !== 'football-universe-save' || !parsed.chunks) throw new Error('Not a Football Universe save file');
    assertChunkList(parsed.chunks);
    const chunks = sortCanonical(parsed.chunks);
    if (checksumOf(chunks) !== parsed.checksum) throw new SaveCorruptedError('Imported file failed its checksum');
    return this.save(slot, name, decodeWorld(chunks));
  }
}
