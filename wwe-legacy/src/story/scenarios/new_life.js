// Life-outside-the-ring scenes. They trigger on the personal-life numbers (wellbeing, family, socialLife) and move them back.
export default [
  {
    id: 'nlf_empty_chair', category: 'personal', title: `An Empty Chair at {occasion}`, weight: 3, major: true, cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 6,
    trigger: { stat: { family: { lte: 22 }, careerYears: { gte: 0.3 } } },
    slots: { occasion: [`Sunday dinner`, `a family birthday`, `the recital`], caller: [`Your sister`, `Your mother`, `An old friend of the family`] },
    body: [`{caller} calls while you are lacing your boots, and the line is quiet for a second too long. Nobody says you are missed. "We kept your chair at {occasion}," they say. "Again."`, `The truck leaves for the next town in two hours, and the schedule has no room in it for a long drive in the wrong direction.`],
    choices: [
      { id: 'go_home', label: `Drive home tonight and miss the loading call`, risk: 'med', outcomes: [
        { weight: 3, bonus: { confidence: 0.3 }, text: `You get in late, eat cold food at a warm table, and nobody mentions the empty chair again. The office is not pleased about the missed call, but the ache you have been carrying for weeks loosens.`, effects: [{ family: 26 }, { wellbeing: 10 }, { fatigue: -6 }, { conf: 2 }, { money: -180 }] },
        { weight: 1, text: `You arrive after the plates are cleared. It is better than not arriving, and everyone says so, a little too carefully. You drive back with the radio loud.`, effects: [{ family: 12 }, { wellbeing: 2 }, { fatigue: 6 }, { money: -180 }] } ] },
      { id: 'video', label: `Join by video from the arena hallway`, risk: 'low', result: `You prop the phone against a road case and eat catering rice while a table of faces talks over each other. It is not the same, and everyone is kind about it.`, effects: [{ family: 8 }, { wellbeing: 3 }, { conf: -1 }] },
      { id: 'promise', label: `Promise the next free week and mean it`, risk: 'low', result: `You write the dates on the back of your hand so you cannot pretend later. It buys you some goodwill and a little time.`, effects: [{ family: 5 }, { conf: 1 }] },
      { id: 'work', label: `Say it cannot be done and focus on tonight`, risk: 'med', result: `You are sharp that night, and the match shows it. The phone stays face down in your bag, and it feels heavier than the bag.`, effects: [{ pop: 0.3 }, { conf: 3 }, { family: -6 }, { wellbeing: -4 }] }
    ],
  },
  {
    id: 'nlf_burnout_morning', category: 'personal', title: `The Morning You Could Not Get Up`, weight: 3, major: true, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 6, contexts: ['weekly', 'pre_show'],
    trigger: { stat: { wellbeing: { lte: 30 } } },
    slots: { sign: [`The alarm has been going for ten minutes`, `The coffee has gone cold in your hand`, `The gym bag has not moved from the doorway`], thought: [`everything on the schedule feels like someone else's life`, `the idea of another bus makes your chest tight`, `you cannot remember the last time something was fun`] },
    body: [`{sign}. You are not hurt, exactly, and you are not sick. It is that {thought}, and the thought has been getting louder for a while.`, `A day like this can go three ways. Only one of them is easy.`],
    choices: [
      { id: 'take_day', label: `Take the day: turn the phone off and do nothing`, risk: 'low', result: `You sleep, eat something that is not from a gas station, and stare at a ceiling for an hour without guilt. The world carries on without you for twenty-four hours, which turns out to be survivable.`, effects: [{ wellbeing: 18 }, { fatigue: -20 }, { conf: -1 }] },
      { id: 'push', label: `Push through: drag yourself to the gym`, risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `Ten minutes in the work takes over and the fog thins. You leave tired in the honest way, with something to be proud of.`, effects: [{ wellbeing: 6 }, { conf: 3 }, { fatigue: 8 }] },
        { weight: 2, text: `Your form is wrong from the first rep and you know it. You leave early, more tired than before and cross with yourself.`, effects: [{ wellbeing: -6 }, { conf: -3 }, { fatigue: 14 }] } ] },
      { id: 'call', label: `Call someone and say it out loud`, risk: 'med', result: `"Hey, you alive?" is how it starts, and the call is awkward for ninety seconds and then it is simply a conversation. Nothing is solved, but it is the first time in weeks you have not carried it alone.`, effects: [{ wellbeing: 12 }, { social: 8 }, { family: 4 }] },
      { id: 'pay', label: `Pay for a proper physio and massage day`, risk: 'low', requires: { stat: { money: { gte: 400 } } }, result: `Two hours on a table with someone who knows exactly where you are knotted. You leave loose, lighter, and a little ashamed it took this long.`, effects: [{ wellbeing: 10 }, { fatigue: -16 }, { money: -300 }] }
    ],
  },
  {
    id: 'nlf_good_stretch', category: 'personal', title: `Everything Is Clicking`, weight: 2, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 6,
    trigger: { stat: { wellbeing: { gte: 78 }, family: { gte: 55 }, confidence: { gte: 55 } } },
    slots: { sign: [`You woke up before the alarm`, `You hit every light on the drive`, `Your body feels about twenty-two again`], where: [`on the way to the arena`, `in the middle of warm-ups`, `over breakfast`] },
    body: [`{sign}. Something that took months to build has quietly arrived: sleep that works, people who are glad to see you, a body that does what you ask. You notice it {where}, and you know it will not last forever.`, `The question is what to do with a good stretch while you have one.`],
    choices: [
      { id: 'train_hard', label: `Spend it on a punishing training block`, risk: 'med', result: `You ride the good days as hard as you dare, stacking sessions while the body forgives. The work shows up in your movement within a week.`, effects: [{ attr: { name: 'endurance', delta: 1 } }, { fatigue: 14 }, { conf: 3 }, { wellbeing: -3 }] },
      { id: 'give_back', label: `Spend it on others: a gym day for local kids`, risk: 'low', result: `You spend a morning being loud and useful. A kid tries a headlock on you and wins, to general applause. "Tap out!" the kid shouts. The photos do you no harm.`, effects: [{ pop: 0.5 }, { wellbeing: 6 }, { social: 6 }, { money: -100 }] },
      { id: 'bank_it', label: `Protect it: change nothing and say no to extras`, risk: 'low', result: `You decline the extra signing, the second interview, the favour for a favour. The good stretch lasts a little longer for being left alone.`, effects: [{ wellbeing: 8 }, { family: 6 }, { pop: -0.1 }] },
      { id: 'show_off', label: `Spend it on the spotlight: say yes to every camera`, risk: 'med', result: `You are easy to be around and it comes across in every clip. The appearances are exhausting and worth it.`, effects: [{ pop: 0.7 }, { fatigue: 10 }, { family: -4 }] }
    ],
  },
  {
    id: 'nlf_group_chat_silence', category: 'personal', title: `The Group Chat Has Gone Quiet`, weight: 2.5, cooldownDays: 160, maxPerCareer: 2, categoryCooldown: 6, minYearHint: 2010,
    trigger: { minYear: 2010, stat: { socialLife: { lte: 16 } } },
    slots: { chat: [`the old training-camp group chat`, `the thread with your oldest friends`, `the chat from your first indie roster`], last: [`a photo you were not in`, `a joke you missed by three months`, `a birthday message with no replies`] },
    body: [`You scroll back through {chat} and find {last}. Nobody is angry. People just stopped expecting you to answer, and then stopped asking.`, `You have a free evening, a phone in your hand and about four minutes of nerve.`],
    choices: [
      { id: 'big_message', label: `Write something honest and a bit embarrassing`, risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.3 }, text: `Replies arrive within the hour, mostly insults ("Look who is alive" is the first), which is how you know it worked. Someone proposes a weekend and, for once, you say yes without checking the calendar.`, effects: [{ social: 20 }, { wellbeing: 8 }, { conf: 1 }] },
        { weight: 1, text: `One person answers, kindly. The rest leave you on read. It is still more than you had yesterday.`, effects: [{ social: 6 }, { wellbeing: 1 }] } ] },
      { id: 'tickets', label: `Send tickets to the next show for anyone who wants them`, risk: 'low', requires: { stat: { money: { gte: 200 } } }, result: `Four of them show up, loud and proud in the cheap seats. Seeing them sing along to your music is a feeling you cannot buy at any price.`, effects: [{ social: 16 }, { wellbeing: 6 }, { money: -160 }, { pop: 0.2 }] },
      { id: 'later', label: `Tell yourself you will do it next week`, risk: 'low', result: `You put the phone down. The next week has its own problems.`, effects: [{ social: -2 }, { wellbeing: -2 }] }
    ],
  },
  {
    id: 'nlf_family_at_ringside', category: 'personal', title: `Family at Ringside`, weight: 2.5, cooldownDays: 220, maxPerCareer: 2, categoryCooldown: 6, contexts: ['pre_show', 'show_day'],
    trigger: { stat: { family: { gte: 60 }, popularity: { gte: 25 } }, event: 'weekly' },
    slots: { who: [`Your parents`, `Your brother and his kids`, `Your whole street`], row: [`the second row`, `the barricade seats`, `the very back row`] },
    body: [`{who} are in {row} tonight. You spotted them from the curtain while the arena was filling, and you have not stopped thinking about them since. They are holding a sign that reads "SO PROWD OF YOU".`, `It is lovely, and it is also the one night you cannot afford to be distracted.`],
    choices: [
      { id: 'acknowledge', label: `Point to them and give the sign a nod`, risk: 'low', result: `Three seconds of eye contact, a flash of teeth, and half the building is cheering for people it has never met. You carry the warmth into the first lock-up.`, effects: [{ pop: 0.3 }, { family: 6 }, { wellbeing: 4 }, { conf: 2 }] },
      { id: 'stay_in_zone', label: `Stay in character and look straight through them`, risk: 'med', result: `The performance is tight and the match is the best you have had in a month. Afterwards a single thumbs-up arrives by text and it hurts a little more than a lecture would.`, effects: [{ conf: 3 }, { family: -5 }, { wellbeing: -2 }, { pop: 0.2 }] },
      { id: 'dedicate', label: `Dedicate the finish to them after the bell`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `You step to the barricade, hand over your gloves, and let the arena react. It becomes the clip of the week.`, effects: [{ pop: 0.9 }, { family: 10 }, { wellbeing: 6 }] },
        { weight: 1, text: `The moment lands awkwardly and the crowd has already started leaving. Your family loves it anyway.`, effects: [{ family: 10 }, { wellbeing: 4 }, { pop: 0.0 }] } ] }
    ],
  },
  {
    id: 'nlf_sleep_debt', category: 'personal', title: `Running on Fumes`, weight: 2.5, cooldownDays: 100, maxPerCareer: 3, categoryCooldown: 5,
    trigger: { stat: { fatigue: { gte: 68 }, wellbeing: { lte: 50 } } },
    slots: { sign: [`You drove past your own exit`, `You put the milk in the cupboard`, `You read the same line of the contract four times`], hours: [`three hours`, `four hours`, `an hour and a half`] },
    body: [`{sign}. You have slept {hours} a night for most of a week, and the tiredness has stopped feeling like tiredness and started feeling like weather.`, `The next few days are full, and none of them can be done by someone who is half-asleep.`],
    choices: [
      { id: 'cancel', label: `Cancel what you can and sleep for twelve hours`, risk: 'low', result: `You turn down a signing and a favour, and sleep until the light is wrong. People are mildly annoyed on Tuesday and you are a human again on Wednesday.`, effects: [{ fatigue: -26 }, { wellbeing: 10 }, { pop: -0.1 }] },
      { id: 'caffeine', label: `Keep the schedule and manage it with caffeine`, risk: 'high', outcomes: [
        { weight: 2, text: `You make it through on nerves and energy drinks. Nothing breaks, but the crash arrives all at once on Thursday.`, effects: [{ fatigue: 8 }, { wellbeing: -6 }, { conf: 1 }] },
        { weight: 1, text: `A missed step in training turns into a pulled muscle. You limp the rest of the day and think about how stupid it was.`, effects: [{ fatigue: 12 }, { wellbeing: -8 }, { injury: { part: 'legs', severity: 1, days: 6 } }] } ] },
      { id: 'delegate', label: `Hand part of the load to your agent`, risk: 'low', requires: { stat: { popularity: { gte: 20 } } }, result: `"Go to bed," your agent says. It costs a little leverage and a favour owed, and it buys two honest nights of sleep. You decide the price is fair.`, effects: [{ fatigue: -14 }, { wellbeing: 5 }, { money: -120 }] }
    ],
  },
  {
    id: 'nlf_old_gym_kid', category: 'personal', title: `A Kid From the Old Gym`, weight: 2, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 6,
    trigger: { stat: { popularity: { gte: 30 }, careerYears: { gte: 0.8 } } },
    slots: { kid: [`a lanky teenager with a borrowed jacket`, `a girl who cannot be older than fourteen`, `a young man who has driven three hours to ask`], ask: [`how to take a bump without hurting yourself`, `whether it is too late to start`, `what it is really like on the road`] },
    body: [`The old gym lets you in through the back door the way it always did. {kid} is waiting by the ring, and asks {ask}. They are not asking for an autograph. "Is it worth it?" they finally blurt.`, `You remember being on that side of the ropes, and nobody on this side had much time.`],
    choices: [
      { id: 'honest', label: `Tell the truth, including the unglamorous parts`, risk: 'low', result: `You talk for an hour: the bruises, the miles, the money, the nights when it is worth every second. The kid writes none of it down, which is a good sign.`, effects: [{ wellbeing: 8 }, { conf: 2 }, { pop: 0.1 }] },
      { id: 'train', label: `Put them through a session and show them one real thing`, risk: 'low', result: `You teach one move properly, slowly, over and over. By the end the kid can do it, and so can the three others who wandered over to watch.`, effects: [{ wellbeing: 6 }, { fatigue: 6 }, { social: 6 }, { pop: 0.2 }] },
      { id: 'encourage', label: `Give them a warm line and a pair of tickets`, risk: 'low', requires: { stat: { money: { gte: 120 } } }, result: `A line about hard work, a pair of tickets in an envelope. It is not much, and the kid looks at it like a diploma.`, effects: [{ wellbeing: 4 }, { money: -80 }, { pop: 0.15 }] },
      { id: 'no_time', label: `Sign a photo and say you are late for something`, risk: 'low', result: `They smile and say they understand. The drive away is quieter than the drive there.`, effects: [{ wellbeing: -3 }, { conf: -1 }] }
    ],
  },
  {
    id: 'nlf_birthday_road', category: 'personal', title: `A Birthday on the Road`, weight: 2, cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 6,
    trigger: { stat: { family: { lte: 45 }, careerYears: { gte: 0.5 } } },
    slots: { who: [`Your mother`, `Your best friend`, `Your little brother`], where: [`a motel parking lot`, `a gas station forecourt`, `the loading dock behind the arena`] },
    body: [`{who} has a birthday today and you are standing in {where}, phone in hand, between a long drive and a longer night. You remembered, which is more than some years.`, `A phone call is the least you can do. It may not be the best.`],
    choices: [
      { id: 'call', label: `Call and stay on the line until they run out of stories`, risk: 'low', result: `"You actually called," they say, and then comes twenty minutes of laughing at nothing. You are late to the next stop and do not care.`, effects: [{ family: 10 }, { wellbeing: 5 }, { fatigue: 3 }] },
      { id: 'surprise', label: `Pay for a delivery of something ridiculous`, risk: 'low', requires: { stat: { money: { gte: 150 } } }, result: `A giant cake and a card signed with a rubber stamp of your face. It makes the news at their end of town.`, effects: [{ family: 12 }, { wellbeing: 4 }, { money: -130 }] },
      { id: 'text', label: `Send a text and a heart and get on with the night`, risk: 'low', result: `The reply is a heart too. The silence after it feels bigger than the message.`, effects: [{ family: 2 }, { wellbeing: -1 }] },
      { id: 'video_card', label: `Film a short video from the ring crew's corner`, risk: 'low', result: `The crew make faces behind you and sing off key. It goes round the whole family three times before midnight.`, effects: [{ family: 8 }, { social: 4 }, { wellbeing: 4 }] }
    ],
  },
];
