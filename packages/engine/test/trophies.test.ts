/**
 * New trophies (FIC, Recopa, CAF Super Cup, Campeones Cup, Concacaf Central American Cup), size-aware domestic cup
 * calendars, and qualification cascades from the extended leagues into the continental competitions.
 * All formats and slot counts are unverified scenario defaults.
 */
import { describe, expect, it } from 'vitest';
import { COMPETITIONS, LEAGUE_BY_ID, LEAGUE_PROFILES } from '../src/competition/registry';
import { createCompetition } from '../src/competition/engine';
import { allocateEntrants, apportion, buildQualSpecs, type QualInput } from '../src/competition/qualification';
import type { CompetitionState } from '../src/competition/types';
import { ctxFor, fakeClubs, playOut } from './helpers';

const weekOf = (day: number): number => Math.floor(day / 7);

function play(id: string, n: number, countries: string[] = ['A', 'B', 'C', 'D', 'E', 'F']): { comp: CompetitionState; clubs: ReturnType<typeof fakeClubs> } {
  const clubs = fakeClubs(n, countries, `tr-${id}-${n}`).map((c, i) => ({ ...c, zone: i % 2 === 0 ? 'west' : 'east' }));
  const ctx = ctxFor(clubs, `tr-${id}-${n}`);
  const comp = createCompetition(COMPETITIONS[id]!, 1, clubs.map((c) => c.id), ctx);
  playOut(comp, ctx, clubs, id);
  return { comp, clubs };
}

describe('registry honesty and consistency (all competitions)', () => {
  it('every competition is labelled unverified with a note; ids are unique; domestic competitions have their league', () => {
    for (const def of Object.values(COMPETITIONS)) {
      expect(def.verification.status, def.id).toBe('unverified-default');
      expect(def.verification.note.length, def.id).toBeGreaterThan(30);
      expect(def.rules.length).toBeGreaterThan(0);
      if (def.kind === 'cup' || def.kind === 'superCup') if (def.country) expect(COMPETITIONS[`${def.country}1`], def.id).toBeDefined();
    }
    expect(new Set(LEAGUE_PROFILES.map((p) => p.id)).size).toBe(LEAGUE_PROFILES.length);
    expect(Object.values(COMPETITIONS).filter((d) => d.kind === 'league').length).toBe(LEAGUE_PROFILES.length);
    expect(Object.values(COMPETITIONS).filter((d) => d.kind === 'cup').length).toBe(LEAGUE_PROFILES.filter((p) => p.hasCup).length);
    expect(Object.values(COMPETITIONS).filter((d) => d.kind === 'superCup' && d.country).length).toBe(LEAGUE_PROFILES.filter((p) => p.hasSuperCup).length);
  });

  it('adds the requested domestic super cups for the big leagues that lacked one', () => {
    for (const c of ['BRA', 'TUR', 'BEL', 'SCO', 'JPN', 'EGY']) expect(COMPETITIONS[`${c}-SC`], c).toBeDefined();
    expect(COMPETITIONS['USA-SC']).toBeUndefined();
  });
});

describe('domestic cup calendar scales with the size of the national pyramid', () => {
  const WEEKS_BACK = [39, 25, 21, 17, 13, 9, 7];
  for (const n of [4, 8, 10, 12, 18, 20, 44, 60]) {
    it(`${n} entrants: ceil(log2 n) rounds counted back from a week-44 neutral final, top seeds skip round one`, () => {
      const { comp, clubs } = play('ENG-CUP', n, ['ENG']);
      expect(comp.status).toBe('complete');
      expect(comp.fixtures.filter((f) => f.status === 'played')).toHaveLength(n - 1);
      const rounds = Math.ceil(Math.log2(n));
      const maxRound = Math.max(...comp.fixtures.map((f) => f.round));
      expect(maxRound).toBe(rounds);
      for (const f of comp.fixtures) {
        if (f.round === rounds) { expect(weekOf(f.day)).toBe(44); expect(f.neutral).toBe(true); }
        else expect(weekOf(f.day), `round ${f.round}`).toBe(WEEKS_BACK[rounds - 1 - f.round]);
      }
      // semi-finals always sit in week 39 whatever the field
      if (rounds >= 3) expect(new Set(comp.fixtures.filter((f) => f.round === rounds - 1).map((f) => weekOf(f.day)))).toEqual(new Set([39]));
      // round weeks never go backwards
      for (let r = 2; r <= rounds; r++) {
        const prev = Math.max(...comp.fixtures.filter((f) => f.round === r - 1).map((f) => f.day));
        const next = Math.min(...comp.fixtures.filter((f) => f.round === r).map((f) => f.day));
        expect(next).toBeGreaterThan(prev);
      }
      // byes: with a non power-of-two field the strongest seeds are not drawn in the first round
      const bracket = 2 ** rounds;
      const byes = bracket - n;
      const firstRound = new Set(comp.fixtures.filter((f) => f.round === 1).flatMap((f) => [f.home, f.away]));
      for (const c of clubs.slice(0, byes)) expect(firstRound.has(c.id), c.id).toBe(false);
    });
  }
});

describe('two-legged Recopa Sudamericana', () => {
  it('plays home and away legs a week apart and decides on aggregate', () => {
    const { comp } = play('RECOPA', 2);
    expect(comp.status).toBe('complete');
    expect(comp.fixtures).toHaveLength(2);
    const [a, b] = comp.fixtures as [CompetitionState['fixtures'][number], CompetitionState['fixtures'][number]];
    expect(a.home).toBe(b.away);
    expect(a.away).toBe(b.home);
    expect(weekOf(b.day) - weekOf(a.day)).toBe(1);
    expect(a.neutral || b.neutral).toBe(false);
    expect(comp.winner).toBeTruthy();
    expect(comp.runnerUp).not.toBe(comp.winner);
    expect(comp.stages[0]!.ties[0]![0]!.decidedBy).toMatch(/aggregate|extraTime|penalties/);
  });
});

describe('single-match holders cups', () => {
  it.each(['CAFSC', 'CAMP'])('%s is one neutral-venue match with a winner', (id) => {
    const { comp } = play(id, 2);
    expect(comp.status).toBe('complete');
    expect(comp.fixtures).toHaveLength(1);
    expect(comp.fixtures[0]!.neutral).toBe(true);
    expect(weekOf(comp.fixtures[0]!.day)).toBeLessThan(6);
    expect(comp.winner).toBeTruthy();
  });
});

describe('FIFA Intercontinental Cup', () => {
  it('six continental champions: the two best seeds get byes, semi-finals, single neutral final, played before the league phases start', () => {
    const { comp, clubs } = play('FIC', 6);
    expect(comp.status).toBe('complete');
    expect(comp.fixtures).toHaveLength(5);
    const ko = comp.stages[0]!;
    expect(ko.ties.map((r) => r.length)).toEqual([4, 2, 1]);
    expect(ko.ties[0]!.filter((t) => t.decidedBy === 'bye').map((t) => t.home).sort()).toEqual([clubs[0]!.id, clubs[1]!.id].sort());
    const fin = comp.fixtures.find((f) => f.round === 3)!;
    expect(fin.neutral).toBe(true);
    expect(weekOf(fin.day)).toBe(5);
    for (const f of comp.fixtures) expect(weekOf(f.day)).toBeLessThan(6);
    expect(comp.finalRanking).toHaveLength(6);
    expect(comp.finalRanking[0]).toBe(comp.winner);
  });

  it.each([4, 5, 6])('completes with %i entrants (a confederation without a champion is simply absent)', (n) => {
    const { comp } = play('FIC', n);
    expect(comp.status).toBe('complete');
    expect(comp.winner).toBeTruthy();
    expect(comp.finalRanking).toHaveLength(n);
  });

  it('is an annual intercontinental competition distinct from the quadrennial Club World Cup', () => {
    expect(COMPETITIONS.FIC!.period).toBe(1);
    expect(COMPETITIONS.CWC!.period).toBe(4);
    expect(COMPETITIONS.FIC!.firstSeason).toBeGreaterThanOrEqual(2);
  });
});

describe('Concacaf Central American Cup', () => {
  it('16 clubs: 4 groups of 4, 8 qualify, quarter-finals, semi-finals, final', () => {
    const { comp } = play('CCAC', 16, ['CRC', 'CAM']);
    expect(comp.status).toBe('complete');
    expect(Object.keys(comp.stages[0]!.groups)).toHaveLength(4);
    expect(comp.stages[0]!.qualified).toHaveLength(8);
    expect(comp.stages[1]!.ties.map((r) => r.length)).toEqual([4, 2, 1]);
    expect(comp.finalRanking).toHaveLength(16);
  });

  it.each([8, 10, 12])('still completes with %i entrants', (n) => {
    const { comp } = play('CCAC', n, ['CRC', 'CAM']);
    expect(comp.status).toBe('complete');
    expect(comp.winner).toBeTruthy();
  });
});

// ------------------------------------------------------------------ qualification cascades

const mkLeagues = (ids: string[], size = 18): QualInput => {
  const members: Record<string, string[]> = {};
  const tables: Record<string, string[]> = {};
  const rep = new Map<string, number>();
  ids.forEach((l, li) => {
    members[l] = Array.from({ length: size }, (_, i) => `${l}-${i}`);
    tables[l] = [...(members[l] as string[])];
    (members[l] as string[]).forEach((c, i) => rep.set(c, 100 - i * 2 - li * 0.1));
  });
  return { season: 3, tables, history: {}, leagueMembers: members, reputation: (c) => rep.get(c) ?? 0 };
};

const UEFA_ALL = ['ENG1', 'ESP1', 'ITA1', 'GER1', 'FRA1', 'POR1', 'NED1', 'BEL1', 'SCO1', 'TUR1', 'SUI1', 'AUT1', 'GRE1', 'UKR1', 'DEN1', 'SWE1', 'NOR1', 'POL1', 'CZE1', 'CRO1', 'SRB1'];

describe('qualification: apportionment', () => {
  it('leaves weights that fit untouched and scales larger ones to the available seats', () => {
    expect(apportion({ A: 5, B: 4, C: 3 }, 12)).toEqual({ A: 5, B: 4, C: 3 });
    expect(apportion({ A: 5, B: 4 }, 12)).toEqual({ A: 5, B: 4 });
    const scaled = apportion({ SAU1: 5, UAE1: 4, QAT1: 3, IRN1: 3, UZB1: 2 }, 12);
    expect(Object.values(scaled).reduce((a, b) => a + b, 0)).toBe(12);
    for (const v of Object.values(scaled)) expect(v).toBeGreaterThanOrEqual(1);
    expect(scaled.SAU1).toBeGreaterThanOrEqual(scaled.UZB1!);
  });
});

describe('qualification: UEFA with the extended associations', () => {
  const input = mkLeagues(UEFA_ALL);
  const out = allocateEntrants(buildQualSpecs(UEFA_ALL), input);

  it('keeps all three competitions at 36 distinct, mutually exclusive clubs', () => {
    for (const id of ['UCL', 'UEL', 'UECL']) expect(out[id], id).toHaveLength(36);
    const all = [...out.UCL!, ...out.UEL!, ...out.UECL!];
    expect(new Set(all).size).toBe(all.length);
  });

  it('sends champions of the stronger new associations to the Champions League and the others to the Europa League', () => {
    const europe = (l: string): string[] => [...out.UCL!, ...out.UEL!, ...out.UECL!].filter((c) => c.startsWith(`${l}-`));
    for (const l of ['SUI1', 'GRE1', 'UKR1', 'DEN1', 'CRO1', 'SRB1']) { expect(out.UCL, l).toContain(`${l}-0`); expect(europe(l).length, l).toBeGreaterThanOrEqual(2); }
    for (const l of ['AUT1', 'CZE1', 'POL1', 'SWE1', 'NOR1']) { expect(out.UCL!.includes(`${l}-0`) || out.UEL!.includes(`${l}-0`), l).toBe(true); expect(europe(l).length, l).toBeGreaterThanOrEqual(2); }
    // only the reputation fill can lift such a champion into the Champions League; the configured slot is a Europa League place
    expect(out.UEL!.filter((c) => /^(AUT1|CZE1|POL1|SWE1|NOR1)-0$/.test(c)).length + out.UCL!.filter((c) => /^(AUT1|CZE1|POL1|SWE1|NOR1)-0$/.test(c)).length).toBe(5);
  });

  it('cup winners of new associations take a Europa League place, falling back to the next in the table', () => {
    const inp = mkLeagues(UEFA_ALL);
    inp.history = { 'SUI-CUP': { 2: { winner: 'SUI1-7', runnerUp: null } }, 'GRE-CUP': { 2: { winner: 'GRE1-0', runnerUp: null } } };
    const res = allocateEntrants(buildQualSpecs(UEFA_ALL), inp);
    expect(res.UEL).toContain('SUI1-7');
    expect(res.UCL).toContain('GRE1-0');
    expect(res.UEL).not.toContain('GRE1-0');
    expect(res.UEL).toContain('GRE1-2'); // cascade: the cup place passes to the first finisher below the league places
  });

  it('does not crash on tiny leagues and still respects the field sizes', () => {
    const tiny = mkLeagues(UEFA_ALL, 3);
    const res = allocateEntrants(buildQualSpecs(UEFA_ALL), tiny);
    for (const id of ['UCL', 'UEL', 'UECL']) expect(res[id]!.length).toBeLessThanOrEqual(36);
  });
});

describe('qualification: AFC zones with Iran, Uzbekistan, Thailand and India', () => {
  const zoneOf = (club: string): string | undefined => LEAGUE_BY_ID[club.split('-')[0] as string]!.zone;

  it('keeps ACL Elite at 12 + 12 and gives every association at least one place', () => {
    const leagues = ['SAU1', 'UAE1', 'QAT1', 'IRN1', 'UZB1', 'JPN1', 'KOR1', 'CHN1', 'AUS1', 'THA1', 'IND1'];
    const out = allocateEntrants(buildQualSpecs(leagues), mkLeagues(leagues));
    expect(out.ACLE).toHaveLength(24);
    expect(out.ACLE!.filter((c) => zoneOf(c) === 'west')).toHaveLength(12);
    expect(out.ACLE!.filter((c) => zoneOf(c) === 'east')).toHaveLength(12);
    for (const l of leagues.filter((x) => x !== 'IND1')) expect(out.ACLE!.some((c) => c.startsWith(l)), l).toBe(true);
    expect(out.ACLE!.some((c) => c.startsWith('IND1'))).toBe(false);
    expect(out.ACL2).toHaveLength(32);
    expect(out.ACL2!.filter((c) => out.ACLE!.includes(c))).toEqual([]);
    expect(out.ACL2!.some((c) => c.startsWith('IND1'))).toBe(true);
  });

  it('the legacy associations keep their original places when no new association is present', () => {
    const leagues = ['SAU1', 'UAE1', 'QAT1', 'JPN1', 'KOR1', 'CHN1', 'AUS1'];
    const out = allocateEntrants(buildQualSpecs(leagues), mkLeagues(leagues));
    const count = (l: string): number => out.ACLE!.filter((c) => c.startsWith(l)).length;
    expect([count('SAU1'), count('UAE1'), count('QAT1'), count('JPN1'), count('KOR1'), count('CHN1'), count('AUS1')]).toEqual([5, 4, 3, 4, 3, 3, 2]);
  });

  it('a lone new association (Thailand) still yields a full-sized zone through reputation fill', () => {
    const out = allocateEntrants(buildQualSpecs(['THA1']), mkLeagues(['THA1']));
    expect(out.ACLE!.length).toBe(12);
  });
});

describe('qualification: Africa and the Americas', () => {
  it('CAF Champions League includes Nigeria, Ghana and Senegal and the CAF Super Cup pits the two holders', () => {
    const leagues = ['EGY1', 'MAR1', 'RSA1', 'TUN1', 'ALG1', 'NGA1', 'GHA1', 'SEN1'];
    const inp = mkLeagues(leagues, 16);
    inp.history = { CAFCL: { 2: { winner: 'NGA1-0', runnerUp: 'EGY1-1' } }, CAFCC: { 2: { winner: 'GHA1-4', runnerUp: null } } };
    const out = allocateEntrants(buildQualSpecs(leagues), inp);
    expect(out.CAFCL).toHaveLength(16);
    for (const l of ['NGA1', 'GHA1', 'SEN1']) expect(out.CAFCL!.some((c) => c.startsWith(l)), l).toBe(true);
    expect(out.CAFCC!.filter((c) => out.CAFCL!.includes(c))).toEqual([]);
    expect([...out.CAFSC!].sort()).toEqual(['GHA1-4', 'NGA1-0']);
    // the same club winning both: the senior competition's runner-up takes the second seat
    inp.history = { CAFCL: { 2: { winner: 'NGA1-0', runnerUp: 'EGY1-1' } }, CAFCC: { 2: { winner: 'NGA1-0', runnerUp: null } } };
    expect([...allocateEntrants(buildQualSpecs(leagues), inp).CAFSC!].sort()).toEqual(['EGY1-1', 'NGA1-0']);
  });

  it('Concacaf: Canada joins the Champions Cup, the Central American Cup excludes it, and its winner qualifies next time', () => {
    const leagues = ['USA1', 'MEX1', 'CRC1', 'CAM1', 'CAN1'];
    const inp = mkLeagues(leagues, 16);
    inp.history = { CCAC: { 2: { winner: 'CRC1-9', runnerUp: 'CAM1-8' } }, USA1: { 2: { winner: 'USA1-3', runnerUp: null } }, MEX1: { 2: { winner: 'MEX1-2', runnerUp: null } } };
    const out = allocateEntrants(buildQualSpecs(leagues), inp);
    expect(out.CCC).toHaveLength(27);
    expect(out.CCC!.some((c) => c.startsWith('CAN1'))).toBe(true);
    expect(out.CCC).toContain('CRC1-9');
    expect(out.CCAC).toHaveLength(16);
    expect(out.CCAC!.filter((c) => out.CCC!.includes(c))).toEqual([]);
    for (const c of out.CCAC!) expect(c.startsWith('CRC1') || c.startsWith('CAM1')).toBe(true);
    expect([...out.CAMP!].sort()).toEqual(['MEX1-2', 'USA1-3']);
  });

  it('CONMEBOL: Ecuador, Paraguay and Peru enter both competitions without overflow; the Recopa pits the two holders', () => {
    const leagues = ['BRA1', 'ARG1', 'COL1', 'CHI1', 'URU1', 'ECU1', 'PAR1', 'PER1'];
    const inp = mkLeagues(leagues, 16);
    inp.history = { COPA: { 2: { winner: 'PER1-5', runnerUp: 'BRA1-2' } }, SUDA: { 2: { winner: 'ECU1-6', runnerUp: null } } };
    const out = allocateEntrants(buildQualSpecs(leagues), inp);
    expect(out.COPA).toHaveLength(32);
    expect(out.SUDA).toHaveLength(32);
    expect(out.COPA).toContain('PER1-5');
    for (const l of ['ECU1', 'PAR1', 'PER1']) { expect(out.COPA!.some((c) => c.startsWith(l)), l).toBe(true); expect(out.SUDA!.some((c) => c.startsWith(l)), l).toBe(true); }
    expect(out.SUDA!.filter((c) => out.COPA!.includes(c))).toEqual([]);
    expect([...out.RECOPA!].sort()).toEqual(['ECU1-6', 'PER1-5']);
  });

  it('FIFA Intercontinental Cup: previous continental champions, filled by reputation when a confederation lacks a holder', () => {
    const leagues = [...UEFA_ALL.slice(0, 3), 'BRA1', 'ARG1', 'SAU1', 'JPN1', 'EGY1', 'USA1', 'NZL1'];
    const inp = mkLeagues(leagues, 16);
    inp.history = {
      UCL: { 2: { winner: 'ESP1-3', runnerUp: null } }, COPA: { 2: { winner: 'ARG1-2', runnerUp: null } }, ACLE: { 2: { winner: 'JPN1-1', runnerUp: null } },
      CAFCL: { 2: { winner: 'EGY1-4', runnerUp: null } }, CCC: { 2: { winner: 'USA1-5', runnerUp: null } },
    };
    const out = allocateEntrants(buildQualSpecs(leagues), inp);
    expect(out.FIC).toHaveLength(6);
    for (const w of ['ESP1-3', 'ARG1-2', 'JPN1-1', 'EGY1-4', 'USA1-5']) expect(out.FIC, w).toContain(w);
    expect(out.FIC!.some((c) => c.startsWith('NZL1'))).toBe(true); // no OCL holder: best-reputed OFC club
    // without any OFC league the field is five clubs, still above the minimum
    const noOfc = allocateEntrants(buildQualSpecs(leagues.filter((l) => l !== 'NZL1')), inp);
    expect(noOfc.FIC).toHaveLength(5);
    expect(COMPETITIONS.FIC!.rules[0]!.minEntrants).toBeLessThanOrEqual(5);
  });
});

describe('qualification: relegation removes league-based places', () => {
  it('a club that left the league (relegated) is not admitted by table rank, although it would be otherwise', () => {
    const leagues = ['BRA1', 'ARG1', 'COL1'];
    const control = allocateEntrants(buildQualSpecs(leagues), mkLeagues(leagues, 12));
    expect([...control.COPA!, ...control.SUDA!]).toContain('BRA1-8'); // rank 9 of 12 sits in the Sudamericana range
    const inp = mkLeagues(leagues, 12);
    inp.leagueMembers.BRA1 = inp.leagueMembers.BRA1!.filter((c) => c !== 'BRA1-8');
    inp.leagueMembers.BRA2 = ['BRA1-8'];
    const out = allocateEntrants(buildQualSpecs(leagues), inp);
    expect([...out.COPA!, ...out.SUDA!]).not.toContain('BRA1-8');
    expect(out.COPA).toContain('BRA1-6');
  });
});
