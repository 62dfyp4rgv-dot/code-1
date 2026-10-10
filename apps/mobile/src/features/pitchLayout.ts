import type { Position } from '@fu/engine';

const LINE_Y: Record<Position, number> = { GK: 0.91, CB: 0.73, LB: 0.73, RB: 0.73, DM: 0.58, CM: 0.46, AM: 0.33, LW: 0.27, RW: 0.27, ST: 0.1 };
const SIDE: Partial<Record<Position, number>> = { LB: 0, LW: 0, RB: 2, RW: 2 };

export function layoutSlots(slots: readonly Position[]): { x: number; y: number }[] {
  // Slots with the same vertical line are spread horizontally: left-sided positions first, centre in formation order, right-sided last.
  const byLine = new Map<number, number[]>();
  slots.forEach((p, i) => {
    const y = LINE_Y[p];
    byLine.set(y, [...(byLine.get(y) ?? []), i]);
  });
  const out: { x: number; y: number }[] = new Array(slots.length);
  for (const [y, idxs] of byLine) {
    const sorted = [...idxs].sort((a, b) => (SIDE[slots[a] as Position] ?? 1) - (SIDE[slots[b] as Position] ?? 1) || a - b);
    sorted.forEach((slotIndex, k) => { out[slotIndex] = { x: (k + 1) / (sorted.length + 1), y }; });
  }
  return out;
}

