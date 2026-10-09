# Critic Report (Agent H) - DRAFT, written incrementally

Status: IN PROGRESS. Sections below are appended as findings are confirmed. Each finding is tagged
`[VERIFIED-CODE]` (precise code citation read in the current tree) or `[REPRODUCED]` (a script in
`packages/engine/critic/` was run and its output is quoted). Findings still tagged `[PENDING-REPRO]` have
only been confirmed by reading code.

Code reviewed is the tree as of the coordinator's message (roundRobin home/away fix and
`src/world/development.ts` retune included; both were re-read).

## Code-citation findings (verified by reading, reproduction pending)

- CR-A `MatchRules.maxSubsRegular` is declared (`src/match.ts:75`) and filled (`src/world/matchday.ts:174`,
  `src/synth.ts:53`) but never read by the engine; substitution cap is `Tactics.maxSubs` (`match.ts:826,965,992`),
  validated only as `0..9` with `<`/`>` comparisons (`src/tactics.ts:212`), so `NaN` passes and `9` is legal.
- CR-B `leaguePhasePairings` returns `relaxed` (`src/competition/fixtures.ts:89,118`) but no caller reads it
  (grep: only definition/return). `SIMULATION.md`/`fixtures.ts:104` claim relaxation "is reported, never silently".
- CR-C `docs/SIMULATION.md` section 6 refers to `docs/LIMITATIONS.md`, which does not exist.
- CR-D `void x;` hacks / dead code: `match.ts:368,1312`, `lineup.ts:106`, `world/transfers.ts:430,454`,
  `world/calendar.ts:252`, `world/matchday.ts:375-376`, `world/generate.ts:207,275,276`, `world/rollover.ts:30,64,196,206`,
  `world/managers.ts:168,170`, `world/views.ts:248`, `world/invariants.ts:166`, `competition/qualification.ts:160`.
  Tautologies: `transfers.ts:432` (`left === windowDaysLeft(...)` is always true), `squad.ts:112`
  (`rng.chance(0.85) ? country : country`), `squad.ts:97` (`debt * 0`), `matchday.ts:32` (`cash > 0 ? 0 : 0`),
  `match.ts:1043` (`? -1 : -1`), `match.ts:1297` (`l.goals * 0`).
- CR-E `world/transfers.ts:480` `.sort(() => rng.next() - 0.5)`: biased shuffle whose RNG consumption depends on the
  JS engine's sort algorithm (V8 vs Hermes) - breaks the "runs unchanged in Hermes, deterministic" claim in ARCHITECTURE.md.

(Detailed findings with numbers follow once reproduced.)
