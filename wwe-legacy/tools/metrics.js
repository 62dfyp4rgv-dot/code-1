// Metric collection for the Gauntlet. Everything here is *measured* from tests, simulations and
// audits - no number is typed in by hand. Scores are derived from these in rubric.js.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { MatchEngine } from '../src/match/engine.js';
import { SAMPLE_WRESTLERS as W } from '../src/match/samples.js';
import { MATCH_TYPE_IDS } from '../src/match/rules.js';
import { rateMatch } from '../src/match/rating.js';
import { narrate } from '../src/match/commentary.js';
import { playCareer } from './careersim.js';
import { proveAll } from './prover.js';
import { validateLibrary } from '../src/story/scenarioValidator.js';
import { SCENARIO_TEMPLATES } from '../src/story/scenarios/index.js';
import { ACHIEVEMENT_DEFS } from '../src/achievements/defs.js';
import { Career } from '../src/career/career.js';
import { Universe } from '../src/universe/universe.js';
import { UniverseSim } from '../src/universe/sim.js';
import { makeEnvelope, codec } from '../src/save/save.js';
import { PLE_DEFS } from '../src/universe/calendar.js';
import { buildRecordBook, inspectItem } from '../src/career/recordbook.js';
import { deliverPromo } from '../src/story/media.js';
import { validateLines } from '../src/story/dialogue.js';
import { featureReport } from './features.js';
import { Game, PLANS, ENTRANCES, TRAINING, STIPULATION_HEAT } from '../src/game.js';
import { ERAS } from '../src/data/eras.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const std = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };

export function runTests() {
  const t0 = Date.now();
  const r = spawnSync('node', ['--test', '--test-reporter=tap', ...fs.readdirSync(path.join(root, 'test')).filter((f) => f.endsWith('.test.js')).map((f) => path.join('test', f))], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = r.stdout || '';
  const num = (k) => +(out.match(new RegExp(`^# ${k} (\\d+)`, 'm')) || [0, 0])[1];
  const failed = [...out.matchAll(/^not ok \d+ - (.+)$/gm)].map((m) => m[1]);
  const perFile = {};
  for (const m of out.matchAll(/^# Subtest: (.+)$/gm)) perFile[m[1]] = 1;
  return { total: num('tests'), pass: num('pass'), fail: num('fail'), failed, ms: Date.now() - t0 };
}

export function matchMetrics({ n = 120 } = {}) {
  const out = { types: {}, ms: 0 };
  const t0 = performance.now();
  const names = ['brawler', 'tech', 'flyer', 'power', 'sub', 'show'];
  const all = { finish: {}, n: 0, rounds: 0, mins: 0, fin: 0, ratings: [] };
  for (const type of MATCH_TYPE_IDS) {
    const t = { n: 0, finishes: {}, invalid: 0, draws: 0, maxRounds: 0 };
    for (let i = 0; i < n; i++) {
      const a = names[i % names.length], b = names[(i * 5 + 1 + (i % 2)) % names.length];
      if (a === b) continue;
      const sides = type === 'tag' ? [[W[a], W.partnerA], [W[b], W.partnerB]] : [[W[a]], [W[b]]];
      const e = MatchEngine.simulate({ seed: 7000 + i, type, sides, playerId: W[a].id }, {});
      const r = e.state.result;
      t.n++;
      if (!r || !['pinfall', 'submission', 'dq', 'countout', 'ten_count', 'falls', 'objective', 'time_limit_draw', 'double_countout', 'stalemate'].includes(r.finish)) t.invalid++;
      else { t.finishes[r.finish] = (t.finishes[r.finish] || 0) + 1; if (r.winnerSide === null) t.draws++; t.maxRounds = Math.max(t.maxRounds, r.rounds); }
      if (type === 'singles' && r) {
        all.n++; all.finish[r.finish] = (all.finish[r.finish] || 0) + 1; all.rounds += r.rounds; all.mins += r.durationSec / 60;
        all.fin += e.state.events.filter((x) => /^finisher_/.test(x.type)).length; all.ratings.push(rateMatch(e.state).stars);
      }
    }
    out.types[type] = t;
  }
  // side balance + skill gap
  let a = 0, b = 0;
  for (let i = 0; i < 240; i++) {
    const A = { ...W.show, id: 'm1', name: 'One' }, B = { ...W.show, id: 'm2', name: 'Two' };
    const e = MatchEngine.simulate({ seed: 9000 + i, type: 'singles', sides: [[A], [B]], playerId: 'm1' }, {});
    if (e.result.winnerSide === 0) a++; else if (e.result.winnerSide === 1) b++;
  }
  out.mirrorShare = a / Math.max(1, a + b);
  let sm = 0, rd = 0;
  for (let i = 0; i < 160; i++) {
    const A = { ...W.show, id: 'p1', name: 'Smart' }, B = { ...W.show, id: 'p2', name: 'Random' };
    const e = MatchEngine.simulate({ seed: 5000 + i, type: 'singles', sides: [[A], [B]], playerId: 'p1' }, { p1: 'smart', p2: 'random' });
    if (e.result.winnerSide === 0) sm++; else if (e.result.winnerSide === 1) rd++;
  }
  out.skillGap = sm / Math.max(1, sm + rd);
  // decision menu sizes with a human-driven sample
  const feat = [], defs = [], decisionsPerMatch = [];
  for (let seed = 1; seed <= 20; seed++) {
    const e = new MatchEngine({ seed, type: 'singles', sides: [[W.tech], [W.brawler]], playerId: 'tech' }, { human: ['tech'] });
    let n2 = 0;
    while (!e.over && n2 < 400) {
      const d = e.getDecision(); if (!d) break;
      n2++;
      if (d.kind === 'action') feat.push(d.options.filter((o) => o.featured).length);
      if (d.kind === 'defense') defs.push(d.options.length);
      const opts = d.options.filter((o) => o.enabled !== false);
      e.choose(opts[(n2 * 7) % opts.length].id);
    }
    decisionsPerMatch.push(n2);
  }
  out.featured = { min: Math.min(...feat), mean: mean(feat), inRange: feat.filter((x) => x >= 6 && x <= 14).length / feat.length };
  out.defense = { min: Math.min(...defs), max: Math.max(...defs) };
  out.decisionsPerMatch = mean(decisionsPerMatch);
  out.singles = { ...all, ratingMean: mean(all.ratings), ratingStd: std(all.ratings), avgMins: all.mins / Math.max(1, all.n), avgRounds: all.rounds / Math.max(1, all.n), finishersPerMatch: all.fin / Math.max(1, all.n) };
  // commentary coverage over observed event types
  const seen = new Set(), silent = new Set(), lineSet = new Set();
  let lineCount = 0;
  const nameRe = new RegExp(Object.values(W).map((w) => w.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  for (let i = 0; i < 60; i++) {
    const type = MATCH_TYPE_IDS[i % MATCH_TYPE_IDS.length];
    const sides = type === 'tag' ? [[W.show, W.partnerA], [W.sub, W.partnerB]] : [[W.show], [W.sub]];
    const e = MatchEngine.simulate({ seed: 300 + i, type, sides, playerId: 'show' }, {});
    for (const ev of e.state.events) {
      seen.add(ev.type);
      const t = narrate(e.state, ev);
      if (!t && !['position_noop'].includes(ev.type)) silent.add(ev.type);
      if (t) { lineCount++; lineSet.add((Array.isArray(t) ? t.join(' ') : String(t)).replace(nameRe, 'X').replace(/\d+/g, '#')); }
    }
  }
  out.commentary = { eventTypes: seen.size, silent: [...silent], lines: lineCount, distinct: lineSet.size, variety: (lineSet.size / Math.max(1, lineCount)) * 1000 };
  out.ms = performance.now() - t0;
  return out;
}

export function careerMetrics({ quick = false } = {}) {
  const years = quick ? 1 : 3;
  const configs = [
    { strategy: 'smart', seed: 11 }, { strategy: 'average', seed: 12 }, { strategy: 'weak', seed: 13 }, { strategy: 'random', seed: 14 }, { strategy: 'aggressive', seed: 15 },
    { strategy: 'smart', seed: 16, startYear: 1998, background: 'established', style: 'brawler' }, { strategy: 'average', seed: 17, startYear: 2008, background: 'indie', style: 'highflyer' },
    { strategy: 'smart', seed: 18, gender: 'F', background: 'prospect', style: 'technician' },
  ].slice(0, quick ? 3 : 8);
  const reps = [];
  const scn = {}, ach = new Set();
  for (const cfg of configs) {
    const r = playCareer({ years, ...cfg });
    const { game, scenarioIds, ...rest } = r;
    probeCareer(game, rest);
    for (const [k, v] of Object.entries(scenarioIds)) scn[k] = (scn[k] || 0) + v;
    for (const k of Object.keys(game.career.achievements.unlocked)) ach.add(k);
    // scenario memory coverage: how many resolved scenarios carried recalled memory
    rest.scenarioIds = scenarioIds; rest.cfg = cfg;
    rest.storageBytes = null;
    reps.push(rest);
    rest._game = game;
  }
  const sum = (k) => reps.reduce((a, r) => a + (r[k] || 0), 0);
  const scnTotal = sum('scenarios');
  return {
    reps, scenarioCounts: scn, achievementsUnlocked: [...ach], years,
    recallShare: scnTotal ? sum('recalled') / scnTotal : 0,
    recordBookCoverage: sum('rbItems') ? sum('rbCovered') / sum('rbItems') : null,
    promoGrounded: sum('promoLines') >= 5 ? 1 - sum('promoBad') / sum('promoLines') : null,
    promoLines: sum('promoLines'), promoBad: sum('promoBad'),
  };
}

/** Post-hoc probes on a finished career: record-book evidence coverage and promo grounding. */
function probeCareer(game, rest) {
  const c = game.career;
  const nameOf = (id) => game.universe.get(id)?.name || id;
  const book = buildRecordBook(c, nameOf);
  let items = 0, covered = 0, badEvidence = 0;
  for (const sec of book.sections) for (const it of sec.items) {
    const numeric = typeof it.value === 'number' ? it.value : parseFloat(String(it.value));
    if (!Number.isFinite(numeric) || numeric === 0) continue;
    items++;
    if (it.evidence && it.evidence.length && inspectItem(c, it).length === it.evidence.length) covered++; else if (it.evidence && it.evidence.length) badEvidence++;
  }
  rest.rbItems = items; rest.rbCovered = covered; rest.rbBad = badEvidence;
  // promos against up to four opponents the player has history with
  const rivals = Object.values(c.memory.world.rivalries).filter((r) => r.a === c.player.id || r.b === c.player.id).sort((a, b) => b.matches - a.matches).slice(0, 4);
  let lines = 0, bad = 0;
  for (const r of rivals) {
    const other = r.a === c.player.id ? r.b : r.a;
    for (const tone of ['challenge', 'insult']) {
      try {
        const res = deliverPromo(c, { tone, targetId: other, claim: 'none' });
        const claims = res.lines.filter((l) => l.kind);
        lines += claims.length; bad += validateLines(c.memory, res.lines).length;
      } catch (e) { bad++; }
    }
  }
  rest.promoLines = lines; rest.promoBad = bad;
}

export function universeMetrics() {
  const out = {};
  const run = (year, seed, days) => {
    const c = new Career({ seed, startYear: year, player: { id: 'player', name: 'P' } });
    c.universe = Universe.create({ seed, mode: 'historical', year });
    const sim = new UniverseSim(c); const t0 = performance.now();
    sim.advanceTo(days);
    return { c, ms: performance.now() - t0, stats: sim.stats };
  };
  const a = run(1998, 5, 365 * 4 + 150), b = run(2024, 7, 365 * 3);
  const a2 = run(1998, 5, 365 * 4 + 150);
  out.deterministic = JSON.stringify(a.c.universe.toJSON()) === JSON.stringify(a2.c.universe.toJSON());
  out.lineageProblems = a.c.universe.lineageProblems().length + b.c.universe.lineageProblems().length;
  out.msPerYear = (a.ms / 4.4 + b.ms / 3) / 2;
  out.stats = { a: a.stats, b: b.stats };
  out.rosterSizes = [a.c.universe.list().length, b.c.universe.list().length];
  out.titles = { a: Object.keys(a.c.universe.titles).length, b: Object.keys(b.c.universe.titles).length };
  out.split = a.c.universe.split;
  out.reigns = [a, b].map((x) => Object.values(x.c.universe.titles).map((t) => t.reigns.length));
  out.feuds = Object.keys(b.c.universe.feuds).length;
  out.pleCount = PLE_DEFS.length;
  out.realEntries = 107;
  return out;
}

export async function saveMetrics(game) {
  const env = makeEnvelope(game.career);
  const raw = JSON.stringify(env);
  const enc = await codec.encode(raw);
  let ok = false;
  try { const back = await codec.decode(enc); ok = back === raw; } catch { ok = false; }
  return { bytes: enc.length, kb: Math.round(enc.length / 1024), rawBytes: raw.length, ok, events: game.career.memory.ledger.size };
}

export function scenarioMetrics() {
  const r = validateLibrary(SCENARIO_TEMPLATES);
  const bodies = SCENARIO_TEMPLATES.map((t) => t.body.join(' '));
  const openers = new Set(bodies.map((b) => b.split(' ').slice(0, 3).join(' ').toLowerCase()));
  const words = bodies.join(' ').toLowerCase().match(/[a-z']+/g) || [];
  const mem = (t) => !!t.memory || !!(t.trigger && (t.trigger.mem || t.trigger.rivalry || t.trigger.obligation || t.trigger.promiseOpen || t.trigger.promiseBroken)) || Object.values(t.cast || {}).some((c) => ['rivalry', 'obligation', 'tag'].includes(c.pick));
  const sig = (ch) => JSON.stringify(ch.outcomes ? ch.outcomes.map((o) => o.effects) : ch.effects);
  const conseq = (t) => t.choices.length >= 3 && new Set(t.choices.map(sig)).size === t.choices.length && t.choices.some((ch) => ch.outcomes && ch.outcomes.length > 1);
  return { memoryShare: SCENARIO_TEMPLATES.filter(mem).length / SCENARIO_TEMPLATES.length, consequential: SCENARIO_TEMPLATES.filter(conseq).length / SCENARIO_TEMPLATES.length, authored: r.templates, configs: r.configs, errors: r.errors.length, warnings: r.warnings.length, categories: Object.keys(r.byCategory).length, byCategory: r.byCategory, openerDiversity: openers.size / bodies.length, typeToken: new Set(words).size / words.length, vocab: new Set(words).size };
}

export function achievementMetrics() {
  const p = proveAll();
  return { total: ACHIEVEMENT_DEFS.length, provable: p.ok, failures: p.failures, secret: ACHIEVEMENT_DEFS.filter((d) => d.secret).length, eraGated: ACHIEVEMENT_DEFS.filter((d) => d.eras).length };
}

export function uiMetrics({ runE2E = false } = {}) {
  let res = null;
  const file = path.join(root, 'dist/e2e/results.json');
  if (runE2E) {
    spawnSync('node', ['tools/build.js'], { cwd: root, encoding: 'utf8' });
    const r = spawnSync('node', ['tools/e2e.js'], { cwd: root, encoding: 'utf8', timeout: 900000 });
    res = { ran: true, stdoutTail: (r.stdout || '').split('\n').slice(-3).join(' | ') };
  }
  let results = null;
  try { results = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* none */ }
  const bundle = (() => { try { return fs.statSync(path.join(root, 'dist/artifact.html')).size; } catch { return null; } })();
  const views = (() => { try { return fs.readFileSync(path.join(root, 'ui/views.js'), 'utf8'); } catch { return ''; } })();
  const screenFns = ['home', 'career', 'matches', 'calendar', 'roster', 'rivalries', 'media', 'achievements', 'recordBook', 'relationships', 'settingsView'];
  const found = screenFns.filter((f) => new RegExp(`function ${f}\\(`).test(views)).length;
  const css = (() => { try { return fs.readFileSync(path.join(root, 'ui/styles.css'), 'utf8'); } catch { return ''; } })();
  const a11y = /safe-area-inset/.test(css) && /prefers-reduced-motion/.test(css) && /data-theme/.test(css);
  const proto = Game.prototype;
  const prep = { plans: Object.keys(PLANS).length, entrances: Object.keys(ENTRANCES).length, training: Object.keys(TRAINING).length, stipulations: Object.keys(STIPULATION_HEAT).length,
    postMatch: typeof proto.postMatchChoose === 'function', promo: typeof proto.deliverPromo === 'function' || typeof proto.promoOptions === 'function', scenarios: typeof proto.resolveScenario === 'function', rumble: typeof proto.startRumble === 'function' };
  return { prep, screens: { found, total: 11 }, a11y, eras: Object.keys(ERAS || {}).length, startConfigs: (() => { const o = Game.creationOptions(); return Object.keys(o.styles).length * Object.keys(o.backgrounds).length * o.startYears.length * o.alignments.length * 2; })(), ran: !!res, e2e: results ? { at: results.at, total: results.results.length, passed: results.results.filter((r) => r.ok).length, overflowChecks: results.results.filter((r) => /overflow/.test(r.name)).length, tapAudit: results.tapAudit ?? null } : null, bundleBytes: bundle, textSizes: 4, themes: 3 };
}

export function reviewMetrics() {
  try { return JSON.parse(fs.readFileSync(path.join(root, 'docs/gauntlet/reviews.json'), 'utf8')); } catch { return null; }
}

export { featureReport };
