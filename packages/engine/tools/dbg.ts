import { createWorld, advanceDay } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
const w = createWorld(defaultWorldConfig('season-test', 'compact'));
try { for (let i = 0; i < 364; i++) advanceDay(w); } catch (e) {
  console.log('day', w.day);
  for (const c of Object.values(w.competitions)) {
    const st = c.stages[c.stageIndex]!;
    const last = st.ties.at(-1);
    if (last && last.some((t) => t.winner === undefined || t.home === undefined)) console.log(c.id, c.stageIndex, st.id, JSON.stringify(last.slice(0, 20)).slice(0, 600));
    if (last && last.length % 2 === 1 && last.length > 1) console.log('odd ties in', c.id, st.id, last.length, 'teams', st.teams.length);
  }
  console.log(String((e as Error).stack).split('\n').slice(0, 3).join('\n'));
}
