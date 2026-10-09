/**
 * Statistical calibration. Target bands are *approximate* long-run figures for top European leagues recalled by
 * the authors (not derived from a licensed dataset in this repo). They guard against drift and gross unrealism;
 * they are not a claim of validated real-world accuracy. See docs/SIMULATION.md.
 */
import { describe, expect, it } from 'vitest';
import { simulateMatch } from '../src/match';
import { syntheticMatch, syntheticSheet } from '../src/synth';
import { Rng } from '../src/rng';
import { mean } from '../src/math';

const N = 2500;
const rng = Rng.fromSeed('calibration');
const rows = Array.from({ length: N }, (_, i) => {
  const qh = rng.normal(62, 6); const qa = rng.normal(62, 6);
  const r = simulateMatch(syntheticMatch(`c${i}`, `s${i}`, syntheticSheet({ id: 'H', quality: qh, seed: String(i) }), syntheticSheet({ id: 'A', quality: qa, seed: String(i) })));
  return { r, qh, qa };
});
const avg = (f: (r: (typeof rows)[number]['r']) => number): number => mean(rows.map((x) => f(x.r)));
const within = (v: number, lo: number, hi: number, label: string): void => { expect(v, label).toBeGreaterThanOrEqual(lo); expect(v, label).toBeLessThanOrEqual(hi); };

describe('league-wide calibration (heterogeneous team quality)', () => {
  it('goals per match', () => within(avg((r) => r.score.home + r.score.away), 2.5, 3.15, 'goals/match'));
  it('home advantage: home scores more, home win % in band', () => {
    const hg = avg((r) => r.score.home); const ag = avg((r) => r.score.away);
    within(hg / ag, 1.1, 1.5, 'home/away goal ratio');
    within(avg((r) => (r.score.home > r.score.away ? 1 : 0)), 0.39, 0.50, 'home win');
  });
  it('draw frequency', () => within(avg((r) => (r.score.home === r.score.away ? 1 : 0)), 0.21, 0.30, 'draw rate'));
  it('clean sheets per team', () => within(avg((r) => ((r.score.home === 0 ? 1 : 0) + (r.score.away === 0 ? 1 : 0)) / 2), 0.2, 0.34, 'clean sheet rate'));
  it('shots, shots on target, expected goals', () => {
    within(avg((r) => r.stats.home.shots + r.stats.away.shots), 22, 30, 'shots');
    within(avg((r) => r.stats.home.shotsOnTarget + r.stats.away.shotsOnTarget) / avg((r) => r.stats.home.shots + r.stats.away.shots), 0.3, 0.42, 'SoT share');
    // xG should be an honest predictor of goals over a large sample
    within(avg((r) => r.stats.home.xg + r.stats.away.xg) / avg((r) => r.score.home + r.score.away), 0.9, 1.1, 'xG / goals');
  });
  it('discipline: fouls, yellow and red cards', () => {
    within(avg((r) => r.stats.home.fouls + r.stats.away.fouls), 18, 27, 'fouls');
    within(avg((r) => r.stats.home.yellow + r.stats.away.yellow), 2.8, 4.4, 'yellows');
    within(avg((r) => r.stats.home.red + r.stats.away.red), 0.05, 0.16, 'reds');
  });
  it('injuries per team per match are present but rare enough to keep the game playable', () => {
    within(avg((r) => r.injuries.length) / 2, 0.15, 0.4, 'injuries/team/match');
  });
  it('set pieces and passing', () => {
    within(avg((r) => r.stats.home.corners + r.stats.away.corners), 7, 12, 'corners');
    within(avg((r) => (r.stats.home.passesCompleted + r.stats.away.passesCompleted) / (r.stats.home.passes + r.stats.away.passes)), 0.78, 0.9, 'pass accuracy');
    within(avg((r) => r.stats.home.passes + r.stats.away.passes), 700, 1100, 'passes');
    within(avg((r) => r.stats.home.offsides + r.stats.away.offsides), 2, 5.5, 'offsides');
  });
  it('quality edge translates to results without making upsets impossible', () => {
    const strong = rows.filter((x) => x.qh - x.qa > 8); const weak = rows.filter((x) => x.qa - x.qh > 8);
    const homeStrongWin = mean(strong.map((x) => (x.r.score.home > x.r.score.away ? 1 : 0)));
    const homeWeakWin = mean(weak.map((x) => (x.r.score.home > x.r.score.away ? 1 : 0)));
    expect(homeStrongWin).toBeGreaterThan(homeWeakWin + 0.25);
    expect(homeWeakWin).toBeGreaterThan(0.08); // upsets happen
    expect(homeStrongWin).toBeLessThan(0.9);
  });
  it('goal distribution is overdispersed relative to a single Poisson but not wildly', () => {
    const totals = rows.map((x) => x.r.score.home + x.r.score.away);
    const m = mean(totals); const v = mean(totals.map((t) => (t - m) ** 2));
    within(v / m, 0.95, 1.35, 'variance/mean');
  });
  it('player level: top scorers concentrate goals but no single player dominates a match', () => {
    const maxPerMatch = Math.max(...rows.map((x) => Math.max(...x.r.players.map((p) => p.goals))));
    expect(maxPerMatch).toBeLessThanOrEqual(5);
    const shares = rows.map((x) => { const t = x.r.stats.home.shots; return t > 0 ? Math.max(...x.r.players.filter((p) => p.side === 'home').map((p) => p.shots)) / t : 0; });
    within(mean(shares), 0.14, 0.36, 'top shooter share of team shots');
    const hatTricks = rows.filter((x) => x.r.players.some((p) => p.goals >= 3)).length / N;
    within(hatTricks, 0.005, 0.05, 'hat-trick rate per match');
  });
  it('stoppage time stays within realistic bounds', () => {
    for (const x of rows.slice(0, 500)) { expect(x.r.stoppage.first).toBeGreaterThanOrEqual(1); expect(x.r.stoppage.first).toBeLessThanOrEqual(9); expect(x.r.stoppage.second).toBeGreaterThanOrEqual(1); expect(x.r.stoppage.second).toBeLessThanOrEqual(10); }
  });
});
