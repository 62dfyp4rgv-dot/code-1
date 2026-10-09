/**
 * Competition model. Definitions are pure data (versioned per season); the generic engine in `engine.ts`
 * interprets them. Nothing here is specific to one league.
 */

export type Confederation = 'UEFA' | 'AFC' | 'CAF' | 'CONCACAF' | 'CONMEBOL' | 'OFC';

export type CompetitionKind = 'league' | 'cup' | 'superCup' | 'continental' | 'intercontinental';

export type Tiebreaker =
  | 'points' | 'goalDifference' | 'goalsFor' | 'wins' | 'awayGoals'
  | 'h2hPoints' | 'h2hGoalDifference' | 'h2hGoalsFor' | 'h2hAwayGoals'
  | 'fairPlay' | 'drawLots';

export interface ScheduleSpec {
  /** Week (0-based within the 52-week season cycle) of the first round of this stage. */
  startWeek: number;
  /** Weeks between rounds. */
  weekStep: number;
  /** Day of week 0=Mon..6=Sun. */
  dow: number;
  /** Weeks that cannot host a round of this stage (winter break, international windows). */
  skipWeeks?: number[];
  /** For two-legged knockout rounds: weeks between leg 1 and leg 2. */
  legGapWeeks?: number;
  /** Alternate day-of-week for odd-numbered fixtures to spread kick-offs (e.g. Sat/Sun). */
  altDow?: number;
  /** Explicit week per round (overrides startWeek/weekStep). Rounds beyond the list reuse the last entry + 1 each. */
  weeks?: number[];
  /** Explicit day-of-week per round (aligned with `weeks`), used for midweek double-header weeks. */
  dows?: number[];
  /** Knockout only: the final is always played in this week/day-of-week regardless of round count. */
  finalWeek?: number;
  finalDow?: number;
}

interface StageBase {
  id: string;
  name: string;
  schedule: ScheduleSpec;
}

export interface RoundRobinStage extends StageBase {
  type: 'roundRobin';
  legs: 1 | 2;
  tiebreakers: Tiebreaker[];
  /** If set, the top N of the table advance to the next stage (e.g. league play-offs). */
  advance?: number;
}

export interface GroupsStage extends StageBase {
  type: 'groups';
  groups: number;
  legs: 1 | 2;
  /** Teams advancing per group. */
  advance: number;
  /** Extra best-ranked teams from a given group position (e.g. best third places). */
  bestOfPlace?: { place: number; count: number };
  tiebreakers: Tiebreaker[];
  /** Number of draw pots (seeded by club coefficient). */
  pots: number;
  /** Zones to keep apart (e.g. AFC east/west) not used in groups. */
  avoidSameCountry: boolean;
}

export interface LeaguePhaseStage extends StageBase {
  type: 'leaguePhase';
  /** Matches per team (equal home/away split). */
  matches: number;
  pots: number;
  /** Partition teams in independent zones (AFC East/West). Each zone is its own table. */
  zones?: { id: string; name: string }[];
  tiebreakers: Tiebreaker[];
  /** At most this many opponents from the same country. */
  maxSameCountryOpponents: number;
  /** Ranks (per zone) qualifying directly to the next stage. */
  advanceDirect: number;
  /** Ranks (per zone) advancing to a play-off; must be contiguous after `advanceDirect`. */
  advancePlayoff: number;
}

export type PairingStrategy =
  | 'random'            // free draw
  | 'seeded'            // best vs worst by reputation
  | 'playoffSeeded'     // seeded half vs unseeded half (league-phase playoff)
  | 'leaguePhaseBracket'// R16 from league-phase rank with fixed bracket paths
  | 'bracket'           // winners follow previous round ordering
  | 'regionalSeeded'    // group winners vs runners-up from other groups
  | 'zonalSeeded';      // each zone's qualifiers form their own seeded bracket; zone winners meet late

export interface KnockoutStage extends StageBase {
  type: 'knockout';
  /** Legs for every round except the final. */
  legs: 1 | 2;
  /** Final is a single match (true) or uses `legs`. */
  finalSingle: boolean;
  extraTime: boolean;
  penalties: boolean;
  awayGoalsRule: boolean;
  pairing: PairingStrategy;
  /** Final (and optionally semi-finals) played at a neutral venue. */
  neutralFinal: boolean;
  /** Teams get byes to reach a power of two (top seeds). If false requires power-of-two entrants. */
  byes: boolean;
  /** Names for rounds counted from the final: [final, semi, quarter, r16,...]. */
  roundNames?: string[];
}

export type StageDef = RoundRobinStage | GroupsStage | LeaguePhaseStage | KnockoutStage;

export interface RuleSet {
  /** First season (1-based) this rule set applies to. */
  fromSeason: number;
  /** Entrants for this edition. */
  entrants: number;
  minEntrants: number;
  stages: StageDef[];
  pointsForWin: number;
  /** Squad registration rules for clubs competing here. */
  squad: { maxSquadSize: number; maxForeignRegistered: number | null; minHomegrown: number | null; maxLoanIn: number };
  /** Booking accumulation: yellows that trigger a 1-match ban, and the reset round (null = never). */
  discipline: { yellowsForBan: number; resetAfterRound: number | null };
  /** Prize money: EUR for 1st..Nth (league) or per-stage reached (knockout), plus per-match appearance fee. */
  prize: { positions: number[]; perMatch: number; perWin: number };
  /** Annual television revenue pool (EUR) distributed to participants. */
  tvPool: number;
  /** Maximum percentage of the club's budget that may go to wages (financial regulation), null = not applied. */
  squadCostRatioLimit: number | null;
  /** Transfer window weeks [start, end] pairs. */
  transferWindows: [number, number][];
}

export type VerificationStatus = 'verified' | 'unverified-default' | 'fictional-scenario';

export interface CompetitionDef {
  id: string;
  name: string;
  shortName: string;
  kind: CompetitionKind;
  confederation: Confederation | null;
  /** Country code for domestic competitions. */
  country: string | null;
  /** League tier (1 = top flight) for domestic leagues. */
  tier: number | null;
  /** The competition runs every N seasons (default 1) with the first edition at `firstSeason`. */
  period: number;
  firstSeason: number;
  /** Rule versions sorted by fromSeason ascending. */
  rules: RuleSet[];
  verification: { status: VerificationStatus; note: string };
  /** Priority for calendar conflicts: lower number wins the date. */
  priority: number;
}

// ---------------------------------------------------------------- runtime state

export interface FixtureResult {
  homeGoals: number;
  awayGoals: number;
  extraTime: boolean;
  pens: { home: number; away: number } | null;
  /** Set when the stored match record is retained in the world's match archive. */
  matchId: string | null;
  homeYellow: number;
  awayYellow: number;
  homeRed: number;
  awayRed: number;
}

export interface Fixture {
  id: string;
  competitionId: string;
  season: number;
  stageId: string;
  round: number; // 1-based matchday / knockout round
  leg: 1 | 2;
  tieId: string | null;
  group: string | null; // group letter / zone id
  home: string;
  away: string;
  day: number;
  neutral: boolean;
  status: 'scheduled' | 'played' | 'cancelled';
  result: FixtureResult | null;
}

export interface Tie {
  id: string;
  round: number;
  /** Seeds / ordering index inside the round (bracket position). */
  index: number;
  home: string; // team hosting the second leg (or the single match)
  away: string;
  fixtureIds: string[];
  winner: string | null;
  decidedBy: 'regulation' | 'aggregate' | 'awayGoals' | 'extraTime' | 'penalties' | 'bye' | null;
}

export type StageStatus = 'pending' | 'active' | 'complete';

export interface StageState {
  id: string;
  status: StageStatus;
  /** Participants (club ids) that entered this stage. */
  teams: string[];
  /** For groups / league-phase zones: club ids per group id. */
  groups: Record<string, string[]>;
  /** Knockout: ties per round (1-based round index -> ties). */
  ties: Tie[][];
  currentRound: number;
  totalRounds: number;
  /** Club ids that progressed out of this stage in order of seeding (for next-stage pairing). */
  qualified: string[];
  /** Club ids that dropped into a playoff path from the league phase (rank order). */
  playoffQualified: string[];
  /** Club ids eliminated in this stage in order of elimination (latest first not guaranteed). */
  eliminated: string[];
  /** Final ordered table by group id (snapshot at completion for league-like stages). */
  finalTable: Record<string, string[]>;
}

export interface CompetitionState {
  id: string;
  season: number;
  ruleFromSeason: number;
  entrants: string[];
  status: 'pending' | 'active' | 'complete' | 'skipped';
  stageIndex: number;
  stages: StageState[];
  fixtures: Fixture[];
  winner: string | null;
  runnerUp: string | null;
  /** Final league-table order of the first table stage (empty for pure knockouts). */
  tableOrder: string[];
  /** Entrants ordered by how far they got (winner first); filled when complete. */
  finalRanking: string[];
}

export interface ClubTableInfo {
  id: string;
  country: string;
  /** Seeding score (higher = stronger). */
  coefficient: number;
}

export interface TableRow {
  clubId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  awayGoals: number;
  fairPlay: number; // lower is better (yellow=1, red=3)
  position: number;
}
