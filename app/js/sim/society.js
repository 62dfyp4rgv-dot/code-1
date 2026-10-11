// Society: demography (3 cohorts), migration, health/education/welfare services, poverty & inequality, food/water stress, climate.
import { clamp, COM } from './constants.js';
import { modv } from './mods.js';
import { hdiOf } from './economy.js';

export function initCohorts(c) {
  const p = c.pop;
  p.coh = [p.total * p.youth, p.total * p.working, p.total * p.elder];
}
export function demographyStep(sim, c) {
  const p = c.pop,
    e = c.econ;
  const h = p.health;
  const hf = 1.5 - 0.7 * h;
  const famine = e.shortage[COM.food];
  const [y, w, el] = p.coh;
  const tot = y + w + el;
  const cbr = p.fertility * 0.0058 * (w / tot / 0.62) * (1 - 0.15 * famine);
  const births = (tot * cbr) / 12;
  const my = 0.0008 * hf + 0.02 * famine * 0.2,
    mw = 0.0036 * hf + 0.03 * famine * 0.2,
    me = 0.045 * hf + 0.04 * famine * 0.2;
  const epi = sim.epidemicMortality ? sim.epidemicMortality(c) : 0;
  const dy = (y * (my + epi * 0.2)) / 12,
    dw = (w * (mw + epi * 0.5)) / 12,
    de = (el * (me + epi * 2)) / 12;
  const y2g = y / 15 / 12,
    w2e = w / 50 / 12;
  p.coh[0] = Math.max(0.0001, y + births - y2g - dy);
  p.coh[1] = Math.max(0.0001, w + y2g - w2e - dw + p.migPending / 12);
  p.coh[2] = Math.max(0.0001, el + w2e - de);
  const nt = p.coh[0] + p.coh[1] + p.coh[2];
  p.births = births * 12;
  p.deaths = (dy + dw + de) * 12;
  p.growth = ((nt - tot) / tot) * 12;
  p.total = nt;
  p.youth = p.coh[0] / nt;
  p.working = p.coh[1] / nt;
  p.elder = p.coh[2] / nt;
  e.lf = p.coh[1] * p.partic * (1 + 0.0 * c.policy.immigration);
  e.emp = e.lf * (1 - e.unemp);
  p.deathsEpi = (p.deathsEpi || 0) + (el * epi * 2 + w * epi * 0.5 + y * epi * 0.2) / 12;
}
// yearly: fertility transition, migration pools (net sums to zero)
export function yearlyMigration(sim) {
  const cs = sim.state.countries;
  const n = cs.length;
  const attract = new Float64Array(n),
    outf = new Float64Array(n),
    share = new Float64Array(n);
  let totOut = 0,
    totShare = 0;
  for (let i = 0; i < n; i++) {
    const c = cs[i],
      e = c.econ;
    const pc = e.gdp / c.pop.total;
    attract[i] = Math.log(Math.max(0.2, pc)) + 1.4 * c.gov.stability - 2.5 * e.warLoss + 0.8 * c.policy.immigration - 1.0 * c.gov.unrest;
  }
  const mean = attract.reduce((a, b) => a + b, 0) / n;
  for (let i = 0; i < n; i++) {
    const c = cs[i];
    outf[i] = c.pop.coh[1] * (0.0012 + 0.0016 * Math.max(0, mean - attract[i]) + 0.01 * c.econ.warLoss) * (1 - 0.3 * c.policy.surveillance);
    totOut += outf[i];
    share[i] = Math.sqrt(c.pop.total) * Math.exp(1.1 * attract[i]) * (0.15 + c.policy.immigration) * (c.gov.stability > 0.25 ? 1 : 0.3);
    totShare += share[i];
  }
  for (let i = 0; i < n; i++) {
    const c = cs[i];
    const inflow = (totOut * share[i]) / totShare;
    c.pop.migNet = inflow - outf[i]; // millions per year; sums to ~0 across the world
    c.pop.migPending = c.pop.migNet;
    c.pop.migrationRate = c.pop.migNet / c.pop.total;
  }
}
export function servicesStep(sim, c) {
  const e = c.econ,
    p = c.pop,
    sp = c.spendCat;
  if (!sp) return;
  const rel = (k) => clamp(sp[k] / e.gdp / Math.max(1e-6, e.fiscal0[k]), 0.2, 3);
  const growth = e.gdp / p.total / (e.gdp0 / (c.rowPop0 || (c.rowPop0 = sim.geo.rows[c.idx].pop_m)));
  const rh = rel('health'),
    re = rel('education'),
    rw = rel('welfare');
  e.healthLvl += 0.05 * (rh - e.healthLvl);
  e.eduLvl += 0.03 * (re - e.eduLvl);
  e.welfareLvl += 0.08 * (rw - e.welfareLvl);
  const hT = clamp(
    p.health0 + 0.12 * Math.log(rh) + 0.06 * Math.log(Math.max(0.5, growth)) - 0.25 * Math.max(0, e.shortage[COM.food] - 0.05),
    0.15,
    0.99,
  );
  p.health = clamp(p.health + (0.02 / 12) * (hT - p.health) * 12 * 0.4 + modv(c, 'health.rate') / 12, 0.1, 0.99);
  const eT = clamp(p.edu0 + 0.1 * Math.log(re) + 0.05 * Math.log(Math.max(0.5, growth)), 0.15, 0.99);
  p.edu = clamp(p.edu + 0.01 * (eT - p.edu) + modv(c, 'edu.rate') / 12, 0.1, 0.99);
  // inequality & poverty
  const gT = clamp(
    e.gini0 +
      0.1 * (1 - Math.min(1.5, e.welfareLvl)) * 0.6 -
      0.05 * (c.policy.regulation - 0.5) +
      0.25 * (e.Y[7] / e.gdp - e.techShare0) +
      0.1 * Math.max(0, e.unemp - e.uNat),
    0.2,
    0.7,
  );
  e.gini += 0.02 * (gT - e.gini);
  const dev = e.gdp / p.total / (e.gdp / p.total + 15);
  const povT = clamp(
    0.5 * Math.pow(1 - dev, 3.2) + 0.03 + 0.4 * (e.gini - 0.35) * (1 - dev) - 0.12 * (e.welfareLvl - 1) + 0.15 * e.unemp,
    0.005,
    0.85,
  );
  e.poverty += 0.04 * (povT - e.poverty);
  p.fertility += (((0.006 * (Math.max(0.8, 1.3 + 4.5 * Math.pow(1 - dev, 1.5)) - p.fertility)) / 12) * 12 * 0.2) / 12;
  e.hdi = hdiOf(c);
  // drought random walk (water stress)
  e.drought = clamp(
    e.drought * 0.9 + (sim.rng.next() < 0.04 ? sim.rng.range(0.3, 1) : 0) + 0.1 * Math.max(0, sim.state.world.temp - 1.5) * 0.05,
    0,
    1,
  );
  e.climateDmg = clamp(
    0.012 * Math.max(0, sim.state.world.temp - 1.2) * (0.6 + 0.8 * e.waterStress) * (1 - 0.7 * modv(c, 'disaster.resil') * 0.5),
    0,
    0.2,
  );
}
export function climateStep(sim) {
  const st = sim.state;
  let E = 0;
  for (const c of st.countries) E += c.econ.emis;
  st.world.emis = E;
  st.world.temp += ((6.8e-7 * E) / 12) * 1.0;
  st.world.cumEmis += E / 12;
}
