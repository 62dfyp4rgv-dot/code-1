import { Rng } from '../src/rng';
import { roundRobin, leaguePhasePairings } from '../src/competition/fixtures';
import { createCompetition, recordResult, fixturesOnDay } from '../src/competition/engine';
import { computeTable } from '../src/competition/standings';
import { COMPETITIONS } from '../src/competition/registry';
import type { CompetitionDef, Fixture, FixtureResult } from '../src/competition/types';
import { fakeClubs, ctxFor } from '../test/helpers';

// (a) round robin properties
for (const n of [10, 18, 20, 24]) {
  let worstRun = 0, homeDiff = 0, boundaryBreaks = 0;
  for (let s = 0; s < 50; s++) {
    const ids = Array.from({ length: n }, (_, i) => 't' + i);
    const rr = roundRobin(ids, 2, Rng.fromSeed('rr' + s));
    for (const id of ids) {
      let run = 0, last = '', homes = 0;
      rr.forEach((rd, r) => { const p = rd.find((x) => x.home === id || x.away === id)!; const side = p.home === id ? 'H' : 'A'; if (side === 'H') homes++; run = side === last ? run + 1 : 1; last = side; worstRun = Math.max(worstRun, run); });
      homeDiff = Math.max(homeDiff, Math.abs(homes - rr.length / 2));
      const a = rr[n - 2]!.find((x) => x.home === id || x.away === id)!, b = rr[n - 1]!.find((x) => x.home === id || x.away === id)!;
      if ((a.home === id) === (b.home === id)) boundaryBreaks++;
    }
  }
  console.log(`[roundRobin n=${n} x50 seeds, 2 legs] longest same-venue run ${worstRun}; max |home-away|/2 ${homeDiff}; teams repeating venue across leg boundary ${boundaryBreaks}`);
}

// (b) league phase: formats actually produced
const ucl = COMPETITIONS.UCL!;
for (const n of [16, 18, 20, 24, 28, 30, 32, 36]) {
  let bad = 0, relax: Record<string, number> = {}, fallback = 0; const shapes = new Set<string>();
  for (let s = 0; s < 8; s++) {
    const clubs = fakeClubs(n, ['ENG', 'ESP', 'ITA', 'GER', 'FRA', 'POR', 'NED', 'BEL', 'SCO', 'TUR'], 'lp' + s);
    // skew: 40% of clubs from ENG to stress the country cap
    clubs.forEach((c, i) => { if (i % 5 < 2) c.country = 'ENG'; });
    const ctx = ctxFor(clubs, 'x' + s);
    const comp = createCompetition(ucl, 1, clubs.map((c) => c.id), ctx);
    const fx = comp.fixtures.filter((f) => f.stageId === 'league');
    const per = new Map<string, number>();
    for (const f of fx) { per.set(f.home, (per.get(f.home) ?? 0) + 1); per.set(f.away, (per.get(f.away) ?? 0) + 1); }
    const counts = new Set(per.values());
    if (counts.size !== 1 || [...counts][0] !== 8) { fallback++; shapes.add([...counts].join('/')); }
    const info = (id: string) => ctx.info(id);
    const same = fx.filter((f) => info(f.home).country === info(f.away).country).length;
    if (same > 0) bad++;
    const r = n % 4 !== 0 ? { relaxed: 'n/a' } : leaguePhasePairings(clubs.map((c) => ({ id: c.id, country: c.country, coefficient: c.coefficient })), 4, 2, Rng.fromSeed('lp' + s).derive('zone:main').derive('a0'));
    relax[r.relaxed] = (relax[r.relaxed] ?? 0) + 1;
  }
  console.log(`[leaguePhase UCL n=${n}] runs with !=8 matches/team (not 8) ${fallback}/8 matches-per-team ${[...shapes].join(',')}; runs with same-country fixture ${bad}/8; relaxation levels (directly) ${JSON.stringify(relax)}`);
}

// (c) best-of-place tie-break bias in groups stage (config not used by registry; code path exists)
const baseDef = COMPETITIONS.COPA!;
const grp = baseDef.rules[0]!.stages[0] as any;
const def: CompetitionDef = { ...baseDef, id: 'X', rules: [{ ...baseDef.rules[0]!, entrants: 20, minEntrants: 8, stages: [{ ...grp, groups: 5, advance: 1, bestOfPlace: { place: 2, count: 3 }, pots: 4, avoidSameCountry: false }, { ...(baseDef.rules[0]!.stages[1] as any), pairing: 'seeded' }] }] };
const win: Record<string, number> = {};
for (let s = 0; s < 40; s++) {
  const clubs = fakeClubs(20, ['A', 'B', 'C', 'D'], 'bp' + s);
  const ctx = ctxFor(clubs, 'bp' + s);
  const comp = createCompetition(def, 1, clubs.map((c) => c.id), ctx);
  const gstage = comp.stages[0]!;
  // all matches 1-1 draws => every group is a perfect tie => 2nd-placed rows identical
  for (let day = 0; day < 400 && comp.stageIndex === 0 && comp.status === 'active'; day++) for (const f of fixturesOnDay(comp, day)) recordResult(comp, def, f.id, { homeGoals: 1, awayGoals: 1, extraTime: false, pens: null, matchId: null, homeYellow: 0, awayYellow: 0, homeRed: 0, awayRed: 0 }, ctx);
  const q = comp.stages[0]!.qualified; // firsts (4) + best second
  const bests = q.slice(5);
  const missing = Object.keys(gstage.groups).filter((g) => !bests.some((b) => gstage.groups[g]!.includes(b)) && !q.slice(0,5).includes(gstage.groups[g]![0]!) );
  const dropped = Object.entries(gstage.groups).filter(([, m]) => !bests.some((b) => m.includes(b))).map(([g]) => g);
  for (const g of dropped) win[g] = (win[g] ?? 0) + 1;
}
console.log('[bestOfPlace] group whose runner-up was EXCLUDED from the 3 best runners-up (5 groups) across 40 draws where all groups tie perfectly:', JSON.stringify(win));

// (d) computeTable fuzz: termination + total order on adversarial all-draw leagues
const ids = Array.from({ length: 20 }, (_, i) => 'c' + i);
const fx: Fixture[] = [];
let k = 0; for (const a of ids) for (const b of ids) if (a !== b) fx.push({ id: 'f' + k++, competitionId: 'x', season: 1, stageId: 's', round: 1, leg: 1, tieId: null, group: 'main', home: a, away: b, day: 0, neutral: false, status: 'played', result: { homeGoals: 1, awayGoals: 1, extraTime: false, pens: null, matchId: null, homeYellow: 0, awayYellow: 0, homeRed: 0, awayRed: 0 } as FixtureResult });
const t0 = Date.now();
const tb = ['points', 'h2hPoints', 'h2hGoalDifference', 'h2hGoalsFor', 'goalDifference', 'goalsFor', 'drawLots'] as const;
const t = computeTable(ids, fx, [...tb], 3, 'seed');
console.log('[computeTable all-draw 20 teams] ms', Date.now() - t0, 'positions unique', new Set(t.map((r) => r.position)).size, 'order:', t.slice(0, 5).map((r) => r.clubId).join(','), ' (pure lots)');
// points-not-first misconfiguration
const t2 = computeTable(['a', 'b'], [{ ...fx[0]!, home: 'a', away: 'b', result: { ...(fx[0]!.result as FixtureResult), homeGoals: 0, awayGoals: 3 } }, { ...fx[0]!, id: 'z', home: 'b', away: 'a', result: { ...(fx[0]!.result as FixtureResult), homeGoals: 2, awayGoals: 0 } }], ['goalDifference', 'points'], 3, 's');
console.log('[tiebreak order] ["goalDifference","points"] config ->', t2.map((r) => `${r.clubId} pts${r.points} gd${r.goalDifference}`).join(' | '));
