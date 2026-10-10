# Status

Legend — **Impl**: implemented · **Web ✔**: exercised by the Playwright e2e on the exported web build (390×844, some at 320×568,
light/dark, EN/AR) · **Device ✘**: not run on iOS/Android (no device/SDK available in the build sandbox).

| Screen / feature | Route | Impl | Web | Device |
|---|---|---|---|---|
| Start menu, continue last save | `/start` | yes | ✔ | ✘ |
| New career (seed, preset, league, club) | `/new-career` | yes | ✔ (compact; standard only warning shown) | ✘ |
| Home dashboard + simulation controls | `/` | yes | ✔ | ✘ |
| Squad (sort/filter/search, condition, injuries) | `/squad` | yes | ✔ | ✘ |
| Player profile (attributes, positions, history, transfers, scout report, actions) | `/player/[id]` | yes | ✔ | ✘ |
| Fixtures (upcoming / results / by day) | `/fixtures` | yes | ✔ | ✘ |
| Match centre (summary, stats, timeline, lineups) | `/match/[id]` | yes | ✔ | ✘ |
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
| Settings (theme, language/RTL, text size, high contrast, currency, digits, integrity check) | `/settings` | yes | ✔ | ✘ |
| About / limitations | `/about` | yes | ✔ | ✘ |
| IndexedDB save store | `core/saves/idbStore.ts` | yes | ✔ + unit tests (fake-indexeddb) | n/a |
| expo-sqlite driver | `core/saves/sqliteDriver.ts` | yes | n/a | **✘** (adapter logic tested vs node:sqlite double only) |
| File export/import on native | `core/files.native.ts` | yes | n/a | **✘** |
| Autosave on background | `platform/useAppLifecycle.ts` | yes | not exercised (needs tab hide) | ✘ |
| Native RTL mirroring (`I18nManager`) | `platform/direction.ts` | yes | web path ✔ | **✘** |

Bundling: `expo export --platform web|android|ios` all succeed (Android/iOS produce Hermes bytecode bundles).
