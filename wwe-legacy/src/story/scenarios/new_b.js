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
  {
    id: 'nb_bs_stunt_pressure', category: 'backstage', title: `They Want You to Do {stunt}`, weight: 2, contexts: ['pre_show', 'show_day'], cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 4,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { stat: { matches: { gte: 10 }, fatigue: { lte: 80 } } },
    slots: { stunt: [`a dive off the top of the cage`, `a table bump from the announce position`, `a bump off a rolling stage riser`, `a ladder fall onto the floor`], reason: [`the network is asking for a clip that travels`, `attendance has been soft for a month`, `a rival show just had a big night`] },
    body: [`{agent.name} lays out the plan quietly, as if the volume might make it heavier. The company wants {stunt} from you tonight because {reason}, and the idea is already on the run sheet in pen.`, `Nobody has said it is mandatory, which is how mandatory things are usually said. Your knees remember every landing they have ever been asked to absorb.`],
    choices: [
      { id: 'do_it', label: `Do it and take the glory`, risk: 'high', outcomes: [
        { weight: 2, bonus: { toughness: 0.4, agility: 0.4 }, text: `You hit it flush, the building comes unglued and the replay package opens the next week's show. Your back sends a polite invoice, but the moment is yours.`, effects: [{ pop: 1.2 }, { conf: 5 }, { fatigue: 12 }] },
        { weight: 2, text: `The landing goes wrong by a few degrees and the air leaves you. You are on your feet for the finish, but the medical staff is waiting at the curtain with a very sober look.`, effects: [{ pop: 0.6 }, { injury: { part: 'torso', severity: 1, days: 21 } }, { fatigue: 14 }, { conf: -2 }] } ] },
      { id: 'safer', label: `Propose a safer version with the same shot`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, overall: 0.3 }, text: `{agent.name} considers it, sketches the angle on the back of a run sheet and agrees. The shot looks nearly as dangerous from the hard camera, and you get to keep your spine.`, effects: [{ pop: 0.5 }, { conf: 3 }, { fatigue: 4 }] },
        { weight: 1, text: `The idea is brushed off as "not as big," and you end up doing a tamer version without any credit for the thought. It plays small, and you feel it.`, effects: [{ pop: -0.2 }, { conf: -2 }] } ] },
      { id: 'rehearse', label: `Insist on a walk-through with the crew first`, risk: 'low', result: `You take forty minutes of ring time with two crew members and a stopwatch. The rehearsal costs your pre-show nap and gives you something better, which is a plan.`, effects: [{ fatigue: 5 }, { conf: 3 }, { pop: 0.3 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'refuse', label: `Say no and accept what comes with it`, risk: 'med', result: `{agent.name} looks at you for a long moment, then nods and crosses the line off the page. The show goes on without it, and for a few weeks you wonder who was told, and what they said.`, effects: [{ pop: -0.4 }, { conf: 2 }, { fatigue: -3 }, { flag: 'known_to_refuse' }] },
    ],
  },
  {
    id: 'nb_bs_finish_dispute', category: 'backstage', title: `A Finish You Hate`, weight: 2, contexts: ['pre_show'], cooldownDays: 120, maxPerCareer: 4, categoryCooldown: 4,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { stat: { matches: { gte: 8 } } },
    slots: { finish: [`a loss to a debuting stranger with no story behind it`, `a defeat by roll-up that makes you look sloppy`, `a loss in under three minutes`, `a clean win that buries the other person`], setting: [`in a cramped production office`, `at the curtain with the music about to cue`, `in a rental car circling the arena lot`] },
    body: [`{agent.name} reads the finish off the card {setting}, and your stomach drops by the second line. Tonight you are booked for {finish}, and the explanation is that it will make sense in about six weeks.`, `You have heard that sentence before, usually right before a change nobody explains. All the same, trust in this business is something you either extend or pay for.`],
    choices: [
      { id: 'pro', label: `Take it like a pro and do the job`, risk: 'low', result: `You nod, swallow the pride and give the finish everything. {agent.name} notices, and a remark about "the right kind of locker room attitude" is passed along.`, effects: [{ conf: -3 }, { pop: -0.2 }, { flag: 'team_player' }, { fatigue: 2 }] },
      { id: 'argue', label: `Argue for a different ending`, risk: 'high', outcomes: [
        { weight: 1, bonus: { charisma: 0.6, mic: 0.3 }, text: `You make your case without raising your voice, and {agent.name} takes it upstairs. The finish changes, and so does the way you are seen in that office.`, effects: [{ conf: 4 }, { pop: 0.3 }] },
        { weight: 3, text: `The conversation heats fast, ends faster, and the finish stays exactly as written. You carry the argument into the ring and the match suffers for it.`, effects: [{ conf: -3 }, { pop: -0.5 }, { flag: 'known_to_refuse' }] } ] },
      { id: 'ask_why', label: `Ask {agent.name} to explain the long game`, risk: 'low', result: `{agent.name} sits down and walks you through the next six weeks, including a plan you were not supposed to know about. It does not make the finish sting less, but it gives the sting a purpose.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { conf: 1 }, { pop: -0.1 }, { flag: 'long_game_known' }] },
      { id: 'counter', label: `Offer a counter finish that still serves the story`, risk: 'med', outcomes: [
        { weight: 2, bonus: { overall: 0.4 }, text: `Your counter keeps the shape of the original but lets you leave with something to build on. {agent.name} grunts, which is a yes.`, effects: [{ pop: 0.2 }, { conf: 3 }, { attr: { name: 'psychology', delta: 1 } }] },
        { weight: 1, text: `Your counter is politely taken apart in under a minute. You walk out with the original finish and a clearer picture of how little you know about the card.`, effects: [{ conf: -2 }, { fatigue: 2 }] } ] },
    ],
  },
  {
    id: 'nb_bs_unwritten_rule', category: 'backstage', title: `A Rule Nobody Wrote Down`, weight: 1.5, contexts: ['post_show', 'show_day'], cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 4,
    cast: { vet: { pick: 'roster', tier: { gte: 3 } } }, memory: { role: 'vet', max: 1 },
    trigger: { stat: { careerYears: { lte: 6 } } },
    slots: { rule: [`standing in front of the gorilla monitor during somebody else's match`, `sitting in a veteran's folding chair in the dressing room`, `answering the fans' questions about a finish`, `touching another worker's gear bag without asking`], moment: [`while lacing a boot`, `with one hand on a locker door`, `still in a robe and ring tape`, `beside a vending machine that hums`] },
    body: [`{vet.name} stops you outside the showers and speaks quietly, which is always worse than shouting. You broke an unwritten rule today, namely {rule}, and {vet.they} says so {moment}.`, `There is no malice in the voice, and no mercy either. Whatever you say next will tell the room what kind of person you are when you are corrected.`],
    choices: [
      { id: 'apologise', label: `Apologise properly and thank {vet.first} for saying so`, risk: 'low', result: `You hold eye contact, own it and say thanks. {vet.first} grunts, softens by about a degree and tells you the story behind the rule, which turns out to be a good one.`, effects: [{ rel: { who: 'vet', respect: 5, trust: 3 } }, { conf: 1 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 3 }, { pop: -0.1 }] },
      { id: 'ask_rest', label: `Ask for the rest of the rules while you have the chance`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{vet.first} laughs, counts a dozen on {vet.their} fingers, and ends with the one that matters: never lie to the person you work with. It is the best ten minutes of advice you have had all year.`, effects: [{ tag: { who: 'vet', tag: 'mentor' } }, { rel: { who: 'vet', respect: 4, affinity: 4 } }, { conf: 2 }] },
        { weight: 1, text: `{vet.first} decides this is a bit much for the shower hallway and tells you to learn it the way everyone did, which is by getting it wrong.`, effects: [{ rel: { who: 'vet', respect: -1 } }, { conf: -1 }] } ] },
      { id: 'push_back', label: `Push back and ask who made that rule`, risk: 'high', outcomes: [
        { weight: 1, bonus: { confidence: 0.5 }, text: `A long pause, then a dry laugh. "Fair question," {vet.first} says, and for once the answer is more interesting than the rule.`, effects: [{ rel: { who: 'vet', respect: 4 } }, { conf: 3 }] },
        { weight: 2, text: `The temperature drops and word travels faster than you do. By dinner, three people have mentioned that you "have opinions."`, effects: [{ rel: { who: 'vet', respect: -6, heat: 6 } }, { conf: -3 }, { pop: -0.1 }] } ] },
      { id: 'laugh', label: `Laugh it off and change the subject`, risk: 'low', result: `The joke lands in the wrong place and {vet.first} watches it fall. You have bought yourself ten minutes of peace and a reputation for not taking things seriously.`, effects: [{ rel: { who: 'vet', respect: -3 } }, { conf: 1 }] },
    ],
  },
  {
    id: 'nb_bs_leave_early', category: 'backstage', title: `Nobody Leaves Before the Main Event`, weight: 1.5, contexts: ['post_match', 'show_day'], cooldownDays: 120, maxPerCareer: 4, categoryCooldown: 4,
    cast: { gm: { pick: 'staff', role: 'gm' } },
    trigger: { stat: { fatigue: { gte: 35 } } },
    slots: { need: [`a flight that will not wait`, `a relative waiting at the hospital`, `a dentist appointment that took three months to get`, `a training session you cannot afford to skip`], gap: [`ninety minutes`, `forty minutes`, `three hours`] },
    body: [`Your match is over and the show still has {gap} to run. Everybody knows the custom, which is that nobody leaves until the main event is finished, because the people on the card owe each other the courtesy of an audience.`, `You also have {need}. {gm.name} stands near the exit with a clipboard, and you can see {gm.their} eyes already moving toward you.`],
    choices: [
      { id: 'stay', label: `Stay and watch the whole show`, risk: 'low', result: `You sit on a road case and watch the main event with the rest of the locker room. It costs you something you wanted, but nobody forgets who stayed.`, effects: [{ money: -400 }, { fatigue: 4 }, { conf: 2 }, { pop: 0.1 }] },
      { id: 'ask_gm', label: `Ask {gm.name} for permission to leave early`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{gm.name} listens, scribbles a note and says to go, since the show will survive without you. You slide out through the loading dock with a pass and a debt.`, effects: [{ conf: 2 }, { pop: -0.1 }, { flag: 'owes_gm_favor' }] },
        { weight: 1, text: `The answer is no, with a speech about respect that hurts more than the refusal. You stay and miss what you needed to make.`, effects: [{ money: -400 }, { conf: -3 }, { fatigue: 4 }] } ] },
      { id: 'slip', label: `Slip out through the loading dock`, risk: 'high', outcomes: [
        { weight: 1, text: `Nobody notices, and by the time the final bell rings you are already moving down the highway. The relief is nearly as large as the guilt.`, effects: [{ fatigue: -4 }, { conf: 1 }] },
        { weight: 2, text: `A stagehand spots you, and by midnight the entire roster knows. The silence the next day is louder than anything said.`, effects: [{ conf: -4 }, { pop: -0.4 }, { fatigue: -2 }, { flag: 'known_to_leave_early' }] } ] },
      { id: 'cover', label: `Pay a fellow worker to cover your obligations`, risk: 'med', requires: { stat: { money: { gte: 500 } } }, result: `A younger worker takes your seat at the monitor and your errand in exchange for a couple of hundred dollars. You are not proud of it, and you are on time.`, effects: [{ money: -250 }, { fatigue: -2 }, { conf: -1 }] },
    ],
  },
  {
    id: 'nb_bs_hat_passed', category: 'backstage', title: `The Envelope Going Around`, weight: 1.5, contexts: ['show_day', 'post_show'], cooldownDays: 180, maxPerCareer: 3, categoryCooldown: 4,
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { cause: [`a ring announcer's hospital bills`, `a retired worker's funeral costs`, `a ring crew member's house fire`, `a referee's child who needs surgery`], collector: [`a grey-haired referee`, `the longest-serving makeup artist`, `a veteran with a bad hip`] },
    body: [`With a plain envelope in one hand, {collector} walks the dressing room saying nothing, and people drop folded bills into it as if paying a toll. The money is for {cause}, and no one has asked any of the stars to give more than anyone else.`, `The envelope reaches you at the end of the bench. Everyone nearby suddenly finds their boots very interesting.`],
    choices: [
      { id: 'big', label: `Give a lot and keep your name off it`, risk: 'low', requires: { stat: { money: { gte: 1500 } } }, result: `You fold a thick wad into the envelope and pass it on without comment. When {collector} counts it later, the eyes find you across the room and say nothing, though they say plenty.`, effects: [{ money: -1500 }, { conf: 3 }, { pop: 0.1 }] },
      { id: 'fair', label: `Give a fair amount like everyone else`, risk: 'low', result: `You put in what the veterans put in. It is not a gesture, just a duty, and the envelope moves on to the next bench.`, effects: [{ money: -300 }, { conf: 1 }] },
      { id: 'match_tip', label: `Give a little and promise to do an appearance for them`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `A few weeks later you show up for a small benefit event. Photos circulate and the family writes a note that you will keep in your bag for years.`, effects: [{ money: -150 }, { pop: 0.7 }, { conf: 3 }, { fatigue: 5 }] },
        { weight: 1, text: `The date slips, the schedule fills and the benefit goes ahead without you. You send a check late, and the apology is not quite enough.`, effects: [{ money: -400 }, { conf: -3 }, { pop: -0.1 }] } ] },
      { id: 'pass', label: `Pass the envelope without giving`, risk: 'low', result: `You pass it along with an apologetic wave toward an empty wallet. It saves you a few dollars and costs you a sleepless hour that night.`, effects: [{ conf: -3 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'nb_bs_ref_save', category: 'backstage', title: `The Referee Who Covered for You`, weight: 1.5, contexts: ['post_match'], cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 4,
    trigger: { stat: { matches: { gte: 8 } } },
    slots: { blunder: [`blanked on the sequence going into the finish`, `mistimed a roll-up so badly it nearly missed`, `cut yourself open far too early`, `lost your place with a hold half applied`], whisper: [`through the earpiece`, `low in your ear mid-hold`, `with a hand squeeze and a nod`] },
    body: [`Halfway through the match you blundered and {blunder}. The referee, a veteran in a worn shirt, pulled you through the dead air {whisper}, and the crowd never smelled a thing.`, `You find the referee afterward in the corridor, retying a shoe and humming. He has done this for thirty years and has never once been thanked for the saves nobody noticed.`],
    choices: [
      { id: 'gift', label: `Buy the referee a proper dinner`, risk: 'low', requires: { stat: { money: { gte: 120 } } }, result: `Over cheap steak and strong coffee he tells you about a night in the eighties that went worse than yours. You leave with a lighter conscience and a story to carry.`, effects: [{ money: -120 }, { conf: 3 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 2 }] },
      { id: 'review', label: `Ask him to watch the tape with you`, risk: 'low', result: `The two of you sit in a dark production room and pick the match apart, from the first collar-and-elbow to the last handshake. He is blunt, patient and right about most things.`, effects: [{ attr: { name: 'technical', delta: 1 } }, { conf: 2 }, { fatigue: 4 }] },
      { id: 'overapologise', label: `Apologise at length and swear it will not happen again`, risk: 'low', result: `The referee waves it away with a tired smile, and you carry the guilt around for two days anyway. Your promise is noted, and then forgotten by everyone but you.`, effects: [{ conf: -3 }, { fatigue: 1 }] },
      { id: 'shrug', label: `Shrug it off as part of the night`, risk: 'med', outcomes: [
        { weight: 1, bonus: { confidence: 0.4 }, text: `You flash a grin and he returns it. The fact that you can laugh keeps you loose for the next show, and keeps you from dwelling.`, effects: [{ conf: 2 }, { pop: 0.1 }] },
        { weight: 2, text: `He watches you walk away without a word, and the next time he sets up a spot with you, it is a little quieter and a little colder.`, effects: [{ conf: -1 }, { pop: -0.2 }] } ] },
    ],
  },
  {
    id: 'nb_bs_wardrobe_disaster', category: 'backstage', title: `The {gear} That Arrived Wrong`, weight: 1.5, contexts: ['pre_show'], cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 4,
    cast: { vet: { pick: 'roster', tier: { gte: 2 } } }, memory: { role: 'vet', max: 1 },
    trigger: { stat: { popularity: { gte: 10 } } },
    slots: { gear: [`ring jacket`, `mask`, `tights`, `boots`], flaw: [`two sizes too small`, `the wrong color for your character`, `still damp from a rushed wash`, `missing a piece that was never packed`] },
    body: [`The package from the seamstress arrives forty minutes before bell time, and the {gear} inside is {flaw}. Nobody in the room is sure whether to laugh or to flinch, so the room does both in sequence.`, `{vet.name} peers over, offers a long whistle and mentions, a bit too lightly, that there is another option. A bad entrance is a long memory for any crowd.`],
    choices: [
      { id: 'own_it', label: `Wear it anyway and play it as part of the act`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.6, confidence: 0.4 }, text: `You strut out as though the thing was designed that way. The crowd, unsure for three seconds, decides to love it, and the clip turns up in compilations for months.`, effects: [{ pop: 0.8 }, { conf: 4 }] },
        { weight: 2, text: `The first look from the front row tells you all you need. The moment cannot be fixed with posture, and the laughter is not in your favor.`, effects: [{ pop: -0.5 }, { conf: -4 }] } ] },
      { id: 'borrow', label: `Borrow a replacement from {vet.name}`, risk: 'low', result: `{vet.first} hands over a spare with a theatrical sigh and a lecture on never packing without double-checking. It does not fit perfectly, but it fits well enough, and you owe a favor.`, effects: [{ rel: { who: 'vet', respect: 1, trust: 2 } }, { conf: 1 }, { pop: -0.1 }, { flag: 'borrowed_gear' }] },
      { id: 'plain', label: `Go out in plain black and let your work speak`, risk: 'low', result: `You step through the curtain in clean plain black, and nobody boos the lack of costume. The match is solid, the visual is forgettable and your merch people will be unhappy about the photos.`, effects: [{ pop: -0.3 }, { conf: 2 }, { money: -100 }] },
      { id: 'delay', label: `Hold the entrance for ten minutes to have it fixed`, risk: 'med', result: `A rescue is attempted with safety pins, scissors and a stagehand's sewing kit. The result is passable and the whole production team is irritated at you.`, effects: [{ conf: 1 }, { pop: 0.1 }, { fatigue: 3 }, { flag: 'producer_annoyed' }] },
    ],
  },
  {
    id: 'nb_bs_snitch_rumor', category: 'backstage', title: `Word Is You Talk to the Office`, weight: 1.5, contexts: ['show_day', 'post_show'], cooldownDays: 180, maxPerCareer: 2, categoryCooldown: 4,
    cast: { peer: { pick: 'roster', tier: { gte: 1, lte: 3 } } }, memory: { role: 'peer', max: 1 },
    trigger: { stat: { popularity: { gte: 20 } }, noFlag: 'snitch_rumor_seen' },
    slots: { rumor: [`feeding the office names after a long night out`, `telling the agent who turned up late`, `reporting a locker room prank to management`, `angling for a spot meant for somebody else`], source: [`a note folded into your locker vent`, `a joke at catering that died halfway through`, `a cold shoulder in the bus aisle`, `the raised eyebrow of a man you respect`] },
    body: [`The rumor that you have been {rumor} reaches you through {source}, and not a word of it is true. {peer.name} is the one who looks away first when you walk into the room, though that may mean nothing at all.`, `A reputation in a locker room is built in small pieces and torn down the same way. The next move you make will be read in light of the whisper, whatever you do.`],
    choices: [
      { id: 'confront', label: `Confront {peer.name} directly and ask where it started`, risk: 'high', outcomes: [
        { weight: 1, bonus: { confidence: 0.5 }, text: `{peer.first} blinks, looks suddenly very tired and admits that the story came from someone else who heard it from a third person. The air clears, and the two of you speak like adults for the first time in weeks.`, effects: [{ rel: { who: 'peer', trust: 6, respect: 3 } }, { conf: 3 }, { flag: 'snitch_rumor_seen' }] },
        { weight: 2, text: `{peer.first} hears the question as an accusation and answers it with one. The scene draws spectators, and you are now the loud one in a rumor that began as a whisper.`, effects: [{ rel: { who: 'peer', heat: 10, trust: -4 } }, { conf: -3 }, { pop: -0.2 }, { flag: 'snitch_rumor_seen' }] } ] },
      { id: 'elder', label: `Ask a respected veteran to vouch for you`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `The veteran takes the story apart in two sentences at catering, and the room bends the way rooms do when someone senior speaks. You owe a debt you will not forget.`, effects: [{ conf: 2 }, { pop: 0.1 }, { flag: 'snitch_rumor_seen' }, { flag: 'owes_veteran_favor' }] },
        { weight: 1, text: `The veteran sighs and says denials are what guilty people do. You walk out with less support than you came in with.`, effects: [{ conf: -3 }, { flag: 'snitch_rumor_seen' }] } ] },
      { id: 'work_it', label: `Say nothing and let your work answer it`, risk: 'low', result: `You show up early, work hard, help carry gear and keep your mouth shut. It takes weeks, but the story gradually runs out of fuel.`, effects: [{ fatigue: 6 }, { conf: 1 }, { rel: { who: 'peer', respect: 2 } }, { flag: 'snitch_rumor_seen' }] },
      { id: 'counter', label: `Float a story of your own about {peer.name}`, risk: 'high', result: `You plant an equally pointed tale in the right ear. It spreads quickly and unpleasantly, and the room splits into people who admire the nerve and people who don't.`, effects: [{ rel: { who: 'peer', heat: 14, respect: -4 } }, { rivalry: { who: 'peer', heat: 12 } }, { pop: 0.2 }, { conf: -2 }, { flag: 'snitch_rumor_seen' }] },
    ],
  },
  {
    id: 'nb_bs_doctor_clearance', category: 'backstage', title: `The Doctor Wants You to Sit Down`, weight: 2, contexts: ['pre_show', 'show_day'], cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 4,
    cast: { doc: { pick: 'staff', role: 'doctor' }, agent: { pick: 'staff', role: 'agent' } },
    trigger: { stat: { fatigue: { gte: 55 } }, injured: false },
    slots: { symptom: [`a headache that has outlasted three nights`, `numb fingertips after every bump`, `a knee that locks on the stairs`, `a dull ache just under the ribs`], show: [`a taped television show`, `a house show in a town you love`, `the match that was supposed to set up next month`] },
    body: [`{doc.name} presses two fingers against your neck and pays more attention to the wall clock than to the pulse. Given {symptom}, the verdict is a firm suggestion that you should not work {show}.`, `{agent.name} appears in the doorway a minute later, already knowing. Everyone in the hallway is being very careful with their faces.`],
    choices: [
      { id: 'sit_out', label: `Sit it out and take the time`, risk: 'low', result: `You hand your bag to the equipment manager and go back to the hotel. It stings, a bit, to be absent from a card you were on, but the body thanks you for it by morning.`, effects: [{ fatigue: -15 }, { money: -600 }, { pop: -0.5 }, { conf: 1 }] },
      { id: 'work_through', label: `Work through it and see the doctor next week`, risk: 'high', outcomes: [
        { weight: 2, bonus: { toughness: 0.5 }, text: `You get through the match with two ugly moments and one good one. By the time you are back in the dressing room, you are exhausted and slightly proud of yourself, and slightly ashamed of that.`, effects: [{ pop: 0.5 }, { conf: 2 }, { fatigue: 10 }] },
        { weight: 2, text: `Midway through the match, everything tilts. You finish on pure habit and spend the following week learning what a warning looks like when it is ignored.`, effects: [{ injury: { part: 'head', severity: 1, days: 14 } }, { conf: -4 }, { fatigue: 12 }, { pop: -0.2 }] } ] },
      { id: 'second_opinion', label: `Pay for a second opinion before deciding`, risk: 'med', requires: { stat: { money: { gte: 500 } } }, outcomes: [
        { weight: 1, text: `A private specialist finds nothing alarming and clears you to work with restrictions. You swallow the cost, take the match and move more carefully than usual.`, effects: [{ money: -450 }, { pop: 0.2 }, { fatigue: 5 }, { conf: 1 }] },
        { weight: 1, text: `The second opinion agrees with the first and comes with a longer list of warnings. You sit out, and you finally understand why the first doctor sounded so tired.`, effects: [{ money: -450 }, { fatigue: -12 }, { pop: -0.4 }] } ] },
      { id: 'short_match', label: `Work a shortened, low-impact version of the match`, risk: 'med', result: `You and your opponent agree on a sequence of holds and fewer bumps, and the producer cuts the clock to match. The crowd gets a fair show, the doctor gets a nod and you get through the night with most of yourself intact.`, effects: [{ pop: 0.1 }, { fatigue: 3 }, { conf: 1 }, { money: -150 }] },
    ],
  },
  {
    id: 'nb_bs_bus_cards', category: 'backstage', title: `The Late Game on the Bus`, weight: 1.5, contexts: ['weekly'], cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 5,
    cast: { dealer: { pick: 'roster', tier: { gte: 2 } } }, memory: { role: 'dealer', max: 1 },
    trigger: { stat: { careerYears: { lte: 8 } } },
    slots: { game: [`five-card draw`, `gin rummy`, `dice in the aisle`, `hearts with a side bet`], stakes: [`gas money`, `half of a week's per diem`, `a round of drinks on the next off-night`] },
    body: [`The only light still on in the back of the bus comes from a card game. {dealer.name} is dealing {game} for {stakes}, and a stack of folded bills sits in the seat gap like a small altar.`, `The empty chair is obviously meant for you, and the rest of the table pretends not to look. Sleep is out of the question for another three hundred miles anyway.`],
    choices: [
      { id: 'sit_in', label: `Sit in and play your best hand`, risk: 'high', outcomes: [
        { weight: 1, bonus: { psychology: 0.5, confidence: 0.3 }, text: `You win more than you lose, and the table laughs at the way you read people's faces. {dealer.first} calls you a hustler with real affection.`, effects: [{ money: 600 }, { rel: { who: 'dealer', respect: 3, affinity: 4 } }, { conf: 2 }] },
        { weight: 2, text: `The cards ignore you, and by dawn you have lost far more than you meant to. {dealer.first} pats your shoulder, which feels worse than being laughed at.`, effects: [{ money: -700 }, { conf: -2 }, { fatigue: 4 }, { rel: { who: 'dealer', affinity: 2 } }] } ] },
      { id: 'watch', label: `Watch from across the aisle and take notes`, risk: 'low', result: `You pretend to sleep and study the table from beneath your hood, tracking who bluffs and who overplays. It tells you more about the locker room than about cards.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { fatigue: 2 }] },
      { id: 'cap', label: `Play one hand and quietly bow out`, risk: 'low', result: `You lose a single hand's worth, shake hands and slide back to your seat. Nobody gets offended, and nobody remembers much about it either.`, effects: [{ money: -40 }, { conf: 1 }, { fatigue: -1 }] },
      { id: 'sleep', label: `Pull your jacket over your head and sleep`, risk: 'low', result: `The engine hums you to sleep within minutes and the miles pass unnoticed. You wake at a rest stop feeling far better, if slightly a stranger to your colleagues.`, effects: [{ fatigue: -8 }, { rel: { who: 'dealer', affinity: -2 } }] },
    ],
  },
  {
    id: 'nb_bs_overheard_plans', category: 'backstage', title: `You Were Not Meant to Hear That`, weight: 2, contexts: ['show_day', 'pre_show'], cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 4,
    cast: { agent: { pick: 'staff', role: 'agent' } },
    trigger: { stat: { matches: { gte: 10 }, careerYears: { gte: 1 } }, noFlag: 'overheard_plans' },
    slots: { plan: [`a bigger push at the next major show`, `a list of people to be released after the new year`, `a split from your regular opponent`, `a transfer to a different brand`], where: [`the door of the production office that never quite shuts`, `the stairwell outside the booker's room`, `a headset someone left switched on`] },
    body: [`You were only looking for a phone charger when you heard {agent.name} say your name through {where}. The subject was {plan}, and the conversation rolled on before you could decide whether to stay or leave.`, `Another voice answered, too low to catch. Whatever was said, your stomach has already made up its mind.`],
    choices: [
      { id: 'listen', label: `Stay and listen to the rest`, risk: 'high', outcomes: [
        { weight: 1, bonus: { psychology: 0.4 }, text: `The rest turns out to be better than the start: they like you, and they are fighting over how to use you. You tiptoe away carrying a secret that is mostly good.`, effects: [{ conf: 5 }, { flag: 'overheard_plans' }] },
        { weight: 2, text: `The rest is worse. You hear honest doubts about your future and the cold tone people use when a person is a spreadsheet. You are back in the corridor before you notice you left.`, effects: [{ conf: -6 }, { fatigue: 4 }, { flag: 'overheard_plans' }] } ] },
      { id: 'walk_on', label: `Walk away and act as if nothing happened`, risk: 'low', result: `You take the charger from the shelf, nod at a passing stagehand and carry on to the dressing room. The knowledge sits in your pocket for a week, but nobody else can see it.`, effects: [{ conf: -2 }, { fatigue: 2 }, { flag: 'overheard_plans' }] },
      { id: 'tell_agent', label: `Tell {agent.name} you overheard it, and ask directly`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4, confidence: 0.3 }, text: `{agent.name} winces, shuts the door and gives you the honest version, uncomfortable in places but far from the worst version you imagined. The directness earns something.`, effects: [{ conf: 3 }, { pop: 0.1 }, { flag: 'overheard_plans' }, { flag: 'agent_candid' }] },
        { weight: 1, text: `{agent.name} goes cold and demands to know who else has heard. The conversation ends with a warning about doors and discretion, and your cooperation is noted.`, effects: [{ conf: -3 }, { pop: -0.2 }, { flag: 'overheard_plans' }] } ] },
      { id: 'tell_friend', label: `Tell a friend in the locker room`, risk: 'high', result: `You whisper it to someone you trust. By the next morning, three people are looking at you differently, and you cannot be sure whether the secret traveled or only the suspicion.`, effects: [{ conf: 1 }, { pop: -0.3 }, { flag: 'overheard_plans' }, { flag: 'leaked_plans' }] },
    ],
  },
  {
    id: 'nb_bs_segment_cut', category: 'backstage', title: `Cut From Tonight's Show`, weight: 2, contexts: ['pre_show'], cooldownDays: 120, maxPerCareer: 4, categoryCooldown: 4,
    cast: { producer: { pick: 'staff', role: 'producer' } },
    trigger: { stat: { matches: { gte: 6 } }, minYear: 1993 },
    slots: { segment: [`the promo you wrote on the flight`, `the entrance you rehearsed in an empty garage`, `the match you were assured was safe`, `the angle with the champion you had waited weeks for`], reason: [`it ran long on paper`, `the main event needs the extra minutes`, `a decision came down from a higher floor`] },
    body: [`Ten minutes before doors, {producer.name} finds you in catering with a printout and an apology. Tonight, {segment} has been cut because {reason}.`, `The news arrives gently, which makes it harder to be angry about. You have the afternoon's preparation, the bag on your shoulder and nowhere to put either.`],
    choices: [
      { id: 'gracious', label: `Accept it gracefully and offer to help elsewhere`, risk: 'low', result: `You ask what else the show needs and spend the night carrying scripts, checking monitors and running messages for the crew. {producer.name} remembers it, and you sleep on a clear conscience.`, effects: [{ fatigue: 5 }, { conf: 2 }, { pop: -0.2 }, { flag: 'producer_trusts_you' }] },
      { id: 'next_week', label: `Ask for it to be rescheduled and put in writing`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{producer.name} takes your request upstairs and returns with a firm date. A real date feels like a small promise, and you hold it against the worst of the evening.`, effects: [{ conf: 3 }, { pop: 0.1 }, { flag: 'segment_promised' }] },
        { weight: 1, text: `The request is answered with a polite shrug and nothing on paper. It is not a refusal, which is exactly why it hurts.`, effects: [{ conf: -2 }, { pop: -0.1 }] } ] },
      { id: 'vent', label: `Vent loudly in the hallway`, risk: 'high', result: `The shouting feels glorious for about ninety seconds. Then a stagehand glances at the monitor, a camera operator looks away and you realise you have just rehearsed your own reputation.`, effects: [{ conf: -2 }, { pop: -0.4 }, { fatigue: 2 }, { flag: 'producer_annoyed' }] },
      { id: 'dark', label: `Ask to work the segment at a house show instead`, risk: 'low', result: `The producer finds a slot at a smaller date, where the crowd is half-full and entirely sincere. You get to do the work, even if the cameras never see it.`, effects: [{ fatigue: 4 }, { conf: 2 }, { attr: { name: 'psychology', delta: 1 } }, { money: 150 }] },
    ],
  },
  {
    id: 'nb_bs_gimmick_overhaul', category: 'backstage', title: `Creative Wants a New You`, weight: 2, contexts: ['weekly', 'show_day'], cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 5,
    cast: { creative: { pick: 'staff', role: 'creative' } },
    trigger: { stat: { careerYears: { gte: 1.5 }, popularity: { lte: 70 } }, noFlag: 'gimmick_reworked' },
    slots: { change: [`a new look and a new name`, `a character who talks less and smiles more`, `a mask you never asked for`, `a backstory built on a hometown you have never visited`], reason: [`because merchandise has stalled`, `because another brand has a similar look`, `because test audiences came back lukewarm`] },
    body: [`{creative.name} gives you the news across a table covered in sketches. The company wants {change}, {reason}, and the face in the drawings looks about as much like you as a mannequin does.`, `Someone has clearly worked on this for two days without sleep, which makes it harder to be rude about it. Your gimmick is the one thing you built from scratch, and a lot of your pride is stored inside it.`],
    choices: [
      { id: 'embrace', label: `Embrace the change and commit fully`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5, confidence: 0.3 }, text: `You find the part of the new character that feels true and lean into it. The first night is rough, the third is better and by the second month the merch table has a line.`, effects: [{ pop: 0.7 }, { conf: 2 }, { charisma: 1 }, { flag: 'gimmick_reworked' }] },
        { weight: 1, text: `The new character never quite settles on your shoulders. Crowds watch with polite confusion, and you feel like an actor in the wrong play.`, effects: [{ pop: -0.4 }, { conf: -4 }, { flag: 'gimmick_reworked' }] } ] },
      { id: 'negotiate', label: `Negotiate to keep the core of what you built`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5 }, text: `You walk through what matters to you and why. {creative.name} listens and the sketch changes, keeping your voice under a new coat of paint.`, effects: [{ pop: 0.3 }, { conf: 3 }, { mic: 1 }, { flag: 'gimmick_reworked' }] },
        { weight: 1, text: `{creative.name} gives ground on the small things and none on the large ones. You come away with a compromise that satisfies nobody.`, effects: [{ conf: -1 }, { fatigue: 2 }, { flag: 'gimmick_reworked' }] } ] },
      { id: 'refuse', label: `Refuse and defend the gimmick you built`, risk: 'high', result: `Your answer is firm and polite and it ends the meeting. You keep your character and your self-respect, and the sketches go back in the folder for another day.`, effects: [{ conf: 4 }, { pop: -0.5 }, { flag: 'gimmick_reworked' }, { flag: 'known_to_refuse' }] },
      { id: 'your_version', label: `Rewrite it yourself and bring a version back in a week`, risk: 'low', result: `You spend a week of evenings with markers, tape and your own voice recorder. The revised version is yours and theirs, and it is the best creative argument you have ever made.`, effects: [{ fatigue: 8 }, { conf: 3 }, { mic: 1 }, { pop: 0.2 }, { flag: 'gimmick_reworked' }] },
    ],
  },
  {
    id: 'nb_bs_fixture_farewell', category: 'backstage', title: `A Final Night for {who}`, weight: 1.5, contexts: ['show_day', 'post_show'], cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 5,
    trigger: { stat: { careerYears: { gte: 2 } } },
    slots: { who: [`the head of the referees`, `the ring announcer of thirty years`, `the stylist who knows every worker by first name`, `the road manager who has driven every bus`], send_off: [`a sheet cake with a smudged name on it`, `a quiet envelope slid under every locker door`, `a ring bell rung from the apron before the first match`] },
    body: [`By lunchtime everyone knows that {who} is working a last show tonight, with {send_off} planned. That person has done every job in the building at some point, and the building is not entirely sure how to say goodbye.`, `Everyone has a story about a night that was saved by a quiet word in the right ear. None of those stories are on a poster.`],
    choices: [
      { id: 'toast', label: `Stand up in the dressing room and give a toast`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.5, charisma: 0.4 }, text: `Your voice catches once, which turns out to be the best part. The room goes still, then loud, and a few of the oldest hands wipe their eyes with the backs of their hands.`, effects: [{ pop: 0.3 }, { conf: 4 }, { charisma: 1 }] },
        { weight: 1, text: `You start a story that wanders for two minutes without an ending. The room is kind enough to clap anyway.`, effects: [{ conf: -2 }, { pop: -0.1 }] } ] },
      { id: 'gift', label: `Buy something proper and have it engraved`, risk: 'low', requires: { stat: { money: { gte: 500 } } }, result: `A watch, a frame, a good pen: you settle on something that will sit on a desk and be picked up for years. The thank-you is a long handshake that does the talking.`, effects: [{ money: -450 }, { conf: 3 }, { fatigue: 2 }] },
      { id: 'last_lesson', label: `Ask for one last piece of advice`, risk: 'low', result: `A long quiet moment, then three sentences about how to behave when the lights go down. You write them on the back of your hand, and later in a notebook.`, effects: [{ attr: { name: 'psychology', delta: 1 } }, { conf: 2 }, { fatigue: 1 }] },
      { id: 'skip', label: `Catch your ride and say goodbye with a note or a card`, risk: 'low', result: `Your travel plans win, and the card is sincere enough. Still, you are not in the room when it matters, and a few veterans make a point of noticing.`, effects: [{ fatigue: -3 }, { conf: -2 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'nb_bs_stiff_shot', category: 'backstage', title: `That Shot Was Not in the Plan`, weight: 2, contexts: ['post_match'], cooldownDays: 120, maxPerCareer: 4, categoryCooldown: 4,
    cast: { opponent: { pick: 'roster', tier: { gte: 1, lte: 3 } } }, memory: { role: 'opponent', max: 2 },
    trigger: { stat: { matches: { gte: 6 } } },
    slots: { strike: [`a forearm that landed like a car door`, `three closed-fist shots in a row`, `a clothesline that rattled your teeth`, `a kick that clipped your jaw`], reaction: [`the referee looked straight at you`, `the crowd gasped`, `your vision went white for a second`] },
    body: [`Midway through tonight's match, {opponent.name} threw {strike}, and {reaction}. You are still tasting copper in the dressing room, and the question every worker asks has arrived: accident, or message?`, `The business has a code for this, and the code has more than one answer. What you do in the next ten minutes will be repeated in every hallway by morning.`],
    choices: [
      { id: 'return', label: `Return it in kind next time you work together`, risk: 'high', outcomes: [
        { weight: 2, bonus: { toughness: 0.4, confidence: 0.4 }, text: `The message is sent and received, and the next match is suspiciously gentle. Respect, of a kind that does not require words, passes between the two of you.`, effects: [{ rel: { who: 'opponent', respect: 5, fear: 4, heat: 4 } }, { conf: 3 }, { fatigue: 4 }] },
        { weight: 1, text: `It escalates. Two workers who were supposed to be protecting each other end up genuinely angry, and the agents have to separate you at the curtain.`, effects: [{ rivalry: { who: 'opponent', heat: 18 } }, { rel: { who: 'opponent', heat: 14 } }, { injury: { part: 'arms', severity: 1, days: 9 } }, { pop: -0.2 }] } ] },
      { id: 'talk', label: `Find {opponent.first} and ask quietly what happened`, risk: 'low', outcomes: [
        { weight: 2, bonus: { charisma: 0.3 }, text: `{opponent.first} looks genuinely sick about it, apologises and offers to ice your jaw. A misunderstanding is resolved, and a small bridge is built.`, effects: [{ rel: { who: 'opponent', trust: 5, respect: 3 } }, { conf: 1 }] },
        { weight: 1, text: `{opponent.first} shrugs and says "it happens." You cannot tell whether that is contempt or just habit, and you carry the doubt into the next show.`, effects: [{ rel: { who: 'opponent', respect: -2 } }, { conf: -2 }] } ] },
      { id: 'tell_agent', label: `Report it to the agent and the producer`, risk: 'med', result: `The report is received seriously and a note goes on file. Your opponent is told to tone it down, and word spreads that you do things officially, which cuts both ways.`, effects: [{ rel: { who: 'opponent', heat: 8, respect: -2 } }, { conf: 1 }, { pop: -0.1 }] },
      { id: 'shake_off', label: `Say nothing and take the ice pack`, risk: 'low', result: `You ice the jaw, swallow the anger and go back to work. It saves a scene, and it also teaches {opponent.first} that you will take it.`, effects: [{ conf: -3 }, { fatigue: 2 }, { rel: { who: 'opponent', respect: -3 } }] },
    ],
  },
  {
    id: 'nb_bs_agent_released', category: 'backstage', title: `Your Agent Is Cleaning Out the Desk`, weight: 1.5, contexts: ['show_day', 'post_show'], cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 5,
    cast: { agent: { pick: 'staff', role: 'agent' }, exec: { pick: 'staff', role: 'executive' } },
    trigger: { stat: { careerYears: { gte: 2 }, matches: { gte: 15 } } },
    slots: { tenure: [`six years`, `eleven years`, `nineteen years`], cause: [`a restructuring that nobody explained`, `a budget line cut from the production department`, `a memo with a single sentence in it`] },
    body: [`The news moves through the hallways before any announcement does. {agent.name}, who has worked your matches for {tenure}, is being let go after {cause}, and the production office has the sad look of a room mid-packing.`, `{agent.first} is boxing a framed photo, a stapler and a coffee mug older than most of the roster. Nobody is saying anything, because nobody knows what the right sentence is.`],
    choices: [
      { id: 'speak_up', label: `Go to {exec.name} and argue for keeping {agent.first}`, risk: 'high', outcomes: [
        { weight: 1, bonus: { popularity: 0.6, charisma: 0.3 }, text: `{exec.name} listens to the whole case with arms folded and then nods once. The decision does not change, but a severance sweetener and a glowing reference appear within the hour.`, effects: [{ conf: 3 }, { pop: 0.1 }, { flag: 'defended_agent' }] },
        { weight: 3, text: `The door closes on you politely and a reminder that this is above your pay grade follows. You made the effort and you lost the room's favor for it.`, effects: [{ conf: -2 }, { pop: -0.3 }, { flag: 'defended_agent' }] } ] },
      { id: 'reference', label: `Write {agent.first} a heartfelt letter of reference`, risk: 'low', result: `You stay up late, trying to say what working with {agent.first} actually meant. It takes three drafts and a good deal of honesty, and the reply that eventually arrives is brief and wet-eyed.`, effects: [{ fatigue: 3 }, { conf: 3 }, { flag: 'defended_agent' }] },
      { id: 'drink', label: `Take {agent.first} out for a proper dinner and listen`, risk: 'low', requires: { stat: { money: { gte: 200 } } }, result: `Over a long meal the stories come out, including a few that explain why certain decisions were made. You leave knowing the business better, and having given back a little of what you were given.`, effects: [{ money: -180 }, { attr: { name: 'psychology', delta: 1 } }, { conf: 2 }, { fatigue: 2 }] },
      { id: 'distance', label: `Keep your head down and protect your own spot`, risk: 'med', result: `You say a polite goodbye in the hallway and nothing else. It is the practical move, and it follows you around for a week like a smell.`, effects: [{ conf: -4 }, { fatigue: -2 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'nb_bs_bag_prank', category: 'backstage', title: `Somebody Got to Your Gear Bag`, weight: 1.5, contexts: ['pre_show'], cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 4,
    trigger: { stat: { careerYears: { lte: 5 } } },
    slots: { prank: [`your boots taped shut with an entire roll of white tape`, `your entrance music swapped for a polka record`, `your gear bag packed with foam peanuts to the zipper`, `your ring jacket sewn shut at the sleeves`], culprits: [`a pair of grinning veterans`, `the entire bus`, `the ring crew, who deny everything with straight faces`, `a suspiciously helpful rookie`] },
    body: [`Twenty minutes before the match, you open the bag to find {prank}. The fingerprints point toward {culprits}, and the whole dressing room has developed a sudden interest in the ceiling.`, `This is how the locker room tests a person: nothing is cruel, and everything is carefully watched. Your reaction will be filed under either "good sport" or "needs a thicker skin."`],
    choices: [
      { id: 'laugh_back', label: `Laugh loudly and plan a payback`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.5 }, text: `Your grin does the work and the room exhales. A week later a certain pair of veterans open their bags to something equally ridiculous, and the legend of your temperament is secure.`, effects: [{ conf: 3 }, { pop: 0.1 }, { money: -60 }, { fatigue: 2 }] },
        { weight: 1, text: `The retaliation misfires and lands on the wrong person, who does not find it funny. You spend an afternoon apologising to a stranger.`, effects: [{ conf: -2 }, { money: -60 }, { fatigue: 3 }] } ] },
      { id: 'improvise', label: `Improvise and use it in your entrance`, risk: 'high', outcomes: [
        { weight: 2, bonus: { charisma: 0.6, confidence: 0.4 }, text: `You walk out with an expression of ferocious dignity, trailing foam or tape or polka as the case may be. The crowd roars, the producer is delighted and the pranksters tip their caps.`, effects: [{ pop: 0.9 }, { conf: 4 }, { fatigue: 5 }, { money: -120 }] },
        { weight: 1, text: `The improvisation falls apart on the stairs and the audience senses an accident. Your match opens with a faint smell of embarrassment.`, effects: [{ pop: -0.3 }, { conf: -3 }, { fatigue: 5 }, { money: -120 }] } ] },
      { id: 'cold', label: `Fix it in silence and give nothing away`, risk: 'low', result: `You repair the damage without comment and walk out as though nothing happened. The room is disappointed in the best way, and you become a harder target for a week.`, effects: [{ fatigue: 3 }, { conf: 1 }] },
      { id: 'stop_it', label: `Tell everyone this is the last time`, risk: 'med', result: `The room goes quiet, someone mutters about "attitude" and your bag stays untouched for a month. So does most of the warmth you had been building.`, effects: [{ conf: 1 }, { pop: -0.2 }, { flag: 'sore_sport' }] },
    ],
  },
  {
    id: 'nb_bs_entrance_fail', category: 'backstage', title: `The Entrance That Fell Apart`, weight: 1.5, contexts: ['post_match'], cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 4,
    cast: { producer: { pick: 'staff', role: 'producer' } },
    trigger: { stat: { popularity: { gte: 15 }, matches: { gte: 8 } }, minYear: 1995 },
    slots: { failure: [`the pyro rig fizzled out with a sad hiss`, `your music died after four seconds`, `the curtain jammed halfway open`, `the lift under the stage refused to rise`], crowd: [`a few polite coughs`, `a delighted roar of laughter`, `one lone heckler in the balcony`] },
    body: [`The entrance you built for months lasted eleven seconds before {failure}. The building answered with {crowd}, and you carried on for the rest of the match with a smile that never quite got the memo.`, `{producer.name} is already pacing near the monitors when you return, followed by two crew members trying to look smaller than they are. Someone will need to be the villain of this story, and nobody wants the part.`],
    choices: [
      { id: 'joke', label: `Make a joke of it in your next promo`, risk: 'med', outcomes: [
        { weight: 2, bonus: { mic: 0.6, charisma: 0.4 }, text: `Your self-deprecating line gets a bigger laugh than the entrance would have, and the crew in the back row grin at being included. A mistake becomes a signature.`, effects: [{ pop: 0.6 }, { mic: 1 }, { conf: 3 }] },
        { weight: 1, text: `The joke lands badly with the crew, who are tired of being blamed. You get the laugh but lose a few friends in black t-shirts.`, effects: [{ pop: 0.2 }, { conf: -1 }, { flag: 'crew_sore' }] } ] },
      { id: 'cover_crew', label: `Tell {producer.name} it was your call and the crew is fine`, risk: 'low', result: `You take the blame for a cue you never gave, and {producer.name} lets the crew go with a lecture instead of a write-up. The two crew members find you later with a case of cold drinks.`, effects: [{ conf: 2 }, { pop: -0.1 }, { money: -100 }, { flag: 'crew_friend' }] },
      { id: 'blame', label: `Demand to know who touched the rig`, risk: 'high', result: `You do it loudly, in front of the people most likely to be blamed. The investigation finds a loose wire and no villain, and you find a cold reception for the next month.`, effects: [{ conf: -2 }, { pop: -0.3 }, { flag: 'crew_sore' }] },
      { id: 'redo', label: `Ask for a rehearsal run so it never happens again`, risk: 'low', result: `An empty arena, a stopwatch, a cue sheet. The crew runs the entrance four times, and by the end it is better than the original.`, effects: [{ fatigue: 4 }, { conf: 2 }, { attr: { name: 'psychology', delta: 1 } }] },
    ],
  },
  {
    id: 'nb_bs_ride_with_enemy', category: 'backstage', title: `Stuck Together With Your Enemy`, weight: 2, contexts: ['weekly'], cooldownDays: 150, maxPerCareer: 2, categoryCooldown: 5,
    cast: { rival: { pick: 'rivalry', minHeat: 15 } }, memory: { role: 'rival', max: 2 },
    trigger: { maxYear: 2006 },
    slots: { transport: [`an airport shuttle bus`, `a rental car in a storm`, `a pair of adjoining seats on a regional flight`, `a motel with one working vending machine`], witness: [`a boy in a replica shirt`, `a ticket clerk who knows everyone`, `a heckler nursing a beer`] },
    body: [`The weather has decided that you and {rival.name} will spend the night stuck together in {transport}. Until the next show, you are supposed to be mortal enemies, and {witness} is watching both of you with narrowed eyes.`, `The code of the business says the act does not stop at the curtain. Yet it is three in the morning and neither of you has slept in a day.`],
    choices: [
      { id: 'stay_in_character', label: `Stay in character and glare the whole way`, risk: 'low', result: `Six hours of ferocious silence follow, broken by one perfectly timed sneer. {witness} will tell the story for years, and your jaw aches from holding the expression.`, effects: [{ pop: 0.5 }, { fatigue: 6 }, { rel: { who: 'rival', respect: 2 } }] },
      { id: 'private_truce', label: `Call a quiet truce until the show`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `Out of sight of the world, you trade stories, a chocolate bar and a few bruises. {rival.first} turns out to be human, which complicates the next match in the best way.`, effects: [{ rel: { who: 'rival', trust: 6, respect: 4, heat: -8 } }, { fatigue: -4 }, { conf: 2 }] },
        { weight: 1, text: `The truce is overheard by a stranger who recognises both of you, and the act wobbles. Management hears the story by morning and is not amused.`, effects: [{ rel: { who: 'rival', trust: 3 } }, { pop: -0.4 }, { conf: -2 }] } ] },
      { id: 'stage_scuffle', label: `Stage a small scuffle for the audience nearby`, risk: 'high', outcomes: [
        { weight: 2, bonus: { psychology: 0.4 }, text: `A shove, a shout and a perfectly aimed threat: the onlookers hold their breath and tell their friends about it. {rival.first} plays it beautifully.`, effects: [{ pop: 0.8 }, { rivalry: { who: 'rival', heat: 8 } }, { conf: 3 }, { fatigue: 4 }] },
        { weight: 1, text: `The shove goes a few inches too far, and a real reaction crosses {rival.their} face. For a heartbeat it is no longer an act.`, effects: [{ rivalry: { who: 'rival', heat: 12 } }, { rel: { who: 'rival', heat: 10 } }, { pop: 0.2 }, { conf: -1 }] } ] },
      { id: 'separate', label: `Insist on finding a separate way to the next town`, risk: 'med', result: `The detour costs money, sleep and an hour of arguing with a rental agent. It protects the illusion with the pricey kind of discipline.`, effects: [{ money: -300 }, { fatigue: 7 }, { pop: 0.2 }, { conf: 1 }] },
    ],
  },
  {
    id: 'nb_bs_locker_room_list', category: 'backstage', title: `A List of Grievances With Your Name Missing`, weight: 1.5, contexts: ['show_day', 'weekly'], cooldownDays: 365, maxPerCareer: 2, categoryCooldown: 6,
    cast: { gm: { pick: 'staff', role: 'gm' } },
    trigger: { stat: { careerYears: { gte: 3 }, popularity: { gte: 30 } }, noFlag: 'locker_room_voice' },
    slots: { issue: [`health insurance for contract workers`, `travel pay that has not changed in ten years`, `merchandise shares nobody can explain`, `a rule forcing workers to accept any spot they are given`], asker: [`a grey-haired veteran with a bad hip`, `a delegation of mid-card workers`, `the youngest face on the card, who looks terrified`] },
    body: [`A folded sheet of paper reaches you through {asker}: a list of grievances about {issue}, with a dozen signatures and a blank line waiting for yours. A name from the top of the card would carry more weight than any ten at the bottom.`, `{gm.name} will see this eventually, and the question in the room is who it reaches first and in whose handwriting. People have been quietly released for less.`],
    choices: [
      { id: 'sign', label: `Sign the list and put your name where it counts`, risk: 'high', outcomes: [
        { weight: 1, bonus: { popularity: 0.5 }, text: `The list goes up the chain with a famous name on it, and someone listens. A modest change follows, and the room starts looking at you like a person who has done a thing.`, effects: [{ conf: 5 }, { pop: 0.3 }, { flag: 'locker_room_voice' }] },
        { weight: 2, text: `The list goes up, the message goes down and a memo about "professionalism" follows within a week. You get the thanks of the room and the cold shoulder of the office.`, effects: [{ conf: 2 }, { pop: -0.6 }, { flag: 'locker_room_voice' }] } ] },
      { id: 'private', label: `Carry the concern to {gm.name} privately, without the list`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{gm.name} hears you out and promises to look into it. The promise is partial and slow, but it is yours, and nobody gets hurt.`, effects: [{ conf: 2 }, { flag: 'locker_room_voice' }] },
        { weight: 1, text: `{gm.name} nods through your entire argument and does nothing about it. The locker room hears you went upstairs alone and starts wondering about whose side you are on.`, effects: [{ conf: -3 }, { pop: -0.1 }, { flag: 'locker_room_voice' }] } ] },
      { id: 'meeting', label: `Organise a proper meeting among the veterans first`, risk: 'low', result: `You spend two evenings talking to people one at a time and writing a calmer, shorter version of the list. It is slow and exhausting, and it turns a tantrum into a case.`, effects: [{ fatigue: 8 }, { conf: 3 }, { attr: { name: 'psychology', delta: 1 } }, { flag: 'locker_room_voice' }] },
      { id: 'stay_out', label: `Wish them luck and keep your name off it`, risk: 'low', result: `You hand the paper back with a sympathetic look. The refusal is gentle, and the fact that it was a choice sits between you and the people who asked.`, effects: [{ conf: -3 }, { pop: 0.1 }, { fatigue: -1 }] },
    ],
  },
  {
    id: 'nb_bs_day_off_gone', category: 'backstage', title: `Your Day Off Has Been Spoken For`, weight: 2, contexts: ['weekly'], cooldownDays: 90, maxPerCareer: 4, categoryCooldown: 5,
    cast: { gm: { pick: 'staff', role: 'gm' } },
    trigger: { stat: { fatigue: { gte: 40 } } },
    slots: { reason: [`an added house show`, `a last-minute television taping`, `a sponsor dinner`, `a charity appearance the company promised`], plan: [`a physio appointment that took a month to book`, `a long-planned lunch with your family`, `the first full day of sleep in a fortnight`, `a rare chance to see a friend who lives two states away`] },
    body: [`{gm.name} calls at eight in the morning to say that {reason} has landed on your day off. You had been counting down to {plan}, and the voice on the phone is warm, apologetic and completely unmovable.`, `There is a way to say yes that costs nothing and a way that costs everything, and you have been in the business long enough to know both.`],
    choices: [
      { id: 'yes', label: `Say yes and take the extra pay`, risk: 'low', result: `You swallow the disappointment, check the call time and watch your plan quietly vanish. The extra check is real, and so is the tiredness.`, effects: [{ money: 700 }, { fatigue: 9 }, { conf: -1 }, { flag: 'owes_gm_favor' }] },
      { id: 'trade', label: `Ask to swap it for a different day`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `{gm.name} sighs, scribbles a note and agrees to trade you a day later in the week. You lose some sleep, but not what you cared about most.`, effects: [{ fatigue: 4 }, { conf: 2 }] },
        { weight: 1, text: `The answer is a flat no with an apology wrapped around it. You work the day and lose the goodwill you would have spent anyway.`, effects: [{ fatigue: 9 }, { conf: -3 }, { money: 700 }] } ] },
      { id: 'refuse', label: `Refuse, since the day is yours`, risk: 'high', result: `You say no in the calmest voice you own. {gm.name} says "understood" in a tone that means more than the word, and the day is yours at the price of being known as difficult.`, effects: [{ fatigue: -10 }, { conf: 3 }, { pop: -0.4 }, { flag: 'known_to_refuse' }] },
      { id: 'bonus', label: `Take it, but ask for a bonus and a lighter week`, risk: 'med', outcomes: [
        { weight: 1, bonus: { confidence: 0.5 }, text: `{gm.name} winces and agrees to both. It is a small win and a precedent, and you feel a bit like a professional.`, effects: [{ money: 1400 }, { fatigue: 4 }, { conf: 3 }] },
        { weight: 2, text: `Only the first half of your request survives. You work the extra day for the usual rate and feel taken advantage of.`, effects: [{ money: 700 }, { fatigue: 9 }, { conf: -2 }] } ] },
    ],
  },
  {
    id: 'nb_bs_producer_notes', category: 'backstage', title: `Notes That Were Entirely Correct`, weight: 1.5, contexts: ['post_match', 'post_show'], cooldownDays: 100, maxPerCareer: 4, categoryCooldown: 4,
    cast: { producer: { pick: 'staff', role: 'producer' } },
    trigger: { stat: { matches: { gte: 8 } }, minYear: 1993 },
    slots: { mistake: [`stepped on a line in the middle of a promo`, `missed a cue and left four seconds of dead air`, `abandoned the finish when the crowd turned on you`, `showed your frustration on camera`], tone: [`in the hallway, with the crew walking past`, `in a quiet room with the door shut`, `on a note slipped under your locker door`] },
    body: [`{producer.name} delivers the notes {tone}, and every sentence is accurate. The problem tonight was that you {mistake}, and the tone is gentle in the way a scalpel is gentle.`, `You feel the heat climb your neck, followed by something worse, which is recognition. The fix would have taken a moment's attention, and you had been busy thinking about yourself.`],
    choices: [
      { id: 'take_notes', label: `Take every note and thank {producer.first} sincerely`, risk: 'low', result: `You write them down, say thank you and mean it, even though your face is on fire. By the next show the fix is in your hands, and so is a small thread of trust.`, effects: [{ conf: -1 }, { attr: { name: 'psychology', delta: 1 } }, { flag: 'producer_trusts_you' }, { fatigue: 2 }] },
      { id: 'defend', label: `Defend your choices and explain what you were thinking`, risk: 'high', outcomes: [
        { weight: 1, bonus: { mic: 0.4, confidence: 0.4 }, text: `Your reasoning is sound enough that {producer.first} stops mid-sentence and reconsiders. For one minute, you are colleagues arguing craft instead of student and teacher.`, effects: [{ conf: 4 }, { pop: 0.1 }] },
        { weight: 2, text: `Defensiveness comes out of your mouth faster than you can stop it. The conversation ends with arms crossed and notes that become shorter in future.`, effects: [{ conf: -2 }, { flag: 'producer_annoyed' }] } ] },
      { id: 'tape', label: `Ask to watch the tape together and learn it properly`, risk: 'med', result: `Forty minutes in a dim room with a remote, rewinding the same eight seconds. It is humbling, and it is the most useful forty minutes you will have this month.`, effects: [{ fatigue: 4 }, { attr: { name: 'technical', delta: 1 } }, { conf: 2 }, { mic: 1 }] },
      { id: 'withdraw', label: `Nod, leave and brood in the parking lot`, risk: 'low', result: `You sit in the car with the engine off and replay the moment until it no longer feels like yours. The drive back is long, and the fix never makes it onto paper.`, effects: [{ conf: -4 }, { fatigue: 3 }, { pop: -0.1 }] },
    ],
  },
  {
    id: 'nb_bs_last_one_out', category: 'backstage', title: `The Arena After Everyone Leaves`, weight: 1.5, contexts: ['post_show'], cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 5,
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { sweep: [`a janitor pushing a broom along the barricade`, `the crew coiling cable into steel cases`, `a lone ring technician checking every bolt`], hour: [`just past midnight`, `two hours after the final bell`, `an hour before dawn`] },
    body: [`The arena is almost empty {hour}, and the loudest thing in it is {sweep}. You stayed because the hotel room is quieter than this, and somehow it is also louder.`, `Somewhere above you, a single work light buzzes over the ring. The seats still hold the shape of eight thousand people who needed something, and you gave it to them.`],
    choices: [
      { id: 'talk', label: `Sit on a case and talk with whoever is still there`, risk: 'low', result: `The conversation wanders through hometowns, bad knees and a sandwich somebody swears by. When you finally leave, you know three more names than you did, and the building feels like a place instead of a job.`, effects: [{ conf: 3 }, { fatigue: 3 }, { flag: 'crew_friend' }] },
      { id: 'help', label: `Help carry cases to the truck`, risk: 'med', result: `The work warms your hands and quiets your head. Your back hates the load, and the crew chief gives you a quick nod you did not know you wanted.`, effects: [{ fatigue: 9 }, { attr: { name: 'toughness', delta: 1 } }, { conf: 2 }] },
      { id: 'walk_ring', label: `Walk the ring alone and think`, risk: 'low', result: `You run a hand along the top rope, stand where the lights found you hours earlier and let the silence say its piece. It is not sad exactly, just honest.`, effects: [{ conf: 3 }, { fatigue: -3 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'hotel', label: `Head for the hotel and sleep`, risk: 'low', result: `The shower is hot, the bed is flat and the sleep arrives within minutes. You skip the strange tenderness of the empty building and take the rest instead.`, effects: [{ fatigue: -9 }] },
    ],
  },
  {
    id: 'nb_bs_sponsor_line', category: 'backstage', title: `A Line About {product}`, weight: 1.5, contexts: ['pre_show', 'show_day'], cooldownDays: 120, maxPerCareer: 3, categoryCooldown: 5,
    cast: { exec: { pick: 'staff', role: 'executive' } },
    trigger: { stat: { popularity: { gte: 25 }, mic: { gte: 30 } } },
    slots: { product: [`an energy drink`, `a regional bank`, `a rental-car company`, `a mattress brand`], moment: [`in the middle of your best promo`, `just after the pre-match handshake`, `as the closing line of your interview`] },
    body: [`{exec.name} has a single request for the night: work a short line about {product} into your act {moment}. The company is paid either way, and the character you built has strong opinions about almost everything except this.`, `The line is printed on a card and underlined twice. Written in marker, it somehow looks heavier than it should.`],
    choices: [
      { id: 'read_it', label: `Read the line cleanly and get it over with`, risk: 'low', result: `You say the words as written, with a pause before them, and the camera moves on. {exec.name} sends a thank-you; the crowd barely blinks.`, effects: [{ money: 700 }, { conf: -1 }, { pop: -0.1 }] },
      { id: 'weave', label: `Work it into the act so it sounds like you`, risk: 'high', outcomes: [
        { weight: 2, bonus: { mic: 0.7, charisma: 0.4 }, text: `You twist the line into a joke at your own expense, and the crowd roars. The sponsor calls it the best minute they have ever bought.`, effects: [{ money: 1200 }, { pop: 0.5 }, { mic: 1 }, { conf: 3 }] },
        { weight: 1, text: `The twist lands sideways and the sponsor's name comes out garbled. A tense memo goes up the chain by morning.`, effects: [{ money: 200 }, { pop: -0.3 }, { conf: -3 }] } ] },
      { id: 'mock', label: `Play it with open irony and wink at the crowd`, risk: 'high', result: `The crowd laughs, loudly, at the setup. The sponsor does not, and {exec.name} shows up outside your locker with a short and unfriendly message.`, effects: [{ pop: 0.6 }, { conf: 2 }, { money: -300 }, { flag: 'sponsor_snub' }] },
      { id: 'decline', label: `Decline politely, since the character would not say it`, risk: 'med', result: `{exec.name} frowns and puts the card away. You explain the reasons carefully, and they are good ones, but they cost you a favor you would have wanted later.`, effects: [{ conf: 2 }, { money: -200 }, { pop: -0.1 }, { flag: 'sponsor_snub' }] },
    ],
  },
  // ======================= PERSONAL =======================
  {
    id: 'nb_pe_funeral_date', category: 'personal', title: `A Funeral on the Calendar`, weight: 2.5, major: true, cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 10,
    cast: { gm: { pick: 'staff', role: 'gm' } },
    trigger: { stat: { careerYears: { gte: 1 } } },
    slots: { who: [`your grandmother`, `your grandfather`, `the uncle who first took you to a show`, `your first coach`], timing: [`the day before a big show`, `the same night as a television taping`, `halfway through a long road swing`] },
    body: [`The phone rings at an hour that is never good news. The call says that {who} has passed, and the funeral is set for {timing}.`, `{gm.name} offers condolences in a quiet voice and then waits, kindly, for you to say what you need. Grief has no schedule, and the card does not move.`],
    choices: [
      { id: 'go_home', label: `Go home for the whole week and be with family`, risk: 'low', result: `You sit in a church that smells of lilies and old coats, hold a cousin's hand and cry in a kitchen that has not changed since you were nine. The business can wait a few days, and so can you.`, effects: [{ pop: -0.7 }, { money: -1800 }, { fatigue: -14 }, { conf: 4 }] },
      { id: 'work_dedicate', label: `Work the show and dedicate the match`, risk: 'med', outcomes: [
        { weight: 2, bonus: { confidence: 0.4, charisma: 0.4 }, text: `You wrestle the best match of your month with a name written on the inside of your wrist tape. Nobody in the building knows, and for twelve minutes it is enough that you do.`, effects: [{ pop: 0.6 }, { conf: 4 }, { fatigue: 8 }, { flag: 'dedicated_match' }] },
        { weight: 1, text: `The grief catches you mid-match and the timing goes soft. You finish on muscle memory and cry quietly in the shower afterward.`, effects: [{ pop: -0.3 }, { conf: -3 }, { fatigue: 10 }, { flag: 'dedicated_match' }] } ] },
      { id: 'fly_in_out', label: `Fly in for the service and fly out that night`, risk: 'high', result: `You make the funeral, hug everyone too briefly and spend the night in a middle seat staring at the dark. It is possible to be in two places and fully in neither.`, effects: [{ money: -900 }, { fatigue: 14 }, { conf: -1 }, { pop: 0.1 }] },
      { id: 'send_flowers', label: `Send flowers and a letter, and stay with the show`, risk: 'med', result: `The letter is honest and the flowers are plain, the way you remember {who} being. You tell yourself it was the practical choice, and the thought sits badly on the way to the arena.`, effects: [{ money: -150 }, { conf: -4 }, { fatigue: 4 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'nb_pe_old_letter', category: 'personal', title: `A Letter From {writer}`, weight: 1.5, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 10,
    trigger: { stat: { popularity: { gte: 20 } } },
    slots: { writer: [`your old high-school coach`, `the neighbor who drove you to your first trainings`, `the teacher who once told you to get real`, `the owner of the gym where you started`], keepsake: [`a faded photograph`, `a newspaper clipping`, `a ticket stub`, `a hand-drawn poster`] },
    body: [`The envelope comes forwarded through three offices, stamped and smudged. Inside, in careful cursive, {writer} says something plain: they watched, and they are proud, and here is {keepsake} to prove they always believed.`, `You have been so busy surviving that you forgot anyone was keeping score on your behalf. Some debts do not have invoices attached.`],
    choices: [
      { id: 'write_back', label: `Write back a long, honest reply`, risk: 'low', result: `It takes you most of a flight and four drafts to say thank you properly. When you mail it, you feel lighter than you have in weeks.`, effects: [{ conf: 4 }, { fatigue: 3 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'send_tickets', label: `Send front-row tickets and a travel stipend`, risk: 'low', requires: { stat: { money: { gte: 900 } } }, result: `{writer} turns up on the night in a good jacket, beaming in the front row and pretending to be unimpressed. The crowd around them has no idea who they are, which is exactly the point.`, effects: [{ money: -800 }, { conf: 4 }, { pop: 0.1 }] },
      { id: 'visit', label: `Drive out to see them in person`, risk: 'med', result: `You take a day off you did not have and sit at a kitchen table with coffee that has been brewing since morning. It is the most unguarded conversation you have had in a year.`, effects: [{ fatigue: 6 }, { conf: 5 }, { pop: -0.2 }, { money: -250 }] },
      { id: 'keep_quiet', label: `Tuck the letter in your bag and mean to reply later`, risk: 'low', result: `The envelope rides in your bag from town to town, creased at the corners. Every time you see it, it is both a comfort and a small, steady accusation.`, effects: [{ conf: 1 }, { fatigue: 1 }] },
    ],
  },
  {
    id: 'nb_pe_three_am', category: 'personal', title: `Doubts at {hour}`, weight: 2, contexts: ['weekly', 'post_show'], cooldownDays: 150, maxPerCareer: 3, categoryCooldown: 10,
    trigger: { any: [{ stat: { confidence: { lte: 45 } } }, { stat: { loseStreak: { gte: 3 } } }, { stat: { fatigue: { gte: 70 } } }] },
    slots: { hour: [`3:12 in the Morning`, `the Grey Hour Before Sunrise`, `Half Past Midnight`], thought: [`you started a decade too late to be any good`, `nobody would notice if you simply stopped`, `your body no longer forgives what you do to it`, `everyone else seems to have a plan and you only have a schedule`] },
    body: [`The hotel ceiling is a perfectly boring shade of beige, and you have been staring at it for an hour. A voice you recognise as your own has begun explaining, very reasonably, that {thought}.`, `There is no match to wrestle your way out of, just a room, a clock and a bag by the door. This is the part of the job that no highlight reel ever shows.`],
    choices: [
      { id: 'call', label: `Call someone who will pick up at this hour`, risk: 'low', result: `The phone rings four times and a thick voice says your name. You talk about nothing, then something, and by the end the ceiling has gone back to being a ceiling.`, effects: [{ conf: 5 }, { fatigue: -3 }, { money: -10 }] },
      { id: 'walk', label: `Dress and walk the empty streets`, risk: 'low', result: `The air is cold and the town is asleep. After forty minutes you reach a diner with its lights on, order eggs, and realise the voice has gone quiet.`, effects: [{ conf: 3 }, { fatigue: 3 }, { money: -15 }, { attr: { name: 'endurance', delta: 1 } }] },
      { id: 'write', label: `Write the doubts down and answer each one`, risk: 'med', outcomes: [
        { weight: 2, bonus: { psychology: 0.4 }, text: `On the back of a room-service menu, the monsters shrink to the size of items on a list. You fall asleep with the pen in your hand and a plan for Tuesday.`, effects: [{ conf: 4 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: -2 }] },
        { weight: 1, text: `Writing it down only makes it more real. You end up with a page of confessions and an alarm clock that rings in ninety minutes.`, effects: [{ conf: -3 }, { fatigue: 4 }] } ] },
      { id: 'sleep_on_it', label: `Turn over, pull up the covers and wait for morning`, risk: 'low', result: `You do not solve anything, but you do not break anything either. By nine the room is sunlit and the voice from last night sounds like a bad actor.`, effects: [{ fatigue: -5 }, { conf: -1 }] },
    ],
  },
  {
    id: 'nb_pe_parent_ringside', category: 'personal', title: `Someone From Home Is in the Building`, weight: 2, contexts: ['show_day', 'pre_show'], cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 10,
    trigger: { stat: { popularity: { gte: 30 }, careerYears: { gte: 1 } } },
    slots: { who: [`your mother`, `your father`, `your grandmother`, `your older sister`], seat: [`the front row`, `a corner of the balcony`, `the upper deck behind a pillar`] },
    body: [`Tonight, {who} is in the building for the first time. The ticket was bought months ago and kept secret, and the seat is in {seat}, where a face you know better than any crowd sits very still in the lights.`, `Everything about your work was designed for strangers who will be gone by morning. For once, someone who will remember all of it is watching you do it.`],
    choices: [
      { id: 'dedicate', label: `Do everything exactly as you would, and dedicate it silently`, risk: 'low', result: `You work the match you always do, with a private thought threaded through every move. When you glance up at the end, a hand is raised and wiping a cheek.`, effects: [{ conf: 4 }, { pop: 0.3 }, { fatigue: 5 }] },
      { id: 'backstage', label: `Bring them backstage before the show`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.4 }, text: `They meet half the locker room, who are shockingly gracious. A veteran tells a story about you that you did not know anyone had noticed.`, effects: [{ conf: 5 }, { pop: 0.1 }, { fatigue: 4 }] },
        { weight: 1, text: `Backstage turns out to be loud, ugly and frightening. They leave early with a stiff smile, and the evening ends on a strange silence.`, effects: [{ conf: -3 }, { fatigue: 5 }] } ] },
      { id: 'ask_review', label: `Ask for their honest opinion afterward`, risk: 'med', result: `Over late coffee they tell you what they saw: a person they barely recognised, who was brave, and who looked tired. It is the hardest review you will ever read and the most useful.`, effects: [{ conf: 2 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 3 }, { money: -40 }] },
      { id: 'compartment', label: `Keep it compartmentalised, and treat it as a normal night`, risk: 'low', result: `You never look at the seat. The match is clean and cold, and afterward you are not entirely sure what you were afraid of.`, effects: [{ pop: 0.1 }, { conf: -2 }, { fatigue: 2 }] },
    ],
  },
  {
    id: 'nb_pe_holiday_road', category: 'personal', title: `Spending {holiday} on the Road`, weight: 2, contexts: ['weekly', 'show_day'], cooldownDays: 330, maxPerCareer: 3, categoryCooldown: 10,
    trigger: { month: [11, 12], stat: { careerYears: { gte: 1 } } },
    slots: { holiday: [`Thanksgiving`, `Christmas Eve`, `a Long December Weekend`], meal: [`gas-station sandwiches`, `room service eaten on top of the bedspread`, `a drive-thru bag in a hotel parking lot`] },
    body: [`The road does not stop for holidays. This year you are in a hotel off a highway with {meal}, and the only decorations in sight are a cardboard turkey on the front desk and the glow of a television.`, `Down the corridor, a few other workers have the same look: no family close enough, no flight that makes sense, and a long evening to fill.`],
    choices: [
      { id: 'make_dinner', label: `Organise a makeshift dinner for whoever is stranded`, risk: 'low', requires: { stat: { money: { gte: 300 } } }, result: `You buy rotisserie chickens, rolls and a very sweet pie, and a crowd of strays fills a conference room. Someone says grace awkwardly, and for two hours nobody is alone.`, effects: [{ money: -250 }, { conf: 3 }, { pop: 0.1 }, { fatigue: 3 }] },
      { id: 'long_call', label: `Call home and stay on the line for an hour`, risk: 'low', result: `Voices overlap in the background, someone laughs at a joke you missed, and your mother passes the phone around. It is the closest you will be to the table this year.`, effects: [{ conf: 3 }, { fatigue: -5 }, { money: -20 }] },
      { id: 'children_ward', label: `Visit the local children's ward with a bag of toys`, risk: 'med', result: `The nurses are delighted and the kids are suspicious, then thrilled. You leave with sore cheeks and a faint ache you cannot name, a good one.`, effects: [{ money: -200 }, { pop: 0.6 }, { conf: 3 }, { fatigue: 5 }] },
      { id: 'sleep_in', label: `Sleep through it and pretend it is an ordinary day`, risk: 'low', result: `You lie on top of the covers and let the day pass. It is peaceful in the way an empty room is peaceful, and you wake at dusk to the sound of a neighbour's laughter through the wall.`, effects: [{ fatigue: -10 }, { conf: -3 }] },
    ],
  },
  {
    id: 'nb_pe_waiting_results', category: 'personal', title: `Waiting for {wait}`, weight: 2, major: true, cooldownDays: 200, maxPerCareer: 2, categoryCooldown: 10,
    trigger: { injured: true },
    slots: { wait: [`the MRI Results`, `a Second Opinion on the X-Rays`, `the Specialist's Call`], place: [`alone in a hotel room`, `in a waiting room with a dozen strangers`, `in a rental car outside the clinic`] },
    body: [`You are sitting {place}, phone face-up on your knee, for {wait} that may or may not mean the end of the thing you do. The injury is real, the day is long and every scenario in your head ends differently.`, `Wrestlers learn to be calm under pressure in a ring, where the finish is rehearsed. There is no rehearsal for a doctor reading a screen.`],
    choices: [
      { id: 'call_friend', label: `Call someone you trust and talk about anything else`, risk: 'low', result: `You laugh about a bus story from last spring and a terrible haircut. The call ends and the phone rings ten minutes later, and for once you are able to answer it steadily.`, effects: [{ conf: 4 }, { fatigue: -2 }, { money: -10 }] },
      { id: 'plan_b', label: `Use the wait to research a second career`, risk: 'med', result: `By the time the phone rings, you have three notebooks of options and a reluctant, quiet acceptance that the sport might not be forever. The call is mixed news, and you take it better than you expected.`, effects: [{ conf: 1 }, { attr: { name: 'psychology', delta: 1 } }, { fatigue: 3 }, { flag: 'has_plan_b' }] },
      { id: 'train_distraction', label: `Train the parts that still work until you are exhausted`, risk: 'high', outcomes: [
        { weight: 2, bonus: { toughness: 0.4 }, text: `Sweat takes the edge off the fear, and the results, when they come, are better than they might have been. You sleep like a stone.`, effects: [{ conf: 3 }, { fatigue: 6 }, { attr: { name: 'endurance', delta: 1 } }] },
        { weight: 1, text: `You push the sound side too hard and strain something else, which is exactly the kind of joke the universe likes.`, effects: [{ injury: { part: 'legs', severity: 1, days: 7 } }, { conf: -3 }, { fatigue: 8 }] } ] },
      { id: 'pretend_fine', label: `Pretend it does not matter and go to the arena as normal`, risk: 'med', result: `You smile at everyone, joke with the crew and ask about their kids. By the evening, the smile has gone stiff, and somebody in catering quietly asks if you are okay.`, effects: [{ conf: -3 }, { fatigue: 5 }, { pop: 0.1 }] },
    ],
  },
  {
    id: 'nb_pe_sibling_resentment', category: 'personal', title: `Your {sibling} Finally Says It`, weight: 1.5, contexts: ['weekly'], cooldownDays: 300, maxPerCareer: 2, categoryCooldown: 10,
    trigger: { stat: { popularity: { gte: 30 } } },
    slots: { sibling: [`older brother`, `younger sister`, `twin`, `cousin raised like a sibling`], grievance: [`a loan that was never repaid or mentioned`, `every holiday you missed for a house show`, `being asked about you at every family dinner for years`, `a college fund quietly spent on your trainer`] },
    body: [`Over a quiet dinner, your {sibling} puts down a fork and says what has been waiting for years. It is about {grievance}, and there is no cruelty in it, only a flat and unmistakable hurt.`, `The restaurant is half-empty and the waiter has the good sense to stay away. Every comfortable excuse you have prepared suddenly feels like wallpaper.`],
    choices: [
      { id: 'listen_apologise', label: `Listen to all of it and apologise without excuses`, risk: 'low', result: `It takes an hour, and some of it is very hard to hear. When the check arrives, the two of you are laughing again, softly and with an edge, and you leave with something more honest than you came with.`, effects: [{ conf: 2 }, { fatigue: 4 }, { attr: { name: 'psychology', delta: 1 } }] },
      { id: 'make_amends', label: `Write a check that makes it right`, risk: 'med', requires: { stat: { money: { gte: 2500 } } }, outcomes: [
        { weight: 2, text: `The money helps, and so does the fact that you thought of it. It does not close the whole gap, but it makes space for the rest to be said.`, effects: [{ money: -2200 }, { conf: 3 }] },
        { weight: 1, text: `The check is pushed back across the table without being read. "I wanted you to hear me," your {sibling} says, and the point is not wrong.`, effects: [{ conf: -3 }, { fatigue: 3 }] } ] },
      { id: 'defend', label: `Defend yourself and explain what it costs to do your job`, risk: 'high', result: `The explanation is accurate and it is also the wrong time. Your {sibling} nods slowly, leaves enough cash for the meal and goes quiet for weeks.`, effects: [{ conf: -4 }, { pop: -0.1 }, { fatigue: 3 }] },
      { id: 'change_subject', label: `Smile, order dessert and change the subject`, risk: 'low', result: `The cheesecake arrives and the moment slips under the table. Nothing is fixed, and both of you know it.`, effects: [{ conf: -2 }, { fatigue: 1 }] },
    ],
  },
  {
    id: 'nb_pe_reunion', category: 'personal', title: `The Class Reunion`, weight: 1.5, contexts: ['offseason', 'weekly'], cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 10,
    trigger: { stat: { careerYears: { gte: 2 }, popularity: { gte: 20 } } },
    slots: { question: [`"So is any of it real?"`, `"Can you get me tickets?"`, `"Weren't you the one who got suspended junior year?"`, `"Do you actually hurt people?"`], venue: [`a banquet hall with a punch bowl`, `a bowling alley rented for the night`, `the old school gym under faded banners`] },
    body: [`Your reunion is in {venue}, and every conversation you have starts the same way: a delighted face, a glance down at your shoulders and the inevitable question. Within the first twenty minutes, someone asks, {question}`, `The people you were teased by are now accountants, dentists and the proud parents of toddlers. Their politeness has an odd shape, like a hand held out to shake that might turn into a joke.`],
    choices: [
      { id: 'character', label: `Slip into the character voice and give them a show`, risk: 'med', outcomes: [
        { weight: 2, bonus: { charisma: 0.6, mic: 0.4 }, text: `A circle forms, the phones come out of pockets and the room howls. Even the former class president demands a catchphrase.`, effects: [{ pop: 0.5 }, { conf: 3 }, { fatigue: 4 }] },
        { weight: 1, text: `A few people laugh and a few go quiet. You realise you are performing for classmates who wanted a human being.`, effects: [{ conf: -2 }, { fatigue: 4 }] } ] },
      { id: 'honest', label: `Answer honestly about the grind and the bruises`, risk: 'low', result: `You describe the long drives, the cheap hotels and the fear that does not appear on television. A quiet woman near the back says it is the first honest thing anyone has said all night.`, effects: [{ conf: 3 }, { attr: { name: 'psychology', delta: 1 } }, { pop: 0.1 }, { fatigue: 2 }] },
      { id: 'deflect', label: `Deflect with a joke and a cold drink`, risk: 'low', result: `The joke earns an easy laugh and a pat on the shoulder. You leave with a pleasant, shallow evening and no new stories.`, effects: [{ conf: 0 }, { pop: 0.1 }, { fatigue: -2 }] },
      { id: 'leave_early', label: `Slip away before the slideshow starts`, risk: 'med', result: `You drive through the town you grew up in with the radio low. It looks smaller, and it looks proud of you somehow, and it does not ask anything.`, effects: [{ conf: -1 }, { fatigue: -4 }] },
    ],
  },
  {
    id: 'nb_pe_old_coach_call', category: 'personal', title: `Coach Ray Is in the Hospital`, weight: 2, major: true, cooldownDays: 365, maxPerCareer: 1, categoryCooldown: 10,
    trigger: { stat: { careerYears: { gte: 3 } } },
    slots: { condition: [`a stroke last spring`, `a diagnosis he refuses to name`, `a hip that will not mend`], greeting: [`a gravelly laugh on the phone`, `a voicemail you have replayed twice`, `a note from his daughter`] },
    body: [`The news arrives through {greeting}. Coach Ray, the man who taught you how to fall without breaking, is in a hospital bed after {condition}, and he has asked that nobody make a fuss.`, `He drilled you for hours in a barn with a leaking roof and never once said he was proud. You find that you have been waiting your whole career for a sentence he may not have time to say.`],
    choices: [
      { id: 'visit_now', label: `Fly out this week and sit with him`, risk: 'med', result: `The hospital smells of disinfectant and burnt toast. He grumbles about your stance, asks for a rematch with a card game and, as you leave, mutters four words you will not repeat to anyone.`, effects: [{ money: -700 }, { fatigue: 9 }, { conf: 6 }, { pop: -0.3 }, { flag: 'visited_coach' }] },
      { id: 'weekly_call', label: `Promise yourself to call every Sunday`, risk: 'low', result: `The first call is short and awkward, the second is longer and by the fourth you have a rhythm. He complains about the food, you tell him about the crowds, and the distance feels smaller than it is.`, effects: [{ conf: 3 }, { fatigue: 2 }, { flag: 'weekly_calls' }] },
      { id: 'send_belt', label: `Send him something from your career with a note`, risk: 'low', result: `You mail a signed program and a photograph from the night you first felt like a wrestler. The reply, in his daughter's hand, says he has asked for it to be hung over the bed.`, effects: [{ money: -80 }, { conf: 3 }, { pop: 0.1 }] },
      { id: 'delay', label: `Tell yourself you will go when the schedule clears`, risk: 'high', result: `The schedule never clears, and the days compress like a spring. You read the news a month later with the quiet clarity of someone who knew better.`, effects: [{ conf: -6 }, { pop: 0.2 }, { fatigue: 3 }] },
    ],
  },
  {
    id: 'nb_pe_pet_strangers', category: 'personal', title: `Your {pet} Looks at You Like a Stranger`, weight: 1, cooldownDays: 240, maxPerCareer: 2, categoryCooldown: 10,
    trigger: { stat: { careerYears: { gte: 1.5 }, fatigue: { gte: 30 } } },
    slots: { pet: [`old retriever`, `border collie`, `grumpy tabby`], absence: [`six weeks on the road`, `a long overseas tour`, `a month of back-to-back dates`] },
    body: [`You come home after {absence} with a bag that smells like twelve hotels and a body that wants to be horizontal. Your {pet} stares at you from the hallway as if you were a delivery, and then slowly, almost shyly, comes over to sniff your boots.`, `The house has a lived-in silence that tells you it is quite good at running without you. The pet's patience hurts more than any scolding would.`],
    choices: [
      { id: 'floor', label: `Sit on the floor and wait for them to come around`, risk: 'low', result: `It takes forty minutes, a cold dinner and one very small lick on the wrist. Then the whole animal climbs into your lap as though nothing happened.`, effects: [{ fatigue: 5 }, { conf: 4 }] },
      { id: 'park', label: `Take the pet to the park for a long walk`, risk: 'low', result: `Sunlight, mud and a stick of questionable provenance: both of you are filthy and delighted by the end. Your legs complain; your head does not.`, effects: [{ fatigue: -3 }, { conf: 3 }, { attr: { name: 'endurance', delta: 1 } }] },
      { id: 'sitter', label: `Hire someone to look after them properly when you travel`, risk: 'low', requires: { stat: { money: { gte: 400 } } }, result: `A kind retired neighbour agrees to take over for a monthly fee and good biscuits. You will miss them anyway, but you will not have to worry.`, effects: [{ money: -350 }, { conf: 2 }, { fatigue: -3 }] },
      { id: 'consider_home', label: `Admit that the road is taking more than it gives`, risk: 'med', result: `You say it aloud to an empty kitchen, and the sentence sits there like furniture. Nothing changes tonight, but you spend the next day quietly pricing a smaller schedule.`, effects: [{ conf: -2 }, { fatigue: -4 }, { flag: 'considering_home' }] },
    ],
  },
];
