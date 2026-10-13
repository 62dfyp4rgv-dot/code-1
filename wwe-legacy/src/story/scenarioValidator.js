// Static validation of scenario templates: schema, token resolution for EVERY slot combination,
// effect legality, numeric safety limits (anti-exploit) and a dominance check.
import { CATEGORIES, STAFF_ROLES, MEDIA_KINDS, REL_TAGS, EVENT_TYPES_ALLOWED, render, slotCombos, collectEffects, checkTrigger, wrestlerBinding } from './scenarios.js';
import { PROMISE_KINDS } from '../memory/rules.js';
import { Rng } from '../core/rng.js';

const LIM = { pop: 6, conf: 25, fatigue: 40, moneyMin: -100000, moneyMax: 250000, rel: 50, heat: 45, attr: 3, skill: 3 };
const TRIGGER_KEYS = ['era', 'minYear', 'maxYear', 'month', 'alignment', 'style', 'gender', 'brand', 'background', 'stat', 'recent', 'injured', 'serious', 'holdsTitle', 'flag', 'noFlag', 'daysSince', 'rivalry', 'promise', 'mem', 'event', 'eventWithin', 'contract', 'all', 'any', 'not', 'phase'];
const CONTEXTS = ['weekly', 'post_match', 'pre_show', 'show_day', 'post_show', 'offseason'];

const dummyWrestler = (id) => wrestlerBinding({ id, name: `Test ${id}`, gender: 'M', style: 'brawler', tier: 2, alignment: 'heel' });
export function dummyBinding(t) {
  const b = { player: { id: 'player', name: 'Test Hero', first: 'Test', last: 'Hero', isWrestler: true, they: 'they', them: 'them', their: 'their', theirs: 'theirs' } };
  for (const [role, spec] of Object.entries(t.cast || {})) {
    if (spec.pick === 'staff') b[role] = { id: `staff:${spec.role}`, name: 'Staff Person', first: 'Staff', isWrestler: false, they: 'they', them: 'them', their: 'their', theirs: 'theirs' };
    else if (spec.pick === 'media') b[role] = { id: `media:${spec.kind}`, name: 'Media Person (Outlet)', first: 'Media', isWrestler: false, they: 'they', them: 'them', their: 'their', theirs: 'theirs' };
    else b[role] = dummyWrestler(role);
  }
  return b;
}

function textsOf(t) {
  const out = [t.title, ...(t.body || [])];
  for (const ch of t.choices || []) {
    out.push(ch.label, ch.hint, ch.result);
    for (const o of ch.outcomes || []) out.push(o.text);
    for (const e of [...(ch.effects || []), ...((ch.outcomes || []).flatMap((o) => o.effects || []))]) {
      const v = e[Object.keys(e)[0]];
      if (v && typeof v === 'object') { if (v.summary) out.push(v.summary); if (v.text) out.push(v.text); } else if (Object.keys(e)[0] === 'note') out.push(v);
    }
  }
  return out.filter((x) => typeof x === 'string');
}

function checkTriggerShape(trig, errors, where = 'trigger') {
  if (!trig) return;
  for (const [k, v] of Object.entries(trig)) {
    if (!TRIGGER_KEYS.includes(k)) { errors.push(`${where}: unknown key "${k}"`); continue; }
    if (['all', 'any'].includes(k)) v.forEach((x) => checkTriggerShape(x, errors, `${where}.${k}`));
    if (k === 'not') checkTriggerShape(v, errors, `${where}.not`);
    if (k === 'era' && !Array.isArray(v)) errors.push(`${where}.era must be an array`);
    if (k === 'stat') for (const n of Object.keys(v)) if (!['popularity', 'confidence', 'fatigue', 'money', 'overall', 'matches', 'wins', 'losses', 'winStreak', 'loseStreak', 'titleWins', 'titlesHeld', 'defenses', 'rating', 'careerYears', 'mic', 'charisma', 'promos', 'injuries', 'daysChampion', 'mainEvents', 'pleMatches', 'rumbleEntries'].includes(n)) errors.push(`${where}.stat: unknown stat "${n}"`);
    if (k === 'daysSince') for (const n of Object.keys(v)) if (!['match', 'promo', 'scenario'].includes(n)) errors.push(`${where}.daysSince: unknown "${n}"`);
  }
}

export function validateTemplate(t) {
  const errors = [], warnings = [];
  const E = (m) => errors.push(m), W = (m) => warnings.push(m);
  if (!t.id || !/^[a-z0-9_]+$/.test(t.id)) E(`id must be snake_case: "${t.id}"`);
  if (!CATEGORIES.includes(t.category)) E(`unknown category "${t.category}"`);
  if (!t.title || typeof t.title !== 'string') E('title missing');
  if (!Array.isArray(t.body) || !t.body.length || t.body.some((b) => typeof b !== 'string' || b.length < 20)) E('body must be a non-empty array of strings (>= 20 chars each)');
  if (!Array.isArray(t.choices) || t.choices.length < (t.major ? 3 : 2)) E(`needs at least ${t.major ? 3 : 2} choices`);
  if (t.contexts) for (const c of t.contexts) if (!CONTEXTS.includes(c)) E(`unknown context ${c}`);
  checkTriggerShape(t.trigger, errors);
  for (const [role, spec] of Object.entries(t.cast || {})) {
    if (['player'].includes(role)) E('role name "player" is reserved');
    if (!['rivalry', 'obligation', 'tag', 'champion', 'roster', 'staff', 'media'].includes(spec.pick)) E(`role ${role}: unknown pick "${spec.pick}"`);
    if (spec.pick === 'staff' && !STAFF_ROLES.includes(spec.role)) E(`role ${role}: unknown staff role ${spec.role}`);
    if (spec.pick === 'media' && !MEDIA_KINDS.includes(spec.kind)) E(`role ${role}: unknown media kind ${spec.kind}`);
    if (spec.pick === 'tag' && !REL_TAGS.includes(spec.tag)) E(`role ${role}: unknown relationship tag ${spec.tag}`);
    if (spec.pick === 'obligation' && !spec.kind) E(`role ${role}: obligation needs kind`);
  }
  if (t.slots) for (const [n, vals] of Object.entries(t.slots)) { if (!Array.isArray(vals) || vals.length < 2) E(`slot ${n} needs >= 2 values`); }
  // token resolution across every slot combination
  const bind = dummyBinding(t);
  const combos = slotCombos(t, 200);
  const slotUse = Object.fromEntries(Object.keys(t.slots || {}).map((k) => [k, false]));
  const seen = new Set();
  for (const combo of combos) {
    for (const str of textsOf(t)) {
      try { render(str, bind, combo, { brand: 'Raw', year: 2024, show: 'Raw', brokenPromise: 'a promise', openPromise: 'a promise', era: 'current' }); } catch (e) { E(`text "${str.slice(0, 40)}...": ${e.message}`); break; }
    }
    seen.add(JSON.stringify(combo));
  }
  for (const k of Object.keys(slotUse)) if (!textsOf(t).some((s) => s.includes(`{${k}}`))) E(`slot "${k}" is never used in the text`);
  // choices & effects
  const ids = new Set();
  const vec = [];
  for (const ch of t.choices || []) {
    if (!ch.id || ids.has(ch.id)) E(`duplicate/missing choice id ${ch.id}`); ids.add(ch.id);
    if (!ch.label || ch.label.length > 70) E(`choice ${ch.id}: label missing or > 70 chars`);
    if (!ch.result && !ch.outcomes) E(`choice ${ch.id}: needs result or outcomes`);
    if (ch.outcomes && (ch.outcomes.length < 2 || ch.outcomes.some((o) => !o.text))) E(`choice ${ch.id}: outcomes need >= 2 entries with text`);
    if (ch.requires) checkTriggerShape(ch.requires, errors, `choice ${ch.id}.requires`);
    const all = [{ w: 1, effects: ch.effects || [] }];
    const lists = ch.outcomes ? ch.outcomes.map((o) => ({ w: o.weight ?? 1, effects: [...(ch.effects || []), ...(o.effects || [])] })) : [{ w: 1, effects: ch.effects || [] }];
    const tot = lists.reduce((s, l) => s + l.w, 0) || 1;
    const v = { pop: 0, conf: 0, fatigue: 0, money: 0, rel: 0, heat: 0 };
    for (const l of lists) {
      let eff;
      try { eff = collectEffects(l.effects, bind, { c: { player: { mic: 50, charisma: 50, confidence: 50, popularity: 50 } } }, new Rng(1)); } catch (e) { E(`choice ${ch.id}: ${e.message}`); continue; }
      for (const s of eff.state) {
        if (s.k === 'pop' && Math.abs(s.d) > LIM.pop) E(`choice ${ch.id}: pop ${s.d} exceeds ±${LIM.pop}`);
        if (s.k === 'conf' && Math.abs(s.d) > LIM.conf) E(`choice ${ch.id}: conf ${s.d} exceeds ±${LIM.conf}`);
        if (s.k === 'fatigue' && Math.abs(s.d) > LIM.fatigue) E(`choice ${ch.id}: fatigue ${s.d} exceeds ±${LIM.fatigue}`);
        if (s.k === 'money' && (s.d < LIM.moneyMin || s.d > LIM.moneyMax)) E(`choice ${ch.id}: money ${s.d} out of range`);
        if (s.k === 'attr' && (Math.abs(s.d) > LIM.attr || !['power', 'striking', 'grappling', 'technical', 'agility', 'endurance', 'toughness', 'psychology'].includes(s.name))) E(`choice ${ch.id}: bad attr effect ${JSON.stringify(s)}`);
        if ((s.k === 'mic' || s.k === 'charisma') && Math.abs(s.d) > LIM.skill) E(`choice ${ch.id}: ${s.k} ${s.d} exceeds ±${LIM.skill}`);
        if (s.k === 'brand' && !['Raw', 'SmackDown', 'NXT', 'WWF'].includes(s.to)) E(`choice ${ch.id}: unknown brand ${s.to}`);
        if (s.k === 'contract' && (!(s.years >= 0.5 && s.years <= 6) || !(s.salary >= 10000 && s.salary <= 10000000))) E(`choice ${ch.id}: contract years 0.5-6 and salary 10k-10M required`);
        if (s.k === 'injury' && (!['head', 'torso', 'arms', 'legs'].includes(s.part))) E(`choice ${ch.id}: bad injury part`);
        if (s.k === 'pop') v.pop += (l.w / tot) * s.d; if (s.k === 'conf') v.conf += (l.w / tot) * s.d; if (s.k === 'fatigue') v.fatigue -= (l.w / tot) * s.d; if (s.k === 'money') v.money += (l.w / tot) * s.d / 1000;
      }
      for (const r of eff.world.rel) { for (const f of ['trust', 'respect', 'fear', 'affinity']) if (Math.abs(r[f] || 0) > LIM.rel) E(`choice ${ch.id}: rel.${f} out of range`); if (Math.abs(r.heat || 0) > LIM.heat) E(`choice ${ch.id}: rel.heat out of range`); v.rel += (l.w / tot) * ((r.trust || 0) + (r.respect || 0) - (r.heat || 0) / 2); }
      for (const r of eff.world.rivalry) { if (Math.abs(r.heat) > LIM.heat) E(`choice ${ch.id}: rivalry.heat out of range`); v.heat += (l.w / tot) * r.heat; }
      for (const tg of eff.world.tags) if (!REL_TAGS.includes(tg.tag)) E(`choice ${ch.id}: unknown relationship tag ${tg.tag}`);
      for (const pr of eff.promises) { if (!PROMISE_KINDS.includes(pr.kind)) E(`choice ${ch.id}: unknown promise kind ${pr.kind}`); v.rel -= 3 * (l.w / tot); }
      for (const ev of eff.events) if (!EVENT_TYPES_ALLOWED.includes(ev.type)) E(`choice ${ch.id}: event type "${ev.type}" not allowed`);
      for (const ob of eff.world.obligations) if (!ob.kind) E(`choice ${ch.id}: obligation needs kind`);
    }
    vec.push({ id: ch.id, v });
  }
  // dominance: a choice that is >= every other choice on every dimension (and > on one) is a free lunch
  if (vec.length >= 2) {
    for (const a of vec) {
      const dominatesAll = vec.every((b) => b === a || (['pop', 'conf', 'fatigue', 'money', 'rel'].every((k) => a.v[k] >= b.v[k] - 1e-9) && ['pop', 'conf', 'fatigue', 'money', 'rel'].some((k) => a.v[k] > b.v[k] + 1e-9)));
      const positive = a.v.pop + a.v.conf / 5 + a.v.money / 2 + a.v.rel / 10 > 0.5;
      if (dominatesAll && positive) W(`choice "${a.id}" dominates every alternative (possible exploit)`);
    }
  }
  return { errors, warnings, configs: seen.size };
}

export function validateLibrary(templates) {
  const report = { templates: templates.length, configs: 0, byCategory: {}, errors: [], warnings: [], ids: new Set() };
  for (const t of templates) {
    if (report.ids.has(t.id)) report.errors.push(`${t.id}: duplicate id`);
    report.ids.add(t.id);
    const r = validateTemplate(t);
    report.configs += r.configs;
    report.byCategory[t.category] = (report.byCategory[t.category] || 0) + 1;
    for (const e of r.errors) report.errors.push(`${t.id}: ${e}`);
    for (const w of r.warnings) report.warnings.push(`${t.id}: ${w}`);
  }
  return report;
}
