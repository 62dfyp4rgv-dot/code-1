/** Shared helpers for the independent QA suite (not a test file). */
import { createWorld, advanceDay, validateWorld, type WorldState, type WorldConfig } from '../src/index';
import { squadOf, freeAgents } from '../src/world/runtime';
export { squadOf, freeAgents };

export function cfg(seed: string, leagues: string[], preset: 'compact' | 'standard' = 'compact'): WorldConfig {
  return { seed, leagues, preset, humanClubId: null, archiveRecent: 400 };
}

export function hardViolations(w: WorldState, checkLedger = true) {
  return validateWorld(w, { checkLedger }).filter((v) => v.severity !== 'medium');
}

/** Advance until the final day of the current season (world.day is then the last day, rollover not yet run). */
export function advanceToLastDay(w: WorldState): void {
  const lastDay = w.season * 364 - 1;
  while (w.day < lastDay) advanceDay(w);
}

export function mean(a: number[]): number { return a.reduce((x, y) => x + y, 0) / Math.max(1, a.length); }
export function sd(a: number[]): number { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); }

export function humanWorld(seed: string, which: 'lowest' | 'highest' | number = 'lowest', leagues = ['ENG1']) {
  const w = createWorld(cfg(seed, leagues));
  const ranked = Object.values(w.clubs).sort((a, b) => a.reputation - b.reputation);
  const club = which === 'lowest' ? ranked[0]! : which === 'highest' ? ranked[ranked.length - 1]! : ranked[which]!;
  w.config.humanClubId = club.id;
  return { w, human: club.id };
}

import { COMPETITIONS } from '../src/index';
import type { CompetitionState, Fixture } from '../src/competition/types';
import type { Tiebreaker } from '../src/competition/types';

export interface Row { id: string; p: number; w: number; d: number; l: number; gf: number; ga: number; away: number; fair: number }

/** Independent league-table aggregation from played fixtures (does not use src/competition/standings). */
export function tableRows(ids: string[], fixtures: Fixture[]): Map<string, Row> {
  const m = new Map<string, Row>(ids.map((id) => [id, { id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, away: 0, fair: 0 }]));
  for (const f of fixtures) {
    if (f.status !== 'played' || !f.result) continue;
    const h = m.get(f.home), a = m.get(f.away);
    if (!h || !a) continue;
    const { homeGoals: hg, awayGoals: ag } = f.result;
    h.gf += hg; h.ga += ag; a.gf += ag; a.ga += hg; a.away += ag;
    h.fair += f.result.homeYellow + 3 * f.result.homeRed; a.fair += f.result.awayYellow + 3 * f.result.awayRed;
    if (hg > ag) { h.w++; a.l++; h.p += 3; } else if (hg < ag) { a.w++; h.l++; a.p += 3; } else { h.d++; a.d++; h.p++; a.p++; }
  }
  return m;
}

/** For exactly two tied clubs: does `a` rank above `b` under the tiebreak list? 1 above, -1 below, 0 = undecided by rules before lots. */
export function pairCompare(a: string, b: string, all: Map<string, Row>, fixtures: Fixture[], rules: Tiebreaker[]): number {
  const h2h = tableRows([a, b], fixtures.filter((f) => (f.home === a && f.away === b) || (f.home === b && f.away === a)));
  for (const r of rules) {
    let x = 0, y = 0;
    const A = all.get(a)!, B = all.get(b)!, HA = h2h.get(a)!, HB = h2h.get(b)!;
    switch (r) {
      case 'points': x = A.p; y = B.p; break;
      case 'goalDifference': x = A.gf - A.ga; y = B.gf - B.ga; break;
      case 'goalsFor': x = A.gf; y = B.gf; break;
      case 'wins': x = A.w; y = B.w; break;
      case 'awayGoals': x = A.away; y = B.away; break;
      case 'h2hPoints': x = HA.p; y = HB.p; break;
      case 'h2hGoalDifference': x = HA.gf - HA.ga; y = HB.gf - HB.ga; break;
      case 'h2hGoalsFor': x = HA.gf; y = HB.gf; break;
      case 'h2hAwayGoals': x = HA.away; y = HB.away; break;
      case 'fairPlay': x = -A.fair; y = -B.fair; break;
      case 'drawLots': return 0;
    }
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

/** Returns a list of problems with a completed round-robin league competition. */
export function auditLeague(comp: CompetitionState): string[] {
  const out: string[] = [];
  const def = COMPETITIONS[comp.id]!;
  const stage = def.rules[0]!.stages[0] as { legs: 1 | 2; tiebreakers: Tiebreaker[] };
  const ids = comp.entrants;
  const n = ids.length;
  const fx = comp.fixtures.filter((f) => f.stageId === 'league');
  const expected = n * (n - 1) * (stage.legs === 2 ? 1 : 0.5);
  if (stage.legs === 2 && fx.length !== expected) out.push(`${comp.id}: ${fx.length} fixtures, expected ${expected}`);
  if (fx.some((f) => f.status !== 'played')) out.push(`${comp.id}: unplayed fixtures`);
  if (stage.legs === 2) {
    const seen = new Set<string>();
    for (const f of fx) { const k = `${f.home}>${f.away}`; if (seen.has(k)) out.push(`${comp.id}: duplicate pairing ${k}`); seen.add(k); }
    for (const a of ids) for (const b of ids) if (a !== b && !seen.has(`${a}>${b}`)) out.push(`${comp.id}: missing ${a}>${b}`);
    for (const id of ids) {
      const home = fx.filter((f) => f.home === id).length, away = fx.filter((f) => f.away === id).length;
      if (home !== n - 1 || away !== n - 1) out.push(`${comp.id}: ${id} has ${home} home / ${away} away`);
    }
  }
  const rows = tableRows(ids, fx);
  const order = comp.tableOrder;
  if (new Set(order).size !== n || order.length !== n) out.push(`${comp.id}: tableOrder is not a permutation of entrants`);
  const rules = stage.tiebreakers.includes('points') ? stage.tiebreakers : (['points', ...stage.tiebreakers] as Tiebreaker[]);
  for (let i = 0; i + 1 < order.length; i++) {
    const a = rows.get(order[i]!)!, b = rows.get(order[i + 1]!)!;
    if (a.p < b.p) out.push(`${comp.id}: position ${i + 1} (${a.id}, ${a.p} pts) below ${b.id} (${b.p} pts)`);
    else if (a.p === b.p) {
      const tied = [...rows.values()].filter((r) => r.p === a.p).length;
      if (tied === 2 && pairCompare(a.id, b.id, rows, fx, rules) === -1) out.push(`${comp.id}: tie-break violated between ${a.id} and ${b.id}`);
    }
  }
  const hasPlayoffs = def.rules[0]!.stages.length > 1; // e.g. MLS: champion is the play-off winner, not the table leader
  if (!hasPlayoffs && comp.winner !== order[0]) out.push(`${comp.id}: winner ${comp.winner} != table leader ${order[0]}`);
  return out;
}
