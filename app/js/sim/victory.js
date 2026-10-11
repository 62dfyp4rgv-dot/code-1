// Victory paths, standing index, defeat conditions, final report. Victory does not depend on conquest.
import { clamp } from './constants.js';

const rankOf = (arr, i) => arr.slice().sort((a, b) => b - a).indexOf(arr[i]) + 1;
export function initVictory(sim) {
  const st = sim.state, p = st.countries[st.playerId], cs = st.countries;
  const gdps = cs.map((c) => c.econ.gdp);
  st.victory = {
    start: { gdppc: p.econ.gdp / p.pop.total, gdp: p.econ.gdp, gdpRank: rankOf(gdps, st.playerId), poverty: p.econ.poverty, hdi: p.econ.hdi, techs: p.tech.known.length, regions: sim.geo.cRegions[st.playerId].length, milRank: rankOf(cs.map((c) => sim.milPower(c.idx)), st.playerId), inf: influenceScore(sim, st.playerId) },
    paths: {}, standing: 0, history: [], endDay: sim.calendar.dayOf(sim.scenario.start[0] + sim.scenario.years, sim.scenario.start[1], sim.scenario.start[2]), stabWindow: [],
  };
  evaluate(sim);
}
export function influenceScore(sim, i) {
  const st = sim.state, N = sim.geo.N; let s = 0;
  for (let j = 0; j < N; j++) { if (j === i) continue; const o = st.rel.op[j * N + i]; if (o > 25) s += Math.sqrt(st.countries[j].econ.gdp) * (o / 100); }
  for (const o of st.orgs) if (o.members.includes(i)) s += Math.sqrt(o.members.length) * 1.5;
  for (const t of st.treaties) if (t.active && t.parties.includes(i) && t.type !== 'ceasefire') s += 3;
  return s + st.countries[i].dip.credibility * 0.2;
}
export function evaluate(sim) {
  const st = sim.state, V = st.victory, c = st.countries[st.playerId], cs = st.countries, e = c.econ;
  const gdppc = e.gdp / c.pop.total;
  const gdps = cs.map((x) => x.econ.gdp);
  const gdpRank = rankOf(gdps, st.playerId);
  const infs = cs.map((x) => influenceScore(sim, x.idx));
  const infRank = rankOf(infs, st.playerId);
  const techs = cs.map((x) => x.tech.known.length + 3 * x.econ.researchIdx);
  const techRank = rankOf(techs, st.playerId);
  V.stabWindow.push(c.gov.stability); if (V.stabWindow.length > 24) V.stabWindow.shift();
  const stabAvg = V.stabWindow.reduce((a, b) => a + b, 0) / V.stabWindow.length;
  const regionsNow = sim.geo.cRegions[st.playerId].filter((r) => st.reg.ctrl[r] === st.playerId && st.reg.owner[r] === st.playerId).length + sim.controlledBy[st.playerId].filter((r) => st.reg.owner[r] !== st.playerId).length;
  const mk = (id, title, desc, progress, done) => { const old = V.paths[id]; V.paths[id] = { id, title, desc, progress: clamp(progress, 0, 1), done: !!(done || (old && old.done)), doneDay: old && old.done ? old.doneDay : done ? st.day : null }; };
  mk('prosperity', 'National Prosperity', `GDP per head +35% from start, poverty down 20%, development index improved`, Math.min(1, (gdppc / V.start.gdppc - 1) / 0.35) * 0.5 + clamp((1 - e.poverty / Math.max(0.005, V.start.poverty) ) / 0.2, 0, 1) * 0.3 + (e.hdi > V.start.hdi ? 0.2 : 0),
    gdppc >= V.start.gdppc * 1.35 && e.poverty <= V.start.poverty * 0.8 && e.hdi > V.start.hdi);
  mk('economic', 'Economic Leadership', V.start.gdpRank <= 3 ? `Remain top-3 and grow world share 15%` : `Rise ${Math.min(3, V.start.gdpRank - 1)} places in GDP rank or reach top 3`,
    V.start.gdpRank <= 3 ? clamp(((e.gdp / gdps.reduce((a, b) => a + b, 0)) / (V.start.gdp / V.startWorld || 1) - 1) / 0.15, 0, 1) : clamp((V.start.gdpRank - gdpRank) / Math.min(3, V.start.gdpRank - 1), 0, 1),
    V.start.gdpRank <= 3 ? gdpRank <= 3 && (e.gdp / gdps.reduce((a, b) => a + b, 0)) >= (V.start.gdp / (V.startWorld || V.start.gdp)) * 1.15 : (gdpRank <= 3 || V.start.gdpRank - gdpRank >= Math.min(3, V.start.gdpRank - 1)));
  mk('diplomatic', 'Diplomatic Influence', 'Reach the top 5 in global influence, or double your influence score', clamp(Math.max((6 - infRank) / 5, (infs[st.playerId] / V.start.inf - 1)), 0, 1), infRank <= 5 || infs[st.playerId] >= V.start.inf * 2);
  mk('scientific', 'Scientific Advancement', 'Master 12 more technologies or reach the global top 3 in science', clamp(Math.max((c.tech.known.length - V.start.techs) / 12, (4 - techRank) / 3), 0, 1), c.tech.known.length - V.start.techs >= 12 || techRank <= 3);
  mk('stability', 'Stability & Welfare', 'Sustain stability above 70% for two years with poverty cut by 40%', clamp(stabAvg / 0.7, 0, 1) * 0.5 + clamp((1 - e.poverty / Math.max(0.005, V.start.poverty)) / 0.4, 0, 1) * 0.5, V.stabWindow.length >= 24 && stabAvg >= 0.7 && e.poverty <= V.start.poverty * 0.6 && c.gov.collapses === 0);
  mk('security', 'Security & Strength', 'Keep every region, end the year at peace, and strengthen the armed forces', (regionsNow >= V.start.regions ? 0.5 : 0) + (!sim.atWar(st.playerId) ? 0.25 : 0) + (rankOf(cs.map((x) => sim.milPower(x.idx)), st.playerId) < V.start.milRank ? 0.25 : 0.1), regionsNow >= V.start.regions && !sim.atWar(st.playerId) && sim.occupiedShare(st.playerId) === 0 && rankOf(cs.map((x) => sim.milPower(x.idx)), st.playerId) < V.start.milRank);
  // standing index: percentile blend
  const pct = (arr, v) => 100 * arr.filter((x) => x <= v).length / arr.length;
  V.standing = Math.round(0.2 * pct(cs.map((x) => x.econ.gdp / x.pop.total), gdppc) + 0.15 * pct(gdps, e.gdp) + 0.15 * pct(infs, infs[st.playerId]) + 0.15 * pct(techs, techs[st.playerId]) + 0.2 * pct(cs.map((x) => x.gov.stability * 0.6 + (1 - x.econ.poverty) * 0.4), c.gov.stability * 0.6 + (1 - e.poverty) * 0.4) + 0.15 * pct(cs.map((x) => x.econ.hdi), e.hdi));
  V.counts = Object.values(V.paths).filter((p) => p.done).length;
}
export function monthlyStep(sim, day) {
  const st = sim.state, V = st.victory; if (!V) return;
  if (V.startWorld === undefined) V.startWorld = st.countries.reduce((s, c) => s + c.econ.gdp, 0);
  evaluate(sim);
  if (st.ended) return;
  const c = st.countries[st.playerId];
  if (c.flags.capitulated) return;
  if (day >= V.endDay) finish(sim, 'time');
}
export function yearlyStep(sim, day) {
  const V = sim.state.victory; if (!V) return; V.history.push({ day, standing: V.standing, counts: V.counts });
}
export function gradeOf(V) { return V.counts >= 4 ? 'Triumph' : V.counts >= 2 ? 'Success' : V.counts >= 1 ? 'Qualified success' : 'Muddled through'; }
export function finish(sim, reason) {
  const st = sim.state, V = st.victory; evaluate(sim);
  V.grade = gradeOf(V);
  sim.endGame(reason);
  if (st.ended) st.ended.final = true;
}
