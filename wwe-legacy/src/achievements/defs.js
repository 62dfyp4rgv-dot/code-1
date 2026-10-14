// The achievement library: pure data. Each entry is a declarative requirement evaluated by
// engine.js against real ledger events. Tiered families are generated from compact tables.
const D = [];
const add = (id, name, desc, category, rarity, req, extra = {}) => D.push({ id, name, desc, category, rarity, req, ...extra });
const win = { 'data.result': 'win' };
const mrCount = (where, gte = 1) => ({ count: { type: 'match_result', where }, gte });
const rarityFor = (n, steps) => { const i = steps.indexOf(n); const r = i / Math.max(1, steps.length - 1); return r < 0.2 ? 'common' : r < 0.5 ? 'uncommon' : r < 0.75 ? 'rare' : r < 0.95 ? 'epic' : 'legendary'; };

// ------------------------------------------------------------------ debut
add('debut', 'Welcome to the Big Time', 'Make your professional debut.', 'debut', 'common', { count: { type: 'debut' }, gte: 1 });
add('first_match', 'Trial by Fire', 'Wrestle your first match.', 'debut', 'common', mrCount({}));
add('first_tv_match', 'Lights, Camera, Action', 'Wrestle your first televised match on a weekly show.', 'debut', 'common', mrCount({ 'data.show': ['Raw', 'SmackDown', 'NXT'] }));
add('first_weekly_win', 'Opening Statement', 'Win your first match on a weekly show.', 'debut', 'common', mrCount({ ...win, 'data.show': ['Raw', 'SmackDown', 'NXT'] }));
add('first_ple', 'Big Stage', 'Compete in your first Premium Live Event or pay-per-view.', 'debut', 'uncommon', mrCount({ 'data.ppv': { exists: true } }));
add('first_wrestlemania', 'The Showcase of the Immortals', 'Compete at WrestleMania for the first time.', 'debut', 'rare', mrCount({ 'data.ppvTier': { gte: 2 } }));
add('first_main_event', 'Top of the Card', 'Compete in your first main event.', 'debut', 'rare', mrCount({ 'data.mainEvent': true }));
add('first_main_event_ple', 'Headline Act', 'Main event a Premium Live Event.', 'debut', 'epic', mrCount({ 'data.mainEvent': true, 'data.ppv': { exists: true } }));
add('first_wm_main_event', 'Closing the Show', 'Main event WrestleMania.', 'debut', 'legendary', mrCount({ 'data.mainEvent': true, 'data.ppvTier': { gte: 2 } }));
add('all_three_brands', 'Brand Hopper', 'Wrestle on three different shows.', 'debut', 'uncommon', { distinct: { type: 'match_result', field: 'data.show' }, gte: 3 });

// ------------------------------------------------------------------ in-ring
add('first_pinfall', 'One, Two, Three', 'Win a match by pinfall.', 'in-ring', 'common', mrCount({ ...win, 'data.finish': 'pinfall' }));
add('first_submission', 'Tapped Out', 'Win a match by submission.', 'in-ring', 'common', mrCount({ ...win, 'data.finish': 'submission' }));
add('first_dq_win', 'By Any Means', 'Win a match by disqualification or count-out.', 'in-ring', 'common', mrCount({ ...win, 'data.finish': ['dq', 'countout'] }));
add('first_clean_win', 'Clean as a Whistle', 'Win a match cleanly - no interference, DQ or count-out.', 'in-ring', 'common', mrCount({ ...win, 'data.clean': true }));
add('first_loss', 'Lesson Learned', 'Lose a match. Every legend has been here.', 'in-ring', 'common', mrCount({ 'data.result': 'loss' }));
add('first_draw', 'Time Expired', 'Wrestle a match to a time-limit draw.', 'in-ring', 'common', mrCount({ 'data.result': 'draw' }));
add('first_upset', 'Giant Slayer', 'Beat an opponent who was rated far above you.', 'in-ring', 'uncommon', mrCount({ ...win, 'data.upset': true }));
add('first_comeback_win', 'Never Say Die', 'Win a match after being out-damaged by your opponent.', 'in-ring', 'uncommon', mrCount({ ...win, 'data.comeback': true }));
add('first_finisher_win', 'Finish Line', 'Win a match with your finishing move.', 'in-ring', 'common', mrCount({ ...win, 'data.finisherUsed': true, 'data.finishMoveIsFinisher': true }));
add('first_reversal', 'Turn the Tables', 'Reverse an opponent\'s move.', 'in-ring', 'common', { sum: { type: 'match_result', field: 'data.reversalsMade' }, gte: 1 });
add('first_finisher_reversal', 'Read Like a Book', 'Reverse your opponent\'s finishing move.', 'in-ring', 'uncommon', { sum: { type: 'match_result', field: 'data.finisherReversalsMade' }, gte: 1 });
add('first_rating_3', 'Solid Work', 'Have a match rated 3 stars or better.', 'in-ring', 'common', mrCount({ 'data.rating': { gte: 3 } }));
add('first_rating_4', 'Match of the Night', 'Have a match rated 4 stars or better.', 'in-ring', 'uncommon', mrCount({ 'data.rating': { gte: 4 } }));
add('first_rating_45', 'Instant Classic', 'Have a match rated 4.5 stars or better.', 'in-ring', 'rare', mrCount({ 'data.rating': { gte: 4.5 } }));
add('first_five_star', 'Five-Star Classic', 'Have a match reach the full five-star rating.', 'in-ring', 'epic', mrCount({ 'data.rating': { gte: 5 } }));
add('five_five_star', 'Mr. Five Star', 'Have five five-star matches.', 'in-ring', 'legendary', mrCount({ 'data.rating': { gte: 5 } }, 5));
add('beat_rival', 'Settling the Score', 'Defeat someone you have a rivalry with.', 'in-ring', 'uncommon', mrCount({ ...win, 'data.vsRival': true }));
add('rival_sweep', 'Rivalry Sweep', 'Beat the same rival three times.', 'in-ring', 'rare', { custom: 'rival_sweep', watch: ['match_result'] });
add('nearfall_king', 'Nearly There', 'Survive five near-falls in a single match and win it.', 'in-ring', 'rare', mrCount({ ...win, 'data.nearFallsSurvived': { gte: 5 } }));
add('submission_specialist', 'Submission Specialist', 'Win ten matches by submission.', 'in-ring', 'rare', mrCount({ ...win, 'data.finish': 'submission' }, 10));
add('pinfall_machine', 'Pin Machine', 'Win 25 matches by pinfall.', 'in-ring', 'rare', mrCount({ ...win, 'data.finish': 'pinfall' }, 25));
add('iron_survivor', 'The Iron Survivor', 'Win a match lasting at least 30 simulated minutes.', 'in-ring', 'epic', mrCount({ ...win, 'data.durationSec': { gte: 1800 } }));
add('marathon', 'Marathon Man', 'Wrestle a match lasting at least 45 minutes.', 'in-ring', 'legendary', mrCount({ 'data.durationSec': { gte: 2700 } }));
add('quick_win', 'Blink and You Miss It', 'Win a match in under two minutes.', 'in-ring', 'uncommon', mrCount({ ...win, 'data.durationSec': { lte: 120 } }));
add('flawless', 'Flawless Victory', 'Win a match while taking almost no damage.', 'in-ring', 'rare', mrCount({ ...win, 'data.damageTaken': { lte: 20 }, 'data.durationSec': { gte: 300 } }));
add('war', 'A War', 'Win an extended match after enduring severe punishment.', 'in-ring', 'epic', { custom: 'survived_war', args: { minutes: 20, damage: 220 }, watch: ['match_result'] });
for (const t of ['tag', 'submission', 'no_dq', 'last_man', 'iron_man', 'ladder', 'cage', 'hell_cell', 'tlc']) {
  const nm = { tag: 'Tag Team', submission: 'Submission', no_dq: 'No DQ', last_man: 'Last Man Standing', iron_man: 'Iron Man', ladder: 'Ladder', cage: 'Steel Cage', hell_cell: 'Hell in a Cell', tlc: 'Tables, Ladders & Chairs' }[t];
  add(`win_${t}`, `${nm} Winner`, `Win a ${nm} match.`, 'in-ring', t === 'hell_cell' || t === 'iron_man' || t === 'tlc' ? 'rare' : 'uncommon', mrCount({ ...win, 'data.matchType': t }));
}
add('win_mitb', 'Briefcase Holder', 'Win the Money in the Bank ladder match and take down the briefcase.', 'in-ring', 'epic', { count: { type: 'milestone', where: { 'data.kind': 'money_in_the_bank' } }, gte: 1 });
add('all_stipulations', 'Stipulation Specialist', 'Win in five different match types.', 'in-ring', 'epic', { distinct: { type: 'match_result', field: 'data.matchType', where: win }, gte: 5 });
add('matches_100', 'Veteran of the Ring', 'Wrestle 100 matches.', 'in-ring', 'uncommon', mrCount({}, 100));
for (const n of [1, 10, 25, 50, 100, 250, 500, 1000]) {
  if (n === 1) continue;
  add(`wins_${n}`, `${n} Victories`, `Win ${n} matches.`, 'in-ring', rarityFor(n, [10, 25, 50, 100, 250, 500, 1000]), mrCount(win, n));
}
for (const n of [250, 500, 1000]) add(`matches_${n}`, `${n} Matches`, `Wrestle ${n} matches.`, 'in-ring', n >= 1000 ? 'legendary' : n >= 500 ? 'epic' : 'rare', mrCount({}, n));
add('win_pct_70', 'Dominant Record', 'Keep a 70% win rate over at least 50 matches.', 'in-ring', 'epic', { custom: 'win_rate', args: { pct: 0.7, min: 50 }, watch: ['match_result'] });

// ------------------------------------------------------------------ streaks
for (const n of [3, 5, 10, 15, 20, 30, 50]) {
  add(`streak_${n}`, `${n} in a Row`, `Win ${n} consecutive matches.`, 'streak', n <= 3 ? 'common' : n <= 5 ? 'uncommon' : n <= 10 ? 'rare' : n <= 20 ? 'epic' : 'legendary', { streak: { type: 'match_result', where: win }, gte: n });
}
add('undefeated_year', 'Undefeated Season', 'Go a full calendar year unbeaten (at least 10 matches).', 'streak', 'legendary', { custom: 'undefeated_year', args: { n: 10 }, watch: ['match_result'] });
add('comeback_slump', 'Out of the Slump', 'Win three straight after losing three straight.', 'streak', 'uncommon', { custom: 'comeback_after_slump', args: { lose: 3, win: 3 }, watch: ['match_result'] });
add('defense_streak_5', 'Five Straight Defenses', 'Make five successful title defenses in a row.', 'streak', 'rare', { streak: { type: 'title_defense', where: { 'data.success': true } }, gte: 5 });
add('defense_streak_10', 'Unbreakable', 'Make ten successful title defenses in a row.', 'streak', 'epic', { streak: { type: 'title_defense', where: { 'data.success': true } }, gte: 10 });
add('lose_streak_5', 'Rock Bottom', 'Suffer five straight losses. It can only get better.', 'streak', 'uncommon', { streak: { type: 'match_result', where: { 'data.result': 'loss' } }, gte: 5 }, { secret: true });

// ------------------------------------------------------------------ championships
add('first_title', 'And the New...', 'Win your first championship.', 'championship', 'rare', { count: { type: 'title_win' }, gte: 1 });
add('first_defense', 'Fighting Champion', 'Make your first successful title defense.', 'championship', 'uncommon', { count: { type: 'title_defense', where: { 'data.success': true } }, gte: 1 });
for (const n of [5, 10, 25, 50]) add(`defenses_${n}`, `${n} Title Defenses`, `Successfully defend a championship ${n} times.`, 'championship', n >= 50 ? 'legendary' : n >= 25 ? 'epic' : 'rare', { count: { type: 'title_defense', where: { 'data.success': true } }, gte: n });
add('title_2', 'Two-Time Champion', 'Win championships twice.', 'championship', 'rare', { count: { type: 'title_win' }, gte: 2 });
add('title_5', 'Five-Time Champion', 'Win championships five times.', 'championship', 'epic', { count: { type: 'title_win' }, gte: 5 });
add('title_10', 'Ten-Time Champion', 'Win championships ten times.', 'championship', 'legendary', { count: { type: 'title_win' }, gte: 10 });
add('world_title', 'World Champion', 'Win a world championship.', 'championship', 'epic', { count: { type: 'title_win', where: { 'data.titleClass': 'world' } }, gte: 1 });
add('world_title_3', 'Three-Time World Champion', 'Win a world championship three times.', 'championship', 'legendary', { count: { type: 'title_win', where: { 'data.titleClass': 'world' } }, gte: 3 });
add('midcard_title', 'Midcard Gold', 'Win a secondary championship.', 'championship', 'uncommon', { count: { type: 'title_win', where: { 'data.titleClass': 'secondary' } }, gte: 1 });
add('tag_title', 'Tag Team Gold', 'Win a tag team championship.', 'championship', 'uncommon', { count: { type: 'title_win', where: { 'data.titleClass': 'tag' } }, gte: 1 });
add('dev_title', 'Developmental Gold', 'Win a developmental championship.', 'championship', 'uncommon', { count: { type: 'title_win', where: { 'data.titleClass': 'developmental' } }, gte: 1 });
add('womens_title', 'Women\'s Champion', 'Win a women\'s championship.', 'championship', 'epic', { count: { type: 'title_win', where: { 'data.titleClass': 'womens' } }, gte: 1 });
add('wm_title', 'Champion at the Grandest Stage', 'Win a championship at WrestleMania.', 'championship', 'epic', { count: { type: 'title_win', where: { 'data.wmWin': true } }, gte: 1 });
add('wm_defense', 'Retained at WrestleMania', 'Successfully defend a title at WrestleMania.', 'championship', 'epic', { count: { type: 'title_defense', where: { 'data.success': true, 'data.ppvTier': { gte: 2 } } }, gte: 1 });
add('double_champ', 'Double Champion', 'Hold two championships at the same time.', 'championship', 'epic', { stat: 'titles.maxSimultaneous', gte: 2, evidence: 'titleWins' });
add('triple_champ', 'Triple Crown Holder', 'Hold three championships at the same time.', 'championship', 'legendary', { stat: 'titles.maxSimultaneous', gte: 3, evidence: 'titleWins' });
add('unification', 'Undisputed', 'Unify two championships.', 'championship', 'legendary', { count: { type: 'title_unify' }, gte: 1 });
add('reign_90', '90-Day Reign', 'Hold a championship for 90 days.', 'championship', 'uncommon', { custom: 'reign_length', args: { days: 90 }, watch: ['title_win', 'title_loss', 'match_result', 'title_defense'] });
add('reign_365', 'A Year on Top', 'Hold a championship for a full year.', 'championship', 'epic', { custom: 'reign_length', args: { days: 365 }, watch: ['title_win', 'title_loss', 'match_result', 'title_defense'] });
add('reign_700', 'Historic Reign', 'Hold a championship for 700 days.', 'championship', 'legendary', { custom: 'reign_length', args: { days: 700 }, watch: ['title_win', 'title_loss', 'match_result', 'title_defense'] });
add('grand_slam_3', 'Slam', 'Win three different classes of championship.', 'championship', 'epic', { distinct: { type: 'title_win', field: 'data.titleClass' }, gte: 3 });
add('grand_slam', 'Grand Slam Champion', 'Win four different classes of championship.', 'championship', 'legendary', { distinct: { type: 'title_win', field: 'data.titleClass' }, gte: 4 });
add('grand_slam_era', 'Era Grand Slam', 'Complete a Grand Slam within a single era.', 'championship', 'legendary', { custom: 'era_grand_slam', watch: ['title_win'] });
add('record_reign', 'Record Breaker', 'Break an all-time championship record.', 'championship', 'legendary', { count: { type: 'record_set', where: { 'data.category': 'championship' } }, gte: 1 });
add('first_title_defense_loss', 'Lost the Belt', 'Lose a championship. The chase begins again.', 'championship', 'common', { count: { type: 'title_loss' }, gte: 1 });
add('title_from_champion', 'Taking It From the Champ', 'Win a championship by pinning or submitting the reigning champion.', 'championship', 'uncommon', mrCount({ ...win, 'data.titleChange': true }));
add('title_no_finisher', 'Pure Wrestling', 'Win a championship without hitting your finisher.', 'championship', 'epic', mrCount({ ...win, 'data.titleChange': true, 'data.finisherUsed': false }), { secret: true });
add('title_after_slump', 'The Long Road Back', 'Win a championship after a prolonged losing period.', 'championship', 'epic', { custom: 'title_after_slump', args: { window: 10, lossesIn: 6 }, watch: ['title_win'] }, { secret: true });
add('giant_killer', 'Giant Killer', 'Dethrone a dominant champion against the odds.', 'championship', 'legendary', mrCount({ ...win, 'data.titleChange': true, 'data.upset': true }), { secret: true });

// ------------------------------------------------------------------ Royal Rumble
add('rumble_entry', 'Number 17', 'Enter your first Royal Rumble.', 'rumble', 'uncommon', { count: { type: 'rumble_result' }, gte: 1 });
add('rumble_elim', 'Over the Top Rope', 'Eliminate an opponent in a Royal Rumble.', 'rumble', 'uncommon', { sum: { type: 'rumble_result', field: 'data.eliminations' }, gte: 1 });
add('rumble_elim_5', 'Carnage', 'Eliminate five wrestlers in one Royal Rumble.', 'rumble', 'rare', { max: { type: 'rumble_result', field: 'data.eliminations' }, gte: 5 });
add('rumble_elim_10', 'Iron Man of the Rumble', 'Eliminate ten wrestlers in one Royal Rumble.', 'rumble', 'legendary', { max: { type: 'rumble_result', field: 'data.eliminations' }, gte: 10 });
add('rumble_survive_30', 'Survivor', 'Last 30 minutes in a Royal Rumble.', 'rumble', 'rare', { max: { type: 'rumble_result', field: 'data.survivalSec' }, gte: 1800 });
add('rumble_final_two', 'Final Two', 'Reach the final two of a Royal Rumble.', 'rumble', 'rare', { count: { type: 'rumble_result', where: { 'data.finalTwo': true } }, gte: 1 });
add('rumble_win', 'Royal Rumble Winner', 'Win the Royal Rumble.', 'rumble', 'legendary', { count: { type: 'rumble_result', where: { 'data.won': true } }, gte: 1 });
add('rumble_win_2', 'Back-to-Back', 'Win the Royal Rumble in consecutive years.', 'rumble', 'legendary', { stat: 'rumble.bestConsecutiveWins', gte: 2, evidence: 'rumbles' });
add('rumble_underdog', 'Number One Wins It', 'Win the Royal Rumble entering from the first three spots.', 'rumble', 'legendary', { count: { type: 'rumble_result', where: { 'data.won': true, 'data.entryNumber': { lte: 3 } } }, gte: 1 });
add('rumble_promise_kept', 'Promise Kept', 'Promise to win the Rumble - and do it.', 'rumble', 'epic', { count: { type: 'promise_kept', where: { 'data.kind': 'win_rumble' } }, gte: 1 });
add('rumble_3', 'Rumble Regular', 'Enter three Royal Rumbles.', 'rumble', 'uncommon', { count: { type: 'rumble_result' }, gte: 3 });

// ------------------------------------------------------------------ promos
add('first_promo', 'Grab the Mic', 'Cut your first promo.', 'promo', 'common', { count: { type: 'promo_delivered' }, gte: 1 });
add('promo_good', 'Silver Tongue', 'Deliver a promo rated 70 or higher.', 'promo', 'uncommon', { count: { type: 'promo_delivered', where: { 'data.quality': { gte: 70 } } }, gte: 1 });
add('promo_great', 'Promo of the Year', 'Deliver a promo rated 90 or higher.', 'promo', 'epic', { count: { type: 'promo_delivered', where: { 'data.quality': { gte: 90 } } }, gte: 1 });
add('promo_viral', 'Gone Viral', 'Deliver a promo that goes viral.', 'promo', 'rare', { count: { type: 'promo_delivered', where: { 'data.viral': true } }, gte: 1 });
add('promo_10', 'Born Talker', 'Cut ten promos.', 'promo', 'uncommon', { count: { type: 'promo_delivered' }, gte: 10 });
add('promo_50', 'Voice of the Company', 'Cut fifty promos.', 'promo', 'epic', { count: { type: 'promo_delivered' }, gte: 50 });
add('confrontation_win', 'Verbal Victory', 'Win a verbal confrontation.', 'promo', 'common', { count: { type: 'confrontation', where: { 'data.won': true } }, gte: 1 });
add('confrontation_nonviolent', 'Words Not Fists', 'Win a major verbal confrontation without any physical violence.', 'promo', 'rare', { count: { type: 'confrontation', where: { 'data.won': true, 'data.physical': false, 'data.major': true } }, gte: 1 });
add('exposed_weakness', 'Exposed', 'Expose an opponent\'s weakness in a promo.', 'promo', 'uncommon', { count: { type: 'promo_delivered', where: { 'data.exposedWeakness': true } }, gte: 1 });
add('promise_kept_1', 'Man of My Word', 'Keep a public promise.', 'promo', 'uncommon', { count: { type: 'promise_kept' }, gte: 1 });
add('promise_kept_5', 'Guaranteed', 'Keep five public promises.', 'promo', 'epic', { count: { type: 'promise_kept' }, gte: 5 });
add('promise_broken_1', 'Eating Words', 'Fail to keep a public promise.', 'promo', 'common', { count: { type: 'promise_broken' }, gte: 1 }, { secret: true });
add('challenge_issued', 'Open Challenge', 'Issue a public challenge.', 'promo', 'common', { count: { type: 'promo_delivered', where: { 'data.tone': 'challenge' } }, gte: 1 });
add('tribute_given', 'Class Act', 'Pay tribute to an opponent in a promo.', 'promo', 'uncommon', { count: { type: 'promo_delivered', where: { 'data.tone': ['tribute', 'respect'] } }, gte: 1 });

// ------------------------------------------------------------------ media
add('first_podcast', 'On the Air', 'Appear on a podcast.', 'media', 'common', { count: { type: 'podcast' }, gte: 1 });
add('podcast_5', 'Podcast Circuit', 'Appear on five podcasts.', 'media', 'uncommon', { count: { type: 'podcast' }, gte: 5 });
add('first_press', 'Press Pass', 'Take part in a press conference.', 'media', 'common', { count: { type: 'press_conference' }, gte: 1 });
add('first_interview', 'Sit-Down', 'Give a backstage or in-ring interview.', 'media', 'common', { count: { type: 'interview' }, gte: 1 });
add('viral_interview', 'Viral Interview', 'Give an interview that goes viral.', 'media', 'rare', { count: { type: 'interview', where: { 'data.viral': true } }, gte: 1 });
add('best_interview', 'Quote of the Year', 'Give an interview rated 90 or higher.', 'media', 'epic', { count: { type: 'interview', where: { 'data.quality': { gte: 90 } } }, gte: 1 });
add('controversy_handled', 'Damage Control', 'Successfully address a controversy at a press conference.', 'media', 'uncommon', { count: { type: 'press_conference', where: { 'data.controversy': true, 'data.handled': true } }, gte: 1 });
add('persona', 'A Recognizable Face', 'Build a recognizable public persona (popularity milestone).', 'media', 'rare', { count: { type: 'milestone', where: { 'data.kind': 'persona' } }, gte: 1 });
add('viral_3', 'Internet Sensation', 'Have three viral moments.', 'media', 'epic', { stat: 'viral', gte: 3, watch: ['social_post', 'podcast', 'interview'] });
add('social_post', 'Posting Through It', 'Make a social media post that gets a major reaction.', 'media', 'common', { count: { type: 'social_post' }, gte: 1 });
add('media_all', 'Media Mogul', 'Do a promo, podcast, press conference and interview.', 'media', 'uncommon', { all: [{ count: { type: 'promo_delivered' }, gte: 1 }, { count: { type: 'podcast' }, gte: 1 }, { count: { type: 'press_conference' }, gte: 1 }, { count: { type: 'interview' }, gte: 1 }] });

// ------------------------------------------------------------------ relationships
add('alliance', 'Strength in Numbers', 'Form an alliance.', 'relationship', 'common', { count: { type: 'alliance_formed' }, gte: 1 });
add('faction_member', 'Part of Something', 'Join a faction.', 'relationship', 'common', { count: { type: 'faction_joined' }, gte: 1 });
add('faction_leader', 'Stable Boss', 'Form a faction as its leader.', 'relationship', 'rare', { count: { type: 'faction_formed', where: { 'data.leaderIsPlayer': true } }, gte: 1 });
add('long_alliance', 'Ride or Die', 'Maintain an alliance for a full year without betrayal.', 'relationship', 'epic', { custom: 'long_alliance', args: { days: 365 }, watch: ['match_result', 'alliance_formed', 'betrayal', 'milestone'] });
add('avenged', 'Revenge Served Cold', 'Defeat someone who betrayed you.', 'relationship', 'rare', { custom: 'avenged_betrayal', watch: ['match_result', 'betrayal'] });
add('reconciled_rival', 'Buried the Hatchet', 'Reconcile with a former rival.', 'relationship', 'uncommon', { count: { type: 'reconciliation', where: { 'data.formerRival': true } }, gte: 1 });
add('betrayer', 'Snake in the Grass', 'Betray an ally or faction.', 'relationship', 'uncommon', { count: { type: 'betrayal', where: { 'data.byPlayer': true } }, gte: 1 }, { secret: true });
add('trusted_partner_win', 'Trusted Teammates', 'Win a major match alongside a trusted partner.', 'relationship', 'rare', mrCount({ ...win, 'data.trustedPartner': true, 'data.ppv': { exists: true } }));
add('mentor', 'Passing the Torch', 'Mentor a younger wrestler.', 'relationship', 'uncommon', { count: { type: 'mentorship', where: { 'data.byPlayer': true } }, gte: 1 });
add('mentored', 'Learning from the Best', 'Be mentored by a veteran.', 'relationship', 'common', { count: { type: 'mentorship', where: { 'data.byPlayer': false } }, gte: 1 });
add('clean_rivalry', 'A Rivalry of Respect', 'Finish a rivalry of three matches with no betrayal, DQ or interference.', 'relationship', 'rare', { custom: 'clean_rivalry', args: { matches: 3 }, watch: ['match_result', 'betrayal'] }, { secret: true });
add('respect_10', 'Respected by the Locker Room', 'Show respect to opponents ten times.', 'relationship', 'uncommon', { count: { type: 'respect_shown' }, gte: 10 });

// ------------------------------------------------------------------ career
add('rookie_year', 'Rookie of the Year', 'Win the Rookie of the Year award.', 'career', 'epic', { count: { type: 'award', where: { 'data.kind': 'rookie_of_the_year' } }, gte: 1 });
add('breakout', 'Breakout Superstar', 'Win the Breakout Superstar award.', 'career', 'epic', { count: { type: 'award', where: { 'data.kind': 'breakout_star' } }, gte: 1 });
add('wrestler_year', 'Wrestler of the Year', 'Win Wrestler of the Year.', 'career', 'legendary', { count: { type: 'award', where: { 'data.kind': 'wrestler_of_the_year' } }, gte: 1 });
add('comeback_year', 'Comeback of the Year', 'Win Comeback of the Year.', 'career', 'epic', { count: { type: 'award', where: { 'data.kind': 'comeback_of_the_year' } }, gte: 1 });
add('match_year', 'Match of the Year', 'Be part of the Match of the Year.', 'career', 'epic', { count: { type: 'award', where: { 'data.kind': 'match_of_the_year' } }, gte: 1 });
add('main_event_regular', 'Main Event Regular', 'Main event ten shows.', 'career', 'rare', mrCount({ 'data.mainEvent': true }, 10));
add('hof', 'Hall of Famer', 'Be inducted into the Hall of Fame.', 'career', 'legendary', { count: { type: 'hall_of_fame' }, gte: 1 });
add('legendary_retirement', 'Out on Top', 'Retire after a legendary career.', 'career', 'legendary', { count: { type: 'retirement', where: { 'data.legendary': true } }, gte: 1 });
add('retired', 'The Final Bell', 'Retire from in-ring competition.', 'career', 'rare', { count: { type: 'retirement' }, gte: 1 });
add('record_year', 'Record-Breaking Year', 'Win 50 matches in a calendar year.', 'career', 'epic', { custom: 'year_wins', args: { n: 50 }, watch: ['match_result'] });
add('record_set', 'Record Holder', 'Set an all-time record.', 'career', 'epic', { count: { type: 'record_set' }, gte: 1 });
add('injury_return', 'Back From the Brink', 'Return from a serious injury.', 'career', 'uncommon', { count: { type: 'return', where: { 'data.daysOut': { gte: 60 } } }, gte: 1 });
add('first_injury', 'Part of the Business', 'Suffer an injury.', 'career', 'common', { count: { type: 'injury' }, gte: 1 });
add('contract_signed', 'Ink on Paper', 'Sign a contract.', 'career', 'common', { count: { type: 'contract_signed' }, gte: 1 });
add('brand_move', 'Draft Day', 'Change brands.', 'career', 'uncommon', { count: { type: 'brand_transfer' }, gte: 1 });
add('millionaire', 'Seven Figures', 'Save a million dollars.', 'career', 'epic', { count: { type: 'milestone', where: { 'data.kind': 'savings_million' } }, gte: 1 });
add('merch_king', 'Merch Moves', 'Reach a top-selling merchandise milestone.', 'career', 'rare', { count: { type: 'milestone', where: { 'data.kind': 'merch_top' } }, gte: 1 });
add('popularity_50', 'Fan Favorite Material', 'Reach 50 popularity.', 'career', 'uncommon', { count: { type: 'milestone', where: { 'data.kind': 'popularity', 'data.value': { gte: 50 } } }, gte: 1 });
add('popularity_80', 'Household Name', 'Reach 80 popularity.', 'career', 'epic', { count: { type: 'milestone', where: { 'data.kind': 'popularity', 'data.value': { gte: 80 } } }, gte: 1 });
add('popularity_95', 'A Legend in the Making', 'Reach 95 popularity.', 'career', 'legendary', { count: { type: 'milestone', where: { 'data.kind': 'popularity', 'data.value': { gte: 95 } } }, gte: 1 });
add('years_5', 'Five Years In', 'Wrestle for five years.', 'career', 'rare', { count: { type: 'milestone', where: { 'data.kind': 'career_years', 'data.value': { gte: 5 } } }, gte: 1 });
add('years_10', 'A Decade of Sweat', 'Wrestle for ten years.', 'career', 'epic', { count: { type: 'milestone', where: { 'data.kind': 'career_years', 'data.value': { gte: 10 } } }, gte: 1 });
add('years_20', 'Two Decades', 'Wrestle for twenty years.', 'career', 'legendary', { count: { type: 'milestone', where: { 'data.kind': 'career_years', 'data.value': { gte: 20 } } }, gte: 1 });
add('skill_80', 'Master of the Craft', 'Raise any ring attribute to 80.', 'career', 'rare', { count: { type: 'milestone', where: { 'data.kind': 'attribute', 'data.value': { gte: 80 } } }, gte: 1 });
add('skill_95', 'Peak Performer', 'Raise any ring attribute to 95.', 'career', 'legendary', { count: { type: 'milestone', where: { 'data.kind': 'attribute', 'data.value': { gte: 95 } } }, gte: 1 });
add('unconventional', 'Off the Beaten Path', 'Main event WrestleMania without ever winning a championship.', 'career', 'legendary', { custom: 'main_event_no_title', watch: ['match_result', 'title_win'] }, { secret: true });
add('first_training', 'Hit the Gym', 'Complete a training session.', 'career', 'common', { count: { type: 'training' }, gte: 1 });
add('training_100', 'Gym Rat', 'Complete 100 training sessions.', 'career', 'rare', { count: { type: 'training' }, gte: 100 });
add('meta_10', 'Collector', 'Unlock 10 achievements.', 'career', 'uncommon', { count: { type: 'achievement_unlocked' }, gte: 10 });
add('meta_50', 'Completionist', 'Unlock 50 achievements.', 'career', 'epic', { count: { type: 'achievement_unlocked' }, gte: 50 });
add('meta_100', 'Hall of Achievements', 'Unlock 100 achievements.', 'career', 'legendary', { count: { type: 'achievement_unlocked' }, gte: 100 });

// ------------------------------------------------------------------ era-specific
const ERAS = ['golden', 'new_generation', 'attitude', 'ruthless', 'pg', 'reality', 'modern', 'current'];
for (const era of ERAS) {
  add(`era_champ_${era}`, `${era.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Era Champion`, `Win a world championship during the ${era.replace('_', ' ')} era.`, 'era', 'epic',
    { count: { type: 'title_win', where: { 'data.titleClass': 'world', 'data.era': era } }, gte: 1 }, { eras: [era] });
}

// ------------------------------------------------------------------ fun / odds
add('lucky_seven', 'Lucky Seven', 'Win seven matches in a row by pinfall.', 'rare', 'rare', { streak: { type: 'match_result', where: { ...win, 'data.finish': 'pinfall' } }, gte: 7 }, { secret: true });
add('no_selling', 'Superman Booking', 'Win ten matches while finishing with plenty of stamina left.', 'rare', 'rare', mrCount({ ...win, 'data.staminaLeft': { gte: 60 } }, 10), { secret: true });
add('dq_artist', 'Heel Tactics', 'Win three matches by DQ or count-out.', 'rare', 'uncommon', mrCount({ ...win, 'data.finish': ['dq', 'countout'] }, 3), { secret: true });
add('ten_matches_ple', 'PLE Veteran', 'Wrestle ten matches on PLEs.', 'rare', 'rare', mrCount({ 'data.ppv': { exists: true } }, 10));

export const ACHIEVEMENT_DEFS = D;
add('family_5', 'Home for Dinner', 'Spend five days with your family.', 'personal', 'common', { count: { type: 'life_activity', where: { 'data.activity': 'family' } }, gte: 5 });
add('life_balanced', 'Well Rounded', 'Try every kind of off-day activity: family, hobby, physio, a night out and the old gym.', 'personal', 'uncommon', { all: [{ count: { type: 'life_activity', where: { 'data.activity': 'family' } }, gte: 1 }, { count: { type: 'life_activity', where: { 'data.activity': 'hobby' } }, gte: 1 }, { count: { type: 'life_activity', where: { 'data.activity': 'physio' } }, gte: 1 }, { count: { type: 'life_activity', where: { 'data.activity': 'night_out' } }, gte: 1 }, { count: { type: 'life_activity', where: { 'data.activity': 'old_gym' } }, gte: 1 }] });
