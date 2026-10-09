# Product requirements (condensed) and traceability

**Goal:** a stable, believable, data-driven football universe running offline on iOS/Android (React Native/Expo) where domestic leagues, continental competitions, clubs, players, managers, transfers, finances, injuries, tactics and seasons interact through one deterministic simulation engine.

## Requirement -> where it lives -> how it is verified

| # | Requirement | Implementation | Verification |
|---|---|---|---|
| R1 | Competition registry, not hard-coded leagues | `competition/registry.ts`, generic `competition/engine.ts` | `test/competition.engine.test.ts` sweeps all 80 definitions |
| R2 | Ten major leagues, configurable set; Saudi Pro League first-class | `LEAGUE_PROFILES`, `DEFAULT_MAJOR_LEAGUES`, SAU1 profile/rules | `test/world.test.ts` (squad cap, investor ownership), full-season tests |
| R3 | Domestic cups, super cups, lower divisions, promotion/relegation, reusable | `cupDef`, `superCupDef`, `PYRAMIDS`, `calendar.endSeason` | competition sweep; world season test; QA report |
| R4 | Continental competitions for all six confederations + FIFA Club World Cup | registry (UCL/UEL/UECL, ACLE/ACL2, CAFCL/CAFCC, CCC, COPA/SUDA, OCL, CWC) | sweep + full compact season completes all |
| R5 | Rules versioned by season, not invented | `RuleSet.fromSeason`, `verification` on every definition | docs/DATA_AND_LICENSING.md, UI shows status |
| R6 | Club/player/manager systems, squad depth, finances, youth, AI strategies | `world/*` | long-run test, world tests |
| R7 | Layered match engine with consistent statistics and replay | `match.ts` | `test/match.test.ts`, `test/calibration.test.ts` |
| R8 | Tactics with measurable consequences, no free bonus | `tactics.ts`, match terms | `test/tactics.test.ts` |
| R9 | Transfers, loans, renewals, scouting uncertainty, no invalid moves | `world/transfers.ts`, `squad.ts`, `actions.ts` | `test/world.test.ts`, `test/api.test.ts`, invariants |
| R10 | Development & ageing not a random walk | `world/development.ts` | long-run test; QA report |
| R11 | Injuries, suspensions, fatigue | `match.ts`, `matchday.ts`, `sim.ts` | calibration + world tests |
| R12 | Narratives derived from data | `matchday.narrate`, `calendar.endSeason` | news-vs-match test |
| R13 | Calibration targets + Monte Carlo + replay | `docs/SIMULATION.md` | calibration tests, replay test |
| R14 | Season/world calendar with day/week/season advance | `world/sim.ts` | world tests, determinism tests |
| R15 | Mobile app: dashboards, tables, fixtures, match centre, squads, players, tactics, market, finance, AI settings, hubs, records, calendar, saves, settings, EN/AR RTL, dark mode | `apps/mobile` | see `apps/mobile/STATUS.md` (web-verified; native unverified) |
| R16 | Persistence: transactions, migrations, integrity checks, deterministic save/load, backups | `persistence/*` | `test/persistence.test.ts` |
| R17 | Offline-first, no secrets in client, minimal data | whole design | docs/DATA_AND_LICENSING.md |
| R18 | Independent QA and adversarial review | `docs/reviews/*`, `qa/` | review reports |

Anything the table does not mark as verified is in `docs/LIMITATIONS.md`.
