/**
 * Matchday pipeline: fixture -> lineups -> simulated match -> consequences (stats, fatigue, injuries, discipline,
 * form/morale, revenue, manager record, archive, news). The competition engine only ever sees the final score.
 */
import { clamp } from '../math';
import { isAvailable, pickLineup, selectionScore, type Availability } from '../lineup';
import { overall, positionalOverall } from '../players';
import { simulateMatch, type MatchInput, type MatchResult, type MatchConditions, type TeamSheet } from '../match';
import { Rng } from '../rng';
import { toMatchPlayer } from '../synth';
import { COMPETITIONS, LEAGUE_BY_ID } from '../competition/registry';
import { activeRules, matchRulesFor, recordResult, type EngineContext } from '../competition/engine';
import type { CompetitionDef, CompetitionState, Fixture, FixtureResult } from '../competition/types';
import { defaultRoleFor, formationOf, ROLES, validateTactics } from '../tactics';
import type { Club, InjuryState, Player, Position } from '../types';
import { assignPlayer, freeAgents, squadOf } from './runtime';
import { createYouthPlayer, pay, receive, signFreeAgent } from './squad';
import type { NewsItem, StatLine, StoredMatch, WorldState } from './types';
import { nextId } from './generate';
import { checkGoalMilestone, updateStreaks } from './records';
import { baseWageWeekly, marketValue } from './valuation';

export function clubCoefficient(world: WorldState, clubId: string): number {
  const c = world.clubs[clubId] as Club;
  return c.continentalReputation + c.reputation * 0.3;
}

export function engineContext(world: WorldState): EngineContext {
  return {
    seed: `${world.config.seed}:s${world.season}`,
    info: (id) => {
      const c = world.clubs[id] as Club;
      return { id, country: c.country, coefficient: clubCoefficient(world, id), zone: LEAGUE_BY_ID[c.leagueId]?.zone };
    },
  };
}

const INJURY_KINDS: Record<1 | 2 | 3 | 4, string[]> = {
  1: ['Knock', 'Minor muscle strain', 'Ankle sprain', 'Bruised thigh', 'Illness'],
  2: ['Hamstring strain', 'Calf injury', 'Groin strain', 'Ankle ligament damage'],
  3: ['Knee ligament sprain', 'Fractured metatarsal', 'Torn hamstring', 'Shoulder dislocation'],
  4: ['Anterior cruciate ligament rupture', 'Complex fracture', 'Achilles tendon rupture'],
};

export function injuryDays(rng: Rng, severity: 1 | 2 | 3 | 4, medical: number, p: Player): number {
  const [lo, hi] = severity === 1 ? [2, 12] : severity === 2 ? [14, 40] : severity === 3 ? [45, 110] : [130, 300];
  const factor = clamp(1.2 - medical / 250, 0.75, 1.2) * clamp(1.1 - p.attrs.recovery / 500, 0.9, 1.1);
  return Math.max(1, Math.round(rng.between(lo, hi) * factor));
}

export function isDerby(world: WorldState, a: string, b: string): boolean {
  const ca = world.clubs[a];
  const cb = world.clubs[b];
  return !!ca && !!cb && (ca.rivals.includes(b) || cb.rivals.includes(a));
}

export function attendanceFraction(world: WorldState, f: Fixture, comp: CompetitionDef, rng: Rng): number {
  const home = world.clubs[f.home] as Club;
  const away = world.clubs[f.away] as Club;
  if (f.neutral) return 0.92;
  const prestige = comp.kind === 'continental' ? 0.1 : 0;
  const base = 0.38 + 0.34 * (home.supporters / 100) + 0.12 * (away.reputation / 100) + prestige + (isDerby(world, f.home, f.away) ? 0.06 : 0);
  return clamp(base + rng.normal(0, 0.03), 0.22, 1);
}

/** Make sure `club` can field 11 available players including a goalkeeper; signs free agents or promotes youth. */
export function ensureFieldable(world: WorldState, club: Club, a: Availability, rng: Rng): void {
  const squad = squadOf(world, club.id);
  const avail = squad.filter((p) => isAvailable(p, a));
  const gks = avail.filter((p) => p.primary === 'GK').length;
  const need = Math.max(0, 14 - avail.length);
  const needGk = gks === 0;
  if (need === 0 && !needGk) return;
  const wanted: Position[] = [];
  if (needGk) wanted.push('GK');
  const filler: Position[] = ['CB', 'CM', 'LB', 'RB', 'ST', 'DM', 'AM', 'LW', 'RW'];
  while (wanted.length < Math.max(need, needGk ? 1 : 0)) wanted.push(filler[wanted.length % filler.length] as Position);
  const pool = freeAgents(world);
  for (const pos of wanted) {
    const cand = pool.filter((p) => p.primary === pos && p.clubId === null && !p.retired).sort((x, y) => overall(y) - overall(x))[0];
    if (cand && !signFreeAgent(world, club, cand, { wageWeekly: Math.max(900, Math.round(baseWageWeekly(marketValue(cand, world.day), overall(cand)) * 0.8)), years: 1, role: 'backup' })) continue;
    const q = clamp(overall(squad.length ? squad[rng.int(squad.length)] as Player : (cand as Player)) - 12, 25, 70);
    createYouthPlayer(world, club, rng, pos, q, rng.float(17, 20), q + 8);
  }
}

/** Repair invalid tactics (e.g. a role that does not fit a slot after a formation change) instead of failing the match. */
function sanitizeTactics(club: Club): void {
  if (validateTactics(club.tactics).length === 0) return;
  const fm = formationOf(validateFormation(club.tactics.formation));
  club.tactics.formation = fm.id;
  club.tactics.roles = fm.slots.map((pos, i) => {
    const r = club.tactics.roles[i];
    return r && ROLES[r]?.positions.includes(pos) ? r : defaultRoleFor(pos);
  });
}

function validateFormation(id: string): string {
  try { formationOf(id); return id; } catch { return '4-3-3'; }
}

/** The human's chosen XI, if every selected player is still available; otherwise null (automatic selection takes over). */
function overrideLineup(world: WorldState, club: Club, a: Availability): ReturnType<typeof pickLineup> {
  const ids = club.lineupOverride;
  if (!ids || ids.length !== 11) return null;
  const squad = squadOf(world, club.id);
  const starters: Player[] = [];
  for (const id of ids) {
    const p = squad.find((q) => q.id === id);
    if (!p || !isAvailable(p, a)) return null;
    starters.push(p);
  }
  if (new Set(ids).size !== 11 || starters[0]?.primary !== 'GK') return null;
  const chosen = new Set(ids);
  const rest = squad.filter((p) => !chosen.has(p.id) && isAvailable(p, a)).sort((x, y) => overall(y) - overall(x));
  const gk = rest.find((p) => p.primary === 'GK');
  const bench = [...(gk ? [gk] : []), ...rest.filter((p) => p !== gk).slice(0, gk ? 8 : 9)];
  return { starters, bench, rating: 0 };
}

export function buildSheet(world: WorldState, club: Club, f: Fixture, rotation: number, rng: Rng): TeamSheet {
  const a: Availability = { day: f.day, competitionId: f.competitionId };
  ensureFieldable(world, club, a, rng);
  sanitizeTactics(club);
  const squad = squadOf(world, club.id);
  let lineup = overrideLineup(world, club, a) ?? pickLineup(squad, club.tactics, a, rotation);
  if (!lineup) {
    // Last resort: ignore injuries/suspensions so a match can always be played, preferring the least unavailable.
    const all = [...squad].sort((x, y) => selectionScore(y, y.primary, 0) - selectionScore(x, x.primary, 0));
    const forced = all.filter((p) => p.primary !== 'GK').slice(0, 10);
    const gk = all.find((p) => p.primary === 'GK') ?? all[0];
    const fm = formationOf(club.tactics.formation);
    const starters: Player[] = [gk as Player];
    const rest = forced.slice();
    for (let i = 1; i < fm.slots.length; i++) starters.push(rest.shift() as Player);
    lineup = { starters, bench: rest.slice(0, 7), rating: 40 };
  }
  const mgr = club.managerId ? world.managers[club.managerId] : undefined;
  return {
    clubId: club.id, name: club.name, tactics: club.tactics, cohesion: club.cohesion, acumen: mgr?.tacticalKnowledge ?? 50,
    players: [...lineup.starters, ...lineup.bench].map((p) => toMatchPlayer(p, f.day)),
  };
}

function weatherFor(world: WorldState, f: Fixture, rng: Rng): MatchConditions['weather'] {
  const home = world.clubs[f.home] as Club;
  const week = Math.floor((f.day % 364) / 7);
  const hot = ['SAU', 'UAE', 'QAT', 'EGY', 'MAR', 'TUN', 'ALG', 'BRA', 'MEX'].includes(home.country) && (week < 8 || week > 38);
  if (hot && rng.chance(0.6)) return 'heat';
  if (['ENG', 'SCO', 'NED', 'BEL', 'GER'].includes(home.country) && rng.chance(0.22)) return 'rain';
  if (week > 14 && week < 26 && ['GER', 'SCO', 'NED', 'USA'].includes(home.country) && rng.chance(0.3)) return 'cold';
  return 'clear';
}

const STRICTNESS: Record<string, number> = { ESP: 1.18, ITA: 1.1, POR: 1.12, TUR: 1.2, ENG: 0.88, GER: 0.95, NED: 0.95, FRA: 1.0, BRA: 1.15, SAU: 1.05 };

export function buildMatchInput(world: WorldState, comp: CompetitionState, def: CompetitionDef, f: Fixture): MatchInput {
  const rng = Rng.fromSeed(`${world.config.seed}:mi:${f.id}`);
  const home = world.clubs[f.home] as Club;
  const away = world.clubs[f.away] as Club;
  const rules = matchRulesFor(comp, def, f);
  const knockout = f.tieId !== null || def.kind === 'cup' || def.kind === 'superCup';
  const derby = isDerby(world, f.home, f.away);
  const importance = clamp((knockout ? 0.7 : 0.4) + (derby ? 0.2 : 0) + (def.kind === 'continental' ? 0.15 : 0), 0, 1);
  const rotationFor = (c: Club): number => (def.kind === 'cup' && c.reputation > 70 && f.round <= 2 ? 0.7 : def.kind === 'continental' && c.reputation > 75 ? 0.4 : 0.25);
  const conditions: MatchConditions = {
    neutral: f.neutral, attendanceFrac: attendanceFraction(world, f, def, rng), weather: weatherFor(world, f, rng),
    refereeStrictness: STRICTNESS[home.country] ?? 1, importance,
  };
  return {
    id: f.id, seed: `${world.config.seed}:${f.id}`,
    home: buildSheet(world, home, f, rotationFor(home), rng.derive('h')),
    away: buildSheet(world, away, f, rotationFor(away), rng.derive('a')),
    conditions,
    rules: { mustHaveWinner: rules.mustHaveWinner, extraTime: rules.extraTime, aggregateOffset: rules.aggregateOffset, maxSubsRegular: 5 },
  };
}

// ---------------------------------------------------------------- applying results

function statLine(world: WorldState, compId: string, p: Player): StatLine {
  // own-property checks: ids are validated on load, but id-keyed plain objects must never resolve inherited members
  if (!Object.hasOwn(world.seasonStats, compId)) world.seasonStats[compId] = {};
  const m = world.seasonStats[compId] as Record<string, StatLine>;
  if (!Object.hasOwn(m, p.id)) m[p.id] = { clubId: p.clubId ?? '', apps: 0, minutes: 0, goals: 0, assists: 0, yellow: 0, red: 0, ratingSum: 0, cleanSheets: 0 };
  return m[p.id] as StatLine;
}

function seasonLine(p: Player, season: number, clubId: string): Player['history'][number] {
  let l = p.history[p.history.length - 1];
  if (!l || l.season !== season || l.clubId !== clubId) {
    l = { season, clubId, apps: 0, starts: 0, minutes: 0, goals: 0, assists: 0, yellow: 0, red: 0, cleanSheets: 0, ratingSum: 0, xg: 0 };
    p.history.push(l);
  }
  return l;
}

function pushNews(world: WorldState, n: Omit<NewsItem, 'id'>): void {
  world.news.push({ id: nextId(world, 'news'), ...n });
  if (world.news.length > 3000) world.news.splice(0, world.news.length - 2500);
}

export function applyMatchResult(world: WorldState, comp: CompetitionState, def: CompetitionDef, f: Fixture, input: MatchInput, res: MatchResult, ctx: EngineContext): void {
  const rng = Rng.fromSeed(`${world.config.seed}:ar:${f.id}`);
  const home = world.clubs[f.home] as Club;
  const away = world.clubs[f.away] as Club;
  const yellows = { home: res.stats.home.yellow, away: res.stats.away.yellow };
  const reds = { home: res.stats.home.red, away: res.stats.away.red };
  const result: FixtureResult = {
    homeGoals: res.score.home, awayGoals: res.score.away, extraTime: res.extraTimePlayed, pens: res.penalties, matchId: f.id,
    homeYellow: yellows.home, awayYellow: yellows.away, homeRed: reds.home, awayRed: reds.away,
  };

  // --- bans served: players suspended before this match serve one match now
  const served = new Set<string>();
  for (const club of [home, away]) {
    for (const p of squadOf(world, club.id)) {
      if ((p.suspensions[f.competitionId] ?? 0) > 0) served.add(p.id);
    }
  }
  for (const id of served) {
    const p = world.players[id] as Player;
    p.suspensions[f.competitionId] = Math.max(0, (p.suspensions[f.competitionId] ?? 0) - 1);
  }

  // --- player-level consequences
  const stageRules = activeRules(def, comp.season);
  const goalDiff = (side: 'home' | 'away'): number => (side === 'home' ? res.score.home - res.score.away : res.score.away - res.score.home);
  for (const line of res.players) {
    const p = world.players[line.playerId];
    if (!p) continue;
    const club = line.side === 'home' ? home : away;
    if (line.minutes > 0) {
      p.fatigue = line.fatigueEnd;
      p.workload += line.minutes * 0.01 * (1 + input.conditions.importance * 0.3);
      const hl = seasonLine(p, comp.season, club.id);
      hl.apps++;
      if (line.started) hl.starts++;
      hl.minutes += line.minutes;
      hl.goals += line.goals;
      if (line.goals > 0) checkGoalMilestone(world, p, line.goals, f.id);
      hl.assists += line.assists;
      hl.yellow += line.yellow;
      hl.red += line.red;
      hl.ratingSum += line.rating;
      hl.xg += line.xg;
      const sl = statLine(world, f.competitionId, p);
      sl.clubId = club.id;
      sl.apps++;
      sl.minutes += line.minutes;
      sl.goals += line.goals;
      sl.assists += line.assists;
      sl.yellow += line.yellow;
      sl.red += line.red;
      sl.ratingSum += line.rating;
      const conceded = line.side === 'home' ? res.score.away : res.score.home;
      if (conceded === 0 && (line.position === 'GK' || ['CB', 'LB', 'RB'].includes(line.position)) && line.minutes >= 60) { hl.cleanSheets++; sl.cleanSheets++; }
      if (line.minutes >= 20) {
        p.form = clamp(p.form * 0.85 + (line.rating - 6.3) * 0.9, -10, 10);
        p.confidence = clamp(p.confidence + (line.rating - 6.3) * 1.2 + line.goals * 2, 10, 100);
      }
      const gd = goalDiff(line.side);
      p.morale = clamp(p.morale + (gd > 0 ? 1.5 : gd < 0 ? -1.5 : 0), 10, 100);
    }
    // discipline
    if (line.yellow > 0 || line.red > 0) {
      const yl = (p.yellows[f.competitionId] ?? 0) + (line.yellow > 0 && line.red === 0 ? line.yellow : 0);
      p.yellows[f.competitionId] = yl;
      const limit = stageRules.discipline.yellowsForBan;
      if (line.red > 0) {
        // second-yellow dismissal = 1 match, straight red = 2 matches
        const secondYellow = line.yellow > 0;
        p.suspensions[f.competitionId] = (p.suspensions[f.competitionId] ?? 0) + (secondYellow ? 1 : 2);
      } else if (yl >= limit && limit > 0) {
        p.suspensions[f.competitionId] = (p.suspensions[f.competitionId] ?? 0) + 1;
        p.yellows[f.competitionId] = 0;
      }
    }
  }
  // injuries from the match
  for (const inj of res.injuries) {
    const p = world.players[inj.playerId];
    if (!p || p.injury) continue;
    const club = world.clubs[p.clubId ?? ''] as Club | undefined;
    const days = injuryDays(rng, inj.severity, club?.facilities.medical ?? 40, p);
    const state: InjuryState = { kind: rng.pick(INJURY_KINDS[inj.severity]), startDay: f.day, returnDay: f.day + days, severity: inj.severity };
    p.injury = state;
    if (inj.severity >= 3 || overall(p) >= 75) {
      pushNews(world, { day: f.day, kind: 'injury', clubIds: club ? [club.id] : [], playerIds: [p.id], text: `${p.name} (${club?.name ?? 'free agent'}) is out for ${days} days with a ${state.kind.toLowerCase()}.`, ref: f.id });
    }
  }

  // --- club consequences
  const pointsFor = (side: 'home' | 'away'): number => {
    const gd = goalDiff(side);
    return gd > 0 ? 3 : gd === 0 ? 1 : 0;
  };
  for (const [club, side] of [[home, 'home'], [away, 'away']] as const) {
    const mgr = club.managerId ? world.managers[club.managerId] : undefined;
    if (mgr && def.kind !== 'superCup') {
      mgr.tenure.played++;
      mgr.tenure.points += pointsFor(side);
    }
    // cohesion grows with games together
    club.cohesion = clamp(club.cohesion + 0.0025, 0.1, 1);
    // prize money
    const prize = stageRules.prize;
    if (prize.perMatch > 0) receive(club, 'prizeMoney', prize.perMatch);
    if (prize.perWin > 0 && goalDiff(side) > 0) receive(club, 'prizeMoney', prize.perWin);
  }
  if (def.kind === 'league') {
    const rs = (g: number, o: number): 'W' | 'D' | 'L' => (g > o ? 'W' : g === o ? 'D' : 'L');
    updateStreaks(world, home, rs(res.score.home, res.score.away), f.id);
    updateStreaks(world, away, rs(res.score.away, res.score.home), f.id);
  }
  // matchday revenue for non-neutral fixtures
  if (!f.neutral) {
    const att = input.conditions.attendanceFrac;
    const rev = Math.round(att * home.stadium.capacity * home.finance.ticketPrice * (def.kind === 'continental' ? 1.5 : def.kind === 'cup' ? 0.9 : 1));
    receive(home, 'matchday', rev);
  }

  // --- archive
  const keepFull = f.home === world.config.humanClubId || f.away === world.config.humanClubId || def.kind === 'continental' || f.neutral;
  const goals = res.events.filter((e) => e.type === 'goal').map((e) => [e.minute, e.side, (e as { scorerId: string }).scorerId, (e as { kind: string }).kind] as [number, 'home' | 'away', string, string]);
  const stored: StoredMatch = {
    id: f.id, fixtureId: f.id, competitionId: f.competitionId, season: comp.season, day: f.day, homeClubId: f.home, awayClubId: f.away,
    score: res.score, penalties: res.penalties, extraTime: res.extraTimePlayed, stats: res.stats, goals, motm: res.motm,
    events: keepFull ? res.events : null, players: keepFull ? res.players : null,
    // deep copy: MatchInput references live player/tactics objects that keep changing after the match
    replay: keepFull ? (JSON.parse(JSON.stringify(input)) as MatchInput) : null,
  };
  world.matches[f.id] = stored;
  world.matchOrder.push(f.id);
  const limit = world.config.archiveRecent;
  while (world.matchOrder.length > limit * 6) {
    const old = world.matchOrder.shift() as string;
    const m = world.matches[old];
    if (m && m.events && old !== undefined) {
      const humanInvolved = m.homeClubId === world.config.humanClubId || m.awayClubId === world.config.humanClubId;
      if (!humanInvolved) delete world.matches[old];
      else { m.events = null; m.players = null; m.replay = null; }
    }
    if (m && !m.events) delete world.matches[old];
  }
  // lighten matches older than `archiveRecent` that are not human-club matches
  const idx = world.matchOrder.length - limit;
  if (idx > 0) {
    const mid = world.matchOrder[idx - 1];
    const m = mid ? world.matches[mid] : undefined;
    if (m && m.events && m.homeClubId !== world.config.humanClubId && m.awayClubId !== world.config.humanClubId && def.kind !== 'continental') {
      m.events = null; m.players = null; m.replay = null;
    }
  }

  // --- narrative from facts
  narrate(world, comp, def, f, res);

  recordResult(comp, def, f.id, result, ctx);
}

function narrate(world: WorldState, comp: CompetitionState, def: CompetitionDef, f: Fixture, res: MatchResult): void {
  const home = world.clubs[f.home] as Club;
  const away = world.clubs[f.away] as Club;
  const hs = res.score.home;
  const as = res.score.away;
  const scorerCount: Record<string, number> = {};
  for (const e of res.events) if (e.type === 'goal') scorerCount[e.scorerId] = (scorerCount[e.scorerId] ?? 0) + 1;
  for (const [pid, n] of Object.entries(scorerCount)) {
    if (n >= 3) {
      const p = world.players[pid] as Player;
      pushNews(world, { day: f.day, kind: 'milestone', clubIds: [f.home, f.away], playerIds: [pid], text: `${p.name} scores a hat-trick in ${home.name} ${hs}-${as} ${away.name} (${def.shortName}).`, ref: f.id });
    }
  }
  const winnerSide = hs > as ? 'home' : as > hs ? 'away' : null;
  if (winnerSide && Math.abs(hs - as) >= 1) {
    const w = winnerSide === 'home' ? home : away;
    const l = winnerSide === 'home' ? away : home;
    if (l.reputation - w.reputation >= 28 && def.kind !== 'superCup') {
      pushNews(world, { day: f.day, kind: 'upset', clubIds: [w.id, l.id], playerIds: [], text: `Upset: ${w.name} beat ${l.name} ${Math.max(hs, as)}-${Math.min(hs, as)} in the ${def.name}.`, ref: f.id });
    }
  }
  if (Math.abs(hs - as) >= 5) {
    pushNews(world, { day: f.day, kind: 'record', clubIds: [f.home, f.away], playerIds: [], text: `${hs > as ? home.name : away.name} thrash ${hs > as ? away.name : home.name} ${Math.max(hs, as)}-${Math.min(hs, as)} (${def.shortName}).`, ref: f.id });
  }
}

// ---------------------------------------------------------------- driver

export function playFixture(world: WorldState, comp: CompetitionState, def: CompetitionDef, f: Fixture, ctx: EngineContext): MatchResult {
  const input = buildMatchInput(world, comp, def, f);
  const res = simulateMatch(input);
  applyMatchResult(world, comp, def, f, input, res, ctx);
  return res;
}

export { COMPETITIONS, positionalOverall, assignPlayer, pay };
