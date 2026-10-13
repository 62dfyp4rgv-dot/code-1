import test from 'node:test';
import assert from 'node:assert/strict';
import { ACHIEVEMENT_DEFS } from '../src/achievements/defs.js';
import { AchievementEngine, describeReq } from '../src/achievements/engine.js';
import { Career } from '../src/career/career.js';
import { CareerStats } from '../src/career/stats.js';
import { newCareer, debut, fight } from './helpers2.js';
import { proveAll, proveAchievement, missingEmitters } from '../tools/prover.js';

const mr = (c, data, extra = {}) => c.record({ key: `t${c.memory.ledger.size}:${Math.random()}`, category: 'match', type: 'match_result', participants: ['player', 'o'], summary: 'm', data: { matchType: 'singles', show: 'Raw', opponents: ['o'], partners: [], result: 'win', finish: 'pinfall', durationSec: 600, rating: 3, clean: true, ...data }, ...extra });

test('library: declarative, unique ids, every category populated, large enough', () => {
  const ids = new Set(ACHIEVEMENT_DEFS.map((d) => d.id));
  assert.equal(ids.size, ACHIEVEMENT_DEFS.length);
  assert.ok(ACHIEVEMENT_DEFS.length >= 150, `${ACHIEVEMENT_DEFS.length} achievements`);
  const cats = new Set(ACHIEVEMENT_DEFS.map((d) => d.category));
  for (const c of ['debut', 'in-ring', 'championship', 'streak', 'rumble', 'promo', 'media', 'relationship', 'career', 'era']) assert.ok(cats.has(c), `category ${c}`);
  for (const d of ACHIEVEMENT_DEFS) {
    for (const f of ['id', 'name', 'desc', 'category', 'rarity', 'req']) assert.ok(d[f], `${d.id} missing ${f}`);
    assert.ok(['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(d.rarity), `${d.id} rarity`);
    assert.ok(describeReq(d.req).length > 3);
  }
  assert.ok(ACHIEVEMENT_DEFS.filter((d) => d.secret).length >= 8, 'secret achievements exist');
  assert.ok(ACHIEVEMENT_DEFS.filter((d) => d.eras).length >= 8, 'era-gated achievements exist');
});

test('every achievement (secret ones included) is reachable through legal ledger events and unlocks with evidence', () => {
  const r = proveAll();
  assert.deepEqual(r.failures, []);
  assert.equal(r.ok, ACHIEVEMENT_DEFS.length);
  assert.deepEqual(missingEmitters(), [], 'all watched event types are emittable by a registered module');
});

test('achievements unlock at the correct time (not before the requirement is met) and record evidence + explanation', () => {
  const c = newCareer(21);
  debut(c);
  assert.ok(c.achievements.unlocked.debut);
  assert.ok(!c.achievements.unlocked.first_match);
  assert.ok(!c.achievements.unlocked.streak_3);
  const e1 = mr(c, {}); const e2 = mr(c, {});
  assert.ok(c.achievements.unlocked.first_match);
  assert.equal(c.achievements.unlocked.first_match.trigger, e1.event.id);
  assert.ok(!c.achievements.unlocked.streak_3, 'two wins is not three');
  assert.equal(c.achievements.progress.streak_3.value, 2);
  const e3 = mr(c, {});
  const u = c.achievements.unlocked.streak_3;
  assert.ok(u, 'third consecutive win unlocks it');
  assert.deepEqual(u.evidence, [e1.event.id, e2.event.id, e3.event.id]);
  assert.equal(u.date, e3.event.date);
  assert.match(u.explanation, /Requirement met \(3\/3\)/);
  assert.match(u.requirement, /consecutive match_result/);
  // unlock is a ledger event referencing the evidence
  const ue = c.memory.ledger.get(u.event);
  assert.equal(ue.type, 'achievement_unlocked');
  assert.deepEqual(ue.refs.slice().sort(), u.evidence.slice().sort());
});

test('multi-step achievements track progress exactly and reset on a loss', () => {
  const c = newCareer(22);
  debut(c);
  for (let i = 1; i <= 4; i++) { mr(c, {}); assert.equal(c.achievements.progress.streak_5.value, i); }
  mr(c, { result: 'loss' });
  assert.equal(c.achievements.progress.streak_5.value, 4, 'best run is retained as progress, but the run is broken');
  for (let i = 0; i < 4; i++) mr(c, {});
  assert.ok(!c.achievements.unlocked.streak_5, 'run restarted after the loss');
  mr(c, {});
  assert.ok(c.achievements.unlocked.streak_5);
});

test('conditions are evaluated against real data: wrong finishes / draws / losses never award wins-based achievements', () => {
  const c = newCareer(23);
  debut(c);
  mr(c, { result: 'loss', finish: 'pinfall' });
  mr(c, { result: 'draw', finish: 'time_limit_draw' });
  assert.ok(!c.achievements.unlocked.first_pinfall);
  assert.ok(!c.achievements.unlocked.first_submission);
  assert.ok(!c.achievements.unlocked.first_clean_win);
  assert.ok(c.achievements.unlocked.first_loss);
  assert.ok(c.achievements.unlocked.first_draw);
  mr(c, { finish: 'submission' });
  assert.ok(c.achievements.unlocked.first_submission);
  assert.ok(!c.achievements.unlocked.first_pinfall);
  mr(c, { finish: 'dq', clean: false });
  assert.ok(c.achievements.unlocked.first_dq_win);
  mr(c, { rating: 5 });
  assert.ok(c.achievements.unlocked.first_five_star);
  assert.ok(!c.achievements.unlocked.five_five_star);
});

test('era-specific achievements respect the era: an Attitude-era title does not count in the modern day', () => {
  const modern = new Career({ seed: 1, startYear: 2024, player: { id: 'player', name: 'M' }, era: 'current' });
  modern.record({ key: 'tw', category: 'career', type: 'title_win', summary: 'won', data: { titleId: 't', titleClass: 'world', era: 'attitude' } });
  assert.ok(!modern.achievements.unlocked.era_champ_attitude, 'era mismatch');
  assert.ok(modern.achievements.unlocked.world_title, 'generic world title still counts');
  const att = new Career({ seed: 1, startYear: 1999, player: { id: 'player', name: 'A' }, era: 'attitude' });
  att.record({ key: 'tw', category: 'career', type: 'title_win', summary: 'won', data: { titleId: 't', titleClass: 'world', era: 'attitude' } });
  assert.ok(att.achievements.unlocked.era_champ_attitude);
  assert.ok(!att.achievements.unlocked.era_champ_modern, 'other era achievements locked');
});

test('secret achievements stay hidden until earned and then explain themselves', () => {
  const c = newCareer(24);
  debut(c);
  const secret = c.achievements.list().find((a) => a.secret && !a.unlocked);
  assert.equal(secret.name, '???');
  assert.match(secret.desc, /secret/i);
  assert.equal(secret.progress, null);
  for (let i = 0; i < 5; i++) mr(c, { result: 'loss' });
  const rb = c.achievements.list().find((a) => a.id === 'lose_streak_5');
  assert.equal(rb.unlocked, true);
  assert.notEqual(rb.name, '???');
  assert.ok(rb.record.explanation.length > 20);
});

test('progress survives save/load and unlocked history is preserved verbatim', () => {
  const c = newCareer(25);
  debut(c);
  for (let i = 0; i < 4; i++) mr(c, {});
  const json = JSON.parse(JSON.stringify(c.toJSON()));
  const d = Career.fromJSON(json);
  assert.deepEqual(d.achievements.unlocked, c.achievements.unlocked);
  assert.equal(d.achievements.progress.streak_5.value, 4);
  mr(d, {});
  assert.ok(d.achievements.unlocked.streak_5, 'progress carried over: the 5th win after reload completes it');
  assert.equal(d.achievements.unlocked.first_match.date, c.achievements.unlocked.first_match.date);
});

test('achievements are derivable from the ledger alone (independent replay agrees with live unlocks)', () => {
  const c = newCareer(26);
  debut(c);
  for (let i = 0; i < 30; i++) { fight(c, ['rookie', 'tech', 'flyer'][i % 3], {}, 'smart'); c.advanceDays(6); }
  const live = Object.keys(c.achievements.unlocked).filter((k) => k !== 'meta_10' && k !== 'meta_50');
  const stats = new CareerStats('player');
  let era = c.era, year = 2024;
  const replay = AchievementEngine.rebuildUnlocks(ACHIEVEMENT_DEFS.filter((d) => !d.id.startsWith('meta_')), c.memory, {
    reset() { stats.s = new CareerStats('player').s; },
    apply(ev) { stats.apply(ev); year = parseInt(ev.date.slice(0, 4), 10); },
    current() { return { stats, era, year }; },
  });
  assert.deepEqual(Object.keys(replay).sort(), live.sort());
});

test('no duplicate awards: one achievement_unlocked event per achievement, even after repeated evaluation', () => {
  const c = newCareer(27);
  debut(c);
  for (let i = 0; i < 12; i++) mr(c, {});
  for (const ev of c.memory.ledger.events.slice()) c.achievements.processEvent(ev);
  const evs = c.memory.ledger.ofType('achievement_unlocked');
  const ids = evs.map((e) => e.data.achievementId);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids.length, Object.keys(c.achievements.unlocked).length);
});

test('titles, defenses and records: championship achievements and reign lengths come from title events', () => {
  const c = newCareer(28);
  debut(c);
  c.record({ key: 'tw1', category: 'career', type: 'title_win', summary: 'won', data: { titleId: 'wh', titleName: 'World', titleClass: 'world', era: 'current', wmWin: true } });
  assert.ok(c.achievements.unlocked.first_title && c.achievements.unlocked.wm_title && c.achievements.unlocked.world_title);
  for (let i = 1; i <= 5; i++) c.record({ key: `td${i}`, category: 'career', type: 'title_defense', summary: 'defended', data: { titleId: 'wh', success: true, defenseNumber: i } });
  assert.ok(c.achievements.unlocked.defenses_5);
  assert.ok(c.achievements.unlocked.defense_streak_5);
  assert.ok(!c.achievements.unlocked.defenses_10);
  c.advanceDays(100);
  c.record({ key: 'tl1', category: 'career', type: 'title_loss', summary: 'lost', data: { titleId: 'wh' } });
  assert.ok(c.achievements.unlocked.reign_90);
  assert.ok(!c.achievements.unlocked.reign_365);
  assert.equal(c.stats.s.titles.longestReignDays, 100);
  assert.equal(c.stats.totalDaysChampion(c.day), 100);
});
