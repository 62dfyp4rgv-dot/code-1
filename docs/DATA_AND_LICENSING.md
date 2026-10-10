# Data sources, licensing and honesty statement

## What data this product contains today

**All clubs, players, managers and fixtures are procedurally generated and fictional.** Names are assembled from syllable pools (`world/names.ts`); any resemblance to real people or clubs is coincidental. No real crests, logos or photographs are bundled; the app draws original crest/avatar graphics.

## Competition rules and qualification slots

The registry (`competition/registry.ts`, `competition/qualification.ts`) encodes the formats the project was asked to support (ten major leagues, domestic cups and super cups, second tiers with promotion/relegation, UCL/UEL/UECL, AFC Champions League Elite and ACL Two, CAF Champions League and Confederation Cup, Concacaf Champions Cup, Copa Libertadores and Sudamericana, OFC Champions League, FIFA Club World Cup).

**These definitions are configured scenario defaults written from the authors' general knowledge. They were not verified against current official regulations in this repository, and every definition carries `verification.status = "unverified-default"` plus a note, which the app displays.** Specifically unverified: exact qualification slot counts per association, tie-breaker orders, the real structure of qualifying rounds (not simulated — vacant places are filled by club reputation), squad-registration limits (including the Saudi Pro League foreign-player cap of 10), financial-regulation ratios, prize money and broadcast pools (labelled scenario estimates, not facts).

The engine does not need to change to make them accurate: replace the data in `registry.ts` / `qualification.ts` with verified, licensed data and bump the rule-set `fromSeason`.

## Real-world data packs

An optional overlay of real club names (bundled, names only) and user-supplied packs (names, coaches, players, local crests) is described in `docs/DATA_PACKS.md`. No logos, player or coach data are bundled; packs are validated as untrusted input and remote crest URLs are refused.

## Integrating a real-world data *provider* (not done)

Before integrating any provider the checklist is: verify fields; verify rate limits and update frequency; verify **commercial and redistribution rights**; cost and operational dependencies; caching and graceful failure. No scraping of restricted sites. No provider is integrated; there is no network dependency at all — the app is fully offline. If a provider is added later it must be consumed through a data-ingestion module that produces the same `WorldState` seed data and is clearly labelled as licensed data, never mixed silently with generated data.

## Privacy and security

* No personal data is collected; no analytics; no network calls. Saves are local (SQLite / IndexedDB) and exportable by the user.
* No API keys or credentials exist in the client. If a licensed data service is added, secrets must live server-side or in the platform secure store (`expo-secure-store`), never in the bundle.
* Save import verifies a checksum and the schema version before accepting a file; unknown future versions are refused.

## Currency and localisation

Money is stored in EUR. Display conversion to SAR uses a fixed, configurable approximate rate and is labelled as such.
