// The wrestling universe: roster, brands, championships and their lineages.
// Mutable world state that is NOT the player's ledger. Anything that matters to the player is
// also written to the ledger (scope 'world' / 'player') by sim.js and the Game layer.
// HISTORICAL NOTE: only the starting snapshot draws on real names (approximate, unverified);
// everything that happens after the start date is simulated alternate history (canon:false).
import { Rng } from '../core/rng.js';
import { generateWrestler, TIERS } from '../data/generator.js';
import { REAL_ROSTER, activeIn } from '../data/roster_real.js';
import { brandsInYear } from './calendar.js';

// [id, class, gender, brandScope, fromYear, [[from,to,name],...], minPopularityForShot]
export const TITLE_SLOTS = [
  { id: 'world_a', cls: 'world', gender: 'M', scope: 'main', from: 1985, names: [[1985, 2001, 'WWF Championship'], [2002, 2100, 'WWE Championship']], minPop: 55 },
  { id: 'world_b', cls: 'world', gender: 'M', scope: 'second', from: 2002, names: [[2002, 2013, 'World Heavyweight Championship'], [2014, 2015, 'World Heavyweight Championship'], [2016, 2022, 'Universal Championship'], [2023, 2100, 'World Heavyweight Championship']], minPop: 55 },
  { id: 'secondary_a', cls: 'secondary', gender: 'M', scope: 'main', from: 1985, names: [[1985, 2100, 'Intercontinental Championship']], minPop: 35 },
  { id: 'secondary_b', cls: 'secondary', gender: 'M', scope: 'second', from: 2003, names: [[2003, 2100, 'United States Championship']], minPop: 35 },
  { id: 'womens_a', cls: 'womens', gender: 'F', scope: 'main', from: 1998, names: [[1998, 2009, "Women's Championship"], [2010, 2015, 'Divas Championship'], [2016, 2100, "Women's Championship"]], minPop: 40 },
  { id: 'womens_b', cls: 'womens', gender: 'F', scope: 'second', from: 2016, names: [[2016, 2100, "Women's Championship"]], minPop: 40 },
  { id: 'tag_a', cls: 'tag', gender: 'M', scope: 'main', from: 1985, names: [[1985, 2001, 'WWF Tag Team Championship'], [2002, 2100, 'World Tag Team Championship']], minPop: 25 },
  { id: 'tag_b', cls: 'tag', gender: 'M', scope: 'second', from: 2002, names: [[2002, 2100, 'WWE Tag Team Championship']], minPop: 25 },
  { id: 'tag_w', cls: 'tag', gender: 'F', scope: 'main', from: 2019, names: [[2019, 2100, "Women's Tag Team Championship"]], minPop: 25 },
  { id: 'dev_a', cls: 'developmental', gender: 'M', scope: 'dev', from: 2012, names: [[2012, 2100, 'NXT Championship']], minPop: 15 },
  { id: 'dev_b', cls: 'developmental', gender: 'M', scope: 'dev', from: 2018, names: [[2018, 2100, 'NXT North American Championship']], minPop: 10 },
  { id: 'dev_w', cls: 'developmental', gender: 'F', scope: 'dev', from: 2013, names: [[2013, 2100, "NXT Women's Championship"]], minPop: 12 },
];

export const CLASS_LABEL = { world: 'World', secondary: 'Midcard', womens: "Women's", developmental: 'Developmental', tag: 'Tag Team' };

export function tierAt(w, year) {
  // a career has an ascent and a decline; real wrestlers are strongest in the middle of their window
  const win = w.windows.find(([a, b]) => year >= a && year <= b) || w.windows[0];
  const span = Math.max(1, win[1] - win[0] + 1);
  const p = (year - win[0]) / span;
  const t = w.peakTier;
  if (span <= 3) return t;
  return p < 0.15 ? Math.max(0, t - 1) : p > 0.85 ? Math.max(0, t - 1) : t;
}

export class Universe {
  constructor({ seed = 1, mode = 'custom', year = 2024 } = {}) {
    this.seed = seed;
    this.mode = mode;
    this.startYear = year;
    this.rng = new Rng(`uni:${seed}`);
    this.roster = {};
    this.titles = {};
    this.feuds = {};          // id -> { a, b, heat, matches, status, startDay }
    this.alliances = {};      // id -> { a, b, since, strength }
    this.factions = {};
    this.log = [];            // compact notable events: { day, type, text, ids }
    this.records = {};        // all-time records: { key: { value, holder, day, label } }
    this.yearBest = {};       // year -> best match rated in the universe
    this.split = false;       // brand extension happened
    this.lastSimDay = 0;
    this.counters = { wrestlers: 0 };
  }

  // ---------------------------------------------------------------- construction
  static create({ seed = 1, mode = 'modern', year = 2024, startDay = 0 } = {}) {
    const u = new Universe({ seed, mode, year });
    u.lastSimDay = startDay;
    const rng = new Rng(`init:${seed}:${year}`);
    const real = mode !== 'custom';
    u.split = year >= 2002;
    const women = year >= 2016 ? 0.34 : year >= 2008 ? 0.22 : year >= 1998 ? 0.14 : 0.06;
    let n = 0;
    if (real) {
      for (const r of REAL_ROSTER) if (activeIn(r, year)) u._addReal(r, year, rng);
    }
    // fictional supplement fills brand rosters; development brand from 2010
    const target = { main: year >= 2002 ? 18 : 30, second: year >= 2002 ? 18 : 0, dev: year >= 2010 ? 16 : 0 };
    const have = (brandKey) => Object.values(u.roster).filter((w) => w.brandKey === brandKey).length;
    const addFict = (brandKey, tier, gender) => {
      const w = generateWrestler(rng, { id: `f${++u.counters.wrestlers}`, tier, gender });
      w.brandKey = brandKey; u._finalize(w, year, rng);
      u.roster[w.id] = w;
    };
    for (const bk of ['main', 'second', 'dev']) {
      while (have(bk) < target[bk]) {
        const tier = bk === 'dev' ? (rng.chance(0.75) ? 0 : 1) : rng.pick([0, 1, 1, 1, 2, 2, 3]);
        addFict(bk, tier, rng.chance(women) ? 'F' : 'M');
      }
    }
    // distribute real wrestlers over brands (by tier then alternating)
    let alt = 0;
    for (const w of Object.values(u.roster).filter((x) => x.real).sort((a, b) => b.tier - a.tier)) {
      if (w.brandKey) continue;
      if (year >= 2010 && w.tier <= 1 && rng.chance(0.55)) w.brandKey = 'dev';
      else w.brandKey = u.split ? (alt++ % 2 ? 'second' : 'main') : 'main';
    }
    u._syncBrandNames();
    u.ensureTitles(year, 0);
    return u;
  }

  _addReal(r, year, rng) {
    const tier = tierAt(r, year);
    const base = generateWrestler(new Rng(`real:${r.id}`), { id: r.id, tier, style: r.style, gender: r.gender, alignment: r.alignment, name: r.name });
    base.finisher = { id: `${r.id}_fin`, name: r.finisherName, tpl: r.finisherTpl };
    base.signatures = base.signatures.map((s, i) => ({ ...s, id: `${r.id}_sig${i + 1}` }));
    base.real = true; base.approx = true; base.windows = r.windows; base.peakTier = r.peakTier; base.nickname = '';
    this._finalize(base, year, rng);
    this.roster[base.id] = base;
  }

  _finalize(w, year, rng) {
    w.status = 'active'; w.injuredUntil = 0; w.record = { w: 0, l: 0 }; w.momentum = 20 + rng.int(0, 30); w.streak = 0;
    w.debutYear = w.debutYear || year - rng.int(0, Math.max(1, (w.tier || 0) * 4)); w.faction = null; w.reigns = 0; w.titleDays = 0;
    w.personality = w.personality || { aggression: rng.int(20, 90), ego: rng.int(20, 90), loyalty: rng.int(20, 90), ambition: rng.int(30, 95) };
    w.lastMatchDay = -999;
  }

  _syncBrandNames() {
    for (const w of Object.values(this.roster)) w.brand = this.brandName(w.brandKey);
  }
  /** show brand name for a roster brand key */
  brandName(key) {
    if (key === 'dev') return 'NXT';
    if (!this.split) return this._mainBrand || 'WWF';
    return key === 'second' ? 'SmackDown' : 'Raw';
  }
  /** roster brand key a show brand maps to (pre-split: every show shares one roster) */
  keyOfShow(show) {
    if (show === 'NXT') return 'dev';
    if (!this.split) return 'main';
    return show === 'SmackDown' ? 'second' : 'main';
  }
  sameBrand(w, show) { return w.brandKey === this.keyOfShow(show); }

  // ---------------------------------------------------------------- roster access
  get(id) { return this.roster[id]; }
  list(filter = () => true) { return Object.values(this.roster).filter((w) => w.status === 'active' && filter(w)); }
  available(day, filter = () => true) { return this.list((w) => w.injuredUntil <= day && filter(w)); }

  // ---------------------------------------------------------------- titles
  titleName(slot, year) {
    const n = slot.names.find(([a, b]) => year >= a && year <= b);
    return n ? n[2] : slot.names[slot.names.length - 1][2];
  }
  /** create titles whose start year has arrived; assign an initial champion */
  ensureTitles(year, day) {
    for (const slot of TITLE_SLOTS) {
      if (year < slot.from) continue;
      if (slot.scope === 'dev' && year < 2010) continue;
      if (slot.scope === 'second' && !this.split) continue;
      let t = this.titles[slot.id];
      if (!t) {
        t = this.titles[slot.id] = { id: slot.id, slot: slot.id, cls: slot.cls, gender: slot.gender, scope: slot.scope, name: this.titleName(slot, year), minPop: slot.minPop, holder: null, since: day, defenses: 0, lastDefenseDay: day, reigns: [] };
        const key = slot.scope === 'dev' ? 'dev' : slot.scope;
        if (slot.cls === 'tag') {
          const team = this.pickTagTeam(key, slot.gender);
          if (team) this.setChampion(slot.id, team[0].id, day, { initial: true, partner: team[1].id });
          continue;
        }
        const pool = this.list((w) => w.gender === slot.gender && w.brandKey === key && !this._holdsTitle(w.id)).sort((a, b) => this._classRank(slot.cls, b) - this._classRank(slot.cls, a));
        if (pool.length) this.setChampion(slot.id, pool[0].id, day, { initial: true });
      } else t.name = this.titleName(slot, year);
    }
  }
  _classRank(cls, w) {
    const want = { world: 4, secondary: 2, womens: 3, developmental: 0, tag: 2 }[cls] ?? 2;
    return -Math.abs(w.tier - want) * 20 + w.popularity / 10 + w.momentum / 25;
  }
  _holdsTitle(id) { return Object.values(this.titles).some((t) => t.holder === id || t.holder2 === id); }
  /** a tag team for a brand: a standing alliance if one fits, otherwise the two best-matched free wrestlers */
  pickTagTeam(brandKey, gender, exclude = []) {
    const free = (w) => w.gender === gender && w.brandKey === brandKey && !this._holdsTitle(w.id) && !exclude.includes(w.id);
    const pool = this.list(free);
    for (const f of Object.values(this.factions)) {
      if (f.status !== 'active') continue;
      const mates = f.members.map((id) => this.roster[id]).filter((w) => w && w.status === 'active' && free(w));
      if (mates.length >= 2) return [mates[0], mates[1]];
    }
    for (const al of Object.values(this.alliances)) {
      const a = this.roster[al.a], b = this.roster[al.b];
      if (a && b && a.status === 'active' && b.status === 'active' && free(a) && free(b)) return [a, b];
    }
    const ranked = pool.filter((w) => w.tier >= 1 || pool.length < 6).sort((x, y) => (y.popularity + y.momentum / 2) - (x.popularity + x.momentum / 2));
    return ranked.length >= 2 ? [ranked[0], ranked[1]] : null;
  }
  titlesList(cls) { return Object.values(this.titles).filter((t) => !cls || t.cls === cls); }
  titlesOf(id) { return Object.values(this.titles).filter((t) => t.holder === id || t.holder2 === id); }
  teamOf(titleId) { const t = this.titles[titleId]; return t && t.holder ? [t.holder, t.holder2].filter(Boolean) : []; }

  setChampion(titleId, holderId, day, meta = {}) {
    const t = this.titles[titleId];
    const prev = t.holder, prev2 = t.holder2 || null;
    if (prev && t.reigns.length) {
      const r = t.reigns[t.reigns.length - 1];
      r.to = day; r.days = day - r.from;
      for (const id of [prev, prev2]) { const w = id && this.roster[id]; if (w) w.titleDays += r.days; }
    }
    t.holder = holderId; t.holder2 = holderId && t.cls === 'tag' ? (meta.partner || null) : null;
    t.since = day; t.defenses = 0; t.lastDefenseDay = day;
    if (holderId) {
      t.reigns.push({ holder: holderId, partner: t.holder2, from: day, to: null, defenses: 0, initial: !!meta.initial, by: meta.by || null });
      for (const id of [holderId, t.holder2]) { const w = id && this.roster[id]; if (w) w.reigns += 1; }
    }
    return { title: t, from: prev, to: holderId };
  }
  recordDefense(titleId, day) {
    const t = this.titles[titleId];
    t.defenses += 1; t.lastDefenseDay = day;
    const r = t.reigns[t.reigns.length - 1]; if (r) r.defenses += 1;
  }
  currentReignDays(titleId, day) { const t = this.titles[titleId]; return t.holder ? day - t.since : 0; }

  /** lineage sanity: contiguous, non-overlapping reigns */
  lineageProblems() {
    const out = [];
    for (const t of Object.values(this.titles)) {
      for (let i = 0; i < t.reigns.length; i++) {
        const r = t.reigns[i];
        if (r.to != null && r.to < r.from) out.push(`${t.id}: reign ${i} ends before it starts`);
        if (i > 0 && t.reigns[i - 1].to !== r.from && t.reigns[i - 1].to != null && t.reigns[i - 1].to > r.from) out.push(`${t.id}: reigns ${i - 1}/${i} overlap`);
        if (i < t.reigns.length - 1 && r.to == null) out.push(`${t.id}: open reign ${i} is not the last`);
      }
      const last = t.reigns[t.reigns.length - 1];
      if (t.holder && (!last || last.holder !== t.holder || last.to != null)) out.push(`${t.id}: holder does not match last reign`);
      if (t.cls === 'tag' && t.holder && (!t.holder2 || t.holder2 === t.holder)) out.push(`${t.id}: tag title needs two different holders`);
      if (t.cls !== 'tag' && t.holder2) out.push(`${t.id}: non-tag title has a second holder`);
      if (!t.holder && last && last.to == null) out.push(`${t.id}: vacant but last reign is open`);
    }
    return out;
  }

  note(day, type, text, ids = []) { this.log.push({ day, type, text, ids }); if (this.log.length > 600) this.log.splice(0, 100); }

  toJSON() {
    return { v: 2, seed: this.seed, mode: this.mode, startYear: this.startYear, rng: this.rng.state, roster: this.roster, titles: this.titles, feuds: this.feuds, alliances: this.alliances, factions: this.factions, log: this.log, records: this.records, yearBest: this.yearBest, split: this.split, lastSimDay: this.lastSimDay, counters: this.counters, mainBrand: this._mainBrand, hof: this.hof || [] };
  }
  static fromJSON(j) {
    const u = new Universe({ seed: j.seed, mode: j.mode, year: j.startYear });
    Object.assign(u, { roster: j.roster, titles: j.titles || {}, feuds: j.feuds || {}, alliances: j.alliances || {}, factions: j.factions || {}, log: j.log || [], records: j.records || {}, yearBest: j.yearBest || {}, split: !!j.split, lastSimDay: j.lastSimDay || 0, counters: j.counters || { wrestlers: 0 }, _mainBrand: j.mainBrand, hof: j.hof || [] });
    u.rng.state = j.rng;
    return u;
  }
}

export { TIERS };
