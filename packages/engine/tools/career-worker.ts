/** Web Worker entry for the career page: receives a CareerInput, streams each season, then the full result. */
import { simulateCareer, type CareerInput } from '../src/career';

declare const self: unknown; // Web Worker global (this package compiles without the DOM lib)
const scope = self as { onmessage: ((e: { data: CareerInput }) => void) | null; postMessage: (m: unknown) => void };
scope.onmessage = (e) => {
  try {
    const result = simulateCareer(e.data, (s) => scope.postMessage({ type: 'season', season: s }));
    scope.postMessage({ type: 'done', result });
  } catch (err) {
    scope.postMessage({ type: 'error', message: String((err as Error).message ?? err) });
  }
};
