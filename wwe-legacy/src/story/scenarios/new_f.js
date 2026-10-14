// New scenarios (set F): debut, breakout, contract, training, finance, travel, injury, recovery. Ids prefixed nf_.
export default [
  // ======================= DEBUT =======================
  {
    id: 'nf_deb_name_card', category: 'debut', title: `The Announcer's Card Has a Mistake`, weight: 2.5, contexts: ['pre_show'], cooldownDays: 200, maxPerCareer: 1, categoryCooldown: 6,
    cast: { producer: { pick: 'staff', role: 'producer' } },
    trigger: { stat: { matches: { lte: 3 } } },
    slots: { error: [`your name with a letter missing`, `a hometown you have never visited`, `a nickname nobody has ever called you`, `a weight twenty pounds off`], timing: [`ten minutes before the bell`, `while the match before yours is still going`, `as your music cue is being loaded`] },
    body: [`{producer.name} hands you a copy of the ring announcer's card {timing}, and the line under your name lists {error}. It is a small error, the kind that is printed once and repeated all night.`, `Fixing it means walking up to a stranger in a headset and telling them how to say who you are. Leaving it means a thousand people learning the wrong version first.`],
    choices: [
      { id: 'producer', label: `Ask {producer.first} to correct the card`, risk: 'low', result: `"Give me thirty seconds," {producer.first} says, crossing the line out with a marker and walking the card over in person. The announcer reads it right, and the nod you get on the way past says you did not need to be told twice.`, effects: [{ conf: 2 }, { pop: 0.1 }] },
      { id: 'announcer', label: `Find the announcer and say it out loud yourself`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.4 }, text: `You say it once, slowly, and the announcer repeats it back without a flaw. Your name goes out over the speakers clean, and you walk through the curtain feeling like someone who owns it.`, effects: [{ conf: 4 }, { pop: 0.2 }] },
        { weight: 1, text: `The announcer is mid-warmup and waves you off with one finger in the air. The card is read exactly as printed, and you hear it all the way down the ramp.`, effects: [{ conf: -3 }, { pop: -0.1 }] } ] },
      { id: 'adopt', label: `Let it stand and own whatever the crowd hears`, risk: 'high', result: `The announcer's version rings through the building and a handful of fans in the front row shout it back like a dare. By the end of the night someone has lettered it onto a sign, and you are not sure whether you have been renamed or hijacked.`, effects: [{ pop: 0.5 }, { conf: -2 }, { charisma: 1 }] },
      { id: 'skip', label: `Ask for no announcement at all`, risk: 'med', result: `The announcer is told to skip your card, and your music hits to a building waiting to be told who you are. The silence stings, but the first sound the crowd makes is a curious one, and nobody has the chance to get it wrong.`, effects: [{ pop: -0.3 }, { conf: 1 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'nf_deb_vet_notes', category: 'debut', title: `{vet.name} Has Notes for You`, weight: 2, contexts: ['post_match'], cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 6,
    cast: { vet: { pick: 'roster', tier: { gte: 3 }, sameBrand: true } },
    trigger: { stat: { matches: { lte: 6 } } },
    slots: { where: [`by the vending machines`, `in the corridor outside the showers`, `at the catering table`, `beside the equipment cases`], flaw: [`you look at the crowd between every move`, `you wait for your opponent to finish before you start`, `you smile whenever a strike lands`, `you rush the finish like a train that is late`] },
    body: [`{vet.name} catches you {where} and says, with no introduction at all, that {flaw}. {vet.first} counts two more notes off on {vet.their} fingers before you have swallowed your first reply.`, `"Do not answer yet," {vet.first} says. "Just count how many are true." Nobody asked for an opinion, and nobody in earshot is pretending not to listen, and the notes are probably right, which is the uncomfortable part.`],
    choices: [
      { id: 'thank', label: `Thank {vet.first} and write the notes down`, risk: 'low', result: `You take out a pen and write on your forearm, which gets a short, dry laugh. {vet.first} stays for a fourth note, and by the next night all four are in your work.`, effects: [{ rel: { who: 'vet', respect: 5, trust: 3 } }, { attr: { name: 'psychology', delta: 1 } }, { conf: 1 }] },
      { id: 'argue', label: `Push back on the first note`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: `You make your case in two sentences and {vet.first} actually stops to consider it. The conversation ends in a grudging half-smile and a bet on who is right.`, effects: [{ rel: { who: 'vet', respect: 5 } }, { conf: 3 }] },
        { weight: 1, text: `The pushback lands like a rookie telling a veteran how the building is laid out. {vet.first} says nothing at all and walks off, and that silence follows you for the rest of the week.`, effects: [{ rel: { who: 'vet', respect: -5, heat: 4 } }, { conf: -3 }] } ] },
      { id: 'watch', label: `Ask {vet.first} to watch tomorrow's match from the curtain`, risk: 'med', result: `{vet.first} agrees with a shrug and ends up at the curtain with arms folded. You work the entire match for one critic, which makes it tighter and a little stiff.`, effects: [{ rel: { who: 'vet', trust: 4, respect: 2 } }, { fatigue: 5 }, { conf: -1 }, { attr: { name: 'technical', delta: 1 } }] },
      { id: 'nod', label: `Nod politely and keep working your own way`, risk: 'low', result: `You say thank you, mean about half of it, and change nothing. The match the next night is the same match, and the habit you were warned about is a little more settled.`, effects: [{ conf: 2 }, { rel: { who: 'vet', respect: -2 } }] },
    ],
  },
  {
    id: 'nf_deb_first_boos', category: 'debut', title: `The Sound That Followed You Up the Ramp`, weight: 2, contexts: ['post_match'], cooldownDays: 200, maxPerCareer: 1, categoryCooldown: 6,
    trigger: { stat: { matches: { lte: 8 } } },
    slots: { sound: [`a low, steady boo from the balcony`, `one voice shouting your name wrong`, `a silence so complete you can hear the ring creak`, `a ripple of applause that dies after four claps`], backstage: [`the agent says nothing at all`, `a veteran gives you a thumbs-up without looking up`, `the trainer is already writing on a legal pad`] },
    body: [`After your first matches in front of a real crowd, {sound} follows you up the ramp. When you reach the curtain, {backstage}.`, `It is not hatred and it is not praise, only the sound of a building making up its mind about a stranger. You have exactly one walk to the back to decide what to do with it.`],
    choices: [
      { id: 'wave', label: `Turn around at the top of the ramp and take it in`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.6, confidence: 0.4 }, text: `You stop, face the crowd and let the sound wash over you. A few of them laugh at the nerve of it, and the laughter turns into something almost like respect.`, effects: [{ pop: 0.7 }, { conf: 4 }] },
        { weight: 1, text: `You turn around and the noise gets sharper, as if you had asked for it. The walk back through the curtain is the longest you have taken.`, effects: [{ pop: -0.2 }, { conf: -4 }] } ] },
      { id: 'notes', label: `Go straight to the agent and ask what went wrong`, risk: 'low', result: `The agent takes five minutes and a rolled-up program to show you where the match drifted and where the crowd stopped believing it. It is a cold, accurate lesson that you will remember at the next bell.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { conf: -1 }, { fatigue: 2 }] },
      { id: 'shower', label: `Shower, dress and leave before anyone can talk to you`, risk: 'low', result: `You are in the car park by the time the next match begins, replaying every move. The hum of the engine is the first kind sound of the night, and it does not help.`, effects: [{ conf: -3 }, { fatigue: -3 }] },
      { id: 'laugh', label: `Make a joke of it at the catering table`, risk: 'med', result: `You tell the story of the sound that chased you up the ramp, doing the voices, and the room turns around. "Say it again," one of the older hands demands, and by the end of the night it is a running gag. You are suddenly part of the furniture, which is better than being a stranger.`, effects: [{ conf: 3 }, { pop: 0.1 }, { fatigue: 1 }] },
    ],
  },
  {
    id: 'nf_deb_wrong_person', category: 'debut', title: `A Fan Who Thinks You Are Someone Else`, weight: 1.5, contexts: ['post_show', 'show_day'], cooldownDays: 240, maxPerCareer: 1, categoryCooldown: 6,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { matches: { lte: 10 } } },
    slots: { mistaken: [`a wrestler from a generation ago`, `the lead in a soap opera`, `the driver from a car-wash commercial`], where: [`at the loading dock`, `outside the arena doors`, `in the hotel lobby`] },
    body: [`{fan.name} is waiting {where} with a poster and a pen, completely convinced that you are {mistaken}. "I never forget a face," {fan.first} says, for the third time, and shows no sign of letting go of the idea.`, `You have never been recognised before, by anyone, as anyone. The error is enormous and it is kind, and the line behind {fan.them} is two other fans holding programs.`],
    choices: [
      { id: 'play', label: `Sign it with the name {fan.first} wants`, risk: 'med', result: `The signature is loopy and confident and entirely made up, and {fan.first} leaves glowing. It is the best forgery of your life, and the fans in line are filming it for reasons you cannot work out.`, effects: [{ pop: 0.3 }, { conf: 2 }, { charisma: 1 }] },
      { id: 'correct', label: `Explain who you are and sign your real name`, risk: 'low', result: `{fan.first} listens with the face of someone doing arithmetic, then asks you to spell it. The signature goes down in your own handwriting for the first time, and the fan keeps the poster flat against {fan.their} chest the whole way to the car.`, effects: [{ pop: 0.3 }, { conf: 3 }] },
      { id: 'both', label: `Sign both names and add a note: "Remember me"`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `The joke works and {fan.first} laughs for a full ten seconds before adding your name to a phone note. Two other fans copy it down, and one of them turns up at the next show with a sign.`, effects: [{ pop: 0.6 }, { conf: 3 }] },
        { weight: 1, text: `The joke lands wrong and {fan.first} looks wounded, as if you had mocked the sweetness of the whole thing. The line behind you thins out in a hurry.`, effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'photo', label: `Pose for a photo and sign nothing`, risk: 'low', result: `The photograph is taken in two seconds and {fan.first} treats it like a relic. Nothing is promised and nothing is claimed, but you walk away feeling the faint weight of a small lie that you did not tell.`, effects: [{ pop: 0.1 }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'nf_deb_other_rookie', category: 'debut', title: `{rival.first} Again`, weight: 2.5, contexts: ['weekly', 'pre_show'], cooldownDays: 200, maxPerCareer: 1, categoryCooldown: 6,
    cast: { rival: { pick: 'rivalry', minHeat: 10 } }, memory: { role: 'rival', max: 1, noResults: true },
    trigger: { stat: { matches: { lte: 25 } }, mem: [{ role: 'rival', h2h: { matchesGte: 1 } }] },
    slots: { place: [`the cheap hotel across from the arena`, `a gas-station parking lot`, `a diner two exits down the highway`], habit: [`you keep ending up on the same flights`, `the office keeps booking the two of you against each other`, `the crowd keeps chanting both your names in the same breath`] },
    body: [`{rival.name} is the one wrestler you cannot seem to shake: {habit}. You run into {rival.them} again in {place}, both of you holding bags that are too big for the room.`, `Neither of you is quite sure whether you are friends or the first draft of an enemy. The office has not decided, and for a short time the choice may be yours.`],
    choices: [
      { id: 'pact', label: `Offer a pact: whoever moves up pulls the other up too`, risk: 'med', result: `{rival.first} stares at you for a long moment, then shakes on it with a sweaty hand. "Do not make me regret this," {rival.they} says. It is a promise neither of you can really keep, and it makes the next few weeks a great deal lighter.`, effects: [{ rel: { who: 'rival', trust: 7, affinity: 5, heat: -6 } }, { rivalry: { who: 'rival', heat: -5 } }, { conf: 2 }] },
      { id: 'notes', label: `Trade honest notes on each other's matches`, risk: 'low', result: `{rival.first} tells you your finishing stretch looks rehearsed, and you say the same thing about {rival.their} entrance. It is the first useful criticism either of you has had from someone who cares about the result.`, effects: [{ rel: { who: 'rival', respect: 6, trust: 3 } }, { attr: { name: 'psychology', delta: 1 } }, { conf: 1 }] },
      { id: 'compete', label: `Keep it competitive and say so`, risk: 'med', result: `"Keep getting better," you tell {rival.first}. "It makes the beating more fun." The smile on both faces is real, and so is the edge, and the feud gets a quiet start.`, effects: [{ rivalry: { who: 'rival', heat: 8 } }, { rel: { who: 'rival', heat: 5, respect: 2 } }, { pop: 0.2 }, { conf: 2 }] },
      { id: 'separate', label: `Ask the office to stop booking you together`, risk: 'low', result: `The request is granted with a note in a file you will never see. The schedules split, the nerves settle, and the other new face drifts into the background of your own story.`, effects: [{ rel: { who: 'rival', trust: -3 } }, { rivalry: { who: 'rival', heat: -4 } }, { fatigue: -2 }, { conf: 1 }] },
    ],
  },
  {
    id: 'nf_deb_big_show_week', category: 'debut', title: `The Week Before Your First Big Show`, weight: 2.5, major: true, contexts: ['weekly', 'pre_show'], cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 8,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { stat: { pleMatches: { lte: 0 }, matches: { gte: 6 } }, eventWithin: { kind: 'ple', days: 7 } },
    slots: { nerves: [`you cannot finish a meal`, `you have rewritten your entrance in your head forty times`, `you wake at four every morning`, `every cough in the dressing room sounds like an injury`], prep: [`runs the finish with you three times in an empty ring`, `tells you a story about the worst night of their own career`, `makes you walk the ramp with a stopwatch`] },
    body: [`The biggest show you have ever been booked on is days away, and {nerves}. {agent.name} watches you for an afternoon and then {prep}.`, `The building will be larger, the lights hotter and the camera count doubled, and the match is the same eight minutes it always is. What you do with the extra pressure is up to you.`],
    choices: [
      { id: 'drill', label: `Drill the match until it is automatic`, risk: 'low', result: `By the fifth run-through you can do the finish with your eyes closed, and you nearly do. The match will be clean but guarded, and you will pay for the repetition in the knees.`, effects: [{ conf: 3 }, { fatigue: 10 }, { attr: { name: 'technical', delta: 1 } }] },
      { id: 'talk', label: `Tell {agent.first} how scared you are`, risk: 'low', result: `{agent.first} laughs, not unkindly. "Everybody on that card was where you are once," {agent.they} says. The honest answer takes the edge off the week and gives you two practical tricks for the curtain.`, effects: [{ conf: 4 }, { fatigue: -3 }] },
      { id: 'rest', label: `Cut the workload down and sleep the nerves out`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `Three nights of real sleep make the building feel smaller, and you step into the lights light-headed with relief. The match has a loose energy you could not have rehearsed.`, effects: [{ conf: 4 }, { fatigue: -10 }, { pop: 0.3 }] },
        { weight: 1, text: `You sleep well and wake up rusty, and the first bump of the match lands a half-beat early. The crowd forgives it, but your hands do not.`, effects: [{ conf: -2 }, { fatigue: -8 }] } ] },
      { id: 'steal', label: `Plan one big moment to steal the show`, risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.5, charisma: 0.3 }, text: `The new spot is built from a move you have only ever tried in an empty gym, and it hits like a thunderclap. For a night, everybody in the building knows your name.`, effects: [{ pop: 1.1 }, { conf: 5 }, { fatigue: 6 }] },
        { weight: 1, text: `The spot comes half a second late and the opponent has to improvise around it. The crowd hardly notices, and the backstage crowd notices everything.`, effects: [{ pop: 0.1 }, { conf: -4 }, { fatigue: 6 }] } ] },
    ],
  },
  {
    id: 'nf_deb_first_promo', category: 'debut', title: `Your First Time Holding the Microphone`, weight: 2, contexts: ['pre_show', 'show_day'], cooldownDays: 240, maxPerCareer: 1, categoryCooldown: 6,
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { promos: { lte: 1 }, matches: { gte: 3, lte: 30 } } },
    slots: { format: [`ninety seconds in the ring`, `a backstage interview with one camera`, `a short video package shot against a brick wall`], script: [`a full script`, `three bullet points`, `a single line they want you to say`] },
    body: [`{creative.name} has booked you for {format} and hands over {script} on a clipboard. It is the first time you have been asked to speak for the company, and the clipboard shakes slightly in the air between you.`, `You can wrestle for ten minutes without a thought about your voice. A minute and a half of talking, it turns out, is a different animal.`],
    choices: [
      { id: 'script', label: `Memorise it and deliver it word for word`, risk: 'low', outcomes: [
        { weight: 2, bonus: { mic: 0.5, confidence: 0.3 }, text: `You say every word in the order it was written, and it comes out clean and slightly robotic. {creative.first} marks it down as dependable, which is a good first adjective.`, effects: [{ pop: 0.3 }, { conf: 2 }, { mic: 1 }] },
        { weight: 1, text: `The words disappear from your head halfway through the take. The silence is four seconds long and the editors will have a lovely time with it.`, effects: [{ pop: -0.2 }, { conf: -3 }] } ] },
      { id: 'wing', label: `Ignore the page and talk from the gut`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.6, charisma: 0.5 }, text: `The words come out rough and real, and the camera operator forgets to look at the monitor. {creative.first} puts down the clipboard and writes your name on a new page.`, effects: [{ pop: 0.9 }, { conf: 4 }, { mic: 2 }] },
        { weight: 1, text: `Without the page, you ramble, and the best line gets buried under three weaker ones. The piece is usable, barely, and the clipboard comes back with a lot more writing on it.`, effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
      { id: 'rehearse', label: `Ask for an hour in an empty room first`, risk: 'low', result: `{creative.first} clears a corner of the production office and sits on a folding chair as the only audience. "Again," {creative.they} says, three times, and by the third read you find a rhythm. The finished take is better than you expected.`, effects: [{ mic: 1 }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'pass', label: `Ask to wait until you have a few more matches behind you`, risk: 'med', result: `The segment is given to someone else and your name goes quietly back into the pile. Nobody is angry, but a credit you might have taken is now on another person's resume.`, effects: [{ conf: -2 }, { pop: -0.2 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'nf_deb_mentor_curtain', category: 'debut', title: `{mentor.name} Is Waiting at the Curtain`, weight: 2, contexts: ['pre_show'], cooldownDays: 240, maxPerCareer: 1, categoryCooldown: 6,
    cast: { mentor: { pick: 'tag', tag: 'mentor' } }, memory: { role: 'mentor', max: 2 },
    trigger: { stat: { matches: { lte: 30 } } },
    slots: { gesture: [`a cup of tea gone cold`, `a roll of white tape`, `a folded index card`, `an old pair of kneepads`], moment: [`a minute before your music`, `while the lights are being dimmed`, `just as the match before yours ends`] },
    body: [`{mentor.name} is standing at the gorilla position {moment}, holding {gesture}. {mentor.they} came to see how you handle the walk, and cannot hide how much it means to be there.`, `Everything you have been taught is about to be tested in front of strangers. The curtain is a few feet away, and the person who sent you here is a few inches.`],
    choices: [
      { id: 'listen', label: `Ask {mentor.first} for one last piece of advice`, risk: 'low', result: `{mentor.first} thinks about it for a long second and offers four words: "Slow down. They will wait." You carry them through the curtain like a stone in a pocket, and never find out if it was the best advice or just the most memorable.`, effects: [{ rel: { who: 'mentor', trust: 5, affinity: 4 } }, { conf: 4 }] },
      { id: 'dedicate', label: `Dedicate the match to {mentor.first} where no one can see`, risk: 'med', result: `You touch two fingers to your chest before the curtain moves, the way you used to at the end of every session. {mentor.first} notices and looks at the floor, and the match is the most focused you have worked.`, effects: [{ rel: { who: 'mentor', affinity: 6, respect: 3 } }, { conf: 3 }, { fatigue: 3 }] },
      { id: 'alone', label: `Ask {mentor.first} to stay back so you can stand on your own`, risk: 'med', result: `{mentor.first} takes a step back with a small nod that hides more pride than hurt. You walk out feeling taller and a little more alone, as you wanted.`, effects: [{ conf: 5 }, { rel: { who: 'mentor', affinity: -2, respect: 4 } }] },
      { id: 'joke', label: `Break the tension with a joke about the old days`, risk: 'low', result: `You bring up the worst night of training, and {mentor.first} laughs so hard it echoes down the hallway. The agents tell you to keep it down, and you walk out smiling anyway.`, effects: [{ rel: { who: 'mentor', affinity: 4 } }, { conf: 2 }, { pop: 0.1 }] },
    ],
  },
  // ======================= BREAKOUT =======================
  {
    id: 'nf_brk_clip_replies', category: 'breakout', title: `A Clip of You Is Going Around`, weight: 2.5, cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 8,
    cast: { rival: { pick: 'rivalry', minHeat: 15 } }, memory: { role: 'rival', max: 1, noResults: true },
    trigger: { minYear: 2010, stat: { popularity: { gte: 15, lte: 60 } } },
    slots: { clip: [`a missed spot you turned into a joke`, `a finish where you climbed up from the floor`, `your face during a slam that went wrong`, `a staredown that ran thirty seconds too long`], reach: [`two hundred thousand views by lunch`, `every wrestling forum by breakfast`, `a morning talk show segment`] },
    body: [`A short clip of {clip} reached {reach}, and nobody in the locker room can talk about anything else. {rival.name} has already added a caption to it, and the caption is the part people are repeating.`, `It is the first time you have been the story outside the building. The attention is real, and so is the question of who gets to shape it.`],
    choices: [
      { id: 'reply', label: `Reply to {rival.first} with a joke at your own expense`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, mic: 0.3 }, text: `The self-mocking line gets more shares than the clip, and {rival.first} is left holding a caption with nowhere to go. The feud picks up a smile.`, effects: [{ pop: 0.9 }, { conf: 3 }, { rel: { who: 'rival', respect: 3 } }] },
        { weight: 1, text: `The joke reads as a flinch and gets quoted back with a laughing face. The clip is now a running bit, and you are not the one running it.`, effects: [{ pop: 0.2 }, { conf: -3 }, { rel: { who: 'rival', heat: 3 } }] } ] },
      { id: 'ignore', label: `Say nothing and let the clip die on its own`, risk: 'low', result: `The clip fades after two days, as the internet does, and you are spared another round of punchlines. The few fans who were just starting to like you slide on to the next video.`, effects: [{ pop: 0.2 }, { conf: 1 }, { fatigue: -2 }] },
      { id: 'challenge', label: `Challenge {rival.first} to settle it in the ring`, risk: 'high', result: `The clip is the best advertisement you could have asked for, and you put it to work with a single sentence that ends in a date. The office hears it, likes the ticket sales it implies, and books it.`, effects: [{ rivalry: { who: 'rival', heat: 10 } }, { obligation: { kind: 'answer_challenge', who: 'rival', inDays: 7 } }, { pop: 0.7 }, { fatigue: 3 }] },
      { id: 'thank', label: `Thank the fans who shared it and tell the real story`, risk: 'low', result: `You post a plain explanation of what really happened in the ring, with none of the usual gloss. The truth is oddly more interesting than the meme, and a handful of new fans decide to stay for the match.`, effects: [{ pop: 0.5 }, { conf: 2 }, { event: { type: 'social_post', participants: [], summary: 'Told the real story behind a viral clip.', importance: 2, data: { quality: { base: 62, charisma: 0.3 } } } }] },
    ],
  },
  {
    id: 'nf_brk_chant', category: 'breakout', title: `They Started a Chant for You`, weight: 2.5, contexts: ['post_match'], cooldownDays: 180, maxPerCareer: 2, categoryCooldown: 8,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { stat: { popularity: { gte: 25, lte: 65 }, winStreak: { gte: 2 } } },
    slots: { chant: [`a two-syllable chant built from your surname`, `a slow clap pattern`, `a snatch of a song nobody can name`, `a rhythmic stomp`], where: [`the second tier`, `the lower bowl`, `the standing section`, `the far corner by the entrance`] },
    body: [`Halfway through the match, {chant} rose from {where} and spread until it covered the whole building. {agent.name} is waiting at the curtain with a headset around one ear and an expression you cannot read.`, `Chants cannot be written, only found, and this one found you. The only question is what it is worth to the office, and to you, if you spend it now or hold it.`],
    choices: [
      { id: 'acknowledge', label: `Go back out and soak it in`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, popularity: 0.3 }, text: `You step through the curtain again and the noise doubles. It is the sort of moment people retell for years, and you are still shaking when you reach the dressing room.`, effects: [{ pop: 1.0 }, { conf: 4 }, { fatigue: 3 }] },
        { weight: 1, text: `By the time you are back through, the chant has moved on, and you are a person standing alone on a ramp. The agent coughs into the headset and nobody says a word.`, effects: [{ pop: 0.1 }, { conf: -3 }, { fatigue: 3 }] } ] },
      { id: 'hold', label: `Keep quiet and let the chant keep growing`, risk: 'low', result: `{agent.first} nods slowly. "That is the smart play," {agent.they} says. "A chant gets bigger the longer nobody uses it." A week later the same sound comes back at twice the volume.`, effects: [{ pop: 0.5 }, { conf: 2 }] },
      { id: 'build', label: `Ask {agent.first} to build a segment around it`, risk: 'med', result: `{agent.first} writes the idea on a card and hands it to the producer, who takes it in the way a person takes a hot cup. A week later the segment exists, polished, scripted and somehow a little less than the real thing.`, effects: [{ pop: 0.7 }, { conf: 1 }, { fatigue: 4 }] },
      { id: 'cash', label: `Rush a run of shirts to the merch table overnight`, risk: 'med', result: `By the next show a box of cheap shirts is stacked at the merch table with the night's noise turned into a slogan across the front. They sell well, and a few fans mutter that you moved too fast to profit.`, effects: [{ money: 2200 }, { pop: 0.2 }, { conf: 1 }] },
    ],
  },
  {
    id: 'nf_brk_sold_out_shirt', category: 'breakout', title: `Your {item} Sold Out`, weight: 1.5, contexts: ['show_day', 'post_show'], cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 8,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 20, lte: 65 }, matches: { gte: 15 } } },
    slots: { item: [`shirt`, `hoodie`, `foam hand`, `poster`], where: [`at the merch table by the east doors`, `in the concourse`, `outside the arena before the show`] },
    body: [`The vendor tells you the {item} sold out in forty minutes, which has never happened with your name on a product. {fan.name} is {where}, holding the very last one against {fan.their} chest like a winning lottery ticket.`, `Someone should probably tell the office. First, you have to decide what to do about the single remaining item and the person gripping it.`],
    choices: [
      { id: 'sign', label: `Sign it for {fan.first} on the spot`, risk: 'low', result: `The marker squeaks across the front and {fan.first} holds it up to the light like a prize at a fair. A few people in the queue start taking photos, and the sellers look on with great interest.`, effects: [{ pop: 0.4 }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'buy', label: `Offer {fan.first} a bigger gift from your own bag`, risk: 'med', result: `You dig a worn ring jacket out of your bag and hand it over, and {fan.first} stares at you as though it were a trick. It costs you a favourite garment and gives you a fan who will talk about this for the rest of the year.`, effects: [{ money: -250 }, { pop: 0.6 }, { conf: 2 }] },
      { id: 'reprint', label: `Ask the vendor to rush a second run`, risk: 'med', result: `The vendor makes a call, a second run is ordered and a box arrives within a few days. The rush costs extra on the order, and the extra volume pays you back, though not by as much as you hoped.`, effects: [{ money: 1400 }, { fatigue: 3 }, { pop: 0.2 }] },
      { id: 'leave', label: `Say thank you and let the moment belong to {fan.first}`, risk: 'low', result: `You wave from a distance and let the fan keep the quiet triumph. The smile that follows you down the corridor is worth more than another photo.`, effects: [{ conf: 2 }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'nf_brk_veteran_word', category: 'breakout', title: `A Quiet Word from {vet.first}`, weight: 2.5, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 8,
    cast: { vet: { pick: 'tag', tag: 'respected_by' } }, memory: { role: 'vet', max: 1 },
    trigger: { stat: { popularity: { gte: 25 } } },
    slots: { place: [`the corner of the training room`, `a stairwell that smells of old rubber`, `the parking lot behind the arena`, `a bench outside the production office`], warning: [`the office is about to decide what you are`, `people who rise this fast get tested`, `the locker room is counting how many nights you can do it`, `the first few months of attention are the easiest to waste`] },
    body: [`{vet.name} finds you in {place} and says it without any preamble: {warning}. The words come out so plainly because {vet.first} respects you.`, `"I will only say it once," {vet.first} adds, and leaves it there. Nobody gives that talk to a wrestler who is not rising, and it carries the weight of someone who has watched others ride the same wave and fall off it.`],
    choices: [
      { id: 'ask', label: `Ask {vet.first} how to handle it`, risk: 'low', result: `{vet.first} thinks for a while and gives three rules, the last of which is "Never say yes to the first offer." You write them on the inside cover of a notebook and keep them there.`, effects: [{ rel: { who: 'vet', trust: 6, affinity: 3 } }, { attr: { name: 'psychology', delta: 1 } }, { conf: 1 }] },
      { id: 'prove', label: `Tell {vet.first} you are not worried`, risk: 'med', result: `{vet.first} smiles with the patience of someone who has heard that sentence from others, and lets it go. You leave with more swagger than you came with and perhaps less sense.`, effects: [{ conf: 4 }, { rel: { who: 'vet', respect: -2 } }, { pop: 0.2 }] },
      { id: 'return', label: `Ask {vet.first} to step in the ring and show you`, risk: 'med', result: `{vet.first} agrees to take a few moves in an empty ring after the show, and the lesson ends up more about timing than strength. You come out sweating and sore, and a better wrestler than you went in.`, effects: [{ rel: { who: 'vet', respect: 4, trust: 3 } }, { attr: { name: 'technical', delta: 1 } }, { fatigue: 7 }] },
      { id: 'thanks', label: `Thank {vet.first} and go home to think`, risk: 'low', result: `You sleep badly that night and wake with the warning in your head. It leads to a good decision a week later, and a quiet respect for the person who gave it.`, effects: [{ conf: -1 }, { rel: { who: 'vet', respect: 3 } }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'nf_brk_champ_asks', category: 'breakout', title: `{champ.first} Asked for You by Name`, weight: 2, major: true, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 8,
    cast: { champ: { pick: 'champion', class: 'world' } }, memory: { role: 'champ', max: 1, noResults: true },
    trigger: { holdsTitle: false, stat: { popularity: { gte: 35, lte: 80 }, mainEvents: { lte: 2 } } },
    slots: { ask: [`open the show with a ten-minute match`, `work a short, hard-hitting match on the main card`, `take a clean loss to make the title look strong`, `go twelve minutes in a match built around the title`], reason: [`liked the way you work`, `wanted a fresh opponent for the camera`, `wanted to see how you handle a bigger room`] },
    body: [`The office tells you before the show that {champ.name}, the champion, wants you to {ask}. The reason given is that {champ.they} {reason}, though nobody in the production office can say whether that is the whole story.`, `It is a big chance, and it comes with the usual conditions: someone else's story, someone else's finish and the whole building watching how you carry it.`],
    choices: [
      { id: 'accept', label: `Accept and do it exactly as asked`, risk: 'low', result: `You hit every beat, take every bump, and the match is exactly what the champion needed. The respect of the dressing room is quiet and measurable, and the office writes your name on a longer list.`, effects: [{ rel: { who: 'champ', respect: 5, trust: 3 } }, { pop: 0.6 }, { conf: 2 }, { fatigue: 6 }] },
      { id: 'negotiate', label: `Ask for a say in how the finish plays out`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5, overall: 0.4 }, text: `{champ.first} listens with an eyebrow raised. "Fine," {champ.they} says. "But the finish is mine." It leaves you looking strong in defeat, and the match gets talked about for the right reasons.`, effects: [{ pop: 0.9 }, { conf: 4 }, { rel: { who: 'champ', respect: 4 } }, { fatigue: 6 }] },
        { weight: 1, text: `The request lands as pushiness, and {champ.first} says to leave the finishes to the people who have earned the right to decide them. The match goes ahead and the temperature around you does not.`, effects: [{ pop: 0.2 }, { conf: -3 }, { rel: { who: 'champ', respect: -4, heat: 4 } }, { fatigue: 6 }] } ] },
      { id: 'decline', label: `Turn it down politely and ask for a later date`, risk: 'med', result: `The office is surprised, the champion is surprised more, and the match goes to someone else. You buy time to prepare, and you wonder how long the offer would have stayed open.`, effects: [{ conf: 1 }, { pop: -0.4 }, { rel: { who: 'champ', respect: -2 } }] },
      { id: 'steal', label: `Accept and try to steal the segment`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, mic: 0.4 }, text: `A single moment, timed to precisely the right second, flips the room. The champion's face tells you that it was either genius or a mistake, and the crowd decides it was genius.`, effects: [{ pop: 1.3 }, { conf: 5 }, { rel: { who: 'champ', heat: 8, respect: 3 } }, { rivalry: { who: 'champ', heat: 8 } }] },
        { weight: 1, text: `You reach for the moment and miss, and the champion has to cover for it in front of the whole arena. Backstage, the cold shoulder is worse than any shouting.`, effects: [{ pop: -0.3 }, { conf: -5 }, { rel: { who: 'champ', respect: -6, heat: 6 } }] } ] },
    ],
  },
  {
    id: 'nf_brk_split_crowd', category: 'breakout', title: `Half the Building Chants for {rival.first}`, weight: 2.5, contexts: ['post_match'], cooldownDays: 160, maxPerCareer: 2, categoryCooldown: 8,
    cast: { rival: { pick: 'rivalry', minHeat: 25 } }, memory: { role: 'rival', max: 2 },
    trigger: { stat: { popularity: { gte: 30 } }, mem: [{ role: 'rival', last: { within: 1 } }] },
    slots: { side: [`the left side of the building`, `the upper deck`, `the section near the hard camera`, `the front three rows`], chant: [`a long, taunting hum`, `a competing round of applause`, `a call-and-response that answered your every move`] },
    body: [`Midway through tonight's match, {side} gave {rival.name} {chant}. The other half of the building roared back at you, and for twenty minutes the arena looked like a courtroom with a jury split down the middle.`, `Nobody scripted it, and everybody noticed. This is how rivalries become something larger than the two people inside them.`],
    choices: [
      { id: 'lean', label: `Lean into the split and play to both sides`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `You work the crowd like a conductor, pointing toward one side, then the other, and the noise grows with every gesture. The rivalry ends up with a pulse, and you with the larger share of it.`, effects: [{ pop: 0.9 }, { conf: 3 }, { rivalry: { who: 'rival', heat: 6 } }] },
        { weight: 1, text: `The gestures read as showing off, and the section that was neutral turns toward {rival.first}. You finish the match and lose a piece of the room.`, effects: [{ pop: -0.3 }, { conf: -2 }, { rivalry: { who: 'rival', heat: 4 } }] } ] },
      { id: 'ignore', label: `Ignore the noise and just wrestle`, risk: 'low', result: `The match plays as a straightforward contest, and the split fades by the finish. The crowd ends up respecting the focus more than it admits.`, effects: [{ pop: 0.2 }, { conf: 2 }, { rel: { who: 'rival', respect: 2 } }] },
      { id: 'handshake', label: `Offer {rival.first} a handshake after the bell`, risk: 'med', result: `The handshake surprises everyone, including {rival.first}, who takes it with a nod and nothing more. The crowd groans for a moment and then applauds, and the rivalry takes a more adult shape.`, effects: [{ rel: { who: 'rival', respect: 6, heat: -6 } }, { rivalry: { who: 'rival', heat: -6 } }, { pop: 0.4 }, { conf: 1 }] },
      { id: 'taunt', label: `Taunt {rival.first}'s section directly`, risk: 'high', result: `You point and shout, and the side you pointed at howls back at you with a roar you can feel in your ribs. It is not wise, and it is hugely effective, and {rival.first} laughs out loud.`, effects: [{ pop: 0.7 }, { rivalry: { who: 'rival', heat: 10 } }, { rel: { who: 'rival', heat: 6 } }, { conf: 2 }] },
    ],
  },
  {
    id: 'nf_brk_poster', category: 'breakout', title: `Your Face Goes on the Poster`, weight: 2, cooldownDays: 250, maxPerCareer: 2, categoryCooldown: 8,
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { popularity: { gte: 30, lte: 80 }, matches: { gte: 25 } } },
    slots: { placement: [`beside the champion`, `above the fold of the tour poster`, `half-hidden behind a burst of pyro`, `in the lower corner, bigger than a thumbnail`], photo: [`a still from your second month`, `a frame taken mid-shout`, `a studio shot you hate`, `a photograph from a parking lot`] },
    body: [`{creative.name} slides the mock-up across the table: your face, {placement}, built on {photo}. "The printer needs a yes by four," {creative.first} says.`, `A poster outlasts a match, a feud and sometimes a career. Whatever goes on the wall is the image people will pass on their way to the arena for months.`],
    choices: [
      { id: 'approve', label: `Approve it as it is`, risk: 'low', result: `The proof goes out with your initials and the posters appear in a hundred shop windows the next week. You pass your own face on a lamppost and decide it looks acceptable.`, effects: [{ pop: 0.5 }, { conf: 2 }] },
      { id: 'reshoot', label: `Pay for a new photo shoot`, risk: 'med', requires: { stat: { money: { gte: 1200 } } }, result: `The photographer spends three hours, two outfits and one dramatic wind machine on you. The result is far better and arrives two weeks later than the printer wanted.`, effects: [{ money: -1200 }, { pop: 0.8 }, { conf: 3 }, { fatigue: 3 }] },
      { id: 'credit', label: `Ask for your catchphrase under the picture`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.4, charisma: 0.3 }, text: `{creative.first} writes the phrase on a sticky note, tries it aloud, and likes how it sounds. It ends up in capitals across the poster and becomes a thing fans quote.`, effects: [{ pop: 0.8 }, { conf: 3 }] },
        { weight: 1, text: `The phrase does not fit on the print and gets trimmed to three words that mean nothing. Fans squint at the poster, and you reconsider every sentence you have said since.`, effects: [{ pop: 0.1 }, { conf: -2 }] } ] },
      { id: 'share', label: `Ask for a shot of you with another wrestler`, risk: 'low', result: `The final poster features two faces, and the other wrestler is delighted to be on it. The picture gets a bigger buzz than either of you would have managed alone, and you lose some of the spotlight but gain a friend in the locker room.`, effects: [{ pop: 0.3 }, { conf: 1 }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'nf_brk_mentor_profile', category: 'breakout', title: `A Profile That Names {mentor.first}`, weight: 2.5, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 8,
    cast: { mentor: { pick: 'tag', tag: 'mentor' }, journalist: { pick: 'media', kind: 'journalist' } }, memory: { role: 'mentor', max: 2 },
    trigger: { stat: { popularity: { gte: 25 } } },
    slots: { angle: [`the long road to your first big night`, `the people who shaped your style`, `the quiet years before anyone noticed`], deadline: [`by Thursday`, `before the next show`, `in time for the weekend edition`] },
    body: [`{journalist.name} is writing a profile of your rise, focused on {angle}, and the draft names {mentor.name} three times. The piece closes {deadline}, and a question has come up about how much of the credit to put where.`, `"So who gets the credit?" {journalist.first} asks, pen hovering. A profile is a permanent record of who you say helped you, and at least one of the people in it will check whether they were mentioned.`],
    choices: [
      { id: 'credit', label: `Give {mentor.first} most of the credit`, risk: 'low', result: `The quote is generous and exact, with a story about a particular night in an empty gym. {mentor.first} reads it twice and says nothing, then sends a short note that you keep in a drawer.`, effects: [{ rel: { who: 'mentor', trust: 6, affinity: 7 } }, { pop: 0.3 }, { conf: 1 }, { event: { type: 'interview', participants: ['journalist', 'mentor'], summary: 'Gave a mentor the credit in a career profile.', importance: 2, data: { quality: { base: 66, charisma: 0.3 } } } }] },
      { id: 'solo', label: `Frame the rise as mostly your own work`, risk: 'med', result: `The piece reads cleanly and confidently, with your name in the headline and little else around it. It sells well, and {mentor.first} reads the line about self-made talent with a long, quiet look.`, effects: [{ pop: 0.7 }, { conf: 3 }, { rel: { who: 'mentor', trust: -4, affinity: -3 } }] },
      { id: 'review', label: `Ask {journalist.first} to show the draft first`, risk: 'low', result: `{journalist.first} agrees reluctantly, and you spend an hour with a pencil trimming exaggerations and adding a name the writer left out. The piece is truer and a little duller, and everyone mentioned feels they were treated fairly.`, effects: [{ rel: { who: 'mentor', trust: 3 } }, { conf: 1 }, { fatigue: 2 }, { pop: 0.1 }] },
      { id: 'decline', label: `Decline the interview entirely`, risk: 'med', result: `The profile runs with quotes from other people and no word from you, which gives it a mysterious tone. The sales are fine, and the silence becomes part of the story.`, effects: [{ pop: 0.2 }, { conf: -1 }, { rel: { who: 'mentor', respect: 2 } }] },
    ],
  },
  {
    id: 'nf_brk_ally_shadow', category: 'breakout', title: `{ally.first} Reads Your Reviews Over Your Shoulder`, weight: 2, cooldownDays: 220, maxPerCareer: 2, categoryCooldown: 8,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 2 },
    trigger: { stat: { popularity: { gte: 40 } } },
    slots: { place: [`a rental car in a parking structure`, `a hotel breakfast room`, `the back row of a team bus`, `a bench in a quiet corridor`], tone: [`a smile that is working hard`, `jokes that are slightly too loud`, `a hollow note underneath`] },
    body: [`In {place} the two of you are going through the week's write-ups, and your name keeps coming up first. {ally.name} laughs at every mention, and the laughter comes with {tone}. "Look at you," {ally.they} says, to the page more than to you.`, `You have been through a lot together, and this is the first time the weather between you has been about success. Neither of you says it, and both of you know exactly what is going on.`],
    choices: [
      { id: 'share', label: `Point out what {ally.first} did to make it happen`, risk: 'low', result: `You list the specific things {ally.first} did to get you here, and watch the shoulders loosen. It is not a complete cure, but it is an honest start.`, effects: [{ rel: { who: 'ally', trust: 6, affinity: 6 } }, { conf: 1 }] },
      { id: 'pitch', label: `Pitch a story that puts the two of you together`, risk: 'med', result: `The idea gets a meeting with the producers, who like it more than they let on. You both get more airtime, and the question of who is carrying whom gets harder to answer.`, effects: [{ pop: 0.5 }, { rel: { who: 'ally', trust: 3, affinity: 3 } }, { fatigue: 4 }] },
      { id: 'ask', label: `Ask {ally.first} outright if this is a problem`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `{ally.first} breathes out, shakes {ally.their} head, and admits it hurts but is not poison. The conversation is the most honest one you have had in months.`, effects: [{ rel: { who: 'ally', trust: 7, respect: 3 } }, { conf: 2 }] },
        { weight: 1, text: `{ally.first} denies it with too much heat, and the denial becomes the problem. The rest of the week runs on polite sentences and separate tables.`, effects: [{ rel: { who: 'ally', trust: -4, affinity: -4 } }, { conf: -2 }] } ] },
      { id: 'move', label: `Let it go and keep climbing`, risk: 'low', result: `You change the subject, leave the reviews in the bin and give it time to resolve. The silence does heal, slowly, but you do not get back the easy laugh of the early days.`, effects: [{ pop: 0.3 }, { conf: 2 }, { rel: { who: 'ally', affinity: -3 } }] },
    ],
  },
  // ======================= CONTRACT =======================
  {
    id: 'nf_con_merch_split', category: 'contract', title: `The Merchandise Split`, weight: 2, cooldownDays: 300, maxPerCareer: 1, categoryCooldown: 10,
    cast: { exec: { pick: 'staff', role: 'executive' } },
    trigger: { contract: { lte: 150 }, stat: { popularity: { gte: 30 } } },
    slots: { split: [`sixty-forty in the company's favour`, `seventy-thirty in the company's favour`, `a flat fee for every unit sold`], meeting: [`a conference room with a plate of untouched pastries`, `a glass office with a view of a loading dock`, `a quick call from a parked car`] },
    body: [`In {meeting}, {exec.name} lays out the merchandise terms for your next deal: {split}. "It is standard," {exec.they} says, in the tone used for describing the weather, as though nobody could possibly object.`, `Your shirts and posters are now a real line of business, and the rate on that line is the difference between a good year and an easy one. The page is on the table with a signing bonus clipped to it, and so is a pen.`],
    choices: [
      { id: 'sign', label: `Sign it and take the up-front money`, risk: 'low', result: `A cheque for the signing bonus arrives before the pen is back in your pocket. It is the safe, quick choice, and you spend the next year watching the shirts sell better than the deal assumed.`, effects: [{ money: 3200 }, { conf: 1 }, { pop: -0.1 }] },
      { id: 'counter', label: `Counter with a higher share and a shorter term`, risk: 'med', outcomes: [
        { weight: 2, bonus: { popularity: 0.5, charisma: 0.3 }, text: `{exec.first} checks the sales sheet, checks you, and writes down a number that is not the first one. You walk out with a bigger share on a shorter term, and a sense that the figure was worth fighting for.`, effects: [{ money: 4800 }, { conf: 4 }, { pop: 0.2 }] },
        { weight: 1, text: `The counter is read as a bargaining ploy, and the offer is quietly withdrawn pending review. The review takes a month, and the figure you eventually sign is worse than the original.`, effects: [{ money: 1200 }, { conf: -3 }, { fatigue: 3 }] } ] },
      { id: 'merch_team', label: `Ask for a say in what gets printed`, risk: 'med', result: `The company agrees to let you approve designs, which adds a few meetings and a long afternoon of looking at fabric swatches. Your gear gets better and the money stays about the same.`, effects: [{ money: 1500 }, { pop: 0.5 }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'lawyer', label: `Have a lawyer check the fine print`, risk: 'low', requires: { stat: { money: { gte: 900 } } }, result: `The lawyer circles a clause about "reasonable deductions" and calls it a hole big enough to drive a truck through. The corrected paperwork is clean, and the invoice is not small.`, effects: [{ money: -700 }, { conf: 3 }, { attr: { name: 'psychology', delta: 1 } }] },
    ],
  },
  {
    id: 'nf_con_exec_dinner', category: 'contract', title: `Dinner with {exec.first}`, weight: 2, contexts: ['weekly', 'show_day'], cooldownDays: 300, maxPerCareer: 1, categoryCooldown: 10,
    cast: { exec: { pick: 'staff', role: 'executive' } },
    trigger: { contract: { lte: 90 }, stat: { popularity: { gte: 40 } } },
    slots: { place: [`a steakhouse with leather booths`, `a hotel dining room with a pianist`, `a private room above a sports bar`], topic: [`how the company sees you in two years`, `a long-term plan that you have never heard before`, `all the things that are going well, and one that is not`] },
    body: [`{exec.name} has booked a table at {place}, and the conversation circles around {topic}. Nothing on the menu is under forty dollars, and nothing in the conversation is said without a reason.`, `This is how the real talks start, long before paper is produced. Every answer you give over dinner will be repeated, usually accurately, in a meeting you are not invited to.`],
    choices: [
      { id: 'candid', label: `Say what you actually want, in plain terms`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5, charisma: 0.3 }, text: `The candour surprises {exec.first}, who has been pitched by people who say less. "Nobody tells me that," {exec.they} says, and the dessert arrives with a promise to bring your numbers to the next meeting.`, effects: [{ money: 1800 }, { conf: 4 }, { pop: 0.3 }] },
        { weight: 1, text: `Plain terms sound like demands over a tablecloth, and the temperature falls by a degree between the main course and coffee. You pay half the bill on principle.`, effects: [{ money: -150 }, { conf: -2 }, { pop: -0.2 }] } ] },
      { id: 'listen', label: `Listen, nod and give nothing away`, risk: 'low', result: `You let {exec.first} do the talking, and the dinner passes in an atmosphere of pleasant fog. You learn two useful things about the company's plans and reveal none of your own.`, effects: [{ conf: 1 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 2 }] },
      { id: 'bring', label: `Insist the road agent joins the conversation`, risk: 'low', result: `The agent turns up with a tie in a pocket and a faintly alarmed face. The dinner becomes a more formal affair, and everyone says less, though what is said is easier to hold on to.`, effects: [{ conf: 2 }, { fatigue: 2 }, { money: -100 }] },
      { id: 'leave', label: `Cut the dinner short with an early-morning excuse`, risk: 'med', result: `You stand at the first sign of dessert and say the road calls. The exit leaves a sour note, but you are asleep by ten and sharp the next day.`, effects: [{ fatigue: -6 }, { conf: 1 }, { pop: -0.3 }] },
    ],
  },
  {
    id: 'nf_con_rival_resigned', category: 'contract', title: `{rival.first} Re-signed Early`, weight: 2.5, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 10,
    cast: { rival: { pick: 'rivalry', minHeat: 20 }, gm: { pick: 'staff', role: 'gm' } }, memory: { role: 'rival', max: 2 },
    trigger: { contract: { lte: 120 } },
    slots: { news: [`was announced in a short press release`, `leaked from a production meeting`, `was confirmed in a loud phone call in the corridor`, `came out in a conversation near the coffee machine`], hint: [`says there is a version of the same offer waiting for you`, `suggests that you should not wait too long`, `reminds you that the table has finite chairs`] },
    body: [`News that {rival.name} has signed a new long-term deal {news}. {gm.name} calls you in the same afternoon and {hint}.`, `Being tied to a rival's contract is a strange feeling, as though the two of you have been bound together by the people who write the cheques. You can follow the move, wait or stand apart.`],
    choices: [
      { id: 'match', label: `Ask for terms at least as good as {rival.first}'s`, risk: 'med', outcomes: [
        { weight: 2, bonus: { popularity: 0.5, confidence: 0.3 }, text: `{gm.first} nods at the number, grimaces at it, and agrees to bring a version of it to the office. The deal that comes back is nearly equal and arrives with a note that says you were hard work.`, effects: [{ money: 3400 }, { conf: 4 }, { rivalry: { who: 'rival', heat: 4 } }] },
        { weight: 1, text: `The comparison goes down badly, and {gm.first} says contracts are not a scoreboard. A smaller, tidier offer is tabled, and your pride costs you the difference.`, effects: [{ money: 900 }, { conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'wait', label: `Hold off and see what the market says`, risk: 'high', result: `You delay and field a few quiet calls, which makes the office nervous and you slightly richer in options. The pressure sits on your shoulders for weeks, and {rival.first} seems to be enjoying watching it.`, effects: [{ conf: 2 }, { fatigue: 4 }, { rel: { who: 'rival', respect: 2, heat: 3 } }, { money: 600 }] },
      { id: 'congrats', label: `Send {rival.first} a short note of congratulations`, risk: 'low', result: `The note is brief, correct and as warm as the ice in a cold drink. {rival.first} replies with a single line, and the pair of you part with a nod that costs nothing and might be worth something.`, effects: [{ rel: { who: 'rival', respect: 4, heat: -3 } }, { conf: 1 }] },
      { id: 'sign_fast', label: `Sign the standard terms before anything changes`, risk: 'low', result: `The paper is signed the same afternoon, and you leave the building with a stable future and a feeling you were hurried. A few weeks later you see how much {rival.first} got, and the feeling has a number.`, effects: [{ money: 2000 }, { conf: -2 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'nf_con_ally_term_sheet', category: 'contract', title: `{ally.first} Shows You a Term Sheet`, weight: 2, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 10,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 2 },
    trigger: { contract: { lte: 120 } },
    slots: { place: [`a locked equipment room`, `the front seats of a rental car`, `a hotel balcony`, `a diner booth at one in the morning`], clause: [`a bonus that pays out only if you stay together`, `a signing figure that is nearly double yours`, `a brand-change clause that nobody has seen before`] },
    body: [`In {place}, {ally.name} passes you a folded sheet and says it contains {clause}. "Tell me I am not crazy," {ally.they} says, with a look that is part pride, part appeal, and part plain worry.`, `Contracts are supposed to be private, and this one is being shown to you because there is nobody else to ask. Whatever you say next will shape how each of you walks into the next meeting.`],
    choices: [
      { id: 'advise', label: `Give your honest read of the paper`, risk: 'low', result: `You go through each paragraph with a pencil, pointing out the dull print and the exit that was missed. {ally.first} takes notes, exhales, and says it is the first useful review anyone has given.`, effects: [{ rel: { who: 'ally', trust: 7, respect: 4 } }, { attr: { name: 'psychology', delta: 1 } }, { conf: 1 }] },
      { id: 'together', label: `Suggest negotiating together`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, popularity: 0.4 }, text: `Two people at a table with the same message are surprisingly hard to ignore. The office offers better terms to both, if only to end the meeting.`, effects: [{ money: 2400 }, { rel: { who: 'ally', trust: 6, affinity: 5 } }, { conf: 3 }] },
        { weight: 1, text: `The office hears a union and replies with chilly forms for each of you separately. The pair of you leave feeling you have been sorted into different queues.`, effects: [{ rel: { who: 'ally', trust: 2 } }, { conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'envy', label: `Congratulate {ally.first} and keep your own counsel`, risk: 'low', result: `You say the right words with a steady face, then spend the evening doing arithmetic on your own pay. The friendship holds, and the arithmetic does not go away.`, effects: [{ rel: { who: 'ally', affinity: 2 } }, { conf: -2 }, { fatigue: 2 }] },
      { id: 'leak', label: `Use the numbers to bargain for your own deal`, risk: 'high', result: `You walk into the next meeting knowing precisely what to ask for, and the figure you get is a clear improvement. When {ally.first} finds out how you knew, the silence in the corridor is cold and long.`, effects: [{ money: 3600 }, { rel: { who: 'ally', trust: -12, affinity: -8 } }, { conf: 2 }] },
    ],
  },
  {
    id: 'nf_con_mentor_advice', category: 'contract', title: `A Call to {mentor.first} Before You Sign`, weight: 2, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 10,
    cast: { mentor: { pick: 'tag', tag: 'mentor' } }, memory: { role: 'mentor', max: 2 },
    trigger: { contract: { lte: 120 } },
    slots: { medium: [`a late call from a hotel lobby`, `a long phone call on the drive to the next town`, `a call made from a stairwell between shows`, `a call that keeps dropping out`], worry: [`being locked in for too long`, `being paid too little to stay`, `signing something you do not understand`, `leaving someone behind`] },
    body: [`The contract is on the kitchen table, and the thing that keeps you awake is {worry}. You ask {mentor.name} about it over {medium}, and the first reply is a long, unhurried silence.`, `Advice from this person always comes with a view of how the business has changed and how it has not. It will not be easy to hear, and it will probably be correct.`],
    choices: [
      { id: 'follow', label: `Do exactly what {mentor.first} suggests`, risk: 'low', result: `"Boring is how you last," {mentor.first} says, and the advice is boring, cautious and apparently correct in every detail. You sign the deal that {mentor.first} would have signed, and the relief is mixed with a faint sense you outsourced the decision.`, effects: [{ rel: { who: 'mentor', trust: 5, affinity: 4 } }, { money: 1500 }, { conf: 1 }] },
      { id: 'weigh', label: `Take it as one opinion among several`, risk: 'med', result: `You collect three views in total and feel the decision settle into place. {mentor.first} hears about the process second-hand and approves of the care, if not the delay.`, effects: [{ conf: 3 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 3 }, { rel: { who: 'mentor', respect: 2 } }] },
      { id: 'defy', label: `Thank {mentor.first} and do the opposite`, risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.5, popularity: 0.3 }, text: `Your gamble works out better than the advice would have, and you feel the thrill of having been right. {mentor.first} laughs when you tell {mentor.them}, and says that is how the business moves on.`, effects: [{ money: 3000 }, { conf: 5 }, { rel: { who: 'mentor', respect: 4 } }] },
        { weight: 1, text: `The choice turns out to be precisely the trap that was described, and the next month is spent clearing it up. You do not call {mentor.first}, and {mentor.first} does not call you.`, effects: [{ money: -1500 }, { conf: -5 }, { rel: { who: 'mentor', affinity: -3 } }] } ] },
      { id: 'visit', label: `Fly out to talk to {mentor.first} in person`, risk: 'med', result: `The trip costs a ticket and two days, and the conversation happens at a kitchen table with an old photograph on the wall. You leave certain, tired and a little lighter.`, effects: [{ money: -500 }, { fatigue: 5 }, { conf: 4 }, { rel: { who: 'mentor', affinity: 6, trust: 4 } }] },
    ],
  },
  {
    id: 'nf_con_betrayal_bonus', category: 'contract', title: `A Bonus Tied to {former.first}`, weight: 2.5, major: true, cooldownDays: 300, maxPerCareer: 1, categoryCooldown: 12,
    cast: { former: { pick: 'tag', tag: 'betrayal' }, gm: { pick: 'staff', role: 'gm' } }, memory: { role: 'former', max: 3 },
    trigger: { contract: { lte: 150 } },
    slots: { terms: [`a payment for every televised match the two of you work together`, `a full bonus if you finish a year without a single complaint about each other`, `a double fee for a joint appearance`], manner: [`from behind a stack of folders`, `with the tone of a person suggesting an extra helping of dessert`, `as if it were a favour`] },
    body: [`{gm.name} proposes a deal {manner}: {terms}, and the other party named in the paper is {former.name}. Whatever lies between the two of you, the office has apparently decided it is a marketable asset.`, `It would be easy to say no, and it might even be the correct answer. It would also be a lot of money to refuse for a principle that only the two of you can see.`],
    choices: [
      { id: 'take', label: `Accept the deal and keep it strictly professional`, risk: 'med', result: `You work with {former.first} on the schedule and nothing else, speaking only in nods and cues. The money comes in and the tension stays exactly where it was, tucked into every match.`, effects: [{ money: 4200 }, { rel: { who: 'former', respect: 2 } }, { conf: -2 }, { fatigue: 5 }] },
      { id: 'refuse', label: `Refuse to sign anything with {former.first}`, risk: 'med', result: `The line is drawn plainly, and {gm.first} writes it on the paper without comment. The office thinks you are being difficult, and the locker room thinks you are right.`, effects: [{ pop: -0.2 }, { conf: 3 }, { money: -800 }, { rel: { who: 'former', heat: 4 } }] },
      { id: 'talk', label: `Ask {former.first} to talk before deciding`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.3 }, text: `The meeting is difficult, quiet and honest, and neither of you gives much ground. By the end you have agreed on terms you can both live with, and some part of the weight is gone.`, effects: [{ rel: { who: 'former', trust: 6, heat: -8, respect: 4 } }, { money: 2800 }, { conf: 2 }] },
        { weight: 1, text: `The conversation goes straight back to what happened, and the door ends up being closed harder than it was opened. You leave without a deal and with a new reason to avoid each other.`, effects: [{ rel: { who: 'former', heat: 8, trust: -3 } }, { rivalry: { who: 'former', heat: 6 } }, { conf: -3 }] } ] },
      { id: 'counter', label: `Counter-offer: accept, but double the money`, risk: 'high', outcomes: [
        { weight: 1, bonus: { popularity: 0.5 }, text: `You name a price that makes {gm.first} laugh, and then, to everyone's surprise, sign it. The first cheque is gratifyingly fat, and the work itself is exactly as awkward as expected.`, effects: [{ money: 6500 }, { conf: 2 }, { fatigue: 5 }, { rel: { who: 'former', heat: 3 } }] },
        { weight: 1, text: `The price is called a joke, and {gm.first} withdraws the offer by the end of the afternoon. You get a sidelong look from the production staff and an uncomfortably quiet weekend.`, effects: [{ conf: -2 }, { pop: -0.2 }] } ] },
    ],
  },
  {
    id: 'nf_con_card_from_vet', category: 'contract', title: `A Lawyer's Card from {vet.first}`, weight: 2, contexts: ['weekly', 'show_day', 'post_show'], cooldownDays: 300, maxPerCareer: 1, categoryCooldown: 10,
    cast: { vet: { pick: 'tag', tag: 'respected_by' } }, memory: { role: 'vet', max: 1 },
    trigger: { contract: { lte: 100 }, stat: { careerYears: { lte: 10 } } },
    slots: { where: [`in the dressing room doorway`, `at the end of a long airport corridor`, `beside the ice machine on the third floor`, `after the show in the parking lot`], hint: [`on the back, a phone number and the single word "call"`, `with a name underlined twice in blue ink`, `held between two fingers like a playing card`] },
    body: [`{vet.name} presses a business card into your hand {where}, {hint}. {vet.first} says it belongs to a lawyer who has read more contracts than anyone in the building.`, `A gift like this carries a message: someone who respects you does not want you to sign blind. It also carries a quiet suggestion that something in your own deal is not as friendly as it looks.`],
    choices: [
      { id: 'call', label: `Call the lawyer and book an hour`, risk: 'low', requires: { stat: { money: { gte: 600 } } }, result: `The lawyer spends an hour with your paperwork and finds two things worth changing and one worth avoiding. It is expensive and exact, and it makes you feel looked after.`, effects: [{ money: -600 }, { conf: 4 }, { rel: { who: 'vet', trust: 4, respect: 2 } }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'ask_vet', label: `Ask {vet.first} what to look for yourself`, risk: 'low', result: `The lesson takes twenty minutes in a hallway and covers the three clauses to scan for first. You learn to read a contract the way {vet.first} does, from the back.`, effects: [{ rel: { who: 'vet', trust: 5, affinity: 3 } }, { conf: 2 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'pocket', label: `Pocket the card and sign the paperwork as is`, risk: 'med', result: `The card stays in your wallet while you sign, and it stays there afterward as a small reproach. The deal works out fine, and you never find out how much better it might have been.`, effects: [{ money: 1200 }, { conf: -1 }, { rel: { who: 'vet', respect: -2 } }] },
      { id: 'share', label: `Pass the card to someone younger on the roster`, risk: 'med', result: `You hand it over with a shrug and a short explanation of where it came from. The younger wrestler is stunned, and the story gets around that you look after people.`, effects: [{ pop: 0.2 }, { conf: 2 }, { rel: { who: 'vet', respect: 3 } }] },
    ],
  },
  {
    id: 'nf_con_option_clock', category: 'contract', title: `The Option Clock Starts to Tick`, weight: 2, cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 10,
    cast: { gm: { pick: 'staff', role: 'gm' } },
    trigger: { contract: { lte: 45 } },
    slots: { signal: [`a calendar invite with no description`, `a handshake that lasts a second too long`, `a long, kind email about your future`, `a message to call the office as soon as you can`], mood: [`more friendly than the situation requires`, `unusually brisk`, `suspiciously relaxed`] },
    body: [`With your contract down to its last weeks, {gm.name} sends {signal}. The office has the right to extend you on the old terms, and {gm.first} is acting {mood}.`, `An option is the kind of leverage that only works while the other side believes you will walk. The calendar is not on your side, and neither, strictly, is the paperwork.`],
    choices: [
      { id: 'early', label: `Open talks for a new deal this week`, risk: 'med', outcomes: [
        { weight: 2, bonus: { popularity: 0.4, confidence: 0.4 }, text: `{gm.first} did not expect you to start the negotiation and is a half-step slower than usual. The counter-offer is better than the option, and the meeting ends on a handshake.`, effects: [{ money: 2600 }, { conf: 4 }] },
        { weight: 1, text: `The office was planning to pick up the option and now has no reason to be generous. The new talks produce a tidy, uninspired paper.`, effects: [{ money: 700 }, { conf: -2 }, { fatigue: 3 }] } ] },
      { id: 'sit', label: `Wait and let the option decision come to you`, risk: 'low', result: `The decision is made without a conversation, which is the point of an option. You work out the remaining weeks with fresh determination and no real information.`, effects: [{ conf: -1 }, { fatigue: -2 }, { pop: 0.1 }] },
      { id: 'market', label: `Let it be known you are open to other offers`, risk: 'high', result: `Word travels, a call comes in from a stranger and {gm.first} hears about it by the next show. The tone of the office changes, and so does your sense of how much you are worth.`, effects: [{ money: 1900 }, { conf: 3 }, { pop: 0.2 }, { fatigue: 4 }] },
      { id: 'ask_gm', label: `Ask {gm.first} straight what the office intends`, risk: 'low', result: `{gm.first} hesitates and then gives you an honest outline of the plan, the budget and the doubts. It is more than you expected, and you spend the evening quietly deciding what you want.`, effects: [{ conf: 2 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 1 }] },
    ],
  },
  // ======================= TRAINING =======================
  {
    id: 'nf_trn_sparring_rival', category: 'training', title: `Two People, One {setting}`, weight: 2.5, contexts: ['weekly', 'show_day'], cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 6,
    cast: { rival: { pick: 'rivalry', minHeat: 15 } }, memory: { role: 'rival', max: 2 },
    slots: { setting: [`empty ring at noon`, `cramped gym behind the arena`, `hotel fitness room with one treadmill`, `rented hall with a sagging mat`], drill: [`standing grappling`, `a conditioning circuit`, `a slow round of sparring`, `a long set of rope-running`] },
    body: [`You arrive early to work on {drill}, and {rival.name} is already there. Neither of you says anything, and neither of you leaves, which leaves the {setting} feeling half the size it was a minute ago.`, `It would be easy to turn this into a cold war or into a fight. It could also turn into the most honest hour either of you has had all month.`],
    choices: [
      { id: 'together', label: `Suggest working the drill together`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3, confidence: 0.3 }, text: `{rival.first} considers it for ten seconds, then pulls on a pair of gloves. The hour is silent, hard and strangely good, and you both learn things you would not have learned alone.`, effects: [{ rel: { who: 'rival', respect: 6, heat: -5 } }, { attr: { name: 'technical', delta: 1 } }, { fatigue: 8 }, { conf: 2 }] },
        { weight: 1, text: `{rival.first} just looks at the offer and picks up a bag of weights instead. The silence that follows is louder than any argument.`, effects: [{ rel: { who: 'rival', heat: 3 } }, { conf: -2 }, { fatigue: 4 }] } ] },
      { id: 'outwork', label: `Quietly try to outwork {rival.first}`, risk: 'med', result: `Neither of you will stop first, so neither does, and the two of you end the hour drenched and speechless. You win by a rep or two, and the knees pay for it that night.`, effects: [{ conf: 3 }, { fatigue: 14 }, { rivalry: { who: 'rival', heat: 4 } }, { rel: { who: 'rival', respect: 3 } }] },
      { id: 'leave', label: `Pick up your bag and train somewhere else`, risk: 'low', result: `You find a corner of the building with a loose rope and a bad light and finish there alone. The session is unremarkable, and the knot of tension stays where it was.`, effects: [{ fatigue: 5 }, { conf: -1 }, { attr: { name: 'endurance', delta: 1 } }] },
      { id: 'ask', label: `Ask {rival.first} for notes on one specific move`, risk: 'low', result: `{rival.first} is startled and then pleased, and shows you where the hip should go. The correction is tiny and obviously right, and it changes the way the move feels in your body.`, effects: [{ rel: { who: 'rival', respect: 5, trust: 2, heat: -3 } }, { attr: { name: 'grappling', delta: 1 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'nf_trn_standing_session', category: 'training', title: `{mentor.first} Wants to Work on {focus}`, weight: 2, cooldownDays: 160, maxPerCareer: 3, categoryCooldown: 6,
    cast: { mentor: { pick: 'tag', tag: 'mentor' } }, memory: { role: 'mentor', max: 2 },
    slots: { focus: [`how to take a back bump safely`, `how to read a crowd from the ring`, `how to end a match on your own terms`, `how to sell without overacting`], format: [`in an empty arena after the crew has gone home`, `in a hotel ballroom with the carpet rolled back`, `in a rented boxing gym before opening time`] },
    body: [`{mentor.name} has asked for an hour {format}, with nothing on the agenda except {focus}. The offer comes with a particular half-smile, as if {mentor.they} knew you would say yes.`, `The bond between you is old enough to need no explanation. It is also the sort of thing that is easy to let slide when the schedule gets busy.`],
    choices: [
      { id: 'drill', label: `Spend the whole hour on the drills`, risk: 'low', result: `You repeat the same sequence until it stops being a sequence and becomes a habit. {mentor.first} says little and corrects only the things you would never notice yourself.`, effects: [{ attr: { name: 'technical', delta: 1 } }, { rel: { who: 'mentor', trust: 4, affinity: 3 } }, { fatigue: 9 }, { conf: 1 }] },
      { id: 'teach', label: `Ask {mentor.first} to let you lead for half of it`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4, charisma: 0.3 }, text: `You walk through your own version of the lesson, and {mentor.first} listens with arms crossed and slowly nods. It is the best compliment either of you could trade.`, effects: [{ rel: { who: 'mentor', respect: 6 } }, { attr: { name: 'psychology', delta: 1 } }, { conf: 4 }, { fatigue: 6 }] },
        { weight: 1, text: `Halfway through the explanation, you realise you were not completely sure of the answer. {mentor.first} fills in the gap kindly, and you cannot meet the old eyes for a minute.`, effects: [{ conf: -3 }, { rel: { who: 'mentor', affinity: 2 } }, { fatigue: 6 }] } ] },
      { id: 'talk', label: `Skip the drills and just talk about the business`, risk: 'low', result: `The hour turns into a long conversation with a thermos of coffee, and neither of you works up a sweat. You learn more about where the business has been than you do about where you are going.`, effects: [{ rel: { who: 'mentor', affinity: 6, trust: 3 } }, { conf: 3 }, { fatigue: -3 }] },
      { id: 'cancel', label: `Postpone it because the schedule is packed`, risk: 'med', result: `{mentor.first} says "of course" in the voice of someone who understands, and the hour goes to sleep and paperwork. You stay rested, and you feel the small cost on the next phone call.`, effects: [{ fatigue: -7 }, { rel: { who: 'mentor', affinity: -3 } }, { conf: -1 }] },
    ],
  },
  {
    id: 'nf_trn_studying_you', category: 'training', title: `{opp.first} Is Practicing Your Move`, weight: 2, cooldownDays: 180, maxPerCareer: 2, categoryCooldown: 6,
    cast: { opp: { pick: 'tag', tag: 'studying_you' } }, memory: { role: 'opp', max: 1 },
    slots: { place: [`the far corner of the practice ring`, `a padded mat in the weight room`, `the empty ring after the show`], detail: [`including the awkward little hitch in the middle`, `down to the way you look at the crowd afterward`, `with the same pause before the finish`, `with a nod to your entrance at the end`] },
    body: [`In {place}, {opp.name} is working through a sequence that is unmistakably yours, {detail}. {opp.first} stops the moment you walk in, and the flush on {opp.their} face is all the explanation you need.`, `Imitation is an old kind of compliment and an older kind of threat. It means someone has been watching you closely, and for a good while.`],
    choices: [
      { id: 'show', label: `Show {opp.first} how it is really done`, risk: 'low', result: `You take over the mat and break the sequence down into four plain steps. {opp.first} learns more in ten minutes than in a month of watching, and has a hard time hiding the gratitude.`, effects: [{ rel: { who: 'opp', respect: 6, trust: 4, heat: -4 } }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 4 }] },
      { id: 'tease', label: `Tease {opp.first} and leave it at that`, risk: 'low', result: `A joke about royalties earns a startled laugh from the room and a faint grimace from {opp.first}. It lightens the air and makes you look secure, though not especially kind.`, effects: [{ pop: 0.1 }, { conf: 2 }, { rel: { who: 'opp', affinity: -1 } }] },
      { id: 'change', label: `Retire the move and build a new one`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4, confidence: 0.3 }, text: `Two weeks of experiment give you a replacement that is odder, harder and wholly yours. The old move is a memory, and the new one gets a bigger pop than the old ever did.`, effects: [{ attr: { name: 'agility', delta: 1 } }, { pop: 0.5 }, { conf: 3 }, { fatigue: 8 }] },
        { weight: 1, text: `The replacement does not feel right in the ring, and the crowd waits for the one they remember. You spend a week wrestling with an apology in your ribs.`, effects: [{ pop: -0.3 }, { conf: -3 }, { fatigue: 8 }] } ] },
      { id: 'warn', label: `Tell {opp.first} to find a signature of their own`, risk: 'med', result: `The words come out colder than planned. {opp.first} nods stiffly and leaves, and you can see the hurt and the stubbornness settle together on a face that will not forget.`, effects: [{ rel: { who: 'opp', respect: -2, heat: 7 } }, { rivalry: { who: 'opp', heat: 6 } }, { conf: 2 }] },
    ],
  },
  {
    id: 'nf_trn_insulted_gym', category: 'training', title: `Same Mat, Bad Blood`, weight: 2.5, contexts: ['weekly', 'show_day'], cooldownDays: 160, maxPerCareer: 2, categoryCooldown: 6,
    cast: { target: { pick: 'tag', tag: 'insulted_by' } }, memory: { role: 'target', max: 2 },
    slots: { gym: [`the practice ring behind the arena`, `a rented gym with a leaking ceiling`, `the weight room in the hotel basement`, `a church hall with floor mats`], pairing: [`the coach pairs you for a drill`, `the only free machine is next to the same bench`, `the only spotter available is the one you would least choose`] },
    body: [`In {gym}, {pairing}, and the person across from you is {target.name}. The things you said about {target.them} have been circulating for a while, and the room is paying a lot more attention than it should.`, `You can leave, you can speak, or you can train in silence and let the weights say what is left. Nobody else will make the choice for you.`],
    choices: [
      { id: 'apologise', label: `Apologise quietly before the drill starts`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, confidence: 0.3 }, text: `{target.first} hears you out with a flat face, nods once, and says the weights are heavy enough. It is not forgiveness, but the drill goes ahead without a word, which feels like a small peace.`, effects: [{ rel: { who: 'target', heat: -12, respect: 4, trust: 3 } }, { conf: 1 }] },
        { weight: 1, text: `{target.first} turns away before you finish and the apology evaporates in the air. Everyone nearby saw, and the story will be repeated by dinnertime.`, effects: [{ rel: { who: 'target', heat: 3 } }, { conf: -3 }, { pop: -0.1 }] } ] },
      { id: 'silent', label: `Say nothing and train as hard as you can`, risk: 'low', result: `You let the bar do the talking, and for an hour the two of you lift in a noisy, careful silence. When it finishes, {target.first} racks the bar and leaves without a glance, and the room exhales.`, effects: [{ fatigue: 10 }, { conf: 2 }, { attr: { name: 'power', delta: 1 } }] },
      { id: 'double', label: `Repeat the insult and see how {target.first} takes it`, risk: 'high', result: `The line gets a gasp and a smirk from a few observers, and a very still silence from {target.first}. The drill is abandoned, and the feud has a new chapter before either of you has caught breath.`, effects: [{ rivalry: { who: 'target', heat: 12 } }, { rel: { who: 'target', heat: 10, respect: -2 } }, { pop: 0.4 }, { conf: 3 }] },
      { id: 'leave', label: `Leave quickly and train at a different hour`, risk: 'low', result: `The new schedule costs you the good equipment and the morning light. The rumour is that you ran, and the rumour is partly true.`, effects: [{ fatigue: -2 }, { conf: -2 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'nf_trn_overload', category: 'training', title: `The Trainer's Notebook Says Stop`, weight: 2, cooldownDays: 140, maxPerCareer: 3, categoryCooldown: 6,
    cast: { trainer: { pick: 'staff', role: 'trainer' } },
    trigger: { stat: { fatigue: { gte: 55 } } },
    slots: { sign: [`your resting heart rate is up`, `your grip strength has dropped`, `your landings have begun to sound heavier`, `your morning stretches are taking twice as long`], plan: [`a full week of mobility work`, `three days without any bumps`, `a lighter load on every lift`] },
    body: [`{trainer.name} opens a notebook and reads out the numbers: {sign}. The prescription is {plan}, delivered in the soft voice of someone who expects an argument.`, `You know what the numbers mean, because you can feel them in the mornings. You also know what happens to people who miss a chance because they were tired.`],
    choices: [
      { id: 'obey', label: `Follow the plan exactly`, risk: 'low', result: `The week is boring in the best way, built from foam rollers and early nights. By the end of it your body has quietly given back what it borrowed.`, effects: [{ fatigue: -16 }, { conf: 1 }, { pop: -0.2 }] },
      { id: 'half', label: `Take half of the plan and keep the rest of the schedule`, risk: 'med', result: `You keep most of the bookings and trim the extras, and the result is a mediocre version of both. The tiredness eases a little and the opportunities remain open.`, effects: [{ fatigue: -7 }, { conf: 1 }] },
      { id: 'push', label: `Ignore the notebook and keep pushing`, risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.3 }, text: `The adrenaline carries you through, and the next few shows are some of your sharpest. You pay for it in a heavy sleep the following weekend.`, effects: [{ pop: 0.6 }, { conf: 3 }, { fatigue: 9 }] },
        { weight: 1, text: `A plain, ordinary bump goes wrong because the legs are a half-beat late. The pain is sharp, and the notebook is open on the trainer's desk when you return.`, effects: [{ conf: -3 }, { fatigue: 9 }, { injury: { part: 'legs', severity: 1, days: 8 } }] } ] },
      { id: 'swap', label: `Swap the heavy lifts for technique work`, risk: 'low', result: `{trainer.first} thinks about it and agrees, since sore muscles can still learn. A week of careful, slow reps leaves you more skilful and no less tired.`, effects: [{ attr: { name: 'technical', delta: 1 } }, { fatigue: -4 }, { conf: 1 }] },
    ],
  },
  {
    id: 'nf_trn_rookie_asks', category: 'training', title: `{rook.first} Wants to Train With You`, weight: 2, contexts: ['weekly', 'show_day', 'post_show'], cooldownDays: 160, maxPerCareer: 3, categoryCooldown: 6,
    cast: { rook: { pick: 'roster', tier: { lte: 1 }, sameBrand: true } },
    trigger: { stat: { careerYears: { gte: 4 } } },
    slots: { ask: [`for a few hours before the doors open`, `on the road, whenever there is a free ring`, `just once, to see how you prepare`], manner: [`rehearsed the request in the mirror`, `waited three days to get up the nerve`, `nearly asked a dozen times already`] },
    body: [`{rook.name} comes up to you at catering and asks to train with you {ask}. It is obvious that {rook.they} {manner}, because the words come out in the right order and sound too neat.`, `A request like this is a small honour and a small tax. You were once on the other end of it, and you remember who said yes and who did not.`],
    choices: [
      { id: 'yes', label: `Say yes and set a regular time`, risk: 'med', result: `The first session leaves {rook.first} with a pocket full of notes and you with a sore left shoulder. It turns out that teaching someone else the basics is the best way to remember them.`, effects: [{ rel: { who: 'rook', respect: 5, trust: 5, affinity: 4 } }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 8 }, { conf: 2 }] },
      { id: 'once', label: `Agree to one session and see how it goes`, risk: 'low', result: `The single session is brisk and helpful, and {rook.first} thanks you politely at the end. It is an arrangement that asks for little and gives about the same.`, effects: [{ rel: { who: 'rook', respect: 3, trust: 2 } }, { fatigue: 4 }, { conf: 1 }] },
      { id: 'test', label: `Make {rook.first} earn it with a brutal warm-up`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.3 }, text: `{rook.first} grits through every rep and finishes grey-faced but upright. You nod, and the rest of the session is much friendlier, as the test has been passed.`, effects: [{ rel: { who: 'rook', respect: 6 } }, { fatigue: 9 }, { conf: 2 }] },
        { weight: 1, text: `The warm-up is too much and {rook.first} stumbles, and quietly quits halfway. You feel like a bully who happens to be correct.`, effects: [{ rel: { who: 'rook', respect: -2, trust: -3 } }, { conf: -2 }, { fatigue: 5 }] } ] },
      { id: 'no', label: `Decline: your own preparation is the priority`, risk: 'low', result: `You say it as kindly as you can, and {rook.first} smiles and nods and walks away more quickly than the answer deserved. Your own sessions stay undisturbed, and the memory of the walk stays with you.`, effects: [{ conf: 1 }, { fatigue: -2 }, { rel: { who: 'rook', respect: -2 } }] },
    ],
  },
  {
    id: 'nf_trn_tape_of_rival', category: 'training', title: `{coach.first} Has Tape of {rival.first}`, weight: 2.5, contexts: ['weekly', 'pre_show', 'show_day'], cooldownDays: 140, maxPerCareer: 3, categoryCooldown: 6,
    cast: { coach: { pick: 'staff', role: 'coach' }, rival: { pick: 'rivalry', minHeat: 10 } }, memory: { role: 'rival', max: 2 },
    slots: { room: [`a dark office with a dusty monitor`, `the back of a production truck`, `a hotel room with the curtains pulled`, `the corner of a locker room with a laptop`], find: [`a habit of dropping the left shoulder before a big move`, `a slow, careful way of pacing the first five minutes`, `a pattern of always going to the same corner when in trouble`] },
    body: [`In {room}, {coach.name} presses play on a stack of {rival.name}'s old matches and stops on {find}. It is a tiny thing, and once you see it you can see nothing else.`, `Knowing the habit would make it easier to beat {rival.them}, and also easier to hurt. It is the sort of information that changes a match from a contest to a lesson, depending on what you do with it.`],
    choices: [
      { id: 'exploit', label: `Build your game plan around the habit`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.5 }, text: `The plan works with unsettling accuracy, and {rival.first} spends the match looking at you as if you had read a diary. The crowd sees a smart victory, and the rival sees a grudge.`, effects: [{ pop: 0.6 }, { conf: 4 }, { rel: { who: 'rival', heat: 6 } }, { rivalry: { who: 'rival', heat: 5 } }] },
        { weight: 1, text: `The habit turns out to be a trap, set by someone who knew the tape existed. You lose a quarter of the match learning that {rival.first} was a step ahead.`, effects: [{ conf: -3 }, { pop: -0.2 }, { rel: { who: 'rival', respect: 3 } }] } ] },
      { id: 'tell', label: `Tell {rival.first} what the tape shows`, risk: 'med', result: `{rival.first} stares at you as if you had offered a bribe, then asks to see the clip. Whatever happens next, you have turned a weapon into a strange sort of gift.`, effects: [{ rel: { who: 'rival', respect: 7, trust: 5, heat: -5 } }, { conf: 2 }, { rivalry: { who: 'rival', heat: -4 } }] },
      { id: 'study', label: `Study it for craft and ignore the weakness`, risk: 'low', result: `You watch the clips for the best ideas rather than the worst, and take away a handful of useful transitions. The match that follows is better than you could have planned, and kinder than your rivals deserve.`, effects: [{ attr: { name: 'technical', delta: 1 } }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'delete', label: `Ask {coach.first} to wipe the tape`, risk: 'low', result: `{coach.first} frowns, shrugs, and presses a key. The act feels clean, and you carry a vague sense of having thrown away something valuable.`, effects: [{ conf: 1 }, { rel: { who: 'rival', respect: 2 } }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'nf_trn_ally_dare', category: 'training', title: `{ally.first} Dares You to a Conditioning Bet`, weight: 2, contexts: ['weekly', 'show_day'], cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 6,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 2 },
    slots: { test: [`a one-mile run along the highway shoulder`, `fifty burpees without a break`, `holding a plank until someone laughs`, `ten laps of the arena concourse`], stake: [`dinner`, `a week of carrying the bags`, `who picks the music on the next long drive`] },
    body: [`In the middle of a dull afternoon, {ally.name} proposes {test}, with {stake} on the line. {ally.first} says it with a straight face, which is how you know it is a trap.`, `It is a harmless bet, in theory, and it is also the first time in weeks either of you has had fun. The only question is what you are willing to risk for a laugh.`],
    choices: [
      { id: 'accept', label: `Take the bet and go flat out`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `You win by a stride, collapse on the grass and laugh until it hurts. {ally.first} pays up with a glare that is almost respect.`, effects: [{ rel: { who: 'ally', affinity: 5, trust: 2 } }, { fatigue: 9 }, { conf: 3 }] },
        { weight: 1, text: `{ally.first} wins by a distance, and then very graciously says nothing about it. You pay the stake and nurse a stitch for the rest of the day.`, effects: [{ rel: { who: 'ally', affinity: 5 } }, { fatigue: 9 }, { conf: -1 }, { money: -60 }] } ] },
      { id: 'raise', label: `Raise the stakes and invite others to join`, risk: 'med', result: `Within an hour half the dressing room is in, and the bet becomes a small tournament with a hand-lettered scoreboard. It is a team-building mess, and the pair of you are the commissioners.`, effects: [{ pop: 0.2 }, { conf: 2 }, { fatigue: 8 }, { rel: { who: 'ally', affinity: 3 } }, { money: -90 }] },
      { id: 'decline', label: `Decline: you are saving your legs`, risk: 'low', result: `{ally.first} shrugs and says the offer stays open. You sit out and watch someone else take the bet, and feel sensible and slightly left out.`, effects: [{ fatigue: -4 }, { rel: { who: 'ally', affinity: -1 } }] },
      { id: 'cheat', label: `Take a shortcut when {ally.first} is not looking`, risk: 'high', result: `You win, and the win tastes like cardboard when {ally.first} finds out three minutes later. It becomes a story, and the story is you.`, effects: [{ rel: { who: 'ally', trust: -6, affinity: -3 } }, { conf: -1 }, { fatigue: 4 }] },
    ],
  },
  // ======================= FINANCE =======================
  {
    id: 'nf_fin_ally_loan', category: 'finance', title: `{ally.first} Asks for Money`, weight: 2.5, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 8,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 2 },
    trigger: { stat: { money: { gte: 800 } } },
    slots: { reason: [`a transmission that died on the highway`, `a landlord who raised the rent without warning`, `a medical bill that arrived in a thick envelope`, `a lawyer's retainer`], place: [`the loading dock`, `a quiet corner of the hotel bar`, `the back of a rental car`] },
    body: [`In {place}, {ally.name} asks you for a loan in a voice so low you have to lean in, and explains it is because of {reason}. The figure is real money, the sort that makes you think about the next three months.`, `It is not an easy conversation for either of you. Money is the thing that changes friendships fastest, and it does so quietly.`],
    choices: [
      { id: 'lend', label: `Lend the full amount with no strings`, risk: 'med', result: `The envelope changes hands without a word, and {ally.first} can only nod. The money is gone by morning, and the gratitude arrives over the following weeks in small, steady ways.`, effects: [{ money: -1500 }, { rel: { who: 'ally', trust: 10, affinity: 8 } }, { conf: 1 }] },
      { id: 'part', label: `Lend half and help find the rest elsewhere`, risk: 'low', result: `You hand over half the sum and spend an afternoon calling people you trust. Between you, the gap gets filled, and {ally.first} is relieved but a little embarrassed to have needed so much help.`, effects: [{ money: -700 }, { rel: { who: 'ally', trust: 6, affinity: 4 } }, { fatigue: 3 }] },
      { id: 'decline', label: `Decline gently and explain your own limits`, risk: 'med', result: `You explain that your own cushion is thinner than it looks. {ally.first} says all the right things and leaves with a face that suggests you did not need to be quite so honest.`, effects: [{ rel: { who: 'ally', trust: -3, affinity: -3 } }, { conf: -1 }] },
      { id: 'office', label: `Offer to bring it to the office on {ally.first}'s behalf`, risk: 'med', outcomes: [
        { weight: 2, bonus: { popularity: 0.4, charisma: 0.3 }, text: `You make the case in person, and the office agrees to an advance against future pay. {ally.first} has the money by Friday and sends a thank-you that is almost too much.`, effects: [{ rel: { who: 'ally', trust: 7, respect: 3 } }, { pop: 0.2 }, { conf: 2 }] },
        { weight: 1, text: `The office refuses, and the news reaches {ally.first} before you do. The embarrassment is worse than a straight no, and you are the face of it.`, effects: [{ rel: { who: 'ally', trust: -2 } }, { conf: -2 }, { fatigue: 2 }] } ] },
    ],
  },
  {
    id: 'nf_fin_charity_bid', category: 'finance', title: `A Bidding War for {item}`, weight: 2, contexts: ['weekly', 'show_day', 'post_show'], cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 8,
    cast: { rival: { pick: 'rivalry', minHeat: 15 }, host: { pick: 'media', kind: 'host' } }, memory: { role: 'rival', max: 1, noResults: true },
    trigger: { stat: { money: { gte: 1000 } } },
    slots: { item: [`a signed ring rope`, `a weekend of training with a veteran`, `a replica championship belt`, `a hand-painted entrance banner`], cause: [`a children's hospital`, `a local animal shelter`, `a fund for retired ring crew`] },
    body: [`{host.name} is running a charity auction for {cause}, and the lot is {item}. {rival.name} has been bidding against you for ten minutes, each raise accompanied by a smile too bright to be an accident.`, `The money is going to a good place either way. The audience is enjoying the contest, and so, you suspect, is the rival.`],
    choices: [
      { id: 'raise', label: `Keep raising until {rival.first} folds`, risk: 'med', result: `The final number is silly and the applause is deafening, and {rival.first} lifts both hands in a good-natured surrender. The charity gets a record sum and you get the lot, an empty pocket and the crowd.`, effects: [{ money: -1600 }, { pop: 0.7 }, { conf: 3 }, { rel: { who: 'rival', respect: 3 } }] },
      { id: 'team', label: `Offer to pool the money and win it together`, risk: 'low', result: `{rival.first} stares for a moment, then shakes your hand on stage. The room goes quiet before roaring, and the two of you hold up the lot between you like a trophy neither of you earned.`, effects: [{ money: -800 }, { rel: { who: 'rival', respect: 6, heat: -8, trust: 3 } }, { rivalry: { who: 'rival', heat: -6 } }, { pop: 0.5 }] },
      { id: 'drop', label: `Let {rival.first} win the lot`, risk: 'low', result: `You stop at a sensible number and let the other side take it. The amount you gave is still large, and the smugness in the rival's smile is a minor price.`, effects: [{ money: -300 }, { pop: 0.1 }, { conf: -1 }, { rivalry: { who: 'rival', heat: 2 } }] },
      { id: 'taunt', label: `Raise with a taunt aimed at {rival.first}`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.4 }, text: `The taunt lands, the crowd roars, and the bidding hits a number nobody had imagined. You win it with a flourish and the charity wins most.`, effects: [{ money: -2000 }, { pop: 1.0 }, { conf: 4 }, { rivalry: { who: 'rival', heat: 7 } }] },
        { weight: 1, text: `The taunt comes out meaner than the room wanted, and the crowd turns on the joke. You win the lot, and lose a piece of goodwill.`, effects: [{ money: -2000 }, { pop: -0.3 }, { conf: -2 }, { rivalry: { who: 'rival', heat: 7 } }] } ] },
    ],
  },
  {
    id: 'nf_fin_tax_surprise', category: 'finance', title: `A Letter from the Tax Office`, weight: 2, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 10,
    trigger: { stat: { money: { gte: 1500 }, careerYears: { gte: 1 } } },
    slots: { letter: [`a thick envelope with a window and a stamp`, `a polite email with a subject line in capitals`, `a registered notice that needed a signature`], sum: [`a few thousand dollars you did not know you owed`, `a bill that includes a penalty for a form you never filed`, `an estimate of what the last two years cost`] },
    body: [`{letter} is waiting when you get home from the road, and the contents describe {sum}. The wording is neutral and exact, which is worse than rage.`, `Touring across state lines and being paid as a contractor has a way of making the numbers bigger than they seem. You can pay, contest or hire help, and each path costs something different.`],
    choices: [
      { id: 'pay', label: `Pay it in full and put it behind you`, risk: 'low', result: `The transfer takes three minutes and a deep breath, and then it is gone. The relief is enormous and slightly bitter, and you sleep better than you have all week.`, effects: [{ money: -2200 }, { conf: 2 }, { fatigue: -3 }] },
      { id: 'accountant', label: `Hire an accountant to go through every line`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.3 }, text: `The accountant finds deductions you had never heard of, from mileage to gym fees. The final bill is smaller than the first, and so is the fee.`, effects: [{ money: -1100 }, { conf: 4 }, { attr: { name: 'psychology', delta: 1 } }] },
        { weight: 1, text: `The accountant confirms that the original sum is right and adds a fee for the privilege. You pay both and feel a little foolish.`, effects: [{ money: -3000 }, { conf: -2 }] } ] },
      { id: 'contest', label: `Contest the penalty yourself`, risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.3 }, text: `A day on hold and three forms later, the penalty is struck. It is the best-paid afternoon of your life, and the most boring.`, effects: [{ money: -1200 }, { conf: 3 }, { fatigue: 4 }] },
        { weight: 1, text: `The appeal is rejected with the same cool language as the original. You pay the full sum plus interest, and lose a week of patience.`, effects: [{ money: -2900 }, { conf: -3 }, { fatigue: 6 }] } ] },
      { id: 'ask_vet', label: `Ask a veteran how they handled the same thing`, risk: 'low', result: `Over a coffee, a veteran from the roster gives you a name, a spreadsheet template and a story about a worse bill. It does not erase the bill, but a templated appeal shaves it down and makes the rest look manageable.`, effects: [{ money: -1800 }, { conf: 3 }, { fatigue: 1 }] },
    ],
  },
  {
    id: 'nf_fin_rival_ranking', category: 'finance', title: `A Statement with Two Names on It`, weight: 2.5, cooldownDays: 220, maxPerCareer: 2, categoryCooldown: 8,
    cast: { exec: { pick: 'staff', role: 'executive' }, rival: { pick: 'rivalry', minHeat: 15 } }, memory: { role: 'rival', max: 1, noResults: true },
    trigger: { stat: { popularity: { gte: 25 } } },
    slots: { chart: [`a bar chart in the quarterly deck`, `a printed ranking on an office wall`, `a column in a budget spreadsheet`, `a folded sheet of figures`], line: [`sells noticeably more than you`, `sells almost exactly what you do`, `has overtaken you by a small margin`] },
    body: [`{exec.name} shows you {chart} of merchandise sales, and {rival.name}'s line {line}. The line is highlighted in green, and yours in a quiet grey.`, `The figures will go to the office whether or not you comment on them. How you explain the gap is the only part still within your control.`],
    choices: [
      { id: 'redesign', label: `Pitch a new design and a push in the arena`, risk: 'med', outcomes: [
        { weight: 2, bonus: { popularity: 0.4, charisma: 0.4 }, text: `The new shirt has a punchline on the back and sells out in two cities. The chart in the next deck has a very different shape.`, effects: [{ money: 2400 }, { pop: 0.5 }, { conf: 3 }, { fatigue: 4 }] },
        { weight: 1, text: `The new design is stranger than the old one and sells even less. A pile of unsold shirts sits at the back of the truck for the rest of the tour.`, effects: [{ money: -600 }, { conf: -3 }, { fatigue: 4 }] } ] },
      { id: 'shrug', label: `Shrug it off: merchandise is not the job`, risk: 'low', result: `You hand the sheet back and say that the work in the ring speaks. {exec.first} writes it down with an expression that does not agree, and the figures move on without you.`, effects: [{ conf: 1 }, { pop: -0.1 }, { fatigue: -1 }] },
      { id: 'taunt', label: `Use the gap to needle {rival.first} in public`, risk: 'high', result: `You mention the sales figures to a reporter, in a tone of exaggerated pity. The remark is quoted widely, and {rival.first} replies with a very specific number of {rival.their} own.`, effects: [{ pop: 0.5 }, { rivalry: { who: 'rival', heat: 8 } }, { rel: { who: 'rival', heat: 6 } }, { conf: 2 }] },
      { id: 'bundle', label: `Propose a joint product with {rival.first}`, risk: 'med', result: `The idea earns a long pause from {exec.first}, followed by a note that says "interesting". A combined shirt sells respectably, and the two of you split the paperwork and the grudge.`, effects: [{ money: 1500 }, { rel: { who: 'rival', respect: 4, heat: -5 } }, { rivalry: { who: 'rival', heat: -4 } }, { pop: 0.3 }] },
    ],
  },
  {
    id: 'nf_fin_silent_partner', category: 'finance', title: `{vet.first} Wants to Be Your Silent Partner`, weight: 2, cooldownDays: 300, maxPerCareer: 1, categoryCooldown: 8,
    cast: { vet: { pick: 'tag', tag: 'respected_by' } }, memory: { role: 'vet', max: 1 },
    trigger: { stat: { money: { gte: 2500 }, careerYears: { gte: 3 } } },
    slots: { venture: [`a small training gym near the arena district`, `a diner that makes its own hot sauce`, `a mobile merch trailer for the regional circuit`, `a used-car lot run by a cousin`], terms: [`you put in the money and learn the business`, `you share the profits fifty-fifty`, `you take the risk and keep the name`] },
    body: [`{vet.name} corners you by the vending machine with a pitch for {venture}, and a simple arrangement: {terms}. The pitch is rehearsed, and the offer has been thought through more than the nervous smile lets on.`, `People in your line of work are always told to plan for life after the ring, and few of them manage it. It is flattering to be asked, and a little frightening to realise how much it matters.`],
    choices: [
      { id: 'invest', label: `Put in real money and shake on it`, risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.3, popularity: 0.3 }, text: `The venture finds its feet in a few months, and the first dividend lands with a hand-written thank-you. The sense of having planted something outside the ring is better than the money.`, effects: [{ money: 2600 }, { rel: { who: 'vet', trust: 6, affinity: 4 } }, { conf: 3 }] },
        { weight: 1, text: `The venture limps through its first quarter and then closes quietly, with a refund that is a fraction of the total. {vet.first} apologises more than once, and neither of you mentions it again.`, effects: [{ money: -3500 }, { rel: { who: 'vet', trust: 2, affinity: 2 } }, { conf: -3 }] } ] },
      { id: 'small', label: `Offer a small stake as a gesture of goodwill`, risk: 'low', result: `{vet.first} accepts the smaller figure with a laugh and calls you careful. You get a slender seat at the table and a monthly email with graphs.`, effects: [{ money: -600 }, { rel: { who: 'vet', trust: 3, respect: 2 } }, { conf: 1 }] },
      { id: 'ask', label: `Ask to see the books before deciding`, risk: 'low', result: `{vet.first} is a little hurt at the request and entirely correct about why it is needed. The books are tidy and the margins thin, and you leave with a better sense of both the venture and the person.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { rel: { who: 'vet', respect: 3 } }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'pass', label: `Politely decline and keep your savings liquid`, risk: 'low', result: `You say you want to stay focused on the ring, and {vet.first} nods, because that is a reasonable answer. The money stays in the bank, and the chance goes to someone else.`, effects: [{ conf: 1 }, { rel: { who: 'vet', respect: 1 } }] },
    ],
  },
  {
    id: 'nf_fin_fan_fundraiser', category: 'finance', title: `A Fan's Fundraiser Needs {need}`, weight: 1.5, contexts: ['weekly', 'show_day', 'post_show'], cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 8,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { minYear: 2010, stat: { popularity: { gte: 25 } } },
    slots: { need: [`one signed item`, `one more share`, `a short video`], goal: [`a youth wrestling program that has lost its gym`, `a fund for a family after a house fire`, `a school trip for a class with no budget`] },
    body: [`{fan.name} has been raising money for {goal}, and sends a message asking for a hand with the last push. {fan.first} has a link, a goal that is within a thousand dollars of finished, and a note that begins with "I understand if you can't".`, `It is the sort of request that the business receives by the hundred, and the sort that can be answered in a minute. The good it does depends on how much of yourself you put into the minute.`],
    choices: [
      { id: 'video', label: `Record a short personal video for the page`, risk: 'low', result: `You record it in the hotel corridor on the first take, and the page's total jumps by three hundred in an hour. {fan.first} replies with a stream of exclamation marks and a photograph of the gym.`, effects: [{ pop: 0.5 }, { conf: 2 }, { fatigue: 1 }, { event: { type: 'social_post', participants: [], summary: 'Backed a fan\'s fundraiser with a personal video.', importance: 2, data: { quality: { base: 64, charisma: 0.3 } } } }] },
      { id: 'donate', label: `Donate a good chunk and say nothing`, risk: 'low', result: `The donation arrives under a name that is not yours, and {fan.first} will never know who it was. You feel richer for it, in the odd way of an anonymous gift.`, effects: [{ money: -800 }, { conf: 3 }] },
      { id: 'auction', label: `Offer to auction a signed item for the cause`, risk: 'med', result: `A signed ring jacket goes live on the page, and the bids soar past the original goal. The fundraiser closes early, and a small amount of your gear leaves with it.`, effects: [{ money: -200 }, { pop: 0.6 }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'pass', label: `Wish {fan.first} luck and leave it at that`, risk: 'low', result: `The reply is warm, short and noncommittal, and the fundraiser finishes without you. You think of it twice during the week and then not again.`, effects: [{ conf: -1 }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'nf_fin_unseen_table', category: 'finance', title: `Someone Paid for Your Table`, weight: 2, contexts: ['weekly', 'show_day', 'post_show'], cooldownDays: 240, maxPerCareer: 1, categoryCooldown: 8,
    cast: { former: { pick: 'tag', tag: 'betrayal' } }, memory: { role: 'former', max: 3 },
    slots: { restaurant: [`a roadside diner with a cracked neon sign`, `a hotel restaurant with white tablecloths`, `a late-night noodle place near the arena`, `a steakhouse that smells of charcoal`], note: [`written on the back of the receipt`, `delivered by the waiter with the bill`, `left beside the check in a blank envelope`] },
    body: [`Midway through dinner at {restaurant}, the waiter explains that your bill has been paid, with a note {note}. The handwriting belongs to {former.name}, who is two tables away and not looking at you.`, `It could be a kindness, a message or an attempt to put you in someone's debt. Between the two of you, a bill is never just a bill.`],
    choices: [
      { id: 'thanks', label: `Walk over and thank {former.first} in person`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, confidence: 0.3 }, text: `The thanks is brief and honest, and {former.first} replies with a stiff nod that is the closest thing to forgiveness available. It is not a repair, but it is a first move in the right direction.`, effects: [{ rel: { who: 'former', heat: -8, trust: 5, respect: 3 } }, { conf: 2 }] },
        { weight: 1, text: `The thanks is interrupted by a cold stare and an abrupt "do not mention it". You walk back to your table with the unpleasant sense of having been seen through.`, effects: [{ rel: { who: 'former', heat: 3 } }, { conf: -2 }] } ] },
      { id: 'return', label: `Pay {former.first} back, with a note of your own`, risk: 'low', result: `You leave cash on the table with a short reply, and the waiter relays it without comment. The books are even, and so, for a night, are the two of you.`, effects: [{ money: -120 }, { rel: { who: 'former', respect: 3 } }, { conf: 2 }] },
      { id: 'accept', label: `Say nothing and accept the gift`, risk: 'low', result: `You finish the meal in the glow of a free dinner and the faint chill of an unanswered question. {former.first} leaves first, and the note stays in your pocket for a week.`, effects: [{ money: 60 }, { rel: { who: 'former', trust: 1 } }, { conf: -1 }] },
      { id: 'refuse', label: `Refuse to let {former.first} settle your bill`, risk: 'med', result: `You insist on paying twice, which confuses the waiter and offends the diner at the next table. The message is clear and so is the cost, and {former.first} leaves with a look that is harder to read.`, effects: [{ money: -90 }, { rel: { who: 'former', heat: 5, respect: -1 } }, { conf: 2 }] },
    ],
  },
  // ======================= TRAVEL =======================
  {
    id: 'nf_trv_rental_ally', category: 'travel', title: `Three Hours in a Rental with {ally.first}`, weight: 2.5, cooldownDays: 160, maxPerCareer: 3, categoryCooldown: 6,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 2 },
    slots: { road: [`a two-lane road through farmland`, `a highway with no radio signal`, `a ring road jammed with trucks`, `a detour around a closed bridge`], mood: [`both of you are too tired to talk`, `the conversation keeps drifting toward things you have not said aloud`, `a playlist argument has been running since the airport`] },
    body: [`The only rental left at the counter is a hatchback with a sticky gearshift, and it takes you and {ally.name} down {road}. By the second hour, {mood}.`, `Travel is the one place where a good friendship and a bad one look the same until something forces a choice. The car has one road, no exits and a full tank.`],
    choices: [
      { id: 'ask', label: `Ask the question you have been avoiding`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, confidence: 0.3 }, text: `You say it plainly and {ally.first} answers truthfully, and the miles go by in a relieved quiet. By the time the exit signs appear, something has been put down that you were both carrying.`, effects: [{ rel: { who: 'ally', trust: 8, affinity: 5 } }, { conf: 3 }, { fatigue: 3 }] },
        { weight: 1, text: `The question lands like a rock in a pond, and {ally.first} switches the radio to static for the next forty minutes. You arrive on time and in different moods.`, effects: [{ rel: { who: 'ally', trust: -3, affinity: -2 } }, { conf: -2 }, { fatigue: 3 }] } ] },
      { id: 'drive', label: `Take the wheel and let {ally.first} sleep`, risk: 'low', result: `{ally.first} curls against the window and is out before the next mile marker. You drive the rest alone with the radio low, and the quiet is the kindest thing you can think of to give.`, effects: [{ rel: { who: 'ally', affinity: 5, trust: 2 } }, { fatigue: 7 }, { conf: 1 }] },
      { id: 'play', label: `Turn the trip into a game of trivia`, risk: 'low', result: `The game is invented on the spot, and the rules change whenever one of you is losing. By the time the hotel appears you are both hoarse and laughing, and no one remembers who won.`, effects: [{ rel: { who: 'ally', affinity: 6 } }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'headphones', label: `Put on headphones and rest your eyes`, risk: 'low', result: `The headphones go on and the miles pass in a haze of old songs. You arrive rested and a bit guilty, with the sense of a conversation that did not happen.`, effects: [{ fatigue: -7 }, { rel: { who: 'ally', affinity: -2 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'nf_trv_rival_gate', category: 'travel', title: `One Seat Left at {gate}`, weight: 2.5, cooldownDays: 160, maxPerCareer: 2, categoryCooldown: 6,
    cast: { rival: { pick: 'rivalry', minHeat: 15 } }, memory: { role: 'rival', max: 2 },
    slots: { gate: [`gate fourteen`, `the last departure board`, `the rebooking desk`, `the end of the terminal`], cause: [`a cancelled connection`, `an overbooked flight`, `a delayed crew`, `a missed transfer`] },
    body: [`After {cause}, the agent at the desk has one seat left on the last flight out, and {rival.name} is standing next to you holding the same boarding pass. The agent looks from one of you to the other and slowly puts down the pen.`, `The show is tomorrow, the airport is almost empty and the only other option is a bus that leaves at dawn. Neither of you has said a word since the announcement.`],
    choices: [
      { id: 'give', label: `Give {rival.first} the seat and take the bus`, risk: 'med', result: `{rival.first} stares at you for a long moment and says nothing, then takes the pass. You spend the night in a bus station and arrive for the show looking like a ghost, with something to hold over a rival who will not forget it.`, effects: [{ rel: { who: 'rival', respect: 8, trust: 3, heat: -6 } }, { fatigue: 12 }, { conf: 2 }] },
      { id: 'take', label: `Take the seat without ceremony`, risk: 'low', result: `You show the pass, thank the agent and board before {rival.first} can finish the sentence. The flight is smooth, the bed is soft, and the memory of that walk down the jetway sticks in your throat.`, effects: [{ fatigue: -4 }, { conf: 1 }, { rel: { who: 'rival', heat: 6, respect: -2 } }, { rivalry: { who: 'rival', heat: 4 } }] },
      { id: 'coin', label: `Suggest a coin flip`, risk: 'med', outcomes: [
        { weight: 1, text: `The coin spins, lands in your palm and shows the right side up. {rival.first} grunts, hands you the pen and gets directions to the bus station.`, effects: [{ fatigue: -4 }, { rel: { who: 'rival', respect: 3 } }, { conf: 2 }] },
        { weight: 1, text: `The coin lands the other way, and {rival.first} smirks as you head for the bus. You sleep against the window with a coat bunched under your head, and your pride takes a day to recover.`, effects: [{ fatigue: 10 }, { rel: { who: 'rival', respect: 3 } }, { conf: -1 }] } ] },
      { id: 'both', label: `Ask the agent to find any way to get both of you there`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, popularity: 0.3 }, text: `The agent types for ten minutes, makes a call and finds a regional connection with two seats in the last row. You and {rival.first} spend three hours side by side without a word, and arrive on time.`, effects: [{ rel: { who: 'rival', respect: 5, heat: -4 } }, { fatigue: 6 }, { conf: 3 }, { pop: 0.2 }] },
        { weight: 1, text: `The agent shakes their head and tells you to stop holding up the line. By the time you have finished arguing, the seat has gone to someone else.`, effects: [{ fatigue: 11 }, { conf: -3 }] } ] },
    ],
  },
  {
    id: 'nf_trv_stuck_overnight', category: 'travel', title: `Stranded After {cause}`, weight: 2, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 6,
    trigger: { stat: { fatigue: { gte: 40 } } },
    slots: { cause: [`a mechanical fault`, `a missing flight crew`, `a baggage system outage`, `a gate change that left half the roster behind`], place: [`a row of molded chairs`, `a carpeted corner by a closed coffee stand`, `a bench beside a huge window`] },
    body: [`The flight is gone after {cause} and the next one is at six, so you settle into {place} with a backpack for a pillow and a phone at eleven percent. The terminal is the colour of old tea, and the only sound is a floor polisher moving in slow arcs.`, `You have a show tomorrow that you do not want to arrive at tired. What you do with the next seven hours will decide a lot about how you look when the lights come on.`],
    choices: [
      { id: 'hotel', label: `Pay for a hotel room near the airport`, risk: 'low', requires: { stat: { money: { gte: 200 } } }, result: `A shuttle, a front desk and a bed with a firm mattress turn the night around. You pay more than you wanted and sleep better than you have all week.`, effects: [{ money: -180 }, { fatigue: -14 }, { conf: 1 }] },
      { id: 'sleep', label: `Sleep on the floor with your bag under your head`, risk: 'med', result: `The floor is hard, the lights hum and the cleaner steps over your feet twice. You get four broken hours and a story, and a kink in the neck that lasts into the match.`, effects: [{ fatigue: 3 }, { conf: 1 }, { pop: 0.1 }] },
      { id: 'walk', label: `Walk the terminal and train in the empty corridors`, risk: 'med', result: `You jog the length of the concourse, do mobility drills against a wall, and finish with a stretch in front of a vending machine. The tiredness lifts for a bit, and the exhaustion that replaces it is the honest kind.`, effects: [{ attr: { name: 'endurance', delta: 1 } }, { fatigue: 6 }, { conf: 2 }] },
      { id: 'call', label: `Call the office and ask for a later booking slot`, risk: 'med', result: `The scheduler agrees to move your match to the second half of the card, with the tone of someone doing you a favour. You sleep in the chair knowing it, and owe a small debt to a person you do not know.`, effects: [{ fatigue: -7 }, { pop: -0.2 }, { conf: 1 }] },
    ],
  },
  {
    id: 'nf_trv_customs', category: 'travel', title: `The Customs Officer's Questions`, weight: 1.5, cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 8,
    trigger: { stat: { careerYears: { gte: 1 }, matches: { gte: 20 } } },
    slots: { question: [`"And what exactly is your profession?"`, `"Why are you carrying a championship belt in a gym bag?"`, `"Could you explain these bruises?"`, `"Is this a costume or a uniform?"`], officer: [`a patient officer with a clipboard`, `a young officer on a very long shift`, `a stern officer who clearly dislikes surprises`] },
    body: [`At the border crossing, {officer} looks at your bag and then at you, and asks {question} Behind you, a line of tired passengers shifts their weight in unison.`, `Professional wrestling is the one job where an honest answer sounds like a lie. You have a few seconds to decide how much of the truth to put into it.`],
    choices: [
      { id: 'plain', label: `Answer plainly: you are a professional wrestler`, risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `The officer blinks, nods slowly and asks which side you are on. The line behind you gets an unexpected view of a very serious conversation about face versus heel, and you are waved through with a smile.`, effects: [{ conf: 2 }, { pop: 0.1 }, { fatigue: -1 }] },
        { weight: 1, text: `The officer's eyebrows climb and a second officer is called, and the bag is searched down to the seams. Forty minutes later you are released with an apology and a very rumpled costume.`, effects: [{ fatigue: 5 }, { conf: -1 }] } ] },
      { id: 'show', label: `Pull out the business card and a photo of the show`, risk: 'low', result: `The photograph of a sold-out arena settles things, and the officer asks if they can keep the card. A line of passengers watches you leave with a lingering mixture of envy and confusion.`, effects: [{ conf: 2 }, { pop: 0.2 }] },
      { id: 'perform', label: `Stay in character and give a full promo`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.5 }, text: `A dozen travellers applaud before you have finished the sentence, and the officer laughs despite every training rule. The story is retold at the hotel bar and then in the dressing room.`, effects: [{ pop: 0.7 }, { conf: 4 }, { fatigue: 2 }] },
        { weight: 1, text: `The promo lands badly in a place built for quiet, and the officer's face does not change at all. You are sent to a small room to wait, with plenty of time to think about your delivery.`, effects: [{ pop: -0.2 }, { conf: -4 }, { fatigue: 6 }] } ] },
      { id: 'vague', label: `Say you work in entertainment and leave it there`, risk: 'med', result: `The answer is vague enough to raise two more questions, and neither is easier than the first. You are through in ten minutes, with the lingering feeling of having been evasive for no reason.`, effects: [{ fatigue: 2 }, { conf: -1 }] },
    ],
  },
  {
    id: 'nf_trv_bus_possible', category: 'travel', title: `The Seat Next to {pal.first} on the Bus`, weight: 2, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 6,
    cast: { pal: { pick: 'tag', tag: 'alliance_possible' } }, memory: { role: 'pal', max: 2 },
    slots: { stretch: [`a six-hour stretch of the interstate`, `an overnight run across two states`, `the long leg between two small cities`], habit: [`has been rehearsing a pitch under {pal.their} breath`, `keeps a small notebook open on {pal.their} knee`, `has been watching you for most of the trip`] },
    body: [`On the bus, the only free seat for {stretch} is beside {pal.name}, who {habit}. There is a lot of respect between you, and neither of you has ever put a name on it.`, `A bus is the only place where two people can sit shoulder to shoulder without being seen to do so. If a partnership is ever going to start, it will probably start in a place like this.`],
    choices: [
      { id: 'pitch', label: `Pitch a partnership out loud`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, confidence: 0.3 }, text: `{pal.first} listens, thinks and turns the idea over with a few sharp objections. By the time the bus reaches the next stop, the two of you have the outline of a plan scratched onto the back of a boarding pass.`, effects: [{ rel: { who: 'pal', trust: 8, affinity: 6 } }, { tag: { who: 'pal', tag: 'ally' } }, { conf: 3 }] },
        { weight: 1, text: `{pal.first} says it is a lot to decide on a bus and goes to sleep, or pretends to. The remaining hours are spent in a courteous, strained silence.`, effects: [{ rel: { who: 'pal', trust: -2 } }, { conf: -3 }] } ] },
      { id: 'talk', label: `Talk about everything but the business`, risk: 'low', result: `The conversation drifts from food to family to the worst hotel either of you has ever slept in. By the end you have learned a few things that no contract could tell you.`, effects: [{ rel: { who: 'pal', affinity: 7, trust: 3 } }, { conf: 2 }, { fatigue: -2 }] },
      { id: 'sleep', label: `Take the window seat and sleep`, risk: 'low', result: `You are asleep before the first rest stop, with your head against cold glass. {pal.first} lets you sleep and keeps whatever they were about to say for another day.`, effects: [{ fatigue: -9 }, { conf: 1 }, { rel: { who: 'pal', affinity: -1 } }] },
      { id: 'test', label: `Ask {pal.first} for a favour first, to see how it goes`, risk: 'med', result: `The favour is small, a sandwich from the front of the bus, and {pal.first} brings it back with a raised eyebrow and a joke at your expense. It tells you almost everything you wanted to know.`, effects: [{ rel: { who: 'pal', trust: 3, respect: 2 } }, { conf: 1 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'nf_trv_gas_station_fan', category: 'travel', title: `Recognised at a Gas Station`, weight: 1.5, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 6,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 15 } } },
    slots: { hour: [`two in the morning`, `half past four`, `just after midnight`], item: [`a mug of terrible coffee`, `a bag of sunflower seeds`, `a shrink-wrapped sandwich`, `a pack of gum`] },
    body: [`It is {hour} at a gas station in the middle of nowhere when {fan.name} spots you holding {item}. {fan.first} stops dead at the end of the aisle, mouth slightly open, and a small cry escapes before manners take over.`, `You are tired, a long way from anywhere, and not exactly at your best. The fan clearly is not going to ask for much, and you have the feeling that this will be remembered much longer than you will remember the sandwich.`],
    choices: [
      { id: 'chat', label: `Chat for ten minutes by the pumps`, risk: 'low', result: `The conversation takes in the best match {fan.first} ever saw and the worst gas station in the state. When you drive away, the fan is still standing by the pumps waving with both hands.`, effects: [{ pop: 0.4 }, { conf: 3 }, { fatigue: 3 }] },
      { id: 'photo', label: `Take a quick selfie and move on`, risk: 'low', result: `The photograph is blurry and hurried, and so is the thank-you. It is fine, and it is forgettable, and you are back on the road in four minutes.`, effects: [{ pop: 0.2 }, { fatigue: 1 }] },
      { id: 'buy', label: `Buy {fan.first} a coffee and a hot dog`, risk: 'med', result: `The cashier's jaw drops, and the fan can barely hold the paper cup. The total is under eight dollars, and the story will go on a very long way.`, effects: [{ money: -8 }, { pop: 0.5 }, { conf: 3 }, { fatigue: 2 }] },
      { id: 'hide', label: `Pull your hood up and quietly leave`, risk: 'low', result: `You pay, nod once and go before another word can be said. It is a tired and cowardly choice that feels entirely reasonable until the next gas station.`, effects: [{ fatigue: -2 }, { conf: -2 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'nf_trv_vet_ride', category: 'travel', title: `A Seat in {vet.first}'s Car`, weight: 2, cooldownDays: 220, maxPerCareer: 2, categoryCooldown: 6,
    cast: { vet: { pick: 'tag', tag: 'respected_by' } }, memory: { role: 'vet', max: 1 },
    slots: { route: [`the overnight drive to the next town`, `the six-hour haul across the state`, `the late run back to the hotel after a short show`], rule: [`no radio, no phones and no talking about work`, `all the best driving songs in strict order`, `a pot of coffee, a thermos and a story for every exit`] },
    body: [`{vet.name} offers you a seat for {route}, on one condition: {rule}. It is an unspoken kind of invitation, the sort that tends to go to people who have earned it.`, `The wrestlers who spend a lot of hours in a car together end up knowing each other better than their families. The offer is generous, and so is the risk of finding out you are not quite the person you want to be.`],
    choices: [
      { id: 'ride', label: `Accept and keep to the rule`, risk: 'low', result: `The miles pass in a pleasant haze, and somewhere around the third hour {vet.first} starts to talk about the old days. You arrive with fewer questions than you started with, and some answers you did not ask for.`, effects: [{ rel: { who: 'vet', trust: 6, affinity: 5 } }, { fatigue: -3 }, { conf: 3 }] },
      { id: 'pick', label: `Use the drive to ask for career advice`, risk: 'med', result: `{vet.first} grips the wheel and answers every question in slow, deliberate fashion. The advice is useful, and the amount of attention you demand leaves the car quiet for the last hour.`, effects: [{ rel: { who: 'vet', respect: 4 } }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 4 }, { conf: 2 }] },
      { id: 'drive', label: `Offer to take the wheel for the second half`, risk: 'low', result: `{vet.first} hands over the keys after a moment's doubt, and sleeps better than in weeks. You drive in the dark with the heater and the radio hum, and the trust is almost visible.`, effects: [{ rel: { who: 'vet', trust: 7, affinity: 4 } }, { fatigue: 8 }, { conf: 2 }] },
      { id: 'decline', label: `Decline: you would rather travel alone`, risk: 'low', result: `{vet.first} says "suit yourself" without any bitterness. The solitude is calm, and the empty seat nags at you for several days.`, effects: [{ fatigue: -4 }, { rel: { who: 'vet', affinity: -2 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'nf_trv_betrayal_seat', category: 'travel', title: `Seat {row} Is Next to {former.first}`, weight: 2.5, cooldownDays: 220, maxPerCareer: 1, categoryCooldown: 6,
    cast: { former: { pick: 'tag', tag: 'betrayal' } }, memory: { role: 'former', max: 3 },
    slots: { row: [`14B`, `22C`, `9A`, `31D`], flight: [`a two-hour flight`, `a short hop with no snacks`, `a red-eye with turbulence`] },
    body: [`You find your seat on {flight}, and {former.name} is already in the next one. Neither of you has said a word since the gate, and the armrest between you suddenly feels like a border post.`, `Cabin air has a way of making old events feel closer, and a seatbelt sign is a poor excuse for a conversation. You can have the talk, avoid it or survive it.`],
    choices: [
      { id: 'speak', label: `Say what you have been wanting to say`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.3 }, text: `You keep your voice low and your words steady, and {former.first} listens until the landing gear drops. It does not heal anything, but for the first time it feels as though the thing can be spoken about.`, effects: [{ rel: { who: 'former', heat: -10, trust: 4, respect: 3 } }, { conf: 3 }, { fatigue: 3 }] },
        { weight: 1, text: `The words rise too fast, and a flight attendant has to ask you both to lower your voices. The rest of the flight is spent looking at separate windows.`, effects: [{ rel: { who: 'former', heat: 6 } }, { rivalry: { who: 'former', heat: 5 } }, { conf: -3 }, { fatigue: 3 }] } ] },
      { id: 'silent', label: `Say nothing and keep your eyes on the book in your lap`, risk: 'low', result: `You turn the same page eleven times and neither of you moves. At touchdown, the two of you leave in opposite directions, as if the aisle were two lanes.`, effects: [{ conf: -1 }, { fatigue: 2 }] },
      { id: 'swap', label: `Ask a stranger to swap seats with you`, risk: 'low', result: `A cheerful retiree in 19A is delighted to move forward and tells you about her grandchildren for ninety minutes. The distance is welcome, and the avoidance is easy to read.`, effects: [{ fatigue: -3 }, { rel: { who: 'former', respect: -1 } }, { conf: -1 }] },
      { id: 'offer', label: `Offer the window seat and a bag of snacks`, risk: 'med', result: `The gesture is small, sudden and impossible to misread, and {former.first} accepts it with a short nod. It is not peace, but a smaller version of it, to be carried for a while.`, effects: [{ rel: { who: 'former', heat: -5, respect: 2 } }, { conf: 1 }, { fatigue: 1 }] },
    ],
  },
  // ======================= INJURY =======================
  {
    id: 'nf_inj_rival_visit', category: 'injury', title: `{rival.first} Turns Up at Your Door`, weight: 2.5, cooldownDays: 180, maxPerCareer: 2, categoryCooldown: 8,
    cast: { rival: { pick: 'rivalry', minHeat: 15 } }, memory: { role: 'rival', max: 2, noResults: true },
    trigger: { injured: true },
    slots: { place: [`your hospital room`, `the front step of your hotel`, `the physiotherapy waiting area`, `the corridor outside the doctor's office`], gift: [`a bag of oranges`, `a deck of cards`, `a tin of overpriced biscuits`, `nothing at all but a stiff nod`] },
    body: [`You are not expecting company when {rival.name} appears in {place} holding {gift}. The pair of you stare at each other like two people who have been caught dancing.`, `Whatever your history is, the two of you also share a profession, and the same body parts break in the same way. {rival.first} looks at the brace on your leg and then at the window.`],
    choices: [
      { id: 'accept', label: `Accept the visit and let {rival.first} stay`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `{rival.first} sits on the edge of a chair and tells you, in short sentences, about a long injury of {rival.their} own. By the end, the room feels a little less like a ward and a little more like two people on a bench.`, effects: [{ rel: { who: 'rival', respect: 6, heat: -8, trust: 3 } }, { rivalry: { who: 'rival', heat: -4 } }, { conf: 3 }, { fatigue: -2 }] },
        { weight: 1, text: `The conversation does not take, and {rival.first} leaves after ten minutes with the flat politeness of a person who feels shown the door. You are alone again with the ceiling tiles.`, effects: [{ rel: { who: 'rival', trust: -1 } }, { conf: -2 }] } ] },
      { id: 'cold', label: `Tell {rival.first} to leave the oranges and go`, risk: 'low', result: `The words are unkind and sound worse in the quiet room. {rival.first} puts the oranges on the table anyway, a small gesture in a silent doorway, and you eat them later in secret.`, effects: [{ rel: { who: 'rival', heat: 5, respect: 2 } }, { conf: -1 }, { fatigue: -1 }] },
      { id: 'quip', label: `Make a joke that is about half as cruel as usual`, risk: 'med', result: `{rival.first} actually laughs, a short surprised bark, and fires back with something worse. The exchange is nearly a friendship and nearly a feud, and you cannot tell which.`, effects: [{ rel: { who: 'rival', respect: 3, heat: -2 } }, { conf: 2 }, { pop: 0.1 }] },
      { id: 'use', label: `Hint that the visit might make a good storyline`, risk: 'high', result: `The remark hits a nerve, and {rival.first} leaves with a look that closes a door. The idea is clever and entirely cynical, and neither of you will forget how fast you made it.`, effects: [{ rivalry: { who: 'rival', heat: 8 } }, { rel: { who: 'rival', trust: -6, heat: 6 } }, { pop: 0.5 }, { conf: 1 }] },
    ],
  },
  {
    id: 'nf_inj_ally_vigil', category: 'injury', title: `{ally.first} Brings Dinner and Stays`, weight: 2.5, cooldownDays: 180, maxPerCareer: 2, categoryCooldown: 8,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 2 },
    trigger: { injured: true },
    slots: { meal: [`a bag of takeout noodles`, `a casserole in a borrowed dish`, `a pizza still too hot to hold`, `a thermos of soup`], habit: [`stacks your dishes without being asked`, `reads the label on every pill bottle aloud`, `fusses with the pillows until you give up`] },
    body: [`{ally.name} turns up at your door with {meal} and the settled look of someone who has no plan to leave. {ally.first} {habit}, and you have not the energy to object.`, `Being hurt is mostly boring, and a little frightening in the evenings. Having company turns the same four walls into a different room.`],
    choices: [
      { id: 'open', label: `Tell {ally.first} how scared you are about the injury`, risk: 'low', result: `You say it in a flat voice, looking at the carpet, and {ally.first} does not try to fix it. The silence that follows is the first comfortable one in days.`, effects: [{ rel: { who: 'ally', trust: 8, affinity: 7 } }, { conf: -1 }, { fatigue: -3 }] },
      { id: 'jokes', label: `Keep things light and talk about anything else`, risk: 'low', result: `Three hours of bad jokes and a long argument about the greatest finish ever make the evening disappear. It is not a deep conversation, and it is exactly what the evening needed.`, effects: [{ rel: { who: 'ally', affinity: 6 } }, { conf: 2 }, { fatigue: -2 }] },
      { id: 'send', label: `Send {ally.first} home: you do not want to be a burden`, risk: 'med', result: `{ally.first} goes after a long pause and leaves the casserole behind. The apartment is quiet, tidy and unfairly lonely, and pride tastes like cold food.`, effects: [{ rel: { who: 'ally', affinity: -3, trust: -1 } }, { conf: -2 }, { fatigue: -2 }] },
      { id: 'plan', label: `Test your comeback plan against {ally.first}'s doubts`, risk: 'med', result: `The two of you draw timelines on the back of a pizza box, and {ally.first} spots the one weak assumption you had skipped over. You go to bed with a rough but honest plan.`, effects: [{ rel: { who: 'ally', trust: 4, respect: 3 } }, { attr: { name: 'psychology', delta: 1 } }, { conf: 2 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'nf_inj_second_opinion', category: 'injury', title: `Is There a Second Opinion?`, weight: 2, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 8,
    cast: { doctor: { pick: 'staff', role: 'doctor' } },
    trigger: { injured: true },
    slots: { verdict: [`a long recovery with no shortcuts`, `surgery as the safe option`, `no ring work until the swelling is gone`], source: [`a friend who works in a clinic`, `a veteran who swears by one surgeon`, `a stranger on a forum`] },
    body: [`{doctor.name} reads out the verdict in a level voice: {verdict}. It is thorough and sensible, and it arrives a long way from the outcome you had in mind.`, `Later, {source} suggests that there is another specialist who may see it differently. There is risk both in asking and in not asking.`],
    choices: [
      { id: 'trust', label: `Trust {doctor.first} and follow the plan`, risk: 'low', result: `The plan is dull, exact and marked on a calendar on the fridge. You hate every minute of it and miss no step, which turns out to be most of the cure.`, effects: [{ fatigue: -8 }, { conf: 1 }, { pop: -0.1 }] },
      { id: 'second', label: `Book a second opinion at your own expense`, risk: 'med', requires: { stat: { money: { gte: 700 } } }, outcomes: [
        { weight: 2, bonus: { confidence: 0.3 }, text: `The second specialist agrees with the first on almost everything and disagrees on one detail that matters. You walk out with a sharper plan and a bill for several hundred dollars.`, effects: [{ money: -650 }, { conf: 3 }, { fatigue: 2 }] },
        { weight: 1, text: `The second opinion is almost word for word the first one, and quite a lot more expensive. You come home slightly poorer and entirely more confident in your own doctor.`, effects: [{ money: -650 }, { conf: 1 }, { fatigue: 2 }] } ] },
      { id: 'ask_office', label: `Ask the office to pay for the specialist`, risk: 'med', outcomes: [
        { weight: 1, bonus: { popularity: 0.4 }, text: `The office approves the cost with a sigh and a note in your file about being high maintenance. You get the second opinion for free and a slightly colder reception at the next meeting.`, effects: [{ conf: 2 }, { pop: -0.1 }, { fatigue: 2 }] },
        { weight: 1, text: `The request disappears into a pile of forms and a month goes by in silence. When the answer comes it is no, and you are exactly where you started.`, effects: [{ conf: -2 }, { fatigue: 3 }] } ] },
      { id: 'forum', label: `Take the forum's advice and try a faster fix`, risk: 'high', outcomes: [
        { weight: 1, text: `The fix works, to everyone's surprise, and the recovery shaves off a week. You feel like the cleverest person in the building for about a day.`, effects: [{ conf: 3 }, { fatigue: 4 }] },
        { weight: 2, text: `The fix aggravates the problem, and {doctor.first} has to undo the damage. You spend a longer time off than you started with, and a shorter time believing in forums.`, effects: [{ conf: -4 }, { fatigue: 6 }, { injury: { part: 'torso', severity: 1, days: 10 } }] } ] },
    ],
  },
  {
    id: 'nf_inj_near_miss', category: 'injury', title: `A Spot That Almost Went Wrong`, weight: 2, contexts: ['post_match'], cooldownDays: 140, maxPerCareer: 3, categoryCooldown: 8,
    cast: { pal: { pick: 'tag', tag: 'ally' } }, memory: { role: 'pal', max: 1 },
    trigger: { injured: false, stat: { fatigue: { gte: 45 } } },
    slots: { spot: [`a dive from the middle rope`, `a back suplex on the apron`, `a high-angle slam`, `a sunset flip off the ropes`], sign: [`your hands will not stop shaking`, `you cannot remember the last ten seconds`, `the ringside doctor is already waiting`] },
    body: [`{spot} went wrong tonight by an inch, and the only reason it did not become something worse was how fast {pal.name} reacted. At the curtain, {sign}.`, `Every wrestler has one night like this, and some have several. The body is trying to tell you something, and the schedule is trying to tell you something else.`],
    choices: [
      { id: 'tell', label: `Tell the doctor and the agent exactly what happened`, risk: 'low', result: `The doctor checks your neck and eyes, makes a note and suggests a lighter week. It is a dull and responsible conversation that may have saved a year of your career.`, effects: [{ fatigue: -9 }, { conf: 1 }, { pop: -0.2 }] },
      { id: 'thank', label: `Thank {pal.first} and ask to take that spot out of the match`, risk: 'low', result: `{pal.first} says "I would rather lose the spot than a friend" and rewrites the finish on a napkin. The match is shorter, quieter and safer, and the crowd does not notice.`, effects: [{ rel: { who: 'pal', trust: 6, affinity: 5 } }, { conf: 2 }, { pop: -0.1 }] },
      { id: 'repeat', label: `Do the same spot again tomorrow to prove it was a fluke`, risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.4, overall: 0.3 }, text: `The spot hits clean and the crowd erupts, and your pulse takes an hour to settle. The point is made and the nerves are shot.`, effects: [{ pop: 0.5 }, { conf: 4 }, { fatigue: 7 }] },
        { weight: 1, text: `The spot goes wrong again, in a different way, and you land with an ugly sound that echoes in the cheap seats. The match stops and you walk to the back with a hand over your ribs.`, effects: [{ conf: -5 }, { fatigue: 7 }, { injury: { part: 'torso', severity: 1, days: 12 } }] } ] },
      { id: 'say_nothing', label: `Say nothing and shake it off`, risk: 'med', result: `The night passes as if nothing happened, and the next day too. A dull ache grows in the shoulder over a week, and nobody knows why you have started to wince.`, effects: [{ fatigue: 6 }, { conf: -1 }, { rel: { who: 'pal', trust: -2 } }] },
    ],
  },
  {
    id: 'nf_inj_flowers', category: 'injury', title: `Flowers from {target.first}`, weight: 2, cooldownDays: 200, maxPerCareer: 1, categoryCooldown: 8,
    cast: { target: { pick: 'tag', tag: 'insulted_by' } }, memory: { role: 'target', max: 2 },
    trigger: { injured: true },
    slots: { arrangement: [`a stiff bunch of carnations`, `a cheap balloon with a bear on it`, `a basket of fruit that is slightly overripe`, `a handwritten card with no flowers at all`], card: [`"Get better. Then we can finish this."`, `"I heard. Rest."`, `"Nothing personal. Heal up."`] },
    body: [`The package that arrives at your door contains {arrangement}, with a card that reads {card} The handwriting is {target.name}'s, and nothing else about it is warm or cold.`, `The things you said about {target.them} are still on the record. This could be a gentle olive branch, or the setup to a long game, or just two professionals acknowledging that bodies fail.`],
    choices: [
      { id: 'reply', label: `Write back a short, honest note`, risk: 'low', result: `You write three lines and put it in the post before you can fix them. {target.first} reads it standing up in a hotel hallway, and the next time you meet there is a pause where a punch used to be.`, effects: [{ rel: { who: 'target', heat: -8, respect: 4, trust: 3 } }, { conf: 2 }] },
      { id: 'public', label: `Post a photo of the gift with a gracious caption`, risk: 'med', result: `The picture does well, and so does the comment section's verdict on who looks classier. {target.first} is not at all pleased to have been put on display, even in a good light.`, effects: [{ pop: 0.5 }, { rel: { who: 'target', trust: -3, heat: 2 } }, { conf: 1 }] },
      { id: 'ignore', label: `Put the gift on a shelf and say nothing`, risk: 'low', result: `The flowers wilt, the card falls behind the radiator and the weeks go by. No one is angry, and nothing changes, which is its own kind of answer.`, effects: [{ fatigue: -2 }, { conf: 0 }] },
      { id: 'taunt', label: `Send the gift back with a scornful line`, risk: 'high', result: `The parcel is returned unopened and the line is delivered in black marker. {target.first} receives it with perfect stillness, and the feud sharpens like a pencil.`, effects: [{ rivalry: { who: 'target', heat: 10 } }, { rel: { who: 'target', heat: 8, respect: -3 } }, { pop: 0.3 }, { conf: 2 }] },
    ],
  },
  {
    id: 'nf_inj_pushing_through', category: 'injury', title: `The Doctor's Offer`, weight: 2, cooldownDays: 160, maxPerCareer: 3, categoryCooldown: 8,
    cast: { doctor: { pick: 'staff', role: 'doctor' } },
    trigger: { injured: true, serious: false },
    slots: { when: [`a title match on the card tonight`, `a sold-out house show only hours away`, `the biggest crowd of the month already arriving`], offer: [`a cortisone shot that will carry you through the match`, `a heavier brace and permission to work`, `a taping job that looks like armor`] },
    body: [`With {when}, {doctor.name} offers a way to get you through it: {offer}. The offer is cautious and technically allowed, and the doctor's face makes it plain that it is also not a good idea.`, `The injury is the sort that heals if you leave it alone, and the show is the sort that happens once. Half the locker room would take the offer without thinking, and half of them are limping.`],
    choices: [
      { id: 'work', label: `Take the offer and work the match`, risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.4, overall: 0.3 }, text: `The match goes ahead and you ignore the dull throb until the finish. The crowd never knows how close it came to being a worse night, and you collapse in the back with an ice pack.`, effects: [{ pop: 0.8 }, { conf: 3 }, { fatigue: 12 }] },
        { weight: 1, text: `The first hard bump makes the whole joint flare, and you finish on instinct and spite. The recovery takes days longer than it should have.`, effects: [{ pop: 0.2 }, { conf: -3 }, { fatigue: 14 }, { injury: { part: 'legs', severity: 1, days: 10 } }] } ] },
      { id: 'refuse', label: `Refuse and sit the match out`, risk: 'low', result: `The announcement of your absence is met with a groan and a quiet nod from the staff. You watch from a monitor and heal on schedule, a little restless.`, effects: [{ fatigue: -8 }, { pop: -0.4 }, { conf: 1 }] },
      { id: 'promo', label: `Ask the office for a promo in place of a match`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.4 }, text: `The segment replaces the match, and your voice carries a hurt-man edge that is better than anything you wrote. The crowd holds its breath for ninety seconds.`, effects: [{ pop: 0.7 }, { conf: 3 }, { mic: 1 }, { fatigue: 3 }] },
        { weight: 1, text: `The segment lacks a hook and the crowd goes to the concession stands. It is filler, and you know it, and the office is far too polite to say it aloud.`, effects: [{ pop: -0.2 }, { conf: -2 }, { fatigue: 3 }] } ] },
      { id: 'half', label: `Work a short match with the doctor at ringside`, risk: 'med', result: `The match runs six minutes with a doctor in a folding chair near the barricade. It is a compromise that keeps a card intact, and the crowd takes it as part of the story.`, effects: [{ pop: 0.3 }, { fatigue: 6 }, { conf: 1 }] },
    ],
  },
  {
    id: 'nf_inj_fan_cards', category: 'injury', title: `A Bag of Get-Well Cards`, weight: 1.5, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 8,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { injured: true, stat: { popularity: { gte: 20 } } },
    slots: { delivery: [`a canvas mailbag left on the doorstep`, `a courier with a signature form`, `a shoebox handed over at the physio clinic`], drawing: [`a crayon portrait with an alarming number of arms`, `a card made from a pizza box`, `a poem about your knee`] },
    body: [`{delivery} brings a stack of cards organised by {fan.name}, who has collected them from a fan club and from a few schools. On top is {drawing}.`, `You read them slowly in a chair because you cannot do much else. Some of them are funny, some of them are heartbreaking, and a surprising number are signed by people who have never been to a show.`],
    choices: [
      { id: 'reply_all', label: `Spend a few days writing back to every card`, risk: 'low', result: `Your handwriting is awful and the stamps are costly, but each envelope gets a line of its own. By the end of the week you have a cramped hand and the unusual feeling of having been useful.`, effects: [{ pop: 0.5 }, { money: -90 }, { conf: 3 }, { fatigue: 2 }] },
      { id: 'video', label: `Record one thank-you video for everyone`, risk: 'low', result: `The video is two minutes of you in a hospital gown making a face at the camera, and it does the rounds in the fan group. It is warm, quick and faintly silly.`, effects: [{ pop: 0.4 }, { conf: 2 }] },
      { id: 'pin', label: `Pin the cards to the wall where the physio can see them`, risk: 'low', result: `The wall becomes a patchwork of crayon and glitter, and the physiotherapist starts reading them aloud during the hardest exercises. It makes the reps feel less lonely and a lot more ridiculous.`, effects: [{ conf: 4 }, { fatigue: -2 }, { pop: 0.1 }] },
      { id: 'private', label: `Keep the cards private and answer none of them`, risk: 'low', result: `You read every one, put them in a drawer and say nothing. The silence is not unkind, but a handful of the people who wrote will never know that anyone read their words.`, effects: [{ conf: 1 }, { fatigue: -3 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'nf_inj_betrayal_message', category: 'injury', title: `A Message from {former.first}`, weight: 2.5, cooldownDays: 220, maxPerCareer: 1, categoryCooldown: 8,
    cast: { former: { pick: 'tag', tag: 'betrayal' } }, memory: { role: 'former', max: 3 },
    trigger: { injured: true },
    slots: { form: [`a voicemail that lasts eleven seconds`, `a letter in an unfamiliar envelope`, `a short email with no subject line`, `a message passed on by a mutual friend`], line: [`"I am sorry you are hurt."`, `"I heard what happened. I hope it is not as bad as they say."`, `"Whatever else is true, I wish you well."`] },
    body: [`{form} arrives from {former.name}, and the whole text is {line} You read it twice, then put the phone face down on the table.`, `The two of you have a history that neither can do much to repair. A short message is also the sort of thing people send when they are afraid of sending a long one.`],
    choices: [
      { id: 'answer', label: `Write back and keep it civil`, risk: 'med', result: `Your answer is two lines and costs you an hour. {former.first} receives it within the day, and the silence that follows is warmer than the one that came before.`, effects: [{ rel: { who: 'former', heat: -6, trust: 3 } }, { conf: 1 }, { fatigue: 1 }] },
      { id: 'call', label: `Call {former.first} and talk it through`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.3 }, text: `The call lasts an hour, with long pauses and two bad jokes, and by the end you have agreed that nothing will be decided today. It is the longest conversation the two of you have had in a year.`, effects: [{ rel: { who: 'former', trust: 7, heat: -10, respect: 4 } }, { conf: 3 }, { fatigue: 2 }] },
        { weight: 1, text: `The call turns back to old accusations in under four minutes, and ends with a click. You spend the rest of the evening staring at the ceiling and feeling worse than before.`, effects: [{ rel: { who: 'former', heat: 7 } }, { conf: -4 }, { fatigue: 2 }] } ] },
      { id: 'ignore', label: `Leave the message unanswered`, risk: 'low', result: `The phone stays on the table and the message stays unread, and the day blurs into the next. The days pile up and make an answer from you harder, not easier.`, effects: [{ conf: -1 }, { fatigue: -2 }] },
      { id: 'forward', label: `Forward the message to the office as evidence`, risk: 'high', result: `The office notes it without much interest, and the rumour mill takes it up with more. When {former.first} hears who passed it on, the last thread of the relationship goes taut.`, effects: [{ rel: { who: 'former', trust: -8, heat: 8 } }, { rivalry: { who: 'former', heat: 6 } }, { conf: -1 }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'nf_inj_vet_surgery', category: 'injury', title: `{vet.first} Tells You About the Surgery`, weight: 2, cooldownDays: 220, maxPerCareer: 2, categoryCooldown: 8,
    cast: { vet: { pick: 'tag', tag: 'respected_by' } }, memory: { role: 'vet', max: 1 },
    trigger: { injured: true },
    slots: { place: [`the seat beside your hospital bed`, `a folding chair at the foot of your couch`, `the end of your hotel bed`, `a waiting room with bad magazines`], story: [`how a bad fall once cost a full year`, `how the first week of rehab was the hardest`, `how the fear came back long after the pain`] },
    body: [`{vet.name} sits in {place} and, for the first time since you met, talks about {story}. The details are plain and clinical, and the pauses are long.`, `Few people in the business admit these things aloud, and fewer still to someone younger. You are being let in on a thing that was never meant to be told.`],
    choices: [
      { id: 'listen', label: `Listen without interrupting`, risk: 'low', result: `You hear the story to the end, nodding at the right moments. When {vet.first} stops, the room is a different temperature, and you feel less alone in the middle of it.`, effects: [{ rel: { who: 'vet', trust: 7, affinity: 5 } }, { conf: 3 }, { fatigue: -2 }] },
      { id: 'questions', label: `Ask the hard questions about what happens next`, risk: 'med', result: `{vet.first} answers every one without flinching, including the ones about the fear and the money. By the end you have a better map of the road and a keener sense of how long it is.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { rel: { who: 'vet', respect: 4 } }, { conf: 1 }, { fatigue: 2 }] },
      { id: 'share', label: `Share your own worst fear in return`, risk: 'med', result: `You say the thing you have not said to anyone, and the room stays still. {vet.first} does not fix it, only nods, and the nodding is the most useful thing that has happened all week.`, effects: [{ rel: { who: 'vet', trust: 8, affinity: 6 } }, { conf: 2 }, { fatigue: 1 }] },
      { id: 'deflect', label: `Make a joke and steer the talk to something lighter`, risk: 'low', result: `The joke lands, mostly, and {vet.first} follows the new subject without comment. The unspoken conversation sits in the room like a third guest.`, effects: [{ conf: 1 }, { rel: { who: 'vet', affinity: 1 } }, { fatigue: -1 }] },
    ],
  },
  // ======================= RECOVERY =======================
  {
    id: 'nf_rec_first_milestone', category: 'recovery', title: `The First Small Thing You Can Do Again`, weight: 2.5, cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 8,
    cast: { trainer: { pick: 'staff', role: 'trainer' } },
    trigger: { injured: true, serious: false },
    slots: { milestone: [`taking the stairs without the rail`, `lifting a full kettle with the bad arm`, `jogging one slow lap of the car park`, `turning your head without wincing`], setting: [`a quiet rehab room with a mirror`, `a corridor outside the physio suite`, `the ring, empty and lit by a single bulb`] },
    body: [`In {setting}, you manage {milestone} for the first time since the injury, and {trainer.name} is the only witness. The trainer writes something in the notebook, looks at it, and does not tell you what it is.`, `Recovery is mostly an absence of events, so the first real one lands like a trumpet. The body is offering proof that it will come back, and the question is how much of it to believe.`],
    choices: [
      { id: 'celebrate', label: `Take the rest of the day off and celebrate`, risk: 'low', result: `You buy a slice of cake and eat it in the car with the engine off. The small joy is worth more than the sugar, and the body, rested, keeps its promise.`, effects: [{ conf: 4 }, { fatigue: -6 }, { money: -12 }] },
      { id: 'push', label: `Test it again, harder, right now`, risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `The second try is better than the first, and the third is better than the second. {trainer.first} lets you go three rounds before taking the notebook out of your hand.`, effects: [{ conf: 4 }, { fatigue: 6 }, { attr: { name: 'endurance', delta: 1 } }] },
        { weight: 1, text: `The second try is a mistake that your body answers with a sharp, short warning. {trainer.first} gives you a look that says everything and adds three days to the plan.`, effects: [{ conf: -3 }, { fatigue: 6 }] } ] },
      { id: 'tell', label: `Ask {trainer.first} what the notebook says`, risk: 'low', result: `{trainer.first} reads it aloud, and the numbers are better than you feared and worse than you hoped. The honest answer is a good anchor for the next week.`, effects: [{ conf: 2 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 1 }] },
      { id: 'quiet', label: `Keep the milestone to yourself`, risk: 'low', result: `You do not tell anyone, partly from superstition and partly from a fear of being rushed. The secret is a private pleasure for a week, and then the agent notices anyway.`, effects: [{ conf: 2 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'nf_rec_pool_session', category: 'recovery', title: `{ally.first} Drags You to the Pool`, weight: 2.5, cooldownDays: 180, maxPerCareer: 2, categoryCooldown: 8,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 2 },
    trigger: { injured: true },
    slots: { place: [`a public pool with a lap lane`, `a hotel pool at six in the morning`, `a hydrotherapy tank in a clinic basement`, `the shallow end of a motel pool`], plan: [`insists on a routine of slow laps`, `announces a game of water polo`, `has brought a stopwatch and a whistle`] },
    body: [`{ally.name} turns up at your door with two towels and no discussion, and by nine the two of you are in {place}. {ally.first} {plan}, and you are too tired to resist.`, `Water is kind to the injured and cruel to the vain, and you spend a lot of the first lap thinking about the first. By the second, the weight in your chest is lighter and the swim has become an apology to your body.`],
    choices: [
      { id: 'laps', label: `Do the full set of slow laps`, risk: 'low', result: `Forty minutes of steady strokes loosen the joint more than any massage did. You haul yourself out dripping, tired and a little proud.`, effects: [{ fatigue: 4 }, { conf: 3 }, { rel: { who: 'ally', respect: 3 } }, { attr: { name: 'endurance', delta: 1 } }] },
      { id: 'game', label: `Turn the session into a ridiculous contest`, risk: 'med', result: `The contest involves a foam noodle, a made-up scoring system and two lifeguards who keep blowing a whistle. You laugh until the injured part aches, and it is the happiest you have been in weeks.`, effects: [{ rel: { who: 'ally', affinity: 7 } }, { conf: 3 }, { fatigue: 6 }] },
      { id: 'float', label: `Float on your back and talk`, risk: 'low', result: `The two of you drift in the deep end and talk about everything that the rest of the world has no patience for. When you get out your fingers are wrinkled, and your head is clear for the first time.`, effects: [{ rel: { who: 'ally', trust: 6, affinity: 4 } }, { conf: 2 }, { fatigue: -4 }] },
      { id: 'skip', label: `Skip it and say you are too sore`, risk: 'med', result: `{ally.first} accepts it with a small shrug and goes in alone. You sit on a plastic chair at the edge, watching someone else do the thing you need to do.`, effects: [{ fatigue: -3 }, { rel: { who: 'ally', affinity: -3 } }, { conf: -2 }] },
    ],
  },
  {
    id: 'nf_rec_steam_truce', category: 'recovery', title: `A Truce in the Steam Room`, weight: 2.5, contexts: ['weekly', 'show_day', 'post_show'], cooldownDays: 160, maxPerCareer: 2, categoryCooldown: 8,
    cast: { rival: { pick: 'rivalry', minHeat: 15 } }, memory: { role: 'rival', max: 1, noResults: true },
    trigger: { stat: { fatigue: { gte: 55 } } },
    slots: { place: [`the steam room of a hotel gym`, `the sauna in the arena basement`, `a communal ice bath behind the dressing rooms`, `a hot tub in a motel courtyard`], state: [`both of you are too worn out to scowl`, `neither of you has the energy to start the usual routine`, `there is nowhere else to sit and nobody to see`] },
    body: [`You are in {place} when {rival.name} walks in and sits across from you, and {state}. For a while the only noise is the hiss of the vents and the two of you pretending not to notice.`, `The feud sits between you like a third person who also needs the heat. A building that holds this much tiredness has no room for anything but honesty.`],
    choices: [
      { id: 'truce', label: `Call a truce until you are both dry`, risk: 'low', result: `{rival.first} lifts one finger in agreement and shuts both eyes. The silence is companionable, and for twenty minutes you are two bruised people sharing a bench.`, effects: [{ rel: { who: 'rival', respect: 5, heat: -6 } }, { fatigue: -9 }, { conf: 1 }] },
      { id: 'talk', label: `Say something honest about the toll of the feud`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, confidence: 0.3 }, text: `You say you are tired of being cruel for a living, and {rival.first} says the same thing back in nearly the same words. Neither of you pretends it changes the show, and both of you leave lighter.`, effects: [{ rel: { who: 'rival', trust: 6, respect: 4, heat: -8 } }, { rivalry: { who: 'rival', heat: -5 } }, { conf: 3 }, { fatigue: -5 }] },
        { weight: 1, text: `The honesty comes out as a complaint, and {rival.first} bristles at being cast as the source of it. You walk out into the cooler air with an unwelcome sense of having started something.`, effects: [{ rel: { who: 'rival', heat: 5 } }, { conf: -2 }, { fatigue: -2 }] } ] },
      { id: 'jab', label: `Needle {rival.first} anyway, for the sake of the work`, risk: 'med', result: `The jab is delivered with the languor of a person in a bath, and {rival.first} answers with something worse and funnier. The feud is warmed, if not softened, and the pair of you leave grinning.`, effects: [{ rivalry: { who: 'rival', heat: 5 } }, { rel: { who: 'rival', respect: 3 } }, { pop: 0.2 }, { fatigue: -3 }] },
      { id: 'leave', label: `Get out after five minutes and stretch somewhere else`, risk: 'low', result: `You mumble an excuse and go, and the cold air of the corridor hits like a slap. Your body rests less than it could have, and the feud stays exactly as it was.`, effects: [{ fatigue: -4 }, { conf: 0 }] },
    ],
  },
  {
    id: 'nf_rec_first_bump', category: 'recovery', title: `The First Bump in the Training Ring`, weight: 2.5, contexts: ['weekly', 'show_day'], cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 8,
    cast: { coach: { pick: 'staff', role: 'coach' } },
    trigger: { injured: false, stat: { injuries: { gte: 1 } }, daysSince: { match: { gte: 20 } } },
    slots: { bump: [`a flat back bump`, `a short fall to the apron`, `a simple shoulder roll`, `a front-facing slam`], mood: [`the mat feels far too hard`, `the ropes feel too tight`, `the air is oddly quiet`] },
    body: [`The clinic has cleared you, the schedule has not, and {coach.name} stands in the empty training ring with a clipboard and a polite smile. The first thing on the list is {bump}, and {mood}.`, `You have fallen hundreds of times, and none of the earlier falls prepares you for this one. The body remembers every detail of the last bad landing.`],
    choices: [
      { id: 'slow', label: `Take it in slow motion, three times`, risk: 'low', result: `The slow falls are ugly and exact, and {coach.first} counts out each one. By the third the fear is a smaller thing than it was, and the mat is just a mat again.`, effects: [{ conf: 3 }, { fatigue: 4 }, { attr: { name: 'toughness', delta: 1 } }] },
      { id: 'full', label: `Go full speed on the first try`, risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.5, overall: 0.3 }, text: `You fall clean, bounce up and land the sort of laugh that clears a room of worry. {coach.first} writes "cleared" in a bold hand.`, effects: [{ conf: 5 }, { fatigue: 5 }, { pop: 0.2 }] },
        { weight: 1, text: `The landing is a fraction off and the old injury flares with a loud, familiar complaint. {coach.first} winces first and helps you up second.`, effects: [{ conf: -4 }, { fatigue: 7 }, { injury: { part: 'torso', severity: 1, days: 7 } }] } ] },
      { id: 'ask', label: `Ask {coach.first} to talk through what the body might do`, risk: 'low', result: `The talk takes half an hour and a lot of coffee, and ends with a checklist taped to the wall. It does not make the fall easier, but it makes it a plan.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { conf: 2 }, { fatigue: 1 }] },
      { id: 'delay', label: `Ask to postpone until tomorrow`, risk: 'med', result: `{coach.first} agrees without a flicker. The postponement costs you nothing and buys a night's worth of dread, which turns out to be the more expensive of the two.`, effects: [{ conf: -2 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'nf_rec_scars', category: 'recovery', title: `A Writer Asks About the Scars`, weight: 2, cooldownDays: 300, maxPerCareer: 1, categoryCooldown: 8,
    cast: { journalist: { pick: 'media', kind: 'journalist' } },
    trigger: { injured: false, stat: { injuries: { gte: 2 }, popularity: { gte: 20 } } },
    slots: { angle: [`the cost of each stitch`, `the bargain nobody tells rookies about`, `what the body keeps a record of`], place: [`a quiet corner of the lobby`, `a table in the catering room`, `the doorway of the training room`] },
    body: [`{journalist.name} corners you in {place} with a recorder and a feature in mind about {angle}. The first question is about a scar on your arm that has been visible in photographs for a year.`, `Interest in injuries is a mixture of sympathy and appetite. It can build a legend or sell you short, and the difference is in how you tell the story.`],
    choices: [
      { id: 'honest', label: `Tell the real story, including the ugly parts`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, mic: 0.3 }, text: `The story is told in plain words and long pauses, and {journalist.first} stops the recorder once to give you a glass of water. The feature runs as the best piece anyone has written about you.`, effects: [{ pop: 0.9 }, { conf: 3 }, { event: { type: 'interview', participants: ['journalist'], summary: 'Told the honest story of the scars to a feature writer.', importance: 3, data: { quality: { base: 68, mic: 0.4, charisma: 0.4 } } } }] },
        { weight: 1, text: `The telling gets away from you and runs to nineteen minutes of rambling and one overshare. The final cut is fair and a little too raw, and the dressing room reads it in silence.`, effects: [{ pop: 0.2 }, { conf: -3 }] } ] },
      { id: 'legend', label: `Dress the story up as a legend`, risk: 'med', result: `The version you give has a better fall, a longer scream and a sunnier ending than the facts support. It reads beautifully, and you feel the small weight of every embellishment.`, effects: [{ pop: 0.6 }, { conf: 1 }, { charisma: 1 }] },
      { id: 'deflect', label: `Deflect with humour and change the subject`, risk: 'low', result: `The jokes keep the interview upbeat and shallow, and {journalist.first} wraps it up with a polite bow. The piece is light, and does no harm and no particular good.`, effects: [{ pop: 0.2 }, { conf: 1 }] },
      { id: 'refuse', label: `Decline to discuss the injuries at all`, risk: 'low', result: `You say the scars are your business and nobody else's, and {journalist.first} puts the recorder away without any fuss. The feature goes ahead without you and has a gap where you should be.`, effects: [{ pop: -0.2 }, { conf: 2 }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'nf_rec_ordered_day_off', category: 'recovery', title: `{vet.first} Orders You to Take a Day Off`, weight: 2.5, cooldownDays: 180, maxPerCareer: 2, categoryCooldown: 8,
    cast: { vet: { pick: 'tag', tag: 'respected_by' } }, memory: { role: 'vet', max: 1 },
    trigger: { stat: { fatigue: { gte: 65 } } },
    slots: { how: [`appears at your hotel door with a bag of groceries`, `calls the front desk and cancels your wake-up call`, `takes your car keys and hides them`, `writes a note and slides it under your door`], order: [`"Sleep. Eat. Do nothing."`, `"A day off. That is not a question."`, `"Go outside. Stare at a tree."`] },
    body: [`{vet.name} {how} and leaves a single instruction: {order} It is bossy, unasked-for and exactly the kind of thing a person says to someone they would hate to see burn out.`, `You have been running on adrenaline and appointments for so long that the idea of a free afternoon sounds like a threat. The respect between you is what keeps you from throwing the note in the bin.`],
    choices: [
      { id: 'obey', label: `Do exactly as told and switch off your phone`, risk: 'low', result: `You sleep until noon, eat toast on the floor and watch two hours of ducks on a pond. By evening you are almost a human being, and you text {vet.first} one word: thanks.`, effects: [{ fatigue: -22 }, { rel: { who: 'vet', trust: 5, affinity: 4 } }, { conf: 2 }, { pop: -0.2 }] },
      { id: 'compromise', label: `Take the morning off and work the evening`, risk: 'med', result: `The morning is wonderful and the evening is long, and the balance sits somewhere around forgiven. {vet.first} accepts the compromise with a shrug that says it was better than nothing.`, effects: [{ fatigue: -10 }, { conf: 1 }, { pop: 0.1 }, { rel: { who: 'vet', respect: 1 } }] },
      { id: 'ignore', label: `Politely ignore the order and keep to the schedule`, risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.3 }, text: `The extra appointments go fine, and you finish the day a little ahead on all fronts. {vet.first} sees your face at the next show and says nothing at all.`, effects: [{ pop: 0.5 }, { fatigue: 8 }, { conf: 2 }, { rel: { who: 'vet', respect: -2 } }] },
        { weight: 1, text: `By the afternoon a headache has grown behind your eyes and by nightfall a mistake has been made. The match is clumsy, and you remember a note you did not take.`, effects: [{ pop: -0.4 }, { fatigue: 10 }, { conf: -4 }, { rel: { who: 'vet', respect: -2 } }] } ] },
      { id: 'invite', label: `Invite {vet.first} to spend the day with you`, risk: 'low', result: `The pair of you spend eight hours doing very little, with a card game and a thermos of tea. It is quiet, easy and oddly memorable, and the tiredness slips away without being asked.`, effects: [{ fatigue: -14 }, { rel: { who: 'vet', trust: 6, affinity: 6 } }, { conf: 2 }] },
    ],
  },
  {
    id: 'nf_rec_waiting_room', category: 'recovery', title: `Two Chairs in the Waiting Room`, weight: 2.5, cooldownDays: 200, maxPerCareer: 1, categoryCooldown: 8,
    cast: { other: { pick: 'tag', tag: 'humiliated_by' } }, memory: { role: 'other', max: 2 },
    trigger: { injured: true },
    slots: { clinic: [`a physiotherapy clinic with a fish tank`, `an imaging centre with cold plastic chairs`, `the specialist's waiting room`, `a rehab centre with a broken vending machine`], magazine: [`a magazine that is six months old`, `a crossword that is half finished`, `a phone held in a tight grip`] },
    body: [`In {clinic}, the only free chair is beside {other.name}, who looks up from {magazine} and then very carefully looks down again. The things that happened between you in public are not far from either of your minds.`, `Illness is a great leveller, and injuries are worse, because nobody in the room can pretend to be the winner. The wait is forty minutes long.`],
    choices: [
      { id: 'greet', label: `Nod and ask what {other.first} is in for`, risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{other.first} answers in a short, tight voice, and the next ten minutes are a comparison of ailments that becomes nearly friendly. You part with a nod that is surprisingly wide.`, effects: [{ rel: { who: 'other', heat: -8, respect: 3, trust: 2 } }, { conf: 2 }] },
        { weight: 1, text: `{other.first} gives a one-word answer and picks up the magazine again. The silence stretches like a bad contract.`, effects: [{ conf: -1 }, { fatigue: 1 }] } ] },
      { id: 'apologise', label: `Apologise for what happened between you`, risk: 'med', result: `The apology is quiet and without excuses, and {other.first} stares for a very long moment. "I will think about it," {other.first} says, and goes in for the appointment, leaving you with a clear conscience and an open question.`, effects: [{ rel: { who: 'other', heat: -10, respect: 4, trust: 3 } }, { conf: 0 }, { pop: 0.1 }] },
      { id: 'swap', label: `Move to a seat on the other side of the room`, risk: 'low', result: `You take the chair near the fish tank and watch the fish with enormous attention. The wait goes by like a long winter, and you have a good idea of how the other half is spending it.`, effects: [{ fatigue: 1 }, { conf: -1 }] },
      { id: 'gloat', label: `Make a remark about who is in worse shape`, risk: 'high', result: `The remark lands in a room full of strangers, and every one of them pretends not to hear it. {other.first} responds with a look that you will see again, and sooner than you think.`, effects: [{ rivalry: { who: 'other', heat: 10 } }, { rel: { who: 'other', heat: 8, respect: -3 } }, { conf: 1 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'nf_rec_carried_bag', category: 'recovery', title: `{ex.first} Carries Your Bag`, weight: 2, contexts: ['weekly', 'show_day', 'post_show'], cooldownDays: 200, maxPerCareer: 1, categoryCooldown: 8,
    cast: { ex: { pick: 'tag', tag: 'reconciled' } }, memory: { role: 'ex', max: 2 },
    trigger: { injured: true },
    slots: { place: [`across a train platform`, `up three flights of hotel stairs`, `through a crowded terminal`, `from the car to the dressing room`], line: [`says nothing about it`, `pretends not to be doing it`, `jokes that the bag is the heaviest part of the injury`] },
    body: [`With your arm in a sling, {ex.name} appears and takes your bag, carrying it {place} while {ex.first} {line}. The history between you is the sort that makes a gesture like this feel like a long sentence.`, `You used to be on opposite sides of a feud, and now you are on the same side of a staircase. Nothing about it was planned, and nothing about it feels small.`],
    choices: [
      { id: 'accept', label: `Accept the help and say thank you`, risk: 'low', result: `The thanks is plain, and {ex.first} replies with a shrug and a joke about back pain. The bag is carried the whole way, and the reconciliation, quietly, deepens.`, effects: [{ rel: { who: 'ex', trust: 6, affinity: 5 } }, { conf: 2 }, { fatigue: -3 }] },
      { id: 'insist', label: `Insist on carrying it yourself`, risk: 'med', result: `You take the bag back with a stiff smile, and manage twenty steps before the shoulder complains. {ex.first} does not say a word and picks it up again without comment.`, effects: [{ rel: { who: 'ex', respect: 3 } }, { fatigue: 5 }, { conf: 1 }, { pop: 0.1 }] },
      { id: 'repay', label: `Offer to return the favour when it is your turn`, risk: 'low', result: `{ex.first} grins and says to remember it. The promise is small, public and entirely binding in the way a handshake is.`, effects: [{ rel: { who: 'ex', trust: 4, respect: 3 } }, { conf: 2 }] },
      { id: 'suspect', label: `Wonder aloud what {ex.first} wants in return`, risk: 'high', result: `The question comes out sharper than you meant, and {ex.first} stops mid-step. The bag is set down on the floor like a sentence, and the reconciliation takes a long, cold step back.`, effects: [{ rel: { who: 'ex', trust: -8, affinity: -5, heat: 5 } }, { conf: -2 }] },
    ],
  },
  // ======================= EXTRA (memory-bearing) =======================
  {
    id: 'nf_trn_vet_camp', category: 'training', title: `{vet.first} Needs a Sparring Partner`, weight: 2, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 6,
    cast: { vet: { pick: 'tag', tag: 'respected_by' } }, memory: { role: 'vet', max: 1 },
    slots: { event: [`a title defense that has the whole building talking`, `a farewell match with a very long guest list`, `a comeback that nobody expected`, `the biggest card of the year`], place: [`a converted barn with a sagging ring`, `a rented hall that echoes`, `a garage gym behind a diner`] },
    body: [`{vet.name} is getting ready for {event}, and asks you to spend a few weeks as a sparring partner in {place}. The request comes with no pay and no promises, only the compliment of having been chosen.`, `A camp like this is hard on the body and generous with lessons. It also means long days beside a person whose opinion of you matters.`],
    choices: [
      { id: 'full', label: `Commit to the whole camp`, risk: 'med', result: `Three weeks of early mornings leave you leaner, sharper and bruised in new places. {vet.first} says almost nothing about it, then introduces you at the next show as a person worth knowing.`, effects: [{ attr: { name: 'technical', delta: 1 } }, { attr: { name: 'grappling', delta: 1 } }, { rel: { who: 'vet', respect: 6, trust: 5 } }, { fatigue: 16 }, { pop: 0.3 }] },
      { id: 'week', label: `Offer one solid week and a few evenings`, risk: 'low', result: `The week is concentrated, and you leave with a notebook full of corrections and a sore left rib. It is less than {vet.first} wanted and more than most would give.`, effects: [{ attr: { name: 'technical', delta: 1 } }, { rel: { who: 'vet', respect: 3, trust: 2 } }, { fatigue: 8 }, { conf: 1 }] },
      { id: 'terms', label: `Ask for a favour in return for your time`, risk: 'med', outcomes: [
        { weight: 2, bonus: { popularity: 0.4, confidence: 0.3 }, text: `{vet.first} laughs and agrees to a promo spot with you on the next card. The camp is a fair swap, and the segment is better than either of you planned.`, effects: [{ pop: 0.7 }, { fatigue: 10 }, { rel: { who: 'vet', respect: 2 } }, { conf: 2 }] },
        { weight: 1, text: `The question lands wrong, as though you had put a price on friendship. {vet.first} says the camp is cancelled, and the remainder of the day is very quiet.`, effects: [{ rel: { who: 'vet', respect: -4, trust: -3 } }, { conf: -3 }] } ] },
      { id: 'decline', label: `Decline: your own bookings come first`, risk: 'low', result: `You explain, honestly, that the schedule does not bend. {vet.first} nods as though it is the answer expected, and the empty chair at the camp is filled by someone younger.`, effects: [{ fatigue: -3 }, { rel: { who: 'vet', respect: -1 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'nf_inj_reluctant_relief', category: 'injury', title: `Relief on {opp.first}'s Face`, weight: 2, cooldownDays: 220, maxPerCareer: 1, categoryCooldown: 8,
    cast: { opp: { pick: 'tag', tag: 'reluctant' } }, memory: { role: 'opp', max: 1 },
    trigger: { injured: true },
    slots: { where: [`outside the doctor's office`, `in the corridor by the vending machines`, `at the entrance to the training room`], tell: [`a smile that arrives a second too soon`, `shoulders that drop two inches`, `a laugh that cuts itself short`] },
    body: [`News of your injury has gone around, and {opp.name} catches you {where} with {tell}. It is obvious {opp.they} had been dreading the next match with you, and the weight of that dread has lifted before good manners could catch up.`, `Guilt follows relief a few seconds later, and {opp.first} looks like a person trying to put the first emotion back in its box. You both know what just happened.`],
    choices: [
      { id: 'grin', label: `Grin and say you will be back sooner than hoped`, risk: 'low', result: `The promise lands with a light touch and a wink, and {opp.first} manages a crooked smile. It is a cheerful warning, and you can hear the doubt in the laugh that follows.`, effects: [{ conf: 3 }, { rel: { who: 'opp', fear: 5 } }, { pop: 0.1 }] },
      { id: 'kind', label: `Let it pass and thank {opp.first} for the visit`, risk: 'low', result: `You say nothing about the relief and accept the awkward good wishes as they come. {opp.first} leaves lighter than {opp.they} arrived, and has not forgotten the grace.`, effects: [{ rel: { who: 'opp', trust: 5, respect: 3 } }, { conf: 1 }, { fatigue: -1 }] },
      { id: 'call', label: `Call it out in front of the others`, risk: 'high', result: `You mention the smile to the room, and the room laughs while {opp.first} goes a deep red. It is cruel, funny and quite deserved, and word gets round before you have left the building.`, effects: [{ pop: 0.5 }, { rel: { who: 'opp', respect: -3, heat: 6 } }, { conf: 2 }] },
      { id: 'ask', label: `Ask {opp.first} why the next match scared {opp.them}`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, confidence: 0.3 }, text: `{opp.first} breathes out and answers honestly, naming the finish and the pace and the way you never seem to tire. It is a flattering account, and you walk away knowing how to use it.`, effects: [{ rel: { who: 'opp', trust: 5, respect: 4 } }, { conf: 4 }] },
        { weight: 1, text: `The question is taken as an accusation, and {opp.first} gets stiff and brief. The conversation closes like a door in a draught.`, effects: [{ rel: { who: 'opp', trust: -3 } }, { conf: -2 }] } ] },
    ],
  },
  {
    id: 'nf_trv_insulted_lift', category: 'travel', title: `Sharing {where} with {target.first}`, weight: 2, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 6,
    cast: { target: { pick: 'tag', tag: 'insulted_by' } }, memory: { role: 'target', max: 2 },
    slots: { where: [`a hotel elevator`, `a shuttle bus`, `a rental car queue`], length: [`eleven floors`, `twenty long minutes`, `forty slow feet of carpet`] },
    body: [`The doors close, or the bus pulls out, or the queue shuffles forward, and you find yourself beside {target.name} for {length}. Neither of you has said a word about what you said in public.`, `The enforced closeness makes every cough sound like a comment. You can speak, stay silent, or find the one sentence that will fill the space without making it worse.`],
    choices: [
      { id: 'sorry', label: `Say you went too far in public`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{target.first} stares at the floor numbers for a while and then says "thank you" in a very small voice. The tension does not vanish, but it loosens by a notch before the doors open.`, effects: [{ rel: { who: 'target', heat: -9, respect: 3, trust: 2 } }, { conf: 1 }] },
        { weight: 1, text: `{target.first} says "too late" without looking up, and the rest of the ride is an exercise in studying your shoes. You wonder if the apology was for them or for you.`, effects: [{ rel: { who: 'target', heat: 2 } }, { conf: -2 }] } ] },
      { id: 'stare', label: `Stay silent and hold your ground`, risk: 'low', result: `The silence is long, exact and slightly absurd, and a stranger in the corner looks between you with open fascination. You get off first, and it is not clear who won.`, effects: [{ conf: 1 }, { rel: { who: 'target', respect: 1 } }, { fatigue: 1 }] },
      { id: 'small', label: `Make small talk about the next city on the schedule`, risk: 'low', result: `The remark is bland, awkward and so out of place that {target.first} laughs in spite of everything. The laugh is short and a little pained, but it is a crack in the wall.`, effects: [{ rel: { who: 'target', heat: -4 } }, { conf: 1 }] },
      { id: 'dig', label: `Repeat the line that started it`, risk: 'high', result: `You say it again, softly, and watch it land the second time. A stranger drops a bag, {target.first} does not blink, and the feud gains a new and unwelcome chapter.`, effects: [{ rivalry: { who: 'target', heat: 9 } }, { rel: { who: 'target', heat: 8 } }, { pop: 0.3 }, { conf: 2 }] },
    ],
  },
];
