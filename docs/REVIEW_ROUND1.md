<!-- Verbatim output of the independent evaluator (fresh-context sub-agent) on commit 0428cfe. Not edited by the authors. -->
# MODERN AGE - independent evaluation (branch claude/modern-age-grand-strategy-yrcmiw, commit 0428cfe)

## 1. Verified results (what I actually ran)
- `npm run test:fast`: 55/55 pass, 38.5 s. `node tools/validate-data.mjs`: pass (175 roster rows, 525 regions, 67 techs, 55 events, 14 orgs, 3 scenarios).
- `node --test tests/ui/ui.test.js` (Playwright/Chromium emulation): run 1 = 14/15 (test 14 "saves screen" timed out, because a decision-event modal #overlay[data-lock] intercepted the Load tap; I was running sim probes in parallel). Isolated rerun of that test = pass; full rerun = 15/15 in ~95 s. So the UI suite is timing-flaky, not broken.
- `node tools/bench.mjs 12` (Xeon 2.1 GHz x4, Node 22): 159.8 ms per simulated month (docs say 100-160), slices median 0.31 / p95 7.7 / p99 14.2 / max 32.3 ms; save 3.05 MB, serialize 50 ms, deserialize 150 ms, heap 38 MB; new game 189 ms.
- Own sim probes (10 y, 3 scenarios x several seeds, autoAI on the player): 0 non-finite values anywhere, no exceptions. World GDP x1.32-1.46 (3.6-3.9 %/yr), median country growth 3.6-4.5 %/yr, median inflation 2.4-3.6 %, max inflation 72 % (UKR after collapses).
- Determinism: equal seeds identical, different seeds differ. Save->load->continue: full deep-compare of sim.state after 18 further months is identical (only the rngState snapshot field differs, because it is written at serialize time). Matches docs.
- Own Playwright session (iPhone 14 emulation, real taps): menu 165 ms, new game 418 ms; 15 s at x40 averaged 56 fps with max frame gap 117 ms (software rendering); 40 s at x40 advanced 1272 days; no console errors; screens, proposals (10 treaty kinds with odds and "Why?"), peace builder, policy sliders, save slots all worked. Screenshots in `scratchpad/review/p*.png`, `q01-slider.png`.
- Repo counts check out: 168 playable countries, 1268 formations (569 land / 512 air / 187 sea), 8 intel ops, 525 regions, 53 sea zones.

## 2. Scores (0-10, harsh)

| Category | Weight | Score |
|---|---|---|
| Strategic depth | 15% | 5.5 |
| Economic realism | 12% | 5.5 |
| Military/logistics | 12% | 4.8 |
| Diplomacy & world AI | 12% | 5.8 |
| Emergent behaviour/replayability | 12% | 4.5 |
| iPhone UX (Chromium emulation only) | 12% | 6.5 (capped; iOS UNVERIFIED) |
| Visual quality | 8% | 6.3 |
| Performance/stability/saves | 10% | 7.0 desktop-only; device perf UNVERIFIED |
| Code quality | 7% | 5.5 |

**Weighted total: 5.7 / 10** (all nine categories included, with UX and performance capped as emulation/desktop only). Excluding the two partly-unverifiable categories and renormalising: **5.4 / 10**. Nothing about real iOS (WKWebView, IndexedDB under app://, thermals, memory) is verified, so no category is scored on that.

### Strategic depth - 5.5
- 11 policy levers with political-capital costs and lag (commands.js:19-41) plus budget, focus, research, doctrine. Levers are not cosmetic: DEU 5 y quiet_decade, tax 0.30 gives GDP 5582 (+5 %), debt 94 %; tax 0.50 gives GDP 4216 (-21 %), unemployment 12.8 %; spendRate 0.55 gives debt 149 %. Real trade-offs exist.
- But `policyRate` 0.12 vs default changes almost nothing (GDP 5392 vs 5315, inflation 2.4 vs 2.5); cleanPriority, immigration and mobilize are near-neutral in 5 y. A handful of fiscal levers dominate.
- Conquest has no payoff: in all ~16 runs and 5 player-driven wars (CHN-TWN, USA-CUB, IND-PAK...), zero regions changed owner. `capitulate()` (war.js:532) leaves the capital region with the loser, so a one-region state costs only reparations and demilitarisation.
- Nukes are a rating only (KNOWN_ISSUES 9); wars are auto-deployed (stance + objective only), so "strategy" in war is thin.
- The 10-year fixed horizon plus 6 victory paths gives goals, but the AI-autopilot outcomes are similar to a passive player (BRA 5 y: passive GDP 2600 vs autoAI 2667).
- Fixes: make conquest matter (annex or puppet on capitulation, partial occupation payoffs); give rate/immigration/clean levers measurable effects; let the player direct operations beyond stances.

### Economic realism - 5.5
- Substantive model (Solow-style output, Phillips curve, debt/bond yield, trade clearing, chokepoints, FX); invariants tested; no NaN/runaways in my 10 y runs.
- Optimistic and homogeneous: CHN GDP 18.7T to 36.5T in 10 y (about 6.9 %/yr nominal), reaching parity with the USA in all seeds; median growth 4.3-4.5 %/yr (docs concede this, KNOWN_ISSUES 5).
- Debt deflates almost everywhere under the AI fiscal rule (CHN 85 to 41 %, DEU 64 to 34 %, median 28-33 % in BALANCE_REPORT) - not a realistic decade. Japan collapses in 3 of 9 documented runs, and I saw JPN at 13.9 % unemployment and 295 % debt in quiet_decade seed 11.
- Tariff 25 % lowered inflation (2.5 to 0.8 %) and GDP -8 %; a deflationary tariff is questionable. Tax +8 points costing -21 % GDP looks over-sensitive.
- Fixes: calibrate China and median growth down; add debt dynamics that do not auto-consolidate; recheck the policyRate transmission and tariff-inflation sign.

### Military / logistics - 4.8
- Real structure: 1268 formations across land/air/sea, supply, strait/amphibious rules, exhaustion, war score, peace terms with transparent acceptance (war.js 632 lines).
- Outcomes look scripted-by-parameters: wars end in 4-15 months by "negotiated peace" or "separate peace"; USA vs Cuba sat at war score 31/0 for 15 months with no progress; China-Taiwan ended by capitulation within 4 months while the borders did not change. Territory never changes hands.
- AI does not command forces (war.js header: deployment automatic); no combined-arms planning (KNOWN_ISSUES 8).
- Only ~0.7-1 war per decade in autoplay (docs also say 0.7).
- I did not verify supply-line behaviour at unit level beyond the tests.
- Fixes: let wars alter borders; add manual operational control or at least objective chains; raise war variety.

### Diplomacy & world AI - 5.8
- Good: opinion/trust matrices, 14 orgs, treaties with "Why?" factor breakdown and acceptance probability (screenshot p11-dip-pol.png), UN resolutions, sanctions, call-to-arms. Perception layer gives noisy intel (`perceive`, tested: noise shrinks with networks). AI uses `sim.exec`, the same commands as the player. Same inputs, fully deterministic.
- Fog of war is only weakly enforced: `ai_lint.test.js` is regex greps over four files, and one assertion ends in `|| true` (line 16), so it can never fail. `buildView` also hands the AI `theirOpinion` of itself, and war scores/region control are read as public.
- AI-proposed peace is forced on the human (see defect 1).
- AI is reactive utility maximisation; the world is quiet: 0-2 wars per decade, the same big-5 each seed.
- Fixes: ask the human to accept/decline peace offers; replace grep lint with a runtime access-guard; add AI coalitions and longer plans.

### Emergent behaviour / replayability - 4.5
- Seeds mostly change who collapses (UKR, JPN, TWN, POL, USA...) and which of the same few wars happen; top-5 economies are CHN/USA/DEU/IND/JPN in nearly every run; zero territorial change in all runs.
- Event mix: rolling_blackouts + fuel_shortage + heatwave dominate (about 25 % of events; 22+19+12 in one run); ~55 authored events.
- Regime collapses (about 2 per decade) are the main source of drama. USA collapsed in 2 of 3 quiet_decade seeds I ran (202, 203) with autoAI, a case the docs' collapse list (UKR, JPN, TWN, MNG) does not mention.
- 3 scenarios, difficulty and seed give some variety. In a 10-year autoplay there is little cross-run difference.
- Fixes: more varied war/territory outcomes, wider event pool with state-dependent chains, lower the collapse rate in rich democracies.

### iPhone UX (Chromium emulation only; iOS UNVERIFIED) - 6.5
- Clean bottom-sheet architecture, 6-tab bar, big controls (>= 38-44 px asserted), safe-area handling, text size, colour-blind and high-contrast modes, layouts tested at 5 sizes with no horizontal overflow. Pinch is tested with CDP touch.
- Policy sliders commit on release: a single stray tap at 85 % of the tax slider changed tax 0.254 to 0.44 and spent 14.6 PC with no confirmation (q01 probe); one drag then spent 20.4 PC. The preview text exists only while dragging.
- The HUD pill row scrolls horizontally and clips (GDP cut off in every screenshot); a toast "Not possible - no such decision" appeared when a decision timed out under a tap (p13-later.png); chart y-axis labels clipped on the left (p15-stats.png).
- Dense screens (diplomacy, military) are long scroll lists. The modal decision overlay blocks everything until answered, which is fine but caused the flaky UI test.
- Fixes: confirm or undo for large policy changes; wrap HUD pills; real-device test.

### Visual quality - 6.3
- Consistent dark design system, original icons, legible typography (screenshots iphone14-07-economy-overview.png, iphone14-07-diplomacy-relations.png).
- Map: country colours are an arbitrary 5-colour palette (Germany and UK both blue, Switzerland red), so colour carries no meaning in the political mode; labels collide/clip (iphone14-04-map.png "Ukr..." under controls; iphoneSE-06-front.png unit chips overlapping labels); sheet peeks "Norway/Finland" text through at the top in iphoneSE-05-war.png.
- Day-0 military "Budget use" shows Personnel/Operations/Procurement $0 (iphone14-07-military-overview.png; the same class as BUGS #14 "fixed" for the economy; confirmed budget = 0 at t0 and 26-33 B at +2 months).
- No sprites/animation/terrain art (admitted in KNOWN_ISSUES 17). Landscape: tab bar and map OK, HUD pills hidden.

### Performance / stability / saves - 7.0 (desktop only; device UNVERIFIED)
- Zero NaN or exceptions in about 30 simulated game-decades across my runs; saves validated with checksum and migration; corrupt saves rejected by tests; double-buffered autosave tested after reload.
- 160 ms/month desktop, worst slice 32 ms; 56 fps headless at x40. Phone speed, memory and thermals are unknown; the claim "A15 is comparable" is an expectation only.
- Defect: saving while the monthly generator is suspended loses the rest of that month (defect 2).
- Test suite is timing-flaky (UI test 14).
- Fixes: save only at generator boundaries; real-device profiling.

### Code quality - 5.5
- Clear layering (sim/ai/ui/data), pure deterministic core, schema-validated command layer, data-driven content, 55 unit and 15 UI tests, data validator, CI file (never run).
- Density: lines up to 1281 chars (events.js), 36 lines over 200 chars in ui/app.js, 28 in war.js; UI screens are giant template-literal one-liners; hard to review or diff.
- ~35 scratch scripts in `tools/dev/` (probe*.mjs, jpn*.mjs...); unrelated `cube.html` in the repo root; ai_lint test has a vacuous assertion; UI tests largely shortcut via `window.__app` rather than real taps.
- `ios/ModernAge/www/` is a gitignored, stale copy that differs from `app/` (war.js, economy.js, diplomacy.js...) - harmless to git but a trap for local builds.
- Fixes: format with prettier, split mega-lines, delete tools/dev, make the lint a runtime guard.

## 3. Ranked defects and risks
1. **Major - AI peace forced on human.** `ai/war.js:80` calls `proposePeace` with target = human; `war.js:604` evaluates acceptance from the human's exhaustion/stability and applies terms immediately, with no prompt. Repro: player IND declares war on PAK, stance attack; at day 243 PAK "proposes" a ceasefire, margin +29, war ends in month 8 and the player is awarded "Peacemaker" (probe8.mjs). Removes player agency over wars.
2. **Major - Save mid-month loses part of the month.** `stepGen` (world.js:232-246) increments `st.day` first and yields during `monthlyGen`; `app.js` autosaves on pause/visibility/pagehide and at interval (app.js:35,36,80) and the manual save serializes without checking `this.gen`. Loading resumes without the remaining monthly phases: resumed state != uninterrupted state (probe4.mjs, k=3/10/20 yields all diverge). Silent and not covered by the tests (they save at month boundaries).
3. **Major - Conquest never changes borders** (0 regions in ~16 runs; `capitulate` keeps the capital with the loser; AI peace asks at most 2 regions only when adv > 15, ai/war.js:73). Core strategy loop is toothless.
4. **Major - iOS never built/run** (WKWebView, IndexedDB under `app://`, audio unlock, safe areas are untested). Entire iOS claim unverified.
5. **Major - Device performance, memory, thermals unmeasured**; 160 ms/month with 32 ms worst slice on a desktop Xeon.
6. **Major - Economy optimism/homogeneity:** CHN reaches USA parity every seed; debt deflates everywhere; policy rate lever near-inert.
7. **Major - Low war and event variety:** 0-2 wars per decade, repeating pairs; blackout/fuel/heat events about 25 %.
8. **Major - USA regime collapse in 2 of 3 quiet_decade autoplay seeds** (seeds 202, 203), plus JPN collapses (docs: 3 of 9).
9. **Minor - Flaky UI test 14** (`tests/ui/ui.test.js:151`): `advanceMonths(2)` can fire a modal decision that blocks the Load tap; failed under CPU load.
10. **Minor - Slider tap commits immediately** with large PC spend (economy.js fiscal sliders); no undo/confirm.
11. **Minor - Day-0 military budget displays $0** (`military.js:25`; `m.budget` initialised to zeros).
12. **Minor - Weak/vacuous AI lint** (`tests/unit/ai_lint.test.js:16` `|| true`; regex-only).
13. **Minor - Fog of war leaks:** `buildView` exposes `theirOpinion`; war scores public; AI home-country data exact.
14. **Minor - "Not possible: no such decision" toast** when tapping an expired decision option.
15. **Minor - Map readability:** arbitrary country colours, label collisions, HUD pills clipped (GDP cut off).
16. **Minor - Chart axis labels clipped** (Stats screen y-axis).
17. **Minor - Missing referenced docs:** `docs/RELEASE_REPORT.md` and `docs/SCORECARD.md` do not exist (README, AGENTS.md, TESTING.md, TASKBOARD.md, tools/release-check.mjs reference them).
18. **Minor - Repo hygiene:** `cube.html` (unrelated "Steel Cube") in root; 35 scratch files in tools/dev; minified-style lines up to 1281 chars.
19. **Minor - Stale `ios/ModernAge/www`** differs from `app/` (gitignored but used by Xcode build unless `tools/ios-sync.sh` is run).
20. **Minor - Placeholder bundle id `com.example.modernage`, `UNLICENSED`, blank signing team**, CI never run, `sw.js` VERSION bump is manual (docs admit this).
21. **Minor - Wars cannot be directed at unit level;** AI/human deployment automatic. Nukes are a rating only.
22. **Minor - Cross-engine float determinism not guaranteed** (admitted); a seed may differ on iOS JavaScriptCore versus V8.

## 4. Overstated or unsupported documentation claims
- README links `docs/RELEASE_REPORT.md` and describes a "scorecard"; AGENTS.md says an independent evaluator wrote SCORECARD.md - neither file exists in the repo.
- ARCHITECTURE "AI fog of war ... fails the build if AI modules read another country's true state": the test is a regex over four files with a vacuous assertion, and the perception layer still passes some exact fields (theirOpinion, war scores).
- ARCHITECTURE "every claim about simulation behaviour is backed by a test or a measured run": not true for save-while-suspended, peace imposition, or conquest payoff.
- README "Fight wars ... occupation, capitulation ... negotiated peace with transparent acceptance factors": true, but omits that AI-initiated peace is applied to the human without consent and that no border ever changed in my runs.
- README/ARCHITECTURE state the sheet/HUD "keeps scrolling smooth", ">= 44 pt targets": the test asserts >= 38 px, and smoothness was measured only under software rendering; the docs do flag device performance as unmeasured (this is honest).
- BUGS #14 marks the day-0 zero-budget display "Fixed", yet the military overview still shows $0 at day 0 (shipped screenshot iphone14-07-military-overview.png).
- BALANCE_REPORT collapse list omits USA collapses seen in my seeds; "median debt/GDP 28-33 %" is presented as validation although debt falls unrealistically for large economies.
- Positive honesty notes: iOS never compiled, desktop-only performance, Chromium-only UI evidence, optimistic growth, Japan fragility and AI limits are all clearly disclosed in README/KNOWN_ISSUES; I found no fabricated evidence. Test counts (55 + 15), content counts (168 countries, 1268 formations, 67 techs, 55 events) and the save-determinism claim all verified.
