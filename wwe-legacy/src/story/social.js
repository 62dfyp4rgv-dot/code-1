// Social media: a short-form feed that reacts to the career and lets the player post.
//   - The FEED is a pure view derived from the ledger (fan reactions to results, rivals taking shots, media headlines, the
//     player's own posts). It stores nothing, so it can never disagree with the record, and every item cites its events.
//   - POSTING is the only thing that writes: one `social_post` event (rules.js turns callouts into heat, stats count posts,
//     the achievements that already watch `social_post` can fire).
import { hash53, clamp } from '../core/util.js';
import SP from './social_pack.js';
import { gainPop } from '../career/pace.js';
import { memoryLines } from './dialogue.js';

export const POST_TONES = {
  gratitude: { label: 'Thank the fans', desc: 'Warm and simple. Safe for faces, a little off-brand for heels.', needsTarget: false, fit: { face: 9, heel: -7, tweener: 2 },
    lines: ['Still can\'t believe how loud it has been lately. Thank you, every one of you.', 'To everyone who bought a ticket, drove through traffic, held up a sign: this one\'s for you.', 'Signed 200 autographs and my hand still works. Barely. Thank you.', 'You pay attention to the small stuff. I notice. Thank you.', 'Nobody does this alone. Thank you for being part of it.'] },
  hype: { label: 'Hype the next show', desc: 'Build the card and sell the match.', needsTarget: false, fit: { face: 4, heel: 4, tweener: 4 },
    lines: ['{event} is coming. Clear your calendar and charge your phone.', 'Tickets are moving for {event}. If you want a story to tell, be there.', 'Weeks of prep, one night to prove it. {event}.', 'Whatever you think happens at {event}, you are wrong. Come find out why.', 'I do not make promises I cannot film. {event}: watch.'] },
  training: { label: 'Share a training clip', desc: 'Show the work. Always lands a little.', needsTarget: false, fit: { face: 5, heel: 3, tweener: 5 },
    lines: ['5 a.m. Cold gym. Warm coffee. Nobody watching. Yet.', 'Another hour on the bag, another hour closer to the next one.', 'They see the entrance. They do not see this.', 'Back at it. The ring does not care how I feel, so neither do I.', 'Rep 200. Nobody counts but me.'] },
  callout: { label: 'Call out a rival', desc: 'Public challenge. Feeds the rivalry.', needsTarget: true, fit: { face: 2, heel: 6, tweener: 4 }, heat: 7,
    lines: ['{t}, you have been quiet. Say something, or step in the ring.', 'Dear {t}: any time, any place. I\'ll even bring the pen to sign the paperwork.', 'Everybody keeps asking when {t} and I settle this. Ask {t}.', '{t} knows exactly what I am talking about. The rest of you will find out.', 'Reply to this, {t}. I can wait. I\'ve been waiting.'] },
  mock: { label: 'Mock a rival', desc: 'Savage and funny. Big upside, real heat, real backlash risk.', needsTarget: true, fit: { face: -6, heel: 9, tweener: 3 }, heat: 12, risky: true,
    lines: ['Heard {t} is "preparing" for me. Adorable. Bring snacks.', 'Fun fact about {t}: my warm-up looks harder than the whole match.', 'Hot take: {t} is exactly as good as the highlight reel and not one second longer.', 'Has anybody seen {t}\'s plan? Asking for the fans.', 'I\'d say good luck to {t}, but I\'m not a liar.'] },
  respect: { label: 'Salute an opponent', desc: 'Public respect. Opponents remember it.', needsTarget: true, fit: { face: 8, heel: -5, tweener: 4 }, respect: 6,
    lines: ['Respect to {t}. That was a real fight. Nobody gets that out of me for free.', 'Say what you want about the result: {t} made me earn every second.', 'Tonight taught me something about {t}. I\'ll carry it.', 'Shook hands with {t}. Some of you needed to see it.', 'If you want to know what a pro looks like, watch {t} work.'] },
  apology: { label: 'Apologise publicly', desc: 'Own a mistake. Quiet, risky, sometimes exactly right.', needsTarget: false, fit: { face: 6, heel: -9, tweener: 2 },
    lines: ['I said something I should not have. I\'m sorry. I\'ll do better.', 'I got it wrong. No excuses, no spin. Sorry.', 'I let my mouth write a check I can\'t cash. I apologise.', 'To the people I let down this week: I heard you. I\'m sorry.', 'Taking a day to think. Back stronger, and sorrier.'] },
  behind: { label: 'Behind the scenes', desc: 'Backstage candid. Fans love access.', needsTarget: false, fit: { face: 4, heel: 2, tweener: 5 },
    lines: ['Catering is not what you think it is. It is worse. Send help.', 'Eleven hours on a bus, one hour in the ring. Worth every mile.', 'Found my old boots in the bag. They have seen things.', 'The locker room is quieter than you would guess before the bell. Then it is not.', 'Ring crew puts in the hardest shift of anyone. Say thanks next time you see one.'] },
  community: { label: 'Community & charity', desc: 'Do some good and let people see it.', needsTarget: false, fit: { face: 8, heel: -4, tweener: 3 },
    lines: ['Spent the afternoon at the children\'s hospital. They gave me more than I gave them.', 'Donating this week\'s merch money to the local gym kids. Go be loud for them.', 'Met a fan who has been watching since the first show. Made my week.', 'Free training session for kids this weekend. Bring a friend.', 'Reminder: the best part of this job is the people at the barricade.'] },
};

/** follower count as a smooth function of popularity (popularity is 0-100) */
export function followersOf(player) { return Math.round(1200 * Math.pow(1.105, clamp(player.popularity, 0, 100))); }

const RECENT_MOOD_EVENTS = ['match_result', 'title_win', 'title_loss', 'title_defense', 'promo_delivered', 'interview', 'social_post', 'betrayal', 'rumble_result'];
/** how the fans currently feel, from the last results and public statements: { score -100..100, label, refs } */
export function fanMood(career) {
  const evs = career.memory.ledger.query({ types: RECENT_MOOD_EVENTS, scope: 'player', newestFirst: true, limit: 12 });
  let score = 0, n = 0; const refs = [];
  for (const e of evs) {
    const d = e.data; let v = 0;
    if (e.type === 'match_result') v = d.result === 'win' ? 12 : d.result === 'loss' ? -9 : 0;
    else if (e.type === 'title_win' || e.type === 'rumble_result' && d.won) v = 25;
    else if (e.type === 'title_loss') v = -12;
    else if (e.type === 'title_defense') v = 8;
    else if (e.type === 'promo_delivered' || e.type === 'interview') v = ((d.quality ?? 50) - 50) / 3;
    else if (e.type === 'social_post') v = (d.quality ?? 50) >= 55 ? 5 : -5;
    else if (e.type === 'betrayal') v = -15;
    score += v * (1 - n * 0.06); n++; refs.push(e.id);
  }
  score = Math.round(clamp(score, -100, 100));
  const label = score >= 55 ? 'Adoring' : score >= 20 ? 'Supportive' : score > -15 ? 'Mixed' : score > -45 ? 'Restless' : 'Hostile';
  return { score, label, refs: refs.slice(0, 6) };
}

export function socialOptions(career) {
  const days = recentPostDays(career);
  const today = days.includes(career.day);
  const week = days.filter((d) => career.day - d < 7).length;
  return {
    tones: POST_TONES, followers: followersOf(career.player), mood: fanMood(career),
    canPost: !today && week < 4, why: today ? 'You already posted today.' : week >= 4 ? 'Your agent asks you to log off for a few days.' : null,
  };
}
function recentPostDays(career) {
  return career.memory.ledger.query({ types: ['social_post'], scope: 'player', newestFirst: true, limit: 8 }).map((e) => e.day);
}

/** write a post. Returns { text, quality, likes, shares, viral, event, unlocked, reaction } */
export function postToSocial(career, { tone, targetId = null, nextEvent = null } = {}) {
  const tdef = POST_TONES[tone];
  if (!tdef) throw new Error(`unknown post tone ${tone}`);
  if (tdef.needsTarget && !targetId) throw new Error(`${tone} needs a target`);
  if (tone === 'respect' && !((career.stats.s.opponents[targetId] || {}).matches)) throw new Error('You can only salute someone you have actually faced.');
  const opt = socialOptions(career);
  if (!opt.canPost) throw new Error(opt.why);
  const p = career.player, target = targetId ? (career.universe ? career.universe.get(targetId) : null) || { name: String(targetId) } : null;
  const idx = (career.flags.postSeq = (career.flags.postSeq || 0) + 1);
  const key = `social:${career.day}:${idx}`;
  const mood = opt.mood;
  const last = career.memory.ledger.query({ types: ['match_result', 'title_win'], scope: 'player', newestFirst: true, limit: 1 })[0];
  const hot = last && career.day - last.day <= 7 && (last.type === 'title_win' || last.data.result === 'win') ? 7 : 0;
  const quality = Math.round(clamp(28 + p.charisma * 0.28 + p.mic * 0.18 + (p.confidence - 50) * 0.1 + (tdef.fit[p.alignment] || 0) + hot + (mood.score > 20 ? 3 : mood.score < -15 ? -3 : 0) + career.rng.range(-9, 11), 5, 99));
  const followers = followersOf(p);
  const reach = 0.018 + quality / 100 * 0.07; // share of followers who engage
  const likes = Math.round(followers * reach * (0.8 + career.rng.next() * 0.4));
  const viral = quality >= 86 && career.rng.chance(0.4);
  const shares = Math.round(likes * (viral ? 0.9 : 0.12));
  const tn = target ? target.name : '';
  const raw = tdef.lines[parseInt(hash53(`${key}:${tone}`), 36) % tdef.lines.length];
  const text0 = raw.replace(/\{t\}/g, target ? target.name.split(' ').slice(-1)[0] : 'you').replace(/\{event\}/g, nextEvent ? (nextEvent.displayName || nextEvent.name) : 'the next show');
  const text = text0.charAt(0).toUpperCase() + text0.slice(1);
  const backlash = tdef.risky && quality < 45;
  const out = career.record({
    key, category: 'media', type: 'social_post', participants: [p.id, ...(targetId ? [targetId] : [])],
    summary: `${p.name} posted${target ? ` about ${tn}` : ''}: "${text}"`, importance: viral ? 3 : 1,
    data: { tone, targets: targetId ? [targetId] : [], quality, likes, shares, followers, viral, backlash, text },
  });
  let delta = (quality - 50) / 160 + (viral ? 1.2 : 0) - (backlash ? 0.6 : 0);
  gainPop(p, delta);
  if (backlash) p.confidence = clamp(p.confidence - 2, 0, 100);
  else if (quality >= 70) p.confidence = clamp(p.confidence + 1, 0, 100);
  let reaction = viral ? 'It takes off. Everyone is talking about it.' : backlash ? 'It lands badly. The replies are not kind.' : quality >= 70 ? 'It does well: strong engagement.' : quality >= 45 ? 'A decent reaction.' : 'It sinks without a trace.';
  career.checkMilestones();
  return { text, quality, likes, shares, viral, backlash, event: out.event, unlocked: out.unlocked, reaction, duplicate: out.duplicate };
}

// ------------------------------------------------------------------ the feed (derived, never stored)
const HANDLES = ['ringsidemarcus', 'belt_and_braces', 'heelturnhannah', 'the_third_row', 'suplexsundays', 'dave_from_dayton', 'crowdnoise_cat', 'chairshot_charlie', 'the_hard_camera', 'rope_a_dope_ron', 'tagteamtina', 'mat_rat_mike', 'pinfall_priya', 'arena_alex', 'brass_ring_bea', 'nosebleed_nate'];
const MEDIA = ['The Squared Circle', 'Ringside Report', 'Heel Turn Radio', 'Mat Talk Daily', 'The Hard Camera'];
const hp = (arr, seed) => arr[parseInt(hash53(seed), 36) % arr.length];
const lastName = (n) => String(n || '').split(' ').slice(-1)[0];
const FAN = {
  win_clean: ['{p} just wiped the floor with {o}. Clean, no argument.', 'Can we talk about {p} tonight? {o} never had an answer.', 'That finish from {p}!! Called it from the opening bell.', 'Replaying the {p} vs {o} finish. Perfect execution.'],
  win_close: ['{p} survived that against {o}. My heart is not okay.', 'That was too close, {p}!! Take the win and breathe.', 'I do not know how {p} got out of that. I do not care. Win is a win.'],
  win_dirty: ['Not sure that finish from {p} was entirely honest, but I loved every second.', '{p} did what {p} had to do to beat {o}. No notes.'],
  loss: ['Tough night for {p} against {o}. Back on the horse.', '{o} had {p}\'s number tonight. Credit where due.', 'Come on {p}, shake it off. The next one is yours.', 'That loss to {o} stings. I will be there for the rematch.'],
  loss_boo: ['{p} lost to {o} and honestly deserved it.', 'Told you {o} had {p} figured out.'],
  draw: ['No winner between {p} and {o}. I want the rematch yesterday.'],
  title: ['{p} IS THE CHAMPION!!! I am screaming in my living room.', 'New champion. {p}. Write it down.', 'The {t} belongs to {p}. Never doubted it. (Doubted it a little.)'],
  title_loss: ['{p} lost the {t}. It happens to the best. Come back stronger.'],
  promo: ['That {p} promo was lights out.', '{p} just said what everyone was thinking.', 'Whoever writes {p}\'s promos deserves a raise. (They write their own. Wow.)'],
  promo_bad: ['{p} promo did not land tonight. Next time.', 'Mic work was rough from {p}. Great in the ring, though.'],
  interview_bad: ['The {p} interview was a little stiff. Hopefully a better night next time.', 'Not {p}\'s best interview, but a rough question is a rough question.', 'Wanted more from {p} on the couch. They are better in the ring.', 'That {p} interview went nowhere. Let us move on.', 'Awkward one from {p}. Everyone has an off day on camera.'],
  interview: ['Watching the {p} interview. Honest and sharp.', '{p} on the couch with the host is the most interesting thing on TV this week.'],
};
for (const k of Object.keys(FAN)) FAN[k] = [...(SP.fan[k] || []), ...FAN[k]]; // authored pack first, the original short pools stay as extra variety
const fill = (s, m) => s.replace(/\{p\}/g, m.p).replace(/\{o\}/g, m.o || 'them').replace(/\{t\}/g, m.t || 'title');

/** The feed, newest first: [{ id, day, date, kind, author, text, likes, refs, tone? }] */
export function socialFeed(career, { limit = 14, nameOf = (id) => id } = {}) {
  const L = career.memory.ledger, me = career.player.id, pn = lastName(career.player.name) || career.player.name;
  const followers = followersOf(career.player);
  const items = [];
  const likeBase = (seed, mult = 1) => Math.round(followers * (0.006 + (parseInt(hash53(seed), 36) % 40) / 4000) * mult);
  const evs = L.query({ scope: 'player', newestFirst: true, limit: 60 }).filter((e) => ['match_result', 'title_win', 'title_loss', 'promo_delivered', 'interview', 'social_post', 'betrayal', 'rumble_result'].includes(e.type));
  for (const e of evs) {
    const d = e.data;
    if (e.type === 'social_post') {
      items.push({ id: e.id, day: e.day, date: e.date, kind: 'player', author: { name: career.player.name, handle: 'you' }, text: d.text, likes: d.likes, shares: d.shares, viral: d.viral, refs: [e.id] });
      continue;
    }
    // in a multi-way or tag loss the person to name is the winner, not whoever is first on the card
    const oppId = d.result === 'loss' && d.winner && d.winner !== me ? d.winner : (d.opponents || [])[0];
    const on = oppId ? lastName(nameOf(oppId)) : '';
    const m = { p: pn, o: on, t: d.titleName || 'title' };
    let kind = null, pool = null, mkey = null;
    if (e.type === 'match_result') {
      if (d.result === 'win') { mkey = 'win'; pool = (d.finish === 'dq' && d.dqBy === me) ? FAN.win_dirty : (d.clean && !d.comeback) ? FAN.win_clean : FAN.win_close; kind = 'fan'; }
      else if (d.result === 'loss') { mkey = 'loss'; pool = (parseInt(hash53(e.id), 36) % 4 === 0) ? FAN.loss_boo : FAN.loss; kind = 'fan'; }
      else { mkey = null; pool = FAN.draw; kind = 'fan'; }
    } else if (e.type === 'title_win') { mkey = 'title'; pool = FAN.title; kind = 'fan'; m.t = d.titleName || d.name || 'title'; }
    else if (e.type === 'title_loss') { mkey = 'title_loss'; pool = FAN.title_loss; kind = 'fan'; m.t = d.titleName || d.name || 'title'; }
    else if (e.type === 'promo_delivered') { mkey = 'promo'; pool = (d.quality ?? 50) >= 55 ? FAN.promo : FAN.promo_bad; kind = 'fan'; }
    else if (e.type === 'interview') { pool = (d.quality ?? 50) >= 55 ? FAN.interview : FAN.interview_bad; kind = 'fan'; }
    if (!pool) continue;
    // every fourth reaction comes from a media account instead, as a headline
    const media = parseInt(hash53(`m${e.id}`), 36) % 4 === 0 && e.type !== 'interview' && !!mkey;
    const text = fill(hp(media && mkey && SP.media[mkey] ? SP.media[mkey] : pool, `${e.id}:t`), m);
    items.push({ id: e.id, day: e.day, date: e.date, kind: media ? 'media' : 'fan', author: media ? { name: hp(MEDIA, `${e.id}:a`), handle: 'news' } : { name: `@${hp(HANDLES, `${e.id}:h`)}`, handle: 'fan' }, text, likes: likeBase(e.id, media ? 3 : 1), refs: [e.id] });
  }
  // rivals taking shots: a line of real history, in the rival's own voice, shown once per rival per few days
  const rivals = Object.values(career.memory.world.rivalries).filter((r) => (r.a === me || r.b === me) && r.heat >= 18 && r.status !== 'resolved').sort((a, b) => b.heat - a.heat).slice(0, 3);
  for (const r of rivals) {
    const other = r.a === me ? r.b : r.a;
    const lines = memoryLines(career.memory, me, other, nameOf(other), { speaker: 'other', max: 1, allow: ['you_beat_me', 'i_beat_you', 'clean_losses', 'clean_dominance', 'old_insult', 'controversial_finish', 'you_betrayed_me', 'i_betrayed_you'] });
    if (!lines.length) continue;
    const ref = lines[0].refs[lines[0].refs.length - 1];
    const ev = ref && L.get(ref);
    items.push({ id: `rival:${other}:${ref}`, day: ev ? ev.day + 1 : career.day - 1, date: ev ? ev.date : '', kind: 'rival', author: { name: nameOf(other), handle: 'rival', id: other }, text: lines[0].text, likes: likeBase(`${other}:${ref}`, 1.5), refs: lines[0].refs });
  }
  const byDay = (a, b) => b.day - a.day || (a.id < b.id ? 1 : -1);
  // rival shots point at old history, so they would always sort below the newest reactions: reserve room for them
  const rivalItems = items.filter((x) => x.kind === 'rival').sort(byDay).slice(0, 2);
  const rest = items.filter((x) => x.kind !== 'rival').sort(byDay).slice(0, Math.max(0, limit - rivalItems.length));
  return [...rest, ...rivalItems].sort(byDay);
}
