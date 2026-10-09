/**
 * Layered match engine.
 *
 * The match is simulated as a sequence of possessions ("sequences") consuming real match-clock seconds.
 * Each sequence passes through up to three phases:
 *   1. build-up      (retention vs. pressing)
 *   2. progression   (reaching the final third vs. compactness / line height / pace in behind)
 *   3. chance creation (creativity vs. defensive quality) -> shot -> block / save / goal
 * Fouls, offsides, set pieces, penalties, cards, injuries, substitutions and tactical adaptation are
 * layered on top. Possession is *emergent* (who wins the ball next), not a drawn percentage.
 *
 * Statistics are derived from the same events that produced the score, so they are internally consistent
 * by construction (see `deriveStatsFromEvents` and the consistency tests).
 *
 * Strength enters the model once per stage via team-function ratings (build-up, progression, creativity,
 * pressing, defending, pace, aerial, set pieces) plus individual finishing/goalkeeping at shot resolution.
 * Chance *quantity* and chance *quality* use separate, calibrated coefficients; the calibration tests
 * verify the combined effect size, so strength is not silently over-counted.
 */
import { clamp, logit, shiftOdds, sigmoid } from './math';
import {
  computeEffectiveSkills, familiarity, type Condition, type Skills,
} from './players';
import { Rng } from './rng';
import {
  FORMATIONS, FNS, POSITION_FN_WEIGHTS, ROLES, defaultRoleFor, tacticalProfile,
  type Fn, type RoleDef, type TacticalProfile,
} from './tactics';
import type { Attributes, Position, PlayerTrait, Tactics } from './types';

// ------------------------------------------------------------------ public types

export interface MatchPlayer {
  id: string;
  name: string;
  primary: Position;
  positions: Partial<Record<Position, number>>;
  attrs: Attributes;
  traits: PlayerTrait[];
  fatigue: number;
  form: number;
  morale: number;
  confidence: number;
  consistency: number;
  injuryProneness: number;
  age: number;
}

export interface TeamSheet {
  clubId: string;
  name: string;
  tactics: Tactics;
  /** First 11 = starters in formation slot order (GK first). Remainder = bench. */
  players: MatchPlayer[];
  /** 0..1 familiarity/chemistry of the group. */
  cohesion: number;
  /** Manager tactical knowledge 0..100; drives quality of in-game adaptation. */
  acumen: number;
}

export interface MatchConditions {
  neutral: boolean;
  attendanceFrac: number; // 0..1 of stadium capacity
  weather: 'clear' | 'rain' | 'heat' | 'cold';
  refereeStrictness: number; // 0.7..1.4 multiplier on card probabilities
  importance: number; // 0..1, mildly raises intensity
}

export interface MatchRules {
  /** If true, a draw after 90 minutes is resolved with extra time (and penalties if needed). */
  mustHaveWinner: boolean;
  extraTime: boolean;
  /** Goals already scored by each side in the earlier leg(s); winner determined on aggregate. */
  aggregateOffset?: { home: number; away: number };
  maxSubsRegular: number;
}

export interface MatchInput {
  id: string;
  seed: string;
  home: TeamSheet;
  away: TeamSheet;
  conditions: MatchConditions;
  rules: MatchRules;
}

export type Side = 'home' | 'away';
export type GoalKind = 'open' | 'header' | 'penalty' | 'freeKick' | 'corner' | 'counter' | 'longShot' | 'ownGoal';
export type ShotOutcome = 'goal' | 'saved' | 'off' | 'blocked' | 'post';

interface EvBase { minute: number; period: 1 | 2 | 3 | 4; side: Side }
export type MatchEvent =
  | (EvBase & { type: 'kickoff' })
  | (EvBase & { type: 'halftime' })
  | (EvBase & { type: 'fulltime' })
  | (EvBase & { type: 'extraTimeStart' })
  | (EvBase & { type: 'shot'; playerId: string; xg: number; outcome: ShotOutcome; kind: GoalKind; keeperId: string | null })
  | (EvBase & { type: 'goal'; scorerId: string; assistId: string | null; xg: number; kind: GoalKind; home: number; away: number })
  | (EvBase & { type: 'foul'; playerId: string; victimId: string | null; inBox: boolean })
  | (EvBase & { type: 'card'; playerId: string; card: 'yellow' | 'red' | 'secondYellow' })
  | (EvBase & { type: 'sub'; offId: string; onId: string; reason: 'tactical' | 'injury' | 'fatigue' | 'goalkeeper' })
  | (EvBase & { type: 'injury'; playerId: string; severity: 1 | 2 | 3 | 4 })
  | (EvBase & { type: 'corner' })
  | (EvBase & { type: 'offside'; playerId: string })
  | (EvBase & { type: 'tactical'; change: string })
  | (EvBase & { type: 'shootout'; playerId: string; scored: boolean });

export interface PlayerLine {
  playerId: string;
  name: string;
  side: Side;
  position: Position;
  started: boolean;
  minutes: number;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  xg: number;
  passes: number;
  passesCompleted: number;
  keyPasses: number;
  tackles: number;
  interceptions: number;
  saves: number;
  goalsConceded: number;
  fouls: number;
  foulsWon: number;
  yellow: number;
  red: number;
  rating: number;
  fatigueEnd: number;
}

export interface TeamStats {
  possession: number; // percentage of ball-in-play time
  passes: number;
  passesCompleted: number;
  shots: number;
  shotsOnTarget: number;
  xg: number;
  saves: number;
  corners: number;
  fouls: number;
  yellow: number;
  red: number;
  offsides: number;
  tackles: number;
  interceptions: number;
  substitutions: number;
}

export interface MatchResult {
  id: string;
  seed: string;
  homeClubId: string;
  awayClubId: string;
  score: { home: number; away: number };
  /** Score after 90 minutes. */
  scoreRegular: { home: number; away: number };
  extraTimePlayed: boolean;
  penalties: { home: number; away: number } | null;
  /** 'home' | 'away' | 'draw' - final outcome including ET/penalties/aggregate when applicable. */
  winner: Side | 'draw';
  events: MatchEvent[];
  stats: { home: TeamStats; away: TeamStats };
  players: PlayerLine[];
  motm: string | null;
  injuries: { playerId: string; severity: 1 | 2 | 3 | 4; minute: number }[];
  /** Total match duration in minutes including stoppage. */
  duration: number;
  stoppage: { first: number; second: number };
}

// ------------------------------------------------------------------ calibration parameters

/**
 * Documented, tunable parameters. All logit coefficients are per rating point (ratings are on the 1..100
 * attribute scale). Probabilities are for an average-vs-average matchup before shifts.
 */
export const MATCH_PARAMS = {
  beta: 0.0155, // generic logit shift per rating point
  homeAdvantageLogit: 0.17, // total home-vs-away swing for a full stadium, applied half each way
  build: { loseBase: 0.205, pressWeightMin: 0.35, pressWeightRange: 0.9, directnessLoss: 0.5 },
  progress: { successBase: 0.44, compression: 0.85, behindLine: 1.1, mentality: 0.11, directBypass: 0.95, directAerial: 0.013 },
  create: { chanceBase: 0.222, mentality: 0.12, directPenalty: 0.3 },
  /**
   * Counter-attacking: transitions only pay off when the opponent is *exposed* (high line, attacking mentality,
   * pressing). A counter-oriented team converts more turnovers into transitions and exploits space better, but plays
   * its settled possessions more cautiously.
   */
  counter: { convertMid: 0.30, convertCounterExtra: 0.05, convertFinal: 0.18, progressBase: 0.08, progressExposure: 0.4, createBase: 0.04, createExposure: 0.22, specialistMult: 1.2, settledProgressPenalty: 0.22, settledCreatePenalty: 0.14 },
  /** Chance quality scales with rating edge with this coefficient (separate from quantity beta). */
  qualityBeta: 0.0055,
  xgGammaShape: 1.5,
  shot: { blockBase: 0.17, onTargetBase: 0.265, finishBeta: 0.012, keeperBeta: 0.015 },
  foul: { perSequence: 0.20, inBoxShare: 0.045, yellowBase: 0.15, redStraight: 0.0013, secondYellowCare: 0.22 },
  offsideBase: 0.012,
  injury: { perPlayerMinute: 0.000215 },
  fatigue: { perMinute: 0.27 },
  /** Points removed from every team function for each missing player (red card/injury with no sub). */
  manDownPenalty: 5.5,
  /** Rating points gained per +100% function capacity vs reference formation. */
  capacityK: 14,
  seqSeconds: { build: [9, 17], progress: [6, 13], create: [6, 12] },
} as const;

// ------------------------------------------------------------------ internal state

const FILL_SKILL = 22; // used for a missing goalkeeper (outfielder in goal)

interface SimPlayer {
  mp: MatchPlayer;
  side: Side;
  slotPos: Position;
  role: RoleDef;
  skills: Skills;
  fatigue: number;
  state: 'bench' | 'on' | 'off' | 'sentOff';
  yellow: number;
  entered: number; // match seconds
  left: number; // match seconds
  line: PlayerLine;
  dayFactor: number;
  wShoot: number;
}

interface Ratings {
  buildUp: number; progress: number; create: number; press: number; defend: number;
  aerial: number; pace: number; setPiece: number; keeper: number;
}

interface TeamState {
  side: Side;
  sheet: TeamSheet;
  prof: TacticalProfile;
  base: Tactics;
  mentalityShift: number;
  squad: SimPlayer[];
  onPitch: SimPlayer[];
  subsUsed: number;
  windowsUsed: number;
  ratings: Ratings;
  score: number;
  possessionSeconds: number;
  stats: Omit<TeamStats, 'possession'>;
  acumen: number;
  capRef: Record<Fn, number>;
  homeBoost: number; // logit shift applied to this team's attacking stages
  adaptedAt: number;
  /** Cumulative passer-selection weights per phase, aligned with `onPitch`. Rebuilt in computeRatings. */
  passCum: Record<'buildUp' | 'progress' | 'create', number[]>;
}

// Reference capacity per function: average weight sum across formations with default roles.
const CAP_REF: Record<Fn, number> = (() => {
  const acc = {} as Record<Fn, number>;
  for (const fn of FNS) acc[fn] = 0;
  const forms = Object.values(FORMATIONS);
  for (const fm of forms) {
    for (const pos of fm.slots) {
      const role = ROLES[defaultRoleFor(pos)] as RoleDef;
      for (const fn of FNS) acc[fn] += POSITION_FN_WEIGHTS[pos][fn] * (role.mod[fn] ?? 1);
    }
  }
  for (const fn of FNS) acc[fn] /= forms.length;
  return acc;
})();

function dutyMult(duty: RoleDef['duty'], fn: Fn): number {
  if (duty === 'attack') return fn === 'create' || fn === 'shoot' ? 1.12 : fn === 'defend' ? 0.85 : 1;
  if (duty === 'defend') return fn === 'create' || fn === 'shoot' ? 0.85 : fn === 'defend' ? 1.12 : 1;
  return 1;
}

function makeSimPlayer(mp: MatchPlayer, side: Side, pos: Position, roleId: string, rng: Rng, started: boolean): SimPlayer {
  const cond: Condition = {
    fatigue: mp.fatigue, form: mp.form, morale: mp.morale, confidence: mp.confidence,
    dayFactor: clamp(1 + rng.normal(0, 0.025 + (1 - mp.consistency) * 0.07), 0.82, 1.18),
  };
  const skills = computeEffectiveSkills(mp.attrs, cond);
  const fam = familiarity(mp, pos);
  const famMult = 0.5 + 0.5 * fam;
  for (const k of Object.keys(skills) as (keyof Skills)[]) {
    if (k === 'keeper') skills[k] = pos === 'GK' ? skills[k] * famMult : Math.min(skills[k], FILL_SKILL);
    else skills[k] = skills[k] * famMult;
  }
  return {
    mp, side, slotPos: pos, role: (ROLES[roleId] ?? ROLES[defaultRoleFor(pos)]) as RoleDef,
    skills, fatigue: mp.fatigue, state: started ? 'on' : 'bench', yellow: 0,
    entered: 0, left: 0, dayFactor: cond.dayFactor, wShoot: 0,
    line: {
      playerId: mp.id, name: mp.name, side, position: pos, started, minutes: 0, goals: 0, assists: 0, shots: 0,
      shotsOnTarget: 0, xg: 0, passes: 0, passesCompleted: 0, keyPasses: 0, tackles: 0, interceptions: 0,
      saves: 0, goalsConceded: 0, fouls: 0, foulsWon: 0, yellow: 0, red: 0, rating: 6, fatigueEnd: mp.fatigue,
    },
  };
}

function computeRatings(t: TeamState): void {
  const on = t.onPitch;
  const prof = t.prof;
  const out = {} as Ratings;
  const sum = {} as Record<Fn, number>;
  const wsum = {} as Record<Fn, number>;
  for (const fn of FNS) { sum[fn] = 0; wsum[fn] = 0; }
  let keeper = FILL_SKILL;
  for (const sp of on) {
    const base = POSITION_FN_WEIGHTS[sp.slotPos];
    for (const fn of FNS) {
      const w = base[fn] * (sp.role.mod[fn] ?? 1) * dutyMult(sp.role.duty, fn);
      if (w <= 0) continue;
      // Tired legs matter more as the match progresses, via skills recomputed from fatigue.
      const skill = fn === 'pace' ? sp.skills.pace : sp.skills[fn as keyof Skills];
      sum[fn] += w * skill;
      wsum[fn] += w;
    }
    if (sp.slotPos === 'GK') keeper = sp.skills.keeper;
  }
  const missing = Math.max(0, 11 - on.length);
  const cohesionBonus = (t.sheet.cohesion - 0.5) * 3; // +-1.5 rating points at the extremes
  const get = (fn: Fn): number => {
    const w = wsum[fn];
    const avg = w > 0 ? sum[fn] / w : FILL_SKILL;
    const cap = w / t.capRef[fn];
    const capTerm = MATCH_PARAMS.capacityK * clamp(cap - 1, -0.45, 0.45);
    return avg + capTerm - missing * MATCH_PARAMS.manDownPenalty + cohesionBonus;
  };
  out.buildUp = get('buildUp');
  out.progress = get('progress');
  out.create = get('create');
  out.press = get('press');
  out.defend = get('defend');
  out.aerial = get('aerial');
  out.pace = get('pace');
  out.setPiece = get('setPiece');
  out.keeper = keeper;
  t.ratings = out;
  for (const fn of ['buildUp', 'progress', 'create'] as const) {
    const cum: number[] = [];
    let acc = 0;
    for (const sp of on) {
      acc += POSITION_FN_WEIGHTS[sp.slotPos][fn] * (sp.role.mod[fn] ?? 1) * Math.max(sp.skills[fn], 5) / 50;
      cum.push(acc);
    }
    t.passCum[fn] = cum;
  }
  // Shooter weights
  for (const sp of on) {
    const base = POSITION_FN_WEIGHTS[sp.slotPos].shoot * (sp.role.mod.shoot ?? 1) * sp.role.shotShare;
    sp.wShoot = base * Math.pow(Math.max(sp.skills.shoot, 5) / 55, 1.6);
  }
  void prof;
}

function refreshProfile(t: TeamState): void {
  const p = tacticalProfile(t.base);
  p.mentality = clamp(p.mentality + t.mentalityShift, -2, 2);
  t.prof = p;
}

function buildTeam(side: Side, sheet: TeamSheet, rng: Rng, homeBoost: number): TeamState {
  const fm = FORMATIONS[sheet.tactics.formation];
  if (!fm) throw new Error(`Unknown formation ${sheet.tactics.formation}`);
  if (sheet.players.length < 11) throw new Error(`Team ${sheet.clubId} has fewer than 11 players`);
  const squad: SimPlayer[] = sheet.players.map((mp, i) => {
    const started = i < 11;
    const pos = started ? (fm.slots[i] as Position) : mp.primary;
    const roleId = started ? (sheet.tactics.roles[i] ?? defaultRoleFor(pos)) : defaultRoleFor(pos);
    return makeSimPlayer(mp, side, pos, roleId, rng, started);
  });
  const t: TeamState = {
    side, sheet, base: sheet.tactics, prof: tacticalProfile(sheet.tactics), mentalityShift: 0,
    squad, onPitch: squad.slice(0, 11), subsUsed: 0, windowsUsed: 0,
    ratings: {} as Ratings, score: 0, possessionSeconds: 0,
    stats: {
      passes: 0, passesCompleted: 0, shots: 0, shotsOnTarget: 0, xg: 0, saves: 0, corners: 0, fouls: 0,
      yellow: 0, red: 0, offsides: 0, tackles: 0, interceptions: 0, substitutions: 0,
    },
    acumen: sheet.acumen, capRef: CAP_REF, homeBoost, adaptedAt: 0,
    passCum: { buildUp: [], progress: [], create: [] },
  };
  refreshProfile(t);
  computeRatings(t);
  return t;
}

// ------------------------------------------------------------------ simulation core

interface Ctx {
  rng: Rng;
  home: TeamState;
  away: TeamState;
  events: MatchEvent[];
  clock: number; // seconds of play (cumulative, including stoppage already added)
  period: 1 | 2 | 3 | 4;
  input: MatchInput;
  injuries: MatchResult['injuries'];
  conditions: MatchConditions;
  heatFatigue: number;
  rainPassPenalty: number;
}

const other = (s: Side): Side => (s === 'home' ? 'away' : 'home');
const teamOf = (c: Ctx, s: Side): TeamState => (s === 'home' ? c.home : c.away);
const minuteOf = (c: Ctx): number => Math.max(1, Math.floor(c.clock / 60) + 1);

type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

function emit(c: Ctx, ev: DistOmit<MatchEvent, 'minute' | 'period'> & { minute?: number }): void {
  c.events.push({ minute: minuteOf(c), period: c.period, ...ev } as MatchEvent);
}

function weightedPlayer(c: Ctx, pool: readonly SimPlayer[], w: (p: SimPlayer) => number): SimPlayer | null {
  if (pool.length === 0) return null;
  return c.rng.weightedPick(pool, w);
}

function outfield(t: TeamState): SimPlayer[] {
  return t.onPitch.filter((p) => p.slotPos !== 'GK');
}

function keeperOf(t: TeamState): SimPlayer | null {
  return t.onPitch.find((p) => p.slotPos === 'GK') ?? null;
}

function addPasses(c: Ctx, t: TeamState, n: number, fn: 'buildUp' | 'progress' | 'create', failLast: boolean): SimPlayer | null {
  if (n <= 0 && !failLast) return null;
  const cum = t.passCum[fn];
  const total = cum[cum.length - 1] ?? 0;
  if (total <= 0) return null;
  const count = Math.max(failLast ? 1 : 0, n);
  let last: SimPlayer | null = null;
  for (let i = 0; i < count; i++) {
    const r = c.rng.next() * total;
    let idx = 0;
    while (idx < cum.length - 1 && (cum[idx] as number) <= r) idx++;
    const p = t.onPitch[idx];
    if (!p) continue;
    p.line.passes++;
    t.stats.passes++;
    if (!(failLast && i === count - 1)) {
      p.line.passesCompleted++;
      t.stats.passesCompleted++;
    }
    last = p;
  }
  return last;
}

function poisson(c: Ctx, lambda: number): number {
  return c.rng.poisson(Math.max(0, lambda));
}

type EndKind = 'turnover' | 'shotSaved' | 'shotOff' | 'shotBlocked' | 'goal' | 'foul' | 'offside' | 'corner' | 'penalty' | 'freeKick';

interface SeqResult {
  end: EndKind;
  seconds: number;
  /** Who gets the ball next, and in what mode. */
  next: { side: Side; mode: 'build' | 'transitionHigh' | 'transitionMid' | 'corner' | 'freeKickAtt' | 'goalKickNormal' | 'kickoff' };
}

/** Probability helper: shift base probability by rating difference and extra logit terms. */
function prob(base: number, ratingDiff: number, extraLogit = 0): number {
  return shiftOdds(base, MATCH_PARAMS.beta * ratingDiff + extraLogit);
}

function rangeSeconds(c: Ctx, [lo, hi]: readonly [number, number], mult: number): number {
  return c.rng.float(lo, hi) * mult;
}

function shotXg(c: Ctx, mean: number, quality: number): number {
  const shape = MATCH_PARAMS.xgGammaShape;
  const g = c.rng.gamma(shape) / shape;
  return clamp(mean * quality * g, 0.008, 0.85);
}

/** How disorganised a team is when it loses the ball: high line, attacking mentality and pressing leave space behind. */
function exposureOf(t: TeamState): number {
  return clamp(0.15 + 0.38 * t.prof.line + 0.12 * t.prof.mentality + 0.34 * (t.prof.pressing - 0.5), 0, 1.3);
}

function runSequence(
  c: Ctx, A: TeamState, D: TeamState, mode: SeqResult['next']['mode'],
): SeqResult {
  const P = MATCH_PARAMS;
  const ap = A.prof;
  const dp = D.prof;
  const rng = c.rng;
  let seconds = 0;
  const durMult = ap.durationMult;
  const ha = A.homeBoost;

  // ---- set-piece / special entry modes
  if (mode === 'corner') {
    return runCorner(c, A, D);
  }
  if (mode === 'freeKickAtt') {
    return runAttackingFreeKick(c, A, D);
  }

  const transition = mode === 'transitionHigh' || mode === 'transitionMid';
  const r = A.ratings;
  const dr = D.ratings;

  // ---- Phase 1: build-up (skipped for high transitions)
  if (!transition) {
    const pressW = P.build.pressWeightMin + P.build.pressWeightRange * dp.pressing * (1 - 0.5 * ap.directness);
    const extra = P.build.directnessLoss * (ap.directness - 0.5) - ha;
    const pLose = prob(P.build.loseBase, (dr.press - r.buildUp) * pressW, extra);
    const n1 = poisson(c, 3.4 * (1 - 0.72 * ap.directness) * (0.8 + 0.4 * (1 - ap.tempo)));
    seconds += rangeSeconds(c, P.seqSeconds.build, durMult * (0.7 + 0.5 * (1 - ap.directness)));
    if (rng.chance(pLose)) {
      addPasses(c, A, n1, 'buildUp', rng.chance(0.78));
      return turnover(c, A, D, 'build', seconds, mode);
    }
    addPasses(c, A, n1, 'buildUp', false);
  }

  // ---- Phase 2: progression into the final third
  if (mode !== 'transitionHigh') {
    const behind = P.progress.behindLine * (ap.directness * 0.6) * dp.line * P.beta * (r.pace - dr.pace);
    const C = P.counter;
    const exposure = exposureOf(D);
    const transBonus = transition ? C.progressBase + C.progressExposure * exposure * (ap.counter ? C.specialistMult : 1) : 0;
    const settledPenalty = !transition && ap.counter ? C.settledProgressPenalty : 0;
    // long balls bypass midfield; they work better with aerial/physical superiority
    const direct = P.progress.directBypass * (ap.directness - 0.5) + P.progress.directAerial * ap.directness * (r.aerial - dr.aerial);
    const extra =
      -P.progress.compression * (dp.line - 0.5) * (1 - ap.directness) +
      behind +
      direct +
      P.progress.mentality * ap.mentality +
      0.15 * dp.mentality + // an attacking opponent leaves gaps behind its own line
      transBonus - settledPenalty +
      ha;
    const defLevel = dr.defend * (0.85 + 0.15 * (1 - dp.line));
    const pProg = prob(P.progress.successBase, 0.55 * r.progress + 0.45 * r.buildUp - defLevel, extra);
    const n2 = poisson(c, 2.3 * (1 - 0.55 * ap.directness));
    seconds += rangeSeconds(c, P.seqSeconds.progress, durMult * (0.7 + 0.5 * (1 - ap.directness)));
    // offside: more likely against a high line and when playing balls in behind
    const pOff = clamp(P.offsideBase * (0.4 + 1.3 * dp.line) * (0.6 + 0.9 * ap.directness), 0, 0.2);
    if (rng.chance(pOff)) {
      addPasses(c, A, n2, 'progress', false);
      const off = weightedPlayer(c, outfield(A), (p) => POSITION_FN_WEIGHTS[p.slotPos].shoot + 0.1);
      if (off) {
        emit(c, { type: 'offside', side: A.side, playerId: off.mp.id });
        A.stats.offsides++;
      }
      return { end: 'offside', seconds, next: { side: D.side, mode: 'build' } };
    }
    if (!rng.chance(pProg)) {
      addPasses(c, A, n2, 'progress', rng.chance(0.7));
      return turnover(c, A, D, 'mid', seconds, mode);
    }
    addPasses(c, A, n2, 'progress', false);
    // fouls in midfield
    const foul = maybeFoul(c, A, D, false);
    if (foul) return foul;
  }

  // ---- Phase 3: chance creation
  const highTrans = mode === 'transitionHigh';
  const defEff = dr.defend * (1 + 0.1 * (0.5 - dp.line));
  const C3 = P.counter;
  const exposure3 = exposureOf(D);
  const transCreate = highTrans
    ? 0.2 + 0.35 * exposure3
    : transition ? C3.createBase + C3.createExposure * exposure3 * (ap.counter ? C3.specialistMult : 1) : 0;
  const extra3 =
    P.create.mentality * ap.mentality +
    0.09 * dp.mentality +
    transCreate -
    P.create.directPenalty * (ap.directness - 0.5) -
    (!transition && ap.counter ? C3.settledCreatePenalty : 0) +
    ha;
  const pChance = prob(P.create.chanceBase, r.create - defEff, extra3);
  const n3 = poisson(c, 1.5);
  seconds += rangeSeconds(c, P.seqSeconds.create, durMult);
  const foulBox = maybeFoul(c, A, D, true);
  if (foulBox) {
    addPasses(c, A, n3, 'create', false);
    foulBox.seconds += seconds;
    return foulBox;
  }
  if (!rng.chance(pChance)) {
    addPasses(c, A, n3, 'create', rng.chance(0.62));
    if (rng.chance(0.08)) {
      A.stats.corners++;
      emit(c, { type: 'corner', side: A.side });
      return { end: 'corner', seconds, next: { side: A.side, mode: 'corner' } };
    }
    return turnover(c, A, D, 'final', seconds, mode);
  }
  addPasses(c, A, n3, 'create', false);

  // ---- a chance is created
  const kind = pickChanceKind(c, A, D, highTrans || (transition && ap.counter));
  const creator = pickCreator(c, A, kind);
  const shooter = pickShooter(c, A, kind, creator);
  if (!shooter) return turnover(c, A, D, 'final', seconds, mode);
  const quality = Math.exp(P.qualityBeta * (r.create - defEff)) * (highTrans ? 1.22 : 1) * (1 + 0.18 * (dp.line - 0.5)) *
    (kind === 'longShot' ? 1 + 0.9 * (0.5 - dp.line) : 1);
  const mean = XG_MEAN[kind] ?? 0.1;
  const xg = shotXg(c, mean, quality);
  if (creator && creator !== shooter) creator.line.keyPasses++;
  const res = resolveShot(c, A, D, shooter, creator, xg, kind, false);
  seconds += 2;
  return { end: res.end, seconds, next: res.next };
}

const XG_MEAN: Partial<Record<GoalKind, number>> = {
  open: 0.115, header: 0.095, counter: 0.16, longShot: 0.034, freeKick: 0.055, corner: 0.075,
};

function pickChanceKind(c: Ctx, A: TeamState, D: TeamState, counterLike: boolean): GoalKind {
  const ap = A.prof;
  const aerialEdge = clamp((A.ratings.aerial - D.ratings.aerial) / 40, -0.5, 0.5);
  const wCross = 0.14 + 0.5 * (ap.width - 0.3) + aerialEdge * 0.3;
  const wOpen = 0.42 + 0.2 * (1 - ap.directness);
  const wLong = 0.12 + 0.12 * (0.5 - D.prof.line) + 0.05 * (ap.directness);
  const wCounter = counterLike ? 0.9 : 0;
  const idx = c.rng.weightedIndex([Math.max(0.02, wCross), wOpen, Math.max(0.02, wLong), wCounter]);
  return (['header', 'open', 'longShot', 'counter'] as GoalKind[])[idx] as GoalKind;
}

function pickCreator(c: Ctx, A: TeamState, kind: GoalKind): SimPlayer | null {
  if (kind === 'longShot') return null;
  return weightedPlayer(c, outfield(A), (p) => {
    const wide = kind === 'header' && (p.slotPos === 'LW' || p.slotPos === 'RW' || p.slotPos === 'LB' || p.slotPos === 'RB') ? 2.2 : 1;
    return POSITION_FN_WEIGHTS[p.slotPos].create * (p.role.mod.create ?? 1) * p.role.createShare * Math.pow(Math.max(p.skills.create, 5) / 55, 1.3) * wide;
  });
}

function pickShooter(c: Ctx, A: TeamState, kind: GoalKind, creator: SimPlayer | null): SimPlayer | null {
  const pool = outfield(A);
  return weightedPlayer(c, pool, (p) => {
    if (p === creator && pool.length > 1) return p.wShoot * 0.15;
    let w = p.wShoot;
    if (kind === 'header') w *= 0.4 + Math.pow(Math.max(p.skills.aerial, 5) / 55, 2.2) * (p.mp.traits.includes('aerialThreat') ? 1.5 : 1);
    if (kind === 'longShot') w = (0.15 + w) * (p.mp.traits.includes('longShots') ? 3 : 1) * (['CM', 'DM', 'AM'].includes(p.slotPos) ? 1.8 : 1);
    return w;
  });
}

interface ShotRes { end: EndKind; next: SeqResult['next'] }

function resolveShot(
  c: Ctx, A: TeamState, D: TeamState, shooter: SimPlayer, creator: SimPlayer | null, xg: number, kind: GoalKind, isPenalty: boolean,
): ShotRes {
  const P = MATCH_PARAMS.shot;
  const rng = c.rng;
  const gk = keeperOf(D);
  const keeperSkill = gk ? gk.skills.keeper : FILL_SKILL;
  const finishSkill = shooter.skills.shoot;
  shooter.line.shots++;
  shooter.line.xg += xg;
  A.stats.shots++;
  A.stats.xg += xg;

  let pBlock = isPenalty ? 0 : kind === 'freeKick' ? 0.1 : clamp(P.blockBase + 0.002 * (D.ratings.defend - 60) - 0.4 * xg, 0.04, 0.35);
  if (kind === 'corner' || kind === 'header') pBlock *= 0.7;
  const pOnTargetGivenUnblocked = isPenalty
    ? 0.88
    : clamp(P.onTargetBase + 1.5 * xg + 0.004 * (finishSkill - 55), 0.25, 0.92);
  const keeperId = gk ? gk.mp.id : null;
  const baseGoal = clamp(xg / ((1 - pBlock) * pOnTargetGivenUnblocked), 0.02, 0.96);
  const finishShift = P.finishBeta * (finishSkill - 60) - P.keeperBeta * (keeperSkill - 60);

  const mk = (outcome: ShotOutcome): void => emit(c, { type: 'shot', side: A.side, playerId: shooter.mp.id, xg, outcome, kind, keeperId });

  if (rng.chance(pBlock)) {
    mk('blocked');
    const corner = rng.chance(0.3);
    if (corner) {
      A.stats.corners++;
      emit(c, { type: 'corner', side: A.side });
      return { end: 'corner', next: { side: A.side, mode: 'corner' } };
    }
    return { end: 'shotBlocked', next: { side: rng.chance(0.55) ? D.side : A.side, mode: 'build' } };
  }
  if (!rng.chance(pOnTargetGivenUnblocked)) {
    const post = rng.chance(0.07);
    mk(post ? 'post' : 'off');
    return { end: 'shotOff', next: { side: D.side, mode: 'build' } };
  }
  shooter.line.shotsOnTarget++;
  A.stats.shotsOnTarget++;
  const pGoal = shiftOdds(baseGoal, finishShift);
  if (rng.chance(pGoal)) {
    mk('goal');
    A.score++;
    const scorerKind: GoalKind = kind;
    const assist = !isPenalty && kind !== 'longShot' && creator && creator !== shooter && rng.chance(0.82) ? creator : null;
    shooter.line.goals++;
    if (assist) assist.line.assists++;
    for (const p of D.onPitch) p.line.goalsConceded++;
    emit(c, {
      type: 'goal', side: A.side, scorerId: shooter.mp.id, assistId: assist ? assist.mp.id : null, xg, kind: scorerKind,
      home: c.home.score, away: c.away.score,
    });
    return { end: 'goal', next: { side: D.side, mode: 'kickoff' } };
  }
  mk('saved');
  if (gk) {
    gk.line.saves++;
    D.stats.saves++;
  }
  if (rng.chance(0.22)) {
    A.stats.corners++;
    emit(c, { type: 'corner', side: A.side });
    return { end: 'corner', next: { side: A.side, mode: 'corner' } };
  }
  return { end: 'shotSaved', next: { side: D.side, mode: 'build' } };
}

function turnover(c: Ctx, A: TeamState, D: TeamState, zone: 'build' | 'mid' | 'final', seconds: number, _mode: string): SeqResult {
  const rng = c.rng;
  const pressWin = 0.12 + 0.55 * D.prof.pressing;
  const defenders = outfield(D);
  // type of ball-win
  const tackle = rng.chance(0.45);
  const winner = weightedPlayer(c, defenders, (p) => {
    const posW = zone === 'build' ? POSITION_FN_WEIGHTS[p.slotPos].press : zone === 'mid' ? 0.5 * POSITION_FN_WEIGHTS[p.slotPos].press + 0.5 * POSITION_FN_WEIGHTS[p.slotPos].defend : POSITION_FN_WEIGHTS[p.slotPos].defend;
    return (posW + 0.05) * p.role.tackleShare * Math.max(p.skills.defend, 5) / 55;
  });
  if (winner) {
    if (tackle) { winner.line.tackles++; D.stats.tackles++; } else { winner.line.interceptions++; D.stats.interceptions++; }
  }
  let mode: SeqResult['next']['mode'] = 'build';
  const C = MATCH_PARAMS.counter;
  const x = D.prof.counter ? C.convertCounterExtra : 0;
  if (zone === 'build') mode = rng.chance(pressWin * 0.55) ? 'transitionHigh' : rng.chance(C.convertMid - 0.05 + x) ? 'transitionMid' : 'build';
  else if (zone === 'mid') mode = rng.chance(C.convertMid + x) ? 'transitionMid' : 'build';
  else mode = rng.chance(C.convertFinal + x) ? 'transitionMid' : 'build';
  return { end: 'turnover', seconds, next: { side: D.side, mode } };
}

function maybeFoul(c: Ctx, A: TeamState, D: TeamState, finalThird: boolean): SeqResult | null {
  const F = MATCH_PARAMS.foul;
  const rng = c.rng;
  const rate = F.perSequence * (finalThird ? 0.55 : 0.6) * (0.75 + 0.5 * D.prof.pressing) * (0.85 + 0.3 * (c.conditions.refereeStrictness - 0.7));
  if (!rng.chance(rate)) return null;
  const fouler = weightedPlayer(c, outfield(D), (p) => 0.2 + (p.mp.attrs.aggression / 50) * (0.4 + 0.2 * POSITION_FN_WEIGHTS[p.slotPos].defend) * (1.1 - p.mp.attrs.composure / 200));
  const victim = weightedPlayer(c, outfield(A), (p) => 0.3 + POSITION_FN_WEIGHTS[p.slotPos].create * 0.3 + p.skills.progress / 100);
  if (!fouler) return null;
  const inBox = finalThird && rng.chance(F.inBoxShare);
  fouler.line.fouls++;
  D.stats.fouls++;
  if (victim) victim.line.foulsWon++;
  emit(c, { type: 'foul', side: D.side, playerId: fouler.mp.id, victimId: victim ? victim.mp.id : null, inBox });
  const strict = c.conditions.refereeStrictness;
  const severe = rng.chance(F.redStraight * strict * (inBox ? 2.2 : 1));
  if (severe) giveCard(c, D, fouler, 'red');
  else if (rng.chance(clamp(F.yellowBase * strict * (inBox ? 1.5 : finalThird ? 1.15 : 0.9) * (0.7 + fouler.mp.attrs.aggression / 100) * (fouler.yellow >= 1 ? F.secondYellowCare : 1), 0, 0.6))) {
    giveCard(c, D, fouler, fouler.yellow >= 1 ? 'secondYellow' : 'yellow');
  }
  if (inBox) {
    const pen = takePenalty(c, A, D);
    return { end: 'penalty', seconds: 8, next: pen.next };
  }
  return { end: 'foul', seconds: 6, next: { side: A.side, mode: finalThird && rng.chance(0.35) ? 'freeKickAtt' : 'build' } };
}

function giveCard(c: Ctx, T: TeamState, p: SimPlayer, kind: 'yellow' | 'red' | 'secondYellow'): void {
  if (p.state !== 'on') return;
  if (kind === 'yellow') {
    p.yellow = 1;
    p.line.yellow++;
    T.stats.yellow++;
    emit(c, { type: 'card', side: T.side, playerId: p.mp.id, card: 'yellow' });
    return;
  }
  if (kind === 'secondYellow') {
    p.line.yellow++;
    T.stats.yellow++;
  }
  p.line.red++;
  T.stats.red++;
  emit(c, { type: 'card', side: T.side, playerId: p.mp.id, card: kind });
  removeFromPitch(c, T, p, 'sentOff');
  handleKeeperLoss(c, T);
  computeRatings(T);
}

function removeFromPitch(c: Ctx, T: TeamState, p: SimPlayer, state: 'off' | 'sentOff'): void {
  p.state = state;
  p.left = c.clock;
  T.onPitch = T.onPitch.filter((x) => x !== p);
}

/** If the goalkeeper is dismissed or leaves injured with no replacement, an outfield player takes over in goal. */
function handleKeeperLoss(c: Ctx, T: TeamState): void {
  if (keeperOf(T)) return;
  const benchGk = T.squad.find((p) => p.state === 'bench' && p.mp.primary === 'GK');
  const canSub = T.subsUsed < T.base.maxSubs + (c.period >= 3 ? 1 : 0);
  if (benchGk && canSub) {
    const sacrifice = [...outfield(T)].sort((a, b) => a.skills.shoot + a.skills.create - (b.skills.shoot + b.skills.create))[0];
    if (sacrifice) {
      removeFromPitch(c, T, sacrifice, 'off');
      sacrifice.line.minutes = 0;
      bringOn(c, T, benchGk, 'GK', sacrifice, 'goalkeeper');
      return;
    }
  }
  const stand = [...outfield(T)].sort((a, b) => b.mp.attrs.handling - a.mp.attrs.handling)[0];
  if (stand) {
    stand.slotPos = 'GK';
    stand.skills = { ...stand.skills, keeper: Math.max(FILL_SKILL, stand.mp.attrs.handling * 0.5) };
  }
}

function bringOn(c: Ctx, T: TeamState, sub: SimPlayer, pos: Position, off: SimPlayer, reason: 'tactical' | 'injury' | 'fatigue' | 'goalkeeper'): void {
  sub.state = 'on';
  sub.entered = c.clock;
  sub.slotPos = pos;
  sub.line.position = pos;
  // Recompute skills for the new position (familiarity).
  const fam = familiarity(sub.mp, pos);
  const famMult = 0.5 + 0.5 * fam;
  const cond: Condition = { fatigue: sub.fatigue, form: sub.mp.form, morale: sub.mp.morale, confidence: sub.mp.confidence, dayFactor: sub.dayFactor };
  const skills = computeEffectiveSkills(sub.mp.attrs, cond);
  for (const k of Object.keys(skills) as (keyof Skills)[]) {
    skills[k] = k === 'keeper' ? (pos === 'GK' ? skills[k] * famMult : Math.min(skills[k], FILL_SKILL)) : skills[k] * famMult;
  }
  sub.skills = skills;
  sub.role = ROLES[defaultRoleFor(pos)] as RoleDef;
  T.onPitch.push(sub);
  T.subsUsed++;
  T.stats.substitutions++;
  emit(c, { type: 'sub', side: T.side, offId: off.mp.id, onId: sub.mp.id, reason });
}

function takePenalty(c: Ctx, A: TeamState, D: TeamState): ShotRes {
  const pool = outfield(A);
  const taker = weightedPlayer(c, pool, (p) => (p.mp.traits.includes('penaltyTaker') ? 4 : 1) * Math.pow(Math.max(p.skills.shoot, 5) / 55, 2) * (p.slotPos === 'ST' || p.slotPos === 'AM' ? 1.3 : 1));
  if (!taker) return { end: 'turnover', next: { side: D.side, mode: 'build' } };
  const res = resolveShot(c, A, D, taker, null, clamp(0.76, 0, 1), 'penalty', true);
  return res;
}

function runCorner(c: Ctx, A: TeamState, D: TeamState): SeqResult {
  const rng = c.rng;
  const short = A.base.setPieceFocus === 'short' ? 0.6 : A.base.setPieceFocus === 'mixed' ? 0.25 : 0.1;
  const edge = (A.ratings.setPiece + 0.5 * A.ratings.aerial) - (D.ratings.aerial * 0.7 + D.ratings.defend * 0.5 + 0.0);
  const pShot = shiftOdds(0.27, 0.0165 * edge * (1 - short * 0.3) + (A.base.setPieceFocus === 'near' ? 0.05 : 0));
  if (!rng.chance(pShot)) {
    if (rng.chance(0.45)) {
      const clr = weightedPlayer(c, outfield(D), (p) => POSITION_FN_WEIGHTS[p.slotPos].defend * p.skills.aerial);
      if (clr) { clr.line.interceptions++; D.stats.interceptions++; }
      return { end: 'turnover', seconds: 20, next: { side: D.side, mode: rng.chance(D.prof.counter ? 0.35 : 0.15) ? 'transitionMid' : 'build' } };
    }
    return { end: 'turnover', seconds: 20, next: { side: rng.chance(0.5) ? D.side : A.side, mode: 'build' } };
  }
  const shooter = weightedPlayer(c, outfield(A), (p) => (0.2 + POSITION_FN_WEIGHTS[p.slotPos].aerial * Math.pow(Math.max(p.skills.aerial, 5) / 55, 2.2)) * (p.mp.traits.includes('aerialThreat') ? 1.5 : 1));
  if (!shooter) return { end: 'turnover', seconds: 20, next: { side: D.side, mode: 'build' } };
  const taker = weightedPlayer(c, outfield(A), (p) => Math.pow(Math.max(p.skills.setPiece, 5) / 50, 3) * (p.mp.traits.includes('setPieceSpecialist') ? 2 : 1));
  const xg = shotXg(c, XG_MEAN.corner ?? 0.075, Math.exp(MATCH_PARAMS.qualityBeta * edge * 0.6));
  if (taker && taker !== shooter) taker.line.keyPasses++;
  const res = resolveShot(c, A, D, shooter, taker, xg, 'corner', false);
  return { end: res.end, seconds: 25, next: res.next };
}

function runAttackingFreeKick(c: Ctx, A: TeamState, D: TeamState): SeqResult {
  const rng = c.rng;
  if (rng.chance(0.2)) {
    const taker = weightedPlayer(c, outfield(A), (p) => Math.pow(Math.max(p.skills.setPiece, 5) / 50, 3) * (p.mp.traits.includes('setPieceSpecialist') ? 2.5 : 1));
    if (taker) {
      const xg = shotXg(c, XG_MEAN.freeKick ?? 0.055, 1);
      const res = resolveShot(c, A, D, taker, null, xg, 'freeKick', false);
      return { end: res.end, seconds: 20, next: res.next };
    }
  }
  if (rng.chance(0.45)) return runCorner(c, A, D);
  return { end: 'turnover', seconds: 15, next: { side: rng.chance(0.55) ? D.side : A.side, mode: 'build' } };
}

// ------------------------------------------------------------------ in-match management

function updateFatigue(c: Ctx, dtSeconds: number): void {
  const per = MATCH_PARAMS.fatigue.perMinute * (dtSeconds / 60) * c.heatFatigue;
  for (const T of [c.home, c.away]) {
    for (const p of T.onPitch) {
      const stam = p.mp.attrs.stamina;
      const work = p.mp.attrs.workRate;
      const posLoad = p.slotPos === 'GK' ? 0.25 : p.slotPos === 'CB' ? 0.8 : p.slotPos === 'CM' || p.slotPos === 'LB' || p.slotPos === 'RB' ? 1.15 : 1;
      const extra = c.period >= 3 ? 1.35 : 1;
      p.fatigue = clamp(p.fatigue + per * T.prof.fatigueRate * posLoad * extra * (1.35 - stam / 130) * (0.85 + work / 400 + c.conditions.importance * 0.1), 0, 100);
    }
  }
}

function refreshSkillsForFatigue(c: Ctx): void {
  for (const T of [c.home, c.away]) {
    for (const p of T.onPitch) {
      const cond: Condition = { fatigue: p.fatigue, form: p.mp.form, morale: p.mp.morale, confidence: p.mp.confidence, dayFactor: p.dayFactor };
      const skills = computeEffectiveSkills(p.mp.attrs, cond);
      const famMult = 0.5 + 0.5 * familiarity(p.mp, p.slotPos);
      const wasFill = p.mp.primary !== 'GK' && p.slotPos === 'GK';
      for (const k of Object.keys(skills) as (keyof Skills)[]) {
        if (k === 'keeper') skills[k] = p.slotPos === 'GK' ? (wasFill ? Math.max(FILL_SKILL, p.mp.attrs.handling * 0.5) : skills[k] * famMult) : Math.min(skills[k], FILL_SKILL);
        else skills[k] = skills[k] * famMult;
      }
      p.skills = skills;
    }
    computeRatings(T);
  }
}

function checkInjuries(c: Ctx, dtSeconds: number): void {
  const I = MATCH_PARAMS.injury;
  for (const T of [c.home, c.away]) {
    if (T.onPitch.length === 0) continue;
    let total = 0;
    const weights = T.onPitch.map((p) => {
      const ageF = 1 + Math.max(0, p.mp.age - 29) * 0.04;
      const w = p.mp.injuryProneness * ageF * (1 + p.fatigue / 100 * 0.9) * (p.slotPos === 'GK' ? 0.4 : 1);
      total += w;
      return w;
    });
    const intensity = 0.9 + 0.2 * T.prof.pressing + 0.1 * T.prof.tempo;
    const lambda = (I.perPlayerMinute * (dtSeconds / 60) * intensity * total);
    if (!c.rng.chance(lambda)) continue;
    const victim = T.onPitch[c.rng.weightedIndex(weights)];
    if (!victim) continue;
    const roll = c.rng.next();
    const severity = (roll < 0.58 ? 1 : roll < 0.86 ? 2 : roll < 0.97 ? 3 : 4) as 1 | 2 | 3 | 4;
    emit(c, { type: 'injury', side: T.side, playerId: victim.mp.id, severity });
    c.injuries.push({ playerId: victim.mp.id, severity, minute: minuteOf(c) });
    // Minor knocks: player may continue; otherwise must leave.
    if (severity === 1 && c.rng.chance(0.45)) continue;
    const bench = T.squad.filter((p) => p.state === 'bench');
    const canSub = T.subsUsed < T.base.maxSubs + (c.period >= 3 ? 1 : 0) && bench.length > 0;
    const wasGk = victim.slotPos === 'GK';
    removeFromPitch(c, T, victim, 'off');
    if (canSub) {
      const pick = chooseReplacement(T, victim.slotPos, wasGk);
      if (pick) bringOn(c, T, pick, wasGk ? 'GK' : victim.slotPos, victim, 'injury');
    }
    handleKeeperLoss(c, T);
    computeRatings(T);
  }
}

function chooseReplacement(T: TeamState, pos: Position, requireGk: boolean): SimPlayer | null {
  const bench = T.squad.filter((p) => p.state === 'bench');
  if (bench.length === 0) return null;
  if (requireGk) return bench.find((p) => p.mp.primary === 'GK') ?? null;
  const cand = bench.filter((p) => p.mp.primary !== 'GK');
  let best: SimPlayer | null = null;
  let bv = -1;
  for (const p of cand) {
    const v = familiarity(p.mp, pos) * 100 + (p.mp.attrs.stamina + p.skills.progress) * 0.05 - p.fatigue * 0.3;
    if (v > bv) { bv = v; best = p; }
  }
  return best;
}

function considerSubstitutions(c: Ctx, T: TeamState, scoreDiff: number, minute: number): void {
  const cap = T.base.maxSubs + (c.period >= 3 ? 1 : 0);
  if (T.subsUsed >= cap) return;
  const bench = T.squad.filter((p) => p.state === 'bench');
  if (bench.length === 0) return;
  const rng = c.rng;
  const quality = 0.55 + 0.45 * (T.acumen / 100);
  const remaining = cap - T.subsUsed;
  const nMax = minute < 55 ? 1 : minute < 70 ? 2 : minute < 80 ? 2 : 3;
  let made = 0;
  const candidates = outfield(T).filter((p) => p.state === 'on');
  const score = (p: SimPlayer): number => p.fatigue * 1.0 + (50 - p.skills.progress) * 0.1 - p.line.yellow * -6;
  const ordered = [...candidates].sort((a, b) => score(b) - score(a));
  for (const off of ordered) {
    if (made >= nMax || made >= remaining) break;
    const tired = off.fatigue > 38 + rng.float(-6, 6);
    const tacticalLose = scoreDiff < 0 && minute >= 60 && POSITION_FN_WEIGHTS[off.slotPos].defend > 1.4 && rng.chance(0.55 * quality);
    const tacticalWin = scoreDiff > 0 && minute >= 70 && POSITION_FN_WEIGHTS[off.slotPos].shoot > 0.9 && rng.chance(0.5 * quality);
    const yellowRisk = off.yellow > 0 && minute >= 60 && rng.chance(0.25);
    if (!(tired || tacticalLose || tacticalWin || yellowRisk) || !rng.chance(0.62)) continue;
    let pos: Position = off.slotPos;
    let pick: SimPlayer | null;
    if (tacticalLose) {
      pick = bench.filter((b) => b.state === 'bench' && b.mp.primary !== 'GK').sort((a, b) => b.skills.shoot + b.skills.create - (a.skills.shoot + a.skills.create))[0] ?? null;
      if (pick) pos = pick.mp.primary;
    } else if (tacticalWin) {
      pick = bench.filter((b) => b.state === 'bench' && b.mp.primary !== 'GK').sort((a, b) => b.skills.defend - a.skills.defend)[0] ?? null;
      if (pick) pos = pick.mp.primary;
    } else {
      pick = chooseReplacement(T, off.slotPos, false);
    }
    if (!pick) continue;
    removeFromPitch(c, T, off, 'off');
    bringOn(c, T, pick, pos, off, tired ? 'fatigue' : 'tactical');
    const bi = bench.indexOf(pick);
    if (bi >= 0) bench.splice(bi, 1);
    made++;
  }
  if (made > 0) {
    T.windowsUsed++;
    computeRatings(T);
  }
}

function adaptTactics(c: Ctx, T: TeamState, scoreDiff: number, minute: number, manDown: number): void {
  if (!T.base.adaptive) return;
  if (minute < 55 || minute - T.adaptedAt < 8) return;
  const quality = 0.5 + 0.5 * (T.acumen / 100);
  if (!c.rng.chance(quality)) return;
  let shift = 0;
  const left = 90 - minute;
  if (scoreDiff < 0 && left <= 35) shift = scoreDiff <= -2 || left <= 15 ? 2 : 1;
  else if (scoreDiff > 0 && left <= 25) shift = scoreDiff >= 2 || left <= 10 ? -1 : -1;
  if (manDown > 0 && scoreDiff >= 0) shift = Math.min(shift, -1);
  if (T.base.mentality + shift > 2) shift = 2 - T.base.mentality;
  if (T.base.mentality + shift < -2) shift = -2 - T.base.mentality;
  if (shift !== T.mentalityShift) {
    T.mentalityShift = shift;
    T.adaptedAt = minute;
    refreshProfile(T);
    emit(c, { type: 'tactical', side: T.side, change: shift > 0 ? 'more attacking' : shift < 0 ? 'more defensive' : 'reverted to base approach' });
  }
}

// ------------------------------------------------------------------ main entry

function finaliseLine(p: SimPlayer, matchSeconds: number): void {
  if (p.state === 'bench') { p.line.minutes = 0; return; }
  const start = p.entered;
  const end = p.state === 'on' ? matchSeconds : p.left;
  p.line.minutes = Math.max(0, Math.round((end - start) / 60));
  p.line.fatigueEnd = Math.round(p.fatigue * 10) / 10;
}

function playPeriod(c: Ctx, endSeconds: number, nextStart: { side: Side; mode: SeqResult['next']['mode'] }): { side: Side; mode: SeqResult['next']['mode'] } {
  let next = nextStart;
  let lastFatigueRefresh = c.clock;
  let lastAdapt = c.clock;
  let lastSub = c.clock;
  let pendingSeconds = 0;
  while (c.clock < endSeconds) {
    const A = teamOf(c, next.side);
    const D = teamOf(c, other(next.side));
    const res = runSequence(c, A, D, next.mode);
    const dt = Math.max(3, res.seconds);
    c.clock += dt;
    A.possessionSeconds += dt;
    pendingSeconds += dt;
    // fatigue and injury hazards are integrated in ~1 minute chunks (same expectation, fewer passes over the squad)
    if (pendingSeconds >= 60 || c.clock >= endSeconds) {
      updateFatigue(c, pendingSeconds);
      checkInjuries(c, pendingSeconds);
      pendingSeconds = 0;
    }
    next = res.next;
    if (c.clock - lastFatigueRefresh >= 600) {
      refreshSkillsForFatigue(c);
      lastFatigueRefresh = c.clock;
    }
    const minute = Math.floor(c.clock / 60);
    if (c.clock - lastAdapt >= 300) {
      lastAdapt = c.clock;
      const base = c.period >= 3 ? 90 : 0;
      for (const T of [c.home, c.away]) {
        const diff = T.score - teamOf(c, other(T.side)).score;
        adaptTactics(c, T, diff, Math.min(minute, 90 + base), 11 - T.onPitch.length);
      }
    }
    if (c.clock - lastSub >= 540 && minute >= 55) {
      lastSub = c.clock;
      for (const T of [c.home, c.away]) considerSubstitutions(c, T, T.score - teamOf(c, other(T.side)).score, minute);
    }
  }
  return next;
}

function stoppageSeconds(c: Ctx, fromEventIdx: number, firstHalf: boolean): number {
  let units = firstHalf ? 0.9 : 1.6;
  for (let i = fromEventIdx; i < c.events.length; i++) {
    const e = c.events[i] as MatchEvent;
    if (e.type === 'goal') units += 0.55;
    else if (e.type === 'sub') units += 0.35;
    else if (e.type === 'injury') units += 0.9;
    else if (e.type === 'card') units += 0.25;
  }
  units += c.rng.float(-0.4, 0.8);
  return Math.round(clamp(units, 1, 9) * 60);
}

export function simulateMatch(input: MatchInput): MatchResult {
  const rng = Rng.fromSeed(`match:${input.seed}:${input.id}`);
  const cond = input.conditions;
  const attendance = clamp(cond.attendanceFrac, 0, 1);
  const haLogit = cond.neutral ? 0 : MATCH_PARAMS.homeAdvantageLogit * (0.45 + 0.55 * attendance);
  const home = buildTeam('home', input.home, rng.derive('home'), haLogit / 2);
  const away = buildTeam('away', input.away, rng.derive('away'), -haLogit / 2);
  const ctx: Ctx = {
    rng, home, away, events: [], clock: 0, period: 1, input, injuries: [], conditions: cond,
    heatFatigue: cond.weather === 'heat' ? 1.12 : cond.weather === 'cold' ? 0.97 : 1,
    rainPassPenalty: cond.weather === 'rain' ? 1 : 0,
  };
  for (const T of [home, away]) {
    for (const p of T.onPitch) p.entered = 0;
  }
  emit(ctx, { type: 'kickoff', side: 'home', minute: 1 });
  const startSide: Side = rng.chance(0.5) ? 'home' : 'away';

  // First half
  let next: { side: Side; mode: SeqResult['next']['mode'] } = { side: startSide, mode: 'build' };
  next = playPeriod(ctx, 45 * 60, next);
  const stop1 = stoppageSeconds(ctx, 0, true);
  next = playPeriod(ctx, 45 * 60 + stop1, next);
  ctx.clock = Math.max(ctx.clock, 45 * 60 + stop1);
  emit(ctx, { type: 'halftime', side: 'home', minute: Math.floor(ctx.clock / 60) });
  // Half-time: recovery, substitution window.
  for (const T of [home, away]) for (const p of T.onPitch) p.fatigue = Math.max(0, p.fatigue - 4);
  refreshSkillsForFatigue(ctx);
  ctx.period = 2;
  for (const T of [home, away]) considerSubstitutions(ctx, T, T.score - teamOf(ctx, other(T.side)).score, 46);
  const halfStartClock = ctx.clock;
  const eventsBeforeSecond = ctx.events.length;
  // clock continues from 45:00 + stoppage in absolute terms, but displayed minutes continue at 46.
  // Keep absolute match clock monotonic and compute displayed minute from "regular clock" offset.
  const secondHalfStartDisplay = 45 * 60;
  const offset = halfStartClock - secondHalfStartDisplay;
  ctx.clock -= offset; // rewind display clock to 45:00 so minute labels read 46..90+
  next = { side: startSide === 'home' ? 'away' : 'home', mode: 'build' };
  next = playPeriod(ctx, 90 * 60, next);
  const stop2 = stoppageSeconds(ctx, eventsBeforeSecond, false);
  next = playPeriod(ctx, 90 * 60 + stop2, next);
  emit(ctx, { type: 'fulltime', side: 'home', minute: Math.floor(ctx.clock / 60) });
  const regular = { home: home.score, away: away.score };
  let extraTimePlayed = false;
  let penalties: MatchResult['penalties'] = null;
  let duration = Math.floor(ctx.clock / 60);

  const agg = input.rules.aggregateOffset ?? { home: 0, away: 0 };
  const level = (): boolean => home.score + agg.home === away.score + agg.away;
  if (input.rules.mustHaveWinner && level()) {
    if (input.rules.extraTime) {
      extraTimePlayed = true;
      ctx.period = 3;
      emit(ctx, { type: 'extraTimeStart', side: 'home', minute: 91 });
      ctx.clock = 90 * 60;
      for (const T of [home, away]) for (const p of T.onPitch) p.fatigue = Math.max(0, p.fatigue - 6);
      refreshSkillsForFatigue(ctx);
      next = playPeriod(ctx, 105 * 60, next);
      ctx.period = 4;
      next = playPeriod(ctx, 120 * 60, next);
      emit(ctx, { type: 'fulltime', side: 'home', minute: 120 });
      duration = 120;
    }
    if (level()) {
      penalties = shootout(ctx);
    }
  }

  const matchSeconds = ctx.clock;
  for (const T of [home, away]) for (const p of T.squad) finaliseLine(p, matchSeconds);
  for (const T of [home, away]) {
    // fatigueEnd for bench players who never played stays unchanged
    for (const p of T.squad) if (p.state === 'bench') p.line.fatigueEnd = p.mp.fatigue;
  }

  const totalPoss = home.possessionSeconds + away.possessionSeconds || 1;
  const mkStats = (T: TeamState): TeamStats => ({
    ...T.stats,
    xg: Math.round(T.stats.xg * 100) / 100,
    possession: Math.round((T.possessionSeconds / totalPoss) * 1000) / 10,
  });

  const lines: PlayerLine[] = [];
  for (const T of [home, away]) {
    for (const p of T.squad) if (p.state !== 'bench') lines.push(p.line);
  }
  assignRatings(lines, home.score, away.score, duration);

  let winner: MatchResult['winner'] = 'draw';
  const th = home.score + agg.home;
  const ta = away.score + agg.away;
  if (th > ta) winner = 'home';
  else if (ta > th) winner = 'away';
  else if (penalties) winner = penalties.home > penalties.away ? 'home' : 'away';

  const motm = lines.length ? [...lines].sort((a, b) => b.rating - a.rating)[0]?.playerId ?? null : null;
  return {
    id: input.id,
    seed: input.seed,
    homeClubId: input.home.clubId,
    awayClubId: input.away.clubId,
    score: { home: home.score, away: away.score },
    scoreRegular: regular,
    extraTimePlayed,
    penalties,
    winner,
    events: ctx.events,
    stats: { home: mkStats(home), away: mkStats(away) },
    players: lines,
    motm,
    injuries: ctx.injuries,
    duration,
    stoppage: { first: Math.round(stop1 / 60), second: Math.round(stop2 / 60) },
  };
}

// ------------------------------------------------------------------ shootout

function shootout(c: Ctx): { home: number; away: number } {
  const rng = c.rng;
  const kick = (T: TeamState, D: TeamState, taker: SimPlayer): boolean => {
    const gk = keeperOf(D);
    const keeper = gk ? gk.skills.keeper : FILL_SKILL;
    const p = shiftOdds(0.76, 0.014 * (taker.skills.shoot - 60) + 0.01 * (taker.mp.attrs.composure - 60) - 0.012 * (keeper - 60));
    const scored = rng.chance(p);
    emit(c, { type: 'shootout', side: T.side, playerId: taker.mp.id, scored });
    return scored;
  };
  const order = (T: TeamState): SimPlayer[] => {
    const field = outfield(T).sort((a, b) => b.skills.shoot + b.mp.attrs.composure - (a.skills.shoot + a.mp.attrs.composure));
    return field.length ? field : T.onPitch.slice();
  };
  const ho = order(c.home);
  const ao = order(c.away);
  let h = 0;
  let a = 0;
  let i = 0;
  const firstHome = rng.chance(0.5);
  for (; i < 5; i++) {
    const seq: [TeamState, TeamState, SimPlayer | undefined][] = firstHome
      ? [[c.home, c.away, ho[i % ho.length]], [c.away, c.home, ao[i % ao.length]]]
      : [[c.away, c.home, ao[i % ao.length]], [c.home, c.away, ho[i % ho.length]]];
    for (const [T, D, taker] of seq) {
      if (!taker) continue;
      const scored = kick(T, D, taker);
      if (T.side === 'home') h += scored ? 1 : 0;
      else a += scored ? 1 : 0;
    }
    const remainingH = 4 - i;
    const remainingA = 4 - i;
    if (h > a + remainingA || a > h + remainingH) break;
  }
  while (h === a) {
    const seq: [TeamState, TeamState, SimPlayer | undefined][] = [
      [c.home, c.away, ho[i % ho.length]], [c.away, c.home, ao[i % ao.length]],
    ];
    for (const [T, D, taker] of seq) {
      if (!taker) continue;
      const scored = kick(T, D, taker);
      if (T.side === 'home') h += scored ? 1 : 0;
      else a += scored ? 1 : 0;
    }
    i++;
    if (i > 40) { if (rng.chance(0.5)) h++; else a++; }
  }
  return { home: h, away: a };
}

// ------------------------------------------------------------------ ratings and derived stats

function assignRatings(lines: PlayerLine[], homeGoals: number, awayGoals: number, duration: number): void {
  for (const l of lines) {
    const own = l.side === 'home' ? homeGoals : awayGoals;
    const opp = l.side === 'home' ? awayGoals : homeGoals;
    const grp = l.position === 'GK' ? 'GK' : ['CB', 'LB', 'RB'].includes(l.position) ? 'DEF' : ['DM', 'CM', 'AM'].includes(l.position) ? 'MID' : 'FWD';
    let r = 6.0;
    r += 0.85 * l.goals + 0.5 * l.assists;
    r += 0.1 * l.shotsOnTarget + 0.05 * (l.shots - l.shotsOnTarget) + 0.25 * (l.xg - l.goals * 0) * 0.5;
    r += 0.07 * l.keyPasses + 0.045 * (l.tackles + l.interceptions);
    r += 0.012 * (l.passesCompleted - 0.82 * l.passes);
    r += 0.1 * l.saves * (grp === 'GK' ? 1 : 0);
    r -= 0.07 * l.fouls;
    r += 0.03 * l.foulsWon;
    r -= 0.3 * l.yellow + 1.6 * l.red;
    r += 0.12 * clampInt(own - opp, -3, 3);
    if (grp === 'GK' || grp === 'DEF') {
      if (opp === 0) r += grp === 'GK' ? 0.55 : 0.4;
      r -= 0.15 * Math.max(0, l.goalsConceded - 1);
    }
    if (l.minutes < 30) r = 6 + (r - 6) * (0.4 + l.minutes / 50);
    l.rating = Math.round(clamp(r, 3, 10) * 10) / 10;
  }
  void duration;
}

function clampInt(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

/** Recompute event-derived statistics from the event log; must equal `MatchResult.stats` for those fields. */
export function deriveStatsFromEvents(events: readonly MatchEvent[]): Record<Side, Pick<TeamStats, 'shots' | 'shotsOnTarget' | 'saves' | 'corners' | 'fouls' | 'yellow' | 'red' | 'offsides' | 'substitutions'> & { goals: number; xg: number }> {
  const blank = () => ({ shots: 0, shotsOnTarget: 0, saves: 0, corners: 0, fouls: 0, yellow: 0, red: 0, offsides: 0, substitutions: 0, goals: 0, xg: 0 });
  const out = { home: blank(), away: blank() };
  for (const e of events) {
    const s = out[e.side];
    const o = out[other(e.side)];
    switch (e.type) {
      case 'shot':
        s.shots++; s.xg += e.xg;
        if (e.outcome === 'goal' || e.outcome === 'saved') s.shotsOnTarget++;
        if (e.outcome === 'saved') o.saves++;
        break;
      case 'goal': s.goals++; break;
      case 'corner': s.corners++; break;
      case 'foul': s.fouls++; break;
      case 'card':
        if (e.card === 'yellow' || e.card === 'secondYellow') s.yellow++;
        if (e.card === 'red' || e.card === 'secondYellow') s.red++;
        break;
      case 'offside': s.offsides++; break;
      case 'sub': s.substitutions++; break;
      default: break;
    }
  }
  return out;
}

export { logit, sigmoid };
