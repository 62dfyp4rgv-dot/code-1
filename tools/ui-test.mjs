// Runs the Playwright UI suite (Chromium device emulation). Requires playwright + a Chromium build (see docs/TESTING.md).
import { spawnSync } from 'node:child_process';
process.exit(spawnSync(process.execPath, ['--test', '--test-reporter=spec', 'tests/ui/ui.test.js'], { stdio: 'inherit' }).status ?? 1);
