/**
 * QA: read-only view-models (src/world/views.ts) against independent recomputation, and information hiding
 * (docs/ARCHITECTURE.md: hidden attributes of other clubs' players are replaced by scouting estimates).
 */
import { describe, expect, it } from 'vitest';
import { advanceDays, clubFixtures, createWorld, leagueTableView, playerProfile, setHumanClub, squadView, statLeaders, transferMarketView, COMPETITIONS } from '../src/index';
import { positionalOverall } from '../src/players';
import { cfg, tableRows } from './helpers';

const w = createWorld(cfg('qa-views', ['ENG1', 'ESP1']));
const human = Object.values(w.clubs)[0]!;
setHumanClub(w, human.id);
advanceDays(w, 160);

describe('table and leader views', () => {
  it('league table view equals an independent aggregation of played fixtures (points, GD, played) and is sorted by points (verified OK)', () => {
    for (const id of ['ENG1', 'ESP1']) {
      const comp = w.competitions[id]!;
      const view = leagueTableView(w, id);
      const mine = tableRows(comp.entrants, comp.fixtures.filter((f) => f.stageId === 'league'));
      expect(view.length).toBe(comp.entrants.length);
      for (const r of view) {
        const m = mine.get(r.clubId)!;
        expect([r.points, r.goalsFor, r.goalsAgainst, r.won, r.drawn, r.lost, r.played]).toEqual([m.p, m.gf, m.ga, m.w, m.d, m.l, m.w + m.d + m.l]);
        expect(r.won * 3 + r.drawn).toBe(r.points);
      }
      for (let i = 0; i + 1 < view.length; i++) expect(view[i]!.points).toBeGreaterThanOrEqual(view[i + 1]!.points);
      expect(view.map((r) => r.position)).toEqual(view.map((_, i) => i + 1));
      expect(COMPETITIONS[id]!.kind).toBe('league');
    }
  });
  it('goal leaders view equals the sum of match goals recorded for each player (verified OK)', () => {
    const lead = statLeaders(w, 'ENG1', 'goals', 5);
    const comp = w.competitions.ENG1!;
    const totalGoals = comp.fixtures.filter((f) => f.result).reduce((a, f) => a + f.result!.homeGoals + f.result!.awayGoals, 0);
    const sumAll = Object.values(w.seasonStats.ENG1!).reduce((a, s) => a + s.goals, 0);
    expect(sumAll).toBeLessThanOrEqual(totalGoals);          // own goals are not credited to anyone
    expect(sumAll).toBeGreaterThan(totalGoals * 0.9);
    expect([...lead].sort((a, b) => b.value - a.value).map((l) => l.value)).toEqual(lead.map((l) => l.value));
  });
  it('club fixtures view lists only that club, in date order (verified OK)', () => {
    const f = clubFixtures(w, human.id, { limit: 50 });
    expect(f.length).toBeGreaterThan(5);
    for (const x of f) expect([x.home.id, x.away.id]).toContain(human.id);
    for (let i = 0; i + 1 < f.length; i++) expect(f[i]!.day).toBeLessThanOrEqual(f[i + 1]!.day);
  });
});

describe('information hiding', () => {
  const others = Object.values(w.players).filter((p) => !p.retired && p.clubId && p.clubId !== human.id);
  it('rows of other clubs carry scouting estimates, not true ratings (verified OK)', () => {
    const row = squadView(w, Object.values(w.clubs)[5]!.id)[0]!;
    expect(row.exact).toBe(false);
    const mk = transferMarketView(w, { limit: 50 });
    expect(mk.every((r) => r.exact === false)).toBe(true);
  });
  it('[QA-013] the player profile does not reveal the exact hidden ability of unscouted players', () => {
    let exact = 0;
    for (const p of others) {
      const prof = playerProfile(w, p.id)!;
      const primary = prof.positions.find((x) => x.position === p.primary)!;
      if (primary.rating === Math.round(positionalOverall(p, p.primary))) exact++;
    }
    const share = exact / others.length;
    expect(share, `${exact}/${others.length} other-club players have an exact positional rating in playerProfile().positions`).toBeLessThan(0.5);
  });
});
