/**
 * Core domain types. Units are explicit everywhere:
 *  - money: whole euros (EUR). Display currency conversion lives in the UI layer.
 *  - wages: EUR per week.
 *  - time: integer "day" numbers; day 0 is the first day of the first simulated season cycle.
 *  - attributes: 1..100 numbers.
 */

export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'DM' | 'CM' | 'AM' | 'LW' | 'RW' | 'ST';
export type PositionGroup = 'GK' | 'DEF' | 'MID' | 'FWD';

export const POSITIONS: readonly Position[] = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'];

export const POSITION_GROUP: Record<Position, PositionGroup> = {
  GK: 'GK', CB: 'DEF', LB: 'DEF', RB: 'DEF', DM: 'MID', CM: 'MID', AM: 'MID', LW: 'FWD', RW: 'FWD', ST: 'FWD',
};

export const TECHNICAL_ATTRS = ['finishing', 'passing', 'firstTouch', 'dribbling', 'crossing', 'tackling', 'marking', 'heading', 'setPieces'] as const;
export const MENTAL_ATTRS = ['vision', 'decisions', 'positioning', 'composure', 'anticipation', 'teamwork', 'concentration', 'leadership', 'workRate', 'aggression'] as const;
export const PHYSICAL_ATTRS = ['acceleration', 'pace', 'stamina', 'strength', 'agility', 'balance', 'jumping', 'recovery'] as const;
export const GK_ATTRS = ['reflexes', 'handling', 'gkPositioning', 'aerial', 'distribution', 'oneOnOne'] as const;

export const ATTR_KEYS = [...TECHNICAL_ATTRS, ...MENTAL_ATTRS, ...PHYSICAL_ATTRS, ...GK_ATTRS] as const;
export type AttrKey = (typeof ATTR_KEYS)[number];
export type Attributes = Record<AttrKey, number>;
export type AttrGroup = 'technical' | 'mental' | 'physical' | 'goalkeeping';

const TECH_SET: ReadonlySet<string> = new Set(TECHNICAL_ATTRS);
const MENTAL_SET: ReadonlySet<string> = new Set(MENTAL_ATTRS);
const PHYS_SET: ReadonlySet<string> = new Set(PHYSICAL_ATTRS);

export function attrGroup(k: AttrKey): AttrGroup {
  if (TECH_SET.has(k)) return 'technical';
  if (MENTAL_SET.has(k)) return 'mental';
  if (PHYS_SET.has(k)) return 'physical';
  return 'goalkeeping';
}

export type PlayerTrait =
  | 'longShots' | 'penaltyTaker' | 'setPieceSpecialist' | 'aerialThreat' | 'playmaker' | 'ballWinner'
  | 'clutch' | 'injuryProne' | 'leader' | 'flair' | 'engine' | 'sweeper';

export interface Contract {
  clubId: string;
  wageWeekly: number; // EUR/week
  startDay: number;
  endDay: number;
  signingBonus: number; // EUR, paid once at signing
  releaseClause: number | null; // EUR
  squadRole: 'star' | 'first' | 'rotation' | 'prospect' | 'backup';
}

export interface LoanDeal {
  parentClubId: string;
  startDay: number;
  endDay: number;
  /** Fraction (0..1) of the player's wage the parent keeps paying. */
  parentWageShare: number;
  recallAllowed: boolean;
  buyOption: number | null; // EUR
}

export interface InjuryState {
  kind: string;
  startDay: number;
  returnDay: number;
  severity: 1 | 2 | 3 | 4; // 1 minor .. 4 season-ending
}

export interface SeasonLine {
  season: number;
  clubId: string;
  apps: number;
  starts: number;
  minutes: number;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
  cleanSheets: number;
  ratingSum: number;
  xg: number;
}

export interface Player {
  id: string;
  name: string;
  nationality: string; // 3 letter code
  birthDay: number; // day number (negative = before day 0)
  foot: 'L' | 'R' | 'B';
  weakFoot: 1 | 2 | 3 | 4 | 5;
  primary: Position;
  /** Familiarity 0..1 for non-primary positions; primary is implicitly 1. */
  positions: Partial<Record<Position, number>>;
  attrs: Attributes;
  traits: PlayerTrait[];
  /** Hidden: expected peak overall ability (1..100). */
  pot: number;
  /** Hidden: development rate multiplier, ~0.6..1.4. */
  devRate: number;
  /** Hidden: week-to-week consistency 0..1. */
  consistency: number;
  /** Hidden: injury proneness multiplier ~0.5..1.8. */
  injuryProneness: number;
  clubId: string | null; // current club (borrowing club if on loan); null = free agent
  contract: Contract | null;
  loan: LoanDeal | null;
  // dynamic condition
  form: number; // -10..10
  morale: number; // 0..100
  confidence: number; // 0..100
  fatigue: number; // 0..100, short-term match fatigue (0 = fresh)
  workload: number; // rolling acute load, arbitrary units, decays
  injury: InjuryState | null;
  /** matches banned, keyed by competition id */
  suspensions: Record<string, number>;
  /** yellow-card accumulation, keyed by competition id */
  yellows: Record<string, number>;
  history: SeasonLine[];
  retired: boolean;
  /** Free agent: day they became available. */
  freeSince: number | null;
  /** Day of the last club change (blocks immediate re-transfers). */
  lastMoveDay: number | null;
}

export interface Tactics {
  formation: string; // key into FORMATIONS
  /** role id per formation slot, same order as formation.slots */
  roles: string[];
  mentality: -2 | -1 | 0 | 1 | 2; // ultra-defensive .. all-out attack
  tempo: number; // 0..100
  width: number; // 0..100
  directness: number; // 0..100 (0 = short passing, 100 = long balls)
  pressing: number; // 0..100
  defensiveLine: number; // 0..100
  counterAttack: boolean;
  marking: 'zonal' | 'man' | 'mixed';
  setPieceFocus: 'near' | 'far' | 'short' | 'mixed';
  adaptive: boolean; // adjust to scoreline/fatigue
  maxSubs: number;
}

export interface Stadium {
  name: string;
  capacity: number;
}

export interface ClubFinance {
  cash: number; // EUR
  debt: number; // EUR
  transferBudget: number; // EUR remaining for the current window
  wageBudgetWeekly: number; // EUR/week
  /** EUR per season, accrued weekly */
  broadcastingAnnual: number;
  sponsorshipAnnual: number;
  /** Per-category totals for the current season (income positive, spending negative). */
  seasonLedger: Record<string, number>;
  /** Scheduled future cash flows (transfer installments). Negative = paid by this club. */
  installments: { dueDay: number; amount: number; counterpartyId: string | null; memo: string }[];
  /** Consecutive seasons over the league's squad-cost ratio limit. */
  overspendStrikes: number;
  embargoUntilDay: number;
  /** Non-wage operating costs, EUR per year (stadium, staff, travel, academy). */
  opexAnnual: number;
  /** Average ticket price in EUR. */
  ticketPrice: number;
  /** Cash at the start of the current season: cash === seasonStartCash + sum(seasonLedger). */
  seasonStartCash: number;
}

export type ManagerStyle =
  | 'youthDeveloper' | 'possession' | 'counterAttack' | 'highPress' | 'pragmatic' | 'superstarBuilder'
  | 'domesticDominance' | 'continentalFocus' | 'sustainable';

export interface Manager {
  id: string;
  name: string;
  nationality: string;
  birthDay: number;
  reputation: number; // 1..100
  tacticalKnowledge: number; // 1..100
  manManagement: number; // 1..100
  youthEye: number; // 1..100
  style: ManagerStyle;
  /** 1..100: how much board pressure/results swing decisions */
  patience: number;
  clubId: string | null;
  contractEndDay: number | null;
  tenure: { startDay: number; played: number; points: number };
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  country: string;
  city: string;
  colors: [string, string];
  reputation: number; // 1..100 current prestige
  historicalPrestige: number; // 1..100 slow moving
  continentalReputation: number; // 1..100
  stadium: Stadium;
  facilities: { training: number; youth: number; medical: number; scouting: number; coaching: number }; // 1..100
  supporters: number; // 1..100 fan-base size/intensity
  ownership: { kind: 'members' | 'investor' | 'state' | 'private'; wealth: number }; // wealth 1..100
  philosophy: ManagerStyle;
  managerId: string | null;
  tactics: Tactics;
  finance: ClubFinance;
  boardExpectation: number; // target league-position percentile 0..1 (0 = must win)
  boardPatience: number; // 0..100
  /** Domestic competition id the club currently plays in (league tier). */
  leagueId: string;
  rivals: string[];
  fictional: boolean;
  /** 0..1 squad chemistry; rises with continuity and tenure, falls with turnover. */
  cohesion: number;
}

export interface TransferRecord {
  id: string;
  day: number;
  playerId: string;
  fromClubId: string | null;
  toClubId: string | null;
  kind: 'transfer' | 'loan' | 'loanReturn' | 'free' | 'release' | 'retire' | 'youth' | 'recall';
  fee: number; // EUR
  wageWeekly: number;
}
