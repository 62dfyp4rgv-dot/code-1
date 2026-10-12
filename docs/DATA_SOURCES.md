# Data sources, provenance and uncertainty

No internet research was performed during development of the numeric tables; values are **rounded approximations
from the authors' background knowledge of public statistics around 2023–24** and are *not* citations of a specific
dataset edition. They are tuned for plausibility and playability, not for use as reference data. Where a figure matters
for a real-world conclusion, consult the original source (IMF WEO, World Bank WDI, SIPRI, UN WPP, EIA/IEA, Natural Earth).

| Data | File | Provenance | Status |
|---|---|---|---|
| Country outlines & borders | `app/data/map.json` (built by `tools/build-map.mjs`) | Natural Earth 110m via npm `world-atlas@2.0.2` (public domain / ISC packaging). Territories GRL, PRI, FLK, NCL, ESH, CYN, SOL folded into parents; 110m generalisation omits micro-states | **Verified source**, simplified geometry; disputed borders are drawn as in the source and imply no political position |
| Strategic regions (681) | `map.json` | **Derived**: per-country k-means on a 0.5° raster | Synthetic; names generated (`names.js`) |
| Sea zones (53) | `map.json` | **Hand-seeded** points + flood fill | Approximate |
| Terrain | `map.json` | **Hand-authored** coarse boxes (mountain/desert/jungle/forest/plain/arctic/urban) | Approximate; not DEM-derived |
| Population, GDP, military share, troops, nuclear status, democracy index, government type | `countries.csv` | Rounded ~2024 approximations | Approximate; some values estimated for small states; `dem` is an authors' 0–100 index, not a published one |
| Capitals, coordinates | `countries.csv`, `cities.csv` | Common knowledge (180 largest/strategic cities, rounded) | Approximate |
| Oil/gas/minerals world shares (%) | `resources.csv` | Rounded approximations of production/reserve shares | Approximate; "minerals" is an aggregate of strategic minerals |
| Industry/tech share, clean electricity, current account, debt, investment, fertility, military tech index | `econ_profiles.json` | Overrides for ~35 major economies, approximate; everything else **derived by formula** from income level/region (flagged `derived` in code) | Mixed |
| Alliances and organisations | `orgs.json` | 14 organisations with approximate memberships and rules (**simplified**: e.g. no observer/partner statuses) | Approximate |
| Rivalries, territorial claims, chokepoints | `geopolitics.json`, `chokepoints.json` | Authors' summary of widely known disputes; weights are **gameplay values**, not assessments | Judgement |
| Technologies, effects, costs | `techs.psv` | **Original design** inspired by real technology areas | Fictional/gameplay |
| National projects | `projects.json` | **Original** design; costs and effects are gameplay values | Fictional/gameplay |
| Events | `events.json` | **Original** text and effects; thresholds are gameplay values | Fictional |
| Leaders, parties, personalities | generated | **Fictional**; no real person is depicted | Fictional |
| Cities in UI, flags | — | Flags are *not* used; each nation has a coloured monogram emblem | Original |

## Uncertainty and use
- Initial conditions describe an *approximate* early-2025 world. The sim then diverges by design; it is a game model, not a forecast.
- Elasticities, TFP growth, war-combat constants and diplomacy weights are calibrated to produce plausible long-run behaviour (see
  `BALANCE_REPORT.md`) and are **not** empirical estimates.
- Any resemblance to current events (e.g. the scenario war in Eastern Europe) reflects the scenario premise, not prediction.
- If you contribute data, record: source, access date, rounding, and whether the value is verified or derived.
