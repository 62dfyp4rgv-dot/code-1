import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSim, getData, findNonFinite } from '../helpers.js';
import { serialize, deserialize, SaveError, peek } from '../../app/js/sim/save.js';

const body = (t) => t.split('\n').slice(2).join('\n');

test('same seed -> identical simulation; different seed -> different', async () => {
  const a = await makeSim({ seed: 21 }),
    b = await makeSim({ seed: 21 }),
    c = await makeSim({ seed: 22 });
  a.advanceMonths(18);
  b.advanceMonths(18);
  c.advanceMonths(18);
  assert.equal(body(serialize(a)), body(serialize(b)));
  assert.notEqual(body(serialize(a)), body(serialize(c)));
});
test('save -> load -> continue is bit-identical to an uninterrupted run (incl. wars in progress)', async () => {
  const data = await getData();
  const A = await makeSim({ seed: 5, scenario: 'fault_lines', player: 'DEU' });
  A.advanceMonths(3);
  assert.ok(
    A.state.wars.some((w) => w.active),
    'a war is in progress at save time',
  );
  const B = deserialize(data, serialize(A));
  A.advanceMonths(10);
  B.advanceMonths(10);
  assert.equal(body(serialize(A)), body(serialize(B)));
});
test('commands issued after a load behave identically', async () => {
  const data = await getData();
  const A = await makeSim({ seed: 9, player: 'FRA' });
  A.advanceMonths(6);
  const B = deserialize(data, serialize(A));
  for (const s of [A, B]) {
    s.exec({ type: 'setPolicy', key: 'taxRate', value: 0.3 });
    s.exec({ type: 'propose', to: s.geo.idOf.DEU, kind: 'trade_agreement' });
    s.advanceMonths(8);
  }
  assert.equal(body(serialize(A)), body(serialize(B)));
});
test('save header is readable without parsing the body; state has no NaN/Infinity', async () => {
  const sim = await makeSim({ player: 'JPN' });
  sim.advanceMonths(3);
  const txt = serialize(sim, { label: 'test' });
  const h = peek(txt);
  assert.equal(h.player, 'JPN');
  assert.equal(h.scenario, 'quiet_decade');
  assert.equal(h.label, 'test');
  assert.deepEqual(findNonFinite(sim.state), []);
});
test('corrupted, truncated and foreign saves are rejected cleanly', async () => {
  const data = await getData();
  const sim = await makeSim();
  sim.advanceMonths(2);
  const txt = serialize(sim);
  assert.throws(() => deserialize(data, 'garbage'), SaveError);
  assert.throws(() => deserialize(data, ''), SaveError);
  assert.throws(() => deserialize(data, txt.slice(0, txt.length >> 1)), SaveError);
  const flipped = txt.slice(0, txt.length - 500) + 'X' + txt.slice(txt.length - 499);
  assert.throws(() => deserialize(data, flipped), SaveError);
  const lines = txt.split('\n');
  lines[0] = lines[0].replace('modern-age-save', 'other');
  assert.throws(() => deserialize(data, lines.join('\n')), SaveError);
  // newer-version save is refused instead of misread
  const j = JSON.parse(lines[2]);
  j.version = 999;
  const { checksum } = await import('../../app/js/sim/save.js');
  const nb = JSON.stringify(j);
  assert.throws(
    () => deserialize(data, [txt.split('\n')[0], checksum(nb), nb].join('\n')),
    /newer game version|No migration|missing|corrupt/,
  );
});
test('save size is bounded (< 6 MB uncompressed)', async () => {
  const sim = await makeSim({ scenario: 'fault_lines' });
  sim.advanceMonths(24);
  assert.ok(serialize(sim).length < 6e6, 'save size ' + serialize(sim).length);
});

test('save at an arbitrary month and continue for 6 months is bit-identical (regression: time-keyed perception cache)', async () => {
  const { loadDataNode } = await import('../../app/js/sim/data.js');
  const { Sim } = await import('../../app/js/sim/world.js');
  const { serialize, deserialize } = await import('../../app/js/sim/save.js');
  const data = await loadDataNode();
  for (const [seed, scenario, player, m0] of [
    [5, 'quiet_decade', 'NOR', 1],
    [9, 'fault_lines', 'IND', 4],
  ]) {
    const A = new Sim(data, { seed, scenario, player });
    A.advanceMonths(m0);
    const B = deserialize(data, serialize(A, {}));
    A.advanceMonths(6);
    B.advanceMonths(6);
    const body = (s) => serialize(s, {}).split('\n').slice(2).join('\n');
    assert.equal(body(A) === body(B), true, `${scenario}/${seed}: state diverged after load at month ${m0}`);
  }
});

test('the simulation core refuses to serialise a half-processed day (no silent state loss)', async () => {
  const { loadDataNode } = await import('../../app/js/sim/data.js');
  const { Sim } = await import('../../app/js/sim/world.js');
  const sim = new Sim(await loadDataNode(), { seed: 5, scenario: 'quiet_decade', player: 'NOR' });
  while (!sim.calendar.isMonthStart(sim.state.day + 1)) sim.step();
  const gen = sim.stepGen();
  gen.next();
  assert.throws(() => serialize(sim, {}), SaveError);
  while (!gen.next().done);
  assert.doesNotThrow(() => serialize(sim, {}));
});

test('every scenario boots, runs a year with finite state, and survives a save/load round trip', async () => {
  const { loadDataNode } = await import('../../app/js/sim/data.js');
  const { Sim } = await import('../../app/js/sim/world.js');
  const data = await loadDataNode();
  assert.ok(data.scenarios.length >= 6);
  for (const sc of data.scenarios) {
    const sim = new Sim(data, { seed: 9, scenario: sc.id, player: sc.recommended[0] });
    sim.advanceMonths(12);
    assert.deepEqual(findNonFinite(sim.state), [], sc.id);
    const copy = deserialize(data, serialize(sim, {}));
    assert.equal(copy.state.day, sim.state.day, sc.id);
  }
});

test('world variation: deterministic per seed, off by default, and it really changes how the decade plays out', async () => {
  const { loadDataNode } = await import('../../app/js/sim/data.js');
  const { Sim } = await import('../../app/js/sim/world.js');
  const data = await loadDataNode();
  const make = (variation) => new Sim(data, { seed: 77, scenario: 'quiet_decade', player: 'BRA', variation });
  const body = (s) => serialize(s, {}).split('\n').slice(2).join('\n');
  const a = make(2);
  const b = make(2);
  assert.equal(body(a), body(b), 'same seed and level give the same world');
  const base = make(0);
  assert.notEqual(body(a), body(base));
  for (const s of [a, base]) s.advanceMonths(60);
  assert.deepEqual(findNonFinite(a.state), []);
  const growth = (s) => s.state.countries.map((c) => c.econ.gdp / c.econ.gdp0);
  const ga = growth(a);
  const gb = growth(base);
  let moved = 0;
  for (let i = 0; i < ga.length; i++) if (Math.abs(ga[i] - gb[i]) > 0.08) moved++;
  assert.ok(moved >= 40, 'many countries follow a visibly different path: ' + moved);
});
