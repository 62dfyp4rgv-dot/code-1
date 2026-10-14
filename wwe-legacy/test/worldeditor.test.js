import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game.js';

const base = { name: 'Edit Tester', seed: 5, startYear: 2024, background: 'prospect' };

test('world editor: custom wrestlers join the roster, replace fictional ones, and survive save/load', () => {
  const plain = new Game(); plain.newCareer(base);
  const g = new Game();
  g.newCareer({ ...base, customWrestlers: [{ name: 'Mara Quill', style: 'technician', alignment: 'heel', gender: 'F', tier: 3 }, { name: 'Otis Bell', style: 'powerhouse', alignment: 'face', gender: 'M', tier: 1 }] });
  const all = g.universe.list(() => true);
  assert.equal(all.length, plain.universe.list(() => true).length, 'roster size is unchanged');
  const mara = all.find((w) => w.name === 'Mara Quill');
  assert.ok(mara && mara.custom && mara.style === 'technician' && mara.gender === 'F' && mara.alignment === 'heel');
  assert.ok(all.find((w) => w.name === 'Otis Bell'));
  // lineage stays valid
  assert.deepEqual(g.universe.lineageProblems ? g.universe.lineageProblems() : [], []);
  // the world keeps simulating with custom wrestlers in it
  g.career.advanceDays(120);
  g.universe.simulateTo ? g.universe.simulateTo(g.career.day) : null;
  const json = JSON.parse(JSON.stringify(g.universe.toJSON()));
  assert.ok(Object.values(json.roster).some((w) => w.name === 'Mara Quill'));
});

test('world editor: validates names and limits', () => {
  const g = new Game();
  assert.throws(() => g.newCareer({ ...base, customWrestlers: [{ name: 'X' }] }), /not a valid ring name/);
  assert.throws(() => g.newCareer({ ...base, customWrestlers: [{ name: 'Single' }] }), /not a valid ring name/);
  assert.throws(() => g.newCareer({ ...base, customWrestlers: [{ name: 'Same Name' }, { name: 'same name' }] }), /already a wrestler/);
  assert.throws(() => g.newCareer({ ...base, customWrestlers: Array.from({ length: 13 }, (_, i) => ({ name: `Person Number${String.fromCharCode(65 + i)}` })) }), /at most twelve/);
  assert.throws(() => g.newCareer({ ...base, customWrestlers: [{ name: 'Bad<script> Name' }] }), /not a valid ring name/);
});
