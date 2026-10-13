// MatchEngine: the facade the UI, career layer and tests talk to.
//   engine.getDecision()  -> what the human (or strategy) must choose right now
//   engine.choose(id)     -> validates the choice against the *current* option list, resolves it,
//                            then runs AI decisions until a human decision (or the end) is reached.
// The full state is plain JSON (engine.toJSON()), so a match can be saved and resumed exactly.
import { deepClone } from '../core/util.js';
import { createMatchState, F, legalOf, opponentOf, partnerOf } from './state.js';
import {
  listActions, listStanceOptions, listPinOptions, listHoldHolderOptions, listHoldVictimOptions, listRiseOptions, listApronOptions,
} from './actions.js';
import {
  beginAttack, resolveTempo, resolveDefense, resolvePinChoice, resolveHoldHolder, resolveHoldVictim, resolveRise, resolveApron,
} from './resolve.js';
import { decideFor, PROFILES } from './ai.js';
import { registerMove, hasMove } from './moves.js';
import { other } from './rules.js';

export class MatchEngine {
  /** @param {object} stateOrCfg a match config (see createMatchState) or a saved state
   *  @param {object} opts { human: [ids] | 'auto' }  ids controlled by a person; default = [playerId] */
  constructor(stateOrCfg, opts = {}) {
    if (stateOrCfg.v === 1 && stateOrCfg.fighters) {
      this.state = stateOrCfg;
      for (const f of Object.values(this.state.fighters)) for (const spec of f.customSpecs || []) registerMove(spec);
    } else this.state = createMatchState(stateOrCfg);
    this.human = new Set(opts.human ?? (this.state.playerId ? [this.state.playerId] : []));
    this.overrides = {};
    for (const [id, pr] of Object.entries(opts.overrides || {})) {
      if (typeof pr === 'string' && !PROFILES[pr]) throw new Error(`unknown strategy profile ${pr}`);
      this.overrides[id] = typeof pr === 'string' ? PROFILES[pr] : pr; // per-fighter strategy (headless sims)
    }
    this._settle();
  }

  static fromJSON(json, opts) { return new MatchEngine(typeof json === 'string' ? JSON.parse(json) : deepClone(json), opts); }
  toJSON() { return this.state; }
  get result() { return this.state.result; }
  get over() { return !!this.state.result; }
  fighter(id) { return F(this.state, id); }

  /** Make sure `state.pending` points at the next required decision. */
  _ensurePending() {
    const s = this.state;
    if (s.result || s.pending) return;
    if (s.count) { s.pending = { kind: 'rise', actor: s.count.id }; return; }
    if (s.hold) { s.pending = { kind: 'hold_h', actor: s.hold.holder }; return; }
    if (s.pin) { s.pending = { kind: 'pin', actor: s.pin.pinned }; return; }
    let init = s.initiative;
    if (!F(s, init).legal) init = legalOf(s, F(s, init).side);
    s.initiative = init;
    s.pending = { kind: 'action', actor: init };
  }

  _apronFor() {
    const s = this.state;
    if (!s.rules.tag) return null;
    for (const id of this.human) {
      const f = s.fighters[id];
      if (!f || f.legal || f.pos !== 'apron') continue;
      if (s.pending?.kind === 'pin' && s.pin && s.pin.pinned === partnerOf(s, id) && !s.pin.apronAsked) return { id, pin: true };
      if (s.pending?.kind !== 'pin' && s.apronDone !== s.round && ['action', 'defense'].includes(s.pending?.kind)) return { id, pin: false };
    }
    return null;
  }

  /** The decision awaiting a choice, or null if the match is over. */
  getDecision() {
    const s = this.state;
    this._ensurePending();
    if (s.result || !s.pending) return null;
    const apron = this._apronFor();
    if (apron) {
      return this._decision('apron', apron.id, listApronOptions(s, apron.id, { pin: apron.pin }), { pin: apron.pin });
    }
    const p = s.pending;
    switch (p.kind) {
      case 'action': return this._decision('action', p.actor, listActions(s, p.actor), {});
      case 'defense': return this._decision('defense', p.actor, listStanceOptions(s, p.actor, p.attack), { attack: p.attack });
      case 'pin': return this._decision('pin', p.actor, listPinOptions(s, p.actor, s.pin), { pin: s.pin });
      case 'hold_h': return this._decision('hold_h', p.actor, listHoldHolderOptions(s, p.actor), { hold: s.hold });
      case 'hold_v': return this._decision('hold_v', p.actor, listHoldVictimOptions(s, p.actor, s.hold), { hold: s.hold, holderChoice: p.holderChoice });
      case 'rise': return this._decision('rise', p.actor, listRiseOptions(s, p.actor), { count: s.count });
      default: throw new Error(`unknown pending ${p.kind}`);
    }
  }

  _decision(kind, actor, options, context) {
    return { kind, actor, isHuman: this.human.has(actor), options, context, round: this.state.round, time: this.state.time };
  }

  /** Is the engine waiting on a human? */
  awaitingHuman() {
    const d = this.getDecision();
    return d && d.isHuman ? d : null;
  }

  choose(optionId) {
    const d = this.getDecision();
    if (!d) throw new Error('match is over');
    const opt = d.options.find((o) => o.id === optionId);
    if (!opt) throw new Error(`invalid choice "${optionId}" for ${d.kind}`);
    if (opt.enabled === false) throw new Error(`choice "${optionId}" is not available: ${opt.reason || 'disabled'}`);
    const start = this.state.events.length;
    this._apply(d, opt);
    this._settle();
    return this.state.events.slice(start);
  }

  _apply(d, opt) {
    const s = this.state;
    switch (d.kind) {
      case 'apron': {
        resolveApron(s, d.actor, opt.id);
        if (d.context.pin && s.pin) { s.pin.apronAsked = true; s.pending = { kind: 'pin', actor: s.pin.pinned }; }
        else if (!d.context.pin) s.pending = s.pending && !s.result ? s.pending : null;
        break;
      }
      case 'action':
        if (opt.kind === 'move') beginAttack(s, d.actor, opt.moveId);
        else { s.pending = null; resolveTempo(s, d.actor, opt.tempoId); }
        break;
      case 'defense': resolveDefense(s, opt.stanceId); break;
      case 'pin': resolvePinChoice(s, opt.id); break;
      case 'hold_h': resolveHoldHolder(s, opt.id); break;
      case 'hold_v': resolveHoldVictim(s, opt.id); break;
      case 'rise': resolveRise(s, opt.id); break;
      default: throw new Error(`cannot apply ${d.kind}`);
    }
  }

  /** Run AI/strategy decisions until a human must act or the match ends. */
  _settle(limit = 5000) {
    let guard = 0;
    while (!this.state.result && guard++ < limit) {
      const d = this.getDecision();
      if (!d) break;
      if (d.isHuman) return;
      const choice = decideFor(this.state, d, this.overrides[d.actor]);
      const opt = d.options.find((o) => o.id === choice && o.enabled !== false);
      if (!opt) throw new Error(`AI chose invalid option ${choice} (${d.kind})`);
      this._apply(d, opt);
    }
    if (guard >= limit) throw new Error('settle loop did not terminate');
  }

  /** Headless play: every fighter is driven by a strategy profile name or object. */
  static simulate(cfg, profiles = {}) {
    const overrides = {};
    const ids = cfg.sides.flat().map((p) => p.id);
    for (const id of ids) {
      const p = profiles[id];
      if (p) overrides[id] = typeof p === 'string' ? PROFILES[p] : p;
    }
    const e = new MatchEngine(cfg, { human: [], overrides });
    return e;
  }
}

export { createMatchState, opponentOf, other };
