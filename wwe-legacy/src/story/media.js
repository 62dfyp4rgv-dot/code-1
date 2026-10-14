// Promos and media segments. Quality is computed from stats and choices (never from text);
// the words are composed afterwards, and every historical reference comes from dialogue.hooks().
import { clamp } from '../core/util.js';
import { plesInYear } from '../universe/calendar.js';
import PACK from './promo_pack.js';
import { hash53 } from '../core/util.js';
import { gainPop } from '../career/pace.js';
import { hooks } from './dialogue.js';
import { hasOpenPromise } from '../memory/world.js';

export const PROMO_TONES = {
  insult: { label: 'Insult', desc: 'Cut them down in front of everyone.', needsTarget: true, fit: { heel: 8, face: -4, tweener: 2 } },
  humiliate: { label: 'Humiliate', desc: 'Public embarrassment. Huge heat, long memory.', needsTarget: true, fit: { heel: 10, face: -8, tweener: 0 } },
  challenge: { label: 'Challenge', desc: 'Throw down the gauntlet.', needsTarget: true, fit: { heel: 3, face: 6, tweener: 4 } },
  threat: { label: 'Threaten', desc: 'Promise pain. Builds fear.', needsTarget: true, fit: { heel: 7, face: -3, tweener: 2 } },
  respect: { label: 'Show Respect', desc: 'Acknowledge a worthy opponent.', needsTarget: true, fit: { heel: -4, face: 8, tweener: 4 } },
  tribute: { label: 'Pay Tribute', desc: 'Honour their career.', needsTarget: true, fit: { heel: -6, face: 8, tweener: 4 } },
  apology: { label: 'Apologise', desc: 'Make amends for something you said or did.', needsTarget: true, fit: { heel: -8, face: 4, tweener: 2 } },
  boast: { label: 'Boast', desc: 'Talk about how great you are.', needsTarget: false, fit: { heel: 6, face: 0, tweener: 4 } },
  inspire: { label: 'Rally the Fans', desc: 'Speak from the heart to the crowd.', needsTarget: false, fit: { heel: -4, face: 8, tweener: 3 } },
};

export const CLAIMS = {
  none: { label: 'No promise' },
  win_match: { label: 'Promise to beat them', needsTarget: true },
  win_streak: { label: 'Promise a 5-match winning streak' },
  win_rumble: { label: 'Guarantee a Royal Rumble win' },
  win_title: { label: 'Promise to win a championship' },
};

const OPEN = {
  insult: ['Let me be honest with all of you about {t}.', '{t} acts like this ring is {their} property. Watch me prove otherwise.', 'I have been polite long enough, {t}.'],
  humiliate: ['Everybody look at {t}. Take a good look.', '{t}, you are the punchline of this entire locker room.'],
  challenge: ['{t}, I am done waiting. You and me. Any time.', 'This is a challenge, {t}. Accept it or hide.'],
  threat: ['{t}, when we meet you will not walk out the way you walked in.', 'I am coming for you, {t}, and nobody can stop it.'],
  respect: ['{t}, you have my respect. That is not easy to earn.', 'Credit where it is due: {t} is the real deal.'],
  tribute: ['Before anything else, I want to honour {t}.', 'Everything {t} has done in this ring matters to me.'],
  apology: ['{t}, I owe you an apology and I am going to give it here.', 'I was wrong, {t}. Everyone should hear me say it.'],
  boast: ['Nobody in this building works harder than I do.', 'You came here to see greatness. You are looking at it.'],
  inspire: ['You people are the reason I do this.', 'Every night I step through those curtains for you.'],
};
const CLOSE = ['Remember this night.', 'Make of it what you will.', 'That is all I have to say.', 'You know where to find me.', 'The bell does the rest of the talking.', 'Now you have heard it from me.', 'Take that back to the locker room.', 'I am not done, but this is all you get tonight.'];
const CLOSE_PROMISE = ['Write it down.', 'Hold me to it.', 'Check the record when I am done.', 'You heard it here first.', 'Put it on the board and watch me cross it off.', 'Say what you like. The record will say the rest.'];
// tone-specific body lines so an insult actually insults and a tribute actually honours
const BODY = {
  insult: ['You are not a threat, {t}. You are a warm-up act.', '{t} talks like a main eventer and wrestles like a favour.', 'I have seen more fight in the ring crew, {t}.'],
  humiliate: ['{t} knows exactly how this ends and keeps showing up anyway. That takes a special kind of nerve.', 'Every time {t} walks to the ring, somewhere a ticket-holder checks the time.'],
  challenge: ['No gimmicks, no excuses. The ring, and the clock.', 'Say yes, {t}, and I will make it the best match of your career.'],
  threat: ['Whatever happens in that ring, you will remember it for a long time.', 'You will feel me for weeks, {t}. That is not a boast.'],
  respect: ['It takes a lot to earn that from me.', 'Whatever the result, the work you put in is real.'],
  tribute: ['Without people like {t}, nobody gets to do this.', 'The ring is better because {t} stood in it.'],
  apology: ['Words said in anger do not stay in the room. I know that now.', 'Nobody had to forgive me. I am asking anyway.'],
  boast: ['Check the numbers. Then check them again.', 'The only person who can stop me is standing in this ring, and I see them every morning in the mirror.'],
  inspire: ['When I stumble, you are the ones who pull me up.', 'Every chant is a promise I owe you back.'],
};

/** the Royal Rumble year a guarantee made today can still be kept in (the show is the last Saturday of January) */
function nextRumbleYear(career) {
  const today = new Date(Date.UTC(career.startYear, 0, 1) + career.day * 86400000);
  const y = today.getUTCFullYear();
  const rr = plesInYear(y).find((p) => p.rumble);
  return rr && today.getTime() <= Date.UTC(y, 0, 1) + rr.dayOfYear * 86400000 ? y : y + 1;
}
function pick(arr, seed) { return arr[parseInt(hash53(seed), 36) % arr.length]; }

/**
 * Compose and resolve a promo. Returns { quality, viral, lines:[{text,refs}], event, unlocked, reaction }.
 * career.record() is the only way anything is stored.
 */
export function deliverPromo(career, { tone, targetId = null, claim = 'none', context = 'ring', year } = {}) {
  const tdef = PROMO_TONES[tone];
  if (!tdef) throw new Error(`unknown promo tone ${tone}`);
  if (tdef.needsTarget && !targetId) throw new Error(`${tone} needs a target`);
  const p = career.player, w = career.universe;
  const target = targetId ? w.get(targetId) : null;
  const rng = career.rng;
  const idx = (career.flags.promoSeq = (career.flags.promoSeq || 0) + 1);
  const key = `promo:${career.day}:${idx}`;
  const hs = target ? hooks(career.memory, p.id, targetId) : [];
  const memBonus = Math.min(10, hs.filter((h) => ['broken_promise', 'old_insult', 'you_betrayed_me', 'i_betrayed_you', 'controversial_finish', 'clean_dominance'].includes(h.kind)).length * 4);
  const quality = Math.round(clamp(25 + p.mic * 0.42 + p.charisma * 0.2 + (p.confidence - 50) * 0.12 + (tdef.fit[p.alignment] || 0) + memBonus + rng.range(-8, 10) + (target && target.popularity > p.popularity ? 3 : 0), 5, 99));
  const viral = quality >= 88 && rng.chance(0.45);
  // compose lines
  const lines = [];
  const seed = key + tone;
  const tn = target ? target.name : '';
  const tl = tn ? tn.split(' ').slice(-1)[0] : '';
  const gen = target && target.gender === 'F' ? { their: 'her', they: 'she', them: 'her' } : target && target.gender === 'M' ? { their: 'his', they: 'he', them: 'him' } : { their: 'their', they: 'they', them: 'them' };
  const fill = (str, who) => str.replace(/\{t\}/g, who).replace(/\{their\}/g, gen.their).replace(/\{they\}/g, gen.they).replace(/\{them\}/g, gen.them);
  lines.push({ text: fill(pick([...PACK.open[tone], ...OPEN[tone]], seed), tn), role: 'open', refs: [] });
  // the tone's own body line: an insult has to insult, a tribute has to honour
  if (BODY[tone]) lines.push({ text: fill(pick([...PACK.body[tone][['face', 'heel'].includes(p.alignment) ? p.alignment : 'tweener'], ...BODY[tone]], seed + 'b'), tl || 'everyone'), role: 'body', refs: [] });
  if (target) {
    const order = ['broken_promise', 'old_insult', 'you_betrayed_me', 'i_betrayed_you', 'controversial_finish', 'controversial_finish_old', 'clean_dominance', 'i_beat_you', 'you_beat_me'];
    const record = new Set(['clean_dominance', 'i_beat_you', 'you_beat_me']); // one head-to-head line is enough
    const maxHooks = ['insult', 'humiliate', 'threat'].includes(tone) ? 1 : 2;
    const hookUse = (career.flags.hookUse = career.flags.hookUse || {});
    const used = []; let recordUsed = false;
    for (const kind of order) {
      const h = hs.find((x) => x.kind === kind);
      if (!h || used.length >= maxHooks) continue;
      if (record.has(kind) && recordUsed) continue;
      const hk = `promo:${targetId}:${kind}:${(h.refs || []).slice(-1)[0] || ''}`;
      if (hookUse[hk] !== undefined && career.day - hookUse[hk] < 40) continue; // do not repeat the same callback every promo
      // the callback has to fit the tone: no gloating in an apology or tribute, no 'you beat me' in a threat
      if (['respect', 'tribute', 'inspire'].includes(tone) && ['old_insult', 'broken_promise'].includes(kind)) continue;
      if (['apology', 'respect', 'tribute'].includes(tone) && ['old_insult', 'clean_dominance', 'controversial_finish', 'controversial_finish_old'].includes(kind)) continue;
      if (tone === 'apology' && ['i_beat_you', 'you_beat_me'].includes(kind)) continue;
      if (['insult', 'humiliate', 'threat', 'boast'].includes(tone) && kind === 'you_beat_me') continue;
      if (['insult', 'humiliate', 'threat', 'boast', 'challenge'].includes(tone) && kind === 'broken_promise') continue;
      hookUse[hk] = career.day;
      if (record.has(kind)) recordUsed = true;
      const refs = h.refs.filter(Boolean);
      const quote = h.quote ? String(h.quote).replace(/[.!?]+$/, '') : null;
      const text = {
        broken_promise: `Some of you remember I once said "${h.text}". I did not deliver. I own that.`,
        old_insult: quote ? `I said it to everyone before: "${quote}". I stand by it.` : 'I have not forgotten the things said between us.',
        you_betrayed_me: `You betrayed me, ${tl}. That is a debt, not a memory.`,
        i_betrayed_you: `I turned on you once, ${tl}. I know what that cost between us.`,
        controversial_finish: `Last time ended in controversy, ${tl}. This time there will be no doubt.`,
        controversial_finish_old: `Not every finish between us was clean, ${tl}. This one will be.`,
        clean_dominance: `${h.n} clean ${h.n === 1 ? 'win' : 'wins'} over you, ${tl}. It is all on the record.`,
        i_beat_you: `I have beaten you ${h.n === 1 ? 'before' : h.n + ' times'}, ${tl}.`,
        you_beat_me: `${tl}, you have beaten me ${h.n === 1 ? 'once' : h.n + ' times'}. I remember every one.`,
      }[kind];
      lines.push({ text, refs, kind }); used.push(kind);
    }
  }
  const claimDef = CLAIMS[claim] ? claim : 'none';
  const promises = [];
  const addPromiseClaim = (c, line) => {
    if (hasOpenPromise(career.memory.world, { by: p.id, kind: c.kind, target: c.target || null, params: c.params || {} })) { lines.push({ text: `I stand by what I said before: ${/^I[ ']/.test(c.text) ? c.text : c.text.charAt(0).toLowerCase() + c.text.slice(1)}.`, refs: [] }); return; }
    promises.push(c); lines.push(line);
  };
  if (claimDef === 'win_match' && target) { addPromiseClaim({ kind: 'win_match', target: targetId, text: `I will beat ${tn}`, deadlineDay: career.day + 150 }, { text: pick([`I promise this: I will beat you, ${tl}.`, `${tl}, I am putting it on the record: I will beat you next time.`, `Next time we meet, ${tl}, it is my hand that gets raised.`], seed + 'p'), refs: [], promise: true }); }
  if (claimDef === 'win_streak') addPromiseClaim({ kind: 'win_streak', params: { n: 5 }, text: 'I will win five in a row', deadlineDay: career.day + 120 }, { text: 'Five wins in a row, starting now. Mark my words.', refs: [], promise: true });
  if (claimDef === 'win_rumble') { const y = year || nextRumbleYear(career); addPromiseClaim({ kind: 'win_rumble', params: { year: y }, text: `I will win the ${y} Royal Rumble`, deadlineDay: career.day + 420 }, { text: `I guarantee I will win the ${y} Royal Rumble.`, refs: [], promise: true }); }
  if (claimDef === 'win_title') addPromiseClaim({ kind: 'win_title', text: 'I will win a championship', deadlineDay: career.day + 365 }, { text: 'I will be champion. Nothing will stop me.', refs: [], promise: true });
  lines.push({ text: pick(promises.length ? [...PACK.closePromise, ...CLOSE_PROMISE] : [...PACK.close, ...CLOSE], seed + 'c'), refs: [] });
  const out = career.record({
    key, category: 'promo', type: 'promo_delivered', participants: [p.id, ...(targetId ? [targetId] : [])],
    refs: [...new Set(lines.flatMap((l) => l.refs))].filter((id) => career.memory.ledger.get(id)),
    summary: `${p.name} cut ${/^[aeiou]/.test(tone) ? 'an' : 'a'} ${tone} promo${target ? ` on ${target.name}` : ''} (${quality}/100)${claimDef !== 'none' ? ` and made a promise` : ''}.`, importance: viral || quality >= 85 ? 4 : 3,
    data: { tone, targets: targetId ? [targetId] : [], quality, viral, context, line: (lines.find((l) => l.role === 'body') || lines[0]).text, promises, claim: claimDef, exposedWeakness: memBonus >= 8 && ['insult', 'humiliate'].includes(tone) },
  });
  // popularity effect
  gainPop(p, (quality - 50) / 120 + (viral ? 1.5 : 0));
  let reaction = null;
  if (target && tdef.needsTarget) {
    const mood = { insult: 'is furious', humiliate: 'is livid and wants revenge', challenge: 'accepts the challenge', threat: 'is rattled but defiant', respect: 'returns the respect', tribute: 'is touched', apology: 'is willing to move on' }[tone];
    reaction = `${target.name} ${mood}.`;
  }
  career.checkMilestones();
  return { quality, viral, lines, event: out.event, unlocked: out.unlocked, reaction, duplicate: out.duplicate };
}
