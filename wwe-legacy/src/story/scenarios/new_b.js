// New situations (batch B): backstage life, personal, travel, training and finance.
// Authored per docs/SCENARIO_FORMAT.md. Staff pronouns are always plural-form, so staff are referenced by name only.
export default [
  // ======================= BACKSTAGE =======================
  {
    id: 'nb_bs_gorilla_cut', category: 'backstage', title: `Four Minutes Gone Before the Bell`, weight: 2, contexts: ['pre_show'], cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 4,
    cast: { producer: { pick: 'staff', role: 'producer' } },
    trigger: { stat: { matches: { gte: 5 } }, minYear: 1993 },
    slots: { reason: [`a talking segment that ran long in rehearsal`, `a pyro rig that refuses to reset`, `a sponsor video the network will not shorten`, `a medical scare in the opening match`], trim: [`the slow feeling-out you built to open`, `the middle sequence you rehearsed all afternoon`, `the near-fall run you wanted before the finish`] },
    body: [`{producer.name} catches you in the corridor with a headset dangling off one ear. Because of {reason}, your match just lost four minutes, and the part that goes is {trim}.`, `Your opponent is already taped and standing at the curtain, walking the spots with eyes closed. Four minutes sounds small until the moment someone makes you count what lives inside them.`],
    choices: [
      { id: 'rebuild', label: `Rebuild the match in the hallway with your opponent`, risk: 'med', outcomes: [
        { weight: 3, bonus: { overall: 0.6, confidence: 0.4 }, text: `The two of you strip it to bones, mouthing the sequence at each other with a stagehand shushing you. The match comes out leaner than the one you planned, and the crowd never smells the panic.`, effects: [{ pop: 0.5 }, { conf: 3 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 5 }] },
        { weight: 2, text: `Halfway through, one of you forgets which cut was made and a transition arrives a beat late. The scramble to fix it is visible from the cheap seats.`, effects: [{ pop: -0.3 }, { conf: -3 }, { fatigue: 6 }] } ] },
      { id: 'keep_all', label: `Insist on keeping every spot and work fast`, risk: 'high', outcomes: [
        { weight: 1, bonus: { endurance: 0.5, fatigue: -0.5 }, text: `You run the full match at a sprint and somehow land every beat. {producer.name} is waving a stopwatch from the monitor, but the crowd is on its feet when you finish.`, effects: [{ pop: 0.8 }, { conf: 4 }, { fatigue: 12 }] },
        { weight: 2, text: `The pace turns sloppy by the third minute, and a dropped hold leaves you gasping through the finish. {producer.name} is standing at the gorilla position with arms folded when you return.`, effects: [{ pop: -0.4 }, { conf: -3 }, { fatigue: 12 }, { flag: 'producer_annoyed' }] } ] },
      { id: 'sacrifice', label: `Give up your best spot to protect the finish`, risk: 'low', result: `It hurts to cut the moment you spent a week imagining. Still, the finish lands clean and {producer.name} nods once as you pass, which in that corridor counts as a handshake.`, effects: [{ pop: -0.1 }, { conf: -2 }, { fatigue: -3 }, { flag: 'producer_trusts_you' }] },
      { id: 'argue', label: `Argue that someone else should lose the four minutes`, risk: 'med', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: `{producer.name} weighs it, mutters into the headset and shaves a promo down instead. You keep most of your match, and you have just spent a favor.`, effects: [{ pop: 0.3 }, { conf: 2 }] },
        { weight: 2, text: `The answer is a flat no and a look that follows you down the stairs. The match is cut anyway, and now the person timing it knows your name for the wrong reason.`, effects: [{ conf: -2 }, { pop: -0.2 }, { flag: 'producer_annoyed' }] } ] },
    ],
  },
  {
    id: 'nb_bs_rookie_initiation', category: 'backstage', title: `Somebody Is Getting Initiated`, weight: 1.5, contexts: ['show_day', 'weekly'], cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 4,
    cast: { rookie: { pick: 'roster', tier: { lte: 1 } } }, memory: { role: 'rookie', max: 1 },
    trigger: { stat: { careerYears: { gte: 3 } } },
    slots: { tradition: [`carrying every veteran's bag to the bus`, `a hunt for a left-handed ring key`, `buying breakfast for the entire locker room`, `wearing a borrowed pair of enormous boots all night`], where: [`the loading dock`, `the aisle of the bus`, `the far end of the locker room`] },
    body: [`Some of the veterans have decided that {rookie.name} must earn the building, and today the method is {tradition}. A cluster of them has gathered near {where}, already laughing, while {rookie.they} has not yet worked out that the joke is on a clock.`, `You went through the same thing once, which is exactly why it feels harmless and not quite right at the same time. The newcomer scans the room for one friendly face and settles on yours.`],
    choices: [
      { id: 'join', label: `Join in and keep the joke going`, risk: 'low', result: `You play along, and the veterans make room for you with the easy laughter of people who are sure of each other. {rookie.first} takes it with a stiff smile and notes who stayed quiet and who didn't.`, effects: [{ conf: 2 }, { rel: { who: 'rookie', trust: -4, respect: 2 } }, { fatigue: 1 }] },
      { id: 'quiet_word', label: `Take {rookie.first} aside and explain how it works`, risk: 'low', result: `You explain what this is, how long it lasts and why the people doing it are not actually enemies. {rookie.first} relaxes by degrees, and a few of the old hands give you a look that says you are soft.`, effects: [{ rel: { who: 'rookie', trust: 6, affinity: 4 } }, { conf: 1 }, { pop: -0.1 }] },
      { id: 'cap_it', label: `Cap it at one stunt and buy the coffee yourself`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `You land a joke that lets everyone off the hook, and the veterans take the coffee with a groan. The initiation shrinks into a story, and {rookie.first} is the one telling it by the end.`, effects: [{ rel: { who: 'rookie', trust: 4, respect: 4 } }, { money: -80 }, { conf: 2 }] },
        { weight: 1, text: `One of the loudest veterans takes it as a challenge to his authority and spends the next hour muttering about people who have forgotten where they came from.`, effects: [{ money: -80 }, { conf: -2 }, { rel: { who: 'rookie', trust: 3 } }] } ] },
      { id: 'stay_out', label: `Stay out of it entirely`, risk: 'low', result: `You find a corner, tape a wrist you did not need to tape and let it run its course. Nobody is hurt, and nobody remembers you were there.`, effects: [{ fatigue: -2 }, { rel: { who: 'rookie', trust: -2 } }] },
    ],
  },
  {
    id: 'nb_bs_crew_thanks', category: 'backstage', title: `The Crew That Saved the Night`, weight: 1.5, contexts: ['post_show'], cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 4,
    trigger: { stat: { popularity: { gte: 15 } }, noFlag: 'crew_friend' },
    slots: { trouble: [`a flooded loading dock`, `a ring post that sheared off at noon`, `a truck that rolled in four hours behind schedule`, `a canvas torn clean through by the tour before ours`], hour: [`under two hours`, `a frantic ninety minutes`, `the stretch between lunch and doors`] },
    body: [`Dee, the ring crew chief, is wiping her hands on a rag when you find her after the show. It was {trouble} that nearly cost the building its ring tonight, and her crew rebuilt everything in {hour} while the locker room argued about catering.`, `Nobody on the roster mentioned it on the way out. The crew is stacking steel cases in the quiet, the way they do every night, and none of them has been thanked since Tuesday.`],
    choices: [
      { id: 'envelope', label: `Press an envelope of cash into Dee's hand`, risk: 'low', requires: { stat: { money: { gte: 300 } } }, result: `Dee looks at the envelope, then at you, and tucks it into her jacket without counting it. She does not say thank you, which tells you it landed.`, effects: [{ money: -300 }, { conf: 2 }, { flag: 'crew_friend' }] },
      { id: 'food', label: `Order food for the whole crew on your own tab`, risk: 'low', requires: { stat: { money: { gte: 200 } } }, result: `Twenty minutes later, pizza boxes are stacked on a road case and the loading dock sounds almost cheerful. You eat standing up next to a man who has built rings in fifty cities.`, effects: [{ money: -200 }, { conf: 2 }, { fatigue: 2 }, { flag: 'crew_friend' }] },
      { id: 'help_load', label: `Roll up your sleeves and help them load out`, risk: 'med', result: `You carry cases and coil cable until your back complains. The crew teases you about your form, and by the last truck door they are calling you by your first name.`, effects: [{ fatigue: 10 }, { conf: 3 }, { attr: { name: 'toughness', delta: 1 } }, { flag: 'crew_friend' }] },
      { id: 'wave', label: `Say thanks on the way out and keep walking`, risk: 'low', result: `Dee raises a hand without looking up. The words were true and cost you nothing, and everyone on the dock understands both of those facts.`, effects: [{ fatigue: -2 }, { conf: -1 }] },
    ],
  },
  {
    id: 'nb_bs_crew_whisper', category: 'backstage', title: `Dee Has Something to Tell You`, weight: 2.5, contexts: ['pre_show'], cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 3,
    cast: { producer: { pick: 'staff', role: 'producer' } },
    trigger: { flag: 'crew_friend', noFlag: 'crew_whisper_done' },
    slots: { flaw: [`a turnbuckle that keeps backing itself off`, `a soft board under the canvas near the corner`, `a ring step with a hairline crack along the weld`, `a ramp panel that rocks underfoot`], spot: [`on the bump you take in the first five minutes`, `during the run to the ropes you always use`, `where your entrance lands`] },
    body: [`Dee catches your sleeve before the doors open and lowers her voice. She is not telling you what to do, she says, but {flaw} has been bothering her people all afternoon, and she would hate for it to find you {spot}.`, `She has already told {producer.name} twice. Fixing it properly delays the show, and ignoring it means betting your body against a piece of wood.`],
    choices: [
      { id: 'back_her', label: `Take it to {producer.name} and back Dee up`, risk: 'med', outcomes: [
        { weight: 2, bonus: { popularity: 0.5 }, text: `A name on the complaint changes everything. The show starts ten minutes late, the crew fixes the problem properly, and Dee gives you a barely visible nod from the apron.`, effects: [{ conf: 3 }, { pop: 0.1 }, { flag: 'crew_whisper_done' }] },
        { weight: 1, text: `{producer.name} writes the concern down and does nothing with it, and you leave with a note in your hand and an itch in your spine. You rework your match around it.`, effects: [{ conf: -2 }, { fatigue: 3 }, { flag: 'crew_whisper_done' }] } ] },
      { id: 'change_spot', label: `Quietly move your spot somewhere safer`, risk: 'low', result: `The bump goes to a cleaner part of the ring, and your opponent only raises an eyebrow. The match is a little less spectacular, but your body keeps its warranty.`, effects: [{ pop: -0.2 }, { conf: 1 }, { fatigue: 2 }, { flag: 'crew_whisper_done' }] },
      { id: 'work_it', label: `Work the spot anyway and trust your timing`, risk: 'high', outcomes: [
        { weight: 3, bonus: { agility: 0.5, overall: 0.3 }, text: `Your landing is clean and the wood does exactly what it should. You get the pop and the secret satisfaction of knowing how close it was.`, effects: [{ pop: 0.5 }, { conf: 3 }, { flag: 'crew_whisper_done' }] },
        { weight: 2, text: `The board shifts a half inch under you and the bump goes wrong in a hurry. You finish the match, but you feel it in your lower back the moment the adrenaline leaves.`, effects: [{ injury: { part: 'torso', severity: 1, days: 14 } }, { conf: -4 }, { fatigue: 8 }, { flag: 'crew_whisper_done' }] } ] },
      { id: 'recheck', label: `Ask Dee's crew to re-check everything with you watching`, risk: 'low', result: `You stand with a flashlight while two people tap, pull and shake every corner. It eats your warm-up, but you walk out with a clear head and a ring you can trust.`, effects: [{ fatigue: 4 }, { conf: 2 }, { pop: -0.1 }, { flag: 'crew_whisper_done' }] },
    ],
  },
  {
    id: 'nb_bs_catering_table', category: 'backstage', title: `Where to Sit in Catering`, weight: 1.5, contexts: ['show_day', 'pre_show'], cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 4,
    cast: { vet: { pick: 'roster', tier: { gte: 3 } } }, memory: { role: 'vet', max: 1 },
    trigger: { stat: { careerYears: { lte: 4 } } },
    slots: { meal: [`pasta and dry chicken`, `deli trays with wilted lettuce`, `chili from a chafing dish`, `pizza that has gone cold`], table: [`the round table by the exit`, `the long table under the dented fire sign`, `the corner booth with the good outlet`] },
    body: [`Catering smells like {meal}, and the question of where to eat it is harder than the food. The only empty chairs are at {table}, where {vet.name} holds court and the conversation drops half a step when anyone new walks up.`, `Every seat in the room has an owner nobody ever announced. Newcomers learn the map the way they learn the ring, by getting it wrong in front of witnesses.`],
    choices: [
      { id: 'ask', label: `Ask {vet.name} if you can sit`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{vet.first} points a fork at an empty chair and goes back to the story. Twenty minutes later you know three things about the business that no trainer ever told you.`, effects: [{ rel: { who: 'vet', respect: 4, trust: 3 } }, { conf: 3 }, { attr: { name: 'psychology', delta: 1 } }] },
        { weight: 1, text: `The answer is a flat "Saving it," and a pair of boots land on the chair. You carry your tray back across the room with the sound of a joke following you.`, effects: [{ conf: -3 }, { rel: { who: 'vet', respect: -1 } }] } ] },
      { id: 'peers', label: `Eat with the other newcomers by the ice machine`, risk: 'low', result: `Nobody at the little table has a title or a plan, and everybody has a bruise. You trade gas-station tips and a laugh or two, and it is warmer than the big table would have been.`, effects: [{ conf: 2 }, { fatigue: -2 }, { pop: -0.1 }] },
      { id: 'sit_anyway', label: `Take the empty chair without asking`, risk: 'high', outcomes: [
        { weight: 1, bonus: { confidence: 0.6 }, text: `{vet.first} looks you over and decides the nerve is worth a plate of respect. The table makes space, and the conversation resumes at full volume.`, effects: [{ rel: { who: 'vet', respect: 6 } }, { conf: 4 }, { pop: 0.1 }] },
        { weight: 2, text: `The table goes quiet, and {vet.first} asks, very pleasantly, whether you are lost. You eat in a silence thick enough to chew.`, effects: [{ rel: { who: 'vet', respect: -5, heat: 4 } }, { conf: -4 }] } ] },
      { id: 'car', label: `Take the plate out to the car and eat alone`, risk: 'low', result: `The seat is warm from the sun and the parking lot is quiet. You finish the meal without being watched, although it is a little lonelier than you wanted to admit.`, effects: [{ fatigue: -4 }, { conf: -1 }] },
    ],
  },
  {
    id: 'nb_bs_creative_pitch', category: 'backstage', title: `Twenty Minutes in the Writers' Room`, weight: 1.5, contexts: ['weekly', 'show_day'], cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 4,
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { popularity: { gte: 20 }, mic: { gte: 35 } } },
    slots: { idea: [`a new entrance that starts in total silence`, `a series of short vignettes shot in your hometown`, `a short feud with a local legend`, `a character built around the job you had before wrestling`], room: [`a hotel conference room that smells of burnt coffee`, `the production trailer behind the arena`, `a corner booth in a hotel restaurant`] },
    body: [`{creative.name} has twenty minutes between meetings, and you have been carrying {idea} around for months. The venue is {room}, and four writers are glancing at their watches before you have said a word.`, `Pitches in this business tend to go one of two ways, and the difference is rarely the idea. It is whether the listener believes the person pitching will be easy to work with.`],
    choices: [
      { id: 'pitch_hard', label: `Pitch it aloud with full conviction`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.7, charisma: 0.4 }, text: `Your voice settles halfway through, and one of the writers puts down a pen to listen. {creative.name} says the words "I can work with that," and you walk out feeling about nine feet tall.`, effects: [{ pop: 0.4 }, { conf: 5 }, { flag: 'pitch_taken' }] },
        { weight: 2, text: `You ramble, backtrack and lose the thread in the middle. The room is polite, and politeness is the worst sound a pitch can get.`, effects: [{ conf: -4 }, { pop: -0.1 }] } ] },
      { id: 'one_page', label: `Leave a polished one-page outline instead`, risk: 'low', result: `You stay up late to cut it to a single clean page. {creative.name} takes it with a half-smile and files it somewhere, and for now it sits there waiting for a better week.`, effects: [{ fatigue: 4 }, { conf: 1 }, { flag: 'pitch_filed' }] },
      { id: 'tailor', label: `Ask what the show needs and fit your idea to that`, risk: 'med', result: `{creative.name} perks up at being asked. What comes out is half your idea and half theirs, and you leave not entirely sure which half is you.`, effects: [{ pop: 0.2 }, { conf: 1 }, { mic: 1 }] },
      { id: 'silent', label: `Keep the idea to yourself and take what you are given`, risk: 'low', result: `You nod through the meeting and say nothing about the notebook in your bag. It is a quiet ride back, and the idea sits where it always sits.`, effects: [{ conf: -3 }, { fatigue: -2 }] },
    ],
  },
  {
    id: 'nb_bs_sponsor_ribbon', category: 'backstage', title: `A Ribbon to Cut at {venue}`, weight: 1.5, contexts: ['weekly'], cooldownDays: 120, maxPerCareer: 4, categoryCooldown: 5,
    cast: { exec: { pick: 'staff', role: 'executive' } },
    trigger: { stat: { popularity: { gte: 25 } } },
    slots: { product: [`a regional mattress chain`, `a protein-bar start-up`, `a family-run auto glass shop`, `a mid-sized credit union`], venue: [`a shopping-mall atrium`, `a car-lot parking area`, `a gym grand opening`, `a supermarket entrance`] },
    body: [`The office has committed you to an appearance for {product} at {venue}, two hours before your travel day starts. {exec.name} calls it a courtesy to a valued partner, which in this business means somebody else's money is paying for your Saturday.`, `About sixty people have lined up already, mostly kids and a handful of men in decade-old merch. The manager keeps asking, in a hopeful voice, whether you could do "the voice."`],
    choices: [
      { id: 'full_act', label: `Give them the full character, voice and all`, risk: 'med', result: `You growl the catchphrase and a toddler bursts into happy tears. Your throat is raw by the end, but the line wraps around the building and the manager photographs the whole thing.`, effects: [{ pop: 0.6 }, { fatigue: 8 }, { conf: 2 }, { money: 300 }] },
      { id: 'sign_quiet', label: `Stay quiet, shake hands and sign everything`, risk: 'low', result: `You sign a hundred posters, two casts and one sandwich wrapper. It is efficient and friendly, and nobody goes home with a story to tell.`, effects: [{ pop: 0.2 }, { fatigue: 4 }, { money: 300 }] },
      { id: 'fee_haggle', label: `Ask the manager for a bigger appearance fee on the spot`, risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.5 }, text: `The manager blinks, makes a call and produces a second envelope. You leave richer, and slightly worried about how the story will be told back at head office.`, effects: [{ money: 1200 }, { conf: 2 }, { pop: -0.1 }] },
        { weight: 2, text: `The smile on the manager's face turns brittle, and the fee is not moved a cent. Word reaches {exec.name} before you reach your car.`, effects: [{ money: 300 }, { conf: -3 }, { pop: -0.3 }] } ] },
      { id: 'cut_short', label: `Do twenty minutes and leave early for the gym`, risk: 'med', result: `You apologise, point at your watch and head out while the line still has people in it. Your session is excellent, and the manager's thank-you note is noticeably short.`, effects: [{ pop: -0.3 }, { fatigue: -3 }, { conf: 1 }, { attr: { name: 'power', delta: 1 } }] },
    ],
  },
  {
    id: 'nb_bs_merch_misprint', category: 'backstage', title: `A Shirt With the Wrong Name on It`, weight: 1.5, contexts: ['show_day', 'weekly'], cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 4,
    trigger: { stat: { popularity: { gte: 20 } } },
    slots: { misprint: [`your last name missing a letter`, `a first name that belongs to somebody else`, `your catchphrase scrambled into nonsense`, `a photograph of a man you have never met`], batch: [`two hundred`, `nine hundred`, `four thousand`] },
    body: [`The merchandise manager breaks the news beside a pallet of cardboard boxes. The first run of {batch} shirts came back from the printer with {misprint}, and nobody noticed at the proof stage.`, `The invoice is already stapled to the delivery slip. Across the room, two members of the crew are laughing into their sleeves, and a line of fans is already forming at the stand, none the wiser.`],
    choices: [
      { id: 'collector', label: `Sell them as limited-edition mistakes`, risk: 'med', outcomes: [
        { weight: 2, bonus: { popularity: 0.5 }, text: `A few clever remarks turn the error into a badge of honor, and the shirts vanish by the second house show. The merch manager looks at you like you invented fire.`, effects: [{ money: 1800 }, { pop: 0.6 }, { conf: 2 }] },
        { weight: 1, text: `Buyers wrinkle their noses, and one reviewer calls it lazy. A third of the boxes go back to the warehouse unopened.`, effects: [{ money: 300 }, { pop: -0.3 }, { conf: -2 }] } ] },
      { id: 'reprint', label: `Demand the printer reprint everything at their cost`, risk: 'low', result: `You spend two evenings on the phone being polite, then firm, then less polite. The printer folds, and the shirts that arrive later are right.`, effects: [{ fatigue: 4 }, { conf: 2 }, { money: -100 }] },
      { id: 'sign_each', label: `Sign each misprint personally at the table`, risk: 'med', result: `Your wrist cramps by the fortieth shirt, but fans start asking you to sign the error itself. By the end, the line is the longest of the tour and the merch stand has to send out for more markers.`, effects: [{ fatigue: 9 }, { pop: 0.6 }, { money: 500 }] },
      { id: 'pull', label: `Pull the whole batch and swallow the loss`, risk: 'low', result: `The boxes go back in the truck and the invoice ends up on your side of the ledger. You sleep fine, and your account notices.`, effects: [{ money: -1500 }, { conf: -1 }, { fatigue: -2 }] },
    ],
  },
];
