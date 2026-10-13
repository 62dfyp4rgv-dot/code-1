// Match AI. Uses its own seeded stream (state.aiRng) so AI choices never perturb the
// resolution dice, and sees only what a human could see (visible state + the *category* of an
// incoming attack, blurred by the AI's awareness).
import { BoundRng } from '../core/rng.js';
import { clamp } from '../core/util.js';
import { getMove } from './moves.js';
import { F, opponentOf, damageFraction, staminaFrac } from './state.js';
import { kickoutChance } from './calc.js';

export const aiRngOf = (state) => new BoundRng(state, 'aiRng');

/** Strategy profiles used both for AI opponents and for headless "player" simulations. */
export const PROFILES = {
  smart: { skill: 0.95, aggression: 0.55, risk: 0.5 },
  strong: { skill: 0.8, aggression: 0.5, risk: 0.45 },
  average: { skill: 0.55, aggression: 0.5, risk: 0.5 },
  weak: { skill: 0.25, aggression: 0.5, risk: 0.5 },
  random: { skill: 0, aggression: 0.5, risk: 0.5, random: true },
  aggressive: { skill: 0.7, aggression: 0.9, risk: 0.8 },
  defensive: { skill: 0.7, aggression: 0.2, risk: 0.2 },
  pinfocus: { skill: 0.7, aggression: 0.6, risk: 0.4, pinHappy: true },
  noFinisher: { skill: 0.8, aggression: 0.5, risk: 0.4, noFinisher: true },
};

function softPick(R, items, scoreFn, skill) {
  if (!items.length) return null;
  const T = 22 - skill * 18; // temperature: skilled AI is greedy, weak AI is noisy
  const scores = items.map(scoreFn);
  const max = Math.max(...scores);
  const w = scores.map((s) => Math.exp((s - max) / T));
  const i = R.weightedIndex(w);
  return items[i < 0 ? 0 : i];
}

function profileOf(state, id, override) {
  if (override) return override;
  const f = F(state, id);
  const diff = clamp(f.difficulty ?? state.difficulty ?? 0.5, 0, 1);
  return { skill: 0.2 + 0.7 * diff, aggression: f.ai.aggression / 100, risk: 0.5 };
}

export function chooseAction(state, id, options, override) {
  const R = aiRngOf(state);
  const prof = profileOf(state, id, override);
  const A = F(state, id), D = F(state, opponentOf(state, id));
  const opts = options.filter((o) => o.enabled);
  if (prof.random) return R.pick(opts.filter((o) => o.featured) .length ? opts.filter((o) => o.featured) : opts).id;
  const dfrac = damageFraction(D), afrac = damageFraction(A);
  const myTicks = state.outsideTicks[id] || 0;
  const subLean = A.style === 'submission' || A.style === 'technician' || getMove(A.finisherId).hold;
  const countRisk = state.rules.countout && A.pos === 'outside';
  const phaseClosing = state.phase === 'closing';
  // near the time limit a non-iron-man match turns urgent: a draw helps nobody, so everyone goes for the finish
  const tfrac = state.time / state.timeLimit;
  const urgency = state.rules.ironMan ? 0 : clamp((tfrac - 0.5) / 0.4, 0, 1) * (0.6 + prof.aggression * 0.6);
  const pick = softPick(R, opts, (o) => {
    if (o.kind === 'move') {
      const m = getMove(o.moveId);
      const pp = o.p ?? 0.5;
      let s = pp * 20 + pp * m.dmg * 3.2 - m.cost * (0.7 - prof.aggression * 0.5) + (m.setup && staminaFrac(A) > 0.4 ? 12 : 0);
      if (m.cat === 'finisher') {
        if (prof.noFinisher) return -999;
        s += 45 + dfrac * 70 + (staminaFrac(D) < 0.4 ? 18 : 0) + (phaseClosing ? 15 : -6) + urgency * 30;
        if ((o.p ?? 0) < 0.4) s -= 14;
      }
      if (m.cat === 'signature') s += 6 + (A.momentum >= 40 && A.momentum < 55 ? -8 : 0) + (afrac > 0.5 ? -6 : 0);
      s += (D.dmg[m.tgt] || 0) * 0.14;
      if (A.tactics.target === m.tgt) s += 3;
      if (staminaFrac(A) < 0.3) s -= m.cost * 1.3;
      if (m.illegal || (m.weapon && !state.rules.weapons)) {
        const unseen = state.referee.state !== 'watching';
        s += unseen ? 18 : (A.alignment === 'heel' ? -6 : -40);
      } else if (m.weapon) s += 6;
      if (m.risk) s -= (1 - prof.risk) * 12 - (A.momentum > 50 ? 4 : 0);
      s -= (A.usedMoves[m.id] || 0) * 1.5;
      if (countRisk) s -= 6 + myTicks * 4;
      if (state.rules.countout && (m.id === 'toss_outside' || m.id === 'follow_outside')) s -= m.id === 'follow_outside' ? 38 : 16;
      if (m.style.includes(A.style)) s += 5;
      if (m.hold && !state.rules.pinfall) s += 30; // submission match
      if (m.hold && subLean && (D.dmg[m.hold.tgt] || 0) >= 20) s += 18 + (D.dmg[m.hold.tgt] || 0) * 0.2;
      if (m.hold && !state.rules.pinfall) s += urgency * 16;
      if (m.id === 'rest_hold') s -= urgency * 30;
      if (m.special === 'topple') s += 40;
      if (m.pinMove) s += (staminaFrac(D) < 0.35 ? 6 : -10);
      return s;
    }
    switch (o.tempoId) {
      case 'cover': case 'cover_outside': {
        const pk = kickoutChance(state, D.id, A.id, { lastCat: state.lastImpact && state.lastImpact.target === D.id ? state.lastImpact.cat : null });
        const recent = state.lastImpact && state.lastImpact.target === D.id && state.round - state.lastImpact.round <= 1 ? 22 : 0;
        return (1 - pk) * 150 + dfrac * 40 + recent - 8 + urgency * 18 + (prof.pinHappy ? 22 : 0) - (A.style === 'submission' ? 26 : subLean ? 8 : 0);
      }
      case 'get_up': return 70;
      case 'slide_in': return 62 + (state.rules.countout ? myTicks * 9 : 0);
      case 'catch_breath': return Math.max(0, (staminaFrac(A) < 0.35 ? 58 : staminaFrac(A) < 0.55 ? 22 : 0) - urgency * 30);
      case 'taunt': return D.pos === 'grounded' && A.momentum > 40 ? 18 : 4;
      case 'hype': return A.momentum > 45 ? 14 : 2;
      case 'signal': return A.momentum >= 60 ? 30 : 0;
      case 'mind_games': return 8;
      case 'bait': return 6 + (prof.skill > 0.6 ? 3 : 0);
      case 'show_respect': return A.alignment === 'face' && state.phase === 'opening' ? 8 : 0;
      case 'distract_ref': return A.alignment === 'heel' ? 16 : 0;
      case 'roll_out': return staminaFrac(A) < 0.25 && damageFraction(A) > 0.4 ? 28 : 0;
      case 'create_distance': return 40;
      case 'climb_down': return 25;
      case 'make_tag': return damageFraction(A) > 0.2 || staminaFrac(A) < 0.4 || A.tactics.seekTag ? 70 : 8;
      case 'crawl_corner': return damageFraction(A) > 0.22 || staminaFrac(A) < 0.4 ? 56 : 4;
      case 'obj_climb': return 38 + urgency * 30 + prof.aggression * 8 + (D.pos === 'grounded' ? 22 : -14) - A.dmg.legs * 0.1;
      case 'study': return prof.skill > 0.5 ? 10 : 2;
      case 'pace_fast': return prof.aggression > 0.6 ? 9 : 2;
      case 'pace_slow': return staminaFrac(A) < 0.5 ? 12 : 1;
      case 'pace_normal': return 2;
      default:
        if (o.tempoId?.startsWith('target_')) {
          const part = o.tempoId.slice(7);
          return D.dmg[part] >= Math.max(...Object.values(D.dmg)) - 1 ? 9 : 1;
        }
        return 2;
    }
  }, prof.skill);
  return pick.id;
}

export function chooseStance(state, id, options, attack, override) {
  const R = aiRngOf(state);
  const prof = profileOf(state, id, override);
  const D = F(state, id);
  if (prof.random) return R.pick(options).id;
  const blur = (1 - prof.skill) * 28;
  const pick = softPick(R, options, (o) => {
    let s = (o.avoidPct ?? 30) + R.noise() * blur;
    if (o.stanceId === 'sell') s += staminaFrac(D) < 0.3 ? 28 : -8;
    if (o.stanceId === 'protect') s += Math.max(...Object.values(D.dmg)) > 55 ? 10 : -6;
    if (o.stanceId === 'bait') s += prof.skill > 0.6 ? 2 : -10;
    if (o.stanceId === 'fight_back') s += staminaFrac(D) < 0.25 || damageFraction(D) > 0.6 ? 10 : -8;
    if (o.stanceId === 'counter_special') s += attack.family === 'special' ? 4 : -50;
    s -= Math.max(0, o.cost) * 0.8 * (staminaFrac(D) < 0.4 ? 1.5 : 0.5);
    return s;
  }, prof.skill);
  return pick.id;
}

export function choosePin(state, id, options, pin, override) {
  const R = aiRngOf(state);
  const prof = profileOf(state, id, override);
  const D = F(state, id);
  const en = (k) => options.find((o) => o.id === `pn:${k}` && o.enabled);
  if (prof.random) return R.pick(options.filter((o) => o.enabled)).id;
  const pk = kickoutChance(state, id, pin.pinner, { lastCat: pin.lastCat, surprise: pin.surprise });
  if (en('save') && R.chance(0.7)) return 'pn:save';
  if (pk < 0.45 && en('desperate') && D.stamina >= 14) return 'pn:desperate';
  if (pk > 0.8 && staminaFrac(D) < 0.4 && R.chance(0.3 * prof.skill)) return 'pn:conserve';
  if (prof.skill > 0.6 && pk < 0.6 && R.chance(0.25) && en('fan_up') && state.crowd.heat > 50) return 'pn:fan_up';
  if (D.alignment === 'heel' && pk < 0.5 && R.chance(0.2) && en('poke')) return 'pn:poke';
  return 'pn:kickout';
}

export function chooseHoldHolder(state, id, options, override) {
  const R = aiRngOf(state);
  const prof = profileOf(state, id, override);
  const hold = state.hold;
  const H = F(state, id);
  const en = (k) => options.find((o) => o.id === `hd:${k}` && o.enabled);
  if (prof.random) return R.pick(options.filter((o) => o.enabled)).id;
  if (H.stamina < 10) return 'hd:release';
  if (hold.sev > 80 && en('wrench') && H.stamina > 20 && R.chance(0.5)) return 'hd:wrench';
  if (en('transition') && damageFraction(F(state, hold.victim)) > 0.55 && R.chance(0.25)) return 'hd:transition';
  if (H.alignment === 'heel' && en('ropes') && state.referee.state !== 'watching' && R.chance(0.5)) return 'hd:ropes';
  if (en('ask') && R.chance(0.1)) return 'hd:ask';
  if (en('shift') && R.chance(0.1)) return 'hd:shift';
  return 'hd:tighten';
}

export function chooseHoldVictim(state, id, options, override) {
  const R = aiRngOf(state);
  const prof = profileOf(state, id, override);
  const hold = state.hold;
  const V = F(state, id);
  if (prof.random) return R.pick(options).id;
  const real = options.filter((o) => !['hv:tap', 'hv:endure'].includes(o.id));
  const best = softPick(R, real, (o) => parseInt((o.hint || '0').replace(/\D/g, ''), 10) + R.noise() * (1 - prof.skill) * 25, prof.skill);
  const bestP = parseInt((best.hint || '0').replace(/\D/g, ''), 10);
  if (hold.sev > 105 && bestP < 14 && V.attrs.toughness < 70 && R.chance(0.5)) return 'hv:tap';
  if (V.stamina < 12 && R.chance(0.3)) return 'hv:endure';
  return best.id;
}

export function chooseRise(state, id, options, override) {
  const R = aiRngOf(state);
  const D = F(state, id);
  if (override?.random) return R.pick(options.filter((o) => o.enabled)).id;
  if (state.count.n >= 6 && D.stamina > 14) return 'rs:dig';
  if (state.crowd.heat > 60 && R.chance(0.3)) return 'rs:crowd';
  return 'rs:rise';
}

/** Single entry point for any AI/strategy-controlled decision. */
export function decideFor(state, decision, override) {
  const { kind, actor, options } = decision;
  switch (kind) {
    case 'action': return chooseAction(state, actor, options, override);
    case 'defense': return chooseStance(state, actor, options, decision.context.attack, override);
    case 'pin': return choosePin(state, actor, options, state.pin, override);
    case 'hold_h': return chooseHoldHolder(state, actor, options, override);
    case 'hold_v': return chooseHoldVictim(state, actor, options, override);
    case 'rise': return chooseRise(state, actor, options, override);
    case 'apron': {
      const R = aiRngOf(state);
      const urgent = options.find((o) => o.id === 'ap:break_pin');
      if (urgent && (['finisher', 'signature'].includes(state.pin?.lastCat) || R.chance(0.55))) return urgent.id;
      const pool = options.filter((o) => !o.illegal && o.enabled);
      return R.pick(pool).id;
    }
    default: throw new Error(`unknown decision kind ${kind}`);
  }
}
