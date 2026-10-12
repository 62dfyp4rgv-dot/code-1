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
import { generatePlayer, overall, ageOf, POSITION_WEIGHTS } from './players';
import { Rng } from './rng';
import { defaultRoleFor, defaultTactics, ROLES } from './tactics';
import { DEFAULT_CONDITIONS, syntheticMatch, syntheticSheet, toMatchPlayer } from './synth';
import { attrGroup, ATTR_KEYS, type Club, type Player, type Position } from './types';
import { COMPETITIONS, LEAGUE_BY_ID } from './competition/registry';
import { REAL_CLUB_NAMES } from './data/realClubNames';
import { REAL_COMPETITION_NAMES } from './data/realCompetitionNames';
import { developPlayerWeek, growthRate, retirementProbability } from './world/development';
import { baseWageWeekly, marketValue } from './world/valuation';

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
  /** Who decides: 'auto' (default) answers every decision with a sensible default, 'manual' asks the caller. */
  transfers?: 'auto' | 'manual';
}

export interface TournamentResult { name: string; nation: string; result: string; won: boolean; matches: number; goals: number; assists: number; awards: string[] }

/** One game of the career, from the player's point of view. */
export interface MatchLog {
  /** Running number within the season. */
  n: number;
  comp: string;
  round: string;
  opp: string;
  home: boolean;
  /** Final score from the player's team's side. */
  gf: number;
  ga: number;
  /** Penalty shoot-out score (own - opp) if the game went to penalties. */
  pens: string | null;
  result: 'W' | 'D' | 'L';
  /** 'start' | 'sub' | 'unused' | 'injured' */
  status: 'start' | 'sub' | 'unused' | 'injured';
  minutes: number;
  goals: number;
  assists: number;
  goalMinutes: number[];
  rating: number;
  yellow: number;
  red: number;
  /** e.g. "Hamstring strain, out ~28 days" when injured in this game. */
  injury: string | null;
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
  /** Weekly wage (EUR) and the season's earnings. */
  wageWeekly: number;
  earnings: number;
  /** The tactical role and training focus chosen for the season. */
  role: string;
  focus: string;
  /** Plain-language record of the decisions made around this season. */
  choices: string[];
  /** Every game of the season in order (league, cup, continental, national team). */
  matchLog: MatchLog[];
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
  /** Estimated weekly wage at the new club. */
  wageWeekly: number;
  kind: 'step up' | 'good fit' | 'dream move' | 'new league' | 'free transfer';
}

export interface DecisionOption { id: string; label: string; detail: string; offer?: TransferOffer }
export type DecisionKind = 'training' | 'role' | 'duties' | 'captain' | 'injury' | 'playing-time' | 'media' | 'contract' | 'transfer';
export interface Decision { id: string; kind: DecisionKind; season: number; age: number; title: string; text: string; options: DecisionOption[] }

export type CareerStep =
  | { kind: 'decision'; decision: Decision }
  | { kind: 'matches'; label: string; matches: MatchLog[] }
  | { kind: 'season'; season: CareerSeason }
  | { kind: 'done'; result: CareerResult };

export interface CareerResult {
  input: CareerInput;
  nation: { code: string; name: string };
  /** Hidden ceiling the player was generated with (for the reveal). */
  potential: number;
  startOvr: number;
  seasons: CareerSeason[];
  totals: { seasons: number; apps: number; goals: number; assists: number; cleanSheets: number; caps: number; internationalGoals: number; fees: number; earnings: number };
  peak: { ovr: number; age: number; season: number };
  retiredAge: number;
  /** Team honours with counts. */
  honours: { name: string; count: number }[];
  /** Personal awards with counts (includes Ballon d'Or wins and podiums). */
  awards: { name: string; count: number }[];
  ballonDor: { wins: number; podiums: number; top10: number; best: number | null; years: { season: number; age: number; rank: number }[] };
  tournaments: TournamentResult[];
  clubs: { name: string; from: number; to: number }[];
  /** Game-to-game highlights derived from the match logs. */
  highlights: string[];
  /** Every decision the player took, in order. */
  decisions: { season: number; age: number; title: string; choice: string }[];
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

/** The club whose level is closest to `level` (with some variety among the nearest few). */
function clubNear(rng: Rng, level: number, exclude?: string): Candidate {
  const sorted = CANDIDATES.filter((c) => `${c.ref.leagueId}:${c.ref.rank}` !== exclude).sort((a, b) => Math.abs(a.level - level) - Math.abs(b.level - level));
  return sorted[rng.int(Math.min(4, sorted.length))] as Candidate;
}

function sheetWithHero(level: number, hero: Player, day: number, asStarter: boolean, tag: string, side: string, role: string | null): ReturnType<typeof syntheticSheet> {
  const formation = hero.primary === 'AM' ? '4-2-3-1' : '4-3-3';
  const tactics = defaultTactics(formation);
  const sheet = syntheticSheet({ id: side, quality: level, seed: tag, tactics, spread: 4 });
  const mp = { ...toMatchPlayer(hero, day), id: 'HERO', name: hero.name };
  const slot = sheet.players.slice(0, 11).findIndex((p) => p.primary === hero.primary);
  if (asStarter && slot >= 0) {
    sheet.players[slot] = mp;
    if (role && ROLES[role]?.positions.includes(hero.primary)) tactics.roles[slot] = role;
  } else {
    const benchIdx = sheet.players.findIndex((p, i) => i >= 11 && p.primary === hero.primary);
    if (benchIdx >= 0) sheet.players[benchIdx] = mp;
    else sheet.players[sheet.players.length - 1] = mp;
  }
  return sheet;
}

interface MatchOutcome {
  goalsFor: number; goalsAgainst: number; won: boolean; draw: boolean; minutes: number; goals: number; assists: number; rating: number; started: boolean; cleanSheet: boolean;
  injury: number; injuryLabel: string | null; goalMinutes: number[]; yellow: number; red: number; pens: string | null; home: boolean;
}

const INJURY_LABEL = { 1: ['Minor knock', 9], 2: ['Muscle strain', 28], 3: ['Serious injury', 85], 4: ['Season-ending injury', 230] } as const;

function playMatch(rng: Rng, hero: Player, day: number, ownLevel: number, oppLevel: number, home: boolean, startProb: number, tag: string, knockout: boolean, role: string | null, neutral = false): MatchOutcome {
  const starter = rng.chance(startProb);
  const mine = sheetWithHero(ownLevel, hero, day, starter, `${tag}o`, 'OWN', role);
  const theirs = syntheticSheet({ id: 'OPP', quality: oppLevel, seed: `${tag}p`, tactics: defaultTactics('4-3-3'), spread: 4 });
  const input: MatchInput = syntheticMatch(`${tag}`, `career:${tag}`, home ? mine : theirs, home ? theirs : mine, { ...(knockout ? { rules: { mustHaveWinner: true, extraTime: true, maxSubsRegular: 5 } } : {}), ...(neutral ? { conditions: { ...DEFAULT_CONDITIONS, neutral: true } } : {}) });
  const res = simulateMatch(input);
  const side = home ? 'home' : 'away';
  const gf = home ? res.score.home : res.score.away;
  const ga = home ? res.score.away : res.score.home;
  const line = res.players.find((p) => p.playerId === 'HERO');
  const inj = res.injuries.find((i) => i.playerId === 'HERO');
  const goalMinutes = res.events.filter((e) => e.type === 'goal' && (e as { scorerId: string }).scorerId === 'HERO').map((e) => e.minute);
  const pens = res.penalties ? (home ? `${res.penalties.home}-${res.penalties.away}` : `${res.penalties.away}-${res.penalties.home}`) : null;
  return {
    goalsFor: gf, goalsAgainst: ga, won: res.winner === side, draw: res.winner === 'draw', minutes: line?.minutes ?? 0, goals: line?.goals ?? 0, assists: line?.assists ?? 0,
    rating: line && line.minutes > 0 ? line.rating : 0, started: line?.started ?? false, cleanSheet: ga === 0 && (line?.minutes ?? 0) >= 60, injury: inj ? INJURY_LABEL[inj.severity][1] : 0,
    injuryLabel: inj ? `${INJURY_LABEL[inj.severity][0]}, out ~${INJURY_LABEL[inj.severity][1]} days` : null, goalMinutes, yellow: line?.yellow ?? 0, red: line?.red ?? 0, pens, home,
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

const ROUND_NAMES = ['Round of 64', 'Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Final'];
const roundName = (total: number, i: number): string => ROUND_NAMES[ROUND_NAMES.length - total + i] ?? `Round ${i + 1}`;

const isGk = (p: Position): boolean => p === 'GK';
const isDefender = (p: Position): boolean => p === 'GK' || p === 'CB' || p === 'LB' || p === 'RB';

/** The Ballon d'Or style score: ability, output for the position, team success, form and fitness. */
function awardScore(rng: Rng, pos: Position, ovr: number, goals: number, assists: number, cleanSheets: number, avgRating: number, injuryDays: number, teamBonus: number, image: number): number {
  const output = isGk(pos) ? cleanSheets * 0.28 : pos === 'CB' || pos === 'LB' || pos === 'RB' ? goals * 0.5 + assists * 0.3 + cleanSheets * 0.06 : pos === 'ST' ? goals * 0.2 + assists * 0.25 : goals * 0.3 + assists * 0.3;
  return ovr + Math.min(4, output * 0.5) + (avgRating > 0 ? (avgRating - 6.8) * 2 : 0) + teamBonus * 0.8 - (injuryDays / 30) * 1.2 + (image - 50) / 25 + rng.normal(0, 1.4);
}

const TRAINING: { id: string; label: string; detail: string }[] = [
  { id: 'balanced', label: 'Balanced', detail: 'No extra emphasis. The safe default.' },
  { id: 'physical', label: 'Physical', detail: 'Faster, stronger, fitter. Slightly higher injury risk.' },
  { id: 'technical', label: 'Technical', detail: 'Touch, passing, finishing and set pieces.' },
  { id: 'mental', label: 'Mental', detail: 'Vision, decisions, composure. Helps older players most.' },
  { id: 'position', label: 'Position specialist', detail: 'Extra work on the attributes your position relies on most.' },
];

/** Stepwise career simulation; `simulateCareer` drives it to the end, answering every decision with a default. */
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
  private caps = 0; private intGoals = 0; private fees = 0; private earningsTotal = 0;
  private peak: { ovr: number; age: number; season: number };
  private transferIn: CareerSeason['transferIn'] = null;
  private note: string | null = null;
  private done = false;
  private lastRetiredAge = 0;
  // staged season state
  private phase: 'pre' | 'dev' | 'mid' | 'h2' = 'pre';
  private queue: Decision[] = [];
  private outbox: CareerStep[] = [];
  private pending: Decision | null = null;
  private handlers = new Map<string, (optionId: string) => void>();
  private decisionsLog: CareerResult['decisions'] = [];
  private choicesNow: string[] = [];
  private focus = 'balanced';
  private role: string | null = null;
  private roleClub = '';
  private dutiesClub = '';
  private captainClub = '';
  private image = 50;
  private wageMult = 1;
  private requestedMove = false;
  private freeAgentNext = false;
  private offerFees = new Map<string, number>();
  /** Makes every match's random stream unique to this career (same tags would otherwise replay the same games). */
  private sid: string;
  private cur: {
    ref: ClubRef; size: number; lvls: number[]; ownRank: number; ovr: number; startProb: number; points: number; gd: number; unavailable: number; injuryDays: number;
    apps: number; starts: number; minutes: number; goals: number; assists: number; cleanSheets: number; ratingSum: number; ratedApps: number; leagueGoals: number;
    fixtures: { j: number; home: boolean }[]; played: number; logs: MatchLog[]; teamBonus: number; honoursNow: string[]; awardsNow: string[]; wage: number; captain: boolean;
  } | null = null;

  constructor(input: CareerInput) {
    this.input = input;
    this.sid = `${input.seed}:${input.name}:${input.position}:${input.nationality ?? ''}:${input.startAge ?? ''}:${input.talent ?? ''}`;
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

  get finished(): boolean { return this.done && !this.pending && this.outbox.length === 0; }
  get seasonsPlayed(): number { return this.seasons.length; }
  /** Switches to automatic answers for every later decision (the pending one is answered with `decide(null)`). */
  autopilot(): void { (this.input as { transfers?: string }).transfers = 'auto'; }
  /** The decision waiting for an answer, if any. */
  get pendingDecision(): Decision | null { return this.pending; }

  private manual(): boolean { return this.input.transfers === 'manual'; }
  private keyOf(c: Candidate): string { return `${c.ref.leagueId}:${c.ref.rank}`; }
  private bump(map: Map<string, number>, name: string): void { map.set(name, (map.get(name) ?? 0) + 1); }

  /** Asks the player (manual) or applies `auto` (automatic). The handler gets the chosen option id. */
  private ask(d: Omit<Decision, 'id' | 'season' | 'age'>, auto: string, apply: (optionId: string) => void): void {
    if (!this.manual()) { apply(auto); return; }
    const dec: Decision = { ...d, id: `d${this.decisionsLog.length + this.queue.length + 1}:${this.s}`, season: this.s, age: this.age };
    this.handlers.set(dec.id, (optId) => {
      const opt = dec.options.find((o) => o.id === optId) ?? dec.options.find((o) => o.id === auto) ?? (dec.options[0] as DecisionOption);
      this.decisionsLog.push({ season: dec.season, age: dec.age, title: dec.title, choice: opt.label });
      this.choicesNow.push(`${dec.title}: ${opt.label}`);
      apply(opt.id);
    });
    this.queue.push(dec);
  }

  /** Advances to the next thing worth showing: matches, a decision, a finished season, or the end. */
  step(): CareerStep {
    for (let guard = 0; guard < 10000; guard++) {
      if (this.pending) return { kind: 'decision', decision: this.pending };
      const out = this.outbox.shift();
      if (out) return out;
      const q = this.queue.shift();
      if (q) { this.pending = q; continue; }
      if (this.done) return { kind: 'done', result: this.result() };
      this.advance();
    }
    throw new Error('career step did not settle');
  }

  /** Answers the pending decision with an option id. Unknown ids fall back to the default. */
  decide(optionId: string | null): void {
    const p = this.pending;
    if (!p) return;
    this.pending = null;
    const h = this.handlers.get(p.id);
    this.handlers.delete(p.id);
    h?.(optionId ?? 'default');
  }

  private advance(): void {
    if (this.phase === 'pre') this.startSeason();
    else if (this.phase === 'dev') this.developAndFirstHalf();
    else if (this.phase === 'mid') this.midSeason();
    else this.secondHalfAndFinish();
  }

  // ------------------------------------------------------------------ season start: decisions that shape the season
  private startSeason(): void {
    this.s++;
    this.choicesNow = [];
    const hero = this.hero; const club = this.club;
    const here = clubName(club.ref);
    const ovr = Math.round(overall(hero));
    // training focus
    this.ask({
      kind: 'training', title: 'Training focus', text: `Age ${this.age}. How do you want to spend this year's training? Rated ${ovr}, ceiling unknown.`,
      options: TRAINING.map((t) => ({ id: t.id, label: t.label, detail: t.detail })),
    }, 'balanced', (id) => { this.focus = id; });
    // role at the club (when joining, and every 4th season)
    const roles = Object.values(ROLES).filter((r) => r.positions.includes(hero.primary));
    if (roles.length > 1 && (this.roleClub !== here || this.s % 4 === 0)) {
      this.ask({
        kind: 'role', title: 'Your role', text: `How does the manager at ${here} use you as a ${hero.primary}?`,
        options: roles.map((r) => ({ id: r.id, label: r.name, detail: `${r.duty === 'attack' ? 'Attacking' : r.duty === 'defend' ? 'Defensive' : 'Balanced'} duty. ${r.shotShare >= 1.4 ? 'Gets plenty of shots.' : r.createShare >= 1.6 ? 'Creates for others.' : r.tackleShare >= 1.3 ? 'Wins the ball back.' : 'Rounded role.'}` })),
      }, defaultRoleFor(hero.primary), (id) => { this.role = id; this.roleClub = here; });
    }
    // set pieces (outfield, when joining a club)
    if (!isGk(hero.primary) && this.dutiesClub !== here) {
      this.ask({
        kind: 'duties', title: 'Set-piece duties', text: `Penalties and free kicks at ${here}: do you put your hand up?`,
        options: [
          { id: 'both', label: 'Both', detail: 'More goals from dead balls, more pressure when you miss.' },
          { id: 'penalties', label: 'Penalties', detail: 'You take them. Goals, and misses, count to you.' },
          { id: 'freekicks', label: 'Free kicks', detail: 'Add a free-kick specialist trait.' },
          { id: 'neither', label: 'Leave them to others', detail: 'Fewer chances but a calmer game.' },
        ],
      }, 'neither', (id) => {
        hero.traits = hero.traits.filter((t) => t !== 'penaltyTaker' && t !== 'setPieceSpecialist');
        if (id === 'both' || id === 'penalties') hero.traits.push('penaltyTaker');
        if (id === 'both' || id === 'freekicks') hero.traits.push('setPieceSpecialist');
        this.dutiesClub = here;
      });
    }
    // captaincy
    if (this.age >= 24 && ovr >= club.level + 1 && this.captainClub !== here && !this.loanFrom) {
      this.ask({
        kind: 'captain', title: 'The armband', text: `${here} want you as captain.`,
        options: [
          { id: 'accept', label: 'Accept the armband', detail: 'More visibility and a leadership boost. The media will judge you harder.' },
          { id: 'decline', label: 'Decline', detail: 'Stay a player first. No change.' },
        ],
      }, 'decline', (id) => { if (id === 'accept') { this.captainClub = here; if (!hero.traits.includes('leader')) hero.traits.push('leader'); this.image = clamp(this.image + 3, 0, 100); } else this.captainClub = `declined:${here}`; });
    }
    this.phase = 'dev';
  }

  private extraGrowth(hero: Player, age: number): void {
    const f = this.focus;
    if (f === 'balanced' || f === 'rest') return;
    const keys = f === 'position' ? ATTR_KEYS.filter((k) => (POSITION_WEIGHTS[hero.primary][k] ?? 0) >= 0.7 * Math.max(...Object.values(POSITION_WEIGHTS[hero.primary]).map((v) => v ?? 0))) : ATTR_KEYS.filter((k) => attrGroup(k) === f);
    for (const k of keys) {
      const group = attrGroup(k);
      const cur = hero.attrs[k];
      const cap = Math.min(99, cur * (hero.pot > cur ? hero.pot / Math.max(1, overall(hero)) : 1));
      const delta = Math.max(0, cap - cur) * growthRate(group, age) * hero.devRate * 0.3;
      if (delta > 0) hero.attrs[k] = Math.round(clamp(cur + delta, 1, 99) * 100) / 100;
    }
  }

  private wageNow(ovr: number, club: Candidate): number {
    const value = marketValue({ ...this.hero, contract: null } as Player, this.day, undefined);
    const lp = LEAGUE_BY_ID[club.ref.leagueId];
    const factor = clamp(0.5 + Math.sqrt((lp?.tvPool ?? 3e8) / 1.5e9) * 0.55, 0.5, 1.6) * (club.ref.leagueId === 'SAU1' ? 1.6 : 1);
    const youth = this.age < 18 ? 0.25 : this.age < 21 ? 0.5 : 1; // academy and early-pro contracts pay a fraction of the market wage
    return Math.max(900, Math.round((baseWageWeekly(value, ovr) * factor * this.wageMult * youth) / 100) * 100);
  }

  private developAndFirstHalf(): void {
    const rng = this.rng; const hero = this.hero; const club = this.club;
    const stub = stubClub(club.level);
    hero.workload = 6 * clamp(this.lastStartProb, 0.1, 1); // workload feeds development for youngsters, as match minutes do in the club game
    if (this.focus === 'physical') hero.injuryProneness = clamp(hero.injuryProneness * 1.015, 0.5, 1.9);
    for (let w = 0; w < 52; w++) { developPlayerWeek(hero, this.day + w * 7, stub, rng); if (w % 2 === 0) this.extraGrowth(hero, ageOf(hero, this.day + w * 7)); }
    this.day += 364;
    const ovr = Math.round(overall(hero));
    if (ovr > this.peak.ovr) this.peak = { ovr, age: this.age, season: this.s };
    const gap = ovr - club.level;
    let startProb = clamp(0.55 + gap / 11, 0.03, 0.96);
    if (this.age < 18) startProb = Math.min(startProb, 0.12) * (this.age < 17 ? 0.5 : 1);
    this.lastStartProb = startProb;
    const ref = club.ref;
    const size = leagueSize(ref.leagueId);
    const lvls = Array.from({ length: size }, (_, r) => clubLevel(ref.leagueId, r, size));
    const ownRank = Math.min(ref.rank, size - 1);
    // fixtures: every opponent once in each half, venues reversed in the second half
    const opps: number[] = []; for (let j = 0; j < size; j++) if (j !== ownRank) opps.push(j);
    for (let i = opps.length - 1; i > 0; i--) { const k = rng.int(i + 1); [opps[i], opps[k]] = [opps[k] as number, opps[i] as number]; }
    const first = opps.map((j) => ({ j, home: (j + ownRank) % 2 === 0 }));
    const fixtures = [...first, ...first.map((f) => ({ j: f.j, home: !f.home }))];
    this.cur = {
      ref, size, lvls, ownRank, ovr, startProb, points: 0, gd: 0, unavailable: 0, injuryDays: 0, apps: 0, starts: 0, minutes: 0, goals: 0, assists: 0, cleanSheets: 0, ratingSum: 0,
      ratedApps: 0, leagueGoals: 0, fixtures, played: 0, logs: [], teamBonus: 0, honoursNow: [], awardsNow: [], wage: this.wageNow(ovr, club), captain: this.captainClub === clubName(ref),
    };
    const half = Math.floor(fixtures.length / 2);
    const logs = this.playLeague(half);
    this.outbox.push({ kind: 'matches', label: `${leagueName(ref.leagueId)} · first half of the season`, matches: logs });
    this.phase = 'mid';
  }

  private tally(m: MatchOutcome, league: boolean): void {
    const c = this.cur as NonNullable<CareerSim['cur']>;
    if (m.minutes <= 0) return;
    c.apps++; if (m.started) c.starts++; c.minutes += m.minutes; c.goals += m.goals; c.assists += m.assists; if (league) c.leagueGoals += m.goals;
    if (m.cleanSheet && isDefender(this.hero.primary)) c.cleanSheets++;
    if (m.rating > 0) { c.ratingSum += m.rating; c.ratedApps++; }
  }

  private log(m: MatchOutcome | null, comp: string, round: string, opp: string, home: boolean, status: MatchLog['status'], gfga?: [number, number]): MatchLog {
    const c = this.cur as NonNullable<CareerSim['cur']>;
    const gf = m?.goalsFor ?? gfga?.[0] ?? 0; const ga = m?.goalsAgainst ?? gfga?.[1] ?? 0;
    const entry: MatchLog = {
      n: c.logs.length + 1, comp, round, opp, home, gf, ga, pens: m?.pens ?? null, result: m ? (m.won ? 'W' : m.draw ? 'D' : 'L') : gf > ga ? 'W' : gf === ga ? 'D' : 'L',
      status: m ? (m.minutes > 0 ? (m.started ? 'start' : 'sub') : 'unused') : status, minutes: m?.minutes ?? 0, goals: m?.goals ?? 0, assists: m?.assists ?? 0, goalMinutes: m?.goalMinutes ?? [],
      rating: m && m.minutes > 0 ? m.rating : 0, yellow: m?.yellow ?? 0, red: m?.red ?? 0, injury: m?.injuryLabel ?? null,
    };
    c.logs.push(entry);
    return entry;
  }

  /** Plays the next `count` league fixtures. */
  private playLeague(count: number): MatchLog[] {
    const rng = this.rng; const hero = this.hero; const club = this.club;
    const c = this.cur as NonNullable<CareerSim['cur']>;
    const out: MatchLog[] = [];
    const comp = leagueName(c.ref.leagueId);
    for (let k = 0; k < count && c.played < c.fixtures.length; k++, c.played++) {
      const fx = c.fixtures[c.played] as { j: number; home: boolean };
      const opp = c.lvls[fx.j] as number;
      const available = c.unavailable <= 0;
      const r = playMatch(rng, hero, this.day, club.level, opp, fx.home, available ? c.startProb : 0, `${this.sid}|s${this.s}m${c.played}`, false, this.role);
      c.points += r.won ? 3 : r.draw ? 1 : 0;
      c.gd += r.goalsFor - r.goalsAgainst;
      const oppName = clubName({ leagueId: c.ref.leagueId, rank: fx.j });
      if (!available) { c.unavailable -= 7; out.push(this.log(null, comp, `Matchday ${c.played + 1}`, oppName, fx.home, 'injured', [r.goalsFor, r.goalsAgainst])); continue; }
      this.tally(r, true);
      if (r.injury > 0) { c.unavailable = r.injury; c.injuryDays += r.injury; }
      out.push(this.log(r, comp, `Matchday ${c.played + 1}`, oppName, fx.home, 'start'));
    }
    return out;
  }

  // ------------------------------------------------------------------ mid-season decisions
  private midSeason(): void {
    const rng = this.rng; const c = this.cur as NonNullable<CareerSim['cur']>;
    const here = clubName(c.ref);
    // injury handling
    if (c.unavailable >= 28) {
      const days = Math.round(c.unavailable);
      this.ask({
        kind: 'injury', title: 'Injury', text: `You are still out (about ${days} more days). The physio and the manager want your view.`,
        options: [
          { id: 'rest', label: 'Full rehab', detail: 'Miss the time, come back fit. No extra risk.' },
          { id: 'rush', label: 'Play through the pain', detail: `Back in about half the time, but a ~35% chance of a setback that costs 40 more days.` },
        ],
      }, 'rest', (id) => {
        if (id === 'rush') {
          c.unavailable = Math.round(c.unavailable * 0.5);
          if (rng.chance(0.35)) { c.unavailable += 40; c.injuryDays += 40; this.choicesNow.push('Setback: the injury flared up again'); } else this.choicesNow.push('Rushed back in time');
        }
      });
    }
    // playing time
    if (!this.loanFrom && c.startProb < 0.38 && this.age <= 29 && this.age >= 18) {
      this.ask({
        kind: 'playing-time', title: 'Playing time', text: `You are not getting the minutes at ${here}. What do you do?`,
        options: [
          { id: 'fight', label: 'Fight for your place', detail: 'Stay and work harder. A small boost to your chances.' },
          { id: 'loan', label: 'Ask for a loan', detail: 'Finish the season at a club where you will play. Return in the summer.' },
          { id: 'request', label: 'Hand in a transfer request', detail: 'Leave in the summer. Your image takes a small hit.' },
        ],
      }, 'fight', (id) => {
        if (id === 'fight') c.startProb = clamp(c.startProb + 0.06, 0, 0.96);
        else if (id === 'loan') {
          const loanCands = CANDIDATES.filter((x) => Math.abs(x.level - (c.ovr + 2)) < 7 && this.keyOf(x) !== this.keyOf(this.club));
          if (loanCands.length > 0) {
            this.loanFrom = this.club; this.loanYears = 1;
            this.club = pickWeighted(rng, loanCands, (x) => Math.exp(-(((x.level - (c.ovr + 2)) / 4) ** 2)));
            this.note = `Loaned out from ${clubName(this.loanFrom.ref)}`;
            c.startProb = clamp(0.55 + (c.ovr - this.club.level) / 11, 0.2, 0.96);
            c.ref = this.club.ref; // the rest of the season counts at the new club
          }
        } else { this.requestedMove = true; this.image = clamp(this.image - 4, 0, 100); }
      });
    }
    // press row
    if (this.manual() && rng.chance(0.22)) {
      this.ask({
        kind: 'media', title: 'Press row', text: 'A story about you is doing the rounds. How do you respond?',
        options: [
          { id: 'quiet', label: 'Stay professional', detail: 'No comment. Your image holds steady.' },
          { id: 'speak', label: 'Speak out', detail: 'High risk, high reward: a big swing to your image either way.' },
          { id: 'apologise', label: 'Apologise', detail: 'Small, safe gain to your image.' },
        ],
      }, 'quiet', (id) => {
        if (id === 'speak') { const up = rng.chance(0.5); this.image = clamp(this.image + (up ? 8 : -8), 0, 100); this.choicesNow.push(up ? 'The fans loved it' : 'It backfired'); }
        else if (id === 'apologise') this.image = clamp(this.image + 2, 0, 100);
      });
    }
    this.phase = 'h2';
  }

  // ------------------------------------------------------------------ second half, cups, continental, national team, awards
  private secondHalfAndFinish(): void {
    const rng = this.rng; const hero = this.hero;
    const c = this.cur as NonNullable<CareerSim['cur']>;
    const s = this.s; const age = this.age;
    const ref = c.ref;
    const club = this.club;
    const rest = c.fixtures.length - c.played;
    const lname = leagueName(ref.leagueId);
    this.outbox.push({ kind: 'matches', label: `${lname} · second half of the season`, matches: this.playLeague(rest) });
    const points = c.points; const gd = c.gd;
    const pos = tableRank(rng, ref.leagueId, c.size, Math.min(ref.rank, c.size - 1), points, gd);
    if (pos === 1) { c.honoursNow.push(lname); c.teamBonus += 2.5; }
    const ovr = c.ovr;

    // ---- domestic cup (single legs)
    const cupId = `${ref.leagueId.slice(0, 3)}-CUP`;
    const cupName = REAL_COMPETITION_NAMES[cupId]?.name ?? 'Domestic cup';
    const cupRounds = clamp(Math.round(Math.log2(c.size)) + 1, 4, 6);
    let cupResult = 'Winner';
    const cupLogs: MatchLog[] = [];
    for (let i = 0; i < cupRounds; i++) {
      const j = rng.int(c.size); const l = clamp((c.lvls[j] as number) + i * 0.8 - (i < cupRounds - 2 ? 2 : 0), 40, 90);
      const oppName = clubName({ leagueId: ref.leagueId, rank: j });
      const home = rng.chance(0.5);
      const m = playMatch(rng, hero, this.day, club.level, l, home, c.startProb * 0.8, `${this.sid}|s${s}c${i}`, true, this.role);
      this.tally(m, false);
      cupLogs.push(this.log(m, cupName, roundName(cupRounds, i), oppName, home, 'start'));
      if (!m.won) { cupResult = `Out in the ${roundName(cupRounds, i)}`; break; }
    }
    this.outbox.push({ kind: 'matches', label: cupName, matches: cupLogs });
    if (cupResult === 'Winner') { c.honoursNow.push(cupName); c.teamBonus += 1; }

    // ---- continental club competition
    let continental: CareerSeason['continental'] = null;
    const cc = continentalFor(ref.leagueId, pos);
    if (cc) {
      const lvl = COMP_LEVEL[cc] as number;
      const cname = REAL_COMPETITION_NAMES[cc]?.name ?? cc;
      const euroLogs: MatchLog[] = [];
      const games = cc === 'UCL' || cc === 'UEL' || cc === 'UECL' ? 8 : 6;
      let pts = 0;
      for (let g = 0; g < games; g++) {
        const opp = clubNear(rng, clamp(rng.normal(lvl, 4), 45, 90), this.keyOf(club));
        const home = g % 2 === 0;
        const m = playMatch(rng, hero, this.day, club.level, opp.level, home, c.startProb, `${this.sid}|s${s}e${g}`, false, this.role);
        this.tally(m, false); pts += m.won ? 3 : m.draw ? 1 : 0;
        euroLogs.push(this.log(m, cname, games === 8 ? `League phase ${g + 1}` : `Group ${g + 1}`, clubName(opp.ref), home, 'start'));
      }
      let result: string; let won = false;
      if (pts < (games === 8 ? 7 : 5)) result = 'Out in the league phase';
      else {
        result = 'Winner'; won = true;
        const targets = [lvl, lvl + 2, lvl + 4, lvl + 5];
        for (let r = 0; r < targets.length; r++) {
          const opp = clubNear(rng, targets[r] as number, this.keyOf(club));
          const home = rng.chance(0.5);
          const m = playMatch(rng, hero, this.day, club.level, opp.level, home, c.startProb, `${this.sid}|s${s}x${r}`, true, this.role);
          this.tally(m, false);
          euroLogs.push(this.log(m, cname, roundName(4, r), clubName(opp.ref), home, 'start'));
          if (!m.won) { result = `Out in the ${roundName(4, r)}`; won = false; break; }
        }
      }
      continental = { competition: cname, result };
      this.outbox.push({ kind: 'matches', label: cname, matches: euroLogs });
      if (won) { c.honoursNow.push(cname); c.teamBonus += cc === 'UCL' ? 6 : cc === 'UEL' || cc === 'COPA' || cc === 'ACLE' ? 3 : 1.5; }
      else if (result.includes('Final')) c.teamBonus += 1.5;
    }

    // ---- national team
    const tournament = this.playTournament(s, age, ovr, rng);
    let tGoals = 0;
    if (tournament) {
      tGoals = tournament.t.goals;
      this.outbox.push({ kind: 'matches', label: `${tournament.t.name} · ${tournament.t.nation}`, matches: tournament.logs });
      if (tournament.t.won) { c.honoursNow.push(tournament.t.name); c.teamBonus += tournament.t.name === WORLD_CUP ? 8 : 3; }
      else if (tournament.t.result.includes('Final') || tournament.t.result.includes('Semi')) c.teamBonus += tournament.t.name === WORLD_CUP ? 2 : 0.8;
      for (const a of tournament.t.awards) c.awardsNow.push(a);
    }
    const avgRating = Math.round((c.ratedApps > 0 ? c.ratingSum / c.ratedApps : 0) * 100) / 100;

    // ---- individual awards: compare the season with simulated rivals
    const scorerRival = Math.round(rng.normal(19 + ((c.lvls[0] as number) - 70) * 0.3, 3.2));
    if (!isGk(hero.primary) && c.leagueGoals > scorerRival && c.starts >= 22) c.awardsNow.push(`${lname} Golden Boot`);
    if (avgRating >= 7.4 + rng.normal(0, 0.12) && c.apps >= 28 && pos <= Math.ceil(c.size / 2)) c.awardsNow.push(`${lname} Player of the Season`);
    if (age <= 21 && c.apps >= 18 && avgRating >= 6.95 + rng.normal(0, 0.1)) c.awardsNow.push(`${lname} Young Player of the Season`);
    if (isGk(hero.primary) && c.cleanSheets >= Math.round(c.size * 0.36) && c.apps >= 28) c.awardsNow.push('Golden Glove');
    if (avgRating >= 7.3 && c.apps >= 25) c.awardsNow.push(`${lname} Team of the Season`);
    const score = awardScore(rng, hero.primary, ovr, c.goals + tGoals, c.assists, c.cleanSheets, avgRating, c.injuryDays, c.teamBonus + (c.captain ? 0.5 : 0), this.image);
    let ballonDor: CareerSeason['ballonDor'] = null;
    if (age >= 18 && ovr >= 70) {
      let rank = 1;
      for (let i = 0; i < 30; i++) {
        const rivalBase = 93 - i * 0.62 + rng.normal(0, 2.6) + (i < 6 && rng.chance(0.16) ? 5 : 0) + (tournament?.t.won && i < 4 && rng.chance(0.5) ? 5 : 0);
        if (rivalBase > score) rank++;
      }
      ballonDor = { rank: rank <= 30 ? rank : null };
      if (rank === 1) c.awardsNow.push(BALLON_DOR);
      else if (rank <= 3) c.awardsNow.push(`${BALLON_DOR} podium`);
      if (rank <= 30) this.ballon.push({ season: s, age, rank });
    }
    for (const h of c.honoursNow) this.bump(this.honours, h);
    for (const a of c.awardsNow) this.bump(this.awards, a);
    const earnings = Math.round(c.wage * 52);
    this.earningsTotal += earnings;

    const entry: CareerSeason = {
      season: s, age, ovr, club: clubName(ref), leagueId: ref.leagueId, league: lname, onLoan: this.loanFrom !== null,
      apps: c.apps, starts: c.starts, minutes: c.minutes, goals: c.goals, assists: c.assists, cleanSheets: c.cleanSheets, avgRating, injuryDays: c.injuryDays, leaguePos: pos, leagueSize: c.size,
      cup: cupName, cupResult, continental, tournament: tournament?.t ?? null, honours: c.honoursNow, awards: c.awardsNow, ballonDor, transferIn: this.transferIn, note: this.note,
      wageWeekly: c.wage, earnings, role: this.role ? (ROLES[this.role]?.name ?? this.role) : 'Default', focus: TRAINING.find((t) => t.id === this.focus)?.label ?? 'Balanced', choices: [...this.choicesNow], matchLog: c.logs,
    };
    this.seasons.push(entry);
    const last = this.clubsLog[this.clubsLog.length - 1];
    if (last && last.name === entry.club) last.to = s; else this.clubsLog.push({ name: entry.club, from: s, to: s });
    this.transferIn = null; this.note = null;
    this.outbox.push({ kind: 'season', season: entry });
    this.cur = null;
    this.endOfSeason(Math.round(overall(hero)));
    this.phase = 'pre';
  }

  /** Called-up players play the tournament with their national team: groups, then knockouts, all full matches. */
  private playTournament(s: number, age: number, ovr: number, rng: Rng): { t: TournamentResult; logs: MatchLog[] } | null {
    const wc = s % 4 === 0; const cont = s % 4 === 2;
    if (!wc && !cont) return null;
    const level = this.nation.level;
    if (age < 18 || ovr < level - 8 + rng.normal(0, 1.5)) return null;
    const gap = ovr - level;
    const startProb = clamp(0.55 + gap / 10, 0.1, 0.96);
    const name = wc ? WORLD_CUP : CONTINENTAL_CUP[this.nation.confed];
    // qualification (World Cup only): strong nations nearly always qualify, weak ones often do not
    if (wc && !rng.chance(clamp(0.35 + (level - 66) / 20, 0.05, 0.99))) return null;
    const field = NATIONS.filter((n) => n.code !== this.nation.code && (wc || n.confed === this.nation.confed)).sort((a, b) => b.level - a.level);
    const band = (from: number, to: number): Nation => {
      const slice = field.slice(Math.floor(field.length * from), Math.max(Math.floor(field.length * from) + 1, Math.floor(field.length * to)));
      return slice[rng.int(slice.length)] as Nation;
    };
    const c = this.cur as NonNullable<CareerSim['cur']>;
    const logs: MatchLog[] = [];
    const played: MatchOutcome[] = [];
    const log = (m: MatchOutcome, round: string, opp: string): void => {
      const e: MatchLog = {
        n: c.logs.length + 1, comp: name, round, opp, home: false, gf: m.goalsFor, ga: m.goalsAgainst, pens: m.pens, result: m.won ? 'W' : m.draw ? 'D' : 'L', status: m.minutes > 0 ? (m.started ? 'start' : 'sub') : 'unused',
        minutes: m.minutes, goals: m.goals, assists: m.assists, goalMinutes: m.goalMinutes, rating: m.minutes > 0 ? m.rating : 0, yellow: m.yellow, red: m.red, injury: m.injuryLabel,
      };
      c.logs.push(e); logs.push(e);
    };
    let pts = 0;
    [band(0, 0.3), band(0.3, 0.65), band(0.65, 1)].forEach((o, i) => {
      const m = playMatch(rng, this.hero, this.day, level, o.level, false, startProb, `${this.sid}|wc${s}g${i}`, false, null, true);
      played.push(m); pts += m.won ? 3 : m.draw ? 1 : 0; log(m, `Group stage ${i + 1}`, o.name);
    });
    let result: string; let won = false;
    const advance = pts >= 4 || (pts === 3 && rng.chance(0.5));
    if (!advance) result = 'Out in the group stage';
    else {
      const strong = wc || this.nation.confed === 'UEFA' || this.nation.confed === 'CONMEBOL';
      const rounds = wc ? [68, 73, 77, 80, 83] : strong ? [72, 76, 80, 83] : [64, 68, 72, 75];
      result = 'Winner'; won = true;
      for (let r = 0; r < rounds.length; r++) {
        const opp = field.reduce((b, n) => (Math.abs(n.level - (rounds[r] as number)) < Math.abs(b.level - (rounds[r] as number)) ? n : b), field[0] as Nation);
        const m = playMatch(rng, this.hero, this.day, level, rounds[r] as number, false, startProb, `${this.sid}|wc${s}k${r}`, true, null, true);
        played.push(m); log(m, roundName(rounds.length, r), opp.name);
        if (!m.won) { result = `Out in the ${roundName(rounds.length, r)}`; won = false; break; }
      }
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
    return { t, logs };
  }

  // ------------------------------------------------------------------ end of season: retirement, loans, contract and transfer decisions
  private offerFor(c: Candidate, kind: TransferOffer['kind'], ovrNow: number, fee: number): TransferOffer {
    const rng = this.rng;
    const gap = ovrNow - c.level;
    const cont = continentalFor(c.ref.leagueId, Math.max(1, Math.round((c.ref.rank + 1) * 0.8)));
    const id = `${c.ref.leagueId}:${c.ref.rank}`;
    this.offerFees.set(id, fee);
    return {
      id, club: clubName(c.ref), leagueId: c.ref.leagueId, league: leagueName(c.ref.leagueId), level: Math.round(c.level),
      role: gap >= 4 ? 'Key player' : gap >= -2 ? 'Starter' : gap >= -6 ? 'Rotation' : 'Bench', continental: cont ? (REAL_COMPETITION_NAMES[cont]?.name ?? null) : null,
      fee, wageWeekly: Math.round(this.wageNow(ovrNow, c) * rng.float(0.95, 1.2) / 100) * 100, kind,
    };
  }

  private buildOffers(ovrNow: number, free: boolean): TransferOffer[] {
    const rng = this.rng; const hero = this.hero; const s = this.s;
    const eligible = CANDIDATES.filter((c) => this.keyOf(c) !== this.keyOf(this.club) && s - (this.leftAt.get(this.keyOf(c)) ?? -99) > 3);
    const taken = new Set<string>();
    const offers: TransferOffer[] = [];
    const make = (kind: TransferOffer['kind'], target: number, spread: number, sameLeague?: boolean): void => {
      const pool = eligible.filter((c) => !taken.has(this.keyOf(c)) && (sameLeague === undefined || (c.ref.leagueId === this.club.ref.leagueId) === sameLeague));
      if (pool.length === 0) return;
      const c = pickWeighted(rng, pool, (x) => Math.exp(-(((x.level - target) / spread) ** 2)) + 1e-4);
      taken.add(this.keyOf(c));
      const fee = free ? 0 : Math.round((marketValue({ ...hero, contract: null } as Player, this.day, undefined) * rng.float(0.85, 1.35)) / 1e5) * 1e5;
      offers.push(this.offerFor(c, free ? 'free transfer' : kind, ovrNow, fee));
    };
    make('good fit', ovrNow + rng.float(-1, 2), 4);
    make('step up', ovrNow + rng.float(4, 8), 4);
    if (ovrNow >= 66) make('dream move', ovrNow + rng.float(8, 14), 5);
    make('new league', ovrNow + rng.float(-2, 5), 6, false);
    return offers;
  }

  private transferDecision(ovrNow: number, auto: boolean): void {
    const rng = this.rng;
    const offers = this.buildOffers(ovrNow, this.freeAgentNext);
    this.freeAgentNext = false;
    if (offers.length === 0) return;
    const stay: DecisionOption = { id: 'stay', label: `Stay at ${clubName(this.club.ref)}`, detail: 'Renew and carry on.' };
    this.ask({
      kind: 'transfer', title: 'Transfer window', text: `Age ${this.age}, rated ${ovrNow}. You are at ${clubName(this.club.ref)}${this.contractLeft > 0 ? ` with ${this.contractLeft} ${this.contractLeft === 1 ? 'year' : 'years'} left` : ' and your contract has run out'}. Pick an offer or stay.`,
      options: [...offers.map((o) => ({ id: o.id, label: o.club, detail: `${o.kind} · ${o.league}`, offer: o })), stay],
    }, auto ? (pickWeighted(rng, offers, (o) => (o.kind === 'good fit' ? 3 : o.kind === 'step up' ? 2 : 1)).id) : 'stay', (id) => {
      if (id === 'stay' || !offers.some((o) => o.id === id)) { if (this.contractLeft <= 0) this.contractLeft = rng.int(3) + 2; this.requestedMove = false; return; }
      this.applyOffer(id);
    });
  }

  private endOfSeason(ovr: number): void {
    const rng = this.rng; const hero = this.hero;
    this.age++;
    const pRet = retirementProbability(this.age, ovr, isGk(hero.primary)) + (this.age >= 40 ? 0.5 : 0);
    this.lastRetiredAge = this.age - 1;
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
    const forced = surplus > 7 || surplus < -7 || this.requestedMove;
    // contract talks when the deal is about to expire (a transfer decision follows if you want out)
    if (this.contractLeft <= 0 && !forced) {
      const value = this.wageNow(ovrNow, this.club);
      this.ask({
        kind: 'contract', title: 'Contract talks', text: `Your deal at ${clubName(this.club.ref)} has run out. Current wage: €${(value / 1000).toFixed(0)}k a week.`,
        options: [
          { id: 'long', label: 'Sign a long deal (5 years)', detail: `Security. Wage about 8% lower: €${(value * 0.92 / 1000).toFixed(0)}k a week.` },
          { id: 'standard', label: 'Standard deal (3 years)', detail: `Market wage: €${(value / 1000).toFixed(0)}k a week.` },
          { id: 'short', label: 'Short deal (2 years)', detail: `Wage about 12% higher: €${(value * 1.12 / 1000).toFixed(0)}k a week.` },
          { id: 'explore', label: 'Listen to other offers', detail: 'Leave on a free transfer with a bigger wage elsewhere. See who calls.' },
        ],
      }, 'standard', (id) => {
        if (id === 'long') { this.contractLeft = 5; this.wageMult = 0.92; }
        else if (id === 'standard') { this.contractLeft = this.rng.int(3) + 2; this.wageMult = 1; }
        else if (id === 'short') { this.contractLeft = 2; this.wageMult = 1.12; }
        else { this.freeAgentNext = true; this.wageMult = 1.2; this.transferDecision(ovrNow, true); }
      });
      return;
    }
    const wantsOut = forced || rng.chance(0.07);
    if (wantsOut) { this.transferDecision(ovrNow, true); return; }
    if (this.manual() && rng.chance(0.3)) this.transferDecision(ovrNow, false); // in manual mode extra offers can arrive any summer
  }

  private applyOffer(id: string): void {
    const c = CANDIDATES.find((x) => `${x.ref.leagueId}:${x.ref.rank}` === id);
    if (!c) return;
    const fee = this.offerFees.get(id) ?? 0;
    this.leftAt.set(this.keyOf(this.club), this.s);
    this.transferIn = { from: clubName(this.club.ref), fee };
    this.fees += fee;
    this.club = c;
    this.requestedMove = false;
    this.contractLeft = this.rng.int(4) + 2;
    this.wageMult = 1;
  }

  /** Game-to-game highlights from the match logs. */
  private highlights(): string[] {
    const all = this.seasons.flatMap((s) => s.matchLog.map((m) => ({ ...m, season: s.season, age: s.age, club: s.club })));
    const out: string[] = [];
    const played = all.filter((m) => m.minutes > 0);
    const first = played.find((m) => m.goals > 0);
    if (first) out.push(`First senior goal at ${first.age} against ${first.opp} (${first.comp}).`);
    const hat = played.filter((m) => m.goals >= 3);
    if (hat.length) { const b = hat.reduce((x, y) => (y.goals > x.goals ? y : x)); out.push(`${hat.length} hat-trick${hat.length > 1 ? 's' : ''}; best: ${b.goals} goals vs ${b.opp} (${b.comp}, ${b.gf}-${b.ga}).`); }
    const braces = played.filter((m) => m.goals === 2).length;
    if (braces > 0) out.push(`${braces} braces.`);
    let run = 0; let best = 0;
    for (const m of played) { if (m.goals > 0) { run++; best = Math.max(best, run); } else run = 0; }
    if (best >= 3) out.push(`Longest scoring run: ${best} games in a row.`);
    const finals = played.filter((m) => m.round === 'Final');
    const finalGoals = finals.reduce((a, m) => a + m.goals, 0);
    if (finals.length) out.push(`${finals.length} finals played, ${finalGoals} goals in them, ${finals.filter((m) => m.result === 'W' || (m.result === 'D' && m.pens && Number(m.pens.split('-')[0]) > Number(m.pens.split('-')[1]))).length} won.`);
    const rated = played.filter((m) => m.rating > 0 && m.minutes >= 60);
    if (rated.length) { const b = rated.reduce((x, y) => (y.rating > x.rating ? y : x)); out.push(`Best game: ${b.rating.toFixed(1)} vs ${b.opp} (${b.comp}, age ${b.age}).`); }
    const reds = played.reduce((a, m) => a + m.red, 0);
    if (reds > 0) out.push(`${reds} red card${reds > 1 ? 's' : ''}.`);
    const injured = this.seasons.reduce((a, s) => a + s.injuryDays, 0);
    if (injured > 0) out.push(`${injured} days lost to injury over the career.`);
    return out;
  }

  result(): CareerResult {
    const toArr = (m: Map<string, number>): { name: string; count: number }[] => [...m.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    const seasons = this.seasons;
    const sum = (f: (s: CareerSeason) => number): number => seasons.reduce((a, s) => a + f(s), 0);
    const totals = { seasons: seasons.length, apps: sum((x) => x.apps), goals: sum((x) => x.goals), assists: sum((x) => x.assists), cleanSheets: sum((x) => x.cleanSheets), caps: this.caps, internationalGoals: this.intGoals, fees: this.fees, earnings: this.earningsTotal };
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
      peak: this.peak, retiredAge: this.lastRetiredAge, honours, awards: toArr(this.awards), ballonDor, tournaments: this.tournaments, clubs: this.clubsLog, highlights: this.highlights(),
      decisions: this.decisionsLog, headline,
    };
  }
}

/**
 * Runs a whole career. Every decision is answered by `choose` (given the decision, returns an option id) when the input is
 * 'manual', otherwise by the automatic default.
 */
export function simulateCareer(input: CareerInput, onSeason?: (s: CareerSeason) => void, choose?: (d: Decision) => string | null): CareerResult {
  const sim = new CareerSim(input);
  for (let guard = 0; guard < 100000; guard++) {
    const st = sim.step();
    if (st.kind === 'done') return st.result;
    if (st.kind === 'season') onSeason?.(st.season);
    else if (st.kind === 'decision') sim.decide(choose ? choose(st.decision) : null);
  }
  throw new Error('career did not finish');
}
