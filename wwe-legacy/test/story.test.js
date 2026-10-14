import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playCareer } from '../tools/careersim.js';

test('storySoFar: every line cites a real ledger event and threads are about people the player has history with', () => {
  const g = playCareer({ years: 1, strategy: 'smart', seed: 33 }).game;
  const st = g.storySoFar();
  const L = g.career.memory.ledger;
  assert.ok(st.threads.length >= 1, 'a year of play should leave at least one thread');
  for (const t of st.threads) {
    assert.ok(t.lines.length);
    for (const l of t.lines) assert.ok(L.get(l.eventId), `thread line cites missing event ${l.eventId}`);
  }
  for (const m of st.moments) assert.ok(L.get(m.id));
  for (const p of st.promises) assert.ok(L.get(p.made));
  assert.ok(st.threads.length <= 5 && st.moments.length <= 5);
});

import { postToSocial, socialFeed, socialOptions, followersOf, fanMood, POST_TONES } from '../src/story/social.js';
import { newCareer, fight, debut } from './helpers2.js';

test('social: posting writes one ledger event, enforces the cooldown, and the feed only cites real events', () => {
  const c = newCareer(9); debut(c); fight(c, 'rookie');
  const before = c.stats.s.socialPosts;
  const r = postToSocial(c, { tone: 'gratitude' });
  assert.equal(c.stats.s.socialPosts, before + 1);
  assert.ok(r.likes > 0 && r.quality >= 5 && r.quality <= 99);
  assert.ok(c.memory.ledger.get(r.event.id));
  assert.throws(() => postToSocial(c, { tone: 'hype' }), /already posted/);
  c.advanceDays(1);
  for (let i = 0; i < 3; i++) { postToSocial(c, { tone: 'training' }); c.advanceDays(1); }
  assert.throws(() => postToSocial(c, { tone: 'behind' }), /log off/);
  const feed = socialFeed(c, { limit: 20 });
  assert.ok(feed.length >= 3);
  for (const it of feed) { assert.ok(it.refs.length); for (const id of it.refs) assert.ok(c.memory.ledger.get(id), `feed item cites missing ${id}`); assert.ok(!/\{|\}|undefined/.test(it.text), it.text); }
  assert.ok(feed.some((x) => x.kind === 'player'));
});

test('social: a callout needs a target and raises heat and rivalry through the rules engine', () => {
  const c = newCareer(10); debut(c); fight(c, 'brawler');
  assert.throws(() => postToSocial(c, { tone: 'callout' }), /needs a target/);
  const heatBefore = (c.memory.world.rivalries || {});
  const target = 'brawler';
  const r = postToSocial(c, { tone: 'callout', targetId: target });
  assert.ok(r.event.data.targets.includes(target));
  const rv = Object.values(c.memory.world.rivalries).find((x) => x.a === target || x.b === target);
  assert.ok(rv && rv.heat > 0);
  assert.ok(followersOf(c.player) > 1000 && fanMood(c).label);
  assert.ok(Object.keys(POST_TONES).length >= 8 && heatBefore);
});

test('social: world replay from the ledger equals the live world (posting is replay-safe)', () => {
  const c = newCareer(11); debut(c); fight(c, 'brawler');
  postToSocial(c, { tone: 'mock', targetId: 'brawler' });
  assert.equal(JSON.stringify(c.memory.replayWorld()), JSON.stringify(c.memory.world));
});
