// Commentary: turns structured engine events into prose. Strictly one-way (event -> text).
// Variant choice is hashed from the event sequence number so narration never consumes the
// simulation RNG and can never influence an outcome.
const pick = (arr, seq) => arr[seq % arr.length];

export function narrate(state, ev) {
  const nm = (id) => (id && state.fighters[id] ? state.fighters[id].name : 'Someone');
  const a = nm(ev.actor), t = nm(ev.target);
  const q = ev.seq || 0;
  const mv = ev.moveName || 'a move';
  switch (ev.type) {
    case 'move_connected': {
      const adj = ev.quality === 'devastating' ? 'a devastating' : ev.quality === 'clean' ? 'a clean' : 'a solid';
      return pick([`${a} lands ${adj} ${mv} on ${t}.`, `${mv} from ${a} connects with ${t}'s ${ev.part}.`, `${t} takes ${adj} ${mv} from ${a}.`], q);
    }
    case 'signature_connected': return pick([`${a} hits ${mv}! The crowd erupts.`, `That's ${a}'s signature - ${mv} drives into ${t}!`], q);
    case 'finisher_connected': return pick([`${a} hits ${mv}!! This could be it!`, `${mv}!! ${t} is laid out.`], q);
    case 'move_blocked': return pick([`${t} blocks ${a}'s ${mv}.`, `${a} goes for ${mv} but ${t} shuts it down.`], q);
    case 'finisher_blocked': return `${t} survives ${a}'s ${mv} attempt by blocking it!`;
    case 'move_dodged': return pick([`${t} slips away from ${mv}${ev.selfDamage ? ` and ${a} crashes hard` : ''}.`, `${a} misses ${mv} - ${t} dodged it${ev.selfDamage ? ' and ' + a + ' is hurt by the miss' : ''}!`], q);
    case 'finisher_dodged': return `${t} dodges ${a}'s ${mv}! What an escape!`;
    case 'move_reversed': return ev.baited ? `${t} baited ${a} into it and reverses ${mv}!` : pick([`${t} reverses ${a}'s ${mv} and turns it around!`, `Reversal! ${t} counters ${mv} and hits back.`], q);
    case 'finisher_reversed': return `${t} REVERSES ${a}'s ${mv}!! Unbelievable!`;
    case 'pin_attempt': return ev.surprise ? `${a} rolls ${t} up for a quick cover!` : `${a} hooks the leg and covers ${t}!`;
    case 'pin_count': return `${ev.count}...`;
    case 'pin_kickout': return ev.nearFall ? `KICK OUT at two! ${a} just got a shoulder up - that was close!` : `${a} kicks out at ${ev.count}.`;
    case 'pin_win': return `One, two, three! ${a} wins by pinfall!`;
    case 'pin_save': return `${a} rushes in and breaks up the pin on ${nm(ev.saved)}!`;
    case 'pin_reversed': return `${a} bridges out and reverses the cover!`;
    case 'pin_broken_dirty': return `${a} gets a thumb in the eye and breaks the count!`;
    case 'pin_no_ref': return `${a} covers ${t} - but the referee is down! No count!`;
    case 'pin_invalid': return `${a} cannot legally pin ${t} right now.`;
    case 'submission_applied': return `${a} locks in the ${mv} on ${t}'s ${ev.part}!`;
    case 'hold_pressure': return pick([`${a} cranks the hold. ${t} is in trouble.`, `The pressure builds on ${t}'s ${ev.part}.`], q);
    case 'submission_escape': return `${a} fights free of the ${mv}!`;
    case 'hold_reversed': return `${a} reverses the hold and hurts ${t}!`;
    case 'rope_break': return `${a} gets to the ropes! Break!`;
    case 'crawl_progress': return `${a} drags toward the ropes...`;
    case 'submission_win': return ev.voluntary ? `${t} taps out to ${a}'s ${mv}!` : `${t} taps! ${a} wins by submission!`;
    case 'hold_released': return ev.exhausted ? `${a} is too tired to maintain the hold.` : `${a} releases the hold.`;
    case 'hold_transition': return `${a} rolls the hold into a cover!`;
    case 'hold_slipped': return `${a} loses the grip!`;
    case 'hold_shift': return `${a} re-grips and attacks the ${ev.part}.`;
    case 'demand_submit': return `${a} demands a submission!`;
    case 'dq': return `The referee calls for the bell - ${a} is disqualified${ev.moveName ? ' for ' + ev.moveName : ''}!`;
    case 'warning': return `The referee warns ${a} about ${ev.moveName || 'that'} (warning ${ev.count}).`;
    case 'illegal_unseen': return `${a} gets away with ${ev.moveName || 'something dirty'} while the ref isn't looking.`;
    case 'count': return `The referee counts ${a} on the floor: ${ev.n}.`;
    case 'countout': return `${a} fails to beat the count!`;
    case 'tactic': return ev.tactic.startsWith('target_') ? `${a} starts working on the ${ev.tactic.slice(7)}.` : ev.tactic.startsWith('pace_') ? `${a} changes the pace.` : `${a} studies ${nm(ev.target) === 'Someone' ? 'the opponent' : t}.`;
    case 'taunt': return `${a} taunts ${t}.`;
    case 'hype': return `${a} fires up the crowd.`;
    case 'signal_finisher': return `${a} signals for the end!`;
    case 'mind_games': return ev.success ? `${a} gets in ${t}'s head.` : `${a}'s mind games backfire.`;
    case 'bait_set': return `${a} lowers their guard... it looks like a trap.`;
    case 'respect_shown': return `${a} shows respect to ${t}.`;
    case 'respect_betrayed': return `${t} slaps away the handshake and cheap-shots ${a}!`;
    case 'distract_ref': return ev.success ? `${a} distracts the referee.` : `The referee ignores ${a}.`;
    case 'position': return ev.how === 'get_up' ? `${a} pulls themselves up.` : ev.how === 'roll_out' ? `${a} rolls out of the ring to recover.` : ev.how === 'slide_in' ? `${a} slides back into the ring.` : `${a} repositions.`;
    case 'recover': return `${a} catches their breath.`;
    case 'injury': return `${a} appears to have hurt their ${ev.part}.`;
    case 'ref_bump': return `The referee is knocked down!`;
    case 'ref_recovers': return `The referee is back on his feet.`;
    case 'momentum_shift': return `${a} fires back - the momentum shifts!`;
    case 'tag': return ev.hot ? `HOT TAG! ${nm(ev.partner)} bursts in!` : `${a} tags in ${nm(ev.partner)}.`;
    case 'hot_tag': return `The crowd explodes for the hot tag!`;
    case 'tag_cut_off': return `${t} cuts off the tag!`;
    case 'crawl_stopped': return `${a} is dragged back from the corner.`;
    case 'interference': return `${a} interferes from the apron and hits ${t}!`;
    case 'apron': return { encourage: `${a} urges their partner on.`, ready: `${a} stretches out a hand for the tag.`, cheer: `${a} rallies the crowd.`, rest: `${a} catches a breather on the apron.`, coach_aggro: `${a} yells for aggression.`, coach_safe: `${a} calls for caution.`, coach_tag: `${a} screams for the tag.` }[ev.what] || `${a} works the apron.`;
    case 'save_failed': return `${a} is too late to break it up!`;
    case 'knockdown': return `${t} is down! The ref starts the ten count.`;
    case 'ten_count': return `${a} is still down... ${ev.n}.`;
    case 'rise': return `${a} drags themselves to their feet!`;
    case 'knockout': return `Ten! ${a} can't get up - it's over!`;
    case 'climb': return `${a} climbs higher (${ev.rung}/${ev.steps}).`;
    case 'slip': return `${a} slips and tumbles down!`;
    case 'toppled': return `${a} knocks ${t} off - a huge fall!`;
    case 'objective': return `${a} claims the prize!`;
    case 'fall': return `FALL! ${state.fighters[state.teams[ev.side][0]].name}'s side scores by ${ev.finish}. (${ev.falls[0]}-${ev.falls[1]})`;
    case 'time_limit': return `Time limit expires.`;
    case 'surprise_pin': return `${a} springs a surprise roll-up on ${t}!`;
    case 'match_end': return ev.winner ? `${nm(ev.winner)} wins by ${String(ev.finish).replace('_', ' ')}.` : `The match ends in a ${String(ev.finish).replace(/_/g, ' ')}.`;
    default: return '';
  }
}

export function narrateAll(state, events = state.events) {
  return events.map((e) => ({ seq: e.seq, text: narrate(state, e), type: e.type })).filter((x) => x.text);
}
