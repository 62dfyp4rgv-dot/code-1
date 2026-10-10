import { overall } from '../src/players';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  advanceDays, advanceToNextMatchday, bidForPlayer, clubFixtures, clubView, competitionList, competitionOverview, createWorld, dateInfo, defaultWorldConfig, financeView,
  freeAgentPool, leagueTableView, listForTransfer, matchView, newsView, playerProfile, recordsView, releasePlayerAction, scoutReport, setHumanClub, setLineup, setTactics,
  signFreeAgentAction, squadView, statLeaders, suggestTerms, transferMarketView, validateWorld, defaultTactics, archetypeTactics, offerRenewal, isWindowOpen,
  type WorldState,
} from '../src/index';

let w: WorldState;
let me: string;

beforeAll(() => {
  w = createWorld(defaultWorldConfig('api', 'compact'));
  me = w.leagueMembers.ENG1![3]!;
  setHumanClub(w, me);
});

describe('views', () => {
  it('dateInfo maps days to season-labelled calendar dates', () => {
    expect(dateInfo(0)).toMatchObject({ season: 1, iso: '2026-08-01', seasonLabel: '2026/27' });
    expect(dateInfo(364).seasonLabel).toBe('2027/28');
    expect(dateInfo(363).iso).toBe('2027-07-30');
  });
  it('competition browser lists leagues first, with verification status for every competition', () => {
    const list = competitionList(w);
    expect(list.length).toBeGreaterThan(60);
    expect(list[0]!.kind).toBe('league');
    for (const c of list.slice(0, 60)) expect(competitionOverview(w, c.id)!.verification.status).toBeTruthy();
  });
  it('league table view is sorted and includes form and the human flag', () => {
    advanceDays(w, 21);
    const t = leagueTableView(w, 'ENG1');
    expect(t).toHaveLength(10);
    expect(t.map((r) => r.position)).toEqual(t.map((_, i) => i + 1));
    expect(t.some((r) => r.isHuman)).toBe(true);
    for (let i = 1; i < t.length; i++) expect(t[i - 1]!.points).toBeGreaterThanOrEqual(t[i]!.points);
    expect(t[0]!.form.length).toBeLessThanOrEqual(5);
  });
  it('squad view shows exact values for own players and scouted ranges for others', () => {
    const own = squadView(w, me); expect(own.every((r) => r.exact)).toBe(true);
    const other = squadView(w, w.leagueMembers.ENG1![0]!); expect(other.every((r) => !r.exact)).toBe(true);
    expect(other.every((r) => r.wageWeekly === null)).toBe(true);
    const p = w.players[other[0]!.id]!; const prof = playerProfile(w, p.id)!;
    // CR-007: the unscouted view must not let the user rebuild the true ability from the displayed attributes
    let err = 0; let n = 0;
    for (const r of squadView(w, w.leagueMembers.ENG1![1]!).concat(other)) {
      const pl = w.players[r.id]!; const pr = playerProfile(w, r.id)!;
      const shown = { ...pl.attrs };
      for (const g of Object.values(pr.attributes)) for (const a of g) (shown as Record<string, number>)[a.name] = a.value;
      err += Math.abs(overall({ ...pl, attrs: shown }) - overall(pl)); n++;
    }
    expect(err / n, 'mean error of the overall rebuilt from displayed attributes').toBeGreaterThan(1);
    expect(prof.positions.every((x) => Number.isInteger(x.rating))).toBe(true);
    const mine = w.players[own[0]!.id]!;
    for (const g of Object.values(playerProfile(w, mine.id)!.attributes)) for (const a of g) expect(a.value).toBe(Math.round(mine.attrs[a.name as keyof typeof mine.attrs]));
  });
  it('fixtures, match centre, finance, club, records and news views are populated and consistent', () => {
    advanceToNextMatchday(w);
    const played = clubFixtures(w, me, { upcoming: false, limit: 5 });
    expect(played.length).toBeGreaterThan(0);
    const mv = matchView(w, played.at(-1)!.id)!;
    expect(mv).toBeTruthy();
    expect(mv.fixture.score).toBe(`${mv.stats.home.shots >= 0 ? w.matches[played.at(-1)!.id]!.score.home : 0}-${w.matches[played.at(-1)!.id]!.score.away}`);
    expect(mv.events!.length).toBeGreaterThan(10);
    expect(mv.goals.length).toBe(w.matches[played.at(-1)!.id]!.score.home + w.matches[played.at(-1)!.id]!.score.away);
    const fv = financeView(w, me)!;
    expect(fv.cash).toBe(w.clubs[me]!.finance.cash);
    expect(clubView(w, me)!.squadSize).toBe(squadView(w, me).length);
    expect(Array.isArray(newsView(w, { limit: 5 }))).toBe(true);
    expect(recordsView(w).seasons).toEqual([]);
    expect(statLeaders(w, 'ENG1', 'goals', 3).length).toBeGreaterThan(0);
  });
});

describe('actions', () => {
  it('rejects invalid tactics and accepts valid ones; lineup validation protects invariants', () => {
    expect(setTactics(w, { ...defaultTactics('4-3-3'), pressing: 500 }).ok).toBe(false);
    expect(setTactics(w, archetypeTactics('highPress')).ok).toBe(true);
    const squad = squadView(w, me);
    const gk = squad.find((p) => p.position === 'GK')!;
    const field = squad.filter((p) => p.position !== 'GK' && !p.suspended && !p.injury).slice(0, 10);
    expect(setLineup(w, [gk.id, ...field.map((p) => p.id)]).ok).toBe(true);
    expect(setLineup(w, [field[0]!.id, gk.id, ...field.slice(1, 10).map((p) => p.id)]).ok).toBe(false); // slot 0 must be the GK
    expect(setLineup(w, [gk.id, gk.id, ...field.slice(0, 9).map((p) => p.id)]).ok).toBe(false);
    expect(setLineup(w, ['nope']).ok).toBe(false);
    expect(setLineup(w, [gk.id, ...field.map((p) => p.id)]).ok).toBe(true);
    // any unavailable starter makes the engine drop the whole override (documented), so keep the chosen XI healthy
    for (const p of [gk, ...field]) w.players[p.id]!.injuryProneness = 0;
    advanceToNextMatchday(w);
    const mv = clubFixtures(w, me, { upcoming: false, limit: 1 })[0]!;
    const full = matchView(w, mv.id)!;
    const names = (full.lineups![w.matches[mv.id]!.homeClubId === me ? 'home' : 'away']).slice(0, 11).map((p) => p.name);
    expect(names).toEqual([gk, ...field].map((p) => p.name));
    setLineup(w, null);
  });
  it('transfer bids go through the same rules as AI deals and never corrupt the world', () => {
    // move to an open window (season start)
    const w2 = createWorld(defaultWorldConfig('api-tr', 'compact'));
    const club = w2.leagueMembers.ENG1![5]!; setHumanClub(w2, club);
    expect(isWindowOpen(w2, w2.clubs[club]!)).toBe(true);
    w2.clubs[club]!.finance.transferBudget = 5e8; w2.clubs[club]!.finance.cash = 1e9; w2.clubs[club]!.finance.wageBudgetWeekly = 1e8;
    const targets = transferMarketView(w2, { minAbility: 60, limit: 40 }).filter((r) => r.clubId !== null && r.clubId !== club);
    let completed = 0; let rejected = 0;
    for (const t of targets) {
      const terms = suggestTerms(w2, t.id);
      if (!terms.ok) continue;
      const r = bidForPlayer(w2, t.id, terms.value.fee * 1.4, terms.value.wageWeekly * 1.3, terms.value.years);
      if (!r.ok) continue;
      if (r.value.status === 'completed') completed++; else rejected++;
      expect(validateWorld(w2).filter((v) => v.severity === 'critical' && v.code !== 'CASH_NEGATIVE')).toEqual([]);
    }
    expect(completed).toBeGreaterThan(0);
    expect(rejected).toBeGreaterThanOrEqual(0);
    // lowball offers are refused
    const victim = transferMarketView(w2, { minAbility: 55, limit: 30 }).find((r) => r.clubId !== null && r.clubId !== club)!;
    const lb = bidForPlayer(w2, victim.id, 1000, 1000, 3);
    expect(lb.ok && lb.value.status === 'completed').toBe(false);
  });
  it('bids are refused when the window is closed, and cannot exceed the transfer budget', () => {
    const w3 = createWorld(defaultWorldConfig('api-win', 'compact'));
    const club = w3.leagueMembers.ENG1![2]!; setHumanClub(w3, club);
    const target = transferMarketView(w3, { minAbility: 60, limit: 20 }).find((r) => r.clubId !== null && r.clubId !== club)!;
    w3.clubs[club]!.finance.transferBudget = 1000;
    const r1 = bidForPlayer(w3, target.id, 5e7, 1e6, 4);
    expect(r1.ok && r1.value.status === 'completed').toBe(false);
    advanceDays(w3, 7 * 12); // window closes after week 5
    w3.clubs[club]!.finance.transferBudget = 1e9;
    const r2 = bidForPlayer(w3, target.id, 5e7, 1e6, 4);
    expect(r2.ok && r2.value.status).toBe('invalid');
  });
  it('free agents can be signed within registration rules; release respects the minimum squad', () => {
    const fa = freeAgentPool(w).sort((a, b) => b.attrs.finishing - a.attrs.finishing)[0]!;
    const terms = suggestTerms(w, fa.id);
    expect(terms.ok).toBe(true);
    const before = squadView(w, me).length;
    const res = signFreeAgentAction(w, fa.id, terms.ok ? terms.value.wageWeekly * 1.5 : 0, 2);
    expect(res.ok).toBe(true);
    if (res.ok && res.value.status === 'completed') expect(squadView(w, me).length).toBe(before + 1);
    const squad = squadView(w, me);
    for (let i = 0; i < 40; i++) {
      const cur = squadView(w, me);
      const r = releasePlayerAction(w, cur[cur.length - 1]!.id);
      if (!r.ok) { expect(cur.length).toBeLessThanOrEqual(18); break; }
    }
    expect(squadView(w, me).length).toBeGreaterThanOrEqual(18);
    void squad;
  });
  it('scouting reports are exact for own players and widen for foreign ones', () => {
    const own = squadView(w, me)[0]!;
    const r1 = scoutReport(w, own.id); expect(r1.ok && r1.value.abilityLow === r1.value.abilityHigh).toBe(true);
    const other = squadView(w, w.leagueMembers.ESP1![0]!)[0]!;
    const r2 = scoutReport(w, other.id); expect(r2.ok && r2.value.abilityHigh - r2.value.abilityLow).toBeGreaterThan(0);
  });
  it('listing and renewals behave', () => {
    const p = squadView(w, me)[3]!;
    expect(listForTransfer(w, p.id, 12345678).ok).toBe(true);
    expect(w.transferList[p.id]!.askingPrice).toBe(12345678);
    expect(listForTransfer(w, w.leagueMembers.ESP1 ? squadView(w, w.leagueMembers.ESP1[0]!)[0]!.id : 'x', 1).ok).toBe(false);
    const cur = w.players[p.id]!;
    const lowball = offerRenewal(w, p.id, cur.contract!.wageWeekly * 0.5, 3);
    expect(lowball.ok && lowball.value.status).toBe('rejectedByPlayer');
    const good = offerRenewal(w, p.id, cur.contract!.wageWeekly * 1.4, 3);
    expect(good.ok && good.value.status).toBe('completed');
    expect(cur.contract!.endDay).toBeGreaterThan(w.day + 364);
  });
});
