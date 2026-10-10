# Player career simulation ("Career Reveal")

`simulateCareer(input, onSeason?)` (`packages/engine/src/career.ts`) plays a single player's whole career.

**Engine-driven:** the player is generated with the engine's attribute/ceiling model, develops weekly with `developPlayerWeek` (age curves, decline), retires with `retirementProbability`, is valued by `marketValue`, and every league, cup and continental match he plays is a full `simulateMatch` run with his real attributes in the line-up (goals, assists, ratings, minutes, injuries come from the match events).

**Modelled on top (not full simulation):** other clubs' league results (Poisson, calibrated to the engine's home/away goal rates); club strength from league quality and the club's rank in the real-name list; transfers, loans and contracts by simple rules (no boomerang moves within 3 seasons); international caps; awards from season numbers. Clubs/competitions use the unofficial real-name overlay as plain text. All outcomes are fictional.

Measured on 60 careers (script in the session, not committed): ~1.9 s per career in Node; career length median 19 seasons, retirement age median 34; peak overall median 59 (p90 68) for a hidden-ceiling median of 63; strikers' career goals median ~107 (p90 ~181); ~33% of careers win nothing. These are sanity checks against the engine's own ranges, not a validation against real-world data.

The web reveal (`tools/career-worker.ts` bundled with esbuild into a Web Worker, plus a single HTML page) is published as a private artifact; it is not part of the Expo app.
