// How a recorded match relates the player to ONE of its opponents. A single `result` belongs to the player's side, but in a
// multi-way match losing does not mean every opponent beat you: only the winner did. Every surface that says "X beat you"
// (dialogue, Story so far, opponent cards, record book, scenario triggers) goes through this one definition.
import { getRuleset, waysOf } from '../match/rules.js';

const MULTI = new Map();
export function isMultiWay(matchType) {
  if (!matchType) return false;
  if (!MULTI.has(matchType)) { let m = false; try { m = waysOf(getRuleset(matchType)) > 2; } catch { m = false; } MULTI.set(matchType, m); }
  return MULTI.get(matchType);
}

/** 'win' | 'loss' | 'draw' | 'other' (lost the match, but to somebody else) | null (not an opponent in this match) */
export function pairOutcome(data, opponentId) {
  if (!data || !(data.opponents || []).includes(opponentId)) return null;
  if (data.result === 'win') return 'win';
  if (data.result === 'draw') return 'draw';
  if (data.result !== 'loss') return null;
  if (isMultiWay(data.matchType) && data.winner && data.winner !== opponentId && !(data.partners || []).includes(data.winner)) return 'other';
  return 'loss';
}
