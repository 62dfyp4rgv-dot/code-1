# Technical decisions log

## D-001 Environment audit (2026-10-11)
Linux x86_64 container. Available: Node 22, Python 3.13, clang/gcc, Rust, Go, Java, Chromium + Playwright 1.56.
**Not available: Swift toolchain, Xcode, iOS Simulator, any Apple device** (swift.org download returns 403 via proxy).
Consequence: a native iOS binary can NOT be built or run here. Anything that needs Xcode is documented as UNVERIFIED.

## D-002 Stack evaluation
| Option | Perf / map | Sim testability here | iOS build verifiable here | Maintainability | Verdict |
|---|---|---|---|---|---|
| Swift + SpriteKit (native) | Excellent | Core could be a Swift package but needs a Swift toolchain (absent) | No | Good, but zero ability to run anything | Rejected: nothing could be tested in this environment |
| Godot 4 iOS export | Good | Needs Godot binary (absent); GDScript sims slow | No (needs Xcode) | OK | Rejected: no engine binary, slow headless tests |
| Unity | Good | Needs Unity editor + license | No | Heavy | Rejected: licensing + overhead for a 2D UI-heavy sim |
| **JS (ES modules) simulation core + HTML5 canvas/DOM UI, shipped as installable PWA and wrapped in a WKWebView iOS shell** | Good for 2D map (raster+vector, 60fps feasible) | **Fully testable here (node:test, Playwright at iPhone viewports)** | Shell only; Xcode build unverified | Good: one language, data-driven | **Chosen** |

Trade-offs accepted: WebKit (iOS) JS performance is lower than native; no Metal; App Store requires the wrapper. Playwright here drives Chromium (emulating iPhone viewports/touch), NOT iOS Safari - this is a documented verification gap.

## D-003 Architecture
- `app/js/sim/*` pure simulation (no DOM, no Math.random). Seeded PRNG (sfc32) with state in the save.
- All player *and* AI actions go through one command layer (`commands.js`): same validation and costs; AI receives only a `Perception` (noisy, intel-limited) - it never reads other countries' private state.
- Base tick = 1 day. Subsystems run at declared frequencies (daily / monthly / yearly); see `docs/SUBSYSTEMS.md`.
- Data-driven: CSV/JSON in `app/data/` (countries, resources, orgs, techs, events, scenarios, policies). Loader takes an injected reader so Node (fs) and browser (fetch) share it.
- Geography: Natural Earth (public domain) via `world-atlas` -> 0.5 deg raster of strategic regions (k-means per country) + sea zones (flood-fill from named seeds) + adjacency graphs. Terrain is hand-authored approximation.
- Saves: versioned JSON (`saveVersion`), typed matrices base64-encoded, migration table, IndexedDB with localStorage fallback, double-buffered slots for crash safety.
- Determinism: reproducible per JS engine given seed + command log. Cross-engine bit-identity of Math.exp/pow is NOT guaranteed; saves store full state so load is exact everywhere.

## D-004 Scope control
175 map entities (Natural Earth 110m). Everything is simulated by the same rules; ~40 countries get hand-authored detail (resources, alliances, rivalries), the rest are derived from population/GDP/regime with seeded variation and flagged `derived`.
Nuclear weapons are modelled as deterrence rating only (no nuclear exchange mechanic).

## D-005 Balance-driven design changes (2026-10-11, from `tools/balance.mjs`)
- **Security guarantees** (`orgs.json: guarantees`): implicit third-party commitments (e.g. US→Taiwan) are seeded as `guarantee` treaties. They are not alliances (no obligation to fight) but the AI counts a guarantor's strength at 0.7 weight when judging an attack. Chosen over adding fake alliances; values are gameplay judgement (see DATA_SOURCES.md).
- **Amphibious assaults**: landing across a strait now has a much larger penalty, and the AI needs ≥ 2.5:1 power for non-neighbour targets. Chosen because balance runs produced a China–Taiwan war in most decades lasting weeks.
- **Neutral-by-construction policy rate**: each country's Taylor-rule neutral rate (`rStar`) is set so the rule outputs the starting policy rate at t0; optional `rate0`/`homeBias` profile fields model low-rate, domestically financed debtors (Japan). Chosen because a global initial monetary-tightening transient pushed Japan into a deflation/debt spiral and regime collapse in most runs.
- **Downward price rigidity** and a flatter Phillips curve in slack, to prevent deflation spirals.
- Nuclear exchange remains unmodelled (D-004).
