import type { CompetitionState } from '../competition/types';
import type { MatchEvent, MatchResult } from '../match';
import type { Club, Manager, Player, TransferRecord } from '../types';

export const WORLD_SCHEMA_VERSION = 1;

export interface WorldConfig {
  seed: string;
  /** Domestic league ids enabled (tier-1 leagues also pull their tier-2 pyramid partner when present). */
  leagues: string[];
  preset: 'compact' | 'standard';
  humanClubId: string | null;
  /** Retain full event timelines for matches involving the human club and this many recent other matches. */
  archiveRecent: number;
}

export interface StatLine {
  clubId: string;
  apps: number;
  minutes: number;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
  ratingSum: number;
  cleanSheets: number;
}

export interface NewsItem {
  id: string;
  day: number;
  kind: 'result' | 'transfer' | 'injury' | 'manager' | 'milestone' | 'title' | 'finance' | 'upset' | 'record' | 'retire' | 'promotion';
  clubIds: string[];
  playerIds: string[];
  text: string;
  /** Reference to the underlying data (match id, transfer id ...). Narrative must always be derivable from it. */
  ref: string | null;
}

export interface StoredMatch {
  id: string;
  fixtureId: string;
  competitionId: string;
  season: number;
  day: number;
  homeClubId: string;
  awayClubId: string;
  score: { home: number; away: number };
  penalties: { home: number; away: number } | null;
  extraTime: boolean;
  stats: MatchResult['stats'];
  /** Compact scorer list always kept: [minute, side, playerId, kind] */
  goals: [number, 'home' | 'away', string, string][];
  motm: string | null;
  /** Full timeline, retained only for recent / human-club / notable matches. */
  events: MatchEvent[] | null;
  players: MatchResult['players'] | null;
  /** Seed + inputs sufficient to replay the match exactly; kept together with events. */
  replay: unknown | null;
}

export interface SeasonSummary {
  season: number;
  champions: Record<string, { winner: string | null; runnerUp: string | null }>;
  tables: Record<string, string[]>;
  topScorers: Record<string, { playerId: string; clubId: string; goals: number }[]>;
  topAssists: Record<string, { playerId: string; clubId: string; assists: number }[]>;
  bestPlayers: Record<string, { playerId: string; clubId: string; avgRating: number; apps: number }[]>;
  promoted: { clubId: string; from: string; to: string }[];
  relegated: { clubId: string; from: string; to: string }[];
  managerChanges: { day: number; clubId: string; out: string | null; in: string }[];
  biggestWins: { fixtureId: string; margin: number }[];
  breakouts?: { playerId: string; clubId: string; from: number; to: number }[];
  decliners?: { playerId: string; clubId: string; from: number; to: number }[];
  /** Aggregate statistics per league, derived from played fixtures (used for calibration reports). */
  leagueStats: Record<string, LeagueSeasonStats>;
}

export interface LeagueSeasonStats {
  matches: number;
  goalsPerMatch: number;
  homeGoals: number;
  awayGoals: number;
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  cleanSheetPct: number;
  yellowPerMatch: number;
  redPerMatch: number;
  championPoints: number;
  lastPlacePoints: number;
  pointsSd: number;
}

export interface ClubRecord {
  trophies: Record<string, number[]>; // competitionId -> seasons won
  bestFinish: Record<string, number>; // leagueId -> best position
  seasons: { season: number; leagueId: string; position: number; points: number }[];
  longestUnbeaten: number;
  /** Running league streaks (updated after every league match). */
  streaks?: { unbeaten: number; wins: number; winless: number; longestWins: number };
}

export interface WorldHistory {
  seasons: SeasonSummary[];
  /** compId -> season -> winner/runner-up */
  champions: Record<string, Record<number, { winner: string | null; runnerUp: string | null }>>;
  clubs: Record<string, ClubRecord>;
  /** Career milestones keyed by player id: first-class summary for retired legends. */
  legends: { playerId: string; name: string; retiredSeason: number; goals: number; apps: number; clubs: string[]; peakOverall: number }[];
  records: { kind: string; value: number; holder: string; day: number; ref: string | null }[];
}

export interface AiClubState {
  needs: Record<string, number>; // position -> severity 0..1
  lastReviewDay: number;
  /** Day until which the club will not bid again for the same players. */
  cooldown: Record<string, number>;
  dealsThisWindow: number;
}

export interface WorldCounters {
  player: number;
  manager: number;
  transfer: number;
  news: number;
}

export interface WorldState {
  schemaVersion: number;
  config: WorldConfig;
  day: number;
  season: number;
  players: Record<string, Player>;
  clubs: Record<string, Club>;
  managers: Record<string, Manager>;
  /** Competition instances for the current season, keyed by competition id. */
  competitions: Record<string, CompetitionState>;
  /** Membership of each domestic league for the current season. */
  leagueMembers: Record<string, string[]>;
  /** Per-competition per-player season statistics. */
  seasonStats: Record<string, Record<string, StatLine>>;
  matches: Record<string, StoredMatch>;
  matchOrder: string[];
  transfers: TransferRecord[];
  history: WorldHistory;
  news: NewsItem[];
  ai: Record<string, AiClubState>;
  counters: WorldCounters;
  /** Players currently placed on the market by their clubs: playerId -> asking price. */
  transferList: Record<string, { askingPrice: number; day: number }>;
  /** Unemployed managers. */
  managerPool: string[];
  /** User-customised overrides applied on top of generated reference data. */
  overrides: { clubNames: Record<string, string>; playerNames: Record<string, string>; competitionNames?: Record<string, { name: string; shortName: string }> };
  /** Provenance of any real-world data pack applied on top of the generated universe (null = fully fictional). */
  dataPack?: DataPackInfo | null;
}

export interface DataPackInfo {
  id: string;
  name: string;
  source: string;
  licence: string;
  /** Counts of what the pack actually changed, shown in the app so partial coverage is never hidden. */
  applied: { clubs: number; players: number; managers: number; crests: number; competitions: number };
}
