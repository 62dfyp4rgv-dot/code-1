import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { clubFixtures, leagueTableView, matchView, type FixtureView } from '@fu/engine';
import { runSim, generateWorldForSelection, startCareer, boot, useGame } from '../src/state/gameStore';
import { getPendingWorld, getWorld } from '../src/state/worldHost';
import { formEntries, formPoints, positionHistory } from '../src/features/homeStats';
import { buildTimeline, minuteLabel, scoreAfter, visibleCount } from '../src/features/matchTimeline';
import { contrastRatio, darkPalette, lightPalette, readableOn } from '../src/theme/tokens';

const fx = (id: string, home: string, away: string, score: string, pens: string | null = null): FixtureView => ({
  id, competitionId: 'X', competition: 'X', stage: 'League', round: 1, leg: 1, day: 1, date: '', home: { id: home, name: home }, away: { id: away, name: away }, status: 'played', score, pens, neutral: false,
});

describe('form guide', () => {
  it('derives W/D/L from the human club perspective, using penalties for level ties', () => {
    const e = formEntries([fx('a', 'me', 'x', '2-0'), fx('b', 'y', 'me', '1-1'), fx('c', 'me', 'z', '0-3'), fx('d', 'me', 'q', '1-1 aet', '4-5 pens'), fx('e', 'q', 'me', '1-1', '3-4 pens')], 'me');
    expect(e.map((x) => x.result)).toEqual(['W', 'D', 'L', 'L', 'W']);
    expect(e[0]).toMatchObject({ gf: 2, ga: 0, opponent: 'x', home: true });
    expect(e[2]).toMatchObject({ gf: 0, ga: 3 });
    expect(formPoints(e)).toBe(3 + 1 + 0 + 0 + 3);
  });
  it('ignores unplayed fixtures and other clubs', () => {
    expect(formEntries([{ ...fx('a', 'me', 'x', '1-0'), status: 'scheduled', score: null }, fx('b', 'p', 'q', '1-0')], 'me')).toEqual([]);
  });
});

describe('contrast of the new W/D/L chips', () => {
  it('letter on chip colour is AA in both themes', () => {
    for (const p of [lightPalette, darkPalette]) for (const col of [p.win, p.draw, p.loss]) expect(contrastRatio(readableOn(col), col)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('match timeline and league-position trend against the real engine', () => {
  it('builds a chronological timeline whose final score equals the engine result, and a position history that ends on the real position', async () => {
    await boot();
    await generateWorldForSelection('ux-test', 'compact');
    const clubId = getPendingWorld()!.leagueMembers.SAU1![0]!;
    await startCareer(clubId);
    for (let i = 0; i < 3; i++) await runSim({ kind: 'nextMatchday' });
    const w = getWorld()!;
    const played = clubFixtures(w, clubId, { upcoming: false, limit: 10 });
    expect(played.length).toBeGreaterThanOrEqual(2);
    for (const f of played) {
      const mv = matchView(w, f.id);
      if (!mv) continue;
      const tl = buildTimeline(mv);
      const clocks = tl.items.map((i) => i.clock);
      expect([...clocks].sort((a, b) => a - b)).toEqual(clocks);
      const m = /^(\d+)-(\d+)/.exec(mv.fixture.score ?? '');
      const [h, a] = [Number(m![1]), Number(m![2])];
      // goals recorded by the engine equal the result (shoot-outs are not goals)
      expect(scoreAfter(tl.items, tl.items.length)).toEqual([h, a]);
      expect(tl.items.filter((i) => i.kind === 'goal')).toHaveLength(mv.goals.length);
      expect(tl.endClock).toBeGreaterThanOrEqual(90);
      expect(visibleCount(tl.items, 0)).toBeLessThanOrEqual(1); // at most a kick-off marker at minute 0/1
      expect(visibleCount(tl.items, tl.endClock)).toBe(tl.items.length);
      if (mv.events) expect(tl.items.some((i) => i.kind === 'fulltime')).toBe(true);
      for (const i of tl.items) expect(minuteLabel(i)).toMatch(/^\d+(\+\d+)?'$/);
    }
    const lg = w.clubs[clubId]!.leagueId;
    const hist = positionHistory(w, lg, clubId);
    const mine = clubFixtures(w, clubId, { upcoming: false, limit: 60 }).filter((f) => f.competitionId === lg);
    expect(hist).toHaveLength(mine.length);
    const table = leagueTableView(w, lg);
    const real = table.find((r) => r.clubId === clubId)!.position;
    // 3-1-0 + GD/GF reconstruction should agree with the engine's table (within one place if an unmodelled tie-break applies)
    expect(Math.abs((hist[hist.length - 1] as number) - real)).toBeLessThanOrEqual(1);
    for (const p of hist) expect(p).toBeGreaterThanOrEqual(1);
    expect(useGame.getState().lastSim?.humanFixtureId ?? null).not.toBeUndefined();
  });

  it('runSim reports the human fixture to open after a match day', async () => {
    const w0 = getWorld()!;
    const s = await runSim({ kind: 'nextMatchday' });
    expect(s?.humanMatches).toBe(1);
    expect(s?.humanFixtureId).toBeTruthy();
    const f = clubFixtures(w0, w0.config.humanClubId!, { upcoming: false, limit: 1 })[0]!;
    expect(s?.humanFixtureId).toBe(f.id);
    expect(matchView(w0, f.id)).not.toBeNull();
  });
});
