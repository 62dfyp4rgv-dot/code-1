// Gauntlet round runner.
//   node tools/gauntlet.js --round N [--quick] [--e2e] [--changes "a; b"] [--targets "what this round aimed at"]
// Collects metrics from real tests/sims/audits, scores the 12 categories (tools/rubric.js), compares with the
// previous round (regressions), picks the weakest subsystem, and writes:
//   docs/gauntlet/round-NN.json / .md, docs/DEVELOPMENT_LEDGER.md (append), docs/CHECKPOINT.json (resume point).
import fs from 'node:fs';
import path from 'node:path';
import * as M from './metrics.js';
import { score, worstCriteria, CATEGORIES, CATEGORY_LABELS } from './rubric.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const arg = (k, d = null) => { const i = process.argv.indexOf(`--${k}`); return i < 0 ? d : (process.argv[i + 1]?.startsWith('--') || process.argv[i + 1] == null ? true : process.argv[i + 1]); };
const round = +arg('round', 1);
const quick = !!arg('quick', false);
const rr = String(round).padStart(2, '0');
const dir = path.join(root, 'docs/gauntlet');
fs.mkdirSync(dir, { recursive: true });

const t0 = Date.now();
const log = (m) => console.log(`[round ${round}] ${m} (+${((Date.now() - t0) / 1000).toFixed(0)}s)`);

log('running test suite'); const tests = M.runTests();
log(`tests ${tests.pass}/${tests.total}`);
log('match metrics'); const match = M.matchMetrics({ n: quick ? 30 : 60 });
log('universe metrics'); const universe = M.universeMetrics();
log('career metrics'); const career = M.careerMetrics({ quick });
log('scenario/achievement metrics'); const scenario = M.scenarioMetrics(); const ach = M.achievementMetrics();
const save = await M.saveMetrics(career.reps[0]._game);
log('ui metrics'); const ui = M.uiMetrics({ runE2E: !!arg('e2e', false) });
const reviews = M.reviewMetrics();
const review = reviews && reviews.rounds?.length ? { latest: reviews.rounds[reviews.rounds.length - 1].scores, all: reviews.rounds } : null;
const features = M.featureReport();

for (const r of career.reps) delete r._game;
const metrics = { tests, match, universe, career, scenario, ach, ui, save, review, features };
const res = score(metrics);
const worst = worstCriteria(res, 10);

// ---- compare with previous round
let prev = null;
const prevFile = path.join(dir, `round-${String(round - 1).padStart(2, '0')}.json`);
if (round > 1 && fs.existsSync(prevFile)) prev = JSON.parse(fs.readFileSync(prevFile, 'utf8'));
const regressions = [], improvements = [];
if (prev) for (const c of CATEGORIES) {
  const d = +(res.categories[c].score - prev.scores.categories[c].score).toFixed(2);
  if (d <= -0.15) regressions.push({ category: c, delta: d });
  if (d >= 0.15) improvements.push({ category: c, delta: d });
}
if (prev && tests.pass < prev.metrics.tests.pass) regressions.push({ category: 'tests', delta: tests.pass - prev.metrics.tests.pass });

const record = {
  round, at: new Date().toISOString(), quick, targets: arg('targets', '') === true ? '' : arg('targets', ''), changes: String(arg('changes', '')).split(';').map((s) => s.trim()).filter(Boolean),
  elapsedSec: Math.round((Date.now() - t0) / 1000), scores: res, weakest: res.weakest, worstCriteria: worst.map((w) => ({ cat: w.cat, id: w.id, label: w.label, value: w.value, score: w.score, loss: +w.loss.toFixed(2), status: w.status })),
  regressions, improvements, metrics: {
    tests, match: { ...match, types: Object.fromEntries(Object.entries(match.types).map(([k, v]) => [k, { n: v.n, invalid: v.invalid, draws: v.draws, finishes: v.finishes }])), singles: { ...match.singles, ratings: undefined } },
    universe, career: { ...career, reps: career.reps.map(({ snap, ...r }) => ({ ...r, snap })) }, scenario: { ...scenario, byCategory: undefined }, ach, ui, save, review: review && { latest: review.latest }, features: { complete: features.complete, partial: features.partial, unimplemented: features.unimplemented, total: features.total },
  },
};
fs.writeFileSync(path.join(dir, `round-${rr}.json`), JSON.stringify(record, null, 1));

// ---- markdown report
const L = [];
L.push(`# Gauntlet Round ${round}`, '', `Generated ${record.at} in ${record.elapsedSec}s${quick ? ' (quick mode: reduced samples)' : ''}. All scores are computed by \`tools/rubric.js\` from measurements in this run.`, '');
if (record.targets) L.push(`**Round target:** ${record.targets}`, '');
if (record.changes.length) { L.push('**Changes made before this measurement:**', ...record.changes.map((c) => `- ${c}`), ''); }
L.push('## Scores', '', '| Category | Score | Delta | Unverified | Unimplemented |', '|---|---:|---:|---:|---:|');
for (const c of CATEGORIES) {
  const d = prev ? res.categories[c].score - prev.scores.categories[c].score : null;
  L.push(`| ${CATEGORY_LABELS[c]} | ${res.categories[c].score.toFixed(2)} | ${d == null ? '-' : (d >= 0 ? '+' : '') + d.toFixed(2)} | ${res.categories[c].unverified} | ${res.categories[c].unimplemented} |`);
}
L.push(`| **Mean** | **${res.mean.toFixed(2)}** | | | |`, '', `Categories at >= 9.0: **${res.reached9}/12**. Lowest: ${res.weakest.map((w) => `${CATEGORY_LABELS[w.cat]} (${w.score.toFixed(2)})`).join(', ')}.`, '');
L.push('## Weakest subsystem and biggest score losses', '', '| Category | Criterion | Value | Score | Weighted loss | Status |', '|---|---|---|---:|---:|---|');
for (const w of record.worstCriteria) L.push(`| ${CATEGORY_LABELS[w.cat]} | ${w.label} | ${String(w.value).replace(/\|/g, '/')} | ${w.score.toFixed(2)} | ${w.loss} | ${w.status} |`);
L.push('');
if (regressions.length) L.push('## Regressions vs previous round', '', ...regressions.map((r) => `- **${r.category}**: ${r.delta}`), '');
else if (prev) L.push('## Regressions vs previous round', '', 'None (no category dropped by 0.15 or more; test count did not fall).', '');
if (improvements.length) L.push('## Improvements', '', ...improvements.map((r) => `- ${CATEGORY_LABELS[r.category]}: +${r.delta}`), '');
L.push('## Evidence', '', `- Tests: ${tests.pass}/${tests.total} passing${tests.failed.length ? ` — FAILED: ${tests.failed.join('; ')}` : ''}.`);
const types = Object.values(match.types);
L.push(`- Match sims: ${types.reduce((a, t) => a + t.n, 0)} across ${types.length} types, ${types.reduce((a, t) => a + t.invalid, 0)} invalid; singles finishers/match ${match.singles.finishersPerMatch.toFixed(2)}, mean rating ${match.singles.ratingMean.toFixed(2)}★ (σ ${match.singles.ratingStd.toFixed(2)}), avg ${match.singles.avgMins.toFixed(1)} min.`);
L.push(`- Draw rates: ${Object.entries(match.types).map(([k, t]) => `${k} ${(100 * t.draws / Math.max(1, t.n)).toFixed(0)}%`).join(', ')}.`);
L.push(`- Skill gap: smart beats random ${(match.skillGap * 100).toFixed(0)}% of matches; mirror side balance ${(match.mirrorShare * 100).toFixed(1)}%.`);
L.push(`- Careers: ${career.reps.length} × ~${career.years} years; crashes ${career.reps.reduce((a, r) => a + r.errors.length, 0)}, audit problems ${career.reps.reduce((a, r) => a + r.audit.length, 0)}; scenarios shown ${career.reps.reduce((a, r) => a + r.scenarios, 0)} (${Object.keys(career.scenarioCounts).length} distinct templates), recall share ${(career.recallShare * 100).toFixed(0)}%.`);
L.push(`- Universe: deterministic=${universe.deterministic}, lineage problems ${universe.lineageProblems}, ${Math.round(universe.msPerYear)} ms per simulated year, stats(1998 start) ${JSON.stringify(universe.stats.a)}, stats(2024 start) ${JSON.stringify(universe.stats.b)}.`);
L.push(`- Scenarios: ${scenario.authored} authored templates, ${scenario.configs} validated configurations (reported separately), ${scenario.errors} validator errors.`);
L.push(`- Achievements: ${ach.provable}/${ach.total} provable by synthesised legal sequences; Record Book evidence coverage ${career.recordBookCoverage == null ? 'n/a' : (career.recordBookCoverage * 100).toFixed(1) + '%'}.`);
L.push(`- UI: ${ui.e2e ? `e2e ${ui.e2e.passed}/${ui.e2e.total} (from ${ui.e2e.at})` : 'e2e not run this round'}; screens ${ui.screens.found}/${ui.screens.total}; bundle ${ui.bundleBytes ? Math.round(ui.bundleBytes / 1024) + ' KB' : 'missing'}.`);
L.push(`- Features: ${features.complete} complete / ${features.partial} partial / ${features.unimplemented} unimplemented of ${features.total}.`, '');
L.push('## Criteria detail', '');
for (const c of CATEGORIES) {
  L.push(`### ${CATEGORY_LABELS[c]} — ${res.categories[c].score.toFixed(2)}`, '', '| Criterion | Weight | Value | Score | Status |', '|---|---:|---|---:|---|');
  for (const k of res.categories[c].criteria) L.push(`| ${k.label} | ${k.weight} | ${String(k.value).replace(/\|/g, '/')} | ${k.score.toFixed(2)} | ${k.status} |`);
  L.push('');
}
fs.writeFileSync(path.join(dir, `round-${rr}.md`), L.join('\n'));

// ---- development ledger (append once per round; replace if re-run)
const ledgerFile = path.join(root, 'docs/DEVELOPMENT_LEDGER.md');
let ledger = fs.existsSync(ledgerFile) ? fs.readFileSync(ledgerFile, 'utf8') : '# Development Ledger\n\nOne entry per Gauntlet round: what was targeted, what changed, what was measured. Scores come from tools/rubric.js.\n';
const marker = `\n## Round ${round}\n`;
const idx = ledger.indexOf(marker);
if (idx >= 0) { const next = ledger.indexOf('\n## Round ', idx + marker.length); ledger = ledger.slice(0, idx) + (next >= 0 ? ledger.slice(next) : ''); }
ledger += `${marker}\n- Target: ${record.targets || '(baseline measurement)'}\n- Changes: ${record.changes.length ? record.changes.join('; ') : 'none (baseline)'}\n- Mean ${res.mean.toFixed(2)} | min ${res.min.toFixed(2)} | >=9: ${res.reached9}/12 | tests ${tests.pass}/${tests.total}\n- Weakest: ${res.weakest.map((w) => `${CATEGORY_LABELS[w.cat]} ${w.score.toFixed(2)}`).join(', ')}\n- Largest losses: ${record.worstCriteria.slice(0, 4).map((w) => `${w.label} (${w.value})`).join('; ')}\n- Regressions: ${regressions.length ? regressions.map((r) => `${r.category} ${r.delta}`).join(', ') : 'none'}\n- Report: docs/gauntlet/round-${rr}.md\n`;
fs.writeFileSync(ledgerFile, ledger);

// ---- resumable checkpoint
const ck = {
  updated: record.at, lastRound: round, mean: res.mean, scores: Object.fromEntries(CATEGORIES.map((c) => [c, res.categories[c].score])),
  nextFocus: record.worstCriteria.slice(0, 5).map((w) => ({ category: w.cat, criterion: w.label, value: w.value })),
  resume: ['cd wwe-legacy', 'npm install', 'npm test', `node tools/gauntlet.js --round ${round + 1} --targets "<what you will improve>" --changes "<what you changed>"`],
  features: { complete: features.complete, partial: features.partial, unimplemented: features.unimplemented },
  files: { ledger: 'docs/DEVELOPMENT_LEDGER.md', reports: 'docs/gauntlet/', reviews: 'docs/gauntlet/reviews.json' },
};
fs.writeFileSync(path.join(root, 'docs/CHECKPOINT.json'), JSON.stringify(ck, null, 1));

console.log(`\nRound ${round}: mean ${res.mean.toFixed(2)} | ${CATEGORIES.map((c) => `${c.slice(0, 6)} ${res.categories[c].score.toFixed(1)}`).join(' | ')}`);
console.log('Largest losses:'); for (const w of record.worstCriteria.slice(0, 8)) console.log(`  ${w.cat}: ${w.label} = ${w.value} (loss ${w.loss})`);
