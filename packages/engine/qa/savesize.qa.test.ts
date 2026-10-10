/**
 * QA area 6: save size / save time of a full compact world (32 leagues, 250 clubs) after one season.
 * Observed: 40.5 MB, of which 31.7 MB (78%) is the match archive (540 retained matches x ~58 KB: events + full replay input + player lines).
 */
import { describe, expect, it } from 'vitest';
import { SaveRepository, advanceToEndOfSeason, createWorld, defaultWorldConfig } from '../src/index';
import { NodeSqliteDriver } from '../src/persistence/nodeSqliteDriver';
import { encodeWorld } from '../src/persistence/codec';

describe('save size of a full compact world after one season', () => {
  const w = createWorld(defaultWorldConfig('qa-big', 'compact'));
  advanceToEndOfSeason(w);
  const chunks = encodeWorld(w);
  const bytes = (kind: string): number => chunks.filter((c) => c.kind === kind).reduce((a, c) => a + c.data.length, 0);
  const total = chunks.reduce((a, c) => a + c.data.length, 0);

  it('[QA-014] the match archive is at most 40% of the save (replay inputs are stored in full for every continental/neutral match)', () => {
    expect(bytes('matches') / total, `matches=${(bytes('matches') / 1e6).toFixed(1)}MB of ${(total / 1e6).toFixed(1)}MB`).toBeLessThan(0.4);
  });
  it('a full save and a load finish in under 5 s each (verified OK: ~1 s on node:sqlite)', async () => {
    const repo = new SaveRepository(new NodeSqliteDriver());
    await repo.init();
    let t = performance.now();
    await repo.save(1, 'big', w);
    expect(performance.now() - t).toBeLessThan(5000);
    t = performance.now();
    await repo.load(1);
    expect(performance.now() - t).toBeLessThan(5000);
  }, 120000);
});
