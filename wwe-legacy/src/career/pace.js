// Career pacing: popularity gets harder to earn the higher it is, so a career takes years to peak.
import { clamp } from '../core/util.js';

/** Multiplier applied to positive popularity gains: 1.0 up to 30, then a smooth fall to 0.14 near the top. */
export function popGainFactor(pop) {
  return pop <= 30 ? 1 : Math.max(0.14, 1 - ((pop - 30) / 70) * 0.86);
}

/** Add (or remove) popularity. Gains diminish with current popularity; losses do not. */
export function gainPop(player, amount) {
  const a = amount > 0 ? amount * popGainFactor(player.popularity) : amount;
  player.popularity = clamp(player.popularity + a, 0, 100);
  return a;
}
