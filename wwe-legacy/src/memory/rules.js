// Memory-driven consequences: explicit, deterministic rules that turn ledger events into
// changes of world state (relationships, rivalries, promises, obligations). No randomness and
// no narration here - past events influence the future only through these rules.
import { hash53 } from '../core/util.js';
import {
  adjustRel, addTag, recordBetrayal, reconcile, bumpRivalry, addPromise, addObligation, getRel, getRivalry, pairKey, decayWorld,
} from './world.js';

const jitter = (ev, lo, hi) => lo + (parseInt(hash53(ev.id), 36) % (hi - lo + 1));

/** Standard promise kinds and how an event resolves them. Returns 'kept' | 'broken' | null */
const PROMISE_JUDGES = {
  win_match(p, ev, ctx) {
    // the target must have been an OPPONENT: winning a tag match alongside them proves nothing
    if (ev.type !== 'match_result' || !(ev.data.opponents || []).includes(p.target)) return null;
    if (p.by !== ctx.playerId) return null;
    return ev.data.result === 'win' ? 'kept' : ev.data.result === 'loss' ? 'broken' : null;
  },
  win_title(p, ev) {
    if (ev.type === 'title_win' && (!p.params?.titleId || p.params.titleId === ev.data.titleId)) return 'kept';
    return null;
  },
  win_rumble(p, ev) {
    if (ev.type !== 'rumble_result' || ev.data.year !== p.params?.year) return null;
    return ev.data.won ? 'kept' : 'broken';
  },
  retain_title(p, ev) {
    if (ev.type === 'title_loss' && (!p.params?.titleId || p.params.titleId === ev.data.titleId)) return 'broken';
    if (ev.type === 'title_defense' && ev.data.success && (ev.data.defenseNumber || 0) >= (p.params?.defenses || 1)) return 'kept';
    return null;
  },
  win_streak(p, ev) {
    if (ev.type !== 'match_result') return null;
    if (ev.data.winStreak >= (p.params?.n || 5)) return 'kept';
    if (ev.data.result === 'loss' && ev.data.winStreakBefore < (p.params?.n || 5)) return 'broken';
    return null;
  },
};
export const PROMISE_KINDS = Object.keys(PROMISE_JUDGES);

export function resolvePromises(world, ev, ctx) {
  const resolved = [];
  for (const p of world.promises) {
    if (p.status !== 'open') continue;
    if (p.deadlineDay != null && ev.day > p.deadlineDay) {
      p.status = 'broken'; p.resolvedEvent = ev.id; p.resolvedDay = ev.day; p.reason = 'deadline passed';
      resolved.push(p); continue;
    }
    const judge = PROMISE_JUDGES[p.kind];
    if (!judge) continue;
    const verdict = judge(p, ev, ctx);
    if (verdict) { p.status = verdict; p.resolvedEvent = ev.id; p.resolvedDay = ev.day; resolved.push(p); }
  }
  return resolved;
}

const RULES = {
  match_result(world, ev, ctx) {
    const d = ev.data;
    const me = ctx.playerId;
    const opps = d.opponents || [];
    const win = d.result === 'win', loss = d.result === 'loss';
    const dirty = ['dq', 'countout'].includes(d.finish) || d.interference;
    for (const o of opps) {
      const heat = 6 + (d.titleOnLine ? 8 : 0) + (dirty ? 10 : 0) + (d.rating >= 4 ? 4 : 0);
      const rv = bumpRivalry(world, me, o, { heat, eventId: ev.id, day: ev.day });
      rv.matches += 1;
      // credit only the wrestler who actually won (a triple threat lost to C must not credit A and B alike)
      if (win) rv.wins[me] = (rv.wins[me] || 0) + 1; else if (loss && d.winner === o) rv.wins[o] = (rv.wins[o] || 0) + 1;
      if (win) {
        adjustRel(world, o, me, { respect: d.clean ? 4 : 1, fear: d.dominant ? 4 : 1 }, ev.id, ev.day);
        // repeated clean defeats: the opponent studies the player and eventually becomes reluctant
        if (d.clean) {
          const k = `cleanLosses:${o}>${me}`;
          world.counters[k] = (world.counters[k] || 0) + 1;
          if (world.counters[k] >= 3 && !world.flags[`studied:${o}>${me}`]) {
            world.flags[`studied:${o}>${me}`] = { since: ev.day, trigger: ev.id, topCategory: d.playerTopCategory || null };
            addTag(world, o, me, 'studying_you', ev.id);
          }
          if (world.counters[k] >= 5) addTag(world, o, me, 'reluctant', ev.id);
        }
      } else if (loss) {
        adjustRel(world, me, o, { respect: 3 }, ev.id, ev.day);
        adjustRel(world, o, me, { respect: dirty ? -2 : 1 }, ev.id, ev.day);
        world.counters[`cleanLosses:${o}>${me}`] = 0;
      }
      if (dirty && win) {
        addObligation(world, { id: `ob:${ev.id}:${o}:grudge`, kind: 'grudge_rematch', from: o, to: me, dueDay: ev.day + 7 + jitter(ev, 0, 10), source: ev.id });
      }
    }
    for (const p of d.partners || []) {
      adjustRel(world, me, p, { trust: win ? 5 : 1, respect: win ? 3 : 0, affinity: 2 }, ev.id, ev.day);
      adjustRel(world, p, me, { trust: win ? 5 : 1, respect: win ? 3 : 0, affinity: 2 }, ev.id, ev.day);
      if (win) world.counters[`partnerWins:${p}`] = (world.counters[`partnerWins:${p}`] || 0) + 1;
    }
  },
  promo_delivered(world, ev, ctx) {
    const d = ev.data, me = ctx.playerId;
    for (const t of d.targets || []) {
      const q = Math.max(0.3, (d.quality ?? 50) / 70);
      switch (d.tone) {
        case 'insult': case 'humiliate': {
          const big = d.tone === 'humiliate' ? 1.6 : 1;
          adjustRel(world, t, me, { heat: 10 * big * q, respect: -8 * big, trust: -5 }, ev.id, ev.day);
          bumpRivalry(world, me, t, { heat: 8 * big, eventId: ev.id, day: ev.day });
          addTag(world, t, me, 'insulted_by', ev.id);
          addObligation(world, { id: `ob:${ev.id}:${t}:confront`, kind: 'confront_backstage', from: t, to: me, dueDay: ev.day + 2 + jitter(ev, 0, 12), source: ev.id, quote: d.line || null });
          if (d.tone === 'humiliate') addTag(world, t, me, 'humiliated_by', ev.id);
          break;
        }
        case 'respect': case 'tribute':
          adjustRel(world, t, me, { respect: 8 * q, affinity: 4, trust: 2 }, ev.id, ev.day);
          addTag(world, t, me, 'respected_by', ev.id);
          break;
        case 'challenge':
          adjustRel(world, t, me, { heat: 8, respect: 2 }, ev.id, ev.day);
          bumpRivalry(world, me, t, { heat: 8, eventId: ev.id, day: ev.day });
          addObligation(world, { id: `ob:${ev.id}:${t}:answer`, kind: 'answer_challenge', from: t, to: me, dueDay: ev.day + 7, source: ev.id });
          break;
        case 'threat':
          adjustRel(world, t, me, { heat: 10, fear: 10 * q, respect: -3 }, ev.id, ev.day);
          bumpRivalry(world, me, t, { heat: 6, eventId: ev.id, day: ev.day });
          break;
        case 'apology': {
          const had = getRel(world, me, t).tags.includes('insulted_by') || getRel(world, me, t).heat > 20;
          adjustRel(world, t, me, { heat: -10, respect: had ? 3 : 0, trust: 3 }, ev.id, ev.day);
          break;
        }
        default: break;
      }
    }
    for (const c of d.promises || []) {
      addPromise(world, { id: `pr:${ev.id}:${c.kind}`, by: me, kind: c.kind, target: c.target || null, params: c.params || {}, text: c.text, madeEvent: ev.id, madeDay: ev.day, deadlineDay: c.deadlineDay ?? null });
    }
  },
  promise_made(world, ev, ctx) {
    const d = ev.data;
    addPromise(world, { id: d.promiseId || `pr:${ev.id}`, by: ctx.playerId, kind: d.kind, target: d.target || null, params: d.params || {}, text: d.text, madeEvent: ev.id, madeDay: ev.day, deadlineDay: d.deadlineDay ?? null });
  },
  betrayal(world, ev) {
    const [betrayer, victim] = ev.participants;
    recordBetrayal(world, betrayer, victim, ev.id, ev.day);
    addObligation(world, { id: `ob:${ev.id}:revenge`, kind: 'seek_revenge', from: victim, to: betrayer, dueDay: ev.day + 10 + jitter(ev, 0, 20), source: ev.id });
    bumpRivalry(world, betrayer, victim, { heat: 35, eventId: ev.id, day: ev.day });
    for (const f of Object.values(world.factions)) if (f.members.includes(betrayer) && f.members.includes(victim) && ev.data.context === 'faction') {
      f.trust = Math.max(-100, (f.trust ?? 0) - 25);
    }
  },
  alliance_formed(world, ev) {
    const [a, b] = ev.participants;
    adjustRel(world, a, b, { trust: 15, respect: 6, affinity: 10 }, ev.id, ev.day);
    adjustRel(world, b, a, { trust: 15, respect: 6, affinity: 10 }, ev.id, ev.day);
    addTag(world, a, b, 'ally', ev.id);
  },
  respect_shown(world, ev, ctx) {
    const me = ctx.playerId;
    for (const t of ev.participants.filter((p) => p !== me)) {
      adjustRel(world, t, me, { respect: 6, affinity: 3 }, ev.id, ev.day);
      const r = getRel(world, t, me);
      const i = r.a === t ? 0 : 1;
      if (r.respect[i] >= 30) addTag(world, t, me, 'alliance_possible', ev.id);
    }
  },
  reconciliation(world, ev) { const [a, b] = ev.participants; reconcile(world, a, b, ev.id); adjustRel(world, a, b, { respect: 5 }, ev.id, ev.day); adjustRel(world, b, a, { respect: 5 }, ev.id, ev.day); },
  mentorship(world, ev) { const [m, s] = ev.participants; addTag(world, m, s, 'mentor', ev.id); adjustRel(world, s, m, { respect: 10, trust: 10 }, ev.id, ev.day); adjustRel(world, m, s, { trust: 6, affinity: 5 }, ev.id, ev.day); },
  faction_formed(world, ev) {
    const d = ev.data;
    world.factions[d.factionId] = { id: d.factionId, name: d.name, leader: d.leader, members: [...ev.participants], formedDay: ev.day, trust: 30, event: ev.id };
    for (let i = 0; i < ev.participants.length; i++) for (let j = i + 1; j < ev.participants.length; j++) {
      adjustRel(world, ev.participants[i], ev.participants[j], { trust: 10, affinity: 8 }, ev.id, ev.day);
      adjustRel(world, ev.participants[j], ev.participants[i], { trust: 10, affinity: 8 }, ev.id, ev.day);
    }
  },
  faction_left(world, ev) {
    const f = world.factions[ev.data.factionId];
    if (f) f.members = f.members.filter((m) => m !== ev.data.member);
  },
  refusal_to_help(world, ev) {
    const [me, other] = ev.participants;
    adjustRel(world, other, me, { trust: -12, respect: -4 }, ev.id, ev.day);
    const f = world.factions[ev.data.factionId];
    if (f) f.trust = Math.max(-100, (f.trust ?? 0) - 10);
  },
  /** generic player decisions carry their world effects declaratively in data.effects */
  decision(world, ev) {
    const e = ev.data && ev.data.effects;
    if (!e) return;
    for (const r of e.rel || []) adjustRel(world, r.from, r.to, r, ev.id, ev.day);
    for (const rv of e.rivalry || []) bumpRivalry(world, rv.a, rv.b, { heat: rv.heat, eventId: ev.id, day: ev.day });
    for (const t of e.tags || []) addTag(world, t.a, t.b, t.tag, ev.id);
    for (const o of e.obligations || []) addObligation(world, { id: `ob:${ev.id}:${o.kind}:${o.from}`, kind: o.kind, from: o.from, to: o.to, dueDay: ev.day + (o.inDays ?? 7), source: ev.id });
  },
  scenario_choice(world, ev) { RULES.decision(world, ev); },
  /** interviews, podcasts and press conferences: declarative effects plus any guarantee made on air */
  interview(world, ev, ctx) {
    RULES.decision(world, ev);
    // owning a broken promise on air settles it: it stops being thrown back at the player
    for (const pid of ev.data.acknowledged || []) { const pr = world.promises.find((x) => x.id === pid); if (pr) pr.acknowledged = ev.id; }
    for (const c of ev.data.promises || []) {
      addPromise(world, { id: `pr:${ev.id}:${c.kind}`, by: ctx.playerId, kind: c.kind, target: c.target || null, params: c.params || {}, text: c.text, madeEvent: ev.id, madeDay: ev.day, deadlineDay: c.deadlineDay ?? null });
    }
  },
  podcast(world, ev, ctx) { RULES.interview(world, ev, ctx); },
  /** slow decay of non-grudge feelings, recorded as a monthly world event so replay reproduces it exactly */
  world_decay(world, ev) { decayWorld(world, ev.data.days || 30); },
  press_conference(world, ev, ctx) { RULES.interview(world, ev, ctx); },
  obligation_resolved(world, ev) {
    const o = world.obligations.find((x) => x.id === ev.data.obligationId);
    if (o) { o.status = ev.data.how || 'done'; o.resolvedEvent = ev.id; o.resolvedDay = ev.day; }
  },
  rumble_result() {},
  title_win() {},
};

/** Apply consequence rules for a freshly recorded event. Idempotent via world.applied. */
export function applyRules(world, ev, ctx) {
  if (world.applied[ev.id]) return { applied: false, resolved: [] };
  world.applied[ev.id] = true;
  const rule = RULES[ev.type];
  if (rule) rule(world, ev, ctx);
  const resolved = resolvePromises(world, ev, ctx);
  return { applied: true, resolved };
}

export { pairKey, getRivalry };
