/**
 * AI managers: tactical choices from style + squad, results-driven dismissals, appointments from the
 * unemployed pool, contract handling. The human club's manager is never auto-dismissed.
 */
import { clamp } from '../math';
import { bestFormation, pickLineup, suggestRoles } from '../lineup';
import { Rng } from '../rng';
import { archetypeTactics, STYLE_TO_ARCHETYPE } from '../tactics';
import type { Club, Manager } from '../types';
import { squadOf } from './runtime';
import type { SeasonSummary, WorldState } from './types';
import { overall } from '../players';
import { nextId } from './generate';

const STYLE_FORMATIONS: Record<string, string[]> = {
  possession: ['4-3-3', '4-2-3-1', '4-1-4-1'],
  highPress: ['4-3-3', '4-2-3-1', '3-4-3'],
  counterAttack: ['4-4-2', '4-2-3-1', '5-3-2'],
  pragmatic: ['5-3-2', '4-4-2', '4-1-4-1', '3-5-2'],
  balanced: ['4-2-3-1', '4-3-3', '4-4-2', '3-5-2'],
};

/** Re-derive an AI club's tactics from its manager's style and the squad it actually has. */
export function refreshAiTactics(world: WorldState, club: Club): void {
  if (club.id === world.config.humanClubId) return;
  const mgr = club.managerId ? world.managers[club.managerId] : undefined;
  const style = mgr?.style ?? club.philosophy;
  const arch = STYLE_TO_ARCHETYPE[style];
  const base = archetypeTactics(arch);
  const squad = squadOf(world, club.id);
  const candidates = STYLE_FORMATIONS[arch] ?? STYLE_FORMATIONS.balanced!;
  const a = { day: world.day, competitionId: club.leagueId };
  const formation = bestFormation(squad, a, candidates, candidates[0]);
  const lineup = pickLineup(squad, { ...base, formation }, a, 0.2);
  // Managers with weaker tactical knowledge apply the approach less precisely.
  const jitter = mgr ? (100 - mgr.tacticalKnowledge) / 100 : 0.4;
  const rng = Rng.fromSeed(`${world.config.seed}:tac:${club.id}:${Math.floor(world.day / 28)}`);
  const noisy = (v: number): number => Math.round(clamp(v + rng.normal(0, 10 * jitter), 0, 100));
  club.tactics = {
    ...base,
    formation,
    roles: lineup ? suggestRoles(lineup.starters, formation) : base.roles,
    tempo: noisy(base.tempo), width: noisy(base.width), directness: noisy(base.directness), pressing: noisy(base.pressing),
    defensiveLine: noisy(base.defensiveLine),
  };
}

function squadStrength(world: WorldState, id: string): number {
  const sq = [...squadOf(world, id)].map(overall).sort((x, y) => y - x).slice(0, 14);
  return sq.length ? sq.reduce((a, b) => a + b, 0) / sq.length : 0;
}

/** Expected points per game from the club's strength rank in its league. `ranked` may be passed in to avoid recomputation. */
export function expectedPointsPerGame(world: WorldState, club: Club, ranked?: number[]): number {
  const members = world.leagueMembers[club.leagueId] ?? [];
  if (members.length < 2) return 1.4;
  const mine = squadStrength(world, club.id);
  const table = ranked ?? members.map((id) => squadStrength(world, id)).sort((a, b) => b - a);
  const rank = table.findIndex((s) => s <= mine);
  const pct = (rank < 0 ? table.length - 1 : rank) / Math.max(1, table.length - 1);
  return 2.25 - 1.35 * pct;
}

function candidateFit(club: Club, m: Manager): number {
  const repGap = Math.abs(m.reputation - club.reputation);
  const styleBonus = m.style === club.philosophy ? 8 : 0;
  return 100 - repGap * 1.1 + styleBonus + m.tacticalKnowledge * 0.2;
}

export function appointManager(world: WorldState, club: Club, rng: Rng): Manager | null {
  const pool = world.managerPool.map((id) => world.managers[id]).filter((m): m is Manager => !!m);
  if (pool.length === 0) return null;
  const ranked = [...pool].sort((a, b) => candidateFit(club, b) - candidateFit(club, a));
  const pick = ranked[Math.min(ranked.length - 1, rng.int(3))] as Manager;
  world.managerPool = world.managerPool.filter((id) => id !== pick.id);
  pick.clubId = club.id;
  pick.contractEndDay = world.day + 365 * rng.between(1, 3);
  pick.tenure = { startDay: world.day, played: 0, points: 0 };
  club.managerId = pick.id;
  club.cohesion = clamp(club.cohesion - 0.1, 0.1, 1);
  return pick;
}

export function dismissManager(world: WorldState, club: Club, reason: string): Manager | null {
  const mgr = club.managerId ? world.managers[club.managerId] : undefined;
  if (!mgr) return null;
  mgr.clubId = null;
  mgr.contractEndDay = null;
  mgr.reputation = clamp(mgr.reputation - 2, 5, 99);
  club.managerId = null;
  world.managerPool.push(mgr.id);
  world.news.push({
    id: nextId(world, 'news'), day: world.day, kind: 'manager', clubIds: [club.id], playerIds: [],
    text: `${club.name} part company with manager ${mgr.name} (${reason}).`, ref: mgr.id,
  });
  return mgr;
}

/** Weekly review: sacking decisions for AI clubs. */
export function weeklyManagerReview(world: WorldState): void {
  const rng = Rng.fromSeed(`${world.config.seed}:mgr:${world.day}`);
  const rankedByLeague = new Map<string, number[]>();
  for (const [lid, members] of Object.entries(world.leagueMembers)) {
    rankedByLeague.set(lid, members.map((id) => squadStrength(world, id)).sort((a, b) => b - a));
  }
  for (const club of Object.values(world.clubs)) {
    if (club.id === world.config.humanClubId) continue;
    const mgr = club.managerId ? world.managers[club.managerId] : undefined;
    if (!mgr) {
      const hired = appointManager(world, club, rng.derive(club.id));
      if (hired) refreshAiTactics(world, club);
      continue;
    }
    if (mgr.tenure.played < 8) continue;
    const ppg = mgr.tenure.points / mgr.tenure.played;
    const expected = expectedPointsPerGame(world, club, rankedByLeague.get(club.leagueId));
    const pressure = (expected - ppg) / expected;
    const distress = club.finance.debt > 0 && club.finance.cash < 0 ? 0.05 : 0;
    const tol = (mgr.patience / 100) * 0.3 + (club.boardPatience / 100) * 0.25;
    const p = clamp((pressure + distress - tol) * 0.35, 0, 0.35);
    if (p > 0 && rng.chance(p)) {
      const old = dismissManager(world, club, `${ppg.toFixed(2)} points per game vs ${expected.toFixed(2)} expected`);
      const hired = appointManager(world, club, rng.derive(`${club.id}:hire`));
      if (hired && old) {
        world.news.push({
          id: nextId(world, 'news'), day: world.day, kind: 'manager', clubIds: [club.id], playerIds: [],
          text: `${club.name} appoint ${hired.name} as manager, replacing ${old.name}.`, ref: hired.id,
        });
        refreshAiTactics(world, club);
      }
    }
  }
}

/** Season end: contracts, retirements, board evaluation. */
export function seasonEndManagerReview(world: WorldState, summary: SeasonSummary, rng: Rng): void {
  for (const m of Object.values(world.managers)) {
    const age = (world.day - m.birthDay) / 365.25;
    if (age > 70 && m.clubId === null) {
      world.managerPool = world.managerPool.filter((id) => id !== m.id);
    }
  }
  for (const table of Object.values(summary.tables)) {
    const n = table.length;
    table.forEach((cid, i) => {
      const club = world.clubs[cid] as Club;
      if (club.id === world.config.humanClubId) return;
      const mgr = club.managerId ? world.managers[club.managerId] : undefined;
      if (!mgr) return;
      const pct = n > 1 ? i / (n - 1) : 0;
      const delta = (club.boardExpectation - pct) * 6;
      mgr.reputation = clamp(Math.round(mgr.reputation + delta * 0.4), 5, 99);
      const tooLate = mgr.contractEndDay !== null && mgr.contractEndDay <= world.day + 30;
      const bad = pct > club.boardExpectation + 0.35;
      if (bad && rng.chance(0.35 * (1 - mgr.patience / 150))) {
        dismissManager(world, club, 'end-of-season review');
        summary.managerChanges.push({ day: world.day, clubId: cid, out: mgr.id, in: '' });
        const hired = appointManager(world, club, rng.derive(`${cid}:newseason`));
        if (hired) {
          const last = summary.managerChanges[summary.managerChanges.length - 1];
          if (last) last.in = hired.id;
        }
      } else if (tooLate) {
        mgr.contractEndDay = world.day + 365 * rng.between(1, 3);
      }
    });
  }
}
