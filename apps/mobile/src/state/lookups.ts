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
