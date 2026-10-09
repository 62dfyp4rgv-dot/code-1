import { createWorld, advanceDay } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { validateWorld } from '../src/world/invariants';
const w = createWorld(defaultWorldConfig('inv-test', 'compact'));
const summarize = (label: string): void => {
  const v = validateWorld(w, { checkLedger: true });
  const by: Record<string, { n: number; ex: string }> = {};
  for (const x of v) { const b = (by[x.code] ??= { n: 0, ex: x.message }); b.n++; }
  console.log(label, 'day', w.day, 'violations', v.length, Object.entries(by).map(([k, b]) => `${k}x${b.n} e.g. "${b.ex}"`).slice(0, 6).join(' | '));
};
summarize('initial');
for (let d = 0; d < 364 * 2 + 10; d++) { advanceDay(w); if (d % 60 === 59 || d === 364 * 2 + 9) summarize(`d${d}`); }
