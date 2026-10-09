import { clamp } from './math';
import { POSITION_GROUP, type Player, type Position, type Tactics } from './types';
import { FORMATIONS, formationOf, defaultRoleFor, ROLES } from './tactics';
import { positionalOverall } from './players';

export interface Availability {
  day: number;
  competitionId: string;
}

export function isAvailable(p: Player, a: Availability): boolean {
  if (p.retired) return false;
  if (p.injury && p.injury.returnDay > a.day) return false;
  if ((p.suspensions[a.competitionId] ?? 0) > 0) return false;
  return true;
}

/** Score used for team selection: ability at the slot, penalised for tiredness, nudged by form. */
export function selectionScore(p: Player, pos: Position, rotation: number): number {
  const base = positionalOverall(p, pos);
  const tired = Math.max(0, p.fatigue - 22);
  return base - tired * (0.12 + 0.35 * rotation) + p.form * 0.35 + (p.morale - 60) * 0.02;
}

export interface Lineup {
  /** Players in formation-slot order (GK first). */
  starters: Player[];
  bench: Player[];
  /** Mean positional overall of the starters, a quick team-strength figure. */
  rating: number;
}

/**
 * Greedy best-pair assignment of available players to formation slots.
 * `rotation` in 0..1 increases the penalty for fatigued players (cup games, congestion).
 */
export function pickLineup(squad: readonly Player[], tactics: Tactics, a: Availability, rotation = 0.3, benchSize = 9): Lineup | null {
  const fm = formationOf(tactics.formation);
  const avail = squad.filter((p) => isAvailable(p, a));
  if (avail.length < 11) return null;
  const slots = fm.slots;
  const taken = new Set<string>();
  const assigned: (Player | null)[] = slots.map(() => null);

  // Goalkeeper first
  const gks = avail.filter((p) => p.primary === 'GK').sort((x, y) => selectionScore(y, 'GK', rotation) - selectionScore(x, 'GK', rotation));
  const gk = gks[0] ?? [...avail].sort((x, y) => selectionScore(y, 'GK', rotation) - selectionScore(x, 'GK', rotation))[0];
  if (!gk) return null;
  assigned[0] = gk;
  taken.add(gk.id);

  // Outfield: fill the scarcest slots first, each with the best remaining player for that slot.
  const outfieldPool = avail.filter((p) => !taken.has(p.id) && p.primary !== 'GK');
  const pool = outfieldPool.length >= 10 ? outfieldPool : avail.filter((p) => !taken.has(p.id));
  const slotIdx: number[] = [];
  for (let i = 1; i < slots.length; i++) slotIdx.push(i);
  const natural = (pos: Position): number => {
    let n = 0;
    for (const p of pool) if (p.primary === pos) n++;
    return n;
  };
  const scarcity = new Map<Position, number>();
  for (const i of slotIdx) { const pos = slots[i] as Position; if (!scarcity.has(pos)) scarcity.set(pos, natural(pos) / slotIdx.filter((j) => slots[j] === pos).length); }
  slotIdx.sort((a, b) => (scarcity.get(slots[a] as Position) as number) - (scarcity.get(slots[b] as Position) as number));
  for (const i of slotIdx) {
    const pos = slots[i] as Position;
    let best: Player | null = null;
    let bv = -Infinity;
    for (const p of pool) {
      if (taken.has(p.id)) continue;
      const v = selectionScore(p, pos, rotation);
      if (v > bv) { bv = v; best = p; }
    }
    if (best) { assigned[i] = best; taken.add(best.id); }
  }
  if (assigned.some((x) => x === null)) return null;
  const starters = assigned as Player[];

  // Bench: one backup keeper if available, then best remaining with positional coverage.
  const rest = avail.filter((p) => !taken.has(p.id));
  const bench: Player[] = [];
  const bgk = rest.filter((p) => p.primary === 'GK').sort((x, y) => selectionScore(y, 'GK', 0) - selectionScore(x, 'GK', 0))[0];
  if (bgk) bench.push(bgk);
  const groups = { DEF: 0, MID: 0, FWD: 0, GK: 0 };
  const others = rest.filter((p) => p !== bgk && p.primary !== 'GK').sort((x, y) => positionalOverall(y, y.primary) - positionalOverall(x, x.primary));
  for (const p of others) {
    if (bench.length >= benchSize) break;
    const g = POSITION_GROUP[p.primary];
    if (groups[g] >= 3) continue;
    groups[g]++;
    bench.push(p);
  }
  for (const p of others) {
    if (bench.length >= benchSize) break;
    if (!bench.includes(p)) bench.push(p);
  }
  const rating = starters.reduce((acc, p, i) => acc + positionalOverall(p, slots[i] as Position), 0) / starters.length;
  return { starters, bench, rating };
}

/** Pick the formation (from candidates) whose best XI scores highest, with a small bias toward `preferred`. */
export function bestFormation(squad: readonly Player[], a: Availability, candidates: readonly string[] = Object.keys(FORMATIONS), preferred?: string): string {
  let best = preferred ?? candidates[0] ?? '4-3-3';
  let bv = -Infinity;
  for (const id of candidates) {
    const l = pickLineup(squad, { formation: id } as Tactics, a, 0);
    if (!l) continue;
    const v = l.rating + (id === preferred ? 0.6 : 0);
    if (v > bv) { bv = v; best = id; }
  }
  return best;
}

/** Roles that suit each starter best at their slot: picks the role whose emphasised functions match the player's strengths. */
export function suggestRoles(starters: readonly Player[], formation: string): string[] {
  const fm = formationOf(formation);
  return fm.slots.map((pos, i) => {
    const p = starters[i];
    const options = Object.values(ROLES).filter((r) => r.positions.includes(pos));
    if (!p || options.length === 0) return defaultRoleFor(pos);
    let best = defaultRoleFor(pos);
    let bv = -Infinity;
    for (const r of options) {
      const v = roleFit(p, r.id);
      if (v > bv) { bv = v; best = r.id; }
    }
    return best;
  });
}

function roleFit(p: Player, roleId: string): number {
  const a = p.attrs;
  switch (roleId) {
    case 'sweeperKeeper': return a.distribution + a.composure * 0.5 + a.pace * 0.3;
    case 'ballPlayingCB': return a.passing + a.vision * 0.6 + a.composure * 0.5;
    case 'stopper': return a.tackling + a.aggression * 0.6 + a.workRate * 0.4;
    case 'wingBack': return a.stamina + a.crossing + a.pace * 0.8;
    case 'invertedFullBack': return a.passing + a.vision * 0.6 + a.positioning * 0.5;
    case 'ballWinner': return a.tackling + a.aggression * 0.7 + a.workRate * 0.5;
    case 'deepPlaymaker': return a.passing + a.vision + a.composure * 0.5;
    case 'boxToBox': return a.stamina + a.workRate * 0.8 + a.finishing * 0.4;
    case 'playmaker': return a.vision + a.passing + a.firstTouch * 0.6;
    case 'shadowStriker': return a.finishing + a.positioning + a.anticipation * 0.6;
    case 'insideForward': return a.finishing + a.dribbling + a.pace * 0.5;
    case 'widePlaymaker': return a.vision + a.passing + a.dribbling * 0.4;
    case 'trackingWinger': return a.workRate + a.stamina + a.tackling * 0.5;
    case 'targetMan': return a.heading + a.strength + a.jumping;
    case 'completeForward': return a.finishing + a.passing * 0.7 + a.dribbling * 0.5 + a.strength * 0.4;
    case 'pressingForward': return a.workRate + a.aggression * 0.6 + a.stamina * 0.6;
    case 'poacher': return a.finishing + a.positioning + a.composure * 0.6;
    case 'winger': return a.pace + a.crossing + a.dribbling * 0.6;
    default: return 50 * 2; // neutral default roles
  }
}

export function fatigueRecoveryPerDay(p: Player, medical: number): number {
  return clamp(5 + p.attrs.recovery * 0.07 + medical * 0.03, 4, 14);
}
