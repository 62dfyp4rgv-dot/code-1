import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSim, getData } from '../helpers.js';
import { STAT_PATHS } from '../../app/js/sim/events.js';
import { serialize, deserialize } from '../../app/js/sim/save.js';
import * as MAN from '../../app/js/sim/mandates.js';

test('mandate data: stats are known, kinds valid, targets lie beyond the trigger, ids unique', async () => {
  const d = await getData();
  assert.ok(d.mandates.length >= 15);
  const ids = new Set();
  for (const t of d.mandates) {
    assert.ok(!ids.has(t.id), 'duplicate ' + t.id);
    ids.add(t.id);
    assert.ok(STAT_PATHS.includes(t.stat), `${t.id} stat ${t.stat}`);
    for (const w of t.when) assert.ok(STAT_PATHS.includes(w[0]), `${t.id} condition ${w[0]}`);
    assert.ok(['reach', 'hold'].includes(t.kind));
    assert.ok(t.months >= 6 && t.reward.pc > 0 && t.reward.pc <= 15);
    assert.ok(['pct', 'dec', 'mo', 'num', 'bool'].includes(t.unit), t.id + ' unit');
    if (t.kind === 'reach') assert.ok(t.delta !== 0 && typeof t.delta === 'number');
    else assert.ok(t.hold > 0 && t.hold <= t.months, t.id + ' hold fits the deadline');
  }
});
test('mandates are issued to the player only, never exceed the cap, and are saved and restored', async () => {
  const sim = await makeSim({ seed: 21, player: 'NGA' });
  sim.advanceMonths(8);
  const m = sim.player.mandates;
  assert.ok(m && m.active.length >= 1 && m.active.length <= MAN.MAX_ACTIVE, 'a mandate was issued');
  assert.equal(sim.state.countries.filter((c) => c.mandates).length, 1, 'only the player gets mandates');
  const copy = deserialize(sim.data, serialize(sim));
  assert.deepEqual(copy.player.mandates, sim.player.mandates);
  sim.advanceMonths(2);
  copy.advanceMonths(2);
  assert.deepEqual(copy.player.mandates, sim.player.mandates, 'identical after continuing');
});
test('a reached mandate pays out political capital and counts; a missed one costs nothing; dismiss clears it', async () => {
  const sim = await makeSim({ seed: 8, player: 'FRA' });
  const c = sim.player;
  const m = MAN.ensure(c);
  const t = sim.data.mandates.find((x) => x.id === 'win_back_voters');
  c.gov.approval = 0.4;
  m.active.push({ id: t.id, start: sim.state.day, deadline: sim.state.day + 600, from: 0.4, goal: 0.48, streak: 0 });
  const pc0 = c.gov.pc;
  c.gov.approval = 0.55;
  MAN.monthlyStep(sim, sim.state.day);
  assert.equal(m.done, 1);
  assert.ok(c.gov.pc >= pc0 + t.reward.pc - 1e-9, 'reward paid');
  assert.equal(sim.state.counters.mandates, 1);
  m.active.length = 0;
  m.active.push({ id: 'steady_ship', start: 0, deadline: sim.state.day - 1, from: 0.4, goal: 0.9, streak: 0 });
  const pc1 = c.gov.pc;
  MAN.monthlyStep(sim, sim.state.day);
  assert.equal(m.failed, 1);
  assert.ok(c.gov.pc <= pc1 + 1e-9);
  m.active.push({ id: 'jobs_drive', start: 0, deadline: sim.state.day + 900, from: 0.09, goal: 0.07, streak: 0 });
  assert.equal(sim.exec({ type: 'dismissMandate', mandate: 'jobs_drive' }).ok, true);
  assert.equal(sim.exec({ type: 'dismissMandate', mandate: 'jobs_drive' }).ok, false);
});
test('a hold mandate needs an unbroken streak', async () => {
  const sim = await makeSim({ seed: 9, player: 'FRA' });
  const c = sim.player;
  const m = MAN.ensure(c);
  m.active.push({ id: 'quiet_streak', start: sim.state.day, deadline: sim.state.day + 2000, from: 0, goal: null, streak: 23 });
  MAN.monthlyStep(sim, sim.state.day);
  assert.equal(m.done, 1, 'at peace for 24 months completes it');
  m.active.push({ id: 'calm_prices', start: sim.state.day, deadline: sim.state.day + 2000, from: 0, goal: null, streak: 10 });
  c.econ.infl = 0.08;
  MAN.monthlyStep(sim, sim.state.day);
  assert.equal(m.active.find((a) => a.id === 'calm_prices').streak, 0, 'violation resets the streak');
});
