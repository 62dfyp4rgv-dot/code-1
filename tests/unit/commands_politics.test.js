import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSim } from '../helpers.js';
import { COMMAND_TYPES } from '../../app/js/sim/commands.js';
import { holdElection } from '../../app/js/sim/politics.js';

test('policy commands: cost political capital, preview is free, targets lag into effect', async () => {
  const sim = await makeSim({ player: 'FRA' }); const c = sim.player;
  const pc0 = c.gov.pc; const t0 = c.target.taxRate; const p0 = c.policy.taxRate;
  const prev = sim.exec({ type: 'setPolicy', key: 'taxRate', value: t0 + 0.05, preview: true });
  assert.ok(prev.ok && prev.cost > 0); assert.equal(c.gov.pc, pc0); assert.equal(c.target.taxRate, t0);
  const r = sim.exec({ type: 'setPolicy', key: 'taxRate', value: t0 + 0.05 });
  assert.ok(r.ok); assert.ok(Math.abs(c.gov.pc - (pc0 - r.cost)) < 1e-9); assert.ok(Math.abs(c.target.taxRate - (t0 + 0.05)) < 1e-9);
  assert.equal(c.policy.taxRate, p0, 'actual policy does not jump immediately');
  sim.advanceMonths(6); assert.ok(c.policy.taxRate > p0 + 0.02, 'policy converges towards the target over months');
});
test('policy commands reject invalid input and unaffordable changes', async () => {
  const sim = await makeSim({ player: 'FRA' }); const c = sim.player;
  assert.equal(sim.exec({ type: 'setPolicy', key: 'bogus', value: 1 }).ok, false);
  assert.equal(sim.exec({ type: 'nope' }).ok, false);
  c.gov.pc = 0.1; const r = sim.exec({ type: 'setPolicy', key: 'taxRate', value: 0.5 }); assert.equal(r.ok, false); assert.match(r.reason, /political capital/);
  c.gov.pc = 100;
  const v = sim.exec({ type: 'setPolicy', key: 'taxRate', value: 9 }); assert.ok(v.ok); assert.ok(c.target.taxRate <= 0.5, 'values are clamped to the lever range');
});
test('budget commands normalise shares and reject nonsense', async () => {
  const sim = await makeSim({ player: 'DEU' }); const c = sim.player;
  assert.equal(sim.exec({ type: 'setBudget', shares: { defense: -1 } }).ok, false);
  const r = sim.exec({ type: 'setBudget', shares: { defense: 0.4, welfare: 0.3 } }); assert.ok(r.ok);
  const sum = Object.values(c.target.budget).reduce((a, b) => a + b, 0); assert.ok(Math.abs(sum - 1) < 1e-9);
  assert.ok(c.target.budget.defense > 0.25);
  sim.advanceMonths(8); const b = c.policy.budget; assert.ok(Math.abs(Object.values(b).reduce((a, x) => a + x, 0) - 1) < 1e-9);
});
test('every command type is exercised by a handler and refuses missing arguments gracefully', async () => {
  const sim = await makeSim({ player: 'ITA' });
  for (const t of COMMAND_TYPES) { let r; assert.doesNotThrow(() => { r = sim.exec({ type: t }); }, `command ${t} must not throw on empty args`); assert.equal(typeof r.ok, 'boolean'); }
});
test('research: queue, prerequisites, progress and tech modifiers', async () => {
  const sim = await makeSim({ player: 'BRA' }); const c = sim.player;
  const avail = sim.data.techs.find((t) => !c.tech.known.includes(t.id) && t.req.every((r) => c.tech.known.includes(r)));
  assert.ok(avail, 'an available tech exists');
  const locked = sim.data.techs.find((t) => !c.tech.known.includes(t.id) && !t.req.every((r) => c.tech.known.includes(r)));
  if (locked) assert.equal(sim.exec({ type: 'queueTech', tech: locked.id }).ok, false);
  assert.ok(sim.exec({ type: 'queueTech', tech: avail.id }).ok); assert.equal(sim.exec({ type: 'queueTech', tech: avail.id }).ok, false, 'no duplicates');
  c.tech.queue[0].progress = avail.cost; sim.advanceMonths(1);
  assert.ok(c.tech.known.includes(avail.id), 'completed tech is known');
  for (const e of avail.effects) assert.ok((c.techMods[e.k] || 0) >= e.v - 1e-12, 'effect applied: ' + e.k);
});
test('elections: parties compete, results recorded, incumbents can lose', async () => {
  const sim = await makeSim({ player: 'USA' });
  let changes = 0, runs = 0;
  for (const c of sim.state.countries.filter((x) => x.gov.nextElection !== null).slice(0, 60)) { const before = c.gov.parties[0].name; holdElection(sim, c, sim.state.day + 1); runs++; assert.ok(c.gov.lastElection && c.gov.lastElection.results.length >= 2); const tot = c.gov.lastElection.results.reduce((s, r) => s + r.share, 0); assert.ok(Math.abs(tot - 1) < 1e-9); if (c.gov.parties[0].name !== before) changes++; }
  assert.ok(runs > 30 && changes > 3 && changes < runs, `competitive elections (changes ${changes}/${runs})`);
});
test('economic pain lowers approval and stability (politics reads the economy)', async () => {
  const a = await makeSim({ seed: 4, player: 'FRA' }), b = await makeSim({ seed: 4, player: 'FRA' });
  const { addTimedMod } = await import('../../app/js/sim/mods.js');
  addTimedMod(b.country('GBR'), 'gdp.shock', -0.08, 400); addTimedMod(a.country('GBR'), 'gdp.shock', 0, 400);
  a.advanceMonths(9); b.advanceMonths(9);
  assert.ok(b.country('GBR').econ.unemp > a.country('GBR').econ.unemp, 'shock raises unemployment');
  assert.ok(b.country('GBR').gov.approval < a.country('GBR').gov.approval, 'and lowers approval');
});
test('regime collapse can occur but needs sustained instability', async () => {
  const sim = await makeSim({ player: 'USA' }); const c = sim.country('MLI'); const t = c.gov.type;
  c.gov.stability = 0.5; sim.advanceMonths(3); assert.equal(c.gov.type, t, 'stable country keeps regime');
  let changed = false; for (let i = 0; i < 40 && !changed; i++) { c.gov.collapseTimer = 7; c.gov.stability = 0.05; c.gov.approval = 0.1; sim.advanceMonths(1); changed = c.gov.collapses > 0; }
  assert.ok(changed, 'a collapsing government is eventually replaced');
});
