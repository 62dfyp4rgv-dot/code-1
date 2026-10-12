// Seeded PRNG (sfc32) with serialisable state. All simulation randomness must come from here.
function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}
export class RNG {
  constructor(seed = 1) {
    const s = typeof seed === 'number' ? String(seed) : seed;
    const g = hashSeed(String(s));
    this.s = [g(), g(), g(), g()];
    for (let i = 0; i < 12; i++) this.u32();
  }
  u32() {
    let [a, b, c, d] = this.s;
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    this.s = [a, b, c, d];
    return t >>> 0;
  }
  next() {
    return this.u32() / 4294967296;
  }
  range(lo, hi) {
    return lo + (hi - lo) * this.next();
  }
  int(lo, hi) {
    return lo + Math.floor(this.next() * (hi - lo + 1));
  } // inclusive
  chance(p) {
    return this.next() < p;
  }
  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }
  normal(mean = 0, sd = 1) {
    const u = Math.max(1e-12, this.next()),
      v = this.next();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  weighted(weights) {
    // index chosen proportional to non-negative weights
    let tot = 0;
    for (const w of weights) tot += w;
    if (tot <= 0) return Math.floor(this.next() * weights.length);
    let r = this.next() * tot;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) return i;
    }
    return weights.length - 1;
  }
  getState() {
    return this.s.slice();
  }
  setState(s) {
    this.s = s.slice();
  }
}
// Stateless hash -> [0,1): stable per (key) values for static noise (e.g. derived country variation).
export function hash01(str) {
  const g = hashSeed(String(str));
  g();
  return g() / 4294967296;
}
