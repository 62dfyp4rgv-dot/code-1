import type { SlotInfo, WorldState } from '@fu/engine';

export interface LoadResult { world: WorldState; revision: number; recoveredFromFallback: boolean }
export interface VerifyResult { ok: boolean; revisions: { revision: number; ok: boolean; error?: string }[] }

/** Platform-neutral save-slot store. `SaveRepository` (SQLite) and `IdbSaveStore` (web) both implement it. */
export interface SaveStore {
  init(): Promise<void>;
  listSlots(): Promise<SlotInfo[]>;
  save(slot: number, name: string, world: WorldState): Promise<SlotInfo>;
  load(slot: number): Promise<LoadResult>;
  verify(slot: number): Promise<VerifyResult>;
  deleteSlot(slot: number): Promise<void>;
  renameSlot(slot: number, name: string): Promise<void>;
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  exportSlot(slot: number): Promise<string>;
  importSlot(slot: number, name: string, doc: string): Promise<SlotInfo>;
}

export const MIN_SLOT = 1;
export const MAX_SLOT = 50;
