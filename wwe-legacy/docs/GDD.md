# Game Design Document — WWE Legacy

## Pillars

1. **Every decision in the ring matters.** Matches are interactive: each round you pick from 6–12 context-sensitive actions, the opponent answers, and position, body-part damage, stamina, momentum, crowd, referee and phase all change what is possible and what is wise.
2. **The world remembers.** Betrayals, broken promises, insults, respect and rivalries are recorded as immutable events, change relationships through explicit rules, and come back later as dialogue, interview questions, scenarios and consequences.
3. **Your career is a record you can open.** Every number in the Career Record Book and every achievement opens to the events that produced it.
4. **A living business.** The roster, titles, feuds and alliances move on without you; arrivals, retirements and champions change over the years.
5. **Pick up and play on a phone.** Short sessions, autosave, offline, big tap targets.

## Core loop

`Home` → train / rest / advance days → show day → pick opponent (title shots, forced scripted matches, rivals) → prepare (game plan, entrance, stipulation) → match (decisions) → result → post-match choice (celebrate, respect, ambush, promo…) → consequences in the ledger → story situations → repeat. Premium events and the Royal Rumble punctuate the calendar; media appearances (promo, interview, podcast, press conference) shape reputation and create promises the world will judge.

## Character

Name, gender, alignment (face/heel/tweener), style (7 styles), background (4), start year/era, attribute budget (power, striking, grappling, technical, agility, endurance, toughness, psychology + mic, charisma), entrance, signature and finishing moves from templates. Attributes grow from use; popularity grows slowly with diminishing returns (careers take years to peak); fatigue, confidence, injuries and money are tracked.

## Match system

- **Sequence**: attacker chooses → defender sees the move family and picks a stance (block, dodge, reverse, counter-strike, brace, protect, sell, fight back, bait, distance, counter-special, roll away) → resolution.
- **State**: position (standing, grounded, corner, ropes, apron, outside, top), four body parts of damage, stamina, momentum, confidence, crowd heat and bias, referee state (watching / down / distracted), phase (opening, building, closing), tactics (pace, target, study, bait).
- **Finishing**: pin counts with kickout odds depending on the last impact; submissions escalate through hold pressure and escape/reversal choices; ropes break holds where the rules allow; DQ, count-outs, ten counts, ladder and cage objectives, iron-man falls and tag legality are rule-driven.
- **Rulesets**: singles, tag, submission, no-DQ, last man standing, iron man, ladder, cage, Hell in a Cell, triple threat, fatal four-way, elimination, Elimination Chamber, TLC, Money in the Bank (4-way ladder, PLE days), battle royal (6, over-the-top eliminations), handicap (1 vs 2, player as the lone wrestler); plus a 30-man Royal Rumble.
- **Rating**: 0–5★ computed from near falls, reversals, variety, pacing and peak heat.

## Story and media

Data-driven scenarios (327 authored templates in 27 categories; thousands of generated slot combinations) fire from triggers on world state and history. Promos, interviews, podcasts and press conferences ask questions built from your actual record and let you answer in different stances; guarantees become promises the world will keep or break.

## Universe

Weekly shows by brand and era, premium live events, singles and secondary titles with lineage validation, feuds, alliances, betrayals, turns, injuries, releases, retirements and debuts. Historical mode uses approximate real-name rosters (flagged unverified); modern and custom modes use generated fictional rosters. Fictional results are never presented as real history.

## Progression and rewards

Training and matches grow attributes; popularity unlocks bigger bookings, title shots and stipulations (rivalry heat unlocks no-DQ, submission, iron man, last man, ladder, cage, hell cell); 196 achievements (11 secret, 8 era-gated); records held by the player are tracked against approximate benchmarks.

## Platform

iPhone-first PWA (installable, offline), also usable on desktop browsers. Three save slots plus autosave. Four text sizes, light/dark/system themes.

## Out of scope / not implemented (see `FEATURE_STATUS.md`)

Native iOS build, elimination chamber / TLC / MITB / battle royal / three-way matches, tag-team championships, a social-media simulation, a custom-universe editor, deep finances, a Hall of Fame pipeline, and verified historical data.
