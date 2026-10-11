// National projects: multi-year investments that cost a share of GDP per year (financed as extra borrowing) and grant permanent
// modifiers on completion. Same rules for the player and the AI (start / cancel go through the command layer).
import { addTimedMod } from './mods.js';
import { checkAll } from './events.js';

export const MAX_ACTIVE = 2;
const FOREVER = 1e9;

export function ensure(c) {
  if (!c.projects) c.projects = { active: [], done: [] };
  return c.projects;
}
export const projectById = (sim, id) => sim.data.projects.find((p) => p.id === id);

export function status(sim, c, p) {
  const st = ensure(c);
  if (st.done.includes(p.id)) return { state: 'done' };
  const act = st.active.find((a) => a.id === p.id);
  if (act) return { state: 'active', progress: act.months / (p.years * 12), months: act.months };
  if (!checkAll(sim, c, p.when || [], {})) return { state: 'locked' };
  return { state: 'available' };
}
export function startProject(sim, actor, id) {
  const c = sim.state.countries[actor];
  const p = projectById(sim, id);
  if (!p) return { ok: false, reason: 'unknown project' };
  const s = status(sim, c, p);
  if (s.state === 'done') return { ok: false, reason: 'already completed' };
  if (s.state === 'active') return { ok: false, reason: 'already under way' };
  if (s.state === 'locked') return { ok: false, reason: 'requirements not met' };
  if (ensure(c).active.length >= MAX_ACTIVE) return { ok: false, reason: `at most ${MAX_ACTIVE} projects at a time` };
  if (c.gov.pc < p.pc) return { ok: false, reason: `needs ${p.pc} political capital` };
  c.gov.pc -= p.pc;
  c.projects.active.push({ id, start: sim.state.day, months: 0 });
  sim.log(actor, 'diplomacy', `${c.name} launches the ${p.name} project`, { project: id }, actor === sim.state.playerId ? 'medium' : 'low');
  return { ok: true };
}
export function cancelProject(sim, actor, id) {
  const c = sim.state.countries[actor];
  const st = ensure(c);
  if (!st.active.some((a) => a.id === id)) return { ok: false, reason: 'not under way' };
  st.active = st.active.filter((a) => a.id !== id);
  return { ok: true };
}
export function monthlyStep(sim, day) {
  for (const c of sim.state.countries) {
    const st = c.projects;
    if (!st || !st.active.length) continue;
    const e = c.econ;
    for (const a of st.active.slice()) {
      const p = projectById(sim, a.id);
      if (!p) continue;
      if (e.marketClosed || e.reserves < 0) continue; // the state cannot borrow: work stops
      e.debt += (p.cost * e.gdp) / 12;
      a.months++;
      if (a.months >= p.years * 12) {
        for (const fx of p.effects) addTimedMod(c, fx.mod, fx.add, FOREVER, p.name);
        st.active = st.active.filter((x) => x !== a);
        st.done.push(p.id);
        sim.log(c.idx, 'tech', `${c.name} completes: ${p.name}`, { project: p.id }, c.idx === sim.state.playerId ? 'high' : 'low');
        sim.emit('project', { country: c.idx, id: p.id });
      }
    }
  }
}
