import { clamp } from '../math';
import { ageOf, overall } from '../players';
import { POSITION_GROUP, type Player, type Position } from '../types';

/** Scenario valuation curve anchors (EUR). Calibrated so ability 60 ~ 2.5m, 75 ~ 18m, 88 ~ 100m. */
const V0 = 2.5e6;
const A0 = 60;
const K = 0.1317;

const POSITION_PREMIUM: Record<Position, number> = {
  GK: 0.65, CB: 0.9, LB: 0.85, RB: 0.85, DM: 0.95, CM: 1.0, AM: 1.12, LW: 1.12, RW: 1.12, ST: 1.2,
};

export function ageValueFactor(age: number): number {
  if (age <= 19) return 1.05;
  if (age <= 23) return 1.0;
  if (age <= 27) return 0.97;
  if (age <= 29) return 0.82;
  if (age <= 31) return 0.58;
  if (age <= 33) return 0.34;
  if (age <= 35) return 0.16;
  return 0.07;
}

/** Ability blended with potential for young players (potential is hidden from AI; they see an estimate). */
export function blendedAbility(ov: number, pot: number, age: number): number {
  const youth = clamp((27 - age) / 10, 0, 1); // 1 at <=17, 0 at >=27
  return ov + (pot - ov) * 0.55 * youth;
}

export function marketValue(p: Player, day: number, estimate?: { ability: number; potential: number }): number {
  const age = ageOf(p, day);
  const ov = estimate ? estimate.ability : overall(p);
  const pot = estimate ? estimate.potential : p.pot;
  const a = blendedAbility(ov, pot, age);
  let v = V0 * Math.exp(K * (a - A0)) * ageValueFactor(age) * POSITION_PREMIUM[p.primary];
  if (p.contract) {
    const years = (p.contract.endDay - day) / 365;
    v *= clamp(0.5 + 0.35 * years, 0.5, 1.0);
  }
  return Math.max(10000, Math.round(v / 1000) * 1000);
}

/** Weekly wage an average club would pay for the player's value. League wage factor adjusts per market. */
export function baseWageWeekly(value: number, ability: number): number {
  const w = value * 0.0022 + Math.max(0, ability - 35) * 55;
  return Math.max(900, Math.round(w / 100) * 100);
}

export function contractYearsFor(age: number, rngValue: number): number {
  const base = age <= 21 ? 4 : age <= 28 ? 4 : age <= 31 ? 3 : 1.5;
  return Math.max(1, Math.round(base + (rngValue - 0.5) * 2));
}

export function isGoalkeeper(p: Pick<Player, 'primary'>): boolean {
  return POSITION_GROUP[p.primary] === 'GK';
}
