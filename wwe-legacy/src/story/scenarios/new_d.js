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
      { id: 'knees', label: 'Show the camera your taped knees and laugh', risk: 'low', result: `The gag works because it is true, and the roll of tape on each joint is a better argument than any speech. The interviewer asks if she can keep the clip, and you say yes.`, effects: [{ pop: 0.4 }, { conf: 1 }, { fatigue: 1 }] },
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
      { id: 'rescue', label: 'Save the segment when the host loses the thread', risk: 'low', result: `Halfway through, the host's cue card vanishes, and you quietly feed her the next line like a ringside second. She will mention the favour on air for weeks.`, effects: [{ pop: 0.5 }, { conf: 3 }, { mic: 1 }] },
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
];
