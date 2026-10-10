# Adversarial Critic Report (Agent H)

Reviewer authority: this review rejects two designs outright (the persistence codec and the stored-replay archive; see "Design-level verdict") and demands rewrites of both.

Method. Every finding is either `[REPRODUCED]` (a script in `packages/engine/critic/` was run and its output is quoted) or `[CODE]` (a precise citation I read in the tree; no run needed). Nothing here is invented. Scripts run with `cd packages/engine && npx tsx critic/<file>.ts`. Monte Carlo uses `simulateMatch` with N = 2000..3000 per cell (standard error of a goal-difference cell is about 0.03-0.04).

Tree stability. Other agents edited `src/` while this review ran (22:02-22:17 UTC, 2026-10-09). Items I found that were FIXED before I finished are listed in section 3 and are not counted. Every OPEN item below was re-run after the last source change I observed (22:11-22:20 UTC) and still reproduces. Long-run numbers come from `critic/long1b.out` (8 seasons, current tree) unless stated; the finance probe (`world2.ts`) and the profile ran on the slightly earlier tree.

## 1. Ranked summary

| ID | Sev | Area | One-line | Status |
|---|---|---|---|---|
| CR-001 | Critical | persistence/security | A crafted save with a player id `__proto__` pollutes `Object.prototype` and turns the simulation into NaN | OPEN |
| CR-002 | High | persistence/security | Import/load never validate anything; the "verified checksum" is no protection; decode is superlinear in chunk count | OPEN |
| CR-003 | High | determinism/archive | Archived `replay` inputs alias live players/tactics: 0 of 200 replays reproduce their match; save/load changes the archive | OPEN |
| CR-004 | High | persistence/scale | Rows far above the "small rows" the code promises (3.1 MB, 1.9 MB); retired players kept forever; saves grow monotonically | OPEN |
| CR-005 | Medium | robustness | `validateTactics` throws on `__proto__`/`toString`/`constructor` role or formation ids | OPEN |
| CR-006 | Medium | gameplay/finance | The human club is treated as an AI club at rollover: 37% of its cash taken, wages raised, prospects processed, unasked | OPEN |
| CR-007 | Medium | information hiding | `playerProfile` reveals other clubs' attributes to within 0.23 overall while scouting claims 2.11 | OPEN |
| CR-008 | Medium | competition logic | In every single-leg cup tie the stronger club hosts (840/840) | OPEN |
| CR-009 | Medium | match engine/balance | Stacked tactical levers give up to +0.2 goals/match vs a balanced side; only single levers are tested | OPEN |
| CR-010 | Medium | world dynamics | 8-season drift: mean overall 53.1 to 51.5, goals/match 3.05 to 2.84, max cash 198M to 655M, 7 of 33 leagues won >= 5 of 8 times by one club | OPEN |
| CR-011 | Medium | finance | Unlimited automatic borrowing; wage floors vs tiny-league revenue (wages 4.6x revenue); loans/free agents bypass the wage budget | OPEN |
| CR-012 | Medium | rules | Configured rules never enforced (`minHomegrown`, `resetAfterRound`, knockout `penalties`); away-goals/aggregate paths unreachable and untested | OPEN |
| CR-013 | Medium | competition logic | League phase silently changes format when entrants % 4 != 0 (6 matches instead of 8) | OPEN |
| CR-014 | Low | world dynamics | Employed managers never retire (max age 68 to 75 in 8 seasons) | OPEN |
| CR-015 | Low | competition logic | Round-robin docstring is false: 2 teams per season get 3 same-venue games in a row, always across the leg boundary | OPEN |
| CR-016 | Low | competition logic | Best-runner-up ranking has no real tie-break: groups D and E lose 40/40 all-level draws (latent, not configured) | OPEN |
| CR-017 | Low | determinism | `Rng.fromSeed` folds a 53-bit hash to 32 bits (6 collisions in 200k seeds) | OPEN |
| CR-018 | Low | match engine | Goals per match depend on absolute quality (2.83 at q=35, 2.45 at q=88) and on the gap (2.67 to 5.53) | OPEN |
| CR-019 | Low | performance | `freeAgents()` re-sorts the whole free-agent set on every call: ~13% of CPU | OPEN |
| CR-020 | Low | code quality | Re-export hacks to silence unused imports, an import cycle, a 1,357-line `match.ts`, a dead branch, an unused `ownGoal` kind | OPEN |
| CR-021 | Low | rules | A straight red after a yellow is booked as a second yellow (1-match ban); bans and yellows are wiped at season start | OPEN |
| CR-022 | Low | world dynamics | 34% of academy-type creations are emergency cover outside rollover | OPEN |

Counts of open findings: Critical 1, High 3, Medium 9, Low 9 (22). Six further items were fixed during the review (section 3).

---

## 2. Findings

### CR-001 (Critical) Prototype pollution through a hostile save [REPRODUCED]
- Where: `src/world/matchday.ts:181-182` `statLine()` does `(world.seasonStats[compId] ??= {})` then `(m[p.id] ??= {...})`; `src/persistence/codec.ts:59-90` `decodeWorld` builds id-keyed objects from file data with no id validation; `src/persistence/repository.ts:206` `importSlot`; `src/players.ts:52` `for (const k in weights)`.
- Repro: `critic/pers1.ts` (seed `critic-p`, compact). A save whose best goalkeeper of one club carries `"id":"__proto__"` is accepted. After 21 simulated days: `({}).apps = NaN`, `({}).goals = NaN`, `({}).clubId = cl006`, and `Object.prototype` has enumerable `clubId, apps, minutes, goals, assists, yellow, red, ratingSum`. `weightedAvg` iterates with `for...in`, so the inherited keys leak into every attribute average; ratings become NaN while the sim keeps running without an exception.
- Expected: import rejects non-conforming ids; id-keyed maps cannot alias the prototype.
- Fix: schema-validate on import (id regex, finite numbers, 36-attribute arrays, ranges); use `Map` or `Object.create(null)` for `players/clubs/seasonStats/...`; never use `??=` on id-keyed plain objects; replace `for...in` with `Object.keys`.
- Regression test: build chunks with player id `__proto__`; `decodeWorld` must throw, and `Object.keys(Object.prototype)` must be empty after a 30-day sim.

### CR-002 (High) Import and load never validate; the checksum is not security [REPRODUCED]
- Where: `repository.ts:importSlot/load`, `codec.ts:decodeWorld`, `checksumOf` (53-bit cyrb53, stored in the same file as the data).
- Evidence: `critic/pers4.ts` (clean process): a save whose first player has `attrs` cut to 5 numbers (checksum recomputed by the file's author, which is trivial) is imported and stored. `validateWorld` on the loaded world reports 1 ATTR_RANGE violation, but nothing calls it, and the sim then runs 60 days without an exception. `critic/pers1.ts` DoS probe: `decodeWorld` with 8,000 and 16,000 extra tiny chunks takes 467 ms and 1,859 ms (superlinear: `codec.ts:61` rebuilds the per-kind array with a spread for every chunk).
- `docs/DATA_AND_LICENSING.md`: "Save import verifies a checksum and the schema version before accepting a file." True literally; it protects only against accidental damage.
- Fix: structural schema validation plus `validateWorld` inside `importSlot` and `load`; cap chunk count and chunk size; append with `push`.
- Test: import files with (a) attrs length 5, (b) `cash: null`, (c) a player in two squads, (d) 1e5 chunks; each must be rejected within 1 s.

### CR-003 (High) The match archive aliases live state; replays do not reproduce [REPRODUCED]
- Where: `src/synth.ts:9` (`toMatchPlayer` copies `attrs/positions/traits` by reference), `src/world/matchday.ts` `buildSheet` (`tactics: club.tactics`), `matchday.ts:326` (`replay: keepFull ? input : null`).
- Evidence: `critic/world1.ts`: immediately after a match the stored replay reproduces it (4-1 vs 4-1) and `sheet.attrs === livePlayer.attrs` is `true`. `critic/pers3.ts` (compact, +30 days): 0/200 archived replays reproduce their stored event log; example stored 4-2, replayed 3-2. After save then load, 157 of 2,400 archived matches differ between the live and the reloaded world, only in the field `replay`. Behaviour itself is identical: `critic/pers2.ts` finds 0/2,488 fixtures and 0/6,925 players different after +250 days. So the engine is deterministic across save/load, but the ARCHITECTURE ADR-002 claim that a match "can be replayed from `MatchInput` (the app stores it ...)" is false for the stored archive. The persistence determinism test digest omits `matches`, so it cannot see this.
- Fix: snapshot (deep copy) the sheet when archiving, or store a compact replay record (ids plus attribute snapshot); never keep references to mutable world objects in stored data.
- Test: play a human match, advance 4 weeks, `simulateMatch(stored.replay)` must equal `stored.events`; add `matches` to the save/load digest.

### CR-004 (High) Rows exceed the "small rows" design; saves and memory grow without bound [REPRODUCED]
- Where: `codec.ts:encodeWorld` (header comment: "Chunks keep individual rows small (mobile SQLite row limits)").
- Evidence (`critic/pers1.ts`, compact 250 clubs, 120 days): `matches` max chunk 3,124,283 bytes (100 matches including replay inputs), `seasonStats` 1,434,786 bytes in ONE chunk, `clubs` 372,958 in one chunk. Standard preset after one season (`critic/perf1.out`): `players` chunk 1.94 MB (400 players; grows with `history`), 24.6 MB total. To my knowledge Android's CursorWindow limit is about 2 MB per row; the device adapter is unexecuted (LIMITATIONS), so this is unverified on hardware but the chunking is clearly not byte-bounded.
- Growth (`critic/long1b.out`): players 6,382 to 10,822 over 8 seasons (+~550/season; retired players are never removed and weekly/annual loops still iterate them), save JSON 46.0 MB to 60.2 MB. Standard preset: 548 clubs, 15,236 players, RSS 405 MB after one season.
- Fix: chunk by byte size; split `clubs` and `seasonStats`; move retired players to a compact legends table and drop them from `world.players`; bound `Player.history`.
- Test: after 3 standard seasons every chunk <= 1 MB; the player table stays bounded over 20 seasons.

### CR-005 (Medium) Prototype-key lookups make validators throw [REPRODUCED]
- Where: `src/tactics.ts:validateTactics` (`ROLES[rid]`, `FORMATIONS[t.formation]` on plain objects); `matchday.ts:sanitizeTactics`.
- Evidence: `critic/world1.ts`: roles `__proto__`, `toString`, `constructor` throw `TypeError: Cannot read properties of undefined (reading 'includes')`; formations `toString`/`constructor` throw `... (reading 'length')`. `sanitizeTactics` exists to repair bad tactics but dies on exactly these inputs, so a corrupt human-club tactics object crashes the day loop.
- Fix: `Object.hasOwn` guard or `Map`. Test: `validateTactics` returns an error list for each of those ids.

### CR-006 (Medium) The human club is treated as an AI club at rollover [REPRODUCED]
- Where: `src/world/rollover.ts` `rolloverSeason` calls `investSurplus`, `annualWageReview` and `academyReview` for every club; only `trimSquad`, `aiFillSquad` and `refreshAiTactics` exclude the human.
- Evidence: `critic/world4.ts`: human club cash 3,134M before the rollover day, 1,969M after (forced dividends and facility spend), wages raised for 18 of 25 players, prospects 0 to 4, all without a user decision.
- Expected: automatic economic actions on the player's club are opt-in. Test: with `humanClubId` set, the cash change across rollover equals ledger revenue minus wages, and no contract changes.

### CR-007 (Medium) `playerProfile` leaks near-exact attributes [REPRODUCED]
- Where: `src/world/views.ts` `playerProfile` (`Math.round(v / 3) * 3`; position ratings from `positionalOverall`).
- Evidence (`critic/world3.ts`, 3,000 non-own players): mean |error| of true overall is 2.11 via the scouting estimate and 0.23 when rebuilt from the "coarse" attributes; `positions[].rating` is exact (78 vs scouted 80). `api.test.ts` asserts `value % 3 === 0`, so the test locks the leak in. ARCHITECTURE states hidden attributes of other clubs' players are replaced by scouting estimates.
- Fix: derive displayed attributes from `scoutedEstimate` noise and drop exact position ratings. Test: error of the rebuilt overall >= the scouting error.

### CR-008 (Medium) Single-leg cup ties are always hosted by the favourite [REPRODUCED]
- Where: `src/competition/engine.ts:224` (`ctx.info(home).coefficient >= ctx.info(away).coefficient ? [home, away] : [away, home]`) and the equivalent in `advanceKnockout`.
- Evidence: `critic/comp2.ts`: over 20 simulated ENG cups the stronger club hosts 840/840 non-neutral ties. Home advantage is large in this engine (equal teams 44/26/30; a +15 side wins 74% at home and 63% away, `critic/mc2.ts` and SIMULATION.md), so upsets are systematically suppressed. Expected: random draw for single-leg ties.
- Test: over 200 simulated cups the favourite hosts 40-60% of ties.

### CR-009 (Medium) Stacked tactical levers are free upgrades; only single levers are tested [REPRODUCED]
- Evidence: `critic/search1.ts`, random search over 70 configs (formation x sliders x mentality x marking x counter) vs balanced 4-3-3. The three best, re-tested on fresh seeds with N=3000 (se 0.03): +0.156, +0.142, +0.200 goals per match; all three have tempo 10 and defensive line 10. `critic/search2.ts` (N=3000): tempo 10 alone +0.082 (identical-tactics control -0.039); tempo 10 + line 10 + pressing 90 + mentality -2 + man marking +0.098. `tactics.test.ts` tests only single levers (tempo only at 85, never at 10) against a bound (0.2) 2-4x larger than the typical effect, so this class cannot fail it. SIMULATION.md: "There must be no unexplained universal bonus."
- Fix: add a random-combination sweep to `tactics.test.ts` (>= 100 configs) and re-fit tempo/line costs. Test: max over random configs of GD (N >= 1500) < 0.1.

### CR-010 (Medium) Long-run drift, dominance and cash growth [REPRODUCED]
- Evidence (`critic/long1b.out`, compact 250 clubs, 8 seasons): mean active overall 53.1, 52.6, 52.3, 52.2, 52.0, 51.8, 51.6, 51.5 (monotone, no plateau); goals/match 3.05 to 2.84 (consistent with CR-018); max club cash 198M, 300M, 315M, 361M, 441M, 537M, 613M, 655M; 7 of 33 leagues have one club winning >= 5 of 8 titles (EGY1, ESP1, MAR1, USA1: 7 of 8). `longrun.test.ts` passes anyway (see section 6).
- Fix: tighten stationarity bounds, find the net outflow (decline/retirement vs academy ability), add a title-concentration metric. Test: median drift <= 1 over 8 seasons; mean top-club share < 0.5.

### CR-011 (Medium) Finance: unlimited automatic borrowing, wage floors, wage-budget bypasses [REPRODUCED + CODE]
- Evidence (`critic/world2.ts`, 3 seasons, slightly earlier tree): a CRC1 club with 3M revenue and 15M wages (ratio 4.64) funded by 11M automatic borrowing; 7 of 250 clubs have wages above revenue; median wage/revenue 0.57. `finance.ts:balanceCash` borrows `-cash` with no cap; the only consequence is a 90-day embargo and an 8% budget cut when debt exceeds 2.2x revenue.
- [CODE] `transfers.ts:197` (`!offer.loan && ...`: loans skip the wage-budget test); `squad.ts` `signFreeAgent` has no wage-budget or window check; `aiTryBuy` lets owners with wealth >= 85 ignore wage room; `calendar.ts` `startSeason` sets `wageBudgetWeekly = max(bill * 1.03, ...)`, so the budget ratchets up to whatever the bill is. 4 of 250 clubs exceeded budget by > 10% (max 1.25x).
- Fix: cap automatic borrowing by revenue and force wage cuts or point deductions; floor wages by league revenue; count loan wages. Test: after 5 seasons no club has wages > 1.5x revenue.

### CR-012 (Medium) Configured rules that nothing enforces; rule paths nothing can reach [REPRODUCED + CODE]
- `minHomegrown` (ENG 8, GER 12) flows through `leagueSquadRules` and is never read. `discipline.resetAfterRound` is never read (yellows accumulate from season start until a ban, `matchday.ts:264-273`). `KnockoutStage.penalties` is never read (`critic/comp2.ts`). No registered competition sets `awayGoalsRule: true` (`critic/comp2.ts`: 0), so the away-goals branch of `resolveTie` is dead in production, and no test calls `resolveTie` or builds an aggregate tie directly (the only "two-legged" test asserts a config flag is false). `resolveTie` ends with a silent hash coin-flip labelled `penalties` when no decision exists, which would hide any future rule bug.
- Fix: enforce or delete; add direct `resolveTie` tests (aggregate, away goals, ET, pens, missing pens) and make the fallback throw under test.

### CR-013 (Medium) League phase changes format silently [REPRODUCED]
- `critic/comp1.ts` and `critic/comp4.ts` (UCL definition, synthetic clubs): n=18 and n=30 entrants silently become 3 pots and 6 matches per team (`effectivePots`); the tree now adds a note when a country constraint is relaxed, but not when the match count changes. With a skewed field (ENG = 40% of entrants) n=16 relaxes the country cap in 8/8 runs and n=28 contains same-country fixtures in 8/8 runs. SIMULATION.md promises "8 distinct opponents, 4 home/4 away", verified only at n=36.
- Fix: record format changes in `comp.notes` and surface them; test the documented 8/4/4 at n=36 and assert explicit behaviour for other n.

### CR-014 (Low) Managers never retire [REPRODUCED]
- `managers.ts:seasonEndManagerReview` only removes unemployed managers older than 70 from the pool; employed managers have no retirement. `critic/long1b.out`: max manager age 68, 69, 70, ..., 75 (+1 per season); unemployed pool 20 to 17. Test: no manager older than 75 after 30 seasons; the pool never empties.

### CR-015 (Low) Round-robin docstring is false [REPRODUCED]
- `fixtures.ts:49-55` says no team has more than two consecutive home or away games. `critic/comp3.ts` (100 seeds, two legs): 200 team-seasons (2 per season) have a run of 3, all across the first/second-leg boundary, for n=18 and n=20 (0 runs >= 4). Home counts are balanced. Fix: rotate the second leg's orientation at the boundary.

### CR-016 (Low) Best-runner-up ranking is order-biased (latent) [REPRODUCED]
- `engine.ts:520-533`: ties after points/GD/GF fall to array order. `critic/comp1.ts` (5 groups, every match drawn, 40 draws): the excluded runners-up were always groups D and E. No registry competition uses `bestOfPlace` and no test covers it.

### CR-017 (Low) 32-bit effective seed [REPRODUCED]
- `rng.ts:Rng.fromSeed` folds the 53-bit hash (`n % 2^32 ^ floor(n / 2^32)`) and seeds splitmix32 from 32 bits. `critic/match3.ts`: 200,000 fixture-like seeds give 6 collisions (4.7 expected). Colliding fixtures share one random stream; about 4 such pairs over 20 standard seasons. Use a wider state seed.

### CR-018 (Low) Goal rate depends on absolute level and gap [REPRODUCED]
- `critic/mc2.ts` N=3000: equal teams at q=35/50/62/75/88 give total goals 2.83/2.78/2.66/2.56/2.45; gap 0/8/15/25/40 gives 2.67/2.87/3.12/3.90/5.53 (home win 98% at +40). Starter spread has no effect (2.63 to 2.75). Rating terms are differences, so level invariance was expected; absolute terms remain in `resolveShot` (`0.004*(finishSkill-55)`, `0.002*(defend-60)`). Contributes to CR-010. Mirror test (strong left vs strong right side): 1.66 vs 1.68 goals, no asymmetry.

### CR-019 (Low) Performance hot spot [REPRODUCED]
- `critic/prof1.ts` + `profsum.mjs` (standard, 60 days): `idNum` 7.3%, `freeAgents` 3.8%, its sort closure 2.1%: `runtime.ts:freeAgents` copies and sorts the whole free-agent Set on every call (per AI club per transfer day, weekly `aiFillSquad`, `ensureFieldable`). `pickLineup` 7.3%, GC 7.3%. One standard season: 63.4 s on a loaded machine, median day 81 ms, rollover day 1.6 s (`critic/perf1.out`). Fix: keep the free index sorted incrementally.

### CR-020 (Low) Code quality [CODE]
- Re-exports that exist only to silence unused imports: `world/matchday.ts:392`, `world/views.ts:411`, `world/sim.ts:204`, `world/actions.ts:228`.
- Import cycle: `world/calendar.ts` imports `matchday`, `matchday` imports `squad`, `squad` imports `calendar` (`alignedContractEnd`). ARCHITECTURE presents the layering as a one-way chain.
- `src/match.ts` is 1,357 lines; `runSequence` is a ~170-line function with many unexplained inline constants (0.78, 0.62, 0.08, 0.3, ...); `MATCH_PARAMS` documents what is calibrated, not why.
- `rollover.ts` `expireContracts`: the loan branch is unreachable (loans are returned earlier in `rolloverSeason`, and the guard repeats the preceding `continue` condition).
- `GoalKind` contains `'ownGoal'`, never produced; the docblock above `colourMatchdays` (`fixtures.ts:201`) still describes a min-conflicts search the code no longer uses.

### CR-021 (Low) Discipline modelling [CODE]
- `matchday.ts:269-270`: any dismissal with a booking in the same match is "second yellow" (1-match ban), including yellow then straight red; bans and yellows are wiped at `startSeason` (`calendar.ts:75-76`), so a ban earned in the last match vanishes.

### CR-022 (Low) Talent created outside the academy [REPRODUCED]
- `critic/world2.ts` (3 seasons): 1,642 youth records, 562 (34%) on days that are not season rollover (from `ensureFieldable` and `aiFillSquad`), each a new player on a free 3-year contract.

---

## 3. Fixed during the review (not counted above)
- Human actions accepted NaN/Infinity (`offerRenewal(NaN)` made cash NaN; `signFreeAgentAction(Infinity)` made cash -Infinity; `maxSubs: NaN` accepted). `critic/world1.ts` now shows `ok:false` for all three.
- `MatchRules.maxSubsRegular` was ignored; now used (`match.ts:437`).
- `leaguePhasePairings().relaxed` was discarded; now reported via `comp.notes`.
- `docs/LIMITATIONS.md` was referenced but missing; now present.
- The biased `sort(() => rng.next() - 0.5)` shuffle in `tryLoanOut` (RNG consumption depended on the JS engine's sort; incompatible with the Hermes determinism claim) is now `rng.shuffle`.
- `void x;` hacks and tautologies (`left === windowDaysLeft`, `cash > 0 ? 0 : 0`, `? -1 : -1`, `rng.chance(0.85) ? c : c`, `debt * 0`) were removed from `src/`.

## 4. Design-level verdict

| Module | Verdict | Reasons |
|---|---|---|
| Match engine (`match.ts`, `players.ts`, `tactics.ts`) | Acceptable, incremental fixes | Statistics are derived from events and cross-checked. Seeds, home/away slot, LB/RB and LW/RW mirror, starter spread, role upgrades and substitution limits showed no hidden bias (N=2000-3000). Open: stacked-lever upgrades (CR-009), level/gap dependence (CR-018), one 1,357-line file (CR-020). |
| Competitions (`competition/*`) | Acceptable, incremental fixes | Tie-break recursion terminates and yields a total order; byes, brackets and the registry sweep hold. Open: favourite always hosts (CR-008), unenforced and unreachable rules (CR-012), silent format change (CR-013), latent order bias (CR-016). |
| World dynamics (`world/development, managers, rollover, generate`) | Needs incremental fixes | Invariants hold over 8 seasons and registration caps hold (0/13,000 samples), but drift, dominance and human-club automation (CR-006, CR-010, CR-014, CR-022) show the talent and economy loops are not stable or player-respecting yet. |
| Transfers and finance (`transfers.ts`, `finance.ts`, `squad.ts`) | Needs incremental fixes | One validated path and the ledger identity are sound; loan-release and flip/ping-pong hypotheses were not observed (0/24 loans, 0 flips, 1 A-B-A in 3 seasons). Open: unlimited borrowing and wage bypasses (CR-011). |
| Persistence (`persistence/*`) and the match archive | **Needs a rewrite** | Atomic revisions, parameterised SQL (no concatenation found) and fallback on corruption are good. But there is no input validation (CR-001, CR-002), the archive stores aliased live state (CR-003), and chunking ignores byte size (CR-004). I reject the current codec and archive design: it needs schema validation, snapshot archiving and byte-bounded chunks before it may handle user-shared files. |

## 5. Claims in docs not supported
1. DATA_AND_LICENSING: "Save import verifies a checksum and the schema version before accepting a file." Literally true, protects nothing against a crafted file (CR-001, CR-002).
2. ARCHITECTURE ADR-002: "A match can be replayed from `MatchInput` (the app stores it ...)". Stored replays reproduce 0/200 (CR-003).
3. `codec.ts` header / ADR-004: chunks "keep individual rows small (mobile SQLite row limits)". Observed 3.1 MB and 1.9 MB rows (CR-004).
4. ARCHITECTURE: a one-way dependency chain; `calendar -> matchday -> squad -> calendar` is a cycle (CR-020).
5. SIMULATION section 2: "no unexplained universal bonus" with tested bounds. Only single levers are tested; stacked levers reach +0.2 (CR-009).
6. SIMULATION section 4: league phases verified for "8 distinct opponents, 4 home/4 away" only at n=36; other n change format (CR-013).
7. SIMULATION section 5: wage bills track revenue; surplus investment/dividends. The human club's cash is also drained (CR-006) and tiny-league clubs run wages at 4.6x revenue (CR-011).
8. LEDGER LR-1 / `longrun.test.ts`: "keeps the talent pool stationary". Mean overall falls monotonically 53.1 to 51.5 inside the test's tolerance (CR-010).
9. `fixtures.ts` docstring: no more than two consecutive home or away games (CR-015).
10. ARCHITECTURE: hidden attributes of other clubs' players are replaced by scouting estimates (CR-007).

## 6. Weakest tests (and stronger replacements)
| Test | Why weak | Stronger replacement |
|---|---|---|
| `longrun.test.ts` "keeps the talent pool stationary" (median +-3, p95 +-6) | Passes with the observed 1.6-point monotone decline | Median drift <= 1 over 8 seasons plus a slope test |
| `longrun.test.ts` "keeps club finances bounded" (`cashMedian < first*6 + 2e8`) | The +2e8 slack alone exceeds the observed max cash | Bound the 99th percentile and cash/revenue |
| `longrun.test.ts` "title races stay open" (top share < 0.9) | One club winning 7 of 8 passes | Mean top-club share < 0.5 across leagues |
| `longrun.test.ts` `legends.length >= 0` | Tautology | Assert legends exist after N seasons with consistent career totals |
| `persistence.test.ts` / `world.test.ts` `digest()` | Omits `matches`/`news`, so the archive divergence (CR-003) is invisible; only the day-45 full-JSON round trip includes `matches` | Include every chunk kind in the digest and compare after 30+ further days |
| `api.test.ts` `expect(rejected).toBeGreaterThanOrEqual(0)`; score check built from `shots >= 0 ? ... : 0` | Always true | Assert at least one rejection; compare the score with the stored match |
| `api.test.ts` "attributes `% 3 === 0`" | Enforces the information leak (CR-007) | Assert rebuilt-overall error >= scouting error |
| `competition.engine.test.ts` "two-legged ties" | Asserts a config flag is false; `resolveTie` has no direct test | Table-driven `resolveTie` tests |
| `competition.engine.test.ts` "re-applies head-to-head to the remaining subset" | Asserts only 3 unique ids, true for any total order | Assert the exact expected order |
| `tactics.test.ts` mirrored matchups `< 0.45` vs sampling error ~0.08 | A ~5-sigma window; cannot detect a real 0.2 bias | ~2.5-sigma tolerance with larger n |
| `tactics.test.ts` single-lever bound 0.2 | Typical effects are 0.05-0.1, so a 3x regression passes; combinations untested | Random-combination sweep (CR-009) |
| `world.test.ts` "news is derived from facts" | The loop is vacuous when no upset news exists | Assert `results.length > 0` and cover each news kind |
| `world.test.ts` `void before` | Dead snapshot, never compared | Remove or compare |
| `world.test.ts` "no rapid ping-pong" | Re-states the 120-day guard inside `executeTransfer` | Check the whole transfers log including `free` and `loan` records |
| `regressions.test.ts` QA-003 prototype ids | Covers only `actions`; `validateTactics` and `decodeWorld` still break (CR-001, CR-005) | Extend to decode and tactics |

## 7. Hypotheses tested and rejected (negative results)
- Role upgrade set (sweeper keeper, ball-playing CB, wing-backs, ball-winner, box-to-box, playmaker, inside forwards, complete forward) vs default roles: -0.059 GD (control 0.008, se 0.036).
- `maxSubs` 9 / NaN / 0 vs 5: +0.013 / -0.027 / +0.001 (no effect).
- Left vs right mirror (LB/RB, LW/RW): 1.66 vs 1.68 goals; starter spread: no inflation.
- `keyedNoise`: mean 0.0015, flat deciles (no modulo bias).
- Registration: 0/13,000 squad-size samples and 0/2,080 foreign-cap samples over the limit; no borrower-releases-parent's-loanee case (0/24 loans).
- Event minutes monotonic (0/3000 non-monotonic); positions' goal shares plausible (ST 38%, CM 18%, CB 13%, GK 0%).

## 8. Not examined
Native iOS/Android and the `expo-sqlite` adapter (cannot run here); the mobile UI (`apps/mobile`); real-world calibration (no dataset); multi-season dynamics of the standard preset (only one standard season; 8 compact seasons; 3-season finance); the 80-competition registry beyond the sweep tests; transfer-market view performance on 15k players; Arabic/RTL localisation; `names.ts`; `records.ts` (added during the review).

## 9. Scripts
`critic/mc1.ts mc2.ts match3.ts search1.ts search2.ts` (match engine); `comp1-4.ts` (competitions); `world1-4.ts long1.ts perf1.ts prof1.ts` plus `profsum.mjs` (world); `pers1-4.ts` (persistence/security). Saved outputs: `long1.out`, `long1b.out`, `perf1.out`, `search1.out`, `search2.out`. Run `pers1.ts` in its own process (its pollution probe contaminates later probes); the clean truncated-attribute probe is `pers4.ts`.
