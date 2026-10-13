// Relationship scenarios: rivalry, betrayal, alliance, faction, mentor and backstage politics.
// Many scenes depend on ledger history (mem triggers, memory blocks) and on flags set by earlier scenes.
export default [
  // ===================================================================== RIVALRY
  {
    id: 'riv_truce_offer', category: 'rivalry', title: '{rival.name} Wants a Truce', weight: 2, cooldownDays: 90, maxPerCareer: 2,
    trigger: { rivalry: { minHeat: 25 } }, cast: { rival: { pick: 'rivalry', minHeat: 25 } }, memory: { role: 'rival', max: 2 },
    slots: { spot: [`the catering room`, `the loading dock`, `a quiet stretch of arena corridor`, `the hotel gym`], reason: [`the office keeps splitting your bookings to keep you apart`, `a sponsor wants you both in one photo`, `the new producer is tired of refereeing the hallway`, `the crowd is getting bored of the same fight`] },
    body: [`{rival.name} catches you in {spot} with open hands and nobody else around. "Truce," {rival.they} says. "At least until the next big show, because {reason}."`, `You cannot tell whether {rival.they} means it. Backing off would calm the room, but a feud this hot is also paying your bills.`],
    choices: [
      { id: 'accept', label: 'Shake on a quiet truce', risk: 'low', result: `The handshake is short and dry. For the first time in weeks the hallway stops going silent when you walk in.`, effects: [{ rivalry: { who: 'rival', heat: -12 } }, { rel: { who: 'rival', heat: -10, trust: 4 } }, { pop: -0.3 }, { conf: 1 }] },
      { id: 'private', label: 'Agree, but only in private', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `The deal holds. {rival.first} keeps quiet and the rumour mill gets nothing to chew on.`, effects: [{ rivalry: { who: 'rival', heat: -8 } }, { rel: { who: 'rival', respect: 4, trust: 3 } }] },
        { weight: 1, text: `Someone saw you two talking. By evening everyone says you went soft, and {rival.first} does nothing to correct it.`, effects: [{ pop: -0.5 }, { conf: -3 }, { rel: { who: 'rival', respect: -3 } }] } ] },
      { id: 'refuse', label: 'Refuse and keep the fire burning', risk: 'med', result: `"Not a chance," you say. {rival.first} nods slowly, like that was the answer {rival.they} expected. The feud stays hot, and so does the money.`, effects: [{ rivalry: { who: 'rival', heat: 8 } }, { rel: { who: 'rival', heat: 8, respect: 2 } }, { pop: 0.5 }, { fatigue: 3 }] },
      { id: 'ambush', label: 'Fake the truce and ambush at the show', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `{rival.first} lowers {rival.their} guard on live television and you make the most of it. The crowd comes unglued.`, effects: [{ pop: 1.1 }, { rivalry: { who: 'rival', heat: 14 } }, { rel: { who: 'rival', trust: -8, heat: 12 } }] },
        { weight: 1, text: `{rival.first} saw it coming and the agents have words for you after the segment. You look petty, not clever.`, effects: [{ pop: -0.4 }, { conf: -3 }, { rivalry: { who: 'rival', heat: 8 } }] } ] },
    ],
  },
  {
    id: 'riv_step_aside', category: 'rivalry', title: 'Step Aside, Says {rival.name}', weight: 2, cooldownDays: 100, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 30 } }, eventWithin: { kind: 'ple', days: 45 } }, cast: { rival: { pick: 'rivalry', minHeat: 20 } }, memory: { role: 'rival', max: 1 },
    slots: { offer: [`a favour you can cash in later`, `an envelope with real money in it`, `a spot on the better house shows`, `nothing but a hard stare`], deadline: [`by Friday`, `before the card is finalized`, `before tonight's show`, `before the contracts go out`] },
    body: [`The word in the back is that the office is weighing you for a big spot at the next premium event, and {rival.name} wants the same slot. {rival.first} is offering {offer} if you tell management you are not ready.`, `{rival.first} wants an answer {deadline}. Saying yes would be easy, and so would regretting it.`],
    choices: [
      { id: 'sell', label: 'Step aside and take the offer', risk: 'low', result: `You tell the office you would like more time. {rival.first} keeps the promise, and you carry the knowledge that you sold a slot.`, effects: [{ money: 12000 }, { conf: -6 }, { pop: -0.4 }, { rel: { who: 'rival', respect: -6, fear: -3 } }] },
      { id: 'tell', label: 'Refuse and tell the office what was offered', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: `Management respects the honesty and quietly files it away. {rival.first} learns who told, and does not forgive it.`, effects: [{ pop: 0.4 }, { conf: 3 }, { rel: { who: 'rival', heat: 12 } }, { rivalry: { who: 'rival', heat: 8 } }] },
        { weight: 1, text: `The office shrugs. "Handle it yourselves," says the producer, and {rival.first} hears about your tattling anyway.`, effects: [{ rel: { who: 'rival', heat: 14, respect: -3 } }, { conf: -2 }] } ] },
      { id: 'settle', label: 'Counter: settle it in the ring', risk: 'high', result: `You tell {rival.first} the slot goes to whoever wins. By Monday it is on the sheet, and a promise is on the record.`, effects: [{ booking: { who: 'rival', type: 'singles' } }, { promise: { kind: 'win_match', who: 'rival', text: `I will beat {rival.name} and earn that spot`, deadlineDays: 45 } }, { rel: { who: 'rival', heat: 6, respect: 3 } }, { pop: 0.3 }, { fatigue: 4 }] },
      { id: 'stall', label: 'Stall and keep both doors open', risk: 'low', result: `You promise to think about it, then avoid {rival.first} for three days. Nobody is satisfied, but nobody is hurt.`, effects: [{ rel: { who: 'rival', respect: -2, trust: -2 } }, { conf: -1 }] },
    ],
  },
  {
    id: 'riv_hard_match_respect', category: 'rivalry', title: 'After the War with {rival.name}', weight: 3, cooldownDays: 60, maxPerCareer: 4, contexts: ['post_match'],
    trigger: { mem: [{ role: 'rival', h2h: { matchesGte: 2 } }] }, cast: { rival: { pick: 'rivalry', minHeat: 15 } }, memory: { role: 'rival', max: 2 },
    slots: { setting: [`the gorilla position`, `the back of the ring truck`, `the trainers' room`, `the tunnel`], gesture: [`holds out a taped hand`, `offers you a towel without a word`, `nods once from across the room`, `pulls you into a short, hard hug`] },
    body: [`The towels are bloody and the ribs are screaming. In {setting}, {rival.name} {gesture}, and the whole crew pretends not to see it.`, `Two people who have spent months trying to hurt each other just made something that the fans will remember. Whether you let it show is up to you.`],
    choices: [
      { id: 'respect', label: 'Return the respect, openly', risk: 'low', result: `You say it plainly: that was the best work either of you has done. {rival.first} nods and the tension in the room drops.`, effects: [{ rel: { who: 'rival', respect: 8, trust: 4, heat: -8 }  }, { tag: { who: 'rival', tag: 'respected_by' } }, { pop: 0.2 }, { rivalry: { who: 'rival', heat: -6 } }] },
      { id: 'stay_cold', label: 'Stay cold: the feud is not over', risk: 'med', result: `You take the towel and say nothing. The feud keeps its edge, and the next match will carry it.`, effects: [{ rivalry: { who: 'rival', heat: 6 } }, { rel: { who: 'rival', respect: 3, heat: 3 } }, { conf: 2 }] },
      { id: 'ask_more', label: 'Ask for a rematch on bigger terms', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{rival.first} grins through the swelling. "Name it." The office will love the pitch.`, effects: [{ booking: { who: 'rival', type: 'no_dq' } }, { pop: 0.5 }, { rivalry: { who: 'rival', heat: 8 } }, { fatigue: 5 }] },
        { weight: 1, text: `"Let me walk first," {rival.first} says, wincing. You pushed too fast and the moment is gone.`, effects: [{ rel: { who: 'rival', respect: -2 } }, { conf: -1 }] } ] },
      { id: 'leave', label: 'Slip out and ice the injuries alone', risk: 'low', result: `You keep it private. Nobody can say you needed anyone, and nobody knows you wanted to say something.`, effects: [{ fatigue: -3 }, { conf: 1 }, { rel: { who: 'rival', respect: -1 } }] },
    ],
  },
  {
    id: 'riv_escalation_vow', category: 'rivalry', title: 'The Feud Needs an Ending', weight: 2, cooldownDays: 80, maxPerCareer: 3,
    trigger: { rivalry: { minHeat: 35 } }, cast: { rival: { pick: 'rivalry', minHeat: 35 }, agent: { pick: 'staff', role: 'agent' } }, memory: { role: 'rival', max: 2 },
    slots: { crowd: [`a sold-out arena`, `a loud house show crowd`, `a half-empty building that still wants blood`, `a hometown crowd`], stake: [`a stipulation neither of you can back out of`, `a public promise on the microphone`, `a signed contract on the announce table`] },
    body: [`{agent.name} calls you aside. "You and {rival.name} have the hottest thing we have right now, and it needs a finish." In front of {crowd}, the office wants you to put your name on {stake}.`, `{rival.first} has already said yes. The only question is how far you want to take it.`],
    choices: [
      { id: 'win_vow', label: 'Promise to beat them, loudly', risk: 'med', result: `You say it into the microphone and mean it. The crowd roars. If you lose, it will be remembered, too.`, effects: [{ promise: { kind: 'win_match', who: 'rival', text: `I will beat {rival.name} when it counts`, deadlineDays: 60 } }, { pop: 0.7 }, { conf: 3 }, { rivalry: { who: 'rival', heat: 8 } }] },
      { id: 'cage', label: 'Ask for a steel cage', risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.3, confidence: 0.3 }, text: `Management approves. The cage match sells itself, and your name goes up on the poster beside {rival.first}'s.`, effects: [{ booking: { who: 'rival', type: 'cage' } }, { pop: 0.9 }, { fatigue: 8 }, { rivalry: { who: 'rival', heat: 8 } }] },
        { weight: 1, text: `The office says no and takes it as proof you are getting greedy. You will wait for another card.`, effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'business', label: 'Keep it simple: a clean singles match', risk: 'low', result: `"No gimmicks," you tell the agent. The match goes into the sheet and everyone relaxes.`, effects: [{ booking: { who: 'rival', type: 'singles' } }, { rel: { who: 'rival', respect: 3 } }, { pop: 0.2 }] },
      { id: 'drag', label: 'Drag it out another month', risk: 'med', result: `The agent frowns, but the payoff will be bigger if the crowd waits. {rival.first} does not like being held up.`, effects: [{ rivalry: { who: 'rival', heat: 6 } }, { rel: { who: 'rival', heat: 6 } }, { money: 3000 }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'riv_old_rival_peace', category: 'rivalry', title: 'Making Peace with {rival.name}', weight: 2, cooldownDays: 120, maxPerCareer: 2,
    trigger: { rivalry: { minHeat: 15 }, stat: { careerYears: { gte: 1 } } }, cast: { rival: { pick: 'rivalry', minHeat: 15 } }, memory: { role: 'rival', max: 2 },
    slots: { place: [`a hospital waiting room`, `an airport gate at 5 a.m.`, `a diner two hours from the arena`, `the empty ring before doors`], news: [`a mutual friend's retirement`, `a bad night of injuries on the card`, `the first anniversary of your first match`, `a long delay that stranded the whole roster`] },
    body: [`You and {rival.name} wind up alone in {place}, thrown together by {news}. For a minute, neither of you says anything.`, `Then {rival.first} speaks first. "I am tired of hating you. Are you?" It is not clear if this is an olive branch or a trap.`],
    choices: [
      { id: 'forgive', label: 'Put the feud down for good', risk: 'low', result: `It is a quiet scene. You trade stories until the airport lights come up. By morning, the feud is a memory.`, effects: [{ event: { type: 'reconciliation', participants: ['rival'], summary: `Made peace with {rival.name} after a long feud.`, data: { formerRival: true } } }, { rivalry: { who: 'rival', heat: -20 } }, { pop: -0.3 }, { conf: 2 }] },
      { id: 'cautious', label: 'Call a ceasefire, not a peace', risk: 'low', result: `You agree not to bring it up for now. It is a small, safe thing, and exactly as satisfying as it sounds.`, effects: [{ rivalry: { who: 'rival', heat: -8 } }, { rel: { who: 'rival', trust: 3, heat: -6 } }] },
      { id: 'test', label: 'Ask what the angle is', risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.3 }, text: `{rival.first} laughs, honestly. "No angle." It breaks the ice, and the two of you talk for an hour.`, effects: [{ rel: { who: 'rival', respect: 5, trust: 5, heat: -10 } }, { tag: { who: 'rival', tag: 'reconciled' } }] },
        { weight: 1, text: `The question lands wrong. {rival.first} stands up without a word, and the fire comes back hotter than before.`, effects: [{ rivalry: { who: 'rival', heat: 10 } }, { rel: { who: 'rival', heat: 8, trust: -4 } }, { conf: -2 }] } ] },
      { id: 'keep_feud', label: 'Walk away: the money is in the war', risk: 'med', result: `"Nice try," you say. The feud is worth more to both of you than a pleasant afternoon, and you both know it.`, effects: [{ pop: 0.3 }, { rivalry: { who: 'rival', heat: 6 } }, { rel: { who: 'rival', respect: 2, heat: 4 } }] },
    ],
  },
  {
    id: 'riv_ring_accident', category: 'rivalry', title: 'Something Went Wrong with {opp.name}', weight: 2, cooldownDays: 90, maxPerCareer: 3, contexts: ['post_match'],
    trigger: { daysSince: { match: { lte: 1 } } }, cast: { opp: { pick: 'roster', sameBrand: true } },
    slots: { move: [`a missed dive`, `a botched powerbomb`, `a chair shot that landed higher than planned`, `a slip off the second rope`], aftermath: [`is being helped to the back by two trainers`, `is sitting on the apron holding {opp.their} neck`, `has gone very quiet in the trainers' room`, `is being checked by the doctor, who will not say a word`] },
    body: [`{move} ended the match early, and {opp.name} {aftermath}. You know exactly what you did, and you also know the replay will make it look worse.`, `The agent asks what happened. Everybody in the building is watching your face for the answer.`],
    choices: [
      { id: 'visit', label: 'Go check on them, in front of everyone', risk: 'low', result: `You walk into the trainers' room with your head down. {opp.first} gives a small nod. It is the right thing, and costs you the rest of the night.`, effects: [{ rel: { who: 'opp', respect: 6, trust: 5, heat: -4 } }, { fatigue: 4 }, { conf: -1 }] },
      { id: 'own_it', label: 'Take the blame in front of the agent', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `Management values the honesty. The incident is filed as an accident, and your name is clean.`, effects: [{ pop: 0.2 }, { rel: { who: 'opp', respect: 4, trust: 3 } }, { conf: 1 }] },
        { weight: 1, text: `It goes badly. The report names you, and for two weeks people check the knots in your boot laces when you walk by.`, effects: [{ pop: -0.5 }, { conf: -4 }, { rel: { who: 'opp', respect: 2 } }] } ] },
      { id: 'blame_gear', label: 'Blame the ring and stay quiet about the rest', risk: 'med', result: `The ring crew gets the lecture instead of you. Nobody can prove otherwise, but {opp.first} knows what really happened.`, effects: [{ conf: 2 }, { rel: { who: 'opp', trust: -6, respect: -3 } }, { tag: { who: 'opp', tag: 'reluctant' } }] },
      { id: 'sell_it', label: 'Use it: call it a heel moment', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: `You play the cold villain on camera. The audience eats it up, and the office loves the heat.`, effects: [{ pop: 0.9 }, { rel: { who: 'opp', heat: 14, respect: -4 } }, { rivalry: { who: 'opp', heat: 12 } }] },
        { weight: 2, text: `It reads as callous. The injured wrestler's friends do not forget it, and the fans do not forgive it.`, effects: [{ pop: -0.8 }, { conf: -3 }, { rel: { who: 'opp', heat: 12, respect: -6 } }] } ] },
    ],
  },
  {
    id: 'riv_mind_games', category: 'rivalry', title: 'Mind Games Before the Big Night', weight: 2, cooldownDays: 70, maxPerCareer: 3, contexts: ['pre_show', 'show_day', 'weekly'],
    trigger: { rivalry: { minHeat: 25 }, eventWithin: { kind: 'ple', days: 10 } }, cast: { rival: { pick: 'rivalry', minHeat: 25 } },
    slots: { stunt: [`taped a photo of your last loss inside your locker`, `moved your bags to the cold end of the hall`, `told the whole catering line you are limping`, `left a pair of knee pads wrapped as a gift on your bench`], bait: [`You were in a perfectly good mood this morning.`, `You had planned a quiet pre-show meal.`, `Your gear bag was already packed and zipped.`, `You had just started to feel loose.`] },
    body: [`{rival.name} has been working on you since the arena doors opened. First {rival.they} {stunt}, and the whole locker room is waiting to see what you do. {bait}`, `It is a bad idea to react, and a worse idea to look like you did not notice.`],
    choices: [
      { id: 'ignore', label: 'Ignore it and keep your head down', risk: 'low', result: `You warm up in silence. {rival.first} does not get the reaction, and you get a better night than you expected.`, effects: [{ conf: 3 }, { fatigue: -2 }, { rel: { who: 'rival', respect: 2 } }] },
      { id: 'mirror', label: 'Return the favour, harder', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `Your counter is cruel and funny, and the whole hallway repeats it by midnight. {rival.first} stops grinning.`, effects: [{ pop: 0.5 }, { conf: 3 }, { rivalry: { who: 'rival', heat: 8 } }] },
        { weight: 1, text: `It lands wrong and the producer drags you both into the hallway. You look like the instigator.`, effects: [{ pop: -0.4 }, { conf: -3 }, { fatigue: 3 }, { rel: { who: 'rival', heat: 8 } }] } ] },
      { id: 'laugh', label: 'Laugh it off in front of the crew', risk: 'med', result: `You make a joke of it, and the crew laughs with you. The sting wears off, though you stay on edge for the main event.`, effects: [{ conf: 1 }, { pop: 0.2 }, { fatigue: 2 }] },
      { id: 'report', label: 'Report it to the producer', risk: 'low', result: `The producer promises to talk to {rival.first}. You win the argument and lose some of the hallway's respect.`, effects: [{ conf: 2 }, { pop: -0.2 }, { rel: { who: 'rival', respect: -3, heat: 4 } }] },
    ],
  },
  {
    id: 'riv_card_position', category: 'rivalry', title: 'The Spot on the Card', weight: 2, cooldownDays: 60, maxPerCareer: 3,
    trigger: { stat: { popularity: { gte: 25 } } }, cast: { rival: { pick: 'rivalry', minHeat: 15 }, agent: { pick: 'staff', role: 'agent' } },
    slots: { slot: [`opening the show`, `closing the first hour`, `the semi-main`, `the last match before intermission`], reason: [`a ratings dip`, `a sponsor request`, `a hot angle`, `a last-minute injury`] },
    body: [`{agent.name} has the running order and a problem: because of {reason}, only one of you can have the spot {slot}. {rival.name} has already walked into the office to argue for it.`, `If you take it, you are the one in the light tonight. If you give it up, there will be a favour owed, one way or the other.`],
    choices: [
      { id: 'fight', label: 'Fight for the spot with the agent', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.4, charisma: 0.3 }, text: `You make a clean case and {agent.name} gives you the slot. {rival.first} stalks out of the office.`, effects: [{ pop: 0.5 }, { rel: { who: 'rival', heat: 8, respect: -2 } }, { conf: 2 }] },
        { weight: 1, text: `{agent.name} sides with {rival.first} and tells you your pitch was loud but empty.`, effects: [{ conf: -3 }, { rel: { who: 'rival', respect: 3 } }, { pop: -0.2 }] } ] },
      { id: 'give', label: 'Give the spot, ask for a favour back', risk: 'low', result: `You let {rival.first} have it. The agent notes that you are easy to work with, and {rival.first} knows exactly how much it cost.`, effects: [{ rel: { who: 'rival', respect: 5, trust: 4, heat: -6 } }, { conf: -1 }, { pop: -0.2 }, { money: 2000 }] },
      { id: 'split', label: 'Suggest a spot swap next week', risk: 'low', result: `A compromise the agent can live with. Neither of you is thrilled, but the show goes on.`, effects: [{ rel: { who: 'rival', heat: -3 } }, { conf: 1 }] },
      { id: 'sabotage_slot', label: 'Leak that your rival is nursing an injury', risk: 'high', result: `The agent pulls {rival.first} off the spot and gives it to you. When {rival.they} finds out who talked, it will not stay quiet.`, effects: [{ pop: 0.4 }, { conf: 1 }, { rel: { who: 'rival', heat: 14, trust: -10 } }, { rivalry: { who: 'rival', heat: 12 } }, { obligation: { kind: 'confront_backstage', who: 'rival', inDays: 6 } }] },
    ],
  },
  {
    id: 'riv_champ_deal', category: 'rivalry', title: 'A Deal from the Champion', weight: 2, cooldownDays: 100, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 40 }, overall: { gte: 55 } }, holdsTitle: false }, cast: { champ: { pick: 'champion', class: 'world' } },
    slots: { venue: [`the champion's private locker room`, `a rented office behind the arena`, `the production truck`, `a hotel suite`], price: [`a clean loss in your first match`, `a future favour on a night of the champion's choosing`, `a slice of your merchandise income`] },
    body: [`{champ.name} invites you to {venue} and gets straight to it. "You are on your way up, and I can open the door. In return, I want {price}."`, `It is a straightforward business offer from the most powerful person on the roster. You can also hear what it says about what {champ.they} thinks of you.`],
    choices: [
      { id: 'take', label: 'Take the deal', risk: 'med', result: `You shake on it. The door does open, but you owe now, and {champ.first} reminds you with a look every time you meet.`, effects: [{ pop: 0.8 }, { money: 8000 }, { conf: -2 }, { rel: { who: 'champ', trust: -3, respect: 2 } }, { flag: 'owes_champion' }] },
      { id: 'decline', label: 'Decline: you will earn it', risk: 'low', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: `{champ.first} studies you for a long moment, then nods. "Good. Then earn it." You feel taller walking out.`, effects: [{ conf: 5 }, { rel: { who: 'champ', respect: 6 } }, { pop: 0.2 }] },
        { weight: 1, text: `{champ.first} shrugs. "Your loss." The door closes, and for a month the schedule feels colder.`, effects: [{ rel: { who: 'champ', respect: -2, heat: 4 } }, { conf: 1 }, { pop: -0.2 }] } ] },
      { id: 'bargain', label: 'Counter-offer: a rematch instead', risk: 'med', result: `Surprised, {champ.first} agrees to a conditional rematch if you can win something first. You walk away with a promise, not a handshake.`, effects: [{ promise: { kind: 'win_match', who: 'champ', text: `I will beat {champ.name} on my terms`, deadlineDays: 90 } }, { rel: { who: 'champ', respect: 3, heat: 4 } }, { conf: 2 }] },
      { id: 'leak', label: 'Walk out and tell the locker room', risk: 'high', result: `The story is all over the roster by midnight. Management is embarrassed and the champion is furious. Some of the veterans quietly like you for it.`, effects: [{ pop: 0.5 }, { rel: { who: 'champ', heat: 16, respect: -3 } }, { rivalry: { who: 'champ', heat: 12 } }, { conf: 2 }] },
    ],
  },
  {
    id: 'riv_cocky_prospect', category: 'rivalry', title: 'The Rookie Who Will Not Back Down', weight: 2, cooldownDays: 70, maxPerCareer: 3,
    trigger: { stat: { overall: { gte: 50 } } }, cast: { kid: { pick: 'roster', tier: { lte: 1 }, sameBrand: true } },
    slots: { trigger_line: [`told a podcast host that you are living off old moves`, `kept calling you by the wrong name in the locker room`, `pinned a photo of you with a clown nose on the board`, `interrupted your warm-up to ask for a match`], witness: [`a table of veterans`, `the entire production crew`, `three NXT hopefuls`, `an agent who is also watching`] },
    body: [`{kid.name} has been loud lately. Today {kid.they} {trigger_line} in front of {witness}, and now the room is waiting to see what you do.`, `You have two options: crush the kid or help the kid. Neither one will be forgotten.`],
    choices: [
      { id: 'humble', label: 'Put the rookie in their place, quietly', risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `You say four calm sentences and {kid.first} goes pale. The room breathes out.`, effects: [{ conf: 3 }, { rel: { who: 'kid', fear: 6, respect: 3, heat: 4 } }] },
        { weight: 1, text: `The kid says something worse in return. You walk away angry and the room decides the rookie got the better of you.`, effects: [{ conf: -3 }, { pop: -0.2 }, { rel: { who: 'kid', heat: 8 } }] } ] },
      { id: 'teach', label: 'Offer to show the kid how it is done', risk: 'low', result: `You take {kid.first} to the ring for ten minutes. The kid learns more than expected, and so do you.`, effects: [{ rel: { who: 'kid', respect: 8, trust: 5 } }, { fatigue: 4 }, { pop: 0.2 }, { tag: { who: 'kid', tag: 'studying_you' } }] },
      { id: 'match', label: 'Book a match and make an example', risk: 'high', result: `You tell the agent you want {kid.first} on the next card. The office sees dollar signs; the kid sees a target.`, effects: [{ booking: { who: 'kid', type: 'singles' } }, { rivalry: { who: 'kid', heat: 14 } }, { pop: 0.3 }, { fatigue: 4 }] },
      { id: 'laugh_off', label: 'Laugh it off and keep walking', risk: 'low', result: `You grin, shrug and leave. {kid.first} stays loud, and the veterans notice that you did not rise to it.`, effects: [{ conf: 1 }, { rel: { who: 'kid', respect: -1 } }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'riv_legend_grudge', category: 'rivalry', title: 'The Legend Who Dislikes You', weight: 2, cooldownDays: 120, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 35 }, careerYears: { gte: 1 } } }, cast: { legend: { pick: 'roster', tier: { gte: 3 }, sameBrand: true } },
    slots: { slight: [`thinks you skipped too many steps`, `disliked how you handled a jobber the other night`, `heard you complain about a spot`, `just does not like your style`], arena: [`in the ring after the show`, `in the middle of catering`, `at a hotel breakfast`, `outside the Gorilla position`] },
    body: [`{legend.name} stops you {arena}. The veteran {slight}, and says so in a voice that carries well beyond the two of you.`, `There is history in this room that you were not a part of. {legend.first} is waiting for a response, and so is everyone else.`],
    choices: [
      { id: 'listen', label: 'Listen and ask what you should change', risk: 'low', outcomes: [
        { weight: 2, bonus: { overall: 0.3, charisma: 0.3 }, text: `{legend.first} is thrown by the humility, then gives you a real answer. You walk away with a list and a half-friend.`, effects: [{ rel: { who: 'legend', respect: 6, trust: 4, heat: -6 } }, { attr: { name: 'psychology', delta: 1 } }, { conf: -1 }] },
        { weight: 1, text: `{legend.first} treats it as weakness and lectures you for ten minutes with an audience.`, effects: [{ conf: -4 }, { pop: -0.2 }, { rel: { who: 'legend', respect: -1 } }] } ] },
      { id: 'push_back', label: 'Push back politely but firmly', risk: 'med', result: `You make your case without raising your voice. {legend.first} does not agree, but some of the locker room does.`, effects: [{ conf: 3 }, { rel: { who: 'legend', respect: 1, heat: 6 } }, { pop: 0.2 }] },
      { id: 'prove', label: 'Challenge them to prove it in the ring', risk: 'high', result: `The old man smiles for the first time. The office is delighted and the match is made.`, effects: [{ booking: { who: 'legend', type: 'singles' } }, { rivalry: { who: 'legend', heat: 16 } }, { pop: 0.8 }, { fatigue: 5 }] },
      { id: 'avoid', label: 'Avoid them and stay out of the way', risk: 'low', result: `It works for a while. {legend.first} takes it as proof that you have no answer.`, effects: [{ rel: { who: 'legend', respect: -4 } }, { conf: -2 }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'riv_loss_gloat', category: 'rivalry', title: '{rival.name} Gloats After the Loss', weight: 3, cooldownDays: 45, maxPerCareer: 4, contexts: ['post_match', 'weekly'],
    trigger: { recent: { lossesGte: 1 }, daysSince: { match: { lte: 3 } } }, cast: { rival: { pick: 'rivalry', minHeat: 15 } }, memory: { role: 'rival', max: 2 },
    slots: { how: [`leaving a tube of hand cream in your bag`, `holding an imaginary microphone`, `clapping slowly from the monitor`, `sending a mocking note on the catering menu`], audience: [`a crowd of crew members`, `two agents`, `three younger wrestlers`, `an interviewer with a camera`] },
    body: [`The loss still stings, and {rival.name} cannot leave it alone. {rival.first} is enjoying it by {how} in front of {audience}.`, `You can respond now, or turn it into fuel. Anything you say will travel.`],
    choices: [
      { id: 'cut_down', label: 'Cut {rival.first} down with one line', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.7 }, text: `Your line is quoted for days. The gloat dies on {rival.first}'s face.`, effects: [{ pop: 0.6 }, { conf: 3 }, { rivalry: { who: 'rival', heat: 8 } }] },
        { weight: 1, text: `The line misses by a mile. {rival.first} grins wider.`, effects: [{ conf: -3 }, { pop: -0.3 }] } ] },
      { id: 'swallow', label: 'Swallow it and demand a rematch', risk: 'low', result: `You keep your voice level and ask the office for another shot. {rival.first} loses the grin.`, effects: [{ obligation: { kind: 'grudge_rematch', who: 'rival', inDays: 7 } }, { conf: 1 }, { rel: { who: 'rival', respect: 2 } }] },
      { id: 'shove', label: 'Shove {rival.first} in front of everyone', risk: 'high', result: `The shove brings the locker room to its feet. Refs separate you, and the fans will hear of it by morning.`, effects: [{ rivalry: { who: 'rival', heat: 14 } }, { rel: { who: 'rival', heat: 12 } }, { pop: 0.6 }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'leave_it', label: 'Leave without a word', risk: 'low', result: `You pack your bag and go. It stings less than being seen to react, but not much.`, effects: [{ conf: -2 }, { rel: { who: 'rival', respect: -2 } }] },
    ],
  },
  {
    id: 'riv_forced_team', category: 'rivalry', title: 'Forced to Team with {rival.name}', weight: 2, cooldownDays: 100, maxPerCareer: 2,
    trigger: { rivalry: { minHeat: 20 } }, cast: { rival: { pick: 'rivalry', minHeat: 20 }, creative: { pick: 'staff', role: 'creative' } }, memory: { role: 'rival', max: 1 },
    slots: { reason: [`a missing partner`, `a sponsor appearance`, `a ratings experiment`, `a tag title scramble`], tone: [`as a joke`, `with a straight face`, `as a "big announcement"`] },
    body: [`{creative.name} presents the plan {tone}: you and {rival.name} will team up for the next show because of {reason}. The office thinks the tension will sell tickets.`, `Nobody asked you. You can fight it, run with it, or turn it into something else.`],
    choices: [
      { id: 'embrace', label: 'Embrace it and play it straight', risk: 'low', result: `You go along, and the first week is awkward. By the second, you can actually work with each other.`, effects: [{ booking: { who: 'rival', type: 'tag' } }, { rel: { who: 'rival', trust: 4, respect: 4, heat: -8 } }, { pop: 0.3 }] },
      { id: 'sabotage', label: 'Make it fall apart on purpose', risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `A perfectly timed miscue sends it sideways and the crowd loves the chaos. The office is thrilled.`, effects: [{ booking: { who: 'rival', type: 'tag' } }, { pop: 0.9 }, { rivalry: { who: 'rival', heat: 10 } }] },
        { weight: 1, text: `It looks like a real mistake and the producer is furious. You lose a spot next week.`, effects: [{ pop: -0.5 }, { conf: -3 }, { rel: { who: 'rival', heat: 8 } }] } ] },
      { id: 'refuse', label: 'Refuse to team with them', risk: 'med', result: `You dig in. {creative.name} files a note about your attitude, but nobody forces the issue.`, effects: [{ conf: 2 }, { pop: -0.4 }, { rel: { who: 'rival', respect: 2 } }, { money: -2000 }] },
      { id: 'twist', label: 'Pitch a betrayal for the finish', risk: 'med', result: `{creative.name} grins, because that is exactly where the story was heading. You will have to deliver it, and so will the rival.`, effects: [{ booking: { who: 'rival', type: 'tag' } }, { rel: { who: 'rival', heat: 6 } }, { pop: 0.4 }, { flag: 'planned_turn' }] },
    ],
  },
  {
    id: 'riv_apology_trap', category: 'rivalry', title: 'Is {rival.name} Sorry, or Setting a Trap?', weight: 2, cooldownDays: 90, maxPerCareer: 2,
    trigger: { rivalry: { minHeat: 30 } }, cast: { rival: { pick: 'rivalry', minHeat: 30 } }, memory: { role: 'rival', max: 2 },
    slots: { how: [`a handwritten note`, `a long voicemail`, `a face-to-face in the parking garage`, `a message passed through a trainer`], where: [`behind the venue`, `in a deserted hallway`, `in the empty ring`, `at an after-hours diner`] },
    body: [`The apology arrives by way of {how}, and it asks you to meet {where} after the show. {rival.name} sounds sincere. {rival.first} also sounds like a person who knows how to sound sincere.`, `If it's real, it ends a feud. If it's a trap, it wins one.`],
    choices: [
      { id: 'go_alone', label: 'Go alone and hear them out', risk: 'high', outcomes: [
        { weight: 1, bonus: { confidence: 0.3 }, text: `It's real. {rival.first} admits it all and the feud loses its teeth.`, effects: [{ event: { type: 'reconciliation', participants: ['rival'], summary: `{rival.name} apologised and the feud ended in a quiet talk.`, data: { formerRival: true } } }, { rivalry: { who: 'rival', heat: -18 } }, { conf: 3 }] },
        { weight: 1, text: `It was a trap. Two of {rival.first}'s friends step out of the dark. You get out of there with a bruised pride and a split lip.`, effects: [{ fatigue: 6 }, { conf: -4 }, { rivalry: { who: 'rival', heat: 14 } }, { rel: { who: 'rival', heat: 12 } }, { injury: { part: 'arms', severity: 1, days: 6 } }] } ] },
      { id: 'bring_witness', label: 'Go, but bring a trusted witness', risk: 'low', result: `With a witness at your side, nothing bad happens, and nothing good does either. Both of you keep your cards close.`, effects: [{ rel: { who: 'rival', trust: 2, heat: -5 } }, { conf: 1 }] },
      { id: 'public', label: 'Demand the apology on live television', risk: 'med', result: `{rival.first} refuses. The crowd shrugs, but you get your chance to look like the bigger person.`, effects: [{ pop: 0.5 }, { rel: { who: 'rival', heat: 8, respect: -2 } }, { rivalry: { who: 'rival', heat: 6 } }] },
      { id: 'ignore', label: 'Ignore it completely', risk: 'low', result: `You throw the note away. Nobody gets hurt and nothing gets resolved.`, effects: [{ conf: 1 }, { rel: { who: 'rival', heat: 3 } }] },
    ],
  },
  {
    id: 'riv_house_show_hecklers', category: 'rivalry', title: 'A House Show That Got Personal', weight: 2, cooldownDays: 50, maxPerCareer: 4,
    trigger: { rivalry: { minHeat: 20 }, stat: { fatigue: { lte: 80 } } }, cast: { rival: { pick: 'rivalry', minHeat: 20 } },
    slots: { town: [`a small coastal arena`, `a county fair building`, `a college gym`, `a half-lit hockey rink`], twist: [`a front-row fan with a sign about your family`, `a chant of the rival's name that will not stop`, `a power cut halfway through your entrance`, `a ring that rocks with every bump`] },
    body: [`The crowd in {town} is half-full and fully drunk, and the night has {twist}. {rival.name} is across the ring, grinning, waiting to see how you handle it.`, `No cameras and no boss, only a few hundred people who will tell the story forever.`],
    choices: [
      { id: 'play_up', label: 'Play to the crowd and lean into it', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `You turn it into theatre. The crowd roars, the rival gives in, and the finish gets a standing ovation.`, effects: [{ pop: 0.7 }, { conf: 2 }, { fatigue: 4 }] },
        { weight: 1, text: `The more you push, the more the crowd roars back. You finish the match flustered.`, effects: [{ pop: -0.2 }, { conf: -2 }, { fatigue: 5 }] } ] },
      { id: 'protect', label: 'Protect the match and hit your spots', risk: 'low', result: `You shut out the noise and work the plan. It's a pro job, and a quiet one.`, effects: [{ rel: { who: 'rival', respect: 4 } }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'break_script', label: 'Break script and settle the score', risk: 'high', result: `You go off the plan and put hands on {rival.first}. The match ends badly and the promoter's face is tight.`, effects: [{ rivalry: { who: 'rival', heat: 14 } }, { rel: { who: 'rival', heat: 10, trust: -8 } }, { pop: 0.3 }, { money: -3000 }] },
      { id: 'cut_short', label: 'Cut the match short with a quick pin', risk: 'low', result: `You end it in four minutes. Nobody is thrilled, but nobody is hurt.`, effects: [{ pop: -0.3 }, { fatigue: -2 }, { rel: { who: 'rival', respect: -1 } }] },
    ],
  },
  // ===================================================================== BETRAYAL
  {
    id: 'bet_title_shot_partner', category: 'betrayal', title: 'A Title Shot, at {partner.name}\'s Expense', weight: 3, major: true, cooldownDays: 120, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 30 } }, holdsTitle: false }, cast: { partner: { pick: 'tag', tag: 'ally' } }, memory: { role: 'partner', max: 2 },
    slots: { offer: [`a title shot at the next premium show`, `a guaranteed singles push through the summer`, `a main-event slot on the biggest card of the quarter`], source: [`a quiet word from an executive`, `a creative meeting that ran late`, `a hallway hint from the GM`] },
    body: [`{source} brings an offer: {offer}. There is one catch. The office wants {partner.name} written out of the picture, and they want the cleanest way to do it to be you.`, `{partner.first} has been your closest ally for months. {partner.they} also has no idea this is happening.`],
    choices: [
      { id: 'betray', label: 'Take the offer and turn on your partner', risk: 'high', result: `You do it on live television. The crowd gasps, the office applauds, and {partner.first} stares at you from the mat as though meeting you for the first time.`, effects: [{ event: { type: 'betrayal', participants: ['partner'], summary: `Betrayed {partner.name} for a bigger opportunity.`, importance: 4, data: { context: 'tag_partner', byPlayer: true } } }, { pop: 1.2 }, { money: 10000 }, { conf: -3 }, { flag: 'turned_on_partner' }] },
      { id: 'refuse', label: 'Refuse to hurt your partner', risk: 'low', result: `The exec's smile thins out. You keep a friend and lose a favour, and {partner.first} hears from someone that you passed.`, effects: [{ rel: { who: 'partner', trust: 8, respect: 6, affinity: 5 } }, { conf: 3 }, { pop: -0.3 }] },
      { id: 'share', label: 'Insist that the shot be shared', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, mic: 0.3 }, text: `After a long negotiation, the office agrees to put you both in the picture. Your partner owes you, and knows it.`, effects: [{ pop: 0.6 }, { rel: { who: 'partner', trust: 6, respect: 4 } }, { money: 3000 }] },
        { weight: 1, text: `The office takes the refusal as disloyalty to them. The shot goes to someone else, and your partner is left puzzled about why you are both in a cold spell.`, effects: [{ pop: -0.4 }, { conf: -2 }, { rel: { who: 'partner', trust: 2 } }] } ] },
      { id: 'warn', label: 'Warn your partner and let them choose', risk: 'med', result: `{partner.first} listens with a stony face, then says, "Take it. I would." The two of you shake hands. It is not clear who got the worse end.`, effects: [{ rel: { who: 'partner', trust: 12, respect: 8 } }, { conf: 2 }, { pop: 0.2 }, { event: { type: 'decision', participants: ['partner'], summary: `Warned {partner.name} about the office's plan.`, importance: 2, data: {} } }] },
    ],
  },
  {
    id: 'bet_faction_leader_cross', category: 'betrayal', title: 'The Leader\'s Back Is Turned', weight: 2, major: true, cooldownDays: 120, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 25 } } }, cast: { boss: { pick: 'tag', tag: 'ally' }, exec: { pick: 'staff', role: 'executive' } }, memory: { role: 'boss', max: 1 },
    slots: { crew: [`the stable`, `the group`, `the whole clique`], promise: [`a spot as their own champion`, `a bigger percentage of the merchandise`, `a seat at the bookers' table`] },
    body: [`{exec.name} takes you to a quiet office and says what nobody has said out loud: {boss.name} is holding {crew} back. Take {boss.their} place at the head of the table, and the office will back you with {promise}.`, `You have been loyal to {boss.first}. {boss.they} has also been taking more than a fair cut for a long time.`],
    choices: [
      { id: 'overthrow', label: 'Overthrow the leader on live TV', risk: 'high', result: `The attack comes after a tag match, with the entire crew watching. {boss.first} goes down, and the fans erupt.`, effects: [{ event: { type: 'betrayal', participants: ['boss'], summary: `Overthrew {boss.name} as leader of the stable.`, importance: 4, data: { context: 'faction', byPlayer: true } } }, { pop: 1.0 }, { money: 8000 }, { conf: 2 }, { flag: 'seized_stable' }] },
      { id: 'tell', label: 'Tell the leader what the exec is planning', risk: 'low', result: `{boss.first} goes quiet, then thanks you. It is the best thing that ever happened to your standing in the group, and the worst for your standing with the office.`, effects: [{ rel: { who: 'boss', trust: 10, respect: 5 } }, { pop: -0.4 }, { conf: 1 }] },
      { id: 'double_play', label: 'Play both sides and wait', risk: 'med', outcomes: [
        { weight: 1, bonus: { overall: 0.4 }, text: `You string both along for a month. When the dust settles, you are the safest person in the building.`, effects: [{ conf: 3 }, { pop: 0.4 }, { rel: { who: 'boss', trust: -3 } }] },
        { weight: 2, text: `Someone talks. {boss.first} finds out and treats you like a stranger, while the office feels used.`, effects: [{ conf: -4 }, { pop: -0.5 }, { rel: { who: 'boss', trust: -12, heat: 8 } }] } ] },
      { id: 'decline_exec', label: 'Decline politely and walk out', risk: 'low', result: `The exec nods without warmth. You leave with a clean conscience and an uncertain future.`, effects: [{ conf: 2 }, { rel: { who: 'boss', respect: 3 } }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'bet_friend_blindside', category: 'betrayal', title: '{friend.name} Went Behind Your Back', weight: 3, major: true, cooldownDays: 90, maxPerCareer: 3,
    trigger: { stat: { popularity: { gte: 20 } } }, cast: { friend: { pick: 'tag', tag: 'ally' } }, memory: { role: 'friend', max: 2 },
    slots: { act: [`pitched your finisher as theirs to the writers`, `asked for your television spot in a private meeting`, `told the agent you were "not reliable"`, `took credit for your idea in front of the producer`], learned: [`from the receptionist`, `from an overheard phone call`, `from a screenshot a cameraman sent you`, `from an agent who had a conscience`] },
    body: [`You find out {learned}: {friend.name} {act}. Months of rides, meals and shared hotel rooms, and it only took one meeting.`, `Nobody saw you find out. You get to decide what happens next, and how much of it is public.`],
    choices: [
      { id: 'confront', label: 'Confront them in private', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `{friend.first} cracks quickly and admits everything. It does not fix it, but you leave with an apology and the truth.`, effects: [{ rel: { who: 'friend', trust: -4, respect: 4, fear: 3 } }, { conf: 3 }, { tag: { who: 'friend', tag: 'betrayal' } }] },
        { weight: 1, text: `{friend.first} denies everything and stares you down. You walk away furious, with no proof.`, effects: [{ rel: { who: 'friend', heat: 10, trust: -8 } }, { conf: -3 }, { tag: { who: 'friend', tag: 'betrayal' } }] } ] },
      { id: 'expose', label: 'Expose it to the locker room', risk: 'high', result: `You tell the room what happened. Half of them side with you; the other half remember you did not have to humiliate anyone. {friend.first} never speaks to you again.`, effects: [{ rivalry: { who: 'friend', heat: 18 } }, { rel: { who: 'friend', heat: 16, respect: -8, trust: -15 } }, { pop: 0.4 }, { tag: { who: 'friend', tag: 'betrayal' } }, { obligation: { kind: 'confront_backstage', who: 'friend', inDays: 5 } }] },
      { id: 'quiet_revenge', label: 'Say nothing and plan a quiet payback', risk: 'med', result: `You smile at every meal. Whatever comes, comes when it will hurt most.`, effects: [{ conf: 1 }, { rel: { who: 'friend', trust: 3 } }, { tag: { who: 'friend', tag: 'betrayal' } }, { fatigue: 2 }] },
      { id: 'let_go', label: 'Let it go for the sake of the friendship', risk: 'low', result: `You decide the friendship is worth more than the grudge. It costs you some pride, and nobody ever says a word.`, effects: [{ rel: { who: 'friend', trust: 6, affinity: 4 } }, { conf: -3 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'bet_leaked_plans', category: 'betrayal', title: 'Your Plans Were Leaked', weight: 2, cooldownDays: 80, maxPerCareer: 3,
    trigger: { rivalry: { minHeat: 20 } }, cast: { rival: { pick: 'rivalry', minHeat: 20 }, spy: { pick: 'roster', sameBrand: true } },
    slots: { plan: [`your finish for Sunday`, `the surprise you have been saving for the title match`, `a new entrance you had worked on for weeks`, `a spot you only told your agent about`], clue: [`a crew member who looked sheepish`, `a stray comment from a camera operator`, `a suspiciously identical countermove during rehearsal`] },
    body: [`{rival.name} ruined {plan}, and {rival.they} did it too neatly to be luck. {clue} points toward {spy.name}, who has been seen chatting with {rival.first} lately.`, `You have no proof. All you have is a bad feeling and a long list of people who knew.`],
    choices: [
      { id: 'accuse', label: 'Accuse {spy.first} to their face', risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.5 }, text: `{spy.first} breaks and admits to everything. You get the truth, along with a slightly less pleasant hallway.`, effects: [{ rel: { who: 'spy', heat: 10, respect: 3, fear: 6 } }, { tag: { who: 'spy', tag: 'betrayal' } }, { conf: 3 }] },
        { weight: 2, text: `{spy.first} swears innocence and nearly takes a swing. It turns out someone else leaked it, and now you owe an apology.`, effects: [{ rel: { who: 'spy', heat: 12, trust: -8 } }, { conf: -4 }, { pop: -0.3 }] } ] },
      { id: 'feed_fake', label: 'Feed {spy.first} a fake plan', risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `The fake plan reaches {rival.first} within a day. On the night, you do something entirely different and look like a genius.`, effects: [{ pop: 0.8 }, { conf: 4 }, { rel: { who: 'rival', respect: 3, fear: 3 } }] },
        { weight: 1, text: `The trick takes too long to pay off. The leak was just a coincidence, and you have wasted a week.`, effects: [{ conf: -1 }, { fatigue: 3 }] } ] },
      { id: 'report', label: 'Report the leak to the agent', risk: 'low', result: `The agent says they will "look into it" and does nothing visible. {spy.first} hears about it all the same.`, effects: [{ rel: { who: 'spy', heat: 6, trust: -4 } }, { conf: 1 }] },
      { id: 'adapt', label: 'Stop trusting anyone and change everything', risk: 'low', result: `You throw out the old plan and work out a new one alone. It's lonely, and it's tiring, but it's safe.`, effects: [{ fatigue: 5 }, { conf: 2 }, { pop: 0.2 }, { rel: { who: 'spy', trust: -2 } }] },
    ],
  },
  {
    id: 'bet_partner_secret_exit', category: 'betrayal', title: '{partner.name} Is Thinking of Leaving', weight: 3, cooldownDays: 100, maxPerCareer: 2,
    trigger: {}, cast: { partner: { pick: 'tag', tag: 'ally' }, gm: { pick: 'staff', role: 'gm' } }, memory: { role: 'partner', max: 1 },
    slots: { where: [`a parked rental car`, `the roof of the parking garage`, `a booth in an empty diner`, `a hotel stairwell`], offer: [`a bigger deal from the other brand`, `a guaranteed spot in another promotion`, `a part in a movie`, `an offer to coach full-time`] },
    body: [`{partner.name} makes you swear not to tell anyone, then spills it in {where}: {partner.they} has {offer} and is leaning toward taking it. "I wanted you to hear it from me," {partner.they} says.`, `{gm.name} has been asking you pointed questions all week. The secret is going to become expensive to keep.`],
    choices: [
      { id: 'keep', label: 'Keep the secret, no matter what', risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.3 }, text: `You lie to the GM straight-faced. Your partner is grateful beyond words.`, effects: [{ rel: { who: 'partner', trust: 12, respect: 6 } }, { fatigue: 3 }, { conf: 1 }] },
        { weight: 1, text: `The GM sees through it and holds a grudge. The secret holds, but it costs you a spot.`, effects: [{ rel: { who: 'partner', trust: 8 } }, { pop: -0.4 }, { conf: -2 }] } ] },
      { id: 'tell_gm', label: 'Tell the GM and take the credit', risk: 'high', result: `The GM thanks you and tightens the leash on your partner. When {partner.first} figures out who talked, the friendship ends cold.`, effects: [{ event: { type: 'betrayal', participants: ['partner'], summary: `Betrayed {partner.name}'s confidence to the GM.`, importance: 3, data: { context: 'tag_partner', byPlayer: true } } }, { pop: 0.4 }, { money: 4000 }, { conf: -2 }] },
      { id: 'talk_out', label: 'Talk them out of leaving', risk: 'med', result: `You make the case for staying. By the end of the night {partner.first} has not decided, but the offer sits in the glovebox for now.`, effects: [{ rel: { who: 'partner', trust: 4, affinity: 3 } }, { fatigue: 2 }, { tag: { who: 'partner', tag: 'reluctant' } }] },
      { id: 'encourage', label: 'Encourage them to take the offer', risk: 'low', result: `"Go," you say. "I would." It costs you a partner, but earns you a friend for life.`, effects: [{ rel: { who: 'partner', trust: 8, respect: 8, affinity: 6 } }, { conf: -2 }, { pop: -0.3 }] },
    ],
  },
  {
    id: 'bet_second_chance', category: 'betrayal', title: '{former.name} Asks for a Second Chance', weight: 2, cooldownDays: 120, maxPerCareer: 2,
    trigger: { mem: [{ role: 'former', betrayal: true }] }, cast: { former: { pick: 'tag', tag: 'betrayal' } }, memory: { role: 'former', max: 3 },
    slots: { how: [`a long, awkward message`, `a coffee that appears on your bench`, `a late-night knock on your hotel door`, `an apology via the trainer`], reason: [`facing a bad run of injuries`, `finally losing their place in the stable`, `watching the same thing happen to them`, `having heard what the crew says`] },
    body: [`{former.name} shows up with {how}. {former.they} is {reason}, and is asking for another chance.`, `The betrayal sits between you like a third person in the room. Forgiving would be hard; refusing would be easy.`],
    choices: [
      { id: 'forgive', label: 'Forgive them, and say so publicly', risk: 'med', result: `You say it on camera. The crowd applauds, and {former.first} cannot look at you for several minutes.`, effects: [{ event: { type: 'reconciliation', participants: ['former'], summary: `Forgave {former.name} after the betrayal.`, data: { formerRival: true } } }, { pop: 0.5 }, { conf: 2 }, { tag: { who: 'former', tag: 'reconciled' } }] },
      { id: 'prove_it', label: 'Make them earn it, slowly', risk: 'low', result: `You set terms. {former.first} agrees to all of them, and you start the long climb back to trust.`, effects: [{ rel: { who: 'former', trust: 5, respect: 4 } }, { conf: 1 }] },
      { id: 'refuse', label: 'Refuse. Some things stay broken', risk: 'low', result: `The silence is complete. {former.first} nods once and leaves, and the room treats you with a little more distance.`, effects: [{ rel: { who: 'former', heat: 4, trust: -3 } }, { conf: 1 }, { pop: 0.1 }] },
      { id: 'use', label: 'Accept, then use them for your own ends', risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.4 }, text: `You keep {former.first} close and useful. It pays off in two weeks, and nobody can tell it was calculated.`, effects: [{ pop: 0.5 }, { money: 3000 }, { rel: { who: 'former', trust: -2 } }] },
        { weight: 1, text: `{former.first} spots it right away. The second betrayal is worse than the first, and the whole locker room hears about it.`, effects: [{ pop: -0.6 }, { conf: -4 }, { rel: { who: 'former', heat: 14, trust: -12 } }] } ] },
    ],
  },
  {
    id: 'bet_loyalty_test', category: 'betrayal', title: 'The GM Tests Your Loyalty', weight: 2, cooldownDays: 150, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 35 } } }, cast: { gm: { pick: 'staff', role: 'gm' }, rival: { pick: 'roster', tier: { gte: 2 }, sameBrand: true } },
    slots: { bait: [`a rumoured offer from a rival promotion`, `a "friendly" tip about a roster cut`, `a question about who in the locker room is unhappy`], tone: [`casual and relaxed`, `unusually warm`, `quiet and a little too interested`] },
    body: [`{gm.name} drops by catering, {tone}, and mentions {bait}. It sounds like small talk until you notice that {gm.they} is watching your face and not the food.`, `{rival.name}, two tables over, pretends not to listen. Whatever you say will land in two places by the end of the night.`],
    choices: [
      { id: 'loyal', label: 'Affirm your loyalty, loudly', risk: 'low', result: `You say you are happy here, and the GM smiles. The loyalty is rewarded with a small reminder of who owes whom.`, effects: [{ pop: 0.3 }, { conf: 1 }, { rel: { who: 'rival', respect: -2 } }] },
      { id: 'name_names', label: 'Name someone who is unhappy', risk: 'high', result: `You give the GM {rival.name}'s name. It earns you a pat on the shoulder and a reputation as a snitch.`, effects: [{ event: { type: 'betrayal', participants: ['rival'], summary: `Named {rival.name} to the GM as a malcontent.`, importance: 3, data: { context: 'tag_partner', byPlayer: true } } }, { money: 3000 }, { pop: 0.3 }, { rel: { who: 'rival', heat: 14, trust: -10 } }] },
      { id: 'play_dumb', label: 'Play dumb and change the subject', risk: 'low', outcomes: [
        { weight: 2, bonus: { mic: 0.3 }, text: `You keep the chat light and the GM moves on, apparently satisfied.`, effects: [{ conf: 1 }, { rel: { who: 'rival', respect: 2 } }] },
        { weight: 1, text: `The GM clearly noted that you dodged. Your next booking sheet is thinner than expected.`, effects: [{ pop: -0.4 }, { conf: -2 }] } ] },
      { id: 'counter_probe', label: 'Turn the question around on the GM', risk: 'med', result: `You ask what the office is hearing. The GM laughs, cooler than before, but you get a useful hint.`, effects: [{ conf: 3 }, { rel: { who: 'rival', respect: 3 } }, { pop: 0.1 }, { fatigue: 1 }] },
    ],
  },
  {
    id: 'bet_stolen_spot', category: 'betrayal', title: '{thief.name} Lifted Your Best Spot', weight: 2, cooldownDays: 80, maxPerCareer: 3,
    trigger: { stat: { popularity: { gte: 25 } } }, cast: { thief: { pick: 'roster', sameBrand: true, tier: { gte: 1 } } },
    slots: { stolen: [`your signature finishing sequence`, `the corner-post taunt you built`, `your entrance posture`, `the catchphrase you have used since your first week`], where: [`on television`, `at a house show`, `on the biggest show of the quarter`] },
    body: [`{thief.name} did {stolen} {where}, down to the last detail, and the crowd popped for it. It was your idea, and it was good enough to steal.`, `Nobody can own a move, but everyone knows whose it was.`],
    choices: [
      { id: 'confront', label: 'Confront {thief.first} backstage', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `{thief.first} apologises awkwardly and agrees to stop. The room notices who has the upper hand.`, effects: [{ rel: { who: 'thief', respect: 4, fear: 4, heat: 3 } }, { conf: 3 }] },
        { weight: 1, text: `{thief.first} says "everyone does it" and walks away. You look petty.`, effects: [{ conf: -2 }, { rel: { who: 'thief', heat: 8 } }, { pop: -0.2 }] } ] },
      { id: 'one_up', label: 'Do it better on the next show', risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4, charisma: 0.3 }, text: `You perform it with improvements, and the crowd treats {thief.first}'s version as a cheap copy.`, effects: [{ pop: 0.7 }, { conf: 3 }, { rel: { who: 'thief', heat: 6 } }, { fatigue: 3 }] },
        { weight: 1, text: `The crowd cannot tell the difference. You look like the copy.`, effects: [{ pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'flattered', label: 'Take it as a compliment and move on', risk: 'low', result: `You call it flattery and mean about half of it. The thief owes you something, and knows it.`, effects: [{ rel: { who: 'thief', respect: 3, affinity: 3 } }, { conf: -1 }, { pop: 0.1 }] },
      { id: 'report', label: 'Ask the agent to put a stop to it', risk: 'low', result: `The agent agrees quietly and has a word. {thief.first} knows it came from you.`, effects: [{ rel: { who: 'thief', heat: 8, trust: -4 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'bet_script_swap', category: 'betrayal', title: 'Creative Wants {partner.name} Gone from the Story', weight: 2, cooldownDays: 90, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 30 } } }, cast: { partner: { pick: 'tag', tag: 'ally' }, creative: { pick: 'staff', role: 'creative' } },
    slots: { pitch: [`a feud with a bigger name`, `a leading role in the pay-per-view story`, `a long run as a solo act`], cut: [`quietly dropped from the next three shows`, `written off with an injury angle`, `moved to the other brand`] },
    body: [`{creative.name} pitches you {pitch}. It all depends on one thing: {partner.name} would have to be {cut}, and the writer needs you to sign off on it.`, `{partner.first} would never know the story came from your side of the desk. The office likes a clean sign-off and does not ask many questions.`],
    choices: [
      { id: 'sign', label: 'Sign off and take the push', risk: 'high', result: `You agree. {partner.first} finds out three weeks later and does not say a word to you, which is worse than yelling.`, effects: [{ event: { type: 'betrayal', participants: ['partner'], summary: `Signed off on writing {partner.name} out of the story.`, importance: 3, data: { context: 'tag_partner', byPlayer: true } } }, { pop: 0.9 }, { money: 6000 }, { conf: -2 }] },
      { id: 'refuse', label: 'Refuse. Your partner stays', risk: 'low', result: `{creative.name} sighs and files the idea away. You keep the friendship and keep the weaker storyline.`, effects: [{ rel: { who: 'partner', trust: 6, respect: 4 } }, { pop: -0.3 }, { conf: 2 }] },
      { id: 'counter', label: 'Offer a story that includes both', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, mic: 0.3 }, text: `Your counter-pitch wins the writer over. It's a bigger story than either of you pitched.`, effects: [{ pop: 0.6 }, { rel: { who: 'partner', respect: 4, trust: 3 } }, { fatigue: 3 }] },
        { weight: 1, text: `{creative.name} just stares at you. "That is not the assignment." You leave with nothing.`, effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'tell_partner', label: 'Tell {partner.first} everything', risk: 'med', result: `{partner.first} thanks you and quietly lobbies the office. The pitch gets shelved. The writer notices where the leak came from.`, effects: [{ rel: { who: 'partner', trust: 10, respect: 5 } }, { pop: -0.2 }, { conf: 1 }] },
    ],
  },
  {
    id: 'bet_who_started_it', category: 'betrayal', title: 'The Agent Wants a Name', weight: 2, cooldownDays: 70, maxPerCareer: 3,
    trigger: {}, cast: { agent: { pick: 'staff', role: 'agent' }, culprit: { pick: 'roster', sameBrand: true } },
    slots: { incident: [`a fight in the parking lot`, `a broken window in the dressing room`, `a missing gear bag`, `a prank that went bad and ruined a costume`], cost: [`a fine for the whole locker room`, `a suspended spot for whoever is guilty`, `a note in every file`] },
    body: [`{agent.name} lines everyone up after {incident}. "Somebody is going to tell me who did this, or the entire roster takes {cost}."`, `You saw it, and the culprit is {culprit.name}. Nobody else knows you saw.`],
    choices: [
      { id: 'tell', label: 'Give the agent the name', risk: 'med', result: `{culprit.first} takes the punishment, and the agent files your name under "reliable". The locker room goes cold for a few days.`, effects: [{ pop: 0.2 }, { rel: { who: 'culprit', heat: 12, trust: -10 } }, { money: 2000 }, { conf: 1 }] },
      { id: 'cover', label: 'Cover for them and say you saw nothing', risk: 'med', result: `Nobody talks and everyone takes the fine. {culprit.first} owes you one.`, effects: [{ rel: { who: 'culprit', trust: 8, respect: 3 } }, { money: -3000 }, { conf: 1 }] },
      { id: 'confess_for', label: 'Take the blame yourself', risk: 'high', result: `You raise your hand. The punishment lands on you alone. {culprit.first} will not forget what you did.`, effects: [{ rel: { who: 'culprit', trust: 14, respect: 10 } }, { money: -5000 }, { pop: -0.2 }, { conf: -2 }, { tag: { who: 'culprit', tag: 'ally' } }] },
      { id: 'fix_it', label: 'Make the culprit confess, quietly', risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `After a short talk, {culprit.first} walks into the office and owns it. The agent notices who arranged it.`, effects: [{ rel: { who: 'culprit', respect: 4, trust: 4 } }, { conf: 2 }, { pop: 0.2 }] },
        { weight: 1, text: `{culprit.first} refuses and the deadline passes. Everybody takes the fine, and you take the heat for stalling.`, effects: [{ money: -3000 }, { conf: -2 }, { rel: { who: 'culprit', heat: 4 } }] } ] },
    ],
  },
  {
    id: 'bet_planned_double_cross', category: 'betrayal', title: 'The Turn on {partner.name}', weight: 3, major: true, cooldownDays: 120, maxPerCareer: 2,
    trigger: { any: [{ flag: 'planned_turn' }, { rivalry: { minHeat: 25 } }] }, cast: { partner: { pick: 'rivalry', minHeat: 10 }, creative: { pick: 'staff', role: 'creative' } }, memory: { role: 'partner', max: 1 },
    slots: { moment: [`during the post-match celebration`, `after the bell at the premium show`, `when the lights go out`, `in the middle of a title defense`], hook: [`with a chair`, `with a low blow`, `with a suddenly thrown elbow`] },
    body: [`{creative.name} has the finish: you and {partner.name} are teaming up, and {moment} you turn on {partner.them} {hook}. It's the kind of turn that people retell.`, `{partner.first} has agreed to take it. What {partner.they} has not agreed to is how you do it.`],
    choices: [
      { id: 'hard', label: 'Sell it as hard as you can', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, overall: 0.3 }, text: `The turn lands like a bomb. {partner.first} sells it perfectly, and the fans hate you in the best possible way.`, effects: [{ event: { type: 'betrayal', participants: ['partner'], summary: `Turned on {partner.name} in a storyline double-cross.`, importance: 4, data: { context: 'tag_partner', byPlayer: true } } }, { pop: 1.0 }, { rivalry: { who: 'partner', heat: 12 } }, { clearFlag: 'planned_turn' }] },
        { weight: 1, text: `The timing is off and {partner.first} takes it a touch too hard. The segment works, but there is an edge in the apology afterwards.`, effects: [{ event: { type: 'betrayal', participants: ['partner'], summary: `Turned on {partner.name} in a storyline double-cross.`, importance: 4, data: { context: 'tag_partner', byPlayer: true } } }, { pop: 0.5 }, { rel: { who: 'partner', respect: -3, heat: 6 } }, { clearFlag: 'planned_turn' }] } ] },
      { id: 'safe', label: 'Keep it safe and tell the partner every beat', risk: 'low', result: `You rehearse until the turn is a perfect little machine. It does not get as big a reaction, but nobody gets hurt.`, effects: [{ pop: 0.4 }, { rel: { who: 'partner', trust: 6, respect: 4 } }, { clearFlag: 'planned_turn' }] },
      { id: 'refuse', label: 'Refuse. Pitch something different', risk: 'med', result: `{creative.name} is not pleased. The new angle takes a month to develop, and your push cools off in between.`, effects: [{ pop: -0.5 }, { conf: -1 }, { rel: { who: 'partner', respect: 3 } }, { clearFlag: 'planned_turn' }] },
      { id: 'real', label: 'Add a little real heat to the turn', risk: 'high', result: `You hit harder than planned. The crowd feels it, and {partner.first} feels it more.`, effects: [{ event: { type: 'betrayal', participants: ['partner'], summary: `Turned on {partner.name} with a little too much force.`, importance: 4, data: { context: 'tag_partner', byPlayer: true } } }, { pop: 1.1 }, { rivalry: { who: 'partner', heat: 16 } }, { rel: { who: 'partner', trust: -10, heat: 12 } }, { clearFlag: 'planned_turn' }] },
    ],
  },
  {
    id: 'bet_rumour_about_ally', category: 'betrayal', title: 'What {friend.name} Said About You', weight: 2, cooldownDays: 70, maxPerCareer: 3,
    trigger: {}, cast: { friend: { pick: 'tag', tag: 'ally' }, source: { pick: 'roster', sameBrand: true } },
    slots: { remark: [`that you only got your push because of the office`, `that you cannot work without a script`, `that you are "coasting"`, `that you were scared in your last match`], witness: [`a hairdresser`, `a camera operator`, `two younger wrestlers`] },
    body: [`{source.name} tells you, almost gently, what {friend.name} said about you: {remark}. There were {witness} in the room.`, `It may be true. It may be exaggerated. It may be a plant. None of it feels good.`],
    choices: [
      { id: 'ask', label: 'Ask {friend.first} directly', risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `{friend.first} laughs, mortified, and says it was taken out of context. You decide to believe it.`, effects: [{ rel: { who: 'friend', trust: 4, affinity: 2 } }, { conf: 1 }] },
        { weight: 1, text: `{friend.first} goes quiet. That's an answer, and not a good one.`, effects: [{ rel: { who: 'friend', trust: -8, heat: 6 } }, { conf: -3 }, { tag: { who: 'friend', tag: 'betrayal' } }] } ] },
      { id: 'return', label: 'Return the favour in public', risk: 'high', result: `You pay it back in kind where the same people can hear. {friend.first} hears about it by lunch, and the friendship cools to ice.`, effects: [{ pop: 0.3 }, { rel: { who: 'friend', heat: 12, respect: -6, trust: -10 } }, { conf: 1 }] },
      { id: 'test', label: 'Set a trap to see if it is true', risk: 'med', outcomes: [
        { weight: 1, bonus: { overall: 0.5 }, text: `Your trap works perfectly and the truth comes out. {source.first} was right, and {friend.first} knows you know.`, effects: [{ rel: { who: 'friend', trust: -10, fear: 4, respect: 2 } }, { conf: 3 }, { tag: { who: 'friend', tag: 'betrayal' } }] },
        { weight: 1, text: `The trap falls flat, and {friend.first} is exactly who you hoped they were. You owe an apology.`, effects: [{ rel: { who: 'friend', trust: -3 } }, { conf: -2 }] } ] },
      { id: 'ignore', label: 'Ignore the gossip', risk: 'low', result: `You let it roll off, but a small thing has changed. You watch {friend.first} a little closer from now on.`, effects: [{ conf: 1 }, { rel: { who: 'friend', trust: -1 } }] },
    ],
  },
  {
    id: 'bet_payback_chance', category: 'betrayal', title: 'A Chance to Get Even with {rival.name}', weight: 3, cooldownDays: 80, maxPerCareer: 3,
    trigger: { rivalry: { minHeat: 30 } }, cast: { rival: { pick: 'rivalry', minHeat: 30 } }, memory: { role: 'rival', max: 2 },
    slots: { setup: [`left a gear bag unattended at ringside`, `fallen asleep in the lounge`, `forgotten a pre-show interview`, `walked in alone on the wrong night`], tool: [`a bucket of ice water`, `a stack of paper plates`, `a marker pen`, `a phone full of embarrassing photos`] },
    body: [`{rival.name} has {setup}, and you are alone with {tool}. It is the sort of petty revenge you spent weeks fantasising about.`, `You could also do the grown-up thing. The grown-up thing has never felt less satisfying.`],
    choices: [
      { id: 'do_it', label: 'Do it. Make it public', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `It's the funniest thing anyone has seen in weeks. {rival.first} has to laugh, eventually, through clenched teeth.`, effects: [{ pop: 0.5 }, { rivalry: { who: 'rival', heat: 8 } }, { rel: { who: 'rival', heat: 8 } }, { conf: 2 }] },
        { weight: 1, text: `The prank goes wrong and costs {rival.first} a bruised wrist and a ruined bag. The agents are not amused.`, effects: [{ pop: -0.4 }, { rel: { who: 'rival', heat: 14, trust: -5 } }, { conf: -2 }, { money: -2000 }] } ] },
      { id: 'walk', label: 'Walk away. You are better than that', risk: 'low', result: `You leave the room unwatched. The satisfaction is smaller than you wanted, but the self-respect is bigger.`, effects: [{ conf: 2 }, { rel: { who: 'rival', respect: 2 } }] },
      { id: 'tell', label: 'Wake them and give a warning instead', risk: 'low', result: `{rival.first} is baffled, then wary. A rival who owes you a debt is worth more than one who owes you a laugh.`, effects: [{ rel: { who: 'rival', respect: 5, trust: 3, heat: -4 } }, { pop: 0.1 }] },
      { id: 'real_payback', label: 'Wreck something that matters instead', risk: 'high', result: `You sabotage {rival.their} promo notes. The segment goes badly for {rival.first}, and the question of who did it is left unanswered.`, effects: [{ rivalry: { who: 'rival', heat: 14 } }, { rel: { who: 'rival', heat: 14, trust: -10 } }, { pop: 0.3 }, { conf: -2 }, { obligation: { kind: 'seek_revenge', who: 'rival', inDays: 12 } }] },
    ],
  },
  {
    id: 'bet_pre_match_shoot', category: 'betrayal', title: 'Warning of a Double-Cross from {opp.name}', weight: 3, cooldownDays: 80, maxPerCareer: 3, contexts: ['pre_show', 'show_day'],
    trigger: { stat: { popularity: { gte: 20 } } }, cast: { opp: { pick: 'roster', sameBrand: true, alignment: ['heel', 'tweener'] }, agent: { pick: 'staff', role: 'agent' } },
    slots: { source: [`a trainer who overheard it`, `a make-up artist`, `the referee`, `a cameraman`], plan: [`go off-script in the third minute`, `refuse to take the finish`, `lay in a few shots that were not agreed`] },
    body: [`{source} warns you that {opp.name} plans to {plan} tonight. {agent.name} has no reason to know, and you have only one rumour to go on.`, `If you do nothing, you could be made to look bad on live television. If you act, you might be wrong.`],
    choices: [
      { id: 'tell_agent', label: 'Tell {agent.name} before the match', risk: 'low', result: `{agent.name} takes it seriously and has a word with {opp.first}. The match goes by the book, and nobody knows who raised the flag.`, effects: [{ rel: { who: 'opp', heat: 6, trust: -3 } }, { conf: 2 }, { pop: 0.1 }] },
      { id: 'strike_first', label: 'Strike first when the bell rings', risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.3, confidence: 0.3 }, text: `You pre-empt it perfectly. The crowd explodes, and {opp.first} spends the rest of the match confused.`, effects: [{ pop: 0.7 }, { rel: { who: 'opp', heat: 12, fear: 6 } }, { rivalry: { who: 'opp', heat: 12 } }, { fatigue: 5 }] },
        { weight: 1, text: `You misjudged it. {opp.first} was going to hit the plan anyway, and now you look like the one who broke the script.`, effects: [{ pop: -0.5 }, { conf: -3 }, { rel: { who: 'opp', heat: 10 } }, { fatigue: 5 }] } ] },
      { id: 'confront', label: 'Look {opp.first} in the eye before the match', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: `{opp.first} shifts uneasily, says nothing, and works the match by the book. The message lands.`, effects: [{ rel: { who: 'opp', respect: 4, fear: 4 } }, { conf: 3 }] },
        { weight: 1, text: `{opp.first} turns it around and tells the agent you are paranoid. The agent is not impressed.`, effects: [{ conf: -3 }, { pop: -0.2 }, { rel: { who: 'opp', heat: 6 } }] } ] },
      { id: 'trust', label: 'Trust the rumour is wrong and go out there', risk: 'med', result: `You work the match with one eye open. Nothing happens, and you feel a little foolish and a lot tired.`, effects: [{ fatigue: 4 }, { conf: -1 }, { rel: { who: 'opp', respect: 1 } }] },
    ],
  },
  // ===================================================================== ALLIANCE
  {
    id: 'ali_tag_pitch', category: 'alliance', title: '{mate.name} Pitches a Tag Team', weight: 3, cooldownDays: 90, maxPerCareer: 3,
    trigger: { stat: { popularity: { gte: 15 } }, noFlag: 'allied_recently' }, cast: { mate: { pick: 'roster', sameBrand: true, tier: { gte: 1, lte: 3 } } },
    slots: { place: [`the gym`, `a late-night diner`, `the back seat of a rental van`, `the airport lounge`], hook: [`a pairing of opposites that writes itself`, `matching gear and a shared entrance`, `a heel-face double act the crowd will not see coming`, `a two-man army built on speed`] },
    body: [`In {place}, {mate.name} slides over with a proposal: join forces as a tag team. {mate.they} already has {hook} sketched out on a napkin.`, `The napkin is not bad. The question is whether you want your career attached to someone else's.`],
    choices: [
      { id: 'accept', label: 'Say yes and shake on it', risk: 'low', result: `The deal is made in thirty seconds. By Monday the office has a plan, and {mate.first} has a nickname for the team.`, effects: [{ event: { type: 'alliance_formed', participants: ['mate'], summary: `Formed a tag team with {mate.name}.`, data: {} } }, { flag: 'allied_recently' }, { pop: 0.3 }, { fatigue: 2 }] },
      { id: 'trial', label: 'Agree to a trial match first', risk: 'med', result: `You book a tag match to see if it clicks. If it does, you will know. If it does not, you will both be polite about it.`, effects: [{ booking: { who: 'mate', type: 'tag' } }, { rel: { who: 'mate', respect: 3, trust: 1 } }, { tag: { who: 'mate', tag: 'alliance_possible' } }, { fatigue: 3 }] },
      { id: 'terms', label: 'Accept, but hold the better spots', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{mate.first} grudgingly agrees to your conditions. The deal holds, but a small note of resentment hovers.`, effects: [{ event: { type: 'alliance_formed', participants: ['mate'], summary: `Formed a tag team with {mate.name} on strict terms.`, data: {} } }, { rel: { who: 'mate', trust: -3, respect: 3 } }, { flag: 'allied_recently' }, { pop: 0.4 }] },
        { weight: 1, text: `{mate.first} balks and walks away. The idea was good, but your price was not.`, effects: [{ rel: { who: 'mate', respect: -2 } }, { conf: -1 }] } ] },
      { id: 'decline', label: 'Decline and stay a solo act', risk: 'low', result: `You tell {mate.first} you work alone. The napkin goes in the bin, and your independence stays intact.`, effects: [{ conf: 2 }, { rel: { who: 'mate', trust: -1 } }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'ali_gym_partner', category: 'alliance', title: 'A Training Partner Worth Keeping', weight: 2, cooldownDays: 80, maxPerCareer: 3,
    trigger: { stat: { fatigue: { lte: 70 } } }, cast: { mate: { pick: 'roster', sameBrand: true, tier: { lte: 3 } } },
    slots: { focus: [`wrestling holds that your coach never showed you`, `heavy conditioning blocks`, `cardio rounds that leave you flat on the mat`, `an early-morning routine`], bargain: [`a standing 6 a.m. slot`, `a shared protein budget`, `two hours after every show`] },
    body: [`{mate.name} suggests training together, with a focus on {focus}. The deal comes with {bargain}.`, `Every trainer on the card says the same thing: you improve fastest next to someone better than you. You are not sure which of you that is.`],
    choices: [
      { id: 'commit', label: 'Commit to a full training block', risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `Three weeks in, you notice the change. You are stronger, sharper and a little more tired than you have ever been.`, effects: [{ attr: { name: 'endurance', delta: 1 } }, { fatigue: 10 }, { rel: { who: 'mate', trust: 5, affinity: 4 } }, { tag: { who: 'mate', tag: 'ally' } }] },
        { weight: 1, text: `You overdo it and tweak something in your back. The partnership is fine; your body is not.`, effects: [{ fatigue: 14 }, { conf: -2 }, { injury: { part: 'torso', severity: 1, days: 7 } }, { rel: { who: 'mate', trust: 3 } }] } ] },
      { id: 'light', label: 'Agree to one session a week', risk: 'low', result: `It's not the full block, but it's something. {mate.first} nods, and you both mean it.`, effects: [{ fatigue: 4 }, { rel: { who: 'mate', trust: 2, affinity: 2 } }, { attr: { name: 'technical', delta: 1 } }] },
      { id: 'swap', label: 'Swap training secrets instead', risk: 'med', result: `Each of you teaches the other something. It is a fair trade and a quiet one.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { rel: { who: 'mate', respect: 4, trust: 3 } }, { fatigue: 3 }] },
      { id: 'pass', label: 'Pass: you work better alone', risk: 'low', result: `You thank {mate.first} and go back to your own routine. It's efficient, and it's lonely.`, effects: [{ fatigue: -2 }, { conf: 1 }, { rel: { who: 'mate', respect: -1 } }] },
    ],
  },
  {
    id: 'ali_travel_confidence', category: 'alliance', title: 'A Confidence on the Road', weight: 2, cooldownDays: 60, maxPerCareer: 4,
    trigger: { stat: { matches: { gte: 15 } } }, cast: { mate: { pick: 'roster', sameBrand: true } },
    slots: { ride: [`a night drive between two towns`, `a delayed flight`, `a bus ride through a thunderstorm`, `a shared hotel breakfast`], worry: [`a fear that the next injury will end the career`, `a rumour of being released`, `serious money trouble`, `doubts about whether to keep wrestling at all`] },
    body: [`During {ride}, {mate.name} goes quiet, then tells you about {worry}. It is not the sort of thing people say out loud in this business.`, `You are the only person who has heard it. How you respond will decide whether it is the beginning of a friendship or a slip of the tongue.`],
    choices: [
      { id: 'listen', label: 'Listen all night and say little', risk: 'low', result: `You give {mate.first} the only thing that helps, which is your attention. By dawn it feels like a weight has shifted.`, effects: [{ rel: { who: 'mate', trust: 10, affinity: 6 } }, { tag: { who: 'mate', tag: 'ally' } }, { fatigue: 4 }] },
      { id: 'advice', label: 'Offer blunt, practical advice', risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.3 }, text: `Your advice is direct and useful. {mate.first} writes some of it down.`, effects: [{ rel: { who: 'mate', trust: 6, respect: 5 } }, { conf: 1 }] },
        { weight: 1, text: `It lands as a lecture. {mate.first} thanks you and stays silent for the rest of the trip.`, effects: [{ rel: { who: 'mate', trust: -2 } }, { conf: -1 }] } ] },
      { id: 'joke', label: 'Joke it off and change the subject', risk: 'low', result: `The mood lifts and the confession is quietly buried. Neither of you mentions it again.`, effects: [{ rel: { who: 'mate', trust: -1 } }, { fatigue: -1 }] },
      { id: 'use', label: 'File it away for later use', risk: 'high', result: `You keep it. Later, when the information is useful, you will decide whether to use it. You feel a little worse about yourself.`, effects: [{ rel: { who: 'mate', trust: -2 } }, { conf: -1 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'ali_lose_for_ally', category: 'alliance', title: '{ally.name} Asks You to Lose', weight: 2, cooldownDays: 90, maxPerCareer: 3,
    trigger: { stat: { popularity: { gte: 30 } } }, cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1 },
    slots: { pitch: [`a push the office is thinking about`, `a stretch of poor numbers that needs a spark`, `a contract talk that might end this month`, `a comeback from a long layoff`], payment: [`a favour owed`, `a cut of their next bonus`, `a place in their next big story`] },
    body: [`{ally.name} asks you, quietly, to take a clean loss in your next match. {ally.they} says it will help {pitch}, and offers {payment} in return.`, `It is a fair ask between friends. It's also the kind of loss that stays on the record.`],
    choices: [
      { id: 'lose', label: 'Agree and put them over', risk: 'med', result: `You lose clean and sell it generously. {ally.first} owes you one, and the fans notice that you did not have to.`, effects: [{ rel: { who: 'ally', trust: 10, respect: 8, affinity: 4 } }, { pop: -0.4 }, { conf: -2 }, { money: 4000 }] },
      { id: 'refuse', label: 'Refuse: you need your own wins', risk: 'low', result: `{ally.first} says they understand. The friendship cools a few degrees.`, effects: [{ rel: { who: 'ally', trust: -6, respect: 1 } }, { conf: 2 }] },
      { id: 'compromise', label: 'Offer a draw, or a dirty finish', risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `The finish keeps you both strong. {ally.first} is grateful and impressed, and the crowd is left wanting more.`, effects: [{ rel: { who: 'ally', trust: 5, respect: 5 } }, { pop: 0.3 }] },
        { weight: 1, text: `The finish confuses the audience, and the office wonders why it was changed.`, effects: [{ pop: -0.4 }, { conf: -1 }, { rel: { who: 'ally', trust: 2 } }] } ] },
      { id: 'sell_it', label: 'Agree to lose, but ask for the bigger favour', risk: 'high', result: `You name your price. {ally.first} pays it, but the air between you has a new edge.`, effects: [{ rel: { who: 'ally', trust: -3, respect: -2 } }, { money: 9000 }, { pop: -0.3 }, { conf: -1 }] },
    ],
  },
  {
    id: 'ali_loan_request', category: 'alliance', title: '{ally.name} Needs a Loan', weight: 2, cooldownDays: 100, maxPerCareer: 2,
    trigger: { stat: { money: { gte: 20000 } } }, cast: { ally: { pick: 'tag', tag: 'ally' } },
    slots: { need: [`a medical bill`, `a down payment on a house`, `a second-hand truck`, `a gym lease that is about to lapse`], tone: [`embarrassed`, `proud and tense`, `flat and rehearsed`] },
    body: [`{ally.name} finds you after the show, {tone}, and asks for a loan to cover {need}. {ally.they} has never asked for anything before.`, `The amount is real, though not ruinous. Whether you can ever collect is another question.`],
    choices: [
      { id: 'give', label: 'Lend the full amount, no questions', risk: 'med', result: `You write the cheque. {ally.first} is overcome, and the story is kept between the two of you.`, effects: [{ money: -10000 }, { rel: { who: 'ally', trust: 14, respect: 6, affinity: 8 } }, { conf: 2 }] },
      { id: 'half', label: 'Lend half and set a repayment date', risk: 'low', result: `You make it a business deal. It's practical, and a little cold, and {ally.first} pays the first instalment early.`, effects: [{ money: -5000 }, { rel: { who: 'ally', trust: 6, respect: 5 } }] },
      { id: 'decline', label: 'Decline: you do not mix money and friends', risk: 'low', result: `{ally.first} nods, a bit stiffly. You've kept your money and some of your illusions.`, effects: [{ rel: { who: 'ally', trust: -6, affinity: -3 } }, { conf: 1 }] },
      { id: 'for_favour', label: 'Lend it, but call it a favour owed', risk: 'med', result: `{ally.first} accepts, and understands the terms. Neither of you likes it, but both of you know it's fair.`, effects: [{ money: -8000 }, { rel: { who: 'ally', trust: 1, respect: -1 } }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'ali_jealous_ally', category: 'alliance', title: '{ally.name} Resents Your Push', weight: 2, cooldownDays: 90, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 45 } }, recent: { winsGte: 3 } }, cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1 },
    slots: { sign: [`stopped saving you a seat in catering`, `started answering in single syllables`, `has been "busy" every time you suggest dinner`, `made an offhand joke about "the star"`], timing: [`this week`, `since you won last time out`, `since the posters went up`] },
    body: [`{ally.name} has {sign} {timing}. It is hard to hold against a friend who is stuck while you move, but the chill is real.`, `You can feel the friendship slipping, and the room is paying attention.`],
    choices: [
      { id: 'talk', label: 'Say it out loud, over a meal', risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `It's awkward, then honest. {ally.first} admits to the envy, and you both laugh at how stupid it all is.`, effects: [{ rel: { who: 'ally', trust: 8, respect: 4 } }, { conf: 1 }] },
        { weight: 1, text: `{ally.first} insists nothing is wrong, and eats in silence. The meal ends badly.`, effects: [{ rel: { who: 'ally', trust: -3 } }, { conf: -2 }] } ] },
      { id: 'share', label: 'Use your leverage to open a door for them', risk: 'med', result: `You put in a word with the agent. {ally.first} gets a spot on the next card, and you spend a favour.`, effects: [{ rel: { who: 'ally', trust: 8, respect: 6, affinity: 4 } }, { pop: -0.1 }, { conf: 1 }] },
      { id: 'give_space', label: 'Give them space and stay polite', risk: 'low', result: `You keep the door open and stay out of the way. Over time, the distance holds, and so does the friendship.`, effects: [{ rel: { who: 'ally', trust: -2 } }, { fatigue: -1 }] },
      { id: 'cut', label: 'Cut the dead weight loose', risk: 'high', result: `You end it politely and quickly. It's clean, and it's cold, and it's remembered.`, effects: [{ rel: { who: 'ally', trust: -12, respect: -4, heat: 6 } }, { conf: 2 }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'ali_tag_title_help', category: 'alliance', title: 'The Tag Champions Make an Offer', weight: 2, cooldownDays: 120, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 25 } } }, cast: { champ: { pick: 'champion', class: 'tag' }, mate: { pick: 'roster', sameBrand: true } },
    slots: { terms: [`a shot at the belts in return for a favour`, `a fill-in partner for a title defense`, `a few weeks as an insurance policy`], pace: [`before the next show`, `by Friday`, `by the end of the tour`] },
    body: [`The tag champions, led by {champ.name}, need a favour: {terms}. They want an answer {pace}.`, `{mate.name} overhears and offers to step in if you decline. That's not the same as a guarantee, but it's a quiet push.`],
    choices: [
      { id: 'team', label: 'Team up with the champions', risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.3, charisma: 0.3 }, text: `You fit the system perfectly. The champions hold their belts and you get a rub from the whole run.`, effects: [{ pop: 0.7 }, { rel: { who: 'champ', respect: 6, trust: 4 } }, { fatigue: 6 }] },
        { weight: 1, text: `The chemistry is wrong. You get blamed for a lost fall and spend the week apologising.`, effects: [{ pop: -0.3 }, { conf: -3 }, { rel: { who: 'champ', respect: -2 } }, { fatigue: 6 }] } ] },
      { id: 'pass_to_mate', label: 'Recommend {mate.first} instead', risk: 'low', result: `You get {mate.first} the shot. They are touched, and the champions barely notice who you are.`, effects: [{ rel: { who: 'mate', trust: 8, respect: 4 } }, { pop: -0.1 }, { tag: { who: 'mate', tag: 'ally' } }] },
      { id: 'ask_title', label: 'Ask for the belts, not the favour', risk: 'high', outcomes: [
        { weight: 1, bonus: { confidence: 0.4 }, text: `{champ.first} laughs, then takes you seriously. A title match is added to the next card.`, effects: [{ booking: { who: 'champ', type: 'tag', stakes: 'title' } }, { pop: 0.6 }, { rel: { who: 'champ', respect: 3 } }] },
        { weight: 2, text: `The answer is no. The champions think you're getting above your station.`, effects: [{ rel: { who: 'champ', respect: -4, heat: 6 } }, { conf: -2 }] } ] },
      { id: 'decline', label: 'Decline and keep your options open', risk: 'low', result: `You leave it with a polite thanks. The champions find someone else.`, effects: [{ conf: 1 }, { rel: { who: 'champ', respect: -1 } }] },
    ],
  },
  {
    id: 'ali_split_loyalties', category: 'alliance', title: 'Two Friends, One Dispute', weight: 2, cooldownDays: 80, maxPerCareer: 3,
    trigger: {}, cast: { ally: { pick: 'tag', tag: 'ally' }, other: { pick: 'roster', sameBrand: true } },
    slots: { dispute: [`a locker-room spot by the window`, `a missed payment from a shared van`, `who gets the better entrance music`, `who said what about whose family`], venue: [`in the hallway`, `at the hotel bar`, `in the ring after rehearsal`, `in front of the booker`] },
    body: [`{ally.name} and {other.name} are arguing about {dispute} {venue}. They both look at you at once.`, `You like both of them. One of them is a friend, and one of them is just as good a wrestler.`],
    choices: [
      { id: 'side_ally', label: 'Side with {ally.first}, loudly', risk: 'med', result: `{ally.first} gets the support and {other.first} gets the cold shoulder. You earn gratitude and an enemy.`, effects: [{ rel: { who: 'ally', trust: 8, affinity: 4 }, }, { rel: { who: 'other', heat: 8, respect: -4 } }, { conf: 1 }] },
      { id: 'side_other', label: 'Side with {other.first}, because they are right', risk: 'high', result: `You tell the truth, and it costs you some warmth. {other.first} thanks you, and {ally.first} does not.`, effects: [{ rel: { who: 'ally', trust: -8, heat: 6 } }, { rel: { who: 'other', respect: 8, trust: 5 } }, { conf: 2 }] },
      { id: 'mediate', label: 'Mediate and find a compromise', risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `You hear both sides, and the compromise lands. Everyone leaves less angry than they arrived.`, effects: [{ rel: { who: 'ally', trust: 3, respect: 3 } }, { rel: { who: 'other', respect: 4, trust: 3 } }, { pop: 0.2 }, { fatigue: 3 }] },
        { weight: 1, text: `Neither accepts it and both think you are dodging. You are late to your own warm-up.`, effects: [{ rel: { who: 'ally', trust: -2 } }, { rel: { who: 'other', trust: -2 } }, { fatigue: 4 }] } ] },
      { id: 'stay_out', label: 'Stay out of it entirely', risk: 'low', result: `You step back and raise your hands. Both think less of you for it, but neither has a grievance.`, effects: [{ rel: { who: 'ally', trust: -2 } }, { rel: { who: 'other', trust: -1 } }, { conf: -1 }] },
    ],
  },
  {
    id: 'ali_rumble_pact', category: 'alliance', title: 'A Pact Before the Rumble', weight: 3, cooldownDays: 200, maxPerCareer: 2,
    trigger: { eventWithin: { id: 'royal_rumble', days: 21 }, stat: { popularity: { gte: 25 } } }, cast: { mate: { pick: 'roster', sameBrand: true, tier: { gte: 1 } } },
    slots: { terms: [`never eliminate each other until the very end`, `watch each other's backs for the first ten minutes`, `swap numbers and call the winner`], place: [`the locker room`, `the weight room`, `the arena stairwell`] },
    body: [`In {place}, {mate.name} proposes a pact for the Rumble: {terms}. "Two sets of eyes," {mate.they} says.`, `Pacts are common before the match and rare after the bell. Everybody in the entry list has a reason to forget one.`],
    choices: [
      { id: 'swear', label: 'Swear to the pact and mean it', risk: 'med', result: `You shake hands. If either of you breaks it, the whole locker room will know.`, effects: [{ event: { type: 'alliance_formed', participants: ['mate'], summary: `Made a Royal Rumble pact with {mate.name}.`, data: {} } }, { rel: { who: 'mate', trust: 8, respect: 4 } }, { promise: { kind: 'win_rumble', text: `I will make the Rumble count`, deadlineDays: 40 } }] },
      { id: 'lie', label: 'Agree, and plan to break it', risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `You smile, shake and plan. On the night, you turn on {mate.first} at the perfect moment, and it works.`, effects: [{ pop: 0.7 }, { rel: { who: 'mate', trust: -12, heat: 10 } }, { conf: 2 }] },
        { weight: 1, text: `{mate.first} was planning the same thing. You both get eliminated at once, in the most embarrassing way.`, effects: [{ pop: -0.4 }, { conf: -3 }, { rel: { who: 'mate', heat: 6 } }] } ] },
      { id: 'no_pact', label: 'Decline: every man for himself', risk: 'low', result: `You keep it clean. The match is yours alone to survive.`, effects: [{ conf: 2 }, { rel: { who: 'mate', respect: 1 } }] },
      { id: 'counter_pact', label: 'Counter: a pact to gang up on the favourite', risk: 'med', result: `You pick a target and a plan. The idea spreads through the locker room, and half a dozen others join in.`, effects: [{ pop: 0.4 }, { rel: { who: 'mate', trust: 4, respect: 3 } }, { fatigue: 3 }] },
    ],
  },
  {
    id: 'ali_hidden_injury', category: 'alliance', title: '{ally.name} Is Hiding an Injury', weight: 2, cooldownDays: 80, maxPerCareer: 3,
    trigger: {}, cast: { ally: { pick: 'tag', tag: 'ally' }, doc: { pick: 'staff', role: 'doctor' } },
    slots: { sign: [`a wince every time they bend`, `a brace hidden under their pants`, `a pale face before the bell`, `an unusual fear of the top rope`], risk: [`a torn rib`, `a bad shoulder`, `a damaged knee`, `a concussion that has not cleared`] },
    body: [`You notice {sign}, and then {ally.name} confesses: it is {risk}, and nobody in the office knows. "If they find out, I'm benched," {ally.they} says.`, `{doc.name} is on duty tonight. You could say one word and it would all be over, or say nothing and let your friend decide.`],
    choices: [
      { id: 'keep', label: 'Keep it quiet and cover for them', risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.3 }, text: `You help {ally.first} hide it for the week. The injury heals enough to work, and the trust deepens.`, effects: [{ rel: { who: 'ally', trust: 12, respect: 5 } }, { fatigue: 4 }] },
        { weight: 1, text: `{ally.first} goes down in the ring and the truth comes out. You are named as the person who knew.`, effects: [{ rel: { who: 'ally', trust: 4 } }, { pop: -0.5 }, { conf: -3 }, { money: -2000 }] } ] },
      { id: 'tell_doc', label: 'Take it to {doc.first}', risk: 'med', result: `{doc.first} examines {ally.first} and benches them for a month. They are furious and grateful and mostly furious.`, effects: [{ rel: { who: 'ally', trust: -6, respect: 3 } }, { conf: 1 }, { pop: 0.1 }] },
      { id: 'push_rest', label: 'Convince them to rest voluntarily', risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `{ally.first} agrees and takes the weekend. The injury turns out to be less bad than it could have been.`, effects: [{ rel: { who: 'ally', trust: 8, respect: 4 } }, { conf: 1 }] },
        { weight: 1, text: `{ally.first} insists they are fine and works the show anyway. You can only watch.`, effects: [{ rel: { who: 'ally', trust: -2 } }, { fatigue: 2 }] } ] },
      { id: 'take_load', label: 'Take their spot on the card yourself', risk: 'med', result: `You volunteer to cover. It's a heavy week and a big favour, and {ally.first} will not forget either.`, effects: [{ fatigue: 12 }, { rel: { who: 'ally', trust: 10, respect: 8, affinity: 5 } }, { pop: 0.3 }] },
    ],
  },
  {
    id: 'ali_end_partnership', category: 'alliance', title: 'The Partnership Has Run Its Course', weight: 2, cooldownDays: 100, maxPerCareer: 2,
    trigger: { stat: { matches: { gte: 25 } } }, cast: { ally: { pick: 'tag', tag: 'ally' }, creative: { pick: 'staff', role: 'creative' } },
    slots: { sign: [`ticket sales that no longer move`, `a stale routine`, `diverging ambitions`, `a comment from a vet about "that old act"`], style: [`quietly`, `with a handshake`, `with a bang`] },
    body: [`{creative.name} says it out loud: the act with {ally.name} is going stale, and the signs are there in {sign}. The office wants to split you up, and would like it done {style}.`, `{ally.first} is waiting for your reaction before reading the script.`],
    choices: [
      { id: 'split', label: 'Split up on friendly terms', risk: 'low', result: `You and {ally.first} shake hands in the ring. The crowd gives you a standing ovation, and the office books your next steps.`, effects: [{ rel: { who: 'ally', trust: 5, respect: 6, affinity: 2 } }, { pop: 0.4 }, { conf: 1 }] },
      { id: 'betray_split', label: 'Split with a nasty turn', risk: 'high', result: `You turn on {ally.first} with a fury the crowd loves. The friendship ends in anger, and the feud begins.`, effects: [{ event: { type: 'betrayal', participants: ['ally'], summary: `Ended a partnership with {ally.name} on a betrayal.`, importance: 3, data: { context: 'tag_partner', byPlayer: true } } }, { pop: 1.0 }, { rivalry: { who: 'ally', heat: 14 } }] },
      { id: 'fight_to_stay', label: 'Pitch a fresh version of the act', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, mic: 0.3 }, text: `Your new pitch convinces {creative.name}. The act stays together with a tweak that actually works.`, effects: [{ pop: 0.5 }, { rel: { who: 'ally', trust: 6, respect: 4 } }, { fatigue: 4 }] },
        { weight: 1, text: `The pitch is too similar to the old act. {creative.name} politely waves it off.`, effects: [{ conf: -2 }, { rel: { who: 'ally', trust: 1 } }] } ] },
      { id: 'ask_out', label: 'Ask to be moved to the other show', risk: 'med', result: `{creative.name} agrees to look at it. Your partner is left behind, and you are somewhere new.`, effects: [{ rel: { who: 'ally', trust: -4 } }, { conf: 1 }, { pop: 0.2 }, { fatigue: 3 }] },
    ],
  },
  {
    id: 'ali_cross_brand_favour', category: 'alliance', title: 'A Favour from {mate.name}', weight: 2, cooldownDays: 80, maxPerCareer: 3,
    trigger: { stat: { popularity: { gte: 30 } } }, cast: { mate: { pick: 'roster', tier: { gte: 1, lte: 3 } }, gm: { pick: 'staff', role: 'gm' } },
    slots: { favor: [`a word to {gm.name} about a better spot`, `a spot on your show for a one-off`, `a shot at a mid-card match`, `a ride to the airport and an introduction`], reason: [`sinking numbers on another brand`, `a creative reboot`, `a personality clash with a boss`] },
    body: [`{mate.name} asks you for {favor}. It's connected to {reason}, and {mate.they} would otherwise never have asked.`, `Putting in a good word costs you nothing but credit with {gm.name}. The only question is whether {mate.they} deserves it.`],
    choices: [
      { id: 'vouch', label: 'Vouch for {mate.first} wholeheartedly', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{gm.name} listens and agrees. {mate.first} gets the opening, and you gain an ally on the other side.`, effects: [{ rel: { who: 'mate', trust: 8, respect: 5 } }, { tag: { who: 'mate', tag: 'ally' } }, { pop: 0.1 }] },
        { weight: 1, text: `{gm.name} has other plans and takes your word as a sign you are meddling.`, effects: [{ rel: { who: 'mate', trust: 3 } }, { pop: -0.3 }, { conf: -1 }] } ] },
      { id: 'lukewarm', label: 'Mention it lightly and leave it there', risk: 'low', result: `You mention it in passing. Nothing happens, but nobody is annoyed.`, effects: [{ rel: { who: 'mate', trust: 1 } }] },
      { id: 'price', label: 'Do it, for a price', risk: 'med', result: `{mate.first} pays you back in cash and a promise. The favour works, but it cheapens the relationship.`, effects: [{ money: 5000 }, { rel: { who: 'mate', trust: -2, respect: -2 } }, { conf: -1 }] },
      { id: 'refuse', label: 'Refuse. You do not trade credit', risk: 'low', result: `You turn {mate.first} down politely. It does not make a friend, but it saves the credit.`, effects: [{ rel: { who: 'mate', trust: -3 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'ali_corner_offer', category: 'alliance', title: '{ally.name} Wants to Be in Your Corner', weight: 2, cooldownDays: 90, maxPerCareer: 3,
    trigger: { eventWithin: { kind: 'ple', days: 12 }, stat: { popularity: { gte: 30 } } }, cast: { ally: { pick: 'tag', tag: 'ally' }, rival: { pick: 'rivalry', minHeat: 15 } },
    slots: { reason: [`to keep {rival.name}'s allies honest`, `because you need a second pair of eyes`, `to make a statement to the office`], risk: [`the referee might not like it`, `a distraction could cost you the match`, `the bookers may use it for a swerve`] },
    body: [`{ally.name} volunteers to stand at ringside for your match with {rival.name} {reason}. "I owe you," {ally.they} says, and it is not an empty promise.`, `It's a good gesture, and a complication: {risk}.`],
    choices: [
      { id: 'accept', label: 'Accept the corner man', risk: 'low', result: `{ally.first} walks you out. The crowd pops, and so does the rival's temper.`, effects: [{ pop: 0.4 }, { rel: { who: 'ally', trust: 6, respect: 4 } }, { rel: { who: 'rival', heat: 5 } }] },
      { id: 'swerve', label: 'Accept, and plan a swerve', risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `You turn it on its head: {ally.first} neutralises the rival's helper at the perfect moment. The finish earns a roar.`, effects: [{ pop: 0.9 }, { rel: { who: 'ally', trust: 3 } }, { rivalry: { who: 'rival', heat: 6 } }] },
        { weight: 1, text: `{ally.first} misses the cue. The match is a mess and the booker is not impressed.`, effects: [{ pop: -0.5 }, { conf: -3 }, { rel: { who: 'ally', trust: -2 } }] } ] },
      { id: 'decline', label: 'Decline: this one is yours alone', risk: 'low', result: `You face {rival.first} by yourself. The crowd respects it, and so does the rival.`, effects: [{ conf: 3 }, { rel: { who: 'rival', respect: 3 } }, { rel: { who: 'ally', trust: -1 } }] },
      { id: 'send_away', label: 'Send them to watch the rival\'s corner instead', risk: 'med', result: `{ally.first} agrees. The assignment keeps the other side honest, and it is dull work.`, effects: [{ rel: { who: 'ally', trust: 3, respect: 2 } }, { rel: { who: 'rival', respect: -2 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'ali_old_partner_reunion', category: 'alliance', title: 'The Old Partner Wants a Reunion', weight: 2, cooldownDays: 150, maxPerCareer: 2,
    trigger: { mem: [{ role: 'ex', tag: 'reconciled' }] }, cast: { ex: { pick: 'tag', tag: 'reconciled' } }, memory: { role: 'ex', max: 2 },
    slots: { occasion: [`a retirement tribute`, `a special house show`, `a slow week for the card`, `a milestone anniversary`], spin: [`a one-night return of the old act`, `a quiet charity match`, `an angle where you stand together again`] },
    body: [`{ex.name} comes to you with an idea: {spin}, built around {occasion}. After everything that happened, the offer almost hurts.`, `The fans would eat it up. The old pain is still sitting there under the surface.`],
    choices: [
      { id: 'reunite', label: 'Reunite for one night', risk: 'low', result: `You step into the ring together. Neither of you says a word, because the crowd says it for you.`, effects: [{ event: { type: 'alliance_formed', participants: ['ex'], summary: `Reunited with {ex.name} for a special night.`, data: {} } }, { pop: 0.8 }, { rel: { who: 'ex', trust: 6, affinity: 6 } }, { fatigue: 4 }] },
      { id: 'build', label: 'Ask for more than a one-off', risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `{ex.first} agrees. It's the beginning of a longer run, and a softer relationship than before.`, effects: [{ pop: 0.6 }, { rel: { who: 'ex', trust: 8, respect: 4 } }, { flag: 'allied_recently' }] },
        { weight: 1, text: `{ex.first} wanted a night, not a season. The talk ends politely and coldly.`, effects: [{ rel: { who: 'ex', trust: -3 } }, { conf: -1 }] } ] },
      { id: 'decline', label: 'Decline: it cannot be undone', risk: 'low', result: `You thank {ex.first} and mean it. The scars are still too fresh, and the offer goes quietly away.`, effects: [{ rel: { who: 'ex', trust: -2, respect: 1 } }, { conf: 1 }] },
      { id: 'twist', label: 'Pitch a swerve instead of a reunion', risk: 'high', result: `You put a twist on it. {ex.first} is not pleased, but the booking team loves it.`, effects: [{ pop: 0.8 }, { rel: { who: 'ex', trust: -8, heat: 8 } }, { rivalry: { who: 'ex', heat: 10 } }] },
    ],
  },
];
