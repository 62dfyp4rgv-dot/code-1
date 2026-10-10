import { describe, expect, it } from 'vitest';
import { applyDataPack, DataPackError, parseDataPack, REAL_CLUB_NAMES, type DataPack } from '../src';
import { overall } from '../src/players';
import { decodeWorld, encodeWorld } from '../src/persistence/codec';
import { assertValid } from '../src/world/invariants';
import { advanceDays, createWorld } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { squadOf } from '../src/world/runtime';

const pack = (over: Record<string, unknown> = {}): Record<string, unknown> => ({ format: 'football-universe-data-pack', version: 1, id: 't', name: 'T', source: 's', licence: 'l', leagues: {}, ...over });

describe('data pack validation (untrusted input)', () => {
  it('accepts the bundled real-club-names pack', () => {
    expect(() => parseDataPack(JSON.stringify(REAL_CLUB_NAMES))).not.toThrow();
    expect(Object.keys(REAL_CLUB_NAMES.leagues)).toEqual(expect.arrayContaining(['ENG1', 'ESP1', 'ITA1', 'GER1', 'FRA1', 'SAU1', 'POR1', 'NED1', 'BRA1', 'USA1']));
    expect(REAL_CLUB_NAMES.leagues.SAU1!.length).toBe(18);
  });
  it.each([
    ['not json', '{'],
    ['wrong format', JSON.stringify({ format: 'x' })],
    ['reserved key', JSON.stringify(pack({ leagues: { __proto__: [] } })).replace('"leagues":{}', '"leagues":{"__proto__":[]}')],
    ['bad league id', JSON.stringify(pack({ leagues: { enga: [] } }))],
    ['remote crest', JSON.stringify(pack({ leagues: { ENG1: [{ name: 'A', crest: 'https://example.com/a.png' }] } }))],
    ['script crest', JSON.stringify(pack({ leagues: { ENG1: [{ name: 'A', crest: 'javascript:alert(1)' }] } }))],
    ['bad colour', JSON.stringify(pack({ leagues: { ENG1: [{ name: 'A', colors: ['red', '#00ff00'] }] } }))],
    ['bad position', JSON.stringify(pack({ leagues: { ENG1: [{ name: 'A', players: [{ name: 'P', position: 'XX' }] }] } }))],
    ['rating out of range', JSON.stringify(pack({ leagues: { ENG1: [{ name: 'A', players: [{ name: 'P', position: 'ST', overall: 150 }] }] } }))],
    ['control chars only', JSON.stringify(pack({ leagues: { ENG1: [{ name: '\u0001\u0002' }] } }))],
  ])('rejects %s', (_n, text) => { expect(() => parseDataPack(text)).toThrow(DataPackError); });
  it('accepts local and small embedded crests', () => {
    const ok = parseDataPack(pack({ leagues: { ENG1: [{ name: 'A', crest: 'file:///crests/a.png' }, { name: 'B', crest: 'asset:crests/b.png' }, { name: 'C', crest: 'data:image/png;base64,iVBORw0KGgo=' }] } }));
    expect(ok.leagues.ENG1).toHaveLength(3);
  });
});

describe('saves cannot smuggle remote crests', () => {
  it('rejects a save whose club crest is a remote URL', () => {
    const w = createWorld(defaultWorldConfig('dp0', 'compact'));
    const chunks = encodeWorld(w).map((c) => ({ ...c }));
    const cc = chunks.find((c) => c.kind === 'clubs')!;
    cc.data = cc.data.replace('"fictional":true', '"fictional":true,"crest":"https://tracker.example/x.png"');
    expect(() => decodeWorld(chunks)).toThrow(/crest/);
  });
});

describe('applying a pack', () => {
  const leagueClubs = (w: ReturnType<typeof createWorld>, lid: string) => (w.leagueMembers[lid] ?? []).map((id) => w.clubs[id]!);

  it('renames the strongest generated clubs first, keeps the world valid and simulates normally', () => {
    const w = createWorld(defaultWorldConfig('dp1', 'compact'));
    const strongest = [...leagueClubs(w, 'ENG1')].sort((a, b) => b.reputation - a.reputation)[0]!.id;
    const info = applyDataPack(w, parseDataPack(JSON.stringify(REAL_CLUB_NAMES)));
    expect(info.applied.clubs).toBeGreaterThan(40);
    expect(w.clubs[strongest]!.name).toBe('Manchester City');
    expect(w.clubs[strongest]!.fictional).toBe(false);
    const names = Object.values(w.clubs).map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    assertValid(w);
    advanceDays(w, 60);
    assertValid(w, { checkLedger: true });
  }, 120_000);

  it('applies coaches, players (position-matched, rating-scaled) and crests, and survives save/load', () => {
    const w = createWorld(defaultWorldConfig('dp2', 'compact'));
    const top = [...leagueClubs(w, 'ESP1')].sort((a, b) => b.reputation - a.reputation)[0]!;
    const p: DataPack = parseDataPack(pack({
      id: 'unit', name: 'Unit pack', leagues: { ESP1: [{
        name: 'Test Club', shortName: 'TST', crest: 'asset:crests/test.png', manager: { name: 'Coach Example', nationality: 'ESP', birthYear: 1975 },
        players: [{ name: 'Alpha Striker', position: 'ST', overall: 88, birthYear: 2000 }, { name: 'Beta Striker', position: 'ST', overall: 60 }, { name: 'Gamma Keeper', position: 'GK', overall: 80 }],
      }] },
    }));
    const info = applyDataPack(w, p);
    expect(info.applied).toEqual({ clubs: 1, players: 3, managers: 1, crests: 1, competitions: 0 });
    expect(w.clubs[top.id]!.crest).toBe('asset:crests/test.png');
    expect(w.managers[w.clubs[top.id]!.managerId!]!.name).toBe('Coach Example');
    const squad = squadOf(w, top.id);
    const alpha = squad.find((x) => x.name === 'Alpha Striker')!;
    const beta = squad.find((x) => x.name === 'Beta Striker')!;
    expect(alpha.primary).toBe('ST');
    expect(Math.abs(overall(alpha) - 88)).toBeLessThan(2);
    expect(Math.abs(overall(beta) - 60)).toBeLessThan(2);
    expect(squad.find((x) => x.name === 'Gamma Keeper')!.primary).toBe('GK');
    assertValid(w);
    const back = decodeWorld(encodeWorld(w));
    expect(back.dataPack).toEqual(info);
    expect(back.clubs[top.id]!.crest).toBe('asset:crests/test.png');
    advanceDays(back, 30);
    assertValid(back, { checkLedger: true });
  }, 120_000);

  it('is deterministic', () => {
    const run = (): string => { const w = createWorld(defaultWorldConfig('dp3', 'compact')); applyDataPack(w, parseDataPack(JSON.stringify(REAL_CLUB_NAMES))); return JSON.stringify(Object.values(w.clubs).map((c) => c.name)); };
    expect(run()).toBe(run());
  }, 120_000);
});

describe('pack-from-csv tool', () => {
  it('builds a valid pack from CSV text with quoted fields and reports bad rows', async () => {
    const { buildPack } = await import('../tools/pack-from-csv');
    const clubs = 'league,club,short,city,colors,crest,manager,managerNationality,managerBirthYear\nENG1,"Example, United",EXU,Exampleton,#aa0000|#ffffff,,Jo Coach,ENG,1970\n';
    const players = 'league,club,player,position,nationality,birthYear,overall\nENG1,"Example, United",A Player,ST,ENG,2001,77\n';
    const p = buildPack(clubs, players, { id: 'csv', name: 'CSV', source: 's', licence: 'l' });
    expect(p.leagues.ENG1![0]!.name).toBe('Example, United');
    expect(p.leagues.ENG1![0]!.players![0]!.overall).toBe(77);
    expect(p.leagues.ENG1![0]!.manager!.name).toBe('Jo Coach');
    expect(() => buildPack(clubs, 'league,club,player,position\nENG1,Unknown FC,X,ST\n', { id: 'csv', name: 'CSV', source: 's', licence: 'l' })).toThrow(/not listed/);
    expect(() => buildPack(clubs, 'league,club,player,position\nENG1,"Example, United",X,QQ\n', { id: 'csv', name: 'CSV', source: 's', licence: 'l' })).toThrow(/position/);
  });
});

describe('starter squads pack', () => {
  it('validates, attaches to the right clubs and applies without breaking the world', async () => {
    const { REAL_CLUBS_WITH_SQUADS } = await import('../src');
    const parsed = parseDataPack(JSON.stringify(REAL_CLUBS_WITH_SQUADS));
    const withPlayers = Object.values(parsed.leagues).flat().filter((c) => c.players?.length);
    expect(withPlayers.length).toBeGreaterThanOrEqual(30);
    const names = Object.values(parsed.leagues).flat().map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    const w = createWorld(defaultWorldConfig('dp-squads', 'compact'));
    const info = applyDataPack(w, parsed);
    expect(info.applied.players).toBeGreaterThan(30);
    assertValid(w);
    advanceDays(w, 40);
    assertValid(w, { checkLedger: true });
  }, 180_000);
});

describe('starter squads: ratings, formations and consistency', () => {
  it('has no player at two clubs, plausible ratings, valid formations, and the rated stars lead their squad', async () => {
    const { REAL_CLUBS_WITH_SQUADS } = await import('../src');
    const clubs = Object.values(REAL_CLUBS_WITH_SQUADS.leagues).flat().filter((c) => c.players?.length);
    const seen = new Map<string, string>();
    for (const c of clubs) for (const p of c.players!) {
      expect(seen.has(p.name), `${p.name} at ${seen.get(p.name)} and ${c.name}`).toBe(false);
      seen.set(p.name, c.name);
      if (p.overall !== undefined) expect(p.overall).toBeGreaterThanOrEqual(55);
      if (p.overall !== undefined) expect(p.overall).toBeLessThanOrEqual(92);
    }
    expect(clubs.every((c) => c.formation)).toBe(true);
    const rated = clubs.flatMap((c) => c.players!).filter((p) => p.overall !== undefined).length;
    expect(rated / seen.size).toBeGreaterThan(0.95);
    const w = createWorld(defaultWorldConfig('dp-rated', 'compact'));
    applyDataPack(w, parseDataPack(JSON.stringify(REAL_CLUBS_WITH_SQUADS)));
    const city = Object.values(w.clubs).find((c) => c.name === 'Manchester City')!;
    expect(city.tactics.formation).toBe('4-3-3');
    const haaland = squadOf(w, city.id).find((p) => p.name === 'Erling Haaland')!;
    expect(Math.abs(overall(haaland) - 91)).toBeLessThan(2);
    assertValid(w);
  }, 120_000);
});

describe('real competition names', () => {
  it('overlays names on leagues, cups and continental trophies in views, news and saves', async () => {
    const { competitionName, competitionShortName, REAL_CLUB_NAMES: pk } = await import('../src');
    const { competitionList, clubView, leagueTableView } = await import('../src/world/views');
    const w = createWorld(defaultWorldConfig('dp-comp', 'compact'));
    expect(competitionName(w, 'SAU-CUP')).toBe('Saudi Arabia Cup');
    const info = applyDataPack(w, parseDataPack(JSON.stringify(pk)));
    expect(info.applied.competitions).toBeGreaterThan(50);
    expect(competitionName(w, 'SAU-CUP')).toBe("King's Cup");
    expect(competitionName(w, 'ESP-CUP')).toBe('Copa del Rey');
    expect(competitionShortName(w, 'ENG1')).toBe('EPL');
    expect(competitionList(w).some((c) => c.name === 'La Liga' || c.name === 'Premier League')).toBe(true);
    const some = Object.values(w.clubs).find((c) => c.leagueId === 'ENG1')!;
    expect(clubView(w, some.id)!.league).toBe('Premier League');
    expect(leagueTableView(w, 'ENG1').length).toBeGreaterThan(0);
    const back = decodeWorld(encodeWorld(w));
    expect(competitionName(back, 'SAU-CUP')).toBe("King's Cup");
    expect(() => parseDataPack(JSON.stringify(pack({ competitions: { 'bad id': { name: 'x' } } })))).toThrow(DataPackError);
    advanceDays(w, 20);
  }, 120_000);
});

describe('real competition names cover the whole registry', () => {
  it('every registered competition has a real-world display name', async () => {
    const { COMPETITIONS } = await import('../src');
    const { REAL_COMPETITION_NAMES } = await import('../src/data/realCompetitionNames');
    expect(Object.values(COMPETITIONS).filter((d) => !REAL_COMPETITION_NAMES[d.id]).map((d) => d.id)).toEqual([]);
    expect(() => parseDataPack(JSON.stringify({ ...pack(), competitions: REAL_COMPETITION_NAMES }))).not.toThrow();
  });
});
