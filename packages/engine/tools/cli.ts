/**
 * Football Universe CLI — run the world headlessly.
 *   npm run sim -- --seed abc --preset compact --seasons 3 --leagues ENG1,SAU1 --save career.sqlite
 *   npm run sim -- --load career.sqlite --seasons 2
 *   npm run sim -- --seed abc --replay <fixtureId>   (re-simulates a stored match from its saved input)
 */
import { NodeSqliteDriver } from '../src/persistence/nodeSqliteDriver';
import { SaveRepository } from '../src/persistence/repository';
import { createWorld, advanceToEndOfSeason } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { validateWorld } from '../src/world/invariants';
import { leagueTableView, recordsView, statLeaders } from '../src/world/views';
import { simulateMatch } from '../src/match';
import type { WorldState } from '../src/world/types';

function arg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}

async function main(): Promise<void> {
  const savePath = arg('save');
  const loadPath = arg('load');
  const seasons = Number(arg('seasons', '1'));
  let world: WorldState;
  if (loadPath) {
    const repo = new SaveRepository(new NodeSqliteDriver(loadPath));
    await repo.init();
    const slot = (await repo.listSlots())[0];
    if (!slot) throw new Error(`no save found in ${loadPath}`);
    const loaded = await repo.load(slot.slot);
    world = loaded.world;
    console.log(`Loaded "${slot.name}" (season ${world.season}, day ${world.day}, revision ${loaded.revision}${loaded.recoveredFromFallback ? ', RECOVERED FROM FALLBACK' : ''})`);
  } else {
    const cfg = defaultWorldConfig(arg('seed', 'cli') as string, (arg('preset', 'compact') as 'compact' | 'standard'));
    const leagues = arg('leagues');
    if (leagues) cfg.leagues = leagues.split(',');
    const t0 = performance.now();
    world = createWorld(cfg);
    console.log(`Created ${cfg.preset} world: ${Object.keys(world.clubs).length} clubs, ${Object.keys(world.players).length} players, ${Object.keys(world.competitions).length} competitions (${Math.round(performance.now() - t0)} ms)`);
  }
  const replayId = arg('replay');
  for (let s = 0; s < seasons; s++) {
    const t0 = performance.now();
    const reports = advanceToEndOfSeason(world);
    const matches = reports.reduce((a, r) => a + r.matches.length, 0);
    const sum = world.history.seasons.at(-1)!;
    console.log(`\nSeason ${sum.season}: ${matches} matches in ${((performance.now() - t0) / 1000).toFixed(1)} s`);
    for (const [cid, h] of Object.entries(sum.champions)) {
      if (['UCL', 'ACLE', 'CAFCL', 'CCC', 'COPA', 'OCL', 'CWC'].includes(cid) || cid.endsWith('1')) {
        console.log(`  ${cid.padEnd(6)} champion: ${world.clubs[h.winner ?? '']?.name ?? '-'}`);
      }
    }
  }
  const lead = Object.keys(world.competitions).find((c) => c.endsWith('1'));
  if (lead) {
    console.log(`\nCurrent ${lead} standings`);
    for (const r of leagueTableView(world, lead).slice(0, 5)) console.log(`  ${String(r.position).padStart(2)} ${r.clubName.padEnd(28)} ${r.points} pts (${r.won}-${r.drawn}-${r.lost})`);
    console.log('  top scorers:', statLeaders(world, lead, 'goals', 3).map((x) => `${x.player} ${x.value}`).join(', '));
  }
  console.log('\nHonours so far:', recordsView(world).clubHonours.slice(0, 3).map((h) => `${h.club} ${h.titles}`).join(', '));
  const bad = validateWorld(world, { checkLedger: true }).filter((v) => v.severity !== 'medium');
  console.log(bad.length === 0 ? 'Integrity check: OK' : `Integrity check: ${bad.length} violations\n${bad.slice(0, 5).map((b) => `  ${b.code}: ${b.message}`).join('\n')}`);
  if (replayId) {
    const m = world.matches[replayId];
    if (!m?.replay) console.log(`No replay input retained for ${replayId}`);
    else {
      const again = simulateMatch(m.replay as Parameters<typeof simulateMatch>[0]);
      console.log(`Replay ${replayId}: ${again.score.home}-${again.score.away} (stored ${m.score.home}-${m.score.away}) — ${again.score.home === m.score.home && again.score.away === m.score.away ? 'IDENTICAL' : 'MISMATCH'}`);
    }
  }
  if (savePath) {
    const repo = new SaveRepository(new NodeSqliteDriver(savePath));
    await repo.init();
    const info = await repo.save(1, 'CLI career', world);
    console.log(`Saved to ${savePath}: ${(info.bytes / 1e6).toFixed(1)} MB, revision ${info.revision}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
