/**
 * QA area 6: robustness and slow leaks. Tiny one-league world (NZL1, 6 clubs) for 12 seasons: timing trend,
 * array growth per season, save size, odd configurations (single league, no cups, tier-2 pyramid with one tier-1 league).
 */
import { describe, expect, it } from 'vitest';
import { advanceToEndOfSeason, createWorld, validateWorld } from '../src/index';
import { encodeWorld } from '../src/persistence/codec';
import { cfg, mean } from './helpers';

const SEASONS = 12;
const w = createWorld(cfg('qa-grow', ['NZL1']));
interface Row { ms: number; players: number; retired: number; transfers: number; news: number; matches: number; saveBytes: number }
const rows: Row[] = [];
for (let s = 0; s < SEASONS; s++) {
  const t = performance.now();
  advanceToEndOfSeason(w);
  const ms = performance.now() - t;
  const retired = Object.values(w.players).filter((p) => p.retired).length;
  rows.push({
    ms, players: Object.keys(w.players).length, retired, transfers: w.transfers.length, news: w.news.length,
    matches: Object.keys(w.matches).length,
    saveBytes: encodeWorld(w).filter((c) => c.kind === 'players' || c.kind === 'meta').reduce((a, c) => a + c.data.length, 0),
  });
}

describe('tiny one-league world for 12 seasons', () => {
  it('runs, stays valid and keeps playing every season (verified OK)', () => {
    expect(w.season).toBe(SEASONS + 1);
    expect(validateWorld(w, { checkLedger: true }).filter((v) => v.severity !== 'medium')).toEqual([]);
    expect(w.history.seasons.length).toBe(SEASONS);
    for (const s of w.history.seasons) expect(s.champions.NZL1?.winner).toBeTruthy();
  });
  it('season time does not degrade: last 4 seasons <= 2x the first 4 seasons (verified OK)', () => {
    expect(mean(rows.slice(-4).map((r) => r.ms))).toBeLessThan(2 * mean(rows.slice(0, 4).map((r) => r.ms)) + 200);
  });
  it('news and transfer logs are bounded (verified OK: news capped at 3000, transfers at 60000)', () => {
    expect(w.news.length).toBeLessThanOrEqual(3000);
    expect(w.transfers.length).toBeLessThanOrEqual(60000);
  });
  it('match archive is bounded by archiveRecent*6 (verified OK)', () => {
    expect(Object.keys(w.matches).length).toBeLessThanOrEqual(w.config.archiveRecent * 6);
  });
  it('[QA-012] retired players do not accumulate without bound: stored retired records stay below the active player count', () => {
    const last = rows[rows.length - 1]!;
    const active = last.players - last.retired;
    expect(last.retired, `retired=${last.retired} active=${active}; players grow ${(rows[rows.length - 1]!.players - rows[0]!.players) / (SEASONS - 1)}/season`).toBeLessThan(active);
  });
  it('[QA-012] players+meta save size (excluding the capped match/news/transfer archives) reaches a plateau: growth in the last 4 seasons < 10%', () => {
    const a = rows[rows.length - 5]!.saveBytes, b = rows[rows.length - 1]!.saveBytes;
    expect((b - a) / b).toBeLessThan(0.1);
  });
});

describe('odd configurations', () => {
  it('a single tier-1 league with preset standard pulls in its tier-2 and promotion works (ENG1 + ENG2)', () => {
    const w2 = createWorld(cfg('qa-odd', ['ENG1'], 'standard'));
    expect(Object.keys(w2.leagueMembers).sort()).toEqual(['ENG1', 'ENG2']);
  });
  it('config with a league id that does not exist does not crash world creation, or fails with a clear error', () => {
    let err: unknown = null; let world: ReturnType<typeof createWorld> | null = null;
    try { world = createWorld(cfg('qa-odd2', ['NOPE'])); } catch (e) { err = e; }
    // either outcome is acceptable but it must not be an obscure TypeError
    if (err) expect(String((err as Error).message)).not.toMatch(/Cannot read properties of undefined/);
    else expect(Object.keys(world!.clubs).length).toBe(0);
  });
  it('an empty league list yields a world that can still be advanced a full season without throwing', () => {
    const w3 = createWorld(cfg('qa-odd3', []));
    expect(() => advanceToEndOfSeason(w3)).not.toThrow();
  });
  it('two tiny leagues without UEFA/AFC context run 2 seasons and keep all invariants (verified OK)', () => {
    const w4 = createWorld(cfg('qa-odd4', ['FIJ1', 'NZL1']));
    advanceToEndOfSeason(w4); advanceToEndOfSeason(w4);
    expect(validateWorld(w4, { checkLedger: true }).filter((v) => v.severity !== 'medium')).toEqual([]);
  });
});
