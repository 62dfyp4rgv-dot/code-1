import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { Rng, hashString, keyedNoise } from '../src/rng';
import { mean, stdev } from '../src/math';

describe('Rng', () => {
  it('is deterministic for a seed and different across seeds', () => {
    const a = Rng.fromSeed('x'); const b = Rng.fromSeed('x'); const c = Rng.fromSeed('y');
    const sa = Array.from({ length: 20 }, () => a.next()); const sb = Array.from({ length: 20 }, () => b.next()); const sc = Array.from({ length: 20 }, () => c.next());
    expect(sa).toEqual(sb);
    expect(sa).not.toEqual(sc);
  });
  it('derive() does not advance the parent and children are independent', () => {
    const a = Rng.fromSeed('p'); const b = Rng.fromSeed('p');
    a.derive('child'); a.derive('other');
    expect(a.next()).toBe(b.next());
    const c1 = Rng.fromSeed('p').derive('c'); const c2 = Rng.fromSeed('p').derive('c'); const c3 = Rng.fromSeed('p').derive('d');
    expect(c1.next()).toBe(c2.next());
    expect(Rng.fromSeed('p').derive('c').next()).not.toBe(c3.next());
  });
  it('produces uniform [0,1) values with the right moments', () => {
    const r = Rng.fromSeed('u'); const xs = Array.from({ length: 50000 }, () => r.next());
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0); expect(Math.max(...xs)).toBeLessThan(1);
    expect(mean(xs)).toBeCloseTo(0.5, 2); expect(stdev(xs)).toBeCloseTo(Math.sqrt(1 / 12), 2);
  });
  it('normal and poisson have the right mean and variance', () => {
    const r = Rng.fromSeed('n');
    const n = Array.from({ length: 40000 }, () => r.normal(10, 3));
    expect(mean(n)).toBeCloseTo(10, 1); expect(stdev(n)).toBeCloseTo(3, 1);
    for (const lambda of [0.7, 2.5, 8]) {
      const p = Array.from({ length: 40000 }, () => r.poisson(lambda));
      expect(mean(p)).toBeCloseTo(lambda, 1); expect(stdev(p) ** 2).toBeCloseTo(lambda, 0);
    }
  });
  it('gamma(shape) has mean = shape', () => {
    const r = Rng.fromSeed('g');
    for (const k of [0.6, 1.5, 4]) expect(mean(Array.from({ length: 30000 }, () => r.gamma(k)))).toBeCloseTo(k, 1);
  });
  it('weightedIndex follows the weights and never picks zero-weight items', () => {
    const r = Rng.fromSeed('w'); const counts = [0, 0, 0, 0];
    for (let i = 0; i < 40000; i++) counts[r.weightedIndex([1, 0, 3, 6])]!++;
    expect(counts[1]).toBe(0);
    expect(counts[2]! / counts[0]!).toBeGreaterThan(2.6); expect(counts[2]! / counts[0]!).toBeLessThan(3.4);
  });
  it('shuffle is always a permutation (property)', () => {
    fc.assert(fc.property(fc.array(fc.integer(), { maxLength: 60 }), fc.string(), (xs, seed) => {
      const out = Rng.fromSeed(seed).shuffle(xs);
      expect([...out].sort((a, b) => a - b)).toEqual([...xs].sort((a, b) => a - b));
    }), { numRuns: 100 });
  });
  it('int/between stay within bounds (property)', () => {
    fc.assert(fc.property(fc.string(), fc.integer({ min: 1, max: 1000 }), (seed, n) => {
      const r = Rng.fromSeed(seed);
      for (let i = 0; i < 50; i++) { const v = r.int(n); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(n); }
    }), { numRuns: 60 });
  });
  it('hash and keyed noise are stable and bounded', () => {
    expect(hashString('abc')).toBe(hashString('abc'));
    expect(hashString('abc')).not.toBe(hashString('abd'));
    for (let i = 0; i < 200; i++) { const k = keyedNoise('club', i); expect(k).toBeGreaterThanOrEqual(-1); expect(k).toBeLessThan(1); }
  });
});
