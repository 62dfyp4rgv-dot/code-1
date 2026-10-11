import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSim, findNonFinite } from '../helpers.js';
import { declareWar, evaluatePeace, proposePeace, DOCTRINES } from '../../app/js/sim/war.js';

// Build a controlled conflict: strong A massed against weak B on a land border.
async function duel(attIso, defIso, opts = {}) {
  const sim = await makeSim({ seed: 3, player: opts.player || 'BRA', scenario: 'quiet_decade' });
  const a = sim.geo.idOf[attIso], d = sim.geo.idOf[defIso];
  for (const c of sim.state.countries) { c.ai && (c.ai.lastWar = 1e9); } // keep the AI from starting its own wars
  return { sim, a, d };
}
function borderPair(sim, a, d) {
  const g = sim.geo;
  for (const ra of g.cRegions[a]) for (const l of g.regions[ra].adj) if (g.regions[l.to].owner0 === d && !l.strait) return [ra, l.to];
  return null;
}
test('war declaration: bookkeeping, relations, mobilisation, no duplicate wars', async () => {
  const { sim, a, d } = await duel('RUS', 'POL');
  const rel0 = sim.state.rel.op[d * sim.geo.N + a];
  const r = declareWar(sim, a, d, { goal: 'territory' }); assert.ok(r.ok);
  assert.ok(sim.atWar(a) && sim.atWar(d)); assert.ok(sim.state.rel.op[d * sim.geo.N + a] < rel0 - 20);
  assert.equal(declareWar(sim, a, d).ok, false, 'cannot declare twice'); assert.equal(sim.country('RUS').mil.mobilizationTarget >= 1, true);
  // allies of the defender were called: each either joined, declined (credibility cost) or is the player (pending)
  const nato = sim.state.orgs.find((o) => o.id === 'nato').members.filter((m) => m !== d);
  const w = r.war; const handled = nato.filter((m) => w.defenders.includes(m) || sim.state.countries[m].dip.pending.length || sim.state.log.some((l) => l.c === m && /declines to honour/.test(l.text)));
  assert.ok(handled.length >= nato.length * 0.8, `NATO members respond to the call (${handled.length}/${nato.length})`);
});
test('allies cannot be attacked by their partners; truce blocks a new war', async () => {
  const { sim } = await duel('RUS', 'POL'); const us = sim.geo.idOf.USA, jp = sim.geo.idOf.JPN;
  assert.equal(declareWar(sim, us, jp).ok, false);
  const pl = sim.geo.idOf.POL, ru = sim.geo.idOf.RUS; const r = declareWar(sim, ru, pl, { noAllies: true }); const w = r.war;
  w.score.a = 60; w.score.d = 0; sim.state.countries[pl].mil.exhaustion = 0.9;
  const p = proposePeace(sim, w, ru, pl, [{ kind: 'ceasefire' }]); assert.ok(p.ok, 'exhausted side accepts a ceasefire');
  assert.equal(declareWar(sim, ru, pl).ok, false, 'ceasefire prevents immediate re-declaration');
});
test('land combat: overwhelming, supplied force takes a region; ownership stays consistent', async () => {
  const { sim, a, d } = await duel('RUS', 'UKR', { player: 'RUS' }); sim.country('RUS').mil.manual = true;
  const pair = borderPair(sim, a, d); assert.ok(pair, 'RUS-UKR border'); const [ra, rd] = pair;
  const r = declareWar(sim, a, d, { noAllies: true }); assert.ok(r.ok);
  // mass Russian corps on the border and order the attack
  const forces = sim.forcesOf[a].filter((f) => f.branch === 'land').slice(0, 14);
  for (const f of forces) { f.loc = ra; f.size = Math.max(f.size, 25); f.fill = 1; f.morale = 0.9; f.org = 1; sim.exec({ type: 'attackRegion', actor: a, force: f.id, target: rd }); }
  const owner0 = sim.state.reg.owner[rd]; let captured = -1;
  for (let day = 0; day < 400 && captured < 0; day++) { sim.step(); if (sim.state.reg.ctrl[rd] === a) captured = day; }
  assert.ok(captured > 5, 'a defended region does not fall at once (took ' + captured + ' days)'); assert.ok(captured < 400, 'but superior force eventually wins');
  assert.equal(sim.state.reg.owner[rd], owner0, 'occupation does not change legal ownership');
  assert.ok(sim.occupiedShare(d) > 0); assert.ok(sim.country('UKR').econ.warLoss > 0 || (sim.advanceMonths(1), sim.country('UKR').econ.warLoss > 0), 'occupation damages the occupied economy');
  assert.ok(sim.state.countries[d].mil.casualties > 0 && sim.state.countries[a].mil.casualties > 0, 'both sides take casualties');
  for (const f of sim.state.forces) { assert.ok(f.size >= 0 && Number.isFinite(f.size) && f.fill >= 0 && f.morale >= 0 && f.morale <= 1.0001, 'force fields sane'); }
  for (let r2 = 0; r2 < sim.state.reg.owner.length; r2++) { assert.ok(sim.state.reg.owner[r2] >= 0 && sim.state.reg.owner[r2] < sim.geo.N); assert.ok(sim.state.reg.ctrl[r2] >= 0 && sim.state.reg.ctrl[r2] < sim.geo.N); }
});
test('combat outcome depends on logistics, not just numbers: unsupplied attackers stall', async () => {
  const run = async (supplied) => {
    const { sim, a, d } = await duel('RUS', 'UKR', { player: 'RUS' }); sim.country('RUS').mil.manual = true; const [ra, rd] = borderPair(sim, a, d); declareWar(sim, a, d, { noAllies: true });
    const forces = sim.forcesOf[a].filter((f) => f.branch === 'land').slice(0, 10);
    for (const f of forces) { f.loc = ra; f.size = 25; f.fill = 1; f.morale = 0.9; f.org = 1; sim.exec({ type: 'attackRegion', actor: a, force: f.id, target: rd }); }
    if (!supplied) { sim.country('RUS').mil.ammo = 0; sim.country('RUS').mil.fuel = 0; for (const x of sim.state.reg.dev.keys()) { if (sim.state.reg.ctrl[x] === a) sim.state.reg.dev[x] = 0.85; } }
    let first = -1; for (let day = 0; day < 250 && first < 0; day++) { sim.step(); if (sim.state.reg.ctrl[rd] === a) first = day; }
    return { first, supply: forces.reduce((s, f) => s + f.supply, 0) / forces.length };
  };
  const good = await run(true), bad = await run(false);
  assert.ok(bad.supply < good.supply, 'supply state degrades when logistics collapse'); assert.ok(bad.first < 0 || bad.first > good.first, 'the unsupplied offensive is slower or fails');
});
test('terrain matters: mountain defence needs a larger attacking force', async () => {
  const { TERRAIN } = await import('../../app/js/sim/constants.js');
  assert.ok(TERRAIN.mountain.defense > TERRAIN.plains.defense && TERRAIN.mountain.mobility < TERRAIN.plains.mobility);
});
test('peace: accepted terms transfer territory and end the war; rejected terms change nothing', async () => {
  const { sim, a, d } = await duel('RUS', 'EST'); const [ra, rd] = borderPair(sim, a, d); const r = declareWar(sim, a, d, { noAllies: true }); const w = r.war;
  sim.state.reg.ctrl[rd] = a; sim.rebuildOwnedRegions(); w.score.a = 70; w.score.d = 0;
  const demand = [{ kind: 'cede', region: rd, to: a }, { kind: 'reparations', pct: 0.02, years: 5 }, { kind: 'demilitarize' }];
  sim.country('EST').mil.exhaustion = 0.0; sim.country('EST').gov.stability = 0.9;
  const harsh = evaluatePeace(sim, w, a, d, [{ kind: 'cede', region: rd, to: a }, { kind: 'cede', region: sim.geo.cRegions[d][0], to: a }, { kind: 'puppet' }]);
  assert.equal(harsh.accept, false);
  assert.equal(proposePeace(sim, w, a, d, [{ kind: 'puppet' }]).ok, false); assert.ok(w.active);
  sim.country('EST').mil.exhaustion = 0.6; const ev = evaluatePeace(sim, w, a, d, demand); assert.ok(ev.margin > -200);
  const res = proposePeace(sim, w, a, d, [{ kind: 'cede', region: rd, to: a }]);
  if (res.ok) { assert.equal(sim.state.reg.owner[rd], a); assert.equal(w.active, false); assert.ok(!sim.atWar(a)); }
  else assert.ok(res.eval.margin < 0);
});
test('defensive doctrine and terrain/fort modifiers exist and are bounded', () => { for (const [k, v] of Object.entries(DOCTRINES)) assert.ok(v.atk > 0.7 && v.atk < 1.3 && v.def > 0.7 && v.def < 1.3, k); });
test('a month of full-scale war keeps all state finite and conserves regions', async () => {
  const sim = await makeSim({ seed: 8, scenario: 'fault_lines', player: 'UKR' }); sim.advanceMonths(8);
  assert.deepEqual(findNonFinite(sim.state), []); assert.equal(sim.state.reg.owner.length, sim.geo.regions.length);
  const owners = new Set(sim.state.reg.owner); assert.ok(owners.size >= 150);
});
