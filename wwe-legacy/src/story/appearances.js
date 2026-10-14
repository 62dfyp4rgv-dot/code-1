// Player-initiated media appearances: backstage interviews, podcasts and press conferences.
// Questions are built ONLY from ledger facts (last match, rivalries, open/broken promises, injuries,
// championships, upcoming shows) and each question lists the event ids it relies on. Answer quality is
// computed from stats, stance fit and context; the prose is composed afterwards and never decides anything.
import { clamp, hash53 } from '../core/util.js';
import ANSWER_PACK from './answers_pack.js';
import { gainPop } from '../career/pace.js';
import { hooks } from './dialogue.js';
import { getRivalry, openPromises, brokenPromises, hasOpenPromise } from '../memory/world.js';

export const APPEARANCE_KINDS = {
  interview: { label: 'Backstage Interview', desc: 'Three quick questions with the camera rolling.', questions: 3, fatigue: 2, pay: 0, cooldown: 5, type: 'interview' },
  podcast: { label: 'Podcast Sit-Down', desc: 'A long, honest conversation. More room to impress, more room to slip.', questions: 4, fatigue: 4, pay: 1500, cooldown: 10, type: 'podcast' },
  press_conference: { label: 'Press Conference', desc: 'Reporters, hard questions, and the chance to make a guarantee.', questions: 4, fatigue: 3, pay: 0, cooldown: 14, type: 'press_conference' },
};

export const ANSWERS = {
  confident: { label: 'Back yourself', desc: 'Calm, certain, a little bit untouchable.', fit: { face: 3, heel: 5, tweener: 4 } },
  humble: { label: 'Stay humble', desc: 'Credit the work, the fans and the opposition.', fit: { face: 6, heel: -5, tweener: 2 } },
  aggressive: { label: 'Go on the attack', desc: 'Say what you really think and let it land.', fit: { face: -3, heel: 8, tweener: 3 } },
  honest: { label: 'Be brutally honest', desc: 'Admit the hard parts. People remember candour.', fit: { face: 4, heel: -2, tweener: 5 } },
  joking: { label: 'Make a joke of it', desc: 'Keep it light. Funny works unless it does not.', fit: { face: 2, heel: 0, tweener: 3 } },
  guarantee: { label: 'Make a guarantee', desc: 'Put your name on it. If you miss, everyone remembers.', fit: { face: 2, heel: 4, tweener: 3 } },
};

// context deltas: how well each stance suits each kind of question
const CTX = {
  last_match_win: { confident: 4, humble: 3, aggressive: 0, honest: 2, joking: -1 },
  last_match_loss: { confident: -3, humble: 4, aggressive: -2, honest: 7, joking: -6 },
  rival: { confident: 2, humble: -2, aggressive: 6, honest: 2, joking: 0 },
  broken_promise: { confident: -6, humble: 2, aggressive: -8, honest: 10, joking: -9 },
  open_promise: { confident: 6, humble: 0, aggressive: 2, honest: 1, joking: -3 },
  title: { confident: 5, humble: 3, aggressive: 2, honest: 2, joking: 0, guarantee: 4 },
  injury: { confident: -5, humble: 4, aggressive: -7, honest: 8, joking: -4 },
  upcoming: { confident: 3, humble: 1, aggressive: 3, honest: 0, joking: 0, guarantee: 5 },
  fans: { confident: 0, humble: 8, aggressive: -3, honest: 3, joking: 2 },
  career: { confident: 2, humble: 4, aggressive: 0, honest: 5, joking: 1 },
};

const U = (c) => c.universe;
const nameOf = (c, id) => (U(c).get(id) ? U(c).get(id).name : id);

function lastMatch(c) {
  return c.memory.ledger.query({ types: ['match_result'], scope: 'player', newestFirst: true, limit: 1 })[0] || null;
}

/** All questions the ledger can currently support, each with refs. */
export function candidateQuestions(c, extras = {}) {
  const me = c.player.id, qs = [];
  const m = lastMatch(c);
  if (m) {
    // in a multi-man loss the person who beat you is the winner, not simply the first name on the card
    const opp = (m.data.result === 'loss' && m.data.winner && m.data.winner !== me) ? m.data.winner : (m.data.opponents && m.data.opponents[0]);
    const oppName = opp ? nameOf(c, opp) : 'your opponent';
    const days = c.day - m.day;
    const when = days === 0 ? 'tonight' : days === 1 ? 'last night' : days <= 7 ? `${days} days ago` : 'recently';
    const fx = { finish: String(m.data.finish || 'finish').replace(/_/g, ' '), move: m.data.finishMoveName || null };
    if (m.data.result === 'win') qs.push({ id: 'last_match', fx, ctx: 'last_match_win', subject: opp, refs: [m.id], text: `You beat ${oppName} ${when} by ${String(m.data.finish).replace(/_/g, ' ')}. What did you see out there that others missed?` });
    else if (m.data.result === 'loss') qs.push({ id: 'last_match', fx, ctx: 'last_match_loss', subject: opp, refs: [m.id], text: `${oppName} beat you ${when}. People are asking whether you were outclassed. Were you?` });
    else qs.push({ id: 'last_match', draw: true, fx, ctx: 'last_match_loss', subject: opp, refs: [m.id], text: `Your match with ${oppName} ${when} ended without a winner. Who do you think deserved the win?` });
  }
  const rivals = Object.values(c.memory.world.rivalries).filter((r) => (r.a === me || r.b === me) && r.status === 'active').sort((a, b) => b.heat - a.heat);
  if (rivals[0]) {
    const other = rivals[0].a === me ? rivals[0].b : rivals[0].a;
    const nm = nameOf(c, other);
    // a reporter states a FACT from the record (never a made-up quote) and cites the events behind it
    const fact = factAbout(hooks(c.memory, me, other), nm);
    qs.push({ id: 'rival', ctx: 'rival', subject: other, refs: [...(fact ? fact.refs : []), ...rivals[0].events.slice(-1)].filter(Boolean), text: `You and ${nm} have shared the ring ${rivals[0].matches} time${rivals[0].matches === 1 ? '' : 's'}.${fact ? ` ${fact.text}` : ''} How do you see this rivalry?` });
  }
  const broken = brokenPromises(c.memory.world, me).filter((p) => !p.acknowledged);
  if (broken.length) {
    const p = broken[broken.length - 1];
    qs.push({ id: 'broken_promise', ctx: 'broken_promise', promiseId: p.id, refs: [p.madeEvent, p.resolvedEvent].filter(Boolean), text: `You said "${p.text}". It did not happen. Why should anyone believe you now?` });
  }
  const open = openPromises(c.memory.world, me);
  if (open.length) {
    const p = open[open.length - 1];
    qs.push({ id: 'open_promise', ctx: 'open_promise', refs: [p.madeEvent], text: `You promised "${p.text}". The clock is running. How confident are you?` });
  }
  const held = U(c).titlesOf ? U(c).titlesOf(me) : [];
  if (held.length) qs.push({ id: 'title', ctx: 'title', refs: c.memory.ledger.ofType('title_win').slice(-1).map((e) => e.id), text: `You are the ${held[0].name} holder. Who is the next real threat, and are you ready for them?` });
  else if (c.stats.s.matches >= 6) qs.push({ id: 'title', ctx: 'title', refs: [], text: `You have wrestled ${c.stats.s.matches} matches and you are still chasing gold. When do you get your shot?`, canGuarantee: 'win_title' });
  const inj = c.player.injuries.filter((i) => i.daysLeft > 0).sort((a, b) => b.daysLeft - a.daysLeft)[0];
  if (inj) qs.push({ id: 'injury', ctx: 'injury', refs: inj.eventId ? [inj.eventId] : [], text: `You are working through a ${inj.severity === 2 ? 'serious' : 'minor'} ${inj.part} injury. How bad is it, really?` });
  const next = extras.nextEvent;
  if (next && next.day - c.day <= 14 && next.day >= c.day) qs.push({ id: 'upcoming', ctx: 'upcoming', refs: [], text: `${next.displayName || next.name} is ${next.day === c.day ? 'tonight' : `${next.day - c.day} day${next.day - c.day === 1 ? '' : 's'} away`}. What should the fans expect from you?`, canGuarantee: 'win_streak' });
  if (c.player.popularity >= 40 || c.stats.s.matches >= 20) qs.push({ id: 'fans', ctx: 'fans', refs: [], text: `The fans are ${c.player.popularity >= 60 ? 'chanting your name' : 'starting to notice you'}. What do they mean to you?` });
  qs.push({ id: 'career', ctx: 'career', refs: c.memory.ledger.ofType('debut').slice(0, 1).map((e) => e.id), text: `Looking back at where you started: what has the business taught you so far?` });
  return qs;
}

const FACT_PRIORITY = ['you_betrayed_me', 'i_betrayed_you', 'old_insult', 'controversial_finish', 'clean_dominance', 'you_beat_me', 'i_beat_you', 'respect'];
function factAbout(hs, nm) {
  for (const kind of FACT_PRIORITY) {
    const h = hs.find((x) => x.kind === kind);
    if (!h) continue;
    const text = {
      you_betrayed_me: `${nm} betrayed you, and that is on the record.`, i_betrayed_you: `You turned on ${nm} once, and that is on the record.`,
      old_insult: h.quote ? `You once said of ${nm}: "${String(h.quote).replace(/[.!?]+$/, '')}".` : `You have insulted ${nm} publicly before.`,
      controversial_finish: `Your last meeting ended in controversy.`, clean_dominance: `You have beaten ${nm} cleanly ${h.n} times.`,
      you_beat_me: `${nm} has beaten you ${h.n === 1 ? 'once' : `${h.n} times`}.`, i_beat_you: `You have beaten ${nm} ${h.n === 1 ? 'once' : `${h.n} times`}.`,
      respect: `You have shown ${nm} respect before.`,
    }[kind];
    return { text, refs: h.refs.filter(Boolean) };
  }
  return null;
}

function recentKeys(c) { return (c.flags.appearances && c.flags.appearances.recent) || []; }

export function appearanceOptions(c) {
  const hist = (c.flags.appearances && c.flags.appearances.last) || {};
  return Object.entries(APPEARANCE_KINDS).map(([id, k]) => {
    const since = c.day - (hist[id] ?? -999);
    const wait = Math.max(0, k.cooldown - since);
    const fatigued = c.player.fatigue > 92;
    return { id, ...k, available: wait === 0 && !fatigued && !c.flags.appearance, wait, reason: c.flags.appearance ? 'An appearance is already in progress.' : wait ? `Available again in ${wait} day${wait === 1 ? '' : 's'}.` : fatigued ? 'Too exhausted.' : null };
  });
}

export function startAppearance(c, kind, extras = {}) {
  const k = APPEARANCE_KINDS[kind];
  if (!k) throw new Error(`unknown appearance ${kind}`);
  const opt = appearanceOptions(c).find((o) => o.id === kind);
  if (!opt.available) throw new Error(opt.reason || 'not available');
  const all = candidateQuestions(c, extras);
  const recent = recentKeys(c);
  const seed = `${c.seed}:app:${kind}:${c.day}`;
  // priority: urgent topics first, repeats last, deterministic tie-break
  const prio = { broken_promise: 90, injury: 85, rival: 80, open_promise: 70, last_match: 75, upcoming: 72, title: 60, fans: 40, career: 20 };
  const scored = all.map((q) => ({ q, s: (prio[q.id] || 30) - (recent.includes(q.id) ? 45 : 0) + (parseInt(hash53(seed + q.id), 36) % 17) }));
  scored.sort((a, b) => b.s - a.s);
  const chosen = scored.slice(0, k.questions).map((x) => x.q);
  const questions = chosen.map((q, i) => ({
    ...q, n: i,
    answers: [...['confident', 'humble', 'aggressive', 'honest', 'joking'].slice(0, 5), ...(q.canGuarantee ? ['guarantee'] : [])],
  }));
  c.flags.appearance = { kind, day: c.day, seed, questions, given: [], index: 0 };
  return appearanceView(c);
}

export function appearanceView(c) {
  const s = c.flags.appearance;
  if (!s) return null;
  const q = s.questions[s.index];
  if (!q) return { kind: s.kind, label: APPEARANCE_KINDS[s.kind].label, done: true };
  return {
    kind: s.kind, label: APPEARANCE_KINDS[s.kind].label, step: s.index + 1, of: s.questions.length, question: q.text, refs: q.refs, topic: q.id,
    answers: q.answers.map((a) => ({ id: a, label: ANSWERS[a].label, desc: ANSWERS[a].desc })),
  };
}

// ---- prose: one short answer per (topic, stance); every placeholder comes from the question's facts
const SAY = {
  confident: {
    last_match: (x) => !x.won ? `${x.opp} caught me on the night. The ${x.finish} I can fix, and the result I intend to reverse.` : `I had ${x.opp} figured out early. ${x.move ? `The ${x.move}` : `The ${x.finish}`} was always going to be how it ended.`,
    rival: (x) => `${x.opp} can say whatever ${x.they} wants. The result is the only thing that does not change.`,
    open_promise: () => `I said it and I meant it. I am right on schedule.`,
    title: () => `A shot is coming and I will be ready, because I am always ready.`,
    upcoming: (x) => `Expect me to be the best thing on the card at ${x.event}.`,
    fans: () => `They believe in me, and I do not plan to give them a reason to stop.`,
    career: () => `That the work shows. Keep winning and the rest follows.`,
    broken_promise: () => `One missed target does not define a career, and I am not backing down.`,
    injury: () => `It is a setback, not a stop sign. I will be back stronger.`,
  },
  humble: {
    last_match: (x) => !x.won ? `${x.opp} earned that ${x.finish}. I will learn from it and I will be back.` : `Honestly? ${x.opp} pushed me harder than I expected, and I am just grateful the ${x.finish} went my way.`,
    rival: (x) => `${x.opp} has earned respect from me. Whatever happens next, I will remember that.`,
    open_promise: () => `I made a promise. I am working every day to keep it, and I will not pretend it is easy.`,
    title: () => `I have a lot left to prove. I will earn it, not demand it.`,
    upcoming: (x) => `I will just try to do justice to the fans at ${x.event}.`,
    fans: () => `Everything. They are the reason I get back up.`,
    career: () => `That nobody gets here alone. Every veteran who took time for me is in what I do.`,
    broken_promise: () => `I made a mistake by promising too much. I am sorry, and I will earn the trust back.`,
    injury: () => `It hurts, I will not lie. I am listening to the doctors and being patient.`,
  },
  aggressive: {
    last_match: (x) => !x.won ? `${x.opp} got one. Enjoy it, because there will not be a second.` : `Anyone who thought ${x.opp} had a chance was not watching. ${x.move ? `The ${x.move}` : 'The finish'} proves it.`,
    rival: (x) => `${x.opp} wants to talk? Fine. Say it to my face next time, because I am done being polite.`,
    open_promise: () => `Watch me. Everyone doubting it will have to eat their words.`,
    title: () => `The champions should be worried. Nobody in that locker room wants this smoke.`,
    upcoming: (x) => `${x.event}? Somebody is getting hurt. I have decided it will not be me.`,
    fans: () => `The ones who cheer, thank you. The ones who boo, you are paying to watch me anyway.`,
    career: () => `That nobody gives you anything. You take it, and then you defend it.`,
    broken_promise: () => `I missed. So what? I will put everyone who laughed in their place.`,
    injury: () => `Does it matter how bad it is? I wrestle through anything.`,
  },
  honest: {
    last_match: (x) => `It was ugly in places. That ${x.finish} came from mistakes I made, and I know exactly what they were.`,
    rival: (x) => `Part of it is on me. ${x.opp} and I got under each other's skin, and some of that was my doing.`,
    open_promise: () => `I do not know if I will make it. I am going to try harder than I have ever tried.`,
    title: () => `I am not ready yet, and I know it. The gap is smaller than it was a few months ago.`,
    upcoming: (x) => `I am nervous about ${x.event}, and I think that is a good sign.`,
    fans: () => `Some nights they carry me. I try to remember that when I am tired.`,
    career: () => `That I was less ready than I thought. And that the learning never stops.`,
    broken_promise: () => `I said it to get a reaction and I could not back it up. That was wrong, and I own it.`,
    injury: () => `It is worse than I have said publicly. I am here because I would rather you hear it from me.`,
  },
  joking: {
    last_match: (x) => !x.won ? `Mostly that ${x.opp} sweats a lot. As for the ${x.finish}, let us never speak of it again.` : `Mostly that ${x.opp} sweats a lot. The ${x.finish} was a bonus.`,
    rival: (x) => `${x.opp} has a lot of opinions for someone who has looked at the lights as often as ${x.they} has.`,
    open_promise: () => `Deadline? I did not realise there would be a deadline. Somebody tell my agent.`,
    title: () => `Soon! Very soon! I have already cleared a shelf.`,
    upcoming: (x) => `Bring snacks to ${x.event}. You will not want to leave your seat.`,
    fans: () => `They mean snacks, and free tickets, and occasionally they mean it when they cheer.`,
    career: () => `That cardio is a lie and ice baths are a conspiracy.`,
    broken_promise: () => `I over-promised. It is a family tradition.`,
    injury: () => `It is fine. I have another leg. Two, actually. Plan B exists.`,
  },
  guarantee: {
    title: () => `I guarantee it: I will be a champion.`,
    upcoming: (x) => `I guarantee I win my next three matches, starting at ${x.event}.`,
  },
};
const REACT = {
  great: ['The room breaks into applause.', 'The host just nods and lets you keep going.', 'You can hear a pin drop, then they cheer.'],
  good: ['They nod along.', 'A few reporters scribble that down.', 'That landed.'],
  mid: ['It is an answer. It does not move anyone.', 'A polite pause before the next question.', 'Nobody argues, nobody quotes it.'],
  poor: ['The room goes cold.', 'That one will not age well.', 'The host raises an eyebrow and moves on.'],
};
const REACT_STANCE = {
  joking: { great: ['The whole room laughs, and the host has to wipe an eye.', 'That gets a roar - and a clip.'], good: ['A few laughs, and the host lets you keep the bit.', 'The joke lands softly but it lands.'], mid: ['A couple of polite chuckles.', 'The host smiles and moves on quickly.'], poor: ['Nobody laughs. The silence is louder than the joke.', 'The host gives a tight smile.'] },
  humble: { great: ['The room softens; even the cynics nod.', 'Real warmth, and the host says so.'], good: ['Heads nod around the room.', 'It reads as sincere.'], mid: ['It is gracious and forgettable.', 'The host thanks you and moves on.'], poor: ['It comes across as hedging.', 'Somebody mutters that it sounded rehearsed.'] },
  aggressive: { great: ['Gasps, then applause. The clip is already circulating.', 'The room leans in; this is the line they will quote.'], good: ['The edge is felt and the host loves it.', 'Reporters scribble that one down.'], mid: ['It has heat but no sting.', 'A shrug from the back row.'], poor: ['It sounds angry instead of dangerous.', 'The host glances at the producer.'] },
  honest: { great: ['A long quiet, then the room applauds the candour.', 'Nobody expected that. Everybody respects it.'], good: ['The honesty earns a respectful nod.', 'That is the most real thing said all night.'], mid: ['It is honest, and a little flat.', 'The host nods slowly.'], poor: ['It sounds like an excuse.', 'The honesty comes out as complaint.'] },
  confident: { great: ['The confidence fills the room.', 'You sound like a champion already.'], good: ['It sounds sure of itself, and it works.', 'The room believes you.'], mid: ['It is composed and unremarkable.', 'Nobody argues, nobody quotes it.'], poor: ['The confidence rings hollow.', 'A reporter raises an eyebrow at the bravado.'] },
  guarantee: { great: ['The room erupts - that is the headline.', 'A guarantee like that dominates the night.'], good: ['They write that down.', 'A bold line, and it lands.'], mid: ['It is a promise, and promises get remembered.', 'The room waits to see if you mean it.'], poor: ['The guarantee sounds desperate.', 'Somebody already wants to hold you to it.'] },
};
const tier = (q) => (q >= 78 ? 'great' : q >= 62 ? 'good' : q >= 46 ? 'mid' : 'poor');

const FINISH_PHRASE = { pinfall: 'a pinfall', submission: 'a submission', dq: 'a disqualification', countout: 'a count-out', count_out: 'a count-out', ten_count: 'a ten count', objective: 'a clean grab of the prize', falls: 'a decisive fall', finish: 'a finish' };
function fillAnswer(line, f, subj) {
  const their = subj && subj.gender === 'F' ? 'her' : subj && subj.gender === 'M' ? 'his' : 'their';
  const vals = { opp: f.opp, they: f.they, their, event: f.event, finish: FINISH_PHRASE[f.finish] || `a ${f.finish}`, movePhrase: f.move ? `the ${f.move}` : 'the finish' };
  return line.replace(/\{(\w+)\}/g, (_, k) => (vals[k] === undefined ? '' : vals[k])).replace(/(^|[.!?]["']?\s+)([a-z])/g, (_, pre, ch) => pre + ch.toUpperCase());
}
export function answerAppearance(c, answerId, extras = {}) {
  const s = c.flags.appearance;
  if (!s) throw new Error('no appearance in progress');
  const q = s.questions[s.index];
  if (!q) throw new Error('appearance already complete');
  if (!q.answers.includes(answerId)) throw new Error(`answer ${answerId} not available`);
  const p = c.player;
  const A = ANSWERS[answerId];
  const noise = (parseInt(hash53(`${s.seed}:${q.id}:${answerId}`), 36) % 21) - 8;
  const base = 36 + p.mic * 0.28 + p.charisma * 0.14 + p.attrs.psychology * 0.08 + (p.confidence - 50) * 0.1;
  const quality = Math.round(clamp(base + (A.fit[p.alignment] || 0) + ((CTX[q.ctx] || {})[answerId] || 0) + noise, 5, 99));
  const opp = q.subject ? nameOf(c, q.subject) : 'them';
  const subj = q.subject ? U(c).get(q.subject) : null;
  const they = subj && subj.gender === 'F' ? 'she' : subj && subj.gender === 'M' ? 'he' : 'they';
  const nxt = extras.nextEvent;
  const facts = { won: q.ctx === 'last_match_win', opp, they, finish: q.fx ? q.fx.finish : 'finish', move: q.fx ? q.fx.move : null, event: nxt ? (nxt.displayName || nxt.name) : 'the next show' };
  const legacy = (SAY[answerId][q.id] || (() => 'No comment.'))(facts);
  // authored variants (src/story/answers_pack.js) share the pool with the fact-specific line above, picked by a seeded hash
  const packTopic = q.id === 'last_match' && q.ctx !== 'last_match_win' ? (q.draw ? 'last_match_draw' : 'last_match_loss') : q.id; // the authored last_match lines assume a win
  const pack = ((ANSWER_PACK[answerId] || {})[packTopic] || []).map((l) => fillAnswer(l, facts, subj));
  const pool = [...pack, legacy];
  const text = pool[parseInt(hash53(`${s.seed}:${q.id}:${answerId}:say`), 36) % pool.length];
  const sr = REACT_STANCE[answerId] ? REACT_STANCE[answerId][tier(quality)] : REACT[tier(quality)];
  const react = sr[parseInt(hash53(`${s.seed}:${q.id}r`), 36) % sr.length];
  s.given.push({ q: q.id, promiseId: q.promiseId || null, ctx: q.ctx, answer: answerId, quality, text, react, subject: q.subject || null, refs: q.refs, question: q.text });
  s.index += 1;
  if (s.index >= s.questions.length) return finishAppearance(c);
  return appearanceView(c);
}

function finishAppearance(c) {
  const s = c.flags.appearance, k = APPEARANCE_KINDS[s.kind], p = c.player, me = p.id;
  const given = s.given;
  const quality = Math.round(given.reduce((a, g) => a + g.quality, 0) / given.length);
  const viral = quality >= 86 && parseInt(hash53(s.seed + 'v'), 36) % 100 < 45;
  const effects = { rel: [], rivalry: [] };
  const promises = [];
  for (const g of given) {
    if (g.subject) {
      const w = (g.quality - 50) / 50;
      if (g.answer === 'aggressive') { effects.rel.push({ from: g.subject, to: me, heat: 6, respect: g.quality >= 62 ? 1 : -3 }); effects.rivalry.push({ a: me, b: g.subject, heat: 5 }); }
      else if (g.answer === 'humble' || g.answer === 'honest') effects.rel.push({ from: g.subject, to: me, respect: Math.round(4 * Math.max(0.3, 1 + w)), trust: 1 });
      else if (g.answer === 'joking') effects.rel.push({ from: g.subject, to: me, heat: g.quality >= 62 ? 1 : 4 });
    }
    if (g.answer === 'guarantee') {
      const kind = g.q === 'title' ? 'win_title' : 'win_streak';
      const claim = kind === 'win_title'
        ? { kind, text: 'I will win a championship', deadlineDay: c.day + 365 }
        : { kind, params: { n: 3 }, text: 'I will win my next three matches', deadlineDay: c.day + 60 };
      if (!hasOpenPromise(c.memory.world, { by: me, kind, target: null, params: claim.params || {} }) && !promises.some((x) => x.kind === kind)) promises.push(claim);
    }
  }
  // owning a broken promise honestly settles it (it stops being thrown back at the player)
  const acknowledged = given.filter((g) => g.q === 'broken_promise' && ['honest', 'humble'].includes(g.answer) && g.promiseId).map((g) => g.promiseId);
  const refs = [...new Set(given.flatMap((g) => g.refs))].filter((id) => c.memory.ledger.get(id));
  const out = c.record({
    key: `appearance:${s.kind}:${s.day}:${c.flags.appearances ? c.flags.appearances.n || 0 : 0}`, category: 'media', type: k.type,
    participants: [me, ...new Set(given.map((g) => g.subject).filter(Boolean))], refs,
    summary: `${p.name} did a ${k.label.toLowerCase()} (${quality}/100)${promises.length ? ' and made a guarantee' : ''}.`, importance: viral || quality >= 85 ? 4 : 3,
    data: { quality, viral, kind: s.kind, topics: given.map((g) => g.q), answers: given.map((g) => g.answer), effects, promises, acknowledged },
  });
  gainPop(p, (quality - 52) / 70 + (viral ? 1.2 : 0));
  p.confidence = clamp(p.confidence + (quality >= 70 ? 2 : quality < 45 ? -3 : 0), 0, 100);
  p.fatigue = clamp(p.fatigue + k.fatigue, 0, 100);
  if (k.pay) p.money += Math.round(k.pay * (0.6 + quality / 100));
  const flags = c.flags.appearances = c.flags.appearances || { last: {}, recent: [], n: 0 };
  flags.last[s.kind] = c.day; flags.n = (flags.n || 0) + 1;
  flags.recent = [...given.map((g) => g.q), ...flags.recent].slice(0, 8);
  c.flags.appearance = null;
  c.checkMilestones();
  return { done: true, kind: s.kind, label: k.label, quality, viral, given, refs, event: out.event, unlocked: out.unlocked, promises, pay: k.pay ? Math.round(k.pay * (0.6 + quality / 100)) : 0 };
}

export function cancelAppearance(c) { c.flags.appearance = null; }
