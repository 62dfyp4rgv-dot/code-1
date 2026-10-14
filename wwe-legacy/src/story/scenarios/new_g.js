// New scenarios (set G): comeback, retirement, legacy, rumble, wrestlemania, championship, press. Ids prefixed ng_.
export default [
  // ======================= COMEBACK =======================
  {
    id: 'ng_cbk_rival_welcome', category: 'comeback', title: `A Welcome Back From {rival.name}`, weight: 2, contexts: ['pre_show', 'show_day'], cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 8,
    cast: { rival: { pick: 'rivalry', minHeat: 15, status: 'active' } }, memory: { role: 'rival', max: 1, noResults: true },
    trigger: { injured: false, stat: { careerYears: { gte: 1.5 } }, daysSince: { match: { gte: 45 } } },
    slots: { where: [`in the tunnel`, `beside the catering table`, `outside the production truck`], delivery: [`a handshake held one beat too long`, `a slow clap with no smile attached`, `a single nod across the room that somehow says more`] },
    body: [`{rival.name} is waiting {where} when you arrive, and the welcome comes as {delivery}. Nobody else in the building has been counting the weeks you were gone, and you suspect {rival.first} has.`, `A feud does not pause just because one side takes time off. {rival.first} stands there in a way that asks whether you came back to the same fight or to a different one.`],
    choices: [
      { id: 'shake', label: `Shake on it and keep the feud for the bell`, risk: 'low', result: `The handshake is firm and dry, and you both let go at the same moment. It is a truce for about the length of a hallway, and it earns you a measure of respect from the people pretending not to watch.`, effects: [{ rel: { who: 'rival', respect: 5, heat: -4 } }, { conf: 2 }] },
      { id: 'needle', label: `Needle {rival.first} about how quiet the place got`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.6 }, text: `The line lands cleanly, and {rival.first} laughs before {rival.they} can stop it. A stagehand repeats it to three other people before the doors open.`, effects: [{ pop: 0.5 }, { rel: { who: 'rival', heat: 5 } }, { conf: 3 }] },
        { weight: 1, text: `The joke sounds rusty, and {rival.first} lets the silence do the answering. You spend the next ten minutes rehearsing better lines you did not say.`, effects: [{ conf: -3 }, { rel: { who: 'rival', respect: -2 } }] } ] },
      { id: 'ask', label: `Ask {rival.first} straight whether the fight is still on`, risk: 'low', result: `"Obviously," {rival.first} says, with something very close to relief. Knowing where you stand feels better than you expected, and the heat between you is warm again by the end of the night.`, effects: [{ rivalry: { who: 'rival', heat: 8 } }, { pop: 0.3 }, { conf: 2 }] },
      { id: 'pass', label: `Walk past without breaking stride`, risk: 'low', result: `You keep your eyes on the end of the corridor and your pace even. Behind you {rival.first} says nothing, which is a message of its own, and your shoulders stay tight until you reach the locker room.`, effects: [{ conf: -1 }, { fatigue: -2 }, { rel: { who: 'rival', respect: -2 } }] },
    ],
  },
  {
    id: 'ng_cbk_music_remixed', category: 'comeback', title: `Your Entrance Has Been Remixed`, weight: 1.5, contexts: ['pre_show', 'show_day'], cooldownDays: 300, maxPerCareer: 1, categoryCooldown: 8,
    cast: { producer: { pick: 'staff', role: 'producer' } },
    trigger: { injured: false, stat: { careerYears: { gte: 1.5 }, popularity: { gte: 15 } }, daysSince: { match: { gte: 60 } } },
    slots: { change: [`a drum intro nobody asked for`, `ten seconds of dead air before the first note`, `a horn section that sounds uncomfortably like a kazoo`], culprit: [`a junior editor`, `a new sound mixer`, `an intern left alone with the software`] },
    body: [`Your theme starts during rehearsal and something is wrong right away: {change}. {producer.name} winces when you turn around, and explains that {culprit} was handed the file while you were away. "I did not hear it until this morning," {producer.first} adds.`, `A theme is the only part of you the building hears before it sees you. You can fix the file in an hour, live with it, or let the crowd settle the argument.`],
    choices: [
      { id: 'restore', label: `Insist on the original, whatever the studio fee`, risk: 'low', result: `The studio is booked for the afternoon and the invoice is not small. By the time the doors open the old theme is back, every note where you left it.`, effects: [{ money: -600 }, { conf: 3 }, { fatigue: 3 }] },
      { id: 'keep', label: `Keep the new version and sell it as the new you`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.6 }, text: `You walk out to it with a straight face, and the crowd decides the strangeness is the point. By the second chorus half the building is clapping on the wrong beat on purpose.`, effects: [{ pop: 0.7 }, { conf: 3 }] },
        { weight: 1, text: `The first bar gets a confused murmur and the second gets a laugh at your expense. You wear the walk like a borrowed coat all the way to the ring.`, effects: [{ pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'blend', label: `Ask for a blend: the original with one new sound`, risk: 'low', result: `{producer.first} makes the cut in forty minutes and the result is better than either version. Nobody notices the compromise, which is the whole idea.`, effects: [{ pop: 0.2 }, { conf: 1 }, { fatigue: 2 }] },
      { id: 'test', label: `Run both versions on the first match and read the room`, risk: 'med', result: `The old theme gets the louder pop and the new one gets the curious one, and you walk off with a notebook of crowd noise. It is more homework than you wanted on a night you only meant to survive.`, effects: [{ pop: 0.3 }, { fatigue: 5 }, { conf: 1 }, { attr: { name: 'psychology', delta: 1 } }] },
    ],
  },
  {
    id: 'ng_cbk_ally_kept_place', category: 'comeback', title: `{ally.name} Guarded Your Place`, weight: 2, contexts: ['pre_show', 'weekly'], cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 8,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1, noResults: true },
    trigger: { injured: false, stat: { careerYears: { gte: 1 } }, daysSince: { match: { gte: 45 } } },
    slots: { place: [`your seat in the travel van`, `your corner of the locker room`, `your usual table at the pre-show meal`], proof: [`a strip of tape with your name on it`, `a sticky note reading RESERVED in block capitals`, `a rolled towel laid across it like a sleeping dog`] },
    body: [`{ally.name} has been defending {place} on your behalf for the whole time you were gone, and the evidence is {proof}. Newcomers apparently tried to claim it more than once.`, `Loyalty in this business is mostly small inconveniences carried for no reward. "Somebody had to," {ally.first} says with a shrug, but the way {ally.first} will not quite meet your eye says it cost more than a sticky note.`],
    choices: [
      { id: 'thank', label: `Thank {ally.first} properly, in private`, risk: 'low', result: `You say it plainly, with no joke attached, and {ally.first} nods at the floor for a while. It is a short conversation and it settles something that months of silence had left open.`, effects: [{ rel: { who: 'ally', trust: 8, affinity: 5 } }, { conf: 2 }] },
      { id: 'dinner', label: `Take {ally.first} out for a proper dinner`, risk: 'low', requires: { stat: { money: { gte: 300 } } }, result: `The restaurant has tablecloths and a menu with no prices on your side of it. You talk until the staff start stacking chairs, and the road feels shorter for weeks afterward.`, effects: [{ money: -300 }, { rel: { who: 'ally', trust: 6, affinity: 8 } }, { fatigue: -4 }, { conf: 2 }] },
      { id: 'give_back', label: `Give the spot to {ally.first} for good`, risk: 'med', result: `{ally.first} protests twice and accepts the third time, and the locker room takes note of someone who gives things away. You are a little lighter and a little less settled, and the trust runs deep.`, effects: [{ rel: { who: 'ally', trust: 10, respect: 5 } }, { conf: -2 }, { pop: 0.1 }] },
      { id: 'proud', label: `Say you did not need anyone minding your things`, risk: 'high', result: `It comes out harder than intended and the hallway goes quiet around it. {ally.first} gathers up the proof and walks off, and you are left standing at a spot that suddenly feels very empty.`, effects: [{ rel: { who: 'ally', trust: -6, affinity: -5 } }, { conf: 2 }] },
    ],
  },
  {
    id: 'ng_cbk_reconciled_rust', category: 'comeback', title: `Shaking Off the Rust With {friend.name}`, weight: 1.5, cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 8,
    cast: { friend: { pick: 'tag', tag: 'reconciled' } }, memory: { role: 'friend', max: 1 },
    trigger: { injured: false, stat: { careerYears: { gte: 1.5 } }, daysSince: { match: { gte: 30 } } },
    slots: { place: [`a training school in a converted warehouse`, `the back room of a gym with a spare ring`, `a closed roller rink with the lights half on`], plan: [`bumps first and talking later`, `rope work and nothing else`, `three hours of lockups until your hands stop shaking`] },
    body: [`After the peace you two made, a message from {friend.name} still feels slightly strange to read. The proposal is a private session at {place}, with a plan of {plan}. "No cameras, no audience, no excuses," the message ends.`, `Your timing needs work and your body knows it. Working it out in front of a former enemy is a risk, and working it out in front of anyone else is worse.`],
    choices: [
      { id: 'go', label: `Go and put yourself in {friend.first}'s hands`, risk: 'med', result: `The first hour is ugly and the second is better, and by the third you are laughing between spots. You limp out sore and quietly pleased that the person who knows your worst habits is on your side.`, effects: [{ rel: { who: 'friend', trust: 6, respect: 4 } }, { conf: 4 }, { fatigue: 9 }, { attr: { name: 'technical', delta: 1 } }] },
      { id: 'content', label: `Invite a camera crew to film the session`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `The footage of two former enemies helping each other up goes around fast, and nobody can decide whether it is a promotion or a miracle. {friend.first} grumbles about the cameras and then asks for a copy.`, effects: [{ pop: 0.8 }, { rel: { who: 'friend', trust: -2, affinity: 3 } }, { fatigue: 7 }] },
        { weight: 1, text: `The crew keeps stopping the session to reset lights, and the rhythm never arrives. {friend.first} leaves early with a polite excuse and a look that says it was a private offer.`, effects: [{ rel: { who: 'friend', trust: -6 } }, { pop: 0.1 }, { fatigue: 4 }] } ] },
      { id: 'trainer', label: `Ask a trainer to sit in and watch the ropes`, risk: 'low', result: `A trainer takes notes from a folding chair and stops you twice before something goes wrong. You work slower and safer, and {friend.first} says it is the first time the two of you have ever been this careful together.`, effects: [{ rel: { who: 'friend', trust: 3 } }, { conf: 2 }, { fatigue: 5 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'decline', label: `Decline and wait for the office to schedule your return`, risk: 'low', result: `You send back a short thank-you and keep your Tuesday free for nothing in particular. The rust stays on, and the gap between you and {friend.first} stays exactly as wide as it was.`, effects: [{ conf: -2 }, { fatigue: -5 }, { rel: { who: 'friend', trust: -2 } }] },
    ],
  },
  {
    id: 'ng_cbk_says_finished', category: 'comeback', title: `{rival.name} Says You Are Finished`, weight: 2.5, major: true, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 8,
    cast: { rival: { pick: 'rivalry', minHeat: 20, status: 'active' } }, memory: { role: 'rival', max: 1, noResults: true },
    trigger: { injured: false, stat: { popularity: { gte: 20 }, careerYears: { gte: 1.5 } }, daysSince: { match: { gte: 40 } } },
    slots: { audience: [`a morning radio host`, `a backstage interviewer`, `anyone within earshot of the catering table`], claim: [`you came back to collect a cheque`, `the ring moved on without you`, `your body retired months ago and nobody told you`] },
    body: [`{rival.name} told {audience} that {claim}. It has been repeated enough times that strangers now say it back to you in hallways, half as a question. "You are not finished, right?" a stagehand asks, holding the door.`, `The fans cannot tell whether it is a fact or a feud, and for once neither can you. Whatever you say next will be the version people remember.`],
    choices: [
      { id: 'ring', label: `Answer in the ring: demand a match with {rival.first}`, risk: 'med', result: `The request goes in writing and the office says yes before lunch. You have bought yourself a stage and a deadline, and the part of you that remembers the layoff starts to tick.`, effects: [{ booking: { who: 'rival', type: 'singles' } }, { rivalry: { who: 'rival', heat: 8 } }, { pop: 0.5 }, { fatigue: 4 }] },
      { id: 'mic', label: `Answer on the microphone, with a smile`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.7, confidence: 0.3 }, text: `You deliver the reply slowly and let the crowd finish it for you. The line is quoted everywhere by morning, and {rival.first} is suddenly the one explaining.`, effects: [{ pop: 0.9 }, { conf: 4 }, { event: { type: 'promo_delivered', participants: ['rival'], summary: `Answered {rival.name}'s claim that the comeback was pointless.`, data: { quality: { base: 66, mic: 0.5, charisma: 0.3 } } } }] },
        { weight: 1, text: `The smile comes out like a grimace, and the line you rehearsed all day dies two words in. The crowd gives you a polite hand, which is worse than a boo.`, effects: [{ pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'ignore', label: `Ignore it and let your matches talk`, risk: 'low', result: `You say nothing for two weeks, which is a long time in an easy-to-quote business. The talk fades slowly, and {rival.first} spends the quiet looking slightly foolish.`, effects: [{ pop: 0.1 }, { conf: 1 }, { rel: { who: 'rival', respect: 2 } }] },
      { id: 'agree', label: `Agree with half of it, loudly and with a laugh`, risk: 'high', result: `You admit the layoff took something and promise to take it back one piece at a time. The honesty disarms the room, and {rival.first} is left holding an insult with no target.`, effects: [{ conf: -2 }, { pop: 0.5 }, { rel: { who: 'rival', heat: -4, respect: 4 } }, { charisma: 1 }] },
    ],
  },
  {
    id: 'ng_cbk_respected_wait', category: 'comeback', title: `{vet.name} Wants You at Full Strength`, weight: 1.5, cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 8,
    cast: { vet: { pick: 'tag', tag: 'respected_by' } }, memory: { role: 'vet', max: 1, noResults: true },
    trigger: { injured: false, stat: { careerYears: { gte: 1.5 } }, daysSince: { match: { gte: 35 } } },
    slots: { how: [`in a hurried phone message`, `in a note slid under your hotel door`, `through the locker-room grapevine`], pace: [`to your pace`, `at whatever speed your body allows`, `with every spot chosen by you`] },
    body: [`The word arrives {how}: whenever the office books you against {vet.name}, {vet.they} will work {pace}. "No hurry," the message ends. It is meant as a kindness, and it lands as something heavier.`, `A veteran who respects you has just told you, politely, that you look fragile. You have to decide whether to take the gift, refuse it, or ask for the opposite.`],
    choices: [
      { id: 'accept', label: `Accept the offer and work at a careful pace`, risk: 'low', result: `The match is steady and clean, and nobody in the building guesses it was negotiated beforehand. You finish with all your joints and slightly less swagger.`, effects: [{ conf: 1 }, { fatigue: 4 }, { pop: 0.1 }, { rel: { who: 'vet', trust: 4, respect: 2 } }] },
      { id: 'refuse', label: `Refuse and ask {vet.first} to work the match at full speed`, risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.5, confidence: 0.3 }, text: `{vet.first} looks at you for a long second and then nods, and the match that follows is a proper contest. Every strike lands with the sound of a decision.`, effects: [{ pop: 0.8 }, { conf: 5 }, { fatigue: 11 }, { rel: { who: 'vet', respect: 7 } }] },
        { weight: 1, text: `The pace is too much too early, and a landing that should have been routine buckles your leg. You finish the match limping and say nothing to anyone.`, effects: [{ conf: -4 }, { fatigue: 11 }, { injury: { part: 'legs', severity: 1, days: 9 } }] } ] },
      { id: 'ask_lessons', label: `Ask {vet.first} to show you what you missed`, risk: 'med', result: `Over coffee {vet.first} points out three habits that have crept into your work, none of them flattering. It is humbling and extremely useful, and you leave with a tidier match plan.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { rel: { who: 'vet', respect: 4, affinity: 3 } }, { conf: -1 }, { fatigue: 3 }] },
      { id: 'postpone', label: `Ask the office to move the match back a few weeks`, risk: 'med', result: `The date slides and the card changes around it, and a few people mutter that you are being precious. You use the extra time well and arrive both stronger and slightly less popular with the schedulers.`, effects: [{ fatigue: -8 }, { conf: 2 }, { pop: -0.2 }, { money: -800 }] },
    ],
  },
  {
    id: 'ng_cbk_studied_you', category: 'comeback', title: `{foe.name} Knows Your Match Better Than You Do`, weight: 1.5, cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 8,
    cast: { foe: { pick: 'tag', tag: 'studying_you' } }, memory: { role: 'foe', max: 1 },
    trigger: { injured: false, stat: { careerYears: { gte: 1.5 } }, daysSince: { match: { gte: 30 } } },
    slots: { place: [`next to the vending machines`, `on the bench beside yours in the gym`, `in the back of the shuttle van`], tell: [`counts the steps before your finish on one hand`, `quotes a rope break from a match you barely remember`, `hums the opening bars of your theme just to prove a point`] },
    body: [`Walking in after your layoff you find {foe.name} {place}, and within a minute {foe.first} {tell}. It dawns on you that your habits have become public property.`, `A habit is only a weakness that has not been punished yet. You can retire the old patterns, bury them under new ones, or find out how much {foe.first} really noticed.`],
    choices: [
      { id: 'rebuild', label: `Rebuild your pattern from the ground up`, risk: 'med', result: `For two weeks you drill unfamiliar transitions with a coach and hate every minute. The new routine is awkward, and it belongs to nobody but you.`, effects: [{ attr: { name: 'technical', delta: 1 } }, { fatigue: 9 }, { conf: -1 }, { pop: 0.1 }] },
      { id: 'bait', label: `Keep the old habits and use them as bait`, risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.4, confidence: 0.4 }, text: `{foe.first} jumps at the familiar opening and walks straight into the reversal you laid for exactly that moment. The crowd gasps, and a lesson is delivered that nobody will forget.`, effects: [{ pop: 0.7 }, { conf: 5 }, { rel: { who: 'foe', respect: 3, fear: 4 } }] },
        { weight: 1, text: `The trap is sprung a half-second early, and {foe.first} counters it with a smile that says every habit was catalogued. You eat the move and the humiliation together.`, effects: [{ pop: -0.3 }, { conf: -4 }, { fatigue: 5 }] } ] },
      { id: 'notes', label: `Ask {foe.first} what else was noticed`, risk: 'med', result: `The list takes a full cup of coffee ("You tuck your chin before every suplex" is the first item), and some of it is generous and some is not. You walk away with a clearer picture of yourself and a rival who is, oddly, easier to be around.`, effects: [{ rel: { who: 'foe', respect: 5, heat: -4 } }, { attr: { name: 'psychology', delta: 1 } }, { conf: -1 }] },
      { id: 'shrug', label: `Shrug it off and trust your instincts`, risk: 'low', result: `You say that anyone who watches that closely must have a lot of free time, and the line gets a small laugh. Your instincts stay as sharp as they were, but so does the file {foe.first} keeps.`, effects: [{ conf: 2 }, { fatigue: -2 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'ng_cbk_glass_opponent', category: 'comeback', title: `The Opponent Who Handles You Like Glass`, weight: 1.5, contexts: ['pre_show'], cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 8,
    cast: { opp: { pick: 'roster', tier: { lte: 2 }, sameBrand: true } },
    trigger: { injured: false, stat: { careerYears: { gte: 1.5 } }, daysSince: { match: { gte: 30, lte: 400 } } },
    slots: { how: [`checks your face after every bump`, `mutters an apology under the breath before each hold`, `lowers you to the mat like a sleeping child`], venue: [`a house show in a gymnasium`, `a television taping with the cameras on`, `a half-empty arena at the end of a long road swing`] },
    body: [`Before the match at {venue}, you and {opp.name} walk through the spots, and {opp.first} {how}. It is kind, well meant and quietly insulting, and the agent watching from the side is starting to notice.`, `Nobody has told {opp.first} you are fragile, which means {opp.first} guessed. You have maybe a minute to decide what kind of match this is going to be.`],
    choices: [
      { id: 'whisper', label: `Whisper "harder" in the middle of a hold`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `{opp.first} takes the instruction at face value, and the next exchange crackles. That night the front row sits up, and you finish the match properly alive.`, effects: [{ pop: 0.5 }, { conf: 4 }, { fatigue: 8 }] },
        { weight: 1, text: `That night {opp.first} overcorrects and lays in a forearm that rings your ears. You get the match you asked for and a bruise the size of a saucer.`, effects: [{ pop: 0.3 }, { conf: 1 }, { fatigue: 9 }, { injury: { part: 'head', severity: 1, days: 5 } }] } ] },
      { id: 'allow', label: `Accept the gentle handling and let the match go smoothly`, risk: 'low', result: `The bout ends without incident and without memory. You save your body at the cost of a crowd that wanted more.`, effects: [{ pop: -0.2 }, { fatigue: 2 }, { conf: -2 }] },
      { id: 'talk_after', label: `Thank {opp.first} afterward and ask for rougher nights`, risk: 'low', result: `In the hallway you say you appreciate the care and want the real thing next time. {opp.first} grins with visible relief, and the next match is a better one for both of you.`, effects: [{ rel: { who: 'opp', trust: 5, respect: 3 } }, { conf: 1 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'stiff', label: `Answer the gentleness with one very stiff chop`, risk: 'high', result: `The sound of it echoes off the rafters and {opp.first} gives you a look of pure respect. It also gives the match a hard edge and gives {opp.first} a lasting memory of the sound.`, effects: [{ pop: 0.4 }, { rel: { who: 'opp', respect: 3, heat: 6 } }, { fatigue: 6 }, { conf: 3 }] },
    ],
  },
  // ======================= RETIREMENT =======================
  {
    id: 'ng_ret_rival_chair', category: 'retirement', title: `{rival.name} Asks the Question`, weight: 2, major: true, contexts: ['post_show', 'weekly'], cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 15,
    cast: { rival: { pick: 'rivalry', minHeat: 10, status: 'active' } }, memory: { role: 'rival', max: 1, noResults: true },
    trigger: { stat: { careerYears: { gte: 10 } }, mem: [{ role: 'rival', h2h: { matchesGte: 3 } }] },
    slots: { place: [`in the arena parking lot once the crowd has gone`, `at a diner two blocks from the venue`, `at the hotel bar after closing`], opening: [`hands you a coffee without asking how you take it`, `sits down next to you without being invited`, `stands there and waits for you to speak first`] },
    body: [`{rival.name} finds you {place}, and without any of the usual banter {rival.first} {opening}. "Is this it for you?" {rival.first} asks. Nobody in the locker room has dared put it that plainly.`, `The years you have spent trying to beat each other mean {rival.first} could be the only person who can ask it honestly. Whatever you say will travel, because some secrets are only safe in the mouths of enemies.`],
    choices: [
      { id: 'truth', label: `Tell {rival.first} the truth: you think about it daily`, risk: 'low', result: `The admission costs you nothing you did not already know, and {rival.first} takes it in silence. When you part, you are somehow closer than you were as friends.`, effects: [{ rel: { who: 'rival', respect: 7, trust: 5, heat: -6 } }, { conf: -1 }] },
      { id: 'deny', label: `Say you have years left and intend to prove it`, risk: 'med', result: `The bluster comes out smoothly and {rival.first} pretends to be convinced. The next three matches between you carry a little extra snap, as if each of you were checking the other's math.`, effects: [{ rivalry: { who: 'rival', heat: 8 } }, { conf: 3 }, { pop: 0.2 }, { fatigue: 4 }] },
      { id: 'last_dance', label: `Ask {rival.first} to be your last opponent, when it comes`, risk: 'high', result: `{rival.first} goes very still, then agrees with a handshake that lasts too long. The office hears within a week, and the promise follows you into every arena.`, effects: [{ booking: { who: 'rival', type: 'singles' } }, { rel: { who: 'rival', respect: 8, affinity: 6 } }, { pop: 0.7 }, { fatigue: 6 }] },
      { id: 'joke', label: `Deflect with a joke about who is buying next time`, risk: 'low', result: `The joke earns a tired smile, and the moment is gone as fast as it came. You drive home knowing that the question will return on a worse night.`, effects: [{ conf: 1 }, { rel: { who: 'rival', respect: -2 } }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'ng_ret_ally_pact', category: 'retirement', title: `A Promise With {ally.name}`, weight: 1.5, major: true, cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 15,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1, noResults: true },
    trigger: { stat: { careerYears: { gte: 8 } } },
    slots: { place: [`a rest stop on a long stretch of highway`, `the loading dock once the building has emptied`, `a hotel breakfast room before dawn`], seal: [`with a handshake`, `by clinking two paper cups`, `on a napkin neither of you will keep`] },
    body: [`{ally.name} has a proposal, and it is raised at {place} with the awkwardness of a person asking for a loan. "Whoever stops first tells the other first," {ally.first} says. "In person. Before the office, before the press."`, `You settle it {seal}. It is a small promise that carries the quiet admission that both of you can see the end of the road from here.`],
    choices: [
      { id: 'swear', label: `Swear to the pact, and mean it`, risk: 'low', result: `The words come out plain and stay in the air a while. You both go back to the ring with a thin new thread of trust, and the thought of stopping feels slightly less lonely.`, effects: [{ rel: { who: 'ally', trust: 10, affinity: 6 } }, { conf: 1 }, { flag: 'ng_ret_pact' }] },
      { id: 'final_run', label: `Propose one last run as a tag team`, risk: 'med', result: `{ally.first} grins at the idea and starts scribbling spot ideas on the back of a receipt. The office books the tag match before the week is out, and your knees begin to plan their complaints.`, effects: [{ booking: { who: 'ally', type: 'tag' } }, { rel: { who: 'ally', respect: 5, trust: 4 } }, { pop: 0.6 }, { fatigue: 8 }] },
      { id: 'refuse', label: `Refuse: you do not want a countdown in your head`, risk: 'med', result: `{ally.first} says fair enough and lets it drop. Neither of you mentions it for months, and yet it hangs on in every shared drive.`, effects: [{ rel: { who: 'ally', trust: -3 } }, { conf: 2 }, { fatigue: -2 }] },
      { id: 'laugh', label: `Laugh it off: neither of you could quit if you tried`, risk: 'low', result: `{ally.first} laughs too, a half-beat late, and a bag of chips is opened to cover the silence. It is easy and warm, and it is also an exit the two of you will not take together.`, effects: [{ rel: { who: 'ally', affinity: 4, trust: -1 } }, { conf: 1 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'ng_ret_respected_advice', category: 'retirement', title: `{vet.name} on Knowing When`, weight: 1.5, contexts: ['weekly', 'pre_show'], cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 15,
    cast: { vet: { pick: 'tag', tag: 'respected_by' } }, memory: { role: 'vet', max: 1, noResults: true },
    trigger: { stat: { careerYears: { gte: 8 } } },
    slots: { setting: [`over a gym bag and a thermos`, `in a corner of a quiet corridor`, `in a diner booth with a shared basket of fries`], advice: [`stop a year too early rather than a match too late`, `leave while the crowd still wants more`, `choose the last match personally before somebody chooses it for you`] },
    body: [`{vet.name} sits with you {setting} and, unprompted, offers advice: {vet.they} would {advice}. It is delivered like a bus timetable, without drama, and you can tell it has been rehearsed.`, `"I am not telling you to stop," {vet.first} says. "I am telling you to choose." The words carry the weight of coming from someone who respects you, but taking them is not the same as acting on them, and a decision that large rarely feels like advice.`],
    choices: [
      { id: 'timeline', label: `Take the advice and start sketching a timeline`, risk: 'med', result: `That night you write a rough run of years on a napkin and fold it into your wallet. It feels like surrender and like control at the same time.`, effects: [{ flag: 'ng_ret_timeline' }, { conf: -2 }, { pop: 0.2 }, { rel: { who: 'vet', respect: 4, trust: 3 } }] },
      { id: 'argue', label: `Argue that you are not done and say why`, risk: 'med', result: `The case is made in the clear voice of someone who has said it before to a mirror. {vet.first} does not push, and tells you the door is not locked, and you keep working with more fire and a little less sleep.`, effects: [{ conf: 3 }, { fatigue: 5 }, { rel: { who: 'vet', respect: 2 } }] },
      { id: 'press', label: `Ask {vet.first} what it actually felt like to decide`, risk: 'low', result: `The answer takes an hour and is nothing like the advice: mostly dull, with one very bad Tuesday in the middle. You leave with a picture of the decision that is smaller and less frightening than the one you carried in.`, effects: [{ conf: 2 }, { attr: { name: 'psychology', delta: 1 } }, { rel: { who: 'vet', trust: 5, affinity: 4 } }, { fatigue: 2 }] },
      { id: 'ignore', label: `Thank {vet.first} and do not think about it again`, risk: 'low', result: `You mean it as kindness and it comes out as a brush-off. The conversation stays in the hallway, along with the part of you that wanted it to matter.`, effects: [{ conf: 1 }, { rel: { who: 'vet', respect: -2 } }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'ng_ret_body_memo', category: 'retirement', title: `The Morning Your Body Sent a Memo`, weight: 1.5, contexts: ['weekly', 'pre_show'], cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 15,
    trigger: { stat: { careerYears: { gte: 10 }, fatigue: { gte: 45 } }, injured: false },
    slots: { sign: [`your knees refuse the hotel stairs one at a time`, `your hands will not close around a coffee cup`, `your back locks solid as you bend to tie a shoelace`], witness: [`the housekeeper watching from the corridor`, `a stranger in the elevator who assumes you are doing a bit`, `your own reflection in the lobby glass`] },
    body: [`It is a small thing and that is what makes it frightening: {sign}. The only witness is {witness}, and nobody says a word.`, `For years the body did what it was told and complained afterward. This morning the order of those two things has flipped, and the memo is not going to stay unread.`],
    choices: [
      { id: 'rest', label: `Book a week off and let the swelling go down`, risk: 'low', result: `Seven days of ice, a heating pad and a daytime television marathon do their quiet work. You feel nearly human again by Friday, and the ledger of lost bookings is longer than you hoped.`, effects: [{ money: -1500 }, { fatigue: -16 }, { pop: -0.2 }, { conf: 1 }] },
      { id: 'push', label: `Stretch it out and go to work anyway`, risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `Twenty minutes of stubborn stretching loosens enough, and the show goes off without incident. You tell no one and carry the pain around like a coin in your pocket.`, effects: [{ pop: 0.3 }, { conf: 2 }, { fatigue: 7 }] },
        { weight: 1, text: `Something pulls a minute into the first sequence, and the match turns into a careful walk through a hallway of eggshells. The trainer sees it from the curtain and does not say a word.`, effects: [{ conf: -4 }, { fatigue: 9 }, { injury: { part: 'torso', severity: 1, days: 8 } }] } ] },
      { id: 'list', label: `Write down every ache and check the list in a month`, risk: 'low', result: `The list runs onto a second page before you notice. It is not an answer, but it turns a vague dread into something with edges, and that is easier to live with.`, effects: [{ conf: -2 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: -3 }] },
      { id: 'call_friend', label: `Call an old friend from the business and laugh about it`, risk: 'low', result: `"Mine are in alphabetical order," the friend says, and proves it, and you laugh until your back complains. By the end of the call it all feels survivable, if not exactly solved.`, effects: [{ conf: 3 }, { fatigue: -3 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'ng_ret_new_title', category: 'retirement', title: `A Contract With a Different Job Title`, weight: 2, major: true, cooldownDays: 400, maxPerCareer: 1, categoryCooldown: 15,
    cast: { exec: { pick: 'staff', role: 'executive' } },
    trigger: { stat: { careerYears: { gte: 12 } }, contract: { lte: 150 } },
    slots: { role: [`a brand ambassador`, `a locker-room coach`, `a special attraction who appears eight times a year`], perk: [`a company car with the logo on the door`, `lifetime health cover`, `an office with a window onto the parking lot`] },
    body: [`{exec.name} slides a draft across the table for the next stage: a post as {role}, plus {perk}. The paper is generous, courteous and does not contain the word retire anywhere. "Think of it as a promotion," {exec.first} says.`, `You have been in this business long enough to read the room: it is a lifeboat with a very good paint job. The question is whether to board it, bargain with it, or keep treading water.`],
    choices: [
      { id: 'accept', label: `Take the new post and step back from the ring`, risk: 'high', result: `The pen moves before you have finished thinking. At the press release you are photographed in a suit, and the applause carries a mix of respect and farewell.`, effects: [{ event: { type: 'retirement', participants: [], summary: `{player.name} stepped back from the ring to take a company role.`, importance: 5, data: {} } }, { money: 6000 }, { pop: 0.6 }, { conf: 1 }] },
      { id: 'counter', label: `Counter: keep wrestling part time, take the title too`, risk: 'med', outcomes: [
        { weight: 2, bonus: { popularity: 0.4, charisma: 0.3 }, text: `{exec.first} laughs, then draws a bracket around the idea and carries it upstairs. You come back with a hybrid deal and fewer dates, and for a few months you feel like you have beaten the clock.`, effects: [{ money: 3000 }, { fatigue: -6 }, { conf: 3 }, { pop: 0.2 }] },
        { weight: 1, text: `The counter is filed under no thank you. The offer is pulled, politely, and nobody mentions it again.`, effects: [{ conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'decline', label: `Decline and keep your full schedule`, risk: 'low', result: `You slide the draft back across the table unsigned. {exec.first} nods like a person closing a book and tells you the door stays open, though it will not stay open forever.`, effects: [{ conf: 3 }, { fatigue: 5 }, { pop: 0.1 }] },
      { id: 'time', label: `Ask for a year before you decide`, risk: 'med', result: `The extra time is granted at the cost of a pay cut on the old deal. You spend the year bargaining with yourself, which turns out to be the hardest negotiation of the lot.`, effects: [{ money: -1500 }, { conf: -1 }, { fatigue: -3 }] },
    ],
  },
  {
    id: 'ng_ret_unbeaten_name', category: 'retirement', title: `The Score You Never Settled`, weight: 2, contexts: ['weekly', 'post_show'], cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 15,
    cast: { rival: { pick: 'rivalry', minHeat: 10, status: 'active' } }, memory: { role: 'rival', max: 1 },
    trigger: { stat: { careerYears: { gte: 9 } }, mem: [{ role: 'rival', h2h: { lossesGte: 2 } }] },
    slots: { where: [`in the corridor outside a dressing room`, `at the next table in an airport restaurant`, `on the apron of an empty ring during setup`], sign: [`a nod`, `a half-wave`, `a dry "evening"`] },
    body: [`{rival.name} passes you {where} and offers {sign}. The record says you have lost to {rival.them} more than once, and a part of you that never retires has been keeping the tally ever since.`, `At the end of a career the matches that stay with you are rarely the ones you won. If there is a loose thread left in the building, it is standing six feet away holding a bag.`],
    choices: [
      { id: 'rematch', label: `Demand a rematch and promise to settle the score`, risk: 'high', result: `The challenge is made loudly enough for the corridor to hear, and the office books it by the afternoon. Now there is a clock on your word and a bruise already waiting.`, effects: [{ booking: { who: 'rival', type: 'singles' } }, { promise: { kind: 'win_match', who: 'rival', text: `I will beat {rival.name} before I am done`, deadlineDays: 150 } }, { pop: 0.7 }, { fatigue: 7 }] },
      { id: 'quiet', label: `Settle it quietly: tell {rival.first} the better one won`, risk: 'low', result: `{rival.first} stares at you for a moment, then says thanks in a voice that needs clearing. It is an act of grace, and also a way of closing a door that will not open again.`, effects: [{ rel: { who: 'rival', respect: 8, heat: -10 } }, { conf: -2 }] },
      { id: 'prepare', label: `Spend a month studying every minute of the loss`, risk: 'med', result: `The tape plays on a hotel-room television until you can predict each beat. You do not get the rematch yet, but you know exactly what you would do with one.`, effects: [{ attr: { name: 'technical', delta: 1 } }, { conf: 3 }, { fatigue: 6 }, { rivalry: { who: 'rival', heat: 5 } }] },
      { id: 'let_go', label: `Nod back and let the thread stay loose`, risk: 'low', result: `You nod back and keep walking, and the stranger-like politeness of it is a small grief of its own. The tally stays in your head, but it stops asking to be paid.`, effects: [{ conf: -1 }, { fatigue: -3 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'ng_ret_friend_farewell', category: 'retirement', title: `{friend.name} Is Hanging It Up`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 15,
    cast: { friend: { pick: 'tag', tag: 'reconciled' } }, memory: { role: 'friend', max: 1 },
    trigger: { stat: { careerYears: { gte: 6 } } },
    slots: { news: [`in a phone call at breakfast`, `on a postcard in handwriting you can barely read`, `over a bottle of something strong in a hotel room`], venue: [`a small hall in {friend.their} hometown`, `a big arena with the full lighting rig`, `a quiet taping with no crowd`] },
    body: [`The news reaches you {news}: {friend.name} is stopping. After everything the two of you went through and then put down, {friend.first} asks you to be the one across the ring at {venue}. "It has to be you," {friend.they} adds.`, `It is an honour wrapped in an awkward silence. You can give {friend.them} the send-off or you can protect yourself from another goodbye, and neither answer comes easily.`],
    choices: [
      { id: 'yes', label: `Say yes and give {friend.first} the send-off earned`, risk: 'med', result: `The match is booked, and in the days before it you trade stories you thought were buried. The night itself is warm, loud and finished with an embrace that the cameras look away from.`, effects: [{ booking: { who: 'friend', type: 'singles' } }, { rel: { who: 'friend', respect: 8, trust: 6, affinity: 8 } }, { pop: 0.6 }, { fatigue: 7 }] },
      { id: 'lose', label: `Offer to lose clean, whatever it costs you`, risk: 'high', result: `{friend.first} refuses twice and accepts the third time with wet eyes. The finish is perfect, and the sting in your own career is worth the way {friend.first} walks up the ramp.`, effects: [{ booking: { who: 'friend', type: 'singles' } }, { rel: { who: 'friend', respect: 12, trust: 8, affinity: 10 } }, { pop: -0.3 }, { conf: -3 }, { fatigue: 7 }] },
      { id: 'tag', label: `Ask for a tag match with you on the same side`, risk: 'med', result: `The two of you who once tried to tear each other apart walk out in matching gear, and the crowd goes quiet with understanding before it goes loud. It is a more complicated goodbye and a more memorable one.`, effects: [{ booking: { who: 'friend', type: 'tag' } }, { rel: { who: 'friend', trust: 8, affinity: 6 } }, { pop: 0.7 }, { fatigue: 6 }] },
      { id: 'decline', label: `Say you cannot face a last match with {friend.them}`, risk: 'low', result: `The refusal is honest and it leaves a hole in the evening. {friend.first} says it is understood and moves on to the next name on the list, though the call stays in your head for a long time.`, effects: [{ rel: { who: 'friend', affinity: -4, trust: -2 } }, { conf: -2 }, { fatigue: -3 }] },
    ],
  },
  {
    id: 'ng_ret_truck_seat', category: 'retirement', title: `A Seat in the Truck`, weight: 1.5, contexts: ['weekly', 'show_day'], cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 15,
    cast: { producer: { pick: 'staff', role: 'producer' } },
    trigger: { stat: { careerYears: { gte: 10 }, popularity: { gte: 30 } } },
    slots: { job: [`producing one segment a night`, `calling the monitors during the main event`, `sitting beside the announce team for one show`], hint: [`with a headset three sizes too big`, `with a cup of coffee and no script`, `with a laminate that has someone else's name crossed out`] },
    body: [`{producer.name} offers a trial run: {job}, set up {hint}. "Nobody is asking you to stop," {producer.first} says. It is a way to stay in the building without taking the bumps, and it comes with the unspoken warning that the building will notice when you stop taking them.`, `You have watched a hundred shows from the front. From the truck you would see how the ones you were in were really made, and you suspect it would change how you remember them.`],
    choices: [
      { id: 'trial', label: `Accept the trial and keep your wrestling schedule`, risk: 'med', result: `The first night you break out in a sweat at the wrong cue and miss it by ten seconds. By the third, you can feel the show like a body, and the double workload eats your sleep.`, effects: [{ money: 1200 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 9 }, { conf: 2 }] },
      { id: 'shadow', label: `Ask to shadow the truck for a month before deciding`, risk: 'low', result: `A month of watching from a folding chair teaches you more about the business than a decade of walking through it. It is slow, it costs you nothing, and it leaves the question open.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { fatigue: 2 }, { conf: 1 }, { money: -400 }] },
      { id: 'step_back', label: `Take the seat and cut your match dates in half`, risk: 'high', result: `You hand your match schedule a pair of scissors and feel strangely lighter. The crowd sees you less, and the truck sees you more, and nobody is sure which is the promotion.`, effects: [{ money: 2000 }, { pop: -0.6 }, { fatigue: -12 }, { conf: -1 }] },
      { id: 'decline', label: `Decline: you are still a wrestler`, risk: 'low', result: `The refusal comes out harder than you intended and {producer.first} takes it with a nod. The ring still wants you, though the headset would have been a gentler way to stay.`, effects: [{ conf: 3 }, { fatigue: 4 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'ng_ret_fan_asks', category: 'retirement', title: `A Fan Asks the Question`, weight: 1.5, contexts: ['weekly', 'post_show'], cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 15,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { careerYears: { gte: 10 }, popularity: { gte: 25 } } },
    slots: { where: [`at the merch table`, `in a hotel elevator`, `at a gas station off the interstate`], manner: [`with total sincerity`, `through a mouthful of nachos`, `with an enormous, apologetic smile`] },
    body: [`{fan.name} catches you {where} and asks, {manner}, "Are you retiring soon?" Nobody else has asked it to your face, and for a second you can feel how many people have been wondering.`, `There is no malice in the question, only the odd tenderness of a stranger who is already preparing to miss you. The answer you give will be repeated at a hundred kitchen tables.`],
    choices: [
      { id: 'honest', label: `Answer honestly: you do not know yet`, risk: 'low', result: `{fan.first} nods slowly, says thank you for not lying, and shakes your hand with both of theirs. It is the least performance you have put into a conversation in years.`, effects: [{ conf: 2 }, { pop: 0.3 }, { fatigue: 1 }] },
      { id: 'promise', label: `Promise you will be around for years`, risk: 'med', result: `The promise is huge and warm, and {fan.first} walks away glowing. You are left carrying a bet you made with a stranger's hope, which is the heaviest kind.`, effects: [{ pop: 0.5 }, { conf: 1 }, { promise: { kind: 'win_streak', text: `I will keep fighting for years to come`, params: { n: 2 }, deadlineDays: 120 } }] },
      { id: 'ask_back', label: `Ask {fan.first} what you should do`, risk: 'low', result: `{fan.first} thinks about it harder than anyone has in weeks and says to pick the last match yourself. It is the same advice a veteran would give, only said without a trace of self-interest.`, effects: [{ conf: 2 }, { attr: { name: 'psychology', delta: 1 } }, { pop: 0.2 }] },
      { id: 'joke', label: `Joke that the ring will have to carry you out`, risk: 'low', result: `The line gets a polite laugh and a small, worried frown. You walk away a little lighter and a little too aware of what the joke was hiding.`, effects: [{ conf: 1 }, { pop: 0.1 }, { fatigue: -1 }] },
    ],
  },
  // ======================= LEGACY =======================
  {
    id: 'ng_leg_ally_tribute', category: 'legacy', title: `A Tribute for {ally.name}`, weight: 1.5, contexts: ['weekly', 'pre_show'], cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 10,
    cast: { ally: { pick: 'tag', tag: 'ally' }, producer: { pick: 'staff', role: 'producer' } }, memory: { role: 'ally', max: 1, noResults: true },
    trigger: { stat: { careerYears: { gte: 6 }, popularity: { gte: 30 } } },
    slots: { format: [`a three-minute video message`, `a short speech at a banquet`, `a surprise appearance at the ceremony`], ask: [`by the end of the week`, `before the show goes to air`, `as soon as your schedule allows`] },
    body: [`{producer.name} is putting together an honour for {ally.name} and wants you for it: {format}, needed {ask}. "Nobody knows {ally.first} like you do," {producer.first} says.`, `A tribute is a small piece of history written by the people who were there. What you choose to say will sit in the archive long after the two of you stop remembering the details.`],
    choices: [
      { id: 'heartfelt', label: `Say what you really think, unpolished`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.3 }, text: `You skip the notes and talk about a bad night on the road that {ally.first} turned into a good one. The room goes quiet in the right way, and {ally.first} will have the recording for the rest of {ally.their} life.`, effects: [{ rel: { who: 'ally', trust: 7, affinity: 8 } }, { pop: 0.5 }, { conf: 3 }] },
        { weight: 1, text: `Halfway through the story your voice cracks and somebody's phone keeps recording. The result is raw, a little embarrassing and, to your surprise, the part everybody quotes.`, effects: [{ rel: { who: 'ally', affinity: 5 } }, { pop: 0.2 }, { conf: -2 }] } ] },
      { id: 'polished', label: `Write it out carefully and rehearse it`, risk: 'low', result: `The words are good and the delivery is clean, and {producer.first} says it is exactly what the occasion needed. It also reads, to a close observer, as something you wrote on a plane.`, effects: [{ pop: 0.3 }, { rel: { who: 'ally', affinity: 2 } }, { conf: 1 }, { fatigue: 2 }] },
      { id: 'funny', label: `Make it a roast and trust the friendship`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.6 }, text: `The jokes are mean in exactly the right proportions, and {ally.first} laughs hardest. By the end it feels like the most affectionate thing anybody has said all year.`, effects: [{ pop: 0.7 }, { rel: { who: 'ally', affinity: 6, trust: 3 } }, { conf: 3 }] },
        { weight: 1, text: `One line lands wrong in front of the wrong executive and the room goes stiff. {ally.first} forgives you before the evening is over, but it takes the evening to get there.`, effects: [{ rel: { who: 'ally', trust: -4, affinity: -2 } }, { pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'decline', label: `Decline: you would rather say it in person`, risk: 'low', result: `{producer.first} sighs and finds someone else, and you take {ally.first} for a long dinner instead. The tribute goes ahead without you, and the dinner goes on much longer.`, effects: [{ rel: { who: 'ally', trust: 5, affinity: 4 } }, { pop: -0.2 }, { money: -200 }] },
    ],
  },
  {
    id: 'ng_leg_cover_story', category: 'legacy', title: `A Magazine Wants You Both on the Cover`, weight: 2, contexts: ['weekly'], cooldownDays: 400, maxPerCareer: 1, categoryCooldown: 10,
    cast: { rival: { pick: 'rivalry', minHeat: 10, status: 'active' }, writer: { pick: 'media', kind: 'journalist' } }, memory: { role: 'rival', max: 1 },
    trigger: { stat: { careerYears: { gte: 5 }, popularity: { gte: 40 } }, mem: [{ role: 'rival', h2h: { matchesGte: 5 } }] },
    slots: { angle: [`the best feud of the era`, `two careers that wrote each other`, `a rivalry that outlasted its own storylines`], terms: [`a joint photo shoot in an empty ring`, `separate interviews printed side by side`, `a long dinner with a tape recorder in the middle of the table`] },
    body: [`{writer.name} is writing a cover story on {angle} and wants you and {rival.name} to take part, with {terms}. The pitch is flattering, and it also asks two people who have spent years hitting each other to be civil in print. "No punching," {writer.first} promises.`, `Cover stories are how a feud turns into history. What gets said in them is what the next generation will believe happened.`],
    choices: [
      { id: 'together', label: `Do it together and play it straight`, risk: 'med', result: `The two of you sit across from each other in the glare of a single softbox, trying not to laugh. The photograph that makes the cover is stern, tense and perfect.`, effects: [{ pop: 0.8 }, { rel: { who: 'rival', respect: 5, heat: -3 } }, { fatigue: 3 }, { conf: 2 }] },
      { id: 'heel_it', label: `Use the interview to take another shot at {rival.first}`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.5 }, text: `The quotes are sharp and perfectly timed, and the magazine sells out in the cities where it matters. {rival.first} reads them on a flight and sends back a single word.`, effects: [{ pop: 0.7 }, { rivalry: { who: 'rival', heat: 10 } }, { rel: { who: 'rival', heat: 8 } }] },
        { weight: 1, text: `The jab reads as bitter on the page and the editor frames it that way. For a week you are the person who could not let go.`, effects: [{ pop: -0.4 }, { conf: -3 }, { rel: { who: 'rival', respect: -3 } }] } ] },
      { id: 'honor', label: `Give {rival.first} the credit you never said aloud`, risk: 'med', result: `You say that the feud only worked because {rival.first} never gave an inch. When it prints, {rival.first} leaves a phone message that is mostly breathing, and means thank you.`, effects: [{ rel: { who: 'rival', respect: 9, trust: 4, heat: -7 } }, { pop: 0.3 }, { conf: 1 }] },
      { id: 'pass', label: `Pass: the feud should stay in the ring`, risk: 'low', result: `The magazine runs the piece with {rival.first} alone, and the cover line is not kind to the empty chair. You keep your mystery and lose a page of history.`, effects: [{ pop: -0.3 }, { conf: 1 }, { rel: { who: 'rival', respect: -1 } }] },
    ],
  },
  {
    id: 'ng_leg_canvas_auction', category: 'legacy', title: `A Piece of Your Big Night Goes Up for Auction`, weight: 1.5, contexts: ['weekly', 'post_show'], cooldownDays: 400, maxPerCareer: 1, categoryCooldown: 10,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { careerYears: { gte: 4 }, pleMatches: { gte: 3 } } },
    slots: { item: [`ring canvas`, `top rope`, `corner turnbuckle pad`], condition: [`still carrying a brown stain you will not discuss`, `with a faded mark on it that everyone knows the story of`, `signed in marker by a whole dressing room`] },
    body: [`{fan.name} mails you an auction catalogue with a page folded down and one line of explanation: "Thought you should know." On the page is an old {item} from a big night of yours, listed for auction, {condition}. The reserve price is the sort that makes your accountant cough.`, `It is odd to see a piece of the night for sale, like finding your own tooth in a jar. Somebody else will take it home and decide what it means.`],
    choices: [
      { id: 'buy', label: `Bid on it yourself and win it back`, risk: 'med', requires: { stat: { money: { gte: 2500 } } }, result: `The bidding goes to the last ten seconds and costs more than you meant to spend. It arrives in a crate, and it sits in your hallway looking bigger than the memory and a little accusatory.`, effects: [{ money: -2500 }, { conf: 3 }, { pop: 0.2 }] },
      { id: 'fan_bid', label: `Quietly fund {fan.first} to bid and give it a proper home`, risk: 'low', requires: { stat: { money: { gte: 1500 } } }, result: `{fan.first} wins it with your money and a shaking hand in the air, then cries on the phone. The piece ends up in a clubhouse with a plaque, and a hundred people will touch it every year.`, effects: [{ money: -1500 }, { pop: 0.6 }, { conf: 2 }] },
      { id: 'sign', label: `Offer to sign it for the winning bidder`, risk: 'low', result: `The auction house passes the offer on and the final price climbs by half. You never learn who bought it, and the signature is the only piece of you that goes with it.`, effects: [{ money: 300 }, { pop: 0.2 }, { fatigue: 1 }] },
      { id: 'let_go', label: `Let it go: objects are not the memory`, risk: 'low', result: `You close the catalogue and tell yourself that nothing important is in a piece of cloth. The auction ends on a Thursday afternoon, and you check the price twice anyway.`, effects: [{ conf: 1 }, { fatigue: -2 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'ng_leg_display_case', category: 'legacy', title: `A Museum Asks for a Display Case`, weight: 1.5, contexts: ['weekly', 'offseason'], cooldownDays: 400, maxPerCareer: 1, categoryCooldown: 10,
    trigger: { stat: { careerYears: { gte: 6 }, popularity: { gte: 45 } } },
    slots: { museum: [`a regional history museum`, `a sports hall of memory`, `the local library's new exhibition wing`], object: [`your first pair of boots`, `a ring jacket with a torn seam`, `the championship-night program with coffee on it`] },
    body: [`A curator from {museum} has written a very polite letter asking to display {object}. The letter says visitors would be able to read a card about you, and the card would include a photograph and a date. "We would be honoured," it ends.`, `It is an odd thing to be asked to donate part of your own story while you are still writing it. The curator offers no money, a lot of gratitude and a case with excellent lighting.`],
    choices: [
      { id: 'donate', label: `Donate it outright and attend the opening`, risk: 'low', result: `The case is lit like a jewellery shop, and your name is spelled correctly on the card. You stand in front of it with a paper cup of wine, feeling both honoured and slightly embalmed.`, effects: [{ pop: 0.6 }, { conf: 3 }, { money: -200 }] },
      { id: 'loan', label: `Offer a long loan and keep the right to take it back`, risk: 'low', result: `The curator accepts the terms with a sigh of relief and a long legal form. You keep the option of changing your mind, and the museum keeps the option of keeping the lights on.`, effects: [{ pop: 0.3 }, { conf: 1 }, { fatigue: 1 }] },
      { id: 'sell', label: `Ask for a fee, since it belongs on a balance sheet`, risk: 'med', result: `The curator checks with a board, and the board checks with the clock, and a modest fee arrives with the shy cough of an apology. You are paid and slightly diminished, in about equal measure.`, effects: [{ money: 1800 }, { pop: -0.2 }, { conf: -1 }] },
      { id: 'decline', label: `Decline: it still feels too early for glass`, risk: 'low', result: `You write back kindly and keep the object where it was, on a shelf with a dusty roll of tape. The refusal feels like superstition and feels also like good manners to your future self.`, effects: [{ conf: 2 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'ng_leg_ring_naming', category: 'legacy', title: `Your Name on a Training Ring`, weight: 1.5, contexts: ['weekly', 'offseason'], cooldownDays: 400, maxPerCareer: 1, categoryCooldown: 10,
    cast: { coach: { pick: 'staff', role: 'coach' } },
    trigger: { stat: { careerYears: { gte: 8 }, popularity: { gte: 35 } } },
    slots: { school: [`the old school where you started`, `a developmental gym on the edge of town`, `a youth program in a church basement`], ask: [`a plaque and a donation drive`, `a ribbon cutting with the local press`, `a short speech and a weekly visit`] },
    body: [`{coach.name} calls with an unusual question: "Would you let {school} name its main ring after you?" It comes with {ask}, and a promise that the ring itself will be fixed this time.`, `The ring in question has a sag in the middle that every student has learned to avoid. You can remember falling on it, and now you can imagine other people falling on your name.`],
    choices: [
      { id: 'yes_fund', label: `Say yes and pay for the new canvas yourself`, risk: 'med', requires: { stat: { money: { gte: 2000 } } }, result: `The new canvas arrives in a box the size of a sofa, and the first kid to bump on it grins at the cushioned thud. The sign goes up with your name, which is both a gift and a debt.`, effects: [{ money: -2000 }, { pop: 0.5 }, { conf: 4 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'yes_visit', label: `Say yes, and promise to teach a class every few months`, risk: 'med', result: `The class fills before the poster is printed, and you spend your off days correcting somebody's elbow drop. It is tiring in the best way, and there is no budget line for it.`, effects: [{ pop: 0.4 }, { conf: 3 }, { fatigue: 7 }] },
      { id: 'other_name', label: `Ask them to name it after the first coach instead`, risk: 'low', result: `{coach.first} is quiet for a moment, then says that is exactly what the founder would have wanted. The ring is dedicated to a name nobody outside the building knows, and the students learn who it was.`, effects: [{ conf: 2 }, { pop: 0.1 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'decline', label: `Decline politely and send a cheque for the repairs`, risk: 'low', result: `The refusal is gentle and the cheque is not small. The ring gets fixed, the school gets a banner with another name, and you get a quiet conscience.`, effects: [{ money: -800 }, { conf: 1 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'ng_leg_documentary_pair', category: 'legacy', title: `A Documentary Wants {friend.name} in the Room`, weight: 1.5, contexts: ['weekly'], cooldownDays: 400, maxPerCareer: 1, categoryCooldown: 10,
    cast: { friend: { pick: 'tag', tag: 'reconciled' } }, memory: { role: 'friend', max: 1 },
    trigger: { stat: { careerYears: { gte: 6 }, popularity: { gte: 35 } } },
    slots: { crew: [`a two-person crew with a borrowed van`, `a production company with a producer in a vest`, `a film student with excellent equipment and no money`], format: [`filmed in one long take`, `cut with archive footage from both careers`, `shot at the places where it all started`] },
    body: [`{crew} wants to record a conversation between you and {friend.name}, {format}. {friend.first} has already said yes. "I figured you would come round," {friend.they} says, which is the part that unsettles you.`, `After the peace you made, sitting in a room with {friend.them} on camera feels like a test of whether the peace is real. Nobody can edit out the silences.`],
    choices: [
      { id: 'sit', label: `Sit down and talk with nothing prepared`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.3 }, text: `The first ten minutes are stiff, and then {friend.first} tells a story that makes you both laugh until the sound recordist has to stop. The footage runs long and the editor weeps over what to cut.`, effects: [{ rel: { who: 'friend', trust: 6, affinity: 7 } }, { pop: 0.6 }, { conf: 3 }] },
        { weight: 1, text: `An old grievance surfaces on camera and neither of you has the instinct to push it back down. The footage is gripping, and the two of you walk out in separate cars.`, effects: [{ rel: { who: 'friend', trust: -5, heat: 6 } }, { pop: 0.5 }, { conf: -2 }] } ] },
      { id: 'script', label: `Ask for questions in advance to avoid a scene`, risk: 'low', result: `The film gets a smoother version of both of you, with every pause resting on a prepared line. It is pleasant to watch, and no one will ever call it the truth.`, effects: [{ pop: 0.2 }, { rel: { who: 'friend', trust: 1 } }, { conf: 1 }] },
      { id: 'condition', label: `Agree on the condition of final cut over your half`, risk: 'med', result: `The producer grumbles, and the lawyer adds a clause, and {friend.first} raises an eyebrow at the paperwork. You get what you asked for and you also get a reminder that trust needs fewer lawyers.`, effects: [{ rel: { who: 'friend', trust: -3 } }, { pop: 0.3 }, { conf: 2 }, { money: -300 }] },
      { id: 'decline', label: `Decline and let {friend.first} tell it alone`, risk: 'low', result: `The documentary goes ahead with one chair, and your name appears in the third act with a blank space after it. It is safe, and it is quiet in a way you notice for months.`, effects: [{ rel: { who: 'friend', trust: -2, affinity: -2 } }, { pop: -0.2 }, { conf: 0 }] },
    ],
  },
  {
    id: 'ng_leg_champions_wall', category: 'legacy', title: `{error} on the Champions Wall`, weight: 1.5, contexts: ['weekly', 'show_day'], cooldownDays: 400, maxPerCareer: 1, categoryCooldown: 10,
    cast: { exec: { pick: 'staff', role: 'executive' } },
    trigger: { stat: { daysChampion: { gte: 100 } } },
    slots: { error: [`Your Name Is Misspelled`, `Your Reign Is Dated Wrong`, `Your Plaque Has the Wrong Title`], reaction: [`with the air of someone stepping on a rake`, `after practicing the apology in the elevator`, `with a tape measure and a very small hammer`] },
    body: [`The company lobby has a wall of former champions, and {exec.name} meets you at the foot of it {reaction}. The plaque for your reign is wrong in a way that is somehow worse than missing it entirely. "We caught it too late," {exec.first} says.`, `Visitors stop at the wall and read it aloud. It is a small mistake carved into brass, and you realize how much of history is just whoever got the engraver's attention.`],
    choices: [
      { id: 'fix_now', label: `Demand the plaque be replaced this week`, risk: 'med', result: `A new plaque is cast overnight and bolted up while the cleaners are still emptying bins. {exec.first} is professional about it and less warm afterward, and the brass gleams in the wrong light.`, effects: [{ conf: 2 }, { pop: 0.2 }, { money: -300 }] },
      { id: 'laugh', label: `Take a photo of the error and leave it as it is`, risk: 'low', result: `The photograph runs in a fan magazine and the plaque becomes a minor landmark. Fans line up to stand beside the mistake, and the engraver sends a nervous card.`, effects: [{ pop: 0.5 }, { conf: 2 }, { fatigue: 1 }] },
      { id: 'story', label: `Turn it into a joke at the next appearance`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.3 }, text: `You work the crooked plaque into a long bit and the crowd chants the mistake back at you. By the end of the night it is a catchphrase, and the wall is the least of your worries.`, effects: [{ pop: 0.7 }, { conf: 3 }] },
        { weight: 1, text: `The joke arrives half a beat late and sounds like complaining. The crowd claps politely, and the executive file notes the tone.`, effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'quiet', label: `Say nothing and let it be corrected in its own time`, risk: 'low', result: `You walk past it every few weeks, and eventually somebody notices. The fix arrives in a month with no fanfare, and you feel the oddly pure satisfaction of not making a scene.`, effects: [{ conf: 1 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'ng_leg_credit_letter', category: 'legacy', title: `{vet.name} Credits You in Public`, weight: 1.5, contexts: ['weekly', 'post_show'], cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 10,
    cast: { vet: { pick: 'tag', tag: 'respected_by' }, host: { pick: 'media', kind: 'host' } }, memory: { role: 'vet', max: 1, noResults: true },
    trigger: { stat: { careerYears: { gte: 4 }, popularity: { gte: 30 } } },
    slots: { setting: [`on a live broadcast`, `in a long-form interview`, `at the end of an awards dinner`], claim: [`taught {vet.them} how to read a crowd`, `changed how {vet.they} approached the second half of a match`, `were the reason {vet.they} stayed in the business`] },
    body: [`{vet.name} was asked {setting} who shaped the way {vet.first} works, and the answer was you. According to {host.name}, who replayed it for you with a grin, you {claim}.`, `Credit like that is a dangerous, lovely thing. It makes you a part of someone's story and it makes you wonder what you did to deserve being remembered like that.`],
    choices: [
      { id: 'thank', label: `Send a short, sincere thank-you note`, risk: 'low', result: `The note is four lines long and takes three drafts. {vet.first} keeps it in a jacket pocket, and mentions it to no one.`, effects: [{ rel: { who: 'vet', trust: 5, affinity: 6 } }, { conf: 2 }, { pop: 0.2 }] },
      { id: 'return', label: `Return the credit on your next live appearance`, risk: 'med', result: `You say, on air, that the teaching ran both ways. The two interviews get quoted side by side by fans, and a quiet mutual admiration society forms overnight.`, effects: [{ rel: { who: 'vet', respect: 6, affinity: 5 } }, { pop: 0.6 }, { conf: 2 }] },
      { id: 'deflect', label: `Wave it off as {vet.first} being kind`, risk: 'low', result: `The modest answer plays well with the audience, though {vet.first} hears it differently. Some compliments are meant to be accepted, and refusing them is a small insult dressed as manners.`, effects: [{ pop: 0.3 }, { rel: { who: 'vet', affinity: -3 } }, { conf: -1 }] },
      { id: 'mentor', label: `Offer to help {vet.first} with whatever is next`, risk: 'med', result: `The offer starts a series of early-morning sessions in a gym with a leaky ceiling. You are tired, and you are also needed, which is a rare combination.`, effects: [{ rel: { who: 'vet', trust: 7, respect: 4 } }, { fatigue: 6 }, { attr: { name: 'psychology', delta: 1 } }, { conf: 2 }] },
    ],
  },
  {
    id: 'ng_leg_studied_match', category: 'legacy', title: `{foe.name} Is Working Your Old Match`, weight: 1.5, contexts: ['weekly', 'post_show'], cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 10,
    cast: { foe: { pick: 'tag', tag: 'studying_you' } }, memory: { role: 'foe', max: 1 },
    trigger: { stat: { careerYears: { gte: 5 } } },
    slots: { piece: [`the slow build to your finish`, `the way you sell a forearm`, `your habit of pausing at the top of a turnbuckle`], crowd: [`The crowd does not notice`, `Some of the older fans notice`, `Only the people at ringside notice`] },
    body: [`Watching a replay of {foe.name}'s latest match, you see {piece} reproduced almost beat for beat. {crowd}. You do, though, and so does everyone who has ever worked with you.`, `Imitation is a compliment that arrives with an edge. A career is mostly the stuff you leave behind, and somebody is carrying it out of the building in a gym bag.`],
    choices: [
      { id: 'compliment', label: `Praise {foe.first} publicly for doing it well`, risk: 'low', result: `The short, public compliment makes {foe.first} grin like a kid who has been caught being clever. The borrowing becomes a lineage, and nobody can accuse anybody of anything.`, effects: [{ rel: { who: 'foe', respect: 6, affinity: 4, heat: -5 } }, { pop: 0.3 }, { conf: 1 }] },
      { id: 'confront', label: `Tell {foe.first} it is yours and ask for a credit`, risk: 'med', result: `{foe.first} goes red, then agrees to say your name in the next interview. It is an awkward, honest settlement that leaves a thin line of resentment behind.`, effects: [{ rel: { who: 'foe', respect: 1, trust: -3 } }, { pop: 0.3 }, { conf: 2 }] },
      { id: 'evolve', label: `Rework your own match so the copy falls behind`, risk: 'med', result: `Three weeks of drills yield a new sequence that feels like it belongs to a younger version of you. {foe.first} notices at once and gets to work on a copy of that, too.`, effects: [{ attr: { name: 'technical', delta: 1 } }, { fatigue: 8 }, { conf: 2 }, { rel: { who: 'foe', respect: 3 } }] },
      { id: 'shrug', label: `Shrug: good ideas have always been shared`, risk: 'low', result: `You say it in a stray slice of airtime and the line floats off into the archive. It is generous and a little detached, which is mostly how you feel.`, effects: [{ pop: 0.2 }, { conf: 0 }, { fatigue: -2 }] },
    ],
  },
  // ======================= ROYAL RUMBLE =======================
  {
    id: 'ng_rmb_number_trade', category: 'rumble', title: `{rival.name} Offers to Trade Numbers`, weight: 2, major: true, cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 10,
    cast: { rival: { pick: 'rivalry', minHeat: 15, status: 'active' } }, memory: { role: 'rival', max: 1, noResults: true },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 10 }, stat: { popularity: { gte: 20 } } },
    slots: { place: [`beside the equipment cases`, `in the hallway outside the production office`, `in the shadow of the stage ramp`], terms: [`in exchange for a favour to be named later`, `for a favour that {rival.they} promises will be small`, `for a favour and a smile that does not reach {rival.their} eyes`] },
    body: [`{rival.name} stops you {place} with an offer: whichever number the drum hands you, {rival.first} will trade for it, {terms}. In a match where the order of entry matters nearly as much as the skill, it is an offer that sounds either very generous or very dangerous.`, `Rumble numbers are the closest thing the business has to luck, and nobody trusts a gift that offers to improve yours. The fact that the giver is a rival makes the arithmetic worse.`],
    choices: [
      { id: 'accept', label: `Take the deal and hope the favour stays small`, risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.3 }, text: `The trade works in your favour, and the favour asked turns out to be a ride to the airport. You owe {rival.first} a modest debt and a slightly stunned thank-you.`, effects: [{ rel: { who: 'rival', trust: 5, heat: -5 } }, { pop: 0.4 }, { conf: 2 }] },
        { weight: 1, text: `The number you get back is a worse one than you gave away, and the favour turns out to be a public one. You spend the next week paying a debt that was never described.`, effects: [{ rel: { who: 'rival', trust: -4 } }, { conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'refuse', label: `Refuse and keep the number the drum gives you`, risk: 'low', result: `You say it plainly and walk off, and the only sound is the squeak of your shoes. Whatever number you pull is yours, and it is bound to please you more than a gift would.`, effects: [{ conf: 2 }, { rel: { who: 'rival', respect: 2 } }] },
      { id: 'report', label: `Tell the office that {rival.first} is trying to fix the draw`, risk: 'med', result: `The office thanks you with a thin, bureaucratic smile and puts a note in a file. {rival.first} hears about it within the hour and returns to the feud in a much worse mood.`, effects: [{ rivalry: { who: 'rival', heat: 12 } }, { rel: { who: 'rival', heat: 8, trust: -5 } }, { pop: 0.2 }] },
      { id: 'counter', label: `Counter-offer: trade only if you pick the favour`, risk: 'med', result: `"Fine," {rival.first} says after a long beat of recalculating, and agrees to the favour you named, which is a public handshake after the show. It is an odd shape for a truce, and the room watches it with open suspicion.`, effects: [{ rel: { who: 'rival', respect: 4, heat: -6 } }, { pop: 0.3 }, { conf: 1 }] },
    ],
  },
  {
    id: 'ng_rmb_holding_room', category: 'rumble', title: `The Argument in the Holding Room`, weight: 2, major: true, contexts: ['show_day', 'pre_show'], cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 10,
    cast: { rival: { pick: 'rivalry', minHeat: 10, status: 'active' }, vet: { pick: 'roster', tier: { gte: 2 } } }, memory: { role: 'rival', max: 1, noResults: true },
    trigger: { minYear: 1988, event: 'royal_rumble', stat: { popularity: { gte: 20 } } },
    slots: { room: [`a converted conference room`, `a concrete corridor lined with folding chairs`, `an equipment room with a television bolted high on the wall`], plan: [`a rotating order of who goes after whom`, `a ten-second moratorium on anything flashy`, `an unwritten agreement about who avoids the top rope`] },
    body: [`Thirty entrants are crowded into {room}, and {vet.name} is standing on a chair proposing {plan}. "Let us be professionals about this," {vet.first} shouts over the noise. {rival.name} is two seats away from you, arms folded, saying nothing and studying the room for weaknesses.`, `Nobody trusts a plan with this many signatures, and everybody wants to be seen agreeing with it. A silent room can be read, and what you do in it will be remembered before the first bell.`],
    choices: [
      { id: 'sign_on', label: `Sign on to the plan and keep your head down`, risk: 'low', result: `The plan is adopted by a show of hands and promptly betrayed by three of those hands. You are in good company, which is the nicest thing you can say about it.`, effects: [{ rel: { who: 'vet', trust: 4 } }, { conf: 1 }, { fatigue: 1 }] },
      { id: 'refuse', label: `Say you will make your own way and walk out`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5, popularity: 0.3 }, text: `You stand and the room watches you go. The silence behind you turns into respect by the time you reach the door.`, effects: [{ pop: 0.5 }, { conf: 4 }, { rel: { who: 'vet', respect: -2 } }] },
        { weight: 1, text: `The exit is a half-beat too dramatic and a few people mutter that you think you are above the group. It follows you through the night.`, effects: [{ conf: -2 }, { pop: -0.2 }, { rel: { who: 'vet', respect: -4 } }] } ] },
      { id: 'private', label: `Catch {rival.first} afterwards for a private word`, risk: 'med', result: `In the corridor you propose a handshake, and {rival.first} proposes a rule: nobody eliminates the other before the final five. Neither of you believes it, and both of you respect the attempt.`, effects: [{ rel: { who: 'rival', respect: 5, heat: -4 } }, { conf: 1 }, { pop: 0.1 }] },
      { id: 'stretch', label: `Ignore the speech and stretch in a corner`, risk: 'low', result: `While the others argue you work through a slow routine, and your shoulders loosen by the time the vote is held. When the order is finally agreed you are the only person in the room who is warm.`, effects: [{ fatigue: -4 }, { conf: 2 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'ng_rmb_after_horn', category: 'rumble', title: `{ally.name} Is Waiting by the Curtain`, weight: 1.5, contexts: ['post_show'], cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 8,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1, noResults: true },
    trigger: { minYear: 1988, event: 'royal_rumble' },
    slots: { gesture: [`a towel held out in one hand`, `a bottle of water already opened in one hand`, `your bag clutched to {ally.their} chest`], mood: [`quiet`, `loud and cheerful`, `unreadable`] },
    body: [`The long night has ended and the crowd is spilling toward the exits. {ally.name} is waiting by the curtain, {gesture}, in a mood best described as {mood}. "So," {ally.they} says.`, `Whatever the night gave you, the long evening has left you heavy-limbed and dry-throated. An ally is the one person who can see how it really went, and you have a moment to decide how much to show.`],
    choices: [
      { id: 'tell_all', label: `Tell {ally.first} everything, ugly parts included`, risk: 'low', result: `You talk in the loading dock until the arena lights go out, and {ally.first} listens without fixing anything. The weight in your chest does not leave, but it becomes a shared one.`, effects: [{ rel: { who: 'ally', trust: 8, affinity: 7 } }, { conf: 3 }, { fatigue: 2 }] },
      { id: 'celebrate', label: `Take {ally.first} out for a late meal and a loud toast`, risk: 'low', requires: { stat: { money: { gte: 200 } } }, result: `The only place open serves breakfast all night, and you each order two. By two in the morning nobody remembers who won what, and nobody minds.`, effects: [{ money: -200 }, { rel: { who: 'ally', affinity: 6, trust: 3 } }, { fatigue: 3 }, { conf: 2 }] },
      { id: 'alone', label: `Ask for an hour alone before you talk to anyone`, risk: 'low', result: `{ally.first} nods and walks off, leaving you alone with the emptying corridor. The hour passes in absolute stillness, and it turns out to be what you needed most.`, effects: [{ fatigue: -6 }, { conf: 2 }, { rel: { who: 'ally', affinity: -1 } }] },
      { id: 'ask_them', label: `Ask how {ally.first}'s night went before talking about yours`, risk: 'med', result: `{ally.first} had a harder night than the smile admits, and the next hour is spent on the other side of the story. It is exactly what a friend is for, even if you pay for it with your own sleep.`, effects: [{ rel: { who: 'ally', trust: 6, respect: 4 } }, { fatigue: 4 }, { conf: 1 }] },
    ],
  },
  {
    id: 'ng_rmb_studied_target', category: 'rumble', title: `{foe.name} Has a Plan for You`, weight: 2, major: true, cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 10,
    cast: { foe: { pick: 'tag', tag: 'studying_you' } }, memory: { role: 'foe', max: 1 },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 7 }, stat: { popularity: { gte: 20 } } },
    slots: { source: [`a mutual friend in the production office`, `a loose-lipped member of the ring crew`, `a notepad left open on a catering table`], detail: [`the exact moment you reach for your finish`, `the three moves you use when you are tired`, `which corner you favour when you need a breath`] },
    body: [`Word reaches you through {source}: {foe.name} has been planning for the Rumble, and the plan is built around you. {foe.first} has noted {detail}, and intends to be waiting for it.`, `In a free-for-all most plans collapse in the first minute. Still, {foe.first} has watched you for a long time and will not need much luck to find the exact seam.`],
    choices: [
      { id: 'change', label: `Throw out your usual patterns for the night`, risk: 'med', result: `You spend three days drilling things you have never done on camera, and your coach says nothing but writes plenty. The new plan will work only if you remember it under pressure.`, effects: [{ attr: { name: 'technical', delta: 1 } }, { fatigue: 8 }, { conf: 1 }] },
      { id: 'bait', label: `Leave the habit visible and prepare a reversal`, risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.4, confidence: 0.4 }, text: `At the crucial moment {foe.first} lunges, and you duck into a counter you have been sharpening for days. The crowd erupts at an elimination they never saw coming.`, effects: [{ pop: 0.9 }, { conf: 5 }, { rel: { who: 'foe', respect: 3, fear: 4 } }] },
        { weight: 1, text: `The trap works a second too slowly, and the plan {foe.first} wrote is executed in full. You are dumped over the top rope while thirty entrants look on.`, effects: [{ pop: -0.4 }, { conf: -5 }, { fatigue: 6 }] } ] },
      { id: 'confront', label: `Confront {foe.first} and tell {foe.them} you know`, risk: 'med', result: `"I would be a fool not to," {foe.first} says, and the two of you stare at each other for a long moment. The conversation changes the plan on both sides, and nothing is simple any more.`, effects: [{ rel: { who: 'foe', respect: 4, heat: 6 } }, { conf: 2 }, { rivalry: { who: 'foe', heat: 6 } }] },
      { id: 'ally_up', label: `Ask a friendly entrant to watch your back`, risk: 'low', result: `A quiet word to someone in the pack buys you a pair of eyes, and the favour is acknowledged with a nod. It is an uneasy bargain and a useful one, and you owe somebody a drink.`, effects: [{ conf: 2 }, { money: -150 }, { fatigue: 1 }] },
    ],
  },
  {
    id: 'ng_rmb_long_haul', category: 'rumble', title: `The Trainer's Rumble Week`, weight: 1.5, contexts: ['weekly', 'pre_show'], cooldownDays: 300, maxPerCareer: 3, categoryCooldown: 8,
    cast: { trainer: { pick: 'staff', role: 'trainer' } },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 14 }, stat: { popularity: { gte: 15 } } },
    slots: { load: [`double sessions`, `light work and long walks`, `mixed sessions that change every day`], drill: [`laps around the ring apron`, `three-minute rounds with no breaks`, `a stair climb in the empty arena stands`] },
    body: [`{trainer.name} has built a week of {load} around the fact that a Rumble is less a match than an endurance test, and the first drill is {drill}. "Nobody fails a Rumble from lack of skill," {trainer.first} says. "They fail from lack of breath."`, `You can follow the program as written, dial it down or throw it out and trust the engine you already have. Each choice has a cost that will show up somewhere in the ring.`],
    choices: [
      { id: 'full', label: `Follow the program as written, no shortcuts`, risk: 'med', result: `By Thursday your lungs ache and your temper is thin, and on Friday something clicks. You walk into the building heavy-legged and astonishingly sure of your wind.`, effects: [{ fatigue: 12 }, { conf: 4 }, { attr: { name: 'endurance', delta: 1 } }] },
      { id: 'taper', label: `Ask to taper early and arrive fresh`, risk: 'low', result: `The workload falls away and you sleep more than you have in months. It is gentler than the original plan, and it leaves a faint worry that the work was not done.`, effects: [{ fatigue: -8 }, { conf: 1 }, { attr: { name: 'endurance', delta: 1 } }] },
      { id: 'instinct', label: `Skip the drills and trust the engine you already have`, risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.5 }, text: `The engine turns out to be a better machine than anyone gave it credit for. You go light on training and heavy on rest, and arrive crisp.`, effects: [{ conf: 4 }, { fatigue: -4 }, { pop: 0.2 }] },
        { weight: 1, text: `Midway through the first rehearsal you realize how thin your wind is, and no amount of confidence can make up the difference. {trainer.first} watches from the apron with arms folded and does not need to say a word.`, effects: [{ conf: -4 }, { fatigue: 6 }] } ] },
      { id: 'monitor', label: `Pay for a heart-rate monitor and let the numbers decide`, risk: 'low', requires: { stat: { money: { gte: 400 } } }, result: `The strap shows you things the trainer only guessed at: a slow recovery, a spike in the second minute. You tune your week around the data, and it turns the whole project into something almost scientific.`, effects: [{ money: -400 }, { fatigue: 4 }, { conf: 3 }, { attr: { name: 'endurance', delta: 1 } }] },
    ],
  },
  {
    id: 'ng_rmb_fan_bracket', category: 'rumble', title: `A Fan's Hand-Drawn Bracket`, weight: 1.5, contexts: ['weekly', 'show_day'], cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 8,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 10 }, stat: { popularity: { gte: 15 } } },
    slots: { where: [`at a signing table`, `outside the stage door`, `by the hotel entrance`], forecast: [`you in the final four`, `you eliminated before the first minute is out`, `you winning, with a diagram in three colours`] },
    body: [`{fan.name} meets you {where} with a poster board covered in lines, arrows and tiny photographs: a complete Rumble forecast, with {forecast}. The handwriting is immaculate and the logic is, at best, personal.`, `"Be honest," {fan.first} says, watching your face while you read it, as if the board might change if you frown. Predictions are the way fans take part in a thing they cannot control.`],
    choices: [
      { id: 'sign', label: `Sign the board and wish {fan.first} luck`, risk: 'low', result: `Your signature lands in the corner where an arrow was about to go, and {fan.first} says that makes it official. The board is carried to the arena like a flag.`, effects: [{ pop: 0.4 }, { conf: 2 }, { fatigue: 1 }] },
      { id: 'argue', label: `Argue with the prediction, pen in hand`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `You amend three lines and make the bracket twice as good, and a small crowd gathers to watch. {fan.first} grins as the audience votes on the revisions.`, effects: [{ pop: 0.6 }, { conf: 3 }] },
        { weight: 1, text: `The argument gets personal faster than you meant, and {fan.first} is quiet afterwards. A story about it spreads in a version that makes you sound petty.`, effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
      { id: 'trade', label: `Offer a trade: the bracket for a spot in the front row`, risk: 'low', requires: { stat: { money: { gte: 150 } } }, result: `{fan.first} accepts with a squeak, and the next night the front-row seat holds a person who shouts your name every time you appear. It costs you a ticket and it rents you a loud friend.`, effects: [{ money: -150 }, { pop: 0.5 }, { conf: 2 }] },
      { id: 'secret', label: `Tell {fan.first} your real plan and swear {fan.first} to silence`, risk: 'high', result: `{fan.first} listens with the gravity of a priest and promises the secret to a plastic cup. By the weekend three fan newsletters have a version of it, all slightly wrong.`, effects: [{ pop: 0.2 }, { conf: -3 }, { fatigue: 1 }] },
    ],
  },
  {
    id: 'ng_rmb_one_night_truce', category: 'rumble', title: `A Truce for One Night`, weight: 2.5, major: true, cooldownDays: 300, maxPerCareer: 3, categoryCooldown: 10,
    cast: { rival: { pick: 'rivalry', minHeat: 25, status: 'active' } }, memory: { role: 'rival', max: 2 },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 7 }, stat: { popularity: { gte: 25 } } },
    slots: { how: [`on a note left at the front desk`, `on a folded program slipped into your bag`, `through the agent`], terms: [`stay off each other until the field thins out`, `eliminate nobody else until you two are alone`, `watch each other's backs for the first ten minutes`] },
    body: [`The message arrives {how}: {rival.name} wants a truce. "One night only," it ends. The terms are simple, namely to {terms}, and then the old feud can resume wherever it was left.`, `It is hard to say which is more suspicious, a rival who offers peace or the part of you that wants to take it. A Rumble has a way of making alliances useful and then making them expensive.`],
    choices: [
      { id: 'accept', label: `Shake on the truce and mean it`, risk: 'med', result: `The truce holds, more or less, for the first stretch of the match. Both of you leave the ring with a respect that was not there before, and the heat between you settles into something nearly honest.`, effects: [{ rel: { who: 'rival', trust: 6, respect: 5, heat: -8 } }, { pop: 0.4 }, { conf: 2 }] },
      { id: 'decline', label: `Turn it down: the feud is the point`, risk: 'low', result: `{rival.first} shrugs and says to see you in the ring. The line is a challenge, and the audience senses that two people mean business.`, effects: [{ rivalry: { who: 'rival', heat: 8 } }, { pop: 0.4 }, { conf: 2 }] },
      { id: 'secret_plan', label: `Accept in public and plan to break it in private`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, confidence: 0.3 }, text: `You break the truce at the perfect moment and the crowd gasps in delighted betrayal. {rival.first} gives a slow, reluctant nod from the floor that you will remember for years.`, effects: [{ pop: 1.0 }, { conf: 4 }, { rel: { who: 'rival', trust: -8, heat: 10 } }, { rivalry: { who: 'rival', heat: 10 } }] },
        { weight: 1, text: `{rival.first} guessed your plan and got there first, and you hit the floor while the crowd laughs in your direction. It is a lesson learned in front of an audience of thousands.`, effects: [{ pop: -0.4 }, { conf: -5 }, { rel: { who: 'rival', respect: 3 } }] } ] },
      { id: 'terms', label: `Counter with your own terms and a time limit`, risk: 'med', result: `After three rounds of haggling the truce is whittled down to the first eight minutes, no more. It is the most formal deal either of you has ever made, and it ends exactly on time.`, effects: [{ rel: { who: 'rival', respect: 4, heat: -3 } }, { conf: 2 }, { pop: 0.2 }] },
    ],
  },
  {
    id: 'ng_rmb_taped_wrist', category: 'rumble', title: `Taped Up Before the Rumble`, weight: 2.5, major: true, cooldownDays: 300, maxPerCareer: 3, categoryCooldown: 10,
    cast: { doctor: { pick: 'staff', role: 'doctor' } },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 7 }, injured: true, stat: { popularity: { gte: 15 } } },
    slots: { tape: [`a spiral of white tape`, `a stiff brace with Velcro straps`, `a bandage the size of a boxing glove`], warning: [`says the joint will give in the middle of a bump`, `calls the risk small but real`, `will not sign anything without a second opinion`] },
    body: [`The injury you carry is still unhealed, and {doctor.name} has wrapped it in {tape}. The doctor {warning} and slides a clearance form across the table in a way that suggests it is optional. "Your call," the doctor adds.`, `A Rumble is forty minutes of nobody being careful. You can walk in and gamble, walk out and wait for another year, or find a third thing that a doctor has not yet thought of.`],
    choices: [
      { id: 'withdraw', label: `Withdraw and give your spot to a healthy entrant`, risk: 'low', result: `You hand the form back unsigned, and the stagehands hold the number for someone else. The disappointment lasts a week and the joint recovers on schedule.`, effects: [{ fatigue: -10 }, { pop: -0.4 }, { conf: -3 }] },
      { id: 'compete', label: `Compete with a strict plan to protect the injury`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `You work the match like a map with hazards marked in red, and the crowd never sees the care. The injury holds, and you walk out as proud as you are sore.`, effects: [{ pop: 0.6 }, { conf: 3 }, { fatigue: 12 }] },
        { weight: 1, text: `A landing that should have been easy goes wrong, and the joint complains at last. You finish the match on instinct and spend the next morning in a doctor's waiting room.`, effects: [{ pop: 0.2 }, { conf: -3 }, { fatigue: 12 }, { injury: { part: 'arms', severity: 1, days: 10 } }] } ] },
      { id: 'hide', label: `Tell no one else and hide the wrap under your gear`, risk: 'high', result: `The gear covers the wrap and the adrenaline covers the pain, and for twenty minutes you feel nearly invincible. Afterwards the injury swells like a loaf of bread.`, effects: [{ pop: 0.8 }, { conf: 2 }, { fatigue: 14 }, { injury: { part: 'arms', severity: 1, days: 12 } }] },
      { id: 'second', label: `Pay for a second opinion before deciding`, risk: 'low', requires: { stat: { money: { gte: 600 } } }, result: `The second doctor disagrees with the first on two details and agrees on the important one. Armed with a clearer picture, you make the call with a steadier head.`, effects: [{ money: -600 }, { conf: 2 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'ng_rmb_secret_entry', category: 'rumble', title: `Keeping a Secret From {ally.name}`, weight: 2, major: true, cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 10,
    cast: { ally: { pick: 'tag', tag: 'ally' }, creative: { pick: 'staff', role: 'creative' } }, memory: { role: 'ally', max: 1, noResults: true },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 5 }, stat: { popularity: { gte: 30 } } },
    slots: { place: [`at the pre-show meal`, `in the hotel lobby`, `on the drive to the arena`], cover: [`a made-up injury`, `a rumour that you have been moved to another show`, `a long, boring story about a missed flight`] },
    body: [`{creative.name} has asked you to keep a surprise from everyone, including the fans, and including {ally.name}. {ally.first} asks you directly {place}, "Are you in the match?" and the lie you were handed is {cover}.`, `It is a small betrayal wearing the clothes of professionalism. You can protect the secret, protect the friendship, or find a version of the truth that serves both.`],
    choices: [
      { id: 'lie', label: `Keep the secret and use the cover story`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The cover story holds, and when the surprise lands {ally.first} laughs in the wings instead of glaring. The secret pays off in noise.`, effects: [{ pop: 0.9 }, { conf: 3 }, { rel: { who: 'ally', trust: -1 } }] },
        { weight: 1, text: `{ally.first} sees through it in two sentences and the lie goes sour. The surprise is a success and the friendship is a little worse for being the price of one.`, effects: [{ pop: 0.7 }, { rel: { who: 'ally', trust: -8, affinity: -4 } }, { conf: -1 }] } ] },
      { id: 'tell', label: `Tell {ally.first} and ask for silence`, risk: 'med', result: `The confidence is received with a grin and a vow, and {ally.first} guards it better than most. The creative team learns about it and is not pleased.`, effects: [{ rel: { who: 'ally', trust: 8, affinity: 5 } }, { pop: 0.4 }, { conf: 1 }] },
      { id: 'deflect', label: `Say you cannot discuss it, and mean no more`, risk: 'low', result: `{ally.first} reads the evasion as a no and finds it kind of funny. The line is true, thin and utterly professional.`, effects: [{ conf: 1 }, { pop: 0.3 }, { rel: { who: 'ally', trust: -2 } }] },
      { id: 'creative', label: `Ask {creative.first} whether {ally.first} can be let in`, risk: 'med', result: `After a short phone call and a long sigh, the secret is expanded by one person. The surprise loses some of its edge and gains an extra ally in the wings.`, effects: [{ rel: { who: 'ally', trust: 5 } }, { pop: 0.2 }, { conf: 1 }, { money: -200 }] },
    ],
  },
  // ======================= WRESTLEMANIA =======================
  {
    id: 'ng_wm_rival_gift', category: 'wrestlemania', title: `A Gift From {rival.name}`, weight: 2.5, major: true, cooldownDays: 330, maxPerCareer: 3, categoryCooldown: 10,
    cast: { rival: { pick: 'rivalry', minHeat: 15, status: 'active' } }, memory: { role: 'rival', max: 1, noResults: true },
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 10 }, stat: { popularity: { gte: 25 } } },
    slots: { gift: [`a fresh pair of boots in your size`, `a new pair of kneepads in your size`, `a pair of gloves in your size`], delivery: [`left on top of your bag`, `handed over by a stagehand with a straight face`, `delivered to your hotel room before breakfast`] },
    body: [`{gift} has arrived from {rival.name}, {delivery}. There is no explanation, no joke and no signature beyond a single initial.`, `Nobody sends a present to a rival in the week of the biggest show of the year without a reason, and there are only two possible reasons. The first is respect and the second is something that will not be known until you put them on.`],
    choices: [
      { id: 'use', label: `Take it at face value and use it on the night`, risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.3 }, text: `It is a gift and nothing more, and they fit as if they were poured on. {rival.first} sees them in the ring on the night and gives a short nod that says everything.`, effects: [{ rel: { who: 'rival', respect: 7, trust: 5, heat: -6 } }, { conf: 3 }, { pop: 0.3 }] },
        { weight: 1, text: `The gift turns out to be a prank with a sore edge, and the first bump of your night hurts more than it should. {rival.first} looks delighted from across the room, and the humiliation is public.`, effects: [{ rel: { who: 'rival', heat: 8, trust: -6 } }, { conf: -4 }, { pop: -0.3 }, { fatigue: 5 }] } ] },
      { id: 'inspect', label: `Have the crew inspect it and decide afterwards`, risk: 'low', result: `A ring-crew veteran turns the gift over in weathered hands for ten minutes and pronounces it clean. You use it without a worry, and without the glow of trust either.`, effects: [{ conf: 1 }, { rel: { who: 'rival', respect: 2 } }, { fatigue: 1 }] },
      { id: 'return', label: `Return it in public, with a note of your own`, risk: 'med', result: `The note reads "Not today," and the return is staged in the middle of catering. The room hears every syllable, and {rival.first} spends the afternoon looking at the wall.`, effects: [{ rivalry: { who: 'rival', heat: 10 } }, { rel: { who: 'rival', heat: 8 } }, { pop: 0.6 }, { conf: 2 }] },
      { id: 'reply', label: `Send back a gift of your own of equal value`, risk: 'low', requires: { stat: { money: { gte: 300 } } }, result: `The gift goes back in a plain bag with a single initial of your own. Neither of you mentions it, and the exchange hangs in the air like the smell of cut wood.`, effects: [{ money: -300 }, { rel: { who: 'rival', respect: 5, affinity: 3 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'ng_wm_gear_mishap', category: 'wrestlemania', title: `The Gear Arrived {mishap}`, weight: 2, contexts: ['weekly', 'pre_show'], cooldownDays: 330, maxPerCareer: 2, categoryCooldown: 10,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 5 }, stat: { popularity: { gte: 20 } } },
    slots: { mishap: [`in the wrong colours`, `two sizes too small`, `with someone else's name stitched in`], fixer: [`a seamstress on a three-hour deadline`, `the arena wardrobe room`, `a hotel ironing board and a stern attitude`] },
    body: [`The box from the outfitter has come, and the gear inside is wrong in a way that cannot be unseen. {agent.name} stands over it with a phone to one ear. "We have options," {agent.first} says. The first is {fixer}.`, `It is a fortnight of work and a month of planning, undone by a clerical error and a courier. The match is still the match, though the person walking to the ring is about to look very different from the one on the poster.`],
    choices: [
      { id: 'wear', label: `Wear it anyway and carry it with total confidence`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.3 }, text: `You walk out as if the mistake were the plan, and the crowd takes it as a style choice. Three days later a fan newsletter calls it the boldest look of the weekend.`, effects: [{ pop: 0.7 }, { conf: 4 }] },
        { weight: 1, text: `It is too obvious to hide, and every camera finds the flaw. The photographs that circulate the next morning show you looking exactly as uncomfortable as you felt.`, effects: [{ pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'rush', label: `Pay for an emergency fix and a rush courier`, risk: 'low', requires: { stat: { money: { gte: 1000 } } }, result: `The invoice has an unusually large number on it, but the repaired gear is on your back by dinner. You sleep with the garment bag on the chair like a guest.`, effects: [{ money: -1000 }, { conf: 3 }, { fatigue: 2 }] },
      { id: 'old', label: `Dig out your old gear from the bottom of the bag`, risk: 'low', result: `The old gear is worn at the seams and faded in the way that fans call authentic. It works, and it keeps the budget quiet, though nobody will confuse it with a debut.`, effects: [{ pop: 0.2 }, { conf: 1 }, { fatigue: 1 }] },
      { id: 'story', label: `Pitch the mishap as a storyline with {agent.first}`, risk: 'med', result: `{agent.first} laughs, then stops laughing, then starts writing on the back of a program. The segment is booked, you are in disguise for two minutes, and nobody involved will ever admit it was an accident.`, effects: [{ pop: 0.4 }, { conf: 2 }, { fatigue: 4 }, { charisma: 1 }] },
    ],
  },
  {
    id: 'ng_wm_ally_walks_out', category: 'wrestlemania', title: `{ally.name} Offers to Walk You Out`, weight: 2, major: true, contexts: ['weekly', 'pre_show'], cooldownDays: 330, maxPerCareer: 2, categoryCooldown: 10,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1, noResults: true },
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 10 }, stat: { popularity: { gte: 25 } } },
    slots: { place: [`in the hotel gym`, `over a late breakfast`, `outside the production offices`], plan: [`stay behind you all the way to the ring`, `carry your robe and take the first wave of noise`, `walk to the ring beside you and peel off at the steps`] },
    body: [`{ally.name} comes straight to the point {place}: for the night itself, {ally.first} would like to {plan}. "There is nothing in it for me," {ally.they} says, "beyond a good seat and a good story."`, `Having a friend at your back changes how a walk feels, and sometimes it changes what the crowd sees. Some walks are built to be taken alone.`],
    choices: [
      { id: 'yes', label: `Say yes and share the walk`, risk: 'low', result: `The two of you reach the top of the ramp in step, and the volume doubles. It is a loud, warm, slightly overwhelming kind of company, and you remember it for years.`, effects: [{ rel: { who: 'ally', trust: 7, affinity: 8 } }, { pop: 0.6 }, { conf: 3 }] },
      { id: 'alone', label: `Say you need to walk it alone`, risk: 'low', result: `{ally.first} says that figures, then offers a fist bump with real grace. You take the loneliest long walk of your life and keep every second of it.`, effects: [{ conf: 4 }, { rel: { who: 'ally', affinity: -2 } }, { pop: 0.2 }] },
      { id: 'monitor', label: `Ask {ally.first} to watch the monitor and report back`, risk: 'med', result: `After the match {ally.first} reels off the details like an accountant: a missed glance, a lost beat, a perfect pause. It is useful, honest, and more sobering than you wanted.`, effects: [{ rel: { who: 'ally', trust: 4, respect: 3 } }, { attr: { name: 'psychology', delta: 1 } }, { conf: -1 }] },
      { id: 'surprise', label: `Make it a surprise: walk out separately, then meet`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `The crowd does not know whether to cheer or to gasp, so it does both. The meeting in the middle of the ramp is a perfect piece of showmanship.`, effects: [{ pop: 1.0 }, { rel: { who: 'ally', affinity: 5 } }, { conf: 3 }, { fatigue: 4 }] },
        { weight: 1, text: `The timing is off by ten seconds and the music cue goes wrong, and the whole thing falls flat in front of the biggest crowd of your year. {ally.first} laughs about it first, which helps a little.`, effects: [{ pop: -0.2 }, { conf: -3 }, { rel: { who: 'ally', affinity: 2 } }] } ] },
    ],
  },
  {
    id: 'ng_wm_empty_stadium', category: 'wrestlemania', title: `The Stadium Before the Crowd`, weight: 1.5, contexts: ['weekly', 'pre_show'], cooldownDays: 330, maxPerCareer: 2, categoryCooldown: 10,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1, noResults: true },
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 3 }, stat: { popularity: { gte: 25 } } },
    slots: { notice: [`how far away the top row of seats is`, `the sound of your own footsteps on the ramp`, `the smell of fresh canvas and warm cables`], doing: [`sits on the apron beside you`, `leans on the barricade with two paper cups`, `stands in the aisle and does an impression of the announcer`] },
    body: [`The crew has let the two of you into the stadium before the doors open. All you can notice is {notice}, while {ally.name} {doing}.`, `"In a few days this place will be a roar with a ceiling," {ally.first} says. Today it is a very big, very quiet room, and you are free to think whatever you like inside it.`],
    choices: [
      { id: 'walk', label: `Walk your entrance in silence, start to finish`, risk: 'low', result: `You count the steps, mark the light on the ramp and stop at the exact spot where the pyro will go off. By the time you reach the ring the building feels less like a monster and more like a room you know.`, effects: [{ conf: 5 }, { fatigue: 3 }] },
      { id: 'sit', label: `Sit in the ring and say nothing to anyone`, risk: 'low', result: `The two of you sit with your legs through the ropes and watch the empty seats until the lights go off. It is the quietest hour of the week, and it is the one you will want again.`, effects: [{ conf: 3 }, { fatigue: -6 }, { rel: { who: 'ally', affinity: 5 } }] },
      { id: 'critique', label: `Ask {ally.first} to be harsh about your entrance`, risk: 'med', result: `{ally.first} is kind for two minutes and then very honest, and a better walk emerges from the argument. You emerge irritated, improved and a little humbled.`, effects: [{ rel: { who: 'ally', respect: 4, trust: 3 } }, { attr: { name: 'psychology', delta: 1 } }, { conf: 1 }, { fatigue: 3 }] },
      { id: 'climb', label: `Climb to the top row and look down at the ring`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `From up there the ring is a postage stamp and you are a pencil mark on it. The scale is terrifying, then freeing, and you come down feeling oddly weightless.`, effects: [{ conf: 4 }, { fatigue: 5 }, { pop: 0.1 }] },
        { weight: 1, text: `The view is overwhelming in the wrong way, and the nerves you had parked come roaring back. You spend the evening trying to remember a thing you had learned that morning.`, effects: [{ conf: -4 }, { fatigue: 5 }] } ] },
    ],
  },
  {
    id: 'ng_wm_reluctant_opponent', category: 'wrestlemania', title: `{opp.name} Does Not Want the Match`, weight: 2, major: true, cooldownDays: 330, maxPerCareer: 2, categoryCooldown: 12,
    cast: { opp: { pick: 'tag', tag: 'reluctant' }, boss: { pick: 'staff', role: 'creative' } }, memory: { role: 'opp', max: 1 },
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 30 }, stat: { popularity: { gte: 25 } } },
    slots: { reason: [`says the match has no story left`, `says any other match would be better`, `has stopped answering the office's calls`], room: [`a corner of the production office`, `the back of a rental car`, `a quiet booth at the hotel`] },
    body: [`The creative plan for WrestleMania has you facing {opp.name}, and {opp.first} {reason}. {boss.name} explains it to you in {room}. "I need a yes by Friday," {boss.first} says, and the whole conversation has the tone of a negotiation with a wall.`, `Putting two people in a ring against their will is an old and unreliable trick. You can bend {opp.first}, ask for somebody else, or find out exactly why the answer is no.`],
    choices: [
      { id: 'persuade', label: `Go to {opp.first} yourself and make the case`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.3 }, text: `You find {opp.first} in a stairwell and say the true things. A match is agreed before either of you leaves the building, and it feels more honest than it has any right to.`, effects: [{ booking: { who: 'opp', type: 'singles' } }, { rel: { who: 'opp', respect: 5, trust: 4 } }, { pop: 0.6 }, { conf: 3 }] },
        { weight: 1, text: `{opp.first} hears you out and says no twice more, politely, with a patience that is harder to argue with than anger. You head back to the office with nothing but a sore pride.`, effects: [{ conf: -3 }, { rel: { who: 'opp', respect: 1 } }] } ] },
      { id: 'other', label: `Ask {boss.first} for a different opponent`, risk: 'low', result: `{boss.first} sighs with the relief of a person who was afraid you would insist. The new name is bigger and the story is thinner, and the match has a new shape by the end of the week.`, effects: [{ pop: 0.2 }, { conf: 1 }, { rel: { who: 'opp', respect: 2 } }] },
      { id: 'taunt', label: `Taunt {opp.first} into saying yes on the next show`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.6 }, text: `You shout the question on live television and the crowd hammers on the barricade in the answer. {opp.first} signs the match with a face like thunder and a hand like a vice.`, effects: [{ booking: { who: 'opp', type: 'singles' } }, { rivalry: { who: 'opp', heat: 12 } }, { pop: 0.9 }, { conf: 3 }] },
        { weight: 1, text: `The taunt sounds like bullying, and the crowd's silence tells you so. {opp.first} walks off, the match is dead, and you stand alone with a microphone.`, effects: [{ pop: -0.5 }, { conf: -4 }, { rel: { who: 'opp', respect: -4 } }] } ] },
      { id: 'drop', label: `Tell {boss.first} to drop it and book something smaller`, risk: 'med', result: `The big-stage plan is shelved and replaced by a smaller card that gets very little attention. You keep your integrity and lose the year's biggest spotlight.`, effects: [{ pop: -0.5 }, { conf: 2 }, { rel: { who: 'opp', respect: 3 } }] },
    ],
  },
  {
    id: 'ng_wm_legend_collar', category: 'wrestlemania', title: `A Legend Straightens Your Collar`, weight: 1.5, contexts: ['show_day', 'pre_show'], cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 12,
    cast: { legend: { pick: 'roster', tier: { gte: 3 } } },
    trigger: { minYear: 1985, event: 'wrestlemania', stat: { popularity: { gte: 25 } } },
    slots: { place: [`in the gorilla position`, `at the end of a concrete corridor`, `outside the locker-room door`], advice: [`tells you the nerves never actually leave`, `says the crowd is a living thing with no memory`, `warns you not to look at the camera in the first minute`] },
    body: [`{legend.name} finds you {place}, reaches out and straightens a part of your gear that was perfectly fine. "There," {legend.they} says. Then {legend.first} {advice}, in a voice meant for you alone.`, `It is not clear whether it is a blessing, a habit or a bit of superstition. A veteran has said something to you that you will quote for years, and the show is still ninety minutes away.`],
    choices: [
      { id: 'thank', label: `Thank {legend.first} and hold on to the words`, risk: 'low', result: `The words go with you into the building like a lucky coin, and you finger them at the curtain. The match is better for it, and so is the walk.`, effects: [{ conf: 4 }, { rel: { who: 'legend', respect: 4 } }, { pop: 0.2 }, { fatigue: 3 }] },
      { id: 'ask', label: `Ask {legend.first} what the first minute really feels like`, risk: 'med', result: `{legend.first} tells you the truth in three sentences that end in a laugh. It does not calm you down exactly, but it makes the fear feel like company.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { conf: 2 }, { rel: { who: 'legend', affinity: 4 } }] },
      { id: 'joke', label: `Joke that the advice is meant for someone else`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The legend barks a laugh that bounces off the walls, and the whole corridor relaxes. You walk into the match with a grin that you did not plan.`, effects: [{ conf: 3 }, { rel: { who: 'legend', affinity: 5 } }, { pop: 0.2 }] },
        { weight: 1, text: `The joke arrives like a dropped tray, and {legend.first} gives you a long and not entirely friendly look. The nerves you were trying to hide come back with interest.`, effects: [{ conf: -3 }, { rel: { who: 'legend', respect: -3 } }] } ] },
      { id: 'ignore', label: `Stay inside your own head and say very little`, risk: 'low', result: `You mutter a thanks and look at your boots, and {legend.first} nods and moves on. The focus is sharp, and the exchange will feel like a missed chance when you think of it later.`, effects: [{ conf: 2 }, { fatigue: 1 }, { rel: { who: 'legend', respect: -1 } }] },
    ],
  },
  {
    id: 'ng_wm_tunnel_rival', category: 'wrestlemania', title: `{rival.name} in the Tunnel`, weight: 2.5, major: true, contexts: ['post_show', 'post_match'], cooldownDays: 330, maxPerCareer: 3, categoryCooldown: 10,
    cast: { rival: { pick: 'rivalry', minHeat: 15, status: 'active' } }, memory: { role: 'rival', max: 2 },
    trigger: { minYear: 1985, event: 'wrestlemania' },
    slots: { state: [`limping`, `still catching {rival.their} breath`, `holding a towel to {rival.their} face`], gesture: [`says nothing at all`, `offers a hand`, `laughs in a way that is difficult to read`] },
    body: [`The big night is behind you, and {rival.name} is waiting at the end of the tunnel, {state}. When you come level, {rival.first} {gesture}.`, `Whatever the scoreboard says, the crowd has already gone home with its own version. The two of you stand under a flickering light with the noise still ringing in your ears.`],
    choices: [
      { id: 'shake', label: `Hold out your hand to {rival.first}`, risk: 'low', result: `The handshake is slow and true. The rivalry does not end, but it changes shape, as though a heavy coat were set down.`, effects: [{ rel: { who: 'rival', respect: 7, trust: 3, heat: -8 } }, { conf: 3 }, { pop: 0.2 }] },
      { id: 'talk', label: `Say what you have never been able to say`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.3 }, text: `You say it clumsily and out loud, and {rival.first} listens to all of it. The conversation lasts until security asks the two of you to leave.`, effects: [{ rel: { who: 'rival', respect: 8, trust: 5 } }, { conf: 3 }, { pop: 0.2 }] },
        { weight: 1, text: `The words come out sharper than you meant and get twisted into an insult. {rival.first} walks off, and the heat comes back in a rush.`, effects: [{ rel: { who: 'rival', heat: 9, respect: -3 } }, { conf: -3 }] } ] },
      { id: 'stoke', label: `Stoke the fire: promise it is not over`, risk: 'med', result: `"It is not over," you say, with a grin and a pointed finger, and {rival.first} does not look away. The next chapter of the feud is announced in one low sentence, and a passing crew member hears all of it.`, effects: [{ rivalry: { who: 'rival', heat: 12 } }, { rel: { who: 'rival', heat: 8 } }, { pop: 0.5 }, { fatigue: 2 }] },
      { id: 'leave', label: `Nod once and go to find some ice`, risk: 'low', result: `You nod and keep walking, and the tunnel closes behind you like a mouth. It is a quiet exit that nobody will talk about, and you are asleep before the van leaves the parking lot.`, effects: [{ fatigue: -4 }, { conf: 1 }, { rel: { who: 'rival', respect: -1 } }] },
    ],
  },
  {
    id: 'ng_wm_wrong_poster', category: 'wrestlemania', title: `The Poster Has {flaw}`, weight: 1.5, contexts: ['weekly', 'pre_show'], cooldownDays: 330, maxPerCareer: 2, categoryCooldown: 10,
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 21 }, stat: { popularity: { gte: 45 } } },
    slots: { flaw: [`the wrong photo`, `someone else's body`, `your name misspelled`], place: [`the hotel lobby`, `the airport arrivals hall`, `a bus shelter outside the arena`] },
    body: [`It is the first time you have seen your name on a poster for the biggest show of the year, and it is hung in {place} where thousands will see it. The problem is obvious from forty feet: the poster has {flaw}. "Is that you?" a passer-by asks, squinting from you to the poster.`, `Posters are history in the first draft. You can spend your week angry about it, or spend it on something that will outlast the print run.`],
    choices: [
      { id: 'photo', label: `Pose for a photo with it and share the joke`, risk: 'low', result: `The picture runs in two fan magazines, which treat it as a good-natured peek behind the curtain. Fans show up to the signing with posters of their own and demand you sign the mistakes.`, effects: [{ pop: 0.6 }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'complain', label: `Call the marketing office and demand a reprint`, risk: 'med', result: `Marketing agrees to reprint a smaller run and sends the rest to the recycling bin. The new posters are right, the old ones become collectors' items, and your name appears on a rather sour memo.`, effects: [{ conf: 2 }, { pop: -0.1 }, { money: -400 }] },
      { id: 'own', label: `Turn it into a bit on the next promo`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.4 }, text: `You hold up a copy of the poster and spend three minutes pointing out its sins in detail. The crowd loves the self-mockery, and the posters sell out by the weekend.`, effects: [{ pop: 0.8 }, { conf: 3 }] },
        { weight: 1, text: `The joke runs too long and the crowd drifts to the exits for beer. Marketing hears about it and decides not to ask for your opinion on anything again.`, effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'sign', label: `Say nothing and sign every copy anyone brings to you`, risk: 'low', result: `By the end of the week your handwriting has run across a hundred posters, and it hurts to hold a pen. Every one of them goes home with a mistake and a signature, which in the end is worth more.`, effects: [{ pop: 0.4 }, { fatigue: 5 }, { conf: 1 }] },
    ],
  },
  {
    id: 'ng_wm_finish_changed', category: 'wrestlemania', title: `The Finish Changed This Morning`, weight: 2.5, major: true, contexts: ['show_day', 'pre_show'], cooldownDays: 330, maxPerCareer: 3, categoryCooldown: 10,
    cast: { rival: { pick: 'rivalry', minHeat: 15, status: 'active' }, agent: { pick: 'staff', role: 'agent' } }, memory: { role: 'rival', max: 1, noResults: true },
    trigger: { minYear: 1985, event: 'wrestlemania', stat: { popularity: { gte: 25 } } },
    slots: { change: [`the ending has been flipped`, `a surprise interruption has been written in`, `a new spot has been added in the last two minutes`], delivery: [`with a coffee in each hand`, `wearing a very calm face`, `with one eye on the exit`] },
    body: [`{agent.name} arrives {delivery} to tell you that {change}. "Do not shoot the messenger," {agent.first} adds. The plan you have rehearsed with {rival.name} is still half-correct, which is the most dangerous kind.`, `There are tens of thousands of people on the way and one phone call from the office has changed the story. You have a few hours to find a way for the new plan to feel like it belongs to you.`],
    choices: [
      { id: 'accept', label: `Accept the change and rebuild the match around it`, risk: 'low', result: `You and {rival.first} spend the afternoon sketching positions on a whiteboard with a dying marker. The new plan has stitches showing, but it is yours.`, effects: [{ rel: { who: 'rival', trust: 4, respect: 3 } }, { fatigue: 5 }, { conf: 2 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'argue', label: `Argue with {agent.first} and defend the old plan`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4, popularity: 0.3 }, text: `Your case is clear, calm and bolstered by a stack of notes. {agent.first} carries it upstairs and returns with half of the old finish restored.`, effects: [{ conf: 3 }, { pop: 0.4 }, { rel: { who: 'rival', respect: 2 } }] },
        { weight: 1, text: `The argument goes in circles and ends with a shrug that says the decision was made far above your head. You are now the person who complained on the biggest day of the year.`, effects: [{ conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'rival_talk', label: `Plan a private tweak with {rival.first} alone`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.3, overall: 0.3 }, text: `The two of you agree on one small improvisation, and when it lands the building gasps at something nobody had written. It is the kind of moment people mention in the car for months.`, effects: [{ pop: 1.0 }, { rel: { who: 'rival', trust: 6, respect: 5 } }, { conf: 4 }] },
        { weight: 1, text: `The tweak gets lost in the noise, and for a heart-stopping moment both of you are standing in the wrong place. The match recovers, but {agent.first} looks at you afterwards in a way that you do not forget.`, effects: [{ pop: -0.2 }, { conf: -3 }, { rel: { who: 'rival', trust: 1 } }] } ] },
      { id: 'pitch', label: `Offer an alternative ending of your own`, risk: 'med', result: `{agent.first} listens to the pitch with {agent.their} head in {agent.their} hands and then carries it upstairs. It comes back changed, trimmed and plausible, with your fingerprints clearly on the bones.`, effects: [{ pop: 0.4 }, { conf: 2 }, { fatigue: 4 }, { mic: 1 }] },
    ],
  },
  // ======================= CHAMPIONSHIP =======================
  {
    id: 'ng_chp_belt_coming_apart', category: 'championship', title: `The Belt Is Coming Apart`, weight: 1.5, major: true, contexts: ['weekly', 'pre_show'], cooldownDays: 250, maxPerCareer: 2, categoryCooldown: 12,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { holdsTitle: true, stat: { daysChampion: { gte: 60 } } },
    slots: { damage: [`a crack running through the leather`, `a side plate hanging by one screw`, `a strap stretched like old elastic`], offer: [`a brand-new replica made overnight`, `a rushed repair with glue and thread`, `a redesigned belt with a bigger plate`] },
    body: [`{agent.name} turns the belt over under the dressing-room light and points to {damage}. "It has seen better days," {agent.first} says. The title has been through airports, cheap hotels and more than one rowdy celebration, and it is beginning to look the part.`, `The company can supply {offer}, and the only question is what the belt should say about you. A champion is tied to a strip of leather in ways that nobody warns you about.`],
    choices: [
      { id: 'replace', label: `Accept the new belt and retire the old one`, risk: 'low', result: `The replacement shines under the lights and feels slightly wrong across the shoulder. The old belt goes into a case in the office, and nobody asks if you want to say goodbye.`, effects: [{ pop: 0.2 }, { conf: -1 }] },
      { id: 'keep', label: `Keep the damaged belt and carry it proudly`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.3 }, text: `The cracks become part of the character, and the crowd treats the battered title as proof that you earned it. A photograph of the damage ends up on posters the next week.`, effects: [{ pop: 0.7 }, { conf: 3 }] },
        { weight: 1, text: `A plate comes loose during a pose and clatters across the canvas, and the crowd sniggers. You pick it up with all the dignity left in the room.`, effects: [{ pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'restore', label: `Pay a specialist to restore the original properly`, risk: 'low', requires: { stat: { money: { gte: 800 } } }, result: `A craftsman in a cramped workshop spends a week stitching and polishing, and returns it looking dignified rather than new. It costs a good deal, and it keeps the history in the leather.`, effects: [{ money: -800 }, { conf: 3 }, { pop: 0.2 }] },
      { id: 'auction', label: `Ask to auction the old belt for charity`, risk: 'med', result: `The old belt raises a startling sum for a local cause and goes to a collector who weeps on the stage. The publicity is warm, and you feel a stab of loss when it leaves the building.`, effects: [{ pop: 0.6 }, { conf: 1 }, { fatigue: 2 }, { money: -200 }] },
    ],
  },
  {
    id: 'ng_chp_photo_with_champ', category: 'championship', title: `{champ.name} Wants a Photo With You`, weight: 2, major: true, contexts: ['weekly', 'pre_show'], cooldownDays: 250, maxPerCareer: 3, categoryCooldown: 12,
    cast: { champ: { pick: 'champion', class: 'world' } },
    trigger: { holdsTitle: false, stat: { popularity: { gte: 40 } } },
    slots: { crew: [`a magazine photographer`, `a local news crew`, `the company's own camera operator`], framing: [`the two of you shaking hands over the belt`, `the belt held out toward you like an offer`, `a staged stare-down for the cover`] },
    body: [`{champ.name} is waiting with {crew} when you arrive, smiling too widely. The picture on offer is {framing}. "Closer," {champ.first} says through the smile, and it comes with the unspoken message that it is your turn to be photographed next to the thing you want.`, `A photo with a champion is half promotion and half bait. Smile too wide and you become the supporting cast; scowl too hard and you become a villain before the conversation has started.`],
    choices: [
      { id: 'smile', label: `Pose with a warm smile and a firm handshake`, risk: 'low', result: `The picture is friendly, polished and slightly dull, and it goes out in two places. {champ.first} thanks you with genuine warmth and you go home with a feeling of having been handled.`, effects: [{ pop: 0.3 }, { rel: { who: 'champ', respect: 3 } }, { conf: -1 }] },
      { id: 'glare', label: `Pose with a hard stare fixed on the belt`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.3 }, text: `The glare lands exactly as hoped, and someone behind the camera mutters that this is the cover. {champ.first} responds in kind, and the feud has a poster.`, effects: [{ pop: 0.8 }, { rivalry: { who: 'champ', heat: 10 } }, { conf: 3 }] },
        { weight: 1, text: `The stare looks like someone reading a menu in the dark, and the person behind the camera asks you to do it again. {champ.first} bites back a smile that makes it worse.`, effects: [{ pop: -0.2 }, { conf: -3 }, { rel: { who: 'champ', respect: 1 } }] } ] },
      { id: 'refuse', label: `Refuse to be photographed with it until you earn it`, risk: 'med', result: `You decline, politely and loudly enough for everyone to hear. The refusal is quoted as pride by some and as arrogance by others, and {champ.first} keeps the smile on a little too long.`, effects: [{ conf: 3 }, { pop: 0.2 }, { rel: { who: 'champ', respect: 2, heat: 4 } }] },
      { id: 'steal', label: `Take hold of the belt for the shot, uninvited`, risk: 'high', result: `The belt is in your hands before anyone can stop it, and the camera fires off a dozen frames. {champ.first} takes it back with a thin smile, and security stands a few paces closer for the rest of the day.`, effects: [{ pop: 0.9 }, { rivalry: { who: 'champ', heat: 14 } }, { rel: { who: 'champ', heat: 10, respect: -3 } }, { conf: 2 }] },
    ],
  },
  {
    id: 'ng_chp_ally_same_shot', category: 'championship', title: `You and {ally.name} Want the Same Shot`, weight: 2.5, major: true, cooldownDays: 250, maxPerCareer: 2, categoryCooldown: 12,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1, noResults: true },
    trigger: { holdsTitle: false, stat: { popularity: { gte: 40 } } },
    slots: { stage: [`over a long dinner`, `in a hotel corridor`, `in the front seat of a rental car`], idea: [`a coin toss`, `a decider match`, `taking turns`] },
    body: [`The office has one title shot to give and two names in the running, yours and {ally.name}'s. The subject comes up {stage}, and {ally.first} is the first to name {idea}.`, `"Let us not ruin this," {ally.first} says. Friendship in this business tends to hold until it has to share something. The honest part of you wants the shot and the honest part of {ally.first} wants it too.`],
    choices: [
      { id: 'concede', label: `Step aside and let {ally.first} take the shot`, risk: 'low', result: `{ally.first} refuses at first and then accepts with a hug that lifts you off the ground. The shot is not yours, but the loyalty is, and it will be worth something later.`, effects: [{ rel: { who: 'ally', trust: 12, affinity: 8, respect: 5 } }, { pop: -0.3 }, { conf: -3 }] },
      { id: 'compete', label: `Put the shot on the line in a singles match`, risk: 'high', result: `The match is booked as a friendly competition and plays as anything but. Both of you work with a ferocity the crowd mistakes for hatred, and the handshake afterward lasts a beat too long.`, effects: [{ booking: { who: 'ally', type: 'singles' } }, { rel: { who: 'ally', respect: 6, trust: -3 } }, { pop: 0.7 }, { fatigue: 8 }, { conf: 2 }] },
      { id: 'coin', label: `Settle it with the toss of a coin and honour the result`, risk: 'med', outcomes: [
        { weight: 1, text: `The coin comes up in your favour, and you spend the evening not looking at {ally.first}. The shot is yours, wrapped in a faint apology.`, effects: [{ pop: 0.4 }, { conf: 3 }, { rel: { who: 'ally', trust: 1 } }] },
        { weight: 1, text: `The coin lands on the other side, and you swallow the loss with a grin that hurts a little. {ally.first} is quiet for the rest of the night, and does not look relieved.`, effects: [{ conf: -2 }, { rel: { who: 'ally', trust: 5, affinity: 4 } }] } ] },
      { id: 'team', label: `Propose chasing the tag titles together instead`, risk: 'med', result: `The idea sits between you like a third chair, and then {ally.first} grins and starts naming entrances. A tag title run is a different destination, and the two of you head toward it side by side.`, effects: [{ booking: { who: 'ally', type: 'tag' } }, { rel: { who: 'ally', trust: 7, affinity: 5 } }, { pop: 0.4 }, { fatigue: 5 }] },
    ],
  },
  {
    id: 'ng_chp_friend_challenges', category: 'championship', title: `{ally.name} Asks for a Title Match`, weight: 2.5, major: true, cooldownDays: 250, maxPerCareer: 2, categoryCooldown: 12,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1, noResults: true },
    trigger: { holdsTitle: true, stat: { popularity: { gte: 35 } } },
    slots: { how: [`with a handwritten note`, `in a dressing-room conversation`, `with an awkward phone call`], manner: [`apologising twice before getting to the point`, `cracking a joke to cover for nerves`, `sounding rehearsed to the last comma`] },
    body: [`{ally.name} makes the request {how}, {manner}: a shot at the title you hold. "I will understand if it is no," {ally.first} says. It is the single question that has a way of ending friendships, and {ally.first} knows it.`, `The belt makes everyone around you a challenger. Of all the challengers, the one who has been on your side the longest carries the most weight.`],
    choices: [
      { id: 'grant', label: `Say yes and book the match with the title on the line`, risk: 'med', result: `{ally.first} thanks you in a voice that breaks halfway, and the two of you build the match like old friends. When the bell rings you give each other the best nights either of you has in the tank.`, effects: [{ booking: { who: 'ally', type: 'singles', stakes: 'title' } }, { rel: { who: 'ally', trust: 7, respect: 6 } }, { pop: 0.7 }, { fatigue: 9 }] },
      { id: 'not_yet', label: `Say not yet, but promise a shot after another defence`, risk: 'low', result: `The delay is gentle and well argued, and {ally.first} accepts with stiff grace. The promise hangs in the air like a coat on a hook, waiting to be used.`, effects: [{ promise: { kind: 'retain_title', who: 'ally', text: `I will give {ally.name} a title match after my next defence`, params: { defenses: 1 }, deadlineDays: 120 } }, { rel: { who: 'ally', trust: 1 } }, { conf: 1 }] },
      { id: 'refuse', label: `Say no: the belt is business, not friendship`, risk: 'high', result: `The refusal is flat and exact, and {ally.first} nods with a face like a closed door. It protects the title and costs something that cannot be repaired by the next show.`, effects: [{ rel: { who: 'ally', trust: -10, affinity: -8 } }, { conf: 2 }, { pop: 0.1 }] },
      { id: 'tag_defense', label: `Offer a tag defence with {ally.first} at your side`, risk: 'med', result: `The compromise turns the challenge into a partnership, and the crowd loves the twist. It is not the title match {ally.first} wanted, but it is a different kind of respect.`, effects: [{ booking: { who: 'ally', type: 'tag' } }, { rel: { who: 'ally', trust: 4, affinity: 4 } }, { pop: 0.5 }, { fatigue: 5 }] },
    ],
  },
  {
    id: 'ng_chp_reign_segment', category: 'championship', title: `A Special Segment for Your Reign`, weight: 1.5, contexts: ['weekly', 'pre_show'], cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 12,
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { holdsTitle: true, stat: { daysChampion: { gte: 150 } } },
    slots: { format: [`a retrospective package of old footage`, `a ceremony in the ring with the crowd on its feet`, `a sit-down with the whole roster in the audience`], twist: [`one guest from your past`, `a celebratory cake that will not survive the segment`, `a speech from someone you did not invite`] },
    body: [`{creative.name} wants to mark your reign with a segment built around {format}, and has pencilled in {twist}. It is flattering, a little overwritten and entirely out of your hands.`, `"Trust me, it will be tasteful," {creative.first} says. A long title reign deserves a moment, and moments are made by people with scripts. You can lean into the occasion, rewrite it, or refuse to be turned into a monument.`],
    choices: [
      { id: 'embrace', label: `Embrace it fully and give the audience its moment`, risk: 'low', result: `You hit every beat and the crowd gives you a standing ovation that lasts longer than the rehearsal. It is warm, a little saccharine and exactly what the occasion needed.`, effects: [{ pop: 0.6 }, { conf: 3 }, { fatigue: 2 }] },
      { id: 'rewrite', label: `Rewrite the segment so it is not a eulogy`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.4 }, text: `You turn the tribute into a defiant promise, and the building follows you with a roar. {creative.first} says afterwards that the rewrite was better than the original, which is the highest praise on offer.`, effects: [{ pop: 0.9 }, { conf: 4 }, { mic: 1 }] },
        { weight: 1, text: `The rewrite loses the thread somewhere in the middle, and the segment fizzles into a series of mismatched gestures. {creative.first} smooths it over in the edit, but you can see the strain.`, effects: [{ pop: -0.2 }, { conf: -3 }] } ] },
      { id: 'challenge', label: `Use the segment to throw open a challenge to the roster`, risk: 'high', result: `Instead of a toast, you issue an open invitation to anyone who thinks they can take the belt. The locker room hears every word, and several people begin looking at the card with fresh eyes.`, effects: [{ promise: { kind: 'retain_title', text: `I will defend this championship against all comers`, params: { defenses: 3 }, deadlineDays: 150 } }, { pop: 0.7 }, { conf: 2 }, { fatigue: 4 }] },
      { id: 'decline', label: `Decline: the belt can speak for itself`, risk: 'low', result: `{creative.first} is visibly disappointed and files the plan away for another year. The belt stays quiet, and so do you, which is its own sort of statement.`, effects: [{ conf: 1 }, { pop: -0.2 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'ng_chp_cannot_beat', category: 'championship', title: `The Columnist Says You Cannot Beat {rival.name}`, weight: 2, major: true, contexts: ['weekly', 'post_show'], cooldownDays: 250, maxPerCareer: 2, categoryCooldown: 12,
    cast: { rival: { pick: 'rivalry', minHeat: 10, status: 'active' }, writer: { pick: 'media', kind: 'journalist' } }, memory: { role: 'rival', max: 1 },
    trigger: { holdsTitle: false, stat: { popularity: { gte: 30 } }, mem: [{ role: 'rival', h2h: { lossesGte: 2 } }] },
    slots: { where: [`in a weekend column`, `on the front page of a trade paper`, `in a long feature`], theory: [`you lack the final yard against {rival.name}`, `your style is the wrong shape for beating {rival.name}`, `the pattern with {rival.name} has been the same every time`] },
    body: [`{writer.name} argues {where} that {theory}, and that a title is out of reach until you solve the problem. The piece is fair, well sourced and unbearable to read.`, `The column ends: "Respectfully, prove me wrong." Criticism from a respectable writer travels further than abuse, and whatever you do with it will be remembered as a response, so it had better be a good one.`],
    choices: [
      { id: 'promise', label: `Promise publicly to beat {rival.first} next time`, risk: 'high', result: `The promise goes in print the following morning, and {rival.first} cuts it out and tapes it to a mirror. Now there is a clock on your word and the whole business is watching it.`, effects: [{ promise: { kind: 'win_match', who: 'rival', text: `I will beat {rival.name} the next time we meet`, deadlineDays: 90 } }, { pop: 0.6 }, { rivalry: { who: 'rival', heat: 8 } }, { conf: 2 }] },
      { id: 'sit_down', label: `Sit down with {writer.first} and make your own case`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.4 }, text: `Over two hours of coffee you take the argument apart, one claim at a time, and the writer admits in print that the story is more complicated. It is the best press you have had all year.`, effects: [{ pop: 0.7 }, { conf: 3 }, { event: { type: 'interview', participants: ['writer'], summary: `Argued back against a columnist's claim that {rival.name} was unbeatable.`, data: { quality: { base: 66, mic: 0.5, charisma: 0.3 } } } }] },
        { weight: 1, text: `The conversation goes in circles, and the follow-up column calls you defensive. Reading it over breakfast is a very specific kind of misery.`, effects: [{ pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'study', label: `Say nothing and go back to the tape of every meeting`, risk: 'low', result: `You spend three weeks taking notes in the margin of your own matches. The weakness the columnist described turns out to be real, and fixing it feels like winning an argument in advance.`, effects: [{ attr: { name: 'technical', delta: 1 } }, { fatigue: 6 }, { conf: 2 }, { pop: 0.1 }] },
      { id: 'book', label: `Request the match against {rival.first} this week`, risk: 'med', result: `The office jumps at the headline and books it within the hour. You have taken the question out of the press and put it in the ring, where you cannot hide.`, effects: [{ booking: { who: 'rival', type: 'singles' } }, { pop: 0.4 }, { fatigue: 5 }, { rel: { who: 'rival', respect: 2 } }] },
    ],
  },
  {
    id: 'ng_chp_belt_security', category: 'championship', title: `The Belt Goes Through Security`, weight: 1.5, contexts: ['weekly', 'show_day'], cooldownDays: 250, maxPerCareer: 2, categoryCooldown: 12,
    trigger: { holdsTitle: true },
    slots: { official: [`a security officer`, `a baggage handler`, `a customs inspector`], question: [`whether it is real gold`, `whether you have a receipt for it`, `whether it can be checked as luggage`] },
    body: [`The title belt has gone through the scanner at the airport, and {official} wants to know {question}. A line of travellers is forming behind you, and a few have started to stare.`, `It is the least glamorous place to be a champion. The belt is worth a fortune to you and a puzzle to everyone else, and your flight leaves in forty minutes.`],
    choices: [
      { id: 'laugh', label: `Laugh, open the case and explain everything`, risk: 'low', result: `The official tries it on, grins and hands it back with a salute. "Carry on, champ," the official says. Half the queue asks for a photo, and you miss the early boarding but not the goodwill.`, effects: [{ pop: 0.4 }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'charm', label: `Put on the full champion act and win the room`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.6 }, text: `You deliver a mock victory speech to the queue, and the officer lets you through to a round of applause. The whole thing takes four minutes and earns you a free upgrade.`, effects: [{ pop: 0.7 }, { conf: 3 }, { money: 100 }] },
        { weight: 1, text: `The act goes on too long and the officer's patience runs out. You make the flight with seconds to spare and a story about the argument already on its way around the building.`, effects: [{ pop: -0.2 }, { conf: -2 }, { fatigue: 5 }] } ] },
      { id: 'fast', label: `Pay for the priority lane and avoid the whole scene`, risk: 'low', requires: { stat: { money: { gte: 300 } } }, result: `A discreet fee and a nod take you past the line and straight onto the plane. It is smooth, forgettable and slightly lonely, and you sleep through most of the flight.`, effects: [{ money: -300 }, { fatigue: -4 }, { conf: 1 }] },
      { id: 'miss', label: `Stand your ground and insist on a proper inspection`, risk: 'med', result: `The inspection takes forty minutes, a supervisor, and two phone calls to the company. You miss the flight but win the argument, and the belt remains unbothered.`, effects: [{ fatigue: 6 }, { conf: 2 }, { money: -400 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'ng_chp_gm_deadline', category: 'championship', title: `{gm.name} Sets a Deadline`, weight: 2.5, major: true, cooldownDays: 250, maxPerCareer: 3, categoryCooldown: 12,
    cast: { gm: { pick: 'staff', role: 'gm' }, rival: { pick: 'rivalry', minHeat: 20, status: 'active' } }, memory: { role: 'rival', max: 1, noResults: true },
    trigger: { holdsTitle: true },
    slots: { deadline: [`within a fortnight`, `by the next big show`, `before the end of the next television cycle`], condition: [`or the belt will be declared vacant`, `or a replacement champion will be named`, `or the office will pick the date for you`] },
    body: [`{gm.name} has had enough of the stand-off with {rival.name}, and has called you in to say it plainly: the two of you will meet for the title {deadline}, {condition}. The ultimatum has been circulating through the building for a day.`, `"This ends before it embarrasses the company," {gm.first} says. Being told when and where to defend can feel like losing control of your own belt. It can also be an excuse to take control back, if you pick the terms.`],
    choices: [
      { id: 'accept', label: `Accept the date and defend in a standard match`, risk: 'med', result: `The match is signed and the date is set. There is nothing fancy about it, and the crowd will decide whether it is a classic.`, effects: [{ booking: { who: 'rival', type: 'singles', stakes: 'title' } }, { rivalry: { who: 'rival', heat: 6 } }, { pop: 0.4 }, { conf: 1 }] },
      { id: 'cage', label: `Accept, but inside a steel cage`, risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.4, confidence: 0.3 }, text: `The cage turns an ultimatum into a spectacle, and the crowd is already counting the days. Your body will pay the bill, but the poster practically sells itself.`, effects: [{ booking: { who: 'rival', type: 'cage', stakes: 'title' } }, { pop: 1.0 }, { conf: 3 }, { fatigue: 13 }] },
        { weight: 1, text: `The cage is built, the spots are planned, and one of them goes wrong in rehearsal. You enter the match with a swollen wrist and a long list of reasons to be careful.`, effects: [{ booking: { who: 'rival', type: 'cage', stakes: 'title' } }, { pop: 0.5 }, { fatigue: 14 }, { injury: { part: 'arms', severity: 1, days: 10 } }] } ] },
      { id: 'delay', label: `Argue for more time to prepare properly`, risk: 'low', result: `{gm.first} grants a week and docks you a little goodwill for asking. You use the time well, and the champion who walks out is a better one than the one who walked in.`, effects: [{ fatigue: -5 }, { conf: 2 }, { pop: -0.3 }, { rel: { who: 'rival', respect: -2 } }] },
      { id: 'terms', label: `Negotiate the stipulation: no disqualification`, risk: 'med', result: `After a long argument over a short sentence, the match is signed with a clause you wrote. {rival.first} reads it twice, nods, and stops smiling at the end.`, effects: [{ booking: { who: 'rival', type: 'no_dq', stakes: 'title' } }, { rivalry: { who: 'rival', heat: 10 } }, { pop: 0.6 }, { fatigue: 8 }] },
    ],
  },
  {
    id: 'ng_chp_ward_visit', category: 'championship', title: `The Belt Goes Visiting`, weight: 1.5, contexts: ['weekly', 'offseason'], cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 12,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { holdsTitle: true, stat: { popularity: { gte: 30 } } },
    slots: { ward: [`a children's ward`, `a care home`, `a rehabilitation centre`], ask: [`in a letter written on lined paper`, `in a message left with the front office`, `in a message passed along by a nurse`] },
    body: [`{fan.name} has asked {ask} whether you would bring the title to {ward}, where a friend of the family has been unwell for a long time. The note is not dramatic, and that is why it is hard to put down. "Never missed a show," it says.`, `A visit would eat an afternoon, and an afternoon is expensive in the middle of a title run. It would also be the best use of a belt you are likely to find.`],
    choices: [
      { id: 'long', label: `Go and stay for the whole afternoon`, risk: 'low', result: `You let one patient who cannot lift the belt hold one end of it, then pose with another who insists on trying. By the time you leave your face hurts from smiling and your voice is gone.`, effects: [{ pop: 0.6 }, { conf: 4 }, { fatigue: 7 }] },
      { id: 'short', label: `Go for an hour between flights`, risk: 'low', result: `The hour is a good one and the staff are grateful, and you leave with one eye on the clock. A nurse says kindly that an hour is still an hour.`, effects: [{ pop: 0.3 }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'press', label: `Invite the press and make it a media event`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The cameras come, and the staff are good-natured about it. The coverage is generous and the visit is warm, though it leaves a small trace of unease about who it was for.`, effects: [{ pop: 0.9 }, { conf: 2 }, { fatigue: 4 }] },
        { weight: 1, text: `A columnist calls the visit a stunt, and the phrase sticks. The patients do not mind, and neither does {fan.first}, but you do.`, effects: [{ pop: -0.2 }, { conf: -3 }, { fatigue: 4 }] } ] },
      { id: 'send', label: `Send a signed photo and a donation instead`, risk: 'low', requires: { stat: { money: { gte: 500 } } }, result: `The donation is generous and the photo gets framed over a bed. It is not the same as being there, and everyone involved is too polite to say so.`, effects: [{ money: -500 }, { pop: 0.1 }, { conf: -1 }] },
    ],
  },
  {
    id: 'ng_chp_wont_challenge', category: 'championship', title: `{foe.name} Will Not Challenge You`, weight: 2, major: true, cooldownDays: 250, maxPerCareer: 2, categoryCooldown: 12,
    cast: { foe: { pick: 'tag', tag: 'reluctant' }, agent: { pick: 'staff', role: 'agent' } }, memory: { role: 'foe', max: 1 },
    trigger: { holdsTitle: true, stat: { popularity: { gte: 30 } } },
    slots: { how: [`stepping around the subject`, `leaving the room whenever your name comes up`, `joking about it with a tight smile`], plan: [`a shot at the belt`, `a number-one contender slot`, `a title match at the next big show`] },
    body: [`The office has {plan} ready for {foe.name}, and {foe.first} keeps {how}. {agent.name} reports that the answer, put politely, is no thank you.`, `A champion without a challenger looks bad, and a challenger who will not challenge looks worse. The belt on your shoulder has begun to look a little emptier than it did.`],
    choices: [
      { id: 'call_out', label: `Call {foe.first} out in public until the answer changes`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.6, confidence: 0.3 }, text: `The callout is witty, relentless and entirely public, and {foe.first} finally gives in with a scowl. The match is made with the title at stake, and the crowd smells blood.`, effects: [{ booking: { who: 'foe', type: 'singles', stakes: 'title' } }, { rivalry: { who: 'foe', heat: 10 } }, { pop: 0.8 }, { conf: 3 }] },
        { weight: 1, text: `The callout reads as bullying, and the crowd turns half against you. {foe.first} stays silent and gains sympathy by the minute.`, effects: [{ pop: -0.5 }, { conf: -3 }, { rel: { who: 'foe', respect: -3 } }] } ] },
      { id: 'private', label: `Ask {foe.first} privately what is behind the refusal`, risk: 'med', result: `Over a quiet coffee {foe.first} admits it: "Every time I walk in, it is the same locked door." The honesty is disarming, and it changes how you think about the match.`, effects: [{ rel: { who: 'foe', trust: 6, respect: 4 } }, { attr: { name: 'psychology', delta: 1 } }, { conf: 1 }, { pop: 0.1 }] },
      { id: 'other', label: `Ask {agent.first} for a different challenger`, risk: 'low', result: `A replacement is found within the day, and the card is rewritten with a shrug. The new challenger is eager, the old one is relieved, and the audience barely notices the swap.`, effects: [{ pop: 0.1 }, { conf: 1 }, { rel: { who: 'foe', respect: 2 } }] },
      { id: 'gift', label: `Offer to defend against {foe.first} on friendly terms`, risk: 'med', result: `You propose an easy ruleset, a short card and a good seat on the night, and {foe.first} agrees after a long pause. It is a soft sort of title match and everyone involved knows it.`, effects: [{ booking: { who: 'foe', type: 'singles', stakes: 'title' } }, { rel: { who: 'foe', trust: 4, heat: -4 } }, { pop: 0.3 }, { conf: -1 }] },
    ],
  },
  {
    id: 'ng_chp_locker_room_vote', category: 'championship', title: `The Locker Room Thinks You Deserve a Shot`, weight: 1.5, contexts: ['weekly', 'pre_show'], cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 12,
    cast: { vet: { pick: 'tag', tag: 'respected_by' }, gm: { pick: 'staff', role: 'gm' } }, memory: { role: 'vet', max: 1, noResults: true },
    trigger: { holdsTitle: false, stat: { popularity: { gte: 35 } } },
    slots: { how: [`a signed note left on the office desk`, `a quiet word from three veterans`, `a petition passed hand to hand in catering`], line: [`your shot is overdue`, `nobody in the building is working harder`, `the crowd is ahead of the office`] },
    body: [`{vet.name} tells you that the dressing room has been making noise on your behalf: {how}, with the message that {line}. {gm.name} has heard it, and has not yet said what it means.`, `Support from the people you work beside means more than any poll. It also puts a quiet pressure on the office, and on you, to justify it.`],
    choices: [
      { id: 'ask_gm', label: `Take the support to {gm.first} and ask for the shot`, risk: 'med', outcomes: [
        { weight: 2, bonus: { popularity: 0.4, confidence: 0.3 }, text: `{gm.first} listens, nods slowly, and says the next opening is yours. The path is clearer, and you walk out with a stronger back.`, effects: [{ promise: { kind: 'win_title', text: `I will win a championship with the locker room behind me`, deadlineDays: 150 } }, { pop: 0.6 }, { conf: 4 }] },
        { weight: 1, text: `{gm.first} thanks you politely. "The office does not run on petitions," {gm.first} adds. You leave with your pride in your hands and a new understanding of how much weight these notes carry.`, effects: [{ pop: -0.2 }, { conf: -3 }, { rel: { who: 'vet', respect: 1 } }] } ] },
      { id: 'humble', label: `Thank {vet.first}, but ask everyone to let it rest`, risk: 'low', result: `The request gets passed back down the line, and the noise subsides. The respect you earn by declining it is quieter than the other kind, and it lasts.`, effects: [{ rel: { who: 'vet', respect: 5, trust: 3 } }, { conf: 1 }, { pop: 0.1 }] },
      { id: 'promo', label: `Use the support as the centre of your next promo`, risk: 'med', result: `You say that the locker room is on your side, and the line rolls around the building like a rumour. It works as a promo and bruises a few egos in the office that did not like to be pushed.`, effects: [{ pop: 0.7 }, { conf: 3 }, { rel: { who: 'vet', trust: -2 } }] },
      { id: 'prove', label: `Ask {vet.first} to help you prepare so you can earn it`, risk: 'low', result: `The sessions run before sunrise in a gym with a sticky floor, and {vet.first} gives you notes you do not enjoy. By the end of the week you are leaner, sorer and surprisingly grateful.`, effects: [{ attr: { name: 'technical', delta: 1 } }, { rel: { who: 'vet', trust: 6, affinity: 4 } }, { fatigue: 8 }, { conf: 3 }] },
    ],
  },
  // ======================= PRESS =======================
  {
    id: 'ng_prs_planted_question', category: 'press', title: `A Question With {rival.name}'s Fingerprints`, weight: 2, contexts: ['weekly', 'post_show'], cooldownDays: 150, maxPerCareer: 4, categoryCooldown: 6,
    cast: { rival: { pick: 'rivalry', minHeat: 20, status: 'active' }, reporter: { pick: 'media', kind: 'reporter' } }, memory: { role: 'rival', max: 1, noResults: true },
    trigger: { stat: { popularity: { gte: 25 } } },
    slots: { topic: [`your conditioning`, `your loyalty to the company`, `an old injury`], tell: [`reading from an index card`, `glancing toward the back of the room`, `using a phrase you have heard {rival.them} use`] },
    body: [`The question arrives at the press table about {topic}, and it is asked by {reporter.name} while {reporter.first} is {tell}. The wording is a little too sharp to be original, and the timing is a little too perfect.`, `You can all but see {rival.name}'s handwriting on it. Answering the question means answering the person who wrote it, in front of everyone who is writing down the answer.`],
    choices: [
      { id: 'expose', label: `Point out that the question was fed to the room`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.6, confidence: 0.3 }, text: `You name no names and describe the exact shape of the thing, and the room titters. {reporter.first} goes pink, and the story becomes the question itself.`, effects: [{ pop: 0.8 }, { rivalry: { who: 'rival', heat: 8 } }, { conf: 3 }, { event: { type: 'press_conference', participants: ['reporter'], summary: `Called out a planted question at a press table.`, data: { quality: { base: 68, mic: 0.5, conf: 0.3 } } } }] },
        { weight: 1, text: `The accusation sounds paranoid and the reporter's denial sounds sincere. For a day you are the person who sees conspiracies in a pencil.`, effects: [{ pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'straight', label: `Answer it straight, as if it were a fair question`, risk: 'low', result: `"Fair question," you begin, and the calm answer takes the sting out of the room and leaves the writer of the question with nothing to enjoy. Only {rival.first} notices that the fire had to be put out by hand.`, effects: [{ pop: 0.3 }, { conf: 2 }, { rel: { who: 'rival', respect: 3 } }] },
      { id: 'throw_back', label: `Throw it back with a barb aimed at {rival.first}`, risk: 'med', result: `The line is crisp, quotable, and aimed at the empty chair that matters. By evening the exchange has been printed in four places, and the heat between you has risen a degree.`, effects: [{ rivalry: { who: 'rival', heat: 10 } }, { rel: { who: 'rival', heat: 7 } }, { pop: 0.6 }, { conf: 2 }] },
      { id: 'leave', label: `End the session politely and walk out`, risk: 'low', result: `You thank everyone and cross the room at a measured pace. The press scribbles that you were rattled, which is only partly untrue.`, effects: [{ conf: -2 }, { pop: -0.2 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'ng_prs_ally_off_script', category: 'press', title: `{ally.name} Goes Off Script`, weight: 1.5, contexts: ['weekly', 'pre_show'], cooldownDays: 200, maxPerCareer: 3, categoryCooldown: 6,
    cast: { ally: { pick: 'tag', tag: 'ally' }, reporter: { pick: 'media', kind: 'host' } }, memory: { role: 'ally', max: 1, noResults: true },
    trigger: { stat: { popularity: { gte: 25 } } },
    slots: { moment: [`vouching for you with a very long story`, `answering a question meant for you`, `cracking a joke at the host's expense`], reaction: [`The press corps loves it`, `The publicist is gripping the edge of the table`, `Nobody is quite sure whether it is helping`] },
    body: [`{ally.name} is seated next to you at the press table and has stopped following the plan: {ally.first} is {moment}. {reaction}, and {reporter.name} lets it run. "And another thing," {ally.first} says, to general alarm.`, `A friend who goes off script is a friend who is trying to help. Whether it actually does is something you will find out by reading the next morning's papers.`],
    choices: [
      { id: 'back_up', label: `Back {ally.first} up and match the energy`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `The two of you build on each other's lines like a double act. The press room laughs in all the right places, and the headline writes itself.`, effects: [{ pop: 0.8 }, { rel: { who: 'ally', affinity: 6, trust: 3 } }, { conf: 3 }] },
        { weight: 1, text: `You join in just as the joke curdles, and the room goes politely silent. The two of you share a long look and a short exit.`, effects: [{ pop: -0.3 }, { rel: { who: 'ally', affinity: 2 } }, { conf: -2 }] } ] },
      { id: 'steer', label: `Gently steer the conversation back to the plan`, risk: 'low', result: `A quiet word, a hand on the table and a pivot to the next question put the session back on its rails. {ally.first} takes the hint, and the rest of the hour is colourless and safe.`, effects: [{ pop: 0.1 }, { conf: 1 }, { rel: { who: 'ally', affinity: -2 } }] },
      { id: 'interrupt', label: `Interrupt and take over the answer yourself`, risk: 'high', result: `You cut across the ramble and give the answer yourself, and the room perks up at the reversal. {ally.first} stares at the table, and the friendship takes a bruise that will not show for days.`, effects: [{ pop: 0.4 }, { conf: 2 }, { rel: { who: 'ally', trust: -6, affinity: -5 } }] },
      { id: 'laugh', label: `Sit back and let it run, laughing with the room`, risk: 'low', result: `You become the audience at your own press conference and enjoy it. The coverage is breezy, a little thin, and strangely warm toward both of you.`, effects: [{ pop: 0.3 }, { rel: { who: 'ally', affinity: 4 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'ng_prs_is_peace_real', category: 'press', title: `Is the Peace With {friend.name} Real?`, weight: 2, contexts: ['weekly', 'post_show'], cooldownDays: 250, maxPerCareer: 2, categoryCooldown: 6,
    cast: { friend: { pick: 'tag', tag: 'reconciled' }, reporter: { pick: 'media', kind: 'journalist' } }, memory: { role: 'friend', max: 1 },
    trigger: { stat: { popularity: { gte: 25 } } },
    slots: { framing: [`a publicity stunt`, `a truce that cannot last`, `the kind of friendship that always hides a knife`], setting: [`after a show`, `at a charity event`, `in the corridor outside the press room`] },
    body: [`{reporter.name} stops you {setting} with the theory that the peace between you and {friend.name} is {framing}. "Is it real?" {reporter.first} asks, pen already moving. The theory is tidy, cynical and printed in advance of your answer.`, `The truth is more complicated, and complicated does not fit in a headline. How you respond will be taken as a statement about both of you.`],
    choices: [
      { id: 'defend', label: `Defend the friendship and mean every word`, risk: 'low', result: `You speak plainly about what changed and why, and the reporter writes it down with surprise. The piece that runs is gentler than the one planned, and {friend.first} sends a thumbs-up by courier.`, effects: [{ rel: { who: 'friend', trust: 6, affinity: 5 } }, { pop: 0.4 }, { conf: 2 }] },
      { id: 'tease', label: `Play along and hint that it might all be a trick`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, mic: 0.3 }, text: `The hint turns the story into a mystery, and fans argue about it for weeks. {friend.first} plays along with a perfectly straight face.`, effects: [{ pop: 0.8 }, { rel: { who: 'friend', trust: -1, affinity: 2 } }, { conf: 2 }] },
        { weight: 1, text: `The hint is taken literally, and {friend.first} reads the quote with a hurt look. It takes a conversation and an apology to put things right.`, effects: [{ rel: { who: 'friend', trust: -6, affinity: -3 } }, { pop: 0.1 }, { conf: -2 }] } ] },
      { id: 'private', label: `Say it is private and refuse to discuss it`, risk: 'low', result: `The refusal is firm and a little frosty, and the reporter writes a paragraph about it anyway. {friend.first} appreciates the privacy and has the grace not to say so.`, effects: [{ rel: { who: 'friend', trust: 2 } }, { pop: -0.1 }, { conf: 1 }] },
      { id: 'invite', label: `Invite the reporter to a training session`, risk: 'med', result: `The reporter turns up with a notebook and leaves with blisters from a ring rope. The resulting profile is fair and funny, and it makes both of you look like people.`, effects: [{ pop: 0.5 }, { rel: { who: 'friend', trust: 3, affinity: 3 } }, { fatigue: 5 }, { conf: 1 }] },
    ],
  },
  {
    id: 'ng_prs_lost_in_translation', category: 'press', title: `Lost in Translation`, weight: 1.5, contexts: ['weekly', 'pre_show'], cooldownDays: 250, maxPerCareer: 2, categoryCooldown: 6,
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { minYear: 1990, stat: { popularity: { gte: 40 }, careerYears: { gte: 3 } } },
    slots: { mistake: [`a claim that you are a retired champion`, `a promise to eat a championship belt`, `a heartfelt thank-you to your opponent's mother`], crowd: [`a hall full of local fans`, `a row of television cameras`, `a pack of visiting reporters`] },
    body: [`The tour stop has a translator, who is doing a fine job until it is not. {reporter.name} winces as the interpreter delivers a line to {crowd} that comes out as {mistake}.`, `Everything you said was fine, and nothing you said is what the room just heard. You have about ten seconds to decide whether to correct it, enjoy it or ride it.`],
    choices: [
      { id: 'correct', label: `Stop and correct the translation with a smile`, risk: 'low', result: `You fix it kindly. "Thank you," the interpreter whispers, blushing, and the crowd applauds both of you. It is safe, professional and a little dull.`, effects: [{ pop: 0.2 }, { conf: 2 }] },
      { id: 'run_with', label: `Lean into the mistake and make it the new line`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.6 }, text: `You repeat the mistranslation word for word with total sincerity, and the room explodes. By the end of the week fans in three cities are chanting it back.`, effects: [{ pop: 0.9 }, { conf: 3 }] },
        { weight: 1, text: `The joke needed one more second of build, and now it sounds like you are mocking the translator. A news crew catches the end of it.`, effects: [{ pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'thank_translator', label: `Thank the translator and ask for the mistake to stand`, risk: 'low', result: `The interpreter looks near tears with relief and delivers the rest with a calm, steady voice. The gesture earns you quiet respect from the crew, who know how rarely it is offered.`, effects: [{ pop: 0.3 }, { conf: 2 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'skip', label: `Talk through it and hope no one remembers`, risk: 'high', result: `The next ten minutes limp by with a cloud over every sentence. The mistake is repeated so often in the coverage that it sticks to your name like a burr.`, effects: [{ pop: -0.4 }, { conf: -2 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'ng_prs_mic_dies', category: 'press', title: `The Microphone Dies Mid-Answer`, weight: 2, contexts: ['weekly', 'pre_show'], cooldownDays: 200, maxPerCareer: 3, categoryCooldown: 6,
    cast: { rival: { pick: 'rivalry', minHeat: 15, status: 'active' } }, memory: { role: 'rival', max: 1, noResults: true },
    trigger: { stat: { popularity: { gte: 25 } } },
    slots: { failure: [`the microphone cuts out on your best line`, `the sound system erupts into feedback`, `the microphone stand slowly folds in half`], jab: [`leans across and repeats it louder in a mocking voice`, `offers a spare with exaggerated courtesy`, `laughs into the silence`] },
    body: [`The press conference is going well until {failure}. {rival.name}, seated on the next chair, {jab}.`, `The room is watching you as much as the broken equipment. A small accident can swallow a big moment, and a clever person can swallow the accident.`],
    choices: [
      { id: 'project', label: `Ditch the mic and project to the back of the room`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.6, confidence: 0.3 }, text: `You stand and deliver the line with your bare voice, and every syllable lands. The room breaks into applause, and {rival.first} sits back with a faint nod.`, effects: [{ pop: 0.8 }, { conf: 4 }, { rel: { who: 'rival', respect: 3 } }] },
        { weight: 1, text: `Your voice cracks halfway and the back rows cannot hear a word. The only person who looks satisfied is {rival.first}.`, effects: [{ pop: -0.3 }, { conf: -3 }, { rel: { who: 'rival', heat: 3 } }] } ] },
      { id: 'laugh', label: `Laugh with the room and take {rival.first}'s jab on the chin`, risk: 'low', result: `The shared laugh takes the pressure off, and for thirty seconds you and {rival.first} look like colleagues. The session moves on a little lighter, and neither of you mentions it.`, effects: [{ rel: { who: 'rival', heat: -4, respect: 2 } }, { pop: 0.3 }, { conf: 1 }] },
      { id: 'snap', label: `Snap at {rival.first} and blame the sabotage`, risk: 'high', result: `"You did this!" you snap, loudly. The accusation is accurate in tone and hopeless as evidence. The room is split, security is amused, and the tension between you crackles to a new height.`, effects: [{ rivalry: { who: 'rival', heat: 12 } }, { rel: { who: 'rival', heat: 9 } }, { pop: 0.4 }, { conf: -1 }] },
      { id: 'adjourn', label: `Call a five-minute break and fix it quietly`, risk: 'low', result: `A technician swaps the equipment while you sip water and take stock. The resumed session is calmer, safer and stripped of its one good line.`, effects: [{ conf: 1 }, { fatigue: -2 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'ng_prs_the_numbers', category: 'press', title: `The Numbers Against {rival.name}`, weight: 2, contexts: ['weekly', 'post_show'], cooldownDays: 250, maxPerCareer: 3, categoryCooldown: 6,
    cast: { rival: { pick: 'rivalry', minHeat: 10, status: 'active' }, reporter: { pick: 'media', kind: 'journalist' } }, memory: { role: 'rival', max: 1 },
    trigger: { stat: { popularity: { gte: 25 } }, mem: [{ role: 'rival', h2h: { winsGte: 3 } }] },
    slots: { delivery: [`reads them aloud from a laminated sheet`, `slides a printed chart across the table`, `has them inked on the back of a hand`], follow: [`asks whether there is anything left to prove`, `wonders if the feud is simply over`, `suggests that nobody is asking who is better any more`] },
    body: [`{reporter.name} has done the arithmetic on your history with {rival.name}, and {delivery}. The numbers lean in your direction, and the follow-up question {follow}.`, `It is the sort of question that sounds like a compliment and works like a trap. If you agree, the feud ends; if you disagree, the numbers start to sound like a boast.`],
    choices: [
      { id: 'finish', label: `Say the feud is over and the numbers say so`, risk: 'med', result: `The line closes the chapter in print and costs you the best rivalry of the year. The crowd gets a conclusion, and you get a long Monday with nothing to aim at.`, effects: [{ rivalry: { who: 'rival', heat: -12 } }, { pop: 0.3 }, { conf: 3 }, { rel: { who: 'rival', respect: -3 } }] },
      { id: 'respect', label: `Credit {rival.first} and say the numbers hide the closeness`, risk: 'low', result: `You talk about specific moments, a scrape here and a near fall there, and the interview feels like a farewell for a rivalry that is not dead. {rival.first} reads it and sends a one-line reply that says, simply, "True."`, effects: [{ rel: { who: 'rival', respect: 7, trust: 3, heat: -5 } }, { pop: 0.3 }, { conf: 1 }] },
      { id: 'fresh', label: `Insist it is not over and ask for another match`, risk: 'med', result: `You say the numbers prove only that you have not been finished, and the crowd cheers the defiance. The office books another meeting before the week ends.`, effects: [{ booking: { who: 'rival', type: 'singles' } }, { rivalry: { who: 'rival', heat: 6 } }, { pop: 0.5 }, { fatigue: 5 }] },
      { id: 'dismiss', label: `Dismiss the numbers as ancient history`, risk: 'low', result: `The reporter looks disappointed, and the shrug costs you a sharp quote you could have owned. It is polite, forgettable and a little too modest for the room.`, effects: [{ conf: 1 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'ng_prs_predictable', category: 'press', title: `{foe.name} Says You Are Predictable`, weight: 2, contexts: ['weekly', 'post_show'], cooldownDays: 250, maxPerCareer: 3, categoryCooldown: 6,
    cast: { foe: { pick: 'tag', tag: 'studying_you' }, reporter: { pick: 'media', kind: 'interviewer' } }, memory: { role: 'foe', max: 1 },
    trigger: { stat: { popularity: { gte: 25 } } },
    slots: { quote: [`you could be beaten by anyone with a stopwatch`, `your finishing stretch is as regular as a clock`, `you telegraph your best move in the second minute`], setting: [`in a pre-show interview`, `on a radio call-in`, `in a magazine profile`] },
    body: [`{foe.name} told {reporter.name} {setting} that {quote}. {reporter.first} reads it back to you with the glee of a person delivering a sealed letter.`, `It stings because it is specific, and it is specific because {foe.first} has spent real time in your corner of the film room. The question is whether to deny it, adjust to it or sell it.`],
    choices: [
      { id: 'adjust', label: `Say nothing and quietly change the pattern`, risk: 'med', result: `The next three matches contain three surprises, and the studio notes that something has changed. {foe.first} reads the shift like a tell and starts a new notebook.`, effects: [{ attr: { name: 'technical', delta: 1 } }, { fatigue: 6 }, { conf: 2 }, { pop: 0.2 }] },
      { id: 'lean_in', label: `Agree publicly and dare {foe.first} to stop it`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.5, confidence: 0.4 }, text: `Admitting the weakness takes the weapon out of {foe.first}'s hand, and the crowd goes wild at the confidence. In the ring you hit the pattern and it works anyway.`, effects: [{ pop: 0.9 }, { conf: 4 }, { rel: { who: 'foe', respect: 2, fear: 3 } }] },
        { weight: 1, text: `Dare accepted, plan executed. {foe.first} stops your pattern dead and the press room finds the video, which it plays on a loop.`, effects: [{ pop: -0.5 }, { conf: -4 }, { fatigue: 4 }] } ] },
      { id: 'deny', label: `Deny it flatly and call it the words of a jealous person`, risk: 'med', result: `The denial gets a laugh, a quote and a mild frown from a producer who has seen the numbers. It is a good answer and an incomplete one.`, effects: [{ pop: 0.4 }, { rel: { who: 'foe', heat: 5 } }, { conf: 1 }] },
      { id: 'ask_notes', label: `Thank {foe.first} for the free scouting report`, risk: 'low', result: `The line is dry and pleasant and puts the pressure back on the other side. "That was not a gift," {foe.first} calls to say. It was taken as one anyway.`, effects: [{ rel: { who: 'foe', respect: 3, heat: -3 } }, { pop: 0.3 }, { conf: 2 }] },
    ],
  },
  {
    id: 'ng_prs_hold_the_story', category: 'press', title: `Asked to Hold a Story`, weight: 1.5, contexts: ['weekly', 'pre_show'], cooldownDays: 250, maxPerCareer: 3, categoryCooldown: 6,
    cast: { exec: { pick: 'staff', role: 'executive' }, reporter: { pick: 'media', kind: 'journalist' } },
    trigger: { stat: { popularity: { gte: 30 }, careerYears: { gte: 2 } } },
    slots: { news: [`a roster shake-up`, `a change at the top of the card`, `a surprise return`], hold: [`until the end of the week`, `until the show goes to air`, `until the office says otherwise`] },
    body: [`{exec.name} has told you about {news} and asked you not to repeat it {hold}. "Not a word," {exec.first} said. Ten minutes later {reporter.name} collars you in a hallway with a notebook and a look that says the story is already half written.`, `Trust runs in both directions in this business. The office gave you a secret as a courtesy, and the reporter has given you a courtesy of a different sort.`],
    choices: [
      { id: 'silent', label: `Keep the secret and say nothing`, risk: 'low', result: `You smile and offer a bland sentence about the catering. {exec.first} hears about it by lunchtime and looks at you with the quiet approval of a person with a long memory.`, effects: [{ conf: 1 }, { pop: -0.1 }, { fatigue: 1 }] },
      { id: 'hint', label: `Drop a hint without confirming anything`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, mic: 0.3 }, text: `Your careful half-sentence gives the reporter enough to frame and nothing to quote. Everyone is happy, and nobody in the office can complain.`, effects: [{ pop: 0.4 }, { conf: 2 }] },
        { weight: 1, text: `The hint is clearer than you meant, and the story runs with a confirmation you never gave. {exec.first} summons you to a short, stiff meeting.`, effects: [{ pop: 0.2 }, { conf: -3 }, { fatigue: 2 }] } ] },
      { id: 'leak', label: `Give the reporter the story in exchange for a favour`, risk: 'high', result: `The exclusive runs under a flattering byline and the favour comes back in the form of a front-page profile. The office works out who talked within the day, and the trust is over.`, effects: [{ pop: 0.6 }, { conf: -2 }, { money: 300 }] },
      { id: 'tell_exec', label: `Tell {exec.first} the reporter is already onto it`, risk: 'low', result: `{exec.first} is grateful and slightly alarmed, and the office changes the plan within the hour. You are rewarded with a favour you were not expecting.`, effects: [{ conf: 2 }, { money: 200 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'ng_prs_cheap_seats', category: 'press', title: `Questions From the Cheap Seats`, weight: 1.5, contexts: ['weekly', 'show_day', 'post_show'], cooldownDays: 200, maxPerCareer: 3, categoryCooldown: 6,
    cast: { fan: { pick: 'media', kind: 'fan' }, host: { pick: 'media', kind: 'host' } },
    trigger: { stat: { popularity: { gte: 20 } } },
    slots: { question: [`"Who would you never team with?"`, `"What do you eat before a match?"`, `"What are you afraid of in the ring?"`], format: [`a fan Q&A before the show`, `a radio phone-in with a live audience`, `a meet-and-greet in a mall atrium`] },
    body: [`{host.name} has put the fans in charge for a while in {format}, and the first question comes from {fan.name}: {question}. There is no script, no safe answer and no producer waiting to cut you off.`, `Fans ask the things journalists are too polite to. The answers are small and personal, and they travel further than any prepared statement.`],
    choices: [
      { id: 'truth', label: `Answer with total honesty, whatever it costs`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.3 }, text: `The truth is surprising, a little funny and extremely human, and the crowd rewards it with a hush and then a roar. {fan.first} keeps the moment on a shelf for years.`, effects: [{ pop: 0.7 }, { conf: 3 }] },
        { weight: 1, text: `The honest answer lands somewhere between touching and awkward, and the clip you did not know was being recorded circulates for a week. You hear about it from three relatives.`, effects: [{ pop: 0.1 }, { conf: -2 }] } ] },
      { id: 'joke', label: `Turn the question into a joke and play to the room`, risk: 'low', result: `The joke is polished and warm, and the room laughs where you hoped. {fan.first} laughs hardest, though a flicker of disappointment passes over {fan.their} face.`, effects: [{ pop: 0.4 }, { conf: 1 }] },
      { id: 'ask_back', label: `Hand the question back and ask {fan.first} to answer it`, risk: 'low', result: `{fan.first} answers with surprising seriousness, and the discussion becomes a conversation with a hundred people in it. It is a gentle, odd, excellent twenty minutes.`, effects: [{ pop: 0.5 }, { attr: { name: 'psychology', delta: 1 } }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'dodge', label: `Dodge the question and move to a safer one`, risk: 'low', result: `The pivot is smooth and the crowd is polite, but {fan.first} looks deflated. Nobody remembers the second question, and the first one stays unanswered.`, effects: [{ pop: -0.2 }, { conf: 1 }] },
    ],
  },
];
