# Real-world data packs

The simulation generates a fictional universe. A **data pack** overlays real-world names and (optionally) crest images on it. Nothing about how the game is simulated changes.

## What is bundled, and what is not
* **Bundled:** `REAL_CLUB_NAMES` (`packages/engine/src/data/realClubNames.ts`): club names, short codes and cities for ENG, ESP, ITA, GER, FRA, SAU, POR, NED, BRA and USA (MLS) top flights, listed strongest-first. Compiled from general public knowledge for the 2025/26 season; **not verified** against an official source.
* **Bundled, optional, unverified:** `REAL_CLUBS_WITH_SQUADS` (`src/data/realSquads.ts`): the same clubs plus a head coach and a first-team core (12-14 players, best first, with nationality and approximate birth year) for about 30 well-known clubs, written from the authors' memory of the 2025/26 season. Transfers, coaching changes and birth years may be wrong or outdated. No ratings are included: attributes stay generated and are matched by list order.
* **Not bundled:** logos/crests, photographs, ratings, wages, fixtures, finances, and squads for the other clubs. Logos and likenesses are trademarked/licensed (clubs, leagues, FIFPRO, game-data companies), so the app instead lets you import your own image files as crests (matched to clubs by filename); you are responsible for having the right to use them.
* Reasons: the project's rule is not to fabricate current player attributes or club data, and not to ship third-party marks it has no licence for. You can still get a fully real-named game by supplying a pack you have the right to use.

## How a pack is applied
* Clubs of a league are matched to generated clubs by strength order (the pack lists a league's clubs strongest-first): the strongest generated club gets the first pack club. Club strength therefore comes from the generator, not from the real club's real strength.
* Pack players replace generated players of the same position, matched by rating order. An optional `overall` (1–99) rescales that player's generated attributes; it is **your own estimate**, not an official rating. Nationality changes are skipped when they would break the league's foreign-player limit.
* Whatever a pack does not cover stays generated (and fictional). `world.dataPack.applied` stores counts of clubs, players, managers and crests applied, and the app shows them.
* Packs are untrusted input: size limits, validated strings/numbers, reserved property names refused, **remote crest URLs refused** (crests must be `file://…`, `asset:…` or a `data:image/png|jpeg|webp;base64,…` URI up to 300 KB). Saves re-validate crests on load.

## Format (version 1)
```json
{
  "format": "football-universe-data-pack", "version": 1,
  "id": "my-pack", "name": "My pack", "source": "where the data came from", "licence": "your rights to use it",
  "leagues": {
    "ENG1": [
      {
        "name": "Example United", "shortName": "EXU", "city": "Exampleton", "colors": ["#aa0000", "#ffffff"],
        "stadium": { "name": "Example Park", "capacity": 45000 },
        "crest": "file:///path/to/crest.png",
        "manager": { "name": "Jo Coach", "nationality": "ENG", "birthYear": 1970 },
        "players": [ { "name": "A. Player", "position": "ST", "nationality": "ENG", "birthYear": 2001, "overall": 77 } ]
      }
    ]
  }
}
```
League ids are those of the registry (`ENG1`, `ESP1`, `SAU1`, …). Positions: GK CB LB RB DM CM AM LW RW ST.

## Build a pack from CSV
`npx tsx packages/engine/tools/pack-from-csv.ts --clubs clubs.csv --players players.csv --out my.pack.json --id my-pack --name "My pack" --source "…" --licence "…"` (column layout in the file header). Import the result in the app's New career screen.

## Your responsibility
You are responsible for having the right to use any names, ratings and images you put in a pack. The project does not ship, license or endorse them, and the app labels the game as using an unofficial data pack.
