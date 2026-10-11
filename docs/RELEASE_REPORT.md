# Release report — Modern Age 0.1.0

**Verdict: a playable, tested web-tech build with an unverified iOS shell. The quality gates in the brief (every category ≥ 8.0, weighted ≥ 8.5) are NOT met** — see SCORECARD.md (independent score 5.7 / 10 in round 1; later rounds are logged there). It should be treated as a late alpha / early beta, not an App Store candidate.

## What exists
A single-player modern-era grand-strategy game: 168 playable countries, 6 scenarios, 681 strategic regions, ~1 270 military formations, 8-sector economy with 4 traded commodities and chokepoints, politics/elections, society and climate, 67 technologies, diplomacy (treaties, 14 organisations, UN-style resolutions, sanctions, guarantees, client states), intelligence and cyber, ~80 authored events plus pandemics, 6 victory paths and 15 achievements, versioned saves with double-buffered autosave, installable PWA, and a WKWebView shell for iOS.

## Verified (evidence in the repo; reproducible with the commands shown)
| Claim | How verified |
|---|---|
| Simulation, AI, saves, data: 61 unit/integration tests pass | `npm run test:fast` |
| UI flows work in Chromium with iPhone viewports/touch: 18 tests pass | `npm run ui:test` |
| Data integrity (roster↔map, tech DAG, event validity, modifier keys consumed) | `npm run validate:data` |
| Save → load → continue is bit-identical (several seeds/scenarios/load points) | `tests/unit/determinism_save.test.js`, UI snapshot test |
| 9 ten-year balance runs: 0 exceptions, 0 non-finite values; world growth ≈ 3.3 %, median inflation ≈ 2.5 %, collapses ≈ 1.1 per decade | `npm run balance` → `docs/BALANCE_REPORT.md` |
| Desktop performance ≈ 125–280 ms CPU per simulated month (host-load dependent), worst slice ≈ 30–90 ms, save ≈ 3 MB | `npm run bench` → `docs/BENCHMARK.md` |
| Genuine screenshots of the running game (Chromium emulation of iPhone 14, SE, landscape) | `npm run shots` → `docs/screenshots/` |
| Independent evaluation | `docs/REVIEW_ROUND1.md` (verbatim) |

## NOT verified
- iOS: no Xcode build, Simulator or device run of `ios/`; WKWebView/WebKit behaviour of the UI; IndexedDB under `app://`; audio unlock; safe areas on real hardware; VoiceOver.
- Performance, memory and thermals on an iPhone.
- CI on GitHub runners (workflow written, never executed; iOS job disabled).
- App Store requirements: real-device screenshots, privacy label, age rating, signing.
- Long-term balance beyond ten simulated years and human play-testing at scale.

## Known issues
See KNOWN_ISSUES.md (ordered by importance). Biggest: military/war depth, replay variety, remaining economic optimism, Japan-type fragility, unverified iOS/device.

## How to run / ship
README.md (quick start), docs/IOS_BUILD.md (PWA and native shell steps and checklist), docs/TESTING.md.

## Blockers that are external to this environment
No Apple toolchain or device was available (no Xcode/Simulator); no signing identity; no GitHub runner execution observed. These need a human with a Mac.
