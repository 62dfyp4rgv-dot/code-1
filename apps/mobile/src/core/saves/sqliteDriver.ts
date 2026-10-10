/**
 * expo-sqlite adapter for the engine's `SqlDriver` contract (used by `SaveRepository` on iOS/Android).
 *
 * API facts checked against the installed expo-sqlite 57 typings: `openDatabaseAsync`, `execAsync(sql)`,
 * `runAsync(sql, params[])`, `getAllAsync<T>(sql, params[])`. Transactions are issued as plain SQL on the single
 * connection (the repository only awaits sequentially inside a transaction, and `SerializedSaveStore` prevents any
 * other repository call from interleaving).
 *
 * NOT verifiable in this sandbox (no device): the native module itself. The adapter logic is unit-tested against a
 * node:sqlite-backed double of `SqliteLike` (test/expoSqliteDriver.test.ts).
 */
import type { SqlDriver, SqlValue } from '@fu/engine';

/** The subset of `SQLiteDatabase` we use. */
export interface SqliteLike {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: SqlValue[]): Promise<unknown>;
  getAllAsync<T>(sql: string, params: SqlValue[]): Promise<T[]>;
  closeAsync?(): Promise<void>;
}

export class ExpoSqliteDriver implements SqlDriver {
  private depth = 0;
  constructor(private readonly db: SqliteLike) {}

  /** Open (or create) the database file via expo-sqlite. Imported lazily so non-native bundles never load the module. */
  static async open(name = 'football-universe.db'): Promise<ExpoSqliteDriver> {
    const SQLite = await import('expo-sqlite');
    const db = await SQLite.openDatabaseAsync(name);
    await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    return new ExpoSqliteDriver(db as unknown as SqliteLike);
  }

  async exec(sql: string): Promise<void> {
    await this.db.execAsync(sql);
  }

  async run(sql: string, params: SqlValue[] = []): Promise<void> {
    await this.db.runAsync(sql, params);
  }

  async all<T = Record<string, unknown>>(sql: string, params: SqlValue[] = []): Promise<T[]> {
    return this.db.getAllAsync<T>(sql, params);
  }

  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    if (this.depth > 0) return fn();
    await this.db.execAsync('BEGIN IMMEDIATE');
    this.depth++;
    try {
      const out = await fn();
      await this.db.execAsync('COMMIT');
      return out;
    } catch (e) {
      try { await this.db.execAsync('ROLLBACK'); } catch { /* connection may already have rolled back */ }
      throw e;
    } finally {
      this.depth--;
    }
  }

  async close(): Promise<void> {
    await this.db.closeAsync?.();
  }
}
