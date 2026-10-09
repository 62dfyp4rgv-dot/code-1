/**
 * Save-slot repository on top of a SqlDriver.
 *  - schema is versioned with forward-only migrations (`DB_MIGRATIONS`),
 *  - a save writes a *new revision* inside one transaction, so a crash leaves the previous revision intact,
 *  - every revision stores a checksum over its chunks; `load` verifies it and falls back to the previous revision.
 */
import type { WorldState } from '../world/types';
import { checksumOf, decodeWorld, encodeWorld, type Chunk } from './codec';
import type { SqlDriver } from './driver';

export const DB_MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS save_slots (
        slot INTEGER PRIMARY KEY CHECK (slot BETWEEN 1 AND 50),
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        current_revision INTEGER NOT NULL,
        season INTEGER NOT NULL,
        day INTEGER NOT NULL,
        club_name TEXT,
        world_schema INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS save_revisions (
        slot INTEGER NOT NULL,
        revision INTEGER NOT NULL,
        checksum TEXT NOT NULL,
        chunk_count INTEGER NOT NULL,
        bytes INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (slot, revision),
        FOREIGN KEY (slot) REFERENCES save_slots(slot) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS save_chunks (
        slot INTEGER NOT NULL,
        revision INTEGER NOT NULL,
        kind TEXT NOT NULL,
        idx INTEGER NOT NULL,
        data TEXT NOT NULL,
        PRIMARY KEY (slot, revision, kind, idx),
        FOREIGN KEY (slot, revision) REFERENCES save_revisions(slot, revision) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `,
  },
];

export interface SlotInfo {
  slot: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  season: number;
  day: number;
  clubName: string | null;
  bytes: number;
}

export class SaveCorruptedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SaveCorruptedError';
  }
}

export interface RepositoryOptions {
  now?: () => string;
  /** Number of revisions kept per slot (>= 2 so a crash can always fall back). */
  keepRevisions?: number;
}

export class SaveRepository {
  private now: () => string;
  private keep: number;
  constructor(private db: SqlDriver, opts: RepositoryOptions = {}) {
    this.now = opts.now ?? ((): string => new Date().toISOString());
    this.keep = Math.max(2, opts.keepRevisions ?? 2);
  }

  async init(): Promise<void> {
    await this.db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);');
    const done = new Set((await this.db.all<{ version: number }>('SELECT version FROM schema_migrations')).map((r) => r.version));
    for (const m of DB_MIGRATIONS) {
      if (done.has(m.version)) continue;
      await this.db.transaction(async () => {
        await this.db.exec(m.sql);
        await this.db.run('INSERT INTO schema_migrations(version, applied_at) VALUES (?, ?)', [m.version, this.now()]);
      });
    }
  }

  async dbVersion(): Promise<number> {
    const rows = await this.db.all<{ v: number | null }>('SELECT MAX(version) AS v FROM schema_migrations');
    return rows[0]?.v ?? 0;
  }

  async listSlots(): Promise<SlotInfo[]> {
    const rows = await this.db.all<Record<string, unknown>>(
      `SELECT s.slot, s.name, s.created_at, s.updated_at, s.current_revision, s.season, s.day, s.club_name, COALESCE(r.bytes, 0) AS bytes
       FROM save_slots s LEFT JOIN save_revisions r ON r.slot = s.slot AND r.revision = s.current_revision ORDER BY s.slot`,
    );
    return rows.map((r) => ({
      slot: r.slot as number, name: r.name as string, createdAt: r.created_at as string, updatedAt: r.updated_at as string,
      revision: r.current_revision as number, season: r.season as number, day: r.day as number, clubName: (r.club_name as string | null) ?? null, bytes: r.bytes as number,
    }));
  }

  /** Write the world as a new revision. Atomic: either the new revision is fully visible or nothing changed. */
  async save(slot: number, name: string, world: WorldState, hooks: { afterChunk?: (i: number) => void } = {}): Promise<SlotInfo> {
    const chunks = encodeWorld(world);
    const checksum = checksumOf(chunks);
    const bytes = chunks.reduce((a, c) => a + c.data.length, 0);
    const clubName = world.config.humanClubId ? (world.clubs[world.config.humanClubId]?.name ?? null) : null;
    await this.db.transaction(async () => {
      const existing = await this.db.all<{ current_revision: number; created_at: string }>('SELECT current_revision, created_at FROM save_slots WHERE slot = ?', [slot]);
      const revision = (existing[0]?.current_revision ?? 0) + 1;
      const ts = this.now();
      if (existing.length === 0) {
        await this.db.run('INSERT INTO save_slots(slot, name, created_at, updated_at, current_revision, season, day, club_name, world_schema) VALUES (?,?,?,?,?,?,?,?,?)',
          [slot, name, ts, ts, 0, world.season, world.day, clubName, world.schemaVersion]);
      }
      await this.db.run('INSERT INTO save_revisions(slot, revision, checksum, chunk_count, bytes, created_at) VALUES (?,?,?,?,?,?)', [slot, revision, checksum, chunks.length, bytes, ts]);
      for (let i = 0; i < chunks.length; i++) {
        const c = chunks[i] as Chunk;
        await this.db.run('INSERT INTO save_chunks(slot, revision, kind, idx, data) VALUES (?,?,?,?,?)', [slot, revision, c.kind, c.idx, c.data]);
        hooks.afterChunk?.(i);
      }
      await this.db.run('UPDATE save_slots SET name = ?, updated_at = ?, current_revision = ?, season = ?, day = ?, club_name = ?, world_schema = ? WHERE slot = ?',
        [name, ts, revision, world.season, world.day, clubName, world.schemaVersion, slot]);
      await this.db.run('DELETE FROM save_revisions WHERE slot = ? AND revision <= ?', [slot, revision - this.keep]);
    });
    const info = (await this.listSlots()).find((s) => s.slot === slot);
    if (!info) throw new Error('save succeeded but slot not found');
    return info;
  }

  private async loadRevision(slot: number, revision: number): Promise<WorldState> {
    const rev = await this.db.all<{ checksum: string; chunk_count: number }>('SELECT checksum, chunk_count FROM save_revisions WHERE slot = ? AND revision = ?', [slot, revision]);
    if (rev.length === 0) throw new SaveCorruptedError(`revision ${revision} missing`);
    const rows = await this.db.all<{ kind: string; idx: number; data: string }>('SELECT kind, idx, data FROM save_chunks WHERE slot = ? AND revision = ? ORDER BY kind, idx', [slot, revision]);
    if (rows.length !== (rev[0] as { chunk_count: number }).chunk_count) throw new SaveCorruptedError(`revision ${revision} has ${rows.length} chunks, expected ${(rev[0] as { chunk_count: number }).chunk_count}`);
    // checksum was computed over chunks in encode order; recompute in the same canonical order
    const order = ['meta', 'clubs', 'managers', 'players', 'competition', 'seasonStats', 'matches', 'transfers', 'news'];
    const sorted = [...rows].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.idx - b.idx);
    if (checksumOf(sorted) !== (rev[0] as { checksum: string }).checksum) throw new SaveCorruptedError(`revision ${revision} failed its checksum`);
    return decodeWorld(sorted);
  }

  /** Load the newest valid revision; falls back to older revisions if the newest is damaged. */
  async load(slot: number): Promise<{ world: WorldState; revision: number; recoveredFromFallback: boolean }> {
    const rows = await this.db.all<{ revision: number }>('SELECT revision FROM save_revisions WHERE slot = ? ORDER BY revision DESC', [slot]);
    if (rows.length === 0) throw new Error(`No save in slot ${slot}`);
    const errors: string[] = [];
    for (let i = 0; i < rows.length; i++) {
      const revision = (rows[i] as { revision: number }).revision;
      try {
        const world = await this.loadRevision(slot, revision);
        return { world, revision, recoveredFromFallback: i > 0 };
      } catch (e) {
        errors.push(`r${revision}: ${(e as Error).message}`);
      }
    }
    throw new SaveCorruptedError(`Slot ${slot} has no valid revision (${errors.join('; ')})`);
  }

  async verify(slot: number): Promise<{ ok: boolean; revisions: { revision: number; ok: boolean; error?: string }[] }> {
    const rows = await this.db.all<{ revision: number }>('SELECT revision FROM save_revisions WHERE slot = ? ORDER BY revision DESC', [slot]);
    const revisions: { revision: number; ok: boolean; error?: string }[] = [];
    for (const r of rows) {
      try { await this.loadRevision(slot, r.revision); revisions.push({ revision: r.revision, ok: true }); }
      catch (e) { revisions.push({ revision: r.revision, ok: false, error: (e as Error).message }); }
    }
    return { ok: revisions.length > 0 && revisions[0]?.ok === true, revisions };
  }

  async deleteSlot(slot: number): Promise<void> {
    await this.db.run('DELETE FROM save_slots WHERE slot = ?', [slot]);
  }

  async renameSlot(slot: number, name: string): Promise<void> {
    await this.db.run('UPDATE save_slots SET name = ?, updated_at = ? WHERE slot = ?', [name, this.now(), slot]);
  }

  async getSetting(key: string): Promise<string | null> {
    const r = await this.db.all<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [key]);
    return r[0]?.value ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.db.run('INSERT INTO app_settings(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, value]);
  }

  /** Export the newest revision as a self-contained JSON document (for backups/sharing). */
  async exportSlot(slot: number): Promise<string> {
    const { world } = await this.load(slot);
    const chunks = encodeWorld(world);
    return JSON.stringify({ format: 'football-universe-save', version: 1, checksum: checksumOf(chunks), chunks });
  }

  async importSlot(slot: number, name: string, doc: string): Promise<SlotInfo> {
    const parsed = JSON.parse(doc) as { format?: string; checksum?: string; chunks?: Chunk[] };
    if (parsed.format !== 'football-universe-save' || !parsed.chunks) throw new Error('Not a Football Universe save file');
    if (checksumOf(parsed.chunks) !== parsed.checksum) throw new SaveCorruptedError('Imported file failed its checksum');
    return this.save(slot, name, decodeWorld(parsed.chunks));
  }
}
