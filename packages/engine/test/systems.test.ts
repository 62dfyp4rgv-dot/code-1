import { beforeAll, describe, expect, it } from 'vitest';
import { generatePlayer, overall, ageOf, positionalOverall } from '../src/players';
import { Rng } from '../src/rng';
import { marketValue, baseWageWeekly } from '../src/world/valuation';
import { developPlayerWeek, growthRate, declineRate, retirementProbability } from '../src/world/development';
import { pickLineup, isAvailable } from '../src/lineup';
import { defaultTactics, formationOf } from '../src/tactics';
import { createWorld, advanceDays } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { weeklyFinance } from '../src/world/finance';
import { sellerResponse, playerResponse, wageDemand, executeTransfer, type Offer } from '../src/world/transfers';
import { squadOf } from '../src/world/runtime';
import { assertValid, validateWorld } from '../src/world/invariants';
import { setHumanClub } from '../src/world/actions';
import type { Player } from '../src/types';
import type { WorldState } from '../src/world/types';

const mk = (id: string, pos: Player['primary'], ability: number, age: number, seed = id): Player =>
  generatePlayer(Rng.fromSeed(seed), { id, name: id, nationality: 'ENG', age, day: 0, position: pos, ability });

describe('valuation', () => {
  it('is increasing in ability, decreasing with age beyond the mid-20s, and position-aware', () => {
    let prev = 0;
    for (let a = 35; a <= 90; a += 5) { const v = marketValue(mk(`s${a}`, 'CM', a, 25), 0); expect(v).toBeGreaterThan(prev); prev = v; }
    const young = marketValue(mk('y', 'CM', 70, 22), 0); const old = marketValue(mk('o', 'CM', 70, 34), 0);
    expect(young).toBeGreaterThan(old * 3);
    expect(marketValue(mk('st', 'ST', 70, 26), 0)).toBeGreaterThan(marketValue(mk('gk', 'GK', 70, 26), 0));
  });
  it('shrinks as the contract runs down and reaches plausible magnitudes', () => {
    const p = mk('c', 'CM', 75, 26); p.contract = { clubId: 'x', wageWeekly: 1, startDay: 0, endDay: 1500, signingBonus: 0, releaseClause: null, squadRole: 'first' };
    const long = marketValue(p, 0); const short = marketValue({ ...p, contract: { ...p.contract, endDay: 100 } }, 0);
    expect(short).toBeLessThan(long);
    expect(marketValue(mk('star', 'ST', 88, 26), 0)).toBeGreaterThan(5e7); expect(marketValue(mk('avg', 'CM', 60, 26), 0)).toBeLessThan(1e7);
    expect(baseWageWeekly(5e7, 85)).toBeGreaterThan(baseWageWeekly(5e6, 70));
  });
});

describe('player development', () => {
  const lifetime = (age0: number, ab: number, pot: number, rng: Rng, dev = 1) => {
    const p = generatePlayer(rng, { id: 'dev', name: 'd', nationality: 'ENG', age: age0, day: 0, position: 'CM', ability: ab, potential: pot });
    p.devRate = dev; p.workload = 6;
    const club = { facilities: { coaching: 60, training: 60, medical: 60, youth: 50, scouting: 50 } } as never;
    const trace: { age: number; ov: number }[] = [];
    for (let w = 0; w < 52 * 20; w++) {
      developPlayerWeek(p, w * 7, club, rng);
      if (p.pot < overall(p)) p.pot = overall(p);
      if (w % 52 === 0) trace.push({ age: ageOf(p, w * 7), ov: overall(p) });
    }
    return trace;
  };
  it('a high-potential teenager develops towards (but not wildly beyond) potential, peaks in the mid/late 20s and then declines', () => {
    const finals: number[] = []; const peaks: number[] = []; const declines: number[] = [];
    for (let i = 0; i < 40; i++) {
      const tr = lifetime(17, 45, 78, Rng.fromSeed(`dev${i}`));
      const peak = tr.reduce((a, b) => (b.ov > a.ov ? b : a));
      peaks.push(peak.age); finals.push(peak.ov);
      declines.push(peak.ov - (tr.find((x) => x.age >= 36)?.ov ?? peak.ov));
    }
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(mean(finals)).toBeGreaterThan(68); expect(mean(finals)).toBeLessThan(84);
    expect(mean(peaks)).toBeGreaterThan(24); expect(mean(peaks)).toBeLessThan(33);
    expect(mean(declines)).toBeGreaterThan(2);
  });
  it('development is not a uniform random walk: growth is front-loaded, position-relevant attributes grow more, and physical declines before mental', () => {
    expect(growthRate('physical', 18)).toBeGreaterThan(growthRate('physical', 23));
    expect(growthRate('physical', 26)).toBe(0);
    expect(declineRate('physical', 32)).toBeGreaterThan(declineRate('mental', 32));
    expect(declineRate('mental', 30)).toBe(0);
    const rng = Rng.fromSeed('rel'); const p = generatePlayer(rng, { id: 'a', name: 'a', nationality: 'ENG', age: 18, day: 0, position: 'ST', ability: 50, potential: 80 });
    const before = { ...p.attrs };
    for (let w = 0; w < 52; w++) developPlayerWeek(p, w * 7, undefined, rng);
    const gainFinishing = p.attrs.finishing - before.finishing; const gainReflexes = p.attrs.reflexes - before.reflexes;
    expect(gainFinishing).toBeGreaterThan(gainReflexes + 1);
  });
  it('better coaching and playing time accelerate growth; low potential caps it', () => {
    const run = (coaching: number, workload: number, pot: number): number => {
      const rng = Rng.fromSeed('same'); const p = generatePlayer(rng, { id: 'a', name: 'a', nationality: 'ENG', age: 18, day: 0, position: 'CM', ability: 50, potential: pot });
      p.workload = workload; p.devRate = 1;
      for (let w = 0; w < 52 * 3; w++) { p.workload = workload; developPlayerWeek(p, w * 7, { facilities: { coaching, training: coaching, medical: 50, youth: 50, scouting: 50 } } as never, rng); }
      return overall(p);
    };
    expect(run(90, 6, 80)).toBeGreaterThan(run(20, 6, 80));
    expect(run(60, 6, 80)).toBeGreaterThan(run(60, 0, 80));
    expect(run(60, 6, 52)).toBeLessThan(run(60, 6, 80));
  });
  it('retirement probability rises with age, is lower for stars, and is zero for the young', () => {
    expect(retirementProbability(28, 60, false)).toBe(0);
    expect(retirementProbability(36, 60, false)).toBeGreaterThan(retirementProbability(34, 60, false));
    expect(retirementProbability(36, 90, false)).toBeLessThan(retirementProbability(36, 50, false));
    expect(retirementProbability(36, 60, true)).toBeLessThan(retirementProbability(36, 60, false));
  });
});

describe('lineup selection', () => {
  const squad = [
    ...['GK1', 'GK2'].map((id, i) => mk(id, 'GK', 70 - i * 8, 28)),
    ...Array.from({ length: 5 }, (_, i) => mk(`CB${i}`, 'CB', 72 - i * 3, 27)),
    ...Array.from({ length: 4 }, (_, i) => mk(`FB${i}`, i % 2 ? 'LB' : 'RB', 66 - i, 25)),
    ...Array.from({ length: 6 }, (_, i) => mk(`CM${i}`, i < 2 ? 'DM' : 'CM', 70 - i * 2, 26)),
    ...Array.from({ length: 6 }, (_, i) => mk(`FW${i}`, i < 2 ? 'LW' : i < 4 ? 'RW' : 'ST', 74 - i * 2, 24)),
  ];
  it('fills the formation with 11 distinct available players, one keeper in goal, and a keeper on the bench', () => {
    const l = pickLineup(squad, defaultTactics('4-3-3'), { day: 0, competitionId: 'c' })!;
    expect(l.starters).toHaveLength(11);
    expect(new Set(l.starters.map((p) => p.id)).size).toBe(11);
    expect(l.starters[0]!.primary).toBe('GK');
    expect(l.starters[0]!.id).toBe('GK1');
    expect(l.bench.some((p) => p.id === 'GK2')).toBe(true);
    expect(l.bench.every((p) => !l.starters.includes(p))).toBe(true);
    formationOf('4-3-3').slots.forEach((pos, i) => expect(positionalOverall(l.starters[i]!, pos)).toBeGreaterThan(40));
  });
  it('excludes injured, suspended and retired players and rests very tired ones', () => {
    const s2 = squad.map((p) => ({ ...p, injury: null, suspensions: {}, fatigue: 0 }));
    s2.find((p) => p.id === 'CB0')!.injury = { kind: 'x', startDay: 0, returnDay: 50, severity: 2 };
    s2.find((p) => p.id === 'CB1')!.suspensions = { c: 1 };
    s2.find((p) => p.id === 'CB2')!.retired = true;
    s2.find((p) => p.id === 'GK1')!.fatigue = 90;
    const l = pickLineup(s2, defaultTactics('4-3-3'), { day: 0, competitionId: 'c' }, 0.6)!;
    const ids = l.starters.map((p) => p.id);
    for (const bad of ['CB0', 'CB1', 'CB2']) expect(ids).not.toContain(bad);
    expect(ids[0]).toBe('GK2');
    for (const p of [...l.starters, ...l.bench]) expect(isAvailable(p, { day: 0, competitionId: 'c' })).toBe(true);
  });
  it('returns null when fewer than 11 players are available instead of inventing players', () => {
    expect(pickLineup(squad.slice(0, 10), defaultTactics('4-3-3'), { day: 0, competitionId: 'c' })).toBeNull();
  });
});

describe('transfer negotiation logic', () => {
  let w: WorldState; let buyerId: string; let target: Player;
  beforeAll(() => {
    w = createWorld(defaultWorldConfig('neg', 'compact'));
    buyerId = w.leagueMembers.ENG1![4]!;
    target = [...squadOf(w, w.leagueMembers.ENG1![8]!)].sort((a, b) => overall(b) - overall(a))[6]!;
  });
  it('seller acceptance is monotone in the fee; player acceptance is monotone in the wage', () => {
    const value = marketValue(target, w.day);
    let seen = false;
    for (let f = 0.3; f <= 2.5; f += 0.1) {
      const r = sellerResponse(w, { buyerId, playerId: target.id, fee: value * f, wageWeekly: 1, years: 3 });
      if (r.status === 'accepted') seen = true; else expect(seen, `fee x${f.toFixed(1)} rejected after a lower fee was accepted`).toBe(false);
    }
    expect(seen).toBe(true);
    const demand = wageDemand(w, w.clubs[buyerId]!, target);
    let acc = false;
    for (let m = 0.4; m <= 2.5; m += 0.1) {
      const r = playerResponse(w, { buyerId, playerId: target.id, fee: value, wageWeekly: demand * m, years: 3 });
      if (r.status === 'accepted') acc = true; else expect(acc).toBe(false);
    }
    expect(acc).toBe(true);
  });
  it('executeTransfer rejects invalid input and leaves the world untouched', () => {
    const before = JSON.stringify([w.players[target.id]!.clubId, w.clubs[buyerId]!.finance.cash, w.transfers.length]);
    const bad: Offer[] = [
      { buyerId, playerId: target.id, fee: -5, wageWeekly: 1000, years: 3 },
      { buyerId, playerId: target.id, fee: 1e6, wageWeekly: 1000, years: 0 },
      { buyerId, playerId: 'nope', fee: 1e6, wageWeekly: 1000, years: 3 },
      { buyerId: 'nope', playerId: target.id, fee: 1e6, wageWeekly: 1000, years: 3 },
      { buyerId: target.clubId!, playerId: target.id, fee: 1e6, wageWeekly: 1000, years: 3 },
      { buyerId, playerId: target.id, fee: 1e12, wageWeekly: 1000, years: 3 },
    ];
    for (const o of bad) expect(executeTransfer(w, o), JSON.stringify(o)).not.toBeNull();
    expect(JSON.stringify([w.players[target.id]!.clubId, w.clubs[buyerId]!.finance.cash, w.transfers.length])).toBe(before);
  });
  it('a completed transfer moves money symmetrically, updates contract and squads, and blocks an immediate re-sale', () => {
    const buyer = w.clubs[buyerId]!; buyer.finance.transferBudget = 1e9; buyer.finance.cash = 1e9; buyer.finance.wageBudgetWeekly = 1e8;
    const seller = w.clubs[target.clubId!]!;
    const fee = Math.round(marketValue(target, w.day) * 1.3);
    const sellerCash = seller.finance.cash; const buyerCash = buyer.finance.cash;
    const err = executeTransfer(w, { buyerId, playerId: target.id, fee, wageWeekly: wageDemand(w, buyer, target) * 1.2, years: 3 });
    expect(err).toBeNull();
    expect(target.clubId).toBe(buyerId);
    expect(squadOf(w, buyerId)).toContain(target);
    expect(squadOf(w, seller.id)).not.toContain(target);
    const first = Math.round(fee / (fee > 25e6 ? 3 : fee > 6e6 ? 2 : 1));
    expect(seller.finance.cash - sellerCash).toBe(first);
    expect(buyerCash - buyer.finance.cash).toBeGreaterThanOrEqual(first);
    expect(target.contract!.clubId).toBe(buyerId);
    expect(executeTransfer(w, { buyerId: seller.id, playerId: target.id, fee: 1e6, wageWeekly: 5000, years: 3 })).toMatch(/recently|window|budget/);
    expect(validateWorld(w).filter((v) => v.severity === 'critical')).toEqual([]);
  });
});

describe('club finance', () => {
  it('weekly cash flow reconciles with the ledger and installments are settled between clubs', () => {
    const w = createWorld(defaultWorldConfig('fin', 'compact'));
    const a = w.clubs[w.leagueMembers.ENG1![0]!]!; const b = w.clubs[w.leagueMembers.ENG1![1]!]!;
    a.finance.installments.push({ dueDay: w.day, amount: -2_000_000, counterpartyId: b.id, memo: 'test' });
    const cashA = a.finance.cash; const cashB = b.finance.cash;
    weeklyFinance(w);
    const ledA = Object.values(a.finance.seasonLedger).reduce((x, y) => x + y, 0);
    expect(a.finance.cash - a.finance.seasonStartCash).toBeCloseTo(ledA, 0);
    expect(a.finance.installments).toHaveLength(0);
    expect(a.finance.seasonLedger.transferInstallments).toBe(-2_000_000);
    expect(b.finance.seasonLedger.transferInstallments).toBe(2_000_000);
    expect(cashA).not.toBe(a.finance.cash); expect(cashB).not.toBe(b.finance.cash);
    assertValid(w, { checkLedger: true });
  });
  it('bankrupt-looking clubs are rescued by owners or borrow, and runaway debt triggers an embargo rather than negative cash', () => {
    const w = createWorld(defaultWorldConfig('fin2', 'compact'));
    const rich = w.clubs[w.leagueMembers.SAU1 ? w.leagueMembers.SAU1[0]! : w.leagueMembers.ENG1![0]!]!; rich.finance.cash = -5e7;
    const poor = w.clubs[w.leagueMembers.ENG1![9]!]!; poor.ownership = { kind: 'members', wealth: 5 }; poor.finance.cash = -9e8; poor.finance.debt = 3e9;
    weeklyFinance(w);
    expect(rich.finance.cash).toBeGreaterThanOrEqual(-1);
    expect(poor.finance.cash).toBeGreaterThanOrEqual(-1);
    expect(poor.finance.embargoUntilDay).toBeGreaterThan(w.day);
    expect(w.news.some((n) => n.kind === 'finance' && n.clubIds.includes(poor.id))).toBe(true);
  });
  it('an embargoed club cannot register new players (human or AI)', () => {
    const w = createWorld(defaultWorldConfig('fin3', 'compact'));
    const id = w.leagueMembers.ENG1![2]!; setHumanClub(w, id);
    w.clubs[id]!.finance.embargoUntilDay = w.day + 100;
    const target = [...squadOf(w, w.leagueMembers.ENG1![6]!)].sort((a, b) => overall(a) - overall(b))[0]!;
    expect(executeTransfer(w, { buyerId: id, playerId: target.id, fee: 10, wageWeekly: 1000, years: 2 })).toMatch(/embargo/);
  });
  it('advancing the world keeps the ledger identity for every club every week', () => {
    const w = createWorld(defaultWorldConfig('fin4', 'compact'));
    for (let wk = 0; wk < 12; wk++) { advanceDays(w, 7); expect(validateWorld(w, { checkLedger: true }).filter((v) => v.code === 'LEDGER_DRIFT' || v.code === 'TRANSFER_MONEY_LEAK')).toEqual([]); }
  });
});
