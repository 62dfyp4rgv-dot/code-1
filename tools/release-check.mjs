// Release gate: runs every automated check and prints a PASS/FAIL table. Does NOT build the iOS app (needs macOS + Xcode; see docs/IOS_BUILD.md).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path';
const skipUi = process.argv.includes('--no-ui');
const results = [];
const run = (name, cmd, args) => { const t = Date.now(); const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28 }); results.push({ name, ok: r.status === 0, s: ((Date.now() - t) / 1000).toFixed(0), tail: r.status === 0 ? '' : (r.stdout + r.stderr).split('\n').slice(-25).join('\n') }); };
// 1. syntax of every JS/MJS file
const files = []; const walk = (p) => { for (const f of fs.readdirSync(p, { withFileTypes: true })) { if (['node_modules', '.git', 'www'].includes(f.name)) continue; const q = path.join(p, f.name); if (f.isDirectory()) walk(q); else if (/\.(m?js)$/.test(q)) files.push(q); } };
for (const d of ['app', 'tools', 'tests']) walk(d);
let bad = 0; for (const f of files) { const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' }); if (r.status !== 0) { bad++; console.error(r.stderr); } }
results.push({ name: `syntax check (${files.length} files)`, ok: bad === 0, s: '0', tail: '' });
// 2. required documentation present
const docs = ['README.md', 'docs/ARCHITECTURE.md', 'docs/SUBSYSTEMS.md', 'docs/DATA_SOURCES.md', 'docs/TESTING.md', 'docs/IOS_BUILD.md', 'docs/SCORECARD.md', 'docs/KNOWN_ISSUES.md', 'docs/RELEASE_REPORT.md', 'docs/GAMEPLAY.md'];
const missing = docs.filter((d) => !fs.existsSync(d)); results.push({ name: 'required docs present', ok: missing.length === 0, s: '0', tail: 'missing: ' + missing.join(', ') });
// 3. unit tests, data validation
run('unit tests', process.execPath, ['--test', ...fs.readdirSync('tests/unit').filter((f) => f.endsWith('.test.js')).map((f) => 'tests/unit/' + f)]);
// 4. UI tests
if (!skipUi) run('UI tests (Chromium emulation)', process.execPath, ['--test', 'tests/ui/ui.test.js']);
console.log('\nRelease check\n' + '-'.repeat(60));
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.s !== '0' ? ` (${r.s}s)` : ''}`);
for (const r of results.filter((x) => !x.ok)) console.log(`\n--- ${r.name} ---\n${r.tail}`);
if (skipUi) console.log('\nNOTE: UI tests skipped (--no-ui).');
console.log('\nNot covered by this script: iOS build/signing, on-device performance, App Store review.');
process.exit(results.every((r) => r.ok) ? 0 : 1);
