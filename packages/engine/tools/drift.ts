import { createWorld, advanceToEndOfSeason } from '../src/world/sim';
import { defaultWorldConfig } from '../src/world/generate';
import { COMPETITIONS } from '../src/competition/registry';
import { overall } from '../src/players';
import { squadOf } from '../src/world/runtime';
const cfg = defaultWorldConfig('drift', 'compact'); cfg.leagues = ['ENG1', 'SAU1', 'USA1', 'ESP1'];
const w = createWorld(cfg);
for (let s = 1; s <= 8; s++) {
  advanceToEndOfSeason(w);
  const ms = Object.values(w.matches).filter((m) => m.season === s && COMPETITIONS[m.competitionId]?.kind === 'league');
  const n = ms.length || 1; let sh = 0, sot = 0, xg = 0, g = 0, saves = 0, pass = 0, passC = 0, poss = 0, fouls = 0;
  for (const m of ms) for (const side of ['home', 'away'] as const) { const st = m.stats[side]; sh += st.shots; sot += st.shotsOnTarget; xg += st.xg; g += m.score[side]; saves += st.saves; pass += st.passes; passC += st.passesCompleted; fouls += st.fouls; }
  // average ability by position group among starters
  const avgPos: Record<string, number[]> = {};
  for (const c of Object.values(w.clubs)) for (const p of squadOf(w, c.id)) (avgPos[p.primary] ??= []).push(overall(p));
  const ap = Object.entries(avgPos).map(([k, v]) => `${k}:${(v.reduce((a, b) => a + b, 0) / v.length).toFixed(0)}`).join(' ');
  console.log(`S${s} n=${ms.length} per match: goals ${(g / n).toFixed(2)} shots ${(sh / n).toFixed(1)} SoT ${(sot / n).toFixed(1)} xG ${(xg / n).toFixed(2)} conv/xG ${(g / xg).toFixed(2)} SoT% ${(sot / sh * 100).toFixed(0)} saves ${(saves / n).toFixed(1)} fouls ${(fouls / n).toFixed(1)} | ${ap}`);
}
