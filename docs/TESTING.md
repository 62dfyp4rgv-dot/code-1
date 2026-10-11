# Testing

## Commands

| Command | What it does | Needs |
|---|---|---|
| `npm run test:fast` | 59 unit/integration tests of the simulation, AI, saves, data (≈ 50 s) | Node ≥ 20 |
| `npm run ui:test` | 18 Playwright tests drive the real UI in Chromium device emulation (≈ 1–2 min) | `playwright` + Chromium |
| `npm test` | everything above | both |
| `npm run validate:data` | data-integrity tests + content inventory | Node |
| `npm run bench` | simulation timing, save size/time, slice distribution | Node |
| `npm run balance [years] [seeds]` | multi-scenario long-run validation → `docs/BALANCE_REPORT.md` | Node |
| `npm run release:check` | syntax check of all files, required docs, unit + UI tests; prints PASS/FAIL | both |
| `npm run shots` | regenerates `docs/screenshots` from the running game | Playwright |

Playwright is resolved from the project (`npm i -D playwright`) or from a global install (`tools/pw.mjs`).
Run `npx playwright install chromium` if no browser is present. **Do not** treat Chromium results as iOS results.

## What the suites prove

### Simulation / data (`tests/unit`)
- **Data integrity** (`data.test.js`): roster ↔ map one-to-one, unique ISO codes, symmetric adjacency, every
  country has a capital region; tech prerequisites acyclic and tier-ordered; every tech modifier key is actually
  read by simulation code (no dead content); events reference valid stats and whitelisted effects; scenarios
  reference real countries.
- **Economy** (`economy.test.js`): t0 calibration (demand = output, world trade nets to zero); 24-month
  accounting identities per commodity (exports = imports, production − curtailment = consumption + stock change);
  stock-flow of capital and debt; 10-year boundedness over all countries; an energy shock propagates through the shared rules
  with no scripted chain.
- **Determinism and saves** (`determinism_save.test.js`): same seed ⇒ identical state; save → load → continue is
  bit-identical, including wars in progress and after post-load commands; header peek; no NaN/Infinity;
  truncated/corrupted/foreign saves rejected; size bound.
- **Commands & politics** (`commands_politics.test.js`): cost, preview, lag; invalid/unaffordable input; every
  command refuses missing arguments; research queue; elections; economy → approval link; regime collapse needs sustained instability.
- **War** (`war.test.js`): declaration bookkeeping, alliance/truce legality, supplied overwhelming force takes
  ground, unsupplied attackers stall, terrain matters, peace terms transfer or change nothing, finite state under full-scale war.
- **Diplomacy / intel / events** (`diplomacy_intel_events.test.js`): transparent proposal evaluation, costs,
  cooldowns; sanctions; chokepoint closure; organisation accession; covert ops incl. exposure; cyber; events fire from
  conditions with whitelisted effects; emergent events in a stressed economy; pandemic mechanics; UN resolutions
  (forecast = outcome, veto); scenario sanctions; achievements persist.
- **AI honesty** (`ai_lint.test.js`): static check that AI modules never read another country's true state
  outside `perception.js`, and never mutate other countries directly.

### UI (`tests/ui/ui.test.js`, Chromium emulating iPhone viewports)
Boot + new-game wizard; every sheet and tab renders without console errors; touch tap selection; pan, wheel and
CDP-synthesised pinch zoom; game loop and decision modal; policy slider; diplomacy flow; war UI; autosave +
reload → "Continue" recovery; accessibility attributes/labels; layout on 5 viewport sizes without horizontal overflow; shell cannot be scrolled sideways (regression for the landscape defect); end-of-game report + sandbox continuation; manual save slot → load round-trip; tutorial coach marks, new-game search and displayed seed honoured.

## What is NOT covered (be careful when reading green checks)
- No real-device or iOS Safari/WKWebView run: touch latency, memory pressure, backgrounding/kill behaviour,
  haptics, safe-area rendering with a real notch/Dynamic Island, and thermal behaviour are **unverified**.
- No Xcode build/unit-test run of `ios/` (`BundleSchemeHandlerTests.swift` has never executed).
- Frame-time numbers come from software-rendered headless Chromium.
- Balance targets are checked statistically over few seeds (`BALANCE_REPORT.md`), not by human play-testing at scale.
- Visual quality is assessed from screenshots by the authors and the independent review in `docs/SCORECARD.md`, not by user studies.

## Determinism rules for contributors
No `Math.random`, `Date`, or `performance.now` in simulation decisions (timing counters only); iterate arrays by index;
new randomness goes through `sim.rng` (stream) or `hash01` (stateless); everything that influences future steps
must live in `sim.state` or be recomputed in `postLoad()`. Add a case to `determinism_save.test.js` when you add state.
