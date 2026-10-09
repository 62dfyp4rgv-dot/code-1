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
