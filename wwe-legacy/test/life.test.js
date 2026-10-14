import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playCareer } from '../tools/careersim.js';
import { Game } from '../src/game.js';
import { LIFE_ACTIVITIES, recoveryBonus, lifeView } from '../src/career/life.js';
import { Career } from '../src/career/career.js';

// a situation may fire after any day; settle it with its first enabled choice so the next activity can proceed
const settle = (g) => { let n = 0; while (g.pendingScenario() && n++ < 5) { const inst = g.pendingScenario(); const ch = (inst.choices || []).find((x) => !x.disabled) || inst.choices[0]; g.resolveScenario(ch.id); } };

test('life activities: ledger event, bounded stats, cost, and effect on recovery', () => {
  const g = new Game(); g.newCareer({ name: 'Life Tester', seed: 8, startYear: 2024 });
  const c = g.career, p = c.player;
  assert.equal(g.lifeView().mood, 'Good');
  const w0 = p.life.wellbeing, f0 = p.life.family, d0 = c.day;
  const r = g.lifeAct('family');
  assert.equal(c.day, d0 + 1);
  assert.ok(p.life.family > f0 - 6 && p.life.wellbeing > w0 - 2);
  assert.ok(c.memory.ledger.get(r.event.id) && r.event.type === 'life_activity');
  assert.equal(c.stats.s.lifeActivities, 1);
  p.money = 10;
  settle(g);
  assert.throws(() => g.lifeAct('physio'), /afford/);
  assert.throws(() => g.lifeAct('nonsense'), /unknown/);
  // wellbeing changes how fast tired legs recover
  p.life.wellbeing = 100; assert.ok(recoveryBonus(p) > 1);
  p.life.wellbeing = 0; assert.ok(recoveryBonus(p) < -1);
  for (const id of Object.keys(LIFE_ACTIVITIES)) p.life.wellbeing = 60;
});

test('life: neglect erodes family and burnout slows recovery over months; stats rebuild from the ledger', () => {
  const g = new Game(); g.newCareer({ name: 'Life Tester', seed: 9, startYear: 2024 });
  const c = g.career, p = c.player;
  p.life.family = 40; p.fatigue = 90;
  c.advanceDays(60);
  assert.ok(p.life.family <= 31, `family should fade, was ${p.life.family}`);
  assert.ok(lifeView(c).wellbeing <= 61);
});

test('life: balanced day-off careers earn the achievements and persist across save/load', async () => {
  const g = new Game(); g.newCareer({ name: 'Life Tester', seed: 10, startYear: 2024 });
  const c = g.career;
  c.player.money = 100000;
  for (const id of Object.keys(LIFE_ACTIVITIES)) { settle(g); g.lifeAct(id); }
  assert.ok(c.achievements.unlocked.life_balanced, 'Well Rounded should unlock after trying every activity');
  for (let i = 0; i < 4; i++) { settle(g); g.lifeAct('family'); }
  assert.ok(c.achievements.unlocked.family_5);
  const before = JSON.stringify(c.player.life);
  const back = Career.fromJSON(JSON.parse(JSON.stringify(c.toJSON())));
  assert.equal(JSON.stringify(back.player.life), before);
});
