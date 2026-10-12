# Player career simulation ("Career Reveal")

`simulateCareer(input, onSeason?)` (`packages/engine/src/career.ts`) plays a single player's whole career.

**Engine-driven:** the player is generated with the engine's attribute/ceiling model, develops weekly with `developPlayerWeek` (age curves, decline), retires with `retirementProbability`, is valued by `marketValue`, and every league, cup and continental match he plays is a full `simulateMatch` run with his real attributes in the line-up (goals, assists, ratings, minutes, injuries come from the match events).

**Game by game:** every match of every season is logged (opponent by name, home/away, score, penalties, minutes, goal minutes, assists, rating, cards, injury) from the engine's match events, and shown live as a ticker; the career card has highlights (first goal, hat-tricks, scoring runs, finals, best game, injuries) and a full per-season match log.

**Decisions (manual mode; auto-pilot answers every one with a default):** training focus each year (extra growth for physical / technical / mental / position attributes; physical adds injury risk), tactical role at each club (changes the player's role in the engine's line-up), set-piece duties (adds the engine's penalty-taker / set-piece traits), captaincy, injury handling (full rehab or play through with a setback risk), playing time (fight, loan, transfer request), press rows (image), contract talks (long / standard / short / explore), and transfer windows. Wages and earnings are modelled from the engine's valuation. Same choices give the same career.

**Choices:** the first club, the national team and, in manual mode, every transfer window (offers: good fit / step up / dream move / new league, with role, club level, fee and European football) are the player's. Same choices give the same career.

**National team and World Cup:** 49 scenario nations with starter levels (unofficial estimates). Call-ups depend on rating vs the nation's level; World Cup (every 4th season, with a qualification chance) and continental championships (every 4th season, offset by 2) are played as full matches: groups then knockouts. Tournament awards: Golden Boot, Golden Ball / Player of the Tournament, Best Young Player, Golden Glove.

**Personal awards and Ballon d'Or:** league Golden Boot, Player / Young Player of the Season, Team of the Season, Golden Glove, and a Ballon d'Or score (rating, output for the position, form, fitness, team success) compared with 30 simulated rivals each season. Fixed during this round: every career used identical random streams for the same match tags, so careers were correlated (World Cup outcomes clustered); match seeds are now unique per career. Calibration sample after the fix: a wonderkid of a top nation wins about 15% of World Cups, ~30% reach the final; 12/80 wonderkids won a Ballon d'Or. Earlier sample: 40 wonderkids (ceiling ~88) won at least one Ballon d'Or in ~30% of careers (max 4), about 12% of World Cup appearances by top nations ended in a win; 'fate' careers essentially never win it. These are sanity checks against my expectations, not real-world statistics.

**Modelled on top (not full simulation):** other clubs' league results (Poisson, calibrated to the engine's home/away goal rates); club strength from league quality and the club's rank in the real-name list; transfers, loans and contracts by simple rules (no boomerang moves within 3 seasons); international caps; awards from season numbers. Clubs/competitions use the unofficial real-name overlay as plain text. All outcomes are fictional.

Measured on 60 careers (script in the session, not committed): ~1.9 s per career in Node; career length median 19 seasons, retirement age median 34; peak overall median 59 (p90 68) for a hidden-ceiling median of 63; strikers' career goals median ~107 (p90 ~181); ~33% of careers win nothing. These are sanity checks against the engine's own ranges, not a validation against real-world data.

The web reveal (`tools/career-worker.ts` bundled with esbuild into a Web Worker, plus a single HTML page) is published as a private artifact; it is not part of the Expo app.
