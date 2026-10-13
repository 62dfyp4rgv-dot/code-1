// Everything the engine can offer a wrestler in a given situation. Option lists are *derived*
// from the authoritative state each time (never cached), so they can never go stale.
import { getMove, familyOf } from './moves.js';
import { availableStances, STANCES } from './stances.js';
import { computeConnect, hintLabel, kickoutChance, holdEscapeChance } from './calc.js';
import { F, opponentOf, partnerOf, damageFraction, staminaFrac, phaseOf } from './state.js';

const GROUP_OF_CAT = {
  strike_light: 'Strikes', strike_heavy: 'Strikes', combo: 'Strikes', grapple: 'Grapples', technical: 'Technical',
  power: 'Power', submission: 'Submissions', corner: 'Corner', aerial: 'Aerial', signature: 'Signature',
  finisher: 'Finisher', environmental: 'Weapons', illegal: 'Dirty', positioning: 'Positioning',
};
export const GROUPS = ['Finisher', 'Signature', 'Strikes', 'Grapples', 'Power', 'Technical', 'Submissions', 'Aerial', 'Corner', 'Positioning', 'Dirty', 'Weapons', 'Pin', 'Tactics', 'Recover'];

export function refCanSee(state) { return state.referee.state === 'watching'; }

/** Why can't `move` be used right now? null = legal. */
export function moveBlockedReason(state, A, D, move) {
  if (!A.legal) return 'Not the legal wrestler';
  if (!D) return 'No opponent';
  if (!move.from.includes(A.pos)) return `Needs you ${move.from.join('/')}`;
  if (!move.vs.includes(D.pos)) return `Opponent must be ${move.vs.join('/')}`;
  if (move.rules) {
    if (move.rules.includes('outside') && !state.rules.outside) return 'No outside action in this match';
    if (move.rules.includes('objective') && !state.rules.objective) return 'Only in ladder/cage matches';
    if (move.rules.includes('weapons') && !state.rules.weapons && state.referee.state === 'watching') return 'Referee is watching';
  }
  if (move.pinMove && !(state.rules.pinfall || state.rules.ironMan)) return 'Pinfalls do not count';
  if ((move.cat === 'submission' || move.hold) && !state.rules.submission) return 'Submissions do not count';
  if (move.hold && D.pos !== 'grounded') return 'Opponent must be down';
  if (A.stamina < move.minStamina) return 'Too exhausted';
  if (A.momentum < move.minMom) return move.cat === 'finisher' ? 'Finisher not ready' : 'Need more momentum';
  if (state.rules.objective && state.rules.pinfall === false && move.pinMove) return 'No pins';
  return null;
}

// ---- tempo / tactic actions ----------------------------------------------------------------
const FREE_COOLDOWN = 3;

export const TEMPO = {
  cover: { label: 'Go for the Pin', group: 'Pin', desc: 'Cover your opponent for the three count.', check: (s, A, D) => {
    if (!(s.rules.pinfall || s.rules.ironMan)) return 'Pinfalls do not count';
    if (!D || D.pos !== 'grounded') return 'Opponent must be down';
    if (!A.legal || !D.legal) return 'Not legal';
    return null;
  } },
  cover_outside: { label: 'Pin on the Floor', group: 'Pin', desc: 'Cover them outside the ring - legal here.', check: (s, A, D) => {
    if (!s.rules.pinfall) return 'Pinfalls do not count';
    if (!D || D.pos !== 'outside' || A.pos !== 'outside') return 'Both must be on the floor';
    if (s.rules.dq !== false) return 'Pins must be inside the ring';
    return null;
  } },
  get_up: { label: 'Get to Your Feet', group: 'Recover', desc: 'Pull yourself up.', check: (s, A) => (A.pos === 'grounded' ? null : 'Already up') },
  slide_in: { label: 'Slide Back In', group: 'Recover', desc: 'Re-enter the ring.', check: (s, A) => (A.pos === 'outside' || A.pos === 'apron' ? null : 'Already inside') },
  catch_breath: { label: 'Catch Your Breath', group: 'Recover', desc: 'Back off and recover stamina (+11).', check: (s, A) => (staminaFrac(A) < 0.92 ? null : 'Fresh enough') },
  taunt: { label: 'Taunt the Crowd', group: 'Tactics', desc: 'Showboat for momentum and heat. Leaves you open.', check: (s, A, D) => (D && D.pos === 'grounded' || A.momentum >= 15 ? null : 'Not now') },
  hype: { label: 'Fire Up the Crowd', group: 'Tactics', desc: 'Build crowd momentum. Needs some momentum.', check: (s, A) => (A.momentum >= 25 ? null : 'Need 25 momentum') },
  signal: { label: 'Signal for the Finish', group: 'Tactics', desc: 'Telegraph your finisher: big pop and a boost to hit it - but they see it coming.', check: (s, A) => (A.momentum >= 50 && !A.tactics.finisherSetup ? null : 'Not ready') },
  mind_games: { label: 'Play Mind Games', group: 'Tactics', desc: 'Rattle their confidence. Psychology versus psychology.', check: () => null },
  bait: { label: 'Set a Trap', group: 'Tactics', desc: 'Feign weakness; your next defence gets a big counter bonus.', check: (s, A) => (A.tactics.bait ? 'Trap already set' : null) },
  show_respect: { label: 'Show Respect', group: 'Tactics', desc: 'Offer a handshake or help them up. Crowd and respect - but a heel may cheap-shot you.', check: (s, A, D) => (phaseOf(s) !== 'closing' && D ? null : 'Not the time') },
  distract_ref: { label: 'Distract the Referee', group: 'Dirty', desc: 'Argue with the official so the next dirty move goes unseen.', check: (s) => (s.referee.state === 'watching' && s.rules.dq !== false ? null : 'No need') },
  roll_out: { label: 'Roll Out of the Ring', group: 'Recover', desc: 'Bail to the floor to recover (+7). Count-out risk.', check: (s, A) => (s.rules.outside && !['outside', 'apron'].includes(A.pos) ? null : 'Not possible') },
  create_distance: { label: 'Break Away', group: 'Recover', desc: 'Get out of the corner and reset to the centre.', check: (s, A) => (A.pos === 'corner' || A.pos === 'ropes' ? null : 'Not cornered') },
  climb_down: { label: 'Climb Down', group: 'Recover', desc: 'Abort the climb.', check: (s, A) => (A.pos === 'top' ? null : 'Not on top') },
  study: { label: 'Study Their Habits', group: 'Tactics', free: true, desc: 'Read their patterns: better defence against their favourite move type for a few rounds.', check: () => null },
  pace_fast: { label: 'Pick Up the Pace', group: 'Tactics', free: true, desc: 'Faster, riskier: +accuracy, burns stamina quicker.', check: (s, A) => (A.tactics.pace === 'fast' ? 'Already fast' : null) },
  pace_slow: { label: 'Slow It Down', group: 'Tactics', free: true, desc: 'Methodical: saves stamina, less accuracy.', check: (s, A) => (A.tactics.pace === 'slow' ? 'Already slow' : null) },
  pace_normal: { label: 'Settle Into a Rhythm', group: 'Tactics', free: true, desc: 'Back to a balanced pace.', check: (s, A) => (A.tactics.pace === 'normal' ? 'Already balanced' : null) },
  target_head: { label: 'Target the Head', group: 'Tactics', free: true, desc: 'Focus attacks on the head: more damage there.', check: (s, A) => (A.tactics.target === 'head' ? 'Already targeting' : null) },
  target_torso: { label: 'Target the Body', group: 'Tactics', free: true, desc: 'Focus on the torso: drains stamina faster.', check: (s, A) => (A.tactics.target === 'torso' ? 'Already targeting' : null) },
  target_arms: { label: 'Target the Arms', group: 'Tactics', free: true, desc: 'Weaken the arms: fewer strikes and holds for them.', check: (s, A) => (A.tactics.target === 'arms' ? 'Already targeting' : null) },
  target_legs: { label: 'Target the Legs', group: 'Tactics', free: true, desc: 'Cut off the ring: weakens their aerial and mobility.', check: (s, A) => (A.tactics.target === 'legs' ? 'Already targeting' : null) },
  make_tag: { label: 'Tag In Your Partner', group: 'Tactics', desc: 'Reach for the tag. The opponent may cut you off.', check: (s, A) => {
    if (!s.rules.tag) return 'Not a tag match';
    if (!['corner', 'ropes'].includes(A.pos)) return 'Must be at your corner';
    const p = partnerOf(s, A.id);
    return p && F(s, p).pos === 'apron' ? null : 'No partner on the apron';
  } },
  crawl_corner: { label: 'Crawl to Your Corner', group: 'Tactics', desc: 'Fight toward your partner.', check: (s, A) => {
    if (!s.rules.tag) return 'Not a tag match';
    if (['corner', 'ropes', 'outside', 'top'].includes(A.pos)) return 'Already there / unavailable';
    return null;
  } },
  obj_climb: { label: 'Climb Higher', group: 'Tactics', desc: 'Climb a rung toward the prize. Vulnerable up there.', check: (s, A, D) => {
    if (!s.rules.objective) return 'No objective';
    if (!['standing', 'top'].includes(A.pos)) return 'Get to your feet first';
    if (D && D.pos === 'top' && D.climb > A.climb) return 'Opponent is higher';
    return null;
  } },
};

export const FREE_ACTIONS = new Set(Object.keys(TEMPO).filter((k) => TEMPO[k].free));
export const COOLDOWN = FREE_COOLDOWN;

function describeMove(state, A, D, move, enabled, reason) {
  const o = {
    id: `mv:${move.id}`, kind: 'move', moveId: move.id, label: move.name, group: GROUP_OF_CAT[move.cat] || 'Strikes', cat: move.cat,
    family: familyOf(move.cat), cost: move.cost, tgt: move.tgt, enabled, reason, desc: '',
  };
  if (enabled && D) {
    const { p } = computeConnect(state, A.id, move, D.id, null);
    o.p = p; o.hint = hintLabel(p);
    o.desc = `${move.tgt === 'full' ? '' : `Targets ${move.tgt}. `}Stamina ${move.cost}.${move.risk ? ' Risky if it misses.' : ''}${move.illegal ? ' Illegal.' : ''}`;
    if (move.cat === 'finisher') o.desc = 'Your finishing move. Momentum is spent on the attempt.';
  }
  return o;
}

/** Full ranked list of options for the wrestler holding the initiative. */
export function listActions(state, actorId) {
  const A = F(state, actorId);
  if (!A.legal) return listApronOptions(state, actorId);
  const D = F(state, opponentOf(state, actorId));
  const opts = [];
  const ids = [...new Set([...A.moveIds, ...A.signatureIds, A.finisherId])];
  for (const id of ids) {
    const move = getMove(id);
    const reason = moveBlockedReason(state, A, D, move);
    if (reason === null) opts.push(describeMove(state, A, D, move, true, null));
  }
  for (const [tid, t] of Object.entries(TEMPO)) {
    const reason = t.check(state, A, D);
    if (reason !== null) continue;
    if (t.free && state.round - A.tactics.lastTactic < FREE_COOLDOWN) continue;
    opts.push({
      id: `t:${tid}`, kind: 'tempo', tempoId: tid, label: t.label, group: t.group, desc: t.desc, enabled: true, free: !!t.free,
      cost: 0,
    });
  }
  return rank(state, A, D, opts);
}

/** Order options by tactical relevance and mark the featured shortlist (~8-13 options). */
function rank(state, A, D, opts) {
  const dmgParts = D ? Object.entries(D.dmg).sort((a, b) => b[1] - a[1]) : [];
  for (const o of opts) {
    let s = 0;
    if (o.kind === 'move') {
      const m = getMove(o.moveId);
      s += (o.p ?? 0.5) * 40;
      if (D && o.tgt === dmgParts[0]?.[0] && dmgParts[0][1] > 20) s += 8;
      if (A.tactics.target === o.tgt) s += 4;
      if (m.cat === 'finisher') s += 60;
      if (m.cat === 'signature') s += 22;
      if (m.setup) s += 2;
      if (A.usedMoves[m.id]) s -= Math.min(10, A.usedMoves[m.id] * 2);
      if (m.style.includes(A.style)) s += 4;
      if (m.cost > A.stamina * 0.5) s -= 12;
      if (m.illegal) s -= 8;
    } else if (o.tempoId === 'cover') {
      s += 18 + damageFraction(D) * 60 + (D.stamina < D.maxStamina * 0.4 ? 12 : 0);
    } else if (o.tempoId === 'get_up' || o.tempoId === 'slide_in') {
      s += 55;
    } else if (o.tempoId === 'catch_breath') {
      s += staminaFrac(A) < 0.4 ? 50 : 6;
    } else if (o.tempoId === 'make_tag') {
      s += 30 + damageFraction(A) * 40;
    } else if (o.tempoId === 'obj_climb') {
      s += 35;
    } else if (o.tempoId === 'taunt' || o.tempoId === 'hype' || o.tempoId === 'signal') {
      s += 10 + A.momentum / 10;
    } else s += 5;
    o.score = s;
  }
  opts.sort((a, b) => b.score - a.score);
  // featured: best of each group first for variety, then fill by score
  const feat = new Set();
  const seenGroups = {};
  const wantMoves = 8;
  let nMoves = 0, nTempo = 0;
  for (const o of opts) {
    if (o.kind !== 'move') continue;
    const g = o.group;
    const lim = g === 'Finisher' || g === 'Signature' ? 3 : 2;
    if ((seenGroups[g] || 0) < lim && nMoves < wantMoves) { feat.add(o.id); seenGroups[g] = (seenGroups[g] || 0) + 1; nMoves++; }
  }
  for (const o of opts) {
    if (nMoves >= wantMoves) break;
    if (o.kind === 'move' && !feat.has(o.id)) { feat.add(o.id); nMoves++; }
  }
  const mustHave = ['cover', 'cover_outside', 'get_up', 'slide_in', 'make_tag', 'obj_climb', 'climb_down'];
  for (const o of opts) {
    if (o.kind === 'tempo' && mustHave.includes(o.tempoId)) { feat.add(o.id); nTempo++; }
  }
  const prefer = ['catch_breath', 'taunt', 'hype', 'signal', 'pace_fast', 'pace_slow', 'study', 'mind_games', 'bait', 'show_respect', 'roll_out', 'distract_ref', 'create_distance', 'crawl_corner', 'target_torso'];
  const tempoFirst = opts.filter((o) => o.kind === 'tempo' && !feat.has(o.id)).sort((a, b) => prefer.indexOf(a.tempoId) - prefer.indexOf(b.tempoId));
  for (const o of tempoFirst) { if (nTempo >= 4) break; feat.add(o.id); nTempo++; }
  // guarantee a floor of 8 featured options
  for (const o of opts) { if (feat.size >= 8) break; feat.add(o.id); }
  for (const o of opts) o.featured = feat.has(o.id);
  return opts;
}

// ---- defensive responses --------------------------------------------------------------------
export function listStanceOptions(state, defenderId, attack) {
  const D = F(state, defenderId);
  const A = F(state, attack.attackerId);
  const fam = attack.family;
  const out = [];
  const stances = availableStances(D, attack, fam);
  for (const s of stances) {
    const o = {
      id: `st:${s.id}`, kind: 'stance', stanceId: s.id, label: s.label, desc: s.desc, group: 'Defence', cost: s.cost, enabled: true,
    };
    if (attack.moveId) {
      const mv = getMove(attack.moveId);
      const { p } = computeConnect(state, A.id, mv, D.id, s);
      o.avoidPct = Math.round((1 - p) * 100);
      o.hint = `${o.avoidPct}%`;
    }
    out.push(o);
  }
  // rank by avoid chance, keep "sell"/"protect" present
  out.sort((a, b) => (b.avoidPct ?? 0) - (a.avoidPct ?? 0));
  out.forEach((o, i) => { o.featured = true; o.rank = i; });
  return out;
}

// ---- pins ------------------------------------------------------------------------------------
export function listPinOptions(state, pinnedId, pin) {
  const D = F(state, pinnedId);
  const opts = [
    { id: 'pn:kickout', label: 'Kick Out', desc: 'Explode off the mat. Costs 4 stamina.', kind: 'pin' },
    { id: 'pn:desperate', label: 'Dig Deep', desc: 'Everything you have: +12% kickout, costs 12 stamina.', kind: 'pin' },
    { id: 'pn:conserve', label: 'Conserve Energy', desc: 'Lazy shoulder lift: -7% kickout, costs nothing.', kind: 'pin' },
    { id: 'pn:bridge', label: 'Bridge & Reverse', desc: 'Roll through for your own pin. Low odds, high reward.', kind: 'pin' },
    { id: 'pn:fan_up', label: 'Feed Off the Crowd', desc: 'Bonus scales with crowd heat for you.', kind: 'pin' },
  ];
  if (state.rules.dq !== false) opts.push({ id: 'pn:poke', label: 'Poke the Eyes', desc: 'Illegal: breaks the cover if unseen; DQ warning if seen.', kind: 'pin', illegal: true });
  else opts.push({ id: 'pn:poke', label: 'Dirty Escape', desc: 'No rules: gouge your way out.', kind: 'pin', illegal: true });
  const partner = partnerOf(state, pinnedId);
  if (state.rules.tag && partner && F(state, partner).pos === 'apron') opts.push({ id: 'pn:save', label: 'Call for the Save', desc: 'Partner on the apron may break it up.', kind: 'pin' });
  for (const o of opts) {
    o.group = 'Pin'; o.enabled = true; o.featured = true;
    const pk = o.id === 'pn:kickout' ? kickoutChance(state, pinnedId, pin.pinner, { lastCat: pin.lastCat, surprise: pin.surprise }) : null;
    if (pk != null) o.hint = `~${Math.round(pk * 100)}% to kick out`;
    if (o.id === 'pn:desperate' && D.stamina < 12) { o.enabled = false; o.reason = 'Too exhausted'; }
  }
  return opts;
}

// ---- holds -----------------------------------------------------------------------------------
export function listHoldHolderOptions(state, holderId) {
  const H = F(state, holderId);
  const opts = [
    { id: 'hd:tighten', label: 'Tighten the Hold', desc: 'Steadily add pressure (stamina 4).' },
    { id: 'hd:wrench', label: 'Crank It', desc: 'Violent leverage: big pressure, small chance of slipping (stamina 7).' },
    { id: 'hd:ask', label: 'Demand a Submission', desc: 'Mock them: crowd and confidence swing; some pressure.' },
    { id: 'hd:shift', label: 'Switch Pressure', desc: 'Re-grip on the weakest nearby limb: re-targets and adds pressure.' },
    { id: 'hd:release', label: 'Release the Hold', desc: 'Let go and reset (pins/strikes next).' },
  ];
  if (state.rules.pinfall) opts.push({ id: 'hd:transition', label: 'Transition to a Pin', desc: 'Roll into a cover with a weakened opponent.' });
  if (state.rules.dq !== false) opts.push({ id: 'hd:ropes', label: 'Use the Ropes for Leverage', desc: 'Illegal extra pressure. Seen = warning/DQ.', illegal: true });
  for (const o of opts) { o.kind = 'hold'; o.group = 'Tactics'; o.enabled = !(o.id === 'hd:wrench' && H.stamina < 7); o.featured = true; }
  return opts;
}

export function listHoldVictimOptions(state, victimId, hold) {
  const opts = [
    { id: 'hv:power_out', label: 'Power Out', desc: 'Muscle your way free.' },
    { id: 'hv:reverse_hold', label: 'Reverse the Hold', desc: 'Technical counter. Hard, but turns the tables.' },
    { id: 'hv:slip_out', label: 'Slip Out', desc: 'Wriggle free with agility.' },
    { id: 'hv:fight_on', label: 'Strike Your Way Out', desc: 'Desperate shots to break the grip.' },
    { id: 'hv:fan_up', label: 'Rally the Crowd', desc: 'Let the fans carry you out.' },
    { id: 'hv:endure', label: 'Endure & Protect', desc: 'Weather it: cut pressure gains by 40% this round.' },
    { id: 'hv:tap', label: 'Tap Out', desc: 'Surrender. The match ends.' },
  ];
  if (state.rules.ropeBreaks) opts.splice(3, 0, { id: 'hv:crawl_ropes', label: 'Crawl to the Ropes', desc: 'Inch toward the bottom rope. Progress builds every attempt; reaching it forces a break.' });
  for (const o of opts) {
    o.kind = 'holdv'; o.group = 'Defence'; o.enabled = true; o.featured = true;
    if (o.id !== 'hv:tap' && o.id !== 'hv:endure') {
      const key = o.id.slice(3);
      o.hint = `~${Math.round(holdEscapeFor(state, hold, key) * 100)}% to break`;
    }
  }
  return opts;
}

const holdEscapeFor = holdEscapeChance;

// ---- ten count (Last Man Standing) ----------------------------------------------------------
export function listRiseOptions(state, id) {
  const opts = [
    { id: 'rs:rise', label: 'Fight to Your Feet', desc: 'Normal attempt (stamina 5).' },
    { id: 'rs:dig', label: 'Dig Deep', desc: 'All-out effort: +15% chance, costs 12 stamina.' },
    { id: 'rs:ropes', label: 'Pull Up on the Ropes', desc: 'Safer: small bonus, but slower count.' },
    { id: 'rs:crowd', label: 'Feed Off the Crowd', desc: 'Bonus scales with crowd heat for you.' },
    { id: 'rs:rest', label: 'Gather Yourself', desc: 'Stay down and recover 8 stamina. Count keeps going.' },
  ];
  for (const o of opts) { o.kind = 'rise'; o.group = 'Recover'; o.enabled = true; o.featured = true; }
  if (F(state, id).stamina < 12) opts[1].enabled = false;
  return opts;
}

// ---- apron (tag partner not legal) -----------------------------------------------------------
export function listApronOptions(state, id, ctx = {}) {
  const opts = [
    { id: 'ap:encourage', label: 'Encourage Your Partner', desc: 'Boost partner confidence and crowd heat.' },
    { id: 'ap:ready', label: 'Stretch Out for the Tag', desc: 'Make the tag easier to land and harder to cut off.' },
    { id: 'ap:cheer', label: 'Get the Crowd Behind Them', desc: 'Build heat.' },
    { id: 'ap:rest', label: 'Catch Your Breath', desc: 'Recover 6 stamina on the apron.' },
    { id: 'ap:coach_aggro', label: 'Tell Them: Attack!', desc: 'Partner plays aggressively next exchange.' },
    { id: 'ap:coach_safe', label: 'Tell Them: Stay Safe', desc: 'Partner defends smartly next exchange.' },
    { id: 'ap:coach_tag', label: 'Tell Them: Tag Me In', desc: 'Partner looks for the tag at the first chance.' },
  ];
  if (state.rules.dq !== false) {
    opts.push({ id: 'ap:distract', label: 'Distract the Referee', desc: 'Illegal: ref turned away for a round.', illegal: true });
    opts.push({ id: 'ap:cheap', label: 'Cheap Shot on the Opponent', desc: 'Illegal interference: damage, DQ risk.', illegal: true });
  }
  if (ctx.pin) opts.unshift({ id: 'ap:break_pin', label: 'Break Up the Pin!', desc: 'Dive in and break the cover (partner on the mat).', urgent: true });
  for (const o of opts) { o.kind = 'apron'; o.group = 'Tactics'; o.enabled = true; o.featured = true; }
  return opts;
}

export { STANCES };
