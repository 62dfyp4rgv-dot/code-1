/**
 * Procedural generation of the fictional starting universe. All clubs, players and managers are generated from
 * the world seed; nothing here claims to represent real people, clubs or contracts.
 */
import { clamp } from '../math';
import { generatePlayer } from '../players';
import { Rng } from '../rng';
import { CORE_LEAGUES, EXTENDED_LEAGUES, LEAGUE_PROFILES, PYRAMIDS, type LeagueProfile } from '../competition/registry';
import { archetypeTactics, STYLE_TO_ARCHETYPE } from '../tactics';
import { bestFormation, pickLineup, suggestRoles } from '../lineup';
import type { Club, Manager, ManagerStyle, Player, Position } from '../types';
import { clubName, cultureOfNation, managerName, playerName } from './names';
import { reindex, squadOf } from './runtime';
import { baseWageWeekly, contractYearsFor, marketValue } from './valuation';
import { WORLD_SCHEMA_VERSION, type WorldConfig, type WorldState } from './types';

export const STYLES: ManagerStyle[] = [
  'youthDeveloper', 'possession', 'counterAttack', 'highPress', 'pragmatic', 'superstarBuilder',
  'domesticDominance', 'continentalFocus', 'sustainable',
];

/**
 * Default world configuration. `scope` 'core' (default) enables the 35 original first divisions (the 'standard' preset
 * adds the ENG/SAU second tiers on top); 'extended' enables every first division plus every pyramid's second tier, in
 * both presets. The extended universe is larger and slower, so it is always an explicit choice.
 */
export function defaultWorldConfig(seed: string, preset: 'compact' | 'standard' = 'standard', humanClubId: string | null = null, scope: 'core' | 'extended' = 'core'): WorldConfig {
  const leagues = scope === 'extended' ? [...EXTENDED_LEAGUES] : [...CORE_LEAGUES];
  return { seed, leagues, preset, humanClubId, archiveRecent: 400 };
}

/** Acklam's rational approximation of the standard normal quantile. */
function invNorm(p: number): number {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  const q0 = clamp(p, 1e-6, 1 - 1e-6);
  if (q0 < pl) {
    const q = Math.sqrt(-2 * Math.log(q0));
    return (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) / ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }
  if (q0 > 1 - pl) {
    const q = Math.sqrt(-2 * Math.log(1 - q0));
    return -(((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) / ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }
  const q = q0 - 0.5;
  const r = q * q;
  return ((((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q) / (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1);
}

interface SquadSlot { pos: Position; tier: 'starter' | 'backup' | 'reserve' }

const SQUAD_TEMPLATE: SquadSlot[] = [
  { pos: 'GK', tier: 'starter' }, { pos: 'GK', tier: 'backup' }, { pos: 'GK', tier: 'reserve' },
  { pos: 'CB', tier: 'starter' }, { pos: 'CB', tier: 'starter' }, { pos: 'CB', tier: 'backup' }, { pos: 'CB', tier: 'reserve' },
  { pos: 'LB', tier: 'starter' }, { pos: 'LB', tier: 'backup' }, { pos: 'RB', tier: 'starter' }, { pos: 'RB', tier: 'backup' },
  { pos: 'DM', tier: 'starter' }, { pos: 'DM', tier: 'backup' },
  { pos: 'CM', tier: 'starter' }, { pos: 'CM', tier: 'starter' }, { pos: 'CM', tier: 'backup' },
  { pos: 'AM', tier: 'starter' }, { pos: 'AM', tier: 'reserve' },
  { pos: 'LW', tier: 'starter' }, { pos: 'LW', tier: 'backup' }, { pos: 'RW', tier: 'starter' }, { pos: 'RW', tier: 'backup' },
  { pos: 'ST', tier: 'starter' }, { pos: 'ST', tier: 'backup' }, { pos: 'ST', tier: 'reserve' },
];

export function nextId(world: WorldState, kind: 'player' | 'manager' | 'transfer' | 'news'): string {
  const n = ++world.counters[kind];
  return `${kind[0]}${n}`;
}

function shuffleNationality(rng: Rng, prof: LeagueProfile): string {
  return rng.chance(prof.homeShare) ? prof.country : rng.pick(prof.foreignPool);
}

export function createEmptyWorld(config: WorldConfig): WorldState {
  return {
    schemaVersion: WORLD_SCHEMA_VERSION, config, day: 0, season: 1, players: {}, clubs: {}, managers: {}, competitions: {},
    leagueMembers: {}, seasonStats: {}, matches: {}, matchOrder: [], transfers: [],
    history: { seasons: [], champions: {}, clubs: {}, legends: [], records: [] },
    news: [], ai: {}, counters: { player: 0, manager: 0, transfer: 0, news: 0 }, transferList: {}, managerPool: [],
    overrides: { clubNames: {}, playerNames: {} },
  };
}

export function resolveLeagues(config: WorldConfig): LeagueProfile[] {
  const ids = new Set(config.leagues);
  if (config.preset === 'standard') {
    for (const link of PYRAMIDS) if (link.auto !== false && ids.has(link.upper)) ids.add(link.lower);
  }
  return LEAGUE_PROFILES.filter((p) => ids.has(p.id));
}

/** Create one club (and its manager and squad). Mutates `world`. */
function createClub(world: WorldState, prof: LeagueProfile, idx: number, n: number, usedNames: Set<string>): Club {
  const rng = Rng.fromSeed(`${world.config.seed}:club:${prof.id}:${idx}`);
  const id = `cl${String(Object.keys(world.clubs).length + 1).padStart(3, '0')}`;
  // z: strength quantile with small shuffle noise, best club first
  const z = invNorm(1 - (idx + 0.5) / n) + rng.normal(0, 0.12);
  const Q = prof.quality + z * prof.clubSpread;
  const leagueRep = clamp(prof.quality + 6, 25, 88);
  const reputation = clamp(Math.round(leagueRep + z * 10.5 + rng.normal(0, 2)), 12, 98);
  const nm = clubName(prof.culture, rng, usedNames);
  const capacity = Math.max(3000, Math.round((prof.stadium * (0.62 + 0.28 * z + rng.normal(0, 0.06))) / 500) * 500);
  const investor = rng.chance(prof.investorShare * (0.5 + clamp((z + 1) / 3, 0, 1) * 1.2));
  const kind: Club['ownership']['kind'] = investor ? (prof.country === 'SAU' || prof.country === 'QAT' || prof.country === 'UAE' ? 'state' : 'investor') : rng.chance(0.5) ? 'members' : 'private';
  const wealth = clamp(Math.round(investor ? rng.float(65, 98) : rng.float(15, 60) + z * 6), 5, 99);
  const style = rng.pick(STYLES);
  const facilityBase = clamp(reputation * 0.8 + rng.normal(0, 8) + (investor ? 8 : 0), 15, 98);
  const fac = (): number => Math.round(clamp(facilityBase + rng.normal(0, 7), 10, 99));

  // --- finances
  const nHome = prof.legs === 2 ? n - 1 : (n - 1) / 2;
  const weights = Array.from({ length: n }, (_, i) => 1.9 - (1.8 * i) / Math.max(1, n - 1));
  const wsum = weights.reduce((a, b) => a + b, 0);
  const tvShare = prof.tvPool * (n / prof.clubs) * (0.55 / n + 0.45 * ((weights[idx] ?? 1) / wsum));
  const attendance = clamp(0.55 + 0.3 * z + rng.normal(0, 0.05), 0.35, 1);
  const ticket = Math.round(prof.ticket * (0.65 + reputation / 160) * (investor ? 1.1 : 1));
  const matchday = capacity * attendance * ticket * nHome * 1.6; // incl. hospitality and cup/European home games
  const sponsorship = tvShare * 0.34 * Math.pow(reputation / 60, 1.5) + (investor ? wealth * 30000 : 0);
  const revenue = (tvShare + matchday + sponsorship) * 1.08; // 8% allowance for prize money
  const club: Club = {
    id, name: nm.name, shortName: nm.short, country: prof.country, city: nm.city,
    colors: [`#${rng.int(0xffffff).toString(16).padStart(6, '0')}`, `#${rng.int(0xffffff).toString(16).padStart(6, '0')}`],
    reputation, historicalPrestige: clamp(Math.round(reputation + rng.normal(0, 6)), 5, 99),
    continentalReputation: clamp(Math.round(reputation * (prof.quality / 70) ** 1.1), 5, 99),
    stadium: { name: `${nm.city} Arena`, capacity },
    facilities: { training: fac(), youth: fac(), medical: fac(), scouting: fac(), coaching: fac() },
    supporters: clamp(Math.round(reputation + rng.normal(0, 8)), 5, 99),
    ownership: { kind, wealth }, philosophy: style, managerId: null,
    tactics: archetypeTactics(STYLE_TO_ARCHETYPE[style]),
    finance: {
      cash: Math.round(revenue * rng.float(0.05, 0.45)), debt: Math.round(revenue * (rng.chance(0.4) ? rng.float(0.05, 0.9) : 0)),
      transferBudget: 0, wageBudgetWeekly: 0, broadcastingAnnual: Math.round(tvShare), sponsorshipAnnual: Math.round(sponsorship),
      seasonLedger: {}, installments: [], overspendStrikes: 0, embargoUntilDay: -1,
      opexAnnual: Math.round(revenue * (0.14 + 0.08 * (facilityBase / 100))), ticketPrice: ticket, seasonStartCash: 0,
    },
    boardExpectation: clamp(1 - (z + 2) / 4.2, 0.02, 0.95), boardPatience: clamp(Math.round(rng.normal(55, 15) + (kind === 'members' ? 10 : -5)), 15, 95),
    leagueId: prof.id, rivals: [], fictional: true, cohesion: 0.5, lineupOverride: null,
  };
  world.clubs[id] = club;

  // --- manager
  const mid = nextId(world, 'manager');
  const mAge = clamp(rng.normal(48, 7), 33, 68);
  const manager: Manager = {
    id: mid, name: managerName(prof.culture, rng), nationality: prof.country, birthDay: Math.round(-mAge * 365.25),
    reputation: clamp(Math.round(reputation + rng.normal(0, 8)), 10, 98), tacticalKnowledge: clamp(Math.round(reputation * 0.75 + 15 + rng.normal(0, 9)), 20, 98),
    manManagement: clamp(Math.round(rng.normal(60, 14)), 20, 95), youthEye: clamp(Math.round(rng.normal(55, 18)), 10, 95), style,
    patience: clamp(Math.round(rng.normal(55, 15)), 10, 95), clubId: id, contractEndDay: rng.between(200, 365 * 4), tenure: { startDay: 0, played: 0, points: 0 },
  };
  world.managers[mid] = manager;
  club.managerId = mid;

  // --- squad
  const squadRng = rng.derive('squad');
  const players: Player[] = [];
  let foreign = 0;
  const topClub = z > 0.7;
  let starIdx = 0;
  for (const slot of SQUAD_TEMPLATE) {
    const age = slot.pos === 'GK'
      ? clamp(squadRng.normal(slot.tier === 'starter' ? 29 : 24, 4), 18, 37)
      : slot.tier === 'starter' ? clamp(squadRng.normal(27, 3.4), 19, 36) : slot.tier === 'backup' ? clamp(squadRng.normal(25, 4.5), 18, 35) : clamp(squadRng.normal(20, 1.8), 16, 24);
    const offset = slot.tier === 'starter' ? squadRng.normal(0, 3.6) : slot.tier === 'backup' ? -6 + squadRng.normal(0, 3.5) : -12 + squadRng.normal(0, 4);
    let ability = Q + offset;
    if (slot.tier === 'starter' && topClub && starIdx < 2 && squadRng.chance(0.6)) {
      ability += squadRng.float(4, 9);
      starIdx++;
    }
    const nat = shuffleNationality(squadRng, prof);
    if (nat !== prof.country) foreign++;
    const pid = nextId(world, 'player');
    const p = generatePlayer(squadRng, {
      id: pid, name: playerName(cultureOfNation(nat), squadRng), nationality: nat, age, day: 0, position: slot.pos, ability: clamp(ability, 25, 94),
    });
    p.clubId = id;
    players.push(p);
  }
  // enforce foreign-registration cap by repatriating the lowest-rated foreigners
  if (prof.maxForeign !== null) {
    let guard = 0;
    while (foreign > prof.maxForeign && guard++ < 25) {
      const f = players.find((q) => q.nationality !== prof.country);
      if (!f) break;
      f.nationality = prof.country;
      f.name = playerName(cultureOfNation(prof.country), squadRng);
      foreign--;
    }
  }
  for (const p of players) world.players[p.id] = p;

  // --- contracts and wages scaled to the club's revenue
  const wageTarget = revenue * clamp(rng.normal(0.7, 0.07) + (investor ? 0.1 : 0) - (idx > n * 0.7 ? 0.03 : 0), 0.5, 0.95);
  const raw = players.map((p) => baseWageWeekly(marketValue(p, 0), 0) * 52);
  const rawSum = raw.reduce((a, b) => a + b, 0);
  const scale = clamp(wageTarget / rawSum, 0.3, 4);
  players.forEach((p, i) => {
    const ageNow = (0 - p.birthDay) / 365.25;
    const years = contractYearsFor(ageNow, squadRng.next());
    const seasonsLeft = Math.max(1, Math.round(years * squadRng.float(0.35, 1)));
    p.contract = {
      clubId: id, wageWeekly: Math.max(800, Math.round(((raw[i] as number) * scale) / 52 / 100) * 100),
      startDay: -squadRng.between(0, 700), endDay: seasonsLeft * 364 - 1, signingBonus: 0, releaseClause: null,
      squadRole: i < 11 ? 'first' : i < 17 ? 'rotation' : 'backup',
    };
    if (squadRng.chance(0.2) && marketValue(p, 0) > 1.5e7) p.contract.releaseClause = Math.round(marketValue(p, 0) * squadRng.float(1.5, 2.2) / 1e6) * 1e6;
    p.morale = clamp(Math.round(squadRng.normal(65, 8)), 30, 95);
    p.confidence = clamp(Math.round(squadRng.normal(60, 8)), 30, 95);
  });
  const wageBill = players.reduce((a, p) => a + (p.contract?.wageWeekly ?? 0), 0);
  club.finance.wageBudgetWeekly = Math.round(wageBill * 1.1);
  club.finance.transferBudget = Math.round(Math.max(0, club.finance.cash * 0.3 + (wealth / 100) * revenue * 0.25));
  return club;
}

/** Fill the squad index and set tactics from the squad actually generated. */
function finaliseClubTactics(world: WorldState, club: Club): void {
  const squad = squadOf(world, club.id);
  const arch = archetypeTactics(STYLE_TO_ARCHETYPE[club.philosophy]);
  const formation = bestFormation(squad, { day: 0, competitionId: club.leagueId }, undefined, arch.formation);
  const lineup = pickLineup(squad, { ...arch, formation }, { day: 0, competitionId: club.leagueId }, 0);
  club.tactics = { ...arch, formation, roles: lineup ? suggestRoles(lineup.starters, formation) : arch.roles };
}

export function generateWorld(config: WorldConfig): WorldState {
  const world = createEmptyWorld(config);
  const profiles = resolveLeagues(config);
  const used = new Set<string>();
  for (const prof of profiles) {
    const n = config.preset === 'compact' ? prof.compactClubs : prof.clubs;
    world.leagueMembers[prof.id] = [];
    for (let i = 0; i < n; i++) {
      const club = createClub(world, prof, i, n, used);
      (world.leagueMembers[prof.id] as string[]).push(club.id);
    }
  }
  reindex(world);
  // rivals: nearest clubs by reputation within the same league (scenario rivalries, not real-world ones)
  for (const [lid, members] of Object.entries(world.leagueMembers)) {
    const rng = Rng.fromSeed(`${config.seed}:rivals:${lid}`);
    for (const cid of members) {
      const me = world.clubs[cid] as Club;
      const near = members
        .filter((o) => o !== cid)
        .sort((a, b) => Math.abs((world.clubs[a] as Club).reputation - me.reputation) - Math.abs((world.clubs[b] as Club).reputation - me.reputation))
        .slice(0, 4);
      if (near.length > 0) me.rivals = [rng.pick(near)];
    }
  }
  for (const club of Object.values(world.clubs)) finaliseClubTactics(world, club);

  // free agents and unemployed managers
  const frng = Rng.fromSeed(`${config.seed}:free`);
  const positions: Position[] = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'];
  for (const prof of profiles) {
    if (prof.tier !== 1) continue;
    const count = config.preset === 'compact' ? 4 : 10;
    for (let i = 0; i < count; i++) {
      const nat = shuffleNationality(frng, prof);
      const pid = nextId(world, 'player');
      const pos = positions[frng.int(positions.length)] as Position;
      const p = generatePlayer(frng, { id: pid, name: playerName(cultureOfNation(nat), frng), nationality: nat, age: frng.float(23, 35), day: 0, position: pos, ability: clamp(prof.quality - 12 + frng.normal(0, 5), 25, 80) });
      p.freeSince = 0;
      world.players[pid] = p;
    }
  }
  reindex(world);
  // unemployed managers: drawn from the core profiles unless the world uses the extended universe (keeps core worlds unchanged)
  const managerSource = profiles.some((p) => p.extended) ? LEAGUE_PROFILES : LEAGUE_PROFILES.filter((p) => !p.extended);
  for (let i = 0; i < (config.preset === 'compact' ? 20 : 120); i++) {
    const prof = managerSource[frng.int(managerSource.length)] as LeagueProfile;
    const mid = nextId(world, 'manager');
    world.managers[mid] = {
      id: mid, name: managerName(prof.culture, frng), nationality: prof.country, birthDay: Math.round(-frng.float(38, 64) * 365.25),
      reputation: clamp(Math.round(prof.quality - 15 + frng.normal(0, 12)), 8, 85), tacticalKnowledge: clamp(Math.round(frng.normal(55, 12)), 20, 90),
      manManagement: clamp(Math.round(frng.normal(58, 14)), 20, 92), youthEye: clamp(Math.round(frng.normal(52, 18)), 10, 92), style: frng.pick(STYLES),
      patience: clamp(Math.round(frng.normal(55, 15)), 10, 95), clubId: null, contractEndDay: null, tenure: { startDay: 0, played: 0, points: 0 },
    };
    world.managerPool.push(mid);
  }
  for (const club of Object.values(world.clubs)) world.ai[club.id] = { needs: {}, lastReviewDay: -999, cooldown: {}, dealsThisWindow: 0 };
  return world;
}
