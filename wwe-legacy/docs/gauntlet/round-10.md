# Gauntlet Round 10

Generated 2026-10-14T14:07:02.896Z in 285s. All scores are computed by `tools/rubric.js` from measurements in this run.

**Round target:** Round-9 independent review findings: seam QA across all 853 scenario templates (slot fit, premise honesty, mentee direction, quoted NPC dialogue), memory attribution fixes, battle-royal soft-lock fix, mobile fixes

**Changes made before this measurement:**
- Seam QA of all templates by three QA passes with render-all-combinations detectors, lastOpponent cast, era-aware outlets, respect/obligation/hook memory fixes, forged-unlock dropping, retired-career guards, mobile r9 fixes. Reviewer scores in reviews.json are still round 8's.

## Scores

| Category | Score | Delta | Unverified | Unimplemented |
|---|---:|---:|---:|---:|
| Match engine | 9.80 | +0.00 | 0 | 0 |
| Player agency | 9.42 | -0.01 | 0 | 0 |
| Memory consistency | 7.63 | -0.25 | 0 | 0 |
| Achievement integrity | 9.82 | +0.01 | 0 | 0 |
| Scenario diversity | 7.72 | -0.01 | 0 | 0 |
| Narrative quality | 7.14 | -0.29 | 0 | 0 |
| WWE universe simulation | 8.61 | +0.00 | 1 | 0 |
| Career progression | 9.77 | +0.00 | 0 | 0 |
| Mobile usability | 8.40 | -0.20 | 0 | 0 |
| Technical reliability | 10.00 | +0.00 | 0 | 0 |
| Performance | 8.79 | -0.11 | 0 | 0 |
| Replayability | 9.54 | +0.02 | 0 | 0 |
| **Mean** | **8.89** | | | |

Categories at >= 9.0: **6/12**. Lowest: Narrative quality (7.14), Memory consistency (7.63), Scenario diversity (7.72).

## Weakest subsystem and biggest score losses

| Category | Criterion | Value | Score | Weighted loss | Status |
|---|---|---|---:|---:|---|
| Memory consistency | Independent reviewer score | 6 | 0.60 | 3.47 | measured |
| Narrative quality | Independent reviewer score | 5.5 | 0.55 | 3.45 | measured |
| Mobile usability | Independent reviewer score | 6 | 0.60 | 3.33 | measured |
| WWE universe simulation | Verified historical data | partial | 0.00 | 2 | unverified |
| Narrative quality | Commentary covers every observed engine event type | 62 types, 3 silent | 0.25 | 1.88 | measured |
| Scenario diversity | Authored, validated templates (target 2,000 would be complete) | 853 | 0.40 | 1.81 | measured |
| Scenario diversity | Distinct templates seen across 8 sample careers / authored | 501/853 | 0.48 | 1.04 | measured |
| Performance | Single-file bundle size, gzip transfer (KB; budget 450, the raw size is also reported) | 777 gz / 2529 raw | 0.41 | 0.89 | measured |
| Memory consistency | Scenarios actually recalling prior events in play (share of resolved scenarios with recalled memory) | 0.25 | 0.57 | 0.87 | measured |
| Memory consistency | Share of scenario templates that read ledger memory (mem trigger / memory block / rivalry / obligation) | 0.5 | 0.60 | 0.79 | measured |

## Regressions vs previous round

- **memoryConsistency**: -0.25
- **narrativeQuality**: -0.29
- **mobileUsability**: -0.2

## Evidence

- Tests: 192/192 passing.
- Match sims: 850 across 17 types, 0 invalid; singles finishers/match 0.82, mean rating 2.56★ (σ 0.67), avg 7.0 min.
- Draw rates: singles 2%, tag 0%, submission 2%, no_dq 4%, last_man 6%, iron_man 2%, ladder 2%, cage 0%, triple_threat 0%, fatal_four 0%, elimination 0%, chamber 0%, hell_cell 0%, tlc 0%, mitb 4%, battle_royal 0%, handicap 4%.
- Skill gap: smart beats random 88% of matches; mirror side balance 48.0%.
- Careers: 8 × ~3 years; crashes 0, audit problems 0; scenarios shown 1494 (501 distinct templates), recall share 25%.
- Universe: deterministic=true, lineage problems 0, 913 ms per simulated year, stats(1998 start) {"fullEngine":1010,"matches":2007,"titleChanges":39,"betrayals":42,"alliances":73,"retirements":9,"arrivals":4,"injuries":492,"turns":42,"tagTitleMatches":52,"factions":26}, stats(2024 start) {"fullEngine":819,"matches":2124,"titleChanges":73,"betrayals":35,"alliances":60,"retirements":14,"arrivals":4,"injuries":501,"turns":35,"factions":26,"tagTitleMatches":71}.
- Scenarios: 853 authored templates, 10723 validated configurations (reported separately), 0 validator errors.
- Achievements: 196/196 provable by synthesised legal sequences; Record Book evidence coverage 99.3%.
- UI: e2e 50/50 (from 2026-10-14T14:07:02.782Z); screens 11/11; bundle 2529 KB.
- Features: 26 complete / 2 partial / 2 unimplemented of 30.

## Criteria detail

### Match engine — 9.80

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Match engine unit/acceptance tests pass | 3 | 192/192 | 1.00 | measured |
| Every simulated match ends in a valid, rule-conformant finish | 3 | 0 | 1.00 | measured |
| Worst match type time-limit draw rate (lower is better) | 2.5 | last_man 6% | 1.00 | measured |
| Finishers used per singles match (target ~1) | 2 | 0.82 | 1.00 | measured |
| Mirror-match side balance (no first-side bias) | 1.5 | 0.48 | 1.00 | measured |
| Finish-type variety in singles (distinct finishes) | 1 | 3 | 0.67 | measured |
| Match-type coverage vs target list (singles, tag, sub, no-DQ, last man, iron man, ladder, cage, hell cell, triple threat, fatal four-way, elimination, chamber, rumble; TLC/MITB/battle royal absent) | 2 | 18/14 | 1.00 | measured |
| Match rating spread (std of stars; shows quality varies with play) | 1 | 0.67 | 1.00 | measured |
| Average singles match length (minutes, target 7-14) | 1 | 7 | 1.00 | measured |

### Player agency — 9.42

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Featured action options per decision within 6-12 | 3 | 99% in range (mean 10.0) | 0.95 | measured |
| Defender options per defence decision >= 6 | 2 | min 6 | 1.00 | measured |
| Player decisions per singles match | 1.5 | 17.3 | 1.00 | measured |
| Smart play beats random play in matches (win share) | 2.5 | 0.88 | 1.00 | measured |
| Career win-rate: smart vs weak vs random strategies ordered with clear gaps | 2.5 | smart 72 / avg 57 / weak 45 / random 26 | 0.85 | measured |
| Scenario choices carry real consequences (templates with >=2 weighted outcomes & distinct effects) | 2 | 853 authored | 0.83 | measured |
| Pre/post-match decision surface (plans, entrances, stipulations, training options, post-match actions, promo, scenario choices) | 1.5 | 7 plans / 5 entrances / 17 stipulations / 10 training | 1.00 | measured |

### Memory consistency — 7.63

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Memory tests pass | 3 | 192/192 | 1.00 | measured |
| Career audits: ledger chain, world replay equals live state, no double counting | 4 | 0 problems over 8 careers | 1.00 | measured |
| Share of scenario templates that read ledger memory (mem trigger / memory block / rivalry / obligation) | 2 | 0.5 | 0.60 | measured |
| Long-horizon retrievability: ledger events retained and verifiable after 3 simulated years | 2 | 952+ events | 1.00 | measured |
| Scenarios actually recalling prior events in play (share of resolved scenarios with recalled memory) | 2 | 0.25 | 0.57 | measured |
| Independent reviewer score | 8.67 | 6 | 0.60 | measured |

### Achievement integrity — 9.82

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Achievement definitions (target >= 150) | 1.5 | 196 | 1.00 | measured |
| Every achievement provable by a synthesised legal event sequence | 4 | 196/196 | 1.00 | measured |
| Live unlocks derivable from ledger with valid evidence (careers) | 3 | 0 problems | 1.00 | measured |
| Secret and era-gated achievements present | 1 | 11 secret / 8 era-gated | 1.00 | measured |
| Achievement unlock spread across 8 careers (distinct unlocked / total) | 1.5 | 123/196 | 0.85 | measured |
| Record Book: every numeric stat opens to evidence events | 2 | 0.9931740614334471 | 0.99 | measured |

### Scenario diversity — 7.72

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Authored, validated templates (target 2,000 would be complete) | 3 | 853 | 0.40 | measured |
| Validated generated configurations (slot combinations; target >= 2,000) | 2.5 | 10723 | 1.00 | measured |
| Validator errors/warnings (lower is better) | 2 | 0 errors / 0 warnings | 1.00 | measured |
| Category breadth | 1.5 | 28 | 1.00 | measured |
| Distinct templates seen across 8 sample careers / authored | 2 | 501/853 | 0.48 | measured |
| Most-repeated template share of all scenarios shown (lower is better) | 1.5 | 1.5% | 1.00 | measured |

### Narrative quality — 7.14

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Commentary covers every observed engine event type | 2.5 | 62 types, 3 silent | 0.25 | measured |
| Scenario opener diversity | 1.5 | 0.91 | 0.89 | measured |
| Scenario vocabulary size (distinct words) | 1.5 | 4066 | 1.00 | measured |
| Commentary variety: distinct lines per 1,000 narrated events | 2.5 | 410 | 1.00 | measured |
| Dialogue/promo claims validated against ledger (no invented history) | 2 | 1 | 1.00 | measured |
| Independent reviewer score | 7.67 | 5.5 | 0.55 | measured |
| Standalone interview/podcast/press flows | 1.5 | complete | 1.00 | measured |

### WWE universe simulation — 8.61

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Title lineage problems after multi-year sim (target 0) | 3 | 0 | 1.00 | measured |
| Universe simulation deterministic for a given seed | 2 | true | 1.00 | measured |
| AI autonomy: feuds, alliances, betrayals, turns, injuries per simulated year | 2.5 | 12 betrayals/yr, 20 alliances/yr | 1.00 | measured |
| Roster churn: retirements and arrivals both occur | 2 | ret 23 / arr 8 | 1.00 | measured |
| Title reign length plausibility (mean reigns per title per 3 years in 1.5-6) | 2 | 7.1 | 0.82 | measured |
| Roster size in 1998 start (>= 45) and 2024 start (>= 80) | 1.5 | 46/93 | 1.00 | measured |
| Verified historical data | 2 | partial | 0.00 | unverified |
| Tag-team championships | 1 | complete | 1.00 | measured |
| Faction mechanics | 1 | complete | 1.00 | measured |

### Career progression — 9.77

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Popularity pacing: mean popularity at end of year 2 for non-random strategies (not saturated) | 3 | 55 | 1.00 | measured |
| Title wins in 3 years for smart play (target 1-5) | 2.5 | 4 | 1.00 | measured |
| Attribute growth: overall rating increases through training (smart > weak) | 2 | smart 69 vs weak 51 | 1.00 | measured |
| Injuries per career-year in plausible band (3-9) | 1.5 | 7.4 | 1.00 | measured |
| Money progression non-degenerate (all careers finite & positive) | 1 | true | 1.00 | measured |
| Retirement + Hall of Fame legacy | 1.5 | complete | 1.00 | measured |
| Finance depth | 1 | complete | 1.00 | measured |
| Historical + modern modes; custom/alt-history | 1.5 | complete/partial | 0.75 | measured |
| Careers run to completion without crash | 2 | 0 crashes | 1.00 | measured |

### Mobile usability — 8.40

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| End-to-end iPhone-viewport checks pass (headless Chromium, 390px) | 4 | 50/50 | 1.00 | measured |
| No horizontal overflow on any screen | 1.5 | 26 | 1.00 | measured |
| Tap targets >= 44px audit | 2 | 1 | 1.00 | measured |
| Accessibility features: 4 text sizes, 3 themes, safe-area insets, reduced motion | 1.5 | 4 sizes / 3 themes | 1.00 | measured |
| Offline PWA (manifest + service worker + single-file artifact) | 1.5 | bundle 2529 KB | 1.00 | measured |
| Required screens present in UI (Home, Career, Matches, Calendar, Roster, Rivalries, Media, Achievements, Statistics, Relationships, Settings) | 2 | 11/11 | 1.00 | measured |
| Independent reviewer score | 8.33 | 6 | 0.60 | measured |

### Technical reliability — 10.00

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Automated tests passing | 4 | 192/192 | 1.00 | measured |
| Career simulation crashes (0) | 3 | 0 | 1.00 | measured |
| Invariant audit problems (0) | 2.5 | 0 | 1.00 | measured |
| Save round-trip with checksum + chain verification | 2 | true | 1.00 | measured |
| E2E reload/continue mid-match identical | 2 | yes | 1.00 | measured |
| Deterministic replay of seeded sims | 1 | true | 1.00 | measured |

### Performance — 8.79

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Headless match simulation time (ms per match, lower better) | 2 | 5.5 | 1.00 | measured |
| Universe simulation cost (ms per simulated year; budget < 1,200 on a desktop core, roughly 3x that on a phone) | 3 | 913 | 1.00 | measured |
| Career playthrough speed (seconds per simulated 3-year career) | 2 | 10.7 | 0.84 | measured |
| Single-file bundle size, gzip transfer (KB; budget 450, the raw size is also reported) | 1.5 | 777 gz / 2529 raw | 0.41 | measured |
| Compressed save size at 3 years (KB; budget 400) | 1.5 | 305 | 1.00 | measured |

### Replayability — 9.54

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Different careers see different scenario sets (1 - mean Jaccard overlap) | 3 | 0.8 | 1.00 | measured |
| Outcome spread across 8 careers (mean coefficient of variation of wins, popularity, money, overall, titles+1) | 2 | 0.39 | 1.00 | measured |
| Achievements unlocked across careers (breadth) | 2 | 123 | 0.92 | measured |
| Distinct start configurations (era x background x style x gender) | 1.5 | 1680 | 1.00 | measured |
| Eras selectable with era-specific rosters, titles, shows | 1.5 | 8 | 1.00 | measured |
| Game modes (historical, modern, alternate, custom) | 1.5 | complete/partial | 0.75 | measured |
