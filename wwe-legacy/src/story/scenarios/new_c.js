// New memory-driven scenarios (batch C): rivalry, betrayal, alliance, faction, mentor.
// Scenes cite history only through mem triggers, memory blocks and ledger-backed cast picks; flags chain arcs across templates.
export default [
  // ===================================================================== RIVALRY
  {
    id: 'nc_riv_even_ledger', category: 'rivalry', title: 'The Tally with {rival.name}', weight: 2, cooldownDays: 120, maxPerCareer: 2,
    trigger: { mem: [{ role: 'rival', h2h: { winsGte: 1, lossesGte: 1 } }], noFlag: 'nc_decider_set' },
    cast: { rival: { pick: 'rivalry', minHeat: 15 } }, memory: { role: 'rival', max: 1, noResults: true },
    slots: { keeper: [`a ring announcer with a clipboard`, `a trainer with a dry-erase marker`, `a fan with a spiral notebook`, `a camera operator who bets on everything`], spot: [`the hallway outside catering`, `the loading dock`, `the stairwell below the gorilla position`, `the bus lot behind the arena`] },
    body: [`Each of you has taken a fall off the other now, and the building has noticed. In {spot}, {keeper} is passing around a running tally that has your name on one side and {rival.name}'s on the other.`, `{rival.first} is reading it over somebody's shoulder, jaw working. Neither of you wants to be the first to say the word decider.`],
    choices: [
      { id: 'decider', label: 'Call for a decider, winner takes the tally', risk: 'med', result: `You say it loud enough for the whole hallway to hear. {rival.first} just says, "Name the night," and by morning the office has it penciled in with both names underlined.`, effects: [{ booking: { who: 'rival', type: 'singles' } }, { promise: { kind: 'win_match', who: 'rival', text: `I will settle the tally with {rival.name} for good`, deadlineDays: 40 } }, { flag: 'nc_decider_set' }, { rel: { who: 'rival', respect: 3, heat: 5 } }, { pop: 0.4 }, { fatigue: 4 }] },
      { id: 'sign', label: 'Sign the board and call it even', risk: 'low', result: `You scrawl your initials under the last line and hand over the pen. It is a small, tidy peace, and the room goes back to its sandwiches.`, effects: [{ rivalry: { who: 'rival', heat: -8 } }, { rel: { who: 'rival', respect: 4, trust: 3, heat: -5 } }, { pop: -0.2 }, { conf: 1 }] },
      { id: 'fudge', label: 'Quietly add a mark in your favor', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `Nobody counts the marks twice. The sheet goes up on the wall showing you one ahead, and you carry the smug warmth of it into the building.`, effects: [{ conf: 3 }, { pop: 0.2 }] },
        { weight: 1, text: `{rival.first} counts the marks twice. The silence that follows is worse than any shouting, and the story spreads before you reach the showers.`, effects: [{ rel: { who: 'rival', trust: -8, heat: 10, respect: -4 } }, { rivalry: { who: 'rival', heat: 8 } }, { pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'shrug', label: 'Walk past it: scoreboards are for fans', risk: 'low', result: `You keep walking and keep your eyes on the floor. The tally stays on the wall, and the question stays in the air.`, effects: [{ conf: 1 }, { fatigue: -2 }, { rel: { who: 'rival', respect: -1 } }] },
    ],
  },
  {
    id: 'nc_riv_lead_lonely', category: 'rivalry', title: 'Winning Against {rival.name} Gets Lonely', weight: 2, cooldownDays: 100, maxPerCareer: 2,
    trigger: { mem: [{ role: 'rival', h2h: { winsGte: 3 } }], noFlag: 'nc_gave_win' },
    cast: { rival: { pick: 'rivalry', minHeat: 10 } }, memory: { role: 'rival', max: 2 },
    slots: { habit: [`eats alone at the far end of catering`, `watches your matches on the monitor with no expression`, `shadowboxes in an empty hallway`, `has stopped talking to anyone in the room`], time: [`again tonight`, `for the third night running`, `all week`, `since the last card`] },
    body: [`The wins over {rival.name} keep stacking up, and tonight they stop feeling like a victory lap. {rival.first} {habit} {time}, and the numbers on your side of the ledger start to look like a debt.`, `A feud only works while the loser still has somewhere to go. {rival.first} looks like somebody running out of road, and you are the reason.`],
    choices: [
      { id: 'give_win', label: 'Pitch a finish where {rival.first} goes over', risk: 'low', result: `The agent grumbles and writes it in pencil. {rival.first} learns whose idea it was and, for once, says "Thank you" without a hook in it.`, effects: [{ flag: 'nc_gave_win' }, { rel: { who: 'rival', respect: 8, trust: 6, heat: -8 } }, { rivalry: { who: 'rival', heat: -6 } }, { pop: -0.4 }, { conf: -2 }] },
      { id: 'twist', label: 'Rub it in on the microphone', risk: 'med', result: `The crowd eats it up, and the clip travels. {rival.first} hears every word from the curtain and does not blink.`, effects: [{ rivalry: { who: 'rival', heat: 8 } }, { rel: { who: 'rival', respect: -5, heat: 10, fear: 4 } }, { pop: 0.7 }, { conf: 3 }] },
      { id: 'coffee', label: 'Sit down with a coffee and say nothing about it', risk: 'low', result: `You slide a cup across the table and talk about anything else. It is a small thing, and {rival.first} takes it as exactly that.`, effects: [{ rel: { who: 'rival', respect: 4, affinity: 5, trust: 3 } }, { fatigue: 1 }] },
      { id: 'distance', label: 'Keep your distance and keep winning', risk: 'low', result: `You stay out of the story. The wins keep coming, and so does the quiet.`, effects: [{ conf: 2 }, { fatigue: -2 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'nc_riv_losing_doubt', category: 'rivalry', title: 'The Night After Losing to {rival.name} Again', weight: 3, cooldownDays: 100, maxPerCareer: 2,
    trigger: { mem: [{ role: 'rival', h2h: { lossesGte: 3 }, last: { result: 'loss', within: 4 } }], noFlag: 'nc_doubt' },
    cast: { rival: { pick: 'rivalry', minHeat: 10 } }, memory: { role: 'rival', max: 2, noResults: true },
    slots: { hour: [`a hotel room at 3 a.m.`, `a rest stop off the interstate`, `the back row of an empty arena`, `a diner two towns past the show`], reminder: [`a fan sign cheering for the other side`, `the way the referee's hand slaps the mat`, `a highlight reel in the lobby`, `the sound of the other locker room cheering`] },
    body: [`Sleep will not come in {hour}, and every time you close your eyes there is {reminder}. The losses to {rival.name} have stopped being a streak and started being a thing you believe about yourself.`, `Doubt is part of the job, but it usually passes. This one has a name and a face, and tomorrow you have to work the same building.`],
    choices: [
      { id: 'tape', label: 'Break down the tape until you find the pattern', risk: 'low', result: `By dawn you have a notebook full of habits: where {rival.first} loads a move, which corner gets favored. It costs you the night, and it feels like owning something again.`, effects: [{ flag: 'nc_doubt' }, { attr: { name: 'psychology', delta: 1 } }, { conf: 4 }, { fatigue: 7 }] },
      { id: 'ask', label: 'Ask {rival.first} what you keep getting wrong', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{rival.first} is quiet for a while, then says it flat: "You go to the same exit every time." It stings and it helps, and something unfreezes between you.`, effects: [{ flag: 'nc_doubt' }, { rel: { who: 'rival', respect: 6, trust: 4 } }, { conf: 1 }, { attr: { name: 'technical', delta: 1 } }] },
        { weight: 1, text: `{rival.first} just smiles and says it is not that kind of friendship. You walk away with nothing but a clearer picture of how it looks from the outside.`, effects: [{ flag: 'nc_doubt' }, { conf: -4 }, { rel: { who: 'rival', respect: -2 } }] } ] },
      { id: 'stip', label: 'Demand a stipulation where the pattern breaks', risk: 'high', result: `The next morning you storm into the office and ask for chaos: no disqualification, no safe habits. The producer likes the fire in it, and your ribs are already complaining.`, effects: [{ flag: 'nc_doubt' }, { booking: { who: 'rival', type: 'no_dq' } }, { rivalry: { who: 'rival', heat: 10 } }, { pop: 0.4 }, { fatigue: 6 }] },
      { id: 'rest', label: 'Take the night off and let it be a bad week', risk: 'low', result: `You turn off the phone and sleep until noon. The doubt is still there when you wake up, but smaller, and a little embarrassed.`, effects: [{ fatigue: -8 }, { conf: -2 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'nc_riv_grudge_tape', category: 'rivalry', title: '{rival.name} Wants the Finish Reviewed', weight: 3, cooldownDays: 40, maxPerCareer: 6, categoryCooldown: 3,
    trigger: { mem: [{ role: 'rival', h2h: { matchesGte: 1 } }] },
    cast: { rival: { pick: 'obligation', kind: 'grudge_rematch' } }, memory: { role: 'rival', max: 2 },
    slots: { proof: [`a frozen frame on the monitor`, `a stack of printed stills`, `a clip cued up on the producer's laptop`, `a hand-drawn diagram on the back of a call sheet`], finish: [`the roll-up`, `the foot on the ropes`, `the shove behind the referee's back`, `the handful of tights`] },
    body: [`{rival.name} has brought {proof} to the production office and is tapping it with one finger. "Everybody who has watched it twice knows {finish} was not clean," {rival.first} says.`, `The producer looks at you over the top of a coffee cup. This is the kind of complaint that either becomes a rematch or becomes a month of muttering.`],
    choices: [
      { id: 'rematch', label: 'Agree to a rematch with a neutral referee', risk: 'low', result: `The producer writes it down before you can add conditions. {rival.first} nods, grudgingly, which for {rival.them} is a handshake.`, effects: [{ booking: { who: 'rival', type: 'singles' } }, { rel: { who: 'rival', respect: 4, heat: -4 } }, { pop: 0.2 }] },
      { id: 'concede', label: 'Admit the finish was cheap, out loud', risk: 'med', result: `The words cost you something, and the room is stunned. {rival.first} stares at you, unsure what to do with a victory that large.`, effects: [{ rel: { who: 'rival', respect: 8, trust: 5, heat: -12 } }, { conf: -3 }, { pop: -0.2 }, { rivalry: { who: 'rival', heat: -8 } }] },
      { id: 'deny', label: 'Deny it flatly and ask what {rival.first} plans to do', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: `You say it with a straight face and the producer lets it go. {rival.first} leaves with the proof folded in a back pocket and a promise on {rival.their} lips.`, effects: [{ rivalry: { who: 'rival', heat: 12 } }, { rel: { who: 'rival', heat: 10, respect: -3 } }, { conf: 3 }, { pop: 0.3 }] },
        { weight: 1, text: `The producer watches the clip a third time and says nothing, which is worse. Your next few finishes will be supervised by someone with a stopwatch and an opinion.`, effects: [{ rivalry: { who: 'rival', heat: 8 } }, { rel: { who: 'rival', heat: 8 } }, { pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'no_dq', label: 'Offer a match where nothing can be disputed', risk: 'med', result: `No disqualifications, no counts, no excuses. The producer grins like someone who just found a headline.`, effects: [{ booking: { who: 'rival', type: 'no_dq' } }, { rivalry: { who: 'rival', heat: 6 } }, { pop: 0.5 }, { fatigue: 5 }] },
    ],
  },
  {
    id: 'nc_riv_family_line', category: 'rivalry', title: 'The Line Nobody Mentions', weight: 2, cooldownDays: 150, maxPerCareer: 1, major: true,
    trigger: { rivalry: { minHeat: 40 }, mem: [{ role: 'rival', heatGte: 30 }] },
    cast: { rival: { pick: 'rivalry', minHeat: 40 }, creative: { pick: 'staff', role: 'creative' } }, memory: { role: 'rival', max: 2 },
    slots: { guest: [`{rival.their} mother`, `{rival.their} younger brother`, `{rival.their} daughter`, `{rival.their} old trainer`], seat: [`in the third row`, `by the barricade`, `at the merch stand`, `just inside the entrance tunnel`] },
    body: [`Word comes down that {rival.name} has brought {guest} to the show, and the guest is sitting {seat}. {creative.name} has already seen the opportunity. "Hypothetically," {creative.first} says with a raised eyebrow, "a camera could walk past."`, `This feud has been hot enough to burn through most unwritten rules. The question is whether there is still one left that you are willing to keep.`],
    choices: [
      { id: 'leave_out', label: 'Rule it off limits and tell the writers so', risk: 'low', result: `You tell {creative.first} flatly that nobody goes near the seat. {rival.first} never hears about it, but a stagehand does, and by midnight the locker room knows.`, effects: [{ flag: 'nc_family_line' }, { rel: { who: 'rival', respect: 5, trust: 3, heat: -6 } }, { pop: -0.2 }, { conf: 1 }] },
      { id: 'greet', label: 'Go over and say hello, with no cameras', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `You shake a hand, say something kind, and leave. When {rival.first} hears about it the next morning, the look on {rival.their} face is hard to read and impossible to fake.`, effects: [{ flag: 'nc_family_line' }, { rel: { who: 'rival', respect: 8, trust: 5, heat: -10 } }, { tag: { who: 'rival', tag: 'respected_by' } }] },
        { weight: 1, text: `It lands as a threat in a nice jacket. {rival.first} hears a version where you cornered someone's family, and the apology you offer next only makes it worse.`, effects: [{ rel: { who: 'rival', trust: -6, heat: 12 } }, { rivalry: { who: 'rival', heat: 8 } }, { conf: -3 }] } ] },
      { id: 'use', label: 'Let creative use it for the angle', risk: 'high', result: `The segment is brutal and the crowd gasps. It is the best television you have made in months, and {rival.first} will remember the night as the point where this stopped being a story.`, effects: [{ pop: 1.0 }, { rivalry: { who: 'rival', heat: 14 } }, { rel: { who: 'rival', heat: 16, respect: -10, fear: 3 } }, { obligation: { kind: 'seek_revenge', who: 'rival', inDays: 8 } }, { money: 4000 }] },
      { id: 'ignore', label: 'Shrug and let the room decide for itself', risk: 'low', result: `You say neither yes nor no. The segment never quite gets written, and nobody is sure whether you were protecting someone or just being lazy.`, effects: [{ rel: { who: 'rival', respect: 1 } }, { conf: -1 }] },
    ],
  },
  {
    id: 'nc_riv_decider_aftermath', category: 'rivalry', title: 'After the Decider', weight: 4, cooldownDays: 60, maxPerCareer: 2, contexts: ['post_match'],
    trigger: { flag: 'nc_decider_set', mem: [{ role: 'rival', h2h: { matchesGte: 3 }, last: { within: 1 } }] },
    cast: { rival: { pick: 'rivalry', minHeat: 10 } }, memory: { role: 'rival', max: 2, noResults: true },
    slots: { perch: [`on the steps by the curtain`, `on an equipment case`, `at the end of the shower line`, `in the corner of the trainers' room`], thing: [`a bag of ice`, `a towel`, `a bottle of water`, `a roll of tape`] },
    body: [`The tally is settled, one way or the other, and the arena has emptied around you. {rival.name} sits {perch} with {thing} in hand, one arm wrapped around a sore rib, looking at nothing.`, `Neither of you has a script for this part. The decider was supposed to feel like the end, and instead it feels like the first quiet moment in weeks.`],
    choices: [
      { id: 'sit', label: 'Sit down beside {rival.them} without a word', risk: 'low', result: `The two of you stare at the same patch of floor for a long time. When {rival.first} finally laughs, it is short and tired. "Never doing that again," {rival.first} says, which is the most honest thing said all month.`, effects: [{ clearFlag: 'nc_decider_set' }, { rel: { who: 'rival', respect: 7, trust: 5, heat: -10 } }, { rivalry: { who: 'rival', heat: -10 } }, { conf: 1 }] },
      { id: 'pass', label: 'Leave what {rival.first} needs within reach and move on', risk: 'low', result: `You set something cold within reach and walk out. It is a small kindness, and {rival.first} will remember who left it.`, effects: [{ clearFlag: 'nc_decider_set' }, { rel: { who: 'rival', respect: 3, affinity: 3 } }, { fatigue: -2 }] },
      { id: 'sequel', label: 'Tell {rival.them} this was only the first chapter', risk: 'med', result: `{rival.first} looks up, and for a moment the old fire is back in {rival.their} eyes. By Monday the office has a sequel idea, and neither of you can quite take it back.`, effects: [{ clearFlag: 'nc_decider_set' }, { rivalry: { who: 'rival', heat: 10 } }, { rel: { who: 'rival', heat: 6 } }, { pop: 0.5 }, { fatigue: 3 }] },
      { id: 'press', label: 'Leave for the interview line and take the credit', risk: 'low', result: `You do three quick interviews and say all the right things about the war. {rival.first} watches the replay later and notices how little of it mentioned {rival.them}.`, effects: [{ clearFlag: 'nc_decider_set' }, { pop: 0.6 }, { rel: { who: 'rival', respect: -3, heat: 3 } }, { mic: 1 }] },
    ],
  },
  {
    id: 'nc_riv_asks_notes', category: 'rivalry', title: '{rival.name} Asks for Notes', weight: 2, cooldownDays: 110, maxPerCareer: 2,
    trigger: { mem: [{ role: 'rival', respectGte: 20 }] },
    cast: { rival: { pick: 'rivalry', minHeat: 10 } }, memory: { role: 'rival', max: 1 },
    slots: { problem: [`a finish that never looks real`, `a promo that keeps coming out stiff`, `a dive that ends in a bad landing`, `a hot tag the crowd never quite buys`], place: [`the ring after the building empties`, `a corner of the catering room`, `the back seat of a rental car`, `the production office after hours`] },
    body: [`{rival.name} finds you in {place} and asks the one question nobody in this business asks an enemy. "I have {problem}," {rival.first} says. "Tell me the truth."`, `The respect between you has grown a lot since the feud began, and it makes the request feel harder to refuse and harder to trust. Teaching a rival is a strange kind of gift.`],
    choices: [
      { id: 'coach', label: 'Give your honest notes, all of them', risk: 'low', result: `It takes two hours and most of your patience. {rival.first} leaves with a notebook full of fixes, and a different view of who has been standing across the ring.`, effects: [{ rel: { who: 'rival', respect: 7, trust: 6, affinity: 4 } }, { rivalry: { who: 'rival', heat: -4 } }, { fatigue: 4 }, { conf: 1 }] },
      { id: 'trap', label: 'Give notes that quietly make it worse', risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.3 }, text: `{rival.first} tries your fix and it goes wrong in front of a live crowd. Nobody ever traces it to you, but you will not enjoy remembering it.`, effects: [{ pop: 0.3 }, { conf: -2 }, { rel: { who: 'rival', trust: 2 } }] },
        { weight: 2, text: `{rival.first} tests the fix in the empty ring first and sees through it in a minute. The silence afterwards is long, and the trust you had is gone.`, effects: [{ rel: { who: 'rival', trust: -12, respect: -6, heat: 10 } }, { rivalry: { who: 'rival', heat: 8 } }, { conf: -3 }] } ] },
      { id: 'trade', label: 'Trade notes: you want something in return', risk: 'med', result: `{rival.first} frowns, then agrees. You spend the evening swapping criticisms, and your own work comes out sharper for it.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { rel: { who: 'rival', respect: 3, trust: 2 } }, { fatigue: 5 }] },
      { id: 'decline', label: 'Say no: the feud is not a classroom', risk: 'low', result: `"Figure it out yourself," you say, without malice. {rival.first} nods and goes away, and the feud keeps its edge.`, effects: [{ rel: { who: 'rival', respect: -2 } }, { conf: 2 }, { rivalry: { who: 'rival', heat: 3 } }] },
    ],
  },
  {
    id: 'nc_riv_trust_wall', category: 'rivalry', title: '{rival.name} Will Not Turn a Back', weight: 2, cooldownDays: 90, maxPerCareer: 2,
    trigger: { mem: [{ role: 'rival', trustLte: -10 }] },
    cast: { rival: { pick: 'rivalry', minHeat: 15 }, agent: { pick: 'staff', role: 'agent' } }, memory: { role: 'rival', max: 2 },
    slots: { precaution: [`refuses the first bump until the whole sequence is walked through`, `has asked for a different referee`, `keeps a trainer parked at the curtain`, `insists on writing every spot on the back of a hand`], mood: [`polite and ice cold`, `visibly rattled`, `strangely cheerful`, `furious but professional`] },
    body: [`{agent.name} pulls you aside before the match. {rival.name} {precaution}, and is otherwise {mood}, which tells you everything about how much faith is left in you.`, `Trust is the only real currency in a ring, and yours has been marked down. Whatever you do now will be read as a character reference.`],
    choices: [
      { id: 'walk_it', label: 'Walk the whole match with {rival.them}, spot by spot', risk: 'low', result: `It takes forty minutes and costs you your dinner. {rival.first} watches your face for tricks, says "Once more from the top," and finds none the second time either. The match goes off without a flaw.`, effects: [{ rel: { who: 'rival', trust: 9, respect: 3 } }, { fatigue: 5 }, { pop: 0.2 }] },
      { id: 'mock', label: 'Make a joke of the paranoia in front of the crew', risk: 'med', result: `The crew laughs, and {rival.first} goes gray around the mouth. The match is stiffer than it needed to be, in every sense.`, effects: [{ pop: 0.3 }, { rel: { who: 'rival', trust: -6, heat: 8, respect: -3 } }, { rivalry: { who: 'rival', heat: 6 } }, { fatigue: 3 }] },
      { id: 'sweat', label: 'Let {rival.them} sweat: fear sells', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `{rival.first} spends the match looking over {rival.their} shoulder, and the crowd reads every flinch as terror. It is the most convincing work either of you has done in weeks.`, effects: [{ pop: 0.9 }, { rel: { who: 'rival', fear: 8, trust: -4 } }, { conf: 2 }] },
        { weight: 1, text: `{rival.first} flinches at the wrong moment and takes a bad landing. The agent glares at you, and for once you cannot argue.`, effects: [{ pop: -0.5 }, { conf: -3 }, { rel: { who: 'rival', trust: -6, heat: 6 } }, { fatigue: 4 }] } ] },
      { id: 'sheet', label: 'Hand the agent a written spot sheet and sign it', risk: 'low', result: `A signed page is a strange gift to hand an enemy, but {rival.first} reads every line. It is a small kind of surrender, and it calms the room.`, effects: [{ rel: { who: 'rival', trust: 5, respect: 2 } }, { conf: -1 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'nc_riv_insult_reply', category: 'rivalry', title: '{rival.name} Has Rehearsed a Reply', weight: 3, cooldownDays: 70, maxPerCareer: 3,
    trigger: { mem: [{ role: 'rival', tag: 'insulted_by' }] },
    cast: { rival: { pick: 'tag', tag: 'insulted_by' }, host: { pick: 'media', kind: 'host' } }, memory: { role: 'rival', max: 2 },
    slots: { delivery: [`a clipped, quiet speech`, `an uncomfortably accurate impression of you`, `a list read from a crumpled index card`, `a story about your first week that you hoped had been forgotten`], stage: [`on the pre-show press line`, `during a live segment`, `in front of a catering-room audience of forty people`, `in the middle of a house show intermission`] },
    body: [`The things you said about {rival.name} have been sitting in a drawer for weeks, and tonight the drawer opens. {rival.first} gives {delivery} {stage} while {host.name} lets the camera linger, and the laugh it gets is the worst part.`, `You can feel every set of eyes turning to see how you take it. Whatever you do next will be treated as your reply to the reply.`],
    choices: [
      { id: 'listen', label: 'Listen to the whole thing without moving', risk: 'low', result: `You stand there with your arms by your sides, and the laughter dies off one row at a time. {rival.first} finishes the speech to a quieter room than planned.`, effects: [{ rel: { who: 'rival', respect: 5, heat: -4 } }, { conf: 1 }, { pop: 0.2 }] },
      { id: 'counter', label: 'Counter with something sharper', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.7 }, text: `Your answer is half the length and twice the cruelty, and it gets the bigger laugh. {rival.first} stares at the floor and the feud swings your way.`, effects: [{ pop: 0.8 }, { conf: 3 }, { rivalry: { who: 'rival', heat: 8 } }, { rel: { who: 'rival', heat: 8 } }] },
        { weight: 1, text: `The line misses by an inch, which in this room is a mile. {rival.first} lets the silence do the work.`, effects: [{ pop: -0.5 }, { conf: -3 }, { rel: { who: 'rival', respect: 2 } }] } ] },
      { id: 'apologise', label: 'Take the microphone and apologize', risk: 'med', result: `You say you were wrong about some of it and mean most of it. {rival.first} does not forgive you, but the heat comes down a degree.`, effects: [{ rel: { who: 'rival', heat: -12, respect: 4, trust: 3 } }, { rivalry: { who: 'rival', heat: -6 } }, { conf: -2 }, { pop: -0.2 }] },
      { id: 'challenge', label: 'Cut it short and challenge {rival.them} to a match', risk: 'high', result: `You tell {rival.first} that words are cheap and the ring is not. The building roars, and now there is a date with your name on it.`, effects: [{ obligation: { kind: 'answer_challenge', who: 'rival', inDays: 5 } }, { rivalry: { who: 'rival', heat: 10 } }, { pop: 0.6 }, { fatigue: 3 }] },
    ],
  },
  {
    id: 'nc_riv_reluctant', category: 'rivalry', title: '{rival.name} Does Not Want the Match', weight: 2, cooldownDays: 90, maxPerCareer: 2,
    trigger: { mem: [{ role: 'rival', tag: 'reluctant', h2h: { winsGte: 2 } }] },
    cast: { rival: { pick: 'tag', tag: 'reluctant' }, agent: { pick: 'staff', role: 'agent' } }, memory: { role: 'rival', max: 2 },
    slots: { dodge: [`hides in the production office`, `asks to be moved to the other show`, `suddenly loves tag matches`, `has developed a sore shoulder on the exact day of your card`], crowd: [`a hostile crowd`, `a sympathetic crowd`, `a crowd that has stopped caring`, `a crowd that wants a fresh face`] },
    body: [`{rival.name} has been beaten by you so many times that the whole building can see the dread. Now {rival.first} {dodge}, and {agent.name} wants to know whether you are going to make it harder.`, `The fans have noticed too, and tonight there is {crowd} waiting to see which way this goes. A beaten rival can become an asset or a burden, depending entirely on what you do with the chance.`],
    choices: [
      { id: 'mercy', label: 'Quietly ask the agent to give {rival.them} a rest', risk: 'low', result: `The agent files {rival.first} under rest and nobody speaks about it. Weeks later, {rival.first} puts a coffee in your hand. "Don't mention it," {rival.first} says, and neither of you does.`, effects: [{ rel: { who: 'rival', respect: 7, trust: 5, affinity: 4 } }, { pop: -0.3 }, { conf: -1 }] },
      { id: 'force', label: 'Insist on the match: nobody ducks you', risk: 'med', result: `The agent books it. {rival.first} walks to the ring like a person walking to a dentist, and the crowd sees every step.`, effects: [{ booking: { who: 'rival', type: 'singles' } }, { rel: { who: 'rival', fear: 8, respect: -3 } }, { pop: 0.5 }, { fatigue: 3 }] },
      { id: 'carry', label: 'Promise to carry the match and make {rival.them} look good', risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4, charisma: 0.3 }, text: `You build the whole thing around {rival.first}'s strengths and let the crowd believe in a comeback. By the final bell they are chanting {rival.their} name, and so are you, quietly.`, effects: [{ booking: { who: 'rival', type: 'singles' } }, { rel: { who: 'rival', trust: 9, respect: 6, fear: -6 } }, { pop: 0.4 }, { fatigue: 7 }] },
        { weight: 1, text: `{rival.first} freezes halfway through the sequence and you spend twenty minutes covering holes. The agent says it was a rescue, not a match.`, effects: [{ booking: { who: 'rival', type: 'singles' } }, { rel: { who: 'rival', trust: 4 } }, { fatigue: 10 }, { pop: -0.3 }] } ] },
      { id: 'expose', label: 'Call {rival.them} out on television for ducking you', risk: 'high', result: `The crowd turns on {rival.first} instantly, and the heat is real. Whatever was left of that relationship goes in the trash.`, effects: [{ pop: 0.8 }, { rivalry: { who: 'rival', heat: 12 } }, { rel: { who: 'rival', heat: 14, respect: -8, trust: -6 } }, { conf: 2 }] },
    ],
  },
  {
    id: 'nc_riv_bedside', category: 'rivalry', title: 'A Visitor While You Heal', weight: 3, cooldownDays: 100, maxPerCareer: 2,
    trigger: { injured: true, mem: [{ role: 'rival', heatGte: 10 }] },
    cast: { rival: { pick: 'rivalry', minHeat: 20 } }, memory: { role: 'rival', max: 2 },
    slots: { gift: [`a bag of ice and a bad joke`, `a plain paper bag of fruit`, `a hand-written card with a stiff signature`, `a pair of cheap crutches nobody asked for`], timing: [`at ten in the morning`, `just after a late physio session`, `with the hallway still dark`, `during the one hour you were finally sleeping`] },
    body: [`The knock comes {timing}, and when you open the door {rival.name} is standing there holding {gift}. The two of you have spent this feud trying to hurt each other, and neither of you says a word about it.`, `"I am not here for the story," {rival.first} says, before you can ask. Whatever this is, no camera will ever see it.`],
    choices: [
      { id: 'accept', label: 'Take the gift and let {rival.them} in', risk: 'low', result: `You make bad tea and talk about nothing for an hour. When {rival.first} leaves, the feud is still there, but it has somewhere to rest.`, effects: [{ rel: { who: 'rival', respect: 7, trust: 5, heat: -10, affinity: 4 } }, { rivalry: { who: 'rival', heat: -6 } }, { fatigue: -3 }, { tag: { who: 'rival', tag: 'respected_by' } }] },
      { id: 'cold', label: 'Take it, but keep the door open and the voice flat', risk: 'low', result: `You are polite, and you keep it short. {rival.first} nods like someone who expected it, and leaves the gift on the counter.`, effects: [{ rel: { who: 'rival', respect: 2 } }, { conf: 1 }] },
      { id: 'send_away', label: 'Send {rival.them} away: there is a story to protect', risk: 'med', result: `You close the door. A feud has to stay a feud, and you tell yourself that is why it hurt more than the injury.`, effects: [{ rivalry: { who: 'rival', heat: 6 } }, { rel: { who: 'rival', heat: 6, respect: -2 } }, { conf: 1 }, { pop: 0.2 }] },
      { id: 'angle', label: 'Spin the visit into a storyline for later', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `You and the creative team turn the visit into a bit of a vulnerable moment before the next big night. It plays beautifully, and {rival.first} never forgives you for it.`, effects: [{ pop: 0.8 }, { rel: { who: 'rival', trust: -9, respect: -4 } }, { rivalry: { who: 'rival', heat: 8 } }] },
        { weight: 1, text: `The story leaks before it airs and reads as cynical. {rival.first} takes it personally, and so does everyone who heard the full version.`, effects: [{ pop: -0.5 }, { conf: -3 }, { rel: { who: 'rival', trust: -10, heat: 10 } }] } ] },
    ],
  },
  {
    id: 'nc_riv_first_win_back', category: 'rivalry', title: 'The First Win Back from {rival.name}', weight: 4, cooldownDays: 80, maxPerCareer: 2, contexts: ['post_match'],
    trigger: { flag: 'nc_doubt', mem: [{ role: 'rival', h2h: { winsGte: 1, lossesGte: 3 }, last: { result: 'win', within: 1 } }] },
    cast: { rival: { pick: 'rivalry', minHeat: 10 } }, memory: { role: 'rival', max: 2, noResults: true },
    slots: { scene: [`the empty hallway behind the curtain`, `the locker-room doorway`, `the loading dock, with the lights off`, `the empty ring, with the house lights half up`], feeling: [`relief like cold water`, `a strange, shaky pride`, `anger you had been saving for months`, `nothing at all, for the first minute`] },
    body: [`The tally against {rival.name} finally has a win in it, and you reach {scene} before you let it hit you. What arrives is {feeling}, and then the old doubt, a little embarrassed to be found out.`, `{rival.first} is somewhere behind you, and you can feel the choice coming: how you treat the first win after a long losing run says more about you than the win does.`],
    choices: [
      { id: 'gracious', label: 'Find {rival.first} and thank {rival.them} for the hard matches', risk: 'low', result: `{rival.first} shakes your hand without bitterness. "About time," {rival.first} says. It is the cleanest end the losing streak could have asked for.`, effects: [{ clearFlag: 'nc_doubt' }, { rel: { who: 'rival', respect: 8, trust: 4, heat: -8 } }, { conf: 4 }, { pop: 0.2 }] },
      { id: 'celebrate', label: 'Celebrate hard with the crew', risk: 'low', result: `The locker room roars and someone finds a bottle. You get to be loud for once, and it feels like getting a lost year back.`, effects: [{ clearFlag: 'nc_doubt' }, { conf: 6 }, { pop: 0.3 }, { fatigue: 4 }, { rel: { who: 'rival', respect: -2, heat: 3 } }] },
      { id: 'quiet', label: 'Take a quiet minute alone and mean it', risk: 'low', result: `You sit down where you are and breathe. Nobody needs to know how close it was to the other outcome.`, effects: [{ clearFlag: 'nc_doubt' }, { conf: 3 }, { fatigue: -3 }] },
      { id: 'gloat', label: 'Make it a message: the debt is paid', risk: 'med', result: `You send word that the score is now a conversation and not a sentence. {rival.first} hears every syllable, and the fire is back.`, effects: [{ clearFlag: 'nc_doubt' }, { rivalry: { who: 'rival', heat: 10 } }, { rel: { who: 'rival', heat: 8, respect: -3 } }, { pop: 0.6 }, { conf: 3 }] },
    ],
  },
  // ===================================================================== BETRAYAL
  {
    id: 'nc_bet_cold_shoulder', category: 'betrayal', title: 'The Cold Shoulder from {former.name}', weight: 3, cooldownDays: 90, maxPerCareer: 2,
    trigger: { mem: [{ role: 'former', betrayal: true, trustLte: -40 }], noFlag: 'nc_note_sent' },
    cast: { former: { pick: 'tag', tag: 'betrayal' } }, memory: { role: 'former', max: 3 },
    slots: { sign: [`takes the stairs rather than share an elevator`, `asks the office for a different dressing room`, `leaves a room the moment you walk in`, `sets out exactly one chair at the table`], when: [`Again today`, `For the third day running`, `Right after the card`, `Before the doors even open`] },
    body: [`{when}, {former.name} {sign}, and nobody comments on it. The silence is perfectly polite, and that is what makes it unbearable.`, `Whoever struck first, the break is still the loudest thing in every room you share. What nobody tells you is how long a person can stay careful around the one who broke something.`],
    choices: [
      { id: 'accept', label: 'Take it quietly and give {former.them} the room', risk: 'low', result: `You eat standing up and keep out of the way. {former.first} registers the effort and gives you nothing for it, which is a kind of fairness.`, effects: [{ conf: -2 }, { rel: { who: 'former', respect: 3 } }, { fatigue: 1 }] },
      { id: 'confront', label: 'Corner {former.first} and demand to talk', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: `{former.first} lets you speak for two minutes and then speaks for ten. It is not forgiveness, but it is the first honest sentence in a month.`, effects: [{ rel: { who: 'former', trust: 5, heat: -6, respect: 3 } }, { conf: 1 }] },
        { weight: 2, text: `A stagehand sees the confrontation and tells half the building. {former.first} walks out and the story is now about you cornering someone who already said no.`, effects: [{ rel: { who: 'former', heat: 8, trust: -4 } }, { pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'note', label: 'Leave a handwritten note and then leave it alone', risk: 'low', result: `You write four honest lines and slide the note under the dressing-room door. Whether it is read is up to {former.first}, and you try to stop watching the door.`, effects: [{ flag: 'nc_note_sent' }, { rel: { who: 'former', trust: 2 } }, { conf: -1 }] },
      { id: 'blame', label: 'Tell the room {former.first} is being petty', risk: 'med', result: `A few people laugh, a few people stop laughing. The jab gets you a smile or two and a reputation for protecting yourself first.`, effects: [{ pop: 0.3 }, { rel: { who: 'former', heat: 10, respect: -4 } }, { conf: 2 }] },
    ],
  },
  {
    id: 'nc_bet_offer_warm', category: 'betrayal', title: 'The Price of {ally.name}', weight: 3, cooldownDays: 120, maxPerCareer: 2, major: true,
    trigger: { mem: [{ role: 'ally', trustGte: 30 }], stat: { popularity: { gte: 25 } } },
    cast: { ally: { pick: 'tag', tag: 'ally' }, gm: { pick: 'staff', role: 'gm' } }, memory: { role: 'ally', max: 2 },
    slots: { reward: [`a singles push with your name on the poster`, `a clean run of title shots`, `a hometown main event`, `a bonus that would clear a year of debt`], condition: [`drop your partner from the next three cards`, `refuse the tag match your partner has been planning`, `give the office an excuse to cut your partner's spot`, `say publicly that you have outgrown the partnership`] },
    body: [`"Five minutes," {gm.name} says, and does not bother with small talk. "The offer is {reward}. The condition is that you {condition}."`, `{ally.name} trusts you, truly, the way people only trust once. That is exactly why the office thinks you are the right person to ask.`],
    choices: [
      { id: 'refuse', label: 'Refuse and tell {ally.first} what was offered', risk: 'low', result: `{gm.first} says the offer will not come around again. You tell {ally.first} the same night, and the look on {ally.their} face is worth most of what you gave up.`, effects: [{ rel: { who: 'ally', trust: 10, respect: 8, affinity: 6 } }, { pop: -0.3 }, { conf: 2 }] },
      { id: 'sell', label: 'Take the deal and do what they ask', risk: 'high', result: `You sign, and the next week is smooth and quiet and wrong. {ally.first} works out what happened before anyone tells {ally.them}, and says nothing, which is the worst of it.`, effects: [{ event: { type: 'betrayal', participants: ['ally'], summary: `Sold out {ally.name} for a push.`, importance: 4, data: { context: 'tag_partner', byPlayer: true } } }, { pop: 0.8 }, { money: 12000 }, { conf: -3 }] },
      { id: 'warn', label: 'Take the deal and tip {ally.first} off first', risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `{ally.first} plays the part so well that {gm.name} never suspects. You get the push, and a partner who owes you a quiet kind of loyalty.`, effects: [{ rel: { who: 'ally', trust: 6, respect: 4 } }, { pop: 0.5 }, { money: 6000 }, { fatigue: 3 }] },
        { weight: 1, text: `The leak is traced to you inside a day. {ally.first} is spared, you are not, and the office has a new opinion of your word.`, effects: [{ rel: { who: 'ally', trust: 2, respect: 2 } }, { pop: -0.5 }, { conf: -3 }] } ] },
      { id: 'counter', label: 'Counter: the push only works if {ally.first} comes too', risk: 'med', outcomes: [
        { weight: 1, bonus: { mic: 0.5, charisma: 0.3 }, text: `{gm.first} laughs, then thinks, then agrees to half of it. You walk out with a smaller push for two.`, effects: [{ rel: { who: 'ally', trust: 7, respect: 6 } }, { pop: 0.3 }, { money: 2000 }] },
        { weight: 1, text: `{gm.first} hears the counter as a refusal and withdraws the offer. The push goes to someone who asked fewer questions.`, effects: [{ rel: { who: 'ally', trust: 4 } }, { pop: -0.3 }] } ] },
    ],
  },
  {
    id: 'nc_bet_offer_thin', category: 'betrayal', title: 'An Alliance Worn Thin', weight: 3, cooldownDays: 120, maxPerCareer: 2,
    trigger: { mem: [{ role: 'ally', trustLte: 10 }], stat: { popularity: { gte: 25 } } },
    cast: { ally: { pick: 'tag', tag: 'ally' }, gm: { pick: 'staff', role: 'gm' } }, memory: { role: 'ally', max: 2 },
    slots: { reward: [`a singles push of your own`, `a feud with a name you actually want`, `a clean break from the tag division`, `a bonus that is hard to turn down`], hint: [`has stopped returning your calls`, `keeps taking the late bus`, `told the agent you were hard to work with`, `has been seen having dinner with the office`] },
    body: [`{gm.name} puts it plainly: the office is willing to give you {reward} if you let the partnership with {ally.name} quietly end. You have to admit the thing is already half dead, since {ally.first} {hint}.`, `The loyalty you owe was never really signed for, and the loyalty owed to you is a question mark. Cutting loose feels less like betrayal and more like admitting what is already true.`],
    choices: [
      { id: 'end_clean', label: 'End it face to face, with honesty', risk: 'low', result: `You do it over coffee and keep it short. {ally.first} nods, wounded and relieved at once. "Fair," {ally.first} says. "I saw it coming." The partnership closes the way it should have, with a handshake.`, effects: [{ rel: { who: 'ally', respect: 4, trust: 3, heat: -4 } }, { pop: 0.3 }, { conf: 1 }] },
      { id: 'sell', label: 'Take the offer and end it without a word', risk: 'high', result: `The announcement is on the sheet before {ally.first} knows. The partnership is over, and so is whatever honest feeling was left in it.`, effects: [{ event: { type: 'betrayal', participants: ['ally'], summary: `Dropped {ally.name} without warning for a better offer.`, importance: 4, data: { context: 'tag_partner', byPlayer: true } } }, { pop: 0.7 }, { money: 8000 }, { conf: -2 }] },
      { id: 'repair', label: 'Turn the offer down and try to repair it', risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: `You find out why {ally.first} had gone cold. It is a fixable thing, and something between you starts to warm.`, effects: [{ rel: { who: 'ally', trust: 12, respect: 5, affinity: 5 } }, { pop: -0.2 }, { fatigue: 3 }] },
        { weight: 1, text: `The repair does not take. {ally.first} thanks you politely for the effort, and the offer you turned down is gone.`, effects: [{ rel: { who: 'ally', trust: 2 } }, { pop: -0.4 }, { conf: -2 }] } ] },
      { id: 'stall', label: 'Ask the office for a month to decide', risk: 'low', result: `{gm.first} agrees, a little curtly. You spend the month working the partnership as if nothing had changed, which is its own kind of lie.`, effects: [{ rel: { who: 'ally', trust: -2 } }, { conf: -1 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'nc_bet_rumour', category: 'betrayal', title: 'Somebody Says {ally.name} Talked', weight: 3, cooldownDays: 100, maxPerCareer: 2,
    trigger: { mem: [{ role: 'ally', trustGte: 5 }], noFlag: 'nc_ally_sold' },
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 2 },
    slots: { source: [`a camera operator`, `one of the ring crew`, `a talent relations intern`, `a veteran who likes to stir things`], claim: [`told the office you were the one who missed the bus`, `shared your private plan for the next promo`, `said you were hard to work with`, `given your finish idea to someone else`] },
    body: [`Between matches, {source} drops it in passing: {ally.name} has {claim}. There is no way to check it, and there is no way to forget it.`, `{ally.first} has been in your corner as long as you can remember, and this is exactly how people find out how much they believe in their friends.`],
    choices: [
      { id: 'ask', label: 'Ask {ally.first} straight, today', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `"Who told you that?" {ally.first} asks, so plainly wounded that you know the rumor is false before the answer comes. The air clears, and it costs you a favor or two to feel clean again.`, effects: [{ rel: { who: 'ally', trust: 6, respect: 3 } }, { conf: 2 }, { fatigue: 2 }] },
        { weight: 1, text: `{ally.first} looks at the floor for too long. The answer, when it comes, is a half-truth, and you both know the shape of the missing half.`, effects: [{ flag: 'nc_ally_sold' }, { tag: { who: 'ally', tag: 'betrayal' } }, { rel: { who: 'ally', trust: -20, heat: 12 } }, { conf: -3 }] } ] },
      { id: 'test', label: 'Feed {ally.first} a false detail and watch where it lands', risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.3 }, text: `The detail never surfaces anywhere. You feel clever for ten minutes, then ashamed for the rest of the night.`, effects: [{ rel: { who: 'ally', trust: -3 } }, { conf: 1 }] },
        { weight: 1, text: `The detail comes back to you through the booking office within the day. Proof, ugly and complete, and the end of an alliance.`, effects: [{ flag: 'nc_ally_sold' }, { tag: { who: 'ally', tag: 'betrayal' } }, { rel: { who: 'ally', trust: -25, heat: 14 } }, { rivalry: { who: 'ally', heat: 10 } }, { conf: -2 }] } ] },
      { id: 'silent', label: 'Say nothing and watch', risk: 'med', result: `You smile and keep working. The doubt sits in your chest like a stone, and every time {ally.first} laughs you wonder what the laugh is covering.`, effects: [{ conf: -3 }, { fatigue: 3 }, { rel: { who: 'ally', trust: -3 } }] },
      { id: 'office', label: 'Go to the office first and set your own version down', risk: 'low', result: `The producer nods and files it. You are covered, and {ally.first} will wonder why you did not ask.`, effects: [{ pop: 0.2 }, { rel: { who: 'ally', trust: -6, respect: -2 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'nc_bet_rumour_aftermath', category: 'betrayal', title: 'Facing {former.name}', weight: 5, cooldownDays: 45, maxPerCareer: 2, major: true,
    trigger: { flag: 'nc_ally_sold' },
    cast: { former: { pick: 'tag', tag: 'betrayal' } }, memory: { role: 'former', max: 2 },
    slots: { place: [`a quiet corner of the gym`, `the end of a long arena hallway`, `a parked bus with the engine off`, `the stage left of the gorilla position`], tone: [`flat`, `shaking`, `weirdly formal`, `exhausted`] },
    body: [`{former.name} was the one person you would have trusted with a key to your house, and now the two of you are alone in {place}. The words arrive {tone}, with all the weight of a thing that has been practiced in the mirror.`, `Everything that made the two of you a team is still in the room. It just does not point in the same direction anymore.`],
    choices: [
      { id: 'public', label: 'Let it out in front of the crew', risk: 'high', result: `The yelling is real and the room goes silent halfway through. By morning the building has taken sides, and neither of you is on the winning side.`, effects: [{ clearFlag: 'nc_ally_sold' }, { rivalry: { who: 'former', heat: 14 } }, { rel: { who: 'former', heat: 10, respect: -4 } }, { pop: 0.6 }, { fatigue: 5 }] },
      { id: 'cold', label: 'Stay calm and close the door on it', risk: 'low', result: `You say, "We are not doing business anymore." It is courteous and final, and you both hear how hollow it is.`, effects: [{ clearFlag: 'nc_ally_sold' }, { rel: { who: 'former', respect: 3, heat: 4 } }, { conf: 1 }] },
      { id: 'forgive', label: 'Hear {former.them} out and offer a way back', risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: `{former.first} breaks first, and the sorry comes out quick and ugly and believable. It is the start of something, not the end.`, effects: [{ clearFlag: 'nc_ally_sold' }, { event: { type: 'reconciliation', participants: ['former'], summary: `Mended the break with {former.name} after the leak.`, data: { formerRival: true } } }, { conf: 2 }, { pop: 0.2 }] },
        { weight: 1, text: `{former.first} listens, nods, and then takes the offer as a sign of weakness. The conversation ends worse than it began.`, effects: [{ clearFlag: 'nc_ally_sold' }, { rel: { who: 'former', respect: -4 } }, { conf: -3 }] } ] },
      { id: 'trap', label: 'Feed {former.them} one more false story and watch', risk: 'high', result: `You play the long game. It costs you weeks of acting normal around someone you used to trust, and the result is a proof you did not really want.`, effects: [{ clearFlag: 'nc_ally_sold' }, { rel: { who: 'former', trust: -8, heat: 6 } }, { fatigue: 5 }, { conf: 1 }] },
    ],
  },
  {
    id: 'nc_bet_revenge_reckoning', category: 'betrayal', title: 'The Reckoning with {victim.name}', weight: 4, cooldownDays: 45, maxPerCareer: 4, categoryCooldown: 3,
    trigger: { mem: [{ role: 'victim', betrayal: true }] },
    cast: { victim: { pick: 'obligation', kind: 'seek_revenge' } }, memory: { role: 'victim', max: 3 },
    slots: { where: [`in the hotel stairwell`, `at the barricade, an hour before doors`, `on the loading dock under one working light`, `in the empty ring under half-dimmed house lights`], carry: [`a folded copy of the booking sheet`, `nothing at all in {victim.their} hands`, `a coil of tape and a very steady stare`, `a small notebook of dates`] },
    body: [`{victim.name} is waiting {where} with {carry}. The betrayal is weeks old now, and the anger has cooled into something worse: patience.`, `{victim.first} could have chosen a hundred better places to do this, so the choice of this one means something. Whatever you say first will frame everything that follows.`],
    choices: [
      { id: 'stand', label: 'Stand there and take whatever comes', risk: 'med', result: `{victim.first} speaks for a long time. You do not interrupt, and at the end, neither of you feels better, but something has been put down.`, effects: [{ rel: { who: 'victim', respect: 5, heat: -6 } }, { conf: -2 }, { fatigue: 2 }] },
      { id: 'owe', label: 'Say you owe {victim.them}, and offer to settle in the ring', risk: 'med', result: `The offer lands better than any apology. The office hears about it by Monday, and a match gets built around a debt people can actually understand.`, effects: [{ booking: { who: 'victim', type: 'singles' } }, { rel: { who: 'victim', respect: 4, heat: -2 } }, { pop: 0.5 }, { fatigue: 4 }] },
      { id: 'justify', label: 'Explain why you did it, and stand by it', risk: 'high', result: `You lay out the reasons carefully. {victim.first} listens to all of them. "Thanks," {victim.first} says. "That makes this easy. There is nothing to forgive."`, effects: [{ rivalry: { who: 'victim', heat: 14 } }, { rel: { who: 'victim', heat: 12, respect: -3 } }, { pop: 0.4 }, { conf: 2 }] },
      { id: 'leave', label: 'Walk away and hope it burns out', risk: 'low', result: `You turn around and leave. The silence behind you is complete, and it is no cheaper than a fight would have been.`, effects: [{ rel: { who: 'victim', respect: -4, heat: 4 } }, { conf: -3 }] },
    ],
  },
  {
    id: 'nc_bet_witness', category: 'betrayal', title: '{witness.name} Saw It Happen', weight: 2, cooldownDays: 120, maxPerCareer: 2,
    trigger: { mem: [{ role: 'former', betrayal: true }] },
    cast: { former: { pick: 'tag', tag: 'betrayal' }, witness: { pick: 'roster', sameBrand: true, tier: { gte: 1 } } }, memory: { role: 'former', max: 2 },
    slots: { tone: [`with a look that misses nothing`, `in a whisper`, `with a laugh that does not reach the eyes`, `like it is a casual aside`], ask: [`a favor`, `a spot on your next match`, `a word with the office`, `a slice of the road money`] },
    body: [`{witness.name} stops you in the hallway and says, {tone}, "I was standing close enough to see what really happened between you and {former.name}." What {witness.first} wants is {ask}.`, `It is not quite blackmail and not quite friendship. In this business, knowing a secret is a kind of rent, and the landlord just showed up.`],
    choices: [
      { id: 'pay', label: 'Give {witness.first} what was asked and be done', risk: 'med', result: `The favor is small and the silence is complete. {witness.first} starts smiling at you in the hallway like an old friend, which is its own warning.`, effects: [{ money: -3000 }, { rel: { who: 'witness', trust: 3, respect: -2 } }, { conf: -1 }] },
      { id: 'call', label: 'Call the bluff: tell the story first', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, mic: 0.3 }, text: `You tell it straight in the catering room, with the ugly parts left in. The room goes quiet and then, bit by bit, goes back to eating.`, effects: [{ pop: 0.3 }, { conf: 3 }, { rel: { who: 'witness', respect: -3, heat: 5 } }, { rel: { who: 'former', respect: 3 } }] },
        { weight: 1, text: `Your version has a hole in it, and {witness.first} fills the hole with the truth. The room hears two accounts and picks the worse one.`, effects: [{ pop: -0.6 }, { conf: -4 }, { rel: { who: 'former', heat: 6 } }] } ] },
      { id: 'warn', label: 'Go to {former.first} before the story spreads', risk: 'low', result: `You find {former.first} and tell {former.them} everything. There is no forgiveness in the answer, but there is a stiff thank-you for not letting {former.them} learn the rest from a stranger.`, effects: [{ rel: { who: 'former', respect: 5, trust: 2, heat: -3 } }, { conf: -2 }, { fatigue: 2 }] },
      { id: 'threaten', label: 'Make it clear that you can talk too', risk: 'high', result: `You say a few things about {witness.first}'s own history. The conversation ends with an uneasy truce and a promise from both sides to never be seen at the same table.`, effects: [{ rel: { who: 'witness', fear: 6, heat: 8, trust: -6 } }, { conf: 2 }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'nc_bet_apology_reply', category: 'betrayal', title: 'The Reply to Your Note', weight: 5, cooldownDays: 60, maxPerCareer: 1,
    trigger: { flag: 'nc_note_sent', mem: [{ role: 'former', betrayal: true }] },
    cast: { former: { pick: 'tag', tag: 'betrayal' } }, memory: { role: 'former', max: 2 },
    slots: { medium: [`a folded note tucked into your gym bag`, `a message passed through the agent`, `a plain envelope at the front desk`, `a card left on your bench`], length: [`three lines`, `one sentence`, `half a page`, `six words`] },
    body: [`Days after you left the note, {medium} arrives from {former.name}. It is {length} long, and you read it standing in a hallway with people walking around you.`, `The tone is impossible to settle on, and you read it again. Whatever you do next will either start something or end it for good.`],
    choices: [
      { id: 'answer', label: 'Answer it honestly and ask to talk', risk: 'med', result: `You write back plainly and sign it with your name. It takes two days and a long walk to hit send, and the next time you pass in the hallway, {former.first} says hello.`, effects: [{ clearFlag: 'nc_note_sent' }, { rel: { who: 'former', trust: 6, heat: -8, respect: 3 } }, { tag: { who: 'former', tag: 'reconciled' } }, { conf: 2 }] },
      { id: 'hold', label: 'Keep it, and wait', risk: 'low', result: `You fold it into your wallet. There is time, and for now the note is proof that someone is still listening.`, effects: [{ clearFlag: 'nc_note_sent' }, { conf: 1 }, { rel: { who: 'former', trust: 1 } }] },
      { id: 'show', label: 'Show it around the locker room', risk: 'high', result: `A few people nod. Someone gets the wrong idea and the rumor mill turns it into a petty triumph, and {former.first} stops answering your messages altogether.`, effects: [{ clearFlag: 'nc_note_sent' }, { pop: 0.2 }, { rel: { who: 'former', trust: -10, heat: 8, respect: -5 } }, { conf: -2 }] },
      { id: 'angle', label: 'Pitch it as a storyline: the reluctant reunion', risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: `The office loves it. Some of the feeling is real, which is exactly why it plays, and {former.first} goes along without enthusiasm.`, effects: [{ clearFlag: 'nc_note_sent' }, { pop: 0.7 }, { rel: { who: 'former', respect: 2, trust: -2 } }] },
        { weight: 1, text: `Creative drops the pitch within a day. {former.first} hears it was suggested, and the quiet that follows is long.`, effects: [{ clearFlag: 'nc_note_sent' }, { rel: { who: 'former', trust: -6, heat: 6 } }, { conf: -2 }] } ] },
    ],
  },
  {
    id: 'nc_bet_reconciled_wobble', category: 'betrayal', title: 'Scar Tissue with {ex.name}', weight: 3, cooldownDays: 100, maxPerCareer: 2,
    trigger: { mem: [{ role: 'ex', tag: 'reconciled', trustLte: 20 }] },
    cast: { ex: { pick: 'tag', tag: 'reconciled' } }, memory: { role: 'ex', max: 2 },
    slots: { test: [`asks you to hold {ex.their} gear bag and walks off for twenty minutes`, `tells you something small and untrue to see whether it travels`, `leaves a finish unresolved until the very last second`, `asks who you were talking to on the phone`], setting: [`a long drive between shows`, `the quiet hour before doors`, `a late dinner after a hard card`, `a cold morning in the gym`] },
    body: [`Peace between you and {ex.name} has held so far, and still, during {setting}, {ex.first} {test}. It is not an accusation, and it is not nothing.`, `Reconciliation does not erase the past. It just means both of you agree to keep working while the past waits quietly in the corner.`],
    choices: [
      { id: 'patient', label: 'Pass the test and say nothing about it', risk: 'low', result: `You pass it without a flinch and let it go. {ex.first} exhales slowly, like someone putting a heavy thing down.`, effects: [{ rel: { who: 'ex', trust: 8, respect: 3 } }, { conf: 1 }, { fatigue: 1 }] },
      { id: 'name_it', label: 'Name it: ask if the old wound is still talking', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `"Yeah," {ex.first} admits with a half laugh, and the two of you spend an hour talking about what scares you both. It is more than either expected.`, effects: [{ rel: { who: 'ex', trust: 10, affinity: 5, respect: 4 } }, { conf: 2 }] },
        { weight: 1, text: `{ex.first} bristles at the question and says you are making it about yourself. The wobble gets wider before it gets narrower.`, effects: [{ rel: { who: 'ex', trust: -4, heat: 4 } }, { conf: -2 }] } ] },
      { id: 'resent', label: 'Snap: you cannot be tested forever', risk: 'high', result: `You say it too loud, and it is true, and it does not matter. {ex.first} nods and puts the distance back, brick by brick.`, effects: [{ rel: { who: 'ex', trust: -10, heat: 8, respect: -2 } }, { conf: 1 }, { pop: -0.1 }] },
      { id: 'prove', label: 'Make a point of proving you are reliable', risk: 'low', result: `For a month you show up early, cover small things, and never miss a call. It works slowly, and it wears you out.`, effects: [{ rel: { who: 'ex', trust: 9, respect: 4 } }, { fatigue: 6 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'nc_bet_turn_on_partner', category: 'betrayal', title: 'The Turn on {ally.name}', weight: 3, cooldownDays: 150, maxPerCareer: 1, major: true,
    trigger: { alignment: ['heel', 'tweener'], mem: [{ role: 'ally', trustGte: 15 }], eventWithin: { kind: 'ple', days: 30 } },
    cast: { ally: { pick: 'tag', tag: 'ally' }, creative: { pick: 'staff', role: 'creative' } }, memory: { role: 'ally', max: 2 },
    slots: { spot: [`at the end of a tag match on live television`, `in the aisle after a victory`, `in the middle of a promo {ally.they} thought was a tribute`, `in a locker room segment with the door left open`], hook: [`the biggest pop in months`, `a feud the office has wanted for a year`, `a rare spot on the poster`, `a chance to finally be the main player`] },
    body: [`{creative.name} pitches it with a straight face. "You turn on {ally.name} {spot}," {creative.first} says, "and you walk away with {hook}." The writers have the whole beat sheet ready, and {ally.first} has not been told.`, `It could be the best angle of your career. It could also be the thing that gets spoken about when your name comes up, for good.`],
    choices: [
      { id: 'do_it', label: 'Do it, for real, and make it count', risk: 'high', result: `The turn lands like a thrown brick. The building is on its feet, and across the ring {ally.first} looks up at you with a face that stays in the memory.`, effects: [{ event: { type: 'betrayal', participants: ['ally'], summary: `Turned on {ally.name} in a career-defining angle.`, importance: 5, data: { context: 'tag_partner', byPlayer: true } } }, { pop: 1.3 }, { money: 10000 }, { conf: 2 }] },
      { id: 'tell', label: 'Tell {ally.first} first and make it a work together', risk: 'med', result: `{ally.first} is silent for a long moment, then says only, "All right. But make it good." The two of you plan every beat, and the turn is just as loud, with no real damage underneath.`, effects: [{ rel: { who: 'ally', trust: 8, respect: 6 } }, { pop: 0.7 }, { fatigue: 5 }] },
      { id: 'refuse', label: 'Refuse the angle and tell creative why', risk: 'low', result: `{creative.first} sighs and shelves it. You keep a friend, and the writers will not forget that you said no.`, effects: [{ rel: { who: 'ally', trust: 5, respect: 3 } }, { pop: -0.4 }, { conf: 1 }] },
      { id: 'swerve', label: 'Pitch a swerve: everyone expects the turn and it never comes', risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.5, charisma: 0.4 }, text: `The pitch lands. When the crowd is braced for betrayal and gets a hand on the shoulder instead, the noise is bigger than any turn.`, effects: [{ rel: { who: 'ally', trust: 9, respect: 6 } }, { pop: 1.0 }, { conf: 3 }] },
        { weight: 1, text: `Creative cannot find the ending and the angle fizzles. A big night sails by without a memory.`, effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
    ],
  },
  {
    id: 'nc_bet_grace_note', category: 'betrayal', title: 'An Unearned Kindness from {former.name}', weight: 3, cooldownDays: 110, maxPerCareer: 2,
    trigger: { mem: [{ role: 'former', betrayal: true, respectGte: 10 }] },
    cast: { former: { pick: 'tag', tag: 'betrayal' } }, memory: { role: 'former', max: 2 },
    slots: { kindness: [`holds the door open at the loading bay`, `quietly passes you a bandage when your elbow is bleeding`, `tells the trainer you were hurt and covering it`, `lets you have the last seat on the bus`], witness: [`no one else notices`, `a ring crew member sees it and looks away`, `half the locker room sees it`, `the referee sees it and pretends not to`] },
    body: [`{former.name} {kindness}. {witness}, and {former.first} does not look back.`, `It does not erase the betrayal and was never meant to. It is a sign that being cruel and being human are, for most people, two different jobs.`],
    choices: [
      { id: 'thank', label: 'Thank {former.them} plainly and mean it', risk: 'low', result: `You say two words and look {former.first} in the eye while you do it. {former.first} nods, once, and moves on.`, effects: [{ rel: { who: 'former', respect: 3, trust: 3, heat: -4 } }, { conf: 1 }] },
      { id: 'repay', label: 'Repay it quietly, with a favor {former.first} will notice later', risk: 'med', result: `A week later a problem solves itself for {former.first}, and no one can find who did it. A debt shrinks a little.`, effects: [{ rel: { who: 'former', trust: 5, respect: 4 } }, { money: -1500 }, { fatigue: 2 }] },
      { id: 'refuse', label: 'Refuse it politely: it is too soon for gestures', risk: 'low', result: `You decline, politely. {former.first} shrugs and takes the kindness back, and it is not clear which of you was punished.`, effects: [{ rel: { who: 'former', respect: -2 } }, { conf: -2 }] },
      { id: 'lever', label: 'Take it as a crack in the wall and press', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `You ask for a conversation, and {former.first} gives you five minutes on a bench. It is not a rescue, but it is a start.`, effects: [{ rel: { who: 'former', trust: 5, heat: -6 } }, { tag: { who: 'former', tag: 'reconciled' } }, { conf: 1 }] },
        { weight: 2, text: `The press is too much, too soon. {former.first} closes the door that was just opened, and the next kindness will take a lot longer.`, effects: [{ rel: { who: 'former', trust: -6, heat: 6 } }, { conf: -2 }] } ] },
    ],
  },
  {
    id: 'nc_bet_credit_theft', category: 'betrayal', title: '{ally.name} Took the Credit', weight: 3, cooldownDays: 100, maxPerCareer: 2,
    trigger: { mem: [{ role: 'ally', respectGte: 15 }] },
    cast: { ally: { pick: 'tag', tag: 'ally' }, agent: { pick: 'staff', role: 'agent' } }, memory: { role: 'ally', max: 1 },
    slots: { idea: [`the finish you sketched on a napkin`, `the entrance bit you built over three weeks`, `the angle you pitched in the van`, `the storyline you wrote out for a whole month`], praise: [`the producer`, `the commentary team`, `the head of creative`, `half of catering`] },
    body: [`{agent.name} mentions in passing that {praise} loved {idea}, and that {ally.name} is getting the credit. You built every inch of it, and {ally.first} was in the room when you did.`, `Maybe it was an honest mistake, or the kind of lapse that happens to people when a stranger pats them on the back. Either way, the question is what kind of person you want to be about it.`],
    choices: [
      { id: 'face', label: 'Ask {ally.first} privately to set it straight', risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{ally.first} goes pale. "That was a slip," {ally.first} says, and fixes it with the office by lunch. The apology is real, and so is the relief on both sides.`, effects: [{ rel: { who: 'ally', trust: 3, respect: 4 } }, { pop: 0.3 }, { conf: 2 }] },
        { weight: 1, text: `{ally.first} brushes it off with a shrug and nothing changes. You come away with a clear look at where you stand.`, effects: [{ rel: { who: 'ally', trust: -6, respect: -2 } }, { conf: -2 }] } ] },
      { id: 'go_up', label: 'Take it straight to the agent with proof', risk: 'med', result: `{agent.first} looks at your notes, the dates, the messages. The credit moves, and so does your reputation as someone who keeps records.`, effects: [{ pop: 0.5 }, { conf: 2 }, { rel: { who: 'ally', trust: -12, heat: 8, respect: -3 } }] },
      { id: 'let_go', label: 'Let it go: it is just one idea', risk: 'low', result: `You decide the friendship is worth more than the credit. You also stop sharing ideas with {ally.first}, which turns out to be a quiet punishment all its own.`, effects: [{ rel: { who: 'ally', trust: -2 } }, { conf: -2 }, { fatigue: -1 }] },
      { id: 'steal_back', label: 'Quietly take one of {ally.their} ideas in return', risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.3 }, text: `Nobody notices, and nobody knows it was a trade. You tell yourself it is even, and it nearly is.`, effects: [{ pop: 0.4 }, { conf: 1 }, { rel: { who: 'ally', trust: -3 } }] },
        { weight: 1, text: `{ally.first} notices within the week. The accusation is mutual, and the alliance is a faint memory.`, effects: [{ rel: { who: 'ally', trust: -15, heat: 12 } }, { rivalry: { who: 'ally', heat: 8 } }, { pop: -0.3 }] } ] },
    ],
  },
  // ===================================================================== ALLIANCE
  {
    id: 'nc_all_favour_called', category: 'alliance', title: '{ally.name} Needs a Favor', weight: 3, cooldownDays: 80, maxPerCareer: 3,
    trigger: { mem: [{ role: 'ally', trustGte: 15 }], noFlag: 'nc_ally_owes' },
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 2 },
    slots: { favour: [`cover for a missed flight`, `take the worse spot on the card without complaining`, `drive through the night to a house show`, `vouch for {ally.them} in front of the agent`], urgency: [`by tonight`, `before the sheet goes up`, `before the next town`, `this week, quietly`] },
    body: [`{ally.name} finds you with a coffee in each hand and a look that has already apologized. The ask is simple: {favour}, {urgency}, and no questions asked.`, `There is a ledger between you, written in half-remembered kindnesses, and neither of you has ever read it out loud. Tonight someone might.`],
    choices: [
      { id: 'yes', label: 'Do it, all of it, and say nothing about the cost', risk: 'med', result: `It costs you a night's sleep and a spot you wanted. {ally.first} does not say thank you, which is how you know it landed.`, effects: [{ flag: 'nc_ally_owes' }, { rel: { who: 'ally', trust: 8, respect: 5, affinity: 5 } }, { fatigue: 7 }, { pop: -0.2 }] },
      { id: 'half', label: 'Do the part you can and be honest about the rest', risk: 'low', result: `You tell {ally.first} exactly what you can promise. It is less than hoped and more than most would give, and the tone between you is calm.`, effects: [{ rel: { who: 'ally', trust: 3, respect: 3 } }, { fatigue: 3 }, { conf: 1 }] },
      { id: 'price', label: 'Do it, but name a favor in return', risk: 'med', result: `{ally.first} blinks and then laughs. "Fair." The deal is signed with a handshake, and it is the first time either of you has put a price on the friendship.`, effects: [{ flag: 'nc_ally_owes' }, { rel: { who: 'ally', trust: -2, respect: 4 } }, { money: 2500 }, { fatigue: 4 }] },
      { id: 'no', label: 'Say no: this one is too expensive', risk: 'low', result: `You explain it as gently as you can. {ally.first} says it is fine and almost sounds like it, and the coffee goes cold.`, effects: [{ rel: { who: 'ally', trust: -6, respect: -2 } }, { conf: 1 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'nc_all_favour_repaid', category: 'alliance', title: '{ally.name} Settles Up', weight: 5, cooldownDays: 60, maxPerCareer: 2,
    trigger: { flag: 'nc_ally_owes', mem: [{ role: 'ally', trustGte: 20 }] },
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 2 },
    slots: { repay: [`a dinner that is clearly more than {ally.they} can afford`, `an early arrival with your gear already stacked`, `a quiet word with the agent on your behalf`, `a borrowed car with a full tank`], manner: [`pretending it is nothing`, `with a speech {ally.they} clearly rehearsed`, `by leaving it on your bench`, `holding it out like a truce`] },
    body: [`{ally.name} has not forgotten what you did for {ally.them}. It arrives as {repay}, offered {manner}.`, `Accepting means admitting you were keeping score after all. Refusing means telling a friend that {ally.their} thanks does not count.`],
    choices: [
      { id: 'accept', label: 'Accept it with a grin and say it was nothing', risk: 'low', result: `You take it, and you both pretend the scales are level. Neither of you believes it, and that is part of why it works.`, effects: [{ clearFlag: 'nc_ally_owes' }, { rel: { who: 'ally', trust: 5, affinity: 5 } }, { fatigue: -2 }, { conf: 1 }] },
      { id: 'wave', label: 'Wave it away: friends do not keep tabs', risk: 'low', result: `{ally.first} looks relieved and a little lost. The favor goes unrepaid, and the friendship goes a little deeper.`, effects: [{ clearFlag: 'nc_ally_owes' }, { rel: { who: 'ally', trust: 7, respect: 6, affinity: 6 } }, { conf: 1 }] },
      { id: 'bank', label: 'Hold it back and call it in later', risk: 'med', result: `You tell {ally.first} to keep it for when you need it. The debt stays on the books, and a few weeks later the book gets uncomfortable to look at.`, effects: [{ rel: { who: 'ally', trust: -2, respect: 2 } }, { pop: 0.1 }] },
      { id: 'big_ask', label: 'Ask for something bigger than {ally.they} offered', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `{ally.first} thinks it over and says yes. You walk out with a real advantage and a friend who now knows exactly what you are worth to {ally.them}.`, effects: [{ clearFlag: 'nc_ally_owes' }, { pop: 0.6 }, { money: 4000 }, { rel: { who: 'ally', trust: -3 } }] },
        { weight: 1, text: `{ally.first} goes quiet. The favor stays repaid on paper, but the warmth that came with it is gone for good.`, effects: [{ clearFlag: 'nc_ally_owes' }, { rel: { who: 'ally', trust: -8, respect: -3 } }, { conf: -2 }] } ] },
    ],
  },
  {
    id: 'nc_all_bedside', category: 'alliance', title: '{ally.name} Shows Up', weight: 3, cooldownDays: 100, maxPerCareer: 2,
    trigger: { injured: true, mem: [{ role: 'ally', respectGte: 10 }] },
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 2 },
    slots: { arrival: [`with takeout and no warning`, `with two folding chairs and a deck of cards`, `with a duffel bag, apparently planning to stay`, `with your mail from the locker room`], hours: [`through the long afternoon`, `until the building went dark`, `until the nurse made {ally.them} leave`, `for most of a Sunday`] },
    body: [`The injury has made the days long and the world small, so the knock on the door is a gift before it is anything else. {ally.name} shows up {arrival} and stays {hours}.`, `Neither of you mentions the cards, the chairs, or why the room feels less lonely than it did. It is the kind of friendship that does not need a plot.`],
    choices: [
      { id: 'open_up', label: 'Admit how scared you are about the layoff', risk: 'low', result: `The words come out in a heap, and {ally.first} just listens, and then tells you three stories about {ally.their} own worst injuries. You sleep well that night.`, effects: [{ rel: { who: 'ally', trust: 8, affinity: 6, respect: 3 } }, { conf: 2 }, { fatigue: -4 }] },
      { id: 'banter', label: 'Keep it light: gossip and bad jokes only', risk: 'low', result: `You laugh until your ribs complain. The fear stays in the closet, and the afternoon is much shorter than the one before.`, effects: [{ rel: { who: 'ally', affinity: 5, trust: 2 } }, { fatigue: -3 }, { conf: 1 }] },
      { id: 'use_them', label: 'Ask {ally.them} to feed you every rumor from the road', risk: 'med', result: `{ally.first} obliges, and you spend a week better informed than the office. It is useful, and it is a little like turning a friend into a wire service.`, effects: [{ pop: 0.2 }, { rel: { who: 'ally', trust: -2, affinity: -1 } }, { conf: 2 }] },
      { id: 'send_home', label: 'Send {ally.them} home: you do not want to be seen like this', risk: 'low', result: `You say you are fine, which is an obvious lie. {ally.first} accepts it, leaves the takeout on the counter, and says nothing about the lie.`, effects: [{ rel: { who: 'ally', trust: -3, affinity: -2 } }, { conf: -3 }, { fatigue: 1 }] },
    ],
  },
  {
    id: 'nc_all_handshake_deal', category: 'alliance', title: 'The Handshake with {ally.name}', weight: 3, cooldownDays: 90, maxPerCareer: 3,
    trigger: { mem: [{ role: 'ally', respectGte: 20 }], noFlag: 'allied_recently' },
    cast: { ally: { pick: 'tag', tag: 'alliance_possible' } }, memory: { role: 'ally', max: 2 },
    slots: { terms: [`split the merch money down the middle`, `share a dressing room and a mini-fridge`, `agree on finishes before the agent hears them`, `use a code word whenever one of you needs rescuing`], setting: [`the loading bay at midnight`, `a diner booth near the arena`, `the empty ring before doors`, `a shuttle bus stuck in traffic`] },
    body: [`{ally.name} is not asking for a contract. In {setting}, the offer is simple: {terms}, and see where it goes.`, `The respect between you has been building for a while without a name. This is the first time either of you has said it as a proposal.`],
    choices: [
      { id: 'shake', label: 'Shake on it and mean every word', risk: 'low', result: `The handshake is longer than it needs to be. By the next card the two of you are in the same corner, and the locker room starts calling you a pair.`, effects: [{ event: { type: 'alliance_formed', participants: ['ally'], summary: `Sealed a handshake alliance with {ally.name}.`, importance: 3, data: {} } }, { flag: 'allied_recently' }, { pop: 0.3 }] },
      { id: 'edges', label: 'Agree, but keep your own lane', risk: 'med', result: `You agree on the terms you like and quietly set aside the rest. It works well enough, and {ally.first} notices the gaps and keeps notes.`, effects: [{ event: { type: 'alliance_formed', participants: ['ally'], summary: `Formed a careful, limited alliance with {ally.name}.`, importance: 3, data: {} } }, { flag: 'allied_recently' }, { rel: { who: 'ally', trust: -3, respect: 2 } }] },
      { id: 'ask_more', label: 'Ask for a bigger stake than {ally.they} offered', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `{ally.first} grins and bumps the offer up. The deal is better than the first, and the next card shows it.`, effects: [{ event: { type: 'alliance_formed', participants: ['ally'], summary: `Negotiated a stronger alliance with {ally.name}.`, importance: 3, data: {} } }, { flag: 'allied_recently' }, { money: 3000 }, { pop: 0.3 }] },
        { weight: 1, text: `{ally.first} withdraws the offer with a thin smile. The respect remains, but the door has closed a few inches.`, effects: [{ rel: { who: 'ally', trust: -4, respect: -2 } }, { conf: -2 }] } ] },
      { id: 'later', label: 'Say not yet and keep the door open', risk: 'low', result: `You tell {ally.first} you want to see more first. {ally.first} nods, and the friendly distance between you stays exactly where it was.`, effects: [{ rel: { who: 'ally', respect: 1 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'nc_all_vouch', category: 'alliance', title: '{friend.name} Asks You to Vouch', weight: 2, cooldownDays: 110, maxPerCareer: 2,
    trigger: { mem: [{ role: 'friend', respectGte: 15 }], stat: { popularity: { gte: 25 } } },
    cast: { friend: { pick: 'tag', tag: 'respected_by' }, agent: { pick: 'staff', role: 'agent' } }, memory: { role: 'friend', max: 1 },
    slots: { want: [`a real feud`, `a regular spot on the main show`, `a title match`, `a pay review`], risk: [`a reputation for temper`, `a poor week of ticket sales`, `a recent injury`, `a loud argument with a booker`] },
    body: [`{friend.name} has always shown you the respect you earned, and today {friend.first} asks you to repay it. "I would never ask," {friend.first} says, "but tell {agent.name} I deserve {want}, despite {risk}."`, `Your word has weight now, which means every word you spend on someone else is a word you do not spend on yourself.`],
    choices: [
      { id: 'vouch', label: 'Vouch for {friend.them} without reservation', risk: 'med', outcomes: [
        { weight: 2, bonus: { popularity: 0.4 }, text: `{agent.first} listens, nods, and writes something down. It works, and {friend.first} sends a note with six words and no punctuation.`, effects: [{ rel: { who: 'friend', trust: 8, respect: 5, affinity: 5 } }, { pop: 0.2 }] },
        { weight: 1, text: `The bet goes wrong, and {agent.first} thanks you for the opinion and files it under things to remember next time.`, effects: [{ rel: { who: 'friend', trust: 4 } }, { pop: -0.4 }, { conf: -2 }] } ] },
      { id: 'honest', label: 'Give an honest, balanced account', risk: 'low', result: `You say what is good and what is not. It is fairer than flattery, and {friend.first} hears about it and takes the point.`, effects: [{ rel: { who: 'friend', respect: 4, trust: 2 } }, { conf: 1 }] },
      { id: 'trade', label: 'Vouch if {friend.first} backs one of your own pitches', risk: 'med', result: `{friend.first} agrees, a little stiffly. It is a fair swap that leaves a faint taste of business in a friendly room.`, effects: [{ rel: { who: 'friend', trust: -2, respect: 2 } }, { pop: 0.3 }, { money: 1500 }] },
      { id: 'decline', label: 'Decline: your name is not for lending', risk: 'low', result: `You explain, clumsily, that you cannot afford to be wrong. {friend.first} says it is fine, which stings more than an argument.`, effects: [{ rel: { who: 'friend', respect: -3, trust: -3 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'nc_all_slump_company', category: 'alliance', title: 'A Seat Beside You, {ally.name}', weight: 3, cooldownDays: 90, maxPerCareer: 2,
    trigger: { stat: { loseStreak: { gte: 3 } }, mem: [{ role: 'ally', trustGte: 10 }] },
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 2 },
    slots: { nook: [`a corner of the arena kitchen`, `the equipment room`, `the roof of the parking garage`, `the very back row of the empty stands`], offering: [`two cans of cold soda and a shrug`, `a bruised apple and an old story`, `a spare pair of knee pads and a bad pun`, `nothing but a seat and a lot of silence`] },
    body: [`After the third loss, you disappear into {nook} to be alone with it, and {ally.name} finds you anyway. The offering is {offering}, and {ally.first} sits down without asking.`, `The losses have a way of echoing in an empty room. It turns out a second person is enough to dampen the sound a little.`],
    choices: [
      { id: 'talk', label: 'Say it out loud: you are afraid it is over', risk: 'low', result: `The sentence comes out wrong and ends in a laugh. {ally.first} tells you a story that makes the problem look smaller, and you leave with a plan for Monday.`, effects: [{ rel: { who: 'ally', trust: 7, affinity: 6 } }, { conf: 5 }, { fatigue: -2 }] },
      { id: 'train', label: 'Ask {ally.first} to train with you at dawn', risk: 'med', result: `The two of you spend a week in an empty gym before sunrise. It is grueling, and the work shows up in your timing before it shows up in the results.`, effects: [{ attr: { name: 'endurance', delta: 1 } }, { rel: { who: 'ally', trust: 4, respect: 4 } }, { fatigue: 8 }, { conf: 2 }] },
      { id: 'alone', label: 'Say you would rather be alone', risk: 'low', result: `{ally.first} gets up without complaint. "I will be around," {ally.first} says, and leaves the offering behind. The quiet is easier for ten minutes, and heavier afterwards.`, effects: [{ rel: { who: 'ally', trust: -3, affinity: -2 } }, { conf: -2 }] },
      { id: 'joke', label: 'Joke your way out of it', risk: 'low', result: `You make three jokes in a row and {ally.first} laughs at two of them. It is easier to be funny than to be honest, and you both know which one you chose.`, effects: [{ rel: { who: 'ally', affinity: 2 } }, { conf: 1 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'nc_all_shadow', category: 'alliance', title: 'Standing in Your Shadow', weight: 3, cooldownDays: 120, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 55 } }, mem: [{ role: 'ally', respectGte: 10 }] },
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 2 },
    slots: { sign: [`the crowd cheers for you before {ally.first} says a word`, `the merch table has stopped stocking {ally.their} shirts`, `the announcer introduces {ally.them} as an afterthought`, `the producers keep calling {ally.them} your friend`], reaction: [`a tight smile`, `an overly careful joke`, `a long look at the floor`, `a sudden need to check {ally.their} phone`] },
    body: [`Your rise has changed the room, and {ally.name} is the one who feels it most. Lately {sign}, and {ally.first} meets it with {reaction}.`, `{ally.first} has never said a word against you, and probably never will. That silence has become its own kind of weight.`],
    choices: [
      { id: 'share', label: 'Share the spotlight: give {ally.them} a showcase spot', risk: 'med', result: `You ask the producer to put {ally.them} in a featured slot, and you do not take the credit. The crowd gives {ally.them} a better pop than you expected, and your own pop shrinks by a hair.`, effects: [{ rel: { who: 'ally', trust: 8, respect: 7, affinity: 6 } }, { pop: -0.3 }, { fatigue: 2 }] },
      { id: 'name_it', label: 'Name the problem over a long dinner', risk: 'low', result: `It is awkward and honest. {ally.first} admits what you already knew. "I am happy for you," {ally.first} says. "I am also tired of being the afterthought." You agree to keep talking about it every month.`, effects: [{ rel: { who: 'ally', trust: 6, affinity: 4 } }, { conf: 1 }, { fatigue: 2 }] },
      { id: 'bask', label: 'Say nothing and enjoy the climb', risk: 'low', result: `You let the silence stand. The pops keep coming, and a little of the old warmth quietly goes out of the friendship.`, effects: [{ pop: 0.4 }, { rel: { who: 'ally', trust: -5, affinity: -4 } }, { conf: 2 }] },
      { id: 'promote', label: 'Push the office to feature the pair of you', risk: 'high', outcomes: [
        { weight: 1, bonus: { popularity: 0.4 }, text: `The pitch lands, and the pair of you get a real story together. It lifts {ally.them} and does you no harm.`, effects: [{ rel: { who: 'ally', trust: 6, respect: 4 } }, { pop: 0.5 }, { fatigue: 4 }] },
        { weight: 1, text: `The office hears it as a favor and turns it down. {ally.first} hears you tried, and that is nearly as good.`, effects: [{ rel: { who: 'ally', trust: 3, respect: 2 } }, { conf: -1 }] } ] },
    ],
  },
  {
    id: 'nc_all_same_spot', category: 'alliance', title: 'One Spot, Two Friends', weight: 3, cooldownDays: 80, maxPerCareer: 3,
    trigger: { stat: { popularity: { gte: 20 } }, mem: [{ role: 'ally', trustGte: 10 }] },
    cast: { ally: { pick: 'tag', tag: 'ally' }, agent: { pick: 'staff', role: 'agent' } }, memory: { role: 'ally', max: 2 },
    slots: { prize: [`the last main-card slot`, `a TV match with a real opponent`, `a spot in the cage match`, `the one open slot on the road trip`], reason: [`a cut in the running time`, `a sponsor push`, `a late injury`, `a producer's hunch`] },
    body: [`Because of {reason}, {agent.name} can only fit one of you on {prize}. {ally.name} has not asked for it, and has not asked you to step aside either, which is somehow harder.`, `Friends in this business know the rules: the spot is more important than the friendship, at least until it isn't.`],
    choices: [
      { id: 'give', label: 'Give it to {ally.first} and say it was your choice', risk: 'low', result: `{agent.first} makes the change without comment. {ally.first} finds out from the sheet and is quiet for a full minute before saying, "You did not have to."`, effects: [{ rel: { who: 'ally', trust: 9, respect: 7, affinity: 5 } }, { pop: -0.4 }, { conf: -1 }] },
      { id: 'take', label: 'Take it, and tell {ally.them} straight why', risk: 'med', result: `You tell {ally.first} face to face before the sheet goes up. It is not pleasant, and {ally.first} nods and says the right thing, with a thin edge.`, effects: [{ rel: { who: 'ally', trust: -3, respect: 2 } }, { pop: 0.5 }, { conf: 2 }] },
      { id: 'flip', label: 'Flip a coin in front of the agent', risk: 'med', outcomes: [
        { weight: 1, text: `The coin lands in your favor, and the two of you laugh about it for a week. Neither of you says out loud how nervous you were.`, effects: [{ rel: { who: 'ally', trust: 3, affinity: 3 } }, { pop: 0.4 }, { conf: 1 }] },
        { weight: 1, text: `The coin lands the other way. You shake hands, mean it, and make plans to buy the winner a drink.`, effects: [{ rel: { who: 'ally', trust: 5, affinity: 4 } }, { pop: -0.2 }] } ] },
      { id: 'share', label: 'Ask the agent to build a way to use both of you', risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.4, charisma: 0.3 }, text: `{agent.first} finds twelve extra minutes and a spot for a tag. You are both on the card, and the crowd treats the pairing like a secret finally told.`, effects: [{ rel: { who: 'ally', trust: 6, respect: 5 } }, { pop: 0.5 }, { fatigue: 4 }] },
        { weight: 1, text: `{agent.first} says the card is full. The argument costs you the spot and some goodwill, and the friendship survives it.`, effects: [{ rel: { who: 'ally', trust: 2 } }, { pop: -0.4 }, { conf: -1 }] } ] },
    ],
  },
  {
    id: 'nc_all_uneasy_pair', category: 'alliance', title: 'Booked Alongside {ex.name}', weight: 3, cooldownDays: 100, maxPerCareer: 2,
    trigger: { mem: [{ role: 'ex', tag: 'reconciled' }], noFlag: 'allied_recently' },
    cast: { ex: { pick: 'tag', tag: 'reconciled' }, agent: { pick: 'staff', role: 'agent' } }, memory: { role: 'ex', max: 2 },
    slots: { plan: [`a one-night tag match`, `a month-long partnership`, `a tournament entry`, `a segment where the two of you must hug in the ring`], mood: [`pleased`, `grim`, `suspiciously upbeat`, `hard to read`] },
    body: [`{agent.name} has booked the two of you together for {plan}, and {ex.name} greets you with a smile that is {mood}. Behind the smile is the old trouble, put away but not thrown out.`, `A forced pairing can end in friendship or in a very public disaster. Which one it is will be up to the first minute you spend alone.`],
    choices: [
      { id: 'embrace', label: 'Embrace it: be the best partner you can', risk: 'low', result: `You show up early, share the spotlight, and stop keeping score. By the end, the crowd cannot see the seam, and {ex.first} is laughing for real. "You meant it," {ex.first} says, sounding surprised.`, effects: [{ event: { type: 'alliance_formed', participants: ['ex'], summary: `Became real partners with {ex.name} after the reconciliation.`, importance: 3, data: {} } }, { flag: 'allied_recently' }, { pop: 0.4 }, { fatigue: 4 }] },
      { id: 'terms', label: 'Set a few clear ground rules first', risk: 'low', result: `The rules are sensible and the talk is stiff. The match works, and the partnership stays strictly professional.`, effects: [{ rel: { who: 'ex', trust: 3, respect: 3 } }, { pop: 0.2 }, { conf: 1 }] },
      { id: 'protest', label: 'Protest to the agent and ask for someone else', risk: 'med', result: `{agent.first} looks at you for a long time and then re-books. You avoid the problem and prove {ex.first} was right to worry.`, effects: [{ rel: { who: 'ex', trust: -8, respect: -3 } }, { conf: -1 }, { fatigue: -2 }] },
      { id: 'outshine', label: 'Quietly plan to outshine {ex.them}', risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.4, charisma: 0.3 }, text: `You steal the finish and the pop. The crowd loves it, and {ex.first} finds out what the plan was from the replay.`, effects: [{ pop: 0.9 }, { rel: { who: 'ex', trust: -10, heat: 8 } }, { conf: 2 }] },
        { weight: 1, text: `The plan collapses on a missed cue and you look selfish in front of everyone. {ex.first} covers for you and neither of you mentions it.`, effects: [{ pop: -0.4 }, { rel: { who: 'ex', trust: 2, respect: 2 } }, { conf: -3 }] } ] },
    ],
  },
  {
    id: 'nc_all_gear_gift', category: 'alliance', title: 'A Gift from {ally.name}', weight: 2, cooldownDays: 200, maxPerCareer: 2,
    trigger: { month: [11, 12, 1], mem: [{ role: 'ally', trustGte: 20 }] },
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1 },
    slots: { gift: [`a pair of boots worn in just the way you like`, `a roll of good tape topped with a bow`, `a jacket someone else had been saving`, `a framed photo of the two of you from a bad house show`], wrap: [`brown paper and an apologetic note`, `a gift bag from the arena shop`, `a plain paper bag`, `a cardboard box addressed to the wrong name`] },
    body: [`{ally.name} slides {gift} across the table in {wrap}. It could not have cost much, it is thoughtful, and it says something about how much attention has been paid.`, `You did not buy anything for {ally.them}. The room waits to see what kind of friend you are going to be.`],
    choices: [
      { id: 'gracious', label: 'Accept it warmly and promise to make it up', risk: 'low', result: `You say thank you properly, and mean the promise. The next week you find something that fits {ally.them} exactly.`, effects: [{ rel: { who: 'ally', trust: 4, affinity: 6 } }, { money: -800 }, { conf: 1 }] },
      { id: 'tears', label: 'Get a little emotional about it', risk: 'low', result: `You are surprised by how much it gets to you. {ally.first} pretends not to notice and passes you a napkin.`, effects: [{ rel: { who: 'ally', affinity: 7, trust: 3 } }, { conf: 2 }] },
      { id: 'gag', label: 'Make a joke about how cheap it is', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `"You should have seen the receipt," {ally.first} says, laughing so hard it turns into a snort, and the joke becomes the thing the two of you say to each other for months.`, effects: [{ rel: { who: 'ally', affinity: 5 } }, { pop: 0.1 }] },
        { weight: 1, text: `The joke lands badly. {ally.first} takes it with a stiff smile, and the gift stays on the bench.`, effects: [{ rel: { who: 'ally', trust: -4, affinity: -3 } }, { conf: -1 }] } ] },
      { id: 'pass_on', label: 'Pass it on to someone who needs it more', risk: 'high', result: `You hand it to a trainee who has nothing. {ally.first} sees, and it is not clear whether {ally.first} is moved or insulted.`, effects: [{ rel: { who: 'ally', trust: -5, affinity: -3 } }, { pop: 0.3 }, { conf: 1 }] },
    ],
  },
  {
    id: 'nc_all_hidden_injury', category: 'alliance', title: '{ally.name} Is Hiding Something', weight: 3, cooldownDays: 90, maxPerCareer: 3,
    trigger: { mem: [{ role: 'ally', trustGte: 20 }] },
    cast: { ally: { pick: 'tag', tag: 'ally' }, trainer: { pick: 'staff', role: 'trainer' } }, memory: { role: 'ally', max: 2 },
    slots: { part: [`rib`, `knee`, `shoulder`, `neck`], disguise: [`taping the whole area under {ally.their} gear`, `taking painkillers with the water`, `walking carefully around the locker room`, `wearing a sleeve in a warm building`] },
    body: [`Only someone who has spent years watching {ally.name} work would see it: the {part}, and the way {ally.first} keeps {disguise}. {ally.first} has plainly decided to work through it, and has told nobody.`, `The match tonight is rough, and so is {trainer.name}, who would send {ally.them} home in a second. You are the only other person who knows.`],
    choices: [
      { id: 'tell_trainer', label: 'Tell the trainer and take the heat', risk: 'med', result: `{trainer.first} pulls {ally.first} aside before the bell. {ally.first} is furious for a day, then thanks you for it, and the {part} heals in time.`, effects: [{ rel: { who: 'ally', trust: -4, respect: 4, affinity: 2 } }, { conf: 1 }, { fatigue: 1 }] },
      { id: 'cover', label: 'Keep the secret and adapt your offense all night', risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `You carry the match so quietly that no one notices the extra weight. {ally.first} knows, and the gratitude shows in a hand on your shoulder afterwards.`, effects: [{ rel: { who: 'ally', trust: 10, respect: 6, affinity: 5 } }, { fatigue: 8 }, { pop: 0.2 }] },
        { weight: 1, text: `The cover does not hold. {ally.first} tweaks the injury in the third minute and the match ends early, with you holding the blame.`, effects: [{ rel: { who: 'ally', trust: 3 } }, { pop: -0.5 }, { conf: -3 }, { fatigue: 5 }] } ] },
      { id: 'talk', label: 'Talk to {ally.them} privately and let {ally.them} choose', risk: 'low', result: `You say what you saw and ask what {ally.first} needs. "One night," {ally.first} says at last. "Tell nobody." The secret stays between the two of you.`, effects: [{ rel: { who: 'ally', trust: 7, respect: 3, affinity: 3 } }, { fatigue: 2 }] },
      { id: 'step_in', label: 'Offer to take the match in {ally.their} place', risk: 'med', result: `The office is surprised and pleased. {ally.first} accepts and owes you in a way no one else will quite understand.`, effects: [{ rel: { who: 'ally', trust: 6, respect: 6, affinity: 4 } }, { fatigue: 8 }, { pop: 0.3 }] },
    ],
  },
  {
    id: 'nc_all_dead_alliance', category: 'alliance', title: 'Is the Partnership with {ally.name} Over?', weight: 3, cooldownDays: 120, maxPerCareer: 2,
    trigger: { mem: [{ role: 'ally', trustLte: 0 }], noFlag: 'nc_partnership_fate' },
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 2 },
    slots: { sign: [`you eat at separate tables now`, `you only speak about the match`, `you answer each other in one word`, `each of you waits for the other to leave the room`], place: [`a long plane ride`, `a long night in the green room`, `a red light in a rental car`, `a slow set in the weight room`] },
    body: [`Somewhere along the road the partnership with {ally.name} turned into a habit that nobody enjoys. These days {sign}, and everyone around you has started to notice.`, `In the middle of {place}, it finally becomes impossible not to talk about it. One of you has to say whether this is a rough patch or the end.`],
    choices: [
      { id: 'end', label: 'End it, kindly and in person', risk: 'med', result: `You say the true thing out loud, and it is a relief and a loss in the same breath. {ally.first} agrees, and the two of you part on civil terms.`, effects: [{ flag: 'nc_partnership_fate' }, { rel: { who: 'ally', respect: 4, trust: 2, heat: -3 } }, { conf: -1 }, { fatigue: -2 }] },
      { id: 'repair', label: 'Fight for it: ask what went wrong', risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: `"Say all of it," {ally.first} says, and the first hour is raw and the second is better. By the end you have both agreed to give it another real try.`, effects: [{ flag: 'nc_partnership_fate' }, { rel: { who: 'ally', trust: 12, affinity: 6, respect: 4 } }, { fatigue: 3 }] },
        { weight: 1, text: `The conversation turns into a list of old grievances. Nothing is settled, and everything is louder.`, effects: [{ rel: { who: 'ally', trust: -4, heat: 6 } }, { conf: -2 }, { fatigue: 3 }] } ] },
      { id: 'fake', label: 'Keep the act alive for the cameras', risk: 'low', result: `You smile together on screen and say nothing off it. The crowd is happy, and the private silence keeps growing.`, effects: [{ pop: 0.3 }, { rel: { who: 'ally', trust: -3 } }, { conf: -1 }, { fatigue: 2 }] },
      { id: 'turn', label: 'Turn it into a feud and cash in', risk: 'high', result: `You pitch the split as a story. The office loves it, and {ally.first} follows your lead with eyes that are not entirely acting.`, effects: [{ flag: 'nc_partnership_fate' }, { rivalry: { who: 'ally', heat: 15 } }, { rel: { who: 'ally', heat: 10, trust: -6 } }, { pop: 0.8 }] },
    ],
  },
  // ===================================================================== FACTION
  {
    id: 'nc_fac_stable_meal', category: 'faction', title: 'Family Dinner with the Stable', weight: 2, cooldownDays: 120, maxPerCareer: 2,
    trigger: { flag: 'in_stable', mem: [{ role: 'mate', trustGte: 15 }] },
    cast: { mate: { pick: 'tag', tag: 'ally' } }, memory: { role: 'mate', max: 1 },
    slots: { custom: [`everyone puts their keys in the middle of the table`, `the newest member pays for everything`, `nobody speaks about the match until dessert`, `the leader carves, and nobody questions the cuts`], dish: [`a table of takeout cartons`, `a banquet room booked in the stable's name`, `a barbecue behind the arena`, `a quiet pasta joint where the owner knows everyone`] },
    body: [`The stable meets for its monthly dinner at {dish}, and tonight the rule is that {custom}. {mate.name} sits two seats down, saving you a chair without having to be asked.`, `It is the one night a month when the group feels like a family, which makes it the only night you cannot afford to sound like an outsider.`],
    choices: [
      { id: 'toast', label: 'Stand up and give a heartfelt toast', risk: 'low', result: `The toast is sincere, a little long, and gets two actual cheers. {mate.first} slaps the table. "Sit down before you cry," {mate.first} says, and for an hour you belong completely.`, effects: [{ rel: { who: 'mate', trust: 5, affinity: 5 } }, { conf: 2 }, { pop: 0.1 }] },
      { id: 'tradition', label: 'Follow the custom exactly and keep your head down', risk: 'low', result: `You obey every rule and get through the evening without a ripple. It is safe, and it leaves the group exactly where it was.`, effects: [{ rel: { who: 'mate', trust: 2 } }, { fatigue: -2 }] },
      { id: 'raise', label: 'Raise a real problem the stable keeps dodging', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.4, mic: 0.3 }, text: `You say it straight and the table goes quiet, and then someone nods. The stable is stronger for it, and you have become someone they listen to.`, effects: [{ rel: { who: 'mate', trust: 7, respect: 6 } }, { conf: 3 }, { pop: 0.2 }] },
        { weight: 1, text: `The table hears an attack where you meant a question. The night ends early, and {mate.first} is the only one who walks you to the car.`, effects: [{ rel: { who: 'mate', trust: 4 } }, { conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'leave_early', label: 'Duck out early: you are exhausted', risk: 'low', result: `You tell them you have to rest, and you do. The stable notes the empty chair, and {mate.first} keeps your plate warm.`, effects: [{ fatigue: -5 }, { rel: { who: 'mate', trust: -2 } }, { conf: -1 }] },
    ],
  },
  {
    id: 'nc_fac_new_blood', category: 'faction', title: '{kid.name} Wants to Join Your Stable', weight: 3, cooldownDays: 120, maxPerCareer: 2,
    trigger: { flag: 'player_leads_stable' },
    cast: { kid: { pick: 'tag', tag: 'studying_you' } }, memory: { role: 'kid', max: 2 },
    slots: { pitch: [`a notebook of your matches with {kid.their} notes in the margins`, `a promo {kid.first} has been rehearsing for months`, `a handmade version of the stable's logo`, `a tape of {kid.them}self doing your best spots, badly`], timing: [`at the airport gate`, `in the hotel gym`, `at the merch table`, `right after your last match`] },
    body: [`{kid.name} has been studying you for longer than you realized. {timing}, {kid.first} hands over {pitch} and asks to join the stable.`, `The offer is earnest in a way that is hard to stand next to. Taking a hungry newcomer in is generous and a gamble, since someone that attentive could learn everything you do and use it.`],
    choices: [
      { id: 'recruit', label: 'Bring {kid.them} in and put {kid.them} on the card', risk: 'med', result: `You announce it at the next meeting. The others make room, and {kid.first} grins like someone who just heard {kid.their} name on a loudspeaker.`, effects: [{ event: { type: 'faction_joined', participants: ['kid'], summary: `Brought {kid.name} into the stable.`, importance: 3, data: { factionId: 'stable_player', member: '@kid' } } }, { rel: { who: 'kid', trust: 8, respect: 6, affinity: 5 } }, { pop: 0.2 }, { fatigue: 3 }] },
      { id: 'prove', label: 'Make {kid.them} earn it with three months of work', risk: 'low', result: `You set a list of chores and a calendar. {kid.first} agrees to all of it, and the stable tolerates the extra pair of hands.`, effects: [{ rel: { who: 'kid', respect: 6, trust: 3 } }, { fatigue: 2 }, { conf: 1 }] },
      { id: 'mentor', label: 'Decline the stable but offer to teach on the side', risk: 'low', result: `You find a gym slot twice a week. {kid.first} takes notes, and the stable is left with a story about the newcomer you refused.`, effects: [{ event: { type: 'mentorship', participants: ['kid'], summary: `Began teaching {kid.name} outside the stable.`, importance: 3, data: { byPlayer: true } } }, { flag: 'nc_mentee_taught' }, { rel: { who: 'kid', respect: 8, trust: 6 } }, { fatigue: 4 }] },
      { id: 'no', label: 'Turn {kid.them} down: too green, too risky', risk: 'low', result: `{kid.first} thanks you politely. "I will be back when I am ready," {kid.first} says, and goes off to practice harder. A little of the wind goes out of the room, and maybe out of you too.`, effects: [{ rel: { who: 'kid', respect: -2, trust: -2 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'nc_fac_feedback_box', category: 'faction', title: 'Notes Left in Your Locker', weight: 3, cooldownDays: 150, maxPerCareer: 1,
    trigger: { flag: 'player_leads_stable', noFlag: 'nc_fac_feedback', mem: [{ role: 'mate', trustGte: 15 }] },
    cast: { mate: { pick: 'tag', tag: 'ally' } }, memory: { role: 'mate', max: 1 },
    slots: { note: [`a typed sheet with no signature`, `a crumpled napkin in a familiar hand`, `a sticky note on your boot`, `a voice message that begins with a long breath`], gripe: [`you take too many of the good spots`, `no one is allowed to disagree in meetings`, `you stopped asking how the others are doing`, `you decide things before anyone speaks`] },
    body: [`There is {note} waiting for you, and it says what no one has dared say aloud: {gripe}. You are fairly sure it is from {mate.name}, who has been unusually quiet in the van.`, `Leading a stable means hearing this sort of thing eventually. Whether it makes you better or just more guarded depends on what you do in the next ten minutes.`],
    choices: [
      { id: 'own', label: 'Read it to the group and own every word', risk: 'med', result: `The room goes quiet, and then {mate.first} lets out a breath. You promise to change, and the first meeting after that is the loosest the stable has had in months.`, effects: [{ flag: 'nc_fac_feedback' }, { rel: { who: 'mate', trust: 9, respect: 8 } }, { conf: -1 }, { pop: -0.1 }] },
      { id: 'private', label: 'Talk to {mate.first} alone and say thank you', risk: 'low', result: `"It was me," {mate.first} admits, looking relieved to be caught. Your thanks is simple, and the whole thing stays between two friends.`, effects: [{ flag: 'nc_fac_feedback' }, { rel: { who: 'mate', trust: 7, respect: 4, affinity: 4 } }, { fatigue: 1 }] },
      { id: 'hunt', label: 'Find out who wrote it and deal with them', risk: 'high', result: `It takes two days, and you do find out. The stable learns you will not tolerate an anonymous critic, and the loyalty that follows is paper thin.`, effects: [{ flag: 'nc_fac_feedback' }, { rel: { who: 'mate', trust: -12, respect: -5, fear: 6 } }, { conf: 2 }, { pop: -0.2 }] },
      { id: 'bin', label: 'Throw it away and carry on', risk: 'low', result: `You decide it is just noise. The next three weeks feel normal, and the stable keeps its smiles on.`, effects: [{ rel: { who: 'mate', trust: -3 } }, { conf: 2 }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'nc_fac_vote', category: 'faction', title: 'The Stable Votes', weight: 5, cooldownDays: 90, maxPerCareer: 1, major: true,
    trigger: { flag: 'nc_fac_feedback', mem: [{ role: 'mate', respectGte: 10 }] },
    cast: { mate: { pick: 'tag', tag: 'ally' } }, memory: { role: 'mate', max: 2 },
    slots: { question: [`who gets the top spot on the next card`, `whether to take on the rival stable`, `how the merch money is split`, `whether the leader should rotate`], mood: [`nervous`, `quietly hopeful`, `half laughing`, `tired but willing`] },
    body: [`After weeks of changes, the stable asks for a vote on {question}. {mate.name} calls the meeting to order in a voice that is {mood}, and the chairs are in a circle for once.`, `You will not control the result, and that is the point. How you behave when it does not go your way will say more than the speeches you gave to get here.`],
    choices: [
      { id: 'abide', label: 'Accept the result, whatever it is', risk: 'low', result: `The vote goes against your preference by a single hand. You nod and shake it, and watch the others loosen as they realize you meant it. "Did not expect that," {mate.first} murmurs.`, effects: [{ clearFlag: 'nc_fac_feedback' }, { rel: { who: 'mate', trust: 8, respect: 7 } }, { conf: -1 }, { pop: 0.1 }] },
      { id: 'campaign', label: 'Lobby hard before the vote', risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `You work the room quietly and the vote goes your way. It feels like a win, though a few faces say they noticed the pressure.`, effects: [{ clearFlag: 'nc_fac_feedback' }, { pop: 0.3 }, { conf: 3 }, { rel: { who: 'mate', trust: -4 } }] },
        { weight: 1, text: `The lobbying is spotted and read aloud. You lose the vote and a good deal of credit with it.`, effects: [{ clearFlag: 'nc_fac_feedback' }, { conf: -3 }, { rel: { who: 'mate', trust: -6, respect: -3 } }] } ] },
      { id: 'veto', label: 'Use your authority and overrule it', risk: 'high', result: `You overrule them with a straight face. The stable obeys, and the next meeting is much shorter and much colder.`, effects: [{ clearFlag: 'nc_fac_feedback' }, { rel: { who: 'mate', trust: -12, respect: -6, fear: 6 } }, { pop: 0.2 }, { conf: 2 }] },
      { id: 'step', label: 'Offer to step down if they want a change', risk: 'med', result: `The room is shocked. The vote is unanimous in your favor, and the relief in {mate.first}'s face is the real answer.`, effects: [{ clearFlag: 'nc_fac_feedback' }, { rel: { who: 'mate', trust: 10, respect: 9, affinity: 6 } }, { pop: -0.2 }, { conf: 1 }] },
    ],
  },
  {
    id: 'nc_fac_boss_credit', category: 'faction', title: 'The Boss Takes the Credit', weight: 3, cooldownDays: 110, maxPerCareer: 2,
    trigger: { flag: 'in_stable', mem: [{ role: 'boss', respectGte: 15 }] },
    cast: { boss: { pick: 'tag', tag: 'ally' }, producer: { pick: 'staff', role: 'producer' } }, memory: { role: 'boss', max: 2 },
    slots: { praise: [`the best segment of the month`, `a three-minute promo that got a standing ovation`, `a finish that people are still replaying`, `a comeback spot the building came apart for`], form: [`at the production table`, `in a hallway interview`, `in a magazine profile`, `in a slow, smug speech at the stable meeting`] },
    body: [`{producer.name} leans over and says, quietly, "{boss.name} is accepting congratulations {form} for {praise}." You did the work, and the stable's leader did the talking.`, `Stables run on a bargain: the leader collects the glory and the others share the safety. The bargain feels thinner on some nights than on others.`],
    choices: [
      { id: 'swallow', label: 'Swallow it: the group comes first', risk: 'low', result: `You smile and nod and take the hit. {boss.first} notices the discipline and puts a hand on your shoulder, which is worth something in this room.`, effects: [{ rel: { who: 'boss', trust: 6, respect: 3 } }, { conf: -2 }, { pop: -0.1 }] },
      { id: 'correct', label: 'Quietly correct the record with the producer', risk: 'med', result: `{producer.first} makes a small correction in the notes, and word gets to the boss. {boss.first} is courteous about it, but the temperature drops.`, effects: [{ pop: 0.4 }, { rel: { who: 'boss', trust: -6, heat: 4 } }, { conf: 2 }] },
      { id: 'confront', label: 'Take it up with {boss.first} directly', risk: 'high', outcomes: [
        { weight: 1, bonus: { confidence: 0.5 }, text: `{boss.first} admits it with a shrug and a promise to do better. For a week things are decent, and then the old habit creeps back.`, effects: [{ rel: { who: 'boss', respect: 5, trust: 1 } }, { conf: 3 }, { pop: 0.2 }] },
        { weight: 1, text: `{boss.first} bristles and reminds you what the stable has given you. The argument ends in a stiff handshake and a very quiet van ride.`, effects: [{ rel: { who: 'boss', trust: -8, heat: 8 } }, { conf: -2 }] } ] },
      { id: 'bank', label: 'Bank it as leverage for later', risk: 'med', result: `You say nothing and make a note. Someday this will be useful, and you hope you will not like how it feels to use it.`, effects: [{ rel: { who: 'boss', trust: -3 } }, { conf: 1 }, { money: 1000 }] },
    ],
  },
  {
    id: 'nc_fac_drift', category: 'faction', title: '{mate.name} Is Drifting Away', weight: 3, cooldownDays: 100, maxPerCareer: 2,
    trigger: { flag: 'in_stable', mem: [{ role: 'mate', trustLte: 15 }] },
    cast: { mate: { pick: 'tag', tag: 'ally' } }, memory: { role: 'mate', max: 2 },
    slots: { sign: [`skipping the group meal`, `taking separate rides to the arena`, `eating lunch with another crew`, `dodging the stable's phone calls`], explanation: [`I have just been tired`, `It is not about you`, `I just need some air`, `The whole thing got heavy`] },
    body: [`{mate.name} has been {sign} for a couple of weeks, and when you finally ask why, the answer is "{explanation}." It is polite, vague, and not at all like {mate.them}.`, `The stable runs on trust, and trust runs on small things, like showing up. The first crack is easy to spot and hard to point to.`],
    choices: [
      { id: 'ask', label: 'Sit {mate.them} down and ask what is wrong', risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{mate.first} says it all at once: the favoritism, the pressure, the long nights. It is hard to hear, and you listen to all of it.`, effects: [{ rel: { who: 'mate', trust: 9, respect: 4 } }, { conf: 1 }, { fatigue: 2 }] },
        { weight: 1, text: `{mate.first} shuts down and says everything is fine. You lose the thread, and an hour later you still have no idea what to fix.`, effects: [{ rel: { who: 'mate', trust: -2 } }, { conf: -2 }] } ] },
      { id: 'space', label: 'Give {mate.them} space and wait', risk: 'low', result: `You keep your distance. {mate.first} comes back in time, a little changed, a little guarded.`, effects: [{ rel: { who: 'mate', trust: 1 } }, { conf: -1 }] },
      { id: 'push', label: 'Push: remind {mate.them} what the stable has done for {mate.them}', risk: 'high', result: `You list every favor. {mate.first} hears you out with a flat face and walks away without saying a word.`, effects: [{ rel: { who: 'mate', trust: -10, respect: -4, fear: 4 } }, { conf: 1 }] },
      { id: 'reward', label: 'Hand {mate.them} a bigger spot to bring {mate.them} back', risk: 'med', result: `The spot goes to {mate.first}, and for a while it works. The others notice, and a little resentment starts to grow elsewhere.`, effects: [{ rel: { who: 'mate', trust: 6, respect: 2 } }, { pop: -0.3 }, { money: -1500 }] },
    ],
  },
  {
    id: 'nc_fac_ex_member', category: 'faction', title: '{ex.name} Asks to Come Back', weight: 3, cooldownDays: 120, maxPerCareer: 2,
    trigger: { flag: 'player_leads_stable', mem: [{ role: 'ex', tag: 'reconciled' }] },
    cast: { ex: { pick: 'tag', tag: 'reconciled' } }, memory: { role: 'ex', max: 2 },
    slots: { reason: [`the other stable never really made room`, `the solo run did not go as planned`, `{ex.first} misses the people more than the spots`, `the office stopped returning {ex.their} calls`], manner: [`with a printed apology`, `with a bottle of something good`, `by asking the stable to vote`, `by just turning up for practice`] },
    body: [`{ex.name} is back, {manner}. By {ex.their} own account, {reason}, and the pride of the first departure has long since worn off.`, `The stable remembers how it ended, and so do you. A returning member can restore a lost piece or reopen a wound that was just closing.`],
    choices: [
      { id: 'welcome', label: 'Welcome {ex.them} back, no conditions', risk: 'med', result: `You say yes before the others can object. The stable eyes you both for a long moment and then makes room, because that is what families do.`, effects: [{ event: { type: 'faction_joined', participants: ['ex'], summary: `{ex.name} returned to the stable.`, importance: 3, data: { factionId: 'stable_player', member: '@ex' } } }, { rel: { who: 'ex', trust: 8, respect: 5, affinity: 5 } }, { pop: 0.2 }] },
      { id: 'probation', label: 'Offer a trial run with clear ground rules', risk: 'low', result: `{ex.first} accepts with a nod. The stable calls it "probation," and everybody hides how much they like having {ex.them} around.`, effects: [{ rel: { who: 'ex', trust: 4, respect: 3 } }, { conf: 1 }, { fatigue: 1 }] },
      { id: 'refuse', label: 'Refuse: the group has moved on', risk: 'low', result: `You say it as kindly as you can. {ex.first} takes it without a fuss. "Understood," {ex.first} says, and leaves, and the stable's silence afterwards has an echo.`, effects: [{ rel: { who: 'ex', trust: -5, respect: -2 } }, { conf: 1 }] },
      { id: 'trade', label: 'Use the offer to renegotiate your own terms', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `You make a deal that gives everyone something, and {ex.first} signs. The stable gets stronger and you quietly get a bigger cut.`, effects: [{ money: 3000 }, { pop: 0.3 }, { rel: { who: 'ex', trust: -2 } }] },
        { weight: 1, text: `{ex.first} hears the haggling and walks. The stable sees it too, and wonders what kind of leader bargains with a friend.`, effects: [{ rel: { who: 'ex', trust: -9, respect: -4 } }, { conf: -2 }, { pop: -0.2 }] } ] },
    ],
  },
  {
    id: 'nc_fac_haze', category: 'faction', title: 'The Boss Wants the New Kid Tested', weight: 2, cooldownDays: 110, maxPerCareer: 2,
    trigger: { flag: 'in_stable', mem: [{ role: 'boss', trustGte: 20 }] },
    cast: { boss: { pick: 'tag', tag: 'ally' }, newbie: { pick: 'roster', sameBrand: true, tier: { lte: 1 } } }, memory: { role: 'boss', max: 1 },
    slots: { ordeal: [`carry the whole stable's bags to the bus`, `take a stiff chop in the middle of the ring`, `sit alone at the stable table until midnight`, `sing the stable's anthem on the bus`], excuse: [`it builds character`, `everyone did it once`, `nobody trusts a free ride`, `it was done to the boss once, and the boss turned out fine`] },
    body: [`{boss.name} has decided that {newbie.name} needs to {ordeal} before the stable will say hello. {boss.their} reason is that {excuse}, and {boss.first} asks you to enforce it.`, `A rookie in the line of fire looks at you for a clue. Everyone has a story about the night they were tested, and not all of them are funny in hindsight.`],
    choices: [
      { id: 'enforce', label: 'Enforce it and keep your face straight', risk: 'med', result: `The test goes ahead, and {newbie.first} gets through it with a damp smile. The boss grunts approval, and you remember how it felt to be on the other end.`, effects: [{ rel: { who: 'boss', trust: 6, respect: 3 } }, { rel: { who: 'newbie', trust: -4, respect: 2 } }, { conf: -1 }] },
      { id: 'soften', label: 'Soften it so no one gets hurt', risk: 'low', result: `You shave the sharp edges off and call it a bonding exercise. The boss grumbles, and {newbie.first} spends a week telling people you were decent.`, effects: [{ rel: { who: 'newbie', trust: 6, respect: 4 } }, { rel: { who: 'boss', trust: -6, respect: -2 } }, { conf: 1 }] },
      { id: 'decline', label: 'Refuse and say so openly', risk: 'high', outcomes: [
        { weight: 1, bonus: { confidence: 0.4, charisma: 0.3 }, text: `The boss frowns and thinks it over. "Fine," {boss.first} says. "You have a point." The test is dropped, and {newbie.first} never knows.`, effects: [{ rel: { who: 'boss', respect: 4 } }, { rel: { who: 'newbie', respect: 5, trust: 4 } }, { conf: 3 }] },
        { weight: 1, text: `The boss makes a speech about loyalty in front of everyone. You get your way and a cold shoulder for a month.`, effects: [{ rel: { who: 'boss', trust: -8, heat: 6 } }, { rel: { who: 'newbie', respect: 4, trust: 3 } }, { conf: -1 }] } ] },
      { id: 'warn', label: 'Quietly warn the kid what is coming', risk: 'med', result: `You slip {newbie.first} a note. {newbie.first} breezes through the test, and the boss is oddly impressed by {newbie.their} composure.`, effects: [{ rel: { who: 'newbie', trust: 8, respect: 4 } }, { rel: { who: 'boss', trust: -4 } }, { fatigue: 2 }, { conf: -1 }] },
    ],
  },
  {
    id: 'nc_fac_rival_recruits', category: 'faction', title: '{rival.name} Is Building a Crew', weight: 3, cooldownDays: 100, maxPerCareer: 2,
    trigger: { noFlag: 'in_stable', rivalry: { minHeat: 25 } },
    cast: { rival: { pick: 'rivalry', minHeat: 25 }, mate: { pick: 'roster', sameBrand: true, tier: { gte: 1, lte: 3 } } }, memory: { role: 'rival', max: 2 },
    slots: { gesture: [`wearing a matching jacket`, `sharing an entrance with {rival.first}`, `striking a synchronized pose on the ramp`, `carrying a stack of shirts with a new logo`], rumor: [`the office loves it`, `the crowd is already chanting for the new group`, `someone is writing a theme song`, `it is already on the poster`] },
    body: [`{rival.name} has been recruiting. {mate.name} turned up at the arena yesterday {gesture}, and the whisper is that {rumor}.`, `A rival with a crew can shut doors you did not know you were standing in front of. Building one of your own would take months, and sounds a lot like an arms race.`],
    choices: [
      { id: 'poach', label: 'Poach {mate.first} before it is official', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: `You find {mate.first} in a parking lot and make an offer {mate.first} cannot refuse. The crew falls apart before it forms, and {rival.first} is livid.`, effects: [{ rel: { who: 'rival', heat: 14, respect: -4 } }, { rivalry: { who: 'rival', heat: 12 } }, { rel: { who: 'mate', trust: 4 } }, { pop: 0.6 }] },
        { weight: 1, text: `{mate.first} tells {rival.first} about the offer within the hour. The rivalry gets personal, and so does the rumor mill.`, effects: [{ rel: { who: 'rival', heat: 10 } }, { rivalry: { who: 'rival', heat: 8 } }, { conf: -3 }, { pop: -0.3 }] } ] },
      { id: 'build', label: 'Start building your own crew', risk: 'med', result: `You make three calls and go to dinner twice. It is slow, and by the end of the month you have the start of a group and a fresh set of obligations.`, effects: [{ pop: 0.3 }, { fatigue: 6 }, { conf: 2 }, { rivalry: { who: 'rival', heat: 5 } }] },
      { id: 'ignore', label: 'Ignore it: crews fall apart on their own', risk: 'low', result: `You keep your head down and your schedule clear. Three months later, half the crew is gone and nobody remembers the jackets.`, effects: [{ conf: 1 }, { rel: { who: 'rival', respect: -1 } }, { fatigue: -2 }] },
      { id: 'talk', label: 'Offer {rival.first} a truce before it escalates', risk: 'low', result: `{rival.first} hears the offer out and smiles with only half {rival.their} mouth. "Nice try," {rival.first} says. The truce is short, and the crew goes ahead anyway.`, effects: [{ rel: { who: 'rival', respect: 3, heat: -4 } }, { rivalry: { who: 'rival', heat: -4 } }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'nc_fac_courted', category: 'faction', title: 'Your Rival Is Courting a Stablemate', weight: 3, cooldownDays: 110, maxPerCareer: 2,
    trigger: { flag: 'in_stable', mem: [{ role: 'rival', heatGte: 20 }] },
    cast: { rival: { pick: 'rivalry', minHeat: 25 }, mate: { pick: 'tag', tag: 'ally' } }, memory: { role: 'rival', max: 2 },
    slots: { lure: [`a bigger spot on the card`, `an offer of a title feud`, `an apology for an old insult`, `a seat at a better table`], venue: [`the catering line`, `the corridor outside the dressing room`, `a hotel breakfast room`, `the parking lot after the show`] },
    body: [`You catch {rival.name} talking to {mate.name} in {venue}. The offer, you can tell from {mate.their} expression, is {lure}, and it is working.`, `Poaching is as old as the business. What matters now is whether your stablemate is being conned, or genuinely finds the offer better than yours.`],
    choices: [
      { id: 'interrupt', label: 'Walk in and break it up', risk: 'med', result: `You step between them and say something short. The tension is loud, {rival.first} steps back, and {mate.first} gives you a look you cannot read.`, effects: [{ rel: { who: 'rival', heat: 8 } }, { rivalry: { who: 'rival', heat: 6 } }, { rel: { who: 'mate', trust: -2 } }, { conf: 1 }] },
      { id: 'trust', label: 'Let them talk and trust your friend', risk: 'low', result: `You walk past without a word. That night {mate.first} finds you. "{rival.first} asked," {mate.first} says. "I said no." The trust you showed is worth more than a speech.`, effects: [{ rel: { who: 'mate', trust: 9, respect: 6 } }, { conf: 2 }, { fatigue: 1 }] },
      { id: 'counter', label: 'Counter-offer {mate.first} something better', risk: 'high', outcomes: [
        { weight: 2, bonus: { popularity: 0.4 }, text: `You put a better offer on the table, and {mate.first} sticks. It costs you a spot of your own, and the rival learns what it is to lose a recruit.`, effects: [{ rel: { who: 'mate', trust: 7, respect: 4 } }, { rel: { who: 'rival', heat: 8 } }, { pop: -0.3 }, { money: -2000 }] },
        { weight: 1, text: `{mate.first} hears the counter as proof you were taking {mate.them} for granted. The conversation ends in a quiet and costly standoff.`, effects: [{ rel: { who: 'mate', trust: -8, respect: -3 } }, { conf: -2 }] } ] },
      { id: 'spy', label: 'Ask {mate.first} to play along and feed you intel', risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.3 }, text: `The spying works for a month and earns you three useful secrets. {mate.first} is exhausted by the double life, and says so.`, effects: [{ pop: 0.4 }, { rel: { who: 'mate', trust: -4 } }, { conf: 2 }, { fatigue: 3 }] },
        { weight: 1, text: `{rival.first} figures out the game and feeds {mate.first} lies. You end up fed misinformation, and you look foolish.`, effects: [{ rel: { who: 'mate', trust: -6 } }, { rel: { who: 'rival', respect: 3 } }, { conf: -3 }, { pop: -0.3 }] } ] },
    ],
  },
  {
    id: 'nc_fac_old_crew_calls', category: 'faction', title: 'The Old Crew Wants a Reunion', weight: 2, cooldownDays: 150, maxPerCareer: 1,
    trigger: { noFlag: 'in_stable', mem: [{ role: 'old', trustGte: 25 }], stat: { careerYears: { gte: 2 } } },
    cast: { old: { pick: 'tag', tag: 'ally' }, creative: { pick: 'staff', role: 'creative' } }, memory: { role: 'old', max: 2 },
    slots: { occasion: [`a retrospective special`, `an anniversary show`, `a one-night charity card`, `a hometown tribute`], promise: [`the old music`, `the old entrance`, `the old jackets`, `the old catchphrase`] },
    body: [`{old.name} calls with news: {creative.name} is planning {occasion} and wants the old crew back for one night, with {promise} and all. "Say no if you want," {old.first} says, laughing a bit, as if bracing for exactly that.`, `A reunion is a gift to the fans and a risk for anyone who has changed. Going back means being what people remember, and you may be someone else now.`],
    choices: [
      { id: 'yes', label: 'Say yes and give it everything', risk: 'low', result: `The night goes better than anyone expected. The crowd sings the old song, and you and {old.first} hold each other's gaze in the ring longer than the script says.`, effects: [{ pop: 0.9 }, { rel: { who: 'old', trust: 6, affinity: 6 } }, { fatigue: 6 }, { conf: 2 }] },
      { id: 'modernize', label: 'Say yes if the old act is updated', risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `You rework the bit with a wink to the old days, and the fans love it more than the original. {old.first} calls it the best idea in years.`, effects: [{ pop: 0.8 }, { rel: { who: 'old', respect: 5 } }, { fatigue: 5 }] },
        { weight: 1, text: `The update confuses the crowd and ends up less fun than the old thing. {old.first} says nothing, which says plenty.`, effects: [{ pop: -0.3 }, { rel: { who: 'old', trust: -2 } }, { conf: -2 }] } ] },
      { id: 'no', label: 'Say no: you cannot go back', risk: 'low', result: `You say it gently and honestly. {old.first} nods and says it is fine, and neither of you mentions it again.`, effects: [{ rel: { who: 'old', trust: -3, affinity: -2 } }, { conf: 1 }, { fatigue: -2 }] },
      { id: 'cash', label: 'Say yes if the pay is right', risk: 'med', result: `The fee is substantial and the show is fine. {old.first} hears the figure and goes quiet in a way that is hard to unhear.`, effects: [{ money: 15000 }, { pop: 0.3 }, { rel: { who: 'old', trust: -4, affinity: -2 } }] },
    ],
  },
  {
    id: 'nc_fac_poster', category: 'faction', title: 'Who Stands in Front?', weight: 2, cooldownDays: 120, maxPerCareer: 2,
    trigger: { flag: 'in_stable', mem: [{ role: 'mate', respectGte: 15 }] },
    cast: { mate: { pick: 'tag', tag: 'ally' }, creative: { pick: 'staff', role: 'creative' } }, memory: { role: 'mate', max: 1 },
    slots: { piece: [`the new stable poster`, `the cover of the next program`, `a photo for the arena video wall`, `a promo photo for the merch table`], layout: [`one face in the middle, others behind`, `a straight line of equals`, `a triangle with a clear tip`, `a crowd with no clear lead`] },
    body: [`{creative.name} needs to settle {piece} today, and has a layout in mind: {layout}. Everybody in the stable has an opinion, and {mate.name} is the only one who is not talking.`, `Who stands where says who matters, and everyone in the stable can read a picture. The photographer is waiting, and so is the light.`],
    choices: [
      { id: 'you', label: 'Take the front: you have earned it', risk: 'med', result: `You step forward and the photographer does not argue. The picture is strong, and {mate.first} stands slightly further back than {mate.they} used to.`, effects: [{ pop: 0.5 }, { rel: { who: 'mate', trust: -4, respect: -2 } }, { conf: 2 }] },
      { id: 'mate', label: 'Put {mate.first} in front', risk: 'low', result: `{mate.first} blinks at the offer. "Are you sure?" {mate.first} asks, then takes it with a lump in {mate.their} throat. The picture looks warmer for it, and you are in the second row smiling.`, effects: [{ rel: { who: 'mate', trust: 8, respect: 6, affinity: 5 } }, { pop: -0.3 }, { conf: -1 }] },
      { id: 'line', label: 'Insist on a straight line of equals', risk: 'low', result: `The picture is plain and fair, and nobody argues with it. It takes forty minutes and an apple, and the photographer sighs through all of them.`, effects: [{ rel: { who: 'mate', trust: 3, respect: 2 } }, { pop: 0.1 }, { fatigue: 2 }] },
      { id: 'vote_pic', label: 'Let the whole stable vote', risk: 'med', outcomes: [
        { weight: 1, text: `The vote lands on a strong layout that nobody expected. The group enjoys the process, and the picture looks like them.`, effects: [{ rel: { who: 'mate', trust: 4, affinity: 4 } }, { pop: 0.3 }, { conf: 1 }] },
        { weight: 1, text: `The vote splits and the photographer leaves for the night. The picture is bland, and the group resents the delay.`, effects: [{ rel: { who: 'mate', trust: -2 } }, { pop: -0.3 }, { fatigue: 2 }] } ] },
    ],
  },
  // ===================================================================== MENTOR
  {
    id: 'nc_men_first_year_notes', category: 'mentor', title: '{mentor.name} Reads Your First Year', weight: 3, cooldownDays: 200, maxPerCareer: 1,
    trigger: { stat: { careerYears: { lte: 1.5 }, matches: { gte: 5 } }, mem: [{ role: 'mentor', trustGte: 5 }] },
    cast: { mentor: { pick: 'tag', tag: 'mentor' } }, memory: { role: 'mentor', max: 2 },
    slots: { place: [`a corner booth that smells of fryer oil`, `the bleachers of an empty arena`, `the front seat of a dented rental`, `a hotel breakfast room before sunrise`], habit: [`you rush the ending of every match`, `you look at the crowd before your move, not the opponent`, `you sell too little when you are hurt`, `you say sorry with your face whenever a spot goes wrong`] },
    body: [`In {place}, {mentor.name} pulls out a battered notebook and flips to a page headed with your name. The first year is on paper, and the longest note says {habit}.`, `Hearing it from someone who has watched you every week is different from hearing it from a stranger. It is gentler, and it is harder to dismiss.`],
    choices: [
      { id: 'listen', label: 'Listen and write every note down', risk: 'low', result: `You fill six pages of your own. {mentor.first} watches you do it and sits back, content, with {mentor.their} coffee going cold.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { rel: { who: 'mentor', respect: 4, trust: 4 } }, { conf: -1 }, { fatigue: 2 }] },
      { id: 'argue', label: 'Argue the point: you believe in your instincts', risk: 'med', outcomes: [
        { weight: 1, bonus: { confidence: 0.4 }, text: `{mentor.first} grins. "That is exactly what I hoped you would say." The argument turns into a good one, and you leave with a sharper version of both views.`, effects: [{ rel: { who: 'mentor', respect: 5 } }, { conf: 4 }, { attr: { name: 'psychology', delta: 1 } }] },
        { weight: 1, text: `The conversation sours. {mentor.first} closes the notebook and tells you that people who refuse notes tend to get a different kind of education.`, effects: [{ rel: { who: 'mentor', trust: -5, respect: -3 } }, { conf: -2 }] } ] },
      { id: 'harder', label: 'Ask for harder lessons, not just notes', risk: 'med', result: `{mentor.first} raises an eyebrow and starts a schedule of early mornings in an empty ring. It will not be kind.`, effects: [{ attr: { name: 'technical', delta: 1 } }, { fatigue: 8 }, { rel: { who: 'mentor', respect: 5, trust: 4 } }, { conf: 2 }] },
      { id: 'deflect', label: 'Brush off the notes and talk about the future', risk: 'low', result: `You steer to big plans and bright lights. {mentor.first} lets you, with a smile that has a lot of years behind it.`, effects: [{ rel: { who: 'mentor', respect: -2, trust: -1 } }, { pop: 0.2 }, { conf: 2 }] },
    ],
  },
  {
    id: 'nc_men_rising', category: 'mentor', title: 'Pride, and a Warning, from {mentor.name}', weight: 3, cooldownDays: 150, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 45 }, wins: { gte: 20 } }, mem: [{ role: 'mentor', respectGte: 10 }] },
    cast: { mentor: { pick: 'tag', tag: 'mentor' } }, memory: { role: 'mentor', max: 2 },
    slots: { greeting: [`a slap on the back that nearly knocks you over`, `a long look that says more than a speech`, `a chair pulled out without a word`, `a cup of tea and a cold stare`], warning: [`The room will love you right up until the day it does not`, `Nobody remembers who was kind to them on the way up`, `Pops do not pay for the bad nights`, `Be careful who you let carry your bags`] },
    body: [`{mentor.name} greets you with {greeting}. You have climbed faster than anyone expected, and your mentor looks proud enough to be a little afraid.`, `Then comes the warning, said low, in the voice of someone who has watched others fall: "{warning}."`],
    choices: [
      { id: 'humble', label: 'Take it humbly and thank {mentor.them}', risk: 'low', result: `You say you will not forget where you started, and you mean it. {mentor.first} nods and does not look away from your eyes until you finish.`, effects: [{ rel: { who: 'mentor', respect: 5, trust: 5, affinity: 3 } }, { conf: 1 }, { pop: 0.1 }] },
      { id: 'cocky', label: 'Laugh it off: this time is different', risk: 'high', result: `You say it with a grin and the grin does not travel. {mentor.first} sighs, pays the bill, and leaves without finishing the sentence.`, effects: [{ rel: { who: 'mentor', respect: -5, trust: -4 } }, { conf: 3 }, { pop: 0.3 }] },
      { id: 'ask', label: 'Ask {mentor.them} to name the mistake you are about to make', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `{mentor.first} thinks for a long time and then names it, with uncomfortable accuracy. You leave with a clear idea of what to avoid.`, effects: [{ rel: { who: 'mentor', respect: 5, trust: 4 } }, { conf: 1 }, { attr: { name: 'psychology', delta: 1 } }] },
        { weight: 1, text: `{mentor.first} shrugs and says the answer would not mean anything until you earn it. You come away irritated and not much wiser.`, effects: [{ conf: -1 }, { rel: { who: 'mentor', trust: 1 } }] } ] },
      { id: 'bring_up', label: 'Invite {mentor.them} onto the next show as your guest', risk: 'med', result: `The crowd gives {mentor.first} a standing ovation {mentor.they} did not expect, and your mentor can only wave. It is a small repayment on a very large debt.`, effects: [{ pop: 0.3 }, { rel: { who: 'mentor', trust: 4, affinity: 6, respect: 3 } }, { money: -1200 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'nc_men_belt', category: 'mentor', title: 'A Call After the Belt', weight: 4, cooldownDays: 200, maxPerCareer: 1, major: true,
    trigger: { holdsTitle: true, stat: { titleWins: { gte: 1 } }, mem: [{ role: 'mentor', trustGte: 10 }] },
    cast: { mentor: { pick: 'tag', tag: 'mentor' } }, memory: { role: 'mentor', max: 3 },
    slots: { how: [`by phone at two in the morning`, `with a handwritten note slid under your door`, `with a knock at the locker-room door`, `with a hug in the middle of a hallway`], thing: [`is silent for a very long time`, `says only four words`, `starts to speak and stops`, `laughs and cries at once`] },
    body: [`The belt is still on the chair when {mentor.name} reaches you, {how}. When the moment finally comes, your mentor {thing}, and the years between you both seem to fold shut.`, `It was a long road, longer than anyone watching can tell. For tonight, at least, the road is behind you and the two of you are just standing at the end of it.`],
    choices: [
      { id: 'credit', label: 'Credit {mentor.them} on camera by name', risk: 'low', result: `You say it clearly to a live audience: this belongs a little to {mentor.them}. The camera finds {mentor.first}, who looks at the floor and cannot stop smiling.`, effects: [{ pop: 0.5 }, { rel: { who: 'mentor', respect: 6, trust: 6, affinity: 6 } }, { conf: 2 }] },
      { id: 'private', label: 'Keep it private: just the two of you', risk: 'low', result: `You spend the night at a diner with the belt on the seat between you, saying very little. It may be the best night of the year.`, effects: [{ rel: { who: 'mentor', trust: 8, affinity: 8, respect: 3 } }, { conf: 3 }, { fatigue: -3 }] },
      { id: 'ask_next', label: 'Ask what a champion should do next', risk: 'med', result: `{mentor.first} answers honestly and at length. "Defend it badly, defend it often, and never believe the compliments." The advice is gold and takes the shine off the evening.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { rel: { who: 'mentor', respect: 4 } }, { conf: 1 }, { fatigue: 2 }] },
      { id: 'busy', label: 'Cut the call short: you have interviews to do', risk: 'med', result: `You promise to call tomorrow and do not. The interviews go well, and {mentor.first} spends the evening alone with a television.`, effects: [{ pop: 0.5 }, { rel: { who: 'mentor', trust: -6, affinity: -5 } }, { mic: 1 }] },
    ],
  },
  {
    id: 'nc_men_after_skid', category: 'mentor', title: '{mentor.name} Calls After the Losses', weight: 3, cooldownDays: 100, maxPerCareer: 2,
    trigger: { stat: { loseStreak: { gte: 3 } }, mem: [{ role: 'mentor', trustGte: 5 }] },
    cast: { mentor: { pick: 'tag', tag: 'mentor' } }, memory: { role: 'mentor', max: 2 },
    slots: { opener: [`I have been where you are, and it lasted eight months`, `Do not read the comments, and do not watch the tape tonight`, `The worst thing you can do right now is try harder`, `I am not calling to talk about wrestling`], offer: [`a ride to the gym`, `a free week at {mentor.their} training school`, `an hour on the phone every night`, `a seat in the front row at {mentor.their} next show`] },
    body: [`The call comes just after the third loss, and the first thing {mentor.name} says is: "{opener}." It is the kind of sentence that gets under the door of a bad night and slides in.`, `By the end of the conversation {mentor.first} has offered {offer}, and the offer sounds more like a lifeline than a lesson.`],
    choices: [
      { id: 'take', label: 'Take the offer and let {mentor.them} help', risk: 'low', result: `You say yes before pride can say anything else. A week with {mentor.first} costs you sleep and dignity, and gives back a good part of your balance.`, effects: [{ conf: 5 }, { fatigue: 5 }, { rel: { who: 'mentor', trust: 6, affinity: 5 } }, { attr: { name: 'technical', delta: 1 } }] },
      { id: 'pride', label: 'Thank {mentor.them} and say you will handle it', risk: 'med', result: `You say you will be fine, and the stubbornness feels like strength for a day. {mentor.first} says that is fine and that the offer stands.`, effects: [{ conf: 2 }, { rel: { who: 'mentor', trust: -2 } }, { fatigue: 2 }] },
      { id: 'blame', label: 'Unload: tell {mentor.them} whose fault it was', risk: 'high', result: `You rant about bookers, referees and bad luck. {mentor.first} lets you run dry, and then says gently that none of it is the real problem.`, effects: [{ conf: -2 }, { rel: { who: 'mentor', respect: -3, trust: 1 } }, { fatigue: -2 }] },
      { id: 'gamble', label: 'Ask for one hard lesson, right now, over the phone', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `{mentor.first} gives you one sentence: "Stop watching their hands. Watch where their weight goes." It rearranges how you think about the ring. You use it Monday and nearly cry afterwards.`, effects: [{ conf: 5 }, { rel: { who: 'mentor', respect: 4, trust: 4 } }, { attr: { name: 'psychology', delta: 1 } }] },
        { weight: 1, text: `The lesson does not land over a bad line. {mentor.first} says to call back when you are ready to listen, which is fair and stings anyway.`, effects: [{ conf: -2 }, { rel: { who: 'mentor', trust: -1 } }] } ] },
    ],
  },
  {
    id: 'nc_men_outgrown', category: 'mentor', title: 'The Student Is Bigger Than the Teacher', weight: 4, cooldownDays: 200, maxPerCareer: 1, major: true,
    trigger: { stat: { popularity: { gte: 70 } }, mem: [{ role: 'mentor', respectGte: 15 }] },
    cast: { mentor: { pick: 'tag', tag: 'mentor' } }, memory: { role: 'mentor', max: 3 },
    slots: { sign: [`{mentor.their} name is no longer on the first page of the call sheet`, `a rookie asked {mentor.them} who {mentor.first} was`, `the dressing room attendant no longer saves {mentor.their} usual locker`, `a young fan wore your shirt to {mentor.their} autograph signing`], reaction: [`laughs it off with a wet eye`, `pretends to be busy with {mentor.their} boots`, `says all the right things in a voice that is not {mentor.their} own`, `changes the subject so fast you can feel the draft`] },
    body: [`You are the draw now, and {mentor.name} has quietly noticed that {sign}. When you bring it up, {mentor.first} {reaction}.`, `No one in this business tells you what it feels like to outgrow the person who taught you. It is a victory and a small bereavement, and nobody warned either of you.`],
    choices: [
      { id: 'public', label: 'Pay tribute on air, in your own words', risk: 'low', result: `The moment is raw and real. {mentor.first} stands at the curtain with both hands over {mentor.their} mouth, and the crowd claps for much longer than the script allowed.`, effects: [{ pop: 0.4 }, { rel: { who: 'mentor', respect: 7, trust: 6, affinity: 7 } }, { fatigue: 6 }, { conf: -1 }] },
      { id: 'job', label: 'Find {mentor.them} a role beside you: an agent, a corner man', risk: 'med', result: `You go to the office and fight for it. {mentor.first} is not sure at first, then takes the job and goes to work with a grin that has not been seen in years.`, effects: [{ rel: { who: 'mentor', trust: 8, respect: 5, affinity: 5 } }, { pop: 0.2 }, { money: -2000 }, { fatigue: 3 }] },
      { id: 'let_go', label: 'Let the gap stay: it is the natural order', risk: 'low', result: `You keep your calls fewer and your visits shorter. Neither of you ever says it is happening, and both of you know.`, effects: [{ rel: { who: 'mentor', trust: -4, affinity: -4 } }, { conf: 1 }, { pop: 0.1 }] },
      { id: 'ask_hand', label: 'Ask {mentor.them} to stay as your coach for the climb ahead', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `{mentor.first} thinks about it, then says yes. The weeks that follow are among the best of your career, and among the hardest.`, effects: [{ rel: { who: 'mentor', trust: 6, respect: 5, affinity: 4 } }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 5 }] },
        { weight: 1, text: `{mentor.first} declines, kindly and firmly. "Go make your own mistakes," {mentor.first} says. It hurts, and it is probably right.`, effects: [{ rel: { who: 'mentor', respect: 3 } }, { conf: -2 }] } ] },
    ],
  },
  {
    id: 'nc_men_scar_story', category: 'mentor', title: 'The Story Behind the Scar', weight: 3, cooldownDays: 130, maxPerCareer: 2,
    trigger: { injured: true, mem: [{ role: 'mentor', trustGte: 10 }] },
    cast: { mentor: { pick: 'tag', tag: 'mentor' } }, memory: { role: 'mentor', max: 2 },
    slots: { scar: [`a line across the shoulder`, `a rippled patch on the shin`, `a notch in the eyebrow`, `a crooked finger that never set right`], lesson: [`the night {mentor.they} ignored a bad feeling`, `the match {mentor.they} could have said no to`, `the year {mentor.they} thought rest was for the weak`, `the month {mentor.they} treated a warning as a joke`] },
    body: [`With you laid up, {mentor.name} sits on the edge of the bed and shows you {scar}. The story that goes with it is about {lesson}, and it is told in the same plain voice used to order a meal.`, `It is not meant to scare you. It is meant to hand you a small, hard piece of the future for free.`],
    choices: [
      { id: 'listen', label: 'Listen all the way through, without interrupting', risk: 'low', result: `"That is all of it," {mentor.first} says at the end, and neither of you is looking at the other. The lesson stays with you much longer than the injury does.`, effects: [{ rel: { who: 'mentor', trust: 6, respect: 4, affinity: 4 } }, { conf: 2 }, { fatigue: -3 }] },
      { id: 'promise', label: 'Promise to take the recovery seriously', risk: 'med', result: `You make the promise out loud. It is easy to say in a bedroom and harder to keep in a locker room, and {mentor.first} will check.`, effects: [{ promise: { kind: 'win_streak', text: `I will come back slowly and win my first matches`, params: { n: 2 }, deadlineDays: 120 } }, { rel: { who: 'mentor', trust: 4, respect: 3 } }, { fatigue: -5 }] },
      { id: 'rush', label: 'Say you will be back early whatever it takes', risk: 'high', result: `{mentor.first} stares, shakes {mentor.their} head, and says nothing. The silence is longer than any lecture would have been.`, effects: [{ rel: { who: 'mentor', respect: -3, trust: -2 } }, { conf: 3 }, { fatigue: 4 }] },
      { id: 'joke', label: 'Joke about it: you will be fine', risk: 'low', result: `You make a crack about scars being free tattoos. {mentor.first} laughs, wipes an eye, and decides not to push the point today.`, effects: [{ rel: { who: 'mentor', affinity: 3 } }, { conf: 1 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'nc_men_kid_asks', category: 'mentor', title: '{kid.name} Has Been Watching You', weight: 3, cooldownDays: 100, maxPerCareer: 2,
    trigger: { noFlag: 'nc_mentee_taught', stat: { careerYears: { gte: 1 } } },
    cast: { kid: { pick: 'tag', tag: 'studying_you' } }, memory: { role: 'kid', max: 2 },
    slots: { gift: [`a coffee made exactly as you take it`, `a notebook full of your spots drawn as stick figures`, `a question {kid.they} clearly rehearsed in a mirror`, `a quiet offer to carry your bag`], moment: [`at the airport carousel`, `in the middle of the gym`, `outside the catering tent`, `right after the show`] },
    body: [`{moment}, {kid.name} approaches you with {gift}. Someone this attentive has been studying you for a while, and the evidence is everywhere: your pauses, your cadence, the way you bow your head after a good spot.`, `This is not a request for a favor. It is a request to turn an imitation into something better.`],
    choices: [
      { id: 'teach', label: 'Agree to teach {kid.them} what you know', risk: 'med', result: `You block out two mornings a week and show {kid.first} everything, including the bad habits you wish you did not have. {kid.first} writes it all down.`, effects: [{ event: { type: 'mentorship', participants: ['kid'], summary: `Started mentoring {kid.name}.`, importance: 3, data: { byPlayer: true } } }, { flag: 'nc_mentee_taught' }, { rel: { who: 'kid', respect: 8, trust: 7, affinity: 5 } }, { fatigue: 5 }, { pop: 0.2 }] },
      { id: 'test', label: 'Set {kid.them} a hard test before you commit', risk: 'low', result: `You give {kid.first} an assignment that would break most people. "What is next?" {kid.first} asks the following week, bleeding a little but grinning.`, effects: [{ flag: 'nc_mentee_taught' }, { rel: { who: 'kid', respect: 5, trust: 4 } }, { fatigue: 3 }, { conf: 1 }] },
      { id: 'redirect', label: 'Send {kid.them} to someone better suited', risk: 'low', result: `You write a few names on a napkin. {kid.first} thanks you politely and tucks the napkin into a notebook like a ticket.`, effects: [{ rel: { who: 'kid', respect: 2, trust: -1 } }, { conf: 1 }] },
      { id: 'errand', label: 'Take {kid.them} up on the bag and the coffee, nothing more', risk: 'med', result: `You enjoy the service and give no lessons. {kid.first} works hard for it, and by the end of the month the shine on {kid.their} face is gone.`, effects: [{ rel: { who: 'kid', respect: -4, trust: -4 } }, { fatigue: -3 }, { conf: 1 }] },
    ],
  },
  {
    id: 'nc_men_overreach', category: 'mentor', title: '{kid.name} Went Off Script', weight: 4, cooldownDays: 80, maxPerCareer: 2,
    trigger: { flag: 'nc_mentee_taught' },
    cast: { kid: { pick: 'tag', tag: 'studying_you' }, agent: { pick: 'staff', role: 'agent' } }, memory: { role: 'kid', max: 2 },
    slots: { move: [`a high-risk dive`, `an unscripted pin`, `a stiff forearm`, `a mic grab`], aftermath: [`pleased and a little frightened`, `furious and trying not to show it`, `strangely silent`, `already writing notes`] },
    body: [`{kid.name} went off script tonight, with {move} that was not on the sheet. {agent.name} is {aftermath}. "Did {kid.first} get that from you?" {agent.first} asks.`, `Part of it is exactly what you taught. The rest is something new, and it is not clear which part frightens you more.`],
    choices: [
      { id: 'defend', label: 'Defend {kid.first} to the agent', risk: 'med', result: `You take the heat and give the agent a speech about instinct. {kid.first} hears about it afterwards and straightens a little.`, effects: [{ rel: { who: 'kid', trust: 8, respect: 6 } }, { pop: -0.2 }, { conf: 1 }] },
      { id: 'correct', label: 'Correct {kid.them} privately and firmly', risk: 'low', result: `You take {kid.them} behind the curtain and walk through what went wrong, move by move. {kid.first} listens hard, and learns something real.`, effects: [{ rel: { who: 'kid', respect: 5, trust: 3 } }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 2 }] },
      { id: 'blame_kid', label: 'Let {kid.first} take the blame alone', risk: 'high', result: `The agent files a note and {kid.first} is sent home early. You keep clean hands and lose a student.`, effects: [{ rel: { who: 'kid', trust: -12, respect: -6 } }, { conf: 1 }, { pop: 0.1 }] },
      { id: 'use', label: 'Pitch the improvisation as a new angle', risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `The agent shrugs, then smiles. The moment becomes an angle and an opening, and {kid.first} gets a bigger push than either of you expected.`, effects: [{ rel: { who: 'kid', trust: 5, respect: 4 } }, { pop: 0.6 }, { fatigue: 3 }] },
        { weight: 1, text: `The pitch sounds opportunistic and the agent says so. {kid.first} sees it, too.`, effects: [{ rel: { who: 'kid', trust: -3 } }, { pop: -0.3 }, { conf: -2 }] } ] },
    ],
  },
  {
    id: 'nc_men_hard_question', category: 'mentor', title: 'The Question {kid.name} Asks', weight: 3, cooldownDays: 100, maxPerCareer: 2,
    trigger: { flag: 'nc_mentee_taught' },
    cast: { kid: { pick: 'tag', tag: 'studying_you' } }, memory: { role: 'kid', max: 1 },
    slots: { question: [`How do you stand being hated by strangers every night?`, `What do you do when you do not believe your own promo?`, `When did it stop feeling like a job and become who you are?`, `How do you cope when someone you trust lets you down?`], setting: [`on a night bus`, `over burnt coffee`, `in the half-dark of the empty arena`, `on a bench outside a gas station`] },
    body: [`{setting}, {kid.name} asks the kind of thing that is hard to answer honestly: "{question}" It is not a wrestling question at all.`, `You have answers, and some of them are even true. The student is looking at you with the kind of attention that makes a script impossible.`],
    choices: [
      { id: 'honest', label: 'Tell the truth, including the messy parts', risk: 'low', result: `The answer is long and half-embarrassing, and {kid.first} does not look away once. When you finish, the silence feels like the nicest compliment you have had in a year.`, effects: [{ rel: { who: 'kid', trust: 10, respect: 6, affinity: 6 } }, { conf: 1 }, { fatigue: 1 }] },
      { id: 'polish', label: 'Give the polished version you give interviewers', risk: 'low', result: `It sounds wonderful and a little empty. {kid.first} thanks you, writes something down, and the silence gets noticeably thicker.`, effects: [{ rel: { who: 'kid', trust: -2, respect: 1 } }, { pop: 0.1 }] },
      { id: 'deflect', label: 'Turn it into a joke and change the subject', risk: 'med', result: `The laugh covers the gap, and {kid.first} accepts it, politely. {kid.they} will not ask the real question again for a long time.`, effects: [{ rel: { who: 'kid', trust: -4, affinity: -2 } }, { conf: 1 }] },
      { id: 'ask_back', label: 'Ask {kid.first} what the answer might be', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `{kid.first} surprises you with something sharp and true. You learn as much from the answer as {kid.they} would have from yours.`, effects: [{ rel: { who: 'kid', respect: 6, trust: 5 } }, { conf: 2 }, { attr: { name: 'psychology', delta: 1 } }] },
        { weight: 1, text: `{kid.first} has no answer, and says so, with relief written on {kid.their} face. The conversation runs out of road a little early.`, effects: [{ rel: { who: 'kid', trust: 2 } }] } ] },
    ],
  },
  {
    id: 'nc_men_graduation', category: 'mentor', title: '{kid.name} Is Ready to Leave the Nest', weight: 4, cooldownDays: 150, maxPerCareer: 1, major: true,
    trigger: { flag: 'nc_mentee_taught', stat: { careerYears: { gte: 2 } } },
    cast: { kid: { pick: 'tag', tag: 'studying_you' }, exec: { pick: 'staff', role: 'executive' } }, memory: { role: 'kid', max: 3 },
    slots: { offer: [`a spot on the other brand`, `a development deal abroad`, `a tag team of {kid.their} own`, `a fresh start under a new name`], feeling: [`proud and a little heartbroken`, `nervous but sure`, `already homesick`, `apologetic and glowing`] },
    body: [`{kid.name} asks to talk in the quiet part of the arena, and the news arrives quickly: {exec.name} has offered {offer}. The student is {feeling}.`, `What began as imitation has become something independent, which is the entire point of teaching. It does not make the moment any easier.`],
    choices: [
      { id: 'bless', label: 'Give your blessing and a proper send-off', risk: 'low', result: `You give a speech you did not plan and a gift you did not expect to buy. {kid.first} leaves in tears, and the dressing room claps {kid.them} out.`, effects: [{ clearFlag: 'nc_mentee_taught' }, { rel: { who: 'kid', trust: 8, respect: 9, affinity: 8 } }, { pop: 0.3 }, { money: -1000 }] },
      { id: 'tie', label: 'Ask {kid.them} to stay one more year', risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `{kid.first} thinks about it. "One more year," {kid.first} says, a little shyly. Another year of shared travel and long drives follows, and it is a gift to both of you.`, effects: [{ rel: { who: 'kid', trust: 5, respect: 3 } }, { fatigue: 3 }, { conf: 1 }] },
        { weight: 1, text: `{kid.first} hears it as a leash and goes anyway, a bit colder than {kid.they} meant to.`, effects: [{ clearFlag: 'nc_mentee_taught' }, { rel: { who: 'kid', trust: -6, respect: -3 } }, { conf: -2 }] } ] },
      { id: 'angle', label: 'Turn the departure into a feud for TV', risk: 'high', result: `The office loves it and the crowd boos the correct person. {kid.first} agrees to the plan with a small, careful nod that has a lot of feeling in it.`, effects: [{ clearFlag: 'nc_mentee_taught' }, { rivalry: { who: 'kid', heat: 15 } }, { pop: 0.9 }, { rel: { who: 'kid', heat: 6, trust: -3 } }] },
      { id: 'quiet', label: 'Wish {kid.them} well and leave it at that', risk: 'low', result: `You shake hands and say it was a pleasure. It feels stiffer than it should, as if you had both expected more.`, effects: [{ clearFlag: 'nc_mentee_taught' }, { rel: { who: 'kid', respect: 2 } }, { conf: -1 }] },
    ],
  },
  {
    id: 'nc_men_vet_nod', category: 'mentor', title: 'A Nod from the Back of the Room', weight: 3, cooldownDays: 150, maxPerCareer: 2,
    trigger: { mem: [{ role: 'vet', respectGte: 25 }], noFlag: 'nc_vet_taught' },
    cast: { vet: { pick: 'tag', tag: 'respected_by' } }, memory: { role: 'vet', max: 2 },
    slots: { gesture: [`a single slow nod across the catering room`, `a firm handshake and no words`, `a pat on the arm in the tunnel`, `a quiet two-word compliment`], offer: [`a regular lunch to talk shop`, `an invitation to ride along on the next road trip`, `a standing seat in {vet.their} private film room`, `a seat at {vet.their} table at the weekly dinner`] },
    body: [`The veteran {vet.name} is not known for praise. Today {vet.first} gives you {gesture} and, a minute later, adds an offer: {offer}.`, `People in this room would kill for this. You can feel the stares on your back and the weight of an invitation that has not been extended in years.`],
    choices: [
      { id: 'accept', label: 'Accept at once and ask what is expected', risk: 'low', result: `"Show up. Work hard. Ask good questions," {vet.first} says, and that is all. For months, the lunches are the best education available anywhere.`, effects: [{ flag: 'nc_vet_taught' }, { tag: { who: 'vet', tag: 'mentor' } }, { rel: { who: 'vet', trust: 8, respect: 6, affinity: 4 } }, { fatigue: 3 }, { conf: 2 }] },
      { id: 'slow', label: 'Ask for a few weeks to decide', risk: 'low', result: `{vet.first} shrugs. "Exactly the kind of person who asks," {vet.first} says. The offer stays open, and so does the quiet admiration.`, effects: [{ rel: { who: 'vet', respect: 3, trust: 2 } }, { conf: 1 }] },
      { id: 'lean', label: 'Trade on the praise in the dressing room', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `You let it slip in a casual voice, and the room does the rest. The veteran hears the whisper and decides to be amused rather than offended.`, effects: [{ pop: 0.5 }, { conf: 2 }, { rel: { who: 'vet', respect: -2 } }] },
        { weight: 1, text: `The veteran hears you using {vet.their} nod as currency, and the offer is withdrawn without explanation. You are left holding a small, cold embarrassment.`, effects: [{ rel: { who: 'vet', respect: -8, trust: -6 } }, { conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'decline', label: 'Decline politely: you want to find your own way', risk: 'med', result: `The veteran nods again, a different nod. It is respect for the refusal, and also the end of the conversation.`, effects: [{ rel: { who: 'vet', respect: 2, trust: -1 } }, { conf: 2 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'nc_men_last_match', category: 'mentor', title: '{mentor.name} Asks for a Final Favor', weight: 4, cooldownDays: 250, maxPerCareer: 1, major: true,
    trigger: { stat: { careerYears: { gte: 4 } }, mem: [{ role: 'mentor', trustGte: 25 }] },
    cast: { mentor: { pick: 'tag', tag: 'mentor' }, agent: { pick: 'staff', role: 'agent' } }, memory: { role: 'mentor', max: 3 },
    slots: { ask: [`to lose to {mentor.them} clean in {mentor.their} last match`, `to work a long, slow, old-fashioned match to the finish`, `to put on {mentor.their} gear for the entrance and carry {mentor.their} music`, `to let {mentor.them} have the last word on the microphone`], reason: [`the knees are gone`, `the doctors have finally put it in writing`, `the phone has stopped ringing`, `{mentor.first} is tired in a way sleep does not touch`] },
    body: [`{mentor.name} asks you to dinner and does not touch the menu. {mentor.first} wants one last match, and wants you {ask}, since {reason}.`, `It is not a small thing to ask, and it is the only favor ever asked of you. {agent.name} already knows, and is waiting to see what you say.`],
    choices: [
      { id: 'yes', label: 'Say yes and put {mentor.them} over completely', risk: 'low', result: `The match is slow, beautiful, and a little sad. When it ends, the building rises with {mentor.them}. "Thank you," {mentor.first} says into your shoulder, and you stay on the mat a long moment, smiling at the lights.`, effects: [{ pop: 0.3 }, { rel: { who: 'mentor', trust: 10, respect: 8, affinity: 10 } }, { conf: 2 }, { fatigue: 5 }] },
      { id: 'bargain', label: 'Say yes if you get a say in how it plays', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3, overall: 0.3 }, text: `The match you build together is better than either of the originals. {mentor.first} cries a little and denies it, and the fans never forget it.`, effects: [{ pop: 0.9 }, { rel: { who: 'mentor', trust: 7, respect: 7 } }, { fatigue: 7 }] },
        { weight: 1, text: `{mentor.first} bristles at being managed in {mentor.their} own farewell. The match goes ahead, but the warmth is uneven.`, effects: [{ pop: 0.2 }, { rel: { who: 'mentor', trust: -3, respect: 2 } }, { fatigue: 5 }] } ] },
      { id: 'decline', label: 'Turn it down: the timing is wrong for your career', risk: 'high', result: `You explain, clumsily, that the timing is wrong. {mentor.first} says that is fine, and means it badly, and your dinner stays unfinished.`, effects: [{ rel: { who: 'mentor', trust: -10, respect: -6, affinity: -6 } }, { conf: 1 }, { pop: 0.2 }] },
      { id: 'tell_office', label: 'Pass it to the office and let them decide', risk: 'low', result: `The office loves the idea and books it in a hurry. The match is fine, and {mentor.first} feels more like a line item than a legend.`, effects: [{ rel: { who: 'mentor', trust: -3, affinity: -2 } }, { money: 3000 }, { pop: 0.3 }] },
    ],
  },
];
