/** Minimal async SQL driver contract. Implemented by expo-sqlite in the app and node:sqlite in tests/tools. */
export type SqlValue = string | number | null;

export interface SqlDriver {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: SqlValue[]): Promise<void>;
  all<T = Record<string, unknown>>(sql: string, params?: SqlValue[]): Promise<T[]>;
  /** Runs `fn` inside one transaction; any thrown error rolls everything back. */
  transaction<T>(fn: () => Promise<T>): Promise<T>;
}
