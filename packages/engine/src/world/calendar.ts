/**
 * Season lifecycle: build every competition instance for a season (entrants from league membership, cups,
 * qualification), close the season (awards, history, prize money, promotion/relegation).
 */
import { Rng } from '../rng';
import { COMPETITIONS, LEAGUE_BY_ID, PYRAMIDS } from '../competition/registry';
import { activeRules, createCompetition, fixturesOnDay, isHeldIn } from '../competition/engine';
import { allocateEntrants, buildQualSpecs, type QualSpec } from '../competition/qualification';
import type { CompetitionDef, CompetitionState } from '../competition/types';
import type { Club } from '../types';
import { engineContext, playFixture } from './matchday';
import { nextId } from './generate';
import { breakoutsAndDecliners, clubRecord, markSeasonStartAbility } from './records';
import { allPlayers, squadOf } from './runtime';
import { receive } from './squad';
import type { LeagueSeasonStats, SeasonSummary, WorldState } from './types';

export const DAYS_PER_SEASON = 364;

export { clubRecord };

export function seasonStartDay(season: number): number {
  return (season - 1) * DAYS_PER_SEASON;
}

/** Contract end aligned to the last day of the season in which `years` have elapsed (contracts run to season end). */
export function alignedContractEnd(currentDay: number, season: number, years: number): number {
  const seasonsAhead = Math.max(1, Math.round(years));
  const end = seasonStartDay(season) + seasonsAhead * DAYS_PER_SEASON - 1;
  // signed in the last weeks of a season: the first partial season does not count
  return currentDay > seasonStartDay(season) + DAYS_PER_SEASON - 45 ? end + DAYS_PER_SEASON : end;
}

export function isLastDayOfSeason(world: WorldState): boolean {
  return world.day === seasonStartDay(world.season) + DAYS_PER_SEASON - 1;
}

function activeLeagueIds(world: WorldState): string[] {
  return Object.keys(world.leagueMembers);
}

function pseudoTables(world: WorldState): Record<string, string[]> {
  const tables: Record<string, string[]> = {};
  for (const [lid, members] of Object.entries(world.leagueMembers)) {
    tables[lid] = [...members].sort((a, b) => (world.clubs[b] as Club).reputation - (world.clubs[a] as Club).reputation || (a < b ? -1 : 1));
  }
  return tables;
}

function previousTables(world: WorldState): Record<string, string[]> {
  const last = world.history.seasons[world.history.seasons.length - 1];
  const base = pseudoTables(world);
  if (!last) return base;
  // Prefer last season's real tables; leagues without one (newly enabled) fall back to reputation order.
  const out: Record<string, string[]> = { ...base };
  for (const [lid, t] of Object.entries(last.tables)) {
    const members = new Set(world.leagueMembers[lid] ?? []);
    const asPlayed = t.filter((c) => world.clubs[c]);
    // after promotion/relegation some clubs sit in a different league; qualification uses the table as finished.
    out[lid] = asPlayed.length ? asPlayed : out[lid] ?? [...members];
  }
  return out;
}

export function qualificationSpecs(world: WorldState): QualSpec[] {
  return buildQualSpecs(activeLeagueIds(world));
}

export function startSeason(world: WorldState): void {
  const season = world.season;
  const ctx = engineContext(world);
  world.competitions = {};
  world.seasonStats = {};
  for (const p of Object.values(world.players)) {
    if (p.retired) continue;
    p.yellows = {};
    p.suspensions = {};
  }
  markSeasonStartAbility(allPlayers(world));
  for (const c of Object.values(world.clubs)) {
    c.finance.seasonLedger = {};
    c.finance.seasonStartCash = c.finance.cash;
  }

  // all clubs registered anywhere (including clubs just promoted/relegated)
  const allMembers: Record<string, string[]> = world.leagueMembers;
  const entrantsByComp = allocateEntrants(qualificationSpecs(world), {
    season, tables: previousTables(world), history: world.history.champions, leagueMembers: allMembers,
    reputation: (id) => (world.clubs[id] as Club).continentalReputation + (world.clubs[id] as Club).reputation * 0.3,
  });
  const defs = Object.values(COMPETITIONS).sort((a, b) => a.priority - b.priority || (a.id < b.id ? -1 : 1));
  for (const def of defs) {
    if (!isHeldIn(def, season)) continue;
    const rules = activeRules(def, season);
    let entrants: string[];
    if (def.kind === 'league') entrants = allMembers[def.id] ?? [];
    else if (def.kind === 'cup' && def.country) {
      entrants = [];
      for (const [lid, members] of Object.entries(allMembers)) if (LEAGUE_BY_ID[lid]?.country === def.country) entrants.push(...members);
    } else entrants = entrantsByComp[def.id] ?? [];
    if (entrants.length < rules.minEntrants) continue;
    world.competitions[def.id] = createCompetition(def, season, entrants, ctx);
    world.seasonStats[def.id] = {};
  }
  // reset budgets for the new season from current finances
  for (const club of Object.values(world.clubs)) {
    const f = club.finance;
    const revenue = f.broadcastingAnnual + f.sponsorshipAnnual + club.stadium.capacity * 0.72 * f.ticketPrice * 19;
    f.transferBudget = Math.max(0, Math.round(Math.max(0, f.cash) * 0.4 + (club.ownership.wealth / 100) * revenue * 0.12));
    const limit = COMPETITIONS[club.leagueId] ? activeRules(COMPETITIONS[club.leagueId] as CompetitionDef, season).squadCostRatioLimit : null;
    const flush = f.cash > revenue * 0.5 ? 0.06 : 0; // cash-rich clubs let wages grow
    const ratio = Math.min(limit ?? 0.9, 0.66 + flush + (club.ownership.kind === 'investor' || club.ownership.kind === 'state' ? 0.14 : 0) + club.ownership.wealth / 1000);
    const bill = squadOf(world, club.id).reduce((a, p) => a + (p.contract && !p.loan ? p.contract.wageWeekly : 0), 0);
    f.wageBudgetWeekly = Math.round(Math.max(bill * 1.03, (revenue * ratio) / 52));
  }
}

/** Force-play anything still scheduled (should not happen; guarded and reported if it does). */
function drainRemaining(world: WorldState): string[] {
  const warnings: string[] = [];
  const ctx = engineContext(world);
  for (let guard = 0; guard < 40; guard++) {
    let played = 0;
    for (const comp of Object.values(world.competitions)) {
      if (comp.status !== 'active') continue;
      const def = COMPETITIONS[comp.id] as CompetitionDef;
      const pending = comp.fixtures.filter((f) => f.status === 'scheduled');
      for (const f of pending) {
        warnings.push(`unplayed fixture ${f.id} force-played at season end`);
        playFixture(world, comp, def, f, ctx);
        played++;
      }
    }
    if (played === 0) break;
  }
  return warnings;
}

function topN<T>(items: T[], key: (t: T) => number, n: number): T[] {
  return [...items].sort((a, b) => key(b) - key(a)).slice(0, n);
}

export function endSeason(world: WorldState): SeasonSummary {
  const warnings = drainRemaining(world);
  // Safety net: a competition that is still active with nothing left to play is stuck (degenerate field). Close it
  // explicitly and report it instead of letting it silently survive the season.
  for (const comp of Object.values(world.competitions)) {
    if (comp.status === 'active' && !comp.fixtures.some((f) => f.status === 'scheduled')) {
      comp.status = 'complete';
      comp.winner ??= comp.tableOrder[0] ?? null;
      warnings.push(`competition ${comp.id} was stuck without fixtures and was closed`);
    }
  }
  const season = world.season;
  const summary: SeasonSummary = {
    season, champions: {}, tables: {}, topScorers: {}, topAssists: {}, bestPlayers: {}, promoted: [], relegated: [], managerChanges: [], biggestWins: [], leagueStats: {},
  };
  if (warnings.length) world.news.push({ id: nextId(world, 'news'), day: world.day, kind: 'record', clubIds: [], playerIds: [], text: `Scheduling warning: ${warnings.length} fixtures had to be force-played`, ref: null });

  for (const comp of Object.values(world.competitions)) {
    const def = COMPETITIONS[comp.id] as CompetitionDef;
    (world.history.champions[comp.id] ??= {})[season] = { winner: comp.winner, runnerUp: comp.runnerUp };
    summary.champions[comp.id] = { winner: comp.winner, runnerUp: comp.runnerUp };
    if (comp.winner) {
      const rec = clubRecord(world, comp.winner);
      (rec.trophies[comp.id] ??= []).push(season);
      if (def.kind === 'league' || def.kind === 'continental' || def.kind === 'cup' || def.kind === 'intercontinental') {
        const club = world.clubs[comp.winner] as Club;
        world.news.push({ id: nextId(world, 'news'), day: world.day, kind: 'title', clubIds: [comp.winner], playerIds: [], text: `${club.name} win the ${def.name} (season ${season}).`, ref: comp.id });
      }
    }
    if (def.kind === 'league') {
      summary.tables[comp.id] = comp.tableOrder;
      const rules = activeRules(def, season);
      comp.tableOrder.forEach((cid, i) => {
        const club = world.clubs[cid] as Club;
        const prize = rules.prize.positions[i] ?? 0;
        if (prize > 0) receive(club, 'prizeMoney', prize);
        const rec = clubRecord(world, cid);
        rec.bestFinish[comp.id] = Math.min(rec.bestFinish[comp.id] ?? 99, i + 1);
        const table = comp.fixtures.filter((f) => f.stageId === 'league' && f.status === 'played');
        let pts = 0;
        for (const f of table) {
          if (!f.result) continue;
          if (f.home === cid) pts += f.result.homeGoals > f.result.awayGoals ? 3 : f.result.homeGoals === f.result.awayGoals ? 1 : 0;
          else if (f.away === cid) pts += f.result.awayGoals > f.result.homeGoals ? 3 : f.result.homeGoals === f.result.awayGoals ? 1 : 0;
        }
        rec.seasons.push({ season, leagueId: comp.id, position: i + 1, points: pts });
      });
      summary.leagueStats[comp.id] = leagueStats(comp);
      // biggest wins
      const wins = comp.fixtures.filter((f) => f.result).map((f) => ({ fixtureId: f.id, margin: Math.abs((f.result?.homeGoals ?? 0) - (f.result?.awayGoals ?? 0)) }));
      summary.biggestWins.push(...topN(wins, (w) => w.margin, 1));
    }
    const stats = world.seasonStats[comp.id] ?? {};
    const entries = Object.entries(stats);
    if (entries.length) {
      summary.topScorers[comp.id] = topN(entries, ([, s]) => s.goals, 10).map(([playerId, s]) => ({ playerId, clubId: s.clubId, goals: s.goals }));
      summary.topAssists[comp.id] = topN(entries, ([, s]) => s.assists, 10).map(([playerId, s]) => ({ playerId, clubId: s.clubId, assists: s.assists }));
      const minApps = Math.max(5, Math.floor(comp.fixtures.length / Math.max(2, comp.entrants.length) / 3));
      summary.bestPlayers[comp.id] = topN(entries.filter(([, s]) => s.apps >= minApps), ([, s]) => s.ratingSum / s.apps, 5)
        .map(([playerId, s]) => ({ playerId, clubId: s.clubId, avgRating: Math.round((s.ratingSum / s.apps) * 100) / 100, apps: s.apps }));
    }
  }
  // promotion & relegation (from final tables as played)
  for (const link of PYRAMIDS) {
    const upper = world.competitions[link.upper];
    const lower = world.competitions[link.lower];
    if (!upper || !lower || upper.tableOrder.length === 0 || lower.tableOrder.length === 0) continue;
    const down = upper.tableOrder.slice(-link.swap);
    const up = lower.tableOrder.slice(0, link.swap);
    const um = world.leagueMembers[link.upper] as string[];
    const lm = world.leagueMembers[link.lower] as string[];
    world.leagueMembers[link.upper] = [...um.filter((c) => !down.includes(c)), ...up];
    world.leagueMembers[link.lower] = [...lm.filter((c) => !up.includes(c)), ...down];
    for (const c of up) {
      (world.clubs[c] as Club).leagueId = link.upper;
      summary.promoted.push({ clubId: c, from: link.lower, to: link.upper });
      world.news.push({ id: nextId(world, 'news'), day: world.day, kind: 'promotion', clubIds: [c], playerIds: [], text: `${(world.clubs[c] as Club).name} are promoted to the ${LEAGUE_BY_ID[link.upper]?.name}.`, ref: link.upper });
    }
    for (const c of down) {
      (world.clubs[c] as Club).leagueId = link.lower;
      summary.relegated.push({ clubId: c, from: link.upper, to: link.lower });
      world.news.push({ id: nextId(world, 'news'), day: world.day, kind: 'promotion', clubIds: [c], playerIds: [], text: `${(world.clubs[c] as Club).name} are relegated from the ${LEAGUE_BY_ID[link.upper]?.name}.`, ref: link.upper });
    }
  }
  const bd = breakoutsAndDecliners(world, allPlayers(world), season);
  summary.breakouts = bd.breakouts;
  summary.decliners = bd.decliners;
  for (const b of bd.breakouts.slice(0, 2)) {
    const pl = world.players[b.playerId];
    if (pl) world.news.push({ id: nextId(world, 'news'), day: world.day, kind: 'milestone', clubIds: [b.clubId], playerIds: [b.playerId], text: `Breakout star: ${pl.name} improved from ${b.from} to ${b.to} this season.`, ref: b.playerId });
  }
  world.history.seasons.push(summary);
  return summary;
}

function leagueStats(comp: CompetitionState): LeagueSeasonStats {
  const fx = comp.fixtures.filter((f) => f.stageId === 'league' && f.result);
  const n = fx.length || 1;
  let hg = 0, ag = 0, hw = 0, dr = 0, aw = 0, cs = 0, yel = 0, red = 0;
  const pts = new Map<string, number>();
  for (const f of fx) {
    const r = f.result as NonNullable<typeof f.result>;
    hg += r.homeGoals; ag += r.awayGoals;
    if (r.homeGoals > r.awayGoals) hw++; else if (r.homeGoals < r.awayGoals) aw++; else dr++;
    if (r.homeGoals === 0) cs++;
    if (r.awayGoals === 0) cs++;
    yel += r.homeYellow + r.awayYellow; red += r.homeRed + r.awayRed;
    pts.set(f.home, (pts.get(f.home) ?? 0) + (r.homeGoals > r.awayGoals ? 3 : r.homeGoals === r.awayGoals ? 1 : 0));
    pts.set(f.away, (pts.get(f.away) ?? 0) + (r.awayGoals > r.homeGoals ? 3 : r.homeGoals === r.awayGoals ? 1 : 0));
  }
  const vals = [...pts.values()];
  const m = vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
  const sd = Math.sqrt(vals.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, vals.length));
  return {
    matches: fx.length, goalsPerMatch: (hg + ag) / n, homeGoals: hg / n, awayGoals: ag / n, homeWinPct: hw / n, drawPct: dr / n, awayWinPct: aw / n,
    cleanSheetPct: cs / (2 * n), yellowPerMatch: yel / n, redPerMatch: red / n, championPoints: Math.max(0, ...vals), lastPlacePoints: Math.min(...(vals.length ? vals : [0])), pointsSd: sd,
  };
}


export function fixturesToday(world: WorldState): { comp: CompetitionState; def: CompetitionDef; fixtureId: string }[] {
  const out: { comp: CompetitionState; def: CompetitionDef; fixtureId: string }[] = [];
  for (const comp of Object.values(world.competitions)) {
    const def = COMPETITIONS[comp.id] as CompetitionDef;
    for (const f of fixturesOnDay(comp, world.day)) out.push({ comp, def, fixtureId: f.id });
  }
  void Rng;
  return out;
}
