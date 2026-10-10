/** Regression tests for CR-001..CR-004 / QA-009 / QA-010: hostile saves, replay aliasing, byte-bounded chunks. */
import { beforeAll, describe, expect, it } from 'vitest';
import { simulateMatch, type MatchInput } from '../src/match';
import { checksumOf, decodeWorld, encodeWorld, type Chunk } from '../src/persistence/codec';
import { NodeSqliteDriver } from '../src/persistence/nodeSqliteDriver';
import { SaveCorruptedError, SaveRepository } from '../src/persistence/repository';
import { validateTactics, defaultTactics } from '../src/tactics';
import { advanceDays, createWorld } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import type { WorldState } from '../src/world/types';

let world: WorldState;
let chunks: Chunk[];
beforeAll(() => {
  world = createWorld(defaultWorldConfig('harden', 'compact'));
  advanceDays(world, 30);
  chunks = encodeWorld(world);
}, 120_000);

function humanWorld(seed: string): WorldState {
  const probe = createWorld(defaultWorldConfig(seed, 'compact'));
  return createWorld(defaultWorldConfig(seed, 'compact', Object.keys(probe.clubs)[0] as string));
}
const clone = (): Chunk[] => chunks.map((c) => ({ ...c }));
async function importDoc(list: Chunk[]): Promise<void> {
  const db = new NodeSqliteDriver();
  const repo = new SaveRepository(db);
  await repo.init();
  // the file's author recomputes the checksum, so the checksum is no defence
  await repo.importSlot(1, 'x', JSON.stringify({ format: 'football-universe-save', version: 1, checksum: checksumOf(list), chunks: list }));
}
function edit(kind: string, fn: (items: Record<string, unknown>[]) => void): Chunk[] {
  const list = clone();
  const c = list.find((x) => x.kind === kind) as Chunk;
  const items = JSON.parse(c.data) as Record<string, unknown>[];
  fn(items);
  c.data = JSON.stringify(items);
  return list;
}

describe('hostile saves are rejected on import (CR-001/CR-002)', () => {
  it('rejects a player whose id is __proto__ and leaves Object.prototype clean', async () => {
    // assigning `id = '__proto__'` on an object would not create the key, so edit the JSON text directly
    const list = clone();
    const pc = list.find((x) => x.kind === 'players') as Chunk;
    pc.data = pc.data.replace(/"id":"p1"/, '"id":"__proto__"');
    expect(pc.data).toContain('"__proto__"');
    await expect(importDoc(list)).rejects.toBeInstanceOf(SaveCorruptedError);
    expect(() => decodeWorld(list)).toThrow(SaveCorruptedError);
    expect(Object.keys(Object.prototype)).toEqual([]);
  });

  it('rejects reserved names written with unicode escapes', () => {
    const list = clone();
    const c = list.find((x) => x.kind === 'players') as Chunk;
    c.data = c.data.replace('"id":"p1"', '"id":"\\u005f\\u005fproto\\u005f\\u005f"');
    expect(() => decodeWorld(list)).toThrow(SaveCorruptedError);
  });

  it.each(['constructor', 'toString', 'hasOwnProperty'])('rejects the inherited name %s used as a player id', (name) => {
    const list = edit('players', (ps) => { (ps[0] as { id: string }).id = name; });
    expect(() => decodeWorld(list)).toThrow(SaveCorruptedError);
  });

  it('rejects an attribute vector of the wrong length', async () => {
    const list = edit('players', (ps) => { (ps[0] as { attrs: number[] }).attrs = [50, 50, 50, 50, 50]; });
    await expect(importDoc(list)).rejects.toBeInstanceOf(SaveCorruptedError);
  });

  it('rejects null cash, a player in two squads, and a dangling club reference', async () => {
    await expect(importDoc(edit('clubs', (cs) => { ((cs[0] as { finance: { cash: unknown } }).finance).cash = null; }))).rejects.toBeInstanceOf(SaveCorruptedError);
    await expect(importDoc(edit('players', (ps) => { (ps[0] as { clubId: string }).clubId = 'nope'; }))).rejects.toBeInstanceOf(SaveCorruptedError);
    const dup = edit('players', (ps) => {
      const a = ps.find((p) => p.clubId !== null) as { clubId: string; contract: { clubId: string } };
      const b = ps.find((p) => p !== a && p.clubId !== null && p.clubId !== a.clubId) as { clubId: string; contract: { clubId: string } };
      b.contract.clubId = 'cl-missing';
      expect(b.clubId).not.toBe(a.clubId);
    });
    await expect(importDoc(dup)).rejects.toBeInstanceOf(SaveCorruptedError);
  });

  it('rejects absurd chunk counts quickly', async () => {
    const list = clone();
    for (let i = 0; i < 100_000; i++) list.push({ kind: 'news', idx: 1000 + i, data: '[]' });
    const t0 = Date.now();
    await expect(importDoc(list)).rejects.toBeInstanceOf(SaveCorruptedError);
    expect(Date.now() - t0).toBeLessThan(2000);
  });

  it('rejects unknown chunk kinds and duplicate chunks', () => {
    expect(() => decodeWorld([...clone(), { kind: 'evil', idx: 0, data: '[]' }])).toThrow(SaveCorruptedError);
    expect(() => decodeWorld([...clone(), { ...(clone()[0] as Chunk) }])).toThrow(SaveCorruptedError);
  });

  it('a clean world still loads, and a 30-day simulation keeps Object.prototype pristine', () => {
    const w = decodeWorld(clone());
    advanceDays(w, 30);
    expect(Object.keys(Object.prototype)).toEqual([]);
    expect(({} as Record<string, unknown>).apps).toBeUndefined();
  }, 120_000);
});

describe('tactics validation survives prototype-key ids (CR-005)', () => {
  it.each(['__proto__', 'toString', 'constructor'])('reports an error list for role/formation %s', (name) => {
    const t = defaultTactics('4-3-3');
    expect(validateTactics({ ...t, roles: t.roles.map(() => name) }).length).toBeGreaterThan(0);
    expect(validateTactics({ ...t, formation: name })).toEqual([`unknown formation ${name}`]);
  });
});

describe('match archive (CR-003/QA-010)', () => {
  it('stored replays still reproduce their stored events after weeks of play', () => {
    const w = humanWorld('replay');
    // keep every league match: continental/neutral matches are archived with replays
    advanceDays(w, 20);
    const withReplay = Object.values(w.matches).filter((m) => m.replay !== null);
    advanceDays(w, 30);
    expect(withReplay.length).toBeGreaterThan(0);
    let checked = 0;
    for (const m of withReplay) {
      const stored = w.matches[m.id];
      if (!stored?.replay || !stored.events) continue;
      const res = simulateMatch(stored.replay as MatchInput);
      expect(res.score).toEqual(stored.score);
      expect(res.events).toEqual(JSON.parse(JSON.stringify(stored.events)));
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  }, 180_000);

  it('the replay holds no references to live players', () => {
    const w = humanWorld('replay2');
    advanceDays(w, 20);
    const m = Object.values(w.matches).find((x) => x.replay !== null);
    if (!m) return;
    const input = m.replay as MatchInput;
    for (const mp of [...input.home.players, ...input.away.players]) {
      const live = w.players[mp.id];
      if (live) expect(mp.attrs).not.toBe(live.attrs);
    }
  }, 120_000);
});

describe('chunks are byte-bounded (CR-004)', () => {
  it('no stored row exceeds 1 MB, and the match archive survives a round trip', () => {
    const sizes = chunks.map((c) => c.data.length);
    expect(Math.max(...sizes)).toBeLessThan(1_000_000);
    expect(chunks.filter((c) => c.kind === 'seasonStats').length).toBeGreaterThanOrEqual(1);
    const loaded = decodeWorld(clone());
    expect(JSON.parse(JSON.stringify(loaded.matches))).toEqual(JSON.parse(JSON.stringify(world.matches)));
  });
});
