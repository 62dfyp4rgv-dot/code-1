// Core memory-driven scenarios: these fire from obligations the rules engine creates when the
// player does something (insults, betrayals, challenges, dirty finishes) - the past coming back.
export default [
  {
    id: 'confront_backstage', category: 'rivalry', title: 'A Confrontation in {place}', weight: 3, cooldownDays: 20, maxPerCareer: 30, categoryCooldown: 2, major: true, memory: { role: 'rival', max: 2 },
    cast: { rival: { pick: 'obligation', kind: 'confront_backstage' } }, trigger: {},
    slots: { place: ['catering', 'the gorilla position', 'the parking garage', 'the training room'] },
    body: ['{rival.name} is waiting for you in {place}, arms folded. {rival.they} clearly has not let go of what happened between you two.', '"Got a minute?" {rival.they} says, in the voice of someone who does not care what the answer is. A few locker-room veterans nearby pretend not to watch, and whatever you do next will be talked about by Monday.'],
    choices: [
      { id: 'stand', label: 'Stand your ground', risk: 'med', outcomes: [
        { weight: 3, bonus: { confidence: 0.6 }, text: 'You do not flinch. {rival.first} sizes you up, says "Remember this," and backs off. The room notices.', effects: [{ rel: { who: 'rival', respect: 6, fear: 3 } }, { pop: 0.4 }, { conf: 4 }] },
        { weight: 2, text: 'Words turn to shoving before the agents pull you apart. Neither of you blinks.', effects: [{ rel: { who: 'rival', heat: 10 } }, { rivalry: { who: 'rival', heat: 10 } }, { conf: 2 }, { fatigue: 4 }] } ] },
      { id: 'apologize', label: 'Apologise and clear the air', risk: 'low', result: 'It costs you some pride, but {rival.first} accepts it. The tension drains out of the hallway.', effects: [{ rel: { who: 'rival', heat: -12, respect: 4, trust: 4 } }, { conf: -2 }, { pop: 0.1 }] },
      { id: 'escalate', label: 'Escalate: make it public', risk: 'high', outcomes: [
        { weight: 2, text: 'You turn it into a spectacle, and the stagehands and riggers around you love it. Management will certainly hear about this.', effects: [{ rivalry: { who: 'rival', heat: 18 } }, { rel: { who: 'rival', heat: 14, respect: -4 } }, { pop: 0.8 }] },
        { weight: 1, text: 'It backfires: a producer reads you the riot act, and by morning you have a reputation for being difficult.', effects: [{ rivalry: { who: 'rival', heat: 12 } }, { rel: { who: 'rival', heat: 8 } }, { pop: -0.6 }, { conf: -4 }] } ] },
      { id: 'walk', label: 'Walk away', risk: 'low', result: 'You leave without a word. {rival.first} calls after you, "That is what I thought," and takes it as weakness. The rest of the locker room is not so sure.', effects: [{ rel: { who: 'rival', respect: -3 } }, { conf: -3 }] },
    ],
  },
  {
    id: 'answer_challenge', category: 'rivalry', title: '{rival.name} Answers Your Challenge', weight: 3, cooldownDays: 14, maxPerCareer: 30, categoryCooldown: 2, major: true, memory: { role: 'rival', max: 1 },
    cast: { rival: { pick: 'obligation', kind: 'answer_challenge' } }, trigger: {},
    body: ['You threw down the gauntlet in public. Now {rival.name} has responded through the front office: {rival.they} will meet you at the next show.', 'The note from the office is short and ends with a single question: on what terms?'],
    choices: [
      { id: 'accept', label: 'Accept: a standard singles match', result: 'The match is made. The crowd is already buzzing.', effects: [{ booking: { who: 'rival', type: 'singles' } }, { rel: { who: 'rival', respect: 3 } }, { pop: 0.3 }] },
      { id: 'demand_no_dq', label: 'Demand a No Disqualification match', risk: 'med', result: 'You push for chaos. Management agrees: anything goes.', effects: [{ booking: { who: 'rival', type: 'no_dq' } }, { rivalry: { who: 'rival', heat: 14 } }, { pop: 0.5 }] },
      { id: 'decline', label: 'Say you were just posturing', risk: 'low', result: 'You back down. Word gets around that you cannot back up what you say.', effects: [{ rel: { who: 'rival', respect: -6 } }, { conf: -5 }, { pop: -0.7 }] },
    ],
  },
  {
    id: 'seek_revenge', category: 'betrayal', title: '{rival.name} Wants Payback', weight: 4, cooldownDays: 30, maxPerCareer: 20, categoryCooldown: 3, major: true, memory: { role: 'rival', max: 2 },
    cast: { rival: { pick: 'obligation', kind: 'seek_revenge' } }, trigger: {},
    slots: { where: ['at ringside', 'in the hallway', 'after a show', 'at the hotel'] },
    body: ['{rival.name} finds you {where}. {rival.they} has been stewing over what happened between you ever since, and it shows.', '"You owe me an answer," {rival.they} says. This is not going to end on its own.'],
    choices: [
      { id: 'face_it', label: 'Face it: let {rival.them} say {rival.their} piece', result: 'You listen to every word. It does not fix anything, but {rival.first} respects that you did not hide.', effects: [{ rel: { who: 'rival', respect: 5, heat: -4 } }, { conf: -1 }] },
      { id: 'make_peace', label: 'Offer to make amends', risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: 'It takes time, but something shifts. {rival.first} lets the hostility drop - for now.', effects: [{ event: { type: 'reconciliation', participants: ['rival'], summary: 'Reconciled with {rival.name} after the bad blood.', data: { formerRival: true } } }, { pop: 0.4 }] },
        { weight: 2, text: '{rival.first} laughs in your face. "Some things do not get fixed with a speech," {rival.they} says, and walks off.', effects: [{ rel: { who: 'rival', heat: 6 } }, { conf: -3 }] } ] },
      { id: 'double_down', label: 'Double down: you did what you had to', risk: 'high', result: 'You refuse to apologise. {rival.first} leaves with murder in {rival.their} eyes.', effects: [{ rivalry: { who: 'rival', heat: 20 } }, { rel: { who: 'rival', heat: 12 } }, { pop: 0.3 }] },
    ],
  },
  {
    id: 'grudge_rematch', category: 'rivalry', title: 'A Grudge Demands a Rematch', weight: 3, cooldownDays: 25, maxPerCareer: 20, categoryCooldown: 3, memory: { role: 'rival', max: 2 },
    cast: { rival: { pick: 'obligation', kind: 'grudge_rematch' } }, trigger: {},
    body: ['The way your last match with {rival.name} ended left a sour taste. {rival.they} has been telling anyone who will listen that you got away with something.', '"Run it back," {rival.they} says. Management is open to a rematch if you are.'],
    choices: [
      { id: 'rematch', label: 'Book the rematch', result: 'You shake hands on it. This time there will be no excuses.', effects: [{ booking: { who: 'rival', type: 'singles' } }, { rel: { who: 'rival', respect: 2 } }] },
      { id: 'stip', label: 'Add a stipulation: No DQ', risk: 'med', result: 'You make it personal. Management loves a grudge match.', effects: [{ booking: { who: 'rival', type: 'no_dq' } }, { rivalry: { who: 'rival', heat: 10 } }, { pop: 0.4 }] },
      { id: 'ignore', label: 'Ignore it - move on', result: 'You let it go. {rival.first} keeps talking, though.', effects: [{ rel: { who: 'rival', heat: 4 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'ally_offer', category: 'alliance', title: '{ally.name} Proposes a Partnership', weight: 2, cooldownDays: 60, maxPerCareer: 6,
    cast: { ally: { pick: 'tag', tag: 'alliance_possible' } }, trigger: { noFlag: 'allied_recently' }, memory: { role: 'ally', max: 1 },
    body: ['{ally.name} has not forgotten the respect you showed, and {ally.they} pulls you aside to say so. {ally.they} thinks the two of you would be better as partners than enemies.', '"I am not asking for a handshake," {ally.they} adds. "I am asking for a plan." It could be a real opportunity, or a complication.'],
    choices: [
      { id: 'accept', label: 'Join forces', risk: 'low', result: 'You shake on it. Two heads, one plan.', effects: [{ event: { type: 'alliance_formed', participants: ['ally'], summary: 'Formed an alliance with {ally.name}.', data: {} } }, { flag: 'allied_recently' }, { pop: 0.3 }] },
      { id: 'terms', label: 'Accept - but on your terms', risk: 'med', result: '{ally.first} grudgingly agrees to your conditions. Respect, with an asterisk.', effects: [{ event: { type: 'alliance_formed', participants: ['ally'], summary: 'Formed an alliance with {ally.name} on strict terms.', data: {} } }, { rel: { who: 'ally', trust: -3, respect: 3 } }, { flag: 'allied_recently' }] },
      { id: 'decline', label: 'Politely decline', result: 'You stay independent. {ally.first} nods, a little disappointed.', effects: [{ rel: { who: 'ally', respect: 1, trust: -2 } }] },
    ],
  },
  {
    id: 'media_broken_promise', category: 'media', title: 'The Press Remembers Your Promise', weight: 3, cooldownDays: 45, maxPerCareer: 8, major: true,
    cast: { reporter: { pick: 'media', kind: 'reporter' } }, trigger: { promise: 'broken' },
    body: ['{reporter.name} corners you after the show with a recorder in hand. "You said: {brokenPromise}. We all saw how that went. What happened?"', 'The recorder light is on, and everyone within earshot has gone quiet.'],
    choices: [
      { id: 'own_it', label: 'Own it: no excuses', risk: 'low', result: 'You take full responsibility. It stings, but the story dies quickly.', effects: [{ conf: -1 }, { pop: 0.2 }, { event: { type: 'interview', participants: ['reporter'], summary: 'Owned up to a broken promise.', data: { quality: { base: 62, mic: 0.3, charisma: 0.2 }, viral: { minQuality: 90 } } } }] },
      { id: 'deflect', label: 'Deflect and blame circumstances', risk: 'med', result: 'It sounds like an excuse because it is one. The headline writes itself.', effects: [{ pop: -0.5 }, { conf: -2 }, { event: { type: 'interview', participants: ['reporter'], summary: 'Deflected questions about a broken promise.', data: { quality: { base: 40, mic: 0.3 } } } }] },
      { id: 'double_promise', label: 'Make an even bigger promise', risk: 'high', result: 'You swing for the fences. The crowd will remember this - for better or worse.', effects: [{ promise: { kind: 'win_title', text: 'I will win a championship', deadlineDays: 200 } }, { pop: 0.4 }, { conf: 3 }] },
    ],
  },
  {
    id: 'rival_trash_talk_media', category: 'media', title: '{rival.name} Takes Shots at You', weight: 2, cooldownDays: 40, maxPerCareer: 10,
    cast: { rival: { pick: 'rivalry', minHeat: 25 }, reporter: { pick: 'media', kind: 'interviewer' } }, memory: { role: 'rival', max: 2 }, trigger: {},
    body: ['In a sit-down interview, {rival.name} took another swing at you, and the clip is already circulating. {reporter.name} plays it back for you and asks for a response.', '"Anything to say to {rival.them}?" {reporter.they} asks. You have a few seconds to decide how to answer.'],
    choices: [
      { id: 'counter', label: 'Fire back with a sharp line', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.7 }, text: 'Your reply is quoted in every wrestling column by the next morning.', effects: [{ pop: 0.8 }, { rivalry: { who: 'rival', heat: 8 } }, { event: { type: 'interview', participants: ['rival'], summary: 'Fired back at {rival.name}.', data: { quality: { base: 70, mic: 0.5 }, viral: { minQuality: 85, chance: 0.5 } } } }] },
        { weight: 1, text: 'It lands flat, and the wrestling press has a field day at your expense.', effects: [{ pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'high_road', label: 'Take the high road', risk: 'low', result: 'You refuse to engage. Fans respect the restraint.', effects: [{ pop: 0.3 }, { rel: { who: 'rival', respect: 2 } }] },
      { id: 'silent', label: 'No comment', risk: 'low', result: 'You say nothing. The story fades.', effects: [] },
    ],
  },
];
