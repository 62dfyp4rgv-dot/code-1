/** End-of-season processing: reviews, reputations, contracts, ageing, retirement, youth, new-season set-up. */
import { clamp } from '../math';
import { overall } from '../players';
import { Rng } from '../rng';
import { COMPETITIONS, LEAGUE_BY_ID } from '../competition/registry';
import type { Club, Player } from '../types';
import { endSeason, seasonStartDay, startSeason } from './calendar';
import { clubRecord } from './records';
import { annualRetirements, revisePotentials, youthIntake } from './development';
import { applyRegulation, reviewClubFinance, updateRevenueDeals } from './finance';
import { assignPlayer, endLoan, loanedOutOf, squadOf } from './runtime';
import { activeRules } from '../competition/engine';
import { pay, releasePlayer } from './squad';
import { ageOf } from '../players';
import { seasonEndManagerReview } from './managers';
import { aiFillSquad, trimSquad } from './transfers';
import type { SeasonSummary, WorldState } from './types';
import { marketValue } from './valuation';

export function updateReputations(world: WorldState, summary: SeasonSummary): void {
  for (const [lid, table] of Object.entries(summary.tables)) {
    const n = table.length;
    table.forEach((cid, i) => {
      const club = world.clubs[cid] as Club;
      const actual = n > 1 ? i / (n - 1) : 0;
      const delta = (club.boardExpectation - actual) * 7;
      const hist = club.historicalPrestige;
      const rec = clubRecord(world, cid);
      const lastWon = rec.trophies[lid]?.includes(summary.season) ? 3 : 0;
      club.reputation = clamp(Math.round(club.reputation + delta * 0.35 + lastWon + (hist - club.reputation) * 0.04), 8, 99);
      club.historicalPrestige = clamp(Math.round(hist + (club.reputation - hist) * 0.04), 5, 99);
    });
  }
  for (const [compId, h] of Object.entries(summary.champions)) {
    const def = COMPETITIONS[compId];
    if (!def || !h.winner) continue;
    const w = world.clubs[h.winner] as Club;
    if (def.kind === 'cup') w.reputation = clamp(w.reputation + 1, 8, 99);
    else if (def.kind === 'continental') w.continentalReputation = clamp(w.continentalReputation + (['UCL', 'ACLE', 'CAFCL', 'COPA', 'CCC', 'OCL'].includes(compId) ? 4 : 2), 5, 99);
    else if (def.kind === 'intercontinental') w.continentalReputation = clamp(w.continentalReputation + 3, 5, 99);
  }
  // continental participation shifts continental reputation by how far clubs went
  for (const comp of Object.values(world.competitions)) {
    const def = COMPETITIONS[comp.id];
    if (!def || def.kind !== 'continental' || comp.finalRanking.length === 0) continue;
    const n = comp.finalRanking.length;
    comp.finalRanking.forEach((cid, i) => {
      const club = world.clubs[cid];
      if (!club) return;
      club.continentalReputation = clamp(Math.round(club.continentalReputation + (0.5 - i / n) * 2.2), 5, 99);
    });
  }
  // gentle convergence of continental reputation to domestic reputation x league strength
  for (const club of Object.values(world.clubs)) {
    const q = LEAGUE_BY_ID[club.leagueId]?.quality ?? 55;
    const anchor = club.reputation * Math.pow(q / 70, 1.1);
    club.continentalReputation = clamp(Math.round(club.continentalReputation + (anchor - club.continentalReputation) * 0.08), 5, 99);
  }
  // board expectation follows relative standing inside each league
  for (const members of Object.values(world.leagueMembers)) {
    const ranked = [...members].sort((a, b) => (world.clubs[b] as Club).reputation - (world.clubs[a] as Club).reputation);
    ranked.forEach((cid, i) => {
      (world.clubs[cid] as Club).boardExpectation = clamp(ranked.length > 1 ? i / (ranked.length - 1) - 0.04 : 0.1, 0.02, 0.95);
    });
  }
}

function expireContracts(world: WorldState): number {
  let n = 0;
  const nextSeasonStart = seasonStartDay(world.season + 1);
  for (const p of Object.values(world.players)) {
    if (p.retired || !p.contract || p.clubId === null) continue;
    if (p.contract.endDay > nextSeasonStart) continue;
    if (p.loan) {
      // loans end with the season: player returns to the parent club (contract may also have expired)
      const parent = world.clubs[p.loan.parentClubId];
      endLoan(world, p);
      if (parent && p.contract.endDay > nextSeasonStart) {
        assignPlayer(world, p, parent.id);
        continue;
      }
    }
    releasePlayer(world, p, 0, 'free');
    n++;
  }
  return n;
}

/**
 * Surplus cash does not sit idle: members/private clubs reinvest in facilities, investor-backed clubs pay
 * a dividend. Keeps long-run cash distributions bounded and ties finances to long-term competitiveness.
 */
export function investSurplus(world: WorldState, club: Club): void {
  const f = club.finance;
  const revenue = f.broadcastingAnnual + f.sponsorshipAnnual;
  const surplus = f.cash - revenue * 0.35;
  if (surplus <= 0 || f.debt > 0) return;
  const invest = surplus * 0.35;
  const points = Math.min(3, Math.floor(invest / Math.max(1, revenue * 0.02)));
  if (points > 0) {
    const keys = ['training', 'youth', 'medical', 'scouting', 'coaching'] as const;
    const order = [...keys].sort((a, b) => club.facilities[a] - club.facilities[b]);
    for (let i = 0; i < points; i++) club.facilities[order[i % order.length] as (typeof keys)[number]] = Math.min(99, club.facilities[order[i % order.length] as (typeof keys)[number]] + 1);
    pay(club, 'facilities', Math.round(points * revenue * 0.02));
  }
  if (club.ownership.kind !== 'members') {
    const div = Math.round((surplus - invest) * 0.6);
    if (div > 0) pay(club, 'dividends', div);
  }
}

/**
 * End of scholarship: academy prospects aged 18+ either earn a senior contract (if good enough for the squad or
 * clearly promising) or are released. Keeps the age structure stable and the free-agent pool bounded.
 */
export function academyReview(world: WorldState, club: Club, rng: Rng): void {
  const squad = squadOf(world, club.id);
  const seniors = squad.filter((p) => p.contract?.squadRole !== 'prospect').map(overall).sort((a, b) => b - a);
  const bar = seniors[Math.min(seniors.length - 1, 20)] ?? 40;
  for (const p of [...squad]) {
    if (p.contract?.squadRole !== 'prospect') continue;
    const age = ageOf(p, world.day);
    if (age < 18.4) continue;
    const ov = overall(p);
    const promising = p.pot >= bar + 6 || ov >= bar - 3;
    if (promising || rng.chance(0.08)) {
      p.contract = { ...p.contract, squadRole: 'backup', wageWeekly: Math.max(p.contract.wageWeekly, 1200) };
    } else {
      releasePlayer(world, p, 0, 'free');
    }
  }
  // youth squads are finite: keep the eight most promising prospects
  const left = squadOf(world, club.id).filter((p) => p.contract?.squadRole === 'prospect').sort((a, b) => b.pot - a.pot);
  for (const p of left.slice(8)) releasePlayer(world, p, 0, 'free');
}

/**
 * Annual wage review: clubs with unused wage budget give raises to their best players (agents and rival offers push
 * wages towards what clubs can afford), so wage bills track revenue instead of drifting far below it.
 */
export function annualWageReview(world: WorldState, club: Club): void {
  const squad = squadOf(world, club.id);
  const bill = squad.reduce((a, p) => a + (p.contract && !p.loan ? p.contract.wageWeekly : 0), 0);
  let room = club.finance.wageBudgetWeekly * 0.97 - bill;
  if (room <= 0) return;
  const ranked = squad.filter((p) => p.contract && !p.loan).sort((a, b) => overall(b) - overall(a)).slice(0, 18);
  const weight = ranked.reduce((a, p) => a + (p.contract?.wageWeekly ?? 0), 0) || 1;
  const pool = room * 0.7;
  for (const p of ranked) {
    const c = p.contract;
    if (!c) continue;
    const raise = Math.min(c.wageWeekly * 0.3, pool * (c.wageWeekly / weight));
    if (raise < 100) continue;
    c.wageWeekly = Math.round((c.wageWeekly + raise) / 100) * 100;
    room -= raise;
  }
}

/**
 * A club that changes league (promotion/relegation) must comply with the new league's foreign-player registration
 * limit: AI clubs release their weakest surplus foreigners. Human clubs are warned instead.
 */
export function enforceForeignLimit(world: WorldState, club: Club): void {
  const def = COMPETITIONS[club.leagueId];
  const cap = def ? activeRules(def, world.season + 1).squad.maxForeignRegistered : null;
  if (cap === null || cap === undefined) return;
  const foreign = () => squadOf(world, club.id).filter((p) => p.nationality !== club.country && !p.loan);
  while (foreign().length + loanedOutOf(world, club.id).filter((p) => p.nationality !== club.country).length > cap) {
    const worst = [...foreign()].sort((a, b) => overall(a) - overall(b))[0];
    if (!worst) break;
    if (club.id === world.config.humanClubId) {
      world.news.push({ id: `fl-${club.id}-${world.day}`, day: world.day, kind: 'finance', clubIds: [club.id], playerIds: [], text: `${club.name} exceed the foreign-player limit (${cap}) of their new league and must reduce their squad.`, ref: club.id });
      break;
    }
    releasePlayer(world, worst, 0.5);
  }
}

export function rolloverSeason(world: WorldState): SeasonSummary {
  const summary = endSeason(world);
  const rng = Rng.fromSeed(`${world.config.seed}:rollover:${world.season}`);

  // finance review per club
  for (const club of Object.values(world.clubs)) {
    const review = reviewClubFinance(world, club);
    applyRegulation(world, club, review);
    const rec = clubRecord(world, club.id);
    const last = rec.seasons[rec.seasons.length - 1];
    if (last && last.season === world.season) (last as { profit?: number }).profit = Math.round(review.profit);
  }
  for (const club of Object.values(world.clubs)) investSurplus(world, club);
  updateReputations(world, summary);
  seasonEndManagerReview(world, summary, rng.derive('mgr'));

  // loans back to parents before contract expiry processing
  for (const p of Object.values(world.players)) {
    if (p.loan && !p.retired) {
      const parent = world.clubs[p.loan.parentClubId];
      if (parent) {
        world.transfers.push({ id: `lr-${p.id}-${world.season}`, day: world.day, playerId: p.id, fromClubId: p.clubId, toClubId: parent.id, kind: 'loanReturn', fee: 0, wageWeekly: p.contract?.wageWeekly ?? 0 });
        endLoan(world, p);
        assignPlayer(world, p, parent.id);
      }
    }
  }

  revisePotentials(world, rng.derive('pot'));
  annualRetirements(world, rng.derive('ret'));
  expireContracts(world);
  for (const club of Object.values(world.clubs)) enforceForeignLimit(world, club);
  for (const club of Object.values(world.clubs)) annualWageReview(world, club);
  for (const club of Object.values(world.clubs)) {
    academyReview(world, club, rng.derive(`academy:${club.id}`));
    youthIntake(world, club, rng.derive(`youth:${club.id}`));
  }
  for (const club of Object.values(world.clubs)) if (club.id !== world.config.humanClubId) aiFillSquad(world, club, 21);
  // revenue deals for the coming season based on final positions
  for (const table of Object.values(summary.tables)) {
    table.forEach((cid, i) => updateRevenueDeals(world, world.clubs[cid] as Club, i + 1, table.length));
  }
  world.season += 1;
  world.day = seasonStartDay(world.season);
  for (const club of Object.values(world.clubs)) {
    trimSquad(world, club);
    world.ai[club.id] = { needs: {}, lastReviewDay: -999, cooldown: {}, dealsThisWindow: 0 };
    club.cohesion = clamp(club.cohesion * 0.85, 0.1, 1);
  }
  startSeason(world);
  return summary;
}

export function squadValue(world: WorldState, clubId: string): number {
  return squadOf(world, clubId).reduce((a: number, p: Player) => a + marketValue(p, world.day), 0);
}
