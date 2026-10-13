// Commentary: turns structured engine events into prose. Strictly one-way (event -> text).
// Variants are chosen by hashing the event sequence number, never by the simulation RNG, so narration
// can never influence an outcome. Callbacks ("again", "third time", "keeps working the leg") are
// derived by scanning EARLIER events only, so replaying a saved match yields identical prose.
const H = (q, salt) => { let x = (q * 2654435761 + salt * 40503) >>> 0; x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; x ^= x >>> 13; return x >>> 0; };
const pick = (arr, q, salt = 1) => arr[H(q, salt) % arr.length];
const PRON = { M: ['he', 'him', 'his', 'himself'], F: ['she', 'her', 'her', 'herself'] };
const pron = (state, id) => PRON[state.fighters[id] && state.fighters[id].gender] || ['they', 'them', 'their', 'themselves'];
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
  switch (ev.type) {
    case 'move_connected': {
      const verb = pick(VERB[ev.cat] || ['hits'], q, 2);
      const dirty = ev.cat === 'illegal' || ev.cat === 'environmental';
      const tail = dirty || H(q, 3) % 3 ? '' : pick(IMPACT_TAIL[ev.quality] || [''], q, 3);
      const again = earlier(state, ev, (e) => e.type === 'move_connected' && e.actor === ev.actor && e.move === ev.move) + 1;
      const part = earlier(state, ev, (e) => e.type === 'move_connected' && e.target === ev.target && e.part === ev.part && e.seq > ev.seq - 14) + 1;
      if (again >= 3 && H(q, 9) % 3 === 0) return `${a} goes back to ${mvPlain} for the ${ord(again)} time, and ${tL} still has no answer.`;
      if (part >= 3 && ev.part && ev.part !== 'torso' && H(q, 8) % 4 === 0) return `${aL} keeps working the ${ev.part}: ${mvPlain} again. ${tail}`.trim();
      if (ev.cat === 'positioning') return cyc([`${aL} sets up the next spot: ${mvPlain}.`, `${a} changes position - ${mvPlain}.`, `${aL} moves into position: ${mvPlain}.`], 50);
      if (ev.cat === 'submission') return cyc([`${a} applies ${the(mvPlain)} to ${tL}'s ${ev.part}.`, `${aL} grinds ${the(mvPlain)} into ${tL}.`], 51);
      const adj = ev.quality === 'devastating' ? 'devastating' : dirty ? 'nasty' : ev.quality === 'clean' ? 'clean' : 'solid';
      return cyc([
        `${a} ${verb} ${t} with ${art(adj)} ${mvPlain}. ${tail}`,
        `${mvPlain} from ${a}, and it connects with ${tL}'s ${ev.part}. ${tail}`,
        `${tL} takes ${art(adj)} ${mvPlain} from ${aL}. ${tail}`,
        `${art(adj)[0].toUpperCase()}${art(adj).slice(1)} ${mvPlain}! ${aL} ${verb} ${tL}. ${tail}`,
        `${aL} finds the opening: ${mvPlain} to the ${ev.part}.${late ? ' Every shot counts now.' : ''} ${tail}`,
        `${mvPlain}. ${tL} feels that one in the ${ev.part}. ${tail}`,
      ], 4).trim();
    }
    case 'signature_connected': return pick([
      `${a} hits ${mv}! The crowd erupts.`, `That's ${aL}'s signature - ${mv} drives into ${tL}!`, `${mv}! ${aL} has been saving that.`,
      `There it is: ${mv}! ${tL} is shaken to the core.`, `${aL} connects with ${mv} and the building comes alive.`,
    ], q, 5);
    case 'finisher_connected': return pick([
      `${a} hits ${mv}!! This could be it!`, `${mv}!! ${tL} is laid out.`, `${aL} hits the finish - ${mv}! Cover coming?`,
      `${mvPlain}!!! ${tL} did not see that coming.`, `Everything ${aL} had went into that ${mv}!`,
    ], q, 6);
    case 'move_blocked': return cyc([
      `${t} blocks ${myMv}.`, `${a} goes for ${myMv} but ${tL} shuts it down.`, `${tL} reads ${the(mvPlain)} and absorbs it.`,
      `${aL}'s ${mvPlain} is smothered before it gets going.`, `Blocked! ${tL} was ready for ${the(mvPlain)}.`, `${tL} plants and refuses to be moved - ${the(mvPlain)} goes nowhere.`,
    ], 7);
    case 'finisher_blocked': return pick([`${t} survives ${a}'s ${mv} attempt by blocking it!`, `${tL} stops ${the(mvPlain)} cold! ${aL} cannot believe it.`], q, 8);
    case 'move_dodged': return pick([
      `${t} slips away from ${the(mvPlain)}${ev.selfDamage ? ` and ${a} crashes hard` : ''}.`, `${a} misses ${myMv} - ${t} dodged it${ev.selfDamage ? ' and ' + aL + ' is hurt by the miss' : ''}!`,
      `${tL} sidesteps ${the(mvPlain)}${ev.selfDamage ? ', and the miss costs ' + aL : ''}.`, `Nothing but air! ${aL} whiffs on ${myMv}.`, `${tL} ducks ${the(mvPlain)} like it was telegraphed.`,
    ], q, 9);
    case 'finisher_dodged': return pick([`${t} dodges ${a}'s ${mv}! What an escape!`, `${mv} finds nothing! ${tL} slid out of danger.`], q, 10);
    case 'move_reversed': return ev.baited ? `${t} baited ${a} into it and reverses ${mv}!` : pick([
      `${t} reverses ${myMv} and turns it around!`, `Reversal! ${t} counters ${the(mvPlain)} and hits back.`, `${tL} was waiting for ${the(mvPlain)} - and flips it on ${aL}!`,
      `${aL} tries ${myMv} and gets it turned right back ${pron(state, ev.actor)[0] === 'they' ? 'on them' : 'on ' + pron(state, ev.actor)[1]}!`, `Beautiful counter by ${tL}!`,
    ], q, 11);
    case 'finisher_reversed': return pick([`${t} REVERSES ${a}'s ${mv}!! Unbelievable!`, `${tL} counters the finish! ${aL} is stunned!`], q, 12);
    case 'pin_attempt': return ev.surprise ? pick([`${a} rolls ${t} up for a quick cover!`, `Roll-up! ${aL} steals a cover on ${tL}!`], q, 13) : pick([
      `${a} hooks the leg and covers ${t}!`, `${aL} goes for the cover!`, `Cover! ${aL} hooks the leg - the ref is down for the count!`, `${aL} drapes an arm over ${tL} and the ref slides in.`,
    ], q, 14);
    case 'pin_count': return pick([`${ev.count}...`, `${ev.count}!`], q, 15);
    case 'pin_kickout': return ev.nearFall ? pick([
      `KICK OUT at two! ${a} just got a shoulder up - that was close!`, `TWO! ${aL} gets the shoulder up at the last instant!`, `Only two! ${aL} somehow survives!`,
    ], q, 16) : pick([`${a} kicks out at two.`, `${aL} powers out at two.`, `Out at two! ${aL} is not done.`], q, 17);
    case 'pin_win': return pick([`One, two, three! ${a} wins by pinfall!`, `Three! That's it - ${aL} gets the pin!`, `The ref's hand hits the mat a third time. ${aL} wins!`], q, 18);
    case 'pin_save': return pick([`${a} rushes in and breaks up the pin on ${nm(ev.saved)}!`, `The save! ${aL} dives in to break the count.`], q, 19);
    case 'pin_reversed': return `${a} bridges out and reverses the cover!`;
    case 'pin_broken_dirty': return `${a} gets a thumb in the eye and breaks the count!`;
    case 'pin_no_ref': return `${a} covers ${t} - but the referee is down! No count!`;
    case 'pin_invalid': return `${a} cannot legally pin ${t} right now.`;
    case 'submission_applied': return pick([
      `${a} locks in the ${mv} on ${t}'s ${ev.part}!`, `${mv}! ${aL} has it cinched on ${tL}'s ${ev.part}!`, `${aL} takes ${tL} to the mat and applies the ${mv}.`,
    ], q, 20);
    case 'hold_pressure': return cyc([
      `${a} cranks the hold. ${t} is in trouble.`, `The pressure builds on ${t}'s ${ev.part}.`, `${tL}'s face tells the story - that ${ev.part} is in agony.`,
      `${aL} sinks it in deeper. Is ${tL} going to tap?`, `The referee leans in and checks on ${tL}.`, `${tL} grimaces and shakes ${pron(state, ev.target)[2]} head.`, `${aL} adjusts the grip and squeezes harder.`,
    ], 21);
    case 'submission_escape': return pick([`${a} fights free of the ${mv}!`, `${aL} finds a way out of the hold!`, `Escape! ${aL} scrambles loose.`], q, 22);
    case 'hold_reversed': return `${a} reverses the hold and hurts ${t}!`;
    case 'rope_break': return pick([`${a} gets to the ropes! Break!`, `Rope break! ${aL} stretches and grabs the bottom rope.`], q, 23);
    case 'crawl_progress': return pick([`${a} drags toward the ropes...`, `Inch by inch, ${aL} crawls for the ropes.`], q, 24);
    case 'submission_win': return ev.voluntary ? `${t} taps out to ${a}'s ${mv}!` : pick([`${t} taps! ${a} wins by submission!`, `That's it - ${tL} taps out! ${aL} wins!`, `The ref calls for the bell: ${tL} gave up.`], q, 25);
    case 'hold_released': return ev.exhausted ? `${a} is too tired to maintain the hold.` : `${a} releases the hold.`;
    case 'hold_transition': return `${a} rolls the hold into a cover!`;
    case 'hold_slipped': return `${a} loses the grip!`;
    case 'hold_shift': return `${a} re-grips and attacks the ${ev.part}.`;
    case 'demand_submit': return pick([`${a} demands a submission!`, `"Give up!" shouts ${aL}.`], q, 26);
    case 'dq': return `The referee calls for the bell - ${a} is disqualified${ev.moveName ? ' for ' + ev.moveName : ''}!`;
    case 'warning': return `The referee warns ${a} about ${ev.moveName || 'that'} (warning ${ev.count}).`;
    case 'illegal_unseen': return pick([`${a} gets away with ${ev.moveName || 'something dirty'} while the ref isn't looking.`, `The ref missed it: ${aL} used ${ev.moveName || 'a cheap shot'}.`], q, 27);
    case 'count': return pick([`The referee counts ${a} on the floor: ${ev.n}.`, `${ev.n}! ${aL} is still outside!`], q, 28);
    case 'countout': return `${a} fails to beat the count!`;
    case 'tactic': return ev.tactic.startsWith('target_') ? pick([`${a} starts working on the ${ev.tactic.slice(7)}.`, `${aL} has picked a target: the ${ev.tactic.slice(7)}.`], q, 29) : ev.tactic.startsWith('pace_') ? `${a} changes the pace.` : `${a} studies ${nm(ev.target) === 'Someone' ? 'the opponent' : t}.`;
    case 'focus': return pick([`${a} turns on ${t}.`, `${aL} switches targets and goes after ${tL}.`, `${aL} spots ${tL} and changes direction.`], q, 45);
    case 'jump_in': return pick([`${a} charges back into the thick of it!`, `${aL} has seen enough waiting - back into the fray!`, `${aL} slides in and takes control of the chaos.`], q, 46);
    case 'eliminated': return pick([`${t} is ELIMINATED by ${a}! ${ev.remaining} left.`, `That's it for ${tL}! ${aL} sends ${tL} packing - ${ev.remaining} remain.`, `${tL} has been eliminated! ${ev.remaining} competitors left.`], q, 47);
    case 'entry': return pick([`The next pod opens: number ${ev.number} is ${a}!`, `Entrant number ${ev.number}: ${a} bursts out of the pod!`, `${a} is released into the chamber - number ${ev.number}!`], q, 48);
    case 'player_out': return `${a} is out of the match and can only watch from here.`;
    case 'taunt': return pick([`${a} taunts ${t}.`, `${aL} soaks in the boos and mocks ${tL}.`, `${aL} stands over ${tL} and waits.`], q, 30);
    case 'hype': return pick([`${a} fires up the crowd.`, `${aL} raises both arms and the arena answers.`], q, 31);
    case 'signal_finisher': return pick([`${a} signals for the end!`, `${aL} points to the sky - the finish is coming!`], q, 32);
    case 'mind_games': return ev.success ? pick([`${a} gets in ${t}'s head.`, `${aL} makes ${tL} doubt for a split second.`], q, 33) : `${a}'s mind games backfire.`;
    case 'bait_set': return `${a} lowers their guard... it looks like a trap.`;
    case 'respect_shown': return `${a} shows respect to ${t}.`;
    case 'respect_betrayed': return `${t} slaps away the handshake and cheap-shots ${a}!`;
    case 'distract_ref': return ev.success ? `${a} distracts the referee.` : `The referee ignores ${a}.`;
    case 'position': return ev.how === 'get_up' ? cyc([`${a} pulls ${selfA} up.`, `${aL} gets to a knee, then to ${posA} feet.`, `${aL} drags ${selfA} off the mat.`, `${aL} rolls over and pushes up.`, `${aL} staggers upright.`, `${aL} uses the ropes to haul ${selfA} to ${posA} feet.`], 34) : ev.how === 'roll_out' ? `${a} rolls out of the ring to recover.` : ev.how === 'slide_in' ? `${a} slides back into the ring.` : cyc([`${a} repositions.`, `${aL} circles, looking for an angle.`, `${aL} measures the distance.`, `${aL} shuffles along the ropes.`], 35);
    case 'recover': return cyc([`${a} catches ${posA} breath.`, `${aL} sucks in air and resets.`, `${aL} buys a moment to recover.`, `${aL} shakes out the cobwebs.`, `${aL} leans on the ropes for a second.`], 36);
    case 'injury': return pick([`${a} appears to have hurt ${posA} ${ev.part}.`, `${aL} is favouring ${posA} ${ev.part} - that looked bad.`, `The trainers are watching ${aL}; the ${ev.part} is clearly hurt.`], q, 37);
    case 'ref_bump': return `The referee is knocked down!`;
    case 'ref_recovers': return `The referee is back on his feet.`;
    case 'momentum_shift': return pick([`${a} fires back - the momentum shifts!`, `The tide turns! ${aL} takes control.`, `${aL} refuses to stay down and the crowd feels it.`], q, 38);
    case 'tag': return ev.hot ? `HOT TAG! ${nm(ev.partner)} bursts in!` : pick([`${a} tags in ${nm(ev.partner)}.`, `${aL} slaps the hand of ${last(ev.partner)}.`], q, 39);
    case 'hot_tag': return `The crowd explodes for the hot tag!`;
    case 'tag_cut_off': return `${t} cuts off the tag!`;
    case 'crawl_stopped': return `${a} is dragged back from the corner.`;
    case 'interference': return `${a} interferes from the apron and hits ${t}!`;
    case 'apron': return { encourage: `${a} urges their partner on.`, ready: `${a} stretches out a hand for the tag.`, cheer: `${a} rallies the crowd.`, rest: `${a} catches a breather on the apron.`, coach_aggro: `${a} yells for aggression.`, coach_safe: `${a} calls for caution.`, coach_tag: `${a} screams for the tag.` }[ev.what] || `${a} works the apron.`;
    case 'save_failed': return `${a} is too late to break it up!`;
    case 'knockdown': return pick([`${t} is down! The ref starts the ten count.`, `${tL} hits the mat hard - the count begins!`], q, 40);
    case 'ten_count': return pick([`${a} is still down... ${ev.n}.`, `${ev.n}... ${aL} stirs but cannot rise.`], q, 41);
    case 'rise': return pick([`${a} drags themselves to their feet!`, `${aL} beats the count - somehow!`], q, 42);
    case 'knockout': return `Ten! ${a} can't get up - it's over!`;
    case 'climb': return ev.rung >= ev.steps ? `${a} reaches the top - hands on the prize!` : pick([`${a} climbs another rung - ${ev.steps - ev.rung} to go.`, `${aL} reaches for the next rung. ${ev.steps - ev.rung} left to climb.`, `Up goes ${aL}, ${ev.steps - ev.rung} ${ev.steps - ev.rung === 1 ? 'rung' : 'rungs'} from the top.`], q, 43);
    case 'slip': return cyc([`${a} slips and tumbles down!`, `${aL}'s footing goes - down ${pron(state, ev.actor)[0] === 'they' ? 'they' : pron(state, ev.actor)[0]} comes!`, `Disaster! ${aL} loses ${posA} balance on the ladder!`, `${aL} slides off the rung and crashes to the mat!`], 44);
    case 'toppled': return `${a} knocks ${t} off - a huge fall!`;
    case 'objective': return `${a} claims the prize!`;
    case 'fall': return `FALL! ${state.fighters[state.teams[ev.side][0]].name}'s side scores by ${ev.finish}. (${ev.falls[0]}-${ev.falls[1]})`;
    case 'time_limit': return `Time limit expires.`;
    case 'surprise_pin': return `${a} springs a surprise roll-up on ${t}!`;
    case 'match_end': {
      const how = { objective: state.rules.objective === 'cage' ? 'escaping the cage' : 'retrieving the prize', pinfall: 'pinfall', submission: 'submission', dq: 'disqualification', countout: 'count-out', ten_count: 'ten count', falls: 'more falls' }[ev.finish] || String(ev.finish).replace(/_/g, ' ');
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
  let prev = null;
  for (let j = i - 1; j >= 0 && j >= i - 6; j--) { const p = narrateRaw(state, state.events[j], 0); if (p) { prev = p; break; } }
  if (prev !== t) return t;
  for (let b = 1; b <= 3; b++) { const alt = narrateRaw(state, ev, b); if (alt && alt !== prev) return alt; }
  return t;
}

export function narrateAll(state, events = state.events) {
  return events.map((e) => ({ seq: e.seq, text: narrate(state, e), type: e.type })).filter((x) => x.text);
}
