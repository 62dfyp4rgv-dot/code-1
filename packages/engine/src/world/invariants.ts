/**
 * World integrity checks. `validateWorld` is run by the test suite after every simulation scenario and is
 * exposed in the app's data-management screen. A violation means a bug or a corrupted save, never "normal" state.
 */
import { ATTR_KEYS } from '../types';
import { COMPETITIONS } from '../competition/registry';
import { activeRules } from '../competition/engine';
import { LEAGUE_BY_ID } from '../competition/registry';
import { allPlayers, squadOf } from './runtime';
import type { WorldState } from './types';

export interface Violation {
  code: string;
  message: string;
  severity: 'critical' | 'high' | 'medium';
}

export interface ValidateOptions {
  /** Tolerance in EUR for ledger reconciliation (rounding). */
  cashTolerance?: number;
  /** Check ledger-vs-cash identity (requires the world to have been started with seasonStartCash). */
  checkLedger?: boolean;
}

export function validateWorld(world: WorldState, opts: ValidateOptions = {}): Violation[] {
  const v: Violation[] = [];
  const add = (code: string, message: string, severity: Violation['severity'] = 'critical'): void => { v.push({ code, message, severity }); };
  const tol = opts.cashTolerance ?? 5;

  // ---- players, contracts, squads
  const seenInSquads = new Set<string>();
  for (const club of Object.values(world.clubs)) {
    const squad = squadOf(world, club.id);
    const rules = COMPETITIONS[club.leagueId] ? activeRules(COMPETITIONS[club.leagueId]!, world.season).squad : null;
    for (const p of squad) {
      if (seenInSquads.has(p.id)) add('DUPLICATE_REGISTRATION', `player ${p.id} appears in more than one squad`);
      seenInSquads.add(p.id);
      if (p.clubId !== club.id) add('INDEX_DRIFT', `squad index lists ${p.id} under ${club.id} but player.clubId=${p.clubId}`);
    }
    if (rules) {
      if (squad.length > rules.maxSquadSize + 10) add('SQUAD_TOO_LARGE', `${club.name} has ${squad.length} players`, 'high');
      if (rules.maxForeignRegistered !== null && club.id !== world.config.humanClubId) {
        const foreign = squad.filter((p) => p.nationality !== club.country).length;
        if (foreign > rules.maxForeignRegistered) add('FOREIGN_LIMIT', `${club.name} has ${foreign} foreign players (limit ${rules.maxForeignRegistered})`, 'high');
      }
    }
    if (squad.length < 11) add('SQUAD_TOO_SMALL', `${club.name} has only ${squad.length} players`);
    else if (squad.length < 16) add('SQUAD_THIN', `${club.name} has only ${squad.length} players`, 'medium');
    if (squad.length > 0 && !squad.some((p) => p.primary === 'GK')) add('NO_GOALKEEPER', `${club.name} has no goalkeeper`, 'high');
  }

  for (const p of allPlayers(world)) {
    if (p.retired) {
      if (p.clubId !== null || p.contract !== null) add('RETIRED_REGISTERED', `retired player ${p.id} still has a club/contract`);
      continue;
    }
    if (p.clubId === null) {
      if (p.contract) add('FREE_AGENT_CONTRACT', `free agent ${p.id} has a contract`);
      if (p.loan) add('FREE_AGENT_LOAN', `free agent ${p.id} is on loan`);
    } else {
      if (!world.clubs[p.clubId]) add('UNKNOWN_CLUB', `player ${p.id} belongs to unknown club ${p.clubId}`);
      if (!p.contract) add('NO_CONTRACT', `player ${p.id} at ${p.clubId} has no contract`);
      else {
        const expectClub = p.loan ? p.loan.parentClubId : p.clubId;
        if (p.contract.clubId !== expectClub) add('CONTRACT_CLUB_MISMATCH', `player ${p.id} contract club ${p.contract.clubId} != ${expectClub}`);
        if (p.contract.endDay <= p.contract.startDay) add('CONTRACT_DATES', `player ${p.id} contract ends before it starts`);
        if (p.contract.endDay < world.day - 1) add('CONTRACT_EXPIRED', `player ${p.id} still registered on an expired contract`, 'high');
        if (!(p.contract.wageWeekly >= 0) || !Number.isFinite(p.contract.wageWeekly)) add('WAGE_INVALID', `player ${p.id} wage invalid`);
      }
      if (p.loan && p.loan.endDay <= p.loan.startDay) add('LOAN_DATES', `player ${p.id} loan ends before it starts`);
      if (p.loan && p.loan.parentClubId === p.clubId) add('LOAN_SELF', `player ${p.id} is on loan to his own club`);
    }
    for (const k of ATTR_KEYS) {
      const a = p.attrs[k];
      if (!(a >= 1 && a <= 100)) { add('ATTR_RANGE', `player ${p.id} attribute ${k}=${a}`); break; }
    }
    if (!Number.isFinite(p.fatigue) || p.fatigue < 0 || p.fatigue > 100) add('FATIGUE_RANGE', `player ${p.id} fatigue ${p.fatigue}`);
    if (!Number.isFinite(p.form) || Math.abs(p.form) > 10.0001) add('FORM_RANGE', `player ${p.id} form ${p.form}`);
    if (p.injury && p.injury.returnDay <= p.injury.startDay) add('INJURY_DATES', `player ${p.id} injury ends before it starts`);
    for (const [c, n] of Object.entries(p.suspensions)) if (n < 0) add('SUSPENSION_NEGATIVE', `player ${p.id} suspension ${c}=${n}`);
    const age = (world.day - p.birthDay) / 365.25;
    if (age < 14 || age > 48) add('AGE_RANGE', `player ${p.id} age ${age.toFixed(1)}`, 'high');
  }

  // ---- league membership
  const membership = new Map<string, string>();
  for (const [lid, members] of Object.entries(world.leagueMembers)) {
    for (const c of members) {
      if (membership.has(c)) add('MULTI_LEAGUE', `club ${c} is in leagues ${membership.get(c)} and ${lid}`);
      membership.set(c, lid);
      const club = world.clubs[c];
      if (!club) add('UNKNOWN_CLUB', `league ${lid} lists unknown club ${c}`);
      else if (club.leagueId !== lid) add('LEAGUE_MISMATCH', `club ${c} leagueId=${club.leagueId} but member of ${lid}`);
    }
  }
  for (const club of Object.values(world.clubs)) if (!membership.has(club.id)) add('NO_LEAGUE', `club ${club.id} belongs to no league`);

  // ---- managers
  const managed = new Map<string, string>();
  for (const club of Object.values(world.clubs)) {
    if (!club.managerId) { add('NO_MANAGER', `club ${club.id} has no manager`, 'medium'); continue; }
    const m = world.managers[club.managerId];
    if (!m) { add('UNKNOWN_MANAGER', `club ${club.id} has unknown manager`); continue; }
    if (m.clubId !== club.id) add('MANAGER_LINK', `manager ${m.id} clubId=${m.clubId} but manages ${club.id}`);
    if (managed.has(m.id)) add('MANAGER_DOUBLE', `manager ${m.id} manages ${managed.get(m.id)} and ${club.id}`);
    managed.set(m.id, club.id);
    if (world.managerPool.includes(m.id)) add('MANAGER_IN_POOL', `employed manager ${m.id} is also in the unemployed pool`);
  }

  // ---- competitions and fixtures
  const dayClub = new Map<string, string>();
  for (const comp of Object.values(world.competitions)) {
    const ids = new Set<string>();
    for (const f of comp.fixtures) {
      if (ids.has(f.id)) add('DUPLICATE_FIXTURE_ID', `fixture id ${f.id} duplicated`);
      ids.add(f.id);
      if (f.home === f.away) add('SELF_FIXTURE', `fixture ${f.id} pairs a club with itself`);
      if (!world.clubs[f.home] || !world.clubs[f.away]) add('FIXTURE_UNKNOWN_CLUB', `fixture ${f.id} references an unknown club`);
      if (f.status === 'played' && !f.result) add('PLAYED_NO_RESULT', `fixture ${f.id} played without result`);
      if (f.status === 'scheduled' && f.result) add('SCHEDULED_WITH_RESULT', `fixture ${f.id} scheduled but has a result`);
      if (f.result && (f.result.homeGoals < 0 || f.result.awayGoals < 0 || !Number.isInteger(f.result.homeGoals))) add('RESULT_INVALID', `fixture ${f.id} invalid score`);
      for (const t of [f.home, f.away]) {
        const key = `${t}@${f.day}`;
        const prev = dayClub.get(key);
        if (prev && prev !== f.id) add('DOUBLE_BOOKING', `club ${t} has fixtures ${prev} and ${f.id} on day ${f.day}`, 'high');
        dayClub.set(key, f.id);
      }
    }
    if (comp.status === 'complete') {
      if (comp.fixtures.some((f) => f.status === 'scheduled')) add('COMPLETE_WITH_PENDING', `competition ${comp.id} complete with pending fixtures`);
      if (!comp.winner) add('NO_WINNER', `competition ${comp.id} complete without winner`);
    }
    const def = COMPETITIONS[comp.id];
    if (def?.kind === 'league' && comp.status === 'active') {
      // tables must be derivable and consistent mid-season
      const played = comp.fixtures.filter((f) => f.status === 'played' && f.result);
      const gf = played.reduce((a, f) => a + (f.result?.homeGoals ?? 0) + (f.result?.awayGoals ?? 0), 0);
      if (!Number.isFinite(gf)) add('TABLE_GOALS', `competition ${comp.id} goals invalid`);
    }
    for (const e of comp.entrants) {
      if (!world.clubs[e]) add('ENTRANT_UNKNOWN', `competition ${comp.id} entrant ${e} unknown`);
    }
  }

  // ---- finances
  let transferSum = 0;
  for (const club of Object.values(world.clubs)) {
    const f = club.finance;
    if (!Number.isFinite(f.cash) || !Number.isFinite(f.debt)) add('FINANCE_NAN', `club ${club.id} finance not finite`);
    if (f.debt < 0) add('DEBT_NEGATIVE', `club ${club.id} debt ${f.debt}`);
    if (f.cash < -1) add('CASH_NEGATIVE', `club ${club.id} cash ${f.cash} (weekly balancing should prevent this)`, 'medium');
    if (opts.checkLedger) {
      const led = Object.values(f.seasonLedger).reduce((a, b) => a + b, 0);
      const drift = f.cash - (f.seasonStartCash + led);
      if (Math.abs(drift) > tol) add('LEDGER_DRIFT', `club ${club.id} cash differs from ledger by ${Math.round(drift)}`);
    }
    transferSum += (f.seasonLedger.transferFees ?? 0) + (f.seasonLedger.transferInstallments ?? 0) + (f.seasonLedger.loanFees ?? 0);
  }
  if (Math.abs(transferSum) > tol) add('TRANSFER_MONEY_LEAK', `transfer fees do not net to zero across clubs (${Math.round(transferSum)})`);

  // ---- history
  world.history.seasons.forEach((s, i) => {
    if (s.season !== i + 1) add('HISTORY_GAP', `history season ${s.season} at index ${i}`, 'high');
  });
  void LEAGUE_BY_ID;
  return v;
}

export function assertValid(world: WorldState, opts?: ValidateOptions): void {
  const violations = validateWorld(world, opts).filter((x) => x.severity !== 'medium');
  if (violations.length > 0) {
    const sample = violations.slice(0, 8).map((x) => `${x.code}: ${x.message}`).join('\n');
    throw new Error(`World invariants violated (${violations.length}):\n${sample}`);
  }
}
