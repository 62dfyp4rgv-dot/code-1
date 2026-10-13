# Feature status (honest completion report)

Generated from `tools/features.js` (each "complete" entry has a probe that must pass) and Gauntlet round 3 (2026-10-13T11:50:28.740Z).

**18 complete · 7 partial · 3 unimplemented** of 28 tracked features.

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
| Elimination Chamber / TLC / Money in the Bank / battle royal / handicap | **unimplemented** |  |
| Triple threat and fatal four-way (3-4 sides, bystander pin break-ups, focus targeting) | **complete** |  |

## Career

| Feature | Status | Note |
|---|---|---|
| Character creation (5-step wizard, styles, backgrounds, gimmick, finisher, signatures) | **partial** (declared complete, probe failed) |  |
| Progression: training, fatigue, injuries, popularity, contract/money | **complete** |  |
| Finances: match pay, salary, merchandise, lifestyle costs, debt, contract renewal, statements in the ledger | **complete** | No investments, property or taxes beyond a flat withholding. |
| Personal life (family, health, hobbies) beyond scenario choices | **partial** | Scenario-driven only; no standalone systems. |
| Retirement, Hall of Fame induction and evidence-backed legacy verdict | **complete** | HoF induction is recorded at retirement for the Class of the following year (no post-retirement time simulation). |

## Universe

| Feature | Status | Note |
|---|---|---|
| Weekly shows + PLE calendar by era (brand split, NXT) | **complete** |  |
| Independent AI universe (AI-vs-AI matches, feuds, alliances, betrayals, injuries, title reigns) | **complete** |  |
| Singles/midcard championships with lineage validation | **complete** |  |
| Tag-team championships (AI defenses and changes; player can challenge and defend with a partner) | **complete** |  |
| Factions: AI factions form/dissolve and tag together; the player joins or founds one through story scenes | **partial** | No faction management screen; recruitment/leadership decisions happen inside scenarios. |
| Verified historical data (real rosters, title lineages, PLE results) | **partial** | Roster/titles are approximate and flagged approx:true; NOT verified against sources. |
| Historical / modern modes with separation of fictional results | **partial** (declared complete, probe failed) |  |
| Alternate-history and fully custom universe editor | **partial** | Generator supports fictional rosters; no editor UI. |

## Story

| Feature | Status | Note |
|---|---|---|
| Scenario engine with validated templates (cast, slots, choices, effects) | **complete** |  |
| Promo delivery with memory-grounded claims | **complete** |  |
| Standalone interviews / podcasts / press conferences as player-initiated, memory-grounded flows | **complete** |  |
| Social media / fan systems beyond scenarios | **unimplemented** |  |

## Platform

| Feature | Status | Note |
|---|---|---|
| Versioned saves, slots, autosave, backup, migrations, checksum | **complete** |  |
| Offline PWA (manifest, service worker), iPhone viewport UI | **complete** |  |
| Settings: text size, themes, slots | **partial** (declared complete, probe failed) |  |
| Native iOS app / App Store build | **unimplemented** | Web PWA only (add to Home Screen). |

## Content counts (authored and generated are reported separately)

- Authored scenario templates: **327** across 27 categories.
- Validated generated configurations (template × slot combination, capped at 24 per template): **4443**. These are variations of the authored templates, not additional authored stories.
- Achievements: **192** (11 secret, 8 era-gated); 192/192 proved reachable by synthesised legal event sequences.
- Match types: 9 rulesets plus the Royal Rumble.
- Real-name roster entries: 107; all are approximate (see below).

## Data accuracy

- Real-name rosters, active windows, finishers, premium-event dates and record benchmarks are **approximate and unverified**. They are flagged `approx:true` in data and the UI says so. No network source was available to verify them in this build.
- Everything that happens after the start date is simulated alternate history written to the ledger as `canon:false`; fictional results are never presented as real history.
- Historical mode uses the approximate snapshot for the chosen year; modern mode and the "fully fictional" world use generated names.

## Platform notes

- Delivered as an installable, offline-capable web app (PWA) and a single-file build. There is no native iOS binary and no App Store build.
- Verified in headless Chromium at an iPhone viewport (390×844). It has not been tested on physical iOS hardware or Safari in this environment.
