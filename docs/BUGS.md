# Bug log (found by tests, tooling or inspection during development)

Status: **Fixed** (with the guarding test/tool where one exists) or **Open** (see KNOWN_ISSUES.md).

| # | Found by | Symptom | Root cause | Status / guard |
|---|---|---|---|---|
| 1 | map inspection | Raster streaks across Russia, Fiji, Alaska | antimeridian-crossing polygons rasterised without unwrapping | Fixed: ring unwrapping, rasterise at −360/0/+360 (`build-map.mjs`) |
| 2 | economy probes | Calibrated economies drifted at t0 (tech/stability multipliers not baseline-relative) | multipliers applied as absolute values | Fixed: `modd`/`mc0` relative modifiers; `economy.test.js` |
| 3 | probes | Deflation spiral, real exchange-rate collapse when reserves hit zero | missing external-finance conservation, no price supply elasticity | Fixed: `externalFinanceStep`, price dynamics; boundedness test |
| 4 | probes | Minerals price spike | AI defence spending/threat inflation feeding mineral demand | Fixed: demand coefficient, softer AI threat formula |
| 5 | profiling | Month step too slow in AI/diplomacy | uncached `alliesOf`, O(N²) diplomacy lookups | Fixed: per-day cache, `dipIdx`, staggered AI turns |
| 6 | save/load test | Loaded games diverged from continued games | stale `supplyBy` cache, `_bigPowers`, intel `est` state, `lastBlockade` outside state | Fixed; `determinism_save.test.js` (bit-identical) |
| 7 | probes | Save was 7.4 MB | stored intel estimates per country pair | Fixed → ~3 MB (stateless hash noise) |
| 8 | war probes | Wars too many/fast; island nations unreachable | advance rate, thresholds; no strait links | Fixed: pacing floors, strait adjacency; further tuned 2026-10-11 (see JOURNAL) |
| 9 | unit tests | Commands accepted missing arguments | no schema | Fixed: `REQUIRED`/`IDX` validation; test iterates all commands |
| 10 | unit tests | Pandemic never ended | no recovery term | Fixed: SIR with recovery |
| 11 | unit tests | Chokepoint closure semantics wrong side | cap applied importer-side | Fixed: exporter-side cap |
| 12 | UI test | "Continue" always shown | IndexedDB helper returned request object | Fixed (`'result' in out`); UI autosave test |
| 13 | screenshots | Landscape layout shifted; HUD clipped, sheet half visible | closed off-screen sheet made `#app` programmatically scrollable | Fixed: `overflow: clip`; regression UI test (all device sizes) |
| 14 | screenshots | Economy overview showed government spending 0 % at day 0 | `govC`, `exp`, `imp` only set after first monthly step | Fixed (initialised at t0) |
| 15 | balance tool | Balance run hung forever on 8-year scenario | `advanceMonths` looped after the game had ended | Fixed (`ended.final` break) |
| 16 | balance tool | China–Taiwan war in ~5/6 runs, within weeks | amphibious landings too easy; AI ignored third-party guarantees | Fixed: stronger strait penalty, island odds, data-driven security guarantees (`orgs.json`) |
| 17 | balance tool | Japan regime collapse in 5/6 runs (deflation + debt spiral) | initial policy rate not neutral under the Taylor rule (global initial tightening shock), Japanese yields priced like a foreign-debt borrower | Fixed: neutral-by-construction `rStar`, `rate0`/`homeBias` profile fields, downward price rigidity |
| 18 | tooling | `pkill -f` matched and killed the shell itself | pattern appeared in the shell's own command line | Process note: use PIDs |
