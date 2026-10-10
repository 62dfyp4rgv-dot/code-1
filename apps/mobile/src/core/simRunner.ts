/**
 * Time-sliced simulation runner. The engine advances one day per call (synchronously); on-device JS is much slower
 * than desktop Node, so we run days until a small time budget is spent, then yield to the event loop so React can
 * paint progress and handle the cancel button. All collaborators are injected so the logic is unit-testable.
 */
import type { DayReport } from '@fu/engine';

export type SimPlan =
  | { kind: 'days'; days: number }
  | { kind: 'nextMatchday'; maxDays?: number }
  | { kind: 'endOfSeason' };

export interface SimProgress {
  plan: SimPlan;
  daysDone: number;
  /** Total days if known up-front, otherwise null (match day / end of season are estimated). */
  daysTarget: number | null;
  matchesPlayed: number;
  humanMatches: number;
  season: number;
  day: number;
  seasonEnded: boolean;
  cancelled: boolean;
  finished: boolean;
  elapsedMs: number;
}

export interface SimWorldLike { day: number; season: number }

export interface SimDeps {
  world: SimWorldLike;
  advance: () => DayReport;
  now: () => number;
  /** Yield to the event loop (setTimeout 0 / requestAnimationFrame). */
  yieldToUi: () => Promise<void>;
  /** Called after each slice (and once at the end). */
  onProgress?: (p: SimProgress) => void;
  isCancelled: () => boolean;
  /** Max milliseconds of synchronous work per slice. */
  budgetMs?: number;
  /** Day after which `endOfSeason` is estimated to finish (for progress bars). */
  daysInSeason?: number;
  /** Safety valve so a bug can never spin forever. */
  hardDayLimit?: number;
}

export const DEFAULT_BUDGET_MS = 24;

export async function runSimulation(plan: SimPlan, deps: SimDeps): Promise<SimProgress> {
  const budget = deps.budgetMs ?? DEFAULT_BUDGET_MS;
  const limit = deps.hardDayLimit ?? 800;
  const startSeason = deps.world.season;
  const t0 = deps.now();
  const progress: SimProgress = {
    plan, daysDone: 0, daysTarget: plan.kind === 'days' ? Math.max(0, Math.floor(plan.days)) : plan.kind === 'nextMatchday' ? null : (deps.daysInSeason ?? 364),
    matchesPlayed: 0, humanMatches: 0, season: deps.world.season, day: deps.world.day, seasonEnded: false, cancelled: false, finished: false, elapsedMs: 0,
  };
  const maxDays = plan.kind === 'days' ? progress.daysTarget ?? 0 : plan.kind === 'nextMatchday' ? (plan.maxDays ?? 30) : limit;
  let stop = false;

  const emit = (): void => {
    progress.elapsedMs = deps.now() - t0;
    progress.season = deps.world.season;
    progress.day = deps.world.day;
    deps.onProgress?.({ ...progress });
  };

  while (!stop) {
    const sliceStart = deps.now();
    do {
      if (deps.isCancelled()) { progress.cancelled = true; stop = true; break; }
      if (progress.daysDone >= maxDays) { stop = true; break; }
      const r = deps.advance();
      progress.daysDone += 1;
      progress.matchesPlayed += r.matches.length;
      const human = r.matches.filter((m) => m.humanInvolved).length;
      progress.humanMatches += human;
      if (r.seasonEnded) progress.seasonEnded = true;
      if (plan.kind === 'nextMatchday' && human > 0) stop = true;
      if (plan.kind === 'endOfSeason' && deps.world.season !== startSeason) stop = true;
      if (progress.daysDone >= maxDays) stop = true;
    } while (!stop && deps.now() - sliceStart < budget);
    emit();
    if (!stop) await deps.yieldToUi();
  }
  progress.finished = true;
  emit();
  return { ...progress };
}

/** Yield helper for real runtimes. */
export const yieldToUi = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
