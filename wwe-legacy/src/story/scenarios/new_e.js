// New scenarios (set E): comeback, retirement, legacy, travel, training, finance, personal. Eight each, ids prefixed ne_.
export default [
  // ======================= COMEBACK =======================
  {
    id: 'ne_cbk_first_walkout', category: 'comeback', title: `The First Walk Back After {layoff}`, weight: 2.5, major: true, contexts: ['pre_show', 'show_day'], cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 8,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { injured: false, stat: { careerYears: { gte: 1 } }, daysSince: { match: { gte: 60 } }, noFlag: 'ne_walked_back' },
    slots: { layoff: [`a torn knee`, `a neck fusion`, `eight months of surgery and rehab`, `a long leave from the business`], feeling: [`your hands will not stay still`, `your knees feel like borrowed ones`, `your mouth has gone completely dry`] },
    body: [`Behind the curtain the monitor shows a full building, and all you can think about is what it took to stand in this spot: {layoff}. {agent.name} is at your shoulder holding a clipboard. "Whenever you are ready," {agent.first} says, with the quiet nod of someone who has watched many people take this walk.`, `Your music is about to hit, and {feeling}. The curtain is only a sheet of black fabric, but it has never looked so much like a door.`],
    choices: [
      { id: 'savor', label: `Let the music play a full verse before you move`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: `Patience pays off, and the building does the rest. By the time you step through, the noise has had a long moment to build, and it hits you like warm water.`, effects: [{ pop: 0.9 }, { conf: 5 }, { fatigue: 4 }, { flag: 'ne_walked_back' }] },
        { weight: 1, text: `One beat too many passes, the track loops and the crowd's roar thins into a confused murmur. The walk down the ramp is all awkward steps and forced smiles.`, effects: [{ pop: 0.1 }, { conf: -2 }, { fatigue: 4 }, { flag: 'ne_walked_back' }] } ] },
      { id: 'rush', label: `Walk out fast before the nerves can catch up`, risk: 'low', result: `Curtain, ramp and half the walk go by before fear can find you. The reception is warm but blurry, and you reach the ring breathless and a little cheated of the moment.`, effects: [{ pop: 0.3 }, { conf: 2 }, { fatigue: 7 }, { flag: 'ne_walked_back' }] },
      { id: 'agent_walk', label: `Ask {agent.first} to stay with you until the last second`, risk: 'low', result: `{agent.first} keeps a steady hand on your shoulder and says nothing at all, which is exactly right. At the cue you step forward lighter than you expected, and the favor will not be forgotten.`, effects: [{ pop: 0.3 }, { conf: 3 }, { flag: 'ne_walked_back' }] },
      { id: 'tears', label: `Let it show: walk out with the tears and all`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.6 }, text: `You do not wipe your face and you do not hide it. A hush rolls through the seats, then a standing ovation, and for a minute the whole building is on your side.`, effects: [{ pop: 1.2 }, { conf: 4 }, { fatigue: 8 }, { flag: 'ne_walked_back' }] },
        { weight: 1, text: `It feels like too much too soon, and you spend the walk aware of every camera. The pop is polite, and the match that follows begins on shaky legs.`, effects: [{ pop: 0.2 }, { conf: -3 }, { fatigue: 8 }, { flag: 'ne_walked_back' }] } ] },
    ],
  },
  {
    id: 'ne_cbk_night_after', category: 'comeback', title: `The Show After the Big Pop`, weight: 2, contexts: ['pre_show', 'post_match'], cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 8,
    cast: { opp: { pick: 'roster', tier: { lte: 3 }, sameBrand: true } }, memory: { role: 'opp', max: 1 },
    trigger: { flag: 'ne_walked_back', noFlag: 'ne_after_done' },
    slots: { venue: [`a half-sold arena in a college town`, `a house show in a hockey rink`, `a small-city civic center with sticky floors`], worry: [`the first hard bump`, `the third minute, when the adrenaline drains away`, `the moment someone grabs you the wrong way`] },
    body: [`The comeback walk was a movie. Tonight is {venue}, a sleepy crowd, and {opp.name} stretching nearby with a smile that suggests the plan for the match is already in {opp.their} head.`, `The comeback story is over and the regular job has resumed, which is a different test. What you keep returning to is {worry}, and whether your body will lie to you when it arrives.`],
    choices: [
      { id: 'tell_opp', label: `Tell {opp.first} exactly what you are afraid of`, risk: 'low', result: `{opp.first} listens. "We go slow, then," {opp.first} says, and rebuilds the match around your comfort without making a face. The result is plain and careful, and the trust you feel afterward is worth more than the applause.`, effects: [{ rel: { who: 'opp', trust: 8, affinity: 4 } }, { conf: 2 }, { pop: -0.1 }, { flag: 'ne_after_done' }, { clearFlag: 'ne_walked_back' }] },
      { id: 'prove', label: `Go full speed to prove last night was no fluke`, risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.5 }, text: `Every spot goes in at full speed, and nothing complains. It is the best match of your month in front of a crowd that did not deserve it, and you drive home grinning.`, effects: [{ pop: 0.8 }, { conf: 5 }, { fatigue: 11 }, { flag: 'ne_after_done' }, { clearFlag: 'ne_walked_back' }] },
        { weight: 1, text: `A landing goes wrong and your leg buckles with a sharp, familiar sting. You finish the match, but the ice pack on the drive home tells you what you did not want to hear.`, effects: [{ conf: -4 }, { fatigue: 11 }, { injury: { part: 'legs', severity: 1, days: 10 } }, { flag: 'ne_after_done' }, { clearFlag: 'ne_walked_back' }] } ] },
      { id: 'safe_book', label: `Work the match around moves you trust completely`, risk: 'low', result: `Every mark gets hit, every gamble gets skipped, and the ring is left without a single twinge. It is a forgettable match by design, and the empty seats do not complain.`, effects: [{ pop: -0.3 }, { conf: 1 }, { fatigue: -3 }, { flag: 'ne_after_done' }, { clearFlag: 'ne_walked_back' }] },
      { id: 'ask_notes', label: `Ask {opp.first} for brutally honest notes afterward`, risk: 'med', result: `{opp.first} tells you over a vending-machine coffee that your timing is half a beat late on everything. It stings, and it is the most useful thing anyone has said since you came back.`, effects: [{ attr: { name: 'technical', delta: 1 } }, { rel: { who: 'opp', respect: 5 } }, { conf: -2 }, { fatigue: 5 }, { flag: 'ne_after_done' }, { clearFlag: 'ne_walked_back' }] },
    ],
  },
  {
    id: 'ne_cbk_spot_filled', category: 'comeback', title: `Someone Else Is Working {spot}`, weight: 2, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 8,
    cast: { rook: { pick: 'roster', tier: { lte: 2 }, sameBrand: true }, creative: { pick: 'staff', role: 'creative' } }, memory: { role: 'rook', max: 1 },
    trigger: { injured: false, stat: { careerYears: { gte: 2 } }, daysSince: { match: { gte: 60 } } },
    slots: { spot: [`your old slot before the main event`, `the segment that used to open the show`, `the television match you were built around`], mood: [`the crowd has grown to like it`, `the numbers did not drop a point`, `it will not be undone overnight`] },
    body: [`A card needs a body in every slot, and in your absence {rook.name} was handed {spot}. {creative.name} walks you through it with the careful tone of someone defusing a bomb. "It is not personal," {creative.first} says. "It is only that {mood}."`, `Nobody did anything wrong, which is the problem. There is no villain here, only a gap that closed over like water.`],
    choices: [
      { id: 'demand', label: `Demand the spot back`, risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.5, popularity: 0.3 }, text: `The case is made flatly and without a raised voice. {creative.first} looks at the numbers, looks at you, and says the slot is yours again by next week.`, effects: [{ pop: 0.5 }, { conf: 4 }, { rel: { who: 'rook', respect: -4 } }] },
        { weight: 2, text: `The request lands as entitlement. {creative.first} writes something on a notepad that you suspect is your name followed by the word difficult.`, effects: [{ pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'share', label: `Offer to share the segment with {rook.first}`, risk: 'low', result: `The two of you build a segment that gives {rook.first} the heat and you the finish. It is a generous, slightly bruising compromise, and {rook.first} will tell people about it for years.`, effects: [{ rel: { who: 'rook', trust: 6, affinity: 5 } }, { pop: -0.1 }, { conf: -1 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'earn_back', label: `Take a lesser slot and work your way back up`, risk: 'low', result: `The smaller role gets worked like it matters. The crowd cares less, the office notices more, and you quietly build a ledger of patience that you plan to cash later.`, effects: [{ pop: -0.2 }, { conf: -3 }, { fatigue: 5 }] },
      { id: 'feud', label: `Pitch a feud with {rook.first} for the spot`, risk: 'med', result: `{creative.first} sits up straight at the word feud and starts sketching on the back of a rundown sheet. The pitch makes two careers more interesting, and it also makes one of them a target.`, effects: [{ rivalry: { who: 'rook', heat: 12 } }, { pop: 0.5 }, { rel: { who: 'rook', respect: 2, heat: 6 } }, { fatigue: 4 }] },
    ],
  },
  {
    id: 'ne_cbk_restrictions', category: 'comeback', title: `Cleared, With a List`, weight: 2, cooldownDays: 200, maxPerCareer: 3, categoryCooldown: 8,
    cast: { doctor: { pick: 'staff', role: 'doctor' } },
    trigger: { injured: false, stat: { injuries: { gte: 1 } }, daysSince: { match: { gte: 25 } } },
    slots: { limit: [`no top-rope work for six weeks`, `no hard bumps on your back for a month`, `no more than ten minutes in the ring per night`], tone: [`in the voice of a pilot reading a safety card`, `with a patience that suggests this speech has been ignored before`, `while rubbing a tired eye`] },
    body: [`{doctor.name} signs your clearance form {tone}, then slides a second sheet across the desk. "Read the first line out loud," {doctor.first} says. It reads {limit}.`, `You have been waiting months to hear you can work again, and now the permission arrives with conditions. Everyone in the room understands that the match card will not adjust itself to your list.`],
    choices: [
      { id: 'obey', label: `Follow the list to the letter`, risk: 'low', result: `The sheet goes to the agents, who shape your matches around it. The crowd gets a quieter version of you, and your body gets to keep its promises.`, effects: [{ pop: -0.3 }, { conf: -2 }, { fatigue: -6 }] },
      { id: 'lobby', label: `Argue that the list is too cautious`, risk: 'high', outcomes: [
        { weight: 2, bonus: { toughness: 0.3, confidence: 0.4 }, text: `{doctor.first} sighs, studies your scans again and crosses out one line with a pen. It is a concession and a warning in the same stroke.`, effects: [{ pop: 0.3 }, { conf: 3 }] },
        { weight: 1, text: `The argument makes {doctor.first} flag you as a patient who will not listen. Two weeks later a strain flares exactly where the list said it might.`, effects: [{ conf: -4 }, { injury: { part: 'torso', severity: 1, days: 9 } }] } ] },
      { id: 'hide', label: `Say nothing to the agents and quietly ignore the list`, risk: 'high', result: `Work goes on the way it always has, with the sheet buried in your bag. The matches are better than the ones the list would have allowed, and each landing carries the quiet weight of a secret.`, effects: [{ pop: 0.5 }, { fatigue: 9 }, { conf: -2 }] },
      { id: 'story', label: `Turn the limit into part of the character`, risk: 'med', result: `The restriction becomes a story, a wounded fighter forced to be smart, and the crowd leans in. It takes extra effort and some acting, but the limits become a hook instead of a cage.`, effects: [{ charisma: 1 }, { pop: 0.4 }, { fatigue: 5 }, { conf: 1 }] },
    ],
  },
  {
    id: 'ne_cbk_pitch_return', category: 'comeback', title: `Pitching Your Own Return`, weight: 1.5, cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 8,
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { injured: false, stat: { popularity: { gte: 20 } }, daysSince: { match: { gte: 75 } } },
    slots: { idea: [`a surprise attack from behind in the middle of a main event`, `a long, quiet apology into the microphone`, `a silent walk to the ring in street clothes`, `a vignette filmed in the hospital where you recovered`], deadline: [`by Friday`, `before the taping`, `by tomorrow morning`] },
    body: [`The company wants a story for your return, and {creative.name} wants an answer {deadline}. The first idea on the table is {idea}, delivered with the enthusiasm of someone who has been sitting on it for weeks.`, `It is your name and your body, but it is not your show. How you come back will be remembered longer than any single match you work afterward.`],
    choices: [
      { id: 'accept', label: `Say yes to the idea as written`, risk: 'low', result: `Two rehearsals and a leap of trust later, the plan is set. The return lands the way it looked on paper, polished and effective and slightly less yours than you hoped.`, effects: [{ pop: 0.6 }, { conf: -1 }] },
      { id: 'counter', label: `Counter with a pitch of your own`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.4 }, text: `Ten minutes of talking with no notes follows. "Keep going," {creative.first} says, and writes down half of it. The final version is strange, personal and unmistakably yours.`, effects: [{ pop: 0.9 }, { conf: 4 }, { mic: 1 }] },
        { weight: 1, text: `Your idea sounds better in your head than in the room. {creative.first} politely folds it into the original, and nobody leaves satisfied.`, effects: [{ pop: 0.2 }, { conf: -3 }] } ] },
      { id: 'no_angle', label: `Ask to simply walk out and wrestle with no story`, risk: 'low', result: `The plainest approach possible wins out, and the crowd supplies its own drama. It is honest and understated, and the office files you under reliable rather than exciting.`, effects: [{ pop: 0.1 }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'wait', label: `Ask to hold the return until a bigger show`, risk: 'med', result: `The delay costs you weeks of pay and a stretch of nervous waiting at home. When the date arrives it has the sort of event buzz that a random Tuesday would never have.`, effects: [{ money: -2500 }, { fatigue: -8 }, { pop: 0.5 }, { conf: -1 }] },
    ],
  },
  {
    id: 'ne_cbk_kept_bag', category: 'comeback', title: `The Crew Kept Your {item}`, weight: 1.5, contexts: ['pre_show', 'show_day'], cooldownDays: 300, maxPerCareer: 1, categoryCooldown: 8,
    trigger: { injured: false, stat: { careerYears: { gte: 2 } }, daysSince: { match: { gte: 45 } } },
    slots: { item: [`ring jacket`, `worn knee brace`, `hand-lettered entrance sign`, `towel with your initials`], place: [`the back of the equipment truck`, `a road case with your name taped on it`, `a locker behind the stage`] },
    body: [`Nobody asked them to, but Dee, the ring crew chief, kept your {item} safe all the time you were gone. She pulls it out of {place} without a word and holds it out like someone returning a library book.`, `The crew sets up the ring, tears it down and travels in the dark hours, and you rarely see them except as hands on a rope. Someone out here still thought you were coming back.`],
    choices: [
      { id: 'cash', label: `Slip the crew an envelope as thanks`, risk: 'low', result: `The chief takes it with the faint embarrassment of someone who did not do it for money, then hands it to the youngest hand to split. Word spreads fast, and the ring ropes feel a little tighter on your next night.`, effects: [{ money: -500 }, { conf: 2 }, { pop: 0.1 }] },
      { id: 'pizza', label: `Buy dinner for the whole crew after the show`, risk: 'low', result: `Forty slices of pizza and a long table of tired people make the best photograph nobody takes. For one night you are one of the crew, and it is the happiest you have been all month.`, effects: [{ money: -220 }, { conf: 4 }, { fatigue: 3 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'wear', label: `Take it out to the ring tonight`, risk: 'med', result: `The crowd does not know what the {item} means, but the crew does, and a few of them stop work to watch you go by. The moment is private and enormous, and you walk to the ring with something steadier in your chest.`, effects: [{ pop: 0.4 }, { conf: 5 }, { fatigue: 2 }] },
      { id: 'ask', label: `Ask the chief what the room was like while you were gone`, risk: 'med', result: `She tells you plainly: it was quieter, nobody sang the old songs on the road and someone cried once in the truck. The truth is a gift and a weight, and you carry both into the building.`, effects: [{ conf: -2 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 3 }] },
    ],
  },
  {
    id: 'ne_cbk_fan_waited', category: 'comeback', title: `A Fan Who Never Left`, weight: 1.5, contexts: ['weekly', 'show_day', 'post_show'], cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 8,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { injured: false, stat: { popularity: { gte: 15 } }, daysSince: { match: { gte: 45 } } },
    slots: { gift: [`a hand-knitted scarf in your colors`, `a stack of cards signed by a whole classroom`, `a jar of homemade hot sauce with your name on the label`], where: [`at the merch table`, `outside the loading dock`, `in the hotel lobby`] },
    body: [`{fan.name} is waiting {where} with {gift}, and says, "I wrote to the office every week you were out." The nervousness is obvious, as though someone might tell {fan.them} to leave at any moment.`, `Most of the people in this business pass hundreds of faces a week, and you have trained yourself to see them as a blur. For a moment this one comes into sharp, uncomfortable focus.`],
    choices: [
      { id: 'sign_all', label: `Stay and sign everything {fan.first} brought`, risk: 'low', result: `It takes forty minutes and a cramped hand, and the line behind {fan.them} grows without complaint. {fan.first} walks away looking like someone who has been told it was worth it.`, effects: [{ pop: 0.4 }, { fatigue: 5 }, { conf: 3 }] },
      { id: 'humble', label: `Accept the gift and ask why {fan.first} stayed`, risk: 'med', result: `The answer is simple and a little heartbreaking: it was something to look forward to at a hard time. You carry the words back to the hotel and read them again at three in the morning.`, effects: [{ conf: 5 }, { fatigue: 2 }, { pop: 0.1 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'jacket', label: `Give {fan.first} the ring jacket off your back`, risk: 'low', requires: { stat: { money: { gte: 300 } } }, result: `It is off your back and into {fan.their} hands before you can talk yourself out of it. {fan.first} puts it on right there in the hallway, and a stranger takes a photograph that will travel a long way.`, effects: [{ money: -300 }, { pop: 0.7 }, { conf: 3 }] },
      { id: 'security', label: `Keep it brief and send {fan.them} back to the line`, risk: 'low', result: `A smile, a thank-you and a quick exit follow, because the schedule is the schedule. It is efficient and perfectly polite, and you think about it on the drive for longer than you should.`, effects: [{ fatigue: -2 }, { conf: -2 }, { pop: -0.1 }] },
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
        { weight: 1, text: `Joy is the plan, but the empty rows make the smile feel forced. The match is fine, and the drive home is quiet.`, effects: [{ conf: 1 }, { fatigue: 8 }] } ] },
      { id: 'complain', label: `Tell {agent.first} this is beneath you`, risk: 'med', result: `{agent.first} nods, writes nothing down and lets you finish. "Noted," {agent.first} says. Your pride feels better for a minute, and the next set of bookings arrives with a noticeably cooler tone.`, effects: [{ conf: 2 }, { pop: -0.2 }] },
      { id: 'steal', label: `Steal the show to force them to notice`, risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.5, charisma: 0.3 }, text: `Two hundred people watch the best match they have ever seen. By Monday three different people have called the office to ask about you.`, effects: [{ pop: 0.8 }, { conf: 4 }, { fatigue: 13 }] },
        { weight: 1, text: `A risky spot goes wrong, the landing is missed, and the match finishes with you bruised and a little ridiculous. The small crowd takes pity, which is worse than boos.`, effects: [{ conf: -4 }, { fatigue: 13 }, { injury: { part: 'arms', severity: 1, days: 8 } }] } ] },
      { id: 'leave', label: `Ask for two weeks off to reset your head`, risk: 'med', result: `The office grants the time with a shrug and a pay cut. You spend the break sleeping, walking and not watching old matches, and come back thinner and calmer.`, effects: [{ money: -2000 }, { fatigue: -15 }, { conf: 3 }, { pop: -0.3 }] },
    ],
  },
  // ======================= RETIREMENT =======================
  {
    id: 'ne_ret_quiet_squeeze', category: 'retirement', title: `The Quiet Squeeze`, weight: 2.5, major: true, cooldownDays: 300, maxPerCareer: 1, categoryCooldown: 15,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { stat: { careerYears: { gte: 12 } }, any: [{ stat: { loseStreak: { gte: 3 } } }, { stat: { popularity: { lte: 45 } } }] },
    slots: { sign: [`your entrance getting shorter`, `your name sliding down the poster`, `your match times being trimmed to six minutes`, `your merchandise drifting to the bottom shelf`], manner: [`speaks too gently`, `cannot quite hold your gaze`, `chooses each word like a step on ice`] },
    body: [`{agent.name} finds you at catering and {manner}. "I would rather you heard it from me," {agent.first} says. The pattern is no accident: {sign} is the office easing you toward the exit without anyone having to say the word.`, `It is the kindest cruelty in the business, a slow fade that lets everyone keep their dignity except the person being faded. Whatever you say next will decide whether you leave on your terms or on theirs.`],
    choices: [
      { id: 'retire', label: `Retire before they can finish easing you out`, risk: 'high', result: `{agent.first} writes down the end of the month as the date for the announcement. The relief is enormous and so is the grief, and both sit with you through the quietest drive of your career.`, effects: [{ event: { type: 'retirement', participants: [], summary: `{player.name} retired rather than be eased out of the business.`, importance: 5, data: {} } }, { pop: 0.8 }, { conf: 2 }] },
      { id: 'fight', label: `Fight for a proper spot on the card`, risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.5, popularity: 0.3 }, text: `Your case is made with the plainness of someone who has nothing left to bluff. The office gives you a real match on a real show, and the building wakes up for it.`, effects: [{ pop: 0.9 }, { conf: 5 }, { fatigue: 8 }] },
        { weight: 2, text: `The budget is the budget, you are told, and the plan is the plan. The rest of the week feels like walking through someone else's building.`, effects: [{ pop: -0.5 }, { conf: -4 }, { fatigue: 4 }] } ] },
      { id: 'timeline', label: `Ask {agent.first} for the real timeline`, risk: 'low', result: `The answer is honest: perhaps a year, perhaps less, depending on who gets hurt. You do not feel better, but you feel informed, and that turns out to matter.`, effects: [{ flag: 'ne_ret_season_set' }, { conf: -2 }, { fatigue: -3 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'veteran', label: `Accept the veteran role: lose gracefully and teach`, risk: 'low', result: `The stipend, the smaller matches and the quiet job of making younger wrestlers look good are all yours now. It is a respectable end that costs you your headline pride one night at a time.`, effects: [{ money: 2500 }, { pop: -0.6 }, { conf: -4 }, { attr: { name: 'psychology', delta: 1 } }] },
    ],
  },
  {
    id: 'ne_ret_last_opponent', category: 'retirement', title: `Someone Wants to Be Your Last Opponent`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 15,
    cast: { opp: { pick: 'roster', tier: { lte: 2 }, sameBrand: true } }, memory: { role: 'opp', max: 2 },
    trigger: { stat: { careerYears: { gte: 10 }, popularity: { gte: 40 } } },
    slots: { manner: [`with shaking hands`, `in a speech clearly practiced in a mirror`, `in a rush, between two doors`], pitch: [`on a night when the arena is sold out`, `in your hometown`, `at the end of the season, when it means the most`] },
    body: [`{opp.name} catches you in the corridor and asks, {manner}. The request is simple and enormous: "When you finally stop, I want to be the one across the ring, {pitch}."`, `It is the highest compliment the business has, and also a trap, because a promise like that has a way of becoming a date. You have to decide what the next year of your life looks like before anyone has offered you a cent.`],
    choices: [
      { id: 'retire', label: `Say yes and set the date: this will be your last match`, risk: 'high', result: `A handshake settles it, and the office starts planning. A date on a calendar changes the color of everything, and {opp.first} cries in the corridor without seeming ashamed of it.`, effects: [{ event: { type: 'retirement', participants: ['opp'], summary: `{player.name} retired after a final match with {opp.name}.`, importance: 5, data: {} } }, { rel: { who: 'opp', respect: 12, affinity: 10, trust: 8 } }, { pop: 1.2 }, { conf: 3 }, { fatigue: 12 }, { money: -4000 }] },
      { id: 'book_now', label: `Book a match with {opp.first} now and say nothing about endings`, risk: 'med', result: `The match is agreed, the farewell is not, and {opp.first} hears that the rest depends on how your body feels. It is a polite way of saying maybe, and {opp.first} accepts it with a thin smile.`, effects: [{ booking: { who: 'opp', type: 'singles' } }, { rel: { who: 'opp', respect: 4 } }, { pop: 0.4 }, { fatigue: 5 }] },
      { id: 'earn_it', label: `Tell {opp.first} to earn it by beating you first`, risk: 'med', result: `The challenge lights something in {opp.first}'s eyes, and the next weeks carry a rivalry that feels more honest than most. You get your fight and you keep your choice.`, effects: [{ rivalry: { who: 'opp', heat: 14 } }, { rel: { who: 'opp', respect: 6 } }, { pop: 0.5 }, { fatigue: 7 }] },
      { id: 'decline', label: `Say that the decision is yours alone`, risk: 'low', result: `The words come out colder than you meant them to, and {opp.first} nods, thanks you and leaves. You are left alone with a choice that still belongs to nobody but you.`, effects: [{ rel: { who: 'opp', respect: -3, affinity: -4 } }, { conf: 2 }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'ne_ret_phone_silence', category: 'retirement', title: `The Phone Has Been {silence}`, weight: 1.5, major: true, contexts: ['offseason', 'weekly'], cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 15,
    trigger: { stat: { careerYears: { gte: 9 } }, daysSince: { match: { gte: 30 } }, injured: false },
    slots: { silence: [`silent for five weeks`, `quiet for six weeks`, `quiet for over a month`], sound: [`the refrigerator humming`, `a neighbor's mower`, `rain in the gutters`] },
    body: [`The phone has been quiet long enough that you keep checking it for a dead battery. In the kitchen the loudest thing is {sound}, and the schedule that used to run your life is now a blank page.`, `This is what it sounds like when a career takes a break, or when it has already ended and nobody has told you. Only one of those is a decision you get to make.`],
    choices: [
      { id: 'call_office', label: `Call the office and ask for dates`, risk: 'med', outcomes: [
        { weight: 2, bonus: { popularity: 0.4 }, text: `A voice on the other end says they were about to call, and a booking appears on the calendar within the hour. Relief floods in and then embarrassment at how much you needed it.`, effects: [{ money: 1500 }, { conf: 3 }, { pop: 0.2 }] },
        { weight: 2, text: `Someone will be in touch, the voice promises. It is the oldest sentence in the business, and you hang up knowing exactly what it means.`, effects: [{ conf: -4 }, { pop: -0.2 }] } ] },
      { id: 'retire', label: `Accept what the silence is telling you and retire`, risk: 'high', result: `At the kitchen table, the statement gets written and read out loud to the empty room. Nobody applauds, but the weight that lifts off your chest is real.`, effects: [{ event: { type: 'retirement', participants: [], summary: `{player.name} retired in the quiet of an offseason.`, importance: 5, data: {} } }, { pop: 0.6 }, { conf: 1 }] },
      { id: 'train_rookie', label: `Call a local school and offer to run a class`, risk: 'low', result: `The class is nine teenagers on a stained mat, and for three hours you remember why you started. It pays almost nothing, but the phone in your pocket stops mattering.`, effects: [{ money: 150 }, { conf: 4 }, { fatigue: 6 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'plan', label: `Take a business course and start planning your next life`, risk: 'med', result: `The textbooks are heavy and the instructor is half your age, but there is a strange pleasure in being a beginner again. You leave each night tired and a step closer to a door you did not know existed.`, effects: [{ money: -700 }, { flag: 'ne_ret_season_set' }, { conf: 2 }, { fatigue: 5 }] },
    ],
  },
  {
    id: 'ne_ret_the_math', category: 'retirement', title: `The Arithmetic of Stopping`, weight: 1.5, major: true, cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 15,
    trigger: { stat: { careerYears: { gte: 10 }, money: { gte: 15000 } } },
    slots: { advisor: [`an accountant with a calculator and a sympathetic face`, `a financial planner in a rented office above a dentist`, `your cousin the bookkeeper, armed with a legal pad`], target: [`eleven more months`, `three more good years`, `five years if nothing breaks`] },
    body: [`Across a cluttered desk, {advisor} draws two columns on a sheet of paper and circles the bottom line twice. The conclusion, spoken gently: "You could stop tomorrow and be fine for a while. Or you could work {target} and be comfortable for a long time."`, `Money has been the lie you told yourself at every crossroads, the reason to keep going and the excuse for not stopping. Now the lie has numbers, and the numbers are surprisingly kind.`],
    choices: [
      { id: 'retire_now', label: `Retire now and live on what is in the bank`, risk: 'high', result: `Out loud, for the first time, comes the sentence: you are done. The folder closes. The savings will be thinner than the plan, and the freedom is thicker than anything you imagined.`, effects: [{ event: { type: 'retirement', participants: [], summary: `{player.name} retired after running the numbers.`, importance: 5, data: {} } }, { money: -3000 }, { pop: 0.5 }, { conf: 2 }] },
      { id: 'target', label: `Set a number and keep working until you hit it`, risk: 'med', result: `The figure goes on a sticky note, and the sticky note goes on the dashboard of the car. It gives every night a purpose, and every ache a price tag.`, effects: [{ flag: 'ne_ret_season_set' }, { money: 2000 }, { fatigue: 9 }, { conf: 3 }] },
      { id: 'side', label: `Spend part of it now on something that will outlast the ring`, risk: 'med', result: `Money goes into a small business plan, and the papers get signed with a trembling hand. If it works you have a future, and if it does not you have learned something expensive.`, effects: [{ money: -5000 }, { conf: 4 }, { flag: 'ne_ret_season_set' }, { fatigue: 3 }] },
      { id: 'ignore', label: `Close the notebook and stop thinking about it`, risk: 'low', result: `The paper gets folded into a drawer under the takeout menus. The decision is still waiting, but tonight you sleep like a person with no decisions at all.`, effects: [{ fatigue: -5 }, { conf: -1 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'ne_ret_locker_moved', category: 'retirement', title: `Your Locker Spot Is {spot}`, weight: 1.5, major: true, contexts: ['pre_show'], cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 15,
    cast: { heir: { pick: 'roster', tier: { lte: 3 }, sameBrand: true } }, memory: { role: 'heir', max: 1 },
    trigger: { stat: { careerYears: { gte: 14 } }, injured: false },
    slots: { spot: [`by the shower`, `at the cold end of the room`, `behind the folding table`], marker: [`a strip of tape with a different name on it`, `a bag that is not yours`, `a fresh nameplate in a very confident font`] },
    body: [`The corner you have used for years has been reassigned, and in its place is {marker}. Your things have been moved, neatly and without apology, to a spot {spot}, the kind of place {heir.name} would not have picked for a friend.`, `Nobody told you, which is how the business tells you everything. The locker room has a hierarchy that runs on silent paperwork, and today you read your new rank off the wall.`],
    choices: [
      { id: 'take_it', label: `Say nothing and unpack in the new spot`, risk: 'low', result: `Your jacket goes on a hook that wobbles, and the warm-up happens in a different corner. The room watches you take it, and some of them respect it and some of them stop looking.`, effects: [{ conf: -4 }, { fatigue: -2 }, { rel: { who: 'heir', respect: -2 } }] },
      { id: 'confront', label: `Have a quiet word with {heir.first} about it`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4, charisma: 0.3 }, text: `{heir.first} had no idea and is mortified. The spot is returned within the hour, with a clumsy apology and a promise to buy the coffee.`, effects: [{ rel: { who: 'heir', respect: 6, trust: 4 } }, { conf: 3 }, { pop: 0.1 }] },
        { weight: 1, text: `The conversation sours quickly, and {heir.first} says something about changing times that you hear in the back of your skull all night.`, effects: [{ rel: { who: 'heir', heat: 8, respect: -3 } }, { conf: -4 }, { fatigue: 3 }] } ] },
      { id: 'laugh', label: `Laugh, shake hands and make a joke about it`, risk: 'low', result: `The joke lands better than you deserved and the tension drains out of the room. The move stays, and so does a small ache you keep to yourself.`, effects: [{ rel: { who: 'heir', affinity: 6 } }, { conf: -2 }, { pop: 0.1 }] },
      { id: 'retire', label: `Pack the bag and tell the office this is the last season`, risk: 'high', result: `The wobbly hook is the last straw, and you realize it is not a rebellion but a recognition. You sit in the hallway with the bag at your feet and make the call.`, effects: [{ event: { type: 'retirement', participants: [], summary: `{player.name} announced retirement after being moved out of the usual corner.`, importance: 5, data: {} } }, { pop: 0.5 }, { conf: 1 }, { money: -300 }] },
    ],
  },
  {
    id: 'ne_ret_memory_test', category: 'retirement', title: `Three Words and a Pause`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 15,
    cast: { doctor: { pick: 'staff', role: 'doctor' } },
    trigger: { stat: { injuries: { gte: 3 }, careerYears: { gte: 8 } } },
    slots: { word: [`apple`, `table`, `penny`], test: [`a string of numbers to repeat backward`, `a clock face to draw from memory`, `a sentence to repeat back`] },
    body: [`The screening is routine, {doctor.name} promises: three words to remember, ten minutes of {test} and some small talk. You get nearly everything right, but when asked to recall the first word again, "{word}" will not come.`, `It is a single gap in a good score, and the room goes still anyway. Years of hits have taught you what to listen for in a doctor's silence.`],
    choices: [
      { id: 'retire', label: `Walk away from the ring for good`, risk: 'high', result: `The clipboard goes down, and {doctor.first} hears that you have heard enough. The decision is quick, and it is the first one you have made in years without arguing with yourself.`, effects: [{ event: { type: 'retirement', participants: [], summary: `{player.name} retired on medical advice after a cognitive screening.`, importance: 5, data: {} } }, { pop: 0.6 }, { conf: 1 }] },
      { id: 'workup', label: `Sit out and book a full neurological workup`, risk: 'med', result: `The scans take two days and cost a small fortune, and every result is an anxious wait. The news is mostly good, and the peace of knowing is worth more than the missed dates.`, effects: [{ money: -2800 }, { fatigue: -10 }, { pop: -0.5 }, { conf: 3 }] },
      { id: 'avoid_head', label: `Agree to avoid head-high bumps and strikes from now on`, risk: 'med', result: `Your style is rebuilt around a body that does not take what it used to. The matches are more careful and a little smaller, and you sleep better knowing you have changed the odds.`, effects: [{ pop: -0.6 }, { conf: -2 }, { attr: { name: 'technical', delta: 1 } }, { fatigue: 3 }] },
      { id: 'retest', label: `Call it a tired day and ask to retest next week`, risk: 'high', outcomes: [
        { weight: 2, text: `The second test goes smoothly and {doctor.first} signs the form with visible relief. You walk out light on your feet, pretending the first test never happened.`, effects: [{ conf: 4 }, { fatigue: 2 }] },
        { weight: 1, text: `The same word escapes you again, and {doctor.first} writes something down in a firmer hand. A week of headaches follows, along with a note in your file.`, effects: [{ conf: -5 }, { injury: { part: 'head', severity: 1, days: 14 } }, { pop: -0.3 }] } ] },
    ],
  },
  {
    id: 'ne_ret_rumor_leak', category: 'retirement', title: `They Printed It Before You Decided`, weight: 1.5, major: true, cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 15,
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { minYear: 2010, stat: { careerYears: { gte: 10 } } },
    slots: { outlet: [`a wrestling news site`, `a podcast with a loyal audience`, `a fan forum post that spread through every group chat`], detail: [`quoting an unnamed source`, `listing a month and a venue`, `attaching a photo of you in a parking lot`] },
    body: [`By lunchtime {outlet} is claiming that you are about to retire, {detail}. {reporter.name} calls before the story runs, polite and a little nervous. "Do you want to respond?" {reporter.first} asks.`, `You have not told your family, the office or yourself. Someone out there knows your mind better than you do, or thinks they do.`],
    choices: [
      { id: 'confirm', label: `Confirm it and announce your retirement`, risk: 'high', result: `{reporter.first} gets the first official word, and the story becomes yours instead of a rumor. The messages that follow are warm, painful and overwhelming.`, effects: [{ event: { type: 'retirement', participants: [], summary: `{player.name} confirmed retirement after reports leaked.`, importance: 5, data: {} } }, { pop: 1.0 }, { conf: 1 }] },
      { id: 'deny', label: `Deny it flatly and say you are far from finished`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4, mic: 0.3 }, text: `Your denial is crisp and a bit defiant, and the fans rally behind it. By evening the rumor is a bar fight, and you are the one who walked away from it standing.`, effects: [{ pop: 0.6 }, { conf: 4 }, { fatigue: 3 }] },
        { weight: 1, text: `The denial rings hollow to anyone who knows you are tired. A columnist calls it protesting too much, and the comments stack up.`, effects: [{ pop: -0.3 }, { conf: -4 }] } ] },
      { id: 'no_comment', label: `Decline to comment either way`, risk: 'low', result: `The line is simple: there will be something to say when there is something to say. Then the call ends. The silence sets the speculation spinning faster, and your phone does not stop buzzing for two days.`, effects: [{ fatigue: 4 }, { conf: -2 }, { pop: 0.1 }] },
      { id: 'own_it', label: `Say that you will decide when you decide, and not before`, risk: 'med', result: `The line gets quoted back to you everywhere, and it earns you a measure of respect. It also sets a clock ticking over your head that you did not wind.`, effects: [{ flag: 'ne_ret_season_set' }, { pop: 0.4 }, { conf: 2 }, { fatigue: 5 }] },
    ],
  },
  {
    id: 'ne_ret_final_lap', category: 'retirement', title: `Tonight Feels Like the Last Lap`, weight: 2.5, major: true, contexts: ['show_day', 'pre_show'], cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 15,
    trigger: { flag: 'ne_ret_season_set', stat: { careerYears: { gte: 8 } } },
    slots: { ritual: [`taping your wrists one last time`, `walking the empty arena before the doors open`, `sitting in the ring after the lights drop`], detail: [`how small the ring really is`, `the smell of fog and fried food`, `how many people have kept this building alive`] },
    body: [`You said a number of months and an end that felt abstract when you said it. Tonight, while {ritual}, the ending finally arrives in the body and you notice {detail}.`, `Nobody else knows what you are feeling, and that is the loneliest part of a farewell you have not announced. You have to choose whether the story ends here or whether it keeps going.`],
    choices: [
      { id: 'retire', label: `Make tonight the last night and tell the office`, risk: 'high', result: `In the corridor you say it to the producer in four words: "Tonight is the last." The night turns into a quiet ceremony you did not plan, and when the final bell rings, it finally sounds like an ending.`, effects: [{ event: { type: 'retirement', participants: [], summary: `{player.name} retired after setting a date for the end.`, importance: 5, data: {} } }, { clearFlag: 'ne_ret_season_set' }, { pop: 1.2 }, { conf: 3 }, { fatigue: 10 }, { money: -2500 }] },
      { id: 'tell_room', label: `Tell the locker room privately and keep working`, risk: 'med', result: `The veterans shake your hand, the rookies stare, and the room gets a little gentler with you. You spend your last weeks being looked at differently, which is a gift and a burden.`, effects: [{ pop: 0.3 }, { conf: 3 }, { fatigue: 5 }, { money: -200 }] },
      { id: 'secret', label: `Keep it to yourself and work like it is any night`, risk: 'low', result: `An ordinary match gets wrestled, so ordinary it hurts, followed by catering eaten alone and a long look at the crowd filing out. The secret is a lonely thing to carry, and it makes every unremarkable moment sharper.`, effects: [{ conf: -1 }, { fatigue: 4 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'take_back', label: `Take the date back: you are not ready`, risk: 'med', result: `The number comes off the sticky note, and you feel foolish and fierce in equal measure. Another year is a gift, and also a risk you have not fully priced.`, effects: [{ clearFlag: 'ne_ret_season_set' }, { conf: 2 }, { pop: -0.2 }, { fatigue: 7 }] },
    ],
  },
  // ======================= LEGACY =======================
  {
    id: 'ne_leg_stranger_story', category: 'legacy', title: `A Stranger in {setting}`, weight: 2, contexts: ['weekly', 'show_day', 'post_show'], cooldownDays: 200, maxPerCareer: 3, categoryCooldown: 10,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 30 } } },
    slots: { setting: [`a pharmacy line`, `an airport gate`, `a gas station at midnight`, `a hospital elevator`], story: [`got {fan.them} through a long winter of treatment`, `was the one thing a father and son could talk about`, `kept {fan.them} company on night shifts nobody else wanted`, `taught {fan.them} to stand up to a bully`] },
    body: [`In the middle of an ordinary errand, {fan.name} stops you and says, a little embarrassed, that watching you {story}. Nothing is being asked for; {fan.they} only wanted you to know before the chance went by.`, `You spend your nights believing that the job is bruises, rental cars and three hours of sleep. It had not occurred to you that you were also being used as a handrail.`],
    choices: [
      { id: 'listen', label: `Set your bag down and listen to the whole story`, risk: 'low', result: `The story takes twenty minutes and you hear every word of it. "I just wanted you to know," {fan.first} finishes. You lose your place in line and barely notice, because something in your chest has been quietly rearranged.`, effects: [{ conf: 5 }, { fatigue: 4 }, { pop: 0.2 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'photo', label: `Sign something, take a photo and say thank you`, risk: 'low', result: `The photo is a smiling blur, and {fan.first} thanks you three times before drifting away. It is warm and quick, and you wonder later whether quick was the right speed.`, effects: [{ pop: 0.3 }, { conf: 2 }] },
      { id: 'tickets', label: `Leave tickets and a note at the box office for {fan.first}`, risk: 'low', requires: { stat: { money: { gte: 250 } } }, result: `A few lines get scribbled on a hotel notepad, and two front-row seats go with them. On the night, a figure in the third row is holding the note against their chest the whole match.`, effects: [{ money: -250 }, { pop: 0.5 }, { conf: 4 }] },
      { id: 'deflect', label: `Wave it off: it is only a show and you only work here`, risk: 'med', result: `The words come out lighter than you meant, and {fan.first} nods like a person who has been politely told not to make it a big deal. You walk away feeling smaller than when you stopped.`, effects: [{ conf: -3 }, { fatigue: -2 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'ne_leg_arena_closing', category: 'legacy', title: `The Last Night of {arena}`, weight: 2, major: true, contexts: ['weekly', 'show_day'], cooldownDays: 400, maxPerCareer: 1, categoryCooldown: 10,
    cast: { gm: { pick: 'staff', role: 'gm' } },
    trigger: { stat: { careerYears: { gte: 5 } } },
    slots: { arena: [`the old civic barn`, `the rust-belt coliseum`, `the hall where the pipes still knock`], keepsake: [`a strip of the ring apron`, `one of the red seats from row F`, `a plaque from the original lighting board`] },
    body: [`For sixty years {arena} has hosted wrestling, and it will be torn down in the spring, so the last card is being quietly built around its history. "Would you be on it?" {gm.first} asks. "Short fee. Long memory." Among the lots in the closing-night auction is {keepsake}.`, `There are rooms in this business that become part of the people who work in them. This one smells of old popcorn and cold concrete, and you can feel it listening.`],
    choices: [
      { id: 'work_it', label: `Work the final card for charity pay`, risk: 'med', result: `The crowd is a mix of grandparents, grown children and every local who ever bought a ticket. You wrestle with the building as a partner, and when the last light goes out you cry in the shower.`, effects: [{ money: -800 }, { pop: 0.8 }, { conf: 4 }, { fatigue: 9 }] },
      { id: 'speech', label: `Ask for the microphone to say goodbye to the building`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.5 }, text: `The speech is about the sound the ropes make in the dead of winter and the way the floor hums when a crowd stamps. The whole place cheers a building and weeps for something far bigger.`, effects: [{ pop: 1.0 }, { conf: 4 }, { mic: 1 }, { fatigue: 4 }] },
        { weight: 1, text: `The speech runs too long and the sentimentality curdles into rambling. The crowd stays kind about it, but the producer is looking at the clock.`, effects: [{ pop: 0.1 }, { conf: -3 }, { fatigue: 4 }] } ] },
      { id: 'buy_piece', label: `Buy {keepsake} from the auction`, risk: 'low', requires: { stat: { money: { gte: 600 } } }, result: `The bidding ends at a price that makes the auctioneer wince on your behalf. It sits in the hall at home like a small, bruised relic, and you touch it when you pass.`, effects: [{ money: -600 }, { conf: 3 }, { pop: 0.1 }] },
      { id: 'skip', label: `Skip it: nostalgia is a luxury on a tight schedule`, risk: 'low', result: `Rest wins instead, and the card goes on without you. It is the practical choice, and a few weeks later, when the wrecking ball appears on the news, it also becomes a small regret.`, effects: [{ fatigue: -9 }, { conf: -3 }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'ne_leg_story_grows', category: 'legacy', title: `The Story About You That Keeps Growing`, weight: 1.5, contexts: ['weekly', 'post_show'], cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 10,
    cast: { vet: { pick: 'roster', tier: { gte: 3 } } }, memory: { role: 'vet', max: 1 },
    trigger: { stat: { careerYears: { gte: 6 }, popularity: { gte: 40 } } },
    slots: { tale: [`you worked a full match on a broken wrist`, `you faced down a hostile crowd of two thousand in total silence`, `you turned down a title shot to protect a friend's spot`], venue: [`on a bus full of rookies`, `in front of a podcast microphone`, `at a roast dinner after the show`] },
    body: [`{vet.name} is telling a story about you {venue}, and the room is leaning in. The version being told is that {tale}, a story you only half recognize, with details that grow a little every time it is passed along.`, `You do not recognize the story as a photograph, but you recognize it as a portrait. Legends are built out of this sort of generous exaggeration, and the question is who gets to hold the pen.`],
    choices: [
      { id: 'correct', label: `Gently correct the story with the less flattering truth`, risk: 'med', result: `The room laughs at the real version, which is smaller and funnier and more human. {vet.first} nods slowly, as if you passed a test you did not know you were taking.`, effects: [{ rel: { who: 'vet', respect: 6 } }, { conf: 2 }, { pop: -0.2 }] },
      { id: 'play', label: `Play along and let the legend stand`, risk: 'low', result: `Silence and a smile let the story get one more layer of polish. It is flattering and a bit dishonest, and you feel the tiny weight of keeping a character running offstage.`, effects: [{ pop: 0.5 }, { conf: 2 }, { rel: { who: 'vet', affinity: 3, respect: -2 } }] },
      { id: 'embellish', label: `Add a detail of your own and run with it`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.6 }, text: `Your addition is perfectly timed and outrageous, and the whole room howls. By next week it is part of the story, with your fingerprints on it.`, effects: [{ pop: 0.8 }, { charisma: 1 }, { conf: 3 }] },
        { weight: 1, text: `Somebody who was actually there is in the room and clears their throat. The embarrassment lasts about as long as the silence does, which is far too long.`, effects: [{ pop: -0.4 }, { conf: -5 }, { rel: { who: 'vet', respect: -4 } }] } ] },
      { id: 'tell_true', label: `Offer your own telling, plain and true`, risk: 'med', result: `The night gets described the way it felt, which is tired, scared and very quiet. The room is hushed, then thoughtful, and {vet.first} refills your coffee without being asked.`, effects: [{ rel: { who: 'vet', respect: 4, trust: 4 } }, { conf: 3 }, { fatigue: 3 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'ne_leg_retrospective_gap', category: 'legacy', title: `The Video Leaves Out {omitted}`, weight: 1.5, contexts: ['weekly'], cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 10,
    cast: { producer: { pick: 'staff', role: 'producer' } },
    trigger: { stat: { popularity: { gte: 40 }, careerYears: { gte: 5 } } },
    slots: { omitted: [`the match that made your name`, `the trainer who taught you`, `the night you worked hurt`, `the rival who pushed you hardest`], format: [`a highlight video`, `a documentary short`, `an anniversary montage`] },
    body: [`In a dark edit bay that smells of burnt coffee, {producer.name} screens a rough cut of {format} and asks for your notes. Everything is there except {omitted}, which had been the whole point.`, `It is not malice, only a budget and a deadline. Still, the gap is the shape of a missing person in a family photograph, and everyone present can see where the edit has closed over it.`],
    choices: [
      { id: 'demand', label: `Demand that it goes back in`, risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: `The explanation is delivered in a voice that does not shake. {producer.first} pulls up the archive and finds a clip with a quiet, apologetic smile.`, effects: [{ pop: 0.4 }, { conf: 4 }, { fatigue: 3 }] },
        { weight: 1, text: `"The deadline is the deadline," {producer.first} reminds you with chilly courtesy. "The edit belongs to many people." You leave with the gap intact and your reputation a notch dimmer.`, effects: [{ pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'accept', label: `Accept it: you can't please everyone with ninety seconds`, risk: 'low', result: `Sign-off comes, and the drive home carries a feeling like a swallowed stone. The video is lovely, and every time you watch it you see only what is missing.`, effects: [{ conf: -3 }, { fatigue: -2 }, { pop: 0.2 }] },
      { id: 'swap', label: `Offer to cut one of the flashier moments to make room`, risk: 'med', result: `The trade costs you a famous highlight and gains you a truer story. The finished piece is quieter and a bit more yours than it would have been.`, effects: [{ pop: -0.2 }, { conf: 3 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'own_clip', label: `Send your own footage and offer to narrate`, risk: 'med', result: `A weekend goes to digging through boxes and a night recording in a closet full of coats. The result is imperfect and heartfelt, and the office is a little surprised that you cared this much.`, effects: [{ fatigue: 7 }, { mic: 1 }, { pop: 0.3 }, { money: -150 }] },
    ],
  },
  {
    id: 'ne_leg_graduation', category: 'legacy', title: `Asked to Speak at {school}`, weight: 1.5, contexts: ['weekly', 'offseason'], cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 10,
    cast: { coach: { pick: 'staff', role: 'coach' } },
    trigger: { stat: { careerYears: { gte: 6 }, popularity: { gte: 35 } } },
    slots: { school: [`a basement wrestling school`, `a converted warehouse gym`, `a community-college program`], crowd: [`nine nervous trainees and their parents`, `a dozen students in brand-new boots`, `a class that is mostly teenagers`] },
    body: [`{coach.name} calls with a favor to ask: "Would you come and speak?" It is the graduation of {school}, with {crowd} expected to attend. There is no fee and a folding chair, but a surprising amount of hope hanging in the air.`, `You remember sitting in a room like that, wanting someone to tell you the truth, and being told something shinier instead. This time you are the one holding the microphone.`],
    choices: [
      { id: 'honest', label: `Give them the honest version: it costs more than they think`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.4, charisma: 0.4 }, text: `The talk is about pain, missed holidays and the thousand-mile drives, and a hush falls on the folding chairs. Afterward two parents thank you quietly and one student admits that it scared and thrilled them equally.`, effects: [{ pop: 0.5 }, { conf: 4 }, { mic: 1 }, { fatigue: 3 }] },
        { weight: 1, text: `The truth is too heavy for a graduation, and a mother near the front starts frowning. {coach.first} thanks you diplomatically, and the afternoon ends earlier than planned.`, effects: [{ pop: -0.2 }, { conf: -3 }, { fatigue: 3 }] } ] },
      { id: 'inspire', label: `Give them the inspiring speech and send them off happy`, risk: 'low', result: `The speech is warm and shiny and makes everyone smile for photographs. It sends a room of hopeful people off toward a road you know is harder than you said.`, effects: [{ pop: 0.4 }, { conf: 1 }, { fatigue: 3 }] },
      { id: 'one_on_one', label: `Skip the podium and spend the afternoon coaching in the ring`, risk: 'med', result: `Off comes the jacket, and three hours of drills follow, with a footstep corrected here and a grip there. Nobody makes a speech and everyone remembers it, including your lower back.`, effects: [{ fatigue: 9 }, { attr: { name: 'psychology', delta: 1 } }, { conf: 3 }, { pop: 0.2 }] },
      { id: 'gear', label: `Donate gear and send a recorded message instead`, risk: 'low', result: `A box of boots, pads and a polite video arrive in time for the ceremony. It is useful and it is generous, and it is also a way of not being in the room.`, effects: [{ money: -400 }, { conf: -2 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'ne_leg_record_blessing', category: 'legacy', title: `{youngster.name} Is Closing In on Your Mark`, weight: 1.5, contexts: ['weekly', 'post_show'], cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 10,
    cast: { youngster: { pick: 'roster', tier: { lte: 3 }, sameBrand: true } }, memory: { role: 'youngster', max: 1 },
    trigger: { stat: { titleWins: { gte: 1 }, careerYears: { gte: 5 } } },
    slots: { record: [`days as champion`, `successful defenses`, `title reigns in a single year`], form: [`a handwritten note`, `a sheepish hallway conversation`, `a careful message sent through the office`] },
    body: [`The record books are about to change, and {youngster.name} knows it. Through {form}, {youngster.first} approaches you. "I think I am going to take your mark in {record}," {youngster.first} says. "I wanted to ask whether you mind."`, `A record is a strange thing, a number that stands in for years of work and a few lucky nights. Giving it up gracefully might be the hardest match you ever have to work.`],
    choices: [
      { id: 'bless', label: `Give {youngster.first} your blessing, freely and without conditions`, risk: 'low', result: `Hands are shaken, and {youngster.first} hears that records exist to be taken. The words cost you something real, and {youngster.first} looks as though a weight has been lifted from both of you.`, effects: [{ rel: { who: 'youngster', respect: 9, affinity: 8, trust: 5 } }, { conf: -2 }, { pop: 0.3 }] },
      { id: 'earn', label: `Tell {youngster.first} to take it from you in the ring`, risk: 'med', result: `The challenge is made in the hallway and accepted before the echo dies out. You get a fight worth watching and a rivalry with a clear purpose.`, effects: [{ booking: { who: 'youngster', type: 'singles' } }, { rivalry: { who: 'youngster', heat: 10 } }, { pop: 0.5 }, { fatigue: 6 }] },
      { id: 'mine', label: `Remind {youngster.first} whose name was on the number first`, risk: 'med', result: `The reply comes out colder than you meant, and {youngster.first} takes it with a polite, stiff nod. You protect the record for a little longer and lose something you cannot quite name.`, effects: [{ rel: { who: 'youngster', respect: -4, affinity: -6 } }, { conf: 2 }, { pop: -0.2 }] },
      { id: 'advice', label: `Offer to coach {youngster.first} through the chase`, risk: 'med', result: `Evenings go to film sessions and long talks about pacing and pressure. When the record falls it is partly your handwriting in the margins, and that is a strange, quiet pride.`, effects: [{ rel: { who: 'youngster', trust: 7, respect: 5 } }, { fatigue: 8 }, { conf: 2 }, { attr: { name: 'psychology', delta: 1 } }] },
    ],
  },
  {
    id: 'ne_leg_time_capsule', category: 'legacy', title: `A Letter for {reader}`, weight: 1, contexts: ['weekly', 'offseason'], cooldownDays: 400, maxPerCareer: 1, categoryCooldown: 10,
    trigger: { stat: { careerYears: { gte: 4 }, popularity: { gte: 25 } } },
    slots: { reader: [`a wrestler twenty years from now`, `a kid who has not been born yet`, `whoever finds this when the building comes down`], container: [`a steel box behind the concession stand`, `a glass case in the arena lobby`, `a locked cabinet at the training school`] },
    body: [`The venue is sealing a time capsule in {container}, and every wrestler on the card has been asked to write a letter. Yours is addressed to {reader}, and it must fit on a single sheet of paper.`, `You sit in a plastic chair at the back of the room with a borrowed pen and realize how little you have ever said out loud about the job. Whatever you write will be waiting long after your knees are gone.`],
    choices: [
      { id: 'truth', label: `Write an honest letter about the fear and the joy`, risk: 'med', result: `The page fills with the dread before the curtain, the nights you almost quit and the single minute in a hundred that makes it all worth it. Folding it into the envelope, you feel strangely lighter.`, effects: [{ conf: 5 }, { fatigue: 3 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'funny', label: `Write something funny and irreverent`, risk: 'low', result: `Your letter is mostly jokes, a tip about hotel coffee and one line in capitals: "BEWARE THE SECOND ROPE." The staff laugh out loud while reading it, and you never find out whether the future will.`, effects: [{ charisma: 1 }, { pop: 0.3 }, { conf: 1 }] },
      { id: 'token', label: `Pay to add a framed locker-room photo beside it`, risk: 'low', requires: { stat: { money: { gte: 500 } } }, result: `A local framer mounts a photograph of the whole locker room, and you slide it in beside the letter. It will sit in the dark for decades, and the faces in it will never be older than they are today.`, effects: [{ money: -500 }, { conf: 3 }, { pop: 0.4 }] },
      { id: 'decline', label: `Hand the pen back: you are no good at this sort of thing`, risk: 'low', result: `The pen goes back with an apologetic smile, and the organizer waits a moment, then moves on. You tell yourself it is nothing, and carry the empty page in your head all night.`, effects: [{ conf: -3 }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'ne_leg_memorial_speech', category: 'legacy', title: `A Farewell to {departed}`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 10,
    trigger: { stat: { careerYears: { gte: 8 } } },
    slots: { departed: [`a veteran referee`, `an old ring announcer`, `a retired trainer`], room: [`a funeral home chapel`, `a hotel ballroom with the chairs set in rows`, `the ring, with the lights turned low`] },
    body: [`The business has lost {departed}, one of those people whose name never sat on a poster and who held up half the building. The family has asked you to say a few words in {room}, because their loved one spoke of you more than once.`, `Nobody has told you what to say. You have a handful of memories, a dry mouth and a deep understanding that wrestlers are very good at pretending and very bad at grief.`],
    choices: [
      { id: 'heart', label: `Speak plainly from the heart`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, confidence: 0.3 }, text: `The words are about the small, steady kindnesses that no camera ever caught. By the end half the room is crying and the other half is nodding, and the family holds your hand afterward.`, effects: [{ pop: 0.5 }, { conf: 4 }, { fatigue: 4 }] },
        { weight: 1, text: `Two sentences go by before your voice cracks and the third never arrives. The family hugs you anyway, and you cry in the parking lot.`, effects: [{ pop: 0.1 }, { conf: -1 }, { fatigue: 4 }] } ] },
      { id: 'funny', label: `Tell the funniest story you know about the person`, risk: 'med', result: `The room begins in tentative silence, then finds the joke and laughs through its tears. It is exactly what the person would have wanted, and the family tells you so afterward: "They would have loved that."`, effects: [{ conf: 3 }, { charisma: 1 }, { pop: 0.3 }] },
      { id: 'bell', label: `Organize a ten-bell salute at the next show`, risk: 'low', requires: { stat: { money: { gte: 300 } } }, result: `The moment is arranged with the ring crew and the office, and the arena stands with its hands together. The tribute costs a few phone calls and a hundred small favors, and nobody forgets it.`, effects: [{ money: -300 }, { pop: 0.6 }, { conf: 3 }, { fatigue: 4 }] },
      { id: 'flowers', label: `Send flowers and a card, and stay on the road`, risk: 'low', result: `The card is sincere and the flowers are large, and you honor the person from a hotel bed three states away. It is the practical choice, and it is not what you would have wanted done for you.`, effects: [{ money: -200 }, { conf: -4 }, { fatigue: -2 }] },
    ],
  },
  // ======================= TRAVEL =======================
  {
    id: 'ne_trv_one_car_left', category: 'travel', title: `Only One Car Left at the Counter`, weight: 1.5, contexts: ['weekly', 'pre_show'], cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 6,
    cast: { mate: { pick: 'roster', tier: { lte: 3 }, sameBrand: true } }, memory: { role: 'mate', max: 1 },
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { car: [`a minivan with a child seat still bolted in`, `a bright yellow hatchback`, `a pickup truck three sizes too large`, `a compact in which your gym bag has to ride on your lap`], clerk: [`a clerk who recognizes you and will not stop talking`, `a clerk who has never heard of wrestling and does not intend to start`, `one tired clerk at the head of a line of forty people`] },
    body: [`The company booked one rental for the two of you, and at the counter {mate.name} watches in patient horror as {clerk} slides over the keys. The only vehicle left on the lot is {car}, and the show starts in four hours.`, `Neither of you wants to be the one who complains first. Somewhere out there is a rival heel in a perfectly good sedan.`],
    choices: [
      { id: 'embrace', label: `Take it and turn the drive into a running bit`, risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `By the second hour you and {mate.first} have invented a feud, a theme song and a fictional manager. The laughter ruins your abs and builds a bond that survives the next three towns.`, effects: [{ rel: { who: 'mate', affinity: 8, trust: 4 } }, { conf: 3 }, { fatigue: 4 }] },
        { weight: 1, text: `The bit dies by the gas station, and the rest of the drive is silent, cramped and faintly resentful. You both agree never to speak of it.`, effects: [{ rel: { who: 'mate', affinity: -2 } }, { fatigue: 7 }] } ] },
      { id: 'wait', label: `Wait for a better car to be returned`, risk: 'low', result: `Ninety minutes pass on a plastic chair, watching other people's lives go through the revolving door. The car you eventually get is better, and you arrive at the building with ten minutes to spare and a headache.`, effects: [{ fatigue: 9 }, { conf: -1 }, { rel: { who: 'mate', trust: -2 } }] },
      { id: 'split', label: `Pay for separate rides and meet at the arena`, risk: 'low', result: `A rideshare takes you across town for a price that makes your stomach hurt, and you spend the drive to yourself. It is quick, calm and slightly lonely, and you wonder how {mate.first} is getting on with the car.`, effects: [{ money: -180 }, { fatigue: -3 }, { rel: { who: 'mate', affinity: -3 } }] },
      { id: 'let_drive', label: `Let {mate.first} take the wheel and nap in the back`, risk: 'med', result: `Two hours of sleep come with your knees against the seat, and you wake to the sunset and a grinning driver. "You owe me," {mate.first} says cheerfully, and keeps a mental tally.`, effects: [{ fatigue: -8 }, { rel: { who: 'mate', trust: 5 } }, { conf: 1 }, { money: -60 }] },
    ],
  },
  {
    id: 'ne_trv_hotel_gym', category: 'travel', title: `The Hotel Gym at {hour}`, weight: 1.5, contexts: ['weekly', 'pre_show'], cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 6,
    cast: { vet: { pick: 'roster', tier: { gte: 2 }, sameBrand: true } }, memory: { role: 'vet', max: 1 },
    trigger: { stat: { careerYears: { lte: 12 } } },
    slots: { hour: [`5:10 in the morning`, `just after midnight`, `six on a gray Sunday`], gear: [`a single rusty dumbbell rack`, `two treadmills and a sticky mat`, `a bench with a cracked pad`] },
    body: [`The hotel gym is the size of a motel room and holds {gear}. Alone among the machines, {vet.name} is working through a routine that looks decades old, grunting quietly and never looking up.`, `There is no audience, no agent and no cameras, only two people who do the same strange job and know how little they say to each other about it. A door like that rarely opens twice.`],
    choices: [
      { id: 'train', label: `Ask whether you can train together`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.3 }, text: `{vet.first} grunts yes and hands you a weight without a word. An hour later you are both wrecked, and a few phrases have passed between you that no producer will ever hear.`, effects: [{ rel: { who: 'vet', respect: 6, affinity: 5 } }, { attr: { name: 'endurance', delta: 1 } }, { fatigue: 10 }, { conf: 2 }] },
        { weight: 1, text: `The silence in the room is the answer. You do your set in a corner while {vet.first} pretends to be alone, and you leave feeling like you interrupted a private moment.`, effects: [{ rel: { who: 'vet', respect: -2 } }, { conf: -2 }, { fatigue: 5 }] } ] },
      { id: 'ask_advice', label: `Ask how {vet.first} has lasted this long`, risk: 'med', result: `The answer is shorter than you hoped and longer than you expected. "Sleep, protein, call home," {vet.first} says. "And never take the last bump of the night." You write it on a hotel notepad and keep it for years.`, effects: [{ rel: { who: 'vet', trust: 5 } }, { conf: 3 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 3 }] },
      { id: 'space', label: `Nod hello, do your work in the corner and leave quietly`, risk: 'low', result: `A nod passes between you and nothing more, and the hour is spent in comfortable parallel silence. It is peaceful and a bit forgettable, and the door stays closed.`, effects: [{ fatigue: 5 }, { conf: 1 }, { attr: { name: 'endurance', delta: 1 } }] },
      { id: 'sleep_in', label: `Skip the gym and sleep through the alarm`, risk: 'low', result: `The alarm goes off and you roll over without shame. The extra hour is worth more than any bench press, though the building keeps a quiet list of who shows up.`, effects: [{ fatigue: -9 }, { conf: -1 }] },
    ],
  },
  {
    id: 'ne_trv_customs_line', category: 'travel', title: `Held Up at the Border With {item}`, weight: 1.5, contexts: ['weekly', 'pre_show'], cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 6,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { stat: { careerYears: { gte: 2 } }, minYear: 1995 },
    slots: { item: [`a championship-style belt`, `a bag of unlabeled tape and braces`, `a suitcase of costume props`], officer: [`a bored officer`, `a stern officer who has never heard of wrestling`, `a young officer who is secretly a fan`] },
    body: [`Your bag has been pulled aside, and {officer} is staring at {item} with the expression of someone doing arithmetic. "What is this for?" the officer asks. The line behind you is growing and the connecting flight is boarding in forty minutes.`, `You explain, slowly and clearly, that this is a normal part of a job that has no normal parts. The officer has a form, and you have a flight.`],
    choices: [
      { id: 'patient', label: `Explain patiently and answer every question`, risk: 'low', outcomes: [
        { weight: 2, text: `The questions are dull, the answers are simple, and the bag is released with a sigh. You sprint the terminal and make the gate as the door closes, wheezing and absurdly proud.`, effects: [{ fatigue: 7 }, { conf: 2 }] },
        { weight: 1, text: `The explanation takes so long that the plane leaves without you. The rebooking costs money and sleep, and you reach the town after the doors have opened.`, effects: [{ money: -350 }, { fatigue: 11 }, { conf: -2 }] } ] },
      { id: 'bit', label: `Lean into the character and let the officer see the show`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.6 }, text: `The officer breaks into a grin halfway through your promo and waves the bag on, asking for a signature on the back of the form. You walk away laughing with a story that will last for years.`, effects: [{ pop: 0.3 }, { charisma: 1 }, { conf: 3 }, { fatigue: 3 }] },
        { weight: 1, text: `The performance lands badly. The officer opens every compartment in the bag, one by one, and you miss your connection watching the officer do it.`, effects: [{ money: -300 }, { conf: -3 }, { fatigue: 9 }] } ] },
      { id: 'call_agent', label: `Phone {agent.first} and ask the company to step in`, risk: 'low', result: `{agent.first} makes two calls from a hotel bed and the paperwork appears like magic. It costs a favor you might want later, and you board feeling coddled and grateful.`, effects: [{ conf: -1 }, { fatigue: 2 }, { money: -100 }] },
      { id: 'ship', label: `Ship the extra gear home and travel light`, risk: 'med', result: `A courier takes the problem and the props away. The bag is cleared in minutes and the flight is easy, but you work the next three shows without a favorite piece of gear.`, effects: [{ money: -400 }, { pop: -0.2 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'ne_trv_snowed_in', category: 'travel', title: `The Show Goes On Through {storm}`, weight: 2, major: true, contexts: ['show_day', 'pre_show'], cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 6,
    trigger: { month: [12, 1, 2, 3], stat: { careerYears: { gte: 1 } } },
    slots: { storm: [`a blizzard`, `an ice storm`, `a flood warning`], crowd: [`two hundred people who walked in`, `fewer than a hundred stalwarts`, `the ring crew's families and a handful of farmers`] },
    body: [`The roads are closed to anything sensible, but the show goes on in an arena that is mostly empty. The audience is {crowd}, wrapped in coats and clutching bags of popcorn, and the building echoes when anyone sneezes.`, `Everyone in the locker room is arguing quietly about whether to cut the card short. The crowd, meanwhile, has already decided that they came, they stayed and they expect to be entertained.`],
    choices: [
      { id: 'best_ever', label: `Give the small crowd the show of their lives`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.5, charisma: 0.4 }, text: `The match is worked like a title bout in a sold-out stadium, and the stragglers in their winter coats stand and scream. "Best night of my life," someone bellows from the second row. In the shower afterward you realize this is the kind of night you will talk about in thirty years.`, effects: [{ pop: 0.7 }, { conf: 5 }, { fatigue: 12 }] },
        { weight: 1, text: `The cold floor bites into your joints and the match is sloppy despite the effort. The crowd is kind, and your knee reminds you of it the next morning.`, effects: [{ pop: 0.2 }, { conf: -1 }, { fatigue: 12 }, { injury: { part: 'legs', severity: 1, days: 7 } }] } ] },
      { id: 'cut_short', label: `Cut the match short so everyone can get home safely`, risk: 'low', result: `Ten tidy minutes pass, then a wave to the stands before the roads get worse. The crowd claps, the crew sighs with relief, and you pass a slick overpass an hour earlier than you would have.`, effects: [{ fatigue: 3 }, { pop: -0.1 }, { conf: 1 }] },
      { id: 'sign_all', label: `Stay late and sign for every person who came`, risk: 'low', result: `The line moves slowly and the crowd is delighted and chatty, trading stories about wrestlers you have never met. By midnight your hand is numb and your heart is full, and the roads are worse.`, effects: [{ pop: 0.5 }, { conf: 3 }, { fatigue: 9 }, { money: -100 }] },
      { id: 'drive_on', label: `Leave right after the match to make tomorrow's show`, risk: 'high', outcomes: [
        { weight: 2, text: `The drive is white-knuckle and slow, and you arrive at dawn with your jaw aching from clenching. Tomorrow's show is on time, and you feel unreasonably tough.`, effects: [{ fatigue: 15 }, { conf: 2 }, { pop: 0.2 }] },
        { weight: 1, text: `The car slides on a slick patch of road and ends up in a ditch, safe but stuck. A tow truck charges triple, and you reach the next arena after the bell.`, effects: [{ money: -650 }, { fatigue: 15 }, { conf: -4 }, { pop: -0.3 }] } ] },
    ],
  },
  {
    id: 'ne_trv_seatmate', category: 'travel', title: `The Passenger Next to You Does Not Know Who You Are`, weight: 1.5, contexts: ['weekly', 'show_day'], cooldownDays: 200, maxPerCareer: 3, categoryCooldown: 6,
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { seatmate: [`a nervous flyer gripping the armrest`, `a sleepy salesman with a loosened tie`, `a child flying alone with a paper tag on a lanyard`], hour: [`a red-eye over the middle of the country`, `the last flight of the night`, `a puddle-jumper in bumpy weather`] },
    body: [`The middle seat on {hour} is occupied by {seatmate}, who has no idea you do this for a living. Turbulence arrives, and the stranger's face drains of color.`, `You have spent the week being recognized, resented and admired, and it is odd to be a plain person with a plain bag. For an hour, you are only the human on the other side of an armrest.`],
    choices: [
      { id: 'talk_down', label: `Talk them through the turbulence`, risk: 'low', result: `A long, boring story about your first flight comes out of you, then another, and the knuckles on the armrest slowly relax. When the wheels touch down the stranger whispers, "Thank you," with wet eyes, and you realize you feel better than you have in a month.`, effects: [{ conf: 4 }, { fatigue: 2 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'sleep', label: `Put in earplugs and sleep: you need it`, risk: 'low', result: `Unconsciousness arrives before the wheels leave the ground, which is a skill you earned the hard way. The landing is smooth and the stranger watches you with envy.`, effects: [{ fatigue: -9 }, { conf: -1 }] },
      { id: 'reveal', label: `Mention what you do for a living, just to make conversation`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The stranger lights up and asks a hundred questions about your favorite spot, the worst injury and whether it is real. You answer everything and enjoy it more than you expected.`, effects: [{ pop: 0.3 }, { conf: 2 }, { fatigue: 4 }] },
        { weight: 1, text: `The stranger is unimpressed and a little alarmed, and clutches the armrest even tighter. The next ninety minutes pass in a very polite silence.`, effects: [{ conf: -2 }, { fatigue: 2 }] } ] },
      { id: 'swap', label: `Swap to the aisle so they can have the window`, risk: 'low', result: `Folded into an aisle seat with your usual stiff knees, you perform a small kindness that costs a little and shows nowhere. The stranger smiles for the first time, and you hobble off the plane stiffer than usual.`, effects: [{ fatigue: 6 }, { conf: 3 }, { injury: { part: 'legs', severity: 1, days: 3 } }] },
    ],
  },
  {
    id: 'ne_trv_lost_bag', category: 'travel', title: `The Airline Lost Your {missing}`, weight: 2, contexts: ['pre_show', 'show_day'], cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 6,
    cast: { lender: { pick: 'roster', tier: { lte: 3 }, sameBrand: true } }, memory: { role: 'lender', max: 1 },
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { missing: [`boots`, `ring jacket`, `entire gear bag`], city: [`a city three states away`, `an airport you have never been to`, `a baggage carousel in a time zone you do not live in`] },
    body: [`The airline cheerfully informs you that your {missing} ended up in {city}, and may be home by Thursday. The show is tonight, and you are standing in a baggage hall holding only a toothbrush and a grudge.`, `A wrestler without gear is a person in street clothes yelling at strangers. {lender.name} overhears the problem in the corridor and says nothing, which is rarely a good sign.`],
    choices: [
      { id: 'borrow', label: `Borrow gear from {lender.first}`, risk: 'low', result: `The boots fit like handcuffs and the outfit is two sizes wrong, but the crowd cannot tell. {lender.first} grins at the sight of you in borrowed colors. "You owe me a beer," {lender.first} says.`, effects: [{ rel: { who: 'lender', trust: 6, affinity: 5 } }, { pop: -0.1 }, { conf: -1 }] },
      { id: 'buy', label: `Buy emergency gear from the mall`, risk: 'low', result: `A kid at a sporting-goods counter sells you boots, tape and an outfit that looks like laundry. It costs real money, and you wear them like a costume you do not believe in.`, effects: [{ money: -450 }, { pop: -0.2 }, { conf: -2 }, { fatigue: 4 }] },
      { id: 'character', label: `Work the show in street clothes and make it the story`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, mic: 0.3 }, text: `Out comes a walk in jeans and a hotel towel, and the crowd hears that the airline has declared war on you personally. They roar, and the match becomes the funniest thing on the card.`, effects: [{ pop: 0.9 }, { charisma: 1 }, { conf: 3 }, { fatigue: 5 }] },
        { weight: 1, text: `The bit falls flat, and a producer decides that you look ridiculous. You finish the match in torn jeans and listen to a lecture about professionalism all the way to the airport.`, effects: [{ pop: -0.4 }, { conf: -4 }, { fatigue: 5 }] } ] },
      { id: 'sit_out', label: `Ask to be pulled from tonight's card`, risk: 'med', result: `The office grumbles but finds a replacement, and you spend the evening in the hotel bar eating cold fries and calling the baggage desk every hour. The bag arrives at dawn, and so does the memo.`, effects: [{ money: -700 }, { fatigue: -6 }, { pop: -0.4 }, { conf: -2 }] },
    ],
  },
  {
    id: 'ne_trv_solo_drive', category: 'travel', title: `Mile Marker 340 at {hour}`, weight: 1.5, contexts: ['weekly', 'post_show'], cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 6,
    trigger: { stat: { fatigue: { gte: 50 }, careerYears: { lte: 15 } } },
    slots: { hour: [`three in the morning`, `the dead of night`, `the gray hour before dawn`], radio: [`a late-night sports show arguing about your business`, `a station fading into static`, `a preacher whose sermon is somehow about last-minute substitutes`] },
    body: [`The road runs flat and straight for as far as the headlights can see, and the dashboard clock reads {hour}. You are three hours from a bed and two songs from sleep, with {radio} the only company you have.`, `Your eyelids have developed their own opinion on the matter. This is the most dangerous moment of the job and nobody ever puts it on the poster.`],
    choices: [
      { id: 'pull_over', label: `Pull over and take a real nap`, risk: 'low', result: `A truck-stop lot receives the car, and forty minutes of sleep come in a seat that was never meant for it. You wake stiff, guilty about the lost time and enormously relieved to be alive.`, effects: [{ fatigue: -10 }, { money: -60 }, { conf: 1 }] },
      { id: 'push', label: `Push on: you can make the hotel`, risk: 'high', outcomes: [
        { weight: 2, text: `Gripping the wheel and singing badly, you make it by dawn with a heart full of caffeine. The sleep you lose will be collected with interest tomorrow.`, effects: [{ fatigue: 14 }, { conf: 1 }] },
        { weight: 1, text: `The rumble strip wakes you at fifty-five miles an hour, and for a moment the world is only noise and adrenaline. You make it to the hotel with shaking hands and a promise that you will never do that again.`, effects: [{ fatigue: 14 }, { conf: -4 }, { money: -280 }] } ] },
      { id: 'call', label: `Call someone and stay on the line`, risk: 'low', result: `A sleepy voice picks up on the fourth ring. "Where are you?" it asks, and then talks about nothing for an hour: a dog's diet, a neighbor's fence. The conversation is gentle and a bit silly, and you reach the hotel with your head clear and your throat hoarse.`, effects: [{ fatigue: 6 }, { conf: 3 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'diner', label: `Pull into the next diner for pie and a long coffee`, risk: 'low', result: `A waitress in a faded apron refills your cup without being asked and watches the road with you. You lose an hour and a wad of cash and gain a story, a full stomach and a steadier hand.`, effects: [{ money: -40 }, { fatigue: -4 }, { conf: 2 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'ne_trv_island_hall', category: 'travel', title: `A Show at the End of {route}`, weight: 1.5, contexts: ['weekly', 'show_day'], cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 6,
    trigger: { stat: { careerYears: { gte: 2 } } },
    slots: { route: [`a ferry route`, `a gravel road`, `a prop-plane runway`], hall: [`a volunteer fire hall`, `a community center with a basketball hoop`, `a school gym that smells of floor wax`] },
    body: [`Getting to the booking took half a day, and the venue turns out to be {hall} in a town where every person in the audience knows every other. The ring is borrowed, the lights are borrowed and the folding chairs have been arranged by a committee.`, `They have been waiting for months, and a hand-painted banner spans the wall with your name misspelled in careful letters. It is the kind of crowd that never gets a wrestler and treats you accordingly.`],
    choices: [
      { id: 'epic', label: `Wrestle a long, generous match for the whole town`, risk: 'med', result: `Nineteen minutes on a ring that wobbles go by, and the audience gasps at every kick. Afterward an old man grips your hand. "Best thing I have seen in years," he says, and means it.`, effects: [{ pop: 0.5 }, { conf: 5 }, { fatigue: 11 }] },
      { id: 'kids', label: `Spend an hour with the children before the show`, risk: 'low', result: `A dozen kids climb the ropes, learn a headlock and take turns on the microphone. You miss the pre-show meal and gain a new gift of a drawing that is mostly teeth.`, effects: [{ conf: 4 }, { fatigue: 7 }, { pop: 0.3 }] },
      { id: 'banner', label: `Buy the banner from the committee and pay for the damage`, risk: 'low', requires: { stat: { money: { gte: 300 } } }, result: `Three hundred dollars go into the treasurer's hand, and the committee insists on putting it toward the hall's roof fund. The banner rides home in the car for years.`, effects: [{ money: -300 }, { conf: 3 }, { pop: 0.3 }] },
      { id: 'quick', label: `Do the minimum and keep your schedule`, risk: 'low', result: `A short, tidy match, then the long way back. The town claps politely, a little puzzled, and you feel the small judgment of a banner that says your name wrong.`, effects: [{ fatigue: 3 }, { conf: -3 }, { pop: -0.2 }] },
    ],
  },
  // ======================= TRAINING =======================
  {
    id: 'ne_trn_midnight_ring', category: 'training', title: `Ten Minutes in an Empty Ring`, weight: 1.5, contexts: ['post_show'], cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 5,
    trigger: { stat: { careerYears: { lte: 12 } }, injured: false },
    slots: { move: [`a corner dropkick`, `a springboard crossbody`, `a back-body drop that has been bothering you`], watcher: [`the ring crew leaning on a road case`, `a security guard rattling a ring of keys`, `a janitor sweeping around the barricade`] },
    body: [`The arena is empty and the lights are half off, and {watcher} would like very much to take the ring down. You have asked for ten minutes to rehearse {move}, which has gone wrong three nights in a row.`, `Only silence and the creak of ropes answer you. A single clean repetition in an empty room is a strange kind of private victory.`],
    choices: [
      { id: 'grind', label: `Repeat it until it is clean, however long it takes`, risk: 'med', outcomes: [
        { weight: 2, bonus: { agility: 0.4, overall: 0.3 }, text: `On the thirtieth try the movement locks into place, and your body suddenly remembers how. You walk out with sore hips and a feeling of having cheated the clock.`, effects: [{ attr: { name: 'agility', delta: 1 } }, { fatigue: 11 }, { conf: 4 }] },
        { weight: 1, text: `By the fortieth repetition your timing is worse than when you started, and something in your lower back tightens. The crew taps their watches, kindly but firmly.`, effects: [{ fatigue: 11 }, { conf: -2 }, { injury: { part: 'torso', severity: 1, days: 6 } }] } ] },
      { id: 'film', label: `Prop up a camera and study the footage between reps`, risk: 'low', result: `The footage is humbling and useful, and you find the mistake in under five minutes: a foot that moves a half-second too early. You fix it and sleep better than you have in weeks.`, effects: [{ attr: { name: 'technical', delta: 1 } }, { fatigue: 5 }, { conf: 2 }] },
      { id: 'ask_crew', label: `Ask the crew what they see from the floor`, risk: 'low', result: `One of them has watched ten thousand matches from the apron. "You drop your eyes right before you jump," the crew member says, something no coach ever caught. It costs a coffee and an apology for keeping them late.`, effects: [{ money: -40 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 4 }, { conf: 2 }] },
      { id: 'give_up', label: `Call it a night: your body needs sleep more than reps`, risk: 'low', result: `The ring goes back to the crew with a half-smile, and the move stays broken for another week. Your muscles are grateful, and your pride less so.`, effects: [{ fatigue: -8 }, { conf: -2 }] },
    ],
  },
  {
    id: 'ne_trn_wind_test', category: 'training', title: `The Conditioning Test`, weight: 1.5, cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 5,
    cast: { coach: { pick: 'staff', role: 'coach' } },
    trigger: { stat: { careerYears: { lte: 15 } } },
    slots: { test: [`a twenty-minute continuous drill`, `a shuttle run timed to the bell`, `a round of sprawls and sprints with no rest`], flaw: [`you are gasping by the eighth minute`, `your legs fail long before your lungs do`, `your hands drop whenever you are tired`] },
    body: [`{coach.name} sets up {test} with a stopwatch and a face that gives nothing away. By the end, the numbers on the clipboard confirm something you already suspected: {flaw}.`, `A wrestler can hide a weakness for a few minutes, but never for a full television hour. The coach slides the sheet across the table. "Read it," {coach.first} says. "Then tell me it is wrong."`],
    choices: [
      { id: 'double', label: `Double your conditioning work for the next month`, risk: 'med', result: `Mornings of running, skipping rope and sweating feel like punishment. By the end of the month the numbers have moved and you are a different person, if a very tired one.`, effects: [{ attr: { name: 'endurance', delta: 2 } }, { fatigue: 14 }, { conf: 3 }] },
      { id: 'style', label: `Change your style to rest in the match`, risk: 'low', result: `Rest holds, slower pacing and big spots get built into your matches. The crowd loves the drama, and your lungs love the breaks, but the pace of your work slips a notch.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { pop: -0.1 }, { fatigue: -3 }] },
      { id: 'plan', label: `Hire the coach to build a proper plan`, risk: 'low', requires: { stat: { money: { gte: 500 } } }, result: `{coach.first} drafts a plan that includes sleep, food and a schedule that actually accounts for travel. The price is steep and the plan is realiztic, and the first week is a revelation.`, effects: [{ money: -500 }, { attr: { name: 'endurance', delta: 1 } }, { fatigue: -4 }, { conf: 3 }] },
      { id: 'shrug', label: `Shrug it off: the test is not the match`, risk: 'med', result: `Into a pocket goes the sheet, and you tell yourself the numbers lie. In a week you gas out in a six-minute match, and the lie gets harder to believe.`, effects: [{ conf: -3 }, { fatigue: 6 }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'ne_trn_bump_fear', category: 'training', title: `The Bump You Are Scared Of`, weight: 2, major: true, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 5,
    cast: { coach: { pick: 'staff', role: 'coach' } },
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { move: [`a splash from the top rope`, `a bump from the apron to the floor`, `a piledriver you have only watched`], help: [`a patient coach`, `three rookies holding a crash mat`, `a stack of gym mats three high`] },
    body: [`The idea has been in your head for weeks, and tonight you stand at the edge of the ring looking at {move}. Below, {help} waits, and the whole gym has gone quietly attentive, the way a room does when someone is about to be brave.`, `"Fear is information," {coach.first} calls up from the floor. It is how you stay alive, and the question is whether it is a warning or a wall.`],
    choices: [
      { id: 'attempt', label: `Take the bump tonight and get it over with`, risk: 'high', outcomes: [
        { weight: 2, bonus: { toughness: 0.4, confidence: 0.4 }, text: `The jump comes, the world inverts, and the mat hits you like a handshake. You lie there laughing with your ears ringing, realizing the wall was only paper.`, effects: [{ attr: { name: 'toughness', delta: 1 } }, { conf: 6 }, { fatigue: 8 }] },
        { weight: 1, text: `The landing goes wrong, with a crack that is mostly in the mat but partly in you. Nothing is broken, but your shoulder is going to be furious for a week.`, effects: [{ conf: -3 }, { fatigue: 8 }, { injury: { part: 'arms', severity: 1, days: 8 } }] } ] },
      { id: 'drill', label: `Break it into smaller steps and work up to it over weeks`, risk: 'low', result: `The fall gets practiced from a foot, then two, then a stack of mats, with arithmetic trusted more than courage. By the end of the month the big version is only slightly terrifying.`, effects: [{ attr: { name: 'toughness', delta: 1 } }, { fatigue: 7 }, { conf: 3 }] },
      { id: 'drop', label: `Drop the idea: you can build a career without it`, risk: 'low', result: `Down the ladder you go, and the fear wins. The relief is sweet for a day, and then slowly turns into a small ache whenever somebody else lands what you could not.`, effects: [{ conf: -4 }, { fatigue: -3 }] },
      { id: 'vet_help', label: `Ask a veteran to walk you through the landing`, risk: 'med', result: `A veteran comes in on a Sunday and shows you where to put your chin and how to breathe out through the hit. The advice is precise and a little brutal, and you thank them with an uncomfortable amount of lunch.`, effects: [{ money: -80 }, { attr: { name: 'toughness', delta: 1 } }, { conf: 3 }, { fatigue: 5 }] },
    ],
  },
  {
    id: 'ne_trn_vet_morning', category: 'training', title: `Invited to the {hour} Crew`, weight: 1.5, contexts: ['weekly', 'pre_show'], cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 5,
    cast: { vet: { pick: 'roster', tier: { gte: 3 }, sameBrand: true } }, memory: { role: 'vet', max: 1 },
    trigger: { stat: { careerYears: { lte: 10 } } },
    slots: { hour: [`6 a.m.`, `Dawn`, `Pre-Sunrise`], rule: [`no excuses`, `no complaints`, `the youngest buys coffee`] },
    body: [`{vet.name} leans on the lockers and says, almost carelessly, "A few of us train before the sun is up. Room for one more." The only rule is {rule}, and the invitation is gone as soon as it is spoken.`, `This is a quiet honor dressed up as a casual remark. A seat at that table is worth more than a week of television time, and it costs a month of mornings.`],
    choices: [
      { id: 'join', label: `Show up every morning for a month`, risk: 'med', result: `The mornings are brutal, the veterans are laconic, and your body has never been so tired. By the end of the month you have been taught five things no textbook contains, and you know how to fold a towel properly.`, effects: [{ rel: { who: 'vet', respect: 8, affinity: 5 } }, { attr: { name: 'endurance', delta: 1 } }, { fatigue: 13 }, { conf: 3 }] },
      { id: 'once', label: `Come once, say thanks, and go back to your own routine`, risk: 'low', result: `Respects are paid, a lap is taken, and a polite exit follows. The door remains open, but it is the kind of open that slowly stops being a door.`, effects: [{ rel: { who: 'vet', respect: 2 } }, { fatigue: 6 }, { conf: 1 }] },
      { id: 'bring', label: `Bring two rookies along with you`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The vets grunt and shrug, then start correcting the rookies with brutal fondness. You become the person who brought the future to the table, and that is worth remembering.`, effects: [{ rel: { who: 'vet', respect: 5, trust: 4 } }, { fatigue: 9 }, { conf: 3 }] },
        { weight: 1, text: `The rookies talk too much and ask questions with the wrong tone, and the vets' faces tighten. The invitation is quietly withdrawn by the end of the week.`, effects: [{ rel: { who: 'vet', respect: -5 } }, { fatigue: 7 }, { conf: -3 }] } ] },
      { id: 'decline', label: `Turn it down: you need your sleep`, risk: 'low', result: `Something about a hip and a schedule gets mumbled. The vets accept it with a nod, and you will never know what the table would have taught you.`, effects: [{ fatigue: -7 }, { conf: -2 }, { rel: { who: 'vet', respect: -2 } }] },
    ],
  },
  {
    id: 'ne_trn_partner_hurt', category: 'training', title: `{partner.name} Went Down in the {session}`, weight: 2, major: true, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 5,
    cast: { partner: { pick: 'roster', tier: { lte: 2 }, sameBrand: true } }, memory: { role: 'partner', max: 1 },
    trigger: { stat: { careerYears: { gte: 2 } } },
    slots: { session: [`sparring session`, `rushed morning drill`, `late-night run-through`], injury: [`a split lip`, `a jammed shoulder`, `a cracked rib`] },
    body: [`The move was clean and then it was not, and {partner.name} is on the mat with {injury}, staring at the ceiling. The gym is very quiet, and someone has gone to find the medical kit.`, `It was nobody's fault, and it was yours, because you were the one holding the other end. In this business those two things sit side by side without arguing.`],
    choices: [
      { id: 'stay', label: `Stay by {partner.first} all the way to the clinic`, risk: 'low', result: `Doors get held and the nurse's questions get answered, and then comes a long wait until the fluorescent lights hum you to sleep. {partner.first} says nothing on the way back, then at the curb squeezes your arm. "Not your fault," {partner.first} says.`, effects: [{ rel: { who: 'partner', trust: 9, affinity: 7 } }, { fatigue: 8 }, { conf: -1 }] },
      { id: 'train_on', label: `Keep training so your head doesn't get loud`, risk: 'med', result: `Two hours of drilling alone pass, calm and merciless, until your hands stop shaking. The work is good and the silence it creates is not, and {partner.first} hears about it by evening.`, effects: [{ rel: { who: 'partner', trust: -6, affinity: -4 } }, { attr: { name: 'technical', delta: 1 } }, { fatigue: 9 }, { conf: 1 }] },
      { id: 'own_it', label: `Take the blame publicly in front of the whole gym`, risk: 'med', result: `The room hears that it was your mistake, plainly and without excuse. The coach nods slowly, the room breathes out, and {partner.first} later tells the story differently, in your favor.`, effects: [{ rel: { who: 'partner', respect: 7, trust: 5 } }, { conf: -3 }, { pop: 0.1 }] },
      { id: 'check', label: `Pay the clinic bill and send a care package`, risk: 'low', requires: { stat: { money: { gte: 800 } } }, result: `At the front desk, the invoice is settled before anyone can argue, and soup and a card are left on the porch. It is a clumsy, generous gesture, and it lands well.`, effects: [{ money: -800 }, { rel: { who: 'partner', trust: 6, respect: 4 } }, { conf: 2 }] },
    ],
  },
  {
    id: 'ne_trn_finisher_trial', category: 'training', title: `A New Finisher Meets the Crowd`, weight: 1.5, contexts: ['post_match'], cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 5,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { stat: { careerYears: { gte: 2 }, matches: { gte: 15 } } },
    slots: { response: [`polite applause`, `a silence you can hear`, `a reaction from half the crowd`], move: [`a flying forearm`, `a sit-out powerbomb`, `a rolling kick to the jaw`] },
    body: [`You have been working {move} as a new closer for a month, and tonight it earns {response}. {agent.name} watches the replay on a monitor and winces in the exact way a physician winces at a second opinion. "Hm," {agent.first} says.`, `A finisher is a promise to the crowd, and nobody keeps believing a promise that they cannot read. Whatever you do with it now will tell the office what kind of professional you are.`],
    choices: [
      { id: 'keep', label: `Keep it: crowds learn what you teach them`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, overall: 0.3 }, text: `Within three weeks the building anticipates it and roars. A move that bombed in the first week is a trademark by the fourth, and you cannot stop smiling.`, effects: [{ pop: 0.7 }, { conf: 4 }, { fatigue: 5 }] },
        { weight: 1, text: `The crowd never learns it, and the reaction stays tepid. You carry the move like an unwanted child through another month of television.`, effects: [{ pop: -0.3 }, { conf: -3 }, { fatigue: 5 }] } ] },
      { id: 'ditch', label: `Go back to the finisher the crowd already knows`, risk: 'low', result: `Back to the old closer and the old pop it goes. It is safe, familiar and slightly disappointing, and you file the new move in a drawer.`, effects: [{ conf: -2 }, { pop: 0.1 }, { fatigue: -2 }] },
      { id: 'rework', label: `Rework the build-up with a coach before trying again`, risk: 'low', requires: { stat: { money: { gte: 400 } } }, result: `A week of private sessions teaches you that the move was fine and the setup was invisible. The new setup is cleaner and takes ten seconds longer, and the crowd finally gets it.`, effects: [{ money: -400 }, { attr: { name: 'technical', delta: 1 } }, { pop: 0.4 }, { fatigue: 6 }] },
      { id: 'argue', label: `Argue that the finish is the problem, not the move`, risk: 'high', result: `{agent.first} listens to the whole speech without writing anything down. The finish gets rewritten, but not in your favor, and the next week's notes are noticeably shorter.`, effects: [{ pop: -0.2 }, { conf: 1 }, { fatigue: 3 }] },
    ],
  },
  {
    id: 'ne_trn_recovery_fad', category: 'training', title: `Everyone Swears by {gadget}`, weight: 1, contexts: ['weekly'], cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 5,
    cast: { doctor: { pick: 'staff', role: 'doctor' } },
    trigger: { stat: { fatigue: { gte: 40 }, careerYears: { gte: 3 } } },
    slots: { gadget: [`an ice-bath tub`, `a red-light panel`, `compression boots`, `a flotation tank`], pusher: [`a rookie with a sponsor code`, `the locker-room know-it-all`, `a veteran with a fresh tan`] },
    body: [`In the locker room, {pusher} is raving about {gadget}, saying it has changed everything about how they feel after a show. The price tag is stuck to the box like a dare.`, `{doctor.name} listens to the claims with the weary patience of someone who has heard a hundred of them, and says, "Honest opinion? Free of charge." Recovery is where money meets hope, and you are tired enough to hope.`],
    choices: [
      { id: 'buy', label: `Buy it for yourself and commit to the routine`, risk: 'med', outcomes: [
        { weight: 2, bonus: { endurance: 0.3 }, text: `Whether it is the gadget or the discipline, you sleep better and ache less within two weeks. You are not sure which is responsible, and you do not care.`, effects: [{ money: -1200 }, { fatigue: -12 }, { conf: 3 }] },
        { weight: 1, text: `The gadget is a clutter of cables that you use twice, and then it becomes a very expensive coat rack. Your back hurts exactly as it did before.`, effects: [{ money: -1200 }, { fatigue: -2 }, { conf: -2 }] } ] },
      { id: 'sleep', label: `Take the doctor's boring advice: sleep, water and a day off`, risk: 'low', result: `The prescription is free and tedious, and it works better than anything with a plug. You lose a day of earnings and gain a body that finally forgives you.`, effects: [{ money: -300 }, { fatigue: -11 }, { conf: 1 }] },
      { id: 'try_one', label: `Try one session on the rookie's gadget and decide`, risk: 'low', result: `A single session is plenty to tell you that it is pleasant and unspectacular. The rookie talks the whole time about discount codes, and you leave slightly refreshed and a little irritated.`, effects: [{ money: -80 }, { fatigue: -5 }] },
      { id: 'mock', label: `Make a joke out of it in front of everyone`, risk: 'low', result: `The joke gets a laugh and the rookie sulks. Nothing is learned and no one is helped, but the locker room enjoys the moment and tells it all week.`, effects: [{ pop: 0.1 }, { conf: 1 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'ne_trn_the_tell', category: 'training', title: `A Veteran Spots Your Tell`, weight: 2, contexts: ['post_match', 'weekly'], cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 5,
    cast: { vet: { pick: 'roster', tier: { gte: 2 }, sameBrand: true } }, memory: { role: 'vet', max: 1 },
    trigger: { stat: { careerYears: { gte: 1 }, matches: { gte: 10 } } },
    slots: { tell: [`you glance at the corner before every big move`, `you take a visible breath before the finish`, `your feet reposition a half-second before a suplex`], delivery: [`quietly, like a gift`, `with a bluntness that stings`, `in front of the whole locker room`] },
    body: [`{vet.name} delivers the note {delivery}: {tell}. It is the sort of observation that cannot be un-heard, and you suddenly feel like a magician whose sleeve has been sewn open.`, `Every wrestler has a tell, and the great ones spend a decade hiding theirs. A veteran who will say it out loud is either doing you a favor or building a case.`],
    choices: [
      { id: 'thank', label: `Thank {vet.first} and fix it right away`, risk: 'low', result: `A week passes watching your own feet and counting breaths. The fix is awkward at first, then invisible, and you owe {vet.first} a favor you are glad to have.`, effects: [{ rel: { who: 'vet', respect: 6, trust: 4 } }, { attr: { name: 'technical', delta: 1 } }, { fatigue: 4 }, { conf: -1 }] },
      { id: 'defend', label: `Bristle and say that the crowd never notices`, risk: 'med', result: `{vet.first} shrugs. "Suit yourself," {vet.first} says, and walks away. You spend the evening with a sore ego and a quiet suspicion that the note was right. Pride and craft rarely agree.`, effects: [{ rel: { who: 'vet', respect: -5 } }, { conf: 1 }, { fatigue: 2 }] },
      { id: 'review', label: `Ask the vet to review tape of your matches together`, risk: 'med', result: `Two hours with a dim laptop and a bag of crackers reveals four more habits and one genuine strength you didn't know you had. It is the most useful evening of the month, and you pay with exhaustion.`, effects: [{ rel: { who: 'vet', respect: 5, affinity: 5 } }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 8 }, { conf: 2 }] },
      { id: 'ignore', label: `Nod and keep doing it your way`, risk: 'low', result: `The note gets waved away, and the work goes on as it always has. The tell remains, and three weeks later an opponent reads it in a live match and counters your big finish.`, effects: [{ pop: -0.3 }, { conf: -2 }, { rel: { who: 'vet', respect: -2 } }] },
    ],
  },
  // ======================= FINANCE =======================
  {
    id: 'ne_fin_royalty_statement', category: 'finance', title: `The Royalty Statement for {product}`, weight: 1.5, contexts: ['weekly'], cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 6,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { stat: { popularity: { gte: 40 } } },
    slots: { product: [`your shirt`, `your action figure`, `your poster`, `your entrance-theme download`], amount: [`a little over four hundred dollars`, `barely enough for a tank of gas`, `a number that makes you read it twice`] },
    body: [`The statement arrives in an envelope with a window, and the line for {product} says you earned {amount}. You know that building after building has been full of people who bought it, and the arithmetic does not seem to add up.`, `"It is the standard split," {agent.first} says, and recites a list of costs with a bureaucratic calm. Whatever the truth is, you have just discovered that your name is worth more to other people than to you.`],
    choices: [
      { id: 'audit', label: `Hire an accountant to audit the statement`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.2 }, text: `The audit finds a miscalculated cost line and a pending adjustment. A check arrives with an apologetic letter, and you feel the small, sharp satisfaction of being right.`, effects: [{ money: 3800 }, { conf: 4 }, { fatigue: 3 }] },
        { weight: 1, text: `The audit confirms that the paperwork is technically correct and mostly hopeless. You are left with a bill from the accountant and an unwelcome education.`, effects: [{ money: -900 }, { conf: -2 }, { fatigue: 3 }] } ] },
      { id: 'ask_agent', label: `Press {agent.first} for an honest explanation`, risk: 'low', result: `{agent.first} walks you through every line with the patience of a person who has done this before. Nothing changes, but you learn how contracts are written and which clause to chase at renewal.`, effects: [{ conf: 1 }, { fatigue: 2 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'accept', label: `Accept it: you are not in this for the merchandise`, risk: 'low', result: `The statement goes in a drawer and you go to work. The grudge is small and persistent, and it travels with you for a few weeks like a stone in a boot.`, effects: [{ conf: -2 }, { fatigue: -2 }] },
      { id: 'public', label: `Mention it on social media and see who agrees`, risk: 'high', requires: { minYear: 2010 }, outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `The post gets shared by a few dozen sympathetic wrestlers, and the company quietly reviews its numbers. You get a small bump in pay and a lasting reputation as someone who counts.`, effects: [{ money: 2200 }, { pop: 0.5 }, { conf: 3 }] },
        { weight: 2, text: `The post gets called ungrateful by people who have never read a contract. The office is cold with you for a month and no amount changes.`, effects: [{ pop: -0.5 }, { conf: -3 }] } ] },
    ],
  },
  {
    id: 'ne_fin_windfall', category: 'finance', title: `A Bonus You Did Not Expect`, weight: 1.5, contexts: ['weekly', 'post_show'], cooldownDays: 240, maxPerCareer: 3, categoryCooldown: 6,
    trigger: { stat: { popularity: { gte: 30 }, careerYears: { gte: 2 } } },
    slots: { source: [`a pay-per-view bonus`, `a merchandise check`, `a sponsorship that finally cleared`], temptation: [`a watch you have been staring at for a year`, `a down payment on a truck`, `a family trip you keep postponing`, `a new set of gear that costs more than your first car`] },
    body: [`The envelope contains {source}, twelve thousand dollars after tax, and it sits on the kitchen table like a live animal. You had been counting dimes for so long that a number this size feels like a prank.`, `Already you can see {temptation} in your mind, polished and waiting. Money like this arrives rarely in a wrestler's life, and what you do with it will say a lot about who you are.`],
    choices: [
      { id: 'save', label: `Put all of it away for a bad year`, risk: 'low', result: `The deposit slip is the most boring document you have ever loved. You sleep a little deeper that night, and a little duller, knowing it is there.`, effects: [{ money: 12000 }, { conf: 2 }, { fatigue: -2 }] },
      { id: 'spend', label: `Spend a chunk on yourself: you have earned it`, risk: 'med', result: `The thing you wanted gets bought, then dinner, and then another thing. The glow lasts about a week and the memory of the first night lasts years.`, effects: [{ money: 4500 }, { conf: 5 }, { fatigue: -9 }, { pop: 0.1 }] },
      { id: 'family', label: `Send a large share home to family`, risk: 'low', result: `The phone call is full of protests and tears. "We cannot take this," someone says, and takes it anyway. Two weeks later a photograph arrives of a new refrigerator. The money is gone and the feeling stays, warm and a little heavy.`, effects: [{ money: 5000 }, { conf: 4 }, { pop: 0.1 }] },
      { id: 'friend_bet', label: `Back a friend's long-shot business with half of it`, risk: 'high', outcomes: [
        { weight: 1, text: `The shop opens, the doors stay open, and a year later a check arrives with a thank-you note. It is a rare thing: a gamble that justifies itself.`, effects: [{ money: 9500 }, { conf: 4 }, { pop: 0.1 }] },
        { weight: 2, text: `The business folds before the paint dries, and the friendship develops a long, awkward silence. You tell yourself it was an experiment, and you almost believe it.`, effects: [{ money: 4800 }, { conf: -4 }] } ] },
    ],
  },
  {
    id: 'ne_fin_pay_whisper', category: 'finance', title: `What {peer.name} Earns`, weight: 2, major: true, contexts: ['weekly', 'pre_show'], cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 6,
    cast: { peer: { pick: 'roster', tier: { lte: 3 }, sameBrand: true }, agent: { pick: 'staff', role: 'agent' } }, memory: { role: 'peer', max: 1 },
    trigger: { stat: { careerYears: { gte: 3 } } },
    slots: { where: [`in the shower line`, `over bad coffee`, `in the back of a rental van`], gap: [`nearly double what you earn`, `well under half of what you earn`, `a number so low you check twice`] },
    body: [`{peer.name} mentions a salary {where}, casually and without thinking, and the number is {gap}. The conversation goes on, but you stop hearing it.`, `Pay is the one subject the locker room never discusses, because everybody suspects they are being underpaid and nobody wants to know. Now you know one number, and the question is whether to do anything with it.`],
    choices: [
      { id: 'raise', label: `Take it to the agent and ask for a raise`, risk: 'med', outcomes: [
        { weight: 2, bonus: { popularity: 0.3, confidence: 0.3 }, text: `{agent.first} listens, checks a spreadsheet and sighs. The raise is modest, and the conversation leaves you feeling that your name is a negotiating position instead of a nuisance.`, effects: [{ money: 4000 }, { conf: 4 }, { pop: 0.1 }] },
        { weight: 1, text: `"Budget cycle," {agent.first} says, with a stare that closes the discussion. You leave without a raise and with the knowledge that you asked.`, effects: [{ conf: -3 }, { fatigue: 2 }] } ] },
      { id: 'quiet', label: `Say nothing and keep the number to yourself`, risk: 'low', result: `A smile, a finished coffee and a decision follow: knowing is its own tax. The number hums in the back of your head for weeks, shaping your moods without you noticing.`, effects: [{ conf: -3 }, { fatigue: 2 }] },
      { id: 'share', label: `Quietly pass the information to others in the locker room`, risk: 'high', result: `Within a week half the room has had the same conversation, and the office is suddenly fielding awkward questions. Some people thank you in whispers, and some never forgive you for making it real.`, effects: [{ rel: { who: 'peer', trust: -9, respect: -4 } }, { pop: 0.2 }, { conf: 2 }, { money: 1500 }] },
      { id: 'tips', label: `Ask {peer.first} how {peer.they} negotiated that deal`, risk: 'low', result: `{peer.first} turns out to be generous with advice and a little shy about the fee. You walk away with three specific phrases to use and an unexpected ally.`, effects: [{ rel: { who: 'peer', trust: 6, affinity: 5 } }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 2 }, { conf: 1 }] },
    ],
  },
  {
    id: 'ne_fin_outside_booking', category: 'finance', title: `Cash for an Unsanctioned Night`, weight: 1.5, major: true, contexts: ['weekly', 'offseason'], cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 6,
    trigger: { stat: { money: { lte: 40000 }, careerYears: { gte: 3 }, popularity: { gte: 35 } } },
    slots: { promoter: [`a regional promoter with a briefcase of cash`, `a fan-run tournament organizer with a spreadsheet and a hopeful smile`, `a charity promoter in a very nice jacket`], fee: [`forty-five hundred dollars`, `three thousand and a plane ticket`, `six thousand for a single match`] },
    body: [`Over a crackling phone line, {promoter} says, "One night, on your day off, for {fee}." The contract you signed is clear about outside bookings, and the money is clear about everything else.`, `Nobody in the building would find out right away, and everyone in the business eventually does. The offer sits between two kinds of loyalty: the one you owe your employer and the one you owe your bank account.`],
    choices: [
      { id: 'secret', label: `Take it quietly and keep the secret`, risk: 'high', outcomes: [
        { weight: 2, text: `The night goes beautifully, the cash is real and nobody mentions it afterward. For months you feel like a person with a trapdoor in the floor.`, effects: [{ money: 4500 }, { fatigue: 11 }, { conf: 2 }, { flag: 'ne_moonlit' }] },
        { weight: 1, text: `A photograph appears online by morning, and a producer calls before you finish your first coffee. The fine takes most of the payment, and the trust takes much longer to repay.`, effects: [{ money: 1000 }, { pop: -0.6 }, { conf: -5 }, { fatigue: 11 }, { flag: 'ne_moonlit' }] } ] },
      { id: 'permission', label: `Ask the office for permission to take the date`, risk: 'med', outcomes: [
        { weight: 1, bonus: { popularity: 0.3 }, text: `The office says yes in exchange for a cut and a favor, and everyone behaves like adults. You take home less but you sleep clean.`, effects: [{ money: 2800 }, { fatigue: 10 }, { conf: 3 }] },
        { weight: 2, text: `The answer is a firm no, delivered with a wounded look, as if you had asked to borrow their car. You decline the promoter and leave feeling like a pet on a leash.`, effects: [{ conf: -3 }, { pop: -0.1 }] } ] },
      { id: 'decline', label: `Decline: the contract is the contract`, risk: 'low', result: `A handshake and a polite lie about your schedule turn it down. The money you did not earn weighs on you a little, and the principle you kept weighs a little more.`, effects: [{ conf: 2 }, { pop: 0.1 }, { fatigue: -2 }] },
      { id: 'charity', label: `Offer to work the show for free, with proceeds to a charity`, risk: 'med', result: `A heartfelt match plays out in front of a hundred and fifty locals, and the donation jar is full. It costs you a day and earns you something money cannot buy, though the bank balance disagrees.`, effects: [{ money: -400 }, { pop: 0.5 }, { conf: 4 }, { fatigue: 9 }] },
    ],
  },
  {
    id: 'ne_fin_family_roof', category: 'finance', title: `A Quiet Problem at Home`, weight: 2, major: true, cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 6,
    trigger: { stat: { money: { gte: 3000 }, careerYears: { gte: 1 } } },
    slots: { relative: [`your mother`, `your father`, `your older sister`, `your grandmother`], need: [`a roof that has started leaking onto the dining table`, `a hospital bill nobody mentioned`, `a failing truck needed for work`, `a mortgage payment two months behind`] },
    body: [`You hear it from a cousin at the end of a long phone call: the family is dealing with {need}. Even so, {relative} would never ask, and has told everyone in the house not to tell you.`, `Pride runs in your family like blue eyes. The distance between a worry kept from you and a worry shared with you is exactly the width of a check.`],
    choices: [
      { id: 'pay_all', label: `Pay the whole thing off and say nothing about it`, risk: 'low', result: `The payment goes through, and a letter arrives a week later in careful handwriting that thanks you without admitting a thing. It costs a season's savings and buys a kind of peace that is hard to price.`, effects: [{ money: -6500 }, { conf: 5 }, { fatigue: -3 }] },
      { id: 'split', label: `Pay part of it and help them plan the rest`, risk: 'med', result: `A sensible sum goes out, followed by an evening on the phone with a calculator and a lot of patience. The problem shrinks without disappearing, and the family feels respected instead of rescued.`, effects: [{ money: -2800 }, { conf: 3 }, { fatigue: 3 }] },
      { id: 'go_home', label: `Fly home and fix what you can with your own hands`, risk: 'med', result: `Four days go by on a ladder or under a hood with a cousin who keeps telling you that you are doing it wrong. You come back with blisters, a missed show and a story to tell, and nobody who loves you is surprised.`, effects: [{ money: -900 }, { fatigue: 10 }, { pop: -0.4 }, { conf: 4 }] },
      { id: 'wait', label: `Wait until you are asked, as they would want`, risk: 'high', result: `Silence gets respected, and ignorance gets pretended. Weeks later the trouble grows and the sting of not having acted grows with it.`, effects: [{ conf: -5 }, { fatigue: 4 }, { money: 800 }] },
    ],
  },
  {
    id: 'ne_fin_side_gig', category: 'finance', title: `A Side Job Offer: {gig}`, weight: 1.5, contexts: ['weekly', 'offseason'], cooldownDays: 180, maxPerCareer: 3, categoryCooldown: 6,
    trigger: { stat: { money: { lte: 8000 }, careerYears: { lte: 6 } } },
    slots: { gig: [`coaching at a kids' gym`, `working the door at a bar`, `driving a delivery truck`, `staffing a fitness-center front desk`], schedule: [`three mornings a week`, `weekend nights`, `whatever hours you can spare`] },
    body: [`The wrestling wage covers the rent in a good month and almost never in a bad one, and a friend has a lead on {gig} for {schedule}. The hours are dull and the pay is steady, and it would help.`, `The trouble is that the ring wants your body, and so does the shift. You can already feel the two jobs arguing in your shoulders.`],
    choices: [
      { id: 'take', label: `Take the job and juggle both`, risk: 'med', result: `The first two weeks are brutal and the third is merely hard. You are always a little tired, a little richer and slightly better at ordering coffee.`, effects: [{ money: 1800 }, { fatigue: 12 }, { conf: 1 }, { pop: -0.1 }] },
      { id: 'lean', label: `Decline and live lean`, risk: 'low', result: `The groceries get stretched, the extras get skipped, and the evenings stay free for the gym. Rent is a worry, but the ring gets all of you, and for now that feels right.`, effects: [{ money: -300 }, { fatigue: -4 }, { conf: 2 }] },
      { id: 'advance', label: `Ask the office for an advance on future pay`, risk: 'med', outcomes: [
        { weight: 2, text: `The office says yes in a way that feels like a kindness and a leash. The money arrives, and the debt travels with you.`, effects: [{ money: 1500 }, { conf: -2 }, { pop: -0.1 }] },
        { weight: 1, text: `The request is turned down with a smile that doesn't reach the eyes. The word spreads that you are short on money, and you can tell who knows.`, effects: [{ conf: -4 }, { pop: -0.2 }] } ] },
      { id: 'lessons', label: `Teach private lessons to adults who want to try the ropes`, risk: 'low', result: `Six office workers learn to fall safely in a rented gym, giggling like children and paying like adults. The income is modest and the joy is real, and you rediscover why you started.`, effects: [{ money: 700 }, { fatigue: 6 }, { conf: 3 }, { attr: { name: 'psychology', delta: 1 } }] },
    ],
  },
  {
    id: 'ne_fin_gear_invoice', category: 'finance', title: `The Invoice From {maker}`, weight: 1, contexts: ['weekly'], cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 6,
    trigger: { stat: { popularity: { gte: 25 }, careerYears: { gte: 2 } } },
    slots: { maker: [`the seamstress who sews your ring gear`, `the mask-maker`, `the boot cobbler`], total: [`twenty-two hundred dollars`, `eighteen hundred and some change`, `a number with a comma in it`] },
    body: [`The invoice from {maker} lands on the counter with a polite note and a total of {total}. The gear is magnificent, a hand-built piece of your character that fits like a second skin and has taken weeks to make.`, `You had a number in your head that was shorter. The artisan is an honest craftsperson who keeps three people employed, and you are a wrestler who wants both a bargain and a masterpiece.`],
    choices: [
      { id: 'pay', label: `Pay in full and leave a generous tip`, risk: 'low', result: `The check clears with a pleasing weight, and the maker sends over a small gift. You wear the gear like armor for the next year.`, effects: [{ money: -2400 }, { pop: 0.3 }, { conf: 4 }] },
      { id: 'negotiate', label: `Negotiate down and offer ring-side seats`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `The maker laughs, agrees to a discount and asks for tickets to bring a daughter. Everyone leaves smiling, and you have a fan for life.`, effects: [{ money: -1500 }, { conf: 2 }, { pop: 0.1 }] },
        { weight: 1, text: `The negotiation turns frosty, and the final figure is higher than it started once the rush fee is added. You pay with a stiff smile and learn why haggling is a poor hobby for people with expensive gear.`, effects: [{ money: -2500 }, { conf: -2 }] } ] },
      { id: 'office', label: `Ask the office to cover it as a business expense`, risk: 'med', outcomes: [
        { weight: 1, text: `The office grumbles, signs the form and writes the sum off. For once the character is not a personal luxury.`, effects: [{ money: -400 }, { conf: 2 }] },
        { weight: 2, text: `The request is denied with a lecture about budget lines. You pay the full invoice and spend the evening annoyed in a chair.`, effects: [{ money: -2400 }, { conf: -3 }, { pop: -0.1 }] } ] },
      { id: 'cheap', label: `Return the gear and buy something off the rack`, risk: 'low', result: `The maker is gracious and visibly disappointed. The off-the-rack gear is perfectly serviceable and nobody cries over it, though the crowd can see the difference.`, effects: [{ money: -400 }, { pop: -0.4 }, { conf: -3 }] },
    ],
  },
  {
    id: 'ne_fin_tight_week', category: 'finance', title: `A Week on {stretch}`, weight: 1.5, contexts: ['weekly', 'pre_show'], cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 6,
    cast: { vet: { pick: 'roster', tier: { gte: 2 }, sameBrand: true } }, memory: { role: 'vet', max: 1 },
    trigger: { stat: { money: { lte: 4000 }, careerYears: { lte: 5 } } },
    slots: { stretch: [`gas-station dinners`, `a four-way room split`, `sleeping in the rental car`], lodging: [`a motel with a weekly-rate sign`, `a roadside inn that charges extra for the towels`, `a hostel dormitory in a college town`] },
    body: [`The per diem is smaller than the week demands, and the bank balance is smaller than the per diem. You stand in a parking lot reading the price of {lodging} and doing the arithmetic out loud, which is never a good sign.`, `{vet.name} sees you do it from across the lot and says nothing, in the way that a veteran says nothing when they remember the same week. There are ways to stretch money, and ways to stretch pride, and they are not the same.`],
    choices: [
      { id: 'tough', label: `Tough it out: sleep in the car and eat cheap`, risk: 'med', result: `The seats fold badly and the nights are cold, but the money survives and so do you. By Friday you are gray with fatigue and fiercely, ridiculously proud.`, effects: [{ money: 600 }, { fatigue: 13 }, { conf: 2 }, { injury: { part: 'torso', severity: 1, days: 3 } }] },
      { id: 'spend', label: `Pay for a proper room and a decent meal`, risk: 'low', result: `A real bed and a hot dinner leave you rested enough to work. The bank balance sags, and you feel like a human being instead of a cargo.`, effects: [{ money: -350 }, { fatigue: -9 }, { conf: 1 }] },
      { id: 'ask_vet', label: `Ask {vet.first} if you can share a room`, risk: 'med', outcomes: [
        { weight: 2, text: `{vet.first} shrugs and throws a pillow at you. "Do not talk," {vet.first} says, and snores like a chainsaw. You save half the cost, lose a night's sleep and gain a new friend and fourteen stories.`, effects: [{ money: 300 }, { rel: { who: 'vet', trust: 6, affinity: 6 } }, { fatigue: 5 }] },
        { weight: 1, text: `The answer is a firm no, the kind that doesn't need a reason. You pay for your own room with a reddened face and the sense of a door closing.`, effects: [{ money: -350 }, { rel: { who: 'vet', respect: -2 } }, { conf: -3 }] } ] },
      { id: 'advance', label: `Call the office and ask for a small advance`, risk: 'high', result: `The advance arrives faster than expected, with a note that tells you the office has noticed. It solves the week and creates a small, quiet debt.`, effects: [{ money: 1200 }, { conf: -3 }, { pop: -0.1 }] },
    ],
  },
  // ======================= PERSONAL =======================
  {
    id: 'ne_per_new_baby', category: 'personal', title: `A Call About the Future`, weight: 2, major: true, cooldownDays: 400, maxPerCareer: 1, categoryCooldown: 10,
    trigger: { stat: { careerYears: { gte: 3 } } },
    slots: { timing: [`in a matter of months`, `the week of a big match`, `right in the middle of your busiest stretch`], tone: [`in a trembling voice`, `with a big grin and shaking hands`, `over a video call with a bad connection`] },
    body: [`The news comes {tone}: "You are going to be a parent." The due date is {timing}. A rush of joy and an equal rush of arithmetic hit at the same time, and you can feel both of them in your chest.`, `Everything you do for a living, every bump, every drive, every unslept night, suddenly has someone else's name attached to it. The job will not stop being the job, but it will never again be only yours.`],
    choices: [
      { id: 'time_off', label: `Request time off around the birth and the first weeks`, risk: 'med', result: `The office grants three weeks with a sigh and a pay cut. You spend them learning to fold tiny clothes, and nobody on earth is more tired or more pleased with themselves.`, effects: [{ money: -3000 }, { pop: -0.5 }, { fatigue: -12 }, { conf: 5 }] },
      { id: 'save', label: `Take every booking you can and build a cushion first`, risk: 'med', result: `Yes goes to dates in towns you can't spell, and the money gets banked like acorns. The cushion grows and the sleep thins, and every call home becomes a little shorter than you'd like.`, effects: [{ money: 4000 }, { fatigue: 14 }, { conf: 1 }, { pop: 0.2 }] },
      { id: 'slow_down', label: `Plan to scale back your schedule from now on`, risk: 'low', result: `A life with fewer road nights and more kitchen mornings gets sketched. The career gets smaller and the days get larger, and it feels surprisingly right.`, effects: [{ money: -1500 }, { pop: -0.4 }, { fatigue: -8 }, { conf: 4 }, { flag: 'ne_slow_down' }] },
      { id: 'tell_no_one', label: `Keep the news to yourself until after the next big show`, risk: 'low', result: `The secret is a bubble you carry through the arena, bright and fragile. When you finally tell the locker room, they cheer like it is a victory, and you feel a little ashamed of the delay.`, effects: [{ conf: 2 }, { fatigue: 5 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'ne_per_neighbor_hates_you', category: 'personal', title: `The Neighbor Who Takes Your Character Seriously`, weight: 1.5, contexts: ['weekly'], cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 10,
    trigger: { alignment: ['heel'], stat: { popularity: { gte: 25 } } },
    slots: { neighbor: [`the retired postal worker next door`, `the crossing guard at the corner`, `the barista who makes your morning coffee`], act: [`refuses to return your wave`, `boos you across the street with real feeling`, `holds up a hand-lettered sign every time you walk by`] },
    body: [`You are a very convincing villain, and {neighbor} has noticed. Every morning {act}, with the grim conviction of someone defending the moral order.`, `It is the highest praise the character can receive, and also an inconvenient one when you only want a quiet morning. Somewhere in this street, kayfabe and real life have gone off in different directions.`],
    choices: [
      { id: 'explain', label: `Go over and explain it's all a show`, risk: 'low', result: `Your neighbor listens with arms folded, then breaks into a grin and demands to know how the finish works. You've lost a fan of your villainy and gained a very nosy friend.`, effects: [{ pop: -0.2 }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'lean_in', label: `Lean into it and play the villain every morning`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `The street turns it into theater, with children watching from windows and a rival neighbor making a pointed sign. You have a feud on your own lawn and it is the best publicity money can't buy.`, effects: [{ pop: 0.5 }, { charisma: 1 }, { conf: 3 }, { fatigue: 4 }] },
        { weight: 1, text: `The act goes too far and a real complaint arrives. You spend an afternoon apologizing to someone who is not wrong.`, effects: [{ pop: -0.3 }, { conf: -3 }, { fatigue: 3 }] } ] },
      { id: 'tickets', label: `Leave two tickets with a note`, risk: 'low', result: `They attend the next show and boo with enormous satisfaction, then wave at you afterward like an old friend. You have turned a nuisance into a regular.`, effects: [{ money: -90 }, { pop: 0.3 }, { conf: 3 }] },
      { id: 'avoid', label: `Take another route and avoid them`, risk: 'low', result: `A stealthy morning routine develops that makes you feel like a burglar in your own neighborhood. It keeps the peace and it costs a little dignity.`, effects: [{ conf: -2 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'ne_per_anniversary', category: 'personal', title: `The Anniversary of Your First Match`, weight: 1.5, contexts: ['weekly', 'offseason'], cooldownDays: 365, maxPerCareer: 3, categoryCooldown: 10,
    trigger: { stat: { careerYears: { gte: 5 } } },
    slots: { marked: [`a card from your mother`, `a message from the person who first taught you to fall`, `a reminder you forgot you set`], place: [`in a hotel room`, `on a plane`, `at the gym after hours`] },
    body: [`The date passes quietly, and the only evidence is {marked}. You are {place}, and for a moment you can see the person who stood nervously in a borrowed pair of boots and had no idea what this would cost or give.`, `Years are strange in this business, since they are marked in injuries instead of birthdays. A milestone shows up without ceremony, and you have to decide whether to give it one.`],
    choices: [
      { id: 'revisit', label: `Drive out to the old gym and walk the mat`, risk: 'med', result: `The gym is smaller than you remember and the mat smells exactly the same. The owner makes coffee, tells you the story of your debut in a version that's mostly wrong, and refuses to let you pay for anything.`, effects: [{ fatigue: 8 }, { conf: 5 }, { money: -120 }, { pop: 0.1 }] },
      { id: 'celebrate', label: `Take a few friends from the roster to dinner`, risk: 'low', result: `Dinner turns into a rowdy tribute with terrible toasts and one cake with the wrong name on it. It costs a few hundred dollars and gives you something you can't buy twice.`, effects: [{ money: -350 }, { conf: 4 }, { fatigue: 3 }, { pop: 0.1 }] },
      { id: 'alone', label: `Spend the evening quietly alone with the old photographs`, risk: 'low', result: `A shoebox of photographs of strangers who look like you gets gone through, and you cry a little at the ones where nobody smiles. It's a private, honest night, and you sleep through to morning.`, effects: [{ conf: 3 }, { fatigue: -4 }] },
      { id: 'ignore', label: `Ignore it: nostalgia doesn't pay the bills`, risk: 'low', result: `A thumbs-up answers the message, and the day moves on. The pace of the week doesn't slow, and the date goes into a drawer with the others.`, effects: [{ conf: -2 }, { fatigue: 1 }] },
    ],
  },
  {
    id: 'ne_per_sports_psych', category: 'personal', title: `Afraid of {fear}`, weight: 2, major: true, contexts: ['weekly'], cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 10,
    trigger: { any: [{ stat: { confidence: { lte: 50 } } }, { stat: { injuries: { gte: 2 } } }], stat: { careerYears: { gte: 2 } } },
    slots: { fear: [`getting hurt`, `being forgotten`, `letting down a partner`, `not being good enough`], format: [`a video call`, `a quiet office with a plant in the corner`, `a long walk in a park`] },
    body: [`You finally admit it out loud to someone qualified to hear it: you are afraid of {fear}, and the fear has been quietly editing your matches for months. The counselor suggests {format}, in a voice that makes it sound like the easiest thing in the world.`, `Wrestlers talk about being tough more than anybody and say less about being scared than anyone. This is the kind of bump you cannot take on a mat.`],
    choices: [
      { id: 'commit', label: `Commit to a regular course of sessions`, risk: 'med', result: `Every second Tuesday you sit in a chair and say true things to a stranger who writes down very little. Within two months you have a vocabulary for what's happening, and the fear has a size.`, effects: [{ money: -900 }, { conf: 5 }, { fatigue: -6 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'journal', label: `Write it down every night and see what comes up`, risk: 'low', result: `The notebook fills with ugly sentences and one or two surprisingly good ones. It is private, free and slow, and it helps in the way that a short walk helps.`, effects: [{ conf: 2 }, { fatigue: 2 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'vet_talk', label: `Talk to a veteran you trust instead`, risk: 'med', result: `A veteran listens for an hour without checking a phone, and then says that every one of them has had the same fear. It isn't a cure, but it is company, which is sometimes more useful.`, effects: [{ conf: 3 }, { fatigue: 2 }, { pop: 0.1 }] },
      { id: 'push_on', label: `Shrug it off and push on as usual`, risk: 'high', outcomes: [
        { weight: 1, text: `The fear fades on its own, or you stop hearing it, which is close enough. You work harder and worry less, and you leave the whole matter in a drawer.`, effects: [{ conf: 2 }, { fatigue: 5 }] },
        { weight: 2, text: `The fear returns at the worst possible time, in the middle of a match, and your hands forget what to do. You finish on instinct and sit on the edge of the bathtub afterward.`, effects: [{ conf: -5 }, { pop: -0.3 }, { fatigue: 6 }] } ] },
    ],
  },
  {
    id: 'ne_per_group_chat', category: 'personal', title: `The Group Chat Has Gone Quiet`, weight: 1.5, contexts: ['weekly'], cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 10,
    trigger: { minYear: 2010, stat: { careerYears: { gte: 2 } } },
    slots: { chat: [`the college group chat`, `the chat from your old gym`, `the chat with your oldest friends`], plan: [`a reunion weekend`, `a ski trip`, `a barbecue at somebody's parents' house`] },
    body: [`Scrolling back through {chat}, you realize your name is missing from the last forty messages. They are planning {plan}, and your last reply was a thumbs-up three months ago, followed by a string of plans you canceled.`, `Nobody is angry, which is the worst part. Friendship withers politely when one person lives in hotels, and they have simply stopped expecting you.`],
    choices: [
      { id: 'commit', label: `Commit and buy a ticket right now`, risk: 'med', result: `The trip gets paid for before you can chicken out, and the office is told you need those dates. The weekend is loud, stupid and wonderful, and the friends treat you exactly as they used to.`, effects: [{ money: -500 }, { pop: -0.2 }, { fatigue: -8 }, { conf: 5 }] },
      { id: 'voice', label: `Send a long, honest voice memo and apologize`, risk: 'low', result: `The memo runs eleven minutes with two false starts and a sniffle. Replies flood in over the next hour, forgiving and teasing in equal measure, and you feel lighter than you expected.`, effects: [{ conf: 3 }, { fatigue: -2 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'invite', label: `Invite them all to your next show instead`, risk: 'low', requires: { stat: { money: { gte: 400 } } }, result: `A row of seats gets booked, and ten friends arrive in matching homemade shirts that you pretend are embarrassing. The match is for them, and afterward you sit on the apron with their arms around your neck.`, effects: [{ money: -400 }, { pop: 0.4 }, { conf: 5 }, { fatigue: 3 }] },
      { id: 'decline', label: `Decline again and promise to catch up another time`, risk: 'low', result: `A breezy excuse and a heart emoji get typed out, and the reply never comes. The distance gets a little longer, and you tell yourself the career will make it up to you.`, effects: [{ conf: -4 }, { fatigue: 1 }, { money: 200 }] },
    ],
  },
  {
    id: 'ne_per_shaking_hands', category: 'personal', title: `Hands That Won't Stop Shaking Before {setting}`, weight: 1.5, contexts: ['pre_show', 'weekly'], cooldownDays: 200, maxPerCareer: 3, categoryCooldown: 10,
    trigger: { stat: { confidence: { lte: 60 }, careerYears: { gte: 1 } } },
    slots: { setting: [`a live promo`, `a sit-down interview`, `a locker-room speech`], sign: [`your hands will not stop trembling`, `your voice has dropped somewhere around your shoes`, `your mind has gone white and perfectly blank`] },
    body: [`Ten minutes before {setting}, {sign}. The words you rehearsed in the car have disappeared, and a cold, silly fear is working its way up your spine.`, `You have taken bumps that would make most people faint and walked into cheering arenas without blinking. Somehow a microphone is worse.`],
    choices: [
      { id: 'breathe', label: `Find a quiet corner and run the breathing routine`, risk: 'low', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `Four counts in, four counts out, and the world slowly steadies. You walk out loose, a little shaky and entirely present, and the speech goes better than it ever did in rehearsal.`, effects: [{ conf: 4 }, { mic: 1 }, { fatigue: 2 }] },
        { weight: 1, text: `The breathing helps a bit but not enough, and you stumble through the opening line before finding a rhythm. It is not a disaster, only a small, forgettable wobble.`, effects: [{ conf: 1 }, { pop: -0.1 }] } ] },
      { id: 'power', label: `Power through it with sheer force of will`, risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.4 }, text: `Adrenaline carries you across the finish line and the crowd roars, mistaking terror for passion. You come off drenched and laughing.`, effects: [{ pop: 0.6 }, { conf: 3 }, { fatigue: 5 }] },
        { weight: 2, text: `The words come out in the wrong order and the pause is long enough to sell a car in. You limp to the end and avoid everybody's eyes in the corridor.`, effects: [{ pop: -0.4 }, { conf: -5 }, { fatigue: 5 }] } ] },
      { id: 'cue_cards', label: `Write the key lines on your wrist tape`, risk: 'low', result: `The lines on your wrist are small, silly and entirely effective. You glance down twice, sound a little stiff and avoid disaster, and nobody ever notices the notes.`, effects: [{ conf: 1 }, { pop: 0.1 }, { fatigue: 2 }] },
      { id: 'ask_cut', label: `Ask the producer to shorten the segment`, risk: 'med', result: `The producer trims it to thirty seconds and gives you a look that is kind and a little disappointed. You get through it cleanly and carry a small, stubborn shame for a day.`, effects: [{ pop: -0.3 }, { conf: -2 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'ne_per_paid_dinner', category: 'personal', title: `Someone Paid for Your Dinner`, weight: 1, contexts: ['weekly', 'post_show'], cooldownDays: 200, maxPerCareer: 3, categoryCooldown: 10,
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { place: [`a roadside diner`, `a late-night noodle shop`, `an airport grill`], stranger: [`an elderly couple`, `a waitress who works doubles`, `a table of strangers in matching jerseys`] },
    body: [`It is one in the morning, you are tired and sore, and the waiter in {place} tells you the bill is already settled. The kindness came from {stranger}, who left without waiting to be thanked.`, `You have taken a great many bumps from people who wanted to hurt you and very few gifts from people who wanted nothing. It is surprisingly hard to know where to put your hands.`],
    choices: [
      { id: 'thank', label: `Ask the waiter to pass on a heartfelt thank-you`, risk: 'low', result: `A note goes on a napkin and the waiter promises to pass it on. The meal tastes a little better than it did, and you walk out lighter than you came in.`, effects: [{ conf: 3 }, { fatigue: -2 }] },
      { id: 'forward', label: `Pay for the next table, and the next`, risk: 'low', result: `A table of students gets quietly covered, then a trucker eating alone, then someone you cannot quite place. The total comes to three hundred dollars, and it's the best money you spend all month.`, effects: [{ money: -300 }, { conf: 4 }, { pop: 0.2 }] },
      { id: 'tip', label: `Leave a huge tip for the staff who worked late`, risk: 'low', result: `A folded bill is pressed into the waiter's hand, and he tries to give it back before seeing the number. The kitchen staff applaud on your way out.`, effects: [{ money: -200 }, { conf: 2 }, { pop: 0.1 }] },
      { id: 'brush', label: `Brush it off and go back to your hotel`, risk: 'low', result: `A thanks is mumbled to nobody on the way to the door. It was a nice thing that happened to someone else, and you leave it on the table with the empty glasses.`, effects: [{ conf: -2 }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'ne_per_gran_rules', category: 'personal', title: `A Question Over Sunday Lunch`, weight: 1.5, contexts: ['weekly', 'offseason'], cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 10,
    trigger: { stat: { careerYears: { gte: 1 }, popularity: { gte: 15 } } },
    slots: { relative: [`your grandmother`, `your aunt`, `your father`], question: [`why the referee never helps`, `whether the other wrestler is really a friend`, `if the blood is real`] },
    body: [`Over Sunday lunch, {relative} puts down a fork and asks, with the fierce seriousness of a person who has watched six hours of television in your honor, {question}. The table goes quiet, and every cousin stops pretending not to listen.`, `You have spent your career protecting a secret that most people half-know. Here, among the potatoes and the good dishes, it suddenly feels less like protection and more like a closed door.`],
    choices: [
      { id: 'truth', label: `Tell the whole truth about how the business works`, risk: 'med', result: `The explanation takes an hour and a second dessert, and your relative's eyebrows rise higher with every sentence. In the end there is a long pause and the single word: really? Then a bright, delighted laugh.`, effects: [{ conf: 3 }, { fatigue: 2 }, { pop: -0.1 }] },
      { id: 'keep_kayfabe', label: `Keep the secret and answer with a straight face`, risk: 'low', result: `The party line is delivered with the discipline of a veteran, and the table nods in satisfied awe. It works, but you notice a flicker of something you can't quite name behind your relative's polite smile.`, effects: [{ conf: 1 }, { fatigue: 3 }, { pop: 0.1 }] },
      { id: 'backstage', label: `Offer them a backstage visit to see for themselves`, risk: 'med', requires: { stat: { money: { gte: 150 } } }, result: `Your relative arrives in their best coat and meets the whole crew, shaking hands with a villain who is as gentle as lamb. It's the proudest day of their life, and you spend half the evening explaining where the gorilla position is.`, effects: [{ money: -150 }, { conf: 5 }, { fatigue: 5 }, { pop: 0.2 }] },
      { id: 'tease', label: `Make something up that's wilder than the truth`, risk: 'low', result: `A story about a rigged rope and a referee who is secretly a wizard sends the whole table into laughter. Your relative glares at you over their glasses, entirely unfooled.`, effects: [{ charisma: 1 }, { conf: 2 }, { fatigue: 1 }] },
    ],
  },
];
