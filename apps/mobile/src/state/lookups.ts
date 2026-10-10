import { getWorld, getPendingWorld } from './worldHost';

const FALLBACK: [string, string] = ['#2F6F4F', '#E8EEEA'];

/** Club colours straight from the engine club record (read-only). Works for the pending (onboarding) world too. */
export function clubColors(clubId: string | null | undefined): [string, string] {
  if (!clubId) return FALLBACK;
  const c = getWorld()?.clubs[clubId] ?? getPendingWorld()?.clubs[clubId];
  return c ? c.colors : FALLBACK;
}

export function clubName(clubId: string | null | undefined): string {
  if (!clubId) return '';
  return (getWorld()?.clubs[clubId] ?? getPendingWorld()?.clubs[clubId])?.name ?? clubId;
}

/** Optional local/embedded crest image from a data pack. Only file:// and small data:image URIs are ever rendered; never remote URLs. */
export function clubCrestUri(clubId: string | null | undefined): string | null {
  if (!clubId) return null;
  const uri = (getWorld()?.clubs[clubId] ?? getPendingWorld()?.clubs[clubId])?.crest;
  return uri && isRenderableCrest(uri) ? uri : null;
}

/** `asset:` crests are not resolvable here (they fall back to the generated crest); http(s) and anything else is refused. */
export function isRenderableCrest(uri: string): boolean {
  return /^file:\/\/\S+$/.test(uri) || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(uri);
}
