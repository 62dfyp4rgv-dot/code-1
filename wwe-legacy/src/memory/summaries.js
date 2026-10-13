// Layer C: compressed narrative memory. Summaries are rebuilt from the ledger and every claim
// carries the ids of the events that justify it, so they can be audited (validateSummaries).
import { getRel, getRivalry, pairKey } from './world.js';

export function buildPairSummary(memory, a, b, nameOf = (x) => x) {
  const { ledger, world } = memory;
  const facts = [];
  const h2h = ledger.query({ types: ['match_result'], allParticipants: [a, b] });
  if (h2h.length) {
    const wins = h2h.filter((e) => e.data.result === 'win' && e.participants.includes(a) && e.data.winner === a).length;
    const winsB = h2h.filter((e) => e.data.winner === b).length;
    facts.push({ kind: 'h2h', a, b, matches: h2h.length, winsA: wins, winsB, eventIds: h2h.map((e) => e.id), text: `${nameOf(a)} and ${nameOf(b)} have met ${h2h.length} time(s): ${wins}-${winsB}.` });
  }
  const rel = getRel(world, a, b);
  for (const bt of rel.betrayals) {
    facts.push({ kind: 'betrayal', by: bt.by, against: bt.against, eventIds: [bt.event], text: `${nameOf(bt.by)} betrayed ${nameOf(bt.against)} (${ledger.get(bt.event).date}).` });
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
      const real = ledger.query({ types: ['match_result'], allParticipants: [f.a, f.b] });
      if (real.length < f.matches) problems.push(`${sum.key}: h2h claims ${f.matches} matches, ledger has ${real.length}`);
      const wa = real.filter((e) => e.data.winner === f.a).length;
      if (wa < f.winsA) problems.push(`${sum.key}: h2h claims ${f.winsA} wins, ledger shows ${wa}`);
    }
    if (f.kind === 'betrayal') {
      const ev = ledger.get(f.eventIds[0]);
      if (!ev || ev.type !== 'betrayal') problems.push(`${sum.key}: betrayal fact cites a non-betrayal event`);
    }
  }
  return problems;
}
