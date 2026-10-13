// Match types ("stipulations"). A ruleset is plain data that the resolver consults for every
// legality question, so match-specific win conditions never live inside narration code.

export const RULESETS = {
  singles: {
    id: 'singles', name: 'Singles Match', teamSize: 1, pinfall: true, submission: true, dq: true, countout: true,
    weapons: false, outside: true, ropeBreaks: true, timeLimit: 15, desc: 'Standard rules: win by pinfall or submission. DQ and count-out apply.',
  },
  tag: {
    id: 'tag', name: 'Tag Team Match', teamSize: 2, pinfall: true, submission: true, dq: true, countout: true,
    weapons: false, outside: true, ropeBreaks: true, tag: true, timeLimit: 20, desc: 'Only the legal partner may pin or submit. Make the tag to bring in your partner.',
  },
  submission: {
    id: 'submission', name: 'Submission Match', teamSize: 1, pinfall: false, submission: true, dq: false, countout: false,
    weapons: false, outside: false, ropeBreaks: false, timeLimit: 25, desc: 'Win only by submission. No pinfalls. No rope breaks.',
  },
  no_dq: {
    id: 'no_dq', name: 'No Disqualification', teamSize: 1, pinfall: true, submission: true, dq: false, countout: false,
    weapons: true, outside: true, ropeBreaks: true, timeLimit: 20, desc: 'Anything goes. Weapons are legal. No DQ, no count-out.',
  },
  last_man: {
    id: 'last_man', name: 'Last Man Standing', teamSize: 1, pinfall: false, submission: false, dq: false, countout: false,
    weapons: true, outside: true, ropeBreaks: false, tenCount: true, timeLimit: 40, desc: 'Win by keeping your opponent down for a ten count. No pins, no submissions.',
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
  hell_cell: {
    id: 'hell_cell', name: 'Hell in a Cell', teamSize: 1, pinfall: true, submission: true, dq: false, countout: false,
    weapons: true, outside: true, ropeBreaks: false, cell: true, timeLimit: 30, desc: 'A towering cell. No DQ, no count-out, brutal bumps. Pinfall or submission only.',
  },
};

export function getRuleset(id) {
  const r = RULESETS[id];
  if (!r) throw new Error(`unknown match type ${id}`);
  return r;
}

export const MATCH_TYPE_IDS = Object.keys(RULESETS);

/** Opposite-side helper for team indexes. */
export const other = (side) => (side === 0 ? 1 : 0);

/** objective settings for ladder/cage */
export const OBJECTIVE = {
  ladder: { steps: 3, label: 'retrieve the prize' },
  cage: { steps: 4, label: 'escape the cage' },
};
