# Architecture

## Principles

1. **One authority per fact.** The match state machine decides match outcomes; the ledger decides what has happened in a career; the universe decides who holds what. Prose (commentary, dialogue, summaries) is derived and can never feed back.
2. **Everything is serialisable JSON and seeded.** All randomness comes from `Rng` (mulberry32) with its state stored in the owning object (`BoundRng`). A saved match resumes into identical state; a career replays identically from a seed.
3. **Derived data must be provable.** Stats, relationships, promises, obligations, achievements and record-book numbers are all recomputable from the ledger, and `tools/careersim.js#audit` checks that live state equals the replay.
4. **No runtime dependencies.** Plain ES modules run in Node (tests/sims) and the browser. esbuild only bundles for distribution.

## Module map

```
src/core        rng.js (seeded PRNG), util.js (hash53, deepFreeze, clamp…)
src/match       moves.js rules.js state.js stances.js calc.js actions.js resolve.js ai.js engine.js
                commentary.js rating.js samples.js rumble.js
src/memory      ledger.js world.js rules.js retrieve.js summaries.js memory.js
src/achievements defs.js (196 declarative) engine.js (DSL evaluator) custom.js util.js
src/career      career.js stats.js recordbook.js booking.js eventTypes.js pace.js
src/universe    calendar.js universe.js sim.js records.js awards.js
src/data        eras.js generator.js roster_real.js (approximate, flagged)
src/story       scenarios.js (engine) scenarioValidator.js scenarios/*.js (data)
                dialogue.js media.js appearances.js
src/save        save.js
src/game.js     Game facade — the only API the UI calls
ui/             index.html styles.css views.js app.js sw.js manifest
tools/          build serve e2e smoke_artifact matchsim prover scenarios careersim
                metrics rubric features gauntlet reviewpack
```

## Match engine

A round is `attacker action → (defender stance) → resolve`. Pending decisions are explicit kinds: `action`, `defense`, `pin`, `hold_h`, `hold_v`, `rise` (ten count), `apron` (tag partner). `calc.js` is pure: connect probabilities and damage are computed without RNG, so the UI can show honest odds and tests can assert exact numbers; `resolve.js` rolls dice against them and emits **structured events**. `commentary.js` narrates events (variants chosen by hashing the sequence number, never the RNG). `rating.js` derives a 0–5★ rating and stats from events only.

Rulesets (`rules.js`) are data (17): singles, tag, submission, no-DQ, last man standing, iron man, ladder, cage, hell cell, triple threat, fatal four-way, elimination, chamber, TLC (`hardcore`, `recoil`), Money in the Bank (4-way ladder), battle royal (`overTheTop`), handicap (`teamSizes`, `loneBonus`). Tunables that exist only for specific rule types (`subWeight`, `riseWeight`) live in the ruleset. AI (`ai.js`) uses its own RNG stream and difficulty profiles; it gets *urgent* near the time limit so draws are rare.

The Royal Rumble (`rumble.js`) is a separate seeded 30-entrant engine with its own decisions and summary event.

## Memory (three layers)

1. **Ledger** (`ledger.js`) — append-only, hash-chained, frozen events with stable ids (`E000001…`), idempotent by `key`, indexed by type/participant/day. `verify()` re-walks the chain.
2. **World state** (`world.js`, `rules.js`) — relationships, rivalries, promises, obligations, tags, factions. Updated *only* by declarative rules that run when an event is recorded; `replayWorld()` rebuilds it from the ledger, and reads are side-effect free (`getRel` vs `ensureRel`).
3. **Narrative summaries** (`summaries.js`, `retrieve.js`) — scored retrieval (recency, importance, participant overlap, unresolved conflict) and summaries whose claims are validated against evidence ids.

Dialogue (`dialogue.js`) produces a line only when a supporting ledger fact exists, and returns its `refs`. Interview/podcast/press questions (`appearances.js`) are built the same way.

## Achievements and the Record Book

Definitions are data using a small DSL (`count`, `sum`, `max`, `distinct`, `streak`, `stat`, `all`, `any`, `custom`). Evaluating against the ledger (`maxSeq`-aware) yields `{value, target, done, evidence}`. An unlock is itself a ledger event citing the evidence. `AchievementEngine.rebuildUnlocks` proves unlocks derivable, and `tools/prover.js` synthesises a legal event sequence for every definition. `buildRecordBook` returns items whose `evidence` ids open the underlying events in the UI.

## Universe

`Universe` holds roster, titles (with lineage validation), feuds, alliances, records. `UniverseSim` advances day by day: weekly shows and PLEs from `calendar.js`; matches resolved by the real engine for titles, premium events and notable names and by a statistical resolver for undercards; feuds, alliances, betrayals, turns, injuries, releases, retirements and debuts. World events that touch the player are written to the ledger as `scope:'world', canon:false`.

## Stories

Scenario templates are pure data (see `SCENARIO_FORMAT.md`): trigger predicates, cast roles, text slots, weighted choices and typed effects. `ScenarioEngine` binds the cast from the live world, renders, applies effects *through the ledger*, and prevents repetition (cooldowns, per-career caps, category cooldown). `scenarioValidator.js` resolves every slot combination and checks safety ranges.

## Persistence

`save.js` writes an envelope `{format, version, checksum, payload}` (gzip when available) to IndexedDB → localStorage → memory. Three slots plus autosave and a `.bak` backup; migrations upgrade old payloads; the ledger chain is verified on load, and a corrupt primary falls back to the backup.

## UI

`views.js` renders HTML strings from state; `app.js` owns state `S`, event delegation on `data-action`, autosave and settings. Layout is mobile-first (390px), safe-area aware, with four text sizes and light/dark/system themes. The e2e test drives this exact UI.

## Determinism guarantee

The custom-move registry (`moves.js`) is process-global; every fighter creation and match restore re-registers its specs so results never depend on what ran earlier (regression test: `test/determinism.test.js`).

## Round 7-8 additions
- `src/story/social.js`: the social feed is a pure view derived from the ledger (fan reactions, media headlines, rival shots from `memoryLines`, the player's own posts); posting writes one `social_post` event whose rule (`memory/rules.js`) turns callouts/mocking into heat and rivalry. Fan mood is a pure function of the last 12 public events.
- `src/career/life.js`: wellbeing / family / friends live on `player.life` (saved with the player, not derived from the ledger); activities write `life_activity` events; `Career.advanceDays` calls `lifeDay` and `recoveryBonus`. Scenario triggers read `wellbeing`, `family`, `socialLife`; effects `wellbeing`/`family`/`social` move them.
- Factions: `Game.factionView/foundFaction/leaveFaction` write `faction_formed` / `faction_left` events; leaving costs trust through the rules engine.
- World editor: `Universe.addCustom` replaces similar fictional wrestlers with validated player-authored ones at career creation.
- Save envelope: checksum is SHA-256 (legacy hash53 still opens), plus `ledgerHead`/`ledgerSize` so truncation of the ledger tail is detected. Limitation: all of this is integrity checking, not authentication; anyone with the code can re-chain and re-checksum a forged save.
- Head-to-head records are defined once (`memory/summaries.js h2hCounts`: opponents only, team result) and used by hooks, Story-so-far, the rivalry screen and the opponent card.
