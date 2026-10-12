import test from 'node:test';
import assert from 'node:assert/strict';
import { getData } from '../helpers.js';
import { MODIFIER_KEYS } from '../../app/js/sim/mods.js';
import { STAT_PATHS, WRITABLE_STATS } from '../../app/js/sim/events.js';
import { buildGeography } from '../../app/js/sim/geography.js';

test('country table joins the map one-to-one', async () => {
  const d = await getData();
  const nums = new Set(d.countries.filter((r) => r.num).map((r) => r.num));
  const specials = new Set(d.countries.filter((r) => !r.num).map((r) => r.iso3));
  for (const mc of d.map.countries)
    assert.ok(mc.num ? nums.has(mc.num) : specials.has(mc.special), `map entity ${mc.name} has no roster row`);
  const sovereign = d.countries.filter((r) => !r.parent);
  assert.ok(sovereign.length >= 160, 'at least 160 sovereign entities');
  for (const r of sovereign) {
    assert.ok(r.pop_m > 0 && r.gdp_bn > 0, r.iso3 + ' population/gdp');
    assert.ok(r.dem >= 0 && r.dem <= 100);
    assert.ok(r.lat >= -60 && r.lat <= 85, r.iso3 + ' lat');
  }
  for (const r of d.countries.filter((x) => x.parent))
    assert.ok(
      d.countries.some((p) => p.iso3 === r.parent && !p.parent),
      'parent exists for ' + r.iso3,
    );
});
test('ISO codes unique, regions known', async () => {
  const d = await getData();
  const seen = new Set();
  for (const r of d.countries) {
    assert.ok(!seen.has(r.iso3), 'duplicate ' + r.iso3);
    seen.add(r.iso3);
  }
  const regions = new Set(d.countries.filter((r) => !r.parent).map((r) => r.region));
  assert.ok(regions.size >= 15);
});
test('geography: every sovereign has regions, a capital region, symmetric adjacency', async () => {
  const d = await getData();
  const g = buildGeography(d);
  for (let i = 0; i < g.N; i++) {
    assert.ok(g.cRegions[i].length >= 1, g.rows[i].iso3 + ' has regions');
    assert.ok(g.cRegions[i].includes(g.capitalRegion[i]), g.rows[i].iso3 + ' capital region owned');
  }
  for (const r of g.regions)
    for (const a of r.adj)
      assert.ok(
        g.regions[a.to].adj.some((b) => b.to === r.idx),
        'asymmetric adjacency',
      );
  assert.ok(g.regions.length >= 400);
  const connected = g.regions.filter((r) => r.adj.length === 0).length;
  assert.ok(connected < 60, 'few isolated regions, got ' + connected);
});
test('technologies: prerequisites exist, acyclic, effects use known modifier keys', async () => {
  const d = await getData();
  const ids = new Set(d.techs.map((t) => t.id));
  assert.ok(d.techs.length >= 60);
  for (const t of d.techs) {
    for (const r of t.req) assert.ok(ids.has(r), `${t.id} requires unknown ${r}`);
    for (const e of t.effects) assert.ok(MODIFIER_KEYS.includes(e.k), `${t.id} effect ${e.k} not a modifier key`);
    assert.ok(t.cost > 0 && t.tier >= 1);
  }
  const state = new Map();
  const visit = (id, stack) => {
    if (state.get(id) === 2) return;
    assert.ok(state.get(id) !== 1, 'cycle at ' + id);
    state.set(id, 1);
    for (const r of d.techById[id].req) visit(r, stack);
    state.set(id, 2);
  };
  for (const t of d.techs) visit(t.id, []);
  for (const t of d.techs) for (const r of t.req) assert.ok(d.techById[r].tier <= t.tier + 1, 'tier ordering ' + t.id);
});
test('every technology modifier key is consumed by simulation code', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const dir = path.resolve('app/js');
  let src = '';
  const walk = (p) => {
    for (const f of fs.readdirSync(p, { withFileTypes: true })) {
      const q = path.join(p, f.name);
      if (f.isDirectory()) walk(q);
      else if (q.endsWith('.js') && !q.endsWith('mods.js')) src += fs.readFileSync(q, 'utf8');
    }
  };
  walk(dir);
  const d = await getData();
  const keys = new Set(d.techs.flatMap((t) => t.effects.map((e) => e.k)));
  for (const k of keys) {
    const direct = src.includes(`'${k}'`) || src.includes(`"${k}"`);
    const dyn = (k.startsWith('tfp.') && src.includes("'tfp.' + SECTORS[k]")) || (k.startsWith('mil.') && src.includes("'mil.' + b"));
    assert.ok(direct || dyn, `modifier ${k} is never read by the simulation`);
  }
});
test('events: valid structure, conditions and effects', async () => {
  const d = await getData();
  const ids = new Set(d.events.map((e) => e.id));
  assert.ok(d.events.length >= 40);
  const ok = (p) =>
    STAT_PATHS.includes(p) ||
    p === 'gov.type' ||
    p === 'region' ||
    p === 'id' ||
    p === 'isPlayer' ||
    p.startsWith('flag.') ||
    p.startsWith('world.') ||
    p.startsWith('price.');
  const effKinds = [
    'stat',
    'mod',
    'price',
    'rel',
    'relAll',
    'event',
    'treasury',
    'policy',
    'flag',
    'infra',
    'devastate',
    'treaty',
    'cb',
    'log',
    'pandemic',
    'newLeader',
    'refugees',
    'research',
    'mil',
    'chokepoint',
    'cartelQuota',
    'allMod',
    'climate',
  ];
  for (const e of d.events) {
    assert.ok(e.title && (e.scope === 'world' || e.text || e.auto), e.id + ' text');
    assert.ok(e.mtth > 0, e.id + ' mtth');
    for (const c of e.when || []) assert.ok(ok(c[0]), `${e.id} unknown stat ${c[0]}`);
    for (const c of e.whenTarget || []) assert.ok(c[0].startsWith('target.'), `${e.id} whenTarget`);
    const all = [...(e.effects || []), ...(e.options || []).flatMap((o) => o.effects || [])];
    for (const fx of all) {
      const k = Object.keys(fx).find((x) => effKinds.includes(x));
      assert.ok(k, `${e.id}: unknown effect ${JSON.stringify(fx)}`);
      if (fx.mod) assert.ok(MODIFIER_KEYS.includes(fx.mod), `${e.id} mod ${fx.mod}`);
      if (fx.stat) assert.ok(WRITABLE_STATS.includes(fx.stat), `${e.id} stat ${fx.stat}`);
      if (fx.event) assert.ok(ids.has(fx.event), `${e.id} follow-up ${fx.event}`);
    }
    for (const o of e.options || []) for (const c of o.if || []) assert.ok(ok(c[0]), `${e.id} option cond ${c[0]}`);
  }
});
test('scenarios reference real countries and coordinates', async () => {
  const d = await getData();
  const g = buildGeography(d);
  for (const s of d.scenarios) {
    assert.ok(s.years >= 5);
    for (const id of s.recommended || []) assert.ok(g.idOf[id] !== undefined, s.id + ' recommends ' + id);
    for (const w of s.wars || []) for (const x of [...w.attackers, ...w.defenders]) assert.ok(g.idOf[x] !== undefined, x);
  }
  for (const o of d.orgs)
    for (const m of o.members) assert.ok(m === '*' || m.startsWith('@') || g.idOf[m] !== undefined, `org ${o.id} member ${m}`);
  for (const [a, b] of d.rivalries.map((r) => [r[0], r[1]]))
    assert.ok(g.idOf[a] !== undefined && g.idOf[b] !== undefined, `rivalry ${a}-${b}`);
});
