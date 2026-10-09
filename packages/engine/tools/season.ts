import { createWorld, advanceToEndOfSeason } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { mean } from '../src/math';
const preset = (process.argv[2] ?? 'compact') as 'compact' | 'standard';
const seasons = Number(process.argv[3] ?? 1);
const t0 = performance.now();
const w = createWorld(defaultWorldConfig('season-test', preset));
console.log('created in', Math.round(performance.now() - t0), 'ms; comps', Object.keys(w.competitions).length, 'clubs', Object.keys(w.clubs).length, 'players', Object.keys(w.players).length);
for (let s = 0; s < seasons; s++) {
  const t1 = performance.now();
  let matches = 0;
  const reports = advanceToEndOfSeason(w);
  for (const r of reports) matches += r.matches.length;
  const sum = w.history.seasons.at(-1)!;
  console.log(`season ${sum.season}: ${matches} matches in ${((performance.now() - t1) / 1000).toFixed(1)}s (${((performance.now() - t1) / matches).toFixed(2)} ms/match)`);
  for (const lid of ['ENG1', 'SAU1', 'USA1']) {
    const t = sum.tables[lid]; if (!t) continue;
    const comp = w.history.champions[lid]?.[sum.season];
    console.log(' ', lid, 'champion', w.clubs[comp?.winner ?? '']?.name, 'top3', t.slice(0, 3).map((c) => w.clubs[c]!.shortName).join(','), 'bottom', t.slice(-2).map((c) => w.clubs[c]!.shortName).join(','));
  }
  console.log('  champions:', Object.entries(sum.champions).filter(([k]) => ['UCL', 'ACLE', 'CAFCL', 'COPA', 'CCC', 'OCL', 'UEL', 'UECL'].includes(k)).map(([k, v]) => `${k}:${w.clubs[v.winner ?? '']?.shortName}`).join(' '));
}
console.log('news', w.news.length, 'transfers', w.transfers.length, 'day', w.day, 'season', w.season);
void mean;
