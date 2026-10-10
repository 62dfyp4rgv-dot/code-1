/**
 * The engine world is a large, mutable object graph. It lives HERE, outside React state; React only sees the
 * `version` counter in the game store and re-reads through engine views after each mutation.
 */
import type { WorldState } from '@fu/engine';

let current: WorldState | null = null;
let pending: WorldState | null = null;

export const getWorld = (): WorldState | null => current;
export function requireWorld(): WorldState {
  if (!current) throw new Error('No career loaded');
  return current;
}
export function setWorld(w: WorldState | null): void {
  current = w;
}
/** A freshly generated world awaiting club selection (onboarding). */
export const getPendingWorld = (): WorldState | null => pending;
export function setPendingWorld(w: WorldState | null): void {
  pending = w;
}
