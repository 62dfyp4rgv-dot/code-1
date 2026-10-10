import type { SlotInfo, WorldState } from '@fu/engine';
import type { LoadResult, SaveStore, VerifyResult } from './types';

/** Runs every store call strictly one after another so concurrent UI actions can never interleave inside a SQL transaction. */
export class SerializedSaveStore implements SaveStore {
  private tail: Promise<unknown> = Promise.resolve();
  constructor(private readonly inner: SaveStore) {}

  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.tail.then(fn, fn);
    this.tail = run.catch(() => undefined);
    return run;
  }

  init(): Promise<void> { return this.enqueue(() => this.inner.init()); }
  listSlots(): Promise<SlotInfo[]> { return this.enqueue(() => this.inner.listSlots()); }
  save(slot: number, name: string, world: WorldState): Promise<SlotInfo> { return this.enqueue(() => this.inner.save(slot, name, world)); }
  load(slot: number): Promise<LoadResult> { return this.enqueue(() => this.inner.load(slot)); }
  verify(slot: number): Promise<VerifyResult> { return this.enqueue(() => this.inner.verify(slot)); }
  deleteSlot(slot: number): Promise<void> { return this.enqueue(() => this.inner.deleteSlot(slot)); }
  renameSlot(slot: number, name: string): Promise<void> { return this.enqueue(() => this.inner.renameSlot(slot, name)); }
  getSetting(key: string): Promise<string | null> { return this.enqueue(() => this.inner.getSetting(key)); }
  setSetting(key: string, value: string): Promise<void> { return this.enqueue(() => this.inner.setSetting(key, value)); }
  exportSlot(slot: number): Promise<string> { return this.enqueue(() => this.inner.exportSlot(slot)); }
  importSlot(slot: number, name: string, doc: string): Promise<SlotInfo> { return this.enqueue(() => this.inner.importSlot(slot, name, doc)); }
}
