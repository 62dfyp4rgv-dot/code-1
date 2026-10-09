import { generatePlayer } from './players';
import { Rng } from './rng';
import { defaultTactics, formationOf } from './tactics';
import type { MatchConditions, MatchInput, MatchPlayer, MatchRules, TeamSheet } from './match';
import type { Player, Position, Tactics } from './types';

export function toMatchPlayer(p: Player, day: number): MatchPlayer {
  return {
    id: p.id, name: p.name, primary: p.primary, positions: p.positions, attrs: p.attrs, traits: p.traits,
    fatigue: p.fatigue, form: p.form, morale: p.morale, confidence: p.confidence, consistency: p.consistency,
    injuryProneness: p.injuryProneness, age: (day - p.birthDay) / 365.25,
  };
}

export interface SyntheticOptions {
  id: string;
  /** Mean ability of starters (typically 45..85). */
  quality: number;
  /** Std-dev of ability across starters. */
  spread?: number;
  tactics?: Tactics;
  seed?: string;
  acumen?: number;
  benchQualityOffset?: number;
}

const BENCH_POSITIONS: Position[] = ['GK', 'CB', 'LB', 'DM', 'CM', 'AM', 'ST'];

export function syntheticSheet(opts: SyntheticOptions): TeamSheet {
  const rng = Rng.fromSeed(`synth:${opts.seed ?? ''}:${opts.id}`);
  const tactics = opts.tactics ?? defaultTactics('4-3-3');
  const fm = formationOf(tactics.formation);
  const spread = opts.spread ?? 4;
  const players: MatchPlayer[] = [];
  let n = 0;
  const mk = (pos: Position, q: number): void => {
    const age = rng.float(21, 33);
    const p = generatePlayer(rng, {
      id: `${opts.id}-p${n++}`, name: `${opts.id} Player ${n}`, nationality: 'XXX', age, day: 0, position: pos,
      ability: Math.max(20, Math.min(95, q + rng.normal(0, spread))),
    });
    players.push(toMatchPlayer(p, 0));
  };
  for (const pos of fm.slots) mk(pos, opts.quality);
  for (const pos of BENCH_POSITIONS) mk(pos, opts.quality + (opts.benchQualityOffset ?? -6));
  return { clubId: opts.id, name: opts.id, tactics, players, cohesion: 0.5, acumen: opts.acumen ?? 60 };
}

export const DEFAULT_CONDITIONS: MatchConditions = {
  neutral: false, attendanceFrac: 0.85, weather: 'clear', refereeStrictness: 1, importance: 0.5,
};

export const LEAGUE_RULES: MatchRules = { mustHaveWinner: false, extraTime: false, maxSubsRegular: 5 };

export function syntheticMatch(id: string, seed: string, home: TeamSheet, away: TeamSheet, over?: Partial<MatchInput>): MatchInput {
  return { id, seed, home, away, conditions: DEFAULT_CONDITIONS, rules: LEAGUE_RULES, ...over };
}
