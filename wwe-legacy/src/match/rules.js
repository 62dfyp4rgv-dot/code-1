// Match types ("stipulations"). A ruleset is plain data that the resolver consults for every
// legality question, so match-specific win conditions never live inside narration code.

export const RULESETS = {
  singles: {
    id: 'singles', name: 'Singles Match', teamSize: 1, pinfall: true, submission: true, dq: true, countout: true,
    weapons: false, outside: true, ropeBreaks: true, timeLimit: 15, desc: 'Standard rules: win by pinfall or submission. DQ and count-out apply.',
  },
  tag: {
    id: 'tag', name: 'Tag Team Match', teamSize: 2, pinfall: true, submission: true, dq: true, countout: true,
    weapons: false, outside: true, ropeBreaks: true, tag: true, timeLimit: 28, desc: 'Only the legal partner may pin or submit. Make the tag to bring in your partner.',
  },
  submission: {
    id: 'submission', name: 'Submission Match', teamSize: 1, pinfall: false, submission: true, dq: false, countout: false,
    weapons: false, outside: false, ropeBreaks: false, subWeight: 1.2, timeLimit: 25, desc: 'Win only by submission. No pinfalls. No rope breaks.',
  },
  no_dq: {
    id: 'no_dq', name: 'No Disqualification', teamSize: 1, pinfall: true, submission: true, dq: false, countout: false,
    weapons: true, outside: true, ropeBreaks: true, timeLimit: 20, desc: 'Anything goes. Weapons are legal. No DQ, no count-out.',
  },
  last_man: {
    id: 'last_man', name: 'Last Man Standing', teamSize: 1, pinfall: false, submission: false, dq: false, countout: false,
    weapons: true, outside: true, ropeBreaks: false, tenCount: true, riseWeight: 0.78, timeLimit: 40, desc: 'Win by keeping your opponent down for a ten count. No pins, no submissions.',
  },
  iron_man: {
    id: 'iron_man', name: 'Iron Man Match', teamSize: 1, pinfall: true, submission: true, dq: true, countout: true,
    weapons: false, outside: true, ropeBreaks: true, ironMan: true, timeLimit: 30, desc: 'Most falls within the time limit wins. Pinfall and submission falls count.',
  },
  ladder: {
    id: 'ladder', name: 'Ladder Match', teamSize: 1, pinfall: false, submission: false, dq: false, countout: false,
    weapons: true, outside: true, ropeBreaks: false, objective: 'ladder', timeLimit: 30, desc: 'Climb the ladder and retrieve the prize hanging above the ring.',
  },
  cage: {
    id: 'cage', name: 'Steel Cage Match', teamSize: 1, pinfall: true, submission: true, dq: false, countout: false,
    weapons: false, outside: false, ropeBreaks: false, objective: 'cage', escape: true, timeLimit: 30, desc: 'Win by pinfall, submission, or by escaping the cage.',
  },
  triple_threat: {
    id: 'triple_threat', name: 'Triple Threat Match', teamSize: 1, ways: 3, pinfall: true, submission: true, dq: false, countout: false,
    weapons: false, outside: true, ropeBreaks: true, timeLimit: 22, desc: 'Three wrestlers, one winner. Any pinfall or submission ends it, so a third man can always break up a cover.',
  },
  fatal_four: {
    id: 'fatal_four', name: 'Fatal Four-Way', teamSize: 1, ways: 4, pinfall: true, submission: true, dq: false, countout: false,
    weapons: false, outside: true, ropeBreaks: true, timeLimit: 26, desc: 'Four wrestlers, one fall. Everyone is a target and everyone is a threat to steal the pin.',
  },
  elimination: {
    id: 'elimination', name: 'Elimination Match', teamSize: 1, ways: 4, elimination: true, pinfall: true, submission: true, dq: false, countout: false,
    weapons: false, outside: true, ropeBreaks: true, timeLimit: 40, desc: 'Four wrestlers. Every pinfall or submission eliminates the loser and the match goes on until one is left.',
  },
  chamber: {
    id: 'chamber', name: 'Elimination Chamber', teamSize: 1, ways: 6, elimination: true, entries: { start: 2, every: 140 }, pinfall: true, submission: true, dq: false, countout: false,
    weapons: true, outside: false, ropeBreaks: false, timeLimit: 70, desc: 'Six wrestlers in a steel chamber. Two start, the rest are released from pods every few minutes, and every fall eliminates one competitor.',
  },
  hell_cell: {
    id: 'hell_cell', name: 'Hell in a Cell', teamSize: 1, pinfall: true, submission: true, dq: false, countout: false,
    weapons: true, outside: true, ropeBreaks: false, cell: true, timeLimit: 30, desc: 'A towering cell. No DQ, no count-out, brutal bumps. Pinfall or submission only.',
  },
  tlc: {
    id: 'tlc', name: 'Tables, Ladders & Chairs', teamSize: 1, pinfall: false, submission: false, dq: false, countout: false,
    weapons: true, outside: true, ropeBreaks: false, objective: 'ladder', hardcore: 1.35, recoil: 0.18, timeLimit: 35,
    desc: 'Anything goes and everything hurts. Retrieve the prize from above the ring; no pins, no submissions, and tables, ladders and chairs hit harder (and bite back).',
  },
  mitb: {
    id: 'mitb', name: 'Money in the Bank', teamSize: 1, ways: 4, pinfall: false, submission: false, dq: false, countout: false,
    weapons: true, outside: true, ropeBreaks: false, objective: 'ladder', prize: 'briefcase', timeLimit: 45,
    desc: 'Four wrestlers, one briefcase hanging above the ring. Climb the ladder and unhook it; any foe can knock a climber off. Nobody wins by pinfall. Premium Live Event only.',
  },
  battle_royal: {
    id: 'battle_royal', name: 'Battle Royal', teamSize: 1, ways: 6, elimination: true, overTheTop: true, pinfall: true, submission: true, dq: false, countout: false,
    weapons: false, outside: false, ropeBreaks: true, kickoutBonus: 0.06, timeLimit: 50,
    desc: 'Six wrestlers in the ring. Fall to a pin or submission, or get thrown over the top rope, and you are out. The last one in wins.',
  },
  handicap: {
    id: 'handicap', name: 'Handicap Match (1 vs 2)', teamSizes: [1, 2], tag: true, pinfall: true, submission: true, dq: true, countout: true,
    weapons: false, outside: true, ropeBreaks: true, timeLimit: 24, loneBonus: { regen: 1.45, resist: 0.22 },
    desc: 'You against two. They tag, you cannot - but you recover faster and shrug off more punishment. A fall over either of them wins it.',
  },
};

export function getRuleset(id) {
  const r = RULESETS[id];
  if (!r) throw new Error(`unknown match type ${id}`);
  return r;
}

export const MATCH_TYPE_IDS = Object.keys(RULESETS);
/** number of sides in a match (3 and 4 for multi-way matches) */
export const waysOf = (rules) => rules.ways || 2;

/** Opposite-side helper for team indexes. */
export const other = (side) => (side === 0 ? 1 : 0);

/** objective settings for ladder/cage */
export const OBJECTIVE = {
  ladder: { steps: 3, label: 'retrieve the prize' },
  cage: { steps: 4, label: 'escape the cage' },
};
