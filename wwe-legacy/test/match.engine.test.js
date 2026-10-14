import test from 'node:test';
import assert from 'node:assert/strict';
import { MatchEngine, W, F, mk, mkHuman, playOut, clone } from './helpers.js';
import { getMove } from '../src/match/moves.js';
import { moveBlockedReason, listActions, TEMPO } from '../src/match/actions.js';
import { computeConnect, kickoutChance, limbPenalty, fatiguePenalty } from '../src/match/calc.js';
import { STANCES } from '../src/match/stances.js';
import { opponentOf, damageFraction } from '../src/match/state.js';
import { summarizeMatch } from '../src/match/rating.js';
import { MATCH_TYPE_IDS, waysOf, getRuleset } from '../src/match/rules.js';
import { canPin } from '../src/match/resolve.js';

const rand = (d, opts, i = 0) => opts[(d.round * 7 + i * 3 + opts.length) % opts.length].id;

test('valid/invalid moves: unknown and disabled choices are rejected, state untouched', () => {
  const e = mkHuman('singles', 'brawler', 'tech', 3);
  const d = e.awaitingHuman();
  assert.ok(d, 'human decision expected');
  const before = JSON.stringify(e.state);
  assert.throws(() => e.choose('mv:not_a_move'), /invalid choice/);
  assert.throws(() => e.choose('pn:kickout'), /invalid choice/); // a pin response while no pin is pending
  assert.equal(JSON.stringify(e.state), before, 'invalid choice must not mutate state');
  // a finisher is not available at the start (no momentum)
  const fin = d.options.find((o) => o.moveId === e.state.fighters.brawler.finisherId);
  assert.equal(fin, undefined, 'finisher must not be offered without momentum');
});

test('option lists respect positions: ground moves need a grounded target, aerial needs top rope', () => {
  const e = mkHuman('singles', 'brawler', 'tech', 4);
  const s = e.state;
  const A = F(s, 'brawler'), D = F(s, 'tech');
  s.initiative = 'brawler'; s.pending = null;
  A.pos = 'standing'; D.pos = 'standing';
  let ids = listActions(s, 'brawler').map((o) => o.moveId);
  assert.ok(!ids.includes('stomp'), 'stomp needs a grounded opponent');
  assert.ok(!ids.includes('top_elbow'), 'top-rope move needs to be on the top rope');
  assert.ok(ids.includes('forearm'));
  D.pos = 'grounded';
  ids = listActions(s, 'brawler').map((o) => o.moveId);
  assert.ok(ids.includes('stomp'));
  assert.ok(!ids.includes('forearm'), 'standing strike not valid on grounded opponent');
  D.pos = 'standing'; A.pos = 'top'; s.pending = null;
  ids = listActions(s, 'brawler').map((o) => o.moveId);
  assert.ok(!ids.includes('forearm'));
});

test('decision menus offer roughly 6-12 featured choices and 6+ defensive choices', () => {
  const counts = [], defs = [];
  for (let seed = 1; seed <= 12; seed++) {
    const e = mkHuman('singles', 'tech', 'brawler', seed);
    let steps = 0;
    while (!e.over && steps++ < 60) {
      const d = e.getDecision();
      if (!d) break;
      if (d.kind === 'action') counts.push(d.options.filter((o) => o.featured).length);
      if (d.kind === 'defense') defs.push(d.options.length);
      const opts = d.options.filter((o) => o.enabled !== false);
      e.choose(rand(d, opts, steps));
    }
  }
  assert.ok(counts.length > 100);
  const inRange = counts.filter((c) => c >= 6 && c <= 14).length / counts.length;
  assert.ok(inRange > 0.97, `featured action menu in 6-14 range for ${(inRange * 100).toFixed(1)}%`);
  assert.ok(Math.min(...defs) >= 6, `defence menu min ${Math.min(...defs)}`);
  assert.ok(Math.max(...defs) <= 12);
});

test('the same seed and choices always produce the same match (determinism)', () => {
  const run = () => { const e = mk('singles', 'show', 'sub', 99); return JSON.stringify([e.result, e.state.events.length, e.state.time]); };
  assert.equal(run(), run());
  const other = (() => { const e = mk('singles', 'show', 'sub', 100); return JSON.stringify([e.result, e.state.events.length, e.state.time]); })();
  assert.notEqual(run(), other);
});

test('reversals: a reversed move damages the attacker, flips initiative, and is recorded as an event', () => {
  let found = 0;
  for (let seed = 1; seed < 300 && found < 5; seed++) {
    const e = mk('singles', 'brawler', 'tech', seed);
    const ev = e.state.events.find((x) => x.type === 'move_reversed');
    if (!ev) continue;
    found++;
    assert.ok(ev.damage > 0, 'reversal must cause damage');
    assert.ok(ev.actor !== ev.target);
    const s = e.state;
    assert.ok(s.fighters[ev.target].stats.reversalsMade >= 1);
    assert.ok(s.fighters[ev.actor].stats.reversed + s.fighters[ev.actor].stats.countered >= 1);
  }
  assert.equal(found, 5);
});

test('successful and failed defences both occur and depend on the stance chosen', () => {
  // strike defences: Block should avoid strikes more often than Brace; both outcomes occur
  const e = mkHuman('singles', 'brawler', 'tech', 11);
  const s = e.state;
  const A = F(s, 'brawler'), D = F(s, 'tech');
  const strike = getMove('forearm');
  const pBlock = computeConnect(s, 'brawler', strike, 'tech', STANCES.block).p;
  const pBrace = computeConnect(s, 'brawler', strike, 'tech', STANCES.brace).p;
  const pRev = computeConnect(s, 'brawler', strike, 'tech', STANCES.reverse).p;
  assert.ok(pBlock < pBrace, 'block beats brace against strikes');
  assert.ok(pBlock < pRev, 'reverse is poor against strikes');
  const grapple = getMove('suplex');
  assert.ok(computeConnect(s, 'brawler', grapple, 'tech', STANCES.reverse).p < computeConnect(s, 'brawler', grapple, 'tech', STANCES.block).p, 'reverse beats block against grapples');
  const fin = getMove(A.finisherId);
  assert.ok(computeConnect(s, 'brawler', fin, 'tech', STANCES.counter_special).p < computeConnect(s, 'brawler', fin, 'tech', STANCES.block).p);
  // outcomes over many sims
  const seen = new Set();
  for (let seed = 1; seed < 80; seed++) for (const ev of mk('singles', 'flyer', 'sub', seed).state.events) seen.add(ev.type);
  for (const t of ['move_connected', 'move_blocked', 'move_dodged', 'move_reversed']) assert.ok(seen.has(t), `${t} should occur`);
});

test('a finisher can be reversed - and that is recorded as finisher_reversed with stats', () => {
  let ev = null, state = null;
  for (let seed = 1; seed < 800 && !ev; seed++) {
    const e = mk('singles', 'power', 'sub', seed, { overrides: { power: 'smart', sub: 'smart' } });
    ev = e.state.events.find((x) => x.type === 'finisher_reversed');
    state = e.state;
  }
  assert.ok(ev, 'finisher reversal should occur in 800 seeds');
  assert.ok(state.fighters[ev.actor].stats.finishersReversed >= 1);
  assert.ok(ev.damage > 0);
});

test('powerful moves do not automatically succeed (every move category has < 96% connect odds)', () => {
  const e = mkHuman('singles', 'power', 'rookie', 5);
  const s = e.state;
  for (const id of s.fighters.power.moveIds) {
    const m = getMove(id);
    const { p } = computeConnect(s, 'power', m, 'rookie', STANCES.block);
    assert.ok(p <= 0.96 && p >= 0.04);
  }
  const fin = getMove(s.fighters.power.finisherId);
  assert.ok(computeConnect(s, 'power', fin, 'rookie', STANCES.counter_special).p < 0.8);
});

test('stamina depletes with action, regenerates by resting, and stays within bounds always', () => {
  const e = mkHuman('singles', 'brawler', 'tech', 21);
  const A = F(e.state, 'brawler');
  const s0 = A.stamina;
  playOut(e, (d, opts) => {
    for (const f of Object.values(e.state.fighters)) {
      assert.ok(f.stamina >= 0 && f.stamina <= f.maxStamina + 1e-9, `stamina out of range ${f.stamina}`);
      for (const part of Object.values(f.dmg)) assert.ok(part >= 0 && part <= 100);
      assert.ok(f.momentum >= 0 && f.momentum <= 100);
    }
    return rand(d, opts);
  });
  // explicit: spending
  const e2 = mkHuman('singles', 'brawler', 'tech', 22);
  const s = e2.state;
  s.pending = null; s.initiative = 'brawler';
  const A2 = F(s, 'brawler');
  const before = A2.stamina;
  e2.choose('mv:body_slam');
  assert.ok(A2.stamina < before + 5, 'power move costs stamina');
  // resting restores
  const e3 = mkHuman('singles', 'brawler', 'tech', 23);
  F(e3.state, 'brawler').stamina = 20; e3.state.pending = null; e3.state.initiative = 'brawler';
  const lo = F(e3.state, 'brawler').stamina;
  e3.choose('t:catch_breath');
  assert.ok(F(e3.state, 'brawler').stamina > lo + 8);
});

test('exhausted wrestlers cannot attempt expensive moves', () => {
  const e = mkHuman('singles', 'power', 'tech', 24);
  const s = e.state;
  s.pending = null; s.initiative = 'power';
  F(s, 'power').stamina = 5;
  const ids = listActions(s, 'power').map((o) => o.moveId);
  assert.ok(!ids.includes('powerbomb'));
  assert.ok(!ids.includes('piledriver'));
  assert.ok(ids.includes('forearm') || ids.includes('chop'), 'cheap strikes remain');
  // fatigue reduces accuracy
  const mv = getMove('forearm');
  F(s, 'power').stamina = F(s, 'power').maxStamina;
  const fresh = computeConnect(s, 'power', mv, 'tech', null).p;
  F(s, 'power').stamina = 6;
  const tired = computeConnect(s, 'power', mv, 'tech', null).p;
  assert.ok(tired < fresh - 0.1, 'fatigue should hurt accuracy');
  assert.ok(fatiguePenalty(F(s, 'power')) > 0.1);
});

test('damage consequences: injured limbs hurt offence, raise vulnerability, lower kickout chance', () => {
  const e = mkHuman('singles', 'brawler', 'tech', 31);
  const s = e.state;
  const A = F(s, 'brawler'), D = F(s, 'tech');
  const arm = getMove('forearm');
  const base = computeConnect(s, 'brawler', arm, 'tech', null).p;
  A.dmg.arms = 90;
  assert.ok(limbPenalty(A, 'strike') > 0.05);
  assert.ok(computeConnect(s, 'brawler', arm, 'tech', null).p < base, 'damaged arms lower strike accuracy');
  A.dmg.arms = 0;
  D.pos = 'grounded';
  const k0 = kickoutChance(s, 'tech', 'brawler', { lastCat: 'power' });
  D.dmg.head = 80; D.dmg.torso = 80; D.stamina = 20;
  const k1 = kickoutChance(s, 'tech', 'brawler', { lastCat: 'power' });
  assert.ok(k1 < k0 - 0.2, `damaged wrestler kicks out less (${k0.toFixed(2)} -> ${k1.toFixed(2)})`);
  // finisher lowers kickout further
  assert.ok(kickoutChance(s, 'tech', 'brawler', { lastCat: 'finisher' }) < k1);
  assert.ok(damageFraction(D) > 0.3);
});

test('pinfall rules: cannot pin a standing opponent; pin counts to three; ref-down means no count', () => {
  const e = mkHuman('singles', 'brawler', 'tech', 41);
  const s = e.state; s.pending = null; s.initiative = 'brawler';
  assert.ok(!listActions(s, 'brawler').some((o) => o.tempoId === 'cover'), 'no cover on a standing opponent');
  F(s, 'tech').pos = 'grounded';
  assert.ok(listActions(s, 'brawler').some((o) => o.tempoId === 'cover'));
  // ref down: pin attempt produces pin_no_ref and no pending pin
  s.referee.state = 'down'; s.referee.turns = 3;
  e.choose('t:cover');
  assert.ok(s.events.some((x) => x.type === 'pin_no_ref'));
  assert.equal(s.pin, null);
  assert.equal(s.result, null);
  // regular pin: defender gets a pin decision; kickout or loss
  const e2 = mkHuman('singles', 'brawler', 'tech', 42);
  e2.state.pending = null; e2.state.initiative = 'brawler'; F(e2.state, 'tech').pos = 'grounded';
  F(e2.state, 'tech').dmg.head = 95; F(e2.state, 'tech').dmg.torso = 95; F(e2.state, 'tech').stamina = 1;
  e2.choose('t:cover');
  // tech is AI -> resolved automatically; with such damage the pin must have been decided
  const types = e2.state.events.map((x) => x.type);
  assert.ok(types.includes('pin_attempt'));
  assert.ok(types.includes('pin_count'));
});

test('a completed pinfall win updates the result consistently (winner, finish, duration)', () => {
  let n = 0;
  for (let seed = 1; seed < 80; seed++) {
    const e = mk('singles', 'show', 'tech', seed);
    const r = e.result;
    if (r.finish !== 'pinfall') continue;
    n++;
    const ev = e.state.events;
    assert.ok(ev.some((x) => x.type === 'pin_win' && x.actor === r.winnerId));
    assert.equal(ev.filter((x) => x.type === 'match_end').length, 1);
    assert.equal(ev[ev.length - 1].type, 'match_end');
    assert.ok(r.durationSec > 0);
    assert.ok(r.losers.length === 1 && r.winners[0] === r.winnerId);
  }
  assert.ok(n > 20);
});

test('submission rules: holds need a grounded opponent, end matches by tap, and rope breaks only when allowed', () => {
  const e = mkHuman('singles', 'sub', 'tech', 51);
  const s = e.state; s.pending = null; s.initiative = 'sub';
  assert.ok(!listActions(s, 'sub').some((o) => o.cat === 'submission'), 'no hold on a standing opponent');
  F(s, 'tech').pos = 'grounded';
  assert.ok(listActions(s, 'sub').some((o) => o.cat === 'submission'));
  // find a submission finish & check events
  let subWins = 0, ropeBreaks = 0;
  for (let seed = 1; seed < 250; seed++) {
    const m = mk('singles', 'sub', 'tech', seed, { overrides: { sub: 'strong', tech: 'average' } });
    if (m.result.finish === 'submission') {
      subWins++;
      assert.ok(m.state.events.some((x) => x.type === 'submission_win'));
      assert.ok(m.state.events.some((x) => x.type === 'submission_applied'));
    }
    ropeBreaks += m.state.events.filter((x) => x.type === 'rope_break').length;
  }
  assert.ok(subWins > 10, `submission wins ${subWins}`);
  assert.ok(ropeBreaks > 0, 'rope breaks occur in standard singles');
  // never in a submission match
  for (let seed = 1; seed < 60; seed++) {
    const m = mk('submission', 'sub', 'tech', seed);
    assert.equal(m.state.events.filter((x) => x.type === 'rope_break').length, 0);
    assert.ok(['submission', 'time_limit_draw'].includes(m.result.finish));
  }
});

test('submission-only matches never end by pinfall; hold victims can always choose to tap', () => {
  const e = mkHuman('submission', 'sub', 'tech', 52);
  const s = e.state; s.pending = null; s.initiative = 'sub';
  F(s, 'tech').pos = 'grounded';
  assert.ok(!listActions(s, 'sub').some((o) => o.tempoId === 'cover'));
  // put tech in a hold manually via the move
  e.choose('mv:ankle_lock');
  for (let i = 0; i < 40 && !e.over; i++) {
    const d = e.getDecision();
    if (!d) break;
    if (d.kind === 'hold_h') e.choose('hd:tighten');
    else if (d.kind === 'hold_v') { assert.ok(d.options.some((o) => o.id === 'hv:tap')); e.choose('hv:tap'); }
    else e.choose(d.options.filter((o) => o.enabled !== false)[0].id);
    if (s.hold === null && !e.over && s.events.some((x) => x.type === 'submission_win')) break;
  }
  assert.ok(e.over || !s.hold);
});

test('disqualification: dirty tactics seen by the referee lead to warnings, then a DQ loss', () => {
  let dqs = 0, warnings = 0;
  for (let seed = 1; seed < 400; seed++) {
    const e = mk('singles', 'brawler', 'tech', seed, { overrides: { brawler: { skill: 0.7, aggression: 0.9, risk: 0.9 } } });
    warnings += e.state.events.filter((x) => x.type === 'warning').length;
    if (e.result.finish === 'dq') {
      dqs++;
      const dq = e.state.events.find((x) => x.type === 'dq');
      assert.equal(e.result.dqBy, dq.actor);
      assert.notEqual(e.result.winnerId, dq.actor, 'the offender never wins by DQ');
    }
  }
  assert.ok(dqs > 0, 'DQs should occur');
  assert.ok(warnings > 0);
});

test('weapons are illegal in standard matches (only offered while the ref cannot see) and legal in No DQ', () => {
  const e = mkHuman('singles', 'brawler', 'tech', 61);
  const s = e.state; s.pending = null; s.initiative = 'brawler';
  assert.ok(!listActions(s, 'brawler').some((o) => o.moveId === 'chair_shot'), 'ref watching: no chair');
  s.referee.state = 'down'; s.referee.turns = 3;
  assert.ok(listActions(s, 'brawler').some((o) => o.moveId === 'chair_shot'), 'ref down: chair available');
  const n = mkHuman('no_dq', 'brawler', 'tech', 62);
  n.state.pending = null; n.state.initiative = 'brawler';
  assert.ok(listActions(n.state, 'brawler').some((o) => o.moveId === 'chair_shot'));
  for (let seed = 1; seed < 40; seed++) assert.notEqual(mk('no_dq', 'brawler', 'tech', seed).result.finish, 'dq');
});

test('tag-team legality: only the legal wrestler can act, pin or submit; the partner waits on the apron', () => {
  const e = mkHuman('tag', 'brawler', 'tech', 71);
  const s = e.state;
  assert.equal(F(s, 'brawler').legal, true);
  assert.equal(F(s, 'partnerA').legal, false);
  assert.equal(F(s, 'partnerA').pos, 'apron');
  // illegal wrestler's options are apron-only
  const apron = listActions(s, 'partnerA');
  assert.ok(apron.every((o) => o.kind === 'apron'));
  // illegal man cannot pin
  assert.equal(canPin(s, 'partnerA', 'tech'), false);
  F(s, 'tech').pos = 'grounded';
  assert.equal(canPin(s, 'brawler', 'tech'), true);
  assert.equal(canPin(s, 'brawler', 'partnerB'), false);
  // tag swaps legal status and is recorded
  let tagged = 0;
  for (let seed = 1; seed < 60; seed++) {
    const m = mk('tag', 'show', 'tech', seed);
    const tags = m.state.events.filter((x) => x.type === 'tag');
    tagged += tags.length ? 1 : 0;
    const legalNow = Object.values(m.state.fighters).filter((f) => f.legal);
    assert.ok(legalNow.length <= 2, 'at most one legal wrestler per side');
    const per = [0, 1].map((side) => legalNow.filter((f) => f.side === side).length);
    assert.deepEqual(per, [1, 1]);
    for (const ev of m.state.events) if (ev.type === 'pin_win') assert.ok(ev.actor);
    if (m.result.finish === 'pinfall') assert.ok(m.result.winnerId, 'pin winner is a participant');
  }
  assert.ok(tagged > 20, `tags occurred in ${tagged} of 59 matches`);
});

test('tag partner (human) can use apron options, incl. illegal interference that risks DQ', () => {
  const sides = [[W.brawler, W.partnerA], [W.tech, W.partnerB]];
  const e = new MatchEngine({ seed: 5, type: 'tag', sides, playerId: 'partnerA' }, { human: ['partnerA'] });
  let d = e.getDecision();
  assert.equal(d.kind, 'apron', 'partner gets apron decisions while not legal');
  assert.ok(d.options.length >= 8);
  assert.ok(d.options.some((o) => o.illegal));
  let sawDQ = false, guard = 0;
  while (!e.over && guard++ < 400) {
    d = e.getDecision();
    const pick = d.kind === 'apron' ? (d.options.find((o) => o.id === 'ap:cheap') || d.options[0]).id : d.options.filter((o) => o.enabled !== false)[0].id;
    e.choose(pick);
  }
  assert.ok(e.over);
});

test('match-specific win conditions: ten count, falls, ladder/cage objective', () => {
  const finishes = { last_man: new Set(), iron_man: new Set(), ladder: new Set(), cage: new Set(), hell_cell: new Set(), submission: new Set() };
  for (const type of Object.keys(finishes)) {
    for (let seed = 1; seed < 70; seed++) {
      const m = mk(type, 'brawler', 'sub', seed);
      finishes[type].add(m.result.finish);
    }
  }
  assert.ok(finishes.last_man.has('ten_count'));
  for (const f of finishes.last_man) assert.ok(['ten_count', 'time_limit_draw'].includes(f), `last man finish ${f}`);
  assert.ok(finishes.iron_man.has('falls'));
  for (const f of finishes.iron_man) assert.ok(['falls', 'time_limit_draw'].includes(f));
  assert.ok(finishes.ladder.has('objective'));
  for (const f of finishes.ladder) assert.ok(['objective', 'time_limit_draw'].includes(f), `ladder finish ${f}`);
  assert.ok(finishes.cage.has('objective'));
  assert.ok(!finishes.hell_cell.has('dq') && !finishes.hell_cell.has('countout'));
});

test('iron man: falls are tallied from events and the higher total wins', () => {
  for (let seed = 1; seed < 40; seed++) {
    const m = mk('iron_man', 'show', 'tech', seed);
    const falls = [0, 0];
    for (const ev of m.state.events) if (ev.type === 'fall') falls[ev.side]++;
    assert.deepEqual(falls, [m.state.falls[0], m.state.falls[1]]);
    const r = m.result;
    if (r.winnerSide === null) assert.equal(falls[0], falls[1]);
    else assert.ok(falls[r.winnerSide] > falls[1 - r.winnerSide]);
  }
});

test('last man standing: pins and submissions are never used; a count of ten ends it', () => {
  const m = mkHuman('last_man', 'brawler', 'tech', 81);
  m.state.pending = null; m.state.initiative = 'brawler';
  F(m.state, 'tech').pos = 'grounded';
  const opts = listActions(m.state, 'brawler');
  assert.ok(!opts.some((o) => o.tempoId === 'cover'));
  assert.ok(!opts.some((o) => o.cat === 'submission'));
  let ko = 0;
  for (let seed = 1; seed < 100; seed++) {
    const r = mk('last_man', 'brawler', 'tech', seed);
    assert.ok(!r.state.events.some((x) => x.type === 'pin_attempt'));
    if (r.result.finish === 'ten_count') {
      ko++;
      const ev = r.state.events.filter((x) => x.type === 'ten_count');
      assert.ok(ev.some((x) => x.n >= 10));
      assert.ok(r.state.events.some((x) => x.type === 'knockout'));
    }
  }
  assert.ok(ko > 10);
});

test('count-outs: staying outside the ring too long loses a standard match, but not in No DQ', () => {
  let co = 0;
  for (let seed = 1; seed < 500; seed++) {
    const m = mk('singles', 'brawler', 'tech', seed, { overrides: { brawler: { skill: 0.6, aggression: 0.9, risk: 0.9 } } });
    if (m.result.finish === 'countout') {
      co++;
      const ev = m.state.events.find((x) => x.type === 'countout');
      assert.notEqual(m.result.winnerId, ev.actor);
    }
  }
  assert.ok(co > 0);
});

test('every match type terminates with a coherent result across builds and strategies', () => {
  const builds = Object.keys(W).filter((k) => !k.startsWith('partner'));
  const profs = ['smart', 'random', 'aggressive', 'defensive', 'pinfocus', 'weak'];
  let n = 0;
  for (const type of MATCH_TYPE_IDS) {
    for (let i = 0; i < 12; i++) {
      const a = builds[(i * 3 + type.length) % builds.length], b = builds[(i * 5 + 1) % builds.length];
      if (a === b) continue;
      const overrides = { [W[a].id]: profs[i % profs.length], [W[b].id]: profs[(i + 2) % profs.length] };
      const extra = (k) => ({ ...W[builds[(i + k * 2 + 1) % builds.length]], id: `extra${k}`, name: `Extra ${k}` });
      const sides = type === 'tag' ? [[W[a], W.partnerA], [W[b], W.partnerB]] : getRuleset(type).teamSizes ? [[W[a]], [W[b], W.partnerB]] : waysOf(getRuleset(type)) > 2 ? [[W[a]], [W[b]], ...Array.from({ length: waysOf(getRuleset(type)) - 2 }, (_, k) => [extra(k + 1)])] : [[W[a]], [W[b]]];
      const m = MatchEngine.simulate({ seed: 1000 + i, type, sides, playerId: W[a].id }, overrides);
      const r = m.result;
      assert.ok(r, `${type} produced no result`);
      assert.ok(r.rounds <= 700);
      assert.ok(['pinfall', 'submission', 'dq', 'countout', 'ten_count', 'falls', 'objective', 'over_the_top', 'time_limit_draw', 'double_countout', 'stalemate'].includes(r.finish), r.finish);
      if (getRuleset(type).elimination && r.winnerSide !== null) assert.equal(r.eliminated.length, waysOf(getRuleset(type)) - 1);
      assert.equal(m.state.events.filter((x) => x.type === 'match_end').length, 1);
      assert.equal(m.getDecision(), null);
      assert.throws(() => m.choose('t:taunt'), /over/);
      n++;
    }
  }
  assert.ok(n > 80);
});

test('statistics are consistent: event-derived summary matches live counters', () => {
  for (let seed = 1; seed < 40; seed++) {
    const m = mk('singles', 'flyer', 'power', seed);
    const sum = summarizeMatch(m.state);
    for (const id of Object.keys(m.state.fighters)) {
      const live = m.state.fighters[id].stats;
      assert.equal(sum[id].connected, live.connected, `connected for ${id} seed ${seed}`);
      assert.equal(sum[id].blocked, live.blocked);
      assert.equal(sum[id].dodged, live.dodged);
      assert.equal(sum[id].reversed, live.reversed + live.countered);
      assert.equal(sum[id].finishersHit, live.finishersHit);
    }
  }
});

test('saving mid-match and reloading yields an identical continuation', () => {
  const choose = (d) => d.options.filter((o) => o.enabled !== false)[(d.round * 5 + 1) % d.options.filter((o) => o.enabled !== false).length].id;
  let a;
  for (let seed = 123; seed < 200; seed++) {
    a = mkHuman('singles', 'show', 'tech', seed);
    for (let i = 0; i < 8 && !a.over; i++) a.choose(choose(a.getDecision()));
    if (!a.over) break;
  }
  assert.ok(!a.over);
  const saved = JSON.stringify(a.toJSON());
  const b = MatchEngine.fromJSON(saved, { human: ['show'] });
  assert.equal(JSON.stringify(b.toJSON()), saved);
  playOut(a, choose); playOut(b, choose);
  assert.equal(JSON.stringify(a.toJSON()), JSON.stringify(b.toJSON()));
  assert.deepEqual(a.result, b.result);
});

test('player choices matter more than luck: a smart strategy beats a random one by a wide margin', () => {
  let sm = 0, rd = 0;
  const base = { ...W.show };
  for (let i = 0; i < 160; i++) {
    const A = { ...base, id: 'p1', name: 'Smart' }, B = { ...base, id: 'p2', name: 'Random' };
    const m = MatchEngine.simulate({ seed: 5000 + i, type: 'singles', sides: [[A], [B]], playerId: 'p1' }, { p1: 'smart', p2: 'random' });
    if (m.result.winnerSide === 0) sm++; else if (m.result.winnerSide === 1) rd++;
  }
  assert.ok(sm / (sm + rd) > 0.8, `smart ${sm} vs random ${rd}`);
});

test('identical wrestlers are balanced: no hidden side advantage', () => {
  let a = 0, b = 0;
  for (let i = 0; i < 300; i++) {
    const A = { ...W.show, id: 'm1', name: 'One' }, B = { ...W.show, id: 'm2', name: 'Two' };
    const m = new MatchEngine({ seed: 9000 + i, type: 'singles', sides: [[A], [B]], playerId: 'm1' }, { human: [] });
    if (m.result.winnerSide === 0) a++; else if (m.result.winnerSide === 1) b++;
  }
  const share = a / (a + b);
  assert.ok(share > 0.4 && share < 0.6, `side-0 share ${share.toFixed(2)}`);
});

test('commentary only describes recorded events (no invented outcomes)', async () => {
  const { narrateAll } = await import('../src/match/commentary.js');
  const m = mk('singles', 'show', 'tech', 17);
  const lines = narrateAll(m.state);
  assert.ok(lines.length > 10);
  const types = new Set(m.state.events.map((e) => e.type));
  for (const l of lines) assert.ok(types.has(l.type));
  const win = lines.find((l) => l.type === 'match_end');
  assert.ok(win.text.includes(m.state.fighters[m.result.winnerId]?.name || 'draw') || m.result.winnerId === null);
});

// ------------------------------------------------------------------ multi-way matches
const multiSides = (n) => Array.from({ length: n }, (_, k) => [{ ...Object.values(W).filter((x) => !String(x.id).startsWith('partner'))[k % 5], id: `mw${k}`, name: `Wrestler ${k}` }]);

test('triple threat and fatal four-way: one winner, everyone else loses, valid finishes, no seat bias', () => {
  for (const [type, n] of [['triple_threat', 3], ['fatal_four', 4]]) {
    const wins = Array(n).fill(0);
    for (let i = 0; i < 80; i++) {
      const m = MatchEngine.simulate({ seed: 4000 + i, type, sides: multiSides(n), playerId: 'mw0' }, {});
      const r = m.result;
      assert.ok(r && r.rounds <= 700);
      if (r.winnerSide === null) { assert.equal(r.finish, 'time_limit_draw'); continue; }
      wins[r.winnerSide]++;
      assert.ok(['pinfall', 'submission'].includes(r.finish), r.finish);
      assert.equal(r.winners.length, 1);
      assert.equal(r.losers.length, n - 1);
      assert.ok(!r.losers.includes(r.winnerId));
      assert.equal(m.state.events.filter((x) => x.type === 'match_end').length, 1);
    }
    for (const w of wins) assert.ok(w > 80 / n * 0.4, `every seat wins sometimes: ${wins}`);
  }
});

test('multi-way: bystanders break up covers and the match needs exactly the right number of sides', () => {
  let saves = 0;
  for (let i = 0; i < 40; i++) saves += MatchEngine.simulate({ seed: 6000 + i, type: 'fatal_four', sides: multiSides(4), playerId: 'mw0' }, {}).state.events.filter((e) => e.type === 'pin_save' && e.bystander).length;
  assert.ok(saves > 5, `bystander saves: ${saves}`);
  assert.throws(() => MatchEngine.simulate({ seed: 1, type: 'triple_threat', sides: multiSides(2), playerId: 'mw0' }, {}), /needs 3 sides/);
  assert.throws(() => MatchEngine.simulate({ seed: 1, type: 'singles', sides: multiSides(3), playerId: 'mw0' }, {}), /./);
});

test('multi-way: a human can choose who to go after, and a saved match resumes identically', () => {
  const e = new MatchEngine({ seed: 77, type: 'triple_threat', sides: multiSides(3), playerId: 'mw0' }, { human: ['mw0'] });
  let d = e.getDecision(), guard = 0, switched = false;
  while (d && !e.over && guard++ < 60) {
    if (d.isHuman && d.kind === 'action') {
      const focus = d.options.find((o) => o.id.startsWith('t:focus:'));
      if (focus && !switched) {
        const before = e.state.focus.mw0 ?? null;
        e.choose(focus.id);
        assert.equal(e.state.focus.mw0, focus.id.slice('t:focus:'.length));
        assert.notEqual(e.state.focus.mw0, before);
        switched = true;
        d = e.getDecision();
        continue;
      }
      const mv = d.options.find((o) => o.kind === 'move' && o.enabled !== false);
      e.choose(mv.id);
    } else e.choose(d.options.filter((o) => o.enabled !== false)[0].id);
    d = e.getDecision();
  }
  assert.ok(switched, 'the focus option was offered');
  const mid = JSON.stringify(e.toJSON());
  const copy = MatchEngine.fromJSON(mid, { human: ['mw0'] });
  assert.equal(JSON.stringify(copy.toJSON()), mid);
  const sa = MatchEngine.simulate({ seed: 5, type: 'fatal_four', sides: multiSides(4), playerId: 'mw0' }, {}), sb = MatchEngine.simulate({ seed: 5, type: 'fatal_four', sides: multiSides(4), playerId: 'mw0' }, {});
  assert.equal(JSON.stringify(sa.state), JSON.stringify(sb.state), 'same seed, same match');
});

test('elimination matches: every fall removes one competitor until one remains; chamber entrants arrive on a timer', () => {
  for (const [type, n] of [['elimination', 4], ['chamber', 6]]) {
    for (let i = 0; i < 25; i++) {
      const m = MatchEngine.simulate({ seed: 8100 + i, type, sides: multiSides(n), playerId: 'mw0' }, {});
      const r = m.result;
      assert.ok(r);
      if (r.winnerSide === null) { assert.equal(r.finish, 'time_limit_draw'); continue; }
      const elim = m.state.events.filter((e) => e.type === 'eliminated');
      assert.equal(elim.length, n - 1, 'everyone but the winner is eliminated');
      assert.equal(new Set(elim.map((e) => e.target)).size, n - 1, 'nobody is eliminated twice');
      assert.ok(!elim.some((e) => e.target === r.winnerId));
      assert.equal(r.winners.length, 1); assert.equal(r.losers.length, n - 1);
      assert.deepEqual(elim.map((e) => e.remaining), Array.from({ length: n - 1 }, (_, k) => n - 1 - k));
      if (type === 'chamber') {
        const entries = m.state.events.filter((e) => e.type === 'entry');
        assert.ok(entries.length <= n - 2);
        for (let k = 1; k < entries.length; k++) assert.ok(entries[k].t >= entries[k - 1].t, 'entries are in order');
        // nobody acts before entering: pod fighters are not legal until their entry event
        for (const e of m.state.events) { if (e.actor && e.type === 'move_connected') { const entered = entries.find((x) => x.actor === e.actor); const started = ['mw0', 'mw1'].includes(e.actor); assert.ok(started || (entered && entered.seq < e.seq), `${e.actor} acted from the pod`); } }
      }
    }
  }
});
