// Commentary: turns structured engine events into prose. Strictly one-way (event -> text).
// Variants are chosen by hashing the event sequence number, never by the simulation RNG, so narration
// can never influence an outcome. Callbacks ("again", "third time", "keeps working the leg") are
// derived by scanning EARLIER events only, so replaying a saved match yields identical prose.
import PACK from './commentary_pack.js';
const H = (q, salt) => { let x = (q * 2654435761 + salt * 40503) >>> 0; x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; x ^= x >>> 13; return x >>> 0; };
const pick = (arr, q, salt = 1) => arr[H(q, salt) % arr.length];
const PRON = { M: ['he', 'him', 'his', 'himself'], F: ['she', 'her', 'her', 'herself'] };
const pron = (state, id) => PRON[state.fighters[id] && state.fighters[id].gender] || ['they', 'them', 'their', 'themselves'];
const CONNECT_KEY = { strike_light: 'connected_strike', strike_heavy: 'connected_strike', grapple: 'connected_grapple', power: 'connected_power', aerial: 'connected_aerial',
  technical: 'connected_technical', combo: 'connected_combo', corner: 'connected_corner', environmental: 'connected_weapon', illegal: 'connected_dirty' };
const PLURAL_VERB = { pays: 'pay', takes: 'take', is: 'are', was: 'were', has: 'have', goes: 'go', feels: 'feel', gives: 'give', hurts: 'hurt', buckles: 'buckle', bears: 'bear' };
const SING_TO_PLURAL = { rattles: 'rattle', knocks: 'knock', lands: 'land', connects: 'connect', hits: 'hit', sends: 'send', drives: 'drive', finds: 'find', crashes: 'crash', snaps: 'snap', catches: 'catch', rocks: 'rock', shakes: 'shake', staggers: 'stagger', takes: 'take', is: 'are', was: 'were', has: 'have', turns: 'turn', leaves: 'leave', echoes: 'echo', sets: 'set', does: 'do', looks: 'look', stings: 'sting', thuds: 'thud', cracks: 'crack', rings: 'ring', wears: 'wear', stops: 'stop', goes: 'go', proves: 'prove', hurts: 'hurt', lands_: 'land', rips: 'rip', lifts: 'lift', slams: 'slam' };
const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ord = (n) => ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'][n] || `${n}th`;

// verbs by move category: how the move "lands"
const VERB = {
  strike_light: ['snaps', 'cracks', 'lands', 'whips', 'stings'],
  strike_heavy: ['crunches', 'blasts', 'cracks', 'detonates', 'smashes'],
  combo: ['unloads on', 'rattles', 'works over', 'peppers'],
  grapple: ['wrenches', 'hauls over', 'drags down', 'twists'],
  technical: ['picks apart', 'catches', 'cinches', 'snaps on'],
  power: ['slams', 'drives', 'hurls', 'muscles'],
  corner: ['batters', 'pins in the corner and hammers', 'traps'],
  aerial: ['flies into', 'launches onto', 'crashes down on'],
  environmental: ['clubs', 'smashes', 'bludgeons'],
  illegal: ['sneaks in a shot on', 'gets dirty with'],
  submission: ['cinches', 'locks onto'],
  positioning: ['sets up', 'manoeuvres'],
};
const IMPACT_TAIL = {
  devastating: ['That one hurt.', 'The sound echoes through the arena.', 'Nobody walks that off.', 'The crowd winces.'],
  clean: ['Textbook.', 'Crisp and precise.', 'Perfectly timed.', ''],
  solid: ['', '', 'That got through.', ''],
};

function earlier(state, ev, pred, limit = 400) {
  let n = 0;
  for (const e of state.events) { if (e.seq >= ev.seq) break; if (pred(e)) n++; if (n > limit) break; }
  return n;
}

function narrateRaw(state, ev, bump = 0) {
  const text = narrateCore(state, ev, bump);
  if (!text || !ev.moveName) return text;
  // subject-verb agreement for plural move names ("the Stomps rattles" -> "the Stomps rattle"), whichever template produced the line
  const rawMv = ev.moveName, ownerLast = String(state.fighters[ev.actor] ? state.fighters[ev.actor].name : '').split(' ').slice(-1)[0];
  const mvPlain = rawMv.startsWith(`${ownerLast}'s `) ? rawMv.slice(ownerLast.length + 3) : rawMv;
  if (!(/[^s]s$/.test(mvPlain) && !/ss$/.test(mvPlain))) return text;
  return text.replace(new RegExp(`(${esc(mvPlain)}(?: from [A-Z][\\w'-]+)?) (\\w+)\\b`, 'g'), (m, head, v) => (SING_TO_PLURAL[v] ? `${head} ${SING_TO_PLURAL[v]}` : m));
}

function narrateCore(state, ev, bump = 0) {
  const nm = (id) => (id && state.fighters[id] ? state.fighters[id].name : 'Someone');
  const last = (id) => nm(id).split(' ').slice(-1)[0];
  const a = nm(ev.actor), t = nm(ev.target), aL = last(ev.actor), tL = last(ev.target);
  const q = (ev.seq || 0) + bump * 7919;
  // signature moves are named "<Surname>'s Move": never print "Vale's Vale's Move", and swap the owner's own name for a pronoun
  const rawMv = ev.moveName || 'a move';
  const ownerLast = last(ev.actor);
  const mvPlain = rawMv.startsWith(`${ownerLast}'s `) ? rawMv.slice(ownerLast.length + 3) : rawMv;
  const mv = rawMv;
  const myMv = rawMv.startsWith(`${ownerLast}'s `) ? `${pron(state, ev.actor)[2]} ${mvPlain}` : `the ${rawMv}`;
  const plural = /[^s]s$/.test(mvPlain) && !/ss$/.test(mvPlain);
  const art = (adj) => (plural ? adj : `${/^[aeiou]/i.test(adj) ? 'an' : 'a'} ${adj}`);
  const [, , posA, selfA] = pron(state, ev.actor);
  // cycle through variants for repeated event types so the same line never appears twice in a row
  const cyc = (arr, salt) => arr[(H(0, salt) + bump + earlier(state, ev, (e) => e.type === ev.type, 600)) % arr.length];
  const the = (m) => (/^(the|a|an|his|her|their)\b/i.test(m) ? m : `the ${m}`);
  const late = state.timeLimit ? (ev.t || 0) / state.timeLimit > 0.7 : false;
  // authored prose pack (src/match/commentary_pack.js): lines use {a} {aL} {t} {tL} {mv} {part} {adj} {pos} {self} {tpos} {tself}
  const ctx = { a, aL, t, tL, mv: myMv, part: ev.part || 'body', adj: ev.quality === 'devastating' ? 'devastating' : ev.quality === 'clean' ? 'clean' : 'solid', pos: posA, self: selfA, tpos: pron(state, ev.target)[2], tself: pron(state, ev.target)[3] };
  const fixAgree = (t) => (plural ? t.replace(new RegExp(`(${esc(mvPlain)}(?: from [A-Z][\\w'-]+)?) (\\w+)\\b`, 'g'), (m, head, v) => (SING_TO_PLURAL[v] ? `${head} ${SING_TO_PLURAL[v]}` : m)) : t);
  const fill = (line) => fixAgree(line.replace(/\{(\w+)\}/g, (_, k) => (ctx[k] === undefined ? '' : ctx[k])))
    .replace(/\b(legs|arms) (pays|takes|is|was|has|goes|feels|gives|hurts|buckles|bears)\b/g, (_, n, v) => `${n} ${PLURAL_VERB[v]}`) // body parts: 'legs' and 'arms' are plural
    .replace(/(^|[.!?]["']?\s+)([a-z])/g, (_, pre, ch) => pre + ch.toUpperCase()); // "the Big Boot" opening a sentence
  const packLines = (key) => (PACK[key] || []).map(fill);
  /** choose among pack lines for `key` (falling back to the built-in lines); `rotate` cycles so a repeat never lands twice in a row */
  const say = (key, legacy, salt, rotate = false) => {
    const arr = packLines(key);
    const all = arr.length ? arr : legacy;
    return rotate ? all[(H(0, salt) + bump + earlier(state, ev, (e) => e.type === ev.type, 600)) % all.length] : all[H(q, salt) % all.length];
  };
  const tpos0 = pron(state, ev.target)[2] ? `${pron(state, ev.target)[2]} ` : '';
  const POSITION = {
    whip_corner: [`${a} whips ${t} hard into the corner.`, `${aL} sends ${tL} crashing into the turnbuckles.`],
    pick_up: [`${a} hauls ${t} back to ${tpos0}feet.`, `${aL} drags ${tL} upright by the hair, then the arm.`],
    drag_up_corner: [`${a} drags ${t} toward the corner.`, `${aL} pulls ${tL} to the corner by the wrist.`],
    climb_top: [`${a} climbs to the top rope.`, `${aL} scales the turnbuckle and looks down at ${tL}.`],
    toss_outside: [`${a} tosses ${t} out of the ring.`, `${aL} heaves ${tL} over the top rope to the floor.`],
    follow_outside: [`${a} follows ${t} out to the floor.`, `${aL} slides under the bottom rope in pursuit.`],
    drag_out: [`${a} drags ${t} out by the ankle.`, `${aL} yanks ${tL} out of the ring by the leg.`],
    roll_in: [`${a} rolls ${t} back into the ring.`, `${aL} shoves ${tL} under the bottom rope.`],
  };
  const posLine = (alts, salt) => alts[(H(0, salt) + bump + earlier(state, ev, (e) => e.type === ev.type && e.cat === 'positioning', 600)) % alts.length];
  const positioning = ev.cat === 'positioning' && POSITION[ev.move];
  if (ev.move === 'knock_off' && ['move_blocked', 'move_dodged', 'move_reversed'].includes(ev.type)) {
    return pick({ move_blocked: [`${aL} lunges to pull ${tL} down, but ${tL} holds on.`, `${tL} grips tight and will not be knocked off.`], move_dodged: [`${t} swings clear of ${aL}'s grab.`, `${aL} grabs at ${tL} and finds only air.`], move_reversed: [`${t} shoves ${aL} away from the climb instead!`, `${tL} twists free and sends ${aL} staggering.`] }[ev.type], q, 70);
  }
  switch (ev.type) {
    case 'move_connected': {
      if (ev.move === 'toss_over') return pick([`${a} gets both hands on ${t} and heaves toward the top rope!`, `${aL} hoists ${tL} up and drives for the top rope!`, `${aL} muscles ${tL} up to the top rope - ${tL} is teetering!`], q, 61);
      const verb = pick(VERB[ev.cat] || ['hits'], q, 2);
      const dirty = ev.cat === 'illegal' || ev.cat === 'environmental';
      const tail = dirty || H(q, 3) % 3 ? '' : pick(IMPACT_TAIL[ev.quality] || [''], q, 3);
      const again = earlier(state, ev, (e) => e.type === 'move_connected' && e.actor === ev.actor && e.move === ev.move) + 1;
      const part = earlier(state, ev, (e) => e.type === 'move_connected' && e.target === ev.target && e.part === ev.part && e.seq > ev.seq - 14) + 1;
      if (ev.move === 'knock_off') return pick([`${a} yanks ${t} off the climb with a hard shove!`, `${aL} drives ${tL} off the rungs - a nasty fall!`, `${aL} grabs ${tL} by the legs and pulls ${tL} down from the climb!`], q, 71);
      if (ev.cat !== 'positioning' && state.rules.cell && H(q, 77) % 4 === 0) return pick([`${a} slams ${t} into the steel of the cell with ${the(mvPlain)}!`, `${aL} uses the cell wall: ${the(mvPlain)} on ${tL}, and the cage shudders.`, `There is nowhere to run inside the cell: ${the(mvPlain)} from ${aL} hits ${tL} hard.`, `${aL} drags ${tL} against the steel and lands ${the(mvPlain)}.`], q, 78);
      if (ev.cat !== 'positioning' && again >= 3 && H(q, 9) % 3 === 0) return `${a} goes back to ${the(mvPlain)} for the ${ord(again)} time, and ${tL} still has no answer.`;
      if (part >= 3 && ev.part && ev.part !== 'torso' && H(q, 8) % 4 === 0) return `${aL} keeps going after the ${ev.part} with ${the(mvPlain)}. ${tail}`.trim();
      if (ev.cat === 'positioning') return positioning ? posLine(POSITION[ev.move], 50) : cyc([`${aL} sets up the next spot.`, `${a} changes position.`, `${aL} moves into position.`], 50);
      if (ev.cat === 'submission') return cyc([`${a} applies ${the(mvPlain)} to ${tL}'s ${ev.part}.`, `${aL} grinds ${the(mvPlain)} into ${tL}.`], 51);
      const adj = ev.quality === 'devastating' ? 'devastating' : dirty ? 'nasty' : ev.quality === 'clean' ? 'clean' : 'solid';
      const recoilTail = ev.selfDamage > 0 ? ` ${pick([`${aL} feels that one too.`, `The impact rattles ${aL} as well.`, `${aL} pays for it with a wince.`, `It hurts ${aL} nearly as much.`], q, 62)}` : '';
      return say(CONNECT_KEY[ev.cat], [
        `${a} ${verb} ${t} with ${art(adj)} ${mvPlain}. ${tail}`,
        `${mvPlain} from ${a}, and it connects with ${tL}'s ${ev.part}. ${tail}`,
        `${tL} takes ${art(adj)} ${mvPlain} from ${aL}. ${tail}`,
        `${art(adj)[0].toUpperCase()}${art(adj).slice(1)} ${mvPlain}! ${aL} ${verb} ${tL}. ${tail}`,
        `${aL} finds the opening: ${mvPlain} to the ${ev.part}.${late ? ' Every shot counts now.' : ''} ${tail}`,
        `${mvPlain}. ${tL} feels that one in the ${ev.part}. ${tail}`,
      ], 4, true).trim() + recoilTail;
    }
    case 'signature_connected': return say('signature', [
      `${a} hits ${mv}! The crowd erupts.`, `That's ${aL}'s signature - ${mv} drives into ${tL}!`, `${mv}! ${aL} has been saving that.`,
      `There it is: ${mv}! ${tL} is shaken to the core.`, `${aL} connects with ${mv} and the building comes alive.`,
    ], 5, true);
    case 'finisher_connected': return say('finisher', [
      `${a} hits ${mv}!! This could be it!`, `${mv}!! ${tL} is laid out.`, `${aL} hits the finish - ${mv}! Cover coming?`,
      `${mvPlain}!!! ${tL} did not see that coming.`, `Everything ${aL} had went into that ${mv}!`,
    ], 6, true);
    case 'move_blocked': if (ev.move === 'toss_over') return pick([`${t} hooks a leg around the middle rope and will not go over!`, `${tL} hangs on to the top rope and refuses to be tossed.`, `${aL} cannot get ${tL} over - ${tL} digs in.`], q, 63);
      if (ev.cat === 'positioning') return posLine([`${tL} refuses to be moved.`, `${t} plants ${tpos0}feet and shuts the attempt down.`, `${aL} cannot force the issue; ${tL} holds ${tpos0}ground.`], 56);
      return say('blocked', [
      `${t} blocks ${myMv}.`, `${a} goes for ${myMv} but ${tL} shuts it down.`, `${tL} reads ${the(mvPlain)} and absorbs it.`,
      `${aL}'s ${mvPlain} is smothered before it gets going.`, `Blocked! ${tL} was ready for ${the(mvPlain)}.`, `${tL} plants and refuses to be moved - ${the(mvPlain)} goes nowhere.`,
    ], 7, true);
    case 'finisher_blocked': return pick([`${t} survives ${a}'s ${mv} attempt by blocking it!`, `${tL} stops ${the(mvPlain)} cold! ${aL} cannot believe it.`], q, 8);
    case 'move_dodged': if (ev.move === 'toss_over') return pick([`${t} slips under the toss and ${aL} nearly goes over instead!`, `${tL} ducks out of the toss at the last second.`], q, 64);
      if (ev.cat === 'positioning') return posLine([`${t} slips away before ${aL} can set up.`, `${tL} wriggles free of the attempt.`, `${aL} grabs at ${tL} and gets nothing.`], 57);
      return say('dodged', [
      `${t} slips away from ${the(mvPlain)}${ev.selfDamage ? ` and ${a} crashes hard` : ''}.`, `${a} misses ${myMv} - ${t} dodged it${ev.selfDamage ? ' and ' + aL + ' is hurt by the miss' : ''}!`,
      `${tL} sidesteps ${the(mvPlain)}${ev.selfDamage ? ', and the miss costs ' + aL : ''}.`, `Nothing but air! ${aL} whiffs on ${myMv}.`, `${tL} ducks ${the(mvPlain)} like it was telegraphed.`,
    ], 9, true);
    case 'finisher_dodged': return pick([`${t} dodges ${a}'s ${mv}! What an escape!`, `${mv} finds nothing! ${tL} slid out of danger.`], q, 10);
    case 'move_reversed': if (ev.move === 'toss_over') return pick([`${t} reverses the toss and turns the tables on ${a}!`, `${tL} blocks the throw and sends ${aL} crashing into the ropes!`], q, 65);
      if (ev.cat === 'positioning') return posLine([`${t} turns the tables on ${aL}'s attempt to take control.`, `${tL} spins out and takes charge instead.`], 58);
      return ev.baited ? `${t} baited ${a} into it and reversed ${the(mvPlain)}!` : say('reversed', [
      `${t} reverses ${myMv} and turns it around!`, `Reversal! ${t} counters ${the(mvPlain)} and hits back.`, `${tL} was waiting for ${the(mvPlain)} - and flips it on ${aL}!`,
      `${aL} tries ${myMv} and gets it turned right back ${pron(state, ev.actor)[0] === 'they' ? 'on them' : 'on ' + pron(state, ev.actor)[1]}!`, `Beautiful counter by ${tL}!`,
    ], 11, true);
    case 'finisher_reversed': return pick([`${t} REVERSES ${a}'s ${mv}!! Unbelievable!`, `${tL} counters the finish! ${aL} is stunned!`], q, 12);
    case 'pin_attempt': return ev.surprise ? pick([`${a} rolls ${t} up for a quick cover!`, `Roll-up! ${aL} steals a cover on ${tL}!`], q, 13) : say('pin_attempt', [
      `${a} hooks the leg and covers ${t}!`, `${aL} goes for the cover!`, `Cover! ${aL} hooks the leg - the ref is down for the count!`, `${aL} drapes an arm over ${tL} and the ref slides in.`,
    ], 14, true);
    case 'pin_count': return H(q - ev.count, 15) % 2 ? `${ev.count}...` : `${ev.count}!`; // one style per pin
    case 'pin_kickout': return ev.nearFall ? say('kickout_near', [
      `KICK OUT at two! ${a} just got a shoulder up - that was close!`, `TWO! ${aL} gets the shoulder up at the last instant!`, `Only two! ${aL} somehow survives!`,
    ], 16, true) : say('kickout', [`${a} kicks out at two.`, `${aL} powers out at two.`, `Out at two! ${aL} is not done.`], 17, true);
    case 'pin_win': if (state.rules.elimination || state.rules.ironMan) return ''; // the 'eliminated' / 'fall' event narrates these
      return say('pin_win', [`One, two, three! ${a} wins by pinfall!`, `Three! That's it - ${aL} gets the pin!`, `The ref's hand hits the mat a third time. ${aL} wins!`], 18, true);
    case 'pin_save': return say('pin_save', [`${a} rushes in and breaks up the pin on ${nm(ev.saved)}!`, `The save! ${aL} dives in to break the count.`], 19, true);
    case 'pin_reversed': return `${a} bridges out and reverses the cover!`;
    case 'pin_broken_dirty': return `${a} gets a thumb in the eye and breaks the count!`;
    case 'pin_no_ref': return `${a} covers ${t} - but the referee is down! No count!`;
    case 'pin_invalid': return `${a} cannot legally pin ${t} right now.`;
    case 'submission_applied': return say('submission_applied', [
      `${a} locks in the ${mv} on ${t}'s ${ev.part}!`, `${mv}! ${aL} has it cinched on ${tL}'s ${ev.part}!`, `${aL} takes ${tL} to the mat and applies the ${mv}.`,
    ], 20, true);
    case 'hold_pressure': return say('hold_pressure', [
      `${a} cranks the hold. ${t} is in trouble.`, `The pressure builds on ${t}'s ${ev.part}.`, `${tL}'s face tells the story - that ${ev.part} is in agony.`,
      `${aL} sinks it in deeper. Is ${tL} going to tap?`, `The referee leans in and checks on ${tL}.`, `${tL} grimaces and shakes ${pron(state, ev.target)[2]} head.`, `${aL} adjusts the grip and squeezes harder.`,
    ], 21, true);
    case 'submission_escape': return say('submission_escape', [`${a} fights free of the ${mv}!`, `${aL} finds a way out of the hold!`, `Escape! ${aL} scrambles loose.`], 22, true);
    case 'hold_reversed': return `${a} reverses the hold and hurts ${t}!`;
    case 'rope_break': return say('rope_break', [`${a} gets to the ropes! Break!`, `Rope break! ${aL} stretches and grabs the bottom rope.`], 23, true);
    case 'crawl_progress': return pick([`${a} drags toward the ropes...`, `Inch by inch, ${aL} crawls for the ropes.`], q, 24);
    case 'submission_win': if (state.rules.elimination || state.rules.ironMan) return '';
      return ev.voluntary ? `${t} taps out to ${a}'s ${mv}!` : say('submission_win', [`${t} taps! ${a} wins by submission!`, `That's it - ${tL} taps out! ${aL} wins!`, `The ref calls for the bell: ${tL} gave up.`], 25, true);
    case 'hold_released': return ev.exhausted ? `${a} is too tired to maintain the hold.` : `${a} releases the hold.`;
    case 'hold_transition': return `${a} rolls the hold into a cover!`;
    case 'hold_slipped': return `${a} loses the grip!`;
    case 'hold_shift': return `${a} re-grips and attacks the ${ev.part}.`;
    case 'demand_submit': return pick([`${a} demands a submission!`, `"Give up!" shouts ${aL}.`], q, 26);
    case 'dq': return `The referee calls for the bell - ${a} is disqualified${ev.moveName ? ' for ' + ev.moveName : ''}!`;
    case 'warning': return `The referee warns ${a} about ${ev.moveName || 'that'} (warning ${ev.count}).`;
    case 'illegal_unseen': return pick([`${a} gets away with ${ev.moveName ? the(ev.moveName) : 'something dirty'} while the ref isn't looking.`, `The ref missed it: ${aL} used ${ev.moveName ? the(ev.moveName) : 'a cheap shot'}.`, `${aL} sneaks in ${ev.moveName ? the(ev.moveName) : 'a cheap shot'} behind the referee's back.`, `Nobody in the black-and-white shirt saw ${ev.moveName ? the(ev.moveName) : 'that'} from ${aL}.`], q, 27);
    case 'count': return pick([`The referee counts ${a} on the floor: ${ev.n}.`, `${ev.n}! ${aL} is still outside!`], q, 28);
    case 'countout': return `${a} fails to beat the count!`;
    case 'tactic': return ev.tactic.startsWith('target_') ? pick([`${a} starts working on the ${ev.tactic.slice(7)}.`, `${aL} has picked a target: the ${ev.tactic.slice(7)}.`], q, 29) : ev.tactic.startsWith('pace_') ? `${a} changes the pace.` : `${a} studies ${nm(ev.target) === 'Someone' ? 'the opponent' : t}.`;
    case 'focus': return pick([`${a} turns on ${t}.`, `${aL} switches targets and goes after ${tL}.`, `${aL} spots ${tL} and changes direction.`], q, 45);
    case 'jump_in': return cyc([`${a} charges back into the thick of it!`, `${aL} has seen enough waiting - back into the fray!`, `${aL} slides in and takes control of the chaos.`, `${aL} is done watching and wades in swinging.`, `${aL} spots an opening and dives back in.`, `Back in comes ${aL}, with a point to prove.`, `${aL} elbows ${selfA} a spot in the melee.`, `${aL} re-enters the ring and the odds change again.`, `The crowd roars as ${aL} climbs back in.`], 46);
    case 'eliminated': if (ev.finish === 'over_the_top') return pick([`${t} goes OVER THE TOP ROPE! ${aL} has eliminated ${tL} - ${ev.remaining === 1 ? 'one left' : ev.remaining + ' left'}!`, `Over the top and out! ${aL} dumps ${tL} to the floor - ${ev.remaining === 1 ? 'one remains' : ev.remaining + ' remain'}.`, `${tL} hits the floor, both feet down - ${tL} is eliminated by ${aL}! ${ev.remaining === 1 ? 'one competitor' : ev.remaining + ' competitors'} left.`, `That's the toss! ${aL} sends ${tL} over the top rope and ${tL} is gone. ${ev.remaining === 1 ? 'one remains' : ev.remaining + ' remain'}.`], q, 66);
      return pick([`${t} is ELIMINATED by ${a}! ${ev.remaining === 1 ? 'one left' : ev.remaining + ' left'}.`, `That's it for ${tL}! ${aL} sends ${tL} packing - ${ev.remaining === 1 ? 'one remains' : ev.remaining + ' remain'}.`, `${tL} has been eliminated! ${ev.remaining === 1 ? 'one competitor' : ev.remaining + ' competitors'} left.`], q, 47);
    case 'entry': return pick([`The next pod opens: number ${ev.number} is ${a}!`, `Entrant number ${ev.number}: ${a} bursts out of the pod!`, `${a} is released into the chamber - number ${ev.number}!`], q, 48);
    case 'player_out': return `${a} is out of the match and can only watch from here.`;
    case 'taunt': return say('taunt', [`${a} taunts ${t}.`, `${aL} soaks in the boos and mocks ${tL}.`, `${aL} stands over ${tL} and waits.`], 30, true);
    case 'hype': return say('hype', [`${a} fires up the crowd.`, `${aL} raises both arms and the arena answers.`], 31, true);
    case 'signal_finisher': return pick([`${a} signals for the end!`, `${aL} points to the sky - the finish is coming!`], q, 32);
    case 'mind_games': return ev.success ? pick([`${a} gets in ${t}'s head.`, `${aL} makes ${tL} doubt for a split second.`], q, 33) : `${a}'s mind games backfire.`;
    case 'bait_set': return `${a} lowers ${posA} guard. It looks like a trap.`;
    case 'respect_shown': return `${a} shows respect to ${t}.`;
    case 'respect_betrayed': return `${t} slaps away the handshake and cheap-shots ${a}!`;
    case 'distract_ref': return ev.success ? `${a} distracts the referee.` : `The referee ignores ${a}.`;
    case 'position': return ev.how === 'get_up' ? say('get_up', [`${a} pulls ${selfA} up.`, `${aL} gets to a knee, then to ${posA} feet.`, `${aL} drags ${selfA} off the mat.`, `${aL} rolls over and pushes up.`, `${aL} staggers upright.`, `${aL} uses the ropes to haul ${selfA} to ${posA} feet.`], 34, true) : ev.how === 'roll_out' ? say('roll_out', [`${a} rolls out of the ring to recover.`], 53, true) : ev.how === 'slide_in' ? say('slide_in', [`${a} slides back into the ring.`], 54, true) : cyc([`${a} repositions.`, `${aL} circles, looking for an angle.`, `${aL} measures the distance.`, `${aL} shuffles along the ropes.`], 35);
    case 'recover': return say('recover', [`${a} catches ${posA} breath.`, `${aL} sucks in air and resets.`, `${aL} buys a moment to recover.`, `${aL} shakes out the cobwebs.`, `${aL} leans on the ropes for a second.`], 36, true);
    case 'injury': return say('injury', [`${a} appears to have hurt ${posA} ${ev.part}.`, `${aL} is favouring ${posA} ${ev.part} - that looked bad.`, `The trainers are watching ${aL}; the ${ev.part} is clearly hurt.`], 37, true);
    case 'ref_bump': return `The referee is knocked down!`;
    case 'ref_recovers': return `The referee is back on his feet.`;
    case 'color': return say(`color_${ev.kind}`, [''], 55, true);
    case 'momentum_shift': return say('momentum_shift', [`${a} fires back - the momentum shifts!`, `The tide turns! ${aL} takes control.`, `${aL} refuses to stay down and the crowd feels it.`], 38, true);
    case 'tag': return ev.hot ? `HOT TAG! ${nm(ev.partner)} bursts in!` : (ctx.t = nm(ev.partner), ctx.tL = last(ev.partner), say('tag', [`${a} tags in ${nm(ev.partner)}.`, `${aL} slaps the hand of ${last(ev.partner)}.`], 39, true));
    case 'hot_tag': {
      const tg = [...state.events].reverse().find((e) => e.type === 'tag' && e.seq < ev.seq && e.partner === ev.actor);
      if (tg) { ctx.t = nm(tg.actor); ctx.tL = last(tg.actor); }
      return say('hot_tag', [`The crowd explodes for the hot tag!`], 52, true);
    }
    case 'tag_cut_off': return `${t} cuts off the tag!`;
    case 'crawl_stopped': return `${a} is dragged back from the corner.`;
    case 'interference': return `${a} interferes from the apron and hits ${t}!`;
    case 'apron': return { encourage: `${a} urges ${posA} partner on.`, ready: `${a} stretches out a hand for the tag.`, cheer: `${a} rallies the crowd.`, rest: `${a} catches a breather on the apron.`, coach_aggro: `${a} yells for aggression.`, coach_safe: `${a} calls for caution.`, coach_tag: `${a} screams for the tag.` }[ev.what] || `${a} works the apron.`;
    case 'save_failed': return `${a} is too late to break it up!`;
    case 'knockdown': return say('knockdown', [`${t} is down! The ref starts the ten count.`, `${tL} hits the mat hard - the count begins!`], 40, true);
    case 'ten_count': return say('ten_count', [`${a} is still down... ${ev.n}.`, `${ev.n}... ${aL} stirs but cannot rise.`], 41, true);
    case 'rise': return say('rise', [`${a} drags ${selfA} to ${posA} feet!`, `${aL} beats the count - somehow!`], 42, true);
    case 'knockout': return `Ten! ${a} can't get up - it's over!`;
    case 'climb': if (state.rules.objective === 'cage') return ev.rung >= ev.steps ? `${a} swings a leg over the top of the cage!` : pick([`${a} hauls ${selfA} up the cage wall - ${ev.steps - ev.rung} to go.`, `${aL} finds a handhold in the mesh and climbs.`, `Up the steel goes ${aL}, ${ev.steps - ev.rung} to the top.`, `${aL} drags ${selfA} higher on the cage, fingers white on the wire.`], q, 43);
      return ev.rung >= ev.steps ? '' : say('climb', [`${a} climbs another rung - ${ev.steps - ev.rung} to go.`, `${aL} reaches for the next rung. ${ev.steps - ev.rung} left to climb.`, `Up goes ${aL}, ${ev.steps - ev.rung} ${ev.steps - ev.rung === 1 ? 'rung' : 'rungs'} from the top.`], 43, true);
    case 'slip': if (state.rules.objective === 'cage') return pick([`${a} loses ${posA} grip on the cage wall and drops!`, `${aL}'s hands slip off the steel - back down ${pron(state, ev.actor)[0] === 'they' ? 'they' : pron(state, ev.actor)[0]} comes!`, `${aL} falls from the cage and crashes to the mat!`], q, 44);
      return say('slip', [`${a} slips and tumbles down!`, `${aL}'s footing goes - down ${pron(state, ev.actor)[0] === 'they' ? 'they' : pron(state, ev.actor)[0]} comes!`, `Disaster! ${aL} loses ${posA} balance on the ladder!`, `${aL} slides off the rung and crashes to the mat!`], 44, true);
    case 'toppled': return state.rules.objective === 'cage' ? pick([`${a} yanks ${t} off the cage wall - a huge fall!`, `${aL} drags ${tL} down from the steel!`], q, 68) : `${a} knocks ${t} off - a huge fall!`;
    case 'objective': return state.rules.prize === 'briefcase' ? pick([`${a} unhooks the briefcase - Money in the Bank belongs to ${aL}!`, `${a} pulls the briefcase down! The contract is ${aL}'s!`], q, 67) : state.rules.objective === 'cage' ? pick([`${a} drops to the floor outside the cage - it's over!`, `${aL}'s feet hit the arena floor. The escape is complete!`], q, 69) : `${a} claims the prize!`;
    case 'fall': return `FALL! ${state.fighters[state.teams[ev.side][0]].name}'s side scores by ${ev.finish}. (${ev.falls[0]}-${ev.falls[1]})`;
    case 'time_limit': return `Time limit expires.`;
    case 'surprise_pin': return `${a} springs a surprise roll-up on ${t}!`;
    case 'match_end': {
      const how = { objective: state.rules.objective === 'cage' ? 'escaping the cage' : state.rules.prize === 'briefcase' ? 'retrieving the briefcase' : 'retrieving the prize', pinfall: 'pinfall', submission: 'submission', dq: 'disqualification', countout: 'count-out', ten_count: 'ten count', falls: 'more falls', over_the_top: 'throwing the last man over the top rope' }[ev.finish] || String(ev.finish).replace(/_/g, ' ');
      return ev.winner ? `${nm(ev.winner)} wins by ${how}.` : `The match ends in a ${String(ev.finish).replace(/_/g, ' ')}.`;
    }
    default: return '';
  }
}

/** narrate one event, never repeating the previous narrated line verbatim */
export function narrate(state, ev) {
  const t = narrateRaw(state, ev, 0);
  if (!t) return t;
  let i = state.events.length - 1;
  while (i >= 0 && state.events[i].seq !== ev.seq) i--;
  // never repeat any of the last dozen narrated lines
  const recent = new Set();
  for (let j = i - 1; j >= 0 && j >= i - 40 && recent.size < 12; j--) { const p = narrateRaw(state, state.events[j], 0); if (p) recent.add(p); }
  if (!recent.has(t)) return t;
  for (let b = 1; b <= 10; b++) { const alt = narrateRaw(state, ev, b); if (alt && !recent.has(alt)) return alt; }
  return t;
}

export function narrateAll(state, events = state.events) {
  return events.map((e) => ({ seq: e.seq, text: narrate(state, e), type: e.type })).filter((x) => x.text);
}
