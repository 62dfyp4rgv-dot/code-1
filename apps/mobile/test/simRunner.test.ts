import { describe, expect, it } from 'vitest';
import type { DayReport } from '@fu/engine';
import { runSimulation, type SimDeps, type SimProgress } from '../src/core/simRunner';

function harness(opts: { humanOnDays?: number[]; seasonEndsOnDay?: number; msPerDay?: number } = {}) {
  const world = { day: 0, season: 1 };
  let clock = 0;
  let yields = 0;
  const progress: SimProgress[] = [];
  let cancel = false;
  const advance = (): DayReport => {
    const day = world.day;
    const seasonEnded = opts.seasonEndsOnDay === day;
    world.day += 1;
    if (seasonEnded) world.season += 1;
    clock += opts.msPerDay ?? 10;
    const human = opts.humanOnDays?.includes(day) ?? false;
    return { day, season: world.season, seasonEnded, matches: [{ fixtureId: 'f', competitionId: 'c', home: 'a', away: 'b', homeGoals: 1, awayGoals: 0, humanInvolved: human }] };
  };
  return {
    world, progress, setCancel: (v: boolean) => { cancel = v; }, yields: () => yields,
    deps: { world, advance, now: () => clock, yieldToUi: async () => { yields++; }, onProgress: (p: SimProgress): void => { progress.push(p); }, isCancelled: () => cancel, budgetMs: 25 } as SimDeps,
  };
}

describe('runSimulation', () => {
  it('advances exactly N days and yields to the UI between time slices', async () => {
    const h = harness({ msPerDay: 10 });
    const res = await runSimulation({ kind: 'days', days: 7 }, h.deps);
    expect(res.daysDone).toBe(7);
    expect(h.world.day).toBe(7);
    expect(res.finished).toBe(true);
    expect(res.matchesPlayed).toBe(7);
    // 25ms budget at 10ms/day => 3 days per slice => slices of 3,3,1 => 2 yields
    expect(h.yields()).toBe(2);
    expect(h.progress.length).toBeGreaterThanOrEqual(3);
    expect(h.progress.at(-1)?.finished).toBe(true);
  });
  it('slices are bounded by the time budget even for slow days (always at least one day)', async () => {
    const h = harness({ msPerDay: 200 });
    await runSimulation({ kind: 'days', days: 4 }, h.deps);
    expect(h.yields()).toBe(3); // one day per slice
  });
  it('can be cancelled between days and reports it', async () => {
    const h = harness({ msPerDay: 30 });
    h.deps.onProgress = (p: SimProgress): void => { h.progress.push(p); if (p.daysDone >= 3) h.setCancel(true); };
    const res = await runSimulation({ kind: 'days', days: 100 }, h.deps);
    expect(res.cancelled).toBe(true);
    expect(res.daysDone).toBe(3);
    expect(h.world.day).toBe(3);
  });
  it('nextMatchday stops after the day the human club plays', async () => {
    const h = harness({ humanOnDays: [4] });
    const res = await runSimulation({ kind: 'nextMatchday' }, h.deps);
    expect(res.daysDone).toBe(5);
    expect(res.humanMatches).toBe(1);
  });
  it('nextMatchday gives up after maxDays', async () => {
    const h = harness({});
    const res = await runSimulation({ kind: 'nextMatchday', maxDays: 6 }, h.deps);
    expect(res.daysDone).toBe(6);
  });
  it('endOfSeason stops when the season counter changes', async () => {
    const h = harness({ seasonEndsOnDay: 9 });
    const res = await runSimulation({ kind: 'endOfSeason' }, h.deps);
    expect(res.daysDone).toBe(10);
    expect(res.seasonEnded).toBe(true);
    expect(h.world.season).toBe(2);
  });
  it('has a hard day limit so a bug cannot loop forever', async () => {
    const h = harness({});
    const res = await runSimulation({ kind: 'endOfSeason' }, { ...h.deps, hardDayLimit: 50 });
    expect(res.daysDone).toBe(50);
  });
  it('zero days is a no-op that still finishes', async () => {
    const h = harness({});
    const res = await runSimulation({ kind: 'days', days: 0 }, h.deps);
    expect(res).toMatchObject({ daysDone: 0, finished: true });
  });
  it('propagates engine exceptions to the caller', async () => {
    const h = harness({});
    h.deps.advance = (): DayReport => { throw new Error('boom'); };
    await expect(runSimulation({ kind: 'days', days: 3 }, h.deps)).rejects.toThrow('boom');
  });
});
