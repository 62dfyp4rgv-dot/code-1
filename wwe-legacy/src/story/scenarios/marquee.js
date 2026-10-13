// Marquee scenarios: Royal Rumble, WrestleMania, championship, career-defining opportunities and creative disputes.
export default [
  // ============================================================ ROYAL RUMBLE
  {
    id: 'rmb_draw_number', category: 'rumble', title: `You Draw {draw}`, weight: 3, major: true, cooldownDays: 300, maxPerCareer: 4, categoryCooldown: 10,
    cast: { boss: { pick: 'staff', role: 'producer' } },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 14 }, stat: { popularity: { gte: 20 } } },
    slots: { draw: [`number 1, the loneliest walk in the match`, `number 6, early enough to hurt`, `number 18, dead centre of the pack`, `number 29, the late arrival`], tip: [`"Don't gas out in the first ten minutes."`, `"Everybody will be hunting the big names. Let them."`, `"The camera loves whoever is still standing at the end, not whoever starts the fight."`] },
    body: [`{boss.name} reads the order of entry off a clipboard and stops at your name: {draw}. Around the table the veterans trade looks, because every number carries its own kind of trouble.`, `"Your call on how to work it," {boss.first} says, tapping the page. {tip}`],
    choices: [
      { id: 'pace', label: `Pace yourself and survive to the final ten`, risk: 'low', outcomes: [
        { weight: 3, bonus: { overall: 0.5 }, text: `You save your legs, duck the big collisions and reappear whenever the ring thins out. By the final ten you are one of the few still fresh, and {boss.first} notices.`, effects: [{ pop: 0.6 }, { conf: 3 }, { fatigue: 8 }] },
        { weight: 2, text: `You hide so well that the broadcast forgets you for twenty minutes. You last long, but nobody remembers how.`, effects: [{ pop: 0.1 }, { fatigue: 8 }] } ] },
      { id: 'hunt', label: `Hunt eliminations from the first bell`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.6 }, text: `You throw bodies over the top rope in bunches and the crowd counts along with every one. It costs you plenty, but the highlight reel is yours.`, effects: [{ pop: 1.0 }, { conf: 4 }, { fatigue: 18 }] },
        { weight: 2, text: `You burn yourself out by the halfway mark and get tossed by someone who was waiting for exactly that.`, effects: [{ pop: 0.1 }, { conf: -3 }, { fatigue: 20 }] } ] },
      { id: 'moment', label: `Ask {boss.first} to build a signature moment for you`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.6 }, text: `{boss.first} blocks out a spot where you steal a pinfall-style near elimination from a star. The arena erupts and you walk out of the match a name.`, effects: [{ pop: 1.2 }, { conf: 3 }, { fatigue: 12 }, { event: { type: 'decision', participants: [], summary: `Fought for a signature moment in the Royal Rumble.`, data: {} } }] },
        { weight: 1, text: `The spot is cut for time. You are left to improvise in the ring, and it shows.`, effects: [{ pop: -0.2 }, { conf: -3 }, { fatigue: 10 }] } ] },
      { id: 'trade', label: `Plead with {boss.first} to trade your number`, risk: 'low', result: `{boss.first} sighs and shuffles a few slips. You get a better number, and a reputation for being precious about details.`, effects: [{ conf: 2 }, { pop: -0.3 }, { money: -1500 }] },
    ],
  },
  {
    id: 'rmb_guarantee_win', category: 'rumble', title: `The Question at {venue}`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 15, contexts: ['weekly', 'post_show'],
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 45 }, stat: { popularity: { gte: 35 } }, promise: 'none' },
    slots: { venue: [`a press scrum`, `a radio studio`, `the merch table`, `a crowded corridor`], angle: [`the only man or woman worth betting on`, `an underdog the office keeps overlooking`, `a name nobody wants to draw`] },
    body: [`In {venue}, {reporter.name} asks the question every contender dreads. "The Rumble is coming. Does anyone in that locker room scare you, and would you put your name on the winner's list?"`, `The recorder is already pointed at you. You are being sold as {angle}, and anything you say now will be played back to you in February.`],
    choices: [
      { id: 'guarantee', label: `Guarantee that you will win and head to WrestleMania`, risk: 'high', result: `You say it flat, no hedging. The clip travels fast and the fans love the audacity. Now you have to deliver.`, effects: [{ promise: { kind: 'win_title', text: `I will win the Royal Rumble and earn my shot at the world title`, deadlineDays: 120 } }, { pop: 1.2 }, { conf: 4 }, { event: { type: 'press_conference', participants: ['reporter'], summary: `Guaranteed a Royal Rumble win.`, data: { quality: { base: 66, mic: 0.5, charisma: 0.3, conf: 0.2 }, viral: { minQuality: 75, chance: 0.45 } } } }] },
      { id: 'hedge', label: `Promise to fight harder than anyone in the match`, risk: 'low', result: `You give a measured answer about effort and respect. It reads as professional, if forgettable.`, effects: [{ pop: 0.2 }, { conf: 1 }, { event: { type: 'interview', participants: ['reporter'], summary: `Played it safe ahead of the Royal Rumble.`, data: { quality: { base: 55, mic: 0.3 } } } }] },
      { id: 'tease', label: `Tease a surprise and refuse to name a winner`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.6 }, text: `You smile and say you are already in the building in your head. The speculation does your marketing for the next week.`, effects: [{ pop: 0.7 }, { conf: 2 }] },
        { weight: 1, text: `It reads as dodging and {reporter.first} writes it that way.`, effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
      { id: 'dismiss', label: `Dismiss the Rumble as a lottery and talk titles only`, risk: 'med', result: `You call the match a crapshoot and say real contenders earn it elsewhere. Some fans nod. Others take it as ducking the spotlight.`, effects: [{ pop: -0.2 }, { conf: 3 }] },
    ],
  },
  {
    id: 'rmb_ally_pact', category: 'rumble', title: `{ally.name} Wants a Pact`, weight: 2, major: true, cooldownDays: 240, maxPerCareer: 3, categoryCooldown: 10,
    cast: { ally: { pick: 'roster', tier: { gte: 1, lte: 3 }, sameBrand: true } },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 10 }, stat: { popularity: { gte: 20 } } },
    slots: { place: [`the trainer's room`, `a quiet stairwell`, `the back of the bus`], pitch: [`stay on the same side of the ring until the last four`, `swap eliminations so neither of you goes out cheap`, `help each other over the top rope when the crowd is hot`] },
    body: [`{ally.name} catches you alone in {place} and speaks low. "Everyone in that match is going to double-cross somebody," {ally.they} says. "Let us not be the ones who get surprised."`, `The offer is simple: {pitch}. It sounds fine until you remember there can only be one winner.`],
    choices: [
      { id: 'shake', label: `Shake on it and keep your word`, risk: 'med', result: `You agree and mean it. {ally.first} nods like a weight just came off {ally.their} shoulders.`, effects: [{ event: { type: 'alliance_formed', participants: ['ally'], summary: `Made a Royal Rumble pact with {ally.name}.`, data: {} } }, { rel: { who: 'ally', trust: 10, respect: 4 } }, { conf: 2 }, { pop: -0.1 }] },
      { id: 'false_hand', label: `Agree, planning to break it at the right moment`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `The double-cross lands perfectly on the night, a gasp from the crowd as {ally.name} hits the floor. It is a ruthless spot, and {ally.they} will never forget it.`, effects: [{ rel: { who: 'ally', trust: -25, heat: 25 } }, { rivalry: { who: 'ally', heat: 20 } }, { pop: 0.8 }, { event: { type: 'betrayal', participants: ['ally'], summary: `Broke a Royal Rumble pact with {ally.name}.`, data: {} } }] },
        { weight: 1, text: `{ally.first} sees it coming and eliminates you first. Both of you look foolish.`, effects: [{ rel: { who: 'ally', heat: 15, respect: -4 } }, { pop: -0.4 }, { conf: -4 }] } ] },
      { id: 'counter', label: `Counter-offer: help each other until the final six only`, risk: 'low', result: `A realistic deal, and {ally.first} respects the honesty. Neither of you owes the other a win.`, effects: [{ rel: { who: 'ally', trust: 4, respect: 6 } }, { conf: 1 }] },
      { id: 'solo', label: `Decline, since you work this one alone`, risk: 'low', result: `{ally.first} shrugs, a little hurt. You keep your hands free and your conscience clear.`, effects: [{ rel: { who: 'ally', trust: -3, respect: 2 } }, { conf: 3 }] },
    ],
  },
  {
    id: 'rmb_rival_target', category: 'rumble', title: `{rival.name} Has Marked Your Name`, weight: 3, major: true, cooldownDays: 240, maxPerCareer: 3, categoryCooldown: 10, memory: { role: 'rival', max: 1 },
    cast: { rival: { pick: 'rivalry', minHeat: 20, status: 'active' } },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 10 } },
    slots: { where: [`at the Rumble press call`, `in the line for catering`, `outside the hotel elevator`], threat: [`first man or woman through the ropes`, `anyone who stands between me and the win`, `the one who embarrassed me`] },
    body: [`{rival.name} walks up {where} with a grin that is mostly teeth. "I do not care what number I draw. Come the Rumble, you are the {threat}."`, `It might be a mind game. It might be a plan with a script behind it. Either way, the other contenders are listening.`],
    choices: [
      { id: 'meet', label: `Promise to meet {rival.them} head on in the ring`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: `You hold the stare and tell {rival.first} the queue starts at your feet. The crowd around you buzzes. It is a feud that will have to be settled in the ring.`, effects: [{ rivalry: { who: 'rival', heat: 12 } }, { rel: { who: 'rival', respect: 4, heat: 6 } }, { pop: 0.7 }, { conf: 3 }] },
        { weight: 1, text: `{rival.first} gets the better of the exchange and half the room laughs at your answer.`, effects: [{ rel: { who: 'rival', respect: -2 } }, { pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'avoid', label: `Plan to keep as far from {rival.them} as possible`, risk: 'low', result: `You decide to fight smart, not proud. It might save your night. It also confirms to everyone that {rival.first} gets under your skin.`, effects: [{ rel: { who: 'rival', respect: -3 } }, { conf: -2 }, { fatigue: -6 }] },
      { id: 'set_up', label: `Set a trap: tell {rival.first} the wrong entry number`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{rival.first} spends the build-up preparing for a number you do not have. The mind game cracks the fury right out of {rival.them}.`, effects: [{ rel: { who: 'rival', trust: -8, heat: 4 } }, { pop: 0.5 }, { conf: 4 }] },
        { weight: 1, text: `The lie gets back to {rival.first} before the show. {rival.they} treats it as a public insult.`, effects: [{ rivalry: { who: 'rival', heat: 18 } }, { rel: { who: 'rival', heat: 15 } }, { conf: -2 }] } ] },
      { id: 'recruit', label: `Pull in other contenders to wall {rival.them} out`, risk: 'med', result: `By the end of the day you have a few men and women who owe you a favour and one who now owes you an explanation. Politics is part of the game.`, effects: [{ rel: { who: 'rival', heat: 8 } }, { pop: 0.2 }, { fatigue: 4 }, { money: -2000 }] },
    ],
  },
  {
    id: 'rmb_legend_surprise', category: 'rumble', title: `A Legend in the Building`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 10, contexts: ['pre_show', 'show_day'],
    cast: { legend: { pick: 'roster', tier: { gte: 4 } }, boss: { pick: 'staff', role: 'gm' } },
    trigger: { minYear: 1988, event: 'royal_rumble', stat: { popularity: { gte: 25 } } },
    slots: { hush: [`behind a locked door`, `in a loading dock`, `in a darkened wardrobe room`], plan: [`stalk down the aisle in a surprise return`, `appear as the last entrant`, `spoil the final two with a late, shocking hit`] },
    body: [`{boss.name} pulls you {hush}, voice low. A retired icon, {legend.name}, has agreed to come back for one night, and the plan is for {legend.them} to {plan}.`, `"The thing is," {boss.first} says, "the angle only works if somebody makes {legend.them} look dangerous. The office thinks you can be that person."`],
    choices: [
      { id: 'sell', label: `Sell it big, taking the legend's signature move`, risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.5 }, text: `You bounce off the ropes like you have been shot. The crowd erupts and cameras find you. A legend remembers who made the night.`, effects: [{ rel: { who: 'legend', respect: 12, affinity: 6 } }, { pop: 0.9 }, { conf: 1 }, { fatigue: 5 }] },
        { weight: 1, text: `The spot is mistimed and you eat the move for real. The fans pop anyway.`, effects: [{ rel: { who: 'legend', respect: 6 } }, { pop: 0.5 }, { fatigue: 12 }, { injury: { part: 'torso', severity: 1, days: 10 } }] } ] },
      { id: 'protect', label: `Ask the agents to protect your standing`, risk: 'low', result: `The agents shave a few seconds off the spot and give you a face-saving finish. The moment is smaller, but your name is intact.`, effects: [{ pop: 0.2 }, { conf: 2 }, { rel: { who: 'legend', respect: -4 } }] },
      { id: 'outshine', label: `Pitch a bigger moment where you nearly beat {legend.them}`, risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.2, charisma: 0.6 }, text: `You nearly beat {legend.first} out of the building. The pop is enormous, and the legend nods at you with something close to approval.`, effects: [{ pop: 1.4 }, { conf: 5 }, { rel: { who: 'legend', respect: 8 } }] },
        { weight: 2, text: `{legend.first} bristles at the idea, and the office tells you to stick to the plan. You earn a lecture on seniority.`, effects: [{ rel: { who: 'legend', respect: -10, heat: 8 } }, { conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'tip_off', label: `Keep your mouth shut and say nothing to anyone`, risk: 'low', result: `You carry the secret through the afternoon without a slip. Nobody thanks you, but nobody notices you either.`, effects: [{ conf: 1 }, { rel: { who: 'legend', trust: 4 } }] },
    ],
  },
  {
    id: 'rmb_dream_finish', category: 'rumble', title: `Booked for the Final Two`, weight: 2, major: true, cooldownDays: 300, maxPerCareer: 3, categoryCooldown: 10, contexts: ['weekly', 'pre_show'],
    cast: { creative: { pick: 'staff', role: 'creative' }, winner: { pick: 'roster', tier: { gte: 3 } } },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 7 }, stat: { popularity: { gte: 40 } } },
    slots: { how: [`a clean over-the-top toss`, `a last-second counter that sends you over`, `a double-cross spot that leaves you hanging`], room: [`the writers' room`, `a rented conference room`, `the production truck`] },
    body: [`In {room}, {creative.name} slides a diagram across the table. You make the final two of the Rumble; {winner.name} goes over {how}.`, `It is a good spot and a huge platform. It is also a loss, on one of the biggest shows of the year.`],
    choices: [
      { id: 'accept', label: `Accept the finish and sell it for the winner`, risk: 'low', result: `You take your place in the picture and work it perfectly. {winner.first} remembers the effort, and the camera loves your reaction.`, effects: [{ rel: { who: 'winner', respect: 8, trust: 4 } }, { pop: 0.7 }, { conf: -1 }, { fatigue: 8 }] },
      { id: 'lobby', label: `Lobby to be the one standing at the end`, risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.4, mic: 0.5 }, text: `You make a persuasive case for the story of a new star. {creative.first} agrees to think about it. The finish is rewritten at the last minute.`, effects: [{ promise: { kind: 'win_title', text: `I will win a championship`, deadlineDays: 150 } }, { pop: 1.2 }, { conf: 5 }, { rel: { who: 'winner', respect: -6 } }] },
        { weight: 3, text: `Nobody wants to reopen the plan. You leave with a reputation for asking for too much.`, effects: [{ pop: -0.4 }, { conf: -4 }, { rel: { who: 'winner', respect: -3 } }] } ] },
      { id: 'tradeoff', label: `Accept in exchange for a title match to follow`, risk: 'med', result: `{creative.first} grimaces, then jots a note: a championship opportunity after the Rumble. It is written down, which is more than most get.`, effects: [{ pop: 0.5 }, { conf: 2 }, { money: 2500 }, { rel: { who: 'winner', respect: 4 } }] },
      { id: 'refuse', label: `Refuse to lose on that stage`, risk: 'high', result: `The meeting goes silent. {creative.first} puts the diagram away. You are going to be a very small part of the Rumble now.`, effects: [{ pop: -0.6 }, { conf: 4 }, { rel: { who: 'winner', respect: -4, heat: 8 } }] },
    ],
  },
  {
    id: 'rmb_rookie_advice', category: 'rumble', title: `A Rookie Asks for Rumble Advice`, weight: 2, major: true, cooldownDays: 300, maxPerCareer: 3, categoryCooldown: 10, contexts: ['weekly', 'pre_show'],
    cast: { rookie: { pick: 'roster', tier: { lte: 1 }, sameBrand: true } },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 7 }, stat: { popularity: { gte: 25 }, careerYears: { gte: 1.5 } } },
    slots: { mood: [`white-faced with nerves`, `grinning too hard`, `quietly intense`], fear: [`getting hurt in front of that crowd`, `being eliminated in the first minute`, `blowing the one big shot a career gets`] },
    body: [`{rookie.name} is waiting outside your locker room, {mood}. This is {rookie.their} first Rumble. "I keep thinking about {fear}," {rookie.they} admits. "You have done this. Can you help me?"`, `You have a free afternoon and a reputation to protect. There is a lot of advice to give, and not all of it is kind.`],
    choices: [
      { id: 'teach', label: `Give the afternoon and teach everything you know`, risk: 'low', result: `You walk through ring awareness, eliminations and what to do when the ropes sag. {rookie.first} leaves steadier, and a few veterans see you doing it.`, effects: [{ event: { type: 'mentorship', participants: ['rookie'], summary: `Coached {rookie.name} before a Royal Rumble.`, data: { byPlayer: true } } }, { rel: { who: 'rookie', trust: 12, respect: 10, affinity: 8 } }, { fatigue: 10 }, { conf: 2 }] },
      { id: 'short', label: `Offer five minutes and a warning to stay low-key`, risk: 'low', result: `You hand over a few honest rules and leave it there. It is practical, if not warm.`, effects: [{ rel: { who: 'rookie', respect: 3, trust: 2 } }, { conf: 1 }] },
      { id: 'rival_trick', label: `Offer advice that sets them up to fail`, risk: 'high', outcomes: [
        { weight: 2, text: `{rookie.first} follows your advice and is eliminated within two minutes. Nobody ever finds out why, and you quietly cut a future rival down.`, effects: [{ rel: { who: 'rookie', trust: 2 } }, { conf: 2 }, { pop: -0.1 }] },
        { weight: 1, text: `A veteran overheard the lesson and tells half the locker room. You are suddenly known as the person who sabotages first-timers.`, effects: [{ rel: { who: 'rookie', trust: -20, heat: 15, respect: -12 } }, { pop: -0.8 }, { conf: -5 }, { event: { type: 'betrayal', participants: ['rookie'], summary: `Sabotaged {rookie.name} before the Royal Rumble.`, data: {} } }] } ] },
      { id: 'pass', label: `Decline: you need to focus on your own night`, risk: 'low', result: `You tell {rookie.first} you have your own match to prepare for, and mean it. {rookie.they} thanks you politely and leaves.`, effects: [{ rel: { who: 'rookie', respect: -2 } }, { conf: 2 }, { fatigue: -4 }] },
    ],
  },
  {
    id: 'rmb_exit_plan', category: 'rumble', title: `Planning Your Exit From the Ring`, weight: 2, major: true, cooldownDays: 300, maxPerCareer: 3, categoryCooldown: 6, contexts: ['pre_show', 'show_day'],
    cast: { eliminator: { pick: 'roster', tier: { gte: 1, lte: 3 } }, boss: { pick: 'staff', role: 'producer' } },
    trigger: { minYear: 1988, event: 'royal_rumble', stat: { popularity: { gte: 20 } } },
    slots: { sting: [`a blindside kick from the apron`, `a shoulder through the middle rope`, `a quick lift from behind`], aftermath: [`the ramp`, `the floor beside the barricade`, `the stairs to the locker rooms`] },
    body: [`{boss.name} runs through the part of the Rumble nobody likes to rehearse: how you leave. If it ends for you on the outside, {eliminator.name} is lined up to finish it with {sting}, and the camera will be on you the whole way to {aftermath}.`, `"Everyone gets thrown out except one person," {boss.first} says. "What the audience remembers is what you do in the next ten seconds."`],
    choices: [
      { id: 'storm_back', label: `Plan to storm back and attack the eliminator`, risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.4, confidence: 0.4 }, text: `Once the moment arrives you jump the barricade and snarl through the ring. Officials drag you off, and the crowd roars. A feud has been born in front of millions.`, effects: [{ rivalry: { who: 'eliminator', heat: 22 } }, { rel: { who: 'eliminator', heat: 18, respect: 3 } }, { pop: 1.0 }, { conf: 3 }, { fatigue: 8 }] },
        { weight: 1, text: `The officials stop you before you get close, and the cameras cut away before the moment lands.`, effects: [{ rivalry: { who: 'eliminator', heat: 8 } }, { pop: -0.1 }, { conf: -2 }] } ] },
      { id: 'shake', label: `Plan to get up and shake the eliminator's hand`, risk: 'low', result: `When the time comes, you offer a nod and a handshake, a sportsman's gesture the crowd gives you a hand for. {eliminator.first} returns the respect.`, effects: [{ rel: { who: 'eliminator', respect: 8, trust: 4 } }, { pop: 0.4 }, { conf: -1 }] },
      { id: 'stay_down', label: `Plan to stay down, sell the damage, and get carried out`, risk: 'med', outcomes: [
        { weight: 2, text: `The medical team treats it as an emergency, and the crowd gasps. You become a sympathetic figure and get a week to recover your composure.`, effects: [{ pop: 0.6 }, { fatigue: -10 }, { conf: -1 }] },
        { weight: 1, text: `Someone at the production desk says you overdid it, and a clip makes the rounds that you are being overly theatrical.`, effects: [{ pop: -0.4 }, { conf: -2 }] } ] },
      { id: 'point', label: `Plan to point at the sign and call your shot`, risk: 'med', result: `From the floor you call your shot to whoever is left standing. Some find it nervy, others find it magnetic.`, effects: [{ pop: 0.5 }, { conf: 2 }, { rel: { who: 'eliminator', heat: 6 } }] },
    ],
  },
  {
    id: 'rmb_empty_spot', category: 'rumble', title: `An Empty Number in the Drum`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 10, contexts: ['weekly', 'pre_show'],
    cast: { boss: { pick: 'staff', role: 'gm' } },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 5 }, stat: { rumbleEntries: { lte: 2 }, popularity: { gte: 10 } } },
    slots: { reason: [`a booked entrant fell ill`, `a returning star is stuck in a snowstorm`, `a contract dispute pulled one name off the card`], offer: [`a quick payday`, `a chance to be seen`, `a favour the office would owe you`] },
    body: [`{boss.name} reaches you with a stack of paper and a wary grin. {reason}, and there is a slot in the match that needs filling by tonight.`, `The ask is simple and so is the pitch: {offer}. The catch is that nobody has prepped you, and the Rumble does not forgive weak entries.`],
    choices: [
      { id: 'take', label: `Take the spot with no questions asked`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `You walk in cold and make the most of the ropes. Nobody expected anything, so every elimination feels like a gift.`, effects: [{ pop: 0.8 }, { conf: 3 }, { fatigue: 14 }, { money: 3000 }] },
        { weight: 2, text: `You get lost in the shuffle and eliminated before the camera finds you. It is a paycheque and a bruise.`, effects: [{ pop: 0.1 }, { fatigue: 12 }, { money: 3000 }] } ] },
      { id: 'negotiate', label: `Name a price before you agree`, risk: 'med', result: `You squeeze a fatter fee and an extra guarantee out of the office, and everyone knows it. The spot is yours, but with a little less goodwill.`, effects: [{ money: 9000 }, { pop: 0.2 }, { conf: 2 }, { fatigue: 12 }] },
      { id: 'pitch', label: `Counter with a pitch to build an angle around you`, risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.5, mic: 0.4 }, text: `{boss.first} likes the idea and gives you a hook: an entrance, a rival to chase, and a short promo before the bell. It is a break.`, effects: [{ pop: 1.1 }, { conf: 4 }, { fatigue: 14 }] },
        { weight: 2, text: `You overreach and the slot goes to someone less demanding. You are left with nothing but a bad taste.`, effects: [{ pop: -0.2 }, { conf: -3 }] } ] },
      { id: 'decline', label: `Decline and rest your body for the season`, risk: 'low', result: `Your body thanks you, and the office remembers you did not help. Better luck next time.`, effects: [{ fatigue: -10 }, { conf: 1 }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'rmb_media_week', category: 'rumble', title: `Rumble Week Media Gauntlet`, weight: 2, major: true, cooldownDays: 300, maxPerCareer: 3, categoryCooldown: 8, contexts: ['weekly', 'pre_show'],
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 6 }, stat: { popularity: { gte: 30 }, mic: { gte: 25 } } },
    slots: { stop: [`a morning radio show`, `a late-night talk set`, `a sports network studio`, `a local TV news desk`], jab: [`"You always seem to come up just short."`, `"Is this the year anyone takes you seriously?"`, `"Will you eliminate your friends?"`] },
    body: [`The tour has you at {stop} at six in the morning, and {host.name} is already warmed up. The first question is a jab: {jab}`, `You have forty seconds of live air. What you say here is the loudest thing you will say about the Rumble until the bell.`],
    choices: [
      { id: 'charm', label: `Charm the host and sell the fans on the match`, risk: 'low', outcomes: [
        { weight: 3, bonus: { charisma: 0.6 }, text: `You laugh at the jab and spin it. By the end, {host.first} is cheering for you. The clip gets shared widely.`, effects: [{ pop: 0.7 }, { conf: 2 }, { event: { type: 'interview', participants: ['host'], summary: `Charmed a morning host during Rumble week.`, data: { quality: { base: 62, mic: 0.4, charisma: 0.5 }, viral: { minQuality: 80, chance: 0.4 } } } }] },
        { weight: 1, text: `The jokes land softly and the segment ends politely. Nothing is gained or lost.`, effects: [{ pop: 0.1 }] } ] },
      { id: 'edge', label: `Meet the jab with real heat and a sharp edge`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.7 }, text: `You flatten the question and make it a statement. The host is nervous. The clip is all over the internet by noon.`, effects: [{ pop: 1.0 }, { conf: 3 }, { event: { type: 'interview', participants: ['host'], summary: `Went on the attack on a Rumble week interview.`, data: { quality: { base: 66, mic: 0.6, charisma: 0.2 }, viral: { minQuality: 75, chance: 0.5 } } } }] },
        { weight: 2, text: `The tone goes sour. The host cuts you off and the clip makes you look defensive.`, effects: [{ pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'humble', label: `Stay humble and credit the roster`, risk: 'low', result: `You speak warmly about the locker room and the fans. It is likeable and forgettable in equal measure.`, effects: [{ pop: 0.2 }, { conf: 1 }, { fatigue: -3 }] },
      { id: 'skip', label: `Cancel the rest of the tour and rest your voice`, risk: 'med', result: `The publicity team groans and a few outlets complain. You get an extra afternoon of sleep and a ding on your reputation.`, effects: [{ pop: -0.4 }, { fatigue: -12 }, { conf: 1 }] },
    ],
  },
  {
    id: 'rmb_crowd_favourite', category: 'rumble', title: `The Crowd Has Picked a Favourite`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 10, contexts: ['weekly', 'post_show'],
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 10 }, stat: { popularity: { gte: 45 } } },
    slots: { sign: [`handmade signs with your name`, `a chant that began in the upper deck`, `banners over every barricade`], reaction: [`stunned`, `unimpressed`, `quietly calculating`] },
    body: [`On the last show before the Rumble, the crowd turns on the scripted plan and gives you {sign}. {creative.name} watches the monitor, {reaction}.`, `The writers had you pencilled as a bit player. Fan reaction like this changes the arithmetic, if the office decides to listen.`],
    choices: [
      { id: 'milk', label: `Milk the reaction and play to the fans`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, popularity: 0.4 }, text: `You lean into the roar, pause, look around, and let the arena do the work. The office hears it too.`, effects: [{ pop: 1.2 }, { conf: 3 }] },
        { weight: 1, text: `You stretch it a beat too long, and the producer cuts the camera. It plays as ego.`, effects: [{ pop: 0.2 }, { conf: -2 }] } ] },
      { id: 'lobby', label: `Lobby {creative.first} for a Rumble push`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.4, charisma: 0.4 }, text: `{creative.first} sees the numbers and gives you a longer run and better spot. It is a real break.`, effects: [{ pop: 1.0 }, { conf: 4 }, { money: 3500 }] },
        { weight: 2, text: `{creative.first} hears the demand and decides you are getting above yourself. Your spot is quietly trimmed.`, effects: [{ pop: -0.5 }, { conf: -3 }] } ] },
      { id: 'deflect', label: `Deflect: tell fans the match is about the locker room`, risk: 'low', result: `You give the credit away and the crowd applauds you for it. The office, meanwhile, notes your humility and keeps their plan the same.`, effects: [{ pop: 0.4 }, { conf: 1 }] },
      { id: 'shut_down', label: `Shut the chants down to avoid backlash`, risk: 'med', result: `You motion for quiet. The crowd boos you for a moment, then forgives. You keep the office happy and lose some of your shine.`, effects: [{ pop: -0.3 }, { conf: -1 }, { money: 1500 }] },
    ],
  },
  {
    id: 'rmb_cheat_conspiracy', category: 'rumble', title: `A Heel Wants to Fix the Rumble`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 10,
    cast: { schemer: { pick: 'roster', tier: { gte: 2, lte: 3 }, alignment: 'heel' }, favourite: { pick: 'champion', class: 'world' } },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 7 }, stat: { popularity: { gte: 25 } } },
    slots: { plan: [`pull the favourite off the apron the second the bell rings`, `jump the favourite from behind the moment of entry`, `distract the referees at the exact moment of the last elimination`], gift: [`a share of the spotlight`, `a title opportunity the other has promised`, `a favour you can call in later`] },
    body: [`{schemer.name} corners you at catering and keeps the volume down. The target is {favourite.name}, and {schemer.they} intends to {plan}.`, `In return, you get {gift}. It's a plan with a lot of moving parts and not a lot of honour.`],
    choices: [
      { id: 'join', label: `Join the conspiracy and take your cut`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `The scheme goes off cleanly. {favourite.first} is taken out and the heat on you is thick, delicious, and well-earned.`, effects: [{ pop: 0.8 }, { conf: 3 }, { rel: { who: 'schemer', trust: 8, respect: 6 } }, { rel: { who: 'favourite', heat: 15 } }, { event: { type: 'alliance_formed', participants: ['schemer'], summary: `Joined {schemer.name} in a plot against {favourite.name}.`, data: {} } }] },
        { weight: 1, text: `The plan unravels on the night and you take the fall while {schemer.first} slips away.`, effects: [{ pop: -0.5 }, { conf: -4 }, { rel: { who: 'schemer', trust: -6 } }, { rel: { who: 'favourite', heat: 12 } }] } ] },
      { id: 'tip', label: `Tip off {favourite.name} about the plan`, risk: 'med', result: `{favourite.first} remembers who warned {favourite.them}. {schemer.first} remembers who ratted. Someone is going to find out.`, effects: [{ rel: { who: 'favourite', trust: 12, respect: 6 } }, { rel: { who: 'schemer', heat: 20, trust: -14 } }, { rivalry: { who: 'schemer', heat: 12 } }, { pop: 0.3 }] },
      { id: 'refuse', label: `Refuse flat and walk away from the scheme`, risk: 'low', result: `You decline and promise to keep quiet. {schemer.first} narrows an eye. It is not a threat, quite.`, effects: [{ rel: { who: 'schemer', respect: -3 } }, { conf: 2 }, { pop: 0.1 }] },
      { id: 'counter', label: `Take the plan, then turn it against the schemer`, risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: `You sit on the plan until the moment, then turn the trick back on {schemer.name}. It is the sort of cleverness that gets a reputation made.`, effects: [{ pop: 1.1 }, { conf: 5 }, { rel: { who: 'schemer', heat: 22 } }, { rivalry: { who: 'schemer', heat: 16 } }] },
        { weight: 2, text: `You hesitate, and both men see it. By the end of the night you are in the middle of two angry people.`, effects: [{ pop: -0.4 }, { conf: -4 }, { rel: { who: 'schemer', heat: 10 } }, { rel: { who: 'favourite', heat: 8 } }] } ] },
    ],
  },
  {
    id: 'rmb_rumble_ritual', category: 'rumble', title: `The Night Before the Rumble`, weight: 2, major: true, cooldownDays: 300, maxPerCareer: 3, categoryCooldown: 8, contexts: ['weekly', 'pre_show'],
    cast: { vet: { pick: 'roster', tier: { gte: 2, lte: 4 } } },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 2 }, stat: { popularity: { gte: 20 } } },
    slots: { place: [`the hotel bar`, `the arena parking lot`, `an empty banquet hall`], custom: [`everyone names the person they most want to eliminate`, `the veterans tell stories about their worst Rumble bumps`, `each competitor writes down their goal for the match`] },
    body: [`At {place}, {vet.name} has gathered a handful of Rumble regulars for an old tradition: {custom}. It is half superstition, half bonding.`, `There is room for you at the table, as long as you are willing to be honest in front of people who will be in the ring with you tomorrow.`],
    choices: [
      { id: 'join', label: `Join in and be open about your goals`, risk: 'low', outcomes: [
        { weight: 3, bonus: { confidence: 0.4 }, text: `You say what you want out loud. Nobody laughs. {vet.first} claps you on the shoulder and tells you to take what you can.`, effects: [{ rel: { who: 'vet', respect: 8, trust: 5 } }, { conf: 4 }, { fatigue: 3 }] },
        { weight: 1, text: `You say too much, and a rival uses your own words against you for weeks.`, effects: [{ rel: { who: 'vet', respect: 3 } }, { conf: -2 }, { pop: -0.1 }] } ] },
      { id: 'bluff', label: `Join in, but bluff about your real plan`, risk: 'med', result: `You play the room with a straight face and the lie holds. You gain the room's respect and keep your secrets.`, effects: [{ rel: { who: 'vet', respect: 3, trust: -2 } }, { conf: 3 }] },
      { id: 'early', label: `Excuse yourself and get a full night of sleep`, risk: 'low', result: `You skip the ritual and rest. {vet.first} notes the empty seat without comment. You wake up fresher than anyone.`, effects: [{ fatigue: -14 }, { conf: 1 }, { rel: { who: 'vet', respect: -3 } }] },
      { id: 'study', label: `Skip the party and study the match structure`, risk: 'low', result: `You spend the evening mapping entrances, ring space and rope placement. It gives you a clear head and a lonely evening.`, effects: [{ conf: 3 }, { fatigue: -4 }, { attr: { name: 'psychology', delta: 1 } }, { rel: { who: 'vet', respect: -2 } }] },
    ],
  },
  {
    id: 'rmb_veteran_ropes', category: 'rumble', title: `The Rumble Veteran's Burden`, weight: 2, major: true, cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 10,
    cast: { youngster: { pick: 'roster', tier: { lte: 2 }, sameBrand: true }, boss: { pick: 'staff', role: 'creative' } },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 10 }, stat: { rumbleEntries: { gte: 3 } } },
    slots: { script: [`take a clean elimination at the hands of the rising name`, `be tossed in the first half hour`, `lose to a surprise return`], pitch: [`passing the torch`, `fresh blood`, `a new face for the poster`] },
    body: [`You are no stranger to this match, and {boss.name} knows it. The idea for this year's show is {pitch}: you will {script}, with {youngster.name} getting the glory.`, `It will be good for the show. Whether it is good for you is another matter.`],
    choices: [
      { id: 'agree', label: `Agree and make the youngster look like a star`, risk: 'low', result: `You take the bump with a nod. {youngster.first} remembers, and so does the locker room.`, effects: [{ rel: { who: 'youngster', respect: 10, trust: 8, affinity: 6 } }, { pop: -0.2 }, { conf: -2 }, { fatigue: 5 }] },
      { id: 'condition', label: `Agree only if you get a main-event match after`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.3, charisma: 0.3 }, text: `{boss.first} writes the promise on a card and signs it. You get your payoff, and a bit of wariness from the youngster.`, effects: [{ pop: 0.5 }, { conf: 3 }, { rel: { who: 'youngster', respect: 3 } }, { money: 3000 }] },
        { weight: 1, text: `{boss.first} laughs and says that is not how this works. You are left with the same script and a colder office.`, effects: [{ conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'resist', label: `Push back and demand to go deep in the match`, risk: 'high', result: `You bring up your experience and your record. {boss.first} listens, but not kindly. You'll go deeper into the match, though the room splits on whether that was fair.`, effects: [{ pop: 0.4 }, { conf: 3 }, { rel: { who: 'youngster', respect: -8, heat: 6 } }, { money: -2000 }] },
      { id: 'mentor', label: `Offer to coach the youngster through the whole match`, risk: 'low', result: `You turn the burden into a masterclass. The match is better for it, and so is your reputation as a teacher.`, effects: [{ event: { type: 'mentorship', participants: ['youngster'], summary: `Coached {youngster.name} through a Royal Rumble spot.`, data: { byPlayer: true } } }, { rel: { who: 'youngster', trust: 10, respect: 10 } }, { fatigue: 9 }, { pop: 0.2 }] },
    ],
  },
  {
    id: 'rmb_big_spot_pitch', category: 'rumble', title: `Pitching Your Rumble Entrance`, weight: 2, major: true, cooldownDays: 300, maxPerCareer: 3, categoryCooldown: 8,
    cast: { boss: { pick: 'staff', role: 'producer' } },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 12 }, stat: { popularity: { gte: 25 }, confidence: { gte: 30 } } },
    slots: { prop: [`a custom-built steel chair`, `a pyro-rigged entrance ramp`, `a moving ring apron`], stunt: [`a springboard elimination over two rivals at once`, `a baseball-slide through the ropes`, `a leaping dive from the top of the steel steps`] },
    body: [`{boss.name} wants every entrant to have something memorable, and has asked for pitches. You have two ideas: {prop} for the entrance, and {stunt} for the match itself.`, `Either idea can make your Rumble. Either idea can also put you on the injured list.`],
    choices: [
      { id: 'stunt', label: `Pitch the dangerous stunt`, risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.5, confidence: 0.3 }, text: `You hit it dead on in rehearsal, then again for the live crowd. The roar is a wall of noise, and the highlight is yours.`, effects: [{ pop: 1.4 }, { conf: 5 }, { fatigue: 12 }] },
        { weight: 1, text: `The landing goes wrong. You finish the match, but your knee is wrecked.`, effects: [{ pop: 0.6 }, { conf: -2 }, { fatigue: 16 }, { injury: { part: 'legs', severity: 1, days: 21 } }] } ] },
      { id: 'prop', label: `Pitch the entrance prop and keep the match simple`, risk: 'med', result: `The prop is cheap to build, easy to love, and photographed to death. It is not breathtaking, but it is memorable.`, effects: [{ pop: 0.6 }, { conf: 2 }, { money: -2500 }] },
      { id: 'both', label: `Pitch both ideas and ask for a bigger budget`, risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.5, mic: 0.3 }, text: `{boss.first} is impressed by the ambition and approves both. It is a heavy night, but a big one.`, effects: [{ pop: 1.2 }, { conf: 3 }, { fatigue: 14 }, { money: -4000 }] },
        { weight: 2, text: `{boss.first} cuts both ideas as too much and gives you five minutes of plain ring time. You are crushed.`, effects: [{ pop: -0.2 }, { conf: -3 }] } ] },
      { id: 'simple', label: `Keep it simple and let the match speak`, risk: 'low', result: `You skip the gimmicks and do what you do best. The crowd respects the work, even if it will not remember it in a week.`, effects: [{ pop: 0.3 }, { conf: 2 }, { fatigue: 4 }] },
    ],
  },
  // ============================================================ WRESTLEMANIA
  {
    id: 'wm_pick_opponent', category: 'wrestlemania', title: `Who Do You Want at WrestleMania?`, weight: 3, major: true, cooldownDays: 330, maxPerCareer: 4, categoryCooldown: 12,
    cast: { rival: { pick: 'rivalry', minHeat: 15, status: 'active' }, boss: { pick: 'staff', role: 'creative' }, star: { pick: 'roster', tier: { gte: 3 } } },
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 45 }, stat: { popularity: { gte: 25 } } },
    slots: { room: [`a glass-walled office`, `the back of a production truck`, `a hotel suite turned writers' room`], mood: [`behind schedule`, `in an unusually good mood`, `short on patience`] },
    body: [`{boss.name} has you in {room} and is {mood}. The WrestleMania card has one open slot, and the office is willing to let you weigh in on the opponent.`, `The easy call is {rival.name}, whose feud with you already has momentum. The ambitious one is {star.name}, a name that would put you on the poster, at a price.`],
    choices: [
      { id: 'rival', label: `Ask for {rival.name} and settle it on the grandest stage`, risk: 'low', result: `{boss.first} nods: the story is already written, and the grudge has its own heat. The match is booked.`, effects: [{ booking: { who: 'rival', type: 'singles' } }, { rivalry: { who: 'rival', heat: 10 } }, { pop: 0.6 }, { conf: 2 }] },
      { id: 'star', label: `Ask for {star.name} and aim for the poster`, risk: 'high', outcomes: [
        { weight: 2, bonus: { popularity: 0.5, charisma: 0.3 }, text: `{boss.first} makes the call and {star.name} agrees. It is a dream match, but you will be the underdog going in.`, effects: [{ booking: { who: 'star', type: 'singles' } }, { pop: 1.2 }, { conf: 4 }, { rel: { who: 'star', respect: 5 } }] },
        { weight: 2, text: `{boss.first} laughs politely. The star is already spoken for, and your request goes nowhere.`, effects: [{ pop: -0.2 }, { conf: -3 }] } ] },
      { id: 'stip', label: `Ask for {rival.name} with a brutal stipulation`, risk: 'med', result: `You tell {boss.first} the feud cannot end in a normal match. The office agrees, but you have promised to take a beating.`, effects: [{ booking: { who: 'rival', type: 'no_dq' } }, { rivalry: { who: 'rival', heat: 16 } }, { pop: 0.8 }, { fatigue: 10 }] },
      { id: 'leave', label: `Let the office decide and stay agreeable`, risk: 'low', result: `You shrug and say you will work with anyone. {boss.first} is pleased, and the match you get is exactly as ordinary as that sounds.`, effects: [{ pop: 0.1 }, { conf: -2 }, { money: 1500 }] },
    ],
  },
  {
    id: 'wm_stipulation', category: 'wrestlemania', title: `The Stipulation for {rival.name}`, weight: 3, major: true, cooldownDays: 330, maxPerCareer: 3, categoryCooldown: 12, memory: { role: 'rival', max: 1 },
    cast: { rival: { pick: 'rivalry', minHeat: 25, status: 'active' }, boss: { pick: 'staff', role: 'gm' } },
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 30 } },
    slots: { place: [`the ring in an empty arena`, `a catering room with the chairs stacked on tables`, `the parking garage under the venue`], tone: [`everyone has a theory`, `the office wants a headline`, `the crowd is demanding a finish`] },
    body: [`{boss.name} calls you and {rival.name} to {place}. Your feud has run so hot that {tone}, and the office is asking what kind of match this should be at WrestleMania.`, `{rival.first} has opinions, and so do you. Whatever you agree on becomes the story of the month.`],
    choices: [
      { id: 'cage', label: `Demand a steel cage to lock the feud shut`, risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.4, confidence: 0.3 }, text: `The cage is approved and the card has its centrepiece. You and {rival.first} take a punishing, bloody road through the final week.`, effects: [{ booking: { who: 'rival', type: 'cage' } }, { rivalry: { who: 'rival', heat: 14 } }, { pop: 1.0 }, { conf: 3 }, { fatigue: 14 }] },
        { weight: 1, text: `The cage is approved, but a late rewrite leaves you carrying most of the physical load. You leave hurt.`, effects: [{ booking: { who: 'rival', type: 'cage' } }, { pop: 0.6 }, { fatigue: 16 }, { injury: { part: 'torso', severity: 1, days: 12 } }] } ] },
      { id: 'ladder', label: `Suggest a ladder match with something hanging above`, risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `The ladder match goes on the card and the climbers in you both rise to it. The finish is breathtaking.`, effects: [{ booking: { who: 'rival', type: 'ladder' } }, { pop: 1.1 }, { conf: 3 }, { fatigue: 15 }] },
        { weight: 1, text: `A ladder shifts on the night and your landing is rough. You finish the match, barely.`, effects: [{ booking: { who: 'rival', type: 'ladder' } }, { pop: 0.7 }, { fatigue: 16 }, { injury: { part: 'arms', severity: 1, days: 14 } }] } ] },
      { id: 'clean', label: `Insist on a clean singles match, no tricks`, risk: 'low', result: `You make a point of wanting a pure contest. {rival.first} sneers, but accepts. The match is a technical showpiece that will not make clips, but will make careers.`, effects: [{ booking: { who: 'rival', type: 'singles' } }, { rel: { who: 'rival', respect: 8 } }, { pop: 0.4 }, { conf: 2 }] },
      { id: 'submit', label: `Ask for a submission match to prove who is better`, risk: 'med', result: `The idea of a match that cannot be won with a fluke catches the office's imagination. It is a slow-burn, tense bout.`, effects: [{ booking: { who: 'rival', type: 'submission' } }, { rel: { who: 'rival', respect: 5, heat: 4 } }, { pop: 0.5 }, { fatigue: 8 }] },
    ],
  },
  {
    id: 'wm_entrance_design', category: 'wrestlemania', title: `Designing Your WrestleMania Entrance`, weight: 2, major: true, cooldownDays: 330, maxPerCareer: 4, categoryCooldown: 10,
    cast: { boss: { pick: 'staff', role: 'producer' } },
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 28 }, stat: { popularity: { gte: 25 } } },
    slots: { budget: [`a generous budget`, `a tight budget`, `no budget at all but a free hand`], idea: [`a procession of fans lined along the ramp`, `a moment of silence before your music hits`, `a live band rolling out onto the stage`, `a stage that rises from beneath the floor`] },
    body: [`{boss.name} has put up the stage plot for your WrestleMania entrance and given you {budget}. The idea on the table is {idea}.`, `You will walk it in front of the biggest crowd of your life, and the entrance is the first impression most of them will form.`],
    choices: [
      { id: 'spectacle', label: `Go big: build the spectacle and pay what it costs`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.6 }, text: `The first beat of your music lands and the stadium gasps. Cameras flash like lightning, and you feel the whole building behind you.`, effects: [{ pop: 1.3 }, { conf: 4 }, { money: -8000 }] },
        { weight: 1, text: `A technical hiccup kills the music for ten awkward seconds. The recovery is gracious, but not perfect.`, effects: [{ pop: 0.3 }, { conf: -2 }, { money: -8000 }] } ] },
      { id: 'classic', label: `Keep the classic entrance, only sharper`, risk: 'low', result: `You do what the fans know and love, with a tighter edge and a few new camera angles. It is warm, reliable, and nothing to write home about.`, effects: [{ pop: 0.5 }, { conf: 2 }, { money: -1500 }] },
      { id: 'stripped', label: `Strip everything back and walk out alone`, risk: 'med', outcomes: [
        { weight: 1, bonus: { confidence: 0.5, mic: 0.3 }, text: `No pyro, no theatrics, just you and the roar. It is the quietest, boldest thing on the card, and it works.`, effects: [{ pop: 1.1 }, { conf: 5 }] },
        { weight: 2, text: `The crowd needs something to hold onto, and a bare entrance leaves them restless for a minute.`, effects: [{ pop: 0.1 }, { conf: -2 }] } ] },
      { id: 'sponsor', label: `Accept a sponsor's entrance package and the cheque`, risk: 'low', result: `A brand foots the bill and gets its logo on the ramp. The entrance looks great, but some fans roll their eyes.`, effects: [{ money: 12000 }, { pop: -0.3 }, { conf: 1 }] },
    ],
  },
  {
    id: 'wm_pre_match_ritual', category: 'wrestlemania', title: `The Hours Before the Bell`, weight: 2, major: true, cooldownDays: 330, maxPerCareer: 4, categoryCooldown: 10, contexts: ['show_day', 'pre_show'],
    cast: { trainer: { pick: 'staff', role: 'trainer' } },
    trigger: { minYear: 1985, event: 'wrestlemania', stat: { popularity: { gte: 20 } } },
    slots: { place: [`an empty loading dock`, `the locker room, door locked`, `the stadium tunnel`, `the ring itself, hours before doors`], thought: [`the first time you ever watched this show`, `everyone who never got here`, `the night you almost quit`] },
    body: [`Four hours before the bell, you find yourself in {place}. {trainer.name} has left a bag of tape and a bottle of water beside you and gone quiet.`, `Your head keeps going back to {thought}. How you spend the next few hours may decide how you feel when the lights come up.`],
    choices: [
      { id: 'silence', label: `Sit in silence and let the nerves pass`, risk: 'low', outcomes: [
        { weight: 3, bonus: { confidence: 0.5 }, text: `You breathe slow, count the seats you can see in your head, and the shaking in your hands stops. When the cue comes, your legs are steady.`, effects: [{ conf: 5 }, { fatigue: -6 }] },
        { weight: 1, text: `The quiet makes things worse. You spend two hours hearing every doubt you have ever had.`, effects: [{ conf: -3 }, { fatigue: 2 }] } ] },
      { id: 'warm', label: `Burn it off with a hard warm-up`, risk: 'med', result: `You push the pace in the empty arena until you are dripping. It leaves you sharp but a little spent when the music hits.`, effects: [{ conf: 3 }, { fatigue: 10 }, { attr: { name: 'endurance', delta: 1 } }] },
      { id: 'family', label: `Call the people who got you here`, risk: 'low', result: `You make three calls in a row and each one is shorter than it should be. Afterwards you feel lighter, and a little emotional.`, effects: [{ conf: 4 }, { pop: 0.1 }, { fatigue: -4 }] },
      { id: 'crowd', label: `Walk the aisles to soak up the crowd as it arrives`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, popularity: 0.3 }, text: `Fans spot you and start to shout. You sign a few things and pose for a few photos, and the energy fuels you.`, effects: [{ pop: 0.6 }, { conf: 3 }, { fatigue: 5 }] },
        { weight: 1, text: `A swarm of fans swallows you, and security has to rescue you. You arrive at the gorilla late and ruffled.`, effects: [{ pop: 0.3 }, { conf: -2 }, { fatigue: 8 }] } ] },
    ],
  },
  {
    id: 'wm_legend_returns', category: 'wrestlemania', title: `{legend.name} Wants One More Match`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 15,
    cast: { legend: { pick: 'roster', tier: { gte: 4 } }, boss: { pick: 'staff', role: 'executive' } },
    trigger: { minYear: 1990, eventWithin: { id: 'wrestlemania', days: 40 }, stat: { popularity: { gte: 40 } } },
    slots: { demand: [`one last match against a fresh opponent`, `a passing-of-the-torch story`, `a final run with a title match at the end`], tone: [`quietly`, `through a handwritten letter`, `on a satellite phone from somewhere very far away`] },
    body: [`{legend.name} has been in touch {tone}, asking the office for {demand}. {boss.name} says the legend named you as the preferred opponent.`, `It is a compliment and a risk. If the match goes well, it becomes the story of your career. If it does not, it is the story of the legend's goodbye.`],
    choices: [
      { id: 'accept', label: `Accept the match and make it the legend's night`, risk: 'med', result: `You say yes before the executive finishes the sentence. {legend.first} turns up in the gym, and the two of you work the match together for weeks. It is a master class, but you lose.`, effects: [{ booking: { who: 'legend', type: 'singles' } }, { rel: { who: 'legend', respect: 14, trust: 10, affinity: 8 } }, { pop: 0.8 }, { conf: 2 }, { fatigue: 8 }] },
      { id: 'win', label: `Accept, but only if the finish favours you`, risk: 'high', outcomes: [
        { weight: 2, bonus: { popularity: 0.4, mic: 0.3 }, text: `{boss.first} agrees to a hard-fought finish that puts you over. The legend takes it with a nod and a joke. You've earned the place.`, effects: [{ booking: { who: 'legend', type: 'singles' } }, { promise: { kind: 'win_match', who: 'legend', text: `I will beat {legend.name} at WrestleMania`, deadlineDays: 60 } }, { rel: { who: 'legend', respect: 3, heat: 4 } }, { pop: 1.2 }, { conf: 4 }] },
        { weight: 1, text: `The legend refuses to lose on principle, and the executive agrees. You get the match, but the finish does not favour you.`, effects: [{ booking: { who: 'legend', type: 'singles' } }, { rel: { who: 'legend', respect: -4, heat: 6 } }, { conf: -3 }, { pop: 0.2 }] } ] },
      { id: 'decline', label: `Turn it down, since your story is not an epilogue`, risk: 'med', result: `You tell {boss.first} the spot belongs to a rival and a title chase. The legend finds another opponent. Your story stays your own, and you wonder who is going to remember that.`, effects: [{ conf: 3 }, { pop: -0.3 }, { rel: { who: 'legend', respect: -6 } }] },
      { id: 'tag', label: `Suggest a tag match with the legend instead`, risk: 'low', result: `The idea lands: a legend and a rising name against two rivals. It is less personal, but a lot safer.`, effects: [{ booking: { who: 'legend', type: 'tag' } }, { rel: { who: 'legend', respect: 8, trust: 6 } }, { pop: 0.5 }, { conf: 1 }] },
    ],
  },
  {
    id: 'wm_hometown_show', category: 'wrestlemania', title: `WrestleMania Comes Near Home`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 15,
    cast: { gm: { pick: 'staff', role: 'gm' } },
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 30 }, background: ['prospect', 'indie', 'established'], stat: { popularity: { gte: 30 } } },
    slots: { who: [`your old trainer`, `your high school gym teacher`, `the first promoter who booked you`, `your whole extended family`], gift: [`a front-row block of seats`, `a stage-side pass for the VIP area`, `a spot in the pre-match tunnel`] },
    body: [`The venue is a few hours from where you grew up, and word has got out. {who} is asking for {gift}, and the local press wants a homecoming feature.`, `{gm.name} says the office is happy to indulge you. But every ticket, every interview and every tearful hug takes time you need to spend in the ring.`],
    choices: [
      { id: 'embrace', label: `Embrace the homecoming and invite them all`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `Your hometown turns out in force. The cheer when your music hits is the loudest of your career, and the human-interest segment goes viral.`, effects: [{ pop: 1.1 }, { conf: 4 }, { money: -4000 }, { fatigue: 6 }] },
        { weight: 1, text: `The hometown crowd is more demanding than expected. You are grateful for the love and exhausted by the attention.`, effects: [{ pop: 0.5 }, { conf: 1 }, { money: -4000 }, { fatigue: 12 }] } ] },
      { id: 'business', label: `Keep it strictly business and decline the circus`, risk: 'low', result: `You send a note and your thanks. You get a clear head, and a few feelings are hurt back home.`, effects: [{ conf: 2 }, { fatigue: -3 }, { pop: -0.3 }] },
      { id: 'press', label: `Do one big feature, then go quiet`, risk: 'low', result: `You sit for a single long profile with the local station and promise the rest of the time to the ring. It is a fair compromise.`, effects: [{ pop: 0.5 }, { conf: 2 }, { fatigue: 4 }] },
      { id: 'sponsor', label: `Sell the story to a sponsor for a big payday`, risk: 'med', result: `A regional brand pays well for exclusive rights to the homecoming, and some fans think you are cashing in on your own childhood.`, effects: [{ money: 14000 }, { pop: -0.5 }, { conf: 1 }] },
    ],
  },
  {
    id: 'wm_night_before', category: 'wrestlemania', title: `The Night Before WrestleMania`, weight: 2, major: true, cooldownDays: 330, maxPerCareer: 4, categoryCooldown: 10, contexts: ['weekly', 'post_show'],
    cast: { mentor: { pick: 'tag', tag: 'mentor' } },
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 1 }, stat: { popularity: { gte: 20 } } },
    slots: { setting: [`a hotel lobby near midnight`, `a diner that stays open all night`, `the roof of the hotel`], burden: [`a lifetime of work`, `everything you gave up to get here`, `a decade of bruises`] },
    body: [`It is nearly midnight in {setting}, and {mentor.name} has found you. {mentor.they} sits down without a word and orders two coffees. In the quiet you can feel {burden} sitting on your chest.`, `"You do not have to sleep," {mentor.first} says, "but you should decide what you do with this night."`],
    choices: [
      { id: 'listen', label: `Sit with {mentor.first} and listen until dawn`, risk: 'low', result: `{mentor.first} talks about the nerves, the ones that never leave. By sunrise you are tired and strangely at peace.`, effects: [{ rel: { who: 'mentor', trust: 8, affinity: 8 } }, { conf: 4 }, { fatigue: 6 }] },
      { id: 'sleep', label: `Excuse yourself and get a full night of sleep`, risk: 'low', result: `You thank {mentor.first} and head up. Rest is the only advice you actually need.`, effects: [{ fatigue: -14 }, { conf: 2 }, { rel: { who: 'mentor', respect: -2 } }] },
      { id: 'tape', label: `Ask {mentor.first} to walk you through your match`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `{mentor.first} breaks the match down beat by beat and points out a weakness in your plan. You rewrite two spots on a napkin.`, effects: [{ conf: 3 }, { fatigue: 5 }, { attr: { name: 'psychology', delta: 1 } }, { rel: { who: 'mentor', respect: 4 } }] },
        { weight: 1, text: `{mentor.first} picks the plan apart so thoroughly that you leave rattled and second-guessing.`, effects: [{ conf: -4 }, { fatigue: 5 }] } ] },
      { id: 'out', label: `Go out and celebrate with the locker room`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `The night is loud and lovely. You earn real goodwill and sleep four hours.`, effects: [{ pop: 0.3 }, { conf: 3 }, { fatigue: 10 }, { rel: { who: 'mentor', respect: -3 } }] },
        { weight: 1, text: `The party runs long. By morning you are running on caffeine and pride.`, effects: [{ conf: -2 }, { fatigue: 18 }, { rel: { who: 'mentor', respect: -6 } }] } ] },
    ],
  },
  {
    id: 'wm_ticket_requests', category: 'wrestlemania', title: `Two Hundred Ticket Requests`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 10,
    cast: {},
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 21 }, stat: { popularity: { gte: 30 }, money: { gte: 8000 } } },
    slots: { askers: [`your old gym`, `a cousin you have never met`, `a crowd of old friends from the road`, `the people who gave you your first break`], limit: [`a pile of two dozen tickets`, `the whole front row`, `a ringside table`] },
    body: [`The messages begin as soon as the card is announced. the request from {askers} is for {limit}, and the box office is not willing to comp any of it.`, `Buying them yourself will cost a small fortune. Saying no will cost goodwill you may need later.`],
    choices: [
      { id: 'buy', label: `Pay for the tickets yourself`, risk: 'low', result: `You pull out your wallet and cover them. The thank-you notes arrive within the hour, and your account balance takes a hit.`, effects: [{ money: -14000 }, { pop: 0.4 }, { conf: 2 }] },
      { id: 'raffle', label: `Run a giveaway for fans instead`, risk: 'med', outcomes: [
        { weight: 2, bonus: { popularity: 0.4 }, text: `The fan giveaway goes viral, with stories of dozens of trips saved. The old crowd is annoyed, but the new fans love you.`, effects: [{ pop: 0.9 }, { money: -6000 }, { conf: 2 }] },
        { weight: 1, text: `A technical mess leaves the giveaway tangled up, and the angry comments get louder than the happy ones.`, effects: [{ pop: -0.3 }, { money: -6000 }] } ] },
      { id: 'refuse', label: `Say no to all of them, no exceptions`, risk: 'low', result: `You keep your money and your sanity. Some of the messages in your inbox turn bitter.`, effects: [{ pop: -0.4 }, { conf: 1 }, { fatigue: -3 }] },
      { id: 'favour', label: `Trade tickets for favours to people who matter`, risk: 'med', result: `You hand tickets to a few useful contacts and leave the rest to fend for themselves. It works politically, and it feels slightly dirty.`, effects: [{ money: -5000 }, { pop: 0.2 }, { conf: -1 }, { event: { type: 'decision', participants: [], summary: `Traded WrestleMania tickets for favours.`, data: {} } }] },
    ],
  },
  {
    id: 'wm_gear_deal', category: 'wrestlemania', title: `A Merch Deal Before the Big Show`, weight: 2, major: true, cooldownDays: 330, maxPerCareer: 3, categoryCooldown: 10,
    cast: { exec: { pick: 'staff', role: 'executive' } },
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 30 }, stat: { popularity: { gte: 30 } } },
    slots: { item: [`a limited-edition ring jacket`, `a commemorative championship-style replica`, `a signature T-shirt line`], cut: [`a small cut of each sale`, `a large cut, but only if the merch moves`, `a flat fee and no royalties`] },
    body: [`{exec.name} slides a contract across the table. The office wants to push {item} for WrestleMania week, and your cut is {cut}.`, `The demand will be huge if you get a good spot on the show. If you do not, the stock may be left to rot in a warehouse.`],
    choices: [
      { id: 'sign', label: `Sign the deal as offered`, risk: 'low', result: `You sign without fuss. The merch line sells steadily and pays your bills for a while.`, effects: [{ money: 8000 }, { pop: 0.2 }] },
      { id: 'push', label: `Push for a bigger cut, even at the cost of delay`, risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.3, mic: 0.3 }, text: `{exec.first} gives ground when you argue, though the smile is thin. You end up with a better deal.`, effects: [{ money: 20000 }, { conf: 3 }, { pop: 0.2 }] },
        { weight: 2, text: `{exec.first} shelves the project. The merch slot goes to someone with less to say.`, effects: [{ money: -1000 }, { conf: -3 }, { pop: -0.3 }] } ] },
      { id: 'own_design', label: `Insist on designing the item yourself`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `Fans love that the design came from you, and the line sells out in a week. The profit is modest, but the pride is real.`, effects: [{ money: 6000 }, { pop: 0.9 }, { conf: 4 }] },
        { weight: 1, text: `The design misses and sits unsold on shelves. You eat the loss.`, effects: [{ money: -6000 }, { pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'refuse', label: `Refuse: you do not want to sell the moment`, risk: 'low', result: `You turn the deal down. Some fans praise your sincerity. The office files you under difficult.`, effects: [{ pop: 0.3 }, { conf: 2 }, { money: -1500 }] },
    ],
  },
  {
    id: 'wm_go_home_promo', category: 'wrestlemania', title: `The Final Promo Before the Show`, weight: 3, major: true, cooldownDays: 330, maxPerCareer: 4, categoryCooldown: 8, memory: { role: 'rival', max: 1 },
    cast: { rival: { pick: 'rivalry', minHeat: 20, status: 'active' } },
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 10 } },
    slots: { place: [`the ring after the main event`, `a sit-down in front of the entrance ramp`, `the middle of a packed concourse`], line: [`a promise`, `a threat`, `a confession`, `a dare`] },
    body: [`The last live show before WrestleMania ends with {place}, a mic in your hand, and {rival.name} standing across from you. {rival.they} has just finished a speech that left half the arena silent.`, `You have time for one more moment before the cameras cut. Make it {line}.`],
    choices: [
      { id: 'promise', label: `Swear on your career that you will win`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.6, confidence: 0.3 }, text: `The pledge rings out, and the arena goes loud. Whatever happens next, you have bet your name on it.`, effects: [{ promise: { kind: 'win_match', who: 'rival', text: `I will beat {rival.name} at WrestleMania`, deadlineDays: 20 } }, { pop: 1.2 }, { conf: 4 }, { rivalry: { who: 'rival', heat: 8 } }] },
        { weight: 1, text: `The words stick. The pledge sounds hollow, and a few in the crowd groan.`, effects: [{ promise: { kind: 'win_match', who: 'rival', text: `I will beat {rival.name} at WrestleMania`, deadlineDays: 20 } }, { pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'respect', label: `Pay {rival.first} a respectful compliment`, risk: 'low', result: `You tell {rival.first} that the best opponent makes you better. The crowd does not boo, and the room hears a champion's voice.`, effects: [{ rel: { who: 'rival', respect: 10, heat: -6 } }, { pop: 0.5 }, { conf: 2 }] },
      { id: 'insult', label: `Get under {rival.first}'s skin with a cruel line`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.7 }, text: `The line cuts to the bone, and {rival.first} cannot reply. You walk off with the crowd's attention.`, effects: [{ rivalry: { who: 'rival', heat: 14 } }, { rel: { who: 'rival', heat: 14, respect: -6 } }, { pop: 0.9 }] },
        { weight: 1, text: `{rival.first} answers with something nastier. You come out of the exchange second best.`, effects: [{ rivalry: { who: 'rival', heat: 12 } }, { pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'silence', label: `Say nothing, staring {rival.them} down`, risk: 'low', result: `You hold the stare through a minute of crowd noise. It is a shrug of confidence that lets the moment breathe.`, effects: [{ rel: { who: 'rival', fear: 4 } }, { pop: 0.3 }, { conf: 2 }] },
    ],
  },
  {
    id: 'wm_work_hurt', category: 'wrestlemania', title: `Hurt Before WrestleMania`, weight: 3, major: true, cooldownDays: 330, maxPerCareer: 3, categoryCooldown: 12,
    cast: { doctor: { pick: 'staff', role: 'doctor' }, boss: { pick: 'staff', role: 'gm' } },
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 21 }, injured: true },
    slots: { diagnosis: [`a torn muscle that is healing slowly`, `cracked ribs that make every breath hurt`, `a shoulder that pops out under pressure`], fear: [`the one match you cannot miss`, `the shot you may not get again`, `the place on the poster with your name`] },
    body: [`{doctor.name} puts your scans on the lightbox. It is {diagnosis}, and the doctor is blunt about the risk of working the show at all.`, `{boss.name} says the office will support whatever you decide, but everyone in the room knows this is {fear}.`],
    choices: [
      { id: 'work', label: `Work the match and hide how bad it is`, risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.4, overall: 0.3 }, text: `You grit your teeth through the bell and nobody watching can tell. Afterwards your body pays the bill in full, but the match is a classic.`, effects: [{ pop: 1.3 }, { conf: 5 }, { fatigue: 18 }] },
        { weight: 1, text: `Your body gives out mid-match, and you finish the bout in agony. The crowd sees it. The injury gets worse.`, effects: [{ pop: 0.5 }, { conf: -2 }, { fatigue: 22 }, { injury: { part: 'torso', severity: 2, days: 40 } }] } ] },
      { id: 'modify', label: `Ask the agents to rework the match around the injury`, risk: 'med', result: `The agents trim the high spots and add story beats. The match is shorter and smarter, and you survive it.`, effects: [{ pop: 0.5 }, { conf: 2 }, { fatigue: 8 }] },
      { id: 'withdraw', label: `Withdraw and hand the match to a replacement`, risk: 'low', result: `You pull out. {boss.first} finds a substitute, and the fans send you well-wishes. It hurts more than the injury.`, effects: [{ pop: -0.4 }, { conf: -5 }, { fatigue: -12 }] },
      { id: 'angle', label: `Offer to turn the injury into a storyline`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, mic: 0.3 }, text: `A pre-show attack writes your injury into the story, and you return the following month with fresh momentum.`, effects: [{ pop: 0.8 }, { conf: 2 }, { fatigue: -6 }] },
        { weight: 1, text: `The angle feels like a patch over a hole, and the audience sees through it.`, effects: [{ pop: -0.2 }, { conf: -2 }, { fatigue: -6 }] } ] },
    ],
  },
  {
    id: 'wm_card_position', category: 'wrestlemania', title: `A Spot on the WrestleMania Card`, weight: 3, major: true, cooldownDays: 330, maxPerCareer: 4, categoryCooldown: 10,
    cast: { boss: { pick: 'staff', role: 'producer' }, opp: { pick: 'roster', tier: { gte: 1, lte: 3 } } },
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 28 }, stat: { popularity: { gte: 15 } } },
    slots: { slot: [`the opening match`, `a mid-card slot with a crowd that has not yet warmed up`, `the match right before the main event`], runtime: [`a tight ten minutes`, `fifteen minutes, if the show runs on time`, `whatever time is left`] },
    body: [`{boss.name} posts the WrestleMania lineup, and you are on it: {slot}, against {opp.name}, with {runtime}.`, `Every position carries a trap. The opener sets the tone, the middle can disappear, and the late slots live or die by the clock.`],
    choices: [
      { id: 'accept', label: `Accept the slot and make the best of it`, risk: 'low', outcomes: [
        { weight: 3, bonus: { overall: 0.4 }, text: `You and {opp.first} work the time you are given and the crowd responds. People will talk about the match for a week.`, effects: [{ booking: { who: 'opp', type: 'singles' } }, { pop: 0.7 }, { conf: 3 }, { rel: { who: 'opp', respect: 5 } }] },
        { weight: 1, text: `The match is fine, but the crowd is flat. Nothing special.`, effects: [{ booking: { who: 'opp', type: 'singles' } }, { pop: 0.1 }, { conf: -1 }] } ] },
      { id: 'later', label: `Lobby for a later slot with more time`, risk: 'high', outcomes: [
        { weight: 1, bonus: { popularity: 0.5, mic: 0.3 }, text: `{boss.first} reshuffles the card, giving you more time and a better position. The production office does not love it, but you earn a rep for ambition.`, effects: [{ booking: { who: 'opp', type: 'singles' } }, { pop: 0.9 }, { conf: 3 }, { rel: { who: 'opp', respect: -2 } }] },
        { weight: 2, text: `The answer is no, and {boss.first} remembers you asked. Your match is shortened as a result.`, effects: [{ booking: { who: 'opp', type: 'singles' } }, { pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'steal', label: `Promise to steal the show if you get free rein`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.5, confidence: 0.3 }, text: `You and {opp.first} map a spectacular match and nail every beat. By the end of the night it is the one everyone remembers.`, effects: [{ booking: { who: 'opp', type: 'singles' } }, { pop: 1.3 }, { conf: 5 }, { fatigue: 12 }, { rel: { who: 'opp', respect: 8 } }] },
        { weight: 1, text: `You overreach. A big spot misfires and the crowd hushes. The match is remembered for the wrong reason.`, effects: [{ booking: { who: 'opp', type: 'singles' } }, { pop: -0.2 }, { conf: -4 }, { fatigue: 12 }] } ] },
      { id: 'swap', label: `Trade slots with a rival to lock in a better spot`, risk: 'med', result: `You work a favour on the quiet. The new position is better, and someone else is not pleased with you.`, effects: [{ booking: { who: 'opp', type: 'singles' } }, { pop: 0.3 }, { conf: 1 }, { rel: { who: 'opp', trust: -4 } }] },
    ],
  },
  {
    id: 'wm_favour_trade', category: 'wrestlemania', title: `{rival.name} Offers a Trade`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 12, memory: { role: 'rival', max: 1 },
    cast: { rival: { pick: 'rivalry', minHeat: 20, status: 'active' } },
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 30 } },
    slots: { place: [`a secluded corner of the hotel`, `the back seat of a rental car`, `the quiet end of the catering hall`], terms: [`You let me win this one, and I make sure you get the next`, `You hand me your best spot, and I owe you a favour`, `We split the finish and share the credit`] },
    body: [`{rival.name} finds you in {place} and lays out a proposal in a flat, unemotional voice. "{terms}."`, `It is a clever offer. It also means giving a rival something you cannot get back.`],
    choices: [
      { id: 'deal', label: `Make the deal and shake on it`, risk: 'med', result: `You agree, and the handshake lasts a beat too long. Neither of you trusts the other, but both of you believe the numbers.`, effects: [{ rel: { who: 'rival', trust: 8, respect: 4, heat: -10 } }, { tag: { who: 'rival', tag: 'alliance_possible' } }, { pop: 0.1 }, { conf: -2 }] },
      { id: 'reject', label: `Reject it and keep the feud real`, risk: 'low', result: `You tell {rival.first} to earn it in the ring. {rival.they} nods, almost pleased, and walks away.`, effects: [{ rel: { who: 'rival', respect: 6 } }, { rivalry: { who: 'rival', heat: 8 } }, { conf: 3 }, { pop: 0.3 }] },
      { id: 'expose', label: `Expose the offer to the office`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `The office reads you as loyal, and {rival.first} is in trouble. Few friends are made this way.`, effects: [{ rel: { who: 'rival', heat: 22, trust: -16 } }, { rivalry: { who: 'rival', heat: 14 } }, { pop: 0.4 }, { conf: 2 }] },
        { weight: 1, text: `The office shrugs: this sort of thing happens all the time. You come off as a tattle-tale.`, effects: [{ rel: { who: 'rival', heat: 14, respect: -8 } }, { pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'counter', label: `Counter-offer with terms that favour you`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.4, charisma: 0.3 }, text: `You bargain hard and {rival.first} blinks. The deal tilts your way and you part with grudging respect.`, effects: [{ rel: { who: 'rival', respect: 6, trust: -2 } }, { money: 3000 }, { conf: 3 }] },
        { weight: 1, text: `{rival.first} laughs and leaves the table. The deal evaporates.`, effects: [{ rel: { who: 'rival', respect: -2 } }, { conf: -1 }] } ] },
    ],
  },
  {
    id: 'wm_press_tour', category: 'wrestlemania', title: `WrestleMania Week at {stop}`, weight: 2, major: true, cooldownDays: 330, maxPerCareer: 4, categoryCooldown: 8,
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 7 }, stat: { popularity: { gte: 30 }, mic: { gte: 25 } } },
    slots: { stop: [`a fan festival`, `a network media day`, `a charity luncheon`, `a hotel ballroom full of cameras`], question: [`"What does this match mean to you?"`, `"Do you think you belong on this card?"`, `"What would you say to the fans who doubt you?"`] },
    body: [`The week of WrestleMania is a blur of handshakes and mic checks, and today it is {stop}. {reporter.name} steps forward with a recorder and asks: {question}`, `A hundred phones are already up. There is no scripted answer on the card.`],
    choices: [
      { id: 'honest', label: `Answer honestly, even if it makes you vulnerable`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, mic: 0.3 }, text: `You talk about the doubt you carry and the fear you push past. The room goes quiet, then applauds. It is the best interview of your week.`, effects: [{ pop: 0.9 }, { conf: 3 }, { event: { type: 'interview', participants: ['reporter'], summary: `Gave an honest WrestleMania week interview.`, data: { quality: { base: 66, mic: 0.5, charisma: 0.4 }, viral: { minQuality: 80, chance: 0.4 } } } }] },
        { weight: 1, text: `The admission is picked apart by the more cynical corners of the internet.`, effects: [{ pop: -0.2 }, { conf: -3 }] } ] },
      { id: 'bold', label: `Answer with bold confidence and a guarantee`, risk: 'high', result: `You answer with a flourish and a promise. The cameras eat it up. Now you owe the audience a win.`, effects: [{ promise: { kind: 'win_match', text: `I will win at WrestleMania`, deadlineDays: 10 } }, { pop: 1.0 }, { conf: 4 }, { event: { type: 'press_conference', participants: ['reporter'], summary: `Made a bold WrestleMania guarantee.`, data: { quality: { base: 62, mic: 0.5, conf: 0.3 }, viral: { minQuality: 80, chance: 0.4 } } } }] },
      { id: 'script', label: `Stick to the scripted talking points`, risk: 'low', result: `You hit your lines and thank everyone. The answer is solid and forgettable.`, effects: [{ pop: 0.1 }, { conf: 1 }, { money: 1000 }] },
      { id: 'deflect', label: `Deflect with humour and move on to the next stop`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.6 }, text: `A quick joke lightens the room, and {reporter.first} laughs. You come off as relaxed and likeable.`, effects: [{ pop: 0.5 }, { conf: 2 }] },
        { weight: 1, text: `The joke falls flat and the reporter looks annoyed. It reads as dodging.`, effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
    ],
  },
];
