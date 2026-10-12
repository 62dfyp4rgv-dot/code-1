import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSim, getData } from '../helpers.js';
import { MODIFIER_KEYS } from '../../app/js/sim/mods.js';
import { STAT_PATHS } from '../../app/js/sim/events.js';
import { serialize, deserialize } from '../../app/js/sim/save.js';
import * as PRJ from '../../app/js/sim/projects.js';

test('project data: effects use known modifier keys, conditions use known stats, ids unique', async () => {
  const d = await getData();
  assert.ok(d.projects.length >= 12);
  const ids = new Set();
  for (const p of d.projects) {
    assert.ok(!ids.has(p.id), 'duplicate ' + p.id);
    ids.add(p.id);
    assert.ok(p.years >= 2 && p.cost > 0 && p.cost < 0.03, p.id + ' cost/duration plausible');
    for (const e of p.effects) assert.ok(MODIFIER_KEYS.includes(e.mod), `${p.id} modifier ${e.mod}`);
    for (const c of p.when || []) assert.ok(STAT_PATHS.includes(c[0]), `${p.id} condition ${c[0]}`);
  }
});
test('starting a project spends political capital, borrows monthly, and grants permanent modifiers on completion', async () => {
  const sim = await makeSim({ seed: 12, player: 'DEU' });
  const c = sim.country('DEU');
  c.gov.pc = 100;
  const r = sim.exec({ type: 'startProject', project: 'cyber_command' });
  assert.equal(r.ok, true);
  assert.equal(c.gov.pc, 90);
  assert.equal(sim.exec({ type: 'startProject', project: 'cyber_command' }).ok, false, 'cannot start twice');
  const before = c.mc['cyber.def'] || 0;
  const twin = await makeSim({ seed: 12, player: 'DEU' });
  sim.advanceMonths(6);
  twin.advanceMonths(6);
  assert.ok(
    c.econ.debt > twin.country('DEU').econ.debt + 0.5 * 0.003 * c.econ.gdp * 0.5,
    'spending is borrowed (debt above the same game without the project)',
  );
  assert.equal(c.projects.done.length, 0, 'not finished yet');
  sim.advanceMonths(32);
  assert.deepEqual(c.projects.done, ['cyber_command']);
  assert.ok((c.mc['cyber.def'] || 0) > before + 0.09, 'permanent modifier applied');
  assert.equal(sim.exec({ type: 'startProject', project: 'cyber_command' }).ok, false, 'cannot repeat a completed project');
});
test('limits: two at a time, requirements, cancel', async () => {
  const sim = await makeSim({ seed: 12, player: 'DEU' });
  const c = sim.country('DEU');
  c.gov.pc = 200;
  assert.equal(sim.exec({ type: 'startProject', project: 'high_speed_rail' }).ok, true);
  assert.equal(sim.exec({ type: 'startProject', project: 'universal_healthcare' }).ok, true);
  assert.equal(sim.exec({ type: 'startProject', project: 'cyber_command' }).ok, false, 'at most two');
  assert.equal(sim.exec({ type: 'cancelProject', project: 'high_speed_rail' }).ok, true);
  assert.equal(sim.exec({ type: 'startProject', project: 'cyber_command' }).ok, true);
  const poor = await makeSim({ seed: 12, player: 'SOM' });
  poor.country('SOM').gov.pc = 100;
  assert.equal(poor.exec({ type: 'startProject', project: 'space_programme' }).ok, false, 'a poor country cannot start a space programme');
});
test('AI countries start projects, and saves taken mid-project resume identically', async () => {
  const sim = await makeSim({ seed: 5 });
  sim.advanceMonths(30);
  const started = sim.state.countries.filter((c) => c.projects && (c.projects.active.length || c.projects.done.length)).length;
  assert.ok(started >= 10, 'AI governments launch national projects: ' + started);
  const copy = deserialize(await getData(), serialize(sim, {}));
  sim.advanceMonths(8);
  copy.advanceMonths(8);
  const body = (s) => serialize(s, {}).split('\n').slice(2).join('\n');
  assert.equal(body(sim) === body(copy), true);
});

test('advisor: flags real problems, stays read-only, and points at screens', async () => {
  const { advise } = await import('../../app/js/sim/advisor.js');
  const { serialize } = await import('../../app/js/sim/save.js');
  const sim = await makeSim({ seed: 12, player: 'DEU' });
  const before = serialize(sim, {});
  const items = advise(sim);
  assert.ok(items.length >= 1);
  assert.equal(serialize(sim, {}), before, 'advise() does not change the simulation');
  const c = sim.country('DEU');
  c.econ.infl = 0.12;
  c.econ.reservesMonths = 0.5;
  c.gov.stability = 0.2;
  const ids = advise(sim).map((a) => a.id);
  for (const want of ['infl', 'reserves', 'stab']) assert.ok(ids.includes(want), want);
  assert.equal(advise(sim)[0].sev, 'bad', 'urgent items come first');
  for (const a of advise(sim)) assert.ok(typeof a.open === 'string' && a.title && a.text);
});
