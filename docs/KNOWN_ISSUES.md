# Known issues, limitations and technical debt

Ordered by importance for a release decision. "Unverified" means *not tested*, not *known to work*.

## Blockers for an App Store release (outside this environment's reach)
1. **No iOS build, Simulator or device run has ever happened.** `ios/` (Swift, XcodeGen) is uncompiled; WebKit/WKWebView behaviour of the UI is unknown. All UI evidence comes from Chromium device emulation.
2. **No on-device performance, memory or thermal data.** Desktop numbers (`docs/BENCHMARK.md`): ~100–160 ms CPU per simulated month, sliced; worst single slice ~25–35 ms (can drop a frame on fast speed settings). Phone behaviour is unknown.
3. **Licence not chosen** (`UNLICENSED`) and bundle id is `com.example.modernage`; signing team blank.
4. App Store assets (real-device screenshots, privacy label, age rating) not produced.

## Gameplay / simulation
5. **Growth is optimistic**: median country grows ~4.5 %/yr and world GDP ~3.7 %/yr over 10 years, above typical real-world figures (~3 %). Cross-country divergence is plausible (p10 ≈ 2.2 %, p90 ≈ 5.6 %) but the level is high. Prices of food/gas drift 25–35 % below baseline after a decade (productivity outpaces demand).
6. **Japan is fragile**: with ~240 % debt and shrinking population it entered a deflation/debt slump ending in regime collapse in 3 of 9 balance runs (still 1 of 9 flagged distressed at the end). The AI player's country is AI-driven in those runs; a fully *unmanaged* big player (`npm run balance -- 10 3 out.md --passive`) makes it worse. Treat Japan and other very-high-debt ageing states as the weakest part of the economic model.
7. **War variety is lower than ideal**: after adding deterrence/amphibious penalties (D-005) there are ~0.7–2 wars per decade, concentrated on a handful of pairs (Russia–Ukraine in *Fault Lines*, China–Vietnam, Israel–Syria). Wars between neighbours end in ~9–15 months, usually by negotiated peace; tiny states can be overrun in 1–4 months. Taiwan/Korean-peninsula-type scenarios rarely occur spontaneously.
8. **AI is reactive, not strategic**: it evaluates utility each turn; it does not plan multi-year campaigns, coordinate combined operations or exploit player-specific weaknesses. Air and naval AI tasking is lightly tuned.
9. **Nuclear weapons are a deterrence rating only** — no escalation or exchange mechanic (D-004).
10. **Regime collapse frequency** ~2 per decade across the world (Ukraine and Argentina recur); collapses are driven mostly by sustained unemployment/inflation and war.
11. **Event repetition**: shortage-driven events (`rolling_blackouts`, `fuel_shortage`) and `heatwave` account for ~25 % of all events in long runs; they are condition-driven so they cluster in stressed economies. ~55 authored events is modest for replayability.
12. **Geography is coarse**: 110 m borders (micro-states absent), synthetic region names, approximate terrain, 525 regions; some islands are weakly connected.
13. **Statistics are approximate** and partly derived (DATA_SOURCES.md); not suitable as reference data.

## UI / UX
14. Headless frame statistics (median ~17 ms, p95 ~50 ms) come from *software rendering*; they say nothing about phone GPUs.
15. Dense screens (diplomacy, military) are information-heavy on small phones; there is no large-text VoiceOver walkthrough, and Dynamic Type is emulated with an in-app text-size setting rather than the OS setting.
16. Audio is synthesised WebAudio effects only; no music. Not heard on a real device.
17. Visual polish is functional-modern (dark theme, vector map + raster layers, original icons) — no animated unit sprites, weather or terrain art.
18. Only English; no localisation framework.

## Engineering debt
19. Several modules (`war.js`, `diplomacy.js`, `economy.js`) are large and use very long lines; some magic constants are tuned empirically rather than documented per-constant.
20. `tools/dev/` contains ad-hoc diagnostics that are not part of the supported tooling or tests.
21. Cross-engine floating-point determinism is not guaranteed (a seed may yield a different world on a different JS engine); saves restore state exactly regardless (D-003).
22. The CI workflow has never run on GitHub; the iOS job is disabled.
23. Service-worker precache list (`sw.js`) is maintained by hand; forgetting to bump `VERSION` on release serves stale assets.
