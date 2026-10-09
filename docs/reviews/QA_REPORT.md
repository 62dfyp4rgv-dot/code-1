# QA Report — Football Universe engine (Agent G, independent)

STATUS: PARTIAL / INCREMENTAL (written progressively; sections marked TODO are not yet covered).
Code state tested: working tree after the coordinator's changes to `src/competition/fixtures.ts` (Berger round-robin orientation) and `src/world/development.ts` (retuned curves). Findings below were re-run after those changes unless noted.

Run everything: `cd packages/engine && npx vitest run --config vitest.qa.config.ts`
Run one file: `npx vitest run --config vitest.qa.config.ts qa/<file>.qa.test.ts`

## Findings summary

| ID | Severity | Module | Title |
|----|----------|--------|-------|
| QA-001 | High (FIXED during this run) | world/rollover + squad | Clubs relegated from Saudi Pro League exceeded the SAU2 foreign cap (10 > 8); `enforceForeignLimit` added in rollover.ts while testing, regression test now passes |
| QA-002 | High | world/actions + transfers | Human asking price is paid verbatim: free agents worth €0.13–1M sold for €15M |
| QA-003 | Medium | world/actions | NaN / Infinity wage and years accepted by renewal and free-agent signing; corrupts cash (-Infinity) and creates never-expiring contracts that `validateWorld` does not detect |
| QA-004 | Medium | world/actions | `releasePlayerAction` can release the last goalkeeper; world then violates NO_GOALKEEPER |
| QA-005 | Low | world/actions | Ids such as `constructor` / `__proto__` throw TypeError (bid, loan, profile) or return ok (scout, terms) |
| QA-006 | Low | match | First-half stoppage-time minutes (46-48) precede second-half minutes (46-47): event minutes are not monotone in 75% of matches |
| QA-007 | Low | world/actions | `setTactics` accepts fractional `maxSubs`; `listForTransfer` accepts Infinity / 1e300 asking price |

| QA-008 | Medium | world/finance | Richest club hoards cash without bound (1.1x -> 6.1x TV+sponsor revenue in 10 seasons, ~+75M/season) |
| QA-009 | Medium | persistence/codec + repository | `importSlot`/`decodeWorld` store worlds that fail `validateWorld` (negative wages, attribute 1e300, missing clubs chunk, season -3/day 1e15) and surface raw TypeError/SyntaxError instead of SaveCorruptedError |
| QA-010 | Medium | match archive / persistence | Stored match `replay` inputs alias live player/tactics objects: 68 of 116 stored replays re-simulate to a different score after 420 days, and a live world differs from its reloaded twin in the `matches` chunk |

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

### QA-008 Unbounded cash hoarding
* Test `[QA-008]` in `qa/realism.qa.test.ts` (ITA1+GER1 standard, seed `qa-real`, 10 seasons). Max over clubs of cash/(broadcasting+sponsorship) after each season: 1.1, 1.7, 2.2, 2.7, 3.3, 4.2, 5.2, 5.4, 5.8, 6.1. Script run for 12 seasons: richest club 161M -> 900M cash while its TV+sponsor income is ~130-180M and its transfer budget grows to 371M that is never spent. Median club cash is stable (63M -> 190M).
* Expected: surplus is invested/distributed (the spec mentions annual surplus investment/dividends); cash must plateau. Projected: +75M/season linear -> multi-billion by season 50 and an ever-richer `transferBudget` (40% of cash).
* Fix: cap `transferBudget` growth, pay dividends above N x revenue, or let AI spend on facilities (`investSurplus`).

### QA-009 Imports are not validated
* Test names: `[QA-009] ...` in `qa/persistence.qa.test.ts` (4 tests). A save document whose checksum is valid (a buggy exporter or hand edit recomputes it) is imported verbatim. Evidence: wage -5 and attribute 1e300 -> accepted, `validateWorld` = WAGE_INVALID, ATTR_RANGE; clubs chunk removed -> accepted, UNKNOWN_CLUB; season -3/day 1e15 -> accepted with 1008 violations; players chunk `"hello"` -> raw `TypeError: Cannot read properties of undefined (reading 'finishing')`; truncated chunk JSON -> raw SyntaxError.
* Expected (DATA_AND_LICENSING.md: "Save import verifies a checksum and the schema version before accepting a file"): additionally reject worlds with hard `validateWorld` violations and wrap decode failures in SaveCorruptedError.
* Fix: in `decodeWorld`/`importSlot` run `assertValid` and wrap in try/catch -> `SaveCorruptedError`.

### QA-010 Replay inputs alias live objects
* Tests: `[QA-010] a stored match replay input reproduces the stored score ...` and `[QA-010] live and reloaded worlds are byte-identical including the match archive ...` in `qa/persistence.qa.test.ts`.
* Evidence: after 420 days of `qa-det` (ENG1+ESP1 compact) 68 of 116 retained replays give a different score when fed back to `simulateMatch`. `toMatchPlayer` stores `attrs: p.attrs` (same object); `buildSheet` stores `tactics: club.tactics`; later weekly development mutates them in place, so `world.matches[id].replay` silently changes. Because loaded worlds hold copies, `encodeWorld(live)` != `encodeWorld(loaded)` for the `matches` chunk after further play (first diff: `matches.42.replay.away.players.2.attrs.pace 71.22 vs 71.82`). All other chunks stayed byte-identical (so simulation determinism itself is intact - verified).
* Fix: deep-copy attrs/tactics when building `MatchInput` (`structuredClone` or `{...attrs}`).

## Verified OK (so far)
* 4000 synthetic matches (mixed strengths, 50% knockout, 25% with extra time allowed): goal events equal score, running score increments by one, scorer/assist belong to correct team, no self-assist, no own-goal assist, no second yellow without secondYellow event, no action by a sent-off player, Σ player goals + own goals = score, ET only when allowed and level after 90, penalties only when level, shoot-out events equal reported pens, kick counts differ by <=1, no ET/pens in league matches, substitutions <=5 in 90 minutes (<=6 with ET).
* Calibration (n=4000, mixed strengths): goals/match 2.88, home/draw/away 41.5/24.7/33.8%, clean sheets 28.0%/team, yellows 3.6, reds 0.098 per match, injuries 0.52 per match. 2.0 ms per match.
* Compact world: 250 clubs, 6382 players; `validateWorld(checkLedger)` clean after each of 3 seasons; ~15 s per season.

## Not tested / limitations
TODO (see bottom of file for updates).
