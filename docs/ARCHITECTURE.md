# Architecture

## Stack and rationale (ADR-001)

| Concern | Choice | Why |
|---|---|---|
| Language | TypeScript (strict, `noUncheckedIndexedAccess`) | One language for engine, tests and app; strong typing for a large domain model. |
| Simulation core | `packages/engine` — pure TS, **zero runtime dependencies**, no I/O, no globals | Runs unchanged in Node (tests, CLI), Hermes (iOS/Android) and the browser; deterministic and unit-testable. |
| Mobile app | React Native + Expo (Expo Router) in `apps/mobile` | Mature cross-platform stack; the same code renders on web, which is how the UI is verified in this environment. |
| Persistence | SQLite behind a `SqlDriver` interface (`expo-sqlite` on device, `node:sqlite` in tests); IndexedDB store on web | Real SQL (constraints, transactions, migrations) is tested against Node's SQLite; the device adapter is a thin wrapper. |
| Tests | Vitest + fast-check (property tests) | Fast, TS-native. |

Alternatives rejected: Unity/Flutter (would split engine and app languages, no shared tests); server-side simulation (the product must work offline).

## Module map (`packages/engine/src`)

```
rng.ts, math.ts            seeded PRNG (sfc32), hashing, log-odds helpers
types.ts                   domain model: Player, Club, Manager, Tactics, Contract, ...
players.ts                 attribute model, position weights, skills, generation
tactics.ts                 formations, roles, tactical profile (single source of tactical effects)
match.ts                   layered match engine (possession sequences -> shots -> events -> stats)
lineup.ts                  XI/bench selection, formation choice, role suggestion
competition/
  types.ts                 data model for versioned competition definitions + runtime state
  registry.ts              DATA: 29 league profiles, 80 competition definitions
  fixtures.ts              round-robin, pot-based league phase, exact matchday 1-factorisation, bracket/byes
  standings.ts             tables with configurable tie-breakers incl. recursive head-to-head
  engine.ts                generic stage state machine (leagues, groups, league phase, knockouts)
  qualification.ts         slot tables, cascades, title holders, fill rules -> next season's entrants
world/
  generate.ts, names.ts    procedural, clearly fictional universe
  runtime.ts               derived indexes (squads, free agents, loans) kept canonical for determinism
  sim.ts                   the world clock: advanceDay / advanceDays / advanceToEndOfSeason
  matchday.ts              fixture -> lineups -> match -> consequences (stats, injuries, bans, money, news)
  calendar.ts, rollover.ts season start/end, awards, promotion/relegation, reputations, retirements, youth
  transfers.ts, squad.ts   single validated transfer/registration path used by AI and the player
  finance.ts               weekly cash flow, installments, owner support, borrowing, regulation
  development.ts           weekly attribute development, ageing, potentials, academy intake
  managers.ts              AI manager tactics, dismissals, appointments
  views.ts, actions.ts     the UI contract: read-only view-models and validated commands
  invariants.ts            validateWorld(): integrity checks (also used at runtime from the app)
persistence/
  driver.ts, repository.ts SaveRepository: slots, revisions, checksums, atomic transactions
  codec.ts, migrations.ts  chunked/packed encoding, forward-only snapshot migrations
index.ts                   the only entry point the app imports
```

Dependency direction: `rng/math/types -> players/tactics -> match -> lineup -> competition -> world -> persistence`. `competition/` knows nothing about matches or clubs (it receives `TeamInfo` and results through an `EngineContext`), and `match.ts` knows nothing about competitions. The world layer is the only place that joins them.

## Determinism design (ADR-002)

There is **no global or persisted RNG state**. Every consumer derives a stream from a string seed, e.g. `Rng.fromSeed("<worldSeed>:mi:<fixtureId>")`. Consequences:

* A match can be replayed from `MatchInput` (the app stores it for the user's matches and continental matches).
* Save/load needs no RNG state; "same state + same seed => same future" holds (tested: sim continues byte-identically after save/load).
* Iteration order must also be canonical: derived indexes (squads, free agents) are kept sorted by player id, otherwise a reloaded world consumes random numbers in a different order. This was a real bug found by the persistence tests.

## Competition model (ADR-003)

Competitions are *data* (`CompetitionDef`) with **rule sets versioned by season** (`rules[].fromSeason`). Stage types: `roundRobin`, `groups`, `leaguePhase` (Swiss-style, pots, zones), `knockout` (1/2 legs, byes, extra time, penalties, aggregate). Pairing strategies (`random`, `seeded`, `playoffSeeded`, `leaguePhaseBracket`, `regionalSeeded`, `zonalSeeded`, `bracket`) are generic; no league has special-case code. Saudi Pro League support is expressed as a league profile (finances, investor ownership share, foreign-registration cap, transfer aggression, windows) plus a rule set — see `docs/SIMULATION.md`.

## Persistence (ADR-004)

Reference data (the competition registry, name pools) ships in the bundle and is identified by `REFERENCE_DATA_VERSION`; career data is the `WorldState` snapshot. A save is written as **a new revision inside one transaction** (chunks: meta, clubs, managers, players(400/chunk), one chunk per competition, stats, matches, transfers, news) with a checksum; the previous revision is retained. `load` verifies the checksum and falls back to the previous revision on corruption. Forward-only snapshot migrations (`persistence/migrations.ts`) are tested with a synthetic v0 save.

## What the UI may and may not do

The app imports only `@fu/engine` (`src/index.ts`). It reads through `views.ts` (hidden attributes of other clubs' players are replaced by scouting estimates) and mutates only through `actions.ts` or `advanceDay*`. `validateWorld` is exposed so users and tests can check integrity at any time.
