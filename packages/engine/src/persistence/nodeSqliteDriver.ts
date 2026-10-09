/** node:sqlite adapter. Imported only by tests and CLI tools, never by the mobile bundle. */
import { DatabaseSync } from 'node:sqlite';
import type { SqlDriver, SqlValue } from './driver';

export class NodeSqliteDriver implements SqlDriver {
  private db: DatabaseSync;
  private depth = 0;
  constructor(path = ':memory:') {
    this.db = new DatabaseSync(path);
    this.db.exec('PRAGMA foreign_keys = ON;');
  }
  async exec(sql: string): Promise<void> { this.db.exec(sql); }
  async run(sql: string, params: SqlValue[] = []): Promise<void> { this.db.prepare(sql).run(...params); }
  async all<T = Record<string, unknown>>(sql: string, params: SqlValue[] = []): Promise<T[]> { return this.db.prepare(sql).all(...params) as T[]; }
  async transaction<T>(fn: () => Promise<T>): Promise<T> {
    if (this.depth > 0) return fn();
    this.db.exec('BEGIN IMMEDIATE');
    this.depth++;
    try {
      const out = await fn();
      this.db.exec('COMMIT');
      return out;
    } catch (e) {
      this.db.exec('ROLLBACK');
      throw e;
    } finally {
      this.depth--;
    }
  }
  close(): void { this.db.close(); }
}
