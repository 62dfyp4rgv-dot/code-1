# Football Universe

An offline, deterministic, multi-league football simulation: ten major domestic leagues (including a first-class Saudi Pro League), second tiers with promotion/relegation, domestic cups and super cups, the principal club competitions of all six confederations plus the FIFA Club World Cup, with clubs, players, managers, tactics, transfers, finances, injuries, development and seasons interacting through one engine — and a React Native (Expo) app on top.

> **Honest status.** Everything is **fictional and procedurally generated**. Competition formats and qualification slots are **configured scenario defaults, not verified against current official regulations** (the UI says so). Native iOS/Android binaries were **not built or run** in the authoring environment (no SDKs/devices); the UI is verified on the web build of the same code. See [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md) and [`docs/SCORECARD.md`](docs/SCORECARD.md) for what is and is not claimed.

## Repository layout

```
packages/engine   pure TypeScript simulation core (no platform dependencies) + tests + CLI
apps/mobile       Expo / React Native app (Expo Router), consumes only @fu/engine's public API
docs/             architecture, simulation spec, data/licensing, testing, risks, tasks, ledger, reviews
```

## Quick start

```bash
npm install                                  # installs all workspaces (Node >= 22)
npm run typecheck                            # engine type-check
npm test                                     # full engine test suite (several minutes)
npm run sim -- --seed demo --preset compact --seasons 2 --save demo.sqlite   # headless run + integrity check
```

Mobile (see [`apps/mobile/README.md`](apps/mobile/README.md) for details):

```bash
cd apps/mobile
npx expo start                               # Expo Go / dev build on a device or simulator
EXPO_OFFLINE=1 CI=1 npx expo export --platform web   # web build used for automated UI verification
```

## Documentation

| Doc | Purpose |
|---|---|
| [ARCHITECTURE](docs/ARCHITECTURE.md) | stack, modules, determinism, persistence, ADRs |
| [SIMULATION](docs/SIMULATION.md) | the mathematical model, calibration targets and measured results |
| [DATA_AND_LICENSING](docs/DATA_AND_LICENSING.md) | what data is real/fictional/unverified; provider checklist; privacy |
| [TESTING](docs/TESTING.md) | strategy, invariants, how to run |
| [PRD](docs/PRD.md) | requirement traceability |
| [TASKS](docs/TASKS.md), [LEDGER](docs/LEDGER.md), [RISKS](docs/RISKS.md) | task board, defect/fix ledger, risk register |
| [reviews/](docs/reviews) | independent QA and adversarial critic reports |
| [SCORECARD](docs/SCORECARD.md) | weighted rubric score with evidence |
| [LIMITATIONS](docs/LIMITATIONS.md) | what is partial or missing |
