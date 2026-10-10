# Simulation specification

This document describes the model as implemented, its calibration targets, and how each claim is tested. Anything not listed here is not claimed.

## 1. Players

* 36 attributes (1–100): 9 technical, 10 mental, 8 physical, 6 goalkeeping (`types.ts`), plus hidden `pot` (peak ability), `devRate`, `consistency`, `injuryProneness`.
* **No single rating drives play.** Position importance weights give *overall at a position* (`POSITION_WEIGHTS`); ten *football functions* (build-up, progression, creation, shooting, pressing, defending, aerial, pace, set pieces, goalkeeping) are weighted attribute blends (`SKILL_WEIGHTS`). Playing out of position applies a familiarity penalty (`familiarity()`).
* Condition: fatigue degrades physical attributes ≈4.5× more than technical/mental ones; form/morale/confidence combine into one small multiplier (±≈5%); a per-match, consistency-dependent "day factor" adds performance noise. These are applied once, inside `effectiveAttrs`/`computeEffectiveSkills`, so there are no overlapping bonuses.

## 2. Match engine (`match.ts`)

The match is a sequence of **possessions** consuming match-clock seconds (≈200–260 per match). A possession passes through up to three phases, each a logistic function of the rating difference of the *relevant* team functions plus tactical terms:

1. **Build-up** — loss probability vs the opponent's press (`press` rating weighted by pressing intensity, reduced by directness).
2. **Progression** — reaching the final third vs compactness (`defend`, line height), pace in behind (scaled by line height × directness), aerial edge for direct play, mentality, transition bonuses.
3. **Chance creation** — creator vs defence, plus mentality, counter-attack/transition exposure, man-marking effects, weather.

Who has the ball next follows from how the possession ended (turnover → opponent; save/off-target → goal kick; corner; foul → free kick; goal → kick-off), so **possession % is emergent**.

Shot chain: chance kind (cross/open/long/counter) → shooter chosen by a dedicated, flatter position distribution × shooting skill → xG drawn from a Gamma distribution around a kind-specific mean scaled by the creation-vs-defence edge → block → on-target → goal, where the conditional goal probability preserves the xG on average and shifts with finisher and goalkeeper skill. Set pieces (corners, direct free kicks, penalties) have their own sub-models. Fouls, cards (second-yellow tracking), offsides, injuries (hazard ∝ proneness × age × fatigue × intensity), substitutions (fatigue/tactical/forced), in-match tactical adaptation (quality depends on manager tactical knowledge), stoppage time, extra time and penalty shoot-outs are all modelled.

**Strength enters once per stage** (function ratings) plus individual finishing/goalkeeping at shot resolution. Chance *quantity* uses `beta`, chance *quality* uses a separate coefficient `qualityBeta`; the calibration tests verify the combined effect size.

**Statistics are derived from the same events as the score.** Tests check goals = goal events = Σ player goals; shots, shots on target, saves, corners, fouls, cards, offsides, substitutions and xG recomputed from the event log equal the reported statistics; SoT = goals + opponent saves; pass counts reconcile with player lines; no player acts after being sent off or substituted.

### Tactics (`tactics.ts`, tested in `test/tactics.test.ts`)

7 formations, 24 roles with duties, sliders (tempo, width, directness, pressing, line), mentality, counter-attack, marking (zonal/man/mixed), set-piece focus, adaptive flag, substitution limit. **There must be no unexplained universal bonus.** Method: each lever is measured against a balanced baseline with equal squads (home/away alternated); the 6×6 archetype matrix is measured; formations are measured against each other. Findings and fixes are recorded in the ledger — e.g. the first version of `counterAttack` was worth +0.46 goals/match against everyone, and `direct` lost 0.40/match against everyone; both were re-modelled so benefits scale with the opponent's actual exposure (line height, attacking mentality, pressing) and carry costs (cautious settled play, fatigue, fouls).

Tested bounds (enforced by `test/tactics.test.ts`): every single lever |GD vs balanced| < 0.2 goals/match (typical measured ≈0.05–0.1; sampling error ≈0.03–0.06 depending on n); archetype row averages |GD| < 0.22; no archetype beats, or loses to, every other archetype by more than 0.08; formations average |GD| < 0.2 against the field; mirrored matchups are antisymmetric within sampling error. Stacked levers (CR-009): a random sweep of 100 slider combinations (formation fixed) is screened and its three best re-tested on fresh seeds (`tactics.test.ts`); before the retune the best stacks were +0.14..+0.20 goals/match, now the worst measured is ≈+0.11 relative to an identical-tactics control (se ≈0.04), still a residual advantage for direct+pressing+deep-line stacks. The 4-2-3-1 formation is worth ≈+0.10 against the 4-3-3 baseline. Residual known biases: pressing ≈ +0.06/−0.08 and defensive line ±0.09 at the extremes, i.e. small real trade-offs rather than free upgrades.

## 3. Calibration targets

Approximate long-run figures for top European leagues recalled by the authors; **not derived from a licensed dataset in this repository**. They guard against drift/gross unrealism and are not a claim of validated real-world accuracy.

| Quantity | Target band (test) | Measured (heterogeneous N(62, 6) teams) |
|---|---|---|
| Goals / match | 2.5 – 3.15 | ≈ 2.8 |
| Home win / draw / away | 39–50% / 21–30% / — | ≈ 42 / 25 / 33% |
| Clean sheets per team | 20–34% | ≈ 27% |
| Shots / match | 22 – 30 | ≈ 26 |
| xG / goals | 0.9 – 1.1 | ≈ 1.05 |
| Fouls / yellow / red | 18–27 / 2.8–4.4 / 0.05–0.16 | ≈ 22.5 / 3.5 / 0.10 |
| Injuries per team-match | 0.15 – 0.40 | ≈ 0.25 |
| Corners / pass accuracy / offsides | 7–12 / 78–90% / 2–5.5 | ≈ 8 / 84% / 3 |
| Hat-trick rate per match (equal-ish teams) | 0.5 – 5% | ≈ 3% |

Measured with synthetic squads (n=3000 each): equal teams 44/26/30 (home/draw/away), 2.7 goals; home side +8 rating points 61/23/17; home +15 74/17/9; away side +15 15/22/63 (the weaker home team still wins ≈15%); home +25 89/8/3 with 13.6% of matches containing a hat-trick (3.2% between equal teams).

## 4. Competitions

See `docs/ARCHITECTURE.md` (ADR-003). Invariants tested for **every** registered competition: unique fixture ids, no club double-booked on a day, all fixtures play out to a single winner, final ranking contains every entrant exactly once. Pot-based league phases are verified for: 8 distinct opponents, 4 home/4 away, exactly one home and one away opponent per pot, one match per club per matchday, no same-country pairings (relaxation of country caps is reported, not silent).

**Saudi Pro League** (first-class): 18 clubs, double round-robin, head-to-head-first tie-breakers, 10-foreign-player registration cap (enforced at signing, loans count against the parent), investor/state ownership share ≈55% with higher transfer aggression and no squad-cost ceiling, extended windows, ACL Elite qualification (West zone), Saudi Super Cup, a promotion/relegation link with the Saudi First Division, Saudi localisation (Arabic/RTL, SAR). All rule values are *unverified scenario defaults* (see `docs/DATA_AND_LICENSING.md`).

## 5. World dynamics

* **Season**: 364 days, 52 weeks; domestic leagues from week 2, continental competitions on mid-week slots, cups on distinct weeks, windows per league. Calendar-year leagues (Brazil, MLS) run inside the same cycle (documented simplification).
* **Finance** (weekly): broadcasting, sponsorship, matchday (attendance model), prize money; wages, operating costs, interest; transfer installments; owner support and borrowing; distress ⇒ embargo; squad-cost-ratio rule where configured; annual surplus investment/dividends; annual wage review so wage bills track revenue. Ledger identity `cash = seasonStartCash + Σ ledger` is an enforced invariant; transfer money nets to zero across clubs.
* **Development**: per-attribute weekly growth toward a hidden proportional ceiling, rate by age curve per attribute group, club coaching/training, playing time, position relevance; decline per group; injuries leave small physical legacies; annual potential revision; academy intake tied to league level.
* **Transfers**: one validated path (`executeTransfer`) for AI and human. AI clubs use *noisy scouted estimates* (error shrinks with scouting facility), budgets, wage room, squad/foreign limits, embargoes, style preferences; sellers use importance-weighted reserve prices; players weigh wage, prestige, playing time. Loans (wage share), renewals, free agents, squad trimming, emergency cover.
* **Managers**: style → tactics from the squad, results-vs-expectation dismissals, appointments from the unemployed pool.

## 6. Known limitations of the model

See `docs/LIMITATIONS.md`.
