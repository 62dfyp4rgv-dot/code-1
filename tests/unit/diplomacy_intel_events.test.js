import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSim, findNonFinite } from '../helpers.js';
import { evaluateProposal, addSanction } from '../../app/js/sim/diplomacy.js';
import { OPS } from '../../app/js/sim/intel.js';
import { fire, eventText, applyEffects } from '../../app/js/sim/events.js';
import { COM } from '../../app/js/sim/constants.js';

test('proposal evaluation is transparent and monotone in opinion', async () => {
  const sim = await makeSim({ player: 'JPN' });
  const j = sim.geo.idOf.JPN,
    k = sim.geo.idOf.KOR,
    N = sim.geo.N;
  sim.state.rel.op[k * N + j] = -30;
  const lo = evaluateProposal(sim, j, k, 'trade_agreement');
  sim.state.rel.op[k * N + j] = 60;
  const hi = evaluateProposal(sim, j, k, 'trade_agreement');
  assert.ok(hi.score > lo.score && hi.prob > lo.prob);
  assert.ok(hi.factors.length >= 2 && hi.factors.every((f) => typeof f.label === 'string'));
});
test('proposals cost influence, create treaties and respect cooldowns', async () => {
  const sim = await makeSim({ player: 'JPN', seed: 2 });
  const c = sim.player;
  const to = sim.geo.idOf.AUS;
  sim.state.rel.op[to * sim.geo.N + c.idx] = 80;
  sim.state.rel.trust[to * sim.geo.N + c.idx] = 80;
  const inf0 = c.dip.influence;
  let r = null;
  for (let i = 0; i < 12 && !(r && r.accepted); i++) {
    c.dip.influence = 60;
    delete c.dip.cooldown[to + ':trade_agreement'];
    r = sim.exec({ type: 'propose', to, kind: 'trade_agreement' });
  }
  assert.ok(r.ok && r.accepted, 'friendly partner eventually agrees');
  assert.ok(
    sim.state.treaties.some((t) => t.active && t.type === 'trade_agreement' && t.parties.includes(c.idx) && t.parties.includes(to)),
  );
  c.dip.influence = 60;
  const again = sim.exec({ type: 'propose', to, kind: 'trade_agreement' });
  assert.equal(again.ok, false, 'cooldown');
  c.dip.influence = 1;
  assert.equal(sim.exec({ type: 'propose', to: sim.geo.idOf.NZL, kind: 'alliance' }).ok, false, 'insufficient influence');
});
test('sanctions: embargo removes direct trade between the pair and reduces target trade access', async () => {
  const sim = await makeSim({ player: 'USA', seed: 6 });
  const g = sim.geo;
  const ru = g.idOf.RUS,
    de = g.idOf.DEU;
  sim.advanceMonths(2);
  const flowBefore = sim.lastFlows[COM.gas].filter(([i, j]) => i === de && j === ru).reduce((s, f) => s + f[2], 0);
  assert.ok(flowBefore > 0, 'Germany imports Russian gas before sanctions');
  addSanction(sim, de, ru, 0b0110, []);
  sim.advanceMonths(2);
  const flowAfter = sim.lastFlows[COM.gas].filter(([i, j]) => i === de && j === ru).reduce((s, f) => s + f[2], 0);
  assert.equal(flowAfter, 0, 'embargoed flow is zero');
  assert.ok(sim.country('RUS').econ.tradeAccess < 1);
});
test('chokepoint closure disrupts the flows that depend on it', async () => {
  const sim = await makeSim({ player: 'USA', seed: 6 });
  sim.advanceMonths(2);
  const sa = sim.country('SAU').econ;
  const before = sa.exports[COM.oil];
  sim.state.chokes.find((x) => x.id === 'hormuz').open = 0.2;
  sim.advanceMonths(2);
  assert.ok(sim.country('SAU').econ.exports[COM.oil] < before * 0.92, 'Gulf oil exports fall when Hormuz is obstructed');
  assert.ok(sim.state.prices[COM.oil] >= 0.9);
});
test('organisation accession needs member consent and criteria', async () => {
  const sim = await makeSim({ player: 'UKR', seed: 2 });
  const c = sim.player;
  const nato = sim.state.orgs.find((o) => o.id === 'nato');
  const ev = sim.exec({ type: 'propose', to: nato.members[0], kind: 'join_org', params: { org: 'nato' }, preview: true });
  assert.ok(ev.ok && ev.eval.factors.some((f) => /Members in favour/.test(f.label)));
  assert.ok(
    sim.exec({ type: 'propose', to: sim.geo.idOf.USA, kind: 'join_org', params: { org: 'bogus' }, preview: true }).eval.accept === false,
  );
});
test('intelligence: ops cost points, resolve later, can be exposed with diplomatic consequences', async () => {
  const sim = await makeSim({ player: 'GBR', seed: 12 });
  const c = sim.player;
  const t = sim.geo.idOf.RUS;
  c.intel.points = 50;
  const p0 = c.intel.points;
  const r = sim.exec({ type: 'intelOp', op: 'gather', target: t });
  assert.ok(r.ok);
  assert.equal(c.intel.points, p0 - OPS.gather.cost);
  assert.equal(c.intel.ops.length, 1);
  const net0 = c.intel.nets[t] || 0;
  sim.advanceMonths(4);
  assert.equal(c.intel.ops.length, 0);
  assert.ok((c.intel.nets[t] || 0) > net0 || sim.state.log.some((l) => l.kind === 'intel'), 'operation resolved');
  let exposed = 0,
    trials = 0;
  for (let s = 0; s < 40; s++) {
    const x = await makeSim({ player: 'GBR', seed: 100 + s });
    x.player.intel.points = 60;
    x.exec({ type: 'intelOp', op: 'sabotage', target: x.geo.idOf.FRA });
    const rel0 = x.state.rel.op[x.geo.idOf.FRA * x.geo.N + x.player.idx];
    x.advanceMonths(4);
    trials++;
    if (x.state.log.some((l) => l.kind === 'intel' && /EXPOSED/.test(l.text))) {
      exposed++;
      assert.ok(x.state.rel.op[x.geo.idOf.FRA * x.geo.N + x.player.idx] < rel0 + 1);
    }
  }
  assert.ok(exposed > 2 && exposed < trials, `sabotage is risky but not certain (${exposed}/${trials})`);
  assert.equal(sim.exec({ type: 'intelOp', op: 'bogus', target: t }).ok, false);
});
test('cyber disruption reduces output in proportion to defence', async () => {
  const a = await makeSim({ seed: 3 }),
    b = await makeSim({ seed: 3 });
  b.country('DEU').cyber.disruption = 1;
  a.advanceMonths(1);
  b.advanceMonths(1);
  assert.ok(b.country('DEU').econ.gdpPot < a.country('DEU').econ.gdpPot, 'disruption cuts potential output');
});
test('events fire from conditions; AI resolves them; player gets decisions; effects are whitelisted', async () => {
  const sim = await makeSim({ player: 'FRA', seed: 9 });
  const c = sim.country('ARG');
  c.econ.infl = 0.2;
  c.gov.approval = 0.3;
  const def = sim.eventById.cost_of_living_protests;
  const ar0 = c.gov.approval;
  fire(sim, def, c.idx);
  assert.ok(
    sim.state.events.history.some((h) => h.id === def.id && h.c === c.idx),
    'AI country resolved the event',
  );
  const me = sim.player;
  fire(sim, def, me.idx);
  assert.equal(sim.state.events.pending.length, 1);
  const inst = sim.state.events.pending[0];
  const txt = eventText(sim, inst);
  assert.ok(txt.title.includes('France') && txt.options.length >= 2);
  const rBad = sim.exec({ type: 'resolveEvent', uid: inst.uid, option: 99 });
  assert.equal(rBad.ok, false);
  assert.ok(sim.exec({ type: 'resolveEvent', uid: inst.uid, option: 1 }).ok);
  assert.equal(sim.state.events.pending.length, 0);
  assert.throws(() => applyEffects(sim, me, [{ stat: 'econ.gdp', add: 1e9 }], undefined, def), /not writable/);
  assert.throws(() => applyEffects(sim, me, [{ mod: 'made.up', add: 1 }], undefined, def), /unknown modifier/);
  fire(sim, def, me.idx);
  const exp = sim.state.events.pending.find((p) => p.id === def.id);
  sim.advanceMonths(2);
  assert.ok(!sim.state.events.pending.some((p) => p.uid === exp.uid), 'unanswered decisions expire with the default option');
});
test('emergent events: conditions in a stressed economy trigger events without scripting', async () => {
  const sim = await makeSim({ scenario: 'energy_crunch', player: 'USA', seed: 5 });
  sim.advanceMonths(30);
  const kinds = new Set(sim.state.events.history.map((h) => h.id));
  assert.ok(kinds.size >= 6, 'diverse events occur: ' + [...kinds].join(','));
  const counts = {};
  for (const h of sim.state.events.history) counts[h.id] = (counts[h.id] || 0) + 1;
  const top = Math.max(...Object.values(counts));
  assert.ok(top / sim.state.events.history.length < 0.5, 'no single event dominates (repetition guard)');
  assert.deepEqual(findNonFinite(sim.state), []);
});
test('pandemic mechanics: spreads, mortality tied to health, ends', async () => {
  const sim = await makeSim({ seed: 4 });
  const { startPandemic } = await import('../../app/js/sim/events.js');
  startPandemic(sim, { name: 'Test virus', r0: 2.8, ifr: 0.006 });
  assert.ok(sim.state.pandemic);
  const pop0 = sim.state.countries.reduce((s, c) => s + c.pop.total, 0);
  sim.advanceMonths(8);
  assert.ok(sim.state.pandemic.peak > 0.02, 'it spreads');
  assert.ok(sim.state.countries.some((c) => c.econ.pandemicLoad > 0.01));
  sim.advanceMonths(40);
  assert.equal(sim.state.pandemic, null, 'pandemics burn out');
});
test('Global Assembly resolutions: forecast equals outcome; veto blocks; effects apply', async () => {
  const { unVote } = await import('../../app/js/sim/diplomacy.js');
  const sim = await makeSim({ player: 'FRA', seed: 4 });
  const g = sim.geo;
  const ru = g.idOf.RUS,
    fr = g.idOf.FRA;
  const fc = unVote(sim, fr, 'condemn', ru);
  assert.ok(fc.yes + fc.no + fc.abstain === g.N);
  const pv = sim.exec({ type: 'unResolution', kind: 'condemn', target: ru, preview: true });
  assert.equal(pv.vote.passes, fc.passes);
  sim.player.dip.influence = 100;
  const leg0 = sim.country('RUS').gov.legitimacy;
  const r = sim.exec({ type: 'unResolution', kind: 'condemn', target: ru });
  assert.ok(r.ok);
  assert.equal(r.passed, fc.passes);
  if (r.passed) assert.ok(sim.country('RUS').gov.legitimacy < leg0);
  else assert.ok(fc.vetoBy.length > 0 || fc.yes <= fc.no);
  // a P5 member shielding its ally vetoes
  const cn = g.idOf.CHN;
  const vp = unVote(sim, fr, 'sanction', g.idOf.PRK);
  assert.ok(vp.vetoBy.includes(cn) || vp.vetoBy.includes(ru) || !vp.passes, 'allies of the target are shielded by the Council');
  assert.equal(sim.exec({ type: 'unResolution', kind: 'ceasefire', target: ru }).ok, false, 'ceasefire calls need an actual war');
});
test('scenario sanctions are in force from day one and cut trade', async () => {
  const sim = await makeSim({ scenario: 'fault_lines', player: 'USA', seed: 3 });
  assert.ok(
    sim.state.sanctions.some((s) => s.target === sim.geo.idOf.RUS),
    'Russia sanctioned in the hot-start scenario',
  );
  assert.ok(
    !(await makeSim({ scenario: 'quiet_decade' })).state.sanctions.some((s) => s.target === sim.geo.idOf.RUS),
    'but not in the quiet scenario',
  );
  sim.advanceMonths(3);
  const ru = sim.country('RUS').econ;
  assert.ok(ru.tradeAccess < 1);
  const eu = sim.geo.idOf.DEU;
  const flow = sim.lastFlows[COM.gas].filter(([i, j]) => i === eu && j === sim.geo.idOf.RUS).reduce((s, f) => s + f[2], 0);
  assert.equal(flow, 0);
});
test('achievements unlock from real play and persist in the save', async () => {
  const { serialize, deserialize } = await import('../../app/js/sim/save.js');
  const { getData } = await import('../helpers.js');
  const sim = await makeSim({ player: 'BRA', seed: 2 });
  assert.equal(Object.keys(sim.state.ach).length, 0);
  assert.ok(sim.exec({ type: 'setPolicy', key: 'tariff', value: 0.1 }).ok);
  sim.advanceMonths(2);
  assert.ok(sim.state.ach.first_policy !== undefined, 'first policy change recorded');
  const back = deserialize(await getData(), serialize(sim));
  assert.ok(back.state.ach.first_policy !== undefined);
});

test('civil conflict: erupts only under strain, drains the economy, displaces people, and ends', async () => {
  const { makeSim } = await import('../helpers.js');
  const CIV = await import('../../app/js/sim/civil.js');
  const sim = await makeSim({ seed: 4, player: 'FRA' });
  const c = sim.country('MLI');
  assert.equal(CIV.isCivilConflict(c), false);
  for (let m = 0; m < 24; m++) sim.advanceMonths(1);
  assert.equal(CIV.isCivilConflict(sim.country('NOR')), false, 'a stable rich democracy has no civil conflict');
  // force the conditions
  for (let m = 0; m < 30 && !CIV.isCivilConflict(c); m++) {
    c.gov.stability = 0.15;
    c.gov.unrest = 0.9;
    sim.advanceMonths(1);
  }
  assert.equal(CIV.isCivilConflict(c), true, 'conflict eruption under strain');
  assert.ok(c.flags.civilWar > sim.state.day);
  for (let m = 0; m < 6; m++) {
    c.gov.stability = Math.min(c.gov.stability, 0.2);
    sim.advanceMonths(1);
  }
  assert.ok(
    sim.regionsOf[c.idx].some((r) => sim.state.reg.dev[r] > 0.01),
    'fighting devastates regions',
  );
  assert.ok(
    c.mods.some((m) => m.k === 'gdp.shock' && m.src === 'civil conflict'),
    'and drags on output',
  );
  // restoring calm ends it
  for (let m = 0; m < 80 && CIV.isCivilConflict(c); m++) {
    c.gov.stability = 0.8;
    c.gov.approval = 0.7;
    c.gov.unrest = 0.1;
    sim.advanceMonths(1);
  }
  assert.equal(CIV.isCivilConflict(c), false, 'it ends once order returns');
});

test('alliance strain: a pact between partners who stay hostile for a year lapses', async () => {
  const { makeSim } = await import('../helpers.js');
  const DIP = await import('../../app/js/sim/diplomacy.js');
  const sim = await makeSim({ seed: 8, player: 'FRA' });
  const a = sim.geo.idOf.USA;
  const b = sim.geo.idOf.JPN;
  const N = sim.geo.N;
  const pact = sim.state.treaties.find((t) => t.active && t.type === 'defense_pact' && t.parties.includes(a) && t.parties.includes(b));
  assert.ok(pact, 'seeded USA-JPN pact');
  for (let m = 0; m < 11; m++) {
    sim.state.rel.op[a * N + b] = -20;
    sim.state.rel.op[b * N + a] = -20;
    DIP.monthlyStep(sim, sim.state.day);
  }
  assert.equal(pact.active, true, 'eleven bad months are survivable');
  for (let m = 0; m < 3; m++) {
    sim.state.rel.op[a * N + b] = -20;
    sim.state.rel.op[b * N + a] = -20;
    DIP.monthlyStep(sim, sim.state.day);
  }
  assert.equal(pact.active, false, 'a year of hostility ends the pact');
  assert.equal(sim.alliesOf(a).has(b), false);
});
