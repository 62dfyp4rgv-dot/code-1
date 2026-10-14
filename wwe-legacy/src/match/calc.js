// Pure probability/damage math. No RNG and no state mutation, so the UI can display honest risk
// hints and tests can assert exact behaviours. resolve.js rolls dice against these numbers.
import { clamp } from '../core/util.js';
import { familyOf } from './moves.js';
import { NEUTRAL_AVOID } from './stances.js';
import { F, damageFraction, staminaFrac, crowdBias, phaseOf } from './state.js';

export const ACC_BONUS = 0.07;
/** weapon and furniture moves: boosted (and recoil-prone) under a ruleset's `hardcore` rule */
export const isHardcoreMove = (move) => move.weapon || move.cat === 'environmental';
export const DAMAGE_SCALE = 1.3;

// weight tables are shared constants, so their key/value arrays are compiled once (hot path)
const COMPILED = new WeakMap();
const compile = (weights) => {
  let c = COMPILED.get(weights);
  if (!c) { const keys = Object.keys(weights); const vals = keys.map((k) => weights[k]); c = { keys, vals, total: vals.reduce((a, b) => a + b, 0) }; COMPILED.set(weights, c); }
  return c;
};
export const wattr = (attrs, weights) => {
  const { keys, vals, total } = compile(weights);
  let s = 0;
  for (let i = 0; i < keys.length; i++) s += (attrs[keys[i]] ?? 50) * vals[i];
  return total ? s / total / 100 : 0.5;
};

const LIMB = {
  strike: { arms: 0.5, legs: 0.2, head: 0.3 }, grapple: { arms: 0.5, torso: 0.5 }, power: { torso: 0.4, arms: 0.3, legs: 0.3 },
  aerial: { legs: 0.6, torso: 0.4 }, sub: { arms: 0.5, torso: 0.5 }, special: { arms: 0.25, torso: 0.25, legs: 0.25, head: 0.25 },
};

/** 0..~0.3 penalty from the attacker's own damaged body parts */
const LIMB_LIST = Object.fromEntries(Object.entries(LIMB).map(([k, v]) => [k, Object.entries(v)]));
export function limbPenalty(f, fam) {
  let d = 0;
  const list = LIMB_LIST[fam];
  for (let i = 0; i < list.length; i++) d += (f.dmg[list[i][0]] / 100) * list[i][1];
  return d * 0.28 + (d > 0.6 ? 0.06 : 0);
}

export function fatiguePenalty(f) {
  const fr = staminaFrac(f);
  return fr >= 0.5 ? 0 : 0.24 * Math.pow((0.5 - fr) / 0.5, 1.2);
}

/** Effectiveness of the defender's reaction given tiredness and injury. */
export function defenceEffectiveness(D, stance) {
  const fr = staminaFrac(D);
  const part = stance.kind === 'dodge' || stance.kind === 'distance' || stance.kind === 'roll' ? D.dmg.legs
    : stance.kind === 'block' || stance.kind === 'counter' ? D.dmg.arms : (D.dmg.head + D.dmg.torso) / 2;
  return clamp((0.55 + 0.45 * fr) * (1 - 0.35 * part / 100) * (D.dazed > 0 ? 0.6 : 1), 0.15, 1);
}

/**
 * Probability that `move` connects against the defender's chosen stance.
 * stance === null -> a neutral average reaction (used for UI hints).
 */
export function computeConnect(state, atkId, move, defId, stance = null, ctx = {}) {
  const A = F(state, atkId), D = F(state, defId);
  const fam = familyOf(move.cat);
  const skillA = wattr(A.attrs, move.atk);
  const skillD = stance ? wattr(D.attrs, stance.attrs) : 0.5 + (D.attrs.psychology - 50) / 400;
  const parts = {};
  parts.base = move.acc + ACC_BONUS;
  parts.skill = (skillA - skillD) * 0.5;
  const avoid = stance ? (stance.avoid[fam] ?? 0) : NEUTRAL_AVOID;
  parts.stance = -avoid * 0.85 * (stance ? defenceEffectiveness(D, stance) : 0.85);
  parts.fatigue = -fatiguePenalty(A);
  parts.limbs = -limbPenalty(A, fam);
  parts.momentum = ((A.momentum - D.momentum) / 100) * 0.1;
  parts.confidence = ((A.confidence - D.confidence) / 100) * 0.06;
  const bias = crowdBias(state, atkId) - crowdBias(state, defId);
  parts.crowd = bias * (state.crowd.heat / 100) * 0.04;
  const seenN = D.seen[move.id] || 0;
  parts.familiarity = -0.045 * Math.min(4, seenN) - (move.cat === 'finisher' ? 0.03 * Math.min(3, seenN) : 0);
  const readN = D.reads[move.cat] || 0;
  parts.reads = -0.015 * Math.min(5, Math.max(0, readN - 1));
  if (D.tactics.studyUntil >= state.round && D.tactics.studyCat === move.cat) parts.reads -= 0.06;
  parts.phase = (move.cat === 'finisher' || move.cat === 'signature') && phaseOf(state) === 'opening' ? -0.08 : 0;
  parts.tactics = (A.tactics.pace === 'fast' ? 0.02 : A.tactics.pace === 'slow' ? -0.01 : 0)
    + (A.tactics.target && A.tactics.target === move.tgt ? 0.02 : 0)
    + (A.tactics.finisherSetup && move.cat === 'finisher' ? 0.1 : 0);
  parts.state = (D.dazed > 0 ? 0.06 : 0) - (A.dazed > 0 ? 0.15 : 0)
    + (D.pos === 'grounded' && fam === 'strike' ? 0.04 : 0);
  parts.bait = 0;
  // over-the-top toss: raw strength against the target's toughness and how much they have left in the tank
  parts.overTop = move.special === 'over_top'
    ? (A.attrs.power - D.attrs.toughness) / 500 + (0.5 - staminaFrac(D)) * 0.25 + (D.pos === 'ropes' ? 0.08 : 0) - 0.04
    : 0;
  parts.hold = move.hold ? 0.3 * (D.dmg[move.hold.tgt] / 100) - 0.08 + (staminaFrac(D) < 0.4 ? 0.06 : 0) : 0;
  let p = Object.values(parts).reduce((a, b) => a + b, 0);
  p += ctx.noise || 0;
  return { p: clamp(p, 0.04, 0.96), parts };
}

export function hintLabel(p) {
  return p >= 0.72 ? 'Strong' : p >= 0.56 ? 'Good' : p >= 0.42 ? 'Fair' : p >= 0.3 ? 'Risky' : 'Long shot';
}

/** Expected power scaling for a move from the attacker's relevant attributes (0.75..1.25) */
export function powerScale(A, move) { return 0.75 + 0.5 * wattr(A.attrs, move.atk); }

export function calcDamage(state, atkId, move, defId, stance, variance = 1, mult = 1) {
  const A = F(state, atkId), D = F(state, defId);
  const fam = familyOf(move.cat);
  let dmg = move.dmg * powerScale(A, move);
  dmg *= 1 - 0.3 * D.attrs.toughness / 100;
  dmg *= 1 + 0.5 * (D.dmg[move.tgt] || 0) / 100;
  dmg *= 1 + 0.15 * A.momentum / 100;
  dmg *= 0.7 + 0.3 * staminaFrac(A);
  if (A.tactics.target === move.tgt) dmg *= 1.15;
  if (stance) {
    dmg *= stance.dmg[fam] ?? 1;
    if (stance.kind === 'protect') {
      const worst = Object.entries(D.dmg).sort((a, b) => b[1] - a[1])[0][0];
      if (worst === move.tgt) dmg *= stance.guardDmg;
    }
  }
  dmg *= variance * mult * DAMAGE_SCALE;
  if (state.rules.hardcore && isHardcoreMove(move)) dmg *= state.rules.hardcore; // TLC: tables, chairs and ladders hit harder
  return Math.max(0.5, dmg);
}

const IMPACT = { finisher: -0.5, signature: -0.2, power: -0.08, aerial: -0.1, corner: -0.02, grapple: -0.02, environmental: -0.08 };

/** Probability the pinned wrestler kicks out of one pin attempt. */
export function kickoutChance(state, pinnedId, pinnerId, info = {}) {
  const D = F(state, pinnedId), A = F(state, pinnerId);
  let p;
  if (info.surprise) {
    p = 0.5 + (D.attrs.psychology / 100) * 0.14 - (A.attrs.technical / 100) * 0.1 + (damageFraction(D) < 0.25 ? 0.12 : 0);
  } else {
    p = 0.84 + (IMPACT[info.lastCat] || 0);
  }
  p -= 0.38 * damageFraction(D);
  p -= 0.2 * (1 - staminaFrac(D));
  p += ((D.momentum - 50) / 100) * 0.1;
  p += (D.attrs.toughness / 100) * 0.1;
  const ph = phaseOf(state);
  p += ph === 'opening' ? 0.16 : ph === 'middle' ? 0.05 : 0;
  p += crowdBias(state, pinnedId) * (state.crowd.heat / 100) * 0.06;
  if (info.boost) p += info.boost;
  if (info.ropes) p += 0.05;
  return clamp(p, 0.06, 0.97);
}

/** Per-round chance the held wrestler escapes or reaches the ropes given their response. */
export function holdEscapeChance(state, hold, response) {
  const V = F(state, hold.victim), H = F(state, hold.holder);
  const fr = staminaFrac(V);
  const base = { power_out: 0.2 + V.attrs.power / 250, reverse_hold: 0.12 + V.attrs.technical / 220 + V.attrs.psychology / 400,
    slip_out: 0.16 + V.attrs.agility / 220, crawl_ropes: 0.44 + V.attrs.endurance / 400, fight_on: 0.12 + V.attrs.striking / 400,
    fan_up: 0.08 + (state.crowd.heat / 100) * 0.18 * Math.max(0, crowdBias(state, V.id) + 0.4), endure: 0.05 }[response] ?? 0.1;
  let p = base - hold.sev / 260 - (H.attrs.technical / 100) * 0.1 - (V.dmg[hold.tgt] / 100) * 0.16 + (fr - 0.5) * 0.14;
  p += ((V.momentum - H.momentum) / 100) * 0.06;
  p /= state.rules.subWeight ?? 1; // submission matches: holds are the whole game, so they are harder to escape
  return clamp(p, 0.04, 0.85);
}

/** Chance the held wrestler gives up this round. */
export function submitChance(state, hold) {
  const V = F(state, hold.victim);
  if (hold.sev < 50) return 0;
  const p = (hold.sev - 50) / 120 + (V.dmg[hold.tgt] / 100) * 0.22 - V.attrs.toughness / 600 - staminaFrac(V) * 0.12 + (hold.rounds * 0.015);
  return clamp(p * (state.rules.subWeight ?? 1), 0, 0.92);
}
