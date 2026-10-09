/**
 * Deterministic, serialisable pseudo-random number generation.
 *
 * Design: the simulation never keeps a global RNG. Every consumer derives its own
 * stream from a string seed (`Rng.fromSeed("world:match:123")`), so results depend
 * only on (seed, inputs) and never on call order elsewhere. This makes match replay
 * and save/load determinism trivial: nothing about RNG state has to be persisted.
 */

/** 53-bit string hash (cyrb53). Not cryptographic; used for seeding and integrity checks. */
export function hashString(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function splitmix32(a: number): () => number {
  return () => {
    a = (a + 0x9e3779b9) | 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    return (t ^ (t >>> 15)) >>> 0;
  };
}

export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  private constructor(a: number, b: number, c: number, d: number) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
  }

  static fromSeed(seed: string | number): Rng {
    const n = typeof seed === 'number' ? seed : hashString(seed);
    const sm = splitmix32(n % 4294967296 ^ Math.floor(n / 4294967296));
    const r = new Rng(sm(), sm(), sm(), sm());
    for (let i = 0; i < 12; i++) r.next(); // warm up
    return r;
  }

  /** Derive an independent child stream. Does not advance this stream. */
  derive(label: string): Rng {
    return Rng.fromSeed(`${this.a}.${this.b}.${this.c}.${this.d}/${label}`);
  }

  /** sfc32. Returns a float in [0, 1). */
  next(): number {
    const t = (((this.a + this.b) | 0) + this.d) | 0;
    this.d = (this.d + 1) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.c = (this.c + t) | 0;
    return (t >>> 0) / 4294967296;
  }

  /** Integer in [0, n). */
  int(n: number): number {
    return Math.floor(this.next() * n);
  }

  /** Integer in [lo, hi] inclusive. */
  between(lo: number, hi: number): number {
    return lo + this.int(hi - lo + 1);
  }

  float(lo: number, hi: number): number {
    return lo + this.next() * (hi - lo);
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Standard normal via Box–Muller. */
  normal(mean = 0, sd = 1): number {
    let u = 0;
    while (u === 0) u = this.next();
    const v = this.next();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** Poisson via Knuth (small lambda) / normal approximation (large). */
  poisson(lambda: number): number {
    if (lambda <= 0) return 0;
    if (lambda > 30) return Math.max(0, Math.round(this.normal(lambda, Math.sqrt(lambda))));
    const l = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= this.next();
    } while (p > l);
    return k - 1;
  }

  /** Gamma(shape, scale=1) via Marsaglia–Tsang. Used for overdispersion. */
  gamma(shape: number): number {
    if (shape < 1) return this.gamma(shape + 1) * Math.pow(this.next() || 1e-12, 1 / shape);
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    for (;;) {
      let x: number;
      let v: number;
      do {
        x = this.normal();
        v = 1 + c * x;
      } while (v <= 0);
      v = v * v * v;
      const u = this.next();
      if (u < 1 - 0.0331 * x * x * x * x || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick on empty array');
    return items[this.int(items.length)] as T;
  }

  /** Index chosen proportionally to non-negative weights. */
  weightedIndex(weights: readonly number[]): number {
    let total = 0;
    for (const w of weights) total += w > 0 ? w : 0;
    if (total <= 0) return this.int(weights.length);
    let r = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      const w = weights[i] ?? 0;
      if (w <= 0) continue;
      r -= w;
      if (r < 0) return i;
    }
    return weights.length - 1;
  }

  weightedPick<T>(items: readonly T[], weight: (t: T) => number): T {
    const idx = this.weightedIndex(items.map(weight));
    return items[idx] as T;
  }

  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [out[i], out[j]] = [out[j] as T, out[i] as T];
    }
    return out;
  }
}

/** Deterministic noise in [-1, 1) keyed by arbitrary strings (e.g. scouting error per club/player). */
export function keyedNoise(...keys: (string | number)[]): number {
  return (hashString(keys.join('|')) % 100000) / 50000 - 1;
}
