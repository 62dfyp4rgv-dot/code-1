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
