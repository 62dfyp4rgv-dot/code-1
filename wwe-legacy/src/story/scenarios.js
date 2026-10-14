// Scenario engine: data-driven storylines. A scenario TEMPLATE declares triggers, cast roles,
// text slots, choices, outcomes and effects. The engine binds the cast from the live world,
// renders text, applies effects through the ledger (so every consequence is remembered and
// replayable) and enforces repetition prevention. Templates are pure data; see
// docs/SCENARIO_FORMAT.md for the authoring contract.
import { hash53, clamp } from '../core/util.js';
import { Rng } from '../core/rng.js';
import { gainPop } from '../career/pace.js';
import { getRel, getRivalry, openPromises, brokenPromises, dueObligations, hasOpenPromise } from '../memory/world.js';
import { memoryLines } from './dialogue.js';
import { eventsOn } from '../universe/calendar.js';

export const CATEGORIES = ['debut', 'breakout', 'rivalry', 'betrayal', 'alliance', 'faction', 'championship', 'injury', 'recovery', 'media', 'podcast', 'press', 'contract',
  'rumble', 'wrestlemania', 'comeback', 'retirement', 'legacy', 'personal', 'opportunity', 'creative', 'backstage', 'mentor', 'finance', 'fans', 'training', 'travel', 'social'];

export const STAFF_ROLES = ['agent', 'creative', 'gm', 'trainer', 'doctor', 'executive', 'owner', 'coach', 'agent2', 'producer'];
export const MEDIA_KINDS = ['reporter', 'host', 'fan', 'journalist', 'commentator', 'interviewer'];
export const REL_TAGS = ['ally', 'mentor', 'respected_by', 'insulted_by', 'humiliated_by', 'betrayal', 'studying_you', 'alliance_possible', 'reconciled', 'reluctant'];
export const EVENT_TYPES_ALLOWED = ['betrayal', 'alliance_formed', 'faction_formed', 'faction_joined', 'faction_left', 'mentorship', 'reconciliation', 'brand_transfer',
  'podcast', 'press_conference', 'interview', 'social_post', 'confrontation', 'refusal_to_help', 'promo_delivered', 'retirement', 'goal_set', 'decision'];

const STAFF_NAMES = ['Marguerite Hale', 'Derek Voss', 'Ines Calloway', 'Tobias Reed', 'Samira Okoye', 'Walter Grimes', 'Priya Nandakumar', 'Lucas Ferreira', 'Hannah Brandt', 'Gordon Pike', 'Mei Tanaka', 'Raymond Cole', 'Dolores Marsh', 'Victor Salazar', 'Nadia Petrova', 'Elliot Banks'];
const MEDIA_NAMES = ['Jordan Pruitt (Ringside Report)', 'Alexis Moreau (The Turnbuckle)', 'Sam Okonkwo (Mat Talk Daily)', 'Casey Lindqvist (Backstage Wire)', 'Riley Duarte (The Squared Circle)', 'Morgan Ashby (Cageside Live)', 'Taylor Brennan (Pinfall Podcast)', 'Devon Kapoor (Heel Turn Radio)'];

// ------------------------------------------------------------------------------------------ context
export function buildContext(career) {
  const c = career, s = c.stats.s, p = c.player;
  const ledger = c.memory.ledger;
  const recent = ledger.query({ types: ['match_result'], scope: 'player', newestFirst: true, limit: 5 });
  const lastMatch = recent[0];
  const lastPromo = ledger.query({ types: ['promo_delivered'], scope: 'player', newestFirst: true, limit: 1 })[0];
  const lastScn = c.flags.scn?.lastDay ?? -999;
  const rivals = Object.values(c.memory.world.rivalries).filter((r) => r.a === p.id || r.b === p.id);
  const ev = eventsOn(c.day, c.startYear, p.brand).sort((a, b) => (b.tier || 0) - (a.tier || 0))[0] || null;
  const month = new Date(Date.UTC(c.startYear, 0, 1) + c.day * 86400000).getUTCMonth() + 1;
  const injured = p.injuries.some((i) => i.daysLeft > 0), serious = p.injuries.some((i) => i.daysLeft > 0 && i.severity > 1);
  const ratingAvg = s.matchesRated ? s.ratingSum / s.matchesRated : 0;
  return {
    c, u: c.universe, mem: c.memory, me: p, day: c.day, year: c.year, month, era: c.era, brand: p.brand,
    stat: {
      popularity: p.popularity, confidence: p.confidence, fatigue: p.fatigue, money: p.money, overall: c.overall(), matches: s.matches, wins: s.wins, losses: s.losses,
      winStreak: Math.max(0, s.streak.current), loseStreak: Math.max(0, -s.streak.current), titleWins: s.titles.won, titlesHeld: Object.keys(s.titles.current).length, defenses: s.titles.defenses,
      rating: ratingAvg, careerYears: c.day / 365.25, mic: p.mic, charisma: p.charisma, promos: s.promos, injuries: s.injuries, daysChampion: c.stats.totalDaysChampion(c.day),
      mainEvents: s.mainEvents, pleMatches: s.pleMatches, rumbleEntries: s.rumble.entries, popularityRank: 0, wellbeing: (p.life || {}).wellbeing ?? 60, family: (p.life || {}).family ?? 50, socialLife: (p.life || {}).social ?? 40,
    },
    recentLosses: recent.filter((e) => e.data.result === 'loss').length, recentWins: recent.filter((e) => e.data.result === 'win').length,
    injured, serious, holdsTitle: Object.keys(s.titles.current).length > 0, rivals, ev,
    daysSince: { match: lastMatch ? c.day - lastMatch.day : 9999, promo: lastPromo ? c.day - lastPromo.day : 9999, scenario: c.day - lastScn },
    promiseOpen: openPromises(c.memory.world, p.id).length > 0, promiseBroken: brokenPromises(c.memory.world, p.id).length > 0,
    contractDaysLeft: p.contract ? p.contract.endDay - c.day : null,
  };
}

const inRange = (v, r) => (typeof r === 'number' ? v === r : (r.gte == null || v >= r.gte) && (r.lte == null || v <= r.lte) && (r.gt == null || v > r.gt) && (r.lt == null || v < r.lt));

// ------------------------------------------------------------------------------------------ triggers
const TRIGGER_KEYS = new Set(['era', 'minYear', 'maxYear', 'month', 'alignment', 'style', 'gender', 'brand', 'background', 'stat', 'recent', 'injured', 'serious', 'holdsTitle', 'flag', 'noFlag',
  'daysSince', 'rivalry', 'promise', 'mem', 'event', 'eventWithin', 'contract', 'all', 'any', 'not', 'phase', 'tier']);

export function checkTrigger(t, ctx, bind) {
  if (!t) return true;
  for (const [k, v] of Object.entries(t)) {
    switch (k) {
      case 'all': if (!v.every((x) => checkTrigger(x, ctx, bind))) return false; break;
      case 'any': if (!v.some((x) => checkTrigger(x, ctx, bind))) return false; break;
      case 'not': if (checkTrigger(v, ctx, bind)) return false; break;
      case 'era': if (!v.includes(ctx.era)) return false; break;
      case 'minYear': if (ctx.year < v) return false; break;
      case 'maxYear': if (ctx.year > v) return false; break;
      case 'month': if (!v.includes(ctx.month)) return false; break;
      case 'alignment': if (!v.includes(ctx.me.alignment)) return false; break;
      case 'style': if (!v.includes(ctx.me.style)) return false; break;
      case 'gender': if (!v.includes(ctx.me.gender)) return false; break;
      case 'brand': if (!v.includes(ctx.brand)) return false; break;
      case 'background': if (!v.includes(ctx.me.background)) return false; break;
      case 'stat': for (const [name, r] of Object.entries(v)) { if (!(name in ctx.stat)) throw new Error(`unknown stat ${name}`); if (!inRange(ctx.stat[name], r)) return false; } break;
      case 'recent':
        if (v.lossesGte != null && ctx.recentLosses < v.lossesGte) return false;
        if (v.winsGte != null && ctx.recentWins < v.winsGte) return false;
        break;
      case 'injured': if (ctx.injured !== v) return false; break;
      case 'serious': if (ctx.serious !== v) return false; break;
      case 'holdsTitle': if (ctx.holdsTitle !== v) return false; break;
      case 'flag': for (const f of [].concat(v)) if (!ctx.c.flags.story?.[f]) return false; break;
      case 'noFlag': for (const f of [].concat(v)) if (ctx.c.flags.story?.[f]) return false; break;
      case 'daysSince': for (const [name, r] of Object.entries(v)) { if (!(name in ctx.daysSince)) throw new Error(`unknown daysSince ${name}`); if (!inRange(ctx.daysSince[name], r)) return false; } break;
      case 'rivalry': { const best = Math.max(0, ...ctx.rivals.map((r) => r.heat)); if (v.minHeat != null && best < v.minHeat) return false; if (v.none && ctx.rivals.some((r) => r.status === 'active' && r.heat >= 15)) return false; break; }
      case 'promise': if (v === 'open' && !ctx.promiseOpen) return false; if (v === 'broken' && !ctx.promiseBroken) return false; if (v === 'none' && (ctx.promiseOpen || ctx.promiseBroken)) return false; break;
      case 'event': if (!ctx.ev || !(v === 'ple' ? ctx.ev.kind === 'ple' : v === 'weekly' ? ctx.ev.kind === 'weekly' : ctx.ev.id === v)) return false; break;
      case 'eventWithin': {
        // an upcoming event of a given id/kind within N days (calendar lookahead)
        let hit = false;
        for (let i = 0; i <= v.days && !hit; i++) { const e = eventsOn(ctx.day + i, ctx.c.startYear, ctx.brand); hit = e.some((x) => (v.id ? x.id === v.id : v.kind ? x.kind === v.kind : true)); }
        if (!hit) return false; break;
      }
      case 'contract': if (ctx.contractDaysLeft == null || !inRange(ctx.contractDaysLeft, v)) return false; break;
      case 'tier': break; // evaluated by cast
      case 'phase': if (ctx.c.flags.phase !== v) return false; break;
      case 'mem': {
        if (!v) break;
        for (const m of v) {
          const b = bind && bind[m.role];
          if (!b || !b.isWrestler) return false;
          const rel = getRel(ctx.mem.world, ctx.me.id, b.id);
          const i = rel.a === b.id ? 0 : 1;
          if (m.betrayal && !rel.betrayals.length) return false;
          if (m.tag && !rel.tags.includes(m.tag)) return false;
          if (m.noTag && rel.tags.includes(m.noTag)) return false;
          if (m.respectGte != null && rel.respect[i] < m.respectGte) return false;
          if (m.trustLte != null && rel.trust[i] > m.trustLte) return false;
          if (m.trustGte != null && rel.trust[i] < m.trustGte) return false;
          if (m.heatGte != null && rel.heat < m.heatGte) return false;
          if (m.h2h) {
            const st = ctx.c.stats.s.opponents[b.id] || { wins: 0, losses: 0, matches: 0 };
            if (m.h2h.winsGte != null && st.wins < m.h2h.winsGte) return false;
            if (m.h2h.lossesGte != null && st.losses < m.h2h.lossesGte) return false;
            if (m.h2h.matchesGte != null && st.matches < m.h2h.matchesGte) return false;
          }
        }
        break;
      }
      default: throw new Error(`unknown trigger key "${k}"`);
    }
  }
  return true;
}

// ------------------------------------------------------------------------------------------ cast
function hashPick(arr, seed) { return arr[parseInt(hash53(seed), 36) % arr.length]; }

function staffFor(c, role) {
  c.flags.staff = c.flags.staff || {};
  if (!c.flags.staff[role]) {
    const used = new Set(Object.values(c.flags.staff));
    const pool = STAFF_NAMES.filter((n) => !used.has(n));
    c.flags.staff[role] = hashPick(pool.length ? pool : STAFF_NAMES, `${c.seed}:staff:${role}`);
  }
  return c.flags.staff[role];
}
function mediaFor(c, kind, seed) { return hashPick(MEDIA_NAMES, `${c.seed}:media:${kind}:${seed}`); }

const PRON = { M: { they: 'he', them: 'him', their: 'his', theirs: 'his' }, F: { they: 'she', them: 'her', their: 'her', theirs: 'hers' } };
export function wrestlerBinding(w) {
  const g = PRON[w.gender] || { they: 'they', them: 'them', their: 'their', theirs: 'theirs' };
  return { id: w.id, name: w.name, first: w.name.split(' ')[0], last: w.name.split(' ').slice(-1)[0], isWrestler: true, ...g, style: w.style, tier: w.tier ?? 1, alignment: w.alignment };
}
const playerBinding = (p) => {
  const g = PRON[p.gender] || { they: 'they', them: 'them', their: 'their', theirs: 'theirs' };
  return { id: p.id, name: p.name, first: p.name.split(' ')[0], last: p.name.split(' ').slice(-1)[0], isWrestler: true, ...g };
};

/** Prefer cast candidates who do not share a surname with the player or anyone already in the scene (keeps "Ellison vs Ellison" out of unrelated stories). */
function preferDistinct(cands, bind) {
  const last = (n) => String(n).split(' ').slice(-1)[0];
  const used = new Set(Object.values(bind).filter((b) => b && b.last).map((b) => b.last));
  const distinct = cands.filter((w) => !used.has(last(w.name)));
  return distinct.length ? distinct : cands;
}

/** Bind cast roles. Returns {binding} or null if any role cannot be filled. */
export function bindCast(t, ctx, seedKey) {
  const bind = { player: playerBinding(ctx.me) };
  const taken = new Set([ctx.me.id]);
  const roster = ctx.u ? ctx.u.list((w) => w.id !== ctx.me.id) : [];
  for (const [role, spec] of Object.entries(t.cast || {})) {
    let pick = null;
    switch (spec.pick) {
      case 'rivalry': {
        const rs = ctx.rivals.filter((r) => r.heat >= (spec.minHeat ?? 15) && (!spec.status || r.status === spec.status)).sort((a, b) => b.heat - a.heat);
        for (const r of rs) { const id = r.a === ctx.me.id ? r.b : r.a; const w = ctx.u.get(id); if (w && w.status === 'active' && !taken.has(id)) { pick = w; break; } }
        break;
      }
      case 'obligation': {
        const ob = dueObligations(ctx.mem.world, ctx.day).find((o) => o.kind === spec.kind && o.to === ctx.me.id && !taken.has(o.from));
        if (ob) { pick = ctx.u.get(ob.from); bind.__obligation = bind.__obligation || {}; bind.__obligation[role] = ob.id; }
        break;
      }
      case 'tag': {
        const cands = [];
        for (const rel of Object.values(ctx.mem.world.relationships)) {
          if (rel.a !== ctx.me.id && rel.b !== ctx.me.id) continue;
          const other = rel.a === ctx.me.id ? rel.b : rel.a;
          if (taken.has(other) || !rel.tags.includes(spec.tag)) continue;
          const w = ctx.u.get(other); if (w && w.status === 'active') cands.push(w);
        }
        if (cands.length) pick = hashPick(preferDistinct(cands, bind), `${seedKey}:${role}`);
        break;
      }
      case 'champion': {
        const ch = ctx.u.titlesList ? ctx.u.titlesList(spec.class || 'world') : [];
        const holder = ch.map((tt) => tt.holder).find((id) => id && id !== ctx.me.id && ctx.u.get(id));
        if (holder) pick = ctx.u.get(holder);
        else { const top = roster.filter((w) => !taken.has(w.id)).sort((a, b) => b.tier - a.tier || b.popularity - a.popularity)[0]; pick = top || null; }
        break;
      }
      case 'roster': {
        let c2 = roster.filter((w) => !taken.has(w.id));
        if (spec.tier) c2 = c2.filter((w) => inRange(w.tier ?? 1, spec.tier));
        if (spec.sameBrand) c2 = c2.filter((w) => w.brand === ctx.brand);
        if (spec.gender) c2 = c2.filter((w) => w.gender === spec.gender);
        if (spec.alignment) c2 = c2.filter((w) => [].concat(spec.alignment).includes(w.alignment));
        if (spec.style) c2 = c2.filter((w) => [].concat(spec.style).includes(w.style));
        if (c2.length) pick = hashPick(preferDistinct(c2, bind), `${seedKey}:${role}`);
        break;
      }
      case 'staff': bind[role] = { id: `staff:${spec.role}`, name: staffFor(ctx.c, spec.role), first: staffFor(ctx.c, spec.role).split(' ')[0], isWrestler: false, they: 'they', them: 'them', their: 'their', theirs: 'theirs' }; continue;
      case 'media': { const nm = spec.kind === 'fan' ? mediaFor(ctx.c, spec.kind, seedKey).replace(/\s*\([^)]*\)\s*$/, '') : mediaFor(ctx.c, spec.kind, seedKey); bind[role] = { id: `media:${spec.kind}`, name: nm, first: nm.split(' ')[0], isWrestler: false, they: 'they', them: 'them', their: 'their', theirs: 'theirs' }; continue; }
      default: throw new Error(`unknown cast pick "${spec.pick}" for role ${role}`);
    }
    if (!pick) return null;
    taken.add(pick.id);
    bind[role] = wrestlerBinding(pick);
  }
  return bind;
}

// ------------------------------------------------------------------------------------------ text
/** Capitalise the start of every sentence (slot values and pronoun tokens can land mid-sentence in lower case). */
const ABBREV = /(?:\ba\.m|\bp\.m|\bMr|\bMrs|\bMs|\bDr|\bSt|\bvs|\bno|\betc|\be\.g|\bi\.e)\.\s+$/i;
export function tidy(text) {
  return text.replace(/(^|[.!?]["')\]]?\s+)([a-z])/g, (m, pre, ch, off) => (ABBREV.test(text.slice(0, off) + pre) ? m : pre + ch.toUpperCase())).replace(/ {2,}/g, ' ').replace(/\s+([,.;!?])/g, '$1');
}
const SMALL = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'at', 'for', 'to', 'and', 'but', 'or', 'nor', 'with', 'by', 'from', 'as', 'vs']);
/** Headline-style capitalisation for rendered titles (slot values arrive in sentence case). */
export function titleCase(t) {
  return t.split(' ').map((w, i) => {
    if (!w) return w;
    const bare = w.replace(/[^A-Za-z'-]/g, '').toLowerCase();
    if (i > 0 && SMALL.has(bare)) return w.toLowerCase() === w ? w : w;
    return w.replace(/(^|-)([a-z])/g, (m, pre, ch) => pre + ch.toUpperCase());
  }).join(' ');
}
export function render(str, bind, slots = {}, extra = {}) {
  // slot values may themselves carry role tokens ({rival.their}); they are resolved one level deep
  const fill = (text, depth) => String(text).replace(/\{([a-zA-Z0-9_]+)(?:\.([a-zA-Z0-9_]+))?\}/g, (m, a, b) => {
    if (b) { const o = bind[a]; if (!o || o[b] === undefined) throw new Error(`unresolved token ${m}`); return o[b]; }
    const v = slots[a] !== undefined ? slots[a] : extra[a];
    if (v === undefined) throw new Error(`unresolved token ${m}`);
    return depth < 1 && slots[a] !== undefined && String(v).includes('{') ? fill(v, depth + 1) : v;
  });
  return tidy(fill(str, 0));
}

export function slotCombos(t, cap = 24) {
  const names = Object.keys(t.slots || {});
  if (!names.length) return [{}];
  let combos = [{}];
  for (const n of names) combos = combos.flatMap((c) => t.slots[n].map((v) => ({ ...c, [n]: v })));
  if (combos.length <= cap) return combos;
  // deterministic thinning that keeps every individual slot value represented
  const out = [], step = combos.length / cap;
  for (let i = 0; i < cap; i++) out.push(combos[Math.floor(i * step)]);
  return out;
}

// ------------------------------------------------------------------------------------------ effects
const STATE_CLAMP = { pop: [0, 100], conf: [0, 100], fatigue: [0, 100] };

function qualityOf(spec, c, rng) {
  if (typeof spec === 'number') return spec;
  const p = c.player;
  const v = (spec.base ?? 50) + (spec.mic ?? 0) * (p.mic - 50) + (spec.charisma ?? 0) * (p.charisma - 50) + (spec.conf ?? 0) * (p.confidence - 50) + (spec.pop ?? 0) * (p.popularity - 50) + rng.range(-(spec.noise ?? 8), spec.noise ?? 8);
  return Math.round(clamp(v, 1, 99));
}

/**
 * Apply an effects list. Returns { world:{rel,rivalry,tags,obligations}, state:[...], events:[specs], notes:[...] }.
 * World effects are collected so they can be written into the ledger event and replayed by memory/rules.js.
 */
export function collectEffects(effects, bind, ctx, rng) {
  const c = ctx.c, p = c.player;
  const out = { world: { rel: [], rivalry: [], tags: [], obligations: [] }, state: [], events: [], promises: [], flags: [], notes: [] };
  for (const e of effects || []) {
    const key = Object.keys(e)[0];
    const v = e[key];
    const who = (r) => { const b = bind[r]; if (!b) throw new Error(`effect refers to unknown role ${r}`); return b; };
    switch (key) {
      case 'pop': case 'conf': case 'fatigue': case 'money': case 'mic': case 'charisma': case 'wellbeing': case 'family': case 'social': out.state.push({ k: key, d: v }); break;
      case 'attr': out.state.push({ k: 'attr', name: v.name, d: v.delta }); break;
      case 'rel': {
        const b = who(v.who); if (!b.isWrestler) throw new Error('rel needs a wrestler');
        const d = { from: b.id, to: p.id }; for (const f of ['trust', 'respect', 'fear', 'heat', 'affinity']) if (v[f]) d[f] = v[f];
        out.world.rel.push(d);
        if (v.mutual) { const d2 = { from: p.id, to: b.id }; for (const f of ['trust', 'respect', 'fear', 'heat', 'affinity']) if (v[f]) d2[f] = v[f]; out.world.rel.push(d2); }
        break;
      }
      case 'rivalry': { const b = who(v.who); out.world.rivalry.push({ a: p.id, b: b.id, heat: v.heat }); break; }
      case 'tag': { const b = who(v.who); out.world.tags.push({ a: b.id, b: p.id, tag: v.tag }); break; }
      case 'obligation': { const b = who(v.who); out.world.obligations.push({ kind: v.kind, from: b.id, to: p.id, inDays: v.inDays ?? 7 }); break; }
      case 'promise': { const b = v.who ? who(v.who) : null; out.promises.push({ kind: v.kind, target: b ? b.id : null, text: render(v.text, bind), params: v.params || {}, deadlineDays: v.deadlineDays ?? 120 }); break; }
      case 'flag': out.flags.push({ set: v }); break;
      case 'clearFlag': out.flags.push({ clear: v }); break;
      case 'injury': out.state.push({ k: 'injury', part: v.part, severity: v.severity ?? 1, days: v.days ?? 14 }); break;
      case 'brand': out.state.push({ k: 'brand', to: v }); break;
      case 'contract': out.state.push({ k: 'contract', years: v.years, salary: v.salary, brand: v.brand || null }); break;
      case 'booking': { const b = who(v.who); out.state.push({ k: 'booking', who: b.id, type: v.type || 'singles', stakes: v.stakes || null }); break; }
      case 'note': out.notes.push(render(v, bind)); break;
      case 'event': {
        const parts = (v.participants || []).map((r) => who(r).id);
        const data = JSON.parse(JSON.stringify(v.data || {}));
        if (data.quality !== undefined) data.quality = qualityOf(data.quality, c, rng);
        if (data.viral && typeof data.viral === 'object') data.viral = (data.quality ?? 0) >= (data.viral.minQuality ?? 85) && rng.chance(data.viral.chance ?? 0.4);
        for (const [dk, dv] of Object.entries(data)) if (typeof dv === 'string' && dv.startsWith('@')) data[dk] = who(dv.slice(1)).id; // "@role" -> wrestler id
        if (v.type === 'retirement') data.legendary = !!c.stats && c.stats.s.titles.won >= 3 && c.stats.s.wins >= 150;
        out.events.push({ type: v.type, category: v.category || categoryOf(v.type), participants: parts, summary: render(v.summary, bind), importance: v.importance ?? 3, data });
        break;
      }
      default: throw new Error(`unknown effect "${key}"`);
    }
  }
  return out;
}
const categoryOf = (type) => ({ betrayal: 'relationship', alliance_formed: 'relationship', faction_formed: 'relationship', faction_joined: 'relationship', faction_left: 'relationship', mentorship: 'relationship', reconciliation: 'relationship', refusal_to_help: 'relationship',
  contract_signed: 'career', brand_transfer: 'career', award: 'career', retirement: 'career', hall_of_fame: 'career', record_set: 'career', milestone: 'career', podcast: 'media', press_conference: 'media', interview: 'media', social_post: 'media', confrontation: 'promo', promo_delivered: 'promo', goal_set: 'personal', decision: 'story' }[type] || 'story');

export function extrasOf(c, ctx) {
  const bp = brokenPromises(c.memory.world, c.player.id), op = openPromises(c.memory.world, c.player.id);
  return {
    brand: c.player.brand, year: c.year, show: ctx && ctx.ev ? ctx.ev.displayName || ctx.ev.name : c.player.brand,
    brokenPromise: bp.length ? bp[bp.length - 1].text : 'my promise', openPromise: op.length ? op[op.length - 1].text : 'my promise', era: c.era,
  };
}

// ------------------------------------------------------------------------------------------ engine
// Win/loss tallies ("N of your wins were clean") read as stat strings. They are suppressed in personal/emotional scenes, and
// a template whose premise is itself about a result can opt out with `memory.noResults` / `memory.allow` / `noAutoMemory`.
const NON_RESULT_HOOKS = ['you_betrayed_me', 'i_betrayed_you', 'broken_promise', 'old_insult', 'controversial_finish', 'controversial_finish_old', 'reconciled', 'respect', 'open_promise'];
const NO_TALLY_CATEGORIES = new Set(['personal', 'mentor', 'alliance', 'betrayal', 'faction', 'injury', 'recovery', 'retirement', 'legacy', 'fans', 'finance', 'travel']);
function memoryAllow(t) {
  if (t.memory && t.memory.allow) return t.memory.allow;
  if ((t.memory && t.memory.noResults) || NO_TALLY_CATEGORIES.has(t.category)) return NON_RESULT_HOOKS;
  return undefined;
}

export class ScenarioEngine {
  constructor(templates) {
    this.templates = new Map();
    for (const t of templates) {
      if (this.templates.has(t.id)) throw new Error(`duplicate scenario id ${t.id}`);
      this.templates.set(t.id, t);
    }
  }
  get size() { return this.templates.size; }

  state(c) { return (c.flags.scn ||= { last: {}, count: {}, catLast: {}, recent: [], lastDay: -999, n: 0 }); }

  /** which templates may start right now? returns [{t, bind, combo}] */
  eligible(c, { contexts = ['weekly'] } = {}) {
    const ctx = buildContext(c);
    const st = this.state(c);
    const out = [];
    for (const t of this.templates.values()) {
      if (t.contexts && !t.contexts.some((x) => contexts.includes(x))) continue;
      if (!t.contexts && !contexts.includes('weekly')) continue;
      const cd = t.cooldownDays ?? 90;
      if (st.last[t.id] != null && c.day - st.last[t.id] < cd) continue;
      if ((st.count[t.id] || 0) >= (t.maxPerCareer ?? 2)) continue;
      if (st.recent.includes(t.id)) continue;
      const catCd = t.categoryCooldown ?? 5;
      if (st.catLast[t.category] != null && c.day - st.catLast[t.category] < catCd) continue;
      let ok;
      try { ok = checkTrigger({ ...t.trigger, mem: undefined }, ctx, null); } catch (e) { throw new Error(`scenario ${t.id}: ${e.message}`); }
      if (!ok) continue;
      const bind = bindCast(t, ctx, `${c.seed}:${t.id}:${c.day}`);
      if (!bind) continue;
      if (t.trigger?.mem && !checkTrigger({ mem: t.trigger.mem }, ctx, bind)) continue;
      const combos = slotCombos(t);
      // rotate variants: prefer a combination not used recently
      const used = (c.flags.scn.variant ||= {});
      const idx = parseInt(hash53(`${c.seed}:${t.id}:${c.day}:${st.n}`), 36) % combos.length;
      const combo = combos[(idx + (used[t.id] || 0)) % combos.length];
      out.push({ t, bind, combo, ctx });
    }
    return out;
  }

  /** choose one scenario (weighted; obligation-driven ones first) and make it the active instance */
  pick(c, { contexts = ['weekly'], rng = c.rng } = {}) {
    const el = this.eligible(c, { contexts });
    if (!el.length) return null;
    // one rival should not star in every scene: each wrestler who appeared in the last few scenes halves a candidate's weight (obligations are exempt)
    const seen = this.state(c).castRecent || [];
    const crowd = (e) => (e.bind.__obligation ? 0 : Object.values(e.bind).filter((b) => b && b.isWrestler && seen.includes(b.id)).length);
    const w = el.map((e) => (e.t.weight ?? 1) * (e.bind.__obligation ? 12 : 1) * (e.t.priority ?? 1) * 0.5 ** crowd(e));
    const i = rng.weightedIndex(w);
    return this.instantiate(c, el[i]);
  }

  /** create a specific scenario instance by id (used by tests/validators) */
  start(c, id, { force = false } = {}) {
    const t = this.templates.get(id);
    if (!t) throw new Error(`unknown scenario ${id}`);
    const ctx = buildContext(c);
    const bind = bindCast(t, ctx, `${c.seed}:${id}:${c.day}`);
    if (!bind) throw new Error(`cast for ${id} cannot be filled`);
    if (!force && !checkTrigger(t.trigger, ctx, bind)) throw new Error(`trigger for ${id} not met`);
    const combos = slotCombos(t);
    return this.instantiate(c, { t, bind, combo: combos[0], ctx });
  }

  instantiate(c, { t, bind, combo, ctx }) {
    const st = this.state(c);
    st.n += 1;
    const instId = `${t.id}:${c.day}:${st.n}`;
    const text = (s) => render(s, bind, combo, extrasOf(c, ctx));
    const cooldown = { store: (c.flags.hookUse = c.flags.hookUse || {}), day: c.day, days: 60 };
    const allow = memoryAllow(t);
    let memLines = t.memory ? memoryLines(c.memory, c.player.id, bind[t.memory.role].id, bind[t.memory.role].name, { speaker: 'other', max: t.memory.max ?? 2, cooldown, allow }) : [];
    if (!t.memory && !t.noAutoMemory) {
      // any scene featuring a wrestler the player shares real history with may cite one remembered event (never invented)
      for (const [role, who] of Object.entries(bind)) {
        if (role.startsWith('__') || !who || !who.id || !c.universe.get(who.id)) continue;
        const ml = memoryLines(c.memory, c.player.id, who.id, who.name, { speaker: 'narrator', max: 1, cooldown, allow });
        if (ml.length) { memLines = ml.map((l) => ({ ...l, role })); break; }
      }
    }
    const inst = {
      id: instId, templateId: t.id, category: t.category, title: titleCase(text(t.title)), major: !!t.major,
      body: t.body.map(text), memory: memLines, combo, cast: Object.fromEntries(Object.entries(bind).filter(([k]) => !k.startsWith('__')).map(([k, v]) => [k, v])),
      obligations: bind.__obligation || {},
      choices: t.choices.map((ch) => ({ id: ch.id, label: text(ch.label), hint: ch.hint ? text(ch.hint) : null, risk: ch.risk || null, enabled: !ch.requires || checkTrigger(ch.requires, ctx, bind), requires: ch.requires ? true : false })),
      startedDay: c.day,
    };
    c.flags.scn.lastDay = c.day;
    return inst;
  }

  /** resolve the player's choice for an instance. Returns result summary. */
  resolve(c, inst, choiceId) {
    const t = this.templates.get(inst.templateId);
    const ch = t.choices.find((x) => x.id === choiceId);
    if (!ch) throw new Error(`unknown choice ${choiceId}`);
    const uiChoice = inst.choices.find((x) => x.id === choiceId);
    if (!uiChoice.enabled) throw new Error('that option is not available');
    const ctx = buildContext(c);
    const bind = { ...inst.cast, ...(inst.obligations ? { __obligation: inst.obligations } : {}) };
    const rng = new Rng(`scn:${c.seed}:${inst.id}:${choiceId}`);
    // pick outcome
    let outcome = null, outcomeIndex = -1;
    if (ch.outcomes) {
      const weights = ch.outcomes.map((o) => Math.max(0, (o.weight ?? 1) + Object.entries(o.bonus || {}).reduce((s, [k, m]) => s + m * ((k in ctx.stat ? ctx.stat[k] : 0) - 50) / 50, 0)));
      outcomeIndex = rng.weightedIndex(weights);
      outcome = ch.outcomes[outcomeIndex];
    }
    const effects = [...(ch.effects || []), ...(outcome?.effects || [])];
    const eff = collectEffects(effects, bind, ctx, rng);
    const text = (s) => render(s, bind, inst.combo, extrasOf(c, ctx));
    const resultText = text(outcome?.text || ch.result || 'Time passes.');
    // 1. ledger event for the choice (carries declared world effects so the rules engine can replay them)
    const involved = Object.values(bind).filter((b) => b && b.isWrestler && b.id !== c.player.id).map((b) => b.id);
    const rec = c.record({
      key: `scn:${inst.id}`, category: 'story', type: 'scenario_choice', participants: [c.player.id, ...new Set(involved)], storyline: ctx.rivals[0]?.id || null,
      summary: `${inst.title}: ${uiChoice.label}. ${resultText}`.slice(0, 280), importance: ch.importance ?? (inst.major ? 4 : 3), action: choiceId, outcome: outcome ? String(outcomeIndex) : null,
      data: { templateId: t.id, category: t.category, choice: choiceId, outcomeIndex, combo: inst.combo, cast: Object.fromEntries(Object.entries(inst.cast).map(([k, v]) => [k, v.id])), effects: eff.world, result: resultText },
    });
    const events = [rec.event];
    // 2. obligations fulfilled
    for (const [role, obId] of Object.entries(inst.obligations || {})) {
      const r = c.record({ key: `scn:${inst.id}:ob:${obId}`, category: 'system', type: 'obligation_resolved', refs: [rec.event.id], summary: `Obligation resolved: ${obId}`, importance: 1, data: { obligationId: obId, how: choiceId } });
      events.push(r.event);
    }
    // 3. promises
    eff.promises.forEach((pr, i) => {
      // the same public claim made again is one promise: do not write a second promise_made the world would drop
      if (hasOpenPromise(c.memory.world, { by: c.player.id, kind: pr.kind, target: pr.target || null, params: pr.params || {} })) return;
      const r = c.record({ key: `scn:${inst.id}:promise${i}`, category: 'promo', type: 'promise_made', refs: [rec.event.id], participants: [c.player.id, ...(pr.target ? [pr.target] : [])], summary: `Promise: "${pr.text}"`, importance: 3,
        data: { promiseId: `pr:${inst.id}:${i}`, kind: pr.kind, target: pr.target, text: pr.text, params: pr.params, deadlineDay: c.day + pr.deadlineDays } });
      events.push(r.event);
    });
    // 4. typed events
    eff.events.forEach((e, i) => {
      const r = c.record({ key: `scn:${inst.id}:ev${i}`, category: e.category, type: e.type, refs: [rec.event.id], participants: [c.player.id, ...e.participants], summary: e.summary, importance: e.importance, data: { ...e.data, scenario: inst.id, byPlayer: e.data.byPlayer ?? true } });
      events.push(r.event);
    });
    // 5. player state + flags (not ledger-derived; saved with the career)
    const p = c.player;
    for (const s of eff.state) {
      switch (s.k) {
        case 'pop': gainPop(p, s.d); break;
        case 'conf': p.confidence = clamp(p.confidence + s.d, 0, 100); break;
        case 'fatigue': p.fatigue = clamp(p.fatigue + s.d, 0, 100); break;
        case 'wellbeing': case 'family': case 'social': { const l = (p.life ||= { wellbeing: 60, family: 50, social: 40 }); l[s.k] = clamp(l[s.k] + s.d, 0, 100); break; }
        case 'money': p.money = Math.max(-50000, p.money + s.d); break;
        case 'mic': p.mic = clamp(p.mic + s.d, 0, 99); break;
        case 'charisma': p.charisma = clamp(p.charisma + s.d, 0, 99); break;
        case 'attr': p.attrs[s.name] = clamp(p.attrs[s.name] + s.d, 1, 99); break;
        case 'brand': {
          const from = p.brand; p.brand = s.to;
          const bt = c.record({ key: `scn:${inst.id}:brand`, category: 'career', type: 'brand_transfer', refs: [rec.event.id], summary: `${p.name} moved from ${from} to ${s.to}.`, importance: 3, data: { from, to: s.to } });
          events.push(bt.event); break;
        }
        case 'contract': {
          p.contract = { endDay: c.day + Math.round(s.years * 365), salary: s.salary, brand: s.brand || p.brand };
          const ct = c.record({ key: `scn:${inst.id}:contract`, category: 'career', type: 'contract_signed', refs: [rec.event.id], summary: `${p.name} signed a ${s.years}-year contract ($${s.salary.toLocaleString()}/yr).`, importance: 3, data: { years: s.years, salary: s.salary } });
          events.push(ct.event); break;
        }
        case 'injury': {
          const inj = c.record({ key: `scn:${inst.id}:injury`, category: 'career', type: 'injury', refs: [rec.event.id], summary: `${p.name} suffered a ${s.part} injury.`, importance: 3, data: { part: s.part, severity: s.severity, days: s.days, cause: 'scenario' } });
          if (!inj.duplicate) p.injuries.push({ part: s.part, severity: s.severity, daysLeft: s.days, total: s.days, eventId: inj.event.id });
          events.push(inj.event); break;
        }
        case 'booking': c.flags.forcedMatch = { who: s.who, type: s.type, stakes: s.stakes, from: inst.id }; break;
        default: break;
      }
    }
    if (eff.events.some((e) => e.type === 'retirement')) c.flags.retired = c.day;
    c.flags.story = c.flags.story || {};
    for (const f of eff.flags) { if (f.set) c.flags.story[f.set] = c.day; if (f.clear) delete c.flags.story[f.clear]; }
    // repetition bookkeeping
    const st = this.state(c);
    st.last[t.id] = c.day; st.count[t.id] = (st.count[t.id] || 0) + 1; st.catLast[t.category] = c.day;
    st.recent.push(t.id); if (st.recent.length > 8) st.recent.shift();
    st.castRecent = [...(st.castRecent || []), ...Object.values(bind).filter((b) => b && b.isWrestler && b.id !== c.player.id).map((b) => b.id)].slice(-8);
    c.flags.scn.variant = c.flags.scn.variant || {}; c.flags.scn.variant[t.id] = (c.flags.scn.variant[t.id] || 0) + 1;
    c.checkMilestones();
    return { text: resultText, notes: eff.notes, events, unlocked: events.flatMap((e) => []), outcomeIndex };
  }
}
