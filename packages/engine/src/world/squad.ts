import { clamp } from '../math';
import { generatePlayer } from '../players';
import { Rng } from '../rng';
import { COMPETITIONS } from '../competition/registry';
import { activeRules } from '../competition/engine';
import type { Club, Contract, Player, Position, TransferRecord } from '../types';
import { cultureOfNation, playerName } from './names';
import { addPlayer, assignPlayer, endLoan, loanedOutOf, squadOf } from './runtime';
import { nextId } from './generate';
import { alignedContractEnd } from './calendar';
import type { WorldState } from './types';
import { baseWageWeekly, marketValue } from './valuation';

export const MIN_SQUAD = 18;

export function leagueSquadRules(world: WorldState, club: Club): { maxSquadSize: number; maxForeign: number | null; minHomegrown: number | null; maxLoanIn: number } {
  const def = COMPETITIONS[club.leagueId];
  if (!def) return { maxSquadSize: 30, maxForeign: null, minHomegrown: null, maxLoanIn: 6 };
  const r = activeRules(def, world.season).squad;
  return { maxSquadSize: r.maxSquadSize, maxForeign: r.maxForeignRegistered, minHomegrown: r.minHomegrown, maxLoanIn: r.maxLoanIn };
}

/** Number of registered players that are not nationals of the club's country. */
export function foreignCount(world: WorldState, club: Club): number {
  // players loaned out remain registered by their parent until the loan ends
  return squadOf(world, club.id).filter((p) => p.nationality !== club.country).length + loanedOutOf(world, club.id).filter((p) => p.nationality !== club.country).length;
}

/** Senior squad size: academy prospects (youth-team contracts) do not count toward the registered cap. */
export function registeredCount(world: WorldState, club: Club): number {
  return squadOf(world, club.id).filter((p) => p.contract?.squadRole !== 'prospect').length;
}

/** Returns a human-readable reason if `player` cannot be registered by `club`, otherwise null. */
export function registrationError(world: WorldState, club: Club, player: Player): string | null {
  if (player.retired) return 'player is retired';
  if (player.clubId === club.id) return 'player already registered with this club';
  if (world.day < club.finance.embargoUntilDay) return 'club is under a registration embargo';
  const rules = leagueSquadRules(world, club);
  if (registeredCount(world, club) >= rules.maxSquadSize + 4) return 'squad is full';
  if (rules.maxForeign !== null && player.nationality !== club.country && foreignCount(world, club) >= rules.maxForeign) return `foreign-player limit (${rules.maxForeign}) reached`;
  return null;
}

export function recordTransfer(world: WorldState, rec: Omit<TransferRecord, 'id'>): TransferRecord {
  const full = { id: nextId(world, 'transfer'), ...rec };
  world.transfers.push(full);
  if (world.transfers.length > 60000) world.transfers.splice(0, world.transfers.length - 50000);
  return full;
}

export function addLedger(club: Club, category: string, amount: number): void {
  club.finance.seasonLedger[category] = (club.finance.seasonLedger[category] ?? 0) + amount;
}

export function pay(club: Club, category: string, amount: number): void {
  club.finance.cash -= amount;
  addLedger(club, category, -amount);
}

export function receive(club: Club, category: string, amount: number): void {
  club.finance.cash += amount;
  addLedger(club, category, amount);
}

/** Make `player` a free agent. The club pays a settlement of `settlementFraction` of the remaining wages. */
export function releasePlayer(world: WorldState, player: Player, settlementFraction = 0.5, kind: TransferRecord['kind'] = 'release'): void {
  const club = player.clubId ? world.clubs[player.clubId] : undefined;
  if (club && player.contract && settlementFraction > 0) {
    const remainingWeeks = Math.max(0, (player.contract.endDay - world.day) / 7);
    pay(club, 'contractSettlements', Math.round(remainingWeeks * player.contract.wageWeekly * settlementFraction));
  }
  recordTransfer(world, { day: world.day, playerId: player.id, fromClubId: player.clubId, toClubId: null, kind, fee: 0, wageWeekly: player.contract?.wageWeekly ?? 0 });
  assignPlayer(world, player, null);
  player.contract = null;
  endLoan(world, player);
  player.freeSince = world.day;
  delete world.transferList[player.id];
}

export interface SignParams {
  wageWeekly: number;
  years: number;
  signingBonus?: number;
  releaseClause?: number | null;
  role?: Contract['squadRole'];
}

/** Register a free agent (or a player whose previous club-link was already removed). No fee involved. */
export function signFreeAgent(world: WorldState, club: Club, player: Player, params: SignParams): string | null {
  if (player.clubId !== null) return 'player is not a free agent';
  const err = registrationError(world, club, player);
  if (err) return err;
  const bonus = params.signingBonus ?? 0;
  const first = Math.round(params.wageWeekly * 1);
  if (first < 0 || !Number.isFinite(first)) return 'invalid terms';
  player.contract = {
    clubId: club.id, wageWeekly: params.wageWeekly, startDay: world.day, endDay: alignedContractEnd(world.day, world.season, params.years),
    signingBonus: bonus, releaseClause: params.releaseClause ?? null, squadRole: params.role ?? 'rotation',
  };
  player.freeSince = null;
  player.lastMoveDay = world.day;
  assignPlayer(world, player, club.id);
  if (bonus > 0) pay(club, 'signingBonuses', bonus);
  recordTransfer(world, { day: world.day, playerId: player.id, fromClubId: null, toClubId: club.id, kind: 'free', fee: 0, wageWeekly: params.wageWeekly });
  club.cohesion = clamp(club.cohesion - 0.02, 0.1, 1);
  return null;
}

/** Create an academy graduate for a club. Used for annual intake and emergency cover. */
export function createYouthPlayer(world: WorldState, club: Club, rng: Rng, position: Position, ability: number, age: number, potential?: number): Player {
  const nat = club.country;
  const id = nextId(world, 'player');
  const p = generatePlayer(rng, { id, name: playerName(cultureOfNation(nat), rng), nationality: nat, age, day: world.day, position, ability: clamp(ability, 20, 90), potential });
  p.clubId = null;
  addPlayer(world, p);
  const wage = Math.max(700, baseWageWeekly(marketValue(p, world.day), ability) * 0.5);
  p.contract = { clubId: club.id, wageWeekly: Math.round(wage / 100) * 100, startDay: world.day, endDay: alignedContractEnd(world.day, world.season, 3), signingBonus: 0, releaseClause: null, squadRole: 'prospect' };
  assignPlayer(world, p, club.id);
  recordTransfer(world, { day: world.day, playerId: id, fromClubId: null, toClubId: club.id, kind: 'youth', fee: 0, wageWeekly: p.contract.wageWeekly });
  return p;
}
