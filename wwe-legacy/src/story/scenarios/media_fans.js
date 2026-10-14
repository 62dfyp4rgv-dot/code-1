// Media, podcast, press, social, fans, creative and opportunity scenarios.
// Authored templates; validated with: node tools/scenarios.js --file src/story/scenarios/media_fans.js
export default [
  // ============================================================== MEDIA
  {
    id: 'med_documentary_crew', category: 'media', title: 'A Documentary Crew at the Door', weight: 1.5, cooldownDays: 150, maxPerCareer: 2, major: true,
    cast: { producer: { pick: 'staff', role: 'producer' }, interviewer: { pick: 'media', kind: 'interviewer' } },
    trigger: { stat: { popularity: { gte: 40 }, careerYears: { gte: 1 } } },
    slots: { access: ['backstage access', 'a full season of your life', 'permission to follow you on the road', 'a corner of your locker room'], format: ['a cable network special', 'a prestige documentary series', 'a university film project', 'a regional TV news feature'] },
    body: [`{interviewer.name} is directing {format}, and the pitch is simple: the crew wants {access}, lights, microphones and all. {producer.name} has already signed off on the footage rules, but nobody can promise what ends up on the cutting-room floor.`, `A camera sees what a crowd never does: the ice baths, the arguments in hallways, the quiet minutes before the curtain. You can shape how much of that gets seen, but not how it is edited.`],
    choices: [
      { id: 'open_doors', label: 'Open every door and let them film', risk: 'high', outcomes: [
        { weight: 3, bonus: { charisma: 0.6 }, text: `The footage is raw and human, and the finished cut makes you look like someone worth rooting for. Viewers write to the network asking for more.`, effects: [{ pop: 1.1 }, { conf: 3 }, { fatigue: 8 }, { event: { type: 'interview', participants: ['interviewer'], summary: 'Gave a documentary crew unrestricted access.', data: { quality: { base: 66, charisma: 0.5, noise: 12 }, viral: { minQuality: 82, chance: 0.35 } } } }] },
        { weight: 2, text: `The editors lean on a bad afternoon and a snapped sentence. You come across as colder than you are, and your peers notice the clip first.`, effects: [{ pop: -0.5 }, { conf: -4 }, { fatigue: 8 }] } ] },
      { id: 'controlled', label: 'Allow filming only on your terms', risk: 'low', result: `You hand over a schedule and a list of off-limits rooms. The crew grumbles but works within it, and the result is polished, safe and a little forgettable.`, effects: [{ pop: 0.3 }, { fatigue: 4 }] },
      { id: 'sell_exclusive', label: 'Demand a fee for the exclusive', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The production company blinks and writes a cheque. The paycheck is nice, though a few colleagues mutter that you turned the locker room into a business line.`, effects: [{ money: 25000 }, { pop: 0.2 }, { conf: 1 }] },
        { weight: 1, text: `They walk, and the story gets around that you priced yourself out of free publicity.`, effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
      { id: 'refuse', label: 'Turn it down and protect your privacy', risk: 'low', result: `Nobody films your hallway arguments. You keep your peace, and the spotlight goes to someone else's story.`, effects: [{ conf: 2 }, { pop: -0.3 }] },
    ],
  },
  {
    id: 'med_magazine_cover', category: 'media', title: 'A Cover Offer from {mag}', weight: 1.5, cooldownDays: 160, maxPerCareer: 2,
    cast: { journalist: { pick: 'media', kind: 'journalist' } },
    trigger: { stat: { popularity: { gte: 55 } } },
    slots: { mag: ['a glossy lifestyle monthly', 'a fitness magazine', 'a national sports weekly', 'a fashion quarterly'], concept: ['shot in a hushed black-and-white studio', 'posed with a vintage championship belt', 'in a formal suit you would never pick', 'in a staged brawl with a stunt double'] },
    body: [`{journalist.name} calls with news: {mag} wants you on its cover, {concept}. The shoot would run eleven hours and the fee is modest, but a cover reaches people who have never watched a match.`, `Your agent says to take it. The cover line they have in mind, though, is not exactly the story you would tell about yourself.`],
    choices: [
      { id: 'full_commit', label: 'Commit to the shoot and the interview', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.7 }, text: `You nail it. The photographer says the final frame is the best of the day, and the issue sells out at airport newsstands.`, effects: [{ pop: 1.2 }, { money: 8000 }, { fatigue: 10 }] },
        { weight: 1, text: `Hour nine of the shoot is a blur. The chosen cover shot has you blinking, and the internet does the rest.`, effects: [{ pop: 0.2 }, { money: 8000 }, { fatigue: 12 }, { conf: -3 }] } ] },
      { id: 'creative_control', label: 'Insist on picking the angle and the headline', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5 }, text: `The editor agrees to your headline. It reads sharper than anything they would have chosen, and the piece gets quoted.`, effects: [{ pop: 0.6 }, { conf: 3 }, { fatigue: 6 }] },
        { weight: 2, text: `They hold the line and run their headline anyway. You took the time and still lost the argument.`, effects: [{ pop: 0.1 }, { fatigue: 6 }, { conf: -2 }] } ] },
      { id: 'inside_only', label: 'Take the interview but skip the cover', risk: 'low', result: `A few inches of copy inside the issue, a small photo, and nobody asks for a second take. Safe, and exactly as forgettable as it sounds.`, effects: [{ pop: 0.2 }, { money: 1500 }] },
      { id: 'decline', label: 'Decline and keep the day for training', risk: 'low', result: `You keep your hours at the gym. The cover goes to a pop singer, and your agent sighs on the phone.`, effects: [{ fatigue: -6 }, { conf: 1 }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'med_late_night_spot', category: 'media', title: 'A Seat Next to {host.name}', weight: 1.5, cooldownDays: 150, maxPerCareer: 3,
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 2000, stat: { popularity: { gte: 50 }, charisma: { gte: 45 } } },
    slots: { programme: ['a late-night comedy show', 'a daytime talk show', 'a celebrity game show', 'a late-night chat hour'], bit: ['a cooking segment', 'a lie-detector gag', 'a trivia quiz against a pop star', 'a straight sit-down chat'] },
    body: [`{host.name} wants you on {programme}, and the producers have built the whole slot around {bit}. The audience is mostly people who would walk past you in an airport without knowing why you look familiar.`, `Five minutes of television will be watched by more people than a sold-out arena. It can also be replayed forever.`],
    choices: [
      { id: 'play_along', label: 'Play along and lean into the joke', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.8 }, text: `You land the first punchline and the audience turns warm. By the commercial break the host is asking for your autograph.`, effects: [{ pop: 1.2 }, { conf: 3 }, { event: { type: 'interview', participants: ['host'], summary: 'Charmed a mainstream talk-show audience.', data: { quality: { base: 68, charisma: 0.6, mic: 0.3, noise: 10 }, viral: { minQuality: 84, chance: 0.4 } } } }] },
        { weight: 2, text: `The bit drags and the host talks over you. The clip that circulates is the stiff ten seconds in the middle.`, effects: [{ pop: -0.2 }, { conf: -3 }] } ] },
      { id: 'stay_in_character', label: 'Stay in your ring character the whole time', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5 }, text: `The deadpan commitment is hilarious in a studio. The host cannot break you, and the audience remembers it.`, effects: [{ pop: 0.9 }, { fatigue: 3 }] },
        { weight: 2, text: `The audience does not know the character, so the act reads as cold and slightly menacing.`, effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
      { id: 'plug_the_show', label: 'Spend the slot plugging the next big event', risk: 'low', result: `The segment feels like an ad, but your promoters send flowers. Ticket sales for the next show tick up, and the host looks a little bored.`, effects: [{ pop: 0.4 }, { money: 4000 }, { conf: -1 }] },
      { id: 'pass', label: 'Pass on it and stay with the core fans', risk: 'low', result: `The slot goes to a pop singer. Your regulars like that you stayed true, though the booker wonders what else you are saving yourself for.`, effects: [{ conf: 2 }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'med_radio_morning', category: 'media', title: 'The {station} Morning Show', weight: 1.5, cooldownDays: 90, maxPerCareer: 4,
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { stat: { popularity: { gte: 30 } } },
    slots: { station: ['rock radio', 'sports talk', 'country radio', 'college radio'], twist: ['a 5 a.m. call time', 'a live remote from a car dealership', 'a prank phone-in segment', 'a rapid-fire quiz with the crew'] },
    body: [`The {station} morning show has booked you with {twist}. {host.name} is known for chaotic energy and for asking whatever the producers slip under the door.`, `Your alarm is set for an hour that should not exist. If you are sharp, the audience gets a funny and honest slot; if not, they get a clip.`],
    choices: [
      { id: 'bring_energy', label: 'Bring full energy despite the hour', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.5 }, text: `By the second segment you and {host.first} are trading jokes like old friends. The call-ins light up the board.`, effects: [{ pop: 0.7 }, { fatigue: 8 }, { conf: 2 }] },
        { weight: 1, text: `You miss two cues and say something you cannot unsay on a live mic. The apology takes ten minutes.`, effects: [{ pop: -0.4 }, { fatigue: 8 }, { conf: -3 }] } ] },
      { id: 'low_key', label: 'Keep it relaxed and low-key', risk: 'low', result: `Pleasant, a bit sleepy, over by quarter past six. The hosts say thank you, and the audience has forgotten you by noon.`, effects: [{ pop: 0.2 }, { fatigue: 3 }] },
      { id: 'take_the_bit', label: 'Go along with the prank at your own expense', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.6 }, text: `You take the joke on the chin and give it back. Listeners vote it the segment of the week.`, effects: [{ pop: 1.0 }, { fatigue: 6 }, { event: { type: 'interview', participants: ['host'], summary: 'Took a radio prank in good humour.', data: { quality: { base: 62, charisma: 0.5, noise: 12 }, viral: { minQuality: 80, chance: 0.3 } } } }] },
        { weight: 1, text: `The prank goes too far and the clip is edited into something meaner than it was.`, effects: [{ pop: -0.4 }, { conf: -4 }, { fatigue: 6 }] } ] },
      { id: 'cancel', label: 'Cancel at the last minute for sleep', risk: 'low', result: `You sleep, but the producers will not forget that you bailed. The slot goes to a bodybuilder.`, effects: [{ fatigue: -8 }, { pop: -0.3 }] },
    ],
  },
  {
    id: 'med_viral_clip', category: 'media', title: 'The Clip You Never Meant to Share', weight: 2, cooldownDays: 100, maxPerCareer: 4,
    trigger: { minYear: 2010, stat: { popularity: { gte: 35 } } },
    slots: { clip: ['a stumble on the entrance ramp', 'an eye-roll at a rival\'s promo', 'a quiet moment helping a child up from the barricade', 'a pre-show hallway rehearsal of your promo'], spread: ['a fan account', 'a sports blog', 'a news aggregator', 'a comedy channel'] },
    body: [`Someone has posted {clip}, and it has been picked up by {spread}. Within two hours it has more views than your last three matches combined.`, `The comments split into laughing, cheering and a few people who want to explain what you were really thinking. Your phone has not stopped buzzing.`],
    choices: [
      { id: 'lean_in', label: 'Lean in and make a joke of it', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.7 }, text: `Your reply is quick, generous and self-aware. The clip becomes a running joke fans share in your favour.`, effects: [{ pop: 1.1 }, { conf: 3 }, { event: { type: 'social_post', participants: [], summary: 'Turned an unintended clip into a running joke.', data: { quality: { base: 66, charisma: 0.6, mic: 0.2, noise: 14 }, viral: { minQuality: 80, chance: 0.5 } } } }] },
        { weight: 2, text: `The joke arrives a day late and reads as trying too hard. The pile-on gets louder.`, effects: [{ pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'explain', label: 'Post a calm explanation of what happened', risk: 'low', result: `A short, honest paragraph. The loudest voices move on and the supportive ones thank you for it.`, effects: [{ pop: 0.2 }, { conf: 1 }, { fatigue: 2 }] },
      { id: 'ask_takedown', label: 'Ask the poster to take it down', risk: 'med', outcomes: [
        { weight: 2, text: `The account complies after a polite message. Quiet, tidy, and the matter is dead by evening.`, effects: [{ conf: 1 }, { pop: -0.1 }] },
        { weight: 2, text: `The request is screenshotted and the clip doubles in views. Asking for silence only turned up the volume.`, effects: [{ pop: -0.6 }, { conf: -3 }] } ] },
      { id: 'ignore', label: 'Say nothing and let it run its course', risk: 'low', result: `By the weekend it is old news. You miss the rush of attention, but there is no fallout either.`, effects: [{ conf: -1 }] },
    ],
  },
  {
    id: 'med_misquote', category: 'media', title: 'Your Words, Twisted by {outlet}', weight: 1.5, cooldownDays: 90, maxPerCareer: 4,
    cast: { journalist: { pick: 'media', kind: 'journalist' } },
    trigger: { stat: { popularity: { gte: 35 }, promos: { gte: 3 } } },
    slots: { outlet: ['a wrestling newsletter', 'a national newspaper', 'a gossip site', 'a trade magazine'], quote: ['called the champion washed', 'dismissed the fans in the cheap seats', 'blamed the creative team for a flat segment', 'laughed off a rival\'s injury'] },
    body: [`{outlet} is running a story in which you supposedly {quote}. {journalist.name} wrote it, and it leans hard on a sentence you remember saying very differently.`, `Colleagues are already texting you screenshots. Whether you want a retraction or a shrug, someone will have to answer for it.`],
    choices: [
      { id: 'demand_correction', label: 'Demand a formal correction', risk: 'med', outcomes: [
        { weight: 2, text: `A correction appears in small print, and {journalist.first} stays cold for months. The story is fixed for the people who read the correction.`, effects: [{ conf: 2 }, { pop: 0.1 }] },
        { weight: 2, text: `The outlet digs in and publishes the full tape. It supports them more than you.`, effects: [{ pop: -0.6 }, { conf: -4 }] } ] },
      { id: 'own_voice', label: 'Tell your own side in a short video', risk: 'med', outcomes: [
        { weight: 3, bonus: { mic: 0.6 }, text: `Straight to camera, no script. The video does the work, and the original story looks sloppy next to it.`, effects: [{ pop: 0.7 }, { conf: 3 }, { fatigue: 6 }, { event: { type: 'interview', participants: ['journalist'], summary: 'Corrected a misquote directly with fans.', data: { quality: { base: 65, mic: 0.6, noise: 10 }, handled: true, controversy: true } } }] },
        { weight: 1, text: `You come across as defensive, and the outlet repeats the original quote in the next piece.`, effects: [{ pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'ring_the_writer', label: 'Call the writer privately and ask for context', risk: 'low', result: `{journalist.first} agrees to look at the tape again and softens the headline. The story is quieter, but not erased.`, effects: [{ conf: 1 }, { pop: 0.1 }, { fatigue: 2 }] },
      { id: 'let_it_ride', label: 'Let it stand and avoid more attention', risk: 'low', result: `The story gets a day of oxygen and then goes quiet. A few people keep believing the version they read.`, effects: [{ pop: -0.3 }, { conf: -2 }] },
    ],
  },
  {
    id: 'med_streak_interview', category: 'media', title: 'Questions About the Streak', weight: 2, cooldownDays: 70, maxPerCareer: 4,
    cast: { interviewer: { pick: 'media', kind: 'interviewer' } },
    trigger: { stat: { winStreak: { gte: 5 } } },
    slots: { streak: ['your unbeaten run', 'your hot streak', 'your winning habit', 'the run everyone is watching'], setting: ['a TV panel segment', 'a one-on-one print interview', 'a streamed fireside chat', 'a locker-room walk-and-talk'] },
    body: [`{interviewer.name} has booked {setting} to discuss {streak}. The numbers are hard to ignore, and every wrestler in the building has noticed them too.`, `The questions start flattering and get sharper: is the run luck, is the booking being kind, and who is allowed to be the one to end it?`],
    choices: [
      { id: 'confident', label: 'Own it: say you are not planning to lose', risk: 'med', outcomes: [
        { weight: 3, bonus: { confidence: 0.6 }, text: `The room goes quiet at the right moment. You sound like someone who believes it, and the quote travels.`, effects: [{ pop: 0.8 }, { conf: 3 }, { event: { type: 'interview', participants: ['interviewer'], summary: 'Spoke confidently about a long winning streak.', data: { quality: { base: 66, mic: 0.5, conf: 0.3, noise: 10 }, viral: { minQuality: 85, chance: 0.3 } } } }, { promise: { kind: 'win_streak', text: 'I am not planning to lose', params: { n: 3 }, deadlineDays: 60 } }] },
        { weight: 1, text: `The line is bold, and the next opponent is already pinning the clipping on a corkboard.`, effects: [{ pop: 0.3 }, { conf: 1 }, { promise: { kind: 'win_streak', text: 'I am not planning to lose', params: { n: 3 }, deadlineDays: 60 } }] } ] },
      { id: 'credit_team', label: 'Credit the team around you', risk: 'low', result: `You name the agents, the trainers and the opponents who made the run possible. The locker room loves hearing it.`, effects: [{ pop: 0.3 }, { conf: -1 }] },
      { id: 'tease_end', label: 'Admit the streak worries you', risk: 'med', result: `Honest, a little vulnerable. Fans like the humanity, but a rival hears a gap in your armour.`, effects: [{ pop: 0.4 }, { conf: -3 }] },
      { id: 'deflect', label: 'Refuse to discuss the streak at all', risk: 'low', result: `You keep the answers short. The piece runs thin and fans are left wanting more.`, effects: [{ pop: -0.1 }, { conf: 1 }] },
    ],
  },
  {
    id: 'med_losing_interview', category: 'media', title: 'Questions About the Slump', weight: 2, cooldownDays: 70, maxPerCareer: 4,
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { stat: { loseStreak: { gte: 4 } } },
    slots: { slump: ['your losing streak', 'your cold spell', 'your rough patch', 'the slide'], mood: ['a sympathetic profile', 'a hard-edged column', 'a livestreamed Q&A', 'a backstage ambush'] },
    body: [`{reporter.name} is working on {mood} about {slump}. The list of questions includes whether you are being buried on purpose, whether your body is breaking down, and whether you have lost the room.`, `You have answered nothing so far. The silence is starting to answer for you.`],
    choices: [
      { id: 'face_it', label: 'Face it: speak plainly about the slump', risk: 'med', outcomes: [
        { weight: 3, bonus: { mic: 0.5, confidence: 0.4 }, text: `You name the losses, the mistakes, and the work you are doing to fix them. The respect that follows is genuine.`, effects: [{ pop: 0.5 }, { conf: 4 }, { event: { type: 'interview', participants: ['reporter'], summary: 'Spoke candidly about a losing streak.', data: { quality: { base: 64, mic: 0.5, conf: 0.3, noise: 10 }, handled: true } } }] },
        { weight: 1, text: `Your voice cracks on the third question. The clip is lifted without context and used to frame you as finished.`, effects: [{ pop: -0.4 }, { conf: -4 }] } ] },
      { id: 'blame_booking', label: 'Hint the booking has been against you', risk: 'high', outcomes: [
        { weight: 2, text: `The fans agree loudly and the front office pretends not to hear it. You feel lighter, even if the office does not.`, effects: [{ pop: 0.6 }, { conf: 2 }, { fatigue: 2 }] },
        { weight: 2, text: `A producer reads the story over breakfast. You are suddenly less likely to be considered for the next big push.`, effects: [{ pop: 0.2 }, { conf: -3 }] } ] },
      { id: 'promise_turnaround', label: 'Promise a turnaround by the next big show', risk: 'high', result: `A big claim from a wrestler who has not won in a while. Fans love the nerve, and the clock now ticks on you.`, effects: [{ promise: { kind: 'win_match', text: 'I will turn this slump around', deadlineDays: 45 } }, { pop: 0.5 }, { conf: 2 }] },
      { id: 'no_comment', label: 'Decline to comment and hit the gym', risk: 'low', result: `You skip the sit-down and spend the afternoon training. The story runs without your side, but your body thanks you.`, effects: [{ conf: 1 }, { fatigue: 5 }, { pop: -0.3 }] },
    ],
  },
  {
    id: 'med_title_reign_interview', category: 'media', title: 'A Champion Profile', weight: 2, cooldownDays: 90, maxPerCareer: 4,
    cast: { interviewer: { pick: 'media', kind: 'interviewer' } },
    trigger: { holdsTitle: true, stat: { daysChampion: { gte: 60 } } },
    slots: { reign: ['Sixty Days In', 'The Reign So Far', 'Carrying the Gold', 'Life With the Belt'], angle: ['whether you are a transitional champion', 'who can actually take the title', 'how heavy the title feels', 'whether the fans still believe in you'] },
    body: [`{interviewer.name} sits you down for a long profile under the heading "{reign}". The main thread of the questions is {angle}, which is a polite way of asking whether your time is almost up.`, `The belt sits on the table between you. It looks small in daylight, and everyone in the studio is aware of it.`],
    choices: [
      { id: 'dominant', label: 'Project total dominance', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.6, confidence: 0.4 }, text: `You deliver one line after another with no hesitation. The belt looks like it belongs to you.`, effects: [{ pop: 0.8 }, { conf: 3 }, { event: { type: 'interview', participants: ['interviewer'], summary: 'Projected dominance as champion.', data: { quality: { base: 68, mic: 0.5, conf: 0.4, noise: 10 }, viral: { minQuality: 86, chance: 0.35 } } } }] },
        { weight: 1, text: `It reads as arrogance, and the next challenger uses your quote as a rallying cry.`, effects: [{ pop: 0.1 }, { conf: 1 }, { fatigue: 2 }] } ] },
      { id: 'humble', label: 'Speak with humility about the responsibility', risk: 'low', result: `A warm, measured conversation. Fans see a champion worth following, though a few miss the swagger.`, effects: [{ pop: 0.4 }, { conf: 1 }] },
      { id: 'open_challenge', label: 'Issue an open challenge to the whole roster', risk: 'high', result: `Your answer goes on the board and the entire locker room reads it. Every ambitious name now has a reason to come after you.`, effects: [{ pop: 0.9 }, { conf: 2 }, { fatigue: 5 }, { promise: { kind: 'retain_title', text: 'I will beat anyone who wants the title', params: { defenses: 2 }, deadlineDays: 90 } }] },
      { id: 'tired', label: 'Admit the reign has been exhausting', risk: 'med', result: `The honesty humanises you. It also tells the roster you might be vulnerable.`, effects: [{ pop: 0.3 }, { conf: -2 }, { fatigue: -4 }] },
    ],
  },
  {
    id: 'med_colleague_comment', category: 'media', title: 'A Colleague\'s Comment Reaches the Press', weight: 2, cooldownDays: 80, maxPerCareer: 4,
    cast: { peer: { pick: 'roster', tier: { gte: 2 } }, reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { stat: { popularity: { gte: 35 } } },
    slots: { topic: ['the business was tougher in the old days', 'new talent has not earned its spot', 'fans only cheer for spectacle now', 'the title picture is decided before the season starts'], venue: ['a hallway scrum', 'a surprise phone call', 'a live Q&A on the arena concourse', 'a rapid-fire text exchange'] },
    body: [`{peer.name} has told a magazine that {topic}, and the quote is making the rounds. {reporter.name} has now caught you in {venue} to ask what you make of it.`, `You have worked next to {peer.first} and you have a view. Whatever you say will be quoted back at both of you.`],
    choices: [
      { id: 'agree', label: 'Agree and back {peer.first} publicly', risk: 'med', outcomes: [
        { weight: 2, text: `{peer.first} hears about it within the hour and sends a thank-you text. A few of the younger wrestlers are cooler to you after that.`, effects: [{ rel: { who: 'peer', trust: 6, respect: 4 } }, { pop: 0.1 }, { conf: 1 }] },
        { weight: 1, text: `The backlash is bigger than the original comment. You spend the evening answering for words that were never yours.`, effects: [{ rel: { who: 'peer', trust: 3 } }, { pop: -0.6 }, { conf: -3 }] } ] },
      { id: 'disagree', label: 'Disagree, and say why', risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.6 }, text: `Your reasoning is clear and fair. Fans see someone who thinks for themselves, and {peer.first} knows it.`, effects: [{ pop: 0.8 }, { rel: { who: 'peer', respect: 2, heat: 8 } }, { event: { type: 'interview', participants: ['reporter', 'peer'], summary: 'Publicly disagreed with {peer.name}.', data: { quality: { base: 64, mic: 0.5, noise: 12 }, controversy: true, viral: { minQuality: 84, chance: 0.3 } } } }] },
        { weight: 1, text: `It comes out harder than you meant. {peer.first} takes it as a personal attack and the dressing room freezes.`, effects: [{ rel: { who: 'peer', heat: 14, respect: -4 } }, { rivalry: { who: 'peer', heat: 8 } }, { pop: 0.2 }, { conf: -2 }] } ] },
      { id: 'diplomatic', label: 'Stay diplomatic and praise {peer.first}', risk: 'low', result: `You call it a misunderstanding and say how much you have learned from {peer.first}. The story fizzles, and no one is happy.`, effects: [{ rel: { who: 'peer', respect: 2 } }, { pop: -0.1 }] },
      { id: 'refuse', label: 'Refuse to be drawn into it', risk: 'low', result: `You smile and walk away. {reporter.first} writes that you declined to comment, which says more than you would have wanted.`, effects: [{ conf: -1 }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'med_commentary_criticism', category: 'media', title: 'The Commentary Booth Takes Aim', weight: 1.5, cooldownDays: 100, maxPerCareer: 3,
    cast: { commentator: { pick: 'media', kind: 'commentator' } },
    trigger: { stat: { matches: { gte: 15 }, rating: { lte: 70 } } },
    slots: { complaint: ['sloppy transitions', 'a lack of urgency', 'a recycled move set', 'overselling'], forum: ['on a live broadcast', 'on a post-show podcast', 'in a newspaper column', 'in a viral clip'] },
    body: [`{commentator.name} has criticised your in-ring work {forum}, naming {complaint} specifically. It is the kind of critique that stings because it is half right.`, `Your trainer has not mentioned it. The silence from the production truck is louder.`],
    choices: [
      { id: 'work_on_it', label: 'Take the note and drill it in the ring', risk: 'low', result: `Three extra sessions a week and a long talk with your trainer. It costs energy, but the next tape looks sharper.`, effects: [{ attr: { name: 'technical', delta: 1 } }, { fatigue: 12 }, { conf: 1 }] },
      { id: 'confront', label: 'Confront {commentator.first} face to face', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, mic: 0.4 }, text: `You talk like a professional and walk out with a mutual respect that surprises both of you.`, effects: [{ pop: 0.4 }, { conf: 3 }] },
        { weight: 2, text: `It becomes an argument within the first minute. Someone in the corridor records the last fifteen seconds.`, effects: [{ pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'fire_back', label: 'Fire back with a line on social or air', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.6 }, text: `Your reply is crisp and the crowd roars. Commentators suddenly treat you with a bit more care.`, effects: [{ pop: 0.7 }, { conf: 2 }] },
        { weight: 1, text: `The reply is clumsy and the commentator reads it out live to enjoy the reaction.`, effects: [{ pop: -0.5 }, { conf: -3 }] } ] },
      { id: 'shrug', label: 'Shrug it off as the price of attention', risk: 'low', result: `You do not give them the satisfaction. The story ends, but the criticism sits in the back of your head.`, effects: [{ conf: -2 }] },
    ],
  },
  {
    id: 'med_hometown_profile', category: 'media', title: 'The Hometown Paper Calls', weight: 1.2, cooldownDays: 160, maxPerCareer: 2,
    cast: { journalist: { pick: 'media', kind: 'journalist' } },
    trigger: { stat: { popularity: { gte: 40 }, careerYears: { gte: 2 } } },
    slots: { angle: ['the local kid who made good', 'the long road from small-town gyms', 'your family\'s reaction to the lifestyle', 'a hometown parade nobody asked for'], hook: ['a Sunday supplement', 'a regional TV spot', 'a school newsletter', 'a radio call-in'] },
    body: [`{journalist.name} is writing a piece for {hook} on {angle}. The editor says the town has been waiting years for a reason to be proud, and a few neighbours have already written in with stories about you.`, `The invitation includes a visit to your old school gym. Home asks for a different version of you than the one on the screen.`],
    choices: [
      { id: 'go_home', label: 'Go home and give the town a full day', risk: 'low', result: `Handshakes at every corner shop, a surprise from your old coach and a cake in the shape of a ring. It is tiring and it fills you up.`, effects: [{ pop: 0.6 }, { conf: 4 }, { fatigue: 10 }] },
      { id: 'phone_it', label: 'Do the interview by phone only', risk: 'low', result: `Twenty minutes between airports. The piece is fine, and your mother asks why you could not visit.`, effects: [{ pop: 0.2 }, { conf: -1 }] },
      { id: 'tell_hard_truths', label: 'Tell the hard parts of the journey too', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `The honesty lands. The article runs long, readers share it, and a few people write to say it changed their view of the business.`, effects: [{ pop: 0.8 }, { conf: 3 }, { fatigue: 4 }] },
        { weight: 1, text: `A throwaway line about a local rival is spun into a feud with the town. You get a hostile letter.`, effects: [{ pop: -0.2 }, { conf: -2 }, { fatigue: 4 }] } ] },
      { id: 'decline', label: 'Decline politely and keep your hometown private', risk: 'low', result: `The editor accepts it. A cousin sends a pointed message, and the town finds another story.`, effects: [{ conf: 1 }, { pop: -0.2 }] },
    ],
  },
  // ============================================================== PODCAST
  {
    id: 'pod_ask_about_rival', category: 'podcast', title: 'The Podcast Wants to Talk About {rival.name}', weight: 2, cooldownDays: 60, maxPerCareer: 5,
    cast: { rival: { pick: 'rivalry', minHeat: 15 }, host: { pick: 'media', kind: 'host' } },
    memory: { role: 'rival', max: 1 },
    trigger: { minYear: 2008, stat: { popularity: { gte: 25 }, careerYears: { gte: 0.5 } } },
    slots: { show: ['a long-form interview show', 'a wrestling-fan roundtable', 'a comedy podcast', 'a shock-jock morning show'], angle: ['whether the feud is real', 'who needs whom more', 'whose finish is better', 'whether anybody is the good guy'] },
    body: [`You are two hours into {show} and {host.name} finally gets to the question everyone listening wants answered: {angle}. {host.first} leans into the microphone and lets you speak first.`, `{rival.name} is sure to hear the episode, probably before the weekend. A single good sentence could trend; a bad one will be quoted at you for months.`],
    choices: [
      { id: 'take_apart', label: 'Take {rival.first} apart with a sharp critique', risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.7 }, text: `You are clinical and funny, and {host.first} laughs out loud. By the next morning the best lines have been clipped and shared.`, effects: [{ pop: 0.9 }, { rivalry: { who: 'rival', heat: 10 } }, { rel: { who: 'rival', heat: 8 } }, { event: { type: 'podcast', participants: ['host', 'rival'], summary: 'Took {rival.name} apart on a podcast.', data: { quality: { base: 66, mic: 0.6, noise: 12 }, viral: { minQuality: 82, chance: 0.4 } } } }] },
        { weight: 1, text: `It comes across as petty and personal rather than clever. The comments call you bitter.`, effects: [{ pop: -0.4 }, { rivalry: { who: 'rival', heat: 8 } }, { rel: { who: 'rival', heat: 6 } }, { conf: -2 }] } ] },
      { id: 'respect', label: 'Give {rival.first} credit and keep it professional', risk: 'low', result: `You name what {rival.first} does well, then explain why you still plan to win. The rival hears it as honest respect, and the fans are split on whether it is gutless.`, effects: [{ rel: { who: 'rival', respect: 6, heat: -5 } }, { pop: 0.2 }, { conf: 1 }] },
      { id: 'tease_match', label: 'Hint at a match you want to see happen', risk: 'med', result: `You float a stipulation and watch the host's eyebrows go up. Front-office staff will have to answer for it later.`, effects: [{ pop: 0.5 }, { rel: { who: 'rival', heat: 4 } }, { fatigue: 3 }, { event: { type: 'podcast', participants: ['host', 'rival'], summary: 'Floated a future match with {rival.name} on air.', data: { quality: { base: 60, mic: 0.4, noise: 10 } } } }] },
      { id: 'dodge', label: 'Dodge the question with a joke', risk: 'low', result: `{host.first} chases you for two more minutes before giving up. The episode lacks the news that was promised.`, effects: [{ pop: -0.1 }, { conf: -1 }] },
    ],
  },
  {
    id: 'pod_goals_question', category: 'podcast', title: 'Where Do You See Yourself?', weight: 1.5, cooldownDays: 120, maxPerCareer: 3,
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 2008, stat: { popularity: { gte: 30 }, careerYears: { gte: 0.5 } } },
    slots: { show: ['a rookie-focused podcast', 'a fan-run weekly show', 'a retired-wrestlers\' roundtable', 'a business-of-wrestling show'], goal: ['the main event', 'a championship', 'an iron-clad contract', 'a place in the history books'] },
    body: [`{host.name} on {show} asks you the question that sounds simple: what do you actually want from this career? The producers have a tag line ready, and you can see the countdown clock on the wall.`, `{goal} is the answer most guests give. The listeners are curious whether you will say it out loud.`],
    choices: [
      { id: 'big_promise', label: 'Name a bold, public goal', risk: 'high', result: `You say it plainly, on record, with a timeline. The fans like the ambition, and now there is a clock on it.`, effects: [{ promise: { kind: 'win_title', text: 'I will win a championship', deadlineDays: 240 } }, { pop: 0.7 }, { conf: 3 }, { event: { type: 'goal_set', participants: ['host'], summary: 'Declared a public career goal on a podcast.', data: {} } }] },
      { id: 'work_the_craft', label: 'Say you just want to be the best at the craft', risk: 'low', result: `A modest answer from someone who plainly cares. It does not make headlines, but it earns respect from veterans who are listening.`, effects: [{ pop: 0.2 }, { conf: 2 }] },
      { id: 'honest_doubt', label: 'Admit you are not sure what you want yet', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `The honesty lands. Messages pour in from fans who say they feel the same way.`, effects: [{ pop: 0.6 }, { conf: -1 }] },
        { weight: 1, text: `It sounds like a lack of drive, and the booker hears the episode on a flight.`, effects: [{ pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'sell_it', label: 'Turn it into a pitch for your brand', risk: 'med', result: `You skip the dream and pitch your merchandise and next event. The host plays along, the listeners roll their eyes, and sales go up a little.`, effects: [{ money: 3000 }, { pop: 0.1 }, { conf: -1 }] },
    ],
  },
  {
    id: 'pod_old_injury', category: 'podcast', title: 'The Injury Everyone Remembers', weight: 1.5, cooldownDays: 120, maxPerCareer: 3,
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 2008, injured: false, stat: { injuries: { gte: 1 } } },
    slots: { tone: ['gently', 'with a clinical curiosity', 'with a morbid fascination', 'with obvious sympathy'], format: ['a medical-themed episode', 'a hosted retrospective', 'a live-audience taping', 'a late-night call-in hour'] },
    body: [`{host.name} brings up your worst injury {tone} during {format}. The first caller has already given a play-by-play of the moment from the cheap seats.`, `You never intended to talk about it in public. Now a few thousand people are waiting for your side of it.`],
    choices: [
      { id: 'honest', label: 'Tell the full story, pain included', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.5 }, text: `Your voice stays steady, and the silence on the line says everything. Young wrestlers write in to say they needed to hear it.`, effects: [{ pop: 0.8 }, { conf: 2 }, { fatigue: 3 }, { event: { type: 'podcast', participants: ['host'], summary: 'Talked openly about a career-threatening injury.', data: { quality: { base: 66, charisma: 0.6, noise: 10 }, viral: { minQuality: 84, chance: 0.3 } } } }] },
        { weight: 1, text: `Revisiting the memory costs you more than you expected. You get through the hour but feel hollow afterwards.`, effects: [{ pop: 0.3 }, { conf: -4 }, { fatigue: 6 }] } ] },
      { id: 'play_down', label: 'Play it down and change the subject', risk: 'low', result: `You laugh it off and talk about the comeback. The host takes the hint, though a couple of listeners accuse you of hiding something.`, effects: [{ pop: -0.1 }, { conf: 1 }] },
      { id: 'promote_recovery', label: 'Use the story to promote your recovery plan', risk: 'low', result: `You give out the name of your physio and the routine. A small sponsor reaches out afterwards.`, effects: [{ money: 4000 }, { pop: 0.2 }, { fatigue: 2 }] },
      { id: 'walk_off', label: 'End the segment and ask for a different topic', risk: 'med', result: `The host agrees, but the dead air is awkward and the rest of the episode never quite recovers.`, effects: [{ conf: 2 }, { pop: -0.3 }] },
    ],
  },
  {
    id: 'pod_hot_take_champion', category: 'podcast', title: 'A Hot Take About {champ.name}', weight: 2, cooldownDays: 70, maxPerCareer: 5,
    cast: { champ: { pick: 'champion', class: 'world' }, host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 2008, holdsTitle: false, stat: { popularity: { gte: 40 } } },
    slots: { show: ['a prediction special', 'a rapid-fire hot-takes episode', 'a pre-show betting segment', 'a live fan Q&A'], angle: ['a clean win', 'a bloody upset', 'a finish nobody sees coming', 'a count-out controversy'] },
    body: [`On {show}, {host.name} asks you point-blank about {champ.name}, the current champion. The last question of the hour is whether you could take the title, and how it would end: {angle}?`, `Whatever you say, {champ.first} will see the clip before breakfast. Your answer also gets stored for a later day, when someone will ask you how it turned out.`],
    choices: [
      { id: 'predict_win', label: 'Predict a win over {champ.first} and name a date', risk: 'high', result: `A confident, specific prediction. The fans love the nerve, {champ.first} bristles, and now you have to deliver.`, effects: [{ promise: { kind: 'win_match', who: 'champ', text: 'I will beat {champ.name}', deadlineDays: 90 } }, { pop: 0.8 }, { conf: 2 }, { rel: { who: 'champ', heat: 8 } }, { event: { type: 'podcast', participants: ['host', 'champ'], summary: 'Predicted a win over {champ.name} on a podcast.', data: { quality: { base: 64, mic: 0.5, noise: 12 }, viral: { minQuality: 84, chance: 0.4 } } } }] },
      { id: 'predict_title', label: 'Promise to take the world title this year', risk: 'high', result: `A grander promise than anyone expected. The audience lights up, and the booker adds a note to a file.`, effects: [{ promise: { kind: 'win_title', who: 'champ', text: 'I will win the world title', deadlineDays: 200 } }, { pop: 1.0 }, { conf: 3 }, { rel: { who: 'champ', heat: 10 } }] },
      { id: 'praise', label: 'Praise {champ.first} and call it a fair fight', risk: 'low', result: `A gracious, balanced answer. {champ.first} sends a note of thanks, and the segment fades quickly.`, effects: [{ rel: { who: 'champ', respect: 4 } }, { pop: 0.1 }, { conf: -1 }] },
      { id: 'dodge', label: 'Refuse to predict and talk about the work instead', risk: 'low', result: `You play the long game. The host groans, but several people on the call like that you did not make empty noise.`, effects: [{ conf: 1 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'pod_rival_attack', category: 'podcast', title: '{rival.name} Goes After You on Air', weight: 2.5, cooldownDays: 60, maxPerCareer: 5,
    cast: { rival: { pick: 'rivalry', minHeat: 30 }, host: { pick: 'media', kind: 'host' } },
    memory: { role: 'rival', max: 1 },
    trigger: { minYear: 2012, stat: { popularity: { gte: 25 }, careerYears: { gte: 0.5 } } },
    slots: { claim: ['you have been coasting for months', 'your best match was a fluke', 'you owe the locker room an apology', 'you only got the spot because of a favour'], clip: ['an unedited rant', 'a polished eight-minute cold open', 'a late-night live stream', 'a guest appearance on a friendly podcast'] },
    body: [`{rival.name} used {clip} to tell the world that {claim}. {host.name} gave it a full segment, so the episode has been downloaded tens of thousands of times in a day, and your phone is full of people asking whether you saw it.`, `{rival.first} is clearly pleased with the reaction. A reply from you, or the lack of one, becomes part of the story.`],
    choices: [
      { id: 'counter_stream', label: 'Answer back on your own channel tonight', risk: 'med', outcomes: [
        { weight: 3, bonus: { mic: 0.7 }, text: `You rebut every point with calm precision, and a few jokes. By midnight the replies are firmly on your side.`, effects: [{ pop: 0.9 }, { rivalry: { who: 'rival', heat: 8 } }, { conf: 3 }, { fatigue: 4 }, { event: { type: 'social_post', participants: ['rival'], summary: 'Answered {rival.name}\'s podcast attack.', data: { quality: { base: 66, mic: 0.6, noise: 12 }, viral: { minQuality: 82, chance: 0.45 } } } }] },
        { weight: 2, text: `Your reply comes out rushed and emotional, and it hands {rival.first} another episode's worth of material.`, effects: [{ pop: -0.3 }, { rivalry: { who: 'rival', heat: 8 } }, { conf: -3 }, { fatigue: 4 }] } ] },
      { id: 'guest_their_rival', label: 'Take a guest slot on a friendlier show', risk: 'med', result: `You book a guest slot on a show with a different audience and make your case in front of a friendlier room. It splits the crowd into camps.`, effects: [{ pop: 0.5 }, { rivalry: { who: 'rival', heat: 12 } }, { rel: { who: 'rival', heat: 8 } }, { fatigue: 4 }] },
      { id: 'settle_in_ring', label: 'Challenge {rival.first} to settle it in the ring', risk: 'high', result: `You skip the keyboard war and send word to the booking office. The challenge is accepted within the hour.`, effects: [{ booking: { who: 'rival', type: 'singles' } }, { rivalry: { who: 'rival', heat: 14 } }, { pop: 0.5 }, { fatigue: 5 }] },
      { id: 'ignore', label: 'Ignore it and let the work speak', risk: 'low', result: `You post nothing. Some say you rose above it, others say you were silenced.`, effects: [{ conf: -2 }, { pop: -0.1 }, { rel: { who: 'rival', respect: -2 } }] },
    ],
  },
  {
    id: 'pod_listener_calls', category: 'podcast', title: 'Listener Calls Open the Lines', weight: 1.5, cooldownDays: 80, maxPerCareer: 4,
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 2012, stat: { popularity: { gte: 35 } } },
    slots: { caller: ['a teenager who skipped school', 'an angry long-time season-ticket holder', 'a retired schoolteacher', 'a drunk but harmless regular'], ask: ['why you changed your style', 'whether you are overpaid', 'if the business is rigged', 'what you would say to your younger self'] },
    body: [`The last twenty minutes of the taping are open lines, and {host.name} puts {caller} on the air. The question is {ask}, and the caller has been waiting for a very long time.`, `The producer in the glass gives you a thumbs-up and a look that says: be careful, this one is live.`],
    choices: [
      { id: 'be_real', label: 'Answer from the heart, without spin', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.6 }, text: `You speak to the caller as a person, not a fan. The line goes quiet, and the host thanks you for it twice.`, effects: [{ pop: 0.7 }, { conf: 2 }, { event: { type: 'podcast', participants: ['host'], summary: 'Gave a heartfelt answer to a caller.', data: { quality: { base: 66, charisma: 0.6, noise: 10 }, viral: { minQuality: 84, chance: 0.25 } } } }] },
        { weight: 1, text: `You say more than you meant to, and the clip finds its way to forums with the worst possible caption.`, effects: [{ pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'banter', label: 'Joke with the caller and keep it light', risk: 'low', result: `Everyone laughs. The call is a nice moment and a forgettable one.`, effects: [{ pop: 0.3 }, { conf: 1 }] },
      { id: 'push_back', label: 'Push back on the caller\'s assumption', risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.6 }, text: `You make a good point firmly, and the switchboard lights up with people who agree.`, effects: [{ pop: 0.6 }, { conf: 3 }] },
        { weight: 2, text: `The caller hangs up on you, and the host lets the silence hang for a beat too long.`, effects: [{ pop: -0.5 }, { conf: -3 }] } ] },
      { id: 'cut_call', label: 'Ask the host to take the next caller', risk: 'low', result: `The host does, smoothly, but you can hear the audience mutter in the room.`, effects: [{ pop: -0.2 }, { conf: -1 }] },
    ],
  },
  {
    id: 'pod_early_clip', category: 'podcast', title: 'A Clip From Your Early Days', weight: 1.2, cooldownDays: 150, maxPerCareer: 2,
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 2008, stat: { careerYears: { gte: 3 }, popularity: { gte: 40 } } },
    slots: { clip: ['a cringe-worthy first promo', 'an awkward ring entrance', 'a match where nothing went right', 'a half-hearted mic stumble'], reaction: ['plays it on air', 'dissects it frame by frame', 'puts it on a social feed', 'plays it for a studio audience'] },
    body: [`{host.name} has found {clip} from your first years and {reaction}. It is rougher than you remember, and the laughter in the room is not unkind.`, `You have grown a lot since then. The question is whether you want to say so, or let the footage speak for itself.`],
    choices: [
      { id: 'laugh', label: 'Laugh along and roast your younger self', risk: 'low', result: `You take the footage apart yourself, line by line. The audience appreciates a wrestler with no fear of the past.`, effects: [{ pop: 0.5 }, { conf: 2 }] },
      { id: 'teach', label: 'Use it to show how far you have come', risk: 'med', outcomes: [
        { weight: 3, bonus: { mic: 0.4, charisma: 0.4 }, text: `You walk through each mistake and what it taught you. The segment becomes a favourite among younger talent.`, effects: [{ pop: 0.6 }, { conf: 3 }, { event: { type: 'podcast', participants: ['host'], summary: 'Reflected on early-career mistakes.', data: { quality: { base: 64, mic: 0.4, charisma: 0.4, noise: 10 } } } }] },
        { weight: 1, text: `It turns into a lecture, and the host is forced to cut it short.`, effects: [{ pop: -0.1 }, { conf: -1 }] } ] },
      { id: 'angry', label: 'Demand the host stop playing it', risk: 'med', result: `The host agrees and apologises, but the drop in warmth in the room is noticeable.`, effects: [{ conf: -2 }, { pop: -0.4 }] },
      { id: 'sell_nostalgia', label: 'Offer a personal commentary track for a fee', risk: 'low', result: `The host loves the idea, and the commentary is released as a paid bonus. A bit of cash and a small loss of dignity.`, effects: [{ money: 3500 }, { conf: -1 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'pod_guest_cohost', category: 'podcast', title: 'A Seat at the Mic for a Week', weight: 1.2, cooldownDays: 140, maxPerCareer: 2,
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 2010, stat: { mic: { gte: 50 }, popularity: { gte: 45 } } },
    slots: { show: ['a hugely popular wrestling talk show', 'a fresh startup show', 'a sports-comedy hybrid', 'a veteran-run history show'], terms: ['a one-off guest slot', 'a week of guest-hosting', 'a recurring monthly segment', 'a deal to co-host a live special'] },
    body: [`{host.name} wants you to take the chair on {show}. The offer is {terms}, with a short list of topics and no script.`, `A host's chair is more exposed than a guest's, because you steer the questions and you own the silence. You also get to say what you actually think.`],
    choices: [
      { id: 'take_it', label: 'Take the chair and prepare thoroughly', risk: 'med', outcomes: [
        { weight: 3, bonus: { mic: 0.7 }, text: `You ask smart questions, stay out of the way and let the stories breathe. Subscribers spike.`, effects: [{ pop: 0.8 }, { conf: 3 }, { fatigue: 8 }, { money: 4000 }, { event: { type: 'podcast', participants: ['host'], summary: 'Guest-hosted a wrestling podcast.', data: { quality: { base: 66, mic: 0.7, charisma: 0.2, noise: 10 }, viral: { minQuality: 86, chance: 0.3 } } } }] },
        { weight: 1, text: `You talk over a guest, forget the next topic and spend thirty seconds on a story that has no end. The edit cuts most of it, but not all.`, effects: [{ pop: -0.3 }, { conf: -3 }, { fatigue: 8 }, { money: 4000 }] } ] },
      { id: 'condition_it', label: 'Take it, but with editorial control', risk: 'med', result: `The host agrees to a few ground rules and a final cut. The show feels a little less raw, but your reputation is protected.`, effects: [{ pop: 0.4 }, { conf: 2 }, { fatigue: 6 }, { money: 2000 }] },
      { id: 'one_guest', label: 'Decline hosting but offer a long guest interview', risk: 'low', result: `The host accepts the compromise. An hour of good conversation and no pressure.`, effects: [{ pop: 0.3 }, { fatigue: 3 }] },
      { id: 'pass', label: 'Pass and keep your schedule clear', risk: 'low', result: `You protect your time and rest. The slot goes to a rival with a louder voice.`, effects: [{ fatigue: -8 }, { pop: -0.3 }] },
    ],
  },
  {
    id: 'pod_backstage_gossip', category: 'podcast', title: 'The Host Wants Locker-Room Secrets', weight: 1.5, cooldownDays: 90, maxPerCareer: 4,
    cast: { host: { pick: 'media', kind: 'host' }, peer: { pick: 'roster', tier: { gte: 1 } } },
    trigger: { minYear: 2010, stat: { popularity: { gte: 40 } } },
    slots: { rumour: ['a rumoured argument with a producer', 'who gets the best locker-room spot', 'a heated meeting about pay', 'a prank that went too far'], show: ['a gossip-heavy show', 'a late-night call-in program', 'a rowdy streaming panel', 'a quiet one-on-one conversation'] },
    body: [`On {show}, {host.name} pushes you for details on {rumour}. The story has {peer.name}'s name attached, and {host.first} knows you were in the room.`, `The audience loves a leak. The locker room, however, has long memories and no sense of humour about betrayals.`],
    choices: [
      { id: 'spill', label: 'Give them the story, names included', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The tale is so well told that the audience forgives you for telling it. The episode is a smash, and {peer.first} is furious.`, effects: [{ pop: 0.9 }, { rel: { who: 'peer', trust: -10, heat: 10 } }, { event: { type: 'podcast', participants: ['host', 'peer'], summary: 'Leaked locker-room gossip on a podcast.', data: { quality: { base: 64, charisma: 0.4, noise: 12 }, controversy: true, viral: { minQuality: 82, chance: 0.4 } } } }] },
        { weight: 1, text: `The version you tell gets distorted in the edit. {peer.first} thinks you made it worse on purpose.`, effects: [{ pop: 0.3 }, { rel: { who: 'peer', trust: -14, heat: 14 } }, { conf: -3 }] } ] },
      { id: 'general', label: 'Tell the story without naming anyone', risk: 'med', result: `You keep the details vague and the lessons clear. {peer.first} appreciates the discretion, and the host is only mildly disappointed.`, effects: [{ pop: 0.3 }, { rel: { who: 'peer', trust: 3 } }] },
      { id: 'shut_down', label: 'Shut it down: what happens backstage stays there', risk: 'low', result: `The host sulks but understands. In the locker room, word gets around that you can be trusted.`, effects: [{ rel: { who: 'peer', trust: 6, respect: 3 } }, { pop: -0.2 }] },
      { id: 'warn_peer', label: 'Warn {peer.first} that the question is coming', risk: 'low', result: `You send a heads-up. {peer.first} thanks you, and the two of you agree on a version that is boring but safe.`, effects: [{ rel: { who: 'peer', trust: 5, affinity: 3 } }, { pop: -0.1 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'pod_dream_match', category: 'podcast', title: 'Name Your Dream Match', weight: 1.2, cooldownDays: 110, maxPerCareer: 3,
    cast: { host: { pick: 'media', kind: 'host' }, dream: { pick: 'roster', tier: { gte: 3 } } },
    trigger: { minYear: 2008, stat: { popularity: { gte: 40 } } },
    slots: { show: ['a legends-of-the-ring special', 'a modern-era roundtable', 'a fantasy booking episode', 'a podcast for lapsed fans'], stakes: ['in a stadium show', 'in a title match', 'in a hardcore bout', 'in a grudge rematch'] },
    body: [`On {show}, {host.name} asks you to name one match you would give anything to have, and the producer slides a card across the desk with {dream.name}'s face on it. They mean {stakes}, and the audience wants an answer.`, `Wrestlers are encouraged to dream big on air. Management has been known to listen.`],
    choices: [
      { id: 'name_dream', label: 'Name {dream.first} and make your case', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5 }, text: `Your pitch is vivid and specific, and {dream.first} hears it with obvious interest. Fans start posting mock-ups.`, effects: [{ pop: 0.6 }, { rel: { who: 'dream', respect: 4 } }, { conf: 2 }] },
        { weight: 1, text: `{dream.first} hears it as a stunt and says so in an interview. You are left looking naive.`, effects: [{ pop: -0.2 }, { rel: { who: 'dream', respect: -3 } }, { conf: -2 }] } ] },
      { id: 'pick_someone_else', label: 'Pick a deeper cut that shows your taste', risk: 'low', result: `Your choice is unexpected and well argued. The host loves it, and historians in the comments thank you.`, effects: [{ pop: 0.3 }, { conf: 1 }] },
      { id: 'call_out', label: 'Call out {dream.first} and demand it', risk: 'high', result: `You make the challenge public and specific. Fans cheer the nerve, and {dream.first} has to answer.`, effects: [{ pop: 0.8 }, { rivalry: { who: 'dream', heat: 12 } }, { rel: { who: 'dream', heat: 8 } }, { fatigue: 3 }] },
      { id: 'say_present', label: 'Say the best match is the one you have tomorrow', risk: 'low', result: `Humble and annoying in equal parts. The host marks it as a missed opportunity.`, effects: [{ conf: 1 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'pod_live_taping', category: 'podcast', title: 'A Live Taping With a Loud Crowd', weight: 1.2, cooldownDays: 100, maxPerCareer: 3,
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 2012, stat: { popularity: { gte: 45 }, mic: { gte: 45 } } },
    slots: { venue: ['a packed comedy club', 'a convention hotel ballroom', 'an old theatre', 'a brewery taproom'], crowd: ['rowdy and drunk', 'respectful and quiet', 'divided between fans and rivals', 'full of children and parents'] },
    body: [`{host.name} has set up a live taping in {venue}, with a crowd that is {crowd}. The planning sheet calls for a half-hour of conversation and fifteen minutes of questions.`, `Nothing is rehearsed and nobody has a script. The room is yours if you want it.`],
    choices: [
      { id: 'work_room', label: 'Work the crowd like it is a ring entrance', risk: 'med', outcomes: [
        { weight: 3, bonus: { mic: 0.6, charisma: 0.4 }, text: `By the ten-minute mark you have the room eating from your hand. The host barely has to speak.`, effects: [{ pop: 1.0 }, { conf: 3 }, { fatigue: 6 }, { event: { type: 'podcast', participants: ['host'], summary: 'Owned a live podcast taping.', data: { quality: { base: 68, mic: 0.6, charisma: 0.4, noise: 10 }, viral: { minQuality: 85, chance: 0.4 } } } }] },
        { weight: 1, text: `A heckler throws you off your rhythm, and for several minutes you are fighting for the microphone.`, effects: [{ pop: -0.2 }, { conf: -3 }, { fatigue: 6 }] } ] },
      { id: 'storytelling', label: 'Stay seated and tell quiet, long stories', risk: 'low', result: `A warm and intimate hour. The people in the room remember it, though the recording is mostly forgotten.`, effects: [{ pop: 0.3 }, { conf: 1 }, { fatigue: 3 }] },
      { id: 'dare_heckler', label: 'Invite the loudest heckler on stage', risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.7 }, text: `You win the exchange with grace and one perfect one-liner. The crowd gives you a standing ovation.`, effects: [{ pop: 1.1 }, { conf: 4 }, { fatigue: 5 }] },
        { weight: 2, text: `The heckler is better than expected. The bit runs away from you, and you leave without winning anything.`, effects: [{ pop: -0.5 }, { conf: -4 }, { fatigue: 5 }] } ] },
      { id: 'cut_short', label: 'Cut the Q&A and sign autographs instead', risk: 'low', result: `The crowd is slightly disappointed, but the line to meet you is long and happy.`, effects: [{ pop: 0.2 }, { fatigue: 4 }, { conf: -1 }] },
    ],
  },
  {
    id: 'pod_toll_of_travel', category: 'podcast', title: 'What the Road Takes Out of You', weight: 1.5, cooldownDays: 100, maxPerCareer: 3,
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 2010, stat: { fatigue: { gte: 50 } } },
    slots: { show: ['a long-form interview', 'a health-themed podcast', 'a friendly morning show', 'a documentary podcast series'], topic: ['the travel schedule', 'time away from family', 'the constant injuries', 'the pressure of being "on" all the time'] },
    body: [`{host.name} on {show} asks you something no one usually does: what does {topic} actually cost? It is not an attack, and you can tell the host genuinely wants to know.`, `You are tired in a way that no amount of sleep touches. The honest answer is probably not the one that sells tickets.`],
    choices: [
      { id: 'honest', label: 'Give the honest answer, wounds and all', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.5 }, text: `The conversation turns real and gentle. Fans write that they never saw the human side, and a trainer calls to check in.`, effects: [{ pop: 0.7 }, { conf: 2 }, { fatigue: -6 }, { event: { type: 'podcast', participants: ['host'], summary: 'Spoke openly about the toll of the schedule.', data: { quality: { base: 66, charisma: 0.5, noise: 10 }, viral: { minQuality: 85, chance: 0.2 } } } }] },
        { weight: 1, text: `A quote about being worn out is clipped and used by a rival to suggest you are done.`, effects: [{ pop: -0.3 }, { conf: -3 }, { fatigue: -3 }] } ] },
      { id: 'tough_guy', label: 'Play the tough guy and say you love every mile', risk: 'low', result: `You perform the part well. The host smiles politely, and your body does not believe a word.`, effects: [{ conf: 1 }, { fatigue: 4 }, { pop: 0.2 }] },
      { id: 'ask_for_time', label: 'Say publicly you need a lighter schedule', risk: 'high', result: `The remark reaches the office faster than you expected. They respect it, and they also take note.`, effects: [{ fatigue: -14 }, { conf: 2 }, { pop: -0.2 }] },
      { id: 'change_topic', label: 'Laugh it off and move to the next question', risk: 'low', result: `You deflect the question with a joke. The audience never sees the tiredness, and neither do you.`, effects: [{ fatigue: 3 }, { conf: -1 }] },
    ],
  },
  {
    id: 'pod_pay_question', category: 'podcast', title: 'Are You Getting Paid What You Are Worth?', weight: 1.5, cooldownDays: 120, maxPerCareer: 3,
    cast: { host: { pick: 'media', kind: 'host' }, exec: { pick: 'staff', role: 'executive' } },
    trigger: { minYear: 2010, contract: { lte: 150 }, stat: { popularity: { gte: 45 } } },
    slots: { show: ['a business-of-wrestling show', 'a fan-run weekly', 'a financial-news podcast', 'a talk show hosted by a former wrestler'], figure: ['a comparison with a rival\'s salary', 'a leaked pay chart', 'a poll of the fans', 'a number floated by an anonymous source'] },
    body: [`{host.name} on {show} opens the episode with {figure}, and then asks whether you think you are being paid fairly. {exec.name} from the front office is certain to hear it.`, `Your contract is closer to its end than to its start. Anything you say will either help you at the table or get you locked out of it.`],
    choices: [
      { id: 'demand', label: 'State clearly that you deserve more', risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.4, confidence: 0.4 }, text: `Calm, factual, without bitterness. Fans take your side, and the front office senses a negotiation coming.`, effects: [{ pop: 0.6 }, { conf: 3 }, { event: { type: 'podcast', participants: ['host'], summary: 'Publicly argued for a higher salary.', data: { quality: { base: 62, mic: 0.4, conf: 0.3, noise: 12 }, controversy: true } } }] },
        { weight: 2, text: `The remark is seen as ungrateful. {exec.first} calls it a breach of trust, and your next booking is a notch below where it should be.`, effects: [{ pop: -0.2 }, { conf: -3 }, { money: -3000 }] } ] },
      { id: 'grateful', label: 'Say you are grateful and keep talks private', risk: 'low', result: `A sound, professional answer. The front office appreciates it, and your agent mutters about leaving leverage on the table.`, effects: [{ pop: 0.1 }, { conf: -1 }] },
      { id: 'tease_other_offers', label: 'Hint that other companies have approached you', risk: 'high', result: `You never name anyone, which makes it more effective. The office hears it as a warning shot, and the fans love the drama.`, effects: [{ pop: 0.7 }, { conf: 2 }, { fatigue: 2 }, { money: -2000 }] },
      { id: 'talk_value', label: 'Talk about value to the fans, not about money', risk: 'med', result: `A smart pivot, and the audience warms to it. You win the room but not the argument.`, effects: [{ pop: 0.4 }, { conf: 1 }] },
    ],
  },
  // ============================================================== PRESS
  {
    id: 'prs_gotcha_question', category: 'press', title: 'A Gotcha Question at the Podium', weight: 2, cooldownDays: 70, maxPerCareer: 5,
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { stat: { popularity: { gte: 40 } } },
    slots: { event: ['a title-match announcement', 'a pre-show media day', 'a tour kickoff', 'a sponsor unveiling'], question: ['a rumour you were about to be released', 'whether you are the booker\'s favourite', 'a comment you made months ago that has aged badly', 'whether the champion is better than you'] },
    body: [`The press room after {event} is full, and {reporter.name} waits until the last question to ask about {question}. The camera operators turn toward you at the same moment.`, `A friendly answer is expected. A real answer, on the record, is what makes the clip.`],
    choices: [
      { id: 'straight', label: 'Answer straight and take the heat', risk: 'med', effects: [{ fatigue: 4 }], outcomes: [
        { weight: 3, bonus: { mic: 0.5, confidence: 0.4 }, text: `You do not blink and you do not hide. The reporters scribble, and a producer in the back nods approvingly.`, effects: [{ pop: 0.6 }, { conf: 3 }, { event: { type: 'press_conference', participants: ['reporter'], summary: 'Took a gotcha question head-on at a press conference.', data: { quality: { base: 64, mic: 0.5, conf: 0.4, noise: 10 }, handled: true, viral: { minQuality: 86, chance: 0.3 } } } }] },
        { weight: 1, text: `Your answer is honest and a little too long. A single sentence is cut out and made into a headline.`, effects: [{ pop: -0.4 }, { conf: -3 }, { event: { type: 'press_conference', participants: ['reporter'], summary: 'Fumbled a gotcha question at a press conference.', data: { quality: { base: 40, mic: 0.3, noise: 10 }, controversy: true } } }] } ] },
      { id: 'flip', label: 'Flip it around and ask the reporter a question', risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.7, charisma: 0.4 }, text: `The room laughs, {reporter.first} laughs hardest, and the question vanishes into the noise. You look sharper than the people asking.`, effects: [{ pop: 0.9 }, { conf: 3 }] },
        { weight: 2, text: `It looks like a dodge. {reporter.first} repeats the question, slower, and the silence that follows is deafening.`, effects: [{ pop: -0.6 }, { conf: -4 }] } ] },
      { id: 'script', label: 'Fall back on your prepared talking points', risk: 'low', result: `You recite the approved lines. Nobody can quote you, and nobody believes you either.`, effects: [{ pop: -0.1 }, { conf: -1 }] },
      { id: 'walk', label: 'End the conference and walk out', risk: 'med', result: `The cameras follow you to the door. It becomes the story, and your agent will have to clean it up.`, effects: [{ pop: 0.1 }, { conf: -2 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'prs_pre_ple_media_day', category: 'press', title: 'Media Day Before the Big Show', weight: 2, cooldownDays: 60, maxPerCareer: 6, contexts: ['weekly'],
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { eventWithin: { kind: 'ple', days: 10 }, minYear: 2014, stat: { popularity: { gte: 35 } } },
    slots: { mood: ['a loud and rowdy', 'a polished and corporate', 'a tense and quiet', 'a chaotic multi-city'], focus: ['your hunger', 'your health', 'your odds', 'your feud'] },
    body: [`It is {mood} media day, and {reporter.name} has the first slot at your table. The theme of the questions is {focus}, with the next show only days away.`, `You have six interviews to survive before lunch. What you say in the first will echo in the last.`],
    choices: [
      { id: 'consistent', label: 'Deliver the same strong message in every room', risk: 'low', result: `Disciplined and a little dull, but the story you wanted gets out cleanly. The staff note that you are easy to work with.`, effects: [{ pop: 0.5 }, { fatigue: 7 }, { conf: 1 }] },
      { id: 'tailor', label: 'Tailor a different angle for each outlet', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.5, mic: 0.4 }, text: `Each reporter walks away with a fresh quote. By lunch you are everywhere without repeating yourself.`, effects: [{ pop: 1.0 }, { fatigue: 10 }, { conf: 2 }, { event: { type: 'press_conference', participants: ['reporter'], summary: 'Worked media day with a fresh angle for every outlet.', data: { quality: { base: 66, mic: 0.5, charisma: 0.3, noise: 10 }, viral: { minQuality: 86, chance: 0.3 } } } }] },
        { weight: 2, text: `A contradiction between two interviews gets flagged by a sharp-eyed blogger, and the story is that you cannot keep your lines straight.`, effects: [{ pop: -0.3 }, { fatigue: 10 }, { conf: -3 }] } ] },
      { id: 'one_big_story', label: 'Save one big announcement for the biggest outlet', risk: 'med', result: `The exclusive gets a loud reaction, and the other outlets are left sulking. Your rivals get a day to react.`, effects: [{ pop: 0.7 }, { fatigue: 6 }, { conf: 1 }] },
      { id: 'skip', label: 'Trim the day and save your voice', risk: 'low', result: `You do three interviews and decline the rest. You are rested for the show, and the coverage is thinner.`, effects: [{ fatigue: -5 }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'prs_contract_rumour', category: 'press', title: 'Reporters Ask About Your Future', weight: 2, cooldownDays: 90, maxPerCareer: 4,
    cast: { reporter: { pick: 'media', kind: 'reporter' }, exec: { pick: 'staff', role: 'executive' } },
    trigger: { contract: { lte: 120 }, stat: { popularity: { gte: 40 } } },
    slots: { rumour: ['a move to a rival company', 'a leave of absence for film work', 'retirement', 'a sudden brand transfer'], outlet: ['a trade newsletter', 'a national paper', 'a broadcast news desk', 'a viral social account'] },
    body: [`{outlet} reports that you are close to {rumour}. {reporter.name} wants a statement from you before it runs, and {exec.name} is expecting you to say nothing at all.`, `Some of it is true, some of it is rumour, and you are the only one who knows which. The story will get written regardless.`],
    choices: [
      { id: 'deny', label: 'Deny it flatly', risk: 'med', outcomes: [
        { weight: 2, text: `The denial holds. {exec.first} is grateful, and the story drops from the news cycle.`, effects: [{ conf: 1 }, { pop: 0.1 }] },
        { weight: 1, text: `The report turns out to be partly right. Denying it costs you credibility with the outlet and the office.`, effects: [{ pop: -0.5 }, { conf: -3 }] } ] },
      { id: 'tease', label: 'Neither confirm nor deny, and enjoy the leverage', risk: 'high', result: `You smile and say "ask my agent". The leverage in your contract talks grows, and so does the tension in the front office.`, effects: [{ pop: 0.5 }, { conf: 2 }, { money: -2000 }] },
      { id: 'commit_here', label: 'Declare your loyalty to the company', risk: 'low', result: `A clean statement that suits everyone except your bargaining position. {exec.first} is delighted, and the fans cheer.`, effects: [{ pop: 0.4 }, { conf: -1 }, { money: -3000 }] },
      { id: 'no_comment', label: 'Decline to comment at all', risk: 'low', result: `Safe and bland. The story runs as speculation and gets more oxygen than you wanted.`, effects: [{ pop: -0.1 }, { conf: -1 }] },
    ],
  },
  {
    id: 'prs_injury_status', category: 'press', title: 'When Are You Coming Back?', weight: 2, cooldownDays: 60, maxPerCareer: 5,
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { injured: true },
    slots: { place: ['outside the rehab clinic', 'at an autograph signing', 'on a live stream', 'in the arena parking lot'], pressure: ['a sponsor hoping for a return date', 'a fan petition', 'a rumour that you are done', 'a rival mocking your absence'] },
    body: [`{reporter.name} catches you {place} with the question that is on every message board: when are you coming back? There is {pressure} behind the question, and you know it.`, `The honest answer is that your body will decide. The convenient answer is whatever sells tickets.`],
    choices: [
      { id: 'honest', label: 'Be honest: no date, and no rushing it', risk: 'low', result: `The reporter accepts it, and fans leave supportive comments. The doctors are quietly pleased.`, effects: [{ pop: 0.3 }, { conf: 1 }, { fatigue: -4 }] },
      { id: 'early_date', label: 'Name an early date to excite the fans', risk: 'high', result: `The crowd erupts. You have given yourself a deadline, and your physio does not look happy.`, effects: [{ pop: 0.9 }, { conf: 2 }, { fatigue: 8 }, { promise: { kind: 'win_match', text: 'I will be back by the next big show', deadlineDays: 60 } }] },
      { id: 'show_rehab', label: 'Invite the cameras into rehab', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.4 }, text: `The footage of you grinding through drills is more moving than any press release. Fans share it for days.`, effects: [{ pop: 0.7 }, { conf: 2 }, { fatigue: 5 }] },
        { weight: 1, text: `A bad day on camera makes it look like you are struggling. Your rivals pounce.`, effects: [{ pop: -0.2 }, { conf: -3 }, { fatigue: 5 }] } ] },
      { id: 'private', label: 'Say nothing and recover in private', risk: 'low', result: `Radio silence. The rumour mill runs on its own, but nobody can prove it wrong.`, effects: [{ pop: -0.3 }, { fatigue: -6 }] },
    ],
  },
  {
    id: 'prs_apology_tour', category: 'press', title: 'The Apology Tour Decision', weight: 3, cooldownDays: 60, maxPerCareer: 4, major: true,
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { flag: 'apology_pending' },
    slots: { mode: ['a live TV interview', 'a written statement', 'a sit-down video', 'a press-room appearance'], pressure: ['a sponsor demanding a statement', 'a stack of angry messages', 'a quiet word from a veteran', 'a front-office memo'] },
    body: [`The fallout from what you posted refuses to die down. {reporter.name} is offering {mode}, and there is {pressure} on your desk.`, `You can say sorry and mean it, say sorry and not mean it, or dig in. Each has its own cost.`],
    choices: [
      { id: 'sincere', label: 'Apologise sincerely and take the consequences', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.5, mic: 0.4 }, text: `No excuses, no spin. The apology is simple and it lands. By the weekend the story has moved on.`, effects: [{ pop: 0.4 }, { conf: -1 }, { clearFlag: 'apology_pending' }, { event: { type: 'interview', participants: ['reporter'], summary: 'Gave a sincere public apology.', data: { quality: { base: 64, mic: 0.4, charisma: 0.5, noise: 10 }, handled: true } } }] },
        { weight: 1, text: `You stumble through it, and the sincerity does not read. A few people call it forced.`, effects: [{ pop: -0.2 }, { conf: -3 }, { clearFlag: 'apology_pending' }] } ] },
      { id: 'non_apology', label: 'Issue a carefully worded non-apology', risk: 'low', result: `"If anyone was offended". The lawyers love it. The critics do not, and the story continues quietly.`, effects: [{ pop: -0.4 }, { conf: -2 }, { clearFlag: 'apology_pending' }] },
      { id: 'double_down', label: 'Refuse to apologise and stand by it', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: `Your supporters rally and the story turns into a culture-war talking point. You lose a sponsor and gain a fan base.`, effects: [{ pop: 0.9 }, { money: -4000 }, { conf: 3 }, { clearFlag: 'apology_pending' }, { event: { type: 'press_conference', participants: ['reporter'], summary: 'Refused to apologise for a controversial post.', data: { quality: { base: 58, mic: 0.4, noise: 14 }, controversy: true } } }] },
        { weight: 2, text: `Nobody rallies. The silence is read as arrogance, and a promoter cancels your appearance.`, effects: [{ pop: -0.9 }, { money: -5000 }, { conf: -3 }, { clearFlag: 'apology_pending' }] } ] },
      { id: 'quiet_charity', label: 'Let your actions speak: donate and say little', risk: 'low', result: `A donation, a short note and no cameras. It works slowly, and the money does not come back.`, effects: [{ money: -8000 }, { pop: 0.3 }, { conf: 1 }, { clearFlag: 'apology_pending' }] },
    ],
  },
  {
    id: 'prs_title_win_presser', category: 'press', title: 'The Post-Win Press Conference', weight: 3, cooldownDays: 45, maxPerCareer: 5,
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { holdsTitle: true, stat: { daysChampion: { lte: 14 } } },
    slots: { room: ['a hotel ballroom', 'a packed arena press room', 'the arena concourse', 'a studio with a gold backdrop'], first_question: ['how it feels', 'who you want to face first', 'what you will change', 'what you said to your family'] },
    body: [`You walk into {room} with the belt over your shoulder, and the cameras take a full ten seconds to settle. {reporter.name} asks the first question: {first_question}?`, `The moment will be replayed for years, so you want to say the right thing. Most of the words you rehearsed have vanished.`],
    choices: [
      { id: 'emotional', label: 'Speak from the heart and thank everyone', risk: 'low', result: `Your voice wavers, and the crowd of reporters goes quiet. It is the most human moment of the night.`, effects: [{ pop: 0.7 }, { conf: 3 }, { event: { type: 'press_conference', participants: ['reporter'], summary: 'Gave an emotional title-win press conference.', data: { quality: { base: 68, charisma: 0.5, noise: 8 }, viral: { minQuality: 86, chance: 0.25 } } } }] },
      { id: 'challenge_all', label: 'Throw down an open challenge to all comers', risk: 'high', result: `The line gets the biggest cheer of the day. Every contender in the building has just been put on notice.`, effects: [{ pop: 0.9 }, { conf: 3 }, { fatigue: 4 }, { promise: { kind: 'retain_title', text: 'I will defend this title against anyone', params: { defenses: 2 }, deadlineDays: 100 } }] },
      { id: 'business', label: 'Stay cool and talk business', risk: 'low', result: `You answer crisply and move on. The reporters respect the control, but the clip will not be replayed.`, effects: [{ pop: 0.3 }, { conf: 1 }] },
      { id: 'dedicate', label: 'Dedicate the win to the fans who doubted you', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5 }, text: `You name the critics without naming them, and the moment crackles. The crowd chants your name.`, effects: [{ pop: 1.0 }, { conf: 3 }] },
        { weight: 1, text: `It comes across as sour on the biggest night of your career, and the headline picks out one sentence.`, effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
    ],
  },
  {
    id: 'prs_post_loss_scrum', category: 'press', title: 'The Scrum After a Hard Night', weight: 2, cooldownDays: 60, maxPerCareer: 5, contexts: ['post_show', 'weekly'],
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { recent: { lossesGte: 2 }, stat: { popularity: { gte: 35 } } },
    slots: { mood: ['grim', 'raw', 'weary', 'a little angry'], cause: ['a bad finish', 'an interference spot', 'a stumble in the third act', 'a sloppy near-fall'] },
    body: [`The locker-room door opens on a {mood} scene, and {reporter.name} is in the hallway with a recorder. The question is about {cause}, and two more outlets are close behind.`, `You are still in your gear and your ears are ringing. You could say a lot of things, and most of them are mistakes.`],
    choices: [
      { id: 'own_loss', label: 'Own the loss and give the winner credit', risk: 'low', result: `Class. The reporters respect it, and it makes the winner look better without making you look smaller.`, effects: [{ pop: 0.3 }, { conf: -1 }, { event: { type: 'interview', participants: ['reporter'], summary: 'Gave an honest post-loss interview.', data: { quality: { base: 62, mic: 0.3, charisma: 0.3, noise: 10 }, handled: true } } }] },
      { id: 'excuse', label: 'Blame the circumstances', risk: 'med', result: `The excuse comes easily and reads badly. It buys some sympathy and costs some respect.`, effects: [{ pop: -0.3 }, { conf: 1 }] },
      { id: 'vow_revenge', label: 'Vow to make it right next time', risk: 'high', result: `Your voice is hoarse and fierce. The promise gets quoted all week, and it will be judged just as often.`, effects: [{ promise: { kind: 'win_match', text: 'I will make this right next time', deadlineDays: 30 } }, { pop: 0.6 }, { conf: 2 }] },
      { id: 'brush_past', label: 'Brush past without a word', risk: 'low', result: `The cameras get the back of your head. The photo tells the story better than any quote.`, effects: [{ pop: -0.2 }, { conf: -2 }] },
    ],
  },
  {
    id: 'prs_press_junket', category: 'press', title: 'The Promotional Tour', weight: 1.5, cooldownDays: 140, maxPerCareer: 3,
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { stat: { popularity: { gte: 50 } } },
    slots: { city: ['three cities in four days', 'a week of airport lounges', 'a single marathon day', 'a ten-stop tour'], crowd: ['local TV stations', 'regional newspapers', 'college radio stations', 'morning-show couches'] },
    body: [`The promotional office has booked you for {city}, with stops at {crowd}. {reporter.name} is tagging along for a long-form feature and will see you on your worst day as well as your best.`, `By the third stop you have given the same answers nine times. The best interviews are the ones where you remember to sound surprised.`],
    choices: [
      { id: 'grind', label: 'Grind through every stop with a smile', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.5 }, text: `You keep your energy up and your answers fresh. The crowds of local reporters adore you, and tickets sell faster.`, effects: [{ pop: 1.0 }, { money: 6000 }, { fatigue: 18 }] },
        { weight: 1, text: `You get sick in the middle of the week and finish on fumes. The final two interviews are forgettable.`, effects: [{ pop: 0.3 }, { money: 6000 }, { fatigue: 25 }, { conf: -2 }] } ] },
      { id: 'pick_stops', label: 'Pick the best stops and skip the rest', risk: 'low', result: `The top stops go well, the rest of the tour grumbles, and your voice is intact when the real work begins.`, effects: [{ pop: 0.5 }, { money: 3000 }, { fatigue: 9 }] },
      { id: 'be_edgy', label: 'Use the tour to stir up some controversy', risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.6 }, text: `A pointed quote in the first city sets the tour on fire. Every stop after that is packed with cameras.`, effects: [{ pop: 1.3 }, { fatigue: 15 }, { money: 4000 }, { event: { type: 'press_conference', participants: ['reporter'], summary: 'Stirred up controversy on a press tour.', data: { quality: { base: 62, mic: 0.6, noise: 14 }, controversy: true, viral: { minQuality: 80, chance: 0.4 } } } }] },
        { weight: 1, text: `The controversy gets away from you. The tour is cancelled early, and you are forced into a public clean-up.`, effects: [{ pop: -0.5 }, { fatigue: 10 }, { conf: -3 }] } ] },
      { id: 'send_agent', label: 'Send the substitutes and stay home', risk: 'low', result: `The tour goes ahead without you. You rest, and your absence is noted by the reporters who showed up.`, effects: [{ fatigue: -8 }, { pop: -0.4 }, { money: -2000 }] },
    ],
  },
  {
    id: 'prs_backstage_leak', category: 'press', title: 'A Backstage Leak With Your Name On It', weight: 2, cooldownDays: 90, maxPerCareer: 4,
    cast: { journalist: { pick: 'media', kind: 'journalist' }, boss: { pick: 'staff', role: 'gm' } },
    trigger: { stat: { popularity: { gte: 45 }, careerYears: { gte: 1 } } },
    slots: { story: ['a planned push for you', 'a planned demotion for you', 'a closed-door dispute', 'a surprise main event'], source: ['an anonymous source', 'a paywalled newsletter', 'a "well-placed insider"', 'a late-night forum thread'] },
    body: [`{journalist.name} has run a story about {story}, citing {source}. Half the locker room thinks you are the leak, and {boss.name} wants to see you in the morning.`, `You know you did not do it. Proving that is the problem.`],
    choices: [
      { id: 'meet_boss', label: 'Meet {boss.first} and deny it directly', risk: 'low', result: `A tense twenty minutes in an office. {boss.first} believes you, mostly, and the locker room lets it go.`, effects: [{ conf: 1 }, { fatigue: 2 }] },
      { id: 'call_journalist', label: 'Confront {journalist.first} to find the source', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{journalist.first} gives nothing, but confirms that it was not you. That is enough to clear your name.`, effects: [{ pop: 0.2 }, { conf: 2 }, { fatigue: 3 }] },
        { weight: 2, text: `{journalist.first} runs a follow-up about the pressure you put on the press. You are suddenly the story.`, effects: [{ pop: -0.6 }, { conf: -3 }, { fatigue: 3 }] } ] },
      { id: 'public_statement', label: 'Post a public statement and take no questions', risk: 'med', result: `Short and clear. It satisfies the fans and irritates the office, which would prefer you stayed silent.`, effects: [{ pop: 0.4 }, { conf: 1 }, { fatigue: 2 }] },
      { id: 'lay_low', label: 'Lay low and let the rumour burn out', risk: 'low', result: `Three days of side-eyes in the corridor. Then something bigger happens elsewhere, and the heat moves on.`, effects: [{ conf: -2 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'prs_challenge_champion_presser', category: 'press', title: 'The Moment to Call Out {champ.name}', weight: 2, cooldownDays: 80, maxPerCareer: 4,
    cast: { champ: { pick: 'champion', class: 'world' }, reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { holdsTitle: false, stat: { popularity: { gte: 50 }, wins: { gte: 10 } } },
    slots: { setting: ['a televised press conference', 'a media-day scrum', 'a pre-show press line', 'a live town-hall'], tone: ['calmly', 'with a smirk', 'with fire in your voice', 'with clinical precision'] },
    body: [`The champion, {champ.name}, is two seats away at {setting}, and {reporter.name} asks if anyone in the room thinks they can take the title. All eyes drift toward you.`, `You could rise {tone} and say what you have been thinking for weeks. {champ.first} is already looking at you.`],
    choices: [
      { id: 'call_out', label: 'Call {champ.first} out and ask for a title match', risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.7 }, text: `The room holds its breath, then explodes. {champ.first} accepts, and the booker adds your name to the card.`, effects: [{ pop: 1.0 }, { conf: 3 }, { rivalry: { who: 'champ', heat: 12 } }, { rel: { who: 'champ', heat: 10 } }, { promise: { kind: 'win_title', who: 'champ', text: 'I will take the title from {champ.name}', deadlineDays: 120 } }, { event: { type: 'press_conference', participants: ['champ', 'reporter'], summary: 'Called out {champ.name} at a press conference.', data: { quality: { base: 66, mic: 0.7, noise: 12 }, viral: { minQuality: 84, chance: 0.4 } } } }] },
        { weight: 1, text: `{champ.first} laughs and says you are not ready. The room laughs too.`, effects: [{ pop: -0.4 }, { conf: -4 }, { rivalry: { who: 'champ', heat: 8 } }, { promise: { kind: 'win_title', who: 'champ', text: 'I will take the title from {champ.name}', deadlineDays: 120 } }] } ] },
      { id: 'wait_turn', label: 'Say you will wait for your turn at the title', risk: 'low', result: `A patient, professional answer. The champion nods politely, and no one writes it down.`, effects: [{ rel: { who: 'champ', respect: 3 } }, { conf: -1 }] },
      { id: 'praise', label: 'Praise {champ.first} as the standard to beat', risk: 'low', result: `Your answer is gracious and a touch ambitious. {champ.first} thanks you, and you earn a quiet reputation for respect.`, effects: [{ rel: { who: 'champ', respect: 5 } }, { pop: 0.2 }] },
      { id: 'point_elsewhere', label: 'Point out someone else in the room is more deserving', risk: 'med', result: `The deflection draws a laugh and a nod, and it also hands a rival a gift. A veteran thanks you privately.`, effects: [{ pop: 0.2 }, { conf: -1 }, { fatigue: 1 }] },
    ],
  },
  {
    id: 'prs_wrestlemania_week', category: 'press', title: 'The Gauntlet of {week}', weight: 2.5, cooldownDays: 200, maxPerCareer: 3, major: true,
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { eventWithin: { id: 'wrestlemania', days: 12 }, stat: { popularity: { gte: 45 } } },
    slots: { week: ['Media Week', 'Fan-Fest Week', 'Press Row Week', 'Hall of Fame Week'], burden: ['six hours of interviews a day', 'a signing marathon', 'a sponsor breakfast', 'a festival of fan events'] },
    body: [`{week} is here, and your schedule is stuffed with {burden}. {reporter.name} has the first slot of the morning, and the questions are all about the biggest night of the year.`, `The city is full of fans who travelled for days to be near you. They are friendly and tireless and you have a match to wrestle.`],
    choices: [
      { id: 'embrace', label: 'Embrace every event and give fans your time', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.5 }, text: `Your stamina for small talk surprises even you. The fans remember your name, and the sponsor hands you a bonus.`, effects: [{ pop: 1.3 }, { money: 6000 }, { fatigue: 18 }] },
        { weight: 1, text: `By Thursday your voice is a rasp and your handshakes are mechanical. A photo of you yawning goes viral.`, effects: [{ pop: 0.3 }, { money: 6000 }, { fatigue: 25 }, { conf: -3 }] } ] },
      { id: 'protect', label: 'Protect your energy and pick three events', risk: 'low', result: `You do three things well and skip the rest. The fans are nice about it, the sponsors less so.`, effects: [{ pop: 0.5 }, { fatigue: 7 }, { money: -1000 }] },
      { id: 'big_statement', label: 'Make one huge statement and go quiet', risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.7 }, text: `One quote, delivered perfectly in the biggest interview, sets the tone for the whole week. Nobody can stop quoting it.`, effects: [{ pop: 1.2 }, { conf: 3 }, { fatigue: 8 }, { event: { type: 'press_conference', participants: ['reporter'], summary: 'Delivered the quote of Media Week.', data: { quality: { base: 66, mic: 0.7, noise: 10 }, viral: { minQuality: 84, chance: 0.5 } } } }] },
        { weight: 2, text: `The line is lost in the noise, and you have nothing else prepared.`, effects: [{ pop: 0.1 }, { fatigue: 8 }, { conf: -2 }] } ] },
      { id: 'opt_out', label: 'Hole up in the hotel until showtime', risk: 'low', result: `You arrive rested and nobody has seen you for days. The press complain, and the match is better for it.`, effects: [{ fatigue: -10 }, { pop: -0.5 }, { conf: 1 }] },
    ],
  },
  {
    id: 'prs_retirement_question', category: 'press', title: 'When Will You Hang It Up?', weight: 1.5, cooldownDays: 160, maxPerCareer: 3,
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { stat: { careerYears: { gte: 12 }, popularity: { gte: 40 } } },
    slots: { setting: ['At a hometown signing', 'In a live studio chat', 'After a long road trip', 'At an awards banquet'], angle: ['your body', 'your legacy', 'the next generation', 'your family'] },
    body: [`{setting}, {reporter.name} asks about {angle}, and then the question lands: how much longer do you plan to keep doing this? It is asked kindly, and the kindness makes it harder.`, `You have thought about the answer more than you admit. What you say will start a clock, whether or not you set it.`],
    choices: [
      { id: 'no_end', label: 'Say you will wrestle until your body quits', risk: 'low', result: `Fans love the defiance, and your physio sighs in the corner. It is a promise to yourself more than to anyone else.`, effects: [{ pop: 0.5 }, { conf: 2 }, { fatigue: 3 }] },
      { id: 'timeline', label: 'Give a rough timeline for a final run', risk: 'med', result: `The announcement is gentle and clear. It makes every match feel more precious, and it also tells the booker how long you have left.`, effects: [{ pop: 0.7 }, { conf: -1 }, { event: { type: 'goal_set', participants: ['reporter'], summary: 'Spoke publicly about a final run.', data: {} } }] },
      { id: 'joke', label: 'Joke that they will have to drag you out', risk: 'low', result: `The reporter laughs, you laugh, and nothing real gets said. The answer is a fine place to hide.`, effects: [{ pop: 0.2 }] },
      { id: 'bristle', label: 'Bristle: the question assumes you are finished', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `You flip the question into a challenge to the next generation. The younger roster hears it, and so do the fans.`, effects: [{ pop: 0.6 }, { conf: 3 }] },
        { weight: 1, text: `The temper you showed makes the story that you are sensitive about your age. The clip lives on.`, effects: [{ pop: -0.4 }, { conf: -2 }] } ] },
    ],
  },
  // ============================================================== SOCIAL
  {
    id: 'soc_heated_post', category: 'social', title: 'A Post That Lit Up the Timeline', weight: 2.5, cooldownDays: 90, maxPerCareer: 4, major: true,
    trigger: { minYear: 2010, noFlag: 'apology_pending', stat: { popularity: { gte: 35 } } },
    slots: { topic: ['a rival\'s weight cut', 'a ref\'s decision', 'the sport\'s pay structure', 'a fan\'s hostile comment'], tone: ['a late-night rant', 'a quick quip', 'a carefully worded thread', 'a sarcastic photo caption'] },
    body: [`You posted {tone} about {topic}, and it did not go the way you expected. The replies split into camps within the hour, and the people with large followings have started to pick sides.`, `A producer has messaged to ask if you are okay. You can read the room two ways: as a spark worth fanning, or a fire worth putting out.`],
    choices: [
      { id: 'delete', label: 'Delete the post and move on', risk: 'low', result: `It is gone in thirty seconds, but screenshots exist forever. The story fades faster than it would have, though your credibility takes a small hit.`, effects: [{ pop: -0.2 }, { conf: -2 }] },
      { id: 'apologise', label: 'Post an apology and hope it satisfies', risk: 'med', result: `The apology is genuine, but it does not end the conversation. The press wants a fuller statement, and the matter is still open.`, effects: [{ pop: 0.1 }, { conf: -1 }, { flag: 'apology_pending' }, { event: { type: 'social_post', participants: [], summary: 'Posted an apology after a heated post.', data: { quality: { base: 55, charisma: 0.3, noise: 10 }, controversy: true } } }] },
      { id: 'double_down', label: 'Double down and invite the argument', risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.6, confidence: 0.4 }, text: `Your follow-up is sharp and funny, and your supporters multiply. The argument becomes content, and you are the one who drives it.`, effects: [{ pop: 1.1 }, { conf: 3 }, { fatigue: 4 }, { event: { type: 'social_post', participants: [], summary: 'Doubled down in a social media storm.', data: { quality: { base: 62, mic: 0.6, noise: 14 }, controversy: true, viral: { minQuality: 78, chance: 0.5 } } } }] },
        { weight: 2, text: `The second post lands worse than the first. A sponsor sends a polite email asking for clarity, and the heat grows.`, effects: [{ pop: -0.8 }, { money: -3000 }, { conf: -3 }, { fatigue: 4 }, { flag: 'apology_pending' }] } ] },
      { id: 'log_off', label: 'Log off for three days and say nothing', risk: 'low', result: `You turn the phone off. The silence feels long, and the story turns over quietly. You return to find things calmer and a pile of unread messages.`, effects: [{ fatigue: -4 }, { conf: -1 }] },
    ],
  },
  {
    id: 'soc_rival_subtweet', category: 'social', title: '{rival.name} Posts a Not-So-Subtle Jab', weight: 2.5, cooldownDays: 50, maxPerCareer: 6,
    cast: { rival: { pick: 'rivalry', minHeat: 20 } }, memory: { role: 'rival', max: 1 },
    trigger: { minYear: 2010 },
    slots: { post: ['a photo of an empty trophy shelf', 'a cryptic one-line riddle', 'a sarcastic "thoughts and prayers" for your last match', 'a meme with an unmistakable silhouette'], reaction: ['thousands of likes', 'a flood of replies', 'a quote-post pile-on', 'a trending tag'] },
    body: [`{rival.name} has posted {post} with no names attached, but everybody knows who it is for. It has already collected {reaction}, and your own mentions are demanding a reply.`, `{rival.first} wants a response. The only choice is whether you give {rival.them} one, and in what form.`],
    choices: [
      { id: 'clapback', label: 'Reply with a razor-sharp clapback', risk: 'med', outcomes: [
        { weight: 3, bonus: { mic: 0.6, charisma: 0.3 }, text: `Seven words, perfectly placed. It outperforms the original in under an hour, and {rival.first} goes quiet.`, effects: [{ pop: 0.9 }, { rivalry: { who: 'rival', heat: 8 } }, { rel: { who: 'rival', heat: 6 } }, { event: { type: 'social_post', participants: ['rival'], summary: 'Landed a viral clapback on {rival.name}.', data: { quality: { base: 66, mic: 0.6, charisma: 0.3, noise: 14 }, viral: { minQuality: 80, chance: 0.5 } } } }] },
        { weight: 2, text: `The reply is slower and clumsier than you wanted, and {rival.first} replies to your reply with something nastier.`, effects: [{ pop: -0.4 }, { rivalry: { who: 'rival', heat: 8 } }, { conf: -3 }] } ] },
      { id: 'ratio_with_class', label: 'Respond with a gracious, kind message', risk: 'low', result: `A warm reply that makes {rival.first} look petty. The crowd sees a mature competitor, and {rival.first} sees an opponent who will not be baited.`, effects: [{ pop: 0.4 }, { rel: { who: 'rival', respect: 3 } }, { conf: 1 }] },
      { id: 'in_ring', label: 'Answer in the ring, not online', risk: 'med', result: `You post a single line: "See you Monday". Fans love the swagger, and the match gets made.`, effects: [{ booking: { who: 'rival', type: 'singles' } }, { rivalry: { who: 'rival', heat: 10 } }, { pop: 0.5 }, { fatigue: 4 }] },
      { id: 'mute', label: 'Mute {rival.them} and say nothing', risk: 'low', result: `Quiet is a statement. Some fans like it, some think you are scared, and the thread dies by dinner.`, effects: [{ conf: -1 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'soc_charity_stream', category: 'social', title: 'A Charity Stream for {cause}', weight: 1.5, cooldownDays: 140, maxPerCareer: 3,
    trigger: { minYear: 2014, stat: { popularity: { gte: 40 } } },
    slots: { cause: ['a children\'s hospital', 'an animal shelter', 'a local food bank', 'a veterans\' charity'], game: ['a video-game marathon', 'a cooking disaster', 'a trivia night against fans', 'a twelve-hour talk-and-sign'] },
    body: [`Someone at the charity has asked whether you would host {game} on a livestream to raise money for {cause}. It would be eight hours of a camera, a chat window and a donation total that climbs or stalls.`, `You will either give your followers a good evening or give them one more reason to scroll away. Either way, the money matters.`],
    choices: [
      { id: 'full_marathon', label: 'Commit to the full marathon', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.7 }, text: `Chat treats it like a party. The donation goal is smashed in the fifth hour, and you finish hoarse and happy.`, effects: [{ pop: 1.2 }, { conf: 3 }, { fatigue: 14 }, { money: -2000 }, { event: { type: 'social_post', participants: [], summary: 'Hosted a charity livestream marathon.', data: { quality: { base: 68, charisma: 0.7, noise: 10 }, viral: { minQuality: 85, chance: 0.3 } } } }] },
        { weight: 1, text: `Technical failures eat the first two hours. Viewers drift away, but the total is still respectable.`, effects: [{ pop: 0.3 }, { conf: -1 }, { fatigue: 14 }, { money: -2000 }] } ] },
      { id: 'two_hours', label: 'Do a focused two-hour special', risk: 'low', result: `Tight, funny and well-organised. It raises a decent amount, and you are in bed at a sensible hour.`, effects: [{ pop: 0.5 }, { fatigue: 5 }, { money: -500 }] },
      { id: 'donate_only', label: 'Write a cheque instead of showing up', risk: 'low', result: `Generous and private. The charity is grateful, your followers do not notice, and your wallet takes the hit.`, effects: [{ money: -6000 }, { conf: 1 }] },
      { id: 'sponsor_it', label: 'Find a sponsor to match donations', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `A sponsor says yes and doubles the pot. The story gets bigger than the stream.`, effects: [{ pop: 0.9 }, { conf: 2 }, { fatigue: 8 }] },
        { weight: 1, text: `Nobody bites in time, and the pitch makes the stream feel like a sales call.`, effects: [{ pop: -0.2 }, { fatigue: 8 }] } ] },
    ],
  },
  {
    id: 'soc_parody_account', category: 'social', title: 'A Parody Account Is Getting Big', weight: 1.5, cooldownDays: 120, maxPerCareer: 3,
    trigger: { minYear: 2010, stat: { popularity: { gte: 45 } } },
    slots: { style: ['a deadpan imitation', 'a surreal, over-the-top caricature', 'an affectionate tribute', 'a savage satire'], size: ['ten thousand followers', 'a viral week', 'a news write-up', 'a million views'] },
    body: [`A parody account has appeared, producing {style} of everything you say. It has reached {size}, and some of its jokes are very, very good.`, `It is also clear that people in the locker room have been quoting it back to you. You could embrace it, block it or take it to court.`],
    choices: [
      { id: 'embrace', label: 'Follow it and join the joke', risk: 'med', effects: [{ fatigue: 4 }], outcomes: [
        { weight: 3, bonus: { charisma: 0.6 }, text: `You reply to the account in character. The parody and the real you trade lines, and fans love both.`, effects: [{ pop: 0.9 }, { conf: 2 }, { event: { type: 'social_post', participants: [], summary: 'Played along with a parody account.', data: { quality: { base: 64, charisma: 0.6, noise: 12 }, viral: { minQuality: 80, chance: 0.4 } } } }] },
        { weight: 1, text: `The account flips the bit and goes for a darker joke. You are stuck having endorsed it.`, effects: [{ pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'report', label: 'Report it for impersonation', risk: 'med', outcomes: [
        { weight: 2, text: `The account is suspended. The jokes stop, and some of the fans accuse you of having no sense of humour.`, effects: [{ conf: 1 }, { pop: -0.4 }] },
        { weight: 1, text: `The platform ignores the report, and the account posts the whole exchange as its best material yet.`, effects: [{ pop: -0.7 }, { conf: -3 }] } ] },
      { id: 'ignore', label: 'Pretend not to notice', risk: 'low', result: `The account carries on without you. Your mentions are full of its latest jokes, and you cannot unsee them.`, effects: [{ conf: -1 }] },
      { id: 'hire_them', label: 'Offer the creator a writing gig', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `The creator turns out to be sharp, sweet and available. Your posts improve noticeably.`, effects: [{ pop: 0.7 }, { conf: 2 }, { money: -3000 }] },
        { weight: 2, text: `The creator takes the money, loses the voice and the account dies. You paid for a joke that ended.`, effects: [{ pop: -0.2 }, { money: -3000 }] } ] },
    ],
  },
  {
    id: 'soc_fake_rumour', category: 'social', title: 'A Fake Story About You Is Trending', weight: 2, cooldownDays: 100, maxPerCareer: 3,
    cast: { reporter: { pick: 'media', kind: 'reporter' } },
    trigger: { minYear: 2010, stat: { popularity: { gte: 50 } } },
    slots: { claim: ['you were released', 'you were seriously injured', 'you were quitting the business', 'you were arrested'], spread: ['a screenshot of a fake news site', 'a forum post', 'a doctored video', 'an anonymous video blogger'] },
    body: [`A hoax claiming {claim} has spread across social media, started by {spread}. {reporter.name} has already texted to ask whether it is true.`, `You have been called by relatives and by your agent, and one of the first people to call was a sponsor.`],
    choices: [
      { id: 'quick_denial', label: 'Post a short, direct denial', risk: 'low', result: `Two sentences and a photo from today. The hoax is dead by lunchtime, and the people who spread it quietly delete their posts.`, effects: [{ pop: 0.2 }, { conf: 1 }, { event: { type: 'social_post', participants: ['reporter'], summary: 'Shut down a fake rumour with a quick denial.', data: { quality: { base: 60, charisma: 0.3, noise: 8 }, handled: true } } }] },
      { id: 'mock_it', label: 'Mock the hoax with a joke', risk: 'med', effects: [{ fatigue: 4 }], outcomes: [
        { weight: 3, bonus: { charisma: 0.6, mic: 0.4 }, text: `Your joke goes round faster than the lie. People are laughing with you, and the hoaxer looks silly.`, effects: [{ pop: 0.9 }, { conf: 2 }, { event: { type: 'social_post', participants: ['reporter'], summary: 'Turned a fake rumour into a joke.', data: { quality: { base: 66, charisma: 0.6, mic: 0.4, noise: 12 }, viral: { minQuality: 80, chance: 0.4 }, handled: true } } }] },
        { weight: 1, text: `A relative reads the joke and does not find it funny. The hoax lingers, and your tone looks callous.`, effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
      { id: 'legal', label: 'Have lawyers track down the source', risk: 'high', result: `Costly, slow and a bit scary. The source is traced eventually, but you spend a week tied up with paperwork.`, effects: [{ money: -7000 }, { conf: 1 }, { fatigue: 6 }] },
      { id: 'ride_it', label: 'Let the rumour build buzz before you correct it', risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.4 }, text: `After a day of speculation, you drop a surprise reveal. The attention is enormous, and the timing looks theatrical.`, effects: [{ pop: 1.0 }, { conf: 1 }] },
        { weight: 2, text: `Your silence is read as confirmation. Your family and sponsors are not amused, and the correction does not travel as far as the rumour.`, effects: [{ pop: -0.7 }, { conf: -3 }, { money: -2000 }] } ] },
    ],
  },
  {
    id: 'soc_ama', category: 'social', title: 'An Ask-Me-Anything Goes Live', weight: 1.5, cooldownDays: 100, maxPerCareer: 4,
    trigger: { minYear: 2010, stat: { popularity: { gte: 40 }, mic: { gte: 40 } } },
    slots: { platform: ['a fan forum', 'a video chat app', 'a live text thread', 'a question box on your page'], question: ['who is the toughest opponent', 'what is your worst habit', 'who is on your bucket-list match', 'what your favourite memory from the road is'] },
    body: [`You opened {platform} for an hour and told fans to ask anything. The top-voted question, by a wide margin, is {question}.`, `You can see the hit counter rising, and a handful of troll accounts waiting by the sidelines. Everything you type will be screenshotted.`],
    choices: [
      { id: 'be_open', label: 'Answer honestly and with humour', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.6 }, text: `Your answers are funny, human and a little strange. The thread is saved and shared, and people ask for a sequel.`, effects: [{ pop: 0.9 }, { conf: 2 }, { fatigue: 3 }, { event: { type: 'social_post', participants: [], summary: 'Hosted a well-received fan Q&A.', data: { quality: { base: 64, charisma: 0.6, noise: 10 }, viral: { minQuality: 84, chance: 0.3 } } } }] },
        { weight: 1, text: `One careless answer turns into a story, and you spend the next day trying to take it back.`, effects: [{ pop: -0.2 }, { conf: -3 }, { fatigue: 3 }] } ] },
      { id: 'tease_news', label: 'Drop a tease about something upcoming', risk: 'high', result: `You hint at a big announcement. The fans lose their minds, and the creative team asks, a little coldly, what you meant.`, effects: [{ pop: 0.9 }, { conf: 1 }, { fatigue: 3 }] },
      { id: 'curated', label: 'Answer only the safest questions', risk: 'low', result: `The hour is polite and dull. Fans notice that the interesting questions disappeared, and complain about it politely.`, effects: [{ pop: 0.1 }, { fatigue: 2 }] },
      { id: 'cut_early', label: 'Close the session early after rude questions', risk: 'low', result: `A handful of trolls ruined it for hundreds of fans. You log off feeling lighter, and the fans feel short-changed.`, effects: [{ pop: -0.3 }, { fatigue: -3 }, { conf: 1 }] },
    ],
  },
  {
    id: 'soc_photo_spoiler', category: 'social', title: 'A Photo That Spoils the Plan', weight: 1.5, cooldownDays: 90, maxPerCareer: 3,
    cast: { producer: { pick: 'staff', role: 'producer' } },
    trigger: { minYear: 2010, stat: { popularity: { gte: 40 } } },
    slots: { photo: ['a rehearsal shot of a new entrance', 'a backstage picture with a rival', 'a shot of a new set of gear', 'a hotel photo with the championship belt'], source: ['a fan with a long lens', 'a friend you tagged', 'a stagehand', 'your own careless post'] },
    body: [`{photo} has been posted by {source}, and the internet is already guessing what it means. {producer.name} has seen it and does not look pleased.`, `If the angle was meant to be a surprise, it is gone. If it was meant to be a mystery, the clock has started.`],
    choices: [
      { id: 'own_it', label: 'Own it and hype what is coming', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `You turn the leak into a countdown. Fans spend a week guessing, and the producer allows a small, frosty smile.`, effects: [{ pop: 0.7 }, { conf: 1 }] },
        { weight: 1, text: `The hype raises expectations the show cannot meet. A producer scribbles a note about your judgment.`, effects: [{ pop: 0.2 }, { conf: -2 }] } ] },
      { id: 'delete_deny', label: 'Take it down and deny everything', risk: 'low', result: `The denial buys time, but the screenshots have already travelled. You look evasive, and the producer is not fooled.`, effects: [{ pop: -0.2 }, { conf: -1 }] },
      { id: 'apologise_to_producer', label: 'Apologise privately to the producer', risk: 'low', result: `{producer.first} appreciates the call, mostly, and reshuffles the segment. The creative team notes that you can be trusted to own a mistake.`, effects: [{ conf: -1 }, { pop: 0.1 }] },
      { id: 'blame_source', label: 'Blame the person who posted it', risk: 'med', result: `The story shifts away from you, but the colleague you named is now gunning for you.`, effects: [{ conf: 1 }, { pop: -0.3 }] },
    ],
  },
  {
    id: 'soc_pile_on', category: 'social', title: 'A Wave of Hostile Messages', weight: 1.5, cooldownDays: 110, maxPerCareer: 3,
    trigger: { minYear: 2010, stat: { popularity: { gte: 45 }, matches: { gte: 20 } } },
    slots: { trigger: ['a poor match', 'a controversial finish', 'a clipped quote', 'a change of look'], toll: ['your inbox', 'your phone', 'your family\'s accounts', 'a fan page you created'] },
    body: [`After {trigger}, a wave of cruel messages has hit {toll}. Most are thoughtless and some are obsessive, and a few of the nastiest have your family\'s names in them.`, `You were told to expect a thick skin and no one said how thick. The next hour decides how much of this you carry.`],
    choices: [
      { id: 'block_mute', label: 'Block, mute and report everything', risk: 'low', result: `A tedious hour with the report button, and the fog lifts. The feed is calmer, but the worst messages have already been read.`, effects: [{ conf: 1 }, { fatigue: 4 }, { pop: -0.1 }] },
      { id: 'public_response', label: 'Call out the abuse in a public post', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.5 }, text: `Your post is calm and firm. Thousands of fans flood in with support, and the worst accounts are suspended.`, effects: [{ pop: 0.8 }, { conf: 3 }, { fatigue: 3 }, { event: { type: 'social_post', participants: [], summary: 'Called out online abuse and was backed by fans.', data: { quality: { base: 64, charisma: 0.5, noise: 10 }, handled: true, viral: { minQuality: 86, chance: 0.2 } } } }] },
        { weight: 1, text: `The post feeds the trolls, who return with fresh energy. You regret giving them an audience.`, effects: [{ pop: -0.3 }, { conf: -3 }, { fatigue: 4 }] } ] },
      { id: 'step_away', label: 'Take a week offline and let someone else post', risk: 'low', result: `The week is quiet and healing. The social team takes the account, and the numbers dip a little.`, effects: [{ fatigue: -10 }, { conf: 2 }, { pop: -0.4 }] },
      { id: 'reply_back', label: 'Reply to the worst offenders in kind', risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.6 }, text: `A few of your replies are so good that the trolls are embarrassed. Fans love the toughness.`, effects: [{ pop: 0.7 }, { conf: 2 }, { fatigue: 5 }] },
        { weight: 2, text: `You lose your temper and a screenshot is shared by a news aggregator. The abuse increases and so does the heat from sponsors.`, effects: [{ pop: -0.9 }, { conf: -4 }, { money: -3000 }, { fatigue: 5 }] } ] },
    ],
  },
  {
    id: 'soc_follower_milestone', category: 'social', title: 'A Milestone Worth Marking', weight: 1.2, cooldownDays: 160, maxPerCareer: 3,
    trigger: { minYear: 2010, stat: { popularity: { gte: 60 } } },
    slots: { mark: ['one million followers', 'five hundred thousand subscribers', 'a hundred million total views', 'ten thousand comments on a single post'], gesture: ['a giveaway', 'a thank-you video', 'a live Q&A', 'a signed print run'] },
    body: [`Your accounts have reached {mark}, and the social team wants to celebrate with {gesture}. The number is a nice round one, and several rivals have noticed.`, `You can make it a moment or let it pass quietly. The fans who got you here are waiting to see which.`],
    choices: [
      { id: 'big_thanks', label: 'Do something generous for the fans', risk: 'low', result: `The gesture is warm and a little pricey. Fans repay it with fierce loyalty for weeks.`, effects: [{ pop: 0.7 }, { money: -4000 }, { conf: 2 }] },
      { id: 'monetise', label: 'Launch a paid subscription tier', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `A loyal core signs up in hours. The revenue is meaningful, and the free fans mutter.`, effects: [{ money: 12000 }, { pop: 0.1 }, { conf: 1 }] },
        { weight: 1, text: `Few sign up, and the announcement is mocked as greedy. You pull the page after two days.`, effects: [{ money: 1500 }, { pop: -0.5 }, { conf: -3 }] } ] },
      { id: 'brag', label: 'Rub it in a rival\'s face', risk: 'high', result: `A pointed post comparing numbers delights the crowd and the rivals you named do not forget.`, effects: [{ pop: 0.8 }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'low_key', label: 'Mark it with a simple thank-you', risk: 'low', result: `One heartfelt line, no gimmicks. Fans find it classy, and nothing else comes of it.`, effects: [{ pop: 0.3 }, { conf: 1 }] },
    ],
  },
  {
    id: 'soc_late_night_post', category: 'social', title: 'A 2 A.M. Post After a Bad Night', weight: 2, cooldownDays: 90, maxPerCareer: 4,
    trigger: { minYear: 2010, recent: { lossesGte: 3 } },
    slots: { mood: ['furious', 'heartbroken', 'defiant', 'numb'], draft: ['a long confessional', 'a blunt one-liner', 'a message to a particular person', 'a cryptic image'] },
    body: [`It is two in the morning in the hotel, and you are {mood}. The draft on your screen is {draft}, and your thumb hovers over the send button.`, `You know the rule about not posting after midnight. You also know that nobody has ever written a better line at noon.`],
    choices: [
      { id: 'send_it', label: 'Send it exactly as written', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.7 }, text: `Raw and honest, it lands like a hand on the shoulder. By morning, thousands of fans have replied with their own stories.`, effects: [{ pop: 1.0 }, { conf: 3 }, { event: { type: 'social_post', participants: [], summary: 'Posted a raw late-night message after losses.', data: { quality: { base: 60, charisma: 0.7, noise: 18 }, viral: { minQuality: 78, chance: 0.5 } } } }] },
        { weight: 2, text: `By dawn you regret every word. Fans see bitterness, and a producer sends an unwelcome text.`, effects: [{ pop: -0.7 }, { conf: -4 }, { flag: 'apology_pending' }] } ] },
      { id: 'sleep_on_it', label: 'Save it as a draft and go to sleep', risk: 'low', result: `In the morning, the draft is melodramatic. You delete it, grateful to a past self who hesitated.`, effects: [{ fatigue: -4 }, { conf: 1 }] },
      { id: 'send_softer', label: 'Rewrite it into something gentle and brave', risk: 'med', result: `A shorter, calmer post. Fans respond kindly, and a small part of you feels stronger for having written it.`, effects: [{ pop: 0.5 }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'call_someone', label: 'Call a friend instead of posting', risk: 'low', result: `A forty-minute phone call that helps more than any post would have. The fans see nothing, and you sleep.`, effects: [{ conf: 3 }, { fatigue: -5 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'soc_challenge_trend', category: 'social', title: 'The {trend} Challenge Wants You In', weight: 1.2, cooldownDays: 100, maxPerCareer: 3,
    trigger: { minYear: 2012, stat: { popularity: { gte: 40 } } },
    slots: { trend: ['Ice-Bucket', 'Dance-Off', 'One-Take', 'Mannequin'], rule: ['you have to tag three rivals', 'you have to do it in costume', 'you have to do it in the ring', 'you have to do it at 6 a.m.'] },
    body: [`The {trend} Challenge is sweeping the sport's accounts, and half the roster has already posted theirs. The rule is that {rule}, and your phone is full of colleagues tagging you.`, `Participating means looking silly on camera. Not participating means being the one name missing from the fun.`],
    choices: [
      { id: 'all_in', label: 'Commit fully and try to win it', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.7 }, text: `You nail the bit in one take. The video gets more attention than most of your matches.`, effects: [{ pop: 1.0 }, { conf: 2 }, { fatigue: 4 }, { event: { type: 'social_post', participants: [], summary: 'Won a viral social media challenge.', data: { quality: { base: 66, charisma: 0.7, noise: 14 }, viral: { minQuality: 80, chance: 0.5 } } } }] },
        { weight: 1, text: `You drop a prop on your foot mid-take. The blooper is the only clip anyone remembers.`, effects: [{ pop: 0.3 }, { conf: -2 }, { fatigue: 5 }] } ] },
      { id: 'tag_rivals', label: 'Do it and tag your rivals to raise the heat', risk: 'med', result: `The tagging turns a cute video into a feud accelerant. Your rivals take the bait, and the crowd loves it.`, effects: [{ pop: 0.7 }, { fatigue: 3 }, { conf: 1 }] },
      { id: 'tongue_cheek', label: 'Refuse with a deadpan statement', risk: 'low', result: `Your refusal gets more likes than most participants. Being above it is a vibe.`, effects: [{ pop: 0.3 }, { conf: 1 }] },
      { id: 'skip', label: 'Skip it and spend the evening training', risk: 'low', result: `A quiet night of work. Nobody asks where you were, and the feed moves on.`, effects: [{ fatigue: 5 }, { conf: 1 }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'soc_fan_war', category: 'social', title: 'Your Fans and {rival.name}\'s Fans Are at War', weight: 2, cooldownDays: 70, maxPerCareer: 4,
    cast: { rival: { pick: 'rivalry', minHeat: 25 } },
    trigger: { minYear: 2010, stat: { popularity: { gte: 45 } } },
    slots: { arena: ['a hashtag battle', 'a poll fight', 'a petition war', 'a chaotic comment-section brawl'], stake: ['bragging rights', 'a top spot on the trending list', 'a charity bet', 'the loudest chant'] },
    body: [`The fans of the two of you have turned the internet into {arena}, fighting over {stake}. Your accounts and {rival.name}'s are both being tagged in hundreds of posts every hour.`, `It is good for engagement, and it is getting ugly. A few of the posts are now personal.`],
    choices: [
      { id: 'stoke', label: 'Stoke the fire and take credit', risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.5 }, text: `Your single post lights the fuse and you ride the wave. Merchandise sales jump and the feud's temperature rises.`, effects: [{ pop: 1.0 }, { rivalry: { who: 'rival', heat: 12 } }, { money: 3000 }, { fatigue: 3 }] },
        { weight: 1, text: `It goes too far. A fan is hurt by an online stunt, and you are named in the story.`, effects: [{ pop: -0.8 }, { rivalry: { who: 'rival', heat: 10 } }, { conf: -4 }] } ] },
      { id: 'call_truce', label: 'Call for calm alongside {rival.first}', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `A joint message from two rivals stops the fight in its tracks. Respect on both sides goes up, though the heat drops.`, effects: [{ pop: 0.5 }, { rel: { who: 'rival', respect: 6, heat: -8 } }, { conf: 1 }] },
        { weight: 1, text: `{rival.first} ignores the offer and posts something nasty. You look weak for having asked.`, effects: [{ pop: -0.3 }, { rel: { who: 'rival', respect: -2 } }, { conf: -2 }] } ] },
      { id: 'tell_own_fans', label: 'Tell your fans to stand down', risk: 'low', result: `Your fans listen, mostly. The other side keeps going, but your corner stays decent.`, effects: [{ pop: 0.3 }, { conf: 1 }] },
      { id: 'ignore', label: 'Stay out of it', risk: 'low', result: `You mute the tag and carry on. The fight burns itself out in a day or two, though not before someone gets doxxed.`, effects: [{ pop: -0.1 }, { conf: -1 }] },
    ],
  },
  // ============================================================== FANS
  {
    id: 'fan_airport_encounter', category: 'fans', title: 'A Fan Finds You at the Airport', weight: 2, cooldownDays: 70, maxPerCareer: 5,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 35 } } },
    slots: { place: ['the gate after a delayed flight', 'baggage claim at midnight', 'the security line', 'a crowded coffee queue'], state: ['exhausted', 'in a hurry', 'half asleep', 'with a sore back'] },
    body: [`You are {state} at {place} when {fan.name} recognises you and walks over, holding a phone and a battered programme. The fan has clearly rehearsed this, and the line behind you is watching.`, `One second of patience here will be a story that lasts for years. One second of irritation will be a clip that lasts just as long.`],
    choices: [
      { id: 'full_time', label: 'Give {fan.first} real time and a long chat', risk: 'low', result: `Ten minutes, a picture, a signed boarding pass. {fan.first} walks off glowing, and the delay no longer feels as bad.`, effects: [{ pop: 0.5 }, { conf: 2 }, { fatigue: 4 }] },
      { id: 'quick_photo', label: 'Take a quick photo and apologise', risk: 'low', result: `You are warm but brief. {fan.first} is happy, the crowd behind you is mildly amused, and you make your connection.`, effects: [{ pop: 0.2 }, { fatigue: 1 }] },
      { id: 'in_character', label: 'Greet the fan in full ring character', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.6 }, text: `Half the terminal stops to watch. The performance is brilliant, and someone posts it with a hundred thousand shares.`, effects: [{ pop: 0.9 }, { fatigue: 4 }, { event: { type: 'social_post', participants: ['fan'], summary: 'A fan shared a video of an in-character airport greeting.', data: { quality: { base: 64, charisma: 0.6, noise: 12 }, viral: { minQuality: 80, chance: 0.4 } } } }] },
        { weight: 1, text: `The bit comes off cold. The fan looks stunned and the crowd murmurs that you are rude in person.`, effects: [{ pop: -0.4 }, { conf: -2 }, { fatigue: 3 }] } ] },
      { id: 'decline', label: 'Say sorry and keep walking', risk: 'med', result: `You need to be on the plane. The fan is crestfallen, and a nearby traveller films a compilation of the incident.`, effects: [{ pop: -0.4 }, { conf: -1 }] },
    ],
  },
  {
    id: 'fan_hospital_visit', category: 'fans', title: 'A Visit to the {ward} Ward', weight: 1.5, cooldownDays: 130, maxPerCareer: 3,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 30 } } },
    slots: { ward: ['children\'s', 'long-term care', 'veterans\'', 'rehabilitation'], gift: ['a replica belt', 'a signed T-shirt', 'a hand-drawn card', 'a ring-side ticket'] },
    body: [`A charity coordinator has asked you to visit the {ward} ward for an hour on your day off. {fan.name} is a patient who has been following your career since long before you were famous, and the staff says it would mean the world.`, `You bring {gift}, and the room has been decorated with your pictures. It is quiet in a way that a loud arena never is.`],
    choices: [
      { id: 'stay_long', label: 'Stay for the whole afternoon', risk: 'low', result: `The hour turns into four. You sign, listen and trade stories with the nurses, and walk out a different person than the one who walked in.`, effects: [{ pop: 0.5 }, { conf: 4 }, { fatigue: 8 }] },
      { id: 'private', label: 'Keep it private: no cameras at all', risk: 'low', result: `Nobody posts a thing. The hospital is touched, and your people shrug at the lost publicity.`, effects: [{ conf: 3 }, { fatigue: 4 }] },
      { id: 'public', label: 'Bring a camera crew to raise donations', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The footage is moving and the donations pour in. A few critics call it a publicity stunt, but the hospital is delighted.`, effects: [{ pop: 0.9 }, { money: -1500 }, { conf: 1 }, { fatigue: 5 }] },
        { weight: 1, text: `The cameras make the room tense. A nurse tells you they are in the way, and the clip looks self-serving.`, effects: [{ pop: -0.3 }, { conf: -2 }, { fatigue: 5 }] } ] },
      { id: 'reschedule', label: 'Reschedule for a day you are less tired', risk: 'low', result: `The coordinator is understanding, and the date slides. The patient is still waiting, and so are you.`, effects: [{ fatigue: -3 }, { conf: -2 }] },
    ],
  },
  {
    id: 'fan_convention_panel', category: 'fans', title: 'The Fan Convention Panel', weight: 1.8, cooldownDays: 110, maxPerCareer: 4,
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { stat: { popularity: { gte: 40 }, mic: { gte: 40 } } },
    slots: { crowd: ['a small hotel ballroom', 'a packed convention hall', 'a stadium concourse', 'a sold-out theatre'], topic: ['the future of the business', 'the best match you have ever had', 'a fan-voted pick of your career', 'a wild-card audience Q&A'] },
    body: [`{host.name} is moderating a panel before {crowd}, with {topic} as the headline. You are one of four guests, and the audience has come ready with signs and opinions.`, `The microphone is passed around like a hot potato. Decide in advance whether you plan to steer or follow.`],
    choices: [
      { id: 'lead', label: 'Take control of the panel and lead it', risk: 'med', outcomes: [
        { weight: 3, bonus: { mic: 0.6, charisma: 0.3 }, text: `You ask the room questions, tell a story that gets a laugh, and bring the quieter guests into the conversation. The crowd gives you a standing ovation.`, effects: [{ pop: 0.9 }, { conf: 3 }, { fatigue: 5 }] },
        { weight: 1, text: `You step on a co-panelist\'s story and the room feels it. The moderator rescues the moment and you look overeager.`, effects: [{ pop: -0.2 }, { conf: -2 }, { fatigue: 5 }] } ] },
      { id: 'share', label: 'Share the stage and let others shine', risk: 'low', result: `Gracious, funny and a touch forgettable. The other guests appreciate it, and the crowd has a pleasant afternoon.`, effects: [{ pop: 0.3 }, { fatigue: 3 }, { conf: 1 }] },
      { id: 'big_reveal', label: 'Reveal something about your future', risk: 'high', result: `You hint at a surprise, and the room erupts. The company does not love finding out in a ballroom.`, effects: [{ pop: 1.0 }, { conf: 2 }, { fatigue: 5 }, { money: -2000 }] },
      { id: 'sign_only', label: 'Skip the panel and just do the signing', risk: 'low', result: `The signing line is long and happy. You miss the stage, and the fans who wanted to hear you speak go home unsatisfied.`, effects: [{ pop: 0.1 }, { money: 2000 }, { fatigue: 6 }] },
    ],
  },
  {
    id: 'fan_chant', category: 'fans', title: 'The Crowd Starts Chanting', weight: 2, cooldownDays: 60, maxPerCareer: 6, contexts: ['post_match', 'weekly'],
    trigger: { stat: { matches: { gte: 10 }, popularity: { gte: 30 } } },
    slots: { chant: ['a rhythmic "overrated" chant', 'a mocking sing-along of your entrance theme', 'a roaring chant of your catchphrase', 'a swelling chant begging you to win'], mood: ['a sold-out arena', 'a tiny local hall', 'a rowdy television taping', 'a final-hour house show'] },
    body: [`In {mood}, the crowd has started {chant}. It builds until your own music is lost in the sound.`, `You have about eight seconds to decide what to do with it. The camera is already on you.`],
    choices: [
      { id: 'play_to_it', label: 'Play to the chant and conduct the crowd', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.7 }, text: `You raise a hand, and the roar swells. Whatever they meant by the chant, you have made it yours.`, effects: [{ pop: 0.9 }, { conf: 3 }, { fatigue: 2 }] },
        { weight: 1, text: `You miscalculate the room. The chant sours, and the arena hears it as an insult.`, effects: [{ pop: -0.4 }, { conf: -3 }] } ] },
      { id: 'respond_in_ring', label: 'Answer with a bigger performance in the ring', risk: 'med', result: `You turn the energy into a harder, flashier match. It costs you some stamina, and the finish is memorable.`, effects: [{ pop: 0.6 }, { fatigue: 8 }, { conf: 1 }] },
      { id: 'ignore', label: 'Ignore it and work your match', risk: 'low', result: `You keep your head down. The chant fades by the second act, and nothing about it appears in the reviews.`, effects: [{ conf: -1 }] },
      { id: 'shush', label: 'Shush them with a theatrical gesture', risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.4 }, text: `A sneer, a finger to the lips, and the arena erupts in the best kind of outrage. The heat is real.`, effects: [{ pop: 0.8 }, { conf: 2 }] },
        { weight: 2, text: `The crowd refuses to quiet, and the sound is louder than ever. You walk out looking beaten.`, effects: [{ pop: -0.5 }, { conf: -3 }] } ] },
    ],
  },
  {
    id: 'fan_heckler', category: 'fans', title: 'A Heckler at the Signing Table', weight: 1.8, cooldownDays: 80, maxPerCareer: 4,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 35 } } },
    slots: { event: ['a merch tent', 'a hotel signing', 'a mall appearance', 'a charity meet-and-greet'], jab: ['says you are washed up', 'tells you that you got lucky', 'says you let down the fans', 'keeps shouting a name that is not yours'] },
    body: [`At {event}, {fan.name} reaches the front of the line and, instead of asking for an autograph, {jab}. The people behind are watching and some of them are filming.`, `The staff waits for your signal, and the fan is red in the face. You could end it in three words or let it grow into a story.`],
    choices: [
      { id: 'kill_with_kindness', label: 'Kill the heckler with kindness', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.6 }, text: `You thank {fan.first}, shake the hand, and sign the heckler's shirt. The line breaks into applause.`, effects: [{ pop: 0.8 }, { conf: 3 }, { fatigue: 2 }] },
        { weight: 1, text: `The kindness reads as condescension. {fan.first} escalates, and security walks over.`, effects: [{ pop: -0.3 }, { conf: -2 }, { fatigue: 2 }] } ] },
      { id: 'fire_back', label: 'Fire back with a withering remark', risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.7 }, text: `You roast the heckler in front of the line, and the crowd loves it. The clip is funny, and a bit mean.`, effects: [{ pop: 0.8 }, { conf: 2 }, { event: { type: 'social_post', participants: ['fan'], summary: 'A fan clip showed a heckler being roasted at a signing.', data: { quality: { base: 62, mic: 0.7, noise: 14 }, viral: { minQuality: 78, chance: 0.5 } } } }] },
        { weight: 2, text: `It lands as bullying. The heckler wins the crowd, and the clip goes around with a very different caption.`, effects: [{ pop: -0.9 }, { conf: -3 }, { event: { type: 'social_post', participants: ['fan'], summary: 'A clip showed the player berating a heckler.', data: { quality: { base: 40, mic: 0.3, noise: 10 }, controversy: true } } }] } ] },
      { id: 'security', label: 'Wave security over and move the line along', risk: 'low', result: `Quick and clean. The heckler is escorted away, and the rest of the line has a faintly nervous hour.`, effects: [{ conf: 1 }, { pop: -0.2 }] },
      { id: 'invite_talk', label: 'Invite {fan.first} to talk after the signing', risk: 'low', result: `You sit down at the end of the day. {fan.first} had a rough year, and the real complaint is nothing to do with you. You both leave a little lighter.`, effects: [{ conf: 2 }, { fatigue: 5 }, { pop: 0.2 }] },
    ],
  },
  {
    id: 'fan_long_autograph_line', category: 'fans', title: 'The Autograph Line That Never Ends', weight: 1.5, cooldownDays: 90, maxPerCareer: 4,
    trigger: { stat: { popularity: { gte: 50 } } },
    slots: { venue: ['a comic convention', 'a stadium parking lot', 'a bookstore', 'a hotel ballroom'], hours: ['four hours', 'six hours', 'eight hours', 'all night'] },
    body: [`The queue at {venue} snakes round the building and the organisers have just announced that the signing will run for another {hours}. Your hand is already cramping and the water jug has been empty for an hour.`, `Every person in the line paid good money and some travelled far. You are the only thing standing between them and a story to tell.`],
    choices: [
      { id: 'sign_all', label: 'Sign for everyone, however long it takes', risk: 'low', result: `Your hand never forgives you, but the last fan in the line cries a little. Word of your generosity spreads.`, effects: [{ pop: 0.8 }, { conf: 2 }, { fatigue: 18 }, { money: 3000 }] },
      { id: 'speed', label: 'Speed things up: signature only', risk: 'med', result: `The line moves quickly and the fans get a fraction of what they hoped. You make it to dinner on time.`, effects: [{ pop: 0.1 }, { fatigue: 8 }, { money: 3000 }] },
      { id: 'limit_group', label: 'Do a group photo and a few big signings', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The group shot is chaotic and lovely. Everyone gets something, and the organisers take a deep breath of relief.`, effects: [{ pop: 0.5 }, { fatigue: 7 }, { money: 2500 }] },
        { weight: 1, text: `Some fans feel cheated and say so loudly online. The queue ends in a muttering mess.`, effects: [{ pop: -0.4 }, { fatigue: 7 }, { conf: -2 }, { money: 2500 }] } ] },
      { id: 'leave_early', label: 'Cut the signing short for your health', risk: 'high', result: `You stop at the three-hour mark. Hundreds of people leave without a signature, and the organisers hold it against you.`, effects: [{ fatigue: -4 }, { pop: -0.7 }, { money: -1500 }, { conf: -1 }] },
    ],
  },
  {
    id: 'fan_superfan_gift', category: 'fans', title: 'A Fan Brings You {gift}', weight: 1.5, cooldownDays: 120, maxPerCareer: 3,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 40 } } },
    slots: { gift: ['a hand-made replica championship belt', 'a quilt stitched with your catchphrases', 'a framed collage of every match poster', 'a scale model of the arena'], moment: ['at the stage door', 'at a signing table', 'outside your hotel', 'in an elevator'] },
    body: [`{fan.name} meets you {moment} with {gift}, and it is clear the work took months. The fan hands it over with shaking hands and a very short speech.`, `You have been given things before, but this one has the smell of real effort. Everyone nearby is watching to see what you do with it.`],
    choices: [
      { id: 'display', label: 'Accept it warmly and display it proudly', risk: 'low', result: `You hold it up for a photo, then take it into the locker room where it hangs for weeks. {fan.first} tells the story for years.`, effects: [{ pop: 0.5 }, { conf: 3 }] },
      { id: 'reciprocate', label: 'Give something back: tickets and a backstage tour', risk: 'low', result: `{fan.first} gets a night nobody could have scripted. It costs you a little and the story spreads.`, effects: [{ pop: 0.7 }, { conf: 2 }, { money: -1500 }, { fatigue: 3 }] },
      { id: 'accept_quickly', label: 'Thank the fan briefly and hand it to your assistant', risk: 'med', result: `You are in a hurry and it shows. {fan.first} tries to smile, and a bystander posts a pointed caption.`, effects: [{ pop: -0.4 }, { conf: -2 }] },
      { id: 'auction', label: 'Auction it for charity with {fan.first}\'s blessing', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `The auction raises a surprising sum, and {fan.first} gets to see the bidding. It all feels generous and grown-up.`, effects: [{ pop: 0.6 }, { conf: 2 }, { money: -500 }] },
        { weight: 1, text: `The fan hears from a friend that it was sold and feels hurt, no matter how good the cause.`, effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
    ],
  },
  {
    id: 'fan_life_changing_letter', category: 'fans', title: 'A Letter From a Fan Who Needed You', weight: 1.2, cooldownDays: 140, maxPerCareer: 3,
    trigger: { stat: { popularity: { gte: 35 }, careerYears: { gte: 1 } } },
    slots: { story: ['recovering from surgery', 'stuck in a hard year at school', 'grieving a parent', 'learning to speak with a stutter'], medium: ['a handwritten letter', 'a long email', 'a video message', 'a card slipped under the dressing-room door'] },
    body: [`Among the fan mail is {medium} from someone who says watching you got them through a stretch of {story}. The words are plain, a little awkward and entirely sincere.`, `You do not know what to say. It will not trend, and there is nothing in it for you except the thing itself.`],
    choices: [
      { id: 'personal_reply', label: 'Write back by hand, at length', risk: 'low', result: `It takes you an hour to write, and you cross out a lot. The reply reaches them three days later, and they frame it.`, effects: [{ conf: 4 }, { fatigue: 3 }, { pop: 0.2 }] },
      { id: 'invite', label: 'Invite them to a show and meet them', risk: 'low', result: `They arrive with their family. The meeting is short and unforgettable, and the staff quietly wipe their eyes.`, effects: [{ conf: 4 }, { pop: 0.4 }, { money: -800 }, { fatigue: 4 }] },
      { id: 'share_public', label: 'Share the letter publicly (with permission)', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.5 }, text: `Thousands of fans reply with their own stories. The moment gives the whole community a pause.`, effects: [{ pop: 0.9 }, { conf: 3 }, { event: { type: 'social_post', participants: [], summary: 'Shared a fan letter and sparked a community response.', data: { quality: { base: 64, charisma: 0.5, noise: 10 }, viral: { minQuality: 82, chance: 0.35 } } } }] },
        { weight: 1, text: `Some critics read it as self-promotion, and the original writer gets a share of unkind comments.`, effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
      { id: 'form_reply', label: 'Have your team send a standard reply', risk: 'low', result: `Efficient. The writer gets a signed photo and a printed note. It is not nothing, and not much.`, effects: [{ conf: -1 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'fan_club_meetup', category: 'fans', title: 'Your Fan Club Wants Recognition', weight: 1.2, cooldownDays: 140, maxPerCareer: 2,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 50 } } },
    slots: { size: ['forty regulars', 'three hundred members', 'a thousand-strong group', 'a dozen very loud founders'], ask: ['an official meet-up', 'a discount code', 'a place in the merch store', 'a shout-out on air'] },
    body: [`{fan.name}, the founder of a fan club with {size}, writes to ask for {ask}. The group has been shouting your name in arenas for a while, and several have the T-shirts to prove it.`, `This is the kind of loyalty that carries a wrestler through bad years. It is also the kind that expects something back.`],
    choices: [
      { id: 'official', label: 'Make it official and attend the meet-up', risk: 'low', result: `A Saturday afternoon of signing and pizza. The club doubles in membership within a month.`, effects: [{ pop: 0.7 }, { conf: 2 }, { fatigue: 7 }, { money: -1000 }] },
      { id: 'merch_deal', label: 'Offer a share of merch sales to the club', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `The deal energises the club and puts a small amount in your pocket. Everyone wins a little.`, effects: [{ pop: 0.4 }, { money: 4000 }, { conf: 1 }] },
        { weight: 1, text: `A dispute over who gets what breaks the club in two, and you get letters from both halves.`, effects: [{ pop: -0.3 }, { conf: -3 }, { money: 1000 }] } ] },
      { id: 'shout_out', label: 'Give them a shout-out on air but nothing more', risk: 'low', result: `A short line during a promo. The club goes wild, and the founder is mildly disappointed but accepts.`, effects: [{ pop: 0.3 }, { conf: 1 }] },
      { id: 'keep_distance', label: 'Thank them but keep your distance', risk: 'low', result: `You keep things professional. The club stays loyal but cool, and the founder takes a step back.`, effects: [{ conf: 1 }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'fan_young_fan_costume', category: 'fans', title: 'A Kid in Your Gear Steals the Show', weight: 1.5, cooldownDays: 110, maxPerCareer: 3,
    trigger: { stat: { popularity: { gte: 35 } } },
    slots: { place: ['front row', 'the barricade', 'a costume contest', 'a hotel lobby'], kid: ['an eight-year-old', 'a toddler with a plastic belt', 'a shy ten-year-old', 'a teenager with a hand-painted jacket'] },
    body: [`In {place}, {kid} is in full homemade version of your ring gear, grinning from ear to ear. The family has been saving up for weeks to be here, and the camera crew has spotted them too.`, `It is a small moment, and you have a choice about how large it becomes.`],
    choices: [
      { id: 'bring_in', label: 'Bring the kid into the ring for a moment', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.5 }, text: `Pure joy. The kid raises both fists, and the crowd loses its voice. The footage ends up on the evening news.`, effects: [{ pop: 1.0 }, { conf: 3 }, { fatigue: 2 }] },
        { weight: 1, text: `Security and a producer both have notes, and the kid freezes. The family is grateful, but your boss is not.`, effects: [{ pop: 0.3 }, { conf: -1 }, { fatigue: 2 }] } ] },
      { id: 'quiet_gift', label: 'Slip them a signed prop and a few quiet words', risk: 'low', result: `No cameras and no fanfare. The kid beams, and the parents write you a note you keep for years.`, effects: [{ conf: 3 }, { pop: 0.2 }] },
      { id: 'costume_prize', label: 'Judge the costume contest in person', risk: 'low', result: `A cheerful, tiring hour. The kid wins, the others do not, and you hope nobody cries.`, effects: [{ pop: 0.5 }, { fatigue: 5 }, { conf: 1 }] },
      { id: 'ignore', label: 'Wave from a distance and keep to your entrance', risk: 'low', result: `You smile but keep to the plan. The kid\'s face falls a little, and the cameras find it first.`, effects: [{ pop: -0.3 }, { conf: -1 }] },
    ],
  },
  {
    id: 'fan_booed_face', category: 'fans', title: 'The Cheers Turn to Boos', weight: 2, cooldownDays: 90, maxPerCareer: 3, major: true,
    trigger: { alignment: ['face'], stat: { matches: { gte: 25 }, popularity: { lte: 55 } } },
    slots: { city: ['your home state', 'a traditional arena', 'a notoriously tough crowd', 'a city where the local hero left on bad terms'], reason: ['for being too safe', 'for a predictable finish', 'for an overly perfect catchphrase', 'for no reason you can name'] },
    body: [`In {city}, the first few rows are cheering, but the rest of the arena has begun to boo you {reason}. It is not a mild reaction, and it is not going away.`, `Your agent says they have seen this before and that it is either a death sentence or a golden opportunity. It depends entirely on what you do in the next few weeks.`],
    choices: [
      { id: 'embrace_boos', label: 'Lean into the boos and sharpen your edge', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.4 }, text: `You flip the dynamic and start taunting the front rows. The reaction becomes electric, and the booker sits up in the back.`, effects: [{ pop: 1.0 }, { conf: 3 }, { fatigue: 4 }, { flag: 'crowd_turned' }] },
        { weight: 2, text: `The crowd smells desperation and hits harder. Nothing you try lands for a week.`, effects: [{ pop: -0.7 }, { conf: -4 }, { fatigue: 4 }] } ] },
      { id: 'win_them_back', label: 'Win the crowd back with humility and effort', risk: 'med', result: `Honest work, longer matches and a few kind words. The boos soften into applause, but it takes weeks.`, effects: [{ pop: 0.3 }, { conf: 1 }, { fatigue: 10 }] },
      { id: 'ask_creative', label: 'Ask creative for a new direction', risk: 'low', result: `The creative team promises to think about it. A few pages are written and a few are thrown away.`, effects: [{ conf: -1 }, { fatigue: 1 }, { flag: 'asked_for_direction' }] },
      { id: 'ignore', label: 'Ignore it and keep doing what has worked', risk: 'low', result: `You hold the line and the boos continue. By the end of the month you are numb to it, which is its own kind of problem.`, effects: [{ conf: -3 }, { pop: -0.3 }] },
    ],
  },
  {
    id: 'fan_restaurant_selfie', category: 'fans', title: 'A Selfie Request at the Wrong Time', weight: 1.2, cooldownDays: 80, maxPerCareer: 4,
    cast: { fan: { pick: 'media', kind: 'fan' } },
    trigger: { stat: { popularity: { gte: 45 } } },
    slots: { place: ['restaurant', 'gym', 'hotel elevator', 'cinema queue'], moment: ['tired from the road', 'with your headphones in', 'on a rare night off', 'still sore from last night'] },
    body: [`You are in the {place}, {moment}, when {fan.name} appears with a phone and a very hopeful smile. Others nearby have noticed and a small crowd is forming.`, `You have been recognised often enough to know the shape of this scene. What you do next is up to you.`],
    choices: [
      { id: 'gracious', label: 'Smile, pose and sign a napkin', risk: 'low', result: `Two minutes of charm. {fan.first} floats away, and the people next to you applaud.`, effects: [{ pop: 0.3 }, { conf: 1 }, { fatigue: 2 }] },
      { id: 'ask_wait', label: 'Ask {fan.first} to wait until you finish', risk: 'med', result: `Polite and firm. The fan waits, you eat in peace, and the photo is still good when it comes.`, effects: [{ pop: 0.1 }, { conf: 2 }] },
      { id: 'group_event', label: 'Invite everyone nearby to a group photo', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.5 }, text: `The room is delighted, the staff are thrilled, and the photo ends up framed on a wall.`, effects: [{ pop: 0.7 }, { fatigue: 4 }, { conf: 2 }] },
        { weight: 1, text: `The whole thing becomes noisy and chaotic, and you finally leave without finishing what you came for.`, effects: [{ pop: 0.2 }, { fatigue: 5 }, { conf: -1 }] } ] },
      { id: 'refuse', label: 'Politely decline: this is private time', risk: 'high', outcomes: [
        { weight: 2, text: `The fan understands, a little deflated. You get your peace, and nothing else comes of it.`, effects: [{ conf: 2 }, { pop: -0.1 }] },
        { weight: 2, text: `The fan posts a long account of the refusal. It is not fair, but it spreads.`, effects: [{ pop: -0.7 }, { conf: -2 }] } ] },
    ],
  },
  // ============================================================== CREATIVE
  {
    id: 'crt_gimmick_overhaul', category: 'creative', title: 'Creative Wants a New Gimmick', weight: 2, cooldownDays: 150, maxPerCareer: 3, major: true,
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { careerYears: { gte: 1 }, popularity: { lte: 65 } }, noFlag: 'gimmick_pitched' },
    slots: { persona: ['a masked, silent enforcer', 'a goofy party-starter', 'a ruthless corporate climber', 'a haunted drifter'], reason: ['flat merchandise numbers', 'a new head writer', 'a sponsor\'s wish list', 'a pitch from a focus group'] },
    body: [`{creative.name} drops a folder on the table. Inside is a full pitch to rebuild you as {persona}, driven by {reason}. There are mock-up sketches, a music cue and a one-page promo outline.`, `You were not consulted about any of it. The meeting is polite, and the decision is yours to shape if you speak up.`],
    choices: [
      { id: 'comply', label: 'Comply and sell the new character fully', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.6 }, text: `You commit so hard that the writers start adding scenes. The character clicks, and merchandise starts to move.`, effects: [{ pop: 0.9 }, { conf: -1 }, { fatigue: 8 }, { flag: 'gimmick_pitched' }] },
        { weight: 2, text: `The character never quite fits. Fans see the seams, and you feel like an actor in a costume of someone else\'s design.`, effects: [{ pop: -0.4 }, { conf: -4 }, { fatigue: 8 }, { flag: 'gimmick_pitched' }] } ] },
      { id: 'negotiate', label: 'Negotiate: keep the core and take the best parts', risk: 'low', outcomes: [
        { weight: 3, bonus: { mic: 0.4, charisma: 0.4 }, text: `{creative.first} grudgingly agrees to a hybrid. The character is still you, only louder.`, effects: [{ pop: 0.5 }, { conf: 2 }, { fatigue: 5 }, { flag: 'gimmick_pitched' }] },
        { weight: 1, text: `The compromise pleases nobody. The character ends up half-formed, and the writers lose interest.`, effects: [{ pop: -0.1 }, { conf: -2 }, { fatigue: 5 }, { flag: 'gimmick_pitched' }] } ] },
      { id: 'push_back', label: 'Push back and defend who you are', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.5 }, text: `Your pitch for keeping your identity is persuasive. {creative.first} blinks and the project is shelved.`, effects: [{ conf: 4 }, { pop: 0.3 }, { fatigue: 2 }, { flag: 'gimmick_pitched' }] },
        { weight: 2, text: `The meeting goes cold, and your pushback is read as ego. Your next few segments quietly shrink.`, effects: [{ conf: 1 }, { pop: -0.5 }, { flag: 'gimmick_pitched' }] } ] },
      { id: 'counter_pitch', label: 'Counter-pitch your own idea in writing', risk: 'med', result: `You stay up writing a full pitch of your own. {creative.first} reads it, says nothing and promises to bring it up in the room.`, effects: [{ conf: 1 }, { fatigue: 9 }, { pop: 0.2 }, { flag: 'gimmick_pitched' }] },
    ],
  },
  {
    id: 'crt_colours_change', category: 'creative', title: 'A New Colour Scheme for the Gear', weight: 1.5, cooldownDays: 140, maxPerCareer: 3,
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { palette: ['electric lime and black', 'bright pink and chrome', 'all white with gold trim', 'matte olive and rust'], note: ['a branding refresh', 'a licensing deal', 'a rebranding test', 'a new designer\'s portfolio'] },
    body: [`The costume department has sent over sketches of your gear in {palette}, tied to {note}. The designs are bold and some of the stitching has already been done.`, `Gear carries identity. A colour you cannot stand in will show up in every photo, every poster and every action figure.`],
    choices: [
      { id: 'wear_it', label: 'Wear it without complaint', risk: 'low', result: `You step into the new colours and make them yours. Merch sales dip on day one and recover by week three.`, effects: [{ pop: 0.3 }, { conf: -1 }, { money: 1500 }] },
      { id: 'tweak', label: 'Request a few tweaks to keep your identity', risk: 'low', outcomes: [
        { weight: 3, text: `The designer meets you halfway: one signature colour stays. The result looks sharper than the original sketch.`, effects: [{ pop: 0.5 }, { conf: 2 }, { fatigue: 2 }] },
        { weight: 1, text: `The tweaks take weeks, and the gear arrives wrong on the night of the show.`, effects: [{ pop: -0.3 }, { conf: -2 }, { fatigue: 2 }] } ] },
      { id: 'veto', label: 'Veto it and wear your old gear', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `Your fans love that you refused. The costume team grumbles but you win the standoff.`, effects: [{ conf: 3 }, { pop: 0.4 }] },
        { weight: 2, text: `The refusal is logged, and the next hat-tip from the creative team is notably cold.`, effects: [{ conf: 1 }, { pop: -0.4 }, { money: -1500 }] } ] },
      { id: 'sell_it', label: 'Turn the change into a hyped reveal', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `Your reveal teases the new colours for a week. When they appear, the crowd roars.`, effects: [{ pop: 0.9 }, { money: 3000 }, { fatigue: 4 }] },
        { weight: 1, text: `The build-up outpaces the gear, and the crowd reacts with a polite shrug.`, effects: [{ pop: 0.1 }, { fatigue: 4 }] } ] },
    ],
  },
  {
    id: 'crt_finisher_rename', category: 'creative', title: 'Creative Wants to Rename Your Finisher', weight: 1.5, cooldownDays: 150, maxPerCareer: 2,
    cast: { creative: { pick: 'staff', role: 'creative' }, commentator: { pick: 'media', kind: 'commentator' } },
    trigger: { stat: { matches: { gte: 20 }, wins: { gte: 8 } } },
    slots: { name: ['"The Last Word"', '"Final Notice"', '"The Closing Argument"', '"Sunset Boulevard"'], reason: ['it tests better with kids', 'the old one is trademark-risky', 'the commentators keep stumbling over it', 'merchandise needs a catchier name'] },
    body: [`{creative.name} wants to rename your finisher to {name}, because {reason}. {commentator.name} has already been given a script with the new name on it.`, `The move is the same, but the word the crowd shouts when it hits is different. Names matter more than people admit.`],
    choices: [
      { id: 'accept', label: 'Accept the new name and sell it hard', risk: 'low', result: `A week of training the crowd to chant it. It catches on slower than hoped, but by the end of the month it is stuck.`, effects: [{ pop: 0.4 }, { conf: -1 }, { fatigue: 3 }] },
      { id: 'compromise', label: 'Suggest a hybrid of the two names', risk: 'low', outcomes: [
        { weight: 2, bonus: { mic: 0.4 }, text: `The hybrid sounds better than either. {creative.first} makes a note to give you credit.`, effects: [{ pop: 0.6 }, { conf: 2 }] },
        { weight: 1, text: `The commentators mangle it on the first night. The new name is brought back as a mistake in the following week.`, effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'refuse', label: 'Refuse: the old name stays', risk: 'high', result: `You hold firm. The commentators use the old name with a sigh, and the creative team files a memo about difficult talent.`, effects: [{ conf: 3 }, { pop: 0.1 }, { fatigue: 2 }, { money: -1000 }] },
      { id: 'pitch_merch', label: 'Ask for a cut of merch sales on the new name', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `The negotiator in you pays off: a small but real share of the line. You sell the name, and you sell it well.`, effects: [{ money: 6000 }, { pop: 0.2 }, { conf: 1 }] },
        { weight: 2, text: `The office laughs. You get the new name, no share, and a reputation for hustling.`, effects: [{ money: 0 }, { pop: -0.1 }, { conf: -2 }] } ] },
    ],
  },
  {
    id: 'crt_heel_turn_pitch', category: 'creative', title: 'A Pitch to Turn on the Crowd', weight: 2, cooldownDays: 180, maxPerCareer: 2, major: true,
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { alignment: ['face'], stat: { popularity: { gte: 40 }, careerYears: { gte: 1 } }, noFlag: 'turn_pitched' },
    slots: { trigger: ['a betrayal of a longtime ally', 'a low blow in a title match', 'a cold interview after a win', 'a snub of the fans'], plan: ['a three-month build', 'an immediate shocker', 'a slow tease', 'a TV special'] },
    body: [`{creative.name} outlines a plan for your face-to-heel turn, set up through {trigger} and shaped by {plan}. The pitch is full of ideas for how the crowd will react.`, `Heels get longer careers and fatter paydays, or so the argument goes. Faces get the fans\' hearts, which is harder to put on a spreadsheet.`],
    choices: [
      { id: 'embrace', label: 'Embrace the turn and go all in', risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.6, charisma: 0.4 }, text: `The first night the crowd boos you so loudly the arena shakes. You grin at the camera and know it is working.`, effects: [{ pop: 1.2 }, { conf: 3 }, { fatigue: 6 }, { flag: 'turn_pitched' }] },
        { weight: 1, text: `The crowd boos, but nobody cares about the reasons. The turn gets lost in a weak build.`, effects: [{ pop: -0.3 }, { conf: -3 }, { fatigue: 6 }, { flag: 'turn_pitched' }] } ] },
      { id: 'change_terms', label: 'Accept, but ask for a slower build', risk: 'med', result: `Creative agrees to stretch the plan. The slower burn makes the crowd more invested, though it keeps you in limbo.`, effects: [{ pop: 0.5 }, { conf: 1 }, { fatigue: 3 }, { flag: 'turn_pitched' }] },
      { id: 'stay_face', label: 'Decline: you want to stay a fan favourite', risk: 'low', result: `The pitch goes in a drawer. Your fans appreciate it, though the company is quietly less committed.`, effects: [{ conf: 2 }, { pop: 0.2 }, { money: -1000 }, { flag: 'turn_pitched' }] },
      { id: 'counter', label: 'Counter with a face-with-edge idea', risk: 'low', result: `A grittier face character with a streak of temper. It is neither the turn nor the status quo, and everyone claims credit.`, effects: [{ pop: 0.3 }, { conf: 1 }, { fatigue: 3 }, { flag: 'turn_pitched' }] },
    ],
  },
  {
    id: 'crt_face_turn_pitch', category: 'creative', title: 'A Pitch to Turn Fan Favourite', weight: 2, cooldownDays: 180, maxPerCareer: 2, major: true,
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { alignment: ['heel'], stat: { popularity: { gte: 40 }, careerYears: { gte: 1 } }, noFlag: 'turn_pitched' },
    slots: { spark: ['standing up to a bully', 'saving a younger wrestler', 'refusing a villain\'s offer', 'a surprising act of sportsmanship'], vehicle: ['a heartfelt promo', 'a slow-burn redemption arc', 'a major PPV moment', 'a video package'] },
    body: [`{creative.name} pitches a turn in the opposite direction: you, the villain, as the fan favourite, sparked by {spark} and delivered through {vehicle}. The room is quietly excited, and quite a lot of the writers are leaning in.`, `The crowd has been booing you for months and you have been good at it. A redemption story could be great, or could cost you the edge that works.`],
    choices: [
      { id: 'embrace', label: 'Embrace the redemption arc', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.7 }, text: `When the crowd finally cheers, the reaction is almost physical. You stand in the middle of it and feel like a new performer.`, effects: [{ pop: 1.2 }, { conf: 3 }, { fatigue: 5 }, { flag: 'turn_pitched' }] },
        { weight: 1, text: `The crowd takes its time to forgive, and the story runs out of steam long before they do.`, effects: [{ pop: -0.2 }, { conf: -2 }, { fatigue: 5 }, { flag: 'turn_pitched' }] } ] },
      { id: 'delay', label: 'Ask to keep your edge for a few more months', risk: 'low', result: `Creative agrees to push the turn back. You stay dangerous for now, and the writers use their best ideas on someone else.`, effects: [{ conf: 1 }, { pop: 0.1 }, { flag: 'turn_pitched' }] },
      { id: 'decline', label: 'Decline: you like being the villain', risk: 'med', result: `You make a case for the heel life. Creative finds it persuasive, but a fan-favourite slot goes to someone else.`, effects: [{ conf: 2 }, { pop: -0.1 }, { flag: 'turn_pitched' }] },
      { id: 'edge_face', label: 'Take it but keep a mean streak', risk: 'med', result: `Half hero, half menace. Crowds are not sure how to cheer you, and that uncertainty keeps people watching.`, effects: [{ pop: 0.5 }, { conf: 1 }, { fatigue: 3 }, { flag: 'turn_pitched' }] },
    ],
  },
  {
    id: 'crt_put_someone_over', category: 'creative', title: 'The Producer Asks You to Do the Job', weight: 2.5, cooldownDays: 70, maxPerCareer: 6,
    cast: { producer: { pick: 'staff', role: 'producer' }, newcomer: { pick: 'roster', tier: { lte: 2 } } },
    trigger: { stat: { matches: { gte: 15 } } },
    slots: { venue: ['the production office', 'a hotel breakfast room', 'the hallway outside the gorilla', 'a quiet corner of catering'], argument: ['the company needs fresh stars', 'the fans want a change', 'a newcomer has earned a win', 'the numbers support the push'] },
    body: [`{producer.name} pulls you aside in {venue}. The plan is for {newcomer.name} to beat you cleanly on Sunday, because {argument}.`, `It is not an insult, and it is not nothing. How you take it will be noticed by both of them.`],
    choices: [
      { id: 'accept_gracious', label: 'Accept graciously and help {newcomer.first} look great', risk: 'low', result: `You work the match to make {newcomer.first} look like a star. {producer.first} remembers it, and so does the newcomer.`, effects: [{ rel: { who: 'newcomer', trust: 8, respect: 6 } }, { pop: 0.2 }, { conf: -2 }, { tag: { who: 'newcomer', tag: 'respected_by' } }] },
      { id: 'ask_return', label: 'Accept in exchange for a push of your own', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `{producer.first} agrees to put you in a stronger spot in the next two weeks. It is a fair trade, and everyone knows it.`, effects: [{ pop: 0.5 }, { conf: 1 }, { rel: { who: 'newcomer', respect: 2 } }] },
        { weight: 1, text: `The promise is vague and quietly forgotten. You did the job and got nothing.`, effects: [{ pop: -0.3 }, { conf: -3 }, { rel: { who: 'newcomer', respect: 2 } }] } ] },
      { id: 'refuse', label: 'Refuse: you will not lose to {newcomer.first}', risk: 'high', result: `The conversation ends in a stalemate. A decision above your head gets made, and you gain a rep for being difficult.`, effects: [{ conf: 2 }, { pop: -0.2 }, { rel: { who: 'newcomer', heat: 6, respect: -4 } }] },
      { id: 'counter_idea', label: 'Counter with a booking idea where you both look strong', risk: 'low', outcomes: [
        { weight: 2, bonus: { mic: 0.3, charisma: 0.3 }, text: `You pitch a double count-out that sets up a rematch. {producer.first} likes the idea and takes it to the office.`, effects: [{ pop: 0.4 }, { conf: 2 }, { rel: { who: 'newcomer', respect: 3 } }] },
        { weight: 1, text: `{producer.first} shakes {producer.their} head. The original plan stays, and you lose the argument and the match.`, effects: [{ conf: -2 }, { pop: -0.2 }] } ] },
    ],
  },
  {
    id: 'crt_ghostwritten_line', category: 'creative', title: 'A Scripted Line You Hate', weight: 2, cooldownDays: 70, maxPerCareer: 5,
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { promos: { gte: 2 } } },
    slots: { line: ['a groan-worthy pun about your hometown', 'a corporate slogan you are meant to shout', 'an insult that sounds like it was written by committee', 'a catchphrase that does not suit you'], moment: ['the closing line of the promo', 'the opening of the show', 'a mid-segment beat', 'your entrance'] },
    body: [`{creative.name} has written {line} for {moment}. It is in the script, in bold, with a note that it must be spoken exactly as it appears.`, `You tried it out loud in the shower and it still made you wince. The segment is on live television tonight.`],
    choices: [
      { id: 'say_it', label: 'Say it exactly as written and sell it', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.7 }, text: `Your delivery turns an awful line into a laugh the crowd loves. It becomes a meme, and {creative.first} takes credit.`, effects: [{ pop: 0.6 }, { conf: 1 }] },
        { weight: 2, text: `The line dies in the room. Fans groan, and the clip becomes a pet joke among colleagues.`, effects: [{ pop: -0.5 }, { conf: -3 }] } ] },
      { id: 'rewrite', label: 'Quietly rewrite the line in your own voice', risk: 'high', effects: [{ fatigue: 5 }], outcomes: [
        { weight: 2, bonus: { mic: 0.7 }, text: `Your version lands with the crowd and nobody remembers the original. {creative.first} reads the tape and nods.`, effects: [{ pop: 0.7 }, { conf: 3 }, { event: { type: 'promo_delivered', participants: ['creative'], summary: 'Swapped a scripted line for an improvised one.', data: { quality: { base: 64, mic: 0.7, noise: 12 } } } }] },
        { weight: 1, text: `{creative.first} spots the change on the monitor. The conversation after the show is not comfortable.`, effects: [{ pop: 0.3 }, { conf: -3 }] } ] },
      { id: 'ask_change', label: 'Ask for an earlier change before the show', risk: 'low', result: `A polite conversation that results in a reasonable swap. {creative.first} is slightly annoyed, but the line is fixed.`, effects: [{ conf: 1 }, { pop: 0.1 }, { fatigue: 2 }] },
      { id: 'mumble', label: 'Mumble through it and hope nobody notices', risk: 'low', result: `Nobody quotes it, and nobody forgets that you did not commit.`, effects: [{ pop: -0.3 }, { conf: -2 }] },
    ],
  },
  {
    id: 'crt_scripted_vs_freestyle', category: 'creative', title: 'Script or Freestyle on Live TV', weight: 2, cooldownDays: 60, maxPerCareer: 6,
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { mic: { gte: 50 }, promos: { gte: 4 } } },
    slots: { segment: ['a fifteen-minute opening promo', 'a backstage interview', 'a face-off in the ring', 'a closing statement'], cue: ['time cues are tight', 'the script is dense', 'a sponsor wants a mention', 'the segment sits in the main hour'] },
    body: [`You have {segment} tonight and {cue}. {creative.name} gave you a script this morning, and in your head the beats are already moving.`, `The moment will either land because it is tight or because it is alive. You get to choose which kind of risk to take.`],
    choices: [
      { id: 'script', label: 'Follow the script word for word', risk: 'low', result: `It plays clean and by the book. The producers are happy, and you feel like you wrote a polite letter.`, effects: [{ pop: 0.2 }, { fatigue: -2 }] },
      { id: 'freestyle', label: 'Freestyle around the script\'s skeleton', risk: 'high', outcomes: [
        { weight: 3, bonus: { mic: 0.8, charisma: 0.4 }, text: `You find a rhythm no script could write. The crowd breathes with you, and {creative.first} stops looking at the clock.`, effects: [{ pop: 1.1 }, { conf: 4 }, { event: { type: 'promo_delivered', participants: ['creative'], summary: 'Went off-script and landed a live promo.', data: { quality: { base: 66, mic: 0.8, charisma: 0.4, noise: 14 }, viral: { minQuality: 84, chance: 0.4 } } } }] },
        { weight: 2, text: `You lose the thread and the timing slips. A producer is clearly grinding teeth in the truck.`, effects: [{ pop: -0.6 }, { conf: -4 }, { event: { type: 'promo_delivered', participants: ['creative'], summary: 'Lost the thread of a freestyle promo.', data: { quality: { base: 40, mic: 0.4, noise: 10 } } } }] } ] },
      { id: 'blend', label: 'Hit the key lines and fill the rest your way', risk: 'med', outcomes: [
        { weight: 3, bonus: { mic: 0.5 }, text: `The structure keeps you honest and your voice keeps it alive. The production team thanks you, and the crowd cheers.`, effects: [{ pop: 0.7 }, { conf: 2 }] },
        { weight: 1, text: `The seams show, and the promo feels half-scripted and half-lost.`, effects: [{ pop: 0.1 }, { conf: -1 }] } ] },
      { id: 'ask_notes', label: 'Ask for a rewrite before air', risk: 'low', result: `{creative.first} takes the notes and delivers a better version, just in time. It costs you an afternoon.`, effects: [{ pop: 0.3 }, { conf: 1 }, { fatigue: 5 }] },
    ],
  },
  {
    id: 'crt_catchphrase_imposed', category: 'creative', title: 'The Catchphrase Nobody Asked For', weight: 1.5, cooldownDays: 140, maxPerCareer: 2,
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { popularity: { gte: 40 }, promos: { gte: 3 } } },
    slots: { phrase: ['"Shut the gate!"', '"Welcome to the show!"', '"No refunds!"', '"Pay attention!"'], plan: ['on every promo', 'at the end of every match', 'in every social post', 'on merchandise'] },
    body: [`Creative has chosen a catchphrase for you: {phrase}. The writers want it used {plan}, and a T-shirt design is already on the printing floor.`, `Some catchphrases write themselves into history and some are quietly retired. The crowd decides, and they do not take notes.`],
    choices: [
      { id: 'sell_it', label: 'Embrace it and teach the crowd the response', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.6 }, text: `By week two, the whole arena shouts it back. The T-shirts sell out in a venue or two.`, effects: [{ pop: 0.9 }, { money: 4000 }, { conf: 1 }] },
        { weight: 2, text: `The crowd refuses to play along. You say it, and it dies in the dark.`, effects: [{ pop: -0.4 }, { conf: -3 }, { money: 800 }] } ] },
      { id: 'twist', label: 'Twist it into something that sounds like you', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.3 }, text: `Your rework is sharper and better. The crowd takes it up, and creative claims the idea as theirs.`, effects: [{ pop: 0.7 }, { conf: 2 }, { money: 2500 }] },
        { weight: 1, text: `The new version is neither the original nor yours, and it satisfies nobody.`, effects: [{ pop: -0.1 }, { conf: -1 }] } ] },
      { id: 'refuse', label: 'Refuse to say it on air', risk: 'high', result: `You hold the line. The T-shirts are pulped, and creative remembers that you are the kind of talent who argues.`, effects: [{ conf: 3 }, { pop: -0.2 }, { money: -1500 }] },
      { id: 'use_sparingly', label: 'Use it sparingly, only in the big moments', risk: 'low', result: `A compromise creative can live with. It becomes a signature in the right places and stays out of the way in the rest.`, effects: [{ pop: 0.3 }, { conf: 1 }, { money: 1000 }] },
    ],
  },
  {
    id: 'crt_entrance_music', category: 'creative', title: 'The New Entrance Theme', weight: 1.5, cooldownDays: 150, maxPerCareer: 2,
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { sound: ['a thudding industrial beat', 'a retro guitar riff', 'an orchestral swell', 'a bright electro-pop hook'], reason: ['licensing costs', 'a rebranding push', 'a producer\'s pet project', 'a feud that needs a new sound'] },
    body: [`Creative is replacing your entrance music with {sound}, citing {reason}. The demo plays through the production room speakers, and the room turns to watch your reaction.`, `Your old theme was something fans knew by heart. A new one risks a flat first night.`],
    choices: [
      { id: 'embrace', label: 'Embrace the change and build your walk to it', risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `You choreograph the walk to the beat, and the first night is electric. The track lingers in the head for days.`, effects: [{ pop: 0.7 }, { conf: 2 }, { fatigue: 3 }] },
        { weight: 1, text: `The new track fails to excite the building. The crowd waits for the match to start.`, effects: [{ pop: -0.2 }, { conf: -1 }, { fatigue: 3 }] } ] },
      { id: 'keep_old', label: 'Fight to keep the old theme', risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `Your case is passionate and persuasive. The old track stays, and the fans thank you.`, effects: [{ conf: 3 }, { pop: 0.2 }, { money: -1000 }] },
        { weight: 2, text: `The licensing math wins. The theme is dropped regardless, and you feel like you lost twice.`, effects: [{ conf: -2 }, { pop: -0.2 }] } ] },
      { id: 'remix', label: 'Suggest a remix that blends both', risk: 'low', result: `The remix keeps the crowd\'s muscle memory and adds a new texture. Creative approves with a shrug.`, effects: [{ pop: 0.4 }, { conf: 1 }, { money: -800 }] },
      { id: 'demo_pitch', label: 'Commission your own track from a friend', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.3 }, text: `Your friend delivers a blazing track. Creative agrees to use it, and the fans quote it.`, effects: [{ pop: 0.9 }, { conf: 3 }, { money: -4000 }] },
        { weight: 2, text: `The track is not what you hoped, and you pay for the studio time anyway.`, effects: [{ pop: -0.1 }, { conf: -2 }, { money: -4000 }] } ] },
    ],
  },
  {
    id: 'crt_own_storyline_pitch', category: 'creative', title: 'Your Chance to Pitch a Storyline', weight: 1.5, cooldownDays: 120, maxPerCareer: 3,
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { popularity: { gte: 45 }, promos: { gte: 5 } } },
    slots: { idea: ['a long-simmering rivalry', 'a heel stable of your own', 'a mentor-protege story', 'a quest for a vacated title'], room: ['a conference-room whiteboard', 'a phone call with the head writer', 'a late-night email chain', 'a lunch with the writers'] },
    body: [`{creative.name} has opened a window for talent to pitch their own storylines. You have been circling {idea} for weeks, and the pitch is set for {room}.`, `This is a rare moment when your voice feeds directly into the show. It is also a place where weak ideas die quickly and leave a mark.`],
    choices: [
      { id: 'full_pitch', label: 'Prepare a full written pitch with beats', risk: 'med', outcomes: [
        { weight: 3, bonus: { mic: 0.4, charisma: 0.4 }, text: `Your pitch is crisp and specific. {creative.first} circles two ideas and takes them to the head writer.`, effects: [{ pop: 0.8 }, { conf: 3 }, { fatigue: 8 }] },
        { weight: 1, text: `The pitch does not survive the room. The notes are kind and the answer is no.`, effects: [{ conf: -2 }, { fatigue: 8 }] } ] },
      { id: 'sell_vibe', label: 'Pitch the feeling, not the plot', risk: 'low', result: `A quick sell with energy and gaps. {creative.first} loves the tone and takes it from there. You do not get final say.`, effects: [{ pop: 0.3 }, { conf: 1 }, { fatigue: 3 }] },
      { id: 'steal_spotlight', label: 'Pitch a story that makes you the centre', risk: 'high', outcomes: [
        { weight: 2, bonus: { confidence: 0.4 }, text: `Your ambition is clear and the idea has a spine. The writers give you the next three weeks.`, effects: [{ pop: 1.0 }, { conf: 3 }, { fatigue: 6 }] },
        { weight: 2, text: `The pitch reads as ego, and one of the senior writers complains to the head of creative.`, effects: [{ pop: -0.4 }, { conf: -3 }, { fatigue: 6 }] } ] },
      { id: 'pass', label: 'Let the writers write: you will just perform', risk: 'low', result: `You skip the pitch and keep your head down. The decision is respected, and you are not on anyone\'s radar for new ideas.`, effects: [{ conf: -1 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'crt_rivalry_assignment', category: 'creative', title: 'Creative Pairs You With {foe.name}', weight: 2, cooldownDays: 80, maxPerCareer: 5,
    cast: { creative: { pick: 'staff', role: 'creative' }, foe: { pick: 'roster', tier: { gte: 1 }, sameBrand: true } },
    trigger: { rivalry: { none: true }, stat: { matches: { gte: 10 } } },
    slots: { angle: ['a former friendship that soured', 'a dispute over a missed opportunity', 'a rivalry of rival gyms', 'a mutual obsession with the same title'], promise: ['an easy build', 'a memorable run on TV', 'the best chance for the next push', 'a story the whole locker room will follow'] },
    body: [`{creative.name} has picked {foe.name} as your next feud, built around {angle}. The pitch promises {promise}, and the paperwork is already printed.`, `You have worked with {foe.first} before, and know the strengths and the quirks. Whether you like the pairing or not, it has been decided above you.`],
    choices: [
      { id: 'accept', label: 'Accept the feud and start building it', risk: 'low', result: `A solid, steady build. You and {foe.first} find a rhythm, and the story gains heat week by week.`, effects: [{ rivalry: { who: 'foe', heat: 15 } }, { rel: { who: 'foe', heat: 8 } }, { pop: 0.4 }, { fatigue: 4 }] },
      { id: 'upgrade', label: 'Suggest a stipulation to raise the stakes', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.4 }, text: `The extra stakes wake up the writers. The first segment draws a visible lift in reaction.`, effects: [{ rivalry: { who: 'foe', heat: 18 } }, { rel: { who: 'foe', heat: 10 } }, { booking: { who: 'foe', type: 'no_dq' } }, { pop: 0.7 }, { fatigue: 5 }] },
        { weight: 1, text: `The stipulation is rejected, and {creative.first} is irritated that you added a condition.`, effects: [{ rivalry: { who: 'foe', heat: 10 } }, { conf: -2 }] } ] },
      { id: 'ask_other', label: 'Ask for a different opponent', risk: 'high', outcomes: [
        { weight: 1, bonus: { confidence: 0.4 }, text: `A different name is slotted in. The re-write buys goodwill, and the new partner is thrilled.`, effects: [{ conf: 2 }, { pop: 0.2 }] },
        { weight: 2, text: `The request is denied, and {creative.first} notes in the margin that you are hard to book.`, effects: [{ conf: -2 }, { pop: -0.3 }, { rivalry: { who: 'foe', heat: 8 } }] } ] },
      { id: 'befriend', label: 'Reach out to {foe.first} before it starts', risk: 'low', result: `A coffee and a plan. You and {foe.first} go in as partners, and the build feels tighter for it.`, effects: [{ rivalry: { who: 'foe', heat: 10 } }, { rel: { who: 'foe', trust: 8, respect: 4 } }, { pop: 0.3 }, { fatigue: 3 }] },
    ],
  },
  {
    id: 'crt_script_changed_late', category: 'creative', title: 'The Script Changes Minutes Before Air', weight: 2, cooldownDays: 60, maxPerCareer: 6, contexts: ['pre_show', 'show_day', 'weekly'],
    cast: { producer: { pick: 'staff', role: 'producer' } },
    trigger: { stat: { matches: { gte: 12 } } },
    slots: { change: ['your finish is reversed', 'your promo is cut in half', 'a new opponent is substituted', 'your entrance is moved to the end'], notice: ['ten minutes', 'two minutes', 'thirty seconds', 'a note slipped under the door'] },
    body: [`{producer.name} tells you with {notice} to go that {change}. The room is full of people pretending to be calm.`, `Your match plan, your preparation and your pride are about to get rearranged. The only question is how.`],
    choices: [
      { id: 'adapt', label: 'Adapt on the fly and make it work', risk: 'med', outcomes: [
        { weight: 3, bonus: { confidence: 0.6 }, text: `You rebuild the match in your head and sell the change as if it were always planned. The producer shakes your hand.`, effects: [{ pop: 0.5 }, { conf: 3 }, { fatigue: 5 }] },
        { weight: 1, text: `The change leaves you a half-step behind. A mis-timed spot goes out live, and the replay is unkind.`, effects: [{ pop: -0.3 }, { conf: -3 }, { fatigue: 5 }] } ] },
      { id: 'protest', label: 'Protest the change loudly', risk: 'high', result: `The room hears every word. The producer holds the line, and your reputation takes a bruise.`, effects: [{ conf: 1 }, { pop: -0.3 }, { fatigue: 3 }] },
      { id: 'negotiate', label: 'Negotiate a small compromise in the hallway', risk: 'low', result: `Thirty seconds of horse-trading earns you a better spot. The producer respects the speed.`, effects: [{ conf: 1 }, { pop: 0.2 }, { fatigue: 3 }] },
      { id: 'blame', label: 'Make it clear this was not your decision', risk: 'med', result: `You tell anyone nearby that the change was not yours. It is true, and it makes you sound petty.`, effects: [{ conf: -1 }, { pop: -0.2 }] },
    ],
  },
  {
    id: 'crt_manager_pairing', category: 'creative', title: 'Creative Wants to Give You a Manager', weight: 1.5, cooldownDays: 160, maxPerCareer: 2,
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { mic: { lte: 60 }, popularity: { gte: 30 } } },
    slots: { type: ['a fast-talking showman', 'a silent, ominous enforcer', 'a comedic sidekick', 'a snarling veteran'], pitch: ['to cover your weak spots on the mic', 'to add an extra layer of spectacle', 'to give you a mentor on screen', 'to open up new storyline options'] },
    body: [`{creative.name} proposes pairing you with {type}, {pitch}. The pairing would run for months and put another voice in your corner.`, `A good manager can lift a wrestler for years. A bad one can swallow every segment you are in.`],
    choices: [
      { id: 'accept', label: 'Accept and welcome the new partner', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `The chemistry is instant. Your promos grow sharper with someone to play against, and fans lean in.`, effects: [{ pop: 0.9 }, { conf: 2 }, { mic: 1 }, { fatigue: 3 }] },
        { weight: 1, text: `The manager steals the spotlight, and you spend the first month watching your own segments get shorter.`, effects: [{ pop: 0.1 }, { conf: -3 }, { fatigue: 3 }] } ] },
      { id: 'audition', label: 'Ask for a two-week audition first', risk: 'low', result: `Creative agrees to a trial. The result is a smoother start, if a slower one.`, effects: [{ pop: 0.3 }, { conf: 1 }, { fatigue: 2 }] },
      { id: 'decline', label: 'Decline: you want to carry yourself', risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.4 }, text: `You prove that you can handle the talking. Creative drops the idea, and the crowd approves of the independence.`, effects: [{ pop: 0.4 }, { conf: 3 }] },
        { weight: 1, text: `Your next promo is a stumble. Creative quietly reminds you of the offer.`, effects: [{ pop: -0.3 }, { conf: -2 }] } ] },
      { id: 'pick_own', label: 'Propose your own choice of manager', risk: 'med', result: `Creative says it will think about it. A week later, your pick is rejected for budget reasons, but a compromise arrives.`, effects: [{ conf: 1 }, { pop: 0.1 }, { fatigue: 2 }] },
    ],
  },
  // ============================================================== OPPORTUNITY
  {
    id: 'opp_sponsor_clash', category: 'opportunity', title: 'A Sponsor Offer That Clashes With Your Image', weight: 2, cooldownDays: 110, maxPerCareer: 4, major: true,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { stat: { popularity: { gte: 45 } } },
    slots: { product: ['a sugary breakfast cereal', 'a budget airline', 'a fizzy energy drink', 'a pet-food brand'], clash: ['your tough-guy act', 'your serious-craftsman image', 'your anti-establishment persona', 'your menacing silence'] },
    body: [`{agent.name} has landed an offer from {product}: two days of shooting, a generous fee and a campaign built around your face. The only problem is that the sponsor\'s brand clashes with {clash}.`, `The fee is real money. The fans, who know every gesture you make, may not forgive a wink that looks like a sell-out.`],
    choices: [
      { id: 'sign', label: 'Sign the deal and film the ad straight', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The ad is better than anyone expected and it gets quoted back to you in arenas. The cheque clears on a Friday.`, effects: [{ money: 30000 }, { pop: 0.3 }, { fatigue: 6 }] },
        { weight: 2, text: `Fans accuse you of selling out. The ad plays on every channel and the chants start in the cheap seats.`, effects: [{ money: 30000 }, { pop: -0.8 }, { conf: -3 }, { fatigue: 6 }] } ] },
      { id: 'twist_it', label: 'Sign but write the ad as a joke on your own image', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.6, mic: 0.3 }, text: `The self-parody wins the internet. The sponsor is stunned by the buzz, and the money doubles on the next renewal.`, effects: [{ money: 22000 }, { pop: 1.1 }, { conf: 2 }, { fatigue: 7 }, { event: { type: 'social_post', participants: [], summary: 'Subverted a sponsor ad with self-parody.', data: { quality: { base: 64, charisma: 0.6, mic: 0.3, noise: 12 }, viral: { minQuality: 80, chance: 0.45 } } } }] },
        { weight: 1, text: `The sponsor hates it and pulls the ad. You keep half the fee and a reputation for being hard to work with.`, effects: [{ money: 8000 }, { pop: -0.1 }, { conf: -2 }, { fatigue: 7 }] } ] },
      { id: 'decline', label: 'Turn it down to protect your image', risk: 'low', result: `Your agent sighs. The fans will never know what they missed, and you sleep fine knowing you did not trade the brand for a cheque.`, effects: [{ conf: 3 }, { pop: 0.2 }] },
      { id: 'counter_price', label: 'Counter with a steep price and strict terms', risk: 'med', outcomes: [
        { weight: 1, text: `The sponsor blinks and agrees. You sign with a legal clause and a fat cheque.`, effects: [{ money: 45000 }, { pop: -0.3 }, { fatigue: 6 }] },
        { weight: 2, text: `The sponsor walks. Your agent says the price was fair and the sponsor was not.`, effects: [{ conf: 1 }, { pop: 0.1 }] } ] },
    ],
  },
  {
    id: 'opp_video_game_scan', category: 'opportunity', title: 'The Video Game Studio Wants a Scan', weight: 1.5, cooldownDays: 160, maxPerCareer: 2,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { minYear: 2000, stat: { popularity: { gte: 40 }, careerYears: { gte: 1 } } },
    slots: { session: ['a two-day motion-capture shoot', 'a studio voice-acting session', 'a full-body photogrammetry day', 'a rapid-fire move-set recording'], request: ['a dozen signature moves', 'a custom entrance', 'a taunt sequence', 'a signature promo line'] },
    body: [`A game studio has asked for {session} to capture {request}, with a licence for your likeness in the next title. {agent.name} has read the contract and says the terms are workable.`, `You will be in a suit of dots in a warehouse in the morning, jumping on a mat in front of forty cameras and one anxious director.`],
    choices: [
      { id: 'full_session', label: 'Give it your full effort and a day of retakes', risk: 'low', outcomes: [
        { weight: 3, bonus: { charisma: 0.3 }, text: `The studio loves it and your character turns out remarkably true to the real thing. Fans rate your in-game rating higher than their own.`, effects: [{ pop: 0.6 }, { money: 12000 }, { fatigue: 10 }, { conf: 2 }] },
        { weight: 1, text: `A bad landing in the mocap rig aches for days. The footage is great, though, and the cheque cleared.`, effects: [{ pop: 0.5 }, { money: 12000 }, { fatigue: 14 }, { injury: { part: 'legs', severity: 1, days: 7 } }] } ] },
      { id: 'negotiate_royalty', label: 'Negotiate a royalty on sales', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The studio meets you halfway. A small, rolling share gives you a second source of income.`, effects: [{ money: 18000 }, { pop: 0.3 }, { fatigue: 8 }] },
        { weight: 1, text: `They pull the offer and sign another wrestler in the end. You are left wondering.`, effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'refuse_likeness', label: 'Decline: you will not sell your likeness', risk: 'low', result: `A principled no. Fans on forums argue about it for a week, and the studio fills your slot with a lookalike.`, effects: [{ conf: 2 }, { pop: -0.2 }] },
      { id: 'send_ringgear', label: 'Provide only the ring gear and no motion work', risk: 'low', result: `The studio makes do with your outfit and some stock animation. The result is serviceable and forgettable.`, effects: [{ money: 4000 }, { pop: 0.1 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'opp_reality_show', category: 'opportunity', title: 'A Reality Show Wants a Wrestler', weight: 1.5, cooldownDays: 180, maxPerCareer: 2, major: true,
    cast: { producer: { pick: 'staff', role: 'producer' }, host: { pick: 'media', kind: 'host' } },
    trigger: { minYear: 2003, stat: { popularity: { gte: 55 } } },
    slots: { format: ['a celebrity cooking contest', 'an island survival challenge', 'a home-renovation race', 'a dance competition'], run: ['a two-week shoot', 'a six-week commitment', 'a single weekend special', 'a travelling series across five cities'] },
    body: [`{host.name} is fronting {format} and the producers want you as a headline contestant. The commitment is {run}, with cameras in your face and a prize for charity.`, `{producer.name} from the wrestling side is lukewarm, saying the schedule would collide with the road. The money is good and the exposure is huge.`],
    choices: [
      { id: 'sign_up', label: 'Sign up and play to win', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.7 }, text: `The cameras love you. The public sees a funnier, softer you, and every wrestling show you do afterwards has a bigger crowd.`, effects: [{ pop: 1.5 }, { money: 25000 }, { fatigue: 15 }, { conf: 3 }] },
        { weight: 2, text: `You come across as stiff and grumpy in the edit. The wrestling fans are not impressed, and the casual audience never warms to you.`, effects: [{ pop: -0.4 }, { money: 25000 }, { fatigue: 15 }, { conf: -3 }] } ] },
      { id: 'cameo', label: 'Appear for a single episode only', risk: 'low', result: `A light, fun cameo. You get the reach without the commitment, and the producers are polite about it.`, effects: [{ pop: 0.6 }, { money: 6000 }, { fatigue: 4 }] },
      { id: 'decline_loyal', label: 'Decline to stay focused on the ring', risk: 'low', result: `The road is the road. Colleagues respect the focus, though your agent finds a new pastime of sulking.`, effects: [{ conf: 2 }, { pop: -0.2 }, { money: -1000 }] },
      { id: 'negotiate_time', label: 'Ask for a schedule built around your dates', risk: 'med', outcomes: [
        { weight: 2, text: `The show bends and pays a premium. You get the best of both worlds and a lot of fatigue.`, effects: [{ pop: 0.9 }, { money: 18000 }, { fatigue: 14 }] },
        { weight: 1, text: `The production company moves on to the next name on the list.`, effects: [{ pop: -0.1 }, { conf: -1 }] } ] },
    ],
  },
  {
    id: 'opp_movie_cameo', category: 'opportunity', title: 'A Small Role in a Film', weight: 1.3, cooldownDays: 200, maxPerCareer: 2,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { minYear: 2000, stat: { popularity: { gte: 55 }, charisma: { gte: 50 } } },
    slots: { genre: ['an action comedy', 'a family adventure', 'a low-budget horror film', 'a sports drama'], role: ['a nightclub bouncer', 'a henchman with one great line', 'a small-town sheriff', 'a loud wrestling coach'] },
    body: [`{agent.name} lands a call from a production company casting {genre}. They want you to play {role}, three days of shooting, a few lines and a pay cheque.`, `The set will be slow and very quiet compared with an arena, and your performance will be judged by people who have never seen you wrestle.`],
    choices: [
      { id: 'take_role', label: 'Take the role and treat it like a master class', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.7 }, text: `You show up prepared and make the director smile. The scene is the one the trailer uses, and the fans drag new audiences to your matches.`, effects: [{ pop: 1.0 }, { money: 20000 }, { fatigue: 10 }, { charisma: 1 }] },
        { weight: 1, text: `The take count is humiliating. The director is polite, the editor cuts you mostly out, and you get through it with your pride.`, effects: [{ pop: 0.1 }, { money: 20000 }, { fatigue: 10 }, { conf: -3 }] } ] },
      { id: 'bigger_part', label: 'Push for a bigger part with more lines', risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.4 }, text: `The studio rewrites a scene and you get a real moment. Nobody expects it, and you pull it off.`, effects: [{ pop: 1.3 }, { money: 30000 }, { fatigue: 14 }, { conf: 3 }] },
        { weight: 2, text: `The producers say no and give the part to someone else.`, effects: [{ conf: -2 }, { pop: -0.1 }] } ] },
      { id: 'stunt_only', label: 'Offer to do stunts instead of acting', risk: 'low', result: `Less glamorous, but a lot of fun. You get paid for the thing you are best at, and the cheque is smaller.`, effects: [{ money: 8000 }, { fatigue: 8 }, { pop: 0.2 }, { injury: { part: 'torso', severity: 1, days: 5 } }] },
      { id: 'turn_down', label: 'Turn it down: the schedule is full', risk: 'low', result: `A tidy no. The agent shrugs, and a lesser name gets the part.`, effects: [{ conf: 1 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'opp_book_deal', category: 'opportunity', title: 'A Publisher Wants Your Story', weight: 1.3, cooldownDays: 220, maxPerCareer: 2,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { stat: { careerYears: { gte: 4 }, popularity: { gte: 55 } } },
    slots: { form: ['a full autobiography', 'a motivational book', 'a graphic novel', 'a ghostwritten memoir'], tone: ['brutally honest', 'comic and warm', 'a dark behind-the-scenes account', 'a careful, brand-safe account'] },
    body: [`A publishing house has offered you a deal for {form}, and the editor wants it to be {tone}. The advance is substantial and there is a deadline within the year.`, `The temptation to say everything is real. So is the possibility that colleagues will not be pleased with what you say.`],
    choices: [
      { id: 'tell_all', label: 'Tell the whole story, names and all', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, mic: 0.3 }, text: `The book climbs the bestseller list. Critics call it honest and funny, and the locker room reads it in silence.`, effects: [{ money: 40000 }, { pop: 1.2 }, { conf: 2 }, { fatigue: 12 }] },
        { weight: 2, text: `A chapter about a colleague leaks early. The heat from the locker room is immediate and long-lasting.`, effects: [{ money: 40000 }, { pop: 0.3 }, { conf: -2 }, { fatigue: 12 }] } ] },
      { id: 'safe_version', label: 'Write the safe, brand-friendly version', risk: 'low', result: `Pleasant, uncontroversial, and in every airport. Readers enjoy it and it earns out in a year or two.`, effects: [{ money: 20000 }, { pop: 0.4 }, { fatigue: 8 }] },
      { id: 'ghost', label: 'Hire a ghostwriter and approve the draft', risk: 'med', outcomes: [
        { weight: 2, text: `The ghostwriter nails your voice. The book reads better than you could have written it.`, effects: [{ money: 12000 }, { pop: 0.5 }, { fatigue: 3 }] },
        { weight: 1, text: `The book is bland, and a reviewer notices it does not sound like you.`, effects: [{ money: 12000 }, { pop: -0.2 }, { conf: -2 }, { fatigue: 3 }] } ] },
      { id: 'later', label: 'Say not yet: your story is still being written', risk: 'low', result: `The editor says to call back in five years. You keep your secrets, and the publisher signs someone else.`, effects: [{ conf: 1 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'opp_merch_line', category: 'opportunity', title: 'Your Own Merchandise Line', weight: 1.5, cooldownDays: 160, maxPerCareer: 3,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { stat: { popularity: { gte: 50 } } },
    slots: { product: ['a streetwear collection', 'a line of collectible figures', 'a beer-mug and poster range', 'a children\'s clothing line'], pitch: ['hand-picked by you', 'designed around your catchphrases', 'built around your entrance', 'tied to a popular local artist'] },
    body: [`A merchandise company wants to launch {product}, {pitch}. {agent.name} has run the numbers and says the margin is decent but the up-front investment is yours.`, `If it works, it will fund your career. If it flops, you own a warehouse of unsold stock.`],
    choices: [
      { id: 'invest', label: 'Invest your own money in the full line', risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The first drop sells out, and the second is bigger. A sleepy warehouse wakes up, and the fans wear your colours.`, effects: [{ money: 30000 }, { pop: 0.8 }, { conf: 2 }] },
        { weight: 2, text: `The designs miss and the stock moves slowly. You take a loss and learn a lesson.`, effects: [{ money: -15000 }, { pop: -0.1 }, { conf: -3 }] } ] },
      { id: 'license', label: 'License your name for a royalty only', risk: 'low', result: `No up-front risk, a small steady return and little creative control. The line is fine, and the profits are modest.`, effects: [{ money: 7000 }, { pop: 0.2 }] },
      { id: 'collaborate', label: 'Collaborate with a fan artist on the designs', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `The fan art is better than anything the company drew. The community loves it, and the artist weeps.`, effects: [{ money: 12000 }, { pop: 0.9 }, { conf: 2 }] },
        { weight: 1, text: `A copyright snag delays the launch and eats the profit.`, effects: [{ money: -2000 }, { pop: -0.1 }] } ] },
      { id: 'pass', label: 'Pass and focus on wrestling', risk: 'low', result: `You stay out of it. The company finds another name, and your closet stays uncluttered.`, effects: [{ conf: 1 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'opp_charity_gala', category: 'opportunity', title: 'A Gala Dinner in {city}', weight: 1.3, cooldownDays: 150, maxPerCareer: 3,
    cast: { host: { pick: 'media', kind: 'host' } },
    trigger: { stat: { popularity: { gte: 50 } } },
    slots: { city: ['a grand hotel', 'a museum hall', 'a civic centre', 'a charity auction house'], role: ['a guest of honour', 'an auction host', 'a keynote speaker', 'a live-auction bidder'] },
    body: [`{host.name} is chairing a charity gala at {city} and wants you there as {role}. Black tie, a seated dinner and six hundred guests who will remember how you carried yourself.`, `It is not a wrestling crowd. They are donors, executives, and one or two local celebrities who will be taking photographs.`],
    choices: [
      { id: 'dazzle', label: 'Dress sharp and work the room', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.7 }, text: `You talk to everyone for ten minutes. By dessert, a producer, an executive and a philanthropist are all asking you for lunch.`, effects: [{ pop: 0.7 }, { conf: 3 }, { fatigue: 6 }, { money: -1500 }] },
        { weight: 1, text: `You trip over a joke in front of the head table. Nobody minds, though your tuxedo does.`, effects: [{ pop: 0.1 }, { conf: -2 }, { fatigue: 6 }, { money: -1500 }] } ] },
      { id: 'big_bid', label: 'Make a headline-grabbing donation on stage', risk: 'low', result: `A big number, a bigger cheer. The charity thanks you with a plaque, and your bank statement thanks you with a groan.`, effects: [{ pop: 0.8 }, { conf: 2 }, { money: -12000 }, { fatigue: 3 }] },
      { id: 'brief', label: 'Attend for an hour, then slip out', risk: 'low', result: `Polite, brief and exactly enough. Nobody remembers you, which is fine.`, effects: [{ pop: 0.1 }, { fatigue: 2 }] },
      { id: 'decline', label: 'Decline: you hate formal events', risk: 'low', result: `A kind apology and a donation by mail. The organiser is gracious, and you spend the night on your couch.`, effects: [{ fatigue: -5 }, { money: -1000 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'opp_action_figure', category: 'opportunity', title: 'Designing Your Action Figure', weight: 1.2, cooldownDays: 200, maxPerCareer: 2,
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { popularity: { gte: 50 } } },
    slots: { feature: ['a removable mask', 'a championship belt accessory', 'a bobblehead variant', 'a glow-in-the-dark chase edition'], dispute: ['the ring gear colours', 'your pose', 'the accessories', 'the packaging copy'] },
    body: [`The toy company is finalising your figure and wants your input on {dispute}. The pitch includes {feature}, and {creative.name} has set aside an afternoon for the review.`, `You are looking at a pocket-sized version of yourself in a hundred thousand children\'s hands. There is no easy way to do it right.`],
    choices: [
      { id: 'detail', label: 'Obsess over every detail and every paint stroke', risk: 'low', result: `The prototype takes three revisions, and the final figure is a cut above. Collectors notice the care.`, effects: [{ pop: 0.5 }, { conf: 2 }, { fatigue: 6 }, { money: 3000 }] },
      { id: 'kids_first', label: 'Make it friendly and playable for children', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `Parents love the sturdy, cheerful figure. It sells through the holidays, and kids carry it to your signings.`, effects: [{ pop: 0.8 }, { money: 6000 }, { conf: 1 }] },
        { weight: 1, text: `Collectors call it soft. The figure sells, and the forums are lukewarm.`, effects: [{ pop: 0.1 }, { money: 4000 }, { conf: -1 }] } ] },
      { id: 'rare_variant', label: 'Demand a rare chase variant for collectors', risk: 'med', outcomes: [
        { weight: 2, text: `The variant becomes the one everyone wants. The resale market goes quietly wild, and so does your merch revenue.`, effects: [{ pop: 0.6 }, { money: 9000 }, { fatigue: 3 }] },
        { weight: 1, text: `The chase figure is miscast and gets recalled. The story is small but embarrassing.`, effects: [{ pop: -0.3 }, { money: -1000 }, { conf: -2 }] } ] },
      { id: 'sign_off', label: 'Approve it without comment', risk: 'low', result: `Fast and easy. The figure ships exactly as designed, and so does the mistake on the box.`, effects: [{ money: 2500 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'opp_guest_commentary', category: 'opportunity', title: 'A Guest Spot on Commentary', weight: 1.5, cooldownDays: 110, maxPerCareer: 3,
    cast: { commentator: { pick: 'media', kind: 'commentator' } },
    trigger: { injured: false, stat: { mic: { gte: 50 }, popularity: { gte: 45 } } },
    slots: { match: ['a mid-card showcase', 'a television main event', 'a rival\'s title defence', 'a tag-team bout'], mood: ['an electric crowd', 'a pin-drop silence', 'a distracted audience', 'a chanting crowd'] },
    body: [`{commentator.name} has invited you to the announce table for {match}, in front of {mood}. You will wear a headset and talk about the thing you know best, with a live monitor in front of you.`, `This is a chance to be funny, to be fair and to show you can lead a broadcast. You will also be talking about people you work with.`],
    choices: [
      { id: 'be_pro', label: 'Call it fairly and add insight', risk: 'low', outcomes: [
        { weight: 3, bonus: { mic: 0.5 }, text: `You describe the match with warmth and fairness. {commentator.first} says you are welcome back, and the wrestlers send a thank-you.`, effects: [{ pop: 0.5 }, { conf: 2 }, { fatigue: 4 }, { mic: 1 }] },
        { weight: 1, text: `You call a move wrong and blame yourself for ten minutes, though no one notices.`, effects: [{ pop: 0.1 }, { conf: -1 }, { fatigue: 4 }] } ] },
      { id: 'be_heel', label: 'Cheer on the villain and needle the face', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, mic: 0.4 }, text: `You play it with a wink and a sneer. The announce desk laughs, and the arena boos you in delight.`, effects: [{ pop: 0.9 }, { conf: 2 }, { fatigue: 4 }] },
        { weight: 1, text: `A wrestler does not take the jokes kindly. The tension carries into the locker room.`, effects: [{ pop: 0.3 }, { conf: -2 }, { fatigue: 4 }] } ] },
      { id: 'plug_yourself', label: 'Use the slot to promote your own storyline', risk: 'med', result: `You slip your angle into the broadcast again and again. The writers love it, and the other commentators roll their eyes.`, effects: [{ pop: 0.6 }, { conf: -1 }, { fatigue: 3 }] },
      { id: 'decline', label: 'Decline: the headset is not for you', risk: 'low', result: `You skip it and spend the night on your own prep. Nobody blames you, though the table stays empty on your side.`, effects: [{ fatigue: -3 }, { conf: 1 }] },
    ],
  },
  {
    id: 'opp_host_awards', category: 'opportunity', title: 'Host the {show}', weight: 1.2, cooldownDays: 220, maxPerCareer: 2,
    cast: { producer: { pick: 'staff', role: 'producer' } },
    trigger: { minYear: 1995, stat: { popularity: { gte: 60 }, charisma: { gte: 55 } } },
    slots: { show: ['Sports Awards', 'Fan Choice Awards', 'Charity Telethon', 'Year-End Special'], script: ['a tight, safe script', 'a loose, comedic outline', 'a nostalgia-themed arc', 'a roast-heavy template'] },
    body: [`{producer.name} has been asked to recommend a host for the {show}, and your name keeps coming up. The format is {script}, with eight segments, four costume changes and about three hours of live television.`, `You would be on screen far longer than in any match. A good night makes you a household name; a bad night makes you a clip.`],
    choices: [
      { id: 'take_the_job', label: 'Take it and rehearse relentlessly', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.7, mic: 0.5 }, text: `The night goes beautifully. Your timing is crisp, the crowd laughs on cue, and a producer asks about a second season.`, effects: [{ pop: 1.5 }, { money: 18000 }, { conf: 4 }, { fatigue: 12 }, { event: { type: 'interview', participants: ['producer'], summary: 'Hosted a televised awards show.', data: { quality: { base: 66, charisma: 0.6, mic: 0.5, noise: 10 }, viral: { minQuality: 84, chance: 0.3 } } } }] },
        { weight: 1, text: `A joke dies, then another. The rest of the night is a long walk through recovery.`, effects: [{ pop: -0.2 }, { money: 18000 }, { conf: -4 }, { fatigue: 12 }] } ] },
      { id: 'co_host', label: 'Offer to co-host with a comedian', risk: 'low', result: `The comedian carries the jokes, and you handle the heart. It is a safe, pleasant night, and a lighter payday.`, effects: [{ pop: 0.6 }, { money: 8000 }, { fatigue: 6 }, { conf: 1 }] },
      { id: 'rewrite_script', label: 'Demand rewrites to fit your voice', risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.5 }, text: `The writers adapt, and the show finds a looser, funnier rhythm. It is a hit.`, effects: [{ pop: 1.2 }, { money: 14000 }, { conf: 3 }, { fatigue: 10 }] },
        { weight: 2, text: `The producers refuse and hand the job to someone more compliant.`, effects: [{ conf: -2 }, { pop: -0.2 }] } ] },
      { id: 'decline', label: 'Decline: three hours of live TV is a lot', risk: 'low', result: `You protect your time and your voice. A comedian takes the job and gives a middling performance.`, effects: [{ fatigue: -4 }, { conf: 1 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'opp_overseas_promo', category: 'opportunity', title: 'A Promotional Trip to {region}', weight: 1.3, cooldownDays: 180, maxPerCareer: 3,
    cast: { reporter: { pick: 'media', kind: 'reporter' }, exec: { pick: 'staff', role: 'executive' } },
    trigger: { stat: { popularity: { gte: 55 } } },
    slots: { region: ['Japan', 'the United Kingdom', 'Mexico', 'Australia'], stunt: ['a street-corner meet-and-greet', 'a television appearance in a different language', 'a late-night factory visit', 'a stadium walk-out'] },
    body: [`{exec.name} wants you on the next plane to {region} for {stunt}. {reporter.name} will tag along for a feature that may turn into a cover story.`, `You will cross twelve time zones for four days, sleep very little and meet thousands of people who know your name in a language you do not speak.`],
    choices: [
      { id: 'go_all_in', label: 'Go all in and learn some local phrases', risk: 'med', outcomes: [
        { weight: 3, bonus: { charisma: 0.6 }, text: `The fans adore the effort, and a clip of you stumbling through a local greeting goes round the world. The company sees real overseas numbers.`, effects: [{ pop: 1.2 }, { money: 8000 }, { fatigue: 20 }, { conf: 3 }] },
        { weight: 1, text: `Jet lag crushes you by day three. The last two stops are a blur, and you get sick on the flight home.`, effects: [{ pop: 0.5 }, { money: 8000 }, { fatigue: 28 }, { conf: -2 }] } ] },
      { id: 'light_schedule', label: 'Do the headline stops only', risk: 'low', result: `A manageable trip with a few big moments. The fans are glad you came, and the company gets what it wanted.`, effects: [{ pop: 0.6 }, { money: 4000 }, { fatigue: 12 }] },
      { id: 'make_it_work', label: 'Ask for first-class travel and an extra rest day', risk: 'med', outcomes: [
        { weight: 2, text: `The company agrees, and you arrive fresh. The tour goes better than expected.`, effects: [{ pop: 0.8 }, { fatigue: 10 }, { money: 3000 }] },
        { weight: 1, text: `{exec.first} is irritated by the demands and gives the trip to someone else.`, effects: [{ conf: -2 }, { pop: -0.2 }] } ] },
      { id: 'decline', label: 'Decline: you cannot afford the time', risk: 'low', result: `You stay home. The tour goes ahead with someone else, who returns a hero.`, effects: [{ fatigue: -4 }, { pop: -0.4 }, { conf: -1 }] },
    ],
  },
  {
    id: 'opp_comedy_roast', category: 'opportunity', title: 'You Are Invited to a Roast', weight: 1.3, cooldownDays: 170, maxPerCareer: 2,
    cast: { host: { pick: 'media', kind: 'host' }, peer: { pick: 'roster', tier: { gte: 1 } } },
    trigger: { minYear: 2005, stat: { popularity: { gte: 55 }, mic: { gte: 55 } } },
    slots: { target: ['a beloved legend', 'a notorious villain', 'a retiring announcer', 'one of the biggest stars'], style: ['a savage', 'a gentle', 'a surreal', 'an over-the-top'] },
    body: [`{host.name} is putting together {style} roast of {target}, and you have been asked to deliver a set. {peer.name} will be on the dais too, and the room is a mix of colleagues and friends.`, `The best roasts are the ones that are fond underneath. The worst are the ones where someone goes too far and cannot take it back.`],
    choices: [
      { id: 'roast_hard', label: 'Go hard and score the biggest laughs', risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.8 }, text: `Your best joke brings the house down. The roast subject claps hardest, and the clip goes everywhere.`, effects: [{ pop: 1.1 }, { conf: 3 }, { rel: { who: 'peer', respect: 3 } }, { event: { type: 'podcast', participants: ['host', 'peer'], summary: 'Brought the house down at a roast.', data: { quality: { base: 66, mic: 0.8, noise: 14 }, viral: { minQuality: 82, chance: 0.4 } } } }] },
        { weight: 2, text: `A joke lands too close. The room goes quiet, and {peer.first} gives you a look you have not seen before.`, effects: [{ pop: -0.4 }, { conf: -3 }, { rel: { who: 'peer', heat: 8, respect: -3 } }] } ] },
      { id: 'gentle', label: 'Keep it affectionate with warm stories', risk: 'low', result: `A well-liked set with a big heart. Nobody is insulted, and nobody will remember a single joke.`, effects: [{ pop: 0.4 }, { fatigue: 5 }, { rel: { who: 'peer', respect: 2 } }] },
      { id: 'target_peer', label: 'Aim your best jokes at {peer.first} instead', risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, mic: 0.4 }, text: `{peer.first} laughs the loudest. The friendship, and the heat, get a tune-up.`, effects: [{ pop: 0.7 }, { rel: { who: 'peer', respect: 3, heat: 4 } }, { conf: 2 }] },
        { weight: 1, text: `{peer.first} takes it personally. The dais is tense for the rest of the night.`, effects: [{ pop: -0.2 }, { rel: { who: 'peer', heat: 10, trust: -4 } }, { conf: -2 }] } ] },
      { id: 'decline', label: 'Decline: comedy is not your arena', risk: 'low', result: `You pass. Someone with more nerve fills the slot, and you watch from the audience with a drink.`, effects: [{ conf: 1 }, { pop: -0.1 }] },
    ],
  },
];
