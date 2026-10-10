import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { REAL_CLUBS_WITH_SQUADS, REAL_CLUB_NAMES } from '@fu/engine';
import { MAX_CREST_URI_LENGTH, bytesToBase64, dataUriLength, mimeOf, normaliseName, planCrestImport, stripExtension, type CrestClub, type PickedImage } from '../src/core/crestImport';
import { applyDataPackToPending, boot, closeCareer, generateWorldForSelection, importCrestsToPending, loadSlot, startCareer, useGame } from '../src/state/gameStore';
import { clubCrestUri } from '../src/state/lookups';
import { getPendingWorld, getWorld } from '../src/state/worldHost';

const clubs: CrestClub[] = [
  { id: 'a', name: 'Manchester City', shortName: 'MCI' }, { id: 'b', name: 'Atlético de Madrid', shortName: 'ATM' },
  { id: 'c', name: 'Brighton & Hove Albion', shortName: 'BHA' }, { id: 'd', name: 'Stade Brestois', shortName: 'BRE' }, { id: 'e', name: 'Brentford', shortName: 'BRE' },
];
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const img = (name: string, extra: Partial<PickedImage> = {}): PickedImage => ({ name, mime: null, size: PNG.length, bytes: PNG, ...extra });

describe('crest file name matching', () => {
  it('normalises names', () => {
    expect(normaliseName('Manchester City')).toBe('manchester-city');
    expect(normaliseName('Atlético de Madrid')).toBe('atletico-de-madrid');
    expect(normaliseName('  Brighton & Hove  Albion! ')).toBe('brighton-hove-albion');
    expect(normaliseName('1. FC Köln')).toBe('1-fc-koln');
    expect(stripExtension('My Crests/Manchester City.PNG')).toBe('Manchester City');
    expect(stripExtension('.hidden')).toBe('.hidden');
  });
  it('matches by club name, by unique short name, and is case/punctuation/extension-insensitive', () => {
    const { results, report } = planCrestImport([img('manchester-city.png'), img('Manchester_City.jpg'), img('ATLETICO DE MADRID.webp'), img('bha.png'), img('Brighton and Hove Albion.png')], clubs);
    expect(results.map((r) => [r.status, r.clubId])).toEqual([['matched', 'a'], ['duplicate', 'a'], ['matched', 'b'], ['matched', 'c'], ['unmatched', undefined]]);
    expect(report).toMatchObject({ matched: 3, unmatched: 2, tooBig: 0, unsupported: 0 });
    expect(report.unmatchedFiles).toEqual(['Manchester_City.jpg', 'Brighton and Hove Albion.png']);
    expect(results[0]!.uri!.startsWith('data:image/png;base64,')).toBe(true);
    expect(results[3]!.uri!.startsWith('data:image/png;base64,')).toBe(true);
  });
  it('ambiguous short names do not match; unsupported types are reported', () => {
    const { results, report } = planCrestImport([img('bre.png'), img('notes.txt'), img('manchester-city.gif'), img('Brentford.JPG', { mime: 'image/jpeg' })], clubs);
    expect(results.map((r) => r.status)).toEqual(['unmatched', 'unsupported', 'unsupported', 'matched']);
    expect(results[3]!.uri!.startsWith('data:image/jpeg;base64,')).toBe(true);
    expect(report).toMatchObject({ matched: 1, unmatched: 1, unsupported: 2 });
  });
  it('mime comes from the reported type, else the extension', () => {
    expect(mimeOf(img('a.PNG'))).toBe('image/png');
    expect(mimeOf(img('a.jpeg'))).toBe('image/jpeg');
    expect(mimeOf(img('a.webp'))).toBe('image/webp');
    expect(mimeOf(img('a.bin', { mime: 'image/webp' }))).toBe('image/webp');
    expect(mimeOf(img('a.svg', { mime: 'image/svg+xml' }))).toBeNull();
  });
  it('base64 encoder is correct', () => {
    for (const s of ['', 'f', 'fo', 'foo', 'foob', 'fooba', 'foobar']) expect(bytesToBase64(new TextEncoder().encode(s))).toBe(Buffer.from(s).toString('base64'));
    const all = Uint8Array.from({ length: 256 }, (_, i) => i);
    expect(bytesToBase64(all)).toBe(Buffer.from(all).toString('base64'));
  });
});

describe('crest size limit (the engine limits the whole embedded URI to 300 KB)', () => {
  it('accepts the largest file whose URI fits, rejects one byte more, and never reads oversized files', () => {
    // largest raw size n with prefix + 4*ceil(n/3) <= limit
    let n = 0; while (dataUriLength(n + 1) <= MAX_CREST_URI_LENGTH) n++;
    const ok = new Uint8Array(n).fill(7);
    const tooBigBytes = new Uint8Array(n + 1).fill(7);
    const { results, report } = planCrestImport([
      img('manchester-city.png', { size: ok.length, bytes: ok }),
      img('brentford.png', { size: tooBigBytes.length, bytes: tooBigBytes }),
      img('stade-brestois.png', { size: 5_000_000, bytes: null }),
    ], clubs);
    expect(results.map((r) => r.status)).toEqual(['matched', 'tooBig', 'tooBig']);
    expect(results[0]!.uri!.length).toBeLessThanOrEqual(MAX_CREST_URI_LENGTH);
    expect(report).toMatchObject({ matched: 1, tooBig: 2, tooBigFiles: ['brentford.png', 'stade-brestois.png'] });
  });
});

describe('crest import and squads pack in the store', () => {
  it('real names + starter squads applies coaches and players; crests import onto the pending world, survive start -> save -> reload and are never remote', async () => {
    await boot();
    await generateWorldForSelection('crest-flow', 'compact');
    closeCareer();
    const info = await applyDataPackToPending(REAL_CLUBS_WITH_SQUADS);
    expect(info!.id).toBe(REAL_CLUBS_WITH_SQUADS.id);
    expect(info!.applied.players).toBeGreaterThan(100);
    expect(info!.applied.managers).toBeGreaterThan(5);
    const w = getPendingWorld()!;
    expect(Object.values(w.players).some((p) => p.name === 'Erling Haaland')).toBe(true);
    const city = Object.values(w.clubs).find((c) => c.name === 'Manchester City')!;
    expect(w.managers[city.managerId!]!.name).toBe('Pep Guardiola');
    const crestsBefore = info!.applied.crests;

    const report = importCrestsToPending([img('manchester-city.png'), img('liverpool.jpg', { mime: 'image/jpeg' }), img('nobody-fc.png'), img('huge.png', { size: 9e6, bytes: null }), img('arsenal.gif')]);
    expect(report).toMatchObject({ matched: 2, unmatched: 2, tooBig: 0, unsupported: 1 }); // huge.png matches no club, so it is "unmatched" not "too big"
    expect(w.dataPack!.applied.crests).toBe(crestsBefore + 2);
    expect(clubCrestUri(city.id)).toMatch(/^data:image\/png;base64,/);
    // re-importing the same club replaces the crest and does not inflate the count
    importCrestsToPending([img('Manchester City.png')]);
    expect(w.dataPack!.applied.crests).toBe(crestsBefore + 2);

    await startCareer(city.id);
    const slot = useGame.getState().activeSlot!;
    closeCareer();
    expect(await loadSlot(slot)).toBe(true); // the engine re-validates crests on load
    const loaded = getWorld()!;
    expect(loaded.clubs[city.id]!.crest).toMatch(/^data:image\/png;base64,/);
    expect(loaded.dataPack!.applied.crests).toBe(crestsBefore + 2);
    expect(Object.values(loaded.clubs).filter((c) => c.crest).length).toBe(2);
    expect(Object.values(loaded.clubs).every((c) => !c.crest || c.crest.startsWith('data:image/'))).toBe(true);
  }, 240000);

  it('crests without a pack create a provenance record; switching option drops them; nothing matched changes nothing', async () => {
    closeCareer();
    await generateWorldForSelection('crest-nopack', 'compact');
    const w0 = getPendingWorld()!;
    expect(importCrestsToPending([img('nothing-matches.png')]).matched).toBe(0);
    expect(w0.dataPack ?? null).toBeNull();
    const first = Object.values(w0.clubs)[0]!;
    importCrestsToPending([img(`${first.name}.png`)]);
    expect(w0.dataPack).toMatchObject({ id: 'user-crest-images', applied: { crests: 1 } });
    expect(w0.dataPack!.licence).toMatch(/responsible/);
    await applyDataPackToPending(REAL_CLUB_NAMES);
    expect(Object.values(getPendingWorld()!.clubs).some((c) => c.crest)).toBe(false);
    await applyDataPackToPending(null);
    expect(getPendingWorld()!.dataPack ?? null).toBeNull();
  }, 240000);
});
