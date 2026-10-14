// New scenarios (set H): podcast, media, social, fans, faction, mentor, alliance. About eight each, ids prefixed nh_.
export default [
  // ======================= PODCAST =======================
  {
    id: 'nh_pod_rival_clip', category: 'podcast', title: `Headphones on the Desk`, weight: 2.5, cooldownDays: 80, maxPerCareer: 3, categoryCooldown: 6,
    cast: { rival: { pick: 'rivalry', minHeat: 20 }, host: { pick: 'media', kind: 'host' } }, memory: { role: 'rival', max: 1, noResults: true },
    trigger: { minYear: 2010, stat: { popularity: { gte: 20 } } },
    slots: { clip: [`a clip of {rival.first} laughing through an impression of your entrance`, `a clip of {rival.first} calling your finisher "a nice stretch"`, `a clip of {rival.first} reading your last promo aloud in a bored voice`, `a clip of {rival.first} wondering how you ever got booked`], room: [`a late-night call-in show`, `a drive-time morning show with a fake air horn`, `a fan podcast recorded in a converted garage`] },
    body: [`Forty minutes into {room}, {host.name} slides a pair of headphones across the desk and presses play on {clip}. {host.first} watches your face the way a chess player watches a clock.`, `The red light is on. Whatever your face does in the next three seconds is already part of the episode.`],
    choices: [
      { id: 'laugh', label: `Laugh along, then land one line of your own`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.6, charisma: 0.3 }, text: `The laugh is real and the line that follows is better. {host.first} slaps the desk, and the segment turns into the clip everyone shares.`, effects: [{ pop: 0.7 }, { rel: { who: 'rival', respect: 3 } }, { event: { type: 'podcast', participants: ['host', 'rival'], summary: `Laughed off a jab from {rival.name} on a podcast.`, data: { quality: { base: 64, mic: 0.5, charisma: 0.3, noise: 10 }, viral: { minQuality: 82, chance: 0.35 } } } }] },
        { weight: 1, text: `The laugh arrives a beat late and the line lands in the gap. You sound like someone being a good sport on purpose.`, effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'whole_tape', label: `Ask {host.first} to play the whole recording`, risk: 'low', result: `Thirty seconds later the missing context is out in the open, and half of the jab turns out to be aimed at somebody else. The correction is accurate and a little dull, and it takes the heat out of both of you.`, effects: [{ rel: { who: 'rival', heat: -4, respect: 2 } }, { pop: 0.1 }, { conf: 1 }] },
      { id: 'silence', label: `Take the headphones off and say nothing`, risk: 'med', result: `You set them down very gently, and the silence says more than an answer would have. {host.first} cuts to a break, and {rival.first} will hear about the pause before the episode even posts.`, effects: [{ rivalry: { who: 'rival', heat: 6 } }, { rel: { who: 'rival', heat: 4 } }, { pop: 0.2 }, { conf: 2 }] },
      { id: 'ring_answer', label: `Promise to answer in the ring and nowhere else`, risk: 'high', result: `The line is out of your mouth before you weigh it, and {host.first} repeats it back to make sure the tape caught it. It is going to follow you into every hallway until you make it true.`, effects: [{ promise: { kind: 'win_match', who: 'rival', text: 'I will settle this in the ring.', deadlineDays: 60 } }, { rivalry: { who: 'rival', heat: 8 } }, { pop: 0.5 }, { conf: 3 }] },
    ],
  },
  {
    id: 'nh_pod_insulted_guest', category: 'podcast', title: `Two Chairs, One Microphone`, weight: 2.5, cooldownDays: 100, maxPerCareer: 2, categoryCooldown: 6, major: true,
    cast: { foe: { pick: 'tag', tag: 'insulted_by' }, host: { pick: 'media', kind: 'host' } }, memory: { role: 'foe', max: 2, noResults: true },
    trigger: { minYear: 2010, stat: { popularity: { gte: 20 } }, mem: [{ role: 'foe', tag: 'insulted_by' }] },
    slots: { format: [`a "settle it" episode`, `a segment with a single shared microphone`, `a live-streamed Q&A in front of forty paying fans`], seating: [`two chairs angled to face each other`, `a mediator's stool that nobody is expected to use`, `a table with exactly one bottle of water on it`] },
    body: [`{host.name} did not mention the other guest until you were in the building. The producers have built {format} around you and {foe.name}, with {seating} and a countdown clock on the wall.`, `{foe.first} is already seated, scrolling through nothing on a phone and not looking up. The host smiles at both of you like someone who has already seen the ratings.`],
    choices: [
      { id: 'apologise', label: `Open with a plain apology and let it hang`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `You say it without a joke wrapped around it, and {foe.first} actually looks up. The next ten minutes are quieter than the host wanted and better than anyone expected.`, effects: [{ rel: { who: 'foe', heat: -12, respect: 6, trust: 4 } }, { pop: 0.3 }, { event: { type: 'podcast', participants: ['host', 'foe'], summary: `Apologised to {foe.name} on air.`, data: { quality: { base: 62, charisma: 0.5, noise: 10 }, handled: true } } }] },
        { weight: 1, text: `The apology is heard as a tactic, and {foe.first} says so in front of everyone listening. The host looks delighted and you look cornered.`, effects: [{ rel: { who: 'foe', heat: 4 } }, { pop: -0.2 }, { conf: -3 }] } ] },
      { id: 'double_down', label: `Repeat what you said, with better phrasing`, risk: 'high', result: `The line sounds sharper the second time, and the live chat lights up before the sentence is finished. {foe.first} leaves the studio with a flat nod and a grudge that has been upgraded.`, effects: [{ rivalry: { who: 'foe', heat: 14 } }, { rel: { who: 'foe', heat: 10, respect: -4 } }, { pop: 0.8 }, { conf: 2 }] },
      { id: 'joke_it_off', label: `Turn it into a bit and give {foe.first} the last laugh`, risk: 'med', result: `You hand over the best line of the hour and take the loss gracefully. The room warms by a few degrees, though what was actually said never gets answered.`, effects: [{ rel: { who: 'foe', heat: -5, respect: 3 } }, { pop: 0.3 }, { conf: -1 }] },
      { id: 'walk_off', label: `Say you were misled about the format and leave`, risk: 'med', result: `You unclip the microphone, thank the host for the water and go. The episode runs with an empty chair and a long caption, and your name is the one that sounds difficult.`, effects: [{ pop: -0.4 }, { conf: 2 }, { rel: { who: 'foe', heat: 3 } }] },
    ],
  },
  {
    id: 'nh_pod_reconciled_pair', category: 'podcast', title: `From Enemies to Whatever This Is`, weight: 2, cooldownDays: 140, maxPerCareer: 2, categoryCooldown: 6,
    cast: { ex: { pick: 'tag', tag: 'reconciled' }, host: { pick: 'media', kind: 'host' } }, memory: { role: 'ex', max: 1, noResults: true },
    trigger: { minYear: 2010, stat: { popularity: { gte: 25 } }, mem: [{ role: 'ex', tag: 'reconciled' }] },
    slots: { pitch: [`"the rivalry that ended before the lawyers got involved"`, `"two people who used to throw chairs at each other"`, `"the feud that quietly stopped"`], gimmick: [`a plate of cookies on the desk, one conspicuously bitten`, `a pair of matching mugs the producers had printed overnight`, `a framed photo of the two of you that nobody remembers taking`] },
    body: [`{host.name} has booked you and {ex.name} for the same hour, billed as {pitch}, and there is {gimmick}. {ex.first} lifts a hand in greeting across the glass, relaxed in a way that would not have been possible a while ago.`, `The listeners want a story with a bow on it. What you two actually have is less tidy than that, and you can both feel the host leaning toward the tidy version.`],
    choices: [
      { id: 'honest', label: `Tell the untidy version, doubts included`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, mic: 0.3 }, text: `You admit the peace is still being worked out, and {ex.first} nods and adds a doubt of {ex.their} own. It is the most human hour either of you has recorded, and the replies pour in.`, effects: [{ rel: { who: 'ex', trust: 6, respect: 5, affinity: 3 } }, { pop: 0.7 }, { event: { type: 'podcast', participants: ['host', 'ex'], summary: `Spoke honestly about patching things up with {ex.name}.`, data: { quality: { base: 66, charisma: 0.5, mic: 0.3, noise: 10 }, viral: { minQuality: 84, chance: 0.3 } } } }] },
        { weight: 1, text: `The honesty comes out as a list of old complaints, and {ex.first} stiffens by the third one. The host steers back to safer ground, but the air does not fully recover.`, effects: [{ rel: { who: 'ex', trust: -5, heat: 4 } }, { conf: -2 }, { pop: 0.1 }] } ] },
      { id: 'tidy', label: `Give the host the neat redemption story`, risk: 'low', result: `The bow goes on and everyone feels good for fifty minutes. {ex.first} plays along with a small smile that does not quite reach the end of the sentence.`, effects: [{ pop: 0.5 }, { rel: { who: 'ex', trust: -2 } }, { conf: 1 }] },
      { id: 'floor_to_ex', label: `Hand {ex.first} the floor and mostly listen`, risk: 'low', result: `You ask three questions and keep your answers short. {ex.first} gets to say things on air that were hard to say in a hallway, and it will be remembered as a gift.`, effects: [{ rel: { who: 'ex', trust: 7, respect: 4, affinity: 4 } }, { pop: 0.2 }, { conf: -1 }] },
      { id: 'work', label: `Insist the old fight was a work from the start`, risk: 'high', result: `You wink at the microphone and {host.first} gasps theatrically. {ex.first} is not smiling, and the people who remember the real bruises start writing replies.`, effects: [{ rel: { who: 'ex', trust: -9, respect: -4, heat: 6 } }, { pop: 0.4 }, { conf: 2 }] },
    ],
  },
  {
    id: 'nh_pod_road_story', category: 'podcast', title: `The Worst Night on the Road`, weight: 1.5, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 6,
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 2010, stat: { careerYears: { gte: 2 }, matches: { gte: 40 } } },
    slots: { ask: [`the strangest hotel you have ever slept in`, `the worst travel day of your life`, `the match that almost did not happen`, `the cheapest meal you ever called dinner`], mood: [`leaning in with a grin`, `with a notebook full of follow-ups`, `already laughing before you answer`] },
    body: [`The episode is going easily when {host.name}, {mood}, asks for {ask}. It is the kind of question that makes a listener feel like they are sitting in the van with you.`, `You have a dozen stories that qualify. Some of them are funny, a couple are true, and at least one involves a colleague who would not enjoy hearing it replayed.`],
    choices: [
      { id: 'ugly_truth', label: `Tell the unglamorous truth, ugly details and all`, risk: 'low', result: `The detail about the vending machine and the borrowed towel gets the biggest laugh of the hour. Listeners write in to say they never knew the glamour ran out so fast, and you feel oddly lighter afterward.`, effects: [{ pop: 0.5 }, { conf: 2 }, { event: { type: 'podcast', participants: ['host'], summary: `Told an honest road story on a podcast.`, data: { quality: { base: 60, mic: 0.4, charisma: 0.3, noise: 12 } } } }] },
      { id: 'roast_colleague', label: `Tell the version where a colleague is the fool`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.5 }, text: `You never name names, but the shape of the story is unmistakable, and the host nearly falls off the stool. The locker room will play it back at lunch and argue about who it was.`, effects: [{ pop: 0.8 }, { conf: 2 }] },
        { weight: 1, text: `Somebody works out who the story is about before the episode is even cut. By the weekend you have a hallway to cross where the stare is shared by several people.`, effects: [{ pop: 0.2 }, { conf: -3 }] } ] },
      { id: 'credit_crew', label: `Turn it into a thank-you to the ring crew`, risk: 'low', result: `You put the crew chief's name in the story and the host has to ask how to spell it. A week later a box of coffee mugs from the crew arrives with a note that says "the dull part, mostly".`, effects: [{ pop: 0.2 }, { conf: 3 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'keep_vault', label: `Keep the road stories in the van where they belong`, risk: 'low', result: `You smile and say what happens on the bus stays on the bus, which earns a polite chuckle and not much else. The episode is competent and forgettable, and the producer sighs once in the control room.`, effects: [{ pop: -0.1 }, { fatigue: -2 }, { conf: 1 }] },
    ],
  },
  {
    id: 'nh_pod_mentor_tribute', category: 'podcast', title: `Who Taught You That?`, weight: 2, cooldownDays: 140, maxPerCareer: 2, categoryCooldown: 6,
    cast: { mentor: { pick: 'tag', tag: 'mentor' }, host: { pick: 'media', kind: 'host' } }, memory: { role: 'mentor', max: 1, noResults: true },
    trigger: { minYear: 2010, stat: { popularity: { gte: 25 } }, mem: [{ role: 'mentor', trustGte: 5 }] },
    slots: { question: [`who taught you how to take a bump`, `who told you the truth when you needed it`, `who you would call at three in the morning`, `who made the business make sense`], style: [`in a warm radio voice`, `with a sudden seriousness`, `while shuffling cards with the next questions on them`] },
    body: [`Late in the interview {host.name} asks, {style}, {question}. There is one name in your head before the sentence ends, and it belongs to {mentor.name}.`, `{mentor.first} might be listening in a car somewhere, or might hear about it secondhand, or might never hear it at all. How you answer says a lot about what you think you owe.`],
    choices: [
      { id: 'full_credit', label: `Name {mentor.first} and give the full story`, risk: 'low', result: `You tell it plainly, down to the borrowed boots and the early mornings in an empty gym. By the time the episode posts, {mentor.first} has texted four words that you will keep for a long time.`, effects: [{ rel: { who: 'mentor', trust: 6, respect: 5, affinity: 5 } }, { pop: 0.3 }, { conf: 2 }] },
      { id: 'tease', label: `Name {mentor.first}, with a joke at {mentor.their} expense`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The joke is affectionate enough that even {mentor.first} will laugh, and the host calls it the line of the week. It lands as warmth and not as cheap shot.`, effects: [{ rel: { who: 'mentor', affinity: 3 } }, { pop: 0.5 }, { event: { type: 'podcast', participants: ['host', 'mentor'], summary: `Paid a joking tribute to {mentor.name}.`, data: { quality: { base: 62, charisma: 0.4, noise: 10 } } } }] },
        { weight: 1, text: `The joke cuts closer to a sore spot than you meant. {mentor.first} does not say anything about it, which is how you know.`, effects: [{ rel: { who: 'mentor', trust: -5, respect: -2 } }, { pop: 0.2 }, { conf: -2 }] } ] },
      { id: 'big_name', label: `Name a bigger star instead, for the headline`, risk: 'high', result: `The famous name gets quoted, shared and put on a poster-style graphic by the end of the day. Your real teacher does not mention it, and the silence is considerably heavier than an argument would be.`, effects: [{ pop: 0.8 }, { rel: { who: 'mentor', trust: -8, respect: -5 } }, { conf: -2 }] },
      { id: 'self_made', label: `Say nobody taught you, you worked it out yourself`, risk: 'med', result: `It plays as swagger for about a minute and as ingratitude for much longer. The host lets it stand, and the comments split down the middle.`, effects: [{ pop: 0.3 }, { rel: { who: 'mentor', respect: -4, trust: -4 } }, { conf: 3 }] },
    ],
  },
  {
    id: 'nh_pod_ad_read', category: 'podcast', title: `A Word from Our Sponsor`, weight: 1.5, cooldownDays: 100, maxPerCareer: 3, categoryCooldown: 6,
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 2010, stat: { popularity: { gte: 30 } } },
    slots: { product: [`a meal-kit subscription`, `a mattress that claims to wrestle back pain`, `a protein powder the host plainly hates`, `a razor with five blades and a lifetime guarantee`], timing: [`halfway through a story you were enjoying telling`, `just as you were about to say something real`, `right after a heated stretch about the business`] },
    body: [`{host.name} sets a laminated card in front of you {timing}. The card is an ad read for {product}, and the host's face carries the apology of someone who gets paid per mention.`, `The rate card is quietly folded inside. Nobody has told you whether you are expected to read it, but the producer is nodding hopefully from behind the glass.`],
    choices: [
      { id: 'straight', label: `Read it straight and take the appearance fee`, risk: 'low', result: `You read it in your reliable voice and it takes forty seconds. The check clears the same week, and it buys no goodwill from the listeners who skip ads and a little from those who do not.`, effects: [{ money: 1500 }, { pop: -0.1 }] },
      { id: 'riff', label: `Riff on it until it becomes the best bit of the show`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.7, charisma: 0.3 }, text: `You treat the card like a hostage negotiation, and by the second sentence the host is crying with laughter. The sponsor asks for the clip for their own page, and a larger check follows.`, effects: [{ money: 2800 }, { pop: 0.8 }, { event: { type: 'podcast', participants: ['host'], summary: `Turned an ad read into the best bit of the episode.`, data: { quality: { base: 62, mic: 0.7, charisma: 0.3, noise: 14 }, viral: { minQuality: 80, chance: 0.4 } } } }] },
        { weight: 1, text: `The riff runs long and drifts into a dig at the product, and the producer is chopping at the air with a hand. The sponsor wants the segment cut and the fee reduced.`, effects: [{ money: 400 }, { pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'decline_kind', label: `Politely decline: you only plug what you use`, risk: 'low', result: `The host moves on without drama, and the producer deletes the marker with a small, professional sigh. Two listeners write to say they respected it; nobody sends a check.`, effects: [{ pop: 0.2 }, { conf: 2 }] },
      { id: 'ask_more', label: `Ask for double the fee before you say a word`, risk: 'med', outcomes: [
        { weight: 1, bonus: { confidence: 0.4 }, text: `The producer makes a phone call from the hallway and returns with a number you did not expect. You read the copy with a warmer voice than you planned.`, effects: [{ money: 3200 }, { conf: 2 }] },
        { weight: 1, text: `The answer is no, delivered flatly, and the host goes back to filling the slot with a story about a dog. You lose the fee and the easy mood of the hour.`, effects: [{ conf: -2 }, { pop: -0.1 }] } ] },
    ],
  },
  {
    id: 'nh_pod_caller', category: 'podcast', title: `Line Three Has a Question`, weight: 1.5, cooldownDays: 110, maxPerCareer: 3, categoryCooldown: 6,
    cast: { fan: { pick: 'media', kind: 'fan' }, host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 2010, stat: { popularity: { gte: 25 }, matches: { gte: 30 } } },
    slots: { question: [`whether you ever think about quitting`, `what you would say to a kid who wants your job`, `whether you read the comments about yourself`, `if the fans or the championship matter more to you`], sound: [`a shaky voice that keeps restarting`, `the confidence of someone who rehearsed in the car`, `a television blaring somewhere in the background`] },
    body: [`{host.name} opens line three, and {fan.name} comes through the speaker with {sound}. The question, when it finally arrives, is {question}.`, `It is a better question than anything the host prepared. The producers have stopped typing, and for once nobody is looking at the clock.`],
    choices: [
      { id: 'honest', label: `Answer it honestly, even where it costs you`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.3 }, text: `You give a slow, true answer with no polish on it, and the line goes quiet while {fan.first} takes it in. The host does not interrupt, and the segment is the one people send each other.`, effects: [{ pop: 0.7 }, { conf: 3 }, { fatigue: 5 }, { event: { type: 'podcast', participants: ['host'], summary: `Answered a caller's hard question with unusual honesty.`, data: { quality: { base: 66, charisma: 0.5, noise: 10 }, viral: { minQuality: 82, chance: 0.3 } } } }] },
        { weight: 1, text: `The honesty runs away from you and you say more about the bad months than you meant to. It is moving and slightly alarming, and your agent will have notes.`, effects: [{ pop: 0.3 }, { conf: -3 }, { fatigue: 5 }] } ] },
      { id: 'joke', label: `Make a joke out of it and move the show along`, risk: 'low', result: `The joke is a good one and the hour gets its rhythm back. {fan.first} says thank you in a voice that makes it clear this was not what was hoped for.`, effects: [{ pop: 0.2 }, { conf: -1 }] },
      { id: 'turn_around', label: `Ask {fan.first} the same question back`, risk: 'med', result: `The answer is long and a bit rambling, and it quietly turns the whole show toward the listener. It is generous, if less quotable, and the host says later that the call lines went red for ten minutes.`, effects: [{ pop: 0.4 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 2 }] },
      { id: 'skip', label: `Ask the host to take the next caller`, risk: 'low', result: `The host does so smoothly and no one on the air says a thing. In the control room somebody mutters that you dodged it, and {fan.first} is not mentioned again.`, effects: [{ pop: -0.3 }, { conf: 1 }] },
    ],
  },
  {
    id: 'nh_pod_broken_promise', category: 'podcast', title: `The Promise, Played Back`, weight: 2.5, cooldownDays: 90, maxPerCareer: 4, categoryCooldown: 6,
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 2010, promise: 'broken' },
    slots: { room: [`a morning show with a laugh track`, `a respected long-form interview series`, `a fan roundtable that tends to hold grudges`], approach: [`with the clip already cued`, `in the dry tone of an accountant`, `with a sympathetic head tilt`] },
    body: [`The invitation to {room} read like a friendly chat, and then {host.name} asks, {approach}, about the promise you made: {brokenPromise}. The silence between the question and your answer is long enough to hear the air conditioner.`, `Everyone listening has the same fact in mind. They want to know what kind of person you are when a claim goes sour.`],
    choices: [
      { id: 'own_it', label: `Own the miss without excuses`, risk: 'low', result: `You say it plainly and skip the "but". The host nods and the next question comes in a softer voice; it is not a triumph, but it stops being a story.`, effects: [{ pop: 0.2 }, { conf: -1 }, { event: { type: 'interview', participants: ['host'], summary: `Owned a broken promise on a podcast.`, data: { quality: { base: 60, mic: 0.3, charisma: 0.3, noise: 10 } } } }] },
      { id: 'lesson', label: `Frame it as the lesson that made you better`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.4 }, text: `You find a story in it, and it sounds earned rather than convenient. The clip of you saying "I'd rather be wrong out loud" is shared a lot.`, effects: [{ pop: 0.6 }, { conf: 2 }] },
        { weight: 1, text: `It sounds rehearsed, and the host picks up on the polish. The replies call it spin, and they are not entirely wrong.`, effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
      { id: 'blame', label: `Blame the circumstances and the people around you`, risk: 'high', result: `The list is long and technically accurate, and it sounds exactly like a list of excuses. The host says "okay" in the tone that ends a segment.`, effects: [{ pop: -0.6 }, { conf: -3 }] },
      { id: 'bigger', label: `Make a bigger promise and dare them to doubt it`, risk: 'high', result: `The room goes loud and the host leans back, grinning. Whether it was courage or panic will be decided over the next few months.`, effects: [{ promise: { kind: 'win_title', text: 'I will win a championship.', deadlineDays: 220 } }, { pop: 0.6 }, { conf: 3 }] },
    ],
  },
  {
    id: 'nh_pod_cohost', category: 'podcast', title: `A Guest Seat Turns into an Offer`, weight: 1.5, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 6, major: true,
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 2012, stat: { popularity: { gte: 45 }, careerYears: { gte: 3 } } },
    slots: { show: [`a weekly wrestling roundtable`, `a daily sports-and-gossip call-in`, `a once-a-month deep-dive series`], pitch: [`"someone who actually knows what the inside looks like"`, `"a voice the audience trusts"`, `"the one guest who never gets boring"`] },
    body: [`After the recording ends, {host.name} keeps the microphone live and offers you a recurring co-host spot on {show}. The sales line is {pitch}, and the contract is already in a folder.`, `The offer is flattering and real. It is also a second job that wants your evenings, your opinions and your fingerprints on a mixing board.`],
    choices: [
      { id: 'sign', label: `Sign on as a regular co-host`, risk: 'med', result: `The first few episodes are a joy and the schedule is a quiet drain. You start thinking in segments and sentences, and the money is a pleasant surprise.`, effects: [{ money: 4000 }, { mic: 1 }, { pop: 0.6 }, { fatigue: 9 }] },
      { id: 'guest_only', label: `Offer a guest slot every month, no contract`, risk: 'low', result: `The host accepts, a little disappointed, and the arrangement works the way an easy habit does. It adds a steady name-check without eating the rest of the week.`, effects: [{ pop: 0.3 }, { fatigue: 3 }, { money: 800 }] },
      { id: 'pitch_own', label: `Counter with a pitch to build your own show`, risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.5, mic: 0.4 }, text: `The host listens to the whole pitch, writes down the format and says they will find you a producer. It becomes a project with your name on the logo and a small, hungry audience.`, effects: [{ pop: 0.9 }, { mic: 1 }, { fatigue: 8 }, { money: -1500 }] },
        { weight: 1, text: `The pitch lacks a hook, and the host's smile fades by degrees. No one calls back, and the original offer lapses by the end of the week.`, effects: [{ conf: -3 }, { pop: -0.1 }] } ] },
      { id: 'decline', label: `Decline: the ring comes first`, risk: 'low', result: `You thank the host and keep the chair for guests only. The ring crew likes that answer, and the lost evenings stay yours.`, effects: [{ conf: 2 }, { fatigue: -3 }, { pop: -0.1 }] },
    ],
  },
  // ======================= MEDIA =======================
  {
    id: 'nh_med_doc_crew', category: 'media', title: `A Camera Crew Asks for a Day`, weight: 2, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 6, major: true,
    cast: { director: { pick: 'media', kind: 'interviewer' } },
    trigger: { stat: { popularity: { gte: 35 }, careerYears: { gte: 1 } } },
    slots: { access: [`to film you warming up alone before the doors open`, `to ride in the car on the long drive to the next town`, `to sit in the corner of your next meeting with the agent`, `to follow you from the hotel breakfast to the final bell`], crew: [`a lone camera operator in a baseball cap`, `a crew of four with a fuzzy microphone on a pole`, `a director who talks almost entirely in questions`] },
    body: [`{director.name} turns up at catering with {crew}, asking for permission {access}. The documentary is about "the people the cameras usually miss", and you are, apparently, one of them.`, `It would be good exposure and a small invasion. The footage that survives an edit is rarely the footage you thought you were giving.`],
    choices: [
      { id: 'open', label: `Give them real access and trust the edit`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.3 }, text: `The camera stops feeling like a guest by midday, and what it catches is a person rather than a character. When the cut airs, strangers write to say they understood you better than before.`, effects: [{ pop: 1.0 }, { conf: 2 }, { fatigue: 6 }, { event: { type: 'interview', participants: ['director'], summary: `Opened up to a documentary crew for a day.`, data: { quality: { base: 64, charisma: 0.5, conf: 0.3, noise: 12 }, viral: { minQuality: 84, chance: 0.3 } } } }] },
        { weight: 1, text: `The one tired, snappish minute of the day becomes the trailer. You come off as short-tempered, and it takes a few weeks of good work to turn the tone of the replies.`, effects: [{ pop: -0.2 }, { conf: -3 }, { fatigue: 6 }] } ] },
      { id: 'fenced', label: `Allow it, but keep the cameras off the private parts`, risk: 'low', result: `You list the doors that stay closed, and the director writes them all down without complaint. The footage is polished and a little distant, and it airs without anyone being hurt.`, effects: [{ pop: 0.4 }, { fatigue: 3 }, { conf: 1 }] },
      { id: 'turn_lens', label: `Suggest they film the ring crew instead of you`, risk: 'low', result: `The director takes a long look at the crew loading out at midnight and goes quiet. Half the finished film is about them, and the crew chief gives you a salute at the next setup.`, effects: [{ conf: 3 }, { pop: 0.2 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'refuse', label: `Decline: your life is not a program`, risk: 'low', result: `{director.first} thanks you and moves to the next table without pushing. The refusal earns you some quiet and costs you a chance that does not come back.`, effects: [{ pop: -0.1 }, { fatigue: -3 }, { conf: 2 }] },
    ],
  },
  {
    id: 'nh_med_rival_profile', category: 'media', title: `Three Words for {rival.name}`, weight: 2, cooldownDays: 90, maxPerCareer: 3, categoryCooldown: 6,
    cast: { rival: { pick: 'rivalry', minHeat: 25 }, writer: { pick: 'media', kind: 'journalist' } }, memory: { role: 'rival', max: 1, noResults: true },
    trigger: { stat: { popularity: { gte: 25 } } },
    slots: { format: [`a glossy monthly's "Know Your Enemy" page`, `a newspaper's Sunday profile`, `a website's quick-fire round`], prop: [`a recorder balanced on a coffee cup`, `a notebook with three blank lines already ruled`, `a stopwatch on the table, ticking`] },
    body: [`{writer.name} is writing {format} and asks for the three words you would use to describe {rival.name}. There is {prop}, and {writer.first} waits with the patience of someone who knows silence sells.`, `Anything you say will sit next to a photo of the two of you and a pull quote the size of a billboard.`],
    choices: [
      { id: 'generous', label: `Give three honest, generous words`, risk: 'low', result: `Dangerous, patient, relentless: you mean every one, and {writer.first} looks almost disappointed at how little there is to quote. {rival.first} reads it and says nothing to you, which is its own kind of answer.`, effects: [{ rel: { who: 'rival', respect: 6, heat: -4 } }, { pop: 0.2 }, { conf: 1 }] },
      { id: 'savage', label: `Give three words designed to be printed`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.6 }, text: `Each word is a small, well-aimed insult, and the headline writes itself. The profile runs with the three words in giant type across a double-page spread.`, effects: [{ pop: 0.8 }, { rivalry: { who: 'rival', heat: 10 } }, { rel: { who: 'rival', heat: 8 } }, { event: { type: 'press_conference', participants: ['writer', 'rival'], summary: `Gave three cutting words about {rival.name} for a profile.`, data: { quality: { base: 62, mic: 0.6, noise: 12 }, viral: { minQuality: 82, chance: 0.3 } } } }] },
        { weight: 1, text: `One of the three words is clumsy and gets quoted for the wrong reasons. The paper's headline makes you sound like a bully.`, effects: [{ pop: -0.3 }, { rivalry: { who: 'rival', heat: 8 } }, { conf: -2 }] } ] },
      { id: 'refuse_word', label: `Refuse to do the game and talk about the work`, risk: 'low', result: `{writer.first} sighs and rewrites the question into something duller, and you answer it well. The piece is respectful and nobody clips it.`, effects: [{ pop: 0.1 }, { conf: 1 }, { fatigue: -1 }] },
      { id: 'one_word', label: `Give one word and watch {writer.first} work for it`, risk: 'med', result: `You say "Unfinished" and nothing else, and {writer.first} pitches three follow-ups. The ambiguity gets more attention than a paragraph would have, and {rival.first} spends a week wondering what you meant.`, effects: [{ rel: { who: 'rival', respect: 2, fear: 3 } }, { pop: 0.4 }, { conf: 2 }] },
    ],
  },
  {
    id: 'nh_med_former_source', category: 'media', title: `Someone Talked to the Press`, weight: 2.5, cooldownDays: 120, maxPerCareer: 2, categoryCooldown: 6, major: true,
    cast: { former: { pick: 'tag', tag: 'betrayal' }, writer: { pick: 'media', kind: 'journalist' } }, memory: { role: 'former', max: 2 },
    trigger: { mem: [{ role: 'former', betrayal: true }] },
    slots: { piece: [`a long Sunday feature`, `a short, nasty column`, `a two-part podcast series`], hook: [`"The Real Story of What Happened Between You Two"`, `"A Locker Room Divided"`, `"The Fallout Nobody Saw Coming"`] },
    body: [`{writer.name} calls before the piece runs, which is more courtesy than most give. It is {piece} titled {hook}, and {former.name} is quoted all the way through.`, `The writer offers the right of reply and sounds like someone who has done this many times and enjoys it less each year.`],
    choices: [
      { id: 'reply_plain', label: `Give a short, calm reply and no adjectives`, risk: 'low', result: `Two sentences, one fact, no adjectives. The article prints it unedited at the bottom, and the plainness reads as stronger than the anger above it.`, effects: [{ pop: 0.3 }, { conf: 1 }, { rel: { who: 'former', respect: 2 } }] },
      { id: 'full_side', label: `Give {writer.first} your whole side, on the record`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.4, charisma: 0.4 }, text: `Your account is specific, restrained and hard to dismiss, and the follow-up piece gives it equal space. The room starts to go quiet around the other version.`, effects: [{ pop: 0.7 }, { conf: 2 }, { rel: { who: 'former', heat: 6 } }, { event: { type: 'interview', participants: ['writer', 'former'], summary: `Gave a full account of the split with {former.name} to a reporter.`, data: { quality: { base: 62, mic: 0.4, charisma: 0.4, noise: 12 } } } }] },
        { weight: 1, text: `Your side runs long and bitter, and the printed quotes make you sound like the one who cannot let go. {former.first} is gracious about it in a follow-up, which is the worst part.`, effects: [{ pop: -0.4 }, { conf: -3 }, { rel: { who: 'former', heat: 8 } }] } ] },
      { id: 'call_former', label: `Call {former.first} before saying anything to the press`, risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `{former.first} picks up on the fifth ring and the first minute is stiff. Then something loosens, and the call ends with an agreement that neither of you will feed the story any further.`, effects: [{ rel: { who: 'former', trust: 5, heat: -8 } }, { conf: 1 }] },
        { weight: 1, text: `The call goes to voicemail, and the voicemail is later quoted in a follow-up as "a panicked message". You hear the tone of your own voice for the first time.`, effects: [{ conf: -3 }, { pop: -0.2 }] } ] },
      { id: 'no_comment', label: `Decline to comment and let the weekend pass`, risk: 'low', result: `The piece prints with "declined to comment" in grey type and gets the usual few days of attention. The fans who know you take your silence as dignity; the ones who do not take it as an admission.`, effects: [{ pop: -0.2 }, { conf: 1 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'nh_med_cover_shoot', category: 'media', title: `The Cover Shoot with the Champion`, weight: 1.5, cooldownDays: 160, maxPerCareer: 2, categoryCooldown: 6,
    cast: { champ: { pick: 'champion', class: 'world' }, shooter: { pick: 'media', kind: 'interviewer' } },
    trigger: { holdsTitle: false, stat: { popularity: { gte: 30 }, careerYears: { gte: 1 } } },
    slots: { pose: [`back to back with arms folded`, `facing off over the belt, noses six inches apart`, `shoulder to shoulder, squinting into a wind machine`], tone: [`an intense whisper`, `the cheerful bark of a sergeant`, `a sigh that has seen three thousand covers`] },
    body: [`The photographer wants {champ.name} front and center and you a half-step behind, and the pose is {pose}. {shooter.name} calls the direction in {tone}, and the light is perfect and the floor is cold.`, `The magazine will pick one frame from four hundred. Where you stand in it will be read as a ranking.`],
    choices: [
      { id: 'half_step', label: `Take the half-step back and look unbothered`, risk: 'low', result: `You give the champion the space and the cover, and the frame that runs has you looking relaxed at the edge. {champ.first} notices that you did not argue and murmurs a thanks.`, effects: [{ rel: { who: 'champ', respect: 4 } }, { pop: 0.2 }, { conf: -1 }] },
      { id: 'equal', label: `Ask for equal framing in the final shot`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: `{shooter.first} shrugs, nudges the lights, and the frame that runs has two people of the same height. It reads like a statement, and a few people at the magazine pin it up.`, effects: [{ pop: 0.6 }, { conf: 3 }, { rel: { who: 'champ', respect: 1 } }] },
        { weight: 1, text: `The request lands as pushy, and {champ.first} stares past the lens with a cold, practiced boredom. The photos survive, but the mood on the set does not.`, effects: [{ pop: 0.1 }, { conf: -2 }, { rel: { who: 'champ', heat: 5 } }] } ] },
      { id: 'steal', label: `Quietly slide into the center when the flash resets`, risk: 'high', result: `In a gap between frames you are exactly where you want to be, and the photographer keeps shooting. The picture is magnetic and the champion decides never to stand near you at a shoot again.`, effects: [{ pop: 0.8 }, { rivalry: { who: 'champ', heat: 10 } }, { rel: { who: 'champ', heat: 8, respect: -3 } }] },
      { id: 'joke', label: `Break the tension with a bad pun about the belt`, risk: 'low', result: `The pun is awful and the champion laughs first. The shot that runs is the one in mid-laugh, and for once the cover looks like two people enjoying their work.`, effects: [{ rel: { who: 'champ', affinity: 4, respect: 2 } }, { pop: 0.3 }, { conf: 1 }] },
    ],
  },
  {
    id: 'nh_med_misquote', category: 'media', title: `That Is Not What You Said`, weight: 2, cooldownDays: 100, maxPerCareer: 3, categoryCooldown: 6,
    cast: { writer: { pick: 'media', kind: 'reporter' } },
    trigger: { stat: { promos: { gte: 3 }, popularity: { gte: 25 } } },
    slots: { quote: [`calling the locker room "a glorified day-care"`, `saying you "don't need the fans"`, `claiming you want the top spot "by any means"`], where: [`the front of a sports section`, `a magazine page in giant type`, `the crawl of a sports channel`] },
    body: [`By morning you are quoted on {where}, supposedly {quote}. The real sentence was longer, and the part that changed everything was cut off at the comma.`, `{writer.name} left a message that begins with "I can explain" and ends with a number you can call. Three people have already phoned to ask if you are okay.`],
    choices: [
      { id: 'correction', label: `Demand a formal correction and wait for it`, risk: 'low', result: `The correction arrives four days later in a small box on page nine. It is accurate and nobody sees it, though the editor keeps you on the list for the exclusive you will eventually want.`, effects: [{ pop: -0.1 }, { conf: 1 }, { fatigue: 2 }] },
      { id: 'full_clip', label: `Release the full audio yourself`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.4 }, text: `The full sentence reads as reasonable, and the original reporter is now the story. Fans love a receipt, and the clip travels farther than the quote ever did.`, effects: [{ pop: 0.7 }, { conf: 3 }, { event: { type: 'press_conference', participants: ['writer'], summary: `Released full audio to correct a misquote.`, data: { quality: { base: 62, mic: 0.4, noise: 10 }, handled: true } } }] },
        { weight: 1, text: `The full sentence turns out to be only slightly better than the cut one. You have now handed everybody the context they needed to be annoyed with you.`, effects: [{ pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'lean_in', label: `Lean into the misquote and play the villain`, risk: 'high', result: `You repeat it in a promo with a lazy shrug, and the building turns on you in a way that feels good. It is a persona now, and it will take actual work to put it down.`, effects: [{ pop: 0.6 }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'let_go', label: `Let it blow over without a word`, risk: 'low', result: `The quote loses a little heat each day and is eventually replaced by a worse one about someone else. A few colleagues still glance at you in the hallway for a week.`, effects: [{ pop: -0.2 }, { fatigue: -1 }, { conf: -1 }] },
    ],
  },
  {
    id: 'nh_med_booth_visit', category: 'media', title: `A Seat at the Announce Table`, weight: 1.5, contexts: ['pre_show', 'show_day'], cooldownDays: 160, maxPerCareer: 2, categoryCooldown: 6,
    cast: { voice: { pick: 'media', kind: 'commentator' } },
    trigger: { stat: { careerYears: { gte: 2 }, popularity: { gte: 25 } } },
    slots: { match: [`an opening tag match between two prospects`, `a mid-card grudge match with a lot of kick-outs`, `a long, careful technical contest`], mic: [`a headset still warm from the last guest`, `a clip-on microphone that smells faintly of cough drops`, `a monitor angled so you can see your own face`] },
    body: [`{voice.name} offers you a guest seat at the announce table for {match}, and hands over {mic}. The booth is closer to the ring than you expected, and every slap and gasp comes through at double size.`, `You have spent years being described. Now you are being asked to do the describing, live, while people you know are doing the work.`],
    choices: [
      { id: 'analyst', label: `Call it like a coach: calm, specific, fair`, risk: 'low', result: `You point out the small things, the footwork and the half-second pauses, and {voice.first} lets you talk. The wrestlers in the ring are flattered, and the audience finds you smarter than expected.`, effects: [{ pop: 0.4 }, { attr: { name: 'psychology', delta: 1 } }, { mic: 1 }] },
      { id: 'funny', label: `Go for the laughs and rib the commentary team`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.6, charisma: 0.4 }, text: `Your one-liners land in the gaps and {voice.first} starts feeding you setups. The segment is better than the match, which the match does not appreciate but the audience does.`, effects: [{ pop: 0.7 }, { mic: 1 }] },
        { weight: 1, text: `A joke lands on one of the wrestlers working the match, who hears it through the building's speakers. The ring-side apology afterward is stiff, and the colleague's forgiveness is conditional.`, effects: [{ pop: 0.1 }, { conf: -3 }] } ] },
      { id: 'heel_booth', label: `Play the heel and slander everyone in the ring`, risk: 'high', requires: { alignment: ['heel'] }, result: `You pick apart both competitors with ice in your voice, and the crowd boos your name from the first sentence. The match is only decent; the booth segment is the show.`, effects: [{ pop: 0.8 }, { fatigue: 3 }, { conf: 2 }] },
      { id: 'decline_chair', label: `Decline and watch from the curtain with the crew`, risk: 'low', result: `{voice.first} shrugs and finds a retired wrestler to fill the seat. You spend the match with the crew, who are surprised you stayed, and it is the best seat in the building in its way.`, effects: [{ conf: 2 }, { fatigue: -2 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'nh_med_ally_column', category: 'media', title: `A Column About {ally.name}`, weight: 2, cooldownDays: 110, maxPerCareer: 3, categoryCooldown: 6,
    cast: { ally: { pick: 'tag', tag: 'ally' }, writer: { pick: 'media', kind: 'journalist' } }, memory: { role: 'ally', max: 1, noResults: true },
    trigger: { mem: [{ role: 'ally', trustGte: 10 }] },
    slots: { charge: [`has stalled out in the mid-card`, `is a great worker with no sense of timing`, `is only still here because of friends in the right chairs`, `has lost a step and refuses to admit it`], ask: [`wants your reaction before the afternoon deadline`, `wants a quote that can run beside the piece`, `has the column ready and wants one sentence from you`] },
    body: [`{writer.name} writes a piece that says {ally.name} {charge}, and then {ask}. {writer.first} is polite about it and plainly assumes you will say something quotable.`, `You and {ally.first} have worked side by side for long enough to know the argument is partly true, and that nobody wants to hear that from you.`],
    choices: [
      { id: 'defend', label: `Defend {ally.first} loudly and by name`, risk: 'med', result: `The quote runs in full and reads like loyalty, and {ally.first} hears about it before dinner. The trust grows, though a few readers decide you are too close to your friends to be fair.`, effects: [{ rel: { who: 'ally', trust: 8, respect: 4, affinity: 4 } }, { pop: 0.2 }, { conf: 1 }] },
      { id: 'measured', label: `Agree with half of it, gently, and credit the rest`, risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: `The half-agreement reads as fair, and {ally.first} reads it as honest. It earns respect on both sides, with a bruise.`, effects: [{ rel: { who: 'ally', respect: 4, trust: -1 } }, { pop: 0.3 }, { conf: 1 }] },
        { weight: 1, text: `The half you agreed with becomes the headline, and the gentle half is cut. {ally.first} calls it a betrayal in front of the whole catering room.`, effects: [{ rel: { who: 'ally', trust: -8, heat: 6 } }, { pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'blame_office', label: `Blame the booking, not {ally.them}`, risk: 'med', result: `You say the problem is the cards and not the card-holder, and the writer scribbles it down with relish. The office does not enjoy being a headline, and the ally owes you a small debt.`, effects: [{ rel: { who: 'ally', trust: 5, affinity: 3 } }, { pop: 0.3 }, { conf: 1 }] },
      { id: 'no_quote', label: `Give no quote: you will tell {ally.first} in person`, risk: 'low', result: `You tell {writer.first} nothing and go find {ally.first} over a vending-machine sandwich. It is a good hour, and the column prints without you in it.`, effects: [{ rel: { who: 'ally', trust: 4, affinity: 3 } }, { fatigue: 2 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'nh_med_praise_quote', category: 'media', title: `What {vet.name} Told the Press`, weight: 2, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 6,
    cast: { vet: { pick: 'tag', tag: 'respected_by' }, writer: { pick: 'media', kind: 'reporter' } }, memory: { role: 'vet', max: 1, noResults: true },
    trigger: { stat: { popularity: { gte: 20 } }, mem: [{ role: 'vet', respectGte: 10 }] },
    slots: { line: [`"the one to watch for the next ten years"`, `"the toughest kid I've shared a ring with"`, `"someone who actually listens, which is rare"`], setting: [`outside the arena after the show`, `at a charity function`, `over the phone for a retrospective`] },
    body: [`{writer.name} found {vet.name} {setting} and got a quote about you: {line}. The reporter reads it to you and then waits for your face to do something.`, `Praise from someone who has earned the right to give it is a weight as well as a gift. Everyone will now watch to see whether you carry it or drop it.`],
    choices: [
      { id: 'humble', label: `Thank {vet.first} and say you have a lot left to learn`, risk: 'low', result: `The modest quote runs beside the praise and makes both of you look good. {vet.first} will hear about it and quietly approve.`, effects: [{ rel: { who: 'vet', respect: 4, trust: 3 } }, { pop: 0.3 }, { conf: 1 }] },
      { id: 'accept', label: `Say the compliment is simply accurate`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.5, charisma: 0.3 }, text: `The line comes out with a grin, not a sneer, and the interview crackles. Fans like a person who can take a compliment.`, effects: [{ pop: 0.6 }, { conf: 3 }] },
        { weight: 1, text: `It reads as arrogance in print, with the grin missing. {vet.first} is mildly amused, and several colleagues decide to keep their distance.`, effects: [{ pop: -0.2 }, { rel: { who: 'vet', respect: -3 } }, { conf: 1 }] } ] },
      { id: 'return_favor', label: `Praise {vet.first} even more, and put it on record`, risk: 'low', result: `You give the reporter three paragraphs about what {vet.first} taught the whole roster without meaning to. The tribute is the better quote, and the veteran gets very busy looking at the floor when you meet.`, effects: [{ rel: { who: 'vet', affinity: 5, respect: 3 } }, { pop: 0.3 }, { fatigue: 2 }] },
      { id: 'deflect_press', label: `Wave it off and ask to talk about the match instead`, risk: 'low', result: `The reporter pivots with visible reluctance. The conversation about the match is thin, and you wonder, on the drive, whether you turned down something you needed.`, effects: [{ pop: -0.1 }, { conf: -1 }] },
    ],
  },
  // ======================= SOCIAL =======================
  {
    id: 'nh_soc_rival_subpost', category: 'social', title: `A Post That Names No One`, weight: 2.5, cooldownDays: 80, maxPerCareer: 3, categoryCooldown: 5,
    cast: { rival: { pick: 'rivalry', minHeat: 20 } }, memory: { role: 'rival', max: 1, noResults: true },
    trigger: { minYear: 2012, stat: { popularity: { gte: 20 } } },
    slots: { post: [`a photograph of a cracked mirror with no caption`, `a one-line post about "people who read their own press"`, `a picture of a clock and the single word "tick"`, `a quote about patience, attributed to nobody`], reaction: [`Your phone has buzzed fourteen times since lunch`, `Three different fans have sent you screenshots`, `The catering staff have already asked you about it`] },
    body: [`{rival.name} posted {post}, and it names nobody, which is exactly how everyone knows who it is about. {reaction}.`, `A reply is a gift to the post. Silence is a gift to {rival.first}. It is hard to find a move that is neither.`],
    choices: [
      { id: 'matching', label: `Post something just as vague and twice as pointed`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.3 }, text: `Your post is a single sentence about hindsight and it is perfect. By morning the replies have started their own feud and you are not required to do anything.`, effects: [{ pop: 0.6 }, { rivalry: { who: 'rival', heat: 6 } }, { event: { type: 'social_post', participants: ['rival'], summary: `Answered a vague post from {rival.name} with a sharper one.`, data: { quality: { base: 62, mic: 0.5, charisma: 0.3, noise: 12 }, viral: { minQuality: 80, chance: 0.35 } } } }] },
        { weight: 1, text: `Your post is a degree too clever and half the replies ask what it means. {rival.first} likes three of the confused comments and moves on.`, effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'ignore', label: `Ignore it and post a picture of your lunch`, risk: 'low', result: `The lunch picture gets an unreasonable number of likes and a thread of fans guessing what it means. {rival.first} gets nothing back, and the silence is its own small win.`, effects: [{ pop: 0.2 }, { conf: 2 }, { rel: { who: 'rival', heat: 2 } }] },
      { id: 'private_msg', label: `Send {rival.first} a private message instead`, risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: `The reply arrives within the hour and it is a little embarrassed. The post comes down by the evening, and neither of you ever refers to it again.`, effects: [{ rel: { who: 'rival', heat: -8, respect: 3 } }, { conf: 1 }] },
        { weight: 1, text: `The message is screenshotted and posted with a caption about being worried. You have now written the best post of the week for your rival.`, effects: [{ rel: { who: 'rival', heat: 6 } }, { pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'quote_mock', label: `Quote the post and mock it line by line`, risk: 'high', result: `Your pile-on is sharp and fast, and the replies feed it for hours. It also drags you into an argument you could have watched from the seats.`, effects: [{ pop: 0.5 }, { rivalry: { who: 'rival', heat: 12 } }, { rel: { who: 'rival', heat: 9, respect: -3 } }, { fatigue: 4 }] },
    ],
  },
  {
    id: 'nh_soc_fan_art', category: 'social', title: `Someone Drew You, Mostly Right`, weight: 1.5, cooldownDays: 100, maxPerCareer: 3, categoryCooldown: 5,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { minYear: 2012, stat: { popularity: { gte: 15 } } },
    slots: { art: [`a pencil drawing of you mid-leap off the top rope`, `a comic strip in which you defeat a vending machine`, `a cross-stitch of your logo, framed`, `a clay figure with a startlingly accurate scowl`], flaw: [`a tiny mistake in the colors`, `your name spelled with an extra letter`, `one detail that is slightly off`] },
    body: [`{fan.name} has posted {art}, tagged you, and apologised in advance for the one error: {flaw}. The post already has three hundred replies, most of them some version of "tell them".`, `It took hours, obviously, and it is the sort of effort that never gets seen by the people who make the money. A quick reply could make a very good week for a stranger.`],
    choices: [
      { id: 'share_it', label: `Share it with a thank-you to {fan.first}`, risk: 'low', result: `The post spreads quickly and {fan.first} wakes up to thousands of messages. You get a small wave of warm attention, and {fan.first} keeps a screenshot of your reply in a wallet.`, effects: [{ pop: 0.5 }, { conf: 2 }] },
      { id: 'commission', label: `Offer to pay {fan.first} for a signed print`, risk: 'low', requires: { stat: { money: { gte: 400 } } }, result: `The print hangs in a corner of your locker room, and every visitor asks about it. {fan.first} goes from fan to the person who got paid by their favorite wrestler, which is a good story.`, effects: [{ money: -400 }, { pop: 0.3 }, { conf: 3 }] },
      { id: 'tease_flaw', label: `Reply with a joke about the one mistake`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The joke is affectionate, and {fan.first} replies with a corrected version the same night. The pair of drawings becomes a tiny meme.`, effects: [{ pop: 0.5 }, { conf: 1 }] },
        { weight: 1, text: `The joke reads as a swipe at an amateur, and strangers pile in with defenses. You delete the reply, but the screenshot has already travelled.`, effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
      { id: 'silent_like', label: `Like the post and keep scrolling`, risk: 'low', result: `A single small heart is a polite gesture, and it is not enough. {fan.first} says thank you to the void, and a few of the commenters say you could have said more.`, effects: [{ pop: 0.05 }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'nh_soc_hashtag', category: 'social', title: `Your Fans Started a Hashtag`, weight: 1.5, cooldownDays: 100, maxPerCareer: 2, categoryCooldown: 5,
    trigger: { minYear: 2012, stat: { popularity: { gte: 30 } } },
    slots: { tag: [`#RaiseTheRoof`, `#OneMoreRound`, `#NobodyBlinks`], hijack: [`a prank account with a million followers`, `a cereal brand's cheerful marketing team`, `a rival's fan army, who like it better than their own`] },
    body: [`The fans made {tag} on their own, and it was going well until {hijack} got hold of it. By lunchtime half of the posts under it have nothing to do with you, and the other half are arguing about whether that matters.`, `You did not start it, and you cannot really stop it. What you do now decides whether it becomes your slogan or your embarrassment.`],
    choices: [
      { id: 'claim', label: `Embrace it and use it on everything you post`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `You make it yours by tagging it on a goofy gym photo, and your fans reclaim the space within a day. The slogan turns up on a banner at the next show.`, effects: [{ pop: 0.8 }, { conf: 2 }] },
        { weight: 1, text: `Using it makes it feel like marketing, and the original fans back away. The tag fades into corporate wallpaper in a week.`, effects: [{ pop: 0.1 }, { conf: -2 }] } ] },
      { id: 'ask_fans', label: `Ask your fans to take it back with their own photos`, risk: 'low', result: `A flood of ring-side photos and homemade signs buries the noise, and the tag becomes a scrapbook. It costs you an evening of replies and earns a whole community's goodwill.`, effects: [{ pop: 0.5 }, { conf: 3 }, { fatigue: 4 }] },
      { id: 'play_along', label: `Play along with the joke that took it over`, risk: 'med', result: `You post a reply in the spirit of the hijackers, and they adore you for it. Your own fans are more mixed, but the joke carries across every side.`, effects: [{ pop: 0.6 }, { conf: 1 }, { fatigue: 2 }] },
      { id: 'drop_it', label: `Let it die and stay out of it`, risk: 'low', result: `You do not touch it, and within three days the tag belongs to somebody else. Nothing goes wrong, which is not the same as anything going right.`, effects: [{ pop: -0.1 }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'nh_soc_ally_challenge', category: 'social', title: `{ally.name} Tags You in a Dare`, weight: 2, cooldownDays: 100, maxPerCareer: 3, categoryCooldown: 5,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1, noResults: true },
    trigger: { minYear: 2012, mem: [{ role: 'ally', trustGte: 10 }] },
    slots: { dare: [`a video of a one-armed push-up with {ally.their} favourite song playing`, `a photograph of the dullest meal you can find on the road`, `a clip of a dramatic entrance in a hotel corridor`], deadline: [`"by midnight or you owe me dinner"`, `"before your next match"`, `"or I tell everyone about the bus incident"`] },
    body: [`{ally.name} posted {dare} and tagged you with the words {deadline}. The replies are encouraging in the way that crowds are encouraging at the edge of a diving board.`, `It is silly and harmless, and it is also a public test of how well the two of you play together.`],
    choices: [
      { id: 'do_it', label: `Do the dare exactly as asked`, risk: 'low', result: `You post it within the hour, and {ally.first} responds with a string of capital letters. It is a small joy, and the whole thing takes less effort than a warm-up.`, effects: [{ rel: { who: 'ally', trust: 4, affinity: 5 } }, { pop: 0.3 }, { fatigue: 2 }] },
      { id: 'one_up', label: `Do it, but twist it so {ally.first} has to pay up`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, mic: 0.3 }, text: `Your version is funnier than the original, and the replies start a tally between the two of you. {ally.first} sends back a gif and a challenge double the size.`, effects: [{ rel: { who: 'ally', affinity: 6, respect: 2 } }, { pop: 0.6 }] },
        { weight: 1, text: `The twist falls flat and {ally.first} is the only one who laughs. It is a quiet embarrassment between friends, and it passes.`, effects: [{ rel: { who: 'ally', affinity: 1 } }, { pop: -0.1 }, { conf: -1 }] } ] },
      { id: 'decline', label: `Decline gracefully with a joke about your knees`, risk: 'low', result: `The excuse is funny and {ally.first} accepts it with a laughing reaction. The fans are slightly disappointed, and the friendship is unaffected.`, effects: [{ pop: -0.1 }, { fatigue: -1 }] },
      { id: 'use_it', label: `Turn the dare into a charity appeal`, risk: 'med', result: `You post the dare with a link to a local food bank and ask your fans to match it. {ally.first} raises the stakes publicly, and the pot ends up bigger than either of you thought it would be.`, effects: [{ rel: { who: 'ally', respect: 5, trust: 3 } }, { pop: 0.6 }, { money: -300 }, { conf: 2 }] },
    ],
  },
  {
    id: 'nh_soc_mentor_post', category: 'social', title: `{mentor.name} Said It in Public`, weight: 2, cooldownDays: 130, maxPerCareer: 2, categoryCooldown: 5,
    cast: { mentor: { pick: 'tag', tag: 'mentor' } }, memory: { role: 'mentor', max: 1, noResults: true },
    trigger: { minYear: 2012, mem: [{ role: 'mentor', trustGte: 5 }] },
    slots: { post: [`a long paragraph about how proud {mentor.first} is of you`, `a photograph of the two of you squinting at the camera`, `a one-line message that just says "told you so"`], tone: [`warm and slightly misspelled`, `dry, with a single initial for a signature`, `more open than anyone expected`] },
    body: [`{mentor.name} has put up {post}. The tone is {tone}, and it has been shared more than anything on your own page this month.`, `A response in public has to match the register. A flip answer wastes it, and an overblown one embarrasses you both.`],
    choices: [
      { id: 'warm_reply', label: `Reply warmly and tell the story behind it`, risk: 'low', result: `You write four honest lines about the early days and keep it free of jokes. {mentor.first} calls to say thanks, in a voice that is not entirely steady.`, effects: [{ rel: { who: 'mentor', trust: 5, affinity: 5, respect: 3 } }, { pop: 0.4 }, { conf: 2 }] },
      { id: 'joke_back', label: `Fire back with a joke about {mentor.their} age`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, mic: 0.3 }, text: `The joke is exactly the right size and {mentor.first} sends three of the same face back. The thread becomes a loop of insults that is secretly all affection.`, effects: [{ rel: { who: 'mentor', affinity: 5 } }, { pop: 0.6 }] },
        { weight: 1, text: `The joke arrives as a dig on a day when {mentor.first} meant something sincere. It is cleaned up an hour later with a private apology.`, effects: [{ rel: { who: 'mentor', trust: -4, respect: -2 } }, { pop: 0.1 }, { conf: -2 }] } ] },
      { id: 'share_fans', label: `Share it with your fans and let them react`, risk: 'low', result: `The fans take it and run, and {mentor.first} is flooded with thanks from people who have never met {mentor.them}. Your own part of the story gets a little lost in the tide.`, effects: [{ pop: 0.5 }, { rel: { who: 'mentor', affinity: 2 } }] },
      { id: 'say_nothing', label: `Leave it unanswered: the real thanks happens in person`, risk: 'med', result: `The comments keep asking why you have not replied, and {mentor.first} says nothing at all. It is a risk that works out only if you really do go and say it.`, effects: [{ rel: { who: 'mentor', trust: -2 } }, { conf: -1 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'nh_soc_insulter_thread', category: 'social', title: `{foe.name} Has Receipts`, weight: 2.5, cooldownDays: 90, maxPerCareer: 3, categoryCooldown: 5, major: true,
    cast: { foe: { pick: 'tag', tag: 'insulted_by' } }, memory: { role: 'foe', max: 2, noResults: true },
    trigger: { minYear: 2012, mem: [{ role: 'foe', tag: 'insulted_by' }] },
    slots: { post: [`a thread of side-by-side clips of your promos`, `a long video made in a parked car`, `a quiet post that just says "ask them what they said"`], effect: [`The first reply is already a joke at your expense`, `Your agent has sent the link with no comment at all`, `The thread is being passed around the locker room like a plate of snacks`] },
    body: [`{foe.name} has posted {post}, and it makes the case that you owe an apology. {effect}.`, `Some of the points are fair. That is what makes this worse, and the numbers underneath are still climbing.`],
    choices: [
      { id: 'above', label: `Say nothing and let the points fade`, risk: 'low', result: `You mute the thread and go to the gym. By evening the conversation has moved to something else, and some of it is quietly in your favour.`, effects: [{ conf: 1 }, { pop: -0.1 }, { fatigue: -2 }] },
      { id: 'own_part', label: `Reply with a short apology for the true parts`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, mic: 0.3 }, text: `You acknowledge exactly what was true and nothing more. {foe.first} responds with something almost generous, and the story ends at the apology instead of continuing past it.`, effects: [{ rel: { who: 'foe', heat: -12, respect: 5 } }, { pop: 0.5 }, { conf: 1 }, { event: { type: 'social_post', participants: ['foe'], summary: `Apologised for the true parts of {foe.name}'s criticism.`, data: { quality: { base: 62, charisma: 0.5, noise: 10 }, handled: true } } }] },
        { weight: 1, text: `The apology is quoted as proof you can be pushed, and the replies swarm with demands for more. You have started a new cycle rather than ended the old one.`, effects: [{ rel: { who: 'foe', heat: 4 } }, { pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'rally', label: `Rally your fans against the thread`, risk: 'high', result: `Your followers do what followers do, and {foe.first} turns off replies within an hour. It feels like a win and reads as bullying to anyone who was not already on your side.`, effects: [{ pop: 0.5 }, { rivalry: { who: 'foe', heat: 12 } }, { rel: { who: 'foe', heat: 10, respect: -4 } }, { conf: 1 }] },
      { id: 'reach_out', label: `Send {foe.first} a private note asking to talk`, risk: 'low', result: `{foe.first} replies the next morning with a single line and a time. The meeting is not a reunion, but it is the first conversation in a while that does not feel staged.`, effects: [{ rel: { who: 'foe', heat: -6, trust: 3, respect: 2 } }, { fatigue: 3 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'nh_soc_accidental_live', category: 'social', title: `The Phone Was Recording`, weight: 2, cooldownDays: 140, maxPerCareer: 2, categoryCooldown: 5,
    cast: { gm: { pick: 'staff', role: 'gm' } },
    trigger: { minYear: 2015, stat: { popularity: { gte: 25 } } },
    slots: { said: [`a joke about the catering`, `a fairly honest opinion about the booking`, `a bit of gossip about someone who was not in the room`], length: [`four minutes`, `almost nine minutes`, `a full eleven minutes`] },
    body: [`You tapped the wrong button, and for {length} the world watched you in the hallway, delivering {said}. A viewer count in the thousands notified you before you noticed the red light.`, `{gm.name} has not called yet, which is always worse. The clip is being cut into pieces somewhere.`],
    choices: [
      { id: 'delete_apologise', label: `Delete it and post a plain apology`, risk: 'low', result: `The apology is short and clear, and the clips of the original are only passed around by people who were going to anyway. {gm.first} writes it up as a handled situation.`, effects: [{ pop: -0.1 }, { conf: -1 }, { fatigue: 2 }] },
      { id: 'own_with_humour', label: `Own it with humour and keep the video up`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, mic: 0.4 }, text: `Your caption makes the whole thing a joke at your own expense, and the numbers take off in a friendly direction. {gm.first} cannot officially approve, but the smile on the other end is audible.`, effects: [{ pop: 0.8 }, { conf: 2 }, { event: { type: 'social_post', participants: ['gm'], summary: `Laughed off an accidental live video.`, data: { quality: { base: 62, mic: 0.4, charisma: 0.5, noise: 14 }, viral: { minQuality: 80, chance: 0.4 }, controversy: true } } }] },
        { weight: 1, text: `The joke does not cover the part that stung someone, and the apology you owe them gets bigger as the day goes on. {gm.first} schedules a meeting.`, effects: [{ pop: -0.4 }, { conf: -4 }] } ] },
      { id: 'get_ahead', label: `Walk to {gm.first}'s office and explain before the call`, risk: 'low', result: `{gm.first} looks up with the face of someone expecting a worse conversation. The moment you arrive first buys you the benefit of the doubt, and a note goes on file that you handled it well, at the cost of a long, awkward hour.`, effects: [{ conf: 2 }, { fatigue: 4 }, { pop: -0.1 }] },
      { id: 'blame_glitch', label: `Say the app glitched and the video was not meant to go out`, risk: 'med', result: `The excuse is plausible and half the viewers believe it, and the other half have the screenshots to prove the red light. It works until someone writes about the discrepancy.`, effects: [{ pop: -0.2 }, { conf: 1 }] },
    ],
  },
  {
    id: 'nh_soc_parody', category: 'social', title: `The Account That Is Almost You`, weight: 1.5, cooldownDays: 140, maxPerCareer: 2, categoryCooldown: 5,
    trigger: { minYear: 2012, stat: { popularity: { gte: 30 } } },
    slots: { bit: [`reposts your promos with all the nouns swapped for vegetables`, `pretends to be your personal trainer and gives deranged advice`, `captions old photos with fake training tips`], growth: [`forty thousand followers`, `more followers than your serious page`, `a fan club of its own`] },
    body: [`Someone runs an account that {bit}, and it has {growth}. The voice is eerie, and you are fairly sure the joke is better than anything on your real page.`, `The question is not who it is. The question is whether you are the sort of person who laughs at your own reflection.`],
    choices: [
      { id: 'follow', label: `Follow it and reply in your own voice`, risk: 'low', result: `The creator replies with a delighted, panicked paragraph, and the two feeds begin to cross-pollinate. You come across as someone with a sense of humour, which people did not necessarily expect, and the replies eat your evening.`, effects: [{ pop: 0.5 }, { conf: 1 }, { fatigue: 5 }] },
      { id: 'collab', label: `Invite the creator to write one of your promos`, risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.5, charisma: 0.4 }, text: `The draft is half-brilliant and half-unusable, and you keep the good half. The line goes out on live television and the clip of the building laughing finds its own audience.`, effects: [{ pop: 1.0 }, { mic: 1 }, { fatigue: 4 }] },
        { weight: 1, text: `The creator panics under the spotlight and delivers a flat, careful script. The account goes quiet, which is a quiet loss for everyone.`, effects: [{ pop: -0.2 }, { conf: -2 }, { fatigue: 4 }] } ] },
      { id: 'report', label: `Report it to the platform and get it taken down`, risk: 'med', result: `The account vanishes within a day and so does the goodwill. A fan-run archive of the best posts is up within the week, and your name is attached to a joke about being no fun.`, effects: [{ pop: -0.5 }, { conf: -1 }] },
      { id: 'ignore_bit', label: `Pretend it does not exist`, risk: 'low', result: `The account keeps growing and the jokes keep arriving in your mentions from friends. You are the only person in the building not in on the best bit about yourself.`, effects: [{ pop: -0.1 }, { conf: -2 }] },
    ],
  },
  {
    id: 'nh_soc_reply_war', category: 'social', title: `Your Replies Have Taken Sides`, weight: 1.5, cooldownDays: 100, maxPerCareer: 3, categoryCooldown: 5,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { minYear: 2012, stat: { popularity: { gte: 30 } } },
    slots: { topic: [`whether your last entrance was too long`, `which of your finishers is actually the best`, `whether you should be a hero or a villain`, `who you ought to be fighting next`], mood: [`it started politely`, `it opened with a pun`, `it began with a heartfelt essay`] },
    body: [`Under your latest post, strangers are arguing about {topic}. {mood}, and {fan.name} has been defending you for three hours against people who now seem personally wounded.`, `It is flattering, and it is going nowhere. The thread has the tempo of a bar fight in a very small bar.`],
    choices: [
      { id: 'calm_post', label: `Post a calm note thanking everyone and asking for kindness`, risk: 'low', result: `The tone of the thread softens within the hour, and {fan.first} sends a short, grateful message. A cynic notes that you waited three hours, but the post still works.`, effects: [{ pop: 0.3 }, { conf: 1 }, { fatigue: 1 }] },
      { id: 'add_fuel', label: `Reply to the funniest insult and stir it up`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.3 }, text: `Your reply is an instant classic, and the thread doubles in size with people who came for the show. The numbers are spectacular, and you spend the rest of the night being quoted.`, effects: [{ pop: 0.8 }, { conf: 1 }, { fatigue: 4 }] },
        { weight: 1, text: `Your reply turns the whole thread against you, and a few fans leave in clear disappointment. You can feel the mood curdle around your name.`, effects: [{ pop: -0.5 }, { conf: -3 }] } ] },
      { id: 'thank_fan', label: `Thank {fan.first} by name and ask {fan.them} to step back`, risk: 'med', result: `{fan.first} is moved by the attention and quietly logs off. The thread cools with them gone, and you realise you may have sent away the person on your side.`, effects: [{ pop: 0.1 }, { conf: 1 }] },
      { id: 'mute', label: `Mute the thread and go to bed`, risk: 'low', result: `You sleep well. By the time you check in the morning the argument has moved to a different post, and nobody has needed you for any of it.`, effects: [{ fatigue: -3 }, { pop: -0.1 }] },
    ],
  },
  // ======================= FANS =======================
  {
    id: 'nh_fan_ward_request', category: 'fans', title: `A Message for the Ward`, weight: 2, cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 6,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 15 } } },
    slots: { who: [`a grandmother`, `a younger brother`, `a father who taught {fan.them} to love the sport`], where: [`at the stage door`, `by the merchandise stand`, `at the edge of the autograph line`] },
    body: [`{fan.name} catches you {where} and asks, very quickly so as not to lose the nerve, for a message for {who} who is in a hospital ward across town. {fan.they} have a notepad ready and a name already written at the top.`, `It is not a favour you are obliged to do, and it is the kind of thing nobody will ever hold you to. The notepad is shaking a little.`],
    choices: [
      { id: 'record', label: `Record a proper message on the spot`, risk: 'low', result: `You take your time, say the name correctly, and leave out the wrestling voice. {fan.first} watches with both hands over {fan.their} mouth, and you lose twenty minutes of your night without a regret.`, effects: [{ conf: 3 }, { pop: 0.3 }, { fatigue: 2 }] },
      { id: 'visit', label: `Offer to stop by the ward in person tomorrow`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The ward is quieter than you expected and the patient grips your hand for far longer than a handshake. You leave with a heavy chest and a lighter mind, and the nurses ask for a photo.`, effects: [{ pop: 0.6 }, { conf: 4 }, { fatigue: 8 }] },
        { weight: 1, text: `Traffic and a late call time cut the visit to eight minutes. It still matters to the family, but you spend the rest of the day feeling that you did not do it properly.`, effects: [{ pop: 0.2 }, { conf: 1 }, { fatigue: 8 }] } ] },
      { id: 'send_gear', label: `Send signed gear and a note by courier`, risk: 'low', result: `The package arrives within two days, and the card inside is written in your own hand. It cost money and no time, and it was well received, if less intimate than it might have been.`, effects: [{ money: -250 }, { pop: 0.2 }, { conf: 1 }] },
      { id: 'brief_wave', label: `Say a quick hello and explain you are due in the ring`, risk: 'low', result: `{fan.first} nods and thanks you anyway, and you jog off down the corridor. The guilt catches up in the shower, and you decide that is probably the correct amount.`, effects: [{ conf: -2 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'nh_fan_two_faces', category: 'fans', title: `Sign Between the Two of You`, weight: 2, cooldownDays: 90, maxPerCareer: 3, categoryCooldown: 6,
    cast: { rival: { pick: 'rivalry', minHeat: 20 }, fan: { pick: 'media', kind: 'fan' } }, memory: { role: 'rival', max: 1, noResults: true },
    trigger: { stat: { popularity: { gte: 20 } } },
    slots: { item: [`a poster of you and {rival.name} locked up mid-brawl`, `a program with both of your faces on the cover`, `a homemade shirt with half of each of your logos`], ask: [`wants it signed in the space between the two of you`, `asks which of you is going to win, and means it`, `has already collected {rival.first}'s signature and wants yours beside it`] },
    body: [`In the signing line, {fan.name} holds up {item} and {ask}. Behind {fan.them}, a few of the people waiting are listening harder than they pretend to be.`, `It is a small moment and an easy one to get wrong. The fan loves both of you, and that is the whole difficulty.`],
    choices: [
      { id: 'sign_clean', label: `Sign your own name and keep it light`, risk: 'low', result: `You sign in the corner, add a short joke, and the line moves. It is an uneventful minute and the fan seems happy with it.`, effects: [{ pop: 0.2 }, { conf: 1 }] },
      { id: 'sign_over', label: `Sign across {rival.first}'s face with a flourish`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The line cheers and the fan is thrilled. Somebody photographs it, and {rival.first} will see the picture before the weekend.`, effects: [{ pop: 0.6 }, { rivalry: { who: 'rival', heat: 6 } }, { rel: { who: 'rival', heat: 5 } }] },
        { weight: 1, text: `The fan's smile wavers, because it was a favorite item and now it looks scribbled on. You hear the quiet "oh" and cannot take it back.`, effects: [{ pop: -0.3 }, { conf: -2 }, { rel: { who: 'rival', heat: 3 } }] } ] },
      { id: 'sign_both', label: `Sign beside {rival.first} and write "may the best one win"`, risk: 'low', result: `The fan looks thrilled to have the two names on the same page. {rival.first} hears about it and sends a short, dry word of thanks via the dressing-room grapevine.`, effects: [{ rel: { who: 'rival', respect: 4, heat: -3 } }, { pop: 0.2 }] },
      { id: 'ask_fan', label: `Ask the fan to make the case for who should win`, risk: 'med', result: `The fan makes an oddly convincing case for you, and half the line applauds. You walk away with a few ideas for a promo you did not expect to find in a queue.`, effects: [{ mic: 1 }, { pop: 0.3 }, { fatigue: 3 }] },
    ],
  },
  {
    id: 'nh_fan_heckler', category: 'fans', title: `The Voice in {row}`, weight: 1.5, contexts: ['post_match', 'show_day'], cooldownDays: 110, maxPerCareer: 3, categoryCooldown: 6,
    trigger: { stat: { popularity: { gte: 25 }, matches: { gte: 20 } } },
    slots: { row: [`the Front Row`, `the Balcony`, `Seat 14B`], line: [`a single word, always the same`, `a running commentary on your hair`, `a loud count of every time you hit the mat`] },
    body: [`One voice from {row} has followed you through the whole night, delivering {line}. The rest of the crowd has started to turn their heads and wait for you to respond.`, `Every performer knows this moment. There is no good way to ignore a heckler and no easy way to beat one.`],
    choices: [
      { id: 'turn_around', label: `Make the heckler part of the match`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.6, mic: 0.4 }, text: `You pause, point, and give the voice a nickname. The building roars, and for ninety seconds you have the show in your hand.`, effects: [{ pop: 0.8 }, { conf: 3 }] },
        { weight: 1, text: `The nickname falls flat and the heckler returns a better one. The laugh goes against you, and you spend the next three minutes with your pace gone.`, effects: [{ pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'ignore', label: `Stay in character and ignore every word`, risk: 'low', result: `The heckler keeps up for another ten minutes, then loses steam. Nobody in the building will remember anything about it, and neither will you.`, effects: [{ conf: 1 }, { fatigue: 2 }] },
      { id: 'ask_security', label: `Quietly ask security to have a word`, risk: 'med', result: `Two security staff have a quiet conversation in the aisle and the voice goes silent. The crowd cheers a little too loudly at the silence, and you feel less heroic than relieved.`, effects: [{ conf: 1 }, { pop: -0.2 }] },
      { id: 'hallway_chat', label: `Find the heckler afterward and shake their hand`, risk: 'low', result: `You go looking after the show and find a nervous person with a warm soda who confesses to being your biggest fan. It turns into a story you tell for years.`, effects: [{ pop: 0.3 }, { conf: 2 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'nh_fan_tattoo', category: 'fans', title: `Your Logo, Permanently`, weight: 1.5, cooldownDays: 160, maxPerCareer: 2, categoryCooldown: 6,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 40 } } },
    slots: { place: [`on a forearm`, `across a calf`, `just inside a wrist`], quality: [`slightly crooked`, `exactly right`, `with a tiny misspelling in the lettering`] },
    body: [`{fan.name} rolls up a sleeve at the barricade to show you your logo, tattooed {place}. The work is {quality}, and {fan.first} watches your face with the helpless hope of a person who has already done it.`, `It is a lovely thing and a slightly terrifying one. You have just been made a permanent part of a stranger's body, and no one asked what you thought.`],
    choices: [
      { id: 'sign_skin', label: `Sign next to it with a marker and a laugh`, risk: 'low', result: `Your autograph sits beside the ink, and {fan.first} swears never to wash it. The crowd by the barricade cheers, and a photographer who happens to be passing takes the shot.`, effects: [{ pop: 0.4 }, { conf: 2 }] },
      { id: 'gently_warn', label: `Tell {fan.first} you are honoured but a bit worried`, risk: 'med', result: `You say that careers end and logos change, and {fan.first} insists the tattoo is for the ring and not the paycheck. It is an honest conversation that leaves you humbled, and it earns respect from a few listeners.`, effects: [{ conf: 1 }, { attr: { name: 'psychology', delta: 1 } }, { pop: 0.2 }] },
      { id: 'pay_fix', label: `Offer to pay for any touch-up work`, risk: 'low', requires: { stat: { money: { gte: 500 } } }, result: `The fan declines the money and accepts the sentiment, but a week later a note arrives with a photograph of the corrected lettering. You keep the note in a bag that goes everywhere.`, effects: [{ money: -500 }, { conf: 3 }, { pop: 0.3 }] },
      { id: 'moment_photo', label: `Ask a photographer to shoot it for the programme`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `The photo runs half a page in the next programme and brings a flood of new supporters. {fan.first} becomes slightly famous for a week, delightedly.`, effects: [{ pop: 0.7 }, { conf: 1 }] },
        { weight: 1, text: `A sarcastic crowd picks apart the tattoo, and {fan.first} is hurt by the attention. The photograph is pulled from the programme, but the damage to the evening is done.`, effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
    ],
  },
  {
    id: 'nh_fan_split_letters', category: 'fans', title: `Letters After the Split`, weight: 2.5, cooldownDays: 120, maxPerCareer: 2, categoryCooldown: 6,
    cast: { former: { pick: 'tag', tag: 'betrayal' }, fan: { pick: 'media', kind: 'fan' } }, memory: { role: 'former', max: 2 },
    trigger: { mem: [{ role: 'former', betrayal: true }] },
    slots: { form: [`a careful handwritten letter`, `a furious typed letter in capital letters`, `a card with a drawing of the two of you on the front`], stand: [`asking whether the rumours about {former.name} are true`, `explaining whose side the writer is on, with footnotes`, `asking if the two of you could ever be friends again`] },
    body: [`Among the mail at the venue is {form} from {fan.name}, {stand}. It has been folded and unfolded so many times it has gone soft at the creases.`, `Plenty of people have opinions about what happened between you and {former.first}. This is one of the few that comes with a return address.`],
    choices: [
      { id: 'honest_reply', label: `Write back honestly about what happened`, risk: 'med', result: `You write for an hour and keep it fair to both sides, which takes more work than anger would have. {fan.first} replies with a postcard that says only "thank you for telling me".`, effects: [{ conf: 1 }, { fatigue: 4 }, { pop: 0.3 }, { rel: { who: 'former', respect: 1 } }] },
      { id: 'party_line', label: `Send a polite form reply and move on`, risk: 'low', result: `The form letter is warm enough and goes out with a signed card. {fan.first} never writes again, and you tell yourself that is normal.`, effects: [{ pop: -0.1 }, { fatigue: -1 }] },
      { id: 'public_answer', label: `Answer the question in the ring from the microphone`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.4 }, text: `You read part of the letter aloud and answer it plainly. The building falls silent in the right places, and {fan.first}, somewhere in the stands, gets a long standing moment.`, effects: [{ pop: 0.8 }, { conf: 2 }, { rel: { who: 'former', heat: 5 } }] },
        { weight: 1, text: `Reading a private letter in public feels like a trespass, and the crowd shifts. {fan.first} sends a stiff note that says that was not the plan.`, effects: [{ pop: -0.2 }, { conf: -3 }, { rel: { who: 'former', heat: 5 } }] } ] },
      { id: 'forward', label: `Forward the letter to {former.first} without comment`, risk: 'med', result: `{former.first} reads it in the production office and takes a long time to put it down. Nothing is said, but a faint thaw is noticeable at the next show.`, effects: [{ rel: { who: 'former', trust: 2, heat: -3 } }, { conf: -1 }] },
    ],
  },
  {
    id: 'nh_fan_kid_barricade', category: 'fans', title: `The Smallest Person at the Barricade`, weight: 1.5, contexts: ['pre_show', 'show_day', 'post_show'], cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 6,
    trigger: { stat: { popularity: { gte: 20 } } },
    slots: { gear: [`a homemade copy of your ring jacket`, `face paint in your colors`, `cardboard boots with your logo on the side`], posture: [`pretending not to be nervous`, `standing on a folded chair to see`, `holding a sign that says "do the move"`] },
    body: [`A child at the barricade has turned up in {gear}, {posture}, and the parent behind them is mouthing "sorry" over the top of a camera. The person next to you is trying very hard not to laugh.`, `The rest of the line has gone quiet. It is a moment that costs nothing and will be remembered by one person for the rest of their life.`],
    choices: [
      { id: 'photo', label: `Crouch down for a proper photograph`, risk: 'low', result: `You take a full minute, ask the child's name, and get it right. The parent's photograph is passed around the arena by the end of the night.`, effects: [{ pop: 0.4 }, { conf: 2 }] },
      { id: 'bring_in', label: `Bring the child in for a quick tour of the ring`, risk: 'med', outcomes: [
        { weight: 2, text: `The child stands on the apron for a full minute and tests the ropes with a serious face. The ring crew, the officials and the parent will all remember it.`, effects: [{ pop: 0.6 }, { conf: 3 }, { fatigue: 3 }] },
        { weight: 1, text: `A producer shuts down the idea for liability reasons, and you have to tell a delighted child no. The apology lands softly, but the moment has gone strange.`, effects: [{ pop: -0.1 }, { conf: -1 }, { fatigue: 2 }] } ] },
      { id: 'give_item', label: `Give the child something you are wearing`, risk: 'low', result: `A glove, a wristband or a bandana changes hands and a small face goes through three expressions in a second. You feel the loss of the item a little and the gain of the reaction a lot.`, effects: [{ money: -80 }, { pop: 0.5 }, { conf: 2 }] },
      { id: 'wave_on', label: `Wave and keep moving: the schedule is tight`, risk: 'low', result: `The wave is warm and short and the child is happy enough. Your own mood is a bit gray when the next autograph hunter asks for a minute.`, effects: [{ fatigue: -1 }, { conf: -1 }] },
    ],
  },
  {
    id: 'nh_fan_honest_letter', category: 'fans', title: `A Letter from Someone Who Still Believes`, weight: 2, cooldownDays: 110, maxPerCareer: 3, categoryCooldown: 6,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { loseStreak: { gte: 3 }, popularity: { gte: 15 } } },
    slots: { noticed: [`you hesitate for half a second before the finish`, `you have stopped looking at the crowd`, `you seem to be working a beat too fast`], form: [`on lined paper from a school notebook`, `on the back of a train timetable`, `in a card that was clearly bought in a hurry`] },
    body: [`The letter from {fan.name} is {form}, and it opens by saying how much the writer still believes. The second paragraph says {fan.they} have noticed that {noticed}, and the third asks you not to take it badly.`, `Nobody inside the building has said this to you, and the most irritating part is how plausible it sounds.`],
    choices: [
      { id: 'test_it', label: `Watch your own tape and look for it`, risk: 'low', result: `It takes two evenings and a pot of coffee, but the half-second is there, plain as a missed step. You carry the fix into the next match, and a note to the fan goes in the post.`, effects: [{ attr: { name: 'technical', delta: 1 } }, { conf: 2 }, { fatigue: 4 }] },
      { id: 'write_back', label: `Write back and thank {fan.first} warmly`, risk: 'low', result: `The reply is brief and sincere and arrives with a signed card. {fan.first} writes to say the letter was framed, which is more than you managed with the one that came before.`, effects: [{ pop: 0.3 }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'dismiss', label: `Dismiss it: fans always think they can see everything`, risk: 'med', result: `You file it with the rest of the mail, and the next week's matches go the way the last three did. The letter stays in the pile and a small, uncomfortable thought stays with you.`, effects: [{ conf: 1 }, { pop: -0.1 }] },
      { id: 'tell_agent', label: `Take the observation to your agent as if it were your own`, risk: 'med', result: `The agent takes the idea seriously, and the notes that follow are a lot more useful than the last round. You do not mention where you found it, and a little pride goes into your pocket with the credit.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { conf: 1 }, { fatigue: 3 }] },
    ],
  },
  {
    id: 'nh_fan_club_president', category: 'fans', title: `The Fan Club Would Like a Word`, weight: 1.5, cooldownDays: 160, maxPerCareer: 2, categoryCooldown: 6,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 30 } } },
    slots: { request: [`a meet-and-greet at their annual gathering`, `a signed banner for the club's first anniversary`, `a visit to the club's hometown on your next day off`], size: [`small enough to fit around one table`, `two hundred strong`, `big enough to fill a coach`] },
    body: [`{fan.name} runs the official unofficial fan club and has come to ask for {request}. The club is {size}, and the president reads out a list of things they have already organised, including the cake.`, `The scale is modest, which is part of the appeal and part of the problem. Every minute spent on the club is a minute not spent on something that pays.`],
    choices: [
      { id: 'attend', label: `Attend in person and stay for the whole thing`, risk: 'med', result: `You arrive tired, leave energised, and learn that one member walked two miles to be there. The club's loyalty becomes a kind of mortgage on your name, in a good way.`, effects: [{ pop: 0.6 }, { conf: 3 }, { fatigue: 8 }] },
      { id: 'video', label: `Send a video message and a signed banner`, risk: 'low', result: `The banner hangs on the wall of a rented hall, and the video plays twice. It is gracious and a little remote, and the club is content without being thrilled.`, effects: [{ pop: 0.3 }, { conf: 1 }, { fatigue: 1 }] },
      { id: 'official', label: `Offer to make the club official, with a small budget`, risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.3 }, text: `With a bank account, a logo and a newsletter, the club grows in size and ambition. The merchandise table at the next show sells out in an hour.`, effects: [{ money: -1200 }, { pop: 0.9 }, { fatigue: 4 }] },
        { weight: 1, text: `The club's committee fights about the logo for three months and the whole thing fizzles out. Money gone, goodwill dented, and a thank-you note nobody bothered to sign.`, effects: [{ money: -1200 }, { pop: -0.1 }, { conf: -2 }] } ] },
      { id: 'decline', label: `Send regrets and a polite note`, risk: 'low', result: `The note is kind and clear, and the club does not hold it against you. You do wonder, on a long drive, what the cake tasted like.`, effects: [{ fatigue: -2 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'nh_fan_ally_chant', category: 'fans', title: `They Are Chanting {ally.name}'s Name`, weight: 2, contexts: ['post_match', 'show_day'], cooldownDays: 110, maxPerCareer: 3, categoryCooldown: 6,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1, noResults: true },
    trigger: { stat: { popularity: { gte: 25 } }, mem: [{ role: 'ally', trustGte: 10 }] },
    slots: { chant: [`a long, off-key chorus`, `three loud syllables and a clap`, `a surprisingly good harmony`], moment: [`as you pose in the ring`, `halfway up the ramp`, `while you wait for the bell`] },
    body: [`{moment}, a section of the crowd starts up {chant} for {ally.name}, who is nowhere in sight. The chant spreads until it has swallowed your own music.`, `You have been the center of attention in this building for years. Tonight, for ninety seconds, you are not, and your friend is not even there to enjoy it.`],
    choices: [
      { id: 'join', label: `Join in and lead the chant yourself`, risk: 'low', result: `You raise both arms and conduct the room, and the sound doubles. {ally.first} hears about it from three different people before the show ends, and sends back a note with a great many exclamation marks.`, effects: [{ rel: { who: 'ally', trust: 4, affinity: 5 } }, { pop: 0.4 }, { conf: 1 }] },
      { id: 'redirect', label: `Redirect the room to chant your own name`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.3 }, text: `You stretch a hand out until the sound rises with it, and the building follows. It is a masterclass in crowd control and the ally never hears about it.`, effects: [{ pop: 0.6 }, { conf: 3 }, { rel: { who: 'ally', respect: -1 } }] },
        { weight: 1, text: `The building does not follow, and the pause is long enough to hear a vendor's cooler. You look petty, and {ally.first} hears about it by morning.`, effects: [{ pop: -0.4 }, { conf: -3 }, { rel: { who: 'ally', trust: -4 } }] } ] },
      { id: 'tell_ally', label: `Find {ally.first} afterward and describe it note for note`, risk: 'low', result: `You act out the whole ninety seconds in the corridor, with the harmony, and {ally.first} makes you do it twice. You get a hug that goes on slightly too long.`, effects: [{ rel: { who: 'ally', trust: 5, affinity: 6 } }, { fatigue: 1 }] },
      { id: 'ignore', label: `Wait it out and play it cool`, risk: 'low', result: `The chant fades after a minute and a half. You have not lost anything, though a small voice suggests that you did not gain anything, either.`, effects: [{ conf: 1 }, { rel: { who: 'ally', affinity: -1 } }] },
    ],
  },
  // ======================= FACTION =======================
  {
    id: 'nh_fac_van_seats', category: 'faction', title: `Who Sits Where in the Van`, weight: 1.5, cooldownDays: 140, maxPerCareer: 2, categoryCooldown: 6,
    cast: { mate: { pick: 'tag', tag: 'ally' } }, memory: { role: 'mate', max: 1, noResults: true },
    trigger: { flag: 'in_stable', mem: [{ role: 'mate', trustGte: 10 }] },
    slots: { rule: [`the leader takes the front, the newest member takes the middle bench`, `nobody sits behind the driver, for reasons no one will explain`, `the seat by the cooler belongs to whoever lost most recently`], hour: [`a six-hour drive`, `an overnight run to the next town`, `a short hop with a very long wait at the end`] },
    body: [`The stable has an unwritten seating plan for the van, and tonight someone has broken it. The plan says {rule}, and {mate.name} is sitting in the wrong place with a smile that suggests it was deliberate. Ahead lies {hour}.`, `It sounds trivial, and in a small closed world it never is. Every seat in the van is a position in the stable.`],
    choices: [
      { id: 'take_back', label: `Take the cramped back bench and say nothing`, risk: 'low', result: `Your knees complain for six hours, and nobody notices the favour you did. {mate.first} does, and a quiet bar of chocolate appears on your lap at the first stop.`, effects: [{ rel: { who: 'mate', trust: 4, affinity: 3 } }, { fatigue: 5 }, { conf: -1 }] },
      { id: 'enforce', label: `Enforce the old order and ask {mate.first} to move`, risk: 'med', outcomes: [
        { weight: 1, bonus: { confidence: 0.4 }, text: `{mate.first} laughs, shifts, and the van settles into its old pattern. The tension was a prank, and a good one.`, effects: [{ rel: { who: 'mate', respect: 2 } }, { conf: 2 }] },
        { weight: 1, text: `It was not a prank, and the next three hours pass in a flat, formal quiet. The stable now has a feud about a seat.`, effects: [{ rel: { who: 'mate', trust: -6, heat: 4 } }, { conf: -1 }, { fatigue: 3 }] } ] },
      { id: 'rotate', label: `Propose a rotating schedule everyone writes on the dash`, risk: 'low', result: `The list goes up on a strip of tape and survives two weeks of mockery before becoming law. It is a small democratic miracle, and you get the credit for it.`, effects: [{ rel: { who: 'mate', trust: 4, respect: 3 } }, { pop: 0.1 }, { fatigue: 4 }] },
      { id: 'ask_why', label: `Ask {mate.first} quietly why the seat matters tonight`, risk: 'med', result: `{mate.first} admits it is the only seat where the heater actually works. You swap with no further comment, and the answer lets you see a part of {mate.their} life you had not.`, effects: [{ rel: { who: 'mate', trust: 7, affinity: 5 } }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 3 }] },
    ],
  },
  {
    id: 'nh_fac_one_shot', category: 'faction', title: `One Title Shot for Two of You`, weight: 3, cooldownDays: 150, maxPerCareer: 1, categoryCooldown: 6, major: true,
    cast: { mate: { pick: 'tag', tag: 'ally' }, gm: { pick: 'staff', role: 'gm' } }, memory: { role: 'mate', max: 2, noResults: true },
    trigger: { flag: 'in_stable', stat: { popularity: { gte: 35 } }, mem: [{ role: 'mate', trustGte: 10 }] },
    slots: { terms: [`The offer is a single shot, a month away, with one name on it`, `There is a shot on the table, and the office wants an answer by tomorrow`, `A shot has come up, with the catch that it cannot be shared`], pride: [`neither of you has said a word about the idea`, `you can both feel it sitting between you`, `the two of you cannot stop thinking about it`] },
    body: [`{gm.name} calls the stable's two best prospects into the office. {terms}. The stable is expected to choose.`, `You and {mate.name} walk back out to the corridor together, and {pride}. The easy answer is to say you will work it out later, and later is the one thing the office will not give you.`],
    choices: [
      { id: 'take_it', label: `Say it should be you, and say why`, risk: 'high', outcomes: [
        { weight: 1, bonus: { confidence: 0.5, charisma: 0.3 }, text: `You lay out the case without insulting anyone, and {mate.first} listens and nods. It costs something, but you part as people who have been honest.`, effects: [{ rel: { who: 'mate', trust: -3, respect: 4 } }, { pop: 0.7 }, { conf: 3 }] },
        { weight: 1, text: `The case sounds like a cover for ambition, and {mate.first} says so, without raising {mate.their} voice. The shot is yours, and the stable is thinner.`, effects: [{ rel: { who: 'mate', trust: -12, respect: -3, heat: 6 } }, { pop: 0.7 }, { conf: -1 }] } ] },
      { id: 'give_it', label: `Give it to {mate.first}: this is {mate.their} time`, risk: 'low', result: `{mate.first} refuses twice and then accepts. The decision costs you a shot you may not see again, and buys a friend who will remember it at every critical moment.`, effects: [{ rel: { who: 'mate', trust: 12, respect: 8, affinity: 7 } }, { pop: -0.2 }, { conf: -2 }] },
      { id: 'tournament', label: `Propose settling it in the ring, a singles match`, risk: 'med', result: `The office is delighted by the idea and the stable is horrified in equal parts. The match is booked, and you spend the week avoiding each other in catering.`, effects: [{ booking: { who: 'mate', type: 'singles' } }, { rel: { who: 'mate', respect: 3, heat: 3 } }, { pop: 0.3 }, { fatigue: 4 }] },
      { id: 'both', label: `Push {gm.first} to find a way for both of you`, risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.4, mic: 0.3 }, text: `After a stubborn quarter-hour the office folds the two names into one tag opportunity. It is a half-shot for each, and a whole one for the stable.`, effects: [{ rel: { who: 'mate', trust: 7, respect: 5 } }, { pop: 0.4 }, { conf: 2 }] },
        { weight: 1, text: `{gm.first} hears the push as a refusal to decide and takes the shot away altogether. Nobody gets it, and each of you wonders if it was your fault.`, effects: [{ rel: { who: 'mate', trust: -3 } }, { pop: -0.4 }, { conf: -3 }] } ] },
    ],
  },
  {
    id: 'nh_fac_cold_shoulder', category: 'faction', title: `{mate.name} Stopped Saving Your Seat`, weight: 2.5, cooldownDays: 110, maxPerCareer: 2, categoryCooldown: 6,
    cast: { mate: { pick: 'tag', tag: 'ally' } }, memory: { role: 'mate', max: 2, noResults: true },
    trigger: { flag: 'in_stable', mem: [{ role: 'mate', trustLte: 15 }] },
    slots: { sign: [`the chair beside {mate.them} at catering`, `the spot next to {mate.them} on the bench before a show`, `the extra coffee that used to appear on your locker`], tell: [`none of the others have noticed`, `two other members have noticed and are being very careful`, `the boss noticed first and said nothing`] },
    body: [`It is a small thing: {sign} has gone to someone else. {tell}.`, `{mate.first} has not said anything is wrong, and has been unfailingly polite, which is how a person behaves when something is.`],
    choices: [
      { id: 'confront', label: `Ask {mate.first} straight out what changed`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `It takes one long breath and then a list that is shorter than you feared. Most of it is fair, and all of it is fixable.`, effects: [{ rel: { who: 'mate', trust: 7, respect: 4 } }, { conf: 1 }, { fatigue: 3 }] },
        { weight: 1, text: `{mate.first} says nothing is wrong in a voice that makes it clear it is. The attempt hardens the distance rather than closing it.`, effects: [{ rel: { who: 'mate', trust: -4 } }, { conf: -2 }] } ] },
      { id: 'give_space', label: `Leave it alone and give it a few weeks`, risk: 'low', result: `The weeks pass quietly. Nothing is mended, and nothing is broken further, which is not nothing.`, effects: [{ rel: { who: 'mate', trust: -1 } }, { fatigue: -1 }, { conf: -1 }] },
      { id: 'small_gesture', label: `Leave a coffee and a short note on {mate.their} bag`, risk: 'low', result: `The note says only "I'm around." The coffee goes cold, but the note is found pinned to the corkboard a week later, which tells you everything.`, effects: [{ rel: { who: 'mate', trust: 4, affinity: 3 } }, { conf: 1 }] },
      { id: 'ask_boss', label: `Ask someone else in the stable what they have heard`, risk: 'med', result: `You get the answer, third-hand and colourful, and it is partly wrong. The question itself travels back to {mate.first} faster than the answer reached you.`, effects: [{ rel: { who: 'mate', trust: -5, heat: 3 } }, { attr: { name: 'psychology', delta: 1 } }] },
    ],
  },
  {
    id: 'nh_fac_vouch', category: 'faction', title: `{cand.name} Wants You to Vouch`, weight: 2.5, cooldownDays: 130, maxPerCareer: 2, categoryCooldown: 6,
    cast: { cand: { pick: 'tag', tag: 'alliance_possible' } }, memory: { role: 'cand', max: 1, noResults: true },
    trigger: { flag: 'player_leads_stable', mem: [{ role: 'cand', respectGte: 15 }] },
    slots: { pitch: [`a short speech rehearsed in a mirror`, `a handwritten list of reasons, numbered`, `a firm handshake and a steady look`], worry: [`the other members like things the way they are`, `{cand.first} is better in the ring than in a locker room`, `the stable's next card is already crowded`] },
    body: [`{cand.name} finds you after the show and arrives with {pitch}. The message is simple: {cand.they} would like to join the stable, and wants you to be the one who says yes. You like {cand.them}, and your reservations are the sort that sound petty aloud: {worry}.`, `As leader, a yes from you is as good as final. A no is also as good as final.`],
    choices: [
      { id: 'welcome', label: `Welcome {cand.first} in right now`, risk: 'med', result: `The room splits in the usual way, with a few cheers and a few folded arms. {cand.first} says thanks in a voice that turns out to be shaky, and works twice as hard for the next month.`, effects: [{ event: { type: 'faction_joined', participants: ['cand'], summary: `Brought {cand.name} into the stable.`, importance: 3, data: { factionId: 'stable_player' } } }, { rel: { who: 'cand', trust: 8, respect: 5, affinity: 5 } }, { pop: 0.3 }, { fatigue: 3 }] },
      { id: 'trial', label: `Offer a month's trial, with the others voting`, risk: 'low', result: `The stable has a say, and the trial goes quietly well. The slower route buys a more trusted member, and costs you a month of small, awkward chores.`, effects: [{ rel: { who: 'cand', trust: 4, respect: 4 } }, { conf: 1 }, { fatigue: 4 }] },
      { id: 'decline', label: `Say no kindly and explain exactly why`, risk: 'low', result: `{cand.first} listens to every word and says thank you for not lying. The door stays shut, but the respect between you grows rather than shrinks.`, effects: [{ rel: { who: 'cand', respect: 5, trust: 2 } }, { conf: 1 }] },
      { id: 'tag_once', label: `Suggest one tag match together and see how it feels`, risk: 'med', result: `The office is happy to book it, and the match is neither a triumph nor a disaster. You both learn more than you meant to, and the question is still open afterward.`, effects: [{ booking: { who: 'cand', type: 'tag' } }, { rel: { who: 'cand', trust: 3 } }, { fatigue: 4 }, { pop: 0.2 }] },
    ],
  },
  {
    id: 'nh_fac_burnout', category: 'faction', title: `You Are Running This Stable on Fumes`, weight: 2, cooldownDays: 130, maxPerCareer: 2, categoryCooldown: 6,
    cast: { mate: { pick: 'tag', tag: 'ally' } }, memory: { role: 'mate', max: 1, noResults: true },
    trigger: { flag: 'player_leads_stable', stat: { fatigue: { gte: 45 } }, mem: [{ role: 'mate', trustGte: 5 }] },
    slots: { sign: [`you called three different members by the wrong name`, `you fell asleep during the meeting about the entrance`, `you ate lunch standing up for the fourth day in a row`], offer: [`a spare key to a quiet apartment`, `a promise to run the Friday meeting for you`, `a list of everything that can safely be dropped`] },
    body: [`{mate.name} waits until the others have gone and tells you what everybody has seen: {sign}. {mate.first} offers {offer}, in a tone that suggests the speech has been rehearsed for days.`, `The stable runs on your attention. You know exactly how tired you are, and exactly how much it would cost to admit it.`],
    choices: [
      { id: 'delegate', label: `Hand real responsibilities to {mate.first}`, risk: 'med', result: `{mate.first} takes the meetings and the logistics, and the stable barely notices the change. Your head clears by the weekend, and the group learns that it can function without you at every table.`, effects: [{ rel: { who: 'mate', trust: 8, respect: 5 } }, { fatigue: -12 }, { conf: 1 }] },
      { id: 'push', label: `Tell {mate.first} you are fine and push on`, risk: 'high', outcomes: [
        { weight: 1, bonus: { toughness: 0.4 }, text: `You do fine, annoyingly. The next fortnight is a blur and ends with a good result and a bad headache.`, effects: [{ pop: 0.3 }, { fatigue: 10 }, { conf: 1 }] },
        { weight: 1, text: `A mistake in the middle of a match is a result of being tired, and everyone sees it. {mate.first} does not say "told you so", which is somehow worse.`, effects: [{ pop: -0.4 }, { fatigue: 8 }, { conf: -4 }, { injury: { part: 'torso', severity: 1, days: 7 } }] } ] },
      { id: 'week_off', label: `Take a week off and let the stable run without you`, risk: 'med', result: `You vanish for a week and the stable behaves almost too well in your absence. You return rested, a little unnerved, and with fresh respect for how much {mate.first} was holding up.`, effects: [{ fatigue: -18 }, { rel: { who: 'mate', respect: 6, trust: 4 } }, { pop: -0.3 }] },
      { id: 'hand_over', label: `Offer to give {mate.first} the leader's chair`, risk: 'high', result: `The room goes absolutely silent. {mate.first} declines at once, loudly, and the offer does more to rebuild trust than any speech could have.`, effects: [{ rel: { who: 'mate', trust: 10, respect: 8, affinity: 5 } }, { fatigue: -6 }, { conf: -2 }] },
    ],
  },
  {
    id: 'nh_fac_outsider_plea', category: 'faction', title: `{friend.name} Needs the Stable's Muscle`, weight: 2, cooldownDays: 120, maxPerCareer: 2, categoryCooldown: 6,
    cast: { friend: { pick: 'tag', tag: 'respected_by' }, mate: { pick: 'tag', tag: 'ally' } }, memory: { role: 'friend', max: 1, noResults: true },
    trigger: { flag: 'in_stable', mem: [{ role: 'friend', respectGte: 10 }] },
    slots: { trouble: [`a heel who has been picking fights in the dressing room`, `a tag team that has been stealing {friend.their} spots`, `a producer who keeps changing {friend.their} finishes at the last minute`], ask: [`a crowd of you at ringside on Friday`, `a quiet word in the right ear`, `the stable turning up at {friend.their} match`] },
    body: [`{friend.name} has no group of {friend.their} own, which is why you did not expect to be asked for a favour at all. The problem is {trouble}, and what {friend.first} needs is {ask}.`, `{mate.name} is standing a step behind you with a look that says the stable has opinions about this, and they are not all good ones.`],
    choices: [
      { id: 'show_up', label: `Bring the stable and make a point of it`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `The room stills when six of you walk in at once. The problem backs down in under a minute, and {friend.first} stares at you with the surprise of someone who got more than asked.`, effects: [{ rel: { who: 'friend', trust: 8, respect: 6 } }, { pop: 0.4 }, { conf: 2 }, { rel: { who: 'mate', trust: 2 } }] },
        { weight: 1, text: `The stable arrives like a mob and the situation, which was delicate, becomes a story. {friend.first} thanks you tightly and asks you not to do it again.`, effects: [{ rel: { who: 'friend', trust: -2 } }, { rel: { who: 'mate', trust: -2 } }, { pop: 0.1 }, { conf: -1 }] } ] },
      { id: 'solo', label: `Go alone and handle it with a quiet word`, risk: 'low', result: `The conversation is brief, polite and decisive, and the problem eases off without anyone raising a fist. The stable hears nothing, and neither does anybody who might have thanked you.`, effects: [{ rel: { who: 'friend', trust: 5, respect: 4 } }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'sit_out', label: `Decline: it is not the stable's fight`, risk: 'low', result: `{friend.first} accepts it graciously and does not ask again. The stable's calm is preserved, and you feel the cost of it in every hallway for a while.`, effects: [{ rel: { who: 'friend', trust: -5, respect: -3 } }, { rel: { who: 'mate', trust: 3 } }, { conf: -2 }] },
      { id: 'invite', label: `Put {friend.first}'s request to a stable vote`, risk: 'med', result: `The vote is close and awkward, and {friend.first} sits through it with remarkable composure. The answer is a cautious yes, and a number of grumbles that will last the week.`, effects: [{ rel: { who: 'friend', trust: 4, respect: 3 } }, { rel: { who: 'mate', trust: -2 } }, { fatigue: 3 }, { pop: 0.2 }] },
    ],
  },
  {
    id: 'nh_fac_solo_offer', category: 'faction', title: `A Solo Push, Quietly Offered`, weight: 2.5, cooldownDays: 140, maxPerCareer: 2, categoryCooldown: 6, major: true,
    cast: { gm: { pick: 'staff', role: 'gm' }, mate: { pick: 'tag', tag: 'ally' } }, memory: { role: 'mate', max: 1, noResults: true },
    trigger: { flag: 'in_stable', stat: { popularity: { gte: 30 } }, mem: [{ role: 'mate', trustGte: 10 }] },
    slots: { offer: [`a run of singles matches against the top of the card`, `a prominent spot on the next big show`, `a feature segment built entirely around you`], condition: [`stepping away from the group for a few months`, `stopping the stable's backstage meetings`, `letting the others carry the group alone for a while`] },
    body: [`{gm.name} leans across the desk and says that the office would like to give you {offer}. The only condition, delivered with the most casual expression imaginable, is {condition}.`, `The offer is real. So is the awkwardness of explaining it to {mate.name}.`],
    choices: [
      { id: 'refuse', label: `Refuse and tell the stable about the offer`, risk: 'low', result: `The stable hears it from you before they hear it from a rumour, and the silence in the room is proud. The office files it as an unfriendly answer.`, effects: [{ rel: { who: 'mate', trust: 9, respect: 6 } }, { pop: -0.3 }, { conf: 2 }] },
      { id: 'secret', label: `Accept in secret and plan to explain later`, risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `The push lands and so does the explanation, with the help of a very honest conversation. {mate.first} is hurt and then pragmatic, and the stable survives.`, effects: [{ pop: 0.9 }, { rel: { who: 'mate', trust: -5 } }, { conf: 1 }, { money: 3000 }] },
        { weight: 1, text: `{mate.first} finds out from a stagehand a day before you intended to say it. The stable goes cold in a way that no meeting can fix.`, effects: [{ event: { type: 'betrayal', participants: ['mate'], summary: `Took a solo push in secret behind {mate.name}'s back.`, importance: 3, data: { context: 'faction', byPlayer: true } } }, { pop: 0.9 }, { money: 3000 }, { conf: -3 }] } ] },
      { id: 'negotiate', label: `Counter: the push only works with the stable behind you`, risk: 'med', outcomes: [
        { weight: 1, bonus: { mic: 0.4, charisma: 0.3 }, text: `{gm.first} grumbles and agrees to a smaller version that keeps the group in view. It is less for you and more for everybody, and a stable that watched it happen is grateful.`, effects: [{ rel: { who: 'mate', trust: 6, respect: 4 } }, { pop: 0.4 }, { conf: 2 }] },
        { weight: 1, text: `{gm.first} reads the counter as a bluff and withdraws the offer. The push goes to someone who did not ask for conditions.`, effects: [{ rel: { who: 'mate', trust: 3 } }, { pop: -0.4 }, { conf: -2 }] } ] },
      { id: 'ask_mate', label: `Ask {mate.first} what you should do before answering`, risk: 'low', result: `{mate.first} takes a full minute and says to take it, which is the kindest and most surprising answer possible. You are left with the sense of a true friend and an unclear conscience.`, effects: [{ rel: { who: 'mate', trust: 8, affinity: 6 } }, { pop: 0.3 }, { conf: -1 }] },
    ],
  },
  {
    id: 'nh_fac_written_rules', category: 'faction', title: `Writing the Rules Down`, weight: 2, cooldownDays: 150, maxPerCareer: 1, categoryCooldown: 6,
    cast: { mate: { pick: 'tag', tag: 'ally' } }, memory: { role: 'mate', max: 1, noResults: true },
    trigger: { flag: 'player_leads_stable', mem: [{ role: 'mate', trustGte: 10 }] },
    slots: { rule: [`no one ever leaves an arena without the rest of the group`, `no one speaks to the press about internal matters`, `no one takes a booking that hurts another member`, `no one plays a joke on a member before a big match`], tool: [`the pages of a spiral notebook`, `the back of a catering menu`, `a whiteboard the ring crew lent for the evening`] },
    body: [`{mate.name} wants the stable's customs written down, starting with the one everybody follows but nobody can explain: {rule}. A list is already underway on {tool}, in a hand that is mostly in capitals.`, `The group has run well on habit and goodwill, and a rule written is a rule that can be broken, or enforced, or argued with.`],
    choices: [
      { id: 'write', label: `Write it all down, and let everyone sign`, risk: 'low', result: `The signing is half a joke and half a ceremony, and the list goes into the equipment case. For the first time, a quarrel in the hallway ends with someone saying "page two".`, effects: [{ rel: { who: 'mate', trust: 6, respect: 4 } }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'keep_loose', label: `Argue that unwritten rules are stronger`, risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `You make the case that a promise kept without a page is worth ten kept with one, and the room nods. The notebook disappears under a pile of towels.`, effects: [{ rel: { who: 'mate', respect: 2 } }, { conf: 2 }] },
        { weight: 1, text: `The argument sounds like a leader who wants to stay unaccountable, and {mate.first} says it out loud. It is a fair hit, and you spend the next week repairing it.`, effects: [{ rel: { who: 'mate', trust: -5, respect: -2 } }, { conf: -2 }] } ] },
      { id: 'one_rule', label: `Agree on one rule only: no one is left behind`, risk: 'low', result: `The single sentence goes on the wall in marker. It is short enough to remember, and it is invoked three times in the next month by people who have not otherwise agreed on anything.`, effects: [{ rel: { who: 'mate', trust: 4, affinity: 3 } }, { conf: 1 }] },
      { id: 'power', label: `Add a clause that keeps the final say with you`, risk: 'high', result: `Nobody argues openly. The clause goes in, and so does a faint, stubborn chill that lingers in the van for weeks.`, effects: [{ rel: { who: 'mate', trust: -8, fear: 4, respect: -2 } }, { conf: 2 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'nh_fac_tab', category: 'faction', title: `The Check Arrives at the Stable Dinner`, weight: 1.5, cooldownDays: 130, maxPerCareer: 2, categoryCooldown: 6,
    cast: { mate: { pick: 'tag', tag: 'ally' } }, memory: { role: 'mate', max: 1, noResults: true },
    trigger: { flag: 'in_stable', mem: [{ role: 'mate', trustGte: 10 }] },
    slots: { place: [`a steakhouse the boss picked on purpose`, `an all-night diner with a menu the size of a newspaper`, `a place that does not take cards`], items: [`two bottles of something expensive nobody remembers ordering`, `a mountain of dessert shared by seven people`, `the specials nobody asked about`] },
    body: [`Six plates later the bill lands in front of you at {place}. On it: {items}. {mate.name} is doing arithmetic on a napkin and, from the look of it, getting a number everybody will hate.`, `The stable has a custom of not discussing money in public, which is why the napkin is being hidden under a glass.`],
    choices: [
      { id: 'pay_all', label: `Pick up the whole check`, risk: 'low', requires: { stat: { money: { gte: 1200 } } }, result: `You hand over a card with a flourish and the table erupts. It is an expensive way to be loved, and you suspect, correctly, that you will be offered dessert for the rest of the year.`, effects: [{ money: -1100 }, { rel: { who: 'mate', trust: 3, affinity: 4 } }, { conf: 2 }] },
      { id: 'split_exact', label: `Split it down to the last cent`, risk: 'low', result: `Three people do long division on napkins, and the process takes eleven minutes. Everybody pays what they owe and nobody is thrilled, though no one can accuse the process of unfairness.`, effects: [{ money: -150 }, { fatigue: 2 }, { conf: 1 }] },
      { id: 'leader_pays', label: `Pay, but let the newest member sweat for a moment first`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The newest member goes pale for two seconds and then laughs along with the table. You pay, the joke is told for weeks, and you have a small hold on the room.`, effects: [{ money: -700 }, { pop: 0.1 }, { rel: { who: 'mate', affinity: 3 } }, { conf: 2 }] },
        { weight: 1, text: `The joke goes on too long and the newest member does not laugh. {mate.first} catches your eye across the table, and the evening ends early.`, effects: [{ money: -700 }, { rel: { who: 'mate', trust: -4 } }, { conf: -2 }] } ] },
      { id: 'rule', label: `Make a rule: whoever lost most recently pays`, risk: 'med', result: `The room howls and nobody can prove that it is unfair. The rule outlives the dinner and eventually the stable, and it is how you get remembered.`, effects: [{ money: -300 }, { rel: { who: 'mate', affinity: 4, trust: 2 } }, { pop: 0.1 }] },
    ],
  },
  // ======================= MENTOR =======================
  {
    id: 'nh_men_worst_match', category: 'mentor', title: `The Match {mentor.name} Never Mentions`, weight: 2.5, cooldownDays: 200, maxPerCareer: 1, categoryCooldown: 6,
    cast: { mentor: { pick: 'tag', tag: 'mentor' } }, memory: { role: 'mentor', max: 1, noResults: true },
    trigger: { stat: { careerYears: { gte: 1 } }, mem: [{ role: 'mentor', trustGte: 10 }] },
    slots: { mistake: [`pulling a move that was never rehearsed`, `taking a payoff and getting stiffed on the rest`, `refusing to lose to someone younger`], setting: [`a diner booth with a cracked seat`, `the cab of a parked pickup`, `a bench at the edge of an empty parking lot`] },
    body: [`In {setting}, {mentor.name} finally tells the story that has been left out of every legend: the worst night of a long career, and it involved {mistake}. {mentor.first} tells it flatly, in the voice of a person reading a mortgage statement.`, `You were not supposed to be given this one, and you know it. The story is a gift, a test, or both.`],
    choices: [
      { id: 'listen', label: `Listen to all of it and ask nothing`, risk: 'low', result: `The story ends, the coffee has gone cold, and {mentor.first} looks relieved in the way that only comes from setting something down. You say thank you, and for once it seems like enough.`, effects: [{ rel: { who: 'mentor', trust: 8, affinity: 5 } }, { attr: { name: 'psychology', delta: 1 } }, { conf: 1 }] },
      { id: 'trade', label: `Match it with your own worst night`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `Your story is smaller, but it is true, and {mentor.first} laughs until the waitress comes over to check. It is the closest the two of you have ever been.`, effects: [{ rel: { who: 'mentor', trust: 10, affinity: 7, respect: 3 } }, { conf: 2 }] },
        { weight: 1, text: `Your story comes out as a bid for sympathy, and {mentor.first} nods slowly, like someone being polite about a small portion. The moment closes a little.`, effects: [{ rel: { who: 'mentor', trust: -1 } }, { conf: -2 }] } ] },
      { id: 'what_changed', label: `Ask what {mentor.first} would do differently today`, risk: 'low', result: `The answer is shorter than the story, and it is a list of three small things you can use immediately. You write them on a napkin, and the napkin turns out to be the most useful thing you take away from the year.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { rel: { who: 'mentor', respect: 3 } }, { fatigue: 2 }] },
      { id: 'lighten', label: `Lighten the mood with a joke before it gets heavy`, risk: 'med', result: `The joke is a good one and {mentor.first} laughs, and the story closes up behind it like a door. You will not hear it again, and some part of you is relieved and some part is not.`, effects: [{ rel: { who: 'mentor', trust: -3, affinity: 2 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'nh_men_missed_bus', category: 'mentor', title: `{kid.name} Missed the Bus`, weight: 2.5, contexts: ['pre_show', 'show_day'], cooldownDays: 100, maxPerCareer: 2, categoryCooldown: 6,
    cast: { kid: { pick: 'tag', tag: 'studying_you' }, agent: { pick: 'staff', role: 'agent' } }, memory: { role: 'kid', max: 1, noResults: true },
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { reason: [`a flat tyre on a borrowed car`, `an alarm that failed on the one morning it mattered`, `a long, honest mistake about the departure time`], cost: [`a late fee the size of a week's wages`, `a note in a folder that has a habit of opening itself`, `a spot on the card that someone else wants`] },
    body: [`The bus left twenty minutes ago without {kid.name}, because of {reason}. {agent.name} stops you in the corridor and asks whether you know where the kid might be, in the cool tone of a person who already has the answer.`, `You do know, because {kid.first} called you from a roadside payphone. The consequence of the miss is {cost}, and it is yours to soften or to let fall.`],
    choices: [
      { id: 'cover', label: `Tell {agent.first} you sent {kid.them} ahead on an errand`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `{agent.first} gives you a long look and writes nothing down. {kid.first} slides in through the side door ten minutes later and understands exactly what happened.`, effects: [{ rel: { who: 'kid', trust: 10, respect: 6, affinity: 4 } }, { conf: 1 }] },
        { weight: 1, text: `The story does not survive a question about which errand, and {agent.first} notes both of you down. {kid.first} is mortified and you look like a liar.`, effects: [{ rel: { who: 'kid', trust: 2, respect: -2 } }, { pop: -0.2 }, { conf: -3 }] } ] },
      { id: 'drive', label: `Drive out and collect {kid.them} yourself`, risk: 'med', result: `The two of you reach the arena just before the doors, with fast food and a long silence. {kid.first} says sorry nine times and you say nothing until the last.`, effects: [{ rel: { who: 'kid', trust: 7, respect: 4 } }, { fatigue: 8 }, { conf: 1 }] },
      { id: 'truth', label: `Tell {agent.first} the truth and ask for mercy`, risk: 'low', result: `{agent.first} nods, scowls, and gives {kid.first} a warning and a lecture rather than a fine. The kid learns a lesson in the least painful way, and you learn how far your word goes.`, effects: [{ rel: { who: 'kid', trust: 2, respect: 2 } }, { conf: 2 }] },
      { id: 'let_fall', label: `Let {kid.first} face it alone: it is a lesson`, risk: 'med', result: `{kid.first} takes the consequences with a straight back and does not come to you afterward. It is a good lesson and a cold one, and the kid is quieter around you for weeks.`, effects: [{ rel: { who: 'kid', trust: -6, respect: 1 } }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'nh_men_first_promo', category: 'mentor', title: `Read {kid.name}'s First Promo`, weight: 2, cooldownDays: 120, maxPerCareer: 2, categoryCooldown: 6,
    cast: { kid: { pick: 'tag', tag: 'studying_you' } }, memory: { role: 'kid', max: 1, noResults: true },
    trigger: { stat: { mic: { gte: 40 }, careerYears: { gte: 1 } } },
    slots: { draft: [`three pages, double spaced, with a joke on every line`, `a single paragraph in a very small hand`, `an outline that is mostly arrows`], flaw: [`the middle drags and the ending is a shrug`, `every line is borrowed from someone in the building`, `it is clever, and it does not say anything`] },
    body: [`{kid.name} hands you {draft} and asks for your honest opinion before the taping. You read it under a flickering light in the hallway, and the problem is clear within a page: {flaw}.`, `{kid.first} is hovering near the vending machine and pretending to be calm. Anything you say in the next minute will either build a person or do the opposite.`],
    choices: [
      { id: 'honest_notes', label: `Give honest notes, kindly and in order`, risk: 'low', result: `You mark three places and say what you would do, and {kid.first} writes down every word. The promo that gets spoken is a lot better and fully the kid's own.`, effects: [{ rel: { who: 'kid', trust: 6, respect: 5 } }, { mic: 1 }, { fatigue: 3 }] },
      { id: 'rewrite', label: `Rewrite it yourself, quickly`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5 }, text: `Your version is excellent, and {kid.first} delivers it with a beautiful nervous energy. It goes well and does not feel quite like the kid's own, which the kid tells you two weeks later.`, effects: [{ rel: { who: 'kid', trust: 3, respect: 3 } }, { pop: 0.2 }, { fatigue: 4 }] },
        { weight: 1, text: `Your voice sits awkwardly in someone else's mouth, and the delivery is stiff. {kid.first} is too polite to say so, and you both know.`, effects: [{ rel: { who: 'kid', respect: -2, trust: -1 } }, { conf: -2 }, { fatigue: 4 }] } ] },
      { id: 'throw_away', label: `Tell {kid.first} to throw it out and speak from the gut`, risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: `The kid goes out with nothing written and says four plain things about why this matters. It is shaky and true, and the crowd quiets down to hear it.`, effects: [{ rel: { who: 'kid', trust: 8, respect: 6 } }, { pop: 0.3 }, { mic: 1 }] },
        { weight: 1, text: `The kid freezes at the second sentence and stands in silence for several long beats. The loss of confidence is real, and you will carry some of it.`, effects: [{ rel: { who: 'kid', trust: -6, respect: -3 } }, { conf: -3 }] } ] },
      { id: 'send_coach', label: `Send {kid.first} to the promo coach`, risk: 'low', result: `The coach gives better notes than you would have, and the promo improves quickly. It is a sensible handoff, and {kid.first} reads it as one more door closed.`, effects: [{ rel: { who: 'kid', trust: -1, respect: 1 } }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'nh_men_borrowed_move', category: 'mentor', title: `{kid.name} Used Your Finisher`, weight: 2.5, contexts: ['post_match', 'post_show'], cooldownDays: 110, maxPerCareer: 2, categoryCooldown: 6,
    cast: { kid: { pick: 'tag', tag: 'studying_you' } }, memory: { role: 'kid', max: 1, noResults: true },
    trigger: { stat: { popularity: { gte: 25 }, careerYears: { gte: 1 } } },
    slots: { crowd: [`a house show in a school gym`, `a televised undercard`, `a small-town arena with a loud front row`], tweak: [`a bit more sway before the lift`, `a different grip, which is almost better`, `a ridiculous bow at the end`] },
    body: [`At {crowd}, {kid.name} finishes a match with a move that is yours in everything but the name, with {tweak}. The crowd pops, and for a second the pop belongs to the wrong person.`, `{kid.first} comes through the curtain with a face that is half triumph and half dread. Everyone backstage turns to see what you will do.`],
    choices: [
      { id: 'blessing', label: `Give the move your blessing, loudly`, risk: 'low', result: `You walk into the catering room and announce that {kid.first} has permission, with a straight face. The kid exhales for the first time all day, and the room tells the story for weeks.`, effects: [{ rel: { who: 'kid', trust: 8, respect: 6, affinity: 5 } }, { pop: 0.2 }, { conf: 1 }] },
      { id: 'credit', label: `Ask {kid.first} to credit it as yours in interviews`, risk: 'med', result: `The credit is fair and a little proud, and {kid.first} agrees with a stiff jaw. The arrangement works, and the stiffness lingers a month.`, effects: [{ rel: { who: 'kid', trust: -2, respect: 2 } }, { pop: 0.3 }, { conf: 1 }] },
      { id: 'drop_it', label: `Retire the move yourself so it cannot be compared`, risk: 'high', result: `You hand it over on purpose and look for something new. It costs you a trademark, and the creative work of replacing it is exhausting, but you come out of it with something sharper.`, effects: [{ rel: { who: 'kid', trust: 6, respect: 7 } }, { attr: { name: 'technical', delta: 1 } }, { pop: -0.2 }, { fatigue: 6 }] },
      { id: 'confront', label: `Confront {kid.first} privately and demand a change`, risk: 'med', outcomes: [
        { weight: 1, bonus: { confidence: 0.4 }, text: `You talk for ten minutes and the kid listens without defending. The move changes shape a week later, and the kid keeps a respectful distance for a little while.`, effects: [{ rel: { who: 'kid', respect: 3, trust: -2 } }, { conf: 2 }] },
        { weight: 1, text: `It lands as a bully's lecture, and {kid.first} flushes and says nothing. Two days later the kid takes a seat at the far end of the dressing room and stays there.`, effects: [{ rel: { who: 'kid', trust: -9, respect: -4, heat: 5 } }, { conf: -2 }] } ] },
    ],
  },
  {
    id: 'nh_men_small_house', category: 'mentor', title: `{mentor.name} Is Working a Tiny Hall`, weight: 2, cooldownDays: 180, maxPerCareer: 2, categoryCooldown: 6,
    cast: { mentor: { pick: 'tag', tag: 'mentor' } }, memory: { role: 'mentor', max: 1, noResults: true },
    trigger: { stat: { popularity: { gte: 40 } }, mem: [{ role: 'mentor', trustGte: 10 }] },
    slots: { venue: [`a firehouse hall that seats ninety`, `the back room of a social club`, `a gym with a ring and a folding-chair crowd`], reason: [`a benefit for a local family`, `a farewell show for an old promoter`, `the first show in a year`] },
    body: [`{mentor.name} calls on the one free night you have this month and asks if you will come to {venue}. It is {reason}, the pay is a hot meal, and the audience will probably be forty.`, `Your presence would change the night for the whole room, and your absence would be easy to explain. {mentor.first} does not push, which is what makes the ask feel enormous.`],
    choices: [
      { id: 'go_work', label: `Go and work the show, no billing`, risk: 'med', result: `You turn up at four, sweep the ring, and wrestle in front of ninety people who go home with a story. {mentor.first} says nothing about it, and that evening is the one people bring up for years.`, effects: [{ rel: { who: 'mentor', trust: 10, respect: 6, affinity: 6 } }, { pop: 0.3 }, { conf: 3 }, { fatigue: 9 }] },
      { id: 'go_watch', label: `Go as a spectator and sit at ringside`, risk: 'low', result: `You take a folding chair in the third row and clap in the right places, and the hall realises who is in it by the second match. {mentor.first} works harder than usual.`, effects: [{ rel: { who: 'mentor', trust: 6, affinity: 4 } }, { pop: 0.2 }, { fatigue: 3 }, { conf: 2 }] },
      { id: 'send_cash', label: `Send a donation and your apologies`, risk: 'low', requires: { stat: { money: { gte: 1500 } } }, result: `The envelope reaches the promoter and the show gets a nicer set of lights. {mentor.first} understands the number and the absence in equal measure, and says thank you.`, effects: [{ money: -1500 }, { rel: { who: 'mentor', trust: -1, respect: 1 } }, { fatigue: -2 }] },
      { id: 'decline_rest', label: `Decline: you need the night to recover`, risk: 'low', result: `You take the evening for yourself, and the rest is real. {mentor.first} says it is fine, in a voice that holds a lot more than fine.`, effects: [{ rel: { who: 'mentor', trust: -4, affinity: -2 } }, { fatigue: -9 }, { conf: -1 }] },
    ],
  },
  {
    id: 'nh_men_loan', category: 'mentor', title: `{mentor.name} Needs a Favour with a Number in It`, weight: 2.5, cooldownDays: 220, maxPerCareer: 1, categoryCooldown: 6, major: true,
    cast: { mentor: { pick: 'tag', tag: 'mentor' } }, memory: { role: 'mentor', max: 2, noResults: true },
    trigger: { stat: { money: { gte: 6000 } }, mem: [{ role: 'mentor', trustGte: 10 }] },
    slots: { need: [`a roof that has stopped keeping out the sky`, `a medical bill nobody warned about`, `a gym lease that comes due on Friday`], approach: [`after twenty minutes of talking about nothing`, `by pretending to look for a pen`, `in the parking lot with the engine still running`] },
    body: [`{mentor.name} asks, {approach}, whether you could lend a sum that matters. It is for {need}, and the sentence ends with a flat "I would never ask if I had another way."`, `The number is real money, and the shame behind it is realer. The way you answer will be remembered long after the money is.`],
    choices: [
      { id: 'lend_all', label: `Lend the full amount and say there is no hurry`, risk: 'low', result: `The cheque changes hands without a ceremony. {mentor.first} cannot speak for a second, and your account shows a number that will take some time to climb back from.`, effects: [{ money: -6000 }, { rel: { who: 'mentor', trust: 12, respect: 5, affinity: 7 } }, { conf: 2 }] },
      { id: 'lend_half', label: `Lend half and offer to find the rest elsewhere`, risk: 'med', result: `The half arrives with a list of people who might cover the remainder, and {mentor.first} takes it gratefully and a little stiffly. The problem gets solved, mostly, and the stiffness takes a while to wear off.`, effects: [{ money: -3000 }, { rel: { who: 'mentor', trust: 5, respect: 2 } }, { fatigue: 3 }] },
      { id: 'gift_not_loan', label: `Call it a gift and refuse to discuss repayment`, risk: 'med', result: `{mentor.first} argues for a quarter of an hour and loses. It is expensive and permanent, and you suspect the argument was the final cost to someone's pride.`, effects: [{ money: -6000 }, { rel: { who: 'mentor', trust: 8, respect: 8, affinity: 5 } }, { conf: 3 }] },
      { id: 'decline', label: `Say you cannot, and explain honestly why`, risk: 'high', result: `You tell the truth about your own commitments, and {mentor.first} says that it is understood. It is the first time you realise what a quiet word can take away.`, effects: [{ rel: { who: 'mentor', trust: -10, respect: -4, affinity: -4 } }, { conf: -3 }] },
    ],
  },
  {
    id: 'nh_men_public_critique', category: 'mentor', title: `{mentor.name} Said It on Air`, weight: 2.5, cooldownDays: 120, maxPerCareer: 2, categoryCooldown: 6,
    cast: { mentor: { pick: 'tag', tag: 'mentor' }, host: { pick: 'media', kind: 'interviewer' } }, memory: { role: 'mentor', max: 2, noResults: true },
    trigger: { stat: { popularity: { gte: 30 } }, mem: [{ role: 'mentor', trustGte: 5 }] },
    slots: { critique: [`that you lean on the crowd more than you should`, `that you have gone soft when it counts`, `that you hide behind catchphrases`], delivery: [`in a calm voice that made it sound worse`, `with a smile that did not help`, `with a speech about wanting only the best for you`] },
    body: [`{host.name} plays you the clip from last night: {mentor.name}, asked about your career, saying {critique}, {delivery}. It is not wrong, which is most of the trouble.`, `{mentor.first} could have said it to you in a gym, and chose a microphone. Either it was careless or it was a message, and you cannot tell which.`],
    choices: [
      { id: 'agree', label: `Agree publicly and thank {mentor.first} for the honesty`, risk: 'low', result: `Your answer is gracious and a touch rueful, and the crowd takes to the grace. {mentor.first} sends a one-line reply that says "good answer", which feels like a medal.`, effects: [{ rel: { who: 'mentor', respect: 5, trust: 3 } }, { pop: 0.3 }, { conf: -1 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'call', label: `Call {mentor.first} and ask why it had to be public`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{mentor.first} explains that the airtime was the only way to make the point reach the people who needed to hear it. You do not like the answer, but it is an answer, and the call ends warmly.`, effects: [{ rel: { who: 'mentor', trust: 4, respect: 3 } }, { conf: 1 }] },
        { weight: 1, text: `The call turns into an argument that spins in circles. You hang up first and spend the evening wishing you had not.`, effects: [{ rel: { who: 'mentor', trust: -7, heat: 5 } }, { conf: -3 }] } ] },
      { id: 'fire_back', label: `Fire back on the same program`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.6 }, text: `Your reply is sharp, funny and respectful of the history, and the audience loves the argument. It will keep going for as long as the two of you want it to.`, effects: [{ pop: 0.8 }, { rel: { who: 'mentor', respect: 2, heat: 6 } }, { event: { type: 'interview', participants: ['host', 'mentor'], summary: `Answered {mentor.name}'s public criticism on air.`, data: { quality: { base: 62, mic: 0.6, noise: 12 }, viral: { minQuality: 82, chance: 0.3 } } } }] },
        { weight: 1, text: `The reply comes out bitter, and every kind thing {mentor.first} ever did for you is cited back at you the next morning. You look ungrateful and feel it.`, effects: [{ pop: -0.4 }, { rel: { who: 'mentor', trust: -10, respect: -3, heat: 8 } }, { conf: -3 }] } ] },
      { id: 'prove_wrong', label: `Say nothing and quietly prove the point wrong`, risk: 'med', result: `For a month you work as if a hidden camera were recording, and the work improves in the places that were named. The silence is understood, and the next time the two of you meet, nothing needs saying.`, effects: [{ attr: { name: 'technical', delta: 1 } }, { fatigue: 7 }, { conf: 2 }, { rel: { who: 'mentor', respect: 2 } }] },
    ],
  },
  {
    id: 'nh_men_reference', category: 'mentor', title: `{kid.name} Wants You in the Room`, weight: 2.5, cooldownDays: 130, maxPerCareer: 2, categoryCooldown: 6,
    cast: { kid: { pick: 'tag', tag: 'studying_you' }, gm: { pick: 'staff', role: 'gm' } }, memory: { role: 'kid', max: 1, noResults: true },
    trigger: { stat: { popularity: { gte: 30 }, careerYears: { gte: 1 } } },
    slots: { ask: [`a spot on the main roster`, `a better contract`, `a first televised match`], manner: [`rehearsed to the last syllable`, `blurted in the hallway with no warning`, `slipped under your door on an index card`] },
    body: [`{kid.name} wants {ask} and needs someone with credit to say so. The request arrives {manner}, and it is for you to sit in the room with {gm.name} and vouch.`, `Your word is worth something, and that is precisely the problem. Spend it, and it buys less next time; save it, and a promising person may be waiting a long time.`],
    choices: [
      { id: 'vouch', label: `Vouch for {kid.first} without reservations`, risk: 'high', outcomes: [
        { weight: 2, bonus: { popularity: 0.4 }, text: `{gm.first} takes your word, and the spot is granted with a raised eyebrow. {kid.first} treats the decision as a debt to be repaid for life, and the office registers that you have talent-spotting skills.`, effects: [{ rel: { who: 'kid', trust: 10, respect: 7, affinity: 5 } }, { pop: 0.2 }, { conf: 1 }] },
        { weight: 1, text: `{gm.first} gives the kid a chance, and the kid fumbles it on the first night. The failure is attached to your name for a few weeks.`, effects: [{ rel: { who: 'kid', trust: 4 } }, { pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'conditions', label: `Vouch, but with a clear list of conditions for {kid.first}`, risk: 'med', result: `The conditions sound sensible to everyone but the kid, who clearly hoped for a clear run. {kid.first} agrees through clenched teeth and becomes noticeably more careful.`, effects: [{ rel: { who: 'kid', trust: 3, respect: 4 } }, { conf: 1 }, { fatigue: 3 }] },
      { id: 'decline', label: `Tell {kid.first} it is too soon and why`, risk: 'low', result: `The reasons are specific and fair, and the kid takes them in with obvious disappointment. It is probably the right call, and it feels exactly like the wrong one.`, effects: [{ rel: { who: 'kid', trust: -3, respect: 2 } }, { conf: 1 }] },
      { id: 'coach_first', label: `Coach {kid.first} for a month before you speak up`, risk: 'low', result: `The month is hard on both of you and the kid improves visibly. When you go into the office, you have evidence and not just goodwill.`, effects: [{ rel: { who: 'kid', trust: 6, respect: 5 } }, { fatigue: 8 }, { attr: { name: 'psychology', delta: 1 } }] },
    ],
  },
  {
    id: 'nh_men_limp', category: 'mentor', title: `{mentor.name} Is Walking Differently`, weight: 2.5, cooldownDays: 200, maxPerCareer: 1, categoryCooldown: 6,
    cast: { mentor: { pick: 'tag', tag: 'mentor' } }, memory: { role: 'mentor', max: 2, noResults: true },
    trigger: { stat: { careerYears: { gte: 2 } }, mem: [{ role: 'mentor', trustGte: 10 }] },
    slots: { sign: [`a hitch on the left side of every step`, `a hand resting on the doorframe a second too long`, `a habit of taking the elevator instead of the stairs`], cover: [`a joke about the age of the building`, `a long story about a different injury`, `a sudden need to check a schedule`] },
    body: [`Across the loading dock you notice {sign}, and when {mentor.name} sees you looking, there is {cover}. The two of you have had a hundred conversations, and none has ever been about this.`, `Pride is the thing {mentor.first} taught you hardest, and it is the thing now standing in the way. It would be easy to look away.`],
    choices: [
      { id: 'say_it', label: `Say plainly that you noticed, and that you care`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{mentor.first} does not answer for a long time and then tells you the whole thing. The conversation ends with a promise to see a specialist, extracted by you and given with a scowl.`, effects: [{ rel: { who: 'mentor', trust: 10, affinity: 8 } }, { conf: 1 }, { fatigue: 3 }] },
        { weight: 1, text: `{mentor.first} bristles and says the knee is none of your business. It is the first real fight the two of you have ever had, and it ends in a sulk on both sides.`, effects: [{ rel: { who: 'mentor', trust: -5, heat: 4 } }, { conf: -2 }] } ] },
      { id: 'carry_bag', label: `Say nothing and take {mentor.their} bag without asking`, risk: 'low', result: `{mentor.first} lets you, gruffly, and the bag becomes your job on the road without anyone saying so. It is a quiet kind of care, and it is received exactly the way it was meant.`, effects: [{ rel: { who: 'mentor', trust: 6, affinity: 6 } }, { fatigue: 3 }, { conf: 1 }] },
      { id: 'tell_doctor', label: `Mention it to the doctor quietly`, risk: 'high', result: `The doctor handles it with tact, but a person who has worked the same way for decades knows how a hint travels. {mentor.first} works out who it was within the hour and does not forgive you for a while.`, effects: [{ rel: { who: 'mentor', trust: -8, respect: -2 } }, { conf: 1 }] },
      { id: 'look_away', label: `Pretend you saw nothing and follow {mentor.their} lead`, risk: 'low', result: `The dock is crowded and the conversation moves on, and the limp goes unmentioned. It is respectful and a little cowardly, and you carry the picture for longer than you expect.`, effects: [{ conf: -2 }, { rel: { who: 'mentor', trust: 1 } }] },
    ],
  },
  // ======================= ALLIANCE =======================
  {
    id: 'nh_ali_booked_against', category: 'alliance', title: `The Office Books You Against {ally.name}`, weight: 3, cooldownDays: 140, maxPerCareer: 2, categoryCooldown: 6, major: true,
    cast: { ally: { pick: 'tag', tag: 'ally' }, agent: { pick: 'staff', role: 'agent' } }, memory: { role: 'ally', max: 1, noResults: true },
    trigger: { stat: { popularity: { gte: 25 } }, mem: [{ role: 'ally', trustGte: 10 }] },
    slots: { pitch: [`"the story writes itself"`, `"it will be a classic"`, `"nobody will believe it, which is the point"`], stakes: [`with a finish that goes one way only`, `with a clean result either side could use`, `with no finish decided yet, for the moment`] },
    body: [`{agent.name} slides the card across the table and taps one line: you against {ally.name}, {stakes}. The pitch, delivered like a salesman's closing line, is {pitch}.`, `It is a job, and a good one. It is also a collision between the work and the person who has been in your corner, and nobody in the office sees a problem.`],
    choices: [
      { id: 'take_it', label: `Take the match and treat it as just work`, risk: 'low', result: `You work it clean, with respect and a lot of care, and the match is good enough that you both get calls after. Backstage, the friendship is unchanged and mildly stronger for having survived.`, effects: [{ booking: { who: 'ally', type: 'singles' } }, { rel: { who: 'ally', respect: 4, trust: 2 } }, { pop: 0.3 }] },
      { id: 'warn_ally', label: `Tell {ally.first} everything before the office does`, risk: 'low', result: `{ally.first} laughs, groans and orders two coffees. The match is made with a plan you wrote together, and it feels like a long conversation more than a conflict.`, effects: [{ booking: { who: 'ally', type: 'singles' } }, { rel: { who: 'ally', trust: 7, affinity: 4 } }, { fatigue: 3 }] },
      { id: 'refuse', label: `Refuse the booking: you won't work against {ally.them}`, risk: 'high', outcomes: [
        { weight: 1, bonus: { confidence: 0.4 }, text: `{agent.first} looks at you for a long moment and then crosses out the line. The loyalty is noted in a way that cannot be written down.`, effects: [{ rel: { who: 'ally', trust: 9, respect: 5 } }, { pop: -0.2 }, { conf: 1 }] },
        { weight: 1, text: `The refusal reads as insubordination, and the office books the match with a different opponent and a note on your file. {ally.first} appreciates it, and you pay for it.`, effects: [{ rel: { who: 'ally', trust: 6 } }, { pop: -0.5 }, { conf: -2 }] } ] },
      { id: 'play_up', label: `Play it up as a feud and sell it for real`, risk: 'high', result: `You start a rivalry for the cameras, and it works so well that people begin to wonder. Behind the curtain you are still friends, but the act is leaking into the hallways.`, effects: [{ booking: { who: 'ally', type: 'singles' } }, { rivalry: { who: 'ally', heat: 14 } }, { rel: { who: 'ally', trust: -5, heat: 6 } }, { pop: 0.8 }] },
    ],
  },
  {
    id: 'nh_ali_late_vouch', category: 'alliance', title: `{ally.name} Is in Trouble with the Office`, weight: 2.5, contexts: ['pre_show', 'show_day'], cooldownDays: 120, maxPerCareer: 2, categoryCooldown: 6,
    cast: { ally: { pick: 'tag', tag: 'ally' }, gm: { pick: 'staff', role: 'gm' } }, memory: { role: 'ally', max: 1, noResults: true },
    trigger: { mem: [{ role: 'ally', trustGte: 10 }] },
    slots: { offence: [`missing a call time by forty minutes`, `losing an argument with a producer in front of the crew`, `skipping a mandatory meeting for a family matter`], gm_mood: [`with the patience of someone being generous`, `in the dry tone of a person writing a letter`, `without once looking up from the paperwork`] },
    body: [`{gm.name} brings you into the office {gm_mood} and lays out the facts: {ally.name} is in trouble for {offence}. The question, somewhat unfairly, is whether you will say a word on {ally.their} behalf.`, `{ally.first} is waiting outside, pretending to read a poster. Neither of you has said what each of you is thinking.`],
    choices: [
      { id: 'vouch_full', label: `Vouch for {ally.first} and take half the blame`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, confidence: 0.3 }, text: `{gm.first} sighs, trades a look with the paperwork and downgrades the offence to a warning for both of you. {ally.first} is very quiet in the corridor, which means a lot.`, effects: [{ rel: { who: 'ally', trust: 12, respect: 7, affinity: 5 } }, { pop: -0.1 }, { conf: 1 }] },
        { weight: 1, text: `The office hears solidarity as collusion, and the two of you share a fine and a lecture. {ally.first} is moved, and your wallet is lighter.`, effects: [{ rel: { who: 'ally', trust: 9, respect: 4 } }, { money: -2000 }, { conf: -1 }] } ] },
      { id: 'factual', label: `State the facts fairly and let the office decide`, risk: 'low', result: `You give a fair account that neither inflates nor excuses, and {gm.first} nods. The outcome is a mild punishment, and {ally.first} can find no grievance in your evenness.`, effects: [{ rel: { who: 'ally', trust: 2, respect: 3 } }, { conf: 1 }] },
      { id: 'stay_out', label: `Stay out of it: you have your own standing to protect`, risk: 'med', result: `You say you have nothing to add, and the answer is accepted without comment. {ally.first} takes the hit alone and says nothing, and you pay for that quiet in time.`, effects: [{ rel: { who: 'ally', trust: -9, respect: -3 } }, { conf: -2 }, { fatigue: -1 }] },
      { id: 'cover_story', label: `Offer a cover story that covers {ally.first}`, risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: `The story is plausible enough, and {gm.first} lets it stand with a scepticism that will not go away. {ally.first} owes you big, and both of you know it.`, effects: [{ rel: { who: 'ally', trust: 10, affinity: 5 } }, { conf: 1 }] },
        { weight: 1, text: `The story falls apart on a detail about the schedule, and now two people are in trouble for two reasons. {gm.first} is no longer looking at the paperwork.`, effects: [{ rel: { who: 'ally', trust: 3 } }, { pop: -0.4 }, { conf: -4 }, { money: -1500 }] } ] },
    ],
  },
  {
    id: 'nh_ali_one_night', category: 'alliance', title: `{cand.name} Proposes a One-Night Team-Up`, weight: 2.5, cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 6,
    cast: { cand: { pick: 'tag', tag: 'alliance_possible' } }, memory: { role: 'cand', max: 1, noResults: true },
    trigger: { stat: { popularity: { gte: 20 } }, mem: [{ role: 'cand', respectGte: 15 }] },
    slots: { rival_team: [`a pair of bullies who have run the dressing room for a year`, `two veterans who have not lost a tag match in months`, `a duo that likes to ambush people in parking lots`], plan: [`a shared entrance and a shared plan`, `five minutes of rehearsal before the doors open`, `a handshake in the hallway and an agreement to improvise`] },
    body: [`{cand.name} corners you with a proposal: one night, one tag match, against {rival_team}. The plan is {plan}, and the pitch is delivered with an eagerness that is hard to resist.`, `You have never teamed with {cand.first} before. The idea is attractive, and so is the chance that it goes badly in front of a sold-out building.`],
    choices: [
      { id: 'team_up', label: `Say yes and agree to a proper alliance afterward`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4, charisma: 0.3 }, text: `The match is rough, quick and clever, and the building loves you both. By the end of the night the alliance is more than a figure of speech.`, effects: [{ event: { type: 'alliance_formed', participants: ['cand'], summary: `Teamed up with {cand.name} against a pair of bullies.`, data: {} } }, { pop: 0.8 }, { fatigue: 7 }] },
        { weight: 1, text: `The match is a mess of missed tags and overlapping moves, and the crowd boos in the wrong places. The alliance is made anyway, but the shine is off.`, effects: [{ event: { type: 'alliance_formed', participants: ['cand'], summary: `Formed a rocky alliance with {cand.name}.`, data: {} } }, { pop: -0.1 }, { fatigue: 7 }, { conf: -1 }] } ] },
      { id: 'one_night_only', label: `Agree to the one night, with no strings`, risk: 'low', result: `You work the match with {cand.first}, shake hands afterward, and go your separate ways. It is a clean piece of business, and a respectful one.`, effects: [{ booking: { who: 'cand', type: 'tag' } }, { rel: { who: 'cand', respect: 4, trust: 3 } }, { pop: 0.3 }, { fatigue: 5 }] },
      { id: 'counter_terms', label: `Counter: you call the finish and lead the entrance`, risk: 'med', outcomes: [
        { weight: 1, bonus: { confidence: 0.4 }, text: `{cand.first} grumbles and then agrees, and the match runs on your plan. It works, and a small note of resentment goes with it.`, effects: [{ booking: { who: 'cand', type: 'tag' } }, { rel: { who: 'cand', respect: 2, trust: -3 } }, { pop: 0.5 }] },
        { weight: 1, text: `{cand.first} says, politely, that this is not a partnership but a hire. The offer lapses, and the pair of bullies run through the dressing room unopposed.`, effects: [{ rel: { who: 'cand', respect: -3 } }, { conf: -2 }] } ] },
      { id: 'pass', label: `Pass: there is no reason to take a risk for a stranger`, risk: 'low', result: `The pair of bullies carry on as before, and someone else takes the fight. You keep your night clear and your record clean.`, effects: [{ rel: { who: 'cand', respect: -2, trust: -1 } }, { fatigue: -3 }, { conf: -1 }] },
    ],
  },
  {
    id: 'nh_ali_split_talk', category: 'alliance', title: `The Office Hints at Splitting the Team`, weight: 2.5, cooldownDays: 130, maxPerCareer: 2, categoryCooldown: 6, major: true,
    cast: { ally: { pick: 'tag', tag: 'ally' }, creative: { pick: 'staff', role: 'creative' } }, memory: { role: 'ally', max: 2, noResults: true },
    trigger: { recent: { lossesGte: 3 }, mem: [{ role: 'ally', trustGte: 10 }] },
    slots: { reason: [`the results have gone flat`, `the crowd has stopped reacting to the tag finish`, `the two of you have become too predictable`], frame: [`as a new chapter`, `as a gift to both careers`, `as the natural next step`] },
    body: [`{creative.name} requests five minutes and gets to the point: {reason}, and the office is thinking of separating you from {ally.name}, presented {frame}. Nothing has been decided, which means everything is open.`, `{ally.first} has not been told. Whatever you say now can be repeated, and the rest of the conversation depends on what is said first.`],
    choices: [
      { id: 'tell_ally', label: `Tell {ally.first} right away and decide together`, risk: 'low', result: `{ally.first} takes the news with a long breath, and the two of you spend an evening writing a counter-proposal on the back of a menu. It is the right thing to do, and an unusually tender one.`, effects: [{ rel: { who: 'ally', trust: 9, affinity: 5 } }, { fatigue: 3 }, { conf: 1 }] },
      { id: 'fight_split', label: `Argue hard to keep the team together`, risk: 'med', outcomes: [
        { weight: 1, bonus: { mic: 0.4, charisma: 0.3 }, text: `You make the case with numbers and passion, and {creative.first} writes the word "reconsider" at the top of a page. The team survives, and so does the faith.`, effects: [{ rel: { who: 'ally', trust: 6, respect: 4 } }, { pop: 0.2 }, { conf: 2 }] },
        { weight: 1, text: `The argument comes across as desperation, and {creative.first} takes the split off the table only to put a harder version on the next page. {ally.first} hears about it from a third party.`, effects: [{ rel: { who: 'ally', trust: -4 } }, { pop: -0.3 }, { conf: -2 }] } ] },
      { id: 'embrace_split', label: `Embrace the split and ask for a featured singles run`, risk: 'high', result: `{creative.first} perks up and the singles run is drawn on the whiteboard before you finish the sentence. {ally.first} learns about it from the card, and the hurt is quiet and complete.`, effects: [{ rel: { who: 'ally', trust: -10, respect: -3 } }, { pop: 0.8 }, { conf: 2 }] },
      { id: 'temporary', label: `Propose a temporary split with a built-in reunion`, risk: 'med', result: `The idea is that you work apart for six weeks and then collide. {creative.first} likes the shape, {ally.first} likes it more once it is explained, and the stretch in between is lonelier than either of you predicted.`, effects: [{ rel: { who: 'ally', trust: 3 } }, { pop: 0.4 }, { fatigue: 4 }] },
    ],
  },
  {
    id: 'nh_ali_shortcut', category: 'alliance', title: `{ally.name} Has a Shortcut`, weight: 2.5, cooldownDays: 120, maxPerCareer: 2, categoryCooldown: 6,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1, noResults: true },
    trigger: { stat: { popularity: { gte: 25 } }, mem: [{ role: 'ally', trustGte: 10 }] },
    slots: { trick: [`slip a prop into the ring and use it when the referee is down`, `leak a finish to a friendly reporter to get the crowd on side`, `change a spot at the last minute and trust the other person to catch up`], promise: [`that it is only a small one`, `that everybody does it`, `that it has been thought through three times`] },
    body: [`{ally.name} has a plan for tonight: {trick}. {ally.first} insists {promise}, and glances at the door.`, `The plan would work, probably, and it would help both of you. It would also put your name beside something that does not belong to you.`],
    choices: [
      { id: 'refuse', label: `Refuse flatly and walk {ally.first} through why`, risk: 'low', result: `{ally.first} listens with growing embarrassment and agrees by the end. The plan dies in the corridor, and the mutual respect is a little bruised and a little firmer.`, effects: [{ rel: { who: 'ally', respect: 3, trust: 2 } }, { conf: 2 }] },
      { id: 'clean_version', label: `Steer {ally.first} to a version that stays inside the lines`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `Together you rebuild the idea into something cleaner and just as exciting. The match is a hit, and your partner's worst instinct has become your best joint work.`, effects: [{ rel: { who: 'ally', trust: 6, respect: 5 } }, { pop: 0.6 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 4 }] },
        { weight: 1, text: `The cleaned-up version loses the spark, and the crowd sits on its hands for the middle of the match. {ally.first} says nothing about it but sighs at the monitor.`, effects: [{ rel: { who: 'ally', trust: 1 } }, { pop: -0.2 }, { fatigue: 4 }] } ] },
      { id: 'go_along', label: `Go along: it's only for one night`, risk: 'high', outcomes: [
        { weight: 1, bonus: { overall: 0.3 }, text: `The trick works smoothly, and the match is the talk of the evening. You feel the exhilaration of a thing that will not be repeated and probably should not have been done.`, effects: [{ pop: 0.9 }, { rel: { who: 'ally', trust: 6, affinity: 4 } }, { conf: -1 }] },
        { weight: 1, text: `An official sees what happened and the trick goes sideways, with a fine and a very sour speech from the office. Your name is on the report.`, effects: [{ pop: -0.5 }, { money: -3000 }, { rel: { who: 'ally', trust: -4, heat: 4 } }, { conf: -3 }] } ] },
      { id: 'report', label: `Quietly tell an official before the match`, risk: 'high', result: `The plan is neutralised before the bell and {ally.first} guesses the source within an hour. Safe, honest and cold, and the friendship takes a long time to warm again.`, effects: [{ rel: { who: 'ally', trust: -14, respect: -2, heat: 8 } }, { conf: 2 }] },
    ],
  },
  {
    id: 'nh_ali_old_enemy_favour', category: 'alliance', title: `{ex.name} Asks for Your Back`, weight: 2.5, cooldownDays: 130, maxPerCareer: 2, categoryCooldown: 6,
    cast: { ex: { pick: 'tag', tag: 'reconciled' } }, memory: { role: 'ex', max: 2, noResults: true },
    trigger: { mem: [{ role: 'ex', tag: 'reconciled' }] },
    slots: { enemy: [`a booker who has it in for {ex.them}`, `a tag team that has been working {ex.them} over`, `a whisper campaign in the locker room`], ask: [`stand beside {ex.them} at the next show`, `speak up at the meeting on Friday`, `give {ex.them} five minutes of your time and your name`] },
    body: [`{ex.name} has a problem: {enemy}. The ask is that you {ask}, delivered in a voice that has clearly been practised in the car.`, `You and {ex.first} used to be on opposite sides of everything. Now you are being asked to pick a side in something that is not yet a fight.`],
    choices: [
      { id: 'stand_beside', label: `Stand beside {ex.first} and make it visible`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `Your presence alone changes the temperature, and the problem blinks first. {ex.first} thanks you with a handshake that holds slightly too long.`, effects: [{ rel: { who: 'ex', trust: 10, respect: 5, affinity: 5 } }, { pop: 0.3 }, { conf: 2 }] },
        { weight: 1, text: `The move invites a bigger confrontation, and you end up the target of the same attention. {ex.first} is grateful and you are tired.`, effects: [{ rel: { who: 'ex', trust: 6 } }, { pop: -0.2 }, { fatigue: 6 }, { conf: -1 }] } ] },
      { id: 'quiet_word', label: `Have a private word with whoever is behind it`, risk: 'low', result: `The conversation is brief and civil and it takes the pressure off without making a scene. Nobody knows you were involved except the person who needed to.`, effects: [{ rel: { who: 'ex', trust: 5, respect: 3 } }, { fatigue: 2 }, { conf: 1 }] },
      { id: 'hold_back', label: `Decline: your own reputation is still fragile`, risk: 'low', result: `{ex.first} nods slowly and says it makes sense, which is generous. The old distance creeps back, and the peace that was hard won goes back to being a thing that exists mostly on paper.`, effects: [{ rel: { who: 'ex', trust: -8, respect: -3 } }, { conf: -2 }] },
      { id: 'condition', label: `Agree, but ask {ex.first} to return the favour sometime`, risk: 'med', result: `{ex.first} agrees at once, and then more slowly, and the favour is understood as a debt. It is how business works, and a sliver of the warmth goes out of the room.`, effects: [{ rel: { who: 'ex', trust: 3, affinity: -2 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'nh_ali_birthday', category: 'alliance', title: `{ally.name}'s Birthday Falls on the Road`, weight: 1.5, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 6,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 1, noResults: true },
    trigger: { mem: [{ role: 'ally', trustGte: 5 }] },
    slots: { place: [`a motel off the highway`, `an airport hotel with a view of the parking lot`, `a small-town inn with one working elevator`], plan: [`a cake from a gas station`, `a banner made from the hotel's stationery`, `a song that nobody knows all the words to`] },
    body: [`{ally.name} is turning a year older in {place}, and has said nothing about it, which is the reliable sign that it matters. You have found out by accident, and the shops close in forty minutes.`, `You have enough time for a modest plan: {plan}. Whatever you do will be remembered much longer than it deserves to be.`],
    choices: [
      { id: 'surprise', label: `Pull together a surprise with the whole crew`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `Twelve people crowd into one hotel room and sing badly, and {ally.first} laughs until crying. The photograph is taped inside a bag for years.`, effects: [{ rel: { who: 'ally', trust: 6, affinity: 8 } }, { money: -150 }, { fatigue: 4 }, { conf: 2 }] },
        { weight: 1, text: `The surprise leaks, the cake is dropped in the lobby, and the singing turns into a polite round of applause. It is still sweet, but mostly in retrospect.`, effects: [{ rel: { who: 'ally', affinity: 3 } }, { money: -150 }, { fatigue: 4 }] } ] },
      { id: 'quiet_gift', label: `Leave a small, perfect gift on the pillow`, risk: 'low', result: `It is something specific, remembered from a stray remark, and wrapped in the hotel's laundry bag. {ally.first} says nothing about it for two days, then thanks you in a voice that gives the game away.`, effects: [{ money: -120 }, { rel: { who: 'ally', trust: 5, affinity: 6 } }, { conf: 1 }] },
      { id: 'dinner', label: `Take {ally.first} to a quiet dinner for two`, risk: 'low', result: `The restaurant is mediocre and the conversation is great. You learn a few things about {ally.first} that you did not know, and so does {ally.first} about you.`, effects: [{ money: -90 }, { rel: { who: 'ally', trust: 6, affinity: 5 } }, { fatigue: 3 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'forget', label: `Wish {ally.first} well in the lobby and go to bed early`, risk: 'low', result: `The wish is genuine, brief and warm, and you sleep for nine hours. Over breakfast, it is clear that the gesture was enough for some and not all.`, effects: [{ rel: { who: 'ally', affinity: 1 } }, { fatigue: -5 }] },
    ],
  },
  {
    id: 'nh_ali_envy', category: 'alliance', title: `{ally.name} Got the Push`, weight: 2.5, cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 6, major: true,
    cast: { ally: { pick: 'tag', tag: 'ally' } }, memory: { role: 'ally', max: 2, noResults: true },
    trigger: { stat: { popularity: { gte: 25 }, careerYears: { gte: 1 } }, mem: [{ role: 'ally', trustGte: 10 }] },
    slots: { push: [`a featured spot on the next big card`, `a series of promos on the main show`, `a trial run in the main event picture`], feeling: [`a sour taste you did not expect`, `a small, ugly knot under the ribs`, `a warm, complicated mix of pride and envy`] },
    body: [`The card is posted on the corkboard, and {ally.name} has been given {push}, the sort of break you thought was yours. You read the line twice and feel {feeling}.`, `{ally.first} comes down the hallway, spots the crowd by the board, and slows. Everyone is watching to see how you take it.`],
    choices: [
      { id: 'congratulate', label: `Congratulate {ally.first} first, and mean it`, risk: 'low', result: `You get the words out ahead of the knot and the hug is real. It costs something to say, and you feel a measure of dignity that stays long after the envy fades, though it takes the rest of the day to stop aching.`, effects: [{ rel: { who: 'ally', trust: 8, respect: 6, affinity: 5 } }, { conf: -2 }, { fatigue: 4 }] },
      { id: 'ask_how', label: `Ask {ally.first} what changed and how to get the same`, risk: 'med', result: `{ally.first} thinks about it honestly and tells you three things, of which one hurts. You take notes and the note-taking is itself a sort of repair.`, effects: [{ rel: { who: 'ally', trust: 4, respect: 3 } }, { attr: { name: 'psychology', delta: 1 } }, { conf: -1 }] },
      { id: 'sulk', label: `Say a stiff congratulations and keep your distance`, risk: 'med', result: `The words are correct and the tone is flat, and everyone in the corridor hears the difference. {ally.first} nods, a little hurt, and the following weeks are quiet.`, effects: [{ rel: { who: 'ally', trust: -6, affinity: -4 } }, { conf: -2 }] },
      { id: 'undermine', label: `Mention a weakness to the office, "for the team's sake"`, risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `Your comment is subtle enough that the push is trimmed without a trace. {ally.first} never learns, and you wake at night with the memory.`, effects: [{ pop: 0.2 }, { rel: { who: 'ally', trust: -2 } }, { conf: -3 }] },
        { weight: 2, text: `The comment is traced back in two days, and the corridor goes cold around you. {ally.first} does not shout, which is a terrible compliment.`, effects: [{ event: { type: 'betrayal', participants: ['ally'], summary: `Undercut {ally.name} with the office after a push.`, importance: 3, data: { context: 'tag_partner', byPlayer: true } } }, { pop: -0.4 }, { conf: -4 }] } ] },
    ],
  },
];
