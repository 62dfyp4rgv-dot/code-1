# Development Ledger

One entry per Gauntlet round: what was targeted, what changed, what was measured. Scores come from tools/rubric.js.

## Round 1

- Target: Baseline measurement before any gauntlet-driven improvement
- Changes: none (baseline)
- Mean 7.63 | min 5.45 | >=9: 3/12 | tests 90/90
- Weakest: Narrative quality 5.45, Career progression 5.57, Performance 6.78
- Largest losses: Independent reviewer score (none); Popularity pacing: mean popularity at end of year 2 for non-random strategies (not saturated) (100); Authored, validated templates (target 2,000 would be complete) (327); Worst match type time-limit draw rate (lower is better) (last_man 38%)
- Regressions: none
- Report: docs/gauntlet/round-01.md

## Round 2

- Target: Fix weakest measured criteria: time-limit draws, finisher frequency, popularity/title pacing, universe churn, tap targets, record-book evidence, perf
- Changes: Fixed process-global move registry leak that made careers depend on process history (determinism test added); urgency AI + rule weights (submission/last man/tag) cut draws; basic holds for submission matches; finisher minMom 55->42; diminishing popularity gains + slower title shots; evidence for every record-book number; release+monthly debuts; quick-resolve undercard AI matches; 44px tap targets + tap audit in e2e
- Mean 8.38 | min 5.40 | >=9: 5/12 | tests 93/93
- Weakest: Narrative quality 5.40, Memory consistency 6.89, Replayability 7.39
- Largest losses: Independent reviewer score (none); Authored, validated templates (target 2,000 would be complete) (327); Share of scenario templates that read ledger memory (mem trigger / memory block / rivalry / obligation) (0.2); Verified historical data (partial)
- Regressions: playerAgency -0.18, replayability -0.89
- Report: docs/gauntlet/round-02.md

## Round 3

- Target: Act on the first independent reviews (narrative 4, memory 6, mobile 6): fix false/stale memory callbacks, promise double-resolution, h2h disagreement, world-vs-ledger check on load, commentary grammar/variety, toast and scoreboard UX; add interviews/podcasts/press
- Changes: Dialogue: 'last time' only if the latest meeting was controversial; broken promises only quoted by their target; callback cooldowns + phrase variants + vocative fix; promise de-dup and opponent-only win_match judging; rivalry wins credit only the winner; world rebuilt from ledger on load if it disagrees; monthly world_decay events; record-book streak/partner evidence fixed; new interview/podcast/press flows built from ledger facts; commentary rewritten with pronouns, owner-aware move names, cycling variants; sentence-case tidy for scenario text; toast moved to top, scoreboard labels/values; promo tone-specific bodies
- Mean 8.97 | min 7.51 | >=9: 6/12 | tests 107/107
- Weakest: WWE universe simulation 7.51, Scenario diversity 7.58, Replayability 8.25
- Largest losses: Authored, validated templates (target 2,000 would be complete) (327); Verified historical data (partial); Independent reviewer score (4); Share of scenario templates that read ledger memory (mem trigger / memory block / rivalry / obligation) (0.45)
- Regressions: careerProgression -0.17
- Report: docs/gauntlet/round-03.md
