import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('AI decision modules read other countries only through perception (no hidden information)', () => {
  const dir = path.resolve('app/js/ai');
  for (const f of ['econ.js', 'diplo.js', 'war.js', 'spy.js']) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    assert.ok(!/\.countries\b/.test(src), `${f} must not touch state.countries directly`);
    assert.ok(!/\bperceive\(/.test(src), `${f} must use the prepared view, not raw perceive`);
    assert.ok(
      !/sim\.state\.reg\b[^;]*owner/.test(src) || f === 'war.js',
      `${f} region ownership is public information only in war planning`,
    );
  }
  const p = fs.readFileSync(path.join(dir, 'perception.js'), 'utf8');
  assert.ok(/perceive\(/.test(p), 'perception.js builds views from noisy estimates');
});
test('AI uses the same command layer as the player (no direct mutation of other countries)', () => {
  const dir = path.resolve('app/js/ai');
  for (const f of ['econ.js', 'diplo.js', 'war.js', 'spy.js']) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    assert.ok(/sim\.exec\(/.test(src), f + ' issues commands');
    assert.ok(!/\.econ\.\w+\s*[+\-*]?=[^=]/.test(src.replace(/const [^;]*;/g, '')), f + ' must not write economy state directly');
  }
});
test('perceived intelligence is noisy and improves with networks', async () => {
  const { makeSim } = await import('../helpers.js');
  const { perceive } = await import('../../app/js/sim/intel.js');
  const sim = await makeSim();
  const me = sim.geo.idOf.BRA,
    t = sim.geo.idOf.CHN;
  const truth = sim.state.countries[t].econ.gdp;
  const p0 = perceive(sim, me, t);
  assert.ok(p0.gdp !== truth && Math.abs(Math.log(p0.gdp / truth)) < 1.0);
  sim.state.countries[me].intel.nets[t] = 100;
  sim._estCache = null;
  const p1 = perceive(sim, me, t);
  assert.ok(p1.sigma < p0.sigma, 'strong network narrows uncertainty');
  assert.equal(perceive(sim, me, me).gdp, sim.state.countries[me].econ.gdp, 'own data is exact');
});
