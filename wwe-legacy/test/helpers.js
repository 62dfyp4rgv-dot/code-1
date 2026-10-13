import { MatchEngine } from '../src/match/engine.js';
import { SAMPLE_WRESTLERS as W } from '../src/match/samples.js';
import { F } from '../src/match/state.js';

export { W, F, MatchEngine };
export const clone = (o) => JSON.parse(JSON.stringify(o));

export function mk(type = 'singles', a = 'brawler', b = 'tech', seed = 1, opts = {}) {
  const sides = type === 'tag' ? [[W[a], W.partnerA], [W[b], W.partnerB]] : [[W[a]], [W[b]]];
  return new MatchEngine({ seed, type, sides, playerId: W[a].id, ...(opts.cfg || {}) }, { human: opts.human ?? [], overrides: opts.overrides });
}

/** A match with a human on side 0 so the engine pauses for decisions. */
export function mkHuman(type = 'singles', a = 'brawler', b = 'tech', seed = 1, cfg = {}) {
  const sides = type === 'tag' ? [[W[a], W.partnerA], [W[b], W.partnerB]] : [[W[a]], [W[b]]];
  return new MatchEngine({ seed, type, sides, playerId: W[a].id, ...cfg }, { human: [W[a].id] });
}

/** drive a human-controlled engine with a chooser until finished */
export function playOut(e, chooser, maxSteps = 4000) {
  let n = 0;
  while (!e.over && n++ < maxSteps) {
    const d = e.getDecision();
    if (!d) break;
    const opts = d.options.filter((o) => o.enabled !== false);
    e.choose(chooser(d, opts));
  }
  if (!e.over) throw new Error('match did not finish');
  return e;
}

export const firstOf = (opts, pred) => opts.find(pred);
