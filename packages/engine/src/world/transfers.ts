/**
 * Transfer market. A single validated execution path (`executeTransfer`) is used by AI clubs and by the human
 * player's actions, so contracts, finances and registrations cannot diverge between the two.
 *
 * AI clubs do not know true ratings: they work from `scoutedEstimate`, a deterministic noisy view whose error
 * shrinks with the club's scouting facility. They are limited by transfer budget, wage budget, squad limits,
 * foreign-player rules and embargoes.
 */
import { clamp } from '../math';
import { ageOf, overall, positionalOverall } from '../players';
import { keyedNoise, Rng } from '../rng';
import { LEAGUE_BY_ID } from '../competition/registry';
import { POSITION_GROUP, type Club, type Player, type Position } from '../types';
import { formationOf } from '../tactics';
import { allPlayers, assignPlayer, endLoan, freeAgents, squadOf, startLoan } from './runtime';
import { createYouthPlayer, leagueSquadRules, MIN_SQUAD, registeredCount, pay, receive, recordTransfer, registrationError, releasePlayer, signFreeAgent } from './squad';
import type { WorldState } from './types';
import { baseWageWeekly, contractYearsFor, marketValue } from './valuation';
import { alignedContractEnd, seasonStartDay } from './calendar';
import { nextId } from './generate';

// ---------------------------------------------------------------- windows

export function windowWeeks(world: WorldState, club: Club): [number, number][] {
  return LEAGUE_BY_ID[club.leagueId] ? (LEAGUE_BY_ID[club.leagueId]!.transferWindows) : [[0, 5], [22, 25]];
}

export function isWindowOpen(world: WorldState, club: Club, day = world.day): boolean {
  const rel = day - seasonStartDay(world.season);
  const week = Math.floor(rel / 7);
  return windowWeeks(world, club).some(([a, b]) => week >= a && week <= b);
}

/** Days remaining in the current window for a club (0 if closed). */
export function windowDaysLeft(world: WorldState, club: Club): number {
  if (!isWindowOpen(world, club)) return 0;
  const rel = world.day - seasonStartDay(world.season);
  const week = Math.floor(rel / 7);
  const w = windowWeeks(world, club).find(([a, b]) => week >= a && week <= b);
  return w ? (w[1] + 1) * 7 - rel : 0;
}

// ---------------------------------------------------------------- knowledge

export interface Estimate { ability: number; potential: number }

/** A club's imperfect view of a player. Own players are known exactly. */
export function scoutedEstimate(world: WorldState, club: Club, p: Player): Estimate {
  const ov = overall(p);
  if (p.clubId === club.id) return { ability: ov, potential: p.pot };
  const sd = 5.5 - 4 * (club.facilities.scouting / 100);
  const league = p.clubId ? world.clubs[p.clubId]?.leagueId : null;
  const known = league && club.leagueId === league ? 0.5 : 1; // domestic players are scouted better
  const a = keyedNoise(club.id, p.id, 'a');
  const b = keyedNoise(club.id, p.id, 'p');
  return { ability: ov + a * sd * known * 1.7, potential: p.pot + b * sd * known * 2.6 };
}

// ---------------------------------------------------------------- needs

export function assessNeeds(world: WorldState, club: Club): Record<string, number> {
  const fm = formationOf(club.tactics.formation);
  const squad = squadOf(world, club.id).filter((p) => !p.injury || p.injury.returnDay - world.day < 40);
  const needs: Record<string, number> = {};
  const slotCount = new Map<Position, number>();
  for (const pos of fm.slots) slotCount.set(pos, (slotCount.get(pos) ?? 0) + 1);
  const meanXI = [...squad].map(overall).sort((a, b) => b - a).slice(0, 11).reduce((a, b) => a + b, 0) / 11;
  for (const [pos, n] of slotCount) {
    const candidates = squad
      .map((p) => ({ p, v: positionalOverall(p, pos) }))
      .sort((a, b) => b.v - a.v);
    const natural = squad.filter((p) => p.primary === pos).length;
    const need = n + (pos === 'GK' ? 1 : 1);
    const depthGap = clamp((need - natural) / Math.max(1, need), 0, 1);
    const starters = candidates.slice(0, n);
    const qualityGap = starters.length ? clamp((meanXI - starters.reduce((a, c) => a + c.v, 0) / starters.length) / 12, 0, 1) : 1;
    needs[pos] = clamp(0.6 * depthGap + 0.7 * qualityGap, 0, 1);
  }
  return needs;
}

// ---------------------------------------------------------------- offers

export interface Offer {
  buyerId: string;
  playerId: string;
  fee: number;
  wageWeekly: number;
  years: number;
  /** When set the move is a loan; `parentWageShare` is the parent's share of the wage. */
  loan?: { parentWageShare: number; endDay: number; buyOption: number | null; recallAllowed: boolean };
}

export type Response =
  | { status: 'accepted' }
  | { status: 'rejected'; reason: string }
  | { status: 'counter'; fee: number; reason: string };

function importanceInSquad(world: WorldState, seller: Club, p: Player): number {
  const squad = squadOf(world, seller.id);
  const ov = positionalOverall(p, p.primary);
  const better = squad.filter((q) => q !== p && q.primary === p.primary && positionalOverall(q, p.primary) > ov).length;
  const age = ageOf(p, world.day);
  const prospect = age < 22 && p.pot - overall(p) > 8 ? 0.2 : 0;
  return better === 0 ? 1.0 + prospect : better === 1 ? 0.85 + prospect : 0.65 + prospect;
}

export function sellerReserve(world: WorldState, seller: Club, p: Player): number {
  const value = marketValue(p, world.day);
  const imp = importanceInSquad(world, seller, p);
  const pressure = seller.finance.cash < 0 ? 0.88 : seller.finance.debt > seller.finance.broadcastingAnnual ? 0.93 : 1;
  const wealthy = seller.ownership.wealth > 80 ? 1.08 : 1;
  const listed = world.transferList[p.id] ? 0.92 : 1;
  const stance = 0.85 + 0.45 * (imp - 0.65) / 0.55;
  return Math.round(value * stance * pressure * wealthy * listed);
}

export function sellerResponse(world: WorldState, offer: Offer): Response {
  const p = world.players[offer.playerId];
  if (!p || p.retired || p.clubId === null) return { status: 'rejected', reason: 'player unavailable' };
  const seller = world.clubs[p.clubId] as Club;
  const squad = squadOf(world, seller.id);
  if (squad.length - 1 < MIN_SQUAD) return { status: 'rejected', reason: 'seller needs the squad depth' };
  if (p.primary === 'GK' && squad.filter((q) => q.primary === 'GK').length <= 2) return { status: 'rejected', reason: 'seller needs goalkeeper cover' };
  if (p.contract?.releaseClause != null && offer.fee >= p.contract.releaseClause && !offer.loan) return { status: 'accepted' };
  if (offer.loan) {
    const share = offer.loan.parentWageShare;
    const value = marketValue(p, world.day);
    const minFee = value * 0.02 * ((offer.loan.endDay - world.day) / 180);
    if (offer.fee >= minFee * 0.5 && importanceInSquad(world, seller, p) < 1.0 && share <= 0.7) return { status: 'accepted' };
    return { status: 'rejected', reason: 'seller wants to keep the player' };
  }
  const reserve = sellerReserve(world, seller, p);
  if (offer.fee >= reserve) return { status: 'accepted' };
  if (offer.fee >= reserve * 0.86) return { status: 'counter', fee: reserve, reason: 'close; seller asks for more' };
  return { status: 'rejected', reason: 'offer far below valuation' };
}

/** Minimum weekly wage the player would accept to join `buyer` (true preferences, never shown directly to AI). */
export function wageDemand(world: WorldState, buyer: Club, p: Player): number {
  const value = marketValue(p, world.day);
  const base = baseWageWeekly(value, overall(p));
  const current = p.contract?.wageWeekly ?? 0;
  const from = p.clubId ? world.clubs[p.clubId] : undefined;
  const repGap = from ? (from.reputation - buyer.reputation) / 60 : 0;
  const leagueGap = (LEAGUE_BY_ID[from?.leagueId ?? buyer.leagueId]?.quality ?? 55) - (LEAGUE_BY_ID[buyer.leagueId]?.quality ?? 55);
  const wantsMore = 1 + clamp(repGap, -0.1, 0.35) + clamp(leagueGap / 80, -0.1, 0.2);
  // players (and their agents) ask more from clubs with visible wage headroom
  const bill = squadOf(world, buyer.id).reduce((a, q) => a + (q.contract?.wageWeekly ?? 0), 0);
  const slack = clamp(buyer.finance.wageBudgetWeekly / Math.max(1, bill) - 1, 0, 1);
  return Math.round((Math.max(current * 1.05, base * 0.9) * wantsMore * (1 + 0.35 * slack)) / 100) * 100;
}

export function playerResponse(world: WorldState, offer: Offer): Response {
  const p = world.players[offer.playerId] as Player;
  const buyer = world.clubs[offer.buyerId] as Club;
  const demand = wageDemand(world, buyer, p);
  const squad = squadOf(world, buyer.id);
  const abil = overall(p);
  const ahead = squad.filter((q) => q.primary === p.primary && positionalOverall(q, p.primary) > abil + 1).length;
  const playingTime = ahead === 0 ? 0.35 : ahead === 1 ? 0 : -0.35;
  const prestige = (buyer.reputation - (p.clubId ? (world.clubs[p.clubId]?.reputation ?? 50) : 40)) / 45;
  const wageScore = (offer.wageWeekly / demand - 1) * 2.2;
  const noise = keyedNoise(p.id, buyer.id, 'accept') * 0.12;
  const score = wageScore + prestige * 0.5 + playingTime + noise + (p.morale < 40 ? 0.2 : 0);
  if (offer.loan) {
    return score + 0.2 > -0.05 ? { status: 'accepted' } : { status: 'rejected', reason: 'player refuses loan move' };
  }
  return score > 0 ? { status: 'accepted' } : { status: 'rejected', reason: wageScore < 0 ? 'wage demands not met' : 'player prefers another path' };
}

function installmentsFor(fee: number): number {
  return fee > 25e6 ? 3 : fee > 6e6 ? 2 : 1;
}

/** Execute a fully agreed move. Returns an error string if any validation fails (nothing is changed then). */
export function executeTransfer(world: WorldState, offer: Offer): string | null {
  const p = world.players[offer.playerId];
  const buyer = world.clubs[offer.buyerId];
  if (!p || !buyer) return 'unknown player or club';
  if (p.retired) return 'player is retired';
  if (p.clubId === null) return 'player is a free agent; use signFreeAgent';
  if (p.loan && !offer.loan) return 'player is on loan and cannot be sold';
  const seller = world.clubs[p.clubId] as Club;
  if (seller.id === buyer.id) return 'buyer and seller are the same club';
  if (!isWindowOpen(world, buyer) || !isWindowOpen(world, seller)) return 'transfer window is closed';
  if (p.lastMoveDay !== null && world.day - p.lastMoveDay < 120) return 'player moved too recently';
  if (offer.fee < 0 || offer.wageWeekly < 0 || offer.years <= 0) return 'invalid terms';
  const err = registrationError(world, buyer, p);
  if (err) return err;
  if (squadOf(world, seller.id).length - 1 < MIN_SQUAD) return 'seller squad too small';
  const agentFee = Math.round(offer.fee * 0.04 + offer.wageWeekly * 8);
  const bonus = Math.round(offer.wageWeekly * (offer.loan ? 0 : 6));
  const firstPayment = Math.round(offer.fee / installmentsFor(offer.fee));
  if (offer.fee > buyer.finance.transferBudget) return 'fee exceeds transfer budget';
  const wageBill = squadOf(world, buyer.id).reduce((a, q) => a + (q.contract?.wageWeekly ?? 0), 0);
  if (!offer.loan && wageBill + offer.wageWeekly > buyer.finance.wageBudgetWeekly * 1.02) return 'exceeds wage budget';
  if (buyer.finance.cash - firstPayment - agentFee - bonus < -buyer.finance.transferBudget * 0.5 - buyer.ownership.wealth * 1e5) return 'cannot fund the deal';

  if (offer.loan) return executeLoan(world, offer, p, buyer, seller);

  const n = installmentsFor(offer.fee);
  buyer.finance.transferBudget -= offer.fee;
  seller.finance.transferBudget += Math.round(offer.fee * 0.5);
  pay(buyer, 'transferFees', firstPayment);
  receive(seller, 'transferFees', firstPayment);
  for (let i = 1; i < n; i++) {
    buyer.finance.installments.push({ dueDay: world.day + i * 182, amount: -Math.round(offer.fee / n), counterpartyId: seller.id, memo: `Transfer of ${p.name}` });
  }
  if (agentFee > 0) pay(buyer, 'agentFees', agentFee);
  if (bonus > 0) pay(buyer, 'signingBonuses', bonus);
  const prev = seller.id;
  assignPlayer(world, p, buyer.id);
  const ahead = squadOf(world, buyer.id).filter((q) => q !== p && q.primary === p.primary && positionalOverall(q, p.primary) > overall(p)).length;
  p.contract = {
    clubId: buyer.id, wageWeekly: offer.wageWeekly, startDay: world.day, endDay: alignedContractEnd(world.day, world.season, offer.years), signingBonus: bonus,
    releaseClause: offer.fee >= 2e7 && keyedNoise(p.id, buyer.id, 'rc') > 0.2 ? Math.round((offer.fee * 1.7) / 1e6) * 1e6 : null,
    squadRole: ahead === 0 ? 'first' : ahead === 1 ? 'rotation' : 'backup',
  };
  p.lastMoveDay = world.day;
  p.morale = clamp(p.morale + 6, 10, 100);
  delete world.transferList[p.id];
  buyer.cohesion = clamp(buyer.cohesion - 0.02, 0.1, 1);
  seller.cohesion = clamp(seller.cohesion - 0.015, 0.1, 1);
  const rec = recordTransfer(world, { day: world.day, playerId: p.id, fromClubId: prev, toClubId: buyer.id, kind: 'transfer', fee: offer.fee, wageWeekly: offer.wageWeekly });
  if (offer.fee >= 15e6 || overall(p) >= 78) {
    world.news.push({
      id: nextId(world, 'news'), day: world.day, kind: 'transfer', clubIds: [buyer.id, prev], playerIds: [p.id],
      text: `${buyer.name} sign ${p.name} from ${seller.name} for €${(offer.fee / 1e6).toFixed(1)}m.`, ref: rec.id,
    });
  }
  return null;
}

function executeLoan(world: WorldState, offer: Offer, p: Player, buyer: Club, seller: Club): string | null {
  const loan = offer.loan as NonNullable<Offer['loan']>;
  if (p.loan) return 'player is already on loan';
  const loansIn = squadOf(world, buyer.id).filter((q) => q.loan).length;
  if (loansIn >= leagueSquadRules(world, buyer).maxLoanIn) return 'loan limit reached';
  if (loan.endDay <= world.day + 30) return 'loan too short';
  if (offer.fee > 0) {
    pay(buyer, 'loanFees', offer.fee);
    receive(seller, 'loanFees', offer.fee);
  }
  assignPlayer(world, p, buyer.id);
  startLoan(world, p, { parentClubId: seller.id, startDay: world.day, endDay: loan.endDay, parentWageShare: loan.parentWageShare, recallAllowed: loan.recallAllowed, buyOption: loan.buyOption });
  p.lastMoveDay = world.day;
  recordTransfer(world, { day: world.day, playerId: p.id, fromClubId: seller.id, toClubId: buyer.id, kind: 'loan', fee: offer.fee, wageWeekly: p.contract?.wageWeekly ?? 0 });
  return null;
}

/** Return finished loans and process recalls. */
export function processLoans(world: WorldState): void {
  for (const p of allPlayers(world)) {
    if (!p.loan || p.retired) continue;
    // Recall clause: the parent club recalls a loanee when it is short of healthy players in his position group.
    const parentClub = world.clubs[p.loan.parentClubId];
    if (parentClub && p.loan.recallAllowed && isWindowOpen(world, parentClub) && p.clubId !== p.loan.parentClubId) {
      const healthy = squadOf(world, parentClub.id).filter((q) => POSITION_GROUP[q.primary] === POSITION_GROUP[p.primary] && !(q.injury && q.injury.returnDay > world.day + 21));
      const need = p.primary === 'GK' ? 2 : 4;
      if (healthy.length < need) {
        recordTransfer(world, { day: world.day, playerId: p.id, fromClubId: p.clubId, toClubId: parentClub.id, kind: 'recall', fee: 0, wageWeekly: p.contract?.wageWeekly ?? 0 });
        endLoan(world, p);
        assignPlayer(world, p, parentClub.id);
        continue;
      }
    }
    if (world.day >= p.loan.endDay) {
      const parent = world.clubs[p.loan.parentClubId];
      recordTransfer(world, { day: world.day, playerId: p.id, fromClubId: p.clubId, toClubId: p.loan.parentClubId, kind: 'loanReturn', fee: 0, wageWeekly: p.contract?.wageWeekly ?? 0 });
      endLoan(world, p);
      if (parent) assignPlayer(world, p, parent.id);
      else releasePlayer(world, p, 0, 'free');
    }
  }
}

// ---------------------------------------------------------------- AI recruitment

function wageBill(world: WorldState, club: Club): number {
  let s = 0;
  for (const p of squadOf(world, club.id)) if (p.contract) s += p.loan ? p.contract.wageWeekly * (1 - p.loan.parentWageShare) : p.contract.wageWeekly;
  return s;
}

interface Candidate { p: Player; est: Estimate; value: number; score: number; gain: number }

function styleBonus(club: Club, p: Player, est: Estimate, age: number, value: number): number {
  switch (club.philosophy) {
    case 'youthDeveloper': return age <= 22 ? 4 + (est.potential - est.ability) * 0.25 : -3;
    case 'superstarBuilder': return est.ability >= 78 ? 5 : -1;
    case 'sustainable': return -Math.log10(value + 1) * 0.6 + (age <= 27 ? 1 : -1);
    case 'highPress': return p.attrs.workRate + p.attrs.stamina > 140 ? 2 : 0;
    case 'possession': return p.attrs.passing + p.attrs.firstTouch > 140 ? 2 : 0;
    case 'counterAttack': return p.attrs.pace + p.attrs.acceleration > 140 ? 2 : 0;
    default: return 0;
  }
}

export function pickCandidates(world: WorldState, club: Club, pos: Position, rng: Rng, pool: Player[]): Candidate[] {
  const squad = squadOf(world, club.id);
  const slotNeed = squad.filter((q) => q.primary === pos).sort((a, b) => overall(b) - overall(a));
  const bar = slotNeed.length ? overall(slotNeed[Math.min(slotNeed.length - 1, 1)] as Player) : 40;
  const rules = leagueSquadRules(world, club);
  const out: Candidate[] = [];
  const sample: Player[] = [];
  for (let i = 0; i < 70; i++) sample.push(pool[rng.int(pool.length)] as Player);
  for (const id of Object.keys(world.transferList)) {
    const lp = world.players[id];
    if (lp) sample.push(lp);
  }
  sample.push(...freeAgents(world).slice(0, 40));
  const seen = new Set<string>();
  for (const p of sample) {
    if (!p || seen.has(p.id) || p.retired || p.clubId === club.id) continue;
    seen.add(p.id);
    if (POSITION_GROUP[p.primary] !== POSITION_GROUP[pos]) continue;
    if (p.primary !== pos && (p.positions[pos] ?? 0) < 0.8) continue;
    if (p.loan) continue;
    // The human club's players are sold only through the user's listing (see resolveListedPlayersOfHuman), never by AI haggling.
    if (p.clubId !== null && p.clubId === world.config.humanClubId && !(p.contract?.releaseClause != null)) continue;
    if (p.injury && p.injury.returnDay - world.day > 45) continue;
    if (p.lastMoveDay !== null && world.day - p.lastMoveDay < 120) continue;
    if (rules.maxForeign !== null && p.nationality !== club.country && squad.filter((q) => q.nationality !== club.country).length >= rules.maxForeign) continue;
    if ((world.ai[club.id]?.cooldown[p.id] ?? -1) > world.day) continue;
    const est = scoutedEstimate(world, club, p);
    const age = ageOf(p, world.day);
    const seller = p.clubId ? world.clubs[p.clubId] : undefined;
    if (seller && seller.reputation > club.reputation + 35 && !world.transferList[p.id]) continue; // elite clubs rarely sell to far smaller clubs
    const value = marketValue(p, world.day, est);
    const gain = est.ability - bar;
    const minGain = club.reputation > 75 ? 2 : club.reputation > 50 ? 0 : -4;
    if (gain < minGain) continue;
    const futureGain = age <= 23 ? (est.potential - est.ability) * 0.2 : 0;
    const score = gain * 1.0 + futureGain + styleBonus(club, p, est, age, value) - Math.log2(value / 1e6 + 1.2) * 0.8 - (age > 31 ? (age - 31) * 0.7 : 0) + (world.transferList[p.id] ? 1.5 : 0);
    out.push({ p, est, value, score, gain });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 6);
}

function positionWeightedPick(rng: Rng, needs: Record<string, number>): Position | null {
  const entries = Object.entries(needs).filter(([, v]) => v > 0.12);
  if (entries.length === 0) return null;
  const idx = rng.weightedIndex(entries.map(([, v]) => v * v));
  return entries[idx]?.[0] as Position;
}

export function aiTryBuy(world: WorldState, club: Club, rng: Rng, pool: Player[]): boolean {
  const ai = world.ai[club.id];
  if (!ai) return false;
  if (world.day < club.finance.embargoUntilDay) return false;
  const rules = leagueSquadRules(world, club);
  const squad = squadOf(world, club.id);
  if (registeredCount(world, club) >= rules.maxSquadSize + 1) return false;
  if (world.day - ai.lastReviewDay >= 7 || Object.keys(ai.needs).length === 0) {
    ai.needs = assessNeeds(world, club);
    ai.lastReviewDay = world.day;
  }
  let pos = positionWeightedPick(rng, ai.needs);
  if (!pos) {
    // Clubs with spare budget look to upgrade their weakest starting slot; rich owners chase marquee signings.
    const revenue = club.finance.broadcastingAnnual + club.finance.sponsorshipAnnual;
    const upgradeChance = clamp(club.finance.transferBudget / Math.max(1, revenue * 0.35), 0, 0.55) + (club.ownership.wealth > 75 ? 0.1 : 0);
    if (!rng.chance(upgradeChance)) return false;
    const fm = formationOf(club.tactics.formation);
    const weakest = [...new Set(fm.slots)].map((sp) => ({ sp, v: Math.max(0, ...squad.filter((q) => q.primary === sp).map(overall)) })).sort((a, b) => a.v - b.v)[0];
    pos = (rng.chance(0.3) ? (['ST', 'AM', 'CM', 'LW', 'RW', 'CB'] as Position[])[rng.int(6)] : weakest?.sp) as Position;
  }
  const cands = pickCandidates(world, club, pos, rng, pool);
  const aggression = (LEAGUE_BY_ID[club.leagueId]?.transferAggression ?? 1) * (club.ownership.wealth > 80 ? 1.12 : 1);
  const bill = wageBill(world, club);
  for (const c of cands) {
    const p = c.p;
    // free agent: just negotiate the wage
    const demand = wageDemand(world, club, p);
    const wageRoom = club.finance.wageBudgetWeekly - bill;
    for (const mult of [1.0, 1.18]) {
      const wage = Math.round(demand * mult * Math.min(1.3, aggression) / 100) * 100;
      if (wage > wageRoom * 1.0 && club.ownership.wealth < 85) break;
      const years = contractYearsFor(ageOf(p, world.day), rng.next());
      if (p.clubId === null) {
        const resp = playerResponse(world, { buyerId: club.id, playerId: p.id, fee: 0, wageWeekly: wage, years });
        if (resp.status === 'accepted') {
          const err = signFreeAgent(world, club, p, { wageWeekly: wage, years, signingBonus: wage * 6, role: 'rotation' });
          if (!err) { ai.dealsThisWindow++; return true; }
        }
        continue;
      }
      let fee = Math.round(c.value * (0.95 + 0.1 * aggression) / 1000) * 1000;
      for (let round = 0; round < 3; round++) {
        if (fee > club.finance.transferBudget) break;
        const offer: Offer = { buyerId: club.id, playerId: p.id, fee, wageWeekly: wage, years };
        const sr = sellerResponse(world, offer);
        if (sr.status === 'accepted') {
          const pr = playerResponse(world, offer);
          if (pr.status === 'accepted') {
            const err = executeTransfer(world, offer);
            if (!err) { ai.dealsThisWindow++; return true; }
          }
          break;
        }
        if (sr.status === 'counter') fee = sr.fee;
        else break;
      }
    }
    ai.cooldown[p.id] = world.day + 45;
  }
  return false;
}

/** AI squad management on the sell side: list or release surplus players. */
export function aiReviewSurplus(world: WorldState, club: Club, rng: Rng): void {
  const squad = [...squadOf(world, club.id)];
  const rules = leagueSquadRules(world, club);
  const byValue = squad.map((p) => ({ p, v: overall(p) + (ageOf(p, world.day) < 22 ? (p.pot - overall(p)) * 0.4 : 0) })).sort((a, b) => a.v - b.v);
  const surplus = squad.length - (rules.maxSquadSize - 1);
  for (let i = 0; i < Math.max(0, surplus); i++) {
    const cand = byValue[i]?.p;
    if (!cand || cand.primary === 'GK' && squad.filter((q) => q.primary === 'GK').length <= 2) continue;
    if (!world.transferList[cand.id]) world.transferList[cand.id] = { askingPrice: Math.round(marketValue(cand, world.day) * 1.05), day: world.day };
  }
  // list unhappy fringe players
  for (const p of squad) {
    if (!p.contract || p.loan) continue;
    if (p.morale < 35 && p.contract.squadRole === 'backup' && rng.chance(0.2) && !world.transferList[p.id]) {
      world.transferList[p.id] = { askingPrice: Math.round(marketValue(p, world.day) * 1.05), day: world.day };
    }
  }
}

/** Run one day of AI transfer activity. */
export function runTransferDay(world: WorldState): void {
  const rng = Rng.fromSeed(`${world.config.seed}:tr:${world.day}`);
  const pool = allPlayers(world).filter((p) => !p.retired && p.clubId !== null);
  if (pool.length === 0) return;
  for (const club of Object.values(world.clubs)) {
    if (club.id === world.config.humanClubId) continue;
    if (!isWindowOpen(world, club)) continue;
    const ai = world.ai[club.id];
    if (!ai || ai.dealsThisWindow >= 6) continue;
    const left = windowDaysLeft(world, club);
    const rel = world.day - seasonStartDay(world.season);
    const rate = (left <= 3 ? 0.55 : left <= 10 ? 0.3 : 0.16) + (rel % 7 === 0 ? 0.05 : 0);
    if (!rng.chance(rate)) continue;
    if (rel % 14 === 0) aiReviewSurplus(world, club, rng.derive(`s:${club.id}`));
    aiTryBuy(world, club, rng.derive(`b:${club.id}`), pool);
    trimSquad(world, club);
  }
  // sell-side: AI accepts bids for the human club's listed players
  if (world.config.humanClubId) resolveListedPlayersOfHuman(world, rng.derive('human-listed'));
}

/**
 * AI clubs buy the human club's listed players, but never pay more than their own valuation: the asking price is a
 * floor the user sets, not money the AI is obliged to hand over (prevents list-at-absurd-price exploits).
 */
function resolveListedPlayersOfHuman(world: WorldState, rng: Rng): void {
  const humanId = world.config.humanClubId as string;
  for (const [pid, entry] of Object.entries(world.transferList)) {
    const p = world.players[pid];
    if (!p || p.clubId !== humanId) continue;
    if (!rng.chance(0.06)) continue;
    // a random interested AI club bids at or above the asking price if it fits
    const value = marketValue(p, world.day);
    const buyers = Object.values(world.clubs).filter((c) => c.id !== humanId && isWindowOpen(world, c) && c.reputation >= (world.clubs[humanId]?.reputation ?? 50) - 25);
    if (buyers.length === 0) continue;
    const buyer = buyers[rng.int(buyers.length)] as Club;
    const aggression = (LEAGUE_BY_ID[buyer.leagueId]?.transferAggression ?? 1) * (buyer.ownership.wealth > 80 ? 1.12 : 1);
    const maxPay = Math.round(value * (0.95 + 0.1 * aggression));
    if (entry.askingPrice > maxPay || buyer.finance.transferBudget < entry.askingPrice) continue; // asking more than the AI values him at: no deal
    const wage = wageDemand(world, buyer, p);
    const offer: Offer = { buyerId: buyer.id, playerId: pid, fee: entry.askingPrice, wageWeekly: wage, years: contractYearsFor(ageOf(p, world.day), 0.5) };
    if (playerResponse(world, offer).status === 'accepted') executeTransfer(world, offer);
  }
}

/** Keep squads inside registration limits by releasing the least valuable surplus players. */
export function trimSquad(world: WorldState, club: Club): void {
  const rules = leagueSquadRules(world, club);
  if (club.id === world.config.humanClubId) return;
  const squad = squadOf(world, club.id).filter((p) => p.contract?.squadRole !== 'prospect');
  let over = squad.length - rules.maxSquadSize;
  if (over <= 0) return;
  const ranked = squad
    .filter((p) => !(p.primary === 'GK' && squad.filter((q) => q.primary === 'GK').length <= 2))
    .sort((a, b) => (overall(a) + (a.pot - overall(a)) * 0.3) - (overall(b) + (b.pot - overall(b)) * 0.3));
  for (const p of ranked) {
    if (over <= 0) break;
    // prefer to loan out young prospects instead of releasing them
    if (!p.loan && ageOf(p, world.day) < 21 && p.pot - overall(p) > 6 && tryLoanOut(world, club, p)) { over--; continue; }
    releasePlayer(world, p, p.contract && p.contract.endDay - world.day > 365 ? 0.5 : 0.25);
    over--;
  }
}

function tryLoanOut(world: WorldState, parent: Club, p: Player): boolean {
  const rng = Rng.fromSeed(`${world.config.seed}:loan:${p.id}:${world.day}`);
  const candidates = Object.values(world.clubs)
    .filter((c) => c.id !== parent.id && c.country === parent.country && c.reputation < parent.reputation && squadOf(world, c.id).length < leagueSquadRules(world, c).maxSquadSize - 1);
  const borrowers = rng.shuffle(candidates).slice(0, 6);
  for (const b of borrowers) {
    const offer: Offer = {
      buyerId: b.id, playerId: p.id, fee: 0, wageWeekly: p.contract?.wageWeekly ?? 1000, years: 1,
      loan: { parentWageShare: 0.5, endDay: seasonStartDay(world.season + 1) + 5, buyOption: null, recallAllowed: true },
    };
    if (playerResponse(world, offer).status !== 'accepted') continue;
    const err = isWindowOpen(world, b) && isWindowOpen(world, parent) ? executeTransfer(world, offer) : executeLoanBypassWindow(world, offer);
    if (!err) return true;
  }
  return false;
}

/** Loans arranged during season roll-over (outside windows) bypass the window check but nothing else. */
function executeLoanBypassWindow(world: WorldState, offer: Offer): string | null {
  const p = world.players[offer.playerId] as Player;
  const buyer = world.clubs[offer.buyerId] as Club;
  const seller = world.clubs[p.clubId as string] as Club;
  const err = registrationError(world, buyer, p);
  if (err) return err;
  return executeLoan(world, offer, p, buyer, seller);
}

// ---------------------------------------------------------------- contracts

/** Weekly: AI clubs renew valued players with a year or less left; others walk at expiry. */
export function aiContractRenewals(world: WorldState): void {
  const rng = Rng.fromSeed(`${world.config.seed}:renew:${world.day}`);
  for (const club of Object.values(world.clubs)) {
    if (club.id === world.config.humanClubId) continue;
    const squad = squadOf(world, club.id);
    const ranked = [...squad].sort((a, b) => overall(b) - overall(a));
    const bill = wageBill(world, club);
    let room = club.finance.wageBudgetWeekly * 1.05 - bill;
    for (let i = 0; i < ranked.length; i++) {
      const p = ranked[i] as Player;
      if (!p.contract || p.loan || p.contract.endDay - world.day > 365) continue;
      const age = ageOf(p, world.day);
      const worth = i < 16 || (age < 22 && p.pot - overall(p) > 8);
      if (!worth || age > 35) continue;
      if (!rng.chance(0.18)) continue;
      const value = marketValue(p, world.day);
      const wage = Math.round(Math.max(p.contract.wageWeekly, baseWageWeekly(value, overall(p)) * 0.95) * (1 + 0.05 * rng.next()) / 100) * 100;
      const extra = wage - p.contract.wageWeekly;
      if (extra > room) continue;
      const score = (wage / Math.max(1, p.contract.wageWeekly) - 1) * 3 + (p.morale - 55) / 60 + (club.reputation - 50) / 100;
      if (score > -0.15) {
        p.contract = {
          ...p.contract, wageWeekly: wage, startDay: world.day, endDay: alignedContractEnd(world.day, world.season, contractYearsFor(age, rng.next())),
          signingBonus: 0, squadRole: i < 11 ? 'first' : i < 16 ? 'rotation' : 'backup',
        };
        room -= extra;
        pay(club, 'signingBonuses', wage * 4);
      }
    }
  }
}

// ---------------------------------------------------------------- free agents, emergency cover, loans

/**
 * Unattached players who stay unemployed leave professional football: the pool would otherwise grow without
 * bound. Weaker and older players leave sooner.
 */
export function weeklyFreeAgentCull(world: WorldState): number {
  const rng = Rng.fromSeed(`${world.config.seed}:cull:${world.day}`);
  let n = 0;
  for (const p of freeAgents(world)) {
    const since = p.freeSince ?? world.day;
    if (world.day - since < 120) continue;
    const ov = overall(p);
    const age = ageOf(p, world.day);
    const q = clamp(0.03 + (world.day - since - 120) / 4000 + (55 - ov) * 0.006 + Math.max(0, age - 30) * 0.01, 0, 0.5);
    if (rng.chance(q)) {
      retireFree(world, p);
      n++;
    }
  }
  return n;
}

function retireFree(world: WorldState, p: Player): void {
  p.retired = true;
  p.contract = null;
  assignPlayer(world, p, null);
  // assignPlayer re-adds retired free agents to the free set only if not retired; keep the index clean
  delete world.transferList[p.id];
}

/** Emergency cover: a club below the minimum squad size signs the best free agents regardless of window. */
export function aiFillSquad(world: WorldState, club: Club, target = 21): void {
  const squad = squadOf(world, club.id);
  const keepers = squad.filter((p) => p.primary === 'GK').length;
  if (squad.length >= target && keepers >= 2) return;
  const rules = leagueSquadRules(world, club);
  const have = (pos: Position): number => squad.filter((p) => p.primary === pos).length;
  const wanted: Position[] = [];
  if (have('GK') < 2) wanted.push('GK');
  const order: Position[] = ['CB', 'CM', 'LB', 'RB', 'ST', 'DM', 'AM', 'LW', 'RW'];
  const needSigns = Math.max(0, target - squad.length, wanted.length);
  for (let i = 0; wanted.length < needSigns; i++) {
    const pos = order[i % order.length] as Position;
    if (have(pos) + wanted.filter((w) => w === pos).length < 3 || i > 20) wanted.push(pos);
    if (i > 40) break;
  }
  const pool = freeAgents(world);
  for (const pos of wanted) {
    if (squadOf(world, club.id).length >= target && pos !== 'GK') break;
    const cands = pool
      .filter((p) => p.clubId === null && !p.retired && (p.primary === pos || (POSITION_GROUP[p.primary] === POSITION_GROUP[pos] && (p.positions[pos] ?? 0) >= 0.8)))
      .filter((p) => rules.maxForeign === null || p.nationality === club.country || squadOf(world, club.id).filter((q) => q.nationality !== club.country).length < rules.maxForeign)
      .sort((a, b) => overall(b) - overall(a));
    let signed = false;
    for (const c of cands.slice(0, 4)) {
      const wage = Math.round(Math.max(800, wageDemand(world, club, c) * 0.85) / 100) * 100;
      if (signFreeAgent(world, club, c, { wageWeekly: wage, years: 1.5, role: 'backup' }) === null) { signed = true; break; }
    }
    // Nobody suitable is unattached: the academy provides emergency cover (a goalkeeper is mandatory).
    if (!signed && (pos === 'GK' || squadOf(world, club.id).length < 16)) {
      const rng = Rng.fromSeed(`${world.config.seed}:cover:${club.id}:${world.day}:${pos}`);
      const base = clamp(club.reputation * 0.4 + 15 + rng.normal(0, 4), 25, 60);
      createYouthPlayer(world, club, rng, pos, base, rng.float(18, 21), base + 8);
    }
  }
}

/** Surplus young players are loaned to weaker clubs in the same country (window only). */
export function aiLoanMarket(world: WorldState): number {
  const rng = Rng.fromSeed(`${world.config.seed}:loanmkt:${world.day}`);
  let made = 0;
  for (const parent of Object.values(world.clubs)) {
    if (parent.id === world.config.humanClubId || !isWindowOpen(world, parent)) continue;
    if (!rng.chance(0.06)) continue;
    const squad = squadOf(world, parent.id);
    if (squad.length < 21) continue;
    const ranked = [...squad].sort((a, b) => overall(b) - overall(a));
    const fringe = ranked.slice(17).filter((p) => !p.loan && ageOf(p, world.day) <= 23 && p.pot - overall(p) >= 5 && p.primary !== 'GK');
    const cand = fringe[0];
    if (!cand) continue;
    if (tryLoanOut(world, parent, cand)) made++;
  }
  return made;
}
