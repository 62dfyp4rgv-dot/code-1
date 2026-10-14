// Authoritative match state. Plain JSON-serialisable data (so a match can be saved mid-bout and
// resumed bit-for-bit). Nothing in here decides outcomes; resolve.js mutates it and emits events.
import { Rng } from '../core/rng.js';
import { clamp } from '../core/util.js';
import {
  COMMON_MOVES, STYLE_MOVES, STYLE_SIGNATURES, STYLE_FINISHERS, HARDCORE_MOVES, OVER_TOP_MOVES, registerMove, hasMove, getMove,
} from './moves.js';
import { getRuleset, other, OBJECTIVE, waysOf } from './rules.js';

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
    registerMove(spec); // always (re)register: ids can repeat across careers with different content
    sigs.push(spec.id);
  }
  const finSpec = profile.finisher || { id: `${profile.id}_fin`, name: profile.finisherName || getMove((STYLE_FINISHERS[style] || STYLE_FINISHERS.allrounder)[0]).name.replace('Finisher ', ''), tpl: (STYLE_FINISHERS[style] || STYLE_FINISHERS.allrounder)[0] };
  registerMove(finSpec);
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

const BASIC_HOLDS = ['armbar', 'ankle_lock', 'sleeper', 'hammerlock'];

export function createMatchState(cfg) {
  const rules = { ...getRuleset(cfg.type || 'singles') };
  if (cfg.timeLimit) rules.timeLimit = cfg.timeLimit;
  if (cfg.rulesOverride) Object.assign(rules, cfg.rulesOverride);
  const rng = new Rng(cfg.seed ?? 1);
  const fighters = {};
  const teams = cfg.sides.map(() => []);
  cfg.sides.forEach((team, side) => {
    team.forEach((profile, idx) => {
      const f = createFighter(profile, side, { isPlayer: profile.id === cfg.playerId, difficulty: cfg.difficulty });
      // submission-only rules: everyone has learned the basic holds, whatever their usual style
      if (!rules.pinfall) for (const id of BASIC_HOLDS) if (!f.moveIds.includes(id)) f.moveIds.push(id);
      // rule-granted moves: table/chair work in hardcore matches, the over-the-top toss in battle royals
      if (rules.hardcore) for (const id of HARDCORE_MOVES) if (!f.moveIds.includes(id)) f.moveIds.push(id);
      if (rules.overTheTop) for (const id of OVER_TOP_MOVES) if (!f.moveIds.includes(id)) f.moveIds.push(id);
      f.legal = idx === 0;
      f.pos = idx === 0 ? 'standing' : 'apron';
      // Elimination Chamber: only the first few start in the ring; the others wait in pods and enter on a timer
      if (rules.entries && side >= rules.entries.start) { f.legal = false; f.pos = 'pod'; }
      fighters[f.id] = f;
      teams[side].push(f.id);
    });
  });
  const ids = Object.keys(fighters);
  if (new Set(ids).size !== teams.reduce((a, t) => a + t.length, 0)) throw new Error('duplicate wrestler ids in match');
  if (teams.length !== waysOf(rules)) throw new Error(`${rules.name} needs ${waysOf(rules)} sides, got ${teams.length}`);
  if (rules.teamSizes) {
    // uneven sides (handicap): one size per side, in seat order
    if (rules.teamSizes.length !== teams.length || teams.some((t, i) => t.length !== rules.teamSizes[i])) {
      throw new Error(`${rules.name} requires ${rules.teamSizes.join(' vs ')} wrestlers per side`);
    }
    // the outnumbered side gets the ruleset's `loneBonus` (faster stamina recovery, tougher to hurt)
    const biggest = Math.max(...teams.map((t) => t.length));
    if (rules.loneBonus) teams.forEach((t) => { if (t.length === 1 && biggest > 1) fighters[t[0]].bonus = { ...rules.loneBonus }; });
  } else if (rules.teamSize && teams.some((t) => t.length !== rules.teamSize)) {
    throw new Error(`${rules.name} requires ${rules.teamSize} per side`);
  }
  const firstLegal = teams.map((t) => t[0]).filter((id) => fighters[id].legal);
  // slight edge to the higher-psychology wrestler for opening initiative (lock-up), decided by seeded roll
  const lead = (id) => fighters[id].attrs.psychology + fighters[id].attrs.grappling;
  const initiative = firstLegal.length === 2
    ? (rng.chance(0.5 + (lead(firstLegal[0]) - lead(firstLegal[1])) / 600) ? firstLegal[0] : firstLegal[1])
    : [...firstLegal].map((id) => ({ id, s: lead(id) + rng.range(0, 60) })).sort((a, b) => b.s - a.s)[0].id; // multi-way: highest lock-up score with a seeded wobble
  const tl = Math.round((rules.timeLimit || 15) * 60);
  const state = {
    v: 1, id: cfg.id || `m_${(cfg.seed ?? 1).toString(36)}`, seed: cfg.seed ?? 1, rng: rng.state, aiRng: new Rng(`${cfg.seed ?? 1}:ai`).state,
    type: rules.id, rules, fighters, teams, playerId: cfg.playerId || null, context: cfg.context || {},
    time: 0, timeLimit: tl, round: 0, phase: 'opening', initiative,
    pending: null, hold: null, pin: null, count: null,
    crowd: { heat: clamp(cfg.context?.crowdBase ?? 30, 0, 100) },
    referee: { state: 'watching', turns: 0 },
    warnings: {}, outsideTicks: {}, events: [], seq: 0, result: null, log: [],
    falls: Object.fromEntries(teams.map((_, i) => [i, 0])), fallLog: [], focus: {}, eliminated: [], nextEntry: rules.entries ? rules.entries.start : null, objective: rules.objective ? { steps: OBJECTIVE[rules.objective].steps } : null,
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
export const liveFoes = (state, id) => state.teams.flatMap((t, i) => (i === state.fighters[id].side ? [] : [t.find((x) => state.fighters[x].legal)])).filter(Boolean);
/** The wrestler `id` is currently working against. In multi-way matches this is the "focus" target, chosen by the player or
 *  (by default) the most damaged foe; being attacked turns your attention to the attacker (see beginAttack). */
export const opponentOf = (state, id) => {
  if (waysOf(state.rules) <= 2) return legalOf(state, other(state.fighters[id].side));
  const foes = liveFoes(state, id);
  const cur = state.focus && state.focus[id];
  if (cur && foes.includes(cur)) return cur;
  // ladder matches: with no explicit target, whoever is highest on the ladder is the one to stop
  if (state.rules.objective) {
    const climbing = foes.filter((x) => state.fighters[x].pos === 'top' && state.fighters[x].climb > 0)
      .sort((a, b) => state.fighters[b].climb - state.fighters[a].climb || (a < b ? -1 : 1));
    if (climbing.length) return climbing[0];
  }
  // most damaged foe; ties go to the next seat around the ring so no seat is a default punching bag
  const me = state.fighters[id].side, n = waysOf(state.rules);
  const seat = (x) => (state.fighters[x].side - me + n) % n;
  return [...foes].sort((a, b) => damageFraction(state.fighters[b]) - damageFraction(state.fighters[a]) || seat(a) - seat(b))[0];
};
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
