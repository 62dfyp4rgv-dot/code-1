/**
 * World clock. `advanceDay` is the only way simulation time moves; every subsystem hangs off it so that
 * competitions, finances, transfers, development and AI stay in lock-step and deterministic for a given seed.
 */
import { clamp } from '../math';
import { fatigueRecoveryPerDay } from '../lineup';
import { Rng } from '../rng';
import { COMPETITIONS } from '../competition/registry';
import type { CompetitionDef, CompetitionState, Fixture } from '../competition/types';
import type { Club, Player } from '../types';
import { allPlayers } from './runtime';
import { isLastDayOfSeason, seasonStartDay, startSeason } from './calendar';
import { weeklyDevelopment } from './development';
import { weeklyFinance } from './finance';
import { defaultWorldConfig, generateWorld } from './generate';
import { engineContext, injuryDays, playFixture } from './matchday';
import { refreshAiTactics, weeklyManagerReview } from './managers';
import { rolloverSeason } from './rollover';
import { aiContractRenewals, aiFillSquad, aiLoanMarket, isWindowOpen, processLoans, runTransferDay, weeklyFreeAgentCull } from './transfers';
import type { WorldConfig, WorldState } from './types';

export interface PlayedMatch {
  fixtureId: string;
  competitionId: string;
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
  humanInvolved: boolean;
}

export interface DayReport {
  day: number;
  season: number;
  matches: PlayedMatch[];
  seasonEnded: boolean;
}

export function createWorld(config: WorldConfig = defaultWorldConfig('universe-1', 'compact')): WorldState {
  const world = generateWorld(config);
  for (const club of Object.values(world.clubs)) refreshAiTactics(world, club);
  startSeason(world);
  return world;
}

const TRAINING_INJURY_PER_DAY = 0.0005;

function dailyConditioning(world: WorldState): void {
  const rng = Rng.fromSeed(`${world.config.seed}:cond:${world.day}`);
  const players = allPlayers(world);
  const phase = world.day % 3;
  for (let i = 0; i < players.length; i++) {
    const p = players[i] as Player;
    if (p.retired) continue;
    if (p.injury && world.day >= p.injury.returnDay) {
      if (p.injury.severity >= 3) {
        // long injuries leave a small physical legacy
        p.attrs.pace = Math.max(1, p.attrs.pace - 0.6 * p.injury.severity / 3);
        p.attrs.acceleration = Math.max(1, p.attrs.acceleration - 0.5 * p.injury.severity / 3);
      }
      p.injury = null;
    }
    if (p.clubId === null) {
      if (p.fatigue > 0) p.fatigue = Math.max(0, p.fatigue - 8);
      continue;
    }
    const club = world.clubs[p.clubId];
    if (p.fatigue > 0) p.fatigue = Math.max(0, p.fatigue - fatigueRecoveryPerDay(p, club?.facilities.medical ?? 40));
    if (p.workload > 0.01) p.workload *= 0.96;
    // training injuries: sampled on a rotating third of the squad with tripled hazard (same expectation)
    if (club && !p.injury && i % 3 === phase) {
      const hazard = 3 * TRAINING_INJURY_PER_DAY * p.injuryProneness * (1 + p.workload / 12) * (1 + p.fatigue / 120);
      if (rng.next() < hazard) {
        const sev = rng.chance(0.8) ? 1 : 2;
        p.injury = {
          kind: sev === 1 ? 'Training knock' : 'Training muscle strain', startDay: world.day,
          returnDay: world.day + injuryDays(rng, sev, club.facilities.medical, p), severity: sev,
        };
      }
    }
  }
}

function weeklyTasks(world: WorldState): void {
  const rel = world.day - seasonStartDay(world.season);
  weeklyFinance(world);
  weeklyDevelopment(world);
  weeklyManagerReview(world);
  processLoans(world);
  weeklyFreeAgentCull(world);
  for (const club of Object.values(world.clubs)) if (club.id !== world.config.humanClubId) aiFillSquad(world, club, rel < 7 * 7 ? 21 : 19);
  if (rel >= 28 * 7 / 2) aiContractRenewals(world);
  if (Math.floor(rel / 7) % 4 === 0) {
    for (const club of Object.values(world.clubs)) refreshAiTactics(world, club);
  }
  // expire stale transfer-list entries
  for (const [pid, e] of Object.entries(world.transferList)) {
    const p = world.players[pid];
    if (!p || p.retired || p.clubId === null || world.day - e.day > 120) delete world.transferList[pid];
  }
}

interface Pending { comp: CompetitionState; def: CompetitionDef; fixture: Fixture }

function collectToday(world: WorldState): Pending[] {
  const out: Pending[] = [];
  for (const comp of Object.values(world.competitions)) {
    if (comp.status !== 'active') continue;
    const def = COMPETITIONS[comp.id] as CompetitionDef;
    for (const f of comp.fixtures) {
      if (f.status !== 'scheduled') continue;
      if (f.day === world.day || f.day < world.day) {
        if (f.day < world.day) f.day = world.day; // overdue: never silently skip a fixture
        out.push({ comp, def, fixture: f });
      }
    }
  }
  out.sort((a, b) => a.def.priority - b.def.priority || (a.fixture.id < b.fixture.id ? -1 : 1));
  return out;
}

function playDay(world: WorldState): PlayedMatch[] {
  const todays = collectToday(world);
  if (todays.length === 0) return [];
  const ctx = engineContext(world);
  const busy = new Set<string>();
  const played: PlayedMatch[] = [];
  for (const { comp, def, fixture } of todays) {
    if (fixture.status !== 'scheduled') continue;
    if (busy.has(fixture.home) || busy.has(fixture.away)) {
      fixture.day = world.day + 1; // clash with a higher-priority match today: play tomorrow
      continue;
    }
    busy.add(fixture.home);
    busy.add(fixture.away);
    const res = playFixture(world, comp, def, fixture, ctx);
    const human = world.config.humanClubId;
    played.push({
      fixtureId: fixture.id, competitionId: comp.id, home: fixture.home, away: fixture.away,
      homeGoals: res.score.home, awayGoals: res.score.away, humanInvolved: human !== null && (fixture.home === human || fixture.away === human),
    });
  }
  return played;
}

export function advanceDay(world: WorldState): DayReport {
  const rel = world.day - seasonStartDay(world.season);
  if (rel % 7 === 0) weeklyTasks(world);
  const day = world.day;
  const season = world.season;
  const matches = playDay(world);
  dailyConditioning(world);
  if (Object.values(world.clubs).some((c) => isWindowOpen(world, c))) {
    runTransferDay(world);
    if (rel % 3 === 0) aiLoanMarket(world);
  }
  let seasonEnded = false;
  if (isLastDayOfSeason(world)) {
    rolloverSeason(world);
    seasonEnded = true;
  } else {
    world.day += 1;
  }
  return { day, season, matches, seasonEnded };
}

export function advanceDays(world: WorldState, n: number, onDay?: (r: DayReport) => void): DayReport[] {
  const out: DayReport[] = [];
  for (let i = 0; i < n; i++) {
    const r = advanceDay(world);
    out.push(r);
    onDay?.(r);
  }
  return out;
}

/** Advance until the next day on which the human club (or, with none, anyone) has a fixture, or until `maxDays`. */
export function advanceToNextMatchday(world: WorldState, maxDays = 30): DayReport[] {
  const out: DayReport[] = [];
  const human = world.config.humanClubId;
  for (let i = 0; i < maxDays; i++) {
    const r = advanceDay(world);
    out.push(r);
    if (human ? r.matches.some((m) => m.humanInvolved) : r.matches.length > 0) break;
  }
  return out;
}

export function advanceToEndOfSeason(world: WorldState, onDay?: (r: DayReport) => void): DayReport[] {
  const season = world.season;
  const out: DayReport[] = [];
  while (world.season === season) {
    const r = advanceDay(world);
    out.push(r);
    onDay?.(r);
  }
  return out;
}

export function humanClub(world: WorldState): Club | null {
  return world.config.humanClubId ? (world.clubs[world.config.humanClubId] ?? null) : null;
}

export { clamp };
