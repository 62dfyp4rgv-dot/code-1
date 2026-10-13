import test from 'node:test';
import assert from 'node:assert/strict';
import { Ledger } from '../src/memory/ledger.js';
import { Memory } from '../src/memory/memory.js';
import { Career } from '../src/career/career.js';
import { newCareer, debut, fight, opp, W, makeBooking, playHeadless } from './helpers2.js';
import { getRel, betrayalsBetween } from '../src/memory/world.js';
import { recomputeStats, inspectStat } from '../src/career/stats.js';
import { validateSummary } from '../src/memory/summaries.js';

const spec = (n, extra = {}) => ({ key: `k${n}`, day: n, category: 'match', type: 'match_result', participants: ['player', 'x'], summary: `e${n}`, data: { result: 'win', opponents: ['x'] }, ...extra });

test('ledger: events are immutable, ordered, hash-chained and idempotent by key', () => {
  const l = new Ledger();
  const a = l.append(spec(1));
  assert.equal(a.duplicate, false);
  assert.throws(() => { a.event.summary = 'tampered'; }, TypeError);
  assert.throws(() => { a.event.data.result = 'loss'; }, TypeError);
  const dup = l.append(spec(1, { summary: 'different text, same key' }));
  assert.equal(dup.duplicate, true);
  assert.equal(dup.event.id, a.event.id);
  assert.equal(l.size, 1);
  l.append(spec(2));
  assert.deepEqual(l.verify().ok, true);
  assert.equal(l.get('E000002').prev, l.get('E000001').hash);
  assert.throws(() => l.append({ ...spec(3), key: undefined }), /idempotency/);
  assert.throws(() => l.append({ ...spec(4), refs: ['E999999'] }), /unknown event/);
});

test('ledger: tampering with a saved event is detected on load', () => {
  const l = new Ledger();
  for (let i = 1; i <= 20; i++) l.append(spec(i));
  const json = JSON.parse(JSON.stringify(l.toJSON()));
  assert.doesNotThrow(() => Ledger.fromJSON(json));
  json.events[7].data.result = 'loss';
  assert.throws(() => Ledger.fromJSON(json), /integrity/);
  const j2 = JSON.parse(JSON.stringify(l.toJSON()));
  j2.events.splice(5, 1);
  assert.throws(() => Ledger.fromJSON(j2), /integrity/);
});

test('ledger queries use indexes and filters (type, participant, storyline, day range, where)', () => {
  const l = new Ledger();
  for (let i = 1; i <= 50; i++) l.append(spec(i, { participants: ['player', i % 2 ? 'a' : 'b'], storyline: i % 5 === 0 ? 'feud' : null, data: { result: i % 3 ? 'win' : 'loss', rating: i / 10 } }));
  assert.equal(l.query({ participants: ['a'] }).length, 25);
  assert.equal(l.query({ storyline: 'feud' }).length, 10);
  assert.equal(l.query({ fromDay: 10, toDay: 19 }).length, 10);
  assert.equal(l.query({ types: ['match_result'], where: { 'data.result': 'loss', 'data.rating': { gte: 3 } } }).length, l.events.filter((e) => e.data.result === 'loss' && e.data.rating >= 3).length);
  assert.equal(l.query({ limit: 3 }).length, 3);
});

test('career: a debut and a match are recorded with full structured fields', () => {
  const c = newCareer(1);
  debut(c);
  const r = fight(c, 'rookie');
  const ev = r.event;
  for (const f of ['id', 'key', 'day', 'date', 'category', 'type', 'participants', 'where', 'storyline', 'action', 'outcome', 'consequences', 'relationships', 'stats', 'refs', 'summary', 'data']) assert.ok(f in ev, `missing ${f}`);
  assert.equal(ev.type, 'match_result');
  assert.equal(ev.data.result, r.result);
  assert.ok(ev.summary.includes('Test Hero'));
  assert.equal(c.stats.s.matches, 1);
  assert.equal(c.stats.s.wins + c.stats.s.losses + c.stats.s.draws, 1);
});

test('idempotency: recording the same match key twice never double-counts stats, relationships or achievements', () => {
  const c = newCareer(2);
  debut(c);
  const r = fight(c, 'rookie');
  const before = JSON.stringify([c.stats.s, c.memory.world.relationships, c.achievements.unlocked, c.memory.ledger.size]);
  const again = c.record({ ...r.event, key: r.event.key, id: undefined });
  assert.equal(again.duplicate, true);
  const after = JSON.stringify([c.stats.s, c.memory.world.relationships, c.achievements.unlocked, c.memory.ledger.size]);
  assert.equal(before, after);
  // the engine result can also be re-submitted safely
  const st = r.engine;
  const rr = c.recordMatch(st, makeBooking(c, [opp('rookie')], { matchId: r.event.data.matchId, show: 'NXT' }));
  assert.equal(rr.duplicate, true);
  assert.equal(c.stats.s.matches, 1);
});

test('save/reload: ledger, world, stats and achievements survive and re-derive identically', () => {
  const c = newCareer(3);
  debut(c);
  for (let i = 0; i < 12; i++) { fight(c, i % 2 ? 'tech' : 'rookie'); c.advanceDays(7); }
  const json = JSON.parse(JSON.stringify(c.toJSON()));
  const d = Career.fromJSON(json);
  assert.equal(d.memory.ledger.size, c.memory.ledger.size);
  assert.deepEqual(d.stats.s, c.stats.s);
  assert.deepEqual(Object.keys(d.achievements.unlocked).sort(), Object.keys(c.achievements.unlocked).sort());
  assert.deepEqual(d.memory.world, c.memory.world);
  assert.equal(d.memory.ledger.head, c.memory.ledger.head);
  // continuing after reload does not re-award anything
  const unlockedBefore = Object.keys(d.achievements.unlocked).length;
  for (const ev of d.memory.ledger.events.slice(-5)) d.achievements.processEvent(ev);
  assert.equal(Object.keys(d.achievements.unlocked).length, unlockedBefore);
});

test('world state can be rebuilt purely from the ledger (the ledger is authoritative)', () => {
  const c = newCareer(4);
  debut(c);
  c.record({ key: 'p1', category: 'promo', type: 'promo_delivered', participants: ['player', 'brawler'], summary: 'insult', data: { tone: 'insult', targets: ['brawler'], quality: 60, line: 'You are nothing', promises: [{ kind: 'win_match', target: 'brawler', text: 'I will beat you' }] } });
  for (let i = 0; i < 6; i++) fight(c, 'brawler');
  c.record({ key: 'b1', category: 'relationship', type: 'betrayal', participants: ['player', 'tech'], summary: 'betrayed tech', data: { context: 'tag_partner', byPlayer: true } });
  const replayed = c.memory.replayWorld();
  assert.deepEqual(replayed.relationships, c.memory.world.relationships);
  assert.deepEqual(replayed.rivalries, c.memory.world.rivalries);
  assert.deepEqual(replayed.promises, c.memory.world.promises);
  assert.deepEqual(replayed.obligations, c.memory.world.obligations);
});

test('memory consequence: humiliating a wrestler creates heat, a rivalry and a pending backstage confrontation', () => {
  const c = newCareer(5);
  debut(c);
  const { event } = c.record({ key: 'p2', category: 'promo', type: 'promo_delivered', participants: ['player', 'tech'], summary: 'humiliated Adrian', importance: 3, data: { tone: 'humiliate', targets: ['tech'], quality: 80, line: 'You are a joke.' } });
  const rel = getRel(c.memory.world, 'tech', 'player');
  assert.ok(rel.heat > 10);
  assert.ok(rel.tags.includes('humiliated_by'));
  assert.ok(c.memory.rivalry('player', 'tech').heat > 5);
  const ob = c.memory.world.obligations.find((o) => o.kind === 'confront_backstage');
  assert.ok(ob, 'confrontation obligation expected');
  assert.equal(ob.from, 'tech');
  assert.equal(ob.source, event.id);
  assert.ok(ob.dueDay > c.day);
  assert.equal(ob.quote, 'You are a joke.');
});

test('betrayal is never forgotten: trust is capped for years, even after new seasons and unrelated events', () => {
  const c = newCareer(6);
  debut(c);
  c.record({ key: 'ally', category: 'relationship', type: 'alliance_formed', participants: ['player', 'tech'], summary: 'allied', data: {} });
  const rel0 = getRel(c.memory.world, 'tech', 'player');
  const i = rel0.a === 'tech' ? 0 : 1;
  assert.ok(rel0.trust[i] >= 15);
  const b = c.record({ key: 'betray', category: 'relationship', type: 'betrayal', participants: ['player', 'tech'], summary: 'Player betrays Adrian', importance: 5, data: { context: 'tag_partner', byPlayer: true } });
  c.advanceDays(365 * 3);
  for (let k = 0; k < 20; k++) { c.record({ key: `many${k}`, category: 'relationship', type: 'respect_shown', participants: ['player', 'tech'], summary: 'respect', data: {} }); }
  const rel = getRel(c.memory.world, 'tech', 'player');
  assert.ok(rel.tags.includes('betrayal'));
  assert.ok(rel.trust[rel.a === 'tech' ? 0 : 1] <= -20, 'victim trust stays capped below -20');
  assert.equal(betrayalsBetween(c.memory.world, 'player', 'tech')[0].event, b.event.id);
  // facts are retrievable
  const facts = c.memory.facts('player', 'tech');
  assert.ok(facts.some((f) => f.kind === 'betrayal'));
  const recalled = c.memory.recall({ participants: ['player', 'tech'], limit: 3 });
  assert.equal(recalled[0].event.id, b.event.id, 'the betrayal ranks first in recall');
  // reconciliation lifts the cap
  c.record({ key: 'recon', category: 'relationship', type: 'reconciliation', participants: ['player', 'tech'], summary: 'made peace', data: { formerRival: true } });
  assert.equal(getRel(c.memory.world, 'tech', 'player').betrayalCeiling, null);
});

test('broken promises: a failed Royal Rumble guarantee is remembered and judged by rules, not narration', () => {
  const c = newCareer(7);
  debut(c);
  c.record({ key: 'guarantee', category: 'promo', type: 'promise_made', participants: ['player'], summary: 'I guarantee I win the Rumble', importance: 4, data: { promiseId: 'rumble26', kind: 'win_rumble', params: { year: 2025 }, text: 'I will win the Royal Rumble' } });
  assert.equal(c.memory.world.promises[0].status, 'open');
  const r = c.record({ key: 'rumble25', category: 'career', type: 'rumble_result', summary: 'Eliminated in the Rumble', data: { year: 2025, won: false, eliminations: 2, survivalSec: 900, entryNumber: 12 } });
  assert.equal(c.memory.world.promises[0].status, 'broken');
  assert.equal(c.memory.world.promises[0].resolvedEvent, r.event.id);
  assert.ok(r.extra.some((e) => e.type === 'promise_broken'));
  assert.equal(c.memory.ledger.query({ types: ['promise_broken'] }).length, 1);
  assert.ok(c.achievements.unlocked.promise_broken_1);
});

test('repeated clean victories make opponents study the player and then become reluctant', () => {
  const c = newCareer(8, { attrs: { power: 85, striking: 85, grappling: 85, technical: 85, agility: 85, endurance: 85, toughness: 85, psychology: 85 } });
  debut(c);
  for (let i = 0; i < 40 && !c.memory.world.flags['studied:rookie>player']; i++) { fight(c, 'rookie', {}, 'smart'); c.advanceDays(3); }
  const flag = c.memory.world.flags['studied:rookie>player'];
  assert.ok(flag, 'opponent should have studied the player after 3 clean defeats');
  const rel = getRel(c.memory.world, 'rookie', 'player');
  assert.ok(rel.tags.includes('studying_you'));
  // the engine applies it: the studied opponent counters the player's favourite category
  const booking = makeBooking(c, [opp('rookie')], {});
  const { createEngine } = awaitImportBooking();
  const e = createEngine(c, booking, { human: [] });
  assert.equal(e.state.fighters.rookie.studiedPlayer, true);
  assert.equal(e.state.fighters.rookie.tactics.studyCat, flag.topCategory);
});
import * as _booking from '../src/career/booking.js';
function awaitImportBooking() { return _booking; }

test('summaries are traceable to ledger events and stay consistent with the ledger', () => {
  const c = newCareer(9);
  debut(c);
  for (let i = 0; i < 8; i++) fight(c, 'tech');
  c.record({ key: 'ins', category: 'promo', type: 'promo_delivered', participants: ['player', 'tech'], summary: 'insult', data: { tone: 'insult', targets: ['tech'], quality: 50 } });
  const names = { player: 'Test Hero', tech: 'Adrian Vale' };
  const sum = c.memory.summary('player', 'tech', (x) => names[x]);
  assert.ok(sum.facts.length >= 2);
  for (const f of sum.facts) assert.ok(f.eventIds.length > 0);
  assert.deepEqual(c.memory.validateSummaries(), []);
  // forge a claim: validation must catch it
  const forged = JSON.parse(JSON.stringify(sum));
  forged.facts.find((f) => f.kind === 'h2h').matches = 99;
  assert.ok(validateSummary(c.memory, forged).length > 0);
  forged.facts[0].eventIds = ['E999999'];
  assert.ok(validateSummary(c.memory, forged).some((p) => p.includes('missing event')));
});

test('championship history never contradicts match results (stats recompute equals live projection)', () => {
  const c = newCareer(10);
  debut(c);
  for (let i = 0; i < 25; i++) { fight(c, ['rookie', 'tech', 'brawler'][i % 3]); c.advanceDays(5); }
  const re = recomputeStats(c.memory.ledger, c.player.id);
  assert.deepEqual(re.s, c.stats.s);
  const s = c.stats.s;
  assert.equal(s.matches, 25);
  assert.equal(s.wins + s.losses + s.draws, 25);
  assert.equal(inspectStat(c.memory.ledger, 'wins').length, s.wins);
  assert.equal(inspectStat(c.memory.ledger, 'losses').length, s.losses);
  assert.equal(inspectStat(c.memory.ledger, 'matches').length, s.matches);
  const opponentTotal = Object.values(s.opponents).reduce((a, b) => a + b.matches, 0);
  assert.equal(opponentTotal, 25);
});

test('long careers: significant events remain retrievable among thousands of recorded actions', () => {
  const c = newCareer(11);
  debut(c);
  const marker = c.record({ key: 'marker', category: 'relationship', type: 'betrayal', participants: ['player', 'sub'], summary: 'Player betrayed Dmitri Sable in year one', importance: 5, data: { context: 'faction', byPlayer: true } });
  for (let i = 0; i < 4000; i++) c.record({ key: `noise${i}`, category: 'media', type: 'social_post', participants: ['player'], summary: `post ${i}`, importance: 1, data: { viral: false }, day: 1 + (i % 1500) });
  assert.ok(c.memory.ledger.size > 4000);
  const t0 = performance.now();
  const rec = c.memory.recall({ participants: ['player', 'sub'], limit: 3 });
  const dt = performance.now() - t0;
  assert.equal(rec[0].event.id, marker.event.id);
  assert.ok(dt < 50, `recall took ${dt}ms`);
  assert.deepEqual(c.memory.ledger.verify().ok, true);
});
