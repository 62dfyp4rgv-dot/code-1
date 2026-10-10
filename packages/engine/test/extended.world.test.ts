/**
 * The extended universe end to end: the compact preset with every first division, every pyramid lower tier and every new
 * trophy, simulated for two seasons. Verifies promotion/relegation across all ten new pyramids, invariants (ledger identity,
 * foreign limits, no double booking), qualification into the continental competitions from the new leagues, and the
 * new continental / intercontinental trophies. All rules involved are unverified scenario defaults.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { COMPETITIONS, EXTENDED_LEAGUES, LEAGUE_BY_ID, PYRAMIDS } from '../src/competition/registry';
import { createWorld, advanceDay } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { validateWorld, type Violation } from '../src/world/invariants';
import type { WorldState } from '../src/world/types';

const SEASONS = 2;
const NEW_LINKS = PYRAMIDS.filter((l) => l.auto === false);
/** League of a club at the start of season `s`. */
const leagueAt = (s: number, clubId: string): string => Object.entries(members[s]!).find(([, m]) => m.includes(clubId))![0];

let w: WorldState;
const entrants: Record<number, Record<string, string[]>> = {};
const members: Record<number, Record<string, string[]>> = {};
const hard: Record<number, Violation[]> = {};
let clubCount = 0;

/** Plays one season in slices and yields to the event loop in between, so the test runner's heartbeat is never starved. */
async function playSeason(world: WorldState): Promise<void> {
  const season = world.season;
  while (world.season === season) {
    for (let i = 0; i < 14 && world.season === season; i++) advanceDay(world);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
}

beforeAll(async () => {
  w = createWorld(defaultWorldConfig('ext-world', 'compact', null, 'extended'));
  clubCount = Object.keys(w.clubs).length;
  for (let s = 1; s <= SEASONS; s++) {
    entrants[s] = Object.fromEntries(Object.entries(w.competitions).map(([id, c]) => [id, [...c.entrants]]));
    members[s] = Object.fromEntries(Object.entries(w.leagueMembers).map(([id, m]) => [id, [...m]]));
    await playSeason(w);
    hard[s] = validateWorld(w, { checkLedger: true }).filter((v) => v.severity !== 'medium');
  }
  members[SEASONS + 1] = Object.fromEntries(Object.entries(w.leagueMembers).map(([id, m]) => [id, [...m]]));
}, 300000);

describe('extended compact world: structure', () => {
  it('contains every league of the extended selection and the new competitions', () => {
    for (const id of EXTENDED_LEAGUES) expect(members[1]![id], id).toBeDefined();
    expect(Object.keys(members[1]!)).toHaveLength(EXTENDED_LEAGUES.length);
    // first season: holders-based trophies do not exist yet, the others are created
    for (const id of ['FIC', 'RECOPA', 'CAFSC', 'CAMP']) expect(entrants[1]![id], id).toBeUndefined();
    for (const id of ['UCL', 'ACLE', 'CAFCL', 'CCC', 'COPA', 'OCL']) expect(entrants[1]![id], id).toBeDefined();
  });

  it('every competition of every season is complete with a winner and nothing had to be force-played', () => {
    for (let s = 1; s <= SEASONS; s++) {
      const summary = w.history.seasons[s - 1]!;
      const created = Object.keys(entrants[s]!).filter((id) => entrants[s]![id]!.length >= COMPETITIONS[id]!.rules[0]!.minEntrants);
      for (const id of created) expect(summary.champions[id]?.winner, `season ${s} ${id}`).toBeTruthy();
    }
    expect(w.news.filter((n) => /Scheduling warning/.test(n.text))).toEqual([]);
  });

  it('keeps all hard invariants after each rollover: ledger identity, registration limits, no double booking', () => {
    for (let s = 1; s <= SEASONS; s++) expect(hard[s]!.map((v) => `${v.code}: ${v.message}`), `season ${s}`).toEqual([]);
  });

  it('no field is degenerate: every created competition has at least its minimum number of distinct entrants', () => {
    for (let s = 1; s <= SEASONS; s++) {
      for (const [id, ent] of Object.entries(entrants[s]!)) {
        expect(new Set(ent).size, `${id} s${s}`).toBe(ent.length);
        expect(ent.length, `${id} s${s}`).toBeGreaterThanOrEqual(COMPETITIONS[id]!.rules[0]!.minEntrants);
        if (COMPETITIONS[id]!.kind !== 'cup') expect(ent.length, `${id} s${s}`).toBeLessThanOrEqual(COMPETITIONS[id]!.rules[0]!.entrants);
      }
    }
  });
});

describe('extended compact world: promotion and relegation in all ten new pyramids', () => {
  it('swaps the configured number of clubs between the tiers every season, from the final tables', () => {
    for (let s = 1; s <= SEASONS; s++) {
      const summary = w.history.seasons[s - 1]!;
      for (const link of NEW_LINKS) {
        const up = summary.promoted.filter((p) => p.to === link.upper);
        const down = summary.relegated.filter((p) => p.from === link.upper);
        expect(up, `s${s} ${link.upper}`).toHaveLength(link.swap);
        expect(down, `s${s} ${link.upper}`).toHaveLength(link.swap);
        expect(up.map((p) => p.clubId)).toEqual(summary.tables[link.lower]!.slice(0, link.swap));
        expect(down.map((p) => p.clubId).sort()).toEqual(summary.tables[link.upper]!.slice(-link.swap).sort());
        for (const p of up) expect(p.from).toBe(link.lower);
        for (const r of down) expect(r.to).toBe(link.lower);
      }
    }
  });

  it('clubs really change tier, league sizes stay constant and registrations stay consistent', () => {
    expect(Object.keys(w.clubs)).toHaveLength(clubCount);
    for (let s = 1; s <= SEASONS; s++) {
      for (const link of NEW_LINKS) {
        const before = new Set(members[s]![link.upper]);
        const after = new Set(members[s + 1]![link.upper]);
        expect(after.size, `${link.upper} s${s}`).toBe(before.size);
        expect([...after].filter((c) => !before.has(c)), `${link.upper} arrivals s${s}`).toHaveLength(link.swap);
        expect([...before].filter((c) => !after.has(c)), `${link.upper} departures s${s}`).toHaveLength(link.swap);
        expect(members[s + 1]![link.lower]).toHaveLength(members[s]![link.lower]!.length);
      }
    }
    for (const link of NEW_LINKS) {
      for (const c of w.leagueMembers[link.upper]!) expect(w.clubs[c]!.leagueId).toBe(link.upper);
      for (const c of w.leagueMembers[link.lower]!) expect(w.clubs[c]!.leagueId).toBe(link.lower);
      expect(new Set([...w.leagueMembers[link.upper]!, ...w.leagueMembers[link.lower]!]).size).toBe(w.leagueMembers[link.upper]!.length + w.leagueMembers[link.lower]!.length);
    }
  });

  it('relegated clubs entering a league with a foreign-player cap comply with it (ESP2, ITA2, POR2, TUR2, JPN2)', () => {
    let checked = 0;
    for (const link of NEW_LINKS) {
      const cap = COMPETITIONS[link.lower]!.rules[0]!.squad.maxForeignRegistered;
      if (cap === null) continue;
      for (const c of w.leagueMembers[link.lower]!) {
        const foreign = Object.values(w.players).filter((p) => p.clubId === c && !p.retired && p.nationality !== w.clubs[c]!.country).length;
        expect(foreign, `${c} in ${link.lower}`).toBeLessThanOrEqual(cap);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(30);
  });

  it('lower-tier clubs enter the national cup and reach continental competitions only as title holders or cup winners', () => {
    for (let s = 1; s <= SEASONS; s++) {
      for (const link of NEW_LINKS) {
        const country = LEAGUE_BY_ID[link.upper]!.country;
        const cup = entrants[s]![`${country}-CUP`] ?? [];
        const expected = [...members[s]![link.upper]!, ...members[s]![link.lower]!];
        expect([...cup].sort(), `s${s} ${country}-CUP`).toEqual([...expected].sort());
      }
      // clubs that hold a continental title (last four seasons, as the Club World Cup looks back) keep their place after relegation
      const holders = new Set<string>();
      for (const [id, bySeason] of Object.entries(w.history.champions)) {
        const kind = COMPETITIONS[id]!.kind;
        if (kind !== 'continental' && kind !== 'intercontinental') continue;
        for (let k = 1; k <= 4; k++) { const win = bySeason[s - k]?.winner; if (win) holders.add(win); }
      }
      for (const [id, ent] of Object.entries(entrants[s]!)) {
        const def = COMPETITIONS[id]!;
        if (def.kind !== 'continental' && def.kind !== 'intercontinental') continue;
        for (const c of ent) {
          if (LEAGUE_BY_ID[leagueAt(s, c)]!.tier === 1 || holders.has(c)) continue;
          // otherwise only a domestic cup win earns a (Europa League) place
          const country = w.clubs[c]!.country;
          expect(s, `${c} in ${id}`).toBeGreaterThan(1);
          expect(w.history.champions[`${country}-CUP`]?.[s - 1]?.winner, `${c} in ${id}`).toBe(c);
        }
      }
    }
  });
});

describe('extended compact world: qualification from the new leagues', () => {
  const champ = (s: number, league: string): string => w.history.seasons[s - 1]!.tables[league]![0]!;

  it('UEFA: stronger new associations send their champion to the Champions League, the others to the Europa League', () => {
    const ucl = new Set(entrants[2]!.UCL);
    const uel = new Set(entrants[2]!.UEL);
    const uecl = new Set(entrants[2]!.UECL);
    for (const l of ['SUI1', 'GRE1', 'UKR1', 'DEN1', 'CRO1', 'SRB1']) expect(ucl.has(champ(1, l)), l).toBe(true);
    for (const l of ['AUT1', 'CZE1', 'POL1', 'SWE1', 'NOR1']) expect(ucl.has(champ(1, l)) || uel.has(champ(1, l)), l).toBe(true);
    for (const l of ['SUI1', 'DEN1', 'POL1']) {
      const second = w.history.seasons[0]!.tables[l]![1]!;
      expect(ucl.has(second) || uel.has(second) || uecl.has(second), `${l} runner-up`).toBe(true);
    }
    expect(ucl.size).toBe(36);
    expect(uel.size).toBe(36);
    expect(uecl.size).toBe(36);
    for (const c of ucl) expect(uel.has(c) || uecl.has(c)).toBe(false);
    for (const c of uel) expect(uecl.has(c)).toBe(false);
  });

  it('AFC: Elite zones stay 12 + 12 with Iran, Uzbekistan and Thailand included; India feeds ACL Two', () => {
    for (let s = 1; s <= SEASONS; s++) {
      const acle = entrants[s]!.ACLE!;
      expect(acle).toHaveLength(24);
      const zoneOf = (c: string): string | undefined => LEAGUE_BY_ID[leagueAt(s, c)]!.zone;
      expect(acle.filter((c) => zoneOf(c) === 'west')).toHaveLength(12);
      expect(acle.filter((c) => zoneOf(c) === 'east')).toHaveLength(12);
      const leagueOf = (c: string): string => leagueAt(s, c);
      for (const l of ['IRN1', 'THA1']) expect(acle.some((c) => leagueOf(c) === l), `s${s} ${l}`).toBe(true);
      expect(entrants[s]!.ACL2!.some((c) => leagueOf(c) === 'IND1'), `s${s} IND1 in ACL2`).toBe(true);
      expect(entrants[s]!.ACL2!.filter((c) => acle.includes(c))).toEqual([]);
    }
  });

  it('CAF, Concacaf and CONMEBOL include the new associations without degenerate fields', () => {
    const leagueOf = leagueAt;
    for (let s = 1; s <= SEASONS; s++) {
      expect(entrants[s]!.CAFCL).toHaveLength(16);
      expect(entrants[s]!.CAFCL!.some((c) => leagueOf(s, c) === 'NGA1')).toBe(true);
      expect(entrants[s]!.CAFCC!.filter((c) => entrants[s]!.CAFCL!.includes(c))).toEqual([]);
      expect(entrants[s]!.CCC).toHaveLength(27);
      expect(entrants[s]!.CCC!.some((c) => leagueOf(s, c) === 'CAN1')).toBe(true);
      expect(entrants[s]!.COPA).toHaveLength(32);
      expect(entrants[s]!.COPA!.some((c) => ['ECU1', 'PAR1', 'PER1'].includes(leagueOf(s, c)))).toBe(true);
      expect(entrants[s]!.SUDA!.filter((c) => entrants[s]!.COPA!.includes(c))).toEqual([]);
      expect(entrants[s]!.SUDA!.length).toBeGreaterThanOrEqual(16);
    }
  });

  it('domestic super cups exist for the added countries and pit the champion against the cup winner', () => {
    for (const country of ['BRA', 'TUR', 'BEL', 'SCO', 'JPN', 'EGY', 'ARG', 'MEX', 'CHN', 'UAE', 'QAT', 'UKR', 'POL', 'CRO', 'IRN', 'UZB', 'THA', 'NGA', 'PAR']) {
      const id = `${country}-SC`;
      expect(COMPETITIONS[id], id).toBeDefined();
      const ent = entrants[2]![id]!;
      expect(ent, id).toHaveLength(2);
      expect(ent).toContain(champ(1, `${country}1`));
      expect(w.history.champions[id]?.[2]?.winner, id).toBeTruthy();
    }
  });
});

describe('extended compact world: new continental and intercontinental trophies', () => {
  const hist = (id: string, s: number) => w.history.champions[id]?.[s];

  it('are only held from the second season, between the previous holders', () => {
    const e = entrants[2]!;
    expect([...e.RECOPA!].sort()).toEqual([hist('COPA', 1)!.winner, hist('SUDA', 1)!.winner].sort());
    expect([...e.CAFSC!].sort()).toEqual([hist('CAFCL', 1)!.winner, hist('CAFCC', 1)!.winner].sort());
    expect([...e.CAMP!].sort()).toEqual([hist('USA1', 1)!.winner, hist('MEX1', 1)!.winner].sort());
    const fic = [...e.FIC!].sort();
    expect(fic).toEqual(['UCL', 'COPA', 'ACLE', 'CAFCL', 'CCC', 'OCL'].map((id) => hist(id, 1)!.winner).sort());
    for (const id of ['RECOPA', 'CAFSC', 'CAMP', 'FIC']) {
      const done = hist(id, 2)!;
      expect(done.winner, id).toBeTruthy();
      expect(e[id], id).toContain(done.winner);
      expect(e[id], id).toContain(done.runnerUp);
    }
  });

  it('use the intended competition kinds and confederations', () => {
    expect(COMPETITIONS.FIC!.kind).toBe('intercontinental');
    expect(COMPETITIONS.FIC!.confederation).toBeNull();
    for (const [id, conf] of [['CAFSC', 'CAF'], ['RECOPA', 'CONMEBOL'], ['CAMP', 'CONCACAF']] as const) {
      expect(COMPETITIONS[id]!.kind).toBe('superCup');
      expect(COMPETITIONS[id]!.confederation).toBe(conf);
    }
    expect(COMPETITIONS.CCAC!.kind).toBe('continental');
    for (const id of ['FIC', 'RECOPA', 'CAFSC', 'CAMP', 'CCAC']) expect(COMPETITIONS[id]!.verification.status).toBe('unverified-default');
  });

  it('the Intercontinental Cup winner is announced as a title in the news', () => {
    const winner = hist('FIC', 2)!.winner!;
    const rec = w.news.find((n) => n.kind === 'title' && n.ref === 'FIC');
    expect(rec?.clubIds).toContain(winner);
  });
});
