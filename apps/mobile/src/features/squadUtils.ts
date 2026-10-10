import type { PlayerRow, Position } from '@fu/engine';

export type SortKey = 'position' | 'ability' | 'age' | 'value' | 'form' | 'condition' | 'goals';
export type PosFilter = 'all' | 'GK' | 'DEF' | 'MID' | 'FWD' | 'unavailable';

const GROUP: Record<Position, 'GK' | 'DEF' | 'MID' | 'FWD'> = { GK: 'GK', CB: 'DEF', LB: 'DEF', RB: 'DEF', DM: 'MID', CM: 'MID', AM: 'MID', LW: 'FWD', RW: 'FWD', ST: 'FWD' };
const POS_ORDER: Position[] = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'];

export function posGroup(p: Position): 'GK' | 'DEF' | 'MID' | 'FWD' {
  return GROUP[p];
}

export function isUnavailable(r: PlayerRow): boolean {
  return r.injury !== null || r.suspended;
}

export function filterSquad(rows: readonly PlayerRow[], filter: PosFilter, query: string): PlayerRow[] {
  const q = query.trim().toLowerCase();
  return rows.filter((r) => {
    if (filter === 'unavailable' ? !isUnavailable(r) : filter !== 'all' && posGroup(r.position) !== filter) return false;
    return !q || r.name.toLowerCase().includes(q) || r.nationality.toLowerCase().includes(q);
  });
}

export function sortSquad(rows: readonly PlayerRow[], key: SortKey): PlayerRow[] {
  const out = [...rows];
  const byAbility = (a: PlayerRow, b: PlayerRow): number => b.ability - a.ability;
  switch (key) {
    case 'position': return out.sort((a, b) => POS_ORDER.indexOf(a.position) - POS_ORDER.indexOf(b.position) || byAbility(a, b));
    case 'ability': return out.sort(byAbility);
    case 'age': return out.sort((a, b) => a.age - b.age || byAbility(a, b));
    case 'value': return out.sort((a, b) => b.value - a.value);
    case 'form': return out.sort((a, b) => b.form - a.form || byAbility(a, b));
    case 'condition': return out.sort((a, b) => a.fatigue - b.fatigue || byAbility(a, b));
    case 'goals': return out.sort((a, b) => b.goals - a.goals || b.assists - a.assists || byAbility(a, b));
  }
}

/** Convert a display-currency amount (in millions) to EUR using the fixed display rate. */
export function millionsToEur(amountM: number, rate: number): number {
  return Math.round((amountM * 1e6) / rate);
}
export function eurToMillions(eur: number, rate: number): number {
  return Math.round(((eur * rate) / 1e6) * 100) / 100;
}
