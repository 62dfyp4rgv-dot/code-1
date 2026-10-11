// AI intelligence layer: build networks on rivals and neighbours, occasionally conduct covert operations.
import { OPS } from '../sim/intel.js';

export function manageIntel(sim, c, view) {
  const I = c.intel;
  if (I.points < 10 || I.ops.length >= 2) return;
  const A = c.ai;
  const targets = view.others
    .filter((o) => o.rivalry > 30 || (o.landNeighbor && o.theirOpinion < 10) || o.atWar)
    .sort((a, b) => b.rivalry - a.rivalry + (b.atWar ? 50 : 0) - (a.atWar ? 50 : 0));
  const t = targets[0];
  if (!t) return;
  const net = sim.netLevelOf(c.idx, t.idx);
  if (net < 35) {
    sim.exec({ type: 'intelOp', actor: c.idx, op: 'gather', target: t.idx });
    return;
  }
  if (I.points > 25 && A.w.security > 0.4) {
    const hostile = t.atWar || t.rivalry > 60;
    const type = t.atWar
      ? sim.rng.chance(0.5)
        ? 'sabotage'
        : 'cyber'
      : hostile && A.risk > 0.5 && sim.rng.chance(0.25)
        ? 'disinfo'
        : sim.rng.chance(0.4)
          ? 'steal_tech'
          : null;
    if (type && OPS[type].cost <= I.points) sim.exec({ type: 'intelOp', actor: c.idx, target: t.idx, op: type });
  }
}
