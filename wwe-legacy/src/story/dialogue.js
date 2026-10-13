// Memory-aware dialogue. Every historical claim a character makes is generated from retrieved
// ledger facts and carries the ids of the events it relies on (refs). Nothing here can invent
// a past event: if no supporting fact exists, the line is simply not produced.
import { getRel, getRivalry, openPromises, brokenPromises } from '../memory/world.js';
import { hash53 } from '../core/util.js';

/** Collect factual hooks (each with refs) about the relationship between the player and `other`. */
export function hooks(memory, me, other) {
  const { ledger, world } = memory;
  const out = [];
  const h2h = ledger.query({ types: ['match_result'], allParticipants: [me, other] });
  if (h2h.length) {
    const wins = h2h.filter((e) => e.data.winner === me), losses = h2h.filter((e) => e.data.winner === other);
    if (wins.length) out.push({ kind: 'i_beat_you', n: wins.length, last: wins[wins.length - 1], refs: wins.map((e) => e.id).slice(-12) });
    if (losses.length) out.push({ kind: 'you_beat_me', n: losses.length, last: losses[losses.length - 1], refs: losses.map((e) => e.id).slice(-12) });
    const clean = wins.filter((e) => e.data.clean);
    if (clean.length >= 2) out.push({ kind: 'clean_dominance', n: clean.length, refs: clean.map((e) => e.id).slice(-12) });
    const dirty = h2h.filter((e) => ['dq', 'countout'].includes(e.data.finish) || e.data.interference);
    // "last time" is only true if the MOST RECENT meeting was the controversial one
    const lastMeeting = h2h[h2h.length - 1];
    if (dirty.length) out.push({ kind: dirty.includes(lastMeeting) ? 'controversial_finish' : 'controversial_finish_old', n: dirty.length, refs: dirty.map((e) => e.id).slice(-4) });
  }
  const rel = getRel(world, me, other);
  for (const b of rel.betrayals) out.push({ kind: b.by === me ? 'i_betrayed_you' : 'you_betrayed_me', refs: [b.event] });
  const insult = ledger.query({ types: ['promo_delivered'], allParticipants: [me, other] }).filter((e) => ['insult', 'humiliate'].includes(e.data.tone));
  if (insult.length) out.push({ kind: 'old_insult', n: insult.length, refs: insult.map((e) => e.id).slice(-2), quote: insult[insult.length - 1].data.line || null });
  // only a promise made ABOUT this person is theirs to throw back (and one already owned up to on air is settled)
  const broken = brokenPromises(world, me).filter((p) => p.target === other && !p.acknowledged);
  if (broken.length) out.push({ kind: 'broken_promise', refs: [broken[broken.length - 1].madeEvent, broken[broken.length - 1].resolvedEvent].filter(Boolean), text: broken[broken.length - 1].text });
  const respect = ledger.query({ types: ['respect_shown'], allParticipants: [me, other] });
  if (respect.length) out.push({ kind: 'respect', n: respect.length, refs: respect.map((e) => e.id).slice(-2) });
  const rv = getRivalry(world, me, other);
  if (rv && rv.matches >= 2) out.push({ kind: 'long_rivalry', n: rv.matches, refs: rv.events.slice(-6) });
  const open = openPromises(world, me);
  if (open.length) out.push({ kind: 'open_promise', refs: [open[open.length - 1].madeEvent], text: open[open.length - 1].text });
  return out;
}

// vocative: ", Name" for named addressees, nothing when the listener is simply "you"
const voc = (n) => (n && n !== 'you' ? `, ${n}` : '');
const who = (n) => (n && n !== 'you' ? n : 'you');
const times = (n) => (n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`);
// two or three phrasings per hook so repeated callbacks do not read like a database dump
const LINES = {
  i_beat_you: [
    (h, n) => `I've beaten ${who(n)} ${h.n === 1 ? 'before' : times(h.n)}. Nothing changes tonight.`,
    (h, n) => `${h.n === 1 ? 'One win' : `${h.n} wins`} over ${who(n)} already. I can count higher.`,
    (h, n) => `The record says I own ${who(n)}${h.n > 1 ? ` ${times(h.n)} over` : ''}. Check it.`,
  ],
  you_beat_me: [
    (h, n) => `${who(n) === 'you' ? 'You' : n} got the better of me ${times(h.n)}. That ends now.`,
    (h, n) => `I haven't forgotten ${h.n === 1 ? 'the loss' : `losing ${times(h.n)}`} to ${who(n)}. I've been waiting for this.`,
    (h, n) => `${h.n === 1 ? 'One loss' : `${h.n} losses`} to ${who(n)}. Tonight I fix that.`,
  ],
  clean_dominance: [
    (h, n) => `${h.n} clean victories over ${who(n)}. Not one fluke among them.`,
    (h, n) => `Every one of those ${h.n} wins over ${who(n)} was clean. Nobody can argue that.`,
  ],
  controversial_finish: [
    (h, n) => `Don't pretend the way we finished last time was clean${voc(n)}.`,
    (h, n) => `Last time ended with people yelling at the referee${voc(n)}. This time nobody can blame anyone.`,
  ],
  controversial_finish_old: [
    (h, n) => `We've had a finish or two between us that nobody would call clean${voc(n)}.`,
    (h, n) => `Some of the history between us still smells bad${voc(n)}.`,
  ],
  i_betrayed_you: [
    (h, n) => `Yes, I turned on ${who(n)}. It can't be taken back and neither can the consequences.`,
    (h, n) => `I betrayed ${who(n)}, and I'll answer for it.`,
  ],
  you_betrayed_me: [
    (h, n) => `${who(n) === 'you' ? 'You' : n} betrayed me. I haven't forgotten, and I never will.`,
    (h, n) => `Betrayal sticks. ${who(n) === 'you' ? 'You' : n} turned on me when I trusted ${who(n) === 'you' ? 'you' : 'them'}.`,
  ],
  old_insult: [
    (h, n) => (h.quote ? `"${h.quote}" - that's what was said in front of everyone, and I remember it.` : `The insults in front of everyone${voc(n)} - I remember every one.`),
    (h, n) => `Words said in public stay said${voc(n)}. I've kept mine.`,
  ],
  broken_promise: [
    (h) => `Remember when "${h.text}" was promised? We all saw how that ended.`,
    (h) => `"${h.text}" - a promise made on the record, and broken on it.`,
  ],
  respect: [
    (h, n) => `We shook hands once${voc(n)}. Don't mistake respect for weakness.`,
    (h, n) => `I gave ${who(n)} respect when it was earned. That can change.`,
  ],
  long_rivalry: [
    (h, n) => `${h.n} matches and we're still here${voc(n)}.`,
    (h, n) => `${h.n} matches. Neither of us has learned to walk away${voc(n)}.`,
  ],
  open_promise: [
    (h) => `I made a promise: "${h.text}". I intend to keep it.`,
    (h) => `"${h.text}" - that's on the record, and I'm coming for it.`,
  ],
};
const variant = (list, h) => list[parseInt(hash53(`${h.kind}:${(h.refs || []).join(',')}`), 36) % list.length];

/** speaker: 'player' | 'other'. `cooldown` ({ store, day, days }) stops the same callback being repeated every scene. */
export function memoryLines(memory, me, other, otherName, { speaker = 'other', max = 3, allow, cooldown } = {}) {
  const hs = hooks(memory, me, other).filter((h) => !allow || allow.includes(h.kind));
  const priority = ['you_betrayed_me', 'i_betrayed_you', 'broken_promise', 'old_insult', 'controversial_finish', 'clean_dominance', 'you_beat_me', 'i_beat_you', 'controversial_finish_old', 'long_rivalry', 'respect', 'open_promise'];
  hs.sort((a, b) => priority.indexOf(a.kind) - priority.indexOf(b.kind));
  const lines = [];
  for (const h of hs) {
    // perspective: when the *other* speaks, "I beat you" / "you beat me" swap
    let hh = h;
    if (speaker === 'other') {
      const swap = { i_beat_you: 'you_beat_me', you_beat_me: 'i_beat_you', i_betrayed_you: 'you_betrayed_me', you_betrayed_me: 'i_betrayed_you' };
      if (swap[h.kind]) hh = { ...h, kind: swap[h.kind] };
    }
    const list = LINES[hh.kind];
    if (!list) continue;
    const key = `${other}:${hh.kind}:${(h.refs || []).slice(-1)[0] || ''}`;
    if (cooldown && cooldown.store[key] !== undefined && cooldown.day - cooldown.store[key] < (cooldown.days ?? 45)) continue;
    lines.push({ text: variant(list, h)(hh, speaker === 'other' ? 'you' : otherName), refs: h.refs.filter(Boolean), kind: hh.kind, key });
    if (cooldown) cooldown.store[key] = cooldown.day;
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
