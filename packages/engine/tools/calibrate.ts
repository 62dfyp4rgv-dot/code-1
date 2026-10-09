import { simulateMatch } from '../src/match';
import { syntheticMatch, syntheticSheet } from '../src/synth';
import { mean, stdev } from '../src/math';

function run(n: number, qh: number, qa: number, label: string, tweak?: (h: ReturnType<typeof syntheticSheet>, a: ReturnType<typeof syntheticSheet>) => void): void {
  let gh = 0, ga = 0, d = 0, hw = 0, aw = 0, cs = 0, shots = 0, sot = 0, xg = 0, yel = 0, red = 0, inj = 0, poss = 0, passAcc = 0, corners = 0, fouls = 0, pens = 0, off = 0;
  const totals: number[] = [];
  const t0 = performance.now();
  for (let i = 0; i < n; i++) {
    const h = syntheticSheet({ id: 'H', quality: qh, seed: String(i) });
    const a = syntheticSheet({ id: 'A', quality: qa, seed: String(i) });
    tweak?.(h, a);
    const r = simulateMatch(syntheticMatch(`m${i}`, `s${i}`, h, a));
    gh += r.score.home; ga += r.score.away;
    if (r.score.home === r.score.away) d++;
    if (r.score.home > r.score.away) hw++; else if (r.score.home < r.score.away) aw++;
    if (r.score.home === 0) cs++; if (r.score.away === 0) cs++;
    const s = r.stats;
    shots += s.home.shots + s.away.shots; sot += s.home.shotsOnTarget + s.away.shotsOnTarget; xg += s.home.xg + s.away.xg;
    yel += s.home.yellow + s.away.yellow; red += s.home.red + s.away.red; inj += r.injuries.length;
    poss += s.home.possession; passAcc += (s.home.passesCompleted + s.away.passesCompleted) / (s.home.passes + s.away.passes);
    corners += s.home.corners + s.away.corners; fouls += s.home.fouls + s.away.fouls; off += s.home.offsides + s.away.offsides;
    pens += r.events.filter((e) => e.type === 'shot' && e.kind === 'freeKick').length * 0;
    totals.push(r.score.home + r.score.away);
  }
  const ms = (performance.now() - t0) / n;
  const f = (x: number, k = 2): string => (x / n).toFixed(k);
  console.log(`${label.padEnd(22)} G/m ${f(gh + ga)} (H ${f(gh)} A ${f(ga)}) W/D/L ${f(hw)}/${f(d)}/${f(aw)} CS/team ${(cs / (2 * n)).toFixed(2)} shots ${f(shots, 1)} SoT ${f(sot, 1)} xG ${f(xg)} Y ${f(yel)} R ${f(red, 3)} inj ${f(inj, 3)} poss ${f(poss, 1)} pass% ${(passAcc / n * 100).toFixed(1)} corn ${f(corners, 1)} fouls ${f(fouls, 1)} off ${f(off, 1)} sd(goals) ${stdev(totals).toFixed(2)} ${ms.toFixed(2)}ms`);
}

const n = Number(process.argv[2] ?? 2000);
run(n, 62, 62, 'equal 62');
run(n, 70, 55, 'strong vs weak (+15)');
run(n, 75, 50, 'huge (+25)');
run(n, 55, 70, 'weak vs strong');
