<!-- Verbatim output of the round-2 independent evaluator (fresh-context sub-agent) on commit 616e6b6. Not edited by the authors. -->
# MODERN AGE - independent evaluation round 2 (commit 616e6b6)

## 1. Verified results (run by me, host: 4 vCPU Xeon 2.8 GHz, Node 22.22)
- `npm run test:fast`: 59/59 pass, 70 s. `node --test tests/ui/ui.test.js`: 18/18 pass, 117 s (no flake; nothing else running). `validate-data`: 7/7 pass (175 roster rows, 525 regions, 67 techs, 82 events, 14 orgs, 3 scenarios). `npx prettier --check app/js app/css tests tools`: clean.
- `bench 12` (fault_lines seed 42): 247-252 ms per simulated month (2 runs) vs docs "125-160" (BALANCE_REPORT itself says 273); slices median 0.65 / p95 11.5 / max 55-95 ms; save 3.08 MB, serialize 105 ms, deserialize 240-270 ms, heap 36-70 MB. Docs' perf numbers are optimistic for this host.
- UI at x40 (software rendering, headless, idle machine): 29.6 fps, p95 frame gap 83 ms, max 183 ms, 353 game days in 15 s (about 23 d/s, below the nominal 40 d/s: CPU-bound). x12 under load: 55 fps.
- Own probes: 11 ten-year autoAI runs (3 scenarios, players USA/DEU/BRA/CHN) = 0 non-finite values, 0 exceptions.

## 2. Round-1 defects re-verified
| # | Round-1 defect | Verdict | Evidence |
|---|---|---|---|
| 1 | AI peace imposed on human | FIXED | War IND-PAK / BRA-ARG with me never answering for 18 months: war still active, 3-4 "offers terms" logs, 1 pending offer, no Peacemaker. 33 forced-war runs: 22-25 offers per run were declinable via `answerOffer`; UI test shows modal with accept/decline. |
| 2 | Save during suspended monthly generator | FIXED (in App layer) | `App.snapshot()` settles first (app.js:202-209; only one `serialize` call site in UI). Probe: suspend `stepGen` after 1/3/10/20 yields at month boundaries, settle, serialize, load, continue 6 months: 0 of 32 diverge (4 seed/scenario/player combos x 2 start months x 4 yield points). Raw unsettled save still diverges (2 of 2), so the sim layer itself is not safe; safety relies on every caller going through `snapshot`. Arbitrary-day saves (6 seeds, 3 scenarios, 6 players): all bit-identical after 5 months. |
| 3 | Conquest never changes borders | PARTLY | 33 forced human wars (12 pairs x 3 seeds): 5 changed region ownership, 15 produced client states (e.g. CHN-VNM, ISR-SYR, RUS-GEO, CHN-TWN become clients; RUS-UKR cedes 1 region). But in 15 autoplay decades (about 11 wars) 0 regions ever changed hands; AI wars end "negotiated peace" or capitulation with no payoff. Every ceasefire reverts all occupied land to its pre-war owner (war.js:1209-1218), so even RUS-UKR in Fault Lines always ends in a white peace (20 months, seeds 5/6/201...). Client states are only created for countries with <=2 regions (war.js:1006). |
| 4 | iOS never built | NOT FIXED / UNVERIFIED | `ios/` still uncompiled; ios/ModernAge/www stale gitignored copy still present. Honestly disclosed. |
| 5 | Device perf unmeasured | NOT FIXED / UNVERIFIED | Only desktop numbers; this host is slower than the docs' (250 vs 125-160 ms/month). |
| 6 | Economy optimism/homogeneity | PARTLY | 10-year runs: world 3.2-3.7 %/yr (was 3.6-3.9), median country 4.0-4.4 % (was 3.6-4.5), USA 1.1-2.0 %, CHN 5.2-6.3 % (was 6.9). CHN GDP ahead of USA in 2 of 11 runs, near parity in others (33.0T vs 32.6T). Median debt/GDP flat 39->41 % (no longer deflates), but CHN 85->46-72 %, IND 82->46-67 %, JPN 240->193-241 %. Median inflation 3.0-3.6 %, p95 5-8 %, max 8-15 % (was 72 %). Median unemployment 6.6-7.6 %. JPN collapsed once in 11 runs (fault_lines s201: -3.0 %/yr, debt 383 %, unemployment 21.7 %). Still on the high side for median growth. |
| 7 | Low war/event variety | NOT FIXED | Spontaneous wars: 7 in 11 ten-year runs (0.6/decade): Russia-Ukraine (scenario), China-Vietnam, Israel-Syria, Thailand-Cambodia, Pakistan-Afghanistan. Regime collapses 0-2 per run (UKR/POL/KHM/TWN). Top-5 economies USA/CHN/DEU/IND/JPN in every run. FRA autoplay logs only 50-60 player-visible events and 18-21 distinct ids of 82 per decade. |
| 8 | USA collapses in quiet_decade seeds | FIXED (not observed) | 0 USA collapses in 11 runs (round-1 seeds 202/203 not re-run). |
| 9 | Flaky UI test 14 | FIXED (not reproduced) | 18/18 on idle run; `clearModals` helper added. Not stress-tested under CPU load. |
| 10 | Slider tap commits instantly | FIXED | Real touchscreen tap at 90 % of the tariff slider: confirmation modal "9 % -> 32 % costs 11.8 political capital (you have 41). Confirm / Cancel"; PC unchanged before confirming (nation.js:11-20). |
| 11 | Day-0 military budget $0 | FIXED | Fresh game military overview: Budget $47.5B, Personnel/Operations/Procurement $14.3/14.3/19.0B. |
| 12 | `|| true` lint | FIXED (that assertion) | Removed; lint still regex over 4 files (see section 5). |
| 13 | Fog leaks (`theirOpinion`) | NOT FIXED | perception.js:33 still exposes exact `theirOpinion`; used in ai/diplo.js:23,38,50 and ai.js:122, ai/spy.js:9. War scores/region control also public. |
| 14 | Expired decision toast | FIXED (not directly provoked; per BUGS #26). |
| 15 | Map readability / HUD clipped | PARTLY | Adjacent countries now get different colours; GDP pill is still clipped in my own and the shipped screenshots (row scrolls sideways); "Ukr..." label under controls; unit chips overlap labels; a dark horizontal band artefact crosses Brazil/Bolivia at the equator; stacked toasts cover a third of the map. |
| 16 | Chart axis clipped | FIXED | My Stats screenshot shows full "$2.21T" labels. |
| 17 | Missing docs | FIXED | RELEASE_REPORT.md and SCORECARD.md exist and are candid. |
| 18 | Repo hygiene | PARTLY | tools/dev gone, Prettier applied (max line now 985 chars, 102 lines >200). `cube.html` still in root; empty `tests/integration/`. |
| 19-22 | Stale www, placeholder bundle id, CI never run, float determinism | NOT FIXED | Disclosed in KNOWN_ISSUES. |

Policy levers (5 y, DEU/BRA, PC topped up, vs baseline GDP 5112 / 2624):
- policyRate 0 -> inflation 15.5 %, GDP +14 %, debt 27 %; 12 % -> inflation -4.9 %, unemployment 9 %, debt 144 % (very strong, previously inert).
- tariff 25 % -> tariff revenue 45->209B, imports -6 %, BRA GDP -4.6 % (2502 vs 2624), unemployment +1.4 pt, inflation +0.5 pt (now inflationary, was deflationary); DEU GDP -5.5 % vs tariff 0.
- taxRate 0.15 -> GDP +12 %, debt 171 %; taxRate 0.40 -> GDP +4 %, debt 55 %.
- cleanPriority 1 vs 0 -> emissions -14 % (DEU 958 vs 1108), -10 % (BRA 340 vs 379), GDP +1.5-2 %.
- immigration 1 vs 0 -> weak and inconsistent sign (DEU s2 GDP 5367 vs 5380; BRA 2544 vs 2593 with +0.4 pt inflation, stability -7 pt). Smallest lever.
Verdict: FIXED for rate/tariff/tax/clean; immigration weak.

## 3. Scores (0-10, harsh)
| Category | Weight | Score | Note |
|---|---|---|---|
| Strategic depth | 15 % | 6.0 | |
| Economic realism | 12 % | 6.3 | |
| Military / logistics | 12 % | 5.3 | |
| Diplomacy & world AI | 12 % | 6.0 | |
| Emergent / replayability | 12 % | 5.0 | |
| iPhone UX | 12 % | 6.8 | CAPPED: Chromium emulation only; iOS UNVERIFIED |
| Visual quality | 8 % | 6.5 | screenshots are emulation |
| Performance / stability / saves | 10 % | 7.3 | CAPPED: desktop only; device UNVERIFIED |
| Code quality | 7 % | 6.2 | |

**Weighted total 6.1 / 10** (all nine included; UX and performance capped as emulation/desktop evidence). Excluding those two and renormalising: **5.9 / 10**. Round 1 was 5.7 (5.4). Nothing on real iOS is scored.

### Strategic depth - 6.0
- 11 levers with PC cost, lag, preview and now confirmation; rate, tariff, tax, clean levers have large measurable effects with plausible signs (see above). Fiscal/monetary trade-offs are real (rate 12 % gives deflation + debt 144 %).
- Player can direct individual formations (moveForce, attackRegion, setOrder in screens/military.js:332-432) plus manual-control toggle; the docs' claim "cannot command units" is stale in the pessimistic direction.
- Conquest consequences exist for human wars (client states, cession of occupied regions on capitulation) but ceasefire reverts everything; no nukes (rating only); fixed 8-10 year horizon; war UI is a score bar, side, casualties (showed "0k casualties, 0 vs 0" at 7 months of the Russia-Ukraine war).
- Autopilot vs passive player difference is still small except fiscal levers.
- Top fixes: ceasefires should keep occupied land (uti possidetis) or require cession; make client/annex outcomes apply to AI wars; give nukes/escalation a mechanic.

### Economic realism - 6.3
- Stock-flow and accounting invariants tested (59 tests), no NaN, no runaway in 11 decades; inflation now bounded (max 8-15 %).
- USA 1.1-2.0 %, CHN 5.2-6.3 %, world 3.2-3.7 %, but median growth 4.0-4.4 % and 2/11 runs have CHN overtaking USA nominally within 10 years; median debt roughly flat but large high-debt economies (CHN, IND) still deflate their debt by 15-40 pt.
- JPN fragility persists (1 collapse in 11 runs, 383 % debt); USA debt rises in several runs (120->145-157 %).
- Tariff now raises inflation and lowers GDP (fixed sign); policy rate transmission strong, perhaps too strong (12 % rate -> -4.9 % inflation, +90 pt debt in 5 y).
- Top fixes: lower median growth, add convergence heterogeneity, damp rate-to-debt channel, test JPN-type fragility.

### Military / logistics - 5.3
- Real mechanics: supply with floor in home territory, terrain, strait/amphibious rules, exhaustion, war score, capitulation, peace terms with acceptance factors; tests on logistics/terrain.
- Outcomes remain templated: forced wars end by capitulation in 2-4 months for tiny opponents (RUS-GEO 2-3 m, ISR-SYR 3-4 m, CHN-TWN 4-7 m) or stalemate beyond 36 months for IND-PAK, BRA-ARG, SAU-IRN, ETH-ERI (score -20/20, -16/16).
- Autoplay: 0 territory transfers in 15 decades; ceasefire erases occupation (war.js:1209-1218); AI proposes at most 2 regions (ai/war.js:73-82).
- Wars 0.6/decade; AI deployment automatic; no combined-arms planning; the Forces screen is only a list.
- Top fixes: territory-keeping peace, AI offensives that actually conclude, war-theatre UI.

### Diplomacy & world AI - 6.0
- Same command layer for AI and player; proposals show odds and "Why?" (screenshot: Trade agreement 66 % likely); offers to the human are now answerable; UN resolutions, 14 organisations, sanctions, call-to-arms.
- AI is reactive utility maximisation with PC cost for war (30 PC like the player). Same few conflicts recur.
- Fog of war: perception is a hash-based noisy multiple of the truth (intel.js:101-138, stateless, deterministic, narrower with networks). But `theirOpinion` is exact; war scores public; `ai/ai.js` and `perception.js` are not covered by the lint; the lint is a regex over four files (ai_lint.test.js:8-20). ARCHITECTURE says it "fails the build if AI modules read another country's true state" - overstated.
- Top fixes: runtime guard (Proxy) for AI state access; perceive opinion; coalition/long-horizon AI.

### Emergent behaviour / replayability - 5.0
- Seeds change who collapses and which of the same 4-5 wars occur; same top-5 economies every run; 18-21 distinct events per decade for one country.
- Scenario variety exists (3), but 10-year autoplay differences are small; no territorial drift among AI.
- Top fixes: territory outcomes in AI wars, more state-dependent event chains, more rival pairs and civil conflicts.

### iPhone UX (Chromium emulation; iOS UNVERIFIED) - 6.8
- Clear 6-tab bottom-sheet architecture, tutorial coach marks, confirm modal on expensive changes, search-based new game wizard, objectives screen, accessibility settings. 18 UI tests pass; no console errors in my sessions.
- Touch targets: HUD pills 32 px high, sheet tabs 36 px, close button 38 px (all < 44 pt HIG). GDP pill clipped, needs sideways scroll.
- Toast stack of 3 covers a third of the map; war screen after 7 months showed "0 vs 0" which is not informative; tab bar highlights "More" while a diplomacy country sheet is open.
- Dense but readable; a new player gets coach marks but still faces 11 levers and 8+ screens with little guided goal beyond "Objectives".

### Visual quality - 6.5
- Consistent dark design, legible type, nice economy/diplomacy/military cards (my screenshots and docs/screenshots). Charts have correct axes now.
- Map: country colours decorative but adjacent countries now differ; labels collide/clipped; dark equatorial band artefact; the new-game UKR card has a grey rectangular highlight artefact; no sprites/terrain art (disclosed).

### Performance / stability / saves - 7.3 (desktop only; UNVERIFIED on device)
- 0 NaN, 0 exceptions; save/load bit-identical in 32 settle-at-yield cases and 36 arbitrary-day cases; corrupt saves tested; autosave UI test.
- 250 ms/month sim on this host (about 2x the docs); x40 reaches only about 23 d/s at about 30 fps in software rendering; worst slice 55-95 ms (spikes visible: max frame gap 183 ms).
- The sim API itself still allows unsafe mid-month serialisation (App guards it).

### Code quality - 6.2
- Prettier clean, layering (sim/ai/ui/data), command layer, data validator, 59 unit tests with meaningful assertions (conservation, calibration, determinism, peace offers, client states) + 18 UI tests.
- Weaknesses: war.js 1230 lines, 102 lines >200 chars (e.g. military.js 985-char template line), UI tests use `window.__app` 69 times vs 22 real clicks, regex AI lint, `cube.html` in root, empty tests/integration dir, stale ios www copy, CI never run.

## 4. Ranked defects
1. Major - Ceasefire reverts occupied territory; AI wars never change borders in autoplay (war.js:1209-1218; terr probe 0 regions in 15 decades; RUS-UKR always white peace).
2. Major - iOS never built; WKWebView/IndexedDB/safe-area behaviour unverified (ios/).
3. Major - Device performance unmeasured; this host runs 250 ms/month and x40 yields 23 d/s at ~30 fps.
4. Major - Low war/event/replay variety (0.6 wars/decade, same pairs, same top-5).
5. Moderate - Client states only for <=2-region targets (war.js:1006), so large-country conquest still has no lasting effect; stalemates 36+ months (IND-PAK, BRA-ARG).
6. Moderate - Economy still optimistic: median 4.0-4.4 %, CHN near USA parity by 2035, big debts deflate (CHN 85->46-72 %), JPN collapse 1/11 (fault_lines s201).
7. Moderate - Sim-level `serialize` during a suspended generator still diverges (2/2 raw); only the App protects it (world.js:448-466, app.js:202).
8. Moderate - Fog-of-war leak and weak lint: `theirOpinion` exact (perception.js:33); lint regex covers 4 files only (ai_lint.test.js).
9. Minor - Touch targets below 44 pt: pills 32 px, sheet tabs 36 px, close 38 px.
10. Minor - GDP HUD pill clipped, label clipping near controls, toast stack covers map, dark equator band artefact, tab highlight mismatch.
11. Minor - War panel uninformative (score 0 vs 0, casualties 0k at 7 months of Russia-Ukraine).
12. Minor - Immigration lever weak and sign-inconsistent; policyRate perhaps overly strong.
13. Minor - Perf docs stale (125-160 vs 250 ms).
14. Minor - GAMEPLAY.md still says "~55 authored events" (82 now).
15. Minor - `cube.html`, empty `tests/integration/`, stale gitignored `ios/ModernAge/www`.
16. Minor - UI tests shortcut through `window.__app` (69 uses).
17. Minor - Placeholder bundle id/UNLICENSED/CI never run; sw.js VERSION manual.
18. Minor - Cross-engine float determinism not guaranteed (WebKit vs V8) so a seed can differ on device.

## 5. Overstated or unsupported documentation claims
- ARCHITECTURE:43 "fails the build if AI modules read another country's true state": regex over 4 of 6 AI files; `theirOpinion` and war scores are exact.
- SCORECARD/Round-1 "not addressed" says "player cannot command units beyond stances/orders" - actually moveForce/attackRegion/setOrder exist in UI (understated).
- KNOWN_ISSUES/RELEASE_REPORT/BENCHMARK "125-160 ms per month": my 2 runs 247-252 ms; BALANCE_REPORT's own 273 ms contradicts it.
- GAMEPLAY.md "~55 authored events" is stale (validate-data: 82).
- README "client states (puppet terms...)": true but only for tiny targets; "capitulation/occupation" - occupation never persists past a ceasefire.
- BUGS #19 "Fixed" is true at App level only, not in `Sim`.
- D-006 "China ~5.5-6 %" matches (5.2-6.3). "AI governments spend available fiscal space (stops debt ratios deflating)" holds for the median but not for CHN/IND.
- Positive: iOS/device/perf-on-phone disclosures are candid; no fabricated evidence found; counts (59 + 18 tests, 82 events, 168 countries) verified.
