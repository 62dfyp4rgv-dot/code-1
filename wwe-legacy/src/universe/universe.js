// The wrestling universe: roster, brands and (later) titles and autonomous AI behaviour.
// This module holds mutable world state that is NOT part of the player's ledger; changes that
// matter to the player are written to the ledger as `world`-scope or player-scope events.
import { Rng } from '../core/rng.js';
import { generateRoster } from '../data/generator.js';

export class Universe {
  constructor({ seed = 1, roster, mode = 'custom' } = {}) {
    this.seed = seed;
    this.mode = mode;
    this.rng = new Rng(`uni:${seed}`);
    this.roster = {};
    this.titles = {};
    this.log = [];
    for (const w of roster || generateRoster(new Rng(`roster:${seed}`))) this.roster[w.id] = { ...w, brand: w.brand || 'NXT', status: 'active', record: { w: 0, l: 0 } };
  }
  get(id) { return this.roster[id]; }
  list(filter = () => true) { return Object.values(this.roster).filter((w) => w.status === 'active' && filter(w)); }
  toJSON() { return { seed: this.seed, mode: this.mode, rng: this.rng.state, roster: this.roster, titles: this.titles, log: this.log.slice(-200) }; }
  static fromJSON(j) {
    const u = new Universe({ seed: j.seed, roster: [], mode: j.mode });
    u.roster = j.roster; u.titles = j.titles || {}; u.log = j.log || []; u.rng.state = j.rng;
    return u;
  }
}
