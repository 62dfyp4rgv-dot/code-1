// Time series for charts and postgame summaries. Monthly series for the player; yearly series for everyone.
export const SERIES = ['gdp', 'gdppc', 'growth', 'infl', 'unemp', 'debt', 'approval', 'stability', 'pop', 'mil', 'poverty', 'hdi'];
export function initStats(sim) {
  sim.state.stats = {
    monthly: Object.fromEntries(SERIES.map((k) => [k, []])),
    yearly: {},
    world: { gdp: [], temp: [], emis: [], oil: [], gas: [], food: [], minerals: [] },
    startDay: sim.state.day,
  };
}
function row(sim, c) {
  const e = c.econ;
  return {
    gdp: e.gdp,
    gdppc: e.gdp / c.pop.total,
    growth: e.growth,
    infl: e.infl,
    unemp: e.unemp,
    debt: e.debtRatio ?? 0,
    approval: c.gov.approval,
    stability: c.gov.stability,
    pop: c.pop.total,
    mil: sim.milPower(c.idx),
    poverty: e.poverty,
    hdi: e.hdi,
  };
}
export function monthlyStep(sim, day) {
  const st = sim.state,
    S = st.stats;
  if (!S) return;
  const r = row(sim, st.countries[st.playerId]);
  for (const k of SERIES) {
    S.monthly[k].push(+r[k].toPrecision(5));
    if (S.monthly[k].length > 360) S.monthly[k].shift();
  }
  const m = (day / 30.4) | 0;
  if (sim.calendar.ymd(day).m === 1 || S.world.gdp.length === 0) {
    for (const c of st.countries) {
      const y = S.yearly[c.idx] || (S.yearly[c.idx] = Object.fromEntries(SERIES.map((k) => [k, []])));
      const rr = row(sim, c);
      for (const k of SERIES) {
        y[k].push(+rr[k].toPrecision(4));
        if (y[k].length > 40) y[k].shift();
      }
    }
    S.world.gdp.push(+st.countries.reduce((s, c) => s + c.econ.gdp, 0).toFixed(0));
    S.world.temp.push(+st.world.temp.toFixed(3));
    S.world.emis.push(Math.round(st.world.emis || 0));
    ['food', 'oil', 'gas', 'minerals'].forEach((n, i) => S.world[n].push(+st.prices[i].toFixed(3)));
  }
}
