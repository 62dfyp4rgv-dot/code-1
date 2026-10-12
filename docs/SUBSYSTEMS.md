# Subsystem specifications

For every subsystem: **purpose · inputs · outputs · update frequency · dependencies · invariants · failure conditions · tests**.
All file names are under `app/js/sim/` unless noted. Quantities are in model units documented in `constants.js`
(GDP in USD bn, populations in millions, time in days).

## 1. Scheduler & world (`world.js`)
- **Purpose**: owns `state`, geography, the daily/monthly/yearly clock, command execution (`exec`), event bus, derived caches.
- **Inputs**: scenario, seed, difficulty, player id (new game) or a save. **Outputs**: mutated `state`, log entries, `emit` events.
- **Frequency**: daily (military movement/combat, diplomacy timers, event timers), monthly (everything else), yearly (annual statistics, victory history).
- **Dependencies**: all modules. **Invariants**: `state.day` strictly increases by 1 per step until `ended.final`; derived caches (`alliesOf`, `forcesOf`, `supplyBy`) are rebuilt in `postLoad` and cleared each day.
- **Failure**: loop on a finished game (`advanceMonths` stops when `ended.final`; fixed after the balance tool exposed an infinite loop). **Tests**: `determinism_save`, every module test through `makeSim`.

## 2. Economy (`economy.js`, `mods.js`, `constants.js`)
- **Purpose**: 8-sector production (Cobb-Douglas, TFP calibrated at t0 and scaled by baseline-relative modifiers), aggregate demand, utilisation, unemployment, inflation (expectations + utilisation + commodity pass-through), central bank (Taylor rule), fiscal rule, capital/investment, public debt, FX/reserves and external finance.
- **Inputs**: country policies, budget, tech/event modifiers, commodity prices, trade exposure, stability/credit/confidence. **Outputs**: GDP, growth, inflation, unemployment, deficit, debt ratio, reserves, sector value added, clean share, consumption.
- **Frequency**: monthly. **Dependencies**: trade (prices/imports), politics (stability, corruption), society (population/labour), research (modifiers), military (budget).
- **Invariants**: sector value added sums to GDP at t0; world goods trade nets to zero; world current account sums to zero; reserves are conserved by external finance; debt follows deficits (no free money); utilisation ∈ [0.7, 1.07].
- **Failure conditions**: sovereign-debt crisis (high debt + low reserves + low confidence → crisis events, growth penalties); currency crisis; stagflation; hyperinflation guarded by clamps and CB response.
- **Tests**: `economy.test.js` (calibration, identities, stock-flow, boundedness, shock transmission).

## 3. Trade & commodities (`trade.js`)
- **Purpose**: clear four traded commodities (food, oil, gas, minerals) between exporters and importers by iterative proportional allocation; prices adjust to cover/scarcity.
- **Inputs**: production, demand, embargoes/sanctions, war/blockade factors, chokepoint closures, distance/route costs. **Outputs**: per-country imports/exports per commodity, curtailment, prices, trade flows for the map.
- **Frequency**: monthly (chunked). **Invariants**: Σexports = Σimports per commodity; production − curtailment = consumption + stock change; prices clamped [0.35, 6]× baseline.
- **Failure**: import dependence + embargo or chokepoint closure → curtailment → output loss/inflation. **Tests**: conservation, chokepoint and embargo tests.

## 4. Politics (`politics.js`)
- **Purpose**: approval, legitimacy, stability, unrest, corruption, political capital, elections (party competition), leader change, regime change/collapse.
- **Inputs**: economy (unemployment, inflation, growth), war, policies, events, intel ops. **Outputs**: stability, approval, pc (political capital: resource spent on policy changes), regime state.
- **Frequency**: monthly; elections on schedule by regime type. **Invariants**: all indices in [0,1] (or documented range); collapse needs sustained low stability.
- **Failure conditions (player)**: capitulation, regime collapse, loss of power. **Tests**: `commands_politics.test.js`.

## 5. Society & environment (`society.js`)
- **Purpose**: 3-cohort demography, ageing, migration (normalised so world net migration = 0), health/education/infrastructure indices, inequality/poverty, emissions → global temperature → damage/disasters.
- **Frequency**: monthly. **Invariants**: population ≥ 0; migration sums to zero. **Tests**: long-run boundedness; pandemic mechanics.

## 6. Research (`research.js`, `data/techs.psv`)
- **Purpose**: 67 technologies, 8 branches. Research points from R&D budget × human capital × tech index; queue; adoption/diffusion lowers cost for followers; each tech applies modifiers (`tfp.*`, `mil.*`, `infl.add`, …).
- **Invariants**: prerequisites acyclic; every modifier key is consumed by simulation code (tested). **Tests**: `data.test.js`, `commands_politics.test.js` (queue/progress/modifiers).

## 7. Military & logistics (`military.js`)
- **Purpose**: budgets → equipment capital, readiness, manpower, stocks (ammo, fuel), ~1 270 formations (land: infantry/mechanised/armoured/fires; air: fighter/strike; sea: surface/submarine/carrier), nuclear status.
- **Frequency**: monthly (build-up, upkeep), daily (movement). **Invariants**: formation size/fill/org/morale bounded; spending conservation via budget shares.
- **Failure**: unpaid forces lose readiness; exhaustion rises in long wars.

## 8. War (`war.js`)
- **Purpose**: declaration (with casus belli and alliance legality), mobilisation, supply, movement, land phase (terrain, fortification, air support, combined arms, supply, doctrine, opposed landings across straits), air and naval phases, capture/occupation, devastation, war score, exhaustion, capitulation, peace proposals with terms (cede region, reparations, demilitarisation, client state, ceasefire) and acceptance factors; AI offers to a human are parked as an offer (45 days) and answered with `answerOffer`.
- **Frequency**: daily combat; monthly scoring. **Invariants**: every region has exactly one owner and one controller; no duplicate wars; allies cannot be attacked by partners; truces block new wars.
- **Failure**: capital held by enemy > 60 days, total occupation or exhaustion > 0.97 ⇒ capitulation. **Tests**: `war.test.js`.

## 9. Diplomacy & organisations (`diplomacy.js`)
- **Purpose**: opinion/trust matrices (Int8, N×N), treaties (alliance, defence pact, trade, non-aggression, ceasefire…), proposals with transparent acceptance factors, sanctions/embargoes, calls to arms, client states (vassalage: tribute, shared side, no independent wars, revolt when the overlord is weak), implicit security guarantees, 14 organisations (membership criteria + consent), UN-style Global Assembly resolutions with a veto.
- **Frequency**: monthly drift; daily timers. **Invariants**: opinions clamped; treaty parties distinct; forecasts equal outcomes for resolutions. **Tests**: `diplomacy_intel_events.test.js`.

## 10. Intelligence & cyber (`intel.js`)
- **Purpose**: intelligence networks, 8 covert operations with cost/duration/risk, exposure with diplomatic fallout, cyber disruption versus cyber defence, and `perceive()` — the *only* way AI and UI-side fog of war see other countries (noisy, improves with networks).
- **Invariants**: perception noise is stateless (`hash01`) so saves stay deterministic. **Tests**: `ai_lint.test.js` (perception), intel/cyber tests.

## 11. Events (`events.js`, `data/events.json`)
- **Purpose**: ~80 data-driven events + world events. Conditions on stat paths, weighted mean-time-to-happen, options with whitelisted effects (stat, mod, price, rel, treasury, policy, flag, infra, devastate, treaty, newLeader, …), delayed follow-ups, pandemic SIR model.
- **Invariants**: effects can only write whitelisted stats; AI resolves events with its own utility; player gets decision modals. **Tests**: validity of every event; emergence in stressed economy; pandemic.

## 11a. Civil conflict (`civil.js`) and advisor (`advisor.js`)
- **Civil conflict**: monthly; starts under strain (stability < 0.3, unrest > 0.5, not at war), intensity follows stability/approval; costs: timed `gdp.shock`, stability, infrastructure, regional devastation, displaced people to a neighbour; ends by calm (4 months), burn-out, 8 years, or regime collapse. Flag `civilWar` feeds three event definitions. Tested.
- **Advisor**: pure function of the state (never mutates; tested) returning prioritised items with a screen hint; UI in `ui/screens/advisor.js` and the HUD pill.

## 11b. National projects (`projects.js`, `data/projects.json`)
- **Purpose**: long-horizon investment choices. Inputs: country stats (conditions), political capital, `startProject`/`cancelProject` commands. Outputs: monthly extra borrowing (`cost × GDP / 12`) and permanent modifiers on completion. Frequency: monthly. Invariants: ≤ 2 active; no work while the market is closed or reserves negative; effects use known modifier keys (tested). AI: `ai/econ.js manageProjects` (needs fiscal space and PC).

## 12. World AI (`app/js/ai/`)
- **Purpose**: each country has a personality (risk, security, ideology weights) and acts monthly (great powers/belligerents) or quarterly (others): fiscal rule and policy shifting, research choice, diplomacy proposals and alliance seeking, war posture/declaration/peace, air & naval tasking, intelligence ops, event resolution.
- **Constraints**: acts only through `commands.js`; sees only `perception.js`. **Failure modes**: reactive rather than planning for multi-year campaigns (see KNOWN_ISSUES).

## 13. Victory, achievements, statistics (`victory.js`, `achievements.js`, `stats.js`)
- 6 victory paths (prosperity, economic, diplomatic, scientific, stability & welfare, security), a standing index (percentile blend), grade (Triumph / Success / Qualified success / Muddled through) at the scenario end or on collapse; 22 achievements persisted in saves; monthly/yearly series for charts.

## 14. Save/load (`save.js`) — see ARCHITECTURE.md §4. **Tests**: `determinism_save.test.js`.

## 15. UI (`app/js/ui/`) — see ARCHITECTURE.md §6. **Tests**: `tests/ui/ui.test.js`.
