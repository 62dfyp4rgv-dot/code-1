import type { PlayerRow, Position } from '@fu/engine';

/** Greedy best-available XI used to pre-fill the picker (the engine's own automatic picker is not part of the public API). */
export function suggestXi(slots: readonly Position[], squad: readonly PlayerRow[], fitOf: (id: string, pos: Position) => number): (string | null)[] {
  const used = new Set<string>();
  const xi: (string | null)[] = slots.map(() => null);
  const order = slots.map((_, i) => i).sort((a, b) => (slots[a] === 'GK' ? -1 : slots[b] === 'GK' ? 1 : 0));
  for (const i of order) {
    const pos = slots[i] as Position;
    const best = squad.filter((p) => !used.has(p.id) && !p.injury && !p.suspended && (pos === 'GK') === (p.position === 'GK')).sort((a, b) => fitOf(b.id, pos) - fitOf(a.id, pos))[0];
    if (best) { xi[i] = best.id; used.add(best.id); }
  }
  return xi;
}
