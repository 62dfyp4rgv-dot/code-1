import test from 'node:test';
import assert from 'node:assert/strict';
import { Career } from '../src/career/career.js';
import { Universe } from '../src/universe/universe.js';
import { UniverseSim } from '../src/universe/sim.js';

test('AI factions form, stay consistent and disband cleanly', () => {
  const c = new Career({ seed: 4, startYear: 2024, player: { id: 'player', name: 'P' } });
  c.universe = Universe.create({ seed: 4, mode: 'historical', year: 2024 });
  const sim = new UniverseSim(c);
  sim.advanceTo(365 * 2);
  const u = c.universe;
  assert.ok((sim.stats.factions || 0) >= 3, `factions formed: ${sim.stats.factions}`);
  for (const f of Object.values(u.factions)) {
    if (f.status === 'active') {
      assert.ok(f.members.length >= 2);
      assert.ok(f.members.includes(f.leader));
      for (const id of f.members) assert.equal(u.get(id).faction, f.id, `${id} should point at ${f.id}`);
    } else assert.equal(f.members.length, 0);
  }
  const seen = new Set();
  for (const f of Object.values(u.factions).filter((x) => x.status === 'active')) for (const id of f.members) { assert.ok(!seen.has(id), 'no wrestler is in two factions'); seen.add(id); }
  assert.deepEqual(u.lineageProblems(), []);
});

test('a faction survives save and load of the universe', () => {
  const c = new Career({ seed: 4, startYear: 2024, player: { id: 'player', name: 'P' } });
  c.universe = Universe.create({ seed: 4, mode: 'historical', year: 2024 });
  new UniverseSim(c).advanceTo(400);
  const back = Universe.fromJSON(JSON.parse(JSON.stringify(c.universe.toJSON())));
  assert.deepEqual(back.factions, c.universe.factions);
});
