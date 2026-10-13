// Booking helpers: build a match (engine config) from the career + opponents, and record it.
import { MatchEngine } from '../match/engine.js';
import { getRel } from '../memory/world.js';

let counter = 0;
export function nextMatchId(career) {
  career.flags.matchSeq = (career.flags.matchSeq || 0) + 1;
  return `${career.id}:m${career.flags.matchSeq}`;
}

export function makeBooking(career, opponents, o = {}) {
  return {
    matchId: o.matchId || nextMatchId(career), opponents, partners: o.partners || [], opponentPartners: o.opponentPartners || [],
    type: o.type || 'singles', show: o.show || career.player.brand, ppv: o.ppv || null, ppvTier: o.ppvTier || 0,
    mainEvent: !!o.mainEvent, title: o.title || null, storyline: o.storyline || null, venue: o.venue || null, label: o.label || 'match',
    timeLimit: o.timeLimit || null, crowdBase: o.crowdBase ?? 30 + Math.round(career.player.popularity / 3),
  };
}

export function engineConfig(career, booking) {
  const me = career.fighterProfile();
  const mine = [me, ...booking.partners];
  const theirs = [...booking.opponents, ...(booking.opponentPartners || [])];
  const seed = career.rng.int(1, 2147483646);
  const cfg = {
    seed, type: booking.type, sides: [mine, theirs], playerId: me.id, difficulty: career.player.difficulty,
    context: { show: booking.show, crowdBase: booking.crowdBase }, id: booking.matchId.replace(/[^a-z0-9]/gi, '_'),
  };
  if (booking.timeLimit) cfg.timeLimit = booking.timeLimit;
  return cfg;
}

/** Apply memory-driven adaptations: opponents who have studied the player counter their habits. */
export function applyMemoryToEngine(career, engine, booking) {
  const me = career.player.id;
  for (const o of booking.opponents) {
    const flag = career.memory.world.flags[`studied:${o.id}>${me}`];
    const f = engine.state.fighters[o.id];
    if (flag && f) {
      f.tactics.studyUntil = 1e9; f.tactics.studyCat = flag.topCategory;
      f.studiedPlayer = true;
    }
    const rel = getRel(career.memory.world, me, o.id);
    if (f && rel.tags.includes('reluctant')) f.confidence = Math.max(10, f.confidence - 15);
  }
}

export function createEngine(career, booking, { human = [career.player.id], overrides } = {}) {
  const engine = new MatchEngine(engineConfig(career, booking), { human, overrides });
  applyMemoryToEngine(career, engine, booking);
  return engine;
}

/** Run a whole match headlessly with a strategy for the player (for sims/tests). */
export function playHeadless(career, booking, strategy = 'average', oppStrategy) {
  const overrides = { [career.player.id]: strategy };
  for (const o of booking.opponents) overrides[o.id] = oppStrategy || undefined;
  for (const k of Object.keys(overrides)) if (overrides[k] === undefined) delete overrides[k];
  const engine = createEngine(career, booking, { human: [], overrides });
  return { engine, ...career.recordMatch(engine, booking) };
}
