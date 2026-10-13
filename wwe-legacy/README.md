# WWE Legacy — Ultimate Career RPG

A mobile-first career RPG about a professional wrestler, built as a zero-dependency ES-module codebase that runs
identically in Node (tests, simulations) and in the browser (the iPhone UI, installable as a PWA).

> **Unofficial fan project.** Real-name rosters, shows and records in the historical modes are *approximate and
> unverified* (flagged `approx:true` in data and in the UI). Fictional results are never presented as real history.
> See `docs/FEATURE_STATUS.md` for exactly what is complete, partial or unimplemented.

## Run it

```bash
cd wwe-legacy
npm install            # only esbuild (build-time) and Playwright for the e2e test; the game itself has no runtime deps
npm test               # unit, integration and simulation tests (node --test)
npm run build          # -> dist/web/ (PWA) and dist/artifact.html (single self-contained file)
npm run serve          # http://localhost:5173 — open on a phone on the same network, then "Add to Home Screen"
node tools/e2e.js      # drives the real UI in headless Chromium at iPhone size (needs Playwright + Chromium)
node tools/gauntlet.js --round N   # measure, score and report a Gauntlet round (docs/gauntlet/)
```

`dist/artifact.html` is a single file that works offline; saves use IndexedDB with localStorage and in-memory fallbacks.

## What is in the box

| Area | Where | Notes |
|---|---|---|
| Match engine | `src/match/` | Authoritative JSON state machine; attacker action → defender stance → resolve. Nine rulesets plus a 30-man Royal Rumble. |
| Persistent memory | `src/memory/` | Hash-chained immutable ledger, rule-driven world state, retrieval, evidence-checked summaries. |
| Achievements + Record Book | `src/achievements/`, `src/career/` | 192 declarative definitions, evidence event ids, every number opens to its evidence. |
| Career | `src/career/`, `src/game.js` | Creation, training, bookings, contracts, injuries, titles, post-match choices, media. |
| Universe | `src/universe/`, `src/data/` | Calendar of weekly shows and PLEs, rosters, titles with lineage checks, AI-vs-AI matches, feuds, alliances, betrayals, churn. |
| Stories | `src/story/` | Data-driven scenarios, promos, interviews / podcasts / press conferences built from ledger facts. |
| Saves | `src/save/` | Versioned, checksummed, gzip, three slots + autosave + backup, migrations. |
| UI | `ui/` | Vanilla JS, safe-area aware, 4 text sizes, light/dark/system, offline PWA. |

## Documents

- `docs/GDD.md` — game design
- `docs/ARCHITECTURE.md` — modules, invariants, data flow
- `docs/SCENARIO_FORMAT.md` — authoring contract for story templates
- `docs/FEATURE_STATUS.md` — honest completion report
- `docs/gauntlet/` — per-round measurements; `docs/DEVELOPMENT_LEDGER.md` — what changed and why; `docs/CHECKPOINT.json` — resume point
- `docs/QUALITY_REPORT.md` — final quality report (generated at the end of the Gauntlet)

## Resuming development

`docs/CHECKPOINT.json` records the last round, scores, the biggest remaining score losses and the exact commands to continue.
