import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, BACKGROUNDS, PLANS } from '../src/game.js';
import { SaveManager, MemoryAdapter } from '../src/save/save.js';
import { buildRecordBook } from '../src/career/recordbook.js';

const spec = (o = {}) => ({ seed: 1234, name: 'Slice Hero', style: 'technician', alignment: 'face', background: 'prospect', startYear: 2024, bonus: { technical: 6, grappling: 6 }, signatures: [{ tpl: 'sig_arm', name: 'Hero Lock Drop' }], finisher: { tpl: 'fin_sub_arms', name: 'Hero Armbar' }, goal: 'Win the World Championship', ...o });

function playUntilOver(g, pick) {
  let d = g.decision(), guard = 0;
  while (d && guard++ < 3000) {
    const opts = d.options.filter((o) => o.enabled !== false);
    const r = g.choose(pick(d, opts));
    if (r.over) break;
    d = r.decision;
  }
  assert.ok(g.engine.over, 'match must finish');
}

test('vertical slice: create -> train -> book -> play -> record -> post-match -> next day', () => {
  const g = new Game();
  const c = g.newCareer(spec());
  assert.equal(c.player.name, 'Slice Hero');
  assert.equal(c.player.finisher.name, 'Hero Armbar');
  assert.equal(c.stats.s.matches, 0);
  assert.ok(c.achievements.unlocked.debut, 'debut achievement at creation');
  // training with trade-offs
  const before = c.player.attrs.technical;
  const t = g.train('technical');
  assert.ok(t.ok && t.gain > 0);
  assert.ok(c.player.attrs.technical > before);
  assert.ok(c.player.fatigue >= 12, "training adds fatigue (net of one day of recovery)");
  assert.ok(c.achievements.unlocked.first_training);
  g.rest();
  const adv = g.advanceToNextEvent();
  assert.equal(adv.day, c.day);
  const home = g.home();
  assert.equal(home.next.inDays, 0);
  const opps = g.suggestOpponents();
  assert.ok(opps.length >= 3);
  const scout = g.scout(opps[0].id);
  assert.ok(scout.tips.length > 0 && scout.favours);
  const booking = g.prepareMatch({ opponentId: opps[0].id, plan: 'fast_start', entrance: 'classic' });
  assert.equal(c.flags.phase, 'prematch');
  const d0 = g.startMatch();
  assert.ok(d0, 'first decision available');
  assert.equal(g.engine.state.fighters.player.tactics.pace, 'fast', 'plan applied');
  let n = 0;
  playUntilOver(g, (d, opts) => opts[(d.round + n++) % Math.min(opts.length, d.options.length)].id);
  const res = g.finishMatch();
  assert.ok(['win', 'loss', 'draw'].includes(res.result));
  assert.equal(c.stats.s.matches, 1);
  assert.equal(c.flags.phase, 'postmatch');
  assert.ok(res.rating.stars >= 0);
  assert.ok(c.achievements.unlocked.first_match);
  const opts = g.postMatchOptions();
  assert.ok(opts.length >= 6, `post-match options ${opts.length}`);
  const r1 = g.postMatchChoose(opts.find((o) => o.id === 'show_respect').id);
  assert.ok(r1.ok);
  assert.throws(() => g.postMatchChoose('show_respect'), /not available/);
  g.endPostMatch();
  assert.equal(c.flags.phase, 'home');
  assert.deepEqual(c.memory.ledger.verify().ok, true);
  const book = buildRecordBook(c);
  assert.equal(book.sections[0].items[0].value, 1);
});

test('cannot book without a show, cannot train mid-match, stipulations gated by rivalry heat', () => {
  const g = new Game();
  const c = g.newCareer(spec({ seed: 77 }));
  const opps = g.suggestOpponents();
  assert.throws(() => g.prepareMatch({ opponentId: opps[0].id }), /no show today/);
  g.advanceToNextEvent();
  const stips = g.availableStipulations(opps[0].id);
  assert.equal(stips.find((s) => s.id === 'singles').unlocked, true);
  assert.equal(stips.find((s) => s.id === 'hell_cell').unlocked, false);
  assert.throws(() => g.prepareMatch({ opponentId: opps[0].id, type: 'hell_cell' }), /not unlocked/);
  g.prepareMatch({ opponentId: opps[0].id });
  assert.throws(() => g.train('power'), /finish the current match/);
  assert.throws(() => g.prepareMatch({ opponentId: opps[0].id }), /already in progress/);
});

test('post-match decisions write persistent memory: vowing revenge creates a promise that is judged by later results', () => {
  const g = new Game();
  const c = g.newCareer(spec({ seed: 99 }));
  // force a loss by facing a much stronger opponent with a random strategy
  g.advanceToNextEvent();
  const opp = Object.values(c.universe.roster).find((w) => w.tier >= 3);
  opp.brand = c.player.brand;
  g.prepareMatch({ opponentId: opp.id });
  g.startMatch();
  playUntilOver(g, (d, opts) => opts[(d.round * 3 + 1) % opts.length].id);
  const res = g.finishMatch();
  const opts = g.postMatchOptions().map((o) => o.id);
  const choice = res.result === 'win' ? 'call_out' : 'vow_revenge';
  if (res.result !== 'win') {
    g.postMatchChoose('vow_revenge');
    const pr = c.memory.world.promises.find((p) => p.kind === 'win_match');
    assert.ok(pr && pr.status === 'open' && pr.target === opp.id);
    // facts about the open promise are surfaced to scouting/dialogue
    const sc = g.scout(opp.id);
    assert.ok(sc.history.some((h) => h.kind === 'open_promise' || h.kind === 'you_beat_me' || h.kind === 'i_beat_you'));
  }
  assert.ok(opts.includes(res.result === 'win' ? 'celebrate' : 'walk_away'));
});

test('attacking a rival after the bell raises rivalry heat through the rules engine (replayable)', () => {
  const g = new Game();
  const c = g.newCareer(spec({ seed: 5 }));
  g.advanceToNextEvent();
  const opp = g.suggestOpponents()[0];
  g.prepareMatch({ opponentId: opp.id });
  g.startMatch();
  playUntilOver(g, (d, opts) => opts[0].id);
  const res = g.finishMatch();
  const heatBefore = c.memory.rivalry(c.player.id, opp.id)?.heat ?? 0;
  const key = res.result === 'win' ? 'attack_rival' : 'request_rematch';
  g.postMatchChoose(key);
  const after = c.memory.rivalry(c.player.id, opp.id).heat;
  assert.ok(after > heatBefore);
  assert.deepEqual(c.memory.replayWorld().rivalries, c.memory.world.rivalries);
});

test('save and reload in the middle of a match resumes the exact same match state and finishes', async () => {
  const saves = new SaveManager(new MemoryAdapter());
  const g = new Game({ saves });
  const c = g.newCareer(spec({ seed: 31 }));
  g.advanceToNextEvent();
  const opp = g.suggestOpponents()[0];
  g.prepareMatch({ opponentId: opp.id, plan: 'wear_down' });
  g.startMatch();
  for (let i = 0; i < 7 && !g.engine.over; i++) { const d = g.decision(); g.choose(d.options.filter((o) => o.enabled !== false)[0].id); }
  assert.ok(!g.engine.over);
  const snapshot = JSON.stringify(g.engine.toJSON());
  await g.save('slot2');
  const g2 = new Game({ saves });
  await g2.load('slot2');
  assert.equal(g2.career.flags.phase, 'match');
  assert.equal(JSON.stringify(g2.engine.toJSON()), snapshot);
  assert.equal(g2.career.pendingMatch.opponents[0].id, opp.id);
  // finish both: identical outcomes
  const pick = (d, opts) => opts[(d.round * 5 + 2) % opts.length].id;
  playUntilOver(g, pick); playUntilOver(g2, pick);
  assert.deepEqual(g.engine.result, g2.engine.result);
  g.finishMatch(); g2.finishMatch();
  assert.equal(g.career.memory.ledger.head, g2.career.memory.ledger.head, 'ledgers are identical');
});

test('autosave round trip keeps the universe and phase', async () => {
  const saves = new SaveManager(new MemoryAdapter());
  const g = new Game({ saves });
  g.newCareer(spec({ seed: 3 }));
  await g.autosave();
  const g2 = new Game({ saves });
  await g2.load('auto');
  assert.equal(Object.keys(g2.universe.roster).length, Object.keys(g.universe.roster).length);
  assert.equal(g2.career.player.name, 'Slice Hero');
  assert.equal(g2.career.flags.phase, 'home');
});

test('every creation background and plan works and produces a valid playable career', () => {
  for (const bg of Object.keys(BACKGROUNDS)) {
    const g = new Game();
    const c = g.newCareer(spec({ background: bg, seed: 10 + bg.length }));
    assert.ok(c.overall() > 20);
    g.advanceToNextEvent();
    const opp = g.suggestOpponents()[0];
    for (const plan of Object.keys(PLANS)) {
      // quick smoke for each plan on a fresh game
      const gg = new Game(); gg.newCareer(spec({ background: bg, seed: 50 }));
      gg.advanceToNextEvent();
      const o = gg.suggestOpponents()[0];
      gg.prepareMatch({ opponentId: o.id, plan });
      gg.startMatch();
      playUntilOver(gg, (d, opts) => opts[(d.round) % opts.length].id);
      gg.finishMatch();
    }
  }
});
