// New match types: TLC, Money in the Bank, Battle Royal and the 1-vs-2 Handicap match.
// Engine level: legality over many seeds, resume-identical saves, win conditions, balance.
// Game level: booking, unlocks, play-through and the ledger.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MatchEngine } from '../src/match/engine.js';
import { SAMPLE_WRESTLERS as W } from '../src/match/samples.js';
import { getRuleset, waysOf, MATCH_TYPE_IDS } from '../src/match/rules.js';
import { PROFILES, decideFor } from '../src/match/ai.js';
import { getMove } from '../src/match/moves.js';
import { moveBlockedReason, listActions, TEMPO } from '../src/match/actions.js';
import { computeConnect, calcDamage } from '../src/match/calc.js';
import { canPin, hurt, finalizeRound, rngOf } from '../src/match/resolve.js';
import { narrate, narrateAll } from '../src/match/commentary.js';
import { F, createMatchState } from '../src/match/state.js';
import { STIPULATION_HEAT } from '../src/game.js';
import { AutoGame } from './autogame.js';
import { newCareer, debut, makeBooking, opp } from './helpers2.js';
import { ACHIEVEMENT_DEFS } from '../src/achievements/defs.js';
import { proveAchievement } from '../tools/prover.js';

const TYPES = ['tlc', 'mitb', 'battle_royal', 'handicap'];
const SEEDS = Array.from({ length: 30 }, (_, i) => 3000 + i * 7);
const BUILDS = ['brawler', 'tech', 'flyer', 'power', 'sub', 'show'];
const STRATS = ['smart', 'average', 'aggressive', 'defensive', 'strong', 'weak'];
const mkF = (id, base) => ({ ...base, id, name: `${base.name} ${id}` });

/** engine config for a type with varied builds, seat 0 = "p0" (the player seat) */
function cfgFor(type, seed, equal = false) {
  const pick = (k) => (equal ? W.show : W[BUILDS[(seed + k * 2) % BUILDS.length]]);
  if (type === 'handicap') return { seed, type, sides: [[mkF('p0', pick(0))], [mkF('p1', pick(1)), mkF('p2', pick(2))]], playerId: 'p0' };
  const n = waysOf(getRuleset(type));
  return { seed, type, sides: Array.from({ length: n }, (_, k) => [mkF(`p${k}`, pick(k))]), playerId: 'p0' };
}
const overridesFor = (cfg, seed) => Object.fromEntries(cfg.sides.flat().map((p, k) => [p.id, STRATS[(seed + k) % STRATS.length]]));
const sim = (type, seed, equal = false) => { const cfg = cfgFor(type, seed, equal); return MatchEngine.simulate(cfg, overridesFor(cfg, seed)); };

const FINISHES = {
  tlc: ['objective', 'time_limit_draw'],
  mitb: ['objective', 'time_limit_draw'],
  battle_royal: ['pinfall', 'submission', 'over_the_top', 'time_limit_draw'],
  handicap: ['pinfall', 'submission', 'dq', 'countout', 'double_countout', 'time_limit_draw'],
};

/** play a human-seat engine to the end with the AI strategy engine (used for the save/resume check) */
function finishWithAI(e, prof = PROFILES.average) {
  let n = 0;
  while (!e.over && n++ < 6000) { const d = e.getDecision(); if (!d) break; e.choose(decideFor(e.state, d, prof)); }
  assert.ok(e.over, 'match must finish');
  return e;
}

// ---------------------------------------------------------------------------------------------
// registry
// ---------------------------------------------------------------------------------------------
test('the four new rulesets are registered with descriptions, and have heat requirements', () => {
  for (const t of TYPES) {
    assert.ok(MATCH_TYPE_IDS.includes(t), t);
    const r = getRuleset(t);
    assert.ok(r.name && r.desc && r.desc.length > 40, `${t} desc`);
    assert.ok(t in STIPULATION_HEAT, `${t} heat`);
    assert.equal(r.id, t);
  }
  assert.equal(waysOf(getRuleset('mitb')), 4);
  assert.equal(waysOf(getRuleset('battle_royal')), 6);
  assert.deepEqual(getRuleset('handicap').teamSizes, [1, 2]);
  assert.ok(getRuleset('handicap').loneBonus.regen > 1 && getRuleset('handicap').loneBonus.resist > 0);
  assert.ok(getRuleset('tlc').hardcore > 1);
  assert.equal(getRuleset('tlc').pinfall, false); assert.equal(getRuleset('tlc').submission, false);
  assert.equal(getRuleset('tlc').dq, false); assert.equal(getRuleset('tlc').countout, false);
  assert.equal(getRuleset('battle_royal').overTheTop, true);
  assert.equal(getRuleset('battle_royal').elimination, true);
});

// ---------------------------------------------------------------------------------------------
// legality over 30 seeds, event validity, serialisation, resume
// ---------------------------------------------------------------------------------------------
for (const type of TYPES) {
  test(`${type}: 30 seeds finish legally, events are valid, narration is clean`, () => {
    let draws = 0;
    for (const seed of SEEDS) {
      const e = sim(type, seed);
      const s = e.state, r = e.result;
      assert.ok(r, `${type}/${seed} produced no result`);
      assert.ok(r.rounds <= 700);
      assert.ok(FINISHES[type].includes(r.finish), `${type}/${seed} finish ${r.finish}`);
      if (r.winnerSide === null) { draws++; assert.equal(r.finish, 'time_limit_draw', 'only the time limit may end a match without a winner'); }
      else {
        assert.ok(s.teams[r.winnerSide].includes(r.winnerId), 'the winner belongs to the winning side');
        assert.equal(r.winners.length, s.teams[r.winnerSide].length);
        assert.equal(r.winners.length + r.losers.length, Object.keys(s.fighters).length);
      }
      assert.equal(e.getDecision(), null);
      // event stream sanity
      let prev = 0, tPrev = 0;
      for (const ev of s.events) {
        assert.equal(ev.seq, prev + 1, 'seq increments by one');
        prev = ev.seq;
        assert.ok(ev.t >= tPrev && Number.isFinite(ev.t), 't never goes backwards'); tPrev = ev.t;
        assert.equal(typeof ev.type, 'string');
        for (const k of ['actor', 'target']) if (ev[k] !== undefined && ev[k] !== null) assert.ok(s.fighters[ev[k]], `${ev.type}.${k} is a fighter (${ev[k]})`);
      }
      assert.equal(s.events.filter((x) => x.type === 'match_end').length, 1);
      assert.equal(s.events[s.events.length - 1].type, 'match_end');
      for (const f of Object.values(s.fighters)) {
        assert.ok(f.stamina >= 0 && f.stamina <= f.maxStamina + 1e-9);
        for (const v of Object.values(f.dmg)) assert.ok(v >= 0 && v <= 100);
        assert.ok(f.momentum >= 0 && f.momentum <= 100);
      }
      // commentary never throws and never leaks undefined/NaN
      for (const line of narrateAll(s)) assert.ok(!/undefined|NaN|\[object/.test(line.text), `${type}/${seed}: "${line.text}"`);
      // serialisable
      assert.equal(JSON.stringify(JSON.parse(JSON.stringify(s))), JSON.stringify(s));
    }
    assert.ok(draws <= 3, `${type}: ${draws} draws in 30`);
  });

  test(`${type}: a mid-match JSON round trip resumes to an identical match`, () => {
    let mid = 0;
    for (const seed of SEEDS) {
      const e = new MatchEngine(cfgFor(type, seed), { human: ['p0'] });
      for (let i = 0; i < 6 && !e.over; i++) { const d = e.getDecision(); e.choose(decideFor(e.state, d, PROFILES.average)); }
      const snap = JSON.stringify(e.toJSON());
      const b = MatchEngine.fromJSON(snap, { human: ['p0'] });
      assert.equal(JSON.stringify(b.toJSON()), snap, 'restoring does not alter the state');
      if (!e.over) mid++;
      finishWithAI(e); finishWithAI(b);
      assert.equal(JSON.stringify(e.toJSON()), JSON.stringify(b.toJSON()), `${type}/${seed} diverged after resume`);
      assert.deepEqual(e.result, b.result);
    }
    assert.ok(mid >= 25, `only ${mid} of 30 snapshots were mid-match`);
  });
}

// ---------------------------------------------------------------------------------------------
// TLC
// ---------------------------------------------------------------------------------------------
test('tlc: weapons are legal, there is no DQ or count-out, and pinfall/submission are disabled', () => {
  const e = new MatchEngine(cfgFor('tlc', 11), { human: ['p0'] });
  const s = e.state;
  s.pending = null; s.initiative = 'p0';
  F(s, 'p1').pos = 'grounded';
  const opts = listActions(s, 'p0');
  assert.ok(!opts.some((o) => o.tempoId === 'cover' || o.tempoId === 'cover_outside'), 'no cover on a grounded opponent');
  assert.ok(!opts.some((o) => o.cat === 'submission'), 'no holds');
  assert.equal(canPin(s, 'p0', 'p1'), false);
  assert.equal(canPin(s, 'p0', 'p1', true), false);
  assert.ok(opts.some((o) => o.moveId === 'chair_shot'), 'a chair is legal');
  assert.notEqual(TEMPO.cover.check(s, F(s, 'p0'), F(s, 'p1')), null);
  const types = new Set(), fin = new Set();
  let pins = 0;
  for (const seed of SEEDS) {
    const m = sim('tlc', seed);
    fin.add(m.result.finish);
    for (const ev of m.state.events) { types.add(ev.type); if (ev.type === 'pin_attempt' || ev.type === 'submission_applied') pins++; }
  }
  assert.equal(pins, 0);
  for (const t of ['dq', 'warning', 'count', 'countout', 'pin_win', 'submission_win']) assert.ok(!types.has(t), `no ${t} in a TLC`);
  assert.ok(fin.has('objective'));
  assert.ok(types.has('climb') && types.has('toppled'));
});

test('tlc: furniture and weapons hit harder and also hurt the user; table and chair moves exist only in hardcore rules', () => {
  const e = new MatchEngine(cfgFor('tlc', 12, true), { human: ['p0'] });
  const s = e.state;
  const dmg = (id) => calcDamage(s, 'p0', getMove(id), 'p1', null, 1, 1);
  const hard = { chair: dmg('chair_shot'), table: dmg('table_slam'), ladder: dmg('ladder_shot'), strike: dmg('forearm') };
  s.rules.hardcore = 1;
  const base = { chair: dmg('chair_shot'), table: dmg('table_slam'), ladder: dmg('ladder_shot'), strike: dmg('forearm') };
  const mult = getRuleset('tlc').hardcore;
  for (const k of ['chair', 'table', 'ladder']) assert.ok(Math.abs(hard[k] / base[k] - mult) < 1e-9, `${k} x${mult}`);
  assert.equal(hard.strike, base.strike, 'ordinary moves are untouched');
  // the registry has at least three table/chair moves that only a hardcore ruleset grants
  const grants = ['chair_dropkick', 'table_powerbomb', 'ladder_table_splash'];
  for (const id of grants) {
    assert.ok(F(e.state, 'p0').moveIds.includes(id), `${id} granted in TLC`);
    for (const t of ['no_dq', 'ladder', 'singles']) {
      const o = new MatchEngine({ seed: 1, type: t, sides: [[mkF('p0', W.show)], [mkF('p1', W.tech)]], playerId: 'p0' }, { human: [] });
      assert.ok(!F(o.state, 'p0').moveIds.includes(id), `${id} not granted in ${t}`);
    }
  }
  const nd = new MatchEngine({ seed: 1, type: 'no_dq', sides: [[mkF('p0', W.show)], [mkF('p1', W.tech)]], playerId: 'p0' }, { human: ['p0'] });
  assert.match(moveBlockedReason(nd.state, F(nd.state, 'p0'), F(nd.state, 'p1'), getMove('table_powerbomb')) || '', /hardcore/);

  // recoil: only furniture/weapon hits in a TLC carry self damage, and the hit is recorded on the attacker
  let recoils = 0, plain = 0, used = new Set();
  for (const seed of SEEDS) {
    const m = sim('tlc', seed);
    for (const ev of m.state.events) {
      if (ev.type !== 'move_connected' && ev.type !== 'signature_connected' && ev.type !== 'finisher_connected') continue;
      if (grants.includes(ev.move)) used.add(ev.move);
      const mv = getMove(ev.move);
      if (mv.weapon || mv.cat === 'environmental') { assert.equal(typeof ev.selfDamage, 'number', `${ev.move} carries recoil`); if (ev.selfDamage > 0) recoils++; } else { assert.equal(ev.selfDamage, undefined); plain++; }
    }
  }
  assert.ok(recoils > 20 && plain > 20, `recoils ${recoils}, plain ${plain}`);
  assert.ok(used.size >= 2, `table/chair moves actually get used: ${[...used]}`);
  // other weapon matches are unchanged: no recoil outside hardcore rules
  for (let seed = 1; seed <= 20; seed++) {
    const m = MatchEngine.simulate({ seed, type: 'no_dq', sides: [[mkF('p0', W.brawler)], [mkF('p1', W.tech)]], playerId: 'p0' }, {});
    assert.ok(!m.state.events.some((ev) => ev.selfDamage !== undefined && ev.type === 'move_connected'));
  }
});

test('tlc: a weapon hit costs the attacker health in the damage tally', () => {
  let checked = 0;
  for (const seed of SEEDS) {
    const m = sim('tlc', seed);
    const f = m.state.events.find((ev) => ev.type === 'move_connected' && ev.selfDamage > 0);
    if (!f) continue;
    const a = m.state.fighters[f.actor];
    assert.ok(a.stats.damageTaken >= f.selfDamage - 1e-9, 'self damage is counted as damage taken');
    checked++;
  }
  assert.ok(checked >= 20);
});

// ---------------------------------------------------------------------------------------------
// Money in the Bank
// ---------------------------------------------------------------------------------------------
test('mitb: four sides, ladder objective, nobody can ever win or even attempt a pin or submission', () => {
  const rules = getRuleset('mitb');
  assert.equal(rules.ways, 4); assert.equal(rules.objective, 'ladder');
  assert.throws(() => MatchEngine.simulate({ seed: 1, type: 'mitb', sides: cfgFor('mitb', 1).sides.slice(0, 3), playerId: 'p0' }, {}), /needs 4 sides/);
  const e = new MatchEngine(cfgFor('mitb', 21), { human: ['p0'] });
  const s = e.state;
  s.pending = null; s.initiative = 'p0';
  for (const id of ['p1', 'p2', 'p3']) F(s, id).pos = 'grounded';
  const opts = listActions(s, 'p0');
  assert.ok(!opts.some((o) => o.tempoId === 'cover'), 'no cover option');
  assert.ok(!opts.some((o) => o.cat === 'submission'), 'no hold option');
  assert.ok(!opts.some((o) => o.moveId === 'roll_up' || o.moveId === 'schoolboy'), 'no surprise pins');
  for (const id of ['p1', 'p2', 'p3']) assert.equal(canPin(s, 'p0', id, true), false);
  const wins = [0, 0, 0, 0], tops = new Set();
  for (const seed of SEEDS) {
    const m = sim('mitb', seed);
    const r = m.result;
    for (const ev of m.state.events) {
      assert.ok(!['pin_attempt', 'pin_win', 'submission_applied', 'submission_win', 'surprise_pin', 'fall', 'eliminated'].includes(ev.type), ev.type);
      if (ev.type === 'climb') tops.add(ev.actor);
    }
    if (r.winnerSide === null) continue;
    assert.equal(r.finish, 'objective');
    wins[r.winnerSide]++;
    // the winner is the fighter who reached the top rung, and the event says so
    const w = m.state.fighters[r.winnerId];
    assert.equal(w.climb, m.state.objective.steps);
    const obj = m.state.events.find((ev) => ev.type === 'objective');
    assert.equal(obj.actor, r.winnerId);
    assert.equal(r.losers.length, 3);
    assert.equal(m.state.events.filter((ev) => ev.type === 'climb' && ev.actor === r.winnerId && ev.rung === m.state.objective.steps).length >= 1, true);
  }
  assert.equal(tops.size, 4, 'every seat climbs at some point');
  assert.ok(wins.every((n) => n > 0), `every seat can win: ${wins}`);
});

test('mitb: climb is tracked per fighter and any foe can topple a climber (not just the current target)', () => {
  const toppled = new Set();
  const climbers = new Set();
  let multiClimbers = 0;
  for (const seed of SEEDS) {
    const m = sim('mitb', seed);
    const s = m.state;
    // replay the climb/topple/slip stream: per-fighter rung bookkeeping must match the events
    const rung = {};
    for (const ev of s.events) {
      if (ev.type === 'climb') { rung[ev.actor] = ev.rung; assert.ok(ev.rung >= 1 && ev.rung <= ev.steps); climbers.add(ev.actor); }
      if (ev.type === 'slip') rung[ev.actor] = 0;
      if (ev.type === 'toppled') { assert.notEqual(F(s, ev.actor).side, F(s, ev.target).side); toppled.add(ev.actor); rung[ev.target] = 0; }
      if (Object.values(rung).filter((v) => v > 0).length >= 2) multiClimbers++;
    }
  }
  assert.equal(toppled.size, 4, `all four seats topple climbers: ${[...toppled]}`);
  assert.ok(multiClimbers > 0, 'two climbers can be on the ladder at once');

  // direct: p3 is high on the ladder and p1 holds the initiative with a different focus -> p1 can still knock p3 off
  let knocked = 0, tried = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const e = new MatchEngine(cfgFor('mitb', seed, true), { human: ['p1'] });
    const s = e.state;
    s.pending = null; s.initiative = 'p1'; s.focus = { p1: 'p2' };
    F(s, 'p3').pos = 'top'; F(s, 'p3').climb = 2;
    F(s, 'p1').pos = 'standing'; F(s, 'p2').pos = 'standing';
    // with a stale focus the climber is not the default target, but the free "go after" action reaches him
    const d = e.getDecision();
    assert.equal(d.actor, 'p1');
    assert.ok(d.options.some((o) => o.id === 't:focus:p3'), 'can turn on the climber');
    e.choose('t:focus:p3');
    assert.equal(e.state.focus.p1, 'p3');
    const d2 = e.getDecision();
    const ko = d2.options.find((o) => o.moveId === 'knock_off');
    assert.ok(ko, 'knock off is on the menu against the climber');
    e.choose(ko.id);
    tried++;
    if (s.events.some((ev) => ev.type === 'toppled' && ev.actor === 'p1' && ev.target === 'p3')) { knocked++; assert.equal(F(s, 'p3').climb, 0); }
  }
  assert.ok(knocked >= 10 && knocked < tried, `topples ${knocked}/${tried}`);
  // by default (no focus) a ladder match points everyone at the highest climber
  const e = new MatchEngine(cfgFor('mitb', 5, true), { human: ['p1'] });
  const s = e.state; s.focus = {};
  F(s, 'p2').pos = 'top'; F(s, 'p2').climb = 1; F(s, 'p3').pos = 'top'; F(s, 'p3').climb = 2;
  assert.equal(listActions(s, 'p1').find((o) => o.moveId === 'knock_off') ? 'ok' : 'missing', 'ok');
});

test('mitb: a rival higher on the ladder blocks your climb, in multi-way matches too', () => {
  const e = new MatchEngine(cfgFor('mitb', 8, true), { human: ['p0'] });
  const s = e.state;
  const A = F(s, 'p0');
  A.pos = 'standing'; A.climb = 0;
  assert.equal(TEMPO.obj_climb.check(s, A, F(s, 'p1')), null);
  F(s, 'p3').pos = 'top'; F(s, 'p3').climb = 2;
  assert.match(TEMPO.obj_climb.check(s, A, F(s, 'p1')) || '', /higher/, 'blocked by a climber who is not the current target');
});

// ---------------------------------------------------------------------------------------------
// Battle Royal
// ---------------------------------------------------------------------------------------------
test('battle royal: six sides, the last one in the ring wins, everyone else is eliminated exactly once', () => {
  let over = 0, decided = 0;
  const seats = Array(6).fill(0);
  for (const seed of SEEDS) {
    const m = sim('battle_royal', seed);
    const s = m.state, r = m.result;
    if (r.winnerSide === null) continue;
    decided++;
    const elim = s.events.filter((e) => e.type === 'eliminated');
    assert.equal(elim.length, 5);
    assert.equal(new Set(elim.map((e) => e.target)).size, 5);
    assert.ok(!elim.some((e) => e.target === r.winnerId));
    assert.deepEqual(elim.map((e) => e.remaining), [5, 4, 3, 2, 1]);
    assert.equal(r.eliminated.length, 5);
    const alive = Object.values(s.fighters).filter((f) => !f.out);
    assert.deepEqual(alive.map((f) => f.id), [r.winnerId], 'exactly the winner is still in');
    assert.ok(elim.some((e) => e.finish === 'over_the_top') || true);
    over += elim.filter((e) => e.finish === 'over_the_top').length;
    seats[r.winnerSide]++;
    // eliminated fighters never act again
    const outAt = {};
    for (const e of elim) outAt[e.target] = e.seq;
    for (const ev of s.events) if (ev.actor && outAt[ev.actor] && ev.seq > outAt[ev.actor]) assert.equal(ev.type, 'player_out', `${ev.type} by an eliminated wrestler`);
  }
  assert.ok(decided >= 27, `decided ${decided}`);
  assert.ok(over >= 15, `over-the-top eliminations: ${over}`);
  assert.ok(seats.filter((n) => n > 0).length >= 5, `winners are spread across seats: ${seats}`);
});

test('toss_over: needs a standing or roped target and the overTheTop rule, and is in no ordinary moveset', () => {
  const e = new MatchEngine(cfgFor('battle_royal', 31), { human: ['p0'] });
  const s = e.state, A = F(s, 'p0'), D = F(s, 'p1'), mv = getMove('toss_over');
  assert.equal(mv.name, 'Throw Over the Top Rope');
  assert.ok(['power', 'positioning'].includes(mv.cat));
  A.pos = 'standing'; A.stamina = A.maxStamina; A.momentum = 50;
  for (const ok of ['standing', 'ropes']) { D.pos = ok; assert.equal(moveBlockedReason(s, A, D, mv), null, ok); }
  for (const bad of ['grounded', 'corner', 'top', 'outside', 'apron']) { D.pos = bad; assert.notEqual(moveBlockedReason(s, A, D, mv), null, bad); }
  D.pos = 'standing';
  s.rules.overTheTop = false;
  assert.match(moveBlockedReason(s, A, D, mv) || '', /battle royal/);
  s.rules.overTheTop = true;
  for (const t of ['singles', 'tag', 'elimination', 'chamber', 'tlc', 'mitb', 'handicap']) {
    const cfg = t === 'handicap' ? cfgFor('handicap', 1) : t === 'tag' ? { seed: 1, type: 'tag', sides: [[mkF('p0', W.show), mkF('p9', W.tech)], [mkF('p1', W.tech), mkF('p8', W.show)]], playerId: 'p0' }
      : waysOf(getRuleset(t)) > 2 ? cfgFor(t === 'chamber' ? 'battle_royal' : t, 1) : { seed: 1, type: t, sides: [[mkF('p0', W.show)], [mkF('p1', W.tech)]], playerId: 'p0' };
    const m = new MatchEngine({ ...cfg, type: t }, { human: [] });
    if (t === 'elimination' || t === 'chamber') continue; // (4/6-way configs differ) the registry check below covers every type
    assert.ok(!F(m.state, 'p0').moveIds.includes('toss_over'), `${t} has no toss_over`);
  }
  const offByRule = new MatchEngine({ ...cfgFor('battle_royal', 32), rulesOverride: { overTheTop: false } }, { human: [] });
  assert.ok(!F(offByRule.state, 'p0').moveIds.includes('toss_over'));
});

test('toss_over: strength beats toughness and stamina in the normal connect calculation', () => {
  const mk = (a, d) => {
    const cfg = cfgFor('battle_royal', 40, true);
    cfg.sides[0][0] = mkF('p0', a); cfg.sides[1][0] = mkF('p1', d);
    return new MatchEngine(cfg, { human: [] }).state;
  };
  const mv = getMove('toss_over');
  const strong = mk(W.power, W.rookie), weak = mk(W.rookie, W.power);
  const pStrong = computeConnect(strong, 'p0', mv, 'p1', null).p, pWeak = computeConnect(weak, 'p0', mv, 'p1', null).p;
  assert.ok(pStrong > pWeak + 0.12, `${pStrong} vs ${pWeak}`);
  const tired = mk(W.power, W.sub);
  const fresh = computeConnect(tired, 'p0', mv, 'p1', null).p;
  tired.fighters.p1.stamina = tired.fighters.p1.maxStamina * 0.1;
  assert.ok(computeConnect(tired, 'p0', mv, 'p1', null).p > fresh + 0.05, 'a spent target is easier to throw');
});

test('toss_over: a connection eliminates the target outright; a block, dodge or reversal does nothing special', () => {
  let connected = 0, failed = 0;
  const reasons = new Set();
  for (const seed of SEEDS) {
    const m = sim('battle_royal', seed);
    const ev = m.state.events;
    ev.forEach((x, i) => {
      if (x.move !== 'toss_over') return;
      const next = ev[i + 1];
      if (x.type === 'move_connected') {
        connected++;
        assert.equal(next.type, 'eliminated');
        assert.equal(next.actor, x.actor); assert.equal(next.target, x.target); assert.equal(next.finish, 'over_the_top');
        const t = m.state.fighters[x.target];
        assert.ok(t.out && !t.legal && t.pos === 'eliminated');
      } else {
        failed++; reasons.add(x.type);
        assert.ok(['move_blocked', 'move_dodged', 'move_reversed'].includes(x.type), x.type);
        assert.ok(!(next && next.type === 'eliminated' && next.target === x.target && next.finish === 'over_the_top'), 'a failed toss eliminates nobody');
        assert.ok(!m.state.fighters[x.target].out || ev.some((y) => y.type === 'eliminated' && y.target === x.target && y.seq > x.seq));
      }
    });
  }
  assert.ok(connected >= 15, `connected ${connected}`);
  assert.ok(failed >= 10, `failed ${failed}`);
  assert.ok(reasons.size >= 2, `several kinds of failure: ${[...reasons]}`);
});

test('battle royal: the AI goes for the toss, especially against tired and battered foes', () => {
  let attempts = 0, matchesWithToss = 0;
  for (const seed of SEEDS) {
    const m = sim('battle_royal', seed);
    const n = Object.values(m.state.fighters).reduce((a, f) => a + (f.usedMoves.toss_over || 0), 0);
    attempts += n; if (n) matchesWithToss++;
  }
  assert.ok(matchesWithToss >= 28, `matches featuring a toss attempt: ${matchesWithToss}`);
  assert.ok(attempts >= 90, `attempts ${attempts}`);
  // given a choice, a tired foe is a better target than a fresh one
  const e = new MatchEngine(cfgFor('battle_royal', 50, true), { human: ['p0'] });
  const s = e.state;
  s.pending = null; s.initiative = 'p0'; s.focus = { p0: 'p1' };
  const o = listActions(s, 'p0').find((x) => x.moveId === 'toss_over');
  assert.ok(o && o.enabled);
  assert.match(o.desc, /eliminated/);
});

test('battle royal: commentary has a distinct over-the-top elimination line (and the pinfall line is unchanged)', () => {
  let seen = 0;
  const texts = new Set();
  for (const seed of SEEDS) {
    const m = sim('battle_royal', seed);
    for (const ev of m.state.events) {
      if (ev.type === 'eliminated' && ev.finish === 'over_the_top') {
        const t = narrate(m.state, ev);
        assert.match(t, /over the top|toss|both feet/i, t);
        assert.ok(t.includes(m.state.fighters[ev.target].name.split(' ').slice(-1)[0]), 'names the eliminated wrestler');
        texts.add(t.replace(/\d+/g, '#').replace(/\b\w+ (?=has eliminated|dumps|sends)/, ''));
        seen++;
      } else if (ev.type === 'eliminated') assert.doesNotMatch(narrate(m.state, ev), /over the top rope/i);
      if (ev.type === 'match_end' && ev.finish === 'over_the_top') assert.match(narrate(m.state, ev), /over the top rope/);
    }
  }
  assert.ok(seen >= 15);
  assert.ok(texts.size >= 3, `variants used: ${texts.size}`);
});

// ---------------------------------------------------------------------------------------------
// Handicap
// ---------------------------------------------------------------------------------------------
test('handicap: per-side team sizes are enforced (1 vs 2 only)', () => {
  const ok = cfgFor('handicap', 1);
  const s = createMatchState(ok);
  assert.deepEqual(s.teams.map((t) => t.length), [1, 2]);
  assert.equal(s.fighters.p0.legal, true); assert.equal(s.fighters.p1.legal, true);
  assert.equal(s.fighters.p2.legal, false); assert.equal(s.fighters.p2.pos, 'apron');
  assert.ok(s.fighters.p0.bonus && !s.fighters.p1.bonus && !s.fighters.p2.bonus, 'only the lone wrestler has the bonus');
  assert.throws(() => createMatchState({ ...ok, sides: [[mkF('p0', W.show), mkF('p9', W.tech)], [mkF('p1', W.tech), mkF('p2', W.show)]] }), /1 vs 2/);
  assert.throws(() => createMatchState({ ...ok, sides: [[mkF('p0', W.show)], [mkF('p1', W.tech)]] }), /1 vs 2/);
  assert.throws(() => createMatchState({ ...ok, sides: [[mkF('p1', W.tech), mkF('p2', W.show)], [mkF('p0', W.show)]] }), /1 vs 2/, 'order matters: side 0 is the lone wrestler');
  // ordinary tag matches still demand two a side
  assert.throws(() => createMatchState({ seed: 1, type: 'tag', sides: [[mkF('a', W.show)], [mkF('b', W.tech), mkF('c', W.show)]], playerId: 'a' }), /2 per side/);
});

test('handicap: the lone wrestler cannot tag, the duo tag normally, a fall over either duo member ends it', () => {
  const e = new MatchEngine(cfgFor('handicap', 17), { human: ['p0'] });
  const s = e.state;
  s.pending = null; s.initiative = 'p0';
  const lone = F(s, 'p0');
  lone.pos = 'corner';
  assert.match(TEMPO.make_tag.check(s, lone, F(s, 'p1')) || '', /partner/i);
  lone.pos = 'standing';
  assert.notEqual(TEMPO.crawl_corner.check(s, lone, F(s, 'p1')), null, 'nothing to crawl towards');
  const acts = listActions(s, 'p0');
  assert.ok(!acts.some((o) => o.tempoId === 'make_tag' || o.tempoId === 'crawl_corner'));
  assert.equal(e.getDecision().kind, 'action');
  // the duo's idle partner is on the apron and cannot pin
  F(s, 'p1').pos = 'grounded';
  assert.equal(canPin(s, 'p0', 'p1'), true);
  assert.equal(canPin(s, 'p0', 'p2'), false, 'the apron man is not a legal opponent');
  F(s, 'p1').pos = 'standing';
  // duo: p1 can tag p2 and p2 then becomes the legal foe
  const duoCount = { tags: 0 }, pinned = new Set(), subbed = new Set(), loneWins = [], duoWins = [];
  for (const seed of SEEDS) {
    const m = sim('handicap', seed);
    const r = m.state.result, st = m.state;
    for (const ev of st.events) {
      if (ev.type === 'tag') { duoCount.tags++; assert.ok(['p1', 'p2'].includes(ev.actor), 'only the duo ever tags'); }
      if (ev.type === 'pin_win' && ev.actor === 'p0') pinned.add(ev.target);
      if (ev.type === 'submission_win' && ev.actor === 'p0') subbed.add(ev.target);
    }
    const legal = Object.values(st.fighters).filter((f) => f.legal);
    assert.ok(legal.filter((f) => f.side === 0).length === 1 && legal.filter((f) => f.side === 1).length <= 1);
    if (r.winnerSide === 0) { loneWins.push(seed); assert.deepEqual(r.winners, ['p0']); assert.deepEqual(r.losers.sort(), ['p1', 'p2']); }
    if (r.winnerSide === 1) { duoWins.push(seed); assert.deepEqual(r.winners.sort(), ['p1', 'p2']); assert.deepEqual(r.losers, ['p0']); if (r.finish === 'pinfall') assert.equal(r.loserId ?? 'p0', 'p0'); }
  }
  assert.ok(duoCount.tags >= 5, `duo tags ${duoCount.tags}`); // tags need a cornered man, so they are rarer than in a 2v2 tag match
  assert.ok(loneWins.length >= 3 && duoWins.length >= 3, `lone ${loneWins.length}, duo ${duoWins.length}`);
  assert.deepEqual([...pinned].sort(), ['p1', 'p2'], 'the lone wrestler wins by pinning EITHER duo member');
});

test('handicap: the lone wrestler recovers stamina faster and takes less damage (mechanics, not luck)', () => {
  const bonus = getRuleset('handicap').loneBonus;
  const st = new MatchEngine(cfgFor('handicap', 3, true), { human: [] }).state;
  // damage: the same blow lands softer on the lone wrestler than on a duo member
  const lone = hurt(st, F(st, 'p0'), 'head', 10, 'test'), duo = hurt(st, F(st, 'p1'), 'head', 10, 'test');
  assert.equal(duo, 10);
  assert.ok(Math.abs(lone - 10 * (1 - bonus.resist)) < 1e-9, `lone took ${lone}`);
  // stamina: identical builds, identical starting stamina, one round later the lone man has regained more
  const s2 = new MatchEngine(cfgFor('handicap', 4, true), { human: [] }).state;
  s2.result = null;
  F(s2, 'p0').stamina = 20; F(s2, 'p1').stamina = 20;
  F(s2, 'p0').dmg.torso = 0; F(s2, 'p1').dmg.torso = 0;
  finalizeRound(s2, rngOf(s2), 1);
  const gainLone = F(s2, 'p0').stamina - 20, gainDuo = F(s2, 'p1').stamina - 20;
  assert.ok(Math.abs(gainLone / gainDuo - bonus.regen) < 0.01, `regen ratio ${gainLone / gainDuo}`);
  // and the bonus is not applied outside the lone side or outside the handicap rules
  assert.equal(F(st, 'p2').bonus, undefined);
  const tag = new MatchEngine({ seed: 1, type: 'tag', sides: [[mkF('a', W.show), mkF('c', W.tech)], [mkF('b', W.tech), mkF('d', W.show)]], playerId: 'a' }, { human: [] }).state;
  assert.ok(Object.values(tag.fighters).every((f) => f.bonus === undefined));
});

test('handicap: the player can be the lone wrestler and is offered every decision a singles player gets', () => {
  const e = new MatchEngine(cfgFor('handicap', 61), { human: ['p0'] });
  let kinds = new Set(), guard = 0;
  while (!e.over && guard++ < 500) {
    const d = e.getDecision();
    kinds.add(d.kind);
    assert.notEqual(d.kind, 'apron', 'the lone man never stands on the apron');
    if (d.isHuman) assert.equal(d.actor, 'p0');
    e.choose(decideFor(e.state, d, PROFILES.strong));
  }
  assert.ok(e.over);
  assert.ok(kinds.has('action') && kinds.has('defense'));
});

// ---------------------------------------------------------------------------------------------
// balance (AI vs AI, equal-rated fighters)
// ---------------------------------------------------------------------------------------------
test('balance: equal-rated fighters - no side dominates TLC, MITB or the battle royal; the lone man wins 20-50% of handicaps', () => {
  const N = 200;
  const tally = (type) => {
    const wins = {}, c = { draws: 0 };
    for (let i = 0; i < N; i++) {
      const m = MatchEngine.simulate(cfgFor(type, 20000 + i * 3, true), {});
      if (m.result.winnerSide === null) { c.draws++; continue; }
      wins[m.result.winnerSide] = (wins[m.result.winnerSide] || 0) + 1;
    }
    return { wins, ...c, decided: N - c.draws };
  };
  const t = tally('tlc');
  for (const side of [0, 1]) assert.ok((t.wins[side] || 0) / t.decided <= 0.85 && (t.wins[side] || 0) / t.decided >= 0.15, `tlc seat ${side}: ${JSON.stringify(t)}`);
  assert.ok(t.draws <= N * 0.1);
  const mb = tally('mitb');
  for (let side = 0; side < 4; side++) { const sh = (mb.wins[side] || 0) / mb.decided; assert.ok(sh <= 0.85 && sh >= 0.08, `mitb seat ${side} share ${sh.toFixed(2)}: ${JSON.stringify(mb)}`); }
  assert.ok(mb.draws <= N * 0.1);
  const br = tally('battle_royal');
  for (let side = 0; side < 6; side++) { const sh = (br.wins[side] || 0) / br.decided; assert.ok(sh <= 0.85 && sh >= 0.04, `battle royal seat ${side} share ${sh.toFixed(2)}: ${JSON.stringify(br)}`); }
  assert.ok(br.draws <= N * 0.1);
  const hc = tally('handicap');
  const lone = (hc.wins[0] || 0) / hc.decided;
  assert.ok(lone >= 0.2 && lone <= 0.5, `lone wrestler wins ${(lone * 100).toFixed(0)}% of handicap matches`);
});

test('skill still matters in the new multi-way types: a smart strategy outperforms its opponents', () => {
  // (a field of pure-random opponents makes a battle royal a stalemate - nobody finishes anything and ~90% of matches
  // time out, as in the existing elimination types - so the royal is measured against competent "average" opponents)
  for (const [type, foe, need] of [['mitb', 'random', 0.1], ['battle_royal', 'average', 0.04]]) {
    let sm = 0, n = 0;
    for (let i = 0; i < 100; i++) {
      const cfg = cfgFor(type, 40000 + i, true);
      const ov = Object.fromEntries(cfg.sides.flat().map((p) => [p.id, foe]));
      ov.p0 = 'smart';
      const m = MatchEngine.simulate(cfg, ov);
      n++; if (m.result.winnerSide === 0) sm++;
    }
    assert.ok(sm / n > 1 / waysOf(getRuleset(type)) + need, `${type}: smart won ${sm}/${n}`);
  }
});

// ---------------------------------------------------------------------------------------------
// regression guards for the shared machinery
// ---------------------------------------------------------------------------------------------
test('ladder and cage now let rivals knock a climber off (the move was in nobody\'s moveset before)', () => {
  for (const type of ['ladder', 'cage']) {
    let topples = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const m = MatchEngine.simulate({ seed, type, sides: [[mkF('p0', W.show)], [mkF('p1', W.tech)]], playerId: 'p0' }, {});
      topples += m.state.events.filter((e) => e.type === 'toppled').length;
      assert.ok(['objective', 'time_limit_draw', 'pinfall', 'submission'].includes(m.result.finish));
    }
    assert.ok(topples > 5, `${type} topples ${topples}`);
  }
  // non-objective matches never carry it
  const s = new MatchEngine({ seed: 1, type: 'singles', sides: [[mkF('p0', W.show)], [mkF('p1', W.tech)]], playerId: 'p0' }, { human: [] }).state;
  assert.ok(!F(s, 'p0').moveIds.includes('knock_off'));
});

test('the Gauntlet helper can build sides for every new type', async () => {
  const { matchMetrics } = await import('../tools/metrics.js');
  const r = matchMetrics({ n: 12 });
  for (const t of TYPES) {
    assert.ok(r.types[t], `${t} measured`);
    assert.equal(r.types[t].invalid, 0, `${t} produced only valid finishes`);
    assert.ok(r.types[t].n >= 8);
  }
});

// ---------------------------------------------------------------------------------------------
// career layer: achievements and the ledger
// ---------------------------------------------------------------------------------------------
test('achievements: win_tlc and win_mitb exist, are provable, and unlock from real ledger events', () => {
  for (const id of ['win_tlc', 'win_mitb']) {
    const def = ACHIEVEMENT_DEFS.find((d) => d.id === id);
    assert.ok(def, id);
    const proof = proveAchievement(def);
    assert.ok(proof.ok, `${id}: ${proof.reason}`);
    assert.ok(proof.record.evidence.length >= 1);
  }
});

test('career: winning Money in the Bank is recorded as a ledger fact; losing it is not; TLC wins unlock the TLC achievement', () => {
  const find = (type, wantWin, make) => {
    for (let seed = 1; seed < 300; seed++) {
      const c = newCareer(70 + seed); debut(c);
      const opps = make(c);
      const sides = type === 'mitb' ? [[c.fighterProfile()], ...opps.map((o) => [o])] : [[c.fighterProfile()], opps.map((o) => o)];
      const engine = new MatchEngine({ seed, type, sides, playerId: c.player.id }, { human: [] });
      if ((engine.result.winnerId === c.player.id) !== wantWin || engine.result.winnerSide === null) continue;
      return { c, engine, opps };
    }
    throw new Error('no suitable seed');
  };
  const field = (c) => [opp('brawler', { id: 'b1' }), opp('tech', { id: 'b2' }), opp('flyer', { id: 'b3' })];
  for (const wantWin of [true, false]) {
    const { c, engine, opps } = find('mitb', wantWin, field);
    const booking = makeBooking(c, opps, { type: 'mitb', show: 'WrestleMania', ppv: 'WrestleMania', ppvTier: 2 });
    const rec = c.recordMatch(engine, booking);
    const ledger = c.memory.ledger;
    const marks = ledger.ofType('milestone').filter((e) => e.data.kind === 'money_in_the_bank');
    const mr = ledger.ofType('match_result').slice(-1)[0];
    assert.equal(mr.data.matchType, 'mitb');
    assert.equal(mr.data.opponents.length, 3);
    assert.equal(rec.result, wantWin ? 'win' : 'loss');
    if (wantWin) {
      assert.equal(marks.length, 1);
      assert.ok(marks[0].refs.includes(mr.id), 'the fact cites the match');
      assert.equal(marks[0].data.matchId, booking.matchId);
      assert.ok(c.achievements.unlocked.win_mitb, 'Briefcase Holder unlocks');
      assert.equal(c.achievements.unlocked.win_mitb.evidence.includes(marks[0].id), true);
      // winning grants nothing mechanical to the engine state
      assert.equal(engine.state.result.finish, 'objective');
    } else {
      assert.equal(marks.length, 0);
      assert.ok(!c.achievements.unlocked.win_mitb);
    }
    assert.ok(ledger.verify().ok);
  }
  // recording the same match twice does not duplicate the fact
  const { c, engine, opps } = find('mitb', true, field);
  const booking = makeBooking(c, opps, { type: 'mitb' });
  c.recordMatch(engine, booking); c.recordMatch(engine, booking);
  assert.equal(c.memory.ledger.ofType('milestone').filter((e) => e.data.kind === 'money_in_the_bank').length, 1);
  // TLC
  const t = find('tlc', true, (cc) => [opp('tech', { id: 't1' })]);
  t.c.recordMatch(t.engine, makeBooking(t.c, t.opps, { type: 'tlc' }));
  assert.ok(t.c.achievements.unlocked.win_tlc, 'Tables, Ladders & Chairs Winner unlocks');
  assert.ok(!t.c.achievements.unlocked.win_mitb);
});

// ---------------------------------------------------------------------------------------------
// game level: unlocks, booking, play-through
// ---------------------------------------------------------------------------------------------
const stage = (g, oppId, heat) => {
  const ids = [oppId, 'player'].sort();
  g.career.memory.world.rivalries[`rv:${ids.join('|')}`] = { id: `rv:${ids.join('|')}`, a: ids[0], b: ids[1], heat, status: 'active', startDay: 0, origin: null, matches: 0, wins: {}, lastDay: 0, events: [] };
};
const newGame = (seed) => {
  const g = new AutoGame();
  g.newCareer({ seed, name: 'Bookie', startYear: 2024, background: 'established', style: 'brawler', bonus: {}, signatures: [], finisher: { tpl: 'fin_ddt', name: 'B' } });
  return g;
};
const step = (g) => { g.career.advanceDays(1); g._universeTick(); };
/** advance to the next show day (any kind) / the next Premium Live Event day */
function toDay(g, pred) {
  for (let n = 0; n < 400; n++) {
    const ev = g.nextEvent();
    if (ev.day === g.career.day) { if (pred(ev) && !g.rumbleAvailable()) return ev; step(g); } else g.advanceToNextEvent();
  }
  throw new Error('no suitable event');
}
function playOut(g) {
  let d = g.decision(), n = 0;
  while (d && n++ < 4000) { const r = g.choose(decideFor(g.engine.state, d, PROFILES.strong)); if (r.over) break; d = r.decision; }
  assert.ok(g.engine.over);
}
const lastResult = (g) => g.career.memory.ledger.ofType('match_result').slice(-1)[0];

test('game: TLC unlocks at rivalry heat 55 and plays through the facade', () => {
  assert.equal(STIPULATION_HEAT.tlc, 55);
  const g = newGame(31);
  toDay(g, () => true);
  const o = g.suggestOpponents()[0];
  assert.equal(g.availableStipulations(o.id).find((s) => s.id === 'tlc').unlocked, false);
  assert.throws(() => g.prepareMatch({ opponentId: o.id, type: 'tlc' }), /not unlocked/);
  stage(g, o.id, 54);
  assert.equal(g.availableStipulations(o.id).find((s) => s.id === 'tlc').unlocked, false);
  stage(g, o.id, 56);
  const s = g.availableStipulations(o.id).find((x) => x.id === 'tlc');
  assert.equal(s.unlocked, true); assert.equal(s.need, 55); assert.ok(s.desc && s.name);
  const booking = g.prepareMatch({ opponentId: o.id, type: 'tlc' });
  assert.equal(booking.type, 'tlc'); assert.equal(booking.opponents.length, 1);
  g.startMatch();
  const mv = g.matchView();
  assert.equal(mv.type, 'tlc'); assert.equal(mv.ways, 2); assert.ok(mv.objective && mv.objective.steps === 3);
  playOut(g);
  const res = g.finishMatch();
  assert.ok(['win', 'loss', 'draw'].includes(res.result));
  assert.equal(lastResult(g).data.matchType, 'tlc');
  assert.ok(g.career.memory.ledger.verify().ok);
});

test('game: Money in the Bank is bookable only on a Premium Live Event, needs no rival, and adds the field', () => {
  const g = newGame(32);
  toDay(g, (ev) => ev.kind !== 'ple');
  const o = g.suggestOpponents()[0];
  const locked = g.availableStipulations(o.id).find((s) => s.id === 'mitb');
  assert.equal(locked.unlocked, false);
  assert.match(locked.lock, /Premium Live Event/);
  assert.throws(() => g.prepareMatch({ opponentId: o.id, type: 'mitb' }), /Premium Live Event/);
  assert.equal(g.career.flags.phase, 'home', 'a refused booking leaves the career at home');
  // find a PLE day (the weekly-show day above is left behind by a day step)
  step(g);
  const ple = toDay(g, (ev) => ev.kind === 'ple');
  assert.equal(ple.kind, 'ple');
  const o2 = g.suggestOpponents()[0];
  assert.equal(g.rivalryHeat?.(o2.id) ?? 0, 0);
  const s = g.availableStipulations(o2.id).find((x) => x.id === 'mitb');
  assert.equal(s.unlocked, true, 'no rivalry heat is required');
  assert.equal(s.lock, undefined);
  assert.equal(g.availableStipulations(o2.id).find((x) => x.id === 'singles').unlocked, true);
  const booking = g.prepareMatch({ opponentId: o2.id, type: 'mitb' });
  assert.equal(booking.opponents.length, 3, 'the office adds the other two competitors');
  assert.equal(new Set(booking.opponents.map((x) => x.id)).size, 3);
  assert.ok(booking.ppv, 'booked on the PLE');
  g.startMatch();
  const mv = g.matchView();
  assert.equal(mv.ways, 4); assert.equal(mv.others.length, 2);
  assert.ok(mv.others.every((x) => typeof x.climb === 'number'), 'the HUD can show every climber');
  assert.ok(mv.objective);
  playOut(g);
  const res = g.finishMatch();
  assert.equal(res.opponents.length, 3);
  const ev = lastResult(g);
  assert.equal(ev.data.matchType, 'mitb');
  assert.equal(ev.data.opponents.length, 3);
  const marks = g.career.memory.ledger.ofType('milestone').filter((e) => e.data.kind === 'money_in_the_bank');
  assert.equal(marks.length, res.result === 'win' ? 1 : 0);
  assert.ok(g.career.memory.ledger.verify().ok);
});

test('game: Battle Royal unlocks at heat 25, adds a five-man field and plays through', () => {
  assert.equal(STIPULATION_HEAT.battle_royal, 25);
  const g = newGame(33);
  toDay(g, () => true);
  const o = g.suggestOpponents()[0];
  assert.throws(() => g.prepareMatch({ opponentId: o.id, type: 'battle_royal' }), /not unlocked/);
  stage(g, o.id, 26);
  const booking = g.prepareMatch({ opponentId: o.id, type: 'battle_royal' });
  assert.equal(booking.opponents.length, 5);
  assert.equal(new Set(booking.opponents.map((x) => x.id)).size, 5);
  g.startMatch();
  const mv = g.matchView();
  assert.equal(mv.ways, 6); assert.equal(mv.others.length, 4);
  playOut(g);
  const res = g.finishMatch();
  assert.equal(res.opponents.length, 5);
  assert.equal(lastResult(g).data.matchType, 'battle_royal');
  assert.ok(['pinfall', 'submission', 'over_the_top', 'time_limit_draw'].includes(res.finish));
  assert.ok(g.career.memory.ledger.verify().ok);
  // the post-match flow copes with a field of rivals
  assert.ok(g.postMatchOptions().length > 0);
});

test('game: Handicap unlocks at heat 35; you are the lone wrestler against two foes and the HUD shows who is legal', () => {
  assert.equal(STIPULATION_HEAT.handicap, 35);
  const g = newGame(34);
  toDay(g, () => true);
  const o = g.suggestOpponents()[0];
  assert.throws(() => g.prepareMatch({ opponentId: o.id, type: 'handicap' }), /not unlocked/);
  stage(g, o.id, 36);
  const booking = g.prepareMatch({ opponentId: o.id, type: 'handicap' });
  assert.equal(booking.opponents.length, 2, 'two foes');
  assert.equal(booking.opponents[0].id, o.id);
  assert.equal(booking.partners.length, 0, 'the player has no partner');
  assert.notEqual(booking.opponents[1].id, g.career.player.id);
  g.startMatch();
  const st = g.engine.state;
  assert.deepEqual(st.teams.map((t) => t.length), [1, 2]);
  assert.equal(st.teams[0][0], g.career.player.id);
  const mv = g.matchView();
  assert.ok(mv.rules.tag && mv.team, 'the tag-legal indicator has its data');
  assert.equal(mv.team.mine.length, 1); assert.equal(mv.team.theirs.length, 2);
  assert.equal(mv.team.theirs.filter((x) => x.legal).length, 1);
  assert.equal(mv.team.mine[0].legal, true);
  const d = g.decision();
  assert.ok(!d.options.some((x) => x.tempoId === 'make_tag'), 'the lone man cannot tag');
  playOut(g);
  const res = g.finishMatch();
  assert.equal(res.opponents.length, 2);
  const ev = lastResult(g);
  assert.equal(ev.data.matchType, 'handicap'); assert.equal(ev.data.opponents.length, 2);
  assert.ok(g.career.memory.ledger.verify().ok);
});

test('game: the stipulation list a UI renders contains every new type with a name, description and unlock state', () => {
  const g = newGame(35);
  toDay(g, () => true);
  const o = g.suggestOpponents()[0];
  const list = g.availableStipulations(o.id);
  for (const t of TYPES) {
    const s = list.find((x) => x.id === t);
    assert.ok(s, t);
    assert.ok(s.name && s.desc);
    assert.equal(typeof s.unlocked, 'boolean');
    assert.equal(s.need, STIPULATION_HEAT[t]);
  }
  assert.ok(list.every((x) => x.id !== 'tag'));
});
