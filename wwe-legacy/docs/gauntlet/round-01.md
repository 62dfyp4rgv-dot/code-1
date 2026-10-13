# Gauntlet Round 1

Generated 2026-10-13T11:10:09.927Z in 282s. All scores are computed by `tools/rubric.js` from measurements in this run.

**Round target:** Baseline measurement before any gauntlet-driven improvement

## Scores

| Category | Score | Delta | Unverified | Unimplemented |
|---|---:|---:|---:|---:|
| Match engine | 7.59 | - | 0 | 0 |
| Player agency | 9.81 | - | 0 | 0 |
| Memory consistency | 6.81 | - | 1 | 0 |
| Achievement integrity | 9.54 | - | 0 | 0 |
| Scenario diversity | 7.57 | - | 0 | 0 |
| Narrative quality | 5.45 | - | 1 | 1 |
| WWE universe simulation | 6.92 | - | 1 | 1 |
| Career progression | 5.57 | - | 0 | 0 |
| Mobile usability | 7.24 | - | 2 | 0 |
| Technical reliability | 10.00 | - | 0 | 0 |
| Performance | 6.78 | - | 0 | 0 |
| Replayability | 8.28 | - | 0 | 0 |
| **Mean** | **7.63** | | | |

Categories at >= 9.0: **3/12**. Lowest: Narrative quality (5.45), Career progression (5.57), Performance (6.78).

## Weakest subsystem and biggest score losses

| Category | Criterion | Value | Score | Weighted loss | Status |
|---|---|---|---:|---:|---|
| Narrative quality | Independent reviewer score | none | 0.00 | 3 | unverified |
| Career progression | Popularity pacing: mean popularity at end of year 2 for non-random strategies (not saturated) | 100 | 0.00 | 3 | measured |
| Scenario diversity | Authored, validated templates (target 2,000 would be complete) | 327 | 0.12 | 2.64 | measured |
| Match engine | Worst match type time-limit draw rate (lower is better) | last_man 38% | 0.00 | 2.5 | measured |
| Performance | Universe simulation cost (ms per simulated year; budget < 800) | 2463 | 0.24 | 2.27 | measured |
| Career progression | Title wins in 3 years for smart play (target 1-5) | 12.5 | 0.17 | 2.08 | measured |
| Memory consistency | Share of scenario templates that read ledger memory (mem trigger / memory block / rivalry / obligation) | 0.2 | 0.00 | 2 | measured |
| WWE universe simulation | Verified historical data | partial | 0.00 | 2 | unverified |
| Mobile usability | Tap targets >= 44px audit | not run | 0.00 | 2 | unverified |
| Mobile usability | Independent reviewer score | none | 0.00 | 2 | unverified |

## Evidence

- Tests: 90/90 passing.
- Match sims: 450 across 9 types, 0 invalid; singles finishers/match 0.52, mean rating 2.81★ (σ 0.70), avg 8.1 min.
- Draw rates: singles 2%, tag 24%, submission 26%, no_dq 2%, last_man 38%, iron_man 4%, ladder 32%, cage 0%, hell_cell 0%.
- Skill gap: smart beats random 83% of matches; mirror side balance 49.6%.
- Careers: 8 × ~3 years; crashes 0, audit problems 0; scenarios shown 1905 (260 distinct templates), recall share 20%.
- Universe: deterministic=true, lineage problems 0, 2463 ms per simulated year, stats(1998 start) {"matches":2004,"titleChanges":33,"betrayals":40,"alliances":70,"retirements":6,"arrivals":0,"injuries":495,"turns":41}, stats(2024 start) {"matches":2123,"titleChanges":57,"betrayals":38,"alliances":59,"retirements":2,"arrivals":0,"injuries":522,"turns":38}.
- Scenarios: 327 authored templates, 4443 validated configurations (reported separately), 0 validator errors.
- Achievements: 192/192 provable by synthesised legal sequences; Record Book evidence coverage 76.7%.
- UI: e2e 35/35 (from 2026-10-13T11:10:09.906Z); screens 11/11; bundle 1018 KB.
- Features: 13 complete / 9 partial / 6 unimplemented of 28.

## Criteria detail

### Match engine — 7.59

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Match engine unit/acceptance tests pass | 3 | 90/90 | 1.00 | measured |
| Every simulated match ends in a valid, rule-conformant finish | 3 | 0 | 1.00 | measured |
| Worst match type time-limit draw rate (lower is better) | 2.5 | last_man 38% | 0.00 | measured |
| Finishers used per singles match (target ~1) | 2 | 0.52 | 0.53 | measured |
| Mirror-match side balance (no first-side bias) | 1.5 | 0.496 | 1.00 | measured |
| Finish-type variety in singles (distinct finishes) | 1 | 3 | 0.67 | measured |
| Match-type coverage vs target list (singles, tag, sub, no-DQ, last man, iron man, ladder, cage, hell cell, rumble, chamber, triple threat) | 2 | 10/12 | 0.83 | measured |
| Match rating spread (std of stars; shows quality varies with play) | 1 | 0.7 | 1.00 | measured |
| Average singles match length (minutes, target 7-14) | 1 | 8.1 | 1.00 | measured |

### Player agency — 9.81

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Featured action options per decision within 6-12 | 3 | 99% in range (mean 10.0) | 0.95 | measured |
| Defender options per defence decision >= 6 | 2 | min 6 | 1.00 | measured |
| Player decisions per singles match | 1.5 | 17.9 | 1.00 | measured |
| Smart play beats random play in matches (win share) | 2.5 | 0.83 | 0.95 | measured |
| Career win-rate: smart vs weak vs random strategies ordered with clear gaps | 2.5 | smart 71 / avg 55 / weak 55 / random 26 | 1.00 | measured |
| Scenario choices carry real consequences (templates with >=2 weighted outcomes & distinct effects) | 2 | 327 authored | 1.00 | measured |
| Pre/post-match decisions available (plan, entrance, stipulation, post-match action, promo) | 1.5 | plan, entrance, stakes, post-match, promo | 1.00 | measured |

### Memory consistency — 6.81

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Memory tests pass | 3 | 90/90 | 1.00 | measured |
| Career audits: ledger chain, world replay equals live state, no double counting | 4 | 0 problems over 8 careers | 1.00 | measured |
| Share of scenario templates that read ledger memory (mem trigger / memory block / rivalry / obligation) | 2 | 0.2 | 0.00 | measured |
| Long-horizon retrievability: ledger events retained and verifiable after 3 simulated years | 2 | 988+ events | 1.00 | measured |
| Scenarios actually recalling prior events in play (share of resolved scenarios with recalled memory) | 2 | 0.2 | 0.44 | measured |
| Independent reviewer score | 1.5 | none | 0.00 | unverified |

### Achievement integrity — 9.54

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Achievement definitions (target >= 150) | 1.5 | 192 | 1.00 | measured |
| Every achievement provable by a synthesised legal event sequence | 4 | 192/192 | 1.00 | measured |
| Live unlocks derivable from ledger with valid evidence (careers) | 3 | 0 problems | 1.00 | measured |
| Secret and era-gated achievements present | 1 | 11 secret / 8 era-gated | 1.00 | measured |
| Achievement unlock spread across 8 careers (distinct unlocked / total) | 1.5 | 126/192 | 0.91 | measured |
| Record Book: every numeric stat opens to evidence events | 2 | 0.7666666666666667 | 0.77 | measured |

### Scenario diversity — 7.57

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Authored, validated templates (target 2,000 would be complete) | 3 | 327 | 0.12 | measured |
| Validated generated configurations (slot combinations; target >= 2,000) | 2.5 | 4443 | 1.00 | measured |
| Validator errors/warnings (lower is better) | 2 | 0 errors / 0 warnings | 1.00 | measured |
| Category breadth | 1.5 | 27 | 1.00 | measured |
| Distinct templates seen across 8 sample careers / authored | 2 | 260/327 | 0.82 | measured |
| Most-repeated template share of all scenarios shown (lower is better) | 1.5 | 1.6% | 0.97 | measured |

### Narrative quality — 5.45

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Commentary covers every observed engine event type | 2.5 | 53 types, 0 silent | 1.00 | measured |
| Scenario opener diversity | 1.5 | 0.94 | 0.98 | measured |
| Scenario vocabulary size (distinct words) | 1.5 | 2297 | 0.55 | measured |
| Commentary variety: distinct lines per 1,000 narrated events | 2.5 | 166 | 0.44 | measured |
| Dialogue/promo claims validated against ledger (no invented history) | 2 | 1 | 1.00 | measured |
| Independent reviewer score | 3 | none | 0.00 | unverified |
| Standalone interview/podcast/press flows | 1.5 | unimplemented | 0.00 | unimplemented |

### WWE universe simulation — 6.92

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Title lineage problems after multi-year sim (target 0) | 3 | 0 | 1.00 | measured |
| Universe simulation deterministic for a given seed | 2 | true | 1.00 | measured |
| AI autonomy: feuds, alliances, betrayals, turns, injuries per simulated year | 2.5 | 13 betrayals/yr, 20 alliances/yr | 1.00 | measured |
| Roster churn: retirements and arrivals both occur | 2 | ret 8 / arr 0 | 0.50 | measured |
| Title reign length plausibility (mean reigns per title per 3 years in 1.5-6) | 2 | 7.3 | 0.78 | measured |
| Roster size in 1998 start (>= 45) and 2024 start (>= 80) | 1.5 | 37/101 | 0.80 | measured |
| Verified historical data | 2 | partial | 0.00 | unverified |
| Tag-team championships | 1 | unimplemented | 0.00 | unimplemented |
| Faction mechanics | 1 | partial | 0.50 | measured |

### Career progression — 5.57

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Popularity pacing: mean popularity at end of year 2 for non-random strategies (not saturated) | 3 | 100 | 0.00 | measured |
| Title wins in 3 years for smart play (target 1-5) | 2.5 | 12.5 | 0.17 | measured |
| Attribute growth: overall rating increases through training (smart > weak) | 2 | smart 68 vs weak 51 | 1.00 | measured |
| Injuries per career-year in plausible band (3-9) | 1.5 | 8 | 1.00 | measured |
| Money progression non-degenerate (all careers finite & positive) | 1 | true | 1.00 | measured |
| Retirement + Hall of Fame legacy | 1.5 | partial | 0.50 | measured |
| Finance depth | 1 | partial | 0.50 | measured |
| Historical + modern modes; custom/alt-history | 1.5 | partial/partial | 0.50 | measured |
| Careers run to completion without crash | 2 | 0 crashes | 1.00 | measured |

### Mobile usability — 7.24

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| End-to-end iPhone-viewport checks pass (headless Chromium, 390px) | 4 | 35/35 | 1.00 | measured |
| No horizontal overflow on any screen | 1.5 | 18 | 1.00 | measured |
| Tap targets >= 44px audit | 2 | not run | 0.00 | unverified |
| Accessibility features: 4 text sizes, 3 themes, safe-area insets, reduced motion | 1.5 | 4 sizes / 3 themes | 1.00 | measured |
| Offline PWA (manifest + service worker + single-file artifact) | 1.5 | bundle 1018 KB | 1.00 | measured |
| Required screens present in UI (Home, Career, Matches, Calendar, Roster, Rivalries, Media, Achievements, Statistics, Relationships, Settings) | 2 | 11/11 | 1.00 | measured |
| Independent reviewer score | 2 | none | 0.00 | unverified |

### Technical reliability — 10.00

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Automated tests passing | 4 | 90/90 | 1.00 | measured |
| Career simulation crashes (0) | 3 | 0 | 1.00 | measured |
| Invariant audit problems (0) | 2.5 | 0 | 1.00 | measured |
| Save round-trip with checksum + chain verification | 2 | true | 1.00 | measured |
| E2E reload/continue mid-match identical | 2 | yes | 1.00 | measured |
| Deterministic replay of seeded sims | 1 | true | 1.00 | measured |

### Performance — 6.78

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Headless match simulation time (ms per match, lower better) | 2 | 7.5 | 0.92 | measured |
| Universe simulation cost (ms per simulated year; budget < 800) | 3 | 2463 | 0.24 | measured |
| Career playthrough speed (seconds per simulated 3-year career) | 2 | 14.8 | 0.60 | measured |
| Single-file bundle size (KB; budget 1,200) | 1.5 | 1018 | 1.00 | measured |
| Compressed save size at 3 years (KB; budget 400) | 1.5 | 261 | 1.00 | measured |

### Replayability — 8.28

| Criterion | Weight | Value | Score | Status |
|---|---:|---|---:|---|
| Different careers see different scenario sets (1 - mean Jaccard overlap) | 3 | 0.55 | 0.62 | measured |
| Outcome spread across strategies (titles won range) | 2 | 2-17 | 1.00 | measured |
| Achievements unlocked across careers (breadth) | 2 | 126 | 0.96 | measured |
| Distinct start configurations (era x background x style x gender) | 1.5 | 1680 | 1.00 | measured |
| Eras selectable with era-specific rosters, titles, shows | 1.5 | 8 | 1.00 | measured |
| Game modes (historical, modern, alternate, custom) | 1.5 | partial/partial | 0.50 | measured |
