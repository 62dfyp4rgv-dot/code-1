// World AI: layered decision-making with limited administrative capacity (political capital + influence + intel points).
//  1. Strategic layer: threat/opportunity assessment from perceived data -> goals & archetype-weighted utilities.
//  2. Economic layer: fiscal/monetary floor, budget composition, policy steering, research choice.
//  3. Diplomatic layer: alliances against threats, trade partners, accession, sanctions, aid, peace.
//  4. Operational layer: war declaration utility, stance/objective per front (deployment is automatic in war.js), peace offers.
// All actions go through sim.exec() - the same commands and costs as the human player.
import { clamp, BUDGET_CATS } from '../sim/constants.js';
import { buildView } from './perception.js';
import { manageEconomy } from './econ.js';
import { manageDiplomacy } from './diplo.js';
import { manageWar, manageMilitaryPosture } from './war.js';
import { manageIntel } from './spy.js';
import { policyIdeology, ideologyDistance } from '../sim/politics.js';

export function initAI(sim) {
  const rng = sim.rng;
  const geo = sim.geo;
  for (const c of sim.state.countries) {
    const row = geo.rows[c.idx];
    const dev = c.dev0;
    const gdpRank = sim.state.countries.filter((x) => x.econ.gdp > c.econ.gdp).length;
    const power = 1 - gdpRank / geo.N;
    const dem = c.gov.dem / 100;
    c.ai = {
      archetype:
        dem > 0.6
          ? power > 0.85
            ? 'guardian'
            : 'trader'
          : c.gov.type === 'military'
            ? 'survivor'
            : power > 0.9
              ? 'rival_power'
              : c.res0.oil > 1
                ? 'rentier'
                : 'regional',
      w: {
        security: clamp(0.4 + 0.3 * (1 - dem) + rng.range(-0.1, 0.1) + 0.1 * c.mil.nukes, 0.1, 1),
        prosperity: clamp(0.5 + 0.2 * dem + rng.range(-0.1, 0.1), 0.2, 1),
        influence: clamp(0.2 + 0.6 * power + rng.range(-0.1, 0.1), 0.05, 1),
        ideology: clamp(0.2 + 0.4 * (1 - dem) + rng.range(-0.1, 0.1), 0.05, 0.9),
      },
      risk: clamp(0.25 + 0.3 * (1 - dem) + rng.range(-0.1, 0.2), 0.05, 0.9),
      horizon: 12 + Math.round(24 * (c.gov.type === 'one_party' ? 1 : 0.5)),
      lastWar: -9999,
      plan: null,
      goal: 'develop',
      log: [],
      threat: 0.2,
      topThreat: null,
    };
  }
}

export function monthlyStep(sim, day) {
  for (const _ of monthlyGen(sim, day)) {
    /* run to completion */
  }
}
export function* monthlyGen(sim, day) {
  const st = sim.state;
  const month = (day / 30) | 0;
  sim._bigPowers = new Set(
    st.countries
      .slice()
      .sort((a, b) => b.econ.gdp - a.econ.gdp)
      .slice(0, 30)
      .map((c) => c.idx),
  );
  for (const c of st.countries) {
    if (c.idx === st.playerId && !c.autoAI) continue;
    // administrative capacity: major powers and belligerents think every month, others every third month (staggered)
    const atWar = sim.atWar(c.idx);
    const turn = atWar || sim._bigPowers.has(c.idx) || (month + c.idx) % 3 === 0;
    let view = null;
    if (turn) {
      view = buildView(sim, c.idx);
      assess(sim, c, view);
    }
    manageEconomy(sim, c, view);
    if (turn) {
      manageMilitaryPosture(sim, c, view);
      if ((month + c.idx) % 2 === 0 || atWar) manageDiplomacy(sim, c, view);
      manageWar(sim, c, view);
      if ((month + c.idx) % 2 === 1) manageIntel(sim, c, view);
    }
    if (c.dip.pending.length) answerCalls(sim, c);
    if (c.idx % 12 === 11) yield;
  }
}
function answerCalls(sim, c) {
  for (const p of c.dip.pending.slice())
    if (p.kind === 'call')
      sim.exec({
        type: 'respondCall',
        actor: c.idx,
        war: p.war,
        join:
          sim.callWillingness(
            c.idx,
            sim.state.wars.find((w) => w.id === p.war),
            { ally: c.idx, side: p.side, principal: p.principal },
          ) > 0,
      });
}

// strategic assessment -> c.ai.threat map & goal
function assess(sim, c, view) {
  const A = c.ai;
  let threat = 0,
    top = null,
    topScore = 0;
  for (const o of view.others) {
    const ratio = o.mil / Math.max(1, view.self.mil);
    const prox = o.landNeighbor ? 1 : o.neighbor ? 0.6 : o.dist < 4000 ? 0.25 : 0.05;
    let t =
      prox *
      (0.18 * Math.min(2.5, ratio) * (0.4 + o.rivalry / 50) +
        o.rivalry / 100 +
        (o.atWar ? 1 : 0) +
        (o.iClaimedByThem ? 0.6 : 0) +
        (o.theirOpinion < -30 ? 0.2 : 0)) *
      (1 - 0.5 * (o.ally ? 1 : 0));
    if (o.nukes && o.rivalry > 30) t += 0.2;
    if (t > topScore) {
      topScore = t;
      top = o;
    }
    threat = Math.max(threat, t);
  }
  A.threat = clamp(threat, 0, 2);
  A.topThreat = top ? top.idx : null;
  const atWar = sim.atWar(c.idx);
  A.goal = atWar
    ? 'win_war'
    : A.threat > 0.8
      ? 'secure'
      : c.econ.util < 0.95 || c.econ.infl > 0.07
        ? 'stabilise_economy'
        : A.w.influence > 0.6
          ? 'expand_influence'
          : 'develop';
}

export function shiftPolicyToward(sim, c, ideo, strength) {
  const t = c.target;
  const cur = policyIdeology(c);
  const dEcon = (ideo.econ - cur.econ) * strength,
    dSoc = (ideo.social - cur.social) * strength,
    dNat = (ideo.nation - cur.nation) * strength;
  // econ: right = lower tax/welfare/regulation; social: conservative = surveillance up, press down, immigration down; nation: tariff up, immigration down
  t.taxRate = clamp(t.taxRate - 0.03 * dEcon, 0.08, 0.5);
  t.regulation = clamp(t.regulation - 0.15 * dEcon, 0, 1);
  t.budget.welfare = Math.max(0.02, t.budget.welfare - 0.04 * dEcon);
  t.surveillance = clamp(t.surveillance + 0.12 * dSoc, 0, 1);
  t.pressFreedom = clamp(t.pressFreedom - 0.1 * dSoc * (c.gov.dem > 55 ? 0.5 : 1), 0, 1);
  t.immigration = clamp(t.immigration - 0.12 * dSoc - 0.12 * dNat, 0, 1);
  t.tariff = clamp(t.tariff + 0.03 * dNat, 0, 0.35);
  let s = 0;
  for (const k of BUDGET_CATS) s += t.budget[k];
  for (const k of BUDGET_CATS) t.budget[k] /= s;
}

// Baseline fiscal rule (the AI's economic floor): counter-cyclical within a sustainability constraint.
export function fiscalRule(sim, c) {
  const e = c.econ,
    t = c.target;
  const defR = e.deficit / Math.max(1, e.gdp);
  const structural = defR - 0.6 * Math.max(0, 1 - e.util); // cyclical part of the deficit is not a reason to tighten
  const limit = 0.035 + 0.025 * c.dev0 + 0.02 * e.fxDepth;
  const debtCap = 0.9 + 2.6 * e.fxDepth;
  if (e.marketClosed || (structural > limit * 1.3 && e.util > 0.93) || (e.debtRatio > debtCap && e.risk > 0.03 && e.util > 0.985)) {
    t.taxRate = clamp(t.taxRate + 0.002, 0.08, 0.5);
    t.spendRate = clamp(t.spendRate - 0.002, 0.1, 0.62);
  } else if (e.util < 0.96 && structural < limit * 1.5) {
    t.spendRate = clamp(t.spendRate + 0.002, 0.1, 0.62);
    t.taxRate = clamp(t.taxRate - 0.001, 0.08, 0.5);
  } else if (
    structural < limit * 0.35 &&
    e.debtRatio < debtCap * 0.6 &&
    e.util < 1.03 &&
    c.gov.type !== 'one_party' &&
    c.gov.type !== 'military'
  ) {
    // fiscal space tends to be spent: governments with low deficits and moderate debt expand programmes (keeps debt ratios from deflating away)
    t.spendRate = clamp(t.spendRate + 0.0008, 0.1, 0.62);
    t.taxRate = clamp(t.taxRate - 0.0003, 0.08, 0.5);
  } else if (e.util > 1.035 || (structural > limit && e.util > 1.0)) {
    t.spendRate = clamp(t.spendRate - 0.0015, 0.1, 0.62);
    t.taxRate = clamp(t.taxRate + 0.001, 0.08, 0.5);
  }
}
