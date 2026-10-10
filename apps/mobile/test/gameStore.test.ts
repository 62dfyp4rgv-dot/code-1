import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { clubFixtures, dateInfo, financeView, bidForPlayer, suggestTerms, transferMarketView } from '@fu/engine';
import { boot, cancelSim, firstFreeSlot, generateWorldForSelection, loadSlot, mutate, runSim, saveNow, startCareer, useGame, closeCareer } from '../src/state/gameStore';
import { useSettings } from '../src/state/settings';
import { getPendingWorld, getWorld } from '../src/state/worldHost';
import { queryWorld, __clearQueryCache } from '../src/state/queries';

describe('game store: new career -> simulate -> autosave -> reload', () => {
  it('runs the whole life-cycle against the real engine and the IndexedDB save store', async () => {
    await boot();
    expect(useGame.getState().booted).toBe(true);
    expect(useGame.getState().bootError).toBeNull();
    await generateWorldForSelection('store-test', 'compact');
    const pending = getPendingWorld()!;
    expect(Object.keys(pending.clubs).length).toBeGreaterThan(100);
    const clubId = pending.leagueMembers.SAU1![0]!;
    await startCareer(clubId);
    const s0 = useGame.getState();
    expect(s0.hasWorld).toBe(true);
    expect(s0.activeSlot).toBe(1);
    expect(s0.saveState.status).toBe('saved');
    expect(s0.slots).toHaveLength(1);
    expect(useSettings.getState().lastSlot).toBe(1);

    const v0 = s0.version;
    const summary = await runSim({ kind: 'nextMatchday' });
    expect(summary?.humanMatches).toBe(1);
    expect(summary?.daysDone).toBeGreaterThan(0);
    const s1 = useGame.getState();
    expect(s1.version).toBeGreaterThan(v0);
    expect(s1.sim).toBeNull();
    expect(s1.saveState.status).toBe('saved'); // autosaved after the simulation
    expect(s1.slots[0]!.day).toBe(getWorld()!.day);
    const dayAfter = getWorld()!.day;
    expect(dateInfo(dayAfter).dayOfSeason).toBeGreaterThan(0);

    // views are memoised per version and invalidated by mutations
    __clearQueryCache();
    let calls = 0;
    const a = queryWorld(s1.version, 'k', [1], () => ++calls);
    const b = queryWorld(s1.version, 'k', [1], () => ++calls);
    expect(a).toBe(b); expect(calls).toBe(1);
    mutate(() => undefined);
    const c = queryWorld(useGame.getState().version, 'k', [1], () => ++calls);
    expect(c).toBe(2);

    // a transfer through the same path used by the UI
    const w = getWorld()!;
    const human = w.config.humanClubId!;
    w.clubs[human]!.finance.transferBudget = 5e8; w.clubs[human]!.finance.wageBudgetWeekly = 1e8; w.clubs[human]!.finance.cash = 1e9;
    const squadBefore = Object.values(w.players).filter((p) => p.clubId === human).length;
    const target = transferMarketView(w, { minAbility: 55, limit: 40 }).find((r) => r.clubId && r.clubId !== human && w.players[r.id]!.nationality === 'SAU');
    if (target && financeView(w, human)) {
      const t = suggestTerms(w, target.id);
      if (t.ok) {
        const out = mutate((x) => bidForPlayer(x, target.id, t.value.fee * 1.5, t.value.wageWeekly * 1.5, t.value.years));
        expect(out.ok).toBe(true);
        if (out.ok && out.value.status === 'completed') expect(Object.values(w.players).filter((p) => p.clubId === human).length).toBe(squadBefore + 1);
      }
    }
    expect(await saveNow()).toBe(true);

    // reload from the store
    const dayBefore = getWorld()!.day;
    closeCareer();
    expect(useGame.getState().hasWorld).toBe(false);
    expect(await loadSlot(1)).toBe(true);
    expect(getWorld()!.day).toBe(dayBefore);
    expect(useGame.getState().notice).toBeNull();
    expect(clubFixtures(getWorld()!, human, { upcoming: false, limit: 5 }).length).toBeGreaterThan(0);
    expect(firstFreeSlot(useGame.getState().slots)).toBe(2);
  });

  it('cancelling a long simulation stops it early and leaves a consistent, saved world', async () => {
    const start = getWorld()!.day;
    const p = runSim({ kind: 'days', days: 300 });
    await new Promise((r) => setTimeout(r, 30));
    cancelSim();
    const res = await p;
    expect(res?.cancelled).toBe(true);
    expect(res!.daysDone).toBeLessThan(300);
    expect(getWorld()!.day).toBe(start + res!.daysDone);
    expect(useGame.getState().saveState.status).toBe('saved');
  });

  it('loading a missing slot reports an error notice instead of throwing', async () => {
    expect(await loadSlot(33)).toBe(false);
    expect(useGame.getState().notice?.tone).toBe('error');
  });
});
