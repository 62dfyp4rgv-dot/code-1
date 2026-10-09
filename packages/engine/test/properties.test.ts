import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { Rng } from '../src/rng';
import { bracketOrder, colourMatchdays, drawGroups, firstRound, leaguePhasePairings, nextPow2, roundRobin, weekOfRound, type TeamInfo } from '../src/competition/fixtures';
import { aggregateRows, computeTable } from '../src/competition/standings';
import { allocateEntrants, buildQualSpecs, type QualInput } from '../src/competition/qualification';
import type { Fixture, Tiebreaker } from '../src/competition/types';

const played = (id: number, home: string, away: string, hg: number, ag: number): Fixture => ({
  id: `f${id}`, competitionId: 'T', season: 1, stageId: 's', round: 1, leg: 1, tieId: null, group: null, home, away, day: 0, neutral: false, status: 'played',
  result: { homeGoals: hg, awayGoals: ag, extraTime: false, pens: null, matchId: null, homeYellow: 0, awayYellow: 0, homeRed: 0, awayRed: 0 },
});

describe('round robin (property)', () => {
  it('every pair meets exactly `legs` times, nobody plays twice in a round, home/away balanced', () => {
    fc.assert(fc.property(fc.integer({ min: 2, max: 36 }), fc.constantFrom<1 | 2>(1, 2), fc.string(), (n, legs, seed) => {
      const ids = Array.from({ length: n }, (_, i) => `t${i}`);
      const rounds = roundRobin(ids, legs, Rng.fromSeed(seed));
      const meet = new Map<string, number>();
      const home = new Map<string, number>();
      for (const r of rounds) {
        const seen = new Set<string>();
        for (const p of r) {
          expect(seen.has(p.home) || seen.has(p.away)).toBe(false);
          seen.add(p.home); seen.add(p.away);
          const key = [p.home, p.away].sort().join('|');
          meet.set(key, (meet.get(key) ?? 0) + 1);
          home.set(p.home, (home.get(p.home) ?? 0) + 1);
        }
      }
      expect(meet.size).toBe((n * (n - 1)) / 2);
      for (const c of meet.values()) expect(c).toBe(legs);
      const hs = ids.map((i) => home.get(i) ?? 0);
      if (legs === 2) for (const h of hs) expect(h).toBe(n - 1);
      else expect(Math.max(...hs) - Math.min(...hs)).toBeLessThanOrEqual(1);
    }), { numRuns: 120 });
  });
  it('no club has a long run of home or away games (regression: an early version gave one club nine away games in a row)', () => {
    fc.assert(fc.property(fc.integer({ min: 4, max: 36 }), fc.constantFrom<1 | 2>(1, 2), fc.string(), (n, legs, seed) => {
      const ids = Array.from({ length: n }, (_, i) => `t${i}`);
      const rounds = roundRobin(ids, legs, Rng.fromSeed(seed));
      const venue = new Map<string, string[]>();
      for (const r of rounds) for (const p of r) {
        venue.set(p.home, [...(venue.get(p.home) ?? []), 'H']);
        venue.set(p.away, [...(venue.get(p.away) ?? []), 'A']);
      }
      let longest = 0;
      for (const v of venue.values()) { let run = 1; for (let i = 1; i < v.length; i++) { run = v[i] === v[i - 1] ? run + 1 : 1; longest = Math.max(longest, run); } }
      expect(longest).toBeLessThanOrEqual(legs === 2 ? 3 : 2);
    }), { numRuns: 80 });
  });
});

describe('knockout brackets (property)', () => {
  it('bracketOrder is a permutation of 1..P that keeps seeds 1 and 2 on opposite halves', () => {
    for (const P of [2, 4, 8, 16, 32, 64]) {
      const o = bracketOrder(P);
      expect([...o].sort((a, b) => a - b)).toEqual(Array.from({ length: P }, (_, i) => i + 1));
      expect(o.indexOf(1) < P / 2).not.toBe(o.indexOf(2) < P / 2);
      for (let i = 0; i < P; i += 2) expect((o[i] as number) + (o[i + 1] as number)).toBe(P + 1);
    }
  });
  it('firstRound gives byes to exactly the top (P-N) seeds and every team appears once', () => {
    fc.assert(fc.property(fc.integer({ min: 2, max: 70 }), fc.boolean(), fc.string(), (n, shuffle, seed) => {
      const teams = Array.from({ length: n }, (_, i) => `s${i}`);
      const slots = firstRound(teams, shuffle, Rng.fromSeed(seed));
      const P = nextPow2(n);
      expect(slots).toHaveLength(P / 2);
      const all = slots.flatMap((s) => (s.away === null ? [s.home] : [s.home, s.away]));
      expect(new Set(all).size).toBe(n);
      expect(all).toHaveLength(n);
      const byes = slots.filter((s) => s.away === null).map((s) => s.home).sort();
      expect(byes).toEqual(teams.slice(0, P - n).sort());
    }), { numRuns: 150 });
  });
});

describe('standings (property)', () => {
  it('table invariants hold for arbitrary results and tiebreaker orders', () => {
    const rules: Tiebreaker[][] = [
      ['points', 'goalDifference', 'goalsFor', 'drawLots'],
      ['points', 'h2hPoints', 'h2hGoalDifference', 'h2hGoalsFor', 'goalDifference', 'goalsFor', 'drawLots'],
      ['points', 'wins', 'awayGoals', 'fairPlay', 'drawLots'],
    ];
    fc.assert(fc.property(fc.integer({ min: 2, max: 12 }), fc.array(fc.tuple(fc.integer({ min: 0, max: 11 }), fc.integer({ min: 0, max: 11 }), fc.integer({ min: 0, max: 7 }), fc.integer({ min: 0, max: 7 })), { maxLength: 150 }), fc.integer({ min: 0, max: 2 }), fc.integer({ min: 1, max: 3 }), (n, results, ri, win) => {
      const ids = Array.from({ length: n }, (_, i) => `c${i}`);
      const fx = results.filter(([h, a]) => h % n !== a % n).map(([h, a, hg, ag], i) => played(i, ids[h % n] as string, ids[a % n] as string, hg, ag));
      const table = computeTable(ids, fx, rules[ri] as Tiebreaker[], win, 'seed');
      expect(table.map((r) => r.clubId).sort()).toEqual([...ids].sort());
      expect(table.map((r) => r.position)).toEqual(ids.map((_, i) => i + 1));
      for (let i = 1; i < table.length; i++) expect((table[i - 1] as { points: number }).points).toBeGreaterThanOrEqual((table[i] as { points: number }).points);
      const rows = [...aggregateRows(ids, fx, win).values()];
      expect(rows.reduce((a, r) => a + r.goalsFor, 0)).toBe(rows.reduce((a, r) => a + r.goalsAgainst, 0));
      expect(rows.reduce((a, r) => a + r.won, 0)).toBe(rows.reduce((a, r) => a + r.lost, 0));
      for (const r of rows) { expect(r.points).toBe(r.won * win + r.drawn); expect(r.played).toBe(r.won + r.drawn + r.lost); }
      // determinism: same inputs give the same order
      expect(computeTable(ids, fx, rules[ri] as Tiebreaker[], win, 'seed').map((r) => r.clubId)).toEqual(table.map((r) => r.clubId));
    }), { numRuns: 200 });
  });
});

describe('league-phase construction (property)', () => {
  it('produces regular, constraint-respecting pairings that colour into exactly `matches` matchdays', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 5 }), fc.string(), (shape, seed) => {
      const countries = ['ENG', 'ESP', 'ITA', 'GER', 'FRA', 'POR', 'NED', 'BEL', 'TUR', 'SCO'];
      const shapes = [[36, 4], [32, 4], [24, 4], [16, 4], [12, 4], [20, 4]] as const;
      const [n, pots] = shapes[shape] as readonly [number, number];
      const teams: TeamInfo[] = Array.from({ length: n }, (_, i) => ({ id: `t${i}`, country: countries[(i * 7 + shape) % countries.length] as string, coefficient: 100 - i }));
      const rng = Rng.fromSeed(seed);
      const res = leaguePhasePairings(teams, pots, 2, rng);
      expect(res.pairings).toHaveLength((n * 2 * pots) / 2);
      const deg = new Map<string, number>(); const pair = new Set<string>();
      for (const p of res.pairings) {
        deg.set(p.home, (deg.get(p.home) ?? 0) + 1); deg.set(p.away, (deg.get(p.away) ?? 0) + 1);
        const key = [p.home, p.away].sort().join('|'); expect(pair.has(key)).toBe(false); pair.add(key);
        if (res.relaxed !== 'countryRule') expect(teams.find((t) => t.id === p.home)!.country).not.toBe(teams.find((t) => t.id === p.away)!.country);
      }
      for (const t of teams) expect(deg.get(t.id)).toBe(2 * pots);
      const col = colourMatchdays(teams.map((t) => t.id), res.pairings, 2 * pots, rng.derive('col'));
      if (col) {
        const seen = new Set<string>();
        res.pairings.forEach((p, i) => { for (const t of [p.home, p.away]) { const k = `${t}:${col[i]}`; expect(seen.has(k)).toBe(false); seen.add(k); } });
      }
    }), { numRuns: 25 });
  });
  it('group draws put one team from each pot in each group, avoiding same-country when feasible', () => {
    fc.assert(fc.property(fc.constantFrom(8, 4, 2), fc.string(), (groups, seed) => {
      const countries = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const teams: TeamInfo[] = Array.from({ length: groups * 4 }, (_, i) => ({ id: `t${i}`, country: countries[i % countries.length] as string, coefficient: 100 - i }));
      const g = drawGroups(teams, groups, true, Rng.fromSeed(seed));
      expect(g).toHaveLength(groups);
      const sorted = [...teams];
      for (const grp of g) {
        expect(grp).toHaveLength(4);
        const pots = grp.map((t) => Math.floor(sorted.indexOf(t) / groups)).sort();
        expect(pots).toEqual([0, 1, 2, 3]);
        expect(new Set(grp.map((t) => t.country)).size).toBe(4);
      }
    }), { numRuns: 40 });
  });
  it('scheduling weeks are strictly increasing and skip blocked weeks', () => {
    fc.assert(fc.property(fc.integer({ min: 0, max: 10 }), fc.integer({ min: 1, max: 3 }), fc.array(fc.integer({ min: 0, max: 40 }), { maxLength: 8 }), (start, step, skip) => {
      let last = -1;
      for (let r = 0; r < 20; r++) {
        const w = weekOfRound({ startWeek: start, weekStep: step, dow: 5, skipWeeks: skip }, r);
        expect(w).toBeGreaterThan(last);
        expect(skip.includes(w)).toBe(false);
        last = w;
      }
    }), { numRuns: 100 });
  });
});

describe('qualification allocation', () => {
  const mkInput = (): QualInput => {
    const leagues = ['ENG1', 'ESP1', 'ITA1', 'GER1', 'FRA1', 'POR1', 'NED1', 'BEL1', 'SCO1', 'TUR1'];
    const members: Record<string, string[]> = {}; const tables: Record<string, string[]> = {}; const rep = new Map<string, number>();
    leagues.forEach((l, li) => { members[l] = Array.from({ length: 18 }, (_, i) => `${l}-${i}`); tables[l] = [...(members[l] as string[])]; (members[l] as string[]).forEach((c, i) => rep.set(c, 100 - i * 3 - li)); });
    return { season: 3, tables, history: {}, leagueMembers: members, reputation: (c) => rep.get(c) ?? 0 };
  };
  it('never enters a club in two exclusive competitions and fills quotas exactly', () => {
    const input = mkInput();
    const out = allocateEntrants(buildQualSpecs(Object.keys(input.leagueMembers)), input);
    expect(out.UCL).toHaveLength(36); expect(out.UEL).toHaveLength(36); expect(out.UECL).toHaveLength(36);
    const all = [...out.UCL!, ...out.UEL!, ...out.UECL!];
    expect(new Set(all).size).toBe(all.length);
    for (const top of ['ENG1-0', 'ENG1-1', 'ENG1-2', 'ENG1-3']) expect(out.UCL).toContain(top); // the configured four, plus possibly reputation fill
  });
  it('cup winners already qualified pass their place down the table (cascade)', () => {
    const input = mkInput();
    input.history = { 'ENG-CUP': { 2: { winner: 'ENG1-0', runnerUp: 'ENG1-5' } } };
    const out = allocateEntrants(buildQualSpecs(Object.keys(input.leagueMembers)), input);
    const uel = out.UEL!.filter((c) => c.startsWith('ENG1'));
    expect(out.UCL).toContain('ENG1-0');
    expect(uel).not.toContain('ENG1-0');
    expect(uel.length).toBeGreaterThanOrEqual(2); // league UEL slot + cascaded cup slot
  });
  it('title holders from history earn a place; missing leagues contribute nothing without crashing', () => {
    const input = mkInput();
    input.history = { UCL: { 2: { winner: 'BEL1-17', runnerUp: null } } };
    const out = allocateEntrants(buildQualSpecs(['ENG1', 'BEL1']), { ...input, leagueMembers: { ENG1: input.leagueMembers.ENG1!, BEL1: input.leagueMembers.BEL1! } });
    expect(out.UCL).toContain('BEL1-17');
    expect(out.UCL!.length).toBeLessThanOrEqual(36);
  });
});
