// Seeded, serialisable PRNG (mulberry32). Every random decision in the game goes through
// an Rng instance so that matches, careers and simulations are reproducible and savable.

export function hashString(str) {
  // xmur3-style string hash -> uint32
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export class Rng {
  constructor(seed = 1) {
    this.s = typeof seed === 'string' ? hashString(seed) : (seed >>> 0) || 1;
  }
  get state() { return this.s; }
  set state(v) { this.s = v >>> 0; }
  next() {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  /** inclusive integer range */
  int(lo, hi) { return lo + Math.floor(this.next() * (hi - lo + 1)); }
  range(lo, hi) { return lo + this.next() * (hi - lo); }
  chance(p) { return this.next() < p; }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  /** roughly bell-shaped value in [-1, 1] (sum of two uniforms) */
  noise() { return (this.next() + this.next()) - 1; }
  /** weighted pick; weights[i] >= 0. returns index or -1 if all zero */
  weightedIndex(weights) {
    let total = 0;
    for (const w of weights) total += Math.max(0, w);
    if (total <= 0) return -1;
    let r = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= Math.max(0, weights[i]);
      if (r < 0) return i;
    }
    return weights.length - 1;
  }
  weighted(items, weightFn) {
    const i = this.weightedIndex(items.map(weightFn));
    return i < 0 ? null : items[i];
  }
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  /** derive an independent stream from this seed + label (no state consumed) */
  fork(label) { return new Rng(hashString(`${this.s}:${label}`)); }
}

/** Rng whose state lives in holder[key] (so the state object is always the single source of truth). */
export class BoundRng extends Rng {
  constructor(holder, key) {
    super(1);
    this.h = holder; this.k = key;
  }
  get s() { return this.h ? this.h[this.k] : this._s; }
  set s(v) { if (this.h) this.h[this.k] = v >>> 0; else this._s = v >>> 0; }
}
