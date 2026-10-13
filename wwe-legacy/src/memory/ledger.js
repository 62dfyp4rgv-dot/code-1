// Layer A: the immutable, append-only event ledger. The single authoritative record of what
// happened. Events are frozen, hash-chained (tamper/corruption detection), idempotent by `key`,
// and indexed for fast retrieval so a career of tens of thousands of events stays queryable.
import { canonical, deepFreeze, sha256, pad } from '../core/util.js';

export const EVENT_CATEGORIES = ['match', 'promo', 'media', 'relationship', 'career', 'personal', 'story', 'achievement', 'world', 'system'];

/** Convert absolute in-game day -> ISO date given a base date (default 1 Jan of start year). */
export function dayToDate(day, baseYear = 2024) {
  const d = new Date(Date.UTC(baseYear, 0, 1) + day * 86400000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function getPath(obj, path) {
  let cur = obj;
  for (const p of path.split('.')) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

/** Match an event against a declarative `where` clause. Operators: gte,lte,gt,lt,ne,in,includes,exists. */
export function matches(ev, where) {
  if (!where) return true;
  for (const [path, cond] of Object.entries(where)) {
    const v = getPath(ev, path);
    if (cond !== null && typeof cond === 'object' && !Array.isArray(cond)) {
      for (const [op, x] of Object.entries(cond)) {
        switch (op) {
          case 'gte': if (!(v >= x)) return false; break;
          case 'lte': if (!(v <= x)) return false; break;
          case 'gt': if (!(v > x)) return false; break;
          case 'lt': if (!(v < x)) return false; break;
          case 'ne': if (v === x) return false; break;
          case 'in': if (!x.includes(v)) return false; break;
          case 'includes': if (!Array.isArray(v) || !v.includes(x)) return false; break;
          case 'exists': if ((v !== undefined && v !== null) !== x) return false; break;
          default: throw new Error(`unknown where-operator ${op}`);
        }
      }
    } else if (Array.isArray(cond)) {
      if (!cond.includes(v)) return false;
    } else if (v !== cond) return false;
  }
  return true;
}

export class Ledger {
  constructor() {
    this.events = [];
    this.byId = new Map();
    this.byKey = new Map();
    this.byType = new Map();
    this.byCategory = new Map();
    this.byParticipant = new Map();
    this.byStoryline = new Map();
    this.byDay = new Map();
    this.head = 'genesis';
  }

  get size() { return this.events.length; }

  /**
   * Append an event. If `spec.key` was already recorded, returns the existing event and
   * `{duplicate:true}` - so retries and save/reload can never double-apply anything.
   */
  append(spec) {
    if (!spec.key) throw new Error('ledger events need an idempotency key');
    if (!spec.type || !spec.category) throw new Error('ledger events need type and category');
    if (!Number.isFinite(spec.day)) throw new Error('ledger events need an in-game day');
    const existing = this.byKey.get(spec.key);
    if (existing) return { event: existing, duplicate: true };
    for (const ref of spec.refs || []) if (!this.byId.has(ref)) throw new Error(`event references unknown event ${ref}`);
    const seq = this.events.length + 1;
    const body = {
      id: `E${pad(seq, 6)}`, seq, key: spec.key, day: spec.day, date: spec.date || dayToDate(spec.day), time: spec.time || null,
      category: spec.category, type: spec.type, participants: [...(spec.participants || [])], where: spec.where || null,
      storyline: spec.storyline || null, action: spec.action || null, outcome: spec.outcome || null,
      consequences: spec.consequences || [], relationships: spec.relationships || [], stats: spec.stats || [],
      refs: [...(spec.refs || [])], summary: spec.summary || '', importance: spec.importance ?? 2, scope: spec.scope || 'player',
      canon: spec.canon !== false, data: spec.data || {},
    };
    body.prev = this.head;
    body.hash = sha256(body.prev + canonical(body)).slice(0, 40);
    this.head = body.hash;
    const ev = deepFreeze(body);
    this._index(ev);
    return { event: ev, duplicate: false };
  }

  _index(ev) {
    this.events.push(ev);
    this.byId.set(ev.id, ev);
    this.byKey.set(ev.key, ev);
    const push = (map, k) => { if (k == null) return; let a = map.get(k); if (!a) { a = []; map.set(k, a); } a.push(ev); };
    push(this.byType, ev.type); push(this.byCategory, ev.category); push(this.byStoryline, ev.storyline); push(this.byDay, ev.day);
    for (const p of ev.participants) push(this.byParticipant, p);
  }

  get(id) { return this.byId.get(id); }
  ofType(type) { return this.byType.get(type) || []; }
  ofParticipant(id) { return this.byParticipant.get(id) || []; }

  /** Flexible query; uses the smallest relevant index. */
  query({ types, categories, participants, allParticipants, storyline, fromDay, toDay, where, scope, limit, maxSeq, newestFirst = false } = {}) {
    let pool;
    if (types && types.length === 1) pool = this.ofType(types[0]);
    else if (participants && participants.length === 1) pool = this.ofParticipant(participants[0]);
    else if (storyline) pool = this.byStoryline.get(storyline) || [];
    else pool = this.events;
    const out = [];
    const iter = newestFirst ? [...pool].reverse() : pool;
    for (const ev of iter) {
      if (types && !types.includes(ev.type)) continue;
      if (categories && !categories.includes(ev.category)) continue;
      if (participants && !participants.some((p) => ev.participants.includes(p))) continue;
      if (allParticipants && !allParticipants.every((p) => ev.participants.includes(p))) continue;
      if (storyline && ev.storyline !== storyline) continue;
      if (fromDay != null && ev.day < fromDay) continue;
      if (toDay != null && ev.day > toDay) continue;
      if (scope && ev.scope !== scope) continue;
      if (maxSeq != null && ev.seq > maxSeq) continue;
      if (where && !matches(ev, where)) continue;
      out.push(ev);
      if (limit && out.length >= limit) break;
    }
    return out;
  }

  /** Verify the hash chain end-to-end. */
  verify() {
    let prev = 'genesis';
    const seenIds = new Set(), seenKeys = new Set();
    for (let i = 0; i < this.events.length; i++) {
      const ev = this.events[i];
      const { hash, ...rest } = ev;
      if (ev.prev !== prev) return { ok: false, at: i, reason: 'broken chain link' };
      if (sha256(prev + canonical(rest)).slice(0, 40) !== hash) return { ok: false, at: i, reason: 'hash mismatch (event altered)' };
      if (seenIds.has(ev.id) || seenKeys.has(ev.key)) return { ok: false, at: i, reason: 'duplicate id/key' };
      seenIds.add(ev.id); seenKeys.add(ev.key);
      for (const r of ev.refs) if (!seenIds.has(r)) return { ok: false, at: i, reason: `dangling reference ${r}` };
      prev = hash;
    }
    return { ok: true, count: this.events.length, head: prev };
  }

  toJSON() { return { v: 1, events: this.events }; }

  static fromJSON(json) {
    const l = new Ledger();
    for (const ev of json.events) {
      const frozen = deepFreeze(JSON.parse(JSON.stringify(ev)));
      l._index(frozen);
      l.head = frozen.hash;
    }
    const v = l.verify();
    if (!v.ok) throw new Error(`ledger integrity check failed at event ${v.at}: ${v.reason}`);
    return l;
  }
}
