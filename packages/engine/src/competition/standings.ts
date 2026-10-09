import { hashString } from '../rng';
import type { Fixture, TableRow, Tiebreaker } from './types';

const H2H: ReadonlySet<Tiebreaker> = new Set<Tiebreaker>(['h2hPoints', 'h2hGoalDifference', 'h2hGoalsFor', 'h2hAwayGoals']);

function blankRow(clubId: string): TableRow {
  return {
    clubId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0,
    awayGoals: 0, fairPlay: 0, position: 0,
  };
}

/** Aggregate played fixtures among `clubIds` into table rows (unordered). */
export function aggregateRows(clubIds: readonly string[], fixtures: readonly Fixture[], pointsForWin: number): Map<string, TableRow> {
  const rows = new Map<string, TableRow>();
  for (const id of clubIds) rows.set(id, blankRow(id));
  for (const f of fixtures) {
    if (f.status !== 'played' || !f.result) continue;
    const h = rows.get(f.home);
    const a = rows.get(f.away);
    if (!h || !a) continue; // fixture involving a club outside this table
    const { homeGoals: hg, awayGoals: ag } = f.result;
    h.played++; a.played++;
    h.goalsFor += hg; h.goalsAgainst += ag;
    a.goalsFor += ag; a.goalsAgainst += hg;
    a.awayGoals += ag;
    h.fairPlay += f.result.homeYellow + 3 * f.result.homeRed;
    a.fairPlay += f.result.awayYellow + 3 * f.result.awayRed;
    if (hg > ag) { h.won++; a.lost++; h.points += pointsForWin; }
    else if (hg < ag) { a.won++; h.lost++; a.points += pointsForWin; }
    else { h.drawn++; a.drawn++; h.points++; a.points++; }
  }
  for (const r of rows.values()) r.goalDifference = r.goalsFor - r.goalsAgainst;
  return rows;
}

function keyFor(rule: Tiebreaker, r: TableRow, seed: string): number {
  switch (rule) {
    case 'points': case 'h2hPoints': return r.points;
    case 'goalDifference': case 'h2hGoalDifference': return r.goalDifference;
    case 'goalsFor': case 'h2hGoalsFor': return r.goalsFor;
    case 'wins': return r.won;
    case 'awayGoals': case 'h2hAwayGoals': return r.awayGoals;
    case 'fairPlay': return -r.fairPlay; // fewer cards is better
    case 'drawLots': return hashString(`${seed}:${r.clubId}`);
  }
}

/**
 * Order clubs by the tiebreaker list. Head-to-head criteria are evaluated on a mini-table of only the tied
 * clubs and, when they separate some but not all of them, are re-applied to the remaining tied subset
 * (the usual UEFA/La Liga procedure). Always terminates in a total order via a deterministic final lot.
 */
export function computeTable(
  clubIds: readonly string[], fixtures: readonly Fixture[], tiebreakers: readonly Tiebreaker[], pointsForWin: number, seed: string,
): TableRow[] {
  const full = aggregateRows(clubIds, fixtures, pointsForWin);
  const rules: Tiebreaker[] = tiebreakers.includes('points') ? [...tiebreakers] : ['points', ...tiebreakers];
  if (!rules.includes('drawLots')) rules.push('drawLots');

  const rank = (group: string[], from: number): string[] => {
    if (group.length <= 1) return group;
    for (let i = from; i < rules.length; i++) {
      const rule = rules[i] as Tiebreaker;
      let rowsFor: Map<string, TableRow> = full;
      if (H2H.has(rule)) {
        const set = new Set(group);
        rowsFor = aggregateRows(group, fixtures.filter((f) => set.has(f.home) && set.has(f.away)), pointsForWin);
      }
      const keyed = group.map((id) => ({ id, k: keyFor(rule, rowsFor.get(id) as TableRow, seed) }));
      keyed.sort((x, y) => y.k - x.k);
      const buckets: string[][] = [];
      let lastKey = Number.NaN;
      for (const item of keyed) {
        if (buckets.length > 0 && item.k === lastKey) (buckets[buckets.length - 1] as string[]).push(item.id);
        else buckets.push([item.id]);
        lastKey = item.k;
      }
      if (buckets.length === 1) continue; // rule did not separate anyone
      let blockStart = i;
      while (blockStart > 0 && H2H.has(rules[blockStart - 1] as Tiebreaker) && H2H.has(rule)) blockStart--;
      const out: string[] = [];
      for (const b of buckets) {
        if (b.length === 1) out.push(...b);
        else if (H2H.has(rule) && b.length < group.length) out.push(...rank(b, blockStart));
        else out.push(...rank(b, i + 1));
      }
      return out;
    }
    return group;
  };

  const ordered = rank([...clubIds], 0);
  return ordered.map((id, idx) => {
    const row = { ...(full.get(id) as TableRow) };
    row.position = idx + 1;
    return row;
  });
}
