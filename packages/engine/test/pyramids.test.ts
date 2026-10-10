/**
 * Extended pyramids (ESP, ITA, GER, FRA, POR, NED, BRA, TUR, SCO, JPN): registry consistency, opt-in behaviour of the
 * default world configuration, and promotion/relegation of a human-managed club. The multi-season movement test over
 * all pyramids at once lives in `extended.world.test.ts`.
 */
import { describe, expect, it } from 'vitest';
import { COMPETITIONS, CORE_LEAGUES, EXTENDED_LEAGUES, LEAGUE_BY_ID, LEAGUE_PROFILES, PYRAMIDS } from '../src/competition/registry';
import { buildQualSpecs } from '../src/competition/qualification';
import { createWorld, advanceDay, advanceToEndOfSeason } from '../src/world/sim';
import { updateRevenueDeals } from '../src/world/finance';
import { defaultWorldConfig, resolveLeagues } from '../src/world/generate';
import { validateWorld } from '../src/world/invariants';
import { squadOf } from '../src/world/runtime';

const NEW_LINKS = PYRAMIDS.filter((l) => l.auto === false);

describe('pyramid registry', () => {
  it('adds ten opt-in pyramids next to the legacy ENG and SAU links; MLS has none', () => {
    expect(NEW_LINKS.map((l) => l.upper).sort()).toEqual(['BRA1', 'ESP1', 'FRA1', 'GER1', 'ITA1', 'JPN1', 'NED1', 'POR1', 'SCO1', 'TUR1']);
    expect(PYRAMIDS.filter((l) => l.auto !== false).map((l) => l.upper)).toEqual(['ENG1', 'SAU1']);
    expect(PYRAMIDS.some((l) => l.upper === 'USA1' || l.lower === 'USA1')).toBe(false);
  });

  it('every link joins tier 1 and tier 2 of one country with a clearly smaller lower tier and a small swap', () => {
    for (const link of PYRAMIDS) {
      const up = LEAGUE_BY_ID[link.upper]!;
      const lo = LEAGUE_BY_ID[link.lower]!;
      expect(up.tier, link.upper).toBe(1);
      expect(lo.tier, link.lower).toBe(2);
      expect(lo.country).toBe(up.country);
      expect(lo.confederation).toBe(up.confederation);
      expect(link.swap).toBeGreaterThanOrEqual(2);
      expect(link.swap).toBeLessThanOrEqual(3);
      expect(link.swap).toBeLessThan(Math.min(up.compactClubs, lo.compactClubs));
      expect(link.swap).toBeLessThan(Math.min(up.clubs, lo.clubs) / 2);
      expect(lo.quality, link.lower).toBeLessThan(up.quality - 6);
      expect(lo.stadium, link.lower).toBeLessThan(up.stadium);
      expect(lo.tvPool, link.lower).toBeLessThan(up.tvPool / 4);
      expect(lo.hasCup).toBe(false);
      expect(lo.hasSuperCup).toBe(false);
      expect(COMPETITIONS[link.lower]!.kind).toBe('league');
      expect(COMPETITIONS[link.lower]!.tier).toBe(2);
      expect(COMPETITIONS[link.lower]!.verification.status).toBe('unverified-default');
      // a lower-tier league is never an AFC/CAF/... zone that the upper tier is not in
      expect(lo.zone).toBe(up.zone);
    }
  });

  it('second-tier leagues have no continental entry of their own and the national cup still lists their country', () => {
    const all = [...CORE_LEAGUES, ...EXTENDED_LEAGUES];
    const specs = buildQualSpecs(all);
    const lowers = new Set(PYRAMIDS.map((l) => l.lower));
    for (const spec of specs) {
      for (const q of spec.quotas) {
        for (const l of q.fillLeagues) expect(lowers.has(l), `${spec.comp} fills from ${l}`).toBe(false);
        for (const slot of q.slots) {
          if (slot.kind === 'league') expect(lowers.has(slot.league), `${spec.comp} slot ${slot.league}`).toBe(false);
          if (slot.kind === 'cupWinner' && slot.fallback) expect(lowers.has(slot.fallback.league)).toBe(false);
        }
      }
    }
    for (const link of PYRAMIDS) expect(COMPETITIONS[`${LEAGUE_BY_ID[link.upper]!.country}-CUP`], link.upper).toBeDefined();
  });

  it('extended leagues are all flagged opt-in and never part of the core selection', () => {
    for (const p of LEAGUE_PROFILES) {
      const core = CORE_LEAGUES.includes(p.id);
      const lowerOfNew = NEW_LINKS.some((l) => l.lower === p.id);
      if (p.extended) expect(core, p.id).toBe(false);
      if (lowerOfNew) expect(p.extended, p.id).toBe(true);
    }
    expect(CORE_LEAGUES).toHaveLength(33);
    expect(CORE_LEAGUES.every((id) => LEAGUE_BY_ID[id]!.tier === 1)).toBe(true);
    expect(EXTENDED_LEAGUES).toHaveLength(CORE_LEAGUES.length + 22 + PYRAMIDS.length);
    expect(new Set(EXTENDED_LEAGUES).size).toBe(EXTENDED_LEAGUES.length);
  });
});

describe('world configuration stays stable for the existing presets', () => {
  it('defaultWorldConfig selects exactly the original 33 first divisions; the standard preset adds only ENG2/SAU2 (35 leagues)', () => {
    const std = defaultWorldConfig('cfg', 'standard');
    expect(std.leagues).toEqual(CORE_LEAGUES);
    expect(std.leagues).toHaveLength(33);
    const ids = resolveLeagues(std).map((p) => p.id);
    expect(ids).toHaveLength(35);
    expect(ids).toContain('ENG2');
    expect(ids).toContain('SAU2');
    expect(ids.filter((id) => LEAGUE_BY_ID[id]!.extended)).toEqual([]);
    expect(resolveLeagues(defaultWorldConfig('cfg', 'compact'))).toHaveLength(33);
  });

  it('listing an upper tier alone does not pull in an opt-in lower tier; the extended scope enables every pyramid in both presets', () => {
    const only = resolveLeagues({ ...defaultWorldConfig('cfg', 'standard'), leagues: ['ESP1'] }).map((p) => p.id);
    expect(only).toEqual(['ESP1']);
    const withLower = resolveLeagues({ ...defaultWorldConfig('cfg', 'standard'), leagues: ['ESP1', 'ESP2'] }).map((p) => p.id);
    expect(withLower).toEqual(['ESP1', 'ESP2']);
    for (const preset of ['compact', 'standard'] as const) {
      const ids = new Set(resolveLeagues(defaultWorldConfig('cfg', preset, null, 'extended')).map((p) => p.id));
      for (const link of PYRAMIDS) { expect(ids.has(link.upper)).toBe(true); expect(ids.has(link.lower)).toBe(true); }
      expect(ids.size).toBe(EXTENDED_LEAGUES.length);
    }
  });

  it('second-tier clubs are generated weaker, smaller and poorer than their top-tier partners', () => {
    const w = createWorld({ ...defaultWorldConfig('tier-gen', 'compact'), leagues: ['ESP1', 'ESP2', 'JPN1', 'JPN2'] });
    const mean = (lid: string, f: (id: string) => number): number => w.leagueMembers[lid]!.reduce((a, id) => a + f(id), 0) / w.leagueMembers[lid]!.length;
    for (const [up, lo] of [['ESP1', 'ESP2'], ['JPN1', 'JPN2']] as const) {
      expect(mean(lo, (id) => w.clubs[id]!.reputation)).toBeLessThan(mean(up, (id) => w.clubs[id]!.reputation));
      expect(mean(lo, (id) => w.clubs[id]!.stadium.capacity)).toBeLessThan(mean(up, (id) => w.clubs[id]!.stadium.capacity));
      expect(mean(lo, (id) => w.clubs[id]!.finance.broadcastingAnnual + w.clubs[id]!.finance.sponsorshipAnnual))
        .toBeLessThan(mean(up, (id) => w.clubs[id]!.finance.broadcastingAnnual + w.clubs[id]!.finance.sponsorshipAnnual));
    }
    // no second-tier club enters a continental competition in the first season
    for (const comp of Object.values(w.competitions)) {
      if (COMPETITIONS[comp.id]!.kind !== 'continental') continue;
      for (const id of comp.entrants) expect(LEAGUE_BY_ID[w.clubs[id]!.leagueId]!.tier, `${comp.id} ${id}`).toBe(1);
    }
    // second-tier clubs are entered in their country's cup
    expect(w.competitions['ESP-CUP']!.entrants).toHaveLength(w.leagueMembers.ESP1!.length + w.leagueMembers.ESP2!.length);
    expect(w.competitions['JPN-CUP']!.entrants).toHaveLength(w.leagueMembers.JPN1!.length + w.leagueMembers.JPN2!.length);
  });
});

describe('relegation of a human-managed club (ESP1 -> ESP2)', () => {
  it('moves the club down, keeps registration limits, finances and the cup consistent, and the career continues', () => {
    const w = createWorld({ ...defaultWorldConfig('human-down', 'compact'), leagues: ['ESP1', 'ESP2'] });
    const weakest = [...w.leagueMembers.ESP1!].sort((a, b) => w.clubs[a]!.reputation - w.clubs[b]!.reputation)[0]!;
    w.config.humanClubId = weakest;
    const human = w.clubs[weakest]!;
    const cap = COMPETITIONS.ESP2!.rules[0]!.squad.maxForeignRegistered;
    expect(cap).not.toBeNull();
    expect(COMPETITIONS.ESP1!.rules[0]!.squad.maxForeignRegistered).toBeNull();

    let relegatedIn = 0;
    for (let s = 1; s <= 10 && relegatedIn === 0; s++) {
      advanceToEndOfSeason(w);
      const summary = w.history.seasons[s - 1]!;
      const down = summary.relegated.find((r) => r.clubId === weakest);
      const hard = validateWorld(w, { checkLedger: true }).filter((v) => v.severity !== 'medium');
      expect(hard, `season ${s}`).toEqual([]);
      if (!down) { expect(human.leagueId).toBe('ESP1'); continue; }
      relegatedIn = s;
      expect(down.from).toBe('ESP1');
      expect(down.to).toBe('ESP2');
      expect(human.leagueId).toBe('ESP2');
      expect(w.leagueMembers.ESP2).toContain(weakest);
      expect(w.leagueMembers.ESP1).not.toContain(weakest);
      expect(w.leagueMembers.ESP1).toHaveLength(10);
      expect(w.leagueMembers.ESP2).toHaveLength(8);
      expect(summary.relegated).toHaveLength(3);
      expect(summary.promoted).toHaveLength(3);
      expect(w.news.some((n) => n.kind === 'promotion' && n.clubIds.includes(weakest) && /relegated/.test(n.text))).toBe(true);
      // the human club is warned (not auto-released) when it exceeds the new league's foreign limit
      const foreign = squadOf(w, weakest).filter((p) => p.nationality !== human.country).length;
      if (foreign > (cap as number)) expect(w.news.some((n) => n.id.startsWith(`fl-${weakest}`))).toBe(true);
      // the new season is set up in the lower tier and the club still plays the cup
      expect(w.competitions.ESP2!.entrants).toContain(weakest);
      expect(w.competitions.ESP1!.entrants).not.toContain(weakest);
      expect(w.competitions['ESP-CUP']!.entrants).toContain(weakest);
      // AI clubs that dropped into the capped league comply with it
      for (const r of summary.relegated) {
        if (r.clubId === weakest) continue;
        expect(squadOf(w, r.clubId).filter((p) => p.nationality !== 'ESP').length, r.clubId).toBeLessThanOrEqual(cap as number);
      }
    }
    expect(relegatedIn, 'the weakest club should be relegated within ten seasons').toBeGreaterThan(0);

    // a further season in the lower tier: nothing breaks, ledger identity and registration limits hold for AI clubs
    advanceToEndOfSeason(w);
    expect(validateWorld(w, { checkLedger: true }).filter((v) => v.severity !== 'medium')).toEqual([]);
    expect(w.history.seasons.at(-1)!.tables.ESP2).toContain(weakest);
  });
});

describe('broadcasting deals after a change of tier', () => {
  it('promoted clubs are priced from the bottom of the upper league and relegated clubs from the top of the lower one', () => {
    const w = createWorld({ ...defaultWorldConfig('tv-tier', 'compact'), leagues: ['ESP1', 'ESP2'] });
    while (w.day < w.season * 364 - 1) advanceDay(w);
    const before = structuredClone(w.clubs);
    advanceDay(w); // final matchday + rollover
    const summary = w.history.seasons[0]!;
    const swap = PYRAMIDS.find((l) => l.upper === 'ESP1')!.swap;
    expect(summary.promoted).toHaveLength(swap);
    const expectDeal = (clubId: string, league: string, position: number): number => {
      const clone = structuredClone(before[clubId]!);
      clone.leagueId = league;
      updateRevenueDeals(w, clone, position, w.leagueMembers[league]!.length);
      return clone.finance.broadcastingAnnual;
    };
    const nUp = w.leagueMembers.ESP1!.length;
    summary.promoted.forEach((p, i) => {
      expect(w.clubs[p.clubId]!.finance.broadcastingAnnual).toBe(expectDeal(p.clubId, 'ESP1', nUp - swap + 1 + i));
      expect(w.clubs[p.clubId]!.finance.broadcastingAnnual).toBeLessThan(expectDeal(p.clubId, 'ESP1', 1));
    });
    summary.relegated.forEach((r, i) => {
      expect(w.clubs[r.clubId]!.finance.broadcastingAnnual).toBe(expectDeal(r.clubId, 'ESP2', 1 + i));
      expect(w.clubs[r.clubId]!.finance.broadcastingAnnual).toBeGreaterThan(expectDeal(r.clubId, 'ESP2', w.leagueMembers.ESP2!.length));
    });
  });
});
