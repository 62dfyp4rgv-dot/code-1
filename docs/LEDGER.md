# Improvement ledger

Each entry: defect found -> how found -> fix -> regression test -> evidence. Scores are recorded in `docs/SCORECARD.md` (written at release-candidate time) and must be backed by entries here.

## Tactical balance (TB)
* **TB-1** `counterAttack=true` gave +0.457 goals/match vs a balanced side (3000 matches). Found by `tools/sensitivity.ts`. Cause: transitions skipped build-up and always received a bonus. Fix: bonuses scale with the opponent's measured exposure (line, mentality, pressing); counter sides pay a cautious-settled-play cost. Result: −0.014 .. −0.06. Test: `tactics.test.ts` levers.
* **TB-2** `direct` archetype lost −0.40 goals/match against every style; low directness +0.12. Fix: direct play gains a progression bypass and aerial dependence, pays a creation-quality penalty. Result: row average −0.09 (matrix n=1500).
* **TB-3** pressing/line extremes ±0.09–0.21. Fix: exposure coefficients, fatigue cost of pressing/tempo, compression benefit. Residual ±0.06–0.09 kept as genuine trade-offs.
* **TB-4** `marking` and rain were declared but inert. Implemented with costs; tests added.

## Match engine (ME)
* **ME-1** 61 shots/match, 4× red cards, offsides 13/match at first build. Re-parameterised funnel; calibration test bands now enforce.
* **ME-2** One striker took up to 73% of team shots (7-goal games). Dedicated shot-share distribution; test on top-shooter share and max goals.
* **ME-3** `fulltime` event stamped before the last in-match event (off-by-one) — found by the event-ordering test.
* **ME-4** 3.7 ms/match -> 1.5 ms: allocation-free skill refresh, cumulative passer weights, chunked fatigue/injury bookkeeping.

## Competitions (CO)
* **CO-1** Fixture ids collided across zones (AFC) — found by registry sweep; ids now include group.
* **CO-2** League phase with <24 teams produced an invalid play-off bracket — scaled to powers of two.
* **CO-3** League-phase matchday assignment: min-conflicts local search failed on known-colourable graphs; replaced by exact backtracking 1-factorisation (ms).
* **CO-4** 24-team second tier needed 46 rounds > free weeks: midweek double-header scheduler.
* **CO-5** OFC group matches clashed with league rounds (calendar double-booking) — found by `validateWorld`.

## World dynamics (LR = long-run)
* **LR-1** Rating inflation (p95 73→81 over 7 seasons) and age-structure skew from academy graduates occupying senior slots. Fix: league-relative academy model, prospects outside the senior cap, scholarship review (promote/release), potential revision. Test: `longrun.test.ts` stationarity.
* **LR-2** Free-agent pool grew unbounded (826→2224). Fix: long-term unemployed leave the game; emergency squad cover.
* **LR-3** Cash runaway (median 16→77 m, max 1.35 bn) from wages anchored to a revenue estimate that ignored prize money, no wage drift, AI that never spent. Fix: revenue mix, wage competition, annual wage review, upgrade-seeking AI, surplus investment/dividends.
* **LR-4** Foreign-cap leak via loan returns; clubs without a goalkeeper at the season boundary. Fix: loans-out index counts against the parent; GK cover independent of squad size.

## Persistence / determinism (PD)
* **PD-1** After save/load the simulation diverged: derived squad index ordering differed from the live world. Fix: canonical ordering; test "continues identically after save/load".
* **PD-2** Reference-data version leaked into world state — found by round-trip test.

## Found by process (open)
* **OP-1** Relegated clubs keep more foreigners than the lower tier allows (T-021). * **OP-2** Degenerate fields can leave a competition active without a winner (T-022).

## Review round 1 (critic + QA) — fixes landed
- CR-001/002, QA-009: loads and imports validate (reserved/escaped property names, id patterns, attribute vectors, chunk caps, `validateWorld` hard violations); decode errors are `SaveCorruptedError`. Regression: `test/persistence.hardening.test.ts`.
- CR-003, QA-010: replay inputs are deep-copied when archived; test replays stored matches weeks later.
- CR-004: chunks bounded by bytes (~400 KB target; test asserts < 1 MB); retired players purged after 2 seasons (legends keep a summary).
- CR-005: `ROLES`/`FORMATIONS` are prototype-less; `statLine` uses own-property checks; `for…in` removed.
- CR-006: rollover no longer applies surplus investment, wage review or academy review to the human club.
- CR-008: single-leg hosts drawn deterministically (test in `regressions.test.ts`).
- Still open: CR-007, CR-009..CR-022 (except CR-008), QA-008/011/016. Mobile app unverified.
