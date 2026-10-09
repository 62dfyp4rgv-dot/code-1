import { simulateMatch } from '../src/match';
import { syntheticSheet, syntheticMatch } from '../src/synth';
import { defaultTactics, ROLES, FORMATIONS, formationOf } from '../src/tactics';
import type { Tactics } from '../src/types';

const N = Number(process.env.N ?? 2000);
function run(label: string, mk: (i: number) => { a: Tactics; b: Tactics }, q = 62) {
  let gdA = 0, gA = 0, gB = 0, wA = 0, wB = 0;
  for (let i = 0; i < N; i++) {
    const { a, b } = mk(i);
    const swap = i % 2 === 1; // alternate home/away
    const A = syntheticSheet({ id: 'A', quality: q, tactics: a, seed: 's' + (i >> 1) });
    const B = syntheticSheet({ id: 'B', quality: q, tactics: b, seed: 's' + (i >> 1) });
    const r = swap ? simulateMatch(syntheticMatch('m' + i, 'crit', B, A)) : simulateMatch(syntheticMatch('m' + i, 'crit', A, B));
    const ga = swap ? r.score.away : r.score.home, gb = swap ? r.score.home : r.score.away;
    gA += ga; gB += gb; gdA += ga - gb; if (ga > gb) wA++; else if (gb > ga) wB++;
  }
  const gd = gdA / N;
  console.log(`${label.padEnd(44)} GD(A-B)=${gd.toFixed(3)}  goals A ${(gA / N).toFixed(2)} B ${(gB / N).toFixed(2)}  win A ${(wA / N * 100).toFixed(1)}% B ${(wB / N * 100).toFixed(1)}%  se~${(1.6 / Math.sqrt(N)).toFixed(3)}`);
}
const base = () => defaultTactics('4-3-3');
// 1: identical teams (A vs B same tactics, different synthetic seeds each)
run('identical tactics (control)', () => ({ a: base(), b: base() }));
// 2: maxSubs
run('maxSubs 9 vs 5', () => ({ a: { ...base(), maxSubs: 9 }, b: base() }));
run('maxSubs NaN vs 5', () => ({ a: { ...base(), maxSubs: NaN }, b: base() }));
run('maxSubs 0 vs 5', () => ({ a: { ...base(), maxSubs: 0 }, b: base() }));
// 3: best roles (all multipliers > 1) vs default
function bestRoles(t: Tactics, pick: (pos: string) => string): Tactics { const fm = formationOf(t.formation); return { ...t, roles: fm.slots.map(pick) }; }
const upgrade: Record<string, string> = { GK: 'sweeperKeeper', CB: 'ballPlayingCB', LB: 'wingBack', RB: 'wingBack', DM: 'ballWinner', CM: 'boxToBox', AM: 'playmaker', LW: 'insideForward', RW: 'insideForward', ST: 'completeForward' };
run('roles: upgrade set vs default roles', () => ({ a: bestRoles(base(), (p) => upgrade[p]!), b: base() }));
for (const [pos, role] of Object.entries(upgrade)) {
  run(`  single role ${pos}=${role}`, () => ({ a: bestRoles(base(), (p) => (p === pos ? role : (ROLES as any)[Object.keys(ROLES).find((k) => ROLES[k]!.positions.includes(p as any) && ['goalkeeper','centreBack','fullBack','anchor','midfielder','playmaker','winger','poacher'].includes(k))!]!.id)), b: base() }));
}
