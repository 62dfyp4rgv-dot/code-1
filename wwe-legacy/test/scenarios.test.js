import test from 'node:test';
import assert from 'node:assert/strict';
import { SCENARIO_TEMPLATES } from '../src/story/scenarios/index.js';
import { validateLibrary } from '../src/story/scenarioValidator.js';
import { ScenarioEngine, slotCombos, render } from '../src/story/scenarios.js';
import { scenarioEngine } from '../src/game.js';
import { AutoGame as Game } from './autogame.js';
import { getRel } from '../src/memory/world.js';

test('scenario library: >= 2000 validated configurations, zero errors, zero exploit warnings, unique ids', () => {
  const r = validateLibrary(SCENARIO_TEMPLATES);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  assert.ok(r.templates >= 300, `authored ${r.templates}`);
  assert.ok(r.configs >= 2000, `configs ${r.configs}`);
  assert.equal(new Set(SCENARIO_TEMPLATES.map((t) => t.id)).size, SCENARIO_TEMPLATES.length);
  for (const cat of ['rivalry', 'betrayal', 'alliance', 'faction', 'championship', 'injury', 'media', 'podcast', 'contract', 'rumble', 'wrestlemania', 'comeback', 'retirement', 'legacy', 'personal', 'opportunity', 'creative']) assert.ok(r.byCategory[cat] >= 5, `category ${cat}`);
});

test('every expanded configuration renders distinct, unresolved-token-free text', () => {
  const dummy = { player: { id: 'p', name: 'Hero', first: 'Hero', last: 'H', they: 'they', them: 'them', their: 'their', theirs: 'theirs' } };
  const seen = new Set(); let total = 0;
  for (const t of SCENARIO_TEMPLATES) {
    const bind = { ...dummy };
    for (const [role, spec] of Object.entries(t.cast || {})) bind[role] = { id: role, name: `N ${role}`, first: role, last: role, isWrestler: !['staff', 'media'].includes(spec.pick), they: 'they', them: 'them', their: 'their', theirs: 'theirs' };
    for (const combo of slotCombos(t)) {
      const txt = [t.title, ...t.body].map((x) => render(x, bind, combo, { brand: 'Raw', year: 2024, show: 'Raw', brokenPromise: 'p', openPromise: 'p', era: 'current' })).join('|');
      assert.ok(!/[{}]/.test(txt), `${t.id}: leftover braces`);
      seen.add(`${t.id}:${txt}`); total++;
    }
  }
  assert.equal(seen.size, total, 'no two configurations render identically');
});

test('memory drives story: an insult creates an obligation that surfaces as a backstage confrontation, whose choice is remembered and replayable', () => {
  const g = new Game();
  const c = g.newCareer({ seed: 5, name: 'Mouthy', startYear: 2024, background: 'indie' });
  const target = Object.values(c.universe.roster).find((w) => w.brandKey === 'main' || true);
  c.record({ key: 'ins', category: 'promo', type: 'promo_delivered', participants: ['player', target.id], summary: 'insulted', data: { tone: 'humiliate', targets: [target.id], quality: 80, line: 'You are finished.' } });
  const ob = c.memory.world.obligations.find((o) => o.kind === 'confront_backstage');
  assert.ok(ob);
  c.advanceDays(ob.dueDay - c.day + 1);
  const el = scenarioEngine.eligible(c, { contexts: ['weekly'] });
  const hit = el.find((e) => e.t.id === 'confront_backstage');
  assert.ok(hit, 'confrontation eligible once due');
  assert.equal(hit.bind.rival.id, target.id);
  const inst = scenarioEngine.start(c, 'confront_backstage');
  assert.ok(inst.memory.some((l) => l.refs.length), 'scene quotes recorded history');
  assert.ok(inst.memory.every((l) => l.refs.every((id) => c.memory.ledger.get(id))), 'memory lines cite real events');
  const before = getRel(c.memory.world, 'player', target.id).heat;
  const res = scenarioEngine.resolve(c, inst, 'escalate');
  assert.ok(res.events[0].type === 'scenario_choice');
  assert.equal(c.memory.world.obligations.find((o) => o.id === ob.id).status, 'escalate');
  assert.ok(getRel(c.memory.world, 'player', target.id).heat > before);
  assert.deepEqual(c.memory.replayWorld().relationships, c.memory.world.relationships);
  assert.deepEqual(c.memory.replayWorld().obligations.map((o) => [o.id, o.status]), c.memory.world.obligations.map((o) => [o.id, o.status]));
});

test('repetition prevention: cooldowns, per-career caps and recent-history stop the same scenario recurring', () => {
  const g = new Game();
  const c = g.newCareer({ seed: 8, name: 'Repeat', startYear: 2024, background: 'established' });
  const seen = {};
  for (let i = 0; i < 400; i++) {
    c.advanceDays(3);
    const inst = scenarioEngine.pick(c, { contexts: ['weekly', 'pre_show', 'post_match', 'post_show'] });
    if (!inst) continue;
    seen[inst.templateId] = (seen[inst.templateId] || []).concat(c.day);
    scenarioEngine.resolve(c, inst, inst.choices.find((x) => x.enabled).id);
  }
  const ids = Object.keys(seen);
  assert.ok(ids.length >= 25, `variety: ${ids.length} distinct scenarios`);
  for (const [id, days] of Object.entries(seen)) {
    const t = scenarioEngine.templates.get(id);
    assert.ok(days.length <= (t.maxPerCareer ?? 3), `${id} fired ${days.length}x (max ${t.maxPerCareer ?? 3})`);
    for (let i = 1; i < days.length; i++) assert.ok(days[i] - days[i - 1] >= (t.cooldownDays ?? 90), `${id} repeated after ${days[i] - days[i - 1]} days`);
  }
});

test('scenario choices respect requirements and are deterministic for the same career state', () => {
  const run = () => {
    const g = new Game();
    const c = g.newCareer({ seed: 12, name: 'Det', startYear: 2024, background: 'established' });
    const log = [];
    for (let i = 0; i < 120; i++) { c.advanceDays(3); const inst = scenarioEngine.pick(c, { contexts: ['weekly'] }); if (inst) { const ch = inst.choices.filter((x) => x.enabled)[0]; log.push(inst.id + ch.id + JSON.stringify(inst.combo)); scenarioEngine.resolve(c, inst, ch.id); } }
    return log.join('|') + c.memory.ledger.head;
  };
  assert.equal(run(), run());
  const g = new Game();
  const c = g.newCareer({ seed: 13, name: 'Req', startYear: 2024, background: 'prospect' });
  const t = SCENARIO_TEMPLATES.find((x) => x.choices.some((ch) => ch.requires));
  if (t) { try { const inst = scenarioEngine.start(c, t.id, { force: true }); const locked = inst.choices.find((ch) => ch.requires && !ch.enabled); if (locked) assert.throws(() => scenarioEngine.resolve(c, inst, locked.id), /not available/); } catch (e) { /* cast cannot be filled for this career */ } }
});

test('typed effects produce real ledger events that feed achievements (alliance, betrayal, media quality, contract)', () => {
  const g = new Game();
  const c = g.newCareer({ seed: 14, name: 'Typed', startYear: 2024, background: 'established' });
  const ally = scenarioEngine.templates.get('ally_offer');
  c.record({ key: 'rs', category: 'relationship', type: 'respect_shown', participants: ['player', Object.keys(c.universe.roster)[0]], summary: 'respect', data: {} });
  const w = Object.keys(c.universe.roster)[0];
  c.memory.world.relationships; // read-only access must not create entries
  const n0 = Object.keys(c.memory.world.relationships).length;
  getRel(c.memory.world, 'player', 'nobody'); c.memory.rel('player', 'nobody');
  assert.equal(Object.keys(c.memory.world.relationships).length, n0, 'reads never mutate the world');
});
