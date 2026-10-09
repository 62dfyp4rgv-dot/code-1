# QA Report — Football Universe engine (Agent G, independent)

STATUS: PARTIAL / INCREMENTAL (written progressively; sections marked TODO are not yet covered).
Code state tested: working tree after the coordinator's changes to `src/competition/fixtures.ts` (Berger round-robin orientation) and `src/world/development.ts` (retuned curves). Findings below were re-run after those changes unless noted.

Run everything: `cd packages/engine && npx vitest run --config vitest.qa.config.ts`
Run one file: `npx vitest run --config vitest.qa.config.ts qa/<file>.qa.test.ts`

## Findings summary

| ID | Severity | Module | Title |
|----|----------|--------|-------|
| QA-001 | High | world/rollover + squad | Clubs relegated from Saudi Pro League exceed SAU2 foreign cap (10 > 8) and nothing corrects it for 1-3 seasons |
| QA-002 | High | world/actions + transfers | Human asking price is paid verbatim: free agents worth €0.13–1M sold for €15M |
| QA-003 | Medium | world/actions | NaN / Infinity wage and years accepted by renewal and free-agent signing; corrupts cash (-Infinity) and creates never-expiring contracts that `validateWorld` does not detect |
| QA-004 | Medium | world/actions | `releasePlayerAction` can release the last goalkeeper; world then violates NO_GOALKEEPER |
| QA-005 | Low | world/actions | Ids such as `constructor` / `__proto__` throw TypeError (bid, loan, profile) or return ok (scout, terms) |
| QA-006 | Low | match | First-half stoppage-time minutes (46-48) precede second-half minutes (46-47): event minutes are not monotone in 75% of matches |
| QA-007 | Low | world/actions | `setTactics` accepts fractional `maxSubs`; `listForTransfer` accepts Infinity / 1e300 asking price |

(More findings are added below as testing continues.)

## Findings in detail

### QA-001 Relegated Saudi clubs exceed the SAU2 foreign-player cap
* Reproduce: `npx tsx` script equivalent to test `[QA-001]` in `qa/promotion.qa.test.ts`: `createWorld({seed:'qa-sau', leagues:['SAU1'], preset:'standard', humanClubId:null, archiveRecent:400})`, run `advanceToEndOfSeason` and call `validateWorld`.
* Evidence: after season 1: `FOREIGN_LIMIT Club Bahrtaawoun has 10 foreign players (limit 8)` (3 clubs, seed qa-sau), still 1 club after season 2, and in a weekly scan over 5 seasons (seed qa-mon) 53-58 weekly samples with a SAU2 club above the cap of 8. SAU1 itself never exceeded its cap of 10 in any weekly sample.
* Expected: registration limits of the league a club plays in must hold after promotion/relegation (spec: "10-foreign-player registration cap ... enforced"; invariant FOREIGN_LIMIT is the engine's own check). Either release/loan out surplus foreigners at rollover or block relegated clubs from fielding more than the cap.
* Fix: in `rolloverSeason`, after P/R and before `startSeason`, run a `trimForeign(world, club)` for every club whose league changed (loan out / release lowest-rated foreigners until `foreignCount <= cap`).
* Regression test: `[QA-001] relegated clubs respect the destination league's foreign cap`.

### QA-002 Human asking price is paid verbatim
* Reproduce: `[QA-002]` in `qa/actions.qa.test.ts`. Human = lowest-reputation club of a compact ENG1 world. Sign cheap free agents with `signFreeAgentAction`, `listForTransfer(id, 15e6)`, advance 42 days.
* Evidence (8 seeds, `qa-flip1..8`): players with market value 133k, 268k, 595k, 885k, 681k, 935k, 1035k were sold for exactly 15,000,000 in 6 of 8 worlds (up to 110x market value). In `resolveListedPlayersOfHuman` the AI buyer offers `entry.askingPrice` with no valuation check, only `transferBudget >= askingPrice`.
* Expected: AI buyers must not pay more than their own valuation (`sellerReserve`/scouted value x aggression). A free-money loop (sign free agents, list at inflated price) trivialises the economy. Also free-agent signings do not set `lastMoveDay`, so there is no 120-day resale lock.
* Fix: cap AI fee at `min(askingPrice, c.value*(0.95+0.1*aggression))`, and set `lastMoveDay` in `signFreeAgent`.

### QA-003 NaN / Infinity inputs accepted
* Reproduce: `[QA-003]` tests in `qa/actions.qa.test.ts`.
* Evidence: `offerRenewal(w, id, NaN, 3)` -> `{status:'completed'}`, contract wage NaN; `offerRenewal(..., Infinity, 3)` completed with wage Infinity; `signFreeAgentAction(w, id, Infinity, 3)` completed, club cash `-Infinity`; `validateWorld` -> `WAGE_INVALID`, `FINANCE_NAN`. `offerRenewal(..., years=NaN)` and `signFreeAgentAction(..., years=NaN)` complete with `contract.endDay = NaN`; `validateWorld` reports nothing (NaN comparisons are false) so the player never expires. `years=1e9` gives endDay 3.6e11.
* Expected: actions "cannot put the world into a state the invariant suite would reject" (actions.ts header). Reject non-finite / non-positive / absurd inputs.
* Fix: `Number.isFinite` guards at the top of every action; add `CONTRACT_DATES` check for `Number.isFinite(endDay)` to `validateWorld`.

### QA-004 Releasing the last goalkeeper
* Evidence: releasing every releasable player (7 released, squad 18) leaves `NO_GOALKEEPER: ... has no goalkeeper` which persists 14 days of simulation (human club is excluded from `aiFillSquad`).
* Fix: refuse release when it would leave fewer than 2 goalkeepers, or auto-cover.

### QA-005 Hostile ids
* Evidence: `bidForPlayer(w,'constructor',...)`, `bidLoan`, `playerProfile` throw `TypeError`; `scoutReport`/`suggestTerms` return `ok:true` with `abilityLow:-1`, `fee:null` for ids `constructor`, `__proto__`, `toString` because `world.players[id]` resolves on `Object.prototype`.
* Fix: use `Object.hasOwn(world.players, id)` or `Map`/null-prototype objects.

### QA-006 Non-monotone event minutes
* Evidence: 4000 synthetic matches: 2989 had an event whose minute is lower than the previous event (e.g. halftime at 48', next event corner at 47'). `src/match.ts` rewinds the display clock to 45:00 after first-half stoppage.
* Expected: stoppage time should be "45+n"; minutes must be sortable (store `minute` + `addedTime`, or sort by (period, clock)).

### QA-007 Minor input validation
* `setTactics` accepts `maxSubs: 2.5`; `listForTransfer` accepts `Infinity`/`1e300` (becomes `null` after JSON save).

## Verified OK (so far)
* 4000 synthetic matches (mixed strengths, 50% knockout, 25% with extra time allowed): goal events equal score, running score increments by one, scorer/assist belong to correct team, no self-assist, no own-goal assist, no second yellow without secondYellow event, no action by a sent-off player, Σ player goals + own goals = score, ET only when allowed and level after 90, penalties only when level, shoot-out events equal reported pens, kick counts differ by <=1, no ET/pens in league matches, substitutions <=5 in 90 minutes (<=6 with ET).
* Calibration (n=4000, mixed strengths): goals/match 2.88, home/draw/away 41.5/24.7/33.8%, clean sheets 28.0%/team, yellows 3.6, reds 0.098 per match, injuries 0.52 per match. 2.0 ms per match.
* Compact world: 250 clubs, 6382 players; `validateWorld(checkLedger)` clean after each of 3 seasons; ~15 s per season.

## Not tested / limitations
TODO (see bottom of file for updates).
