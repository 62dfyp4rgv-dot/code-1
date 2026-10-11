// Peace: terms, willingness (pure function of public information), offers to a human, settlements, client states.
import { bump } from './achievements.js';
import { sideOf, atWar, endWarFor, relocateStranded } from './war.js';

// ---------------------------------------------------------------------------------------------------- peace
const REGION_COST = (sim, w, ri) => {
  const c = sim.state.countries[sim.state.reg.owner[ri]];
  const total = sim.geo.cRegions[sim.state.reg.owner[ri]].length;
  return 12 + 70 * sim.geo.regions[ri].popW * (ri === sim.geo.capitalRegion[sim.state.reg.owner[ri]] ? 2 : 1);
};
export function termCost(sim, w, term) {
  switch (term.kind) {
    case 'cede':
      return REGION_COST(sim, w, term.region);
    case 'reparations':
      return (6 * term.pct * 100 * Math.min(10, term.years)) / 5;
    case 'demilitarize':
      return 18;
    case 'puppet':
      return 90;
    case 'ceasefire':
    case 'status_quo':
      return 0;
    default:
      return 10;
  }
}
// How willing is `target` to accept `terms` from `proposer`? Pure function of public/own information (used by UI & AI).
export function evaluatePeace(sim, w, proposer, target, terms) {
  const sp = sideOf(w, proposer),
    st0 = sideOf(w, target);
  if (!sp || !st0 || sp === st0) return { accept: false, margin: -99, reasons: ['not opposing belligerents'] };
  const adv = w.score[sp] - w.score[st0]; // proposer's advantage in [-150,150]
  const c = sim.state.countries[target];
  const cost = terms.reduce((s, t) => s + termCost(sim, w, t), 0);
  const ex = c.mil.exhaustion;
  const stability = c.gov.stability;
  const will = Math.max(0, adv) * 0.85 + 55 * ex + 18 * (1 - stability) + (cost === 0 ? 8 : 0) - (adv < 0 ? 0 : 0);
  const margin = will - cost - (cost > 0 ? 6 : 0);
  const reasons = [`war score advantage ${adv.toFixed(0)}`, `exhaustion ${(ex * 100).toFixed(0)}%`, `terms cost ${cost.toFixed(0)}`];
  return { accept: margin >= 0, margin, cost, will, advantage: adv, reasons };
}
// Peace offers to a human are never imposed: the offer is parked on the player's diplomacy record and answered via the `answerOffer` command.
export function offerPeaceToPlayer(sim, w, proposer, target, terms, ev) {
  const offers = sim.state.countries[target].dip.offers;
  if (offers.some((o) => o.kind === 'peace' && o.war === w.id && o.from === proposer)) return { ok: true, offered: true, eval: ev };
  const offer = {
    id: sim.state.nextId++,
    kind: 'peace',
    war: w.id,
    from: proposer,
    terms,
    expires: sim.state.day + 45,
    day: sim.state.day,
  };
  offers.push(offer);
  sim.emit('peaceOffer', offer);
  sim.log(target, 'peace', `${sim.state.countries[proposer].name} offers terms to end the ${w.name}`, { war: w.id }, 'high');
  return { ok: true, offered: true, eval: ev };
}
export function pruneOffers(sim, day) {
  for (const c of sim.state.countries)
    if (c.dip.offers.length)
      c.dip.offers = c.dip.offers.filter((o) => o.expires > day && sim.state.wars.some((w) => w.id === o.war && w.active));
}
export function proposePeace(sim, w, proposer, target, terms, opts = {}) {
  const ev = evaluatePeace(sim, w, proposer, target, terms);
  if (!ev.accept && !opts.force) return { ok: false, reason: 'rejected', eval: ev };
  if (target === sim.state.playerId && proposer !== sim.state.playerId && !opts.force && !sim.state.countries[target].autoAI)
    return offerPeaceToPlayer(sim, w, proposer, target, terms, ev);
  applyTerms(sim, w, proposer, target, terms);
  for (const side of [proposer, target]) {
    /* per-pair peace */
  }
  // both leave the war with each other: if the pair are the leaders end the war for everyone
  const leadersPair = w.leaders.includes(proposer) && w.leaders.includes(target);
  if (leadersPair) {
    for (const x of [...w.attackers, ...w.defenders]) {
      if (x !== proposer && x !== target)
        sim.log(x, 'peace', `${sim.state.countries[x].name}: war ended by leaders' settlement`, {}, 'low');
    }
    w.active = false;
    w.end = sim.state.day;
    w.endReason = 'negotiated peace';
    for (const x of [...w.attackers, ...w.defenders]) {
      sim.state.countries[x].mil.mobilizationTarget = atWar(sim, x) ? 1 : 0;
    }
  } else {
    endWarFor(sim, w, target, 'separate peace');
    if (!w.attackers.includes(proposer) && !w.defenders.includes(proposer)) {
      /* ended */
    }
  }
  for (const pp of [proposer, target])
    if (pp === sim.state.playerId) {
      bump(sim, 'peace');
      if (!Object.keys(sim.state.reg.owner).some((r) => sim.state.reg.owner[r] === pp && sim.state.reg.ctrl[r] !== pp))
        bump(sim, 'defended');
    }
  if (!w.active) {
    sim.log(proposer, 'peace', `${w.name} ends: negotiated peace`, { war: w.id }, 'high');
    sim.emit('war', { type: 'ended', war: w.id });
  }
  for (const x of [proposer, target]) sim.state.countries[x].mil.mobilizationTarget = atWar(sim, x) ? 1 : 0;
  sim.state.treaties.push({
    id: sim.state.nextId++,
    type: 'ceasefire',
    parties: [proposer, target],
    start: sim.state.day,
    end: sim.state.day + 365 * 4,
    active: true,
  });
  sim.rel(proposer, target, 10, 5);
  sim.rel(target, proposer, 5, 0);
  relocateStranded(sim);
  return { ok: true, eval: ev };
}
export function applyTerms(sim, w, winner, loser, terms) {
  const st = sim.state,
    reg = st.reg;
  for (const t of terms) {
    if (t.kind === 'cede') {
      if (reg.owner[t.region] === loser) {
        reg.owner[t.region] = t.to ?? winner;
        reg.ctrl[t.region] = t.to ?? winner;
      }
    } else if (t.kind === 'reparations') {
      st.countries[loser].reparations = { to: winner, pct: t.pct, until: st.day + 365 * t.years };
    } else if (t.kind === 'puppet') {
      const L = st.countries[loser];
      L.dip.vassalOf = winner;
      L.reparations = { to: winner, pct: 0.015, until: st.day + 365 * 50 };
      sim._allyCache?.clear?.();
      sim.log(loser, 'diplomacy', `${L.name} becomes a client state of ${st.countries[winner].name}`, { by: winner }, 'high');
    } else if (t.kind === 'demilitarize') {
      const m = st.countries[loser].mil;
      m.demilUntil = st.day + 365 * 5;
      m.mobilizationTarget = 0;
      for (const f of sim.forcesOf[loser]) f.size *= 0.7;
      m.active *= 0.75;
    }
  }
  // a ceasefire freezes the lines: occupation persists (and the truce forbids new fighting); every other settlement returns occupied land to its owners (unless ceded above)
  const freeze = terms.some((t) => t.kind === 'ceasefire' || t.kind === 'status_quo');
  for (let r = 0; r < reg.owner.length; r++) {
    if (
      !freeze &&
      reg.ctrl[r] !== reg.owner[r] &&
      ((reg.ctrl[r] === winner && reg.owner[r] === loser) || (reg.ctrl[r] === loser && reg.owner[r] === winner))
    )
      reg.ctrl[r] = reg.owner[r];
    reg.contestProg[r] = 0;
    reg.contestBy[r] = -1;
  }
  sim.rebuildOwnedRegions();
}
