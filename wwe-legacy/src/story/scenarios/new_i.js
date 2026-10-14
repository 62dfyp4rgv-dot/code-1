// New scenarios (set I): betrayal, personal, rivalry, opportunity, backstage, creative. Ids prefixed ni_.
export default [
  // ======================= BETRAYAL =======================
  {
    id: 'ni_bet_retelling', category: 'betrayal', title: `A Mutual Friend's Version`, weight: 2, cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 6,
    cast: { former: { pick: 'tag', tag: 'betrayal' }, friend: { pick: 'roster', tier: { lte: 3 }, sameBrand: true } }, memory: { role: 'former', max: 2 },
    trigger: { mem: [{ role: 'former', betrayal: true }] },
    slots: { where: [`over a plate of cold eggs`, `at the merch table`, `in the van to the next town`], flaw: [`runs the events in the wrong order`, `turns it into a misunderstanding`, `skips the one detail that matters`] },
    body: [`{friend.name} is retelling what went wrong between you and {former.name} {where}, and the story {flaw}. The listeners nod along, because a smooth version of a rough event is always the one that travels.`, `Nobody has asked you to weigh in. Staying quiet will be heard as agreement, and speaking up means reopening something you both pretend is shut.`],
    choices: [
      { id: 'correct', label: `Correct the record, calmly, in front of everyone`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.3 }, text: `You give the real order of events in four plain sentences and do not pick a villain. {friend.first} goes red, the room goes quiet, and {former.first} hears about it within the hour.`, effects: [{ rel: { who: 'former', respect: 5, trust: 2 } }, { rel: { who: 'friend', respect: -2 } }, { conf: 3 }] },
        { weight: 1, text: `The correction comes out sharper than you meant it to, and it sounds like a second argument instead of a clarification. People look at their shoes and the story gets worse as it moves on.`, effects: [{ rel: { who: 'former', heat: 5 } }, { pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'let_ride', label: `Let the story stand and change the subject`, risk: 'low', result: `You ask about the next town's hotel and the conversation bends away. The wrong version stays in circulation, and it is surprisingly easy to live inside it for a while.`, effects: [{ conf: -2 }, { fatigue: -2 }, { rel: { who: 'friend', affinity: 2 } }] },
      { id: 'private', label: `Give {friend.first} the full version later, in private`, risk: 'low', result: `{friend.first} listens with a coffee going cold and says sorry twice. The room never learns the truth, but the one person who was spreading the wrong one now has the right one.`, effects: [{ rel: { who: 'friend', trust: 5, respect: 2 } }, { fatigue: 3 }, { conf: 1 }] },
      { id: 'warn_former', label: `Tell {former.first} what is being said before it arrives`, risk: 'med', result: `{former.first} takes the news with a short nod and an even shorter thank-you. It is not peace, but it is two people dealing in facts for once.`, effects: [{ rel: { who: 'former', trust: 4, heat: -3 } }, { rel: { who: 'friend', trust: -2 } }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'ni_bet_shared_car', category: 'betrayal', title: `One Car, Two Seats, No Choice`, weight: 2.5, contexts: ['weekly', 'pre_show'], cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 6,
    cast: { former: { pick: 'tag', tag: 'betrayal' } }, memory: { role: 'former', max: 2 },
    trigger: { mem: [{ role: 'former', betrayal: true }] },
    slots: { ride: [`one rental car`, `adjacent seats on a small plane`, `a shuttle van with no other passengers`], stretch: [`four hours of highway`, `ninety minutes`, `the whole run to the next town`] },
    body: [`The travel desk has put you and {former.name} in {ride} for {stretch}. Nobody planned it as a message, which makes it a better one than any message could be.`, `The first ten minutes pass in a silence so polite that it hums. There are two ways this can go, and the clock is already running.`],
    choices: [
      { id: 'talk', label: `Break the silence and say one true thing`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `You say you have thought about it more than you let on, and leave it there. {former.first} does not answer for a mile, then asks a question about something else entirely, which is how a thaw sounds.`, effects: [{ rel: { who: 'former', trust: 5, heat: -5 } }, { conf: 1 }, { fatigue: 2 }] },
        { weight: 1, text: `The sentence comes out like an accusation wearing an apology's coat. {former.first} turns to the window and the rest of the trip is silence with an edge on it.`, effects: [{ rel: { who: 'former', heat: 5 } }, { conf: -3 }, { fatigue: 3 }] } ] },
      { id: 'headphones', label: `Put on headphones and let the miles pass`, risk: 'low', result: `The album is one you have not heard in years, and it holds up better than the company does. You arrive rested and unbothered, and a little less forgivable.`, effects: [{ fatigue: -4 }, { conf: 1 }, { rel: { who: 'former', trust: -2 } }] },
      { id: 'swap', label: `Ask the travel desk for a separate ride`, risk: 'low', result: `It costs a rebooking fee and a raised eyebrow from the coordinator. {former.first} hears about it by the next stop, and nobody can tell whether it landed as courtesy or as a slap.`, effects: [{ money: -350 }, { fatigue: -2 }, { rel: { who: 'former', respect: -2 } }] },
      { id: 'drive', label: `Offer to drive and let {former.first} pick the music`, risk: 'med', result: `{former.first} picks something loud and old, and neither of you comments on the fact that you both know the words. It is a long drive, and the sore back at the end is worth the first shared laugh.`, effects: [{ rel: { who: 'former', affinity: 5, trust: 2, heat: -3 } }, { fatigue: 6 }] },
    ],
  },
  {
    id: 'ni_bet_screenshot', category: 'betrayal', title: `The Screenshot Everyone Has Seen`, weight: 2, cooldownDays: 160, maxPerCareer: 2, categoryCooldown: 6,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1 },
    trigger: { minYear: 2012, mem: [{ role: 'ally', trustGte: 0 }] },
    slots: { channel: [`in the locker-room group chat`, `on a fan forum`, `in an industry newsletter`], line: [`calls your last match sloppy`, `jokes about the size of your ego`, `wonders whether you are slipping`] },
    body: [`A screenshot is making the rounds {channel}: a private message in which {ally.name} {line}. It could be real, it could be edited, and it has already been seen by more people than you could ever explain it to.`, `People are watching your face to learn which it is. The thing you do in the next minute will be treated as a confession or a denial, whichever is more fun.`],
    choices: [
      { id: 'ask', label: `Ask {ally.first} in person whether it is real`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{ally.first} reads the screenshot twice and says the first line is a lie and the second is a joke taken out of context. The look on {ally.their} face is not rehearsed, and you believe it.`, effects: [{ rel: { who: 'ally', trust: 6, respect: 3 } }, { conf: 2 }] },
        { weight: 1, text: `{ally.first} goes quiet, then says it was written in a bad week and was never meant to be read by you. Both halves of that sentence are true, and neither helps.`, effects: [{ rel: { who: 'ally', trust: -10, heat: 6 } }, { conf: -3 }] } ] },
      { id: 'joke', label: `Post a joke about it before anyone else can`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5 }, text: `Your reply is self-deprecating and quick, and it turns the screenshot into a punchline at your own expense. The thread moves on, and the fans like you more for it.`, effects: [{ pop: 0.6 }, { conf: 2 }, { rel: { who: 'ally', respect: -2 } }] },
        { weight: 1, text: `The joke reads as hurt wearing a grin, and strangers pile in to say so. Your ally gets a front-row seat to the whole thing.`, effects: [{ pop: -0.3 }, { conf: -3 }, { rel: { who: 'ally', trust: -3 } }] } ] },
      { id: 'back_ally', label: `Tell everyone it is fake and stand by {ally.first}`, risk: 'med', result: `You say it flat, in the hallway, to anyone listening. If the message turns out to be real you will look foolish, but for tonight {ally.first} has someone in the room who chose to believe in {ally.them}.`, effects: [{ rel: { who: 'ally', trust: 8, affinity: 4 } }, { pop: -0.2 }, { conf: -1 }] },
      { id: 'say_nothing', label: `Say nothing and keep your own counsel`, risk: 'low', result: `You keep your face still and your phone in your pocket for the rest of the night. The story dies in a day, and the doubt it left behind takes much longer.`, effects: [{ conf: -2 }, { rel: { who: 'ally', trust: -3 } }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'ni_bet_gm_assessment', category: 'betrayal', title: `The Question {gm.name} Should Not Ask`, weight: 2, cooldownDays: 180, maxPerCareer: 2, categoryCooldown: 6,
    cast: { ally: { pick: 'tag', tag: 'ally' }, gm: { pick: 'staff', role: 'gm' } }, memory: { role: 'ally', max: 2 },
    trigger: { stat: { careerYears: { gte: 2 }, popularity: { gte: 15 } }, mem: [{ role: 'ally', trustGte: 5 }] },
    slots: { ask: [`a candid review of how reliable {ally.first} is on the road`, `your honest view on whether {ally.first} can carry a segment`, `a list of who {ally.first} confides in backstage`], setting: [`over coffee in the production office`, `on the walk to the parking lot`, `on a call that runs past midnight`] },
    body: [`{gm.name} asks you for {ask}, {setting}. The tone is friendly, which is how you know the question has a purpose and a deadline.`, `{ally.name} would never know what you said, in theory. In practice, the business is small, and people can read a new booking sheet like tea leaves.`],
    choices: [
      { id: 'praise', label: `Give a warm, honest answer in {ally.first}'s favor`, risk: 'low', result: `You say what you actually believe, which also happens to be generous. {gm.first} writes it down without comment, and it turns out the truth can be the kindest thing available.`, effects: [{ rel: { who: 'ally', trust: 3 } }, { conf: 1 }, { pop: 0.1 }] },
      { id: 'dish', label: `Give the harsh version and take the credit for candor`, risk: 'high', result: `You say the true, unflattering things, and a few of the slightly-exaggerated ones. {gm.first} nods and slides a better slot your way within the week, and you start avoiding {ally.first} in the hallway.`, effects: [{ event: { type: 'betrayal', participants: ['ally'], summary: `Gave the office a harsh private review of {ally.name} in exchange for favor.`, importance: 3, data: { context: 'office_informant', byPlayer: true } } }, { pop: 0.5 }, { money: 1800 }, { conf: -2 }] },
      { id: 'refuse', label: `Decline to rate a colleague behind {ally.their} back`, risk: 'med', result: `The room cools a degree. {gm.first} says that is understandable, in the tone people use when they mean the opposite, and you leave unsure whether you just spent a favor or burned one.`, effects: [{ pop: -0.3 }, { conf: 2 }, { rel: { who: 'ally', respect: 3 } }] },
      { id: 'tip', label: `Answer, then tell {ally.first} exactly what was asked`, risk: 'med', result: `{ally.first} listens with a very still face and thanks you for the honesty. It is a transparent way to do an awkward thing, and it costs you the easy trust of people who never knew they were being discussed.`, effects: [{ rel: { who: 'ally', trust: 5, respect: 3 } }, { fatigue: 3 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'ni_bet_rival_whisper', category: 'betrayal', title: `{rival.name} Knows Something About {ally.name}`, weight: 2, cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 6,
    cast: { rival: { pick: 'rivalry', minHeat: 20 }, ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'rival', max: 2 },
    trigger: { mem: [{ role: 'ally', trustGte: 5 }] },
    slots: { where: [`in the corridor outside the arena`, `while taping up in the next locker room`, `across the barricade, almost quietly`], proof: [`a photo of a hotel receipt`, `a voicemail you are free to hear`, `a name written on a napkin`] },
    body: [`{rival.name} catches you {where} and says {ally.name} has been talking to another company. The offer of proof is {proof}, and it would be more convincing from someone with fewer reasons to want you rattled.`, `If it is true, you deserve to know. If it is a trick, the point of it is to make you ask.`],
    choices: [
      { id: 'confront', label: `Take the proof to {ally.first} and ask for the truth`, risk: 'high', outcomes: [
        { weight: 1, text: `{ally.first} admits to one meeting, one coffee and no signature, and says the plan was to tell you if it went anywhere. It is an honest answer, and you both recognise it as a mixed one.`, effects: [{ rel: { who: 'ally', trust: -4, respect: 3 } }, { conf: -1 }, { fatigue: 2 }] },
        { weight: 2, text: `{ally.first} stares at the paper and laughs in disbelief, then stops laughing when it sinks in that you brought it. The accusation was false, the damage is not, and you owe an apology.`, effects: [{ rel: { who: 'ally', trust: -8, heat: 5 } }, { rel: { who: 'rival', respect: 3 } }, { conf: -3 }] } ] },
      { id: 'throw_back', label: `Hand the proof back and tell {rival.first} to try harder`, risk: 'low', result: `{rival.first} pockets it with a half smile, a little surprised at being refused. You come off as someone who cannot be moved by a rumour, which is worth something in a locker room full of them.`, effects: [{ rel: { who: 'rival', respect: 4, heat: 3 } }, { conf: 3 }, { fatigue: 2 }] },
      { id: 'watch', label: `Say nothing and watch {ally.first} for a few weeks`, risk: 'med', result: `You become an expert on {ally.their} schedule, {ally.their} phone calls and the way {ally.they} laughed a beat too long at a joke. It tells you nothing, and it costs you more peace of mind than any confrontation would have.`, effects: [{ fatigue: 6 }, { conf: -2 }, { rel: { who: 'ally', trust: -3 } }] },
      { id: 'warn_ally', label: `Warn {ally.first} that {rival.first} is stirring trouble`, risk: 'low', result: `{ally.first} thanks you, looks over {ally.their} shoulder once and starts asking the right questions about who has been listening. You both know that tipping off a friend is the opposite of what {rival.first} wanted.`, effects: [{ rel: { who: 'ally', trust: 6, affinity: 3 } }, { rel: { who: 'rival', heat: 5 } }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'ni_bet_reconciled_favor', category: 'betrayal', title: `The First Favor {ex.name} Asks`, weight: 2, cooldownDays: 160, maxPerCareer: 2, categoryCooldown: 6,
    cast: { ex: { pick: 'tag', tag: 'reconciled' } }, memory: { role: 'ex', max: 2 },
    trigger: { mem: [{ role: 'ex', tag: 'reconciled' }] },
    slots: { ask_how: [`as casually as asking for the salt`, `after three false starts`, `with a written list, which is unsettling`], favor: [`to put in a word with the office about a better slot`, `to give up a spot on tonight's card so a bigger match can fit`, `to cover a missed bus call without telling anyone`] },
    body: [`{ex.name} brings it up {ask_how}: would you be willing {favor}? There is no hint of leverage, and no hint that the question is easy.`, `A favor between people who once were not speaking is a test, and both of you know it is a test. Whatever you say, you are about to learn how much the peace is worth.`],
    choices: [
      { id: 'yes', label: `Do it without conditions`, risk: 'med', result: `You do the thing and say nothing about the cost of it. {ex.first} understands exactly what you gave up, and the next conversation between you has the easy tone of two people on the same side.`, effects: [{ rel: { who: 'ex', trust: 8, affinity: 6, respect: 3 } }, { pop: -0.3 }, { fatigue: 3 }] },
      { id: 'terms', label: `Agree, but ask for something small in return`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{ex.first} laughs, names a price you can both live with, and says it is the most normal thing you have ever asked. The deal is clean, and a little of the caution between you wears away.`, effects: [{ rel: { who: 'ex', trust: 3, respect: 4 } }, { pop: 0.1 }] },
        { weight: 1, text: `{ex.first} hears the condition as an invoice, and the warmth in the room dips by a degree. The favor still happens, and nobody says thanks.`, effects: [{ rel: { who: 'ex', trust: -4, affinity: -3 } }, { conf: -1 }] } ] },
      { id: 'not_yet', label: `Say you need more time before owing anyone anything`, risk: 'low', result: `{ex.first} nods, smiles slightly and says that is fair, which is the sound of a door being held open but not walked through. You keep your freedom and give up a little of the closeness.`, effects: [{ rel: { who: 'ex', trust: -3, respect: 2 } }, { conf: 2 }] },
      { id: 'decline', label: `Decline plainly and explain why it is too much`, risk: 'high', result: `You say it clearly, with reasons, and {ex.first} listens to all of them. The truce survives, barely, as a polite relationship with a ceiling on it.`, effects: [{ rel: { who: 'ex', trust: -6, respect: 1, heat: 4 } }, { conf: 1 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'ni_bet_turn_pitch', category: 'betrayal', title: `Creative Wants You to Turn on {ally.name}`, weight: 2, major: true, cooldownDays: 200, maxPerCareer: 1, categoryCooldown: 6,
    cast: { ally: { pick: 'tag', tag: 'ally' }, creative: { pick: 'staff', role: 'creative' } }, memory: { role: 'ally', max: 2 },
    trigger: { stat: { popularity: { gte: 20 } }, mem: [{ role: 'ally', trustGte: 15 }] },
    slots: { turn: [`a chair shot to close the show`, `a walkout in the middle of a big match`, `a long stare as the lights go out`], manner: [`with a storyboard drawn in marker`, `between bites of a sandwich`, `while pacing in tight circles`] },
    body: [`{creative.name} lays out the idea {manner}: you turn on {ally.name} with {turn}. It is a perfectly good angle, with real money in it, and it would be played in front of thousands of people who know the two of you as friends.`, `The story is fiction. The trust it uses up is not, and nobody in the room can tell you exactly how much of one becomes the other.`],
    choices: [
      { id: 'agree', label: `Agree to the angle as it is written`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, mic: 0.3 }, text: `You sell it with a face the crowd has never seen on you, and the reaction is volcanic. {ally.first} is a professional about it and still takes a week to look you in the eye in the hallway.`, effects: [{ pop: 1.2 }, { rel: { who: 'ally', trust: -6, respect: 4 } }, { conf: 2 }, { fatigue: 4 }] },
        { weight: 1, text: `The angle lands as a muddle, and the crowd cannot tell whether to boo or shrug. You lose a friend's easy trust and gain nothing you can bank.`, effects: [{ pop: 0.1 }, { rel: { who: 'ally', trust: -10, heat: 5 } }, { conf: -3 }] } ] },
      { id: 'tell_first', label: `Take it to {ally.first} first and plan it together`, risk: 'low', result: `{ally.first} grins, rewrites two beats and asks to take the bigger bump. The angle feels more real for it, and the two of you leave the meeting closer than you went in.`, effects: [{ rel: { who: 'ally', trust: 7, affinity: 5 } }, { pop: 0.5 }, { fatigue: 5 }] },
      { id: 'counter', label: `Pitch a version where {ally.first} turns on you instead`, risk: 'med', result: `{creative.first} writes it on the back of a hand and warms to it quickly, since heels are easier to build than faces. It costs you some of your good-guy glow, and you gain a partner who owes you a good turn.`, effects: [{ pop: 0.3 }, { rel: { who: 'ally', trust: 4, respect: 3 } }, { conf: -1 }, { fatigue: 3 }] },
      { id: 'decline', label: `Turn it down and offer another story`, risk: 'med', result: `The idea is shelved with the air of something that will be remembered. You protect a friendship and look like you value comfort over the product, which is a fair summary of the trade.`, effects: [{ pop: -0.4 }, { conf: 1 }, { rel: { who: 'ally', trust: 3, respect: 2 } }] },
    ],
  },
  {
    id: 'ni_bet_credit', category: 'betrayal', title: `Your {idea} in Someone Else's Mouth`, weight: 1.5, cooldownDays: 180, maxPerCareer: 2, categoryCooldown: 6,
    cast: { agent: { pick: 'staff', role: 'agent' } }, noAutoMemory: true,
    trigger: { stat: { careerYears: { gte: 2 } } },
    slots: { idea: [`entrance idea`, `finish`, `promo angle`], room: [`a production meeting`, `the catering line`, `a walk through the loading dock`] },
    body: [`In {room} you hear {agent.name} presenting your {idea} to a table of executives as a pitch of their own. The pitch is good, which is the maddening part, and the executives are nodding at the wrong name.`, `Taking credit is the oldest currency in this business, and it only works when the person it is taken from stays quiet. You can see exactly where the door to that conversation is.`],
    choices: [
      { id: 'interrupt', label: `Step in and say whose idea it was, politely`, risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.5, charisma: 0.3 }, text: `You give your name and two supporting details, and the room turns toward you like plants toward a window. {agent.first} laughs it off with a very thin smile.`, effects: [{ pop: 0.5 }, { conf: 4 }, { fatigue: 3 }] },
        { weight: 1, text: `Interrupting a pitch lands as a scene, and the executives write you down as someone who makes them uncomfortable. The idea goes through anyway, with a different byline.`, effects: [{ pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'after', label: `Raise it with {agent.first} privately afterward`, risk: 'low', result: `{agent.first} apologises quickly and a little too smoothly, then promises a credit next time. You get a promise instead of a name on the sheet, and it sits in your pocket like a coin from another country.`, effects: [{ conf: 1 }, { fatigue: 1 }, { pop: -0.1 }] },
      { id: 'let_go', label: `Let it go: the idea gets made, which is the point`, risk: 'low', result: `The idea makes it to the screen and the crowd responds, and you take a stranger's applause as your own. It is a quiet, adult kind of satisfaction with a small bruise underneath.`, effects: [{ pop: 0.2 }, { conf: -2 }, { fatigue: -2 }] },
      { id: 'lock_down', label: `Start writing every idea down with a date and a witness`, risk: 'med', result: `The notebook grows fat, and so does the number of people who find you tiring. Your next pitch is bullet-proof, and so is the reputation you now have for keeping score.`, effects: [{ fatigue: 4 }, { conf: 2 }, { pop: -0.2 }, { attr: { name: 'psychology', delta: 1 } }] },
    ],
  },
  {
    id: 'ni_bet_group_photo', category: 'betrayal', title: `Smile for the Photographer, {former.first}`, weight: 2, contexts: ['weekly', 'pre_show'], cooldownDays: 160, maxPerCareer: 2, categoryCooldown: 6,
    cast: { former: { pick: 'tag', tag: 'betrayal' } }, memory: { role: 'former', max: 2 },
    trigger: { stat: { careerYears: { gte: 1 } }, mem: [{ role: 'former', betrayal: true }] },
    slots: { pose: [`with arms folded, back to back`, `shoulder to shoulder, grinning`, `mid-handshake, eyes front`], shot: [`for the show poster`, `for the program cover`, `for a sponsor's banner`] },
    body: [`The photographer wants you and {former.name} posed {pose} {shot}, and does not know or care what happened between you. The lights are hot, the assistant is counting down, and the brief is simply to look like colleagues.`, `A photograph outlives the feeling that produced it. Whatever your faces do in the next three seconds will end up on a wall somewhere.`],
    choices: [
      { id: 'pro', label: `Pose like a professional and smile for the lens`, risk: 'low', result: `The shot is clean, bright and totally false, and everyone on the crew relaxes. {former.first} gives you the smallest nod when it ends, an acknowledgement of craft between two people who despise the setup.`, effects: [{ pop: 0.2 }, { rel: { who: 'former', respect: 3 } }, { conf: -1 }] },
      { id: 'cold', label: `Let the coldness show in your face`, risk: 'med', result: `The photographer lights up, because tension photographs better than friendship. The picture goes on the poster, and the wrestlers in the know read it exactly as intended.`, effects: [{ pop: 0.5 }, { rel: { who: 'former', heat: 5 } }, { conf: 1 }] },
      { id: 'separate', label: `Ask to be shot separately and composited together`, risk: 'low', result: `It adds an hour to the schedule and a sigh to the producer's voice. The final image is perfect, assembled from two honest solo portraits, and everybody involved is pretending not to notice.`, effects: [{ fatigue: 3 }, { rel: { who: 'former', respect: 1 } }, { pop: -0.1 }] },
      { id: 'joke', label: `Make a joke that gets the whole set laughing`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.4, charisma: 0.4 }, text: `The joke is at your own expense and it works. {former.first} cracks a real laugh before remembering not to, and the frame catches that second.`, effects: [{ rel: { who: 'former', heat: -6, trust: 2 } }, { pop: 0.4 }, { conf: 2 }] },
        { weight: 1, text: `The joke misses by a few inches and lands on the subject you are both avoiding. The silence afterward gets photographed too.`, effects: [{ rel: { who: 'former', heat: 5 } }, { conf: -3 }] } ] },
    ],
  },
  {
    id: 'ni_bet_borrowed_move', category: 'betrayal', title: `{ally.name} Used Your {move}`, weight: 2, cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 6,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1 },
    trigger: { stat: { careerYears: { gte: 1 }, popularity: { gte: 10 } }, mem: [{ role: 'ally', trustGte: 0 }] },
    slots: { move: [`finisher`, `entrance gesture`, `closing line`], reaction: [`and the whole building sang along`, `and the replay ran twice on the broadcast`, `and a camera operator whooped from the floor`] },
    body: [`Last night {ally.name} used your {move} in a match, {reaction}. It was done with a wink in your direction, or perhaps it was not, and that uncertainty is the whole problem.`, `In a business where a signature is private property and nobody has the paperwork, a friend who borrows one is committing either a tribute or a theft. You are the only one who can say which.`],
    choices: [
      { id: 'tribute', label: `Take it as a tribute and say so publicly`, risk: 'low', result: `You tell a reporter it was an honour, and the story swells into a warm human-interest item. {ally.first} sends a note that says only "thank you," which means more than a paragraph would.`, effects: [{ rel: { who: 'ally', trust: 4, affinity: 5 } }, { pop: 0.3 }, { conf: -1 }] },
      { id: 'ask_stop', label: `Ask {ally.first} to retire it from {ally.their} act`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.3 }, text: `{ally.first} listens, bristles, and then agrees with a sigh, since the friendship matters more than the pop. The move goes back in your pocket, and the next hug between you has an extra pat on the back.`, effects: [{ rel: { who: 'ally', trust: -2, respect: 3 } }, { conf: 3 }] },
        { weight: 1, text: `The request lands as pettiness, and {ally.first} points out that nobody owns a gesture. The argument is polite, circular and long.`, effects: [{ rel: { who: 'ally', heat: 5, trust: -5 } }, { conf: -2 }, { fatigue: 3 }] } ] },
      { id: 'one_better', label: `Upstage it by doing the move bigger on your next night`, risk: 'high', result: `You do it with more flair, a longer pause and a sharper landing, and the crowd treats it like a king reclaiming a crown. {ally.first} watches from the curtain with an expression that is half admiration and half caught-in-the-act.`, effects: [{ pop: 0.7 }, { rel: { who: 'ally', respect: 2, heat: 4 } }, { fatigue: 5 }, { conf: 2 }] },
      { id: 'collab', label: `Pitch a spot where the two of you use it together`, risk: 'med', result: `Creative likes the pitch more than you do, since it turns a quibble into a moment. It takes extra rehearsal, and the friendship ends up stronger than it started.`, effects: [{ pop: 0.5 }, { rel: { who: 'ally', trust: 5, affinity: 4 } }, { fatigue: 6 }] },
    ],
  },
  // ======================= RIVALRY =======================
  {
    id: 'ni_riv_stuck_elevator', category: 'rivalry', title: `Stuck Between Floors with {rival.name}`, weight: 2.5, cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 5,
    cast: { rival: { pick: 'rivalry', minHeat: 25 } }, memory: { role: 'rival', max: 2 },
    trigger: { mem: [{ role: 'rival', heatGte: 20 }] },
    slots: { stall: [`between the ninth and tenth floors`, `one floor short of the lobby`, `with the doors stuck half open`], duration: [`for eleven minutes`, `until a maintenance worker with a flashlight arrives`, `long enough to read the safety notice twice`] },
    body: [`The hotel elevator shudders to a stop {stall}, and you are alone with {rival.name} {duration}. No crowd, no cameras, and no script for what you are supposed to do with your hands.`, `The feud has always had an audience to perform for. Take the audience away and you find out whether anything is left underneath.`],
    choices: [
      { id: 'truth', label: `Say what the feud has actually cost you`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, confidence: 0.3 }, text: `You say it plainly: the sleep, the bruises, the way the road eats everything. {rival.first} listens with arms folded, then admits to three of the four, and the elevator suddenly feels bigger.`, effects: [{ rel: { who: 'rival', respect: 7, heat: -4 } }, { conf: 2 }] },
        { weight: 1, text: `{rival.first} hears the confession as an opening and says something cutting about it. By the time the doors open you have regretted talking for several floors.`, effects: [{ rel: { who: 'rival', heat: 6, respect: -2 } }, { conf: -3 }] } ] },
      { id: 'act', label: `Keep the act going though nobody is watching`, risk: 'low', result: `You stay in character, eyes front, jaw set. {rival.first} matches it for eleven floors of silence, and the two of you part with the strange satisfaction of professionals who never blinked.`, effects: [{ rel: { who: 'rival', respect: 3, heat: 2 } }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'needle', label: `Needle {rival.first} about something that actually stings`, risk: 'high', result: `You find the soft spot on the first try and press it. It works so well that {rival.first} stops speaking altogether, and the grudge gets a new layer you did not plan for.`, effects: [{ rivalry: { who: 'rival', heat: 12 } }, { rel: { who: 'rival', heat: 10, respect: -3 } }, { pop: 0.2 }, { conf: 2 }] },
      { id: 'water', label: `Offer your water bottle and stay quiet`, risk: 'low', result: `{rival.first} takes it, drinks, hands it back and says nothing. It is the most intimate thing you have ever done with a rival, and neither of you will mention it to anyone.`, effects: [{ rel: { who: 'rival', respect: 4, affinity: 3, heat: -3 } }, { pop: -0.1 }, { conf: -1 }] },
    ],
  },
  {
    id: 'ni_riv_split_shirt', category: 'rivalry', title: `The Fan in the Half-and-Half Shirt`, weight: 2, contexts: ['weekly', 'show_day', 'post_show'], cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 5,
    cast: { rival: { pick: 'rivalry', minHeat: 20 }, fan: { pick: 'media', kind: 'fan' } }, memory: { role: 'rival', max: 1 },
    trigger: { stat: { popularity: { gte: 15 } } },
    slots: { where: [`at the barricade`, `at the merch table`, `outside the arena doors`], shirt: [`stitched down the middle by hand`, `printed as a joke by a local shop`, `with a slogan that says they just like wrestling`] },
    body: [`{fan.name} is waiting {where} in a shirt that is half your logo and half {rival.name}'s, {shirt}. Both of your names are on it, and {fan.they} look completely at peace.`, `Neither side of the feud has a place in the garment, which is probably why it is the most honest thing anyone has worn all year.`],
    choices: [
      { id: 'sign_half', label: `Sign your half and compliment the stitching`, risk: 'low', result: `The marker squeaks on the cotton, {fan.first} beams, and a small crowd gathers to take pictures. Your half of the shirt is a little more visible than the other.`, effects: [{ pop: 0.4 }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'cut_off', label: `Say you would rather not sign it next to that name`, risk: 'med', result: `{fan.first} nods politely and folds the shirt away, a little crushed. The line behind notices, and at least one of them agrees with you out loud.`, effects: [{ rivalry: { who: 'rival', heat: 5 } }, { pop: 0.1 }, { conf: 1 }, { fatigue: -1 }] },
      { id: 'both', label: `Take the shirt to {rival.first} and sign it together`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{rival.first} stares at you, stares at the shirt, and signs the other half with a flourish. The photo that follows is the best piece of unplanned publicity the feud has ever had.`, effects: [{ pop: 0.8 }, { rel: { who: 'rival', respect: 4, heat: -4 } }, { conf: 1 }] },
        { weight: 1, text: `{rival.first} refuses the offer in front of {fan.first}, loudly and without mercy. The fan is embarrassed and you look naive for expecting more.`, effects: [{ rel: { who: 'rival', heat: 4 } }, { pop: -0.3 }, { conf: -2 }] } ] },
      { id: 'buy', label: `Buy the shirt off the fan's back for a fair price`, risk: 'med', requires: { stat: { money: { gte: 200 } } }, result: `You pay too much and {fan.first} accepts it with the grin of someone who has just received a trade offer. The shirt ends up framed in a locker room, and nobody there can agree on whose it is.`, effects: [{ money: -180 }, { pop: 0.3 }, { conf: 1 }] },
    ],
  },
  {
    id: 'ni_riv_boss_praise', category: 'rivalry', title: `The Boss Praises {rival.name}`, weight: 2, cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 5,
    cast: { rival: { pick: 'rivalry', minHeat: 20 }, gm: { pick: 'staff', role: 'gm' } }, memory: { role: 'rival', max: 2 },
    trigger: {},
    slots: { forum: [`in the production meeting`, `in front of the whole locker room`, `in a hallway conversation that was meant to be private`], label: [`the hardest worker on the roster`, `a cornerstone of the show`, `the one everyone should be watching`] },
    body: [`{gm.name} calls {rival.name} {label}, {forum}, and does not look in your direction while saying it. Everyone else does, collecting the reaction that has not come yet.`, `It might be a motivational tool, a genuine opinion, or a bluff to see what you do. In this building, the three are indistinguishable.`],
    choices: [
      { id: 'congrats', label: `Congratulate {rival.first} in front of everyone`, risk: 'low', result: `The handshake is firm and the smile is steady. {rival.first} is thrown for half a second, and the room reads you as the bigger person, a hat that fits tighter than it looks.`, effects: [{ rel: { who: 'rival', respect: 5, heat: -3 } }, { pop: 0.2 }, { conf: -1 }] },
      { id: 'ask_gm', label: `Ask {gm.first} privately where you stand`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `{gm.first} answers straight: the company needs both of you hungry. You leave with a clearer picture and a smaller chip on your shoulder.`, effects: [{ conf: 3 }, { fatigue: 1 }] },
        { weight: 1, text: `The question lands as insecurity, and {gm.first} gives a gentle, useless pep talk. You leave knowing less than you started with.`, effects: [{ conf: -3 }, { pop: -0.1 }] } ] },
      { id: 'outwork', label: `Take it as a challenge and outwork the whole card`, risk: 'med', result: `Your next two weeks are early gym sessions, extra rounds and a notebook of finish ideas. The matches improve, and so do the bags under your eyes.`, effects: [{ pop: 0.5 }, { fatigue: 9 }, { conf: 3 }, { rivalry: { who: 'rival', heat: 5 } }] },
      { id: 'sulk', label: `Stay quiet and let the resentment cook`, risk: 'low', result: `You smile at the right moments and say nothing true. The resentment is warm and productive for about a week, then it starts to taste bad.`, effects: [{ conf: -3 }, { rel: { who: 'rival', heat: 4 } }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'ni_riv_borrowed_item', category: 'rivalry', title: `{rival.name} Needs a Hand`, weight: 2, contexts: ['pre_show'], cooldownDays: 140, maxPerCareer: 3, categoryCooldown: 5,
    cast: { rival: { pick: 'rivalry', minHeat: 20 } }, memory: { role: 'rival', max: 1 },
    trigger: {},
    slots: { item: [`a roll of tape`, `a spare boot lace`, `a safety pin for a split seam`], moment: [`with the curtain a few minutes away`, `in a dressing room with one working mirror`, `ten minutes before doors`] },
    body: [`{rival.name} knocks on your door {moment} and asks, almost without moving {rival.their} lips, to borrow {item}. It is a small request, and it has cost {rival.them} something to make it.`, `You could say no and be perfectly within your rights. You could also say yes, and see what that does to a feud that both of you work hard to keep clean.`],
    choices: [
      { id: 'lend', label: `Hand it over and say nothing`, risk: 'low', result: `{rival.first} takes it with a short nod and goes. Nobody saw it, nobody will hear of it, and the feud carries on exactly as hot as before, with one small kindness stored where neither of you will look.`, effects: [{ rel: { who: 'rival', respect: 5, trust: 3 } }, { conf: 1 }] },
      { id: 'price', label: `Lend it, but make {rival.them} ask properly`, risk: 'med', result: `You make {rival.first} say please, and {rival.they} did, through teeth that could have cracked a walnut. The satisfaction is brief and the grudge is a little deeper.`, effects: [{ rel: { who: 'rival', respect: -2, heat: 5 } }, { rivalry: { who: 'rival', heat: 4 } }, { conf: 2 }] },
      { id: 'refuse', label: `Close the door on it`, risk: 'low', result: `The latch clicks and you spend ten minutes telling yourself you had every right. {rival.first} finds one somewhere else and goes out looking perfectly fine, which does not help.`, effects: [{ rel: { who: 'rival', heat: 3 } }, { conf: -1 }, { fatigue: -1 }] },
      { id: 'trick', label: `Hand over a worse one and pretend not to notice`, risk: 'high', outcomes: [
        { weight: 1, text: `It snaps mid-match and costs {rival.first} a clumsy few seconds, and the camera catches {rival.their} glare at your corner. The crowd laughs, and so does the producer, and you feel very small.`, effects: [{ rel: { who: 'rival', heat: 12, respect: -5 } }, { rivalry: { who: 'rival', heat: 10 } }, { pop: 0.2 }, { conf: -2 }] },
        { weight: 1, text: `{rival.first} checks it, laughs and hands it back without a word. The look says that the game was seen and has been scored.`, effects: [{ rel: { who: 'rival', heat: 6, respect: -3 } }, { conf: -3 }] } ] },
    ],
  },
  {
    id: 'ni_riv_stiff_notes', category: 'rivalry', title: `{producer.name} Has Notes on Last Night`, weight: 2, contexts: ['weekly'], cooldownDays: 130, maxPerCareer: 3, categoryCooldown: 5,
    cast: { rival: { pick: 'rivalry', minHeat: 25 }, producer: { pick: 'staff', role: 'producer' } }, memory: { role: 'rival', max: 2 },
    trigger: { stat: { matches: { gte: 3 } }, mem: [{ role: 'rival', h2h: { matchesGte: 1 }, last: { within: 7 } }] },
    slots: { complaint: [`two of your forearms landed harder than rehearsed`, `the finish ran thirty seconds past the cue`, `a spot went off script and half the crew gasped`], tone: [`in the voice of someone reading out a parking ticket`, `while straightening a pile of papers that did not need it`, `with the patience of someone counting to ten`] },
    body: [`{producer.name} asks for a word {tone}. The issue with your last match against {rival.name} is that {complaint}.`, `Nobody is in trouble yet. The point of the meeting is to find out whether the heat between you two is a tool or a problem, and whether you are still holding the handle.`],
    choices: [
      { id: 'dial_down', label: `Promise to dial it back with {rival.first}`, risk: 'low', result: `The producer nods and writes down a time for you both to rehearse. The next match is tidier, and the crowd's boos are a few decibels more polite.`, effects: [{ pop: -0.3 }, { conf: -1 }, { fatigue: -3 }, { rel: { who: 'rival', respect: 2 } }] },
      { id: 'signals', label: `Agree on hand signals with {rival.first}, then keep it stiff`, risk: 'med', result: `You and {rival.first} sit down with a notepad and build a system of taps and shrugs. The matches stay hard and the producer stops worrying, though your elbows pay for it.`, effects: [{ rel: { who: 'rival', trust: 5, respect: 4 } }, { pop: 0.3 }, { fatigue: 6 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'blame', label: `Point out that {rival.first} started it`, risk: 'med', result: `The producer listens, nods, and files you under people who pass blame at the first chance. {rival.first} hears about it by the end of the night.`, effects: [{ rel: { who: 'rival', heat: 7, respect: -3 } }, { conf: -2 }] },
      { id: 'defend', label: `Insist the realism is what sells the feud`, risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.4, confidence: 0.3 }, text: `Your case is clean, with ticket numbers and replay clips. The producer concedes the point and says to keep it exactly as rough as it is, as long as nobody gets carried out.`, effects: [{ pop: 0.6 }, { conf: 3 }, { fatigue: 5 }] },
        { weight: 1, text: `The producer is not moved, and the next match comes with a babysitter in the form of an extra referee. The feud is watched more carefully than you wanted.`, effects: [{ pop: -0.2 }, { conf: -2 }, { fatigue: 4 }] } ] },
    ],
  },
  {
    id: 'ni_riv_signing_tables', category: 'rivalry', title: `Adjacent Tables, Unequal Lines`, weight: 2, contexts: ['weekly', 'show_day'], cooldownDays: 160, maxPerCareer: 2, categoryCooldown: 5,
    cast: { rival: { pick: 'rivalry', minHeat: 20 } }, memory: { role: 'rival', max: 1 },
    trigger: { stat: { popularity: { gte: 20 } } },
    slots: { venue: [`a convention center ballroom`, `a collectors' show in a hotel`, `a charity fan fest in a parking lot`], lines: [`the line for {rival.name} is visibly longer`, `the two lines are almost exactly the same length`, `the line for you wraps twice around the room`] },
    body: [`At {venue} you are seated at the table next to {rival.name}, and {lines}. A volunteer in a bright vest keeps nervously pushing the tables closer together.`, `Fans are not interested in your feud, only in the next autograph. That makes it the only place where the two of you are really, quietly, in competition.`],
    choices: [
      { id: 'warm', label: `Be gracious and send fans over to {rival.first}`, risk: 'low', result: `A father with two small kids gets steered across the gap, and {rival.first} gives them a double high-five. The goodwill is real, and it costs you a few minutes of line time.`, effects: [{ pop: 0.3 }, { rel: { who: 'rival', respect: 5, heat: -3 } }, { fatigue: 2 }] },
      { id: 'work_line', label: `Work your line hard: every fan gets a story`, risk: 'med', result: `The photos run long and the jokes are fresh, and by the afternoon you have a line of happy strangers and a sore hand. The numbers on the sign-in sheet make you smile.`, effects: [{ pop: 0.7 }, { fatigue: 7 }, { conf: 2 }] },
      { id: 'jab', label: `Jab at {rival.first} over the divider, loud enough for fans`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5 }, text: `The line howls, {rival.first} fires back with a better joke, and a few phones record all of it. The two of you give a free show that sells more than any table.`, effects: [{ pop: 0.8 }, { rivalry: { who: 'rival', heat: 6 } }, { conf: 2 }] },
        { weight: 1, text: `The jab lands wrong in front of a family, and a volunteer asks you to keep it civil. The photo pile thins out right on schedule.`, effects: [{ pop: -0.4 }, { conf: -2 }, { rel: { who: 'rival', heat: 3 } }] } ] },
      { id: 'leave_early', label: `Wrap up early and head to the car`, risk: 'low', result: `You sign what is left and slip out the service door while the line still has people in it. Nobody can complain about your numbers, and the volunteers look at you as if you stole a cake.`, effects: [{ fatigue: -5 }, { pop: -0.4 }, { conf: -1 }] },
    ],
  },
  {
    id: 'ni_riv_advice', category: 'rivalry', title: `{rival.name} Wants Your Advice`, weight: 2, cooldownDays: 180, maxPerCareer: 2, categoryCooldown: 5,
    cast: { rival: { pick: 'rivalry', minHeat: 15 } }, memory: { role: 'rival', max: 2 },
    trigger: { mem: [{ role: 'rival', respectGte: 8 }] },
    slots: { how: [`with a tight jaw`, `while pretending to read the call sheet`, `in a flat voice, like a student reciting a card`], topic: [`how you stay calm in front of a hostile crowd`, `whether a big match on short notice is worth the risk`, `how you sleep on the road`] },
    body: [`{rival.name} corners you {how} and asks {topic}. It is the least expected question a rival could ask, and the asking has clearly taken most of a week.`, `Whatever you say is a gift, a weapon or a clue, depending on how well the two of you can hide your motives. The hallway has gone very quiet for a hallway.`],
    choices: [
      { id: 'honest', label: `Give a complete and honest answer`, risk: 'low', result: `You tell it straight, with the ugly parts: the bad nights, the habits that work, the ones that do not. {rival.first} writes nothing down, which you take as a sign of how closely {rival.they} listened.`, effects: [{ rel: { who: 'rival', respect: 7, trust: 4, heat: -5 } }, { fatigue: 2 }, { conf: 1 }] },
      { id: 'bad_tip', label: `Give an answer that sounds good but backfires`, risk: 'high', outcomes: [
        { weight: 1, text: `The tip works for exactly nobody, and {rival.first} figures it out by the end of the week. The scowl at the next show tells you everything.`, effects: [{ rel: { who: 'rival', trust: -9, heat: 9 } }, { rivalry: { who: 'rival', heat: 8 } }, { conf: -2 }] },
        { weight: 1, text: `It sounds so reasonable that {rival.first} uses it and suffers a bad night. You are not sure whether you feel clever or mean, and settle on both.`, effects: [{ rel: { who: 'rival', heat: 5 } }, { pop: 0.2 }, { conf: 1 }] } ] },
      { id: 'trade', label: `Offer to trade answers: you want something back`, risk: 'med', result: `You trade your answer for one of {rival.their} own, and the exchange is more honest than either expected. It is not friendship, but it is a rare deal between equals.`, effects: [{ rel: { who: 'rival', respect: 4, trust: 2 } }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 3 }] },
      { id: 'joke', label: `Deflect with a joke and walk on`, risk: 'low', result: `The joke is good, and {rival.first} laughs once, shortly, with the look of someone who has just been told a door is not going to open. You keep your secrets, and your reputation for being hard to read.`, effects: [{ rel: { who: 'rival', respect: -2 } }, { conf: 1 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'ni_riv_side_bet', category: 'rivalry', title: `{rival.name} Wants a Wager`, weight: 2, cooldownDays: 140, maxPerCareer: 2, categoryCooldown: 5,
    cast: { rival: { pick: 'rivalry', minHeat: 20 } }, memory: { role: 'rival', max: 1, noResults: true },
    trigger: { mem: [{ role: 'rival', heatGte: 15 }] },
    slots: { manner: [`with a handshake held a beat too long`, `scrawled on a napkin`, `shouted across catering`], stake: [`the loser carries the winner's bags for a month`, `the loser buys dinner for the whole ring crew`, `the loser walks to the ring in a ridiculous hat`] },
    body: [`{rival.name} proposes a private wager on your next match, {manner}: {stake}. Everyone within earshot pretends to be extremely interested in their food.`, `It is a small stake with a large meaning. Whatever happens in the ring, how you handle this will be repeated in the locker room for weeks.`],
    choices: [
      { id: 'accept', label: `Shake on it and book the match`, risk: 'med', result: `A signed napkin and a handshake later, the match is booked and both of you are noticeably more serious about it. The office loves a stake and has no idea what it is.`, effects: [{ booking: { who: 'rival', type: 'singles' } }, { rel: { who: 'rival', respect: 3 } }, { pop: 0.3 }, { fatigue: 3 }] },
      { id: 'raise', label: `Raise the stakes and make it public`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.3 }, text: `Your counteroffer is booming and specific, and it fills the catering tent with delighted noise. The match builds itself, and a stakes promo you didn't plan gets cut together by lunch.`, effects: [{ booking: { who: 'rival', type: 'singles' } }, { rivalry: { who: 'rival', heat: 10 } }, { pop: 0.8 }, { conf: 2 }] },
        { weight: 1, text: `The raise sounds desperate, and {rival.first} takes it with a lazy grin. Now you have a bigger bet and fewer places to hide.`, effects: [{ booking: { who: 'rival', type: 'singles' } }, { conf: -3 }, { pop: -0.1 }] } ] },
      { id: 'decline', label: `Turn it down and say the match is the only stake`, risk: 'low', result: `{rival.first} shrugs and calls it sensible. The room decides you are either disciplined or scared, and for a day nobody can tell which.`, effects: [{ rel: { who: 'rival', respect: 1 } }, { conf: 1 }, { pop: -0.1 }] },
      { id: 'charity', label: `Counter with a stake that helps a local charity`, risk: 'med', result: `{rival.first} stares at you for a second, then agrees, and the donation is announced in a gracious little press release. Nobody remembers the bags or the hat, only that there was a good reason to care.`, effects: [{ money: -400 }, { pop: 0.5 }, { rel: { who: 'rival', respect: 3 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'ni_riv_impressionist', category: 'rivalry', title: `{kid.name} Does an Impression of You Both`, weight: 1.5, cooldownDays: 160, maxPerCareer: 2, categoryCooldown: 5,
    cast: { rival: { pick: 'rivalry', minHeat: 20 }, kid: { pick: 'roster', tier: { lte: 1 }, sameBrand: true } }, memory: { role: 'rival', max: 1 },
    trigger: { stat: { popularity: { gte: 15 } } },
    slots: { bit: [`a loving impression of both of you, complete with the glare`, `a slow-motion parody of your staredowns`, `a two-voice mock promo with the pair of you in it`], audience: [`to a table of ring crew`, `to the whole catering tent`, `to anyone who stands still long enough`] },
    body: [`{kid.name} has been doing {bit}, {audience}. It is, by common agreement, devastatingly accurate, and every wrestler who has watched it has had to look at the ceiling.`, `{rival.name} finds out about it at the same moment you do, from the same direction. For the first time in a long while the two of you are on the same side of a joke.`],
    choices: [
      { id: 'laugh', label: `Laugh along with {rival.first} and ask for an encore`, risk: 'low', result: `You and {rival.first} sit in the front row for a second performance, and the kid bows twice. The feud takes a half-hour break and everyone watching can feel it.`, effects: [{ rel: { who: 'rival', affinity: 5, heat: -4 } }, { rel: { who: 'kid', affinity: 4, trust: 3 } }, { fatigue: -2 }, { pop: -0.1 }] },
      { id: 'shut_down', label: `Tell {kid.first} to lose the act before it gets worse`, risk: 'med', result: `{kid.first} blinks, nods and stops. A few people say you are protecting your image, which is a clean description of what you are doing.`, effects: [{ rel: { who: 'kid', respect: -4, trust: -3 } }, { conf: 1 }, { rel: { who: 'rival', respect: 1 } }] },
      { id: 'angle', label: `Pitch the impression as an angle to creative`, risk: 'med', result: `Creative loves it and builds a three-way skit around the idea. The kid gets a spotlight, the feud gets fresh air, and neither of you is certain how much to claim of it.`, effects: [{ pop: 0.6 }, { rel: { who: 'kid', trust: 5, respect: 3 } }, { rivalry: { who: 'rival', heat: 3 } }, { fatigue: 4 }] },
      { id: 'counter', label: `Join in and do your own impression of {rival.first}`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, mic: 0.3 }, text: `Your version of {rival.first} is mean, brilliant and has everyone in tears. {rival.first} laughs, begrudgingly, and says you owe {rival.them} one.`, effects: [{ pop: 0.5 }, { rel: { who: 'rival', respect: 3, heat: 3 } }, { conf: 3 }] },
        { weight: 1, text: `The impression goes a half-step too far and the laughter dies in layers. {rival.first} leaves the tent without a word.`, effects: [{ rel: { who: 'rival', heat: 8, respect: -3 } }, { rivalry: { who: 'rival', heat: 6 } }, { conf: -3 }] } ] },
    ],
  },
  {
    id: 'ni_riv_truce_visit', category: 'rivalry', title: `A Truce for One Afternoon`, weight: 2, contexts: ['weekly', 'show_day'], cooldownDays: 180, maxPerCareer: 2, categoryCooldown: 5,
    cast: { rival: { pick: 'rivalry', minHeat: 20 } }, memory: { role: 'rival', max: 2 },
    trigger: { stat: { popularity: { gte: 20 } }, mem: [{ role: 'rival', heatGte: 15 }] },
    slots: { visit: [`a children's hospital ward`, `a retirement home`, `a school assembly`], request: [`to pose arm in arm for the newspaper`, `to share one table and one microphone`, `to hand out the gifts as a pair`] },
    body: [`The company has booked you and {rival.name} for {visit}, billed as a truce for one afternoon. The organizers want you both {request}, and they have no idea what the two of you have done to each other.`, `The cameras will be there and so will the people who matter more than the cameras. Rivals do not usually get this kind of test, and nobody warns you what it is graded on.`],
    choices: [
      { id: 'sincere', label: `Be warm and let the afternoon be about the people`, risk: 'low', result: `A staff member tells you that guests rarely work a crowd so gently. The ride back is quiet, and {rival.first} says, a mile before the venue, that you were good with them.`, effects: [{ pop: 0.5 }, { rel: { who: 'rival', respect: 5, heat: -5 } }, { fatigue: 4 }, { conf: 2 }] },
      { id: 'in_character', label: `Stay in character and give the cameras a show`, risk: 'med', result: `The organizers' faces go through several expressions. The cameras eat it up, the kids laugh, and your feud gets a rare breath of free publicity.`, effects: [{ pop: 0.7 }, { rivalry: { who: 'rival', heat: 5 } }, { fatigue: 3 }, { conf: 1 }] },
      { id: 'steal', label: `Outshine {rival.first} in every photograph`, risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `You find the right angle in each frame and the right kid to kneel next to. The newspaper picks your shot, and {rival.first} notices exactly why.`, effects: [{ pop: 0.9 }, { rel: { who: 'rival', heat: 6, respect: -2 } }, { conf: 2 }] },
        { weight: 1, text: `A staff member spots the elbowing for the camera and mentions it, kindly, to a producer. The afternoon ends with a small chill and an unplanned lecture.`, effects: [{ pop: -0.4 }, { conf: -3 }, { rel: { who: 'rival', heat: 4 } }] } ] },
      { id: 'skip', label: `Do your part and slip out before the group photo`, risk: 'low', result: `You sign what needs signing, hand out your share and are on the road by the time the newspaper arrives. No one calls it rude, though the organizers are a little disappointed.`, effects: [{ pop: -0.2 }, { fatigue: -3 }, { conf: -1 }] },
    ],
  },
  // ======================= PERSONAL =======================
  {
    id: 'ni_per_voicemail', category: 'personal', title: `A Voicemail from Home`, weight: 2, contexts: ['weekly', 'post_show'], cooldownDays: 180, maxPerCareer: 3, categoryCooldown: 8,
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { caller: [`your mother`, `an old friend from before the business`, `your oldest neighbor`], moment: [`after a show in a town you will not remember`, `in a hotel room with the television muted`, `on a loading dock at midnight`] },
    body: [`You find a voicemail from {caller} {moment}. It runs two minutes, wanders through four subjects and says nothing important, and you play it twice anyway.`, `The business asks for everything except the quiet parts of a life, and those parts keep going without you. The message ends on the words "no need to call back," which is how people say please call back.`],
    choices: [
      { id: 'call_now', label: `Call back right now, however late it is`, risk: 'low', result: `The line picks up on the second ring, and the conversation goes on for an hour about nothing in particular. You sleep badly and happily.`, effects: [{ conf: 4 }, { fatigue: 5 }] },
      { id: 'weekend', label: `Save the call for a proper day off`, risk: 'low', result: `The voicemail sits on your phone like a plant that needs watering. When you finally call, the pause before the first word is a little longer than it used to be.`, effects: [{ conf: -2 }, { fatigue: -3 }] },
      { id: 'send_gift', label: `Send flowers and a card with a long note inside`, risk: 'low', requires: { stat: { money: { gte: 150 } } }, result: `The note takes three drafts and one honest sentence you almost cut. The reply, when it comes, is one line long and clearly written with a damp thumb.`, effects: [{ money: -120 }, { conf: 3 }, { fatigue: 1 }] },
      { id: 'text_back', label: `Send a quick message and promise to call soon`, risk: 'med', result: `The reply arrives in seconds, bright and understanding, and it lands heavier than a complaint would have. The promise stays on your list with a faint hum.`, effects: [{ conf: -1 }, { fatigue: 1 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'ni_per_mentor_note', category: 'personal', title: `A Note from {mentor.name}`, weight: 2.5, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 8,
    cast: { mentor: { pick: 'tag', tag: 'mentor' } }, memory: { role: 'mentor', max: 1 },
    trigger: { mem: [{ role: 'mentor', tag: 'mentor' }] },
    slots: { how: [`a postcard`, `a long voicemail`, `a note left at the front desk`], seen: [`you have been carrying your shoulders higher lately`, `your promos are starting to sound like everyone else's`, `your matches look tired by the third minute`] },
    body: [`{mentor.name} reaches out with {how}, and the only line that matters says {seen}. It is meant kindly, and it hits the exact spot you had hoped nobody would find.`, `The bond between you is old enough that honesty comes without padding. That is a rare gift in a building where most compliments have a price tag.`],
    choices: [
      { id: 'listen', label: `Call {mentor.first} and ask what to change`, risk: 'low', result: `The call runs long and gets practical, with homework and a strict deadline. You hang up lighter than you have felt in weeks, and a little afraid of the homework.`, effects: [{ rel: { who: 'mentor', trust: 5, affinity: 4 } }, { attr: { name: 'psychology', delta: 1 } }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'bristle', label: `Write back that you are fine and know what you are doing`, risk: 'med', result: `The reply is polite and a little frosty, and the answer that comes back is one line: "Good." You feel defensive, then ashamed, then defensive again.`, effects: [{ rel: { who: 'mentor', trust: -4, affinity: -3 } }, { conf: 1 }, { fatigue: 1 }] },
      { id: 'test_it', label: `Try the correction quietly in your next match`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.3, confidence: 0.3 }, text: `You adjust without announcing it, and the match is sharper for it. Afterward you send a single line of thanks, and {mentor.first} replies with a thumbs-up drawn in ink.`, effects: [{ rel: { who: 'mentor', respect: 3, trust: 3 } }, { pop: 0.4 }, { conf: 3 }, { fatigue: 4 }] },
        { weight: 1, text: `The change feels strange in your body, and the match is stiff for it. You decide it is a work in progress, which is another way of saying you are tired.`, effects: [{ conf: -2 }, { fatigue: 5 }, { pop: -0.1 }] } ] },
      { id: 'invite', label: `Invite {mentor.first} to watch a show in person`, risk: 'low', result: `{mentor.first} arrives in a coat that has seen worse arenas, sits in the cheap seats and takes notes on a napkin. Nobody in the building knows that the most important critic of the night is in row Q.`, effects: [{ rel: { who: 'mentor', trust: 4, respect: 3 } }, { money: -150 }, { conf: 3 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'ni_per_ally_invite', category: 'personal', title: `{ally.name} Invites You to {event}`, weight: 2, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 8,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1 },
    trigger: { stat: { careerYears: { gte: 1 } }, mem: [{ role: 'ally', trustGte: 10 }] },
    slots: { event: [`a wedding`, `a graduation party`, `a fiftieth birthday`], clash: [`on the same night as a televised card`, `two states away from your next booking`, `the morning after a very long travel day`] },
    body: [`{ally.name} hands you a printed invitation to {event}, held {clash}. There is no pressure in the way it is offered, and a lot of pressure in the way it is not.`, `Nobody in the business has a calendar they can honestly defend. The question is not what you can fit in, but what you would regret missing.`],
    choices: [
      { id: 'attend_fully', label: `Clear the schedule and stay for the whole thing`, risk: 'med', result: `You dance badly, eat cake out of someone's hand and learn the names of three relatives. The office grumbles about the day off, and {ally.first} will remember who was there.`, effects: [{ rel: { who: 'ally', trust: 7, affinity: 8 } }, { pop: -0.3 }, { fatigue: -4 }, { conf: 3 }] },
      { id: 'show_up', label: `Show up for an hour and then catch the late flight`, risk: 'med', result: `You are there for the speeches and the first dance, then slip out with a bag of leftovers and a promise. It is not perfect, but it is something in the right shape.`, effects: [{ rel: { who: 'ally', trust: 3, affinity: 3 } }, { fatigue: 6 }, { conf: 1 }] },
      { id: 'gift', label: `Send a generous gift and your regrets`, risk: 'low', requires: { stat: { money: { gte: 400 } } }, result: `The gift is a good one, and it comes with a note that says all the right things in your handwriting. {ally.first} understands, and the absence has an outline anyway.`, effects: [{ money: -350 }, { rel: { who: 'ally', trust: 1, affinity: 1 } }, { fatigue: -1 }] },
      { id: 'decline', label: `Decline honestly and explain what the week looks like`, risk: 'low', result: `{ally.first} says it is fine in the tone people use when it is mostly fine. You work the booking you had and feel the weight of a seat that nobody filled.`, effects: [{ rel: { who: 'ally', trust: -2, respect: 2 } }, { pop: 0.2 }, { conf: -2 }] },
    ],
  },
  {
    id: 'ni_per_old_bag', category: 'personal', title: `The Bag from the First Year`, weight: 1.5, contexts: ['weekly', 'offseason'], cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 8,
    trigger: { stat: { careerYears: { gte: 5 } } },
    slots: { item: [`your first pair of boots`, `a hand-sewn ring jacket`, `a stack of photographs from the earliest shows`], place: [`in a storage unit`, `at the back of a hotel closet`, `in a relative's garage`] },
    body: [`You find {item} {place}, folded into a bag that smells like old rosin and carpet. The stitching has given up in two places, and the photographs, if they were photographs, are darker than you remember.`, `It is a small museum of the person who thought this might work out. That person looks younger than you, and a good deal less tired.`],
    choices: [
      { id: 'keep', label: `Keep it and put it where you can see it`, risk: 'low', result: `It goes on a shelf above the television, and you catch yourself looking at it while the kettle boils. It is not exactly comfort, but it is company.`, effects: [{ conf: 4 }, { fatigue: -2 }] },
      { id: 'give_trainee', label: `Give it to a trainee who could use the luck`, risk: 'low', result: `The trainee holds it as if it might break and says nothing for a while. You walk away feeling you have passed on something, and aware of how much lighter your bag is.`, effects: [{ conf: 3 }, { pop: 0.2 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'auction', label: `Put it up for a charity auction`, risk: 'med', result: `A collector pays more than it is worth, and the cause gets a check that makes the staff sit up straight. You miss it for exactly one evening.`, effects: [{ money: -150 }, { pop: 0.6 }, { conf: 1 }] },
      { id: 'bin', label: `Let it go and move on`, risk: 'low', result: `The bag goes in a skip and you walk away without checking whether you meant it. A small part of you notices that you walked away quickly.`, effects: [{ conf: -2 }, { fatigue: -1 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'ni_per_sleep_debt', category: 'personal', title: `The Doctor Asks About Sleep`, weight: 2, contexts: ['weekly', 'pre_show'], cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 8,
    cast: { doctor: { pick: 'staff', role: 'doctor' } }, noAutoMemory: true,
    trigger: { stat: { fatigue: { gte: 55 } } },
    slots: { sign: [`hands that shake slightly at rest`, `a headache that never fully leaves`, `a habit of forgetting where you parked`], advice: [`two full days of nothing`, `a week off the road`, `cutting your caffeine in half`] },
    body: [`{doctor.name} listens to a list of complaints that you think of as separate, and ties them all to the same string: {sign}. The prescription is {advice}, delivered with a look that suggests this speech has been ignored before.`, `The schedule does not take advice. It takes bodies, and it will take yours without noticing the price.`],
    choices: [
      { id: 'obey', label: `Follow the advice to the letter`, risk: 'low', result: `The first day feels wasted, the second feels strange and the third feels like a miracle. You return to work with a clean head and a faint worry that the office will notice the gap.`, effects: [{ fatigue: -20 }, { pop: -0.4 }, { conf: 3 }] },
      { id: 'half', label: `Do half of it and call it a compromise`, risk: 'med', result: `You find a way to rest on the bus, say no to one appearance and sleep on a hotel floor with a folded towel. It helps a bit, and the lingering ache stays a tenant.`, effects: [{ fatigue: -9 }, { pop: -0.1 }, { conf: 1 }] },
      { id: 'push', label: `Push through and promise to rest after the next big show`, risk: 'high', outcomes: [
        { weight: 1, bonus: { toughness: 0.3 }, text: `The big show goes off without a hitch, and the adrenaline covers the cost. You collapse for fourteen hours afterward and wake up unsure what day it is.`, effects: [{ pop: 0.6 }, { fatigue: 8 }, { conf: 2 }] },
        { weight: 1, text: `Midway through a match your vision swims and a spot goes wrong in slow motion. You finish it, but the ice pack and the apology are both warranted.`, effects: [{ fatigue: 10 }, { conf: -4 }, { injury: { part: 'torso', severity: 1, days: 9 } }] } ] },
      { id: 'routine', label: `Ask {doctor.first} to help design a real routine`, risk: 'low', result: `{doctor.first} draws a weekly grid on the back of a prescription pad, with fixed hours, fixed meals and one marked-off nap. It is dull, and it works better than heroics.`, effects: [{ fatigue: -12 }, { attr: { name: 'endurance', delta: 1 } }, { conf: 1 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'ni_per_respect_note', category: 'personal', title: `{admirer.name} Has Something for You`, weight: 2, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 8,
    cast: { admirer: { pick: 'tag', tag: 'respected_by' } }, memory: { role: 'admirer', max: 1 },
    trigger: { mem: [{ role: 'admirer', tag: 'respected_by' }] },
    slots: { note: [`a folded sheet of hotel stationery`, `a card with a hand-drawn star on the front`, `a letter in careful block capitals`], ask: [`asking for ten minutes after the show`, `thanking you for a kindness you barely remember`, `wanting to know how you handle losing`] },
    body: [`{admirer.name} presses {note} into your hand and walks away before you can open it. It runs six lines, {ask}.`, `You have spent years being the person other people are worried about. It is odd to be reminded that somewhere in the building there is a person who watches you for different reasons.`],
    choices: [
      { id: 'meet', label: `Find {admirer.first} and give the full ten minutes`, risk: 'low', result: `You end up on a stack of equipment cases talking about things neither of you says on camera. {admirer.first} leaves with straighter shoulders, and you suspect yours are straighter too.`, effects: [{ rel: { who: 'admirer', trust: 6, respect: 3, affinity: 4 } }, { conf: 3 }, { fatigue: 3 }] },
      { id: 'reply', label: `Write back a short, warm answer`, risk: 'low', result: `You write four lines and sign them, which takes longer than expected. It is enough, and it takes much less out of you than a conversation would.`, effects: [{ rel: { who: 'admirer', trust: 2, affinity: 2 } }, { conf: 2 }, { fatigue: 1 }] },
      { id: 'mentor_them', label: `Offer to look at {admirer.their} work in the ring`, risk: 'med', result: `The offer turns into a ritual of late-night drills, and you find you like the sound of someone else's improvement. It costs you rest and gives you something rare to show for it.`, effects: [{ event: { type: 'mentorship', participants: ['admirer'], summary: `Took {admirer.name} under {player.name}'s wing after a note of thanks.`, importance: 3, data: { byPlayer: true } } }, { fatigue: 7 }, { conf: 2 }, { pop: 0.2 }] },
      { id: 'keep_distance', label: `Keep it friendly but keep your distance`, risk: 'low', result: `A nod in the hallway is all you give. It is neither cruel nor kind, and {admirer.first} accepts it with a grace that makes you feel worse.`, effects: [{ rel: { who: 'admirer', affinity: -3 } }, { fatigue: -1 }, { conf: -1 }] },
    ],
  },
  {
    id: 'ni_per_reconciled_supper', category: 'personal', title: `Supper with {ex.name}`, weight: 2, contexts: ['weekly', 'post_show'], cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 8,
    cast: { ex: { pick: 'tag', tag: 'reconciled' } }, memory: { role: 'ex', max: 2 },
    trigger: { mem: [{ role: 'ex', tag: 'reconciled' }] },
    slots: { place: [`a diner off the interstate`, `a hotel bar near closing time`, `a gas station picnic table`], topic: [`the old days`, `what each of you would do differently`, `nothing in particular`] },
    body: [`{ex.name} suggests supper at {place}, and for the first hour the conversation circles {topic} like a cat in a strange room. The food arrives, gets cold and does not matter.`, `It is the first long evening you have shared since things were repaired. Both of you are being careful, as if the table were a tightrope and the plates were weights.`],
    choices: [
      { id: 'open_up', label: `Tell {ex.first} one thing you have never said aloud`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, confidence: 0.3 }, text: `You tell it badly and honestly, and {ex.first} does not look away. By dessert the table feels as if it were built for the two of you.`, effects: [{ rel: { who: 'ex', trust: 9, affinity: 7 } }, { conf: 3 }, { fatigue: 2 }] },
        { weight: 1, text: `The confession lands heavier than you meant it to, and {ex.first} goes quiet for far too long. The check arrives, and you both reach for it as a rescue.`, effects: [{ rel: { who: 'ex', trust: -2, affinity: -2 } }, { conf: -3 }] } ] },
      { id: 'keep_light', label: `Keep it light and funny and pay the check`, risk: 'low', result: `The stories are good, the laughter is real and nothing important gets touched. It is a pleasant night, and it leaves a fine, clean, unexamined silence under the table.`, effects: [{ rel: { who: 'ex', affinity: 4, trust: 1 } }, { money: -80 }, { conf: 1 }, { fatigue: -2 }] },
      { id: 'ask_question', label: `Ask {ex.first} what it was like from the other side`, risk: 'med', result: `The answer takes twenty minutes and is not flattering. It is also fair, and you leave with a new picture of yourself that you did not order.`, effects: [{ rel: { who: 'ex', respect: 6, trust: 3 } }, { conf: -2 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 3 }] },
      { id: 'leave_early', label: `Plead an early call and leave before dessert`, risk: 'low', result: `You hug it out in the lot and promise a rematch. The excuse was true enough, and it is the third time you have used it this month.`, effects: [{ rel: { who: 'ex', affinity: -3, trust: -1 } }, { fatigue: -3 }] },
    ],
  },
  {
    id: 'ni_per_road_birthday', category: 'personal', title: `A Birthday in {place}`, weight: 1.5, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 8,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1 },
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { place: [`a highway motel`, `an airport gate`, `a gym in a small town`], gesture: [`a cupcake with a lit candle`, `a voicemail sung badly on purpose`, `a card signed by the whole crew`] },
    body: [`Your birthday arrives in {place} with no ceremony, and {ally.name} is the only person who noticed. {ally.first} turns up with {gesture}, looking quietly pleased.`, `You had planned to ignore the date, which has worked for years. It feels different when someone declines to let you.`],
    choices: [
      { id: 'celebrate', label: `Let it be a real celebration and call everyone over`, risk: 'med', result: `Within half an hour there are nine people and a lopsided cake from the vending machine. Everyone sings out of tune, and the front desk files a noise complaint with obvious affection.`, effects: [{ rel: { who: 'ally', affinity: 6, trust: 3 } }, { conf: 3 }, { fatigue: 4 }, { money: -90 }] },
      { id: 'quiet', label: `Share a quiet piece of cake with {ally.first} and no one else`, risk: 'low', result: `The two of you sit on the edge of the bed and say very little. It is the best birthday you have had in years, and neither of you mentions it afterward.`, effects: [{ rel: { who: 'ally', affinity: 7, trust: 5 } }, { conf: 3 }, { fatigue: -2 }] },
      { id: 'train', label: `Say thanks and go for your usual workout anyway`, risk: 'low', result: `The weights do not care what day it is, and neither, loudly, do you. {ally.first} lets it go, with the sigh of someone who has seen this before.`, effects: [{ attr: { name: 'endurance', delta: 1 } }, { fatigue: 5 }, { rel: { who: 'ally', affinity: -2 } }] },
      { id: 'call_home', label: `Excuse yourself and call home for an hour`, risk: 'low', result: `The call is warm and long, and you are tempted to tell every person on it that you miss them. {ally.first} understands, and the cupcake keeps.`, effects: [{ conf: 4 }, { fatigue: 2 }, { rel: { who: 'ally', affinity: 1 } }] },
    ],
  },
  {
    id: 'ni_per_late_fan', category: 'personal', title: `The Stranger at {place}`, weight: 2, contexts: ['post_show', 'weekly'], cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 8,
    cast: { fan: { pick: 'media', kind: 'fan' } }, noAutoMemory: true,
    trigger: { stat: { popularity: { gte: 20 } } },
    slots: { place: [`a diner at one in the morning`, `an airport café`, `a gas station counter`], story: [`says your matches were the first thing they laughed at after a hard year`, `explains that your entrance music got them through a difficult commute`, `asks you to say hello to a little kid over a video call`] },
    body: [`A stranger in a nondescript jacket hesitates at your table for a long moment before speaking. {fan.name} {story}, and has clearly practised it, which makes it more moving than a fluent version would have been.`, `You were hoping to eat and be invisible. The gift of this business is that every so often invisibility is taken away and replaced with an unexpected meaning.`],
    choices: [
      { id: 'sit', label: `Invite {fan.first} to sit and finish the meal together`, risk: 'low', result: `It is the best conversation you have had all week, about nothing and everything. {fan.first} pays for the pie, and you let them.`, effects: [{ pop: 0.4 }, { conf: 4 }, { fatigue: 3 }] },
      { id: 'photo', label: `Say thanks, take a photo and head out`, risk: 'low', result: `The photo goes up on a wall somewhere, and you have a warm glow all the way to the hotel. You also have a faint sense that you declined something more valuable.`, effects: [{ pop: 0.2 }, { conf: 1 }, { fatigue: -1 }] },
      { id: 'call_kid', label: `Take the call and say hello to the kid`, risk: 'med', result: `The kid is shy for a full minute and then asks if you can do a flip. You try something modest on the sticky tile and everyone in the diner applauds.`, effects: [{ pop: 0.5 }, { conf: 3 }, { fatigue: 3 }, { injury: { part: 'legs', severity: 1, days: 3 } }] },
      { id: 'excuse', label: `Say you are wiped out and ask for a rain check`, risk: 'low', result: `The stranger nods, polite and a bit deflated, and goes back to the counter. You finish your coffee in a silence of your own making.`, effects: [{ pop: -0.2 }, { fatigue: -3 }, { conf: -2 }] },
    ],
  },
  {
    id: 'ni_per_rival_delay', category: 'personal', title: `Delayed Together: {rival.name} and You`, weight: 2, cooldownDays: 180, maxPerCareer: 2, categoryCooldown: 8,
    cast: { rival: { pick: 'rivalry', minHeat: 20 } }, memory: { role: 'rival', max: 2 },
    trigger: { mem: [{ role: 'rival', heatGte: 15 }] },
    slots: { delay: [`a six-hour delay`, `a cancelled connection`, `a long wait on the runway with the engines off`], seat: [`two chairs from you at the gate`, `across the aisle with nowhere to go`, `in the only open seat in the café`] },
    body: [`{delay} has stranded half the roster at the airport, and {rival.name} ends up {seat}. There is no show to protect and no camera crew to impress, only a long afternoon of recycled air.`, `The conversation starts as a grunt about the weather, which is the only subject two enemies can share safely. It does not stay there.`],
    choices: [
      { id: 'cards', label: `Pull out a deck of cards and offer a hand`, risk: 'low', result: `{rival.first} stares at the cards for a full minute before saying "deal." The game runs for four hours, with a little cheating on both sides, and the feud sits quietly under the table.`, effects: [{ rel: { who: 'rival', affinity: 5, respect: 3, heat: -4 } }, { fatigue: -2 }, { conf: 1 }] },
      { id: 'ask_real', label: `Ask {rival.first} why this matters so much`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The answer arrives slowly and is more personal than you expected. By the time boarding starts you have a better picture of what {rival.first} is actually fighting.`, effects: [{ rel: { who: 'rival', respect: 7, trust: 3 } }, { conf: 2 }, { fatigue: 2 }] },
        { weight: 1, text: `{rival.first} reads the question as an interrogation and shuts down, then goes to find a different gate. The afternoon turns long and awkward.`, effects: [{ rel: { who: 'rival', heat: 4 } }, { conf: -2 }, { fatigue: 3 }] } ] },
      { id: 'avoid', label: `Find a quiet corner and put in your headphones`, risk: 'low', result: `You get through a book you had promised to finish and three-quarters of a nap. {rival.first} either never noticed you were avoiding {rival.them}, or noticed perfectly well.`, effects: [{ fatigue: -6 }, { conf: 1 }] },
      { id: 'needle', label: `Keep the feud going with a quiet needle every hour`, risk: 'med', result: `The jabs are small and specific, and {rival.first} bats them aside with an increasingly familiar laugh. By hour four, the two of you are performing for no one and enjoying it.`, effects: [{ rivalry: { who: 'rival', heat: 4 } }, { rel: { who: 'rival', respect: 2 } }, { pop: 0.1 }, { fatigue: 3 }] },
    ],
  },
  {
    id: 'ni_per_big_purchase', category: 'personal', title: `What Is the Money For?`, weight: 1.5, contexts: ['weekly', 'offseason'], cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 8,
    trigger: { stat: { money: { gte: 25000 }, careerYears: { gte: 2 } } },
    slots: { temptation: [`a restored vintage truck`, `a down payment on a house`, `a studio loft near the city`], voice: [`an advisor with a spreadsheet`, `a cousin with a business idea`, `your own tired shoulders`] },
    body: [`Your account balance has crept past the point where it feels like an accident, and there is {temptation} in the picture. {voice} has an opinion about what to do next, and none of the opinions agree.`, `Money earned by the minute in a ring has a way of leaving the same way it came. The only real question is whether you spend it on a life, a plan or a feeling.`],
    choices: [
      { id: 'spend', label: `Buy the thing you have been dreaming about`, risk: 'med', result: `It arrives with a bow, a tank of fuel and a grin you cannot suppress. The dream turns out to be as good as advertised, and also costs more per month than you hoped.`, effects: [{ money: -18000 }, { conf: 5 }, { fatigue: -4 }] },
      { id: 'save', label: `Put most of it somewhere dull and safe`, risk: 'low', result: `The paperwork is three hours long and wildly unexciting. You walk out poorer in feeling and richer in everything that counts later.`, effects: [{ money: 3000 }, { conf: 1 }, { fatigue: 2 }] },
      { id: 'invest', label: `Back a friend's small business`, risk: 'high', outcomes: [
        { weight: 1, text: `The business is a surprise hit, and a check arrives with a note that says nothing but thank you. You get to be a person with a share in something that is not wrestling.`, effects: [{ money: 9000 }, { conf: 4 }, { pop: 0.2 }] },
        { weight: 1, text: `The business closes within a year, in the quiet way small businesses do. You lose the money and keep the friendship, but only just.`, effects: [{ money: -9000 }, { conf: -3 }] } ] },
      { id: 'give', label: `Give a big slice of it to a cause that matters to you`, risk: 'low', result: `The donation is announced on a banner and cheered by people you will never meet. You spend a long time deciding how to feel about the banner, then decide to feel good about the roof it paid for.`, effects: [{ money: -6000 }, { pop: 0.8 }, { conf: 3 }] },
    ],
  },
  // ======================= OPPORTUNITY =======================
  {
    id: 'ni_opp_mentor_vouch', category: 'opportunity', title: `{mentor.name} Put Your Name Forward`, weight: 2.5, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 6,
    cast: { mentor: { pick: 'tag', tag: 'mentor' }, gm: { pick: 'staff', role: 'gm' } }, memory: { role: 'mentor', max: 1 },
    trigger: { stat: { careerYears: { gte: 1 } }, mem: [{ role: 'mentor', tag: 'mentor' }] },
    slots: { spot: [`a spot on the next television taping`, `a one-off match against a name opponent`, `a place in a tag tournament`], where: [`over lunch`, `in the corridor outside the office`, `on a phone call you almost missed`] },
    body: [`{gm.name} mentions it {where}, as though it were a minor detail: {mentor.name} recommended you for {spot}. The recommendation came with no request to be thanked, and with the weight of a lifetime of keeping promises.`, `It is a real chance and it is also a loan against someone else's reputation. If you fall flat, two names take the hit.`],
    choices: [
      { id: 'accept', label: `Accept and promise to make it count`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4, confidence: 0.3 }, text: `You work harder than anyone expects, and the building sits up. {mentor.first} sends a one-word message that says "Good," and you read it more often than you want to admit.`, effects: [{ pop: 0.9 }, { rel: { who: 'mentor', respect: 4, trust: 3 } }, { conf: 4 }, { fatigue: 6 }] },
        { weight: 1, text: `The nerves win the first half and the sloppy finish wins the second. {gm.first} says the right kind things, and you hear every one of them as a quote.`, effects: [{ pop: -0.2 }, { rel: { who: 'mentor', trust: -1 } }, { conf: -4 }, { fatigue: 6 }] } ] },
      { id: 'ask_more', label: `Thank {gm.first} and ask for more than the spot`, risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `You frame it as ambition, not greed, and {gm.first} half-smiles and adds a second appearance to the plan. It is a good result, and it makes you the person who asked.`, effects: [{ pop: 0.7 }, { money: 1200 }, { conf: 2 }, { rel: { who: 'mentor', respect: -2 } }] },
        { weight: 1, text: `The ask lands as a sour note after a gift, and the offer shrinks by a quarter. {mentor.first} hears about it by evening.`, effects: [{ pop: 0.2 }, { rel: { who: 'mentor', respect: -4 } }, { conf: -2 }] } ] },
      { id: 'not_ready', label: `Say you are not ready and ask for a smaller step`, risk: 'low', result: `{gm.first} nods slowly and offers a quieter slot, no pressure attached. You protect your reputation and your mentor's, and you will wonder for a long while what the other path would have looked like.`, effects: [{ pop: 0.1 }, { conf: -2 }, { fatigue: -2 }, { rel: { who: 'mentor', respect: 1 } }] },
      { id: 'ask_mentor', label: `Call {mentor.first} and ask what to do with it`, risk: 'low', result: `The answer is not what you wanted: do it, and call after. You get a pep talk and a list of three things to watch, and a lightness you did not expect from being told what to do.`, effects: [{ rel: { who: 'mentor', trust: 5, affinity: 3 } }, { conf: 2 }, { pop: 0.3 }, { fatigue: 3 }] },
    ],
  },
  {
    id: 'ni_opp_ally_plus_one', category: 'opportunity', title: `{ally.name} Can Bring One Person`, weight: 2, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 6,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1 },
    trigger: { stat: { careerYears: { gte: 1 } }, mem: [{ role: 'ally', trustGte: 10 }] },
    slots: { gig: [`a two-week tour of arenas abroad`, `a trade-show appearance with real money attached`, `a charity tournament that gets television time`], terms: [`The offer comes with a plane ticket and a hotel`, `The pay is decent and the schedule is brutal`, `Nobody has told the office yet`] },
    body: [`{ally.name} has landed {gig}, and the organizers have said {ally.they} may bring one person. {terms}, and {ally.they} asked you before asking anyone else.`, `It is a favor and a gamble. A friend's invitation is a kind of trust, and it also means whoever comes along will be compared to whoever might have.`],
    choices: [
      { id: 'go', label: `Say yes at once and clear your calendar`, risk: 'med', result: `The trip is long, loud and full of jokes you will keep forever. You come home a little poorer in sleep, richer in memories, and with a partner who will take your calls at any hour.`, effects: [{ rel: { who: 'ally', trust: 7, affinity: 7 } }, { pop: 0.5 }, { fatigue: 9 }, { money: 800 }] },
      { id: 'negotiate', label: `Say yes, but ask for a fair share of the fee`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `{ally.first} agrees without hesitation and says it should have been offered. The money is real, the trip is fun and the ledger between you reads even.`, effects: [{ money: 2400 }, { rel: { who: 'ally', respect: 3 } }, { pop: 0.4 }, { fatigue: 8 }] },
        { weight: 1, text: `{ally.first} says it politely and then goes quiet in a way you recognise. The trip goes ahead, with the awkwardness riding in the seat beside you.`, effects: [{ money: 1800 }, { rel: { who: 'ally', trust: -4, affinity: -3 } }, { pop: 0.3 }, { fatigue: 8 }] } ] },
      { id: 'pass_to', label: `Turn it down and suggest someone who needs it more`, risk: 'low', result: `Your suggestion is a young wrestler on the verge of giving up, and {ally.first} takes the point quietly. You watch from home as photographs arrive of a very happy stranger.`, effects: [{ rel: { who: 'ally', respect: 5 } }, { conf: 2 }, { fatigue: -2 }, { money: -400 }] },
      { id: 'stay', label: `Stay home to rest and keep a quiet week`, risk: 'low', result: `The week is long, dull and healing. {ally.first} sends a photo of a sunset every few days, and each one weighs a little more than the last.`, effects: [{ fatigue: -10 }, { rel: { who: 'ally', affinity: -3 } }, { conf: -1 }] },
    ],
  },
  {
    id: 'ni_opp_documentary', category: 'opportunity', title: `A Camera Crew Wants Your Story`, weight: 1.5, major: true, cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 6,
    cast: { host: { pick: 'media', kind: 'host' } }, noAutoMemory: true,
    trigger: { stat: { popularity: { gte: 30 }, careerYears: { gte: 3 } } },
    slots: { format: [`a feature-length film for television`, `a six-episode behind-the-scenes series`, `a year-in-the-life special`], access: [`the cameras follow you everywhere`, `the cameras stay out of the locker room`, `you choose the three days they film`] },
    body: [`{host.name} pitches you {format} with a mix of salesmanship and sincerity. The terms are simple: {access}, and there is no script beyond what happens.`, `A documentary can make a career or reveal one. Real life does not edit itself, and your sleep, your temper and your worst day are all potential plot.`],
    choices: [
      { id: 'full', label: `Agree to full access, no strings attached`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, confidence: 0.3 }, text: `The footage is honest and rough, and the finished film is full of small moments you did not know were beautiful. The reviews call it unflinching, and your phone rings for weeks.`, effects: [{ pop: 1.6 }, { conf: 4 }, { fatigue: 7 }, { money: 4000 }] },
        { weight: 1, text: `A bad week lands in the middle of filming, and the cameras are kind enough to capture all of it. The film airs with your worst moment as the centerpiece.`, effects: [{ pop: 0.4 }, { conf: -5 }, { fatigue: 10 }, { money: 2500 }] } ] },
      { id: 'limits', label: `Agree, but demand a say in the final cut`, risk: 'med', result: `The producers grumble and give you a review week with a veto on three scenes. The film is more polished and less raw, and critics call it respectful in a tone that is not entirely a compliment.`, effects: [{ pop: 0.9 }, { conf: 1 }, { fatigue: 5 }, { money: 1500 }] },
      { id: 'sell', label: `Sell your access to the highest bidder`, risk: 'med', result: `A rival outlet offers a larger fee and fewer questions. You take the money, the cameras show up and you spend the shoot being smooth, pleasant and almost entirely unseen.`, effects: [{ money: 6500 }, { pop: 0.4 }, { conf: -1 }, { fatigue: 4 }] },
      { id: 'pass', label: `Decline: some things should stay private`, risk: 'low', result: `{host.first} takes it well and says the door stays open. You keep your privacy, your sleep and your unfilmed days, and the film goes to someone else.`, effects: [{ conf: 2 }, { fatigue: -2 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'ni_opp_motion_capture', category: 'opportunity', title: `The Video Game Wants Your Body`, weight: 1.5, major: true, cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 6,
    cast: { producer: { pick: 'staff', role: 'producer' } }, noAutoMemory: true,
    trigger: { minYear: 2000, stat: { popularity: { gte: 25 }, careerYears: { gte: 2 } } },
    slots: { demand: [`forty poses against a green wall`, `a rig of tiny reflective dots on a stretchy suit`, `ninety minutes of recorded grunts and taunts`], handler: [`a nervous engineer`, `a designer with a thick clipboard`, `a motion director who has seen everything`] },
    body: [`The licensing deal is real, and the session is today: {demand}, run by {handler}. {producer.name} has been asked to oversee, which mostly means standing by the door with a bottle of water.`, `A video game version of you will do things you would never do and will keep doing them forever. It is both flattering and unnerving to give your body away to be played with.`],
    choices: [
      { id: 'nail_it', label: `Treat it like a main event and nail every pose`, risk: 'low', result: `By the end the designers are applauding and the engineer is showing you a screen on which a digital you executes your finisher perfectly. You leave with sore ribs and a curious sense of pride.`, effects: [{ pop: 0.6 }, { fatigue: 8 }, { conf: 3 }] },
      { id: 'moves', label: `Add your own signature touches and offbeat gestures`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `The little extras make the character come alive, and the designers keep half of them. Players will find them as Easter eggs for years.`, effects: [{ pop: 0.9 }, { conf: 3 }, { fatigue: 6 }] },
        { weight: 1, text: `The extras clash with the existing animation set and have to be cut. You get a story to tell, though, and a very odd outtake reel.`, effects: [{ pop: 0.2 }, { conf: -1 }, { fatigue: 6 }] } ] },
      { id: 'royalty', label: `Ask for a royalty instead of a flat fee`, risk: 'high', outcomes: [
        { weight: 1, text: `The game sells in numbers nobody predicted, and royalty checks start landing with regularity. You become a minor expert in decimal points.`, effects: [{ money: 7500 }, { pop: 0.3 }, { fatigue: 5 }] },
        { weight: 1, text: `The game sells modestly, and your percentage buys a decent dinner. The flat fee would have bought the restaurant.`, effects: [{ money: -1200 }, { conf: -2 }, { fatigue: 5 }] } ] },
      { id: 'quick', label: `Do the minimum and get on with your day`, risk: 'low', result: `The session is brisk and efficient. The finished character moves like a stiff approximation of you, and a few fans will say so online.`, effects: [{ pop: -0.2 }, { fatigue: 2 }, { money: 600 }] },
    ],
  },
  {
    id: 'ni_opp_rival_special', category: 'opportunity', title: `A Special with {rival.name}`, weight: 2, cooldownDays: 220, maxPerCareer: 2, categoryCooldown: 6,
    cast: { rival: { pick: 'rivalry', minHeat: 20 }, host: { pick: 'media', kind: 'host' } }, memory: { role: 'rival', max: 1 },
    trigger: { stat: { popularity: { gte: 25 } }, mem: [{ role: 'rival', heatGte: 20 }] },
    slots: { format: [`a joint interview special`, `a trivia challenge on a talk show`, `a cooking segment on a morning program`], rule: [`both of you must stay seated for the full hour`, `a flustered producer has promised that no one will be hurt`, `the audience will vote on a winner`] },
    body: [`{host.name} has an idea: {format} with you and {rival.name}, and {rule}. The network loves the clash, and the company loves the exposure.`, `Television has never known what to do with a real grudge, and always wants to try. Here is your chance to decide what the grudge looks like at full volume in a very bright room.`],
    choices: [
      { id: 'stoke', label: `Play it up: make every answer a barb`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.3 }, text: `Your lines are sharp, quotable and just kind enough to be allowed on air. The clip goes around, and the feud picks up fresh heat from a source it did not expect.`, effects: [{ pop: 1.0 }, { rivalry: { who: 'rival', heat: 8 } }, { conf: 3 }] },
        { weight: 1, text: `One barb too many ends the segment early, and the host looks at the floor. The clip circulates for the wrong reasons.`, effects: [{ pop: -0.3 }, { rivalry: { who: 'rival', heat: 6 } }, { conf: -3 }] } ] },
      { id: 'friendly', label: `Go friendly and charm the audience`, risk: 'low', result: `You are warm, funny and a little too good at it. The audience loves you, and {rival.first} learns that you can play nice when it suits you, which both soothes and chills.`, effects: [{ pop: 0.7 }, { rel: { who: 'rival', heat: -4, respect: 2 } }, { conf: 1 }] },
      { id: 'hijack', label: `Steal the segment with a prank on {rival.first}`, risk: 'high', result: `The prank is clever, harmless and perfectly timed, and the audience is on its feet. {rival.first} gives you a look that says you will pay, and a smile that says it was a good one.`, effects: [{ pop: 1.1 }, { rel: { who: 'rival', heat: 6, respect: 3 } }, { fatigue: 3 }, { conf: 2 }] },
      { id: 'decline', label: `Decline: the feud is not for sale`, risk: 'low', result: `The network moves on and the host shrugs. You keep the grudge pure and your reputation for being hard to buy, and you also keep a calendar with fewer cameras in it.`, effects: [{ pop: -0.3 }, { conf: 2 }, { rel: { who: 'rival', respect: 1 } }] },
    ],
  },
  {
    id: 'ni_opp_partnership_pitch', category: 'opportunity', title: `{partner.name} Sees a Team in Us`, weight: 2, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 6,
    cast: { partner: { pick: 'tag', tag: 'alliance_possible' } }, memory: { role: 'partner', max: 1 },
    trigger: { mem: [{ role: 'partner', respectGte: 20 }] },
    slots: { pitch: [`a tag team that works the opening of the card`, `a pairing built around a shared entrance`, `a team for the title scene`], manner: [`with a hand-drawn logo on a napkin`, `after an hour of warming up to it`, `in a rush of words, as if afraid to lose the nerve`] },
    body: [`{partner.name} brings it up {manner}: {pitch}. {partner.they} had clearly been working on the pitch for weeks, and the only missing piece is you.`, `A partnership is half strategy and half temperament. The first half you can plan on a whiteboard, and the second half you only find out by trying.`],
    choices: [
      { id: 'sign', label: `Shake on it and form the team`, risk: 'low', result: `The handshake is firm and the grin is wide. Two weeks later you are sharing a gym, a car and a running joke about who steals the covers.`, effects: [{ event: { type: 'alliance_formed', participants: ['partner'], summary: `Formed a team with {partner.name}.`, importance: 3, data: {} } }, { pop: 0.4 }, { fatigue: 3 }] },
      { id: 'trial', label: `Propose a three-match trial before committing`, risk: 'low', result: `{partner.first} agrees, with a flicker of hurt that fades quickly into professionalism. The trial matches are sharp, and the trust is not yet quite built, but it grows.`, effects: [{ rel: { who: 'partner', trust: 3, respect: 3 } }, { pop: 0.3 }, { fatigue: 5 }] },
      { id: 'lead', label: `Agree, but insist on being the senior partner`, risk: 'high', outcomes: [
        { weight: 1, bonus: { confidence: 0.4 }, text: `{partner.first} accepts with good humor and a raised eyebrow, and the team gets off to a clear-eyed start. The hierarchy is plain, and so are the results.`, effects: [{ event: { type: 'alliance_formed', participants: ['partner'], summary: `Formed a team with {partner.name} on the player's terms.`, importance: 3, data: {} } }, { pop: 0.4 }, { rel: { who: 'partner', respect: -2 } }] },
        { weight: 1, text: `The insistence reads as arrogance, and {partner.first} walks away with a polite refusal that hurts more than shouting would have.`, effects: [{ rel: { who: 'partner', respect: -5, trust: -3 } }, { conf: -2 }] } ] },
      { id: 'decline', label: `Decline and keep working alone`, risk: 'low', result: `{partner.first} nods and says it is fair, in a voice that makes it clear that it is not. You keep your autonomy, and the offer does not return.`, effects: [{ rel: { who: 'partner', respect: -1, trust: -2 } }, { conf: 1 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'ni_opp_overseas_run', category: 'opportunity', title: `The Agent Has a Tour in Mind`, weight: 2, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 6,
    cast: { agent: { pick: 'staff', role: 'agent' } }, noAutoMemory: true,
    trigger: { stat: { popularity: { gte: 20 }, careerYears: { gte: 2 } }, injured: false },
    slots: { tour: [`a ten-day run of stadium shows`, `a three-city stretch of tiny, sold-out theaters`, `a festival circuit with strange start times`], cost: [`The fee is good, and the flights are long`, `The crowd is huge, and the hotels are not`, `The money is fine, and the days off are non-existent`] },
    body: [`{agent.name} unfolds a printed itinerary on the hood of a car. It is {tour}, abroad, and {cost}.`, `A tour is the best education a wrestler can get, and the worst place to find out you needed sleep. Somewhere around the second week, your body will file its own opinion.`],
    choices: [
      { id: 'all_in', label: `Take every date and give it everything`, risk: 'high', outcomes: [
        { weight: 2, bonus: { toughness: 0.3, confidence: 0.3 }, text: `You return a different performer: faster, looser and fluent in a dozen kinds of crowds. The office takes notice, and your passport takes revenge.`, effects: [{ pop: 1.3 }, { money: 4500 }, { conf: 4 }, { fatigue: 18 }, { attr: { name: 'endurance', delta: 1 } }] },
        { weight: 1, text: `By the ninth night your knee is making noises that you ignore until it refuses to be ignored. You finish the run on borrowed tape and bad advice.`, effects: [{ pop: 0.9 }, { money: 4500 }, { fatigue: 18 }, { injury: { part: 'legs', severity: 1, days: 12 } }, { conf: -2 }] } ] },
      { id: 'half', label: `Take half the dates and ask for the rest as options`, risk: 'med', result: `The negotiation costs you some of the fee and spares you some of the miles. It also leaves a faint worry that your replacement is better than you.`, effects: [{ pop: 0.6 }, { money: 2200 }, { fatigue: 8 }, { conf: 1 }] },
      { id: 'bring_crew', label: `Ask to bring a training partner as part of the deal`, risk: 'med', result: `The organizers grumble and agree, and the road is much better with company. The partner pays you back with jokes, wake-up calls and a weirdly good packing system.`, effects: [{ pop: 0.6 }, { money: 2800 }, { fatigue: 9 }, { conf: 3 }] },
      { id: 'skip', label: `Pass: your body needs the year more than the pay`, risk: 'low', result: `{agent.first} puts the itinerary back in the folder, politely, without a lecture. You rest, and the tour goes to someone who is hungrier.`, effects: [{ fatigue: -10 }, { pop: -0.3 }, { conf: 1 }] },
    ],
  },
  {
    id: 'ni_opp_reconciled_team', category: 'opportunity', title: `The Office Floats a Team with {ex.name}`, weight: 2, cooldownDays: 220, maxPerCareer: 2, categoryCooldown: 6,
    cast: { ex: { pick: 'tag', tag: 'reconciled' }, gm: { pick: 'staff', role: 'gm' } }, memory: { role: 'ex', max: 2 },
    trigger: { mem: [{ role: 'ex', tag: 'reconciled' }], stat: { popularity: { gte: 15 } } },
    slots: { hook: [`the story practically writes itself`, `ticket sales would love it`, `the sponsors have been asking for a feel-good angle`], timing: [`and wants an answer within the week`, `and needs a verbal yes before the next taping`, `and is willing to wait, but not forever`] },
    body: [`{gm.name} sits you down and says the office has noticed how the story with {ex.name} turned out, and that {hook}. A team is the natural next step, {timing}.`, `On paper it is a gift. In person it asks both of you to walk back into a room that you only just left.`],
    choices: [
      { id: 'yes', label: `Say yes and let the story write itself`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The first team promo has the crowd hollering for a redemption story and meaning it. {ex.first} turns out to be a better partner than anyone predicted, and so, somehow, are you.`, effects: [{ event: { type: 'alliance_formed', participants: ['ex'], summary: `Teamed up with {ex.name} after the old split healed.`, importance: 3, data: {} } }, { pop: 1.0 }, { conf: 3 }, { fatigue: 5 }] },
        { weight: 1, text: `The old tension leaks into the first match, and the commentary team clumsily reminds everyone why you were apart. The partnership limps along for a while.`, effects: [{ event: { type: 'alliance_formed', participants: ['ex'], summary: `Teamed up with {ex.name}, uneasily.`, importance: 2, data: {} } }, { pop: 0.2 }, { conf: -2 }, { fatigue: 5 }] } ] },
      { id: 'ask_ex', label: `Ask {ex.first} what {ex.they} would want first`, risk: 'low', result: `{ex.first} is moved to be asked, and answers with three small conditions that are easy to meet. The team begins with clear expectations, which is better than most begin with.`, effects: [{ rel: { who: 'ex', trust: 5, respect: 4 } }, { pop: 0.4 }, { fatigue: 3 }] },
      { id: 'one_off', label: `Counter with a single match rather than a team`, risk: 'low', result: `{gm.first} accepts the compromise with a quick nod. One match tests the water without committing to the swim, and the crowd gets a satisfying night.`, effects: [{ booking: { who: 'ex', type: 'tag' } }, { pop: 0.4 }, { rel: { who: 'ex', trust: 1 } }] },
      { id: 'refuse', label: `Refuse: the peace is enough`, risk: 'low', result: `The refusal comes out gentler than you feared and firmer than you wanted. {ex.first} hears about it and says only that it is probably wise.`, effects: [{ pop: -0.3 }, { conf: 1 }, { rel: { who: 'ex', trust: -1, respect: 1 } }] },
    ],
  },
  {
    id: 'ni_opp_commercial', category: 'opportunity', title: `A Commercial With Your Face on It`, weight: 1.5, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 6,
    cast: { exec: { pick: 'staff', role: 'executive' } }, noAutoMemory: true,
    trigger: { minYear: 1995, stat: { popularity: { gte: 30 } } },
    slots: { product: [`a regional pizza chain`, `a line of protein bars`, `a home gym brand`], gag: [`a monologue holding the product like a trophy`, `a stunt involving a folding table`, `an irritatingly catchy jingle`] },
    body: [`{exec.name} brings the offer: {product} wants you for a national spot, and the script calls for {gag}. The fee is large and the shoot is two days, and the script reads like it was written by people who love you very much and have never met you.`, `Endorsements are the quiet money of the business. They also tie your face to a product, and products last longer in memory than most matches.`],
    choices: [
      { id: 'do_it', label: `Do the spot exactly as scripted`, risk: 'low', result: `You hit every mark and sell every line with a straight face. The commercial runs for months, and strangers repeat the slogan back to you at gas stations.`, effects: [{ money: 6500 }, { pop: 0.5 }, { fatigue: 5 }, { conf: -1 }] },
      { id: 'rewrite', label: `Push for rewrites that sound like you`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.4, charisma: 0.4 }, text: `The agency is nervous and then thrilled, and the new version is funnier. The commercial becomes a minor catchphrase and a major sponsor of your future mood.`, effects: [{ money: 6000 }, { pop: 1.0 }, { conf: 3 }, { fatigue: 6 }] },
        { weight: 1, text: `The rewrites are met with polite resistance and a week of back and forth. The final version is a compromise nobody loves.`, effects: [{ money: 4500 }, { pop: 0.1 }, { fatigue: 6 }, { conf: -1 }] } ] },
      { id: 'cut', label: `Ask for equity in place of cash`, risk: 'high', outcomes: [
        { weight: 1, text: `The brand explodes the following year, and a small slice of it turns out to be worth far more than the fee. Your accountant sends a bouquet.`, effects: [{ money: 12000 }, { pop: 0.4 }] },
        { weight: 2, text: `The company folds quietly after eighteen months. The equity becomes a framed certificate and a good story.`, effects: [{ money: -2500 }, { conf: -2 }, { pop: 0.2 }] } ] },
      { id: 'turn_down', label: `Turn it down: you do not want to be a mascot`, risk: 'low', result: `The agency finds someone else with a shrug. You keep your brand clean and your schedule free, and you feel good about it for exactly as long as the bills take to arrive.`, effects: [{ conf: 2 }, { pop: -0.1 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'ni_opp_replacement_slot', category: 'opportunity', title: `{vet.name} Pulled Out Tonight`, weight: 2.5, contexts: ['pre_show', 'show_day'], cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 6,
    cast: { vet: { pick: 'roster', tier: { gte: 2 }, sameBrand: true }, agent: { pick: 'staff', role: 'agent' } }, noAutoMemory: true,
    trigger: { injured: false, stat: { fatigue: { lte: 80 } } },
    slots: { slot: [`the semi-main`, `the show-opening match`, `a ten-minute segment before the headliner`], pressure: [`on four hours' notice`, `with one rehearsal in the hallway`, `with no time to see the opponent's gear`] },
    body: [`{vet.name} is out with a sudden illness, and {agent.name} finds you with a clipboard and a hopeful face. The vacated spot is {slot}, and you would have it {pressure}.`, `Nobody gets ready for an opportunity like this. The people who benefit most are usually the ones who say yes before the fear catches up.`],
    choices: [
      { id: 'yes', label: `Say yes before you can think about it`, risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.4, confidence: 0.4 }, text: `You work on adrenaline and instinct, and the crowd decides they came for you all along. The agent shakes your hand twice in the gorilla position.`, effects: [{ pop: 1.0 }, { conf: 5 }, { fatigue: 9 }] },
        { weight: 1, text: `Halfway through the match you realise you are working a night too big for your preparation. You get through it, mostly, and make notes for the next time.`, effects: [{ pop: 0.2 }, { conf: -2 }, { fatigue: 9 }] } ] },
      { id: 'prep', label: `Say yes but insist on a full walk-through first`, risk: 'low', result: `The agent grumbles and finds twenty minutes. The match is clean, safe and respectable, and the main talk afterward is how professional you looked.`, effects: [{ pop: 0.5 }, { conf: 2 }, { fatigue: 6 }] },
      { id: 'refuse', label: `Say you are not ready for a spot that big`, risk: 'low', result: `The agent nods and goes looking for someone else, with a look that suggests a note is being made. You keep your night free and your name slightly smaller.`, effects: [{ pop: -0.3 }, { conf: -3 }, { fatigue: -3 }] },
      { id: 'for_money', label: `Say yes, but only for an extra payment`, risk: 'med', result: `{agent.first} bargains with a sigh and a pen, and you collect a bonus for your trouble. The match is fine, the check is better, and the story is that you charge for panic.`, effects: [{ money: 1800 }, { pop: 0.3 }, { conf: -1 }, { fatigue: 6 }] },
    ],
  },
  // ======================= BACKSTAGE =======================
  {
    id: 'ni_bk_pecking_order', category: 'backstage', title: `The Unwritten Rule in {place}`, weight: 1.5, cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 5,
    cast: { vet: { pick: 'roster', tier: { gte: 3 }, sameBrand: true } }, noAutoMemory: true,
    trigger: { stat: { careerYears: { lte: 6 } } },
    slots: { place: [`the catering room`, `the bus parking lot`, `the hallway outside hair and makeup`], rule: [`the veterans eat first`, `only headliners take the good couch`, `nobody sits at the table by the window`] },
    body: [`In {place} an old rule is enforced, though no one has ever written it down: {rule}. {vet.name} points out, with the patient air of someone who finds the whole thing as silly as you do, that you have just broken it.`, `Every locker room has laws that exist only because enough people agree to pretend they do. How you respond is an answer to a larger question than where to sit.`],
    choices: [
      { id: 'move', label: `Apologise, move and thank {vet.first} for the tip`, risk: 'low', result: `{vet.first} nods, relieved that the ritual was observed, and a minute later offers you a seat at the good table anyway. Humility is not glamorous, but it has a surprising exchange rate.`, effects: [{ rel: { who: 'vet', respect: 4, trust: 2 } }, { conf: -1 }, { pop: 0.1 }] },
      { id: 'stay_joke', label: `Stay where you are and make a joke of it`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `The joke is quick, self-aware and lands with the whole room. {vet.first} laughs first and loudest, and the rule gets a quiet exception with your name on it.`, effects: [{ rel: { who: 'vet', respect: 3, affinity: 4 } }, { pop: 0.3 }, { conf: 3 }] },
        { weight: 1, text: `The joke goes a half-step too far, and the room falls into the careful silence that follows disrespect. You move, and the story follows you down the hall.`, effects: [{ rel: { who: 'vet', respect: -5 } }, { conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'ask_why', label: `Ask {vet.first} to explain how the rule started`, risk: 'low', result: `The story takes ten minutes and involves a dead promoter, a lost wager and a broken chair. You get both a laugh and an education, and you understand the room slightly better.`, effects: [{ rel: { who: 'vet', trust: 4, affinity: 3 } }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 2 }] },
      { id: 'challenge', label: `Say a rule nobody wrote down is not a rule`, risk: 'high', result: `You say it plainly, and half the room finds a very interesting corner to look at. The rule survives you, and you become a person who opposes rules out loud.`, effects: [{ rel: { who: 'vet', respect: -3, heat: 4 } }, { pop: 0.3 }, { conf: 2 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'ni_bk_prank_war', category: 'backstage', title: `The Prank War Begins`, weight: 1.5, contexts: ['weekly', 'pre_show'], cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 5,
    cast: { joker: { pick: 'roster', tier: { lte: 3 }, sameBrand: true } }, noAutoMemory: true,
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { prank: [`your boots filled with confetti`, `your entrance music replaced with a polka`, `every item in your bag wrapped in tape`], watchers: [`Half the locker room is waiting to see your face`, `The ring crew has placed bets on your reaction`, `A producer is working very hard not to smile`] },
    body: [`Before the show you discover {prank}. {watchers}, and {joker.name} is looking suspiciously innocent over a coffee.`, `It is a harmless prank and an expensive one: the real question is what you do with the silence that follows. Everyone present knows that this is a first move, not an ending.`],
    choices: [
      { id: 'laugh', label: `Laugh it off and compliment the craftsmanship`, risk: 'low', result: `Your laugh is genuine, and the room releases its breath. {joker.first} gives a mock bow, and the war is declared peacefully, with mutual respect.`, effects: [{ rel: { who: 'joker', affinity: 5, respect: 2 } }, { pop: 0.1 }, { conf: 2 }] },
      { id: 'retaliate', label: `Plan a bigger, better prank in return`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `Your counterstrike is elegant, silent and devastating, and the locker room speaks of it in whispers for days. {joker.first} salutes you from across the room.`, effects: [{ rel: { who: 'joker', affinity: 4, respect: 4 } }, { pop: 0.3 }, { conf: 3 }, { fatigue: 3 }] },
        { weight: 1, text: `The counterstrike backfires on an innocent bystander and a whole row of boots. You spend the afternoon apologising and washing.`, effects: [{ conf: -2 }, { fatigue: 5 }, { pop: -0.1 }] } ] },
      { id: 'ignore', label: `Ignore it and act like nothing happened`, risk: 'low', result: `You walk past the evidence and say nothing at all, which is the most unnerving thing you could have done. {joker.first} spends the day waiting for a reaction that never comes.`, effects: [{ rel: { who: 'joker', respect: 2, affinity: -1 } }, { conf: 2 }, { fatigue: -1 }] },
      { id: 'report', label: `Take it to the producer as a distraction from work`, risk: 'med', result: `The producer sighs, issues a mild reminder and sends a message to the whole room. You have won the argument and lost a couple of friends, and the confetti stays in your boots anyway.`, effects: [{ rel: { who: 'joker', respect: -3, affinity: -4 } }, { conf: -1 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'ni_bk_bus_cards', category: 'backstage', title: `The Card Game in the Back of the Bus`, weight: 1.5, cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 5,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1 },
    trigger: { stat: { careerYears: { gte: 1 } }, mem: [{ role: 'ally', trustGte: 5 }] },
    slots: { stake: [`a pile of quarters`, `the right to choose the radio station for a week`, `a rolled-up pair of tour socks`], mood: [`It is well past midnight`, `The bus is parked at a rest stop`, `The driver has agreed to see nothing`] },
    body: [`A card game has started in the back of the bus, with {stake} on the table. {mood}, and {ally.name} waves you over with the air of someone holding either a very good hand or nothing at all.`, `Bus games have a hierarchy of their own, and it has little to do with who is famous. The stakes are small, and the lessons are about people.`],
    choices: [
      { id: 'play_honest', label: `Sit in and play it straight`, risk: 'low', result: `You win a few hands, lose a few more and learn that two of the crew bluff with their left eyebrows. It costs you an hour of sleep and buys you a better seat in the back.`, effects: [{ rel: { who: 'ally', affinity: 4 } }, { conf: 2 }, { fatigue: 3 }, { money: 40 }] },
      { id: 'hustle', label: `Go in hard and try to clean out the table`, risk: 'high', outcomes: [
        { weight: 1, bonus: { psychology: 0.4 }, text: `You win everything and keep your face still, and the table goes quiet in a way you do not enjoy. {ally.first} gives you half the winnings back with a smile, and the offer is a lesson.`, effects: [{ money: 220 }, { rel: { who: 'ally', respect: -2, affinity: -2 } }, { conf: 2 }] },
        { weight: 1, text: `The table has seen your trick before, and by two in the morning you are down several weeks of per diems. Everyone is gracious about it, which is the worst part.`, effects: [{ money: -260 }, { conf: -3 }, { fatigue: 3 }] } ] },
      { id: 'back_ally', label: `Sit behind {ally.first} and quietly cheer {ally.them} on`, risk: 'low', result: `{ally.first} plays the best hand of the night with you hovering over a shoulder, and the pot is split with a toast. Winning together is a little better than winning alone.`, effects: [{ rel: { who: 'ally', trust: 4, affinity: 5 } }, { money: 30 }, { fatigue: 2 }] },
      { id: 'sleep', label: `Wave them off and try to sleep`, risk: 'low', result: `You curl up against a window with your jacket for a pillow and drift off to the sound of dealt cards. You wake at the destination well-rested and slightly unpopular.`, effects: [{ fatigue: -7 }, { rel: { who: 'ally', affinity: -1 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'ni_bk_rookie_nerves', category: 'backstage', title: `{rookie.name} Cannot Stop Shaking`, weight: 2, contexts: ['pre_show', 'show_day'], cooldownDays: 130, maxPerCareer: 3, categoryCooldown: 5,
    cast: { rookie: { pick: 'roster', tier: { lte: 1 }, sameBrand: true } }, noAutoMemory: true,
    trigger: { stat: { careerYears: { gte: 2 } } },
    slots: { place: [`behind the curtain`, `in a stairwell`, `in the corner of the catering room`], tell: [`a trembling hand around a paper cup`, `a whispered rehearsal of a single sentence`, `a face the color of putty`] },
    body: [`{rookie.name} is standing {place} with {tell}, a few minutes before an important match. The nerves are plain to see, and no one else seems to have noticed.`, `You have been this person, in a different corridor. You remember the ten words that would have helped, and you have no idea whether you can still find them.`],
    choices: [
      { id: 'calm', label: `Sit with {rookie.first} and talk about anything else`, risk: 'low', result: `You talk about breakfast cereal, bad vacation photos and the worst ring you ever worked. By the time the music hits, {rookie.first} is smiling, and you have missed your own warm-up.`, effects: [{ rel: { who: 'rookie', trust: 6, affinity: 5 } }, { fatigue: 3 }, { conf: 2 }] },
      { id: 'tough', label: `Give the tough-love speech about everyone being scared`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `Your voice is low and steady, and the speech has a hard core of truth in it. {rookie.first} straightens, nods once and walks out as if on rails.`, effects: [{ rel: { who: 'rookie', respect: 6, trust: 3 } }, { conf: 3 }, { pop: 0.1 }] },
        { weight: 1, text: `The speech lands as a threat, and {rookie.first} goes whiter than before. You apologise, but the damage to the nervous system has already been done.`, effects: [{ rel: { who: 'rookie', trust: -3 } }, { conf: -3 }] } ] },
      { id: 'lucky', label: `Give {rookie.first} something of yours for luck`, risk: 'low', result: `It is a worn wristband that has survived more bad nights than good ones. {rookie.first} puts it on with both hands, as if it were a medal.`, effects: [{ rel: { who: 'rookie', affinity: 6, trust: 3 } }, { pop: 0.1 }, { conf: 1 }, { money: -20 }] },
      { id: 'fetch_agent', label: `Fetch an agent and leave them to it`, risk: 'low', result: `The agent takes over with calm authority and sends you back to your own work. It is the efficient solution, and you feel mildly cowardly all evening.`, effects: [{ rel: { who: 'rookie', trust: 1 } }, { conf: -1 }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'ni_bk_finish_change', category: 'backstage', title: `The Finish Just Changed`, weight: 2.5, contexts: ['pre_show'], cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 5,
    cast: { rival: { pick: 'rivalry', minHeat: 20 }, producer: { pick: 'staff', role: 'producer' } }, memory: { role: 'rival', max: 2 },
    trigger: { mem: [{ role: 'rival', heatGte: 15 }] },
    slots: { timing: [`with an hour to go`, `while you are taping your wrists`, `in the middle of the gorilla position`], change: [`the finish has been flipped`, `a run-in has been added to the end`, `your biggest spot has been cut for time`] },
    body: [`{producer.name} gives you the news {timing}: {change}. Across the room, {rival.name} has been told the same thing and is trying very hard to look unbothered.`, `Late changes are part of the job. They are also the moment where trust or the lack of it shows up in a match, since nobody has time to rehearse the new version.`],
    choices: [
      { id: 'roll', label: `Roll with it and trust your instincts`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `The new version has an energy the old one lacked, and the improvisation holds. You come through the curtain to a producer who looks happily surprised.`, effects: [{ pop: 0.7 }, { conf: 3 }, { fatigue: 5 }] },
        { weight: 1, text: `A moment of confusion in the middle makes both of you look hesitant, and the crowd senses it. The match ends cleanly, but with a scuffed sheen.`, effects: [{ pop: -0.1 }, { conf: -3 }, { fatigue: 5 }] } ] },
      { id: 'rework', label: `Huddle with {rival.first} and rework it between you`, risk: 'low', result: `The two of you whisper in a corner for ten minutes, trading ideas like spies. It is the most cooperative you have ever been, and the match sings.`, effects: [{ rel: { who: 'rival', respect: 5, trust: 4, heat: -3 } }, { pop: 0.5 }, { fatigue: 4 }, { conf: 2 }] },
      { id: 'argue', label: `Argue for the original plan`, risk: 'high', outcomes: [
        { weight: 1, bonus: { confidence: 0.4, mic: 0.3 }, text: `Your case is calm and complete, and the producer changes it back with a shrug. You win the argument and a reputation for being exacting.`, effects: [{ pop: 0.3 }, { conf: 3 }, { fatigue: 3 }] },
        { weight: 1, text: `The producer is not moved, and the exchange puts the whole backstage on edge. You work the match angry, and the match shows it.`, effects: [{ pop: -0.3 }, { conf: -3 }, { fatigue: 4 }, { rel: { who: 'rival', heat: 3 } }] } ] },
      { id: 'blame_room', label: `Send a pointed question to creative about who decided`, risk: 'med', result: `The question travels up the chain faster than you hoped and is answered with a polished non-answer. You come off as informed and difficult, in about equal measure.`, effects: [{ pop: 0.1 }, { conf: 1 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'ni_bk_thermostat', category: 'backstage', title: `The Great Dispute Over {dispute}`, weight: 1.5, contexts: ['weekly', 'pre_show'], cooldownDays: 120, maxPerCareer: 2, categoryCooldown: 5,
    cast: { hothead: { pick: 'roster', tier: { lte: 3 }, sameBrand: true } }, noAutoMemory: true,
    trigger: {},
    slots: { dispute: [`the dressing room thermostat`, `the one working shower`, `the last good chair`], method: [`a sign taped over the controls`, `a rotating schedule nobody agreed to`, `an increasingly formal series of notes`] },
    body: [`The locker room has split over {dispute}, and {hothead.name} has escalated things with {method}. By popular demand you have been named arbiter, a job you never applied for.`, `Small grievances are the most dangerous, because they are the ones people can afford to be furious about. Whatever you say next will be quoted until the next building.`],
    choices: [
      { id: 'schedule', label: `Draw up a fair rotation and post it on the wall`, risk: 'low', result: `The schedule is posted with an official-looking border. Everybody grumbles, and everybody follows it, which is how you know it was fair.`, effects: [{ rel: { who: 'hothead', respect: 3 } }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'side_majority', label: `Side with the majority and let {hothead.first} lose`, risk: 'med', result: `The vote is lopsided and loud, and {hothead.first} takes the loss with a face like thunder. The room is happy and one person is not.`, effects: [{ rel: { who: 'hothead', heat: 5, respect: -3 } }, { pop: 0.1 }, { conf: 1 }] },
      { id: 'side_hothead', label: `Back {hothead.first} in secret and take the heat`, risk: 'high', result: `You stand with the underdog for no better reason than that someone should. A handful of people make a joke at your expense, and {hothead.first} finds an unexpected loyalty.`, effects: [{ rel: { who: 'hothead', trust: 6, affinity: 5 } }, { conf: -1 }, { pop: -0.1 }] },
      { id: 'laugh_off', label: `Declare the arbiter job a farce and buy donuts`, risk: 'low', result: `The donuts arrive and the dispute dissolves in sugar. It is not a solution, but it is a delay of the kind that works for months.`, effects: [{ money: -40 }, { pop: 0.1 }, { conf: 1 }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'ni_bk_lost_bag', category: 'backstage', title: `Your {what} Never Arrived`, weight: 2, contexts: ['pre_show', 'show_day'], cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 5,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1 },
    trigger: { stat: { careerYears: { gte: 1 } }, mem: [{ role: 'ally', trustGte: 5 }] },
    slots: { what: [`ring gear`, `boots`, `entire bag`], where: [`on a connecting flight`, `at a hotel shuttle stop`, `somewhere between two buses`] },
    body: [`Your {what} never made it: it was lost {where}, and the show is in three hours. {ally.name} appears at your side with a spare set of everything and the faintest of smiles.`, `The spare is not a perfect fit, but it is a very good gesture. You can wear it with grace or with grumbling, and the whole room will see which one you pick.`],
    choices: [
      { id: 'borrow', label: `Borrow {ally.first}'s gear and work the match in it`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.3 }, text: `The gear is a size off in every direction, and somehow it works. You look like a stylish accident, and the crowd treats you like a hero in borrowed clothes.`, effects: [{ rel: { who: 'ally', trust: 5, affinity: 4 } }, { pop: 0.5 }, { conf: 2 }] },
        { weight: 1, text: `A seam splits at the worst moment and the match turns into a comedy of overlapping patches. The audience laughs, and so does the ring crew, a little too long.`, effects: [{ rel: { who: 'ally', affinity: 2 } }, { pop: -0.1 }, { conf: -3 }] } ] },
      { id: 'buy', label: `Buy a replacement at the nearest sporting goods store`, risk: 'low', result: `The mall store has exactly one thing in your size, and it is orange. You look strange, comfortable and expensive, and the receipt travels with you for the rest of the week.`, effects: [{ money: -280 }, { pop: -0.1 }, { conf: 1 }, { fatigue: 2 }] },
      { id: 'street', label: `Work the match in street clothes and sell the story`, risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.5, mic: 0.3 }, text: `You turn the situation into a gag: the underdog with no luggage. The crowd adores it, and the story is told in the hallways for weeks.`, effects: [{ pop: 1.0 }, { conf: 3 }, { fatigue: 3 }] },
        { weight: 1, text: `The joke runs out of steam about three minutes in, and you are left wrestling in jeans for the remaining seven. It is a very long ten minutes.`, effects: [{ pop: -0.4 }, { conf: -3 }, { fatigue: 4 }] } ] },
      { id: 'ask_crew', label: `Ask the ring crew to stitch something together`, risk: 'low', result: `The seamstress who travels with the show produces a jacket out of two old banners and a spare tarp. It is ridiculous, unforgettable and yours.`, effects: [{ pop: 0.3 }, { conf: 2 }, { fatigue: 2 }, { money: -60 }] },
    ],
  },
  {
    id: 'ni_bk_midnight_call', category: 'backstage', title: `A Call from {ex.name} After Midnight`, weight: 2, cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 5,
    cast: { ex: { pick: 'tag', tag: 'reconciled' } }, memory: { role: 'ex', max: 1 },
    trigger: { stat: { careerYears: { gte: 2 } }, mem: [{ role: 'ex', tag: 'reconciled' }] },
    slots: { rumor: [`the office plans to cut a handful of contracts`, `a rival company is quietly hiring`, `the whole show is about to move to another brand`], time: [`close to midnight`, `during a long layover`, `as you are leaving the gym`] },
    body: [`{ex.name} phones you {time} with a rumor: {rumor}. {ex.they} would not say who the source was, only that {ex.they} trusted it enough to call you first.`, `Nobody tells you the whole truth in this business, so you collect pieces. A friend's information is always a gift, and also a test of what you will do with it.`],
    choices: [
      { id: 'dig', label: `Ask around and try to confirm it`, risk: 'med', outcomes: [
        { weight: 2, bonus: { psychology: 0.3 }, text: `By morning you have two sources and a plan. The rumor is half right, and half right is enough to start planning.`, effects: [{ conf: 2 }, { fatigue: 4 }, { rel: { who: 'ex', trust: 3 } }] },
        { weight: 1, text: `Your questions travel faster than your answers, and a manager asks who started it. You protect your friend, and take the heat yourself.`, effects: [{ pop: -0.2 }, { conf: -2 }, { rel: { who: 'ex', trust: 5, respect: 3 } }, { fatigue: 4 }] } ] },
      { id: 'share', label: `Share it with a few people you trust`, risk: 'med', result: `Within a day the rumor has made a loop of the locker room and returned with extra details. People thank you quietly, and the friend who started it raises an eyebrow.`, effects: [{ rel: { who: 'ex', trust: -3 } }, { pop: 0.2 }, { conf: 1 }] },
      { id: 'sit_on', label: `Say thanks and tell no one at all`, risk: 'low', result: `You sit on it like a hot stone, and no one ever knows. The friendship is stronger for it, and the news turns out to be sound.`, effects: [{ rel: { who: 'ex', trust: 5, affinity: 3 } }, { conf: 1 }, { fatigue: 2 }] },
      { id: 'act', label: `Use it: lock down your own contract right now`, risk: 'high', result: `You call the office at nine and ask about your situation before anyone else does. It works for you and nobody can prove why, but the timing makes at least one person wonder.`, effects: [{ money: 1500 }, { pop: -0.1 }, { conf: 2 }, { rel: { who: 'ex', trust: -2 } }] },
    ],
  },
  {
    id: 'ni_bk_mediator', category: 'backstage', title: `{admirer.name} Asks You to Settle It`, weight: 2, cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 5,
    cast: { admirer: { pick: 'tag', tag: 'respected_by' }, other: { pick: 'roster', tier: { lte: 3 }, sameBrand: true } }, memory: { role: 'admirer', max: 1 },
    trigger: { mem: [{ role: 'admirer', tag: 'respected_by' }] },
    slots: { topic: [`who gets the last seat on a flight`, `an entrance song that sounds suspiciously similar`, `a borrowed jacket that never came back`], style: [`by passing notes through a third party`, `loudly, in the hallway`, `with a dressing-room door left open on purpose`] },
    body: [`{admirer.name} and {other.name} have stopped speaking over {topic}, and the war is being fought {style}. {admirer.name} thinks you are the only person both sides might listen to.`, `It is flattering and risky. The position of mediator is a seat everyone wants until the second chair breaks.`],
    choices: [
      { id: 'mediate', label: `Sit both of them down and hear each side out`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `You listen more than you speak, and the dispute shrinks the moment each side hears the other. They leave grudgingly friendly, and the locker room takes the credit as yours.`, effects: [{ rel: { who: 'admirer', respect: 4, trust: 3 } }, { rel: { who: 'other', respect: 4, trust: 2 } }, { pop: 0.3 }, { conf: 3 }, { fatigue: 4 }] },
        { weight: 1, text: `Neither side wants a settlement, and they both leave convinced that you favoured the other. You have two sulking colleagues instead of one.`, effects: [{ rel: { who: 'admirer', trust: -2 } }, { rel: { who: 'other', trust: -2 } }, { conf: -3 }, { fatigue: 4 }] } ] },
      { id: 'take_side', label: `Back {admirer.first} openly against {other.first}`, risk: 'high', result: `Your support is a boost for {admirer.first} and an insult to {other.first}. It also sets you up as a person with allies, which is both strength and a target.`, effects: [{ rel: { who: 'admirer', trust: 6, affinity: 4 } }, { rel: { who: 'other', heat: 6, respect: -3 } }, { conf: 1 }] },
      { id: 'tell_both', label: `Tell them both to sort it out like adults`, risk: 'low', result: `The message is blunt and a little humbling. They stare at the floor, mutter an apology that sounds like a negotiation and leave in different directions.`, effects: [{ rel: { who: 'admirer', respect: -1 } }, { rel: { who: 'other', respect: 1 } }, { conf: 1 }, { fatigue: -1 }] },
      { id: 'producer', label: `Hand it to a producer and stay out of it`, risk: 'low', result: `The producer solves it by assigning them different buses. It is cold and effective, and neither of them says thank you.`, effects: [{ rel: { who: 'admirer', affinity: -2 } }, { fatigue: -2 }, { conf: -1 }] },
    ],
  },
  {
    id: 'ni_bk_swapped_bags', category: 'backstage', title: `Whose Bag Is This?`, weight: 1.5, contexts: ['pre_show', 'weekly'], cooldownDays: 160, maxPerCareer: 2, categoryCooldown: 5,
    cast: { twin: { pick: 'roster', tier: { lte: 3 }, sameBrand: true } }, noAutoMemory: true,
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { find: [`an enormous stuffed hippo and a tin of whistle polish`, `three kinds of tape and a book on birdwatching`, `a ring jacket two sizes too large and a casserole dish`], crowd: [`The whole locker room has gathered`, `Only the ring crew is watching`, `Nobody notices for a full minute`] },
    body: [`You open your bag in front of everyone and find {find}. {crowd}, and the door swings open to reveal {twin.name} carrying a bag that is very much yours.`, `Neither of you can immediately say which of you looks more embarrassed. It is, in every sense, a case for the lost and found.`],
    choices: [
      { id: 'swap', label: `Swap bags with a deadpan bow and a straight face`, risk: 'low', result: `The exchange is formal and silent, like a hostage handover. The locker room applauds, and {twin.first} later says the casserole was a gift from a very persistent relative.`, effects: [{ rel: { who: 'twin', affinity: 5 } }, { pop: 0.1 }, { conf: 2 }] },
      { id: 'bit', label: `Turn it into a bit and carry the item to the ring`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, mic: 0.3 }, text: `You walk out with the oddest accessory in the building, and the crowd loses its mind. The producers decide you may keep the gag as a one-night special.`, effects: [{ pop: 0.8 }, { conf: 3 }, { rel: { who: 'twin', affinity: 3 } }] },
        { weight: 1, text: `The bit is too elaborate and the item far too awkward to handle mid-match. You spend the first two minutes untangling yourself from your own idea.`, effects: [{ pop: -0.2 }, { conf: -2 }, { fatigue: 3 }] } ] },
      { id: 'ask_what', label: `Ask {twin.first} what you were supposed to find`, risk: 'low', result: `The answer is a pair of lucky socks and a very specific kind of tea, and you spend ten minutes trading rituals. You make an unlikely friend over a thermos.`, effects: [{ rel: { who: 'twin', trust: 4, affinity: 4 } }, { conf: 1 }, { fatigue: -1 }] },
      { id: 'keep', label: `Keep the contents and pretend it was intentional`, risk: 'med', result: `You pretend with a flourish and a firm nod, and everyone plays along because it is more fun than telling the truth. {twin.first} has to make do for the night, and has a longer memory than you expected.`, effects: [{ rel: { who: 'twin', heat: 4, affinity: -3 } }, { pop: 0.2 }, { conf: 2 }] },
    ],
  },
  // ======================= CREATIVE =======================
  {
    id: 'ni_cr_catchphrase', category: 'creative', title: `Creative Has a Catchphrase for You`, weight: 2, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 6,
    cast: { creative: { pick: 'staff', role: 'creative' } }, noAutoMemory: true,
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { phrase: [`"Class is in session"`, `"No refunds on respect"`, `"Count the lights"`], delivery: [`with a pointed finger at the camera`, `after a very long pause`, `while tapping your wrist`] },
    body: [`{creative.name} is excited about a new catchphrase for you: {phrase}, delivered {delivery}. The excitement has the smell of someone who has already printed the shirts.`, `A catchphrase is a gamble. Say it right and it follows you into every grocery store for decades, and say it wrong and the internet will say it for you.`],
    choices: [
      { id: 'embrace', label: `Embrace it and commit to the delivery`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.4 }, text: `You sell the line with a straight back, and the crowd answers it on the second night. By the end of the week you hear it shouted from a passing car.`, effects: [{ pop: 1.0 }, { mic: 1 }, { conf: 3 }] },
        { weight: 1, text: `The line sits wrong in your mouth, and the crowd claps politely at it like a pun at a funeral. Creative smiles encouragingly, which is much worse.`, effects: [{ pop: -0.2 }, { conf: -3 }] } ] },
      { id: 'tweak', label: `Offer a small rewrite that sounds more like you`, risk: 'low', result: `{creative.first} grumbles, then agrees that your version is better. The credit line says it was a team effort, and you let it stay that way.`, effects: [{ pop: 0.5 }, { conf: 2 }, { mic: 1 }] },
      { id: 'reject', label: `Reject it: you want to earn your own`, risk: 'med', result: `The room cools, and {creative.first} puts the page away with the care of someone filing a grievance. You keep your voice and lose a favorable mood.`, effects: [{ pop: -0.2 }, { conf: 2 }, { charisma: 1 }] },
      { id: 'test', label: `Ask to test it on a small crowd first`, risk: 'low', result: `A house show gets the trial run, and you watch the faces closely. The result is a split vote, a few smiles and a lot of data for the next conversation.`, effects: [{ fatigue: 3 }, { pop: 0.2 }, { conf: 1 }, { attr: { name: 'psychology', delta: 1 } }] },
    ],
  },
  {
    id: 'ni_cr_cowrite', category: 'creative', title: `Writing a Promo with {rival.name}`, weight: 2, cooldownDays: 180, maxPerCareer: 2, categoryCooldown: 6,
    cast: { rival: { pick: 'rivalry', minHeat: 25 }, creative: { pick: 'staff', role: 'creative' } }, memory: { role: 'rival', max: 1 },
    trigger: { stat: { careerYears: { gte: 1 } }, mem: [{ role: 'rival', heatGte: 20 }] },
    slots: { format: [`a two-minute promo trading insults`, `a mock press conference`, `a segment where you read each other's fan mail aloud`], condition: [`creative wants it to feel improvised`, `there are exactly four minutes on the rundown`, `both of you have been given veto power`] },
    body: [`{creative.name} has locked you and {rival.name} in a conference room to write {format}, and {condition}. The two of you stare across the table like cats that have been introduced against their will.`, `A good promo needs honesty and a shared understanding of where the line is. It will have to be built by two people who cannot stand the sight of each other.`],
    choices: [
      { id: 'collab', label: `Build it together and give each other real lines`, risk: 'low', result: `By the third draft you are finishing each other's insults. The segment airs, and it is the sharpest thing either of you has done, with a warmth under the hostility that nobody can place.`, effects: [{ rel: { who: 'rival', respect: 6, trust: 3 } }, { pop: 0.8 }, { fatigue: 4 }, { conf: 2 }] },
      { id: 'dominate', label: `Take over the pen and write yourself the best lines`, risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.5 }, text: `Your lines are the sharpest in the room, and the segment is yours. {rival.first} says nothing during the taping and everything afterward.`, effects: [{ pop: 0.9 }, { rel: { who: 'rival', heat: 8, respect: -3 } }, { conf: 3 }, { mic: 1 }] },
        { weight: 1, text: `{rival.first} sees the trap and reroutes the script mid-take, leaving you sounding mean and unprepared. The segment makes you the heavy of the piece.`, effects: [{ pop: -0.2 }, { rel: { who: 'rival', heat: 6 } }, { conf: -3 }] } ] },
      { id: 'real', label: `Put one real grievance in and see what happens`, risk: 'med', result: `The line is true, specific and a little cruel, and {rival.first} goes quiet before finding a worse one to match it. The segment is electric and leaves a mark on both of you.`, effects: [{ pop: 1.0 }, { rivalry: { who: 'rival', heat: 8 } }, { rel: { who: 'rival', heat: 6, respect: 3 } }, { conf: 1 }] },
      { id: 'hand_off', label: `Let creative write it and stay out of the room`, risk: 'low', result: `The script arrives, competent and bland, like a cake made without sugar. You read it professionally and nobody remembers it.`, effects: [{ pop: 0.1 }, { fatigue: -2 }, { conf: -1 }] },
    ],
  },
  {
    id: 'ni_cr_entrance_music', category: 'creative', title: `They Want to Change Your Music`, weight: 1.5, cooldownDays: 250, maxPerCareer: 2, categoryCooldown: 6,
    cast: { producer: { pick: 'staff', role: 'producer' } }, noAutoMemory: true,
    trigger: { stat: { popularity: { gte: 10 }, careerYears: { gte: 1 } } },
    slots: { tune: [`a brass fanfare`, `a grinding guitar riff`, `a slow piano loop`], reason: [`the old track costs more to license each year`, `the crowd tends to talk over the current one`, `the director thinks the current one sounds like a dentist's waiting room`] },
    body: [`{producer.name} wants to replace your entrance music with {tune}, because {reason}. A demo plays on a laptop speaker, and it sounds like a different person walking out.`, `Entrance music is the first thing a crowd learns about you and the last thing they forget. It is also owned by somebody else.`],
    choices: [
      { id: 'accept', label: `Accept the new track and learn to walk to it`, risk: 'low', result: `The first night feels odd, and the third night feels natural. By the second week the crowd forgets there was ever another track.`, effects: [{ pop: 0.1 }, { conf: -1 }, { fatigue: 2 }] },
      { id: 'fight', label: `Fight for the old track and offer to share the cost`, risk: 'med', result: `The negotiation costs you a month of merchandise royalties and a lot of goodwill. The crowd sings the old chorus on cue the next week, and it was worth it.`, effects: [{ money: -1200 }, { pop: 0.5 }, { conf: 3 }] },
      { id: 'remix', label: `Propose a remix that keeps the old hook`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `The remix keeps the hook and loses the hiss, and the producer admits it sounds expensive. The crowd takes to it like a favorite sweater.`, effects: [{ pop: 0.6 }, { conf: 2 }, { fatigue: 3 }] },
        { weight: 1, text: `The remix lands in the uncanny valley between old and new, and the crowd cannot decide whether to sing or boo. You get the worst of both.`, effects: [{ pop: -0.2 }, { conf: -2 }, { fatigue: 3 }] } ] },
      { id: 'write_own', label: `Bring in a musician friend to write an original track`, risk: 'high', outcomes: [
        { weight: 1, text: `The new track is yours in every sense: strange, catchy and impossible to confuse with anyone else's. It becomes a ringtone and a source of royalties.`, effects: [{ pop: 0.9 }, { money: 1500 }, { conf: 4 }, { fatigue: 4 }] },
        { weight: 1, text: `The track is a lovely idea, and not ready in time. You walk out to silence while the DJ scrambles, and the crowd claps in sympathy.`, effects: [{ pop: -0.4 }, { money: -500 }, { conf: -3 }] } ] },
    ],
  },
  {
    id: 'ni_cr_vignette', category: 'creative', title: `Shooting Your Vignette in {place}`, weight: 1.5, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 6,
    cast: { creative: { pick: 'staff', role: 'creative' } }, noAutoMemory: true,
    trigger: { stat: { popularity: { gte: 15 }, careerYears: { gte: 1 } } },
    slots: { place: [`an empty gym`, `a deserted parking garage`, `a field at dawn`], concept: [`you walk in slow motion past a wall of old photographs`, `you tape your hands in complete silence`, `you speak to a camera about the one thing you regret`] },
    body: [`The crew has set up lights in {place}, and {creative.name} explains the concept: {concept}. A stranger is holding a boom microphone over your head like a fishing rod.`, `A vignette is a few minutes of film that decides how a crowd thinks of you for months. It is the one place where the audience sees you without a ring around you.`],
    choices: [
      { id: 'straight', label: `Play it straight and trust the camera`, risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `You let the silence sit, and the camera loves it. The vignette airs on a big night and the crowd goes quiet for it.`, effects: [{ pop: 0.9 }, { conf: 3 }, { fatigue: 3 }] },
        { weight: 1, text: `The take is fine, tidy and inoffensive, and nobody mentions it afterward. It is a professional piece of nothing.`, effects: [{ pop: 0.1 }, { fatigue: 3 }] } ] },
      { id: 'humor', label: `Add a streak of dry humor to keep it honest`, risk: 'med', result: `You smirk at the wrong moment, and the director leaves it in. The vignette gets a loving reputation as strange, warm and unexpectedly funny.`, effects: [{ pop: 0.7 }, { charisma: 1 }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'improvise', label: `Throw out the script and talk from the heart`, risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.5, charisma: 0.5 }, text: `Ninety seconds of unplanned truth make the crew stop whispering. The clip is cut down to forty seconds and replayed for months.`, effects: [{ pop: 1.4 }, { conf: 4 }, { mic: 1 }, { fatigue: 4 }] },
        { weight: 1, text: `The words come out in the wrong order and stay that way. The editor makes a hero out of three good seconds and hides the rest.`, effects: [{ pop: 0.1 }, { conf: -3 }, { fatigue: 4 }] } ] },
      { id: 'refuse_concept', label: `Refuse the concept: it is too close to home`, risk: 'med', result: `{creative.first} adjusts the plan to something lighter, with a sigh that shows how much time was spent on the first idea. Your privacy is intact and the vignette is shallower for it.`, effects: [{ pop: -0.1 }, { conf: 1 }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'ni_cr_rival_swerve', category: 'creative', title: `{rival.name} Has a Better Ending`, weight: 2, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 6,
    cast: { rival: { pick: 'rivalry', minHeat: 30 }, creative: { pick: 'staff', role: 'creative' } }, memory: { role: 'rival', max: 2 },
    trigger: { mem: [{ role: 'rival', heatGte: 25 }] },
    slots: { swerve: [`you both lose to a third party`, `a surprise handshake that turns into a brawl`, `a joint walkout from the main event`], where: [`in a shared stairwell`, `over a napkin sketch`, `at the end of a long production meeting`] },
    body: [`{rival.name} finds you {where} with an offer: {swerve}. It is better than anything creative has pitched for the feud, and it comes from the one person you are supposed to hate.`, `{creative.name} has already heard a version of it and is waiting to see if the pitch survives the two of you. It could be the best idea of the year or a very smart trap.`],
    choices: [
      { id: 'co_pitch', label: `Pitch it to creative together`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3, mic: 0.3 }, text: `The two of you present with a rehearsed synchronicity that makes {creative.first} laugh out loud. The plan is approved on the spot, and the finish lives up to the hype.`, effects: [{ pop: 1.1 }, { rel: { who: 'rival', respect: 6, trust: 4 } }, { conf: 3 }, { fatigue: 4 }] },
        { weight: 1, text: `Creative loves the idea and ruins the details. The finished angle is worse than the sketch, and both of you take turns not blaming the other.`, effects: [{ pop: 0.2 }, { rel: { who: 'rival', trust: 2 } }, { conf: -2 }] } ] },
      { id: 'steal', label: `Pitch it alone and take the credit`, risk: 'high', result: `The idea is approved and your name is on the paperwork. {rival.first} finds out the next day and does not raise {rival.their} voice, which is how you know it will cost you.`, effects: [{ pop: 0.9 }, { rel: { who: 'rival', trust: -9, heat: 8 } }, { rivalry: { who: 'rival', heat: 6 } }, { conf: 1 }] },
      { id: 'counter', label: `Counter with your own ending and bargain`, risk: 'med', result: `After an hour of hard bargaining, the final angle is a mix of both visions. Neither of you gets what you wanted and both get something good enough to defend.`, effects: [{ pop: 0.6 }, { rel: { who: 'rival', respect: 3 } }, { fatigue: 4 }, { conf: 1 }] },
      { id: 'veto', label: `Veto it: you do not trust a gift from this source`, risk: 'low', result: `{rival.first} shrugs and the idea goes back in a pocket. A cautious week follows, and the feud follows the original plan, which is neither better nor worse.`, effects: [{ rel: { who: 'rival', trust: -3 } }, { conf: -1 }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'ni_cr_mentor_reel', category: 'creative', title: `{mentor.name} Wants to Watch Tape With You`, weight: 2, cooldownDays: 220, maxPerCareer: 2, categoryCooldown: 6,
    cast: { mentor: { pick: 'tag', tag: 'mentor' } }, memory: { role: 'mentor', max: 1 },
    trigger: { stat: { matches: { gte: 5 } }, mem: [{ role: 'mentor', tag: 'mentor' }] },
    slots: { clip: [`your best match of the year`, `a promo you consider unremarkable`, `a three-second bump that you hate`], verdict: [`insists the real problem is in the first minute`, `says the best moment was an accident`, `points out that you never look at the crowd`] },
    body: [`{mentor.name} sits you down in front of a small monitor to watch {clip}, and {verdict}. The tape rolls three times, and each time you see something different.`, `Looking at yourself from outside is humbling, and it is the best training there is. A teacher who knows when to stop the tape is worth more than any belt.`],
    choices: [
      { id: 'drill', label: `Ask to drill the problem in the ring tomorrow`, risk: 'low', result: `Two hours of repetition leave you sore and sharper. {mentor.first} watches with a stopwatch and says only "again," which is the highest compliment available.`, effects: [{ rel: { who: 'mentor', respect: 3, trust: 3 } }, { attr: { name: 'technical', delta: 1 } }, { fatigue: 7 }, { conf: 2 }] },
      { id: 'defend', label: `Defend the choices you made and explain why`, risk: 'med', outcomes: [
        { weight: 1, bonus: { confidence: 0.4 }, text: `{mentor.first} listens, leans back and admits you made a better call than expected. It is the first time you have won a debate in that room.`, effects: [{ rel: { who: 'mentor', respect: 5 } }, { conf: 4 }] },
        { weight: 1, text: `The defense is thin, and {mentor.first} lets the silence do the work. You get the feeling of being right about a different question.`, effects: [{ rel: { who: 'mentor', trust: -2 } }, { conf: -3 }] } ] },
      { id: 'notes', label: `Take notes and change nothing until you are sure`, risk: 'low', result: `The notebook fills with careful scribbles, and you consider each point for a week. It is a slow, sensible approach that makes for a slow, sensible improvement.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { fatigue: 2 }, { conf: 1 }] },
      { id: 'play_hooky', label: `Cut the session short: you have a match to prepare for`, risk: 'med', result: `{mentor.first} stops the tape and nods, though the nod has a short fuse. The match is fine, and the lesson sits unopened on the shelf.`, effects: [{ rel: { who: 'mentor', trust: -3, respect: -2 } }, { pop: 0.2 }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'ni_cr_team_name', category: 'creative', title: `Naming the Team`, weight: 1.5, cooldownDays: 240, maxPerCareer: 1, categoryCooldown: 6,
    cast: { ally: { pick: 'tag', tag: 'ally' }, creative: { pick: 'staff', role: 'creative' } }, memory: { role: 'ally', max: 1 },
    trigger: { mem: [{ role: 'ally', trustGte: 10 }] },
    slots: { process: [`a hat full of paper slips`, `a dartboard in the gym`, `a vote among the ring crew`], name: [`"The Night Shift"`, `"Second Wind"`, `"Loose Change"`] },
    body: [`You and {ally.name} are trying to name your partnership for {creative.name}, and the process so far has been {process}. The winner is {name}, and both of you are privately unconvinced.`, `A name is a promise about a personality. It is also printed on shirts, so it cannot be taken back.`],
    choices: [
      { id: 'run_with_it', label: `Embrace the name and make it work`, risk: 'low', result: `By the third week the name has acquired a personality of its own, and the crowd shouts it back at you. You both agree you would never have chosen it, and neither of you would change it now.`, effects: [{ pop: 0.5 }, { rel: { who: 'ally', affinity: 4 } }, { conf: 2 }] },
      { id: 'push_own', label: `Pitch your own name and defend it hard`, risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `Your pitch has a story, a logo idea and a laugh. {ally.first} grins and says that it is better, and {creative.first} agrees to change.`, effects: [{ pop: 0.6 }, { rel: { who: 'ally', trust: 3 } }, { conf: 3 }] },
        { weight: 1, text: `The pitch does not fit, and {ally.first} politely says so. The argument takes an hour and the original name stays.`, effects: [{ rel: { who: 'ally', trust: -2 } }, { conf: -2 }, { fatigue: 2 }] } ] },
      { id: 'let_ally', label: `Let {ally.first} choose and take whatever comes`, risk: 'low', result: `{ally.first} is touched and chooses something unexpectedly tender. The name goes on the shirts and neither of you ever explains it, though both of you know.`, effects: [{ rel: { who: 'ally', trust: 5, affinity: 5 } }, { pop: 0.2 }, { conf: 1 }] },
      { id: 'no_name', label: `Skip a name and just go out as the two of you`, risk: 'high', result: `The crowd calls you whatever it likes, and creative sighs. The act gains an unbranded charm and loses a merchandise line.`, effects: [{ pop: -0.1 }, { money: -400 }, { rel: { who: 'ally', respect: 1 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'ni_cr_plan_to_lose', category: 'creative', title: `The Plan Is for You to Lose to {rookie.name}`, weight: 2, cooldownDays: 180, maxPerCareer: 2, categoryCooldown: 6,
    cast: { rookie: { pick: 'roster', tier: { lte: 1 }, sameBrand: true }, creative: { pick: 'staff', role: 'creative' } }, noAutoMemory: true,
    trigger: { stat: { popularity: { gte: 20 }, careerYears: { gte: 2 } } },
    slots: { how: [`in under two minutes`, `after a long, beautiful match`, `by pinfall off a move you have never seen`], why: [`to establish the newcomer`, `to reset your character`, `because the numbers say the crowd will love it`] },
    body: [`{creative.name} explains the plan carefully, as if reading a will: you lose to {rookie.name} {how}, {why}. The tone is kind and the decision is final, and you suspect it was made two meetings ago.`, `Losing for someone else is a craft that nobody applauds. It can be the most generous thing you do in a career, or the first step toward being the guy who lost to everyone.`],
    choices: [
      { id: 'accept', label: `Accept and make the loss look like a million dollars`, risk: 'low', result: `You sell every strike with the full-body commitment of an actor in a death scene. {rookie.first} takes the win to a roar, and several veterans give you a quiet nod in the hall.`, effects: [{ rel: { who: 'rookie', respect: 6, trust: 5 } }, { pop: -0.2 }, { conf: -1 }, { fatigue: 5 }] },
      { id: 'condition', label: `Accept if you get a rematch clause in writing`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.3, charisma: 0.2 }, text: `{creative.first} shrugs and puts the clause in the plan. You lose the match and keep the future.`, effects: [{ pop: -0.1 }, { rel: { who: 'rookie', respect: 2 } }, { conf: 2 }] },
        { weight: 1, text: `The clause is declined with a bland smile. You lose the match and gain a reputation for bargaining at funerals.`, effects: [{ pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'different', label: `Pitch a closer finish where it takes two tries`, risk: 'med', result: `The compromise gives the newcomer the win and you a half-step of dignity. The match tells a better story and costs you an extra week of bruises.`, effects: [{ pop: 0.3 }, { rel: { who: 'rookie', respect: 3 } }, { fatigue: 7 }, { conf: 1 }] },
      { id: 'refuse', label: `Refuse: you do not lose in under two minutes for anyone`, risk: 'high', result: `The refusal is noted in a quiet voice and then in the next booking sheet. You keep your streak of pride and lose a share of the benefit of the doubt.`, effects: [{ pop: -0.4 }, { conf: 3 }, { rel: { who: 'rookie', respect: -2 } }] },
    ],
  },
  {
    id: 'ni_cr_crowd_chant', category: 'creative', title: `The Crowd Went Off Script`, weight: 1.5, contexts: ['post_match'], cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 6,
    trigger: { stat: { popularity: { gte: 15 }, matches: { gte: 5 } } },
    slots: { chant: [`a chant of your name`, `an unprompted song`, `a slow clap that builds and builds`], cue: [`during the finishing stretch`, `just after the bell`, `as you reached the top of the ramp`] },
    body: [`The crowd came up with {chant} {cue}, and it was nobody's idea. For about ten seconds the whole building was a single machine pointed at you.`, `Moments like that cannot be written, only noticed. What you do with the next few seconds will decide whether it becomes a story or a blur.`],
    choices: [
      { id: 'milk', label: `Stop and milk it for all it is worth`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `You stand still and let it grow, and the volume rises to something close to ecstasy. The producer smiles in the monitor room and adds the footage to the highlight reel.`, effects: [{ pop: 1.1 }, { conf: 4 }, { fatigue: 2 }] },
        { weight: 1, text: `You wait a second too long, and the energy leaks out of the building. The moment passes in an awkward shuffle, and the producer coughs.`, effects: [{ pop: 0.1 }, { conf: -2 }] } ] },
      { id: 'stay_script', label: `Stick to the plan and hit your cues`, risk: 'low', result: `The match flows on exactly as rehearsed, and the producers note your professionalism. The crowd is just slightly disappointed that you did not notice.`, effects: [{ pop: 0.1 }, { conf: -1 }, { fatigue: -1 }] },
      { id: 'thank', label: `Point at the crowd and take a bow to thank them`, risk: 'low', result: `The gesture is small and genuine, and the response is a wave of cheering that lasts until the exit. It looks like love because it is.`, effects: [{ pop: 0.6 }, { conf: 3 }, { fatigue: 1 }] },
      { id: 'pitch', label: `Pitch creative on building the next show around it`, risk: 'high', outcomes: [
        { weight: 1, text: `Creative agrees, builds a callback and feeds the crowd exactly what it wanted. The chant becomes a tradition for the next three months.`, effects: [{ pop: 1.0 }, { conf: 3 }, { fatigue: 4 }] },
        { weight: 1, text: `Creative overbuilds it, and the crowd smells the manufacture. The chant fades, and the callback feels hollow.`, effects: [{ pop: -0.2 }, { conf: -2 }, { fatigue: 4 }] } ] },
    ],
  },
  {
    id: 'ni_cr_merch_design', category: 'creative', title: `The Merch Table Wants Your Opinion`, weight: 1.5, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 6,
    cast: { exec: { pick: 'staff', role: 'executive' } }, noAutoMemory: true,
    trigger: { stat: { popularity: { gte: 20 } } },
    slots: { design: [`a shirt with your face as a cartoon`, `a shirt with a single word on it`, `a plush toy in your colors`], quirk: [`the cartoon looks suspiciously surprised`, `the word is spelled in an unfamiliar font`, `the plush has one eye slightly larger than the other`] },
    body: [`{exec.name} unrolls a proof of {design} and asks what you think. Mostly it is lovely, but {quirk}, and everyone present is hoping you do not notice.`, `Merchandise is how a person's work reaches kitchens and bedrooms. It is also, quietly, a verdict on how the company sees you.`],
    choices: [
      { id: 'approve', label: `Approve it as it is and move on`, risk: 'low', result: `The first batch ships, and the quirk becomes a bizarre selling point. Fans start asking for the surprised version specifically.`, effects: [{ money: 1200 }, { pop: 0.3 }, { conf: -1 }] },
      { id: 'redo', label: `Send it back for a full redesign`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.3 }, text: `The redesign is crisp and a better fit, and the batch sells out at the next arena. {exec.first} concedes the point with obvious relief.`, effects: [{ money: 2200 }, { pop: 0.5 }, { conf: 2 }, { fatigue: 2 }] },
        { weight: 1, text: `The redesign delays the launch by a month, and the new version is no better. The money you hoped for arrives later and smaller.`, effects: [{ money: 300 }, { conf: -2 }, { fatigue: 2 }] } ] },
      { id: 'charity', label: `Approve it and pledge part of the sales to charity`, risk: 'low', result: `The announcement turns the shirt into a small cause, and fans buy it twice. Your accountant shrugs and your conscience smiles.`, effects: [{ money: 400 }, { pop: 0.6 }, { conf: 2 }] },
      { id: 'sign_off_quirk', label: `Keep the quirk but sign every first copy yourself`, risk: 'med', result: `Four hundred signatures later, your hand feels like it belongs to a different person. The signed run sells in an hour, and the weirdness becomes a collectible.`, effects: [{ money: 2000 }, { fatigue: 6 }, { pop: 0.4 }, { conf: 1 }] },
    ],
  },
  {
    id: 'ni_cr_real_history', category: 'creative', title: `Creative Wants to Use What Really Happened`, weight: 2.5, major: true, cooldownDays: 240, maxPerCareer: 1, categoryCooldown: 6,
    cast: { former: { pick: 'tag', tag: 'betrayal' }, creative: { pick: 'staff', role: 'creative' } }, memory: { role: 'former', max: 2 },
    trigger: { mem: [{ role: 'former', betrayal: true }] },
    slots: { angle: [`a public reconciliation that turns sour`, `a documentary-style retelling of the split`, `a surprise reunion in the ring`], pitched: [`with an index card`, `with a storyboard on the wall`, `with a single sentence on a whiteboard`] },
    body: [`{creative.name} pitches an angle {pitched}: {angle}, built on what actually happened between you and {former.name}. The material is rich, because every beat in it is real.`, `Real history makes the best fiction and the worst contracts. Turning a wound into a story can heal it or press on it until it bleeds again.`],
    choices: [
      { id: 'agree', label: `Agree and work the angle with everything you have`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, mic: 0.4 }, text: `The first promo is quiet, exact and unsettling, and the crowd leans in with its mouth open. When it is over you realise you have not been acting for a while.`, effects: [{ pop: 1.4 }, { rivalry: { who: 'former', heat: 8 } }, { conf: 3 }, { fatigue: 5 }] },
        { weight: 1, text: `The old anger leaks through the performance and the performance dissolves. The segment is raw, hard to watch and probably useful to nobody.`, effects: [{ pop: 0.2 }, { rel: { who: 'former', heat: 6, trust: -3 } }, { conf: -4 }, { fatigue: 5 }] } ] },
      { id: 'ask_first', label: `Take the idea to {former.first} before saying yes`, risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `{former.first} listens, thinks about it for two days and then says yes with a few conditions. It becomes the first honest conversation you have had in months.`, effects: [{ rel: { who: 'former', trust: 6, respect: 5, heat: -4 } }, { pop: 0.7 }, { conf: 2 }, { fatigue: 3 }] },
        { weight: 1, text: `{former.first} hears the pitch as exploitation and walks out. You have protected something, and you have lost the angle.`, effects: [{ rel: { who: 'former', heat: 3, respect: 2 } }, { pop: -0.1 }, { conf: -1 }] } ] },
      { id: 'refuse', label: `Refuse: some things should not be a plot`, risk: 'low', result: `Creative accepts with something close to relief and a little disappointment. A drawer closes quietly on an idea that might have worked.`, effects: [{ pop: -0.2 }, { conf: 2 }, { rel: { who: 'former', respect: 1 } }] },
      { id: 'twist', label: `Agree, but twist the facts until nobody can find the seams`, risk: 'med', result: `The version that airs is accurate in feeling and false in detail, and you are the only person who can tell which is which. The crowd is thrilled, and {former.first} says nothing for two weeks.`, effects: [{ pop: 0.9 }, { rel: { who: 'former', heat: 3 } }, { conf: -1 }, { fatigue: 4 }] },
    ],
  },
  {
    id: 'ni_cr_stip_pitch', category: 'creative', title: `A Gimmick Match for the Feud`, weight: 2, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 6,
    cast: { rival: { pick: 'rivalry', minHeat: 30 }, creative: { pick: 'staff', role: 'creative' } }, memory: { role: 'rival', max: 1 },
    trigger: { mem: [{ role: 'rival', h2h: { matchesGte: 2 } }] },
    slots: { argument: [`the crowd would explode for it`, `the numbers say a normal match has run its course`, `it would finally put the argument to rest`], setting: [`at the next big show`, `on a free television episode`, `at a house show to test it`] },
    body: [`{creative.name} wants to give the feud with {rival.name} a gimmick match {setting}, because {argument}. Three options are on the table, each with a different price in bruises.`, `You will do the work, and your body will keep the receipts. Pick the weapon that fits the story you want to tell.`],
    choices: [
      { id: 'ladder', label: `Go for a ladder match and take the big spots`, risk: 'high', outcomes: [
        { weight: 2, bonus: { toughness: 0.3, overall: 0.3 }, text: `The ladder spots are spectacular, and the building is on its feet for every climb. You limp away looking like a hero with a prosthetic leg of ice packs.`, effects: [{ booking: { who: 'rival', type: 'ladder' } }, { pop: 1.2 }, { rel: { who: 'rival', respect: 4 } }, { fatigue: 12 }, { conf: 3 }] },
        { weight: 1, text: `A ladder shifts a half-inch in the wrong direction and a fall goes wrong. The match is a classic, and the doctor's waiting room is quieter than your phone.`, effects: [{ booking: { who: 'rival', type: 'ladder' } }, { pop: 0.8 }, { fatigue: 12 }, { injury: { part: 'torso', severity: 1, days: 10 } }] } ] },
      { id: 'cage', label: `Choose a steel cage and close the door on the feud`, risk: 'med', result: `The cage gets built, bolted and filled with two furious people. The match is brutal and tight, and it ends the argument in a way no one can dispute.`, effects: [{ booking: { who: 'rival', type: 'cage' } }, { pop: 0.8 }, { rivalry: { who: 'rival', heat: 5 } }, { fatigue: 9 }] },
      { id: 'last_man', label: `Pick a last man standing match and make it personal`, risk: 'med', result: `Ten counts, a long slow burn and a finish that nobody saw coming. It leaves both of you hollow and the crowd roaring.`, effects: [{ booking: { who: 'rival', type: 'last_man' } }, { pop: 0.9 }, { rel: { who: 'rival', respect: 3, heat: 4 } }, { fatigue: 10 }] },
      { id: 'normal', label: `Insist on a standard match: no gimmicks`, risk: 'low', result: `Creative frowns and gives way. The match is clean and honest, and the crowd accepts it without losing its breath.`, effects: [{ booking: { who: 'rival', type: 'singles' } }, { pop: 0.3 }, { rel: { who: 'rival', respect: 2 } }, { fatigue: 3 }] },
    ],
  },
];
