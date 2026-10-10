import { describe, expect, it } from 'vitest';
import { simulateCareer, type CareerResult } from '../src';

const run = (i: number, pos: 'ST' | 'CM' | 'CB' | 'GK' | 'AM' | 'LW', talent?: 'wonderkid' | 'journeyman'): CareerResult => simulateCareer({ seed: `t${i}`, name: `Test Player ${i}`, position: pos, talent });

describe('player career simulation', () => {
  const careers: CareerResult[] = [];
  const seen: number[] = [];
  for (let i = 0; i < 12; i++) careers.push(simulateCareer({ seed: `t${i}`, name: `Test Player ${i}`, position: (['ST', 'CM', 'CB', 'GK', 'AM', 'LW'] as const)[i % 6]! }, (s) => { if (i === 0) seen.push(s.season); }));

  it('is deterministic for the same input', () => {
    const a = run(3, 'CB'); const b = run(3, 'CB');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(run(4, 'CB'))).not.toBe(JSON.stringify(a));
  }, 60_000);

  it('reports every season once, in order, with consistent totals', () => {
    expect(seen).toEqual(careers[0]!.seasons.map((s) => s.season));
    for (const c of careers) {
      c.seasons.forEach((s, i) => { expect(s.season).toBe(i + 1); expect(s.age).toBe((c.input.startAge ?? 16) + i); });
      expect(c.totals.apps).toBe(c.seasons.reduce((a, s) => a + s.apps, 0));
      expect(c.totals.goals).toBe(c.seasons.reduce((a, s) => a + s.goals, 0));
      for (const s of c.seasons) {
        expect(s.leaguePos).toBeGreaterThanOrEqual(1); expect(s.leaguePos).toBeLessThanOrEqual(s.leagueSize);
        expect(s.starts).toBeLessThanOrEqual(s.apps); expect(s.minutes).toBeLessThanOrEqual(s.apps * 125);
        expect(s.ovr).toBeGreaterThanOrEqual(1); expect(s.ovr).toBeLessThanOrEqual(99);
        expect(s.goals).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('has a plausible shape: career length, ageing, positions and trophies', () => {
    for (const c of careers) {
      expect(c.retiredAge).toBeGreaterThanOrEqual(30); expect(c.retiredAge).toBeLessThanOrEqual(42);
      expect(c.peak.ovr).toBeLessThanOrEqual(c.potential + 4);
      expect(c.peak.age).toBeGreaterThanOrEqual(19); expect(c.peak.age).toBeLessThanOrEqual(33);
      const last = c.seasons[c.seasons.length - 1]!;
      expect(last.ovr).toBeLessThanOrEqual(c.peak.ovr);
      if (c.input.position === 'GK') expect(c.totals.goals).toBe(0);
    }
    const strikers = careers.filter((c) => c.input.position === 'ST'); const keepers = careers.filter((c) => c.input.position === 'GK');
    expect(Math.max(...strikers.map((c) => c.totals.goals))).toBeGreaterThan(30);
    expect(Math.max(...keepers.map((c) => c.totals.cleanSheets))).toBeGreaterThan(10);
  });

  it('uses real-world names for clubs and trophies and only awards trophies that were won', () => {
    for (const c of careers) {
      for (const s of c.seasons) {
        expect(s.club.length).toBeGreaterThan(2);
        for (const h of s.honours) expect([s.league, s.cup, s.continental?.competition]).toContain(h);
        if (s.honours.includes(s.league)) expect(s.leaguePos).toBe(1);
      }
      const counted = c.honours.reduce((a, h) => a + h.count, 0);
      expect(counted).toBe(c.seasons.reduce((a, s) => a + s.honours.length + s.awards.length, 0));
    }
  });

  it('a wonderkid ends up better than a journeyman on average', () => {
    const w = [0, 1, 2].map((i) => run(i, 'CM', 'wonderkid').peak.ovr); const j = [0, 1, 2].map((i) => run(i, 'CM', 'journeyman').peak.ovr);
    expect(w.reduce((a, b) => a + b, 0) / 3).toBeGreaterThan(j.reduce((a, b) => a + b, 0) / 3 + 8);
  }, 120_000);
});
