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
    slots: { ride: ['a rented van with a broken heater', 'the back of a crew bus', 'a sedan packed with four wrestlers and their bags', 'a night flight on a regional jet'], hour: ['two in the morning', 'a quarter past three', 'the dead hour before dawn', 'midnight, three hours from the hotel'] },
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
    trigger: { stat: { matches: { lte: 10 } }, recent: { lossesGte: 1 } },
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
    slots: { task: ['bolting the turnbuckles', 'laying the canvas over the foam', 'unloading the ring posts from the truck', 'tightening the ropes with a ratchet'], weather: ['in a cold drizzle', 'under a roof that drips', 'in August heat that turns the steel to a griddle', 'while a forklift beeps nonstop'] },
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
  // @@END
];
