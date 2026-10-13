// New scenarios (set E): comeback, retirement, legacy, travel, training, finance, personal. Eight each, ids prefixed ne_.
export default [
  // ======================= COMEBACK =======================
  {
    id: 'ne_cbk_first_walkout', category: 'comeback', title: `The First Walk Back After {layoff}`, weight: 2.5, major: true, contexts: ['pre_show', 'show_day'], cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 8,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { injured: false, stat: { careerYears: { gte: 1 } }, daysSince: { match: { gte: 60 } }, noFlag: 'ne_walked_back' },
    slots: { layoff: [`a torn knee`, `a neck fusion`, `eight months of surgery and rehab`, `a long leave from the business`], feeling: [`your hands will not stay still`, `your knees feel like borrowed ones`, `your mouth has gone completely dry`] },
    body: [`Behind the curtain the monitor shows a full building, and all you can think about is the {layoff} it took to stand in this spot. {agent.name} is at your shoulder holding a clipboard, giving you the quiet nod of someone who has watched many people take this walk.`, `Your music is about to hit, and {feeling}. The curtain is only a sheet of black fabric, but it has never looked so much like a door.`],
    choices: [
      { id: 'savor', label: `Let the music play a full verse before you move`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: `You wait, and the building does the rest. By the time you step through, the noise has had a long moment to build, and it hits you like warm water.`, effects: [{ pop: 0.9 }, { conf: 5 }, { fatigue: 4 }, { flag: 'ne_walked_back' }] },
        { weight: 1, text: `You wait a beat too long, the track loops and the crowd's roar thins into a confused murmur. The walk down the ramp is all awkward steps and forced smiles.`, effects: [{ pop: 0.1 }, { conf: -2 }, { fatigue: 4 }, { flag: 'ne_walked_back' }] } ] },
      { id: 'rush', label: `Walk out fast before the nerves can catch up`, risk: 'low', result: `You are through the curtain and halfway down the ramp before fear can find you. The reception is warm but blurry, and you reach the ring breathless and a little cheated of the moment.`, effects: [{ pop: 0.3 }, { conf: 2 }, { fatigue: 7 }, { flag: 'ne_walked_back' }] },
      { id: 'agent_walk', label: `Ask {agent.first} to stay with you until the last second`, risk: 'low', result: `{agent.first} keeps a steady hand on your shoulder and says nothing at all, which is exactly right. At the cue you step forward lighter than you expected, and the favour will not be forgotten.`, effects: [{ pop: 0.3 }, { conf: 3 }, { flag: 'ne_walked_back' }] },
      { id: 'tears', label: `Let it show: walk out with the tears and all`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.6 }, text: `You do not wipe your face and you do not hide it. A hush rolls through the seats, then a standing ovation, and for a minute the whole building is on your side.`, effects: [{ pop: 1.2 }, { conf: 4 }, { fatigue: 8 }, { flag: 'ne_walked_back' }] },
        { weight: 1, text: `It feels like too much too soon, and you spend the walk aware of every camera. The pop is polite, and the match that follows begins on shaky legs.`, effects: [{ pop: 0.2 }, { conf: -3 }, { fatigue: 8 }, { flag: 'ne_walked_back' }] } ] },
    ],
  },
  {
    id: 'ne_cbk_night_after', category: 'comeback', title: `The Night After the Big Pop`, weight: 2, contexts: ['pre_show', 'post_match'], cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 8,
    cast: { opp: { pick: 'roster', tier: { lte: 3 }, sameBrand: true } }, memory: { role: 'opp', max: 1 },
    trigger: { flag: 'ne_walked_back', noFlag: 'ne_after_done' },
    slots: { venue: [`a half-sold arena in a college town`, `a house show in a hockey rink`, `a small-city civic center with sticky floors`], worry: [`the first hard bump`, `the third minute, when the adrenaline drains away`, `the moment someone grabs you the wrong way`] },
    body: [`Last night was a movie. Tonight is {venue}, a sleepy crowd, and {opp.name} standing across from you with a smile that suggests the plan for the match is already in {opp.their} head.`, `The comeback story is over and the regular job has resumed, which is a different test. What you keep returning to is {worry}, and whether your body will lie to you when it arrives.`],
    choices: [
      { id: 'tell_opp', label: `Tell {opp.first} exactly what you are afraid of`, risk: 'low', result: `{opp.first} listens, nods and rebuilds the match around your comfort without making a face. The result is plain and careful, and the trust you feel afterward is worth more than the applause.`, effects: [{ rel: { who: 'opp', trust: 8, affinity: 4 } }, { conf: 2 }, { pop: -0.1 }, { flag: 'ne_after_done' }, { clearFlag: 'ne_walked_back' }] },
      { id: 'prove', label: `Go full speed to prove last night was no fluke`, risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.5 }, text: `You throw yourself into everything and nothing complains. It is the best match of your month in front of a crowd that did not deserve it, and you drive home grinning.`, effects: [{ pop: 0.8 }, { conf: 5 }, { fatigue: 11 }, { flag: 'ne_after_done' }, { clearFlag: 'ne_walked_back' }] },
        { weight: 1, text: `A landing goes wrong and your leg buckles with a sharp, familiar sting. You finish the match, but the ice pack on the drive home tells you what you did not want to hear.`, effects: [{ conf: -4 }, { fatigue: 11 }, { injury: { part: 'legs', severity: 1, days: 10 } }, { flag: 'ne_after_done' }, { clearFlag: 'ne_walked_back' }] } ] },
      { id: 'safe_book', label: `Work the match around moves you trust completely`, risk: 'low', result: `You hit your marks, avoid every gamble and leave the ring without a single twinge. It is a forgettable match by design, and the empty seats do not complain.`, effects: [{ pop: -0.3 }, { conf: 1 }, { fatigue: -3 }, { flag: 'ne_after_done' }, { clearFlag: 'ne_walked_back' }] },
      { id: 'ask_notes', label: `Ask {opp.first} for brutally honest notes afterward`, risk: 'med', result: `{opp.first} tells you over a vending-machine coffee that your timing is half a beat late on everything. It stings, and it is the most useful thing anyone has said since you came back.`, effects: [{ attr: { name: 'technical', delta: 1 } }, { rel: { who: 'opp', respect: 5 } }, { conf: -2 }, { fatigue: 5 }, { flag: 'ne_after_done' }, { clearFlag: 'ne_walked_back' }] },
    ],
  },
  {
    id: 'ne_cbk_spot_filled', category: 'comeback', title: `Someone Else Is Working {spot}`, weight: 2, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 8,
    cast: { rook: { pick: 'roster', tier: { lte: 2 }, sameBrand: true }, creative: { pick: 'staff', role: 'creative' } }, memory: { role: 'rook', max: 1 },
    trigger: { injured: false, stat: { careerYears: { gte: 2 } }, daysSince: { match: { gte: 60 } } },
    slots: { spot: [`your old slot before the main event`, `the segment that used to open the show`, `the television match you were built around`], mood: [`the crowd has grown to like it`, `the numbers did not drop a point`, `it will not be undone overnight`] },
    body: [`A card needs a body in every slot, and in your absence {rook.name} was handed {spot}. {creative.name} walks you through it with the careful tone of someone defusing a bomb, explaining that {mood}.`, `Nobody did anything wrong, which is the problem. There is no villain here, only a gap that closed over like water.`],
    choices: [
      { id: 'demand', label: `Demand the spot back`, risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.5, popularity: 0.3 }, text: `You make the case flatly and without raising your voice. {creative.first} looks at the numbers, looks at you, and says the slot is yours again by next week.`, effects: [{ pop: 0.5 }, { conf: 4 }, { rel: { who: 'rook', respect: -4 } }] },
        { weight: 2, text: `The request lands as entitlement. {creative.first} writes something on a notepad that you suspect is your name followed by the word difficult.`, effects: [{ pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'share', label: `Offer to share the segment with {rook.first}`, risk: 'low', result: `The two of you build a segment that gives {rook.first} the heat and you the finish. It is a generous, slightly bruising compromise, and {rook.first} will tell people about it for years.`, effects: [{ rel: { who: 'rook', trust: 6, affinity: 5 } }, { pop: -0.1 }, { conf: -1 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'earn_back', label: `Take a lesser slot and work your way back up`, risk: 'low', result: `You accept the smaller role and work it like it matters. The crowd cares less, the office notices more, and you quietly build a ledger of patience that you plan to cash later.`, effects: [{ pop: -0.2 }, { conf: -3 }, { fatigue: 5 }] },
      { id: 'feud', label: `Pitch a feud with {rook.first} for the spot`, risk: 'med', result: `{creative.first} sits up straight at the word feud and starts sketching on the back of a rundown sheet. The pitch makes two careers more interesting, and it also makes one of them a target.`, effects: [{ rivalry: { who: 'rook', heat: 12 } }, { pop: 0.5 }, { rel: { who: 'rook', respect: 2, heat: 6 } }, { fatigue: 4 }] },
    ],
  },
  {
    id: 'ne_cbk_restrictions', category: 'comeback', title: `Cleared, With a List`, weight: 2, cooldownDays: 200, maxPerCareer: 3, categoryCooldown: 8,
    cast: { doctor: { pick: 'staff', role: 'doctor' } },
    trigger: { injured: false, stat: { injuries: { gte: 1 } }, daysSince: { match: { gte: 25 } } },
    slots: { limit: [`no top-rope work for six weeks`, `no hard bumps on your back for a month`, `no more than ten minutes in the ring per night`], tone: [`in the voice of a pilot reading a safety card`, `with a patience that suggests this speech has been ignored before`, `while rubbing a tired eye`] },
    body: [`{doctor.name} signs your clearance form {tone}, then slides a second sheet across the desk. The line at the top reads {limit}.`, `You have been waiting months to hear you can work again, and now the permission arrives with conditions. Everyone in the room understands that the match card will not adjust itself to your list.`],
    choices: [
      { id: 'obey', label: `Follow the list to the letter`, risk: 'low', result: `You hand the sheet to the agent and the agents shape your matches around it. The crowd gets a quieter version of you, and your body gets to keep its promises.`, effects: [{ pop: -0.3 }, { conf: -2 }, { fatigue: -6 }] },
      { id: 'lobby', label: `Argue that the list is too cautious`, risk: 'high', outcomes: [
        { weight: 2, bonus: { toughness: 0.3, confidence: 0.4 }, text: `{doctor.first} sighs, studies your scans again and crosses out one line with a pen. It is a concession and a warning in the same stroke.`, effects: [{ pop: 0.3 }, { conf: 3 }] },
        { weight: 1, text: `The argument makes {doctor.first} flag you as a patient who will not listen. Two weeks later a strain flares exactly where the list said it might.`, effects: [{ conf: -4 }, { injury: { part: 'torso', severity: 1, days: 9 } }] } ] },
      { id: 'hide', label: `Say nothing to the agents and quietly ignore the list`, risk: 'high', result: `You work the way you always have and keep the sheet in your bag. The matches are better than the ones the list would have allowed, and each landing carries the quiet weight of a secret.`, effects: [{ pop: 0.5 }, { fatigue: 9 }, { conf: -2 }] },
      { id: 'story', label: `Turn the limit into part of the character`, risk: 'med', result: `You sell the restriction as a story, a wounded fighter forced to be smart, and the crowd leans in. It takes extra effort and some acting, but the limits become a hook instead of a cage.`, effects: [{ charisma: 1 }, { pop: 0.4 }, { fatigue: 5 }, { conf: 1 }] },
    ],
  },
  {
    id: 'ne_cbk_pitch_return', category: 'comeback', title: `Pitching Your Own Return`, weight: 1.5, cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 8,
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { injured: false, stat: { popularity: { gte: 20 } }, daysSince: { match: { gte: 75 } } },
    slots: { idea: [`a surprise attack from behind in the middle of a main event`, `a long, quiet apology into the microphone`, `a silent walk to the ring in street clothes`, `a vignette filmed in the hospital where you recovered`], deadline: [`by Friday`, `before the taping`, `by tomorrow morning`] },
    body: [`The company wants a story for your return, and {creative.name} wants an answer {deadline}. The first idea on the table is {idea}, delivered with the enthusiasm of someone who has been sitting on it for weeks.`, `It is your name and your body, but it is not your show. How you come back will be remembered longer than any single match you work afterward.`],
    choices: [
      { id: 'accept', label: `Say yes to the idea as written`, risk: 'low', result: `You commit, rehearse twice and trust the process. The return lands the way it looked on paper, polished and effective and slightly less yours than you hoped.`, effects: [{ pop: 0.6 }, { conf: -1 }] },
      { id: 'counter', label: `Counter with a pitch of your own`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.4 }, text: `You talk for ten minutes with no notes, and {creative.first} writes down half of it. The final version is strange, personal and unmistakably yours.`, effects: [{ pop: 0.9 }, { conf: 4 }, { mic: 1 }] },
        { weight: 1, text: `Your idea sounds better in your head than in the room. {creative.first} politely folds it into the original, and nobody leaves satisfied.`, effects: [{ pop: 0.2 }, { conf: -3 }] } ] },
      { id: 'no_angle', label: `Ask to simply walk out and wrestle with no story`, risk: 'low', result: `You do the plainest thing possible, and the crowd supplies its own drama. It is honest and understated, and the office files you under reliable rather than exciting.`, effects: [{ pop: 0.1 }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'wait', label: `Ask to hold the return until a bigger show`, risk: 'med', result: `The delay costs you weeks of pay and a stretch of nervous waiting at home. When the date arrives it has the sort of event buzz that a random Tuesday would never have.`, effects: [{ money: -2500 }, { fatigue: -8 }, { pop: 0.5 }, { conf: -1 }] },
    ],
  },
  {
    id: 'ne_cbk_kept_bag', category: 'comeback', title: `The Crew Kept Your {item}`, weight: 1.5, contexts: ['pre_show', 'show_day'], cooldownDays: 300, maxPerCareer: 1, categoryCooldown: 8,
    trigger: { injured: false, stat: { careerYears: { gte: 2 } }, daysSince: { match: { gte: 45 } } },
    slots: { item: [`ring jacket`, `worn knee brace`, `hand-lettered entrance sign`, `towel with your initials`], place: [`the back of the equipment truck`, `a road case with your name taped on it`, `a locker behind the stage`] },
    body: [`Nobody asked them to, but the ring crew chief kept your {item} safe all the time you were gone. He pulls it out of {place} without a word and holds it out like a man returning a library book.`, `The crew sets up the ring, tears it down and travels in the dark hours, and you rarely see them except as hands on a rope. Someone out here still thought you were coming back.`],
    choices: [
      { id: 'cash', label: `Slip the crew an envelope as thanks`, risk: 'low', result: `The chief takes it with the faint embarrassment of a man who did not do it for money, then hands it to the youngest hand to split. Word spreads fast, and the ring ropes feel a little tighter on your next night.`, effects: [{ money: -500 }, { conf: 2 }, { pop: 0.1 }] },
      { id: 'pizza', label: `Buy dinner for the whole crew after the show`, risk: 'low', result: `Forty slices of pizza and a long table of tired people make the best photograph nobody takes. For one night you are one of the crew, and it is the happiest you have been all month.`, effects: [{ money: -220 }, { conf: 4 }, { fatigue: 3 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'wear', label: `Wear it out to the ring tonight`, risk: 'med', result: `The crowd does not know what the {item} means, but the crew does, and a few of them stop work to watch you go by. The moment is private and enormous, and you walk to the ring with something steadier in your chest.`, effects: [{ pop: 0.4 }, { conf: 5 }, { fatigue: 2 }] },
      { id: 'ask', label: `Ask the chief what the room was like while you were gone`, risk: 'med', result: `He tells you plainly: it was quieter, nobody sang the old songs on the road and someone cried once in the truck. The truth is a gift and a weight, and you carry both into the building.`, effects: [{ conf: -2 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 3 }] },
    ],
  },
  {
    id: 'ne_cbk_fan_waited', category: 'comeback', title: `A Fan Who Never Left`, weight: 1.5, contexts: ['weekly', 'show_day', 'post_show'], cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 8,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { injured: false, stat: { popularity: { gte: 15 } }, daysSince: { match: { gte: 45 } } },
    slots: { gift: [`a hand-knitted scarf in your colours`, `a stack of cards signed by a whole classroom`, `a jar of homemade hot sauce with your name on the label`], where: [`at the merch table`, `outside the loading dock`, `in the hotel lobby`] },
    body: [`{fan.name} is waiting {where} with {gift}, and says that {fan.they} wrote to the office every week you were out. The nervousness is obvious, as though someone might tell {fan.them} to leave at any moment.`, `Most of the people in this business pass hundreds of faces a week, and you have trained yourself to see them as a blur. For a moment this one comes into sharp, uncomfortable focus.`],
    choices: [
      { id: 'sign_all', label: `Stay and sign everything {fan.first} brought`, risk: 'low', result: `It takes forty minutes and a cramped hand, and the line behind {fan.them} grows without complaint. {fan.first} walks away looking like someone who has been told it was worth it.`, effects: [{ pop: 0.4 }, { fatigue: 5 }, { conf: 3 }] },
      { id: 'humble', label: `Accept the gift and ask why {fan.first} stayed`, risk: 'med', result: `The answer is simple and a little heartbreaking: it was something to look forward to at a hard time. You carry the words back to the hotel and read them again at three in the morning.`, effects: [{ conf: 5 }, { fatigue: 2 }, { pop: 0.1 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'jacket', label: `Give {fan.first} the ring jacket off your back`, risk: 'low', requires: { stat: { money: { gte: 300 } } }, result: `You hand it over before you can talk yourself out of it. {fan.first} puts it on right there in the hallway, and a stranger takes a photograph that will travel a long way.`, effects: [{ money: -300 }, { pop: 0.7 }, { conf: 3 }] },
      { id: 'security', label: `Keep it brief and send {fan.them} back to the line`, risk: 'low', result: `You smile, say thank you and keep moving, because the schedule is the schedule. It is efficient and perfectly polite, and you think about it on the drive for longer than you should.`, effects: [{ fatigue: -2 }, { conf: -2 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'ne_cbk_sent_down', category: 'comeback', title: `Sent Down to {show_name}`, weight: 2, cooldownDays: 180, maxPerCareer: 3, categoryCooldown: 8,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { stat: { loseStreak: { gte: 4 } } },
    slots: { show_name: [`a Tuesday house show in a gymnasium`, `a developmental card under bad lights`, `a county-fair stage by the livestock barn`], attitude: [`hands you the schedule like a verdict`, `avoids any suggestion that this is punishment`, `says the word reset three times in a row`] },
    body: [`After four losses in a row, {agent.name} {attitude}. The next stop is {show_name}, far from the cameras, in a building that smells of popcorn and floor wax.`, `Nobody wants to call it a demotion, and everyone understands that it is. The only open question is whether you walk in as a casualty or as a veteran with something to prove.`],
    choices: [
      { id: 'embrace', label: `Treat it as a fresh start and work it with joy`, risk: 'low', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `The crowd is two hundred fans who are thrilled to see you, and you remember what the job felt like before it became a ranking. You leave with a sore back and a lighter head.`, effects: [{ conf: 5 }, { pop: 0.2 }, { fatigue: 8 }] },
        { weight: 1, text: `You try for joy, but the empty rows make the smile feel forced. The match is fine, and the drive home is quiet.`, effects: [{ conf: 1 }, { fatigue: 8 }] } ] },
      { id: 'complain', label: `Tell {agent.first} this is beneath you`, risk: 'med', result: `{agent.first} nods, writes nothing down and lets you finish. Your pride feels better for a minute, and the next set of bookings arrives with a noticeably cooler tone.`, effects: [{ conf: 2 }, { pop: -0.2 }] },
      { id: 'steal', label: `Steal the show to force them to notice`, risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.5, charisma: 0.3 }, text: `You work the best match anyone in that gymnasium has ever seen. By Monday three different people have called the office to ask about you.`, effects: [{ pop: 0.8 }, { conf: 4 }, { fatigue: 13 }] },
        { weight: 1, text: `You overreach on a risky spot, miss your landing and finish the match bruised and a little ridiculous. The small crowd takes pity, which is worse than boos.`, effects: [{ conf: -4 }, { fatigue: 13 }, { injury: { part: 'arms', severity: 1, days: 8 } }] } ] },
      { id: 'leave', label: `Ask for two weeks off to reset your head`, risk: 'med', result: `The office grants the time with a shrug and a pay cut. You spend the break sleeping, walking and not watching old matches, and come back thinner and calmer.`, effects: [{ money: -2000 }, { fatigue: -15 }, { conf: 3 }, { pop: -0.3 }] },
    ],
  },
];
