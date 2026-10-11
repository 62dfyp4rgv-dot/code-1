// AI diplomatic layer: alliances against threats, trade partners, relations upkeep, accession, sanctions, aid, peace.
import { clamp } from '../sim/constants.js';
import { dipCost } from '../sim/diplomacy.js';

export function manageDiplomacy(sim, c, view) {
  const A = c.ai, d = c.dip; const st = sim.state;
  const left = () => d.influence;
  const prop = (to, kind, params) => { if (left() < dipCost(kind)) return null; return sim.exec({ type: 'propose', actor: c.idx, to, kind, params }); };
  const atWar = sim.atWar(c.idx);
  // 1) Security: align against the top threat if lacking partners
  if (A.threat > 0.55 && left() > 30) {
    const myAllies = view.allies.size;
    if (myAllies < 3 + (A.threat > 1 ? 2 : 0)) {
      let best = null, bs = -1e9;
      for (const o of view.others) {
        if (o.ally || o.atWar || o.truce) continue;
        if (o.theirOpinion < 15 || o.mil < 0.3 * view.self.mil) continue;
        const sc = Math.log(1 + o.mil) + o.theirOpinion * 0.05 - o.dist / 6000;
        if (sc > bs) { bs = sc; best = o; }
      }
      if (best) prop(best.idx, A.threat > 1.1 ? 'alliance' : 'defense_pact');
    }
  }
  // 2) Prosperity: trade agreements with complementary partners
  if (A.w.prosperity > 0.4 && left() > 20 && !atWar) {
    let best = null, bs = 0.5;
    for (const o of view.others) { if (o.hasTrade || o.atWar || o.rivalry > 30 || o.theirOpinion < 0) continue; const sc = o.tradeComplement + o.theirOpinion / 100 + Math.log10(1 + o.gdp) * 0.05; if (sc > bs) { bs = sc; best = o; } }
    if (best) prop(best.idx, 'trade_agreement');
  }
  // 3) Relations upkeep with important neighbours
  if (!atWar && left() > 14 && c.ai.w.influence > 0.3) {
    const n = view.others.filter((o) => o.neighbor && o.theirOpinion < 25 && o.rivalry < 40 && !o.truce).sort((a, b) => a.theirOpinion - b.theirOpinion)[0];
    if (n) prop(n.idx, 'improve');
  }
  // 4) Accession to organisations
  if (left() > 40 && !atWar) {
    for (const org of st.orgs) {
      if (org.members.includes(c.idx) || org.type === 'cartel' || org.type === 'assembly' || org.type === 'forum') continue;
      if (c.econ.gdp < 20) continue;
      const ev = sim.exec({ type: 'propose', actor: c.idx, to: org.members[0], kind: 'join_org', params: { org: org.id }, preview: true });
      if (ev.ok && ev.eval.score > 4 && sim.rng.chance(0.2)) { prop(org.members[0], 'join_org', { org: org.id }); break; }
    }
  }
  // 5) Sanctions against aggressors (those who attacked without cause) when ideologically motivated
  if (A.w.ideology > 0.35 && left() > 28) {
    for (const w of view.wars) {
      const aggr = w.attackers[0]; if (aggr === c.idx || !w.cb || w.cb !== 'none') continue;
      const o = view.byIdx(aggr); if (!o || o.sanctionedByMe || o.ally || o.myOpinion > -10) continue;
      if (c.econ.gdp > 200 && sim.rng.chance(0.3)) { sim.exec({ type: 'sanction', actor: c.idx, target: aggr, mask: 0b0110, coalition: [] }); break; }
    }
  }
  // 6) Aid to allies at war
  if (left() > 20 && c.dev0 > 0.5 && !atWar) {
    const ally = view.others.find((o) => o.ally && o.atWar);
    if (ally && sim.rng.chance(0.3)) prop(ally.idx, 'aid');
  }
}
