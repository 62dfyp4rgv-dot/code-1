import { COMPETITIONS } from '../src/competition/registry';
import { createCompetition } from '../src/competition/engine';
import { fakeClubs, ctxFor, playOut } from '../test/helpers';
let hostFav = 0, total = 0, upsetsHostedByUnderdog = 0;
for (let s = 0; s < 20; s++) {
  const clubs = fakeClubs(44, ['ENG'], 'cup' + s); const ctx = ctxFor(clubs, 'cup' + s);
  const comp = createCompetition(COMPETITIONS['ENG-CUP']!, 1, clubs.map((c) => c.id), ctx);
  playOut(comp, ctx, clubs, 'p' + s);
  const co = new Map(clubs.map((c) => [c.id, c.coefficient]));
  for (const f of comp.fixtures) { if (f.neutral) continue; total++; if (co.get(f.home)! >= co.get(f.away)!) hostFav++; }
}
console.log(`[cup venue] ENG-CUP single-leg non-neutral ties over 20 simulated cups: stronger-coefficient club hosts ${hostFav}/${total} (${(hostFav / total * 100).toFixed(1)}%)`);
// two-legged away goals path: no registered competition enables it
import { COMPETITIONS as C } from '../src/competition/registry';
const on = Object.values(C).flatMap((d) => d.rules.flatMap((r) => r.stages.filter((s: any) => s.type === 'knockout' && s.awayGoalsRule).map(() => d.id)));
console.log('[awayGoalsRule] competitions with awayGoalsRule=true:', on.length);
const pensOff = Object.values(C).flatMap((d) => d.rules.flatMap((r) => r.stages.filter((s: any) => s.type === 'knockout' && !s.penalties).map(() => d.id)));
console.log('[penalties flag] knockout stages with penalties=false:', pensOff.length, '(flag is never read by the engine either way)');
