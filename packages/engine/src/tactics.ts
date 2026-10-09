import { POSITION_GROUP, type ManagerStyle, type Position, type Tactics } from './types';

/** Football functions a lineup slot can contribute to. Team ratings are weighted averages over slots. */
export type Fn = 'buildUp' | 'progress' | 'create' | 'shoot' | 'press' | 'defend' | 'aerial' | 'pace' | 'setPiece';
export const FNS: readonly Fn[] = ['buildUp', 'progress', 'create', 'shoot', 'press', 'defend', 'aerial', 'pace', 'setPiece'];

export type FnWeights = Record<Fn, number>;

/** Baseline contribution of a slot (by position) to each team function. */
export const POSITION_FN_WEIGHTS: Record<Position, FnWeights> = {
  GK: { buildUp: 0.3, progress: 0, create: 0, shoot: 0, press: 0.1, defend: 0.5, aerial: 0.5, pace: 0, setPiece: 0 },
  CB: { buildUp: 0.9, progress: 0.3, create: 0.05, shoot: 0.05, press: 0.5, defend: 3, aerial: 2, pace: 0.6, setPiece: 0.3 },
  LB: { buildUp: 0.8, progress: 1.2, create: 1.0, shoot: 0.1, press: 0.9, defend: 1.6, aerial: 0.5, pace: 1.2, setPiece: 0.2 },
  RB: { buildUp: 0.8, progress: 1.2, create: 1.0, shoot: 0.1, press: 0.9, defend: 1.6, aerial: 0.5, pace: 1.2, setPiece: 0.2 },
  DM: { buildUp: 1.8, progress: 0.9, create: 0.5, shoot: 0.1, press: 1.4, defend: 2, aerial: 0.7, pace: 0.4, setPiece: 0.2 },
  CM: { buildUp: 1.7, progress: 1.4, create: 1.1, shoot: 0.3, press: 1.2, defend: 1.0, aerial: 0.5, pace: 0.5, setPiece: 0.5 },
  AM: { buildUp: 1.0, progress: 1.4, create: 2.4, shoot: 1.0, press: 0.7, defend: 0.3, aerial: 0.3, pace: 0.7, setPiece: 0.7 },
  LW: { buildUp: 0.4, progress: 1.5, create: 2.0, shoot: 1.1, press: 0.8, defend: 0.3, aerial: 0.2, pace: 1.8, setPiece: 0.3 },
  RW: { buildUp: 0.4, progress: 1.5, create: 2.0, shoot: 1.1, press: 0.8, defend: 0.3, aerial: 0.2, pace: 1.8, setPiece: 0.3 },
  ST: { buildUp: 0.5, progress: 0.7, create: 1.0, shoot: 3, press: 0.9, defend: 0.2, aerial: 1.5, pace: 1.3, setPiece: 0.1 },
};

export interface RoleDef {
  id: string;
  name: string;
  positions: Position[];
  duty: 'defend' | 'support' | 'attack';
  /** Multipliers on the slot's function weights. Absent = 1. */
  mod: Partial<Record<Fn, number>>;
  /** Relative likelihood of being the shooter / creator / ball-winner within the lineup. */
  shotShare: number;
  createShare: number;
  tackleShare: number;
}

const role = (
  id: string, name: string, positions: Position[], duty: RoleDef['duty'],
  mod: RoleDef['mod'], shotShare = 1, createShare = 1, tackleShare = 1,
): RoleDef => ({ id, name, positions, duty, mod, shotShare, createShare, tackleShare });

export const ROLES: Record<string, RoleDef> = Object.fromEntries(
  [
    role('goalkeeper', 'Goalkeeper', ['GK'], 'defend', {}),
    role('sweeperKeeper', 'Sweeper Keeper', ['GK'], 'support', { buildUp: 2.2, progress: 1.5, defend: 1.1, aerial: 0.8 }),
    role('centreBack', 'Centre-Back', ['CB'], 'defend', { aerial: 1.15 }, 0.7, 0.4, 1.1),
    role('ballPlayingCB', 'Ball-Playing CB', ['CB'], 'support', { buildUp: 1.6, progress: 1.8, defend: 0.9, aerial: 0.9 }, 0.6, 0.8, 0.9),
    role('stopper', 'Stopper', ['CB'], 'defend', { press: 1.5, defend: 1.1, buildUp: 0.7, pace: 1.1 }, 0.6, 0.2, 1.4),
    role('fullBack', 'Full-Back', ['LB', 'RB'], 'support', {}),
    role('wingBack', 'Wing-Back', ['LB', 'RB'], 'attack', { create: 1.5, progress: 1.3, pace: 1.1, defend: 0.8 }, 1.0, 1.5, 0.9),
    role('defensiveFullBack', 'Defensive Full-Back', ['LB', 'RB'], 'defend', { defend: 1.3, create: 0.5, progress: 0.7 }, 0.5, 0.5, 1.2),
    role('invertedFullBack', 'Inverted Full-Back', ['LB', 'RB'], 'support', { buildUp: 1.7, create: 0.8, pace: 0.8, defend: 1.1 }, 0.5, 0.8, 1.0),
    role('anchor', 'Anchor', ['DM'], 'defend', { defend: 1.3, press: 1.1, progress: 0.6, create: 0.5 }, 0.3, 0.4, 1.4),
    role('ballWinner', 'Ball-Winning Midfielder', ['DM', 'CM'], 'defend', { press: 1.6, defend: 1.2, create: 0.5 }, 0.4, 0.5, 1.6),
    role('deepPlaymaker', 'Deep-Lying Playmaker', ['DM', 'CM'], 'support', { buildUp: 1.6, progress: 1.4, create: 1.3, defend: 0.8 }, 0.5, 1.6, 0.8),
    role('midfielder', 'Central Midfielder', ['CM'], 'support', {}),
    role('boxToBox', 'Box-to-Box Midfielder', ['CM'], 'support', { press: 1.3, shoot: 2.0, create: 1.1, progress: 1.1 }, 1.4, 1.0, 1.1),
    role('playmaker', 'Advanced Playmaker', ['CM', 'AM'], 'attack', { create: 1.6, buildUp: 1.2, shoot: 0.8, defend: 0.5, press: 0.7 }, 0.8, 2.0, 0.6),
    role('shadowStriker', 'Shadow Striker', ['AM'], 'attack', { shoot: 2.0, create: 1.0, press: 0.8, buildUp: 0.6 }, 1.5, 1.0, 0.6),
    role('winger', 'Winger', ['LW', 'RW'], 'attack', { pace: 1.2, create: 1.2, shoot: 0.8, progress: 1.1 }, 0.9, 1.3, 0.7),
    role('insideForward', 'Inside Forward', ['LW', 'RW'], 'attack', { shoot: 1.8, create: 0.8, pace: 1.0, progress: 1.0 }, 1.5, 0.9, 0.6),
    role('widePlaymaker', 'Wide Playmaker', ['LW', 'RW'], 'support', { create: 1.5, buildUp: 1.5, shoot: 0.6, pace: 0.8 }, 0.7, 1.8, 0.7),
    role('trackingWinger', 'Tracking Winger', ['LW', 'RW'], 'support', { press: 1.5, defend: 1.8, create: 0.8, shoot: 0.7 }, 0.7, 0.9, 1.3),
    role('poacher', 'Poacher', ['ST'], 'attack', { shoot: 1.4, buildUp: 0.4, create: 0.5, press: 0.7, progress: 0.7 }, 1.5, 0.4, 0.4),
    role('targetMan', 'Target Man', ['ST'], 'support', { aerial: 1.7, shoot: 1.0, progress: 0.7, buildUp: 1.2, pace: 0.6 }, 1.4, 0.8, 0.6),
    role('completeForward', 'Complete Forward', ['ST'], 'attack', { create: 1.6, buildUp: 1.3, shoot: 1.1, progress: 1.3 }, 1.6, 1.2, 0.7),
    role('pressingForward', 'Pressing Forward', ['ST'], 'attack', { press: 1.8, shoot: 0.9, pace: 1.1 }, 1.3, 0.7, 1.0),
  ].map((r) => [r.id, r]),
);

export function defaultRoleFor(pos: Position): string {
  switch (pos) {
    case 'GK': return 'goalkeeper';
    case 'CB': return 'centreBack';
    case 'LB': case 'RB': return 'fullBack';
    case 'DM': return 'anchor';
    case 'CM': return 'midfielder';
    case 'AM': return 'playmaker';
    case 'LW': case 'RW': return 'winger';
    case 'ST': return 'poacher';
  }
}

export interface Formation {
  id: string;
  slots: Position[];
}

const f = (id: string, slots: Position[]): Formation => ({ id, slots });

export const FORMATIONS: Record<string, Formation> = Object.fromEntries(
  [
    f('4-4-2', ['GK', 'LB', 'CB', 'CB', 'RB', 'LW', 'CM', 'CM', 'RW', 'ST', 'ST']),
    f('4-3-3', ['GK', 'LB', 'CB', 'CB', 'RB', 'DM', 'CM', 'CM', 'LW', 'RW', 'ST']),
    f('4-2-3-1', ['GK', 'LB', 'CB', 'CB', 'RB', 'DM', 'CM', 'LW', 'AM', 'RW', 'ST']),
    f('3-5-2', ['GK', 'CB', 'CB', 'CB', 'LB', 'RB', 'DM', 'CM', 'CM', 'ST', 'ST']),
    f('5-3-2', ['GK', 'LB', 'CB', 'CB', 'CB', 'RB', 'DM', 'CM', 'CM', 'ST', 'ST']),
    f('4-1-4-1', ['GK', 'LB', 'CB', 'CB', 'RB', 'DM', 'LW', 'CM', 'CM', 'RW', 'ST']),
    f('3-4-3', ['GK', 'CB', 'CB', 'CB', 'LB', 'RB', 'CM', 'CM', 'LW', 'RW', 'ST']),
  ].map((fm) => [fm.id, fm]),
);

export function formationOf(id: string): Formation {
  const fm = FORMATIONS[id];
  if (!fm) throw new Error(`Unknown formation: ${id}`);
  return fm;
}

export function defaultTactics(formation = '4-3-3'): Tactics {
  const fm = formationOf(formation);
  return {
    formation,
    roles: fm.slots.map(defaultRoleFor),
    mentality: 0,
    tempo: 50,
    width: 50,
    directness: 50,
    pressing: 50,
    defensiveLine: 50,
    counterAttack: false,
    marking: 'zonal',
    setPieceFocus: 'mixed',
    adaptive: true,
    maxSubs: 5,
  };
}

export type TacticalArchetype = 'balanced' | 'possession' | 'counter' | 'highPress' | 'lowBlock' | 'direct';

/** Preset instruction bundles. They are *starting points*; none is universally better (see tests). */
export function archetypeTactics(a: TacticalArchetype, formation?: string): Tactics {
  const base = defaultTactics(formation ?? (a === 'lowBlock' ? '5-3-2' : a === 'possession' ? '4-3-3' : a === 'direct' ? '4-4-2' : '4-2-3-1'));
  switch (a) {
    case 'balanced': return base;
    case 'possession':
      return { ...base, tempo: 40, directness: 15, pressing: 60, defensiveLine: 70, width: 60, mentality: 1 };
    case 'counter':
      return { ...base, tempo: 65, directness: 65, pressing: 30, defensiveLine: 30, width: 50, mentality: 0, counterAttack: true };
    case 'highPress':
      return { ...base, tempo: 75, directness: 45, pressing: 90, defensiveLine: 85, width: 55, mentality: 1 };
    case 'lowBlock':
      return { ...base, tempo: 40, directness: 70, pressing: 15, defensiveLine: 12, width: 40, mentality: -1, counterAttack: true };
    case 'direct':
      return { ...base, tempo: 60, directness: 90, pressing: 50, defensiveLine: 50, width: 70, mentality: 0 };
  }
}

export const STYLE_TO_ARCHETYPE: Record<ManagerStyle, TacticalArchetype> = {
  youthDeveloper: 'balanced',
  possession: 'possession',
  counterAttack: 'counter',
  highPress: 'highPress',
  pragmatic: 'lowBlock',
  superstarBuilder: 'possession',
  domesticDominance: 'possession',
  continentalFocus: 'balanced',
  sustainable: 'counter',
};

/** Normalised tactical parameters (0..1 unless stated). Single source of truth for tactical effects in the match engine. */
export interface TacticalProfile {
  tempo: number;
  width: number;
  directness: number;
  pressing: number;
  line: number;
  mentality: number; // -2..2
  counter: boolean;
  /** Fatigue accrual multiplier: tempo and pressing cost energy. */
  fatigueRate: number;
  /** Multiplier on sequence duration (higher tempo => shorter sequences => more of them). */
  durationMult: number;
}

export function tacticalProfile(t: Tactics): TacticalProfile {
  const tempo = t.tempo / 100;
  const pressing = t.pressing / 100;
  const line = t.defensiveLine / 100;
  const mentality = t.mentality;
  return {
    tempo,
    width: t.width / 100,
    directness: t.directness / 100,
    pressing,
    line,
    mentality,
    counter: t.counterAttack,
    fatigueRate: 0.76 + 0.46 * pressing + 0.22 * tempo + 0.05 * Math.abs(mentality),
    durationMult: 1.2 - 0.4 * tempo,
  };
}

/** Which slots in a formation are "wide" for width/cross purposes. */
export function isWide(pos: Position): boolean {
  return pos === 'LW' || pos === 'RW' || pos === 'LB' || pos === 'RB';
}

export function validateTactics(t: Tactics): string[] {
  const errors: string[] = [];
  const fm = FORMATIONS[t.formation];
  if (!fm) return [`unknown formation ${t.formation}`];
  if (t.roles.length !== fm.slots.length) errors.push('role count does not match formation slots');
  t.roles.forEach((rid, i) => {
    const r = ROLES[rid];
    const pos = fm.slots[i];
    if (!r) errors.push(`unknown role ${rid}`);
    else if (pos && !r.positions.includes(pos)) errors.push(`role ${rid} invalid for slot ${i} (${pos})`);
  });
  for (const k of ['tempo', 'width', 'directness', 'pressing', 'defensiveLine'] as const) {
    if (!(t[k] >= 0 && t[k] <= 100)) errors.push(`${k} out of range`);
  }
  if (![-2, -1, 0, 1, 2].includes(t.mentality)) errors.push('invalid mentality');
  if (!Number.isInteger(t.maxSubs) || t.maxSubs < 0 || t.maxSubs > 9) errors.push('invalid maxSubs');
  return errors;
}

export function groupOf(pos: Position): string {
  return POSITION_GROUP[pos];
}
