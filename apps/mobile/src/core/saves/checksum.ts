import { canonicalOrder, checksumOf as engineChecksumOf, CHUNK_ORDER as ENGINE_CHUNK_ORDER } from '@fu/engine';

export interface ChunkLike { kind: string; idx: number; data: string }

/** Single source of truth: the engine codec owns chunk order and the checksum so every store stays byte-compatible. */
export const CHUNK_ORDER: readonly string[] = ENGINE_CHUNK_ORDER;
export const checksumOf = (chunks: readonly ChunkLike[]): string => engineChecksumOf(chunks);
export const sortCanonical = <T extends ChunkLike>(chunks: readonly T[]): T[] => canonicalOrder(chunks);
