// Layer C: compressed narrative memory. Summaries are rebuilt from the ledger and every claim
// carries the ids of the events that justify it, so they can be audited (validateSummaries).
import { getRel, getRivalry, pairKey } from './world.js';

/** Head-to-head as OPPONENTS (a tag partner's matches are not meetings). `result` in a match_result is the player's team result,
 *  so the pair is oriented by whichever of a/b the event lists as the opponent. */
export function h2hCounts(ledger, a, b) {
  const evs = ledger.query({ types: ['match_result'], allParticipants: [a, b] });
  let matches = 0, winsA = 0, winsB = 0; const ids = [];
  for (const e of evs) {
    const opp = e.data.opponents || [];
    const aIsPlayer = opp.includes(b), bIsPlayer = opp.includes(a);
    if (!aIsPlayer && !bIsPlayer) continue;
    matches++; ids.push(e.id);
    if (e.data.result === 'win') (aIsPlayer ? winsA++ : winsB++);
    else if (e.data.result === 'loss') (aIsPlayer ? winsB++ : winsA++);
  }
  return { matches, winsA, winsB, ids };
}

export function buildPairSummary(memory, a, b, nameOf = (x) => x) {
  const { ledger, world } = memory;
  const facts = [];
  const h = h2hCounts(ledger, a, b);
  if (h.matches) {
    facts.push({ kind: 'h2h', a, b, matches: h.matches, winsA: h.winsA, winsB: h.winsB, eventIds: h.ids, text: `${nameOf(a)} and ${nameOf(b)} have met ${h.matches === 1 ? 'once' : `${h.matches} times`}: ${h.winsA}-${h.winsB}${h.matches > h.winsA + h.winsB ? ` (${h.matches - h.winsA - h.winsB} unresolved)` : ''}.` });
  }
  const rel = getRel(world, a, b);
  // one line per direction, however many times it happened; the evidence lists every event
  const byDir = new Map();
  for (const bt of rel.betrayals) { const k = `${bt.by}>${bt.against}`; if (!byDir.has(k)) byDir.set(k, []); byDir.get(k).push(bt); }
  for (const list of byDir.values()) {
    const bt = list[list.length - 1];
    facts.push({ kind: 'betrayal', by: bt.by, against: bt.against, eventIds: list.map((x) => x.event), text: list.length === 1 ? `${nameOf(bt.by)} betrayed ${nameOf(bt.against)} (${ledger.get(bt.event).date}).` : `${nameOf(bt.by)} has betrayed ${nameOf(bt.against)} ${list.length} times, most recently on ${ledger.get(bt.event).date}.` });
  }
  const rv = getRivalry(world, a, b);
  if (rv) facts.push({ kind: 'rivalry', status: rv.status, heat: Math.round(rv.heat), eventIds: rv.events.slice(-10), text: `Their rivalry is ${rv.status} (heat ${Math.round(rv.heat)}).` });
  const promo = ledger.query({ types: ['promo_delivered'], allParticipants: [a, b] }).filter((e) => ['insult', 'humiliate', 'threat'].includes(e.data.tone));
  if (promo.length) facts.push({ kind: 'verbal_attacks', count: promo.length, eventIds: promo.map((e) => e.id), text: `${promo.length} public verbal attack(s) between them.` });
  return { key: `pair:${pairKey(a, b)}`, a, b, facts, text: facts.map((f) => f.text).join(' '), builtAt: ledger.size };
}

/** Every claim must trace to real events, and numeric claims must still match the ledger. */
export function validateSummary(memory, sum) {
  const problems = [];
  const { ledger } = memory;
  for (const f of sum.facts) {
    if (!f.eventIds || !f.eventIds.length) problems.push(`${sum.key}: fact "${f.kind}" has no evidence`);
    for (const id of f.eventIds || []) if (!ledger.get(id)) problems.push(`${sum.key}: fact "${f.kind}" cites missing event ${id}`);
    if (f.kind === 'h2h') {
      const real = h2hCounts(ledger, f.a, f.b);
      if (real.matches !== f.matches) problems.push(`${sum.key}: h2h claims ${f.matches} matches, ledger has ${real.matches}`);
      if (real.winsA !== f.winsA || real.winsB !== f.winsB) problems.push(`${sum.key}: h2h claims ${f.winsA}-${f.winsB}, ledger shows ${real.winsA}-${real.winsB}`);
    }
    if (f.kind === 'betrayal') {
      const ev = ledger.get(f.eventIds[f.eventIds.length - 1]);
      if (!ev || ev.type !== 'betrayal') problems.push(`${sum.key}: betrayal fact cites a non-betrayal event`);
    }
  }
  return problems;
}
