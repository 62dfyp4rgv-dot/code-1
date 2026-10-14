# Feature status (honest completion report)

Generated from `tools/features.js` (each "complete" entry has a probe that must pass) and Gauntlet round 11 (2026-10-14T20:56:21.446Z).

**26 complete · 2 partial · 2 unimplemented** of 30 tracked features.

## Foundation

| Feature | Status | Note |
|---|---|---|
| Playable match engine (interactive, authoritative state, derived narration) | **complete** |  |
| Persistent memory (hash-chained ledger, world state, rules, summaries, retrieval) | **complete** |  |
| Structured achievement DB + evidence-linked Career Record Book | **complete** |  |

## Match

| Feature | Status | Note |
|---|---|---|
| Singles, tag, submission, no-DQ, last man standing, iron man, ladder, cage, hell cell | **complete** |  |
| Royal Rumble (30 entrants, timed entries, decisions) | **complete** |  |
| Elimination Match (4) and Elimination Chamber (6, staggered pod entries) | **complete** |  |
| TLC, Money in the Bank (4-way ladder), battle royal (6, over-the-top eliminations), handicap (1 vs 2) | **complete** | Handicap is bookable with the player as the lone wrestler only; MITB is limited to PLE days; draws at the time limit remain possible (1-3%). |
| Casket / inferno / buried alive / other novelty stipulations | **unimplemented** |  |
| Triple threat and fatal four-way (3-4 sides, bystander pin break-ups, focus targeting) | **complete** |  |

## Career

| Feature | Status | Note |
|---|---|---|
| Character creation (5-step wizard, styles, backgrounds, gimmick, finisher, signatures) | **complete** |  |
| Progression: training, fatigue, injuries, popularity, contract/money | **complete** |  |
| Finances: match pay, salary, merchandise, lifestyle costs, debt, contract renewal, statements in the ledger | **complete** | No investments, property or taxes beyond a flat withholding. |
| Personal life: wellbeing, family and friends as persistent numbers; off-day activities; effects on recovery, confidence and story triggers | **complete** | No named family members, relationships or children; the numbers are abstract and scenarios can trigger on them (stat names wellbeing, family, socialLife). |
| Retirement, Hall of Fame induction and evidence-backed legacy verdict | **complete** | HoF induction is recorded at retirement for the Class of the following year (no post-retirement time simulation). |

## Universe

| Feature | Status | Note |
|---|---|---|
| Weekly shows + PLE calendar by era (brand split, NXT) | **complete** |  |
| Independent AI universe (AI-vs-AI matches, feuds, alliances, betrayals, injuries, title reigns) | **complete** |  |
| Singles/midcard championships with lineage validation | **complete** |  |
| Tag-team championships (AI defenses and changes; player can challenge and defend with a partner) | **complete** |  |
| Factions: AI factions form/dissolve and tag together; the player can found a stable with allies, leave it (trust cost) and browse the roster's factions | **complete** | No in-faction orders, leadership changes or faction-vs-faction booking beyond tag teams. |
| Verified historical data (real rosters, title lineages, PLE results) | **partial** | Roster/titles are approximate and flagged approx:true; NOT verified against sources. |
| Historical / modern modes with separation of fictional results | **complete** |  |
| Alternate-history and custom universe editor | **partial** | Fully fictional worlds and a roster editor (add up to 12 authored wrestlers, validated, replace similar fictional ones) are implemented; there is no editor for brands, titles, the calendar or real-roster edits. |

## Story

| Feature | Status | Note |
|---|---|---|
| Scenario engine with validated templates (cast, slots, choices, effects) | **complete** |  |
| Promo delivery with memory-grounded claims | **complete** |  |
| Standalone interviews / podcasts / press conferences as player-initiated, memory-grounded flows | **complete** |  |
| Social media feed and posting (fan mood, ledger-derived reactions, rival shots, posts that move popularity and rivalries) | **complete** | Single-platform text feed; no images, DMs, follower growth simulation beyond popularity, or moderation mechanics. |

## Platform

| Feature | Status | Note |
|---|---|---|
| Versioned saves, slots, autosave, backup, migrations, checksum | **complete** |  |
| Offline PWA (manifest, service worker), iPhone viewport UI | **complete** |  |
| Settings: text size, themes, slots | **complete** |  |
| Native iOS app / App Store build | **unimplemented** | Web PWA only (add to Home Screen). |

## Content counts (authored and generated are reported separately)

- Authored scenario templates: **853** across 28 categories.
- Validated generated configurations (template × slot combination, capped at 24 per template): **10723**. These are variations of the authored templates, not additional authored stories.
- Achievements: **196** (11 secret, 8 era-gated); 196/196 proved reachable by synthesised legal event sequences.
- Match types: 17 rulesets plus the Royal Rumble.
- Real-name roster entries: 107; all are approximate (see below).

## Data accuracy

- Real-name rosters, active windows, finishers, premium-event dates and record benchmarks are **approximate and unverified**. They are flagged `approx:true` in data and the UI says so. No network source was available to verify them in this build.
- Everything that happens after the start date is simulated alternate history written to the ledger as `canon:false`; fictional results are never presented as real history.
- Historical mode uses the approximate snapshot for the chosen year; modern mode and the "fully fictional" world use generated names.

## Platform notes

- Delivered as an installable, offline-capable web app (PWA) and a single-file build. There is no native iOS binary and no App Store build.
- Verified in headless Chromium at an iPhone viewport (390×844). It has not been tested on physical iOS hardware or Safari in this environment.
