# Quality report

Based on 11 Gauntlet rounds. Final measured round: **11** (2026-10-14T20:56:21.446Z). Every score below is computed by `tools/rubric.js` from tests, simulations and audits run in that round; see `docs/gauntlet/round-NN.md` for the evidence behind each criterion.

## Scores

| Category | Round 1 (baseline) | Final | Target 9.0 |
|---|---:|---:|:---:|
| Match engine | 7.59 | **9.80** | met |
| Player agency | 9.81 | **9.52** | met |
| Memory consistency | 6.81 | **8.03** | not met |
| Achievement integrity | 9.54 | **9.80** | met |
| Scenario diversity | 7.57 | **7.64** | not met |
| Narrative quality | 5.45 | **8.32** | not met |
| WWE universe simulation | 6.92 | **8.61** | not met |
| Career progression | 5.57 | **9.77** | met |
| Mobile usability | 7.24 | **8.60** | not met |
| Technical reliability | 10.00 | **10.00** | met |
| Performance | 6.78 | **8.98** | not met |
| Replayability | 8.28 | **9.50** | met |
| **Mean** | 7.63 | **9.05** | |

Categories at or above 9.0: **6/12**.

## Round history

| Round | Mean | Min | ≥9 | Tests | Focus |
|---:|---:|---:|---:|---:|---|
| 1 | 7.63 | 5.45 | 3 | 90/90 | Baseline measurement before any gauntlet-driven improvement |
| 2 | 8.38 | 5.40 | 5 | 93/93 | Fix weakest measured criteria: time-limit draws, finisher frequency, popularity/title pacing, universe churn,  |
| 3 | 8.97 | 7.51 | 6 | 107/107 | Act on the first independent reviews (narrative 4, memory 6, mobile 6): fix false/stale memory callbacks, prom |
| 4 | 9.22 | 7.60 | 8 | 123/123 | Features: legacy/Hall of Fame, tag titles, factions, finances, multi-way matches, interviews; 589 authored sce |
| 5 | 9.20 | 7.59 | 8 | 132/132 | Act on round-4 independent reviews (narrative 4.5, memory 5.5, mobile 6.0): commentary/promo/interview prose,  |
| 6 | 8.94 | 7.59 | 7 | 135/135 | Narrative quality & memory visibility (reviewer findings from round 4): authored prose packs (commentary 44 ke |
| 7 | 9.04 | 7.67 | 7 | 140/140 | Fix findings of the round-6 independent reviews: narrative (pronouns, fan intros, commentary repetition, move  |
| 8 | 9.01 | 7.75 | 6 | 185/185 | Features and content: TLC/MITB/battle royal/handicap, personal-life system, social media feed, faction managem |
| 9 | 8.96 | 7.43 | 6 | 189/189 | Round-8 independent review findings: multi-way attribution, result-aware triggers, cage/ladder commentary, soc |
| 10 | 8.89 | 7.14 | 6 | 192/192 | Round-9 independent review findings: seam QA across all 853 scenario templates (slot fit, premise honesty, men |
| 11 | 9.05 | 7.64 | 6 | 195/195 | post-review fixes for memory and narrative; final verification |

## Independent reviews

Reviewers are fresh Claude subagents (same underlying model family as the author, separate contexts, no access to author reasoning). They are independent in context, not in model. Scores are their own, unedited.

### Review round 2

- **narrative** (agent): narrativeQuality 4, variety 3, voice 4.5, callbacks 3.5. Templated commentary/promos with repeated lines; broken 'you, you' callback grammar; one failed-promise hook reused everywhere.
- **memory** (agent): memoryConsistency 6, invention_risk 6, player_visibility 7. Ledger layer solid; dialogue/record-book semantics layered on top had false 'last time was controversial' claims, leaking broken promises, double-resolving promises, h2h disagreement, no world-vs-ledger check on load.
- **mobile** (agent): mobileUsability 6, clarity 5.5, hierarchy 5.5, matchScreen 5.5, visualPolish 4.5. Legible thumb-friendly prototype with flat visual identity; toast covers controls; cryptic scoreboard; wall of equal cards on match screen.

### Review round 4

- **narrative** (agent): narrativeQuality 4.5, variety 4, voice 4.5, callbacks 4. Authored scenes have real voice, but commentary loops and contradicts its own pin counts, promos are slot-filled and repeat, scenario callbacks rare in the sampled early career.
- **memory** (agent): memoryConsistency 5.5, invention_risk 6, player_visibility 5. Ledger layer solid; NPC lines inverted for clean wins/losses, promises could break without ledger events, win_streak promise kept early, duplicate promises dropped silently, mentorship direction reversed, legacy not a pure function of the ledger, little player-visible promise feedback.
- **mobile** (agent): mobileUsability 6, clarity 6.5, hierarchy 6, matchScreen 5.5, visualPolish 6. Coherent identity and 44px targets; toast covered titles, match HUD dense and decision list long, home lacked a primary CTA, record book spreadsheet-like.

### Review round 6

- **narrative** (agent): narrativeQuality 4.6, variety 4, voice 5.5, callbacks 4.5. Authored scenes, promo one-liners and stance answers have wit and the ledger-backed numbers are accurate; generated text is undermined by lowercase 'i', outlet names on fans, reflexives for named people, wrong-direction memory lines, placeholder move names and stock commentary repeats.
- **memory** (agent): memoryConsistency 6.5, invention_risk 7, player_visibility 6.5. Ledger, replay, save/load, tamper detection and promise bookkeeping are rigorous (about 7,500 automated checks across 7 careers); contradictions live in the narrative layer: 'every one was clean' lines, scenario text citing betrayals that never happened, tag/triple-threat perspective errors, outcome-blind interview answers, h2h counts that differ between surfaces.
- **mobile** (agent): mobileUsability 6.5, clarity 7, hierarchy 7, matchScreen 6.5, visualPolish 7.5. Strong identity, one red CTA per screen, 44px targets, no horizontal overflow at 360/390/430 or 20px text; held back by a long match-prep page with unreachable CTA, heavy sticky HUD on small phones, noisy record book, flat Rumble/result screens and clipping toasts.

### Review round 8

- **narrative** (agent): narrativeQuality 5.5, variety 5, voice 6, callbacks 6. Scenario pool is the strongest part and match-record callbacks are numerically accurate; commentary is stock-heavy, multi-way matches loop three filler lines, cage matches narrated as ladders, champion answered as challenger, social posts have slot bugs, NPC speech is thin.
- **memory** (agent): memoryConsistency 6, invention_risk 7, player_visibility 7. Ledger, chain, replay, save/load and promise tracking held under attack; multi-way losses were credited to every opponent on all surfaces, several scenario texts assumed a recent event their triggers did not check, faction_joined had no rule, the mentor tag had no direction.
- **mobile** (agent): mobileUsability 6, clarity 6.5, hierarchy 5.5, matchScreen 6.5, visualPolish 6.5. Coherent identity and clear red CTA, no overflow at 360/390/430; held back by a sticky CTA hidden under the tab bar, a board using 30-42% of small screens, invisible toasts/errors, and long flat lists.

### Review round 9

- **narrative** (agent): narrativeQuality 5.5. Slot/pronoun seams largely fixed; commentary still stock-heavy; NPC speech thin.
- **memory** (agent): memoryConsistency 6.5. Raw-event oracle: core ledger layers consistent; scenario/obligation layer drift remained.
- **mobile** (agent): mobileUsability 6.5. Toast placement and sticky CTA issues; otherwise coherent at 360/390/430.

### Review round 10

- **narrative** (agent): narrativeQuality 6. Steady improvement 4.6 to 5.5 to 6.0; remaining issues: repeated broken-promise scenes, NPC role consistency, individual nonsense sentences, speech-tag casing.
- **memory** (agent): memoryConsistency 7, invention_risk 8, player_visibility 8. Ledger-derived layers matched the oracle with no false claims; contradictions in scenario/obligation layer, multi-way and tag summaries, flag-versus-world drift (12 root causes, fixed after review).
- **mobile** (agent): mobileUsability 6.5. Objective pin, toast and world-editor error fixes applied; hierarchy and polish still short of 9.

## What the scores do not prove

- The reviewers are fresh Claude subagents: independent in context, not in model family.
- Simulated "players" are scripted strategies; no human playtest data exists.
- Several rubric criteria are proxies (for example commentary variety is distinct lines per thousand). A high score means the proxy is met, not that the game is fun.
- Real-world history is approximate and unverified (see FEATURE_STATUS.md).
- Performance numbers are from a desktop-class cloud core; phones will be slower.

## Unverified or unimplemented criteria in the final round

- WWE universe simulation: Verified historical data — unverified
