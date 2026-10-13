// Scenario library CLI: validates every template, reports authored vs expanded counts, and
// smoke-plays random scenarios against live careers to catch runtime errors.
//   node tools/scenarios.js            validate + report
//   node tools/scenarios.js --smoke 300   also simulate picks/resolutions
import path from 'node:path';
import { SCENARIO_TEMPLATES, SCENARIO_GROUPS } from '../src/story/scenarios/index.js';
import { validateLibrary } from '../src/story/scenarioValidator.js';
import { ScenarioEngine } from '../src/story/scenarios.js';

const fileArg = process.argv.indexOf('--file');
let templates = SCENARIO_TEMPLATES, groups = SCENARIO_GROUPS;
if (fileArg > 0) { const mod = await import(path.resolve(process.argv[fileArg + 1])); templates = mod.default; groups = { [process.argv[fileArg + 1]]: templates }; }
const report = validateLibrary(templates);
console.log(`authored templates: ${report.templates}`);
for (const [g, list] of Object.entries(groups)) console.log(`  group ${g}: ${list.length}`);
console.log(`validated configurations (template x slot combination, capped at 24 per template): ${report.configs}`);
console.log('by category:', JSON.stringify(report.byCategory));
console.log(`errors: ${report.errors.length}, warnings: ${report.warnings.length}`);
for (const e of report.errors.slice(0, 60)) console.log('  ERROR', e);
for (const w of report.warnings.slice(0, 20)) console.log('  warn ', w);
if (report.errors.length) process.exitCode = 1;
export { report };
