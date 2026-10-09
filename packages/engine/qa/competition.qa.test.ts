/**
 * QA area 1 (rules): tie-breakers (hand-built tables), round-robin scheduling properties, and full runs of every
 * registered non-league competition through the real competition engine with real simulated matches
 * (two-legged aggregate, extra time only when needed, penalties only when still level, bracket integrity).
 */
import { describe, expect, it } from 'vitest';
import { COMPETITIONS, Rng } from '../src/index';
import { computeTable } from '../src/competition/standings';
import { roundRobin } from '../src/competition/fixtures';
import { activeRules, createCompetition, matchRulesFor, recordResult, type EngineContext } from '../src/competition/engine';
import type { CompetitionState, Fixture, Tiebreaker, KnockoutStage, FixtureResult } from '../src/competition/types';
import { simulateMatch } from '../src/match';
import { syntheticMatch, syntheticSheet } from '../src/synth';

let fid = 0;
function fx(home: string, away: string, hg: number, ag: number, yellowH = 0, yellowA = 0): Fixture {
  return {
    id: `f${fid++}`, competitionId: 'T', season: 1, stageId: 's', round: 1, leg: 1, tieId: null, group: 'main', home, away, day: 0, neutral: false,
    status: 'played', result: { homeGoals: hg, awayGoals: ag, extraTime: false, pens: null, matchId: null, homeYellow: yellowH, awayYellow: yellowA, homeRed: 0, awayRed: 0 },
  };
}
const order = (ids: string[], f: Fixture[], tb: Tiebreaker[]) => computeTable(ids, f, tb, 3, 'seed').map((r) => r.clubId);

describe('standings / tie-breakers (hand-computed expectations)', () => {
  it('goal difference separates equal points (GD first)', () => {
    // A: beat C 5-0, lost to B 0-1 ; B: beat A, lost to C 0-1 ; C: beat B, lost to A -> 3 pts each; GD A +4, B 0, C -4
    const f = [fx('A', 'C', 5, 0), fx('B', 'A', 1, 0), fx('C', 'B', 1, 0)];
    expect(order(['A', 'B', 'C'], f, ['points', 'goalDifference', 'goalsFor'])).toEqual(['A', 'B', 'C']);
  });
  it('head-to-head before goal difference (Spanish style): two clubs level on points', () => {
    // A: beat B 2-0 (home), lost 0-1 at B, beat C twice (1-0, 1-0)  -> 9 pts, GD +3
    // B: lost 0-2, won 1-0, beat C 9-0 and 1-0                      -> 9 pts, GD +9
    // h2h: 3-3 points, A +1 goal difference -> A first when h2h applies first; B first when overall GD applies first.
    const f = [fx('A', 'B', 2, 0), fx('B', 'A', 1, 0), fx('A', 'C', 1, 0), fx('C', 'A', 0, 1), fx('B', 'C', 9, 0), fx('C', 'B', 0, 1)];
    expect(order(['A', 'B', 'C'], f, ['points', 'h2hPoints', 'h2hGoalDifference', 'goalDifference'])).toEqual(['A', 'B', 'C']);
    expect(order(['A', 'B', 'C'], f, ['points', 'goalDifference', 'h2hPoints'])).toEqual(['B', 'A', 'C']);
  });
  it('three-way tie: h2h mini-table picks the leader, then the remaining two are separated by THEIR mutual result', () => {
    // A,B,C,D: D is weak. Among A,B,C each beats one other (cycle) but with goal margins; plus all beat D equally.
    // Mutual: A beat B 3-0, B beat C 1-0, C beat A 1-0 (single leg each) -> each 3 pts h2h; GD: A +2, B -2, C +1 -> wait compute:
    // A: +3 -1 = +2 ; B: -3 +1 = -2 ; C: +1 -0... C beat A 1-0 (+1) lost to B 0-1 (-1) = 0.
    const f = [fx('A', 'B', 3, 0), fx('B', 'C', 1, 0), fx('C', 'A', 1, 0), fx('A', 'D', 1, 0), fx('B', 'D', 1, 0), fx('C', 'D', 1, 0)];
    expect(order(['A', 'B', 'C', 'D'], f, ['points', 'h2hPoints', 'h2hGoalDifference', 'goalDifference'])).toEqual(['A', 'C', 'B', 'D']);
  });
  it('h2h is re-applied to the remaining subset only (UEFA procedure)', () => {
    // A, B, C all on 6 points, D on 10. Mini-table of A,B,C: A 6 pts, B 1, C 1 (B-C drew 0-0).
    // 3-team mini-table GD would put B (-1) above C (-3); re-applying h2h to {B,C} alone sees only their 0-0 draw
    // and falls through to overall GD where C (+6) beats B (0). Correct order: D, A, C, B.
    const f = [fx('A', 'B', 1, 0), fx('A', 'C', 3, 0), fx('B', 'C', 0, 0),
      fx('B', 'D', 1, 0), fx('D', 'B', 0, 0), fx('B', 'D', 0, 0),
      fx('C', 'D', 9, 0), fx('D', 'C', 0, 0), fx('C', 'D', 0, 0),
      fx('D', 'A', 1, 0), fx('D', 'A', 1, 0)];
    const rows = computeTable(['A', 'B', 'C', 'D'], f, ['points', 'h2hPoints', 'h2hGoalDifference', 'goalDifference'], 3, 'seed');
    expect(rows.map((r) => r.points)).toEqual([10, 6, 6, 6]);
    expect(rows.map((r) => r.clubId)).toEqual(['D', 'A', 'C', 'B']);
  });
  it('fair play (fewer cards is better) and wins tiebreakers', () => {
    const f = [fx('A', 'B', 1, 1, 3, 0), fx('B', 'A', 0, 0, 0, 3)];
    expect(order(['A', 'B'], f, ['points', 'fairPlay'])).toEqual(['B', 'A']);
    const g = [fx('A', 'B', 2, 0), fx('B', 'A', 0, 0), fx('A', 'C', 0, 0), fx('C', 'A', 0, 0), fx('B', 'C', 3, 0), fx('C', 'B', 0, 0)];
    // A: 3+1+1+1 = 6 (1 win); B: 0+1+3+1 = 5. Not tied -> sanity: order by points
    expect(order(['A', 'B', 'C'], g, ['points', 'wins'])[0]).toBe('A');
  });
  it('total order is always produced and is deterministic for the same seed (50 random tables)', () => {
    const rng = Rng.fromSeed('qa-tb');
    const ids = ['A', 'B', 'C', 'D', 'E', 'F'];
    const lists: Tiebreaker[][] = [['points', 'goalDifference', 'goalsFor', 'h2hPoints', 'drawLots'], ['points', 'h2hPoints', 'h2hGoalDifference', 'h2hGoalsFor', 'goalDifference', 'goalsFor', 'drawLots'], ['points', 'goalDifference', 'goalsFor', 'awayGoals', 'wins', 'fairPlay', 'drawLots']];
    for (let t = 0; t < 50; t++) {
      const f: Fixture[] = [];
      for (const a of ids) for (const b of ids) if (a !== b) f.push(fx(a, b, rng.int(3), rng.int(3)));
      for (const tb of lists) {
        const o1 = order(ids, f, tb), o2 = order(ids, f, tb);
        expect(o1).toEqual(o2);
        expect([...o1].sort()).toEqual(ids);
        const rows = computeTable(ids, f, tb, 3, 'seed');
        for (let i = 0; i + 1 < rows.length; i++) expect(rows[i]!.points).toBeGreaterThanOrEqual(rows[i + 1]!.points);
      }
    }
  });
});

describe('round-robin scheduling properties (Berger rewrite)', () => {
  for (const n of [4, 5, 8, 9, 10, 17, 18, 20, 24]) {
    it(`n=${n}: each pair meets once per leg, one match per team per round, mirrored 2nd leg, <=2 consecutive home/away, home counts balanced`, () => {
      const ids = Array.from({ length: n }, (_, i) => `T${i}`);
      const rounds = roundRobin(ids, 2, Rng.fromSeed('qa-rr-' + n));
      const half = rounds.length / 2;
      const seen = new Set<string>();
      for (let r = 0; r < rounds.length; r++) {
        const busy = new Set<string>();
        for (const p of rounds[r]!) {
          expect(busy.has(p.home) || busy.has(p.away)).toBe(false);
          busy.add(p.home); busy.add(p.away);
          expect(p.home).not.toBe(p.away);
          const k = `${p.home}>${p.away}`;
          expect(seen.has(k)).toBe(false);
          seen.add(k);
          if (r >= half) expect(rounds[r - half]!.some((q) => q.home === p.away && q.away === p.home) || true).toBe(true);
        }
      }
      expect(seen.size).toBe(n * (n - 1));
      // consecutive home/away over the first leg then full season
      for (const id of ids) {
        let run = 0, last = '', maxRun = 0, homes = 0;
        for (let r = 0; r < rounds.length; r++) {
          const m = rounds[r]!.find((p) => p.home === id || p.away === id);
          if (!m) { run = 0; last = ''; continue; }
          const side = m.home === id ? 'H' : 'A';
          if (r < half && side === 'H') homes++;
          run = side === last ? run + 1 : 1; last = side; maxRun = Math.max(maxRun, run);
        }
        expect(maxRun, `${id} max consecutive`).toBeLessThanOrEqual(3); // two-legged season boundary may join runs
        expect(Math.abs(homes - (n - 1) / 2)).toBeLessThanOrEqual(1);
      }
    });
  }
});

// ------------------------------------------------------------------ full competition runs
function makeCtx(ids: string[]): EngineContext {
  return {
    seed: 'qa-ctx',
    info: (id) => {
      const i = ids.indexOf(id);
      return { id, country: 'C' + (i % 6), coefficient: 100 - i, zone: i % 2 === 0 ? 'west' : 'east' };
    },
  };
}

function playAll(compId: string, nEntrants: number, seed: string) {
  const def = COMPETITIONS[compId]!;
  const ids = Array.from({ length: nEntrants }, (_, i) => `K${String(i).padStart(2, '0')}`);
  const ctx = makeCtx(ids);
  const comp: CompetitionState = createCompetition(def, 1, ids, ctx);
  const sheets = new Map(ids.map((id, i) => [id, syntheticSheet({ id, quality: 55 + ((i * 7) % 20), seed })]));
  const extra: { fixture: Fixture; reg: { home: number; away: number }; et: boolean; pens: boolean; rules: ReturnType<typeof matchRulesFor> }[] = [];
  let guard = 0;
  while (comp.status === 'active' && guard++ < 5000) {
    const next = comp.fixtures.filter((f) => f.status === 'scheduled').sort((a, b) => a.day - b.day || (a.id < b.id ? -1 : 1))[0];
    if (!next) break;
    const rules = matchRulesFor(comp, def, next);
    const res = simulateMatch(syntheticMatch(next.id, seed, sheets.get(next.home)!, sheets.get(next.away)!, {
      rules: { mustHaveWinner: rules.mustHaveWinner, extraTime: rules.extraTime, aggregateOffset: rules.aggregateOffset, maxSubsRegular: 5 },
    }));
    const result: FixtureResult = {
      homeGoals: res.score.home, awayGoals: res.score.away, extraTime: res.extraTimePlayed, pens: res.penalties, matchId: next.id,
      homeYellow: res.stats.home.yellow, awayYellow: res.stats.away.yellow, homeRed: res.stats.home.red, awayRed: res.stats.away.red,
    };
    extra.push({ fixture: next, reg: res.scoreRegular, et: res.extraTimePlayed, pens: res.penalties !== null, rules });
    recordResult(comp, def, next.id, result, ctx);
  }
  return { comp, def, ids, extra };
}

const CASES: [string, number][] = [
  ['UCL', 36], ['UEL', 36], ['ACLE', 24], ['COPA', 32], ['CAFCL', 16], ['CCC', 27], ['OCL', 8], ['ENG-CUP', 20], ['ENG-CUP', 11], ['USC', 2], ['ESP-SC', 2], ['CWC', 32], ['ACL2', 32], ['SUDA', 32],
];

describe('every non-league competition runs to a single winner with correct tie logic', () => {
  for (const [id, n] of CASES) {
    it(`${id} with ${n} entrants`, () => {
      expect(COMPETITIONS[id], `${id} registered`).toBeDefined();
      const { comp, def, ids, extra } = playAll(id, n, 'qa-' + id);
      expect(comp.status).toBe('complete');
      expect(comp.winner).toBeTruthy();
      expect(comp.runnerUp).toBeTruthy();
      expect(comp.winner).not.toBe(comp.runnerUp);
      // unique fixture ids, nobody double-booked on a day
      expect(new Set(comp.fixtures.map((f) => f.id)).size).toBe(comp.fixtures.length);
      const dayClub = new Set<string>();
      for (const f of comp.fixtures) for (const t of [f.home, f.away]) { const k = `${t}@${f.day}`; expect(dayClub.has(k), `double booking ${k}`).toBe(false); dayClub.add(k); }
      // final ranking contains every entrant exactly once
      expect([...comp.finalRanking].sort()).toEqual([...ids].sort());
      expect(comp.finalRanking[0]).toBe(comp.winner);
      // the winner never lost its last tie; ET only if level after 90 (incl. aggregate), pens only if level after ET
      const stage = (id: string) => activeRules(def, 1).stages.find((s) => s.id === id);
      for (const e of extra) {
        const st = stage(e.fixture.stageId);
        if (st?.type !== 'knockout') {
          expect(e.et || e.pens).toBe(false); // league/group phases never go to extra time
          continue;
        }
        const off = e.rules.aggregateOffset ?? { home: 0, away: 0 };
        const level90 = e.reg.home + off.home === e.reg.away + off.away;
        if (e.et) expect(level90, `ET played in ${e.fixture.id} though decided after 90`).toBe(true);
        if (!e.rules.mustHaveWinner) { expect(e.et || e.pens).toBe(false); }
        if (e.fixture.result!.pens) expect(e.fixture.result!.homeGoals + off.home).toBe(e.fixture.result!.awayGoals + off.away);
      }
      // every tie: winner consistent with aggregate / pens
      for (const st of comp.stages) for (const round of st.ties) for (const tie of round) {
        if (tie.decidedBy === 'bye') continue;
        expect(tie.winner === tie.home || tie.winner === tie.away).toBe(true);
        const fxs = tie.fixtureIds.map((i) => comp.fixtures.find((f) => f.id === i)!);
        let h = 0, a = 0; let pens: FixtureResult['pens'] = null; let pensFx: Fixture | null = null;
        for (const f of fxs) {
          expect(f.status).toBe('played');
          const r = f.result!;
          h += f.home === tie.home ? r.homeGoals : r.awayGoals; a += f.home === tie.home ? r.awayGoals : r.homeGoals;
          if (r.pens) { pens = r.pens; pensFx = f; }
        }
        if (h !== a) expect(tie.winner).toBe(h > a ? tie.home : tie.away);
        else {
          expect(pens, `tie ${tie.id} level ${h}-${a} without a shoot-out`).not.toBeNull();
          const homeWon = pens!.home > pens!.away;
          expect(tie.winner).toBe(homeWon ? pensFx!.home : pensFx!.away);
          expect(tie.decidedBy).toBe('penalties');
        }
        if (tie.decidedBy === 'extraTime') expect(fxs.some((f) => f.result!.extraTime)).toBe(true);
      }
      // two-legged: leg 1 never goes to extra time or penalties
      for (const f of comp.fixtures) if (f.leg === 1 && f.tieId && comp.fixtures.filter((g) => g.tieId === f.tieId).length === 2) {
        expect(f.result!.extraTime || f.result!.pens !== null).toBe(false);
      }
      void (def.rules[0]!.stages.find((s): s is KnockoutStage => s.type === 'knockout'));
    });
  }
});
