import { hashString } from '@fu/engine';

export interface ChunkLike { kind: string; idx: number; data: string }

/** Canonical chunk order used by the engine codec (encode order). */
export const CHUNK_ORDER = ['meta', 'clubs', 'managers', 'players', 'competition', 'seasonStats', 'matches', 'transfers', 'news'];

/**
 * Must stay byte-compatible with the engine's `checksumOf` (persistence/codec.ts) so that exports from the web store
 * can be imported by the SQLite repository and vice versa. Cross-checked in test/idbStore.test.ts.
 */
export function checksumOf(chunks: readonly ChunkLike[]): string {
  let h = 0;
  for (const c of chunks) h = hashString(`${c.kind}:${c.idx}:${hashString(c.data)}`, h % 2147483647);
  return h.toString(36) + '-' + chunks.length.toString(36);
}

export function sortCanonical<T extends ChunkLike>(chunks: readonly T[]): T[] {
  return [...chunks].sort((a, b) => CHUNK_ORDER.indexOf(a.kind) - CHUNK_ORDER.indexOf(b.kind) || a.idx - b.idx);
}
