/**
 * Player development, ageing, injuries' long-term effects, youth intake and retirement.
 *
 * Model: every attribute moves independently each week.
 *  - Growth closes a fraction of the gap to a hidden per-player ceiling (proportional profile scaled to `pot`).
 *    The rate falls with age along attribute-group-specific curves (physical peaks earliest, mental latest),
 *    scales with the player's hidden development rate, club coaching/training quality and recent playing time,
 *    and is stronger for attributes that matter in the player's position (position-specific development).
 *  - Decline starts at a group-specific age and accelerates; good medical/coaching slows it.
 *  - Small persistent noise makes careers differ without being a uniform random walk on overall.
 */
import { clamp } from '../math';
import { ageOf, overall, POSITION_WEIGHTS } from '../players';
import { Rng } from '../rng';
import { attrGroup, ATTR_KEYS, type AttrGroup, type AttrKey, type Club, type Player, type Position } from '../types';
import { createYouthPlayer } from './squad';
import { allPlayers, assignPlayer } from './runtime';
import type { WorldState } from './types';

const PEAK_AGE: Record<AttrGroup, number> = { physical: 25, technical: 27, mental: 29, goalkeeping: 29 };
const DECLINE_START: Record<AttrGroup, number> = { physical: 28, technical: 31, mental: 33, goalkeeping: 34 };
const DECLINE_COEF: Record<AttrGroup, number> = { physical: 0.0001, technical: 0.00006, mental: 0.00003, goalkeeping: 0.00006 };
const MAX_GROWTH_WEEKLY = 0.0105;

export function growthRate(group: AttrGroup, age: number): number {
  const peak = PEAK_AGE[group];
  if (age >= peak) return 0;
  return MAX_GROWTH_WEEKLY * clamp((peak - age) / (peak - 16), 0, 1);
}

export function declineRate(group: AttrGroup, age: number): number {
  const start = DECLINE_START[group];
  if (age <= start) return 0;
  return DECLINE_COEF[group] * Math.pow(age - start, 1.35);
}

const POS_MAX: Record<Position, number> = Object.fromEntries(
  (Object.keys(POSITION_WEIGHTS) as Position[]).map((pos) => [pos, Math.max(...Object.values(POSITION_WEIGHTS[pos]).map((v) => v ?? 0))]),
) as Record<Position, number>;

export function developPlayerWeek(p: Player, day: number, club: Club | undefined, rng: Rng): void {
  const age = ageOf(p, day);
  if (age < 15.5) return;
  const ovNow = overall(p);
  const coaching = club ? club.facilities.coaching * 0.6 + club.facilities.training * 0.4 : 35;
  const trainingMult = 0.7 + 0.5 * (coaching / 100);
  const youth = age < 24;
  const minutesMult = youth ? 0.8 + 0.4 * clamp(p.workload / 6, 0, 1) : 1;
  const ceilingScale = p.pot > ovNow ? p.pot / Math.max(ovNow, 1) : 1;
  const medicalSlow = club ? 1 - 0.35 * (club.facilities.medical / 100) : 0.85;
  const injuredPenalty = p.injury ? 0.5 : 1;
  const weights = POSITION_WEIGHTS[p.primary];
  const maxW = POS_MAX[p.primary];
  for (const k of ATTR_KEYS) {
    const group = attrGroup(k);
    const cur = p.attrs[k];
    let delta = 0;
    const rate = growthRate(group, age);
    if (rate > 0) {
      const cap = Math.min(99, cur * ceilingScale);
      const room = Math.max(0, cap - cur);
      const rel = 0.6 + 0.8 * ((weights[k as AttrKey] ?? 0) / maxW);
      delta += room * rate * p.devRate * trainingMult * minutesMult * rel * injuredPenalty;
    }
    const dec = declineRate(group, age);
    if (dec > 0) delta -= cur * dec * medicalSlow * (group === 'physical' ? 1 : 1);
    // persistent noise, damped for consistent players
    delta += (rng.next() - 0.5) * 0.12 * (1.1 - p.consistency);
    if (delta !== 0) p.attrs[k] = Math.round(clamp(cur + delta, 1, 99) * 100) / 100;
  }
  // GK attributes are meaningless for outfielders: keep them low and stable
  // (they are never read for non-GK slots, so no maintenance cost is spent here).
}

/** Called weekly for every non-retired player. */
export function weeklyDevelopment(world: WorldState): void {
  const rng = Rng.fromSeed(`${world.config.seed}:dev:${world.day}`);
  for (const p of allPlayers(world)) {
    if (p.retired) continue;
    const club = p.clubId ? world.clubs[p.clubId] : undefined;
    developPlayerWeek(p, world.day, club, rng);
    // form and morale drift back towards neutral
    p.form *= 0.9;
    p.morale += (62 - p.morale) * 0.04;
    p.confidence += (60 - p.confidence) * 0.05;
    // hidden potential cannot sit below current ability
    const ov = overall(p);
    if (p.pot < ov) p.pot = ov;
  }
}

/** Annual hidden-potential revision: young players' ceilings drift; late bloomers and plateaus happen. */
export function revisePotentials(world: WorldState, rng: Rng): void {
  for (const p of allPlayers(world)) {
    if (p.retired) continue;
    const age = ageOf(p, world.day);
    if (age >= 28) { p.pot = Math.max(overall(p), p.pot - 0.5); continue; }
    const shock = rng.normal(0, age < 21 ? 2.2 : 1.2) + (rng.chance(0.02) ? rng.float(2, 7) : 0);
    p.pot = clamp(p.pot + shock, overall(p), 99);
  }
}

export function retirementProbability(age: number, ability: number, isGk: boolean): number {
  const start = isGk ? 36 : 33;
  if (age < start) return 0;
  const base = clamp((age - start + 1) * 0.2, 0, 0.97);
  return clamp(base - (ability - 60) * 0.004, 0.02, 0.99);
}

export function annualRetirements(world: WorldState, rng: Rng): number {
  let n = 0;
  for (const p of allPlayers(world)) {
    if (p.retired) continue;
    const age = ageOf(p, world.day);
    if (!rng.chance(retirementProbability(age, overall(p), p.primary === 'GK'))) continue;
    retirePlayer(world, p);
    n++;
  }
  return n;
}

export function retirePlayer(world: WorldState, p: Player): void {
  const apps = p.history.reduce((a, l) => a + l.apps, 0);
  const goals = p.history.reduce((a, l) => a + l.goals, 0);
  const clubIds = [...new Set(p.history.map((l) => l.clubId))];
  if (apps >= 150 || goals >= 60) {
    world.history.legends.push({ playerId: p.id, name: p.name, retiredSeason: world.season, goals, apps, clubs: clubIds, peakOverall: Math.round(overall(p)) });
  }
  const club = p.clubId ? world.clubs[p.clubId] : undefined;
  world.transfers.push({ id: `r${world.transfers.length}-${p.id}`, day: world.day, playerId: p.id, fromClubId: p.clubId, toClubId: null, kind: 'retire', fee: 0, wageWeekly: p.contract?.wageWeekly ?? 0 });
  assignPlayer(world, p, null);
  p.retired = true;
  p.contract = null;
  p.loan = null;
  delete world.transferList[p.id];
  if (club && apps >= 300) {
    world.news.push({ id: `ret-${p.id}`, day: world.day, kind: 'retire', clubIds: [club.id], playerIds: [p.id], text: `${p.name} retires after ${apps} appearances and ${goals} goals.`, ref: p.id });
  }
}

const INTAKE_POSITIONS: Position[] = ['GK', 'CB', 'CB', 'LB', 'RB', 'DM', 'CM', 'CM', 'AM', 'LW', 'RW', 'ST', 'ST'];

/** Academy intake: quantity and quality depend on the youth facility rating and the manager's eye for talent. */
export function youthIntake(world: WorldState, club: Club, rng: Rng): number {
  const mgr = club.managerId ? world.managers[club.managerId] : undefined;
  const youth = club.facilities.youth;
  const count = clamp(Math.round(1.5 + youth / 30 + rng.normal(0, 0.8)), 1, 6);
  const leagueQuality = club.reputation * 0.35 + 18;
  for (let i = 0; i < count; i++) {
    const pos = INTAKE_POSITIONS[rng.int(INTAKE_POSITIONS.length)] as Position;
    const ability = clamp(leagueQuality - 6 + youth * 0.1 + rng.normal(0, 5), 22, 62);
    const eye = mgr ? mgr.youthEye / 100 : 0.5;
    const spread = 14 + youth * 0.16;
    let pot = ability + Math.max(2, rng.normal(spread * 0.9, spread * 0.5)) + eye * 4;
    if (rng.chance(0.02 + youth / 2500)) pot += rng.float(8, 18); // wonderkid
    createYouthPlayer(world, club, rng, pos, ability, rng.float(15.5, 17.9), clamp(pot, ability + 1, 97));
  }
  return count;
}
