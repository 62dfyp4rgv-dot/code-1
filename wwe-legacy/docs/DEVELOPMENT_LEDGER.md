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

## Round 4

- Target: Features: legacy/Hall of Fame, tag titles, factions, finances, multi-way matches, interviews; 589 authored scenarios; visual identity pass; memory fixes from review
- Changes: Added legacy/HoF pipeline, tag-team championships (AI + player), AI factions, finance system, triple threat/fatal four-way engine, avatar/hero/rarity visuals, 44px targets; authored scenarios 327 -> 589 via four writer agents (validated, prose-linted); promo/dialogue/appearance fixes; world replay-on-load check
- Mean 9.22 | min 7.60 | >=9: 8/12 | tests 123/123
- Weakest: Scenario diversity 7.60, WWE universe simulation 8.32, Narrative quality 8.64
- Largest losses: Authored, validated templates (target 2,000 would be complete) (589); Verified historical data (partial); Independent reviewer score (4); Share of scenario templates that read ledger memory (mem trigger / memory block / rivalry / obligation) (0.42)
- Regressions: performance -0.41
- Report: docs/gauntlet/round-04.md

## Round 5

- Target: Act on round-4 independent reviews (narrative 4.5, memory 5.5, mobile 6.0): commentary/promo/interview prose, dialogue perspective, promise judging and visibility, sha256 ledger chain, legacy purity, UI declutter; elimination matches, factions, tag titles
- Changes: Commentary: pin count/kickout roles fixed, article/positioning/hold phrasing, no repeats of previous line; promos: tone body always, one H2H line, grammar, last-name mentions; interviews: answers cite finish/move, reaction by stance; dialogue: perspective swap for clean wins/losses, opponent-only H2H, reconciliation, narrator-voice callbacks; promises: scope gating, streak from creation, duplicate skip, mentorship direction; ledger chain now sha256; legacy as-of-ledger; UI: compact toast cleared on navigation, HUD declutter, hint percentages, home CTA, record book hides empty rows, result sticky CTA, promises card; elimination match + chamber
- Mean 9.20 | min 7.59 | >=9: 8/12 | tests 132/132
- Weakest: Scenario diversity 7.59, WWE universe simulation 8.32, Memory consistency 8.74
- Largest losses: Authored, validated templates (target 2,000 would be complete) (589); Verified historical data (partial); Independent reviewer score (4.5); Share of scenario templates that read ledger memory (mem trigger / memory block / rivalry / obligation) (0.42)
- Regressions: careerProgression -0.17, performance -0.19
- Report: docs/gauntlet/round-05.md

## Round 6

- Target: Narrative quality & memory visibility (reviewer findings from round 4): authored prose packs (commentary 44 keys, interview answers 6 stances x 9 topics, promos 9 tones x 3 alignments), commentary-team colour events, Story-so-far view
- Changes: Added commentary_pack/answers_pack/promo_pack (validated by tools/packcheck.js), colour events in resolve.finalizeRound (no RNG), Story-so-far card on Career, casing/agreement fixes, pin count style per pin, pronoun fixes. Rubric: reviewer criteria now weigh 40%.
- Mean 8.94 | min 7.59 | >=9: 7/12 | tests 135/135
- Weakest: Scenario diversity 7.59, Memory consistency 7.67, Narrative quality 7.71
- Largest losses: Independent reviewer score (4.5); Independent reviewer score (5.5); Independent reviewer score (6); Authored, validated templates (target 2,000 would be complete) (589)
- Regressions: memoryConsistency -1.07, narrativeQuality -1.03, mobileUsability -1.05
- Report: docs/gauntlet/round-06.md
