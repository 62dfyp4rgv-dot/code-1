# Development journal

Chronological record of the single development session (all on 2026-10-11 by the automated agent). Times omitted; order is real.

1. **Environment audit** (D-001): Linux, Node 22, Chromium+Playwright; no Swift/Xcode/Simulator/device ⇒ iOS build impossible here; decision to ship a web-tech core with a thin native shell and to document all iOS claims as unverified.
2. **Stack evaluation & architecture** (D-002/D-003): JS ES-module core, Canvas/DOM UI, data-driven content, deterministic seeded sim, command layer shared by player and AI.
3. **Data pipeline**: Natural Earth 110m → 175 entities / 525 regions / 53 sea zones; country roster, resources, cities, profiles, orgs, geopolitics, chokepoints, policies, scenarios, 67 techs, ~55 events. Antimeridian raster bug found and fixed.
4. **Simulation core**: economy (calibration → drift fixes), trade/commodities with conservation, politics, society/climate, research, military + war, diplomacy + organisations + UN, intelligence + cyber, events + pandemics, victory/achievements, saves. Long probe loops (ad-hoc probe scripts, since removed from the repo; see git history) revealed and fixed price spikes, deflation spirals, reserve collapses, performance hotspots.
5. **Save/load determinism**: found 4 sources of divergence; save reduced 7.4 → 3 MB; bit-identical continuation test.
6. **World AI**: perception-limited AI with staggered turns; lint test enforcing fog of war; war pacing tuned.
7. **UI**: map renderer, bottom-sheet screens, new-game wizard, tutorial, decision modals, end report, accessibility settings, PWA, audio, haptic bridge; 11 Playwright tests.
8. **iOS shell**: WKWebView host, scheme handler, XcodeGen project — written but never compiled.
9. **Genuine screenshots** captured from the running game (Chromium device emulation) for iPhone 14, SE and landscape. Inspection found a landscape layout defect (#13) and a day-0 economy display bug (#14); both fixed.
10. **Balance dashboard** (`tools/balance.mjs`) exposed an infinite loop on finished games (#15), Taiwan/Georgia war over-frequency (#16) and Japan regime collapses (#17). Fixed via D-005; new numbers in `BALANCE_REPORT.md`.
11. **Tooling & docs**: bench, validate-data, release gate, CI workflow, documentation set, independent evaluation.

## Things tried and rejected
- Flattening the Phillips curve alone did not stop Japan's spiral (made GDP swings worse); the real cause was a non-neutral initial policy rate.
- Lowering the AI war-declaration rate globally eliminated almost all emergent wars (0.4 per decade); keeping the rate and adding deterrence (guarantees) preserved variety.
