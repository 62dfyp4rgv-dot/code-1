// Mandates: rolling short-term goals offered to the player, drawn from data/mandates.json. Each is tied to a stat the player can
// actually move; completing one pays political capital and a small approval bump. Pure bookkeeping on top of existing systems.
import { stat, checkAll } from './events.js';
import { hash01 } from './rng.js';

export const MAX_ACTIVE = 3;
const REPEAT_MONTHS = 48;
const DAYS = 30.4;

export function ensure(c) {
  if (!c.mandates) c.mandates = { active: [], done: 0, failed: 0, last: {}, next: 0 };
  return c.mandates;
}
export const templateById = (sim, id) => sim.data.mandates.find((m) => m.id === id);

// The concrete goal value of a 'reach' mandate, or null when the template cannot be a real challenge from this position.
function goalOf(t, from) {
  const raw = from + t.delta;
  const goal = t.delta < 0 ? Math.max(raw, t.target ?? raw) : Math.min(raw, t.target ?? raw);
  return (t.delta < 0 ? goal < from : goal > from) ? goal : null;
}
export function progress(sim, c, a) {
  const t = templateById(sim, a.id);
  if (!t) return { frac: 0, value: 0 };
  const v = stat(sim, c, t.stat, {});
  if (t.kind === 'hold') return { frac: Math.min(1, a.streak / t.hold), value: v };
  const span = a.goal - a.from;
  return { frac: span === 0 ? 1 : Math.max(0, Math.min(1, (v - a.from) / span)), value: v };
}
function met(sim, c, t, a) {
  if (t.kind === 'hold') return a.streak >= t.hold;
  const v = stat(sim, c, t.stat, {});
  return t.delta < 0 ? v <= a.goal : v >= a.goal;
}
function resolve(sim, c, a, won) {
  const m = ensure(c);
  const t = templateById(sim, a.id);
  m.active = m.active.filter((x) => x !== a);
  m.last[a.id] = sim.state.day;
  if (won) {
    m.done++;
    c.gov.pc += t.reward.pc;
    c.gov.approval = Math.min(1, c.gov.approval + (t.reward.approval || 0));
    sim.state.counters.mandates = (sim.state.counters.mandates || 0) + 1;
    sim.log(c.idx, 'world', `Mandate achieved: ${t.name} (+${t.reward.pc} political capital)`, { mandate: t.id }, 'high');
  } else {
    m.failed++;
    sim.log(c.idx, 'world', `Mandate missed: ${t.name}`, { mandate: t.id }, 'medium');
  }
  sim.emit('mandate', { id: t.id, won });
}
export function dismiss(sim, actor, id) {
  const c = sim.state.countries[actor];
  const m = ensure(c);
  const a = m.active.find((x) => x.id === id);
  if (!a) return { ok: false, reason: 'not an active mandate' };
  m.active = m.active.filter((x) => x !== a);
  m.last[id] = sim.state.day;
  return { ok: true };
}
function issue(sim, c) {
  const m = ensure(c);
  const day = sim.state.day;
  const busy = new Set(m.active.map((a) => templateById(sim, a.id)?.stat));
  let best = null,
    bestScore = -1;
  for (const t of sim.data.mandates) {
    if (m.active.some((a) => a.id === t.id) || busy.has(t.stat)) continue;
    if (m.last[t.id] !== undefined && day - m.last[t.id] < REPEAT_MONTHS * DAYS) continue;
    if (!checkAll(sim, c, t.when, {})) continue;
    const from = stat(sim, c, t.stat, {});
    if (t.kind === 'reach' && goalOf(t, from) === null) continue;
    const score = hash01(`mandate|${sim.opts.seed}|${day}|${t.id}`);
    if (score > bestScore) {
      best = { t, from };
      bestScore = score;
    }
  }
  if (!best) return;
  const { t, from } = best;
  m.active.push({
    id: t.id,
    start: day,
    deadline: day + Math.round(t.months * DAYS),
    from,
    goal: t.kind === 'reach' ? goalOf(t, from) : null,
    streak: 0,
  });
  sim.log(c.idx, 'world', `New mandate: ${t.name}. ${t.text}`, { mandate: t.id }, 'medium');
  sim.emit('mandateNew', { id: t.id });
}
export function monthlyStep(sim, day) {
  const st = sim.state;
  const c = st.countries[st.playerId];
  if (!c) return;
  const m = ensure(c);
  for (const a of m.active.slice()) {
    const t = templateById(sim, a.id);
    if (!t) {
      m.active = m.active.filter((x) => x !== a);
      continue;
    }
    if (t.kind === 'hold') a.streak = checkAll(sim, c, t.when, {}) ? a.streak + 1 : 0;
    if (met(sim, c, t, a)) resolve(sim, c, a, true);
    else if (day >= a.deadline) resolve(sim, c, a, false);
  }
  if (m.active.length < MAX_ACTIVE && day >= m.next) {
    issue(sim, c);
    m.next = day + Math.round(2 * DAYS);
  }
}
