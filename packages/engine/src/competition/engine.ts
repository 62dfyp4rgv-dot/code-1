/**
 * Generic competition state machine. It interprets `CompetitionDef` rule sets: round-robin leagues, group
 * stages, Swiss-style league phases, and knockout rounds (one or two legs, extra time, penalties).
 * It knows nothing about specific leagues, and nothing about how matches are simulated: callers feed results in
 * through `recordResult` and ask `matchRulesFor` what the match must decide.
 */
import { Rng, hashString } from '../rng';
import {
  colourMatchdays, dayOfFixture, drawGroups, firstRound, leaguePhasePairings, roundRobin, weekOfRound,
  type Pairing, type TeamInfo, DAYS_PER_WEEK,
} from './fixtures';
import { computeTable } from './standings';
import type {
  CompetitionDef, CompetitionState, Fixture, FixtureResult, GroupsStage, KnockoutStage, LeaguePhaseStage,
  RoundRobinStage, RuleSet, StageDef, StageState, Tie,
} from './types';

export interface EngineContext {
  /** Seed namespace for draws, e.g. `${worldSeed}:${season}`. */
  seed: string;
  info(clubId: string): TeamInfo;
}

export function activeRules(def: CompetitionDef, season: number): RuleSet {
  let chosen: RuleSet | undefined;
  for (const r of def.rules) if (r.fromSeason <= season) chosen = r;
  if (!chosen) {
    const first = def.rules[0];
    if (!first) throw new Error(`Competition ${def.id} has no rule sets`);
    return first;
  }
  return chosen;
}

/** True if the competition is held in `season` (supports multi-year periods). */
export function isHeldIn(def: CompetitionDef, season: number): boolean {
  if (season < def.firstSeason) return false;
  return (season - def.firstSeason) % def.period === 0;
}

function blankStage(id: string): StageState {
  return {
    id, status: 'pending', teams: [], groups: {}, ties: [], currentRound: 0, totalRounds: 0,
    qualified: [], playoffQualified: [], eliminated: [], finalTable: {},
  };
}

export function createCompetition(def: CompetitionDef, season: number, entrants: readonly string[], ctx: EngineContext): CompetitionState {
  const rules = activeRules(def, season);
  const comp: CompetitionState = {
    id: def.id, season, ruleFromSeason: rules.fromSeason, entrants: [...entrants], status: 'pending', stageIndex: 0,
    stages: rules.stages.map((s) => blankStage(s.id)), fixtures: [], winner: null, runnerUp: null, tableOrder: [], finalRanking: [],
  };
  if (entrants.length < rules.minEntrants) {
    comp.status = 'skipped';
    return comp;
  }
  // order entrants strongest first for seeding
  const ordered = [...entrants].sort((a, b) => ctx.info(b).coefficient - ctx.info(a).coefficient || (a < b ? -1 : 1));
  comp.entrants = ordered;
  comp.status = 'active';
  startStage(comp, def, rules, 0, ordered, ctx);
  progress(comp, def, ctx);
  return comp;
}

// ---------------------------------------------------------------- fixtures

function makeFixture(
  comp: CompetitionState, stage: StageDef, round: number, n: number, leg: 1 | 2, home: string, away: string, day: number,
  extra: Partial<Fixture>,
): Fixture {
  return {
    id: `${comp.id}:${comp.season}:${stage.id}${extra.group ? `:${extra.group}` : ''}:r${round}:${leg}:${n}`,
    competitionId: comp.id, season: comp.season, stageId: stage.id, round, leg, tieId: null, group: null,
    home, away, day, neutral: false, status: 'scheduled', result: null, ...extra,
  };
}

function seasonDay(season: number, relDay: number): number {
  return (season - 1) * 364 + relDay;
}

function startStage(comp: CompetitionState, def: CompetitionDef, rules: RuleSet, idx: number, teams: string[], ctx: EngineContext): void {
  const stage = rules.stages[idx] as StageDef;
  const st = comp.stages[idx] as StageState;
  const rng = Rng.fromSeed(`${ctx.seed}:${comp.id}:${stage.id}`);
  st.status = 'active';
  st.teams = [...teams];
  comp.stageIndex = idx;
  switch (stage.type) {
    case 'roundRobin': startRoundRobin(comp, stage, st, teams, rng); break;
    case 'groups': startGroups(comp, stage, st, teams, ctx, rng); break;
    case 'leaguePhase': startLeaguePhase(comp, stage, st, teams, ctx, rng); break;
    case 'knockout': startKnockout(comp, def, stage, st, teams, ctx, rng); break;
  }
}

function startRoundRobin(comp: CompetitionState, stage: RoundRobinStage, st: StageState, teams: string[], rng: Rng): void {
  const rounds = roundRobin(teams, stage.legs, rng);
  st.groups = { main: [...teams] };
  st.totalRounds = rounds.length;
  rounds.forEach((round, r) => {
    round.forEach((p, i) => {
      comp.fixtures.push(makeFixture(comp, stage, r + 1, i, 1, p.home, p.away, seasonDay(comp.season, dayOfFixture(stage.schedule, r, i)), { group: 'main' }));
    });
  });
}

function startGroups(comp: CompetitionState, stage: GroupsStage, st: StageState, teams: string[], ctx: EngineContext, rng: Rng): void {
  const infos = teams.map((t) => ctx.info(t));
  const nGroups = Math.max(1, Math.min(stage.groups, Math.floor(teams.length / 2)));
  const groups = drawGroups(infos, nGroups, stage.avoidSameCountry, rng);
  let maxRounds = 0;
  groups.forEach((g, gi) => {
    const gid = String.fromCharCode(65 + gi);
    st.groups[gid] = g.map((t) => t.id);
    const rounds = roundRobin(st.groups[gid] as string[], stage.legs, rng.derive(`g${gi}`));
    maxRounds = Math.max(maxRounds, rounds.length);
    rounds.forEach((round, r) => {
      round.forEach((p, i) => {
        comp.fixtures.push(makeFixture(comp, stage, r + 1, gi * 10 + i, 1, p.home, p.away, seasonDay(comp.season, dayOfFixture(stage.schedule, r, gi * 10 + i)), { group: gid }));
      });
    });
  });
  st.totalRounds = maxRounds;
}

/** Choose the largest pot count ≤ requested that divides the team count. */
function effectivePots(n: number, requested: number): number {
  for (let p = Math.min(requested, Math.floor(n / 2)); p >= 1; p--) if (n % p === 0 && n / p >= 2) return p;
  return 1;
}

function startLeaguePhase(comp: CompetitionState, stage: LeaguePhaseStage, st: StageState, teams: string[], ctx: EngineContext, rng: Rng): void {
  const infos = teams.map((t) => ctx.info(t));
  // A zoned league phase needs every zone to be viable; otherwise fall back to a single table (degenerate fields).
  const zoneCounts = (stage.zones ?? []).map((z) => infos.filter((t) => t.zone === z.id).length);
  const zonesViable = !stage.zones || zoneCounts.every((n) => n >= 4);
  if (!zonesViable) stage = { ...stage, zones: undefined };
  const zoneIds = stage.zones?.map((z) => z.id) ?? ['main'];
  const byZone = new Map<string, TeamInfo[]>();
  for (const z of zoneIds) byZone.set(z, []);
  if (stage.zones) {
    // Teams carry a zone; any team without a valid zone fills the smaller zone.
    for (const t of infos) {
      const z = t.zone && byZone.has(t.zone) ? t.zone : null;
      if (z) (byZone.get(z) as TeamInfo[]).push(t);
    }
    for (const t of infos) {
      if (t.zone && byZone.has(t.zone)) continue;
      const smallest = [...byZone.entries()].sort((a, b) => a[1].length - b[1].length)[0];
      if (smallest) smallest[1].push(t);
    }
  } else {
    byZone.set('main', infos);
  }
  let rounds = 0;
  for (const [zid, zteams] of byZone) {
    st.groups[zid] = zteams.map((t) => t.id);
    const n = zteams.length;
    if (n < 2) continue;
    const zrng = rng.derive(`zone:${zid}`);
    const pots = effectivePots(n, stage.pots);
    const nMatches = Math.min(stage.matches, 2 * pots);
    let pairings: Pairing[];
    let colours: number[] | null = null;
    let nRounds = nMatches;
    if (n >= 2 * pots && n % pots === 0 && nMatches === 2 * pots && pots >= 2) {
      for (let attempt = 0; attempt < 30 && !colours; attempt++) {
        const r = zrng.derive(`a${attempt}`);
        const res = leaguePhasePairings(zteams, pots, stage.maxSameCountryOpponents, r);
        pairings = res.pairings;
        colours = colourMatchdays(zteams.map((t) => t.id), pairings, nMatches, r.derive('col'));
        if (colours) {
          pairings.forEach((p, i) => comp.fixtures.push(makeFixture(comp, stage, (colours as number[])[i] as number + 1, i, 1, p.home, p.away,
            seasonDay(comp.season, dayOfFixture(stage.schedule, (colours as number[])[i] as number, i)), { group: zid })));
        }
      }
    }
    if (!colours) {
      // Fallback (small or awkward fields): single round-robin truncated to a full table.
      const rr = roundRobin(zteams.map((t) => t.id), 1, zrng);
      nRounds = rr.length;
      rr.forEach((round, r) => round.forEach((p, i) => comp.fixtures.push(makeFixture(comp, stage, r + 1, i, 1, p.home, p.away,
        seasonDay(comp.season, dayOfFixture(stage.schedule, r, i)), { group: zid }))));
    }
    rounds = Math.max(rounds, nRounds);
  }
  st.totalRounds = rounds;
}

function legWeeks(stage: KnockoutStage): number {
  return stage.schedule.legGapWeeks ?? 1;
}

function startKnockout(comp: CompetitionState, def: CompetitionDef, stage: KnockoutStage, st: StageState, teams: string[], ctx: EngineContext, rng: Rng): void {
  const ties = buildFirstRoundTies(comp, def, stage, st, teams, ctx, rng);
  st.ties = [ties];
  st.currentRound = 1;
  // total rounds: log2 of bracket size
  let size = ties.length * 2;
  let rounds = 1;
  while (size > 2) { size /= 2; rounds++; }
  st.totalRounds = rounds;
  scheduleRound(comp, stage, st, 1);
}

function buildFirstRoundTies(
  comp: CompetitionState, def: CompetitionDef, stage: KnockoutStage, st: StageState, teams: string[], ctx: EngineContext, rng: Rng,
): Tie[] {
  const mk = (index: number, home: string, away: string): Tie => ({
    id: `${comp.id}:${comp.season}:${stage.id}:t1:${index}`, round: 1, index, home, away, fixtureIds: [], winner: null, decidedBy: null,
  });
  const strongestFirst = (ids: string[]): string[] => [...ids].sort((a, b) => ctx.info(b).coefficient - ctx.info(a).coefficient || (a < b ? -1 : 1));
  switch (stage.pairing) {
    case 'random':
    case 'seeded': {
      const slots = firstRound(strongestFirst(teams), stage.pairing === 'random', rng);
      return slots.map((s, i) => {
        if (s.away === null) return { ...mk(i, s.home, ''), winner: s.home, decidedBy: 'bye' as const };
        // higher seed hosts the deciding leg
        const [a, b] = ctx.info(s.home).coefficient >= ctx.info(s.away).coefficient ? [s.home, s.away] : [s.away, s.home];
        return mk(i, a, b);
      });
    }
    case 'playoffSeeded': {
      // teams ordered by league-phase rank (best first); seeded = first half, unseeded = second half
      const half = teams.length / 2;
      const seeded = teams.slice(0, half);
      const unseeded = teams.slice(half);
      const ties: Tie[] = [];
      let idx = 0;
      for (let k = 0; k < half / 2; k++) {
        const s = seeded.slice(2 * k, 2 * k + 2);
        const u = rng.shuffle(unseeded.slice(unseeded.length - 2 * k - 2, unseeded.length - 2 * k));
        s.forEach((team, j) => ties.push(mk(idx++, team, u[j] as string)));
      }
      return ties;
    }
    case 'leaguePhaseBracket': {
      // teams = [direct qualifiers (ranked)..., playoff winners in tie order...]; top seeds meet winners of the
      // play-off pair group that sits opposite them (seeds 1/2 vs the lowest-ranked group, etc.).
      const nDirect = teams.length / 2;
      const direct = teams.slice(0, nDirect);
      const winners = teams.slice(nDirect);
      const groups: string[][] = [];
      for (let i = 0; i < winners.length; i += 2) groups.push(winners.slice(i, i + 2));
      const ties: Tie[] = [];
      let idx = 0;
      for (let k = 0; k < direct.length / 2; k++) {
        const pair = direct.slice(2 * k, 2 * k + 2);
        const grp = rng.shuffle(groups[groups.length - 1 - k] ?? []);
        pair.forEach((seed, j) => { const w = grp[j]; if (w) ties.push(mk(idx++, seed, w)); });
      }
      return ties;
    }
    case 'regionalSeeded': {
      // teams = [winners of groups A..., runners-up of groups A...]
      const prevStageForCount = comp.stages[comp.stageIndex - 1];
      const g = prevStageForCount ? Object.keys(prevStageForCount.groups).length : Math.floor(teams.length / 2);
      const winners = teams.slice(0, g);
      const runners = teams.slice(g);
      const prevStage = comp.stages[comp.stageIndex - 1];
      const ties: Tie[] = [];
      let chosen = rng.shuffle(runners);
      let bestScore = Infinity;
      for (let attempt = 0; attempt < 200; attempt++) {
        const r = rng.derive(`reg:${attempt}`).shuffle(runners);
        // penalty: same group (never allowed in a valid draw) weighs far more than same country
        let score = 0;
        winners.forEach((w, i) => {
          const ru = r[i] as string;
          if (groupOf(prevStage, w) === groupOf(prevStage, ru)) score += 100;
          if (ctx.info(w).country === ctx.info(ru).country) score += 1;
        });
        if (score < bestScore) { bestScore = score; chosen = r; if (score === 0) break; }
      }
      winners.forEach((w, i) => {
        const opp = chosen[i];
        if (opp === undefined) ties.push({ ...mk(i, w, ''), winner: w, decidedBy: 'bye' });
        else ties.push(mk(i, w, opp));
      });
      for (let i = winners.length; i + 1 < chosen.length; i += 2) ties.push(mk(ties.length, chosen[i] as string, chosen[i + 1] as string));
      return ties;
    }
    case 'zonalSeeded': {
      // teams grouped by zone (stage.teams has been set up by caller ordering): split by recorded zone groups
      const zoneOf = (id: string): string => ctx.info(id).zone ?? 'main';
      const zones = new Map<string, string[]>();
      for (const t of teams) {
        const z = zoneOf(t);
        zones.set(z, [...(zones.get(z) ?? []), t]);
      }
      const ties: Tie[] = [];
      let idx = 0;
      for (const [, zteams] of zones) {
        const slots = firstRound(zteams, false, rng);
        for (const s of slots) {
          if (s.away === null) ties.push({ ...mk(idx++, s.home, ''), winner: s.home, decidedBy: 'bye' });
          else ties.push(mk(idx++, s.home, s.away));
        }
      }
      return ties;
    }
    case 'bracket':
      throw new Error(`Knockout stage ${stage.id} (${def.id}) cannot start with 'bracket' pairing`);
  }
}

function groupOf(prev: StageState | undefined, club: string): string {
  if (!prev) return club;
  for (const [gid, members] of Object.entries(prev.groups)) if (members.includes(club)) return gid;
  return club;
}

function scheduleRound(comp: CompetitionState, stage: KnockoutStage, st: StageState, round: number): void {
  const ties = st.ties[round - 1] as Tie[];
  const roundIdx = round - 1;
  const isFinal = ties.length === 1 && !ties.some((t) => t.decidedBy === 'bye');
  const legs: 1 | 2 = isFinal && stage.finalSingle ? 1 : stage.legs;
  const spec = isFinal && stage.schedule.finalWeek !== undefined
    ? { ...stage.schedule, weeks: [stage.schedule.finalWeek], dow: stage.schedule.finalDow ?? stage.schedule.dow, altDow: undefined }
    : stage.schedule;
  const ri = isFinal && stage.schedule.finalWeek !== undefined ? 0 : roundIdx;
  let n = 0;
  for (const tie of ties) {
    if (tie.decidedBy === 'bye') continue;
    const neutral = isFinal && stage.neutralFinal;
    if (legs === 1) {
      const f = makeFixture(comp, stage, round, n++, 1, tie.home, tie.away, seasonDay(comp.season, dayOfFixture(spec, ri, n)), { tieId: tie.id, neutral });
      comp.fixtures.push(f);
      tie.fixtureIds.push(f.id);
    } else {
      const f1 = makeFixture(comp, stage, round, n++, 1, tie.away, tie.home, seasonDay(comp.season, dayOfFixture(spec, ri, n)), { tieId: tie.id });
      const f2 = makeFixture(comp, stage, round, n++, 2, tie.home, tie.away, seasonDay(comp.season, dayOfFixture(spec, ri, n, legWeeks(stage))), { tieId: tie.id });
      comp.fixtures.push(f1, f2);
      tie.fixtureIds.push(f1.id, f2.id);
    }
  }
}

// ---------------------------------------------------------------- queries

export function fixturesOnDay(comp: CompetitionState, day: number): Fixture[] {
  if (comp.status !== 'active') return [];
  return comp.fixtures.filter((f) => f.day === day && f.status === 'scheduled');
}

export function findFixture(comp: CompetitionState, id: string): Fixture | undefined {
  return comp.fixtures.find((f) => f.id === id);
}

export interface FixtureMatchRules {
  mustHaveWinner: boolean;
  extraTime: boolean;
  aggregateOffset?: { home: number; away: number };
}

export function matchRulesFor(comp: CompetitionState, def: CompetitionDef, fixture: Fixture): FixtureMatchRules {
  const rules = activeRules(def, comp.season);
  const stage = rules.stages.find((s) => s.id === fixture.stageId);
  if (!stage || stage.type !== 'knockout') return { mustHaveWinner: false, extraTime: false };
  if (!fixture.tieId) return { mustHaveWinner: true, extraTime: stage.extraTime };
  const st = comp.stages.find((s) => s.id === fixture.stageId) as StageState;
  const tie = (st.ties[fixture.round - 1] as Tie[]).find((t) => t.id === fixture.tieId) as Tie;
  if (tie.fixtureIds.length === 1) return { mustHaveWinner: true, extraTime: stage.extraTime };
  if (fixture.leg === 1) return { mustHaveWinner: false, extraTime: false };
  const first = findFixture(comp, tie.fixtureIds[0] as string);
  const r = first?.result;
  // leg 2: home side of this fixture was the away side in leg 1
  const offset = r ? { home: r.awayGoals, away: r.homeGoals } : { home: 0, away: 0 };
  return { mustHaveWinner: true, extraTime: stage.extraTime, aggregateOffset: offset };
}

// ---------------------------------------------------------------- results and progression

export function recordResult(comp: CompetitionState, def: CompetitionDef, fixtureId: string, result: FixtureResult, ctx: EngineContext): void {
  const f = findFixture(comp, fixtureId);
  if (!f) throw new Error(`Unknown fixture ${fixtureId}`);
  if (f.status === 'played') throw new Error(`Fixture ${fixtureId} already played`);
  f.result = result;
  f.status = 'played';
  progress(comp, def, ctx);
}

function stageFixtures(comp: CompetitionState, stageId: string): Fixture[] {
  return comp.fixtures.filter((f) => f.stageId === stageId);
}

export function resolveTie(tie: Tie, fixtures: Fixture[], stage: KnockoutStage, seed: string): void {
  const fx = tie.fixtureIds.map((id) => fixtures.find((f) => f.id === id) as Fixture);
  if (fx.some((f) => f.status !== 'played' || !f.result)) return;
  const goals = new Map<string, number>([[tie.home, 0], [tie.away, 0]]);
  const away = new Map<string, number>([[tie.home, 0], [tie.away, 0]]);
  let lastWithPens: Fixture | undefined;
  let lastWithET: Fixture | undefined;
  for (const f of fx) {
    const r = f.result as FixtureResult;
    goals.set(f.home, (goals.get(f.home) ?? 0) + r.homeGoals);
    goals.set(f.away, (goals.get(f.away) ?? 0) + r.awayGoals);
    away.set(f.away, (away.get(f.away) ?? 0) + r.awayGoals);
    if (r.pens) lastWithPens = f;
    if (r.extraTime) lastWithET = f;
  }
  const a = goals.get(tie.home) as number;
  const b = goals.get(tie.away) as number;
  if (a !== b) {
    tie.winner = a > b ? tie.home : tie.away;
    tie.decidedBy = fx.length === 1 ? (lastWithET ? 'extraTime' : 'regulation') : lastWithET ? 'extraTime' : 'aggregate';
    return;
  }
  if (fx.length === 2 && stage.awayGoalsRule) {
    const aa = away.get(tie.home) as number;
    const ba = away.get(tie.away) as number;
    if (aa !== ba) { tie.winner = aa > ba ? tie.home : tie.away; tie.decidedBy = 'awayGoals'; return; }
  }
  if (lastWithPens && lastWithPens.result?.pens) {
    const p = lastWithPens.result.pens;
    const homeWins = p.home > p.away;
    tie.winner = homeWins ? lastWithPens.home : lastWithPens.away;
    tie.decidedBy = 'penalties';
    return;
  }
  // No decision recorded (e.g. engine misconfiguration): deterministic coin flip, flagged as penalties.
  tie.winner = hashString(`${seed}:${tie.id}`) % 2 === 0 ? tie.home : tie.away;
  tie.decidedBy = 'penalties';
}

function tableFor(comp: CompetitionState, rules: RuleSet, stage: StageDef, st: StageState, gid: string, ctx: EngineContext): string[] {
  const tb = stage.type === 'knockout' ? [] : stage.tiebreakers;
  const rows = computeTable(st.groups[gid] as string[], stageFixtures(comp, stage.id).filter((f) => f.group === gid), tb, rules.pointsForWin, `${ctx.seed}:${comp.id}:${gid}`);
  return rows.map((r) => r.clubId);
}

export function progress(comp: CompetitionState, def: CompetitionDef, ctx: EngineContext): void {
  if (comp.status !== 'active') return;
  const rules = activeRules(def, comp.season);
  // loop because completing a stage may immediately complete another (e.g., bye-only rounds)
  for (let guard = 0; guard < 64; guard++) {
    const idx = comp.stageIndex;
    const stage = rules.stages[idx] as StageDef;
    const st = comp.stages[idx] as StageState;
    if (st.status !== 'active') return;
    const fx = stageFixtures(comp, stage.id);
    if (stage.type !== 'knockout') {
      if (fx.length === 0 || fx.some((f) => f.status === 'scheduled')) return;
      completeTableStage(comp, def, rules, stage, st, ctx);
    } else {
      const round = st.currentRound;
      const ties = st.ties[round - 1] as Tie[];
      for (const t of ties) if (t.winner === null) resolveTie(t, comp.fixtures, stage, ctx.seed);
      if (ties.some((t) => t.winner === null)) return;
      if (!advanceKnockout(comp, def, rules, stage, st, ctx)) return;
    }
    if (comp.status !== 'active') return;
  }
}

function nextStageTeams(comp: CompetitionState, rules: RuleSet, idx: number, qualified: string[]): string[] {
  const next = rules.stages[idx + 1];
  if (next && next.type === 'knockout' && next.pairing === 'playoffSeeded') {
    const prev = comp.stages[idx] as StageState;
    return prev.playoffQualified;
  }
  if (next && next.type === 'knockout' && next.pairing === 'leaguePhaseBracket') {
    // direct qualifiers from the last league-phase stage + winners of the stage just finished
    const lpIdx = rules.stages.findIndex((s) => s.type === 'leaguePhase');
    const direct = lpIdx >= 0 ? (comp.stages[lpIdx] as StageState).qualified : [];
    return [...direct, ...qualified];
  }
  return qualified;
}

function finishCompetition(comp: CompetitionState, winner: string | null, runnerUp: string | null): void {
  comp.status = 'complete';
  comp.winner = winner;
  comp.runnerUp = runnerUp;
  const rank: string[] = [];
  const seen = new Set<string>();
  const push = (id: string | null): void => { if (id && !seen.has(id)) { seen.add(id); rank.push(id); } };
  push(winner); push(runnerUp);
  // later eliminations rank higher
  for (let i = comp.stages.length - 1; i >= 0; i--) {
    const st = comp.stages[i] as StageState;
    for (let j = st.eliminated.length - 1; j >= 0; j--) push(st.eliminated[j] as string);
  }
  for (const id of comp.tableOrder) push(id);
  for (const id of comp.entrants) push(id);
  comp.finalRanking = rank;
}

function completeTableStage(comp: CompetitionState, def: CompetitionDef, rules: RuleSet, stage: RoundRobinStage | GroupsStage | LeaguePhaseStage, st: StageState, ctx: EngineContext): void {
  const idx = comp.stageIndex;
  const isLast = idx === rules.stages.length - 1;
  const gids = Object.keys(st.groups);
  const tables: Record<string, string[]> = {};
  for (const gid of gids) tables[gid] = tableFor(comp, rules, stage, st, gid, ctx);
  st.finalTable = tables;
  if (comp.tableOrder.length === 0 && stage.type !== 'groups') {
    comp.tableOrder = gids.length === 1 ? (tables[gids[0] as string] as string[]) : interleaveZones(gids, tables);
  }
  st.status = 'complete';

  let qualified: string[] = [];
  const eliminated: string[] = [];
  if (stage.type === 'roundRobin') {
    const table = tables.main as string[];
    const adv = stage.advance ?? 0;
    qualified = table.slice(0, adv);
    eliminated.push(...table.slice(adv).reverse());
    if (isLast) {
      finishCompetition(comp, table[0] ?? null, table[1] ?? null);
      return;
    }
  } else if (stage.type === 'groups') {
    const firsts: string[] = [];
    const seconds: string[] = [];
    const extras: { club: string; pts: number; gd: number; gf: number }[] = [];
    for (const gid of gids) {
      const t = tables[gid] as string[];
      firsts.push(...t.slice(0, 1));
      seconds.push(...t.slice(1, stage.advance));
      if (stage.bestOfPlace) {
        const c = t[stage.bestOfPlace.place - 1];
        if (c) {
          const row = computeTable(st.groups[gid] as string[], stageFixtures(comp, stage.id).filter((f) => f.group === gid), stage.tiebreakers, rules.pointsForWin, 'x').find((r) => r.clubId === c);
          if (row) extras.push({ club: c, pts: row.points, gd: row.goalDifference, gf: row.goalsFor });
        }
      }
    }
    extras.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
    const best = extras.slice(0, stage.bestOfPlace?.count ?? 0).map((e) => e.club);
    qualified = [...firsts, ...seconds, ...best];
    const q = new Set(qualified);
    for (const gid of gids) for (const c of [...(tables[gid] as string[])].reverse()) if (!q.has(c)) eliminated.push(c);
  } else {
    // league phase: per zone, rank → direct / playoff / out
    const direct: string[] = [];
    const playoff: string[] = [];
    const out: string[] = [];
    const zoneTables = gids.map((g) => tables[g] as string[]);
    // Smaller-than-nominal fields scale the bracket: play-off teams = 2 x direct qualifiers keeps pairings valid.
    const smallest = Math.min(...zoneTables.map((t) => t.length));
    let nDirect = stage.advanceDirect;
    let nPlayoff = stage.advancePlayoff;
    if (smallest < nDirect + nPlayoff) {
      if (nPlayoff === 0) nDirect = Math.min(nDirect, smallest);
      else {
        // direct qualifiers must be a power of two so the bracket stays balanced
        let p2 = 2;
        while (p2 * 2 <= Math.floor(smallest / 3)) p2 *= 2;
        nDirect = p2;
        nPlayoff = 2 * nDirect;
      }
    }
    // for multi-zone, interleave by rank so that ordering stays global (rank 1 of each zone first, ...)
    const maxLen = Math.max(...zoneTables.map((t) => t.length));
    for (let r = 0; r < maxLen; r++) {
      for (const t of zoneTables) {
        const c = t[r];
        if (!c) continue;
        if (r < nDirect) direct.push(c);
        else if (r < nDirect + nPlayoff) playoff.push(c);
        else out.push(c);
      }
    }
    qualified = direct;
    st.playoffQualified = playoff;
    eliminated.push(...out.reverse());
  }
  st.qualified = qualified;
  st.eliminated = eliminated;
  const next = rules.stages[idx + 1];
  if (!next) {
    finishCompetition(comp, comp.tableOrder[0] ?? null, comp.tableOrder[1] ?? null);
    return;
  }
  const teams = nextStageTeams(comp, rules, idx, qualified);
  startStage(comp, def, rules, idx + 1, teams, ctx);
}

function interleaveZones(gids: string[], tables: Record<string, string[]>): string[] {
  const out: string[] = [];
  const max = Math.max(...gids.map((g) => (tables[g] as string[]).length));
  for (let r = 0; r < max; r++) for (const g of gids) { const c = (tables[g] as string[])[r]; if (c) out.push(c); }
  return out;
}

/** Called when every tie in the current round has a winner. Returns true if the loop should continue. */
function advanceKnockout(comp: CompetitionState, def: CompetitionDef, rules: RuleSet, stage: KnockoutStage, st: StageState, ctx: EngineContext): boolean {
  const round = st.currentRound;
  const ties = st.ties[round - 1] as Tie[];
  const winners = ties.map((t) => t.winner as string);
  for (const t of ties) {
    if (t.decidedBy === 'bye') continue;
    const loser = t.winner === t.home ? t.away : t.home;
    st.eliminated.push(loser);
  }
  // If this stage is a single "playoff-style" round (e.g. league-phase play-off), it ends after one round.
  const singleRoundStage = stage.pairing === 'playoffSeeded';
  if (winners.length === 1 || singleRoundStage) {
    st.status = 'complete';
    st.qualified = winners;
    const idx = comp.stageIndex;
    const next = rules.stages[idx + 1];
    if (!next) {
      const finalTie = ties[0] as Tie;
      finishCompetition(comp, finalTie.winner, finalTie.winner === finalTie.home ? finalTie.away : finalTie.home);
      return false;
    }
    startStage(comp, def, rules, idx + 1, nextStageTeams(comp, rules, idx, winners), ctx);
    return true;
  }
  // build next round by bracket progression
  const nextRound = round + 1;
  const nextTies: Tie[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    const a = winners[i] as string;
    const b = winners[i + 1];
    const id = `${comp.id}:${comp.season}:${stage.id}:t${nextRound}:${i / 2}`;
    if (b === undefined) {
      // odd number of survivors (unbalanced zones): the last club receives a bye
      nextTies.push({ id, round: nextRound, index: i / 2, home: a, away: '', fixtureIds: [], winner: a, decidedBy: 'bye' });
      continue;
    }
    const [h, w] = ctx.info(a).coefficient >= ctx.info(b).coefficient ? [a, b] : [b, a];
    nextTies.push({ id, round: nextRound, index: i / 2, home: h, away: w, fixtureIds: [], winner: null, decidedBy: null });
  }
  st.ties.push(nextTies);
  st.currentRound = nextRound;
  scheduleRound(comp, stage, st, nextRound);
  return true;
}

// ---------------------------------------------------------------- helpers for callers

export function currentTable(comp: CompetitionState, def: CompetitionDef, ctx: EngineContext, stageIndex = 0, group = 'main'): ReturnType<typeof computeTable> {
  const rules = activeRules(def, comp.season);
  const stage = rules.stages[stageIndex];
  const st = comp.stages[stageIndex];
  if (!stage || !st || stage.type === 'knockout') return [];
  const ids = st.groups[group] ?? Object.values(st.groups)[0] ?? [];
  const tb = stage.tiebreakers;
  return computeTable(ids, stageFixtures(comp, stage.id).filter((f) => f.group === group || group === 'main' || f.group === null), tb, rules.pointsForWin, `${ctx.seed}:${comp.id}:${group}`);
}

export function remainingFixtures(comp: CompetitionState): number {
  return comp.fixtures.filter((f) => f.status === 'scheduled').length;
}

export { weekOfRound, DAYS_PER_WEEK };
