/**
 * QA area 1/4: AI transfer market rules over 3 seasons (ENG1, ESP1, SAU1, USA1, BRA1 compact): permanent transfers only
 * inside both clubs' windows, no signings under embargo, no negative fees, no re-transfer within 120 days, Saudi
 * foreign cap (10) never exceeded in weekly scans, contract wages finite.
 */
import { describe, expect, it } from 'vitest';
import { advanceDay, createWorld } from '../src/index';
import { LEAGUE_BY_ID } from '../src/competition/registry';
import { cfg, squadOf } from './helpers';

const w = createWorld(cfg('qa-tr', ['ENG1', 'ESP1', 'SAU1', 'USA1', 'BRA1']));
const issues: Record<string, string[]> = {};
const note = (k: string, e: string): void => { (issues[k] ??= []).push(e); };
const kinds: Record<string, number> = {};
const embargo: Record<string, number> = {};
const lastMove = new Map<string, number>();
for (let d = 0; d < 364 * 3; d++) {
  for (const c of Object.values(w.clubs)) embargo[c.id] = c.finance.embargoUntilDay;
  const before = w.transfers.length;
  advanceDay(w);
  for (const t of w.transfers.slice(before)) {
    kinds[t.kind] = (kinds[t.kind] ?? 0) + 1;
    if (t.kind === 'transfer' || t.kind === 'loan') {
      const prev = lastMove.get(t.playerId);
      if (prev !== undefined && t.day - prev < 120) note('player moved twice within 120 days', t.playerId);
      lastMove.set(t.playerId, t.day);
    }
    if (t.kind === 'transfer') {
      const to = w.clubs[t.toClubId!]!, from = w.clubs[t.fromClubId!]!;
      const wk = Math.floor((t.day - Math.floor(t.day / 364) * 364) / 7);
      for (const c of [to, from]) if (!LEAGUE_BY_ID[c.leagueId]!.transferWindows.some(([a, b]) => wk >= a && wk <= b)) note('permanent transfer outside window', `${t.playerId} ${c.id} week ${wk}`);
      if (t.fee < 0) note('negative fee', t.playerId);
      if (t.fromClubId === t.toClubId) note('self transfer', t.playerId);
    }
    if ((t.kind === 'transfer' || t.kind === 'free') && t.toClubId && (embargo[t.toClubId] ?? -1) > t.day) note('signing during embargo', `${t.toClubId} day ${t.day}`);
  }
  if (w.day % 7 === 3) {
    for (const c of Object.values(w.clubs)) {
      if (c.leagueId !== 'SAU1') continue;
      const f = squadOf(w, c.id).filter((p) => p.nationality !== c.country).length;
      if (f > 10) note('SAU1 foreign cap exceeded', `${c.id} ${f} on day ${w.day}`);
    }
  }
}

describe('AI transfer market (3 seasons, 5 leagues)', () => {
  it('sample is non-trivial', () => {
    expect(kinds.transfer ?? 0).toBeGreaterThan(200);
    expect(kinds.free ?? 0).toBeGreaterThan(100);
  });
  it('permanent transfers only inside both clubs\' windows; no negative fees; no self transfers', () => {
    for (const k of ['permanent transfer outside window', 'negative fee', 'self transfer']) expect(issues[k] ?? [], k).toEqual([]);
  });
  it('no signings under embargo, no player moves twice within 120 days', () => {
    expect(issues['signing during embargo'] ?? []).toEqual([]);
    expect(issues['player moved twice within 120 days'] ?? []).toEqual([]);
  });
  it('Saudi Pro League clubs never exceed 10 foreign players (weekly scan)', () => {
    expect(issues['SAU1 foreign cap exceeded'] ?? []).toEqual([]);
  });
  it('all wages are finite and non-negative; the largest fee is plausible (< 400M)', () => {
    for (const p of Object.values(w.players)) if (p.contract) { expect(Number.isFinite(p.contract.wageWeekly)).toBe(true); expect(p.contract.wageWeekly).toBeGreaterThanOrEqual(0); }
    expect(Math.max(...w.transfers.filter((t) => t.kind === 'transfer').map((t) => t.fee))).toBeLessThan(4e8);
  });
});
