// Authoritative match state. Plain JSON-serialisable data (so a match can be saved mid-bout and
// resumed bit-for-bit). Nothing in here decides outcomes; resolve.js mutates it and emits events.
import { Rng } from '../core/rng.js';
import { clamp } from '../core/util.js';
import {
  COMMON_MOVES, STYLE_MOVES, STYLE_SIGNATURES, STYLE_FINISHERS, registerMove, hasMove, getMove,
} from './moves.js';
import { getRuleset, other, OBJECTIVE } from './rules.js';

export const ATTR_KEYS = ['power', 'striking', 'grappling', 'technical', 'agility', 'endurance', 'toughness', 'psychology'];

export function defaultAttrs(base = 50) {
  return Object.fromEntries(ATTR_KEYS.map((k) => [k, base]));
}

/** Resolve a wrestler profile into a move list (ids). Profiles may specify their own set. */
export function buildMoveset(profile) {
  const style = profile.style || 'allrounder';
  const ids = new Set(COMMON_MOVES);
  for (const id of STYLE_MOVES[style] || STYLE_MOVES.allrounder) ids.add(id);
  for (const id of profile.extraMoves || []) ids.add(id);
  const sigs = [];
  const sigSpecs = profile.signatures && profile.signatures.length ? profile.signatures
    : (STYLE_SIGNATURES[style] || STYLE_SIGNATURES.allrounder).slice(0, 2).map((tpl, i) => ({ id: `${profile.id}_sig${i + 1}`, name: signatureName(profile, tpl, i), tpl }));
  for (const spec of sigSpecs) {
    if (!hasMove(spec.id)) registerMove(spec);
    sigs.push(spec.id);
  }
  const finSpec = profile.finisher || { id: `${profile.id}_fin`, name: profile.finisherName || 'Finisher', tpl: (STYLE_FINISHERS[style] || STYLE_FINISHERS.allrounder)[0] };
  if (!hasMove(finSpec.id)) registerMove(finSpec);
  return { moves: [...ids].filter((id) => hasMove(id)), signatures: sigs, finisher: finSpec.id, customSpecs: [...sigSpecs, finSpec] };
}

function signatureName(profile, tpl, i) {
  const base = getMove(tpl).name.replace('Signature ', '');
  return `${profile.name.split(' ').slice(-1)[0]}'s ${base}`;
}

export function createFighter(profile, side, opts = {}) {
  const set = buildMoveset(profile);
  const attrs = { ...defaultAttrs(50), ...profile.attrs };
  const maxStamina = Math.round(70 + attrs.endurance * 0.6);
  const fatigue = clamp(profile.fatigue || 0, 0, 100);
  const dmg = { head: 0, torso: 0, arms: 0, legs: 0 };
  for (const inj of profile.injuries || []) {
    if (dmg[inj.part] !== undefined) dmg[inj.part] = Math.min(60, dmg[inj.part] + 18 * (inj.severity || 1));
  }
  return {
    id: profile.id, name: profile.name, side, alignment: profile.alignment || 'tweener', style: profile.style || 'allrounder',
    gender: profile.gender || 'M', popularity: profile.popularity ?? 50,
    attrs, moveIds: set.moves, signatureIds: set.signatures, finisherId: set.finisher, customSpecs: set.customSpecs,
    maxStamina, stamina: Math.round(maxStamina * (1 - fatigue / 250)),
    dmg, momentum: 20, confidence: clamp(40 + (profile.confidence ?? 50) * 0.2 + (profile.popularity ?? 50) * 0.1, 20, 80),
    pos: 'standing', legal: true, dazed: 0, downCount: 0,
    tactics: { pace: 'normal', target: null, lastTactic: -99, studyUntil: -1, studyCat: null, bait: false, finisherSetup: false, guard: null },
    seen: {}, reads: {}, usedMoves: {}, habits: {}, injuriesNew: [], injured: {},
    isPlayer: !!opts.isPlayer, difficulty: opts.difficulty ?? profile.difficulty ?? 0.5,
    ai: { aggression: profile.personality?.aggression ?? 50, awareness: profile.awareness ?? attrs.psychology },
    stats: blankStats(), climb: 0, falls: 0, apronSignal: null,
  };
}

export function blankStats() {
  return {
    attempted: 0, connected: 0, blocked: 0, dodged: 0, reversed: 0, countered: 0, reversalsMade: 0,
    damageDealt: 0, damageTaken: 0, finishersHit: 0, finishersAttempted: 0, finishersReversed: 0, finishersKickedOut: 0,
    signaturesHit: 0, signaturesAttempted: 0, pinsAttempted: 0, nearFalls: 0, kickouts: 0, submissionsApplied: 0, submissionEscapes: 0,
    ropeBreaks: 0, illegalMoves: 0, taunts: 0, tags: 0, staminaSpent: 0, highRiskAttempted: 0, highRiskLanded: 0,
    comebacks: 0, usedFinisher: false, categories: {}, distinctMoves: 0, eliminations: 0, knockdowns: 0,
  };
}

export function createMatchState(cfg) {
  const rules = { ...getRuleset(cfg.type || 'singles') };
  if (cfg.timeLimit) rules.timeLimit = cfg.timeLimit;
  if (cfg.rulesOverride) Object.assign(rules, cfg.rulesOverride);
  const rng = new Rng(cfg.seed ?? 1);
  const fighters = {};
  const teams = [[], []];
  cfg.sides.forEach((team, side) => {
    team.forEach((profile, idx) => {
      const f = createFighter(profile, side, { isPlayer: profile.id === cfg.playerId, difficulty: cfg.difficulty });
      f.legal = idx === 0;
      f.pos = idx === 0 ? 'standing' : 'apron';
      fighters[f.id] = f;
      teams[side].push(f.id);
    });
  });
  const ids = Object.keys(fighters);
  if (new Set(ids).size !== teams[0].length + teams[1].length) throw new Error('duplicate wrestler ids in match');
  if (rules.teamSize && (teams[0].length !== rules.teamSize || teams[1].length !== rules.teamSize)) {
    throw new Error(`${rules.name} requires ${rules.teamSize} per side`);
  }
  const firstLegal = teams.map((t) => t[0]);
  // slight edge to the higher-psychology wrestler for opening initiative (lock-up), decided by seeded roll
  const pA = fighters[firstLegal[0]].attrs.psychology + fighters[firstLegal[0]].attrs.grappling;
  const pB = fighters[firstLegal[1]].attrs.psychology + fighters[firstLegal[1]].attrs.grappling;
  const initiative = rng.chance(0.5 + (pA - pB) / 600) ? firstLegal[0] : firstLegal[1];
  const tl = Math.round((rules.timeLimit || 15) * 60);
  const state = {
    v: 1, id: cfg.id || `m_${(cfg.seed ?? 1).toString(36)}`, seed: cfg.seed ?? 1, rng: rng.state, aiRng: new Rng(`${cfg.seed ?? 1}:ai`).state,
    type: rules.id, rules, fighters, teams, playerId: cfg.playerId || null, context: cfg.context || {},
    time: 0, timeLimit: tl, round: 0, phase: 'opening', initiative,
    pending: null, hold: null, pin: null, count: null,
    crowd: { heat: clamp(cfg.context?.crowdBase ?? 30, 0, 100) },
    referee: { state: 'watching', turns: 0 },
    warnings: {}, outsideTicks: {}, events: [], seq: 0, result: null, log: [],
    falls: { 0: 0, 1: 0 }, fallLog: [], objective: rules.objective ? { steps: OBJECTIVE[rules.objective].steps } : null,
    lastAction: null, history: [], difficulty: cfg.difficulty ?? 0.5,
  };
  return state;
}

// ---- accessors
export const F = (state, id) => state.fighters[id];
export const sideOf = (state, id) => state.fighters[id].side;
export const opposingTeam = (state, id) => state.teams[other(state.fighters[id].side)];
export const partnerOf = (state, id) => state.teams[state.fighters[id].side].find((x) => x !== id) || null;
export const legalOf = (state, side) => state.teams[side].find((id) => state.fighters[id].legal) || null;
export const opponentOf = (state, id) => legalOf(state, other(state.fighters[id].side));
export const totalDamage = (f) => f.dmg.head + f.dmg.torso + f.dmg.arms + f.dmg.legs;
export const damageFraction = (f) => clamp((f.dmg.head * 1.3 + f.dmg.torso * 1.2 + f.dmg.arms * 0.7 + f.dmg.legs * 0.8) / (4 * 100), 0, 1);
export const staminaFrac = (f) => clamp(f.stamina / f.maxStamina, 0, 1);

export function phaseOf(state) {
  const frac = state.time / state.timeLimit;
  const hot = Object.values(state.fighters).some((f) => damageFraction(f) > 0.5 || f.momentum >= 80);
  if (frac < 0.22 && !hot) return 'opening';
  if (frac > 0.72 || hot) return 'closing';
  return 'middle';
}

/** crowd bias toward a fighter in [-1, 1]: faces are cheered, heels booed; underdogs gain sympathy */
export function crowdBias(state, id) {
  const f = state.fighters[id];
  let b = f.alignment === 'face' ? 0.55 : f.alignment === 'heel' ? -0.55 : 0.05;
  const opp = state.fighters[opponentOf(state, id)];
  if (opp) {
    b += (f.popularity - opp.popularity) / 250;
    if (opp.alignment === 'heel' && f.alignment !== 'heel') b += 0.15;
    if (damageFraction(f) > damageFraction(opp) + 0.15) b += 0.1; // sympathy
  }
  return clamp(b, -1, 1);
}
