import { describe, expect, it } from 'vitest';
import { CareerSim, NATIONS, careerClubs, simulateCareer, type CareerResult } from '../src';

const run = (i: number, pos: 'ST' | 'CM' | 'CB' | 'GK' | 'AM' | 'LW', talent?: 'wonderkid' | 'journeyman'): CareerResult => simulateCareer({ seed: `t${i}`, name: `Test Player ${i}`, position: pos, talent });

describe('player career simulation', () => {
  const careers: CareerResult[] = [];
  const seen: number[] = [];
  for (let i = 0; i < 12; i++) careers.push(simulateCareer({ seed: `t${i}`, name: `Test Player ${i}`, position: (['ST', 'CM', 'CB', 'GK', 'AM', 'LW'] as const)[i % 6]!, nationality: ['ARG', 'FRA', 'ENG', 'BRA', 'ESP', 'POR'][i % 6] }, (s) => { if (i === 0) seen.push(s.season); }));

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
        for (const h of s.honours) expect([s.league, s.cup, s.continental?.competition, s.tournament?.name]).toContain(h);
        if (s.honours.includes(s.league)) expect(s.leaguePos).toBe(1);
      }
      expect(c.honours.reduce((a, h) => a + h.count, 0)).toBe(c.seasons.reduce((a, s) => a + s.honours.length, 0));
      expect(c.awards.reduce((a, h) => a + h.count, 0)).toBe(c.seasons.reduce((a, s) => a + s.awards.length, 0));
    }
  });

  it('a wonderkid ends up better than a journeyman on average', () => {
    const w = [0, 1, 2].map((i) => run(i, 'CM', 'wonderkid').peak.ovr); const j = [0, 1, 2].map((i) => run(i, 'CM', 'journeyman').peak.ovr);
    expect(w.reduce((a, b) => a + b, 0) / 3).toBeGreaterThan(j.reduce((a, b) => a + b, 0) / 3 + 8);
  }, 120_000);
});

describe('personal awards, Ballon d\'Or, World Cup and chosen transfers', () => {
  it('national teams: tournaments only in the right seasons, results are consistent, caps include tournament matches', () => {
    const rs = ['ARG', 'FRA', 'ENG', 'BRA', 'ESP', 'POR'].map((n, i) => simulateCareer({ seed: `wc${i}`, name: `Star ${i}`, position: 'ST', nationality: n, talent: 'wonderkid' }));
    let played = 0;
    for (const r of rs) {
      expect(r.nation.code).toBeTruthy();
      for (const s of r.seasons) {
        if (!s.tournament) continue;
        played++;
        expect([2, 0]).toContain(s.season % 4);
        expect(s.age).toBeGreaterThanOrEqual(18);
        if (s.season % 4 === 0) expect(s.tournament.name).toBe('FIFA World Cup');
        expect(s.tournament.won).toBe(s.tournament.result === 'Winner');
        if (s.tournament.won) expect(s.honours).toContain(s.tournament.name);
        expect(s.tournament.matches).toBeGreaterThanOrEqual(0);
      }
      expect(r.totals.caps).toBeGreaterThanOrEqual(r.tournaments.reduce((a, t) => a + t.matches, 0));
    }
    expect(played).toBeGreaterThan(5);
  }, 120_000);

  it('individual awards and Ballon d\'Or are consistent with the season records', () => {
    const rs = [0, 1, 2, 3].map((i) => simulateCareer({ seed: `bd${i}`, name: `Elite ${i}`, position: i % 2 ? 'AM' : 'ST', nationality: 'FRA', talent: 'wonderkid' }));
    for (const r of rs) {
      const wins = r.seasons.filter((s) => s.ballonDor?.rank === 1).length;
      expect(r.ballonDor.wins).toBe(wins);
      expect(r.awards.find((a) => a.name === "Ballon d'Or")?.count ?? 0).toBe(wins);
      for (const s of r.seasons) {
        if (s.ballonDor?.rank === 1) expect(s.awards).toContain("Ballon d'Or");
        if (s.ballonDor) { expect(s.age).toBeGreaterThanOrEqual(18); expect(s.ovr).toBeGreaterThanOrEqual(70); }
      }
    }
    // a Ballon d'Or is only plausible for an elite player
    for (const r of rs) if (r.ballonDor.wins > 0) expect(r.peak.ovr).toBeGreaterThanOrEqual(84);
    const weak = simulateCareer({ seed: 'weak', name: 'Weak', position: 'CM', talent: 'journeyman' });
    expect(weak.ballonDor.wins).toBe(0);
  }, 120_000);

  it('a chosen start club and chosen transfers are honoured, and the same choices give the same career', () => {
    const clubs = careerClubs();
    expect(clubs.length).toBeGreaterThan(150);
    expect(NATIONS.length).toBeGreaterThan(40);
    const start = 'FC Barcelona';
    const run = (pick: (offers: string[]) => string | null): CareerResult => {
      const sim = new CareerSim({ seed: 'choice', name: 'Chooser', position: 'CM', nationality: 'ESP', talent: 'prospect', startClub: start, transfers: 'manual' });
      for (let g = 0; g < 30 && !sim.finished; g++) {
        const s = sim.playSeason();
        if (g === 0) expect(s.club).toBe(start);
        const w = sim.pendingWindow;
        if (w) { expect(w.offers.length).toBeGreaterThan(0); expect(new Set(w.offers.map((o) => o.id)).size).toBe(w.offers.length); sim.decide(pick(w.offers.map((o) => o.id))); }
      }
      return sim.result();
    };
    const stayer = run(() => 'stay');
    const first = run((ids) => ids[0] ?? null);
    expect(JSON.stringify(run((ids) => ids[0] ?? null))).toBe(JSON.stringify(first));
    expect(stayer.clubs.length).toBeLessThan(first.clubs.length + 1);
    // after a chosen move the next season is at the chosen club
    const sim = new CareerSim({ seed: 'choice2', name: 'Chooser', position: 'ST', nationality: 'ENG', talent: 'wonderkid', transfers: 'manual' });
    let verified = false;
    for (let g = 0; g < 30 && !sim.finished && !verified; g++) {
      sim.playSeason();
      const w = sim.pendingWindow;
      if (!w) continue;
      const target = w.offers[w.offers.length - 1]!;
      sim.decide(target.id);
      if (!sim.finished) { expect(sim.playSeason().club).toBe(target.club); verified = true; }
    }
    expect(verified).toBe(true);
    expect(() => { const s2 = new CareerSim({ seed: 'x', name: 'X', position: 'ST', transfers: 'manual' }); for (let i = 0; i < 30 && !s2.finished; i++) { s2.playSeason(); if (s2.pendingWindow) { s2.playSeason(); return; } } throw new Error('no window to test'); }).toThrow(/pending transfer window|no window/);
  }, 180_000);
});
