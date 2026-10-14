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
        { weight: 2, bonus: { charisma: 0.5 }, text: `The deal holds. {rival.first} keeps quiet and the rumor mill gets nothing to chew on.`, effects: [{ rivalry: { who: 'rival', heat: -8 } }, { rel: { who: 'rival', respect: 4, trust: 3 } }] },
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
    slots: { offer: [`an envelope with real money in it`, `a cut of the payday`, `a spot on the better house shows and a bonus to match`, `a favor you can cash in later and a fat envelope to go with it`], deadline: [`by Friday`, `before the card is finalized`, `before tonight's show`, `before the contracts go out`] },
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
    trigger: { mem: [{ role: 'rival', h2h: { matchesGte: 2 }, last: { within: 2 } }] }, cast: { rival: { pick: 'rivalry', minHeat: 15 } }, memory: { role: 'rival', max: 2 },
    slots: { setting: [`the gorilla position`, `the back of the ring truck`, `the trainers' room`, `the tunnel`], gesture: [`holds out a taped hand`, `offers you a towel without a word`, `nods once from across the room`, `pulls you into a short, hard hug`] },
    body: [`The towels are bloody and the ribs are screaming. In {setting}, {rival.name} {gesture}, and the whole crew pretends not to see it.`, `Two people who have spent this feud trying to hurt each other just made something that the fans will remember. Whether you let it show is up to you.`],
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
      { id: 'win_vow', label: 'Promise to beat {rival.them}, loudly', risk: 'med', result: `You say it into the microphone and mean it. The crowd roars. If you lose, it will be remembered, too.`, effects: [{ promise: { kind: 'win_match', who: 'rival', text: `I will beat {rival.name} when it counts`, deadlineDays: 60 } }, { pop: 0.7 }, { conf: 3 }, { rivalry: { who: 'rival', heat: 8 } }] },
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
    slots: { place: [`a hospital waiting room`, `an airport gate at 5 a.m.`, `a diner two hours from the arena`, `the empty ring before doors`], news: [`a mutual friend's retirement`, `a bad night of injuries on the card`, `a storm that closed the roads`, `a long delay that stranded half the roster`] },
    body: [`You and {rival.name} wind up alone in {place}, thrown together by {news}. For a minute, neither of you says anything.`, `Then {rival.first} speaks first. "I am tired of hating you. Are you?" It is not clear if this is an olive branch or a trap.`],
    choices: [
      { id: 'forgive', label: 'Put the feud down for good', risk: 'low', result: `It is a quiet scene. You trade stories until the room starts to fill up around you. By morning, the feud is a memory.`, effects: [{ event: { type: 'reconciliation', participants: ['rival'], summary: `Made peace with {rival.name} after a long feud.`, data: { formerRival: true } } }, { rivalry: { who: 'rival', heat: -20 } }, { pop: -0.3 }, { conf: 2 }] },
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
    slots: { move: [`a missed dive`, `a botched powerbomb`, `a chair shot that landed higher than planned`, `a slip off the second rope`], aftermath: [`is being helped to the back by two trainers`, `is sitting on the apron with a towel pressed to a cut`, `has gone very quiet in the trainers' room`, `is being checked by the doctor, who will not say a word`] },
    body: [`You and {opp.name} stayed behind after the show to run through next week's finish in the empty ring. The rehearsal ended early after {move}, and {opp.name} {aftermath}. You know exactly what you did, and you also know the story will grow in the retelling.`, `The agent asks what happened. Everybody still in the building is watching your face for the answer.`],
    choices: [
      { id: 'visit', label: 'Go check on {opp.them}, in front of everyone', risk: 'low', result: `You walk into the trainers' room with your head down. {opp.first} gives a small nod. It is the right thing, and costs you the rest of the night.`, effects: [{ rel: { who: 'opp', respect: 6, trust: 5, heat: -4 } }, { fatigue: 4 }, { conf: -1 }] },
      { id: 'own_it', label: 'Take the blame in front of the agent', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `Management values the honesty. The incident is filed as an accident, and your name is clean.`, effects: [{ pop: 0.2 }, { rel: { who: 'opp', respect: 4, trust: 3 } }, { conf: 1 }] },
        { weight: 1, text: `It goes badly. The report names you, and for two weeks people check the knots in your boot laces when you walk by.`, effects: [{ pop: -0.5 }, { conf: -4 }, { rel: { who: 'opp', respect: 2 } }] } ] },
      { id: 'blame_gear', label: 'Blame the ring and stay quiet about the rest', risk: 'med', result: `The ring crew gets the lecture instead of you. Nobody can prove otherwise, but {opp.first} knows what really happened.`, effects: [{ conf: 2 }, { rel: { who: 'opp', trust: -6, respect: -3 } }, { tag: { who: 'opp', tag: 'reluctant' } }] },
      { id: 'sell_it', label: 'Use it: play the cold villain next week', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: `You play the cold villain on the next show, with a perfectly straight face. The audience eats it up, and the office loves the heat.`, effects: [{ pop: 0.9 }, { rel: { who: 'opp', heat: 14, respect: -4 } }, { rivalry: { who: 'opp', heat: 12 } }] },
        { weight: 2, text: `It reads as callous. The injured wrestler's friends do not forget it, and the fans do not forgive it.`, effects: [{ pop: -0.8 }, { conf: -3 }, { rel: { who: 'opp', heat: 12, respect: -6 } }] } ] },
    ],
  },
  {
    id: 'riv_mind_games', category: 'rivalry', title: 'Mind Games Before the Big Night', weight: 2, cooldownDays: 70, maxPerCareer: 3, contexts: ['pre_show', 'show_day', 'weekly'],
    trigger: { rivalry: { minHeat: 25 }, stat: { losses: { gte: 1 } }, eventWithin: { kind: 'ple', days: 10 } }, cast: { rival: { pick: 'rivalry', minHeat: 25 } },
    slots: { stunt: [`taped a photo of your last loss inside your locker`, `moved your bags to the cold end of the hall`, `told the whole catering line you are limping`, `left a pair of knee pads wrapped as a gift on your bench`], bait: [`You were in a perfectly good mood this morning.`, `You had planned a quiet pre-show meal.`, `Your gear bag was already packed and zipped.`, `You had just started to feel loose.`] },
    body: [`{rival.name} has been working on you since the arena doors opened. First {rival.they} {stunt}, then called across the hall to ask whether you slept well, and now the whole locker room waits to see what you do. {bait}`, `Reacting is a bad idea, and looking like you did not notice is a worse one.`, `"Nothing to say?" {rival.they} asks the hallway, to nobody and everybody.`],
    choices: [
      { id: 'ignore', label: 'Ignore it and keep your head down', risk: 'low', result: `You warm up in silence. {rival.first} does not get the reaction, and you get a better night than you expected.`, effects: [{ conf: 3 }, { fatigue: -2 }, { rel: { who: 'rival', respect: 2 } }] },
      { id: 'mirror', label: 'Return the favor, harder', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `Your counter is cruel and funny, and the whole hallway repeats it by midnight. {rival.first} stops grinning.`, effects: [{ pop: 0.5 }, { conf: 3 }, { rivalry: { who: 'rival', heat: 8 } }] },
        { weight: 1, text: `It lands wrong and the producer drags you both into the hallway. You look like the instigator.`, effects: [{ pop: -0.4 }, { conf: -3 }, { fatigue: 3 }, { rel: { who: 'rival', heat: 8 } }] } ] },
      { id: 'laugh', label: 'Laugh it off in front of the crew', risk: 'med', result: `You make a joke of it, and the crew laughs with you. The sting wears off, though you stay on edge for the main event.`, effects: [{ conf: 1 }, { pop: 0.2 }, { fatigue: 2 }] },
      { id: 'report', label: 'Report it to the producer', risk: 'low', result: `The producer promises to talk to {rival.first}. You win the argument and lose some of the hallway's respect.`, effects: [{ conf: 2 }, { pop: -0.2 }, { rel: { who: 'rival', respect: -3, heat: 4 } }] },
    ],
  },
  {
    id: 'riv_card_position', category: 'rivalry', title: 'The Spot on the Card', weight: 2, cooldownDays: 60, maxPerCareer: 3,
    trigger: { stat: { popularity: { gte: 25 } } }, cast: { rival: { pick: 'rivalry', minHeat: 15 }, agent: { pick: 'staff', role: 'agent' } },
    slots: { slot: [`the opener`, `the end-of-hour slot`, `the semi-main`, `the last slot before intermission`], reason: [`a ratings dip`, `a sponsor request`, `a hot angle`, `a last-minute injury`] },
    body: [`{agent.name} has the running order and a problem: because of {reason}, only one of you can have {slot}. {rival.name} has already walked into the office to argue for it.`, `If you take it, you are the one in the light tonight. If you give it up, there will be a favor owed, one way or the other.`],
    choices: [
      { id: 'fight', label: 'Fight for the spot with the agent', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.4, charisma: 0.3 }, text: `You make a clean case and {agent.name} gives you the slot. {rival.first} stalks out of the office.`, effects: [{ pop: 0.5 }, { rel: { who: 'rival', heat: 8, respect: -2 } }, { conf: 2 }] },
        { weight: 1, text: `{agent.name} sides with {rival.first} and tells you your pitch was loud but empty.`, effects: [{ conf: -3 }, { rel: { who: 'rival', respect: 3 } }, { pop: -0.2 }] } ] },
      { id: 'give', label: 'Give the spot, ask for a favor back', risk: 'low', result: `You let {rival.first} have it. The agent notes that you are easy to work with, and {rival.first} knows exactly how much it cost.`, effects: [{ rel: { who: 'rival', respect: 5, trust: 4, heat: -6 } }, { conf: -1 }, { pop: -0.2 }, { money: 2000 }] },
      { id: 'split', label: 'Suggest a spot swap next week', risk: 'low', result: `A compromise the agent can live with. Neither of you is thrilled, but the show goes on.`, effects: [{ rel: { who: 'rival', heat: -3 } }, { conf: 1 }] },
      { id: 'sabotage_slot', label: 'Leak that your rival is nursing an injury', risk: 'high', result: `The agent pulls {rival.first} off the spot and gives it to you. When {rival.they} finds out who talked, it will not stay quiet.`, effects: [{ pop: 0.4 }, { conf: 1 }, { rel: { who: 'rival', heat: 14, trust: -10 } }, { rivalry: { who: 'rival', heat: 12 } }, { obligation: { kind: 'confront_backstage', who: 'rival', inDays: 6 } }] },
    ],
  },
  {
    id: 'riv_champ_deal', category: 'rivalry', title: 'A Deal from the Champion', weight: 2, cooldownDays: 100, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 40 }, overall: { gte: 55 } }, holdsTitle: false }, cast: { champ: { pick: 'champion', class: 'world' } },
    slots: { venue: [`the champion's private locker room`, `a rented office behind the arena`, `the production truck`, `a hotel suite`], price: [`a clean loss when we first meet`, `a favor on a night of my choosing`, `a slice of your merchandise income`] },
    body: [`{champ.name} invites you to {venue} and gets straight to it. "You are on your way up, and I can open the door. In return, I want {price}."`, `"Think of it as an investment," {champ.first} adds. A straightforward business offer from the most powerful person on the roster, it also says plenty about what {champ.they} thinks of you.`],
    choices: [
      { id: 'take', label: 'Take the deal', risk: 'med', result: `You shake on it. The door does open, but you owe now, and {champ.first} reminds you with a look every time you meet.`, effects: [{ pop: 0.8 }, { money: 8000 }, { conf: -2 }, { rel: { who: 'champ', trust: -3, respect: 2 } }, { flag: 'owes_champion' }] },
      { id: 'decline', label: 'Decline: you will earn it', risk: 'low', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: `{champ.first} studies you for a long moment, then nods. "Good. Then earn it." You feel taller walking out.`, effects: [{ conf: 5 }, { rel: { who: 'champ', respect: 6 } }, { pop: 0.2 }] },
        { weight: 1, text: `{champ.first} shrugs. "Your loss." The door closes, and for a month the schedule feels colder.`, effects: [{ rel: { who: 'champ', respect: -2, heat: 4 } }, { conf: 1 }, { pop: -0.2 }] } ] },
      { id: 'bargain', label: 'Counter-offer: a title match instead', risk: 'med', result: `Surprised, {champ.first} agrees to a title match of their own if you can win something first. You walk away with a promise, not a handshake.`, effects: [{ promise: { kind: 'win_match', who: 'champ', text: `I will beat {champ.name} on my terms`, deadlineDays: 90 } }, { rel: { who: 'champ', respect: 3, heat: 4 } }, { conf: 2 }] },
      { id: 'leak', label: 'Walk out and tell the locker room', risk: 'high', result: `The story is all over the roster by midnight. Management is embarrassed and the champion is furious. Some of the veterans quietly like you for it.`, effects: [{ pop: 0.5 }, { rel: { who: 'champ', heat: 16, respect: -3 } }, { rivalry: { who: 'champ', heat: 12 } }, { conf: 2 }] },
    ],
  },
  {
    id: 'riv_cocky_prospect', category: 'rivalry', title: 'The Rookie Who Will Not Back Down', weight: 2, cooldownDays: 70, maxPerCareer: 3,
    trigger: { stat: { overall: { gte: 50 } } }, cast: { kid: { pick: 'roster', tier: { lte: 1 }, sameBrand: true } },
    slots: { trigger_line: [`told a reporter that you are living off old moves`, `kept calling you by the wrong name in the locker room`, `pinned a photo of you with a clown nose on the board`, `interrupted your warm-up to ask for a match`], witness: [`a table of veterans`, `the entire production crew`, `three developmental hopefuls`, `an agent who is also watching`] },
    body: [`{kid.name} has been loud lately. Today {kid.they} {trigger_line} in front of {witness}, and now the room is waiting to see what you do.`, `You have two options: crush the kid or help the kid. Neither one will be forgotten.`],
    choices: [
      { id: 'humble', label: 'Put the rookie in {kid.their} place, quietly', risk: 'med', outcomes: [
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
    slots: { slight: [`thinks you skipped too many steps`, `dislikes how you handled a jobber the other night`, `has heard you complain about a spot`, `just does not like your style`], arena: [`in the ring after the show`, `in the middle of catering`, `at a hotel breakfast`, `outside the gorilla position`] },
    body: [`{legend.name} stops you {arena}. The veteran {slight}, and says so in a voice that carries well beyond the two of you.`, `There is history in this room that you were not a part of. {legend.first} is waiting for a response, and so is everyone else.`],
    choices: [
      { id: 'listen', label: 'Listen and ask what you should change', risk: 'low', outcomes: [
        { weight: 2, bonus: { overall: 0.3, charisma: 0.3 }, text: `{legend.first} is thrown by the humility, then gives you a real answer. You walk away with a list and a half-friend.`, effects: [{ rel: { who: 'legend', respect: 6, trust: 4, heat: -6 } }, { attr: { name: 'psychology', delta: 1 } }, { conf: -1 }] },
        { weight: 1, text: `{legend.first} treats it as weakness and lectures you for ten minutes with an audience.`, effects: [{ conf: -4 }, { pop: -0.2 }, { rel: { who: 'legend', respect: -1 } }] } ] },
      { id: 'push_back', label: 'Push back politely but firmly', risk: 'med', result: `You make your case without raising your voice. {legend.first} does not agree, but some of the locker room does.`, effects: [{ conf: 3 }, { rel: { who: 'legend', respect: 1, heat: 6 } }, { pop: 0.2 }] },
      { id: 'prove', label: 'Challenge {legend.them} to prove it in the ring', risk: 'high', result: `{legend.first} smiles for the first time. The office is delighted and the match is made.`, effects: [{ booking: { who: 'legend', type: 'singles' } }, { rivalry: { who: 'legend', heat: 16 } }, { pop: 0.8 }, { fatigue: 5 }] },
      { id: 'avoid', label: 'Avoid {legend.them} and stay out of the way', risk: 'low', result: `It works for a while. {legend.first} takes it as proof that you have no answer.`, effects: [{ rel: { who: 'legend', respect: -4 } }, { conf: -2 }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'riv_loss_gloat', category: 'rivalry', title: '{rival.name} Gloats After the Loss', weight: 3, cooldownDays: 45, maxPerCareer: 4, contexts: ['post_match', 'weekly'],
    trigger: { daysSince: { match: { lte: 3 } }, mem: [{ role: 'rival', last: { result: 'loss', within: 3 } }] }, cast: { rival: { pick: 'rivalry', minHeat: 15 } }, memory: { role: 'rival', max: 2, allow: ['you_beat_me', 'clean_losses', 'controversial_finish', 'old_insult', 'you_betrayed_me', 'i_betrayed_you', 'broken_promise'] },
    slots: { how: [`leaving a tube of hand cream in your bag`, `holding an imaginary microphone`, `clapping slowly from the monitor`, `sending a mocking note on the catering menu`], audience: [`a crowd of crew members`, `two agents`, `three younger wrestlers`, `an interviewer with a camera`] },
    body: [`The loss still stings, and {rival.name} cannot leave it alone. "Tough break," {rival.they} says, enjoying it by {how} in front of {audience}.`, `You can respond now, or turn it into fuel. Anything you say will travel.`],
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
      { id: 'refuse', label: 'Refuse to team with {rival.them}', risk: 'med', result: `You dig in. {creative.name} files a note about your attitude, but nobody forces the issue.`, effects: [{ conf: 2 }, { pop: -0.4 }, { rel: { who: 'rival', respect: 2 } }, { money: -2000 }] },
      { id: 'twist', label: 'Pitch a betrayal for the finish', risk: 'med', result: `{creative.name} grins, because that is exactly where the story was heading. You will have to deliver it, and so will the rival.`, effects: [{ booking: { who: 'rival', type: 'tag' } }, { rel: { who: 'rival', heat: 6 } }, { pop: 0.4 }, { flag: 'planned_turn' }] },
    ],
  },
  {
    id: 'riv_apology_trap', category: 'rivalry', title: 'Is {rival.name} Sorry, or Setting a Trap?', weight: 2, cooldownDays: 90, maxPerCareer: 2,
    trigger: { rivalry: { minHeat: 30 } }, cast: { rival: { pick: 'rivalry', minHeat: 30 } }, memory: { role: 'rival', max: 2 },
    slots: { how: [`a handwritten note`, `a long voicemail`, `a card left on your bench`, `a message passed through a trainer`], where: [`behind the venue`, `in a deserted hallway`, `in the empty ring`, `at an after-hours diner`] },
    body: [`The apology arrives by way of {how}, and it asks you to meet {where} after the show. {rival.name} sounds sincere. {rival.first} also sounds like a person who knows how to sound sincere.`, `If it is real, it ends a feud. If it is a trap, it wins one.`],
    choices: [
      { id: 'go_alone', label: 'Go alone and hear {rival.them} out', risk: 'high', outcomes: [
        { weight: 1, bonus: { confidence: 0.3 }, text: `It is real. {rival.first} admits it all and the feud loses its teeth.`, effects: [{ event: { type: 'reconciliation', participants: ['rival'], summary: `{rival.name} apologized and the feud ended in a quiet talk.`, data: { formerRival: true } } }, { rivalry: { who: 'rival', heat: -18 } }, { conf: 3 }] },
        { weight: 1, text: `It was a trap. Two of {rival.first}'s friends step out of the dark. You get out of there with a bruised pride and a split lip.`, effects: [{ fatigue: 6 }, { conf: -4 }, { rivalry: { who: 'rival', heat: 14 } }, { rel: { who: 'rival', heat: 12 } }, { injury: { part: 'arms', severity: 1, days: 6 } }] } ] },
      { id: 'bring_witness', label: 'Go, but bring a trusted witness', risk: 'low', result: `With a witness at your side, nothing bad happens, and nothing good does either. Both of you keep your cards close.`, effects: [{ rel: { who: 'rival', trust: 2, heat: -5 } }, { conf: 1 }] },
      { id: 'public', label: 'Demand the apology on live television', risk: 'med', result: `{rival.first} refuses. The crowd shrugs, but you get your chance to look like the bigger person.`, effects: [{ pop: 0.5 }, { rel: { who: 'rival', heat: 8, respect: -2 } }, { rivalry: { who: 'rival', heat: 6 } }] },
      { id: 'ignore', label: 'Ignore it completely', risk: 'low', result: `You let it go unanswered. Nobody gets hurt and nothing gets resolved.`, effects: [{ conf: 1 }, { rel: { who: 'rival', heat: 3 } }] },
    ],
  },
  {
    id: 'riv_house_show_hecklers', category: 'rivalry', title: 'A House Show That Got Personal', weight: 2, cooldownDays: 50, maxPerCareer: 4,
    trigger: { rivalry: { minHeat: 20 }, stat: { fatigue: { lte: 80 } } }, cast: { rival: { pick: 'rivalry', minHeat: 20 } },
    slots: { town: [`a small coastal arena`, `a county fair building`, `a college gym`, `a half-lit hockey rink`], twist: [`a front-row fan with a sign about your family`, `a chant of the rival's name that will not stop`, `a power cut halfway through your entrance`, `a ring that rocks with every bump`] },
    body: [`The crowd in {town} is half-full and fully drunk, and the night has {twist}. {rival.name} is across the ring, grinning, waiting to see how you handle it.`, `No cameras and no boss, only a few hundred people who will tell the story forever.`],
    choices: [
      { id: 'play_up', label: 'Play to the crowd and lean into it', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `You turn it into theater. The crowd roars, the rival gives in, and the finish gets a standing ovation.`, effects: [{ pop: 0.7 }, { conf: 2 }, { fatigue: 4 }] },
        { weight: 1, text: `The more you push, the more the crowd roars back. You finish the match flustered.`, effects: [{ pop: -0.2 }, { conf: -2 }, { fatigue: 5 }] } ] },
      { id: 'protect', label: 'Protect the match and hit your spots', risk: 'low', result: `You shut out the noise and work the plan. It is a pro job, and a quiet one.`, effects: [{ rel: { who: 'rival', respect: 4 } }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'break_script', label: 'Break script and settle the score', risk: 'high', result: `You go off the plan and put hands on {rival.first}. The match ends badly and the promoter's face is tight.`, effects: [{ rivalry: { who: 'rival', heat: 14 } }, { rel: { who: 'rival', heat: 10, trust: -8 } }, { pop: 0.3 }, { money: -3000 }] },
      { id: 'cut_short', label: 'Cut the match short with a quick pin', risk: 'low', result: `You end it in four minutes. Nobody is thrilled, but nobody is hurt.`, effects: [{ pop: -0.3 }, { fatigue: -2 }, { rel: { who: 'rival', respect: -1 } }] },
    ],
  },
  // ===================================================================== BETRAYAL
  {
    id: 'bet_title_shot_partner', category: 'betrayal', title: 'A Title Shot, at {partner.name}\'s Expense', weight: 3, major: true, cooldownDays: 120, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 30 } }, holdsTitle: false }, cast: { partner: { pick: 'tag', tag: 'ally' } }, memory: { role: 'partner', max: 2 },
    slots: { offer: [`a title shot at the next premium show`, `a guaranteed singles push for the next few months`, `a main-event slot on the biggest card of the quarter`], source: [`a quiet word from an executive`, `a creative meeting that ran late`, `a hallway hint from the GM`] },
    body: [`{source} brings an offer: {offer}. There is one catch. The office wants {partner.name} written out of the picture, and they want the cleanest way to do it to be you.`, `{partner.first} has been in your corner, and {partner.they} has no idea this is happening.`],
    choices: [
      { id: 'betray', label: 'Take the offer and turn on your partner', risk: 'high', result: `You do it on live television. The crowd gasps, the office applauds, and {partner.first} stares at you from the mat as though meeting you for the first time.`, effects: [{ event: { type: 'betrayal', participants: ['partner'], summary: `Betrayed {partner.name} for a bigger opportunity.`, importance: 4, data: { context: 'tag_partner', byPlayer: true } } }, { pop: 1.2 }, { money: 10000 }, { conf: -3 }, { flag: 'turned_on_partner' }] },
      { id: 'refuse', label: 'Refuse to hurt your partner', risk: 'low', result: `The office's smile thins out. You keep a friend and lose a favor, and {partner.first} hears from someone that you passed.`, effects: [{ rel: { who: 'partner', trust: 8, respect: 6, affinity: 5 } }, { conf: 3 }, { pop: -0.3 }] },
      { id: 'share', label: 'Insist that the shot be shared', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, mic: 0.3 }, text: `After a long negotiation, the office agrees to put you both in the picture. Your partner owes you, and knows it.`, effects: [{ pop: 0.6 }, { rel: { who: 'partner', trust: 6, respect: 4 } }, { money: 3000 }] },
        { weight: 1, text: `The office takes the refusal as disloyalty to them. The shot goes to someone else, and your partner is left puzzled about why you are both in a cold spell.`, effects: [{ pop: -0.4 }, { conf: -2 }, { rel: { who: 'partner', trust: 2 } }] } ] },
      { id: 'warn', label: 'Warn your partner and let {partner.them} choose', risk: 'med', result: `{partner.first} listens with a stony face, then says, "Take it. I would." The two of you shake hands. It is not clear who got the worse end.`, effects: [{ rel: { who: 'partner', trust: 12, respect: 8 } }, { conf: 2 }, { pop: 0.2 }, { event: { type: 'decision', participants: ['partner'], summary: `Warned {partner.name} about the office's plan.`, importance: 2, data: {} } }] },
    ],
  },
  {
    id: 'bet_faction_leader_cross', category: 'betrayal', title: 'The Leader\'s Back Is Turned', weight: 2, major: true, cooldownDays: 120, maxPerCareer: 2,
    trigger: { flag: 'in_stable', stat: { popularity: { gte: 25 } } }, cast: { boss: { pick: 'tag', tag: 'ally' }, exec: { pick: 'staff', role: 'executive' } }, memory: { role: 'boss', max: 1 },
    slots: { crew: [`the group you run with`, `the crew around {boss.them}`, `the whole clique`], promise: [`a spot as their own champion`, `a bigger percentage of the merchandise`, `a seat at the bookers' table`] },
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
    slots: { act: [`pitched your finisher as {friend.theirs} to the writers`, `asked for your television spot in a private meeting`, `told the agent you were "not reliable"`, `took credit for your idea in front of the producer`], learned: [`from the receptionist`, `from an overheard phone call`, `from a photocopy a cameraman sent you`, `from an agent who had a conscience`] },
    body: [`You find out {learned}: {friend.name} {act}. All those rides, meals and shared hotel rooms, and it only took one meeting.`, `Nobody saw you find out. You get to decide what happens next, and how much of it is public.`],
    choices: [
      { id: 'confront', label: 'Confront {friend.them} in private', risk: 'med', outcomes: [
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
    slots: { plan: [`your finish for the next show`, `the surprise you have been saving for the title match`, `a new entrance you had worked on for weeks`, `a spot you only told your agent about`], clue: [`a crew member who looked sheepish`, `a stray comment from a camera operator`, `a suspiciously identical countermove during rehearsal`] },
    body: [`{rival.name} ruined {plan}, and {rival.they} did it too neatly to be luck. {clue} points toward {spy.name}, who has been seen chatting with {rival.first} lately.`, `You have no proof. All you have is a bad feeling and a long list of people who knew.`],
    choices: [
      { id: 'accuse', label: 'Accuse {spy.first} to {spy.their} face', risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.5 }, text: `{spy.first} breaks and admits to everything. You get the truth, along with a slightly less pleasant hallway.`, effects: [{ rel: { who: 'spy', heat: 10, respect: 3, fear: 6 } }, { tag: { who: 'spy', tag: 'betrayal' } }, { conf: 3 }] },
        { weight: 2, text: `{spy.first} swears innocence and nearly takes a swing. It turns out someone else leaked it, and now you owe an apology.`, effects: [{ rel: { who: 'spy', heat: 12, trust: -8 } }, { conf: -4 }, { pop: -0.3 }] } ] },
      { id: 'feed_fake', label: 'Feed {spy.first} a fake plan', risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `The fake plan reaches {rival.first} within a day. On the night, you do something entirely different and look like a genius.`, effects: [{ pop: 0.8 }, { conf: 4 }, { rel: { who: 'rival', respect: 3, fear: 3 } }] },
        { weight: 1, text: `The trick takes too long to pay off. The leak was just a coincidence, and you have wasted a week.`, effects: [{ conf: -1 }, { fatigue: 3 }] } ] },
      { id: 'report', label: 'Report the leak to the agent', risk: 'low', result: `The agent says they will "look into it" and does nothing visible. {spy.first} hears about it all the same.`, effects: [{ rel: { who: 'spy', heat: 6, trust: -4 } }, { conf: 1 }] },
      { id: 'adapt', label: 'Stop trusting anyone and change everything', risk: 'low', result: `You throw out the old plan and work out a new one alone. It is lonely, and it is tiring, but it is safe.`, effects: [{ fatigue: 5 }, { conf: 2 }, { pop: 0.2 }, { rel: { who: 'spy', trust: -2 } }] },
    ],
  },
  {
    id: 'bet_partner_secret_exit', category: 'betrayal', title: '{partner.name} Is Thinking of Leaving', weight: 3, cooldownDays: 100, maxPerCareer: 2,
    trigger: {}, cast: { partner: { pick: 'tag', tag: 'ally' }, gm: { pick: 'staff', role: 'gm' } }, memory: { role: 'partner', max: 1 },
    slots: { where: [`a parked rental car`, `a corner of the parking garage`, `a booth in an empty diner`, `a hotel stairwell`], offer: [`a bigger deal from the other brand`, `a guaranteed spot in another promotion`, `a part in a movie`, `an offer to coach full-time`] },
    body: [`{partner.name} makes you swear not to tell anyone, then spills it in {where}: {partner.they} has {offer} and is leaning toward taking it. "I wanted you to hear it from me," {partner.they} says.`, `{gm.name} has been asking you pointed questions all week. The secret is going to become expensive to keep.`],
    choices: [
      { id: 'keep', label: 'Keep the secret, no matter what', risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.3 }, text: `You lie to the GM straight-faced. Your partner is grateful beyond words.`, effects: [{ rel: { who: 'partner', trust: 12, respect: 6 } }, { fatigue: 3 }, { conf: 1 }] },
        { weight: 1, text: `The GM sees through it and holds a grudge. The secret holds, but it costs you a spot.`, effects: [{ rel: { who: 'partner', trust: 8 } }, { pop: -0.4 }, { conf: -2 }] } ] },
      { id: 'tell_gm', label: 'Tell the GM and take the credit', risk: 'high', result: `The GM thanks you and tightens the leash on your partner. When {partner.first} figures out who talked, the friendship ends cold.`, effects: [{ event: { type: 'betrayal', participants: ['partner'], summary: `Betrayed {partner.name}'s confidence to the GM.`, importance: 3, data: { context: 'tag_partner', byPlayer: true } } }, { pop: 0.4 }, { money: 4000 }, { conf: -2 }] },
      { id: 'talk_out', label: 'Talk {partner.them} out of leaving', risk: 'med', result: `You make the case for staying. By the end of the night {partner.first} has not decided, but the offer sits in a drawer for now.`, effects: [{ rel: { who: 'partner', trust: 4, affinity: 3 } }, { fatigue: 2 }, { tag: { who: 'partner', tag: 'reluctant' } }] },
      { id: 'encourage', label: 'Encourage {partner.them} to take the offer', risk: 'low', result: `"Go," you say. "I would." It costs you a partner, but earns you a friend for life.`, effects: [{ rel: { who: 'partner', trust: 8, respect: 8, affinity: 6 } }, { conf: -2 }, { pop: -0.3 }] },
    ],
  },
  {
    id: 'bet_second_chance', category: 'betrayal', title: 'Asking {former.name} for a Second Chance', weight: 2, cooldownDays: 120, maxPerCareer: 2,
    trigger: { mem: [{ role: 'former', betrayal: true }] }, cast: { former: { pick: 'tag', tag: 'betrayal' } }, memory: { role: 'former', max: 3 },
    slots: { how: [`a long, awkward message`, `a coffee left on {former.their} bench`, `a late-night knock on {former.their} hotel door`, `an apology passed through a trainer`], reason: [`facing a bad run of injuries`, `finally losing {former.their} place in the stable`, `being betrayed by a new partner`, `tired of what the crew says about {former.them}`] },
    body: [`You reach out to {former.name} with {how}. {former.they} is {reason}, which is the only reason you have the nerve to ask for another chance.`, `The betrayal sits between you like a third person in the room. Forgiving you would be hard for {former.first}; slamming the door would be easy.`],
    choices: [
      { id: 'forgive', label: 'Apologize in public and ask to be forgiven', risk: 'med', result: `You say it on camera. The crowd applauds, and {former.first} cannot look at you for several minutes.`, effects: [{ event: { type: 'reconciliation', participants: ['former'], summary: `Made amends with {former.name} after the betrayal.`, data: { formerRival: true } } }, { pop: 0.5 }, { conf: 2 }, { tag: { who: 'former', tag: 'reconciled' } }] },
      { id: 'prove_it', label: 'Offer to earn it back, slowly', risk: 'low', result: `{former.first} sets the terms, and you agree to all of them. It is the start of a long climb back to trust.`, effects: [{ rel: { who: 'former', trust: 5, respect: 4 } }, { conf: 1 }] },
      { id: 'refuse', label: 'Back off: some things stay broken', risk: 'low', result: `You see how little is left to ask for and walk away. {former.first} nods once, and the room treats you with a little more distance.`, effects: [{ rel: { who: 'former', heat: 4, trust: -3 } }, { conf: 1 }, { pop: 0.1 }] },
      { id: 'use', label: 'Apologize, then use {former.them} for your own ends', risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.4 }, text: `You keep {former.first} close and useful. It pays off in two weeks, and nobody can tell it was calculated.`, effects: [{ pop: 0.5 }, { money: 3000 }, { rel: { who: 'former', trust: -2 } }] },
        { weight: 1, text: `{former.first} spots it right away. The second betrayal is worse than the first, and the whole locker room hears about it.`, effects: [{ pop: -0.6 }, { conf: -4 }, { rel: { who: 'former', heat: 14, trust: -12 } }] } ] },
    ],
  },
  {
    id: 'bet_loyalty_test', category: 'betrayal', title: 'The GM Tests Your Loyalty', weight: 2, cooldownDays: 150, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 35 } } }, cast: { gm: { pick: 'staff', role: 'gm' }, rival: { pick: 'roster', tier: { gte: 2 }, sameBrand: true } },
    slots: { bait: [`a rumored offer from a rival promotion`, `a "friendly" tip about a roster cut`, `a question about who in the locker room is unhappy`], tone: [`casual and relaxed`, `unusually warm`, `quiet and a little too interested`] },
    body: [`{gm.name} drops by catering, {tone}, and mentions {bait}. It sounds like small talk until you notice that {gm.name} is watching your face and not the food.`, `{rival.name}, two tables over, pretends not to listen. Whatever you say will land in two places by the end of the night.`],
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
        { weight: 2, bonus: { confidence: 0.4 }, text: `{thief.first} apologizes awkwardly and agrees to stop. The room notices who has the upper hand.`, effects: [{ rel: { who: 'thief', respect: 4, fear: 4, heat: 3 } }, { conf: 3 }] },
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
        { weight: 2, bonus: { charisma: 0.4, mic: 0.3 }, text: `Your counter-pitch wins the writer over. It is a bigger story than either of you pitched.`, effects: [{ pop: 0.6 }, { rel: { who: 'partner', respect: 4, trust: 3 } }, { fatigue: 3 }] },
        { weight: 1, text: `{creative.name} just stares at you. "That is not the assignment." You leave with nothing.`, effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'tell_partner', label: 'Tell {partner.first} everything', risk: 'med', result: `{partner.first} thanks you and quietly lobbies the office. The pitch gets shelved. The writer notices where the leak came from.`, effects: [{ rel: { who: 'partner', trust: 10, respect: 5 } }, { pop: -0.2 }, { conf: 1 }] },
    ],
  },
  {
    id: 'bet_who_started_it', category: 'betrayal', title: 'The Agent Wants a Name', weight: 2, cooldownDays: 70, maxPerCareer: 3,
    trigger: {}, cast: { agent: { pick: 'staff', role: 'agent' }, culprit: { pick: 'roster', sameBrand: true } },
    slots: { incident: [`a fight in the parking lot`, `a broken window in the dressing room`, `a missing gear bag`, `a prank that went bad and ruined a costume`], cost: [`a fine`, `a docked day of pay`, `a deduction from everyone's next check`] },
    body: [`{agent.name} lines everyone up after {incident}. "Somebody is going to tell me who did this, or the entire roster takes {cost}."`, `You saw it, and the culprit is {culprit.name}. Nobody else knows you saw.`],
    choices: [
      { id: 'tell', label: 'Give the agent the name', risk: 'med', result: `{culprit.first} takes the punishment, and the agent files your name under "reliable". The locker room goes cold for a few days.`, effects: [{ pop: 0.2 }, { rel: { who: 'culprit', heat: 12, trust: -10 } }, { money: 2000 }, { conf: 1 }] },
      { id: 'cover', label: 'Cover for {culprit.them} and say you saw nothing', risk: 'med', result: `Nobody talks and everyone takes the hit. {culprit.first} owes you one.`, effects: [{ rel: { who: 'culprit', trust: 8, respect: 3 } }, { money: -3000 }, { conf: 1 }] },
      { id: 'confess_for', label: 'Take the blame yourself', risk: 'high', result: `You raise your hand. The punishment lands on you alone. {culprit.first} will not forget what you did.`, effects: [{ rel: { who: 'culprit', trust: 14, respect: 10 } }, { money: -5000 }, { pop: -0.2 }, { conf: -2 }, { tag: { who: 'culprit', tag: 'ally' } }] },
      { id: 'fix_it', label: 'Make the culprit confess, quietly', risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `After a short talk, {culprit.first} walks into the office and owns it. The agent notices who arranged it.`, effects: [{ rel: { who: 'culprit', respect: 4, trust: 4 } }, { conf: 2 }, { pop: 0.2 }] },
        { weight: 1, text: `{culprit.first} refuses and the deadline passes. Everybody takes the hit, and you take the heat for stalling.`, effects: [{ money: -3000 }, { conf: -2 }, { rel: { who: 'culprit', heat: 4 } }] } ] },
    ],
  },
  {
    id: 'bet_planned_double_cross', category: 'betrayal', title: 'The Turn on {partner.name}', weight: 3, major: true, cooldownDays: 120, maxPerCareer: 2,
    trigger: { any: [{ flag: 'planned_turn' }, { rivalry: { minHeat: 25 } }] }, cast: { partner: { pick: 'rivalry', minHeat: 10 }, creative: { pick: 'staff', role: 'creative' } }, memory: { role: 'partner', max: 1 },
    slots: { moment: [`during the post-match celebration`, `after the bell at the premium show`, `when the lights go out`, `in the middle of a title defense`], hook: [`with a chair`, `with a low blow`, `with a suddenly thrown elbow`] },
    body: [`{creative.name} has the finish: you and {partner.name} are teaming up, and {moment} you turn on {partner.them} {hook}. It is the sort of turn that people retell.`, `{partner.first} has agreed to take it. What {partner.they} has not agreed to is how you do it.`],
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
    body: [`{source.name} tells you, almost gently, what {friend.name} said about you: {remark}. In the room at the time: {witness}.`, `It may be true. It may be exaggerated. It may be a plant. None of it feels good.`],
    choices: [
      { id: 'ask', label: 'Ask {friend.first} directly', risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `{friend.first} laughs, mortified, and says it was taken out of context. You decide to believe it.`, effects: [{ rel: { who: 'friend', trust: 4, affinity: 2 } }, { conf: 1 }] },
        { weight: 1, text: `{friend.first} goes quiet. That is an answer, and not a good one.`, effects: [{ rel: { who: 'friend', trust: -8, heat: 6 } }, { conf: -3 }, { tag: { who: 'friend', tag: 'betrayal' } }] } ] },
      { id: 'return', label: 'Return the favor in public', risk: 'high', result: `You pay it back in kind where the same people can hear. {friend.first} hears about it by lunch, and the friendship cools to ice.`, effects: [{ pop: 0.3 }, { rel: { who: 'friend', heat: 12, respect: -6, trust: -10 } }, { conf: 1 }] },
      { id: 'test', label: 'Set a trap to see if it is true', risk: 'med', outcomes: [
        { weight: 1, bonus: { overall: 0.5 }, text: `Your trap works perfectly and the truth comes out. {source.first} was right, and {friend.first} knows you know.`, effects: [{ rel: { who: 'friend', trust: -10, fear: 4, respect: 2 } }, { conf: 3 }, { tag: { who: 'friend', tag: 'betrayal' } }] },
        { weight: 1, text: `The trap falls flat, and {friend.first} is exactly who you hoped {friend.they} was. You owe an apology.`, effects: [{ rel: { who: 'friend', trust: -3 } }, { conf: -2 }] } ] },
      { id: 'ignore', label: 'Ignore the gossip', risk: 'low', result: `You let it roll off, but a small thing has changed. You watch {friend.first} a little closer from now on.`, effects: [{ conf: 1 }, { rel: { who: 'friend', trust: -1 } }] },
    ],
  },
  {
    id: 'bet_payback_chance', category: 'betrayal', title: 'A Chance to Get Even with {rival.name}', weight: 3, cooldownDays: 80, maxPerCareer: 3,
    trigger: { rivalry: { minHeat: 30 } }, cast: { rival: { pick: 'rivalry', minHeat: 30 } }, memory: { role: 'rival', max: 2 },
    slots: { setup: [`left a gear bag unattended at ringside`, `fallen asleep in the lounge`, `forgotten a pre-show interview`, `walked in alone on the wrong night`], tool: [`a bucket of ice water`, `a stack of paper plates`, `a marker pen`, `a camera full of embarrassing photos`] },
    body: [`{rival.name} has {setup}, and you are alone with {tool}. It is the sort of petty revenge you spent weeks fantasising about.`, `You could also do the grown-up thing. The grown-up thing has never felt less satisfying.`],
    choices: [
      { id: 'do_it', label: 'Do it. Make it public', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `It is the funniest thing anyone has seen in weeks. {rival.first} has to laugh, eventually, through clenched teeth.`, effects: [{ pop: 0.5 }, { rivalry: { who: 'rival', heat: 8 } }, { rel: { who: 'rival', heat: 8 } }, { conf: 2 }] },
        { weight: 1, text: `The prank goes wrong and costs {rival.first} a bruised wrist and a ruined bag. The agents are not amused.`, effects: [{ pop: -0.4 }, { rel: { who: 'rival', heat: 14, trust: -5 } }, { conf: -2 }, { money: -2000 }] } ] },
      { id: 'walk', label: 'Walk away. You are better than that', risk: 'low', result: `You leave the room unwatched. The satisfaction is smaller than you wanted, but the self-respect is bigger.`, effects: [{ conf: 2 }, { rel: { who: 'rival', respect: 2 } }] },
      { id: 'tell', label: 'Warn {rival.them} instead of striking', risk: 'low', result: `{rival.first} is baffled, then wary. A rival who owes you a debt is worth more than one who owes you a laugh.`, effects: [{ rel: { who: 'rival', respect: 5, trust: 3, heat: -4 } }, { pop: 0.1 }] },
      { id: 'real_payback', label: 'Wreck something that matters instead', risk: 'high', result: `You sabotage {rival.their} promo notes. The segment goes badly for {rival.first}, and the question of who did it is left unanswered.`, effects: [{ rivalry: { who: 'rival', heat: 14 } }, { rel: { who: 'rival', heat: 14, trust: -10 } }, { pop: 0.3 }, { conf: -2 }, { obligation: { kind: 'seek_revenge', who: 'rival', inDays: 12 } }] },
    ],
  },
  {
    id: 'bet_pre_match_shoot', category: 'betrayal', title: 'Warning of a Double-Cross from {opp.name}', weight: 3, cooldownDays: 80, maxPerCareer: 3, contexts: ['pre_show', 'show_day'],
    trigger: { stat: { popularity: { gte: 20 } } }, cast: { opp: { pick: 'roster', sameBrand: true, alignment: ['heel', 'tweener'] }, agent: { pick: 'staff', role: 'agent' } },
    slots: { source: [`a trainer who overheard it`, `a make-up artist`, `the referee`, `a cameraman`], plan: [`go off-script in the third minute`, `refuse to take the finish`, `lay in a few shots that were not agreed`] },
    body: [`{source} warns you that {opp.name} plans to {plan} tonight. {agent.name} has no reason to know, and you have only one rumor to go on.`, `If you do nothing, you could be made to look bad on live television. If you act, you might be wrong.`],
    choices: [
      { id: 'tell_agent', label: 'Tell {agent.name} before the match', risk: 'low', result: `{agent.name} takes it seriously and has a word with {opp.first}. The match goes by the book, and nobody knows who raised the flag.`, effects: [{ rel: { who: 'opp', heat: 6, trust: -3 } }, { conf: 2 }, { pop: 0.1 }] },
      { id: 'strike_first', label: 'Strike first when the bell rings', risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.3, confidence: 0.3 }, text: `You pre-empt it perfectly. The crowd explodes, and {opp.first} spends the rest of the match confused.`, effects: [{ pop: 0.7 }, { rel: { who: 'opp', heat: 12, fear: 6 } }, { rivalry: { who: 'opp', heat: 12 } }, { fatigue: 5 }] },
        { weight: 1, text: `You misjudged it. {opp.first} was going to hit the plan anyway, and now you look like the one who broke the script.`, effects: [{ pop: -0.5 }, { conf: -3 }, { rel: { who: 'opp', heat: 10 } }, { fatigue: 5 }] } ] },
      { id: 'confront', label: 'Look {opp.first} in the eye before the match', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: `{opp.first} shifts uneasily, says nothing, and works the match by the book. The message lands.`, effects: [{ rel: { who: 'opp', respect: 4, fear: 4 } }, { conf: 3 }] },
        { weight: 1, text: `{opp.first} turns it around and tells the agent you are paranoid. The agent is not impressed.`, effects: [{ conf: -3 }, { pop: -0.2 }, { rel: { who: 'opp', heat: 6 } }] } ] },
      { id: 'trust', label: 'Trust the rumor is wrong and go out there', risk: 'med', result: `You work the match with one eye open. Nothing happens, and you feel a little foolish and a lot tired.`, effects: [{ fatigue: 4 }, { conf: -1 }, { rel: { who: 'opp', respect: 1 } }] },
    ],
  },
  // ===================================================================== ALLIANCE
  {
    id: 'ali_tag_pitch', category: 'alliance', title: '{mate.name} Pitches a Tag Team', weight: 3, cooldownDays: 90, maxPerCareer: 3,
    trigger: { stat: { popularity: { gte: 15 } }, noFlag: 'allied_recently' }, cast: { mate: { pick: 'roster', sameBrand: true, tier: { gte: 1, lte: 3 } } },
    slots: { place: [`the gym`, `a late-night diner`, `the back seat of a rental van`, `the airport lounge`], hook: [`a pairing of opposites that writes itself`, `matching gear and a shared entrance`, `a heel-face double act the crowd will not see coming`, `a pair built entirely on speed`] },
    body: [`In {place}, {mate.name} slides over with a proposal: join forces as a tag team. "Hear me out," {mate.they} says, and {mate.they} already has {hook} sketched out on the back of a call sheet.`, `The sketch is not bad. The question is whether you want your career attached to someone else's.`],
    choices: [
      { id: 'accept', label: 'Say yes and shake on it', risk: 'low', result: `The deal is made in thirty seconds. By Monday the office has a plan, and {mate.first} has a nickname for the team.`, effects: [{ event: { type: 'alliance_formed', participants: ['mate'], summary: `Formed a tag team with {mate.name}.`, data: {} } }, { flag: 'allied_recently' }, { pop: 0.3 }, { fatigue: 2 }] },
      { id: 'trial', label: 'Agree to a trial match first', risk: 'med', result: `You book a tag match to see if it clicks. If it does, you will know. If it does not, you will both be polite about it.`, effects: [{ booking: { who: 'mate', type: 'tag' } }, { rel: { who: 'mate', respect: 3, trust: 1 } }, { tag: { who: 'mate', tag: 'alliance_possible' } }, { fatigue: 3 }] },
      { id: 'terms', label: 'Accept, but hold the better spots', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{mate.first} grudgingly agrees to your conditions. The deal holds, but a small note of resentment hovers.`, effects: [{ event: { type: 'alliance_formed', participants: ['mate'], summary: `Formed a tag team with {mate.name} on strict terms.`, data: {} } }, { rel: { who: 'mate', trust: -3, respect: 3 } }, { flag: 'allied_recently' }, { pop: 0.4 }] },
        { weight: 1, text: `{mate.first} balks and walks away. The idea was good, but your price was not.`, effects: [{ rel: { who: 'mate', respect: -2 } }, { conf: -1 }] } ] },
      { id: 'decline', label: 'Decline and stay a solo act', risk: 'low', result: `You tell {mate.first} you work alone. The call sheet goes in the bin, and your independence stays intact.`, effects: [{ conf: 2 }, { rel: { who: 'mate', trust: -1 } }, { pop: -0.1 }] },
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
      { id: 'light', label: 'Agree to one session a week', risk: 'low', result: `It is not the full block, but it is something. {mate.first} nods, and you both mean it.`, effects: [{ fatigue: 4 }, { rel: { who: 'mate', trust: 2, affinity: 2 } }, { attr: { name: 'technical', delta: 1 } }] },
      { id: 'swap', label: 'Swap training secrets instead', risk: 'med', result: `Each of you teaches the other something. It is a fair trade and a quiet one.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { rel: { who: 'mate', respect: 4, trust: 3 } }, { fatigue: 3 }] },
      { id: 'pass', label: 'Pass: you work better alone', risk: 'low', result: `You thank {mate.first} and go back to your own routine. It is efficient, and it is lonely.`, effects: [{ fatigue: -2 }, { conf: 1 }, { rel: { who: 'mate', respect: -1 } }] },
    ],
  },
  {
    id: 'ali_travel_confidence', category: 'alliance', title: 'A Confidence on the Road', weight: 2, cooldownDays: 60, maxPerCareer: 4,
    trigger: { stat: { matches: { gte: 15 } } }, cast: { mate: { pick: 'roster', sameBrand: true } },
    slots: { ride: [`a night drive between two towns`, `a delayed flight`, `a bus ride through a thunderstorm`, `a shared hotel breakfast`], worry: [`a fear that the next injury will end the career`, `a rumor of being released`, `serious money trouble`, `doubts over whether to keep wrestling at all`] },
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
    slots: { pitch: [`a push the office is thinking about`, `a stretch of poor numbers that needs a spark`, `a contract talk that might end this month`, `a comeback from a long layoff`], payment: [`a favor owed`, `a cut of {ally.their} next bonus`, `a place in {ally.their} next big story`] },
    body: [`{ally.name} asks you, quietly, to take a clean loss to {ally.them} the next time you meet. {ally.they} says it will help with {pitch}, and offers {payment} in return.`, `Between friends, it is a fair ask, but it is also the kind of loss that stays on the record.`],
    choices: [
      { id: 'lose', label: 'Agree and put {ally.them} over', risk: 'med', result: `You lose clean and sell it generously. {ally.first} owes you one, and the fans notice that you did not have to.`, effects: [{ rel: { who: 'ally', trust: 10, respect: 8, affinity: 4 } }, { pop: -0.4 }, { conf: -2 }, { money: 4000 }] },
      { id: 'refuse', label: 'Refuse: you need your own wins', risk: 'low', result: `{ally.first} says {ally.they} understands. The friendship cools a few degrees.`, effects: [{ rel: { who: 'ally', trust: -6, respect: 1 } }, { conf: 2 }] },
      { id: 'compromise', label: 'Offer a draw, or a dirty finish', risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `The finish keeps you both strong. {ally.first} is grateful and impressed, and the crowd is left wanting more.`, effects: [{ rel: { who: 'ally', trust: 5, respect: 5 } }, { pop: 0.3 }] },
        { weight: 1, text: `The finish confuses the audience, and the office wonders why it was changed.`, effects: [{ pop: -0.4 }, { conf: -1 }, { rel: { who: 'ally', trust: 2 } }] } ] },
      { id: 'sell_it', label: 'Agree to lose, but ask for the bigger favor', risk: 'high', result: `You name your price. {ally.first} pays it, but the air between you has a new edge.`, effects: [{ rel: { who: 'ally', trust: -3, respect: -2 } }, { money: 9000 }, { pop: -0.3 }, { conf: -1 }] },
    ],
  },
  {
    id: 'ali_loan_request', category: 'alliance', title: '{ally.name} Needs a Loan', weight: 2, cooldownDays: 100, maxPerCareer: 2,
    trigger: { stat: { money: { gte: 20000 } } }, cast: { ally: { pick: 'tag', tag: 'ally' } },
    slots: { need: [`a medical bill`, `a down payment on a house`, `a second-hand truck`, `a gym lease that is about to lapse`], tone: [`embarrassed`, `proud and tense`, `flat and rehearsed`] },
    body: [`{ally.name} finds you after the show, {tone}, and asks for a loan to cover {need}. {ally.they} is not someone who asks for things.`, `The amount is real, though not ruinous. Whether you can ever collect is another question.`],
    choices: [
      { id: 'give', label: 'Lend the full amount, no questions', risk: 'med', result: `You write the check. {ally.first} is overcome, and the story is kept between the two of you.`, effects: [{ money: -10000 }, { rel: { who: 'ally', trust: 14, respect: 6, affinity: 8 } }, { conf: 2 }] },
      { id: 'half', label: 'Lend half and set a repayment date', risk: 'low', result: `You make it a business deal. It is practical, and a little cold, and {ally.first} pays the first instalment early.`, effects: [{ money: -5000 }, { rel: { who: 'ally', trust: 6, respect: 5 } }] },
      { id: 'decline', label: 'Decline: you do not mix money and friends', risk: 'low', result: `{ally.first} nods, a bit stiffly. You have kept your money and some of your illusions.`, effects: [{ rel: { who: 'ally', trust: -6, affinity: -3 } }, { conf: 1 }] },
      { id: 'for_favour', label: 'Lend it, but call it a favor owed', risk: 'med', result: `{ally.first} accepts, and understands the terms. Neither of you likes it, but both of you know it is fair.`, effects: [{ money: -8000 }, { rel: { who: 'ally', trust: 1, respect: -1 } }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'ali_jealous_ally', category: 'alliance', title: '{ally.name} Resents Your Push', weight: 2, cooldownDays: 90, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 45 } }, recent: { winsGte: 3 } }, cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1 },
    slots: { sign: [`stopped saving you a seat in catering`, `started answering in single syllables`, `been "busy" every time you suggest dinner`, `made an offhand joke about "the star"`], timing: [`this week`, `since you won last time out`, `since the posters went up`] },
    body: [`{ally.name} has {sign} {timing}. It is hard to hold against a friend who is stuck while you move, but the chill is real.`, `You can feel the friendship slipping, and the room is paying attention.`],
    choices: [
      { id: 'talk', label: 'Say it out loud, over a meal', risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `It is awkward, then honest. {ally.first} admits to the envy, and you both laugh at how stupid it all is.`, effects: [{ rel: { who: 'ally', trust: 8, respect: 4 } }, { conf: 1 }] },
        { weight: 1, text: `{ally.first} insists nothing is wrong, and eats in silence. The meal ends badly.`, effects: [{ rel: { who: 'ally', trust: -3 } }, { conf: -2 }] } ] },
      { id: 'share', label: 'Use your leverage to open a door for {ally.them}', risk: 'med', result: `You put in a word with the agent. {ally.first} gets a spot on the next card, and you spend a favor.`, effects: [{ rel: { who: 'ally', trust: 8, respect: 6, affinity: 4 } }, { pop: -0.1 }, { conf: 1 }] },
      { id: 'give_space', label: 'Give {ally.them} space and stay polite', risk: 'low', result: `You keep the door open and stay out of the way. Over time, the distance holds, and so does the friendship.`, effects: [{ rel: { who: 'ally', trust: -2 } }, { fatigue: -1 }] },
      { id: 'cut', label: 'Cut the dead weight loose', risk: 'high', result: `You end it politely and quickly. It is clean, and it is cold, and it is remembered.`, effects: [{ rel: { who: 'ally', trust: -12, respect: -4, heat: 6 } }, { conf: 2 }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'ali_tag_title_help', category: 'alliance', title: 'The Tag Champions Make an Offer', weight: 2, cooldownDays: 120, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 25 } } }, cast: { champ: { pick: 'champion', class: 'tag' }, mate: { pick: 'roster', sameBrand: true } },
    slots: { terms: [`a title defense against you with a finish they choose`, `a fill-in partner for a title defense`, `a few weeks as an insurance policy`], pace: [`before the next show`, `by Friday`, `by the end of the tour`] },
    body: [`The tag champions, led by {champ.name}, need a favor: {terms}. They want an answer {pace}.`, `{mate.name} overhears and offers to step in if you decline. That is not the same as a guarantee, but it is a quiet push.`],
    choices: [
      { id: 'team', label: 'Team up with the champions', risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.3, charisma: 0.3 }, text: `You fit the system perfectly. The champions hold their belts and you get a rub from the whole run.`, effects: [{ pop: 0.7 }, { rel: { who: 'champ', respect: 6, trust: 4 } }, { fatigue: 6 }] },
        { weight: 1, text: `The chemistry is wrong. You get blamed for a lost fall and spend the week apologizing.`, effects: [{ pop: -0.3 }, { conf: -3 }, { rel: { who: 'champ', respect: -2 } }, { fatigue: 6 }] } ] },
      { id: 'pass_to_mate', label: 'Recommend {mate.first} instead', risk: 'low', result: `You get {mate.first} the shot. {mate.they} is touched, and the champions barely notice who you are.`, effects: [{ rel: { who: 'mate', trust: 8, respect: 4 } }, { pop: -0.1 }, { tag: { who: 'mate', tag: 'ally' } }] },
      { id: 'ask_title', label: 'Ask for the belts, not the favor', risk: 'high', outcomes: [
        { weight: 1, bonus: { confidence: 0.4 }, text: `{champ.first} laughs, then takes you seriously. A title match is added to the next card.`, effects: [{ booking: { who: 'champ', type: 'tag', stakes: 'title' } }, { pop: 0.6 }, { rel: { who: 'champ', respect: 3 } }] },
        { weight: 2, text: `The answer is no. The champions think you are getting above your station.`, effects: [{ rel: { who: 'champ', respect: -4, heat: 6 } }, { conf: -2 }] } ] },
      { id: 'decline', label: 'Decline and keep your options open', risk: 'low', result: `You leave it with a polite thanks. The champions find someone else.`, effects: [{ conf: 1 }, { rel: { who: 'champ', respect: -1 } }] },
    ],
  },
  {
    id: 'ali_split_loyalties', category: 'alliance', title: 'Caught Between {ally.first} and {other.first}', weight: 2, cooldownDays: 80, maxPerCareer: 3,
    trigger: {}, cast: { ally: { pick: 'tag', tag: 'ally' }, other: { pick: 'roster', sameBrand: true } },
    slots: { dispute: [`a locker-room spot by the window`, `a missed payment from a shared van`, `who gets the better entrance music`, `who said what about whose family`], venue: [`in the hallway`, `at the hotel bar`, `in the ring after rehearsal`, `in front of the booker`] },
    body: [`{ally.name} and {other.name} are arguing about {dispute} {venue}. They both look at you at once.`, `{ally.first} is a friend. {other.first} may or may not be, but is just as good a wrestler, and the whole room is waiting to see which way you lean.`],
    choices: [
      { id: 'side_ally', label: 'Side with {ally.first}, loudly', risk: 'med', result: `{ally.first} gets the support and {other.first} gets the cold shoulder. You earn gratitude and an enemy.`, effects: [{ rel: { who: 'ally', trust: 8, affinity: 4 }, }, { rel: { who: 'other', heat: 8, respect: -4 } }, { conf: 1 }] },
      { id: 'side_other', label: 'Side with {other.first}, because {other.they} is right', risk: 'high', result: `You tell the truth, and it costs you some warmth. {other.first} thanks you, and {ally.first} does not.`, effects: [{ rel: { who: 'ally', trust: -8, heat: 6 } }, { rel: { who: 'other', respect: 8, trust: 5 } }, { conf: 2 }] },
      { id: 'mediate', label: 'Mediate and find a compromise', risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `You hear both sides, and the compromise lands. Everyone leaves less angry than they arrived.`, effects: [{ rel: { who: 'ally', trust: 3, respect: 3 } }, { rel: { who: 'other', respect: 4, trust: 3 } }, { pop: 0.2 }, { fatigue: 3 }] },
        { weight: 1, text: `Neither accepts it and both think you are dodging. You are late to your own warm-up.`, effects: [{ rel: { who: 'ally', trust: -2 } }, { rel: { who: 'other', trust: -2 } }, { fatigue: 4 }] } ] },
      { id: 'stay_out', label: 'Stay out of it entirely', risk: 'low', result: `You step back and raise your hands. Both think less of you for it, but neither has a grievance.`, effects: [{ rel: { who: 'ally', trust: -2 } }, { rel: { who: 'other', trust: -1 } }, { conf: -1 }] },
    ],
  },
  {
    id: 'ali_rumble_pact', category: 'alliance', title: 'A Pact Before the Rumble', weight: 3, cooldownDays: 200, maxPerCareer: 2,
    trigger: { eventWithin: { id: 'royal_rumble', days: 21 }, stat: { popularity: { gte: 25 } } }, cast: { mate: { pick: 'roster', sameBrand: true, tier: { gte: 1 } } },
    slots: { terms: [`never eliminate each other until the very end`, `watch each other's backs for the first ten minutes`, `eliminate the same target first`], place: [`the locker room`, `the weight room`, `the arena stairwell`] },
    body: [`In {place}, {mate.name} proposes a pact for the Rumble: {terms}. "Two sets of eyes," {mate.they} says.`, `Pacts are common before the match and rare after the bell. Everybody in the entry list has a reason to forget one.`],
    choices: [
      { id: 'swear', label: 'Swear to the pact and mean it', risk: 'med', result: `You shake hands. If either of you breaks it, the whole locker room will know.`, effects: [{ event: { type: 'alliance_formed', participants: ['mate'], summary: `Made a Royal Rumble pact with {mate.name}.`, data: {} } }, { rel: { who: 'mate', trust: 8, respect: 4 } }, { promise: { kind: 'win_rumble', text: `I will make the Rumble count`, deadlineDays: 40 } }] },
      { id: 'lie', label: 'Agree, and plan to break it', risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `You smile, shake and plan. On the night, you turn on {mate.first} at the perfect moment, and it works.`, effects: [{ pop: 0.7 }, { rel: { who: 'mate', trust: -12, heat: 10 } }, { conf: 2 }] },
        { weight: 1, text: `{mate.first} was planning the same thing. You both get eliminated at once, in the most embarrassing way.`, effects: [{ pop: -0.4 }, { conf: -3 }, { rel: { who: 'mate', heat: 6 } }] } ] },
      { id: 'no_pact', label: 'Decline: every wrestler for themselves', risk: 'low', result: `You keep it clean. The match is yours alone to survive.`, effects: [{ conf: 2 }, { rel: { who: 'mate', respect: 1 } }] },
      { id: 'counter_pact', label: 'Counter: a pact to gang up on the favorite', risk: 'med', result: `You pick a target and a plan. The idea spreads through the locker room, and half a dozen others join in.`, effects: [{ pop: 0.4 }, { rel: { who: 'mate', trust: 4, respect: 3 } }, { fatigue: 3 }] },
    ],
  },
  {
    id: 'ali_hidden_injury', category: 'alliance', title: '{ally.name} Is Hiding an Injury', weight: 2, cooldownDays: 80, maxPerCareer: 3,
    trigger: {}, cast: { ally: { pick: 'tag', tag: 'ally' }, doc: { pick: 'staff', role: 'doctor' } },
    slots: { sign: [`a wince every time {ally.they} bends`, `a brace hidden under {ally.their} pants`, `a pale face before the bell`, `an unusual fear of the top rope`], risk: [`a torn rib`, `a bad shoulder`, `a damaged knee`, `a concussion that has not cleared`] },
    body: [`You notice {sign}, and then {ally.name} confesses: it is {risk}, and nobody in the office knows. "If they find out, I'm benched," {ally.they} says.`, `{doc.name} is on duty tonight. You could say one word and it would all be over, or say nothing and let your friend decide.`],
    choices: [
      { id: 'keep', label: 'Keep it quiet and cover for {ally.them}', risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.3 }, text: `You help {ally.first} hide it for the week. The injury heals enough to work, and the trust deepens.`, effects: [{ rel: { who: 'ally', trust: 12, respect: 5 } }, { fatigue: 4 }] },
        { weight: 1, text: `{ally.first} goes down in the ring and the truth comes out. You are named as the person who knew.`, effects: [{ rel: { who: 'ally', trust: 4 } }, { pop: -0.5 }, { conf: -3 }, { money: -2000 }] } ] },
      { id: 'tell_doc', label: 'Take it to {doc.first}', risk: 'med', result: `{doc.first} examines {ally.first} and benches {ally.them} for a month. {ally.they} is furious and grateful and mostly furious.`, effects: [{ rel: { who: 'ally', trust: -6, respect: 3 } }, { conf: 1 }, { pop: 0.1 }] },
      { id: 'push_rest', label: 'Convince {ally.them} to rest voluntarily', risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `{ally.first} agrees and takes the weekend. The injury turns out to be less bad than it could have been.`, effects: [{ rel: { who: 'ally', trust: 8, respect: 4 } }, { conf: 1 }] },
        { weight: 1, text: `{ally.first} insists {ally.they} is fine and works the show anyway. You can only watch.`, effects: [{ rel: { who: 'ally', trust: -2 } }, { fatigue: 2 }] } ] },
      { id: 'take_load', label: 'Take {ally.their} spot on the card yourself', risk: 'med', result: `You volunteer to cover. It is a heavy week and a big favor, and {ally.first} will not forget either.`, effects: [{ fatigue: 12 }, { rel: { who: 'ally', trust: 10, respect: 8, affinity: 5 } }, { pop: 0.3 }] },
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
    id: 'ali_cross_brand_favour', category: 'alliance', title: 'A Favor from {mate.name}', weight: 2, cooldownDays: 80, maxPerCareer: 3,
    trigger: { stat: { popularity: { gte: 30 } } }, cast: { mate: { pick: 'roster', tier: { gte: 1, lte: 3 } }, gm: { pick: 'staff', role: 'gm' } },
    slots: { favor: [`a word to the GM about a better spot`, `a one-off spot on your show`, `a shot at a mid-card match`, `a ride to the airport and an introduction`], reason: [`sinking numbers on another brand`, `a creative reboot`, `a personality clash with a boss`] },
    body: [`{mate.name} asks you for {favor}. It is connected to {reason}, and {mate.they} would otherwise never have asked.`, `Putting in a good word costs you nothing but credit with {gm.name}. The only question is whether {mate.they} deserves it.`],
    choices: [
      { id: 'vouch', label: 'Vouch for {mate.first} wholeheartedly', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{gm.name} listens and agrees. {mate.first} gets the opening, and you gain an ally on the other side.`, effects: [{ rel: { who: 'mate', trust: 8, respect: 5 } }, { tag: { who: 'mate', tag: 'ally' } }, { pop: 0.1 }] },
        { weight: 1, text: `{gm.name} has other plans and takes your word as a sign you are meddling.`, effects: [{ rel: { who: 'mate', trust: 3 } }, { pop: -0.3 }, { conf: -1 }] } ] },
      { id: 'lukewarm', label: 'Mention it lightly and leave it there', risk: 'low', result: `You mention it in passing. Nothing happens, but nobody is annoyed.`, effects: [{ rel: { who: 'mate', trust: 1 } }] },
      { id: 'price', label: 'Do it, for a price', risk: 'med', result: `{mate.first} pays you back in cash and a promise. The favor works, but it cheapens the relationship.`, effects: [{ money: 5000 }, { rel: { who: 'mate', trust: -2, respect: -2 } }, { conf: -1 }] },
      { id: 'refuse', label: 'Refuse. You do not trade credit', risk: 'low', result: `You turn {mate.first} down politely. It does not make a friend, but it saves the credit.`, effects: [{ rel: { who: 'mate', trust: -3 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'ali_corner_offer', category: 'alliance', title: '{ally.name} Wants to Be in Your Corner', weight: 2, cooldownDays: 90, maxPerCareer: 3,
    trigger: { eventWithin: { kind: 'ple', days: 12 }, stat: { popularity: { gte: 30 } } }, cast: { ally: { pick: 'tag', tag: 'ally' }, rival: { pick: 'rivalry', minHeat: 15 } },
    slots: { reason: [`to keep the rival's allies honest`, `because you need a second pair of eyes`, `to make a statement to the office`], risk: [`the referee might not like it`, `a distraction could cost you the match`, `the bookers may use it for a swerve`] },
    body: [`{ally.name} volunteers to stand at ringside for your next showdown with {rival.name} {reason}. "I owe you," {ally.they} says, and it is not an empty promise.`, `"I owe you," {ally.they} repeats. The gesture is good, and so is the complication: {risk}.`],
    choices: [
      { id: 'accept', label: 'Accept the ringside help', risk: 'low', result: `{ally.first} walks you out. The crowd pops, and so does the rival's temper.`, effects: [{ pop: 0.4 }, { rel: { who: 'ally', trust: 6, respect: 4 } }, { rel: { who: 'rival', heat: 5 } }] },
      { id: 'swerve', label: 'Accept, and plan a swerve', risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `You turn it on its head: {ally.first} neutralizes the rival's helper at the perfect moment. The finish earns a roar.`, effects: [{ pop: 0.9 }, { rel: { who: 'ally', trust: 3 } }, { rivalry: { who: 'rival', heat: 6 } }] },
        { weight: 1, text: `{ally.first} misses the cue. The match is a mess and the booker is not impressed.`, effects: [{ pop: -0.5 }, { conf: -3 }, { rel: { who: 'ally', trust: -2 } }] } ] },
      { id: 'decline', label: 'Decline: this one is yours alone', risk: 'low', result: `You face {rival.first} by yourself. The crowd respects it, and so does the rival.`, effects: [{ conf: 3 }, { rel: { who: 'rival', respect: 3 } }, { rel: { who: 'ally', trust: -1 } }] },
      { id: 'send_away', label: 'Send {ally.them} to watch the rival\'s corner instead', risk: 'med', result: `{ally.first} agrees. The assignment keeps the other side honest, and it is dull work.`, effects: [{ rel: { who: 'ally', trust: 3, respect: 2 } }, { rel: { who: 'rival', respect: -2 } }, { conf: 1 }] },
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
        { weight: 1, bonus: { charisma: 0.4 }, text: `{ex.first} agrees. It is the beginning of a longer run, and a softer relationship than before.`, effects: [{ pop: 0.6 }, { rel: { who: 'ex', trust: 8, respect: 4 } }, { flag: 'allied_recently' }] },
        { weight: 1, text: `{ex.first} wanted a night, not a season. The talk ends politely and coldly.`, effects: [{ rel: { who: 'ex', trust: -3 } }, { conf: -1 }] } ] },
      { id: 'decline', label: 'Decline: it cannot be undone', risk: 'low', result: `You thank {ex.first} and mean it. The scars are still too fresh, and the offer goes quietly away.`, effects: [{ rel: { who: 'ex', trust: -2, respect: 1 } }, { conf: 1 }] },
      { id: 'twist', label: 'Pitch a swerve instead of a reunion', risk: 'high', result: `You put a twist on it. {ex.first} is not pleased, but the booking team loves it.`, effects: [{ pop: 0.8 }, { rel: { who: 'ex', trust: -8, heat: 8 } }, { rivalry: { who: 'ex', heat: 10 } }] },
    ],
  },
  // ===================================================================== FACTION
  {
    id: 'fac_stable_recruit', category: 'faction', title: '{boss.name} Wants You in the Stable', weight: 3, major: true, cooldownDays: 150, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 20 } }, noFlag: 'in_stable' }, cast: { boss: { pick: 'roster', tier: { gte: 3 }, sameBrand: true, alignment: ['heel', 'tweener'] }, mate: { pick: 'roster', sameBrand: true, tier: { gte: 1, lte: 3 } } },
    slots: { place: [`a dark corner of catering`, `the boss's private dressing room`, `a hotel suite with the curtains drawn`, `the back of a tour bus`], perk: [`protection from the office`, `a seat at the booking table`, `a share of the merchandise`, `a guaranteed spot on every card`] },
    body: [`In {place}, {boss.name} lays out the pitch: a stable, with {mate.name} already in. "We run this brand from the back," {boss.they} says, offering {perk}. "You'd be useful."`, `The offer is real, and so is the price. A stable makes everyone safe, until it doesn't.`],
    choices: [
      { id: 'join', label: 'Join the stable', risk: 'med', result: `You shake hands. By Monday your face is on the poster, and the others make room for you in the entrance.`, effects: [{ event: { type: 'faction_formed', participants: ['boss', 'mate'], summary: `Joined {boss.name}'s stable alongside {mate.name}.`, importance: 4, data: { factionId: 'stable_crimson', name: 'The Crimson Order', leader: '@boss', leaderIsPlayer: false } } }, { flag: 'in_stable' }, { pop: 0.6 }, { money: 4000 }, { rel: { who: 'boss', trust: 5, respect: 3 } }, { tag: { who: 'boss', tag: 'ally' } }] },
      { id: 'equal', label: 'Join as an equal or not at all', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.5, charisma: 0.3 }, text: `{boss.first} sizes you up, then grins. "Fine. Equal." The group makes space at the table, and you take it.`, effects: [{ event: { type: 'faction_formed', participants: ['boss', 'mate'], summary: `Joined {boss.name}'s stable as an equal.`, importance: 4, data: { factionId: 'stable_crimson', name: 'The Crimson Order', leader: '@boss', leaderIsPlayer: false } } }, { flag: 'in_stable' }, { pop: 0.8 }, { conf: 3 }, { tag: { who: 'boss', tag: 'ally' } }] },
        { weight: 1, text: `{boss.first} sneers. "Equals? You haven't earned it." The offer is withdrawn, along with a lot of goodwill.`, effects: [{ rel: { who: 'boss', respect: -3, heat: 6 } }, { conf: -2 }, { pop: -0.2 }] } ] },
      { id: 'refuse', label: 'Refuse. You are nobody\'s lackey', risk: 'low', result: `{boss.first} nods slowly. There is no threat, but you can feel the cold.`, effects: [{ conf: 3 }, { pop: 0.1 }, { rel: { who: 'boss', respect: 2, heat: 4 } }] },
      { id: 'infiltrate', label: 'Say yes while planning to take over', risk: 'high', result: `You join with a smile and a plan. The long game begins, and everyone is a little too nice.`, effects: [{ event: { type: 'faction_formed', participants: ['boss', 'mate'], summary: `Joined {boss.name}'s stable with ambitions of your own.`, importance: 4, data: { factionId: 'stable_crimson', name: 'The Crimson Order', leader: '@boss', leaderIsPlayer: false } } }, { flag: 'in_stable' }, { flag: 'plotting_takeover' }, { pop: 0.4 }, { rel: { who: 'boss', trust: 2 } }] },
    ],
  },
  {
    id: 'fac_face_coalition', category: 'faction', title: 'A Coalition of Babyfaces', weight: 2, cooldownDays: 150, maxPerCareer: 2,
    trigger: { alignment: ['face'], stat: { popularity: { gte: 30 } }, noFlag: 'in_stable' }, cast: { lead: { pick: 'roster', tier: { gte: 2 }, sameBrand: true, alignment: 'face' }, mate: { pick: 'roster', sameBrand: true, alignment: 'face' } },
    slots: { threat: [`a stable of heels that keeps ambushing the babyfaces`, `the champion's gang of bullies`, `management's pet faction`], form: [`a union of equals`, `a "round table" with a symbolic seat for each member`, `a number-one-contender pact`] },
    body: [`{lead.name} calls a meeting about {threat}. The plan: {form}, with {mate.name} and you in the front row.`, `Fans will love it. The real danger is that every member of a coalition is also a competitor for the same spots.`],
    choices: [
      { id: 'join', label: 'Join and show up on camera', risk: 'low', result: `You walk out together, and the building roars. It is easy to forget that every face in the group has their own agenda.`, effects: [{ event: { type: 'faction_formed', participants: ['lead', 'mate'], summary: `Helped form a coalition with {lead.name} and {mate.name}.`, importance: 4, data: { factionId: 'coalition_united', name: 'The Open Hands', leader: '@lead', leaderIsPlayer: false } } }, { flag: 'in_stable' }, { pop: 0.8 }, { rel: { who: 'lead', trust: 4, respect: 3 } }, { tag: { who: 'lead', tag: 'ally' } }] },
      { id: 'lead', label: 'Offer to lead the group yourself', risk: 'high', outcomes: [
        { weight: 1, bonus: { popularity: 0.4, charisma: 0.4 }, text: `Your pitch wins the room. The coalition is yours to run, with all of the work and headaches that come with it.`, effects: [{ event: { type: 'faction_formed', participants: ['lead', 'mate'], summary: `Led a face coalition with {lead.name} and {mate.name}.`, importance: 4, data: { factionId: 'coalition_united', name: 'The Open Hands', leader: 'player', leaderIsPlayer: true } } }, { flag: 'in_stable' }, { pop: 0.9 }, { fatigue: 5 }, { rel: { who: 'lead', respect: -2 } }, { tag: { who: 'mate', tag: 'ally' } }] },
        { weight: 2, text: `{lead.first} laughs gently. "You're green. Sit down." You get a seat, but a long way from the head of the table.`, effects: [{ conf: -3 }, { rel: { who: 'lead', respect: -2 } }, { pop: -0.2 }] } ] },
      { id: 'independent', label: 'Support them from a distance', risk: 'low', result: `You offer back-up if it comes to it but keep your independence. It is a good arrangement, if a little cold.`, effects: [{ rel: { who: 'lead', respect: 3 } }, { pop: 0.2 }, { conf: 1 }] },
      { id: 'decline', label: 'Decline: coalitions never last', risk: 'low', result: `You tell {lead.first} you will watch from the sideline. The coalition goes ahead without you.`, effects: [{ conf: 1 }, { rel: { who: 'lead', respect: -2 } }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'fac_start_stable', category: 'faction', title: 'Start Your Own Stable', weight: 2, major: true, cooldownDays: 200, maxPerCareer: 1,
    trigger: { stat: { popularity: { gte: 40 }, overall: { gte: 55 } }, noFlag: 'in_stable' }, cast: { a: { pick: 'roster', sameBrand: true, tier: { gte: 1, lte: 3 } }, b: { pick: 'roster', sameBrand: true, tier: { gte: 1, lte: 3 } }, creative: { pick: 'staff', role: 'creative' } },
    slots: { theme: [`a hard-edged, no-nonsense unit`, `a swaggering "money team"`, `a workmanlike band of blue-collar bruisers`, `a mysterious cabal with a secret handshake`], pitch: [`over dinner`, `in the production office`, `in the ring at 6 a.m.`] },
    body: [`{creative.name} floats the idea {pitch}: you lead a new stable, built around {theme}, with {a.name} and {b.name} as your first recruits.`, `Leading means you are responsible for the rest. They will win with you and lose with you.`],
    choices: [
      { id: 'lead', label: 'Lead the stable with a firm hand', risk: 'med', result: `You set the rules. The group walks out together, and the brand's top stars give you a look.`, effects: [{ event: { type: 'faction_formed', participants: ['a', 'b'], summary: `Formed a new stable with {a.name} and {b.name}.`, importance: 4, data: { factionId: 'stable_player', name: 'The Syndicate', leader: 'player', leaderIsPlayer: true } } }, { flag: 'in_stable' }, { flag: 'player_leads_stable' }, { pop: 0.9 }, { fatigue: 5 }, { rel: { who: 'a', trust: 4, respect: 4 } }, { rel: { who: 'b', trust: 4, respect: 4 } }, { tag: { who: 'a', tag: 'ally' } }, { tag: { who: 'b', tag: 'ally' } }] },
      { id: 'democracy', label: 'Run it as a democracy', risk: 'low', result: `The group votes on everything, which is slow, and loved. Nobody feels used.`, effects: [{ event: { type: 'faction_formed', participants: ['a', 'b'], summary: `Formed a democratic stable with {a.name} and {b.name}.`, importance: 4, data: { factionId: 'stable_player', name: 'The Syndicate', leader: 'player', leaderIsPlayer: true } } }, { flag: 'in_stable' }, { flag: 'player_leads_stable' }, { pop: 0.5 }, { rel: { who: 'a', trust: 8, affinity: 5 } }, { rel: { who: 'b', trust: 8, affinity: 5 } }, { tag: { who: 'a', tag: 'ally' } }, { tag: { who: 'b', tag: 'ally' } }] },
      { id: 'solo', label: 'Turn it down and stay solo', risk: 'low', result: `You say you'd rather win alone. The writers file the idea.`, effects: [{ conf: 2 }, { pop: -0.1 }, { rel: { who: 'a', respect: -1 } }, { rel: { who: 'b', respect: -1 } }] },
      { id: 'power_play', label: 'Take the idea, but pick your own recruits', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.4, confidence: 0.3 }, text: `You swap in your own people and the office, surprisingly, agrees. Your stable is a real power base.`, effects: [{ event: { type: 'faction_formed', participants: ['a', 'b'], summary: `Built a stable on your own terms with {a.name} and {b.name}.`, importance: 4, data: { factionId: 'stable_player', name: 'The Syndicate', leader: 'player', leaderIsPlayer: true } } }, { flag: 'in_stable' }, { flag: 'player_leads_stable' }, { pop: 1.0 }, { rel: { who: 'a', respect: -2 } }, { tag: { who: 'a', tag: 'ally' } }] },
        { weight: 1, text: `The office pushes back and the original recruits feel snubbed. The stable never launches.`, effects: [{ pop: -0.3 }, { conf: -2 }, { rel: { who: 'a', heat: 6, respect: -3 } }, { rel: { who: 'b', heat: 6, respect: -3 } }] } ] },
    ],
  },
  {
    id: 'fac_loyalty_demand', category: 'faction', title: '{boss.name} Demands Proof of Loyalty', weight: 3, cooldownDays: 90, maxPerCareer: 3,
    trigger: { flag: 'in_stable' }, cast: { boss: { pick: 'tag', tag: 'ally' }, target: { pick: 'roster', sameBrand: true } },
    slots: { test: [`stand at ringside and watch while {target.name} is dismantled`, `skip a friend's match to help the stable ambush {target.name}`, `cut a public promo burying {target.name}`, `lead the stable's attack on {target.name} in the next match`], stakes: [`your place in the group`, `your next push`, `how the others treat you`] },
    body: [`{boss.name} tells you that things have to change. To prove you are still one of them, {boss.they} wants you to {test}.`, `It puts {stakes} on the line. You know exactly what you are being asked to prove.`],
    choices: [
      { id: 'comply', label: 'Comply without comment', risk: 'med', result: `You do it, and nobody in the group meets your eye afterwards. The boss nods once, which is worth more than it should be.`, effects: [{ rel: { who: 'boss', trust: 8, respect: 3 } }, { rel: { who: 'target', heat: 8, trust: -6 } }, { pop: 0.2 }, { conf: -2 }] },
      { id: 'refuse_open', label: 'Refuse and say why', risk: 'high', result: `The room goes quiet. {boss.first} stares at you for a long beat, then smiles without humor. "We'll see."`, effects: [{ event: { type: 'refusal_to_help', participants: ['boss'], summary: `Refused {boss.name}'s demand for a loyalty test.`, importance: 3, data: { factionId: 'stable_crimson' } } }, { rel: { who: 'target', respect: 6, trust: 5 } }, { conf: 3 }, { pop: 0.3 }] },
      { id: 'negotiate', label: 'Negotiate a lighter version', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `You make a compromise that lets everyone save face. {boss.first} is satisfied, and so is your conscience.`, effects: [{ rel: { who: 'boss', trust: 3, respect: 3 } }, { rel: { who: 'target', trust: 1 } }, { conf: 1 }] },
        { weight: 1, text: `{boss.first} takes the negotiation as a refusal and starts watching you closely.`, effects: [{ rel: { who: 'boss', trust: -6, heat: 4 } }, { conf: -2 }] } ] },
      { id: 'warn_target', label: 'Warn {target.first}, then comply', risk: 'high', result: `You tip {target.first} off. When the moment comes, it looks like you made a bad hit. Only two people in the building know it was staged.`, effects: [{ rel: { who: 'target', trust: 10, respect: 6 } }, { rel: { who: 'boss', trust: 2 } }, { fatigue: 3 }, { conf: 1 }] },
    ],
  },
  {
    id: 'fac_member_solo', category: 'faction', title: '{mate.name} Wants to Go Solo', weight: 2, cooldownDays: 100, maxPerCareer: 2,
    trigger: { flag: 'player_leads_stable' }, cast: { mate: { pick: 'tag', tag: 'ally' }, creative: { pick: 'staff', role: 'creative' } }, memory: { role: 'mate', max: 1 },
    slots: { sign: [`a stack of fan mail`, `a handful of solo offers`, `an unexpected pop from the crowd`, `a producer's pat on the back`], tone: [`gently`, `with practiced ease`, `after three failed attempts to say it`] },
    body: [`{mate.name} tells you {tone} that {mate.they} wants to go solo, having seen {sign} lately. {mate.they} has been your most reliable member.`, `{creative.name} is already drafting a story that would turn the departure into a feud, if you let it.`],
    choices: [
      { id: 'bless', label: 'Give your blessing and a send-off', risk: 'low', result: `You hand {mate.first} a gift and a farewell speech. The send-off draws applause, and the stable gets a goodbye story.`, effects: [{ event: { type: 'faction_left', participants: ['mate'], summary: `{mate.name} left the stable with the leader's blessing.`, importance: 3, data: { factionId: 'stable_player', member: '@mate' } } }, { rel: { who: 'mate', trust: 10, respect: 8, affinity: 6 } }, { pop: 0.3 }] },
      { id: 'block', label: 'Refuse to release {mate.them}', risk: 'high', result: `You say no. {mate.first} stays, and everyone feels the strain.`, effects: [{ rel: { who: 'mate', trust: -8, heat: 8 } }, { conf: 2 }, { pop: -0.2 }] },
      { id: 'feud', label: 'Turn the exit into a feud', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{creative.name}'s story works. The crowd is torn and the ratings climb.`, effects: [{ event: { type: 'faction_left', participants: ['mate'], summary: `{mate.name} left the stable under bad terms.`, importance: 3, data: { factionId: 'stable_player', member: '@mate' } } }, { pop: 0.9 }, { rivalry: { who: 'mate', heat: 14 } }, { rel: { who: 'mate', heat: 8 } }] },
        { weight: 1, text: `The story feels forced. The crowd shrugs and the departure drifts without drama.`, effects: [{ event: { type: 'faction_left', participants: ['mate'], summary: `{mate.name} left the stable under bad terms.`, importance: 3, data: { factionId: 'stable_player', member: '@mate' } } }, { pop: -0.1 }, { rivalry: { who: 'mate', heat: 8 } }] } ] },
      { id: 'counter_offer', label: 'Offer a bigger role to keep {mate.them}', risk: 'med', result: `You give {mate.first} a lead spot in the stable. It works for now, and costs you a share of your own spotlight.`, effects: [{ rel: { who: 'mate', trust: 5, respect: 4 } }, { pop: -0.3 }, { money: -2000 }] },
    ],
  },
  {
    id: 'fac_refuse_help', category: 'faction', title: '{mate.name} Asks for Backup', weight: 2, cooldownDays: 70, maxPerCareer: 3,
    trigger: { flag: 'in_stable' }, cast: { mate: { pick: 'tag', tag: 'ally' }, rival: { pick: 'roster', sameBrand: true, tier: { gte: 2 } } },
    slots: { jam: [`a three-on-one that is not going to end well`, `a match the office has already decided against {mate.them}`, `a bad run that puts {mate.their} spot at risk`], hour: [`just before the main event`, `in the middle of a meal`, `at the end of a long drive`] },
    body: [`{mate.name} comes to you {hour} and asks for help with {jam}. It means putting yourself on the line against {rival.name}.`, `Helping costs you energy and perhaps a match. Refusing costs you a friend and perhaps something more.`],
    choices: [
      { id: 'help', label: 'Back {mate.them} up all the way', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `You stand shoulder to shoulder. The crowd roars, and {mate.first} owes you for life.`, effects: [{ rel: { who: 'mate', trust: 10, respect: 8 } }, { rel: { who: 'rival', heat: 8 } }, { pop: 0.5 }, { fatigue: 6 }] },
        { weight: 1, text: `It goes wrong and you take a beating alongside {mate.first}. The loyalty is noted; the bruises are felt.`, effects: [{ rel: { who: 'mate', trust: 8 } }, { fatigue: 9 }, { conf: -2 }, { pop: -0.2 }] } ] },
      { id: 'refuse', label: 'Refuse. You have your own problems', risk: 'low', result: `You turn {mate.first} down. The stable notes it, and the group trust drops.`, effects: [{ event: { type: 'refusal_to_help', participants: ['mate'], summary: `Refused to back up {mate.name}.`, importance: 3, data: { factionId: 'stable_crimson' } } }, { conf: 1 }, { fatigue: -2 }] },
      { id: 'delegate', label: 'Send someone else to help', risk: 'low', result: `You find a substitute. {mate.first} accepts, but the gesture feels half-hearted.`, effects: [{ rel: { who: 'mate', trust: 1, respect: -1 } }, { fatigue: 1 }] },
      { id: 'negotiate', label: 'Help in exchange for a favor', risk: 'med', result: `{mate.first} agrees to owe you. You step in with a plan that works, and a debt on the books.`, effects: [{ rel: { who: 'mate', trust: 3, respect: 3 } }, { fatigue: 5 }, { money: 2500 }, { pop: 0.2 }] },
    ],
  },
  {
    id: 'fac_leave_group', category: 'faction', title: 'Walking Out on {boss.name}', weight: 2, major: true, cooldownDays: 150, maxPerCareer: 2,
    trigger: { flag: 'in_stable' }, cast: { boss: { pick: 'tag', tag: 'ally' }, exec: { pick: 'staff', role: 'executive' } }, memory: { role: 'boss', max: 2 },
    slots: { cause: [`the stable has stopped helping your career`, `the leader has been taking credit for your wins`, `the others have started treating you as a servant`, `you want the freedom to choose your own feuds`], staging: [`in the ring during a segment`, `in the stable's meeting room`, `in a private conversation with the boss`] },
    body: [`You have decided that {cause}. {exec.name} has told you quietly that the office is fine with a change, and the only question left is how you do it {staging}.`, `{boss.name} is not a person who takes departures well. Everyone knows it.`],
    choices: [
      { id: 'quiet', label: 'Leave quietly and cleanly', risk: 'low', result: `You say what needs saying and walk away. {boss.first} says nothing for a long time, then wishes you well.`, effects: [{ event: { type: 'faction_left', participants: ['boss'], summary: `Left {boss.name}'s stable on civil terms.`, importance: 3, data: { factionId: 'stable_crimson', member: 'player' } } }, { clearFlag: 'in_stable' }, { rel: { who: 'boss', respect: 3, heat: 2 } }, { conf: 1 }] },
      { id: 'dramatic', label: 'Make it a big, public break', risk: 'high', result: `You turn on the stable in the middle of a match, and the building loses its mind. The boss now has a new enemy.`, effects: [{ event: { type: 'faction_left', participants: ['boss'], summary: `Broke from {boss.name}'s stable in a public split.`, importance: 4, data: { factionId: 'stable_crimson', member: 'player' } } }, { event: { type: 'betrayal', participants: ['boss'], summary: `Turned on {boss.name}'s stable.`, importance: 4, data: { context: 'faction', byPlayer: true } } }, { clearFlag: 'in_stable' }, { pop: 1.1 }, { rivalry: { who: 'boss', heat: 16 } }] },
      { id: 'stay_try', label: 'Stay and try to change things from inside', risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.5, confidence: 0.3 }, text: `You raise your concerns, and {boss.first} listens, to your surprise. Things improve.`, effects: [{ rel: { who: 'boss', trust: 5, respect: 5 } }, { conf: 2 }] },
        { weight: 2, text: `{boss.first} takes the criticism as an attack. The next month is cold.`, effects: [{ rel: { who: 'boss', trust: -6, heat: 6 } }, { conf: -3 }] } ] },
      { id: 'deal', label: 'Negotiate an exit with a payout', risk: 'med', result: `You leave quietly, with a small payoff. The boss is relieved, and so are you.`, effects: [{ event: { type: 'faction_left', participants: ['boss'], summary: `Left {boss.name}'s stable after a negotiated exit.`, importance: 3, data: { factionId: 'stable_crimson', member: 'player' } } }, { clearFlag: 'in_stable' }, { money: -3000 }, { rel: { who: 'boss', respect: 2 } }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'fac_bidding_war', category: 'faction', title: 'Two Stables Want You', weight: 2, major: true, cooldownDays: 150, maxPerCareer: 1,
    trigger: { stat: { popularity: { gte: 40 } }, noFlag: 'in_stable' }, cast: { a: { pick: 'roster', tier: { gte: 3 }, sameBrand: true }, b: { pick: 'roster', tier: { gte: 2 }, sameBrand: true } },
    slots: { sweetener_a: [`the better spot on the card`, `a share of the road money`, `a title push the office has not committed to`], sweetener_b: [`creative control over your gimmick`, `a signing bonus`, `a seat in the writers' room`] },
    body: [`{a.name} and {b.name} have each approached you in the same week. {a.name} is offering {sweetener_a}, while {b.name} is dangling {sweetener_b}.`, `Both want a reply before the weekend. Both will remember how you answer.`],
    choices: [
      { id: 'a', label: 'Side with {a.first}', risk: 'med', result: `You shake {a.first}'s hand. {b.first} takes it badly, and the stable you chose takes you in.`, effects: [{ event: { type: 'faction_formed', participants: ['a'], summary: `Joined a stable led by {a.name}.`, importance: 4, data: { factionId: 'stable_bidding_a', name: 'The Establishment', leader: '@a', leaderIsPlayer: false } } }, { flag: 'in_stable' }, { rel: { who: 'a', trust: 5, respect: 3 } }, { rel: { who: 'b', heat: 6, respect: -3 } }, { pop: 0.5 }, { money: 5000 }, { tag: { who: 'a', tag: 'ally' } }] },
      { id: 'b', label: 'Side with {b.first}', risk: 'med', result: `You choose {b.first}. {a.first} says nothing, and a quiet campaign begins.`, effects: [{ event: { type: 'faction_formed', participants: ['b'], summary: `Joined a stable led by {b.name}.`, importance: 4, data: { factionId: 'stable_bidding_b', name: 'The Outliers', leader: '@b', leaderIsPlayer: false } } }, { flag: 'in_stable' }, { rel: { who: 'b', trust: 5, respect: 3 } }, { rel: { who: 'a', heat: 6, respect: -3 } }, { pop: 0.4 }, { money: 3000 }, { tag: { who: 'b', tag: 'ally' } }] },
      { id: 'play', label: 'Play them against each other', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.5, mic: 0.3 }, text: `You string it out for a month and each raises their price. You pocket the extra, and walk away from both.`, effects: [{ money: 12000 }, { pop: 0.4 }, { conf: 3 }, { rel: { who: 'a', respect: 1 } }, { rel: { who: 'b', respect: 1 } }] },
        { weight: 2, text: `They compare notes. Both withdraw, and the story gets around that you are untrustworthy.`, effects: [{ pop: -0.5 }, { conf: -3 }, { rel: { who: 'a', trust: -6 } }, { rel: { who: 'b', trust: -6 } }] } ] },
      { id: 'neither', label: 'Turn both down', risk: 'low', result: `You tell both of them that you are your own boss. It earns you respect in a few corners.`, effects: [{ conf: 3 }, { rel: { who: 'a', respect: 2 } }, { rel: { who: 'b', respect: 2 } }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'fac_initiation', category: 'faction', title: 'The Initiation', weight: 2, cooldownDays: 150, maxPerCareer: 2,
    trigger: { flag: 'in_stable', noFlag: 'initiated' }, cast: { boss: { pick: 'tag', tag: 'ally' } },
    slots: { trial: [`a cold open in a blizzard of chairs`, `a night run through the arena corridors`, `a three-round sparring match with the biggest member`, `an unscripted promo in front of the whole roster`], witness: [`the stable`, `every member`, `a handful of invited veterans`] },
    body: [`{boss.name} says every member earns the badge. Yours is {trial}, with {witness} watching and judging.`, `Nobody has ever failed it on the record. A few people have quietly vanished from the group afterwards.`],
    choices: [
      { id: 'pass', label: 'Take the trial head-on', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5, overall: 0.3 }, text: `You pass with a bruise and a grin. The group claps, and the boss gives you the badge.`, effects: [{ rel: { who: 'boss', respect: 8, trust: 5 } }, { conf: 4 }, { fatigue: 6 }, { flag: 'initiated' }] },
        { weight: 1, text: `You stumble halfway through. {boss.first} lets you finish, but the badge is handed over without ceremony.`, effects: [{ rel: { who: 'boss', respect: -2 } }, { conf: -3 }, { fatigue: 6 }, { flag: 'initiated' }] } ] },
      { id: 'talk', label: 'Talk your way out of it', risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.6 }, text: `You charm the room until the boss laughs and drops it. Some people respect the move; others do not.`, effects: [{ rel: { who: 'boss', respect: 2 } }, { pop: 0.3 }, { flag: 'initiated' }] },
        { weight: 1, text: `The boss is not amused. You have a worse test coming, and a worse reputation.`, effects: [{ rel: { who: 'boss', respect: -4 } }, { conf: -2 }] } ] },
      { id: 'refuse', label: 'Refuse the trial', risk: 'high', result: `You tell {boss.first} that you do not do ceremonies. The group goes quiet. You keep your dignity and put your membership in question.`, effects: [{ rel: { who: 'boss', trust: -8, respect: -2 } }, { conf: 2 }, { pop: -0.1 }] },
      { id: 'raise', label: 'Raise the stakes and propose a harder trial', risk: 'high', result: `You propose something worse. The boss grins. You survive, and the legend of your first week is born.`, effects: [{ rel: { who: 'boss', respect: 10, trust: 4 } }, { fatigue: 12 }, { injury: { part: 'torso', severity: 1, days: 6 } }, { pop: 0.5 }, { flag: 'initiated' }] },
    ],
  },
  {
    id: 'fac_attack_champion', category: 'faction', title: '{boss.name} Orders an Attack', weight: 2, cooldownDays: 100, maxPerCareer: 2,
    trigger: { flag: 'in_stable' }, cast: { boss: { pick: 'tag', tag: 'ally' }, champ: { pick: 'champion', class: 'world' } },
    slots: { how: [`from behind, during the entrance`, `at ringside, as the champion's back is turned`, `in the parking lot with a camera crew`, `in the middle of the champion's promo`], reason: [`to send a message`, `to take a shot at the title`, `because the champion insulted the stable`] },
    body: [`{boss.name} wants the stable to ambush {champ.name} {how}, {reason}. You are expected to bring the weapons, or at least the nerve.`, `It is high-profile and high-risk. The champion is not someone you want as an enemy.`],
    choices: [
      { id: 'attack', label: 'Lead the ambush', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.4, popularity: 0.3 }, text: `You hit hard and fast, and the crowd erupts. The champion goes down and the stable steps into the spotlight.`, effects: [{ pop: 1.0 }, { rivalry: { who: 'champ', heat: 16 } }, { rel: { who: 'boss', respect: 6, trust: 4 } }, { fatigue: 5 }] },
        { weight: 1, text: `The champion fights back. You are the one who gets stretchered, and the boss blames the plan on you.`, effects: [{ pop: 0.3 }, { fatigue: 10 }, { injury: { part: 'arms', severity: 1, days: 8 } }, { rel: { who: 'boss', respect: -2 } }, { rivalry: { who: 'champ', heat: 12 } }] } ] },
      { id: 'hang_back', label: 'Hang back and let others do it', risk: 'low', result: `You stay at the edge. The others do the work and get the credit, and the boss notices who stood at the edge.`, effects: [{ rel: { who: 'boss', respect: -4, trust: -2 } }, { conf: -1 }, { fatigue: -1 }] },
      { id: 'warn_champ', label: 'Warn the champion and sell it anyway', risk: 'high', result: `You make sure the champion is ready. The ambush looks perfect and the champion owes you for the heads-up.`, effects: [{ rel: { who: 'champ', respect: 6, trust: 5 } }, { rel: { who: 'boss', trust: -1 } }, { pop: 0.6 }, { fatigue: 4 }] },
      { id: 'refuse', label: 'Refuse. It will cost the stable more than it wins', risk: 'med', result: `{boss.first} argues, then reluctantly changes the plan. You get credit as the smart one, and a lecture on loyalty.`, effects: [{ conf: 3 }, { rel: { who: 'boss', respect: 2, trust: -3 } }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'fac_expel_vote', category: 'faction', title: 'A Vote to Expel {mate.name}', weight: 2, cooldownDays: 100, maxPerCareer: 2,
    trigger: { flag: 'player_leads_stable' }, cast: { mate: { pick: 'tag', tag: 'ally' }, voter: { pick: 'roster', sameBrand: true } },
    slots: { crime: [`missing three shows in a row`, `bad-mouthing the leader in a magazine interview`, `a dirty finish that cost the group a title match`, `dropping the stable name from {mate.their} promo`], mood: [`bitter`, `tense`, `unusually quiet`] },
    body: [`The stable is {mood}. {voter.name} brings a formal motion to expel {mate.name} for {crime}, and you hold the deciding vote.`, `{mate.first} is in the room, saying nothing. The silence is its own argument.`],
    choices: [
      { id: 'expel', label: 'Vote to expel', risk: 'med', result: `The vote passes. {mate.first} walks out without a word, and the rest of the group tightens ranks.`, effects: [{ event: { type: 'faction_left', participants: ['mate'], summary: `{mate.name} was expelled from the stable.`, importance: 3, data: { factionId: 'stable_player', member: '@mate' } } }, { rel: { who: 'mate', heat: 12, trust: -12 } }, { rel: { who: 'voter', trust: 6, respect: 4 } }, { conf: 1 }] },
      { id: 'forgive', label: 'Vote to keep {mate.them}', risk: 'low', result: `The motion fails by one. {mate.first} looks stunned, and {voter.first} looks insulted.`, effects: [{ rel: { who: 'mate', trust: 10, respect: 5 } }, { rel: { who: 'voter', trust: -6, heat: 6 } }, { conf: 1 }] },
      { id: 'probation', label: 'Propose a probation period', risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The group accepts your compromise. {mate.first} nods, grateful, and keeps {mate.their} head down.`, effects: [{ rel: { who: 'mate', trust: 6, respect: 3 } }, { rel: { who: 'voter', trust: 1 } }, { pop: 0.1 }] },
        { weight: 1, text: `Nobody likes the compromise. The decision drags into next week and tempers fray.`, effects: [{ rel: { who: 'mate', trust: -2 } }, { rel: { who: 'voter', trust: -2 } }, { conf: -2 }] } ] },
      { id: 'abstain', label: 'Abstain and let the group decide', risk: 'med', result: `You refuse to be the deciding vote. The group splits, and your leadership looks weak.`, effects: [{ conf: -3 }, { rel: { who: 'mate', trust: -2 } }, { rel: { who: 'voter', trust: -2 } }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'fac_merch_split', category: 'faction', title: 'Who Gets What from the Merchandise', weight: 2, cooldownDays: 120, maxPerCareer: 2,
    trigger: { flag: 'in_stable', stat: { popularity: { gte: 35 } } }, cast: { boss: { pick: 'tag', tag: 'ally' }, agent: { pick: 'staff', role: 'agent' } },
    slots: { item: [`a stable T-shirt`, `a new championship-style belt replica`, `a limited-edition poster`, `a branded jacket`], share: [`a flat fee`, `an even split`, `a larger cut for the leader`] },
    body: [`The company wants {item}, and the question of the split is raised by {agent.name}. {boss.name} suggests {share}, though your name is on the biggest-selling design.`, `It is not the most dramatic argument you have had in the stable, but it is the one that could easily end it.`],
    choices: [
      { id: 'accept', label: 'Accept the boss\'s split', risk: 'low', result: `You sign without a fight. {boss.first} is pleased, and you feel your share shrink.`, effects: [{ rel: { who: 'boss', trust: 4, respect: 1 } }, { money: 2000 }, { conf: -2 }] },
      { id: 'demand', label: 'Demand a bigger cut', risk: 'high', outcomes: [
        { weight: 2, bonus: { popularity: 0.4, charisma: 0.3 }, text: `{agent.name} sides with you on the numbers. The boss gives in, and the others stew.`, effects: [{ money: 12000 }, { rel: { who: 'boss', trust: -6, heat: 6 } }, { conf: 2 }] },
        { weight: 1, text: `The boss digs in. You get the same split as before and a lasting reputation as greedy.`, effects: [{ money: 1000 }, { rel: { who: 'boss', trust: -8, heat: 8 } }, { conf: -2 }, { pop: -0.2 }] } ] },
      { id: 'share_even', label: 'Propose an even split for all', risk: 'low', result: `It is the fair choice and the stable loves you for it. It costs you in the wallet.`, effects: [{ rel: { who: 'boss', respect: 3 } }, { money: -1000 }, { conf: 2 }, { pop: 0.2 }] },
      { id: 'go_agent', label: 'Cut a private deal with the agent', risk: 'high', result: `You quietly sign a solo contract on the side. It pays, but it is the kind of thing that leaks.`, effects: [{ money: 8000 }, { rel: { who: 'boss', trust: -10, respect: -2 } }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'fac_rival_stable_war', category: 'faction', title: 'A Rival Stable Moves In', weight: 2, cooldownDays: 100, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 30 } } }, cast: { head: { pick: 'roster', tier: { gte: 2 }, sameBrand: true, alignment: 'heel' }, ally: { pick: 'tag', tag: 'ally' } },
    slots: { move: [`jumped you in the parking lot`, `trashed your dressing room`, `laid out a message in spray-paint on your gear bag`, `cornered you after the show`], aftermath: [`The cameras caught it.`, `Only the crew saw it.`, `You have one witness.`] },
    body: [`{head.name}'s group {move}. {aftermath} {ally.name} was with you and is ready to fight back.`, `You could escalate, or you could use it to your advantage. The fans have been waiting for a war.`],
    choices: [
      { id: 'war', label: 'Declare war on the stable', risk: 'high', result: `You grab the microphone and issue a challenge. The fans scream for blood.`, effects: [{ rivalry: { who: 'head', heat: 18 } }, { promise: { kind: 'win_match', who: 'head', text: `I will end {head.name}'s stable`, deadlineDays: 60 } }, { pop: 0.9 }, { rel: { who: 'ally', respect: 4 } }, { fatigue: 5 }] },
      { id: 'report', label: 'Report it to management', risk: 'low', result: `The office promises to deal with it. It will not. But you are on record as the reasonable one.`, effects: [{ pop: 0.2 }, { rel: { who: 'head', heat: 4 } }, { conf: -1 }] },
      { id: 'recruit', label: 'Recruit allies for a counter-strike', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `A few friendly faces join in, and the counter-strike looks professional.`, effects: [{ rel: { who: 'ally', trust: 5, respect: 4 } }, { rivalry: { who: 'head', heat: 12 } }, { pop: 0.7 }] },
        { weight: 1, text: `Nobody wants to be involved. You are left holding the idea, and the stable laughs.`, effects: [{ conf: -3 }, { rel: { who: 'head', respect: 2 } }, { pop: -0.2 }] } ] },
      { id: 'parley', label: 'Seek a quiet meeting with the leader', risk: 'med', result: `{head.first} agrees to a sit-down. It cools things, if only a degree.`, effects: [{ rel: { who: 'head', heat: -6, respect: 3 } }, { rivalry: { who: 'head', heat: -6 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'fac_stable_ends', category: 'faction', title: 'The Stable Falls Apart', weight: 2, major: true, cooldownDays: 200, maxPerCareer: 1,
    trigger: { flag: 'in_stable', recent: { lossesGte: 3 } }, cast: { boss: { pick: 'tag', tag: 'ally' }, creative: { pick: 'staff', role: 'creative' } }, memory: { role: 'boss', max: 2 },
    slots: { cause: [`three straight losses`, `a ratings dip the office blames on the group`, `a leadership fight nobody can contain`], finale: [`a final tag match`, `a locker room brawl`, `a tearful speech`] },
    body: [`After {cause}, {creative.name} has decided the stable is done. {boss.name} wants one last stand: {finale}, with you at the center.`, `Nobody is sure whether this is an ending or a bargaining chip.`],
    choices: [
      { id: 'last_stand', label: 'Go out swinging together', risk: 'med', result: `The final show is raw and emotional, and the crowd chants for the group long after the lights come up.`, effects: [{ event: { type: 'faction_left', participants: ['boss'], summary: `The stable with {boss.name} ended with a final stand.`, importance: 3, data: { factionId: 'stable_crimson', member: 'player' } } }, { clearFlag: 'in_stable' }, { rel: { who: 'boss', trust: 8, respect: 6 } }, { pop: 0.6 }, { fatigue: 6 }] },
      { id: 'turn', label: 'Turn on the boss as a closer', risk: 'high', result: `You turn on {boss.first} in the finale. The crowd is stunned, and so is the dressing room.`, effects: [{ event: { type: 'betrayal', participants: ['boss'], summary: `Turned on {boss.name} to end the stable.`, importance: 4, data: { context: 'faction', byPlayer: true } } }, { event: { type: 'faction_left', participants: ['boss'], summary: `The stable ended when you turned on {boss.name}.`, importance: 3, data: { factionId: 'stable_crimson', member: 'player' } } }, { clearFlag: 'in_stable' }, { pop: 1.0 }, { rivalry: { who: 'boss', heat: 16 } }] },
      { id: 'fight_end', label: 'Fight the ending, pitch a relaunch', risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.4, mic: 0.4 }, text: `{creative.name} is persuaded, and the group is retooled with a fresh gimmick. The fans, to your surprise, are pleased.`, effects: [{ pop: 0.6 }, { rel: { who: 'boss', trust: 5 } }, { conf: 2 }] },
        { weight: 2, text: `{creative.name} refuses and the stable ends anyway, with you looking like a sore loser.`, effects: [{ clearFlag: 'in_stable' }, { conf: -3 }, { pop: -0.3 }] } ] },
      { id: 'walk', label: 'Walk away before the finale', risk: 'low', result: `You skip the final show. The stable ends without you, and the others never forget it.`, effects: [{ event: { type: 'faction_left', participants: ['boss'], summary: `Left {boss.name}'s stable just before it ended.`, importance: 3, data: { factionId: 'stable_crimson', member: 'player' } } }, { clearFlag: 'in_stable' }, { rel: { who: 'boss', trust: -8, respect: -4 } }, { conf: -1 }] },
    ],
  },
  // ===================================================================== MENTOR
  {
    id: 'men_upstart_asks', category: 'mentor', title: '{kid.name} Wants to Learn from You', weight: 3, cooldownDays: 80, maxPerCareer: 3,
    trigger: { stat: { popularity: { gte: 25 }, careerYears: { gte: 1 } } }, cast: { kid: { pick: 'roster', tier: { lte: 1 }, sameBrand: true } },
    slots: { ask: [`catches you by the tunnel curtain`, `waits for you outside the arena`, `finds you in catering`, `shows up at your gym at dawn`], want: [`how to read a crowd`, `how to work a long match`, `how to cut a promo without a script`, `how to take a bump and stay on the card`] },
    body: [`{kid.name} {ask} and asks, awkwardly but clearly, to be taught {want}. The kid has talent and the habits of someone who has not yet been punished for them.`, `"I will do the early mornings, I will carry the bags," {kid.they} adds. Every veteran who helped you did it on their own time, and the question now is whether you are willing to return that favor.`],
    choices: [
      { id: 'mentor', label: 'Take {kid.first} under your wing', risk: 'med', result: `You commit. The next few weeks of early mornings pay off for both of you, and word gets around that you are a fair teacher.`, effects: [{ event: { type: 'mentorship', participants: ['kid'], summary: `Took {kid.name} under {player.their} wing.`, importance: 3, data: { byPlayer: true } } }, { rel: { who: 'kid', trust: 8, respect: 8 } }, { fatigue: 6 }, { pop: 0.3 }] },
      { id: 'one_lesson', label: 'Offer one lesson and nothing more', risk: 'low', result: `You give the kid an hour. It is clear, concise and non-binding, and {kid.first} leaves with more than expected.`, effects: [{ rel: { who: 'kid', respect: 5, trust: 2 } }, { fatigue: 2 }, { pop: 0.1 }, { tag: { who: 'kid', tag: 'respected_by' } }] },
      { id: 'price', label: 'Teach, but make the kid earn it', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `{kid.first} carries your bags, studies tape and works the early mornings. By the end, the lessons stick.`, effects: [{ event: { type: 'mentorship', participants: ['kid'], summary: `Took on {kid.name} as a hard-working student.`, importance: 3, data: { byPlayer: true } } }, { rel: { who: 'kid', trust: 6, respect: 10 } }, { pop: 0.2 }, { fatigue: 4 }] },
        { weight: 1, text: `The kid quits after two weeks and tells everyone you are a tyrant. Some believe it.`, effects: [{ rel: { who: 'kid', respect: -4, heat: 6 } }, { pop: -0.3 }, { conf: -2 }] } ] },
      { id: 'decline', label: 'Decline: you have enough on your plate', risk: 'low', result: `You tell {kid.first} to ask someone else. It is honest and a little cold, and it saves you the energy.`, effects: [{ rel: { who: 'kid', respect: -2 } }, { fatigue: -2 }, { conf: 1 }] },
    ],
  },
  {
    id: 'men_vet_offers', category: 'mentor', title: '{vet.name} Offers to Mentor You', weight: 3, cooldownDays: 100, maxPerCareer: 2,
    trigger: { stat: { careerYears: { lte: 4 }, popularity: { lte: 60 } } }, cast: { vet: { pick: 'roster', tier: { gte: 3 }, sameBrand: true } },
    slots: { sign: [`watched your last three matches`, `noticed your habit of rushing the finish`, `heard you ask smart questions in a seminar`, `seen a younger self in your early work`], setting: [`a quiet corner of the trainer's room`, `the front seat of a car`, `a sports bar near the arena`] },
    body: [`In {setting}, {vet.name} says {vet.they} has {sign} and would like to teach you. "I'm not doing this for charity," the veteran adds. "I'm doing it because I want somebody to remember it."`, `An offer like this gets careers moving, and it also puts you under someone's eye, and someone's shadow.`],
    choices: [
      { id: 'accept', label: 'Accept eagerly', risk: 'low', result: `You shake on it. Over the next months, you pick up habits you will keep for the rest of your career.`, effects: [{ event: { type: 'mentorship', participants: ['vet'], summary: `Accepted {vet.name}'s mentorship.`, importance: 3, data: { byPlayer: false } } }, { attr: { name: 'psychology', delta: 1 } }, { rel: { who: 'vet', trust: 6, respect: 6 } }, { pop: 0.2 }, { fatigue: 4 }] },
      { id: 'terms', label: 'Accept, but keep your own style', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `{vet.first} grunts approval. "Good. I'd rather work with someone who argues." The balance holds.`, effects: [{ event: { type: 'mentorship', participants: ['vet'], summary: `Accepted {vet.name}'s mentorship, on your own terms.`, importance: 3, data: { byPlayer: false } } }, { rel: { who: 'vet', respect: 6, trust: 3 } }, { conf: 2 }] },
        { weight: 1, text: `{vet.first} frowns. "Then you don't want a mentor, you want an audience." The offer is withdrawn.`, effects: [{ rel: { who: 'vet', respect: -3 } }, { conf: -2 }] } ] },
      { id: 'test', label: 'Ask what the veteran wants in return', risk: 'med', result: `{vet.first} laughs, then names a price: a favor to be called in later. You will have to decide whether that is fair.`, effects: [{ rel: { who: 'vet', respect: 2 } }, { flag: 'owes_veteran' }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'decline', label: 'Decline politely: you will find your own way', risk: 'low', result: `The vet shrugs. "Fair enough." The door stays open, but only just.`, effects: [{ conf: 2 }, { rel: { who: 'vet', respect: -1 } }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'men_lesson_price', category: 'mentor', title: 'A Lesson with a Price Tag', weight: 2, cooldownDays: 90, maxPerCareer: 3,
    trigger: { stat: { money: { gte: 10000 } } }, cast: { vet: { pick: 'roster', tier: { gte: 3 }, sameBrand: true } },
    slots: { lesson: [`a finishing move that never fails`, `a bulletproof way to sell`, `the art of the comeback`, `a promo routine that never gets old`], price: [`a hefty fee in cash`, `a fee and a long dinner on top`, `your match bonus this week`, `most of a month's savings`] },
    body: [`{vet.name} knows something you need: {lesson}. It has been in the family for years, and {vet.they} is willing to sell it for {price}.`, `It could be the best investment of your career. It could also be a clever way to get paid for something that costs nothing.`],
    choices: [
      { id: 'pay', label: 'Pay and learn it properly', risk: 'low', outcomes: [
        { weight: 3, bonus: { overall: 0.3 }, text: `The lesson is worth every cent. You leave with a technique you will use for years.`, effects: [{ money: -6000 }, { attr: { name: 'technical', delta: 1 } }, { rel: { who: 'vet', respect: 3, trust: 3 } }, { conf: 2 }] },
        { weight: 1, text: `The lesson is thinner than advertised. You learned one useful thing and you feel a bit foolish.`, effects: [{ money: -6000 }, { conf: -1 }, { rel: { who: 'vet', respect: -2 } }] } ] },
      { id: 'barter', label: 'Offer a favor instead of money', risk: 'med', result: `{vet.first} thinks it over, then agrees. You owe a favor that you will not like.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { rel: { who: 'vet', trust: 2 } }, { flag: 'owes_veteran' }, { fatigue: 3 }] },
      { id: 'haggle', label: 'Haggle hard', risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: `You talk the price down by half and earn a grudging grin. "You'll go far."`, effects: [{ money: -2500 }, { attr: { name: 'technical', delta: 1 } }, { rel: { who: 'vet', respect: 4 } }] },
        { weight: 1, text: `{vet.first} scowls and rescinds the offer. "Information is not a market stall."`, effects: [{ rel: { who: 'vet', respect: -3 } }, { conf: -1 }] } ] },
      { id: 'refuse', label: 'Decline: nothing worth knowing is for sale', risk: 'low', result: `You walk away. Some of the veterans respect the principle; some think you missed a gift.`, effects: [{ conf: 1 }, { rel: { who: 'vet', respect: 1 } }] },
    ],
  },
  {
    id: 'men_haze_test', category: 'mentor', title: '{vet.name} Tests Your Nerve', weight: 3, cooldownDays: 90, maxPerCareer: 3,
    trigger: { stat: { careerYears: { lte: 3 } } }, cast: { vet: { pick: 'roster', tier: { gte: 3 }, sameBrand: true } },
    slots: { test: [`a stiff, no-warning chop in the first exchange`, `a sudden change of finish in the ring`, `a deliberately unfriendly crowd plant`, `a backstage rib that leaves you in a wet costume`], mood: [`a straight face`, `a hint of a smile`, `a long stare`] },
    body: [`Tonight, {vet.name} tests you with {test}, and watches for your response with {mood}. This is an old initiation, and everybody in the locker room knows it.`, `Take it wrong and you are marked as soft. Take it right and you may earn something money cannot buy.`],
    choices: [
      { id: 'take_it', label: 'Take it and keep going', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: `You ride it out without a word. At the end, {vet.first} offers a short nod. It is the first real respect you have earned.`, effects: [{ rel: { who: 'vet', respect: 8, trust: 4 } }, { conf: 4 }, { fatigue: 5 }, { tag: { who: 'vet', tag: 'respected_by' } }] },
        { weight: 1, text: `It rattles you. The match comes unglued, and the vet watches without comment.`, effects: [{ conf: -4 }, { fatigue: 5 }, { rel: { who: 'vet', respect: -1 } }] } ] },
      { id: 'fire_back', label: 'Fire back harder', risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.4, confidence: 0.3 }, text: `You return the favor with interest, and the veteran grins through a split lip. "Okay. Now we're talking."`, effects: [{ rel: { who: 'vet', respect: 10, heat: 3 } }, { conf: 4 }, { pop: 0.3 }, { fatigue: 6 }] },
        { weight: 2, text: `You go too far and the vet shuts it down hard. You are in trouble with the agent and the locker room.`, effects: [{ rel: { who: 'vet', heat: 10, respect: -3 } }, { pop: -0.4 }, { conf: -2 }, { fatigue: 6 }] } ] },
      { id: 'report', label: 'Report it to the agent', risk: 'low', result: `The agent frowns and leaves it at that. Your name goes onto a different list in the veteran's head.`, effects: [{ rel: { who: 'vet', respect: -6, trust: -3 } }, { conf: -1 }, { pop: -0.1 }] },
      { id: 'laugh', label: 'Laugh it off and ask for the next one', risk: 'low', result: `You hold up a hand and grin. The vet's face softens, and the rest of the locker room starts to like you.`, effects: [{ rel: { who: 'vet', respect: 4, affinity: 3 } }, { pop: 0.2 }, { conf: 1 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'men_pupil_outshines', category: 'mentor', title: 'The Student Steals the Show', weight: 2, cooldownDays: 100, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 35 } } }, cast: { pupil: { pick: 'tag', tag: 'mentee' } }, memory: { role: 'pupil', max: 2 },
    slots: { moment: [`a flawless promo`, `a high-risk dive`, `a roaring win over a former champion`, `a standing ovation in your home city`], reaction: [`the crew crowds around {pupil.them}`, `the producer shakes {pupil.their} hand`, `the front office starts using {pupil.their} name`] },
    body: [`{pupil.name} has just landed {moment}, and {reaction}. You taught most of what made it work.`, `You are proud and a little jealous at once. You are not the only one who has noticed.`],
    choices: [
      { id: 'celebrate', label: 'Celebrate loudly in front of everyone', risk: 'low', result: `You lead the applause. {pupil.first} blushes and the room warms to you both.`, effects: [{ rel: { who: 'pupil', trust: 8, respect: 6, affinity: 5 } }, { pop: 0.3 }, { conf: -1 }] },
      { id: 'take_credit', label: 'Remind the room who taught {pupil.them}', risk: 'med', outcomes: [
        { weight: 1, bonus: { popularity: 0.4 }, text: `Some people nod. The credit helps your standing, though {pupil.first} winces.`, effects: [{ pop: 0.4 }, { rel: { who: 'pupil', trust: -4, respect: -3 } }] },
        { weight: 2, text: `It sounds petty. The crowd turns on you and {pupil.first} stops returning your calls.`, effects: [{ pop: -0.5 }, { conf: -3 }, { rel: { who: 'pupil', trust: -8, respect: -6 } }] } ] },
      { id: 'challenge', label: 'Challenge {pupil.them} to a match to see how far {pupil.they} has come', risk: 'high', result: `The pupil accepts, shaking a little. It is the right kind of nerves, and the office books it.`, effects: [{ booking: { who: 'pupil', type: 'singles' } }, { rel: { who: 'pupil', respect: 5 } }, { pop: 0.4 }, { fatigue: 4 }] },
      { id: 'step_back', label: 'Step back and let {pupil.them} have the moment', risk: 'low', result: `You keep your distance and let the pupil enjoy it. It is gracious, and just a bit lonely.`, effects: [{ rel: { who: 'pupil', trust: 4, respect: 3 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'men_mentor_retires', category: 'mentor', title: '{mentor.name} Is Hanging It Up', weight: 3, major: true, cooldownDays: 200, maxPerCareer: 1,
    trigger: { stat: { popularity: { gte: 30 } } }, cast: { mentor: { pick: 'tag', tag: 'mentor' } }, memory: { role: 'mentor', max: 3 },
    slots: { reason: [`a body that finally says no`, `a family at home`, `a coaching job at last`, `a long overdue need for a quiet life`], request: [`to carry on a tradition`, `to take over a favorite spot on the card`, `to deliver a speech at the farewell show`] },
    body: [`{mentor.name} calls you aside and says it plainly: this is the last year. The reason is {reason}, and {mentor.they} wants you {request}.`, `That kind of request comes only once. How you answer says who you are.`],
    choices: [
      { id: 'honour', label: 'Accept the request with a full heart', risk: 'low', result: `You make the farewell speech. It is the best you have ever done, and half the locker room is in tears. {mentor.first} grips your shoulder.`, effects: [{ rel: { who: 'mentor', trust: 10, respect: 10, affinity: 8 } }, { pop: 0.6 }, { conf: 3 }, { fatigue: 4 }] },
      { id: 'dissuade', label: 'Try to talk {mentor.them} out of retiring', risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: `{mentor.first} postpones for a few months, thanking you for the faith. The retirement plan is only delayed.`, effects: [{ rel: { who: 'mentor', trust: 4 } }, { conf: 1 }, { pop: 0.2 }] },
        { weight: 2, text: `{mentor.first} stares at you, hurt. "I'm asking you to respect me." The request is withdrawn.`, effects: [{ rel: { who: 'mentor', respect: -4, trust: -2 } }, { conf: -2 }] } ] },
      { id: 'one_last', label: 'Ask for one last match against you', risk: 'med', result: `{mentor.first} laughs. "One last time, then." The office sells it as an event, and the crowd cries.`, effects: [{ booking: { who: 'mentor', type: 'singles' } }, { rel: { who: 'mentor', respect: 8, trust: 4 } }, { pop: 0.8 }, { fatigue: 5 }] },
      { id: 'nod', label: 'Wish {mentor.them} well and leave it there', risk: 'low', result: `You shake hands and go. It is polite and brief, and neither of you says what you meant.`, effects: [{ rel: { who: 'mentor', trust: -2, respect: -2 } }, { conf: -2 }] },
    ],
  },
  {
    id: 'men_bad_advice', category: 'mentor', title: 'The Mentor\'s Advice Is Wrong', weight: 2, cooldownDays: 80, maxPerCareer: 3,
    trigger: { stat: { overall: { gte: 45 } } }, cast: { mentor: { pick: 'tag', tag: 'mentor' }, agent: { pick: 'staff', role: 'agent' } },
    slots: { advice: [`skip the rehearsal and trust your instincts`, `take more risks in the ring`, `never share a spot with a bigger star`, `turn down the office's next idea`], era: [`the way it was done back in the day`, `how the old school does it`, `the only way {mentor.they} ever learned`] },
    body: [`{mentor.name} tells you to {advice}. {mentor.they} calls it {era}, and it directly contradicts what {agent.name} said an hour ago.`, `You trust one of them for experience and the other for current information, and you cannot do both.`],
    choices: [
      { id: 'mentor', label: 'Follow the mentor\'s advice', risk: 'med', outcomes: [
        { weight: 1, bonus: { overall: 0.4 }, text: `The old advice turns out to be right for once. The match is better than any rehearsal would have made it.`, effects: [{ pop: 0.6 }, { rel: { who: 'mentor', respect: 6, trust: 4 } }, { conf: 2 }] },
        { weight: 2, text: `It backfires. The agent is annoyed and the crowd is lukewarm.`, effects: [{ pop: -0.5 }, { conf: -3 }, { rel: { who: 'mentor', trust: 2 } }] } ] },
      { id: 'agent', label: 'Follow the agent and tell the mentor', risk: 'med', result: `You choose the modern way and explain it carefully. {mentor.first} takes it hard, but respects the honesty.`, effects: [{ pop: 0.3 }, { rel: { who: 'mentor', trust: -3, respect: 2 } }, { conf: 1 }] },
      { id: 'blend', label: 'Combine both approaches', risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.3, overall: 0.3 }, text: `You find a middle path that makes both of them happy, and the audience, too.`, effects: [{ pop: 0.5 }, { rel: { who: 'mentor', respect: 3 } }, { conf: 2 }, { fatigue: 3 }] },
        { weight: 1, text: `The blend satisfies nobody. The match feels indecisive.`, effects: [{ pop: -0.2 }, { conf: -1 }] } ] },
      { id: 'argue', label: 'Get the two of them in a room together', risk: 'high', result: `You arrange a sit-down. They argue for ten minutes and end up agreeing about a third idea nobody expected.`, effects: [{ conf: 2 }, { rel: { who: 'mentor', trust: 1 } }, { pop: 0.1 }, { fatigue: 4 }] },
    ],
  },
  {
    id: 'men_pupil_trouble', category: 'mentor', title: '{pupil.name} Got Into Trouble', weight: 2, cooldownDays: 80, maxPerCareer: 3,
    trigger: {}, cast: { pupil: { pick: 'tag', tag: 'mentee' }, gm: { pick: 'staff', role: 'gm' } },
    slots: { slip: [`missed a flight to a big show`, `argued with a producer in front of the crew`, `showed up unprepared for a taped promo`, `got an interview answer badly wrong`], consequence: [`a fine and a warning`, `a short suspension`, `a place on the "watch list"`] },
    body: [`{pupil.name} {slip}, and {gm.name} is considering {consequence}. {pupil.first} comes to you for help.`, `You were once the one making similar mistakes. The difference is that someone covered for you.`],
    choices: [
      { id: 'vouch', label: 'Vouch for the pupil to {gm.first}', risk: 'med', outcomes: [
        { weight: 2, bonus: { popularity: 0.4 }, text: `{gm.name} listens and softens the penalty. {pupil.first} is grateful, and you have spent some credit.`, effects: [{ rel: { who: 'pupil', trust: 8, respect: 6 } }, { pop: -0.1 }, { conf: 1 }] },
        { weight: 1, text: `{gm.name} bristles. "I decide who gets a warning." The penalty stands, and you are added to the list.`, effects: [{ rel: { who: 'pupil', trust: 3 } }, { pop: -0.3 }, { conf: -2 }] } ] },
      { id: 'lesson', label: 'Let {pupil.them} take the consequence and learn', risk: 'low', result: `You support {pupil.them} from the sideline. It stings, but it sticks, and later {pupil.first} says it was the best thing you ever did.`, effects: [{ rel: { who: 'pupil', respect: 5, trust: 2 } }, { conf: 1 }, { pop: 0.1 }] },
      { id: 'cover', label: 'Take the blame yourself', risk: 'high', result: `You tell the GM it was your fault. The penalty lands on you, and the pupil never forgets it.`, effects: [{ rel: { who: 'pupil', trust: 14, respect: 10, affinity: 6 } }, { money: -4000 }, { pop: -0.2 }, { conf: -2 }] },
      { id: 'distance', label: 'Distance yourself from the mess', risk: 'low', result: `You decide it is not your fight. {pupil.first} feels abandoned, and you save the credit.`, effects: [{ rel: { who: 'pupil', trust: -8, respect: -4 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'men_tape_session', category: 'mentor', title: 'A Night with the Tape', weight: 2, cooldownDays: 70, maxPerCareer: 4,
    trigger: { stat: { matches: { gte: 10 } } }, cast: { coach: { pick: 'staff', role: 'coach' }, vet: { pick: 'roster', tier: { gte: 3 }, sameBrand: true } },
    slots: { reel: [`your last three losses`, `the best match of your career`, `a classic from a legend`, `footage of your debut`], mood: [`in a dark production room`, `over cold pizza`, `with the volume low`] },
    body: [`{coach.name} sets up a screening {mood}, with {vet.name} pulling up a chair beside you. The tape is {reel}.`, `Watching yourself work is a rare luxury. Watching with someone who sees what you cannot is rarer still.`],
    choices: [
      { id: 'study', label: 'Take notes and ask questions all night', risk: 'low', result: `By dawn your notebook is full and your head is spinning. You have learned two real things and a dozen small ones.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { fatigue: 8 }, { rel: { who: 'vet', respect: 4 } }, { conf: 1 }] },
      { id: 'argue', label: 'Argue every criticism', risk: 'med', outcomes: [
        { weight: 1, bonus: { confidence: 0.4 }, text: `Your defense wins the room. {vet.first} concedes a point, and you get an unexpected laugh.`, effects: [{ rel: { who: 'vet', respect: 6 } }, { conf: 3 }, { fatigue: 4 }] },
        { weight: 2, text: `You come across as defensive. {vet.first} stops talking, and {coach.first} ends the session early.`, effects: [{ rel: { who: 'vet', respect: -3 } }, { conf: -2 }, { fatigue: 3 }] } ] },
      { id: 'skip', label: 'Skip the second half and rest instead', risk: 'low', result: `You leave early to sleep. The vet shrugs, and your body thanks you for it.`, effects: [{ fatigue: -6 }, { rel: { who: 'vet', respect: -2 } }, { conf: 1 }] },
      { id: 'teach_back', label: 'Point out something the vet missed', risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.4 }, text: `You spot something the vet had missed, and the room goes quiet. "Huh," says {vet.first}. "You're right."`, effects: [{ rel: { who: 'vet', respect: 8 } }, { conf: 4 }, { fatigue: 4 }] },
        { weight: 2, text: `You are wrong, and spectacularly so. The silence in the room lasts a very long time.`, effects: [{ conf: -4 }, { rel: { who: 'vet', respect: -2 } }, { fatigue: 4 }] } ] },
    ],
  },
  {
    id: 'men_legend_story', category: 'mentor', title: 'A Story from the Old Days', weight: 2, cooldownDays: 90, maxPerCareer: 3,
    trigger: { stat: { careerYears: { lte: 6 } } }, cast: { legend: { pick: 'roster', tier: { gte: 4 } } },
    slots: { setting: [`a long bus ride`, `a quiet stretch in the hotel bar`, `a rain delay at the airport`, `the last hour before doors`], tale: [`the night the arena lost power and the match went on in the dark`, `the time a title run ended before it began`, `a feud that cost {legend.them} a friend`, `how a booker once saved {legend.their} career by firing {legend.them}`] },
    body: [`During {setting}, {legend.name} starts telling a story about {tale}. It does not sound like a lesson at first, just a story, but by the end you realize it was meant for you.`, `The veteran watches you the whole time, curious to see what you take from it.`],
    choices: [
      { id: 'listen', label: 'Listen closely and take it in', risk: 'low', result: `You say little, and absorb a lot. Weeks later, you find yourself using what you learned without noticing.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { rel: { who: 'legend', respect: 4, trust: 3 } }, { conf: 1 }] },
      { id: 'question', label: 'Ask the hard question underneath it', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `{legend.first} pauses, then answers honestly. It is the truest thing you have heard all year.`, effects: [{ rel: { who: 'legend', respect: 8, trust: 6 } }, { attr: { name: 'psychology', delta: 1 } }, { conf: 2 }] },
        { weight: 1, text: `The question lands wrong. {legend.first} falls silent and stares out of the window.`, effects: [{ rel: { who: 'legend', respect: -2 } }, { conf: -2 }] } ] },
      { id: 'share', label: 'Offer a story of your own in return', risk: 'med', result: `The two of you swap war stories until one of you has to leave. It is not a lesson, it is the start of a friendship, and it is worth more than a lesson.`, effects: [{ rel: { who: 'legend', affinity: 8, trust: 6 } }, { tag: { who: 'legend', tag: 'respected_by' } }, { fatigue: 4 }, { pop: 0.1 }] },
      { id: 'cut_short', label: 'Make an excuse and slip away', risk: 'low', result: `You leave to prepare for your match. The legend pretends not to mind.`, effects: [{ rel: { who: 'legend', respect: -3 } }, { fatigue: -2 }, { conf: 1 }] },
    ],
  },
  {
    id: 'men_pupil_wants_win', category: 'mentor', title: '{pupil.name} Wants a Win from You', weight: 2, cooldownDays: 90, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 35 } } }, cast: { pupil: { pick: 'tag', tag: 'mentee' } }, memory: { role: 'pupil', max: 1 },
    slots: { why: [`{pupil.their} contract is up for renewal`, `the office is deciding whether to push {pupil.them}`, `{pupil.they} is close to a breakthrough`, `a cold streak is wearing {pupil.them} down`], ask: [`asks you straight out`, `hints so hard it hurts`, `offers to return the favor`] },
    body: [`{pupil.name} {ask}: a clean win over you in the next match. {why}, and one result could change a lot.`, `You have the position to give it, and the pride to dislike it. There is no neutral way to answer.`],
    choices: [
      { id: 'give', label: 'Put {pupil.them} over, cleanly', risk: 'med', result: `You lose with grace. {pupil.first} cannot hide the gratitude, and the office takes notice of {pupil.their} rise.`, effects: [{ rel: { who: 'pupil', trust: 12, respect: 8 } }, { pop: -0.4 }, { conf: -2 }, { money: -2000 }] },
      { id: 'earn', label: 'Tell {pupil.them} to earn it', risk: 'low', result: `You offer a fair match, no gifts. {pupil.first} scowls, then nods. You both know it is the right call.`, effects: [{ booking: { who: 'pupil', type: 'singles' } }, { rel: { who: 'pupil', respect: 5 } }, { fatigue: 3 }, { pop: 0.2 }] },
      { id: 'trade', label: 'Give the win in exchange for a future favor', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The pupil agrees at once. The trade is kept quiet, and honored.`, effects: [{ rel: { who: 'pupil', trust: 4, respect: 2 } }, { pop: -0.2 }, { conf: 1 }, { money: 3000 }] },
        { weight: 1, text: `The pupil is hurt that you made it a trade. The relationship has a small crack that does not heal quickly.`, effects: [{ rel: { who: 'pupil', trust: -6, respect: -2 } }, { conf: -1 }] } ] },
      { id: 'refuse', label: 'Refuse. Wins are not a favor', risk: 'low', result: `You decline gently but firmly. The pupil understands but does not like it.`, effects: [{ rel: { who: 'pupil', trust: -4, respect: 1 } }, { conf: 2 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'men_training_school', category: 'mentor', title: 'Teach at the Training School', weight: 2, cooldownDays: 120, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 35 }, careerYears: { gte: 2 } } }, cast: { coach: { pick: 'staff', role: 'coach' }, kid: { pick: 'roster', tier: { lte: 1 } } },
    slots: { shift: [`two mornings a week`, `a weekend each month`, `a full week during the off-season`], pay: [`a modest stipend`, `a gym membership`, `a seat on the staff payroll`] },
    body: [`{coach.name} asks whether you would teach {shift} at the training school, for {pay}. {kid.name} is in the class and has asked for you by name.`, `It would be good for your reputation, though a drain on your own recovery.`],
    choices: [
      { id: 'teach', label: 'Teach the class properly', risk: 'med', result: `You commit. The students improve noticeably, and word gets back to management that you are a safe pair of hands.`, effects: [{ event: { type: 'mentorship', participants: ['kid'], summary: `Taught {kid.name} at the training school.`, importance: 3, data: { byPlayer: true } } }, { fatigue: 9 }, { money: 3000 }, { rel: { who: 'kid', respect: 8, trust: 5 } }, { pop: 0.3 }] },
      { id: 'guest', label: 'Appear once as a guest instructor', risk: 'low', result: `You do a single session and leave. It looks good and costs little.`, effects: [{ fatigue: 3 }, { pop: 0.2 }, { rel: { who: 'kid', respect: 3 } }, { money: 500 }] },
      { id: 'pitch', label: 'Pitch yourself as the head trainer', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.4, popularity: 0.3 }, text: `{coach.name} is impressed by the ambition. You get a bigger role and a bigger paycheck.`, effects: [{ money: 8000 }, { fatigue: 10 }, { pop: 0.3 }, { rel: { who: 'kid', respect: 6 } }] },
        { weight: 2, text: `{coach.name} bristles at your presumption. The offer is quietly withdrawn.`, effects: [{ conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'decline', label: 'Decline: you need your rest', risk: 'low', result: `You thank {coach.first} and turn it down. Your body appreciates it more than the school.`, effects: [{ fatigue: -4 }, { conf: 1 }, { rel: { who: 'kid', respect: -2 } }] },
    ],
  },
  {
    id: 'men_mentor_feud_agent', category: 'mentor', title: 'Caught Between Your Mentor and the Agent', weight: 2, cooldownDays: 100, maxPerCareer: 2,
    trigger: {}, cast: { mentor: { pick: 'tag', tag: 'mentor' }, agent: { pick: 'staff', role: 'agent' } },
    slots: { issue: [`how your finish should look`, `whether you should wear a new look`, `how much to rely on your signature move`, `how often you should work the house shows`], temper: [`a raised voice`, `icy politeness`, `a slammed door`] },
    body: [`{mentor.name} and {agent.name} have been arguing about {issue}, and now there is {temper} in the hallway. Both want you on their side.`, `Each is right in some way. Each is also being petty in others.`],
    choices: [
      { id: 'mentor', label: 'Back your mentor in public', risk: 'med', result: `{mentor.first} is moved by the loyalty. {agent.name} stays politely cold for a few weeks.`, effects: [{ rel: { who: 'mentor', trust: 8, respect: 4 } }, { pop: -0.2 }, { conf: 1 }] },
      { id: 'agent', label: 'Back the agent and tell the mentor why', risk: 'med', result: `You explain it carefully. {mentor.first} says nothing, but the wounded look stays with you.`, effects: [{ rel: { who: 'mentor', trust: -5, respect: 2 } }, { pop: 0.3 }, { conf: 1 }] },
      { id: 'mediate', label: 'Broker a deal between them', risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `After an hour in a locked room, they agree to split the difference. You are quietly credited with saving the peace.`, effects: [{ rel: { who: 'mentor', respect: 4, trust: 3 } }, { pop: 0.2 }, { fatigue: 4 }] },
        { weight: 1, text: `They stop speaking to each other, and to you.`, effects: [{ rel: { who: 'mentor', trust: -2 } }, { conf: -2 }, { fatigue: 4 }] } ] },
      { id: 'stay_out', label: 'Stay out of it and do your job', risk: 'low', result: `You say nothing and focus on your work. Both of them note that you did not take a side.`, effects: [{ conf: 1 }, { rel: { who: 'mentor', trust: -2 } }] },
    ],
  },
  {
    id: 'men_gear_gift', category: 'mentor', title: 'A Gift Worth More Than Money', weight: 2, cooldownDays: 150, maxPerCareer: 2,
    trigger: { stat: { popularity: { gte: 25 } } }, cast: { vet: { pick: 'roster', tier: { gte: 3 } } },
    slots: { item: [`a worn leather jacket`, `a pair of boots, famous scuff and all`, `a robe, faded name still stitched inside`, `a championship-style belt from a long-ago tour`], condition: [`"Don't sell it."`, `"Earn it."`, `"It's lucky, but not for the reasons you think."`] },
    body: [`{vet.name} presents you with {item}, handed over in a quiet moment. {condition}`, `A gesture of trust, though in a business where everything is a trade, it is hard to know what is being traded.`],
    choices: [
      { id: 'wear', label: 'Wear it to the ring, with pride', risk: 'low', result: `You wear it out and the veterans see it. For one night, you carry a lineage, and the crowd responds to something it cannot name.`, effects: [{ pop: 0.5 }, { rel: { who: 'vet', respect: 6, affinity: 5 } }, { conf: 3 }] },
      { id: 'keep', label: 'Keep it safe and never wear it', risk: 'low', result: `You put it in a case. {vet.first} sees it there and says nothing, and you understand each other.`, effects: [{ rel: { who: 'vet', trust: 5 } }, { conf: 2 }] },
      { id: 'sell', label: 'Sell it to a collector', risk: 'high', outcomes: [
        { weight: 1, text: `The sale pays well, and nobody finds out. A small part of you wishes you had kept it.`, effects: [{ money: 15000 }, { conf: -2 }] },
        { weight: 1, text: `Word gets back to {vet.first}. {vet.they} says nothing, but the door closes quietly.`, effects: [{ money: 15000 }, { rel: { who: 'vet', respect: -10, trust: -10 } }, { conf: -3 }, { pop: -0.3 }] } ] },
      { id: 'refuse', label: 'Refuse the gift as too much', risk: 'low', result: `You hand it back gently. {vet.first} is baffled, then moved. "That's the right answer," the vet says, and gives it back.`, effects: [{ rel: { who: 'vet', respect: 6, trust: 4 } }, { conf: 1 }] },
    ],
  },
];
