/**
 * Competition registry: data only. No league is special-cased in the engine; Saudi Pro League support is
 * expressed through its profile (finances, foreign-player registration, transfer behaviour) and its rule sets.
 *
 * IMPORTANT (data honesty): rule sets and qualification slot counts below are *configured scenario defaults*
 * written from the author's general knowledge and are NOT verified against current official regulations.
 * Every definition carries `verification.status` and a note so the UI and docs can say so. Real-world
 * accuracy requires replacing these with licensed/verified data; the engine does not need to change.
 */
import type {
  CompetitionDef, Confederation, KnockoutStage, LeaguePhaseStage, GroupsStage, RoundRobinStage, RuleSet, ScheduleSpec, StageDef, Tiebreaker,
} from './types';

// ---------------------------------------------------------------- league profiles (world generation + economics)

export type NameCulture =
  | 'english' | 'spanish' | 'italian' | 'german' | 'french' | 'portuguese' | 'dutch' | 'arabic' | 'japanese' | 'korean'
  | 'chinese' | 'turkish' | 'brazilian' | 'african' | 'slavic' | 'pacific' | 'nordic' | 'greek' | 'persian' | 'indian' | 'thai';

export interface LeagueProfile {
  id: string;
  country: string; // ISO-ish 3 letter
  countryName: string;
  name: string;
  shortName: string;
  tier: number;
  confederation: Confederation;
  clubs: number;
  /** Clubs when generating the "compact" world preset. */
  compactClubs: number;
  /** Mean ability of a club's best XI at league level (scenario value). */
  quality: number;
  /** Std-dev of club strength inside the league. */
  clubSpread: number;
  /** Annual broadcast pool (EUR, scenario estimate). */
  tvPool: number;
  /** Mean stadium capacity. */
  stadium: number;
  /** Typical ticket price (EUR) for matchday revenue. */
  ticket: number;
  /** Share of clubs backed by large investors/states (0..1). */
  investorShare: number;
  culture: NameCulture;
  /** Inbound transfer aggressiveness: willingness to overpay relative to value (1 = neutral). */
  transferAggression: number;
  /** Share of squad that is domestically produced. */
  homeShare: number;
  /** Rest-of-world nationalities that supply foreign players, with weights. */
  foreignPool: string[];
  tiebreakers: Tiebreaker[];
  matchdayWeeks: { start: number; skip: number[] };
  maxForeign: number | null;
  minHomegrown: number | null;
  maxSquad: number;
  squadCostLimit: number | null;
  transferWindows: [number, number][];
  /** Season week the domestic cup rounds use (shared default). */
  hasCup: boolean;
  hasSuperCup: boolean;
  legs: 1 | 2;
  zone?: string; // AFC zone
  /**
   * Opt-in league: not part of the default league selection (`defaultWorldConfig` scope 'core'), so the default
   * 'standard' and 'compact' worlds keep their size and speed. Enabled by listing the id in `WorldConfig.leagues`
   * or by `defaultWorldConfig(..., 'extended')`.
   */
  extended?: boolean;
}

const EU_WINDOWS: [number, number][] = [[0, 5], [22, 25]];
const STD_SKIP = [8, 12, 17, 31, 38];

const TB_ENG: Tiebreaker[] = ['points', 'goalDifference', 'goalsFor', 'h2hPoints', 'h2hAwayGoals', 'drawLots'];
const TB_H2H_FIRST: Tiebreaker[] = ['points', 'h2hPoints', 'h2hGoalDifference', 'h2hGoalsFor', 'goalDifference', 'goalsFor', 'drawLots'];
const TB_GD: Tiebreaker[] = ['points', 'goalDifference', 'goalsFor', 'h2hPoints', 'drawLots'];

type ProfileInit = Omit<LeagueProfile, 'compactClubs' | 'tiebreakers' | 'matchdayWeeks' | 'transferWindows' | 'legs' | 'hasCup' | 'hasSuperCup' | 'maxSquad' | 'maxForeign' | 'minHomegrown' | 'squadCostLimit' | 'homeShare' | 'transferAggression' | 'investorShare' | 'foreignPool' | 'ticket'> &
  Partial<Pick<LeagueProfile, 'compactClubs' | 'tiebreakers' | 'matchdayWeeks' | 'transferWindows' | 'legs' | 'hasCup' | 'hasSuperCup' | 'maxSquad' | 'maxForeign' | 'minHomegrown' | 'squadCostLimit' | 'homeShare' | 'transferAggression' | 'investorShare' | 'foreignPool' | 'ticket'>>;

const mkProfile = (p: ProfileInit): LeagueProfile => ({
  compactClubs: Math.min(p.clubs, p.tier === 1 ? 10 : 8),
  tiebreakers: TB_GD,
  matchdayWeeks: { start: 2, skip: STD_SKIP },
  transferWindows: EU_WINDOWS,
  legs: 2,
  hasCup: p.tier === 1,
  hasSuperCup: false,
  maxSquad: 25,
  maxForeign: null,
  minHomegrown: null,
  squadCostLimit: 0.7,
  homeShare: 0.6,
  transferAggression: 1,
  investorShare: 0.1,
  foreignPool: ['FRA', 'ESP', 'BRA', 'ARG', 'ENG', 'NGA'],
  ticket: 35,
  ...p,
});

export const LEAGUE_PROFILES: LeagueProfile[] = [
  // ---- UEFA
  mkProfile({ id: 'ENG1', country: 'ENG', countryName: 'England', name: 'English Premier Division', shortName: 'EPD', tier: 1, confederation: 'UEFA', clubs: 20, quality: 73, clubSpread: 5.5, tvPool: 3.2e9, stadium: 42000, ticket: 60, culture: 'english', tiebreakers: TB_ENG, hasSuperCup: true, minHomegrown: 8, investorShare: 0.35, transferAggression: 1.25, homeShare: 0.4, foreignPool: ['FRA', 'ESP', 'BRA', 'GER', 'NED', 'POR'] }),
  mkProfile({ id: 'ENG2', country: 'ENG', countryName: 'England', name: 'English Second Division', shortName: 'ESD', tier: 2, confederation: 'UEFA', clubs: 24, quality: 58, clubSpread: 3.5, tvPool: 4.5e8, stadium: 22000, ticket: 28, culture: 'english', tiebreakers: TB_ENG, matchdayWeeks: { start: 2, skip: [8, 12, 17, 24, 31, 38] }, homeShare: 0.6, squadCostLimit: 0.85 }),
  mkProfile({ id: 'ESP1', country: 'ESP', countryName: 'Spain', name: 'Spanish Primera', shortName: 'ESP', tier: 1, confederation: 'UEFA', clubs: 20, quality: 71, clubSpread: 6, tvPool: 1.9e9, stadium: 38000, ticket: 45, culture: 'spanish', tiebreakers: TB_H2H_FIRST, hasSuperCup: true, homeShare: 0.5 }),
  mkProfile({ id: 'ITA1', country: 'ITA', countryName: 'Italy', name: 'Italian Serie Alpha', shortName: 'ITA', tier: 1, confederation: 'UEFA', clubs: 20, quality: 69, clubSpread: 5.2, tvPool: 1.5e9, stadium: 36000, ticket: 38, culture: 'italian', tiebreakers: TB_H2H_FIRST, hasSuperCup: true, homeShare: 0.45 }),
  mkProfile({ id: 'GER1', country: 'GER', countryName: 'Germany', name: 'German First League', shortName: 'GFL', tier: 1, confederation: 'UEFA', clubs: 18, quality: 69, clubSpread: 5, tvPool: 1.6e9, stadium: 44000, ticket: 42, culture: 'german', tiebreakers: TB_GD, hasSuperCup: true, minHomegrown: 12, homeShare: 0.5, matchdayWeeks: { start: 2, skip: [8, 12, 17, 18, 19, 31, 38] } }),
  mkProfile({ id: 'FRA1', country: 'FRA', countryName: 'France', name: 'French League One', shortName: 'FL1', tier: 1, confederation: 'UEFA', clubs: 18, quality: 66, clubSpread: 5.5, tvPool: 9e8, stadium: 30000, ticket: 32, culture: 'french', tiebreakers: TB_GD, hasSuperCup: true, homeShare: 0.5, foreignPool: ['MAR', 'SEN', 'BRA', 'CIV', 'ESP'] }),
  mkProfile({ id: 'POR1', country: 'POR', countryName: 'Portugal', name: 'Portuguese Premier League', shortName: 'PPL', tier: 1, confederation: 'UEFA', clubs: 18, quality: 61, clubSpread: 5.5, tvPool: 3.5e8, stadium: 24000, ticket: 24, culture: 'portuguese', tiebreakers: TB_H2H_FIRST, hasSuperCup: true, homeShare: 0.4, foreignPool: ['BRA', 'ARG', 'COL', 'ESP', 'NGA'], squadCostLimit: 0.8 }),
  mkProfile({ id: 'NED1', country: 'NED', countryName: 'Netherlands', name: 'Dutch Premier Division', shortName: 'DPD', tier: 1, confederation: 'UEFA', clubs: 18, quality: 61, clubSpread: 5, tvPool: 2.5e8, stadium: 26000, ticket: 28, culture: 'dutch', tiebreakers: TB_GD, hasSuperCup: true, homeShare: 0.55, squadCostLimit: 0.8 }),
  mkProfile({ id: 'BEL1', country: 'BEL', countryName: 'Belgium', name: 'Belgian Pro League', shortName: 'BPL', tier: 1, hasSuperCup: true, confederation: 'UEFA', clubs: 16, quality: 57, clubSpread: 4, tvPool: 1.2e8, stadium: 18000, ticket: 24, culture: 'dutch', compactClubs: 8, squadCostLimit: 0.8 }),
  mkProfile({ id: 'SCO1', country: 'SCO', countryName: 'Scotland', name: 'Scottish Premiership', shortName: 'SPR', tier: 1, hasSuperCup: true, confederation: 'UEFA', clubs: 12, quality: 52, clubSpread: 5, tvPool: 8e7, stadium: 16000, ticket: 28, culture: 'english', compactClubs: 8, squadCostLimit: 0.85 }),
  mkProfile({ id: 'TUR1', country: 'TUR', countryName: 'Turkey', name: 'Turkish Super League', shortName: 'TSL', tier: 1, hasSuperCup: true, confederation: 'UEFA', clubs: 18, quality: 58, clubSpread: 5, tvPool: 4e8, stadium: 28000, ticket: 22, culture: 'turkish', compactClubs: 8, squadCostLimit: 0.85, transferAggression: 1.1 }),
  // ---- AFC
  mkProfile({ id: 'SAU1', country: 'SAU', countryName: 'Saudi Arabia', name: 'Saudi Pro League', shortName: 'SPL', tier: 1, confederation: 'AFC', clubs: 18, quality: 66, clubSpread: 6, tvPool: 7e8, stadium: 32000, ticket: 22, culture: 'arabic', tiebreakers: TB_H2H_FIRST, hasSuperCup: true,
    investorShare: 0.55, transferAggression: 1.5, homeShare: 0.45, maxForeign: 10, maxSquad: 25, squadCostLimit: null,
    foreignPool: ['POR', 'BRA', 'FRA', 'MAR', 'SRB', 'ESP', 'ENG', 'SEN'], matchdayWeeks: { start: 2, skip: [8, 12, 17, 31, 38] }, transferWindows: [[0, 7], [22, 26]], zone: 'west' }),
  mkProfile({ id: 'SAU2', country: 'SAU', countryName: 'Saudi Arabia', name: 'Saudi First Division', shortName: 'SFD', tier: 2, confederation: 'AFC', clubs: 18, quality: 50, clubSpread: 3.5, tvPool: 4e7, stadium: 12000, ticket: 10, culture: 'arabic', maxForeign: 8, squadCostLimit: null, homeShare: 0.7, investorShare: 0.2, transferAggression: 1.1, zone: 'west', tiebreakers: TB_H2H_FIRST, foreignPool: ['EGY', 'MAR', 'BRA', 'POR'] }),
  mkProfile({ id: 'JPN1', country: 'JPN', countryName: 'Japan', name: 'Japanese Premier League', shortName: 'JPL', tier: 1, hasSuperCup: true, confederation: 'AFC', clubs: 18, quality: 56, clubSpread: 4, tvPool: 2.4e8, stadium: 22000, ticket: 28, culture: 'japanese', zone: 'east', homeShare: 0.8, squadCostLimit: null, maxForeign: 5, compactClubs: 8, foreignPool: ['BRA', 'KOR', 'AUS'] }),
  mkProfile({ id: 'KOR1', country: 'KOR', countryName: 'South Korea', name: 'Korean K-Premier', shortName: 'KPR', tier: 1, confederation: 'AFC', clubs: 12, quality: 54, clubSpread: 4, tvPool: 1.2e8, stadium: 18000, ticket: 14, culture: 'korean', zone: 'east', homeShare: 0.8, squadCostLimit: null, compactClubs: 8, foreignPool: ['BRA', 'JPN', 'AUS'] }),
  mkProfile({ id: 'CHN1', country: 'CHN', countryName: 'China', name: 'Chinese Super League', shortName: 'CSL', tier: 1, hasSuperCup: true, confederation: 'AFC', clubs: 14, quality: 53, clubSpread: 4, tvPool: 1.5e8, stadium: 28000, ticket: 14, culture: 'chinese', zone: 'east', homeShare: 0.7, squadCostLimit: null, compactClubs: 6, foreignPool: ['BRA', 'SRB', 'ESP'] }),
  mkProfile({ id: 'AUS1', country: 'AUS', countryName: 'Australia', name: 'Australian A-League', shortName: 'AAL', tier: 1, confederation: 'AFC', clubs: 10, quality: 50, clubSpread: 3.5, tvPool: 4e7, stadium: 17000, ticket: 24, culture: 'english', zone: 'east', homeShare: 0.7, squadCostLimit: null, compactClubs: 6, foreignPool: ['ENG', 'NZL', 'JPN'] }),
  mkProfile({ id: 'UAE1', country: 'UAE', countryName: 'UAE', name: 'UAE Pro League', shortName: 'UPL', tier: 1, hasSuperCup: true, confederation: 'AFC', clubs: 14, quality: 55, clubSpread: 4.5, tvPool: 1.1e8, stadium: 15000, ticket: 14, culture: 'arabic', zone: 'west', investorShare: 0.5, transferAggression: 1.3, homeShare: 0.5, squadCostLimit: null, maxForeign: 6, compactClubs: 6, foreignPool: ['BRA', 'POR', 'EGY'] }),
  mkProfile({ id: 'QAT1', country: 'QAT', countryName: 'Qatar', name: 'Qatar Stars League', shortName: 'QSL', tier: 1, hasSuperCup: true, confederation: 'AFC', clubs: 12, quality: 53, clubSpread: 4, tvPool: 9e7, stadium: 13000, ticket: 12, culture: 'arabic', zone: 'west', investorShare: 0.6, transferAggression: 1.25, homeShare: 0.5, squadCostLimit: null, maxForeign: 6, compactClubs: 6, foreignPool: ['BRA', 'POR', 'MAR'] }),
  // ---- CAF
  mkProfile({ id: 'EGY1', country: 'EGY', countryName: 'Egypt', name: 'Egyptian Premier League', shortName: 'EPL-E', tier: 1, hasSuperCup: true, confederation: 'CAF', clubs: 16, quality: 54, clubSpread: 5, tvPool: 7e7, stadium: 30000, ticket: 6, culture: 'arabic', homeShare: 0.8, squadCostLimit: null, compactClubs: 6, foreignPool: ['NGA', 'GHA', 'SEN'] }),
  mkProfile({ id: 'MAR1', country: 'MAR', countryName: 'Morocco', name: 'Moroccan Botola', shortName: 'MBO', tier: 1, confederation: 'CAF', clubs: 16, quality: 53, clubSpread: 4.5, tvPool: 5e7, stadium: 25000, ticket: 6, culture: 'arabic', homeShare: 0.8, squadCostLimit: null, compactClubs: 6, foreignPool: ['SEN', 'CIV', 'NGA'] }),
  mkProfile({ id: 'RSA1', country: 'RSA', countryName: 'South Africa', name: 'South African Premiership', shortName: 'SAP', tier: 1, confederation: 'CAF', clubs: 16, quality: 52, clubSpread: 4.5, tvPool: 6e7, stadium: 22000, ticket: 8, culture: 'african', homeShare: 0.75, squadCostLimit: null, compactClubs: 6, foreignPool: ['ZIM', 'ZAM', 'NGA'] }),
  mkProfile({ id: 'TUN1', country: 'TUN', countryName: 'Tunisia', name: 'Tunisian Ligue Pro', shortName: 'TLP', tier: 1, confederation: 'CAF', clubs: 12, quality: 50, clubSpread: 4, tvPool: 2e7, stadium: 18000, ticket: 4, culture: 'arabic', homeShare: 0.85, squadCostLimit: null, compactClubs: 6, foreignPool: ['ALG', 'CIV', 'NGA'] }),
  mkProfile({ id: 'ALG1', country: 'ALG', countryName: 'Algeria', name: 'Algerian Ligue 1', shortName: 'AL1', tier: 1, confederation: 'CAF', clubs: 12, quality: 50, clubSpread: 4, tvPool: 2e7, stadium: 20000, ticket: 4, culture: 'arabic', homeShare: 0.9, squadCostLimit: null, compactClubs: 4, foreignPool: ['TUN', 'MAR'] }),
  // ---- CONCACAF
  mkProfile({ id: 'USA1', country: 'USA', countryName: 'United States', name: 'Major League Soccer', shortName: 'MLS', tier: 1, confederation: 'CONCACAF', clubs: 30, compactClubs: 10, quality: 59, clubSpread: 3.5, tvPool: 6e8, stadium: 25000, ticket: 45, culture: 'english', legs: 1, hasSuperCup: false, homeShare: 0.5, maxForeign: 8, squadCostLimit: null, investorShare: 0.3, matchdayWeeks: { start: 8, skip: [12, 17, 22, 31, 38] }, transferWindows: [[0, 5], [22, 26]], foreignPool: ['ARG', 'BRA', 'COL', 'MEX', 'ENG'] }),
  mkProfile({ id: 'MEX1', country: 'MEX', countryName: 'Mexico', name: 'Mexican Liga Primera', shortName: 'LMP', tier: 1, hasSuperCup: true, confederation: 'CONCACAF', clubs: 18, quality: 58, clubSpread: 4, tvPool: 3e8, stadium: 35000, ticket: 20, culture: 'spanish', homeShare: 0.7, squadCostLimit: null, compactClubs: 8, foreignPool: ['ARG', 'COL', 'URU', 'CHI'] }),
  mkProfile({ id: 'CRC1', country: 'CRC', countryName: 'Costa Rica', name: 'Costa Rican Primera', shortName: 'CRP', tier: 1, confederation: 'CONCACAF', clubs: 10, quality: 47, clubSpread: 3.5, tvPool: 1e7, stadium: 12000, ticket: 6, culture: 'spanish', homeShare: 0.85, squadCostLimit: null, compactClubs: 6, foreignPool: ['COL', 'PAN'] }),
  mkProfile({ id: 'CAM1', country: 'CAM', countryName: 'Central America & Caribbean', name: 'Central American Premier', shortName: 'CAP', tier: 1, confederation: 'CONCACAF', clubs: 10, quality: 45, clubSpread: 3.5, tvPool: 8e6, stadium: 10000, ticket: 5, culture: 'spanish', homeShare: 0.85, squadCostLimit: null, compactClubs: 6, foreignPool: ['COL', 'CRC'] }),
  // ---- CONMEBOL
  mkProfile({ id: 'BRA1', country: 'BRA', countryName: 'Brazil', name: 'Brazilian Serie A', shortName: 'BSA', tier: 1, confederation: 'CONMEBOL', clubs: 20, quality: 62, clubSpread: 5, tvPool: 6e8, stadium: 40000, ticket: 14, culture: 'brazilian', hasSuperCup: true, homeShare: 0.85, squadCostLimit: null, matchdayWeeks: { start: 8, skip: [12, 17, 22, 31, 38] }, transferWindows: [[0, 5], [22, 26]], foreignPool: ['ARG', 'URU', 'COL', 'CHI'], compactClubs: 10 }),
  mkProfile({ id: 'ARG1', country: 'ARG', countryName: 'Argentina', name: 'Argentine Primera', shortName: 'ARP', tier: 1, hasSuperCup: true, confederation: 'CONMEBOL', clubs: 16, quality: 58, clubSpread: 4.5, tvPool: 1.5e8, stadium: 35000, ticket: 10, culture: 'spanish', homeShare: 0.85, squadCostLimit: null, compactClubs: 8, foreignPool: ['URU', 'PAR', 'COL'] }),
  mkProfile({ id: 'COL1', country: 'COL', countryName: 'Colombia', name: 'Colombian Primera', shortName: 'COP', tier: 1, confederation: 'CONMEBOL', clubs: 12, quality: 52, clubSpread: 4, tvPool: 5e7, stadium: 25000, ticket: 8, culture: 'spanish', homeShare: 0.85, squadCostLimit: null, compactClubs: 6, foreignPool: ['ARG', 'URU', 'VEN'] }),
  mkProfile({ id: 'CHI1', country: 'CHI', countryName: 'Chile', name: 'Chilean Primera', shortName: 'CHP', tier: 1, confederation: 'CONMEBOL', clubs: 12, quality: 51, clubSpread: 4, tvPool: 4e7, stadium: 20000, ticket: 8, culture: 'spanish', homeShare: 0.8, squadCostLimit: null, compactClubs: 6, foreignPool: ['ARG', 'COL', 'URU'] }),
  mkProfile({ id: 'URU1', country: 'URU', countryName: 'Uruguay', name: 'Uruguayan Primera', shortName: 'URP', tier: 1, confederation: 'CONMEBOL', clubs: 12, quality: 50, clubSpread: 4, tvPool: 3e7, stadium: 18000, ticket: 6, culture: 'spanish', homeShare: 0.85, squadCostLimit: null, compactClubs: 6, foreignPool: ['ARG', 'BRA', 'COL'] }),
  // ---- OFC
  mkProfile({ id: 'NZL1', country: 'NZL', countryName: 'New Zealand', name: 'New Zealand Premiership', shortName: 'NZP', tier: 1, confederation: 'OFC', clubs: 10, quality: 45, clubSpread: 3, tvPool: 5e6, stadium: 8000, ticket: 8, culture: 'english', homeShare: 0.8, squadCostLimit: null, compactClubs: 6, foreignPool: ['AUS', 'FIJ'] }),
  mkProfile({ id: 'FIJ1', country: 'FIJ', countryName: 'Pacific Islands', name: 'Pacific Premier League', shortName: 'PPL-O', tier: 1, confederation: 'OFC', clubs: 8, quality: 42, clubSpread: 3, tvPool: 3e6, stadium: 6000, ticket: 4, culture: 'pacific', homeShare: 0.9, squadCostLimit: null, compactClubs: 6, foreignPool: ['NZL', 'PNG'] }),
  // ================================================================ EXTENDED UNIVERSE (opt-in, appended so core worlds are unchanged)
  // ---- second tiers (pyramid partners of PYRAMIDS below; no continental entry, enter the domestic cup of their country)
  mkProfile({ id: 'ESP2', country: 'ESP', countryName: 'Spain', name: 'Spanish Segunda', shortName: 'ESG', tier: 2, confederation: 'UEFA', clubs: 22, quality: 56, clubSpread: 3.5, tvPool: 2.2e8, stadium: 14000, ticket: 22, culture: 'spanish', tiebreakers: TB_H2H_FIRST, homeShare: 0.65, squadCostLimit: 0.9, maxForeign: 7, extended: true }),
  mkProfile({ id: 'ITA2', country: 'ITA', countryName: 'Italy', name: 'Italian Serie Beta', shortName: 'ITB', tier: 2, confederation: 'UEFA', clubs: 20, quality: 55, clubSpread: 3.5, tvPool: 1.4e8, stadium: 12000, ticket: 20, culture: 'italian', tiebreakers: TB_H2H_FIRST, homeShare: 0.65, squadCostLimit: 0.9, maxForeign: 8, extended: true }),
  mkProfile({ id: 'GER2', country: 'GER', countryName: 'Germany', name: 'German Second League', shortName: 'GSL', tier: 2, confederation: 'UEFA', clubs: 18, quality: 55, clubSpread: 3.5, tvPool: 3e8, stadium: 22000, ticket: 24, culture: 'german', tiebreakers: TB_GD, homeShare: 0.65, squadCostLimit: 0.9, matchdayWeeks: { start: 2, skip: [8, 12, 17, 18, 19, 31, 38] }, extended: true }),
  mkProfile({ id: 'FRA2', country: 'FRA', countryName: 'France', name: 'French League Two', shortName: 'FL2', tier: 2, confederation: 'UEFA', clubs: 18, quality: 52, clubSpread: 3.5, tvPool: 7e7, stadium: 10000, ticket: 18, culture: 'french', tiebreakers: TB_GD, homeShare: 0.65, squadCostLimit: 0.9, foreignPool: ['MAR', 'SEN', 'CIV', 'BRA'], extended: true }),
  mkProfile({ id: 'POR2', country: 'POR', countryName: 'Portugal', name: 'Portuguese Second League', shortName: 'PSL', tier: 2, confederation: 'UEFA', clubs: 18, quality: 49, clubSpread: 3.5, tvPool: 3e7, stadium: 5000, ticket: 12, culture: 'portuguese', tiebreakers: TB_H2H_FIRST, homeShare: 0.6, squadCostLimit: 0.9, maxForeign: 9, foreignPool: ['BRA', 'ARG', 'COL', 'ESP'], extended: true }),
  mkProfile({ id: 'NED2', country: 'NED', countryName: 'Netherlands', name: 'Dutch First Division', shortName: 'DFD', tier: 2, confederation: 'UEFA', clubs: 18, quality: 49, clubSpread: 3.5, tvPool: 3e7, stadium: 5500, ticket: 16, culture: 'dutch', tiebreakers: TB_GD, homeShare: 0.7, squadCostLimit: 0.9, extended: true }),
  mkProfile({ id: 'BRA2', country: 'BRA', countryName: 'Brazil', name: 'Brazilian Serie B', shortName: 'BSB', tier: 2, confederation: 'CONMEBOL', clubs: 20, quality: 52, clubSpread: 3.5, tvPool: 6e7, stadium: 17000, ticket: 8, culture: 'brazilian', homeShare: 0.9, squadCostLimit: null, matchdayWeeks: { start: 8, skip: [12, 17, 22, 31, 38] }, transferWindows: [[0, 5], [22, 26]], foreignPool: ['ARG', 'URU', 'COL', 'CHI'], extended: true }),
  mkProfile({ id: 'TUR2', country: 'TUR', countryName: 'Turkey', name: 'Turkish First League', shortName: 'TFL', tier: 2, confederation: 'UEFA', clubs: 18, quality: 49, clubSpread: 3.5, tvPool: 5e7, stadium: 9000, ticket: 10, culture: 'turkish', homeShare: 0.7, squadCostLimit: 0.9, maxForeign: 8, extended: true }),
  mkProfile({ id: 'SCO2', country: 'SCO', countryName: 'Scotland', name: 'Scottish Championship', shortName: 'SCH', tier: 2, confederation: 'UEFA', clubs: 10, quality: 44, clubSpread: 3.5, tvPool: 1.5e7, stadium: 4500, ticket: 18, culture: 'english', homeShare: 0.75, squadCostLimit: 0.9, extended: true }),
  mkProfile({ id: 'JPN2', country: 'JPN', countryName: 'Japan', name: 'Japanese Second League', shortName: 'JSL', tier: 2, confederation: 'AFC', clubs: 20, quality: 47, clubSpread: 3.5, tvPool: 5e7, stadium: 9000, ticket: 14, culture: 'japanese', zone: 'east', homeShare: 0.85, squadCostLimit: null, maxForeign: 5, foreignPool: ['BRA', 'KOR', 'AUS'], extended: true }),
  // ---- UEFA first divisions
  mkProfile({ id: 'SUI1', country: 'SUI', countryName: 'Switzerland', name: 'Swiss Super League', shortName: 'SSL', tier: 1, confederation: 'UEFA', clubs: 12, compactClubs: 6, quality: 53, clubSpread: 4.2, tvPool: 7e7, stadium: 14000, ticket: 30, culture: 'german', homeShare: 0.5, squadCostLimit: 0.85, foreignPool: ['FRA', 'GER', 'BRA', 'SRB', 'NGA'], extended: true }),
  mkProfile({ id: 'AUT1', country: 'AUT', countryName: 'Austria', name: 'Austrian Bundesliga', shortName: 'ABL', tier: 1, confederation: 'UEFA', clubs: 12, compactClubs: 6, quality: 52, clubSpread: 4.2, tvPool: 6e7, stadium: 13000, ticket: 26, culture: 'german', homeShare: 0.55, squadCostLimit: 0.85, foreignPool: ['GER', 'SRB', 'CRO', 'BRA', 'NGA'], extended: true }),
  mkProfile({ id: 'GRE1', country: 'GRE', countryName: 'Greece', name: 'Greek Super League', shortName: 'GSU', tier: 1, confederation: 'UEFA', clubs: 14, compactClubs: 6, quality: 51, clubSpread: 4.5, tvPool: 6e7, stadium: 17000, ticket: 18, culture: 'greek', homeShare: 0.5, squadCostLimit: 0.85, transferAggression: 1.05, foreignPool: ['BRA', 'ARG', 'SRB', 'FRA', 'NGA'], extended: true }),
  mkProfile({ id: 'UKR1', country: 'UKR', countryName: 'Ukraine', name: 'Ukrainian Premier League', shortName: 'UPR', tier: 1, confederation: 'UEFA', clubs: 16, compactClubs: 6, quality: 51, clubSpread: 4.5, tvPool: 3.5e7, stadium: 14000, ticket: 9, culture: 'slavic', hasSuperCup: true, homeShare: 0.6, squadCostLimit: 0.85, foreignPool: ['BRA', 'POL', 'CRO', 'NGA'], extended: true }),
  mkProfile({ id: 'DEN1', country: 'DEN', countryName: 'Denmark', name: 'Danish Superliga', shortName: 'DSL', tier: 1, confederation: 'UEFA', clubs: 12, compactClubs: 6, quality: 52, clubSpread: 4, tvPool: 6e7, stadium: 12000, ticket: 28, culture: 'nordic', homeShare: 0.6, squadCostLimit: 0.85, foreignPool: ['SWE', 'NOR', 'NGA', 'BRA', 'ENG'], extended: true }),
  mkProfile({ id: 'SWE1', country: 'SWE', countryName: 'Sweden', name: 'Swedish Allsvenskan', shortName: 'SAL', tier: 1, confederation: 'UEFA', clubs: 16, compactClubs: 6, quality: 50, clubSpread: 4, tvPool: 4e7, stadium: 11000, ticket: 24, culture: 'nordic', homeShare: 0.65, squadCostLimit: 0.85, foreignPool: ['DEN', 'NOR', 'NGA', 'BRA'], extended: true }),
  mkProfile({ id: 'NOR1', country: 'NOR', countryName: 'Norway', name: 'Norwegian Eliteserien', shortName: 'NEL', tier: 1, confederation: 'UEFA', clubs: 16, compactClubs: 6, quality: 49, clubSpread: 4, tvPool: 4e7, stadium: 9000, ticket: 30, culture: 'nordic', homeShare: 0.65, squadCostLimit: 0.85, foreignPool: ['SWE', 'DEN', 'NGA', 'ENG'], extended: true }),
  mkProfile({ id: 'POL1', country: 'POL', countryName: 'Poland', name: 'Polish Ekstraliga', shortName: 'PEK', tier: 1, confederation: 'UEFA', clubs: 18, compactClubs: 6, quality: 50, clubSpread: 4.2, tvPool: 4.5e7, stadium: 15000, ticket: 14, culture: 'slavic', hasSuperCup: true, homeShare: 0.6, squadCostLimit: 0.85, foreignPool: ['CZE', 'SRB', 'BRA', 'ESP', 'NGA'], extended: true }),
  mkProfile({ id: 'CZE1', country: 'CZE', countryName: 'Czechia', name: 'Czech First League', shortName: 'CFL', tier: 1, confederation: 'UEFA', clubs: 16, compactClubs: 6, quality: 50, clubSpread: 4.2, tvPool: 3.5e7, stadium: 10000, ticket: 14, culture: 'slavic', homeShare: 0.65, squadCostLimit: 0.85, foreignPool: ['POL', 'SRB', 'BRA', 'NGA'], extended: true }),
  mkProfile({ id: 'CRO1', country: 'CRO', countryName: 'Croatia', name: 'Croatian First League', shortName: 'CRL', tier: 1, confederation: 'UEFA', clubs: 10, compactClubs: 6, quality: 49, clubSpread: 4, tvPool: 2.5e7, stadium: 9000, ticket: 12, culture: 'slavic', hasSuperCup: true, homeShare: 0.65, squadCostLimit: 0.85, foreignPool: ['SRB', 'BRA', 'POL', 'NGA'], extended: true }),
  mkProfile({ id: 'SRB1', country: 'SRB', countryName: 'Serbia', name: 'Serbian SuperLiga', shortName: 'SRL', tier: 1, confederation: 'UEFA', clubs: 16, compactClubs: 6, quality: 49, clubSpread: 4.5, tvPool: 2.5e7, stadium: 12000, ticket: 8, culture: 'slavic', homeShare: 0.65, squadCostLimit: 0.85, foreignPool: ['BRA', 'NGA', 'CRO', 'POL'], extended: true }),
  // ---- AFC first divisions
  mkProfile({ id: 'IRN1', country: 'IRN', countryName: 'Iran', name: 'Iranian Pro League', shortName: 'IPL', tier: 1, confederation: 'AFC', clubs: 16, compactClubs: 6, quality: 51, clubSpread: 4.5, tvPool: 3e7, stadium: 26000, ticket: 4, culture: 'persian', hasSuperCup: true, zone: 'west', homeShare: 0.9, squadCostLimit: null, maxForeign: 4, foreignPool: ['BRA', 'IRQ', 'UZB'], extended: true }),
  mkProfile({ id: 'UZB1', country: 'UZB', countryName: 'Uzbekistan', name: 'Uzbek Super League', shortName: 'USL', tier: 1, confederation: 'AFC', clubs: 14, compactClubs: 6, quality: 48, clubSpread: 4, tvPool: 1.5e7, stadium: 14000, ticket: 4, culture: 'persian', hasSuperCup: true, zone: 'west', homeShare: 0.85, squadCostLimit: null, maxForeign: 6, foreignPool: ['IRN', 'BRA', 'SRB', 'UKR'], extended: true }),
  mkProfile({ id: 'THA1', country: 'THA', countryName: 'Thailand', name: 'Thai League One', shortName: 'TL1', tier: 1, confederation: 'AFC', clubs: 16, compactClubs: 6, quality: 47, clubSpread: 4, tvPool: 3e7, stadium: 10000, ticket: 8, culture: 'thai', hasSuperCup: true, zone: 'east', homeShare: 0.8, squadCostLimit: null, maxForeign: 5, foreignPool: ['BRA', 'JPN', 'KOR'], extended: true }),
  mkProfile({ id: 'IND1', country: 'IND', countryName: 'India', name: 'Indian Super League', shortName: 'ISL', tier: 1, confederation: 'AFC', clubs: 12, compactClubs: 6, quality: 45, clubSpread: 4, tvPool: 4e7, stadium: 18000, ticket: 4, culture: 'indian', zone: 'east', homeShare: 0.8, squadCostLimit: null, maxForeign: 6, foreignPool: ['BRA', 'ESP', 'AUS'], extended: true }),
  // ---- CAF first divisions
  mkProfile({ id: 'NGA1', country: 'NGA', countryName: 'Nigeria', name: 'Nigerian Premier League', shortName: 'NPL', tier: 1, confederation: 'CAF', clubs: 16, compactClubs: 6, quality: 47, clubSpread: 4.5, tvPool: 1.5e7, stadium: 18000, ticket: 2, culture: 'african', hasSuperCup: true, homeShare: 0.92, squadCostLimit: null, foreignPool: ['GHA', 'CMR', 'SEN'], extended: true }),
  mkProfile({ id: 'GHA1', country: 'GHA', countryName: 'Ghana', name: 'Ghanaian Premier League', shortName: 'GPL', tier: 1, confederation: 'CAF', clubs: 14, compactClubs: 6, quality: 46, clubSpread: 4, tvPool: 1e7, stadium: 12000, ticket: 2, culture: 'african', homeShare: 0.9, squadCostLimit: null, foreignPool: ['NGA', 'CIV', 'SEN'], extended: true }),
  mkProfile({ id: 'SEN1', country: 'SEN', countryName: 'Senegal', name: 'Senegalese Ligue 1', shortName: 'SL1', tier: 1, confederation: 'CAF', clubs: 12, compactClubs: 6, quality: 46, clubSpread: 4, tvPool: 8e6, stadium: 10000, ticket: 2, culture: 'african', homeShare: 0.88, squadCostLimit: null, foreignPool: ['CIV', 'MLI', 'CMR'], extended: true }),
  // ---- CONCACAF / CONMEBOL first divisions
  mkProfile({ id: 'CAN1', country: 'CAN', countryName: 'Canada', name: 'Canadian Premier League', shortName: 'CPL', tier: 1, confederation: 'CONCACAF', clubs: 8, compactClubs: 6, quality: 46, clubSpread: 3.5, tvPool: 2e7, stadium: 8000, ticket: 22, culture: 'english', homeShare: 0.5, squadCostLimit: null, maxForeign: 7, foreignPool: ['USA', 'ENG', 'BRA', 'MEX'], extended: true }),
  mkProfile({ id: 'ECU1', country: 'ECU', countryName: 'Ecuador', name: 'Ecuadorian Serie A', shortName: 'ESA', tier: 1, confederation: 'CONMEBOL', clubs: 16, compactClubs: 6, quality: 50, clubSpread: 4, tvPool: 3e7, stadium: 22000, ticket: 8, culture: 'spanish', homeShare: 0.8, squadCostLimit: null, foreignPool: ['COL', 'ARG', 'URU', 'BRA'], extended: true }),
  mkProfile({ id: 'PAR1', country: 'PAR', countryName: 'Paraguay', name: 'Paraguayan Primera', shortName: 'PAP', tier: 1, confederation: 'CONMEBOL', clubs: 12, compactClubs: 6, quality: 49, clubSpread: 4, tvPool: 2e7, stadium: 14000, ticket: 6, culture: 'spanish', hasSuperCup: true, homeShare: 0.85, squadCostLimit: null, foreignPool: ['ARG', 'URU', 'COL', 'BRA'], extended: true }),
  mkProfile({ id: 'PER1', country: 'PER', countryName: 'Peru', name: 'Peruvian Liga 1', shortName: 'PL1', tier: 1, confederation: 'CONMEBOL', clubs: 18, compactClubs: 6, quality: 48, clubSpread: 4, tvPool: 2e7, stadium: 20000, ticket: 7, culture: 'spanish', homeShare: 0.85, squadCostLimit: null, foreignPool: ['COL', 'ARG', 'URU', 'CHI'], extended: true }),
];

export const LEAGUE_BY_ID: Record<string, LeagueProfile> = Object.fromEntries(LEAGUE_PROFILES.map((l) => [l.id, l]));

/** Domestic pyramids: automatic promotion/relegation between linked tiers. */
export interface PyramidLink {
  upper: string;
  lower: string;
  /** Number of clubs swapped. */
  swap: number;
  /** The 'standard' preset adds the lower tier automatically when the upper tier is enabled (default true). */
  auto?: boolean;
}
export const PYRAMIDS: PyramidLink[] = [
  { upper: 'ENG1', lower: 'ENG2', swap: 3 },
  { upper: 'SAU1', lower: 'SAU2', swap: 3 },
  // Extended pyramids: opt-in (`auto: false`), the lower tier is enabled by listing it in `WorldConfig.leagues`
  // (or by `defaultWorldConfig(..., 'extended')`). MLS (USA1) has no promotion/relegation and deliberately has no link.
  { upper: 'ESP1', lower: 'ESP2', swap: 3, auto: false },
  { upper: 'ITA1', lower: 'ITA2', swap: 3, auto: false },
  { upper: 'GER1', lower: 'GER2', swap: 2, auto: false },
  { upper: 'FRA1', lower: 'FRA2', swap: 3, auto: false },
  { upper: 'POR1', lower: 'POR2', swap: 2, auto: false },
  { upper: 'NED1', lower: 'NED2', swap: 2, auto: false },
  { upper: 'BRA1', lower: 'BRA2', swap: 3, auto: false },
  { upper: 'TUR1', lower: 'TUR2', swap: 3, auto: false },
  { upper: 'SCO1', lower: 'SCO2', swap: 2, auto: false },
  { upper: 'JPN1', lower: 'JPN2', swap: 2, auto: false },
];

// ---------------------------------------------------------------- competition builders

const UNVERIFIED = (note: string) => ({ status: 'unverified-default' as const, note });

function ruleBase(over: Partial<RuleSet> & Pick<RuleSet, 'entrants' | 'stages'>): RuleSet {
  return {
    fromSeason: 1, minEntrants: 2, pointsForWin: 3,
    squad: { maxSquadSize: 30, maxForeignRegistered: null, minHomegrown: null, maxLoanIn: 6 },
    discipline: { yellowsForBan: 5, resetAfterRound: null },
    prize: { positions: [], perMatch: 0, perWin: 0 }, tvPool: 0, squadCostRatioLimit: null, transferWindows: EU_WINDOWS,
    ...over,
  };
}

/**
 * Weekly Saturday rounds; when the league has more rounds than free weeks, midweek (Tuesday) rounds are added in
 * evenly spaced weeks so that the season still ends by `lastWeek`.
 */
function leagueSchedule(rounds: number, startWeek: number, skip: number[], lastWeek: number): ScheduleSpec {
  const free: number[] = [];
  for (let w = startWeek; w <= lastWeek; w++) if (!skip.includes(w)) free.push(w);
  const extra = Math.max(0, rounds - free.length);
  const doubles = new Set<number>();
  for (let i = 0; i < extra; i++) doubles.add(free[Math.floor(((i + 0.5) * free.length) / extra)] as number);
  const weeks: number[] = [];
  const dows: number[] = [];
  for (const w of free) {
    if (doubles.has(w)) { weeks.push(w, w); dows.push(1, 5); } else { weeks.push(w); dows.push(5); }
  }
  return { startWeek, weekStep: 1, dow: 5, weeks, dows };
}

function leagueDef(p: LeagueProfile): CompetitionDef {
  const isMls = p.id === 'USA1';
  const rounds = (p.legs === 2 ? 2 : 1) * (p.clubs % 2 === 0 ? p.clubs - 1 : p.clubs);
  const schedule: ScheduleSpec = rounds > 40
    ? leagueSchedule(rounds, p.matchdayWeeks.start, p.matchdayWeeks.skip, 43)
    : { startWeek: p.matchdayWeeks.start, weekStep: 1, dow: 5, altDow: 6, skipWeeks: p.matchdayWeeks.skip };
  const table: RoundRobinStage = {
    id: 'league', name: 'League', type: 'roundRobin', legs: p.legs, tiebreakers: p.tiebreakers, schedule, ...(isMls ? { advance: 8 } : {}),
  };
  const stages: StageDef[] = [table];
  if (isMls) {
    stages.push({
      id: 'playoffs', name: 'Playoffs', type: 'knockout', legs: 1, finalSingle: true, extraTime: true, penalties: true, awayGoalsRule: false,
      pairing: 'seeded', neutralFinal: false, byes: true, schedule: { startWeek: 43, weekStep: 1, dow: 5, weeks: [43, 44, 45, 46] },
    } satisfies KnockoutStage);
  }
  const tvPerPos = p.tvPool * 0.45;
  const positions: number[] = [];
  for (let i = 0; i < p.clubs; i++) positions.push(Math.round((tvPerPos / p.clubs) * (1.9 - (1.8 * i) / Math.max(1, p.clubs - 1)) * 0.5));
  return {
    id: p.id, name: p.name, shortName: p.shortName, kind: 'league', confederation: p.confederation, country: p.country, tier: p.tier,
    period: 1, firstSeason: 1, priority: 10,
    verification: p.country === 'SAU'
      ? UNVERIFIED('Saudi Pro League configured as a first-class competition: 18 clubs, double round-robin, head-to-head tiebreaks, foreign-player registration cap and investor-driven finances. All numeric rules are scenario defaults, not verified against current Saudi FA regulations.')
      : UNVERIFIED('League format, tiebreakers and registration limits are scenario defaults; clubs and players are fictional.'),
    rules: [ruleBase({
      entrants: p.clubs, minEntrants: 4, stages,
      squad: { maxSquadSize: p.maxSquad, maxForeignRegistered: p.maxForeign, minHomegrown: p.minHomegrown, maxLoanIn: 4 },
      prize: { positions, perMatch: 0, perWin: 0 }, tvPool: p.tvPool, squadCostRatioLimit: p.squadCostLimit, transferWindows: p.transferWindows,
    })],
  };
}

/** Nominal cup field: every club of the national pyramid (top tier plus the linked lower tiers). */
function cupField(p: LeagueProfile): number {
  let n = p.clubs;
  for (const link of PYRAMIDS) if (link.upper === p.id) n += LEAGUE_BY_ID[link.lower]?.clubs ?? 0;
  return n;
}

function cupDef(p: LeagueProfile): CompetitionDef {
  return {
    id: `${p.country}-CUP`, name: `${p.countryName} Cup`, shortName: `${p.country} Cup`, kind: 'cup', confederation: p.confederation, country: p.country, tier: null,
    period: 1, firstSeason: 1, priority: 20,
    verification: UNVERIFIED('Simplified single-elimination cup drawn at random each round; all clubs of the national pyramid (every enabled tier) enter, top seeds receive byes. Rounds are placed in the calendar counted back from the final, so a pyramid of any size gets a realistic round structure.'),
    rules: [ruleBase({
      entrants: cupField(p), minEntrants: 4,
      stages: [{
        id: 'cup', name: 'Cup', type: 'knockout', legs: 1, finalSingle: true, extraTime: true, penalties: true, awayGoalsRule: false,
        pairing: 'random', neutralFinal: true, byes: true,
        // semi-final wk 39, quarter-final wk 25, then R16 21, R32 17, R64 13, R128 9, R256 7 (odd weeks keep clear of UCL/Sudamericana midweeks)
        schedule: { startWeek: 9, weekStep: 4, dow: 2, weeksFromFinal: [39, 25, 21, 17, 13, 9, 7], finalWeek: 44, finalDow: 5 },
      }],
      prize: { positions: [], perMatch: 150000, perWin: 400000 },
    })],
  };
}

function superCupDef(p: LeagueProfile): CompetitionDef {
  return {
    id: `${p.country}-SC`, name: `${p.countryName} Super Cup`, shortName: `${p.country} SC`, kind: 'superCup', confederation: p.confederation, country: p.country, tier: null,
    period: 1, firstSeason: 2, priority: 5,
    verification: UNVERIFIED('One match between the previous champion and previous cup winner (next best league finisher if the same club).'),
    rules: [ruleBase({
      entrants: 2, minEntrants: 2,
      stages: [{
        id: 'final', name: 'Super Cup', type: 'knockout', legs: 1, finalSingle: true, extraTime: false, penalties: true, awayGoalsRule: false,
        pairing: 'seeded', neutralFinal: true, byes: false, schedule: { startWeek: 1, weekStep: 1, dow: 5, finalWeek: 1, finalDow: 5 },
      }],
      prize: { positions: [], perMatch: 500000, perWin: 1000000 },
    })],
  };
}

// ---------------------------------------------------------------- continental competitions

const KO_NOTE = 'Format approximates the real competition; qualification slot counts are scenario defaults and qualifying rounds are not simulated (remaining places are filled by club reputation).';

function uefaPair(id: string, name: string, shortName: string, dow: number, finalWeek: number, finalDow: number, prizeScale: number): CompetitionDef {
  const leaguePhase: LeaguePhaseStage = {
    id: 'league', name: 'League Phase', type: 'leaguePhase', matches: 8, pots: 4,
    tiebreakers: ['points', 'goalDifference', 'goalsFor', 'awayGoals', 'wins', 'fairPlay', 'drawLots'],
    maxSameCountryOpponents: 2, advanceDirect: 8, advancePlayoff: 16,
    schedule: { startWeek: 6, weekStep: 2, dow, altDow: dow === 1 ? 2 : undefined },
  };
  const playoff: KnockoutStage = {
    id: 'playoff', name: 'Knockout Play-off', type: 'knockout', legs: 2, finalSingle: false, extraTime: true, penalties: true, awayGoalsRule: false,
    pairing: 'playoffSeeded', neutralFinal: false, byes: false, schedule: { startWeek: 24, weekStep: 1, dow, altDow: dow === 1 ? 2 : undefined, weeks: [24], legGapWeeks: 1 },
  };
  const ko: KnockoutStage = {
    id: 'knockout', name: 'Knockout Phase', type: 'knockout', legs: 2, finalSingle: true, extraTime: true, penalties: true, awayGoalsRule: false,
    pairing: 'leaguePhaseBracket', neutralFinal: true, byes: false,
    schedule: { startWeek: 28, weekStep: 4, dow, altDow: dow === 1 ? 2 : undefined, weeks: [28, 32, 36], legGapWeeks: 1, finalWeek, finalDow },
  };
  return {
    id, name, shortName, kind: 'continental', confederation: 'UEFA', country: null, tier: null, period: 1, firstSeason: 1, priority: 1,
    verification: UNVERIFIED(`36-club league phase (8 matches, 4 pots), top 8 to round of 16, 9th-24th to a two-legged play-off, final at a neutral venue. ${KO_NOTE}`),
    rules: [ruleBase({
      entrants: 36, minEntrants: 16, stages: [leaguePhase, playoff, ko],
      prize: { positions: [], perMatch: Math.round(2.1e6 * prizeScale), perWin: Math.round(2.1e6 * prizeScale) },
    })],
  };
}

function acle(): CompetitionDef {
  const lp: LeaguePhaseStage = {
    id: 'league', name: 'League Stage', type: 'leaguePhase', matches: 8, pots: 4, zones: [{ id: 'west', name: 'West' }, { id: 'east', name: 'East' }],
    tiebreakers: ['points', 'goalDifference', 'goalsFor', 'wins', 'fairPlay', 'drawLots'], maxSameCountryOpponents: 99, advanceDirect: 8, advancePlayoff: 0,
    schedule: { startWeek: 6, weekStep: 2, dow: 0, altDow: 1 },
  };
  const ko: KnockoutStage = {
    id: 'knockout', name: 'Knockout Stage', type: 'knockout', legs: 2, finalSingle: true, extraTime: true, penalties: true, awayGoalsRule: false,
    pairing: 'zonalSeeded', neutralFinal: true, byes: false, schedule: { startWeek: 28, weekStep: 4, dow: 1, weeks: [28, 32, 36], legGapWeeks: 1, finalWeek: 40, finalDow: 4 },
  };
  return {
    id: 'ACLE', name: 'AFC Champions League Elite', shortName: 'ACLE', kind: 'continental', confederation: 'AFC', country: null, tier: null, period: 1, firstSeason: 1, priority: 1,
    verification: UNVERIFIED(`24 clubs in West and East zones (12 each), 8 matches each, top 8 per zone to knockout. ${KO_NOTE}`),
    rules: [ruleBase({ entrants: 24, minEntrants: 8, stages: [lp, ko], prize: { positions: [], perMatch: 1.2e6, perWin: 1.2e6 } })],
  };
}

function groupsKo(args: {
  id: string; name: string; short: string; conf: Confederation; groups: number; groupLegs: 1 | 2; advance: number; entrants: number; min: number;
  groupWeeks: number[]; groupDow: number; koWeeks: number[]; finalWeek: number; finalDow: number; koDow: number; priority: number; prize: number; note?: string; koLegs?: 1 | 2;
}): CompetitionDef {
  const groups: GroupsStage = {
    id: 'groups', name: 'Group Stage', type: 'groups', groups: args.groups, legs: args.groupLegs, advance: args.advance, pots: args.entrants / args.groups,
    tiebreakers: ['points', 'h2hPoints', 'h2hGoalDifference', 'h2hGoalsFor', 'goalDifference', 'goalsFor', 'awayGoals', 'fairPlay', 'drawLots'], avoidSameCountry: true,
    schedule: { startWeek: args.groupWeeks[0] ?? 7, weekStep: 2, dow: args.groupDow, weeks: args.groupWeeks },
  };
  const ko: KnockoutStage = {
    id: 'knockout', name: 'Knockout Stage', type: 'knockout', legs: args.koLegs ?? 2, finalSingle: true, extraTime: true, penalties: true, awayGoalsRule: false,
    pairing: 'regionalSeeded', neutralFinal: true, byes: false, schedule: { startWeek: args.koWeeks[0] ?? 26, weekStep: 4, dow: args.koDow, weeks: args.koWeeks, legGapWeeks: 1, finalWeek: args.finalWeek, finalDow: args.finalDow },
  };
  return {
    id: args.id, name: args.name, shortName: args.short, kind: 'continental', confederation: args.conf, country: null, tier: null, period: 1, firstSeason: 1, priority: args.priority,
    verification: UNVERIFIED(`${args.entrants} clubs in ${args.groups} groups of ${args.entrants / args.groups}, top ${args.advance} advance to knockout rounds. ${args.note ?? ''} ${KO_NOTE}`),
    rules: [ruleBase({ entrants: args.entrants, minEntrants: Math.max(8, args.groups * 2), stages: [groups, ko], prize: { positions: [], perMatch: args.prize, perWin: args.prize } })],
  };
}

function concacafCup(): CompetitionDef {
  const ko: KnockoutStage = {
    id: 'knockout', name: 'Champions Cup', type: 'knockout', legs: 2, finalSingle: true, extraTime: true, penalties: true, awayGoalsRule: false,
    pairing: 'seeded', neutralFinal: false, byes: true, schedule: { startWeek: 24, weekStep: 4, dow: 1, weeks: [18, 24, 28, 32, 36], legGapWeeks: 1, finalWeek: 41, finalDow: 5 },
  };
  return {
    id: 'CCC', name: 'Concacaf Champions Cup', shortName: 'CCC', kind: 'continental', confederation: 'CONCACAF', country: null, tier: null, period: 1, firstSeason: 1, priority: 1,
    verification: UNVERIFIED(`Simplified: 27-club two-legged knockout with byes for top seeds. The real competition's exact round structure differs. ${KO_NOTE}`),
    rules: [ruleBase({ entrants: 27, minEntrants: 8, stages: [ko], prize: { positions: [], perMatch: 1e6, perWin: 1e6 } })],
  };
}

function oflCup(): CompetitionDef {
  const groups: GroupsStage = {
    id: 'groups', name: 'Group Stage', type: 'groups', groups: 2, legs: 1, advance: 2, pots: 4, avoidSameCountry: false,
    tiebreakers: ['points', 'h2hPoints', 'goalDifference', 'goalsFor', 'drawLots'], schedule: { startWeek: 10, weekStep: 2, dow: 2, weeks: [10, 12, 14] },
  };
  const ko: KnockoutStage = {
    id: 'knockout', name: 'Knockout Stage', type: 'knockout', legs: 1, finalSingle: true, extraTime: true, penalties: true, awayGoalsRule: false,
    pairing: 'regionalSeeded', neutralFinal: true, byes: false, schedule: { startWeek: 16, weekStep: 2, dow: 2, weeks: [16], finalWeek: 18, finalDow: 2 },
  };
  return {
    id: 'OCL', name: 'OFC Champions League', shortName: 'OCL', kind: 'continental', confederation: 'OFC', country: null, tier: null, period: 1, firstSeason: 1, priority: 1,
    verification: UNVERIFIED(`8 clubs: two groups of four then semi-finals and final. ${KO_NOTE}`),
    rules: [ruleBase({ entrants: 8, minEntrants: 4, stages: [groups, ko], prize: { positions: [], perMatch: 2e5, perWin: 2e5 } })],
  };
}

function clubWorldCup(): CompetitionDef {
  const groups: GroupsStage = {
    id: 'groups', name: 'Group Stage', type: 'groups', groups: 8, legs: 1, advance: 2, pots: 4, avoidSameCountry: true,
    tiebreakers: ['points', 'h2hPoints', 'h2hGoalDifference', 'goalDifference', 'goalsFor', 'fairPlay', 'drawLots'], schedule: { startWeek: 45, weekStep: 1, dow: 2, weeks: [45, 46, 47] },
  };
  const ko: KnockoutStage = {
    id: 'knockout', name: 'Knockout Stage', type: 'knockout', legs: 1, finalSingle: true, extraTime: true, penalties: true, awayGoalsRule: false,
    pairing: 'regionalSeeded', neutralFinal: true, byes: false, schedule: { startWeek: 48, weekStep: 1, dow: 3, weeks: [48, 49, 50], finalWeek: 51, finalDow: 5 },
  };
  return {
    id: 'CWC', name: 'FIFA Club World Cup', shortName: 'CWC', kind: 'intercontinental', confederation: null, country: null, tier: null, period: 4, firstSeason: 1, priority: 1,
    verification: UNVERIFIED('32 clubs, 8 groups of 4, single-leg knockout, every fourth season. Confederation slot counts are scenario defaults (UEFA 12, CONMEBOL 6, AFC 4, CAF 4, CONCACAF 4, OFC 1, host/wildcard 1).'),
    rules: [ruleBase({ entrants: 32, minEntrants: 16, stages: [groups, ko], prize: { positions: [], perMatch: 2e6, perWin: 2e6 } })],
  };
}

function uefaSuperCup(): CompetitionDef {
  return {
    id: 'USC', name: 'UEFA Super Cup', shortName: 'USC', kind: 'superCup', confederation: 'UEFA', country: null, tier: null, period: 1, firstSeason: 2, priority: 1,
    verification: UNVERIFIED('Single match between previous Champions League and Europa League winners (next-best qualifier if one club won both).'),
    rules: [ruleBase({ entrants: 2, minEntrants: 2, stages: [{
      id: 'final', name: 'Super Cup', type: 'knockout', legs: 1, finalSingle: true, extraTime: true, penalties: true, awayGoalsRule: false,
      pairing: 'seeded', neutralFinal: true, byes: false, schedule: { startWeek: 3, weekStep: 1, dow: 2, finalWeek: 3, finalDow: 2 },
    }], prize: { positions: [], perMatch: 3e6, perWin: 3e6 } })],
  };
}

/** Two holders meet: a single neutral-venue match or a two-legged tie (continental super cups). */
function holdersCup(args: { id: string; name: string; short: string; conf: Confederation; legs: 1 | 2; week: number; dow: number; prize: number; note: string }): CompetitionDef {
  const single = args.legs === 1;
  return {
    id: args.id, name: args.name, shortName: args.short, kind: 'superCup', confederation: args.conf, country: null, tier: null, period: 1, firstSeason: 2, priority: 1,
    verification: UNVERIFIED(`${args.note} Entrants are last season's title holders; the place of a double winner passes to the runner-up of the senior competition. Round structure and dates are scenario defaults.`),
    rules: [ruleBase({ entrants: 2, minEntrants: 2, stages: [{
      id: 'final', name: args.name, type: 'knockout', legs: args.legs, finalSingle: single, extraTime: true, penalties: true, awayGoalsRule: false,
      pairing: 'seeded', neutralFinal: single, byes: false, schedule: { startWeek: args.week, weekStep: 1, dow: args.dow, finalWeek: args.week, finalDow: args.dow, legGapWeeks: 1 },
    }], prize: { positions: [], perMatch: args.prize, perWin: args.prize } })],
  };
}

/** Continental champions of the previous season meet in a short seeded knockout (play-off style: top seeds enter late). */
function intercontinentalCup(): CompetitionDef {
  const ko: KnockoutStage = {
    id: 'knockout', name: 'Intercontinental Cup', type: 'knockout', legs: 1, finalSingle: true, extraTime: true, penalties: true, awayGoalsRule: false,
    pairing: 'seeded', neutralFinal: true, byes: true, schedule: { startWeek: 3, weekStep: 1, dow: 3, weeksFromFinal: [4, 3], finalWeek: 5, finalDow: 3 },
  };
  return {
    id: 'FIC', name: 'FIFA Intercontinental Cup', shortName: 'FIC', kind: 'intercontinental', confederation: null, country: null, tier: null, period: 1, firstSeason: 2, priority: 1,
    verification: UNVERIFIED('Annual single-leg knockout between the previous season\'s continental champions (UEFA, CONMEBOL, AFC, CAF, Concacaf, OFC; a missing confederation is filled by its best-reputed club). The two best seeds receive a bye. Dates and format are scenario defaults; the Club World Cup is a separate quadrennial competition.'),
    rules: [ruleBase({ entrants: 6, minEntrants: 4, stages: [ko], prize: { positions: [], perMatch: 1.5e6, perWin: 1.5e6 } })],
  };
}

function buildRegistry(): Record<string, CompetitionDef> {
  const defs: CompetitionDef[] = [];
  for (const p of LEAGUE_PROFILES) {
    defs.push(leagueDef(p));
    if (p.hasCup) defs.push(cupDef(p));
    if (p.hasSuperCup) defs.push(superCupDef(p));
  }
  defs.push(uefaPair('UCL', 'UEFA Champions League', 'UCL', 1, 40, 5, 1));
  defs.push(uefaPair('UEL', 'UEFA Europa League', 'UEL', 3, 39, 2, 0.45));
  defs.push(uefaPair('UECL', 'UEFA Conference League', 'UECL', 3, 38, 3, 0.25));
  defs.push(uefaSuperCup());
  defs.push(acle());
  defs.push(groupsKo({
    id: 'ACL2', name: 'AFC Champions League Two', short: 'ACL2', conf: 'AFC', groups: 8, groupLegs: 2, advance: 2, entrants: 32, min: 16,
    groupWeeks: [7, 9, 11, 13, 15, 19], groupDow: 1, koWeeks: [26, 30, 34], finalWeek: 38, finalDow: 5, koDow: 1, priority: 2, prize: 4e5,
    note: 'Secondary AFC club competition.',
  }));
  defs.push(groupsKo({
    id: 'CAFCL', name: 'CAF Champions League', short: 'CAFCL', conf: 'CAF', groups: 4, groupLegs: 2, advance: 2, entrants: 16, min: 8,
    groupWeeks: [7, 9, 11, 13, 15, 19], groupDow: 4, koWeeks: [26, 30], finalWeek: 38, finalDow: 6, koDow: 4, priority: 1, prize: 8e5,
  }));
  defs.push(groupsKo({
    id: 'CAFCC', name: 'CAF Confederation Cup', short: 'CAFCC', conf: 'CAF', groups: 4, groupLegs: 2, advance: 2, entrants: 16, min: 8,
    groupWeeks: [8, 10, 12, 14, 16, 20], groupDow: 4, koWeeks: [27, 31], finalWeek: 37, finalDow: 6, koDow: 4, priority: 2, prize: 2.5e5,
    note: 'Secondary CAF club competition.',
  }));
  defs.push(concacafCup());
  defs.push(groupsKo({
    id: 'COPA', name: 'Copa Libertadores', short: 'COPA', conf: 'CONMEBOL', groups: 8, groupLegs: 2, advance: 2, entrants: 32, min: 16,
    groupWeeks: [7, 9, 11, 13, 15, 19], groupDow: 3, koWeeks: [26, 30, 34], finalWeek: 42, finalDow: 5, koDow: 3, priority: 1, prize: 1.2e6,
  }));
  defs.push(groupsKo({
    id: 'SUDA', name: 'Copa Sudamericana', short: 'SUDA', conf: 'CONMEBOL', groups: 8, groupLegs: 2, advance: 2, entrants: 32, min: 16,
    groupWeeks: [8, 10, 12, 14, 16, 20], groupDow: 2, koWeeks: [27, 31, 35], finalWeek: 41, finalDow: 5, koDow: 2, priority: 2, prize: 4e5,
    note: 'Secondary CONMEBOL club competition.',
  }));
  defs.push(oflCup());
  defs.push(clubWorldCup());
  // ---- additional trophies (extended universe; created only when enough entrants qualify)
  defs.push(holdersCup({ id: 'CAFSC', name: 'CAF Super Cup', short: 'CAFSC', conf: 'CAF', legs: 1, week: 3, dow: 2, prize: 6e5, note: 'Single match between the previous CAF Champions League and Confederation Cup winners.' }));
  defs.push(holdersCup({ id: 'RECOPA', name: 'Recopa Sudamericana', short: 'RECOPA', conf: 'CONMEBOL', legs: 2, week: 2, dow: 1, prize: 6e5, note: 'Two-legged tie between the previous Copa Libertadores and Copa Sudamericana winners.' }));
  defs.push(holdersCup({ id: 'CAMP', name: 'Campeones Cup', short: 'CAMP', conf: 'CONCACAF', legs: 1, week: 4, dow: 2, prize: 3e5, note: 'Single match between the previous MLS and Liga MX champions.' }));
  defs.push(groupsKo({
    id: 'CCAC', name: 'Concacaf Central American Cup', short: 'CCAC', conf: 'CONCACAF', groups: 4, groupLegs: 2, advance: 2, entrants: 16, min: 8,
    groupWeeks: [10, 12, 14, 16, 18, 20], groupDow: 3, koWeeks: [26, 30], finalWeek: 34, finalDow: 5, koDow: 3, priority: 2, prize: 1.5e5,
    note: 'Secondary Concacaf club competition for Central American and Caribbean clubs; its winner earns a Champions Cup place.',
  }));
  defs.push(intercontinentalCup());
  return Object.fromEntries(defs.map((d) => [d.id, d]));
}

export const COMPETITIONS: Record<string, CompetitionDef> = buildRegistry();

export function competitionDef(id: string): CompetitionDef {
  const d = COMPETITIONS[id];
  if (!d) throw new Error(`Unknown competition ${id}`);
  return d;
}

/** Default selection: the ten major domestic leagues requested for the initial universe. */
export const DEFAULT_MAJOR_LEAGUES = ['ENG1', 'ESP1', 'ITA1', 'GER1', 'FRA1', 'SAU1', 'POR1', 'NED1', 'BRA1', 'USA1'] as const;

/** First divisions of the default ("core") universe, in registry order. Opt-in leagues (`extended`) are excluded. */
export const CORE_LEAGUES: string[] = LEAGUE_PROFILES.filter((l) => l.tier === 1 && !l.extended).map((l) => l.id);

/**
 * Everything in the extended universe: all first divisions plus the lower tier of every pyramid link. Use with
 * `defaultWorldConfig(seed, preset, human, 'extended')`.
 */
export const EXTENDED_LEAGUES: string[] = [...LEAGUE_PROFILES.filter((l) => l.tier === 1).map((l) => l.id), ...PYRAMIDS.map((l) => l.lower)];
