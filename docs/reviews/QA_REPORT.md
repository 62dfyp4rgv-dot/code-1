# QA Report — Football Universe engine (Agent G, independent QA)

Scope: `packages/engine` public behaviour, tested from `docs/SIMULATION.md`, `ARCHITECTURE.md`, `DATA_AND_LICENSING.md`, football rules and the public API. Code state: working tree as it was changed during the run (the coordinator's Berger round-robin and development retune were in place; **other agents also fixed several of my findings while I was testing** — see the Status column). Every statement below was produced by code I ran; scratch probes are described as "script", regression tests are in `packages/engine/qa/`.

Run the suite: `cd packages/engine && npx vitest run --config vitest.qa.config.ts` (about 4-5 min, 4 cores shared). One file: `npx vitest run --config vitest.qa.config.ts qa/<file>.qa.test.ts`.
Last complete run (before adding `savesize` and `transfers`): 135 tests, 116 pass, 19 fail. Final suite: 10 + 2 files, 142 tests: **122 pass, 20 fail**; every failing test is titled `[QA-nnn]` and is a currently open defect.

## 1. Findings summary

| ID | Severity | Status | Module | Title |
|----|----------|--------|--------|-------|
| QA-001 | High | FIXED in tree (`enforceForeignLimit`) | world/rollover | Clubs relegated from the Saudi Pro League kept 10 foreigners in SAU2 (cap 8) |
| QA-002 | High | FIXED in tree | world/transfers (AI buys listed player) | Human asking price paid verbatim: free agents worth €0.1-1M sold for €15M (up to 112x value) |
| QA-003 | Medium | FIXED in tree | world/actions | NaN / Infinity wage and years accepted: cash -Infinity, contracts with `endDay = NaN` (never expire, invisible to `validateWorld`) |
| QA-004 | Medium | FIXED in tree | world/actions | `releasePlayerAction` could release the last goalkeeper |
| QA-005 | Low | FIXED in tree | world/actions, views | Ids `constructor`/`__proto__`/`toString` threw TypeError or returned `ok` |
| QA-006 | Low | MOSTLY FIXED, residual open | match | Event minutes decreased in 75% of matches (stoppage vs second half); now 2/3000 (extra-time `fulltime` stamped 120' after events at 121') |
| QA-007 | Low | FIXED in tree | world/actions | `maxSubs: 2.5` and asking price `Infinity`/`1e300` accepted |
| QA-008 | Medium | OPEN | world/finance | Richest club hoards cash without bound (1.1x → 6.0x TV+sponsor revenue in 10 seasons) |
| QA-009 | Medium | OPEN | persistence | `importSlot`/`decodeWorld` store worlds that fail `validateWorld`; decode errors are raw TypeError/SyntaxError |
| QA-010 | Medium | OPEN | match archive | Stored match `replay` inputs alias live objects: 68/116 replays re-simulate to a different score; live ≠ reloaded world |
| QA-011 | Medium | OPEN | world/calendar | Unserved suspensions are wiped at the season boundary (13/13 league bans lost) |
| QA-012 | Medium | OPEN | world state | Retired players, histories and transfer log grow without bound (save +3.0 MB/season in the standard world) |
| QA-013 | Medium | OPEN | world/views | `playerProfile().positions[].rating` leaks the exact hidden ability of every unscouted player (450/450) |
| QA-014 | Low | OPEN | persistence | Match archive is 78% of a 40.5 MB compact save (replay inputs stored in full) |
| QA-015 | Low | OPEN | competition/fixtures | Over a two-legged season even-sized leagues give teams 3 consecutive home or away games (documented guarantee: never more than two) |
| QA-016 | Medium | OPEN | world/managers | Managers are practically never dismissed (≈1% of clubs per season vs ≈20% in football; 82% of managers last all 10 seasons) |

Counts: 16 findings. Critical 0; High 2 (QA-001, QA-002, both fixed in the tree); Medium 9 (QA-003 and QA-004 fixed; QA-008, 009, 010, 011, 012, 013, 016 open); Low 5 (QA-005, QA-007 fixed; QA-006 residual; QA-014, QA-015 open). Open at the end of the run: 0 High, 7 Medium, 2 Low, plus the QA-006 residual.

No finding is Critical: nothing corrupts a normal career without a hostile or unusual input, and the core simulation (matches, competitions, season rollover, determinism) held up very well (section 4).

---

## 2. Findings in detail

### QA-001 Relegated Saudi clubs kept 10 foreigners in a league with a cap of 8 — FIXED
* Reproduce: `createWorld({seed:'qa-sau', leagues:['SAU1'], preset:'standard', humanClubId:null, archiveRecent:400})`, `advanceToEndOfSeason` x3, `validateWorld`. Test `[QA-001]` in `qa/promotion.qa.test.ts` (3 seasons, ~27 s).
* Evidence before the fix: after season 1 `FOREIGN_LIMIT Club Bahrtaawoun has 10 foreign players (limit 8)` (3 clubs), 1 club after season 2; a weekly scan (seed `qa-mon`, 5 seasons) found a SAU2 club above 8 in 53-58 weekly samples. SAU1 itself never exceeded 10.
* Expected: registration limits of the new league hold after promotion/relegation.
* Status: `rollover.ts` now calls `enforceForeignLimit` for clubs changing league; re-run: no violation in 3 seasons. Regression test passes.

### QA-002 Asking price paid verbatim — FIXED
* Reproduce: `[QA-002]` in `qa/actions.qa.test.ts`. Human = lowest-reputation club of a compact ENG1 world (`qa-flip1..8`); sign cheap free agents with `signFreeAgentAction`, `listForTransfer(id, 15e6)`, advance 42 days.
* Evidence before the fix: free agents valued 133k-1.04M sold for exactly €15,000,000 in 6 of 8 worlds (max fee/value 112.8x). `resolveListedPlayersOfHuman` offered `askingPrice` without any valuation check. Free-agent signings did not set `lastMoveDay`, so there was no resale lock.
* Status: `transfers.ts:470` now refuses deals where the asking price exceeds the AI's valuation (`maxPay`). Re-run of the same 8 seeds: 0 sales. Tests pass.

### QA-003 NaN / Infinity inputs — FIXED
* Tests `[QA-003]` (5) in `qa/actions.qa.test.ts`.
* Evidence before the fix: `offerRenewal(w,id,NaN,3)` and `(…,Infinity,3)` returned `completed`; `signFreeAgentAction(w,id,Infinity,3)` set club cash to `-Infinity`; `validateWorld` → `WAGE_INVALID`, `FINANCE_NAN`. `years=NaN` gave `endDay = NaN`, which `validateWorld` does **not** detect (all comparisons with NaN are false) so the player never expires; `years=1e9` gave `endDay = 3.6e11`.
* Status: actions now return `ok:false` ("wage must be a finite weekly amount between 0 and 50,000,000", "contract length must be between 0.5 and 6 years"). Tests pass. Residual suggestion: add `Number.isFinite(endDay)` to `validateWorld` `CONTRACT_DATES` so imported/corrupt data is caught (see QA-009).

### QA-004 Releasing the last goalkeeper — FIXED
* Test `[QA-004]`. Releasing every releasable player left `NO_GOALKEEPER` for the human club, still present after 14 simulated days (human club is excluded from `aiFillSquad`). Fixed in tree; test passes.

### QA-005 Hostile ids — FIXED
* Test `[QA-005]` (2). `bidForPlayer`, `bidLoan`, `playerProfile` threw `TypeError` for `constructor`/`__proto__`/`toString`; `scoutReport`/`suggestTerms` returned `ok:true` with `abilityLow:-1`, `fee:null`. Fixed in tree (`Object.hasOwn`).

### QA-006 Event minutes not monotone — MOSTLY FIXED
* Test `[QA-006]` in `qa/match.qa.test.ts` (3000 matches). Before: 2240/3000 matches had an event whose minute was lower than the previous one (halftime at 48', next event at 47') because the display clock was rewound to 45:00 after first-half stoppage. After the fix (an `added` field exists) 2/3000 remain: both are extra-time matches where the last event is at 121' and `fulltime` is stamped 120' (e.g. matches `m196`, `m1908` of the test generator).
* Fix: stamp ET `fulltime` with `max(120, last minute)` or clamp events at 120.

### QA-007 Minor validation — FIXED
* `setTactics` accepted `maxSubs: 2.5`; `listForTransfer` accepted `Infinity`/`1e300` (becomes `null` after a JSON save). Fixed in tree; tests pass.

### QA-008 Unbounded cash hoarding — OPEN (Medium)
* Test `[QA-008]` in `qa/realism.qa.test.ts` (ITA1+GER1 standard, seed `qa-real`, 10 seasons, ~60 s).
* Evidence: max over clubs of cash / (broadcasting+sponsorship) after seasons 1..10: 1.1, 1.4, 2.1, 2.9, 3.6, 4.0, 4.4, 4.9, 5.1, 6.0. Script run to 12 seasons: richest club 161M → 900M cash (+≈75M/season, linear) while its TV+sponsor income stays 130-180M and its transfer budget grows to 371M (40% of cash) without being spent. Median club cash is stable (63M → 190M), so the existing long-run test (which checks only the **median**) cannot see it.
* Expected: surplus is invested/distributed (spec: "annual surplus investment/dividends"); cash plateaus.
* Recommendation: dividend/investment sink above N x revenue, and cap `transferBudget` growth; assert the **maximum** in `longrun.test.ts`.

### QA-009 Imports are not validated — OPEN (Medium)
* Tests `[QA-009]` (4) in `qa/persistence.qa.test.ts`. A document with a valid checksum (recomputed by a buggy exporter / hand-edit) is stored verbatim: negative wage and attribute 1e300 → accepted (`WAGE_INVALID`, `ATTR_RANGE`); clubs chunk removed → accepted (`UNKNOWN_CLUB`); `season:-3, day:1e15` → accepted with 1008 violations; players chunk `"hello"` → raw `TypeError: Cannot read properties of undefined (reading 'finishing')`; truncated chunk → raw `SyntaxError`. (`__proto__` keys did not pollute `Object.prototype` — verified OK.)
* Expected (DATA_AND_LICENSING.md): import verifies checksum and schema before accepting; I additionally expect structural validation and a typed `SaveCorruptedError`.
* Fix: in `decodeWorld`/`importSlot` wrap parsing in try/catch → `SaveCorruptedError`, run `validateWorld` and reject hard violations; add finite-number checks for contracts.

### QA-010 Replay inputs alias live objects — OPEN (Medium)
* Tests `[QA-010]` (2) in `qa/persistence.qa.test.ts` (~5 s each).
* Evidence: after 420 days of `qa-det` (ENG1+ESP1 compact) **68 of 116** retained replays, fed back to `simulateMatch`, give a different score than stored. `toMatchPlayer` stores `attrs: p.attrs` and `buildSheet` stores `tactics: club.tactics` by reference; weekly development mutates them in place. Consequence 2: `encodeWorld(live)` ≠ `encodeWorld(loaded)` for the `matches` chunk after further play (first diff `matches.42.replay.away.players.2.attrs.pace 71.22 vs 71.82`), contradicting "sim continues byte-identically after save/load". All other chunks stayed byte-identical (simulation determinism itself is intact — see section 4).
* Fix: deep-copy attributes/tactics when building `MatchInput` (`{...attrs}`, `structuredClone(tactics)`).

### QA-011 Suspensions wiped at the season boundary — OPEN (Medium)
* Test `[QA-011]` in `qa/discipline.qa.test.ts` (2 seasons x 4 leagues, ~15 s). `startSeason` sets `p.suspensions = {}` for everyone.
* Evidence: on the last day of season 1 there were 13 players with an unserved **league** ban (22-25 players with any ban per season in 40 clubs); all 13 had it removed at rollover. A red card in the last match of the season therefore costs nothing.
* Expected: bans carry over to the next edition of the same competition (yellow counters may reset).
* Fix: in `startSeason`, keep `suspensions` for league ids; reset only `yellows`.

### QA-012 Unbounded growth of players/history — OPEN (Medium)
* Tests `[QA-012]` (2) in `qa/growth.qa.test.ts` (NZL1, 6 clubs, 12 seasons).
* Evidence (tiny world): retired records 159 > active players 136 after 12 seasons; players+meta save size still growing +26% over the last 4 seasons. Standard world (548 clubs, script `grow.mts`): 72 s/season, save 24.6 → 28.5 → 32.4 MB (+3.9 MB/season; players chunk +3.0 MB/season, +1.2k retired players/season, +12.5k history lines/season, heap 80 → 126 MB after 3 seasons). Compact world (250 clubs, 8 seasons): players chunk 7.0 → 16.5 MB (+1.35 MB/season), retired 510 → 4427, `history.seasons` 171 KB → 1.2 MB (+147 KB/season), heap 58 → 169 MB (≈ +6 MB/season), 21-27 s per season (no slowdown). `transfers` is capped (60000, reached after ~13 standard / ~27 compact seasons), `news` (3000) and `matches` (2400) are capped.
* Projection to season 50: standard save ≈ 215 MB per revision (2 revisions are kept) — unusable on mobile; compact ≈ 125 MB.
* Fix: move retired players to a compact `legends`/archive form (the spec already keeps `history.legends`), cap per-player history, prune `history.seasons` detail.

### QA-013 Profile leaks exact ability — OPEN (Medium)
* Test `[QA-013]` in `qa/views.qa.test.ts`. `playerProfile(world, id).positions[primary].rating = Math.round(positionalOverall(p, p.primary))` — exact, hidden — for **450 of 450** players of other clubs, while `row.ability` is a noisy scouting estimate (mean absolute error 1.7). Defeats the scouting model promised in ARCHITECTURE.md ("hidden attributes of other clubs' players are replaced by scouting estimates").
* Fix: use the same `scoutedEstimate` (or the coarse `noise()`) for `positions[].rating` when `!exact`.

### QA-014 Save size dominated by replays — OPEN (Low)
* Test `[QA-014]` in `qa/savesize.qa.test.ts`. Compact default world after 1 season: save 40.5 MB, `matches` chunk 31.7 MB (78%): 540 retained matches (all continental/neutral) x ≈ 58 KB (events 11 KB + replay input 37 KB + player lines 10 KB). Save 1.0 s, second save 0.7 s, load 1.2 s on node:sqlite (acceptable; mobile will be slower).
* Fix: keep replay input for the human club's matches only, or store a diff.

### QA-015 Three consecutive home/away games over a season — OPEN (Low)
* Tests `[QA-015]` (n = 4, 8, 10, 18, 20) in `qa/competition.qa.test.ts`. `roundRobin` documents "no team ever has more than two consecutive home or away matches", which holds within each leg (verified for n = 4…24) but the mirrored second leg joins runs at the mid-season seam: 2 teams per league have a run of 3 (e.g. n = 20: T1 and T11).
* Fix: choose the leg-2 start orientation so that the seam does not extend runs (swap the first two rounds of leg 2).

### QA-016 Managers almost never get sacked — OPEN (Medium)
* Tests `[QA-016]` (2) in `qa/realism.qa.test.ts`. 38 clubs (GER1+ITA1) x 10 seasons: manager changes per season `0,0,0,0,0,1,1,0,0,2` = 1.1% of clubs per season (football: ≈15-25%); 82% of managers are still in the post they started in after 10 seasons. A 4-league compact run showed 2,2,0,0 changes in 4 seasons. The pool of unemployed managers stays at 20 and the "results-vs-expectation dismissals" feature of the spec is effectively inert, which also removes a source of churn in club quality.
* Fix: recalibrate dismissal hazard (board patience × points-per-game shortfall) and add manager retirement/ageing.

### Observations (not scored as defects, no failing test)
* `RuleSet.discipline.yellowsForBan = 5` for every competition (including UEFA/CAF) and `discipline.resetAfterRound` is read nowhere (dead field).
* `MatchResult.duration` ignores first-half stoppage time (cosmetic).
* Extreme mismatch (synthetic 95 vs 25): home wins >90%, mean total goals 10.8 per match; unusual but not an invariant violation.

---

## 3. Verified OK (ran and passed; sample sizes)

**Match engine (`qa/match.qa.test.ts`, 3000 + 4000 exploratory synthetic matches, mixed strengths, 50% knockout, 25% with extra time)**
* Goal events = score; running score +1 per goal; scorer/assist belong to the right team (own goals reversed); no self-assist; no own-goal assist; Σ player goals + own goals = score; second-yellow bookkeeping coherent; sent-off players never act again; subs ≤ 5 in regulation and ≤ 6 including ET; ET only when allowed and level after 90 (incl. aggregate offset); penalties only when still level; shoot-out events = reported pens; kick counts differ by ≤ 1; no ET/pens in league matches; minutes 0-125; ratings 1-10; SoT ≤ shots; possession sums to 100%; max total goals ≤ 14.
* Calibration (mixed strengths): goals 2.88/match, home/draw/away 41.5/24.7/33.8%, clean sheets 28.0% per team, yellows 3.6, reds 0.098, injuries 0.52 per match; 2.0 ms per match. Home advantage between equal sides positive and modest; win probability monotone in rating gap (n=1500 per cell); the −15 rating home side still wins 5-30%; mismatch lopsided but finite.

**Competition rules (`qa/competition.qa.test.ts`)**
* Tie-breakers: GD/GF, head-to-head before GD, three-way mini-table, UEFA subset re-application (hand-computed expectations), fair play, wins; 50 random 6-club tables x 3 tiebreaker lists give a deterministic permutation sorted by points.
* `roundRobin` for n ∈ {4,5,8,9,10,17,18,20,24}: every ordered pair once, one match per team per round, second leg mirrors the first, ≤ 2 consecutive in leg 1, home counts balanced.
* 14 competition runs through the real engine with real simulated matches: UCL 36, UEL 36, ACLE 24 (zones), COPA 32, CAFCL 16, CCC 27 (byes), OCL 8, ENG-CUP 20 and 11 (byes), USC, ESP-SC, CWC 32, ACL2 32, SUDA 32 — each ends with one winner and a distinct runner-up, unique fixture ids, nobody double-booked, final ranking contains every entrant once, ties decided by aggregate then (ET only when the aggregate was level after 90) then penalties, leg 1 never goes to ET/pens.

**Season continuity (`qa/seasons.qa.test.ts`, default compact world: 250 clubs, 32 leagues, ≈77 competitions, 3 seasons, ≈70 s)**
* `validateWorld(checkLedger)` clean at every boundary; all competitions complete on the final day (no force-played fixtures); every league has n(n−1) fixtures, each ordered pair once, equal home/away counts, all played, `tableOrder` sorted by points with the configured tie-break verified independently for 2-club ties, winner = leader (MLS excluded: play-off champion); club ids/names stable; player identity fields never change and players are never deleted; history seasons contiguous, champions agree with summaries and club trophy records (trophy totals = champion totals); no adjacent duplicate history stints; nobody on an expired/NaN contract; contract club matches registration (loans → parent); nobody in two squads; every club ≥ 16 players and a goalkeeper; finite cash, non-negative debt.
* Qualification (3 season starts): entrants unique and from the right confederation; UCL/UEL/UECL, ACLE/ACL2, CAFCL/CAFCC, COPA/SUDA never share a club; UCL and UEL winners re-enter UCL, UECL winner enters UEL or better; domestic super cups contain 2 distinct clubs including the previous champion; cup entrants = every club of the country.

**Promotion / relegation (`qa/promotion.qa.test.ts`)**: SAU1/SAU2 and ENG1/ENG2 standard pyramids, 3 seasons each: exactly 3 up / 3 down, promoted = top 3 of the lower table, relegated = bottom 3 of the upper table, league sizes constant (18/18 and 20/24), no club lost or duplicated, `leagueId` consistent with membership, hard invariants clean.

**Discipline (`qa/discipline.qa.test.ts`, 2 seasons x 4 leagues)**: every red card in a retained match yields ≥ 1 ban in that competition only; banned players never play; a ban decreases by at most one per match of that competition only.

**Transfers (`qa/transfers.qa.test.ts`, 3 seasons x 5 leagues: 495 permanent transfers, 353 free signings, 338 youth, 134 releases in the exploratory run)**: permanent transfers only inside both clubs' windows, no signings under embargo, no negative fees, nobody moved twice within 120 days, Saudi Pro League weekly foreign count never above 10, wages finite. Human actions: a Saudi club at the cap cannot exceed 10 foreigners via 150 transfer bids, every free agent and 250 loan bids; closed-window bids are rejected; NaN/Infinity/negative fees never complete; tactics validation rejects NaN tempo, maxSubs 11/−1, mentality 9, pressing 1000, unknown formation, wrong role count; retired and other-club players cannot be released/renewed/listed.

**Realism (`qa/realism.qa.test.ts`, ITA1 20 + GER1 18 clubs, 10 seasons, ~60 s)**: goals/match 3.0 (ITA) and 2.8 (GER), home 43-44%, draw 23-24%, away 33%, clean sheets 25-28%, yellows 3.4-4.25, reds 0.10-0.13; top scorers 20-38 goals (never above 40), champion 66-96 points, last place 16-34, points SD 10-16; ≥ 3 champions per league (max 6/12); age curve: +4.4/yr at 17, +1.0 at 22, 0 at 27, −1.0 at 30, −1.9 at 33; ability peaks at 26; best player 90.4, only 1 above 90; world invariants clean after 10 seasons.

**Persistence (`qa/persistence.qa.test.ts`)**: save → load → +220 days across a rollover is identical to the uninterrupted run for all state except the match archive (QA-010); 4 save/load cycles every 30 days do not drift; 60 random single-chunk corruptions (truncate, bit flip, delete, blank, idx shift, duplicate) of the newest revision always gave the older revision or `SaveCorruptedError`, never a wrong world; double corruption → `SaveCorruptedError` and `verify()` not ok; crash after chunk 0/3/8 during save leaves revision 1 loadable; only 2 revisions kept; newer schema (99) and foreign reference-data versions refused; a flipped byte in an export fails the checksum.

**Robustness (`qa/growth.qa.test.ts`)**: tiny NZL1 world runs 12 (script: 20) seasons without errors, season time flat (0.4-1.2 s), news/transfers/matches capped; single league with `standard` pulls in its second tier; unknown league ids and an empty league list do not crash; two tiny leagues run 2 seasons with clean invariants. Full-compact save+load ≈ 1 s each.

## 4. Not tested / limitations
* **Qualification slot counts and tie-break orders are scenario defaults** (`unverified-default`), so I tested mechanics, not real-world accuracy.
* The `standard` preset with all 548 clubs was run for only 3 seasons (≈72 s/season) via script; the 5-season ENG/SAU pyramids and ITA/GER realism worlds are the long standard-preset runs. A 30-season run of the full world was not attempted.
* Promotion/relegation exists only for ENG1/ENG2 and SAU1/SAU2 (the only pyramids in the registry); other leagues are never relegated.
* Manager style/tactics quality, in-match tactical adaptation, injuries' long-term effects and finance regulation (embargoes from squad-cost rules) were only checked indirectly through invariants and aggregate statistics.
* Human-player flows were tested through the API only (no UI); multi-season human careers with active management were not simulated, and `validateWorld` skips the foreign cap for the human club (I checked the cap separately for a Saudi club).
* Suspension logic could only be checked for matches whose player lines are retained (`world.matches[].players`: continental, neutral, human and the most recent 400); yellow-card accumulation to the threshold (5) was not observed in that sample (max 4 tracked), so the 5-yellow ban path is **untested**; red-card bans were observed 67 times in a 3-season exploratory run.
* Source files changed under me (3 rounds of fixes). Findings marked FIXED were re-run against the tree as of the last full run; QA-006 residual and the open items were confirmed in that same run.
* Existing tests (skimmed after writing mine, not used as an oracle): the long-run test asserts only the **median** club cash (misses QA-008), title-race bound `top/length < 0.9` is permissive, persistence tests compare worlds but not the match archive (misses QA-010), and there are no tests for NaN/Infinity action inputs, suspension carry-over, `validateWorld` not detecting NaN `endDay`, or profile information leaks.

## 5. How to reproduce a finding quickly
| Finding | Test (file → title fragment) |
|---|---|
| QA-001 | `promotion.qa.test.ts` → `[QA-001]` |
| QA-002…005, 007 | `actions.qa.test.ts` → `[QA-002]` … `[QA-007]` |
| QA-006 | `match.qa.test.ts` → `[QA-006]` |
| QA-008, 016 | `realism.qa.test.ts` → `[QA-008]`, `[QA-016]` |
| QA-009, 010 | `persistence.qa.test.ts` → `[QA-009]`, `[QA-010]` |
| QA-011 | `discipline.qa.test.ts` → `[QA-011]` |
| QA-012 | `growth.qa.test.ts` → `[QA-012]` |
| QA-013 | `views.qa.test.ts` → `[QA-013]` |
| QA-014 | `savesize.qa.test.ts` → `[QA-014]` |
| QA-015 | `competition.qa.test.ts` → `[QA-015]` |

Use `npx vitest run --config vitest.qa.config.ts qa/<file> -t "[QA-nnn]"`.
