import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSim, getData, findNonFinite } from '../helpers.js';
import { serialize, deserialize, SaveError, peek } from '../../app/js/sim/save.js';

const body = (t) => t.split('\n').slice(2).join('\n');

test('same seed -> identical simulation; different seed -> different', async () => {
  const a = await makeSim({ seed: 21 }), b = await makeSim({ seed: 21 }), c = await makeSim({ seed: 22 });
  a.advanceMonths(18); b.advanceMonths(18); c.advanceMonths(18);
  assert.equal(body(serialize(a)), body(serialize(b)));
  assert.notEqual(body(serialize(a)), body(serialize(c)));
});
test('save -> load -> continue is bit-identical to an uninterrupted run (incl. wars in progress)', async () => {
  const data = await getData();
  const A = await makeSim({ seed: 5, scenario: 'fault_lines', player: 'DEU' });
  A.advanceMonths(3);
  assert.ok(A.state.wars.some((w) => w.active), 'a war is in progress at save time');
  const B = deserialize(data, serialize(A));
  A.advanceMonths(10); B.advanceMonths(10);
  assert.equal(body(serialize(A)), body(serialize(B)));
});
test('commands issued after a load behave identically', async () => {
  const data = await getData();
  const A = await makeSim({ seed: 9, player: 'FRA' }); A.advanceMonths(6);
  const B = deserialize(data, serialize(A));
  for (const s of [A, B]) { s.exec({ type: 'setPolicy', key: 'taxRate', value: 0.3 }); s.exec({ type: 'propose', to: s.geo.idOf.DEU, kind: 'trade_agreement' }); s.advanceMonths(8); }
  assert.equal(body(serialize(A)), body(serialize(B)));
});
test('save header is readable without parsing the body; state has no NaN/Infinity', async () => {
  const sim = await makeSim({ player: 'JPN' }); sim.advanceMonths(3);
  const txt = serialize(sim, { label: 'test' }); const h = peek(txt);
  assert.equal(h.player, 'JPN'); assert.equal(h.scenario, 'quiet_decade'); assert.equal(h.label, 'test');
  assert.deepEqual(findNonFinite(sim.state), []);
});
test('corrupted, truncated and foreign saves are rejected cleanly', async () => {
  const data = await getData(); const sim = await makeSim(); sim.advanceMonths(2); const txt = serialize(sim);
  assert.throws(() => deserialize(data, 'garbage'), SaveError);
  assert.throws(() => deserialize(data, ''), SaveError);
  assert.throws(() => deserialize(data, txt.slice(0, txt.length >> 1)), SaveError);
  const flipped = txt.slice(0, txt.length - 500) + 'X' + txt.slice(txt.length - 499); assert.throws(() => deserialize(data, flipped), SaveError);
  const lines = txt.split('\n'); lines[0] = lines[0].replace('modern-age-save', 'other'); assert.throws(() => deserialize(data, lines.join('\n')), SaveError);
  // newer-version save is refused instead of misread
  const j = JSON.parse(lines[2]); j.version = 999; const { checksum } = await import('../../app/js/sim/save.js'); const nb = JSON.stringify(j);
  assert.throws(() => deserialize(data, [txt.split('\n')[0], checksum(nb), nb].join('\n')), /newer game version|No migration|missing|corrupt/);
});
test('save size is bounded (< 6 MB uncompressed)', async () => {
  const sim = await makeSim({ scenario: 'fault_lines' }); sim.advanceMonths(24);
  assert.ok(serialize(sim).length < 6e6, 'save size ' + serialize(sim).length);
});
