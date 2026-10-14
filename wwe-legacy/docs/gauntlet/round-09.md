# Gauntlet Round 9

Generated 2026-10-14T11:25:47.256Z in 262s. All scores are computed by `tools/rubric.js` from measurements in this run.

**Round target:** Round-8 independent review findings: multi-way attribution, result-aware triggers, cage/ladder commentary, social feed, answers/reactions packs, mobile layout

**Changes made before this measurement:**
- pairOutcome shared outcome definition, last-match triggers, faction_joined, mentee tag, title-holder/reaction/social packs, cage lines, media name pools, callback family and global cooldown, mobile fixes (sticky CTA, compact board, toast render/batching, home order). Reviewer scores are still the round-8 ones (narrative 5.5, memory 6.0, mobile 6.0).

## Scores

| Category | Score | Delta | Unverified | Unimplemented |
|---|---:|---:|---:|---:|
| Match engine | 9.80 | +0.00 | 0 | 0 |
| Player agency | 9.43 | -0.24 | 0 | 0 |
| Memory consistency | 7.88 | -0.04 | 0 | 0 |
| Achievement integrity | 9.81 | +0.00 | 0 | 0 |
| Scenario diversity | 7.73 | -0.05 | 0 | 0 |
| Narrative quality | 7.43 | -0.32 | 0 | 0 |
| WWE universe simulation | 8.61 | +0.00 | 1 | 0 |
| Career progression | 9.77 | +0.00 | 0 | 0 |
| Mobile usability | 8.60 | +0.00 | 0 | 0 |
| Technical reliability | 10.00 | +0.00 | 0 | 0 |
| Performance | 8.90 | -0.03 | 0 | 0 |
| Replayability | 9.52 | +0.00 | 0 | 0 |
| **Mean** | **8.96** | | | |

Categories at >= 9.0: **6/12**. Lowest: Narrative quality (7.43), Scenario diversity (7.73), Memory consistency (7.88).

## Weakest subsystem and biggest score losses

| Category | Criterion | Value | Score | Weighted loss | Status |
|---|---|---|---:|---:|---|
| Narrative quality | Independent reviewer score | 4.6 | 0.46 | 4.14 | measured |
| Memory consistency | Independent reviewer score | 6.5 | 0.65 | 3.03 | measured |
| Mobile usability | Independent reviewer score | 6.5 | 0.65 | 2.92 | measured |
| WWE universe simulation | Verified historical data | partial | 0.00 | 2 | unverified |
| Scenario diversity | Authored, validated templates (target 2,000 would be complete) | 853 | 0.40 | 1.81 | measured |
| Scenario diversity | Distinct templates seen across 8 sample careers / authored | 506/853 | 0.49 | 1.02 | measured |
| Performance | Single-file bundle size, gzip transfer (KB; budget 450, the raw size is also reported) | 767 gz / 2504 raw | 0.42 | 0.86 | measured |
| Memory consistency | Share of scenario templates that read ledger memory (mem trigger / memory block / rivalry / obligation) | 0.5 | 0.60 | 0.79 | measured |
| Memory consistency | Scenarios actually recalling prior events in play (share of resolved scenarios with recalled memory) | 0.27 | 0.62 | 0.76 | measured |
| Narrative quality | Commentary covers every observed engine event type | 62 types, 1 silent | 0.75 | 0.63 | measured |

## Regressions vs previous round

- **playerAgency**: -0.24
- **narrativeQuality**: -0.32

## Evidence

- Tests: 189/189 passing.
- Match sims: 850 across 17 types, 0 invalid; singles finishers/match 0.82, mean rating 2.56★ (σ 0.67), avg 7.0 min.
- Draw rates: singles 2%, tag 0%, submission 2%, no_dq 4%, last_man 6%, iron_man 2%, ladder 2%, cage 0%, triple_threat 0%, fatal_four 0%, elimination 0%, chamber 0%, hell_cell 0%, tlc 0%, mitb 4%, battle_royal 0%, handicap 4%.
- Skill gap: smart beats random 88% of matches; mirror side balance 48.0%.
- Careers: 8 × ~3 years; crashes 0, audit problems 0; scenarios shown 1486 (506 distinct templates), recall share 27%.
- Universe: deterministic=true, lineage problems 0, 931 ms per simulated year, stats(1998 start) {"fullEngine":1010,"matches":2007,"titleChanges":39,"betrayals":42,"alliances":73,"retirements":9,"arrivals":4,"injuries":492,"turns":42,"tagTitleMatches":52,"factions":26}, stats(2024 start) {"fullEngine":819,"matches":2124,"titleChanges":73,"betrayals":35,"alliances":60,"retirements":14,"arrivals":4,"injuries":501,"turns":35,"factions":26,"tagTitleMatches":71}.
- Scenarios: 853 authored templates, 10723 validated configurations (reported separately), 0 validator errors.
- Achievements: 196/196 provable by synthesised legal sequences; Record Book evidence coverage 99.3%.
- UI: e2e 50/50 (from 2026-10-14T11:25:47.151Z); screens 11/11; bundle 2504 KB.
- Features: 26 complete / 2 partial / 2 unimplemented of 30.

## Criteria detail

### Match engine — 9.80

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Match engine unit/acceptance tests pass | 3 | 189/189 | 1.00 | measured |
| Every simulated match ends in a valid, rule-conformant finish | 3 | 0 | 1.00 | measured |
| Worst match type time-limit draw rate (lower is better) | 2.5 | last_man 6% | 1.00 | measured |
| Finishers used per singles match (target ~1) | 2 | 0.82 | 1.00 | measured |
| Mirror-match side balance (no first-side bias) | 1.5 | 0.48 | 1.00 | measured |
| Finish-type variety in singles (distinct finishes) | 1 | 3 | 0.67 | measured |
| Match-type coverage vs target list (singles, tag, sub, no-DQ, last man, iron man, ladder, cage, hell cell, triple threat, fatal four-way, elimination, chamber, rumble; TLC/MITB/battle royal absent) | 2 | 18/14 | 1.00 | measured |
| Match rating spread (std of stars; shows quality varies with play) | 1 | 0.67 | 1.00 | measured |
| Average singles match length (minutes, target 7-14) | 1 | 7 | 1.00 | measured |

### Player agency — 9.43

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Featured action options per decision within 6-12 | 3 | 99% in range (mean 10.0) | 0.95 | measured |
| Defender options per defence decision >= 6 | 2 | min 6 | 1.00 | measured |
| Player decisions per singles match | 1.5 | 17.3 | 1.00 | measured |
| Smart play beats random play in matches (win share) | 2.5 | 0.88 | 1.00 | measured |
| Career win-rate: smart vs weak vs random strategies ordered with clear gaps | 2.5 | smart 67 / avg 51 / weak 55 / random 20 | 0.85 | measured |
| Scenario choices carry real consequences (templates with >=2 weighted outcomes & distinct effects) | 2 | 853 authored | 0.83 | measured |
| Pre/post-match decision surface (plans, entrances, stipulations, training options, post-match actions, promo, scenario choices) | 1.5 | 7 plans / 5 entrances / 17 stipulations / 10 training | 1.00 | measured |

### Memory consistency — 7.88

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Memory tests pass | 3 | 189/189 | 1.00 | measured |
| Career audits: ledger chain, world replay equals live state, no double counting | 4 | 0 problems over 8 careers | 1.00 | measured |
| Share of scenario templates that read ledger memory (mem trigger / memory block / rivalry / obligation) | 2 | 0.5 | 0.60 | measured |
| Long-horizon retrievability: ledger events retained and verifiable after 3 simulated years | 2 | 981+ events | 1.00 | measured |
| Scenarios actually recalling prior events in play (share of resolved scenarios with recalled memory) | 2 | 0.27 | 0.62 | measured |
| Independent reviewer score | 8.67 | 6.5 | 0.65 | measured |

### Achievement integrity — 9.81

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Achievement definitions (target >= 150) | 1.5 | 196 | 1.00 | measured |
| Every achievement provable by a synthesised legal event sequence | 4 | 196/196 | 1.00 | measured |
| Live unlocks derivable from ledger with valid evidence (careers) | 3 | 0 problems | 1.00 | measured |
| Secret and era-gated achievements present | 1 | 11 secret / 8 era-gated | 1.00 | measured |
| Achievement unlock spread across 8 careers (distinct unlocked / total) | 1.5 | 122/196 | 0.84 | measured |
| Record Book: every numeric stat opens to evidence events | 2 | 0.9930313588850174 | 0.99 | measured |

### Scenario diversity — 7.73

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Authored, validated templates (target 2,000 would be complete) | 3 | 853 | 0.40 | measured |
| Validated generated configurations (slot combinations; target >= 2,000) | 2.5 | 10723 | 1.00 | measured |
| Validator errors/warnings (lower is better) | 2 | 0 errors / 0 warnings | 1.00 | measured |
| Category breadth | 1.5 | 28 | 1.00 | measured |
| Distinct templates seen across 8 sample careers / authored | 2 | 506/853 | 0.49 | measured |
| Most-repeated template share of all scenarios shown (lower is better) | 1.5 | 1.0% | 1.00 | measured |

### Narrative quality — 7.43

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Commentary covers every observed engine event type | 2.5 | 62 types, 1 silent | 0.75 | measured |
| Scenario opener diversity | 1.5 | 0.91 | 0.89 | measured |
| Scenario vocabulary size (distinct words) | 1.5 | 4018 | 1.00 | measured |
| Commentary variety: distinct lines per 1,000 narrated events | 2.5 | 411 | 1.00 | measured |
| Dialogue/promo claims validated against ledger (no invented history) | 2 | 1 | 1.00 | measured |
| Independent reviewer score | 7.67 | 4.6 | 0.46 | measured |
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
| Popularity pacing: mean popularity at end of year 2 for non-random strategies (not saturated) | 3 | 61 | 1.00 | measured |
| Title wins in 3 years for smart play (target 1-5) | 2.5 | 5 | 1.00 | measured |
| Attribute growth: overall rating increases through training (smart > weak) | 2 | smart 69 vs weak 52 | 1.00 | measured |
| Injuries per career-year in plausible band (3-9) | 1.5 | 6.2 | 1.00 | measured |
| Money progression non-degenerate (all careers finite & positive) | 1 | true | 1.00 | measured |
| Retirement + Hall of Fame legacy | 1.5 | complete | 1.00 | measured |
| Finance depth | 1 | complete | 1.00 | measured |
| Historical + modern modes; custom/alt-history | 1.5 | complete/partial | 0.75 | measured |
| Careers run to completion without crash | 2 | 0 crashes | 1.00 | measured |

### Mobile usability — 8.60

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| End-to-end iPhone-viewport checks pass (headless Chromium, 390px) | 4 | 50/50 | 1.00 | measured |
| No horizontal overflow on any screen | 1.5 | 26 | 1.00 | measured |
| Tap targets >= 44px audit | 2 | 1 | 1.00 | measured |
| Accessibility features: 4 text sizes, 3 themes, safe-area insets, reduced motion | 1.5 | 4 sizes / 3 themes | 1.00 | measured |
| Offline PWA (manifest + service worker + single-file artifact) | 1.5 | bundle 2504 KB | 1.00 | measured |
| Required screens present in UI (Home, Career, Matches, Calendar, Roster, Rivalries, Media, Achievements, Statistics, Relationships, Settings) | 2 | 11/11 | 1.00 | measured |
| Independent reviewer score | 8.33 | 6.5 | 0.65 | measured |

### Technical reliability — 10.00

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Automated tests passing | 4 | 189/189 | 1.00 | measured |
| Career simulation crashes (0) | 3 | 0 | 1.00 | measured |
| Invariant audit problems (0) | 2.5 | 0 | 1.00 | measured |
| Save round-trip with checksum + chain verification | 2 | true | 1.00 | measured |
| E2E reload/continue mid-match identical | 2 | yes | 1.00 | measured |
| Deterministic replay of seeded sims | 1 | true | 1.00 | measured |

### Performance — 8.90

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Headless match simulation time (ms per match, lower better) | 2 | 5.3 | 1.00 | measured |
| Universe simulation cost (ms per simulated year; budget < 1,200 on a desktop core, roughly 3x that on a phone) | 3 | 931 | 1.00 | measured |
| Career playthrough speed (seconds per simulated 3-year career) | 2 | 10 | 0.88 | measured |
| Single-file bundle size, gzip transfer (KB; budget 450, the raw size is also reported) | 1.5 | 767 gz / 2504 raw | 0.42 | measured |
| Compressed save size at 3 years (KB; budget 400) | 1.5 | 313 | 1.00 | measured |

### Replayability — 9.52

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Different careers see different scenario sets (1 - mean Jaccard overlap) | 3 | 0.8 | 1.00 | measured |
| Outcome spread across 8 careers (mean coefficient of variation of wins, popularity, money, overall, titles+1) | 2 | 0.43 | 1.00 | measured |
| Achievements unlocked across careers (breadth) | 2 | 122 | 0.91 | measured |
| Distinct start configurations (era x background x style x gender) | 1.5 | 1680 | 1.00 | measured |
| Eras selectable with era-specific rosters, titles, shows | 1.5 | 8 | 1.00 | measured |
| Game modes (historical, modern, alternate, custom) | 1.5 | complete/partial | 0.75 | measured |
