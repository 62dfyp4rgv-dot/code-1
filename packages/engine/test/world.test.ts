import { beforeAll, describe, expect, it } from 'vitest';
import { hashString } from '../src/rng';
import { COMPETITIONS, LEAGUE_BY_ID } from '../src/competition/registry';
import { ageOf, overall } from '../src/players';
import { createWorld, advanceDay, advanceToEndOfSeason, advanceDays } from '../src/world/sim';
import { defaultWorldConfig, generateWorld } from '../src/world/generate';
import { validateWorld, assertValid } from '../src/world/invariants';
import { squadOf, allPlayers } from '../src/world/runtime';
import type { WorldState } from '../src/world/types';

const digest = (w: WorldState): number => hashString(JSON.stringify([w.day, w.season, w.clubs, w.players, w.transfers.length, w.history.seasons.length]));
const critical = (w: WorldState, checkLedger = true) => validateWorld(w, { checkLedger }).filter((v) => v.severity !== 'medium');

describe('world generation', () => {
  const standard = generateWorld(defaultWorldConfig('gen-std', 'standard'));
  const compact = generateWorld(defaultWorldConfig('gen-cmp', 'compact'));

  it('creates the configured league structure with fictional, uniquely named clubs', () => {
    for (const w of [standard, compact]) {
      const names = Object.values(w.clubs).map((c) => c.name);
      expect(new Set(names).size).toBe(names.length);
      expect(Object.values(w.clubs).every((c) => c.fictional)).toBe(true);
    }
    expect(standard.leagueMembers.ENG1).toHaveLength(20);
    expect(standard.leagueMembers.ENG2).toHaveLength(24);
    expect(standard.leagueMembers.SAU1).toHaveLength(18);
    expect(standard.leagueMembers.SAU2).toHaveLength(18);
    expect(standard.leagueMembers.USA1).toHaveLength(30);
    expect(compact.leagueMembers.ENG2).toBeUndefined();
  });

  it('includes the ten default major leagues, each with a manager and a legal squad', () => {
    for (const lid of ['ENG1', 'ESP1', 'ITA1', 'GER1', 'FRA1', 'SAU1', 'POR1', 'NED1', 'BRA1', 'USA1']) {
      expect(standard.leagueMembers[lid], lid).toBeTruthy();
      for (const cid of standard.leagueMembers[lid]!) {
        const sq = squadOf(standard, cid);
        expect(sq.length).toBe(25);
        expect(sq.filter((p) => p.primary === 'GK').length).toBeGreaterThanOrEqual(3);
        expect(standard.clubs[cid]!.managerId).toBeTruthy();
      }
    }
  });

  it('Saudi Pro League squads respect the foreign-player registration cap and the league has investor money', () => {
    const cap = LEAGUE_BY_ID.SAU1!.maxForeign!;
    expect(cap).toBeGreaterThan(0);
    for (const cid of standard.leagueMembers.SAU1!) {
      const club = standard.clubs[cid]!;
      expect(squadOf(standard, cid).filter((p) => p.nationality !== club.country).length).toBeLessThanOrEqual(cap);
    }
    const investor = standard.leagueMembers.SAU1!.filter((c) => ['state', 'investor'].includes(standard.clubs[c]!.ownership.kind)).length;
    expect(investor).toBeGreaterThan(2);
  });

  it('clubs differ in wealth and strength (weak clubs do not behave like rich ones)', () => {
    const eng = standard.leagueMembers.ENG1!.map((c) => standard.clubs[c]!);
    const rev = eng.map((c) => c.finance.broadcastingAnnual + c.finance.sponsorshipAnnual).sort((a, b) => a - b);
    expect(rev.at(-1)! / rev[0]!).toBeGreaterThan(1.5);
    const xi = (id: string) => [...squadOf(standard, id)].map(overall).sort((a, b) => b - a).slice(0, 11).reduce((a, b) => a + b, 0) / 11;
    const best = Math.max(...eng.map((c) => xi(c.id))); const worst = Math.min(...eng.map((c) => xi(c.id)));
    expect(best - worst).toBeGreaterThan(8);
    // wage bills are a plausible share of revenue
    for (const c of eng) {
      const wages = squadOf(standard, c.id).reduce((a, p) => a + p.contract!.wageWeekly * 52, 0);
      const revenue = c.finance.broadcastingAnnual + c.finance.sponsorshipAnnual + c.stadium.capacity * c.finance.ticketPrice * 12;
      expect(wages / revenue).toBeGreaterThan(0.2); expect(wages / revenue).toBeLessThan(1.1);
    }
  });

  it('player attributes follow position profiles (not a single rating)', () => {
    const gks = allPlayers(standard).filter((p) => p.primary === 'GK').slice(0, 200);
    const sts = allPlayers(standard).filter((p) => p.primary === 'ST').slice(0, 200);
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(avg(gks.map((p) => p.attrs.reflexes))).toBeGreaterThan(avg(sts.map((p) => p.attrs.reflexes)) + 20);
    expect(avg(sts.map((p) => p.attrs.finishing))).toBeGreaterThan(avg(gks.map((p) => p.attrs.finishing)) + 15);
  });

  it('is deterministic for a seed', () => {
    const a = generateWorld(defaultWorldConfig('same', 'compact')); const b = generateWorld(defaultWorldConfig('same', 'compact')); const c = generateWorld(defaultWorldConfig('other', 'compact'));
    expect(hashString(JSON.stringify(a))).toBe(hashString(JSON.stringify(b)));
    expect(hashString(JSON.stringify(a))).not.toBe(hashString(JSON.stringify(c)));
  });
});

describe('a full simulated season (compact world, all competitions)', () => {
  let w: WorldState;
  let before: WorldState;
  let compIds: string[];
  beforeAll(() => {
    w = createWorld(defaultWorldConfig('season-A', 'compact'));
    compIds = Object.keys(w.competitions);
    before = JSON.parse(JSON.stringify({ clubs: w.clubs })) as WorldState;
    expect(critical(w)).toEqual([]);
    advanceToEndOfSeason(w);
  });

  it('every competition of the season completed with a winner and no unplayed fixtures', () => {
    expect(compIds.length).toBeGreaterThan(60);
    const s = w.history.seasons[0]!;
    for (const id of compIds) {
      const ch = w.history.champions[id]?.[1];
      expect(ch, `${id} has a champion`).toBeTruthy();
      expect(ch!.winner, `${id} winner`).toBeTruthy();
      expect(s.champions[id]).toBeTruthy();
    }
    expect(w.news.every((n) => !n.text.includes('force-played'))).toBe(true);
  });

  it('keeps all integrity invariants after the season rollover (incl. ledger reconciliation next season)', () => {
    assertValid(w, { checkLedger: true });
    expect(w.season).toBe(2);
    expect(w.day).toBe(364);
  });

  it('league tables are complete: every club played every opponent home and away', () => {
    const s = w.history.seasons[0]!;
    for (const lid of Object.keys(s.tables).filter((k) => COMPETITIONS[k]?.kind === 'league')) {
      const table = s.tables[lid]!;
      expect(new Set(table).size).toBe(table.length);
      const st = s.leagueStats[lid]!;
      const n = table.length;
      const expected = LEAGUE_BY_ID[lid]!.legs === 2 ? n * (n - 1) : (n * (n - 1)) / 2;
      expect(st.matches, lid).toBe(expected);
    }
  });

  it('league statistics are within realistic bands', () => {
    const rows = Object.entries(w.history.seasons[0]!.leagueStats).filter(([k]) => LEAGUE_BY_ID[k]?.tier === 1);
    const gpm = rows.map(([, s]) => s.goalsPerMatch);
    const avg = gpm.reduce((a, b) => a + b, 0) / gpm.length;
    expect(avg).toBeGreaterThan(2.3); expect(avg).toBeLessThan(3.6);
    for (const [k, s] of rows) {
      expect(s.homeWinPct + s.drawPct + s.awayWinPct, k).toBeCloseTo(1, 5);
      expect(s.championPoints, k).toBeGreaterThan(s.lastPlacePoints);
    }
    // home advantage is a pooled effect; tiny leagues (a dozen matches) are too noisy to test individually
    const total = rows.reduce((a, [, s]) => a + s.matches, 0);
    const homeWins = rows.reduce((a, [, s]) => a + s.homeWinPct * s.matches, 0) / total;
    const awayWins = rows.reduce((a, [, s]) => a + s.awayWinPct * s.matches, 0) / total;
    expect(homeWins).toBeGreaterThan(awayWins + 0.05);
    expect(homeWins).toBeLessThan(0.58);
  });

  it('player records are consistent: totals of goals in history match top-scorer lists', () => {
    const s = w.history.seasons[0]!;
    for (const [comp, list] of Object.entries(s.topScorers)) {
      for (const e of list) {
        const p = w.players[e.playerId]!;
        const lineGoals = p.history.filter((l) => l.season === 1).reduce((a, l) => a + l.goals, 0);
        expect(lineGoals, `${comp} ${p.name}`).toBeGreaterThanOrEqual(e.goals);
      }
    }
  });

  it('ages advance, retired players leave squads, contracts are never left expired', () => {
    for (const p of allPlayers(w)) {
      if (p.retired) { expect(p.clubId).toBeNull(); continue; }
      if (p.contract) expect(p.contract.endDay).toBeGreaterThanOrEqual(w.day - 1);
    }
    const oldest = Math.max(...allPlayers(w).filter((p) => !p.retired).map((p) => ageOf(p, w.day)));
    expect(oldest).toBeLessThan(42);
  });

  it('transfers are valid: no same-day duplicates, fees non-negative, no rapid ping-pong', () => {
    const byPlayer = new Map<string, number[]>();
    for (const t of w.transfers) {
      expect(t.fee).toBeGreaterThanOrEqual(0);
      if (t.kind === 'transfer') {
        expect(t.fromClubId).not.toBe(t.toClubId);
        const arr = byPlayer.get(t.playerId) ?? [];
        for (const d of arr) expect(Math.abs(t.day - d), `player ${t.playerId} moved twice within 100 days`).toBeGreaterThan(100);
        arr.push(t.day); byPlayer.set(t.playerId, arr);
      }
    }
    expect(w.transfers.filter((t) => t.kind === 'transfer').length).toBeGreaterThan(50);
  });

  it('finances stay coherent: cash balanced by ledgers, borrowing bounded, clubs remain solvent in aggregate', () => {
    const clubs = Object.values(w.clubs);
    const rich = clubs.filter((c) => c.finance.cash > 0).length;
    expect(rich / clubs.length).toBeGreaterThan(0.9);
    for (const c of clubs) expect(c.finance.debt).toBeLessThan((c.finance.broadcastingAnnual + c.finance.sponsorshipAnnual) * 4);
    void before;
  });

  it('news is derived from facts: referenced matches exist and agree with the text score', () => {
    const results = w.news.filter((n) => n.kind === 'upset' && n.ref && w.matches[n.ref]);
    for (const n of results.slice(0, 40)) {
      const m = w.matches[n.ref!]!;
      const hi = Math.max(m.score.home, m.score.away); const lo = Math.min(m.score.home, m.score.away);
      expect(n.text).toContain(`${hi}-${lo}`);
    }
  });
});

describe('determinism of the whole simulation', () => {
  it('same seed => identical state after 60 days; different seed => different', () => {
    const a = createWorld(defaultWorldConfig('det-1', 'compact')); const b = createWorld(defaultWorldConfig('det-1', 'compact')); const c = createWorld(defaultWorldConfig('det-2', 'compact'));
    advanceDays(a, 60); advanceDays(b, 60); advanceDays(c, 60);
    expect(digest(a)).toBe(digest(b));
    expect(digest(a)).not.toBe(digest(c));
  });
  it('advancing in different step sizes reaches the same state', () => {
    const a = createWorld(defaultWorldConfig('det-3', 'compact')); const b = createWorld(defaultWorldConfig('det-3', 'compact'));
    advanceDays(a, 40); for (let i = 0; i < 40; i++) advanceDay(b);
    expect(digest(a)).toBe(digest(b));
  });
});
