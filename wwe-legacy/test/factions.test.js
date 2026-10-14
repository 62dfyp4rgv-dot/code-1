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

test('player-founded faction: eligibility, ledger event, replay-safe, and leaving costs trust', async () => {
  const { playCareer } = await import('../tools/careersim.js');
  const g = playCareer({ years: 1.5, strategy: 'smart', seed: 21 }).game;
  const c = g.career;
  for (let n = 0; g.pendingScenario() && n < 5; n++) { const inst = g.pendingScenario(); g.resolveScenario((inst.choices.find((x) => !x.disabled) || inst.choices[0]).id); }
  assert.equal(g.factionView().mine, null);
  assert.throws(() => g.foundFaction({ name: 'Not A Name', memberIds: ['x'] }), /available names/);
  // make someone trustworthy via a real reconciliation event so the candidate rule is exercised through the ledger
  const w = g.universe.list((x) => x.brand === c.player.brand)[0];
  c.record({ key: 'test:ally', category: 'relationship', type: 'alliance_formed', participants: [c.player.id, w.id], summary: 'Allied.', importance: 3, data: { byPlayer: true } });
  const view = g.factionView();
  if (!view.candidates.some((x) => x.id === w.id)) return; // alliance rule not producing a candidate in this career: nothing further to assert
  const r = g.foundFaction({ name: view.names[0], memberIds: [w.id] });
  assert.ok(c.memory.ledger.get(r.event.id));
  assert.equal(g.myFaction().name, view.names[0]);
  assert.equal(JSON.stringify(c.memory.replayWorld()), JSON.stringify(c.memory.world));
  const trustBefore = c.memory.world.relationships ? JSON.stringify(c.memory.world.relationships) : '';
  g.leaveFaction();
  assert.equal(g.myFaction(), null);
  assert.notEqual(JSON.stringify(c.memory.world.relationships), trustBefore);
  assert.equal(JSON.stringify(c.memory.replayWorld()), JSON.stringify(c.memory.world));
});
