// Move database. Moves are pure data: requirements (positions, stamina, momentum, rules),
// costs, risks and consequences. The resolver in resolve.js interprets them; nothing here
// decides outcomes. Finishers/signatures are *templates* that wrestlers instantiate under
// their own names (see instantiateMove).

export const POS = {
  STAND: 'standing', GROUND: 'grounded', CORNER: 'corner', ROPES: 'ropes',
  APRON: 'apron', OUTSIDE: 'outside', TOP: 'top',
};
const { STAND: S, GROUND: G, CORNER: C, ROPES: R, APRON: A, OUTSIDE: O, TOP: T } = POS;

export const BODY_PARTS = ['head', 'torso', 'arms', 'legs'];

/** Move categories (what the defender can read before the move lands). */
export const CATEGORIES = [
  'strike_light', 'strike_heavy', 'combo', 'grapple', 'technical', 'power', 'submission',
  'corner', 'aerial', 'signature', 'finisher', 'environmental', 'illegal', 'positioning',
];

/** Defensive "families" - the stance matrix is keyed by family. */
export function familyOf(cat) {
  switch (cat) {
    case 'strike_light': case 'strike_heavy': case 'combo': case 'corner': case 'environmental': case 'illegal': return 'strike';
    case 'grapple': case 'technical': case 'positioning': return 'grapple';
    case 'power': return 'power';
    case 'aerial': return 'aerial';
    case 'submission': return 'sub';
    case 'signature': case 'finisher': return 'special';
    default: return 'strike';
  }
}

const CAT_DEFAULT = {
  strike_light: { time: 14, mom: 2, heat: 1 },
  strike_heavy: { time: 22, mom: 4, heat: 2 },
  combo: { time: 28, mom: 5, heat: 3 },
  grapple: { time: 28, mom: 4, heat: 2 },
  technical: { time: 32, mom: 3, heat: 1 },
  power: { time: 40, mom: 7, heat: 4 },
  submission: { time: 45, mom: 5, heat: 3 },
  corner: { time: 24, mom: 4, heat: 2 },
  aerial: { time: 35, mom: 9, heat: 6 },
  signature: { time: 40, mom: 12, heat: 8 },
  finisher: { time: 50, mom: 0, heat: 14 },
  environmental: { time: 30, mom: 6, heat: 5 },
  illegal: { time: 15, mom: 2, heat: 0 },
  positioning: { time: 15, mom: 0, heat: 0 },
};

const MOVES = {};
function def(id, name, cat, tgt, dmg, cost, acc, atk, from, vs, o = {}) {
  const d = CAT_DEFAULT[cat];
  MOVES[id] = Object.freeze({
    id, name, cat, tgt, dmg, cost, acc, atk, from, vs,
    time: o.time ?? d.time, mom: o.mom ?? d.mom, heat: o.heat ?? d.heat,
    toA: o.toA, toD: o.toD, risk: o.risk, minMom: o.minMom ?? 0, minStamina: o.minStamina ?? cost,
    hold: o.hold, weapon: !!o.weapon, illegal: cat === 'illegal' || !!o.illegal,
    style: o.style || [], rules: o.rules, setup: !!o.setup, selfStamina: o.selfStamina || 0,
    pinBonus: o.pinBonus ?? 0, tpl: o.tpl, pinMove: !!o.pinMove, special: o.special,
  });
}

// pin-based surprise attacks and objective-match tools
def('roll_up', 'Roll-Up Pin', 'technical', 'torso', 2, 4, 0.6, { technical: 0.6, agility: 0.4 }, [S], [S], { pinMove: true, time: 14, style: ['technician', 'highflyer'] });
def('schoolboy', 'Schoolboy Pin', 'technical', 'torso', 2, 4, 0.56, { technical: 0.5, psychology: 0.5 }, [S], [S], { pinMove: true, time: 14 });
def('knock_off', 'Knock Them Off', 'power', 'torso', 17, 8, 0.64, { power: 0.7, agility: 0.3 }, [S], [T], { toD: G, special: 'topple', rules: ['objective'], mom: 10, heat: 8 });

// ---------------------------------------------------------------- strikes
def('forearm', 'Forearm Smash', 'strike_light', 'head', 5, 3, 0.78, { striking: 0.8, power: 0.2 }, [S, C], [S, C]);
def('chop', 'Chop', 'strike_light', 'torso', 6, 4, 0.76, { striking: 0.7, power: 0.3 }, [S], [S, C], { heat: 2 });
def('low_kick', 'Low Kick', 'strike_light', 'legs', 5, 3, 0.78, { striking: 0.7, agility: 0.3 }, [S], [S, C]);
def('jab_combo', 'Rapid Strikes', 'combo', 'head', 8, 6, 0.7, { striking: 0.9, agility: 0.1 }, [S], [S, C], { style: ['brawler'] });
def('knife_edge', 'Knife-Edge Chops', 'combo', 'torso', 9, 6, 0.7, { striking: 0.6, power: 0.4 }, [S], [C, S], { heat: 4, style: ['brawler'] });
def('clothesline', 'Clothesline', 'strike_heavy', 'head', 10, 7, 0.64, { striking: 0.6, power: 0.4 }, [S], [S], { toD: G, mom: 5 });
def('big_boot', 'Big Boot', 'strike_heavy', 'head', 11, 7, 0.62, { striking: 0.6, power: 0.3, agility: 0.1 }, [S], [S], { toD: G });
def('lariat', 'Lariat', 'strike_heavy', 'head', 12, 8, 0.6, { power: 0.5, striking: 0.5 }, [S], [S], { toD: G, style: ['powerhouse', 'brawler'] });
def('enzuigiri', 'Enzuigiri', 'strike_heavy', 'head', 10, 7, 0.58, { agility: 0.6, striking: 0.4 }, [S], [S], { toD: G, style: ['highflyer'] });
def('roundhouse', 'Spin Kick', 'strike_heavy', 'head', 11, 7, 0.6, { striking: 0.7, agility: 0.3 }, [S], [S], { toD: G, style: ['brawler', 'highflyer'] });
def('stomp', 'Stomps', 'strike_light', 'torso', 5, 3, 0.84, { striking: 0.6, power: 0.4 }, [S], [G]);
def('elbow_drop', 'Elbow Drop', 'strike_heavy', 'torso', 9, 6, 0.72, { power: 0.5, agility: 0.3, striking: 0.2 }, [S], [G]);
def('leg_drop', 'Leg Drop', 'strike_heavy', 'head', 10, 6, 0.7, { power: 0.5, agility: 0.5 }, [S], [G]);
def('knee_drop', 'Knee Drop to the Arm', 'strike_light', 'arms', 7, 4, 0.78, { power: 0.5, technical: 0.5 }, [S], [G], { style: ['technician'] });
def('ground_punches', 'Ground & Pound', 'combo', 'head', 8, 5, 0.76, { striking: 0.8, power: 0.2 }, [S, G], [G]);

// ---------------------------------------------------------------- grapples / technical
def('snapmare', 'Snapmare', 'grapple', 'head', 5, 3, 0.8, { grappling: 0.7, technical: 0.3 }, [S], [S], { toD: G });
def('arm_drag', 'Arm Drag', 'technical', 'arms', 6, 3, 0.74, { technical: 0.6, agility: 0.4 }, [S], [S], { toD: G, style: ['technician', 'highflyer'] });
def('wristlock', 'Wristlock', 'technical', 'arms', 6, 3, 0.8, { technical: 0.8, grappling: 0.2 }, [S], [S], { style: ['technician'] });
def('headlock', 'Headlock Takeover', 'technical', 'head', 5, 2, 0.82, { grappling: 0.6, technical: 0.4 }, [S], [S], { toD: G, selfStamina: 3 });
def('back_body_drop', 'Back Body Drop', 'grapple', 'torso', 9, 6, 0.7, { power: 0.5, grappling: 0.5 }, [S], [S], { toD: G });
def('neckbreaker', 'Neckbreaker', 'grapple', 'head', 12, 8, 0.66, { grappling: 0.7, technical: 0.3 }, [S], [S], { toD: G });
def('suplex', 'Vertical Suplex', 'grapple', 'torso', 13, 9, 0.65, { power: 0.5, grappling: 0.5 }, [S], [S], { toD: G });
def('dragon_screw', 'Dragon Screw', 'technical', 'legs', 11, 6, 0.62, { technical: 0.7, agility: 0.3 }, [S], [S], { toD: G, style: ['technician'] });
def('leg_sweep', 'Leg Sweep', 'technical', 'legs', 6, 3, 0.8, { technical: 0.5, agility: 0.5 }, [S], [S], { toD: G });
def('hurricanrana', 'Hurricanrana', 'technical', 'head', 11, 7, 0.58, { agility: 0.7, technical: 0.3 }, [S], [S], { toD: G, mom: 7, style: ['highflyer'] });
def('german_suplex', 'German Suplex', 'grapple', 'head', 15, 10, 0.6, { grappling: 0.6, power: 0.4 }, [S], [S], { toD: G, mom: 6 });
def('ddt', 'DDT', 'grapple', 'head', 14, 9, 0.64, { grappling: 0.6, technical: 0.4 }, [S], [S], { toD: G, mom: 6 });
def('fireman_carry', 'Fireman\'s Carry Slam', 'grapple', 'torso', 12, 8, 0.64, { power: 0.5, grappling: 0.5 }, [S], [S], { toD: G });
def('knee_breaker', 'Knee Breaker', 'grapple', 'legs', 11, 6, 0.68, { technical: 0.5, power: 0.5 }, [S], [S], { toD: G });
def('arm_breaker', 'Arm Breaker', 'grapple', 'arms', 11, 6, 0.68, { technical: 0.6, grappling: 0.4 }, [S], [S], { toD: G });
def('inverted_atomic', 'Atomic Drop', 'grapple', 'torso', 8, 5, 0.72, { power: 0.5, grappling: 0.5 }, [S], [S], { toA: S });

// positioning actions (cheap, shape the next exchange)
def('whip_corner', 'Irish Whip to Corner', 'positioning', 'torso', 3, 3, 0.78, { power: 0.5, grappling: 0.5 }, [S], [S], { toD: C, setup: true });
def('pick_up', 'Pick Opponent Up', 'positioning', 'torso', 0, 3, 0.8, { power: 0.5, grappling: 0.5 }, [S], [G], { toD: S, setup: true });
def('drag_up_corner', 'Drag to the Corner', 'positioning', 'torso', 2, 4, 0.78, { power: 0.6, grappling: 0.4 }, [S], [G], { toD: C, setup: true });
def('climb_top', 'Climb to the Top Rope', 'positioning', 'torso', 0, 3, 0.9, { agility: 0.7, psychology: 0.3 }, [S], [G], { toA: T, setup: true, risk: { part: 'legs', dmg: 3, note: 'slips on the climb' } });
def('toss_outside', 'Toss Outside', 'positioning', 'torso', 4, 6, 0.7, { power: 0.8, grappling: 0.2 }, [S], [S, G], { toD: O, setup: true, rules: ['outside'] });
def('follow_outside', 'Follow Outside', 'positioning', 'torso', 0, 2, 0.95, { agility: 1 }, [S, A], [O], { toA: O, setup: true, rules: ['outside'] });
def('trip_from_floor', 'Trip from the Floor', 'technical', 'legs', 6, 3, 0.74, { agility: 0.5, technical: 0.5 }, [O, A], [S], { toD: G, rules: ['outside'] });
def('slide_in_clothesline', 'Slide-In Clothesline', 'strike_heavy', 'head', 10, 6, 0.62, { striking: 0.6, agility: 0.4 }, [O], [S], { toA: S, toD: G, rules: ['outside'] });
def('drag_out', 'Grab Ankle & Drag Out', 'positioning', 'legs', 4, 4, 0.76, { power: 0.5, grappling: 0.5 }, [O, A], [G], { toD: O, setup: true, rules: ['outside'] });
def('roll_in', 'Roll Opponent Back In', 'positioning', 'torso', 0, 2, 0.9, { power: 0.5, grappling: 0.5 }, [O], [O], { toD: G, toA: S, setup: true });

// ---------------------------------------------------------------- corner
def('corner_clothesline', 'Corner Clothesline', 'corner', 'torso', 9, 6, 0.74, { power: 0.5, striking: 0.5 }, [S], [C]);
def('corner_punches', 'Mounted Corner Punches', 'corner', 'head', 8, 5, 0.78, { striking: 0.8, power: 0.2 }, [S], [C], { time: 26 });
def('corner_splash', 'Running Corner Splash', 'corner', 'torso', 11, 7, 0.7, { power: 0.7, agility: 0.3 }, [S], [C], { toD: G, style: ['powerhouse'] });
def('corner_dropkick', 'Corner Dropkick', 'corner', 'head', 10, 6, 0.68, { agility: 0.7, striking: 0.3 }, [S], [C], { toD: G, style: ['highflyer'] });
def('corner_backsplash', 'Corner Back Splash', 'corner', 'torso', 10, 6, 0.68, { power: 0.6, agility: 0.4 }, [S], [C], { style: ['powerhouse'] });
def('tree_of_woe', 'Tree of Woe Stomps', 'corner', 'head', 8, 6, 0.74, { power: 0.5, technical: 0.5 }, [S], [C], { style: ['technician', 'brawler'] });
def('superplex', 'Superplex', 'power', 'torso', 18, 13, 0.5, { power: 0.5, grappling: 0.5 }, [T], [C], { toA: G, toD: G, mom: 10, time: 45, risk: { part: 'torso', dmg: 8, note: 'is crushed in the fall' } });

// ---------------------------------------------------------------- power
def('body_slam', 'Body Slam', 'power', 'torso', 11, 8, 0.68, { power: 0.8, grappling: 0.2 }, [S], [S], { toD: G });
def('spinebuster', 'Spinebuster', 'power', 'torso', 16, 11, 0.6, { power: 0.8, grappling: 0.2 }, [S], [S], { toD: G, mom: 8 });
def('powerbomb', 'Powerbomb', 'power', 'torso', 20, 14, 0.52, { power: 0.9, grappling: 0.1 }, [S], [S], { toD: G, mom: 10, risk: { part: 'arms', dmg: 4, note: 'loses grip' } });
def('press_slam', 'Military Press Slam', 'power', 'torso', 17, 12, 0.56, { power: 1 }, [S], [S], { toD: G, mom: 9, style: ['powerhouse'] });
def('piledriver', 'Piledriver', 'power', 'head', 19, 13, 0.54, { power: 0.5, grappling: 0.5 }, [S], [S, G], { toD: G, mom: 10, illegal: false });
def('backbreaker', 'Backbreaker', 'power', 'torso', 14, 9, 0.64, { power: 0.7, grappling: 0.3 }, [S], [S], { toD: G, mom: 7 });
def('gutwrench_suplex', 'Gutwrench Suplex', 'power', 'torso', 15, 10, 0.6, { power: 0.7, grappling: 0.3 }, [S], [S], { toD: G, mom: 7 });
def('chokeslam', 'Chokeslam', 'power', 'torso', 17, 12, 0.56, { power: 0.9, grappling: 0.1 }, [S], [S], { toD: G, mom: 9, style: ['powerhouse'] });
def('toss_to_corner', 'Overhead Belly-to-Belly', 'power', 'torso', 13, 9, 0.62, { power: 0.8, grappling: 0.2 }, [S], [S], { toD: G, mom: 7 });
def('running_powerslam', 'Running Powerslam', 'power', 'torso', 15, 10, 0.6, { power: 0.8, agility: 0.2 }, [S], [S], { toD: G, mom: 8 });

// ---------------------------------------------------------------- aerial
def('dropkick', 'Dropkick', 'aerial', 'torso', 10, 6, 0.66, { agility: 0.8, striking: 0.2 }, [S], [S], { toD: G, toA: G, mom: 6, risk: { part: 'torso', dmg: 4, note: 'lands flat' } });
def('flying_crossbody', 'Flying Crossbody', 'aerial', 'torso', 14, 8, 0.6, { agility: 0.9, power: 0.1 }, [T], [S, C], { toA: G, toD: G, risk: { part: 'torso', dmg: 6, note: 'crashes to the mat' } });
def('top_elbow', 'Flying Elbow Drop', 'aerial', 'torso', 15, 9, 0.62, { agility: 0.8, power: 0.2 }, [T], [G], { toA: G, risk: { part: 'arms', dmg: 7, note: 'lands on the elbow' } });
def('diving_headbutt', 'Diving Headbutt', 'aerial', 'head', 16, 9, 0.58, { agility: 0.5, power: 0.3, toughness: 0.2 }, [T], [G], { toA: G, risk: { part: 'head', dmg: 8, note: 'hits nothing but mat' } });
def('moonsault_press', 'Moonsault', 'aerial', 'torso', 17, 11, 0.54, { agility: 1 }, [T], [G], { toA: G, mom: 11, risk: { part: 'torso', dmg: 8, note: 'crashes down' }, style: ['highflyer'] });
def('senton_bomb', 'Senton Bomb', 'aerial', 'torso', 17, 11, 0.56, { agility: 0.6, power: 0.4 }, [T], [G], { toA: G, risk: { part: 'torso', dmg: 8, note: 'lands awkwardly' } });
def('springboard_cross', 'Springboard Clothesline', 'aerial', 'head', 13, 8, 0.56, { agility: 0.8, striking: 0.2 }, [A], [S], { toA: G, toD: G, style: ['highflyer'] });
def('plancha', 'Suicide Dive', 'aerial', 'torso', 14, 8, 0.58, { agility: 1 }, [A, S], [O], { toA: O, risk: { part: 'legs', dmg: 6, note: 'hits the floor' }, style: ['highflyer'], rules: ['outside'] });
def('tornado_ddt', 'Tornado DDT', 'aerial', 'head', 14, 8, 0.58, { agility: 0.7, technical: 0.3 }, [S], [S], { toD: G, toA: G, style: ['highflyer'] });
def('corkscrew', 'Corkscrew Moonsault', 'aerial', 'torso', 19, 12, 0.5, { agility: 1 }, [T], [G], { toA: G, mom: 12, risk: { part: 'torso', dmg: 9, note: 'misjudges the landing' }, style: ['highflyer'] });

// ---------------------------------------------------------------- submissions (apply a hold)
function sub(id, name, tgt, atk, extra = {}) {
  def(id, name, 'submission', tgt, extra.dmg ?? 6, extra.cost ?? 8, extra.acc ?? 0.6, atk, extra.from || [S, G], [G],
    { hold: { tgt, sev: extra.sev ?? 13, drain: extra.drain ?? 4, breaks: true }, style: extra.style || ['technician'], mom: 5, toA: extra.toA });
}
sub('ankle_lock', 'Ankle Lock', 'legs', { technical: 0.7, grappling: 0.3 });
sub('figure_four', 'Figure-Four Leglock', 'legs', { technical: 0.6, grappling: 0.4 }, { sev: 15 });
sub('boston_crab', 'Boston Crab', 'legs', { grappling: 0.6, power: 0.4 });
sub('kneebar', 'Kneebar', 'legs', { technical: 0.8, grappling: 0.2 }, { sev: 15 });
sub('armbar', 'Cross Armbreaker', 'arms', { technical: 0.7, grappling: 0.3 }, { sev: 15 });
sub('hammerlock', 'Hammerlock Hold', 'arms', { technical: 0.6, grappling: 0.4 }, { sev: 11, cost: 6 });
sub('sleeper', 'Sleeper Hold', 'head', { grappling: 0.6, technical: 0.4 }, { sev: 11, drain: 7, cost: 7 });
sub('camel_clutch', 'Camel Clutch', 'torso', { power: 0.5, grappling: 0.5 }, { sev: 13, style: ['powerhouse'] });
sub('abdominal_stretch', 'Abdominal Stretch', 'torso', { technical: 0.5, grappling: 0.5 }, { sev: 10, cost: 6 });
sub('guillotine', 'Guillotine Choke', 'head', { technical: 0.5, grappling: 0.5 }, { sev: 14, drain: 6 });
def('rest_hold', 'Chinlock', 'technical', 'head', 4, 2, 0.84, { grappling: 0.7, technical: 0.3 }, [S, G], [S, G], { selfStamina: 7, time: 30, mom: 1 });

// ---------------------------------------------------------------- illegal / environmental
def('eye_rake', 'Eye Rake', 'illegal', 'head', 4, 2, 0.8, { psychology: 0.6, agility: 0.4 }, [S, C], [S], { mom: 3, heat: 3 });
def('low_blow', 'Low Blow', 'illegal', 'torso', 9, 3, 0.7, { psychology: 0.5, striking: 0.5 }, [S], [S], { toD: G, mom: 5, heat: 5 });
def('rope_choke', 'Choke on the Ropes', 'illegal', 'head', 6, 3, 0.8, { power: 0.5, psychology: 0.5 }, [S], [R, C], { heat: 3 });
def('hair_pull', 'Hair-Pull Takedown', 'illegal', 'head', 5, 2, 0.8, { grappling: 0.5, psychology: 0.5 }, [S], [S], { toD: G });
def('boot_choke', 'Boot Choke', 'illegal', 'head', 5, 2, 0.82, { power: 0.5, psychology: 0.5 }, [S], [G]);
def('chair_shot', 'Steel Chair Shot', 'environmental', 'head', 20, 5, 0.78, { striking: 0.5, psychology: 0.5 }, [S, O], [S, G, O], { weapon: true, mom: 8, heat: 8, toD: G, rules: ['weapons'] });
def('kendo_flurry', 'Kendo Stick Flurry', 'environmental', 'torso', 15, 5, 0.8, { striking: 0.7, psychology: 0.3 }, [S, O], [S, G, O], { weapon: true, mom: 6, heat: 6, rules: ['weapons'] });
def('trash_can_lid', 'Trash Can Lid Strike', 'environmental', 'head', 13, 4, 0.8, { striking: 0.6, psychology: 0.4 }, [S, O], [S, G, O], { weapon: true, mom: 5, heat: 5, toD: G, rules: ['weapons'] });
def('barricade_whip', 'Whip into the Barricade', 'environmental', 'torso', 16, 6, 0.72, { power: 0.6, grappling: 0.4 }, [O], [O], { mom: 7, heat: 6, toD: G, rules: ['weapons'] });
def('steps_slam', 'Ring Steps Slam', 'environmental', 'head', 20, 8, 0.64, { power: 0.8, grappling: 0.2 }, [O], [O], { mom: 9, heat: 8, toD: G, rules: ['weapons'] });
def('table_slam', 'Slam Through the Table', 'environmental', 'torso', 24, 12, 0.56, { power: 0.8, grappling: 0.2 }, [S, O], [S, G, O], { mom: 14, heat: 14, toD: G, rules: ['weapons'], risk: { part: 'arms', dmg: 4, note: 'crashes into the wreckage' } });
def('ladder_shot', 'Ladder Shot', 'environmental', 'head', 19, 8, 0.7, { striking: 0.5, power: 0.5 }, [S, O], [S, G, O], { weapon: true, mom: 8, heat: 8, toD: G, rules: ['weapons'] });
def('ground_pound_floor', 'Slam on the Floor', 'power', 'torso', 14, 9, 0.62, { power: 0.8, grappling: 0.2 }, [O], [O], { toD: G, mom: 7 });
def('apron_drop', 'Apron Slam', 'power', 'torso', 15, 9, 0.6, { power: 0.8, grappling: 0.2 }, [O], [O], { mom: 8, toD: G, heat: 5 });

// ---------------------------------------------------------------- signature templates (momentum-gated)
function sig(id, name, cat, tgt, dmg, cost, acc, atk, from, vs, o = {}) {
  def(id, name, 'signature', tgt, dmg, cost, acc, atk, from, vs, { minMom: 30, mom: 12, tpl: id, ...o, signatureOf: undefined });
  MOVES[id] = Object.freeze({ ...MOVES[id], baseCat: cat });
}
sig('sig_slam', 'Signature Slam', 'power', 'torso', 20, 12, 0.6, { power: 0.8, grappling: 0.2 }, [S], [S], { toD: G, style: ['powerhouse'] });
sig('sig_dive', 'Signature Dive', 'aerial', 'torso', 22, 12, 0.58, { agility: 0.9, power: 0.1 }, [T], [G], { toA: G, risk: { part: 'torso', dmg: 9, note: 'lands badly' }, style: ['highflyer'] });
sig('sig_neckbreaker', 'Signature Neckbreaker', 'grapple', 'head', 20, 11, 0.62, { grappling: 0.7, technical: 0.3 }, [S], [S], { toD: G });
sig('sig_kick', 'Signature Kick', 'strike', 'head', 19, 10, 0.62, { striking: 0.8, agility: 0.2 }, [S], [S], { toD: G, style: ['brawler'] });
sig('sig_ddt', 'Signature DDT', 'grapple', 'head', 21, 11, 0.6, { grappling: 0.6, technical: 0.4 }, [S], [S], { toD: G });
sig('sig_clothesline', 'Signature Clothesline', 'strike', 'head', 19, 10, 0.64, { striking: 0.5, power: 0.5 }, [S], [S], { toD: G });
sig('sig_corner', 'Signature Corner Assault', 'corner', 'torso', 19, 10, 0.66, { power: 0.5, striking: 0.5 }, [S], [C], {});
sig('sig_suplex', 'Signature Suplex', 'power', 'torso', 21, 12, 0.58, { power: 0.5, grappling: 0.5 }, [S], [S], { toD: G });
sig('sig_leg', 'Signature Leg Attack', 'technical', 'legs', 20, 10, 0.6, { technical: 0.7, grappling: 0.3 }, [S, G], [S, G], { toD: G, style: ['technician'] });
sig('sig_arm', 'Signature Arm Attack', 'technical', 'arms', 20, 10, 0.6, { technical: 0.7, grappling: 0.3 }, [S, G], [S, G], { toD: G, style: ['technician'] });
sig('sig_springboard', 'Signature Springboard', 'aerial', 'head', 20, 11, 0.56, { agility: 0.9, striking: 0.1 }, [A], [S], { toA: G, toD: G });
sig('sig_elbow', 'Signature Elbow', 'strike', 'head', 19, 9, 0.64, { striking: 0.6, agility: 0.4 }, [S], [G], {});

// ---------------------------------------------------------------- finisher templates
function fin(id, name, cat, tgt, dmg, cost, acc, atk, from, vs, o = {}) {
  def(id, name, 'finisher', tgt, dmg, cost, acc, atk, from, vs, { minMom: 42, tpl: id, ...o });
  MOVES[id] = Object.freeze({ ...MOVES[id], baseCat: cat });
}
fin('fin_ddt', 'Finisher DDT', 'grapple', 'head', 30, 16, 0.64, { grappling: 0.6, technical: 0.4 }, [S], [S], { toD: G });
fin('fin_slam', 'Finisher Slam', 'power', 'torso', 32, 18, 0.62, { power: 0.9, grappling: 0.1 }, [S], [S], { toD: G, style: ['powerhouse'] });
fin('fin_spear', 'Finisher Spear', 'strike', 'torso', 29, 15, 0.66, { power: 0.5, striking: 0.5 }, [S], [S], { toD: G });
fin('fin_kick', 'Finisher Superkick', 'strike', 'head', 28, 14, 0.66, { striking: 0.8, agility: 0.2 }, [S], [S], { toD: G, style: ['brawler'] });
fin('fin_piledriver', 'Finisher Piledriver', 'power', 'head', 33, 18, 0.6, { power: 0.5, grappling: 0.5 }, [S], [S, G], { toD: G });
fin('fin_dive', 'Finisher Dive', 'aerial', 'torso', 31, 17, 0.6, { agility: 1 }, [T], [G], { toA: G, risk: { part: 'torso', dmg: 12, note: 'crashes onto the mat' }, style: ['highflyer'] });
fin('fin_stunner', 'Finisher Stunner', 'grapple', 'head', 29, 15, 0.66, { striking: 0.4, grappling: 0.6 }, [S], [S], { toD: G, style: ['showman'] });
fin('fin_bomb', 'Finisher Powerbomb', 'power', 'torso', 34, 19, 0.58, { power: 0.9, grappling: 0.1 }, [S], [S], { toD: G });
fin('fin_neck', 'Finisher Neckbreaker', 'grapple', 'head', 30, 16, 0.64, { technical: 0.4, grappling: 0.6 }, [S], [S], { toD: G });
fin('fin_corner', 'Finisher Corner Strike', 'corner', 'head', 28, 14, 0.68, { striking: 0.6, power: 0.4 }, [S], [C], { toD: G });
fin('fin_sub_legs', 'Finisher Leg Lock', 'submission', 'legs', 14, 14, 0.6, { technical: 0.7, grappling: 0.3 }, [S, G], [G], { hold: { tgt: 'legs', sev: 30, drain: 7, breaks: true }, style: ['technician'] });
fin('fin_sub_arms', 'Finisher Arm Lock', 'submission', 'arms', 14, 14, 0.6, { technical: 0.7, grappling: 0.3 }, [S, G], [G], { hold: { tgt: 'arms', sev: 30, drain: 7, breaks: true }, style: ['technician'] });
fin('fin_sub_choke', 'Finisher Choke', 'submission', 'head', 14, 14, 0.6, { grappling: 0.6, technical: 0.4 }, [S, G], [G], { hold: { tgt: 'head', sev: 30, drain: 9, breaks: true } });
fin('fin_sub_back', 'Finisher Back Stretch', 'submission', 'torso', 14, 14, 0.6, { power: 0.4, technical: 0.3, grappling: 0.3 }, [S, G], [G], { hold: { tgt: 'torso', sev: 30, drain: 8, breaks: true } });

export const SIGNATURE_TEMPLATES = Object.values(MOVES).filter((m) => m.id.startsWith('sig_')).map((m) => m.id);
export const FINISHER_TEMPLATES = Object.values(MOVES).filter((m) => m.id.startsWith('fin_')).map((m) => m.id);

/** Wrestler-specific named version of a template: instantiateMove({id:'tombstone', name:'Tombstone', tpl:'fin_piledriver'}) */
export function instantiateMove(spec) {
  const base = MOVES[spec.tpl];
  if (!base) throw new Error(`unknown move template ${spec.tpl}`);
  const m = { ...base, id: spec.id, name: spec.name, tpl: spec.tpl };
  if (spec.tgt) m.tgt = spec.tgt;
  if (spec.dmg) m.dmg = spec.dmg;
  if (spec.from) m.from = spec.from;
  if (spec.vs) m.vs = spec.vs;
  return Object.freeze(m);
}

const CUSTOM = new Map();
export function registerMove(spec) {
  const m = instantiateMove(spec);
  CUSTOM.set(m.id, m);
  return m;
}
export function getMove(id) {
  const m = MOVES[id] || CUSTOM.get(id);
  if (!m) throw new Error(`unknown move ${id}`);
  return m;
}
export function hasMove(id) { return !!(MOVES[id] || CUSTOM.get(id)); }
export const allMoves = () => Object.values(MOVES);
export const BASE_MOVES = Object.keys(MOVES).filter((id) => !id.startsWith('sig_') && !id.startsWith('fin_'));

/** Moves everyone can attempt regardless of style. */
export const COMMON_MOVES = [
  'forearm', 'chop', 'low_kick', 'clothesline', 'stomp', 'elbow_drop', 'snapmare', 'headlock', 'back_body_drop',
  'whip_corner', 'pick_up', 'drag_up_corner', 'climb_top', 'corner_clothesline', 'corner_punches', 'body_slam',
  'suplex', 'rest_hold', 'toss_outside', 'follow_outside', 'roll_in', 'dropkick', 'eye_rake', 'low_blow',
  'rope_choke', 'boot_choke', 'chair_shot', 'steps_slam', 'barricade_whip', 'table_slam', 'ladder_shot',
  'kendo_flurry', 'trash_can_lid', 'ground_pound_floor', 'apron_drop', 'ground_punches', 'knee_drop', 'leg_drop',
  'trip_from_floor', 'slide_in_clothesline', 'drag_out',
];

export const STYLE_MOVES = {
  brawler: ['jab_combo', 'knife_edge', 'lariat', 'roundhouse', 'big_boot', 'neckbreaker', 'spinebuster', 'tree_of_woe', 'sleeper'],
  technician: ['arm_drag', 'wristlock', 'dragon_screw', 'leg_sweep', 'german_suplex', 'ddt', 'knee_breaker', 'arm_breaker', 'ankle_lock', 'armbar', 'figure_four', 'kneebar', 'hammerlock', 'abdominal_stretch', 'tree_of_woe'],
  highflyer: ['hurricanrana', 'enzuigiri', 'springboard_cross', 'plancha', 'tornado_ddt', 'top_elbow', 'moonsault_press', 'flying_crossbody', 'senton_bomb', 'corner_dropkick', 'leg_sweep', 'arm_drag', 'diving_headbutt', 'corkscrew', 'superplex'],
  powerhouse: ['spinebuster', 'powerbomb', 'press_slam', 'piledriver', 'backbreaker', 'gutwrench_suplex', 'chokeslam', 'toss_to_corner', 'running_powerslam', 'lariat', 'big_boot', 'corner_splash', 'corner_backsplash', 'camel_clutch', 'fireman_carry', 'superplex'],
  showman: ['big_boot', 'neckbreaker', 'spinebuster', 'dropkick', 'dragon_screw', 'inverted_atomic', 'hair_pull', 'fireman_carry', 'ddt', 'running_powerslam', 'sleeper'],
  submission: ['ankle_lock', 'figure_four', 'boston_crab', 'kneebar', 'armbar', 'hammerlock', 'sleeper', 'camel_clutch', 'abdominal_stretch', 'guillotine', 'dragon_screw', 'knee_breaker', 'arm_breaker', 'wristlock', 'german_suplex', 'leg_sweep'],
  allrounder: ['jab_combo', 'lariat', 'neckbreaker', 'spinebuster', 'dragon_screw', 'german_suplex', 'ankle_lock', 'armbar', 'sleeper', 'dropkick', 'top_elbow', 'senton_bomb', 'ddt', 'powerbomb', 'hurricanrana'],
};

export const STYLES = Object.keys(STYLE_MOVES);

/** default signature/finisher templates by style (used when a wrestler does not define their own) */
export const STYLE_SIGNATURES = {
  brawler: ['sig_kick', 'sig_clothesline', 'sig_corner'], technician: ['sig_leg', 'sig_arm', 'sig_neckbreaker'],
  highflyer: ['sig_dive', 'sig_springboard', 'sig_elbow'], powerhouse: ['sig_slam', 'sig_suplex', 'sig_corner'],
  showman: ['sig_elbow', 'sig_neckbreaker', 'sig_ddt'], submission: ['sig_leg', 'sig_arm', 'sig_ddt'],
  allrounder: ['sig_ddt', 'sig_kick', 'sig_suplex'],
};
export const STYLE_FINISHERS = {
  brawler: ['fin_kick', 'fin_spear'], technician: ['fin_sub_arms', 'fin_sub_legs', 'fin_neck'],
  highflyer: ['fin_dive', 'fin_ddt'], powerhouse: ['fin_slam', 'fin_bomb', 'fin_piledriver'],
  showman: ['fin_stunner', 'fin_ddt', 'fin_kick'], submission: ['fin_sub_legs', 'fin_sub_arms', 'fin_sub_choke', 'fin_sub_back'],
  allrounder: ['fin_ddt', 'fin_spear', 'fin_sub_arms'],
};
