/**
 * Web Worker entry for the career page. Protocol:
 *   in : { type: 'meta' } | { type: 'start', input } | { type: 'choose', id: string | null } | { type: 'auto' }
 *   out: { type: 'meta', clubs, nations } | { type: 'matches', label, matches } | { type: 'season', season } | { type: 'decision', decision } | { type: 'done', result } | { type: 'error', message }
 * Matches and seasons are streamed as they are played; in manual mode the worker stops at every decision until it gets `choose`.
 */
import { CareerSim, NATIONS, careerClubs, type CareerInput } from '../src/career';

declare const self: unknown; // Web Worker global (this package compiles without the DOM lib)
const scope = self as { onmessage: ((e: { data: { type: string; input?: CareerInput; id?: string | null } }) => void) | null; postMessage: (m: unknown) => void };
let sim: CareerSim | null = null;

function run(): void {
  if (!sim) return;
  for (;;) {
    const st = sim.step();
    if (st.kind === 'decision') { scope.postMessage({ type: 'decision', decision: st.decision }); return; }
    if (st.kind === 'matches') scope.postMessage({ type: 'matches', label: st.label, matches: st.matches });
    else if (st.kind === 'season') scope.postMessage({ type: 'season', season: st.season });
    else { scope.postMessage({ type: 'done', result: st.result }); return; }
  }
}

scope.onmessage = (e) => {
  try {
    const m = e.data;
    if (m.type === 'meta') scope.postMessage({ type: 'meta', clubs: careerClubs(), nations: NATIONS.map((n) => ({ code: n.code, name: n.name, level: n.level })) });
    else if (m.type === 'start' && m.input) { sim = new CareerSim(m.input); run(); }
    else if (m.type === 'choose' && sim) { sim.decide(m.id ?? null); run(); }
    else if (m.type === 'auto' && sim) { sim.autopilot(); sim.decide(null); run(); }
  } catch (err) {
    scope.postMessage({ type: 'error', message: String((err as Error).message ?? err) });
  }
};
