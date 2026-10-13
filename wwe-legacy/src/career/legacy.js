// Legacy and Hall of Fame. A legacy score is a pure function of the ledger: every component lists the
// events it counted (capped samples are flagged), so the verdict can always be opened and checked.
const q = (c, spec) => c.memory.ledger.query({ scope: 'player', ...spec });
const ids = (evs, cap = 40) => evs.slice(-cap).map((e) => e.id);

export const TIERS = [
  { min: 0, id: 'journeyman', label: 'Journeyman', blurb: 'A working wrestler who showed up and did the job.' },
  { min: 25, id: 'veteran', label: 'Respected Veteran', blurb: 'The locker room knew your name and the fans remembered a few nights.' },
  { min: 60, id: 'main_eventer', label: 'Main Eventer', blurb: 'A name that sold tickets and closed shows.' },
  { min: 95, id: 'hall_of_famer', label: 'Hall of Famer', blurb: 'A career that belongs in the building where the history is kept.' },
  { min: 150, id: 'legend', label: 'Legend', blurb: 'One of the defining careers of its era.' },
];
export const HOF_THRESHOLD = 95;

/** Components of the legacy score. Each: { id, label, count, points, cap, evidence, sample } */
export function legacyScore(c) {
  const s = c.stats.s;
  // 'now' is the last thing recorded in the ledger, never the wall clock or c.day: the same ledger always scores the same
  const evs = c.memory.ledger.events;
  const asOf = evs.length ? evs[evs.length - 1].day : 0;
  const parts = [];
  const add = (id, label, count, per, cap, evs, note = '') => {
    const points = Math.min(cap, Math.round(count * per * 10) / 10);
    parts.push({ id, label, count, per, cap, points, evidence: ids(evs), sample: evs.length > 40, note });
  };
  const tw = q(c, { types: ['title_win'] });
  const world = tw.filter((e) => e.data.titleClass === 'world'), sec = tw.filter((e) => e.data.titleClass === 'secondary'), other = tw.filter((e) => !['world', 'secondary'].includes(e.data.titleClass));
  add('world_titles', 'World championship reigns', world.length, 12, 60, world);
  add('secondary_titles', 'Secondary championship reigns', sec.length, 5, 20, sec);
  add('other_titles', 'Other championship reigns', other.length, 2, 10, other);
  const days = c.stats.totalDaysChampion(asOf);
  const losses = q(c, { types: ['title_loss'] });
  add('title_days', 'Days as champion', days, 0.06, 30, [...tw, ...losses].sort((a, b) => a.seq - b.seq), 'Counted from championship reigns (wins and losses mark each reign)');
  const wins = q(c, { types: ['match_result'], where: { 'data.result': 'win' } });
  add('wins', 'Victories', wins.length, 0.18, 36, wins);
  add('main_events', 'Main events', s.mainEvents, 0.8, 20, q(c, { types: ['match_result'], where: { 'data.mainEvent': true } }));
  add('ple', 'Premium live event matches', s.pleMatches, 0.25, 14, q(c, { types: ['match_result'], where: { 'data.ppv': { exists: true } } }));
  add('rumble', 'Royal Rumble victories', s.rumble.wins, 10, 24, q(c, { types: ['rumble_result'], where: { 'data.won': true } }));
  add('five_star', 'Five-star classics', s.fiveStar, 4, 20, q(c, { types: ['match_result'] }).filter((e) => (e.data.rating || 0) >= 5));
  const awards = q(c, { types: ['award'] });
  add('awards', 'Year-end awards', awards.length, 6, 24, awards);
  const ach = q(c, { types: ['achievement_unlocked'] });
  const w = (e) => ({ common: 0, uncommon: 0.3, rare: 1, epic: 2.5, legendary: 5 }[e.data.rarity] || 0);
  add('achievements', 'Achievements (rarity-weighted)', Math.round(ach.reduce((t, e) => t + w(e), 0) * 10) / 10, 1, 25, ach.filter((e) => w(e) > 0));
  const years = Math.max(0, (asOf - (s.days.first ?? 0)) / 365.25);
  add('longevity', 'Years in the business', Math.round(years * 10) / 10, 1, 15, q(c, { types: ['debut'] }));
  const kept = c.memory.ledger.ofType('promise_kept');
  add('promises', 'Promises kept on the record', kept.length, 0.8, 8, kept);
  const total = Math.round(parts.reduce((t, p) => t + p.points, 0) * 10) / 10;
  const tier = [...TIERS].reverse().find((t) => total >= t.min);
  return { total, tier, parts, hofThreshold: HOF_THRESHOLD, inducted: total >= HOF_THRESHOLD, pointsToHof: Math.max(0, Math.round((HOF_THRESHOLD - total) * 10) / 10) };
}

/** Retire the player. Writes the retirement event (and Hall of Fame induction when earned). */
export function retirePlayer(c, reason = 'choice') {
  if (c.flags.retired && typeof c.flags.retired === 'object') throw new Error('already retired');
  const sc = legacyScore(c);
  const evsAll = c.memory.ledger.events;
  const yearsActive = Math.round((((evsAll.length ? evsAll[evsAll.length - 1].day : 0) - (c.stats.s.days.first ?? 0)) / 365.25) * 10) / 10;
  const legendary = sc.tier.id === 'legend' || sc.tier.id === 'hall_of_famer';
  // a story scene may already have announced the retirement; the final verdict is still its own, fully-described event
  const prior = c.memory.ledger.ofType('retirement').slice(-1)[0];
  const ret = c.record({
    key: 'retirement:final', category: 'career', type: 'retirement', importance: 5, summary: `${c.player.name} retired after ${yearsActive} years (${sc.tier.label}).`,
    refs: [...(prior ? [prior.id] : []), ...sc.parts.flatMap((p) => p.evidence).slice(0, 5)], data: { reason, years: yearsActive, legacy: sc.total, tier: sc.tier.id, legendary, final: true },
  });
  let hof = null;
  if (sc.inducted) {
    const cls = c.year + 1;
    hof = c.record({
      key: 'hall_of_fame:player', category: 'career', type: 'hall_of_fame', importance: 5, refs: [ret.event.id],
      summary: `${c.player.name} was inducted into the Hall of Fame (Class of ${cls}) with a legacy score of ${sc.total}.`, data: { classYear: cls, legacy: sc.total, tier: sc.tier.id, parts: sc.parts.filter((p) => p.points > 0).map((p) => [p.id, p.points]) },
    });
  }
  c.flags.retired = { day: c.day, reason, legacy: sc.total, tier: sc.tier.id, inducted: !!hof };
  c.checkMilestones();
  return { retirement: ret.event, hof: hof ? hof.event : null, legacy: sc, unlocked: [...ret.unlocked, ...(hof ? hof.unlocked : [])] };
}
