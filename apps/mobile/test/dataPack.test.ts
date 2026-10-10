import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';
import { DataPackError, REAL_CLUB_NAMES, applyDataPack, createWorld, defaultWorldConfig, parseDataPack, validateWorld, type DataPack } from '@fu/engine';
import { applyDataPackToPending, boot, closeCareer, generateWorldForSelection, loadSlot, saveNow, startCareer, useGame } from '../src/state/gameStore';
import { clubCrestUri, isRenderableCrest } from '../src/state/lookups';
import { getPendingWorld, getWorld, setPendingWorld } from '../src/state/worldHost';

const names = (w: { clubs: Record<string, { name: string }> }): string[] => Object.values(w.clubs).map((c) => c.name).sort();
const TINY_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

describe('data pack in the new-career store flow', () => {
  beforeAll(async () => { await boot(); });

  it('starter pack -> real names in the pending world -> start career -> save -> reload keeps names and dataPack', async () => {
    await generateWorldForSelection('pack-flow', 'compact');
    const before = getPendingWorld()!;
    expect(before.dataPack ?? null).toBeNull();
    const fictionalEng1 = (before.leagueMembers.ENG1 ?? []).map((id) => before.clubs[id]!.name);
    expect(fictionalEng1).not.toContain('Manchester City');

    const info = await applyDataPackToPending(REAL_CLUB_NAMES);
    expect(info?.id).toBe(REAL_CLUB_NAMES.id);
    expect(info!.applied.clubs).toBeGreaterThan(50);
    expect(info!.applied.players).toBe(0); // names only: no players, coaches or crests
    expect(info!.applied.managers).toBe(0);
    expect(info!.applied.crests).toBe(0);
    const pending = getPendingWorld()!;
    expect(pending).not.toBe(before);
    expect(pending.dataPack).toEqual(info);
    expect(names(pending)).toContain('Manchester City');
    expect(validateWorld(pending).filter((v) => v.severity === 'critical')).toEqual([]);
    // the strongest generated English club is the first pack club
    const top = [...(pending.leagueMembers.ENG1 ?? [])].map((id) => pending.clubs[id]!).sort((a, b) => b.reputation - a.reputation)[0]!;
    expect(top.name).toBe('Manchester City');

    // idempotent: applying again (or removing and re-applying) yields exactly the same world
    await applyDataPackToPending(REAL_CLUB_NAMES);
    expect(names(getPendingWorld()!)).toEqual(names(pending));
    await applyDataPackToPending(null);
    expect(getPendingWorld()!.dataPack ?? null).toBeNull();
    expect(names(getPendingWorld()!)).toEqual(names(before));
    await applyDataPackToPending(REAL_CLUB_NAMES);

    const clubId = getPendingWorld()!.leagueMembers.ENG1!.find((id) => getPendingWorld()!.clubs[id]!.name === 'Liverpool')!;
    await startCareer(clubId);
    expect(useGame.getState().hasWorld).toBe(true);
    expect(useGame.getState().slotName).toBe('Liverpool');
    expect(getPendingWorld()).toBeNull();
    expect(getWorld()!.dataPack?.id).toBe(REAL_CLUB_NAMES.id);
    const saved = names(getWorld()!);
    const slot = useGame.getState().activeSlot!;
    expect(useGame.getState().saveState.status).toBe('saved');

    closeCareer();
    expect(await loadSlot(slot)).toBe(true);
    expect(names(getWorld()!)).toEqual(saved);
    expect(names(getWorld()!)).toContain('Manchester City');
    expect(getWorld()!.dataPack).toEqual(info);
    expect(await saveNow()).toBe(true);
  }, 240000);

  it('a bad pack (text or object) fails with a precise DataPackError and leaves the pending world untouched', async () => {
    await generateWorldForSelection('pack-bad', 'compact');
    const pending = getPendingWorld()!;
    const snapshot = names(pending);
    const bad: [string, string | unknown, RegExp][] = [
      ['not json', '{nope', /not valid JSON/],
      ['wrong format', JSON.stringify({ format: 'other', version: 1 }), /not a Football Universe data pack/],
      ['remote crest', { ...REAL_CLUB_NAMES, leagues: { ENG1: [{ name: 'X', crest: 'https://example.com/a.png' }] } }, /ENG1\[0\]\.crest .*remote URLs are not allowed/],
      ['bad colour', { ...REAL_CLUB_NAMES, leagues: { ENG1: [{ name: 'X', colors: ['red', 'blue'] }] } }, /ENG1\[0\]\.colors/],
    ];
    for (const [label, input, re] of bad) {
      await expect(applyDataPackToPending(input as string | DataPack), label).rejects.toThrow(re);
      await expect(applyDataPackToPending(input as string | DataPack), label).rejects.toBeInstanceOf(DataPackError);
      expect(getPendingWorld(), label).toBe(pending); // same object, not even rebuilt
      expect(names(getPendingWorld()!), label).toEqual(snapshot);
      expect(useGame.getState().busy, label).toBeNull();
    }
    // a failed import after a good one keeps the good one
    await applyDataPackToPending(REAL_CLUB_NAMES);
    const good = getPendingWorld()!;
    await expect(applyDataPackToPending('{nope')).rejects.toThrow(DataPackError);
    expect(getPendingWorld()).toBe(good);
    expect(good.dataPack?.id).toBe(REAL_CLUB_NAMES.id);
  }, 240000);

  it('regenerating resets the pack', async () => {
    await generateWorldForSelection('pack-regen', 'compact');
    await applyDataPackToPending(REAL_CLUB_NAMES);
    expect(getPendingWorld()!.dataPack).toBeTruthy();
    await generateWorldForSelection('pack-regen', 'compact');
    expect(getPendingWorld()!.dataPack ?? null).toBeNull();
    expect(names(getPendingWorld()!)).not.toContain('Manchester City');
  }, 240000);

  it('a user pack with an embedded crest, coach and players is applied; crest is renderable only when local/embedded', async () => {
    const pack = parseDataPack(JSON.stringify({
      format: 'football-universe-data-pack', version: 1, id: 'test-pack', name: 'Test pack', source: 'unit test', licence: 'none',
      leagues: { ENG1: [{ name: 'Testville FC', crest: TINY_PNG, manager: { name: 'Pat Coach' }, players: [{ name: 'Sam Keeper', position: 'GK', overall: 80 }] }] },
    }));
    closeCareer(); // lookups prefer the loaded career's club records
    await generateWorldForSelection('pack-user', 'compact');
    const info = await applyDataPackToPending(pack);
    expect(info!.applied).toEqual({ clubs: 1, players: 1, managers: 1, crests: 1 });
    const w = getPendingWorld()!;
    const club = Object.values(w.clubs).find((c) => c.name === 'Testville FC')!;
    expect(clubCrestUri(club.id)).toBe(TINY_PNG);
    expect(Object.values(w.clubs).filter((c) => c.crest).length).toBe(1);
    expect(isRenderableCrest('https://example.com/a.png')).toBe(false);
    expect(isRenderableCrest('http://example.com/a.png')).toBe(false);
    expect(isRenderableCrest('asset:crests/a.png')).toBe(false); // falls back to the generated crest
    expect(isRenderableCrest('file:///data/user/crest.png')).toBe(true);
    expect(isRenderableCrest(TINY_PNG)).toBe(true);
    expect(clubCrestUri('nope')).toBeNull();

    // the crest, coach and player names survive start -> save -> reload
    await startCareer(club.id);
    const slot = useGame.getState().activeSlot!;
    closeCareer();
    expect(await loadSlot(slot)).toBe(true);
    const loaded = getWorld()!;
    expect(loaded.clubs[club.id]!.crest).toBe(TINY_PNG);
    expect(loaded.clubs[club.id]!.name).toBe('Testville FC');
    expect(loaded.dataPack?.id).toBe('test-pack');
    expect(clubCrestUri(club.id)).toBe(TINY_PNG);
    expect(Object.values(loaded.players).some((p) => p.name === 'Sam Keeper' && p.clubId === club.id)).toBe(true);
    expect(loaded.managers[loaded.clubs[club.id]!.managerId!]!.name).toBe('Pat Coach');
  }, 240000);

  it('applying without a pending world is refused', async () => {
    setPendingWorld(null);
    await expect(applyDataPackToPending(REAL_CLUB_NAMES)).rejects.toThrow('no generated world');
  });

  it('engine determinism: the same pack on the same seed gives the same world as the store path', () => {
    const a = createWorld(defaultWorldConfig('pack-det', 'compact'));
    const b = createWorld(defaultWorldConfig('pack-det', 'compact'));
    applyDataPack(a, REAL_CLUB_NAMES); applyDataPack(b, REAL_CLUB_NAMES);
    expect(names(a)).toEqual(names(b));
  }, 120000);
});
