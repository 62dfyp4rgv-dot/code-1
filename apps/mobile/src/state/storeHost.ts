import { createSaveStore } from '../core/saves/createStore';
import type { SaveStore } from '../core/saves/types';

let instance: SaveStore | null = null;

/** Lazily created platform store (SQLite on iOS/Android, IndexedDB on web). */
export function getSaveStore(): SaveStore {
  if (!instance) instance = createSaveStore();
  return instance;
}

/** Tests can inject a fake. */
export function setSaveStore(s: SaveStore | null): void {
  instance = s;
}
