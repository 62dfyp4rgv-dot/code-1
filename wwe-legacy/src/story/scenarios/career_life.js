// Career-life scenarios: debut, breakout, contract, injury, recovery, comeback, retirement, legacy, finance, training, travel, personal.
export default [
  // ======================= DEBUT =======================
  {
    id: 'life_deb_first_day', category: 'debut', title: 'Day One at {facility}', weight: 2, cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 10,
    cast: { trainer: { pick: 'staff', role: 'trainer' } },
    trigger: { stat: { matches: { lte: 3 }, careerYears: { lte: 1 } } },
    slots: { facility: ['the Performance Center', 'a converted warehouse gym', 'the old training school', 'a rented ring behind a car dealership'], drill: ['bumping on the plywood-and-foam ring', 'running the ropes until your calves shake', 'a ten-minute plank test', 'headlock-and-hip drills with a stranger'] },
    body: ['You get to {facility} forty minutes early with a duffel bag and no idea where to stand. {trainer.name} looks you over once, points at the ring, and says your first lesson is {drill}.', 'The other trainees stop what they are doing to watch. Everybody in the building remembers how their own first day went, and everybody wants to see how yours does.'],
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
    body: ['The tryout is held in {venue}, and the ring has clearly been assembled that morning. {exec.name} sits at the edge of the apron with {watching} behind {exec.their} shoulder.', 'You get ninety seconds of ring time and a promise that someone will call. Most people in the room will never hear from anyone.'],
    choices: [
      { id: 'safe', label: 'Run the basics with perfect execution', risk: 'low', result: 'Every bump, every lock-up, every roll-through is textbook. Nobody gasps, but nobody frowns either, and your name ends up on the callback list.', effects: [{ conf: 3 }, { attr: { name: 'technical', delta: 1 } }, { pop: 0.1 }] },
      { id: 'flashy', label: 'Go for the highlight move', risk: 'high', outcomes: [
        { weight: 2, bonus: { overall: 0.7, confidence: 0.4 }, text: 'You hit it with room to spare and the room goes quiet in the good way. {exec.name} writes something down.', effects: [{ pop: 0.6 }, { conf: 6 }] },
        { weight: 2, text: 'You come up short on the landing and tweak something on the way down. You finish the set, but everyone saw it.', effects: [{ conf: -4 }, { fatigue: 8 }, { injury: { part: 'legs', severity: 1, days: 7 } }] } ] },
      { id: 'talk', label: 'Ask for a few seconds on the mic as well', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.7, charisma: 0.5 }, text: 'You cut a thirty-second promo that makes people look up from their phones. It is the part they remember.', effects: [{ mic: 1 }, { pop: 0.5 }, { conf: 3 }] },
        { weight: 2, text: 'The words come out in the wrong order. You get through it, but the silence afterward is long.', effects: [{ conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'cheap_travel', label: 'Spend your savings on a hotel night before the tryout', risk: 'low', requires: { stat: { money: { gte: 1500 } } }, result: 'You sleep, eat properly, and arrive loose. It costs money you do not have to spare, but your body feels like yours.', effects: [{ money: -1200 }, { fatigue: -6 }, { conf: 2 }] },
    ],
  },
  {
    id: 'life_deb_first_deal', category: 'debut', title: 'The First Contract Offer', weight: 2, major: true, cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 10,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { background: ['prospect', 'indie'], stat: { matches: { lte: 8 }, careerYears: { lte: 1.5 } } },
    slots: { terms: ['a developmental deal with a short leash', 'a per-appearance deal with no guarantee', 'a one-year developmental deal with team options'], pressure: ['a pen already uncapped', 'a parent reading over your shoulder', 'a rumour that another office is also interested', 'a hard deadline of end of day'] },
    body: ['{agent.name} slides the paperwork across the table: {terms}. The money is modest, and next to {pressure}, the room feels smaller than it did when you walked in.', 'It is your first real offer. You can sign, haggle, or walk, and each of those says something about you.'],
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
    body: ['It is your first night on television and your body has decided to protest, starting with {sign}. You are {backstage}, with the arena hum rising on the other side of the wall.', '{producer.name} appears with a headset and a clipboard and reads your face in one second. There are ten minutes until the bell.'],
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
    body: ['{trainer.name} announces {drill} at the end of an already long day. The reason, mentioned in passing, is {reason}.', 'Your legs have gone from sore to numb and your breath comes in short bursts. Nobody else in the room has been asked to do the same.'],
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
    slots: { maker: ['a local seamstress', 'an online catalogue', 'a veteran selling a trunk of old gear', 'the costume department'], budget: ['a small budget', 'almost no budget', 'a bonus you just received', 'a loan from family'] },
    body: ['Your first gear has to come from somewhere, and for you that means {maker}. You have {budget} to work with and more ideas than you have money.', 'A wrestler is often judged before the bell, and the choice of colour, cut and material will be on every photograph taken of you for the next year.'],
    choices: [
      { id: 'custom', label: 'Pay for custom gear with your own design', risk: 'med', requires: { stat: { money: { gte: 2500 } } }, outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: 'It fits like it was made for you, because it was. Photos of the gear get passed around backstage before you have even debuted it.', effects: [{ money: -2200 }, { pop: 0.6 }, { conf: 4 }] },
        { weight: 1, text: 'The stitching splits on the second night and the colour looks different under arena lights. You eat the cost and the embarrassment.', effects: [{ money: -2200 }, { conf: -2 }] } ] },
      { id: 'simple', label: 'Keep it simple: black trunks and a plain jacket', risk: 'low', result: 'It will not turn heads, but it will not fall apart. You save your money and make it up in the ring.', effects: [{ money: -250 }, { attr: { name: 'technical', delta: 1 } }] },
      { id: 'borrow', label: 'Borrow a veteran\'s old gear and tailor it', risk: 'low', result: 'It comes with a story you did not ask for and a faint smell of liniment. It also comes free, and with a favor owed.', effects: [{ money: -100 }, { conf: 1 }, { pop: 0.1 }] },
      { id: 'bold', label: 'Wear something loud that no one else would', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.7, confidence: 0.4 }, text: 'The crowd laughs, then points, then asks about it later. You are the one with the unmistakable look.', effects: [{ pop: 1.0 }, { conf: 3 }, { money: -900 }] },
        { weight: 2, text: 'It looks wrong from the very first photograph. The nickname that sticks is not a kind one.', effects: [{ pop: -0.5 }, { conf: -4 }, { money: -900 }] } ] },
    ],
  },
  {
    id: 'life_deb_locker_room_prank', category: 'debut', title: 'The Prank in {where}', weight: 1.5, cooldownDays: 200, maxPerCareer: 1, categoryCooldown: 8,
    cast: { vet: { pick: 'roster', tier: { gte: 2 } } },
    trigger: { stat: { matches: { lte: 15 }, careerYears: { lte: 2 } } },
    slots: { where: ['the locker room', 'catering', 'the bus', 'the gym'], prank: ['a lunch order for the whole building in your name', 'a fake call time that has you dressed an hour early', 'every sock in your bag tied together', 'a note on your gear that says "ask me about my finisher"'] },
    body: ['Someone has done it to you in {where}: {prank}. {vet.name} is leaning on the wall with the face of a person who knows nothing and invented all of it.', 'Half the room is waiting to see what you do. It is an old tradition and it has a reputation for revealing character.'],
    choices: [
      { id: 'laugh', label: 'Laugh it off and play along', risk: 'low', result: 'You laugh loudly enough to mean it. Someone slaps your shoulder, and you are told you are good people. It costs you a few dollars and a bit of dignity.', effects: [{ rel: { who: 'vet', respect: 4, affinity: 3 } }, { money: -80 }, { conf: 1 }] },
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
    slots: { spot: ['a televised tag spot', 'a semi-main match on television', 'a live-event headline', 'a major video-package segment'], notice: ['two hours of notice', 'a single day of notice', 'twenty minutes of notice', 'a week to prepare'] },
    body: ['{vet.name} has been pulled from the card with a strain, and {producer.name} needs somebody to fill {spot}. You are on the list, with {notice}.', 'It is a gift and a trap in the same envelope. Perform well and your name moves up the list; fall flat and it moves just as quickly.'],
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
    slots: { item: ['t-shirt', 'poster run', 'hooded sweatshirt', 'collectible figure'], venue: ['the arena merch stand', 'a fan convention', 'the travelling merch truck', 'a hometown signing'] },
    body: ['Your {item} was gone by halftime at {venue}, and the stall had to hang a sign that said "sold out". {exec.name} calls you to a quiet office to talk numbers.', 'Merchandise percentages are small, but they add up. The company would like a bigger run, and it would like you to promote it.'],
    choices: [
      { id: 'big_run', label: 'Agree to a bigger run and a signing tour', risk: 'med', outcomes: [
        { weight: 3, bonus: { popularity: 0.5, charisma: 0.4 }, text: 'The second run sells well and your cut covers more than rent. The signings tire you but the fans leave happy.', effects: [{ money: 6500 }, { pop: 0.8 }, { fatigue: 10 }] },
        { weight: 1, text: 'The second run is overprinted. Boxes sit in the warehouse and the royalties barely cover your travel.', effects: [{ money: -1200 }, { pop: 0.1 }, { fatigue: 10 }] } ] },
      { id: 'keep_rare', label: 'Keep it rare to protect the demand', risk: 'low', result: 'You argue that scarcity is part of the appeal. The office goes along, and the original shirts become something fans brag about owning.', effects: [{ pop: 0.5 }, { money: 800 }, { conf: 2 }] },
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
    body: ['At {place}, you wake up to {news}. The streak has lifted you above the pack, and the cheerful noise is already attracting attention you did not have a month ago.', 'The question is what to do with it. Streaks end, and what you build while it lasts decides how much of it you keep.'],
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
    id: 'life_brk_banner_fan', category: 'breakout', title: 'The Fan with the {banner}', weight: 1, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 8,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 25 } } },
    slots: { banner: ['hand-painted bedsheet', 'foam-board portrait', 'sign with a joke only you understand', 'poster with your catchphrase'], section: ['front row', 'hard camera section', 'last aisle', 'family seating'] },
    body: ['A fan named {fan.name} has been in the {section} at the last three shows holding a {banner}. This time the fan is waiting at the barricade, hoping you will stop.', 'It is a small thing, but the people who show up every week hold the building in their hands. You have about a minute.'],
    choices: [
      { id: 'sign', label: 'Stop and sign it, then take a photo', risk: 'low', result: '{fan.first} has the biggest grin of the night. Within a day the photo is on the walls of other fans\' phones, and a few more come.', effects: [{ pop: 0.4 }, { fatigue: 2 }] },
      { id: 'give', label: 'Hand over your gear for the sign', risk: 'low', requires: { stat: { money: { gte: 300 } } }, result: 'You trade a worn wristband for the sign. The fan nearly cries and half the section applauds. It also leaves you without a spare.', effects: [{ pop: 0.8 }, { money: -300 }, { conf: 2 }] },
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
    body: ['By morning, {clip} has been replayed {where} well past a million views. Everyone from your family to the office has seen it.', 'The clip is already being cut into shorter, sillier versions. You can ride it, steer it, or try to bury it.'],
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
    slots: { setting: ['a hotel conference room', 'the agent\'s cramped office', 'a lunch the office is paying for', 'a phone call between flights'], leverage: ['a thin win column', 'a clean injury record', 'a rival offer you have not mentioned', 'steady crowd reactions in small towns'] },
    body: ['Your deal is almost up, and {agent.name} has called a meeting in {setting}. The honest assessment is that your main card is {leverage}, which is not a strong hand and not a weak one.', 'The office has put a number on the table. Whether it is generous depends on what you plan to do with the next two years.'],
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
    id: 'life_con_renew_midcard', category: 'contract', title: 'The Sticking Point Is {point}', weight: 3, major: true, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 10,
    cast: { agent: { pick: 'staff', role: 'agent' }, exec: { pick: 'staff', role: 'executive' } },
    trigger: { contract: { lte: 90 }, stat: { popularity: { gte: 35, lte: 70 } } },
    slots: { point: ['creative control', 'travel days per year', 'a bigger merchandise share', 'a guaranteed number of television appearances'], mood: ['a friendly dinner', 'a stiff boardroom', 'an ambush in the hallway', 'a long call that kept getting longer'] },
    body: ['The renewal is being hammered out over {mood}. {exec.name} offers a fair base number but will not budge on one thing: {point}, which {agent.name} says you should care about.', 'You are respected enough to have a say and not yet big enough to dictate. Pick what matters to you.'],
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
    id: 'life_con_renew_star', category: 'contract', title: '{rival} Wants to Hire You Away', weight: 3, major: true, cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 10,
    cast: { agent: { pick: 'staff', role: 'agent' }, exec: { pick: 'staff', role: 'executive' } },
    trigger: { contract: { lte: 120 }, stat: { popularity: { gte: 65 } } },
    slots: { rival: ['a competing promotion', 'a film studio', 'an overseas league', 'a television network'], leverage: ['a championship reign', 'a sold-out run of arena dates', 'record merchandise numbers', 'a rating bump during your segments'] },
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
    body: ['{gm.name} offers a transfer to SmackDown because of {reason}. As a sweetener, the company is throwing in {sweetener}.', 'It means new faces, a new schedule and the chance to be the big fish in a smaller pond. It also means leaving the people who know your work best.'],
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
    id: 'life_con_pay_dispute', category: 'contract', title: 'The Missing {issue}', weight: 2, cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 10,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { stat: { popularity: { gte: 40 }, careerYears: { gte: 1 } } },
    slots: { issue: ['bonus', 'percentage payment', 'travel reimbursement', 'appearance fee'], way: ['in writing', 'at the next meeting', 'through a lawyer', 'in front of other talent'] },
    body: ['Your latest statement is missing a {issue}. After checking twice with {agent.name}, you confirm the office owes you real money.', 'You can raise it {way}, or not at all. Money fights have a way of being remembered longer than they take.'],
    choices: [
      { id: 'raise_quietly', label: 'Raise it quietly with the accounts desk', risk: 'low', outcomes: [
        { weight: 3, text: 'The accounts desk apologises and sends a corrected payment within the week. You never hear of it again.', effects: [{ money: 4500 }] },
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
    id: 'life_con_release_rumours', category: 'contract', title: 'Rumours of Your Release', weight: 2, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 10, major: true,
    cast: { gm: { pick: 'staff', role: 'gm' } },
    trigger: { contract: { lte: 150 }, stat: { loseStreak: { gte: 3 } } },
    slots: { source: ['a producer who talks too much', 'a locker-room whisper', 'a leaked budget sheet', 'an agent who owes you a favor'], sign: ['your name missing from an upcoming poster', 'your travel being booked one-way', 'a nameplate that disappeared from a locker', 'a gear order that was quietly cancelled'] },
    body: ['It starts with {source}, then you notice {sign}. The word is that the budget is being trimmed, and a few names on the list look like yours.', '{gm.name} has not told you anything directly. That is usually how it goes, one way or the other.'],
    choices: [
      { id: 'ask', label: 'Ask {gm.name} straight out', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: '{gm.name} appreciates the honesty and gives you a clear answer: you are safe for now, but the next few weeks matter.', effects: [{ conf: 3 }, { fatigue: 2 }] },
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
    body: ['{agent.name} brings an early extension offer to you, with the company explaining it as a reaction to {why}. The headline feature is {pitch}.', 'You are not obliged to take it, and the company knows that. It would also love to lock you in before you get more expensive.'],
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
    slots: { part: ['knee', 'shoulder', 'ribs', 'neck'], timing: ['right before a pay-per-view', 'in the middle of a hot streak', 'the week before a possible title opportunity', 'during a quiet stretch of the schedule'] },
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
    slots: { procedure: ['a ligament reconstruction', 'a repair that needs a handful of screws', 'a minimally invasive scope', 'a fusion that would keep you off the road for months'], clinic: ['the company clinic', 'a private specialist', 'a hospital near your family', 'a clinic a veteran swears by'] },
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
    body: ['During the final minutes, you took {landing} in {location}. You finished the match, but now your hand shakes as you unwrap your tape.', '{doc.name} is walking your way. You can feel something that is not right, though how wrong is not clear.'],
    choices: [
      { id: 'honest', label: 'Show {doc.name} exactly where it hurts', risk: 'low', result: '{doc.name} presses, tests and frowns. It is a sprain and not a break; you will be off for a bit but fine for the long run.', effects: [{ injury: { part: 'legs', severity: 1, days: 10 } }, { fatigue: -6 }, { conf: 1 }] },
      { id: 'tough', label: 'Wave it off and walk out under your own power', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: 'A night of ice and the pain fades. You skip the doctor, and your reputation as tough grows a notch.', effects: [{ pop: 0.3 }, { conf: 3 }, { fatigue: 6 }] },
        { weight: 2, text: 'By morning you cannot put weight on it. The doctor sees you at dawn and is not amused.', effects: [{ injury: { part: 'legs', severity: 2, days: 28 } }, { conf: -4 }, { fatigue: 8 }] } ] },
      { id: 'stretch', label: 'Ask for a quick treatment and stay for the finale', risk: 'med', result: 'You get taped, iced and cleared for a short appearance. It helps your night and costs a little of tomorrow.', effects: [{ fatigue: 5 }, { pop: 0.2 }, { money: -150 }] },
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
    slots: { reason: ['a sold-out show', 'a short roster', 'a rival gaining ground', 'a title angle'], tone: ['a friendly voice', 'an insistent tone', 'a casual shrug', 'a heavy sigh'] },
    body: ['{gm.name} calls to ask how the injury is coming along, in {tone}. The real question is whether you can be back for {reason}.', '{doc.name} has not cleared you yet. The decision is partly medical and partly about what kind of colleague you want to be.'],
    choices: [
      { id: 'hold_line', label: 'Hold firm until {doc.name} clears you', risk: 'low', result: 'You tell {gm.name} politely that the schedule will have to wait. It is honest and a little cold, and nobody argues.', effects: [{ fatigue: -8 }, { pop: -0.3 }, { conf: 1 }] },
      { id: 'return_early', label: 'Return early and take the spot', risk: 'high', outcomes: [
        { weight: 2, bonus: { fatigue: -0.5 }, text: 'You come back at 80 percent and carry it. The office is grateful and your name rises in the plans.', effects: [{ pop: 0.9 }, { conf: 3 }, { fatigue: 8 }, { money: 1200 }] },
        { weight: 2, text: 'The injury flares halfway through. You are gone again before the end, and the office has to scramble.', effects: [{ injury: { part: 'torso', severity: 2, days: 24 } }, { pop: -0.5 }, { conf: -5 }, { fatigue: 8 }] } ] },
      { id: 'promo_only', label: 'Offer a non-wrestling appearance instead', risk: 'low', result: 'You show up with a microphone and a sling. The segment is a hit, though a number of fans wanted the real thing.', effects: [{ pop: 0.4 }, { mic: 1 }, { fatigue: 2 }, { money: -300 }] },
      { id: 'leverage', label: 'Agree to return, but ask for a bonus', risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: '{gm.name} agrees. You collect, and you keep your word, though the injury takes a toll.', effects: [{ money: 4500 }, { fatigue: 8 }, { conf: 2 }] },
        { weight: 2, text: '{gm.name} bristles at the haggling. The offer is withdrawn, and the room goes cold.', effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
    ],
  },
  {
    id: 'life_inj_rookie_cover', category: 'injury', title: 'The Rookie Filling Your Place', weight: 2, cooldownDays: 120, maxPerCareer: 2, categoryCooldown: 8,
    cast: { rookie: { pick: 'roster', tier: { lte: 1 } } },
    trigger: { injured: true },
    slots: { visit: ['at your front door', 'at the training room', 'on a video call from the road', 'at the arena parking lot'], gift: ['a card signed by the roster', 'a bag of fruit', 'a stack of old match tapes', 'a bad joke wrapped in tissue paper'] },
    body: ['{rookie.name} visits you {visit}, holding {gift}. The kid has been covering the spots you left behind, and the reviews are better than expected.', 'It is hard to sit at home while someone else is learning in your place. It is also hard to ignore how genuine the gesture is.'],
    choices: [
      { id: 'mentor', label: 'Offer to coach {rookie.first} through your recovery', risk: 'low', result: 'You turn the downtime into class time. {rookie.first} improves and you remember how much you know.', effects: [{ rel: { who: 'rookie', respect: 6, trust: 6 } }, { tag: { who: 'rookie', tag: 'mentor' } }, { fatigue: 2 }, { conf: 2 }] },
      { id: 'cool', label: 'Stay polite but keep your distance', risk: 'low', result: 'You say thanks, drink the tea, and show {rookie.first} out within the hour. It is not rude, but it is not warm either.', effects: [{ rel: { who: 'rookie', respect: -1, affinity: -3 } }, { fatigue: -3 }] },
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
    slots: { setback: ['a flare-up during a stretch', 'a drop in your strength numbers', 'swelling that came back overnight', 'a missed appointment after a snowstorm'], mood: ['discouraged', 'furious', 'numb', 'strangely calm'] },
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
      { id: 'share', label: 'Share the progress with the fans', risk: 'low', result: 'A short update lands well. Fans cheer you on and the office notes your comeback is trending.', effects: [{ pop: 0.5 }, { conf: 2 }, { fatigue: 1 }] },
      { id: 'quiet', label: 'Keep it private and keep training hard', risk: 'med', result: 'You tell no one and add a small extra set each day. The body responds, and the edge you wanted returns.', effects: [{ attr: { name: 'endurance', delta: 1 } }, { fatigue: 6 }, { conf: 2 }] },
    ],
  },
  {
    id: 'life_rec_physio', category: 'recovery', title: 'Choosing a Physio: {clinic}', weight: 2, cooldownDays: 90, maxPerCareer: 3, categoryCooldown: 8,
    cast: { doc: { pick: 'staff', role: 'doctor' } },
    trigger: { injured: true, stat: { money: { gte: 500 } } },
    slots: { clinic: ['the company physio', 'a private sports clinic', 'a hydrotherapy studio', 'a retired wrestler\'s rehab gym'], schedule: ['early mornings', 'late nights', 'weekends only', 'split sessions'] },
    body: ['You have two weeks to decide on a rehab home. {doc.name} gives you a short list, and the one that stands out is {clinic}, with {schedule} as the only workable hours.', 'The cheapest option is free and a little impersonal; the best ones cost money and time. Your future knees will remember this decision.'],
    choices: [
      { id: 'company', label: 'Stay with the company physio', risk: 'low', result: 'The care is solid, free, and a little rushed. You get what you pay for, and it is enough.', effects: [{ fatigue: -3 }, { conf: 1 }] },
      { id: 'private', label: 'Pay for an elite private clinic', risk: 'med', requires: { stat: { money: { gte: 3500 } } }, outcomes: [
        { weight: 3, text: 'The expert eyes pick up what the company missed. Your recovery speeds up and your confidence follows.', effects: [{ money: -3500 }, { fatigue: -8 }, { conf: 4 }, { attr: { name: 'toughness', delta: 1 } }] },
        { weight: 1, text: 'The clinic is polished and expensive and not much better. You feel better about it than the results warrant.', effects: [{ money: -3500 }, { fatigue: -3 }, { conf: 1 }] } ] },
      { id: 'veteran_gym', label: 'Train with a veteran who has been through it', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: 'You gain stories, stretches and a feel for how long things really take. It is the human touch the company clinic lacked.', effects: [{ money: -800 }, { attr: { name: 'psychology', delta: 1 } }, { conf: 3 }, { fatigue: 3 }] },
        { weight: 1, text: 'The veteran\'s advice is old-school and a little reckless. You do too much too soon.', effects: [{ money: -800 }, { conf: -2 }, { fatigue: 6 }] } ] },
      { id: 'home', label: 'Do the exercises at home on your own', risk: 'med', result: 'You save money and keep the schedule loose. It takes more discipline than you expected, and you cut a few corners.', effects: [{ money: 0 }, { fatigue: 2 }, { conf: -1 }] },
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
    slots: { spot: ['hotel rooms', 'the tour bus', 'airport lounges', 'a friend\'s couch'], culprit: ['red-eye flights', 'late-night loading docks', 'thin hotel walls', 'a phone you cannot put down'] },
    body: ['You have been sleeping in {spot} for weeks, and {culprit} are the worst part. Your reflexes are a half-second off, and everyone who has seen you in the ring has noticed.', 'A tired wrestler is a dangerous wrestler, and not just to themselves. There is no quick fix, but there are options.'],
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
      { id: 'rest', label: 'Rest completely and do nothing useful', risk: 'low', result: 'You sleep late, eat slowly and lose track of the days. When you come back, your body feels a size larger and your mind feels kinder.', effects: [{ fatigue: -22 }, { conf: 2 }, { pop: -0.3 }, { money: -800 }] },
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
    slots: { show: ['a pay-per-view', 'a television taping', 'a big title match', 'a show you used to love'], feeling: ['envy', 'pride in your friends', 'plain boredom', 'an urge to be there'] },
    body: ['You are watching {show} while the ice pack melts on your leg. It is the kind of night you would normally spend in the ring, and you notice {feeling} first.', 'It is not an easy spot. The injured are invisible to the crowd and still very present to themselves.'],
    choices: [
      { id: 'attend', label: 'Go to the arena and sit backstage', risk: 'med', result: 'You show up with a cast and a smile. Everyone is glad to see you, and you pay for the energy afterward.', effects: [{ pop: 0.2 }, { conf: 3 }, { fatigue: 5 }] },
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
    slots: { crowd: ['a hometown house', 'a skeptical crowd', 'a crowd with signs for you', 'an arena of strangers'], entrance: ['a quiet walk-out', 'your full entrance', 'a surprise from the crowd', 'a lone spotlight'] },
    body: ['It has been a long time since you stood where you are standing, and {crowd} is waiting. The plan is {entrance}, and your heart is beating where your knee used to hurt.', 'This is the first moment the crowd gets to decide whether you are still the one they remember.'],
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
    id: 'life_cbk_losing_streak', category: 'comeback', title: 'Climbing Out of the {mood} Hole', weight: 3, major: true, cooldownDays: 90, maxPerCareer: 4, categoryCooldown: 8,
    cast: { coach: { pick: 'staff', role: 'coach' } },
    trigger: { recent: { lossesGte: 3 }, stat: { loseStreak: { gte: 3 } } },
    slots: { mood: ['patient', 'restless', 'sarcastic', 'silent'], feeling: ['doubt', 'anger', 'embarrassment', 'exhaustion'] },
    body: ['Three losses in a row and the crowd has turned {mood}. The loudest voice is your own, full of {feeling}, every time you step out of the shower.', '{coach.name} pulls up a chair in the training room and does not tell you it will be okay. You are the only one who can write the next chapter.'],
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
    slots: { cause: ['a long recovery', 'a contract dispute', 'family leave', 'an office decision'], rust: ['timing', 'conditioning', 'reading the crowd', 'your finishing sequences'] },
    body: ['After the layoff, caused by {cause}, you step back in the ring with {trainer.name} and find what you feared: your {rust} are not where they were.', 'The next show is close, and so is the temptation to fake it. You can fix what is broken or pretend it is not.'],
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
      { id: 'tease_first', label: 'Tease it for a few weeks first', risk: 'med', result: 'A few cryptic hints get the fan sites talking. By the time you return the interest is high, and so are the expectations.', effects: [{ pop: 0.9 }, { conf: 2 }, { fatigue: 3 }, { money: -300 }] },
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
    body: ['{vet.name} finds you after the show and offers a lesson about {theme}, over {setting}. {vet.they} has had more bad runs than you have had matches.', 'It is not a pep talk. It is a story about a low point and the one stubborn decision that got {vet.them} out of it.'],
    choices: [
      { id: 'listen', label: 'Listen closely and take notes', risk: 'low', result: 'You fill the napkin with half-sentences. The advice does not solve anything today, but it will.', effects: [{ rel: { who: 'vet', respect: 5, trust: 3 } }, { attr: { name: 'psychology', delta: 1 } }, { conf: 2 }] },
      { id: 'argue', label: 'Push back and argue your side', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: '{vet.first} grins at your stubbornness. The disagreement becomes a friendship.', effects: [{ rel: { who: 'vet', respect: 6, affinity: 4 } }, { conf: 3 }] },
        { weight: 1, text: '{vet.first} lets the silence do the talking and walks away. The room is cold.', effects: [{ rel: { who: 'vet', respect: -3, affinity: -3 } }, { conf: -2 }] } ] },
      { id: 'ask_more', label: 'Ask for a regular mentorship', risk: 'med', result: '{vet.first} agrees to meet for a monthly lesson. It will cost you time and ego, but the guidance is real.', effects: [{ tag: { who: 'vet', tag: 'mentor' } }, { rel: { who: 'vet', trust: 6 } }, { fatigue: 4 }, { conf: 2 }] },
      { id: 'thank_leave', label: 'Thank {vet.them} politely and move on', risk: 'low', result: 'You keep your distance, a small act of self-protection. The advice stays in your pocket.', effects: [{ rel: { who: 'vet', respect: -1 } }, { fatigue: -2 }] },
    ],
  },
];
