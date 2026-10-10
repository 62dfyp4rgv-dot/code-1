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
* **CO-6** A league phase over exactly 8 same-country clubs (e.g. a compact world with only JPN1) threw `leaguePhasePairings: could not construct pairings`: 4 pots need 8 distinct opponents but only 7 exist. Found by `test/pyramids.test.ts` (JPN1+JPN2 compact). Fix: `effectivePots` requires `n >= 2*pots + 1` (8 clubs -> 2 pots). Test: same file, `world configuration` block.
* **CO-7** Relegated clubs kept league-rank continental places in small fields (compact BRA1: ranks 8-10 are both the Sudamericana range and the relegation zone). Found by `test/extended.world.test.ts`. Fix: league-based qualification slots only admit clubs still in that league (`qualification.ranked`); title holders and cup winners are unaffected. Test: `trophies.test.ts` (relegation removes league-based places).
* **CO-8** Clubs that changed tier were priced for the new season by their position in the table they had left (a promoted champion received the top-of-league broadcasting share). Fix: `rollover` prices promoted clubs from the bottom of the upper league and relegated clubs from the top of the lower one. Test: `pyramids.test.ts` (broadcasting deals after a change of tier).
* **EX-1** (scope) Extended universe, all `unverified-default`: ten new pyramids (ESP, ITA, GER, FRA, POR, NED, BRA, TUR, SCO, JPN; MLS deliberately has none), 22 new first divisions, 12 domestic super cups, FIC / Recopa / CAF Super Cup / Campeones Cup / Concacaf Central American Cup, size-aware cup calendars (`weeksFromFinal`). Opt-in so the default worlds keep their size: `standard` 548 clubs, `compact` 250 clubs; the full extended compact world has 478 clubs (~31 s per season vs ~17 s). Measured with `tools/season.ts` (2 seasons, two runs each, seconds per season, before -> after): standard 45.2/44.5 and 47.4/47.8 -> 43.8/44.5 and 45.4/45.5; compact (seed season-test) 17.0/16.4 -> 16.3/16.8 for season 1 and 16.2/16.4 -> 19.6/19.6 for season 2 (two other seeds over three seasons: 15.8/15.1/17.1 -> 16.6/15.8/16.1 and 15.8/15.5/16.1 -> 15.5/15.1/17.0, i.e. no systematic change; the season-2 difference of the first seed is world-state variation). Tests: `pyramids.test.ts`, `trophies.test.ts`, `extended.world.test.ts` (two seasons of the extended compact world: promotion/relegation in all ten pyramids, ledger identity, foreign limits, no double booking, qualification from the new leagues, new trophies).

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
- CR-007: profile attributes and position ratings of other clubs pass through the scouting lens. CR-009: tempo/line/mentality/press retune + random stack sweep test.
- Still open: CR-010..CR-022, QA-008/011/016. Mobile app not run on a device.
