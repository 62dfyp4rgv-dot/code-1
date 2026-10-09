import { beforeAll, describe, expect, it } from 'vitest';
import { createWorld, advanceToEndOfSeason } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { allPlayers } from '../src/world/runtime';
import { sellerResponse } from '../src/world/transfers';
import { updateStreaks } from '../src/world/records';
import { validateWorld } from '../src/world/invariants';
import type { WorldState } from '../src/world/types';

let w: WorldState;
beforeAll(() => {
  const cfg = defaultWorldConfig('features', 'compact'); cfg.leagues = ['ENG1', 'SAU1'];
  w = createWorld(cfg);
});

describe('release clauses', () => {
  it('exist on some stars, and a bid at or above the clause obliges the seller to accept', () => {
    const withClause = allPlayers(w).filter((p) => p.contract?.releaseClause);
    expect(withClause.length).toBeGreaterThan(0);
    const p = withClause[0]!; const buyer = Object.keys(w.clubs).find((c) => c !== p.clubId)!;
    expect(sellerResponse(w, { buyerId: buyer, playerId: p.id, fee: p.contract!.releaseClause!, wageWeekly: 1, years: 3 }).status).toBe('accepted');
    expect(sellerResponse(w, { buyerId: buyer, playerId: p.id, fee: 1000, wageWeekly: 1, years: 3 }).status).not.toBe('accepted');
  });
});

describe('streaks and milestones', () => {
  it('streak counters follow W/D/L exactly and announce long unbeaten runs', () => {
    const club = Object.values(w.clubs)[0]!;
    const rec = (r: 'W' | 'D' | 'L') => updateStreaks(w, club, r, 'test');
    for (let i = 0; i < 10; i++) rec('D');
    expect(w.history.clubs[club.id]!.streaks!.unbeaten).toBe(10);
    expect(w.news.some((n) => n.text.includes('unbeaten in 10'))).toBe(true);
    rec('L');
    expect(w.history.clubs[club.id]!.streaks!.unbeaten).toBe(0);
    expect(w.history.clubs[club.id]!.longestUnbeaten).toBeGreaterThanOrEqual(10);
  });
  it('a simulated season produces streak records, breakout/decline lists and still validates', () => {
    advanceToEndOfSeason(w);
    const s = w.history.seasons[0]!;
    expect(Object.values(w.history.clubs).some((r) => (r.streaks?.longestWins ?? 0) >= 3)).toBe(true);
    expect(s.breakouts!.length).toBeGreaterThan(0);
    for (const b of s.breakouts!) { expect(b.to).toBeGreaterThan(b.from); expect(w.players[b.playerId]).toBeTruthy(); }
    for (const d of s.decliners ?? []) expect(d.to).toBeLessThan(d.from);
    expect(validateWorld(w, { checkLedger: true }).filter((v) => v.severity !== 'medium')).toEqual([]);
  });
});
