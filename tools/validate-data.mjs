// Validates content data (referential integrity, schema, modifier keys) by running the data test-suite, then prints a content inventory.
import { spawnSync } from 'node:child_process';
import { loadDataNode } from '../app/js/sim/data.js';
const r = spawnSync(process.execPath, ['--test', 'tests/unit/data.test.js'], { stdio: 'inherit' });
const d = await loadDataNode();
console.log(`\ncontent inventory: ${d.countries.length} roster rows, ${d.map.countries.length} map entities, ${d.map.regions?.length ?? '?'} regions, ${d.techs.length} techs, ${d.events.length} events, ${Object.keys(d.orgs?.orgs ?? d.orgs ?? {}).length || (d.orgs?.length ?? '?')} organisations, ${d.scenarios.length ?? Object.keys(d.scenarios).length} scenarios`);
process.exit(r.status ?? 1);
