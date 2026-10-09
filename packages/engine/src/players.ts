import { clamp, mean } from './math';
import { Rng } from './rng';
import {
  ATTR_KEYS, GK_ATTRS, POSITIONS, POSITION_GROUP, attrGroup,
  type AttrKey, type Attributes, type Player, type PlayerTrait, type Position,
} from './types';

/** Position importance weights (0..4). Used for overall-by-position and attribute generation. */
export const POSITION_WEIGHTS: Record<Position, Partial<Record<AttrKey, number>>> = {
  GK: { reflexes: 3, handling: 3, gkPositioning: 3, oneOnOne: 2, aerial: 2, distribution: 1.5, concentration: 1, composure: 0.5, decisions: 0.5 },
  CB: { tackling: 3, marking: 3, heading: 2.5, positioning: 2.5, strength: 2, anticipation: 2, concentration: 1.5, jumping: 1.5, pace: 1, passing: 0.8, composure: 1, decisions: 1 },
  LB: { tackling: 2, marking: 1.8, pace: 2, stamina: 2, crossing: 1.5, positioning: 2, workRate: 1.5, acceleration: 1.5, dribbling: 1, passing: 1, anticipation: 1.5 },
  RB: { tackling: 2, marking: 1.8, pace: 2, stamina: 2, crossing: 1.5, positioning: 2, workRate: 1.5, acceleration: 1.5, dribbling: 1, passing: 1, anticipation: 1.5 },
  DM: { tackling: 3, positioning: 2.5, anticipation: 2.5, passing: 2, workRate: 2, stamina: 2, strength: 1.5, decisions: 2, teamwork: 1.5, marking: 1.5, concentration: 1, composure: 1 },
  CM: { passing: 3, vision: 2.5, decisions: 2.5, firstTouch: 2, stamina: 2, workRate: 2, teamwork: 2, tackling: 1.5, dribbling: 1.2, composure: 1.5, positioning: 1.5 },
  AM: { vision: 3, passing: 2.5, dribbling: 2.5, firstTouch: 2.5, finishing: 1.8, decisions: 2, composure: 2, agility: 1.5, positioning: 1.5 },
  LW: { pace: 3, acceleration: 3, dribbling: 3, crossing: 2, firstTouch: 2, agility: 2, finishing: 1.5, vision: 1.2, passing: 1.2, stamina: 1.2, balance: 1.2 },
  RW: { pace: 3, acceleration: 3, dribbling: 3, crossing: 2, firstTouch: 2, agility: 2, finishing: 1.5, vision: 1.2, passing: 1.2, stamina: 1.2, balance: 1.2 },
  ST: { finishing: 3.5, composure: 2.5, positioning: 2.5, firstTouch: 2, heading: 1.8, pace: 1.8, acceleration: 1.8, strength: 1.5, anticipation: 2, dribbling: 1.2 },
};

export type SkillKey =
  | 'buildUp' | 'progress' | 'create' | 'shoot' | 'press' | 'defend' | 'aerial' | 'pace' | 'setPiece' | 'keeper';
export const SKILL_KEYS: readonly SkillKey[] = [
  'buildUp', 'progress', 'create', 'shoot', 'press', 'defend', 'aerial', 'pace', 'setPiece', 'keeper',
];

/** Which attributes feed each football function. Each attribute can feed several functions but each function is a distinct stage of play. */
export const SKILL_WEIGHTS: Record<SkillKey, Partial<Record<AttrKey, number>>> = {
  buildUp: { passing: 3, firstTouch: 2, composure: 2, decisions: 2, vision: 1.5, teamwork: 1.5, concentration: 0.5 },
  progress: { passing: 2, dribbling: 2.5, vision: 2, acceleration: 1.2, strength: 1, balance: 1, decisions: 1.5, pace: 1 },
  create: { vision: 3, passing: 2.5, dribbling: 2, crossing: 1.5, firstTouch: 1.5, decisions: 1.5, agility: 1, anticipation: 1, pace: 1, positioning: 1 },
  shoot: { finishing: 4, composure: 2.5, positioning: 2, firstTouch: 1.5, anticipation: 1, heading: 0.5 },
  press: { workRate: 3, stamina: 2.5, aggression: 1.5, anticipation: 2, acceleration: 1.5, tackling: 1.5, teamwork: 1 },
  defend: { tackling: 3, marking: 3, positioning: 3, anticipation: 2.5, concentration: 2, strength: 1.5, heading: 1, decisions: 1, composure: 0.5 },
  aerial: { heading: 3, jumping: 3, strength: 2 },
  pace: { pace: 3, acceleration: 2 },
  setPiece: { setPieces: 4, crossing: 2, vision: 1, passing: 1 },
  keeper: { reflexes: 3, handling: 2.5, gkPositioning: 3, oneOnOne: 2, aerial: 1.5 },
};

/** Attributes that degrade strongly with match fatigue. */
const PHYSICAL_FATIGUE_SENSITIVE: ReadonlySet<AttrKey> = new Set<AttrKey>([
  'stamina', 'pace', 'acceleration', 'strength', 'agility', 'balance', 'jumping', 'workRate',
]);

export type Skills = Record<SkillKey, number>;

function weightedAvg(attrs: Attributes, weights: Partial<Record<AttrKey, number>>): number {
  let s = 0;
  let w = 0;
  for (const k in weights) {
    const wk = weights[k as AttrKey] ?? 0;
    s += attrs[k as AttrKey] * wk;
    w += wk;
  }
  return w === 0 ? 0 : s / w;
}

/** Overall ability (1..100) of the raw attributes for a position, ignoring familiarity. */
export function overallForPosition(attrs: Attributes, pos: Position): number {
  return weightedAvg(attrs, POSITION_WEIGHTS[pos]);
}

/** Fraction 0..1 of effectiveness when played at `pos`. Primary = 1. Unfamiliar positions are heavily penalised. */
export function familiarity(p: Pick<Player, 'primary' | 'positions'>, pos: Position): number {
  if (p.primary === pos) return 1;
  const explicit = p.positions[pos];
  if (explicit !== undefined) return explicit;
  const g1 = POSITION_GROUP[p.primary];
  const g2 = POSITION_GROUP[pos];
  if (g1 === 'GK' || g2 === 'GK') return 0.05;
  if (g1 === g2) return 0.8;
  const adjacent = g1 === 'MID' || g2 === 'MID';
  return adjacent ? 0.62 : 0.45;
}

/** Overall at a position including familiarity penalty. Penalty pulls toward a floor, not to zero. */
export function positionalOverall(p: Player, pos: Position): number {
  const raw = overallForPosition(p.attrs, pos);
  const f = familiarity(p, pos);
  return raw * (0.5 + 0.5 * f);
}

export function overall(p: Player): number {
  return overallForPosition(p.attrs, p.primary);
}

export function ageOf(p: Pick<Player, 'birthDay'>, day: number): number {
  return (day - p.birthDay) / 365.25;
}

export interface Condition {
  fatigue: number; // 0..100
  form: number; // -10..10
  morale: number; // 0..100
  confidence: number; // 0..100
  /** Per-match performance noise multiplier drawn from consistency (1 = neutral). */
  dayFactor: number;
}

export function playerCondition(p: Player, rng?: Rng): Condition {
  let dayFactor = 1;
  if (rng) {
    const sd = 0.025 + (1 - p.consistency) * 0.07;
    dayFactor = clamp(1 + rng.normal(0, sd), 0.82, 1.18);
  }
  return { fatigue: p.fatigue, form: p.form, morale: p.morale, confidence: p.confidence, dayFactor };
}

/**
 * Effective attributes after applying condition. Fatigue hits physical attributes more than technical/mental.
 * Form/morale/confidence are combined into one small multiplier to avoid stacking separate bonuses.
 */
export function effectiveAttrs(p: Player, c: Condition, extraFatigue = 0): Attributes {
  const fat = clamp((c.fatigue + extraFatigue) / 100, 0, 1);
  const base = moodMultiplier(c);
  const out = {} as Attributes;
  for (const k of ATTR_KEYS) {
    const phys = PHYSICAL_FATIGUE_SENSITIVE.has(k);
    const fatMult = phys ? 1 - 0.32 * fat : 1 - 0.07 * fat;
    out[k] = clamp(p.attrs[k] * base * fatMult, 1, 100);
  }
  return out;
}

interface CompiledSkill { key: SkillKey; attrs: AttrKey[]; weights: number[]; phys: boolean[]; total: number }
const COMPILED: CompiledSkill[] = SKILL_KEYS.map((key) => {
  const w = SKILL_WEIGHTS[key];
  const attrs = Object.keys(w) as AttrKey[];
  return {
    key, attrs, weights: attrs.map((a) => w[a] ?? 0), phys: attrs.map((a) => PHYSICAL_FATIGUE_SENSITIVE.has(a)),
    total: attrs.reduce((acc, a) => acc + (w[a] ?? 0), 0),
  };
});

/** Mood multiplier from form/morale/confidence (single combined term, no stacking of separate bonuses). */
export function moodMultiplier(c: Pick<Condition, 'form' | 'morale' | 'confidence' | 'dayFactor'>): number {
  const mood = clamp(c.form / 10, -1, 1) * 0.03 + (c.morale - 60) / 40 * 0.01 + (c.confidence - 60) / 40 * 0.01;
  return c.dayFactor * (1 + mood);
}

/**
 * Fast path equal to `computeSkills(effectiveAttrs(...))` but without allocating an attribute object.
 * Used inside the match loop where skills are refreshed as players tire.
 */
export function computeEffectiveSkills(attrs: Attributes, c: Condition): Skills {
  const fat = clamp(c.fatigue / 100, 0, 1);
  const base = moodMultiplier(c);
  const physMult = base * (1 - 0.32 * fat);
  const otherMult = base * (1 - 0.07 * fat);
  const out = {} as Skills;
  for (const cs of COMPILED) {
    let s = 0;
    for (let i = 0; i < cs.attrs.length; i++) {
      const v = attrs[cs.attrs[i] as AttrKey] * ((cs.phys[i] as boolean) ? physMult : otherMult);
      s += (v < 1 ? 1 : v > 100 ? 100 : v) * (cs.weights[i] as number);
    }
    out[cs.key] = s / cs.total;
  }
  return out;
}

export function computeSkills(attrs: Attributes): Skills {
  const out = {} as Skills;
  for (const k of SKILL_KEYS) out[k] = weightedAvg(attrs, SKILL_WEIGHTS[k]);
  return out;
}

// ---------------------------------------------------------------- generation

export interface PlayerSpec {
  id: string;
  name: string;
  nationality: string;
  age: number;
  day: number;
  position: Position;
  /** Target current overall ability at the primary position. */
  ability: number;
  /** Target peak ability. If omitted, inferred from age. */
  potential?: number;
}

const SECONDARY: Record<Position, Position[]> = {
  GK: [], CB: ['DM', 'RB', 'LB'], LB: ['CB', 'LW', 'DM'], RB: ['CB', 'RW', 'DM'], DM: ['CM', 'CB'],
  CM: ['DM', 'AM'], AM: ['CM', 'LW', 'RW', 'ST'], LW: ['AM', 'ST', 'LB', 'RW'], RW: ['AM', 'ST', 'RB', 'LW'],
  ST: ['AM', 'LW', 'RW'],
};

export function generateAttributes(rng: Rng, position: Position, ability: number): Attributes {
  const weights = POSITION_WEIGHTS[position];
  const keys = Object.keys(weights) as AttrKey[];
  let wsum = 0;
  for (const k of keys) wsum += weights[k] ?? 0;
  const wmean = wsum / keys.length;
  const attrs = {} as Attributes;
  const isGk = position === 'GK';
  for (const k of ATTR_KEYS) {
    const w = weights[k];
    let base: number;
    if (w !== undefined) {
      base = ability + (w - wmean) * 5 + rng.normal(0, 5.5);
    } else if (attrGroup(k) === 'goalkeeping') {
      base = isGk ? ability - 12 + rng.normal(0, 6) : 6 + rng.float(0, 10);
    } else if (isGk) {
      base = 28 + rng.normal(0, 9) + (ability - 50) * 0.15;
    } else {
      base = ability * 0.72 + rng.normal(0, 8) - 6;
    }
    attrs[k] = clamp(base, 1, 99);
  }
  // Correction pass: shift the weighted attributes so overall lands on target.
  for (let i = 0; i < 3; i++) {
    const diff = ability - overallForPosition(attrs, position);
    if (Math.abs(diff) < 0.3) break;
    for (const k of keys) attrs[k] = clamp(attrs[k] + diff * ((weights[k] ?? 0) / wmean) * 0.9, 1, 99);
  }
  for (const k of ATTR_KEYS) attrs[k] = Math.round(attrs[k] * 10) / 10;
  return attrs;
}

export function generatePlayer(rng: Rng, spec: PlayerSpec): Player {
  const { position, ability, age } = spec;
  const attrs = generateAttributes(rng, position, ability);
  // Younger players have more headroom; the ceiling is hidden and uncertain.
  const headroom = age < 17 ? 26 : age < 19 ? 20 : age < 21 ? 14 : age < 23 ? 9 : age < 26 ? 4 : age < 29 ? 1.5 : 0;
  const pot = clamp(spec.potential ?? ability + Math.max(0, rng.normal(headroom, headroom * 0.45 + 0.5)), ability, 99);
  const traits: PlayerTrait[] = [];
  const maybe = (t: PlayerTrait, p: number): void => { if (rng.chance(p)) traits.push(t); };
  maybe('leader', 0.06);
  maybe('flair', position === 'AM' || position === 'LW' || position === 'RW' ? 0.18 : 0.04);
  maybe('longShots', position === 'CM' || position === 'AM' ? 0.12 : 0.03);
  maybe('penaltyTaker', position === 'ST' || position === 'AM' ? 0.15 : 0.05);
  maybe('setPieceSpecialist', 0.06);
  maybe('aerialThreat', position === 'CB' || position === 'ST' ? 0.15 : 0.02);
  maybe('engine', position === 'CM' || position === 'DM' ? 0.12 : 0.03);
  maybe('ballWinner', position === 'DM' || position === 'CB' ? 0.12 : 0.02);
  maybe('playmaker', position === 'CM' || position === 'AM' || position === 'DM' ? 0.1 : 0.01);
  maybe('clutch', 0.05);
  const injuryProneness = clamp(rng.normal(1, 0.25), 0.5, 1.8);
  if (injuryProneness > 1.45) traits.push('injuryProne');
  const positions: Partial<Record<Position, number>> = {};
  for (const sec of SECONDARY[position]) {
    if (rng.chance(0.4)) positions[sec] = clamp(rng.float(0.65, 0.97), 0, 1);
  }
  const foot = rng.chance(0.72) ? 'R' : rng.chance(0.75) ? 'L' : 'B';
  return {
    id: spec.id,
    name: spec.name,
    nationality: spec.nationality,
    birthDay: Math.round(spec.day - age * 365.25),
    foot,
    weakFoot: foot === 'B' ? 5 : (rng.between(1, 4) as 1 | 2 | 3 | 4),
    primary: position,
    positions,
    attrs,
    traits,
    pot: Math.round(pot * 10) / 10,
    devRate: clamp(rng.normal(1, 0.18), 0.6, 1.4),
    consistency: clamp(rng.normal(0.6, 0.15), 0.2, 0.95),
    injuryProneness,
    clubId: null,
    contract: null,
    loan: null,
    form: 0,
    morale: 65,
    confidence: 60,
    fatigue: 0,
    workload: 0,
    injury: null,
    suspensions: {},
    yellows: {},
    history: [],
    retired: false,
    freeSince: null,
    lastMoveDay: null,
  };
}

export function bestPosition(attrs: Attributes): Position {
  let best: Position = 'CM';
  let bv = -1;
  for (const pos of POSITIONS) {
    const v = overallForPosition(attrs, pos);
    if (v > bv) { bv = v; best = pos; }
  }
  return best;
}

export function squadAverage(players: readonly Player[]): number {
  return mean(players.map(overall));
}

export { GK_ATTRS };
