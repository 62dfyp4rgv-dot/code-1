# Known issues, limitations and technical debt

Ordered by importance for a release decision. "Unverified" means *not tested*, not *known to work*.

## Blockers for an App Store release (outside this environment's reach)
1. **No iOS build, Simulator or device run has ever happened.** `ios/` (Swift, XcodeGen) is uncompiled; WebKit/WKWebView behaviour of the UI is unknown. All UI evidence comes from Chromium device emulation.
2. **No on-device performance, memory or thermal data.** Desktop numbers (`docs/BENCHMARK.md`): ~125–280 ms CPU per simulated month depending on host load, sliced; worst single slice ~30–90 ms (can drop frames on fast speed settings; at ×40 a loaded host delivered only ~23 simulated days per second). Phone behaviour is unknown.
3. **Licence not chosen** (`UNLICENSED`) and bundle id is `com.example.modernage`; signing team blank.
4. App Store assets (real-device screenshots, privacy label, age rating) not produced.

## Gameplay / simulation
5. **Growth is still somewhat optimistic**: after recalibration (D-006) world GDP grows ~3.5 %/yr and the median country ~4.2 %/yr over 10 years (real-world: ~3 % and ~3.5–4 %); USA ≈ 1.8 %, China ≈ 5.5–6 % (above most forecasts). Food/gas prices drift 25–35 % below baseline after a decade.
6. **Very-high-debt ageing economies (Japan) are the most fragile large economies.** After the monetary-neutrality and fiscal-rule fixes Japan stopped collapsing in the balance runs (0 of 9 flagged distressed, 0 collapses in the latest report) but still shows ±3 % growth swings in some seeds. A fully unmanaged big player (`--passive`) can still drag partners into slumps.
7. **War variety is low**: ~0.7 wars per decade in the balance runs, concentrated on a few pairs (Russia–Ukraine in *Fault Lines*, China–Vietnam, Russia–Georgia). Wars last ~9–15 months and end mostly by negotiated peace; front lines are mostly static (the Russia–Ukraine war moves almost no territory). Territory changes hands in forced wars against weak neighbours and tiny states become client states, but spontaneous conquest is rare.
8. **AI is reactive, not strategic**: it evaluates utility each turn; it does not plan multi-year campaigns, coordinate combined operations or exploit player-specific weaknesses. Air and naval AI tasking is lightly tuned.
9. **Nuclear weapons are a deterrence rating only** — no escalation or exchange mechanic (D-004).
10. **Regime collapse** ≈ 1.1 per decade in the latest balance report (almost all Ukraine, whose occupied land now persists across ceasefires); consolidated democracies now need ten months of instability before collapse.
11. **Event repetition**: shortage-driven events (`rolling_blackouts`, `fuel_shortage`) and `heatwave` remain the most frequent (~18 % of all events in long runs). ~80 authored events (26 added after the first review) is still modest for replayability.
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
20. `cube.html` in the repository root is an unrelated file that predates this project's work (an earlier commit in the repo); it is not part of the game.
21. Cross-engine floating-point determinism is not guaranteed (a seed may yield a different world on a different JS engine); saves restore state exactly regardless (D-003).
22. The CI workflow has never run on GitHub; the iOS job is disabled.
23. Service-worker precache list (`sw.js`) is maintained by hand; forgetting to bump `VERSION` on release serves stale assets.
