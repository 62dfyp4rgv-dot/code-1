# Football Universe — mobile app (Expo / React Native)

The player-facing app for the deterministic football engine in `packages/engine` (`@fu/engine`). It uses **only** the engine's
public API (`packages/engine/src/index.ts`): world generation, `*View` view-models, validated `actions`, `advanceDay`, and
`SaveRepository`/`encodeWorld`/`decodeWorld`. All clubs, players and managers are fictional; competition rules are the engine's
**unverified scenario defaults** and the UI says so.

Stack: Expo SDK 57, React Native 0.86, React 19, Expo Router (routes in `src/app`), zustand, react-native-svg, expo-sqlite
(native saves), IndexedDB (web saves), expo-haptics (iOS feedback; no-op on web). Versions are pinned to `node_modules/expo/bundledNativeModules.json`.

## Layout

```
src/app/            Expo Router routes (thin screens)   (tabs)/ Home · Squad · Fixtures · Market · More
src/features/       screen-level building blocks (tables, sheets, pitch, competition body) + pure helpers
src/ui/             design-system components (Txt, Button, Chip, Slider, Table, Sheet, Crest/Avatar, Motion, Charts ...)
src/platform/       haptics wrapper, RTL direction, app lifecycle
src/theme/          tokens.ts (colours light/dark, spacing, radii, type scale), ThemeProvider
src/i18n/           en.ts / ar.ts dictionaries, translate(), useI18n() (RTL flag, number/money/date helpers)
src/core/           format.ts (Intl with fallbacks, EUR→SAR), simRunner.ts (time-sliced simulation), saves/*
src/core/saves/     SaveStore interface; IdbSaveStore (web), ExpoSqliteDriver + SaveRepository (native), serialisation wrapper
src/state/          worldHost (engine world singleton, outside React), gameStore (zustand), settings, memoised view queries
e2e/                Playwright script + static server for the exported web build
test/               Vitest unit/integration tests
```

Key design decisions
* The engine world is a module singleton (`state/worldHost.ts`). React only sees a `version` counter; screens read engine views
  through `useWorldQuery(key, args, fn)` which memoises per (version, key, args).
* Simulation (`core/simRunner.ts`) runs whole engine days until a ~24 ms slice budget is used, then yields (`setTimeout 0`),
  reports progress and checks a cancel flag between days. A blocking dialog shows date/progress/Cancel.
* Autosave: after every simulation, when the app goes to background (`AppState`), and 12 s after any user change (debounced).
  Saves write a new revision atomically; load verifies the checksum and falls back to the previous revision (with a notice).
* Money is EUR everywhere in the engine; the UI converts with a **fixed approximate** `SAR_PER_EUR = 4.06` (`core/format.ts`).
* RTL: `<html dir>` on web; a root `direction` style + `I18nManager.forceRTL` on native (full native widget mirroring needs an
  app restart — the app tells the user). Layout uses logical `start/end` styles and mirrored chevrons.

## Run

```bash
npm install                     # at the repo root (npm workspaces)
cd apps/mobile
npx expo start                  # Expo Go / simulator / web (press w)
```
* **Expo Go** (App Store) only works if its bundled SDK matches SDK 57, and `expo-sqlite` saves may need a development build; if either
  fails use one of the builds below. (Not tried here.)
* `ios/` and `android/` are generated (CNG); never edit them by hand.
* Note: `npx expo install` needs api.expo.dev; in restricted networks install the exact versions from
  `node_modules/expo/bundledNativeModules.json` with plain `npm install`.

### Running on an iPhone (nothing below has been executed in this repo's sandbox: no Mac, Xcode, EAS account or device)

`eas.json` profiles: `development` (dev client, installs on a real device, internal distribution), `simulator` (extends `development`, iOS
Simulator build), `preview` (internal-distribution release build, no dev server needed), `production` (App Store / TestFlight).

**A. Real iPhone via EAS dev build (no Mac needed; needs an Apple Developer Program account for ad-hoc device provisioning)**
```bash
npm i -g eas-cli && eas login
cd apps/mobile
eas init                               # once: creates the EAS project id
eas device:create                      # register the iPhone (opens a profile-install link on the phone)
eas build --profile development --platform ios
# open the build's install link/QR on the iPhone (enable Developer Mode: Settings > Privacy & Security), then:
npx expo start --dev-client            # phone and computer on the same network (or --tunnel)
```
For a standalone build without a dev server: `eas build --profile preview --platform ios` and install from the link.
TestFlight: `eas build --profile production --platform ios` then `eas submit --platform ios`.

**B. iOS Simulator on a Mac with Xcode**
```bash
cd apps/mobile
npx expo run:ios                       # prebuilds ios/, compiles with Xcode, boots a simulator, starts Metro
# or, without local Xcode builds:  eas build --profile simulator --platform ios  (download the .tar.gz, drag the .app onto the Simulator)
```
`npx expo run:ios --device` installs on a USB-connected iPhone using your own signing team (a free Apple ID works for 7-day builds).

What a device/simulator run must still confirm (all UNVERIFIED so far): notch / Dynamic Island / home-indicator insets, haptics, native
stack and tab transitions, `expo-sqlite` saves, file export/import, native RTL (needs an app restart after switching language), VoiceOver
with the match reveal, Dynamic Type, and frame rate while simulating (the engine runs on the JS thread).

## Export the web build

```bash
EXPO_OFFLINE=1 CI=1 npx expo export --platform web      # → apps/mobile/dist (SPA, IndexedDB saves)
npx expo export --platform android   # Hermes bytecode bundle (verifies native bundling only)
```

## Tests

```bash
cd apps/mobile
npx tsc --noEmit        # typecheck (strict, noUncheckedIndexedAccess)
npx vitest run          # unit + integration tests (56 tests, ~15 s)
npm run export:web && node e2e/run.mjs     # Playwright e2e against dist/ (Chromium from PLAYWRIGHT_BROWSERS_PATH)
```
The e2e script starts its own static server, drives a real browser (393×852 = iPhone 15 points, then 320×568), asserts visible text / DOM state
(113 assertions, includes the animated match reveal, Reduce Motion, RTL and a tap-target audit) and writes ~55 screenshots to `docs/screenshots/`.
The iOS bundle is checked with `EXPO_OFFLINE=1 CI=1 npx expo export --platform ios` (Hermes bytecode).

## What is verified vs not

See `STATUS.md` for a per-screen table. In short: everything is verified **on the web build in Chromium** (e2e + unit tests),
the iOS/Android **bundles compile** (`expo export --platform android|ios`), but **nothing has been run on a phone/simulator**:
native layout and safe areas, haptics, native transitions, Hermes performance, `expo-sqlite` against the real native module, file export/import (expo-file-system / sharing /
document-picker) and `I18nManager` RTL behaviour are unverified. The SQLite adapter logic is tested against a `node:sqlite`
double of the expo-sqlite async API only.

## Known limitations
* Engine text (match events, news, error reasons, verification notes) is English only; names stay as generated.
* Engine calls are synchronous: world generation and each simulated day run on the JS thread (no worker). The UI stays responsive
  between days; on slow devices a single day can still cause a visible pause. Compact world ≈1.5 s to generate and ≈0.1 s per
  simulated day on desktop Node; saves are large (≈18 MB of JSON for a compact world after two months).
* Table zones (promotion/qualification/relegation colours) are not shown: the engine view-models do not expose them.
* The engine's automatic lineup picker is not public, so the Lineup screen pre-fills with its own greedy suggestion (position-fit);
  "Let the assistant pick" restores the engine's real automatic selection.
