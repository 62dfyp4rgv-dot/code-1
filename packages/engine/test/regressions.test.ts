/** Regression tests for defects found by tools, reviews and the integrity checker. Each names the ledger id. */
import { describe, expect, it } from 'vitest';
import { createWorld, advanceToEndOfSeason } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { validateWorld } from '../src/world/invariants';

describe('OP-1 foreign-player limits across promotion/relegation (Saudi two-tier pyramid)', () => {
  it('relegated and promoted clubs comply with their new league limit after the season rollover', () => {
    const cfg = defaultWorldConfig('op1', 'standard'); cfg.leagues = ['SAU1'];
    const w = createWorld(cfg);
    expect(Object.keys(w.leagueMembers).sort()).toEqual(['SAU1', 'SAU2']);
    advanceToEndOfSeason(w);
    expect(w.history.seasons[0]!.relegated.length).toBeGreaterThan(0);
    expect(validateWorld(w, { checkLedger: true }).filter((v) => v.severity !== 'medium')).toEqual([]);
  });
});

describe('OP-2 degenerate fields never leave a competition stuck', () => {
  it('a world with one Asian league still completes every competition it starts', () => {
    const cfg = defaultWorldConfig('op2', 'compact'); cfg.leagues = ['SAU1'];
    const w = createWorld(cfg);
    const ids = Object.keys(w.competitions);
    advanceToEndOfSeason(w);
    for (const id of ids) {
      const h = w.history.champions[id]?.[1];
      expect(h, id).toBeTruthy();
      expect(h!.winner, `${id} must have a winner`).toBeTruthy();
    }
    expect(w.news.some((n) => n.text.includes('stuck') || n.text.includes('force-played'))).toBe(false);
  });
});

import { advanceDays } from '../src/world/sim';
import { setHumanClub, listForTransfer, signFreeAgentAction, offerRenewal, releasePlayerAction, scoutReport, bidForPlayer, playerProfile, setTactics } from '../src/index';
import { simulateMatch } from '../src/match';
import { syntheticMatch, syntheticSheet } from '../src/synth';
import { defaultTactics } from '../src/tactics';
import { freeAgents, squadOf } from '../src/world/runtime';
import { marketValue } from '../src/world/valuation';

describe('QA-002 listing at an absurd price does not print money', () => {
  it('AI buyers never pay more than their own valuation of a listed player', () => {
    const w = createWorld(defaultWorldConfig('qa2', 'compact'));
    const me = w.leagueMembers.ENG1![9]!; setHumanClub(w, me);
    const p = [...squadOf(w, me)].sort((a, b) => a.pot - b.pot)[0]!;
    const value = marketValue(p, w.day);
    expect(listForTransfer(w, p.id, 15e6).ok).toBe(true);
    const cashBefore = w.clubs[me]!.finance.cash;
    advanceDays(w, 60);
    if (p.clubId !== me) expect(w.clubs[me]!.finance.cash - cashBefore).toBeLessThan(value * 2 + 5e7);
    expect(p.clubId === me || value * 1.13 >= 15e6).toBe(true); // sold only if the AI itself valued him near the asking price
  });
});

describe('QA-003/004/005/007 action input validation', () => {
  const w = createWorld(defaultWorldConfig('qa3', 'compact'));
  const me = w.leagueMembers.ENG1![3]!; setHumanClub(w, me);
  it('rejects NaN, Infinity, negative and absurd numbers without touching the world', () => {
    const fa = freeAgents(w)[0]!; const mine = squadOf(w, me)[2]!;
    const cash = w.clubs[me]!.finance.cash;
    for (const bad of [NaN, Infinity, -1, 1e12]) {
      expect(signFreeAgentAction(w, fa.id, bad, 2).ok).toBe(false);
      expect(offerRenewal(w, mine.id, bad, 3).ok).toBe(false);
      expect(listForTransfer(w, mine.id, bad).ok).toBe(false);
    }
    expect(offerRenewal(w, mine.id, 5000, NaN).ok).toBe(false);
    expect(signFreeAgentAction(w, fa.id, 5000, 99).ok).toBe(false);
    expect(setTactics(w, { ...defaultTactics('4-3-3'), maxSubs: 2.5 }).ok).toBe(false);
    expect(w.clubs[me]!.finance.cash).toBe(cash);
    expect(validateWorld(w).filter((v) => v.severity !== 'medium')).toEqual([]);
  });
  it('cannot release the last goalkeepers', () => {
    for (let i = 0; i < 30; i++) {
      const gks = squadOf(w, me).filter((p) => p.primary === 'GK');
      const r = releasePlayerAction(w, gks[0]!.id);
      if (!r.ok) { expect(gks.length).toBeLessThanOrEqual(2); return; }
    }
    throw new Error('expected a refusal');
  });
  it('prototype-property ids are treated as unknown players', () => {
    for (const id of ['constructor', '__proto__', 'toString', 'hasOwnProperty']) {
      expect(scoutReport(w, id).ok).toBe(false);
      expect(bidForPlayer(w, id, 1, 1, 1).ok).toBe(false);
      expect(playerProfile(w, id)).toBeNull();
    }
  });
});

describe('QA-006 match event ordering', () => {
  it('(period, minute, added) never decreases and stoppage time is reported as minute 45/90 + added', () => {
    let sawAdded = 0;
    for (let i = 0; i < 300; i++) {
      const r = simulateMatch(syntheticMatch(`m${i}`, `s${i}`, syntheticSheet({ id: 'H', quality: 62, seed: `${i}` }), syntheticSheet({ id: 'A', quality: 62, seed: `${i}` })));
      let prev: [number, number, number] = [0, 0, 0];
      for (const e of r.events) {
        const cur: [number, number, number] = [e.period, e.minute, e.added ?? 0];
        expect(cur[0] > prev[0] || (cur[0] === prev[0] && (cur[1] > prev[1] || (cur[1] === prev[1] && cur[2] >= prev[2])))).toBe(true);
        prev = cur;
        if (e.added) { sawAdded++; expect([45, 90]).toContain(e.minute); }
      }
    }
    expect(sawAdded).toBeGreaterThan(50);
  });
  it('respects the competition substitution cap', () => {
    for (let i = 0; i < 60; i++) {
      const r = simulateMatch(syntheticMatch(`m${i}`, `s${i}`, syntheticSheet({ id: 'H', quality: 62, seed: `${i}` }), syntheticSheet({ id: 'A', quality: 62, seed: `${i}` }), { rules: { mustHaveWinner: false, extraTime: false, maxSubsRegular: 3 } }));
      expect(r.stats.home.substitutions).toBeLessThanOrEqual(3); expect(r.stats.away.substitutions).toBeLessThanOrEqual(3);
    }
  });
});
