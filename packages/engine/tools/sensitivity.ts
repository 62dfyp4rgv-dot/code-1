import { simulateMatch } from '../src/match';
import { syntheticMatch, syntheticSheet } from '../src/synth';
import { defaultTactics } from '../src/tactics';
import type { Tactics } from '../src/types';
const n = Number(process.argv[2] ?? 3000);
function vsBalanced(label: string, mod: Partial<Tactics>): void {
  let gd = 0, g = 0, xgd = 0, poss = 0;
  for (let i = 0; i < n; i++) {
    const aHome = i % 2 === 0;
    const ta = syntheticSheet({ id: 'A', quality: 64, seed: String(i), tactics: { ...defaultTactics('4-3-3'), ...mod } });
    const tb = syntheticSheet({ id: 'B', quality: 64, seed: String(i), tactics: defaultTactics('4-3-3') });
    const r = simulateMatch(aHome ? syntheticMatch(`m${i}`, `s${i}`, ta, tb) : syntheticMatch(`m${i}`, `s${i}`, tb, ta));
    const [ga, gb] = aHome ? [r.score.home, r.score.away] : [r.score.away, r.score.home];
    const [xa, xb] = aHome ? [r.stats.home.xg, r.stats.away.xg] : [r.stats.away.xg, r.stats.home.xg];
    gd += ga - gb; g += ga + gb; xgd += xa - xb; poss += aHome ? r.stats.home.possession : r.stats.away.possession;
  }
  console.log(label.padEnd(26), `GD ${(gd / n).toFixed(3).padStart(7)}  xGD ${(xgd / n).toFixed(3).padStart(7)}  G/m ${(g / n).toFixed(2)}  poss ${(poss / n).toFixed(1)}`);
}
vsBalanced('baseline (control)', {});
for (const [k, lo, hi] of [['tempo', 20, 85], ['width', 15, 85], ['directness', 10, 90], ['pressing', 10, 90], ['defensiveLine', 10, 90]] as const) {
  vsBalanced(`${k}=${lo}`, { [k]: lo });
  vsBalanced(`${k}=${hi}`, { [k]: hi });
}
for (const m of [-2, -1, 1, 2] as const) vsBalanced(`mentality=${m}`, { mentality: m });
vsBalanced('counterAttack=true', { counterAttack: true });
for (const m of ['man', 'mixed'] as const) vsBalanced(`marking=${m}`, { marking: m });
vsBalanced('setPieceFocus=near', { setPieceFocus: 'near' });
vsBalanced('setPieceFocus=short', { setPieceFocus: 'short' });
