/**
 * Single-player career simulation ("My player career").
 *
 * What is real here: the player is generated with the engine's own attribute/ceiling model, develops week by week with
 * `developPlayerWeek` (age curves, decline), retires with `retirementProbability`, is valued by `marketValue`, and every
 * league, cup, continental and international-tournament match he plays is a full run of the match engine (`simulateMatch`)
 * with his actual attributes in the line-up, so goals, assists, ratings, minutes and injuries come from the same event model
 * as the club game.
 * What is a model on top: the rest of each league table (other clubs' results) uses a cheap Poisson model calibrated to the
 * engine's goal rates; club and national-team strength are scenario numbers; transfers, loans and contracts follow simple
 * rules (or the player's own choices); individual awards compare the player's season with a simulated field of rivals.
 * Club, competition and trophy names are the unofficial real-name overlay (plain text, no logos); every outcome is
 * fictional. Deterministic for a given input and sequence of choices.
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

export interface Nation { code: string; name: string; confed: 'UEFA' | 'CONMEBOL' | 'CAF' | 'AFC' | 'CONCACAF' | 'OFC'; /** Typical national-team starter ability (scenario estimate). */ level: number; league?: string }

/** Scenario national-team strengths (unofficial estimates, not rankings). */
export const NATIONS: Nation[] = [
  { code: 'ARG', name: 'Argentina', confed: 'CONMEBOL', level: 85 }, { code: 'FRA', name: 'France', confed: 'UEFA', level: 85, league: 'FRA1' },
  { code: 'ESP', name: 'Spain', confed: 'UEFA', level: 85, league: 'ESP1' }, { code: 'ENG', name: 'England', confed: 'UEFA', level: 84, league: 'ENG1' },
  { code: 'BRA', name: 'Brazil', confed: 'CONMEBOL', level: 84, league: 'BRA1' }, { code: 'POR', name: 'Portugal', confed: 'UEFA', level: 83, league: 'POR1' },
  { code: 'GER', name: 'Germany', confed: 'UEFA', level: 82, league: 'GER1' }, { code: 'NED', name: 'Netherlands', confed: 'UEFA', level: 82, league: 'NED1' },
  { code: 'ITA', name: 'Italy', confed: 'UEFA', level: 80, league: 'ITA1' }, { code: 'BEL', name: 'Belgium', confed: 'UEFA', level: 79 },
  { code: 'CRO', name: 'Croatia', confed: 'UEFA', level: 77 }, { code: 'URU', name: 'Uruguay', confed: 'CONMEBOL', level: 77 },
  { code: 'COL', name: 'Colombia', confed: 'CONMEBOL', level: 77 }, { code: 'MAR', name: 'Morocco', confed: 'CAF', level: 76 },
  { code: 'JPN', name: 'Japan', confed: 'AFC', level: 74 }, { code: 'SEN', name: 'Senegal', confed: 'CAF', level: 74 },
  { code: 'USA', name: 'United States', confed: 'CONCACAF', level: 74, league: 'USA1' }, { code: 'SUI', name: 'Switzerland', confed: 'UEFA', level: 74 },
  { code: 'DEN', name: 'Denmark', confed: 'UEFA', level: 74 }, { code: 'NOR', name: 'Norway', confed: 'UEFA', level: 74 },
  { code: 'MEX', name: 'Mexico', confed: 'CONCACAF', level: 73 }, { code: 'AUT', name: 'Austria', confed: 'UEFA', level: 73 },
  { code: 'TUR', name: 'Türkiye', confed: 'UEFA', level: 73 }, { code: 'NGA', name: 'Nigeria', confed: 'CAF', level: 72 },
  { code: 'EGY', name: 'Egypt', confed: 'CAF', level: 72 }, { code: 'CIV', name: 'Ivory Coast', confed: 'CAF', level: 72 },
  { code: 'KOR', name: 'South Korea', confed: 'AFC', level: 72 }, { code: 'ECU', name: 'Ecuador', confed: 'CONMEBOL', level: 72 },
  { code: 'SWE', name: 'Sweden', confed: 'UEFA', level: 72 }, { code: 'POL', name: 'Poland', confed: 'UEFA', level: 72 },
  { code: 'SRB', name: 'Serbia', confed: 'UEFA', level: 72 }, { code: 'ALG', name: 'Algeria', confed: 'CAF', level: 71 },
  { code: 'UKR', name: 'Ukraine', confed: 'UEFA', level: 71 }, { code: 'SCO', name: 'Scotland', confed: 'UEFA', level: 70 },
  { code: 'CZE', name: 'Czechia', confed: 'UEFA', level: 70 }, { code: 'IRN', name: 'Iran', confed: 'AFC', level: 70 },
  { code: 'AUS', name: 'Australia', confed: 'AFC', level: 69 }, { code: 'CMR', name: 'Cameroon', confed: 'CAF', level: 69 },
  { code: 'CAN', name: 'Canada', confed: 'CONCACAF', level: 68 }, { code: 'PAR', name: 'Paraguay', confed: 'CONMEBOL', level: 68 },
  { code: 'CHI', name: 'Chile', confed: 'CONMEBOL', level: 68 }, { code: 'GHA', name: 'Ghana', confed: 'CAF', level: 68 },
  { code: 'GRE', name: 'Greece', confed: 'UEFA', level: 68 }, { code: 'KSA', name: 'Saudi Arabia', confed: 'AFC', level: 66, league: 'SAU1' },
  { code: 'PER', name: 'Peru', confed: 'CONMEBOL', level: 66 }, { code: 'UZB', name: 'Uzbekistan', confed: 'AFC', level: 63 },
  { code: 'QAT', name: 'Qatar', confed: 'AFC', level: 62 }, { code: 'NZL', name: 'New Zealand', confed: 'OFC', level: 58 },
];
const NATION_BY_CODE: Record<string, Nation> = Object.fromEntries(NATIONS.map((n) => [n.code, n]));

const CONTINENTAL_CUP: Record<Nation['confed'], string> = {
  UEFA: 'UEFA European Championship', CONMEBOL: 'Copa América', CAF: 'Africa Cup of Nations', AFC: 'AFC Asian Cup', CONCACAF: 'Concacaf Gold Cup', OFC: 'OFC Nations Cup',
};
export const WORLD_CUP = 'FIFA World Cup';
export const BALLON_DOR = "Ballon d'Or";

export interface CareerInput {
  seed: string;
  name: string;
  position: Position;
  /** Nation code from `NATIONS` (default: random). Decides the national team and the default home league. */
  nationality?: string;
  /** Age at the start of the career (15..19, default 16). */
  startAge?: number;
  /** 'fate' (default) draws the hidden ceiling from the realistic distribution. */
  talent?: Talent;
  /** League id of the first club (default: the nation's league if it has one, else random among the major leagues). */
  homeLeague?: string;
  /** Exact first club by name (must be one of `careerClubs()`); overrides `homeLeague`. */
  startClub?: string;
  /** Who decides transfers: 'auto' (default for `simulateCareer`) or 'manual' (the caller answers each window). */
  transfers?: 'auto' | 'manual';
}

export interface TournamentResult { name: string; nation: string; result: string; won: boolean; matches: number; goals: number; assists: number; awards: string[] }

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
  /** National-team tournament played this season, if called up. */
  tournament: TournamentResult | null;
  /** Team honours (league, cups, continental, international). */
  honours: string[];
  /** Personal awards. */
  awards: string[];
  /** Ballon d'Or voting: rank among the world's top players (null when too young / not in the top 30). */
  ballonDor: { rank: number | null } | null;
  transferIn: { from: string; fee: number } | null;
  note: string | null;
}

export interface TransferOffer {
  id: string;
  club: string;
  leagueId: string;
  league: string;
  /** Club's usual starter level against the player's current rating. */
  level: number;
  role: 'Key player' | 'Starter' | 'Rotation' | 'Bench';
  /** Competition the club usually plays in Europe/continentally, if any. */
  continental: string | null;
  fee: number;
  kind: 'step up' | 'good fit' | 'dream move' | 'new league';
}

export interface CareerResult {
  input: CareerInput;
  nation: { code: string; name: string };
  /** Hidden ceiling the player was generated with (for the reveal). */
  potential: number;
  startOvr: number;
  seasons: CareerSeason[];
  totals: { seasons: number; apps: number; goals: number; assists: number; cleanSheets: number; caps: number; internationalGoals: number; fees: number };
  peak: { ovr: number; age: number; season: number };
  retiredAge: number;
  /** Team honours with counts. */
  honours: { name: string; count: number }[];
  /** Personal awards with counts (includes Ballon d'Or wins and podiums). */
  awards: { name: string; count: number }[];
  ballonDor: { wins: number; podiums: number; top10: number; best: number | null; years: { season: number; age: number; rank: number }[] };
  tournaments: TournamentResult[];
  clubs: { name: string; from: number; to: number }[];
  headline: string[];
}

interface ClubRef { leagueId: string; rank: number }
interface Candidate { ref: ClubRef; level: number }
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

/** Every club a career can start at or transfer to, as `{ name, league, level }`. */
export function careerClubs(): { name: string; leagueId: string; league: string; level: number }[] {
  return CANDIDATES.map((c) => ({ name: clubName(c.ref), leagueId: c.ref.leagueId, league: leagueName(c.ref.leagueId), level: Math.round(c.level) }));
}

function stubClub(level: number): Club {
  const f = clamp(35 + (level - 45) * 1.4, 35, 95);
  return { facilities: { training: f, youth: f, medical: f, scouting: f, coaching: f } } as unknown as Club;
}

function pickWeighted<T>(rng: Rng, items: T[], w: (t: T) => number): T {
  return items[rng.weightedIndex(items.map(w))] as T;
}

const CANDIDATES: Candidate[] = (() => {
  const out: Candidate[] = [];
  for (const l of MAJOR) for (let r = 0; r < l.names.length; r++) out.push({ ref: { leagueId: l.id, rank: r }, level: clubLevel(l.id, r, l.names.length) });
  return out;
})();

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
  return {
    goalsFor: gf, goalsAgainst: ga, won: res.winner === side, draw: res.winner === 'draw', minutes: line?.minutes ?? 0, goals: line?.goals ?? 0, assists: line?.assists ?? 0,
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
  const others = size - 1;
  const remaining = others * 2 * 3 - ownPoints; // points the hero's club did not win are shared out by strength
  const w = lv.map((l, i) => (i === ownRank ? 0 : Math.exp(0.05 * (l - (lv[ownRank] as number)))));
  const sumW = w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < size; i++) if (i !== ownRank) { pts[i] = (pts[i] as number) + (remaining * (w[i] as number)) / sumW; gd[i] = (gd[i] as number) - ownGd / others; }
  const rows = pts.map((p, i) => ({ i, p: i === ownRank ? ownPoints : p, g: i === ownRank ? ownGd : (gd[i] as number) }));
  rows.sort((a, b) => b.p - a.p || b.g - a.g || a.i - b.i);
  return rows.findIndex((r) => r.i === ownRank) + 1;
}

const CONTINENTAL: Record<string, { slots: { comp: string; upTo: number }[] }> = {
  UEFA_BIG: { slots: [{ comp: 'UCL', upTo: 4 }, { comp: 'UEL', upTo: 5 }, { comp: 'UECL', upTo: 6 }] },
  UEFA_MID: { slots: [{ comp: 'UCL', upTo: 2 }, { comp: 'UEL', upTo: 3 }, { comp: 'UECL', upTo: 4 }] },
  AFC: { slots: [{ comp: 'ACLE', upTo: 3 }, { comp: 'ACL2', upTo: 5 }] },
  CONMEBOL: { slots: [{ comp: 'COPA', upTo: 4 }, { comp: 'SUDA', upTo: 8 }] },
  CONCACAF: { slots: [{ comp: 'CCC', upTo: 3 }] },
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
    if (!m.won) return { result: `Out in the ${ROUND_NAMES[ROUND_NAMES.length - oppLevels.length + r] as string}`, won: false, matches };
  }
  return { result: 'Winner', won: true, matches };
}

const isGk = (p: Position): boolean => p === 'GK';
const isDefender = (p: Position): boolean => p === 'GK' || p === 'CB' || p === 'LB' || p === 'RB';

/** The Ballon d'Or style score: ability, output for the position, team success, form and fitness. */
function awardScore(rng: Rng, pos: Position, ovr: number, goals: number, assists: number, cleanSheets: number, avgRating: number, injuryDays: number, teamBonus: number): number {
  const output = isGk(pos) ? cleanSheets * 0.28 : pos === 'CB' || pos === 'LB' || pos === 'RB' ? goals * 0.5 + assists * 0.3 + cleanSheets * 0.06 : pos === 'ST' ? goals * 0.2 + assists * 0.25 : goals * 0.3 + assists * 0.3;
  return ovr + Math.min(4, output * 0.5) + (avgRating > 0 ? (avgRating - 6.8) * 2 : 0) + teamBonus * 0.8 - (injuryDays / 30) * 1.2 + rng.normal(0, 1.4);
}

/** A transfer window decision: the caller picks an offer id (or `stay`). */
export interface TransferWindow { season: number; age: number; club: string; contractYearsLeft: number; ovr: number; offers: TransferOffer[] }

/** Stepwise career simulation; `simulateCareer` drives it to the end with automatic transfer choices. */
export class CareerSim {
  readonly input: CareerInput;
  private rng: Rng;
  private hero: Player;
  private nation: Nation;
  private potential: number;
  private startOvr: number;
  private club: Candidate;
  private contractLeft: number;
  private loanFrom: Candidate | null = null;
  private loanYears = 0;
  private s = 0;
  private age: number;
  private day = 0;
  private lastStartProb = 0.5;
  private leftAt = new Map<string, number>();
  private seasons: CareerSeason[] = [];
  private honours = new Map<string, number>();
  private awards = new Map<string, number>();
  private clubsLog: { name: string; from: number; to: number }[] = [];
  private tournaments: TournamentResult[] = [];
  private ballon: { season: number; age: number; rank: number }[] = [];
  private caps = 0; private intGoals = 0; private fees = 0;
  private peak: { ovr: number; age: number; season: number };
  private transferIn: CareerSeason['transferIn'] = null;
  private note: string | null = null;
  private window: TransferWindow | null = null;
  private done = false;
  private lastRetiredAge = 0;

  constructor(input: CareerInput) {
    this.input = input;
    const rng = Rng.fromSeed(`career:${input.seed}:${input.name}:${input.position}:${input.nationality ?? ''}`);
    this.rng = rng;
    const startAge = clamp(Math.round(input.startAge ?? 16), 15, 19);
    const talent = input.talent ?? 'fate';
    this.nation = (input.nationality && NATION_BY_CODE[input.nationality]) || (rng.pick(NATIONS.slice(0, 24)) as Nation);
    // `adult` is the hidden adult level, drawn like the club game's academy intake (league-relative, occasional wonderkids)
    let adult = rng.normal(66, 9);
    if (rng.chance(0.02)) adult += rng.float(7, 14);
    this.potential = clamp(talent === 'wonderkid' ? rng.normal(88, 4) : talent === 'prospect' ? rng.normal(77, 5) : talent === 'journeyman' ? rng.normal(58, 5) : adult, 40, 96);
    const ability0 = clamp(this.potential * (0.55 + 0.07 * (startAge + 0.4 - 15.5)) + rng.normal(0, 2.5), 20, this.potential);
    const birthDay = -Math.round(startAge * 365.25 + rng.float(0, 300));
    this.hero = generatePlayer(rng, { id: 'p1', name: input.name, nationality: this.nation.code, age: ageOf({ birthDay }, 0), day: 0, position: input.position, ability: ability0, potential: this.potential });
    this.hero.birthDay = birthDay;
    this.hero.pot = this.potential;
    this.startOvr = overall(this.hero);
    this.age = startAge;
    this.peak = { ovr: this.startOvr, age: startAge, season: 1 };
    // first club: an explicit choice, else the larger the ceiling the bigger the club that signs him
    const named = input.startClub ? CANDIDATES.find((c) => clubName(c.ref) === input.startClub) : undefined;
    const homeId = input.homeLeague && MAJOR.some((l) => l.id === input.homeLeague) ? input.homeLeague : this.nation.league ?? (rng.pick(['ENG1', 'ESP1', 'ITA1', 'GER1', 'FRA1', 'POR1', 'NED1', 'BRA1', 'SAU1', 'USA1']) as string);
    const homeCands = CANDIDATES.filter((c) => c.ref.leagueId === homeId);
    const target0 = this.potential * 0.92 - 8;
    this.club = named ?? pickWeighted(rng, homeCands, (c) => Math.exp(-(((c.level - target0) / 7) ** 2)) + 0.02);
    this.contractLeft = rng.int(3) + 2;
  }

  get finished(): boolean { return this.done; }
  /** The pending transfer decision, if the player has to choose before the next season. */
  get pendingWindow(): TransferWindow | null { return this.window; }
  get seasonsPlayed(): number { return this.seasons.length; }

  private keyOf(c: Candidate): string { return `${c.ref.leagueId}:${c.ref.rank}`; }

  private addHonour(map: Map<string, number>, name: string): void { map.set(name, (map.get(name) ?? 0) + 1); }

  /** Plays the next season (development, league, cup, continental, national team, awards) and returns it. */
  playSeason(): CareerSeason {
    if (this.done) throw new Error('career is over');
    if (this.window) throw new Error('answer the pending transfer window first');
    const rng = this.rng; const hero = this.hero; const club = this.club;
    this.s++;
    const s = this.s;
    const age = this.age;
    this.lastRetiredAge = age;

    // ---- weekly development through the season
    const stub = stubClub(club.level);
    hero.workload = 6 * clamp(this.lastStartProb, 0.1, 1); // workload feeds development for youngsters, as match minutes do in the club game
    for (let w = 0; w < 52; w++) developPlayerWeek(hero, this.day + w * 7, stub, rng);
    this.day += 364;
    const ovr = Math.round(overall(hero));
    if (ovr > this.peak.ovr) this.peak = { ovr, age, season: s };

    // ---- playing time
    const gap = ovr - club.level;
    let startProb = clamp(0.55 + gap / 11, 0.03, 0.96);
    if (age < 18) startProb = Math.min(startProb, 0.12) * (age < 17 ? 0.5 : 1);
    this.lastStartProb = startProb;
    const ref = club.ref;
    const size = leagueSize(ref.leagueId);
    const lvls = Array.from({ length: size }, (_, r) => clubLevel(ref.leagueId, r, size));
    const ownRank = Math.min(ref.rank, size - 1);

    // ---- league season: every match is a full engine match
    let apps = 0; let starts = 0; let minutes = 0; let goals = 0; let assists = 0; let cleanSheets = 0; let ratingSum = 0; let ratedApps = 0;
    let leagueGoals = 0; let points = 0; let gd = 0; let unavailable = 0; let injuryDays = 0;
    const count = (m: MatchOutcome, league: boolean): void => {
      if (m.minutes <= 0) return;
      apps++; if (m.started) starts++; minutes += m.minutes; goals += m.goals; assists += m.assists; if (league) leagueGoals += m.goals;
      if (m.cleanSheet && isDefender(hero.primary)) cleanSheets++;
      if (m.rating > 0) { ratingSum += m.rating; ratedApps++; }
    };
    const order: number[] = [];
    for (let j = 0; j < size; j++) if (j !== ownRank) { order.push(j); order.push(-j - 1); }
    for (let m = 0; m < order.length; m++) {
      const o = order[m] as number;
      const opp = lvls[o >= 0 ? o : -o - 1] as number;
      const available = unavailable <= 0; // an injured player is not selected, but the match is still played so team results keep the same scale
      const r = playMatch(rng, hero, this.day, club.level, opp, o >= 0, available ? startProb : 0, `s${s}m${m}`, false);
      points += r.won ? 3 : r.draw ? 1 : 0;
      gd += r.goalsFor - r.goalsAgainst;
      if (!available) { unavailable -= 7; continue; }
      count(r, true);
      if (r.injury > 0) { unavailable = r.injury; injuryDays += r.injury; }
    }
    const pos = tableRank(rng, ref.leagueId, size, ownRank, points, gd);
    const honoursNow: string[] = []; const awardsNow: string[] = [];
    const lname = leagueName(ref.leagueId);
    let teamBonus = 0;
    if (pos === 1) { honoursNow.push(lname); teamBonus += 2.5; }

    // ---- domestic cup (single legs)
    const cupId = `${ref.leagueId.slice(0, 3)}-CUP`;
    const cupName = REAL_COMPETITION_NAMES[cupId]?.name ?? 'Domestic cup';
    const cupRounds = clamp(Math.round(Math.log2(size)) + 1, 4, 6);
    const cupOpp = Array.from({ length: cupRounds }, (_, i) => clamp((lvls[rng.int(size)] as number) + i * 0.8, 40, 90));
    const cup = knockoutRun(rng, hero, this.day, club.level, startProb * 0.8, cupOpp.map((l, i) => (i < cupRounds - 2 ? l - 2 : l)), `s${s}c`);
    for (const m of cup.matches) count(m, false);
    if (cup.won) { honoursNow.push(cupName); teamBonus += 1; }

    // ---- continental club competition
    let continental: CareerSeason['continental'] = null;
    const cc = continentalFor(ref.leagueId, pos);
    if (cc) {
      const lvl = COMP_LEVEL[cc] as number;
      const stage: MatchOutcome[] = [];
      let pts = 0;
      const games = cc === 'UCL' || cc === 'UEL' || cc === 'UECL' ? 8 : 6;
      for (let g = 0; g < games; g++) { const m = playMatch(rng, hero, this.day, club.level, clamp(rng.normal(lvl, 4), 45, 90), g % 2 === 0, startProb, `s${s}e${g}`, false); stage.push(m); pts += m.won ? 3 : m.draw ? 1 : 0; }
      let result: string; let won = false;
      if (pts < (games === 8 ? 7 : 5)) result = 'Out in the league phase';
      else {
        const run = knockoutRun(rng, hero, this.day, club.level, startProb, [lvl, lvl + 2, lvl + 4, lvl + 5], `s${s}x`);
        stage.push(...run.matches); result = run.won ? 'Winner' : run.result.replace('Round of 32', 'Round of 16'); won = run.won;
      }
      for (const m of stage) count(m, false);
      continental = { competition: REAL_COMPETITION_NAMES[cc]?.name ?? cc, result };
      if (won) { honoursNow.push(continental.competition); teamBonus += cc === 'UCL' ? 6 : cc === 'UEL' || cc === 'COPA' || cc === 'ACLE' ? 3 : 1.5; }
      else if (result.includes('Final')) teamBonus += 1.5;
    }
    const avgClub = ratedApps > 0 ? ratingSum / ratedApps : 0;

    // ---- national team: tournaments every second season (World Cup in seasons 4, 8, 12 ...)
    const tournament = this.playTournament(s, age, ovr, rng);
    let tGoals = 0;
    if (tournament) {
      tGoals = tournament.goals;
      if (tournament.won) { honoursNow.push(tournament.name); teamBonus += tournament.name === WORLD_CUP ? 8 : 3; }
      else if (tournament.result.includes('Final') || tournament.result.includes('Semi')) teamBonus += tournament.name === WORLD_CUP ? 2 : 0.8;
      for (const a of tournament.awards) { awardsNow.push(a); }
    }
    const avgRating = Math.round(avgClub * 100) / 100;

    // ---- individual awards: compare the season with simulated rivals
    const teamOfYear = avgRating >= 7.15 && apps >= 25;
    const scorerRival = Math.round(rng.normal(19 + (lvls[0] as number - 70) * 0.3, 3.2));
    if (!isGk(hero.primary) && leagueGoals > scorerRival && starts >= 22) awardsNow.push(`${lname} Golden Boot`);
    if (avgRating >= 7.4 + rng.normal(0, 0.12) && apps >= 28 && pos <= Math.ceil(size / 2)) awardsNow.push(`${lname} Player of the Season`);
    if (age <= 21 && apps >= 18 && avgRating >= 6.95 + rng.normal(0, 0.1)) awardsNow.push(`${lname} Young Player of the Season`);
    if (isGk(hero.primary) && cleanSheets >= Math.round(size * 0.36) && apps >= 28) awardsNow.push('Golden Glove');
    if (teamOfYear && avgRating >= 7.3) awardsNow.push(`${lname} Team of the Season`);
    const score = awardScore(rng, hero.primary, ovr, goals + tGoals, assists, cleanSheets, avgRating, injuryDays, teamBonus);
    let ballonDor: CareerSeason['ballonDor'] = null;
    if (age >= 18 && ovr >= 70) {
      let rank = 1;
      for (let i = 0; i < 30; i++) {
        const rivalBase = 93 - i * 0.62 + rng.normal(0, 2.6) + (i < 6 && rng.chance(0.16) ? 5 : 0) + (tournament?.won && i < 4 && rng.chance(0.5) ? 5 : 0);
        if (rivalBase > score) rank++;
      }
      ballonDor = { rank: rank <= 30 ? rank : null };
      if (rank === 1) awardsNow.push(BALLON_DOR);
      else if (rank <= 3) awardsNow.push(`${BALLON_DOR} podium`);
      if (rank <= 30) this.ballon.push({ season: s, age, rank });
    }
    for (const h of honoursNow) this.addHonour(this.honours, h);
    for (const a of awardsNow) this.addHonour(this.awards, a);

    const entry: CareerSeason = {
      season: s, age, ovr, club: clubName(ref), leagueId: ref.leagueId, league: lname, onLoan: this.loanFrom !== null,
      apps, starts, minutes, goals, assists, cleanSheets, avgRating, injuryDays, leaguePos: pos, leagueSize: size,
      cup: cupName, cupResult: cup.result, continental, tournament, honours: honoursNow, awards: awardsNow, ballonDor, transferIn: this.transferIn, note: this.note,
    };
    this.seasons.push(entry);
    const last = this.clubsLog[this.clubsLog.length - 1];
    if (last && last.name === entry.club) last.to = s; else this.clubsLog.push({ name: entry.club, from: s, to: s });
    this.transferIn = null; this.note = null;
    this.endOfSeason(ovr);
    return entry;
  }

  /** Called-up players play the tournament with their national team: groups, then knockouts, all full matches. */
  private playTournament(s: number, age: number, ovr: number, rng: Rng): TournamentResult | null {
    const wc = s % 4 === 0; const cont = s % 4 === 2;
    if (!wc && !cont) return null;
    const level = this.nation.level;
    if (age < 18 || ovr < level - 8 + rng.normal(0, 1.5)) return null;
    const gap = ovr - level;
    const startProb = clamp(0.55 + gap / 10, 0.1, 0.96);
    const name = wc ? WORLD_CUP : CONTINENTAL_CUP[this.nation.confed];
    // qualification (World Cup only): strong nations nearly always qualify, weak ones often do not
    if (wc && !rng.chance(clamp(0.35 + (level - 66) / 20, 0.05, 0.99))) return null;
    // opponents: one group opponent from each of three strength bands of the field, then knockouts of rising absolute strength
    const field = NATIONS.filter((n) => n.code !== this.nation.code && (wc || n.confed === this.nation.confed)).sort((a, b) => b.level - a.level);
    const band = (from: number, to: number): number => {
      const slice = field.slice(Math.floor(field.length * from), Math.max(Math.floor(field.length * from) + 1, Math.floor(field.length * to)));
      return (slice[rng.int(slice.length)] as Nation).level;
    };
    const groupOpp = [band(0, 0.3), band(0.3, 0.65), band(0.65, 1)];
    const played: MatchOutcome[] = [];
    let pts = 0;
    groupOpp.forEach((l, i) => { const m = playMatch(rng, this.hero, this.day, level, l, false, startProb, `wc${s}g${i}`, false); played.push(m); pts += m.won ? 3 : m.draw ? 1 : 0; });
    let result: string; let won = false;
    const advance = pts >= 4 || (pts === 3 && rng.chance(0.5));
    if (!advance) result = 'Out in the group stage';
    else {
      const strong = wc || this.nation.confed === 'UEFA' || this.nation.confed === 'CONMEBOL';
      const rounds = wc ? [69, 74, 78, 81, 83] : strong ? [72, 76, 80, 83] : [64, 68, 72, 75];
      const run = knockoutRun(rng, this.hero, this.day, level, startProb, rounds, `wc${s}k`);
      played.push(...run.matches); result = run.won ? 'Winner' : run.result; won = run.won;
    }
    const goals = played.reduce((a, m) => a + m.goals, 0); const assists = played.reduce((a, m) => a + m.assists, 0);
    const matches = played.filter((m) => m.minutes > 0).length;
    const awards: string[] = [];
    const rated = played.filter((m) => m.rating > 0);
    const avg = rated.length ? rated.reduce((a, m) => a + m.rating, 0) / rated.length : 0;
    const label = wc ? 'World Cup' : name;
    if (!isGk(this.hero.primary) && goals >= (wc ? 5 : 4)) awards.push(`${label} Golden Boot`);
    if (won && avg >= 7.4 && matches >= 4) awards.push(wc ? 'World Cup Golden Ball' : `${label} Player of the Tournament`);
    if (age <= 21 && matches >= 3 && avg >= 6.9) awards.push(`${label} Best Young Player`);
    if (isGk(this.hero.primary) && won && played.filter((m) => m.cleanSheet).length >= 3) awards.push(wc ? 'World Cup Golden Glove' : `${label} Best Goalkeeper`);
    this.caps += matches + Math.round(clamp((ovr - (level - 8)) * 0.8, 0, 8)); // tournament matches plus a model of qualifiers and friendlies
    this.intGoals += goals;
    const t: TournamentResult = { name, nation: this.nation.name, result, won, matches, goals, assists, awards };
    this.tournaments.push(t);
    return t;
  }

  private buildOffers(ovrNow: number): TransferOffer[] {
    const rng = this.rng; const hero = this.hero; const s = this.s;
    const eligible = CANDIDATES.filter((c) => this.keyOf(c) !== this.keyOf(this.club) && s - (this.leftAt.get(this.keyOf(c)) ?? -99) > 3);
    const taken = new Set<string>();
    const make = (kind: TransferOffer['kind'], target: number, spread: number, sameLeague?: boolean): void => {
      const pool = eligible.filter((c) => !taken.has(this.keyOf(c)) && (sameLeague === undefined || (c.ref.leagueId === this.club.ref.leagueId) === sameLeague));
      if (pool.length === 0) return;
      const c = pickWeighted(rng, pool, (x) => Math.exp(-(((x.level - target) / spread) ** 2)) + 1e-4);
      taken.add(this.keyOf(c));
      const gap = ovrNow - c.level;
      const cont = continentalFor(c.ref.leagueId, Math.max(1, Math.round((c.ref.rank + 1) * 0.8)));
      const fee = Math.round((marketValue({ ...hero, contract: null } as Player, this.day, undefined) * rng.float(0.85, 1.35)) / 1e5) * 1e5;
      this.offerFees.set(`${c.ref.leagueId}:${c.ref.rank}`, fee);
      this.offerList.push({
        id: `${c.ref.leagueId}:${c.ref.rank}`, club: clubName(c.ref), leagueId: c.ref.leagueId, league: leagueName(c.ref.leagueId), level: Math.round(c.level),
        role: gap >= 4 ? 'Key player' : gap >= -2 ? 'Starter' : gap >= -6 ? 'Rotation' : 'Bench',
        continental: cont ? (REAL_COMPETITION_NAMES[cont]?.name ?? null) : null,
        fee, kind,
      });
    };
    this.offerList = [];
    make('good fit', ovrNow + rng.float(-1, 2), 4);
    make('step up', ovrNow + rng.float(4, 8), 4);
    if (ovrNow >= 66) make('dream move', ovrNow + rng.float(8, 14), 5);
    make('new league', ovrNow + rng.float(-2, 5), 6, false);
    return this.offerList;
  }
  private offerList: TransferOffer[] = [];
  private offerFees = new Map<string, number>();

  private endOfSeason(ovr: number): void {
    const rng = this.rng; const hero = this.hero;
    this.age++;
    const pRet = retirementProbability(this.age, ovr, isGk(hero.primary)) + (this.age >= 40 ? 0.5 : 0);
    if ((this.age >= 33 && rng.chance(Math.min(0.98, pRet))) || this.age > 41) { this.done = true; return; }
    this.contractLeft--;
    if (this.loanFrom) {
      this.loanYears--;
      if (this.loanYears <= 0) { this.club = this.loanFrom; this.loanFrom = null; this.note = 'Returned from loan'; }
      return;
    }
    const ovrNow = Math.round(overall(hero));
    if (this.age <= 21 && ovrNow < this.club.level - 6 && rng.chance(0.7)) {
      const loanCands = CANDIDATES.filter((c) => Math.abs(c.level - (ovrNow + 2)) < 6);
      if (loanCands.length > 0) {
        this.loanFrom = this.club; this.loanYears = 1;
        this.club = pickWeighted(rng, loanCands, (c) => Math.exp(-(((c.level - (ovrNow + 2)) / 4) ** 2)));
        this.note = `Loaned out from ${clubName(this.loanFrom.ref)}`;
        return;
      }
    }
    const surplus = ovrNow - this.club.level;
    const wantsOut = this.contractLeft <= 0 || surplus > 7 || surplus < -7 || rng.chance(0.07);
    const manual = this.input.transfers === 'manual';
    if (!wantsOut && !(manual && rng.chance(0.3))) return; // in manual mode extra offers can arrive any summer
    const offers = this.buildOffers(ovrNow);
    if (offers.length === 0) return;
    if (manual) {
      this.window = { season: this.s, age: this.age, club: clubName(this.club.ref), contractYearsLeft: Math.max(0, this.contractLeft), ovr: ovrNow, offers };
      return;
    }
    // automatic: a forced move picks a fit-weighted offer; a voluntary one only happens when it is clearly forced
    if (wantsOut) this.applyOffer(pickWeighted(rng, offers, (o) => (o.kind === 'good fit' ? 3 : o.kind === 'step up' ? 2 : 1)).id);
  }

  /** Answers the pending transfer window: an offer id, or null/'stay' to remain (renewing the contract). */
  decide(choice: string | null): void {
    if (!this.window) return;
    const w = this.window;
    this.window = null;
    if (choice === null || choice === 'stay' || !w.offers.some((o) => o.id === choice)) { if (this.contractLeft <= 0) this.contractLeft = this.rng.int(3) + 2; return; }
    this.applyOffer(choice);
  }

  private applyOffer(id: string): void {
    const c = CANDIDATES.find((x) => `${x.ref.leagueId}:${x.ref.rank}` === id);
    if (!c) return;
    const fee = this.offerFees.get(id) ?? 0;
    this.leftAt.set(this.keyOf(this.club), this.s);
    this.transferIn = { from: clubName(this.club.ref), fee };
    this.fees += fee;
    this.club = c;
    this.contractLeft = this.rng.int(4) + 2;
  }

  result(): CareerResult {
    const toArr = (m: Map<string, number>): { name: string; count: number }[] => [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    const seasons = this.seasons;
    const sum = (f: (s: CareerSeason) => number): number => seasons.reduce((a, s) => a + f(s), 0);
    const totals = { seasons: seasons.length, apps: sum((x) => x.apps), goals: sum((x) => x.goals), assists: sum((x) => x.assists), cleanSheets: sum((x) => x.cleanSheets), caps: this.caps, internationalGoals: this.intGoals, fees: this.fees };
    const wins = this.ballon.filter((b) => b.rank === 1).length;
    const ballonDor = { wins, podiums: this.ballon.filter((b) => b.rank <= 3).length, top10: this.ballon.filter((b) => b.rank <= 10).length, best: this.ballon.length ? Math.min(...this.ballon.map((b) => b.rank)) : null, years: [...this.ballon] };
    const honours = toArr(this.honours);
    const headline: string[] = [];
    const trophies = honours.reduce((a, h) => a + h.count, 0);
    if (wins > 0) headline.push(`${wins}× ${BALLON_DOR}`);
    if (trophies > 0) headline.push(`${trophies} team trophies`);
    headline.push(`${totals.apps} apps · ${totals.goals} goals · ${totals.assists} assists`);
    headline.push(`Peak ${this.peak.ovr} at ${this.peak.age}`);
    return {
      input: this.input, nation: { code: this.nation.code, name: this.nation.name }, potential: Math.round(this.potential), startOvr: Math.round(this.startOvr), seasons, totals,
      peak: this.peak, retiredAge: this.lastRetiredAge, honours, awards: toArr(this.awards), ballonDor, tournaments: this.tournaments, clubs: this.clubsLog, headline,
    };
  }
}

/** Runs a whole career. With `transfers: 'manual'` the optional `choose` callback answers each window (default: stay). */
export function simulateCareer(input: CareerInput, onSeason?: (s: CareerSeason) => void, choose?: (w: TransferWindow) => string | null): CareerResult {
  const sim = new CareerSim(input);
  for (let guard = 0; guard < 30 && !sim.finished; guard++) {
    const s = sim.playSeason();
    onSeason?.(s);
    const w = sim.pendingWindow;
    if (w) sim.decide(choose ? choose(w) : null);
  }
  return sim.result();
}
