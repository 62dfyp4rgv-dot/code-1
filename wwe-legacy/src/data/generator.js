// Procedural wrestler generation (custom universe, prospects, regional talent). Deterministic per rng.
import { STYLES, STYLE_SIGNATURES, STYLE_FINISHERS } from '../match/moves.js';

const FIRST_M = ['Jake', 'Marcus', 'Dante', 'Colt', 'Rafael', 'Tobias', 'Viktor', 'Silas', 'Jonas', 'Kane', 'Declan', 'Mateo', 'Hiro', 'Axel', 'Bryce', 'Cade', 'Dominic', 'Elias', 'Felix', 'Gideon', 'Hunter', 'Ivan', 'Jericho', 'Knox', 'Landon', 'Maddox', 'Nolan', 'Orion', 'Pierce', 'Quinn', 'Reid', 'Soren', 'Tate', 'Ulysses', 'Vance', 'Wyatt', 'Xander', 'Yusuf', 'Zane', 'Cassius', 'Brock', 'Ronan', 'Damian', 'Emmett', 'Finn', 'Grady', 'Hayes', 'Idris', 'Julian', 'Kasper'];
const FIRST_F = ['Aria', 'Brielle', 'Carmen', 'Delilah', 'Elena', 'Freya', 'Gia', 'Harper', 'Ines', 'Jade', 'Kira', 'Luna', 'Mara', 'Nova', 'Ophelia', 'Priya', 'Quincy', 'Raven', 'Sloane', 'Tessa', 'Uma', 'Vera', 'Willow', 'Xena', 'Yara', 'Zoe', 'Blair', 'Cleo', 'Dahlia', 'Esme', 'Fiona', 'Greta', 'Hana', 'Isla', 'Juno', 'Kalani', 'Lena', 'Mika', 'Noor', 'Odette'];
const LAST = ['Stone', 'Cross', 'Black', 'Steele', 'Maddox', 'Voss', 'Rivera', 'Kincaid', 'Frost', 'Hale', 'Sterling', 'Mercer', 'Locke', 'Drake', 'Slate', 'Rourke', 'Vance', 'Holt', 'Bishop', 'Cobb', 'Dane', 'Ember', 'Flint', 'Gage', 'Hart', 'Irons', 'Jarrett', 'Knight', 'Lowe', 'Mace', 'Nash', 'Oakes', 'Pike', 'Quarry', 'Reeves', 'Sable', 'Thorne', 'Underwood', 'Vega', 'Wolfe', 'Yates', 'Zhao', 'Ashby', 'Baxter', 'Calloway', 'Devereux', 'Ellison', 'Fontaine', 'Grimes', 'Hollis', 'Ibarra', 'Jovanovic', 'Kowalski', 'Lindgren', 'Moreau', 'Novak', 'Okafor', 'Petrov', 'Quintero', 'Rosenthal', 'Takahashi'];
const SIG_NAMES = {
  sig_slam: ['Wrecking Slam', 'Crater Drop', 'Hammer Slam'], sig_dive: ['Skyfall', 'Comet Splash', 'Falling Star'], sig_neckbreaker: ['Neck Snap', 'Breaker', 'Snapback'],
  sig_kick: ['Thunder Kick', 'Rising Boot', 'Spin Cycle'], sig_ddt: ['Dead Drop', 'Face Plant', 'Reverse Drop'], sig_clothesline: ['Lariat of Doom', 'Wrecking Arm', 'Bulldog Line'],
  sig_corner: ['Corner Storm', 'Turnbuckle Barrage', 'Cornered Rage'], sig_suplex: ['Rolling Suplex', 'Tilt Suplex', 'Wheel Throw'], sig_leg: ['Leg Trap', 'Kneecap Crusher', 'Ankle Hunter'],
  sig_arm: ['Arm Hunter', 'Wrench Twist', 'Elbow Lock Drop'], sig_springboard: ['Spring Strike', 'Rebound Blast', 'Ropewalk Crash'], sig_elbow: ['Showtime Elbow', 'Golden Elbow', 'Last Call Elbow'],
};
const FIN_NAMES = {
  fin_ddt: ['Final Cut', 'Last Rites', 'Fall of Man'], fin_slam: ['World Breaker', 'Tombstone Drop', 'Ground Zero'], fin_spear: ['Lance', 'Freight Train', 'Impact Spear'],
  fin_kick: ['Sweet Chin Kick', 'Lights Out', 'Last Word'], fin_piledriver: ['Grave Digger', 'Burial', 'Earth Shaker'], fin_dive: ['Starlight Press', 'Eclipse', 'Supernova'],
  fin_stunner: ['Stinger', 'Showstopper', 'Rewind'], fin_bomb: ['Black Hole', 'Detonator', 'Demolition'], fin_neck: ['Spinal Tap', 'Neckbreaker Prime', 'Cut Down'],
  fin_corner: ['Cornerstone', 'Wall of Pain', 'Ten Fists'], fin_sub_legs: ['Crimson Lock', 'Texas Cloverleaf', 'Iron Ankle'], fin_sub_arms: ['Trident Armbar', 'Wrench Hold', 'Hammer Lock Prime'],
  fin_sub_choke: ['Silent Sleeper', 'Cobra Choke', 'Final Fade'], fin_sub_back: ['Spine Stretch', 'Surfboard Prime', 'Backbreaker Hold'],
};
const NICKS = ['The Machine', 'The Prodigy', 'The Wolf', 'The Natural', 'The Enforcer', 'The Phenom', 'The Architect', 'The Showstopper', 'The Rainmaker', 'The Hammer', 'The Ghost', 'The Gladiator', 'The Maverick', 'The Prince', 'The Destroyer'];

export const TIERS = {
  0: { name: 'Prospect', mean: 40, pop: 8 }, 1: { name: 'Midcard', mean: 54, pop: 30 }, 2: { name: 'Upper Midcard', mean: 64, pop: 52 },
  3: { name: 'Main Event', mean: 75, pop: 75 }, 4: { name: 'Legend', mean: 84, pop: 92 },
};

const STYLE_BIAS = {
  brawler: { striking: 12, toughness: 8, power: 5, technical: -10, agility: -4 }, technician: { technical: 12, grappling: 10, psychology: 8, power: -8, striking: -4 },
  highflyer: { agility: 14, technical: 3, power: -12, toughness: -6, striking: 2 }, powerhouse: { power: 14, toughness: 10, grappling: 4, agility: -12, technical: -8 },
  showman: { psychology: 10, striking: 4, power: 0, technical: 0 }, submission: { grappling: 14, technical: 12, psychology: 6, agility: -4, striking: -8 },
  allrounder: {},
};

export function generateWrestler(rng, { id, tier = 1, style, gender, alignment, name } = {}) {
  const g = gender || (rng.chance(0.3) ? 'F' : 'M');
  const st = style || rng.pick(STYLES);
  const first = rng.pick(g === 'F' ? FIRST_F : FIRST_M), last = rng.pick(LAST);
  const nm = name || `${first} ${last}`;
  const mean = TIERS[tier].mean;
  const attrs = {};
  for (const k of ['power', 'striking', 'grappling', 'technical', 'agility', 'endurance', 'toughness', 'psychology']) {
    attrs[k] = Math.max(15, Math.min(98, Math.round(mean + (STYLE_BIAS[st][k] || 0) + rng.noise() * 12)));
  }
  const sigs = rng.shuffle(STYLE_SIGNATURES[st]).slice(0, 2).map((tpl, i) => ({ id: `${id || nm}_sig${i + 1}`.replace(/\W+/g, '_'), name: rng.pick(SIG_NAMES[tpl]), tpl }));
  const finTpl = rng.pick(STYLE_FINISHERS[st]);
  const finisher = { id: `${id || nm}_fin`.replace(/\W+/g, '_'), name: rng.pick(FIN_NAMES[finTpl]), tpl: finTpl };
  return {
    id: id || nm.toLowerCase().replace(/\W+/g, '_'), name: nm, nickname: rng.chance(0.4) ? rng.pick(NICKS) : '', gender: g, style: st,
    alignment: alignment || rng.pick(['face', 'face', 'heel', 'heel', 'tweener']), attrs, signatures: sigs, finisher,
    popularity: Math.max(1, Math.min(99, Math.round(TIERS[tier].pop + rng.noise() * 10))), tier,
    personality: { aggression: rng.int(20, 90), ego: rng.int(20, 90), loyalty: rng.int(20, 90), ambition: rng.int(30, 95) },
    mic: Math.round(mean * 0.8 + rng.int(0, 25)), charisma: Math.round(mean * 0.7 + rng.int(0, 30)),
  };
}

export function generateRoster(rng, spec = { 0: 10, 1: 14, 2: 8, 3: 5, 4: 2 }, prefix = 'g') {
  const roster = [];
  let n = 0;
  const used = new Set();
  for (const [tier, count] of Object.entries(spec)) {
    for (let i = 0; i < count; i++) {
      let w;
      do { w = generateWrestler(rng, { id: `${prefix}${++n}`, tier: +tier }); } while (used.has(w.name));
      used.add(w.name);
      roster.push(w);
    }
  }
  return roster;
}

export { SIG_NAMES, FIN_NAMES };
