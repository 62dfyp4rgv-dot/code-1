import test from 'node:test';
import assert from 'node:assert/strict';
import { SaveManager, MemoryAdapter, makeEnvelope, openEnvelope, codec, migrateCareerJSON, MIGRATIONS } from '../src/save/save.js';
import { Career } from '../src/career/career.js';
import { buildRecordBook, inspectItem } from '../src/career/recordbook.js';
import { newCareer, debut, fight } from './helpers2.js';

function playedCareer(seed = 31, n = 15) {
  const c = newCareer(seed);
  debut(c);
  for (let i = 0; i < n; i++) { fight(c, ['rookie', 'tech', 'brawler'][i % 3]); c.advanceDays(6); }
  return c;
}

test('codec round-trips text (compressed when available)', async () => {
  const text = JSON.stringify({ a: 'x'.repeat(5000), b: [1, 2, 3] });
  const enc = await codec.encode(text);
  assert.ok(enc.length < text.length / 3, 'compressible');
  assert.equal(await codec.decode(enc), text);
});

test('save then load restores an equivalent career (ledger, stats, achievements, player)', async () => {
  const c = playedCareer();
  const sm = new SaveManager(new MemoryAdapter());
  const info = await sm.save('slot1', c, { label: 'test' });
  assert.ok(info.bytes > 100);
  const { career: d, recovered } = await sm.load('slot1');
  assert.equal(recovered, false);
  assert.equal(d.memory.ledger.head, c.memory.ledger.head);
  assert.deepEqual(d.stats.s, c.stats.s);
  assert.deepEqual(d.player, c.player);
  assert.deepEqual(Object.keys(d.achievements.unlocked), Object.keys(c.achievements.unlocked));
  assert.equal(d.day, c.day);
  const book1 = JSON.stringify(buildRecordBook(c)); const book2 = JSON.stringify(buildRecordBook(d));
  assert.equal(book1, book2, 'record book identical after reload');
  // the reloaded career keeps playing deterministically from the saved RNG state
  const x = fight(c, 'tech'); const y = fight(d, 'tech');
  assert.equal(x.event.data.finish, y.event.data.finish);
  assert.equal(x.event.data.durationSec, y.event.data.durationSec);
});

test('multiple slots are independent and listable with metadata', async () => {
  const a = playedCareer(41, 5), b = playedCareer(42, 9);
  const sm = new SaveManager(new MemoryAdapter());
  await sm.save('slot1', a); await sm.save('slot2', b); await sm.autosave(a);
  const list = await sm.list();
  assert.equal(list.length, 4);
  assert.equal(list.find((s) => s.slot === 'slot1').matches, 5);
  assert.equal(list.find((s) => s.slot === 'slot2').matches, 9);
  assert.equal(list.find((s) => s.slot === 'slot3').empty, true);
  assert.ok(list.find((s) => s.slot === 'auto').ok);
  await sm.delete('slot2');
  assert.equal((await sm.list()).find((s) => s.slot === 'slot2').empty, true);
  await assert.rejects(() => sm.load('slot3'), /empty/);
  await assert.rejects(() => sm.save('nope', a), /unknown slot/);
});

test('corrupted or tampered saves are detected; the previous good save is recovered', async () => {
  const c = playedCareer(43, 6);
  const ad = new MemoryAdapter();
  const sm = new SaveManager(ad);
  await sm.save('slot1', c);
  c.advanceDays(1); fight(c, 'tech');
  await sm.save('slot1', c); // previous becomes .bak
  // corrupt the primary
  const raw = await ad.get('wwel:slot1');
  await ad.set('wwel:slot1', raw.slice(0, raw.length - 40) + 'AAAA');
  const { career, recovered } = await sm.load('slot1');
  assert.equal(recovered, true);
  assert.equal(career.stats.s.matches, 6);
  // tamper the payload semantically (change a result) - checksum catches it
  const env = makeEnvelope(c);
  const forged = JSON.parse(JSON.stringify(env));
  forged.payload = forged.payload.replace('"result":"win"', '"result":"loss"');
  assert.throws(() => openEnvelope(forged), /corrupted/);
  // re-checksummed forgery still fails the ledger hash chain
  const forged2 = JSON.parse(JSON.stringify(env));
  forged2.payload = forged2.payload.replace('"result":"win"', '"result":"loss"');
  const { sha256 } = await import('../src/core/util.js');
  forged2.checksum = sha256(forged2.payload).slice(0, 40);
  assert.throws(() => openEnvelope(forged2), /ledger integrity/);
  // legacy saves with the old checksum still open
  const legacy = JSON.parse(JSON.stringify(env));
  const { hash53 } = await import('../src/core/util.js');
  delete legacy.checksumAlg; delete legacy.ledgerHead; delete legacy.ledgerSize; legacy.checksum = hash53(legacy.payload);
  assert.equal(openEnvelope(legacy).stats.s.matches, c.stats.s.matches);
  // cutting events off the END of the ledger keeps the chain valid, so the stored head/count must catch it
  const cut = JSON.parse(env.payload);
  cut.memory.ledger.events = cut.memory.ledger.events.slice(0, -3);
  const forged3 = JSON.parse(JSON.stringify(env));
  forged3.payload = JSON.stringify(cut);
  forged3.checksum = sha256(forged3.payload).slice(0, 40);
  assert.throws(() => openEnvelope(forged3), /truncated|integrity/);
});

test('versioned saves: newer saves are rejected, older ones migrate through registered steps', () => {
  const c = playedCareer(44, 3);
  const j = JSON.parse(JSON.stringify(c.toJSON()));
  j.v = 99;
  assert.throws(() => migrateCareerJSON(j), /newer game version/);
  j.v = 0;
  assert.throws(() => migrateCareerJSON(j), /no migration/);
  MIGRATIONS[0] = (x) => ({ ...x, migrated: true });
  const up = migrateCareerJSON({ ...JSON.parse(JSON.stringify(c.toJSON())), v: 0 });
  assert.equal(up.v, 1); assert.equal(up.migrated, true);
  delete MIGRATIONS[0];
  assert.throws(() => openEnvelope({ format: 'something-else' }), /not a WWE Legacy save/);
});

test('mid-match saves: an in-progress match resumes exactly where it stopped', async () => {
  const { createEngine, makeBooking } = await import('../src/career/booking.js');
  const { MatchEngine } = await import('../src/match/engine.js');
  const { opp } = await import('./helpers2.js');
  const c = newCareer(45); debut(c);
  const booking = makeBooking(c, [opp('tech')], { show: 'NXT' });
  const e = createEngine(c, booking);
  for (let i = 0; i < 6 && !e.over; i++) { const d = e.getDecision(); e.choose(d.options.find((o) => o.enabled !== false).id); }
  c.pendingMatch = booking; c.activeMatch = e.toJSON();
  const sm = new SaveManager(new MemoryAdapter());
  await sm.save('slot1', c);
  const { career: d } = await sm.load('slot1');
  const e2 = new MatchEngine(d.activeMatch, { human: [d.player.id] });
  assert.equal(JSON.stringify(e2.toJSON()), JSON.stringify(e.toJSON()));
  assert.equal(d.pendingMatch.matchId, booking.matchId);
});

test('record book: every number is derived from the ledger and every headline stat opens to its evidence events', () => {
  const c = playedCareer(46, 20);
  const book = buildRecordBook(c, (id) => id);
  const sec = (id) => book.sections.find((s) => s.id === id);
  const get = (s, label) => sec(s).items.find((i) => i.label === label);
  const m = get('overview', 'Total matches');
  assert.equal(m.value, 20);
  assert.equal(inspectItem(c, m).length, 20);
  const w = get('overview', 'Wins');
  assert.equal(inspectItem(c, w).length, w.value);
  assert.ok(inspectItem(c, w).every((e) => e.data.result === 'win'));
  const l = get('overview', 'Losses');
  assert.ok(inspectItem(c, l).every((e) => e.data.result === 'loss'));
  assert.equal(m.value, w.value + l.value + get('overview', 'Draws').value);
  const longest = get('streaks', 'Longest winning streak');
  assert.equal(longest.value, c.stats.s.streak.bestWin);
  const best = get('bests', 'Highest-rated match');
  assert.ok(best.evidence.length === 1);
  const bestEv = c.memory.ledger.get(best.evidence[0]);
  const maxRating = Math.max(...c.memory.ledger.ofType('match_result').map((e) => e.data.rating));
  assert.equal(bestEv.data.rating, maxRating);
  for (const s of book.sections) for (const it of s.items) if (it.evidence) for (const id of it.evidence) assert.ok(c.memory.ledger.get(id), `${it.label} cites unknown event ${id}`);
  const ach = get('achievements', 'Unlocked');
  assert.match(String(ach.value), /\d+ \/ \d+/);
  assert.equal(Number(String(ach.value).split(' / ')[0]), Object.keys(c.achievements.unlocked).length);
});
