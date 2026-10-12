# Amazement Score card

**Rules followed**: scores are evidence-based; only categories that can be verified in this environment are counted; nothing is rounded up to reach a gate. The authors' own opinion is *not* used as a score — scores come from an independent evaluator (a fresh-context sub-agent that did not write the code, was told to be sceptical, and ran the tests/probes itself). The authors record what they changed in response, and every change to a score is logged below (permanent record).

Weights (from the brief): Strategic depth 15 % · Economic realism 12 % · Military/logistics 12 % · Diplomacy & world AI 12 % · Emergent/replay 12 % · iPhone UX 12 % · Visual 8 % · Performance/stability/saves 10 % · Code quality 7 %. Gates: every category ≥ 8.0 and weighted ≥ 8.5.

## Round 1 — independent evaluation of commit `0428cfe` (verbatim report: `docs/REVIEW_ROUND1.md`)

| Category | Weight | Score | Counted? |
|---|---|---|---|
| Strategic depth | 15 % | 5.5 | yes |
| Economic realism | 12 % | 5.5 | yes |
| Military / logistics | 12 % | 4.8 | yes |
| Diplomacy & world AI | 12 % | 5.8 | yes |
| Emergent behaviour / replayability | 12 % | 4.5 | yes |
| iPhone UX | 12 % | 6.5 | capped: Chromium emulation only, **iOS UNVERIFIED** |
| Visual quality | 8 % | 6.3 | yes (screenshots are emulation) |
| Performance / stability / saves | 10 % | 7.0 | desktop only, **device performance UNVERIFIED** |
| Code quality | 7 % | 5.5 | yes |
| **Weighted total** | | **5.7** (5.4 excluding UX and performance) | |

**Gate status after round 1: NOT PASSED** (every category below 8.0; weighted total 5.7 < 8.5).

### Evaluator findings the authors acted on (see BUGS.md #19–#29, DECISIONS D-006)
Save during suspended monthly update lost state (fixed + test); AI peace imposed on the human (offers now answerable); client states and territorial consequences; inert policy-rate lever; economy optimism and debt deflation (recalibrated); slider commit without confirmation; day-0 military budget; chart axis clipping; vacuous lint assertion; ~35 scratch scripts removed; Prettier applied; 27 more events; missing docs (this file, RELEASE_REPORT) written. A further determinism bug (time-keyed perception cache) was found by the authors while reproducing the evaluator's save defect.

### Not addressed (honest list)
Military outcomes are still mostly static fronts with parameter-driven endings (the player *can* order individual formations and take manual control — round 1's contrary claim was wrong); replay variety is limited (few wars per decade, same rivalries); no real iOS/device verification; AI fog-of-war lint is a regex check; map and UI visual polish is functional rather than distinctive.

## Round 2 — independent evaluation of commit `616e6b6` (verbatim: `docs/REVIEW_ROUND2.md`)

| Category | Weight | Round 1 | Round 2 | Counted? |
|---|---|---|---|---|
| Strategic depth | 15 % | 5.5 | 6.0 | yes |
| Economic realism | 12 % | 5.5 | 6.3 | yes |
| Military / logistics | 12 % | 4.8 | 5.3 | yes |
| Diplomacy & world AI | 12 % | 5.8 | 6.0 | yes |
| Emergent behaviour / replayability | 12 % | 4.5 | 5.0 | yes |
| iPhone UX | 12 % | 6.5 | 6.8 | capped: Chromium emulation only, **iOS UNVERIFIED** |
| Visual quality | 8 % | 6.3 | 6.5 | yes (emulation screenshots) |
| Performance / stability / saves | 10 % | 7.0 | 7.3 | capped: desktop only, **device UNVERIFIED** |
| Code quality | 7 % | 5.5 | 6.2 | yes |
| **Weighted total** | | 5.7 | **6.1** (5.9 excluding UX and performance) | |

**Gate status after round 2: NOT PASSED** (every category < 8.0; weighted 6.1 < 8.5). The evaluator confirmed 59/59 unit and 18/18 UI tests, no NaN/exceptions in 11 ten-year runs, bit-identical saves in 32 mid-generator and 36 arbitrary-day cases, and found most round-1 defects FIXED.

### Changes made after round 2 (not yet independently re-scored)
Ceasefires now freeze the lines (occupied land is kept; only other settlements return it) — the evaluator found occupation never survived a ceasefire; the core refuses to serialise a half-processed day (previously only the UI protected against it); the AI's view of other governments' opinion of it is now noisy (the evaluator found an exact leak); touch targets raised to ≥ 44 px (HUD pills 40 px); AI perception look-ups made O(1)/O(allies); stale doc claims corrected (events count, performance figures, lint description, unit-control claim).

### Further changes after round 2 (also not yet independently re-scored)
National projects (16, with AI use), three new scenarios, 33 more rivalries (≈ 1.4–1.7 spontaneous wars per decade in the authors' balance runs, 1.1–1.3 over ~14 pairs in the round-3 evaluator's 48 runs; ≈ 0.6 over 5 pairs before), finer map (681 regions), offensives that concentrate on one thrust, a per-war casualty/territory/stock panel, a nuclear-strike escalation command (AI uses it rarely; round 3 found it unlimited — now expends the arsenal and has a cooldown), real-tap UI tests, regenerated screenshots.

### Evaluator findings that remain open (honest list)
Autoplay wars still do not change borders (AI proposes at most two regions); client states only for targets with ≤ 2 regions; war variety ~0.6 per decade among the same pairs; top-5 economies identical across seeds; median growth still high and China occasionally reaches parity with the USA; Japan collapsed once in 11 runs; war panel is thin; iOS never built and device performance unmeasured; UI tests lean on `window.__app` (69 uses vs 22 real clicks); CI never executed.

## Round 3 — independent evaluation of commit `7828386` (`docs/REVIEW_ROUND3.md`)

| Category | Weight | Round 1 | Round 2 | Round 3 | Counted? |
|---|---|---|---|---|---|
| Strategic depth | 15 % | 5.5 | 6.0 | 6.2 | yes |
| Economic realism | 12 % | 5.5 | 6.3 | 6.2 | yes |
| Military / logistics | 12 % | 4.8 | 5.3 | 5.8 | yes |
| Diplomacy & world AI | 12 % | 5.8 | 6.0 | 6.2 | yes |
| Emergent behaviour / replayability | 12 % | 4.5 | 5.0 | 5.5 | yes |
| iPhone UX | 12 % | 6.5 | 6.8 | 6.3 | capped: Chromium emulation only, **iOS UNVERIFIED** |
| Visual quality | 8 % | 6.3 | 6.5 | 6.6 | yes |
| Performance / stability / saves | 10 % | 7.0 | 7.3 | 7.3 | capped: desktop only, **device UNVERIFIED** |
| Code quality | 7 % | 5.5 | 6.2 | 6.3 | yes |
| **Weighted total** | | 5.7 | 6.1 | **6.2** (6.1 excluding UX and performance) | |

**Gate status after round 3: NOT PASSED.** The evaluator found new bugs in the round-2/3 features, all addressed afterwards (not yet re-scored): the Projects tab rendered the Society block; the nuclear strike was unlimited; the confirmation dialogs used native `confirm()` (dead in WKWebView) — replaced by an in-app dialog; frozen occupation never resolved and crippled Ukraine (now resolved when the ceasefire expires; outside war aid added); phantom 0-casualty wars lasted for years (now lapse into ceasefires); client states extended to ≤ 3-region targets; touch targets raised to 44 px (play, speed, close, pills); dead code in `peace.js` removed; stale doc counts fixed.

## Score-change log (permanent)

| Date | Event | Strategic | Economic | Military | Diplomacy/AI | Emergent | UX | Visual | Perf/Stab | Code | Weighted | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-10-11 | Round 1 independent review, commit 0428cfe | 5.5 | 5.5 | 4.8 | 5.8 | 4.5 | 6.5* | 6.3 | 7.0* | 5.5 | 5.7 | docs/REVIEW_ROUND1.md |
| 2026-10-11 | Round 2 independent review, commit 616e6b6 | 6.0 | 6.3 | 5.3 | 6.0 | 5.0 | 6.8* | 6.5 | 7.3* | 6.2 | 6.1 | docs/REVIEW_ROUND2.md |
| 2026-10-11 | Round 3 independent review, commit 7828386 | 6.2 | 6.2 | 5.8 | 6.2 | 5.5 | 6.3* | 6.6 | 7.3* | 6.3 | 6.2 | docs/REVIEW_ROUND3.md |

\* capped/unverified: emulation or desktop-only evidence.
