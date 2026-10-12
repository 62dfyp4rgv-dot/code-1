<!-- Output of the round-3 independent evaluator (fresh-context sub-agent) on commit 7828386, transcribed by the authors from the hand-back message (the evaluator could not save the file itself). Content is the evaluator's; layout only was adjusted. -->

# MODERN AGE - independent evaluation round 3 (commit 7828386)

Host: 4 vCPU Xeon 2.8 GHz, Node 22.22, headless Chromium.

## 1. Verified results
- `npm run test:fast`: 67/67 pass, 85 s.
- `node --test tests/ui/ui.test.js`: 20/20 pass, 127 s, idle machine.
- `validate-data`: 7/7 (175 roster rows, 681 regions, 67 techs, 82 events, 14 orgs, 6 scenarios).
- `prettier --check`: clean.
- `bench 12` (fault_lines seed 42; load average about 3 just after the test run): 217 ms per simulated month (round 2: 247-252). Slices median 0.63 / p95 9.1 / max 56 ms. Save 3.09 MB, serialize 67 ms, deserialize 214 ms, heap 43 MB.
- 48 ten-year autoAI runs (6 scenarios x 8 seeds incl. 107/207/307/407; players USA/CHN/DEU/BRA/IND/NGA/JPN/FRA): 0 non-finite values, 0 exceptions.
- Saves: 12/12 arbitrary-day save/load cases bit-identical (6 scenarios x 2 seeds, +150 days). Also identical after a nuclear strike, mid-project (+7 months) and after vassalisation (RUS-GEO).
- Equal seeds give equal state; different seeds differ. Raw `serialize` mid-day throws SaveError, so the core guard works.

## 2. Feature verification
**Projects (16).**
- Rules hold: 10 PC to start, max 2 active, locked by requirements, cancel forfeits spending, no repeats. Modifiers are permanent and saved.
- AI uptake is large: 144-262 projects started or completed per 10-year run, by 107-154 countries.
- Payoff is modest and noisy. DEU with all projects vs none, 3 seeds, 10 years: GDP +3.7 / +1.2 / +4.3 %, debt/GDP +14 / +13 / +19 pts. BRA: +4 % / -2 %, debt +22 / +23 pts.
- Costs only add to debt (no budget line). A real trade-off.
- **Bug: the Projects tab renders the Society block above the project list.** `nation.js:126` is a bare `else`, and the `projects` tab falls into it before `:162` (screenshots 07 and 08). The UI test only regex-matches "Progress", so it passes.

**Scenarios.**
- All six boot, stay finite for 10 years, and survive save/load.
- Start differences: oil 1.70 / gas 2.10, food 1.70, chips 1.45, policy rate 8.3 %. These decay within 18 months; medians of inflation, debt and unemployment across all six end within about 1 pt, and food 1.70 -> 0.98.
- Strait Crisis produced 0 CHN-TWN wars in 8 runs. They play only weakly differently.

**War frequency.**
- 48 runs gave 62 wars = 1.29 per decade, about 1.1 excluding the scripted RUS-UKR war.
- Two batches of 24: seeds 11-14 gave 1.08, seeds 107-407 gave 1.5. Docs claim 1.7-1.8.
- About 14 pairs. TUR-SYR appears in 12/48 runs; CHN-VNM, ISR-SYR, SAU-YEM, PAK-AFG, IRN-AFG, THA-KHM, COD-RWA, SSD-UGA, DZA-MLI and CHN-TWN also occur.

**Territory.**
- Ownership changed in 4/48 autoplay runs (YEM>SAU x2, SOM>ETH, SYR>ISR). Client states: 0/48.
- 38 forced wars: RUS-GEO and CHN-TWN end in capitulation with a client state, ARG<->BRA exchanged land, PAK>IND ceded land in 2/3. RUS-UKR x3, CHN-VNM, ETH-ERI and SAU-YEM end in negotiated peace with 1-3 regions held under a ceasefire.
- Phantom wars: CHN>JPN, CHN>PHL, ISR>IRN, USA>IRN and EGY>ETH ran 48 months with 0 casualties and score 13/0.

**Ceasefire occupation.** Lines freeze (peace.js:144), so frozen conflicts are common. Two problems:
- The occupation lasts for ever. fault_lines runs show 1-4 occupied regions with no war for 3,000+ days. The 4-year truce expires and nothing resolves it.
- The owner keeps paying. `economy.js:437` gives occupied regions an 0.85 output loss and politics counts `occupied` pressure. **Ukraine collapses 1-3 times in every one of 8 fault_lines runs and sits at 36-65 % inflation for 5+ years.** In seed 13 it went 36 -> 59 -> 37 % over 2030-35. This is a new pathology of the round-2 fix.
- No stuck units seen; `relocateStranded` handles them.

**Nuclear strike.**
- Rules: needs nukes and a war with the target, and the region must be enemy-held or adjacent.
- Consequences: kills 2-12 % of population, devastates the region, credibility -35, infamy +40, opinion shift, oil x1.25, investment confidence -0.05 for 36 months.
- **Not single-use.** The nuke stock is never decremented and there is no cooldown. 4 commands in a row all succeeded (UKR pop 37.0 -> 28.9, oil compounding, modifiers stacking). 3 taps on the UI button fired 3 strikes. No retaliation.
- AI use: 0 times in 86 free and forced runs; 2/16 in rigged "losing, capital threatened" runs. "Rare" is honest.
- Save is bit-identical after a strike.

**Peace offers to a human.** Parked for 45 days, never imposed. A fully occupied human still capitulates automatically, with reparations and no client state (`war.js:1021` excludes the player).

**Economy over 10 years (48 runs).**
- Growth: world 2.9-3.8 %/yr, median country 3.8-4.4 % (unchanged). USA 0.6-2.4 % (8/48 below 1 %). CHN 4.3-7.0 %, passing USA nominally in 6/48.
- Median inflation 0.8-5.0 %, median debt 39 -> 42-52 %, unemployment 6.6-7.9 %.
- Inflation outliers of 19-65 % are always Ukraine.
- JPN had -2.6 % and -0.8 % plus a collapse, 303 % debt. USA regime collapse in 3/48; RUS and POL once each.
- Top-5 economies are always USA/CHN/DEU/IND/JPN (or GBR).

## 3. UI via Playwright (iPhone 14, Chromium emulation)
- All 6 scenarios are selectable. New games (strait_crisis/TWN, long_drought/BRA, debt_reckoning/FJI and JPN, fault_lines/RUS) start with no console errors.
- Real taps: tab bar and sheet tabs work. Sizes: sheet tabs 44, tab bar 58, country chip 44. **Pills 40, play 40, speed 48x40, sheet close 38** (claim is 44).
- The nuclear button is 44 px high, but its confirmation is a native `window.confirm()` (`app.js:696`). Headless Chromium auto-dismisses it, so the tap does nothing unless a dialog handler is added. `ios/` has no WKUIDelegate (grep). On WKWebView `confirm()` would return false, silently killing cancel-project and nuclear strike. Unverified on device.
- War panel (RUS-UKR, 14 months): score 42 vs 1, casualties you 103k / enemy 311k, "you hold 1 · they hold 1", ammo/fuel, exhaustion. Informative now; the shipped 8-month screenshot still reads 0 vs 0.
- Map: antimeridian rings (Kamchatka, Chukotka, Fiji) draw without streaks. The dark equatorial band over Brazil is gone. Adjacent countries differ in colour.
- Map remaining issues: labels clipped at screen edges ("Arg", "Vene"); GDP pill still scrolls sideways (now with a fade); view clamped at ±180 (no wrap); 2 toasts cover about 25 % of the map and overlap the sheet.

## 4. Round-2 open items
- Ceasefire reverts occupation: FIXED, with side effects (endless occupation, Ukraine collapse loop).
- Autoplay wars never change borders: PARTLY (4/48 runs; forced wars do).
- Client states only for <= 2 regions: NOT FIXED (`war.js:1042`; 0/48 autoplay).
- War variety 0.6/decade: PARTLY (1.1-1.3, about 14 pairs).
- Fog leak `theirOpinion`: FIXED (noisy by month and network). War scores and region control are still public.
- Raw serialize mid-day: FIXED. Dark equator band: FIXED. War panel thin: MOSTLY FIXED.
- Touch targets: PARTLY (pills/play/speed 40, close 38). Toast/pill clip: PARTLY.
- Economy calibration, top-5 identical, JPN fragility: NOT FIXED.
- Stale docs and `cube.html`: PARTLY (`cube.html` still in root; "525 regions" and "59/18 tests" still quoted).
- UI tests leaning on `window.__app`: PARTLY (74 uses vs 28 taps/clicks; one real-tap test).
- iOS never built, device performance unmeasured, CI never run: NOT FIXED, disclosed. Regex AI lint: unchanged.

## 5. Scores (0-10, harsh)
| Category | Weight | Score | Note |
|---|---|---|---|
| Strategic depth | 15 % | 6.2 | |
| Economic realism | 12 % | 6.2 | |
| Military / logistics | 12 % | 5.8 | |
| Diplomacy & world AI | 12 % | 6.2 | |
| Emergent / replayability | 12 % | 5.5 | |
| iPhone UX | 12 % | 6.3 | CAPPED: Chromium emulation only; iOS UNVERIFIED |
| Visual quality | 8 % | 6.6 | emulation screenshots |
| Performance / stability / saves | 10 % | 7.3 | CAPPED: desktop only; device UNVERIFIED |
| Code quality | 7 % | 6.3 | |

**Weighted total 6.2 / 10** (round 2: 6.1, round 1: 5.7). Excluding the two capped categories and renormalising: 6.1. Nothing on real iOS is scored.

- **Strategic depth 6.2**: 16 projects are a real investment choice (GDP +1-4 %, debt +13-23 pts) and the AI uses them; 11 levers with measurable effects; a nuclear command exists. But the autopilot vs passive gap is small, scenario shocks fade in 18 months, and the nuke has no repeat cost.
- **Economic realism 6.2**: 0 NaN in 48 runs; inflation bounded except in occupied Ukraine. Median growth is still 4.0-4.3 %; JPN and USA are fragile; the top-5 never changes.
- **Military / logistics 5.8**: Frozen lines and main-thrust offensives are real, and the ledger works. Autoplay border changes in only 4/48 runs, 0-casualty wars last 4 years, occupation never resolves, nukes are repeatable, and there is no combined-arms planning.
- **Diplomacy & world AI 6.2**: Same command layer for AI and player, noisy opinion, proposals with reasons, answerable offers. The AI is reactive, uses the same pairs (TUR-SYR in 12/48), has a regex lint, and war scores are public.
- **Emergent / replayability 5.5**: 1.1-1.3 wars/decade over about 14 pairs, the Ukraine collapse loop in 8/8 fault_lines runs, identical top-5, scenarios converging.
- **iPhone UX 6.3**: Solid sheet/tab architecture and 44 px tabs. But the Projects tab shows the wrong content, controls are 38-40 px, the native `confirm()` is untestable and likely dead on WKWebView, and toasts cover the map.
- **Visual quality 6.6**: Clean dark design, no map artefacts in the evaluator's views. Label clipping; no sprites or terrain art.
- **Performance / stability / saves 7.3**: 67/67 unit and 20/20 UI tests pass, 12/12 arbitrary-day saves are identical, 0 NaN, core save guard works. 217 ms/month on this host; device unverified.
- **Code quality 6.3**: Prettier clean, layered, 67 unit tests. `war.js` is still 1,095 lines after the "split" (peace 156, nuclear 55), dead code in `peace.js`, 107 lines over 200 chars (max 985), `__app` used 74 times in UI tests, README/TESTING stale.

## 6. Ranked defects
1. Major: iOS never built. The shell has no WKUIDelegate, so native `confirm()` (`app.js:696`) fails on WKWebView; cancel-project and nuclear strike would be dead. Unverified on device.
2. Major: frozen occupation never resolves and cripples the owner (`economy.js:437`, politics `occupied`). Ukraine has 1-3 regime collapses and 36-65 % inflation in all 8 fault_lines runs. Repro: run fault_lines seed 13 for 10 years with autoAI and watch UKR.
3. Major: device performance unmeasured (217-250 ms/month here).
4. Moderate: nuclear strike is unlimited (`nuclear.js:25-54`); stock never consumed, no cooldown; 3 taps = 3 strikes.
5. Moderate: the Projects tab shows Society content first (`nation.js:126/162`).
6. Moderate: territory rarely changes in autoplay (4/48); client states 0/48 (`war.js:1042`).
7. Moderate: phantom wars (CHN>JPN, CHN>PHL, ISR>IRN, USA>IRN, EGY>ETH) with 0 casualties for 48 months.
8. Moderate: war variety is narrow (about 14 pairs; TUR-SYR in 25 % of runs); measured 1.1-1.3/decade vs claimed 1.7-1.8.
9. Moderate: scenarios converge by 18 months; strait_crisis never produces a CHN-TWN war.
10. Moderate: JPN collapse in 2/48; USA regime collapse in 3/48.
11. Moderate: median growth 4.0-4.3 %; CHN passes USA in 6/48; identical top-5.
12. Minor: touch targets: pills/play/speed 40, close 38.
13. Minor: two toasts cover about 25 % of the map; labels clipped; GDP pill scrolls.
14. Minor: a human who capitulates gets no settlement or client state (`war.js:1021`), asymmetric with the AI.
15. Minor: projects add only debt (no budget line); cancel gives no refund.
16. Minor: dead code in `peace.js` (empty loops around lines 69-71 and 83-85, unused vars in `REGION_COST`); `relocateStranded` nested ifs (`war.js:951-956`).
17. Minor: `war.js` is 1,095 lines; 107 lines over 200 chars.
18. Minor: UI tests use `__app` 74 times vs 28 taps; the project test misses the layout bug; native dialogs are untestable by default.
19. Minor: stale docs: README/TESTING say 59+18 tests (now 67+20); KNOWN_ISSUES #12 says 525 regions.
20. Minor: `cube.html` in root; placeholder bundle id; CI never run; `sw.js` version manual.
21. Minor: cross-engine float determinism not guaranteed (disclosed).

## 7. Overstated or unsupported documentation claims
- SCORECARD "33 more rivalries (about 1.7-1.8 spontaneous wars per decade)": measured 1.1-1.3 over 48 runs.
- KNOWN_ISSUES #9 / SCORECARD "single-use escalation command" and the confirm text "cannot be undone": no stock decrement or cooldown, so it is repeatable without limit.
- SCORECARD touch targets "raised to >= 44 px (HUD pills 40 px)": play/speed (40 px) and the close button (38 px) are also below 44.
- KNOWN_ISSUES #12 "525 regions" (681 now); README/TESTING "59 unit + 18 UI tests" (67 + 20).
- "war.js split into war/peace/nuclear": real but small (1,095 lines left).
- Persistent occupation is presented as a fix without noting the permanent economic penalty and the Ukraine collapse loop (KNOWN_ISSUES #10 only says "almost all Ukraine").
- Positive: iOS/device/performance disclosures are candid, the nuke-AI rarity is honest, test counts of 67/20 are real, and no fabricated evidence was found.
