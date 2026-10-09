/**
 * Club finances: weekly cash flow, installments, owner support, borrowing, distress and regulation.
 * All amounts are EUR. Every cash movement goes through `pay`/`receive` so the season ledger always
 * reconciles with the cash balance (checked by the invariant suite).
 */
import { clamp } from '../math';
import { COMPETITIONS, LEAGUE_BY_ID } from '../competition/registry';
import { activeRules } from '../competition/engine';
import type { Club } from '../types';
import { allPlayers } from './runtime';
import { pay, receive } from './squad';
import type { WorldState } from './types';

export const DEBT_INTEREST_ANNUAL = 0.055;

export function weeklyWageBills(world: WorldState): Map<string, number> {
  const bills = new Map<string, number>();
  for (const p of allPlayers(world)) {
    if (p.retired || !p.contract || p.clubId === null) continue;
    const w = p.contract.wageWeekly;
    if (p.loan) {
      bills.set(p.clubId, (bills.get(p.clubId) ?? 0) + w * (1 - p.loan.parentWageShare));
      bills.set(p.loan.parentClubId, (bills.get(p.loan.parentClubId) ?? 0) + w * p.loan.parentWageShare);
    } else {
      bills.set(p.clubId, (bills.get(p.clubId) ?? 0) + w);
    }
  }
  return bills;
}

export function weeklyFinance(world: WorldState): void {
  const bills = weeklyWageBills(world);
  for (const club of Object.values(world.clubs)) {
    const f = club.finance;
    receive(club, 'broadcasting', Math.round(f.broadcastingAnnual / 52));
    receive(club, 'sponsorship', Math.round(f.sponsorshipAnnual / 52));
    pay(club, 'wages', Math.round(bills.get(club.id) ?? 0));
    pay(club, 'operating', Math.round(f.opexAnnual / 52));
    if (f.debt > 0) pay(club, 'interest', Math.round((f.debt * DEBT_INTEREST_ANNUAL) / 52));
    settleInstallments(world, club);
    balanceCash(world, club);
  }
}

function settleInstallments(world: WorldState, club: Club): void {
  const f = club.finance;
  if (f.installments.length === 0) return;
  const rest: typeof f.installments = [];
  for (const inst of f.installments) {
    if (inst.dueDay > world.day) { rest.push(inst); continue; }
    if (inst.amount < 0) {
      pay(club, 'transferInstallments', -inst.amount);
      if (inst.counterpartyId) {
        const other = world.clubs[inst.counterpartyId];
        if (other) receive(other, 'transferInstallments', -inst.amount);
      }
    }
    // positive entries are mirror records on the seller side already settled through the buyer's payment
  }
  f.installments = rest;
}

function annualRevenue(club: Club): number {
  return club.finance.broadcastingAnnual + club.finance.sponsorshipAnnual + club.stadium.capacity * club.finance.ticketPrice * 12;
}

/** Keep cash non-negative via owner support or borrowing, and trigger distress rules when borrowing is exhausted. */
export function balanceCash(world: WorldState, club: Club): void {
  const f = club.finance;
  const rev = annualRevenue(club);
  if (f.cash < 0) {
    const wealth = club.ownership.wealth / 100;
    const supportRate = club.ownership.kind === 'members' ? 0.01 : club.ownership.kind === 'private' ? 0.025 : 0.06;
    const cap = wealth * rev * supportRate;
    const need = -f.cash + rev * 0.01;
    const inject = Math.min(need, cap);
    if (inject > 0) {
      receive(club, 'ownerInjection', Math.round(inject));
    }
    if (f.cash < 0) {
      const borrow = -f.cash;
      f.debt += Math.round(borrow);
      receive(club, 'borrowing', Math.round(borrow));
    }
    if (f.debt > rev * 2.2 && world.day >= f.embargoUntilDay) {
      f.embargoUntilDay = world.day + 90;
      f.wageBudgetWeekly = Math.round(f.wageBudgetWeekly * 0.92);
      world.news.push({
        id: `fin-${club.id}-${world.day}`, day: world.day, kind: 'finance', clubIds: [club.id], playerIds: [],
        text: `${club.name} face a financial crisis with debts of €${Math.round(f.debt / 1e6)}m and have been placed under a transfer embargo.`, ref: club.id,
      });
    }
  } else if (f.debt > 0 && f.cash > rev * 0.15) {
    const repay = Math.min(f.debt, Math.round((f.cash - rev * 0.1) * 0.1));
    if (repay > 0) {
      f.debt -= repay;
      pay(club, 'debtRepayment', repay);
    }
  }
}

export interface FinanceReview {
  clubId: string;
  revenue: number;
  wages: number;
  ratio: number;
  limit: number | null;
  overLimit: boolean;
  profit: number;
}

const REVENUE_CATEGORIES = ['broadcasting', 'sponsorship', 'matchday', 'prizeMoney'];

/** Season-end review of squad-cost ratio against league financial regulation (where configured). */
export function reviewClubFinance(world: WorldState, club: Club): FinanceReview {
  const led = club.finance.seasonLedger;
  const revenue = REVENUE_CATEGORIES.reduce((a, k) => a + Math.max(0, led[k] ?? 0), 0);
  // Squad cost = wages + signing bonuses + straight-line amortisation proxy (30% of installments paid this season).
  const wages = -(led.wages ?? 0) - (led.signingBonuses ?? 0) - (led.transferInstallments ?? 0) * 0.3;
  const def = COMPETITIONS[club.leagueId];
  const limit = def ? activeRules(def, world.season).squadCostRatioLimit : null;
  const ratio = revenue > 0 ? wages / revenue : 9;
  const overLimit = limit !== null && ratio > limit;
  const profit = Object.entries(led).reduce((a, [k, v]) => a + (k === 'ownerInjection' || k === 'borrowing' || k === 'debtRepayment' ? 0 : v), 0);
  return { clubId: club.id, revenue, wages, ratio, limit, overLimit, profit };
}

export function applyRegulation(world: WorldState, club: Club, review: FinanceReview): void {
  const f = club.finance;
  if (review.overLimit) {
    f.overspendStrikes++;
    f.embargoUntilDay = Math.max(f.embargoUntilDay, world.day + (f.overspendStrikes >= 2 ? 180 : 60));
    world.news.push({
      id: `reg-${club.id}-${world.day}`, day: world.day, kind: 'finance', clubIds: [club.id], playerIds: [],
      text: `${club.name} breached the squad-cost rule (${Math.round(review.ratio * 100)}% vs ${Math.round((review.limit ?? 0) * 100)}% limit) and face a registration embargo.`, ref: club.id,
    });
  } else {
    f.overspendStrikes = Math.max(0, f.overspendStrikes - 1);
  }
}

/** Reset revenue deals for the new season from league position and reputation. */
export function updateRevenueDeals(world: WorldState, club: Club, position: number, leagueSize: number): void {
  const prof = LEAGUE_BY_ID[club.leagueId];
  if (!prof) return;
  const n = leagueSize;
  const weights = Array.from({ length: n }, (_, i) => 1.9 - (1.8 * i) / Math.max(1, n - 1));
  const wsum = weights.reduce((a, b) => a + b, 0);
  const scale = n / (world.config.preset === 'compact' ? Math.max(1, prof.clubs) : prof.clubs);
  const target = prof.tvPool * (world.config.preset === 'compact' ? scale : 1) * (0.55 / n + 0.45 * ((weights[Math.min(position, n) - 1] ?? 1) / wsum));
  const f = club.finance;
  f.broadcastingAnnual = Math.round(f.broadcastingAnnual * 0.5 + target * 0.5);
  // sponsorship tracks reputation changes gently
  const repFactor = clamp(club.reputation / Math.max(20, club.historicalPrestige), 0.85, 1.2);
  f.sponsorshipAnnual = Math.round(f.sponsorshipAnnual * clamp(0.97 + 0.06 * repFactor, 0.94, 1.1));
  f.ticketPrice = Math.max(3, Math.round(prof.ticket * (0.65 + club.reputation / 160)));
}
