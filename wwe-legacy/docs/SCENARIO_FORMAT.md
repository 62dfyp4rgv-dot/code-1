# Scenario template format (authoring contract)

Scenarios are pure data. A template declares **when** it can happen (trigger), **who** is involved (cast),
**what it looks like** (text + slots), **what the player can do** (choices) and **what changes** (effects).
The engine (`src/story/scenarios.js`) binds the cast from the live world, renders text, applies effects through the
ledger, and enforces repetition prevention. The validator (`src/story/scenarioValidator.js`) checks every template.

Run `node tools/scenarios.js --file src/story/scenarios/<yourfile>.js` until it prints `errors: 0`.
See `src/story/scenarios/core.js` for seven worked examples.

```js
export default [
  {
    id: 'snake_case_unique_id',          // required, unique across the whole library
    category: 'rivalry',                 // one of CATEGORIES (below)
    title: 'A Confrontation in {place}', // may use {slot} and {role.field} tokens
    weight: 2,                           // selection weight (default 1)
    major: false,                        // major scenarios need >= 3 choices
    contexts: ['weekly'],                // when it may fire: weekly (default) | post_match | pre_show | show_day | post_show | offseason
    cooldownDays: 90,                    // min days before this template can repeat (default 90)
    maxPerCareer: 3,                     // max times per career (default 3)
    categoryCooldown: 5,                 // min days between two scenarios of the same category (default 5)
    trigger: { ... },                    // all keys must hold (see Triggers). {} = always eligible when cast can be filled
    cast: { rival: { pick: 'rivalry', minHeat: 20 }, boss: { pick: 'staff', role: 'gm' } },
    memory: { role: 'rival', max: 2 },   // optional: appends lines recalled from the ledger about that role (auto-generated; never invent history yourself)
    slots: { place: ['catering', 'the parking garage', 'the gym'], mood: ['tense', 'heated'] }, // each slot >= 2 values AND must appear in the text as {place}
    body: ['2-3 sentence paragraph. Use {rival.name}, {rival.they}, {rival.them}, {rival.their}.', 'Second paragraph.'],
    choices: [
      { id: 'stand', label: 'Stand your ground', risk: 'med',            // risk: low|med|high (display only)
        requires: { stat: { confidence: { gte: 40 } } },               // optional: option disabled unless this trigger holds
        result: 'Text shown after choosing (use result OR outcomes).',
        effects: [ { pop: 0.4 }, { rel: { who: 'rival', respect: 4 } } ] },
      { id: 'gamble', label: 'Take a risk',
        outcomes: [                                                    // weighted random outcome, seeded; bonus shifts weight by (stat-50)/50 * value
          { weight: 2, bonus: { mic: 0.6 }, text: 'Good result.', effects: [ { pop: 1 } ] },
          { weight: 1, text: 'Bad result.', effects: [ { pop: -0.5 }, { conf: -3 } ] } ] },
    ],
  },
];
```

## Rules for good scenarios
* **Every choice must be a real trade-off.** No choice may be strictly better than all others (the validator warns). Mix risk/reward, short-term/long-term, money/pride/relationships.
* 3-4 choices each (at least 3 when `major: true`). Labels <= 60 chars, start with a verb.
* **Slots create variety**: give every template 2 slot dimensions with 3-4 values each (>= 8 combinations; the engine counts up to 24). Slot values must change the *text* meaningfully (place, occasion, tone, topic), and each slot must be used as `{name}`.
* **Never invent history.** Do not write "last time you beat {rival.first}"; use the `memory` block, or `mem` trigger conditions, so the claim is backed by ledger events.
* **Pronouns**: only `{role.they}`/`{role.them}`/`{role.their}`/`{role.theirs}` (the engine fills them from the wrestler's gender). `{player.name}`, `{player.first}`, `{player.last}`, `{brand}`, `{year}`, `{show}`, `{era}`, `{brokenPromise}`, `{openPromise}` also exist. Do not name real wrestlers - use roles.
* **Era realism**: podcasts need `minYear: 2008`, social media `minYear: 2010`, streaming/PLE language `minYear: 2014`. Pre-1993 there is no Raw. Use `era: [...]` (golden, new_generation, attitude, ruthless, pg, reality, modern, current) when flavour is era specific.
* Keep it workplace-appropriate: no slurs, no sexual content, no real-life scandals, no real people. Kayfabe-style rivalry, backstage politics, media and business are fine.
* Text: concrete and specific, 2-3 sentences per body paragraph; vary sentence openings; no clichés like "little did they know".

## CATEGORIES
debut, breakout, rivalry, betrayal, alliance, faction, championship, injury, recovery, media, podcast, press, contract, rumble, wrestlemania, comeback, retirement, legacy, personal, opportunity, creative, backstage, mentor, finance, fans, training, travel, social

## Triggers (all listed keys must hold; combine with all/any/not)
`era:[ids]`, `minYear`, `maxYear`, `month:[1-12]`, `alignment:['face','heel','tweener']`, `style:[...]`, `gender:['M','F']`, `brand:['Raw','SmackDown','NXT','WWF']`, `background:['prospect','indie','international','established']`,
`stat:{ name: {gte,lte,gt,lt} }` with names: popularity confidence fatigue money overall matches wins losses winStreak loseStreak titleWins titlesHeld defenses rating careerYears mic charisma promos injuries daysChampion mainEvents pleMatches rumbleEntries,
`recent:{lossesGte:n | winsGte:n}` (last 5 matches), `injured:true|false`, `serious:true|false`, `holdsTitle:true|false`, `flag:'name'` / `noFlag:'name'` (story flags set by effects),
`daysSince:{match|promo|scenario:{gte}}`, `rivalry:{minHeat:n}` or `{none:true}`, `promise:'open'|'broken'|'none'`, `contract:{lte:daysLeft}`,
`event:'ple'|'weekly'|'wrestlemania'|'royal_rumble'|'summerslam'|...` (what is on the card today), `eventWithin:{kind:'ple'|id:'wrestlemania',days:n}` (calendar look-ahead),
`mem:[{role, betrayal:true | tag:'insulted_by' | respectGte:n | trustLte:n | heatGte:n | h2h:{winsGte,lossesGte,matchesGte}}]` (needs that role in `cast`).

## Cast roles (`cast: { roleName: { pick: ... } }`) - the scenario is skipped if a role cannot be filled
* `{pick:'rivalry', minHeat:15, status:'active'}` the hottest rival
* `{pick:'obligation', kind:'confront_backstage'|'answer_challenge'|'seek_revenge'|'grudge_rematch'}` someone whose due obligation (created by the memory rules) is waiting - these are prioritised
* `{pick:'tag', tag:'ally'|'mentor'|'respected_by'|'insulted_by'|'humiliated_by'|'betrayal'|'studying_you'|'alliance_possible'|'reconciled'|'reluctant'}` anyone the player has that relationship tag with
* `{pick:'champion', class:'world'|'secondary'|'tag'|'womens'|'developmental'}`
* `{pick:'roster', tier:{gte:0,lte:4}, sameBrand:true, gender:'F', alignment:'heel'|[..], style:'brawler'|[..]}` someone from the roster (tier 0 prospect .. 4 legend)
* `{pick:'staff', role:'agent'|'creative'|'gm'|'trainer'|'doctor'|'executive'|'owner'|'coach'|'producer'}` consistent named staff member (non-wrestler)
* `{pick:'media', kind:'reporter'|'host'|'fan'|'journalist'|'commentator'|'interviewer'}` a named media person (non-wrestler)

## Effects (list of single-key objects; each limited by validator safety ranges)
* Player state: `{pop: n}` (±6 max, normal 0.2-1.5), `{conf: n}` (±25), `{fatigue: n}` (±40), `{money: n}` (-100000..250000), `{mic: n}` / `{charisma: n}` (±3), `{attr:{name:'technical', delta:1}}` (±3), `{injury:{part:'head'|'torso'|'arms'|'legs', severity:1|2, days:n}}`, `{brand:'Raw'}`, `{contract:{years:0.5-6, salary:10000-10000000, brand?}}`
* Relationships (all remembered, replayable): `{rel:{who:'rival', trust, respect, fear, heat, affinity, mutual:true}}` (how *they* feel about the player; ±50, heat ±45), `{rivalry:{who:'rival', heat:±45}}`, `{tag:{who:'rival', tag:'ally'}}`, `{obligation:{kind:'confront_backstage'|'answer_challenge'|'seek_revenge'|'grudge_rematch', who:'rival', inDays:7}}`
* Promises (public, judged by rules later): `{promise:{kind:'win_match'|'win_title'|'win_rumble'|'retain_title'|'win_streak', who:'rival', text:'I will ...', params:{year:2025}|{n:5}|{defenses:3}, deadlineDays:120}}`
* Matches: `{booking:{who:'rival', type:'singles'|'no_dq'|'submission'|'last_man'|'iron_man'|'ladder'|'cage'|'hell_cell'|'tag', stakes:'title'|null}}` forces the next match
* Flags: `{flag:'name'}` / `{clearFlag:'name'}` (use with trigger `flag`/`noFlag` to chain scenarios)
* Typed ledger events: `{event:{type, participants:['role'], summary:'text', importance:1-5, data:{...}}}` with type one of
  betrayal, alliance_formed, faction_formed (data:{factionId,name,leader,leaderIsPlayer:true}), faction_joined, faction_left (data:{factionId,member}), mentorship (data:{byPlayer:true|false}), reconciliation (data:{formerRival:true}), brand_transfer,
  podcast / press_conference / interview / social_post (data:{quality:{base,mic,charisma,conf,pop,noise}, viral:{minQuality,chance}, controversy:true, handled:true}), confrontation (data:{won,physical:false,major:true}), promo_delivered, refusal_to_help, retirement, goal_set, decision.
  `quality` objects are evaluated to a 1-99 number from the player's stats plus noise; `viral:{minQuality:85,chance:.4}` rolls once. A `"@role"` string inside data is replaced by that role's id.
* `{note:'text'}` a short extra line shown with the result.

## Additions (round 6)
- **Role tokens inside slot values**: a slot value may contain `{role.they}`, `{role.them}`, `{role.their}`, `{role.theirs}` etc.; resolved one level deep. Use them for any pronoun that refers to a wrestler cast member (cast picks `roster`, `rivalry`, `tag`, `champion`, `obligation`); only crowds, staff, media and fans take literal singular-they.
- **Fans**: a cast `media` pick with `kind: 'fan'` is introduced without an outlet suffix.
- **Surname preference**: `roster` and `tag` picks prefer candidates whose surname differs from the player and from anyone already cast; they fall back to the full pool if that leaves nobody.
- **Memory callbacks**: `noAutoMemory: true` disables the auto-attached callback; `memory.noResults` forbids win/loss tally callbacks; `memory.allow` restricts callback kinds. Tally callbacks are never used in emotional categories (personal, mentor, alliance, betrayal, faction, injury, recovery, retirement, legacy, fans, finance, travel).
