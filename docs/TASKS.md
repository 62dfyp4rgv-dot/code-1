# Task board

Statuses: BACKLOG · READY · IN PROGRESS · REVIEW · BLOCKED · DONE. "DONE" means implemented **and** verified by the evidence named in the row. Owners are the project's workstreams (A architect, B simulation scientist, C competitions, D player/club systems, E mobile, F data, G QA, H critic, I UX critic, J integration).

| ID | Owner | Task | Status | Evidence / note |
|---|---|---|---|---|
| T-001 | A | Spec, architecture, ADRs | DONE | docs/ARCHITECTURE.md, SIMULATION.md |
| T-002 | B | Seeded RNG, calibrated layered match engine | DONE | test/match, test/calibration |
| T-003 | B | Tactics: formations, roles, marking, weather, no free lunch | DONE | test/tactics (incl. matrix); ledger TB-1..3 |
| T-004 | C | Competition engine (leagues, groups, league phase, knockouts) | DONE | sweep over 80 definitions |
| T-005 | C | Registry: 10 majors, cups, super cups, tier-2, six confederations, CWC | DONE (rules unverified by design) | docs/DATA_AND_LICENSING.md |
| T-006 | C | Qualification slots/cascades/fill, promotion/relegation | DONE | world season tests |
| T-007 | D | World generation (fictional), squads, managers | DONE | test/world |
| T-008 | D | Finance: cash flow, installments, regulation, ledger identity | DONE | invariants + tests |
| T-009 | D | Development, ageing, academy, retirement | DONE | long-run test |
| T-010 | D | Transfers/loans/renewals with scouting uncertainty | DONE | world/api tests |
| T-011 | D | AI managers (tactics, dismissals) | DONE | world tests |
| T-012 | F | Persistence: transactions, revisions, checksum, migrations, import/export | DONE | test/persistence |
| T-013 | F | Invariant checker | DONE | world/invariants.ts |
| T-014 | E | Mobile app (all screens, EN/AR RTL, dark mode, saves) | REVIEW | sub-agent in progress; see apps/mobile/STATUS.md |
| T-015 | G | Independent QA suite + report | REVIEW | docs/reviews/QA_REPORT.md |
| T-016 | H | Adversarial code review | REVIEW | docs/reviews/CRITIC_REPORT.md |
| T-017 | I | Product/UX critique of the running app | BACKLOG | needs screenshots from T-014 |
| T-018 | J | Fix list from reviews; re-score | BACKLOG | |
| T-019 | B | Streaks, milestones, breakout/decline narratives | BACKLOG | |
| T-020 | D | Release clauses, work-permit rule, loan recalls | BACKLOG | |
| T-021 | D | Foreign-limit enforcement when a club changes league | READY | found by CLI integrity check |
| T-022 | C | Degenerate-field robustness (stuck competitions) | READY | found via tiny-config CLI run |
| T-023 | B | Performance: standard preset season time | BACKLOG | ~45 s desktop (contended) |
| T-024 | J | Native iOS/Android builds | BLOCKED | no SDK/Xcode/device in this environment |
