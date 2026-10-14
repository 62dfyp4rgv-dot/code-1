// New scenarios (set A): debut, breakout, contract, injury, recovery, comeback, retirement, legacy. Eight each, ids prefixed na_.
export default [
  // ======================= DEBUT =======================
  {
    id: 'na_deb_empty_dark_match', category: 'debut', title: 'The Match Before the Doors Open', weight: 2, contexts: ['pre_show'], cooldownDays: 200, maxPerCareer: 1, categoryCooldown: 8,
    cast: { opp: { pick: 'roster', tier: { lte: 1 } } }, memory: { role: 'opp', max: 1 },
    trigger: { stat: { matches: { lte: 4 } } },
    slots: { crowd: ['a few ushers and a school group', 'two rows of early arrivals eating pretzels', 'a security guard, a camera operator and one heckler', 'the ring crew sitting on road cases'], watcher: ['a producer eating a sandwich by the monitor', 'a talent scout nobody has introduced', 'the ring crew on their break', 'a trainee holding the timekeeper\'s bell'] },
    body: ["The dark match goes on at 6:40, long before the doors open, and the audience is {crowd}. {opp.name} is across the ring bouncing on the balls of {opp.their} feet, as hungry as you are and just as aware that nobody will remember this.", "The only eyes that might be taking notes belong to {watcher}. A great match here changes nothing tonight and possibly everything in a year, which is the particular cruelty of the dark match."],
    choices: [
      { id: 'full', label: 'Work it like a main event', risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.6 }, text: "You throw every spot you own at the empty room. By the finish the ushers have stopped stacking programs to watch, and {opp.first}'s grin at the bell says the feeling was shared.", effects: [{ pop: 0.4 }, { conf: 4 }, { fatigue: 10 }, { rel: { who: 'opp', respect: 4 } }] },
        { weight: 1, text: "You overreach on a crossbody and the two of you land in a heap. You finish clean, but your ribs sing for days and the ushers wince in unison.", effects: [{ conf: -2 }, { fatigue: 12 }, { injury: { part: 'torso', severity: 1, days: 5 } }] } ] },
      { id: 'clean', label: 'Keep it clean and give your partner the better spots', risk: 'low', result: "You build the match around {opp.first}'s strengths and keep your own flash in the holster. It is quiet, careful work that nobody applauds, but {opp.first} says thank you twice in the hallway.", effects: [{ conf: 2 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 4 }, { rel: { who: 'opp', trust: 5, affinity: 3 } }] },
      { id: 'heckler', label: 'Play to the one loud voice in the seats', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.6 }, text: "The best insult from the cheap seats becomes your bit. By the third minute the empty rows feel like an advantage, and the laughter echoes back at you.", effects: [{ pop: 0.3 }, { conf: 3 }, { charisma: 1 }] },
        { weight: 1, text: "The bit dies in the air and {opp.first} has to carry the match by hand until the finish. There is a polite insult of {opp.their} own waiting for you at the curtain.", effects: [{ rel: { who: 'opp', respect: -4 } }, { conf: -2 }] } ] },
      { id: 'save', label: 'Work safe and save your body for tomorrow night', risk: 'low', result: "You hit your marks, avoid every risk and walk away unmarked. The match is forgotten by the time the first fan walks in, which is exactly what you chose.", effects: [{ conf: -1 }, { fatigue: -4 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'na_deb_new_name', category: 'debut', title: 'A New Name on a Sheet of Paper', weight: 2, cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 8,
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { matches: { lte: 12 }, careerYears: { lte: 2 } } },
    slots: { gimmick: ['a sleepless night-shift nurse', 'a disgraced accountant with a briefcase', 'a lighthouse keeper from a place that does not exist', 'a retired bar-room bouncer with a velvet rope'], mood: ['holds the page like a restaurant menu', 'is already sketching your entrance on a napkin', 'reads the pitch aloud with a perfectly straight face', 'goes quiet to let it sink in'] },
    body: ["The meeting was described as a quick chat, but the folder on the desk says otherwise. {creative.name} proposes that you become {gimmick}, complete with a new name, new gear and a theme already sitting on a shelf in the music library.", "{creative.first} {mood} while waiting for you to speak. Your own name is the only thing you brought into this building that was ever really yours, and now somebody wants to rent it."],
    choices: [
      { id: 'accept', label: 'Take the gimmick and commit to it fully', risk: 'low', result: "You say yes and mean it. The first night in costume feels ridiculous, and by the third night the crowd has found a nickname for you that is not the one on the sheet.", effects: [{ pop: 0.5 }, { conf: -2 }, { charisma: 1 }] },
      { id: 'push', label: 'Argue that the real you is the stronger pitch', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.6, confidence: 0.4 }, text: "You talk for ten minutes without notes, about where you grew up and who you are in a ring. {creative.first} slides the sheet back into the folder and says they will build around you instead.", effects: [{ pop: 0.3 }, { conf: 5 }] },
        { weight: 2, text: "The pushback sounds like entitlement from someone who has been in the building a month. The folder stays on the desk, and your name drops out of the conversation for a while.", effects: [{ pop: -0.4 }, { conf: -4 }] } ] },
      { id: 'rewrite', label: 'Accept the idea but rewrite half of it yourself', risk: 'med', result: "You keep the exhaustion and the odd little rituals and throw out the costume. {creative.first} agrees on one condition: if it bombs, the bomb is yours.", effects: [{ attr: { name: 'psychology', delta: 1 } }, { conf: 3 }, { fatigue: 5 }] },
      { id: 'test', label: 'Ask for four weeks of house shows to try it out', risk: 'low', result: "Four weeks of half-full rooms in towns you could not find on a map teach you which bits get a reaction and which get a cough. It is slow, and it is useful.", effects: [{ mic: 1 }, { conf: 1 }, { fatigue: 8 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'na_deb_back_seat', category: 'debut', title: 'Awake in the Back of the Ride', weight: 2, cooldownDays: 240, maxPerCareer: 1, categoryCooldown: 8,
    cast: { vet: { pick: 'roster', tier: { gte: 2 } } }, memory: { role: 'vet', max: 1 },
    trigger: { stat: { careerYears: { lte: 1.5 }, matches: { lte: 14 } } },
    slots: { ride: ['a rented van with a broken heater', 'the back of a crew bus', 'a sedan packed with four wrestlers and their bags', 'a minivan with a cracked windshield'], hour: ['two in the morning', 'a quarter past three', 'the dead hour before dawn', 'midnight, three hours from the hotel'] },
    body: ["It is {hour}, and {ride} hums down a road whose exit signs you stopped reading an hour ago. Everyone else has found a corner and a pillow, while you have found a paperback you have read twice and a window that shows only your own reflection.", "Two seats ahead, {vet.name} is awake with a thermos, and after a minute a hand pats the empty cushion beside {vet.them}. It is the kind of invitation that comes without a sign, and one you could easily pretend not to see."],
    choices: [
      { id: 'sit', label: 'Take the seat beside {vet.first}', risk: 'low', result: "{vet.first} says nothing for twenty miles, then tells you about a first road trip that ended with a flat tire and a missing wallet. By the next exit you are laughing, and no one has asked you to prove anything.", effects: [{ rel: { who: 'vet', affinity: 5, respect: 2, trust: 3 } }, { conf: 3 }, { fatigue: -2 }] },
      { id: 'stay', label: 'Stay in your corner with the paperback', risk: 'low', result: "You pretend you did not see it. The miles pass, and so do the page numbers, and it is quiet and fine and lonelier than you would admit to anyone.", effects: [{ conf: -2 }, { fatigue: -4 }] },
      { id: 'drive', label: 'Offer to take a shift behind the wheel', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: "You take the wheel at a rest stop and hold it steady until the sky goes gray. The driver sleeps, and by dawn you have earned a nod from {vet.first}, which is worth more than most paychecks.", effects: [{ rel: { who: 'vet', respect: 5 } }, { fatigue: 10 }, { conf: 2 }] },
        { weight: 1, text: "You drift once over the rumble strip and the whole vehicle wakes at the same moment. Nobody says a word, which is worse than any lecture.", effects: [{ conf: -4 }, { rel: { who: 'vet', respect: -3 } }, { fatigue: 8 }] } ] },
      { id: 'call', label: 'Use the next gas station to call home', risk: 'low', result: "From the lot of a gas station you tell your family about the arena, leaving out the bad coffee and the part where you felt small. Their voices fill a hole, though it costs fifteen dollars in coins and an hour of sleep.", effects: [{ money: -15 }, { conf: 3 }, { fatigue: 4 }] },
    ],
  },
  {
    id: 'na_deb_family_row', category: 'debut', title: 'The Loss They Drove To See', weight: 2, contexts: ['post_match'], cooldownDays: 240, maxPerCareer: 1, categoryCooldown: 8,
    trigger: { stat: { matches: { lte: 10 } }, recent: { lossesGte: 1, lastResult: 'loss' } },
    slots: { relative: ['your mother', 'your father', 'your grandmother', 'your older brother'], seat: ['the third row, holding a hand-lettered sign', 'the last row of the balcony, looking smaller than you ever remembered', 'the standing-room rail beside the concession stand', 'a folding chair at the guard rail'] },
    body: ["The match was a loss by design: you were there to make the other wrestler look good, and you did. Out past the barricade, {relative} sits in {seat}, and the pin lands on a face that is trying very hard not to react.", "The hallway to the exit is thirty steps long, and a steward is already waving fans toward the merch tables. Somebody has to tell {relative} that losing was the job, and the only candidate is you."],
    choices: [
      { id: 'explain', label: 'Find them and explain how the business works', risk: 'low', result: "You catch them at the barricade and explain finishes, bookings and the quiet honor of making somebody else look good. They listen like it is a lecture, then hug you hard enough to hurt.", effects: [{ conf: 3 }, { pop: 0.1 }, { fatigue: 2 }] },
      { id: 'kayfabe', label: 'Stay in character, even in front of family', risk: 'med', outcomes: [
        { weight: 2, text: "You storm past them, the picture of a beaten and furious loser. In the parking lot a minute later they are laughing, whispering that the whole section bought it.", effects: [{ pop: 0.3 }, { conf: 2 }] },
        { weight: 1, text: "They see only a person they raised stomping away in anger. You catch up in the parking lot, but the drive home is very quiet.", effects: [{ conf: -3 }] } ] },
      { id: 'shirt', label: 'Take them to the merch table and buy the shirt', risk: 'low', result: "You spend most of a day's pay on a shirt with your own name on it, and they wear it out of the building like a medal.", effects: [{ money: -60 }, { conf: 4 }, { pop: 0.2 }] },
      { id: 'slip', label: 'Slip out the back with your bag', risk: 'high', result: "You tell yourself you are too raw to face anyone. The empty parking lot is the longest walk of the night, and the sign in the third row goes home unseen.", effects: [{ conf: -4 }, { fatigue: -5 }] },
    ],
  },
  {
    id: 'na_deb_botched_spot', category: 'debut', title: 'Eleven Seconds You Cannot Rewind', weight: 2, contexts: ['post_match'], cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 8,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { stat: { matches: { lte: 14 } } },
    slots: { botch: ['missed the cue for the finish and stood frozen for two full seconds', 'slipped on the second rope and landed on the apron', 'called the wrong spot and left your opponent grabbing air', 'came up a beat late on a rope run and made your opponent improvise'], reaction: ['a ripple of quiet laughter in the upper deck', 'the whole front row going still', 'an announcer covering the pause with a joke', 'a referee whispering the next spot like a prompter'] },
    body: ["The mistake was small by any outside measure: you {botch}. Still, there was {reaction}, and it ran up your spine like cold water.", "{agent.name} is waiting by the curtain with arms folded. The next sentence out of that mouth will decide whether this becomes a story you tell later or one you tell yourself at three in the morning."],
    choices: [
      { id: 'own', label: 'Own it before {agent.first} can speak', risk: 'low', result: "You say it first and say it plainly: that one was on you. {agent.first} lets out a breath, says the good ones always do exactly that, and hands you three notes for next time.", effects: [{ conf: 2 }, { attr: { name: 'psychology', delta: 1 } }, { flag: 'na_botch_owned' }] },
      { id: 'blame', label: 'Point to a slick mat and a missed cue from the other side', risk: 'high', outcomes: [
        { weight: 1, text: "It holds up only because the other wrestler is out of earshot. You keep your pride and lose a little of your honesty in the bargain.", effects: [{ conf: 2 }] },
        { weight: 2, text: "{agent.first} has watched the replay, and the replay disagrees with you. The excuse costs far more than the mistake ever would have.", effects: [{ conf: -5 }, { pop: -0.3 }] } ] },
      { id: 'joke', label: 'Turn it into a joke at your own expense', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: "The hallway laughs with you rather than at you, and a veteran referee says the best thing he ever heard a rookie say was \"well, that happened.\"", effects: [{ pop: 0.3 }, { conf: 3 }] },
        { weight: 1, text: "The joke lands in a hallway that is not in the mood. Someone rolls their eyes at the rookie being cheerful about a mistake.", effects: [{ conf: -2 }] } ] },
      { id: 'tape', label: 'Ask to watch the tape with {agent.first} tonight', risk: 'low', result: "You sit in a dim office rewinding the same eleven seconds. It is humbling and useful, and you leave knowing exactly which rope you will never trust with your left foot again.", effects: [{ attr: { name: 'technical', delta: 1 } }, { conf: 1 }, { fatigue: 6 }] },
    ],
  },
  {
    id: 'na_deb_merch_table', category: 'debut', title: 'The Table With Your Name On It', weight: 1.5, cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 8,
    trigger: { stat: { matches: { lte: 25 }, popularity: { lte: 30 } } },
    slots: { item: ['grainy 8x10 photos', 'hand-lettered T-shirts', 'a stack of mini-posters', 'plastic wristbands with your name misspelled'], line: ['no one at all', 'a single child asking where the bigger star sits', 'a long line that bends around your table toward the wrestler at the next one', 'one man who wants to talk about his divorce'] },
    body: ["The merch table assigned to you holds {item}, a folding chair and a laminated sign taped slightly crooked. The line in front of your chair consists of {line}.", "Next to you, a veteran's table has been mobbed since the doors opened, and the merch coordinator keeps glancing over with polite sympathy. Two hours behind an empty table is a kind of match of its own, and you are not allowed to tap out."],
    choices: [
      { id: 'hustle', label: 'Walk the concourse and sell yourself to strangers', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: "You work the aisle like a carnival barker. Half a dozen people sign up for the whole stack, and one dad asks your name twice just to remember it.", effects: [{ pop: 0.4 }, { money: 150 }, { conf: 3 }, { fatigue: 5 }] },
        { weight: 1, text: "Most of them look through you as if you were a coat rack with a belt. You return with sore feet and a handful of ones.", effects: [{ money: 40 }, { conf: -2 }, { fatigue: 7 }] } ] },
      { id: 'sit', label: 'Stay put and be easy to find', risk: 'low', result: "A slow trickle finds you, and you sign everything with real care. A grandmother buys one of each and tells you to eat something.", effects: [{ money: 60 }, { conf: 1 }, { pop: 0.1 }] },
      { id: 'kid', label: 'Hand the bored child a free photo and ask their name', risk: 'low', result: "The child's parent tells everyone on the concourse about it. It is the only real sale of the afternoon, and the best one.", effects: [{ pop: 0.3 }, { conf: 3 }, { money: -10 }] },
      { id: 'sign', label: 'Hang a joke sign: Autographs Free, Dignity Extra', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.7 }, text: "Fans laugh, take photos of the sign, and the coordinator slides your table closer to the doors for the next show.", effects: [{ pop: 0.6 }, { money: 40 }, { conf: 2 }] },
        { weight: 2, text: "The coordinator takes the sign down with the air of someone defending a brand. You get a lecture and a lot of extra silence.", effects: [{ conf: -2 }, { pop: -0.2 }] } ] },
    ],
  },
  {
    id: 'na_deb_ring_crew', category: 'debut', title: 'Two O\'Clock With the Ring Crew', weight: 1.5, cooldownDays: 200, maxPerCareer: 1, categoryCooldown: 8,
    trigger: { background: ['prospect', 'indie'], stat: { matches: { lte: 15 } } },
    slots: { task: ['bolting the turnbuckles', 'laying the canvas over the foam', 'unloading the ring posts from the truck', 'tightening the ropes with a ratchet'], weather: ['in a steady drizzle', 'under a roof that drips', 'in a hall where the air stopped moving hours ago', 'while a forklift beeps nonstop'] },
    body: ["At two in the afternoon, hours before anyone worth seeing arrives, the crew is {task} {weather}. The chief, a quiet man with forearms like fence posts, has not asked for help and does not look like he would refuse it.", "You have nothing scheduled and a slow certainty that these are the people who hold your safety in their hands every night. Rookies who learn their names tend to meet fewer surprises in the ring."],
    choices: [
      { id: 'pitch', label: 'Pitch in until the ring is built', risk: 'low', result: "Three hours later your palms are blistered and your shirt is gone. The chief hands you a bottle of water and says the ropes will never be tighter than the ones you tied.", effects: [{ fatigue: 10 }, { conf: 3 }, { attr: { name: 'toughness', delta: 1 } }] },
      { id: 'learn', label: 'Ask the chief to teach you how a ring goes together', risk: 'low', result: "He shows you why the pads get checked twice and where this particular ring wobbles. You leave knowing things most wrestlers never bother to learn.", effects: [{ attr: { name: 'technical', delta: 1 } }, { conf: 2 }, { fatigue: 4 }] },
      { id: 'coffee', label: 'Bring coffee and doughnuts for the whole crew', risk: 'low', result: "Nobody fusses over it, which is the nicest possible review. The chief eats two doughnuts and nods at the ring like it is a promise.", effects: [{ money: -35 }, { conf: 2 }, { pop: 0.1 }] },
      { id: 'rest', label: 'Save your energy and stay out of their way', risk: 'low', result: "You nap in the car and arrive fresh at six. The crew notices a rookie who did not notice them, and there is no extra grace when your boot catches a loose rope that night.", effects: [{ fatigue: -6 }, { conf: -1 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'na_deb_bubble_talk', category: 'debut', title: 'A Conversation About Trajectory', weight: 2, major: true, cooldownDays: 300, maxPerCareer: 1, categoryCooldown: 10,
    cast: { gm: { pick: 'staff', role: 'gm' } },
    trigger: { stat: { careerYears: { lte: 1.2 }, matches: { lte: 16 }, confidence: { lte: 65 } } },
    slots: { review: ['a reel of your first six matches', 'a stack of crowd-reaction reports', 'a spreadsheet of house-show attendance', 'a short note from the agents'], clock: ['by Friday', 'before the next taping', 'by the end of the month', 'after the holiday shows'] },
    body: ["{gm.name} asks for a minute in an office that smells of toner and cold coffee. The company has gone over {review}, and the polite phrase for what comes next is a conversation about trajectory.", "You are told that nothing has been decided, which everyone in this business knows is how decisions sound before they are announced. A clearer picture is expected {clock}."],
    choices: [
      { id: 'notes', label: 'Ask for specific notes and write them down', risk: 'low', result: "You leave with five concrete criticisms and one unexpected compliment about your timing. It is a roadmap, and a humbling one.", effects: [{ attr: { name: 'psychology', delta: 1 } }, { conf: 1 }, { fatigue: 4 }] },
      { id: 'prove', label: 'Say you want it more than anyone and prove it in the gym', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: "Whatever they were weighing, hearing it said so plainly moves it. Within days the agents are quietly asking where you have been training.", effects: [{ pop: 0.2 }, { conf: 4 }, { fatigue: 12 }] },
        { weight: 2, text: "You overtrain in a panic and show up to the next show visibly drained and half a step slow.", effects: [{ fatigue: 18 }, { conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'argue', label: 'Argue that the numbers undersell you', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.6 }, text: "You make the case with the quiet logic of someone who did their homework. {gm.first} sits back and revises a note on the page.", effects: [{ conf: 5 }, { pop: 0.3 }] },
        { weight: 2, text: "Contesting the numbers in your first year reads as defiance. A pen moves to a different line of the page.", effects: [{ pop: -0.5 }, { conf: -4 }] } ] },
      { id: 'admit', label: 'Admit you are scared and ask what a safe path looks like', risk: 'low', result: "It is a surprising relief to say it, and {gm.first} answers like a person instead of an office: pick one thing, a finisher or a voice or a persona, and be unforgettable at it.", effects: [{ mic: 1 }, { conf: 2 }, { fatigue: -3 }] },
    ],
  },
  // ======================= BREAKOUT =======================
  {
    id: 'na_brk_loser_ovation', category: 'breakout', title: 'The Ovation for the Wrong Person', weight: 2, contexts: ['post_match'], cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 8,
    cast: { opp: { pick: 'roster', tier: { gte: 1 } } }, memory: { role: 'opp', max: 1 },
    trigger: { stat: { popularity: { gte: 20, lte: 65 } }, recent: { lossesGte: 1 } },
    slots: { reaction: ['a standing ovation', 'a slow chant of your name', 'a storm of applause mixed with thrown paper cups', 'a stunned minute of noise'], moment: ['kicking out of the finisher at the last possible instant', 'getting up from the third big move when nobody expected it', 'crawling to the ropes through three pin attempts', 'biting back a smile after a brutal shot'] },
    body: ["{opp.name} got the win, but the building gave you {reaction} for {moment}. The referee raises the winner's arm and the noise refuses to stop, because it is for the wrong person.", "In the ring your lungs are burning and your head is spinning with a new idea: the crowd just told management who it wants. {opp.first} is looking at you, and whatever happens in the next ten seconds will be rewound in the production truck."],
    choices: [
      { id: 'raise', label: 'Raise the winner\'s arm and step back', risk: 'low', result: "The gesture earns quiet respect from the guys in the back, who know a pro when they see one lose well. {opp.first} gives a small nod that says thank you.", effects: [{ rel: { who: 'opp', respect: 5, trust: 3 } }, { pop: 0.2 }, { conf: 1 }] },
      { id: 'soak', label: 'Soak it in and let the crowd see you feel it', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.6 }, text: "You press a hand to your chest and the ovation doubles. By morning your name is in three producers' notes.", effects: [{ pop: 0.9 }, { conf: 4 }] },
        { weight: 1, text: "The winner reads the moment as a theft. {opp.first} stands very still with a tight jaw, and the heat afterwards is real.", effects: [{ pop: 0.5 }, { rel: { who: 'opp', heat: 8, respect: -3 } }, { conf: 1 }] } ] },
      { id: 'stare', label: 'Stare down the winner after the bell', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.6 }, text: "The building roars. {opp.first} smirks and shoves back, and a feud is born in the time it takes to find the next camera.", effects: [{ rivalry: { who: 'opp', heat: 12 } }, { pop: 0.8 }] },
        { weight: 1, text: "The stare-down reads as sore loser, and the cheers curdle into boos. The producers write it down as a miscalculation.", effects: [{ pop: -0.4 }, { rivalry: { who: 'opp', heat: 6 } }, { conf: -2 }] } ] },
      { id: 'slip', label: 'Slip out quickly and avoid the spotlight', risk: 'low', result: "The crowd is still going when you reach the curtain, and you tell yourself it was not for you. It was.", effects: [{ conf: -1 }, { pop: 0.1 }, { fatigue: -3 }] },
    ],
  },
  {
    id: 'na_brk_push_with_a_bill', category: 'breakout', title: 'A Push That Comes With a Bill', weight: 2, major: true, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 10,
    cast: { creative: { pick: 'staff', role: 'creative' }, vet: { pick: 'roster', tier: { gte: 3 } } }, memory: { role: 'vet', max: 1 },
    trigger: { stat: { popularity: { gte: 30, lte: 70 }, wins: { gte: 8 } } },
    slots: { gift: ['a featured spot in the opening segment', 'a three-week run opposite a top name', 'a run of vignettes before your matches', 'the closing slot of the semi-main'], cost: ['someone has to lose a spot for it', 'the veterans will see it as a land-grab', 'you will be working an extra date every week', 'it means a change of look that the fans may reject'] },
    body: ["{creative.name} lays out a plan that includes {gift}, and in the same breath admits that {cost}. The pen taps the table twice, as though deciding how honest to be.", "On the far side of the room, {vet.name}, who has held that kind of position for years, pours coffee with the stillness of someone who heard every word. A push is a gift that arrives with an invoice, and the locker room is where it gets paid."],
    choices: [
      { id: 'take', label: 'Take it and say thank you', risk: 'low', result: "You shake on it before anyone can reconsider. The push is real, and so is the cold stare you get in the locker room an hour later.", effects: [{ pop: 0.8 }, { conf: 4 }, { fatigue: 6 }, { rel: { who: 'vet', respect: -3, heat: 3 } }] },
      { id: 'blessing', label: 'Go to {vet.first} first and ask for a blessing', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: "{vet.first} laughs, tells you to keep your guard up, and gives you the one tip that matters: never let a crowd see you counting. The room takes note of who asked.", effects: [{ rel: { who: 'vet', respect: 6, trust: 4 } }, { pop: 0.5 }, { conf: 2 }] },
        { weight: 1, text: "{vet.first} says nothing at all, which is its own kind of answer. The push is still yours, but now you know what it is costing.", effects: [{ rel: { who: 'vet', respect: 1, trust: -2 } }, { conf: -2 }, { pop: 0.3 }] } ] },
      { id: 'ambition', label: 'Take it, and ask for an opponent worthy of it', risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.5 }, text: "{creative.first} likes the nerve and pencils in a heated feud on the spot. For one afternoon you have the room's full attention.", effects: [{ pop: 0.7 }, { conf: 3 }, { fatigue: 8 }] },
        { weight: 2, text: "Asking for more before delivering the first part reads as greed. The reply is a short, flat \"we will see,\" and the offer shrinks by half.", effects: [{ pop: 0.1 }, { conf: -3 }] } ] },
      { id: 'wait', label: 'Ask them to push someone else first', risk: 'low', result: "{creative.first} scribbles a note you cannot read. {vet.first} hears about it, finds you at catering and says that was either very wise or very foolish, and {vet.they} is voting for wise.", effects: [{ rel: { who: 'vet', respect: 5, affinity: 3 } }, { conf: -1 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'na_brk_empty_headset', category: 'breakout', title: 'Six Minutes of Live Television', weight: 2, contexts: ['pre_show'], cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 8,
    cast: { producer: { pick: 'staff', role: 'producer' } },
    trigger: { minYear: 1993, stat: { popularity: { gte: 15, lte: 60 }, promos: { lte: 15 } } },
    slots: { absent: ['a headliner stuck on a grounded flight', 'a champion with food poisoning', 'a talker whose voice gave out at lunch', 'a star called away by a family emergency'], length: ['three minutes', 'four minutes', 'six minutes of live television', 'a full segment of eight minutes'] },
    body: ["With {absent}, a hole has opened in the first hour, and {producer.name} wants you to fill {length} with your own words. There is no script, only a headset, a card with three bullet points and a microphone that has already been tested twice.", "Your pulse is in your ears and the arena sounds like surf. Every talker you ever admired had a first time, and the first time is rarely pretty."],
    choices: [
      { id: 'bullets', label: 'Hit the three bullet points and speak plainly', risk: 'low', result: "After an hour of rehearsing in a stairwell, you deliver it clean and short, never straying from the card. Nobody will quote it, but nobody will mock it either, and {producer.first} breathes out in the truck.", effects: [{ pop: 0.3 }, { conf: 2 }, { mic: 1 }, { fatigue: 8 }] },
      { id: 'gut', label: 'Throw the card away and speak from the gut', risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.7, confidence: 0.4 }, text: "The words arrive from somewhere deeper than you planned, and the crowd goes quiet in the good way. When you drop the mic, the pop is the loudest you have ever heard.", effects: [{ pop: 1.2 }, { conf: 6 }, { mic: 1 }] },
        { weight: 2, text: "Your thoughts scatter and four seconds of dead air come out of the speakers. The crowd begins a polite, pitying chant to help you along.", effects: [{ pop: -0.6 }, { conf: -6 }] } ] },
      { id: 'veteran', label: 'Ask for a veteran to share the segment with you', risk: 'med', result: "{producer.first} finds a seasoned talker willing to stand beside you. The segment is steadier for it, though the best line of the night ends up in the other mouth.", effects: [{ pop: 0.3 }, { conf: 1 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'squash', label: 'Say you are not ready and offer a squash match instead', risk: 'low', result: "{producer.first} nods, a little disappointed, and fills the hole with something safer. You work a short match instead, and the chance goes to someone else's name.", effects: [{ conf: -3 }, { pop: 0.1 }, { fatigue: 6 }] },
    ],
  },
  {
    id: 'na_brk_hometown_third_row', category: 'breakout', title: 'Home Crowd in {arena}', weight: 2, contexts: ['show_day'], cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 8,
    trigger: { stat: { popularity: { gte: 25 }, matches: { gte: 20 } } },
    slots: { familiar: ['your old high-school coach', 'the landlord who once let your rent slide', 'a neighbor who always told you to get a real job', 'the owner of the diner where you washed dishes'], arena: ['the civic center where you watched your first show', 'a minor-league ballpark', 'the county fairgrounds', 'a basketball arena hung with your old school\'s banners'] },
    body: ["The tour has landed in {arena}, forty minutes from the house you grew up in. In the third row sits {familiar}, who has apparently bought a ticket and brought a loud friend.", "Everything about the night feels enlarged and shrunken at the same time. Your name on the poster is bigger than any sign in town, and the road you grew up on is exactly as small as it always was."],
    choices: [
      { id: 'nod', label: 'Acknowledge them with a small nod from the ring', risk: 'low', result: "The nod is tiny and the response is huge. For the rest of the match the third row cheers as though they personally trained you.", effects: [{ pop: 0.5 }, { conf: 4 }] },
      { id: 'callout', label: 'Call them out by name on the mic', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: "The whole arena turns to look, and a face in the third row goes bright red with delight. The pop is the warmest of the tour.", effects: [{ pop: 1.0 }, { conf: 3 }] },
        { weight: 1, text: "Being singled out is not what they wanted, and they sink into the seat while the crowd turns the moment into a joke at their expense.", effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'drive', label: 'Spend the afternoon driving past your old neighborhood', risk: 'low', result: "You pass the house, the diner and the field behind the school. Nothing has changed, and you have changed too much to explain it to the street, and you come back to the arena quiet and clear.", effects: [{ conf: 3 }, { fatigue: 5 }] },
      { id: 'tickets', label: 'Leave tickets and a note, and keep your head in the match', risk: 'low', result: "You send good seats and a three-line note, and then you stop thinking about the third row. The match that follows is one of the cleanest of your month.", effects: [{ money: -80 }, { conf: 2 }, { pop: 0.2 }, { attr: { name: 'psychology', delta: 1 } }] },
    ],
  },
  {
    id: 'na_brk_shirt_sells_out', category: 'breakout', title: 'The Shirt That Sold Out Twice', weight: 1.5, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 8,
    cast: { exec: { pick: 'staff', role: 'executive' } },
    trigger: { stat: { popularity: { gte: 30, lte: 75 }, money: { lte: 60000 } } },
    slots: { item: ['black T-shirt with your catchphrase', 'replica of your entrance jacket', 'red-and-gold hoodie with your logo', 'foam-rubber copy of your title-shot belt'], hurdle: ['the printer says a rush order costs double', 'the cheaper fabric is already sitting in a warehouse', 'the vendor can only deliver in six weeks', 'the executive worries the fad could fade overnight'] },
    body: ["The first run of your {item} sold out in two nights, and {exec.name} stands next to a pallet of empty boxes wearing a smile that is half pride and half arithmetic. The figures are small by company standards, but large enough to carry your face into a meeting.", "Before anyone prints a second run there is a decision to make, because {hurdle}. The profitable path is not always the wise one, and the fans are the ones who will wear the result."],
    choices: [
      { id: 'rush', label: 'Rush a bigger order and pay the premium', risk: 'high', effects: [{ money: -3000 }], outcomes: [
        { weight: 2, text: "The rush run lands in time for the next tour, and it sells through the arena concourse in an hour. You net more than you spent and then some.", effects: [{ money: 9000 }, { pop: 0.4 }, { conf: 3 }] },
        { weight: 1, text: "The fad cools by the time the boxes arrive, and a stack of unsold shirts lingers in the back of a truck for the rest of the season.", effects: [{ money: 1500 }, { conf: -3 }] } ] },
      { id: 'cheap', label: 'Order a modest second run on cheaper fabric', risk: 'low', result: "The second run sells slowly, and the fabric shrinks in the first wash. A fan writes politely to say so, and you read it twice.", effects: [{ money: 600 }, { pop: -0.2 }] },
      { id: 'quality', label: 'Insist on a better shirt and accept a thin margin', risk: 'med', result: "{exec.first} sighs at the spreadsheet but signs off. The shirt feels like it will outlast the feud it was printed for, and people notice.", effects: [{ money: -400 }, { pop: 0.3 }, { conf: 3 }] },
      { id: 'donate', label: 'Pledge the next run\'s profit to a local youth gym', risk: 'low', result: "The pledge costs you the profit but makes the local news. {exec.first} raises an eyebrow, then quietly approves a photograph of you with a very small, very proud kid in a too-big shirt.", effects: [{ money: -500 }, { pop: 0.6 }, { conf: 2 }] },
    ],
  },
  {
    id: 'na_brk_locker_room_toll', category: 'breakout', title: 'The Unwritten Rule About {rule}', weight: 1.5, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 8,
    cast: { vet: { pick: 'roster', tier: { gte: 3 } } }, memory: { role: 'vet', max: 1 },
    trigger: { stat: { popularity: { gte: 30, lte: 70 } } },
    slots: { rule: ['the first shower', 'the good bench', 'the first plate at catering', 'the front seat on the ride out'], attitude: ['smiles without warmth', 'laughs once through the nose', 'does not look up from the card game', 'taps a boot against the floor'] },
    body: ["In the locker room there is an unwritten rule about {rule}, and in the glow of your recent pop you have broken it twice this week. {vet.name} {attitude} and remarks that this room has a very long memory.", "Nobody here is cruel for the sake of it; the hierarchy is how a hundred egos avoid becoming a fire. You are a name now, and names have to choose between being respected and merely being noticed."],
    choices: [
      { id: 'defer', label: 'Apologize and give up the spot', risk: 'low', result: "You say sorry without making a show of it. {vet.first} accepts with a shrug that lasts long enough to count as forgiveness.", effects: [{ rel: { who: 'vet', respect: 4, trust: 2 } }, { conf: -1 }, { pop: -0.1 }] },
      { id: 'ask', label: 'Ask what the room expects from you now', risk: 'low', result: "{vet.first} gives you a ten-minute lesson on who to thank, who to avoid and which jokes to leave unsaid. It turns out to be a much warmer room than it looked.", effects: [{ rel: { who: 'vet', respect: 4, affinity: 4 } }, { tag: { who: 'vet', tag: 'mentor' } }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'hold', label: 'Hold your ground: you earned a place', risk: 'high', outcomes: [
        { weight: 1, bonus: { confidence: 0.6 }, text: "A couple of people hide smiles and {vet.first} grudgingly nods, as though to say that was the first honest thing today.", effects: [{ rel: { who: 'vet', respect: 3, fear: 3 } }, { conf: 5 }] },
        { weight: 2, text: "The room chills a few degrees. {vet.first}'s friends find reasons not to sit near you for weeks.", effects: [{ rel: { who: 'vet', heat: 8, respect: -2 } }, { rivalry: { who: 'vet', heat: 8 } }, { conf: -2 }] } ] },
      { id: 'coffee', label: 'Pay the toll with a round of coffee for the room', risk: 'low', result: "A cardboard tray of coffees settles things better than any speech. The room laughs, and the veterans grumble that rookies these days have manners.", effects: [{ money: -45 }, { rel: { who: 'vet', respect: 3, affinity: 4 } }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'na_brk_stand_in_headliner', category: 'breakout', title: 'You Are Closing the Show', weight: 2, major: true, contexts: ['show_day'], cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 12,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { stat: { overall: { gte: 50 }, mainEvents: { lte: 1 }, popularity: { gte: 40 } } },
    slots: { why: ['A flu has taken the usual headliner', 'A storm has stranded the main-event team', 'An old knee gave out at warm-ups', 'A missed connection has put the top star in the wrong city'], arena: ['a sold-out civic center', 'a hockey arena with a thousand seats still empty', 'an outdoor fairground at dusk', 'a full house of the loudest people on the circuit'] },
    body: ["{agent.name} finds you in the hallway and says three words: you are closing. {why}, and the card still has to end with somebody in {arena}.", "The thought that crawls up is cold and simple: you do not belong here, and everyone is about to find out. Impostor syndrome is a luxury when you have to find a finish in a very short time."],
    choices: [
      { id: 'rise', label: 'Take the spot and treat it as your night', risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.7, confidence: 0.5 }, text: "You work with the calm of a person who has run out of time to be afraid. The final bell brings a roar that you carry back down the aisle like a trophy.", effects: [{ pop: 1.5 }, { conf: 7 }, { fatigue: 10 }] },
        { weight: 1, text: "The night is bigger than you are, and the match shows it. The crowd is kind, and you can hear exactly how kind.", effects: [{ pop: 0.2 }, { conf: -3 }, { fatigue: 12 }] } ] },
      { id: 'safe', label: 'Take it and stick to a tried-and-true structure', risk: 'low', result: "You choose the match you know best and run it without sparks or surprises. It is solid, forgettable and totally professional.", effects: [{ pop: 0.5 }, { conf: 3 }, { fatigue: 6 }] },
      { id: 'veteran', label: 'Ask a veteran to help build the match with you', risk: 'med', result: "A grizzled hand scratches out a plan on the back of a catering menu, and the ringside notes you take are better than anything you wrote alone.", effects: [{ pop: 0.4 }, { conf: 4 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 4 }] },
      { id: 'decline', label: 'Say you are not ready and suggest a veteran', risk: 'low', result: "{agent.first} respects the honesty but writes down the date. Someone else closes, and you watch from the gorilla position, learning something and losing something.", effects: [{ conf: -5 }, { fatigue: -3 }] },
    ],
  },
  {
    id: 'na_brk_letter_from_a_fan', category: 'breakout', title: 'A Package Addressed in Shaky Handwriting', weight: 1.5, cooldownDays: 180, maxPerCareer: 2, categoryCooldown: 8,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 30 } } },
    slots: { gift: ['a crayon portrait of your entrance', 'a hand-knit scarf in your colors', 'a tape of your matches, labeled in careful capitals', 'a paper championship belt made of foil'], origin: ['a children\'s ward three states away', 'a nursing home whose staff wrote the address', 'a small-town school', 'a hospice with a quiet garden'] },
    body: ["A package waits at the arena, addressed in careful, shaky handwriting: {gift}, sent from {origin}. {fan.name} has written the note with real effort, and ends by saying you are the reason anyone laughs on Mondays.", "It would be easy to tape the note up in the locker room and move on, and nobody would blame you. Real mail is rare, and it asks for nothing except a minute and a little of the thing that makes people feel seen."],
    choices: [
      { id: 'visit', label: 'Drive out and visit in person', risk: 'med', result: "The visit lasts an hour in a small room that smells of paint and disinfectant. You leave humbled and strangely lighter, and you will remember the faces long after you forget the match.", effects: [{ money: -120 }, { fatigue: 10 }, { conf: 5 }, { pop: 0.5 }] },
      { id: 'write', label: 'Write back by hand and sign a stack of photos', risk: 'low', result: "You spend an evening on the letter, crossing out two drafts, and post it with the photos. A week later a thank-you drawing finds its way back to the locker room.", effects: [{ money: -20 }, { fatigue: 2 }, { conf: 3 }, { pop: 0.2 }] },
      { id: 'camera', label: 'Invite a camera crew to document the visit', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: "The segment is gentle, short and unforced, and it does the rounds on a Tuesday night. People write to say it made them call their parents.", effects: [{ pop: 1.3 }, { conf: 2 }, { fatigue: 8 }] },
        { weight: 1, text: "A columnist calls it a stunt, and a fan on the radio agrees. The visit itself was real, but the cameras made it hard to prove.", effects: [{ pop: -0.5 }, { conf: -4 }, { fatigue: 8 }] } ] },
      { id: 'pin', label: 'Pin the note up in the locker room and carry on', risk: 'low', result: "It goes beside the schedule and a bad photograph of the ring crew. Every time you pass it you straighten your back a little, though you never get around to answering.", effects: [{ conf: 2 }] },
    ],
  },
  // ======================= CONTRACT =======================
  {
    id: 'na_con_agent_leaving', category: 'contract', title: 'The Agent Who Is Leaving', weight: 2, cooldownDays: 300, maxPerCareer: 1, categoryCooldown: 10,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { contract: { lte: 240 } },
    slots: { reason: ['a better offer from a rival office', 'a shoulder that will no longer let them travel', 'a sick parent in another state', 'a falling-out with the executives that nobody explained to you'], timing: ['at the end of the month', 'before your next renewal', 'the day after tomorrow', 'as soon as a replacement can be found'] },
    body: ["{agent.name} sits you down in a quiet corner of catering with two coffees and a tired face. The announcement is short: they are leaving {timing}, because of {reason}.", "You have never signed a page without this person reading it first, and now the pages ahead look blank. Contracts are written by people who know exactly what they want, and for the first time you may be the only one at your table who does not."],
    choices: [
      { id: 'thanks', label: 'Thank them and ask who they trust to replace them', risk: 'low', result: "They write three names on a napkin, and the first one turns out to be somebody you will meet next week. The goodbye is warm, with the unspoken promise of a call at Christmas.", effects: [{ conf: 2 }, { fatigue: 2 }] },
      { id: 'follow', label: 'Ask to follow them to the new company', risk: 'high', outcomes: [
        { weight: 1, bonus: { popularity: 0.5 }, text: "They cannot promise anything, but a call arrives a week later with a figure and a flattering tone. The signing money is real even if the move is not.", effects: [{ money: 4000 }, { conf: 3 }] },
        { weight: 2, text: "The question travels faster than the answer. By Friday the office has noted that you were shopping yourself, and nobody will say it out loud.", effects: [{ pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'alone', label: 'Learn to read every page yourself from now on', risk: 'med', result: "You buy a cheap legal pad and a yellow highlighter. It takes weeks to learn the vocabulary, but you never again sign something you cannot explain.", effects: [{ attr: { name: 'psychology', delta: 1 } }, { conf: 3 }, { fatigue: 8 }] },
      { id: 'lawyer', label: 'Put a lawyer on retainer to replace them', risk: 'low', requires: { stat: { money: { gte: 3000 } } }, result: "The lawyer is expensive and polite, and the office notices the new letterhead. Replies to your emails become noticeably more careful.", effects: [{ money: -2500 }, { conf: 2 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'na_con_yellow_clause', category: 'contract', title: 'One Line Highlighted in Yellow', weight: 2, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 10,
    cast: { exec: { pick: 'staff', role: 'executive' } },
    trigger: { contract: { lte: 150 } },
    slots: { clause: ['a merchandise split that favors the company', 'a ban on all outside bookings', 'an image-rights waiver covering every video format ever invented', 'a notice period that only runs one way'], sweetener: ['a modest raise', 'a signing bonus', 'a guaranteed number of television dates', 'a title match in the next quarter'] },
    body: ["A new draft arrives from {exec.name}'s office, thick as a phone book, with one change flagged in yellow: {clause}. Stapled to the front is {sweetener}, offered in the tone of someone handing out candy at a dentist.", "Nobody has said the word no, and nobody has said it is optional. Things like this are only negotiable until the ink dries, and each day you sit with the page, more hands have touched it."],
    choices: [
      { id: 'sign', label: 'Sign it and take the sweetener', risk: 'low', result: "You sign without reading the yellow bit twice. The check clears, and the clause sits in the file like a sleeping dog.", effects: [{ money: 3000 }, { conf: -2 }] },
      { id: 'strike', label: 'Strike the clause and send the draft back', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5, charisma: 0.4 }, text: "Back comes a version with the clause softened and the sweetener intact. {exec.first} even adds a handwritten line about appreciating directness.", effects: [{ conf: 4 }, { pop: 0.1 }, { money: 1000 }] },
        { weight: 2, text: "The reply is cold and brief. The sweetener is gone, and your next set of dates is noticeably thinner.", effects: [{ conf: -3 }, { pop: -0.3 }] } ] },
      { id: 'trade', label: 'Trade the clause for something concrete in writing', risk: 'med', result: "You give ground on one point and get a fixed number of dates and a named day of review. Neither side loves it, and both can live with it.", effects: [{ money: 1500 }, { conf: 3 }, { fatigue: 5 }] },
      { id: 'ask', label: 'Ask the veterans which clauses are ever enforced', risk: 'low', result: "Every veteran has a story, and the yellow clause has been used twice, both times quietly. You sign with open eyes, knowing exactly what you are risking.", effects: [{ attr: { name: 'psychology', delta: 1 } }, { conf: 2 }, { money: 800 }] },
    ],
  },
  {
    id: 'na_con_pay_cut', category: 'contract', title: 'Fifteen Percent, Delivered {delivery}', weight: 2, major: true, cooldownDays: 300, maxPerCareer: 1, categoryCooldown: 12,
    cast: { exec: { pick: 'staff', role: 'executive' } },
    trigger: { contract: { lte: 200 }, stat: { popularity: { lte: 55 }, careerYears: { gte: 5 } } },
    slots: { delivery: ['over a conference call with no cameras', 'in a hallway between two other meetings', 'in a spotless office with a bowl of mints', 'over a lunch you were not expecting to pay for'], reason: ['a budget realignment', 'a restructuring of the talent tiers', 'market conditions that nobody will specify', 'a flat percentage applied to every contract above a certain line'] },
    body: ["Your guarantee will fall by fifteen percent next quarter, {exec.name} explains, citing {reason}. It is said fluently, like a script that has been read to others, and the word cut never comes up.", "You have given most of your body to this company, and the arithmetic looks very different from your side of the desk. Every veteran in the building has a version of this story, and most of them end in the same quiet parking lot."],
    choices: [
      { id: 'accept', label: 'Accept the cut and keep your head down', risk: 'low', result: "You nod, sign and say thank you, because being cooperative is a currency of its own. It may help in the next round of talks, and it may not.", effects: [{ money: -4000 }, { conf: -3 }, { pop: 0.1 }] },
      { id: 'fight', label: 'Fight it, citing your years of loyalty', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: "Your argument is calm and specific, and it lands. The cut is halved and the meeting ends with a tired handshake that feels almost respectful.", effects: [{ money: -2000 }, { conf: 3 }] },
        { weight: 1, text: "The handshake at the end is icy. The cut stands in full, and your name drops a few lines on the dates sheet.", effects: [{ money: -4000 }, { conf: -4 }, { pop: -0.4 }] } ] },
      { id: 'trade', label: 'Trade salary for more dates and a merchandise percentage', risk: 'med', result: "You swap guaranteed money for volume: more nights, a bigger share of every shirt sold. The work will be harder, but at least part of the income is something you control.", effects: [{ money: -3000 }, { fatigue: 10 }, { pop: 0.3 }] },
      { id: 'leak', label: 'Let it slip to a reporter and see who flinches', risk: 'high', outcomes: [
        { weight: 1, text: "A ripple of sympathy runs through the locker room and the cut is quietly rescinded for the whole tier. You are thanked by no one and noticed by everyone.", effects: [{ money: 2000 }, { pop: 0.5 }, { conf: 4 }] },
        { weight: 2, text: "Nobody flinches except you. The office learns who talked, and a door you did not know was open softly closes.", effects: [{ pop: -0.8 }, { conf: -5 }, { money: -4000 }] } ] },
    ],
  },
  {
    id: 'na_con_signing_day', category: 'contract', title: 'Signing Day in {venue}', weight: 2.5, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 12,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { contract: { lte: 90 }, stat: { popularity: { lte: 40 }, careerYears: { lte: 4 } } },
    slots: { venue: ['a glass-walled conference room', 'the hotel bar at eleven at night', 'a loading dock with a folding table', 'the back seat of a town car'], extra: ['a photographer waits for the pen to move', 'a nervous intern holds the stamp', 'your family sits in the next room pretending not to listen', 'the ring crew chief waits outside with a fist ready to bump'] },
    body: ["Four pages of the contract matter, {agent.name} says as the pages are turned, and the remaining forty-six are there to be read by nobody until the day somebody does. While you flip, {extra}.", "A heavy pen with the company logo slides across the table. This signature will outlast the bumps, the bruises and probably the version of you who is about to agree to it."],
    choices: [
      { id: 'long', label: 'Sign the three-year deal for security', risk: 'low', result: "The ink dries, and three years of weekends, buses and mornings are suddenly accounted for. Security feels heavier than you thought it would, but also kinder.", effects: [{ contract: { years: 3, salary: 68000 } }, { money: 1500 }, { conf: 3 }, { flag: 'na_new_deal' }] },
      { id: 'short', label: 'Sign for one year and keep your options open', risk: 'med', result: "A single year, a smaller number, and a door that stays open. The agent smiles with the tight look of a person who preferred the other route.", effects: [{ contract: { years: 1, salary: 58000 } }, { conf: 1 }, { pop: 0.1 }, { flag: 'na_new_deal' }] },
      { id: 'bonus', label: 'Take a lower salary for a bigger signing bonus', risk: 'med', result: "The bonus lands in your account before dinner and the salary is a quiet embarrassment in the file. You buy something sensible and something not, and feel guilty about only one.", effects: [{ contract: { years: 2, salary: 52000 } }, { money: 6000 }, { flag: 'na_new_deal' }] },
      { id: 'read', label: 'Ask for a day to read all fifty pages', risk: 'low', result: "You come back next morning having found a typo, a missing comma and a clause you circled twice. The office is irritated but unmoved, and the deal stands as drafted.", effects: [{ conf: 3 }, { fatigue: 4 }, { attr: { name: 'psychology', delta: 1 } }] },
    ],
  },
  {
    id: 'na_con_better_deal', category: 'contract', title: 'Someone Got a Better Number {where}', weight: 2, cooldownDays: 200, maxPerCareer: 1, categoryCooldown: 8,
    cast: { peer: { pick: 'roster', tier: { gte: 1, lte: 3 } } }, memory: { role: 'peer', max: 1 },
    trigger: { flag: 'na_new_deal', noFlag: 'na_deal_regret_done' },
    slots: { where: ['on a shared ride to the hotel', 'in a hotel gym at six in the morning', 'while folding gear in the locker room', 'at a diner after the show'], difference: ['a higher guarantee', 'a clause protecting {peer.their} dates', 'a bigger merchandise cut', 'a written promise of title opportunities'] },
    body: ["{peer.name} mentions it, thinking nothing of it: {peer.their} new deal includes {difference}. It sounds better than yours, and it feels like a cold draft across your own paperwork.", "There is no villain in this, only the ordinary way information moves through a locker room. Resentment is an easy meal and a poor one, and everyone at the table is going to taste it either way."],
    choices: [
      { id: 'ask', label: 'Ask {peer.first} how {peer.they} negotiated it', risk: 'low', result: "{peer.first} talks you through it honestly, naming the questions to ask and the people to avoid. The last piece of advice is simply to ask for more than you think is polite.", effects: [{ rel: { who: 'peer', affinity: 4, trust: 3 } }, { attr: { name: 'psychology', delta: 1 } }, { flag: 'na_deal_regret_done' }] },
      { id: 'silent', label: 'Say nothing and file it away', risk: 'low', result: "You nod, finish the coffee and say you are happy for {peer.them}. The number follows you around for days like a cat that will not be fed.", effects: [{ conf: -2 }, { flag: 'na_deal_regret_done' }] },
      { id: 'office', label: 'Take it to the office and ask for parity', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: "The office quietly improves your numbers and tells you not to mention it to anyone. You do not, though {peer.first} guesses.", effects: [{ money: 2500 }, { conf: 3 }, { flag: 'na_deal_regret_done' }] },
        { weight: 2, text: "Different circumstances, they say, different time, different leverage. The words are polite, and the message is that you asked after the ink was dry.", effects: [{ pop: -0.3 }, { conf: -3 }, { flag: 'na_deal_regret_done' }] } ] },
      { id: 'cheer', label: 'Congratulate {peer.them} sincerely and mean it', risk: 'low', result: "You buy the coffee and say you are glad someone got a good deal. {peer.first} looks surprised, then relieved, and the rest of the ride is easy.", effects: [{ rel: { who: 'peer', respect: 4, affinity: 3 } }, { conf: 1 }, { money: -10 }, { flag: 'na_deal_regret_done' }] },
    ],
  },
  {
    id: 'na_con_scout_in_row', category: 'contract', title: 'A Stranger With a Notepad', weight: 2, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 10,
    trigger: { contract: { lte: 150 }, stat: { popularity: { gte: 40 } } },
    slots: { scout: ['a tall man in a leather jacket who never claps', 'a polite woman with a leather folder', 'a pair of brothers who run a successful traveling show', 'a producer from an overseas television network'], offer: ['more money', 'creative control', 'a lighter schedule', 'a main-event slot of your own'] },
    body: ["In the front row sits {scout}, who has been watching your entire match over the top of a notepad. After the show, a card slides under the locker-room door promising {offer} if you are ever curious.", "It feels both flattering and treacherous, like finding someone else's key in your pocket. The company has ears everywhere, and curiosity alone can look like a kind of disloyalty."],
    choices: [
      { id: 'call', label: 'Take the call in secret', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: "The conversation is short, polite and nothing is promised. You carry a number in your head afterwards, and it improves the way you walk into the next meeting.", effects: [{ conf: 4 }, { fatigue: 2 }] },
        { weight: 1, text: "Someone in the hallway saw you step out for the call. By Monday the office knows, and nobody mentions it, which is how you can tell.", effects: [{ pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'raise', label: 'Show the card to the office and ask for a raise', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: "Within days the office, spooked, produces a bump in your guarantee. You earned it, and you will pay for it in goodwill.", effects: [{ money: 3500 }, { conf: 3 }] },
        { weight: 2, text: "The office bristles at what feels like a threat. The raise never comes, and your name gets a little less attention at the next meeting.", effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
      { id: 'tear', label: 'Tear up the card and stay loyal', risk: 'low', result: "You drop the pieces in the arena trash and tell no one. It feels clean, and loyalty is the kind of thing that is thanked by gratitude and not by money.", effects: [{ conf: 3 }, { pop: 0.1 }] },
      { id: 'keep', label: 'Slip the card into your bag and say nothing', risk: 'low', result: "It stays beside your boots for months, a small warm coal. Some mornings you take it out, read the number and put it away again.", effects: [{ conf: 1 }, { fatigue: 1 }] },
    ],
  },
  {
    id: 'na_con_cleaning_out', category: 'contract', title: '{pal.name} Cleans Out a Locker', weight: 2, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 10,
    cast: { pal: { pick: 'tag', tag: 'ally' } }, memory: { role: 'pal', max: 2 },
    trigger: {},
    slots: { where: ['in the parking lot beside a rented car', 'at the hotel front desk with a trash bag of gear', 'in a hallway where nobody knows where to look', 'on the loading dock with a bag of boots'], sign: ['a company envelope', 'a hug that lasts too long', 'a joke that does not quite land', 'a look that begs you not to say anything'] },
    body: ["The release was processed that morning, and {pal.name} is packing {where}. Everyone else in the building seems to have discovered urgent business elsewhere.", "The goodbye arrives with {sign}. You still have a contract, and the luck feels like a stone in your pocket."],
    choices: [
      { id: 'carry', label: 'Help carry the bag to the car', risk: 'low', result: "You say little, because there is little to say, and you carry the bag as though it weighed more. {pal.first} grips your arm once at the car door and drives away without looking back.", effects: [{ rel: { who: 'pal', affinity: 6, trust: 4 } }, { conf: -1 }, { fatigue: 4 }] },
      { id: 'dinner', label: 'Take {pal.first} out for a proper dinner', risk: 'low', result: "You eat too much and talk about nothing, and for two hours no one mentions the envelope. {pal.first} insists on leaving the tip, which is somehow the worst moment of the night.", effects: [{ money: -90 }, { rel: { who: 'pal', affinity: 5, respect: 3 } }, { conf: 1 }] },
      { id: 'argue', label: 'Go to the office and argue for a second look', risk: 'high', outcomes: [
        { weight: 1, text: "The office gives {pal.first} thirty more days to prove a point. Word of what you did spreads quickly through the roster, mostly warmly.", effects: [{ rel: { who: 'pal', trust: 8, affinity: 4 } }, { conf: 3 }, { pop: 0.1 }] },
        { weight: 2, text: "The answer is no, and a polite note appears in your own file about misplaced loyalty.", effects: [{ rel: { who: 'pal', trust: 3 } }, { pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'distance', label: 'Say a quick goodbye and keep your distance', risk: 'low', result: "You cannot afford to be seen at the car, you tell yourself, and by the time you decide otherwise the car is gone. It stays with you for longer than you expect.", effects: [{ rel: { who: 'pal', trust: -4, affinity: -3 } }, { conf: 2 }] },
    ],
  },
  {
    id: 'na_con_injury_protection', category: 'contract', title: 'A Clause for the Bad Nights', weight: 2, cooldownDays: 300, maxPerCareer: 1, categoryCooldown: 10,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { contract: { lte: 240 }, stat: { injuries: { gte: 2 } } },
    slots: { protection: ['guaranteed pay during recovery', 'a health plan that covers your whole family', 'a salary floor for the first year after a serious injury', 'a doctor of your choice on call'], cost: ['a slightly lower base salary', 'one extra date a month', 'a longer contract', 'a promise to keep medical disputes out of the press'] },
    body: ["After the last few injuries, {agent.name} wants to add {protection} to your next contract. The company is willing to write it in, but only in exchange for {cost}.", "It is strange how clearly you can see the ring's cruelty on paper: every clause is a wound with a price tag. Whoever signs this will be the version of you who finally understood what a bad night can cost."],
    choices: [
      { id: 'take', label: 'Accept the trade for the protection', risk: 'low', result: "You sign and feel your shoulders drop an inch. The next bad bump will still hurt, but it will not be a financial emergency.", effects: [{ money: -1500 }, { conf: 3 }, { fatigue: -2 }] },
      { id: 'refuse', label: 'Refuse and bet on staying healthy', risk: 'high', outcomes: [
        { weight: 2, text: "You keep the full salary and stay lucky. The decision looks wise for several months, and everyone agrees not to look too closely.", effects: [{ money: 2000 }, { conf: 3 }] },
        { weight: 1, text: "Two weeks later a hamstring grabs on a routine rope run. The doctor is kind, and the bill is not.", effects: [{ injury: { part: 'legs', severity: 1, days: 8 } }, { money: -1000 }, { conf: -3 }] } ] },
      { id: 'both', label: 'Push for the protection and no cost at all', risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.5, confidence: 0.4 }, text: "The agent pushes, the executives sigh, and a version comes back with half the cost removed. Both sides claim to have won.", effects: [{ conf: 4 }, { money: -500 }, { fatigue: 4 }] },
        { weight: 2, text: "The office takes offense at the greed and withdraws the whole offer. You are left with the old terms and a new reputation.", effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
      { id: 'own', label: 'Buy your own coverage and skip the trade', risk: 'low', result: "The premium is steep and the paperwork is dull, but the policy belongs to you and no clause can touch it. You sleep a little better.", effects: [{ money: -1200 }, { conf: 2 }, { fatigue: -2 }] },
    ],
  },
  // ======================= INJURY =======================
  {
    id: 'na_inj_penlight_at_the_curtain', category: 'injury', title: 'The Doctor at the Curtain', weight: 2.5, major: true, contexts: ['post_match'], cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 10,
    cast: { doctor: { pick: 'staff', role: 'doctor' } },
    trigger: { injured: false, stat: { fatigue: { gte: 30 } } },
    slots: { moment: ['after a back-body drop into the barricade', 'after a clothesline that landed high', 'after a collision with a ring post', 'after a chair shot that was half an inch too real'], symptom: ['double vision that clears when you blink', 'a ringing that will not stop', 'a sour wave of nausea', 'a blank patch where the finish used to be'] },
    body: ["The trouble started {moment}: {symptom}, which you have told nobody about. {doctor.name} watched from ringside anyway, and is now waiting at the curtain with a penlight and a patient expression.", "Doctors in this business have a particular patience, the kind that knows exactly how many athletes have lied at this curtain. A wrong answer here costs a few weeks, and a right one might save you years."],
    choices: [
      { id: 'truth', label: 'Tell the full truth about every symptom', risk: 'low', result: "You list everything, down to the detail you were hoping to leave out. {doctor.first} writes it up, and the week off is a relief you did not expect.", effects: [{ injury: { part: 'head', severity: 1, days: 7 } }, { fatigue: -6 }, { conf: -1 }, { pop: -0.1 }] },
      { id: 'minimize', label: 'Play it down and pass the penlight test', risk: 'high', outcomes: [
        { weight: 1, text: "You pass the test and the symptoms drain away by morning. You will never be quite sure whether you got away with something.", effects: [{ fatigue: 6 }, { conf: 2 }] },
        { weight: 2, text: "You pass the test and collapse in the hotel bathroom at two in the morning. The second doctor is far less polite than the first.", effects: [{ injury: { part: 'head', severity: 2, days: 21 } }, { conf: -5 }, { pop: -0.3 }] } ] },
      { id: 'second', label: 'Ask for a recheck first thing in the morning', risk: 'med', result: "{doctor.first} agrees if you rest tonight and sleep with someone checking in. Morning is bright and clear, and you are cleared with a stern warning.", effects: [{ fatigue: -4 }, { conf: 1 }] },
      { id: 'skip', label: 'Volunteer to skip the next dates yourself', risk: 'low', result: "The volunteer note earns an approving glance from {doctor.first} and a sigh from the booking office. You rest, and no one has to argue with you.", effects: [{ fatigue: -8 }, { pop: -0.2 }, { conf: 2 }] },
    ],
  },
  {
    id: 'na_inj_hospital_visitor', category: 'injury', title: 'A Visitor After Midnight', weight: 2, cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 10,
    trigger: { injured: true, serious: true },
    slots: { visitor: ['the ring crew chief with a paper bag of sandwiches', 'your agent with a stack of mail', 'a rookie who does not know what to say', 'the referee from tonight\'s match'], sound: ['a monitor beeping slightly out of rhythm', 'a vending machine humming down the corridor', 'rain against a window you cannot reach', 'a cart that squeaks past every twenty minutes'] },
    body: ["The hospital is quieter than any arena you ever worked, and the only noise is {sound}. Sometime after midnight, {visitor} turns up at the door, still smelling of cold air and the building you were taken from.", "A hospital room strips a wrestler of a name and leaves a body in a gown. Visitors at this hour do something no crowd can do, which is to see someone who is not performing."],
    choices: [
      { id: 'talk', label: 'Talk, even when it hurts to laugh', risk: 'low', result: "You trade stories until the nurse comes in twice to complain. Laughing costs you a wince each time, and it is the best medicine in the building.", effects: [{ conf: 4 }, { fatigue: 2 }] },
      { id: 'quiet', label: 'Ask them to sit in the silence with you', risk: 'low', result: "Neither of you says anything for most of an hour. When you finally drift off, someone is still in the chair, and that is the whole kindness.", effects: [{ conf: 3 }, { fatigue: -4 }] },
      { id: 'send', label: 'Send them away; you do not want to be seen like this', risk: 'low', result: "Pride says no, and the visitor goes without argument. The room is exactly as quiet as before, only now it is yours alone.", effects: [{ conf: -3 }, { fatigue: -2 }] },
      { id: 'ask', label: 'Ask what the back is saying about you', risk: 'med', outcomes: [
        { weight: 2, text: "They tell you the whole roster signed a card, and that the doctors' note was read aloud with something like respect. You fall asleep with that on your chest.", effects: [{ pop: 0.3 }, { conf: 4 }] },
        { weight: 1, text: "They tell you who is already filling your spot. You wish you had not asked, and you cannot stop asking yourself the follow-up.", effects: [{ conf: -5 }] } ] },
    ],
  },
  {
    id: 'na_inj_written_into_story', category: 'injury', title: 'A Real Injury, a Fictional Culprit', weight: 2, major: true, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 12,
    cast: { creative: { pick: 'staff', role: 'creative' }, attacker: { pick: 'roster', tier: { gte: 2 }, alignment: 'heel' } }, memory: { role: 'attacker', max: 1 },
    trigger: { injured: true },
    slots: { angle: ['a parking-lot ambush', 'a steel-chair assault after the bell', 'a ladder spot that supposedly went wrong', 'a locker-room door slammed on your arm'], delivery: ['as a surprise at the next taping', 'in a sit-down clip aired this week', 'through a ringside announcement', 'in a segment that never shows your face'] },
    body: ["{creative.name} has found a use for your injury: a story in which {attacker.name} caused it with {angle}, to be revealed {delivery}. The facts in your medical file and the facts on television would be two different things.", "In a perfect world the real and the staged stay in separate rooms. In this one, a real injury is the only kind of drama people believe, and they will pay to go on believing it."],
    choices: [
      { id: 'play', label: 'Agree to the angle and play the victim', risk: 'med', result: "You limp for the cameras and the crowd hates {attacker.first} on cue. It is easier to be hurt on television than you expected, and slightly harder when the cameras go off.", effects: [{ pop: 0.8 }, { rivalry: { who: 'attacker', heat: 12 } }, { rel: { who: 'attacker', heat: 6 } }, { fatigue: 4 }] },
      { id: 'limit', label: 'Agree, but keep the real details out of it', risk: 'low', result: "You set a boundary on what can be said about the actual injury, and {creative.first} agrees to a vaguer version. The angle is gentler, and so is the response.", effects: [{ pop: 0.4 }, { conf: 3 }, { rel: { who: 'attacker', trust: 4 } }] },
      { id: 'refuse', label: 'Refuse; this one stays private', risk: 'low', result: "{creative.first} shrugs and takes the idea back to the whiteboard. The injury is just an injury, and you are allowed to heal without a subplot.", effects: [{ conf: 2 }, { pop: -0.2 }, { rel: { who: 'attacker', respect: 2 } }] },
      { id: 'embellish', label: 'Add real details to make the angle hit harder', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.6 }, text: "The details you add turn a decent angle into a memorable one. The crowd boos {attacker.first} as though the injury were a personal offense.", effects: [{ pop: 1.2 }, { rivalry: { who: 'attacker', heat: 18 } }, { conf: 2 }] },
        { weight: 2, text: "The details contradict the medical note, and sharp fans notice before the segment finishes. The story is picked apart for days.", effects: [{ pop: -0.6 }, { conf: -3 }, { rivalry: { who: 'attacker', heat: 6 } }] } ] },
    ],
  },
  {
    id: 'na_inj_nobodys_fault', category: 'injury', title: 'Nobody\'s Fault, Everybody\'s Guilt', weight: 2, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 10,
    cast: { partner: { pick: 'roster', tier: { gte: 1 } } }, memory: { role: 'partner', max: 2 },
    trigger: { injured: true },
    slots: { spot: ['a powerbomb that turned in mid-air', 'a springboard that missed by an inch', 'a chair shot that landed higher than planned', 'a rope-run collision that nobody rehearsed'], response: ['has not stopped apologizing since', 'keeps a respectful and miserable distance', 'sent flowers with a note that shows six crossed-out drafts', 'sits in the locker room with both hands over a face'] },
    body: ["The doctors trace the damage to {spot}, and the other wrestler in it, {partner.name}, {response}. Everyone in the business knows the unwritten rule that these things are nobody's fault and everybody's fault, and everyone feels guilty regardless.", "A grudge would be simple. Forgiveness takes work, and so does silence, and {partner.first} is waiting for you to choose which."],
    choices: [
      { id: 'public', label: 'Forgive {partner.them} openly and tell the room', risk: 'low', result: "You say it in front of the crew: no blame, no grudge. {partner.first} stares at the floor for a long moment, then nods hard enough to rattle something loose. The scene leaves you wrung out for the rest of the day.", effects: [{ rel: { who: 'partner', trust: 10, affinity: 6, respect: 4 } }, { conf: 2 }, { pop: 0.1 }, { fatigue: 6 }] },
      { id: 'private', label: 'Tell {partner.them} quietly that it was not {partner.their} fault', risk: 'low', result: "You speak where no one else can hear. {partner.first} says nothing back and shakes your good hand twice, which is more than a speech.", effects: [{ rel: { who: 'partner', trust: 6, affinity: 4 } }, { conf: 1 }] },
      { id: 'stew', label: 'Let {partner.them} stew for a week; {partner.they} should feel it', risk: 'med', result: "You give {partner.them} nothing for seven days. By the end of it, {partner.first} does not come near you, and neither of you is sure whether that is punishment or respect.", effects: [{ rel: { who: 'partner', heat: 6, trust: -4, fear: 3 } }, { conf: -1 }] },
      { id: 'ban', label: 'Call for the spot to be dropped from the card', risk: 'med', outcomes: [
        { weight: 1, text: "A quiet safety review follows, and the spot is retired. A few veterans grumble, but the younger roster feels the room get a little safer.", effects: [{ pop: 0.2 }, { conf: 3 }, { rel: { who: 'partner', trust: 4 } }] },
        { weight: 2, text: "The old guard is rankled that a rookie wants to rewrite the rules, and the word soft goes around catering twice before lunch.", effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
    ],
  },
  {
    id: 'na_inj_the_needle', category: 'injury', title: 'A Needle for the {joint}', weight: 2, major: true, cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 10,
    cast: { doctor: { pick: 'staff', role: 'doctor' } },
    trigger: { stat: { fatigue: { gte: 50 }, injuries: { gte: 1 } } },
    slots: { joint: ['knee', 'ankle', 'hip', 'hamstring'], stakes: ['a championship build', 'a sold-out televised show', 'an overseas tour', 'a feud at its hottest point'] },
    body: ["With {stakes} on the calendar, your {joint} is an inconvenience the company would prefer to see vanish. {doctor.name} holds a syringe up to the light and explains what it can do: a few weeks of relief, plus fine print about what it does later.", "The injection takes ten seconds and the fine print takes years. There is a reason the corridor outside the training room is lined with veterans who walk as though they are stepping off a boat."],
    choices: [
      { id: 'take', label: 'Take the injection and work the card', risk: 'med', outcomes: [
        { weight: 2, bonus: { toughness: 0.4 }, text: "Relief arrives within the hour and you work like a new person. The match is crisp and the crowd never knows the price.", effects: [{ pop: 0.5 }, { conf: 4 }, { fatigue: 8 }] },
        { weight: 1, text: "Feeling nothing is dangerous. You overdo a bump you should not have taken, and the joint reminds you at three in the morning.", effects: [{ pop: 0.3 }, { injury: { part: 'legs', severity: 1, days: 10 } }, { conf: -2 }, { fatigue: 10 }] } ] },
      { id: 'refuse', label: 'Refuse and tell them it will have to wait', risk: 'med', result: "{doctor.first} writes the refusal note without comment. The booking office adjusts, and you are left with a sore joint and an unbothered conscience.", effects: [{ pop: -0.4 }, { conf: 2 }, { fatigue: -8 }] },
      { id: 'opinion', label: 'Ask for a second opinion first', risk: 'low', result: "A second doctor, in a plain clinic, frowns at the scan and agrees on tape and rest instead. It costs money and time, and the joint is better for it.", effects: [{ money: -300 }, { fatigue: -3 }, { conf: 1 }] },
      { id: 'tape', label: 'Work a lighter match with heavy tape', risk: 'low', result: "You and the agent trim the match to what the joint can take. It is not your best night, but you finish upright and the crowd gets most of what it came for.", effects: [{ pop: 0.2 }, { conf: 1 }, { fatigue: 4 }] },
    ],
  },
  {
    id: 'na_inj_the_statement', category: 'injury', title: 'A Statement With Too Many Digits', weight: 2, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 10,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { injured: true, stat: { money: { lte: 25000 } } },
    slots: { bill: ['an ambulance ride you did not request', 'an MRI that took twelve minutes', 'a surgeon whose assistant sends separate invoices', 'a physical-therapy package with a name like a luxury car'], arrival: ['folded neatly into a tidy envelope', 'with a red stamp that reads second notice', 'slipped under the door with a polite note', 'delivered by a courier who wanted a signature'] },
    body: ["The statement for {bill} arrives {arrival}, and the total has more digits than your last paycheck. {agent.name} knows, because an agent always knows, and appears in the doorway a minute later with a face that has done this before.", "Pain in this business arrives twice: once in the body and once in the mailbox. The second kind lasts longer and cannot be iced."],
    choices: [
      { id: 'pay', label: 'Pay it out of savings and move on', risk: 'low', result: "You write the check with a steady hand and an unsteady stomach. The balance is lower, but the problem is closed and so is the envelope.", effects: [{ money: -3500 }, { conf: -1 }] },
      { id: 'company', label: 'Ask the company to cover it', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: "The office covers most of it, with a note about how much they value dependability. You say thank you twice and keep the second one for later.", effects: [{ money: -500 }, { conf: 2 }] },
        { weight: 1, text: "They will consider it, they say, in the way that people consider things they have already decided. The bill stays mostly yours.", effects: [{ money: -3000 }, { conf: -2 }] } ] },
      { id: 'plan', label: 'Negotiate a payment plan and keep working', risk: 'low', result: "The plan stretches the debt across a year, a small reminder every month. You take every date the doctors allow, and a few they would prefer you did not.", effects: [{ money: -800 }, { fatigue: 6 }, { conf: 1 }] },
      { id: 'night', label: 'Hold a merch night to help with the medical fund', risk: 'high', outcomes: [
        { weight: 1, bonus: { popularity: 0.5 }, text: "Fans line up out the door, and a woman in the front hands you a folded twenty and a dog-eared program. You raise more than the bill.", effects: [{ money: 2500 }, { pop: 0.8 }, { conf: 3 }] },
        { weight: 2, text: "It feels like begging, and a few columns say so. The shirts sell, but the sweetness goes out of it.", effects: [{ money: 400 }, { pop: -0.3 }, { conf: -3 }] } ] },
    ],
  },
  {
    id: 'na_inj_call_home', category: 'injury', title: 'The Call From {relative}', weight: 2, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 10,
    trigger: { injured: true },
    slots: { relative: ['your mother', 'your older sister', 'your grandfather', 'your oldest friend'], where: ['a hospital corridor', 'a hotel room that smells of detergent', 'the car park outside the arena', 'a corner of the locker room'] },
    body: ["The call comes while you are sitting in {where}. {relative} watched the footage and will not let the line go until you say something true.", "Pro wrestling is built on the idea that pain can be a performance, which is also the best excuse for never talking about the pain that is real. Hearing your own voice shake is its own kind of diagnosis."],
    choices: [
      { id: 'truth', label: 'Tell them how bad it really is', risk: 'low', result: "You say it plainly and then the rest of it, including the part about being scared. There are tears on both ends, and you hang up feeling lighter than you have in weeks.", effects: [{ conf: 3 }, { fatigue: -2 }] },
      { id: 'brave', label: 'Put on the brave voice and joke about it', risk: 'med', outcomes: [
        { weight: 1, text: "They laugh at the right places, and for ten minutes you almost believe it yourself. You hang up and the room is a bit larger than before.", effects: [{ conf: 1 }, { fatigue: 2 }] },
        { weight: 2, text: "They hear the crack under the joke and go very quiet. Call me back tomorrow, they say, in a voice that settles the matter.", effects: [{ conf: -2 }] } ] },
      { id: 'visit', label: 'Ask them to come out and stay a week', risk: 'med', result: "They arrive with a suitcase, a casserole and a stubbornness you had forgotten. It costs a little money and some dignity, and you heal faster in their company.", effects: [{ money: -300 }, { conf: 4 }, { fatigue: -5 }] },
      { id: 'cut', label: 'Cut the call short; you need to focus on getting well', risk: 'low', result: "You hang up gently and tell yourself it was for the best. The room feels colder afterwards, and the phone stays face down for the rest of the night.", effects: [{ conf: -2 }, { fatigue: -3 }] },
    ],
  },
  {
    id: 'na_inj_the_spot_you_fear', category: 'injury', title: 'Your Feet Will Not Leave the Apron', weight: 2, contexts: ['pre_show'], cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 10,
    cast: { producer: { pick: 'staff', role: 'producer' } },
    trigger: { injured: false, stat: { injuries: { gte: 2 } } },
    slots: { move: ['the top-rope splash', 'the dive to the floor', 'the back bump onto the ramp', 'the springboard'], echo: ['the sound your body made once', 'a night in a hospital corridor', 'the shape of a replay you watched too many times', 'a doctor\'s quiet voice'] },
    body: ["The next spot is {move}, one you have done a hundred times, and tonight your feet seem unwilling to leave the apron. Behind your eyes, {echo} replays like a stuck record, and your hands, usually dependable, are damp.", "{producer.name} sees your face and says nothing, with the practiced gentleness of someone who has watched careers pause at exactly this spot. The bell will ring either way."],
    choices: [
      { id: 'do', label: 'Do the move and trust your body', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.6 }, text: "You leave the ground before the fear catches up. The landing is clean, the crowd erupts, and the voice behind your eyes goes quiet for the first time in months.", effects: [{ pop: 0.8 }, { conf: 6 }, { fatigue: 6 }] },
        { weight: 1, text: "You mistime it by a hair, and the fear turns out to have been right about something. You limp to the back with a bad ankle and a bad taste.", effects: [{ injury: { part: 'legs', severity: 1, days: 10 } }, { conf: -6 }, { fatigue: 8 }] } ] },
      { id: 'drop', label: 'Ask to change the finish and drop the move', risk: 'low', result: "{producer.first} rewrites the finish on a napkin without a sigh. The match is safer and a little smaller, and nobody in the crowd will ever know what you quietly gave up.", effects: [{ pop: -0.2 }, { conf: -3 }, { fatigue: -2 }] },
      { id: 'drill', label: 'Work the move on a crash pad in the empty ring first', risk: 'med', result: "In the quiet ring you take it ten times, each one a little bolder than the last. Your legs complain, but by the end the apron is just a place to stand.", effects: [{ attr: { name: 'agility', delta: 1 } }, { conf: 4 }, { fatigue: 8 }] },
      { id: 'tell', label: 'Tell {producer.first} what you are really afraid of', risk: 'low', result: "You say it out loud and it is less shaped than you thought. {producer.first} listens, tells you about two wrestlers who stood on this apron too, and hands you a towel.", effects: [{ conf: 3 }, { attr: { name: 'psychology', delta: 1 } }] },
    ],
  },
  // ======================= RECOVERY =======================
  {
    id: 'na_rec_locked_gym', category: 'recovery', title: 'The Gym That Was Officially Closed', weight: 2, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 8,
    cast: { trainer: { pick: 'staff', role: 'trainer' } },
    trigger: { injured: true },
    slots: { exercise: ['single-leg balance on a foam pad', 'slow shoulder circles with a rubber band', 'ten-minute walks on an incline', 'gentle bridge lifts with a pause at the top'], hour: ['past nine at night', 'well after the building has emptied', 'before sunrise on a Sunday', 'on a holiday when the gym is officially shut'] },
    body: ["{trainer.name} has unlocked the training room {hour} just for you. The exercise tonight is {exercise}, which looks like nothing and feels like carrying a house.", "There is no crowd, no camera and no one to impress, only a person who chose to be here when home was available. Small kindnesses like this are rarely mentioned and almost never repaid."],
    choices: [
      { id: 'work', label: 'Work the full session and thank them properly', risk: 'low', result: "You hit every rep, ugly and slow, and when the lights go off you say thank you in a voice that cracks a little. {trainer.first} just nods and writes the next session on a card.", effects: [{ attr: { name: 'endurance', delta: 1 } }, { fatigue: 8 }, { conf: 3 }] },
      { id: 'open', label: 'Admit how frightening the slow progress feels', risk: 'low', result: "You say it between sets, to the wall and to the trainer. {trainer.first} answers with a story about someone who felt the same, and a promise that fear is a normal part of the program.", effects: [{ conf: 4 }, { fatigue: 2 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'gift', label: 'Give them something as a thank-you', risk: 'low', result: "You hand over a pair of tickets and a bag of the good coffee. The trainer pretends not to be moved and puts the coffee on the shelf beside a faded team photo.", effects: [{ money: -80 }, { conf: 2 }, { fatigue: -2 }] },
      { id: 'ease', label: 'Cut it short; you are too tired to care', risk: 'low', result: "You leave after twenty minutes, sweaty and ashamed. The trainer says tomorrow is another day, and does not make it sound like a reproach.", effects: [{ fatigue: -6 }, { conf: -3 }] },
    ],
  },
  {
    id: 'na_rec_other_side_of_gym', category: 'recovery', title: 'Healthy Bodies at the Next Rack', weight: 2, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 8,
    cast: { rookie: { pick: 'roster', tier: { lte: 1 } } }, memory: { role: 'rookie', max: 1 },
    trigger: { injured: true },
    slots: { task: ['lifting only with your good side', 'pushing a sled at half the weight you used to', 'walking laps on the track like a retiree', 'sitting out every set that scares you'], time: ['at a gray dawn', 'while rain beats on the roof', 'on a hot Tuesday afternoon', 'in the first week of a new tour'] },
    body: ["In the gym, {time}, you are {task} while {rookie.name} runs a full workout three feet away. The warm-ups are crisp and effortless, the way yours used to be.", "Envy is not an attractive feeling, but it is a loyal one, and it is sitting on the bench beside you. What you do with it is up to you, and the rookie is watching in the mirror."],
    choices: [
      { id: 'coach', label: 'Offer to spot and coach {rookie.first}', risk: 'low', result: "You stand behind the bar and call out tempo, breath and form, and {rookie.first} lifts better than ever. It is the first time in weeks that your body is useful to anyone.", effects: [{ rel: { who: 'rookie', trust: 6, affinity: 4, respect: 4 } }, { pop: 0.1 }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'race', label: 'Race {rookie.them} on the easy set to prove you still can', risk: 'high', outcomes: [
        { weight: 1, bonus: { toughness: 0.5 }, text: "You keep pace for the full set, jaw clenched, and {rookie.first} lets out a low whistle. The win is small and it is entirely yours.", effects: [{ conf: 4 }, { rel: { who: 'rookie', respect: 4 } }, { fatigue: 8 }] },
        { weight: 2, text: "Halfway through the set something pulls in your side. You rack the bar carefully, say nothing, and watch the rookie look away.", effects: [{ injury: { part: 'torso', severity: 1, days: 5 } }, { conf: -4 }, { fatigue: 8 }] } ] },
      { id: 'leave', label: 'Come back in the evening when the gym is empty', risk: 'low', result: "You pack your bag and slip out. The evening session is quiet, private and a bit lonely, and nobody is there to watch you try.", effects: [{ conf: -2 }, { fatigue: -2 }] },
      { id: 'joke', label: 'Make a joke about how slow you have become', risk: 'low', result: "The sled crawls and so does your humor, but it works. {rookie.first} laughs, drops a plate on the bar for you and calls it a rehabilitation program.", effects: [{ rel: { who: 'rookie', affinity: 5 } }, { conf: 1 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'na_rec_recognized_in_public', category: 'recovery', title: 'Recognized in the {place}', weight: 1.5, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 8,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { injured: true, stat: { popularity: { gte: 25 } } },
    slots: { place: ['pharmacy queue', 'airport security line', 'grocery store checkout', 'corner café'], remark: ['\"You were robbed in that last match.\"', '\"My dad says it is time you retired.\"', '\"Is the injury real? Be honest with me.\"', '\"My daughter has your poster over her bed.\"'] },
    body: ["In the {place}, {fan.name} notices the brace on your leg first and your face second. The remark arrives before you can plan a reply: {remark}", "Fans see only the injury report and the headline, never the hours of rehab. Recovering in public makes you a character in other people's days, whether or not you agreed to the role."],
    choices: [
      { id: 'gracious', label: 'Be gracious and take a photo', risk: 'low', result: "You smile, sign the back of a receipt and say the sort of thing that sounds easy. They walk off lighter, and you pay for it with a long minute of standing.", effects: [{ pop: 0.3 }, { conf: 2 }, { fatigue: 1 }] },
      { id: 'honest', label: 'Answer honestly about how it feels', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: "You say it straight, the pain and the fear and the boredom. The fan nods slowly, thanks you for not performing, and the people behind them in the line quiet down.", effects: [{ pop: 0.5 }, { conf: 3 }] },
        { weight: 1, text: "You say more than you meant to, and the fan, moved and awkward, answers with the sort of pity you were trying to avoid.", effects: [{ conf: -2 }] } ] },
      { id: 'kayfabe', label: 'Stay in character and deflect with a line', risk: 'med', result: "You hit them with the catchphrase and a glare, and they are thrilled. It is easier to be the character than to be tired in public.", effects: [{ pop: 0.2 }, { conf: -1 }] },
      { id: 'slip', label: 'Pull your hat down and move along', risk: 'low', result: "You pretend to be absorbed in a shelf of vitamins. The fan lets you go, and you spend the rest of the day regretting the shelf.", effects: [{ fatigue: -1 }, { conf: -2 }] },
    ],
  },
  {
    id: 'na_rec_brace_endorsement', category: 'recovery', title: 'Your Brace, Sponsored', weight: 1.5, cooldownDays: 240, maxPerCareer: 1, categoryCooldown: 10,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { minYear: 1995, injured: true, stat: { popularity: { gte: 35 } } },
    slots: { gear: ['knee brace', 'shoulder sling', 'walking boot', 'wrist guard'], deal: ['a flat fee for one photo shoot', 'a monthly stipend for wearing it on camera', 'free products and a small commission', 'a six-month ambassador deal'] },
    body: ["A sports-medicine company has noticed your {gear} on television and wants you as its public face, offering {deal}. {agent.name} brings the contract in a pocket folder with a skeptical eyebrow.", "The gear works and the money is real, and still it is odd to watch your pain turned into a brand. Fans may read it as selling out or as proof that you are on the mend, and in either case the cameras will be watching a prop."],
    choices: [
      { id: 'sign', label: 'Sign and wear it proudly', risk: 'low', result: "The shoot is two hours of standing under hot lights and pretending to feel better than you do. The check is real, and the logo follows you into every photograph afterward.", effects: [{ money: 2500 }, { pop: 0.3 }, { conf: -1 }, { fatigue: 2 }] },
      { id: 'negotiate', label: 'Negotiate for a say in how the ads read', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: "The company agrees to run your words, plain and a little funny, on the box. The ads feel like yours, and so does the paycheck.", effects: [{ money: 3500 }, { pop: 0.5 }, { conf: 3 }] },
        { weight: 1, text: "The company shrugs and takes the contract to someone with fewer opinions. The folder goes back in the bag, and so does your pride.", effects: [{ conf: -2 }] } ] },
      { id: 'decline', label: 'Decline; the injury is not a billboard', risk: 'low', result: "You say it politely, and somehow the refusal becomes a small story of its own. The company sends a kind note, and a better brace.", effects: [{ conf: 3 }, { pop: 0.2 }] },
      { id: 'doctor', label: 'Ask your doctor whether the product is any good', risk: 'low', result: "The doctor snorts, then approves it with caveats. You sign a cleaner deal with the caveats in writing, for less money and a clearer conscience.", effects: [{ money: 1500 }, { conf: 2 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 3 }] },
    ],
  },
  {
    id: 'na_rec_test_day', category: 'recovery', title: 'Test Day With {doctor.name}', weight: 2.5, major: true, cooldownDays: 90, maxPerCareer: 4, categoryCooldown: 8,
    cast: { doctor: { pick: 'staff', role: 'doctor' } },
    trigger: { injured: true, noFlag: 'na_cleared_test' },
    slots: { test: ['a hop-and-land strength test', 'a balance test on one leg with your eyes closed', 'a grip-and-pull test on a dynamometer', 'a timed stair climb in a weighted vest'], stake: ['the return date the office is already penciling in', 'an exhibition booked for next month', 'a promise you made to yourself in the hospital', 'whether a long career is still a sensible plan'] },
    body: ["Today is {test}, and it matters more than any match you have worked this season. Underneath the numbers sits {stake}.", "A strip of tape and a clipboard are all that stand between you and a verdict. Bodies keep their own books, and the books rarely match what you hoped to read."],
    choices: [
      { id: 'push', label: 'Push as hard as you can on every attempt', risk: 'high', outcomes: [
        { weight: 2, bonus: { toughness: 0.5, confidence: 0.4 }, text: "The numbers come up strong, and {doctor.first} checks the sheet twice. You are told, carefully, that you are ahead of schedule.", effects: [{ conf: 5 }, { fatigue: 8 }, { pop: 0.1 }, { flag: 'na_cleared_test' }] },
        { weight: 1, text: "The numbers spike on the sheet, and something tweaks on the last attempt. {doctor.first} looks suspicious and adds time to the schedule.", effects: [{ injury: { part: 'torso', severity: 1, days: 5 } }, { conf: -4 }, { fatigue: 8 }] } ] },
      { id: 'honest', label: 'Work steadily and report what you feel honestly', risk: 'low', outcomes: [
        { weight: 2, text: "The results are not spectacular, but they are steady, and {doctor.first} signs off with a small smile. Honest numbers feel better than flattering ones.", effects: [{ conf: 3 }, { fatigue: 4 }, { flag: 'na_cleared_test' }] },
        { weight: 1, text: "The numbers sit just under the line. Two more weeks, says {doctor.first}, gently, and you accept it better than you expected.", effects: [{ conf: -1 }, { fatigue: -2 }] } ] },
      { id: 'sandbag', label: 'Hold back a little so the doctor stays cautious', risk: 'low', result: "You take it easy on purpose, and {doctor.first} keeps you on the list for another round. The extra rest is real, and so is your irritation at having to fake being worse.", effects: [{ fatigue: -4 }, { pop: -0.1 }, { conf: -1 }] },
      { id: 'second', label: 'Bring a trainer in as a second pair of eyes', risk: 'low', result: "The trainer corrects your form twice, quietly, and the sheet at the end is a clean one. It costs a bit of money, and it earns an honest nod from {doctor.first}.", effects: [{ money: -150 }, { conf: 2 }, { flag: 'na_cleared_test' }] },
    ],
  },
  {
    id: 'na_rec_old_school_visit', category: 'recovery', title: 'An Old-School Trainer Shows Up', weight: 1.5, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 8,
    cast: { trainer: { pick: 'staff', role: 'trainer' } },
    trigger: { injured: true, stat: { careerYears: { gte: 3 } } },
    slots: { carry: ['a notebook of drills gone soft with coffee stains', 'a thermos of terrible soup', 'a rolled-up towel and a blunt pep talk', 'a faded photograph of a long-ago training class'], lesson: ['rebuilding from the feet up', 'breathing through every set', 'treating the body as something you own, not rent', 'the fundamentals you rushed past'] },
    body: ["{trainer.name}, a trainer from the old school, turns up at the rehab center unannounced, carrying {carry}. After a long inspection of the equipment and the people using it, you are told to begin again with {lesson}.", "The advice is stubborn, a bit out of date and difficult to dismiss. Underneath it, there is a kind of faith in you that has little to do with anything on your resume."],
    choices: [
      { id: 'yield', label: 'Submit to the old way and do exactly as told', risk: 'low', result: "You spend a week doing things that feel like punishment: slow reps, long holds and a lot of staring at a wall. When you stand up afterward, your body feels reorganized.", effects: [{ attr: { name: 'endurance', delta: 1 } }, { fatigue: 10 }, { conf: 3 }] },
      { id: 'argue', label: 'Argue that modern rehab knows better', risk: 'med', outcomes: [
        { weight: 1, text: "{trainer.first} listens, grunts and concedes two points, then adds three of their own. You end up with a program neither of you would have written alone.", effects: [{ attr: { name: 'psychology', delta: 1 } }, { conf: 2 }, { fatigue: 4 }] },
        { weight: 2, text: "The old trainer leaves with an expression halfway between hurt and amused. The door swings shut, and the room is a little emptier than it was.", effects: [{ conf: -2 }, { fatigue: -2 }] } ] },
      { id: 'invite', label: 'Invite them to every session for a month', risk: 'low', result: "They come to all of them, sit in the corner with the thermos and say almost nothing. The silence of someone watching you succeed is surprisingly loud, and surprisingly useful.", effects: [{ money: -200 }, { conf: 4 }, { fatigue: 6 }] },
      { id: 'dinner', label: 'Thank them and send them home with a proper dinner', risk: 'low', result: "You pay for a good meal and listen to three stories you have not heard before. It is a modest thank-you, and you suspect it is the right size.", effects: [{ money: -60 }, { conf: 2 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'na_rec_rookie_question', category: 'recovery', title: 'A Rookie Asks You {topic}', weight: 1.5, cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 8,
    cast: { rookie: { pick: 'roster', tier: { lte: 1 } } }, memory: { role: 'rookie', max: 1 },
    trigger: { injured: true },
    slots: { topic: ['About a Gimmick', 'About a Match That Dies', 'About the Microphone', 'About Being Furniture'], setting: ['in the hallway outside the rehab room', 'on the bench beside the ice machine', 'over cold fries in catering', 'on the loading dock'] },
    body: ["{rookie.name} finds you {setting} with a bag on one shoulder and a problem written all over {rookie.their} face: a gimmick that is not landing, a match that dies in the middle, a fear of the microphone, a locker room that treats {rookie.them} like furniture. {rookie.they} has not asked anything yet, and it is clear the question has been practiced in the car.", "Being injured has made you a rare creature: someone with time and enough old scars to be believed. Advice looks like generosity, but it often turns out to be an echo of yourself."],
    choices: [
      { id: 'mentor', label: 'Take {rookie.them} under your wing for a few weeks', risk: 'med', result: "You turn rehab into a classroom, with rookies and ice packs on the same bench. {rookie.first} writes everything down, and by the end of the month you are the one learning to say what you know.", effects: [{ rel: { who: 'rookie', affinity: 6, trust: 6, respect: 5 } }, { event: { type: 'mentorship', participants: ['rookie'], summary: 'Coached {rookie.name} through rehab.', data: { byPlayer: true } } }, { fatigue: 4 }, { conf: 3 }, { pop: 0.1 }] },
      { id: 'blunt', label: 'Give {rookie.them} one blunt note and wish {rookie.them} luck', risk: 'low', result: "You say the one thing you wish someone had said to you, flat and without a bow. {rookie.first} blinks, writes it on a hand, and leaves with a straighter back.", effects: [{ rel: { who: 'rookie', respect: 4, trust: 2 } }, { conf: 1 }] },
      { id: 'vent', label: 'Vent about your own recovery instead', risk: 'low', result: "For an hour you talk about physios, pain and the long gray days. {rookie.first} listens patiently, with a face that gets steadily more worried, and neither of you gets what you came for.", effects: [{ conf: 2 }, { fatigue: -2 }, { rel: { who: 'rookie', respect: -1 } }] },
      { id: 'pass', label: 'Say you are the wrong person to ask', risk: 'low', result: "You tell {rookie.them} honestly that you are not sure you have anything left to teach. {rookie.first} nods politely and goes in search of a more confident voice.", effects: [{ conf: -2 }, { rel: { who: 'rookie', affinity: -2 } }] },
    ],
  },
  {
    id: 'na_rec_the_date', category: 'recovery', title: 'A Date You Do Not Mark', weight: 1.5, cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 10,
    trigger: { injured: false, stat: { injuries: { gte: 2 }, careerYears: { gte: 3 } } },
    slots: { marker: ['a scar across your forearm', 'a date circled on the calendar', 'the arena you are driving past', 'a song on the radio that was playing in the ambulance'], mood: ['grateful', 'shaky', 'oddly angry', 'numb'] },
    body: ["There is a date on the calendar that you do not mark, the night of the injury that kept you out longest. This morning you notice it because of {marker}, and the feeling that comes with it is {mood}, which is not the one you rehearsed.", "Time does not heal on the day it promises to. The people around you are mostly unaware, and the only witness to the anniversary is the version of you who went through it."],
    choices: [
      { id: 'dinner', label: 'Mark it with dinner for someone who was there', risk: 'low', result: "You order too much food and say very little, and the person across from you says even less. It is the kind of silence you can lean on, and you leave a good deal lighter.", effects: [{ money: -70 }, { conf: 4 }, { fatigue: -2 }] },
      { id: 'ring', label: 'Go to the empty ring and stand where it happened', risk: 'med', outcomes: [
        { weight: 2, text: "You stand on the canvas for ten minutes and breathe. The ring is only a ring, and for the first time that is a relief rather than an insult.", effects: [{ conf: 5 }, { fatigue: 3 }] },
        { weight: 1, text: "The grief you were holding off comes in a single wave, and you have to sit down on the apron. It passes, but nothing else gets done that day.", effects: [{ conf: -3 }, { fatigue: 4 }] } ] },
      { id: 'ignore', label: 'Treat it like any other Tuesday', risk: 'low', result: "You train, eat and sleep as planned. The date goes by without ceremony, and it feels like winning a quiet argument with yourself.", effects: [{ conf: 1 }, { fatigue: 2 }] },
      { id: 'write', label: 'Write down what the injury taught you', risk: 'low', result: "A page and a half in terrible handwriting turns out to contain two good ideas and a lot of swearing. You tuck it in your gear bag, where it will be found by someone eventually.", effects: [{ attr: { name: 'psychology', delta: 1 } }, { conf: 2 }, { fatigue: 2 }] },
    ],
  },
  // @@END
];
