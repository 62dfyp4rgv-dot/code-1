# Roles and how they were exercised

The brief names 13 specialist roles (A–M). This project was produced by **a single AI coding agent session** that worked through the
roles sequentially; no human team existed, and two independent reviewer sub-agents (one per round, each with fresh context) evaluated it (see SCORECARD.md).
Role responsibilities were therefore emulated as work phases with distinct artefacts and gates — not as independent parties.
Scores given by the same agent that wrote the code are *self-assessments*; only the independent review is weighted as external evidence.

| Role | Responsibility in this project | Artefacts |
|---|---|---|
| Producer / Orchestrator | Scope control, task order, gates, decisions | DECISIONS.md, TASKBOARD.md, JOURNAL.md |
| Systems architect | Stack choice, layering, determinism, save format | ARCHITECTURE.md |
| Economy designer | Macro model, trade, calibration, invariants | `economy.js`, `trade.js`, economy tests |
| Military/logistics designer | Forces, supply, combat, peace | `military.js`, `war.js`, war tests |
| Diplomacy/AI designer | Opinion, treaties, organisations, AI behaviour & fog of war | `diplomacy.js`, `ai/*`, ai_lint |
| Content/narrative designer | Events, techs, scenarios, data tables | `app/data/*`, DATA_SOURCES.md |
| UX/UI designer, Visual artist | Touch-first layout, design system, map rendering, icons | `app/css`, `app/js/ui`, screenshots |
| Audio/feel | WebAudio SFX, haptics bridge | `audio.js` |
| QA / balance engineer | Unit/UI tests, long-run balance, benchmarks | `tests/`, `tools/balance.mjs`, `tools/bench.mjs` |
| Build/release engineer | CI, release gate, iOS shell | `.github`, `tools/release-check.mjs`, `ios/` |
| Independent evaluator | Fresh-context assessment, evidence-based scoring | SCORECARD.md |
