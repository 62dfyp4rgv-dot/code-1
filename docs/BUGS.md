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
| 19 | independent review | Saving while the monthly update was suspended mid-way (autosave on pause/background) lost the rest of that month | UI saved with a half-processed day | Fixed: `App.snapshot()` settles the in-flight day first; UI regression test |
| 20 | independent review + new test | Loaded games diverged from uninterrupted ones after ~1 month for some seeds/players | the noisy-perception cache was keyed by month but its values depended on the day it was first filled | Fixed: stateless perception; new unit test saves at arbitrary months for two seeds/scenarios and compares 6 months of continuation bit-for-bit (the previous determinism test missed it) |
| 21 | independent review | AI-initiated peace was applied to the human player without asking (and awarded "Peacemaker") | `proposePeace` evaluated acceptance on the human's behalf | Fixed: offers are parked on the player's diplomacy record, shown as a modal, expire after 45 days (`answerOffer`); unit + UI tests |
| 22 | independent review | Policy-rate lever was inert for the player | independent central bank re-set the rate every month | Fixed: setting the rate by hand switches the central bank off; unit test |
| 23 | independent review | A stray tap on a slider spent up to 20 political capital without confirmation | commit-on-release with no guard | Fixed: confirmation dialog for changes costing ≥ 10 PC (Nation and Economy sliders); UI test |
| 24 | independent review | Day-0 military budget showed $0 (BUGS #14 had only fixed the economy) | `mil.budget` zero until the first monthly step | Fixed |
| 25 | independent review | Chart y-axis labels clipped on the left in Statistics | fixed 30 px gutter | Fixed: gutter sized from the labels |
| 26 | independent review | Expired decision tap showed "no such decision" error toast | modal outlived the event | Fixed: silent |
| 27 | independent review | `ai_lint` contained a vacuous assertion (`|| true`) | leftover | Removed; the lint is still a regex check (see KNOWN_ISSUES) |
| 28 | war probes | Units idling in their own territory had zero supply and collapsing morale (huge countries paralysed) | supply only flowed from capital/port hubs | Fixed: uncontested home territory has a supply floor |
| 29 | probe | A big output shock did not raise unemployment (supply-side shock left demand slack negative) | unemployment only read demand slack | Fixed: shock term in the labour market |
