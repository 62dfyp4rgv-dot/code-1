# Licences and third-party material

| Item | Licence | Where |
|---|---|---|
| Game code, UI, original icons (`tools/make-icons.mjs`), synthesised audio (WebAudio, no samples), original SVG icon set | Authors' own work; **no licence granted yet** (`UNLICENSED` in package.json — the owner must choose one before distribution) | `app/`, `ios/`, `tools/` |
| Natural Earth country geometry, via `world-atlas@2.0.2` | Natural Earth: public domain. `world-atlas` packaging: ISC. Used only at build time (`tools/build-map.mjs`); derived output is `app/data/map.json` | `app/data/map.json` |
| Fonts | System UI fonts only (`-apple-system`, `system-ui`); nothing bundled | `app/css/app.css` |
| Playwright / Chromium | Apache-2.0 / BSD — dev-time test tooling only, not shipped | `tests/ui`, `tools/` |
| Statistics | Rounded approximations of public facts; no dataset is redistributed | `docs/DATA_SOURCES.md` |

The game ships **no runtime third-party code** and no network calls.
