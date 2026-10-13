// Promos and media segments. Quality is computed from stats and choices (never from text);
// the words are composed afterwards, and every historical reference comes from dialogue.hooks().
import { clamp } from '../core/util.js';
import { hash53 } from '../core/util.js';
import { hooks } from './dialogue.js';

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
  insult: ['Let me be honest with all of you about {t}.', '{t} thinks they belong here. Watch me prove they do not.', 'I have been polite long enough, {t}.'],
  humiliate: ['Everybody look at {t}. Take a good look.', '{t}, you are the punchline of this entire locker room.'],
  challenge: ['{t}, I am done waiting. You and me. Any time.', 'This is a challenge, {t}. Accept it or hide.'],
  threat: ['{t}, when we meet you will not walk out the way you walked in.', 'I am coming for you, {t}, and nobody can stop it.'],
  respect: ['{t}, you have my respect. That is not easy to earn.', 'Credit where it is due: {t} is the real deal.'],
  tribute: ['Before anything else, I want to honour {t}.', 'Everything {t} has done in this ring matters to me.'],
  apology: ['{t}, I owe you an apology and I am going to give it here.', 'I was wrong, {t}. Everyone should hear me say it.'],
  boast: ['Nobody in this building works harder than I do.', 'You came here to see greatness. You are looking at it.'],
  inspire: ['You people are the reason I do this.', 'Every night I step through those curtains for you.'],
};
const CLOSE = ['That is not a promise. That is a fact.', 'And that is the end of the conversation.', 'Remember this night.', 'Make of it what you will.'];

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
  lines.push({ text: pick(OPEN[tone], seed).replace('{t}', tn), refs: [] });
  if (target) {
    const order = ['broken_promise', 'old_insult', 'you_betrayed_me', 'i_betrayed_you', 'controversial_finish', 'clean_dominance', 'i_beat_you', 'you_beat_me'];
    const used = [];
    for (const kind of order) {
      const h = hs.find((x) => x.kind === kind);
      if (!h || used.length >= 2) continue;
      if (['respect', 'tribute', 'apology', 'inspire'].includes(tone) && ['old_insult', 'broken_promise'].includes(kind) && tone !== 'apology') continue;
      const refs = h.refs.filter(Boolean);
      const text = {
        broken_promise: `Some of you remember I once said "${h.text}". I did not deliver. I own that.`,
        old_insult: h.quote ? `You called me out with "${h.quote}" - I have not forgotten.` : 'I have not forgotten the things said between us.',
        you_betrayed_me: `You betrayed me, ${tn}. That is a debt, not a memory.`,
        i_betrayed_you: `I turned on you once, ${tn}. I know what that cost between us.`,
        controversial_finish: `Last time ended in controversy, ${tn}. This time there will be no doubt.`,
        clean_dominance: `I beat you clean ${h.n} times, ${tn}. Clean.`,
        i_beat_you: `I have beaten you ${h.n === 1 ? 'before' : h.n + ' times'}, ${tn}.`,
        you_beat_me: `${tn}, you have beaten me ${h.n === 1 ? 'once' : h.n + ' times'}. I remember every one.`,
      }[kind];
      lines.push({ text, refs, kind }); used.push(kind);
    }
  }
  const claimDef = CLAIMS[claim] ? claim : 'none';
  const promises = [];
  if (claimDef === 'win_match' && target) { promises.push({ kind: 'win_match', target: targetId, text: `I will beat ${tn}`, deadlineDay: career.day + 150 }); lines.push({ text: `I promise this: I will beat you, ${tn}.`, refs: [], promise: true }); }
  if (claimDef === 'win_streak') { promises.push({ kind: 'win_streak', params: { n: 5 }, text: 'I will win five in a row', deadlineDay: career.day + 120 }); lines.push({ text: 'Five wins in a row. Mark my words.', refs: [], promise: true }); }
  if (claimDef === 'win_rumble') { const y = year || career.year + (career.day % 365 > 40 ? 1 : 0); promises.push({ kind: 'win_rumble', params: { year: y }, text: `I will win the ${y} Royal Rumble`, deadlineDay: career.day + 420 }); lines.push({ text: `I guarantee I will win the ${y} Royal Rumble.`, refs: [], promise: true }); }
  if (claimDef === 'win_title') { promises.push({ kind: 'win_title', text: 'I will win a championship', deadlineDay: career.day + 365 }); lines.push({ text: 'I will be champion. Nothing will stop me.', refs: [], promise: true }); }
  lines.push({ text: pick(CLOSE, seed + 'c'), refs: [] });
  const out = career.record({
    key, category: 'promo', type: 'promo_delivered', participants: [p.id, ...(targetId ? [targetId] : [])],
    refs: [...new Set(lines.flatMap((l) => l.refs))].filter((id) => career.memory.ledger.get(id)),
    summary: `${p.name} cut a ${tone} promo${target ? ` on ${target.name}` : ''} (${quality}/100)${claimDef !== 'none' ? ` and made a promise` : ''}.`, importance: viral || quality >= 85 ? 4 : 3,
    data: { tone, targets: targetId ? [targetId] : [], quality, viral, context, line: lines[0].text, promises, claim: claimDef, exposedWeakness: memBonus >= 8 && ['insult', 'humiliate'].includes(tone) },
  });
  // popularity effect
  p.popularity = clamp(p.popularity + (quality - 50) / 120 + (viral ? 1.5 : 0), 0, 100);
  let reaction = null;
  if (target && tdef.needsTarget) {
    const mood = { insult: 'is furious', humiliate: 'is livid and wants revenge', challenge: 'accepts the challenge', threat: 'is rattled but defiant', respect: 'returns the respect', tribute: 'is touched', apology: 'is willing to move on' }[tone];
    reaction = `${target.name} ${mood}.`;
  }
  career.checkMilestones();
  return { quality, viral, lines, event: out.event, unlocked: out.unlocked, reaction, duplicate: out.duplicate };
}
