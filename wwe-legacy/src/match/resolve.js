// The match resolver: the ONLY place where outcomes are decided. It consumes a validated choice,
// rolls bounded dice against calc.js probabilities, mutates the authoritative state and emits
// structured events. Commentary, statistics, memory and achievements all read those events.
import { BoundRng } from '../core/rng.js';
import { clamp } from '../core/util.js';
import { getMove, familyOf } from './moves.js';
import { STANCES } from './stances.js';
import { computeConnect, calcDamage, kickoutChance, holdEscapeChance, submitChance } from './calc.js';
import { F, opponentOf, partnerOf, legalOf, damageFraction, staminaFrac, phaseOf, crowdBias } from './state.js';
import { other } from './rules.js';
import { FREE_ACTIONS, TEMPO } from './actions.js';

const MAX_ROUNDS = 700;
export const rngOf = (state) => new BoundRng(state, 'rng');

export function emit(state, type, data = {}) {
  const e = { seq: ++state.seq, t: Math.round(state.time), round: state.round, type, ...data };
  state.events.push(e);
  return e;
}

const bump = (obj, key, n = 1) => { obj[key] = (obj[key] || 0) + n; };
const addMom = (f, n) => { f.momentum = clamp(f.momentum + n, 0, 100); };
const addConf = (f, n) => { f.confidence = clamp(f.confidence + n, 0, 100); };
const addHeat = (state, n) => { state.crowd.heat = clamp(state.crowd.heat + n, 0, 100); };
const addStamina = (f, n) => { f.stamina = clamp(f.stamina + n, 0, f.maxStamina); };
const paceTime = (f) => (f.tactics.pace === 'fast' ? 0.85 : f.tactics.pace === 'slow' ? 1.15 : 1);

function hurt(state, f, part, amount, source) {
  const before = f.dmg[part];
  f.dmg[part] = clamp(before + amount, 0, 100);
  const real = f.dmg[part] - before;
  f.stats.damageTaken += real;
  if (before < 85 && f.dmg[part] >= 85 && !f.injured[part]) {
    f.injured[part] = true;
    const severity = f.dmg[part] >= 98 ? 2 : 1;
    f.injuriesNew.push({ part, severity });
    emit(state, 'injury', { actor: f.id, part, severity, source });
  }
  return real;
}

// ------------------------------------------------------------------------------------------
// match end
// ------------------------------------------------------------------------------------------
export function finishMatch(state, winnerSide, finish, extra = {}) {
  if (state.result) return;
  const winners = winnerSide === null ? [] : state.teams[winnerSide];
  const losers = winnerSide === null ? [] : state.teams[other(winnerSide)];
  const winnerId = winnerSide === null ? null : (extra.winnerId || legalOf(state, winnerSide) || winners[0]);
  state.result = {
    winnerSide, winnerId, winners, losers, finish, durationSec: Math.round(state.time), rounds: state.round,
    finishMove: extra.finishMove || null, falls: { ...state.falls }, ...extra,
  };
  state.pending = null; state.hold = null; state.pin = null; state.count = null;
  emit(state, 'match_end', { winner: winnerId, winnerSide, finish, finishMove: extra.finishMove || null });
}

function scoreFall(state, side, finish, extra = {}) {
  state.falls[side] += 1;
  state.fallLog.push({ side, finish, t: Math.round(state.time), ...extra });
  emit(state, 'fall', { side, finish, falls: { ...state.falls }, ...extra });
  state.hold = null; state.pin = null; state.count = null;
  for (const f of Object.values(state.fighters)) {
    f.pos = f.legal ? 'standing' : 'apron'; f.dazed = 0; addStamina(f, 14); f.momentum = 25;
  }
  const loser = legalOf(state, other(side));
  state.initiative = loser;
  state.chain = null;
}

/** End the match or (iron man) score a fall. */
function decide(state, winnerSide, finish, extra = {}) {
  if (state.rules.ironMan && finish !== 'time_limit') { scoreFall(state, winnerSide, finish, extra); return; }
  finishMatch(state, winnerSide, finish, extra);
}

function refCheck(state, R, A, move) {
  const weaponIllegal = move.weapon && !state.rules.weapons;
  const illegal = move.illegal || weaponIllegal;
  if (!illegal) return 'legal';
  if (state.rules.dq === false) return 'legal';
  A.stats.illegalMoves++;
  const seenP = state.referee.state === 'watching' ? 0.72 - A.attrs.psychology / 400 : state.referee.state === 'distracted' ? 0.1 : 0;
  if (R.next() >= seenP) { emit(state, 'illegal_unseen', { actor: A.id, move: move.id, moveName: move.name }); return 'unseen'; }
  bump(state.warnings, A.id);
  if (weaponIllegal || state.warnings[A.id] >= 2) {
    emit(state, 'dq', { actor: A.id, move: move.id, moveName: move.name, reason: weaponIllegal ? 'weapon' : 'warnings' });
    decide(state, other(A.side), 'dq', { dqBy: A.id });
    return 'dq';
  }
  emit(state, 'warning', { actor: A.id, move: move.id, moveName: move.name, count: state.warnings[A.id] });
  return 'warn';
}

// ------------------------------------------------------------------------------------------
// round bookkeeping
// ------------------------------------------------------------------------------------------
export const TIME_SCALE = 1.0;

export function finalizeRound(state, R, spent) {
  state.time += spent * TIME_SCALE;
  state.round += 1;
  if (state.result) return;
  for (const f of Object.values(state.fighters)) {
    const inRing = f.legal;
    const regen = inRing ? (1.2 + f.attrs.endurance / 60) * (f.tactics.pace === 'slow' ? 1.3 : f.tactics.pace === 'fast' ? 0.8 : 1) * (1 - f.dmg.torso / 250)
      : 3;
    addStamina(f, regen);
    if (f.dazed > 0) f.dazed -= 1;
    if (f.tactics.finisherSetup && state.round - (f.tactics.setupRound ?? 0) > 4) f.tactics.finisherSetup = false;
    f.momentum = clamp(f.momentum + (f.momentum > 60 ? -0.6 : 0), 0, 100);
  }
  if (state.referee.turns > 0) {
    state.referee.turns -= 1;
    if (state.referee.turns === 0) { state.referee.state = 'watching'; emit(state, 'ref_recovers', {}); }
  }
  addHeat(state, -1.5);
  state.crowdStats = state.crowdStats || { sum: 0, n: 0, peak: 0 };
  state.crowdStats.sum += state.crowd.heat; state.crowdStats.n += 1; state.crowdStats.peak = Math.max(state.crowdStats.peak, state.crowd.heat);
  state.phase = phaseOf(state);
  state.peakDeficit = state.peakDeficit || {};
  for (const f of Object.values(state.fighters)) {
    if (!f.legal) continue;
    const o = F(state, opponentOf(state, f.id));
    if (o) state.peakDeficit[f.id] = Math.max(state.peakDeficit[f.id] || 0, damageFraction(f) - damageFraction(o));
  }
  // count-out
  if (state.rules.countout && !state.result) {
    for (const side of [0, 1]) {
      const id = legalOf(state, side);
      if (!id) continue;
      const f = F(state, id);
      if (f.pos === 'outside') {
        const t = (state.outsideTicks[id] || 0) + 2;
        state.outsideTicks[id] = t;
        emit(state, 'count', { actor: id, n: Math.min(10, t) });
        if (t >= 10 && !state.result) {
          const oppOut = F(state, legalOf(state, other(side)) || id).pos === 'outside' && (state.outsideTicks[legalOf(state, other(side))] || 0) >= 10;
          emit(state, 'countout', { actor: id });
          if (oppOut) finishMatch(state, null, 'double_countout');
          else decide(state, other(side), 'countout', { countedOut: id });
          state.outsideTicks[id] = 0;
        }
      } else state.outsideTicks[id] = 0;
    }
  }
  if (!state.result && state.time >= state.timeLimit) {
    if (state.rules.ironMan) {
      const [a, b] = [state.falls[0], state.falls[1]];
      emit(state, 'time_limit', { falls: { ...state.falls } });
      finishMatch(state, a === b ? null : a > b ? 0 : 1, a === b ? 'time_limit_draw' : 'falls', {});
    } else {
      emit(state, 'time_limit', {});
      finishMatch(state, null, 'time_limit_draw');
    }
  }
  if (!state.result && state.round >= MAX_ROUNDS) finishMatch(state, null, 'stalemate');
}

// ------------------------------------------------------------------------------------------
// tempo / tactic actions
// ------------------------------------------------------------------------------------------
export function resolveTempo(state, actorId, tempoId) {
  const R = rngOf(state);
  const A = F(state, actorId);
  const D = F(state, opponentOf(state, actorId));
  const t = TEMPO[tempoId];
  if (!t || t.check(state, A, D) !== null) throw new Error(`illegal tempo action ${tempoId}`);
  if (FREE_ACTIONS.has(tempoId)) {
    A.tactics.lastTactic = state.round;
    if (tempoId.startsWith('pace_')) A.tactics.pace = tempoId.slice(5);
    else if (tempoId.startsWith('target_')) A.tactics.target = tempoId.slice(7);
    else if (tempoId === 'study') {
      A.tactics.studyUntil = state.round + 5;
      const reads = Object.entries(A.reads).sort((a, b) => b[1] - a[1]);
      A.tactics.studyCat = reads.length ? reads[0][0] : null;
      addStamina(A, -2);
    }
    emit(state, 'tactic', { actor: actorId, tactic: tempoId, detail: A.tactics.studyCat || A.tactics.target || A.tactics.pace });
    return; // free: no time, initiative unchanged, same decision point again
  }
  let spent = 12;
  let pass = true;
  switch (tempoId) {
    case 'cover': case 'cover_outside':
      if (!startPin(state, R, actorId, D.id, { lastCat: state.lastImpact && state.lastImpact.target === D.id ? state.lastImpact.cat : null })) {
        finalizeRound(state, R, 8);
      }
      return;
    case 'get_up':
      A.pos = 'standing'; addStamina(A, -4); spent = 8; pass = D.pos !== 'grounded';
      emit(state, 'position', { actor: actorId, pos: 'standing', how: 'get_up' });
      break;
    case 'slide_in':
      A.pos = 'standing'; state.outsideTicks[actorId] = 0; spent = 6;
      emit(state, 'position', { actor: actorId, pos: 'standing', how: 'slide_in' });
      break;
    case 'catch_breath':
      addStamina(A, 11); addStamina(D, 3); spent = 15; A.stats.recovers = (A.stats.recovers || 0) + 1;
      emit(state, 'recover', { actor: actorId, amount: 11 });
      break;
    case 'taunt':
      addMom(A, 6); addConf(A, 3); addHeat(state, 6 + (A.alignment === 'heel' ? 2 : 0)); addStamina(D, 4); A.stats.taunts++;
      spent = 10; pass = D.pos !== 'grounded';
      emit(state, 'taunt', { actor: actorId, target: D.id });
      break;
    case 'hype':
      addMom(A, 8); addHeat(state, 12); addStamina(A, -3); addConf(A, 3); spent = 12;
      emit(state, 'hype', { actor: actorId });
      break;
    case 'signal':
      A.tactics.finisherSetup = true; A.tactics.setupRound = state.round; addMom(A, 6); addHeat(state, 14); addStamina(D, 6);
      D.reads.finisher = (D.reads.finisher || 0) + 1; spent = 12;
      emit(state, 'signal_finisher', { actor: actorId });
      break;
    case 'mind_games': {
      const p = clamp(0.5 + (A.attrs.psychology - D.attrs.psychology) / 200, 0.15, 0.85);
      const ok = R.next() < p;
      if (ok) { addConf(D, -10); addMom(D, -5); addConf(A, 3); } else addConf(A, -6);
      spent = 12;
      emit(state, 'mind_games', { actor: actorId, target: D.id, success: ok });
      break;
    }
    case 'bait':
      A.tactics.bait = true; spent = 8;
      emit(state, 'bait_set', { actor: actorId });
      break;
    case 'show_respect': {
      addStamina(D, 4); spent = 10;
      A.stats.respectShown = (A.stats.respectShown || 0) + 1;
      if (D.alignment === 'heel' && R.chance(0.45)) {
        hurt(state, A, 'head', 6, 'cheap_shot'); addMom(D, 4); addHeat(state, 6);
        emit(state, 'respect_betrayed', { actor: actorId, target: D.id, damage: 6 });
      } else {
        addHeat(state, 5); addConf(A, 2);
        emit(state, 'respect_shown', { actor: actorId, target: D.id });
      }
      break;
    }
    case 'distract_ref': {
      const ok = R.next() < 0.5 + A.attrs.psychology / 200;
      if (ok) { state.referee.state = 'distracted'; state.referee.turns = 2; }
      addStamina(A, -2); spent = 10; pass = false;
      emit(state, 'distract_ref', { actor: actorId, success: ok });
      break;
    }
    case 'roll_out':
      A.pos = 'outside'; addStamina(A, 7); spent = 14; state.outsideTicks[actorId] = 0;
      emit(state, 'position', { actor: actorId, pos: 'outside', how: 'roll_out' });
      break;
    case 'create_distance':
      A.pos = 'standing'; spent = 8;
      emit(state, 'position', { actor: actorId, pos: 'standing', how: 'break_away' });
      break;
    case 'climb_down':
      A.pos = 'standing'; spent = 6;
      emit(state, 'position', { actor: actorId, pos: 'standing', how: 'climb_down' });
      break;
    case 'make_tag': {
      const partner = F(state, partnerOf(state, actorId));
      const ready = state.tagReady && state.tagReady[A.side] ? 0.12 : 0;
      const p = clamp(0.78 + ready - (D.ai.aggression / 100) * 0.1 + (A.attrs.agility - D.attrs.agility) / 500, 0.4, 0.95);
      spent = 10;
      if (R.next() < p) doTag(state, A, partner, R);
      else { emit(state, 'tag_cut_off', { actor: actorId, target: D.id }); addMom(D, 4); }
      if (state.tagReady) state.tagReady[A.side] = false;
      break;
    }
    case 'crawl_corner': {
      const p = clamp(0.55 + (A.attrs.agility - D.attrs.agility) / 300 - (A.dazed ? 0.1 : 0), 0.3, 0.85);
      spent = 12;
      if (R.next() < p) { A.pos = 'corner'; emit(state, 'position', { actor: actorId, pos: 'corner', how: 'crawl' }); pass = false; }
      else { emit(state, 'crawl_stopped', { actor: actorId, target: D.id }); }
      break;
    }
    case 'obj_climb':
      doClimb(state, R, A, D);
      spent = 16;
      break;
    default:
      throw new Error(`unhandled tempo ${tempoId}`);
  }
  if (!state.result) {
    if (pass) state.initiative = D.id;
    state.chain = null;
  }
  finalizeRound(state, R, spent * paceTime(A));
}

function doClimb(state, R, A, D) {
  const steps = state.objective.steps;
  const p = clamp(0.9 - (1 - staminaFrac(A)) * 0.25 - A.dmg.legs / 400, 0.4, 0.95);
  if (R.next() < p) {
    A.climb += 1; A.pos = 'top'; addStamina(A, -4);
    emit(state, 'climb', { actor: A.id, rung: A.climb, steps });
    if (A.climb >= steps) {
      emit(state, 'objective', { actor: A.id, kind: state.rules.objective });
      decide(state, A.side, 'objective', { objective: state.rules.objective, winnerId: A.id });
    }
  } else {
    A.pos = 'grounded'; A.climb = 0; hurt(state, A, 'legs', 6, 'slip'); addMom(A, -6);
    emit(state, 'slip', { actor: A.id });
  }
}

export function doTag(state, A, partner, R) {
  const hot = damageFraction(A) > 0.3;
  A.legal = false; A.pos = 'apron'; A.stats.tags++;
  partner.legal = true; partner.pos = 'standing';
  state.initiative = partner.id;
  state.outsideTicks[A.id] = 0;
  emit(state, 'tag', { actor: A.id, partner: partner.id, hot });
  if (hot) { addMom(partner, 18); addHeat(state, 14); emit(state, 'hot_tag', { actor: partner.id }); }
  partner.stats.entered = (partner.stats.entered || 0) + 1;
}

// ------------------------------------------------------------------------------------------
// attacks: choose move -> defender chooses stance -> resolve
// ------------------------------------------------------------------------------------------
export function beginAttack(state, actorId, moveId) {
  const A = F(state, actorId);
  const D = F(state, opponentOf(state, actorId));
  const move = getMove(moveId);
  state.pending = { kind: 'defense', actor: D.id, attack: { attackerId: actorId, moveId, cat: move.cat, family: familyOf(move.cat), round: state.round } };
  state.lastAction = { actor: actorId, moveId };
  return state.pending;
}

export function resolveDefense(state, stanceId) {
  const pend = state.pending;
  if (!pend || pend.kind !== 'defense') throw new Error('no defense pending');
  const R = rngOf(state);
  const { attackerId, moveId } = pend.attack;
  const A = F(state, attackerId), D = F(state, pend.actor);
  const move = getMove(moveId);
  const stance = STANCES[stanceId];
  state.pending = null;
  const fam = familyOf(move.cat);

  // costs & bookkeeping
  const cost = Math.min(A.stamina, move.cost);
  addStamina(A, -cost); A.stats.staminaSpent += cost;
  addStamina(D, -stance.cost);
  A.stats.attempted++;
  bump(A.stats.categories, move.cat);
  bump(A.usedMoves, move.id);
  bump(A.habits, move.cat);
  if (move.cat === 'finisher') { A.stats.finishersAttempted++; A.stats.usedFinisher = true; }
  if (move.cat === 'signature') A.stats.signaturesAttempted++;
  if (move.risk) A.stats.highRiskAttempted++;
  if (move.cat === 'finisher') A.momentum = Math.max(15, A.momentum - 60);
  else if (move.cat === 'signature') A.momentum = Math.max(10, A.momentum - 14);
  A.tactics.finisherSetup = move.cat === 'finisher' ? false : A.tactics.finisherSetup;

  const spent = move.time * paceTime(A);

  if (move.illegal || (move.weapon && !state.rules.weapons)) {
    const verdict = refCheck(state, R, A, move);
    if (verdict === 'dq') { finalizeRound(state, R, spent); return summarize(state); }
  }

  // reading: the defender has now seen this
  bump(D.seen, move.id);
  bump(D.reads, move.cat);

  const baitActive = D.tactics.bait;
  const noise = R.noise() * 0.05;
  const { p } = computeConnect(state, A.id, move, D.id, stance, { noise });
  const pEff = clamp(p - (baitActive ? 0.16 * (stance.avoid[fam] > 0 ? 1 : 0.5) : 0), 0.04, 0.96);
  const roll = R.next();
  let connected = roll < pEff;
  let outcome = 'connect';
  let detail = {};

  if (connected && stance.kind === 'bait') {
    const baitP = clamp(0.28 + D.attrs.psychology / 250 + D.attrs.technical / 500 - (D.seen[move.id] > 1 ? 0 : 0) - (A.attrs.psychology / 600), 0.15, 0.7);
    if (R.next() < baitP) { connected = false; outcome = 'reversed'; detail.baited = true; }
  }
  if (!connected && outcome === 'connect') {
    outcome = avoidOutcome(stance, D, A, R, fam, move);
  }
  D.tactics.bait = false;

  if (outcome === 'connect') connectHit(state, R, A, D, move, stance, fam);
  else failedAttack(state, R, A, D, move, stance, fam, outcome, detail);

  // initiative flow
  if (!state.result && !state.pending) setInitiativeAfter(state, R, A, D, outcome, move);
  finalizeRound(state, R, spent);
  return summarize(state);
}

function summarize(state) { return state.events; }

function avoidOutcome(stance, D, A, R, fam, move) {
  const techRev = 0.04 + D.attrs.psychology / 1100 + D.attrs.technical / 1400;
  switch (stance.kind) {
    case 'block': return R.next() < techRev ? 'reversed' : 'blocked';
    case 'dodge': return R.next() < techRev ? 'reversed' : 'dodged';
    case 'reverse': return R.next() < clamp(stance.rev * (0.55 + 0.45 * D.attrs.technical / 100), 0.3, 0.95) ? 'reversed' : 'blocked';
    case 'counter': return R.next() < clamp(stance.rev * (0.55 + 0.45 * D.attrs.striking / 100), 0.3, 0.95) ? 'countered' : 'blocked';
    case 'fight': return R.next() < stance.rev * 0.6 ? 'countered' : 'blocked';
    case 'counter_special': return R.next() < stance.rev * (0.6 + 0.4 * D.attrs.psychology / 100) ? 'reversed' : 'dodged';
    case 'distance': return 'evaded';
    case 'roll': return 'dodged';
    default: return 'blocked';
  }
}

function connectHit(state, R, A, D, move, stance, fam) {
  const variance = 0.9 + R.next() * 0.2;
  const crit = R.next() < 0.07 + (A.confidence - 50) / 1000;
  let mult = crit ? 1.25 : 1;
  if (stance.fail > 1) mult *= stance.fail;
  const dmg = calcDamage(state, A.id, move, D.id, stance, variance, mult);
  const real = hurt(state, D, move.tgt, dmg, move.id);
  A.stats.damageDealt += real;
  addStamina(D, -dmg * 0.3);
  A.stats.connected++;
  if (move.selfStamina) addStamina(A, move.selfStamina);
  if (move.risk) A.stats.highRiskLanded++;
  if (stance.kind === 'sell') { addMom(D, 2); addHeat(state, 3); addConf(D, 2); }
  // dazed
  if (move.tgt === 'head' && dmg >= 9 && R.chance(0.12 + D.dmg.head / 400)) D.dazed = 1;
  // positions
  if (move.toD && !(D.pos === 'outside' && move.toD === 'grounded')) D.pos = move.toD;
  if (move.toA && !(A.pos === 'outside' && move.toA === 'grounded')) A.pos = move.toA;
  // momentum & crowd
  const hype = move.mom || 0;
  addMom(A, 3 + hype * 1.25 * (1 + 0.3 * crowdBias(state, A.id) * state.crowd.heat / 100));
  addMom(D, -hype * 0.5);
  addConf(A, 2); addConf(D, -2);
  addHeat(state, move.heat * 0.8 + (crit ? 3 : 0));
  state.lastImpact = { target: D.id, attacker: A.id, cat: move.cat, moveId: move.id, round: state.round };
  if (state.chain && state.chain.id === A.id) state.chain.n++; else state.chain = { id: A.id, n: 1 };
  if (move.cat === 'finisher') { A.stats.finishersHit++; A.momentum = Math.max(A.momentum, 35); }
  if (move.cat === 'signature') A.stats.signaturesHit++;
  const quality = crit ? 'devastating' : dmg > move.dmg * 1.1 ? 'clean' : 'solid';
  const type = move.cat === 'finisher' ? 'finisher_connected' : move.cat === 'signature' ? 'signature_connected' : 'move_connected';
  emit(state, type, {
    actor: A.id, target: D.id, move: move.id, moveName: move.name, cat: move.cat, part: move.tgt, damage: Math.round(real * 10) / 10,
    quality, stance: stance.id, illegal: move.illegal,
  });
  // special effects
  if (move.special === 'topple') {
    D.climb = 0; D.pos = 'grounded';
    const extra = hurt(state, D, 'torso', 8, 'fall');
    emit(state, 'toppled', { actor: A.id, target: D.id, damage: extra });
  }
  if (move.hold && !state.result) startHold(state, A, D, move);
  if (move.pinMove && !state.result) {
    emit(state, 'surprise_pin', { actor: A.id, target: D.id, move: move.id, moveName: move.name });
    startPin(state, R, A.id, D.id, { surprise: true, lastCat: move.cat });
  }
  if (state.rules.tenCount && !state.result && !state.count && D.pos === 'grounded'
    && (dmg >= 11 || move.cat === 'finisher' || move.cat === 'signature')
    && R.chance(0.45 + damageFraction(D) * 0.55 + (move.cat === 'finisher' ? 0.3 : 0))) {
    state.count = { id: D.id, n: 0 };
    A.stats.knockdowns++;
    emit(state, 'knockdown', { actor: A.id, target: D.id });
    state.pending = { kind: 'rise', actor: D.id };
  }
}

function failedAttack(state, R, A, D, move, stance, fam, outcome, detail) {
  state.chain = null;
  const fin = move.cat === 'finisher';
  const sig = move.cat === 'signature';
  if (outcome === 'blocked') {
    A.stats.blocked++;
    addMom(D, 2); addMom(A, -1); addHeat(state, 1);
    emit(state, fin ? 'finisher_blocked' : 'move_blocked', { actor: A.id, target: D.id, move: move.id, moveName: move.name, cat: move.cat, stance: stance.id });
  } else if (outcome === 'dodged' || outcome === 'evaded') {
    A.stats.dodged++;
    addMom(D, 3); addMom(A, -3);
    let selfDmg = 0;
    if (move.risk && R.chance(0.85)) selfDmg = hurt(state, A, move.risk.part, move.risk.dmg, 'miss');
    if (move.toA && ['grounded', 'outside'].includes(move.toA) && !(A.pos === 'outside')) A.pos = move.toA === 'top' ? 'grounded' : move.toA;
    if (A.pos === 'top') A.pos = 'grounded';
    if (['aerial', 'power'].includes(fam) && state.referee.state === 'watching' && R.chance(0.08)) {
      state.referee.state = 'down'; state.referee.turns = 3;
      emit(state, 'ref_bump', { actor: A.id });
    }
    emit(state, fin ? 'finisher_dodged' : 'move_dodged', {
      actor: A.id, target: D.id, move: move.id, moveName: move.name, cat: move.cat, stance: stance.id, selfDamage: Math.round(selfDmg * 10) / 10, evaded: outcome === 'evaded',
    });
  } else if (outcome === 'reversed' || outcome === 'countered') {
    const isRev = outcome === 'reversed';
    A.stats[isRev ? 'reversed' : 'countered']++;
    D.stats.reversalsMade++;
    if (fin) A.stats.finishersReversed++;
    const part = fam === 'strike' ? 'head' : fam === 'sub' ? 'arms' : fam === 'aerial' || fam === 'power' ? 'torso' : fam === 'special' ? 'head' : 'torso';
    const base = 1.3 * ((fin ? 15 : sig ? 10 : 7)) + (isRev ? (D.attrs.technical + D.attrs.power) / 22 : D.attrs.striking / 12);
    const dmg = base * (0.9 + R.next() * 0.2) * (1 - 0.25 * A.attrs.toughness / 100);
    const real = hurt(state, A, part, dmg, 'reversal');
    D.stats.damageDealt += real;
    addStamina(A, -real * 0.3);
    addMom(D, fin ? 22 : 10); addMom(A, fin ? -12 : -8); addConf(D, 4); addConf(A, -4);
    addHeat(state, fin ? 20 : 8);
    if (fam !== 'strike' || R.chance(0.4)) A.pos = A.pos === 'outside' ? 'outside' : 'grounded';
    if (fam === 'strike' && R.chance(0.35)) A.dazed = 1;
    D.pos = D.pos === 'outside' ? 'outside' : D.pos === 'corner' || D.pos === 'ropes' ? 'standing' : D.pos;
    state.lastImpact = { target: A.id, attacker: D.id, cat: 'reversal', moveId: null, round: state.round };
    emit(state, fin ? 'finisher_reversed' : 'move_reversed', {
      actor: A.id, target: D.id, move: move.id, moveName: move.name, cat: move.cat, family: fam, part, damage: Math.round(real * 10) / 10,
      by: stance.id, baited: !!detail.baited, outcome,
    });
  }
}

function setInitiativeAfter(state, R, A, D, outcome, move) {
  let next = A.id;
  if (outcome === 'connect') {
    if (state.chain && state.chain.n >= 3 && R.chance(0.35)) {
      next = D.id; state.chain = null;
      emit(state, 'momentum_shift', { actor: D.id, reason: 'hope_spot' });
      if (D.momentum < 40) D.stats.comebacks++;
    } else if (staminaFrac(A) < 0.18 && R.chance(0.4)) next = D.id;
    else if (D.pos === 'grounded' && A.pos === 'grounded') next = R.chance(0.5) ? A.id : D.id;
  } else if (outcome === 'blocked') {
    next = R.chance(0.5) ? A.id : D.id;
  } else next = D.id;
  state.initiative = next;
  if (state.hold || state.pin) return;
}

// ------------------------------------------------------------------------------------------
// pins
// ------------------------------------------------------------------------------------------
export function canPin(state, pinnerId, pinnedId, surprise = false) {
  const A = F(state, pinnerId), D = F(state, pinnedId);
  if (!(state.rules.pinfall || state.rules.ironMan)) return false;
  if (!A.legal || !D.legal) return false;
  if (!surprise && D.pos !== 'grounded' && !(D.pos === 'outside' && state.rules.dq === false)) return false;
  if (D.pos === 'outside' && state.rules.dq !== false) return false;
  return true;
}

export function startPin(state, R, pinnerId, pinnedId, opts = {}) {
  const A = F(state, pinnerId), D = F(state, pinnedId);
  if (!canPin(state, pinnerId, pinnedId, !!opts.surprise)) {
    emit(state, 'pin_invalid', { actor: pinnerId, target: pinnedId });
    return false;
  }
  A.stats.pinsAttempted++;
  if (state.referee.state === 'down') {
    emit(state, 'pin_no_ref', { actor: pinnerId, target: pinnedId });
    addStamina(A, -3);
    return false;
  }
  A.pos = A.pos === 'outside' ? 'outside' : 'grounded';
  state.pin = { pinner: pinnerId, pinned: pinnedId, lastCat: opts.lastCat || null, surprise: !!opts.surprise, bonus: opts.bonus || 0 };
  emit(state, 'pin_attempt', { actor: pinnerId, target: pinnedId, surprise: !!opts.surprise, lastCat: opts.lastCat || null });
  state.pending = { kind: 'pin', actor: pinnedId };
  return true;
}

export function resolvePinChoice(state, choiceId) {
  const pend = state.pending;
  if (!pend || pend.kind !== 'pin' || !state.pin) throw new Error('no pin pending');
  const R = rngOf(state);
  const pin = state.pin;
  const A = F(state, pin.pinner), D = F(state, pin.pinned);
  state.pending = null;
  let boost = -(pin.bonus || 0);
  let cost = 4;
  const key = choiceId.slice(3);
  let spent = 8;
  if (key === 'desperate') { boost += 0.12; cost = 12; }
  else if (key === 'conserve') { boost -= 0.07; cost = 0; }
  else if (key === 'fan_up') { boost += crowdBias(state, D.id) * (state.crowd.heat / 100) * 0.2 + 0.02; cost = 3; }
  addStamina(D, -cost);

  // illegal poke
  if (key === 'poke') {
    D.stats.illegalMoves++;
    const seenP = state.rules.dq === false ? 0 : state.referee.state === 'watching' ? 0.65 : state.referee.state === 'distracted' ? 0.1 : 0;
    if (R.next() < seenP) {
      bump(state.warnings, D.id);
      if (state.warnings[D.id] >= 2) {
        emit(state, 'dq', { actor: D.id, reason: 'warnings', moveName: 'Eye Poke' });
        state.pin = null; decide(state, other(D.side), 'dq', { dqBy: D.id }); finalizeRound(state, R, spent); return state.events;
      }
      emit(state, 'warning', { actor: D.id, moveName: 'Eye Poke', count: state.warnings[D.id] });
    } else if (R.next() < 0.6) {
      emit(state, 'pin_broken_dirty', { actor: D.id, target: A.id });
      hurt(state, A, 'head', 3, 'eye_poke'); addMom(D, 4);
      state.pin = null; state.initiative = D.id; finalizeRound(state, R, spent); return state.events;
    }
  }
  // partner save
  if (state.rules.tag) {
    const partnerId = partnerOf(state, D.id);
    const partner = partnerId && F(state, partnerId);
    if (partner && partner.pos === 'apron') {
      let p = key === 'save' ? 0.7 : (!partner.isPlayer && pin.lastCat === 'finisher' ? 0.4 : !partner.isPlayer ? 0.14 : 0);
      p *= 0.7 ** (partner.saves || 0); // a partner who keeps diving in is winded: saves get harder
      if (p > 0 && R.next() < p) {
        partner.saves = (partner.saves || 0) + 1;
        emit(state, 'pin_save', { actor: partnerId, target: A.id, saved: D.id });
        hurt(state, A, 'torso', 4, 'save');
        state.pin = null; state.initiative = D.id; addHeat(state, 8);
        finalizeRound(state, R, spent); return state.events;
      }
    }
  }
  // bridge/reverse
  if (key === 'bridge') {
    const rp = clamp(0.08 + D.attrs.technical / 500 + D.attrs.psychology / 800 - A.attrs.technical / 700, 0.04, 0.3);
    if (R.next() < rp) {
      emit(state, 'pin_reversed', { actor: D.id, target: A.id });
      addMom(D, 12); addMom(A, -8);
      state.pin = { pinner: D.id, pinned: A.id, lastCat: null, surprise: true, bonus: 0 };
      A.pos = 'grounded';
      state.pending = { kind: 'pin', actor: A.id };
      state.initiative = D.id;
      finalizeRound(state, R, 6);
      return state.events;
    }
    boost -= 0.04;
  }
  const pk = kickoutChance(state, D.id, A.id, { lastCat: pin.lastCat, surprise: pin.surprise, boost, ropes: D.pos === 'ropes' });
  const roll = R.next();
  const kicked = roll < pk;
  const nearFall = kicked && roll > pk * 0.55;
  emit(state, 'pin_count', { actor: A.id, target: D.id, count: 1 });
  emit(state, 'pin_count', { actor: A.id, target: D.id, count: 2 });
  state.pin = null;
  if (kicked) {
    const fin = pin.lastCat === 'finisher', sig = pin.lastCat === 'signature';
    D.stats.kickouts++;
    if (nearFall || fin || sig) A.stats.nearFalls++;
    if (fin) A.stats.finishersKickedOut++;
    addMom(D, fin ? 16 : 9); addMom(A, fin ? -16 : -8); addConf(D, 3); addConf(A, -3);
    addHeat(state, fin ? 16 : nearFall ? 10 : 5);
    emit(state, 'pin_kickout', { actor: D.id, target: A.id, count: nearFall || fin ? 2 : 1, nearFall: nearFall || fin || sig, lastCat: pin.lastCat, surprise: pin.surprise, kickoutChance: Math.round(pk * 100) });
    state.initiative = pin.surprise ? D.id : A.id;
    if (pin.surprise) { A.pos = 'grounded'; }
    state.chain = null;
  } else {
    emit(state, 'pin_count', { actor: A.id, target: D.id, count: 3 });
    const fm = state.lastImpact && state.lastImpact.target === D.id && state.lastImpact.moveId ? state.lastImpact.moveId : null;
    emit(state, 'pin_win', { actor: A.id, target: D.id, lastCat: pin.lastCat, finishMove: fm, surprise: pin.surprise });
    decide(state, A.side, 'pinfall', { finishMove: fm, finishCat: pin.lastCat, winnerId: A.id });
  }
  finalizeRound(state, R, spent);
  return state.events;
}

// ------------------------------------------------------------------------------------------
// submission holds
// ------------------------------------------------------------------------------------------
function startHold(state, H, V, move) {
  const sev = move.hold.sev * (0.8 + 0.4 * (H.attrs.technical + H.attrs.grappling) / 200);
  state.hold = { holder: H.id, victim: V.id, moveId: move.id, moveName: move.name, tgt: move.hold.tgt, sev, ropeProg: 0, rounds: 0, drain: move.hold.drain, finisher: move.cat === 'finisher' };
  H.pos = 'grounded'; V.pos = 'grounded';
  H.stats.submissionsApplied++;
  emit(state, 'submission_applied', { actor: H.id, target: V.id, move: move.id, moveName: move.name, part: move.hold.tgt, severity: Math.round(sev) });
  state.pending = { kind: 'hold_h', actor: H.id };
}

export function resolveHoldHolder(state, choiceId) {
  const pend = state.pending;
  if (!pend || pend.kind !== 'hold_h') throw new Error('no hold decision pending');
  const R = rngOf(state);
  const hold = state.hold;
  const H = F(state, hold.holder), V = F(state, hold.victim);
  const key = choiceId.slice(3);
  const out = { key, gain: 0 };
  if (key === 'release') {
    emit(state, 'hold_released', { actor: H.id, target: V.id });
    state.hold = null; state.pending = null; state.initiative = H.id;
    finalizeRound(state, R, 6);
    return state.events;
  }
  if (key === 'transition') {
    emit(state, 'hold_transition', { actor: H.id, target: V.id });
    state.hold = null; state.pending = null;
    if (!startPin(state, R, H.id, V.id, { lastCat: 'submission', bonus: 0.04 })) finalizeRound(state, R, 6);
    return state.events;
  }
  if (key === 'tighten') { out.gain = 10 + H.attrs.technical / 10; addStamina(H, -4); }
  else if (key === 'wrench') {
    out.gain = 18 + H.attrs.technical / 12; addStamina(H, -7);
    if (R.chance(0.12)) { emit(state, 'hold_slipped', { actor: H.id, target: V.id }); state.hold = null; state.pending = null; state.initiative = V.id; finalizeRound(state, R, 8); return state.events; }
  } else if (key === 'ask') {
    out.gain = 5; addConf(V, -4); addHeat(state, 4); addMom(H, 3);
    emit(state, 'demand_submit', { actor: H.id, target: V.id });
  } else if (key === 'shift') {
    const parts = ['head', 'torso', 'arms', 'legs'].filter((p) => p !== hold.tgt).sort((a, b) => V.dmg[b] - V.dmg[a]);
    hold.tgt = parts[0]; out.gain = 6; addStamina(H, -3);
    emit(state, 'hold_shift', { actor: H.id, target: V.id, part: hold.tgt });
  } else if (key === 'ropes') {
    const mv = { illegal: true, id: 'rope_leverage', name: 'Rope Leverage', weapon: false };
    const verdict = refCheck(state, R, H, mv);
    if (verdict === 'dq') { state.hold = null; state.pending = null; finalizeRound(state, R, 6); return state.events; }
    out.gain = 16;
  }
  state.pending = { kind: 'hold_v', actor: V.id, holderChoice: out };
  return state.events;
}

export function resolveHoldVictim(state, choiceId) {
  const pend = state.pending;
  if (!pend || pend.kind !== 'hold_v') throw new Error('no hold response pending');
  const R = rngOf(state);
  const hold = state.hold;
  const H = F(state, hold.holder), V = F(state, hold.victim);
  const key = choiceId.slice(3);
  const gain = pend.holderChoice.gain;
  state.pending = null;
  hold.rounds++;
  const finish = (init) => { state.hold = null; state.initiative = init; finalizeRound(state, R, 14); return state.events; };
  if (key === 'tap') {
    emit(state, 'submission_win', { actor: H.id, target: V.id, tap: true, moveName: hold.moveName, voluntary: true });
    decide(state, H.side, 'submission', { finishMove: hold.moveId, winnerId: H.id, finishCat: hold.finisher ? 'finisher' : 'submission' });
    if (!state.result) { finalizeRound(state, R, 8); }
    else finalizeRound(state, R, 8);
    return state.events;
  }
  const cost = { power_out: 6, reverse_hold: 5, slip_out: 3, crawl_ropes: 3, fight_on: 5, fan_up: 0, endure: 0 }[key] ?? 3;
  addStamina(V, -cost);
  // pressure lands
  let g = gain;
  if (key === 'endure') g *= 0.6;
  const escape = key === 'endure' ? 0.05 : holdEscapeChance(state, hold, key);
  if (R.next() < escape) {
    if (key === 'crawl_ropes') {
      hold.ropeProg += 1;
      if (hold.ropeProg >= 2 && state.rules.ropeBreaks) {
        V.stats.ropeBreaks++;
        emit(state, 'rope_break', { actor: V.id, target: H.id });
        state.hold = null; state.initiative = V.id; addMom(V, 4); addHeat(state, 6);
        finalizeRound(state, R, 12); return state.events;
      }
      emit(state, 'crawl_progress', { actor: V.id, progress: hold.ropeProg });
    } else if (key === 'reverse_hold') {
      V.stats.reversalsMade++; V.stats.submissionEscapes++;
      const real = hurt(state, H, hold.tgt === 'head' ? 'arms' : hold.tgt, 9 + V.attrs.technical / 12, 'hold_reversal');
      addMom(V, 12); addMom(H, -8);
      emit(state, 'hold_reversed', { actor: V.id, target: H.id, damage: Math.round(real), moveName: hold.moveName });
      return finish(V.id);
    } else {
      V.stats.submissionEscapes++;
      addMom(V, 6); addHeat(state, 5);
      emit(state, 'submission_escape', { actor: V.id, target: H.id, how: key, moveName: hold.moveName });
      return finish(V.id);
    }
  }
  // a failed crawl still inches toward the ropes
  if (key === 'crawl_ropes' && state.rules.ropeBreaks) {
    hold.ropeProg += 0.4;
    if (hold.ropeProg >= 2) {
      V.stats.ropeBreaks++;
      emit(state, 'rope_break', { actor: V.id, target: H.id });
      state.hold = null; state.initiative = V.id; addMom(V, 4); addHeat(state, 6);
      finalizeRound(state, R, 12); return state.events;
    }
  }
  // not escaped: damage and possible tap
  hold.sev = Math.min(130, hold.sev + g);
  hurt(state, V, hold.tgt, 3 + g / 3, 'hold');
  addStamina(V, -hold.drain);
  H.stats.damageDealt += 3 + g / 3;
  addHeat(state, 2);
  emit(state, 'hold_pressure', { actor: H.id, target: V.id, severity: Math.round(hold.sev), part: hold.tgt });
  if (R.next() < submitChance(state, hold)) {
    emit(state, 'submission_win', { actor: H.id, target: V.id, tap: true, moveName: hold.moveName });
    state.hold = null;
    decide(state, H.side, 'submission', { finishMove: hold.moveId, winnerId: H.id, finishCat: hold.finisher ? 'finisher' : 'submission' });
    finalizeRound(state, R, 14);
    return state.events;
  }
  if (H.stamina <= 1) { emit(state, 'hold_released', { actor: H.id, target: V.id, exhausted: true }); return finish(V.id); }
  state.pending = { kind: 'hold_h', actor: H.id };
  finalizeRound(state, R, 10);
  return state.events;
}

// ------------------------------------------------------------------------------------------
// Last Man Standing count
// ------------------------------------------------------------------------------------------
export function resolveRise(state, choiceId) {
  const pend = state.pending;
  if (!pend || pend.kind !== 'rise' || !state.count) throw new Error('no count pending');
  const R = rngOf(state);
  const D = F(state, state.count.id);
  const key = choiceId.slice(3);
  state.pending = null;
  let bonus = -0.06, cost = 5, adv = 3;
  if (key === 'dig') { bonus = 0.09; cost = 12; }
  else if (key === 'ropes') { bonus = 0.01; adv = 2; }
  else if (key === 'crowd') { bonus = crowdBias(state, D.id) * (state.crowd.heat / 100) * 0.2; cost = 3; }
  else if (key === 'rest') { bonus = -1; cost = -8; adv = 3; }
  addStamina(D, -cost);
  const p = clamp(0.42 + D.attrs.endurance / 400 + D.attrs.toughness / 500 - damageFraction(D) * 0.45 - (state.count.n / 10) * 0.12
    + bonus + (staminaFrac(D) - 0.5) * 0.15, 0.05, 0.92) * (state.rules.riseWeight ?? 1);
  if (key !== 'rest' && R.next() < p) {
    D.pos = 'standing'; state.count = null;
    addMom(D, 6); addHeat(state, 8);
    emit(state, 'rise', { actor: D.id, count: state.count ? state.count.n : undefined });
    state.initiative = R.chance(0.35) ? D.id : opponentOf(state, D.id);
  } else {
    state.count.n += adv;
    emit(state, 'ten_count', { actor: D.id, n: Math.min(10, state.count.n) });
    if (state.count.n >= 10) {
      emit(state, 'knockout', { actor: D.id });
      const opp = opponentOf(state, D.id);
      finishMatch(state, other(D.side), 'ten_count', { winnerId: opp, knockedOut: D.id });
    } else {
      state.pending = { kind: 'rise', actor: D.id };
    }
  }
  finalizeRound(state, R, 9);
  return state.events;
}

// ------------------------------------------------------------------------------------------
// apron (tag partner not legal)
// ------------------------------------------------------------------------------------------
export function resolveApron(state, actorId, choiceId) {
  const R = rngOf(state);
  const A = F(state, actorId);
  const partnerId = partnerOf(state, actorId);
  const partner = partnerId && F(state, partnerId);
  const key = choiceId.slice(3);
  const opp = F(state, legalOf(state, other(A.side)));
  state.apronDone = state.round;
  if (!state.tagReady) state.tagReady = { 0: false, 1: false };
  switch (key) {
    case 'encourage': if (partner) addConf(partner, 6); addHeat(state, 4); emit(state, 'apron', { actor: actorId, what: 'encourage' }); break;
    case 'ready': state.tagReady[A.side] = true; emit(state, 'apron', { actor: actorId, what: 'ready' }); break;
    case 'cheer': addHeat(state, 9); emit(state, 'apron', { actor: actorId, what: 'cheer' }); break;
    case 'rest': addStamina(A, 6); emit(state, 'apron', { actor: actorId, what: 'rest' }); break;
    case 'coach_aggro': if (partner) partner.tactics.pace = 'fast'; emit(state, 'apron', { actor: actorId, what: 'coach_aggro' }); break;
    case 'coach_safe': if (partner) { partner.tactics.pace = 'slow'; } emit(state, 'apron', { actor: actorId, what: 'coach_safe' }); break;
    case 'coach_tag': state.tagReady[A.side] = true; if (partner) partner.tactics.seekTag = true; emit(state, 'apron', { actor: actorId, what: 'coach_tag' }); break;
    case 'distract': {
      A.stats.illegalMoves++;
      const ok = R.next() < 0.5 + A.attrs.psychology / 250;
      if (ok && state.referee.state === 'watching') { state.referee.state = 'distracted'; state.referee.turns = 2; }
      emit(state, 'distract_ref', { actor: actorId, success: ok });
      if (!ok && R.next() < 0.35) {
        bump(state.warnings, actorId);
        emit(state, 'warning', { actor: actorId, moveName: 'Apron Interference', count: state.warnings[actorId] });
        if (state.warnings[actorId] >= 2) { emit(state, 'dq', { actor: actorId, reason: 'interference' }); decide(state, other(A.side), 'dq', { dqBy: actorId }); }
      }
      break;
    }
    case 'cheap': {
      A.stats.illegalMoves++;
      const seenP = state.referee.state === 'watching' ? 0.7 : state.referee.state === 'distracted' ? 0.1 : 0;
      if (R.next() < seenP) {
        emit(state, 'dq', { actor: actorId, reason: 'interference', moveName: 'Cheap Shot' });
        decide(state, other(A.side), 'dq', { dqBy: actorId });
      } else {
        const real = hurt(state, opp, 'head', 7, 'interference'); addMom(A, 2); addHeat(state, 5);
        emit(state, 'interference', { actor: actorId, target: opp.id, damage: Math.round(real) });
      }
      break;
    }
    case 'break_pin': {
      const pin = state.pin;
      if (!pin) break;
      const p = clamp(0.68 + (A.attrs.agility - 50) / 300, 0.4, 0.92) * 0.7 ** (A.saves || 0);
      if (R.next() < p) {
        A.saves = (A.saves || 0) + 1;
        const pinner = F(state, pin.pinner);
        emit(state, 'pin_save', { actor: actorId, target: pin.pinner, saved: pin.pinned });
        hurt(state, pinner, 'torso', 4, 'save');
        state.pin = null; state.pending = null; state.initiative = pin.pinned; addHeat(state, 8);
        finalizeRound(state, R, 6);
        return state.events;
      }
      emit(state, 'save_failed', { actor: actorId });
      break;
    }
    default: throw new Error(`unknown apron option ${key}`);
  }
  state.pending = null;
  return state.events;
}

export { addMom, addConf, addHeat, addStamina };
