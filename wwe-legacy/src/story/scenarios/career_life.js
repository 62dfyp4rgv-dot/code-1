// Career-life scenarios: debut, breakout, contract, injury, recovery, comeback, retirement, legacy, finance, training, travel, personal.
export default [
  // ======================= DEBUT =======================
  {
    id: 'life_deb_first_day', category: 'debut', title: 'Day One at {facility}', weight: 2, cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 10,
    cast: { trainer: { pick: 'staff', role: 'trainer' } },
    trigger: { stat: { matches: { lte: 3 }, careerYears: { lte: 1 } } },
    slots: { facility: ['the training center', 'a converted warehouse gym', 'the old training school', 'a rented ring behind a car dealership'], drill: ['bumping on the plywood-and-foam ring', 'running the ropes until your calves shake', 'a ten-minute plank test', 'headlock-and-hip drills with a stranger'] },
    body: ['You get to {facility} forty minutes early with a duffel bag and no idea where to stand. {trainer.name} looks you over once, points at the ring and says, "First lesson: {drill}. Go."', 'The other trainees stop what they are doing to watch. Everybody in the building remembers how their own first day went, and everybody wants to see how yours does.'],
    choices: [
      { id: 'volunteer', label: 'Volunteer first and give it everything', risk: 'med', outcomes: [
        { weight: 3, bonus: { confidence: 0.6, fatigue: -0.4 }, text: 'You throw yourself at it and hold up. {trainer.name} says nothing, which from {trainer.their} mouth is high praise.', effects: [{ conf: 4 }, { attr: { name: 'toughness', delta: 1 } }, { fatigue: 8 }] },
        { weight: 2, text: 'You go too hard, lose your footing and take a hard fall. You finish the session on pride alone and pay for it for two days.', effects: [{ conf: -2 }, { fatigue: 12 }, { injury: { part: 'torso', severity: 1, days: 6 } }] } ] },
      { id: 'watch', label: 'Hang back and learn from the others first', risk: 'low', result: 'You watch three people take their turns before you step in. Your first attempt is cleaner for it, though {trainer.name} notes that you waited to be told.', effects: [{ attr: { name: 'psychology', delta: 1 } }, { conf: 1 }, { fatigue: 3 }] },
      { id: 'questions', label: 'Ask how the whole program works before starting', risk: 'low', result: '{trainer.name} gives you a long, patient answer and a sheet of rules. It costs you a half hour of ring time, but you walk out knowing exactly where you stand.', effects: [{ conf: 2 }, { fatigue: -2 }, { pop: -0.1 }] },
      { id: 'show_off', label: 'Show off the moves you already know', risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.8 }, text: 'You land a dropkick cleanly enough that two trainees clap. {trainer.name} files your name away.', effects: [{ pop: 0.4 }, { conf: 5 }] },
        { weight: 2, text: '{trainer.name} stops you mid-move and has you redo the basics for an hour, in front of everyone.', effects: [{ conf: -5 }, { fatigue: 6 }] } ] },
    ],
  },
  {
    id: 'life_deb_tryout', category: 'debut', title: 'Tryout at {venue}', weight: 2, cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 10,
    cast: { exec: { pick: 'staff', role: 'executive' } },
    trigger: { background: ['prospect', 'indie'], stat: { matches: { lte: 5 } } },
    slots: { venue: ['a college gymnasium', 'a former bowling alley', 'a convention hall', 'a high-school field house'], watching: ['a single scout with a clipboard', 'a camera crew from head office', 'forty other hopefuls', 'a visiting executive who does not look up'] },
    body: ['The tryout is held in {venue}, and the ring has clearly been assembled that morning. {exec.name} sits at the edge of the apron. Also in the room: {watching}.', 'You get ninety seconds of ring time and a promise that someone will call. Most people in the room will never hear from anyone.'],
    choices: [
      { id: 'safe', label: 'Run the basics with perfect execution', risk: 'low', result: 'Every bump, every lock-up, every roll-through is textbook. Nobody gasps, but nobody frowns either, and your name ends up on the callback list.', effects: [{ conf: 3 }, { attr: { name: 'technical', delta: 1 } }, { pop: 0.1 }] },
      { id: 'flashy', label: 'Go for the highlight move', risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.7, confidence: 0.4 }, text: 'You hit it with room to spare and the room goes quiet in the good way. {exec.name} writes something down.', effects: [{ pop: 0.6 }, { conf: 6 }] },
        { weight: 2, text: 'You come up short on the landing and tweak something on the way down. You finish the set, but everyone saw it.', effects: [{ conf: -4 }, { fatigue: 8 }, { injury: { part: 'legs', severity: 1, days: 7 } }] } ] },
      { id: 'talk', label: 'Ask for a few seconds on the mic as well', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.7, charisma: 0.5 }, text: 'You cut a thirty-second promo that makes the whispering in the room stop. It is the part they remember.', effects: [{ mic: 1 }, { pop: 0.5 }, { conf: 3 }] },
        { weight: 2, text: 'The words come out in the wrong order. You get through it, but the silence afterward is long.', effects: [{ conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'cheap_travel', label: 'Spend your savings on a hotel night afterwards', risk: 'low', requires: { stat: { money: { gte: 1500 } } }, result: 'You skip the long ride home, sleep, eat properly, and wake up loose. It costs money you do not have to spare, but your body feels like yours.', effects: [{ money: -1200 }, { fatigue: -6 }, { conf: 2 }] },
    ],
  },
  {
    id: 'life_deb_first_deal', category: 'debut', title: 'The First Contract Offer', weight: 2, major: true, cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 10,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { background: ['prospect', 'indie'], stat: { matches: { lte: 8 }, careerYears: { lte: 1.5 } } },
    slots: { terms: ['a developmental deal with a short leash', 'a per-appearance deal with no guarantee', 'a one-year developmental deal with team options'], pressure: ['a pen already uncapped', 'a parent reading over your shoulder', 'a rumor that another office is also interested', 'a hard deadline of five o\'clock'] },
    body: ['{agent.name} slides the paperwork across the table: {terms}. The money is modest, and the room feels smaller than it did when you walked in, because there is {pressure}.', '"Sign here, or tell me what you want changed," {agent.name} says. It is your first real offer, and whether you sign, haggle or walk says something about you.'],
    choices: [
      { id: 'sign', label: 'Sign it as written and get to work', risk: 'low', result: 'You sign. The ink is barely dry before you are handed a training schedule. It is not much money, but it is a start.', effects: [{ contract: { years: 1, salary: 45000 } }, { conf: 3 }, { money: 500 }] },
      { id: 'counter', label: 'Counter for a better rate and an extra year', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.4 }, text: '{agent.name} negotiates well on your behalf and the office meets you halfway. You come out with a bit more money and some security.', effects: [{ contract: { years: 2, salary: 60000 } }, { conf: 4 }] },
        { weight: 2, text: 'The office takes your pushing as arrogance and offers the original terms back, a week late and with less goodwill.', effects: [{ contract: { years: 1, salary: 38000 } }, { conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'lawyer', label: 'Pay a lawyer to read every clause first', risk: 'low', requires: { stat: { money: { gte: 800 } } }, result: 'The lawyer finds two clauses worth rewriting and one worth running from. You sign a cleaner deal a few days later, a little poorer and a lot calmer.', effects: [{ money: -700 }, { contract: { years: 1.5, salary: 52000 } }, { fatigue: 2 }] },
      { id: 'walk', label: 'Walk away and keep working the independents', risk: 'high', result: 'You thank everyone and leave the pen on the table. Maybe a better offer comes. Maybe it does not.', effects: [{ conf: 2 }, { pop: 0.2 }, { money: -400 }, { fatigue: 5 }] },
    ],
  },
  {
    id: 'life_deb_taping_nerves', category: 'debut', title: 'Nerves Before the First Taping', weight: 2, contexts: ['pre_show'], cooldownDays: 240, maxPerCareer: 1, categoryCooldown: 10,
    cast: { producer: { pick: 'staff', role: 'producer' } },
    trigger: { stat: { matches: { lte: 6 } }, minYear: 1993 },
    slots: { sign: ['a shaking leg', 'a dry mouth', 'a blank spot where the finish used to be', 'cold hands'], backstage: ['behind the curtain', 'beside the gorilla monitor', 'in the corner of the hallway', 'in a bathroom stall'] },
    body: ['It is your first night on television and your body has decided to protest, starting with {sign}. You are {backstage}, with the arena hum rising on the other side of the wall.', '{producer.name} appears with a headset and a clipboard and reads your face in one second. "Longer out than in," {producer.first} says, tapping your sternum. "Ten minutes to the bell."'],
    choices: [
      { id: 'breathe', label: 'Slow your breathing and run the match in your head', risk: 'low', result: 'You walk the sequence twice in your head, beat for beat. By the time the music hits, the shaking has turned into focus.', effects: [{ conf: 3 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'tell', label: 'Admit it to {producer.name} and ask for guidance', risk: 'med', outcomes: [
        { weight: 3, text: '{producer.name} gives you three simple notes and a thumbs-up. Having someone know made it lighter.', effects: [{ conf: 4 }, { pop: 0.1 }] },
        { weight: 1, text: '{producer.name} nods, then quietly adds you to the list of rookies to watch closely. You wonder if you made a mistake.', effects: [{ conf: -2 }] } ] },
      { id: 'warm', label: 'Burn it off with a hard warm-up in the hallway', risk: 'med', result: 'You run sprints, bounce on your heels and sweat through your gear. You feel sharp, but you will be tired by the third spot.', effects: [{ fatigue: 8 }, { conf: 3 }, { pop: 0.2 }] },
      { id: 'veteran', label: 'Find an old hand and borrow a little calm', risk: 'low', result: 'A veteran with a bag of kneepads tells you two jokes and one true thing: everybody shakes. You still do, but now you know you are in good company.', effects: [{ conf: 2 }, { fatigue: -3 }] },
    ],
  },
  {
    id: 'life_deb_pushed_too_hard', category: 'debut', title: 'The Trainer Who Will Not Stop', weight: 2, cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 8,
    cast: { trainer: { pick: 'staff', role: 'trainer' } },
    trigger: { stat: { careerYears: { lte: 3 }, fatigue: { gte: 40 } } },
    slots: { drill: ['another hundred bumps', 'extra rounds of the conditioning circuit', 'repeating the same sequence until it is perfect', 'a double session on a day off'], reason: ['a gap in the card next week', 'an evaluation from the office', 'a bad day that nobody will explain', 'a bet with another trainer about your ceiling'] },
    body: ['"Again," {trainer.name} says at the end of an already long day, and what is meant is {drill}. The reason, mentioned in passing, is {reason}.', 'Your legs have gone from sore to numb and your breath comes in short bursts. Nobody else in the room has been asked to do the same.'],
    choices: [
      { id: 'comply', label: 'Say yes and push through it', risk: 'med', outcomes: [
        { weight: 2, bonus: { fatigue: -0.6 }, text: 'You do every rep. {trainer.name} lets you sit down at the end without comment, and a week later you are visibly sharper.', effects: [{ attr: { name: 'endurance', delta: 1 } }, { fatigue: 12 }, { conf: 2 }] },
        { weight: 2, text: 'Somewhere in the second hour your form collapses and something pulls in your back. {trainer.name} ends the session, too late.', effects: [{ fatigue: 14 }, { injury: { part: 'torso', severity: 1, days: 9 } }, { conf: -3 }] } ] },
      { id: 'push_back', label: 'Tell {trainer.name} you need to stop', risk: 'med', result: 'You say it calmly. After a long look, {trainer.name} lets you go and says the door is not locked for the ones who tap out. You walk away relieved and a bit ashamed.', effects: [{ fatigue: -4 }, { conf: -2 }, { pop: -0.1 }] },
      { id: 'negotiate', label: 'Offer to finish half now and half tomorrow morning', risk: 'low', result: '{trainer.name} gives a small grunt that you choose to treat as agreement. The deal costs you an early start, but you keep your body together.', effects: [{ fatigue: 5 }, { attr: { name: 'endurance', delta: 1 } }, { money: -100 }] },
      { id: 'report', label: 'Raise it with the front office quietly', risk: 'high', result: 'The office sends someone to check on the schedule. {trainer.name} learns exactly who spoke, and the next month is chilly.', effects: [{ fatigue: -8 }, { conf: 1 }, { pop: -0.3 }] },
    ],
  },
  {
    id: 'life_deb_ring_gear', category: 'debut', title: 'Deciding What You Wear', weight: 1.5, cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 10,
    trigger: { stat: { matches: { lte: 12 }, money: { gte: 500 } } },
    slots: { maker: ['a local seamstress', 'an online catalog', 'a veteran selling a trunk of old gear', 'the costume department'], budget: ['a small budget', 'almost no budget', 'a bonus you just received', 'a loan from family'] },
    body: ['Your first gear has to come from somewhere, and for you that means {maker}. You have {budget} to work with and more ideas than you have money.', 'A wrestler is often judged before the bell, and the choice of color, cut and material will be on every photograph taken of you for the next year.'],
    choices: [
      { id: 'custom', label: 'Pay for custom gear with your own design', risk: 'med', requires: { stat: { money: { gte: 2500 } } }, outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: 'It fits like it was made for you, because it was. Photos of the gear get passed around backstage before you have even debuted it.', effects: [{ money: -2200 }, { pop: 0.6 }, { conf: 4 }] },
        { weight: 1, text: 'The stitching splits on the second night and the color looks different under arena lights. You eat the cost and the embarrassment.', effects: [{ money: -2200 }, { conf: -2 }] } ] },
      { id: 'simple', label: 'Keep it simple: black trunks and a plain jacket', risk: 'low', result: 'It will not turn heads, but it will not fall apart. You save your money and make it up in the ring.', effects: [{ money: -250 }, { attr: { name: 'technical', delta: 1 } }] },
      { id: 'borrow', label: 'Borrow a veteran\'s old gear and tailor it', risk: 'low', result: 'It comes with a story you did not ask for and a faint smell of liniment. It also comes nearly free, and with a favor owed.', effects: [{ money: -100 }, { conf: 1 }, { pop: 0.1 }] },
      { id: 'bold', label: 'Wear something loud that no one else would', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.7, confidence: 0.4 }, text: 'The crowd laughs, then points, then asks about it later. You are the one with the unmistakable look.', effects: [{ pop: 1.0 }, { conf: 3 }, { money: -900 }] },
        { weight: 2, text: 'It looks wrong from the very first photograph. The nickname that sticks is not a kind one.', effects: [{ pop: -0.5 }, { conf: -4 }, { money: -900 }] } ] },
    ],
  },
  {
    id: 'life_deb_locker_room_prank', category: 'debut', title: 'The Prank in {where}', weight: 1.5, cooldownDays: 200, maxPerCareer: 1, categoryCooldown: 8,
    cast: { vet: { pick: 'roster', tier: { gte: 2 } } },
    trigger: { stat: { matches: { lte: 15 }, careerYears: { lte: 2 } } },
    slots: { where: ['the locker room', 'catering', 'the tour van', 'the gym'], prank: ['a lunch order for the whole building in your name', 'a fake call time that has you dressed an hour early', 'every sock in your bag tied together', 'a note on your gear that says "ask me about my finisher"'] },
    body: ['Someone has done it to you in {where}: {prank}. {vet.name} is leaning on the wall with the face of a person who knows nothing and invented all of it.', '"Welcome to the business," {vet.they} says to no one in particular. Half the room is waiting to see what you do, since this old tradition has a way of revealing character.'],
    choices: [
      { id: 'laugh', label: 'Laugh it off and play along', risk: 'low', result: 'You laugh loudly enough to mean it. Someone slaps your shoulder and tells you that you are all right. It costs you a few dollars and a bit of dignity.', effects: [{ rel: { who: 'vet', respect: 4, affinity: 3 } }, { money: -80 }, { conf: 1 }] },
      { id: 'revenge', label: 'Plan a better prank on {vet.name}', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: 'Your retaliation is neat and totally harmless. {vet.name} bows to the crowd and the whole room declares you a keeper.', effects: [{ rel: { who: 'vet', respect: 7, affinity: 5 } }, { pop: 0.2 }, { conf: 3 }] },
        { weight: 2, text: 'Your payback lands on the wrong person, a veteran with no sense of humor. You spend the next month apologizing.', effects: [{ rel: { who: 'vet', respect: -3, heat: 6 } }, { conf: -3 }] } ] },
      { id: 'cold', label: 'Ignore it and keep your eyes on your gear', risk: 'low', result: 'You say nothing and go back to work. The room goes quiet, then moves on. You are marked as serious, for better and for worse.', effects: [{ rel: { who: 'vet', respect: 1, affinity: -3 } }, { conf: 2 }] },
      { id: 'complain', label: 'Complain to a producer about the hazing', risk: 'med', result: 'The producer takes it seriously, but the story spreads in the other direction. You get fewer pranks and fewer friends.', effects: [{ rel: { who: 'vet', respect: -2, trust: -4 } }, { pop: -0.2 }, { fatigue: -2 }] },
    ],
  },
  // ======================= BREAKOUT =======================
  {
    id: 'life_brk_chant', category: 'breakout', title: 'The Crowd Picks a Chant', weight: 2, contexts: ['post_match'], cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 8,
    trigger: { stat: { popularity: { gte: 25, lte: 70 } }, recent: { winsGte: 2 } },
    slots: { source: ['the upper deck', 'the hard camera side', 'the front row', 'the entire arena'], chant: ['your name', 'a nickname nobody gave you', 'a catchphrase you used exactly once', 'the first line of your entrance music'] },
    body: ['Midway through the closing stretch, {source} starts chanting {chant}. It is thin at first, then it spreads, and the ring announcer has to stop for a moment.', 'You have a few seconds to decide what to do with a crowd that has just picked you. Wrestlers spend years trying to make this happen on purpose.'],
    choices: [
      { id: 'embrace', label: 'Cup your ear and conduct them', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.6, confidence: 0.4 }, text: 'The chant doubles in volume. Even the opponent steps back and lets it breathe. You will hear about this one on the road for a month.', effects: [{ pop: 1.2 }, { conf: 5 }, { fatigue: 3 }] },
        { weight: 1, text: 'You time it badly and the chant dies in the middle. The silence lasts three seconds, which is long enough.', effects: [{ pop: -0.2 }, { conf: -3 }, { fatigue: 3 }] } ] },
      { id: 'focus', label: 'Stay in the match and let it feed you', risk: 'low', result: 'You use the noise as fuel and tighten the finish. The match feels sharper for it, though the moment goes by without a pose.', effects: [{ pop: 0.5 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'milk', label: 'Stop the match and milk it for a full minute', risk: 'high', outcomes: [
        { weight: 2, text: 'The building loves it. The producer, standing behind the curtain, loves it a lot less.', effects: [{ pop: 1.4 }, { fatigue: 4 }, { conf: 4 }] },
        { weight: 2, text: 'The match loses its pace and the crowd cools off. Backstage, you are told that nobody asked for an encore.', effects: [{ pop: -0.4 }, { conf: -3 }, { fatigue: 3 }] } ] },
      { id: 'share', label: 'Point to your opponent and share the spotlight', risk: 'low', result: 'The crowd gives your opponent a round of applause too. It buys you respect in the locker room if not quite as much noise in the building.', effects: [{ pop: 0.4 }, { conf: 2 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'life_brk_creative_notice', category: 'breakout', title: 'Creative Has an Idea for You', weight: 2, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 8,
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { popularity: { gte: 25, lte: 60 }, matches: { gte: 15 } } },
    slots: { pitch: ['a recurring vignette', 'a new signature entrance', 'a mic segment alongside a veteran', 'a short feud with a mid-card name'], when: ['next week', 'after the next pay-per-view', 'by the end of the month', 'whenever you say you are ready'] },
    body: ['{creative.name} catches you in the hallway with a legal pad. "We have {pitch}, ready {when}, and you would be at the center of it."', 'The offer is real and so are the risks. Spotlight finds the people it likes, and it does not always put them back safely.'],
    choices: [
      { id: 'take_it', label: 'Take it and commit fully', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.5, confidence: 0.4 }, text: 'You make it work. The segment lands, the office takes notes, and your name now shows up on posters.', effects: [{ pop: 1.2 }, { conf: 4 }, { fatigue: 6 }] },
        { weight: 2, text: 'The idea sounded better on paper. The crowd is polite and the office quietly shelves it.', effects: [{ pop: 0.1 }, { conf: -3 }, { fatigue: 6 }] } ] },
      { id: 'rework', label: 'Ask to rewrite it in your own voice', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.6 }, text: '{creative.name} lets you pitch changes. The final version feels like you, and the crowd sees it.', effects: [{ pop: 0.9 }, { mic: 1 }, { conf: 3 }, { fatigue: 4 }] },
        { weight: 2, text: '{creative.name} bristles at the notes and drops the idea in favor of another wrestler. The offer does not come back.', effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'wait', label: 'Ask to wait until you are better prepared', risk: 'low', result: 'You buy a month to train. It is respectful, if cautious, and the spot goes to someone else in the meantime.', effects: [{ attr: { name: 'technical', delta: 1 } }, { conf: 1 }, { pop: -0.3 }] },
      { id: 'decline', label: 'Decline and stay the course', risk: 'low', result: 'You say you prefer to earn it in the ring. The office respects that, mostly, though a few eyebrows go up.', effects: [{ conf: 2 }, { pop: -0.2 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'life_brk_replacement_spot', category: 'breakout', title: 'Somebody Got Hurt, and You Are In', weight: 2, major: true, cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 10,
    cast: { vet: { pick: 'roster', tier: { gte: 3 } }, producer: { pick: 'staff', role: 'producer' } },
    trigger: { stat: { popularity: { lte: 60 }, matches: { gte: 10 } }, injured: false },
    slots: { spot: ['a televised tag match', 'the semi-main on television', 'the headline slot at a live event', 'a taped interview segment'], notice: ['two hours of notice', 'a single day of notice', 'twenty minutes of notice', 'a week to prepare'] },
    body: ['{vet.name} has been pulled from the card with a strain, and {producer.name} needs somebody to fill {spot}. You are on the list, with {notice}.', '"Can you be in the building by four?" {producer.name} asks, already dialing the next name in case you cannot. It is a gift and a trap in the same envelope: perform well and your name moves up the list, fall flat and it moves just as quickly.'],
    choices: [
      { id: 'say_yes', label: 'Say yes and learn everything on the fly', risk: 'high', outcomes: [
        { weight: 3, bonus: { overall: 0.6, confidence: 0.5 }, text: 'You sell every beat of it and no one in the arena would know you were a late addition. {producer.name} grins on the monitor.', effects: [{ pop: 1.5 }, { conf: 6 }, { fatigue: 8 }, { rel: { who: 'vet', respect: 3 } }] },
        { weight: 2, text: 'You hit the wrong mark twice and the finish loses steam. It was not a disaster, but it was not what you wanted either.', effects: [{ pop: -0.2 }, { conf: -3 }, { fatigue: 8 }] } ] },
      { id: 'ask_prep', label: 'Say yes only if you can have a walkthrough', risk: 'low', result: '{producer.name} grumbles but finds twenty minutes in the empty ring. The match goes cleaner and a little smaller.', effects: [{ pop: 0.6 }, { conf: 3 }, { fatigue: 5 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'suggest', label: 'Suggest a friend for the spot instead', risk: 'low', result: 'Your friend gets the slot and thanks you for it all night. {producer.name} notes that you give credit where it is due, and that you passed.', effects: [{ conf: -1 }, { pop: -0.2 }, { fatigue: -3 }] },
      { id: 'decline', label: 'Turn it down and protect your body', risk: 'low', requires: { stat: { fatigue: { gte: 40 } } }, result: 'You are worn thin and say so. {producer.name} understands in principle, which is not the same as being happy about it.', effects: [{ fatigue: -10 }, { conf: -1 }, { pop: -0.4 }] },
    ],
  },
  {
    id: 'life_brk_merch_surge', category: 'breakout', title: 'Your {item} Sold Out at {venue}', weight: 1.5, cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 8,
    cast: { exec: { pick: 'staff', role: 'executive' } },
    trigger: { stat: { popularity: { gte: 40, lte: 80 } } },
    slots: { item: ['t-shirt', 'poster run', 'hooded sweatshirt', 'collectible figure'], venue: ['the arena merch stand', 'a fan convention', 'the traveling merch truck', 'a hometown signing'] },
    body: ['Your {item} was gone by intermission at {venue}, and the stall had to hang a sign that said "sold out". {exec.name} calls you to a quiet office to talk numbers.', 'Merchandise percentages are small, but they add up. The company would like a bigger run, and it would like you to promote it.'],
    choices: [
      { id: 'big_run', label: 'Agree to a bigger run and a signing tour', risk: 'med', outcomes: [
        { weight: 3, bonus: { popularity: 0.5, charisma: 0.4 }, text: 'The second run sells well and your cut covers more than rent. The signings tire you but the fans leave happy.', effects: [{ money: 6500 }, { pop: 0.8 }, { fatigue: 10 }] },
        { weight: 1, text: 'The second run is overprinted. Boxes sit in the warehouse and the royalties barely cover your travel.', effects: [{ money: -1200 }, { pop: 0.1 }, { fatigue: 10 }] } ] },
      { id: 'keep_rare', label: 'Keep it rare to protect the demand', risk: 'low', result: 'You argue that scarcity is part of the appeal. The office goes along, and the originals become something fans brag about owning.', effects: [{ pop: 0.5 }, { money: 800 }, { conf: 2 }] },
      { id: 'upgrade', label: 'Redesign it with your own artwork first', risk: 'med', requires: { stat: { money: { gte: 1500 } } }, outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: 'The new design is better and the fans can tell. It sells faster than the first.', effects: [{ money: 3200 }, { pop: 0.9 }, { conf: 3 }] },
        { weight: 2, text: 'The redesign loses what people liked in the first place. Sales are fine, not great.', effects: [{ money: -900 }, { conf: -2 }] } ] },
      { id: 'donate', label: 'Give your share of the next run to a local charity', risk: 'low', result: 'The announcement lands well with fans and press. Your accountant has questions, but the story earns goodwill.', effects: [{ pop: 0.7 }, { money: -1500 }, { conf: 2 }] },
    ],
  },
  {
    id: 'life_brk_morning_after', category: 'breakout', title: 'The Morning After a Hot Streak', weight: 1.5, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 8,
    trigger: { recent: { winsGte: 3 }, stat: { popularity: { lte: 65 } } },
    slots: { place: ['the hotel breakfast room', 'an airport gate', 'a diner by the arena', 'a gas-station parking lot'], news: ['a congratulatory message from a veteran', 'three missed calls from your family', 'a headline with your name in it', 'a stare from a stranger who clearly knows you'] },
    body: ['At {place}, the day starts with {news}. The streak has lifted you above the pack, and you are getting attention you did not have a month ago.', 'The question is what to do with it. Streaks end, and what you build while it lasts decides how much of it you keep.'],
    choices: [
      { id: 'grind', label: 'Double down on training while the iron is hot', risk: 'low', result: 'You head straight to the gym. The streak does not need a celebration; it needs fuel. You are sore, but you are better.', effects: [{ attr: { name: 'technical', delta: 1 } }, { fatigue: 8 }, { conf: 2 }] },
      { id: 'celebrate', label: 'Take the crew out and celebrate', risk: 'med', outcomes: [
        { weight: 2, text: 'The night turns into a bonding event with the locker room. You come home with new friends and a lighter wallet.', effects: [{ money: -400 }, { pop: 0.2 }, { conf: 3 }, { fatigue: 4 }] },
        { weight: 1, text: 'The night runs long and you show up foggy to the next show. A producer notices.', effects: [{ money: -400 }, { conf: 1 }, { fatigue: 9 }, { pop: -0.3 }] } ] },
      { id: 'pitch', label: 'Pitch yourself for a bigger spot while it counts', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.6, popularity: 0.4 }, text: 'You make the case in a calm voice and the office listens. A new slot is penciled in.', effects: [{ pop: 0.8 }, { conf: 4 }] },
        { weight: 2, text: 'You come across as pushy. The office says it will think about it, which means no.', effects: [{ conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'quiet', label: 'Keep a low profile and stay humble', risk: 'low', result: 'You say nothing, smile when asked, and go home. People notice that your head did not swell.', effects: [{ conf: 1 }, { pop: 0.3 }, { fatigue: -3 }] },
    ],
  },
  {
    id: 'life_brk_banner_fan', category: 'breakout', title: 'The Fan at the Barricade', weight: 1, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 8,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 25 } } },
    slots: { banner: ['hand-painted bedsheet', 'foam-board portrait', 'sign with a joke only you understand', 'poster with your catchphrase'], section: ['front row', 'hard camera section', 'last aisle', 'family seating'] },
    body: ['A fan named {fan.name} has been in the {section} at the last three shows holding a {banner}. This time the fan is waiting at the barricade, hoping you will stop.', '"Just one second, please?" {fan.first} calls. It is a small thing, but the people who show up every week hold the building in their hands, and you have about a minute.'],
    choices: [
      { id: 'sign', label: 'Stop and sign it, then take a photo', risk: 'low', result: '{fan.first} has the biggest grin of the night. Within a week the photo has been passed around the whole section, and a few more fans come looking for you.', effects: [{ pop: 0.4 }, { fatigue: 2 }] },
      { id: 'give', label: 'Trade a piece of your gear for it', risk: 'low', requires: { stat: { money: { gte: 300 } } }, result: 'You trade a worn wristband for it. The fan nearly cries and half the section applauds. It also leaves you without a spare.', effects: [{ pop: 0.8 }, { money: -300 }, { conf: 2 }] },
      { id: 'invite', label: 'Invite {fan.first} backstage for a few minutes', risk: 'med', outcomes: [
        { weight: 2, text: '{fan.first} gets a tour and a hug from a very surprised producer. It is the best story of the week.', effects: [{ pop: 1.0 }, { conf: 3 }, { fatigue: 3 }] },
        { weight: 1, text: 'Security is unhappy about the improvisation. You are told to stick to the rules next time.', effects: [{ pop: 0.3 }, { conf: -2 }] } ] },
      { id: 'wave', label: 'Wave from a distance and keep moving', risk: 'low', result: 'You raise a hand and keep going; you are late and tired. The fan looks disappointed but waves back.', effects: [{ fatigue: -2 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'life_brk_viral_clip', category: 'breakout', title: 'The Clip Everyone Is Sharing', weight: 1.5, contexts: ['weekly', 'post_show'], cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 8,
    trigger: { minYear: 2012, stat: { popularity: { gte: 25, lte: 75 } } },
    slots: { clip: ['a missed spot you recovered from with a joke', 'an off-the-cuff comment after the bell', 'a heated exchange with a heckler', 'a botched entrance you laughed off'], where: ['on social feeds', 'on a highlight account', 'on a morning show segment', 'on a rival fan forum'] },
    body: ['By morning, {clip} is everywhere: it has passed a million views, and it is being replayed {where}. Everyone from your family to the office has seen it.', 'The clip is already being cut into shorter, sillier versions. You can ride it, steer it, or try to bury it.'],
    choices: [
      { id: 'ride', label: 'Lean into it and make your own joke version', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.6, mic: 0.4 }, text: 'Your take is funnier than the original. The clip stays at the top of the feed for another day and the merch page gets noticed.', effects: [{ pop: 1.4 }, { conf: 4 }, { event: { type: 'social_post', participants: [], summary: 'Turned a viral clip into a running gag.', data: { quality: { base: 70, charisma: 0.4, mic: 0.3 }, viral: { minQuality: 80, chance: 0.4 } } } }] },
        { weight: 2, text: 'The follow-up reads as trying too hard. The first clip stays funnier than anything you add.', effects: [{ pop: 0.2 }, { conf: -3 }] } ] },
      { id: 'ignore', label: 'Let it burn out on its own', risk: 'low', result: 'You say nothing and the clip fades in a week. It was fun while it lasted, and you never had to defend it.', effects: [{ pop: 0.3 }, { conf: 1 }] },
      { id: 'own', label: 'Thank the fans in a sincere, short video', risk: 'low', result: 'The message is warm and plain. The comments are kind, and the clip becomes a pleasant memory instead of a joke on you.', effects: [{ pop: 0.6 }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'clamp', label: 'Ask the office to take the clip down', risk: 'high', result: 'The office files the request, and the internet reads it as embarrassment. The clip is only bigger on the second day.', effects: [{ pop: -0.5 }, { conf: -3 }] },
    ],
  },
  // ======================= CONTRACT =======================
  {
    id: 'life_con_renew_rookie', category: 'contract', title: 'Renewal Talks in {setting}', weight: 3, major: true, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 10,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { contract: { lte: 90 }, stat: { popularity: { lte: 35 } } },
    slots: { setting: ['a hotel conference room', 'the agent\'s cramped office', 'an airport lounge', 'a corner booth at a diner'], leverage: ['a thin win column', 'a clean injury record', 'a rival offer you have not mentioned', 'steady crowd reactions in small towns'] },
    body: ['Your deal is almost up, and {agent.name} has called a meeting in {setting}. The honest assessment is that your main card is {leverage}, which is not a strong hand and not a weak one.', '"They put a number on the table," {agent.name} says, "and whether it is generous depends on what you plan to do with the next two years."'],
    choices: [
      { id: 'accept', label: 'Accept the standard renewal', risk: 'low', result: 'You sign for the offered figure. It is not much, but it is steady, and you keep working.', effects: [{ contract: { years: 1.5, salary: 42000 } }, { conf: 2 }, { money: 400 }] },
      { id: 'push', label: 'Push for a raise and two years', risk: 'med', outcomes: [
        { weight: 2, bonus: { popularity: 0.5, confidence: 0.4 }, text: 'The office meets you most of the way. The deal is better than the first draft and the handshake is firm.', effects: [{ contract: { years: 2, salary: 62000 } }, { conf: 4 }] },
        { weight: 2, text: 'The office reads it as a bluff and cuts the offer to a shorter, cheaper term. You sign anyway.', effects: [{ contract: { years: 1, salary: 36000 } }, { conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'short', label: 'Sign short and bet on yourself', risk: 'med', result: 'You take six months at a reasonable rate. If the next stretch goes well, you will have more leverage; if it does not, the door is near.', effects: [{ contract: { years: 0.5, salary: 40000 } }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'shop', label: 'Let it lapse and test other offers', risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.7, popularity: 0.4 }, text: 'Another office bites. You end up with better terms, and a quiet nod of respect from the first one.', effects: [{ contract: { years: 2, salary: 70000 } }, { conf: 5 }, { pop: 0.3 }] },
        { weight: 2, text: 'Nobody calls back. Eventually the first office offers a worse deal, with an air of doing you a favor.', effects: [{ contract: { years: 1, salary: 30000 } }, { conf: -5 }, { money: -800 }] } ] },
    ],
  },
  {
    id: 'life_con_renew_midcard', category: 'contract', title: 'The Sticking Point in Your Renewal', weight: 3, major: true, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 10,
    cast: { agent: { pick: 'staff', role: 'agent' }, exec: { pick: 'staff', role: 'executive' } },
    trigger: { contract: { lte: 90 }, stat: { popularity: { gte: 35, lte: 70 } } },
    slots: { point: ['creative control', 'travel days per year', 'a bigger merchandise share', 'a guaranteed number of television appearances'], mood: ['a friendly dinner', 'a stiff boardroom meeting', 'a string of hallway conversations', 'a phone call that keeps getting longer'] },
    body: ['The renewal is being hammered out over {mood}. {exec.name} offers a fair base number but will not budge on one thing: {point}, which {agent.name} says you should care about.', '"Pick one thing and mean it," {agent.name} tells you. You are respected enough to have a say and not yet big enough to dictate.'],
    choices: [
      { id: 'security', label: 'Take four years of security and drop the extras', risk: 'low', result: 'You trade leverage for stability. Four guaranteed years let you plan a life, but you will watch the market rise from the sidelines.', effects: [{ contract: { years: 4, salary: 280000 } }, { conf: 3 }, { money: 3000 }] },
      { id: 'hold_out', label: 'Hold out for the clause you want', risk: 'high', outcomes: [
        { weight: 2, bonus: { popularity: 0.6, charisma: 0.4 }, text: 'You stay at the table and the office blinks. The final deal includes your clause and a little money to sweeten it.', effects: [{ contract: { years: 3, salary: 340000 } }, { conf: 5 }, { pop: 0.4 }] },
        { weight: 2, text: 'The talks stall into the following week. You eventually sign without the clause, a bit bruised and a bit poorer.', effects: [{ contract: { years: 2, salary: 230000 } }, { conf: -3 }, { fatigue: 4 }] } ] },
      { id: 'cash', label: 'Take the cash and a one-year deal', risk: 'med', result: 'A larger paycheck, a shorter horizon. You can renegotiate in a year when your numbers have improved, or hope they have.', effects: [{ contract: { years: 1, salary: 360000 } }, { money: 8000 }, { conf: 1 }] },
      { id: 'lawyer', label: 'Bring a sports lawyer to review the paper', risk: 'low', requires: { stat: { money: { gte: 2500 } } }, result: 'The lawyer finds loopholes you would have missed. The final deal is cleaner, and the office takes you more seriously. It cost real money.', effects: [{ money: -2500 }, { contract: { years: 3, salary: 310000 } }, { conf: 3 }] },
    ],
  },
  {
    id: 'life_con_renew_star', category: 'contract', title: 'An Outside Offer Arrives', weight: 3, major: true, cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 10,
    cast: { agent: { pick: 'staff', role: 'agent' }, exec: { pick: 'staff', role: 'executive' } },
    trigger: { contract: { lte: 120 }, stat: { popularity: { gte: 65 } } },
    slots: { rival: ['A competing promotion', 'A film studio', 'An overseas league', 'A television network'], leverage: ['a championship reign', 'a sold-out run of arena dates', 'record merchandise numbers', 'a rating bump during your segments'] },
    body: ['{rival} has made an offer through {agent.name}, citing {leverage}. {exec.name} has heard about it, and the room has changed: the polite offer from the company is now a negotiation.', 'You are at the point where a signature can shift your whole career. The right decision depends on whether you want money, security, or freedom.'],
    choices: [
      { id: 'stay_big', label: 'Stay and take the largest offer the company will make', risk: 'low', result: 'The office pays the premium and publicly welcomes you back. The deal is excellent and the leverage is spent.', effects: [{ contract: { years: 3, salary: 1800000 } }, { conf: 4 }, { money: 20000 }] },
      { id: 'creative_say', label: 'Stay, but only with creative input written in', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.5 }, text: 'You get the clause. The creative team now has to run ideas past you, which both of you find irritating.', effects: [{ contract: { years: 3, salary: 1500000 } }, { conf: 5 }, { pop: 0.4 }] },
        { weight: 1, text: 'The office refuses, then compromises with a vague promise. The paper is less than you hoped.', effects: [{ contract: { years: 3, salary: 1350000 } }, { conf: -2 }] } ] },
      { id: 'short_lucrative', label: 'Sign a short, rich deal and stay flexible', risk: 'med', result: 'A year of hefty pay, then free again. You keep your options open and the office remembers that.', effects: [{ contract: { years: 1, salary: 2100000 } }, { money: 30000 }, { fatigue: 5 }] },
      { id: 'leave', label: 'Take the outside deal and leave', risk: 'high', outcomes: [
        { weight: 1, bonus: { popularity: 0.6 }, text: 'The new home is warm and the money is better, though your fans have to hunt for the show.', effects: [{ contract: { years: 2, salary: 2400000 } }, { pop: -0.8 }, { money: 50000 }] },
        { weight: 2, text: 'The deal collapses under the weight of a legal dispute. You return to the company chastened and with a worse contract.', effects: [{ contract: { years: 1, salary: 900000 } }, { pop: -1.5 }, { conf: -6 }, { money: -10000 }] } ] },
    ],
  },
  {
    id: 'life_con_brand_move', category: 'contract', title: 'An Offer to Switch Brands', weight: 2, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 12,
    cast: { gm: { pick: 'staff', role: 'gm' } },
    trigger: { minYear: 2002, brand: ['Raw'], contract: { lte: 120 }, stat: { popularity: { gte: 25 } } },
    slots: { reason: ['a thin SmackDown roster', 'a new creative team over there', 'a rating war between the two shows', 'a rival on your own brand you would be glad to avoid'], sweetener: ['a signing bonus', 'a promise of title matches', 'extra days off', 'a bigger travel allowance'] },
    body: ['{gm.name} offers a transfer to SmackDown because of {reason}. As a sweetener, the company is throwing in {sweetener}.', '"You would be the big fish over there," {gm.name} says, and that is true. A move means new faces, a new schedule and a smaller pond, and it also means leaving the people who know your work best.'],
    choices: [
      { id: 'move', label: 'Accept the move and the sweetener', risk: 'med', result: 'You pack up and start fresh. The first few weeks are awkward, but the change of scenery is good for your head.', effects: [{ brand: 'SmackDown' }, { money: 4000 }, { conf: 2 }, { pop: -0.3 }, { fatigue: 5 }] },
      { id: 'stay', label: 'Stay where you have built your name', risk: 'low', result: 'You turn it down politely. The company shrugs, and your standing on your home brand grows a little.', effects: [{ pop: 0.3 }, { conf: 2 }] },
      { id: 'bargain', label: 'Counter: move only with a better contract', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, popularity: 0.4 }, text: 'The company agrees, with some grumbling. You move on better terms.', effects: [{ brand: 'SmackDown' }, { contract: { years: 2, salary: 380000, brand: 'SmackDown' } }, { conf: 4 }, { money: 6000 }] },
        { weight: 2, text: '{gm.name} withdraws the offer and takes it personally. The next few weeks are frosty.', effects: [{ conf: -2 }, { pop: -0.3 }] } ] },
      { id: 'delay', label: 'Ask for time to think it over', risk: 'low', result: 'You buy a few weeks. The sweetener shrinks while you wait, but you have time to talk with people on both brands.', effects: [{ money: -1500 }, { conf: 1 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'life_con_pay_dispute', category: 'contract', title: 'A Hole in Your Pay Statement', weight: 2, cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 10,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { stat: { popularity: { gte: 40 }, careerYears: { gte: 1 } } },
    slots: { issue: ['bonus', 'percentage payment', 'travel reimbursement', 'appearance fee'], way: ['before the next payday', 'before the next tour leg', 'before your contract talks start', 'before the year-end paperwork closes'] },
    body: ['Your latest statement is missing your {issue}. After checking twice with {agent.name}, you confirm the office owes you real money.', '"You can chase it or you can let it go," {agent.name} says, "but if you are going to chase it, do it {way}." Money fights have a way of being remembered longer than they take.'],
    choices: [
      { id: 'raise_quietly', label: 'Raise it quietly with the accounts desk', risk: 'low', outcomes: [
        { weight: 3, text: 'The accounts desk apologizes and sends a corrected payment within the week. You never hear of it again.', effects: [{ money: 4500 }] },
        { weight: 1, text: 'You get a polite promise and a vague date. The money turns up half a month late and a bit short.', effects: [{ money: 2000 }, { conf: -1 }] } ] },
      { id: 'lawyer_up', label: 'Hire a lawyer and demand all of it', risk: 'high', requires: { stat: { money: { gte: 2000 } } }, outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: 'The lawyer\'s letter does the job. You get everything owed and a quiet apology, but the office takes note of who you are.', effects: [{ money: 6000 }, { conf: 3 }, { pop: -0.2 }] },
        { weight: 2, text: 'The fee eats most of what you recover and the office files you under "difficult".', effects: [{ money: -1500 }, { pop: -0.4 }, { conf: -2 }] } ] },
      { id: 'write_off', label: 'Write it off and focus on the work', risk: 'low', result: 'You let it go. It stings for a week, then it is just a lesson about reading statements.', effects: [{ conf: -1 }, { fatigue: -2 }, { money: -500 }] },
      { id: 'public', label: 'Bring it up where others will hear', risk: 'high', outcomes: [
        { weight: 1, text: 'Other talent back you. The office pays up and fixes the process for everyone.', effects: [{ money: 4500 }, { pop: 0.5 }, { conf: 4 }] },
        { weight: 3, text: 'It becomes a scene, and management reads it as grandstanding. You are paid, and watched.', effects: [{ money: 3000 }, { pop: -0.5 }, { conf: -2 }] } ] },
    ],
  },
  {
    id: 'life_con_release_rumors', category: 'contract', title: 'Rumors of Your Release', weight: 2, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 10, major: true,
    cast: { gm: { pick: 'staff', role: 'gm' } },
    trigger: { contract: { lte: 150 }, stat: { loseStreak: { gte: 3 } } },
    slots: { source: ['a producer who talks too much', 'a locker-room whisper', 'a leaked budget sheet', 'an agent who owes you a favor'], sign: ['your name missing from an upcoming poster', 'your travel being booked one-way', 'a nameplate that disappeared from a locker', 'a gear order that was quietly cancelled'] },
    body: ['It starts with {source}, then you notice {sign}. The word is that the budget is being trimmed, and a few names on the list look like yours.', '{gm.name} has not told you anything directly. That is usually how it goes, one way or the other.'],
    choices: [
      { id: 'ask', label: 'Ask {gm.name} straight out', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: '{gm.name} appreciates the honesty and gives you a clear answer: "You are safe for now, but the next few weeks matter."', effects: [{ conf: 3 }, { fatigue: 2 }] },
        { weight: 1, text: '{gm.name} stiffens and says nothing is decided, which tells you it is.', effects: [{ conf: -4 }, { fatigue: 4 }] } ] },
      { id: 'prove', label: 'Train harder and make your matches count', risk: 'low', result: 'You live in the ring for two weeks. Your work improves and so does the mood on the producers\' faces.', effects: [{ attr: { name: 'technical', delta: 1 } }, { fatigue: 12 }, { conf: 2 }] },
      { id: 'pay_cut', label: 'Offer to take a pay cut for security', risk: 'med', result: 'You propose a lower salary in exchange for another year. It is accepted with unnerving speed.', effects: [{ contract: { years: 1, salary: 55000 } }, { conf: -2 }, { money: -1000 }] },
      { id: 'look', label: 'Quietly start talking to other offices', risk: 'high', outcomes: [
        { weight: 1, bonus: { popularity: 0.5, overall: 0.5 }, text: 'Someone is interested, and having a plan B lets you walk more confidently into the next meeting.', effects: [{ conf: 4 }, { pop: 0.2 }] },
        { weight: 2, text: 'Word gets back to {gm.name}. Rumor becomes policy.', effects: [{ conf: -4 }, { pop: -0.5 }] } ] },
    ],
  },
  {
    id: 'life_con_early_extension', category: 'contract', title: 'An Extension Nobody Asked For', weight: 2, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 10,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { contract: { gte: 250 }, stat: { popularity: { gte: 45, lte: 70 } } },
    slots: { why: ['a new creative head with plans', 'a rival bid for your services', 'a record year for the company', 'a fresh budget cycle'], pitch: ['more guaranteed dates', 'a title-shot clause', 'a signing bonus', 'a lighter schedule'] },
    body: ['{agent.name} brings an early extension offer to you, with the company explaining it as a reaction to {why}. The headline feature is {pitch}.', '"Take your time," {agent.name} says, which both of you know is not quite true. You are not obliged to sign, but the company would love to lock you in before you get more expensive.'],
    choices: [
      { id: 'sign_long', label: 'Sign the long extension now', risk: 'low', result: 'You lock in four more years and a nice number. The company gets cheaper talent and you get certainty.', effects: [{ contract: { years: 4, salary: 330000 } }, { money: 7000 }, { conf: 3 }] },
      { id: 'wait', label: 'Say you will wait until your deal runs down', risk: 'med', outcomes: [
        { weight: 2, bonus: { popularity: 0.4 }, text: 'Your stock keeps rising, and when you finally talk the number is bigger. The office remembers that you turned it down.', effects: [{ pop: 0.3 }, { conf: 3 }] },
        { weight: 1, text: 'A bad few weeks make the old offer look generous in hindsight. It is no longer on the table.', effects: [{ conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'counter', label: 'Counter with a shorter term and more money', risk: 'med', result: 'You ask for two years and a bigger figure. The company grumbles, then accepts a version of it.', effects: [{ contract: { years: 2, salary: 400000 } }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'sign_bonus', label: 'Take only the signing bonus and keep your terms', risk: 'low', result: 'You accept the bonus and decline the extra years. It is a neat negotiation and a clear way to say no.', effects: [{ money: 12000 }, { pop: -0.1 }] },
    ],
  },
  // ======================= INJURY =======================
  {
    id: 'life_inj_diagnosis', category: 'injury', title: 'The Diagnosis on Your {part}', weight: 3, major: true, cooldownDays: 60, maxPerCareer: 4, categoryCooldown: 8,
    cast: { doc: { pick: 'staff', role: 'doctor' } },
    trigger: { injured: true, serious: false },
    slots: { part: ['knee', 'shoulder', 'ribs', 'neck'], timing: ['right before a pay-per-view', 'the week before a possible title opportunity', 'in the middle of a heavy touring run'] },
    body: ['{doc.name} puts the scan on the lightbox and traces the damage to your {part} with a pen. The timing is bad: it comes {timing}, and the schedule does not care.', 'The report says rest, but you know how much work you are missing. There are ways to speed it up, and ways to make it worse.'],
    choices: [
      { id: 'rest', label: 'Follow the rest plan to the letter', risk: 'low', result: 'You sit out, eat, sleep and watch the shows from home. It is boring and frustrating, and your body thanks you for it.', effects: [{ fatigue: -12 }, { pop: -0.4 }, { conf: -1 }] },
      { id: 'rush', label: 'Rush back as soon as the pain fades', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.4, fatigue: -0.5 }, text: 'You come back a week early and nothing gives. The crowd is thrilled and {doc.name} says you got away with one.', effects: [{ pop: 0.6 }, { conf: 3 }, { fatigue: 6 }] },
        { weight: 2, text: 'On the first bump, the injury flares and you are back on the table. {doc.name} does not say "I told you so", but the look says it.', effects: [{ injury: { part: 'torso', severity: 2, days: 21 } }, { conf: -5 }, { fatigue: 10 }, { pop: -0.4 }] } ] },
      { id: 'second_opinion', label: 'Pay for a second opinion from a specialist', risk: 'med', requires: { stat: { money: { gte: 1500 } } }, outcomes: [
        { weight: 2, text: 'The specialist finds a more precise treatment, and the recovery plan shrinks by a few days.', effects: [{ money: -1500 }, { fatigue: -8 }, { conf: 2 }] },
        { weight: 2, text: 'The specialist agrees with {doc.name} on everything. You pay for confirmation, which is something.', effects: [{ money: -1500 }, { conf: 1 }] } ] },
      { id: 'brace', label: 'Work a lighter schedule with a brace', risk: 'med', result: 'You keep a few short appearances and skip the hard-hitting spots. The crowd sees you, and your body complains in small voices.', effects: [{ fatigue: 4 }, { pop: 0.1 }, { conf: 1 }, { money: -200 }] },
    ],
  },
  {
    id: 'life_inj_surgery', category: 'injury', title: 'The Surgery Decision', weight: 3, major: true, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 12,
    cast: { doc: { pick: 'staff', role: 'doctor' } },
    trigger: { injured: true, serious: true },
    slots: { procedure: ['a ligament reconstruction', 'a repair that needs a handful of screws', 'a minimally invasive scope', 'a fusion that would keep you off the road for months'], clinic: ['the company clinic', 'a private specialist\'s office', 'a hospital near your family', 'a clinic a veteran swears by'] },
    body: ['The recommendation is {procedure}, and {doc.name} would like it done at {clinic}. It is not the kind of news you hear without sitting down first.', 'There is a conservative option, a risky shortcut and a clean surgical one. Each one has a different price in time, money and nerves.'],
    choices: [
      { id: 'surgery_now', label: 'Book the surgery right away', risk: 'med', requires: { stat: { money: { gte: 3000 } } }, result: 'You go under the knife this month. The operation is smooth and the recovery is long, but you will come back with a body you can trust.', effects: [{ money: -6000 }, { injury: { part: 'legs', severity: 2, days: 60 } }, { fatigue: -10 }, { conf: 3 }] },
      { id: 'rehab_only', label: 'Try a long rehab program without surgery', risk: 'med', outcomes: [
        { weight: 2, bonus: { fatigue: -0.4, confidence: 0.4 }, text: 'Rehab works better than anyone expected. You get stronger around the damage and skip the operating room.', effects: [{ money: -1500 }, { attr: { name: 'toughness', delta: 1 } }, { conf: 3 }, { fatigue: 5 }] },
        { weight: 2, text: 'After weeks of work, the joint still gives out. You are back to the surgical option, with weeks lost.', effects: [{ money: -1500 }, { conf: -5 }, { fatigue: 8 }, { pop: -0.4 }] } ] },
      { id: 'wait_break', label: 'Wait for the offseason and keep working until then', risk: 'high', outcomes: [
        { weight: 1, text: 'You power through with a brace and a lot of ice. It works, barely, and the offseason surgery is scheduled with the show intact.', effects: [{ pop: 0.5 }, { conf: 2 }, { fatigue: 12 }] },
        { weight: 3, text: 'The joint gives out on live television and the decision is made for you. The recovery is worse for the delay.', effects: [{ injury: { part: 'legs', severity: 2, days: 75 } }, { pop: -0.6 }, { conf: -5 }, { fatigue: 14 }] } ] },
      { id: 'get_help', label: 'Ask the company to cover the surgery and promote the comeback', risk: 'low', result: 'The company agrees to pay in exchange for the right to run a "return of" angle. You lose the freedom to schedule it your way.', effects: [{ injury: { part: 'legs', severity: 2, days: 55 } }, { fatigue: -8 }, { pop: 0.3 }, { conf: 1 }] },
    ],
  },
  {
    id: 'life_inj_hide_it', category: 'injury', title: 'Hiding the Ache in Your {body}', weight: 2, cooldownDays: 90, maxPerCareer: 3, categoryCooldown: 8,
    cast: { doc: { pick: 'staff', role: 'doctor' } },
    trigger: { injured: false, stat: { fatigue: { gte: 55 } } },
    slots: { body: ['lower back', 'knee', 'shoulder', 'neck'], date: ['a sold-out house show', 'a big television taping', 'a tour weekend', 'a possible title match'] },
    body: ['The ache in your {body} has been there for three weeks and it is getting louder. {doc.name} would almost certainly pull you if you mentioned it, and you have {date} coming.', 'Wrestlers learn early that being the person who got hurt is not good for business. They also learn that the body keeps its own accounts.'],
    choices: [
      { id: 'hide', label: 'Say nothing and work through it', risk: 'high', outcomes: [
        { weight: 2, bonus: { fatigue: -0.5 }, text: 'You tape it up and nobody notices. The match goes well and your body only whispers about the cost.', effects: [{ pop: 0.5 }, { fatigue: 8 }, { conf: 2 }] },
        { weight: 2, text: 'Halfway through the night, the ache turns into a sharp, hot pain. You finish the match on instinct and wake up unable to move.', effects: [{ injury: { part: 'torso', severity: 2, days: 28 } }, { pop: -0.3 }, { conf: -4 }, { fatigue: 10 }] } ] },
      { id: 'tell', label: 'Tell {doc.name} and accept the verdict', risk: 'low', result: 'You get an honest assessment: not serious yet, and no heavy bumps for a fortnight. You miss some spots, and the problem stays small.', effects: [{ fatigue: -8 }, { pop: -0.3 }, { conf: 1 }] },
      { id: 'taper', label: 'Tell {doc.name} but ask to keep working lightly', risk: 'med', result: '{doc.name} signs off on a lighter workload. You trade impact moves for storytelling, and fans still show up.', effects: [{ fatigue: -2 }, { pop: 0.1 }, { attr: { name: 'psychology', delta: 1 } }, { money: -300 }] },
      { id: 'treatment', label: 'Quietly book private physio sessions', risk: 'med', requires: { stat: { money: { gte: 600 } } }, result: 'You pay for treatment out of pocket and keep the schedule. It helps, and it costs.', effects: [{ money: -600 }, { fatigue: -4 }, { conf: 1 }] },
    ],
  },
  {
    id: 'life_inj_bad_landing', category: 'injury', title: 'A Wrong Move in {location}', weight: 2, contexts: ['post_match'], cooldownDays: 80, maxPerCareer: 4, categoryCooldown: 8,
    cast: { doc: { pick: 'staff', role: 'doctor' } },
    trigger: { stat: { fatigue: { gte: 35 } }, injured: false },
    slots: { location: ['front of a silent arena', 'the middle of a roaring crowd', 'front of the family section', 'a half-empty building'], landing: ['a bad bump on the apron', 'a missed catch', 'a slip off the top rope', 'a flip that came up short'] },
    body: ['During the final minutes, you were caught up in {landing} in {location}. You finished the match, but now your hand shakes as you unwrap your tape.', '"Let me see that," {doc.name} says, walking your way. You can feel something that is not right, though how wrong is not clear.'],
    choices: [
      { id: 'honest', label: 'Show {doc.name} exactly where it hurts', risk: 'low', result: '{doc.name} presses, tests and frowns. It is a sprain and not a break; you will be off for a bit but fine for the long run.', effects: [{ injury: { part: 'legs', severity: 1, days: 10 } }, { fatigue: -6 }, { conf: 1 }] },
      { id: 'tough', label: 'Wave it off and walk out under your own power', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: 'A night of ice and the pain fades. You skip the doctor, and your reputation as tough grows a notch.', effects: [{ pop: 0.3 }, { conf: 3 }, { fatigue: 6 }] },
        { weight: 2, text: 'By morning you cannot put weight on it. The doctor sees you at dawn and is not amused.', effects: [{ injury: { part: 'legs', severity: 2, days: 28 } }, { conf: -4 }, { fatigue: 8 }] } ] },
      { id: 'stretch', label: 'Get taped and iced, then stay for the rest of the show', risk: 'med', result: 'You get taped and iced, then sit at ringside for the closing segments, grinning for the cameras. It helps your night and costs a little of tomorrow.', effects: [{ fatigue: 5 }, { pop: 0.2 }, { money: -150 }] },
      { id: 'blame', label: 'Blame the ring conditions and demand an inspection', risk: 'med', outcomes: [
        { weight: 1, text: 'The crew finds a loose board. You are thanked, and your credibility with the staff rises.', effects: [{ pop: 0.2 }, { conf: 2 }, { fatigue: 2 }] },
        { weight: 2, text: 'The ring is fine. The crew is irritated and your name is on the board for the wrong reason.', effects: [{ conf: -3 }, { pop: -0.2 }] } ] },
    ],
  },
  {
    id: 'life_inj_overuse_warning', category: 'injury', title: 'A Warning About Your {joint}', weight: 2, cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 10,
    cast: { doc: { pick: 'staff', role: 'doctor' } },
    trigger: { injured: false, stat: { injuries: { gte: 3 } } },
    slots: { joint: ['knees', 'shoulders', 'lower back', 'neck'], format: ['a printed chart', 'a blunt one-liner', 'a quiet talk in the training room', 'a scan on the screen'] },
    body: ['{doc.name} delivers the warning about your {joint} in the form of {format}. The pattern of injuries is not random, and your body is handing you the bill early.', 'A few changes now might buy extra years later, but they will cost something this month.'],
    choices: [
      { id: 'cut_back', label: 'Cut your schedule back and rotate days off', risk: 'low', result: 'You say no to a few appearances. The money is lighter and the body is happier, and the fans do not notice.', effects: [{ fatigue: -10 }, { money: -1500 }, { pop: -0.3 }] },
      { id: 'prehab', label: 'Start a daily prehab program', risk: 'low', result: 'Thirty minutes every morning, with bands and mobility drills. It is tedious and it works.', effects: [{ attr: { name: 'toughness', delta: 1 } }, { fatigue: 4 }, { money: -400 }] },
      { id: 'adjust', label: 'Change your style to protect the joint', risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: 'You swap a few flashy spots for cleaner, smarter work. The matches feel different, in a good way.', effects: [{ attr: { name: 'psychology', delta: 1 } }, { conf: 2 }, { pop: -0.1 }] },
        { weight: 1, text: 'Your new style is a half-step off the old one. The crowd feels the gap, and you feel it more.', effects: [{ conf: -3 }, { pop: -0.4 }] } ] },
      { id: 'ignore', label: 'Ignore the warning and keep the pace', risk: 'high', outcomes: [
        { weight: 2, text: 'Nothing happens, this time. You feel invincible.', effects: [{ pop: 0.3 }, { conf: 2 }, { fatigue: 6 }] },
        { weight: 1, text: 'Three weeks later something goes in your {joint}, and the warning stops being a warning.', effects: [{ injury: { part: 'legs', severity: 2, days: 32 } }, { conf: -4 }, { fatigue: 8 }, { pop: -0.4 }] } ] },
    ],
  },
  {
    id: 'life_inj_clearance_pressure', category: 'injury', title: 'Pressure to Return for {reason}', weight: 2, cooldownDays: 90, maxPerCareer: 3, categoryCooldown: 8,
    cast: { gm: { pick: 'staff', role: 'gm' }, doc: { pick: 'staff', role: 'doctor' } },
    trigger: { injured: true, serious: false },
    slots: { reason: ['a sold-out show', 'a short roster', 'a rival gaining ground', 'a title angle'], tone: ['a friendly voice', 'an insistent tone', 'a casual tone', 'a heavy sigh'] },
    body: ['{gm.name} calls to ask how the injury is coming along, in {tone}. "No pressure," {gm.first} says, and the real question is whether you can be back for {reason}.', '{doc.name} has not cleared you yet. The decision is partly medical and partly about what kind of colleague you want to be.'],
    choices: [
      { id: 'hold_line', label: 'Hold firm until {doc.name} clears you', risk: 'low', result: 'You tell {gm.name} politely that the schedule will have to wait. It is honest and a little cold, and nobody argues.', effects: [{ fatigue: -8 }, { pop: -0.3 }, { conf: 1 }] },
      { id: 'return_early', label: 'Return early and take the spot', risk: 'high', outcomes: [
        { weight: 2, bonus: { fatigue: -0.5 }, text: 'You come back at 80 percent and carry it. The office is grateful and your name rises in the plans.', effects: [{ pop: 0.9 }, { conf: 3 }, { fatigue: 8 }, { money: 1200 }] },
        { weight: 2, text: 'The injury flares halfway through. You are gone again before the end, and the office has to scramble.', effects: [{ injury: { part: 'torso', severity: 2, days: 24 } }, { pop: -0.5 }, { conf: -5 }, { fatigue: 8 }] } ] },
      { id: 'promo_only', label: 'Offer a non-wrestling appearance instead', risk: 'low', result: 'You show up with a microphone and a brace. The segment is a hit, though a number of fans wanted the real thing.', effects: [{ pop: 0.4 }, { mic: 1 }, { fatigue: 2 }, { money: -300 }] },
      { id: 'leverage', label: 'Agree to return, but ask for a bonus', risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: '{gm.name} agrees. You collect, and you keep your word, though the injury takes a toll.', effects: [{ money: 4500 }, { fatigue: 8 }, { conf: 2 }] },
        { weight: 2, text: '{gm.name} bristles at the haggling. The offer is withdrawn, and the room goes cold.', effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
    ],
  },
  {
    id: 'life_inj_rookie_cover', category: 'injury', title: 'The Rookie Filling Your Place', weight: 2, cooldownDays: 120, maxPerCareer: 2, categoryCooldown: 8,
    cast: { rookie: { pick: 'roster', tier: { lte: 1 } } },
    trigger: { injured: true },
    slots: { visit: ['at your front door', 'in the training room', 'in the clinic waiting room', 'in the arena parking lot'], gift: ['a card signed by the roster', 'a bag of fruit', 'a stack of old match tapes', 'a bad joke wrapped in tissue paper'] },
    body: ['{rookie.name} visits you {visit}, holding {gift}. The kid has been covering the spots you left behind, and the reviews are better than expected.', '"Just keeping your place warm," {rookie.they} says, and means it. It is hard to sit at home while someone else is learning in your place, and just as hard to ignore how genuine the gesture is.'],
    choices: [
      { id: 'mentor', label: 'Offer to coach {rookie.first} through your recovery', risk: 'low', result: 'You turn the downtime into class time. {rookie.first} improves and you remember how much you know.', effects: [{ rel: { who: 'rookie', respect: 6, trust: 6 } }, { tag: { who: 'rookie', tag: 'mentee' } }, { fatigue: 2 }, { conf: 2 }] },
      { id: 'cool', label: 'Stay polite but keep your distance', risk: 'low', result: 'You say thanks, set the gift aside and show {rookie.first} out within the hour. It is not rude, but it is not warm either.', effects: [{ rel: { who: 'rookie', respect: -1, affinity: -3 } }, { fatigue: -3 }] },
      { id: 'compete', label: 'Tell {rookie.first} you will take the spot back soon', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: 'The challenge lands as a joke, and also as a promise. It motivates you for the rehab ahead.', effects: [{ conf: 4 }, { rel: { who: 'rookie', respect: 3 } }, { fatigue: 4 }] },
        { weight: 1, text: '{rookie.first} hears it as a threat and goes quiet. The goodwill drains out of the room.', effects: [{ rel: { who: 'rookie', trust: -4 } }, { conf: -1 }] } ] },
      { id: 'rest', label: 'Thank {rookie.first} and go back to resting', risk: 'low', result: 'You ask for a quiet afternoon. It is understood. You need every hour of sleep you can get.', effects: [{ fatigue: -7 }, { conf: -1 }] },
    ],
  },
  // ======================= RECOVERY =======================
  {
    id: 'life_rec_setback', category: 'recovery', title: 'A Setback in Rehab', weight: 2.5, cooldownDays: 60, maxPerCareer: 4, categoryCooldown: 8,
    cast: { doc: { pick: 'staff', role: 'doctor' } },
    trigger: { injured: true },
    slots: { setback: ['a flare-up during a stretch', 'a drop in your strength numbers', 'swelling that came back overnight', 'a missed appointment after a cancelled ride'], mood: ['discouraged', 'furious', 'numb', 'strangely calm'] },
    body: ['The setback is {setback}, and {doc.name} flags it on your chart with a short sigh. You feel {mood}, which is a feeling you are fully entitled to.', 'The calendar does not slow down for injuries. You can decide how to spend the next few days, and the plan you choose will shape the rest of the recovery.'],
    choices: [
      { id: 'grind', label: 'Grind harder in every session', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.5, fatigue: -0.4 }, text: 'You push through the frustration and the numbers recover. {doc.name} warns you not to make a habit of it.', effects: [{ attr: { name: 'toughness', delta: 1 } }, { fatigue: 9 }, { conf: 3 }] },
        { weight: 2, text: 'You overload the injured area and the setback becomes a second setback. You lose another week.', effects: [{ injury: { part: 'legs', severity: 1, days: 12 } }, { fatigue: 9 }, { conf: -4 }] } ] },
      { id: 'pause', label: 'Take three days off and step away', risk: 'low', result: 'You stay home, avoid screens and let the body catch up. When you return the pain is quieter and your head is clearer.', effects: [{ fatigue: -10 }, { conf: 1 }, { pop: -0.2 }] },
      { id: 'adjust_plan', label: 'Redesign the plan with {doc.name}', risk: 'low', result: 'The new plan includes more mobility work and fewer heavy sessions. It is slower and kinder to the injury.', effects: [{ fatigue: -4 }, { attr: { name: 'technical', delta: 1 } }, { money: -300 }] },
      { id: 'vent', label: 'Vent to a friend and rebuild your mood', risk: 'low', result: 'You spend an evening on the phone with someone who has no interest in wrestling. It helps more than you expected.', effects: [{ conf: 3 }, { fatigue: -3 }, { money: -60 }] },
    ],
  },
  {
    id: 'life_rec_breakthrough', category: 'recovery', title: 'A Good Day in Rehab', weight: 2, cooldownDays: 60, maxPerCareer: 4, categoryCooldown: 8,
    trigger: { injured: true },
    slots: { milestone: ['your first pain-free step', 'a full range of motion', 'lifting the weight you used to', 'a light bump on the mat'], witness: ['your physio', 'a stranger in the gym', 'your family', 'a staffer on the ride home'] },
    body: ['It happens in the middle of an ordinary session: {milestone}, with {witness} watching. It is not the end of recovery, but it is the first sign of the other side.', 'There is a temptation to turn one good day into a plan. It is worth thinking before you act.'],
    choices: [
      { id: 'push', label: 'Push for an early return to the ring', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: 'You test it for a few days and it holds. The office adds you back to the plans sooner than expected.', effects: [{ pop: 0.5 }, { conf: 4 }, { fatigue: 8 }] },
        { weight: 2, text: 'You overshoot and the body lets you know about it. Back to square two.', effects: [{ injury: { part: 'torso', severity: 1, days: 14 } }, { conf: -3 }, { fatigue: 8 }] } ] },
      { id: 'celebrate', label: 'Enjoy the win and keep the same plan', risk: 'low', result: 'You keep the routine steady and let the good day become a good week. The recovery stays on track.', effects: [{ conf: 3 }, { fatigue: -3 }] },
      { id: 'share', label: 'Share the progress with the fans', risk: 'low', result: 'A short update lands well. Fans cheer you on and the office notes how much goodwill your comeback has.', effects: [{ pop: 0.5 }, { conf: 2 }, { fatigue: 1 }] },
      { id: 'quiet', label: 'Keep it private and keep training hard', risk: 'med', result: 'You tell no one and add a small extra set each day. The body responds, and the edge you wanted returns.', effects: [{ attr: { name: 'endurance', delta: 1 } }, { fatigue: 6 }, { conf: 2 }] },
    ],
  },
  {
    id: 'life_rec_physio', category: 'recovery', title: 'Choosing a Physio: {clinic}', weight: 2, cooldownDays: 90, maxPerCareer: 3, categoryCooldown: 8,
    cast: { doc: { pick: 'staff', role: 'doctor' } },
    trigger: { injured: true, stat: { money: { gte: 500 } } },
    slots: { clinic: ['the company physio', 'a private sports clinic', 'a hydrotherapy studio', 'a retired wrestler\'s rehab gym'], schedule: ['early mornings', 'late nights', 'weekends', 'split sessions'] },
    body: ['You have two weeks to decide on a rehab home. {doc.name} gives you a short list, and the one you keep coming back to is {clinic}, with {schedule} as the only workable hours.', 'The cheapest option is free and a little impersonal; the best ones cost money and time. Your future knees will remember this decision.'],
    choices: [
      { id: 'company', label: 'Stay with the company physio', risk: 'low', result: 'The care is solid, free, and a little rushed. You get what you pay for, and it is enough.', effects: [{ fatigue: -3 }, { conf: 1 }] },
      { id: 'private', label: 'Pay for an elite private clinic', risk: 'med', requires: { stat: { money: { gte: 3500 } } }, outcomes: [
        { weight: 3, text: 'The expert eyes pick up what the company missed. Your recovery speeds up and your confidence follows.', effects: [{ money: -3500 }, { fatigue: -8 }, { conf: 4 }, { attr: { name: 'toughness', delta: 1 } }] },
        { weight: 1, text: 'The clinic is polished and expensive and not much better. You feel better about it than the results warrant.', effects: [{ money: -3500 }, { fatigue: -3 }, { conf: 1 }] } ] },
      { id: 'veteran_gym', label: 'Train with a veteran who has been through it', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: 'You gain stories, stretches and a feel for how long things really take. It is the human touch the company clinic lacked.', effects: [{ money: -800 }, { attr: { name: 'psychology', delta: 1 } }, { conf: 3 }, { fatigue: 3 }] },
        { weight: 1, text: 'The veteran\'s advice is old-school and a little reckless. You do too much too soon.', effects: [{ money: -800 }, { conf: -2 }, { fatigue: 6 }] } ] },
      { id: 'home', label: 'Do the exercises at home on your own', risk: 'med', result: 'You save money and keep the schedule loose. It takes more discipline than you expected, and you cut a few corners.', effects: [{ fatigue: 2 }, { conf: -1 }] },
    ],
  },
  {
    id: 'life_rec_diet', category: 'recovery', title: 'Rebuilding Your Diet Before {pressure}', weight: 2, cooldownDays: 100, maxPerCareer: 3, categoryCooldown: 8,
    cast: { doc: { pick: 'staff', role: 'doctor' } },
    trigger: { stat: { fatigue: { gte: 40 } } },
    slots: { plan: ['a strict meal-prep plan', 'a nutritionist\'s overhaul', 'cutting out the road food', 'a listen-to-your-body approach'], pressure: ['a weigh-in', 'a photo shoot', 'a big match', 'a stern talk from the doctor'] },
    body: ['{doc.name} suggests rebuilding your eating habits around {plan}, with {pressure} as the near deadline. Years of gas-station dinners and hotel breakfasts have caught up.', 'The change will cost money, time and a lot of your favorite meals. It could also be the cheapest recovery tool you have.'],
    choices: [
      { id: 'strict', label: 'Commit to a strict plan for a month', risk: 'med', outcomes: [
        { weight: 3, bonus: { confidence: 0.4 }, text: 'You get through the month and feel it in your legs, your sleep and your mood.', effects: [{ fatigue: -10 }, { conf: 3 }, { money: -500 }] },
        { weight: 1, text: 'You fall off the plan after two weeks and feel guilty about it. The benefit is smaller than you hoped.', effects: [{ fatigue: -3 }, { conf: -2 }, { money: -500 }] } ] },
      { id: 'chef', label: 'Hire a meal-prep service for the road', risk: 'low', requires: { stat: { money: { gte: 1500 } } }, result: 'Boxes appear at every hotel. It is expensive and easy, and you notice the difference within weeks.', effects: [{ money: -1500 }, { fatigue: -9 }, { conf: 2 }] },
      { id: 'flexible', label: 'Make small changes and keep treats on Fridays', risk: 'low', result: 'You swap a few habits and keep a little pleasure in your day. The progress is slow and steady.', effects: [{ fatigue: -4 }, { conf: 1 }] },
      { id: 'ignore', label: 'Stick with your usual road diet', risk: 'med', result: 'It tastes like home. It also tastes like the next three injuries, and you can feel that.', effects: [{ fatigue: 5 }, { conf: 1 }, { money: 200 }] },
    ],
  },
  {
    id: 'life_rec_sleep_debt', category: 'recovery', title: 'The Sleep Debt in {spot}', weight: 2, cooldownDays: 90, maxPerCareer: 3, categoryCooldown: 8,
    trigger: { stat: { fatigue: { gte: 60 } } },
    slots: { spot: ['hotel rooms', 'the tour bus', 'airport lounges', 'a friend\'s spare room'], culprit: ['red-eye flights', 'late-night loading docks', 'thin hotel walls', 'a habit of watching old tape until dawn'] },
    body: ['You have been sleeping in {spot} for weeks, and the worst of it comes from {culprit}. Your reflexes are a half-second off, and everyone who has seen you in the ring has noticed.', 'A tired wrestler is a dangerous wrestler, and not just to themselves. There is no quick fix, but there are options.'],
    choices: [
      { id: 'discipline', label: 'Set a strict bedtime and defend it', risk: 'low', result: 'You turn off the lights at the same hour every night. You miss a few late hangouts and gain back your reflexes.', effects: [{ fatigue: -14 }, { pop: -0.1 }, { conf: 2 }] },
      { id: 'gear', label: 'Buy blackout curtains, earplugs and a travel pillow', risk: 'low', requires: { stat: { money: { gte: 300 } } }, result: 'It is a small investment, and a good one. The next week is the best sleep you have had in months.', effects: [{ money: -300 }, { fatigue: -10 }, { conf: 1 }] },
      { id: 'power_through', label: 'Power through with coffee and willpower', risk: 'high', outcomes: [
        { weight: 2, bonus: { fatigue: -0.5 }, text: 'You get through the week and your body holds. You celebrate with a nap that lasts nine hours.', effects: [{ fatigue: 8 }, { pop: 0.3 }, { conf: 2 }] },
        { weight: 2, text: 'You mistime a spot in the ring and land awkwardly. The next morning is a long one.', effects: [{ fatigue: 10 }, { injury: { part: 'arms', severity: 1, days: 10 } }, { conf: -3 }] } ] },
      { id: 'skip_dates', label: 'Ask to skip a few dates', risk: 'med', result: 'You tell the office you need two nights at home. They agree, with a little reluctance, and you lose some money.', effects: [{ fatigue: -12 }, { money: -1000 }, { pop: -0.3 }] },
    ],
  },
  {
    id: 'life_rec_offseason_trip', category: 'recovery', title: 'The Offseason in {destination}', weight: 2, contexts: ['offseason'], cooldownDays: 200, maxPerCareer: 4, categoryCooldown: 10,
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { destination: ['a lake cabin', 'a beach town', 'your hometown', 'a city you have never seen'], company: ['your family', 'an old friend', 'a mentor', 'no one at all'] },
    body: ['The calendar finally gives you a gap. You could spend it in {destination} with {company}, or you could use it to keep working on your craft.', 'Offseasons end faster than they begin. What you do with this one might decide how the next season starts.'],
    choices: [
      { id: 'rest', label: 'Rest completely and do nothing useful', risk: 'low', result: 'You sleep late, eat slowly and lose track of the days. When you come back, your body feels rebuilt and your mind feels kinder.', effects: [{ fatigue: -22 }, { conf: 2 }, { pop: -0.3 }, { money: -800 }] },
      { id: 'train', label: 'Treat it as a training camp', risk: 'med', result: 'You spend the weeks in gyms and rings. You return sharper and a bit worn.', effects: [{ attr: { name: 'technical', delta: 1 } }, { attr: { name: 'endurance', delta: 1 } }, { fatigue: 8 }, { conf: 3 }] },
      { id: 'side_gig', label: 'Book independent shows for extra money', risk: 'med', outcomes: [
        { weight: 2, text: 'The shows are small, warm, and pay in cash. You come back with more money and sore shoulders.', effects: [{ money: 4500 }, { fatigue: 9 }, { pop: 0.3 }] },
        { weight: 1, text: 'One show cancels and another stiffs you on the fee. It was not worth the trip.', effects: [{ money: 500 }, { fatigue: 9 }, { conf: -2 }] } ] },
      { id: 'mix', label: 'Split the time between rest and light work', risk: 'low', result: 'A week to rest, a week to train, and a week to enjoy. It is balanced and unspectacular, and it works.', effects: [{ fatigue: -10 }, { attr: { name: 'psychology', delta: 1 } }, { money: -400 }] },
    ],
  },
  {
    id: 'life_rec_watch_from_home', category: 'recovery', title: 'Watching {show} from the Couch', weight: 1.5, cooldownDays: 90, maxPerCareer: 3, categoryCooldown: 8,
    trigger: { injured: true },
    slots: { show: ['a pay-per-view', 'a weekly television show', 'a big title match', 'a show you used to love'], feeling: ['envy', 'pride in your friends', 'plain boredom', 'an urge to be there'] },
    body: ['You are watching {show} while the ice pack melts beside you. It is the kind of night you would normally spend in the ring, and you notice {feeling} first.', 'It is not an easy spot. The injured are invisible to the crowd and still very present to themselves.'],
    choices: [
      { id: 'attend', label: 'Go to the arena and sit backstage', risk: 'med', result: 'You show up with a brace and a smile. Everyone is glad to see you, and you pay for the energy afterward.', effects: [{ pop: 0.2 }, { conf: 3 }, { fatigue: 5 }] },
      { id: 'study', label: 'Take notes on every match', risk: 'low', result: 'You fill a notebook with observations about timing, pacing and storytelling. The upside is real and quiet.', effects: [{ attr: { name: 'psychology', delta: 1 } }, { conf: 1 }, { fatigue: -2 }] },
      { id: 'commentary', label: 'Offer to join a broadcast as a guest', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.6, charisma: 0.4 }, text: 'You provide warm, funny insight. The announcers love you and the crowd welcomes you back.', effects: [{ pop: 0.9 }, { mic: 1 }, { fatigue: 3 }] },
        { weight: 1, text: 'You freeze on air and say something clumsy. It is not a disaster, but the clip makes the rounds.', effects: [{ pop: -0.2 }, { conf: -3 }] } ] },
      { id: 'switch_off', label: 'Switch off the screen and rest', risk: 'low', result: 'You decide the show is not your friend tonight. A good book and a long sleep do more for you.', effects: [{ fatigue: -6 }, { conf: 0 }, { pop: -0.1 }] },
    ],
  },
  // ======================= COMEBACK =======================
  {
    id: 'life_cbk_crowd_return', category: 'comeback', title: 'Back in Front of {crowd}', weight: 3, cooldownDays: 90, maxPerCareer: 4, categoryCooldown: 8, contexts: ['pre_show', 'weekly'],
    trigger: { injured: false, daysSince: { match: { gte: 45 } } },
    slots: { crowd: ['a hometown house', 'a skeptical crowd', 'a crowd with signs for you', 'an arena of strangers'], entrance: ['a quiet walk-out', 'your full entrance', 'a long pause at the top of the ramp', 'a lone spotlight'] },
    body: ['It has been a long time since you stood where you are standing, and {crowd} is waiting. The plan is {entrance}, and your heart is beating in your throat.', 'This is the first moment the crowd gets to decide whether you are still the one they remember.'],
    choices: [
      { id: 'soak', label: 'Stop and soak in the reaction', risk: 'low', outcomes: [
        { weight: 3, bonus: { popularity: 0.5, charisma: 0.4 }, text: 'The reception is warm and loud. You hold up a hand, close your eyes and let it wash over you.', effects: [{ pop: 1.0 }, { conf: 5 }] },
        { weight: 1, text: 'The sound is thin and polite. You smile and wonder how long it will take to earn it back.', effects: [{ pop: 0.1 }, { conf: -2 }] } ] },
      { id: 'business', label: 'Skip the pose and get straight to work', risk: 'low', result: 'You are in the ring in seconds. The crowd warms up to the match instead, and your timing is crisp.', effects: [{ pop: 0.4 }, { conf: 3 }, { attr: { name: 'technical', delta: 1 } }, { fatigue: 3 }] },
      { id: 'emotional', label: 'Thank the crowd with a heartfelt moment', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.5 }, text: 'You say a few honest words, and the building goes quiet and then loud. People remember it.', effects: [{ pop: 1.3 }, { conf: 4 }, { mic: 1 }] },
        { weight: 1, text: 'Your voice cracks halfway through. The crowd claps, but the moment loses its shape.', effects: [{ pop: 0.2 }, { conf: -2 }] } ] },
      { id: 'attitude', label: 'Act like you never left, and own the ring', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.6 }, text: 'The swagger works. The crowd responds in kind and the match starts hot.', effects: [{ pop: 0.8 }, { conf: 5 }, { fatigue: 4 }] },
        { weight: 2, text: 'Your timing is rusty and the swagger exposes it. The crowd notices before you do.', effects: [{ pop: -0.4 }, { conf: -4 }, { fatigue: 4 }] } ] },
    ],
  },
  {
    id: 'life_cbk_losing_streak', category: 'comeback', title: 'Climbing Out of a Losing Streak', weight: 3, major: true, cooldownDays: 90, maxPerCareer: 4, categoryCooldown: 8,
    cast: { coach: { pick: 'staff', role: 'coach' } },
    trigger: { recent: { lossesGte: 3 }, stat: { loseStreak: { gte: 3 } } },
    slots: { mood: ['patient', 'restless', 'sarcastic', 'silent'], feeling: ['doubt', 'anger', 'embarrassment', 'exhaustion'] },
    body: ['Three losses in a row and the crowd has turned {mood}. The loudest voice is your own, full of {feeling}, every time you step out of the shower.', '{coach.name} pulls up a chair in the training room and does not tell you it will be okay. "Tell me what you think went wrong," {coach.first} says, "and then tell me what you are going to change." You are the only one who can write the next chapter.'],
    choices: [
      { id: 'overhaul', label: 'Overhaul your style with {coach.name}', risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4, confidence: 0.4 }, text: 'The new approach clicks. You stop thinking, start reacting, and for the first time in weeks the match feels like yours.', effects: [{ attr: { name: 'technical', delta: 1 } }, { attr: { name: 'psychology', delta: 1 } }, { conf: 5 }, { fatigue: 8 }] },
        { weight: 2, text: 'The overhaul is half-baked. You wobble between the old way and the new, and the next match looks muddier than the last.', effects: [{ conf: -4 }, { fatigue: 8 }, { pop: -0.2 }] } ] },
      { id: 'grind', label: 'Keep your game and grind through it', risk: 'low', result: 'You stay disciplined, take no shortcuts, and trust that the pendulum swings back. It is slow work and it holds.', effects: [{ fatigue: 8 }, { attr: { name: 'endurance', delta: 1 } }, { conf: 2 }] },
      { id: 'ask_win', label: 'Ask the office for an easy win to reset', risk: 'med', outcomes: [
        { weight: 2, text: 'A friendly opponent and a fair finish give you a win. It feels small, and it helps more than it should.', effects: [{ conf: 5 }, { pop: -0.2 }] },
        { weight: 1, text: 'The office says no and hears what you are really asking. Your stock sinks a notch.', effects: [{ conf: -3 }, { pop: -0.3 }] } ] },
      { id: 'time_off', label: 'Take a week off to clear your head', risk: 'low', result: 'You step away and come back with fresh legs. The streak is still a stat, but it no longer feels like a fact.', effects: [{ fatigue: -14 }, { conf: 2 }, { pop: -0.4 }, { money: -800 }] },
    ],
  },
  {
    id: 'life_cbk_ring_rust', category: 'comeback', title: 'Shaking Off the Ring Rust', weight: 2, cooldownDays: 90, maxPerCareer: 3, categoryCooldown: 8,
    cast: { trainer: { pick: 'staff', role: 'trainer' } },
    trigger: { injured: false, daysSince: { match: { gte: 90 } } },
    slots: { cause: ['a long recovery', 'a contract dispute', 'family leave', 'an office decision'], rust: ['your timing', 'your conditioning', 'your read of the crowd', 'your finishing sequences'] },
    body: ['After the layoff, caused by {cause}, you step back in the ring with {trainer.name} and find what you feared. The rust shows in {rust}.', 'The next show is close, and so is the temptation to fake it. You can fix what is broken or pretend it is not.'],
    choices: [
      { id: 'drill', label: 'Drill the basics for a week', risk: 'low', result: 'Day after day, rep after rep. By the end of the week, the rust has been scraped off and replaced with a plain, solid base.', effects: [{ attr: { name: 'technical', delta: 1 } }, { fatigue: 9 }, { conf: 3 }] },
      { id: 'live', label: 'Work live shows and learn by doing', risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.5 }, text: 'You blow off the rust in front of a crowd that forgives easily. It is the best classroom there is.', effects: [{ pop: 0.5 }, { conf: 4 }, { fatigue: 7 }] },
        { weight: 2, text: 'You miss a cue on a spot in front of the camera, and the clip circulates for a day. It stings.', effects: [{ pop: -0.4 }, { conf: -4 }, { fatigue: 7 }] } ] },
      { id: 'sparring', label: 'Spar with a trusted partner every day', risk: 'med', result: 'You trade holds and bumps with someone who knows you. The reps are honest, the notes are kind, and the aches are real.', effects: [{ attr: { name: 'grappling', delta: 1 } }, { fatigue: 8 }, { conf: 2 }] },
      { id: 'manage', label: 'Hide the weak spots with a simpler match plan', risk: 'med', result: 'You work a clean, safe match that avoids your trouble areas. The audience sees a competent performance and no hint of what is under it.', effects: [{ pop: 0.2 }, { conf: 1 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 3 }] },
    ],
  },
  {
    id: 'life_cbk_surprise_return', category: 'comeback', title: 'A Return Nobody Saw Coming', weight: 2, contexts: ['show_day'], cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 10,
    cast: { producer: { pick: 'staff', role: 'producer' } },
    trigger: { injured: false, daysSince: { match: { gte: 60 } }, stat: { popularity: { gte: 35 } } },
    slots: { arrival: ['from the crowd', 'through the curtain', 'in the middle of a rival\'s promo', 'at the end of the show'], tease: ['no music', 'no announcement', 'a short teaser video', 'a message to the fans'] },
    body: ['{producer.name} floats the idea of a surprise return, arriving {arrival}, with {tease}. It would be the kind of moment that gets replayed for a year if it works.', 'It will take planning, and a lot of nerve. The dangers are as big as the upside.'],
    choices: [
      { id: 'go_big', label: 'Go all-in on the surprise', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, popularity: 0.5 }, text: 'The crowd erupts. Even {producer.name} is grinning on the monitor, and the clip will be replayed for weeks.', effects: [{ pop: 2.2 }, { conf: 6 }, { fatigue: 6 }] },
        { weight: 2, text: 'A leak ruins the surprise, and the reaction is warm rather than wild. The moment is fine, not special.', effects: [{ pop: 0.5 }, { conf: -2 }, { fatigue: 6 }] } ] },
      { id: 'low_key', label: 'Keep it low-key and let it build', risk: 'low', result: 'You return without a fanfare, and the crowd works its way up to the moment. It is a smaller peak and a safer one.', effects: [{ pop: 0.7 }, { conf: 3 }, { fatigue: 3 }] },
      { id: 'tease_first', label: 'Tease it for a few weeks first', risk: 'med', result: 'A few cryptic hints get the fans talking. By the time you return the interest is high, and so are the expectations.', effects: [{ pop: 0.9 }, { conf: 2 }, { fatigue: 3 }, { money: -300 }] },
      { id: 'decline', label: 'Decline and return through a normal booking', risk: 'low', result: 'You return in a standard match without any hype. It is honest, safe and a little forgettable.', effects: [{ conf: 1 }, { pop: 0.2 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'life_cbk_reinvention', category: 'comeback', title: 'Time for {change}', weight: 2, cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 10,
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { loseStreak: { gte: 4 }, careerYears: { gte: 2 } } },
    slots: { change: ['a darker look', 'a new move set', 'a sharper attitude', 'a new name for a new start'], push: ['a producer\'s suggestion', 'your own instinct', 'a fan\'s letter', 'a rival\'s insult'] },
    body: ['After the losses, {push} gets you thinking about {change}. {creative.name} has already sketched a few ideas and is ready to try.', 'Reinvention is the most common story in this business and the most commonly botched. Done well it can restart a career; done badly it can end one.'],
    choices: [
      { id: 'full', label: 'Commit to the full reinvention', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.6, confidence: 0.4 }, text: 'The new you lands with a bang. Fans who had written you off are talking about you again.', effects: [{ pop: 1.5 }, { conf: 6 }, { fatigue: 6 }] },
        { weight: 2, text: 'The change feels like a costume and the crowd can tell. You get a polite, confused reception.', effects: [{ pop: -0.5 }, { conf: -5 }, { fatigue: 6 }] } ] },
      { id: 'tweak', label: 'Make a subtle adjustment, not a total change', risk: 'low', result: 'A few smart changes, a better entrance and a sharper look. It is a gentle reset and it does the job.', effects: [{ pop: 0.4 }, { conf: 3 }, { money: -400 }] },
      { id: 'tell_story', label: 'Build the change into a storyline', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5 }, text: 'You frame the change as a story and fans buy in. It gives your losing run a meaning.', effects: [{ pop: 0.9 }, { mic: 1 }, { conf: 4 }] },
        { weight: 1, text: 'The story is muddled and takes weeks to become clear. Many viewers stop paying attention.', effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'stay', label: 'Stay who you are and trust the work', risk: 'low', result: 'You decline the makeover and keep the grind. It is slow and honest and you hope people notice.', effects: [{ conf: 2 }, { fatigue: 4 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'life_cbk_first_win', category: 'comeback', title: 'The Win That Ends the Drought', weight: 2, contexts: ['post_match'], cooldownDays: 90, maxPerCareer: 3, categoryCooldown: 8,
    trigger: { recent: { lossesGte: 3 }, stat: { winStreak: { gte: 1 } } },
    slots: { how: ['a messy roll-up', 'a clean finish', 'a surprise upset', 'a hard-fought grind'], reaction: ['a standing ovation', 'scattered applause', 'a nodding veteran', 'a quiet locker room'] },
    body: ['You got the win with {how}, and the first thing you notice is {reaction}. The weight in your chest has not gone away yet, but it has shifted.', 'You have a few minutes before the lights come on again and a lot of ways to spend them.'],
    choices: [
      { id: 'ride', label: 'Celebrate loudly and ride the momentum', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: 'You raise a hand and shout. The crowd gives it back, and the win begins to feel like something.', effects: [{ pop: 0.7 }, { conf: 5 }] },
        { weight: 1, text: 'You overdo it and the crowd laughs at the wrong time. The moment turns awkward.', effects: [{ pop: -0.2 }, { conf: 1 }] } ] },
      { id: 'quiet_pride', label: 'Quietly thank your coach and head home', risk: 'low', result: 'You say little and mean it. The confidence comes in slowly and stays.', effects: [{ conf: 4 }, { fatigue: -3 }] },
      { id: 'call_out', label: 'Call out a bigger name on the mic', risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.6, confidence: 0.4 }, text: 'The call-out lands and the crowd roars. The office books it and you are back in the story.', effects: [{ pop: 1.2 }, { conf: 4 }, { mic: 1 }] },
        { weight: 2, text: 'The big name ignores you and the fans decide you got ahead of yourself.', effects: [{ pop: -0.5 }, { conf: -3 }] } ] },
      { id: 'analyze', label: 'Review the match tape and fix the flaws', risk: 'low', result: 'You study the clip with a notebook and a marker. Even a win has things to fix, and you find three of them.', effects: [{ attr: { name: 'psychology', delta: 1 } }, { conf: 2 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'life_cbk_veteran_advice', category: 'comeback', title: 'A Veteran\'s Lesson on {theme}', weight: 1.5, cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 8,
    cast: { vet: { pick: 'roster', tier: { gte: 3 } } },
    trigger: { stat: { loseStreak: { gte: 2 }, careerYears: { gte: 1 } } },
    slots: { theme: ['patience', 'anger', 'humility', 'change'], setting: ['a long walk', 'a late dinner', 'a ride between cities', 'a hallway talk'] },
    body: ['{vet.name} finds you after the show and offers a lesson about {theme}, over {setting}. {vet.they} has had more bad runs than you have had matches.', '"Everybody gets buried at least once," {vet.they} says. It is not a pep talk but a story about a low point, and the one stubborn decision that got {vet.them} out of it.'],
    choices: [
      { id: 'listen', label: 'Listen closely and take notes', risk: 'low', result: 'You write half-sentences on the back of a call sheet. The advice does not solve anything today, but it will.', effects: [{ rel: { who: 'vet', respect: 5, trust: 3 } }, { attr: { name: 'psychology', delta: 1 } }, { conf: 2 }] },
      { id: 'argue', label: 'Push back and argue your side', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: '{vet.first} grins at your stubbornness. The disagreement becomes a friendship.', effects: [{ rel: { who: 'vet', respect: 6, affinity: 4 } }, { conf: 3 }] },
        { weight: 1, text: '{vet.first} lets the silence do the talking and walks away. The room is cold.', effects: [{ rel: { who: 'vet', respect: -3, affinity: -3 } }, { conf: -2 }] } ] },
      { id: 'ask_more', label: 'Ask for a regular mentorship', risk: 'med', result: '{vet.first} agrees to meet for a monthly lesson. It will cost you time and ego, but the guidance is real.', effects: [{ tag: { who: 'vet', tag: 'mentor' } }, { rel: { who: 'vet', trust: 6 } }, { fatigue: 4 }, { conf: 2 }] },
      { id: 'thank_leave', label: 'Thank {vet.them} politely and move on', risk: 'low', result: 'You keep your distance, a small act of self-protection. The advice stays in your pocket.', effects: [{ rel: { who: 'vet', respect: -1 } }, { fatigue: -2 }] },
    ],
  },
  // ======================= RETIREMENT =======================
  {
    id: 'life_ret_thinking', category: 'retirement', title: 'The Morning You Thought About Stopping', weight: 2, major: true, cooldownDays: 180, maxPerCareer: 3, categoryCooldown: 15,
    trigger: { stat: { careerYears: { gte: 12 } }, any: [{ stat: { fatigue: { gte: 50 } } }, { stat: { injuries: { gte: 3 } } }] },
    slots: { moment: ['a morning when your back would not unlock', 'a farewell card for a retiring peer in the morning mail', 'a rookie asking about your spot over breakfast', 'a long, quiet drive home the night before'], weight_on_you: ['your family', 'the bills', 'the crowd', 'the pain'] },
    body: ['It starts with {moment}, and by lunch the thought has a shape: maybe it is time. The thing your mind keeps circling back to is {weight_on_you}.', 'You have never been more sure of what you have built, or less sure of how much longer you can keep building it. Nobody can make this call for you.'],
    choices: [
      { id: 'retire', label: 'Announce your retirement', risk: 'high', result: 'You say it out loud for the first time, and it is easier than you feared. The office offers a farewell and the career closes on your terms.', effects: [{ event: { type: 'retirement', participants: [], summary: '{player.name} announced retirement after a long career.', importance: 5, data: {} } }, { pop: 1.0 }, { conf: 2 }] },
      { id: 'one_more', label: 'Commit to one more year', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5, fatigue: -0.4 }, text: 'Having an end date makes every night matter. You wrestle with a looseness you forgot you had.', effects: [{ conf: 4 }, { pop: 0.5 }, { fatigue: 6 }] },
        { weight: 2, text: 'The end date turns every ache into a verdict. The year feels long.', effects: [{ conf: -3 }, { fatigue: 9 }] } ] },
      { id: 'cut_back', label: 'Cut back to a lighter, selective schedule', risk: 'low', result: 'You agree to fewer dates and bigger matches. It costs money and brings back some of the joy.', effects: [{ fatigue: -14 }, { money: -3000 }, { pop: -0.3 }, { conf: 2 }] },
      { id: 'talk', label: 'Talk it over with someone you trust', risk: 'low', result: 'The conversation does not decide anything, but you see the choice more clearly for it. You go home calmer.', effects: [{ conf: 3 }, { fatigue: -3 }] },
    ],
  },
  {
    id: 'life_ret_farewell_tour', category: 'retirement', title: 'A Farewell Tour for the {crowd}', weight: 2, major: true, cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 20,
    cast: { exec: { pick: 'staff', role: 'executive' } },
    trigger: { stat: { careerYears: { gte: 15 }, popularity: { gte: 50 } } },
    slots: { crowd: ['faithful', 'old fans', 'new fans', 'hometown fans'], stops: ['a short run of arenas', 'a tour of your old stomping grounds', 'a global swing', 'a mix of big shows and small towns'] },
    body: ['{exec.name} lays out a plan for a farewell tour for the {crowd}: {stops}, with a final night to be announced. The numbers are good, and so is the feeling in the room.', 'It is a tidy way to leave and a profitable one. It would also commit you to a goodbye, whatever your body says in six months.'],
    choices: [
      { id: 'sign_tour', label: 'Sign on and retire at the end of the tour', risk: 'high', result: 'You sign. The tour is announced with a poster and a hug, and the career has an end date, a payday and a good story.', effects: [{ money: 30000 }, { fatigue: 14 }, { event: { type: 'retirement', participants: [], summary: '{player.name} retired after a farewell tour.', importance: 5, data: {} } }, { pop: 1.5 }, { conf: 3 }] },
      { id: 'decline_tour', label: 'Decline: you are not finished yet', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: 'You tell the office you will say goodbye when you are ready. The defiance lands with the fans, and you feel a surge of energy.', effects: [{ pop: 0.6 }, { conf: 5 }, { fatigue: 4 }] },
        { weight: 1, text: 'The office takes the refusal personally and cools on you. The tour goes to someone else.', effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'goodbye_segment', label: 'Ask for a single goodbye segment without retiring', risk: 'low', result: 'The crowd gets an emotional farewell to one chapter, not the whole book. It is moving and it is not final.', effects: [{ pop: 0.9 }, { conf: 3 }, { money: 4000 }, { fatigue: 3 }] },
      { id: 'title_run', label: 'Counter by asking for one last title run first', risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.6, popularity: 0.4 }, text: 'The office agrees to a short run and the fans fill the arena to see it. You get your moment.', effects: [{ pop: 1.2 }, { conf: 5 }, { fatigue: 10 }] },
        { weight: 2, text: 'The office declines and asks if you are still negotiating the farewell. The air chills.', effects: [{ pop: -0.4 }, { conf: -3 }] } ] },
    ],
  },
  {
    id: 'life_ret_veteran_farewell', category: 'retirement', title: 'A Legend Says Goodbye in {venue}', weight: 1.5, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 10,
    cast: { legend: { pick: 'roster', tier: { gte: 3 } } },
    trigger: { stat: { careerYears: { gte: 2 } } },
    slots: { venue: ['the locker room', 'the ring after the show', 'a hotel ballroom', 'a hometown arena'], gesture: ['a handshake line', 'a speech from the office', 'a montage of old clips', 'a group photo'] },
    body: ['{legend.name} is saying goodbye, and the whole roster has gathered in {venue} for it. The company has planned {gesture}, and the room is quieter than it has ever been.', 'You are asked if you want to say a few words. It is a small honor and a delicate one.'],
    choices: [
      { id: 'speak', label: 'Speak about what {legend.first} taught you', risk: 'med', outcomes: [
        { weight: 3, bonus: { mic: 0.5, charisma: 0.5 }, text: 'Your words are plain and true. {legend.first} wipes an eye and the roster claps.', effects: [{ rel: { who: 'legend', respect: 8, affinity: 6 } }, { pop: 0.4 }, { conf: 3 }] },
        { weight: 1, text: 'You fumble a joke and the room goes quiet. {legend.first} laughs kindly, but the moment is dented.', effects: [{ rel: { who: 'legend', respect: 2 } }, { conf: -3 }] } ] },
      { id: 'gift', label: 'Give {legend.first} a gift you paid for', risk: 'low', requires: { stat: { money: { gte: 500 } } }, result: 'It is a framed photo and a handwritten note. {legend.first} says it is the best thing anyone gave this week.', effects: [{ money: -500 }, { rel: { who: 'legend', respect: 6, affinity: 6 } }, { conf: 2 }] },
      { id: 'stay_back', label: 'Stay in the back and watch quietly', risk: 'low', result: 'You hold your tongue and take it all in. You will remember more than if you had been in the spotlight.', effects: [{ attr: { name: 'psychology', delta: 1 } }, { conf: 1 }] },
      { id: 'skip', label: 'Skip it to rest before your own match', risk: 'med', result: 'You need the sleep. It is a reasonable call, and a few people take note of the empty seat.', effects: [{ fatigue: -8 }, { rel: { who: 'legend', respect: -4 } }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'life_ret_body_says_stop', category: 'retirement', title: 'What the {scan} Showed', weight: 2, major: true, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 15,
    cast: { doc: { pick: 'staff', role: 'doctor' } },
    trigger: { injured: true, serious: true, stat: { careerYears: { gte: 8 }, injuries: { gte: 4 } } },
    slots: { scan: ['scan', 'blood test', 'x-ray series', 'strength assessment'], verdict: ['a long list of old damage', 'a stiff warning', 'a cautious prognosis', 'a blunt number'] },
    body: ['{doc.name} sits you down after the {scan}. The results come with {verdict}, and the word "career" comes up in a way you did not like.', 'You can see two roads. One keeps the lights on at a cost. The other closes the book while the pages are still readable.'],
    choices: [
      { id: 'retire_now', label: 'Retire while your body can still carry you', risk: 'high', result: 'You make the call. It is quiet, relieved and a little sad. You walk out of the clinic and into a different life.', effects: [{ event: { type: 'retirement', participants: [], summary: '{player.name} retired on medical advice.', importance: 5, data: {} } }, { conf: 2 }, { pop: 0.8 }] },
      { id: 'reduced', label: 'Return in a reduced role with fewer bumps', risk: 'med', result: 'You agree to a limited role, storytelling matches and less aerial work. The fans hardly notice, and your body does.', effects: [{ fatigue: -10 }, { money: -3000 }, { attr: { name: 'psychology', delta: 1 } }, { pop: -0.2 }] },
      { id: 'surgery_fight', label: 'Fight for a surgical fix and a full return', risk: 'high', requires: { stat: { money: { gte: 4000 } } }, outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: 'The surgery works and the rehab is brutal but clean. You return with a repaired body and a head full of reasons to prove it.', effects: [{ money: -9000 }, { injury: { part: 'legs', severity: 2, days: 70 } }, { conf: 5 }, { attr: { name: 'toughness', delta: 1 } }] },
        { weight: 2, text: 'The surgery goes fine, and recovery does not. You are on the sidelines far longer than you hoped.', effects: [{ money: -9000 }, { injury: { part: 'legs', severity: 2, days: 110 } }, { conf: -5 }, { pop: -0.6 }] } ] },
      { id: 'coaching', label: 'Ask the office about a coaching role', risk: 'low', result: 'The office is receptive. You get an exploratory title and a new angle on a life you thought was ending.', effects: [{ flag: 'considering_coaching_career' }, { fatigue: -6 }, { pop: -0.2 }, { conf: 1 }] },
    ],
  },
  {
    id: 'life_ret_second_career', category: 'retirement', title: 'Planning Life After the Ring', weight: 1.5, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 12,
    trigger: { stat: { careerYears: { gte: 9 } }, noFlag: 'has_second_career_plan' },
    slots: { spark: ['a friend\'s offer', 'a boring Tuesday', 'a magazine profile', 'an injury scare'], idea: ['coaching young talent', 'working a broadcast desk', 'opening a restaurant', 'auditioning for a film role'] },
    body: ['It was {spark} that planted the thought. Now you keep imagining {idea} as the next chapter, and the thought will not leave.', 'Plans like these are easier before the body forces them on you. They also cost time and money you would rather spend on your current job.'],
    choices: [
      { id: 'coach', label: 'Start helping at a training school on days off', risk: 'low', result: 'Two afternoons a week, a rotation of students and a lot of patience. You discover that teaching is its own kind of performance.', effects: [{ flag: 'has_second_career_plan' }, { fatigue: 6 }, { conf: 3 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'broadcast', label: 'Take announcing classes and practice on tape', risk: 'low', requires: { stat: { money: { gte: 600 } } }, result: 'You learn about breath and pacing and practice calls on old matches. The voice you build will outlast the knees.', effects: [{ flag: 'has_second_career_plan' }, { money: -600 }, { mic: 1 }, { charisma: 1 }, { fatigue: 3 }] },
      { id: 'business', label: 'Put money into a small business', risk: 'high', requires: { stat: { money: { gte: 8000 } } }, outcomes: [
        { weight: 2, text: 'The venture finds steady customers and pays out. It is not a fortune, but it is a floor.', effects: [{ flag: 'has_second_career_plan' }, { money: 8000 }, { conf: 3 }] },
        { weight: 2, text: 'The venture burns cash and attention. You close it after a year and learn what not to do.', effects: [{ flag: 'has_second_career_plan' }, { money: -9000 }, { conf: -3 }, { fatigue: 5 }] } ] },
      { id: 'focus', label: 'Set the idea aside and keep focused on the ring', risk: 'low', result: 'You push the plans to a drawer. The ring has your attention, and the plans can wait, for now.', effects: [{ conf: 2 }, { attr: { name: 'technical', delta: 1 } }, { fatigue: 4 }] },
    ],
  },
  {
    id: 'life_ret_family_ultimatum', category: 'retirement', title: 'The Talk at the {place}', weight: 2, major: true, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 15,
    trigger: { injured: true, stat: { careerYears: { gte: 8 } } },
    slots: { place: ['kitchen table', 'hospital cafeteria', 'airport gate', 'edge of the porch'], who: ['your partner', 'your mother', 'your oldest friend', 'your grown child'] },
    body: ['{who} sits you down at the {place} and says it plainly: the injuries are getting worse, the time at home is getting shorter, and they want you to stop.', 'No one is shouting. It would be easier if they were. This is love that is also fear, and it will not go away just because you deny it.'],
    choices: [
      { id: 'stop', label: 'Promise to retire and wrap things up well', risk: 'high', result: 'You say yes, and the relief on their face tells you how long they have been holding it in. You still have a few matches to finish, and a career to close on your terms.', effects: [{ event: { type: 'retirement', participants: [], summary: '{player.name} retired for the sake of family and health.', importance: 5, data: {} } }, { conf: 1 }, { pop: 0.8 }] },
      { id: 'compromise', label: 'Compromise: fewer dates and a firm end date', risk: 'med', result: 'You agree to a year of reduced work and a final bow. The compromise is honest, and still hard.', effects: [{ fatigue: -10 }, { money: -4000 }, { conf: 2 }, { pop: -0.2 }] },
      { id: 'refuse', label: 'Politely refuse: this is who you are', risk: 'high', outcomes: [
        { weight: 1, bonus: { confidence: 0.5 }, text: 'They hear the conviction and decide to trust you. The air is lighter, but the worry stays.', effects: [{ conf: 4 }, { fatigue: 4 }] },
        { weight: 2, text: 'The refusal costs you an evening and a long silence. The home you return to feels colder.', effects: [{ conf: -5 }, { fatigue: 5 }] } ] },
      { id: 'time', label: 'Ask for one more season before deciding', risk: 'med', result: 'They give you the season. It buys time but not peace, and every ache is now a conversation.', effects: [{ conf: 1 }, { fatigue: 3 }, { pop: 0.2 }] },
    ],
  },
  {
    id: 'life_ret_last_match', category: 'retirement', title: 'Planning a Last Match in {venue}', weight: 2, major: true, cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 20,
    cast: { producer: { pick: 'staff', role: 'producer' } },
    trigger: { stat: { careerYears: { gte: 18 }, popularity: { gte: 40 } } },
    slots: { venue: ['your hometown', 'the biggest show of the year', 'a small building where you started', 'a regular television taping'], opponent: ['a rookie', 'your oldest rival', 'a hand-picked friend', 'a surprise opponent'] },
    body: ['{producer.name} has a spot open in {venue} and asks if you want to make it special. A match against {opponent} would end a career in the way you picture it.', 'There are many ways to leave. Some wrestlers pick a date and some are chosen by a bad bump. You get to choose.'],
    choices: [
      { id: 'final', label: 'Make it your final match and retire', risk: 'high', result: 'You write the last page yourself. The match is long, emotional and a little slow, and the building loves every second of it.', effects: [{ event: { type: 'retirement', participants: [], summary: '{player.name} wrestled a final match and retired.', importance: 5, data: {} } }, { pop: 2.0 }, { conf: 4 }, { fatigue: 8 }] },
      { id: 'maybe_final', label: 'Wrestle it as a possible last match without saying so', risk: 'med', outcomes: [
        { weight: 2, bonus: { popularity: 0.4, charisma: 0.4 }, text: 'The fans smell it and the building turns reverent. You stay silent at the end and walk out into the dark. The decision is still yours.', effects: [{ pop: 1.3 }, { conf: 4 }, { fatigue: 6 }] },
        { weight: 1, text: 'The match is fine, and nobody can tell what it was for. You leave without an answer.', effects: [{ pop: 0.2 }, { conf: -1 }, { fatigue: 6 }] } ] },
      { id: 'refuse_final', label: 'Say you are not ready to set a date', risk: 'low', result: 'You turn it down and keep your options open. {producer.name} nods; it is not the first time that line has been used.', effects: [{ conf: 1 }, { pop: -0.1 }] },
      { id: 'big_one', label: 'Ask for a bigger stage and a bigger payoff', risk: 'high', outcomes: [
        { weight: 1, bonus: { popularity: 0.6 }, text: 'The office likes the ambition. The match is rebooked for a bigger date and a bigger check.', effects: [{ money: 12000 }, { pop: 0.8 }, { conf: 3 }] },
        { weight: 2, text: 'The office takes the pitch as greed. The special match is quietly dropped.', effects: [{ conf: -3 }, { pop: -0.3 }] } ] },
    ],
  },
  // ======================= LEGACY =======================
  {
    id: 'life_leg_interview', category: 'legacy', title: 'A {format} About Your Legacy', weight: 2, cooldownDays: 180, maxPerCareer: 3, categoryCooldown: 10,
    cast: { host: { pick: 'media', kind: 'interviewer' } },
    trigger: { stat: { careerYears: { gte: 4 } }, any: [{ stat: { titleWins: { gte: 1 } } }, { stat: { careerYears: { gte: 6 } } }] },
    slots: { format: ['sit-down interview', 'long-form conversation', 'career retrospective', 'tribute feature'], topic: ['your first match', 'the toughest night of your career', 'your greatest rival', 'what you would do differently'] },
    body: ['{host.name} sets up for a {format}, and the first question is a hard one. It is about {topic}, and you can feel the weight of years behind it.', 'Everything you say will be quoted. How you want to be remembered is partly up to you, and partly a matter of how you speak tonight.'],
    choices: [
      { id: 'honest', label: 'Answer honestly, including the failures', risk: 'med', outcomes: [
        { weight: 3, bonus: { mic: 0.4, charisma: 0.4 }, text: 'You speak plainly and the piece gets better for it. People respect the vulnerability.', effects: [{ pop: 0.7 }, { conf: 3 }, { event: { type: 'interview', participants: ['host'], summary: 'Gave an honest legacy interview.', data: { quality: { base: 68, mic: 0.4, charisma: 0.3 }, viral: { minQuality: 88, chance: 0.3 } } } }] },
        { weight: 1, text: 'A harsh line is pulled out of context. The headline is more severe than the interview.', effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
      { id: 'polish', label: 'Tell the polished version of the story', risk: 'low', result: 'The story is warm and well-shaped. It is not the whole truth, but nobody objects.', effects: [{ pop: 0.4 }, { conf: 1 }] },
      { id: 'credit_others', label: 'Spend the interview crediting the people who helped', risk: 'low', result: 'You name trainers, rivals and the crew. They will remember, and the piece is warm.', effects: [{ pop: 0.3 }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'refuse', label: 'Politely decline to talk about the past', risk: 'low', result: 'You say you are still writing the story. It is a fine line, and the host runs with it.', effects: [{ pop: -0.1 }, { conf: 2 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'life_leg_train_next', category: 'legacy', title: 'Training {pupil_name}', weight: 2, cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 10,
    cast: { pupil: { pick: 'roster', tier: { lte: 1 } }, trainer: { pick: 'staff', role: 'trainer' } },
    trigger: { stat: { careerYears: { gte: 5 } } },
    slots: { pupil_name: ['a promising rookie', 'a struggling rookie', 'an overconfident rookie', 'a shy rookie'], need: ['a rough bump technique', 'a flat promo', 'a short temper', 'a lack of direction'] },
    body: ['{trainer.name} asks if you would work with {pupil.name}, {pupil_name}, who has {need}. It is a polite request and a quiet challenge.', 'Teaching takes time you do not have. It also leaves a mark on the business long after your own matches have faded from memory.'],
    choices: [
      { id: 'commit', label: 'Take {pupil.first} on seriously', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.4, confidence: 0.3 }, text: 'It takes patience and a great deal of repetition. {pupil.first} improves in front of your eyes, and so do you.', effects: [{ rel: { who: 'pupil', respect: 8, trust: 8 } }, { event: { type: 'mentorship', participants: ['pupil'], summary: 'Took {pupil.name} under your wing.', data: { byPlayer: true } } }, { fatigue: 7 }, { conf: 3 }] },
        { weight: 1, text: '{pupil.first} does not take direction well. The sessions turn tense and nothing sticks.', effects: [{ rel: { who: 'pupil', trust: -3 } }, { fatigue: 7 }, { conf: -2 }] } ] },
      { id: 'few_tips', label: 'Offer a few tips and leave it there', risk: 'low', result: 'You give {pupil.first} three notes and a handshake. It is useful, brief and easy to forget.', effects: [{ rel: { who: 'pupil', respect: 2 } }, { fatigue: 1 }] },
      { id: 'decline', label: 'Say you are too busy', risk: 'low', result: '{trainer.name} understands, but the lack of interest is noticed. You keep the time and lose a little goodwill.', effects: [{ fatigue: -3 }, { pop: -0.1 }, { conf: -1 }] },
      { id: 'fee', label: 'Offer to teach for a small fee', risk: 'med', result: 'You turn the favor into a business arrangement. The money is nice and the warmth is not.', effects: [{ money: 1800 }, { rel: { who: 'pupil', respect: -1, trust: -2 } }, { fatigue: 5 }] },
    ],
  },
  {
    id: 'life_leg_documentary', category: 'legacy', title: 'A Documentary Crew Wants Your Story', weight: 1.5, major: true, cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 15,
    cast: { host: { pick: 'media', kind: 'fan' } },
    trigger: { minYear: 2000, stat: { careerYears: { gte: 8 }, popularity: { gte: 50 } } },
    slots: { angle: ['your rise from nothing', 'a bitter feud', 'a comeback story', 'the cost of fame'], crew: ['a small crew and a big idea', 'a cable network\'s camera crew', 'a student film team', 'a crew from an international production house'] },
    body: ['{host.name} arrives with {crew}, making a film about {angle}. They want access: your training, your home, your hardest memories.', 'A good documentary can define a career for decades. A bad one can follow you the same way.'],
    choices: [
      { id: 'full_access', label: 'Give them full access', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.4 }, text: 'The film is intimate and generous. Audiences cry in the right places and your name travels further than it has in years.', effects: [{ pop: 1.8 }, { conf: 4 }, { fatigue: 8 }] },
        { weight: 2, text: 'The edit leans on your worst moments. The film is praised, and you are not.', effects: [{ pop: 0.3 }, { conf: -5 }, { fatigue: 8 }] } ] },
      { id: 'controlled', label: 'Allow limited access under agreed terms', risk: 'low', result: 'The crew gets a handful of interviews and a day at the gym. The film is polite and brief.', effects: [{ pop: 0.6 }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'sell', label: 'Sell exclusive rights for a fee', risk: 'med', result: 'You take the fee and hand over the story. The film is theirs, the money is yours, and the details are mostly out of your hands.', effects: [{ money: 25000 }, { pop: 0.3 }, { conf: 1 }] },
      { id: 'pass', label: 'Pass: your story is not finished yet', risk: 'low', result: 'You tell {host.first} the project can wait. It is a modest, dignified refusal, and it keeps your options open.', effects: [{ conf: 2 }, { fatigue: -3 }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'life_leg_hall_whispers', category: 'legacy', title: 'Whispers of the Hall of Fame', weight: 1.5, cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 15,
    cast: { exec: { pick: 'staff', role: 'executive' } },
    trigger: { stat: { titleWins: { gte: 2 }, careerYears: { gte: 12 } } },
    slots: { source: ['a hallway rumor', 'a quiet call from a friend', 'a sentence in a column', 'a question at a press event'], reaction: ['pride', 'embarrassment', 'impatience', 'a strange calm'] },
    body: ['It first reaches you through {source}: your name is on a list for the Hall of Fame. The first thing you feel is {reaction}.', '"I cannot comment on lists," {exec.name} says, with the careful look of someone who knows more than is allowed to be said.'],
    choices: [
      { id: 'quiet', label: 'Stay quiet and keep doing the work', risk: 'low', result: 'You say nothing and stay out of the way. When the day comes, the honor will mean more for it.', effects: [{ conf: 3 }, { pop: 0.2 }] },
      { id: 'campaign', label: 'Subtly lobby the people who vote', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.5, popularity: 0.4 }, text: 'A few well-timed lunches and some friendly words help your chances. Nobody calls it campaigning.', effects: [{ pop: 0.7 }, { conf: 3 }, { money: -800 }] },
        { weight: 2, text: 'The lobbying gets noticed and not in a good way. It earns you a reputation for hunger rather than humility.', effects: [{ pop: -0.5 }, { conf: -3 }, { money: -800 }] } ] },
      { id: 'play_down', label: 'Tell everyone you do not deserve it yet', risk: 'low', result: 'The modesty plays well and reaches the right ears, though some read it as false.', effects: [{ pop: 0.3 }, { conf: 1 }] },
      { id: 'legacy_push', label: 'Push to be booked in big matches to add to the case', risk: 'med', result: 'You ask for the marquee spots. The office likes the energy, and your body pays for it.', effects: [{ pop: 0.8 }, { fatigue: 9 }, { conf: 2 }] },
    ],
  },
  {
    id: 'life_leg_borrowed_move', category: 'legacy', title: 'A Rookie Used {thing}', weight: 1.5, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 8,
    cast: { rookie: { pick: 'roster', tier: { lte: 1 } } },
    trigger: { stat: { careerYears: { gte: 3 }, popularity: { gte: 40 } } },
    slots: { thing: ['your finisher', 'your entrance', 'your signature taunt', 'your catchphrase'], where: ['in a house show', 'in a training session', 'in a television match', 'in a fan video'] },
    body: ['{rookie.name} used {thing} {where}. It was not a mistake, because {rookie.they} had practiced it.', 'Wrestling is a business that borrows constantly and forgives selectively. What you do next says something about the kind of veteran you are.'],
    choices: [
      { id: 'flattered', label: 'Take it as a compliment and say nothing', risk: 'low', result: 'You smile and let it go. The rookie notices the grace, and a couple of veterans notice the lack of backbone.', effects: [{ rel: { who: 'rookie', respect: 3, affinity: 4 } }, { conf: -1 }] },
      { id: 'confront', label: 'Take {rookie.first} aside and set the boundary', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: 'You explain it calmly and {rookie.first} apologizes. It is cleared up before it can fester.', effects: [{ rel: { who: 'rookie', respect: 5, trust: 3 } }, { conf: 3 }] },
        { weight: 1, text: '{rookie.first} gets defensive and tells the locker room you are insecure.', effects: [{ rel: { who: 'rookie', heat: 8, respect: -3 } }, { conf: -2 }] } ] },
      { id: 'teach', label: 'Teach {rookie.first} the story behind it', risk: 'low', result: 'You take an hour and explain the history and why it works. {rookie.first} is humbled, and a better student.', effects: [{ rel: { who: 'rookie', respect: 6, trust: 5 } }, { tag: { who: 'rookie', tag: 'studying_you' } }, { fatigue: 3 }, { conf: 2 }] },
      { id: 'public_call', label: 'Call it out in front of the locker room', risk: 'high', result: 'Everyone hears it. {rookie.first} will not do it again, and neither will anyone else, and a few people think less of you.', effects: [{ rel: { who: 'rookie', heat: 10, fear: 6, respect: -4 } }, { pop: -0.1 }, { conf: 2 }] },
    ],
  },
  {
    id: 'life_leg_tattoo', category: 'legacy', title: 'A Fan Wears Your Mark', weight: 1, cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 8,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 60 } } },
    slots: { art: ['logo', 'catchphrase', 'signature pose', 'face'], spot: ['on a forearm', 'across a back', 'on a calf', 'on a shoulder'] },
    body: ['At the barricade, {fan.name} shows you your {art} permanently inked {spot}. It looks well done, and a little bit frightening.', '"It is forever," {fan.first} says. "I checked." You are used to being cheered, but being worn is a different level of responsibility.'],
    choices: [
      { id: 'sign_photo', label: 'Sign near the ink and pose for a photo', risk: 'low', result: 'You sign above the tattoo and take the picture. The shot becomes a favorite among the regulars at the barricade.', effects: [{ pop: 0.6 }, { fatigue: 2 }, { conf: 2 }] },
      { id: 'caution', label: 'Gently tell {fan.first} to be careful about permanent choices', risk: 'low', result: '{fan.first} laughs and promises it was thought through. You feel better for having said it.', effects: [{ conf: 1 }, { pop: 0.1 }] },
      { id: 'gift_pass', label: 'Give {fan.first} backstage passes for the family', risk: 'low', requires: { stat: { money: { gte: 200 } } }, result: '{fan.first} brings the whole family and the story goes around the building for weeks.', effects: [{ money: -200 }, { pop: 0.9 }, { conf: 3 }, { fatigue: 3 }] },
      { id: 'brush_off', label: 'Smile, nod and keep walking', risk: 'low', result: 'You are late, tired and ready to go. The smile is real and brief.', effects: [{ fatigue: -2 }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'life_leg_memorabilia', category: 'legacy', title: 'Where Your Memorabilia Goes', weight: 1.5, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 10,
    trigger: { any: [{ stat: { titleWins: { gte: 1 } } }, { stat: { careerYears: { gte: 8 } } }] },
    slots: { item: ['worn jacket', 'first pair of boots', 'ring-worn robe', 'replica strap'], buyer: ['A private collector', 'A museum curator', 'An auction house', 'A fan who saved for years'] },
    body: ['{buyer} has come asking about your {item}. The offer is real, the story it carries is valuable, and you have to decide where it belongs.', 'Once it is gone, it is gone. Memories tend to attach themselves to objects, and so do their prices.'],
    choices: [
      { id: 'sell_high', label: 'Sell to the highest bidder', risk: 'low', result: 'The check is solid and the item vanishes into a case. You tell yourself you will not miss it.', effects: [{ money: 14000 }, { conf: -1 }] },
      { id: 'donate', label: 'Donate it to a museum exhibit', risk: 'low', result: 'It goes on public display with a small plaque. The press is kind and your accountant is not.', effects: [{ pop: 0.6 }, { conf: 3 }, { money: -500 }] },
      { id: 'fan', label: 'Give it to a fan who truly wants it', risk: 'med', outcomes: [
        { weight: 3, text: 'The fan\'s face does something you will not forget. The story spreads, and your reputation grows.', effects: [{ pop: 1.1 }, { conf: 4 }] },
        { weight: 1, text: 'A week later it turns up on a dealer\'s table at a collectors\' convention. The sentiment is spoiled, and you hear about it.', effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
      { id: 'keep', label: 'Keep it for yourself and your family', risk: 'low', result: 'You keep it in a closet, wrapped in a towel. Nobody else will see it, but you will.', effects: [{ conf: 2 }, { money: -100 }] },
    ],
  },
  // ======================= FINANCE =======================
  {
    id: 'life_fin_tax_bill', category: 'finance', title: 'The Tax Bill: {problem}', weight: 2, cooldownDays: 300, maxPerCareer: 3, categoryCooldown: 10,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { month: [3, 4], stat: { money: { gte: 3000 }, careerYears: { gte: 1 } } },
    slots: { problem: ['an unfiled quarterly payment', 'a missing folder of receipts', 'a state you forgot you worked in', 'returns your last accountant never filed'], size: ['a modest bill', 'a hefty bill', 'a bill padded with penalties', 'a bill and a surprise audit letter'] },
    body: ['The letter is about {problem}, and it ends with {size}. {agent.name} reads it twice and puts it down very gently.', 'Wrestlers cross a lot of borders and invoice a lot of people, and the paperwork rarely keeps up. You can pay, haggle or hope.'],
    choices: [
      { id: 'pay', label: 'Pay in full and sleep well', risk: 'low', requires: { stat: { money: { gte: 8000 } } }, result: 'It hurts to watch the number drop, and it is over. You know exactly where you stand.', effects: [{ money: -8000 }, { conf: 2 }, { fatigue: -3 }] },
      { id: 'plan', label: 'Arrange a payment plan', risk: 'low', result: 'Smaller payments over months, with interest. It keeps the cash flowing and the stress present.', effects: [{ money: -3200 }, { conf: -1 }, { fatigue: 2 }] },
      { id: 'dispute', label: 'Hire an accountant and dispute the figure', risk: 'med', requires: { stat: { money: { gte: 1200 } } }, outcomes: [
        { weight: 2, bonus: { confidence: 0.3 }, text: 'The accountant finds three deductions and a clerical error. The bill falls by half.', effects: [{ money: -4200 }, { conf: 3 }] },
        { weight: 2, text: 'The dispute drags on and the final figure barely moves. You pay the accountant on top of the bill.', effects: [{ money: -10500 }, { conf: -3 }, { fatigue: 4 }] } ] },
      { id: 'ignore', label: 'Stuff the letter in a drawer', risk: 'high', outcomes: [
        { weight: 1, text: 'A clerk lets it slide for a while. The bill grows quietly in the dark.', effects: [{ money: -2000 }, { conf: 1 }] },
        { weight: 2, text: 'Penalties stack up and a second letter arrives with a sterner tone.', effects: [{ money: -14000 }, { conf: -4 }, { fatigue: 5 }] } ] },
    ],
  },
  {
    id: 'life_fin_house_vs_save', category: 'finance', title: 'A House or a Nest Egg', weight: 2, major: true, cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 15,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { stat: { money: { gte: 25000 }, popularity: { gte: 30 } } },
    slots: { house: ['a starter bungalow', 'a farmhouse near the interstate', 'a condo by the airport', 'a house in your hometown'], market: ['a seller\'s market', 'a quiet market', 'a sudden rate drop', 'a rate spike that scared everyone'] },
    body: ['You have found {house}, and {agent.name} says the timing is {market}. It is the first thing you have wanted that is not part of the job.', 'Every road warrior eventually asks where home is. The answer is rarely cheap, and the money has other claims.'],
    choices: [
      { id: 'buy', label: 'Buy the house outright', risk: 'med', requires: { stat: { money: { gte: 30000 } } }, result: 'You sign and get keys. For the first time in years, your suitcase has a closet.', effects: [{ money: -30000 }, { conf: 5 }, { fatigue: -10 }] },
      { id: 'mortgage', label: 'Buy it with a mortgage and keep a cushion', risk: 'med', result: 'A smaller down payment, a monthly bill, and the gift of a front door. You will feel the payment every month.', effects: [{ money: -9000 }, { conf: 4 }, { fatigue: -6 }] },
      { id: 'invest', label: 'Skip the house and invest the money', risk: 'high', outcomes: [
        { weight: 2, text: 'The account grows slowly and surely. You will be glad of it in ten years.', effects: [{ money: 7000 }, { conf: 1 }] },
        { weight: 1, text: 'The market turns against you and the account shrinks.', effects: [{ money: -6000 }, { conf: -3 }] } ] },
      { id: 'family', label: 'Use the money to help your family first', risk: 'low', result: 'You pay off a debt and fix a roof for people who never asked. The hole in your savings is exactly the size of the relief on their faces.', effects: [{ money: -14000 }, { conf: 4 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'life_fin_sponsorship', category: 'finance', title: 'A Sponsor Wants You: {product}', weight: 2, cooldownDays: 150, maxPerCareer: 4, categoryCooldown: 8,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { stat: { popularity: { gte: 40 } } },
    slots: { product: ['a soft-drink company', 'a gym chain', 'a boot company', 'a regional truck dealership'], terms: ['a flat fee', 'a bonus per appearance', 'free product and a smaller fee', 'a cut of sales'] },
    body: ['The offer from {product} is on the table: {terms}, in exchange for your face and some of your time. {agent.name} thinks it is a decent deal, and also thinks you should read the small print.', 'Brand deals pay now and ask questions later. The audience can smell a sellout, and the audience can smell a bargain too.'],
    choices: [
      { id: 'exclusive', label: 'Sign the exclusive deal', risk: 'med', result: 'You sign and wear the logo wherever you go. The money is good, the freedom is lower, and some fans grumble.', effects: [{ money: 14000 }, { pop: -0.3 }, { fatigue: 4 }] },
      { id: 'negotiate', label: 'Negotiate better terms', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, popularity: 0.3 }, text: '{agent.name} pushes and the sponsor adds a bit more. You sign a better contract than the one offered.', effects: [{ money: 19000 }, { conf: 3 }, { fatigue: 4 }] },
        { weight: 1, text: 'The sponsor pulls the offer and moves on to someone cheaper.', effects: [{ conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'local', label: 'Pick a smaller local partner you believe in', risk: 'low', result: 'A family business with a handshake deal and a fan base of neighbors. The money is smaller and the goodwill is bigger.', effects: [{ money: 4500 }, { pop: 0.6 }, { conf: 2 }] },
      { id: 'refuse', label: 'Refuse and keep your brand clean', risk: 'low', result: 'You say no and keep your image to yourself. The fans appreciate it; your bank balance does not.', effects: [{ pop: 0.4 }, { conf: 2 }] },
    ],
  },
  {
    id: 'life_fin_friend_loan', category: 'finance', title: 'A Colleague Needs Money for {reason}', weight: 1.5, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 10,
    cast: { friend: { pick: 'roster', tier: { lte: 2 } } },
    trigger: { stat: { money: { gte: 5000 } } },
    slots: { reason: ['a medical bill', 'a failed business', 'a car repair', 'a wedding'], ask: ['a few thousand', 'whatever you can spare', 'a one-time loan', 'an open-ended favor'] },
    body: ['{friend.name} pulls you aside and asks for {ask}. The money is for {reason}, {friend.they} explains, and {friend.their} voice is steadier than {friend.their} face.', 'Money and the locker room rarely mix cleanly. You can say yes, no, or something in between, and each one will cost you.'],
    choices: [
      { id: 'lend', label: 'Lend the full amount, no questions', risk: 'med', requires: { stat: { money: { gte: 4000 } } }, outcomes: [
        { weight: 2, text: '{friend.first} pays back part of it within months and swears the rest is coming. The trust between you deepens.', effects: [{ money: -2500 }, { rel: { who: 'friend', trust: 8, respect: 4, affinity: 6 } }, { conf: 2 }] },
        { weight: 1, text: 'The money vanishes into the same problem that started it. {friend.first} becomes hard to find.', effects: [{ money: -4000 }, { rel: { who: 'friend', trust: -4 } }, { conf: -2 }] } ] },
      { id: 'gift', label: 'Give a smaller sum as a gift', risk: 'low', requires: { stat: { money: { gte: 1000 } } }, result: 'You give what you can spare and make it clear there is no loan. {friend.first} nods, relieved and a little proud.', effects: [{ money: -1000 }, { rel: { who: 'friend', respect: 4, affinity: 4 } }] },
      { id: 'terms', label: 'Offer a loan with written terms', risk: 'low', result: 'It feels cold, and it is safe. {friend.first} signs and the money moves, though things between you are a notch more formal.', effects: [{ money: -2000 }, { rel: { who: 'friend', trust: 2, affinity: -3 } }, { conf: 1 }] },
      { id: 'decline', label: 'Say no kindly and offer other help', risk: 'low', result: 'You offer to make introductions and write a reference instead. {friend.first} says thanks and means about half of it.', effects: [{ rel: { who: 'friend', affinity: -4, respect: 1 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'life_fin_broke', category: 'finance', title: '{crisis} and an Empty Account', weight: 2, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 8,
    cast: { gm: { pick: 'staff', role: 'gm' } },
    trigger: { stat: { money: { lte: 3000 }, careerYears: { gte: 1 } } },
    slots: { crisis: ['A broken transmission', 'An overdue rent notice', 'A cancelled card', 'A surprise vet bill'], secret: ['a stack of unopened envelopes', 'a quiet fear you tell no one', 'a lie to your family about how it is going', 'a pawn ticket for your watch'] },
    body: ['{crisis} has landed at the worst possible time, and you are holding {secret}. The bank balance reads a number you did not know it could reach.', '{gm.name} might help if asked. "My door is always open," {gm.first} tells everyone, and few people ever walk through it. Asking is the hard part.'],
    choices: [
      { id: 'extra_dates', label: 'Pick up every extra date you can', risk: 'med', outcomes: [
        { weight: 3, bonus: { fatigue: -0.5 }, text: 'The extra dates are rough and the pay is real. You get back to the black column in three weeks.', effects: [{ money: 5500 }, { fatigue: 12 }, { pop: 0.2 }] },
        { weight: 1, text: 'You take one date too many and your body picks a bad moment to say no.', effects: [{ money: 2500 }, { fatigue: 14 }, { injury: { part: 'torso', severity: 1, days: 10 } }] } ] },
      { id: 'advance', label: 'Ask {gm.name} for a salary advance', risk: 'med', outcomes: [
        { weight: 2, text: '{gm.name} approves it with a lecture about budgeting. You take both.', effects: [{ money: 4000 }, { conf: -2 }] },
        { weight: 1, text: '{gm.name} says it is against policy, in a tone that suggests the policy is not the only reason.', effects: [{ conf: -3 }, { pop: -0.1 }] } ] },
      { id: 'sell', label: 'Sell something you own', risk: 'low', result: 'It is a small loss with a large relief. You lose a piece of your past and gain a month.', effects: [{ money: 3500 }, { conf: -1 }] },
      { id: 'trim', label: 'Cut every expense and live lean', risk: 'low', result: 'Boxed lunches, no extras, a lot of motel microwaves. It builds a habit that serves you later.', effects: [{ money: 1500 }, { fatigue: 4 }, { conf: 2 }] },
    ],
  },
  {
    id: 'life_fin_investment_pitch', category: 'finance', title: 'A Business Pitch {pitch}', weight: 1.5, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 10,
    cast: { vet: { pick: 'roster', tier: { gte: 2 } } },
    trigger: { stat: { money: { gte: 9000 }, careerYears: { gte: 2 } } },
    slots: { pitch: ['over steaks', 'in a hotel bar', 'after the show', 'during a long car ride'], venture: ['a gym franchise', 'a food truck', 'a clothing line', 'a rental-property partnership'] },
    body: ['{vet.name} brings it up {pitch}: a chance to buy into {venture}. {vet.they} has done the math on a napkin and cannot stop smiling.', 'Wrestlers are natural targets for pitches, and sometimes natural targets for good ones. The trick is to tell them apart.'],
    choices: [
      { id: 'all_in', label: 'Go all in on the venture', risk: 'high', requires: { stat: { money: { gte: 9000 } } }, outcomes: [
        { weight: 1, text: 'The venture thrives. Within a year the check is triple and the friendship is stronger.', effects: [{ money: 25000 }, { rel: { who: 'vet', respect: 5, trust: 5 } }, { conf: 4 }] },
        { weight: 2, text: 'The venture is badly managed and closes. You lose most of the stake, and the relationship takes a bruise.', effects: [{ money: -9000 }, { rel: { who: 'vet', trust: -4 } }, { conf: -4 }] } ] },
      { id: 'small_stake', label: 'Invest a small, affordable stake', risk: 'med', outcomes: [
        { weight: 2, text: 'It breaks even and pays a small dividend. You learned a lot for a modest price.', effects: [{ money: 1200 }, { rel: { who: 'vet', respect: 2 } }] },
        { weight: 1, text: 'The venture fails quietly. The loss is small and survivable.', effects: [{ money: -2000 }] } ] },
      { id: 'audit', label: 'Insist on seeing the books first', risk: 'low', result: 'The books are thinner than the pitch, and {vet.first} gets annoyed when you say so. You decline with a thank-you.', effects: [{ rel: { who: 'vet', respect: 1, trust: -2 } }, { conf: 2 }, { money: -200 }] },
      { id: 'decline', label: 'Thank {vet.first} and decline', risk: 'low', result: 'You stay out. It is probably the wise decision and certainly the dull one.', effects: [{ conf: 1 }] },
    ],
  },
  {
    id: 'life_fin_agent_cut', category: 'finance', title: 'Is Your Agent Worth {cut}?', weight: 1.5, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 10,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { stat: { popularity: { gte: 35 }, careerYears: { gte: 2 } } },
    slots: { cut: ['10 percent', '15 percent', '20 percent', 'a growing slice'], event: ['a missed deal', 'a rival agency\'s pitch', 'a glowing reference for a rival agent', 'a long silence on your calls'] },
    body: ['{agent.name} takes {cut} of what you make, and after {event} you cannot stop running the numbers. The question is not whether the deals are good but whether you would have gotten them anyway.', 'Good representation can double a career. Bad representation can quietly halve one.'],
    choices: [
      { id: 'stay', label: 'Stay and ask for better service', risk: 'low', result: '{agent.name} hears the message and tightens the follow-up. Things improve, for a while.', effects: [{ conf: 1 }, { money: 800 }] },
      { id: 'renegotiate', label: 'Renegotiate the percentage', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: '{agent.name} blinks and drops the rate. You save real money and gain a little leverage.', effects: [{ money: 3000 }, { conf: 3 }] },
        { weight: 1, text: '{agent.name} takes it personally. For weeks, the calls are less urgent.', effects: [{ money: -500 }, { conf: -2 }, { pop: -0.2 }] } ] },
      { id: 'switch', label: 'Switch to a rival agency', risk: 'high', outcomes: [
        { weight: 2, bonus: { popularity: 0.5 }, text: 'The new agency lands two meetings in the first week. The change pays off.', effects: [{ money: 5500 }, { conf: 3 }, { pop: 0.2 }] },
        { weight: 2, text: 'The new agency is disorganized. You lose a few weeks and a good relationship.', effects: [{ money: -2000 }, { conf: -3 }] } ] },
      { id: 'go_solo', label: 'Handle your own deals for a while', risk: 'high', result: 'You learn every clause by heart and every email by hand. It saves a percentage and costs you evenings.', effects: [{ money: 2500 }, { fatigue: 8 }, { attr: { name: 'psychology', delta: 1 } }] },
    ],
  },
  {
    id: 'life_fin_car', category: 'finance', title: 'Time for New Wheels', weight: 1.5, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 10,
    trigger: { stat: { money: { gte: 12000 } } },
    slots: { car: ['restored classic', 'reliable truck', 'luxury sedan', 'used van with room for gear'], reason: ['a long-haul tour', 'a reward for a hard year', 'a dead engine in the old one', 'a friend who just bought one'] },
    body: ['You have been looking at a {car}, and the reason is {reason}. The dealer smiles with a very friendly kind of patience.', 'Cars are tools, treats and status in this business. Which one you pick says something, and so does what you spend.'],
    choices: [
      { id: 'splurge', label: 'Splurge on the one you actually want', risk: 'med', requires: { stat: { money: { gte: 14000 } } }, result: 'You drive it off the lot with the windows down. It is wonderful, and it will be a monthly reminder of the price.', effects: [{ money: -13000 }, { conf: 5 }, { pop: 0.3 }] },
      { id: 'practical', label: 'Buy a sensible used model', risk: 'low', result: 'It runs. It has a stain on the passenger seat. It is a perfectly fine car, and you move on with the account intact.', effects: [{ money: -4500 }, { conf: 1 }, { fatigue: -2 }] },
      { id: 'keep_old', label: 'Keep the old one and fix it up', risk: 'med', outcomes: [
        { weight: 2, text: 'A new set of tires and a good mechanic buy you another year. You save a lot.', effects: [{ money: -900 }, { conf: 1 }] },
        { weight: 1, text: 'It breaks down on the road to a show, and the tow costs more than the repair.', effects: [{ money: -2200 }, { fatigue: 7 }, { conf: -2 }] } ] },
      { id: 'lease_hire', label: 'Skip the car and hire a driver for tours', risk: 'low', result: 'A driver takes the long hauls and you sleep in the back. It costs a recurring fee and saves your back.', effects: [{ money: -3000 }, { fatigue: -9 }, { conf: 1 }] },
    ],
  },
  // ======================= TRAINING =======================
  {
    id: 'life_trn_montage', category: 'training', title: 'A Training Block at {place}', weight: 2.5, cooldownDays: 60, maxPerCareer: 6, categoryCooldown: 6,
    trigger: { stat: { fatigue: { lte: 65 } } },
    slots: { place: ['a mountain trail', 'a boxing gym', 'a rented ring', 'a lakeside track'], focus: ['strength', 'speed', 'flexibility', 'mental sharpness'] },
    body: ['You have two free weeks and a plan for {place}: a block built around {focus}. The program sits on the fridge door in blue marker.', 'Training blocks reward consistency and punish overreach. What you work on shapes who you will be in the ring next month.'],
    choices: [
      { id: 'strength', label: 'Lift heavy and eat for size', risk: 'low', result: 'The plates get heavier and so does your presence in the ring. Your joints grumble about it.', effects: [{ attr: { name: 'power', delta: 1 } }, { fatigue: 10 }, { money: -300 }] },
      { id: 'speed', label: 'Work agility, plyometrics and footwork', risk: 'med', outcomes: [
        { weight: 3, bonus: { fatigue: -0.4 }, text: 'You feel quicker and lighter by the end of the block. The ring feels smaller.', effects: [{ attr: { name: 'agility', delta: 1 } }, { fatigue: 9 }] },
        { weight: 1, text: 'You tweak a hamstring on the last day. The gains are real, so is the strain.', effects: [{ attr: { name: 'agility', delta: 1 } }, { injury: { part: 'legs', severity: 1, days: 8 } }, { fatigue: 9 }] } ] },
      { id: 'technical', label: 'Study holds and transitions in slow motion', risk: 'low', result: 'It is not glamorous work. After two weeks your matches are sharper and quieter.', effects: [{ attr: { name: 'technical', delta: 1 } }, { fatigue: 5 }] },
      { id: 'mind', label: 'Work on psychology: reading crowds and pacing matches', risk: 'low', result: 'You rewatch your own tapes and mark spots where you lost the room. Next time you will see them coming.', effects: [{ attr: { name: 'psychology', delta: 1 } }, { fatigue: 3 }, { conf: 1 }] },
    ],
  },
  {
    id: 'life_trn_new_coach', category: 'training', title: 'A Coach with a {style} Approach', weight: 2, cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 8,
    cast: { coach: { pick: 'staff', role: 'coach' } },
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { style: ['traditional', 'science-heavy', 'storytelling-first', 'hard-conditioning'], offer: ['a three-month plan', 'a one-week trial', 'a private contract', 'a spot in a team program'] },
    body: ['{coach.name} has a {style} way of teaching and offers {offer}. Your current routine works, but you have wondered what you might be missing.', 'A change of coach can unlock a plateau or wreck a rhythm. It is a gamble with some data behind it.'],
    choices: [
      { id: 'adopt', label: 'Adopt the new approach completely', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.4, overall: 0.3 }, text: 'The method clicks with your body. Within weeks, you are better at things you did not know were weaknesses.', effects: [{ attr: { name: 'technical', delta: 1 } }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 8 }, { conf: 3 }] },
        { weight: 2, text: 'The new approach clashes with your instincts. You lose a month feeling clumsy.', effects: [{ fatigue: 8 }, { conf: -4 }, { pop: -0.2 }] } ] },
      { id: 'hybrid', label: 'Blend the new ideas into your own routine', risk: 'low', result: 'You borrow what works and drop what does not. The result is slower but steadier.', effects: [{ attr: { name: 'endurance', delta: 1 } }, { fatigue: 4 }, { conf: 1 }] },
      { id: 'trial', label: 'Try one session and evaluate honestly', risk: 'low', result: 'One session is enough to see its strengths and quirks. You walk away with two exercises and a note of thanks.', effects: [{ fatigue: 2 }, { conf: 1 }, { money: -150 }] },
      { id: 'refuse', label: 'Politely decline and stay with what works', risk: 'low', result: 'You thank {coach.first} and go back to your regular routine. The path is comfortable, and so is the risk of staying the same.', effects: [{ conf: 1 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'life_trn_sparring', category: 'training', title: 'Sparring with {type}', weight: 2, cooldownDays: 90, maxPerCareer: 4, categoryCooldown: 6,
    cast: { partner: { pick: 'roster', tier: { lte: 3 } } },
    trigger: { stat: { careerYears: { gte: 1 }, fatigue: { lte: 70 } }, injured: false },
    slots: { type: ['a bigger opponent', 'a faster opponent', 'a smarter opponent', 'a stubborn veteran'], setting: ['the ring at dawn', 'a rented gym', 'the arena before doors', 'a backyard ring'] },
    body: ['{partner.name} offers to work with you in {setting}, and the match-up is {type}. "Do not hold back," {partner.they} says. The sparring will not be on television, and it will be more honest than most of what is.', 'Anyone can look good in front of a crowd. Behind closed doors you can learn what you actually are.'],
    choices: [
      { id: 'hard', label: 'Spar hard and accept the bruises', risk: 'med', outcomes: [
        { weight: 3, bonus: { fatigue: -0.4 }, text: 'You exchange punches, holds and respect. You are a better wrestler by the end.', effects: [{ attr: { name: 'toughness', delta: 1 } }, { rel: { who: 'partner', respect: 5 } }, { fatigue: 10 }, { conf: 2 }] },
        { weight: 1, text: 'A move goes slightly wrong and you take a hit you did not need.', effects: [{ rel: { who: 'partner', respect: 2 } }, { injury: { part: 'arms', severity: 1, days: 9 } }, { fatigue: 10 }] } ] },
      { id: 'light', label: 'Keep it light and concentrate on technique', risk: 'low', result: 'You trade holds, swap notes and finish with a handshake. It is steady, useful and uneventful.', effects: [{ attr: { name: 'technical', delta: 1 } }, { rel: { who: 'partner', affinity: 3 } }, { fatigue: 4 }] },
      { id: 'ask_notes', label: 'Ask {partner.first} to pick apart your game', risk: 'med', outcomes: [
        { weight: 2, text: '{partner.first} is blunt and correct. The notes sting and then help.', effects: [{ attr: { name: 'psychology', delta: 1 } }, { rel: { who: 'partner', respect: 4, trust: 3 } }, { conf: -1 }, { fatigue: 4 }] },
        { weight: 1, text: '{partner.first} is blunt and wrong. You waste a week fixing a problem you did not have.', effects: [{ conf: -2 }, { fatigue: 4 }] } ] },
      { id: 'skip', label: 'Cancel and rest', risk: 'low', result: 'You bow out politely. {partner.first} shrugs, and the offer will be there next time, probably.', effects: [{ fatigue: -7 }, { rel: { who: 'partner', respect: -1 } }] },
    ],
  },
  {
    id: 'life_trn_video_study', category: 'training', title: 'A Study Session with {tapes}', weight: 1.5, cooldownDays: 80, maxPerCareer: 4, categoryCooldown: 6,
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { tapes: ['your own old matches', 'a legend\'s classics', 'footage of a rival', 'crowd reaction reels'], hours: ['an all-night session', 'a weekend binge', 'a week of lunch breaks', 'a single focused afternoon'] },
    body: ['You have set aside {hours} with {tapes}, a notebook and a marker. The first twenty minutes are fun and the rest is work.', 'There is a lot to learn from tape and a lot to hide in it. What you take from it depends on what you are ready to see.'],
    choices: [
      { id: 'notes', label: 'Take detailed notes and build a plan', risk: 'low', result: 'The notes become a checklist and the checklist becomes a habit. Your next matches show it.', effects: [{ attr: { name: 'psychology', delta: 1 } }, { fatigue: 5 }, { conf: 1 }] },
      { id: 'steal', label: 'Pick out moves to try in the ring', risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: 'You add two new spots that read well on camera. They feel like yours.', effects: [{ attr: { name: 'technical', delta: 1 } }, { pop: 0.3 }, { fatigue: 5 }] },
        { weight: 1, text: 'The new spots look good on paper and clunky live. You drop them within a week.', effects: [{ conf: -2 }, { fatigue: 5 }] } ] },
      { id: 'self_critique', label: 'Watch your own mistakes without flinching', risk: 'med', result: 'You count every miss and find a pattern. It feels bad, and next week it feels better.', effects: [{ conf: -2 }, { attr: { name: 'psychology', delta: 1 } }, { attr: { name: 'technical', delta: 1 } }, { fatigue: 4 }] },
      { id: 'sleep', label: 'Skip the study and sleep instead', risk: 'low', result: 'Some nights your best training is a pillow. You wake up feeling like a person.', effects: [{ fatigue: -9 }, { conf: 1 }] },
    ],
  },
  {
    id: 'life_trn_cross_train', category: 'training', title: 'Cross-Training in {discipline}', weight: 1.5, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 8,
    trigger: { stat: { careerYears: { gte: 1 }, money: { gte: 400 } } },
    slots: { discipline: ['boxing', 'judo', 'gymnastics', 'yoga'], teacher: ['a retired champion', 'a local gym owner', 'a friend of a friend', 'a stern instructor'] },
    body: ['A short course in {discipline} appeals to you, taught by {teacher}. It is outside the usual wrestling world and that is the point.', 'Many wrestlers pick up new tools in strange places. It will take a few weeks and a little of your pride.'],
    choices: [
      { id: 'full_course', label: 'Sign up for the full course', risk: 'med', requires: { stat: { money: { gte: 1200 } } }, outcomes: [
        { weight: 3, bonus: { fatigue: -0.3 }, text: 'You absorb the lessons and bring them back to the ring. Your moves look different in a good way.', effects: [{ money: -1200 }, { attr: { name: 'grappling', delta: 1 } }, { attr: { name: 'agility', delta: 1 } }, { fatigue: 8 }, { conf: 3 }] },
        { weight: 1, text: 'The course is more demanding than expected. You limp through, and the gains are modest.', effects: [{ money: -1200 }, { attr: { name: 'grappling', delta: 1 } }, { fatigue: 12 }] } ] },
      { id: 'trial_class', label: 'Take a single class and see', risk: 'low', result: 'One session, a handful of new ideas and sore muscles you did not know you had.', effects: [{ money: -100 }, { attr: { name: 'agility', delta: 1 } }, { fatigue: 3 }] },
      { id: 'invite', label: 'Invite the instructor to the wrestling gym', risk: 'med', result: 'The instructor wanders into your world for an afternoon. Both sides learn, and one side laughs a lot.', effects: [{ money: -300 }, { attr: { name: 'technical', delta: 1 } }, { conf: 2 }, { fatigue: 4 }] },
      { id: 'skip', label: 'Skip it and stick with the usual', risk: 'low', result: 'You put the pamphlet in a drawer. The usual routine is the usual routine.', effects: [{ fatigue: -2 }, { conf: 0 }, { money: 100 }] },
    ],
  },
  {
    id: 'life_trn_plateau', category: 'training', title: 'The Plateau: {sign}', weight: 2, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 8,
    cast: { coach: { pick: 'staff', role: 'coach' } },
    trigger: { stat: { careerYears: { gte: 2 }, matches: { gte: 20 } } },
    slots: { sign: ['the same drills every week', 'a flat feeling in the ring', 'a stretch of months without a new idea', 'a week where nothing felt like progress'], reaction: ['boredom', 'irritation', 'panic', 'quiet resignation'] },
    body: ['It is {sign}, and the feeling that follows is {reaction}. You are not getting worse, which is almost worse, because you are not getting better either.', '{coach.name} noticed before you did. A plateau is a signal, and the signal is not subtle.'],
    choices: [
      { id: 'shake_up', label: 'Overhaul your routine from scratch', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: 'New drills, a new schedule and a new playlist. Within a month you notice a bump in every number.', effects: [{ attr: { name: 'technical', delta: 1 } }, { attr: { name: 'endurance', delta: 1 } }, { fatigue: 10 }, { conf: 3 }] },
        { weight: 2, text: 'The overhaul is a mess. You drop good habits along with bad ones.', effects: [{ fatigue: 10 }, { conf: -3 }] } ] },
      { id: 'feedback', label: 'Ask {coach.name} for brutal feedback', risk: 'med', result: 'The list is four items long and every item is right. It stings for a day and then clears the path.', effects: [{ conf: -2 }, { attr: { name: 'psychology', delta: 1 } }, { attr: { name: 'technical', delta: 1 } }, { fatigue: 3 }] },
      { id: 'rest_week', label: 'Take a week off and come back fresh', risk: 'low', result: 'You do almost nothing. When you return, the drills feel new again.', effects: [{ fatigue: -13 }, { conf: 1 }, { pop: -0.2 }] },
      { id: 'travel_train', label: 'Visit another gym for a week', risk: 'med', requires: { stat: { money: { gte: 800 } } }, result: 'A different ring, different faces and a different set of rules. You return with notebooks full of ideas.', effects: [{ money: -800 }, { attr: { name: 'grappling', delta: 1 } }, { fatigue: 6 }, { conf: 2 }] },
    ],
  },
  {
    id: 'life_trn_gear', category: 'training', title: 'Building a {equipment} at Home', weight: 1, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 8,
    trigger: { stat: { money: { gte: 3000 }, careerYears: { gte: 2 } } },
    slots: { equipment: ['squat rack', 'practice ring', 'recovery pool', 'video-analysis corner'], budget: ['a tight budget', 'a loose budget', 'a surprise bonus', 'a year of savings'] },
    body: ['The idea of a {equipment} at home keeps coming back, and you have {budget} to do it with. The garage is big enough, barely.', 'Having the gear within reach changes habits. It also changes the bank account.'],
    choices: [
      { id: 'premium', label: 'Buy the best version you can find', risk: 'med', requires: { stat: { money: { gte: 5000 } } }, result: 'It arrives in boxes and takes a weekend to assemble. It also becomes the center of your week.', effects: [{ money: -5000 }, { attr: { name: 'power', delta: 1 } }, { attr: { name: 'technical', delta: 1 } }, { conf: 3 }, { fatigue: 5 }] },
      { id: 'budget', label: 'Build a budget version yourself', risk: 'low', result: 'Lumber, bolts and a borrowed drill. It wobbles and it works.', effects: [{ money: -900 }, { attr: { name: 'endurance', delta: 1 } }, { fatigue: 6 }, { conf: 1 }] },
      { id: 'gym_membership', label: 'Skip the build and pay for a top gym', risk: 'low', result: 'The gym is clean and stocked. It also takes a slice of your income every month.', effects: [{ money: -1500 }, { attr: { name: 'toughness', delta: 1 } }, { fatigue: 3 }] },
      { id: 'save', label: 'Save the money for something else', risk: 'low', result: 'You close the catalog and leave the garage as it was. It stays full of boxes and good intentions.', effects: [{ conf: 0 }, { fatigue: -2 }] },
    ],
  },
  // ======================= TRAVEL =======================
  {
    id: 'life_trv_tour_fatigue', category: 'travel', title: 'The Road Wears You Down: {leg}', weight: 2.5, cooldownDays: 60, maxPerCareer: 5, categoryCooldown: 6,
    trigger: { stat: { fatigue: { gte: 55 } } },
    slots: { leg: ['a six-city swing', 'a back-to-back weekend', 'a red-eye hop', 'a month of buses'], toll: ['a sore back', 'a foggy head', 'a short temper', 'a lost sense of time'] },
    body: ['You are deep into {leg}, and the toll is {toll}. Every hotel room is the same room, and every arena has the same smell of popcorn and floor wax.', 'The schedule is not going to bend by itself. If you want to come out the other side in one piece, you will need to make a call.'],
    choices: [
      { id: 'push', label: 'Push through and finish the run', risk: 'high', outcomes: [
        { weight: 2, bonus: { fatigue: -0.5, confidence: 0.3 }, text: 'You keep every date and nobody can tell what it cost. You collapse into the couch for a day after.', effects: [{ money: 3500 }, { pop: 0.3 }, { fatigue: 12 }] },
        { weight: 2, text: 'On the last weekend you mistime a landing and come down awkwardly. You finish the run but pay for it later.', effects: [{ money: 3500 }, { injury: { part: 'legs', severity: 1, days: 12 } }, { fatigue: 14 }, { conf: -3 }] } ] },
      { id: 'trim_dates', label: 'Ask to skip two dates', risk: 'med', result: 'The office grumbles and then agrees. You gain two nights of sleep and lose two nights of pay.', effects: [{ fatigue: -12 }, { money: -1800 }, { pop: -0.2 }] },
      { id: 'upgrade_travel', label: 'Pay for a better hotel and a direct flight', risk: 'low', requires: { stat: { money: { gte: 1000 } } }, result: 'You trade money for rest. A quiet room and a straight line between two cities feel like a luxury.', effects: [{ money: -1000 }, { fatigue: -8 }, { conf: 1 }] },
      { id: 'carpool', label: 'Share rides and rest on the move', risk: 'low', result: 'You ride with two other wrestlers and sleep on the way. It is cheap and cramped and the stories are good.', effects: [{ fatigue: -4 }, { money: 200 }, { conf: 1 }] },
    ],
  },
  {
    id: 'life_trv_international_tour', category: 'travel', title: 'Wrestling Overseas: {tour}', weight: 2, major: true, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 12,
    cast: { gm: { pick: 'staff', role: 'gm' } },
    trigger: { minYear: 1990, stat: { popularity: { gte: 30 }, careerYears: { gte: 1 } } },
    slots: { tour: ['an Asian tour', 'a European swing', 'an Australian run', 'a Latin American loop'], crowd: ['loud and generous', 'reserved but attentive', 'curious about a visitor', 'wary of outsiders'] },
    body: ['{gm.name} has you on {tour}. You expect the crowds to be {crowd}, and you are right about half of it.', 'New cities mean new food, new rules and new ways to be misunderstood. It is also a chance to grow a fan base from scratch.'],
    choices: [
      { id: 'embrace', label: 'Embrace the local style and learn from it', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.4, confidence: 0.3 }, text: 'You adapt, borrow and give back. By the end of the tour, local fans are chanting your name phonetically.', effects: [{ pop: 1.1 }, { attr: { name: 'technical', delta: 1 } }, { fatigue: 8 }, { conf: 3 }] },
        { weight: 1, text: 'You try too hard to fit in and lose some of what made you distinct. The crowds are polite.', effects: [{ pop: 0.1 }, { fatigue: 8 }, { conf: -2 }] } ] },
      { id: 'stick', label: 'Stick to your routine and your own style', risk: 'low', result: 'You do what you do, as well as you do it. It works, and the tour is a steady success without surprises.', effects: [{ pop: 0.5 }, { fatigue: 5 }, { conf: 2 }] },
      { id: 'learn_language', label: 'Spend evenings learning phrases to use in promos', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5 }, text: 'Your two sentences in the local language get a roar. The clip travels back home.', effects: [{ pop: 1.4 }, { mic: 1 }, { fatigue: 7 }] },
        { weight: 1, text: 'You mispronounce one word and the crowd laughs, kindly. You pretend it was on purpose.', effects: [{ pop: 0.3 }, { conf: -1 }, { fatigue: 7 }] } ] },
      { id: 'tourist', label: 'Spend your days off exploring the city', risk: 'low', result: 'You eat strange food, walk for hours and take too many photographs. The tour is more memorable than productive.', effects: [{ fatigue: -6 }, { money: -700 }, { conf: 3 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'life_trv_missed_flight', category: 'travel', title: 'Stranded by {cause}', weight: 2, cooldownDays: 80, maxPerCareer: 4, categoryCooldown: 6,
    cast: { producer: { pick: 'staff', role: 'producer' } },
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { cause: ['a storm', 'a mechanical delay', 'a wrong-gate mix-up', 'a cancelled connection'], stakes: ['a television taping', 'a house show', 'a title match', 'a signing'] },
    body: ['Because of {cause}, you are stuck in an airport with {stakes} in nine hours. {producer.name} is on the phone, and the voice on the line has already stopped being friendly.', 'Rebooking is a maze, the rental counters are empty and the departure board does not care about your problems.'],
    choices: [
      { id: 'drive', label: 'Rent a car and drive through the night', risk: 'med', outcomes: [
        { weight: 3, bonus: { fatigue: -0.4 }, text: 'You make it with forty minutes to spare. {producer.name} slaps your back and hands you coffee.', effects: [{ pop: 0.3 }, { fatigue: 12 }, { conf: 3 }, { money: -500 }] },
        { weight: 1, text: 'A wrong turn and a late fuel stop put you in the building as the opening bell rings. The spot is already given away.', effects: [{ pop: -0.4 }, { fatigue: 12 }, { money: -500 }, { conf: -3 }] } ] },
      { id: 'charter', label: 'Pay for a charter or a pricey last-minute ticket', risk: 'low', requires: { stat: { money: { gte: 2500 } } }, result: 'Expensive, quick and slightly embarrassing. You arrive in a fresh shirt and a lot less money.', effects: [{ money: -2500 }, { fatigue: -2 }, { conf: 2 }] },
      { id: 'tell_truth', label: 'Tell {producer.name} you cannot make it', risk: 'low', result: '{producer.name} swears, rebooks, and moves on. The office remembers you as the person who called early.', effects: [{ pop: -0.5 }, { conf: -1 }, { fatigue: -2 }] },
      { id: 'creative_route', label: 'Beg another traveler to share a ride', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.6 }, text: 'A stranger turns out to be a fan with a pickup truck. You arrive laughing, with a new friend.', effects: [{ pop: 0.5 }, { fatigue: 7 }, { conf: 3 }] },
        { weight: 2, text: 'The ride falls through, then another does, and a day is lost. The show goes on without you.', effects: [{ pop: -0.6 }, { fatigue: 8 }, { conf: -3 }] } ] },
    ],
  },
  {
    id: 'life_trv_hometown_show', category: 'travel', title: 'A Night in Your Hometown', weight: 2, contexts: ['show_day'], cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 10,
    cast: { producer: { pick: 'staff', role: 'producer' } },
    trigger: { stat: { popularity: { gte: 25 }, careerYears: { gte: 1 } } },
    slots: { crowd: ['your old school classmates', 'your family', 'old rivals from the local circuit', 'a banner-waving fan club'], mood: ['homesick', 'proud', 'anxious', 'relieved'] },
    body: ['The tour has come to your hometown, and {crowd} will be in the building tonight. You feel {mood}, and the streets smell exactly the way they did when you left.', '{producer.name} has asked if you want anything special in the plan. It is a night that could become a legend, or a blur.'],
    choices: [
      { id: 'speech', label: 'Ask for a few minutes on the mic', risk: 'med', outcomes: [
        { weight: 3, bonus: { mic: 0.5, charisma: 0.4 }, text: 'You tell the crowd where you came from and where you hope to go. They get louder with each sentence.', effects: [{ pop: 1.5 }, { mic: 1 }, { conf: 5 }] },
        { weight: 1, text: 'The words come out too rehearsed. The hometown crowd is kind and unconvinced.', effects: [{ pop: 0.2 }, { conf: -2 }] } ] },
      { id: 'tickets', label: 'Buy tickets for everyone who helped you', risk: 'low', requires: { stat: { money: { gte: 800 } } }, result: 'Thirty seats, one big family section and a lot of hugging afterward. It is the best money you have ever spent.', effects: [{ money: -800 }, { pop: 0.5 }, { conf: 4 }, { fatigue: 2 }] },
      { id: 'quiet_work', label: 'Work the match normally and enjoy it', risk: 'low', result: 'No special moment, just a strong match in front of people who love you. It feels like a victory lap.', effects: [{ pop: 0.6 }, { conf: 3 }, { fatigue: 3 }] },
      { id: 'visit_after', label: 'Skip the after-party and visit your old gym', risk: 'low', result: 'The place is smaller than you remembered. An old coach pretends not to cry, and you pretend not to see.', effects: [{ conf: 4 }, { fatigue: 4 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'life_trv_van_ride', category: 'travel', title: 'A Long Ride: {drive}', weight: 1.5, cooldownDays: 60, maxPerCareer: 4, categoryCooldown: 6,
    trigger: { stat: { careerYears: { lte: 6 } } },
    slots: { drive: ['a six-hour night drive', 'a winding mountain route', 'a desert highway', 'a fog-bound crawl'], crew: ['two rookies', 'a veteran who snores', 'a chatty tag team', 'the usual crew'] },
    body: ['The ride tonight is {drive}, with {crew} along, and the radio has been stuck on one station for an hour. It is late, the coffee is cold, and the show is behind you.', '"Pick a station or I will," someone mutters from the back seat. Road trips give wrestlers time to talk, sleep, fight or plan, and tonight you can choose which.'],
    choices: [
      { id: 'drive', label: 'Take the wheel so others can sleep', risk: 'med', result: 'You earn gratitude and tired eyes. Your passengers wake up rested, and you do not.', effects: [{ fatigue: 9 }, { conf: 2 }, { pop: 0.1 }] },
      { id: 'talk_shop', label: 'Talk shop and dissect the show', risk: 'low', result: 'The conversation covers pacing, finishes and all the ways the main event could have gone better. By dawn you have a notebook of ideas.', effects: [{ attr: { name: 'psychology', delta: 1 } }, { fatigue: 3 }, { conf: 1 }] },
      { id: 'sleep', label: 'Curl up in the back and sleep', risk: 'low', result: 'You wake up three states later with a creased cheek and a rested body.', effects: [{ fatigue: -9 }] },
      { id: 'bond', label: 'Start a singalong and lift the mood', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: 'The whole van sings, loudly and badly. By morning you are friends.', effects: [{ conf: 3 }, { pop: 0.1 }, { fatigue: 3 }] },
        { weight: 1, text: 'Someone is not in the mood, and the singing sours into silence. The rest of the ride is quiet.', effects: [{ conf: -2 }, { fatigue: 3 }] } ] },
    ],
  },
  {
    id: 'life_trv_hotel_trouble', category: 'travel', title: 'Trouble at {hotel}', weight: 1.5, cooldownDays: 80, maxPerCareer: 4, categoryCooldown: 6,
    cast: { neighbor: { pick: 'roster', tier: { gte: 1 } } },
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { hotel: ['an airport hotel', 'a cheap roadside motel', 'a downtown tower', 'a hotel with a pool'], noise: ['an all-night party', 'a broken elevator', 'a leaking ceiling', 'a fire alarm at 3 a.m.'] },
    body: ['There is {noise} at {hotel}, and sleep is out of the question. {neighbor.name} is in the hallway, in a robe, looking about as happy as you are.', 'Hotel nights decide mood and form more than most fans would believe. You have a match in sixteen hours.'],
    choices: [
      { id: 'complain', label: 'Complain to the manager and demand a new room', risk: 'low', outcomes: [
        { weight: 2, text: 'You are moved to a quiet floor and handed a coupon. The night is not ruined after all.', effects: [{ fatigue: -4 }, { conf: 1 }] },
        { weight: 1, text: 'The hotel is full. The manager shrugs, you grumble, and you lie awake the rest of the night.', effects: [{ fatigue: 5 }, { conf: -1 }] } ] },
      { id: 'friend', label: 'Spend the night talking with {neighbor.first}', risk: 'low', result: 'You end up in the lobby with bad coffee and good stories. It is the kind of friendship that starts at 4 a.m.', effects: [{ rel: { who: 'neighbor', affinity: 6, respect: 3 } }, { fatigue: 4 }, { conf: 2 }] },
      { id: 'upgrade', label: 'Pay for a better hotel for the night', risk: 'low', requires: { stat: { money: { gte: 400 } } }, result: 'A taxi, a bright lobby and a firm mattress. You will hate the receipt in the morning.', effects: [{ money: -400 }, { fatigue: -6 }] },
      { id: 'tough_it_out', label: 'Ignore the noise and focus on the match', risk: 'med', outcomes: [
        { weight: 2, bonus: { fatigue: -0.4 }, text: 'You stretch, hydrate and use the sleepless hours to think through the match. The adrenaline carries you through.', effects: [{ fatigue: 7 }, { attr: { name: 'psychology', delta: 1 } }, { conf: 2 }] },
        { weight: 1, text: 'The next day is a haze. You make a clumsy error, and the clip is not flattering.', effects: [{ fatigue: 8 }, { pop: -0.3 }, { conf: -3 }] } ] },
    ],
  },
  {
    id: 'life_trv_airport_fan', category: 'travel', title: 'A Fan at {airport}', weight: 1, cooldownDays: 90, maxPerCareer: 4, categoryCooldown: 6,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 30 } } },
    slots: { airport: ['a regional airport', 'a baggage carousel', 'a crowded terminal', 'an airport gate'], hour: ['5 a.m.', 'midnight', 'lunchtime', 'rush hour'] },
    body: ['Around {hour}, at {airport}, a stranger approaches you. {fan.name} has followed your career for years and is trembling slightly with excitement.', 'You are tired, your luggage is heavy and your flight boards soon. Fans do not choose their moment, and neither do you.'],
    choices: [
      { id: 'chat', label: 'Chat for ten minutes and take photos', risk: 'low', result: '{fan.first} glows. You miss the first boarding call but pick up an unusual story about the fan\'s favorite match.', effects: [{ pop: 0.6 }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'quick', label: 'Sign one item and keep moving', risk: 'low', result: 'A signature, a handshake and a smile. Everyone leaves happy enough.', effects: [{ pop: 0.2 }, { fatigue: 1 }] },
      { id: 'buy_coffee', label: 'Treat {fan.first} to coffee and a real conversation', risk: 'med', outcomes: [
        { weight: 2, text: 'The conversation is warm and surprising. {fan.first} tells the story for weeks.', effects: [{ pop: 0.9 }, { conf: 3 }, { money: -30 }, { fatigue: 4 }] },
        { weight: 1, text: 'You miss your flight and sleep in a plastic chair. The coffee was good, though.', effects: [{ pop: 0.5 }, { fatigue: 9 }, { money: -250 }] } ] },
      { id: 'decline', label: 'Apologize and say you must run', risk: 'low', result: 'You are polite and brisk. {fan.first} takes it well, and an awkward moment ends.', effects: [{ fatigue: -2 }, { pop: -0.15 }] },
    ],
  },
  // ======================= PERSONAL =======================
  {
    id: 'life_per_family_vs_show', category: 'personal', title: 'Family or the Show', weight: 2.5, major: true, cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 10,
    cast: { gm: { pick: 'staff', role: 'gm' } },
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { event: ['Your sibling\'s wedding', 'Your parent\'s birthday dinner', 'Your cousin\'s graduation', 'Your niece\'s christening'], show: ['a television taping', 'a title match', 'a sold-out house show', 'a pay-per-view'] },
    body: ['{event} lands on the same night as {show}, the biggest date on your schedule. {gm.name} says the show cannot be moved and the family says the event cannot either.', 'You have missed enough holidays to know the cost. You also know exactly what the business thinks of people who say no.'],
    choices: [
      { id: 'family', label: 'Skip the show and go home', risk: 'med', result: 'You miss the date. {gm.name} says nothing, which is how you know it was noticed. The photo from the family event is priceless.', effects: [{ pop: -0.7 }, { money: -2000 }, { conf: 4 }, { fatigue: -8 }] },
      { id: 'show', label: 'Work the show and send gifts', risk: 'med', result: 'You work the best match of your month and send flowers and a heartfelt note. Your family understands. Mostly.', effects: [{ pop: 0.4 }, { money: 1500 }, { conf: -2 }, { fatigue: 5 }] },
      { id: 'both', label: 'Try to do both with a split-second trip', risk: 'high', outcomes: [
        { weight: 1, bonus: { fatigue: -0.5, confidence: 0.3 }, text: 'You run, fly and arrive at the family dinner in the middle of dessert. It is a hell of a night, and you pull it off.', effects: [{ pop: 0.3 }, { conf: 5 }, { fatigue: 14 }, { money: -1200 }] },
        { weight: 2, text: 'A delay wrecks one half of the plan. You make neither event on time and feel it in both places.', effects: [{ pop: -0.4 }, { conf: -4 }, { fatigue: 14 }, { money: -1200 }] } ] },
      { id: 'rebook', label: 'Ask {gm.name} to rebook your slot', risk: 'med', outcomes: [
        { weight: 1, bonus: { popularity: 0.5 }, text: '{gm.name} shifts the schedule. You owe a favor, and you get your night.', effects: [{ conf: 3 }, { pop: -0.1 }, { fatigue: -4 }] },
        { weight: 2, text: '{gm.name} refuses, and you must choose after all. Worse, the request is remembered.', effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
    ],
  },
  {
    id: 'life_per_burnout', category: 'personal', title: 'The Slow Burn: {symptom}', weight: 2.5, major: true, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 10,
    cast: { doc: { pick: 'staff', role: 'doctor' } },
    trigger: { stat: { fatigue: { gte: 68 } } },
    slots: { symptom: ['constant irritability', 'dread before every show', 'numbness in the ring', 'weeks of insomnia'], cause: ['too many dates', 'a bad stretch of results', 'no downtime', 'a loss of love for the job'] },
    body: ['It has been creeping in for weeks: {symptom}. {doc.name} diagnoses it quietly as burnout, and puts the likely cause at {cause}.', 'You always assumed burnout was something that happened to people with fewer reasons to be grateful. It happens to everyone.'],
    choices: [
      { id: 'break', label: 'Take a real break of two weeks or more', risk: 'low', result: 'You switch off the phone, unpack your bag and stay in one place. The first week hurts. The second week heals.', effects: [{ fatigue: -28 }, { money: -3500 }, { pop: -0.6 }, { conf: 3 }] },
      { id: 'therapy', label: 'Start seeing a counselor on the road', risk: 'low', requires: { stat: { money: { gte: 600 } } }, result: 'Weekly calls with a professional who knows nothing about wrestling. It becomes the best hour of your week.', effects: [{ money: -600 }, { fatigue: -10 }, { conf: 4 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'push', label: 'Keep going, since this too shall pass', risk: 'high', outcomes: [
        { weight: 1, bonus: { confidence: 0.5 }, text: 'Somehow it does pass, mostly. You get through the month on stubbornness and dark humor.', effects: [{ fatigue: 8 }, { conf: 2 }, { money: 2500 }] },
        { weight: 3, text: 'You hit a wall. A bad night turns into a bad week, and someone else has to finish your spots.', effects: [{ fatigue: 12 }, { conf: -6 }, { pop: -0.8 }, { injury: { part: 'torso', severity: 1, days: 12 } }] } ] },
      { id: 'reset_role', label: 'Ask the office for a lighter role for a month', risk: 'med', result: 'You get fewer matches and more promo time. It is a good compromise and a small hit to your momentum.', effects: [{ fatigue: -14 }, { pop: -0.3 }, { mic: 1 }, { money: -1200 }] },
    ],
  },
  {
    id: 'life_per_charity_visit', category: 'personal', title: 'A Visit to {place}', weight: 1.5, cooldownDays: 120, maxPerCareer: 4, categoryCooldown: 8,
    trigger: { stat: { popularity: { gte: 25 } } },
    slots: { place: ['a children\'s hospital', 'a veterans\' home', 'a school gym', 'a food bank'], mood: ['nervous', 'eager', 'tired', 'playful'] },
    body: ['You are on the schedule for a visit to {place}, and you arrive feeling {mood}. The people there do not care about your match results; they care about your attention for an hour.', 'These visits are on the calendar for the cameras. The ones that matter are the ones where you forget about them.'],
    choices: [
      { id: 'stay_long', label: 'Stay two extra hours and sit with everyone', risk: 'low', result: 'You hand out autographs, listen to stories and skip your dinner. It is easily the best part of your month.', effects: [{ conf: 5 }, { pop: 0.7 }, { fatigue: 6 }] },
      { id: 'donate', label: 'Bring a donation along with you', risk: 'low', requires: { stat: { money: { gte: 1500 } } }, result: 'A check and a truck of supplies. The staff thanks you warmly, and your balance shrinks.', effects: [{ money: -1500 }, { pop: 0.8 }, { conf: 3 }] },
      { id: 'quick_visit', label: 'Do the scheduled hour and leave on time', risk: 'low', result: 'A solid visit and a clean exit. You do the job well and keep to the clock.', effects: [{ pop: 0.3 }, { conf: 1 }, { fatigue: 2 }] },
      { id: 'cancel', label: 'Cancel because you are worn out', risk: 'med', result: 'You send a card and an apology. The staff understands, and the press does not forget.', effects: [{ fatigue: -6 }, { pop: -0.6 }, { conf: -2 }] },
    ],
  },
  {
    id: 'life_per_rookie_advice', category: 'personal', title: 'A Rookie Needs Advice', weight: 1.5, cooldownDays: 90, maxPerCareer: 4, categoryCooldown: 6,
    cast: { rookie: { pick: 'roster', tier: { lte: 1 } } },
    trigger: { stat: { careerYears: { gte: 3 } } },
    slots: { question: ['how to handle nerves', 'how to deal with a hard boss', 'how to manage money', 'how to get noticed'], place: ['the catering table', 'the loading dock', 'the hotel gym', 'the parking lot'] },
    body: ['At {place}, {rookie.name} approaches you with a question about {question}. "Got a minute?" {rookie.they} asks, looking at the floor.', 'You remember asking someone the same thing once. What you say and how you say it will matter more than {rookie.they} lets on.'],
    choices: [
      { id: 'honest', label: 'Share what actually worked for you', risk: 'low', result: 'You tell the truth, including the mistakes. {rookie.first} writes it down. You will see the effects in the weeks ahead.', effects: [{ rel: { who: 'rookie', respect: 6, trust: 6 } }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'tough_love', label: 'Give blunt, hard-edged advice', risk: 'med', outcomes: [
        { weight: 2, text: '{rookie.first} blinks, then nods slowly. A day later there is a nervous thank-you.', effects: [{ rel: { who: 'rookie', respect: 5, fear: 3 } }, { conf: 2 }] },
        { weight: 1, text: '{rookie.first} hears only the harshness and avoids you for a month.', effects: [{ rel: { who: 'rookie', trust: -4, respect: -2 } }, { conf: -1 }] } ] },
      { id: 'mentor', label: 'Offer a regular weekly talk', risk: 'med', result: 'You set up a standing slot. It costs you an hour a week and pays you back in respect and perspective.', effects: [{ tag: { who: 'rookie', tag: 'mentee' } }, { event: { type: 'mentorship', participants: ['rookie'], summary: 'Took {rookie.name} under your wing.', data: { byPlayer: true } } }, { fatigue: 4 }, { conf: 2 }] },
      { id: 'brush', label: 'Brush the question off, since you are busy', risk: 'low', result: 'You say it is not a good time. It never is. {rookie.first} finds someone else, and remembers who said no.', effects: [{ rel: { who: 'rookie', respect: -3, affinity: -3 } }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'life_per_old_friend', category: 'personal', title: 'An Old Friend Turns Up', weight: 1.5, cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 10,
    cast: { friend: { pick: 'tag', tag: 'ally' } },
    trigger: { stat: { popularity: { gte: 35 }, careerYears: { gte: 2 } } },
    slots: { need: ['a job', 'a place to stay', 'an introduction', 'forgiveness'], meet: ['at a diner near the arena', 'outside the stage door', 'through a message from a mutual friend', 'in a hotel lobby'] },
    body: ['{friend.name} comes to you {meet}. You came up through the small shows together, and now you are on different rungs. {friend.they} is asking for {need}.', 'It is awkward in the way old friendships are awkward when one of you has done well. The things you used to share are harder to name.'],
    choices: [
      { id: 'help_fully', label: 'Help in every way you can', risk: 'med', outcomes: [
        { weight: 2, text: '{friend.first} makes the most of the chance, and the old bond becomes stronger than before.', effects: [{ rel: { who: 'friend', trust: 8, respect: 5, affinity: 6 } }, { tag: { who: 'friend', tag: 'ally' } }, { conf: 3 }, { fatigue: 4 }] },
        { weight: 1, text: '{friend.first} struggles to repay your effort and starts leaning on it. The friendship tightens, and not in a good way.', effects: [{ rel: { who: 'friend', trust: 1 } }, { conf: -2 }, { fatigue: 5 }] } ] },
      { id: 'small_help', label: 'Offer a small, clear piece of help', risk: 'low', result: 'A kind word to the right person and a modest gesture. It is useful and honest about its limits.', effects: [{ rel: { who: 'friend', respect: 3, affinity: 3 } }, { money: -200 }] },
      { id: 'honest_talk', label: 'Have a frank talk about how things have changed', risk: 'low', result: 'It is not easy, and it is cleansing. You leave with fewer illusions and more respect.', effects: [{ rel: { who: 'friend', respect: 4, trust: 3 } }, { conf: 2 }] },
      { id: 'distance', label: 'Keep your distance politely', risk: 'low', result: 'You smile, promise to catch up soon, and do not. The friendship cools like a cup of coffee.', effects: [{ rel: { who: 'friend', affinity: -6, trust: -3 } }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'life_per_partner_road', category: 'personal', title: 'Home Is Getting Quiet: {sign}', weight: 2, cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 10,
    trigger: { stat: { careerYears: { gte: 2 }, fatigue: { gte: 35 } } },
    slots: { sign: ['missed calls', 'a quiet dinner', 'a packed suitcase by the door', 'a note on the fridge'], offer: ['a week together', 'a surprise visit to the road', 'a gift', 'an apology'] },
    body: ['It is {sign}, and it tells you more than a long argument would. You have been on the road more than at home, and the person who loves you has noticed.', 'You are considering {offer}, though you are not sure that is enough. Careers are built on sacrifice, but so are marriages and friendships.'],
    choices: [
      { id: 'time_off', label: 'Take a week off to be present', risk: 'low', result: 'You turn off the phone and learn how to cook a meal. It is a small repair, and a necessary one.', effects: [{ fatigue: -14 }, { money: -1800 }, { pop: -0.3 }, { conf: 4 }] },
      { id: 'bring_along', label: 'Bring them on the road for a week', risk: 'med', outcomes: [
        { weight: 2, text: 'They see the grind, the fans and the fun. The week is hectic and happy and it explains the job better than words.', effects: [{ conf: 4 }, { fatigue: 4 }, { money: -700 }] },
        { weight: 1, text: 'The week is long, damp and exhausting. They see only how little time you have.', effects: [{ conf: -3 }, { fatigue: 6 }, { money: -700 }] } ] },
      { id: 'gift', label: 'Make it up with a lavish gift', risk: 'med', requires: { stat: { money: { gte: 1500 } } }, result: 'The gift is lovely and the point of it lands only halfway. It helps, though it is not the thing that was missing.', effects: [{ money: -1500 }, { conf: 1 }] },
      { id: 'promise', label: 'Promise things will get easier after this season', risk: 'high', outcomes: [
        { weight: 1, bonus: { confidence: 0.4 }, text: 'The promise is accepted and honored. You keep your word through a hard year.', effects: [{ conf: 3 }, { fatigue: 5 }] },
        { weight: 2, text: 'It is the promise every road warrior makes, and everyone hears it for what it is.', effects: [{ conf: -4 }, { fatigue: 5 }] } ] },
    ],
  },
  {
    id: 'life_per_viral_aftermath', category: 'personal', title: 'Life After the Clip', weight: 1.5, cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 10,
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { minYear: 2010, stat: { popularity: { gte: 30 } } },
    slots: { moment: ['a clip of you being kind', 'a clip of you losing your temper', 'a clip of you taking a fall', 'a clip of a fan moment'], reaction: ['sudden fame', 'a flood of messages', 'sponsor interest', 'a wave of angry replies'] },
    body: ['Everyone is talking about {moment}, and the reaction is {reaction}. {reporter.name} wants a statement before the weekend.', 'Online attention is a strange weather system. You can step into it, step around it, or learn to live under it.'],
    choices: [
      { id: 'statement', label: 'Issue a short, genuine statement', risk: 'low', outcomes: [
        { weight: 3, bonus: { mic: 0.4, charisma: 0.4 }, text: 'You keep it short and sincere. The reaction softens and the story gets a decent ending.', effects: [{ pop: 0.6 }, { conf: 2 }, { event: { type: 'social_post', participants: ['reporter'], summary: 'Addressed viral attention with a short statement.', data: { quality: { base: 65, mic: 0.4, charisma: 0.3 }, viral: { minQuality: 85, chance: 0.3 } } } }] },
        { weight: 1, text: 'Your wording is misread and the new post becomes the new story.', effects: [{ pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'lean_in', label: 'Lean in and make the most of it', risk: 'high', outcomes: [
        { weight: 2, bonus: { popularity: 0.4, charisma: 0.4 }, text: 'You turn the attention into a merch drop and a few well-timed appearances. The wave is still rolling.', effects: [{ pop: 1.4 }, { money: 4000 }, { fatigue: 7 }] },
        { weight: 2, text: 'You overplay it. The audience grows tired of the same joke, and so does your agent.', effects: [{ pop: -0.3 }, { conf: -3 }, { fatigue: 7 }] } ] },
      { id: 'offline', label: 'Go offline for a few days', risk: 'low', result: 'You switch everything off and go to the gym. By the time you return the world has moved on to another clip.', effects: [{ fatigue: -6 }, { conf: 1 }, { pop: -0.1 }] },
      { id: 'talk_family', label: 'Spend the week talking it through with family', risk: 'low', result: 'They remind you who you were before the clip. It is grounding, and a little funny.', effects: [{ conf: 3 }, { fatigue: -3 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'life_per_lucky_charm', category: 'personal', title: 'A Missing Good-Luck Charm', weight: 1, cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 8,
    trigger: { stat: { careerYears: { gte: 2 }, matches: { gte: 20 } } },
    slots: { charm: ['wristband', 'lucky coin', 'pair of boots', 'folded photo'], place: ['an airport', 'the locker room', 'a hotel', 'the tour bus'] },
    body: ['You cannot find your {charm} anywhere. You last had it in {place}, and no amount of tearing the bag apart brings it back.', 'You do not believe in luck, as a rule. You also have never worked a match without it.'],
    choices: [
      { id: 'search', label: 'Spend the afternoon searching', risk: 'med', outcomes: [
        { weight: 2, text: 'It turns up at the bottom of a jacket pocket. You are ridiculously relieved.', effects: [{ conf: 4 }, { fatigue: 4 }] },
        { weight: 2, text: 'It is gone for good, and the search costs you a nap and your nerves.', effects: [{ conf: -3 }, { fatigue: 5 }] } ] },
      { id: 'replace', label: 'Buy a replacement and treat it as new', risk: 'low', result: 'It is not the same and it will be soon. You break it in with a good match.', effects: [{ money: -250 }, { conf: 1 }] },
      { id: 'go_without', label: 'Go without and prove it was never the charm', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.6 }, text: 'You work a great match and find that the luck was always yours. It is a freeing realization.', effects: [{ conf: 6 }, { attr: { name: 'psychology', delta: 1 } }] },
        { weight: 2, text: 'The match feels slightly off all night, and you cannot shake the idea that you jinxed it.', effects: [{ conf: -4 }, { pop: -0.2 }] } ] },
      { id: 'ritual', label: 'Make up a new ritual to replace it', risk: 'low', result: 'A deep breath, a tap on the turnbuckle and a three-count in your head. It is silly and it works.', effects: [{ conf: 2 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 1 }] },
    ],
  },
  {
    id: 'life_per_homesick_call', category: 'personal', title: 'A Call From {caller}', weight: 1.5, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 8,
    trigger: { stat: { careerYears: { lte: 4 }, fatigue: { gte: 30 } } },
    slots: { caller: ['your mother', 'your old coach', 'your best friend', 'your younger sibling'], news: ['good news you cannot celebrate', 'a bad week at home', 'a question you do not want to answer', 'a story about a neighbor who saw you on television'] },
    body: ['{caller} rings during a lull at the arena, with {news}. The conversation runs longer than you planned and the hallway grows quieter around it.', 'You love the work. You also miss the places that are not part of it, and you are only starting to see how much.'],
    choices: [
      { id: 'talk_long', label: 'Skip warm-up and talk as long as it takes', risk: 'med', result: 'The call runs an hour. You miss your stretch and gain back a little of your own history.', effects: [{ conf: 4 }, { fatigue: 3 }, { pop: -0.1 }] },
      { id: 'short_promise', label: 'Keep it short and promise to call back', risk: 'low', result: 'You keep your word that night. It is not perfect, but it is honest.', effects: [{ conf: 1 }, { fatigue: 1 }] },
      { id: 'visit_plan', label: 'Plan a weekend trip home soon', risk: 'med', requires: { stat: { money: { gte: 600 } } }, result: 'You book the ticket before you can change your mind. The trip costs money and sleep and refills something empty.', effects: [{ money: -600 }, { conf: 4 }, { fatigue: -6 }, { pop: -0.1 }] },
      { id: 'let_ring', label: 'Let it ring and focus on the show', risk: 'low', result: 'You stay in the zone, and the worry sits on your shoulder anyway. You call back late, tired and ashamed.', effects: [{ conf: -2 }, { fatigue: 2 }] },
    ],
  },
];
