// Command layer: the ONLY way the player or AI changes the world. Same validation, costs and effects for everyone.
import { clamp, BUDGET_CATS, SECTORS } from './constants.js';
import { GOV_PROFILE } from './constants.js';
import * as WAR from './war.js';
import * as DIP from './diplomacy.js';
import * as INT from './intel.js';
import * as EVT from './events.js';
import { UNIT_TYPES } from './military.js';
import { bump } from './achievements.js';
import { techAvailable, canAdopt, adoptionCost, completeTech } from './research.js';

const ok = (extra = {}) => ({ ok: true, ...extra });
const no = (reason, extra = {}) => ({ ok: false, reason, ...extra });

export function leverDef(sim, key) {
  return sim.data.policies.levers.find((l) => l.key === key);
}
export function policyCost(sim, c, key, value) {
  const d = leverDef(sim, key);
  if (!d) return Infinity;
  const cur = c.target[key];
  const range = d.max - d.min;
  const delta = Math.abs(value - cur) / range;
  const prof = GOV_PROFILE[c.gov.type];
  return +(d.cost * delta * prof.resist * (key === 'policyRate' && c.econ.cbIndep > 0.6 ? 1.5 : 1)).toFixed(2);
}

const HANDLERS = {
  setPolicy(sim, a, cmd) {
    const d = leverDef(sim, cmd.key);
    if (!d) return no('unknown policy');
    const c = sim.state.countries[a];
    const v = clamp(cmd.value, d.min, d.max);
    const cost = policyCost(sim, c, cmd.key, v);
    if (cost > c.gov.pc) return no(`needs ${cost.toFixed(1)} political capital`, { cost });
    if (cmd.preview) return ok({ cost, value: v });
    c.gov.pc -= cost;
    c.target[cmd.key] = v;
    if (a === sim.state.playerId) {
      bump(sim, 'policy');
      if (cmd.key === 'policyRate') c.autoCB = false;
    } // taking the rate lever overrides the independent central bank
    return ok({ cost, value: v });
  },
  setBudget(sim, a, cmd) {
    const c = sim.state.countries[a];
    const shares = { ...c.target.budget, ...cmd.shares };
    let tot = 0;
    for (const k of BUDGET_CATS) {
      if (!(shares[k] >= 0)) return no('invalid share ' + k);
      tot += shares[k];
    }
    if (tot <= 0) return no('empty budget');
    const cost =
      3 + 12 * BUDGET_CATS.reduce((s, k) => s + Math.abs(shares[k] / tot - c.target.budget[k]), 0) * GOV_PROFILE[c.gov.type].resist;
    if (cost > c.gov.pc) return no(`needs ${cost.toFixed(1)} political capital`, { cost });
    if (cmd.preview) return ok({ cost });
    c.gov.pc -= cost;
    for (const k of BUDGET_CATS) c.target.budget[k] = shares[k] / tot;
    return ok({ cost });
  },
  setFocus(sim, a, cmd) {
    const c = sim.state.countries[a];
    if (!sim.data.policies.industrialFocus.includes(cmd.sector)) return no('invalid sector');
    if (c.target.focus === cmd.sector) return ok({ cost: 0 });
    const cost = 12;
    if (c.gov.pc < cost) return no(`needs ${cost} political capital`, { cost });
    c.gov.pc -= cost;
    c.target.focus = cmd.sector;
    return ok({ cost });
  },
  toggleAuto(sim, a, cmd) {
    const c = sim.state.countries[a];
    if (!['autoCB', 'autoFiscal'].includes(cmd.what)) return no('invalid');
    c[cmd.what] = !!cmd.value;
    return ok();
  },
  // ---------------------------------------------------------------- research
  queueTech(sim, a, cmd) {
    const c = sim.state.countries[a];
    const t = sim.data.techById[cmd.tech];
    if (!t) return no('unknown tech');
    if (!techAvailable(sim, c, t)) return no('prerequisites missing or already known');
    if (c.tech.queue.some((q) => q.id === t.id)) return no('already queued');
    if (c.tech.queue.length >= 8) return no('queue full');
    c.tech.queue.push({ id: t.id, progress: c.tech.rpBank || 0 });
    c.tech.rpBank = 0;
    return ok();
  },
  dequeueTech(sim, a, cmd) {
    const c = sim.state.countries[a];
    c.tech.queue = c.tech.queue.filter((q) => q.id !== cmd.tech);
    return ok();
  },
  prioritizeTech(sim, a, cmd) {
    const c = sim.state.countries[a];
    const i = c.tech.queue.findIndex((q) => q.id === cmd.tech);
    if (i < 0) return no('not queued');
    const [q] = c.tech.queue.splice(i, 1);
    c.tech.queue.unshift(q);
    return ok();
  },
  adoptTech(sim, a, cmd) {
    const c = sim.state.countries[a];
    const t = sim.data.techById[cmd.tech];
    if (!t) return no('unknown tech');
    if (!canAdopt(sim, c, t)) return no('not adoptable (needs prerequisites, global uptake >= 20% and education)');
    const cost = adoptionCost(sim, c, t);
    const months = 4 + 3 * t.tier;
    if (cmd.preview) return ok({ cost, months });
    if (c.gov.pc < 5) return no('needs 5 political capital');
    c.gov.pc -= 5;
    c.tech.adopting.push({ id: t.id, left: months, monthly: cost / months });
    return ok({ cost, months });
  },
  // ---------------------------------------------------------------- military
  setStance(sim, a, cmd) {
    return WAR.setStance(sim, a, cmd.enemy, cmd.stance, cmd.objective ?? -1) ? ok() : no('invalid');
  },
  setDoctrine(sim, a, cmd) {
    const c = sim.state.countries[a];
    if (c.gov.pc < 15) return no('needs 15 political capital');
    if (c.mil.doctrineSince && sim.state.day - c.mil.doctrineSince < 365) return no('doctrine changed recently');
    if (!WAR.setDoctrine(sim, c, cmd.doctrine)) return no('unknown doctrine');
    c.gov.pc -= 15;
    for (const f of sim.forcesOf[a]) f.org *= 0.7;
    return ok();
  },
  mobilize(sim, a, cmd) {
    const c = sim.state.countries[a];
    const lvl = clamp(Math.round(cmd.level), 0, 3);
    const cost = lvl > c.mil.mobilizationTarget ? 6 * (lvl - (c.mil.mobilizationTarget || 0)) : 0;
    if (cost > c.gov.pc) return no(`needs ${cost} political capital`);
    c.gov.pc -= cost;
    c.mil.mobilizationTarget = lvl;
    return ok({ cost });
  },
  setManualWar(sim, a, cmd) {
    sim.state.countries[a].mil.manual = !!cmd.value;
    return ok();
  },
  moveForce(sim, a, cmd) {
    const f = sim.forceById(cmd.force);
    if (!f || f.owner !== a) return no('not your formation');
    if (!WAR.moveForce(sim, f, cmd.region)) return no('no path');
    f.order = { kind: 'move', target: cmd.region };
    return ok();
  },
  attackRegion(sim, a, cmd) {
    const f = sim.forceById(cmd.force);
    if (!f || f.owner !== a) return no('not your formation');
    if (f.branch !== 'land') return no('land formations only');
    if (!sim.enemiesOf(a).has(sim.state.reg.ctrl[cmd.target])) return no('target not controlled by an enemy');
    return WAR.attackRegion(sim, f, cmd.target) ? ok() : no('cannot reach');
  },
  setOrder(sim, a, cmd) {
    const f = sim.forceById(cmd.force);
    if (!f || f.owner !== a) return no('not your formation');
    if (!['hold', 'defend', 'bomb', 'blockade', 'patrol', 'rest', 'locked'].includes(cmd.kind)) return no('invalid order');
    f.order = { kind: cmd.kind, target: cmd.target ?? -1 };
    f.dest = -1;
    return ok();
  },
  raiseForce(sim, a, cmd) {
    const c = sim.state.countries[a];
    const u = UNIT_TYPES[cmd.unit];
    if (!u) return no('unknown type');
    const cost = u.cost * 0.35 * Math.pow(c.econ.gdp / c.pop.total, 0.5); // USD bn
    if (c.gov.pc < 8) return no('needs 8 political capital');
    if (c.mil.reserve < u.size * 0.3 && u.branch === 'land') return no('not enough reserves');
    if (cmd.preview) return ok({ cost });
    c.gov.pc -= 8;
    c.econ.debt += cost;
    const region = cmd.region ?? sim.geo.capitalRegion[a];
    if (u.branch === 'sea' && !sim.geo.coastal[a]) return no('landlocked');
    const loc = u.branch === 'sea' ? (sim.geo.regions[region].coast[0]?.sea ?? -1) : region;
    if (loc < 0) return no('needs a coastal region');
    const f = {
      id: sim.state.nextId++,
      owner: a,
      branch: u.branch,
      type: cmd.unit,
      name: `New ${u.name}`,
      size: u.size * 0.5,
      max: u.size,
      fill: 0.5,
      morale: 0.6,
      exp: 0,
      org: 0.6,
      supply: 1,
      loc,
      order: { kind: 'hold', target: -1 },
      dest: -1,
      moveProg: 0,
      prep: 0,
      cmd: -1,
      inCombat: 0,
      home: loc,
    };
    sim.state.forces.push(f);
    c.mil.reserve = Math.max(0, c.mil.reserve - u.size * 0.3);
    c.mil.active += u.size * 0.3;
    sim.indexForces();
    return ok({ cost, force: f.id });
  },
  assignCommander(sim, a, cmd) {
    const f = sim.forceById(cmd.force);
    const c = sim.state.countries[a];
    if (!f || f.owner !== a) return no('not your formation');
    if (!c.mil.commanders[cmd.commander]) return no('no such commander');
    f.cmd = cmd.commander;
    return ok();
  },
  // ---------------------------------------------------------------- diplomacy
  propose(sim, a, cmd) {
    const to = cmd.to;
    if (to === a || to === undefined) return no('invalid target');
    if (cmd.preview) return ok({ eval: DIP.evaluateProposal(sim, a, to, cmd.kind, cmd.params || {}), cost: DIP.dipCost(cmd.kind) });
    return DIP.actOnProposal(sim, a, to, cmd.kind, cmd.params || {});
  },
  sanction(sim, a, cmd) {
    const c = sim.state.countries[a];
    const cost = DIP.dipCost('sanction');
    if (c.dip.influence < cost) return no(`needs ${cost} influence`);
    if (sim.state.sanctions.some((s) => s.by === a && s.target === cmd.target)) return no('already sanctioned');
    c.dip.influence -= cost;
    return ok({ sanction: DIP.addSanction(sim, a, cmd.target, cmd.mask ?? 0b0110, cmd.coalition || []) });
  },
  liftSanction(sim, a, cmd) {
    const s = sim.state.sanctions.find((x) => x.id === cmd.id && x.by === a);
    if (!s) return no('not your sanction');
    DIP.liftSanction(sim, cmd.id);
    return ok();
  },
  declareWar(sim, a, cmd) {
    const c = sim.state.countries[a];
    if (cmd.preview) return ok({ cb: DIP.hasCasusBelli(sim, a, cmd.target), cost: 30 });
    if (c.gov.pc < 30) return no('needs 30 political capital');
    if (c.dip.vassalOf !== null && c.dip.vassalOf !== undefined) return no('a client state cannot declare war');
    const r = WAR.declareWar(sim, a, cmd.target, { goal: cmd.goal, region: cmd.region, breakTruce: cmd.breakTruce });
    if (r.ok) c.gov.pc -= 30;
    return r.ok ? ok({ war: r.war.id }) : no(r.reason, r);
  },
  proposePeace(sim, a, cmd) {
    const w = sim.state.wars.find((x) => x.id === cmd.war && x.active);
    if (!w) return no('no such war');
    if (cmd.preview) return ok({ eval: WAR.evaluatePeace(sim, w, a, cmd.target, cmd.terms || [{ kind: 'ceasefire' }]) });
    const r = WAR.proposePeace(sim, w, a, cmd.target, cmd.terms || [{ kind: 'ceasefire' }]);
    return r.ok ? ok(r) : no('the other side rejects these terms', r);
  },
  answerOffer(sim, a, cmd) {
    const c = sim.state.countries[a];
    const o = c.dip.offers.find((x) => x.id === cmd.id);
    if (!o) return no('that offer has expired');
    c.dip.offers = c.dip.offers.filter((x) => x.id !== cmd.id);
    if (!cmd.accept) {
      sim.rel(a, o.from, 0, -1);
      return ok({ declined: true });
    }
    const w = sim.state.wars.find((x) => x.id === o.war && x.active);
    if (!w) return no('the war has already ended');
    const r = WAR.proposePeace(sim, w, o.from, a, o.terms, { force: true });
    return r.ok ? ok(r) : no('the offer is no longer valid', r);
  },
  respondCall(sim, a, cmd) {
    return DIP.respondToCall(sim, a, cmd.war, !!cmd.join) ? ok() : no('no pending call');
  },
  unResolution(sim, a, cmd) {
    return DIP.unResolution(sim, a, cmd.kind, cmd.target, !!cmd.preview);
  },
  // ---------------------------------------------------------------- intelligence
  intelOp(sim, a, cmd) {
    return INT.startOp(sim, a, cmd.op, cmd.target, cmd.params || {});
  },
  // ---------------------------------------------------------------- events
  resolveEvent(sim, a, cmd) {
    const inst = sim.state.events.pending.find((p) => p.uid === cmd.uid && p.country === a);
    if (!inst) return no('no such decision');
    const def = sim.eventById[inst.id];
    if (!def.options[cmd.option]) return no('no such option');
    EVT.resolvePending(sim, inst, cmd.option, false);
    return ok();
  },
};

// Required arguments per command (validated before any handler runs, so malformed UI/AI calls fail cleanly).
const REQUIRED = {
  setPolicy: ['key', 'value'],
  setBudget: ['shares'],
  setFocus: ['sector'],
  toggleAuto: ['what'],
  queueTech: ['tech'],
  dequeueTech: ['tech'],
  prioritizeTech: ['tech'],
  adoptTech: ['tech'],
  setStance: ['enemy', 'stance'],
  setDoctrine: ['doctrine'],
  mobilize: ['level'],
  moveForce: ['force', 'region'],
  attackRegion: ['force', 'target'],
  setOrder: ['force', 'kind'],
  raiseForce: ['unit'],
  assignCommander: ['force', 'commander'],
  propose: ['to', 'kind'],
  unResolution: ['kind', 'target'],
  sanction: ['target'],
  liftSanction: ['id'],
  declareWar: ['target'],
  proposePeace: ['war', 'target'],
  answerOffer: ['id'],
  respondCall: ['war'],
  intelOp: ['op', 'target'],
  resolveEvent: ['uid', 'option'],
};
const IDX_FIELDS = ['enemy', 'to', 'target', 'force', 'region', 'commander', 'war', 'uid', 'option', 'id'];
export function exec(sim, cmd) {
  const h = cmd && HANDLERS[cmd.type];
  if (!h) return no('unknown command ' + (cmd && cmd.type));
  for (const k of REQUIRED[cmd.type] || []) if (cmd[k] === undefined || cmd[k] === null) return no(`missing argument '${k}'`);
  for (const k of IDX_FIELDS)
    if (cmd[k] !== undefined && cmd.type !== 'setPolicy' && cmd.type !== 'setFocus' && !(Number.isInteger(cmd[k]) && cmd[k] >= 0))
      return no(`invalid argument '${k}'`);
  if (
    cmd.target !== undefined &&
    cmd.type !== 'queueTech' &&
    cmd.target >= sim.geo.N &&
    ['sanction', 'declareWar', 'intelOp', 'proposePeace', 'unResolution'].includes(cmd.type)
  )
    return no('no such country');
  if (cmd.to !== undefined && cmd.to >= sim.geo.N) return no('no such country');
  const actor = cmd.actor ?? sim.state.playerId;
  const r = h(sim, actor, cmd);
  if (r.ok && !cmd.preview && actor === sim.state.playerId) {
    const L = sim.state.cmdLog || (sim.state.cmdLog = []);
    L.push({ day: sim.state.day, cmd: { ...cmd, actor } });
    if (L.length > 2000) L.shift();
  }
  return r;
}
export const COMMAND_TYPES = Object.keys(HANDLERS);
