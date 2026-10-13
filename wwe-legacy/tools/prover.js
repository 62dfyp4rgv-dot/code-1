// Achievement prover: builds, for each achievement, a *legal* event sequence that should satisfy
// its requirement and checks the real engine unlocks it. Proves no achievement (secret ones
// included) depends on an impossible state, and that unlocks are computed from ledger data.
import { Career } from '../src/career/career.js';
import { ACHIEVEMENT_DEFS } from '../src/achievements/defs.js';
import { EVENT_TYPES } from '../src/career/eventTypes.js';
import { watchTypes } from '../src/achievements/engine.js';

const DEFAULTS = {
  match_result: () => ({ matchType: 'singles', show: 'Raw', ppv: null, ppvTier: 0, mainEvent: false, opponents: ['opp1'], partners: [], result: 'win', winner: 'player', finish: 'pinfall', finishMove: null, durationSec: 600, rating: 3, titleOnLine: false, titleChange: false, clean: true, interference: false, dominant: false, upset: false, comeback: false, vsRival: false, finisherUsed: false, finishMoveIsFinisher: false, reversalsMade: 0, finisherReversalsMade: 0, damageTaken: 80, staminaLeft: 40, nearFallsSurvived: 0, winStreak: 1, winStreakBefore: 0, trustedPartner: false, stats: {} }),
  title_win: () => ({ titleId: 't1', titleName: 'Title', titleClass: 'world', era: 'current', wmWin: false }),
  title_defense: () => ({ titleId: 't1', success: true, defenseNumber: 1, ppvTier: 0 }),
  title_loss: () => ({ titleId: 't1' }),
  rumble_result: () => ({ year: 2025, won: false, eliminations: 0, survivalSec: 600, entryNumber: 10, finalTwo: false }),
  promo_delivered: () => ({ tone: 'challenge', targets: ['opp1'], quality: 50, viral: false }),
  interview: () => ({ quality: 50, viral: false }), podcast: () => ({ quality: 50, viral: false }), press_conference: () => ({ controversy: false, handled: false }),
  social_post: () => ({ viral: false }), milestone: () => ({ kind: 'x', value: 1 }),
};

function setPath(spec, path, value) {
  const parts = path.split('.');
  let cur = spec;
  for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]] ||= {};
  cur[parts[parts.length - 1]] = value;
}
function pickValue(cond) {
  if (cond === null || typeof cond !== 'object') return cond;
  if (Array.isArray(cond)) return cond[0];
  let v;
  for (const [op, x] of Object.entries(cond)) {
    if (op === 'gte' || op === 'lte') v = x;
    else if (op === 'gt') v = x + 1; else if (op === 'lt') v = x - 1;
    else if (op === 'in') v = x[0]; else if (op === 'ne') v = '__other__';
    else if (op === 'exists') v = x ? 'x' : undefined;
  }
  return v;
}

let uid = 0;
function makeEvent(type, where = {}, overrides = {}) {
  const info = EVENT_TYPES[type];
  if (!info) throw new Error(`event type ${type} is not in the registry`);
  const spec = { key: `prove:${++uid}`, category: info.category, type, summary: `proof ${type}`, importance: 3, participants: ['player'], data: DEFAULTS[type] ? DEFAULTS[type]() : {} };
  for (const [path, cond] of Object.entries(where || {})) { const v = pickValue(cond); if (v !== undefined) setPath(spec, path, v); }
  for (const [path, v] of Object.entries(overrides)) setPath(spec, path, v);
  if (type === 'match_result' && spec.data.opponents) spec.participants = ['player', ...spec.data.opponents];
  return spec;
}

/** requirement -> list of event specs */
function synth(req) {
  if (req.all) return req.all.flatMap(synth);
  if (req.any) return synth(req.any[0]);
  if (req.count) return Array.from({ length: req.gte ?? 1 }, () => makeEvent(req.count.type, req.count.where));
  if (req.sum) return [makeEvent(req.sum.type, req.sum.where, { [req.sum.field]: req.gte })];
  if (req.max) return [makeEvent(req.max.type, req.max.where, { [req.max.field]: req.gte })];
  if (req.distinct) return Array.from({ length: req.gte }, (_, i) => makeEvent(req.distinct.type, req.distinct.where, { [req.distinct.field]: `v${i}` }));
  if (req.streak) return Array.from({ length: req.gte }, () => makeEvent(req.streak.type, req.streak.where));
  if (req.stat) {
    switch (req.stat) {
      case 'titles.maxSimultaneous': return Array.from({ length: req.gte }, (_, i) => makeEvent('title_win', {}, { 'data.titleId': `t${i}` }));
      case 'rumble.bestConsecutiveWins': return Array.from({ length: req.gte }, (_, i) => makeEvent('rumble_result', { 'data.won': true }, { 'data.year': 2020 + i }));
      case 'viral': return Array.from({ length: req.gte }, () => makeEvent('social_post', { 'data.viral': true }));
      default: throw new Error(`prover has no recipe for stat ${req.stat}`);
    }
  }
  if (req.custom) return CUSTOM_SCRIPTS[req.custom](req.args || {});
  throw new Error('unsupported requirement');
}

const m = (o = {}) => makeEvent('match_result', {}, o);
const CUSTOM_SCRIPTS = {
  title_after_slump: ({ window = 10, lossesIn = 7 }) => [...Array.from({ length: window }, (_, i) => m({ 'data.result': i < lossesIn ? 'loss' : 'win', 'data.winner': 'opp1' })), makeEvent('title_win')],
  comeback_after_slump: ({ lose = 3, win = 3 }) => [...Array.from({ length: lose }, () => m({ 'data.result': 'loss' })), ...Array.from({ length: win }, () => m())],
  undefeated_year: ({ n = 10 }) => Array.from({ length: n }, () => m()),
  clean_rivalry: ({ matches = 3 }) => Array.from({ length: matches }, () => m()),
  avenged_betrayal: () => [makeEvent('betrayal', {}, { participants: ['opp1', 'player'], 'data.context': 'tag_partner' }), m()],
  main_event_no_title: () => [m({ 'data.mainEvent': true, 'data.ppvTier': 2 })],
  long_alliance: ({ days = 365 }) => [makeEvent('alliance_formed', {}, { participants: ['player', 'opp1'] }), { ...makeEvent('milestone', {}, { 'data.kind': 'x' }), dayOffset: days + 1 }],
  reign_length: ({ days = 365 }) => [makeEvent('title_win'), { ...makeEvent('title_loss'), dayOffset: days + 1 }],
  survived_war: ({ minutes = 20, damage = 220 }) => [m({ 'data.durationSec': minutes * 60, 'data.damageTaken': damage })],
  rival_sweep: ({ n = 3 }) => Array.from({ length: n }, () => m({ 'data.vsRival': true })),
  win_rate: ({ min = 50 }) => Array.from({ length: min }, () => m()),
  era_grand_slam: ({ classes = 4 }) => ['world', 'secondary', 'tag', 'womens', 'developmental'].slice(0, classes).map((c) => makeEvent('title_win', {}, { 'data.titleClass': c, 'data.era': 'modern' })),
  year_wins: ({ n = 50 }) => Array.from({ length: n }, () => m()),
};

/** Try to unlock one definition from a fresh career. Returns { ok, reason } */
export function proveAchievement(def, opts = {}) {
  const c = new Career({ seed: 7, startYear: 2024, player: { id: 'player', name: 'Prover' }, era: opts.era || (def.eras ? def.eras[0] : 'current') });
  let specs;
  try { specs = synth(def.req); } catch (e) { return { ok: false, reason: `cannot synthesise: ${e.message}` }; }
  let t = 0;
  for (const s of specs) {
    const { dayOffset, ...spec } = s;
    t += 1;
    if (dayOffset) c.day += dayOffset; else c.day += 1;
    for (const ty of [spec.type]) if (!EVENT_TYPES[ty]) return { ok: false, reason: `event type ${ty} not registered` };
    c.record({ ...spec, key: `${spec.key}:${t}` });
  }
  if (c.achievements.unlocked[def.id]) {
    const u = c.achievements.unlocked[def.id];
    const evOk = u.evidence.length > 0 && u.evidence.every((id) => c.memory.ledger.get(id));
    return { ok: evOk, reason: evOk ? null : 'evidence missing', record: u };
  }
  return { ok: false, reason: `not unlocked after ${specs.length} events; progress ${JSON.stringify(c.achievements.progress[def.id] || null)}` };
}

export function proveAll(defs = ACHIEVEMENT_DEFS) {
  const failures = [];
  let ok = 0;
  for (const d of defs) {
    const r = proveAchievement(d);
    if (r.ok) ok++; else failures.push({ id: d.id, reason: r.reason });
  }
  return { total: defs.length, ok, failures };
}

export function missingEmitters(defs = ACHIEVEMENT_DEFS) {
  const missing = [];
  for (const d of defs) for (const t of watchTypes(d.req)) if (!EVENT_TYPES[t]) missing.push({ id: d.id, type: t });
  return missing;
}

if (process.argv[1] && process.argv[1].endsWith('prover.js')) {
  const r = proveAll();
  console.log(`achievements provable: ${r.ok}/${r.total}`);
  for (const f of r.failures) console.log(' FAIL', f.id, f.reason);
}
