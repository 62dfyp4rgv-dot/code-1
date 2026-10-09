/**
 * Player-facing commands. Every command validates its input against the same rules the AI obeys and returns a
 * structured outcome; none of them can put the world into a state the invariant suite would reject.
 */
import { clamp } from '../math';
import { ageOf, overall, positionalOverall } from '../players';
import { formationOf, validateTactics } from '../tactics';
import type { Club, Player, Tactics } from '../types';
import { alignedContractEnd } from './calendar';
import { assignPlayer, freeAgents, squadOf } from './runtime';
import { MIN_SQUAD, releasePlayer, signFreeAgent } from './squad';
import {
  executeTransfer, isWindowOpen, playerResponse, scoutedEstimate, sellerResponse, wageDemand, type Offer,
} from './transfers';
import { baseWageWeekly, marketValue } from './valuation';
import type { WorldState } from './types';
import { contractYearsFor } from './valuation';

export type ActionResult<T = undefined> = { ok: true; value: T; message?: string } | { ok: false; error: string };

const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

function humanOf(world: WorldState): Club | null {
  return world.config.humanClubId ? (world.clubs[world.config.humanClubId] ?? null) : null;
}

export function setHumanClub(world: WorldState, clubId: string | null): ActionResult {
  if (clubId !== null && !world.clubs[clubId]) return fail('unknown club');
  world.config.humanClubId = clubId;
  return { ok: true, value: undefined };
}

export function setTactics(world: WorldState, tactics: Tactics): ActionResult {
  const club = humanOf(world);
  if (!club) return fail('no club under your control');
  const errors = validateTactics(tactics);
  if (errors.length > 0) return fail(errors.join('; '));
  club.tactics = { ...tactics, roles: [...tactics.roles] };
  club.lineupOverride = null; // formation may have changed; re-pick unless the user sets a new XI
  return { ok: true, value: undefined };
}

export function setLineup(world: WorldState, playerIds: string[] | null): ActionResult {
  const club = humanOf(world);
  if (!club) return fail('no club under your control');
  if (playerIds === null) { club.lineupOverride = null; return { ok: true, value: undefined }; }
  const fm = formationOf(club.tactics.formation);
  if (playerIds.length !== fm.slots.length) return fail(`a lineup needs ${fm.slots.length} players`);
  if (new Set(playerIds).size !== playerIds.length) return fail('a player is selected twice');
  const squad = squadOf(world, club.id);
  for (const id of playerIds) if (!squad.some((p) => p.id === id)) return fail('selected player is not in your squad');
  const first = squad.find((p) => p.id === playerIds[0]);
  if (!first || first.primary !== 'GK') return fail('the first slot must be a goalkeeper');
  club.lineupOverride = [...playerIds];
  return { ok: true, value: undefined };
}

export function listForTransfer(world: WorldState, playerId: string, askingPrice: number): ActionResult {
  const club = humanOf(world);
  const p = world.players[playerId];
  if (!club || !p || p.clubId !== club.id) return fail('player is not in your squad');
  if (!(askingPrice >= 0)) return fail('invalid price');
  world.transferList[playerId] = { askingPrice: Math.round(askingPrice), day: world.day };
  return { ok: true, value: undefined };
}

export function unlistFromTransfer(world: WorldState, playerId: string): ActionResult {
  delete world.transferList[playerId];
  return { ok: true, value: undefined };
}

export interface BidOutcome {
  status: 'completed' | 'rejectedBySeller' | 'rejectedByPlayer' | 'counter' | 'invalid';
  reason?: string;
  counterFee?: number;
  demandedWage?: number;
}

/** Make a permanent-transfer offer as the human club. */
export function bidForPlayer(world: WorldState, playerId: string, fee: number, wageWeekly: number, years: number): ActionResult<BidOutcome> {
  const club = humanOf(world);
  const p = world.players[playerId];
  if (!club) return fail('no club under your control');
  if (!p || p.retired) return fail('unknown player');
  if (p.clubId === null) return fail('player is a free agent; use signFreeAgentAction');
  if (p.clubId === club.id) return fail('player already at your club');
  const offer: Offer = { buyerId: club.id, playerId, fee: Math.round(fee), wageWeekly: Math.round(wageWeekly), years };
  if (!isWindowOpen(world, club)) return { ok: true, value: { status: 'invalid', reason: 'transfer window is closed' } };
  const seller = sellerResponse(world, offer);
  if (seller.status === 'rejected') return { ok: true, value: { status: 'rejectedBySeller', reason: seller.reason } };
  if (seller.status === 'counter') return { ok: true, value: { status: 'counter', counterFee: seller.fee, reason: seller.reason } };
  const pr = playerResponse(world, offer);
  if (pr.status === 'rejected') return { ok: true, value: { status: 'rejectedByPlayer', reason: pr.reason, demandedWage: wageDemand(world, club, p) } };
  const err = executeTransfer(world, offer);
  if (err) return { ok: true, value: { status: 'invalid', reason: err } };
  return { ok: true, value: { status: 'completed' } };
}

export function bidLoan(world: WorldState, playerId: string, parentWageShare: number, endDay: number): ActionResult<BidOutcome> {
  const club = humanOf(world);
  const p = world.players[playerId];
  if (!club || !p || p.clubId === null) return fail('invalid loan request');
  const offer: Offer = {
    buyerId: club.id, playerId, fee: 0, wageWeekly: p.contract?.wageWeekly ?? 0, years: 1,
    loan: { parentWageShare: clamp(parentWageShare, 0, 1), endDay, buyOption: null, recallAllowed: true },
  };
  if (!isWindowOpen(world, club)) return { ok: true, value: { status: 'invalid', reason: 'transfer window is closed' } };
  const s = sellerResponse(world, offer);
  if (s.status !== 'accepted') return { ok: true, value: { status: 'rejectedBySeller', reason: s.status === 'rejected' ? s.reason : 'seller wants more' } };
  const pr = playerResponse(world, offer);
  if (pr.status !== 'accepted') return { ok: true, value: { status: 'rejectedByPlayer', reason: pr.status === 'rejected' ? pr.reason : '' } };
  const err = executeTransfer(world, offer);
  return err ? { ok: true, value: { status: 'invalid', reason: err } } : { ok: true, value: { status: 'completed' } };
}

export function signFreeAgentAction(world: WorldState, playerId: string, wageWeekly: number, years: number): ActionResult<BidOutcome> {
  const club = humanOf(world);
  const p = world.players[playerId];
  if (!club || !p || p.retired) return fail('invalid request');
  if (p.clubId !== null) return fail('player is not a free agent');
  const offer: Offer = { buyerId: club.id, playerId, fee: 0, wageWeekly: Math.round(wageWeekly), years };
  const pr = playerResponse(world, offer);
  if (pr.status !== 'accepted') return { ok: true, value: { status: 'rejectedByPlayer', reason: pr.status === 'rejected' ? pr.reason : '', demandedWage: wageDemand(world, club, p) } };
  const err = signFreeAgent(world, club, p, { wageWeekly: Math.round(wageWeekly), years, signingBonus: Math.round(wageWeekly * 6), role: 'rotation' });
  return err ? { ok: true, value: { status: 'invalid', reason: err } } : { ok: true, value: { status: 'completed' } };
}

export function offerRenewal(world: WorldState, playerId: string, wageWeekly: number, years: number): ActionResult<BidOutcome> {
  const club = humanOf(world);
  const p = world.players[playerId];
  if (!club || !p || p.clubId !== club.id || !p.contract) return fail('player is not in your squad');
  if (p.loan) return fail('loaned-in players cannot be renewed');
  const demand = Math.max(p.contract.wageWeekly, baseWageWeekly(marketValue(p, world.day), overall(p)) * 0.95);
  const score = (wageWeekly / demand - 1) * 3 + (p.morale - 55) / 60 + (club.reputation - 50) / 100;
  if (score <= -0.15) return { ok: true, value: { status: 'rejectedByPlayer', reason: 'wage below expectations', demandedWage: Math.round(demand) } };
  p.contract = { ...p.contract, wageWeekly: Math.round(wageWeekly), startDay: world.day, endDay: alignedContractEnd(world.day, world.season, years) };
  return { ok: true, value: { status: 'completed' } };
}

export function releasePlayerAction(world: WorldState, playerId: string): ActionResult {
  const club = humanOf(world);
  const p = world.players[playerId];
  if (!club || !p || p.clubId !== club.id) return fail('player is not in your squad');
  if (p.loan) return fail('loaned-in players must be returned, not released');
  if (squadOf(world, club.id).length <= MIN_SQUAD) return fail(`squad would fall below ${MIN_SQUAD} players`);
  releasePlayer(world, p, 0.5);
  return { ok: true, value: undefined };
}

export interface ScoutReport {
  playerId: string;
  abilityLow: number;
  abilityHigh: number;
  potentialLow: number;
  potentialHigh: number;
  /** 0..1: how reliable the report is (own players = 1). */
  confidence: number;
}

/** What the human club's scouting network believes about a player. Own players are known exactly. */
export function scoutReport(world: WorldState, playerId: string): ActionResult<ScoutReport> {
  const club = humanOf(world);
  const p = world.players[playerId];
  if (!club || !p) return fail('unknown player');
  if (p.clubId === club.id) return { ok: true, value: { playerId, abilityLow: overall(p), abilityHigh: overall(p), potentialLow: p.pot, potentialHigh: p.pot, confidence: 1 } };
  const e = scoutedEstimate(world, club, p);
  const band = 5.5 - 4 * (club.facilities.scouting / 100);
  return {
    ok: true,
    value: {
      playerId, abilityLow: Math.round(e.ability - band), abilityHigh: Math.round(e.ability + band), potentialLow: Math.round(e.potential - band * 1.8),
      potentialHigh: Math.round(Math.min(99, e.potential + band * 1.8)), confidence: clamp(1 - band / 6, 0.1, 0.95),
    },
  };
}

/** Suggested contract terms for a player (what the human club would need to offer to be accepted). */
export function suggestTerms(world: WorldState, playerId: string): ActionResult<{ fee: number; wageWeekly: number; years: number }> {
  const club = humanOf(world);
  const p = world.players[playerId];
  if (!club || !p) return fail('unknown player');
  const wage = wageDemand(world, club, p);
  const fee = p.clubId === null || p.clubId === club.id ? 0 : Math.round(marketValue(p, world.day) * 1.05);
  return { ok: true, value: { fee, wageWeekly: Math.round(wage * 1.08), years: contractYearsFor(ageOf(p, world.day), 0.5) } };
}

/** Best XI at their natural positions, for quick UI display of squad strength. */
export function squadSummary(world: WorldState, clubId: string): { players: number; avgOverall: number; avgAge: number; wageBill: number } {
  const squad = squadOf(world, clubId);
  const n = Math.max(1, squad.length);
  return {
    players: squad.length,
    avgOverall: squad.reduce((a, p) => a + positionalOverall(p, p.primary), 0) / n,
    avgAge: squad.reduce((a, p) => a + ageOf(p, world.day), 0) / n,
    wageBill: squad.reduce((a, p) => a + (p.contract?.wageWeekly ?? 0), 0) * 52,
  };
}

export function freeAgentPool(world: WorldState): Player[] {
  return freeAgents(world);
}

export { assignPlayer };
