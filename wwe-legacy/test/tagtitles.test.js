import test from 'node:test';
import assert from 'node:assert/strict';
import { AutoGame } from './autogame.js';
import { PROFILES, decideFor } from '../src/match/ai.js';
import { audit } from '../tools/careersim.js';

function newGame(seed) {
  const g = new AutoGame();
  g.newCareer({ seed, name: 'Tag Tester', startYear: 2024, background: 'established', style: 'brawler', bonus: {}, signatures: [], finisher: { tpl: 'fin_ddt', name: 'T' } });
  return g;
}
function toShowDay(g) {
  let n = 0;
  while (n++ < 60) { const ev = g.nextEvent(); if (ev.day === g.career.day && !g.rumbleAvailable()) return; g.advanceToNextEvent(); if (g.career.day === ev.day && g.rumbleAvailable()) { g.career.advanceDays(1); g._universeTick(); } }
}
function play(g, strat = 'strong') {
  let n = 0;
  while (!g.engine.over && n++ < 3000) { const d = g.decision(); if (!d) break; g.choose(decideFor(g.engine.state, d, PROFILES[strat])); }
  return g.finishMatch();
}
function tagTitleOf(g) { return g.universe.titlesList('tag').find((t) => g._titleApplies(t) && t.holder); }

test('the universe has tag titles held by two different wrestlers, with sane lineage', () => {
  const g = newGame(3);
  const tags = g.universe.titlesList('tag');
  assert.ok(tags.length >= 2);
  for (const t of tags) { assert.ok(t.holder && t.holder2 && t.holder !== t.holder2, t.name); }
  assert.deepEqual(g.universe.lineageProblems(), []);
});

test('challenging for tag gold books a tag match with the champion pair, and winning makes the player and partner co-champions', () => {
  let won = null;
  for (let seed = 1; seed <= 25 && !won; seed++) {
    const g = newGame(seed);
    toShowDay(g);
    const t = tagTitleOf(g);
    if (!t) continue;
    const booking = g.prepareMatch({ opponentId: t.holder, stakes: 'title', type: 'tag' });
    assert.equal(booking.type, 'tag');
    assert.equal(booking.title.cls, 'tag');
    assert.equal(booking.opponentPartners[0].id, t.holder2, 'the champion pair fights together');
    assert.ok(!booking.partners.some((p) => p.id === t.holder2), 'the player cannot partner with the champion');
    g.startMatch();
    const res = play(g, 'strong');
    if (res.titleOutcome === 'won') won = { g, partner: booking.partners[0].id, titleId: t.id };
    assert.deepEqual(audit(g), []);
  }
  assert.ok(won, 'a tag title win should be possible within 25 tries');
  const { g, partner, titleId } = won;
  const t = g.universe.titles[titleId];
  assert.equal(t.holder, g.career.player.id);
  assert.equal(t.holder2, partner);
  assert.deepEqual(g.universe.lineageProblems(), []);
  const ev = g.career.memory.ledger.ofType('title_win').find((e) => e.data.titleClass === 'tag');
  assert.equal(ev.data.partner, partner);
  assert.equal(g.universe.titlesOf(partner).length >= 1, true, 'the partner is a champion too');
});

test('a tag champion defends with the title partner against a challenger', () => {
  let ok = false;
  for (let seed = 1; seed <= 25 && !ok; seed++) {
    const g = newGame(seed);
    toShowDay(g);
    const t = tagTitleOf(g);
    if (!t) continue;
    const mate = g.universe.get(t.holder2);
    g.universe.setChampion(t.id, g.career.player.id, g.career.day, { partner: mate.id }); // staged: no ledger event, so the audit is skipped here
    t.lastDefenseDay = g.career.day - 40;
    const card = g.suggestOpponents().find((o) => o.title && o.title.id === t.id && o.defense);
    if (!card) continue;
    const booking = g.prepareMatch({ opponentId: card.id, stakes: 'title', type: 'tag' });
    assert.equal(booking.partners[0].id, mate.id, 'defending champions team with their title partner');
    g.startMatch();
    const res = play(g, 'strong');
    assert.ok(['retained', 'lost'].includes(res.titleOutcome));
    assert.deepEqual(g.universe.lineageProblems(), []);
    ok = true;
  }
  assert.ok(ok);
});

test('AI simulation defends and changes tag titles without breaking lineage', async () => {
  const { Career } = await import('../src/career/career.js');
  const { Universe } = await import('../src/universe/universe.js');
  const { UniverseSim } = await import('../src/universe/sim.js');
  const c = new Career({ seed: 9, startYear: 2024, player: { id: 'player', name: 'P' } });
  c.universe = Universe.create({ seed: 9, mode: 'historical', year: 2024 });
  const sim = new UniverseSim(c);
  sim.advanceTo(365 * 2);
  assert.ok(sim.stats.tagTitleMatches > 10, `tag title matches: ${sim.stats.tagTitleMatches}`);
  assert.deepEqual(c.universe.lineageProblems(), []);
  for (const t of c.universe.titlesList('tag')) assert.ok(t.reigns.length >= 1);
});
