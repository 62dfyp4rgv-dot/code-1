import { IdbSaveStore } from './idbStore';
import { SerializedSaveStore } from './serialized';
import type { SaveStore } from './types';

export const storeKind = 'indexeddb' as const;

export function createSaveStore(): SaveStore {
  return new SerializedSaveStore(new IdbSaveStore());
}
