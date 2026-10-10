import { COMPETITIONS } from '../src/competition/registry';
import { createCompetition } from '../src/competition/engine';
import { fakeClubs, ctxFor } from '../test/helpers';
for (const n of [28, 30]) {
  const clubs = fakeClubs(n, ['ENG', 'ESP', 'ITA', 'GER', 'FRA', 'POR', 'NED', 'BEL', 'SCO', 'TUR'], 'lp0'); clubs.forEach((c, i) => { if (i % 5 < 2) c.country = 'ENG'; });
  const comp: any = createCompetition(COMPETITIONS.UCL!, 1, clubs.map((c) => c.id), ctxFor(clubs, 'x0'));
  console.log(`n=${n} notes:`, JSON.stringify(comp.notes ?? null));
}
