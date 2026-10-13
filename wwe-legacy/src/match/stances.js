// Defensive responses. When an opponent commits to an attack the defender sees its category
// (the "read") and chooses how to respond. Each stance has a per-family avoid chance, damage
// multiplier and failure penalty; the resolver combines these with attributes and match state.

export const FAMILIES = ['strike', 'grapple', 'power', 'aerial', 'sub', 'special'];

const all = (v) => ({ strike: v, grapple: v, power: v, aerial: v, sub: v, special: v });

export const STANCES = {
  block: {
    id: 'block', label: 'Block', kind: 'block', cost: 2, attrs: { toughness: 0.5, striking: 0.3, psychology: 0.2 },
    avoid: { strike: 0.32, grapple: 0.04, power: 0.07, aerial: 0.06, sub: 0.04, special: 0.05 },
    dmg: { strike: 0.6, grapple: 0.9, power: 0.85, aerial: 0.9, sub: 1, special: 0.9 }, rev: 0.05, fail: 1,
    desc: 'Cover up. Best against strikes.',
  },
  dodge: {
    id: 'dodge', label: 'Dodge', kind: 'dodge', cost: 3, attrs: { agility: 0.6, psychology: 0.4 },
    avoid: { strike: 0.26, grapple: 0.1, power: 0.12, aerial: 0.3, sub: 0.12, special: 0.14 },
    dmg: all(1), rev: 0.06, fail: 1.05, desc: 'Slip away. Great against strikes and aerial attacks; a miss can leave them in trouble.',
  },
  reverse: {
    id: 'reverse', label: 'Reverse', kind: 'reverse', cost: 6, attrs: { technical: 0.4, grappling: 0.3, psychology: 0.3 },
    avoid: { strike: 0.06, grapple: 0.34, power: 0.2, aerial: 0.06, sub: 0.26, special: 0.1 },
    dmg: all(1), rev: 0.85, fail: 1.25, desc: 'Turn their move against them. Best vs grapples and holds. Risky if it fails.',
  },
  counter_strike: {
    id: 'counter_strike', label: 'Counter Strike', kind: 'counter', cost: 5, attrs: { striking: 0.6, psychology: 0.4 },
    avoid: { strike: 0.2, grapple: 0.06, power: 0.04, aerial: 0.14, sub: 0, special: 0.06 },
    dmg: all(1), rev: 0.75, fail: 1.2, desc: 'Meet them with a strike of your own. Good vs strikes and diving attacks.',
  },
  brace: {
    id: 'brace', label: 'Brace for Impact', kind: 'brace', cost: 1, attrs: { toughness: 0.7, power: 0.3 },
    avoid: { strike: 0.05, grapple: 0.05, power: 0.12, aerial: 0.04, sub: 0.05, special: 0.05 },
    dmg: { strike: 0.8, grapple: 0.75, power: 0.65, aerial: 0.8, sub: 0.9, special: 0.8 }, rev: 0, fail: 1,
    desc: 'Tense up and absorb it. Cuts damage, especially from power moves.',
  },
  protect: {
    id: 'protect', label: 'Protect Weak Spot', kind: 'protect', cost: 1, attrs: { toughness: 0.5, psychology: 0.5 },
    avoid: all(0.06), dmg: all(0.88), rev: 0, fail: 1, guardDmg: 0.5, desc: 'Shield your most damaged body part.',
  },
  sell: {
    id: 'sell', label: 'Sell It & Recover', kind: 'sell', cost: -6, attrs: { psychology: 1 },
    avoid: all(0), dmg: all(1), rev: 0, fail: 1, desc: 'Take it, catch your breath, and draw the crowd in.',
  },
  fight_back: {
    id: 'fight_back', label: 'Fight Back', kind: 'fight', cost: 7, attrs: { striking: 0.3, power: 0.3, psychology: 0.4 },
    avoid: all(0.12), dmg: all(1), rev: 0.7, fail: 1.15, desperate: true, desc: 'Desperate swing. Small chance to seize the initiative.',
  },
  bait: {
    id: 'bait', label: 'Bait the Counter', kind: 'bait', cost: 3, attrs: { psychology: 0.7, technical: 0.3 },
    avoid: all(0), dmg: all(1), rev: 0, fail: 1.1, desc: 'Lower your guard on purpose. If they connect, you may turn it around.',
  },
  distance: {
    id: 'distance', label: 'Create Distance', kind: 'distance', cost: 3, attrs: { agility: 0.5, psychology: 0.5 },
    avoid: { strike: 0.18, grapple: 0.18, power: 0.14, aerial: 0.14, sub: 0.1, special: 0.08 },
    dmg: all(1), rev: 0, fail: 1, desc: 'Back away and reset the pace.',
  },
  counter_special: {
    id: 'counter_special', label: 'Read the Finish', kind: 'counter_special', cost: 10, attrs: { psychology: 0.6, technical: 0.2, agility: 0.2 },
    avoid: { strike: 0, grapple: 0, power: 0, aerial: 0, sub: 0, special: 0.34 }, dmg: all(1), rev: 0.9, fail: 1.3,
    only: ['special'], desc: 'You see it coming. Big chance to counter a signature or finisher.',
  },
  roll_away: {
    id: 'roll_away', label: 'Roll Away', kind: 'roll', cost: 4, attrs: { agility: 0.7, psychology: 0.3 },
    avoid: all(0.22), dmg: all(1), rev: 0, fail: 1, onlyPos: ['grounded'], desc: 'Scramble out of the way while down.',
  },
};

export const NEUTRAL_AVOID = 0.12;

/** Which stances may the defender choose against this incoming action? */
export function availableStances(defender, action, family) {
  const out = [];
  for (const s of Object.values(STANCES)) {
    if (s.only && !s.only.includes(family)) continue;
    if (s.onlyPos && !s.onlyPos.includes(defender.pos)) continue;
    if (s.id === 'protect' && Math.max(defender.dmg.head, defender.dmg.torso, defender.dmg.arms, defender.dmg.legs) < 20) continue;
    if (s.id === 'distance' && ['grounded', 'corner'].includes(defender.pos) && !['grapple'].includes(family)) continue;
    if (s.id === 'dodge' && defender.pos === 'grounded' && family !== 'strike') continue;
    if (s.id === 'counter_strike' && defender.pos === 'grounded') continue;
    if (s.id === 'block' && family === 'sub' && defender.pos === 'grounded') continue;
    out.push(s);
  }
  return out;
}
