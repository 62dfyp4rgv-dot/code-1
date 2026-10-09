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

---
## Reproduced findings, batch 1 (all numbers produced by scripts in `packages/engine/critic/`)

### CR-001 (Critical) Prototype pollution through a hostile/shared save file [REPRODUCED]
- Where: `src/world/matchday.ts` `statLine()` (`(m[p.id] ??= {...})`), plus every `x[id] ??=` / `world.players[id]` pattern; `src/persistence/codec.ts:decodeWorld` (no validation); `src/persistence/repository.ts:importSlot`.
- Repro: `npx tsx critic/pers1.ts` (seed `critic-p`, compact). A save whose best goalkeeper of one club has `"id":"__proto__"` is accepted by `decodeWorld`; after 21 simulated days:
  `({}).apps = NaN`, `({}).goals = NaN`, `({}).clubId = cl006`, and `Object.prototype` now has enumerable `clubId, apps, minutes, goals, assists, yellow, red, ratingSum`.
  Because `players.ts:weightedAvg` iterates `for (const k in weights)`, the inherited enumerable keys leak into every weighted average, so all later ratings are NaN and the sim keeps running silently.
- Expected: import rejects ids that are not `/^[a-z]\d+$/`; world maps are `Map` or `Object.create(null)`.
- Fix: schema-validate every imported entity (id format, finite numbers, attr array length 36, range), build id-keyed maps with `Object.create(null)`, never `??=` on id-keyed plain objects.
- Regression test: decode a chunk set whose player id is `__proto__`; expect a thrown validation error and `Object.keys(Object.prototype).length === 0` afterwards.
- DATA_AND_LICENSING.md claims "Save import verifies a checksum and the schema version before accepting a file". The checksum (`checksumOf`, 53-bit cyrb53) is stored inside the same file, so it protects only against accidental corruption, not against a crafted file.

### CR-002 (High) Imported save is never semantically validated [REPRODUCED]
- `importSlot` -> `decodeWorld` -> `save` never call `validateWorld` or any schema check. `critic/pers4.ts` (isolated process, seed `critic-p`): a save whose first player has `attrs` truncated to 5 numbers (checksum recomputed by the file author, which is trivial) is imported and stored; `validateWorld` on the loaded world reports 1 ATTR_RANGE violation but nothing ever asked it. The round trip through `packPlayer` turns the missing attributes into `null` (JSON of NaN) and the sim keeps running for 60 days without error, silently treating them as 0 / clamping them in development. Any other malformed field (negative wages, wrong `clubId`, huge arrays) is accepted equally.
- Note on method: an earlier version of this probe ran after the prototype-pollution probe in the same process and showed 6382 NaN players; that was contamination from CR-001, not from this bug, and has been discarded.
- Fix: run `validateWorld` + a structural schema check inside `importSlot`/`load` and refuse (or quarantine) invalid saves.
- Test: import a save with each of: attrs length 5, club cash `null`, duplicated player id across squads; expect rejection with a descriptive error.

### CR-003 (High) Human-facing actions accept NaN/Infinity and destroy the finance state [REPRODUCED]
- `critic/world1.ts`:
  - `offerRenewal(world, id, NaN, 3)` returns `completed` (`actions.ts` `score <= -0.15` is false for NaN); contract wage becomes NaN; after 8 days the club's `cash` is `NaN` (was 131,891,189). `validateWorld` flags only the wage.
  - `signFreeAgentAction(world, id, Infinity, 3)` returns `completed`; club `cash` is `-Infinity`.
  - `setTactics` with `maxSubs: NaN` returns `{ok:true}` (`tactics.ts:212` uses `<`/`>`).
  - `bidLoan` takes an unchecked `endDay` (NaN/Infinity) and `parentWageShare` NaN passes `clamp`.
- Fix: validate every numeric argument with `Number.isFinite` and sane ranges (wage <= k * market value, years in 1..5, endDay integer); make `clamp` NaN-safe.
- Test: property test over `[NaN, Infinity, -Infinity, -1, 1e300]` for each action, asserting the action fails and `validateWorld(world)` is unchanged.

### CR-004 (High) Prototype-key lookups crash validators and (via corrupt save) the day loop [REPRODUCED]
- `tactics.ts:validateTactics` does `ROLES[rid]` / `FORMATIONS[t.formation]` on plain objects. `critic/world1.ts`: roles `__proto__`, `toString`, `constructor` and formations `toString`, `constructor` make `validateTactics` THROW (`Cannot read properties of undefined`) instead of returning an error list; `setTactics` is therefore exception-prone. `matchday.ts:sanitizeTactics` calls it for the human club every match, so a corrupt save crashes `advanceDay`.
- Fix: `Object.hasOwn` guards or `Map`.

### CR-005 (High) Save/load are NOT equivalent: the archive aliases live state, and chunk sizes exceed the stated "small row" design [REPRODUCED]
- Chunk sizes (critic/pers1.ts, compact 250 clubs, 120 days): `matches` max chunk **3,091,221 bytes** (100 matches/chunk with embedded replay inputs), `seasonStats` 1,424,438 bytes in ONE chunk, `clubs` 372,513 bytes in one chunk, `players` 424,264. Total matches payload 16.9 MB of a ~26 MB save. `codec.ts` header claims chunks "keep individual rows small (mobile SQLite row limits)". Android CursorWindow is 2 MB per row, so the matches/seasonStats rows already exceed it for a compact world; the standard (550 clubs) preset will be worse.
- Round trip: `checksumOf(encodeWorld(a)) === checksumOf(encodeWorld(decodeWorld(encodeWorld(a))))` is true immediately, but FALSE after both worlds then run 200 more days (critic/pers1.ts). Per-chunk breakdown and root cause are in CR-006.
- ARCHITECTURE.md ADR-002 / SIMULATION claim "sim continues byte-identically after save/load" - not supported beyond the short horizon tested.
