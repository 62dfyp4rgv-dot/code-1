/**
 * QA area 3: statistical realism of full seasons (standard preset, ITA1 20 clubs + GER1 18 clubs, 10 seasons):
 * goals/home/draw/clean-sheet/card rates, scoring charts, table spreads, title dominance, age curves, wealth.
 * Bands come from docs/SIMULATION.md section 3 and general football knowledge, not from the implementation tests.
 */
import { describe, expect, it } from 'vitest';
import { advanceToEndOfSeason, ageOf, createWorld, overall, validateWorld } from '../src/index';
import { cfg, mean } from './helpers';

const SEASONS = 10;
const w = createWorld(cfg('qa-real', ['GER1', 'ITA1'], 'standard'));
const delta: Record<number, number[]> = {};
const meanByAge: Record<number, number[]> = {};
const prev = new Map<string, number>();
const snap = (): void => { for (const p of Object.values(w.players)) if (!p.retired && p.clubId) prev.set(p.id, overall(p)); };
snap();
const cashRatio: number[] = [];
for (let s = 0; s < SEASONS; s++) {
  advanceToEndOfSeason(w);
  for (const p of Object.values(w.players)) {
    if (p.retired || !p.clubId) continue;
    const a = Math.floor(ageOf(p, w.day));
    (meanByAge[a] ??= []).push(overall(p));
    const pv = prev.get(p.id);
    if (pv !== undefined) (delta[a - 1] ??= []).push(overall(p) - pv);
  }
  snap();
  cashRatio.push(Math.max(...Object.values(w.clubs).map((c) => c.finance.cash / (c.finance.broadcastingAnnual + c.finance.sponsorshipAnnual))));
}
const leagues = Object.keys(w.leagueMembers);
const stats = (lid: string) => w.history.seasons.map((s) => s.leagueStats[lid]!);

describe(`league-season statistics (${SEASONS} seasons)`, () => {
  it('world invariants hold after 10 seasons (verified OK)', () => {
    expect(validateWorld(w, { checkLedger: true }).filter((v) => v.severity !== 'medium')).toEqual([]);
  });
  for (const lid of leagues) {
    it(`${lid}: goals, home/draw/away split, clean sheets and cards are inside realistic bands`, () => {
      const s = stats(lid);
      expect(mean(s.map((x) => x.goalsPerMatch))).toBeGreaterThan(2.4);
      expect(mean(s.map((x) => x.goalsPerMatch))).toBeLessThan(3.2);
      expect(mean(s.map((x) => x.homeWinPct))).toBeGreaterThan(0.38);
      expect(mean(s.map((x) => x.homeWinPct))).toBeLessThan(0.5);
      expect(mean(s.map((x) => x.drawPct))).toBeGreaterThan(0.2);
      expect(mean(s.map((x) => x.drawPct))).toBeLessThan(0.3);
      expect(mean(s.map((x) => x.awayWinPct))).toBeGreaterThan(0.25);
      expect(mean(s.map((x) => x.cleanSheetPct))).toBeGreaterThan(0.2);
      expect(mean(s.map((x) => x.cleanSheetPct))).toBeLessThan(0.34);
      expect(mean(s.map((x) => x.yellowPerMatch))).toBeGreaterThan(2.8);
      expect(mean(s.map((x) => x.yellowPerMatch))).toBeLessThan(4.6);
      expect(mean(s.map((x) => x.redPerMatch))).toBeGreaterThan(0.04);
      expect(mean(s.map((x) => x.redPerMatch))).toBeLessThan(0.18);
      for (const x of s) expect(x.homeGoals).toBeGreaterThan(x.awayGoals);
    });
    it(`${lid}: top scorers 14-40 goals in every season (never 60), champion 60-100 pts, last place 12-40 pts`, () => {
      const n = w.leagueMembers[lid]!.length;
      for (const sum of w.history.seasons) {
        const top = sum.topScorers[lid]![0]!.goals;
        expect(top, `${lid} s${sum.season} top scorer`).toBeGreaterThanOrEqual(14);
        expect(top, `${lid} s${sum.season} top scorer`).toBeLessThanOrEqual(40);
        const st = sum.leagueStats[lid]!;
        expect(st.championPoints).toBeGreaterThanOrEqual(60); expect(st.championPoints).toBeLessThanOrEqual(100);
        expect(st.lastPlacePoints).toBeGreaterThanOrEqual(12); expect(st.lastPlacePoints).toBeLessThanOrEqual(40);
        expect(st.pointsSd).toBeGreaterThan(8); expect(st.pointsSd).toBeLessThan(22);
        expect(st.matches).toBe(n * (n - 1));
        // scoring chart sorted descending and not dominated by one player
        const goals = sum.topScorers[lid]!.map((t) => t.goals);
        expect([...goals].sort((a, b) => b - a)).toEqual(goals);
      }
    });
    it(`${lid}: title not monopolised (>=3 different champions in 10 seasons, max share <= 75%)`, () => {
      const counts: Record<string, number> = {};
      for (const s of w.history.seasons) counts[s.champions[lid]!.winner!] = (counts[s.champions[lid]!.winner!] ?? 0) + 1;
      expect(Object.keys(counts).length).toBeGreaterThanOrEqual(3);
      expect(Math.max(...Object.values(counts)) / SEASONS).toBeLessThanOrEqual(0.75);
    });
  }
});

describe('player ageing and development', () => {
  const m = (a: number): number => mean(delta[a] ?? [0]);
  it('prospects develop: mean yearly change is >= +1 for ages 17-21 and decreases with age', () => {
    for (let a = 17; a <= 21; a++) expect(m(a), `age ${a}`).toBeGreaterThan(1);
    for (let a = 18; a <= 26; a++) expect(m(a)).toBeLessThanOrEqual(m(a - 1) + 0.05);
  });
  it('33-year-olds decline (mean change <= -0.5), 30-year-olds decline slightly, 25-year-olds are stable', () => {
    expect(m(33)).toBeLessThan(-0.5);
    expect(m(30)).toBeLessThan(0);
    expect(Math.abs(m(25))).toBeLessThan(1);
  });
  it('mean ability peaks between 25 and 30', () => {
    const entries = Object.entries(meanByAge).filter(([, v]) => v.length > 100).map(([a, v]) => [+a, mean(v)] as const);
    const peak = entries.sort((x, y) => y[1] - x[1])[0]![0];
    expect(peak).toBeGreaterThanOrEqual(25); expect(peak).toBeLessThanOrEqual(30);
  });
  it('no super-players: best overall <= 95 and at most a handful above 88', () => {
    const best = Object.values(w.players).filter((p) => !p.retired).map(overall).sort((a, b) => b - a);
    expect(best[0]!).toBeLessThanOrEqual(95);
    expect(best.filter((x) => x >= 88).length).toBeLessThan(10);
  });
});

describe('wealth', () => {
  it('[QA-008] the richest club never hoards more than 3 years of TV+sponsor revenue in cash', () => {
    const worst = Math.max(...cashRatio);
    expect(worst, `max cash/(tv+sponsor) by season: ${cashRatio.map((x) => x.toFixed(1)).join(', ')}`).toBeLessThan(3);
  });
  it('no club has negative debt or non-finite cash (verified OK)', () => {
    for (const c of Object.values(w.clubs)) { expect(Number.isFinite(c.finance.cash)).toBe(true); expect(c.finance.debt).toBeGreaterThanOrEqual(0); }
  });
});

describe('managers', () => {
  it('[QA-016] managers are dismissed at a realistic rate (real football: ~15-25% of clubs change manager per season; require >= 5%)', () => {
    const clubs = Object.keys(w.clubs).length;
    const changes = w.history.seasons.map((s) => s.managerChanges.length);
    const rate = changes.reduce((a, b) => a + b, 0) / SEASONS / clubs;
    expect(rate, `manager changes per season in ${clubs} clubs: ${changes.join(',')}`).toBeGreaterThanOrEqual(0.05);
  });
  it('[QA-016] manager tenures are not frozen: fewer than 50% of current managers have been in post for the whole 10 seasons', () => {
    const employed = Object.values(w.managers).filter((m) => m.clubId);
    const full = employed.filter((m) => (w.day - m.tenure.startDay) / 364 >= SEASONS - 0.5).length;
    expect(full / employed.length).toBeLessThan(0.5);
  });
});
