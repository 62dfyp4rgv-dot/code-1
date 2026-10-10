/**
 * Single-player career simulation ("My player career").
 *
 * What is real here: the player is generated with the engine's own attribute/ceiling model, develops week by week with
 * `developPlayerWeek` (age curves, decline, injuries' effect), retires with `retirementProbability`, is valued by
 * `marketValue`, and every league, cup and continental match he plays is a full run of the match engine (`simulateMatch`)
 * with his actual attributes in the line-up, so goals, assists, ratings, minutes and injuries come from the same event
 * model as the club game.
 * What is a model on top: the rest of each league table (other clubs' results) uses a cheap Poisson model calibrated to the
 * engine's goal rates, club strength is a function of league quality and the club's rank in the listed order, and
 * transfers / loans / contracts follow simple rules. Club names are the unofficial real-name overlay (no logos); all outcomes
 * are fictional. Deterministic for a given input.
 */
import { clamp } from './math';
import { simulateMatch, type MatchInput } from './match';
import { generatePlayer, overall, ageOf } from './players';
import { Rng } from './rng';
import { defaultTactics } from './tactics';
import { syntheticMatch, syntheticSheet, toMatchPlayer } from './synth';
import type { Club, Player, Position } from './types';
import { COMPETITIONS, LEAGUE_BY_ID } from './competition/registry';
import { REAL_CLUB_NAMES } from './data/realClubNames';
import { REAL_COMPETITION_NAMES } from './data/realCompetitionNames';
import { developPlayerWeek, retirementProbability } from './world/development';
import { marketValue } from './world/valuation';

export type Talent = 'fate' | 'prospect' | 'wonderkid' | 'journeyman';

export interface CareerInput {
  seed: string;
  name: string;
  position: Position;
  nationality?: string;
  /** Age at the start of the career (15..19, default 16). */
  startAge?: number;
  /** 'fate' (default) draws the hidden ceiling from the realistic distribution. */
  talent?: Talent;
  /** League id of the first club (default: random among the major leagues). */
  homeLeague?: string;
}

export interface CareerSeason {
  season: number;
  age: number;
  ovr: number;
  club: string;
  leagueId: string;
  league: string;
  onLoan: boolean;
  apps: number;
  starts: number;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  avgRating: number;
  injuryDays: number;
  leaguePos: number;
  leagueSize: number;
  cup: string;
  cupResult: string;
  continental: { competition: string; result: string } | null;
  honours: string[];
  awards: string[];
  transferIn: { from: string; fee: number } | null;
  note: string | null;
}

export interface CareerResult {
  input: CareerInput;
  /** Hidden ceiling the player was generated with (for the reveal). */
  potential: number;
  startOvr: number;
  seasons: CareerSeason[];
  totals: { seasons: number; apps: number; goals: number; assists: number; cleanSheets: number; caps: number; internationalGoals: number; fees: number };
  peak: { ovr: number; age: number; season: number };
  retiredAge: number;
  honours: { name: string; count: number }[];
  clubs: { name: string; from: number; to: number }[];
  headline: string[];
}

interface ClubRef { leagueId: string; rank: number }
type NamedLeague = { id: string; names: string[] };

const MAJOR: NamedLeague[] = Object.entries(REAL_CLUB_NAMES.leagues).map(([id, list]) => ({ id, names: list.map((c) => c.name) }));

/** Typical starter ability of the club ranked `rank` (0 = strongest) in a league of `size` clubs. */
export function clubLevel(leagueId: string, rank: number, size: number): number {
  const lp = LEAGUE_BY_ID[leagueId];
  if (!lp) return 55;
  const z = size <= 1 ? 0 : 1.6 - (3.2 * rank) / (size - 1);
  return lp.quality + lp.clubSpread * z;
}

function leagueSize(leagueId: string): number {
  const named = MAJOR.find((l) => l.id === leagueId);
  return named ? named.names.length : (LEAGUE_BY_ID[leagueId]?.clubs ?? 18);
}

function clubName(ref: ClubRef): string {
  return MAJOR.find((l) => l.id === ref.leagueId)?.names[ref.rank] ?? `${LEAGUE_BY_ID[ref.leagueId]?.name ?? ref.leagueId} club`;
}

const leagueName = (id: string): string => REAL_COMPETITION_NAMES[id]?.name ?? COMPETITIONS[id]?.name ?? id;

function stubClub(level: number): Club {
  const f = clamp(35 + (level - 45) * 1.4, 35, 95);
  return { facilities: { training: f, youth: f, medical: f, scouting: f, coaching: f } } as unknown as Club;
}

/** Random pick weighted by `w`. */
function pickWeighted<T>(rng: Rng, items: T[], w: (t: T) => number): T {
  return items[rng.weightedIndex(items.map(w))] as T;
}

interface Candidate { ref: ClubRef; level: number }

function candidates(): Candidate[] {
  const out: Candidate[] = [];
  for (const l of MAJOR) for (let r = 0; r < l.names.length; r++) out.push({ ref: { leagueId: l.id, rank: r }, level: clubLevel(l.id, r, l.names.length) });
  return out;
}
const CANDIDATES = candidates();

function sheetWithHero(level: number, hero: Player, day: number, asStarter: boolean, tag: string, side: string): ReturnType<typeof syntheticSheet> {
  const formation = hero.primary === 'AM' ? '4-2-3-1' : '4-3-3';
  const sheet = syntheticSheet({ id: side, quality: level, seed: tag, tactics: defaultTactics(formation), spread: 4 });
  const mp = { ...toMatchPlayer(hero, day), id: 'HERO', name: hero.name };
  const slot = sheet.players.slice(0, 11).findIndex((p) => p.primary === hero.primary);
  if (asStarter && slot >= 0) sheet.players[slot] = mp;
  else {
    const benchIdx = sheet.players.findIndex((p, i) => i >= 11 && p.primary === hero.primary);
    if (benchIdx >= 0) sheet.players[benchIdx] = mp;
    else sheet.players[sheet.players.length - 1] = mp;
  }
  return sheet;
}

interface MatchOutcome { goalsFor: number; goalsAgainst: number; won: boolean; draw: boolean; minutes: number; goals: number; assists: number; rating: number; started: boolean; cleanSheet: boolean; injury: number }

function playMatch(rng: Rng, hero: Player, day: number, ownLevel: number, oppLevel: number, home: boolean, startProb: number, tag: string, knockout: boolean): MatchOutcome {
  const starter = rng.chance(startProb);
  const mine = sheetWithHero(ownLevel, hero, day, starter, `${tag}o`, 'OWN');
  const theirs = syntheticSheet({ id: 'OPP', quality: oppLevel, seed: `${tag}p`, tactics: defaultTactics('4-3-3'), spread: 4 });
  const input: MatchInput = syntheticMatch(`${tag}`, `career:${tag}`, home ? mine : theirs, home ? theirs : mine, knockout ? { rules: { mustHaveWinner: true, extraTime: true, maxSubsRegular: 5 } } : undefined);
  const res = simulateMatch(input);
  const side = home ? 'home' : 'away';
  const gf = home ? res.score.home : res.score.away;
  const ga = home ? res.score.away : res.score.home;
  const line = res.players.find((p) => p.playerId === 'HERO');
  const inj = res.injuries.find((i) => i.playerId === 'HERO');
  const winner = res.winner;
  return {
    goalsFor: gf, goalsAgainst: ga, won: winner === side, draw: winner === 'draw', minutes: line?.minutes ?? 0, goals: line?.goals ?? 0, assists: line?.assists ?? 0,
    rating: line && line.minutes > 0 ? line.rating : 0, started: line?.started ?? false, cleanSheet: ga === 0 && (line?.minutes ?? 0) >= 60, injury: inj ? ({ 1: 9, 2: 28, 3: 85, 4: 230 } as const)[inj.severity] : 0,
  };
}

/** Cheap league table for everyone else (Poisson goals, calibrated to the engine's home/away rates). */
function tableRank(rng: Rng, leagueId: string, size: number, ownRank: number, ownPoints: number, ownGd: number): number {
  const lv = Array.from({ length: size }, (_, r) => clubLevel(leagueId, r, size));
  const pts = new Array<number>(size).fill(0);
  const gd = new Array<number>(size).fill(0);
  for (let i = 0; i < size; i++) for (let j = 0; j < size; j++) {
    if (i === j || i === ownRank || j === ownRank) continue;
    const d = (lv[i] as number) - (lv[j] as number);
    const hg = rng.poisson(1.5 * Math.exp(0.028 * d));
    const ag = rng.poisson(1.2 * Math.exp(-0.028 * d));
    gd[i] = (gd[i] as number) + hg - ag; gd[j] = (gd[j] as number) + ag - hg;
    if (hg > ag) pts[i] = (pts[i] as number) + 3; else if (hg < ag) pts[j] = (pts[j] as number) + 3; else { pts[i] = (pts[i] as number) + 1; pts[j] = (pts[j] as number) + 1; }
  }
  // the others also played the hero's club: approximate those matches by the mirror of the hero's points
  const others = size - 1;
  const ownGames = (others * 2);
  const remaining = ownGames * 3 - ownPoints; // points not won by the hero are shared out by strength
  const w = lv.map((l, i) => (i === ownRank ? 0 : Math.exp(0.05 * (l - (lv[ownRank] as number)))));
  const sumW = w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < size; i++) if (i !== ownRank) { pts[i] = (pts[i] as number) + (remaining * (w[i] as number)) / sumW; gd[i] = (gd[i] as number) - ownGd / others; }
  const rows = pts.map((p, i) => ({ i, p: i === ownRank ? ownPoints : p, g: i === ownRank ? ownGd : (gd[i] as number) }));
  rows.sort((a, b) => b.p - a.p || b.g - a.g || a.i - b.i);
  return rows.findIndex((r) => r.i === ownRank) + 1;
}

const CONTINENTAL: Record<string, { slots: { comp: string; upTo: number }[]; level: number }> = {
  UEFA_BIG: { slots: [{ comp: 'UCL', upTo: 4 }, { comp: 'UEL', upTo: 5 }, { comp: 'UECL', upTo: 6 }], level: 76 },
  UEFA_MID: { slots: [{ comp: 'UCL', upTo: 2 }, { comp: 'UEL', upTo: 3 }, { comp: 'UECL', upTo: 4 }], level: 70 },
  AFC: { slots: [{ comp: 'ACLE', upTo: 3 }, { comp: 'ACL2', upTo: 5 }], level: 62 },
  CONMEBOL: { slots: [{ comp: 'COPA', upTo: 4 }, { comp: 'SUDA', upTo: 8 }], level: 63 },
  CONCACAF: { slots: [{ comp: 'CCC', upTo: 3 }], level: 58 },
};
const COMP_LEVEL: Record<string, number> = { UCL: 76, UEL: 70, UECL: 65, ACLE: 62, ACL2: 57, COPA: 64, SUDA: 59, CCC: 58 };

function continentalFor(leagueId: string, pos: number): string | null {
  const lp = LEAGUE_BY_ID[leagueId];
  if (!lp) return null;
  const key = lp.confederation === 'UEFA' ? (['ENG1', 'ESP1', 'ITA1', 'GER1'].includes(leagueId) ? 'UEFA_BIG' : 'UEFA_MID') : lp.confederation === 'AFC' ? 'AFC' : lp.confederation === 'CONMEBOL' ? 'CONMEBOL' : lp.confederation === 'CONCACAF' ? 'CONCACAF' : null;
  if (!key) return null;
  for (const s of (CONTINENTAL[key] as { slots: { comp: string; upTo: number }[] }).slots) if (pos <= s.upTo) return s.comp;
  return null;
}

const ROUND_NAMES = ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final'];

/** Plays a knockout run; returns the stage reached and whether the trophy was won. */
function knockoutRun(rng: Rng, hero: Player, day: number, ownLevel: number, startProb: number, oppLevels: number[], tag: string): { result: string; won: boolean; matches: MatchOutcome[] } {
  const matches: MatchOutcome[] = [];
  for (let r = 0; r < oppLevels.length; r++) {
    const m = playMatch(rng, hero, day, ownLevel, oppLevels[r] as number, rng.chance(0.5), startProb, `${tag}k${r}`, true);
    matches.push(m);
    if (!m.won) {
      const stage = ROUND_NAMES[ROUND_NAMES.length - oppLevels.length + r] as string;
      return { result: `Out in the ${stage}`, won: false, matches };
    }
  }
  return { result: 'Winner', won: true, matches };
}

const POS_GROUP_GK = (p: Position): boolean => p === 'GK';

/** Simulates a whole career season by season; `onSeason` receives each finished season (for animated reveals). */
export function simulateCareer(input: CareerInput, onSeason?: (s: CareerSeason) => void): CareerResult {
  const rng = Rng.fromSeed(`career:${input.seed}:${input.name}:${input.position}`);
  const startAge = clamp(Math.round(input.startAge ?? 16), 15, 19);
  const talent = input.talent ?? 'fate';
  // `adult` is the hidden adult level, drawn like the club game's academy intake (league-relative, occasional wonderkids)
  let adult = rng.normal(66, 9);
  if (rng.chance(0.02)) adult += rng.float(7, 14);
  const potential = clamp(talent === 'wonderkid' ? rng.normal(88, 4) : talent === 'prospect' ? rng.normal(77, 5) : talent === 'journeyman' ? rng.normal(58, 5) : adult, 40, 96);
  const ability0 = clamp(potential * (0.55 + 0.07 * (startAge + 0.4 - 15.5)) + rng.normal(0, 2.5), 20, potential);
  const home = input.homeLeague && MAJOR.some((l) => l.id === input.homeLeague) ? input.homeLeague : (rng.pick(['ENG1', 'ESP1', 'ITA1', 'GER1', 'FRA1', 'POR1', 'NED1', 'BRA1', 'SAU1', 'USA1']) as string);
  const day0 = 0;
  const birthDay = day0 - Math.round(startAge * 365.25 + rng.float(0, 300));
  const hero = generatePlayer(rng, { id: 'p1', name: input.name, nationality: input.nationality ?? 'XXX', age: ageOf({ birthDay }, day0), day: day0, position: input.position, ability: ability0, potential });
  hero.birthDay = birthDay;
  hero.pot = potential;
  const startOvr = overall(hero);

  // first club: the larger the ceiling, the bigger the club that signs him
  const homeCands = CANDIDATES.filter((c) => c.ref.leagueId === home);
  const target0 = potential * 0.92 - 8;
  let club: Candidate = pickWeighted(rng, homeCands, (c) => Math.exp(-(((c.level - target0) / 7) ** 2)) + 0.02);
  let contractLeft = rng.int(3) + 2;
  let loanFrom: Candidate | null = null;
  let loanYears = 0;

  const seasons: CareerSeason[] = [];
  let age = startAge;
  let day = day0;
  let caps = 0; let intGoals = 0; let fees = 0;
  let peak = { ovr: startOvr, age: startAge, season: 1 };
  const honours = new Map<string, number>();
  const clubsLog: { name: string; from: number; to: number }[] = [];
  let transferIn: CareerSeason['transferIn'] = null;
  let note: string | null = null;
  let lastStartProb = 0.5;
  const leftAt = new Map<string, number>(); // club key -> season he left (no boomerang moves within 3 seasons)
  const keyOf = (c: Candidate): string => `${c.ref.leagueId}:${c.ref.rank}`;

  for (let s = 1; s <= 26; s++) {
    // ---- weekly development through the season
    let injuryDaysSeason = 0;
    const stub = stubClub(club.level);
    hero.workload = 6 * clamp(lastStartProb, 0.1, 1); // workload feeds development for youngsters, as match minutes do in the club game
    for (let w = 0; w < 52; w++) { developPlayerWeek(hero, day + w * 7, stub, rng); }
    day += 364;
    const ovr = Math.round(overall(hero));
    if (ovr > peak.ovr) peak = { ovr, age, season: s };

    // ---- playing time
    const youth = age < 18;
    const gap = ovr - club.level;
    let startProb = clamp(0.55 + gap / 11, 0.03, 0.96);
    if (youth) startProb = Math.min(startProb, 0.12) * (age < 17 ? 0.5 : 1);
    lastStartProb = startProb;
    const ref = club.ref;
    const size = leagueSize(ref.leagueId);
    const lvls = Array.from({ length: size }, (_, r) => clubLevel(ref.leagueId, r, size));
    const ownRank = Math.min(ref.rank, size - 1);

    // ---- league season: every match is a full engine match
    let apps = 0; let starts = 0; let minutes = 0; let goals = 0; let assists = 0; let cleanSheets = 0; let ratingSum = 0; let ratedApps = 0;
    let points = 0; let gd = 0; let unavailable = 0;
    const order: number[] = [];
    for (let j = 0; j < size; j++) if (j !== ownRank) { order.push(j); order.push(-j - 1); }
    for (let m = 0; m < order.length; m++) {
      const o = order[m] as number;
      const opp = lvls[o >= 0 ? o : -o - 1] as number;
      const isHome = o >= 0;
      // an injured player is not selected, but the match is still played so team results keep the same scale
      const available = unavailable <= 0;
      const team = playMatch(rng, hero, day, club.level, opp, isHome, available ? startProb : 0, `s${s}m${m}`, false);
      points += team.won ? 3 : team.draw ? 1 : 0;
      gd += team.goalsFor - team.goalsAgainst;
      if (!available) { unavailable -= 7; continue; }
      if (team.minutes > 0) {
        apps++; if (team.started) starts++; minutes += team.minutes; goals += team.goals; assists += team.assists;
        if (team.cleanSheet && (POS_GROUP_GK(hero.primary) || hero.primary === 'CB' || hero.primary === 'LB' || hero.primary === 'RB')) cleanSheets++;
        if (team.rating > 0) { ratingSum += team.rating; ratedApps++; }
      }
      if (team.injury > 0) { unavailable = team.injury; injuryDaysSeason += team.injury; }
    }
    const pos = tableRank(rng, ref.leagueId, size, ownRank, points, gd);
    const honoursNow: string[] = [];
    const awards: string[] = [];
    const lname = leagueName(ref.leagueId);
    if (pos === 1) honoursNow.push(lname);

    // ---- domestic cup (single legs, drawn opponents of the same league)
    const cupId = `${ref.leagueId.slice(0, 3)}-CUP`;
    const cupName = REAL_COMPETITION_NAMES[cupId]?.name ?? 'Domestic cup';
    const cupRounds = clamp(Math.round(Math.log2(size)) + 1, 4, 6);
    const cupOpp = Array.from({ length: cupRounds }, (_, i) => clamp((lvls[Math.min(size - 1, Math.max(0, rng.int(size)))] as number) + i * 0.8, 40, 90));
    const cup = knockoutRun(rng, hero, day, club.level, startProb * 0.8, cupOpp.map((l, i) => (i < cupRounds - 2 ? l - 2 : l)), `s${s}c`);
    for (const m of cup.matches) if (m.minutes > 0) { apps++; goals += m.goals; assists += m.assists; minutes += m.minutes; if (m.started) starts++; if (m.rating > 0) { ratingSum += m.rating; ratedApps++; } }
    if (cup.won) honoursNow.push(cupName);

    // ---- continental competition
    let continental: CareerSeason['continental'] = null;
    const cc = continentalFor(ref.leagueId, pos);
    if (cc) {
      const lvl = COMP_LEVEL[cc] as number;
      const league: MatchOutcome[] = [];
      let pts = 0;
      const games = cc === 'UCL' || cc === 'UEL' || cc === 'UECL' ? 8 : 6;
      for (let g = 0; g < games; g++) { const m = playMatch(rng, hero, day, club.level, clamp(rng.normal(lvl, 4), 45, 90), g % 2 === 0, startProb, `s${s}e${g}`, false); league.push(m); pts += m.won ? 3 : m.draw ? 1 : 0; }
      let result: string; let won = false; let ko: MatchOutcome[] = [];
      const need = games === 8 ? 10 : 8;
      if (pts < need - 3) result = 'Out in the league phase';
      else {
        const run = knockoutRun(rng, hero, day, club.level, startProb, [lvl, lvl + 2, lvl + 4, lvl + 5], `s${s}x`);
        ko = run.matches; result = run.won ? 'Winner' : run.result.replace('Round of 32', 'Round of 16'); won = run.won;
      }
      for (const m of [...league, ...ko]) if (m.minutes > 0) { apps++; goals += m.goals; assists += m.assists; minutes += m.minutes; if (m.started) starts++; if (m.rating > 0) { ratingSum += m.rating; ratedApps++; } }
      continental = { competition: REAL_COMPETITION_NAMES[cc]?.name ?? cc, result };
      if (won) honoursNow.push(REAL_COMPETITION_NAMES[cc]?.name ?? cc);
    }
    const avgRating = ratedApps > 0 ? Math.round((ratingSum / ratedApps) * 100) / 100 : 0;

    // ---- awards from the season's numbers
    const scorerBar = 14 + (lvls[0] as number) * 0.18;
    if (!POS_GROUP_GK(hero.primary) && goals >= scorerBar + 6 && starts >= 25) awards.push(`${lname} top scorer`);
    if (avgRating >= 7.5 && apps >= 30 && (pos <= 2 || ovr >= 84)) awards.push(`${lname} Player of the Season`);
    if (avgRating >= 7.8 && apps >= 35 && ovr >= 88 && (honoursNow.length > 0)) awards.push('World Player of the Year (fictional award)');
    for (const h of honoursNow) honours.set(h, (honours.get(h) ?? 0) + 1);
    for (const a of awards) honours.set(a, (honours.get(a) ?? 0) + 1);

    // ---- international caps (a model: call-ups need a high standing for the country)
    if (ovr >= 74 && age >= 19) { const c = Math.round(clamp((ovr - 70) * 0.9, 0, 14) * (apps / 45)); caps += c; if (!POS_GROUP_GK(hero.primary)) intGoals += Math.round(c * (hero.primary === 'ST' ? 0.38 : hero.primary === 'GK' ? 0 : 0.12) * rng.float(0.6, 1.3)); }

    const entry: CareerSeason = {
      season: s, age, ovr, club: clubName(ref), leagueId: ref.leagueId, league: lname, onLoan: loanFrom !== null,
      apps, starts, minutes, goals, assists, cleanSheets, avgRating, injuryDays: injuryDaysSeason, leaguePos: pos, leagueSize: size,
      cup: cupName, cupResult: cup.result, continental, honours: honoursNow, awards, transferIn, note,
    };
    seasons.push(entry);
    const last = clubsLog[clubsLog.length - 1];
    if (last && last.name === entry.club) last.to = s; else clubsLog.push({ name: entry.club, from: s, to: s });
    onSeason?.(entry);
    transferIn = null; note = null;

    // ---- retirement
    age++;
    const pRet = retirementProbability(age, ovr, hero.primary === 'GK') + (age >= 40 ? 0.5 : 0);
    if (age >= 33 && rng.chance(Math.min(0.98, pRet))) break;
    if (age > 41) break;

    // ---- end of season: loans, contract, transfers
    contractLeft--;
    if (loanFrom) {
      loanYears--;
      if (loanYears <= 0) { club = loanFrom; loanFrom = null; note = 'Returned from loan'; }
      continue;
    }
    const ovrNow = Math.round(overall(hero));
    if (age <= 21 && ovrNow < club.level - 6 && rng.chance(0.7)) {
      // loan out for playing time (a club around his own level)
      const loanCands = CANDIDATES.filter((c) => Math.abs(c.level - (ovrNow + 2)) < 6);
      if (loanCands.length > 0) { loanFrom = club; loanYears = 1; club = pickWeighted(rng, loanCands, (c) => Math.exp(-(((c.level - (ovrNow + 2)) / 4) ** 2))); note = `Loaned out from ${clubName(loanFrom.ref)}`; continue; }
    }
    const surplus = ovrNow - club.level;
    const wantsOut = contractLeft <= 0 || surplus > 7 || surplus < -7 || rng.chance(0.07);
    if (wantsOut) {
      const ambition = rng.float(-2, 4) + (surplus > 5 ? 3 : 0);
      const target = ovrNow + ambition;
      leftAt.set(keyOf(club), s);
      const next = pickWeighted(rng, CANDIDATES.filter((c) => keyOf(c) !== keyOf(club) && s - (leftAt.get(keyOf(c)) ?? -99) > 3), (c) => Math.exp(-(((c.level - target) / 5) ** 2)) * (c.ref.leagueId === club.ref.leagueId ? 1.2 : 1) + 1e-4);
      const fee = Math.round(marketValue({ ...hero, contract: null } as Player, day, undefined) * rng.float(0.85, 1.35) / 1e5) * 1e5;
      transferIn = { from: clubName(club.ref), fee };
      fees += fee;
      club = next;
      contractLeft = rng.int(4) + 2;
    }
  }

  const honoursArr = [...honours.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const totals = {
    seasons: seasons.length, apps: seasons.reduce((a, s) => a + s.apps, 0), goals: seasons.reduce((a, s) => a + s.goals, 0), assists: seasons.reduce((a, s) => a + s.assists, 0),
    cleanSheets: seasons.reduce((a, s) => a + s.cleanSheets, 0), caps, internationalGoals: intGoals, fees,
  };
  const headline: string[] = [];
  const titles = honoursArr.filter((h) => !/top scorer|Player of|World Player/.test(h.name));
  if (titles.length > 0) headline.push(`${titles.reduce((a, h) => a + h.count, 0)} trophies`);
  headline.push(`${totals.apps} apps · ${totals.goals} goals · ${totals.assists} assists`);
  headline.push(`Peak ${peak.ovr} at ${peak.age}`);
  return { input, potential: Math.round(potential), startOvr: Math.round(startOvr), seasons, totals, peak, retiredAge: age - 1, honours: honoursArr, clubs: clubsLog, headline };
}
