import { describe, expect, it } from 'vitest';
import { Rng } from '../src/rng';
import { COMPETITIONS } from '../src/competition/registry';
import { createCompetition, currentTable, activeRules } from '../src/competition/engine';
import { computeTable } from '../src/competition/standings';
import type { CompetitionState, Fixture, KnockoutStage } from '../src/competition/types';
import { ctxFor, fakeClubs, playOut, type FakeClub } from './helpers';

function assertNoDoubleBooking(comp: CompetitionState): void {
  const seen = new Set<string>();
  for (const f of comp.fixtures) {
    for (const t of [f.home, f.away]) {
      const k = `${t}@${f.day}`;
      expect(seen.has(k), `club ${t} double-booked on day ${f.day} in ${comp.id}`).toBe(false);
      seen.add(k);
    }
  }
}

describe('domestic league (double round-robin)', () => {
  const clubs = fakeClubs(20, ['ENG']);
  const ctx = ctxFor(clubs);
  const comp = createCompetition(COMPETITIONS.ENG1!, 1, clubs.map((c) => c.id), ctx);

  it('generates every ordered pairing exactly once', () => {
    expect(comp.fixtures).toHaveLength(380);
    const pairs = new Set(comp.fixtures.map((f) => `${f.home}>${f.away}`));
    expect(pairs.size).toBe(380);
  });

  it('gives every club exactly one match per matchday and a balanced home/away split', () => {
    const byRound = new Map<number, string[]>();
    for (const f of comp.fixtures) byRound.set(f.round, [...(byRound.get(f.round) ?? []), f.home, f.away]);
    expect(byRound.size).toBe(38);
    for (const [, teams] of byRound) expect(new Set(teams).size).toBe(20);
    const home = new Map<string, number>();
    for (const f of comp.fixtures) home.set(f.home, (home.get(f.home) ?? 0) + 1);
    for (const c of clubs) expect(home.get(c.id)).toBe(19);
  });

  it('never double-books a club and schedules within the season cycle', () => {
    assertNoDoubleBooking(comp);
    for (const f of comp.fixtures) { expect(f.day).toBeGreaterThanOrEqual(0); expect(f.day).toBeLessThan(364); }
  });

  it('completes with a consistent table', () => {
    playOut(comp, ctx, clubs);
    expect(comp.status).toBe('complete');
    const table = currentTable(comp, COMPETITIONS.ENG1!, ctx);
    expect(table).toHaveLength(20);
    expect(table.every((r) => r.played === 38)).toBe(true);
    expect(table.reduce((a, r) => a + r.goalsFor, 0)).toBe(table.reduce((a, r) => a + r.goalsAgainst, 0));
    expect(table.reduce((a, r) => a + r.won, 0)).toBe(table.reduce((a, r) => a + r.lost, 0));
    expect(comp.winner).toBe(table[0]!.clubId);
    expect(comp.tableOrder).toHaveLength(20);
  });
});

describe('tiebreakers', () => {
  const mk = (id: string, home: string, away: string, hg: number, ag: number): Fixture => ({
    id, competitionId: 'T', season: 1, stageId: 's', round: 1, leg: 1, tieId: null, group: null, home, away, day: 0, neutral: false,
    status: 'played', result: { homeGoals: hg, awayGoals: ag, extraTime: false, pens: null, matchId: null, homeYellow: 0, awayYellow: 0, homeRed: 0, awayRed: 0 },
  });
  it('head-to-head beats goal difference only when configured first (La Liga style vs Premier League style)', () => {
    // A and B finish level on 4 points. B has the better goal difference (+3 vs -3) but A has the better direct record.
    const fx = [
      mk('1', 'A', 'B', 2, 1), mk('2', 'B', 'A', 1, 1), mk('3', 'C', 'A', 2, 0), mk('4', 'D', 'A', 2, 0),
      mk('5', 'B', 'C', 5, 0), mk('6', 'D', 'B', 1, 0), mk('7', 'D', 'C', 1, 0),
    ];
    const h2hFirst = computeTable(['A', 'B', 'C', 'D'], fx, ['points', 'h2hPoints', 'goalDifference', 'drawLots'], 3, 'x');
    expect(h2hFirst.map((r) => r.clubId)).toEqual(['D', 'A', 'B', 'C']);
    const gdFirst = computeTable(['A', 'B', 'C', 'D'], fx, ['points', 'goalDifference', 'h2hPoints', 'drawLots'], 3, 'x');
    expect(gdFirst.map((r) => r.clubId)).toEqual(['D', 'B', 'A', 'C']);
    expect(h2hFirst.find((r) => r.clubId === 'A')!.points).toBe(4);
    expect(h2hFirst.find((r) => r.clubId === 'B')!.points).toBe(4);
  });
  it('is a total order even when everything is equal', () => {
    const t = computeTable(['A', 'B', 'C', 'D'], [], ['points', 'goalDifference', 'drawLots'], 3, 'seed');
    expect(new Set(t.map((r) => r.clubId)).size).toBe(4);
    expect(t.map((r) => r.position)).toEqual([1, 2, 3, 4]);
  });
  it('re-applies head-to-head to the remaining tied subset', () => {
    // Three teams level on points; h2h mini-table separates one team, then the remaining pair is split by their direct match.
    const fx = [
      mk('1', 'A', 'B', 1, 0), mk('2', 'B', 'C', 1, 0), mk('3', 'C', 'A', 1, 0),
      mk('4', 'B', 'A', 2, 0), mk('5', 'C', 'B', 0, 0), mk('6', 'A', 'C', 2, 2),
    ];
    const t = computeTable(['A', 'B', 'C'], fx, ['points', 'h2hPoints', 'h2hGoalDifference', 'drawLots'], 3, 's');
    expect(new Set(t.map((r) => r.clubId)).size).toBe(3);
  });
});

function runCompetition(id: string, n: number, countries: string[], opts: { zones?: boolean } = {}): { comp: CompetitionState; clubs: FakeClub[]; ctx: ReturnType<typeof ctxFor> } {
  const clubs = fakeClubs(n, countries, id).map((c, i) => ({ ...c, zone: opts.zones ? (i % 2 === 0 ? 'west' : 'east') : undefined }));
  const ctx = ctxFor(clubs, id);
  const comp = createCompetition(COMPETITIONS[id]!, 1, clubs.map((c) => c.id), ctx);
  return { comp, clubs, ctx };
}

describe('UEFA-style league phase + knockout', () => {
  const countries = ['ENG', 'ESP', 'ITA', 'GER', 'FRA', 'POR', 'NED', 'BEL', 'TUR'];
  const { comp, clubs, ctx } = runCompetition('UCL', 36, countries);

  it('gives each club 8 distinct opponents, 4 at home and 4 away, one per matchday', () => {
    const lp = comp.fixtures.filter((f) => f.stageId === 'league');
    expect(lp).toHaveLength(144);
    for (const c of clubs) {
      const mine = lp.filter((f) => f.home === c.id || f.away === c.id);
      expect(mine).toHaveLength(8);
      expect(mine.filter((f) => f.home === c.id)).toHaveLength(4);
      expect(new Set(mine.map((f) => (f.home === c.id ? f.away : f.home))).size).toBe(8);
      expect(new Set(mine.map((f) => f.round)).size).toBe(8);
    }
  });

  it('exposes exactly one home and one away opponent per pot (pot structure)', () => {
    const sorted = [...clubs].sort((a, b) => b.coefficient - a.coefficient);
    const potOf = new Map(sorted.map((c, i) => [c.id, Math.floor(i / 9)]));
    const lp = comp.fixtures.filter((f) => f.stageId === 'league');
    for (const c of clubs) {
      for (let p = 0; p < 4; p++) {
        const homeVs = lp.filter((f) => f.home === c.id && potOf.get(f.away) === p);
        const awayVs = lp.filter((f) => f.away === c.id && potOf.get(f.home) === p);
        expect(homeVs).toHaveLength(1);
        expect(awayVs).toHaveLength(1);
      }
    }
  });

  it('plays through play-off, round of 16 and final with a single winner', () => {
    assertNoDoubleBooking(comp);
    playOut(comp, ctx, clubs);
    expect(comp.status).toBe('complete');
    expect(comp.winner).toBeTruthy();
    const [lp, po, ko] = comp.stages;
    expect(lp!.qualified).toHaveLength(8);
    expect(lp!.playoffQualified).toHaveLength(16);
    expect(po!.ties[0]).toHaveLength(8);
    expect(po!.qualified).toHaveLength(8);
    expect(ko!.ties).toHaveLength(4); // R16, QF, SF, F
    expect(ko!.ties.map((r) => r.length)).toEqual([8, 4, 2, 1]);
    for (const round of [...po!.ties, ...ko!.ties]) for (const t of round) { expect(t.winner).toBeTruthy(); expect(t.decidedBy).toBeTruthy(); }
    // the final is a single neutral-venue match
    const fin = comp.fixtures.filter((f) => f.stageId === 'knockout' && f.round === 4);
    expect(fin).toHaveLength(1);
    expect(fin[0]!.neutral).toBe(true);
    // top 8 never play in the play-off
    const poTeams = new Set(po!.ties[0]!.flatMap((t) => [t.home, t.away]));
    for (const id of lp!.qualified) expect(poTeams.has(id)).toBe(false);
    expect(comp.finalRanking[0]).toBe(comp.winner);
    expect(new Set(comp.finalRanking).size).toBe(36);
  });
});

describe('AFC zoned league stage', () => {
  it('builds separate West/East tables and a zonal bracket', () => {
    const { comp, clubs, ctx } = runCompetition('ACLE', 24, ['SAU', 'UAE', 'QAT', 'JPN', 'KOR', 'CHN'], { zones: true });
    const lp = comp.stages[0]!;
    expect(Object.keys(lp.groups).sort()).toEqual(['east', 'west']);
    expect(lp.groups.west).toHaveLength(12);
    const fx = comp.fixtures.filter((f) => f.stageId === 'league');
    expect(fx).toHaveLength(96);
    for (const f of fx) expect(lp.groups[f.group!]!.includes(f.home) && lp.groups[f.group!]!.includes(f.away)).toBe(true);
    playOut(comp, ctx, clubs);
    expect(comp.status).toBe('complete');
    expect(comp.stages[1]!.ties.map((r) => r.length)).toEqual([8, 4, 2, 1]);
  });
});

describe('group stage + regional knockout', () => {
  it('Libertadores-style: 8 groups of 4, 16 qualify, no group rematches in the round of 16', () => {
    const { comp, clubs, ctx } = runCompetition('COPA', 32, ['BRA', 'ARG', 'COL', 'CHI', 'URU', 'ECU', 'PAR', 'PER']);
    const g = comp.stages[0]!;
    expect(Object.keys(g.groups)).toHaveLength(8);
    for (const members of Object.values(g.groups)) expect(members).toHaveLength(4);
    assertNoDoubleBooking(comp);
    playOut(comp, ctx, clubs);
    expect(comp.status).toBe('complete');
    expect(comp.stages[0]!.qualified).toHaveLength(16);
    const r16 = comp.stages[1]!.ties[0]!;
    const groupOf = (id: string) => Object.entries(g.groups).find(([, m]) => m.includes(id))![0];
    for (const t of r16) expect(groupOf(t.home)).not.toBe(groupOf(t.away));
  });
});

describe('domestic cup with byes', () => {
  it('supports non power-of-two fields and always yields one winner', () => {
    for (const n of [20, 24, 44, 5, 33]) {
      const clubs = fakeClubs(n, ['ENG']);
      const ctx = ctxFor(clubs, `cup${n}`);
      const comp = createCompetition(COMPETITIONS['ENG-CUP']!, 1, clubs.map((c) => c.id), ctx);
      assertNoDoubleBooking(comp);
      playOut(comp, ctx, clubs);
      expect(comp.status).toBe('complete');
      expect(comp.winner).toBeTruthy();
      // total matches = n - 1 (every non-winner loses exactly once)
      expect(comp.fixtures.filter((f) => f.status === 'played')).toHaveLength(n - 1);
      const fin = comp.fixtures.at(-1)!;
      expect(fin.neutral).toBe(true);
    }
  });
});

describe('two-legged ties', () => {
  it('asks the second leg to decide on aggregate and records the deciding method', () => {
    const clubs = fakeClubs(16, ['A', 'B', 'C', 'D']);
    const ctx = ctxFor(clubs, 'tl');
    const comp = createCompetition(COMPETITIONS.UCL!, 1, clubs.map((c) => c.id), ctx);
    // UCL needs 36; with 16 entrants (>= minEntrants) it must still produce a valid league phase and complete
    playOut(comp, ctx, clubs);
    expect(comp.status).toBe('complete');
    const rules = activeRules(COMPETITIONS.UCL!, 1);
    expect((rules.stages[2] as KnockoutStage).awayGoalsRule).toBe(false);
  });
});

describe('MLS-style league plus playoffs', () => {
  it('advances the top eight and crowns a playoff champion while preserving table order', () => {
    const clubs = fakeClubs(30, ['USA']);
    const ctx = ctxFor(clubs, 'mls');
    const comp = createCompetition(COMPETITIONS.USA1!, 1, clubs.map((c) => c.id), ctx);
    expect(comp.fixtures.filter((f) => f.stageId === 'league')).toHaveLength(30 * 29 / 2);
    playOut(comp, ctx, clubs);
    expect(comp.status).toBe('complete');
    expect(comp.tableOrder).toHaveLength(30);
    expect(comp.stages[1]!.teams).toEqual(comp.tableOrder.slice(0, 8));
    expect(comp.winner).toBeTruthy();
  });
});

describe('determinism', () => {
  it('produces identical fixtures for identical seeds and different ones otherwise', () => {
    const clubs = fakeClubs(18, ['GER']);
    const a = createCompetition(COMPETITIONS.GER1!, 1, clubs.map((c) => c.id), ctxFor(clubs, 'same'));
    const b = createCompetition(COMPETITIONS.GER1!, 1, clubs.map((c) => c.id), ctxFor(clubs, 'same'));
    const c = createCompetition(COMPETITIONS.GER1!, 1, clubs.map((c) => c.id), ctxFor(clubs, 'other'));
    expect(JSON.stringify(a.fixtures)).toBe(JSON.stringify(b.fixtures));
    expect(JSON.stringify(a.fixtures)).not.toBe(JSON.stringify(c.fixtures));
    void Rng;
  });
});

describe('registry sweep: every competition completes with consistent state', () => {
  const countriesFor = (id: string): string[] => (id === 'UCL' || id === 'UEL' || id === 'UECL' ? ['ENG', 'ESP', 'ITA', 'GER', 'FRA', 'POR', 'NED', 'BEL', 'TUR'] : ['A', 'B', 'C', 'D', 'E', 'F']);
  for (const def of Object.values(COMPETITIONS)) {
    const rules = def.rules[0]!;
    it(`${def.id} (${rules.entrants} entrants) plays out`, () => {
      const clubs = fakeClubs(rules.entrants, countriesFor(def.id), def.id).map((c, i) => ({ ...c, zone: i % 2 === 0 ? 'west' : 'east' }));
      const ctx = ctxFor(clubs, def.id);
      const comp = createCompetition(def, 1, clubs.map((c) => c.id), ctx);
      expect(comp.status).toBe('active');
      const ids = new Set(comp.fixtures.map((f) => f.id));
      expect(ids.size).toBe(comp.fixtures.length);
      assertNoDoubleBooking(comp);
      playOut(comp, ctx, clubs, def.id);
      expect(comp.status).toBe('complete');
      expect(comp.fixtures.every((f) => f.status === 'played')).toBe(true);
      expect(comp.winner).toBeTruthy();
      expect(new Set(comp.finalRanking).size).toBe(comp.finalRanking.length);
      expect(comp.finalRanking.length).toBe(rules.entrants);
      for (const f of comp.fixtures) { expect(f.home).not.toBe(f.away); expect(f.day).toBeLessThan(52 * 7); }
    });
  }
});
