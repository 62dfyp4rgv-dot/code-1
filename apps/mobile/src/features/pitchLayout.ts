import type { Position } from '@fu/engine';

const LINE_Y: Record<Position, number> = { GK: 0.9, CB: 0.7, LB: 0.7, RB: 0.7, DM: 0.54, CM: 0.42, AM: 0.28, LW: 0.22, RW: 0.22, ST: 0.08 };
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

