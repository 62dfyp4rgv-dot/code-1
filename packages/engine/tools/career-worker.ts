/**
 * Web Worker entry for the career page. Protocol:
 *   in : { type: 'meta' } | { type: 'start', input } | { type: 'choose', id: string | null }
 *   out: { type: 'meta', clubs, nations } | { type: 'season', season } | { type: 'window', window } | { type: 'done', result } | { type: 'error', message }
 * Seasons are streamed as they are played; in manual-transfer mode the worker stops at each transfer window until it gets `choose`.
 */
import { CareerSim, NATIONS, careerClubs, type CareerInput } from '../src/career';

declare const self: unknown; // Web Worker global (this package compiles without the DOM lib)
const scope = self as { onmessage: ((e: { data: { type: string; input?: CareerInput; id?: string | null } }) => void) | null; postMessage: (m: unknown) => void };
let sim: CareerSim | null = null;

function run(): void {
  if (!sim) return;
  while (!sim.finished) {
    const w = sim.pendingWindow;
    if (w) { scope.postMessage({ type: 'window', window: w }); return; }
    scope.postMessage({ type: 'season', season: sim.playSeason() });
  }
  const w = sim.pendingWindow;
  if (!w) scope.postMessage({ type: 'done', result: sim.result() });
}

scope.onmessage = (e) => {
  try {
    const m = e.data;
    if (m.type === 'meta') scope.postMessage({ type: 'meta', clubs: careerClubs(), nations: NATIONS.map((n) => ({ code: n.code, name: n.name, level: n.level })) });
    else if (m.type === 'start' && m.input) { sim = new CareerSim(m.input); run(); }
    else if (m.type === 'choose' && sim) { sim.decide(m.id ?? null); run(); }
  } catch (err) {
    scope.postMessage({ type: 'error', message: String((err as Error).message ?? err) });
  }
};
