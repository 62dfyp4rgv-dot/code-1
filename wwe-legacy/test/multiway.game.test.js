import test from 'node:test';
import assert from 'node:assert/strict';
import { AutoGame } from './autogame.js';
import { PROFILES, decideFor } from '../src/match/ai.js';

function showDay(g) {
  let n = 0;
  while (n++ < 80) { const ev = g.nextEvent(); if (ev.day === g.career.day && !g.rumbleAvailable()) return; g.advanceToNextEvent(); if (g.career.day === ev.day && g.rumbleAvailable()) { g.career.advanceDays(1); g._universeTick(); } }
}

test('a triple threat can be booked and played through the Game facade, with all opponents recorded', () => {
  const g = new AutoGame();
  g.newCareer({ seed: 8, name: 'Multi', startYear: 2024, background: 'established', style: 'brawler', bonus: {}, signatures: [], finisher: { tpl: 'fin_ddt', name: 'M' } });
  showDay(g);
  const opp = g.suggestOpponents()[0];
  // rivalry heat unlocks the stipulation; stage it directly
  g.career.memory.world.rivalries[`rv:${[opp.id, 'player'].sort().join('|')}`] = { id: `rv:${[opp.id, 'player'].sort().join('|')}`, a: [opp.id, 'player'].sort()[0], b: [opp.id, 'player'].sort()[1], heat: 60, status: 'active', startDay: 0, origin: null, matches: 0, wins: {}, lastDay: 0, events: [] };
  const booking = g.prepareMatch({ opponentId: opp.id, type: 'triple_threat' });
  assert.equal(booking.opponents.length, 2);
  assert.throws(() => { const g2 = g; g2.career.flags.phase = 'home'; g2.prepareMatch({ opponentId: opp.id, type: 'fatal_four', stakes: 'title' }); }, /./);
  g.career.flags.phase = 'prematch';
  g.startMatch();
  const mv0 = g.matchView();
  assert.equal(mv0.ways, 3);
  assert.equal(mv0.others.length, 1);
  let n = 0;
  while (!g.engine.over && n++ < 3000) { const d = g.decision(); if (!d) break; g.choose(decideFor(g.engine.state, d, PROFILES.strong)); }
  const res = g.finishMatch();
  assert.ok(['win', 'loss'].includes(res.result));
  assert.equal(res.opponents.length, 2);
  const ev = g.career.memory.ledger.ofType('match_result').slice(-1)[0];
  assert.equal(ev.data.opponents.length, 2);
  assert.ok(g.career.memory.ledger.verify().ok); // (the rivalry was staged directly, so the world-replay audit does not apply here)
});
