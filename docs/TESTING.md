# Testing strategy

## Layers

| Layer | Where | What it proves |
|---|---|---|
| Unit | `test/rng.test.ts`, parts of `competition.engine.test.ts` | PRNG moments/determinism, tie-breaker algebra |
| Property-based (fast-check) | `rng.test.ts` | shuffle is a permutation, bounds hold for arbitrary seeds |
| Match consistency | `test/match.test.ts` | stats derivable from events, reconciliation of player/team totals, no actions after dismissal/substitution, replay determinism, knockout resolution |
| Statistical calibration | `test/calibration.test.ts` | league-wide distributions inside target bands (Monte Carlo, n=2500) |
| Tactical balance | `test/tactics.test.ts` | no lever/archetype/formation is a free upgrade; marking and weather have the stated costs |
| Competition invariants | `test/competition.engine.test.ts` | every one of 80 definitions generates valid fixtures and plays to a single winner |
| World integration | `test/world.test.ts`, `test/api.test.ts` | full compact season: all competitions complete; invariants, ledger reconciliation; views/actions behave and never corrupt the world |
| Long-horizon adversarial | `test/longrun.test.ts` | 8 seasons: no invariant breach, stationary talent, bounded finances, open title races |
| Persistence | `test/persistence.test.ts` | exact round-trip, determinism across save/load, atomicity under interruption, corruption fallback, migration, import/export |
| Independent QA | `qa/` (written by a separate agent from the spec) | see `docs/reviews/QA_REPORT.md` |
| Mobile | `apps/mobile` | typecheck, unit tests, Playwright e2e on the web build (see its STATUS.md) |

## Running

```bash
npm install
npm run typecheck           # tsc --noEmit (engine)
npm test                    # full engine suite (~5-8 min; Monte Carlo + multi-season sims)
npx vitest run test/match.test.ts    # one file
npm run sim -- --seed s --preset compact --seasons 3     # headless CLI + integrity check
```

## Invariants (`world/invariants.ts`)
No player in two squads; squad index equals `player.clubId`; contracts well-formed and never expired while registered; loans consistent; foreign cap respected; every club has a goalkeeper and a manager; leagues partition the clubs; no double-booked club-day; unique fixture ids; complete competitions have winners; **cash = seasonStartCash + Σ ledger**; transfer money nets to zero across clubs; history contiguous; attribute/fatigue/form ranges.

## What the tests do NOT prove
Real-world accuracy of any rule or statistic (see DATA_AND_LICENSING.md); behaviour on physical devices; performance on low-end phones; perceived fun/usability.
