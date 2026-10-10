# Status

Legend — **Impl**: implemented · **Web ✔**: exercised by the Playwright e2e on the exported web build (390×844, some at 320×568,
light/dark, EN/AR; viewport 393×852 = iPhone 15 points) · **Device ✘**: not run on iOS/Android (no device/SDK available in the build sandbox).

| Screen / feature | Route | Impl | Web | Device |
|---|---|---|---|---|
| Start menu, continue last save | `/start` | yes | ✔ | ✘ |
| New career (seed, preset, league, club) | `/new-career` | yes | ✔ (compact; standard only warning shown) | ✘ |
| Real-world names: starter pack switch, `.json` data-pack import (precise errors, applied counts, "rest stays fictional"), local/embedded crest images with fallback | `/new-career`, `Crest`, `/about`, `/start` | yes | ✔ (starter pack, bad/remote-crest pack, user pack with embedded + unreachable crest, 393 + 320 px, reload keeps pack) + 6 store tests | **✘** (native picker + `file://` crests untested) |
| Home: next-match hero + Play CTA, first-run checklist, season glance (position sparkline, W/D/L form chips), simulation controls (end-of-season confirm) | `/` | yes | ✔ (393 + 320 px) | ✘ |
| Squad (sort/filter/search, condition, injuries) | `/squad` | yes | ✔ | ✘ |
| Player profile (attributes, positions, history, transfers, scout report, actions) | `/player/[id]` | yes | ✔ | ✘ |
| Fixtures (upcoming / results / by day) | `/fixtures` | yes | ✔ | ✘ |
| Match centre: animated live reveal (clock, score ticks, goals/cards feed, pause/skip/replay, Reduce Motion), summary, stats, timeline, lineups; auto-opens after *Play* | `/match/[id]` | yes | ✔ (EN, AR/RTL, 320 px) | ✘ |
| Transfer market + filters | `/market` | yes | ✔ | ✘ |
| Bid / loan / free agent / renewal / list / release sheets, counter-offer & demanded-wage flows | player sheets | yes | ✔ (reject, invalid, completed seen; counter flow not triggered in e2e) | ✘ |
| Tactics (formation, roles, 5 sliders, mentality, switches, marking, set pieces, presets, validation) | `/tactics` | yes | ✔ | ✘ |
| Lineup picker | `/lineup` | yes | ✔ | ✘ |
| Club profile | `/club/[id]` | yes | ✔ | ✘ |
| Finances & contracts | `/finances` | yes | ✔ | ✘ |
| Manager & AI explanations | `/manager` | yes | ✔ | ✘ |
| Competitions browser + detail (tables, stages, brackets, fixtures, leaders, entrants, verification note) | `/competitions`, `/competition/[id]` | yes | ✔ | ✘ |
| Continental hubs (UEFA, AFC, CAF, Concacaf, CONMEBOL, OFC, FIFA CWC) | `/continental` | yes | ✔ | ✘ |
| Records, stat leaders, news | `/records` | yes | ✔ | ✘ |
| Calendar & simulation (+N days, cancel, progress) | `/calendar`, overlay | yes | ✔ (cancel: unit + store test, not clicked in e2e) | ✘ |
| Save slots (load/overwrite/rename/delete/export/import/verify, autosave toggle) | `/saves` | yes | ✔ | ✘ |
| Settings (theme, language/RTL, text size, high contrast, haptics, currency, digits, integrity check) | `/settings` | yes | ✔ | ✘ |
| About / limitations | `/about` | yes | ✔ | ✘ |
| IndexedDB save store | `core/saves/idbStore.ts` | yes | ✔ + unit tests (fake-indexeddb) | n/a |
| expo-sqlite driver | `core/saves/sqliteDriver.ts` | yes | n/a | **✘** (adapter logic tested vs node:sqlite double only) |
| File export/import on native | `core/files.native.ts` | yes | n/a | **✘** |
| Autosave on background | `platform/useAppLifecycle.ts` | yes | not exercised (needs tab hide) | ✘ |
| Native RTL mirroring (`I18nManager`) | `platform/direction.ts` | yes | web path ✔ | **✘** |
| Haptics (`expo-haptics` via `platform/haptics.ts`; no-op on web / when disabled) | tabs, buttons, chips, goals, bids | yes | n/a (no-op on web; not observable) | **✘** |
| iOS-style large titles, press/scale states, native stack slide + tab fade transitions | all screens | yes | large titles + press states ✔; transitions are `none` on web | **✘** |
| Safe-area handling (notch / Dynamic Island / home indicator) | `Screen`, tab bar, `NoticeHost`, sheets | yes | **✘** (web insets are 0) | **✘** |
| Tap-target audit (≥44 px, hitSlop elements ≥28 px in the DOM) | home, squad, fixtures, market, match, more | n/a | ✔ (viewport-visible elements only) | ✘ |

Bundling: `expo export --platform web|android|ios` all succeed (Android/iOS produce Hermes bytecode bundles).

## UX polish pass (this revision)

See `docs/reviews/UX_REPORT.md` for the ranked critique. Checks added: `e2e/run.mjs` now runs at 393×852 and asserts the first-run
checklist, next-match hero and Play button position, the live reveal (clock advances, pause freezes, skip, replay, Reduce Motion
jumps to full time, goal feed has one entry per goal and the final score equals the engine result and the Home result row),
form chips / position on Home after a match, the end-of-season confirmation, an Arabic/RTL reveal and a 320 px reveal, plus a tap-target audit.
Unit tests added in `test/ux.test.ts` (form guide, timeline vs the real engine, position history, W/D/L chip contrast, `humanFixtureId`).

Known gaps: see "Remaining gaps" in the UX report. The match reveal is a presentation of an already simulated match (no in-match decisions).
The league-position sparkline is reconstructed from fixtures (3-1-0, GD, GF) and pinned to the engine's real current position.

## Real-world data packs (this revision)

Integrated the engine's `parseDataPack` / `applyDataPack` / `REAL_CLUB_NAMES` (see README "Real-world names"). Tests: `test/dataPack.test.ts` (starter pack ->
real names -> start career -> save -> reload keeps names and `dataPack`; idempotent re-apply/remove; bad text/object leaves the pending world untouched; regenerate resets;
user pack with crest/coach/player survives save+reload; crest URI safety) and e2e section 9. Honest limits: names/cities come from an unverified starter list;
no logos, players or coaches are bundled; ratings in a pack are the author's estimates; the native document picker, `file://` crest loading and the
`expo-file-system` read path were not run on a device; `asset:` crests always fall back to the generated crest; the start screen's pack wording only applies when a pack career is loaded (saves
carry no pack flag before loading). `docs/DATA_PACKS.md` (pack format) is written separately.
