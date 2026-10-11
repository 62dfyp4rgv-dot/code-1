// AI operational/strategic military layer: posture, force raising, war declaration utility, fronts and peace.
import { clamp } from '../sim/constants.js';
import { alliedPowerOf } from './perception.js';

// Air and naval tasking: counter-air at the front, strategic bombing of high-value targets in range, blockade of enemy ports.
function manageAirNaval(sim, c, view) {
  const g = sim.geo,
    st = sim.state,
    reg = st.reg;
  const enemies = view.enemies;
  const wings = sim.forcesOf[c.idx].filter((f) => f.branch === 'air' && f.dest < 0 && f.order.kind !== 'locked');
  const fleets = sim.forcesOf[c.idx].filter((f) => f.branch === 'sea' && f.dest < 0 && f.order.kind !== 'locked');
  // front regions of ours (adjacent to an enemy-controlled region)
  const front = [];
  for (const r of sim.controlledBy[c.idx]) if (g.regions[r].adj.some((a) => enemies.has(reg.ctrl[a.to]))) front.push(r);
  if (wings.length && front.length) {
    const hub = front.reduce((b, r) => (g.regions[r].popW + (g.regions[r].port ? 0.02 : 0) > g.regions[b].popW ? r : b), front[0]);
    for (const f of wings) {
      if (f.type === 'fighter') {
        if (f.loc !== hub && f.order.kind !== 'rest' && !f.inCombat)
          sim.exec({ type: 'moveForce', actor: c.idx, force: f.id, region: hub });
      } else if (f.order.kind !== 'bomb') {
        // strike wing: best enemy region within two hops of the hub by value (population, capital, devastation headroom)
        let best = -1,
          bv = -1;
        const seen = new Set([hub]);
        let fr = [hub];
        for (let h = 0; h < 2; h++) {
          const nf = [];
          for (const u of fr)
            for (const a of g.regions[u].adj)
              if (!seen.has(a.to)) {
                seen.add(a.to);
                nf.push(a.to);
                const own = reg.owner[a.to],
                  ctl = reg.ctrl[a.to];
                if (!enemies.has(ctl) && !enemies.has(own)) continue;
                const v =
                  g.regions[a.to].popW * 10 + (a.to === g.capitalRegion[own] ? 6 : 0) + (g.regions[a.to].port ? 1 : 0) - 8 * reg.dev[a.to];
                if (v > bv) {
                  bv = v;
                  best = a.to;
                }
              }
          fr = nf;
        }
        if (best >= 0) {
          if (f.loc !== hub) sim.exec({ type: 'moveForce', actor: c.idx, force: f.id, region: hub });
          sim.exec({ type: 'setOrder', actor: c.idx, force: f.id, kind: 'bomb', target: best });
        }
      }
    }
  }
  if (fleets.length) {
    // blockade the sea zone beside the enemy's busiest port within reach
    let bestSea = -1,
      bv = 0;
    for (const r of g.regions) {
      const ctl = reg.ctrl[r.idx],
        own = reg.owner[r.idx];
      if (!enemies.has(own) || ctl !== own || !r.port) continue;
      for (const co of r.coast) {
        const v = r.port * co.n;
        if (v > bv) {
          bv = v;
          bestSea = co.sea;
        }
      }
    }
    if (bestSea >= 0)
      for (const f of fleets.filter((x) => x.type !== 'carrier').slice(0, Math.ceil(fleets.length * 0.7))) {
        if (f.loc === bestSea) {
          if (f.order.kind !== 'blockade') sim.exec({ type: 'setOrder', actor: c.idx, force: f.id, kind: 'blockade', target: -1 });
        } else if (sim.exec({ type: 'moveForce', actor: c.idx, force: f.id, region: bestSea }).ok) f.afterMoveOrder = 'blockade';
      }
  }
}
export function manageMilitaryPosture(sim, c, view) {
  const m = c.mil,
    A = c.ai;
  const atWar = sim.atWar(c.idx);
  // doctrine suited to circumstances (rare, PC-gated)
  if (!m.doctrineSince || sim.state.day - m.doctrineSince > 730) {
    const want =
      A.threat > 0.9 && A.w.security > 0.5 && !atWar
        ? c.mt > 0.9
          ? 'network'
          : 'defensive'
        : c.mt > 1.0 && A.risk > 0.5
          ? 'maneuver'
          : m.doctrine;
    if (want !== m.doctrine && c.gov.pc > 25) sim.exec({ type: 'setDoctrine', actor: c.idx, doctrine: want });
  }
  // mobilisation level follows threat
  const want = atWar ? (A.threat > 1.2 || c.econ.warLoss > 0.1 ? 2 : 1) : A.threat > 1.3 ? 1 : 0;
  if (want !== (m.mobilizationTarget || 0) && (want > (m.mobilizationTarget || 0) ? c.gov.pc > 10 : true))
    sim.exec({ type: 'mobilize', actor: c.idx, level: want });
  // set stance per enemy
  if (atWar)
    for (const e of view.enemies) {
      const o = view.byIdx(e);
      if (!o) continue;
      const ratio = view.self.mil / Math.max(1, o.mil);
      const initiator = sim.state.wars.some((w) => w.active && w.attackers.includes(c.idx) && w.defenders.includes(e)); // the side that started the war presses the offensive
      const stance =
        c.mil.exhaustion > 0.75 || ratio < 0.7
          ? 'defend'
          : ratio > 1.25 || (initiator && ratio > 0.9)
            ? 'attack'
            : m.posture[e]?.stance || 'defend';
      sim.exec({ type: 'setStance', actor: c.idx, enemy: e, stance });
    }
  if (atWar) manageAirNaval(sim, c, view);
  // raise new formations when badly outnumbered and funded
  if (atWar && c.gov.pc > 20 && m.reserve > 40 && sim.rng.chance(0.15)) sim.exec({ type: 'raiseForce', actor: c.idx, unit: 'inf' });
}

export function manageWar(sim, c, view) {
  const A = c.ai,
    st = sim.state;
  considerNuclear(sim, c, view);
  // ---------------- peace
  for (const w of view.wars) {
    const side = w.attackers.includes(c.idx) ? 'a' : w.defenders.includes(c.idx) ? 'd' : null;
    if (!side) continue;
    const foes = side === 'a' ? w.defenders : w.attackers;
    const mine = w.score[side],
      theirs = w.score[side === 'a' ? 'd' : 'a'];
    const adv = mine - theirs;
    const duration = (st.day - w.start) / 30;
    if (duration < 3) continue;
    const wantsPeace =
      (c.mil.exhaustion > 0.6 && duration > 6) ||
      (adv < -35 && duration > 8) ||
      (adv > 25 && duration > 14) ||
      (adv > -5 && duration > 36 && c.mil.exhaustion > 0.4);
    if (!wantsPeace) continue;
    for (const f of foes) {
      if (!w.leaders.includes(c.idx) && !w.leaders.includes(f)) continue;
      // terms: winners ask for regions they hold (cost-limited), losers ask for status quo ceasefire
      const terms = [];
      if (adv > 15) {
        const held = [];
        for (let r = 0; r < st.reg.owner.length; r++)
          if (st.reg.ctrl[r] === c.idx && st.reg.owner[r] === f && r !== sim.geo.capitalRegion[f]) held.push(r);
        held.sort((x, y) => sim.geo.regions[y].popW - sim.geo.regions[x].popW);
        for (const r of held.slice(0, 2)) terms.push({ kind: 'cede', region: r, to: c.idx });
        if (adv > 40) terms.push({ kind: 'reparations', pct: 0.005, years: 3 });
        if (adv > 60 && sim.geo.cRegions[f].length <= 2 && c.dip.vassalOf == null && !view.byIdx(f)?.vassal) terms.push({ kind: 'puppet' });
      }
      if (!terms.length) terms.push({ kind: 'ceasefire' });
      let r = sim.exec({ type: 'proposePeace', actor: c.idx, war: w.id, target: f, terms });
      if ((!r.ok && terms.length > 1) || (!r.ok && terms[0].kind !== 'ceasefire'))
        r = sim.exec({ type: 'proposePeace', actor: c.idx, war: w.id, target: f, terms: [{ kind: 'ceasefire' }] });
      if (r.ok) break;
    }
  }
  // ---------------- war declaration
  if (sim.atWar(c.idx) || c.gov.pc < 30 || st.day - A.lastWar < 720 || c.mil.readiness < 0.5 || c.mil.exhaustion > 0.3) return;
  const aggression =
    sim.state.settings.aiAggression *
    (0.4 + A.risk) *
    (0.5 + A.w.security * 0.4) *
    (c.gov.type === 'lib_dem' ? 0.3 : c.gov.type === 'flawed_dem' ? 0.5 : 1);
  let best = null,
    bu = 0;
  for (const o of view.others) {
    if (!(o.neighbor || o.rivalry > 55 || o.dist < 3500) || o.ally || o.truce || o.atWar || o.hostileTo) continue;
    if (o.mil <= 0) continue;
    const oAllies = alliedPowerOf(sim, c.idx, view, o.idx);
    const ratio = view.self.mil / (o.mil + 0.5 * oAllies + 1);
    const rivalry = o.rivalry / 100;
    const claim = o.claimedByMe;
    if (rivalry < 0.3 && claim === 0) continue;
    const nuke = o.nukes >= 2 ? 3 : o.nukes ? 1.2 : 0;
    const hasCB = sim.hasCasusBelli(c.idx, o.idx);
    const value = 0.9 * claim + 0.8 * rivalry + 0.2 * A.w.ideology * (1 - o.dem / 100) + (o.landNeighbor ? 0.2 : 0);
    const odds = o.landNeighbor ? clamp((ratio - 1) / 2, 0, 1) : clamp((ratio - 2.5) / 4, 0, 1) * (o.neighbor ? 0.6 : 0.3); // amphibious war needs overwhelming superiority
    const cost =
      0.35 + (hasCB ? 0 : 0.35) + nuke + 0.8 * (1 - c.gov.stability) + 0.4 * (c.econ.util < 0.95 ? 1 : 0) + 0.3 * (o.stab < 0.35 ? -1 : 0);
    const u = aggression * (value * odds * 2.2) - cost * 0.55;
    if (u > bu) {
      bu = u;
      best = o;
    }
  }
  if (best && bu > 0.2 && sim.rng.chance(clamp(bu * 0.006, 0, 0.012))) {
    const r = sim.exec({ type: 'declareWar', actor: c.idx, target: best.idx, goal: 'territory' });
    if (r.ok) {
      A.lastWar = st.day;
      for (const e of [best.idx]) sim.exec({ type: 'setStance', actor: c.idx, enemy: e, stance: 'attack' });
    }
  }
}

// A nuclear power that is losing badly, exhausted and facing defeat at home may use a weapon on a non-nuclear (or weaker) enemy.
function considerNuclear(sim, c, view) {
  const A = c.ai;
  if (!(c.mil.nukes > 0) || c.mil.exhaustion < 0.55 || sim.state.day - (A.lastNuke ?? -9999) < 720) return;
  const reg = sim.state.reg;
  const cap = sim.geo.capitalRegion[c.idx];
  const threatened = reg.ctrl[cap] !== c.idx || sim.geo.regions[cap].adj.some((a) => view.enemies.has(reg.ctrl[a.to]));
  if (!threatened) return;
  for (const w of view.wars) {
    const side = w.attackers.includes(c.idx) ? 'a' : w.defenders.includes(c.idx) ? 'd' : null;
    if (!side || w.score[side] - w.score[side === 'a' ? 'd' : 'a'] > -30) continue;
    const foes = side === 'a' ? w.defenders : w.attackers;
    for (const f of foes) {
      const o = view.byIdx(f);
      if (!o || o.nukes >= c.mil.nukes) continue; // no first use against an equal: retaliation
      if (!sim.rng.chance(0.05 * (0.5 + A.risk))) continue;
      A.lastNuke = sim.state.day;
      sim.exec({ type: 'nuclearStrike', actor: c.idx, target: f });
      return;
    }
  }
}
