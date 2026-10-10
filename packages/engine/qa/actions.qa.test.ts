/**
 * QA area 4: human-player actions (src/world/actions.ts) - exploits, hostile/odd inputs, invariants after actions.
 * Tests titled [QA-xxx] demonstrate a defect and FAIL until it is fixed.
 */
import { describe, expect, it } from 'vitest';
import * as E from '../src/index';
import { marketValue } from '../src/world/valuation';
import { freeAgents, hardViolations, humanWorld, squadOf } from './helpers';

describe('actions: odd numeric inputs', () => {
  it('[QA-003] offerRenewal rejects NaN wage', () => {
    const { w, human } = humanWorld('qa-act');
    const p = squadOf(w, human)[5]!;
    const r = E.offerRenewal(w, p.id, NaN, 3);
    const accepted = r.ok && r.value.status === 'completed';
    expect(accepted && !Number.isFinite(p.contract!.wageWeekly)).toBe(false);
    expect(hardViolations(w).map((v) => v.code)).not.toContain('WAGE_INVALID');
  });
  it('[QA-003] offerRenewal rejects Infinity wage', () => {
    const { w, human } = humanWorld('qa-act');
    const p = squadOf(w, human)[5]!;
    E.offerRenewal(w, p.id, Infinity, 3);
    expect(Number.isFinite(p.contract!.wageWeekly)).toBe(true);
  });
  it('[QA-003] signFreeAgentAction rejects Infinity wage (cash must stay finite)', () => {
    const { w, human } = humanWorld('qa-act');
    const fa = freeAgents(w)[0]!;
    E.signFreeAgentAction(w, fa.id, Infinity, 3);
    expect(Number.isFinite(w.clubs[human]!.finance.cash)).toBe(true);
    expect(hardViolations(w).map((v) => v.code)).not.toContain('FINANCE_NAN');
  });
  it('[QA-003] NaN contract length must not create a contract that never expires', () => {
    const { w, human } = humanWorld('qa-act');
    const p = squadOf(w, human)[5]!;
    E.offerRenewal(w, p.id, p.contract!.wageWeekly * 2, NaN);
    expect(Number.isFinite(p.contract!.endDay)).toBe(true);
  });
  it('[QA-003] NaN years on free-agent signing must not create endDay NaN', () => {
    const { w } = humanWorld('qa-act');
    const fa = freeAgents(w)[0]!;
    const r = E.signFreeAgentAction(w, fa.id, 1e7, NaN);
    if (r.ok && r.value.status === 'completed') expect(Number.isFinite(fa.contract!.endDay)).toBe(true);
  });
  it('[QA-007] setTactics rejects fractional maxSubs', () => {
    const { w, human } = humanWorld('qa-act');
    const r = E.setTactics(w, { ...w.clubs[human]!.tactics, maxSubs: 2.5 });
    expect(r.ok).toBe(false);
  });
  it('[QA-007] listForTransfer rejects non-finite asking price', () => {
    const { w, human } = humanWorld('qa-act');
    const p = squadOf(w, human)[5]!;
    expect(E.listForTransfer(w, p.id, Infinity).ok).toBe(false);
  });
});

describe('actions: tactics validation (verified OK)', () => {
  it('rejects NaN tempo, maxSubs 11/-1, mentality 9, pressing 1000, unknown formation, wrong role count', () => {
    const { w, human } = humanWorld('qa-act');
    const base = w.clubs[human]!.tactics;
    const bad = [{ ...base, tempo: NaN }, { ...base, maxSubs: 11 }, { ...base, maxSubs: -1 }, { ...base, mentality: 9 as never },
      { ...base, pressing: 1000 }, { ...base, formation: 'x' }, { ...base, roles: ['x'] }];
    for (const t of bad) expect(E.setTactics(w, t).ok).toBe(false);
    expect(w.clubs[human]!.tactics).toEqual(base);
  });
});

describe('actions: hostile ids', () => {
  const ids = ['constructor', '__proto__', 'toString', 'p99999999', ''];
  it('[QA-005] no action throws for unknown / prototype-chain ids', () => {
    const { w } = humanWorld('qa-act');
    const calls: Record<string, (id: string) => unknown> = {
      bid: (id) => E.bidForPlayer(w, id, 1e6, 1e4, 3), loan: (id) => E.bidLoan(w, id, 0.5, w.day + 200),
      fa: (id) => E.signFreeAgentAction(w, id, 1e4, 2), renew: (id) => E.offerRenewal(w, id, 1e4, 2),
      release: (id) => E.releasePlayerAction(w, id), scout: (id) => E.scoutReport(w, id), terms: (id) => E.suggestTerms(w, id),
      list: (id) => E.listForTransfer(w, id, 5), profile: (id) => E.playerProfile(w, id),
    };
    const thrown: string[] = [];
    for (const id of ids) for (const [n, f] of Object.entries(calls)) { try { f(id); } catch (e) { thrown.push(`${n}(${id}): ${(e as Error).message}`); } }
    expect(thrown).toEqual([]);
  });
  it('[QA-005] scoutReport/suggestTerms must fail for a non-player id', () => {
    const { w } = humanWorld('qa-act');
    expect(E.scoutReport(w, 'constructor').ok).toBe(false);
    expect(E.suggestTerms(w, '__proto__').ok).toBe(false);
  });
  it('retired and other-club players cannot be released / renewed / listed (verified OK)', () => {
    const { w, human } = humanWorld('qa-act');
    const other = Object.values(w.clubs).find((c) => c.id !== human)!;
    const foreign = squadOf(w, other.id)[3]!;
    expect(E.releasePlayerAction(w, foreign.id).ok).toBe(false);
    expect(E.offerRenewal(w, foreign.id, 1e5, 2).ok).toBe(false);
    expect(E.listForTransfer(w, foreign.id, 1e6).ok).toBe(false);
    const ret = Object.values(w.players)[0]!; ret.retired = true; ret.clubId = null;
    expect(E.bidForPlayer(w, ret.id, 1, 1, 1).ok).toBe(false);
  });
});

describe('actions: squad integrity', () => {
  it('[QA-004] releasing players one by one never leaves the club without a goalkeeper', () => {
    const { w, human } = humanWorld('qa-act');
    for (const p of [...squadOf(w, human)]) E.releasePlayerAction(w, p.id);
    expect(hardViolations(w).map((v) => v.code)).not.toContain('NO_GOALKEEPER');
  });
  it('release is blocked at the minimum squad size (verified OK)', () => {
    const { w, human } = humanWorld('qa-act');
    for (const p of [...squadOf(w, human)]) E.releasePlayerAction(w, p.id);
    expect(squadOf(w, human).length).toBeGreaterThanOrEqual(18);
  });
});

describe('actions: money exploits', () => {
  it('[QA-002] AI never pays more than a small multiple of market value for a listed player', () => {
    const ratios: number[] = [];
    for (let s = 1; s <= 8; s++) {
      const { w, human } = humanWorld('qa-flip' + s, 'lowest');
      const cheap = freeAgents(w).filter((p) => p.primary !== 'GK' && marketValue(p, 0) < 1.2e6).slice(0, 3);
      const ids: string[] = [];
      for (const fa of cheap) {
        const t = E.suggestTerms(w, fa.id);
        if (t.ok && E.signFreeAgentAction(w, fa.id, t.value.wageWeekly, 1).ok && fa.clubId === human) ids.push(fa.id);
      }
      for (const id of ids) E.listForTransfer(w, id, 15e6);
      for (let i = 0; i < 42; i++) E.advanceDay(w);
      for (const t of w.transfers) if (t.fromClubId === human && t.kind === 'transfer' && ids.includes(t.playerId)) ratios.push(t.fee / marketValue(w.players[t.playerId]!, w.day));
    }
    // whatever sells must sell near value (before the fix fee/value reached 112x); no sale at all is also acceptable
    expect(Math.max(0, ...ratios)).toBeLessThan(3);
  });
  it('[QA-002] a freshly signed free agent cannot be resold immediately (lastMoveDay lock)', () => {
    const { w } = humanWorld('qa-flip1', 'lowest');
    const fa = freeAgents(w).filter((p) => p.primary !== 'GK')[0]!;
    const t = E.suggestTerms(w, fa.id);
    if (t.ok) E.signFreeAgentAction(w, fa.id, t.value.wageWeekly, 1);
    expect(fa.lastMoveDay).not.toBeNull();
  });
  it('bids that violate the transfer window / budget are rejected, invariants hold (verified OK)', () => {
    const { w, human } = humanWorld('qa-act', 'highest');
    const other = Object.values(w.clubs).find((c) => c.id !== human)!;
    const target = squadOf(w, other.id).find((p) => p.primary !== 'GK')!;
    // advance out of the window (weeks 0-5)
    E.advanceDays(w, 60);
    const r = E.bidForPlayer(w, target.id, marketValue(target, w.day) * 2, 1e5, 3);
    expect(r.ok && r.value.status).toBe('invalid');
    const neg = E.bidForPlayer(w, target.id, -5, 1e5, 3);
    expect(neg.ok ? neg.value.status : 'rejected').not.toBe('completed');
    expect(hardViolations(w).length).toBe(0);
  });
  it('Infinity / NaN transfer fees never complete (verified OK)', () => {
    const { w, human } = humanWorld('qa-act', 'highest');
    const other = Object.values(w.clubs).find((c) => c.id !== human)!;
    const target = squadOf(w, other.id).find((p) => p.primary !== 'GK')!;
    for (const fee of [NaN, Infinity, -1e6]) {
      const r = E.bidForPlayer(w, target.id, fee, 1e5, 3);
      expect(r.ok && r.value.status).not.toBe('completed');
    }
    expect(Number.isFinite(w.clubs[human]!.finance.cash)).toBe(true);
  });
});

describe('actions: registration limits (verified OK)', () => {
  it('a human Saudi Pro League club cannot exceed 10 foreign players by transfer, free signing or loan', () => {
    const w = E.createWorld({ seed: 'qa-sauh', leagues: ['SAU1', 'ENG1', 'ESP1', 'BRA1'], preset: 'compact', humanClubId: null, archiveRecent: 400 });
    const club = Object.values(w.clubs).filter((c) => c.leagueId === 'SAU1').sort((a, b) => b.reputation - a.reputation)[0]!;
    E.setHumanClub(w, club.id);
    club.finance.transferBudget = 1e10; club.finance.cash = 1e10; club.finance.wageBudgetWeekly = 1e9;
    const foreign = () => squadOf(w, club.id).filter((p) => p.nationality !== club.country).length;
    const cap = 10;
    expect(foreign()).toBeLessThanOrEqual(cap);
    const targets = Object.values(w.players).filter((p) => !p.retired && p.clubId && w.clubs[p.clubId]!.leagueId !== 'SAU1' && p.nationality !== 'SAU')
      .sort((a, b) => marketValue(b, 0) - marketValue(a, 0));
    for (const p of targets.slice(0, 150)) {
      const t = E.suggestTerms(w, p.id);
      if (t.ok) E.bidForPlayer(w, p.id, t.value.fee * 2, t.value.wageWeekly * 1.5, 3);
    }
    for (const p of freeAgents(w)) { const t = E.suggestTerms(w, p.id); if (t.ok) E.signFreeAgentAction(w, p.id, t.value.wageWeekly * 2, 2); }
    for (const p of targets.slice(150, 400)) E.bidLoan(w, p.id, 0.3, w.day + 300);
    expect(foreign()).toBeLessThanOrEqual(cap);
  });
});
