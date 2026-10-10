import { Rng } from '../src/rng';
import { roundRobin } from '../src/competition/fixtures';
for (const n of [18, 20]) {
  let teams = 0, run3 = 0, run4 = 0; let where: Record<string, number> = {};
  for (let s = 0; s < 100; s++) {
    const ids = Array.from({ length: n }, (_, i) => 't' + i); const rr = roundRobin(ids, 2, Rng.fromSeed('rr' + s));
    for (const id of ids) {
      teams++; let run = 0, last = '';
      rr.forEach((rd, r) => { const p = rd.find((x) => x.home === id || x.away === id)!; const side = p.home === id ? 'H' : 'A'; run = side === last ? run + 1 : 1; last = side; if (run === 3) { run3++; const k = r === n - 1 || r === n ? 'at leg boundary' : 'inside a leg'; where[k] = (where[k] ?? 0) + 1; } if (run >= 4) run4++; });
    }
  }
  console.log(`[roundRobin n=${n}, 2 legs, 100 seeds] team-seasons ${teams}: with a run of 3 same-venue matches ${run3} (${JSON.stringify(where)}), run>=4: ${run4}`);
}
