// Marquee scenarios: Royal Rumble, WrestleMania, championship, career-defining opportunities and creative disputes.
export default [
  // ============================================================ ROYAL RUMBLE
  {
    id: 'rmb_draw_number', category: 'rumble', title: `You Draw {draw}`, weight: 3, major: true, cooldownDays: 300, maxPerCareer: 4, categoryCooldown: 10,
    cast: { boss: { pick: 'staff', role: 'producer' } },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 14 }, stat: { popularity: { gte: 20 } } },
    slots: { draw: [`number 1, the loneliest walk in the match`, `number 6, early enough to hurt`, `number 18, dead center of the pack`, `number 29, the late arrival`], tip: [`"Don't gas out in the first ten minutes."`, `"Everybody will be hunting the big names. Let them."`, `"The camera loves whoever is still standing at the end, not whoever starts the fight."`] },
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
    slots: { venue: [`a press scrum`, `a radio studio`, `a merch tent`, `a crowded corridor`], angle: [`the one name worth betting on`, `an underdog the office keeps overlooking`, `a name nobody wants to draw`] },
    body: [`In {venue}, {reporter.name} asks the question every contender dreads. "The Rumble is coming. Does anyone in that locker room scare you, and would you put your name on the winner's list?"`, `The recorder is already pointed at you. You are being sold as {angle}, and anything you say now will be played back to you when the Rumble comes.`],
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
    slots: { where: [`at the Rumble press call`, `in the line for catering`, `outside the hotel elevator`], threat: [`the first name through the ropes`, `anyone who stands between me and the win`, `the one who embarrassed me`] },
    body: [`{rival.name} walks up {where} with a grin that is mostly teeth. "I do not care what number I draw. Come the Rumble, my target is {threat}."`, `It might be a mind game. It might be a plan with a script behind it. Either way, the other contenders are listening.`],
    choices: [
      { id: 'meet', label: `Promise to meet {rival.them} head on in the ring`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: `You hold the stare and tell {rival.first} the queue starts at your feet. The crowd around you buzzes. It is a feud that will have to be settled in the ring.`, effects: [{ rivalry: { who: 'rival', heat: 12 } }, { rel: { who: 'rival', respect: 4, heat: 6 } }, { pop: 0.7 }, { conf: 3 }] },
        { weight: 1, text: `{rival.first} gets the better of the exchange and half the room laughs at your answer.`, effects: [{ rel: { who: 'rival', respect: -2 } }, { pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'avoid', label: `Plan to keep as far from {rival.them} as possible`, risk: 'low', result: `You decide to fight smart, not proud. It might save your night. It also confirms to everyone that {rival.first} gets under your skin.`, effects: [{ rel: { who: 'rival', respect: -3 } }, { conf: -2 }, { fatigue: -6 }] },
      { id: 'set_up', label: `Set a trap: tell {rival.first} the wrong entry number`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{rival.first} spends the build-up preparing for a number you do not have. The mind game cracks the fury right out of {rival.them}.`, effects: [{ rel: { who: 'rival', trust: -8, heat: 4 } }, { pop: 0.5 }, { conf: 4 }] },
        { weight: 1, text: `The lie gets back to {rival.first} before the show. {rival.they} treats it as a public insult.`, effects: [{ rivalry: { who: 'rival', heat: 18 } }, { rel: { who: 'rival', heat: 15 } }, { conf: -2 }] } ] },
      { id: 'recruit', label: `Pull in other contenders to wall {rival.them} out`, risk: 'med', result: `By the end of the day you have a few contenders who owe you a favor and one who now owes you an explanation. Politics is part of the game.`, effects: [{ rel: { who: 'rival', heat: 8 } }, { pop: 0.2 }, { fatigue: 4 }, { money: -2000 }] },
    ],
  },
  {
    id: 'rmb_legend_surprise', category: 'rumble', title: `A Legend in the Building`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 10, contexts: ['pre_show', 'show_day'],
    cast: { legend: { pick: 'roster', tier: { gte: 4 } }, boss: { pick: 'staff', role: 'gm' } },
    trigger: { minYear: 1988, event: 'royal_rumble', stat: { popularity: { gte: 25 } } },
    slots: { hush: [`behind a locked door`, `in a loading dock`, `in a darkened wardrobe room`], plan: [`stalk down the aisle in a surprise return`, `appear as the last entrant`, `spoil the final two with a late, shocking hit`] },
    body: [`{boss.name} pulls you {hush}, voice low. A legend, {legend.name}, has agreed to come back for one night, and the plan is for {legend.them} to {plan}.`, `"The thing is," {boss.first} says, "the angle only works if somebody makes {legend.them} look dangerous. The office thinks you can be that person."`],
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
    body: [`In {room}, {creative.name} slides a diagram across the table. You make the final two of the Rumble; {winner.name} wins with {how}.`, `"It is a loss," {creative.first} admits, "but it is a loss in the final two." A good spot and a huge platform, on one of the biggest shows of the year.`],
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
      { id: 'rival_trick', label: `Offer advice that sets {rookie.them} up to fail`, risk: 'high', outcomes: [
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
    slots: { reason: [`a booked entrant fell ill`, `a returning star is stuck in a storm`, `a contract dispute pulled one name off the card`], offer: [`a quick payday`, `a chance to be seen`, `a favor the office would owe you`] },
    body: [`{boss.name} reaches you with a stack of paper and a wary grin. {reason}, and there is a slot in the match that needs filling by tonight.`, `"Ten minutes, maybe less," {boss.first} says. The ask is simple and so is the pitch: {offer}. The catch is that nobody has prepped you, and the Rumble does not forgive weak entries.`],
    choices: [
      { id: 'take', label: `Take the spot with no questions asked`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `You walk in cold and make the most of the ropes. Nobody expected anything, so every elimination feels like a gift.`, effects: [{ pop: 0.8 }, { conf: 3 }, { fatigue: 14 }, { money: 3000 }] },
        { weight: 2, text: `You get lost in the shuffle and eliminated before the camera finds you. It is a paycheck and a bruise.`, effects: [{ pop: 0.1 }, { fatigue: 12 }, { money: 3000 }] } ] },
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
    body: [`The tour has you at {stop} on three hours of sleep, and {host.name} is already warmed up. The first question is a jab: {jab}`, `You have forty seconds of live air. What you say here is the loudest thing you will say about the Rumble until the bell.`],
    choices: [
      { id: 'charm', label: `Charm the host and sell the fans on the match`, risk: 'low', outcomes: [
        { weight: 3, bonus: { charisma: 0.6 }, text: `You laugh at the jab and spin it. By the end, {host.first} is cheering for you. The clip gets passed around widely.`, effects: [{ pop: 0.7 }, { conf: 2 }, { event: { type: 'interview', participants: ['host'], summary: `Charmed a morning host during Rumble week.`, data: { quality: { base: 62, mic: 0.4, charisma: 0.5 }, viral: { minQuality: 80, chance: 0.4 } } } }] },
        { weight: 1, text: `The jokes land softly and the segment ends politely. Nothing is gained or lost.`, effects: [{ pop: 0.1 }] } ] },
      { id: 'edge', label: `Meet the jab with real heat and a sharp edge`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.7 }, text: `You flatten the question and make it a statement. The host is nervous. The clip is the talk of the building by noon.`, effects: [{ pop: 1.0 }, { conf: 3 }, { event: { type: 'interview', participants: ['host'], summary: `Went on the attack on a Rumble week interview.`, data: { quality: { base: 66, mic: 0.6, charisma: 0.2 }, viral: { minQuality: 75, chance: 0.5 } } } }] },
        { weight: 2, text: `The tone goes sour. The host cuts you off and the clip makes you look defensive.`, effects: [{ pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'humble', label: `Stay humble and credit the roster`, risk: 'low', result: `You speak warmly about the locker room and the fans. It is likeable and forgettable in equal measure.`, effects: [{ pop: 0.2 }, { conf: 1 }, { fatigue: -3 }] },
      { id: 'skip', label: `Cancel the rest of the tour and rest your voice`, risk: 'med', result: `The publicity team groans and a few outlets complain. You get an extra afternoon of sleep and a ding on your reputation.`, effects: [{ pop: -0.4 }, { fatigue: -12 }, { conf: 1 }] },
    ],
  },
  {
    id: 'rmb_crowd_favourite', category: 'rumble', title: `The Crowd Has Picked a Favorite`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 10, contexts: ['weekly', 'post_show'],
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 10 }, stat: { popularity: { gte: 45 } } },
    slots: { sign: [`handmade signs with your name`, `a chant that began in the upper deck`, `banners over every barricade`], reaction: [`stunned`, `unimpressed`, `quietly calculating`] },
    body: [`On the last show before the Rumble, the crowd turns on the scripted plan and gives you {sign}. {creative.name} watches the monitor, {reaction}.`, `"Did you plan that?" {creative.first} asks, eyes on the monitor. The writers had you pencilled as a bit player. Fan reaction like this changes the arithmetic, if the office decides to listen.`],
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
    slots: { plan: [`pull the favorite off the apron the second the bell rings`, `jump the favorite from behind the moment of entry`, `distract the referees at the exact moment of the last elimination`], gift: [`a share of the spotlight`, `a title opportunity the other has promised`, `a favor you can call in later`] },
    body: [`{schemer.name} corners you at catering and keeps the volume down. The target is {favourite.name}, and {schemer.they} intends to {plan}.`, `"In return," {schemer.they} adds, "you get {gift}." It is a plan with a lot of moving parts and not a lot of honor.`],
    choices: [
      { id: 'join', label: `Join the conspiracy and take your cut`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `The scheme goes off cleanly. {favourite.first} is taken out and the heat on you is thick, delicious, and well-earned.`, effects: [{ pop: 0.8 }, { conf: 3 }, { rel: { who: 'schemer', trust: 8, respect: 6 } }, { rel: { who: 'favourite', heat: 15 } }, { event: { type: 'alliance_formed', participants: ['schemer'], summary: `Joined {schemer.name} in a plot against {favourite.name}.`, data: {} } }] },
        { weight: 1, text: `The plan unravels on the night and you take the fall while {schemer.first} slips away.`, effects: [{ pop: -0.5 }, { conf: -4 }, { rel: { who: 'schemer', trust: -6 } }, { rel: { who: 'favourite', heat: 12 } }] } ] },
      { id: 'tip', label: `Tip off {favourite.name} about the plan`, risk: 'med', result: `{favourite.first} remembers who warned {favourite.them}. {schemer.first} remembers who ratted. Someone is going to find out.`, effects: [{ rel: { who: 'favourite', trust: 12, respect: 6 } }, { rel: { who: 'schemer', heat: 20, trust: -14 } }, { rivalry: { who: 'schemer', heat: 12 } }, { pop: 0.3 }] },
      { id: 'refuse', label: `Refuse flat and walk away from the scheme`, risk: 'low', result: `You decline and promise to keep quiet. {schemer.first} narrows an eye. It is not a threat, quite.`, effects: [{ rel: { who: 'schemer', respect: -3 } }, { conf: 2 }, { pop: 0.1 }] },
      { id: 'counter', label: `Take the plan, then turn it against the schemer`, risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: `You sit on the plan until the moment, then turn the trick back on {schemer.name}. It is the sort of cleverness that gets a reputation made.`, effects: [{ pop: 1.1 }, { conf: 5 }, { rel: { who: 'schemer', heat: 22 } }, { rivalry: { who: 'schemer', heat: 16 } }] },
        { weight: 2, text: `You hesitate, and both of them see it. By the end of the night you are in the middle of two angry people.`, effects: [{ pop: -0.4 }, { conf: -4 }, { rel: { who: 'schemer', heat: 10 } }, { rel: { who: 'favourite', heat: 8 } }] } ] },
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
    body: [`You are no stranger to this match, and {boss.name} knows it. The idea for this year's show is {pitch}: you will {script}, with {youngster.name} getting the glory.`, `"Nobody has earned the right to lose more than you," {boss.first} says, meaning it as a compliment. It will be good for the show, and whether it is good for you is another matter.`],
    choices: [
      { id: 'agree', label: `Agree and make the youngster look like a star`, risk: 'low', result: `You take the bump with a nod. {youngster.first} remembers, and so does the locker room.`, effects: [{ rel: { who: 'youngster', respect: 10, trust: 8, affinity: 6 } }, { pop: -0.2 }, { conf: -2 }, { fatigue: 5 }] },
      { id: 'condition', label: `Agree only if you get a main-event match after`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.3, charisma: 0.3 }, text: `{boss.first} writes the promise on a card and signs it. You get your payoff, and a bit of wariness from the youngster.`, effects: [{ pop: 0.5 }, { conf: 3 }, { rel: { who: 'youngster', respect: 3 } }, { money: 3000 }] },
        { weight: 1, text: `{boss.first} laughs and says that is not how this works. You are left with the same script and a colder office.`, effects: [{ conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'resist', label: `Push back and demand to go deep in the match`, risk: 'high', result: `You bring up your experience and your record. {boss.first} listens, but not kindly. You will go deeper into the match, though the room splits on whether that was fair.`, effects: [{ pop: 0.4 }, { conf: 3 }, { rel: { who: 'youngster', respect: -8, heat: 6 } }, { money: -2000 }] },
      { id: 'mentor', label: `Offer to coach the youngster through the whole match`, risk: 'low', result: `You turn the burden into a masterclass. The match is better for it, and so is your reputation as a teacher.`, effects: [{ event: { type: 'mentorship', participants: ['youngster'], summary: `Coached {youngster.name} through a Royal Rumble spot.`, data: { byPlayer: true } } }, { rel: { who: 'youngster', trust: 10, respect: 10 } }, { fatigue: 9 }, { pop: 0.2 }] },
    ],
  },
  {
    id: 'rmb_big_spot_pitch', category: 'rumble', title: `Pitching Your Rumble Entrance`, weight: 2, major: true, cooldownDays: 300, maxPerCareer: 3, categoryCooldown: 8,
    cast: { boss: { pick: 'staff', role: 'producer' } },
    trigger: { minYear: 1988, eventWithin: { id: 'royal_rumble', days: 12 }, stat: { popularity: { gte: 25 }, confidence: { gte: 30 } } },
    slots: { prop: [`a custom-built steel chair`, `a pyro-rigged entrance ramp`, `a moving ring apron`], stunt: [`a springboard elimination over two rivals at once`, `a baseball-slide through the ropes`, `a leaping dive from the top of the steel steps`] },
    body: [`{boss.name} wants every entrant to have something memorable, and has asked for pitches. You have two ideas: {prop} for the entrance, and {stunt} for the match itself.`, `"Surprise me," {boss.first} says. Either idea can make your Rumble, and either idea can also put you on the injured list.`],
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
        { weight: 2, bonus: { overall: 0.4, confidence: 0.3 }, text: `The cage is approved and the card has its centerpiece. You and {rival.first} take a punishing, bloody road through the final week.`, effects: [{ booking: { who: 'rival', type: 'cage' } }, { rivalry: { who: 'rival', heat: 14 } }, { pop: 1.0 }, { conf: 3 }, { fatigue: 14 }] },
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
      { id: 'sponsor', label: `Accept a sponsor's entrance package and the check`, risk: 'low', result: `A brand foots the bill and gets its logo on the ramp. The entrance looks great, but some fans roll their eyes.`, effects: [{ money: 12000 }, { pop: -0.3 }, { conf: 1 }] },
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
    body: [`{legend.name} has been in touch {tone}, asking the office for {demand}. {boss.name} says the legend named you as the preferred opponent.`, `"A compliment and a risk," {boss.first} calls it. If the match goes well, it becomes the story of your career. If it does not, it is the story of the legend's goodbye.`],
    choices: [
      { id: 'accept', label: `Accept the match and make it the legend's night`, risk: 'med', result: `You say yes before the executive finishes the sentence. {legend.first} turns up in the gym, and the two of you work the match together for weeks. It is a master class, but you lose.`, effects: [{ booking: { who: 'legend', type: 'singles' } }, { rel: { who: 'legend', respect: 14, trust: 10, affinity: 8 } }, { pop: 0.8 }, { conf: 2 }, { fatigue: 8 }] },
      { id: 'win', label: `Accept, but only if the finish favors you`, risk: 'high', outcomes: [
        { weight: 2, bonus: { popularity: 0.4, mic: 0.3 }, text: `{boss.first} agrees to a hard-fought finish that puts you over. The legend takes it with a nod and a joke. You have earned the place.`, effects: [{ booking: { who: 'legend', type: 'singles' } }, { promise: { kind: 'win_match', who: 'legend', text: `I will beat {legend.name} at WrestleMania`, deadlineDays: 60 } }, { rel: { who: 'legend', respect: 3, heat: 4 } }, { pop: 1.2 }, { conf: 4 }] },
        { weight: 1, text: `The legend refuses to lose on principle, and the executive agrees. You get the match, but the finish does not favor you.`, effects: [{ booking: { who: 'legend', type: 'singles' } }, { rel: { who: 'legend', respect: -4, heat: 6 } }, { conf: -3 }, { pop: 0.2 }] } ] },
      { id: 'decline', label: `Turn it down, since your story is not an epilogue`, risk: 'med', result: `You tell {boss.first} the spot belongs to a rival and a title chase. The legend finds another opponent. Your story stays your own, and you wonder who is going to remember that.`, effects: [{ conf: 3 }, { pop: -0.3 }, { rel: { who: 'legend', respect: -6 } }] },
      { id: 'tag', label: `Suggest a tag match with the legend instead`, risk: 'low', result: `The idea lands: a legend and a rising name against two rivals. It is less personal, but a lot safer.`, effects: [{ booking: { who: 'legend', type: 'tag' } }, { rel: { who: 'legend', respect: 8, trust: 6 } }, { pop: 0.5 }, { conf: 1 }] },
    ],
  },
  {
    id: 'wm_hometown_show', category: 'wrestlemania', title: `WrestleMania Comes Near Home`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 15,
    cast: { gm: { pick: 'staff', role: 'gm' } },
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 30 }, background: ['prospect', 'indie', 'established'], stat: { popularity: { gte: 30 } } },
    slots: { who: [`your old trainer`, `your high school gym teacher`, `the first promoter who booked you`, `your whole extended family`], gift: [`a front-row block of seats`, `a stage-side pass for the VIP area`, `a spot in the pre-match tunnel`] },
    body: [`The venue is a few hours from where you grew up, and word has spread. {who} is asking for {gift}, and the local press wants a homecoming feature.`, `"We can make room for a homecoming," {gm.name} says. But every ticket, every interview and every tearful hug takes time you need to spend in the ring.`],
    choices: [
      { id: 'embrace', label: `Embrace the homecoming and invite them all`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `Your hometown turns out in force. The cheer when your music hits is the loudest of your career, and the human-interest segment is replayed everywhere.`, effects: [{ pop: 1.1 }, { conf: 4 }, { money: -4000 }, { fatigue: 6 }] },
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
    body: [`The messages begin as soon as the card is announced. The request from {askers} is for {limit}, and the box office is not willing to comp any of it.`, `"Everybody remembers who got them in," a stagehand tells you, "and who did not." Buying them yourself will cost a small fortune, and saying no will cost goodwill you may need later.`],
    choices: [
      { id: 'buy', label: `Pay for the tickets yourself`, risk: 'low', result: `You pull out your wallet and cover them. The thank-you notes arrive within the hour, and your account balance takes a hit.`, effects: [{ money: -14000 }, { pop: 0.4 }, { conf: 2 }] },
      { id: 'raffle', label: `Run a giveaway for fans instead`, risk: 'med', outcomes: [
        { weight: 2, bonus: { popularity: 0.4 }, text: `The fan giveaway spreads fast, with stories of dozens of trips saved. The old crowd is annoyed, but the new fans love you.`, effects: [{ pop: 0.9 }, { money: -6000 }, { conf: 2 }] },
        { weight: 1, text: `A technical mess leaves the giveaway tangled up, and the angry comments get louder than the happy ones.`, effects: [{ pop: -0.3 }, { money: -6000 }] } ] },
      { id: 'refuse', label: `Say no to all of them, no exceptions`, risk: 'low', result: `You keep your money and your sanity. Some of the messages in your inbox turn bitter.`, effects: [{ pop: -0.4 }, { conf: 1 }, { fatigue: -3 }] },
      { id: 'favour', label: `Trade tickets for favors to people who matter`, risk: 'med', result: `You hand tickets to a few useful contacts and leave the rest to fend for themselves. It works politically, and it feels slightly dirty.`, effects: [{ money: -5000 }, { pop: 0.2 }, { conf: -1 }, { event: { type: 'decision', participants: [], summary: `Traded WrestleMania tickets for favors.`, data: {} } }] },
    ],
  },
  {
    id: 'wm_gear_deal', category: 'wrestlemania', title: `A Merch Deal Before the Big Show`, weight: 2, major: true, cooldownDays: 330, maxPerCareer: 3, categoryCooldown: 10,
    cast: { exec: { pick: 'staff', role: 'executive' } },
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 30 }, stat: { popularity: { gte: 30 } } },
    slots: { item: [`a limited-edition ring jacket`, `a commemorative championship-style replica`, `a signature T-shirt line`], cut: [`a small slice of each sale`, `a large slice, but only if the merch moves`, `a flat fee and no royalties`] },
    body: [`{exec.name} slides a contract across the table. The office wants to push {item} for WrestleMania week, and your cut is {cut}.`, `"Put me on the poster and it sells itself," {exec.first} says, half joking. The demand will be huge if you get a good spot on the show. If you do not, the stock may be left to rot in a warehouse.`],
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
    slots: { place: [`the ring after the main event`, `a spotlight at the foot of the entrance ramp`, `the middle of a packed concourse`], line: [`a promise`, `a threat`, `a confession`, `a dare`] },
    body: [`The last live show before WrestleMania ends in {place}, with a mic in your hand and {rival.name} standing across from you. {rival.they} has just finished a speech that left half the arena silent.`, `You have time for one more moment before the cameras cut, and the crowd is waiting for {line}.`],
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
    body: [`{doctor.name} puts your scans on the lightbox. It is {diagnosis}, and the doctor is blunt about the risk of working the show at all.`, `"We will back whatever you decide," {boss.name} says, but everyone in the room knows this is {fear}.`],
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
    body: [`{boss.name} posts the WrestleMania lineup, and you are on it: {slot}, against {opp.name}, with {runtime}.`, `"No such thing as a bad slot," {boss.first} says, which is what people say about bad slots. Every position carries a trap: the opener sets the tone, the middle can disappear, and the late slots live or die by the clock.`],
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
      { id: 'swap', label: `Trade slots with {opp.first} to lock in a better spot`, risk: 'med', result: `You work a favor on the quiet. The new position is better, and someone else is not pleased with you.`, effects: [{ booking: { who: 'opp', type: 'singles' } }, { pop: 0.3 }, { conf: 1 }, { rel: { who: 'opp', trust: -4 } }] },
    ],
  },
  {
    id: 'wm_favour_trade', category: 'wrestlemania', title: `{rival.name} Offers a Trade`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 12, memory: { role: 'rival', max: 1 },
    cast: { rival: { pick: 'rivalry', minHeat: 20, status: 'active' } },
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 30 } },
    slots: { place: [`a secluded corner of the hotel`, `the back seat of a rental car`, `the quiet end of the catering hall`], terms: [`You let me win this one, and I make sure you get the next`, `You hand me your best spot, and I owe you a favor`, `We split the finish and share the credit`] },
    body: [`{rival.name} finds you in {place} and lays out a proposal in a flat, unemotional voice. "{terms}."`, `It is a clever offer. It also means giving a rival something you cannot get back.`],
    choices: [
      { id: 'deal', label: `Make the deal and shake on it`, risk: 'med', result: `You agree, and the handshake lasts a beat too long. Neither of you trusts the other, but both of you believe the numbers.`, effects: [{ rel: { who: 'rival', trust: 8, respect: 4, heat: -10 } }, { tag: { who: 'rival', tag: 'alliance_possible' } }, { pop: 0.1 }, { conf: -2 }] },
      { id: 'reject', label: `Reject it and keep the feud real`, risk: 'low', result: `You tell {rival.first} to earn it in the ring. {rival.they} nods, almost pleased, and walks away.`, effects: [{ rel: { who: 'rival', respect: 6 } }, { rivalry: { who: 'rival', heat: 8 } }, { conf: 3 }, { pop: 0.3 }] },
      { id: 'expose', label: `Expose the offer to the office`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `The office reads you as loyal, and {rival.first} is in trouble. Few friends are made this way.`, effects: [{ rel: { who: 'rival', heat: 22, trust: -16 } }, { rivalry: { who: 'rival', heat: 14 } }, { pop: 0.4 }, { conf: 2 }] },
        { weight: 1, text: `The office shrugs: this sort of thing happens all the time. You come off as a tattle-tale.`, effects: [{ rel: { who: 'rival', heat: 14, respect: -8 } }, { pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'counter', label: `Counter-offer with terms that favor you`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.4, charisma: 0.3 }, text: `You bargain hard and {rival.first} blinks. The deal tilts your way and you part with grudging respect.`, effects: [{ rel: { who: 'rival', respect: 6, trust: -2 } }, { money: 3000 }, { conf: 3 }] },
        { weight: 1, text: `{rival.first} laughs and leaves the table. The deal evaporates.`, effects: [{ rel: { who: 'rival', respect: -2 } }, { conf: -1 }] } ] },
    ],
  },
  {
    id: 'wm_press_tour', category: 'wrestlemania', title: `WrestleMania Week at {stop}`, weight: 2, major: true, cooldownDays: 330, maxPerCareer: 4, categoryCooldown: 8,
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 7 }, stat: { popularity: { gte: 30 }, mic: { gte: 25 } } },
    slots: { stop: [`a fan festival`, `a network media day`, `a charity luncheon`, `a hotel ballroom full of cameras`], question: [`"What does this match mean to you?"`, `"Do you think you belong on this card?"`, `"What would you say to the fans who doubt you?"`] },
    body: [`The week of WrestleMania is a blur of handshakes and mic checks, and today it is {stop}. {reporter.name} steps forward with a recorder and asks: {question}`, `"Whenever you are ready," {reporter.first} says, while a hundred cameras are already up. There is no scripted answer on the card.`],
    choices: [
      { id: 'honest', label: `Answer honestly, even if it makes you vulnerable`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, mic: 0.3 }, text: `You talk about the doubt you carry and the fear you push past. The room goes quiet, then applauds. It is the best interview of your week.`, effects: [{ pop: 0.9 }, { conf: 3 }, { event: { type: 'interview', participants: ['reporter'], summary: `Gave an honest WrestleMania week interview.`, data: { quality: { base: 66, mic: 0.5, charisma: 0.4 }, viral: { minQuality: 80, chance: 0.4 } } } }] },
        { weight: 1, text: `The admission is picked apart by the more cynical corners of the wrestling press.`, effects: [{ pop: -0.2 }, { conf: -3 }] } ] },
      { id: 'bold', label: `Answer with bold confidence and a guarantee`, risk: 'high', result: `You answer with a flourish and a promise. The cameras eat it up. Now you owe the audience a win.`, effects: [{ promise: { kind: 'win_match', text: `I will win at WrestleMania`, deadlineDays: 10 } }, { pop: 1.0 }, { conf: 4 }, { event: { type: 'press_conference', participants: ['reporter'], summary: `Made a bold WrestleMania guarantee.`, data: { quality: { base: 62, mic: 0.5, conf: 0.3 }, viral: { minQuality: 80, chance: 0.4 } } } }] },
      { id: 'script', label: `Stick to the scripted talking points`, risk: 'low', result: `You hit your lines and thank everyone. The answer is solid and forgettable.`, effects: [{ pop: 0.1 }, { conf: 1 }, { money: 1000 }] },
      { id: 'deflect', label: `Deflect with humor and move on to the next stop`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.6 }, text: `A quick joke lightens the room, and {reporter.first} laughs. You come off as relaxed and likeable.`, effects: [{ pop: 0.5 }, { conf: 2 }] },
        { weight: 1, text: `The joke falls flat and the reporter looks annoyed. It reads as dodging.`, effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
    ],
  },
  {
    id: 'wm_celebrity_corner', category: 'wrestlemania', title: `A Celebrity Wants In on Your Match`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 15,
    cast: { exec: { pick: 'staff', role: 'executive' }, foe: { pick: 'rivalry', minHeat: 15, status: 'active' } },
    trigger: { minYear: 1985, eventWithin: { id: 'wrestlemania', days: 25 }, stat: { popularity: { gte: 35 } } },
    slots: { guest: [`a film star with a huge following`, `a retired sports legend`, `a chart-topping singer`], role: [`in your corner`, `as the special guest referee`, `as a surprise partner`] },
    body: [`{exec.name} drops a pitch on your desk: {guest} has asked to be involved in your WrestleMania match against {foe.name}, {role}. The publicity would be enormous.`, `Celebrities bring cameras and headlines. They also bring egos, and an unpredictable nerve in the one place you cannot afford mistakes.`],
    choices: [
      { id: 'embrace', label: `Embrace the guest and make them look like a pro`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `You coach your guest through every beat. The cameras love the moment, and the headlines go global.`, effects: [{ pop: 1.2 }, { conf: 3 }, { money: 5000 }, { fatigue: 8 }] },
        { weight: 1, text: `Your guest mistimes a key spot and the match sags. The coverage is huge, but the match is not what you wanted.`, effects: [{ pop: 0.7 }, { conf: -2 }, { money: 5000 }, { fatigue: 8 }] } ] },
      { id: 'double_cross', label: `Plan a swerve where the guest turns on you`, risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.4, popularity: 0.3 }, text: `The swerve goes perfectly and the crowd gasps. The foe is as stunned as anyone, and the match is talked about for years.`, effects: [{ rivalry: { who: 'foe', heat: 10 } }, { pop: 1.5 }, { conf: 4 }] },
        { weight: 2, text: `The guest misses the beat, the swerve dies, and the press calls it a stunt gone wrong.`, effects: [{ pop: -0.4 }, { conf: -4 }] } ] },
      { id: 'keep_out', label: `Insist the guest stay out of it`, risk: 'low', result: `You tell {exec.first} the match speaks for itself. Fans appreciate the purity and the press moves on.`, effects: [{ rel: { who: 'foe', respect: 4 } }, { pop: 0.2 }, { conf: 2 }, { money: -2000 }] },
      { id: 'cash', label: `Take the guest's fee for a cameo and share the credit`, risk: 'low', result: `A short, scripted cameo keeps the guest happy and the cameras rolling. Your cut is generous, and the match is smaller for it.`, effects: [{ money: 12000 }, { pop: 0.3 }, { conf: -1 }] },
    ],
  },
  // ============================================================ CHAMPIONSHIP
  {
    id: 'chp_title_shot_offered', category: 'championship', title: `A Title Shot Against {champ.name}`, weight: 3, major: true, cooldownDays: 200, maxPerCareer: 4, categoryCooldown: 12,
    cast: { champ: { pick: 'champion', class: 'world' }, boss: { pick: 'staff', role: 'gm' } },
    trigger: { holdsTitle: false, stat: { popularity: { gte: 35 } }, recent: { winsGte: 2 } },
    slots: { delivery: [`over a stack of production schedules`, `in a hallway, between two meetings`, `on a phone call you almost missed`], deadline: [`at the next big show`, `in three weeks`, `within the month`] },
    body: [`{boss.name} gives you the news {delivery}: you are getting a shot at {champ.name}'s title, to be settled {deadline}. Your recent run of wins has made the decision easy.`, `"Do not make me wait," {boss.first} says. The offer is real, but so is the clock, and how you accept sets the terms for what comes next.`],
    choices: [
      { id: 'accept', label: `Accept the shot and prepare for the fight`, risk: 'low', result: `You take the match as offered. The champion hears the news through the grapevine and does not smile.`, effects: [{ booking: { who: 'champ', type: 'singles', stakes: 'title' } }, { rel: { who: 'champ', heat: 6 } }, { pop: 0.5 }, { conf: 3 }] },
      { id: 'promise', label: `Accept and promise the world you will win`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.6, confidence: 0.3 }, text: `Your promise roars through the building. The hype for the match doubles overnight.`, effects: [{ booking: { who: 'champ', type: 'singles', stakes: 'title' } }, { promise: { kind: 'win_title', who: 'champ', text: `I will take the title from {champ.name}`, deadlineDays: 45 } }, { pop: 1.2 }, { conf: 4 }, { rivalry: { who: 'champ', heat: 10 } }] },
        { weight: 1, text: `The promise lands awkwardly and the champion's allies seize on it. The pressure is on, and the crowd is mixed.`, effects: [{ booking: { who: 'champ', type: 'singles', stakes: 'title' } }, { promise: { kind: 'win_title', who: 'champ', text: `I will take the title from {champ.name}`, deadlineDays: 45 } }, { pop: 0.1 }, { conf: -2 }] } ] },
      { id: 'stip', label: `Demand a no disqualification match for the title`, risk: 'med', result: `You tell {boss.first} you want no loopholes. The office agrees, and the champion has to answer.`, effects: [{ booking: { who: 'champ', type: 'no_dq', stakes: 'title' } }, { rivalry: { who: 'champ', heat: 12 } }, { pop: 0.7 }, { fatigue: 8 }] },
      { id: 'wait', label: `Ask to wait until you are fully prepared`, risk: 'low', result: `You tell {boss.first} you want to be sharper. The office hears hesitation. The shot slips down the schedule, and so does the energy around you.`, effects: [{ pop: -0.4 }, { conf: -3 }, { fatigue: -8 }] },
    ],
  },
  {
    id: 'chp_rival_demands_shot', category: 'championship', title: `{rival.name} Wants the Belt`, weight: 3, major: true, cooldownDays: 150, maxPerCareer: 5, categoryCooldown: 10, memory: { role: 'rival', max: 1 },
    cast: { rival: { pick: 'rivalry', minHeat: 20, status: 'active' } },
    trigger: { holdsTitle: true },
    slots: { how: [`in a promo that makes the front office wince`, `with a signed petition from the locker room`, `through an open letter handed to the press`], claim: [`the best in the company`, `the only real challenger`, `the next champion`] },
    body: [`{rival.name} has put your title in {rival.their} sights {how}. {rival.they} calls {rival.them}self {claim} and demands a match.`, `You could ignore it, but the audience is already picking sides. Whatever you decide, the belt on your shoulder will take the blame or the credit.`],
    choices: [
      { id: 'accept', label: `Accept the challenge and defend your title`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4, confidence: 0.3 }, text: `You answer the call with a smile, and the crowd erupts. Both of you have a lot to prove.`, effects: [{ booking: { who: 'rival', type: 'singles', stakes: 'title' } }, { rivalry: { who: 'rival', heat: 8 } }, { pop: 0.8 }, { conf: 3 }] },
        { weight: 1, text: `The match is made, but the build is chaotic and the champion looks reactive.`, effects: [{ booking: { who: 'rival', type: 'singles', stakes: 'title' } }, { pop: 0.2 }, { conf: -2 }] } ] },
      { id: 'stall', label: `Stall: make {rival.first} earn it in other matches first`, risk: 'med', result: `You demand a qualifying run. The fans split over whether this is wise or cowardly, and {rival.first} sharpens the knife.`, effects: [{ rivalry: { who: 'rival', heat: 14 } }, { rel: { who: 'rival', heat: 10, respect: -3 } }, { pop: -0.2 }, { conf: 1 }] },
      { id: 'cage', label: `Accept, but inside a steel cage`, risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `A cage match built around the title is a spectacle the office loves. Your body will pay for it.`, effects: [{ booking: { who: 'rival', type: 'cage', stakes: 'title' } }, { pop: 1.0 }, { conf: 3 }, { fatigue: 14 }] },
        { weight: 1, text: `The cage plan is stuffed with spots that nearly get out of hand. You finish the match scarred.`, effects: [{ booking: { who: 'rival', type: 'cage', stakes: 'title' } }, { pop: 0.6 }, { fatigue: 16 }, { injury: { part: 'arms', severity: 1, days: 14 } }] } ] },
      { id: 'retain', label: `Promise to retain your title against everyone`, risk: 'high', result: `You tell the world nobody is taking your belt. It is a gutsy claim, and the cameras love it.`, effects: [{ promise: { kind: 'retain_title', text: `I will retain my title against all comers`, params: { defenses: 3 }, deadlineDays: 150 } }, { pop: 0.8 }, { conf: 3 }, { rivalry: { who: 'rival', heat: 6 } }] },
    ],
  },
  {
    id: 'chp_challenger_nowhere', category: 'championship', title: `A Challenger Nobody Saw Coming`, weight: 2, major: true, cooldownDays: 200, maxPerCareer: 3, categoryCooldown: 10,
    cast: { upstart: { pick: 'roster', tier: { lte: 1 }, sameBrand: true }, boss: { pick: 'staff', role: 'creative' } },
    trigger: { holdsTitle: true, stat: { popularity: { gte: 30 } } },
    slots: { story: [`a string of upsets in the opening matches`, `an impromptu hallway promo the office could not ignore`, `a surprise win over one of your friends`], urgency: [`the fans have started a chant`, `the sponsors have noticed`, `the network wants a fresh face`] },
    body: [`{boss.name} breaks the news: {upstart.name}, off {story}, will get a shot at your title. {urgency}.`, `"Nobody is scared of the belt anymore," {upstart.first} has been telling anyone who will listen. {upstart.they} is hungry, loose, and not afraid. You are the establishment, and the establishment has a lot to lose.`],
    choices: [
      { id: 'elevate', label: `Take the match and put the challenger over strong`, risk: 'med', result: `You work a generous, competitive match that builds {upstart.first}. You keep the belt, but the audience loves the new name nearly as much as the old.`, effects: [{ booking: { who: 'upstart', type: 'singles', stakes: 'title' } }, { rel: { who: 'upstart', respect: 10, trust: 6 } }, { pop: 0.4 }, { conf: 1 }] },
      { id: 'crush', label: `Squash the challenger to protect your reign`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `You send a message to the entire roster. The champion is a wall. The fans are impressed, but some tire of watching a bully.`, effects: [{ booking: { who: 'upstart', type: 'singles', stakes: 'title' } }, { rel: { who: 'upstart', fear: 8, respect: -4, heat: 8 } }, { pop: 0.3 }, { conf: 4 }] },
        { weight: 1, text: `The squash comes off as cruel, and the crowd rallies behind the upstart.`, effects: [{ booking: { who: 'upstart', type: 'singles', stakes: 'title' } }, { rel: { who: 'upstart', heat: 10 } }, { pop: -0.6 }, { conf: -1 }] } ] },
      { id: 'mentor', label: `Take the challenger under your wing before the match`, risk: 'low', result: `You offer advice, a gym session, a moment of respect. The match becomes a mentor-versus-student story with real heart.`, effects: [{ event: { type: 'mentorship', participants: ['upstart'], summary: `Mentored {upstart.name} ahead of a title match.`, data: { byPlayer: true } } }, { booking: { who: 'upstart', type: 'singles', stakes: 'title' } }, { rel: { who: 'upstart', trust: 14, respect: 12, affinity: 10 } }, { fatigue: 6 }, { pop: 0.5 }] },
      { id: 'refuse', label: `Refuse the match as beneath a champion`, risk: 'high', result: `You say the champion does not defend against unknowns. The office is annoyed, and the fans are more so.`, effects: [{ pop: -0.9 }, { conf: 2 }, { rel: { who: 'upstart', heat: 12, respect: -6 } }] },
    ],
  },
  {
    id: 'chp_briefcase_stalker', category: 'championship', title: `{cashin.name} Is Circling With a Briefcase`, weight: 3, major: true, cooldownDays: 200, maxPerCareer: 3, categoryCooldown: 10, contexts: ['weekly', 'post_match', 'post_show'],
    cast: { cashin: { pick: 'roster', tier: { gte: 2, lte: 3 }, alignment: 'heel' } },
    trigger: { minYear: 2005, holdsTitle: true, stat: { fatigue: { gte: 25 } } },
    slots: { place: [`the shadows at the end of the tunnel`, `a corner of the parking lot`, `the empty announce desk`], rumour: [`after the main event`, `the moment the lights go down`, `when you are at your most exhausted`] },
    body: [`You see {cashin.name} in {place}, gripping a locked briefcase and watching you like someone watching a clock. Everyone knows what is inside: a guaranteed title match, to be redeemed whenever {cashin.they} wants.`, `Rumor says it will be cashed in {rumour}. You are beaten up and still have a belt to hold.`],
    choices: [
      { id: 'confront', label: `Confront {cashin.them} and dare {cashin.them} to try`, risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.5, mic: 0.3 }, text: `You step into {cashin.first}'s space and say your piece. The standoff is tense, public and perfect television.`, effects: [{ rivalry: { who: 'cashin', heat: 14 } }, { rel: { who: 'cashin', fear: 4, heat: 10 } }, { pop: 0.8 }, { conf: 3 }] },
        { weight: 1, text: `{cashin.first} smirks and walks away without a word. You look like you have been rattled.`, effects: [{ rel: { who: 'cashin', respect: -3 } }, { conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'avoid', label: `Avoid {cashin.them} and stay in public view`, risk: 'low', result: `You keep security close and your schedule tight. It is an exhausting way to live, but the title stays safe for now.`, effects: [{ fatigue: 8 }, { conf: -2 }, { pop: -0.1 }] },
      { id: 'bait', label: `Bait {cashin.first} into cashing in early, on your terms`, risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.5, confidence: 0.3 }, text: `You stage a moment of weakness, and {cashin.first} takes the bait. You retain in front of a stunned arena.`, effects: [{ booking: { who: 'cashin', type: 'singles', stakes: 'title' } }, { rivalry: { who: 'cashin', heat: 18 } }, { pop: 1.3 }, { conf: 5 }, { fatigue: 12 }] },
        { weight: 2, text: `{cashin.first} reads the bait and waits. You have made yourself a bigger target for nothing.`, effects: [{ pop: -0.2 }, { conf: -3 }, { fatigue: 8 }, { rel: { who: 'cashin', heat: 6 } }] } ] },
      { id: 'pre_empt', label: `Ask the office to book the match before it is cashed in`, risk: 'med', result: `You push the office to force the issue. The match is booked on your terms, but it looks like you blinked.`, effects: [{ booking: { who: 'cashin', type: 'singles', stakes: 'title' } }, { pop: -0.1 }, { conf: 2 }, { rel: { who: 'cashin', respect: 3 } }] },
    ],
  },
  {
    id: 'chp_asked_to_drop', category: 'championship', title: `The Office Wants You to Drop the Title`, weight: 3, major: true, cooldownDays: 250, maxPerCareer: 3, categoryCooldown: 15,
    cast: { successor: { pick: 'roster', tier: { gte: 2, lte: 4 } }, boss: { pick: 'staff', role: 'creative' } },
    trigger: { holdsTitle: true, stat: { daysChampion: { gte: 60 } } },
    slots: { reason: [`the new direction`, `a pay-per-view build`, `fan fatigue`, `an upcoming film release`], softener: [`a long hug`, `a promise of a rematch`, `a tray of expensive dinners`] },
    body: [`{boss.name} looks like someone delivering bad news with the polite face already on. For {reason}, the title will move to {successor.name} at the next show, and it is your job to do the honors.`, `"It is nothing personal," {boss.first} says, and offers {softener}. The belt is the highlight of your career, and it is also, in the end, the company's property.`],
    choices: [
      { id: 'graceful', label: `Hand it over gracefully and make the loss look great`, risk: 'low', result: `You drop the belt in a clean, thrilling finish. {successor.first} gets the moment, and you get the thanks of the locker room.`, effects: [{ rel: { who: 'successor', respect: 10, trust: 8 } }, { pop: 0.4 }, { conf: -3 }] },
      { id: 'bargain', label: `Agree only for a rematch clause and a bigger payday`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.4, charisma: 0.3 }, text: `{boss.first} signs off on the rematch and a check to match. You lose the belt but keep your seat at the table.`, effects: [{ money: 12000 }, { pop: 0.2 }, { conf: 1 }, { rel: { who: 'successor', respect: 2 } }] },
        { weight: 1, text: `The office hears the demand and hears ego. You get the check, but a cold front settles over the room.`, effects: [{ money: 12000 }, { conf: -2 }, { pop: -0.2 }] } ] },
      { id: 'resist', label: `Fight the decision and plead to keep the title`, risk: 'high', outcomes: [
        { weight: 1, bonus: { popularity: 0.5, confidence: 0.3 }, text: `The office is surprised by how popular you are and agrees to postpone the change. {successor.first} is not pleased.`, effects: [{ pop: 0.4 }, { conf: 4 }, { rel: { who: 'successor', heat: 10, respect: -4 } }] },
        { weight: 2, text: `The plea goes nowhere, and it gets back to the locker room. You lose the belt and a little dignity.`, effects: [{ pop: -0.6 }, { conf: -4 }, { rel: { who: 'successor', heat: 6 } }] } ] },
      { id: 'send_off', label: `Request a big send-off promo on the night`, risk: 'low', result: `You get your goodbye on live television, and the fans are on their feet. You lose the belt but win the room.`, effects: [{ pop: 0.8 }, { conf: 1 }, { rel: { who: 'successor', respect: 4 } }] },
    ],
  },
  {
    id: 'chp_long_reign_pressure', category: 'championship', title: `The Weight of a Long Reign`, weight: 2, major: true, cooldownDays: 250, maxPerCareer: 3, categoryCooldown: 15,
    cast: { boss: { pick: 'staff', role: 'executive' }, media: { pick: 'media', kind: 'journalist' } },
    trigger: { holdsTitle: true, stat: { daysChampion: { gte: 150 } } },
    slots: { complaint: [`stale`, `predictable`, `a one-note act`], fix: [`a surprise opponent`, `a heel turn`, `a short break`, `a fresh gimmick`] },
    body: [`{media.name} writes that your reign has become {complaint}, and {boss.name} forwards the column with a short note: "Fans are noticing."`, `The belt is heavier than it looks. The office suggests {fix}, but every fix has a cost.`],
    choices: [
      { id: 'reinvent', label: `Reinvent your approach and take a creative risk`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, mic: 0.4 }, text: `You throw out a script, try something new, and the crowd bites. The criticism fades into a "comeback" story.`, effects: [{ pop: 1.1 }, { conf: 4 }, { fatigue: 8 }] },
        { weight: 1, text: `The experiment confuses fans, and they wait for the old champion to come back.`, effects: [{ pop: -0.5 }, { conf: -3 }, { fatigue: 8 }] } ] },
      { id: 'defend', label: `Defend against every serious challenger in a gauntlet`, risk: 'med', result: `You defend the title again and again over the month. The fans respect the grind, and your body does not.`, effects: [{ promise: { kind: 'retain_title', text: `I will face every challenger and keep my title`, params: { defenses: 3 }, deadlineDays: 90 } }, { pop: 0.7 }, { conf: 3 }, { fatigue: 22 }] },
      { id: 'break', label: `Ask for a short break to recharge`, risk: 'low', result: `The office agrees to a lighter schedule for two weeks. You return sharper but less visible.`, effects: [{ fatigue: -18 }, { pop: -0.4 }, { conf: 1 }] },
      { id: 'ignore', label: `Ignore the column and carry on`, risk: 'med', result: `You shrug and stay the course. The silence reads as arrogance to some, steadiness to others.`, effects: [{ pop: -0.2 }, { conf: 2 }, { money: 1500 }] },
    ],
  },
  {
    id: 'chp_defence_milestone', category: 'championship', title: `Another Successful Defense`, weight: 2, major: true, cooldownDays: 250, maxPerCareer: 3, categoryCooldown: 12,
    cast: { host: { pick: 'media', kind: 'interviewer' } },
    trigger: { holdsTitle: true, stat: { defenses: { gte: 4 } } },
    slots: { format: [`a prime-time sit-down`, `a stadium-side interview`, `a live Q&A with fans`], challenge: [`an open challenge to anyone`, `a defiant list of names`, `a calm refusal to name anyone`] },
    body: [`{host.name} has you for {format} after yet another successful defense. The question is not whether you will keep winning, but what you will do about the line of challengers forming behind you.`, `You can offer {challenge}. The crowd is hanging on every word.`],
    choices: [
      { id: 'open', label: `Issue an open challenge to the entire locker room`, risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.5, mic: 0.4 }, text: `The open challenge sets the show alight. Nobody dares step forward on night one, but the next week is yours.`, effects: [{ pop: 1.1 }, { conf: 4 }, { fatigue: 10 }] },
        { weight: 1, text: `A big name accepts, and the match is ugly. You retain, but at a cost.`, effects: [{ pop: 0.4 }, { conf: 1 }, { fatigue: 18 }, { injury: { part: 'legs', severity: 1, days: 10 } }] } ] },
      { id: 'list', label: `Name the challengers you respect, in order`, risk: 'low', result: `You name three people and say why. The locker room hears it as respect, and the fans as a map.`, effects: [{ pop: 0.5 }, { conf: 2 }] },
      { id: 'dismiss', label: `Say nobody is in your league`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5 }, text: `Your swagger polarizes the crowd, and the heel energy is real. The ratings spike.`, effects: [{ pop: 0.8 }, { conf: 4 }] },
        { weight: 1, text: `The claim lands as hollow arrogance, and a long line of challengers snap back.`, effects: [{ pop: -0.5 }, { conf: -2 }] } ] },
      { id: 'humble', label: `Credit your opponents and the fans`, risk: 'low', result: `A warm, grounded answer lifts the room without lighting any fires.`, effects: [{ pop: 0.4 }, { conf: 1 }, { fatigue: -3 }] },
    ],
  },
  {
    id: 'chp_unification_talks', category: 'championship', title: `Unification Talks With {other.name}`, weight: 2, major: true, cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 15,
    cast: { other: { pick: 'champion', class: 'secondary' }, boss: { pick: 'staff', role: 'executive' } },
    trigger: { minYear: 1990, holdsTitle: true, stat: { popularity: { gte: 40 } } },
    slots: { framing: [`a historic night`, `a battle of the two champions`, `a necessary simplification`], terms: [`the stronger belt survives`, `the loser keeps their belt in a lesser role`, `both belts will be absorbed into one`] },
    body: [`{boss.name} wants to bring your title and {other.name}'s together for {framing}. The proposal is that {terms}.`, `"One belt, one champion," {boss.first} says, as if it were simple. A prestige play, a storyline gold mine and a gamble with your hard-won position.`],
    choices: [
      { id: 'unify', label: `Agree to the unification match`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4, confidence: 0.3 }, text: `You and {other.first} produce a night to remember, with a finish that justifies the build.`, effects: [{ booking: { who: 'other', type: 'singles', stakes: 'title' } }, { rel: { who: 'other', respect: 8 } }, { pop: 1.0 }, { conf: 4 }, { fatigue: 10 }] },
        { weight: 1, text: `The match falls short of the build, and the finish is muddled. Nobody quite agrees what happened.`, effects: [{ booking: { who: 'other', type: 'singles', stakes: 'title' } }, { rel: { who: 'other', respect: 2 } }, { pop: 0.2 }, { fatigue: 10 }] } ] },
      { id: 'terms', label: `Demand the right to name the stipulation`, risk: 'med', result: `The office bows to your pull and makes the match a No DQ bout. {other.first} is irritated but not surprised.`, effects: [{ booking: { who: 'other', type: 'no_dq', stakes: 'title' } }, { rel: { who: 'other', heat: 8 } }, { pop: 0.6 }, { conf: 2 }] },
      { id: 'refuse', label: `Refuse: your belt is the crown`, risk: 'high', result: `You dismiss the idea, saying the lesser title should earn the right. The press calls you stubborn.`, effects: [{ pop: -0.3 }, { conf: 3 }, { rel: { who: 'other', heat: 10, respect: -5 } }] },
      { id: 'delay', label: `Stall until you have a better position`, risk: 'low', result: `You slow-walk the talks, and the office loses interest. The belt stays yours, for now.`, effects: [{ conf: 1 }, { pop: -0.2 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'chp_after_the_belt', category: 'championship', title: `Life After the Title`, weight: 2, major: true, cooldownDays: 200, maxPerCareer: 3, categoryCooldown: 15,
    cast: { boss: { pick: 'staff', role: 'creative' }, champ: { pick: 'champion', class: 'world' } },
    trigger: { holdsTitle: false, stat: { titleWins: { gte: 1 } }, recent: { lossesGte: 2 } },
    slots: { feel: [`a hole in the middle of your week`, `a kind of silence you have not heard in months`, `a plain, empty locker room`], pitch: [`a fresh program`, `a mentor role`, `a lengthy rest`] },
    body: [`Without a belt on your shoulder, there is {feel}. The gold is on {champ.name}'s shoulder now, and the agents have started calling you by your first name.`, `{boss.name} offers {pitch}. The thing about losing a title is that every choice you make next gets read as a reaction to it.`],
    choices: [
      { id: 'rematch', label: `Demand a rematch and reclaim what is yours`, risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.5, popularity: 0.3 }, text: `You make a compelling case for a second chance. The office books it, and the build writes itself.`, effects: [{ booking: { who: 'champ', type: 'singles', stakes: 'title' } }, { promise: { kind: 'win_title', who: 'champ', text: `I will win my title back from {champ.name}`, deadlineDays: 90 } }, { pop: 0.8 }, { conf: 3 }] },
        { weight: 1, text: `The request is shelved and a few eyebrows go up at your insistence.`, effects: [{ pop: -0.2 }, { conf: -3 }] } ] },
      { id: 'grace', label: `Take a gracious step back and lead by example`, risk: 'low', result: `You congratulate the champion, offer help to younger wrestlers, and keep your name warm. The locker room approves.`, effects: [{ rel: { who: 'champ', respect: 8, trust: 5 } }, { pop: 0.3 }, { conf: -1 }] },
      { id: 'bitter', label: `Lash out at the booking and the champion`, risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.5 }, text: `Your rant lands as raw and real, and fans pick up on it. A new kind of heat begins.`, effects: [{ pop: 0.7 }, { rivalry: { who: 'champ', heat: 16 } }, { rel: { who: 'champ', heat: 12 } }, { conf: 2 }] },
        { weight: 2, text: `The rant is aimed at the wrong people and the office takes notes. You look sour.`, effects: [{ pop: -0.7 }, { conf: -4 }, { rel: { who: 'champ', heat: 8 } }] } ] },
      { id: 'reset', label: `Take time away to recharge and rebuild`, risk: 'low', result: `You step back from the spotlight and work on training, writing and the small details. It is a reset, but it is also a pause.`, effects: [{ fatigue: -16 }, { conf: 2 }, { pop: -0.4 }, { attr: { name: 'technical', delta: 1 } }] },
    ],
  },
  {
    id: 'chp_belt_duties', category: 'championship', title: `The Champion's Calendar`, weight: 2, major: true, cooldownDays: 200, maxPerCareer: 3, categoryCooldown: 10,
    cast: { boss: { pick: 'staff', role: 'executive' } },
    trigger: { holdsTitle: true, stat: { fatigue: { gte: 25 } } },
    slots: { demand: [`a children's hospital visit`, `a sponsor luncheon`, `a morning-show tour`, `a mall appearance with a long line`], conflict: [`the same morning as a training session`, `the day before a title defense`, `an hour after you land from another city`] },
    body: [`The champion's schedule is a monster. {boss.name} has added {demand}, scheduled {conflict}.`, `"The title never clocks out," {boss.first} reminds you. Good for the company, good for the fans, and brutal for your body, it is a calendar you can say yes to for only so long.`],
    choices: [
      { id: 'all', label: `Say yes to everything and push through`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.3 }, text: `You do it all with a smile. The office thinks you are a dream champion, and the fans are charmed.`, effects: [{ pop: 0.9 }, { money: 4000 }, { fatigue: 20 }, { conf: 2 }] },
        { weight: 1, text: `By the third day, you are sleepwalking and miss a cue on live television.`, effects: [{ pop: 0.1 }, { money: 4000 }, { fatigue: 24 }, { conf: -3 }] } ] },
      { id: 'trim', label: `Trim the schedule to the engagements that matter`, risk: 'low', result: `You pick the three that count and let the rest go. {boss.first} is mildly annoyed but understands.`, effects: [{ pop: 0.3 }, { fatigue: 6 }, { conf: 1 }] },
      { id: 'delegate', label: `Send a stand-in to the less important events`, risk: 'med', result: `The stand-ins do a fine job, but the fans who wanted you notice. It saves energy and costs goodwill.`, effects: [{ pop: -0.4 }, { fatigue: -6 }, { conf: 1 }, { money: -1500 }] },
      { id: 'refuse', label: `Refuse the extras: your job is in the ring`, risk: 'high', result: `You tell {boss.first} that the belt gets defended, not paraded. The office is not thrilled, but the matches get sharper.`, effects: [{ conf: 3 }, { fatigue: -10 }, { pop: -0.6 }, { money: -3000 }] },
    ],
  },
  {
    id: 'chp_champion_dismisses', category: 'championship', title: `{champ.name} Brushes You Off`, weight: 3, major: true, cooldownDays: 150, maxPerCareer: 4, categoryCooldown: 10,
    cast: { champ: { pick: 'champion', class: 'world' } },
    trigger: { holdsTitle: false, stat: { popularity: { gte: 35 } } },
    slots: { setting: [`on live television`, `at a press conference`, `in front of the whole locker room`], insult: [`"a nice story"`, `"a support act"`, `"not even a footnote"`] },
    body: [`{setting}, {champ.name} is asked about the line of contenders behind the title. When your name comes up, {champ.they} laughs and calls you {insult}.`, `The room goes quiet. A response is expected, and the way you choose to give it will define your next month.`],
    choices: [
      { id: 'promo', label: `Answer on the mic with a career-best promo`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.7, charisma: 0.3 }, text: `You rip the insult apart in front of a screaming crowd. By the end, even the champion has stopped laughing.`, effects: [{ rivalry: { who: 'champ', heat: 14 } }, { rel: { who: 'champ', heat: 10, respect: 4 } }, { pop: 1.2 }, { conf: 4 }, { event: { type: 'promo_delivered', participants: ['champ'], summary: `Answered {champ.name}'s dismissal on the mic.`, data: { quality: { base: 66, mic: 0.6, charisma: 0.3 }  } } }] },
        { weight: 1, text: `You trip over the key line and the promo drains away. Boos follow.`, effects: [{ rivalry: { who: 'champ', heat: 8 } }, { pop: -0.5 }, { conf: -4 }] } ] },
      { id: 'attack', label: `Ambush {champ.them} backstage`, risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.4, confidence: 0.3 }, text: `You land the first blows. By the time security arrives, a story is born.`, effects: [{ rivalry: { who: 'champ', heat: 20 } }, { rel: { who: 'champ', heat: 16, fear: 4 } }, { pop: 0.8 }, { conf: 3 }, { fatigue: 5 }] },
        { weight: 1, text: `The champion was ready for you. You limp away with a bruised ribcage and a lecture.`, effects: [{ rivalry: { who: 'champ', heat: 14 } }, { pop: -0.3 }, { conf: -3 }, { fatigue: 8 }] } ] },
      { id: 'request', label: `Take it up with the office and request a match`, risk: 'low', result: `You skip the theatrics and ask for a shot. The office likes your professionalism and will consider it.`, effects: [{ rel: { who: 'champ', respect: 3 } }, { pop: 0.2 }, { conf: 1 }] },
      { id: 'ignore', label: `Let it slide and let the results do the talking`, risk: 'low', result: `You smile, say nothing, and win your next three matches. It takes a while, but the quiet answer is the loudest.`, effects: [{ conf: 2 }, { pop: -0.1 }, { rel: { who: 'champ', respect: 4 } }] },
    ],
  },
  {
    id: 'chp_tag_ambition', category: 'championship', title: `{partner.name} Wants the Tag Titles`, weight: 2, major: true, cooldownDays: 250, maxPerCareer: 3, categoryCooldown: 12,
    cast: { partner: { pick: 'roster', tier: { gte: 1, lte: 3 }, sameBrand: true }, champ: { pick: 'champion', class: 'tag' } },
    trigger: { holdsTitle: false, stat: { popularity: { gte: 25 } } },
    slots: { pitch: [`a team with a snappy name`, `a cheap, scrappy duo that fights dirty`, `a stately partnership built on trust`], reason: [`Neither of you is getting a singles push`, `The tag division is thin`, `The champions are holding everyone back`] },
    body: [`{partner.name} proposes {pitch}. "{reason}," {partner.they} says, "and the tag belts are the fastest route to a pay-per-view card."`, `The idea has merit, and the current champions have noticed. But a tag team is a marriage, and singles gold is lonely.`],
    choices: [
      { id: 'team_up', label: `Team up and go after the tag championships`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.3, charisma: 0.3 }, text: `Your chemistry clicks, and the first few matches make the crowd smile. The tag champions start to look over their shoulders.`, effects: [{ event: { type: 'alliance_formed', participants: ['partner'], summary: `Formed a tag team with {partner.name}.`, data: {} } }, { booking: { who: 'champ', type: 'tag', stakes: 'title' } }, { rel: { who: 'partner', trust: 10, affinity: 8 } }, { pop: 0.8 }, { conf: 3 }] },
        { weight: 1, text: `The partnership never quite finds its rhythm, and the sloppy matches keep the team in the lower card.`, effects: [{ event: { type: 'alliance_formed', participants: ['partner'], summary: `Formed a shaky tag team with {partner.name}.`, data: {} } }, { rel: { who: 'partner', trust: 4 } }, { pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'singles', label: `Decline: your future is as a singles star`, risk: 'low', result: `You tell {partner.first} you are better alone. {partner.they} nods, hurt but understanding.`, effects: [{ rel: { who: 'partner', trust: -4, respect: 2 } }, { conf: 2 }, { pop: 0.1 }] },
      { id: 'one_off', label: `Agree to one tag match, no strings`, risk: 'low', result: `A one-night partnership keeps the door open without a long commitment. The match is solid, and {partner.first} appreciates the compromise.`, effects: [{ rel: { who: 'partner', trust: 5, respect: 4 } }, { pop: 0.3 }, { fatigue: 5 }] },
      { id: 'steal', label: `Go after the tag champions as a singles challenger`, risk: 'high', result: `You ignore {partner.first}'s plan and make your own pitch to the office. It is gutsy, and {partner.they} will not forget it.`, effects: [{ booking: { who: 'champ', type: 'singles', stakes: 'title' } }, { rel: { who: 'partner', trust: -12, heat: 10 } }, { pop: 0.4 }, { conf: 2 }] },
    ],
  },
  {
    id: 'chp_midcard_belt', category: 'championship', title: `The Forgotten Championship`, weight: 2, major: true, cooldownDays: 200, maxPerCareer: 3, categoryCooldown: 12,
    cast: { holder: { pick: 'champion', class: 'secondary' }, boss: { pick: 'staff', role: 'creative' } },
    trigger: { holdsTitle: false, stat: { popularity: { gte: 20, lte: 65 } } },
    slots: { state: [`a tarnished belt that nobody has defended in months`, `a proud title being treated like a prop`, `a championship with a good name and no storyline`], prize: [`a real feud`, `a real spot on the card`, `a real shot at prestige`] },
    body: [`The secondary title sits on {holder.name}'s shoulder, {state}. {boss.name} suggests that it could be a ladder for the right wrestler, bringing {prize}.`, `"Nobody pretends it is the world title," {boss.first} admits. "But it is a belt, and belts mean booking."`],
    choices: [
      { id: 'chase', label: `Chase the belt and rebuild its prestige`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4, charisma: 0.3 }, text: `You and {holder.first} stage a feud that makes the title matter again. Fans start tuning in for the secondary belt.`, effects: [{ booking: { who: 'holder', type: 'singles', stakes: 'title' } }, { rivalry: { who: 'holder', heat: 10 } }, { pop: 0.9 }, { conf: 3 }] },
        { weight: 1, text: `The attempt goes sideways. The crowds do not care, and you get nothing but a few polite claps.`, effects: [{ booking: { who: 'holder', type: 'singles', stakes: 'title' } }, { pop: 0.1 }, { conf: -2 }] } ] },
      { id: 'aim_higher', label: `Wait for a world title chance instead`, risk: 'med', result: `You turn the pitch down, saying you are aiming higher. The office makes a note and moves on.`, effects: [{ conf: 2 }, { pop: -0.2 }] },
      { id: 'steal_spotlight', label: `Cut a promo calling the belt a joke to rally the fans`, risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.6 }, text: `You say what everyone has been thinking, and the crowd cheers. {holder.first} fires back and the feud takes off.`, effects: [{ rivalry: { who: 'holder', heat: 18 } }, { rel: { who: 'holder', heat: 14 } }, { pop: 1.0 }, { conf: 3 }] },
        { weight: 2, text: `The office does not like having its belt mocked. A producer cools your next few spots.`, effects: [{ pop: -0.5 }, { conf: -3 }, { rel: { who: 'holder', heat: 8 } }] } ] },
      { id: 'team', label: `Propose a unified storyline with {holder.name}`, risk: 'low', result: `You and {holder.first} map out a story with mutual benefit. It is smart, safe, and a little too tidy.`, effects: [{ rel: { who: 'holder', trust: 8, respect: 6 } }, { pop: 0.4 }, { conf: 1 }] },
    ],
  },
  {
    id: 'chp_champion_leverage', category: 'championship', title: `{champ.name} Wants to Call the Match`, weight: 2, major: true, cooldownDays: 200, maxPerCareer: 3, categoryCooldown: 10,
    cast: { champ: { pick: 'champion', class: 'world' }, boss: { pick: 'staff', role: 'producer' } },
    trigger: { holdsTitle: false, stat: { popularity: { gte: 30 } } },
    slots: { demand: [`work a slower, safer style`, `lose the first fall cleanly`, `cut your best spots out of the match`], reason: [`the champion's back is acting up`, `the champion knows the camera angles and you do not`, `the champion has pull and enjoys using it`] },
    body: [`Ahead of any match for the world title, {champ.name} sits you down for a talk: if it happens, you will {demand}. {boss.name} confirms that the champion has leverage, because {reason}.`, `It is reasonable, up to a point. It is also a slow erosion of your edge.`],
    choices: [
      { id: 'defer', label: `Defer to the champion and keep the peace`, risk: 'low', result: `You do as asked and the match works well enough. {champ.first} is grateful and the locker room sees a professional.`, effects: [{ rel: { who: 'champ', respect: 8, trust: 6 } }, { pop: 0.1 }, { conf: -3 }] },
      { id: 'compromise', label: `Negotiate a middle path`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, mic: 0.3 }, text: `You give a little and take a little. The match keeps your best spots and the champion keeps the pace.`, effects: [{ rel: { who: 'champ', respect: 5 } }, { pop: 0.5 }, { conf: 2 }] },
        { weight: 1, text: `Negotiations stall and the match is clumsy as a result.`, effects: [{ rel: { who: 'champ', heat: 6 } }, { pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'refuse', label: `Refuse and go to the producer`, risk: 'high', outcomes: [
        { weight: 1, bonus: { popularity: 0.4, confidence: 0.4 }, text: `{boss.first} listens to you, and the champion is told to adapt. It is a rare win over a veteran's leverage.`, effects: [{ rel: { who: 'champ', heat: 12, respect: -4 } }, { pop: 0.5 }, { conf: 4 }] },
        { weight: 2, text: `The producer sides with the champion. You have made an enemy and gained nothing.`, effects: [{ rel: { who: 'champ', heat: 12 } }, { pop: -0.4 }, { conf: -4 }] } ] },
      { id: 'go_rogue', label: `Say yes, then do it your way in the ring`, risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.5, confidence: 0.3 }, text: `You deviate on the night, the crowd goes wild, and the champion has to go along. It is a thrilling match and a dangerous move.`, effects: [{ pop: 1.2 }, { conf: 4 }, { rel: { who: 'champ', trust: -14, heat: 14 } }, { rivalry: { who: 'champ', heat: 10 } }] },
        { weight: 2, text: `The champion catches you deviating and reins it in so hard that you look foolish. Backstage is cold afterwards.`, effects: [{ pop: -0.5 }, { conf: -4 }, { rel: { who: 'champ', trust: -12, heat: 10 } }] } ] },
    ],
  },
  {
    id: 'chp_defend_hurt', category: 'championship', title: `Defending With a Bad Body`, weight: 3, major: true, cooldownDays: 200, maxPerCareer: 3, categoryCooldown: 12,
    cast: { doctor: { pick: 'staff', role: 'doctor' }, boss: { pick: 'staff', role: 'gm' } },
    trigger: { holdsTitle: true, injured: true },
    slots: { hurt: [`a torn rotator cuff`, `a deep bone bruise in your leg`, `three cracked ribs`], defence: [`next week`, `at the upcoming pay-per-view`, `in two days`] },
    body: [`{doctor.name} lays out the facts: {hurt}, and it will not heal before your next title defense {defence}. Working through it risks turning a short layoff into a long one.`, `"Whatever you decide, we will back it," {boss.name} says. But if you step aside, the belt may not be yours when you return.`],
    choices: [
      { id: 'defend', label: `Defend the title anyway and work through the pain`, risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.4, overall: 0.3 }, text: `You walk in on borrowed willpower and leave with the belt. The crowd worships you, and the doctors do not.`, effects: [{ pop: 1.3 }, { conf: 5 }, { fatigue: 20 }] },
        { weight: 1, text: `Midway through, something snaps. You finish the bout, but the injury is far worse than it was.`, effects: [{ pop: 0.5 }, { fatigue: 24 }, { injury: { part: 'torso', severity: 2, days: 45 } }, { conf: -3 }] } ] },
      { id: 'adjust', label: `Defend, but ask for a short, protective finish`, risk: 'med', result: `The agents book a quick finish and an angle to cover the shortfall. The title stays, the match is short, and the audience mostly accepts it.`, effects: [{ pop: 0.3 }, { conf: 1 }, { fatigue: 8 }] },
      { id: 'vacate', label: `Step aside and let the title be vacated`, risk: 'low', result: `You hand the belt to the office. The fans are sympathetic, but sympathy is no substitute for a title.`, effects: [{ pop: -0.3 }, { conf: -4 }, { fatigue: -18 }] },
      { id: 'hide', label: `Hide the injury from the office and fans`, risk: 'high', outcomes: [
        { weight: 1, text: `Nobody notices. You retain, and the secret gives you a thrilling private pride.`, effects: [{ pop: 0.8 }, { conf: 3 }, { fatigue: 20 }] },
        { weight: 2, text: `The doctor finds out. The office is furious, and you lose trust as well as time.`, effects: [{ pop: -0.4 }, { conf: -4 }, { fatigue: 18 }, { injury: { part: 'legs', severity: 1, days: 20 } }] } ] },
    ],
  },
  // ============================================================ OPPORTUNITY
  {
    id: 'opp_main_event_nontitle', category: 'opportunity', title: `Main Event Slot, No Belt on the Line`, weight: 3, major: true, cooldownDays: 200, maxPerCareer: 4, categoryCooldown: 12,
    cast: { star: { pick: 'roster', tier: { gte: 3 }, sameBrand: true }, boss: { pick: 'staff', role: 'gm' } },
    trigger: { stat: { popularity: { gte: 45 }, mainEvents: { lte: 3 } } },
    slots: { show: [`this week's main event`, `the final match of the next big show`, `a special-event headline slot`], reason: [`a star pulled out with an injury`, `the ratings need a spark`, `the office wants to see if you can carry the hour`] },
    body: [`{boss.name} wants you in {show} against {star.name}, because {reason}. No title is on the line, and the poster will not carry your name.`, `"No title, no poster, no excuses," {boss.first} says. A spotlight with a trapdoor: do it well and you are a main-event name. Do it badly and the office may not offer again.`],
    choices: [
      { id: 'accept', label: `Take the slot and treat it as the biggest night of your life`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.5, confidence: 0.3 }, text: `You and {star.first} tear the roof off. By the final minutes, the crowd is yours and the star is nodding in approval.`, effects: [{ booking: { who: 'star', type: 'singles' } }, { rel: { who: 'star', respect: 10 } }, { pop: 1.4 }, { conf: 5 }, { fatigue: 12 }] },
        { weight: 1, text: `The match is solid but uneventful, and the crowd stays in its seats. You get the credit for showing up, not for stealing the show.`, effects: [{ booking: { who: 'star', type: 'singles' } }, { rel: { who: 'star', respect: 4 } }, { pop: 0.4 }, { fatigue: 12 }] } ] },
      { id: 'demand_belt', label: `Ask for the title to be on the line`, risk: 'high', outcomes: [
        { weight: 1, bonus: { popularity: 0.5, mic: 0.4 }, text: `{boss.first} blinks. The office upgrades the match, and you have an enormous opportunity.`, effects: [{ booking: { who: 'star', type: 'singles', stakes: 'title' } }, { pop: 1.0 }, { conf: 4 }] },
        { weight: 2, text: `The office decides you are not ready for that call. The slot is reassigned.`, effects: [{ pop: -0.4 }, { conf: -4 }] } ] },
      { id: 'tag', label: `Suggest a tag match, so you are not alone out there`, risk: 'low', result: `The match becomes a tag bout. It is safer and still a main event, but the glory is shared.`, effects: [{ booking: { who: 'star', type: 'tag' } }, { rel: { who: 'star', respect: 2 } }, { pop: 0.6 }, { conf: 1 }] },
      { id: 'pass', label: `Turn it down and wait for a better setup`, risk: 'low', result: `You decline and say you want to earn a bigger slot. {boss.first} shrugs. The opportunity goes to someone else.`, effects: [{ pop: -0.4 }, { conf: -2 }, { fatigue: -6 }] },
    ],
  },
  {
    id: 'opp_asked_to_lose', category: 'opportunity', title: `Lose to {star.name} on the Big Show`, weight: 3, major: true, cooldownDays: 200, maxPerCareer: 4, categoryCooldown: 12,
    cast: { star: { pick: 'roster', tier: { gte: 3 } }, boss: { pick: 'staff', role: 'producer' } },
    trigger: { eventWithin: { kind: 'ple', days: 14 }, stat: { popularity: { gte: 30 } } },
    slots: { pitch: [`it is a favor to the whole card`, `it protects a big angle`, `it is a business decision`], offer: [`a sizeable bonus`, `a better slot next time`, `a shot at the star's allies`] },
    body: [`{boss.name} walks you through the card: you are booked to lose to {star.name} at the pay-per-view. {pitch}, and in return you get {offer}.`, `"Clean, quick, televised," {boss.first} says. The loss will also sit on your record.`],
    choices: [
      { id: 'accept', label: `Accept and make {star.first} look like a world-beater`, risk: 'low', result: `You sell every move and lose with grace. {star.first} owes you a favor, and you earn a quiet reputation.`, effects: [{ rel: { who: 'star', respect: 10, trust: 8 } }, { money: 6000 }, { pop: 0.1 }, { conf: -3 }] },
      { id: 'bargain', label: `Accept but demand a rematch clause`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.3, charisma: 0.3 }, text: `{boss.first} agrees, and a rematch is pencilled in. It is a smart trade that costs you nothing but ego.`, effects: [{ rel: { who: 'star', respect: 4 } }, { money: 3000 }, { pop: 0.3 }, { conf: 1 }] },
        { weight: 1, text: `The clause is promised but never written. You lose the match and nothing else comes of it.`, effects: [{ money: 3000 }, { conf: -3 }] } ] },
      { id: 'compete', label: `Ask for a competitive loss that makes you look strong`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4, popularity: 0.3 }, text: `You lose, but you leave the audience thinking you nearly won. The sympathy is genuine.`, effects: [{ rel: { who: 'star', respect: 6 } }, { pop: 0.8 }, { conf: 2 }, { fatigue: 8 }] },
        { weight: 1, text: `The star does not want to share the stage. You are overshadowed.`, effects: [{ rel: { who: 'star', heat: 6 } }, { pop: -0.1 }, { conf: -2 }, { fatigue: 8 }] } ] },
      { id: 'refuse', label: `Refuse to lose`, risk: 'high', result: `You tell {boss.first} the loss is not worth the favor. The slot goes elsewhere, and so does a chunk of goodwill.`, effects: [{ pop: -0.3 }, { conf: 3 }, { rel: { who: 'star', respect: -6, heat: 8 } }, { money: -2000 }] },
    ],
  },
  {
    id: 'opp_new_brand_face', category: 'opportunity', title: `Be the Face of the New Direction`, weight: 2, major: true, cooldownDays: 400, maxPerCareer: 2, categoryCooldown: 20,
    cast: { exec: { pick: 'staff', role: 'executive' } },
    trigger: { minYear: 2002, brand: ['Raw'], stat: { popularity: { gte: 50 }, careerYears: { gte: 2 } } },
    slots: { launch: [`a flagship Friday broadcast`, `a reimagined roster built around new faces`, `a brand-new championship picture`], promise: [`a main-event spot every week`, `a say in your own booking`, `a guaranteed title run`] },
    body: [`{exec.name} invites you to lunch and gets to the point. The company is launching {launch} on the other brand and wants you as the centerpiece. The pitch: {promise}.`, `"Think about it over lunch," {exec.first} says. Leaving your current show means leaving a roster, a rhythm and some loyalties. Staying means hoping the offer comes again.`],
    choices: [
      { id: 'jump', label: `Move to the new brand and lead the charge`, risk: 'high', outcomes: [
        { weight: 2, bonus: { popularity: 0.4, confidence: 0.3 }, text: `The move is an instant event. Fans tune in to see you headline, and the company rewards the bet.`, effects: [{ brand: 'SmackDown' }, { pop: 1.3 }, { conf: 4 }, { money: 10000 }] },
        { weight: 1, text: `The brand struggles to find its audience, and you carry too much on your shoulders.`, effects: [{ brand: 'SmackDown' }, { pop: 0.2 }, { conf: -2 }, { fatigue: 12 }, { money: 10000 }] } ] },
      { id: 'terms', label: `Stay, and use the offer to renegotiate your deal`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.3, charisma: 0.3 }, text: `You leverage the interest and walk away with a better deal on your current show.`, effects: [{ money: 14000 }, { conf: 3 }, { pop: 0.3 }] },
        { weight: 1, text: `The executive sees through the maneuver and withdraws the offer entirely.`, effects: [{ money: 2000 }, { conf: -2 }, { pop: -0.2 }] } ] },
      { id: 'stay', label: `Decline out of loyalty to your current roster`, risk: 'low', result: `You turn down the offer. The locker room hears about it, and the loyalty is noticed and appreciated.`, effects: [{ conf: 2 }, { pop: 0.2 }, { fatigue: -3 }] },
      { id: 'stall', label: `Ask for time and shop the offer around`, risk: 'med', result: `The offer stays open for a month, then quietly closes. You gain nothing but information and a reputation for indecision.`, effects: [{ conf: -1 }, { pop: -0.2 }, { money: 1000 }] },
    ],
  },
  {
    id: 'opp_locker_room_vote', category: 'opportunity', title: `The Locker Room Wants a Voice`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 20,
    cast: { rep: { pick: 'roster', tier: { gte: 2, lte: 4 }, sameBrand: true }, boss: { pick: 'staff', role: 'gm' } },
    trigger: { stat: { careerYears: { gte: 2 }, popularity: { gte: 30 } } },
    slots: { issue: [`pay and travel`, `injury protection`, `how much time is protected for rest`], deadline: [`before the next tour`, `by the end of the month`, `in a week`] },
    body: [`A vote is brewing to pick a locker-room representative who can speak to {boss.name} about {issue}, and the decision lands {deadline}. {rep.name} is the front-runner, but a few veterans have quietly suggested you.`, `The job comes with respect, headaches, and a seat in rooms where bad news is delivered.`],
    choices: [
      { id: 'run', label: `Run for the role and fight for the roster`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.3 }, text: `Your speech wins over a crowded locker room. You take the post and hold your first meeting with management.`, effects: [{ rel: { who: 'rep', respect: -2, heat: 6 } }, { pop: 0.4 }, { conf: 5 }, { fatigue: 8 }] },
        { weight: 1, text: `You lose the vote, and the front-runner enjoys a little too much of it.`, effects: [{ rel: { who: 'rep', heat: 4 } }, { conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'endorse', label: `Endorse {rep.first} and stay in the background`, risk: 'low', result: `You back the front-runner publicly. {rep.first} wins, and the debt is acknowledged.`, effects: [{ rel: { who: 'rep', trust: 10, respect: 6 } }, { conf: 1 }] },
      { id: 'boss_side', label: `Whisper to the GM that you can keep the room quiet`, risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `{boss.first} likes the idea, and you win favors behind the scenes. But the whispering gets out.`, effects: [{ money: 6000 }, { conf: 2 }, { rel: { who: 'rep', trust: -8, respect: -6 } }, { pop: -0.3 }] },
        { weight: 2, text: `The word gets back to the veterans before the end of the day. You are branded a company stooge.`, effects: [{ rel: { who: 'rep', trust: -14, respect: -10, heat: 8 } }, { pop: -0.8 }, { conf: -4 }] } ] },
      { id: 'abstain', label: `Abstain: you are here to wrestle`, risk: 'low', result: `You stay out of the whole business. Nobody holds it against you, nor do they remember it.`, effects: [{ conf: 1 }, { fatigue: -3 }] },
    ],
  },
  {
    id: 'opp_hof_induction', category: 'opportunity', title: `Introduce {legend.name} at the Hall of Fame`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 20, contexts: ['weekly', 'post_show'],
    cast: { legend: { pick: 'roster', tier: { gte: 4 } }, exec: { pick: 'staff', role: 'executive' } },
    trigger: { minYear: 1993, eventWithin: { id: 'wrestlemania', days: 21 }, stat: { popularity: { gte: 35 } } },
    slots: { honour: [`a place in the main ceremony`, `a short speech before the video package`, `the final words before the trophy`], tone: [`the emotional heart of the night`, `a chance to tell a story only you know`, `a stage with the whole industry watching`] },
    body: [`{exec.name} calls with an invitation: {legend.name} is being inducted into the Hall of Fame, and the legend has asked for you to give the introduction. You will have {honour}.`, `It is {tone}. The honor is genuine, and so is the pressure to say the right thing in front of the biggest names in the business.`],
    choices: [
      { id: 'heartfelt', label: `Write a heartfelt speech from scratch`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.4 }, text: `Your words land, the room is quiet and then on its feet. {legend.first} wipes an eye, and the video makes the rounds.`, effects: [{ rel: { who: 'legend', respect: 14, affinity: 10, trust: 8 } }, { pop: 1.0 }, { conf: 4 }, { event: { type: 'promo_delivered', participants: ['legend'], summary: `Delivered a heartfelt Hall of Fame introduction for {legend.name}.`, data: { quality: { base: 66, mic: 0.5, charisma: 0.4 } } } }] },
        { weight: 1, text: `You stumble over the middle and forget a line. {legend.first} laughs and rescues you with a joke.`, effects: [{ rel: { who: 'legend', respect: 8, affinity: 6 } }, { pop: 0.3 }, { conf: -2 }] } ] },
      { id: 'funny', label: `Go for laughs with a roast-style tribute`, risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.6 }, text: `You have the room howling, including the guest of honor. It is the most fun of the night.`, effects: [{ rel: { who: 'legend', respect: 8, affinity: 10 } }, { pop: 1.1 }, { conf: 3 }] },
        { weight: 2, text: `A few of the jokes cross the line, and the room goes cold. {legend.first} takes it with a stiff smile.`, effects: [{ rel: { who: 'legend', respect: -8, heat: 6 } }, { pop: -0.5 }, { conf: -4 }] } ] },
      { id: 'short', label: `Keep it brief and let the video do the work`, risk: 'low', result: `You speak for thirty heartfelt seconds and step aside. It is tasteful, quiet, and a little forgettable.`, effects: [{ rel: { who: 'legend', respect: 4 } }, { pop: 0.2 }, { conf: 1 }] },
      { id: 'decline', label: `Decline: you do not want the spotlight`, risk: 'med', result: `You turn it down and recommend someone else. {legend.first} is hurt but gracious, and you miss a rare chance.`, effects: [{ rel: { who: 'legend', respect: -6, trust: -4 } }, { conf: -2 }, { fatigue: -3 }] },
    ],
  },
  {
    id: 'opp_program_with_star', category: 'opportunity', title: `A Program With {star.name}`, weight: 3, major: true, cooldownDays: 250, maxPerCareer: 3, categoryCooldown: 15,
    cast: { star: { pick: 'roster', tier: { gte: 3 }, sameBrand: true }, boss: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { popularity: { gte: 35 }, careerYears: { gte: 1 } } },
    slots: { length: [`three weeks`, `six weeks`, `a full quarter`], price: [`a character shift`, `a bruising losing streak early on`, `a rewritten finishing move`] },
    body: [`{boss.name} unrolls a storyboard for a program between you and {star.name}, running {length}. It is a rare chance to be seen beside a headliner. The price is {price}.`, `Stars help careers, and they also take over them. You would be sharing the stage with someone whose shadow is long.`],
    choices: [
      { id: 'accept', label: `Accept the program and the price`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4, charisma: 0.3 }, text: `The program clicks. You spar with {star.first}, learn on the fly, and finish with a name that means something.`, effects: [{ rivalry: { who: 'star', heat: 14 } }, { rel: { who: 'star', respect: 8 } }, { pop: 1.1 }, { conf: 3 }, { fatigue: 12 }] },
        { weight: 1, text: `The star steamrolls you for most of the run. The audience only remembers the final week.`, effects: [{ rivalry: { who: 'star', heat: 10 } }, { rel: { who: 'star', respect: 3 } }, { pop: 0.4 }, { conf: -2 }, { fatigue: 12 }] } ] },
      { id: 'negotiate', label: `Counter with terms that protect your image`, risk: 'med', result: `You push back and win half of what you want. The story is still strong, but the star's camp is cooler toward you.`, effects: [{ rivalry: { who: 'star', heat: 8 } }, { rel: { who: 'star', respect: 2, heat: 4 } }, { pop: 0.5 }, { conf: 2 }, { fatigue: 8 }] },
      { id: 'friendly', label: `Propose a respectful, partnership-style program`, risk: 'low', result: `You and {star.first} find common ground, and the program becomes a slow-burn friendship. It is warm, but nobody is losing sleep.`, effects: [{ rel: { who: 'star', trust: 10, respect: 8, affinity: 6 } }, { tag: { who: 'star', tag: 'ally' } }, { pop: 0.4 }, { conf: 1 }] },
      { id: 'decline', label: `Decline and keep your current direction`, risk: 'low', result: `You turn down the program, to the surprise of the room. You keep your character and your pride.`, effects: [{ conf: 2 }, { pop: -0.4 }, { rel: { who: 'star', respect: -3 } }] },
    ],
  },
  {
    id: 'opp_screen_offer', category: 'opportunity', title: `A Studio Wants You for {part}`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 20,
    cast: { exec: { pick: 'staff', role: 'executive' } },
    trigger: { minYear: 2000, stat: { popularity: { gte: 45 }, money: { gte: 5000 } } },
    slots: { part: [`a supporting role`, `a cameo`, `a voice role`, `a reality series`], shoot: [`six weeks overseas`, `three separate weekends`, `a month that overlaps with a pay-per-view`] },
    body: [`A production company has called the front office about {part}. The shoot would take {shoot}, and the fee is more than you make in a quarter.`, `"We would back it," {exec.name} says, "with conditions." The spotlight is tempting, and so is the risk of being absent when the crowd needs you.`],
    choices: [
      { id: 'accept', label: `Take the role and rearrange your schedule`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, popularity: 0.3 }, text: `Your screen time introduces you to a new audience. When you return to the ring, the cheers are louder.`, effects: [{ money: 40000 }, { pop: 1.0 }, { conf: 3 }, { fatigue: 16 }] },
        { weight: 1, text: `The project is shelved after you have already cleared your calendar. The money is nice, but the momentum is lost.`, effects: [{ money: 20000 }, { pop: -0.4 }, { conf: -2 }, { fatigue: 12 }] } ] },
      { id: 'terms', label: `Accept only if the company tailors your schedule`, risk: 'med', result: `The company agrees to a lighter workload on the road. You still make the movie, but the paycheck is smaller and your name shrinks in the credits.`, effects: [{ money: 18000 }, { pop: 0.5 }, { conf: 2 }, { fatigue: 8 }] },
      { id: 'tie_in', label: `Pitch a story crossover that ties the project to the ring`, risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.5, mic: 0.4 }, text: `The tie-in becomes a two-way win. Fans of one flock to the other, and the executive is delighted.`, effects: [{ money: 30000 }, { pop: 1.4 }, { conf: 4 }] },
        { weight: 2, text: `The producers do not care for being told how to sell their product, and walk away.`, effects: [{ pop: -0.2 }, { conf: -3 }] } ] },
      { id: 'decline', label: `Decline: wrestling is your focus`, risk: 'low', result: `You send a polite no and return to your training. The fans never know what they missed.`, effects: [{ conf: 2 }, { pop: -0.1 }, { fatigue: -4 }] },
    ],
  },
  {
    id: 'opp_overseas_tour', category: 'opportunity', title: `A Tour Through {region}`, weight: 2, major: true, cooldownDays: 300, maxPerCareer: 3, categoryCooldown: 15,
    cast: { boss: { pick: 'staff', role: 'producer' } },
    trigger: { stat: { popularity: { gte: 25 }, fatigue: { lte: 70 } } },
    slots: { region: [`Japan`, `the United Kingdom`, `Australia and New Zealand`, `Latin America`], length: [`two weeks`, `five weeks`, `a month with a day off every ten days`] },
    body: [`{boss.name} has a spot for you on the next overseas swing: {length} in {region}, a different building every night, and crowds who treat wrestling like a religion.`, `"Pack light and sleep on planes," {boss.first} advises. The pay is decent, the travel is brutal, and the audiences will remember you long after the airport lights fade.`],
    choices: [
      { id: 'all_in', label: `Take the full tour and give every night everything`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4, charisma: 0.3 }, text: `You grow with every town. By the end, you are a name the locals chant for. The memories will outlast the bruises.`, effects: [{ pop: 1.2 }, { conf: 4 }, { fatigue: 22 }, { attr: { name: 'endurance', delta: 1 } }, { money: 6000 }] },
        { weight: 1, text: `The jet lag and bad food catch up with you, and a few of the later shows are rough.`, effects: [{ pop: 0.6 }, { conf: 1 }, { fatigue: 28 }, { money: 6000 }] } ] },
      { id: 'partial', label: `Join for half the dates to save your body`, risk: 'low', result: `You do half the tour and enjoy the best part. The fans are delighted, and you keep your health.`, effects: [{ pop: 0.6 }, { fatigue: 10 }, { conf: 1 }, { money: 3000 }] },
      { id: 'headline', label: `Demand to headline in exchange for the grind`, risk: 'high', outcomes: [
        { weight: 1, bonus: { popularity: 0.5, confidence: 0.3 }, text: `The tour promoters agree, and you become the face of the swing. It is the showiest run of your career.`, effects: [{ pop: 1.5 }, { conf: 5 }, { fatigue: 24 }, { money: 8000 }] },
        { weight: 2, text: `The promoters balk, and the offer is withdrawn. A rival takes the dates.`, effects: [{ pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'decline', label: `Decline and stay home to rest`, risk: 'low', result: `You skip the road trip and take a stretch of home cooking and sleep. The fans overseas will have to wait.`, effects: [{ fatigue: -14 }, { pop: -0.2 }, { conf: 1 }] },
    ],
  },
  {
    id: 'opp_short_notice_save', category: 'opportunity', title: `A Match Falls Apart Before the Bell`, weight: 3, major: true, cooldownDays: 250, maxPerCareer: 3, categoryCooldown: 12, contexts: ['pre_show', 'show_day'],
    cast: { star: { pick: 'roster', tier: { gte: 3 } }, boss: { pick: 'staff', role: 'gm' } },
    trigger: { event: 'ple', injured: false, stat: { popularity: { gte: 25 }, fatigue: { lte: 60 } } },
    slots: { cause: [`a flight cancelled by weather`, `a back spasm during warm-up`, `a family emergency`], slot: [`a mid-card spot`, `the semi-main event`, `a late-card showcase`] },
    body: [`{boss.name} grabs you in the hallway, phone still in hand. {star.name} cannot work tonight because of {cause}, and someone has to take over {slot}.`, `You have ninety minutes to learn a finish, figure out an opponent's tendencies and pretend you planned all of it.`],
    choices: [
      { id: 'step_in', label: `Step in with no rehearsal and trust your instincts`, risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.5, confidence: 0.4 }, text: `You call it in the ring and the opponent rolls with it. The crowd never knows it was improvised, and the office takes notes.`, effects: [{ pop: 1.4 }, { conf: 5 }, { fatigue: 12 }, { rel: { who: 'star', respect: 6 } }, { money: 4000 }] },
        { weight: 1, text: `It gets messy in the ring. You miss a cue, and the match sags into a safe, flat finish.`, effects: [{ pop: 0.1 }, { conf: -3 }, { fatigue: 12 }, { money: 4000 }] } ] },
      { id: 'ask_price', label: `Ask for a bonus and a promise of a better slot`, risk: 'med', result: `{boss.first} grits teeth and agrees. The match is fine and the bonus is better, but nobody loves an opportunist.`, effects: [{ money: 10000 }, { pop: 0.4 }, { conf: 1 }, { fatigue: 10 }] },
      { id: 'safe', label: `Agree to a simplified, protective match`, risk: 'low', result: `You and the opponent keep it simple and clean. Nobody gets hurt and nobody is dazzled.`, effects: [{ pop: 0.3 }, { conf: 1 }, { fatigue: 6 }, { rel: { who: 'star', respect: 2 } }] },
      { id: 'decline', label: `Decline: it is not your match to take`, risk: 'low', result: `You step aside, and someone more eager takes the slot. {boss.first} is understanding, though the shrug says otherwise.`, effects: [{ conf: -2 }, { pop: -0.2 }, { fatigue: -4 }] },
    ],
  },
  {
    id: 'opp_open_the_show', category: 'opportunity', title: `Open the Show With a Promo`, weight: 2, major: true, cooldownDays: 250, maxPerCareer: 3, categoryCooldown: 10, contexts: ['pre_show', 'show_day'],
    cast: { boss: { pick: 'staff', role: 'producer' } },
    trigger: { event: 'weekly', stat: { popularity: { gte: 30 }, mic: { gte: 35 } } },
    slots: { crowd: [`a hostile crowd`, `a sold-out house`, `a half-empty arena`, `a crowd already loud from the pre-show`], length: [`five minutes`, `eight minutes`, `whatever you need`] },
    body: [`{boss.name} wants you to open tonight's broadcast, alone, with a microphone. You have {length}, and {crowd} is waiting.`, `"Say what you mean," {boss.first} says. There is no script, only a camera, a light and whatever you decide to say.`],
    choices: [
      { id: 'story', label: `Tell a personal story that brings everyone in`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.6, charisma: 0.4 }, text: `You talk about the bumps, the miles and the faces who got you here. By the end, the building is silent in the best way.`, effects: [{ pop: 1.1 }, { conf: 4 }, { event: { type: 'promo_delivered', participants: [], summary: `Opened a show with a personal promo.`, data: { quality: { base: 64, mic: 0.6, charisma: 0.4 } } } }] },
        { weight: 1, text: `The story drags and the crowd's attention drifts. You rush the ending and exit quickly.`, effects: [{ pop: -0.2 }, { conf: -3 }] } ] },
      { id: 'attack', label: `Call out the whole roster and name names`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.7 }, text: `You light the fuse. Names are shouted, challenges accepted, and the show catches fire.`, effects: [{ pop: 1.2 }, { conf: 3 }, { fatigue: 4 }] },
        { weight: 2, text: `You name the wrong people. A veteran laughs at you from the stage, and the feud begins on the wrong foot.`, effects: [{ pop: -0.3 }, { conf: -3 }, { fatigue: 4 }] } ] },
      { id: 'joke', label: `Play it light and work the crowd with comedy`, risk: 'low', result: `You get easy laughs, a few good chants, and a warm reaction. You hand the show over in a good mood.`, effects: [{ pop: 0.5 }, { conf: 2 }] },
      { id: 'cede', label: `Hand the mic to another wrestler`, risk: 'low', result: `You hand over the slot, and the opportunity goes to someone else. They do well, and you look generous and a little scared.`, effects: [{ conf: -2 }, { pop: -0.1 }, { fatigue: -3 }] },
    ],
  },
  {
    id: 'opp_documentary_crew', category: 'opportunity', title: `A Camera Crew Wants to Follow You`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 20,
    cast: { exec: { pick: 'staff', role: 'executive' }, host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 2010, stat: { popularity: { gte: 40 }, careerYears: { gte: 2 } } },
    slots: { outlet: [`a streaming service`, `a cable network`, `an independent film studio`], scope: [`your road to the next big event`, `a year in your life`, `your family and your training`] },
    body: [`{exec.name} has an offer: {outlet} wants to film a documentary about {scope}, with {host.name} presenting. They want access to your home, gym and locker room.`, `Fame has a price, and so does honesty. Anything on camera can come back to you later.`],
    choices: [
      { id: 'open', label: `Give them full access and be completely honest`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.3 }, text: `The footage is raw and human. The fans fall in love with the person behind the character.`, effects: [{ pop: 1.3 }, { conf: 3 }, { money: 12000 }, { fatigue: 10 }] },
        { weight: 1, text: `A private bad day makes the final cut, and it is much shared online. Your image takes a dent.`, effects: [{ pop: -0.2 }, { conf: -4 }, { money: 12000 }, { fatigue: 10 }] } ] },
      { id: 'controlled', label: `Agree to limited access and approve the final cut`, risk: 'low', result: `The documentary is polished, careful and a bit bland. It earns you a respectable reception.`, effects: [{ pop: 0.6 }, { money: 7000 }, { conf: 1 }, { fatigue: 5 }] },
      { id: 'sell', label: `Sell exclusive rights to the highest bidder`, risk: 'med', result: `A bidding war pays you handsomely and sends the project behind a paywall. Fewer people see it, but your account is bigger.`, effects: [{ money: 24000 }, { pop: 0.2 }, { conf: 1 }] },
      { id: 'decline', label: `Decline: some things should stay private`, risk: 'low', result: `You say no and keep your life to yourself. The project goes ahead without you, with someone else's story.`, effects: [{ pop: -0.3 }, { conf: 2 }, { fatigue: -3 }] },
    ],
  },
  {
    id: 'opp_dream_partner', category: 'opportunity', title: `{partner.name} Wants You as a Partner`, weight: 2, major: true, cooldownDays: 250, maxPerCareer: 3, categoryCooldown: 15,
    cast: { partner: { pick: 'roster', tier: { gte: 3 }, sameBrand: true } },
    trigger: { stat: { popularity: { gte: 30 } } },
    slots: { reason: [`You remind me of a younger version of myself`, `You are the only one who matches my pace`, `The office told me to find a partner`], stakes: [`a big match at the next pay-per-view`, `a tag title push`, `a month of TV segments`] },
    body: [`{partner.name} stops you outside the gym. "I want you on my side," {partner.they} says. "{reason}." The proposal: {stakes}.`, `It is flattering and probably smart. It also puts you in someone else's orbit.`],
    choices: [
      { id: 'accept', label: `Accept and stand shoulder to shoulder`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.3, charisma: 0.3 }, text: `You and {partner.first} click, and the crowd roars for the team. You pick up pointers and a following.`, effects: [{ event: { type: 'alliance_formed', participants: ['partner'], summary: `Teamed with {partner.name}.`, data: {} } }, { rel: { who: 'partner', trust: 12, respect: 8, affinity: 8 } }, { pop: 1.0 }, { conf: 3 }] },
        { weight: 1, text: `The chemistry fizzles. You end up the junior half of a team that nobody can pick a favorite from.`, effects: [{ event: { type: 'alliance_formed', participants: ['partner'], summary: `Teamed with {partner.name}.`, data: {} } }, { rel: { who: 'partner', trust: 6, respect: 3 } }, { pop: 0.3 }, { conf: -1 }] } ] },
      { id: 'condition', label: `Accept if you get equal billing`, risk: 'med', outcomes: [
        { weight: 1, bonus: { popularity: 0.4, mic: 0.3 }, text: `{partner.first} agrees with a small smile. You are partners, not sidekicks, and it shows.`, effects: [{ rel: { who: 'partner', respect: 8, trust: 4 } }, { pop: 0.8 }, { conf: 3 }] },
        { weight: 2, text: `{partner.first} bristles at the condition and withdraws the offer.`, effects: [{ rel: { who: 'partner', respect: -4 } }, { conf: -2 }] } ] },
      { id: 'decline', label: `Decline and keep your independence`, risk: 'low', result: `You say you are not ready to share your story. {partner.first} nods and wishes you luck.`, effects: [{ rel: { who: 'partner', respect: 1, trust: -2 } }, { conf: 2 }, { pop: -0.1 }] },
      { id: 'use', label: `Take the exposure, then walk away at the first chance`, risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `The exposure launches you. When you split, the break is clean enough that you part on semi-good terms.`, effects: [{ pop: 1.1 }, { conf: 3 }, { rel: { who: 'partner', trust: -10, heat: 8 } }] },
        { weight: 2, text: `{partner.first} sees what you are doing and ends it early. The fallout is public.`, effects: [{ pop: -0.5 }, { conf: -3 }, { rel: { who: 'partner', trust: -20, heat: 18 } }, { event: { type: 'betrayal', participants: ['partner'], summary: `Used and dropped {partner.name} as a partner.`, data: {} } }] } ] },
    ],
  },
  {
    id: 'opp_answer_open_challenge', category: 'opportunity', title: `{champ.name} Issues an Open Challenge`, weight: 3, major: true, cooldownDays: 200, maxPerCareer: 4, categoryCooldown: 12, contexts: ['weekly', 'pre_show'],
    cast: { champ: { pick: 'champion', class: 'world' } },
    trigger: { holdsTitle: false, event: 'weekly', stat: { popularity: { gte: 25 } } },
    slots: { mood: [`mocking`, `bored`, `ferocious`], prize: [`a month of bragging rights`, `a spot on the next big card`, `the right to ask for a title shot`] },
    body: [`{champ.name} stands in the ring, belt held high, {mood} as the crowd waits. "Anyone," {champ.they} says, "who thinks they belong here can come get it." The stake for a challenger is {prize}.`, `You are sitting in the gorilla position with the sound of the crowd rattling the door. Nobody else has moved.`],
    choices: [
      { id: 'answer', label: `Walk out and answer the challenge`, risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.4, confidence: 0.5 }, text: `Your music hits and the roof comes off. You push the champion to the limit, and even in defeat you leave the building a threat.`, effects: [{ booking: { who: 'champ', type: 'singles' } }, { rel: { who: 'champ', respect: 8 } }, { pop: 1.3 }, { conf: 4 }, { fatigue: 12 }] },
        { weight: 1, text: `The champion brushes you aside in a squash. The crowd is stunned, and so are you.`, effects: [{ booking: { who: 'champ', type: 'singles' } }, { rel: { who: 'champ', respect: 2 } }, { pop: 0.2 }, { conf: -4 }, { fatigue: 10 }] } ] },
      { id: 'sneak', label: `Attack the champion from behind to start a feud`, risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.3, charisma: 0.4 }, text: `A cheap shot lights the arena, and the champion is down. You are suddenly the most talked-about name in the building.`, effects: [{ rivalry: { who: 'champ', heat: 18 } }, { rel: { who: 'champ', heat: 16 } }, { pop: 1.0 }, { conf: 3 }] },
        { weight: 2, text: `Security tackles you before the blow lands, and the crowd boos you off the stage.`, effects: [{ rivalry: { who: 'champ', heat: 10 } }, { pop: -0.6 }, { conf: -3 }] } ] },
      { id: 'wait', label: `Hold back and demand a proper title match instead`, risk: 'low', result: `You send word to the office. The champion hears, the crowd does not, and the moment passes.`, effects: [{ rel: { who: 'champ', respect: 2 } }, { conf: 1 }, { pop: -0.2 }] },
      { id: 'send_friend', label: `Push a friend out to answer the call`, risk: 'med', result: `Your friend takes the beating, and the story is theirs. You get gratitude and guilt in equal measure.`, effects: [{ pop: -0.2 }, { conf: -2 }, { money: 1500 }] },
    ],
  },
  {
    id: 'opp_rival_company_offer', category: 'opportunity', title: `A Rival Promotion Makes an Offer`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 20,
    cast: { exec: { pick: 'staff', role: 'executive' } },
    trigger: { minYear: 1990, contract: { lte: 150 }, stat: { popularity: { gte: 35 } } },
    slots: { courier: [`a lawyer in a good suit`, `a former wrestler who now runs bookings`, `an unmarked envelope slid under your hotel door`], perk: [`a guaranteed main-event run`, `a significantly bigger contract`, `full creative control of your character`] },
    body: [`The offer arrives through {courier}: a rival promotion wants you and will give you {perk}. Your contract has months left, and {exec.name} has already heard rumors.`, `The company you work for has never been entirely fair to you. The company that is courting you has never had to be.`],
    choices: [
      { id: 'leverage', label: `Use the offer to demand a better deal in-house`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.4, charisma: 0.3 }, text: `{exec.first} sees you mean it and opens the vault. You stay, and you are paid like it.`, effects: [{ money: 24000 }, { pop: 0.3 }, { conf: 4 }] },
        { weight: 1, text: `{exec.first} calls the bluff and the talks sour. You keep your contract, but the goodwill is gone.`, effects: [{ money: 3000 }, { conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'secret', label: `Take a secret meeting and keep both options open`, risk: 'high', outcomes: [
        { weight: 1, text: `The meeting stays private and gives you real power in the next negotiation.`, effects: [{ money: 12000 }, { conf: 3 }] },
        { weight: 2, text: `A hallway rumor spreads. The office assumes the worst and freezes your push.`, effects: [{ money: -3000 }, { pop: -0.6 }, { conf: -4 }] } ] },
      { id: 'loyal', label: `Tell {exec.first} everything and recommit publicly`, risk: 'low', result: `Your honesty is rewarded with a handshake and a modest bump. The fans hear about your loyalty and cheer.`, effects: [{ money: 6000 }, { pop: 0.5 }, { conf: 2 }] },
      { id: 'walk', label: `Explore the offer seriously and prepare to leave`, risk: 'high', result: `You take the meeting, inspect the contract and weigh the future. It is thrilling, uncertain, and costs you a lot of nights of sleep.`, effects: [{ money: 8000 }, { conf: 2 }, { pop: -0.4 }, { fatigue: 10 }] },
    ],
  },
  {
    id: 'opp_charity_headliner', category: 'opportunity', title: `Headline the {cause} Benefit`, weight: 2, major: true, cooldownDays: 300, maxPerCareer: 3, categoryCooldown: 15,
    cast: { host: { pick: 'media', kind: 'host' }, boss: { pick: 'staff', role: 'executive' } },
    trigger: { stat: { popularity: { gte: 30 } } },
    slots: { cause: [`Children's Hospital`, `Veterans' Fund`, `Food Bank`, `Local Gym Rebuild`], format: [`a special exhibition match`, `a live auction and a short match`, `a meet-and-greet with the fans`] },
    body: [`{host.name} is emceeing the {cause} benefit and wants you as the headliner for {format}. {boss.name} wants the company's name on it, and a fair share of the cameras.`, `It is a good cause and a fine stage. It is also a night off from your regular schedule that your body probably needs.`],
    choices: [
      { id: 'give_all', label: `Give the night everything and donate your fee`, risk: 'low', outcomes: [
        { weight: 3, bonus: { charisma: 0.5 }, text: `The room is moved by your effort, and the donation total beats every target. Photos of you with the families circulate for weeks.`, effects: [{ pop: 1.0 }, { conf: 3 }, { money: -3000 }, { fatigue: 10 }] },
        { weight: 1, text: `The event runs late and chaotic. Your good intentions survive, but you leave exhausted.`, effects: [{ pop: 0.6 }, { money: -3000 }, { fatigue: 16 }] } ] },
      { id: 'sponsor', label: `Bring a sponsor along and double the donation`, risk: 'med', outcomes: [
        { weight: 2, text: `The sponsor pledges a generous sum, and the event grows. Some cynics grumble about the branding.`, effects: [{ pop: 0.6 }, { money: 4000 }, { conf: 1 }] },
        { weight: 1, text: `The sponsor's presence overshadows the cause, and the press calls it a publicity stunt.`, effects: [{ pop: -0.4 }, { money: 4000 }, { conf: -2 }] } ] },
      { id: 'short', label: `Appear briefly, sign things, and move on`, risk: 'low', result: `You give an hour and a smile. Nobody is disappointed, nobody is dazzled.`, effects: [{ pop: 0.3 }, { fatigue: 3 }, { conf: 1 }] },
      { id: 'pass', label: `Decline: you need the rest`, risk: 'med', result: `You send a heartfelt apology and a donation. A few columns note your absence, but most understand.`, effects: [{ pop: -0.4 }, { fatigue: -10 }, { money: -1500 }, { conf: 1 }] },
    ],
  },
  // ============================================================ CREATIVE
  {
    id: 'bkg_match_time_cut', category: 'creative', title: `Your Match Is Cut to {minutes}`, weight: 3, major: true, cooldownDays: 120, maxPerCareer: 4, categoryCooldown: 8, contexts: ['pre_show', 'show_day'],
    cast: { boss: { pick: 'staff', role: 'producer' }, opp: { pick: 'roster', tier: { gte: 1, lte: 3 }, sameBrand: true } },
    trigger: { event: 'ple', stat: { popularity: { gte: 20 } } },
    slots: { minutes: [`six minutes`, `eight minutes`, `four minutes`], blame: [`a long entrance package`, `an opening segment that ran over`, `a last-minute video tribute`] },
    body: [`{boss.name} finds you at catering with the new running order. Because of {blame}, your match against {opp.name} has been trimmed to {minutes}.`, `You had planned a story with a build, a near-fall and a finish. Now you have to decide what survives.`],
    choices: [
      { id: 'adapt', label: `Adapt: rebuild the match around the highlights`, risk: 'low', outcomes: [
        { weight: 3, bonus: { overall: 0.4 }, text: `You and {opp.first} strip the match to its sharpest spots. The crowd gets a lightning bolt of a bout and loves it.`, effects: [{ booking: { who: 'opp', type: 'singles' } }, { rel: { who: 'opp', respect: 6 } }, { pop: 0.6 }, { conf: 3 }] },
        { weight: 1, text: `The compression hurts the story, and the finish comes out of nowhere. It is competent, nothing more.`, effects: [{ booking: { who: 'opp', type: 'singles' } }, { pop: 0.1 }, { conf: -1 }] } ] },
      { id: 'fight', label: `Fight to keep your time`, risk: 'med', outcomes: [
        { weight: 1, bonus: { popularity: 0.5, confidence: 0.4 }, text: `{boss.first} negotiates with the truck and wins back a few minutes for you. Someone else on the card loses theirs.`, effects: [{ booking: { who: 'opp', type: 'singles' } }, { rel: { who: 'opp', respect: 3 } }, { pop: 0.5 }, { conf: 3 }] },
        { weight: 2, text: `{boss.first} snaps that everyone has a complaint tonight. The time stays cut, and you have a reputation for being demanding.`, effects: [{ booking: { who: 'opp', type: 'singles' } }, { pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'stunt', label: `Squeeze in a risky spot to make your minutes count`, risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.5, confidence: 0.3 }, text: `You land a daring finish that turns the crowd upside down. The shortest match on the card is the one they talk about.`, effects: [{ booking: { who: 'opp', type: 'singles' } }, { pop: 1.2 }, { conf: 4 }, { fatigue: 10 }] },
        { weight: 1, text: `The big spot is misjudged in a crowded space. You finish the match but you feel it all the next day.`, effects: [{ booking: { who: 'opp', type: 'singles' } }, { pop: 0.4 }, { fatigue: 14 }, { injury: { part: 'arms', severity: 1, days: 10 } }] } ] },
      { id: 'accept', label: `Shrug and take the check for the short work`, risk: 'low', result: `A short night is an easy night. You collect your pay and slip out before the crowd leaves.`, effects: [{ booking: { who: 'opp', type: 'singles' } }, { money: 1500 }, { fatigue: -6 }, { pop: -0.2 }, { conf: -1 }] },
    ],
  },
  {
    id: 'bkg_finish_dispute', category: 'creative', title: `A Disagreement About the Finish`, weight: 3, major: true, cooldownDays: 120, maxPerCareer: 4, categoryCooldown: 8, contexts: ['pre_show', 'show_day'],
    cast: { opp: { pick: 'roster', tier: { gte: 2, lte: 4 }, sameBrand: true }, boss: { pick: 'staff', role: 'producer' } },
    trigger: { event: 'ple', stat: { popularity: { gte: 25 } } },
    slots: { finish: [`a roll-up in the middle of the ring`, `a shocking interference`, `a count-out nobody wanted`], stake: [`{opp.their} momentum`, `{opp.their} upcoming title feud`, `the story {opp.they} was pitching`] },
    body: [`The planned finish is {finish}, and you are not on the winning end. {opp.name} calmly explains why: it protects {stake}.`, `You think the finish makes you look weak. {boss.name} has said the call is yours and {opp.first}'s to settle, and the clock is running.`],
    choices: [
      { id: 'argue', label: `Argue your case with logic and numbers`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.4, confidence: 0.4 }, text: `{opp.first} listens, thinks and blinks. The finish is changed, and neither of you is sure you won.`, effects: [{ rel: { who: 'opp', respect: 4, trust: -2 } }, { pop: 0.3 }, { conf: 3 }] },
        { weight: 1, text: `The conversation turns into a shouting match overheard by half the locker room.`, effects: [{ rel: { who: 'opp', heat: 12, respect: -4 } }, { pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'accept', label: `Accept the finish for the good of the show`, risk: 'low', result: `You smile, take the loss, and sell it. {opp.first} makes a mental note that you are easy to work with.`, effects: [{ rel: { who: 'opp', respect: 8, trust: 6 } }, { conf: -3 }, { pop: 0.1 }] },
      { id: 'swerve', label: `Quietly alter the finish in the ring`, risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.5, charisma: 0.3 }, text: `You change the ending mid-match, and {opp.first} follows. The crowd explodes. Backstage, though, nobody is smiling.`, effects: [{ rel: { who: 'opp', trust: -16, heat: 14 } }, { rivalry: { who: 'opp', heat: 12 } }, { pop: 1.0 }, { conf: 3 }] },
        { weight: 2, text: `{opp.first} is ready for it. The finish collapses on live television and you both look sloppy.`, effects: [{ rel: { who: 'opp', trust: -20, heat: 18 } }, { pop: -0.6 }, { conf: -4 }] } ] },
      { id: 'trade', label: `Trade this finish for a win in the rematch`, risk: 'med', result: `You offer a bargain: you lose here, and win the next. {opp.first} shakes on it. Whether the office honors it is another matter.`, effects: [{ rel: { who: 'opp', respect: 4, trust: 4 } }, { promise: { kind: 'win_match', who: 'opp', text: `I will beat {opp.name} in the rematch`, deadlineDays: 60 } }, { pop: 0.2 }, { conf: 1 }] },
    ],
  },
  {
    id: 'bkg_new_gimmick', category: 'creative', title: `The Office Wants a New {gimmick}`, weight: 3, major: true, cooldownDays: 250, maxPerCareer: 3, categoryCooldown: 15,
    cast: { boss: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { popularity: { gte: 20 }, careerYears: { gte: 1 } } },
    slots: { gimmick: [`persona`, `look`, `attitude`], flavour: [`a masked mystery act`, `a brooding anti-hero`, `a brash showman with a catchphrase`, `a throwback to the old days`] },
    body: [`{boss.name} has spent a week with the writers and returned with a pitch: retire the old you and try {flavour}. "People like you," {boss.first} says, "but nobody can say what you stand for."`, `You built what you have the hard way. A new {gimmick} could be the break you need, or the end of what was working.`],
    choices: [
      { id: 'embrace', label: `Embrace the change and commit fully`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.6, confidence: 0.3 }, text: `You lean into it hard, and the new character catches fire. The crowd that ignored you now has a favorite.`, effects: [{ pop: 1.3 }, { charisma: 1 }, { conf: 3 }, { fatigue: 8 }] },
        { weight: 1, text: `The new character sits uneasily on you and the crowd senses it. You will have to work hard to bury the memory.`, effects: [{ pop: -0.6 }, { conf: -4 }, { fatigue: 8 }] } ] },
      { id: 'tweak', label: `Pitch a hybrid: keep your core, add a new edge`, risk: 'low', result: `The writers wince, then agree. You keep the heart of the character and add some new color.`, effects: [{ pop: 0.5 }, { conf: 2 }, { fatigue: 4 }] },
      { id: 'refuse', label: `Refuse: you are who the fans know`, risk: 'med', outcomes: [
        { weight: 1, bonus: { popularity: 0.5, confidence: 0.4 }, text: `{boss.first} respects the stand. The fans stay loyal, and your standing grows.`, effects: [{ pop: 0.4 }, { conf: 4 }] },
        { weight: 2, text: `The writers file you under difficult. Your spots start to shrink.`, effects: [{ pop: -0.4 }, { conf: -2 }] } ] },
      { id: 'own', label: `Write your own version of the character`, risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.5, charisma: 0.4 }, text: `Your pitch is better than theirs, and you know it. The office lets you run with it.`, effects: [{ pop: 1.2 }, { mic: 1 }, { conf: 5 }, { fatigue: 8 }] },
        { weight: 2, text: `Your version is overwrought and the writers pass. You burned a week for nothing.`, effects: [{ pop: -0.2 }, { conf: -3 }, { fatigue: 6 }] } ] },
    ],
  },
  {
    id: 'bkg_turn_pitch_heel', category: 'creative', title: `They Want You to Turn`, weight: 3, major: true, cooldownDays: 250, maxPerCareer: 3, categoryCooldown: 15,
    cast: { boss: { pick: 'staff', role: 'creative' }, victim: { pick: 'roster', tier: { gte: 2, lte: 4 }, alignment: 'face' } },
    trigger: { alignment: ['face'], stat: { popularity: { gte: 30 } } },
    slots: { cause: [`a blow in the back at the end of a match`, `a smug interview that refuses to apologize`, `a cold-blooded betrayal`], reason: [`The fans have gone stale`, `The main event needs a villain`, `The face division is overcrowded`] },
    body: [`{boss.name} has a plan for you: turn on {victim.name} through {cause}. {reason}, and you are the best fit.`, `"A good heel turn can double a career," {boss.first} says. "A bad one can end it."`],
    choices: [
      { id: 'turn', label: `Turn fully and lean into the hatred`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, mic: 0.4 }, text: `You sell the betrayal with ice in your veins. The crowd boos like it matters, and you have never felt this alive.`, effects: [{ rivalry: { who: 'victim', heat: 22 } }, { rel: { who: 'victim', heat: 18, trust: -20 } }, { pop: 1.3 }, { charisma: 1 }, { conf: 4 }, { event: { type: 'betrayal', participants: ['victim'], summary: `Turned on {victim.name} in a heel turn.`, data: {} } }] },
        { weight: 1, text: `The crowd cannot bring itself to boo you. The turn limps and the angle is dropped.`, effects: [{ rivalry: { who: 'victim', heat: 10 } }, { rel: { who: 'victim', heat: 8 } }, { pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'slow', label: `Pitch a slow burn instead of an overnight swerve`, risk: 'med', result: `{boss.first} agrees to stretch the turn over a month. The build is richer, the payoff smaller, and fans have time to talk.`, effects: [{ rivalry: { who: 'victim', heat: 10 } }, { pop: 0.5 }, { conf: 2 }] },
      { id: 'refuse', label: `Refuse: your fans trust you`, risk: 'med', result: `You stay on the side of the angels. The fans reward you, and the office finds another villain.`, effects: [{ pop: 0.4 }, { conf: 1 }, { rel: { who: 'victim', respect: 3 } }] },
      { id: 'warn', label: `Warn {victim.first} about the plan`, risk: 'high', result: `You tell {victim.first} what is coming. {victim.they} thanks you and promises to sell it better. Someone in the office hears about it.`, effects: [{ rel: { who: 'victim', trust: 12, respect: 6 } }, { pop: -0.2 }, { conf: -2 }] },
    ],
  },
  {
    id: 'bkg_turn_pitch_face', category: 'creative', title: `The Crowd Is Cheering the Wrong Way`, weight: 3, major: true, cooldownDays: 250, maxPerCareer: 3, categoryCooldown: 15,
    cast: { boss: { pick: 'staff', role: 'creative' }, ex: { pick: 'roster', tier: { gte: 2, lte: 4 }, alignment: 'heel' } },
    trigger: { alignment: ['heel'], stat: { popularity: { gte: 35 } } },
    slots: { sign: [`cheering your insults`, `chanting your name mid-promo`, `drowning out the booing`], tool: [`a dramatic rescue`, `a speech about changing`, `a surprise act of honor`] },
    body: [`The crowd is {sign} and {boss.name} sees it on the monitors. The writers want to turn you face with {tool}, in a tangle with {ex.name}.`, `Playing villain has been your engine. Turning means losing the edge that earned you the reaction.`],
    choices: [
      { id: 'turn', label: `Turn face and give the crowd what it wants`, risk: 'med', outcomes: [
        { weight: 2, bonus: { popularity: 0.5, charisma: 0.4 }, text: `The first thundering pop tells you the call was right. Fans cheer louder than ever.`, effects: [{ pop: 1.3 }, { conf: 4 }, { rel: { who: 'ex', heat: 8 } }] },
        { weight: 1, text: `The cheers fade as the character softens. You are less interesting and less feared.`, effects: [{ pop: 0.1 }, { conf: -3 }] } ] },
      { id: 'tease', label: `Tease the turn and keep your options open`, risk: 'low', result: `You play the middle for weeks, a heel with a heart. It frustrates a few fans and delights the rest.`, effects: [{ pop: 0.6 }, { conf: 1 }] },
      { id: 'refuse', label: `Refuse and double down on being a villain`, risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.5, charisma: 0.4 }, text: `Your fresh venom makes the crowd cheer louder for the wrong reasons. You have made a legend of your own evil.`, effects: [{ pop: 1.0 }, { conf: 5 }] },
        { weight: 2, text: `The audience tires of the act and the cheers turn to boos. You have overplayed your hand.`, effects: [{ pop: -0.6 }, { conf: -3 }] } ] },
      { id: 'merch', label: `Take the turn, but only with a merchandising cut`, risk: 'med', result: `{boss.first} agrees, and the merchandise starts to move. The turn feels commercial, and some fans notice.`, effects: [{ money: 9000 }, { pop: 0.6 }, { conf: -1 }] },
    ],
  },
  {
    id: 'bkg_scripted_promo', category: 'creative', title: `A Promo Written by Someone Else`, weight: 3, major: true, cooldownDays: 100, maxPerCareer: 5, categoryCooldown: 8, contexts: ['pre_show', 'show_day'],
    cast: { boss: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { mic: { gte: 30 }, popularity: { gte: 20 } } },
    slots: { script: [`seven pages of rhyming insults`, `a long monologue about destiny`, `a series of one-liners lifted from a sitcom`], tone: [`stiff`, `overwritten`, `cringeworthy`] },
    body: [`Two hours before the show, {boss.name} hands you the promo: {script}. It reads {tone}, and you would never say it that way.`, `"Just say it the way it is written," {boss.first} says. The office has signed off, and the mic is yours, and so is the blame.`],
    choices: [
      { id: 'verbatim', label: `Deliver it word for word, with full commitment`, risk: 'low', outcomes: [
        { weight: 2, bonus: { mic: 0.4, charisma: 0.4 }, text: `You sell the lines so hard that they work. {boss.first} beams, and the crowd forgets it was written by committee.`, effects: [{ pop: 0.5 }, { conf: 2 }, { money: 1000 }] },
        { weight: 2, text: `The lines stay stiff however hard you sell them. The crowd shrugs and so do you.`, effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'rewrite', label: `Rewrite it in your own voice and tell nobody`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.7, charisma: 0.4 }, text: `Your version is sharper, funnier and more real. The crowd erupts, and {boss.first} can only nod.`, effects: [{ pop: 1.1 }, { mic: 1 }, { conf: 4 }, { event: { type: 'promo_delivered', participants: [], summary: `Went off script with a self-written promo.`, data: { quality: { base: 64, mic: 0.6, charisma: 0.4 } } } }] },
        { weight: 1, text: `You lose your thread halfway through and the producer cuts to commercial. {boss.first} is livid.`, effects: [{ pop: -0.7 }, { conf: -5 }, { money: -2000 }] } ] },
      { id: 'negotiate', label: `Ask {boss.first} for ten minutes to edit it together`, risk: 'med', result: `You and {boss.first} cut the worst lines and keep the best. It is a compromise that nobody loves but everyone can live with.`, effects: [{ pop: 0.5 }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'refuse', label: `Refuse to read it`, risk: 'high', result: `You hand the script back. The segment is cut, the slot goes to someone else, and your name goes on a list.`, effects: [{ pop: -0.5 }, { conf: 2 }, { money: -2500 }] },
    ],
  },
  {
    id: 'bkg_entrance_music', category: 'creative', title: `A New Theme, {sound}`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 15,
    cast: { boss: { pick: 'staff', role: 'producer' } },
    trigger: { stat: { popularity: { gte: 25 }, careerYears: { gte: 1 } } },
    slots: { sound: [`heavy on guitars`, `stripped back and moody`, `led by a choir`, `glossy and electronic`], source: [`a studio the company owns`, `a band that adores you`, `a composer with a long list of credits`] },
    body: [`{boss.name} wants to retire your entrance music. The replacement comes from {source}, and the demo is {sound}, which you are not sure about.`, `Your music is half of your character. Changing it could revive you, or erase everything you built.`],
    choices: [
      { id: 'switch', label: `Switch to the new theme and ride the buzz`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The first notes of the new music hit and the arena lights up. The theme starts selling itself.`, effects: [{ pop: 0.9 }, { conf: 3 }, { money: 2000 }] },
        { weight: 1, text: `The crowd hesitates, missing the old riff. It takes weeks for the new theme to feel like yours.`, effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
      { id: 'blend', label: `Ask for a hybrid that keeps your old signature`, risk: 'low', result: `The producers merge the two, honoring the old sound. It pleases fans and pleases nobody entirely.`, effects: [{ pop: 0.4 }, { conf: 1 }] },
      { id: 'veto', label: `Veto the change and protect your identity`, risk: 'med', result: `You say no, and {boss.first} is not happy. Your music stays, and so does the staleness.`, effects: [{ pop: -0.1 }, { conf: 2 }, { money: -1500 }] },
      { id: 'co_write', label: `Co-write the theme and take a royalty cut`, risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.4, mic: 0.3 }, text: `Your fingerprints are all over the track, and the royalties from sales start to trickle in.`, effects: [{ pop: 0.8 }, { money: 8000 }, { conf: 4 }, { fatigue: 8 }] },
        { weight: 2, text: `Your writing sessions run long and the result is messy. The producers quietly use the original demo.`, effects: [{ pop: -0.1 }, { conf: -3 }, { fatigue: 10 }] } ] },
    ],
  },
  {
    id: 'bkg_catchphrase', category: 'creative', title: `They Want You to Say {phrase}`, weight: 2, major: true, cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 15,
    cast: { boss: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { popularity: { gte: 25 }, mic: { gte: 30 } } },
    slots: { phrase: [`"Welcome to My House"`, `"The Rest Can Wait"`, `"Say It Louder"`, `"No Mercy Today"`], sell: [`on a T-shirt`, `before every match`, `in a chant with the fans`] },
    body: [`{boss.name} has found you a catchphrase, {phrase}. The plan is to use it {sell}, and to build it into your promos.`, `"Say it twelve times and it is yours," {boss.first} promises. A good phrase can make a career, and a bad one is a lifetime of explaining yourself to cashiers.`],
    choices: [
      { id: 'embrace', label: `Embrace the phrase and make it your own`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, mic: 0.4 }, text: `You twist it, tease it, repeat it. Within a month the crowd is shouting it back.`, effects: [{ pop: 1.0 }, { conf: 3 }, { money: 3000 }] },
        { weight: 1, text: `It never lands. The crowd groans every time you say it.`, effects: [{ pop: -0.5 }, { conf: -3 }] } ] },
      { id: 'edit', label: `Rewrite it into something you would say`, risk: 'med', result: `{boss.first} listens to your edit and grants a reluctant yes. The new line fits you better, if it lacks a little of the original crunch.`, effects: [{ pop: 0.5 }, { conf: 3 }, { mic: 1 }] },
      { id: 'merch', label: `Take the phrase and push for merch rights`, risk: 'low', result: `The phrase becomes shirts, mugs and posters. It is not art, but it pays the bills.`, effects: [{ money: 9000 }, { pop: 0.2 }, { conf: -1 }] },
      { id: 'refuse', label: `Refuse to say it`, risk: 'high', result: `You politely decline, and your promos stay loose. The writers shrug, but they remember.`, effects: [{ conf: 2 }, { pop: -0.3 }, { money: -1500 }] },
    ],
  },
  {
    id: 'bkg_stuck_midcard', category: 'creative', title: `Winning, and Going Nowhere`, weight: 3, major: true, cooldownDays: 180, maxPerCareer: 3, categoryCooldown: 15,
    cast: { boss: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { winStreak: { gte: 3 }, popularity: { gte: 20 }, mainEvents: { lte: 1 } }, holdsTitle: false },
    slots: { place: [`the same slot on the card for months`, `the third match of every show`, `the dark match before the broadcast`], excuse: [`"the card is full"`, `"the timing is wrong"`, `"we're building to something"`] },
    body: [`You have been winning, and yet you are still in {place}. When you ask, {boss.name} gives you {excuse} and a pat on the shoulder.`, `"Be patient," {boss.first} says, which is easier to say than to hear. The fans see your wins, and the office seems not to. What you do next sets how long you stay in the middle.`],
    choices: [
      { id: 'demand', label: `Demand a bigger spot, on the record`, risk: 'high', outcomes: [
        { weight: 1, bonus: { popularity: 0.5, mic: 0.4 }, text: `{boss.first} blinks at your numbers. A better slot is promised, and the promise holds.`, effects: [{ pop: 0.7 }, { conf: 4 }, { money: 3000 }] },
        { weight: 2, text: `{boss.first} reads the demand as ingratitude. Your spot gets quieter, not louder.`, effects: [{ pop: -0.5 }, { conf: -3 }] } ] },
      { id: 'pitch', label: `Pitch a storyline that makes your wins matter`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, mic: 0.3 }, text: `Your pitch has teeth. {boss.first} loves it and slots you into a feud with real stakes.`, effects: [{ pop: 1.0 }, { conf: 4 }, { fatigue: 6 }] },
        { weight: 1, text: `The pitch is polite, and the notebook it vanishes into is never opened again.`, effects: [{ pop: 0.1 }, { conf: -1 }] } ] },
      { id: 'wait', label: `Keep winning and let the numbers speak`, risk: 'low', result: `You stay patient, sharpen your craft, and wait. The fans keep chanting for you.`, effects: [{ pop: 0.3 }, { conf: 1 }, { fatigue: 5 }, { attr: { name: 'technical', delta: 1 } }] },
      { id: 'leverage', label: `Float a rumor that another promotion is calling`, risk: 'high', outcomes: [
        { weight: 1, text: `The rumor does the trick. Suddenly there is room on the card, and a meeting with the front office.`, effects: [{ pop: 0.6 }, { conf: 3 }, { money: 5000 }] },
        { weight: 2, text: `The bluff is called. The office suggests that you should feel free to go, and your goodwill drains away.`, effects: [{ pop: -0.7 }, { conf: -5 }] } ] },
    ],
  },
  {
    id: 'bkg_feud_dropped', category: 'creative', title: `Your Feud with {rival.name} Is Being Cancelled`, weight: 3, major: true, cooldownDays: 180, maxPerCareer: 3, categoryCooldown: 12, memory: { role: 'rival', max: 1 },
    cast: { rival: { pick: 'rivalry', minHeat: 25, status: 'active' }, boss: { pick: 'staff', role: 'creative' } },
    trigger: {},
    slots: { reason: [`a change of direction`, `a better idea from the writers' room`, `an injury elsewhere on the card`], pitch: [`a quick, clean finish`, `a no-contest`, `a shoulder shrug and silence`] },
    body: [`{boss.name} drops the news: after {reason}, your feud with {rival.name} will be wrapped up with {pitch}. The story still had plenty left.`, `The rivalry is the best thing you have had, and the heat in it is real. A weak ending would waste months.`],
    choices: [
      { id: 'argue', label: `Argue that the feud has more to give`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, mic: 0.3 }, text: `{boss.first} reconsiders, extends the feud and tweaks the stakes. {rival.first} gives you a nod.`, effects: [{ rivalry: { who: 'rival', heat: 10 } }, { rel: { who: 'rival', respect: 6 } }, { pop: 0.7 }, { conf: 3 }] },
        { weight: 1, text: `The call stays. {boss.first} writes your pushback in a notebook.`, effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'grand_finale', label: `Take the finale but demand a stipulation match`, risk: 'med', result: `You agree to end it, but on your terms. The match is a bruising farewell, and it works.`, effects: [{ booking: { who: 'rival', type: 'no_dq' } }, { rel: { who: 'rival', respect: 8, heat: -6 } }, { pop: 0.7 }, { fatigue: 12 }] },
      { id: 'private', label: `Settle it privately with {rival.first} and make it real`, risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.3, confidence: 0.3 }, text: `Off the clock, you and {rival.first} work out a fight the cameras will not see. The next week it spills onto live TV by accident, and nobody can look away.`, effects: [{ rivalry: { who: 'rival', heat: 20 } }, { rel: { who: 'rival', heat: 12, respect: 6 } }, { pop: 1.1 }, { conf: 3 }, { fatigue: 8 }] },
        { weight: 2, text: `It gets heated, then ugly. The office hears of it, and a fine is attached to the warning.`, effects: [{ rivalry: { who: 'rival', heat: 14 } }, { rel: { who: 'rival', heat: 14 } }, { pop: -0.4 }, { money: -3000 }, { conf: -2 }] } ] },
      { id: 'accept', label: `Accept the call and move on`, risk: 'low', result: `You shake {rival.first}'s hand and let the story go. It is mature, and it is a little sad.`, effects: [{ rel: { who: 'rival', respect: 6, heat: -10, trust: 4 } }, { conf: -1 }] },
    ],
  },
  {
    id: 'bkg_comedy_segment', category: 'creative', title: `A Comedy Segment With {guest.name}`, weight: 2, major: true, cooldownDays: 250, maxPerCareer: 3, categoryCooldown: 12,
    cast: { boss: { pick: 'staff', role: 'creative' }, guest: { pick: 'roster', tier: { gte: 2, lte: 4 }, sameBrand: true } },
    trigger: { stat: { popularity: { gte: 20 } } },
    slots: { premise: [`a cooking contest in the ring`, `an awkward game show`, `a mock courtroom trial`, `a very long argument about a sandwich`], stake: [`a night of easy laughs`, `a chance to show range`, `a risk to your serious image`] },
    body: [`{boss.name} wants to build a comedy segment around you and {guest.name}: {premise}. It is {stake}.`, `The audience adores a wrestler who can make them laugh. They also forget quickly how tough you were.`],
    choices: [
      { id: 'commit', label: `Commit completely, with every ounce of silliness`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.7 }, text: `Your timing is perfect, and the building howls. Even {guest.first} cracks up. The segment gets clipped and shared all week.`, effects: [{ pop: 1.1 }, { conf: 3 }, { rel: { who: 'guest', respect: 6, affinity: 6 } }] },
        { weight: 1, text: `The jokes land awkwardly and the segment drags. You look silly for the wrong reasons.`, effects: [{ pop: -0.5 }, { conf: -4 }] } ] },
      { id: 'dry', label: `Play it deadpan and let {guest.first} carry the laughs`, risk: 'low', result: `Your straight-faced response becomes the punchline. It is safe and effective, if less memorable.`, effects: [{ pop: 0.5 }, { conf: 1 }, { rel: { who: 'guest', respect: 3 } }] },
      { id: 'edge', label: `Pitch a darker, more cutting version`, risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.6, charisma: 0.4 }, text: `Your edge turns the premise into something sharp and uncomfortable. Critics call it the funniest thing on the show.`, effects: [{ pop: 1.2 }, { conf: 4 }, { rel: { who: 'guest', heat: 6 } }] },
        { weight: 2, text: `The darker tone clashes with a family audience. The segment is cut short.`, effects: [{ pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'pass', label: `Pass: you want to keep your hard-case credibility`, risk: 'low', result: `You decline politely, and {guest.first} gets the spot with someone else. Your image stays intact, even if you wonder what you missed.`, effects: [{ conf: 1 }, { pop: -0.2 }, { rel: { who: 'guest', respect: -2 } }] },
    ],
  },
  {
    id: 'bkg_authority_angle', category: 'creative', title: `The Boss Wants You in a Storyline`, weight: 2, major: true, cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 20,
    cast: { owner: { pick: 'staff', role: 'owner' } },
    trigger: { minYear: 1998, stat: { popularity: { gte: 40 } } },
    slots: { angle: [`a corrupt boss who fines you for everything`, `a mentor-and-student pairing for the cameras`, `a public feud where you stand up to the bosses`], cost: [`a bruise or two`, `humiliating segments`, `a lot of screen time standing around`] },
    body: [`{owner.name} sits you down in an office that smells of old leather. The pitch: {angle}, with the owner's authority up against you on camera.`, `"You will be on every week," {owner.first} promises. Television time is guaranteed, and so is {cost}.`],
    choices: [
      { id: 'take', label: `Take the storyline and embrace the spotlight`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, mic: 0.4 }, text: `You and the owner build a rivalry on live television, and the ratings tick up with every segment. You become a household name.`, effects: [{ pop: 1.3 }, { conf: 4 }, { money: 6000 }, { fatigue: 10 }] },
        { weight: 1, text: `The owner takes over the storyline, and you are the prop. The ratings dip.`, effects: [{ pop: 0.1 }, { conf: -3 }, { money: 6000 }, { fatigue: 10 }] } ] },
      { id: 'terms', label: `Take it only if you get to win in the end`, risk: 'med', outcomes: [
        { weight: 1, bonus: { popularity: 0.5, mic: 0.3 }, text: `The owner laughs, then agrees. You get your triumph at the finale, and a little more authority at the table.`, effects: [{ pop: 0.9 }, { conf: 4 }] },
        { weight: 2, text: `The owner declines to be pinned down. The talks stall, and the storyline goes to someone else.`, effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'decline', label: `Decline: you want to be known for matches`, risk: 'low', result: `You turn down the camera time and keep your focus on the ring. The owner nods, a little surprised.`, effects: [{ conf: 2 }, { pop: -0.2 }, { fatigue: -3 }] },
      { id: 'sell', label: `Take the storyline for a large bonus`, risk: 'low', result: `You sign for the bonus, play the part, and take the check. The segments are fine and your bank account is better.`, effects: [{ money: 16000 }, { pop: 0.3 }, { conf: -1 }, { fatigue: 8 }] },
    ],
  },
  {
    id: 'bkg_rival_takes_spot', category: 'creative', title: `{usurper.name} Gets Your Spot`, weight: 3, major: true, cooldownDays: 180, maxPerCareer: 3, categoryCooldown: 12,
    cast: { usurper: { pick: 'roster', tier: { gte: 1, lte: 3 }, sameBrand: true }, boss: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { popularity: { gte: 30 } }, daysSince: { match: { lte: 14 } } },
    slots: { spot: [`your spot against a top star`, `the match you had been promised`, `the segment you pitched`], excuse: [`"fresh energy"`, `"a better chemistry"`, `"a reaction we can't ignore"`] },
    body: [`The card sheet is posted, and {spot} now belongs to {usurper.name}. {boss.name} gives you {excuse} as the reason.`, `You have worked years for this. {usurper.first} is waiting by the door, looking uncomfortably guilty or very smug.`],
    choices: [
      { id: 'graceful', label: `Take it gracefully and wish {usurper.first} luck`, risk: 'low', result: `You offer congratulations and mean most of it. The locker room sees class, and {boss.first} takes note.`, effects: [{ rel: { who: 'usurper', respect: 8, trust: 5 } }, { conf: -3 }, { pop: 0.1 }] },
      { id: 'fight', label: `Fight for your spot in front of {boss.first}`, risk: 'high', outcomes: [
        { weight: 1, bonus: { popularity: 0.5, confidence: 0.4 }, text: `You make the case with facts and heat. {boss.first} concedes half the argument, and you share the spot.`, effects: [{ rel: { who: 'usurper', heat: 8, respect: 2 } }, { pop: 0.7 }, { conf: 4 }] },
        { weight: 2, text: `The argument gets personal, and {boss.first} dismisses you with a tight smile. The spot stays gone.`, effects: [{ rel: { who: 'usurper', heat: 6 } }, { pop: -0.4 }, { conf: -4 }] } ] },
      { id: 'challenge', label: `Challenge {usurper.first} to earn it in the ring`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4, confidence: 0.3 }, text: `You take the match and show why the spot should be yours. The rivalry is born in a hard fight.`, effects: [{ booking: { who: 'usurper', type: 'singles' } }, { rivalry: { who: 'usurper', heat: 14 } }, { pop: 0.9 }, { conf: 3 }, { fatigue: 8 }] },
        { weight: 1, text: `{usurper.first} wins the match convincingly, and your position gets worse.`, effects: [{ booking: { who: 'usurper', type: 'singles' } }, { rivalry: { who: 'usurper', heat: 8 } }, { pop: -0.4 }, { conf: -4 }, { fatigue: 8 }] } ] },
      { id: 'sabotage', label: `Spread doubt about {usurper.first} in the locker room`, risk: 'high', outcomes: [
        { weight: 1, text: `The whisper campaign works. {usurper.first}'s spot is tweaked, and yours comes back. But it leaves a stain.`, effects: [{ rel: { who: 'usurper', trust: -16, heat: 14 } }, { pop: 0.2 }, { conf: 1 }] },
        { weight: 2, text: `Someone repeats it to {usurper.first} word for word. You are now seen as petty.`, effects: [{ rel: { who: 'usurper', trust: -20, heat: 18, respect: -8 } }, { pop: -0.6 }, { conf: -4 }, { event: { type: 'betrayal', participants: ['usurper'], summary: `Spread rumors about {usurper.name} to win back a spot.`, data: {} } }] } ] },
    ],
  },
  {
    id: 'bkg_pitch_meeting', category: 'creative', title: `Your Chance to Pitch a Storyline`, weight: 3, major: true, cooldownDays: 150, maxPerCareer: 4, categoryCooldown: 10,
    cast: { boss: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { popularity: { gte: 20 }, mic: { gte: 30 } } },
    slots: { room: [`a cramped conference room`, `a hotel suite at midnight`, `the back of a rental van`], idea: [`a rivalry born from an old tag partnership`, `a mysterious attacker who is never named`, `a grudge about a stolen finisher`, `a redemption run from last place`] },
    body: [`In {room}, {boss.name} offers you ten minutes to pitch anything you like. You have been carrying an idea around for weeks: {idea}.`, `"Make me believe it," {boss.first} says. Writers rarely let wrestlers drive, and when they do, the idea lives or dies by how well you sell it.`],
    choices: [
      { id: 'full_pitch', label: `Pitch the whole story, beginning to end`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.4 }, text: `You paint the whole arc, and {boss.first} leans forward. The story goes on the board and you are in it.`, effects: [{ pop: 1.1 }, { conf: 4 }, { fatigue: 6 }] },
        { weight: 1, text: `You lose the room halfway through. The story is shelved, but your effort is noticed.`, effects: [{ pop: 0.1 }, { conf: -2 }] } ] },
      { id: 'hook', label: `Pitch only the hook and leave the rest to them`, risk: 'low', result: `You give the room a clean hook and let the writers fill in the gaps. They like the idea and the control it gives them.`, effects: [{ pop: 0.5 }, { conf: 2 }] },
      { id: 'tradeoff', label: `Offer to take a loss in return for the green light`, risk: 'med', result: `{boss.first} agrees, but the loss comes first. You eat a defeat on television to buy a better story.`, effects: [{ pop: 0.6 }, { conf: -1 }, { money: 2000 }] },
      { id: 'steal', label: `Pitch another wrestler's idea as your own`, risk: 'high', outcomes: [
        { weight: 1, text: `Nobody knows. The idea works and you get the credit.`, effects: [{ pop: 1.0 }, { conf: 2 }] },
        { weight: 2, text: `The original wrestler is in the room, and the silence is deafening. Word spreads quickly.`, effects: [{ pop: -0.8 }, { conf: -5 }, { money: -1500 }] } ] },
    ],
  },
  {
    id: 'bkg_match_length_dispute', category: 'creative', title: `Too Long, or Not Long Enough?`, weight: 2, major: true, cooldownDays: 150, maxPerCareer: 4, categoryCooldown: 10, contexts: ['post_match', 'post_show'],
    cast: { boss: { pick: 'staff', role: 'producer' }, opp: { pick: 'roster', tier: { gte: 1, lte: 3 }, sameBrand: true } },
    trigger: { stat: { matches: { gte: 10 }, popularity: { gte: 20 } }, daysSince: { match: { lte: 3 } } },
    slots: { verdict: [`ran fifteen minutes over its slot`, `felt rushed and under-built`, `was a showstopper the crowd wanted to see longer`], note: [`took a long conversation with the truck`, `forced a whole segment to be moved`, `earned an eyebrow from upstairs`] },
    body: [`Your match with {opp.name} {verdict}, and {boss.name} walks into the locker room with a note: it {note}.`, `You and {opp.first} both believe in the work. The debrief is going to go one of several ways.`],
    choices: [
      { id: 'own', label: `Own the problem and change how you pace matches`, risk: 'low', result: `You take the note and refine your approach. {boss.first} notices, and so does {opp.first}.`, effects: [{ rel: { who: 'opp', respect: 4 } }, { attr: { name: 'psychology', delta: 1 } }, { conf: -1 }, { pop: 0.1 }] },
      { id: 'defend', label: `Defend the match as the best thing on the show`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4, confidence: 0.3 }, text: `You make a convincing case, and {boss.first} gives ground. The match becomes a reference point.`, effects: [{ rel: { who: 'opp', respect: 6 } }, { pop: 0.6 }, { conf: 3 }] },
        { weight: 1, text: `{boss.first} is not impressed, and the conversation ends coldly.`, effects: [{ rel: { who: 'opp', respect: 2 } }, { pop: -0.2 }, { conf: -3 }] } ] },
      { id: 'blame', label: `Blame {opp.first} for the problems`, risk: 'high', result: `{opp.first} hears that you tried to push the problem onto {opp.them}. The locker room is silent for the rest of the week.`, effects: [{ rel: { who: 'opp', trust: -14, heat: 12, respect: -8 } }, { conf: 1 }, { pop: -0.4 }] },
      { id: 'rework', label: `Offer to rework the match with {opp.first} next time`, risk: 'low', result: `You and {opp.first} sit down with a notepad and rework the structure. It costs time and builds trust.`, effects: [{ rel: { who: 'opp', trust: 8, respect: 6 } }, { fatigue: 6 }, { pop: 0.2 }, { conf: 2 }] },
    ],
  },
];
