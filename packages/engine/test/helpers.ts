import { Rng } from '../src/rng';
import { COMPETITIONS } from '../src/competition/registry';
import {
  activeRules, createCompetition, fixturesOnDay, matchRulesFor, recordResult, type EngineContext,
} from '../src/competition/engine';
import type { CompetitionState, Fixture, FixtureResult } from '../src/competition/types';

export interface FakeClub { id: string; country: string; coefficient: number; zone?: string }

export function fakeClubs(n: number, countries: string[], seed = 'c'): FakeClub[] {
  const rng = Rng.fromSeed(seed);
  return Array.from({ length: n }, (_, i) => ({
    id: `club${String(i).padStart(3, '0')}`, country: countries[i % countries.length] as string,
    coefficient: 100 - i + rng.float(-0.4, 0.4),
  }));
}

export function ctxFor(clubs: FakeClub[], seed = 'ctx'): EngineContext {
  const m = new Map(clubs.map((c) => [c.id, c]));
  return { seed, info: (id) => { const c = m.get(id); if (!c) throw new Error(`no club ${id}`); return { id: c.id, country: c.country, coefficient: c.coefficient, zone: c.zone }; } };
}

/** Random-but-legal result for a fixture, honouring the match rules the engine asks for. */
export function randomResult(comp: CompetitionState, f: Fixture, rng: Rng, strength: (id: string) => number): FixtureResult {
  const def = COMPETITIONS[comp.id]!;
  const rules = matchRulesFor(comp, def, f);
  const lh = 1.4 * Math.exp((strength(f.home) - strength(f.away)) / 60);
  const la = 1.1 * Math.exp((strength(f.away) - strength(f.home)) / 60);
  let hg = rng.poisson(lh);
  let ag = rng.poisson(la);
  let extraTime = false;
  let pens: { home: number; away: number } | null = null;
  if (rules.mustHaveWinner) {
    const off = rules.aggregateOffset ?? { home: 0, away: 0 };
    if (hg + off.home === ag + off.away) {
      if (rules.extraTime) {
        extraTime = true;
        hg += rng.poisson(0.4); ag += rng.poisson(0.4);
      }
      if (hg + off.home === ag + off.away) {
        const h = rng.between(3, 5);
        pens = rng.chance(0.5) ? { home: h, away: h - 1 } : { home: h - 1, away: h };
      }
    }
  }
  return { homeGoals: hg, awayGoals: ag, extraTime, pens, matchId: null, homeYellow: rng.int(4), awayYellow: rng.int(4), homeRed: rng.chance(0.05) ? 1 : 0, awayRed: rng.chance(0.05) ? 1 : 0 };
}

/** Plays a competition to completion day by day; returns the list of fixtures played per day for invariants. */
export function playOut(comp: CompetitionState, ctx: EngineContext, clubs: FakeClub[], seed = 'play'): { daysPlayed: Map<number, Fixture[]> } {
  const def = COMPETITIONS[comp.id]!;
  void activeRules(def, comp.season);
  const rng = Rng.fromSeed(seed);
  const str = new Map(clubs.map((c) => [c.id, c.coefficient]));
  const daysPlayed = new Map<number, Fixture[]>();
  for (let day = 0; day < 52 * 7 * 2 && comp.status === 'active'; day++) {
    const todays = fixturesOnDay(comp, day);
    for (const f of todays) {
      recordResult(comp, def, f.id, randomResult(comp, f, rng, (id) => str.get(id) ?? 50), ctx);
      const arr = daysPlayed.get(day) ?? [];
      arr.push(f);
      daysPlayed.set(day, arr);
    }
  }
  return { daysPlayed };
}

export { createCompetition };
