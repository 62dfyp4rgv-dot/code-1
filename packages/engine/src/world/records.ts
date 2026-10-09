/** Records, streaks and milestones. Everything here is derived from played results; narratives cite their source. */
import { overall } from '../players';
import { nextId } from './generate';
import type { ClubRecord, WorldState } from './types';
import type { Club, Player } from '../types';

export function clubRecord(world: WorldState, clubId: string): ClubRecord {
  return (world.history.clubs[clubId] ??= { trophies: {}, bestFinish: {}, seasons: [], longestUnbeaten: 0 });
}

function note(world: WorldState, kind: 'record' | 'milestone', clubIds: string[], playerIds: string[], text: string, ref: string): void {
  world.news.push({ id: nextId(world, 'news'), day: world.day, kind, clubIds, playerIds, text, ref });
}

/** Update a club's league streaks after a league match. `result` is from the club's point of view. */
export function updateStreaks(world: WorldState, club: Club, result: 'W' | 'D' | 'L', fixtureId: string): void {
  const rec = clubRecord(world, club.id);
  const s = (rec.streaks ??= { unbeaten: 0, wins: 0, winless: 0, longestWins: 0 });
  if (result === 'L') { s.unbeaten = 0; s.wins = 0; s.winless++; }
  else if (result === 'D') { s.unbeaten++; s.wins = 0; s.winless++; }
  else { s.unbeaten++; s.wins++; s.winless = 0; }
  rec.longestUnbeaten = Math.max(rec.longestUnbeaten, s.unbeaten);
  s.longestWins = Math.max(s.longestWins, s.wins);
  if (result !== 'L' && s.unbeaten >= 10 && s.unbeaten % 5 === 0) note(world, 'record', [club.id], [], `${club.name} are unbeaten in ${s.unbeaten} league matches.`, fixtureId);
  if (result === 'W' && s.wins >= 6) note(world, 'record', [club.id], [], `${club.name} have won ${s.wins} league matches in a row.`, fixtureId);
}

/** Announce career-goal milestones (50, 100, 150, 200, ...) crossed by the goals just scored. */
export function checkGoalMilestone(world: WorldState, p: Player, goalsJustScored: number, fixtureId: string): void {
  if (goalsJustScored <= 0) return;
  const total = p.history.reduce((a, l) => a + l.goals, 0);
  const before = total - goalsJustScored;
  for (const m of [50, 100, 150, 200, 250, 300]) {
    if (before < m && total >= m) {
      const club = p.clubId ? world.clubs[p.clubId] : undefined;
      note(world, 'milestone', club ? [club.id] : [], [p.id], `${p.name} scores his ${m}th career goal.`, fixtureId);
    }
  }
}

/** Record every active player's ability at the start of a season. */
export function markSeasonStartAbility(players: readonly Player[]): void {
  for (const p of players) if (!p.retired) p.ovMark = Math.round(overall(p) * 10) / 10;
}

/** Biggest risers (young) and fallers (veterans) over the season among regular players. */
export function breakoutsAndDecliners(world: WorldState, players: readonly Player[], season: number): {
  breakouts: { playerId: string; clubId: string; from: number; to: number }[];
  decliners: { playerId: string; clubId: string; from: number; to: number }[];
} {
  const rows = players
    .filter((p) => !p.retired && p.clubId && p.ovMark !== undefined && p.history.some((l) => l.season === season && l.apps >= 10))
    .map((p) => ({ p, from: p.ovMark as number, to: overall(p), age: (world.day - p.birthDay) / 365.25 }));
  const mk = (r: (typeof rows)[number]) => ({ playerId: r.p.id, clubId: r.p.clubId as string, from: Math.round(r.from), to: Math.round(r.to) });
  const breakouts = rows.filter((r) => r.age <= 23).sort((a, b) => b.to - b.from - (a.to - a.from)).slice(0, 5).filter((r) => r.to - r.from >= 3).map(mk);
  const decliners = rows.filter((r) => r.age >= 31).sort((a, b) => a.to - a.from - (b.to - b.from)).slice(0, 5).filter((r) => r.from - r.to >= 2).map(mk);
  return { breakouts, decliners };
}
