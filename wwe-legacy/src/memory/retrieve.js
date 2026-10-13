// Memory retrieval: before generating any storyline, interview or encounter, pull the few
// events that matter. Scores relevance (participants, rivalry, storyline, importance,
// unresolved promises/conflicts, recency) so long careers never need the whole ledger in context.
import { getRel, getRivalry, openPromises, brokenPromises } from './world.js';

const TYPE_WEIGHT = {
  betrayal: 5, promise_made: 3, promo_delivered: 2, match_result: 2, title_win: 4, title_loss: 3, rumble_result: 3, injury: 2,
  alliance_formed: 3, reconciliation: 3, faction_formed: 3, podcast: 2, press_conference: 2, interview: 2, viral: 3,
};

/**
 * recall(memory, query) -> ranked events with a score breakdown.
 * query: { participants:[], storyline, types:[], now, limit, minImportance, topics:[] }
 */
export function recall(memory, q = {}) {
  const { ledger, world } = memory;
  const now = q.now ?? (ledger.events.length ? ledger.events[ledger.events.length - 1].day : 0);
  const parts = q.participants || [];
  // candidate pool via indexes (never the whole ledger when we have participants)
  const pool = new Map();
  for (const p of parts) for (const ev of ledger.ofParticipant(p)) pool.set(ev.id, ev);
  if (q.storyline) for (const ev of ledger.byStoryline.get(q.storyline) || []) pool.set(ev.id, ev);
  for (const t of q.types || []) for (const ev of ledger.ofType(t)) pool.set(ev.id, ev);
  if (!parts.length && !q.storyline && !q.types) for (const ev of ledger.events.slice(-300)) pool.set(ev.id, ev);

  const openIds = new Set(openPromises(world).map((p) => p.madeEvent));
  const brokenIds = new Set(brokenPromises(world).map((p) => p.madeEvent));
  const rivalEvents = new Set();
  for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
    const rv = getRivalry(world, parts[i], parts[j]);
    if (rv) for (const id of rv.events) rivalEvents.add(id);
    for (const id of getRel(world, parts[i], parts[j]).events) rivalEvents.add(id);
  }
  const out = [];
  for (const ev of pool.values()) {
    if (q.minImportance && ev.importance < q.minImportance) continue;
    if (q.scope && ev.scope !== q.scope) continue;
    const overlap = parts.length ? parts.filter((p) => ev.participants.includes(p)).length : 0;
    const age = Math.max(0, now - ev.day);
    const score = {
      participants: overlap * 3,
      storyline: q.storyline && ev.storyline === q.storyline ? 2 : 0,
      importance: ev.importance * 1.2,
      type: TYPE_WEIGHT[ev.type] || 0,
      unresolved: openIds.has(ev.id) ? 3 : brokenIds.has(ev.id) ? 4 : 0,
      relationship: rivalEvents.has(ev.id) ? 2 : 0,
      recency: 3 * Math.exp(-age / 365),
      topic: (q.topics || []).some((t) => ev.summary.toLowerCase().includes(String(t).toLowerCase())) ? 2 : 0,
    };
    const total = Object.values(score).reduce((a, b) => a + b, 0);
    out.push({ event: ev, score: total, breakdown: score });
  }
  out.sort((a, b) => b.score - a.score || b.event.day - a.event.day);
  return out.slice(0, q.limit ?? 8);
}

/** Facts about the relationship between two people, always derived from the ledger-backed world. */
export function relationshipFacts(memory, a, b) {
  const { world, ledger } = memory;
  const rel = getRel(world, a, b);
  const rv = getRivalry(world, a, b);
  const facts = [];
  if (rel.betrayals.length) for (const bt of rel.betrayals) facts.push({ kind: 'betrayal', by: bt.by, against: bt.against, event: bt.event, day: bt.day });
  if (rv) facts.push({ kind: 'rivalry', heat: rv.heat, status: rv.status, matches: rv.matches, wins: rv.wins, events: rv.events.slice(-5) });
  for (const t of rel.tags) facts.push({ kind: 'tag', tag: t });
  const h2h = ledger.query({ types: ['match_result'], allParticipants: [a, b] });
  facts.push({ kind: 'h2h', matches: h2h.length, eventIds: h2h.map((e) => e.id) });
  return facts;
}
