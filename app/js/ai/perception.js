// The AI's window on the world. AI modules must read other countries ONLY through this file (enforced by a test that greps
// app/js/ai/*.js for direct country-state access). Other nations' economies and forces arrive through noisy, intel-limited
// estimates; only public facts (regime type, borders, treaties, wars, relations, prices) are exact.
import { perceive } from '../sim/intel.js';

export function buildView(sim, me) {
  const st = sim.state, N = sim.geo.N, mc = st.countries[me];
  const others = [];
  const enemies = sim.enemiesOf(me), allies = sim.alliesOf(me);
  const ix = sim.dipIdx; const sanctionedByMe = new Set(st.sanctions.filter((s) => s.by === me).map((s) => s.target));
  const tc = (j) => (neighborsOrNear(sim, me, j) ? sim.tradeComplement(me, j) : 0);
  for (let j = 0; j < N; j++) {
    if (j === me) continue;
    const t = st.countries[j];
    const p = perceive(sim, me, j);
    others.push({
      idx: j, id: t.id, name: t.name, region: t.region, dem: t.gov.dem, regime: t.gov.type,
      gdp: p.gdp, mil: p.mil, stab: p.stability, mt: p.mt, nukes: p.nukes, conf: p.conf,
      theirOpinion: st.rel.op[j * N + me], myOpinion: st.rel.op[me * N + j], trust: st.rel.trust[me * N + j], rivalry: st.rel.rivalry[me * N + j],
      neighbor: sim.geo.neighbors[me].has(j), landNeighbor: sim.geo.landNeighbors[me].has(j), dist: sim.geo.dist[me * N + j],
      atWar: enemies.has(j), ally: allies.has(j), hostileTo: sim.atWarWith(me, j),
      claimedByMe: ix.claims[me * N + j], iClaimedByThem: ix.claims[j * N + me],
      tradeComplement: tc(j), sanctioned: !!ix.sanc[me * N + j], sanctionedByMe: sanctionedByMe.has(j),
      truce: !!ix.ceasefire[me * N + j], hasTrade: !!ix.tradeT[me * N + j], sharedBlocs: ix.sharedOrgs[me * N + j],
      alliesOfThem: sim.alliesOf(j).size,
    });
  }
  const self = perceive(sim, me, me);
  return { me, c: mc, day: st.day, prices: st.prices, others, byIdx: (j) => others.find((o) => o.idx === j), enemies, allies, self, wars: st.wars.filter((w) => w.active) };
}
export function alliedPowerOf(sim, me, view, j) {
  let s = 0; for (const o of view.others) if (o.idx !== j && sim.alliesOf(j).has(o.idx)) s += o.mil;
  // public security guarantees count at reduced weight (they are pledges, not obligations)
  for (const t of sim.state.treaties) if (t.active && t.type === 'guarantee' && t.parties[1] === j && t.parties[0] !== me && !sim.alliesOf(j).has(t.parties[0])) { const g = view.byIdx(t.parties[0]); if (g) s += 0.7 * g.mil; }
  return s;
}

function neighborsOrNear(sim, me, j) { return sim.geo.dist[me * sim.geo.N + j] < 7000; }
