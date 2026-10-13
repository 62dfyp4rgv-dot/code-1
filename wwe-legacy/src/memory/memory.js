// Memory facade: ledger (A) + world state (B) + summaries (C) behind a single record() pipeline.
import { Ledger } from './ledger.js';
import { newWorld, getRel, getRivalry } from './world.js';
import { applyRules } from './rules.js';
import { recall, relationshipFacts } from './retrieve.js';
import { buildPairSummary, validateSummary } from './summaries.js';

export class Memory {
  constructor(playerId) {
    this.playerId = playerId;
    this.ledger = new Ledger();
    this.world = newWorld();
    this.summaries = {};
    this.listeners = [];
  }

  /** Record an event. Returns { event, duplicate, resolvedPromises }. Idempotent by spec.key. */
  record(spec) {
    const { event, duplicate } = this.ledger.append(spec);
    if (duplicate) return { event, duplicate: true, resolvedPromises: [] };
    const { resolved } = applyRules(this.world, event, { playerId: this.playerId, ledger: this.ledger });
    for (const k of Object.keys(this.summaries)) {
      const s = this.summaries[k];
      if (event.participants.includes(s.a) || event.participants.includes(s.b)) delete this.summaries[k];
    }
    return { event, duplicate: false, resolvedPromises: resolved };
  }

  recall(q) { return recall(this, q); }
  facts(a, b) { return relationshipFacts(this, a, b); }
  rel(a, b) { return getRel(this.world, a, b); }
  rivalry(a, b) { return getRivalry(this.world, a, b); }
  summary(a, b, nameOf) {
    const key = `pair:${a < b ? a : b}|${a < b ? b : a}`;
    if (!this.summaries[key]) this.summaries[key] = buildPairSummary(this, a, b, nameOf);
    return this.summaries[key];
  }
  validateSummaries() { return Object.values(this.summaries).flatMap((s) => validateSummary(this, s)); }

  /** Rebuild world state purely from the ledger (proves the ledger is authoritative). */
  replayWorld() {
    const w = newWorld();
    for (const ev of this.ledger.events) applyRules(w, ev, { playerId: this.playerId, ledger: this.ledger });
    return w;
  }

  toJSON() { return { playerId: this.playerId, ledger: this.ledger.toJSON(), world: this.world }; }
  static fromJSON(j) {
    const m = new Memory(j.playerId);
    m.ledger = Ledger.fromJSON(j.ledger);
    // the ledger is authoritative: a stored world that disagrees with its replay is rebuilt from the ledger
    const replay = m.replayWorld();
    if (j.world && JSON.stringify(j.world) === JSON.stringify(replay)) m.world = j.world;
    else { m.world = replay; m.repaired = true; }
    return m;
  }
}
