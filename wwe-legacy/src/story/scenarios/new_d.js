// New scenarios (batch D): media, podcast, press, social, fans, rumble, wrestlemania, championship, creative, opportunity.
// Scenes cite shared history only through mem triggers, memory blocks and promise triggers; era rules are enforced with minYear.
export default [
  // ===================================================================== MEDIA
  {
    id: 'nd_med_who_taught_you', category: 'media', title: 'One Question Under the Lights', weight: 2, cooldownDays: 150, maxPerCareer: 2,
    cast: { interviewer: { pick: 'media', kind: 'interviewer' } },
    trigger: { stat: { popularity: { gte: 20 } } },
    slots: {
      crew: [`a documentary crew with one very tired sound man`, `a regional news team with a camera on a tripod`, `a student film crew who keep apologising`, `a magazine pair holding a notebook and a tape recorder`],
      query: [`Who taught you how to fall without breaking?`, `Who first told you that you could do this for a living?`, `Who drove you to your first show?`, `Who did you call after your first really big night?`],
    },
    body: [`In a quiet corner of the arena, {crew} has set up a single light on a stand. {interviewer.name} lets the small talk run out and asks, "{query}"`, `It is not a question about moves or titles, and nothing in your media training covers it. The camera is patient, and so is the silence.`],
    choices: [
      { id: 'name_names', label: 'Name the person and say what they gave you', risk: 'low', result: `You say the name out loud, and then the part you have never told anyone: how much that person carried for you without asking for anything back. The crew stops adjusting their gear to listen.`, effects: [{ pop: 0.5 }, { conf: 3 }, { fatigue: 2 }, { event: { type: 'interview', participants: ['interviewer'], summary: 'Spoke openly about the person who made the career possible.', data: { quality: { base: 66, charisma: 0.5, conf: 0.2, noise: 8 }, viral: { minQuality: 88, chance: 0.3 } } } }] },
      { id: 'polish', label: 'Give the polished answer you have used before', risk: 'low', result: `The answer is smooth, warm and fully rehearsed. It will cut together nicely, and nobody will remember a word of it.`, effects: [{ pop: 0.2 }] },
      { id: 'joke', label: 'Crack a joke about the worst teacher you ever had', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.6 }, text: `The story about the instructor who ran the drills with a lit cigar gets a real laugh from the sound man. It also tells the audience more about you than a solemn answer would have.`, effects: [{ pop: 0.7 }, { conf: 1 }] },
        { weight: 1, text: `The joke goes sour halfway through, and you realise it sounds like you are mocking someone who might be watching. The interviewer moves on quickly, and so do you.`, effects: [{ pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'private', label: 'Say that story is private and move on', risk: 'low', result: `"That one I keep." The interviewer nods and respects it, though the segment loses its heart. Something warm stays in your chest anyway.`, effects: [{ conf: 2 }, { pop: -0.1 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'nd_med_tribute_call', category: 'media', title: 'A Call That Nobody Wants to Make', weight: 1.5, cooldownDays: 200, maxPerCareer: 2,
    cast: { journalist: { pick: 'media', kind: 'journalist' } },
    trigger: { stat: { popularity: { gte: 15 }, careerYears: { gte: 1 } } },
    slots: {
      legend: [`a ring announcer who worked more towns than anyone could count`, `a referee who spent thirty years taking bumps nobody applauded`, `a promoter who ran Friday nights in half-empty halls`, `a trainer who taught half the locker room how to land`],
      deadline: [`before the late edition closes`, `by the top of the hour`, `before midnight`, `ahead of the morning meeting`],
    },
    body: [`{journalist.name} is on the phone from a newsroom with the news you may not have heard yet: {legend} has died. The paper wants a few words from someone still working the business, {deadline}.`, `The voice on the line is gentle about it, which somehow makes it harder. Down the hall, somebody laughs at something on a monitor, and the sound seems to belong to another building.`],
    choices: [
      { id: 'heart', label: 'Say what the person meant, unpolished and unfinished', risk: 'low', result: `The words come out in the wrong order and you let them. When you hang up, your hands are not quite steady, and the quote in tomorrow's edition is the best thing you will say all month.`, effects: [{ pop: 0.5 }, { conf: -2 }, { fatigue: 3 }, { event: { type: 'interview', participants: ['journalist'], summary: 'Paid a raw, unrehearsed tribute to a lost veteran.', data: { quality: { base: 70, charisma: 0.5, noise: 6 }, viral: { minQuality: 90, chance: 0.2 } } } }] },
      { id: 'brief', label: 'Give two respectful lines and hang up', risk: 'low', result: `Two clean sentences, no adjectives to argue with. The journalist thanks you and means it, and the paper runs your lines under the photograph.`, effects: [{ pop: 0.1 }, { conf: 1 }] },
      { id: 'funny_story', label: 'Tell the funny story they would have wanted told', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `The story about the missed cue and the borrowed robe makes the journalist laugh, then go quiet. It prints as the human sketch the family was hoping to see.`, effects: [{ pop: 0.8 }, { conf: 2 }, { fatigue: 1 }] },
        { weight: 1, text: `It is the wrong day for that kind of story, and you hear it land flat before the sentence is finished. The paper quietly trims it to a single line.`, effects: [{ pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'not_ready', label: 'Say you are not ready to talk about it yet', risk: 'low', result: `The journalist says of course, and the line goes quiet for a moment longer than courtesy requires. You sit with the news for an hour before you pick the phone back up.`, effects: [{ conf: 1 }, { pop: -0.2 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'nd_med_how_long', category: 'media', title: 'How Many More Years', weight: 2, cooldownDays: 180, maxPerCareer: 2,
    cast: { interviewer: { pick: 'media', kind: 'interviewer' } },
    trigger: { stat: { careerYears: { gte: 6 }, popularity: { gte: 25 } } },
    slots: {
      setting: [`the pre-show lounge`, `a hotel bar after midnight`, `the edge of a half-built ring`, `the back seat of a car on the way to the airport`],
      manner: [`softly, like a friend`, `with a smile that does not reach the eyes`, `while glancing at a note`, `before the tape is even rolling`],
    },
    body: [`In {setting}, {interviewer.name} turns to you and asks, {manner}, how many more years the body has in it. It is a fair question, the sort your knees have been asking for months.`, `You can feel the answer you give becoming the headline. A bright young face is waiting in the hallway, and the interviewer knows it.`],
    choices: [
      { id: 'honest', label: 'Admit the clock is real and talk about it', risk: 'low', result: `You say the true thing: that you notice every stair now, and that you plan to enjoy the climb. The interviewer puts the pen down, which is the highest praise that profession has.`, effects: [{ pop: 0.5 }, { conf: -2 }, { fatigue: -2 }] },
      { id: 'defiant', label: 'Say you plan to outlast everyone in the building', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.6 }, text: `The line rings out like a challenge and gets quoted in three places by morning. The younger wrestlers hear it and, for a day, do not joke about your knees.`, effects: [{ pop: 0.8 }, { conf: 3 }, { fatigue: 3 }] },
        { weight: 1, text: `The line gets turned into a joke about birth certificates before lunch. A bad landing two nights later makes the joke sting more than it should.`, effects: [{ pop: -0.4 }, { conf: -3 }, { fatigue: 2 }] } ] },
      { id: 'knees', label: 'Show the camera your taped knees and laugh', risk: 'low', result: `The gag works because it is true, and the roll of tape on each joint is a better argument than any speech. The interviewer asks to keep the clip, and you say yes.`, effects: [{ pop: 0.4 }, { conf: 1 }, { fatigue: 1 }] },
      { id: 'plan', label: 'Talk about teaching the next group when you stop', risk: 'low', result: `You sketch an actual plan, a ring in a rented hall and a list of kids who need it. It sounds like a goodbye, but it also sounds like a future, and it earns you a few quiet nods around the building.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { pop: 0.1 }, { conf: 2 }] },
    ],
  },
  {
    id: 'nd_med_morning_segment', category: 'media', title: 'Six Forty in the Morning', weight: 1.5, cooldownDays: 140, maxPerCareer: 3,
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 1990, stat: { popularity: { gte: 30 } } },
    slots: {
      segment: [`a live cooking demonstration`, `the weather map`, `a trivia game against two eight-year-olds`, `a bedtime story hour for the breakfast crowd`],
      hazard: [`an open flame`, `a set the size of a closet`, `a producer shouting a countdown into your ear`, `a studio audience made up mostly of retirees`],
    },
    body: [`The company wanted exposure, and exposure arrives at a quarter to seven. {host.name} stands you in front of {segment}, with {hazard} close enough to touch.`, `The host has the warm, practised smile of someone who has done this with athletes, politicians and one very confused parrot. You have ninety seconds, and none of them are rehearsed.`],
    choices: [
      { id: 'straight', label: 'Play it completely straight and sweet', risk: 'low', result: `You do the segment properly, hat in hand and gentle with the children. The host thanks you with an actual hug, and the station's inbox fills with kind letters.`, effects: [{ pop: 0.6 }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'menace', label: 'Stay in character and menace the segment', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.6 }, text: `The scowl at the weather map is pure gold, and the host plays the terrified straight man like a veteran. The clip becomes a staple of your highlight reel.`, effects: [{ pop: 1.0 }, { conf: 2 }, { event: { type: 'interview', participants: ['host'], summary: 'Menaced a morning segment in perfect character.', data: { quality: { base: 68, charisma: 0.6, noise: 10 }, viral: { minQuality: 82, chance: 0.4 } } } }] },
        { weight: 1, text: `A child in the studio audience starts to cry, and the producer cuts to a commercial in the middle of your best line. The station never books anyone from the company again for a month.`, effects: [{ pop: -0.5 }, { conf: -3 }] } ] },
      { id: 'rescue', label: 'Save the segment when the host loses the thread', risk: 'low', result: `Halfway through, the host's cue card vanishes, and you quietly feed the next line over like a ringside second. {host.first} will mention the favour on air for weeks.`, effects: [{ pop: 0.5 }, { conf: 3 }, { mic: 1 }] },
      { id: 'demo', label: 'Offer to demonstrate a move on the host\'s stool', risk: 'med', result: `The stool survives, barely, and the audience of retirees gives you the loudest ovation of your week. A stagehand sends the bill for the cracked leg to the office, and the office sends it to you.`, effects: [{ pop: 0.7 }, { money: -1800 }, { fatigue: 4 }] },
    ],
  },
  {
    id: 'nd_med_family_question', category: 'media', title: 'The Question Off the List', weight: 2, cooldownDays: 160, maxPerCareer: 2,
    cast: { journalist: { pick: 'media', kind: 'journalist' } },
    trigger: { stat: { popularity: { gte: 25 }, careerYears: { gte: 1 } } },
    slots: {
      spot: [`a quiet corner of the lobby`, `the arena concourse before doors open`, `a rented car in an empty parking lot`, `your hotel room with a tape recorder on the bed`],
      topic: [`the day you told your family what you were going to do for a living`, `who you call when a night goes badly`, `what you miss most about staying in one place`, `who is still waiting up for you when the show ends`],
    },
    body: [`In {spot}, {journalist.name} puts down the list of prepared questions and asks about {topic}. It is not the sort of thing the other magazines ask, and the recorder is still running.`, `The silence in the room is longer than any silence you have allowed yourself in front of a microphone. A faint hum from the machine fills it.`],
    choices: [
      { id: 'truth', label: 'Answer truthfully, including the parts that ache', risk: 'med', result: `You say it plainly, with the awkward pauses left in. When the journalist reads it back to you, the piece is quieter and stranger than a wrestling profile has any right to be.`, effects: [{ pop: 0.6 }, { conf: -1 }, { fatigue: 2 }, { event: { type: 'interview', participants: ['journalist'], summary: 'Gave a candid, personal profile interview.', data: { quality: { base: 68, charisma: 0.5, noise: 8 }, viral: { minQuality: 88, chance: 0.2 } } } }] },
      { id: 'character', label: 'Give the version that fits the character', risk: 'low', result: `The answer is smooth and a little sad in the right places. The profile runs, the fans nod, and nobody ever learns what you left out.`, effects: [{ pop: 0.2 }, { conf: 2 }] },
      { id: 'turn_around', label: 'Turn the question around and ask about them', risk: 'low', result: `The journalist is startled, then talks for ten minutes about a father who used to listen to matches on the radio. The notes end up covering the reporter's life as much as yours, and you leave with a friend.`, effects: [{ charisma: 1 }, { pop: 0.2 }, { conf: 1 }] },
      { id: 'off_record', label: 'Say it, then ask for it to stay off the record', risk: 'med', result: `The journalist agrees and keeps the promise. You feel lighter for having said it, though the piece is thinner and the editor is not pleased.`, effects: [{ conf: 3 }, { pop: -0.2 }, { fatigue: -3 }] },
    ],
  },
  {
    id: 'nd_med_leak_confirm', category: 'media', title: 'A Reporter Has Heard Something', weight: 2, cooldownDays: 90, maxPerCareer: 4,
    cast: { journalist: { pick: 'media', kind: 'journalist' } },
    trigger: { stat: { popularity: { gte: 35 } } },
    slots: {
      rumour: [`a creative argument that ended with a thrown clipboard`, `a dispute over pay that has stalled for weeks`, `a plan to move you to a different show`, `a shouting match with a veteran in the parking lot`],
      source: [`a source who asked to stay anonymous`, `a photograph somebody mailed from the arena`, `a tip dropped by someone in catering`, `a note slipped under the reporter's windscreen wiper`],
    },
    body: [`{journalist.name} catches you by the vending machines and says there is a story about {rumour}. The reporter has {source}, and wants to know if you will confirm it.`, `Part of it is true and part is wildly off, which is the worst kind of rumour. Any answer you give will be read for what you left out.`],
    choices: [
      { id: 'deny', label: 'Deny everything with a straight face', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: `You deliver the denial so flatly that the reporter backs off, and the story dies in a notebook. It costs you a little something to lie to someone who has been fair.`, effects: [{ conf: 2 }, { pop: 0.1 }] },
        { weight: 1, text: `The reporter has a second source, and the denial is printed next to the truth. Management reads both and asks you to explain.`, effects: [{ pop: -0.6 }, { conf: -3 }, { money: -1500 }] } ] },
      { id: 'no_comment', label: 'Smile and say that is a question for the office', risk: 'low', result: `The reporter tuts, scribbles, and decides the rumour is probably not worth the trouble. The office thanks you for your discretion, and it is the whole reward.`, effects: [{ conf: 1 }, { pop: -0.1 }] },
      { id: 'trade', label: 'Trade one honest detail for an exclusive', risk: 'med', result: `You hand over a small, safe fact in return for first call on the next story. The paper runs it with your name on the quote, and the office wonders aloud who has been talking.`, effects: [{ pop: 0.5 }, { money: 2500 }, { conf: -2 }] },
      { id: 'human', label: 'Explain what actually happened and why it hurt', risk: 'med', result: `You tell the whole thing, including the part where you were wrong. The reporter writes a fair, humane piece, and a couple of people backstage grudgingly say well done.`, effects: [{ pop: 0.4 }, { conf: 1 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'nd_med_crew_credit', category: 'media', title: 'Thanks to the People Nobody Sees', weight: 1.5, cooldownDays: 140, maxPerCareer: 3,
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { stat: { popularity: { gte: 25 } } },
    slots: {
      crew: [`the ring crew`, `the production truck`, `the lighting riggers`, `the catering and merchandise crew`],
      hour: [`at four in the morning`, `in the cold of a loading dock`, `before the doors open`, `while the building empties`],
    },
    body: [`{reporter.name} is writing a feature on the show and has found you {hour}, notebook out. One question: who would you thank, and not the stars, but the people who keep the building running.`, `Since dawn, {crew} has been at work, and not one of them has been mentioned in print this season. Several are within earshot, pretending not to listen.`],
    choices: [
      { id: 'names', label: 'Name them one by one, and say what each does', risk: 'low', result: `It takes a full five minutes, and the reporter keeps writing. The next morning a laminated copy of the piece is taped to the wall of the crew room, and someone leaves a coffee on your bag.`, effects: [{ pop: 0.3 }, { conf: 3 }, { fatigue: 2 }] },
      { id: 'carry', label: 'Skip the interview and help carry the cases', risk: 'low', result: `You hand the notebook back and take one end of a road case. The reporter writes about that instead, and the crew pretend they did not notice, which is its own compliment.`, effects: [{ fatigue: 6 }, { conf: 2 }, { pop: 0.3 }] },
      { id: 'general', label: 'Give a quick general thanks and steer back to your match', risk: 'low', result: `It sounds fine in print, a generic line in a long list. The crew read it as exactly what it is.`, effects: [{ pop: 0.4 }] },
      { id: 'joke', label: 'Joke that they should thank you for not breaking anything', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.4 }, text: `The riggers laugh first, and then the whole room, because it is true. The line makes the paper and nobody minds.`, effects: [{ pop: 0.5 }, { conf: 1 }] },
        { weight: 1, text: `It lands as if you think the crew is a punchline. The mood in the room drops, and the next ring check takes suspiciously long.`, effects: [{ pop: -0.4 }, { conf: -2 }, { fatigue: 2 }] } ] },
    ],
  },
  {
    id: 'nd_med_rival_clipping', category: 'media', title: 'A Kind Word from the Wrong Person', weight: 2, cooldownDays: 130, maxPerCareer: 2,
    cast: { rival: { pick: 'rivalry', minHeat: 10 }, interviewer: { pick: 'media', kind: 'interviewer' } },
    memory: { role: 'rival', max: 1 },
    trigger: { mem: [{ role: 'rival', respectGte: 12 }] },
    slots: {
      outlet: [`a trade magazine`, `a late-night radio call`, `a fan newsletter`, `a hallway chat that someone recorded`],
      praise: [`called your matches the hardest ones on the card to work`, `said you made the crowd care about the whole show`, `credited you for what makes the feud work`, `admitted to studying your tapes on long drives`],
    },
    body: [`{interviewer.name} slides a printed page across the table. In {outlet}, {rival.name} {praise}, with no hook and no sarcasm that you can find.`, `You have spent weeks bracing for the other kind of quote. The interviewer watches your face like a poker player, waiting to see what a surprise does to you.`],
    choices: [
      { id: 'return', label: 'Return the compliment sincerely, on the record', risk: 'low', result: `You say the kind thing back, plainly. By evening {rival.first} has heard it and found you in the hall, and something between you quietly loosens.`, effects: [{ rel: { who: 'rival', respect: 5, trust: 3, heat: -4 } }, { rivalry: { who: 'rival', heat: -4 } }, { pop: 0.3 }, { event: { type: 'interview', participants: ['interviewer', 'rival'], summary: 'Returned a rival\'s public compliment.', data: { quality: { base: 64, charisma: 0.4 } } } }] },
      { id: 'suspect', label: 'Suspect a trick and say so', risk: 'med', result: `"Nobody is that nice for free," you tell the camera. The line is funny, and it is also cold, and {rival.first} watches the replay without any expression.`, effects: [{ rel: { who: 'rival', respect: -2, heat: 4 } }, { conf: 1 }, { pop: 0.3 }] },
      { id: 'sell', label: 'Use the quote to sell the next match', risk: 'med', result: `The kind words become a tagline, and ticket requests tick upward. {rival.first} notices you took a gift and wrapped it as an advertisement.`, effects: [{ pop: 0.7 }, { money: 1800 }, { rivalry: { who: 'rival', heat: 3 } }, { rel: { who: 'rival', trust: -2 } }] },
      { id: 'keep', label: 'Fold the page and keep it to yourself', risk: 'low', result: `You put it in a pocket and say nothing. Weeks later {rival.first} hears you kept it, and it matters more than anything you could have said.`, effects: [{ conf: 2 }, { rel: { who: 'rival', affinity: 3 } }] },
    ],
  },
  // ===================================================================== PODCAST
  {
    id: 'nd_pod_open_promise', category: 'podcast', title: 'The Host Has Your Words Printed Out', weight: 2.5, cooldownDays: 70, maxPerCareer: 4,
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 2008, promise: 'open', stat: { popularity: { gte: 20 } } },
    slots: {
      show: [`a Monday night call-in show`, `a long-form interview podcast`, `a fan-run weekly roundtable`, `a late-night comedy wrestling show`],
      pressure: [`with a countdown clock on the wall`, `with the chat scrolling beside the microphone`, `with listeners who keep a running score`, `with a producer holding up a card that says DEADLINE`],
    },
    body: [`{host.name} opens {show}, {pressure}, by reading your own words back to you: "{openPromise}". The host is smiling, but the smile has a clipboard behind it.`, `The listeners are not hostile. They are waiting to find out whether you are the kind of person who keeps the date on the calendar.`],
    choices: [
      { id: 'name_date', label: 'Double down and name an actual date', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.6 }, text: `The studio goes quiet, then the chat explodes. A deadline said out loud sounds like a dare, and the dare sells tickets.`, effects: [{ pop: 1.0 }, { conf: 3 }] },
        { weight: 1, text: `The date comes out a week too soon and you hear the host's pen scratch. Listeners will have it circled before the episode ends.`, effects: [{ pop: 0.3 }, { conf: -3 }, { fatigue: 3 }] } ],
        effects: [{ promise: { kind: 'win_title', text: 'I will win a championship before the summer is out', deadlineDays: 120 } }, { event: { type: 'podcast', participants: ['host'], summary: 'Set a hard date on a public promise.', data: { quality: { base: 64, mic: 0.5, conf: 0.3, noise: 10 }, viral: { minQuality: 84, chance: 0.3 } } } }] },
      { id: 'patience', label: 'Ask the fans for patience, and mean it', risk: 'low', result: `You say you are working, and that the work takes longer than the posters suggest. A few listeners write in to say they would rather have honesty than a date.`, effects: [{ pop: 0.2 }, { conf: 1 }] },
      { id: 'admit', label: 'Admit you may have promised more than you could control', risk: 'med', result: `The words cost you something, and the host does not try to rescue you. The episode becomes the one people quote when they want to prove that wrestlers can be human.`, effects: [{ pop: 0.4 }, { conf: -2 }, { fatigue: -2 }] },
      { id: 'laugh', label: 'Laugh it off as something said in the heat of the moment', risk: 'low', result: `Everybody chuckles, nobody believes it, and the host marks the next show to ask again. The dodge buys you a week of peace.`, effects: [{ pop: -0.2 }, { conf: 1 }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'nd_pod_broken_promise', category: 'podcast', title: 'The Sad Trombone Round', weight: 2.5, cooldownDays: 70, maxPerCareer: 4,
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 2008, promise: 'broken', stat: { popularity: { gte: 20 } } },
    slots: {
      manner: [`gently, as if reading from a hospital chart`, `with a raised eyebrow and a pile of printed clips`, `while the engineer plays a sad trombone`, `without any music or a joke, which is worse`],
      show: [`a morning drive-time show`, `a podcast recorded in a spare bedroom`, `a fan roundtable with a sponsor reading in the middle`, `a late-night call-in show`],
    },
    body: [`On {show}, {host.name} reminds you, {manner}, of what you said not long ago: "{brokenPromise}". It did not happen, and everyone listening knows it.`, `There is no gotcha in the question, only a long pause, and the pause is doing most of the damage. How you fill it will decide how this episode is remembered.`],
    choices: [
      { id: 'own_it', label: 'Own the miss in plain words, with no excuses', risk: 'low', result: `Four sentences, none of them defensive, and the host softens visibly. The comment section is full of people saying they have missed their own goals this year too.`, effects: [{ pop: 0.4 }, { conf: -1 }, { event: { type: 'podcast', participants: ['host'], summary: 'Owned a missed promise in plain words.', data: { quality: { base: 64, charisma: 0.4, noise: 8 }, handled: true } } }] },
      { id: 'blame', label: 'Blame the booking and the circumstances', risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.5 }, text: `You frame it as a story of bad luck and a locked door, and the host nods along. The excuse works this time, and you can feel how thin it is.`, effects: [{ pop: 0.1 }, { conf: 1 }] },
        { weight: 2, text: `It lands as exactly what it is, and the host quietly rolls the clip of your original words. The office hears about the blame before the episode finishes.`, effects: [{ pop: -0.8 }, { conf: -3 }, { money: -1000 }] } ] },
      { id: 'roast', label: 'Lean into the roast and play the trombone yourself', risk: 'med', result: `You take the joke and make it bigger, narrating your own failure with a showman's glee. People love a wrestler who can laugh at a bad week, though a few say you are not taking it seriously.`, effects: [{ pop: 0.6 }, { conf: 1 }, { mic: 1 }] },
      { id: 'new_pledge', label: 'Promise to win your next three in a row', risk: 'high', result: `The studio gasps, and the producer scrawls the number on a card. You have turned an embarrassment into a fresh bet, with a fresh clock on it.`, effects: [{ promise: { kind: 'win_streak', text: 'I will win my next three matches in a row', params: { n: 3 }, deadlineDays: 60 } }, { pop: 0.5 }, { conf: 2 }, { fatigue: 3 }] },
    ],
  },
  {
    id: 'nd_pod_road_lonely', category: 'podcast', title: 'What the Quiet Sounds Like', weight: 1.5, cooldownDays: 160, maxPerCareer: 2,
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 2008, stat: { careerYears: { gte: 2 }, fatigue: { gte: 35 } } },
    slots: {
      place: [`at three in the morning in a motel room`, `in the dark of a sleeper bus`, `alone in a hotel gym with the lights on timers`, `at a departure gate before dawn`],
      ask: [`whether you ever feel lonely out there`, `whether anyone checks on you between towns`, `what it feels like after the roar stops`, `where the adrenaline goes when it has nowhere to land`],
    },
    body: [`The episode is meant to be fun, but {host.name} lowers the microphone and asks about {ask}. You have thought about this moment {place}, and never once answered the question out loud.`, `The red recording light keeps shining. The host does not rush to fill the quiet, which is a courtesy and also a trap.`],
    choices: [
      { id: 'honest', label: 'Tell the truth about how empty it can get', risk: 'med', result: `You describe the silence after a big night, the cold sandwich, the phone with nobody to call. The host does not joke, and the clip travels among fans who know exactly what you mean.`, effects: [{ pop: 0.6 }, { conf: -1 }, { fatigue: -3 }, { event: { type: 'podcast', participants: ['host'], summary: 'Spoke honestly about loneliness on the road.', data: { quality: { base: 66, charisma: 0.5, noise: 6 }, viral: { minQuality: 88, chance: 0.3 } } } }] },
      { id: 'tough', label: 'Brush it off: the road is the job', risk: 'low', result: `You smile and say you love every mile. The host takes it at face value, and you hold the smile a beat too long after the red light goes off.`, effects: [{ pop: 0.1 }, { conf: 1 }, { fatigue: 3 }] },
      { id: 'shout_out', label: 'Name the friends in the locker room who keep you steady', risk: 'low', result: `You list the people who share their snacks, who knock on your door, who call at midnight to say nothing in particular. At least two of them hear the episode and send you a message with only a thumbs-up.`, effects: [{ conf: 3 }, { pop: 0.3 }, { fatigue: -2 }] },
      { id: 'joke', label: 'Turn it into a bit about motel ice machines', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5 }, text: `The bit about the ice machine that sounds like a dying walrus is genuinely funny, and the host loses it. For ten minutes the honest question is forgotten, and you are relieved.`, effects: [{ pop: 0.6 }, { conf: 1 }] },
        { weight: 1, text: `The joke arrives half a second too fast, and the host hears the avoidance in it. The next question is gentler and the episode goes flat.`, effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
    ],
  },
  {
    id: 'nd_pod_caller_stings', category: 'podcast', title: 'A Caller Who Does Not Clap', weight: 2, cooldownDays: 120, maxPerCareer: 3,
    cast: { host: { pick: 'media', kind: 'host' }, fan: { pick: 'media', kind: 'fan' } },
    trigger: { minYear: 2008, stat: { popularity: { gte: 30 } } },
    slots: {
      manner: [`quietly`, `angrily`, `with a cracking voice`, `cheerfully, which is somehow worse`],
      complaint: [`you stopped being fun to watch`, `you were the reason they brought their kid into wrestling, and now they do not know why`, `your matches look like they are on autopilot`, `you used to talk to the crowd and now you only perform at it`],
    },
    body: [`The call-in line has been all praise until {host.name} lets {fan.name} through. The caller says, {manner}, that {complaint}.`, `The host mutes nothing and waits for you. Somewhere behind the glass an engineer stops typing, and the silence in your headphones is much larger than the room.`],
    choices: [
      { id: 'listen', label: 'Say they have a point and ask what they miss', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `The caller falters, then describes in detail what made them love your work, down to the way you used to pause before a big move. By the end they are laughing, and half the audience is writing it down.`, effects: [{ pop: 0.8 }, { conf: 1 }, { event: { type: 'podcast', participants: ['host', 'fan'], summary: 'Heard out a critical caller with grace.', data: { quality: { base: 66, charisma: 0.5, noise: 8 }, viral: { minQuality: 85, chance: 0.3 } } } }] },
        { weight: 1, text: `The caller has nothing more to say than the complaint, and the call ends with an awkward click. You are left feeling worse than before and with no clear lesson.`, effects: [{ conf: -3 }, { pop: -0.1 }] } ] },
      { id: 'defend', label: 'Defend your recent work, with specifics', risk: 'low', result: `You lay out the nights, the finishes and the crowd reactions with calm precision. The caller is not convinced, but the other listeners are, and the host nods like a referee counting a pin.`, effects: [{ conf: 2 }, { pop: 0.1 }] },
      { id: 'invite', label: 'Invite the caller to the next show', risk: 'med', result: `You arrange a seat and a hello, and the line goes quiet with surprise. It costs a ticket and an awkward ten minutes, and it makes a small, true story to tell.`, effects: [{ money: -400 }, { pop: 0.5 }, { conf: 1 }, { fatigue: 1 }] },
      { id: 'snap', label: 'Snap that nobody pays to hear that', risk: 'high', outcomes: [
        { weight: 1, bonus: { confidence: 0.5 }, text: `The line is rude and thrilling. Half the listeners cheer the fire they have been waiting for, and the clip of the exchange makes the rounds.`, effects: [{ pop: 0.7 }, { conf: 2 }] },
        { weight: 2, text: `It sounds exactly like a person who cannot take criticism. The host cuts to a commercial, and the comment sections are not kind for days.`, effects: [{ pop: -1.0 }, { conf: -3 }] } ] },
    ],
  },
  {
    id: 'nd_pod_rookie_advice', category: 'podcast', title: 'Advice for Somebody Younger', weight: 1.5, cooldownDays: 160, maxPerCareer: 3,
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 2008, stat: { careerYears: { gte: 3 }, popularity: { gte: 35 } } },
    slots: {
      show: [`a show run out of a training school`, `a podcast hosted by a retired referee`, `a student radio station`, `a patched-together show recorded in the back of a van`],
      age: [`nineteen`, `twenty-two`, `twenty-five`, `thirty`],
    },
    body: [`The host of {show} gives you the softest pitch of the year: if you could say one thing to the {age}-year-old who wants this life, what would it be? Three trainees are crowded around the microphone, and one of them has brought a notebook.`, `They are not interviewing you. They are waiting for permission, or for someone to tell them the truth before the business does.`],
    choices: [
      { id: 'warn', label: 'Tell them about the money, the pain and the nights alone', risk: 'low', result: `You do not soften any of it, and one of the trainees stops writing and just listens. Afterwards a veteran trainer sends a note that says only: someone had to.`, effects: [{ conf: 2 }, { pop: 0.3 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 2 }] },
      { id: 'hype', label: 'Hype them up and tell them to chase the dream', risk: 'med', result: `The room cheers, and the notebook is thrown in the air. A few of those kids will quit within a year, and none of them will remember who sold them the sunshine.`, effects: [{ pop: 0.6 }, { conf: 1 }, { fatigue: 1 }] },
      { id: 'self_mock', label: 'Tell a story at your own expense', risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The story about the ladder, the borrowed gear and the deposit never returned makes the trainees howl with laughter. Under the laugh is the lesson, and you let it sit there.`, effects: [{ pop: 0.5 }, { conf: 2 }] },
        { weight: 1, text: `The story drags and your timing goes soft in the middle. The kids are kind about it, which only makes it worse.`, effects: [{ pop: 0.1 }, { conf: -2 }] } ] },
      { id: 'plug', label: 'Plug your merchandise and your next appearance', risk: 'low', result: `The kids look slightly deflated, and the host recovers with a joke. A sponsor is happy, and your card in the back of the van stays slightly warm.`, effects: [{ money: 2200 }, { pop: 0.1 }, { conf: -1 }] },
    ],
  },
  {
    id: 'nd_pod_rank_roster', category: 'podcast', title: 'A Ranking Game with Your Name in It', weight: 2, cooldownDays: 110, maxPerCareer: 3,
    cast: { host: { pick: 'media', kind: 'host' }, rival: { pick: 'rivalry', minHeat: 10 } },
    memory: { role: 'rival', max: 1 },
    trigger: { minYear: 2008, stat: { popularity: { gte: 30 } } },
    slots: {
      game: [`a game of Keep, Cut or Crown`, `a tier list drawn on a whiteboard`, `a round of one-word reviews`, `a draft where you pick a tag partner`],
      twist: [`with a buzzer for every wrong answer`, `while the chat votes in real time`, `against a kitchen timer`, `with a producer eating something very loud`],
    },
    body: [`{host.name} springs {game} on you, {twist}. Around the fourth question, {rival.name} appears on the card, and the host leans forward with delight.`, `Whatever you say is going to be in {rival.their} inbox before the end of the hour. The audience knows the history, even if the host pretends otherwise.`],
    choices: [
      { id: 'rank_high', label: 'Put {rival.first} near the top and explain why', risk: 'low', result: `You give the reasons plainly and without a barb: the timing, the toughness, the way {rival.first} makes a crowd believe. The host looks almost disappointed, and then impressed.`, effects: [{ rel: { who: 'rival', respect: 5, heat: -4 } }, { pop: 0.3 }, { event: { type: 'podcast', participants: ['host', 'rival'], summary: 'Ranked {rival.name} highly on a podcast game.', data: { quality: { base: 62, charisma: 0.4 } } } }] },
      { id: 'rank_low', label: 'Bury {rival.first} at the bottom with a flourish', risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.6 }, text: `You reduce {rival.first} to a single, funny, savage word, and the host whoops. The clip circulates within the hour.`, effects: [{ pop: 0.9 }, { rivalry: { who: 'rival', heat: 8 } }, { rel: { who: 'rival', heat: 8, respect: -2 } }] },
        { weight: 1, text: `The word you choose is meaner than you intended. Even the host winces, and the audience hears a person who cannot be generous.`, effects: [{ pop: -0.3 }, { rivalry: { who: 'rival', heat: 6 } }, { rel: { who: 'rival', heat: 8 } }, { conf: -2 }] } ] },
      { id: 'refuse', label: 'Refuse to rank anyone in the locker room', risk: 'low', result: `You say you will not play the game with people you work with, and mean it. The host sulks for a minute, but the next morning several people in the building thank you quietly.`, effects: [{ conf: 2 }, { pop: -0.1 }, { rel: { who: 'rival', respect: 2 } }] },
      { id: 'self_last', label: 'Rank yourself last and make a bit of it', risk: 'med', result: `You explain, with great pomp, why the person behind the microphone is the least trustworthy of all. The host cries with laughter, and the listeners feel they have seen the human behind the persona.`, effects: [{ pop: 0.5 }, { conf: -1 }, { mic: 1 }] },
    ],
  },
  {
    id: 'nd_pod_slump_question', category: 'podcast', title: 'Is This a Slump or Is This You?', weight: 2.5, cooldownDays: 90, maxPerCareer: 3,
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 2008, recent: { lossesGte: 3 }, stat: { popularity: { gte: 20 } } },
    slots: {
      line: [`Is this a slump, or is this who you are now?`, `What do you tell yourself on the drive home?`, `Has anyone in the office said anything to you?`, `Do you still believe the numbers will turn?`],
      show: [`a long-running Sunday show`, `a podcast with a loyal, merciless audience`, `a morning radio hit`, `a roundtable hosted by two former wrestlers`],
    },
    body: [`The losses have been stacking up on the weekly cards, and {host.name} on {show} does not pretend otherwise. The question is quiet, almost kind: "{line}"`, `You have a pre-written answer about learning and resilience. The audience, however, can smell a pre-written answer from three counties away.`],
    choices: [
      { id: 'honest', label: 'Admit the losses have shaken your confidence', risk: 'med', result: `You say it was easier to be sure when you were winning, and that you are working on it. The honesty hurts, and the listeners reply in their thousands with their own stories of bad years.`, effects: [{ pop: 0.5 }, { conf: -2 }, { fatigue: -2 }, { event: { type: 'podcast', participants: ['host'], summary: 'Admitted a losing streak had shaken confidence.', data: { quality: { base: 64, charisma: 0.4, noise: 8 }, handled: true } } }] },
      { id: 'pledge', label: 'Vow to win your next two matches', risk: 'high', result: `The line is bold and the host does not let you take it back. Now there is a clock on your recovery, and every loser's lament has a time stamp.`, effects: [{ promise: { kind: 'win_streak', text: 'I will win my next two matches', params: { n: 2 }, deadlineDays: 40 } }, { pop: 0.6 }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'blame_booking', label: 'Hint that the booking has not been fair', risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.4 }, text: `The hint lands with the listeners who already resent the office, and it earns a wave of sympathy. It also lands with the office.`, effects: [{ pop: 0.6 }, { conf: 1 }, { money: -1500 }] },
        { weight: 2, text: `It sounds like an excuse with a grudge attached. The host points out the numbers, gently, and the segment goes sour.`, effects: [{ pop: -0.6 }, { conf: -3 }, { money: -1500 }] } ] },
      { id: 'joke', label: 'Joke that you are only warming up for the big one', risk: 'low', result: `A chuckle from the host and a groan from the chat. The line neither wins nor loses you anything, which is what you were hoping for.`, effects: [{ conf: 1 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'nd_pod_legend_guest', category: 'podcast', title: 'The Legend in the Next Chair', weight: 1.5, cooldownDays: 200, maxPerCareer: 2,
    cast: { host: { pick: 'media', kind: 'host' }, legend: { pick: 'roster', tier: { gte: 4 } } },
    trigger: { minYear: 2008, stat: { popularity: { gte: 25 } } },
    slots: {
      state: [`leaning on a cane`, `wearing a hospital wristband from the day before`, `with a hearing aid that whistles`, `pausing between every few sentences`],
      topic: [`how a crowd used to feel before cameras were everywhere`, `what the dressing room smelled like in the old days`, `the last time they were truly afraid in a ring`, `the matches that no tape survives of`],
    },
    body: [`{host.name} has paired you with {legend.name} for a joint episode, and the legend is {state}. The legend begins to tell you about {topic}, and the microphones pick up the creak of an old chair and a very long memory.`, `The host looks at you with a quiet panic. The best thing in the room is not you, and everybody knows it.`],
    choices: [
      { id: 'listen', label: 'Stay quiet and let the legend talk', risk: 'low', result: `You say perhaps six sentences in forty minutes, and none are about you. At the end {legend.first} squeezes your forearm and says something that you will not repeat to anyone.`, effects: [{ conf: 3 }, { pop: 0.4 }, { fatigue: 2 }, { rel: { who: 'legend', respect: 5, affinity: 4 } }] },
      { id: 'banter', label: 'Match the legend joke for joke', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.6 }, text: `The two of you trade barbs about hair, knees and bad managers, and the host is wiping tears. It is the funniest episode of the season and a little bit of a rescue of a tired afternoon.`, effects: [{ pop: 0.9 }, { conf: 2 }, { rel: { who: 'legend', respect: 3 } }] },
        { weight: 1, text: `One joke crosses a line you did not see, and the legend goes silent for a long moment. The rest of the episode is kind but careful.`, effects: [{ pop: 0.1 }, { conf: -3 }, { rel: { who: 'legend', respect: -4 } }] } ] },
      { id: 'ask_advice', label: 'Ask {legend.first} for real advice on the air', risk: 'low', result: `The legend takes the question seriously and gives three hard, practical lessons. Afterwards {legend.they} offers to look at your footage, and you realise something has begun.`, effects: [{ tag: { who: 'legend', tag: 'mentor' } }, { rel: { who: 'legend', respect: 4, trust: 3 } }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 3 }] },
      { id: 'gesture', label: 'Quietly pay for the legend\'s travel and hotel', risk: 'low', result: `You settle the bill before anyone can protest, and the host pretends not to notice. The legend finds out, and does not mention it, which is how you know it mattered.`, effects: [{ money: -2200 }, { conf: 3 }, { rel: { who: 'legend', respect: 4, affinity: 5 } }] },
    ],
  },
  // ===================================================================== PRESS
  {
    id: 'nd_prs_countdown_column', category: 'press', title: 'The Days Are Being Counted', weight: 2.5, cooldownDays: 80, maxPerCareer: 4,
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { promise: 'open', stat: { popularity: { gte: 20 } } },
    slots: {
      room: [`a hotel ballroom with a hundred folding chairs`, `a basement room under the arena`, `a hallway scrum under a flickering light`, `a ringside media table with water glasses`],
      manner: [`politely`, `for the third time this month`, `at the same time as two other reporters`, `while holding a stopwatch`],
    },
    body: [`In {room}, {reporter.name} asks {manner} what the plan is for your public vow: "{openPromise}". The reporter has been running a small weekly column that counts the days down, and it is not a flattering clock.`, `Microphones lean in, and a camera operator shifts for a better angle on your face. Whatever you say next gets pasted under the countdown.`],
    choices: [
      { id: 'plan', label: 'Lay out the plan in concrete detail', risk: 'low', result: `You walk them through the training, the opponents and the weak points you intend to fix. It is less dramatic than a boast, and the next column is one line shorter and a degree warmer.`, effects: [{ pop: 0.3 }, { conf: 2 }, { fatigue: 3 }, { event: { type: 'press_conference', participants: ['reporter'], summary: 'Laid out a concrete plan to keep a public promise.', data: { quality: { base: 62, conf: 0.3, mic: 0.3 } } } }] },
      { id: 'swagger', label: 'Swagger: it will be done early and loudly', risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.6 }, text: `The room laughs with you, not at you, and the quote runs under a large headline. For a day, you are the man who cannot be rattled.`, effects: [{ pop: 0.9 }, { conf: 3 }] },
        { weight: 1, text: `The swagger arrives without the evidence, and a reporter at the back mutters the number of days still left. The mood drops, and so does your sleep that night.`, effects: [{ pop: -0.4 }, { conf: -3 }, { fatigue: 2 }] } ] },
      { id: 'hold_me', label: 'Ask the reporter to keep counting and hold you to it', risk: 'med', result: `The reporter blinks, then smiles and writes it down. An odd alliance forms between watcher and subject, and the column carries your name with something close to affection.`, effects: [{ pop: 0.4 }, { conf: 1 }, { charisma: 1 }] },
      { id: 'no_repeat', label: 'Decline to repeat yourself and end the questions', risk: 'low', result: `"I said it once." The quote is crisp, and the silence afterward is awkward. Reporters write that you are tense, and perhaps you are.`, effects: [{ pop: -0.3 }, { conf: 1 }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'nd_prs_passed_over', category: 'press', title: 'A Question About Someone Else\'s Shot', weight: 2.5, cooldownDays: 120, maxPerCareer: 3, major: true,
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { holdsTitle: false, stat: { popularity: { gte: 40 } } },
    slots: {
      angle: [`someone with fewer wins has been handed the shot`, `the office announced the match without mentioning your name`, `the new challenger is half your age`, `fans have started a petition on your behalf`],
      scene: [`outside the elevator`, `on a folding chair under hot lights`, `in the arena parking lot`, `at the end of a long media line`],
    },
    body: [`{reporter.name} finds you {scene} and says, in the soft voice of someone about to do something unkind, that {angle}. Does it hurt, the reporter wants to know, to watch that door close?`, `It does. Everyone in the room can see that it does, and the reporter is waiting to learn what you will do with the pain.`],
    choices: [
      { id: 'grace', label: 'Answer with grace and say your time is coming', risk: 'low', result: `You congratulate the challenger by name and say you will be ready when the door opens. The line gets praise from the veterans and a warmer look from the fans.`, effects: [{ pop: 0.5 }, { conf: -1 }, { fatigue: 1 }] },
      { id: 'anger', label: 'Let the anger show, plainly and loudly', risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.5 }, text: `You lay out the case with fury and clarity, and the clip is replayed all weekend. The crowd chants your name, and the office hates it.`, effects: [{ pop: 1.0 }, { conf: 2 }, { money: -2000 }] },
        { weight: 1, text: `The rant runs on, and by the end you are shouting at a camera operator. Management fines you for the language and the optics.`, effects: [{ pop: -0.4 }, { conf: -3 }, { money: -3000 }] } ] },
      { id: 'demand', label: 'Demand the next shot by name, on the record', risk: 'high', result: `You speak slowly so the quote cannot be trimmed: you want the next shot, and you will earn it. The line becomes a promise whether the office likes it or not.`, effects: [{ promise: { kind: 'win_title', text: 'I will earn the next title shot and win it', deadlineDays: 150 } }, { pop: 0.6 }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'shrug', label: 'Shrug it off and say it is just a job', risk: 'low', result: `The reporter looks disappointed and writes that you seemed resigned. You retire to your hotel room and think about whether the line was a lie or just a tired truth.`, effects: [{ conf: -3 }, { pop: -0.2 }, { fatigue: -3 }] },
    ],
  },
  {
    id: 'nd_prs_tour_grind', category: 'press', title: 'Is the Schedule Sustainable?', weight: 2, cooldownDays: 100, maxPerCareer: 3,
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { stat: { fatigue: { gte: 55 }, popularity: { gte: 20 } } },
    slots: {
      grind: [`six towns in six nights`, `three long flights in a week`, `a double-header every weekend this month`, `a week of morning radio before every show`],
      tone: [`sympathetic`, `suspicious`, `blunt`, `curious`],
    },
    body: [`You can feel it in your hands before you can say it, and {reporter.name} can see it in your face. The reporter is {tone} about a stretch of {grind}, and wants to know if the pace is something you would call sustainable.`, `A truthful answer is a criticism of your employer, and a polite one is a lie. There is also a third option, which is to say nothing and hope your body is quieter.`],
    choices: [
      { id: 'honest', label: 'Say honestly that the pace is wearing everyone down', risk: 'med', result: `You describe the sleepless trips and the tape on the knees without naming a single name. The story becomes a conversation among wrestlers, and the office quietly adjusts one flight.`, effects: [{ pop: 0.6 }, { conf: 2 }, { fatigue: -4 }, { money: -1500 }, { event: { type: 'press_conference', participants: ['reporter'], summary: 'Spoke candidly about the touring schedule.', data: { quality: { base: 64, conf: 0.4 }, controversy: true } } }] },
      { id: 'line', label: 'Give the company line about being grateful for the work', risk: 'low', result: `The words are correct and bland, and the reporter writes them down with a flat face. The office sends a short note of thanks.`, effects: [{ money: 1500 }, { conf: -1 }, { fatigue: 3 }] },
      { id: 'boast', label: 'Boast that the grind is what separates the real ones', risk: 'med', result: `You call the schedule a test and your body a machine. The fans love it, and the next three nights prove how badly the machine needs oil.`, effects: [{ pop: 0.6 }, { conf: 2 }, { fatigue: 6 }] },
      { id: 'joke', label: 'Joke that sleep is something wrestlers do after retirement', risk: 'low', outcomes: [
        { weight: 2, bonus: { mic: 0.4 }, text: `The room laughs and the line makes the evening bulletin. A few older wrestlers send you rueful messages that say: too true.`, effects: [{ pop: 0.4 }, { fatigue: 2 }] },
        { weight: 1, text: `The joke lands badly with someone who actually lost sleep over a family emergency. You never knew, and you learn about it three days later.`, effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
    ],
  },
  {
    id: 'nd_prs_kid_reporter', category: 'press', title: 'The Best Question of the Day', weight: 1.5, cooldownDays: 160, maxPerCareer: 2,
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { stat: { popularity: { gte: 25 } } },
    slots: {
      paper: [`a school newspaper`, `a library newsletter`, `a scout troop zine`, `a youth sports page`],
      question: [`Do you ever get scared before you walk out?`, `Do the chairs actually hurt?`, `Have you ever wanted to quit?`, `Who was your hero when you were my age?`],
    },
    body: [`Between two grown men with recorders and one with a phone, a child with a notebook from {paper} puts a hand in the air. {reporter.name} lets the kid go first, and the question is: "{question}"`, `The older reporters smile in the way they do before a pitch has been thrown. This one will not be answered by a catchphrase, and the kid is staring at you with undisguised hope.`],
    choices: [
      { id: 'truth', label: 'Answer for real, the way you would to a friend', risk: 'low', result: `You get down on one knee so you are level with the kid, and you tell the truth in plain words. The older reporters quietly put their pens down, and the kid writes for a very long time.`, effects: [{ pop: 0.6 }, { conf: 3 }, { fatigue: 1 }, { event: { type: 'press_conference', participants: ['reporter'], summary: 'Answered a child reporter honestly.', data: { quality: { base: 66, charisma: 0.5 }, viral: { minQuality: 86, chance: 0.2 } } } }] },
      { id: 'kayfabe', label: 'Stay in character and growl a great answer', risk: 'low', result: `You perform a snarl and a snarky reply, and the kid grins with delight. It is a memory, but not a very personal one, and you move on to the next question.`, effects: [{ pop: 0.4 }, { conf: 1 }] },
      { id: 'joke', label: 'Turn it into a joke about your terrible knees', risk: 'low', result: `The kid giggles and the room relaxes, and a better answer goes unspoken. You tell yourself it was a kindness.`, effects: [{ pop: 0.3 }, { fatigue: -1 }] },
      { id: 'invite', label: 'Invite the kid and a parent to watch backstage', risk: 'med', result: `You arrange a pass and an escort, and it takes a few phone calls you would rather not have made. On Sunday, a letter arrives in crayon, and you keep it.`, effects: [{ money: -300 }, { pop: 0.7 }, { conf: 3 }, { fatigue: 3 }] },
    ],
  },
  {
    id: 'nd_prs_hometown', category: 'press', title: 'A Reporter from Home', weight: 1.5, cooldownDays: 180, maxPerCareer: 2,
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { stat: { popularity: { gte: 30 }, careerYears: { gte: 1 } } },
    slots: {
      event: [`a parade`, `a fundraiser for the fire station`, `a ribbon-cutting at the rec centre`, `a scholarship dinner`],
      place: [`the high school gym`, `the diner on Main Street`, `the old training hall`, `the county fairground`],
    },
    body: [`The reporter from your hometown weekly has driven four hours with a camera and an offer: the whole town has been asking whether you will come home for {event}. It would be held in {place}, and the organisers have kept a chair with your name on it.`, `Home has changed since you left, and so have you. Part of you wants to show up, and part of you wants to be somewhere that nobody remembers you from before.`],
    choices: [
      { id: 'go', label: 'Promise to come, whatever it costs', risk: 'med', result: `You say yes before you have checked the calendar, and the reporter beams. The trip will cost you sleep and several hundred dollars, and a town will remember it.`, effects: [{ pop: 0.6 }, { conf: 3 }, { money: -2500 }, { fatigue: 6 }, { event: { type: 'press_conference', participants: ['reporter'], summary: 'Promised to return to the hometown.', data: { quality: { base: 62, charisma: 0.4 } } } }] },
      { id: 'video', label: 'Send a recorded message and a signed jersey', risk: 'low', result: `The message plays on a projector to a full room, and the jersey sells for a good amount at auction. It is kind and efficient, and not the same as being there.`, effects: [{ pop: 0.2 }, { conf: 1 }, { money: -300 }] },
      { id: 'honest_no', label: 'Say honestly that the schedule makes it impossible', risk: 'low', result: `The reporter takes it graciously, and the paper prints the reason along with your thanks. Some neighbours take the news hard, and you spend that evening feeling like a stranger.`, effects: [{ conf: -2 }, { pop: -0.1 }, { fatigue: -1 }] },
      { id: 'benefit', label: 'Offer to bring the whole show home for a benefit card', risk: 'high', outcomes: [
        { weight: 2, bonus: { popularity: 0.5 }, text: `The office signs off, the gym sells out, and the old women who taught you to sing in church sit in the front row. The night raises serious money for the town.`, effects: [{ pop: 1.1 }, { conf: 4 }, { money: -1500 }, { fatigue: 8 }] },
        { weight: 1, text: `The office says no, and you have already told the whole town yes. The retreat is humiliating, and the paper prints that too.`, effects: [{ pop: -0.5 }, { conf: -4 }] } ] },
    ],
  },
  {
    id: 'nd_prs_return_doubt', category: 'press', title: 'Are You Really Healed?', weight: 2, cooldownDays: 100, maxPerCareer: 3,
    cast: { reporter: { pick: 'media', kind: 'reporter' }, doctor: { pick: 'staff', role: 'doctor' } },
    trigger: { injured: false, stat: { injuries: { gte: 1 }, popularity: { gte: 20 } } },
    slots: {
      worry: [`whether you rushed back to satisfy the schedule`, `whether you are still hiding pain from the doctors`, `whether the office pushed you back too early`, `whether you will ever move like you used to`],
      moment: [`as you step off the training mat`, `in the middle of a hotel lobby`, `outside the doctor\'s office`, `during the first media day since your return`],
    },
    body: [`{reporter.name} asks bluntly about {worry}, {moment}. {doctor.name} stands three metres away with a clipboard, pretending not to hear.`, `You know the honest answer, and you know the safe one, and they are not the same. A hundred fans at home are about to decide how they feel about your body.`],
    choices: [
      { id: 'truth', label: 'Describe truthfully what is healed and what is not', risk: 'low', result: `You list the parts that are better and the parts that remain stubborn, in a voice free of drama. {doctor.first} nods with relief, and the fans seem to feel safer for it.`, effects: [{ pop: 0.4 }, { conf: -1 }, { fatigue: -2 }] },
      { id: 'tough', label: 'Insist that you are one hundred percent', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: `The statement rings with certainty, and the crowd gets louder at the next show. Your body, however, files a complaint the following week.`, effects: [{ pop: 0.7 }, { conf: 3 }, { fatigue: 7 }] },
        { weight: 1, text: `The doctor leans in and whispers something, and the reporter catches it. The story that runs is about concealed pain.`, effects: [{ pop: -0.4 }, { conf: -3 }, { fatigue: 5 }] } ] },
      { id: 'doctor', label: 'Hand the question to the doctor and step back', risk: 'low', result: `You say you trust the medical staff, and {doctor.first} gives a careful, boring, honest answer. It does nothing for your image and everything for your joints.`, effects: [{ conf: 2 }, { fatigue: -3 }, { pop: -0.1 }] },
      { id: 'joke', label: 'Joke that you now have more steel than a bridge', risk: 'low', result: `The reporter laughs, and the fans share the line. Nobody asks the follow-up, which was the point of the joke.`, effects: [{ pop: 0.3 }, { conf: 1 }, { fatigue: 1 }] },
    ],
  },
  {
    id: 'nd_prs_rival_crashes', category: 'press', title: 'An Uninvited Seat at the Table', weight: 2.5, cooldownDays: 90, maxPerCareer: 4, major: true,
    cast: { rival: { pick: 'rivalry', minHeat: 25 }, reporter: { pick: 'media', kind: 'reporter' } },
    memory: { role: 'rival', max: 2 },
    trigger: { rivalry: { minHeat: 25 } },
    slots: {
      entrance: [`strolls in through the back door with a microphone of their own`, `stands up in the third row and starts talking`, `arrives dragging a folding chair`, `takes the empty seat beside you and says nothing`],
      reaction: [`the cameras swing around`, `every reporter stops typing`, `someone drops a coffee`, `the hotel manager hurries toward the door`],
    },
    body: [`The press conference was moving along nicely until {rival.name} {entrance}. Behind you, {reaction}, and {reporter.name} sits up with a grin that would make a vulture proud.`, `This is either a gift or a trap. In either case, the next thirty seconds will be the clip.`],
    choices: [
      { id: 'face_off', label: 'Stand up and meet {rival.first} nose to nose', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: `You do not flinch and you do not speak first. The silence is thick enough to cut, and {rival.first} blinks before you do.`, effects: [{ pop: 1.0 }, { rivalry: { who: 'rival', heat: 12 } }, { rel: { who: 'rival', heat: 8, fear: 3 } }, { conf: 3 }] },
        { weight: 1, text: `A security guard intervenes too late and a table goes over. You are fined for the damage and the footage shows you reacting second.`, effects: [{ pop: 0.3 }, { rivalry: { who: 'rival', heat: 10 } }, { money: -2500 }, { conf: -2 }] } ] },
      { id: 'invite_to_talk', label: 'Pull up a chair and invite {rival.first} to say it', risk: 'med', result: `You slide the second microphone across and let the stranger talk. The words get ugly and sharp, and you counter every one with a patient question, which looks like a winning hand.`, effects: [{ pop: 0.7 }, { rivalry: { who: 'rival', heat: 6 } }, { rel: { who: 'rival', respect: 2 } }, { conf: 2 }, { event: { type: 'press_conference', participants: ['reporter', 'rival'], summary: 'Invited {rival.name} to speak and answered calmly.', data: { quality: { base: 66, mic: 0.5, charisma: 0.3 } } } }] },
      { id: 'walk', label: 'Gather your notes and leave the podium', risk: 'low', result: `You step down without a word and let the empty chair do the talking. The reporters write that you ducked the confrontation, and the fans split on whether it was dignity or fear.`, effects: [{ conf: -2 }, { pop: -0.3 }, { rel: { who: 'rival', respect: -3 } }] },
      { id: 'joke', label: 'Welcome the visitor with a joke and a glass of water', risk: 'med', result: `The line breaks the tension and the room laughs. {rival.first} can only glower, because you have turned the intrusion into a cameo.`, effects: [{ pop: 0.6 }, { rel: { who: 'rival', heat: 5 } }, { conf: 1 }, { mic: 1 }] },
    ],
  },
  {
    id: 'nd_prs_long_run_ceremony', category: 'press', title: 'A Small Ceremony at the Media Table', weight: 1.5, cooldownDays: 220, maxPerCareer: 2,
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { stat: { careerYears: { gte: 8 }, popularity: { gte: 30 } } },
    slots: {
      gift: [`a framed poster signed by the whole crew`, `a sheet cake the size of a ring apron`, `a stack of letters from fans`, `a small banner hung from the rafters`],
      speaker: [`a retired referee`, `the ring announcer`, `a young wrestler who looks terrified`, `a fan who has been to every show in your region`],
    },
    body: [`The company marks your long run with a short, rather awkward ceremony at the media table. From behind a curtain comes {gift}, and {speaker} stumbles through a speech that is much better than they think it is.`, `Afterward, {reporter.name} lowers the camera and asks what you want to be remembered for. It is a simple question, and you realise with a jolt that you have never been asked it.`],
    choices: [
      { id: 'thanks', label: 'Thank the people who made it possible, by name', risk: 'low', result: `You thank the trainers, the referees, the families and the fans who stayed, and your voice wobbles at the third name. Applause starts at the back and does not stop quickly.`, effects: [{ pop: 0.5 }, { conf: 3 }, { fatigue: 2 }, { event: { type: 'press_conference', participants: ['reporter'], summary: 'Gave a heartfelt speech at a career ceremony.', data: { quality: { base: 68, charisma: 0.5 }, viral: { minQuality: 88, chance: 0.2 } } } }] },
      { id: 'forward', label: 'Say the best chapter has not been written yet', risk: 'low', result: `You turn the sentiment into a challenge, and the room cheers. The reporter writes that the veteran is still hungry, and you decide that is worth being.`, effects: [{ pop: 0.5 }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'joke', label: 'Ask to keep the cake and leave the speeches', risk: 'low', result: `The cake is excellent and so are the jokes, and the ceremony ends in laughter instead of tears. Later you wonder if you missed something.`, effects: [{ pop: 0.3 }, { conf: 1 }, { fatigue: -2 }] },
      { id: 'deflect', label: 'Redirect the praise to the crew behind you', risk: 'med', result: `You step aside and push the ring crew into the spotlight. They are mortified and thrilled, and one sends you a handwritten note a week later that you pretend not to treasure.`, effects: [{ pop: 0.2 }, { conf: 3 }] },
    ],
  },
  // ===================================================================== SOCIAL
  {
    id: 'nd_soc_midnight_scroll', category: 'social', title: 'The Scroll After the Show', weight: 2, cooldownDays: 110, maxPerCareer: 3,
    trigger: { minYear: 2010, stat: { fatigue: { gte: 30 }, popularity: { gte: 15 } } },
    slots: {
      hour: [`two in the morning`, `half past one`, `an hour before sunrise`, `just after the last flight lands`],
      trap: [`a thread of strangers ranking your worst matches`, `a side-by-side video of you and a newer talent`, `a comment that says your best days are behind you`, `a fan page that has quietly stopped posting about you`],
    },
    body: [`It is {hour}, the adrenaline is gone, and the room is too quiet. You open the feed to see how the night went and land on {trap}.`, `Your thumb keeps moving, and every swipe makes the room a little smaller. Somewhere in the building across town a friend is surely awake, and you know it.`],
    choices: [
      { id: 'phone_down', label: 'Put the phone face down and make tea', risk: 'low', result: `You turn the screen against the table and stand at the window while the kettle works. The doubt does not leave, but it stops growing, and by four you are asleep.`, effects: [{ fatigue: -6 }, { conf: 1 }] },
      { id: 'raw_post', label: 'Post something raw and honest about the night', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `Three plain sentences about being tired and still grateful go out, and the replies are tender. Strangers who carry the same bad nights write to say you are not alone.`, effects: [{ pop: 0.8 }, { conf: 2 }, { event: { type: 'social_post', participants: [], summary: 'Posted an honest late-night reflection.', data: { quality: { base: 64, charisma: 0.5, noise: 10 }, viral: { minQuality: 84, chance: 0.35 } } } }] },
        { weight: 1, text: `By morning the post has been clipped, mocked and turned into a joke about wrestlers being sensitive. You delete it, which only adds another round.`, effects: [{ pop: -0.5 }, { conf: -3 }] } ] },
      { id: 'call_friend', label: 'Message a friend in the locker room and ask if they are up', risk: 'low', result: `The reply arrives in under a minute: a picture of a diner menu and the words "Meet me." You eat eggs at three in the morning and talk about nothing, and it is the best part of your week.`, effects: [{ conf: 3 }, { fatigue: 2 }] },
      { id: 'clapback', label: 'Answer the worst comment with a perfect clapback', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.6 }, text: `The reply is short, devastating and wickedly funny, and it travels. It feels good for an hour, until you realise you are still awake and still alone.`, effects: [{ pop: 0.7 }, { conf: 2 }, { fatigue: 3 }] },
        { weight: 1, text: `The commenter turns out to be a fourteen-year-old with a joke account, and the screenshot of your reply makes you look small. You apologise at dawn.`, effects: [{ pop: -0.6 }, { conf: -3 }, { fatigue: 3 }] } ] },
    ],
  },
  {
    id: 'nd_soc_fan_art', category: 'social', title: 'A Drawing in the Inbox', weight: 1.5, cooldownDays: 120, maxPerCareer: 3,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { minYear: 2010, stat: { popularity: { gte: 25 } } },
    slots: {
      work: [`a pencil drawing`, `a hand-knitted doll`, `a charcoal portrait`, `a comic strip in which you save the day`],
      maker: [`a nurse on the night shift`, `a teenager at a kitchen table`, `a retired machinist`, `a girl of nine, helped by her father`],
    },
    body: [`{fan.name}, {maker}, has sent a photograph of {work} of you, with a short message and no request attached. The detail is extraordinary: someone has studied your stance and the tape on your wrist.`, `It is rare to be sent something with nothing wanted in return. You look at it for much longer than you intended.`],
    choices: [
      { id: 'share', label: 'Share it with full credit and a thank-you', risk: 'low', result: `You post the picture, tag the artist and write only: this is the best thing in my inbox this year. The replies pour in, and {fan.first} has more followers by morning than ever before.`, effects: [{ pop: 0.5 }, { conf: 2 }, { event: { type: 'social_post', participants: ['fan'], summary: 'Shared a fan\'s artwork with credit.', data: { quality: { base: 62, charisma: 0.4 } } } }] },
      { id: 'buy', label: 'Ask to buy the original, and pay too much', risk: 'low', result: `You offer a price that makes the reply come back in capital letters. It will hang in your hallway at home, and it will stay there.`, effects: [{ money: -600 }, { conf: 3 }, { pop: 0.2 }] },
      { id: 'write_back', label: 'Write a long, personal reply that takes an hour', risk: 'low', result: `You answer line by line, and add something about why you started. {fan.first} replies with three messages in a row and a row of hearts.`, effects: [{ conf: 3 }, { fatigue: 2 }, { pop: 0.1 }] },
      { id: 'merch', label: 'Ask whether the design could go on a shirt', risk: 'med', result: `The business side comes through, and the offer is generous, but {fan.first} takes a day to reply and the tone has cooled. The shirt does sell, and the money is welcome.`, effects: [{ money: 2400 }, { conf: -2 }, { pop: 0.2 }] },
    ],
  },
  {
    id: 'nd_soc_message_hospital', category: 'social', title: 'The Message That Stopped You in a Hallway', weight: 2, cooldownDays: 180, maxPerCareer: 2,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { minYear: 2010, stat: { popularity: { gte: 25 } } },
    slots: {
      match: [`one night of your matches`, `a clip they replayed every day`, `your entrance music in a pair of cheap headphones`, `a single line from one of your promos`],
      burden: [`a long hospital stay`, `months of treatment`, `the first winter after losing a spouse`, `a year of caring for a sick parent`],
    },
    body: [`The message from {fan.name} arrives while you are standing in a hallway full of road cases. It says plainly that {match} helped them through {burden}, and that they wanted you to know.`, `Nothing in the business prepares you for being someone's lifeline. The hallway noise falls away, and you read it again, and then again.`],
    choices: [
      { id: 'reply', label: 'Reply with your own real words, however long it takes', risk: 'low', result: `You write for forty minutes and delete half of it, and what remains is simple and true. {fan.first} answers that the message is being read aloud to the whole family.`, effects: [{ conf: 3 }, { pop: 0.3 }, { fatigue: 2 }] },
      { id: 'gift', label: 'Send tickets, a signed item and a handwritten note', risk: 'low', result: `A box goes out the next morning with tickets for two, a signed shirt and a card. The package reaches a house where it is badly needed, and no cameras are present.`, effects: [{ money: -700 }, { conf: 3 }, { pop: 0.4 }] },
      { id: 'public', label: 'Ask permission and share the story with the fans', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{fan.first} says yes, and the story moves thousands of people to write their own. The kindness spreads in a way that feels clean.`, effects: [{ pop: 1.0 }, { conf: 1 }, { event: { type: 'social_post', participants: ['fan'], summary: 'Shared a fan\'s story with permission.', data: { quality: { base: 66, charisma: 0.5, noise: 8 }, viral: { minQuality: 82, chance: 0.4 } } } }] },
        { weight: 1, text: `A few commenters accuse you of using someone\'s suffering for attention. Even though the permission was real, you feel the accusation more than the praise.`, effects: [{ pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'private', label: 'Keep it to yourself and carry it into the ring', risk: 'low', result: `You say nothing to anyone and tell no story. That night you work with a different kind of attention, and the match is the quietest, most careful of your year.`, effects: [{ conf: 4 }, { fatigue: 1 }] },
    ],
  },
  {
    id: 'nd_soc_parody_account', category: 'social', title: 'Somebody Is Doing Your Voice', weight: 1.5, cooldownDays: 120, maxPerCareer: 2,
    trigger: { minYear: 2010, stat: { popularity: { gte: 35 } } },
    slots: {
      bit: [`reads your promos in a flat, bored voice`, `dubs your entrance with the sound of kitchen appliances`, `posts your catchphrases as fortune cookie messages`, `keeps a daily tracker called Did They Do It`],
      following: [`forty thousand people`, `a few hundred loyal viewers`, `mostly your fellow wrestlers`, `a surprising number of sponsors`],
    },
    body: [`A parody account has appeared that {bit}, and it is good, which is the worst part. By now {following} follow it, and your own account has fewer replies than the imitation.`, `The jokes are sharp, and some of them are fair. You are being teased in public for the first time, and the only unknown is whether it is affection.`],
    choices: [
      { id: 'embrace', label: 'Reply to the account with a bit of your own', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5 }, text: `Your reply is surprisingly deadpan, and the account answers in kind. A back-and-forth runs all weekend and does more for your image than a month of sensible posts.`, effects: [{ pop: 0.8 }, { conf: 2 }, { event: { type: 'social_post', participants: [], summary: 'Played along with a parody account.', data: { quality: { base: 62, mic: 0.5, noise: 12 }, viral: { minQuality: 80, chance: 0.4 } } } }] },
        { weight: 1, text: `The reply lacks the timing the imitator has, and the fans quietly side with the imitation. You have turned a joke into a contest and lost it.`, effects: [{ pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'report', label: 'Have the account taken down', risk: 'med', result: `The account is gone by lunch, and a wave of protest comes within the hour. You win the technical argument and lose the mood.`, effects: [{ pop: -0.6 }, { conf: 1 }] },
      { id: 'collab', label: 'Reach out and record a bit together', risk: 'low', result: `The person behind the account turns out to be a warm, shy accountant with great comic instincts. The video takes an afternoon, and the money from the sponsor is a bonus.`, effects: [{ pop: 0.9 }, { money: 1200 }, { fatigue: 3 }] },
      { id: 'ignore', label: 'Ignore it and let the joke run out of steam', risk: 'low', result: `You scroll past and say nothing. The joke has a long life, but you keep your dignity and a measure of sleep.`, effects: [{ conf: 1 }, { pop: -0.1 }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'nd_soc_rival_prank', category: 'social', title: '{rival.name} Posts a Joke at Your Expense', weight: 2, cooldownDays: 100, maxPerCareer: 3,
    cast: { rival: { pick: 'rivalry', minHeat: 10 } },
    memory: { role: 'rival', max: 1 },
    trigger: { minYear: 2010, mem: [{ role: 'rival', respectGte: 8 }] },
    slots: {
      prank: [`a video of themselves pretending to be your biggest fan`, `a fake contract signed with a banana`, `a photo of your gym bag redecorated with glitter`, `a list titled Ten Reasons You Cannot Be Trusted with Scissors`],
      reach: [`for the whole roster to see`, `where half the production crew will find it`, `in the group chat of the entire locker room`, `at four in the afternoon, when everyone is bored`],
    },
    body: [`{rival.name} has posted {prank}, {reach}. It is the kind of joke you only make about somebody you have studied closely, and it is a little rude and very funny.`, `Replies are stacking up, and nobody knows which way you will take it. In the middle of a heated feud, a good joke is either a ceasefire or a new weapon.`],
    choices: [
      { id: 'top_it', label: 'Top it with a joke twice as good', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.6 }, text: `Your answer is so exact that {rival.first} laughs out loud in front of an agent. The feed eats up the exchange, and for a day the rivalry feels like a double act.`, effects: [{ pop: 0.9 }, { rel: { who: 'rival', respect: 4, affinity: 3 } }, { event: { type: 'social_post', participants: ['rival'], summary: 'Traded jokes with {rival.name}.', data: { quality: { base: 64, mic: 0.5, noise: 10 }, viral: { minQuality: 82, chance: 0.35 } } } }] },
        { weight: 1, text: `The comeback is a beat too slow and a degree too cruel. {rival.first} stops laughing, and the replies turn into an argument.`, effects: [{ pop: -0.2 }, { rel: { who: 'rival', heat: 7 } }, { conf: -2 }] } ] },
      { id: 'offence', label: 'Take offence and say it was not funny', risk: 'low', result: `Your tone is flat and your reply is short. The room becomes silent, {rival.first} deletes the post, and you are now the one who cannot take a joke.`, effects: [{ rivalry: { who: 'rival', heat: 6 } }, { rel: { who: 'rival', respect: -3 } }, { pop: -0.3 }] },
      { id: 'laugh', label: 'Laugh in the replies and mean it', risk: 'low', result: `A single laughing reply and a thank-you for the effort. {rival.first} sends back a little wave, and the hostility cools several degrees.`, effects: [{ rel: { who: 'rival', respect: 4, heat: -5, affinity: 3 } }, { rivalry: { who: 'rival', heat: -4 } }, { pop: 0.2 }] },
      { id: 'ignore', label: 'Say nothing and save it for the ring', risk: 'low', result: `You hold your fire and tell nobody. When you finally meet {rival.first} in the ring, a short remark of yours silences the building.`, effects: [{ conf: 2 }, { pop: 0.1 }, { fatigue: 1 }] },
    ],
  },
  {
    id: 'nd_soc_fan_poll', category: 'social', title: 'The Poll Has a Winner and It Is Not You', weight: 1.5, cooldownDays: 110, maxPerCareer: 3,
    trigger: { minYear: 2010, stat: { popularity: { gte: 40 } } },
    slots: {
      poll: [`who should hold the top belt`, `who deserves a bigger spot on the card`, `who had the best entrance this year`, `who the fans most want to see in a cage`],
      placing: [`third`, `second, two votes behind a mascot`, `fifth, behind a referee`, `last, by a landslide`],
    },
    body: [`A fan poll about {poll} has been passed around the feed all day, and you have finished {placing}. The results are screenshotted and sent to you by three different colleagues, each with a different emoji.`, `It is only a poll, but it is also the voice of people who pay to be in the building. Your cheeks are warm, and you have time to decide how it looks.`],
    choices: [
      { id: 'humble', label: 'Congratulate the winner and thank everyone who voted', risk: 'low', result: `You post a gracious line and a photograph of the winner's best move. The reaction is warm and a little protective, and several voters announce that they were wrong.`, effects: [{ pop: 0.5 }, { conf: 1 }] },
      { id: 'campaign', label: 'Campaign for a recount, half seriously', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `Your campaign video, with a ludicrous rosette and a vow to review ballots personally, gets a million laughs. The poll is redone, and you jump.`, effects: [{ pop: 1.0 }, { conf: 1 }, { fatigue: 2 }] },
        { weight: 1, text: `The tone is read as sour grapes. The poll stays as it was, and the comments suggest that you have taken the whole thing very personally.`, effects: [{ pop: -0.4 }, { conf: -3 }, { fatigue: 2 }] } ] },
      { id: 'self_roast', label: 'Roast yourself harder than the voters did', risk: 'low', result: `You write the worst review of yourself in history, and the fans adore it. Humility with teeth is its own kind of power.`, effects: [{ pop: 0.6 }, { conf: -1 }, { mic: 1 }] },
      { id: 'use_it', label: 'Use the placing as fuel and tell no one', risk: 'low', result: `You pin the screenshot inside your gym locker. It sits there for weeks, and every rep is a little harder because of it.`, effects: [{ conf: 2 }, { fatigue: 4 }, { attr: { name: 'endurance', delta: 1 } }] },
    ],
  },
  {
    id: 'nd_soc_live_question', category: 'social', title: 'Live, and Somebody Asks the Hard One', weight: 1.5, cooldownDays: 140, maxPerCareer: 3,
    trigger: { minYear: 2010, stat: { popularity: { gte: 30 }, careerYears: { gte: 1 } } },
    slots: {
      format: [`a live video chat`, `an hour of answering questions in the feed`, `a late-night question session with a shaky camera`, `a live chat from a hotel lobby`],
      query: [`Do you ever regret doing this?`, `What was the worst night of your life?`, `Who do you miss the most when you are on the road?`, `What would you do if you could not wrestle tomorrow?`],
    },
    body: [`The questions in {format} have been silly and sweet: favourite snack, favourite town, whether you really sleep in the mask. Then one scrolls past that you cannot pretend not to see: "{query}"`, `Thousands of people are watching a number go up. A pause of three seconds feels like a month.`],
    choices: [
      { id: 'honest', label: 'Answer honestly, even if your voice catches', risk: 'med', result: `You stop smiling and tell the truth for about two minutes. The viewer count dips and then climbs, and the chat fills with people thanking you for being a person.`, effects: [{ pop: 0.7 }, { conf: -1 }, { fatigue: 2 }, { event: { type: 'social_post', participants: [], summary: 'Answered a hard question honestly on a live chat.', data: { quality: { base: 66, charisma: 0.5, noise: 8 }, viral: { minQuality: 86, chance: 0.3 } } } }] },
      { id: 'deflect', label: 'Laugh and move on to a question about snacks', risk: 'low', result: `You give a flawless, easy laugh and go on to the next one. A few viewers notice the swerve, and the chat stays friendly.`, effects: [{ pop: 0.2 }, { conf: 1 }] },
      { id: 'story', label: 'Answer with a funny story that sidesteps the point', risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The story involves a goat, a hotel clerk and a bag of ice, and it brings the house down. Nobody realises you answered a different question.`, effects: [{ pop: 0.6 }, { conf: 1 }] },
        { weight: 1, text: `Halfway through the story you lose the thread, and the chat starts to type in the polite way people do when they notice. You end the chat early.`, effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'end_chat', label: 'Say thank you and end the chat there', risk: 'low', result: `The screen goes dark and you sit holding the phone. A few viewers are unhappy, but more send you messages of understanding.`, effects: [{ conf: 2 }, { pop: -0.2 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'nd_soc_translated_fans', category: 'social', title: 'The Fans Who Learned Your Promo by Heart', weight: 1.5, cooldownDays: 150, maxPerCareer: 2,
    trigger: { minYear: 2010, stat: { popularity: { gte: 40 } } },
    slots: {
      language: [`Spanish`, `Japanese`, `Portuguese`, `German`],
      gift: [`subtitles for an entire promo`, `a cheer written out phonetically on a banner`, `a fan-made dub of your best line`, `a hand-lettered translation of your catchphrase`],
    },
    body: [`A group of fans on the other side of the world has made {gift} in {language}, because they cannot follow your words any other way. They have never seen you in person, and they have never been to a show.`, `It must have taken them dozens of hours. In the feed, the work looks surprisingly warm and surprisingly careful, and you feel a rush of embarrassment at how little you have done to deserve it.`],
    choices: [
      { id: 'learn', label: 'Learn a few lines and reply in their language', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `You practise with a patient colleague and record the line in one take. It is clumsy and charming, and the fans send back a hundred crying emojis and an invitation.`, effects: [{ pop: 0.9 }, { charisma: 1 }, { fatigue: 3 }] },
        { weight: 1, text: `A single mispronounced word turns the line into a joke you did not intend. The fans are kind about it, but the clip lives on, and you laugh louder than anyone.`, effects: [{ pop: 0.4 }, { conf: -1 }, { fatigue: 3 }] } ] },
      { id: 'send_merch', label: 'Ship them a box of merchandise and signed photos', risk: 'low', result: `The package takes three weeks and a customs form. When it arrives, the unboxing video is the most joyful thing you will see all year.`, effects: [{ money: -800 }, { conf: 3 }, { pop: 0.4 }] },
      { id: 'official', label: 'Pitch the office on an official overseas fan outreach', risk: 'med', result: `The office is interested in the numbers and a little wary of the work. A plan is sketched, a meeting booked, and your name is attached to a project that might become something.`, effects: [{ money: 1800 }, { pop: 0.3 }, { conf: -1 }, { fatigue: 4 }] },
      { id: 'thank_only', label: 'Post a short thank-you and leave it there', risk: 'low', result: `A single warm line goes out, and the fans accept it graciously. It is the least you could do, and also, being honest, the most you managed that week.`, effects: [{ pop: 0.2 }, { conf: 1 }] },
    ],
  },
  {
    id: 'nd_soc_name_misused', category: 'social', title: 'Someone Is Using Your Name to Take Money', weight: 2, cooldownDays: 150, maxPerCareer: 2, major: true,
    trigger: { minYear: 2010, stat: { popularity: { gte: 35 } } },
    slots: {
      scam: [`fake meet-and-greet tickets`, `a counterfeit signed photograph`, `a made-up charity fund`, `a bogus giveaway`],
      victim: [`an elderly fan`, `a family saving for a trip`, `a student with a part-time job`, `an entire fan club`],
    },
    body: [`Messages are arriving from fans asking whether {scam} is real, and it is not. An account using your picture has been taking money, and {victim} has already paid.`, `Nobody blames you, but you feel responsible anyway. The people who got hurt were looking for a small piece of something you have, and a stranger held out a hand.`],
    choices: [
      { id: 'warn', label: 'Post a clear public warning with details', risk: 'low', result: `You write it in plain language and pin it to the top of the feed. Reports and refunds start to flow, and the fans thank you for saying it out loud.`, effects: [{ pop: 0.5 }, { conf: 2 }, { fatigue: 3 }, { event: { type: 'social_post', participants: [], summary: 'Warned fans about a scam using their name.', data: { quality: { base: 62, conf: 0.3 }, handled: true } } }] },
      { id: 'reimburse', label: 'Quietly refund the people who were taken', risk: 'med', result: `You ask the fan club to send you the list of names and pay it all out of your own account. Nobody knows who did it, and the money does not come back.`, effects: [{ money: -4500 }, { conf: 4 }, { pop: 0.2 }] },
      { id: 'lawyer', label: 'Hand it to the company\'s lawyers and let them handle it', risk: 'low', result: `The legal department puts out a statement in forty-eight hours, and the account is gone in seventy-two. The victims never hear from you, and it shows.`, effects: [{ money: -800 }, { pop: -0.2 }, { conf: -1 }, { fatigue: -1 }] },
      { id: 'hunt', label: 'Track down the scammer yourself with the fans\' help', risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.3 }, text: `The fans trace the account in a weekend, and the police take it from there. You become something of a folk hero for ruining a crook\'s month.`, effects: [{ pop: 1.1 }, { conf: 3 }, { fatigue: 5 }] },
        { weight: 2, text: `The chase turns up the wrong person, and an innocent family gets harassed in your name. The apology is public, and it is the worst post you have ever written.`, effects: [{ pop: -0.9 }, { conf: -5 }, { fatigue: 4 }] } ] },
    ],
  },
  {
    id: 'nd_soc_veteran_thread', category: 'social', title: 'A Long Post About Young People', weight: 2, cooldownDays: 140, maxPerCareer: 2,
    cast: { vet: { pick: 'roster', tier: { gte: 3 } } },
    trigger: { minYear: 2010, stat: { popularity: { gte: 30 }, careerYears: { gte: 1 } } },
    slots: {
      grievance: [`wrestlers who skip the basics`, `finishers with no story behind them`, `promos read off cue cards`, `young stars who post more than they train`],
      tone: [`sorrowful`, `scathing`, `affectionate in a way that stings`, `oddly poetic`],
    },
    body: [`{vet.name} has published a long, {tone} post about {grievance}, and everybody agrees that the post is about you without saying so. It has been shared a thousand times by the time you read it.`, `There is real knowledge in it, and some real cruelty, and you cannot tell where one stops. Several people in the locker room are watching you read it.`],
    choices: [
      { id: 'respectful', label: 'Reply respectfully and agree with the true parts', risk: 'low', result: `You quote the best line, concede two points and push back gently on the third. {vet.first} replies with a single word, which for {vet.them} is practically a hug.`, effects: [{ rel: { who: 'vet', respect: 5, trust: 3 } }, { pop: 0.4 }, { conf: 1 }] },
      { id: 'clapback', label: 'Fire back that the business has moved on', risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.6 }, text: `The reply is sharp and smart and gets applause from your generation. {vet.first} does not answer, which tells you something.`, effects: [{ pop: 0.9 }, { rel: { who: 'vet', respect: -4, heat: 6 } }, { conf: 2 }] },
        { weight: 2, text: `The older fans pile on, and the replies repeat every cliché about entitled newcomers. You win some followers and lose a surprising number of friends.`, effects: [{ pop: -0.4 }, { rel: { who: 'vet', respect: -6, heat: 8 } }, { conf: -3 }] } ] },
      { id: 'coffee', label: 'Ask {vet.first} for an hour in person and an honest critique', risk: 'med', result: `It takes three attempts and a favour from an agent, but {vet.first} agrees. The hour is bruising, instructive and strangely warm, and you leave with a list.`, effects: [{ rel: { who: 'vet', respect: 6, trust: 4, affinity: 4 } }, { attr: { name: 'technical', delta: 1 } }, { fatigue: 4 }, { conf: -1 }] },
      { id: 'silence', label: 'Say nothing and let the thread burn itself out', risk: 'low', result: `The feed finds another subject by evening. You keep a small, hard knot in your stomach about whether it was right.`, effects: [{ conf: -1 }, { rel: { who: 'vet', respect: -1 } }] },
    ],
  },
  // ===================================================================== FANS
  {
    id: 'nd_fan_handmade_sign', category: 'fans', title: 'A Sign You Cannot Stop Reading', weight: 1.5, cooldownDays: 90, maxPerCareer: 4,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 20 } } },
    slots: {
      sign: [`MY MOTHER SAYS YOU ARE TOO LOUD`, `I TRAVELLED NINE HOURS FOR THIS`, `PLEASE WIN, I BET MY BROTHER A SANDWICH`, `THE DOG NAMED HIMSELF AFTER YOU`],
      seat: [`the front row at the barricade`, `the balcony rail`, `the middle of the standing section`, `the cheap seats at the very back`],
    },
    body: [`Somebody in {seat} is holding a poster board with a message in thick marker: "{sign}". The lettering got cramped on the last word, and the writer has clearly worked on it for days.`, `{fan.name} is waving it at you with both arms and, in a building of ten thousand, has somehow caught your eye. The referee is waiting, and the cameras have a spare second.`],
    choices: [
      { id: 'point', label: 'Point at the sign and play along from the ring', risk: 'low', result: `You take a theatrical step, read the message aloud with deadly seriousness, and bow. The row around {fan.first} erupts, and the poster board becomes a local legend.`, effects: [{ pop: 0.6 }, { conf: 2 }, { fatigue: 1 }] },
      { id: 'backstage', label: 'Have the fan brought backstage after the show', risk: 'low', result: `A crew member finds {fan.first} at the exit and leads them through the curtain. You spend ten minutes signing the poster board, and neither of you says much, because there is not much that needs saying.`, effects: [{ conf: 3 }, { pop: 0.4 }, { fatigue: 3 }] },
      { id: 'in_character', label: 'Stay in character and glare at it with contempt', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `The glare is exquisite, and {fan.first} screams with joy. Everyone near the barricade films the confrontation, and the sign is taken home like a trophy.`, effects: [{ pop: 0.7 }, { conf: 1 }] },
        { weight: 1, text: `The glare reads as real, and {fan.first} lowers the sign, crushed. A woman in the next seat tells you what she thinks of you loudly.`, effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
      { id: 'steal', label: 'Grab the sign and carry it to the announce table', risk: 'med', result: `You vault the barricade, take the sign with a flourish and wave it in the face of the commentators. The segment is a hit, and {fan.first} gets a pass for the next show and a lecture from security.`, effects: [{ pop: 0.9 }, { fatigue: 3 }, { money: -500 }] },
    ],
  },
  {
    id: 'nd_fan_widow_letter', category: 'fans', title: 'A Letter Written Slowly', weight: 1.5, cooldownDays: 180, maxPerCareer: 2,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 25 }, careerYears: { gte: 1 } } },
    slots: {
      letter: [`a typed page in careful, formal sentences`, `a card with a flower pressed inside it`, `three lines on the back of a ticket stub`, `a long handwritten page with smudged ink`],
      bond: [`a spouse who never missed a Friday`, `a brother who taught them the names of the moves`, `a father who saved every programme`, `a husband who could not hear the commentary but loved the crowd`],
    },
    body: [`A letter has been forwarded to you from {fan.name}: {letter}. It says that watching your matches was something {fan.they} did with {bond}, and that since the death, {fan.they} cannot face watching anyone else.`, `Nothing is being asked of you. The writer only wanted somebody to know that on Friday nights an empty chair still faces the screen, and that your entrance music still makes {fan.them} say a name out loud.`],
    choices: [
      { id: 'call', label: 'Find the number and call that evening', risk: 'low', result: `The call lasts an hour and most of it is silence, in the good way. {fan.first} tells you what the missing voice used to shout at the screen, and you laugh until it turns into something else.`, effects: [{ conf: 3 }, { pop: 0.3 }, { fatigue: 3 }] },
      { id: 'write', label: 'Write back by hand and enclose something of yours', risk: 'low', result: `It takes four drafts and the good pen. You send the letter and a worn piece of tape from your wrist, and it is the kind of reply that is kept.`, effects: [{ conf: 2 }, { fatigue: 1 }, { money: -100 }] },
      { id: 'seat', label: 'Reserve a seat at the next local show', risk: 'med', result: `{fan.first} arrives in a best coat, and the empty chair alongside is reserved too. You nod toward it from the ring, and a hand comes to rest on it.`, effects: [{ money: -600 }, { conf: 4 }, { pop: 0.5 }, { fatigue: 3 }] },
      { id: 'office', label: 'Pass the letter to the fan relations office', risk: 'low', result: `The office sends a professional reply with a signed photograph. It is polite and quick, and you wonder what the letter would have done to you if you had read it again.`, effects: [{ fatigue: -1 }, { conf: -1 }] },
    ],
  },
  {
    id: 'nd_fan_heckler', category: 'fans', title: 'The Heckler with Notes', weight: 2, cooldownDays: 70, maxPerCareer: 5,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 25 } } },
    slots: {
      voice: [`a bellowing dad in a bowling shirt`, `a very polite elderly man`, `a teenager with a megaphone made of rolled paper`, `a woman with a cowbell and no mercy`],
      target: [`your hair`, `your entrance music`, `your finishing move`, `your hometown`],
    },
    body: [`Row C has a problem, and the problem is {fan.name}, {voice}. For fifteen minutes the criticism has been about {target}, and it is specific, relentless and, annoyingly, quite funny.`, `The crowd around the heckler has started to turn its head between you both like a tennis match. You have a window to answer before the jokes take over the night.`],
    choices: [
      { id: 'engage', label: 'Engage with the heckler and trade lines', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.7 }, text: `You trade three exchanges, each better than the last, and the heckler is delighted to be beaten. The section applauds both of you, and a producer circles the segment on a notepad.`, effects: [{ pop: 0.9 }, { conf: 2 }, { mic: 1 }] },
        { weight: 1, text: `The heckler has the better lines, and the section roars. You lose the exchange, and the night is a notch less cool for it.`, effects: [{ pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'invite', label: 'Invite the heckler into the ring for a handshake', risk: 'med', result: `{fan.first} climbs through the ropes, shaking, to the biggest cheer of the night. You shake hands, hold up an arm, and the heckler falls strangely silent for the rest of the evening.`, effects: [{ pop: 0.8 }, { conf: 1 }, { fatigue: 2 }] },
      { id: 'ignore', label: 'Ignore it completely and work the match', risk: 'low', result: `You do not look into row C once. The heckler fades under the noise of the match, and the performance is your cleanest in weeks.`, effects: [{ conf: 2 }, { fatigue: 1 }] },
      { id: 'kill_kindness', label: 'Send a free T-shirt over with a note that says nice try', risk: 'low', result: `The shirt lands in {fan.first}'s lap in the seventh row, and the heckler puts it on over the bowling shirt. The rest of the night is oddly gentle.`, effects: [{ money: -150 }, { pop: 0.4 }, { conf: 1 }] },
    ],
  },
  {
    id: 'nd_fan_long_line', category: 'fans', title: 'The Line That Does Not End', weight: 2, cooldownDays: 80, maxPerCareer: 4,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { fatigue: { gte: 40 }, popularity: { gte: 30 } } },
    slots: {
      line: [`three hundred people`, `a line that goes out the door and around the block`, `a thin but steady stream of families`, `a rush that began before the doors opened`],
      request: [`to sign the cast on their arm`, `to say hello to a toy dinosaur`, `to sign a drawing of you losing a match`, `to pose with a cardboard belt`],
    },
    body: [`Your hand has been signing for two hours, and the table still faces {line}. Near the end, {fan.name} reaches the front with a quiet request: {request}.`, `The organiser taps a watch face, and your lower back is making declarations. Whatever you do here, the next hundred people will see it.`],
    choices: [
      { id: 'stay', label: 'Take all the time the request needs', risk: 'low', result: `You turn the whole thing into a small ceremony, with a tape measure and a very serious expression. {fan.first} leaves lit up, and the line behind forgives the delay.`, effects: [{ conf: 3 }, { pop: 0.5 }, { fatigue: 5 }] },
      { id: 'tempo', label: 'Keep the pace and be warm in thirty seconds', risk: 'low', result: `You sign, smile and meet the eyes of every person for as long as you can. The line keeps moving, and nobody leaves disappointed.`, effects: [{ pop: 0.3 }, { fatigue: 2 }] },
      { id: 'tickets', label: 'Hand over tickets for next time and move on', risk: 'low', result: `The tickets are a polite way of saying not now, and {fan.first} takes them with good grace. It feels like a transaction, and the line behind feels it too.`, effects: [{ money: -250 }, { pop: 0.1 }, { fatigue: 1 }, { conf: -1 }] },
      { id: 'cut_short', label: 'Call for a break and take twenty minutes alone', risk: 'med', result: `You sit in a stairwell with a bottle of water and your eyes closed. The line grumbles, and the organiser files a complaint, but you finish the signing session with a body that works.`, effects: [{ fatigue: -6 }, { pop: -0.3 }, { conf: 1 }] },
    ],
  },
  {
    id: 'nd_fan_quiet_critic', category: 'fans', title: 'A Fan Who Has Drifted Away', weight: 2, cooldownDays: 130, maxPerCareer: 2,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 30 }, careerYears: { gte: 2 } } },
    slots: {
      complaint: [`your character has gone stale`, `the matches all feel the same`, `you stopped taking risks`, `the crowd seems to care less than it did`],
      place: [`the merchandise table`, `the autograph line`, `the exit corridor`, `the car park`],
    },
    body: [`At {place}, {fan.name} waits until the line thins and then says it softly. They still come to the shows, but they feel that {complaint}.`, `There is no malice in it, which is what makes it land. This is somebody who wanted to love the work and tried, and you recognise the same quiet disappointment you have had about other people's work.`],
    choices: [
      { id: 'listen', label: 'Ask them to say more, and write it down', risk: 'low', result: `{fan.first} stammers, then talks for ten minutes, and you fill the back of a flyer. Some of it is unfair and some of it is the truest note you have had in a year.`, effects: [{ conf: -2 }, { attr: { name: 'psychology', delta: 1 } }, { pop: 0.3 }, { fatigue: 2 }] },
      { id: 'defend', label: 'Defend the work and explain the choices', risk: 'low', result: `You give reasons, and the reasons are good. {fan.first} nods, unconvinced, and the lines of a conversation close for the evening.`, effects: [{ conf: 2 }, { pop: -0.2 }] },
      { id: 'vow', label: 'Promise to change things up and prove it by the next show', risk: 'med', result: `You say it on the spot and then have to deliver it. The next match has a new opening, an odd risk or two, and a small, nervous glance at the fan in the crowd.`, effects: [{ flag: 'nd_changed_up' }, { pop: 0.6 }, { conf: 1 }, { fatigue: 5 }] },
      { id: 'joke', label: 'Joke that stale is just another word for reliable', risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{fan.first} laughs, startled, and shakes their head. It does not fix the problem, but it opens a door, and they agree to come back to the next show.`, effects: [{ pop: 0.3 }, { conf: 1 }] },
        { weight: 1, text: `The joke lands wrong, and {fan.first} frowns and says it was not a joke. The conversation ends there, and the hurt in it follows you home.`, effects: [{ pop: -0.4 }, { conf: -3 }] } ] },
    ],
  },
  {
    id: 'nd_fan_costume_family', category: 'fans', title: 'Dressed as You, in Row Two', weight: 1.5, cooldownDays: 110, maxPerCareer: 3,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 35 } } },
    slots: {
      group: [`a family of five`, `three generations of one household`, `two brothers`, `a whole school class on a trip`],
      costume: [`homemade tights and cardboard belts`, `replica gear sewn by a grandmother`, `matching face paint and foam fists`, `jackets stitched with your logo`],
    },
    body: [`In row two sits {group}, all dressed as you in {costume}. {fan.name}, apparently the organiser, has made certain that every detail of the effort is visible from the ring.`, `Your entrance is in ninety seconds. They are serious about the commitment, and it is the most touching and ridiculous thing you have seen in months.`],
    choices: [
      { id: 'ring', label: 'Bring them to ringside and pose for a photo', risk: 'low', result: `The ring announcer coughs, and security hesitates, and then the whole row stands at the barricade with arms in the air. It is the best single photograph of your career.`, effects: [{ pop: 1.0 }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'nod', label: 'Give them a salute at the top of the ramp', risk: 'low', result: `You hold the gaze of the smallest one for a full second, and they scream. The family goes home having been seen, which is most of what they came for.`, effects: [{ pop: 0.5 }, { conf: 1 }] },
      { id: 'gear', label: 'Send real gear to the youngest one after the show', risk: 'low', result: `A parcel with a worn shirt and a signed belt strap reaches the house the following week. The child sleeps in it, and the parents write you a very long letter.`, effects: [{ money: -400 }, { conf: 3 }, { pop: 0.3 }] },
      { id: 'tease', label: 'Stay in character and mock the costumes mercilessly', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.6 }, text: `The family is thrilled to be abused by you, and the whole section laughs along. It is a master class in a sort of affection nobody else is allowed to show.`, effects: [{ pop: 0.9 }, { conf: 1 }] },
        { weight: 2, text: `One child cries, and the parents are quiet and hurt. You apologise afterwards, but the damage cannot be unseen.`, effects: [{ pop: -0.6 }, { conf: -4 }] } ] },
    ],
  },
  {
    id: 'nd_fan_snowed_in', category: 'fans', title: 'Snowed In with Strangers', weight: 2, cooldownDays: 200, maxPerCareer: 2,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { month: [12, 1, 2], stat: { popularity: { gte: 20 } } },
    slots: {
      spot: [`a truck stop diner`, `a motel lobby with a broken vending machine`, `a gas station with one working pump`, `a roadside church hall`],
      company: [`six fans who drove through the storm`, `a bus driver and his grandson`, `a pair of nurses coming off a double shift`, `an entire youth hockey team`],
    },
    body: [`The road is closed behind you, and the only warm light for forty miles is {spot}. Inside is {company}, and {fan.name} recognises you before you have taken your coat off.`, `Nobody can leave and nothing is on the schedule, and the hours stretch ahead with the soft strangeness of a snow day. For once, you are not working, and neither are they.`],
    choices: [
      { id: 'stories', label: 'Sit down and tell stories until the plows come', risk: 'low', result: `You swap road stories for four hours, and then the others take over. Somewhere around three in the morning the room is passing around somebody's thermos and nobody wants the road to open.`, effects: [{ conf: 3 }, { pop: 0.5 }, { fatigue: 3 }] },
      { id: 'tab', label: 'Quietly pay everyone\'s tab and tell the waitress', risk: 'low', result: `The waitress promises not to say anything and says something in under a minute. The room toasts you with bad coffee, and nobody lets you pay for anything else.`, effects: [{ money: -450 }, { conf: 2 }, { pop: 0.4 }] },
      { id: 'show', label: 'Put on an impromptu show with whatever furniture is nearby', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `Two folding tables, a pool noodle and a very patient bus driver make for the best match in the county. It is silly and warm and wholly unrepeatable.`, effects: [{ pop: 1.0 }, { conf: 2 }, { fatigue: 5 }] },
        { weight: 1, text: `A folding table gives way early, and your elbow takes the worst of it. The room applauds anyway while you ice the damage in the kitchen.`, effects: [{ pop: 0.5 }, { fatigue: 5 }, { injury: { part: 'arms', severity: 1, days: 6 } }] } ] },
      { id: 'sleep', label: 'Claim a corner booth and sleep through it', risk: 'low', result: `The staff tuck a coat over your shoulders and leave you alone. You wake rested, a little guilty and with a stack of mugs lined up beside you like a trophy shelf.`, effects: [{ fatigue: -8 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'nd_fan_too_close', category: 'fans', title: 'A Fan Who Knows Too Much', weight: 2, cooldownDays: 150, maxPerCareer: 2, major: true,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 40 } } },
    slots: {
      habit: [`waits outside the bus at every town`, `writes you thirty letters a week`, `knows the names of your family`, `appears at three different shows in three states`],
      mood: [`trembling with joy`, `strangely calm`, `crying openly`, `formal as a diplomat`],
    },
    body: [`{fan.name} is {mood} when you meet, and you realise the same face has been in the crowd for weeks. The fan {habit}, and you cannot decide whether to be flattered or afraid.`, `The security lead catches your eye from across the lot. Nothing has happened, and that is exactly why you must decide now.`],
    choices: [
      { id: 'boundary', label: 'Be kind and set a clear boundary face to face', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `You say the words clearly and without anger, and {fan.first} nods, red-eyed, and agrees. The attention eases off, and the apology that comes in the mail is genuine.`, effects: [{ conf: 3 }, { pop: 0.2 }, { fatigue: 2 }] },
        { weight: 1, text: `The boundary is heard as rejection, and {fan.first} leaves upset and quiet. A week later, a new note appears at the venue, politely angry.`, effects: [{ conf: -2 }, { fatigue: 3 }] } ] },
      { id: 'security', label: 'Hand it to security and let them manage it', risk: 'low', result: `The security team talks to the fan and arranges a distance. It is clean and professional, and you never learn what happens next.`, effects: [{ conf: 1 }, { fatigue: -2 }, { pop: -0.1 }] },
      { id: 'moment', label: 'Give a short, warm moment first, then the boundary', risk: 'low', result: `You sign one thing, share a joke, and then ask kindly for space in the future. {fan.first} takes it better than expected, and you head home with the feeling of having been decent.`, effects: [{ pop: 0.4 }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'ignore', label: 'Ignore it and hope it passes', risk: 'high', result: `You tell yourself it is part of fame and keep your head down. The attention does not pass, and your sleep gets lighter every night.`, effects: [{ fatigue: 5 }, { conf: -3 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'nd_fan_rival_shirt', category: 'fans', title: 'A Fan in {rival.name}\'s Shirt Wants Your Name on It', weight: 2, cooldownDays: 100, maxPerCareer: 3,
    cast: { fan: { pick: 'media', kind: 'fan' }, rival: { pick: 'rivalry', minHeat: 10 } },
    memory: { role: 'rival', max: 1 },
    trigger: {},
    slots: {
      fan_type: [`a grinning kid`, `a stern grandmother`, `a man in a full costume`, `a couple on their anniversary`],
      spot: [`the sleeve`, `the back`, `the space beside the logo`, `the tag inside the collar`],
    },
    body: [`{fan.name}, {fan_type}, reaches the front of the autograph line in a shirt printed with {rival.name}'s face. The request is clear and polite: sign {spot}.`, `The people behind them are watching your hand. If you scribble, you are rude; if you smile, you are suspicious; and either way, {rival.first} will hear about it.`],
    choices: [
      { id: 'sign_warm', label: 'Sign it kindly and say the fan has good taste', risk: 'low', result: `You sign it with a flourish and compliment the fan\'s judgement. The story gets back to {rival.first}, who does not know what to do with a gift from an enemy.`, effects: [{ pop: 0.5 }, { rel: { who: 'rival', respect: 3, heat: -2 } }, { conf: 1 }] },
      { id: 'barb', label: 'Sign it with a barb about its owner', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5 }, text: `The barb, written in thick marker, is hilarious, and the fan holds it up for the line. {rival.first} hears about it and does not laugh.`, effects: [{ pop: 0.7 }, { rivalry: { who: 'rival', heat: 5 } }, { rel: { who: 'rival', heat: 4 } }] },
        { weight: 1, text: `The fan does not get the joke, and neither does the mother standing behind. The shirt is ruined, and your name is on it in the wrong way.`, effects: [{ pop: -0.4 }, { conf: -2 }, { rivalry: { who: 'rival', heat: 3 } }] } ] },
      { id: 'refuse', label: 'Refuse to sign it, politely but firmly', risk: 'low', result: `You tell the fan you do not sign other people\'s faces, and offer a signed photo instead. The line is split, and the fan is gracious about it.`, effects: [{ pop: -0.2 }, { conf: 1 }, { rel: { who: 'rival', respect: -1 } }] },
      { id: 'swap', label: 'Offer to swap the shirt for one of yours', risk: 'med', result: `The fan\'s eyes go wide, and the exchange is photographed ten times. It costs you a shirt, and the picture of {rival.first}\'s shirt on your table makes a very funny post-show story.`, effects: [{ money: -100 }, { pop: 0.8 }, { rivalry: { who: 'rival', heat: 3 } }] },
    ],
  },
  {
    id: 'nd_fan_unscripted_chant', category: 'fans', title: 'The Crowd Starts Something on Its Own', weight: 2, cooldownDays: 120, maxPerCareer: 3,
    trigger: { stat: { popularity: { gte: 45 } } },
    slots: {
      chant: [`your name, slowly`, `a low hum that builds`, `a stomp pattern from the balcony`, `a line from one of your own promos`],
      moment: [`in the middle of your entrance`, `while the referee counts a near fall`, `during a dead-silent rest hold`, `right after the opening bell`],
    },
    body: [`The sound begins in the upper deck {moment}: the crowd is chanting {chant}, and nobody told it to. The people near you in the ring can feel it in the floor.`, `Nothing in the script allows time for this, and no one in the production truck can plan for it. You have a handful of seconds before the moment goes cold.`],
    choices: [
      { id: 'soak', label: 'Stop and soak it in, arms open', risk: 'med', outcomes: [
        { weight: 2, bonus: { popularity: 0.5 }, text: `The pause lets the chant grow until the roof seems to flex, and the opponent has the grace to wait. It is the most precious thirty seconds of your career so far.`, effects: [{ pop: 1.2 }, { conf: 3 }] },
        { weight: 1, text: `The pause goes on a beat too long and the energy collapses into confusion. The referee coughs pointedly and the match restarts clumsily.`, effects: [{ pop: 0.1 }, { conf: -2 }] } ] },
      { id: 'conduct', label: 'Conduct the crowd and make it louder', risk: 'low', result: `You raise a hand and the sound doubles; lower it and it sinks to a whisper. A veteran at the curtain mutters that you have it, the quiet gift, and not everyone does.`, effects: [{ pop: 0.8 }, { mic: 1 }, { fatigue: 2 }] },
      { id: 'work', label: 'Ignore it and keep the match tight', risk: 'low', result: `You keep every beat of the plan and ride the noise rather than chasing it. It is clean, professional work, and the agent grunts approval.`, effects: [{ conf: 2 }, { pop: 0.3 }] },
      { id: 'moved', label: 'Let the emotion show, just for a second', risk: 'low', result: `You press a hand to your chest and swallow, and the crowd sees it. It is not a trick, and that is exactly why it works.`, effects: [{ pop: 0.6 }, { conf: 4 }, { fatigue: -1 }] },
    ],
  },
];
