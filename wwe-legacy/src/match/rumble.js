// Royal Rumble engine: 30 entrants, timed entries, eliminations over the top rope. Like the match
// engine it is a pure, seeded, JSON-serialisable state machine that emits structured events;
// the Game layer turns the result into ledger events (rumble_result, promises kept/broken...).
import { BoundRng } from '../core/rng.js';
import { clamp, deepClone } from '../core/util.js';

const N = 30;
const rngOf = (s) => new BoundRng(s, 'rng');
const emit = (s, type, data = {}) => { const e = { seq: ++s.seq, t: s.t, tick: s.tick, type, ...data }; s.events.push(e); return e; };
const add = (f, k, n) => { f[k] = clamp(f[k] + n, 0, k === 'stamina' ? f.max : 100); };

/** entrants: array of N wrestler profiles (exactly one may be the player). */
export function createRumble({ seed = 1, year = 2024, entrants, playerId = null, playerEntry = null, rivals = [], allies = [], women = false }) {
  if (!entrants || entrants.length !== N) throw new Error(`a Rumble needs exactly ${N} entrants`);
  const rng = { rng: 0 };
  const r = new BoundRng(rng, 'rng'); r.s = typeof seed === 'number' ? seed : 1;
  let order = r.shuffle(entrants.map((e) => e.id));
  if (playerId && playerEntry) {
    order = order.filter((id) => id !== playerId);
    order.splice(clampInt(playerEntry, 1, N) - 1, 0, playerId);
  }
  const fighters = {};
  for (const e of entrants) {
    const a = e.attrs || {};
    const power = ((a.power || 50) * 0.4 + (a.striking || 50) * 0.2 + (a.toughness || 50) * 0.25 + (a.grappling || 50) * 0.15);
    const max = 70 + (a.endurance || 50) * 0.6;
    fighters[e.id] = {
      id: e.id, name: e.name, alignment: e.alignment || 'tweener', tier: e.tier ?? 1, attrs: a, power, max, stamina: max, momentum: 20, dmg: 0, entry: order.indexOf(e.id) + 1, entered: false, out: false,
      eliminatedBy: null, outAt: null, enteredAt: null, elims: 0, isPlayer: e.id === playerId, ally: null, hiding: 0, finisherReady: false,
    };
  }
  return {
    v: 1, id: `rumble_${seed}_${year}`, seed, rng: rng.rng, year, women, order, fighters, ring: [], t: 0, tick: 0, nextEntry: 0, interval: 90,
    events: [], seq: 0, pending: null, result: null, playerId, rivals, allies, danger: false, lastTarget: null, over: false,
  };
}
const clampInt = (v, a, b) => Math.max(a, Math.min(b, Math.round(v)));

function strengthOf(f) { return f.power * (0.55 + 0.45 * (f.stamina / f.max)) + f.momentum * 0.25 - f.dmg * 0.25; }
function weaknessOf(f) { return 100 - f.power * 0.5 - (f.stamina / f.max) * 40 + f.dmg * 0.4 - f.momentum * 0.15; }

function eliminate(s, victimId, byId, how) {
  const v = s.fighters[victimId];
  v.out = true; v.eliminatedBy = byId; v.outAt = s.t;
  s.ring = s.ring.filter((x) => x !== victimId);
  const by = byId ? s.fighters[byId] : null;
  if (by) { by.elims += 1; add(by, 'momentum', 12); add(by, 'stamina', -6); }
  for (const f of Object.values(s.fighters)) if (f.ally === victimId) f.ally = null;
  emit(s, 'rumble_elimination', { victim: victimId, by: byId, how, remaining: s.ring.length, entered: s.nextEntry });
  if (s.playerId && victimId === s.playerId) s.playerOut = true;
}

function enterNext(s) {
  const id = s.order[s.nextEntry];
  const f = s.fighters[id];
  f.entered = true; f.enteredAt = s.t; s.ring.push(id); s.nextEntry += 1;
  emit(s, 'rumble_entry', { id, number: s.nextEntry, ring: s.ring.length });
  return f;
}

/** AI-vs-AI brawling: eliminations happen at a pace that keeps the ring lively */
function aiBrawl(s, R) {
  const ring = s.ring.filter((id) => id !== s.playerId);
  const target = s.nextEntry >= N ? 1 : s.ring.length > 12 ? 2 : s.ring.length > 8 ? 1.4 : s.ring.length > 4 ? 0.7 : 0.25;
  let k = Math.floor(target) + (R.chance(target - Math.floor(target)) ? 1 : 0);
  if (s.nextEntry >= N) k = 1;
  for (let i = 0; i < k && s.ring.length > 1; i++) {
    const cands = s.ring.filter((id) => !s.fighters[id].isPlayer || false);
    const pool = s.ring.filter((id) => id !== s.playerId);
    if (pool.length < 1) break;
    const attacker = R.weighted(s.ring, (id) => Math.max(1, strengthOf(s.fighters[id])) * (id === s.playerId ? 0 : 1));
    if (!attacker) break;
    const victims = s.ring.filter((id) => id !== attacker && s.fighters[attacker].ally !== id && s.fighters[id].ally !== attacker);
    if (!victims.length) break;
    // the player is only eliminated via explicit danger decisions, not silent AI brawls
    const nonPlayer = victims.filter((id) => id !== s.playerId);
    if (!nonPlayer.length) break;
    const v = R.weighted(nonPlayer, (id) => Math.max(1, weaknessOf(s.fighters[id])));
    const A = s.fighters[attacker], V = s.fighters[v];
    const p = clamp(0.5 + (strengthOf(A) - strengthOf(V)) / 160, 0.2, 0.85);
    if (R.next() < p) eliminate(s, v, attacker, 'over the top rope');
    else { add(V, 'momentum', 6); add(A, 'stamina', -8); A.dmg = clamp(A.dmg + 4, 0, 100); }
  }
  for (const id of s.ring) { const f = s.fighters[id]; add(f, 'stamina', -3 - s.ring.length / 6); f.dmg = clamp(f.dmg + 1.5, 0, 100); if (f.hiding > 0) f.hiding -= 1; }
}

function playerOptions(s) {
  const me = s.fighters[s.playerId];
  const others = s.ring.filter((id) => id !== s.playerId).map((id) => s.fighters[id]);
  const opts = [];
  const byWeak = others.slice().sort((a, b) => weaknessOf(b) - weaknessOf(a));
  const strongest = others.slice().sort((a, b) => strengthOf(b) - strengthOf(a))[0];
  const seen = new Set();
  const addTarget = (f, tag) => { if (!f || seen.has(f.id)) return; seen.add(f.id); opts.push({ id: `elim:${f.id}`, label: `${tag}${f.name}`, desc: `Try to throw ${f.name} over the top. ${odds(s, me, f)}`, p: elimP(s, me, f), group: 'Eliminate', enabled: me.stamina >= 8, kind: 'elim' }); };
  for (const rv of s.rivals) addTarget(s.fighters[rv]?.entered && !s.fighters[rv].out ? s.fighters[rv] : null, 'Rival: ');
  addTarget(byWeak[0], 'Weakest: ');
  addTarget(strongest, 'Biggest threat: ');
  addTarget(byWeak[1], '');
  if (me.momentum >= 60 && strongest) opts.push({ id: `finisher:${strongest.id}`, label: `Hit your finisher on ${strongest.name}`, desc: `A huge swing at the biggest threat (+25% to eliminate). Spends momentum.`, p: clamp(elimP(s, me, strongest) + 0.25, 0.1, 0.92), group: 'Eliminate', enabled: me.stamina >= 12, kind: 'finisher' });
  opts.push({ id: 'brawl', label: 'Brawl with whoever is closest', desc: 'Build momentum and wear people down. Low risk.', group: 'Fight', enabled: true, kind: 'brawl' });
  opts.push({ id: 'recover', label: 'Hide in the corner and recover', desc: 'Regain stamina; much less likely to be targeted next tick.', group: 'Defend', enabled: true, kind: 'recover' });
  opts.push({ id: 'rally', label: 'Fire up the crowd', desc: 'Momentum and heat; you become a bigger target.', group: 'Tactics', enabled: true, kind: 'rally' });
  if (others.length >= 2) opts.push({ id: 'team', label: 'Team up with someone', desc: 'Pick an ally for a few ticks: better odds for both of you - until the final two.', group: 'Tactics', enabled: !me.ally, kind: 'team' });
  opts.push({ id: 'lurk', label: 'Lurk and wait for a tired entrant', desc: 'Save stamina now; your next elimination attempt gets +12%.', group: 'Tactics', enabled: true, kind: 'lurk' });
  if (me.ally && s.ring.includes(me.ally)) opts.push({ id: `betray:${me.ally}`, label: `Betray ${s.fighters[me.ally].name}`, desc: 'Eliminate your ally. High risk, high reward - they will never forget it.', p: clamp(elimP(s, me, s.fighters[me.ally]) + 0.15, 0.1, 0.9), group: 'Eliminate', enabled: true, kind: 'betray' });
  return opts;
}
const odds = (s, a, b) => { const p = elimP(s, a, b); return p >= 0.65 ? 'Strong chance.' : p >= 0.45 ? 'Fair chance.' : 'Long shot.'; };
function elimP(s, A, V) {
  let p = 0.45 + (strengthOf(A) - strengthOf(V)) / 150;
  if (A.ally && s.ring.includes(A.ally)) p += 0.08;
  if (A.lurk) p += 0.12;
  if (V.ally && s.ring.includes(V.ally)) p -= 0.08;
  return clamp(p, 0.1, 0.88);
}

function dangerOptions(s) {
  return [
    { id: 'hold', label: 'Hold the ropes with everything', desc: 'Best against power. Costs stamina.', group: 'Defend', enabled: true },
    { id: 'skin', label: 'Skin the cat', desc: 'Hang under the rope and climb back. Needs agility.', group: 'Defend', enabled: true },
    { id: 'counter', label: 'Counter and throw them instead', desc: 'Risky: could eliminate them - or be thrown.', group: 'Defend', enabled: true },
    { id: 'ally_save', label: 'Call for your ally', desc: 'Only works if you have one in the ring.', group: 'Defend', enabled: !!s.fighters[s.playerId].ally && s.ring.includes(s.fighters[s.playerId].ally) },
    { id: 'fight', label: 'Fight back with strikes', desc: 'Trade blows to break the grip.', group: 'Defend', enabled: true },
    { id: 'pray', label: 'Cover up and hope', desc: 'Costs nothing; weak odds.', group: 'Defend', enabled: true },
  ];
}

export class RumbleEngine {
  constructor(state, opts = {}) {
    this.state = state.v === 1 && state.fighters ? state : createRumble(state);
    this.human = opts.human ?? !!this.state.playerId;
    this._settle();
  }
  static fromJSON(j, opts) { return new RumbleEngine(typeof j === 'string' ? JSON.parse(j) : deepClone(j), opts); }
  toJSON() { return this.state; }
  get over() { return !!this.state.result; }
  get result() { return this.state.result; }

  getDecision() {
    const s = this.state;
    if (s.result) return null;
    if (!s.pending) return null;
    const me = s.fighters[s.playerId];
    if (s.pending.kind === 'danger') return { kind: 'danger', actor: s.playerId, attacker: s.pending.attacker, options: dangerOptions(s), isHuman: true };
    if (s.pending.kind === 'team') {
      const opts = s.ring.filter((id) => id !== s.playerId).map((id) => ({ id: `ally:${id}`, label: `Team up with ${s.fighters[id].name}`, desc: `${s.fighters[id].alignment === me.alignment ? 'Same alignment: likely to accept.' : 'Different alignment: they might refuse.'}`, group: 'Tactics', enabled: true }));
      return { kind: 'team', actor: s.playerId, options: opts.slice(0, 6), isHuman: true };
    }
    return { kind: 'action', actor: s.playerId, options: playerOptions(s), isHuman: true };
  }

  choose(id) {
    const s = this.state, R = rngOf(s);
    const d = this.getDecision();
    if (!d) throw new Error('rumble is over');
    const opt = d.options.find((o) => o.id === id);
    if (!opt || opt.enabled === false) throw new Error(`invalid rumble choice ${id}`);
    const start = s.events.length;
    const me = s.fighters[s.playerId];
    s.pending = null;
    if (d.kind === 'danger') {
      const att = s.fighters[d.attacker];
      const base = { hold: 0.48 + me.attrs.power / 300, skin: 0.4 + me.attrs.agility / 220, counter: 0.3 + me.attrs.technical / 300, ally_save: 0.72, fight: 0.34 + me.attrs.striking / 300, pray: 0.22 }[id];
      const p = clamp(base - (strengthOf(att) - strengthOf(me)) / 220 + (me.stamina / me.max - 0.5) * 0.2, 0.05, 0.92);
      add(me, 'stamina', id === 'pray' ? 0 : -7);
      if (R.next() < p) {
        emit(s, 'rumble_survive', { id: me.id, attacker: att.id, how: id });
        add(me, 'momentum', 8);
        if (id === 'counter' && R.chance(0.35)) eliminate(s, att.id, me.id, 'reversal');
      } else eliminate(s, me.id, att.id, 'over the top rope');
    } else if (d.kind === 'team') {
      const partner = s.fighters[id.slice(5)];
      const accept = R.chance(partner.alignment === me.alignment ? 0.8 : 0.45);
      if (accept) { me.ally = partner.id; partner.ally = me.id; emit(s, 'rumble_team', { a: me.id, b: partner.id }); } else emit(s, 'rumble_refuse', { a: me.id, b: partner.id });
    } else {
      const [kind, target] = id.split(':');
      me.lurk = false;
      if (kind === 'elim' || kind === 'finisher' || kind === 'betray') {
        const V = s.fighters[target];
        let p = opt.p;
        add(me, 'stamina', kind === 'finisher' ? -12 : -8);
        if (kind === 'finisher') me.momentum = 20;
        emit(s, 'rumble_attempt', { id: me.id, target, kind });
        if (R.next() < p) { eliminate(s, V.id, me.id, kind === 'finisher' ? 'finisher' : kind === 'betray' ? 'betrayal' : 'over the top rope'); if (kind === 'betray') s.betrayed = V.id; }
        else {
          emit(s, 'rumble_fail', { id: me.id, target });
          me.dmg = clamp(me.dmg + 6, 0, 100);
          if (p < 0.35 && R.chance(0.12)) eliminate(s, me.id, V.id, 'reversal');
        }
      } else if (kind === 'brawl') { add(me, 'momentum', 7); add(me, 'stamina', -6); me.dmg = clamp(me.dmg + 3, 0, 100); const o = R.pick(s.ring.filter((x) => x !== me.id)); if (o) { const f = s.fighters[o]; f.dmg = clamp(f.dmg + 6, 0, 100); add(f, 'stamina', -6); } emit(s, 'rumble_brawl', { id: me.id }); }
      else if (kind === 'recover') { add(me, 'stamina', 14); me.hiding = 2; emit(s, 'rumble_recover', { id: me.id }); }
      else if (kind === 'rally') { add(me, 'momentum', 14); me.hiding = 0; emit(s, 'rumble_rally', { id: me.id }); }
      else if (kind === 'lurk') { me.lurk = true; add(me, 'stamina', 5); emit(s, 'rumble_lurk', { id: me.id }); }
      else if (kind === 'team') { s.pending = { kind: 'team' }; return s.events.slice(start); }
    }
    if (!s.result) this._tickFinish();
    this._settle();
    return s.events.slice(start);
  }

  _tickFinish() { /* end of the player's turn: nothing extra */ }

  /** advance the world until the player must decide (or the Rumble ends) */
  _settle() {
    const s = this.state, R = rngOf(s);
    let guard = 0;
    while (!s.result && !s.pending && guard++ < 400) {
      if (s.playerOut || (!s.playerId)) {
        // the player is out (or it is a pure AI sim): run the rest automatically
        this._worldTick(s, R);
      } else {
        this._worldTick(s, R);
        if (s.result) break;
        if (s.ring.includes(s.playerId)) {
          // threat check: are you being targeted this tick?
          const me = s.fighters[s.playerId];
          const others = s.ring.filter((x) => x !== s.playerId);
          const threat = (0.07 + others.length * 0.008 + (me.momentum > 70 ? 0.04 : 0) + (me.dmg / 500)) * (me.hiding > 0 ? 0.35 : 1) * (s.nextEntry >= N ? 1.5 : 1);
          if (others.length && R.next() < threat) {
            const att = R.weighted(others, (id) => Math.max(1, strengthOf(s.fighters[id])));
            emit(s, 'rumble_danger', { id: s.playerId, attacker: att });
            s.pending = { kind: 'danger', attacker: att };
          } else s.pending = { kind: 'action' };
        }
      }
      this._checkEnd(s);
    }
  }

  _worldTick(s, R) {
    s.tick += 1; s.t += s.nextEntry >= N ? 60 : s.interval;
    if (s.nextEntry < N) enterNext(s);
    aiBrawl(s, R);
    // safety: if somehow only one remains early, still require full entry
    this._checkEnd(s);
  }

  _checkEnd(s) {
    if (s.result) return;
    if (s.nextEntry >= N && s.ring.length === 1) {
      const w = s.fighters[s.ring[0]];
      const finalTwo = [w.id, ...Object.values(s.fighters).filter((f) => f.eliminatedBy === w.id && f.outAt === Math.max(...Object.values(s.fighters).filter((x) => x.out).map((x) => x.outAt))).map((f) => f.id)];
      const last = Object.values(s.fighters).filter((f) => f.out).sort((a, b) => b.outAt - a.outAt || b.seq - a.seq)[0];
      s.result = { winner: w.id, winnerName: w.name, runnerUp: last ? last.id : null, durationSec: s.t, entries: N };
      emit(s, 'rumble_end', { winner: w.id });
      s.over = true; s.pending = null;
    }
  }

  /** summary for the player's career record */
  playerSummary() {
    const s = this.state, me = s.fighters[s.playerId];
    if (!me) return null;
    const won = s.result && s.result.winner === me.id;
    const end = me.out ? me.outAt : s.t;
    const finalTwo = won || (s.result && s.result.runnerUp === me.id);
    return {
      year: s.year, won: !!won, entryNumber: me.entry, eliminations: me.elims, survivalSec: Math.round(end - (me.enteredAt ?? 0)), finalTwo: !!finalTwo,
      eliminatedBy: me.eliminatedBy, winner: s.result ? s.result.winner : null, entrants: N, betrayedAlly: s.betrayed || null,
    };
  }
}

export function narrateRumble(s, e) {
  const nm = (id) => (id && s.fighters[id] ? s.fighters[id].name : 'someone');
  switch (e.type) {
    case 'rumble_entry': return `#${e.number}: ${nm(e.id)} enters the ring. (${e.ring} in the ring)`;
    case 'rumble_elimination': return `${nm(e.victim)} is eliminated${e.by ? ` by ${nm(e.by)}` : ''} (${e.how}). ${e.remaining} remain.`;
    case 'rumble_attempt': return `${nm(e.id)} goes for ${nm(e.target)}${e.kind === 'finisher' ? ' with a finisher' : ''}!`;
    case 'rumble_fail': return `${nm(e.target)} hangs on! The attempt fails.`;
    case 'rumble_danger': return `${nm(e.attacker)} drives ${nm(e.id)} toward the ropes!`;
    case 'rumble_survive': return `${nm(e.id)} survives the attempt from ${nm(e.attacker)}!`;
    case 'rumble_team': return `${nm(e.a)} and ${nm(e.b)} join forces.`;
    case 'rumble_refuse': return `${nm(e.b)} wants no part of a partnership with ${nm(e.a)}.`;
    case 'rumble_brawl': return `${nm(e.id)} brawls in the middle of the ring.`;
    case 'rumble_recover': return `${nm(e.id)} slides into a corner to catch a breath.`;
    case 'rumble_rally': return `${nm(e.id)} fires up the crowd!`;
    case 'rumble_lurk': return `${nm(e.id)} watches and waits.`;
    case 'rumble_end': return `${nm(e.winner)} wins the Royal Rumble!`;
    default: return '';
  }
}
