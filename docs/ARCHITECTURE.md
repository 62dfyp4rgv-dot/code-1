# Architecture

## 1. Technology decision (summary; full record in DECISIONS.md D-001)

Two stacks were evaluated against the brief (iPhone-first, offline, deterministic core, data-driven, testable
without a Mac, shippable by one automated team):

| | A. Native Swift/SpriteKit/SwiftUI | B. Web-tech core (ES modules + Canvas 2D) in a WKWebView shell |
|---|---|---|
| Sim performance on device | Best | Expected to be adequate for a month-tick sim (JavaScriptCore in WKWebView is JIT-enabled), **but never measured on a device** |
| Test/iterate in the authoring environment (Linux, no Xcode) | Not possible — nothing could be run | Node `node:test` for the core; Playwright + Chromium for UI |
| Determinism / reproducibility | Needs custom RNG either way | Same; pure JS, seeded sfc32, no `Math.random` in sim |
| Touch UX, safe areas, haptics | Native | CSS `env(safe-area-*)`, pointer events, bridge to `UIImpactFeedbackGenerator` |
| Distribution | App Store | PWA today; App Store through the thin Swift shell in `ios/` (**not built**) |

**Chosen: B.** The decisive factor was verifiability: with B, every claim in this repository about simulation
behaviour is backed by a test or a measured run. With A, nothing could have been executed.

## 2. Layering

```
 ┌────────────────────────── ios/ (Swift shell, WKWebView, app:// scheme, haptics, file export) ─┐
 │  ┌──────────────────────────── app/js/ui  (DOM + Canvas) ───────────────────────────────┐   │
 │  │ App (loop, HUD, sheets) · MapView · screens/* · flow (menu, wizard, events, end)     │   │
 │  │ storage (IndexedDB/localStorage) · audio (WebAudio synth) · charts · icons · fmt     │   │
 │  └──────────────▲──────────────────────────────────────────────────────────────────────┘   │
 │                 │ reads state; issues commands only through Sim.exec / commands.js           │
 │  ┌──────────────┴───────── app/js/sim  (pure, deterministic, no DOM/Date/Math.random) ────┐   │
 │  │ world.js (Sim, scheduler) ── economy · trade · politics · society · research · military │   │
 │  │ war · diplomacy · intel · events · victory · achievements · stats · save · mods         │   │
 │  └──────────────▲──────────────────────────────────────────────────────────────────────┘   │
 │                 │ same command layer as the player                                         │
 │  ┌──────────────┴──────── app/js/ai  (perception.js is the ONLY window onto other states) ─┐   │
 │  └──────────────────────────────────────────────────────────────────────────────────────┘   │
 └──── app/data  (CSV/PSV/JSON, loaded through an injected reader: fetch in browser, fs in Node) ┘
```

Rules that are enforced rather than hoped for:

1. **Sim has no browser dependencies**, so it runs unchanged in Node (tests, balance, benchmark) and in the browser.
2. **One command layer** (`commands.js`): player UI and AI call the same handlers; arguments are schema-validated
   (`REQUIRED`/`IDX`), costs and legality are checked once.
3. **AI fog of war** — `tests/unit/ai_lint.test.js` fails the build if AI modules read another country's true state
   outside `ai/perception.js`.
4. **Determinism** — all randomness is a seeded `sfc32` stream (`rng.js`) or a stateless `hash01(seed, …)` noise
   function; no wall-clock reads in sim; iteration order is index-based.
5. **State is plain data** (`sim.state`) separate from static geography (`Sim.geo`, rebuilt from data), so save =
   serialise state; load = rebuild geo + attach state (+ `postLoad` for derived caches).

## 3. Time model

`stepGen()` advances **one day**: military/diplomatic/event daily phases; on the 1st of a month it runs
`monthlyGen()` (economy → trade → politics → society → research → military → war scoring → diplomacy → intel →
events → AI → stats), on 1 January the yearly step. Both are **generators that yield between phases** (and inside
trade clearing / AI turns), letting the UI spend ≲ 9 ms per frame on simulation and keep scrolling smooth.
Headless runs consume generators to completion (`step()`).

AI turns are staggered: great powers and belligerents every month, others every third month, spreading cost.

## 4. State & saves

`sim.state` holds typed arrays (region owner/control, relation matrices as `Int8Array`, price series) and nested
plain objects per country. `save.js`:

- Format: line 1 header JSON (`magic`, `version`, `meta` for slot listings — read with `peek()` without parsing the
  body), line 2 checksum (full FNV-1a + length), then body JSON with typed arrays as base64.
- `MIGRATIONS` table, `validateState()` structural checks; a corrupt or future-version save is rejected with a
  `SaveError` and never half-loaded.
- Size ≈ 3.0 MB uncompressed at ~1 year in (measured, `tools/bench.mjs`).
- UI storage: double-buffered autosave (slots `auto:a`/`auto:b` alternate; the pointer `auto:ptr` moves only after a successful write, and load falls back to the other slot), so an interruption mid-write
  cannot destroy the previous save. Verified by a UI test (autosave → reload → "Continue").
- **Determinism test**: save → load → continue N months is **bit-identical** to the uninterrupted run
  (`tests/unit/determinism_save.test.js`).

## 5. Data pipeline

`tools/build-map.mjs` (needs `world-atlas`): Natural Earth 110m → 175 map entities, 0.5° raster → 525 strategic
regions (per-country k-means), 53 sea zones (flood fill), adjacency incl. strait links, coarse terrain. Output
`app/data/map.json` is committed; the build is reproducible (`npm run build:map`). Everything else under
`app/data/` is hand-authored and loaded by `data.js`; `tests/unit/data.test.js` checks referential integrity
(roster ↔ map, tech prerequisites acyclic, effect keys consumed by code, event conditions/effects valid).

## 6. UI architecture

- `App` owns the game loop (`requestAnimationFrame`, four speeds of 1/4/12/40 simulated days per real second, pause) and the
  budgeted generator pump; HUD pills; bottom sheet (`half`/`full` snaps, drag); tab bar.
- Screens self-register (`App.register(id, {render, …})`) and return HTML strings; **event delegation** on
  `data-act`/`data-cmd`/`data-open`/`data-sheettab` attributes — no per-element listeners to leak.
- `MapView` draws vector coastlines/borders plus rasterised ownership layers on a single canvas; pan, pinch,
  double-tap zoom, level-of-detail labels, fog-of-war force markers, front arrows, chokepoints, trade arcs;
  7 map modes.
- Design system in `app.css`: dark default; light, high-contrast, colour-vision-friendly palettes; reduce-motion; ≥ 44 pt
  targets; safe-area insets; Dynamic-Type-style scalable font sizes.

## 7. iOS shell

`ios/ModernAge` hosts `app/` in a `WKWebView` served from a custom `app://` scheme (so IndexedDB/fetch behave and
nothing leaves the device), forwards haptics and save export to native APIs. XcodeGen builds the project from
`ios/project.yml`. **This path has never been compiled**; see docs/IOS_BUILD.md.

## 8. Performance budget (measured on desktop, see tools/bench.mjs)

~100–160 ms of CPU per simulated month; sliced so that the typical slice is < 1 ms and the worst observed slice is
~25–35 ms. Headless-Chromium frame time: median ~17 ms, p95 ~50 ms with *software* rendering. These are not phone
numbers; an A15 phone's single-thread JS speed is usually comparable to or better than this server CPU, but that is
an expectation, not a measurement.
