// Generates the honest completion reports from the feature manifest and the latest Gauntlet round:
//   docs/FEATURE_STATUS.md  (complete / partial / unimplemented, authored vs generated counts, data caveats)
//   docs/QUALITY_REPORT.md  (scores by category with evidence links, review history, known limits)
import fs from 'node:fs';
import path from 'node:path';
import { featureReport } from './features.js';
import { CATEGORIES, CATEGORY_LABELS } from './rubric.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const dir = path.join(root, 'docs/gauntlet');
const rounds = fs.readdirSync(dir).filter((f) => /^round-\d+\.json$/.test(f)).sort();
const last = JSON.parse(fs.readFileSync(path.join(dir, rounds[rounds.length - 1]), 'utf8'));
const first = JSON.parse(fs.readFileSync(path.join(dir, rounds[0]), 'utf8'));
let reviews = null;
try { reviews = JSON.parse(fs.readFileSync(path.join(dir, 'reviews.json'), 'utf8')); } catch { /* none */ }
const fr = featureReport();
const m = last.metrics;

// ------------------------------------------------------------------ FEATURE_STATUS.md
const F = ['# Feature status (honest completion report)', '',
  `Generated from \`tools/features.js\` (each "complete" entry has a probe that must pass) and Gauntlet round ${last.round} (${last.at}).`, '',
  `**${fr.complete} complete · ${fr.partial} partial · ${fr.unimplemented} unimplemented** of ${fr.total} tracked features.`, ''];
for (const area of [...new Set(fr.rows.map((r) => r.area))]) {
  F.push(`## ${area[0].toUpperCase()}${area.slice(1)}`, '', '| Feature | Status | Note |', '|---|---|---|');
  for (const r of fr.rows.filter((x) => x.area === area)) F.push(`| ${r.label} | **${r.status}**${r.declared !== r.status ? ` (declared ${r.declared}, probe failed)` : ''} | ${r.note || ''} |`);
  F.push('');
}
F.push('## Content counts (authored and generated are reported separately)', '',
  `- Authored scenario templates: **${m.scenario.authored}** across ${m.scenario.categories} categories.`,
  `- Validated generated configurations (template × slot combination, capped at 24 per template): **${m.scenario.configs}**. These are variations of the authored templates, not additional authored stories.`,
  `- Achievements: **${m.ach.total}** (${m.ach.secret} secret, ${m.ach.eraGated} era-gated); ${m.ach.provable}/${m.ach.total} proved reachable by synthesised legal event sequences.`,
  `- Match types: ${Object.keys(m.match.types).length} rulesets plus the Royal Rumble.`,
  `- Real-name roster entries: ${m.universe.realEntries}; all are approximate (see below).`, '',
  '## Data accuracy', '',
  '- Real-name rosters, active windows, finishers, premium-event dates and record benchmarks are **approximate and unverified**. They are flagged `approx:true` in data and the UI says so. No network source was available to verify them in this build.',
  '- Everything that happens after the start date is simulated alternate history written to the ledger as `canon:false`; fictional results are never presented as real history.',
  '- Historical mode uses the approximate snapshot for the chosen year; modern mode and the "fully fictional" world use generated names.', '',
  '## Platform notes', '',
  '- Delivered as an installable, offline-capable web app (PWA) and a single-file build. There is no native iOS binary and no App Store build.',
  '- Verified in headless Chromium at an iPhone viewport (390×844). It has not been tested on physical iOS hardware or Safari in this environment.', '');
fs.writeFileSync(path.join(root, 'docs/FEATURE_STATUS.md'), F.join('\n'));

// ------------------------------------------------------------------ QUALITY_REPORT.md
const Q = ['# Quality report', '',
  `Based on ${rounds.length} Gauntlet rounds. Final measured round: **${last.round}** (${last.at}). Every score below is computed by \`tools/rubric.js\` from tests, simulations and audits run in that round; see \`docs/gauntlet/round-NN.md\` for the evidence behind each criterion.`, '',
  '## Scores', '', '| Category | Round 1 (baseline) | Final | Target 9.0 |', '|---|---:|---:|:---:|'];
for (const c of CATEGORIES) {
  const a = first.scores.categories[c].score, b = last.scores.categories[c].score;
  Q.push(`| ${CATEGORY_LABELS[c]} | ${a.toFixed(2)} | **${b.toFixed(2)}** | ${b >= 9 ? 'met' : 'not met'} |`);
}
Q.push(`| **Mean** | ${first.scores.mean.toFixed(2)} | **${last.scores.mean.toFixed(2)}** | |`, '', `Categories at or above 9.0: **${last.scores.reached9}/12**.`, '');
Q.push('## Round history', '', '| Round | Mean | Min | ≥9 | Tests | Focus |', '|---:|---:|---:|---:|---:|---|');
for (const f of rounds) {
  const r = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  Q.push(`| ${r.round} | ${r.scores.mean.toFixed(2)} | ${r.scores.min.toFixed(2)} | ${r.scores.reached9} | ${r.metrics.tests.pass}/${r.metrics.tests.total} | ${String(r.targets || '').slice(0, 110)} |`);
}
Q.push('');
if (reviews && reviews.rounds && reviews.rounds.length) {
  Q.push('## Independent reviews', '', reviews.note, '');
  for (const r of reviews.rounds) {
    Q.push(`### Review round ${r.round}`, '');
    for (const rv of r.reviewers) Q.push(`- **${rv.area}** (${rv.kind}): ${Object.entries(rv.scores).map(([k, v]) => `${k} ${v}`).join(', ')}. ${rv.summary}`);
    Q.push('');
  }
}
Q.push('## What the scores do not prove', '',
  '- The reviewers are fresh Claude subagents: independent in context, not in model family.',
  '- Simulated "players" are scripted strategies; no human playtest data exists.',
  '- Several rubric criteria are proxies (for example commentary variety is distinct lines per thousand). A high score means the proxy is met, not that the game is fun.',
  '- Real-world history is approximate and unverified (see FEATURE_STATUS.md).',
  '- Performance numbers are from a desktop-class cloud core; phones will be slower.', '',
  '## Unverified or unimplemented criteria in the final round', '');
for (const c of CATEGORIES) for (const k of last.scores.categories[c].criteria.filter((x) => x.status !== 'measured')) Q.push(`- ${CATEGORY_LABELS[c]}: ${k.label} — ${k.status}`);
Q.push('');
fs.writeFileSync(path.join(root, 'docs/QUALITY_REPORT.md'), Q.join('\n'));
console.log(`wrote docs/FEATURE_STATUS.md and docs/QUALITY_REPORT.md from round ${last.round}`);
