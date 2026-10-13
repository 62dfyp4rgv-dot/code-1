// Layer B: the current world state derived from the ledger by explicit consequence rules.
// Relationships, rivalries, promises and obligations live here. Every mutation is tied to an
// event id and applied at most once (world.applied), so reloads and retries are idempotent.
import { clamp } from '../core/util.js';

export const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export function newWorld() {
  return { relationships: {}, rivalries: {}, promises: [], obligations: [], factions: {}, applied: {}, flags: {}, counters: {} };
}

/** A relationship from the perspective of `from` toward `to` (directional values, shared tags). */
function blankRel(a, b) {
  const [x, y] = a < b ? [a, b] : [b, a];
  return {
      a: x, b: y,
      // directional: [x->y, y->x]
      trust: [0, 0], respect: [0, 0], fear: [0, 0], heat: 0, affinity: 0,
      tags: [], betrayals: [], betrayalCeiling: null, events: [], lastDay: 0,
  };
}

/** Read a relationship. Never inserts: merely looking at someone must not change the world. */
export function getRel(world, a, b) {
  return world.relationships[pairKey(a, b)] || blankRel(a, b);
}
/** Get-or-create for mutations. */
export function ensureRel(world, a, b) {
  const k = pairKey(a, b);
  if (!world.relationships[k]) world.relationships[k] = blankRel(a, b);
  return world.relationships[k];
}

const idx = (rel, from) => (rel.a === from ? 0 : 1);

export function adjustRel(world, from, to, delta, eventId, day = 0) {
  const rel = ensureRel(world, from, to);
  const i = idx(rel, from);
  if (delta.trust) rel.trust[i] = clamp(rel.trust[i] + delta.trust, -100, 100);
  if (delta.respect) rel.respect[i] = clamp(rel.respect[i] + delta.respect, -100, 100);
  if (delta.fear) rel.fear[i] = clamp(rel.fear[i] + delta.fear, 0, 100);
  if (delta.heat) rel.heat = clamp(rel.heat + delta.heat, 0, 100);
  if (delta.affinity) rel.affinity = clamp(rel.affinity + delta.affinity, -100, 100);
  // betrayal ceiling: trust toward the betrayer can never exceed the ceiling until reconciliation
  const ceil = rel.betrayalCeiling ? rel.betrayalCeiling[i] : null;
  if (ceil != null && rel.trust[i] > ceil) rel.trust[i] = ceil;
  if (eventId && !rel.events.includes(eventId)) { rel.events.push(eventId); if (rel.events.length > 200) rel.events.shift(); }
  rel.lastDay = Math.max(rel.lastDay, day);
  return rel;
}

export function addTag(world, a, b, tag, eventId) {
  const rel = ensureRel(world, a, b);
  if (!rel.tags.includes(tag)) rel.tags.push(tag);
  if (eventId && !rel.events.includes(eventId)) rel.events.push(eventId);
  return rel;
}
export const hasTag = (world, a, b, tag) => getRel(world, a, b).tags.includes(tag);
export function removeTag(world, a, b, tag) {
  const rel = ensureRel(world, a, b);
  rel.tags = rel.tags.filter((t) => t !== tag);
}

/** `victim` records a betrayal by `betrayer`: permanent memory, trust ceiling, revenge motive. */
export function recordBetrayal(world, betrayer, victim, eventId, day) {
  const rel = ensureRel(world, betrayer, victim);
  rel.betrayals.push({ by: betrayer, against: victim, event: eventId, day });
  const iVictim = idx(rel, victim);
  rel.betrayalCeiling = rel.betrayalCeiling || [100, 100];
  rel.betrayalCeiling[iVictim] = -20; // victim can never trust the betrayer again beyond -20 until reconciled
  rel.trust[iVictim] = Math.min(rel.trust[iVictim], -60);
  rel.heat = clamp(rel.heat + 40, 0, 100);
  if (!rel.tags.includes('betrayal')) rel.tags.push('betrayal');
  if (eventId && !rel.events.includes(eventId)) rel.events.push(eventId);
}

export function reconcile(world, a, b, eventId) {
  const rel = ensureRel(world, a, b);
  rel.betrayalCeiling = null;
  rel.tags = rel.tags.filter((t) => t !== 'betrayal').concat(rel.tags.includes('reconciled') ? [] : ['reconciled']);
  rel.heat = Math.max(0, rel.heat - 30);
  rel.trust = rel.trust.map((t) => Math.max(t, -10));
  if (eventId) rel.events.push(eventId);
}

export function betrayalsBetween(world, a, b) { return getRel(world, a, b).betrayals; }

// ---- rivalries
export function rivalryId(a, b) { return `rv:${pairKey(a, b)}`; }
export function getRivalry(world, a, b) { return world.rivalries[rivalryId(a, b)] || null; }
export function bumpRivalry(world, a, b, { heat = 0, eventId, day = 0, origin = null }) {
  const id = rivalryId(a, b);
  let r = world.rivalries[id];
  if (!r) {
    r = world.rivalries[id] = { id, a: a < b ? a : b, b: a < b ? b : a, heat: 0, status: 'active', startDay: day, origin: origin || eventId, matches: 0, wins: { [a]: 0, [b]: 0 }, lastDay: day, events: [] };
  }
  r.heat = clamp(r.heat + heat, 0, 100);
  if (r.status === 'cooled' && heat > 0) r.status = 'active';
  r.lastDay = Math.max(r.lastDay, day);
  if (eventId && !r.events.includes(eventId)) r.events.push(eventId);
  return r;
}

// ---- promises (public claims that can later be judged)
export function addPromise(world, p) {
  if (world.promises.some((x) => x.id === p.id)) return;
  // the same public claim made twice is still one promise (one win must not be paid out twice)
  const same = (x) => x.status === 'open' && x.by === p.by && x.kind === p.kind && (x.target || null) === (p.target || null) && JSON.stringify(x.params || {}) === JSON.stringify(p.params || {});
  if (world.promises.some(same)) return;
  world.promises.push({ status: 'open', ...p });
}
/** is an equivalent public promise already open? (the same claim made twice is one promise) */
export function hasOpenPromise(world, p) {
  return world.promises.some((x) => x.status === 'open' && x.by === p.by && x.kind === p.kind && (x.target || null) === (p.target || null) && JSON.stringify(x.params || {}) === JSON.stringify(p.params || {}));
}
export function openPromises(world, who) { return world.promises.filter((p) => p.status === 'open' && (!who || p.by === who)); }
export function brokenPromises(world, who) { return world.promises.filter((p) => p.status === 'broken' && (!who || p.by === who)); }

// ---- obligations: consequences that must surface in the future (a rival confronts you, etc.)
export function addObligation(world, o) {
  if (world.obligations.some((x) => x.id === o.id)) return;
  world.obligations.push({ status: 'pending', ...o });
}
export function dueObligations(world, day) { return world.obligations.filter((o) => o.status === 'pending' && o.dueDay <= day); }

// ---- slow decay for non-grudge feelings (called weekly); betrayal memory never decays
export function decayWorld(world, days = 7) {
  for (const rel of Object.values(world.relationships)) {
    rel.heat = Math.max(rel.betrayals.length ? 15 : 0, rel.heat - 0.4 * days / 7);
    for (let i = 0; i < 2; i++) {
      if (!rel.tags.includes('betrayal')) rel.trust[i] *= 1 - 0.01 * days / 7;
      rel.fear[i] = Math.max(0, rel.fear[i] - 0.3 * days / 7);
    }
  }
  for (const r of Object.values(world.rivalries)) {
    if (r.status === 'active') {
      r.heat = Math.max(0, r.heat - 0.8 * days / 7);
      if (r.heat < 8 && r.matches >= 1) r.status = 'cooled';
    }
  }
}
