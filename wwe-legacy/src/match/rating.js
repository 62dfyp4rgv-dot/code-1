// Match statistics and the game's own 0-5 star rating model. Both are pure functions of the
// event log + final state, so ratings can be re-derived and audited at any time.
import { clamp, round2 } from '../core/util.js';
import { damageFraction } from './state.js';

export function summarizeMatch(state) {
  const per = {};
  for (const id of Object.keys(state.fighters)) {
    per[id] = {
      moves: 0, connected: 0, blocked: 0, dodged: 0, reversed: 0, reversalsMade: 0, finishersHit: 0, finishersAttempted: 0,
      finishersReversed: 0, signaturesHit: 0, pinAttempts: 0, nearFalls: 0, kickouts: 0, submissionsApplied: 0,
      submissionEscapes: 0, ropeBreaks: 0, illegalActs: 0, taunts: 0, damageDealt: 0, categories: {}, distinctMoves: new Set(), tags: 0,
    };
  }
  const E = state.events;
  for (const e of E) {
    const a = per[e.actor], t = per[e.target];
    switch (e.type) {
      case 'move_connected': case 'signature_connected': case 'finisher_connected':
        a.moves++; a.connected++; a.damageDealt += e.damage || 0; a.categories[e.cat] = (a.categories[e.cat] || 0) + 1; a.distinctMoves.add(e.move);
        if (e.type === 'finisher_connected') { a.finishersHit++; a.finishersAttempted++; }
        if (e.type === 'signature_connected') a.signaturesHit++;
        break;
      case 'move_blocked': case 'finisher_blocked':
        a.moves++; a.blocked++; if (e.type === 'finisher_blocked') a.finishersAttempted++; break;
      case 'move_dodged': case 'finisher_dodged':
        a.moves++; a.dodged++; if (e.type === 'finisher_dodged') a.finishersAttempted++; break;
      case 'move_reversed': case 'finisher_reversed':
        a.moves++; a.reversed++; if (t) t.reversalsMade++;
        if (e.type === 'finisher_reversed') { a.finishersAttempted++; a.finishersReversed++; }
        a.damageDealt += 0;
        if (t) t.damageDealt += e.damage || 0;
        break;
      case 'pin_attempt': a.pinAttempts++; break;
      case 'pin_kickout': if (per[e.actor]) per[e.actor].kickouts++; if (e.nearFall && t) t.nearFalls++; break;
      case 'submission_applied': a.submissionsApplied++; break;
      case 'submission_escape': case 'hold_reversed': a.submissionEscapes++; break;
      case 'rope_break': a.ropeBreaks++; break;
      case 'illegal_unseen': case 'warning': a.illegalActs++; break;
      case 'taunt': a.taunts++; break;
      case 'tag': a.tags++; break;
      default: break;
    }
  }
  for (const id of Object.keys(per)) {
    per[id].distinctMoves = per[id].distinctMoves.size;
    per[id].damageTaken = Math.round(Object.values(state.fighters[id].dmg).reduce((x, y) => x + y, 0));
    per[id].staminaLeft = Math.round(state.fighters[id].stamina);
  }
  return per;
}

export function rateMatch(state) {
  const E = state.events;
  const count = (t) => E.filter((e) => e.type === t).length;
  const ids = Object.keys(state.fighters);
  const dur = state.result ? state.result.durationSec : state.time;
  const target = state.timeLimit * 0.62;
  const durScore = clamp(1 - Math.abs(dur - target) / (target * 1.1), 0, 1);
  const nearFalls = E.filter((e) => e.type === 'pin_kickout' && e.nearFall).length;
  const finKick = E.filter((e) => e.type === 'pin_kickout' && e.lastCat === 'finisher').length;
  const reversals = count('move_reversed') + 2 * count('finisher_reversed') + count('hold_reversed');
  const escapes = count('submission_escape') + count('rope_break') + count('finisher_dodged');
  const shifts = count('momentum_shift') + count('rise') + count('hot_tag');
  const avgHeat = state.crowdStats && state.crowdStats.n ? state.crowdStats.sum / state.crowdStats.n : 30;
  const peak = state.crowdStats ? state.crowdStats.peak : 30;
  const per = summarizeMatch(state);
  const variety = clamp(Object.values(per).reduce((s, p) => s + p.distinctMoves, 0) / (ids.length * 7), 0, 1);
  const wear = clamp(ids.reduce((s, id) => s + damageFraction(state.fighters[id]), 0) / ids.length / 0.5, 0, 1);
  const skill = ids.reduce((s, id) => { const at = state.fighters[id].attrs; return s + (at.technical + at.psychology + at.agility + at.striking) / 4; }, 0) / ids.length / 100;
  const stall = (count('tactic') + count('recover') + count('taunt')) / Math.max(1, E.length) ;
  const repeats = ids.reduce((s, id) => s + Math.max(0, Math.max(0, ...Object.values(state.fighters[id].usedMoves)) - 4), 0);

  let score = 0.5 * durScore + 0.55 * Math.min(1, nearFalls / 3) + 0.25 * Math.min(1, finKick) + 0.45 * Math.min(1, reversals / 4)
    + 0.25 * Math.min(1, escapes / 3) + 0.35 * Math.min(1, shifts / 3) + 0.5 * (avgHeat / 100) * 2 + 0.3 * (peak / 100)
    + 0.4 * variety + 0.35 * wear + 0.6 * skill;
  score -= 0.8 * clamp(stall - 0.2, 0, 1) + 0.12 * Math.min(4, repeats);
  const f = state.result ? state.result.finish : null;
  if (f === 'dq' || f === 'countout') score -= 0.55;
  if (f === 'time_limit_draw' || f === 'stalemate') score -= 0.25;
  const stars = clamp(Math.round(score / 3.7 * 5 * 4) / 4, 0, 5);
  return {
    stars, score: round2(score),
    breakdown: { duration: round2(durScore), nearFalls, finisherKickouts: finKick, reversals, escapes, shifts, avgHeat: Math.round(avgHeat), peakHeat: Math.round(peak), variety: round2(variety), wear: round2(wear), skill: round2(skill), stall: round2(stall), repeats },
  };
}
