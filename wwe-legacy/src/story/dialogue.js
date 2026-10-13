// Memory-aware dialogue. Every historical claim a character makes is generated from retrieved
// ledger facts and carries the ids of the events it relies on (refs). Nothing here can invent
// a past event: if no supporting fact exists, the line is simply not produced.
import { getRel, getRivalry, openPromises, brokenPromises } from '../memory/world.js';

/** Collect factual hooks (each with refs) about the relationship between the player and `other`. */
export function hooks(memory, me, other) {
  const { ledger, world } = memory;
  const out = [];
  const h2h = ledger.query({ types: ['match_result'], allParticipants: [me, other] });
  if (h2h.length) {
    const wins = h2h.filter((e) => e.data.winner === me), losses = h2h.filter((e) => e.data.winner === other);
    if (wins.length) out.push({ kind: 'i_beat_you', n: wins.length, last: wins[wins.length - 1], refs: wins.map((e) => e.id).slice(-3) });
    if (losses.length) out.push({ kind: 'you_beat_me', n: losses.length, last: losses[losses.length - 1], refs: losses.map((e) => e.id).slice(-3) });
    const clean = wins.filter((e) => e.data.clean);
    if (clean.length >= 2) out.push({ kind: 'clean_dominance', n: clean.length, refs: clean.map((e) => e.id).slice(-3) });
    const dirty = h2h.filter((e) => ['dq', 'countout'].includes(e.data.finish) || e.data.interference);
    if (dirty.length) out.push({ kind: 'controversial_finish', n: dirty.length, refs: dirty.map((e) => e.id).slice(-2) });
  }
  const rel = getRel(world, me, other);
  for (const b of rel.betrayals) out.push({ kind: b.by === me ? 'i_betrayed_you' : 'you_betrayed_me', refs: [b.event] });
  const insult = ledger.query({ types: ['promo_delivered'], allParticipants: [me, other] }).filter((e) => ['insult', 'humiliate'].includes(e.data.tone));
  if (insult.length) out.push({ kind: 'old_insult', n: insult.length, refs: insult.map((e) => e.id).slice(-2), quote: insult[insult.length - 1].data.line || null });
  const broken = brokenPromises(world, me);
  if (broken.length) out.push({ kind: 'broken_promise', refs: [broken[broken.length - 1].madeEvent, broken[broken.length - 1].resolvedEvent].filter(Boolean), text: broken[broken.length - 1].text });
  const respect = ledger.query({ types: ['respect_shown'], allParticipants: [me, other] });
  if (respect.length) out.push({ kind: 'respect', n: respect.length, refs: respect.map((e) => e.id).slice(-2) });
  const rv = getRivalry(world, me, other);
  if (rv && rv.matches >= 2) out.push({ kind: 'long_rivalry', n: rv.matches, refs: rv.events.slice(-3) });
  const open = openPromises(world, me);
  if (open.length) out.push({ kind: 'open_promise', refs: [open[open.length - 1].madeEvent], text: open[open.length - 1].text });
  return out;
}

const LINES = {
  i_beat_you: (h, n) => `I've beaten you ${h.n === 1 ? 'before' : `${h.n} times`}, ${n}. Nothing changes tonight.`,
  you_beat_me: (h, n) => `${n}, you got the better of me ${h.n === 1 ? 'once' : `${h.n} times`}. That ends now.`,
  clean_dominance: (h, n) => `${h.n} clean victories over you, ${n}. Not one fluke among them.`,
  controversial_finish: (h, n) => `Don't pretend the way we finished last time was clean, ${n}.`,
  i_betrayed_you: (h, n) => `Yes, I turned on you, ${n}. You can't take that back and neither can I.`,
  you_betrayed_me: (h, n) => `You betrayed me, ${n}. I haven't forgotten, and I never will.`,
  old_insult: (h, n) => (h.quote ? `You said it in front of everyone: "${h.quote}" - I haven't forgotten, ${n}.` : `You insulted me in front of everyone, ${n}, and I remember.`),
  broken_promise: (h) => `Remember when you promised "${h.text}"? We all saw how that ended.`,
  respect: (h, n) => `I shook your hand once, ${n}. Don't mistake respect for weakness.`,
  long_rivalry: (h, n) => `${h.n} matches and still we're here, ${n}.`,
  open_promise: (h) => `I made a promise: "${h.text}". I intend to keep it.`,
};

/** speaker: 'player' | 'other'. Returns [{ text, refs }] for the most relevant hooks. */
export function memoryLines(memory, me, other, otherName, { speaker = 'other', max = 3, allow } = {}) {
  const hs = hooks(memory, me, other).filter((h) => !allow || allow.includes(h.kind));
  const priority = ['you_betrayed_me', 'i_betrayed_you', 'broken_promise', 'old_insult', 'controversial_finish', 'clean_dominance', 'you_beat_me', 'i_beat_you', 'long_rivalry', 'respect', 'open_promise'];
  hs.sort((a, b) => priority.indexOf(a.kind) - priority.indexOf(b.kind));
  const lines = [];
  for (const h of hs) {
    // perspective: when the *other* speaks, "I beat you" / "you beat me" swap
    let hh = h;
    if (speaker === 'other') {
      const swap = { i_beat_you: 'you_beat_me', you_beat_me: 'i_beat_you', i_betrayed_you: 'you_betrayed_me', you_betrayed_me: 'i_betrayed_you' };
      if (swap[h.kind]) hh = { ...h, kind: swap[h.kind] };
      if (h.kind === 'old_insult') hh = h;
    }
    const fn = LINES[hh.kind];
    if (!fn) continue;
    lines.push({ text: fn(hh, speaker === 'other' ? 'you' : otherName), refs: h.refs.filter(Boolean), kind: hh.kind });
    if (lines.length >= max) break;
  }
  return lines;
}

/** Every dialogue line that cites history must cite real events. */
export function validateLines(memory, lines) {
  const problems = [];
  for (const l of lines) {
    for (const id of l.refs || []) if (!memory.ledger.get(id)) problems.push(`line "${l.text}" cites unknown event ${id}`);
    if (l.kind && !(l.refs || []).length) problems.push(`line "${l.text}" claims history but cites nothing`);
  }
  return problems;
}
