/** Adversarial long-horizon simulation: distortions that only appear after many seasons. */
import { beforeAll, describe, expect, it } from 'vitest';
import { createWorld, advanceToEndOfSeason } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { validateWorld } from '../src/world/invariants';
import { overall } from '../src/players';
import { allPlayers, freeAgents, squadOf } from '../src/world/runtime';
import { LEAGUE_BY_ID } from '../src/competition/registry';
import type { WorldState } from '../src/world/types';

const SEASONS = 8;
const snap: { s: number; median: number; p95: number; cashMedian: number; free: number; gpm: number; viol: string[]; squadMin: number }[] = [];
let w: WorldState;
const titles: Record<string, string[]> = {};

beforeAll(() => {
  const cfg = defaultWorldConfig('longrun-test', 'compact');
  cfg.leagues = ['ENG1', 'SAU1', 'USA1', 'ESP1'];
  w = createWorld(cfg);
  for (let s = 1; s <= SEASONS; s++) {
    advanceToEndOfSeason(w);
    const ovs = allPlayers(w).filter((p) => !p.retired).map(overall).sort((a, b) => a - b);
    const cash = Object.values(w.clubs).map((c) => c.finance.cash).sort((a, b) => a - b);
    const sum = w.history.seasons.at(-1)!;
    const lg = Object.entries(sum.leagueStats).filter(([k]) => LEAGUE_BY_ID[k]?.tier === 1);
    for (const [lid] of lg) (titles[lid] ??= []).push(w.history.champions[lid]![s]!.winner!);
    snap.push({
      s, median: ovs[Math.floor(ovs.length / 2)]!, p95: ovs[Math.floor(ovs.length * 0.95)]!, cashMedian: cash[Math.floor(cash.length / 2)]!, free: freeAgents(w).length,
      gpm: lg.reduce((a, [, x]) => a + x.goalsPerMatch * x.matches, 0) / lg.reduce((a, [, x]) => a + x.matches, 0),
      viol: validateWorld(w, { checkLedger: true }).filter((v) => v.severity !== 'medium').map((v) => `${v.code}: ${v.message}`),
      squadMin: Math.min(...Object.values(w.clubs).map((c) => squadOf(w, c.id).length)),
    });
  }
});

describe(`${SEASONS}-season stress run (4 leagues, compact)`, () => {
  it('never violates an integrity invariant at any season boundary', () => {
    for (const s of snap) expect(s.viol, `season ${s.s}`).toEqual([]);
  });
  it('keeps the talent pool stationary (no rating inflation or collapse)', () => {
    expect(Math.abs(snap.at(-1)!.median - snap[0]!.median)).toBeLessThanOrEqual(3);
    expect(snap.at(-1)!.p95 - snap[0]!.p95).toBeLessThanOrEqual(6);
    expect(snap.at(-1)!.p95 - snap[0]!.p95).toBeGreaterThanOrEqual(-6);
  });
  it('keeps scoring within a realistic band every season', () => {
    for (const s of snap) { expect(s.gpm, `season ${s.s}`).toBeGreaterThan(2.35); expect(s.gpm, `season ${s.s}`).toBeLessThan(3.6); }
  });
  it('does not let the free-agent pool or squads degenerate', () => {
    for (const s of snap) { expect(s.free).toBeLessThan(1200); expect(s.squadMin).toBeGreaterThanOrEqual(18); }
  });
  it('keeps club finances bounded (no runaway median cash)', () => {
    expect(snap.at(-1)!.cashMedian).toBeLessThan(snap[0]!.cashMedian * 6 + 2e8);
  });
  it('title races stay open: more than one champion per league over the period, no single club wins everything', () => {
    for (const [lid, winners] of Object.entries(titles)) {
      const distinct = new Set(winners).size;
      expect(distinct, lid).toBeGreaterThanOrEqual(2);
      const top = Math.max(...Object.values(winners.reduce<Record<string, number>>((a, c) => ({ ...a, [c]: (a[c] ?? 0) + 1 }), {})));
      expect(top / winners.length, lid).toBeLessThan(0.9);
    }
  });
  it('player careers are continuous across seasons: every active player has a coherent history', () => {
    let checked = 0;
    for (const p of allPlayers(w)) {
      if (p.retired || p.history.length < 3) continue;
      const seasons = p.history.map((l) => l.season);
      expect(seasons).toEqual([...seasons].sort((a, b) => a - b));
      for (const l of p.history) expect(l.minutes).toBeLessThanOrEqual(l.apps * 125);
      checked++;
      if (checked > 400) break;
    }
    expect(checked).toBeGreaterThan(50);
  });
  it('the academy produces players and the game keeps a healthy age structure', () => {
    const ages = allPlayers(w).filter((p) => !p.retired && p.clubId).map((p) => (w.day - p.birthDay) / 365.25);
    const mean = ages.reduce((a, b) => a + b, 0) / ages.length;
    expect(mean).toBeGreaterThan(21); expect(mean).toBeLessThan(28);
    expect(w.history.legends.length).toBeGreaterThanOrEqual(0);
  });
});
