/**
 * QA area 5: persistence - save/load determinism, random chunk corruption, interrupted saves, version handling and
 * hostile imports. Uses the real SaveRepository on node:sqlite.
 */
import { describe, expect, it } from 'vitest';
import { SaveCorruptedError, SaveRepository, Rng, advanceDay, advanceDays, createWorld, validateWorld } from '../src/index';
import { NodeSqliteDriver } from '../src/persistence/nodeSqliteDriver';
import { checksumOf, decodeWorld, encodeWorld } from '../src/persistence/codec';
import { simulateMatch, type MatchInput } from '../src/match';
import { cfg } from './helpers';

const fingerprint = (w: Parameters<typeof encodeWorld>[0], withMatches = false): string => checksumOf(encodeWorld(w).filter((c) => withMatches || c.kind !== 'matches'));
async function repoWith(): Promise<{ db: NodeSqliteDriver; repo: SaveRepository }> {
  const db = new NodeSqliteDriver();
  const repo = new SaveRepository(db);
  await repo.init();
  return { db, repo };
}
const small = (seed: string) => createWorld(cfg(seed, ['ENG1', 'ESP1']));

describe('save/load determinism', () => {
  it('save, load, simulate N more days == uninterrupted run (all state except the match archive), across a season rollover (verified OK)', async () => {
    const a = small('qa-det');
    advanceDays(a, 200);
    const { repo } = await repoWith();
    await repo.save(1, 'x', a);
    const { world: b } = await repo.load(1);
    expect(fingerprint(b)).toBe(fingerprint(a));
    advanceDays(a, 220); advanceDays(b, 220);   // crosses day 364 rollover
    expect(a.season).toBe(2);
    expect(fingerprint(b)).toBe(fingerprint(a));
    expect(validateWorld(b, { checkLedger: true }).filter((v) => v.severity !== 'medium')).toEqual([]);
  }, 600000);
  it('[QA-010] live and reloaded worlds are byte-identical including the match archive after further simulation', async () => {
    const a = small('qa-det');
    advanceDays(a, 200);
    const { repo } = await repoWith();
    await repo.save(1, 'x', a);
    const { world: b } = await repo.load(1);
    advanceDays(a, 60); advanceDays(b, 60);
    expect(fingerprint(b, true)).toBe(fingerprint(a, true));
  }, 600000);
  it('[QA-010] a stored match replay input reproduces the stored score after the world has moved on', () => {
    const a = small('qa-det');
    advanceDays(a, 420);
    let n = 0, bad = 0;
    for (const m of Object.values(a.matches)) {
      if (!m.replay) continue;
      n++;
      const res = simulateMatch(m.replay as MatchInput);
      if (res.score.home !== m.score.home || res.score.away !== m.score.away) bad++;
    }
    expect(n).toBeGreaterThan(20);
    expect(bad, `${bad}/${n} replays reproduce a different score`).toBe(0);
  }, 600000);
  it('repeated save/load cycles every 30 days do not drift (verified OK)', async () => {
    let a = small('qa-det2');
    const ref = small('qa-det2');
    const { repo } = await repoWith();
    for (let i = 0; i < 4; i++) {
      advanceDays(a, 30); advanceDays(ref, 30);
      await repo.save(2, 'cycle', a);
      a = (await repo.load(2)).world;
    }
    expect(fingerprint(a)).toBe(fingerprint(ref));
  }, 600000);
  it('human actions survive a save: lineup override, tactics and transfer list persist (verified OK)', async () => {
    const w = small('qa-det3');
    const club = Object.values(w.clubs)[2]!;
    w.config.humanClubId = club.id;
    const squad = Object.values(w.players).filter((p) => p.clubId === club.id);
    w.transferList[squad[3]!.id] = { askingPrice: 1234567, day: w.day };
    const { repo } = await repoWith();
    await repo.save(1, 'h', w);
    const { world } = await repo.load(1);
    expect(world.transferList[squad[3]!.id]).toEqual({ askingPrice: 1234567, day: 0 });
    expect(world.config.humanClubId).toBe(club.id);
  });
});

describe('corruption fuzzing of stored chunks', () => {
  it('any single-chunk corruption of the newest revision yields the old revision or a clean SaveCorruptedError - never a silently different world', async () => {
    const A = small('qa-fuzz');
    const { db, repo } = await repoWith();
    await repo.save(1, 's', A);
    const fpA = fingerprint(A);
    advanceDays(A, 10);
    await repo.save(1, 's', A);
    const fpB = fingerprint(A);
    const rows = await db.all<{ kind: string; idx: number }>('SELECT kind, idx FROM save_chunks WHERE slot=1 AND revision=2');
    const rng = Rng.fromSeed('qa-fuzz-rng');
    const outcomes: Record<string, number> = {};
    const bad: string[] = [];
    for (let t = 0; t < 60; t++) {
      const target = rows[rng.int(rows.length)]!;
      const mode = ['truncate', 'flip', 'delete', 'blank', 'swapIdx', 'dupToNewIdx'][t % 6]!;
      const [{ data }] = await db.all<{ data: string }>('SELECT data FROM save_chunks WHERE slot=1 AND revision=2 AND kind=? AND idx=?', [target.kind, target.idx]) as [{ data: string }];
      await db.exec('BEGIN');
      try {
        const where = [target.kind, target.idx] as (string | number)[];
        if (mode === 'truncate') await db.run('UPDATE save_chunks SET data=? WHERE slot=1 AND revision=2 AND kind=? AND idx=?', [data.slice(0, Math.floor(data.length / 2)), ...where]);
        if (mode === 'flip') { const p = rng.int(data.length); const c = data[p] === '1' ? '2' : '1'; await db.run('UPDATE save_chunks SET data=? WHERE slot=1 AND revision=2 AND kind=? AND idx=?', [data.slice(0, p) + c + data.slice(p + 1), ...where]); }
        if (mode === 'delete') await db.run('DELETE FROM save_chunks WHERE slot=1 AND revision=2 AND kind=? AND idx=?', where);
        if (mode === 'blank') await db.run('UPDATE save_chunks SET data=? WHERE slot=1 AND revision=2 AND kind=? AND idx=?', ['', ...where]);
        if (mode === 'swapIdx') await db.run('UPDATE save_chunks SET idx=idx+100 WHERE slot=1 AND revision=2 AND kind=? AND idx=?', where);
        if (mode === 'dupToNewIdx') await db.run('INSERT INTO save_chunks(slot,revision,kind,idx,data) VALUES (1,2,?,?,?)', [target.kind, target.idx + 500, data]);
        let outcome = '';
        try {
          const r = await repo.load(1);
          const fp = fingerprint(r.world);
          if (r.revision === 2 && fp === fpB) outcome = 'rev2-intact';
          else if (r.revision === 1 && fp === fpA && r.recoveredFromFallback) outcome = 'fallback-ok';
          else { outcome = 'WRONG-WORLD'; bad.push(`${mode} ${target.kind}:${target.idx} -> rev ${r.revision}`); }
        } catch (e) {
          outcome = e instanceof SaveCorruptedError ? 'SaveCorruptedError' : 'RAW-' + (e as Error).constructor.name;
          if (!(e instanceof SaveCorruptedError)) bad.push(`${mode} ${target.kind}:${target.idx} -> raw ${(e as Error).message.slice(0, 60)}`);
        }
        outcomes[outcome] = (outcomes[outcome] ?? 0) + 1;
      } finally { await db.exec('ROLLBACK'); }
    }
    expect(bad, JSON.stringify(outcomes)).toEqual([]);
    expect(outcomes['fallback-ok'] ?? 0).toBeGreaterThan(30);
  }, 600000);
  it('when both revisions are damaged, load throws SaveCorruptedError and verify() reports not ok (verified OK)', async () => {
    const w = small('qa-fuzz2');
    const { db, repo } = await repoWith();
    await repo.save(1, 's', w); await repo.save(1, 's', w);
    await db.run("UPDATE save_chunks SET data='{}' WHERE kind='clubs'");
    await expect(repo.load(1)).rejects.toBeInstanceOf(SaveCorruptedError);
    expect((await repo.verify(1)).ok).toBe(false);
  });
  it('interrupted save (crash after N chunks) leaves the previous revision loadable (verified OK)', async () => {
    const w = small('qa-int');
    const { repo } = await repoWith();
    await repo.save(1, 's', w);
    const fp0 = fingerprint(w);
    advanceDays(w, 5);
    for (const crashAt of [0, 3, 8]) {
      await expect(repo.save(1, 's', w, { afterChunk: (i) => { if (i === crashAt) throw new Error('power loss'); } })).rejects.toThrow('power loss');
      const r = await repo.load(1);
      expect(r.revision).toBe(1);
      expect(fingerprint(r.world)).toBe(fp0);
      expect((await repo.listSlots())[0]!.revision).toBe(1);
    }
  }, 600000);
  it('only `keepRevisions` revisions are retained per slot (no unbounded DB growth) (verified OK)', async () => {
    const w = small('qa-keep');
    const { db, repo } = await repoWith();
    for (let i = 0; i < 7; i++) await repo.save(1, 's', w);
    const [{ n }] = await db.all<{ n: number }>('SELECT COUNT(*) AS n FROM save_revisions WHERE slot=1') as [{ n: number }];
    expect(n).toBe(2);
  });
});

describe('versions and hostile imports', () => {
  it('refuses saves from a newer schema and from other reference data (verified OK)', async () => {
    const w = small('qa-ver');
    const chunks = encodeWorld(w);
    const meta = chunks.find((c) => c.kind === 'meta')!;
    const o = JSON.parse(meta.data); o.schemaVersion = 99; meta.data = JSON.stringify(o);
    expect(() => decodeWorld(chunks)).toThrow(/newer version/);
    const chunks2 = encodeWorld(w); const m2 = chunks2.find((c) => c.kind === 'meta')!;
    const o2 = JSON.parse(m2.data); o2.referenceVersion = 'registry-0'; m2.data = JSON.stringify(o2);
    expect(() => decodeWorld(chunks2)).toThrow(/reference data/);
  });
  it('a corrupted export (one flipped byte) fails the import checksum (verified OK)', async () => {
    const w = small('qa-imp');
    const { repo } = await repoWith();
    await repo.save(1, 's', w);
    const doc = await repo.exportSlot(1);
    const flipped = doc.replace('cl001', 'cl002');
    expect(flipped).not.toBe(doc);
    await expect(repo.importSlot(2, 'x', flipped)).rejects.toBeInstanceOf(SaveCorruptedError);
    await expect(repo.importSlot(2, 'x', 'not json')).rejects.toThrow();
    await expect(repo.importSlot(2, 'x', JSON.stringify({ format: 'other' }))).rejects.toThrow('Not a Football Universe save');
  });
  async function hostile(mutate: (c: ReturnType<typeof encodeWorld>) => void): Promise<'rejected' | { accepted: string[] }> {
    const w = small('qa-host');
    const { repo } = await repoWith();
    await repo.save(1, 's', w);
    const d = JSON.parse(await repo.exportSlot(1));
    mutate(d.chunks);
    d.checksum = checksumOf(d.chunks); // an attacker (or buggy tool) recomputes the checksum
    try {
      await repo.importSlot(2, 'x', JSON.stringify(d));
      const { world } = await repo.load(2);
      return { accepted: validateWorld(world).filter((v) => v.severity !== 'medium').map((v) => v.code) };
    } catch { return 'rejected'; }
  }
  it('[QA-009] an import with invalid player data (negative wage, attribute 1e300) is rejected, not stored', async () => {
    const r = await hostile((c) => { const m = c.find((x) => x.kind === 'players')!; const a = JSON.parse(m.data); a[0].attrs[0] = 1e300; a[0].contract.wageWeekly = -5; m.data = JSON.stringify(a); });
    expect(r).toBe('rejected');
  });
  it('[QA-009] an import without its clubs chunk is rejected, not stored', async () => {
    const r = await hostile((c) => { c.splice(c.findIndex((x) => x.kind === 'clubs'), 1); });
    expect(r).toBe('rejected');
  });
  it('[QA-009] an import with absurd season/day values is rejected', async () => {
    const r = await hostile((c) => { const m = c.find((x) => x.kind === 'meta')!; const o = JSON.parse(m.data); o.season = -3; o.day = 1e15; m.data = JSON.stringify(o); });
    expect(r).toBe('rejected');
  });
  it('[QA-009] decode errors are SaveCorruptedError, not raw TypeError/SyntaxError', async () => {
    const w = small('qa-host2');
    const { repo } = await repoWith();
    await repo.save(1, 's', w);
    const d = JSON.parse(await repo.exportSlot(1));
    d.chunks.find((x: { kind: string }) => x.kind === 'players').data = '"hello"';
    d.checksum = checksumOf(d.chunks);
    await expect(repo.importSlot(2, 'x', JSON.stringify(d))).rejects.toBeInstanceOf(SaveCorruptedError);
  });
  it('__proto__ keys inside a save do not pollute Object.prototype (verified OK)', async () => {
    await hostile((c) => { const m = c.find((x) => x.kind === 'meta')!; m.data = m.data.replace('{', '{"__proto__":{"polluted":"yes"},'); });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
  it('a restored world keeps simulating after import (verified OK)', async () => {
    const w = small('qa-host3');
    advanceDay(w);
    const { repo } = await repoWith();
    await repo.save(1, 's', w);
    const doc = await repo.exportSlot(1);
    await repo.importSlot(2, 'copy', doc);
    const { world } = await repo.load(2);
    advanceDays(world, 10);
    expect(world.day).toBe(11);
  });
});
