import { SaveRepository } from '@fu/engine';
import { ExpoSqliteDriver } from './sqliteDriver';
import { SerializedSaveStore } from './serialized';
import type { LoadResult, SaveStore } from './types';

export const storeKind = 'sqlite' as const;

/** Opens the SQLite database lazily on `init()`, then delegates to the engine's SaveRepository. */
class LazySqliteStore implements SaveStore {
  private repo: SaveRepository | null = null;
  async init(): Promise<void> {
    if (this.repo) return;
    const driver = await ExpoSqliteDriver.open();
    const repo = new SaveRepository(driver);
    await repo.init();
    this.repo = repo;
  }
  private r(): SaveRepository {
    if (!this.repo) throw new Error('save store not initialised');
    return this.repo;
  }
  listSlots(): ReturnType<SaveStore['listSlots']> { return this.r().listSlots(); }
  save: SaveStore['save'] = (slot, name, world) => this.r().save(slot, name, world);
  load(slot: number): Promise<LoadResult> { return this.r().load(slot); }
  verify(slot: number): ReturnType<SaveStore['verify']> { return this.r().verify(slot); }
  deleteSlot(slot: number): Promise<void> { return this.r().deleteSlot(slot); }
  renameSlot(slot: number, name: string): Promise<void> { return this.r().renameSlot(slot, name); }
  getSetting(key: string): Promise<string | null> { return this.r().getSetting(key); }
  setSetting(key: string, value: string): Promise<void> { return this.r().setSetting(key, value); }
  exportSlot(slot: number): Promise<string> { return this.r().exportSlot(slot); }
  importSlot(slot: number, name: string, doc: string): ReturnType<SaveStore['importSlot']> { return this.r().importSlot(slot, name, doc); }
}

export function createSaveStore(): SaveStore {
  return new SerializedSaveStore(new LazySqliteStore());
}
