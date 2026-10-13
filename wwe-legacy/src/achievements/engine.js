// Achievement engine: evaluates declarative requirements against *real ledger data* and records
// each unlock as its own ledger event with evidence ids. Nothing is awarded from narration.
import { getPathValue } from './util.js';
import { inspectStat } from '../career/stats.js';
import { CUSTOM } from './custom.js';

/** Evaluate a requirement node. Returns { value, target, done, evidence:[eventIds] } */
export function evalReq(req, ctx) {
  if (req.all) {
    const parts = req.all.map((r) => evalReq(r, ctx));
    const done = parts.every((p) => p.done);
    return { value: parts.filter((p) => p.done).length, target: parts.length, done, ratio: parts.reduce((s, p) => s + Math.min(1, p.value / p.target), 0) / parts.length, evidence: [...new Set(parts.flatMap((p) => p.evidence))], parts };
  }
  if (req.any) {
    const parts = req.any.map((r) => evalReq(r, ctx));
    const hit = parts.find((p) => p.done);
    const best = hit || parts.reduce((a, b) => (a.value / a.target >= b.value / b.target ? a : b));
    return { value: best.value, target: best.target, done: !!hit, ratio: best.value / best.target, evidence: best.evidence, parts };
  }
  if (req.count) {
    const evs = ctx.q({ types: [req.count.type], where: req.count.where, scope: 'player' });
    const target = req.gte ?? 1;
    return { value: evs.length, target, done: evs.length >= target, evidence: evs.slice(0, Math.max(target, 1)).map((e) => e.id) };
  }
  if (req.sum || req.max) {
    const spec = req.sum || req.max;
    const evs = ctx.q({ types: [spec.type], where: spec.where, scope: 'player' });
    let value = 0, ev = [];
    if (req.sum) { value = evs.reduce((s, e) => s + (Number(getPathValue(e, spec.field)) || 0), 0); ev = evs.map((e) => e.id).slice(0, 25); }
    else {
      let best = null;
      for (const e of evs) { const v = Number(getPathValue(e, spec.field)); if (Number.isFinite(v) && (best == null || v > best.v)) best = { v, e }; }
      value = best ? best.v : 0; ev = best ? [best.e.id] : [];
    }
    return { value, target: req.gte, done: value >= req.gte, evidence: ev };
  }
  if (req.distinct) {
    const spec = req.distinct;
    const evs = ctx.q({ types: [spec.type], where: spec.where, scope: 'player' });
    const seen = new Map();
    for (const e of evs) {
      const v = getPathValue(e, spec.field);
      for (const x of Array.isArray(v) ? v : [v]) if (x != null && !seen.has(x)) seen.set(x, e.id);
    }
    return { value: seen.size, target: req.gte, done: seen.size >= req.gte, evidence: [...seen.values()].slice(0, 25) };
  }
  if (req.streak) {
    const spec = req.streak;
    const evs = ctx.q({ types: [spec.type], where: spec.scopeWhere, scope: 'player' });
    let run = [], best = [], reached = null;
    const { matches: m } = ctx;
    for (const e of evs) {
      if (m(e, spec.where)) {
        run.push(e.id);
        if (run.length > best.length) best = [...run];
        if (reached == null && run.length >= req.gte) reached = [...run].slice(-req.gte);
      } else run = [];
    }
    return { value: best.length, target: req.gte, done: reached != null, evidence: reached || best.slice(-req.gte) };
  }
  if (req.stat) {
    const v = Number(getPathValue(ctx.stats.s, req.stat)) || 0;
    const target = req.gte ?? req.lte;
    const done = req.gte != null ? v >= req.gte : v <= req.lte;
    let evidence = [];
    if (req.evidence) { try { evidence = inspectStat(ctx.ledger, req.evidence, { maxSeq: ctx.maxSeq }).slice(0, 25).map((e) => e.id); } catch { evidence = []; } }
    return { value: v, target, done, evidence };
  }
  if (req.custom) {
    const fn = CUSTOM[req.custom];
    if (!fn) throw new Error(`unknown custom achievement check ${req.custom}`);
    return fn(ctx, req.args || {});
  }
  throw new Error(`bad requirement ${JSON.stringify(req)}`);
}

export function watchTypes(req, acc = new Set()) {
  if (req.all) req.all.forEach((r) => watchTypes(r, acc));
  else if (req.any) req.any.forEach((r) => watchTypes(r, acc));
  else if (req.count) acc.add(req.count.type);
  else if (req.sum || req.max) acc.add((req.sum || req.max).type);
  else if (req.distinct) acc.add(req.distinct.type);
  else if (req.streak) acc.add(req.streak.type);
  else if (req.stat) (req.watch || ['match_result', 'title_win', 'title_defense', 'title_loss', 'rumble_result', 'promo_delivered', 'podcast', 'interview', 'press_conference', 'injury', 'debut']).forEach((t) => acc.add(t));
  else if (req.custom) (req.watch || ['match_result', 'title_win', 'title_loss', 'betrayal', 'award', 'milestone', 'rumble_result', 'achievement_unlocked']).forEach((t) => acc.add(t));
  return acc;
}

export function describeReq(req) {
  if (req.all) return req.all.map(describeReq).join(' AND ');
  if (req.any) return req.any.map(describeReq).join(' OR ');
  const w = (x) => (x ? ` matching ${JSON.stringify(x).replace(/"data\./g, '"')}` : '');
  if (req.count) return `${req.gte ?? 1}x ${req.count.type}${w(req.count.where)}`;
  if (req.sum) return `sum of ${req.sum.field} over ${req.sum.type}${w(req.sum.where)} >= ${req.gte}`;
  if (req.max) return `max ${req.max.field} over ${req.max.type}${w(req.max.where)} >= ${req.gte}`;
  if (req.distinct) return `${req.gte} distinct ${req.distinct.field} in ${req.distinct.type}${w(req.distinct.where)}`;
  if (req.streak) return `${req.gte} consecutive ${req.streak.type}${w(req.streak.where)}`;
  if (req.stat) return `${req.stat} ${req.gte != null ? '>= ' + req.gte : '<= ' + req.lte}`;
  if (req.custom) return `custom check "${req.custom}"`;
  return '?';
}

export class AchievementEngine {
  /**
   * @param defs     array of declarative definitions
   * @param memory   Memory (ledger + world)
   * @param getEnv   () => ({ stats: CareerStats, era, year })  current environment for gating
   */
  constructor(defs, memory, getEnv) {
    this.defs = new Map();
    for (const d of defs) {
      if (this.defs.has(d.id)) throw new Error(`duplicate achievement id ${d.id}`);
      this.defs.set(d.id, { ...d, watch: [...watchTypes(d.req)] });
    }
    this.memory = memory;
    this.getEnv = getEnv;
    this.unlocked = {};
    this.progress = {};
    this.depth = 0;
    this.listeners = [];
  }

  eligible(def, env) {
    if (def.eras && env.era && !def.eras.includes(env.era)) return false;
    if (def.minYear && env.year < def.minYear) return false;
    if (def.maxYear && env.year > def.maxYear) return false;
    return true;
  }

  _ctx(maxSeq) {
    const env = this.getEnv();
    const ledger = this.memory.ledger;
    return {
      ledger, world: this.memory.world, stats: env.stats, era: env.era, year: env.year, playerId: this.memory.playerId, env, maxSeq,
      memory: this.memory, matches: undefined,
      q: (spec) => ledger.query({ ...spec, maxSeq }),
    };
  }

  evaluate(def, maxSeq) {
    const ctx = this._ctx(maxSeq);
    // streak helper needs the shared matcher
    ctx.matches = undefined;
    return evalReq(def.req, withMatcher(ctx));
  }

  /** React to a newly recorded event: evaluate only the achievements that watch its type. Returns unlock records. */
  processEvent(ev, { maxSeq = ev.seq } = {}) {
    const out = [];
    if (this.depth > 3) return out;
    this.depth++;
    try {
      const env = this.getEnv();
      for (const def of this.defs.values()) {
        if (this.unlocked[def.id]) continue;
        if (!def.watch.includes(ev.type)) continue;
        if (!this.eligible(def, env)) continue;
        const res = this.evaluate(def, maxSeq);
        this.progress[def.id] = { value: res.value, target: res.target, ratio: Math.min(1, res.value / (res.target || 1)), evidence: (res.evidence || []).slice(0, 25) };
        if (res.done) out.push(this._unlock(def, ev, res));
      }
    } finally { this.depth--; }
    return out.filter(Boolean);
  }

  _unlock(def, ev, res) {
    if (this.unlocked[def.id]) return null;
    const evidence = res.evidence.length ? res.evidence : [ev.id];
    const explanation = `${def.desc} Requirement met (${Math.floor(res.value)}/${res.target}).`;
    const { event, duplicate } = this.memory.record({
      key: `ach:${def.id}`, day: ev.day, date: ev.date, category: 'achievement', type: 'achievement_unlocked', participants: [this.memory.playerId],
      storyline: null, summary: `Achievement unlocked: ${def.name}`, refs: [...new Set(evidence)].filter((id) => this.memory.ledger.get(id)), importance: { common: 2, uncommon: 3, rare: 4, epic: 5, legendary: 5 }[def.rarity] || 3,
      data: { achievementId: def.id, name: def.name, rarity: def.rarity, explanation, value: res.value, target: res.target, trigger: ev.id, reward: def.reward || null },
    });
    const rec = { id: def.id, name: def.name, rarity: def.rarity, day: ev.day, date: ev.date, trigger: ev.id, evidence: event.refs, explanation, requirement: describeReq(def.req), event: event.id, reward: def.reward || null, duplicate };
    this.unlocked[def.id] = rec;
    for (const l of this.listeners) l(rec);
    // unlocking is itself an event (meta achievements)
    this.processEvent(event);
    return rec;
  }

  /** Rebuild everything from the ledger (proves achievements are derivable from events). */
  static rebuildUnlocks(defs, memory, makeEnv) {
    // evaluates each event with the ledger truncated to that event
    const eng = new AchievementEngine(defs, memory, () => makeEnv.current());
    const result = {};
    const ledger = memory.ledger;
    makeEnv.reset();
    for (const ev of ledger.events) {
      makeEnv.apply(ev);
      if (ev.type === 'achievement_unlocked') continue;
      const env = eng.getEnv();
      for (const def of eng.defs.values()) {
        if (result[def.id] || !def.watch.includes(ev.type) || !eng.eligible(def, env)) continue;
        const res = eng.evaluate(def, ev.seq);
        if (res.done) result[def.id] = { trigger: ev.id, day: ev.day, value: res.value };
      }
    }
    return result;
  }

  list(env = this.getEnv()) {
    return [...this.defs.values()].map((d) => {
      const u = this.unlocked[d.id];
      const p = this.progress[d.id] || { value: 0, target: 1, ratio: 0 };
      const hidden = d.secret && !u;
      return {
        id: d.id, category: d.category, rarity: d.rarity, unlocked: !!u, secret: !!d.secret,
        name: hidden ? '???' : d.name, desc: hidden ? 'A secret achievement. Keep wrestling to discover it.' : d.desc,
        progress: hidden ? null : p, eligible: this.eligible(d, env), record: u || null, reward: d.reward || null,
      };
    });
  }

  toJSON() { return { unlocked: this.unlocked, progress: this.progress }; }
  load(j) { this.unlocked = j.unlocked || {}; this.progress = j.progress || {}; }
}

import { matches as whereMatches } from '../memory/ledger.js';
function withMatcher(ctx) { ctx.matches = whereMatches; return ctx; }
