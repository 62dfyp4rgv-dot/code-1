// Career simulator: plays whole careers through the same Game API the UI uses, with a chosen
// strategy, then audits invariants (ledger chain, replayable world, derivable stats and achievements,
// title lineage). Used by the Gauntlet, the long-term tests and ad-hoc balance checks.
import { Game } from '../src/game.js';
import { PROFILES, decideFor } from '../src/match/ai.js';
import { Rng } from '../src/core/rng.js';
import { recomputeStats } from '../src/career/stats.js';
import { SCENARIO_TEMPLATES } from '../src/story/scenarios/index.js';
import { ACHIEVEMENT_DEFS } from '../src/achievements/defs.js';
import { AchievementEngine } from '../src/achievements/engine.js';
import { CareerStats } from '../src/career/stats.js';
import { eraForYear } from '../src/data/eras.js';

const TRAIN_ORDER = ['technical', 'psychology', 'endurance', 'power', 'striking', 'grappling', 'agility', 'toughness', 'mic', 'charisma'];

export const STRATEGIES = {
  smart: { match: 'smart', scenario: 'balanced', rumble: 'smart', train: true },
  average: { match: 'average', scenario: 'random', rumble: 'average', train: true },
  weak: { match: 'weak', scenario: 'random', rumble: 'weak', train: false },
  random: { match: 'random', scenario: 'random', rumble: 'random', train: true },
  aggressive: { match: 'aggressive', scenario: 'bold', rumble: 'average', train: true },
  noFinisher: { match: 'noFinisher', scenario: 'balanced', rumble: 'smart', train: true },
};

function pickScenarioChoice(inst, mode, rng) {
  const ok = inst.choices.filter((c) => c.enabled);
  if (mode === 'random') return rng.pick(ok).id;
  if (mode === 'bold') return (ok.find((c) => c.risk === 'high') || rng.pick(ok)).id;
  return (ok.find((c) => c.risk === 'low' || c.risk === 'med') || rng.pick(ok)).id;
}

export function playMatchHeadless(g, strat) {
  let guard = 0;
  while (!g.engine.over && guard++ < 3000) {
    const d = g.decision();
    if (!d) break;
    const choice = decideFor(g.engine.state, d, PROFILES[strat.match]);
    g.choose(choice);
  }
  if (!g.engine.over) throw new Error('match did not finish');
}

function playRumbleHeadless(g, strat) {
  let n = 0;
  const prof = strat.rumble;
  while (!g.rumble.over && n++ < 600) {
    const d = g.rumble.getDecision();
    const opts = d.options.filter((o) => o.enabled !== false);
    const me = g.rumble.state.fighters[g.c.player.id];
    let pick;
    if (prof === 'random') pick = opts[Math.floor(((n * 2654435761) >>> 0) % opts.length)];
    else if (d.kind === 'danger') pick = opts.find((o) => o.id === 'hold') || opts[0];
    else if (d.kind === 'team') pick = opts[0];
    else if (me.stamina < me.max * (prof === 'smart' ? 0.45 : 0.25)) pick = opts.find((o) => o.id === 'recover') || opts[0];
    else pick = opts.filter((o) => o.p).sort((a, b) => b.p - a.p)[0] || opts[0];
    g.rumbleChoose(pick.id);
  }
}

/** Play a career. Returns a report with metrics and invariant audit results. */
export function playCareer({ seed = 1, years = 3, strategy = 'smart', startYear = 2024, background = 'prospect', style = 'allrounder', maxMatches = 400, gender = 'M', mode } = {}) {
  const t0 = performance.now();
  const strat = STRATEGIES[strategy];
  const g = new Game();
  const c = g.newCareer({ seed, name: `Sim ${strategy} ${seed}`, startYear, background, style, gender, mode, bonus: { technical: 5, psychology: 5 }, signatures: [], finisher: { tpl: 'fin_ddt', name: 'Sim Finisher' } });
  const rng = new Rng(`sim:${seed}:${strategy}`);
  const endDay = Math.round(years * 365);
  const errors = [];
  const rep = { seed, strategy, startYear, matches: 0, scenarios: 0, scenarioIds: {}, rumbles: 0, titleWins: 0, titleDefenses: 0, posts: 0, trained: 0, rested: 0 };
  let steps = 0;
  const resolvePending = () => {
    let guard = 0;
    while (c.flags.scenario && guard++ < 20) {
      const inst = c.flags.scenario;
      rep.scenarios++; rep.scenarioIds[inst.templateId] = (rep.scenarioIds[inst.templateId] || 0) + 1;
      g.resolveScenario(pickScenarioChoice(inst, strat.scenario, rng));
    }
  };
  try {
    while (c.day < endDay && !c.flags.retired && steps++ < 4000 && rep.matches < maxMatches) {
      resolvePending();
      const ev = g.nextEvent();
      if (!ev) break;
      if (ev.day > c.day) {
        // use spare days: train (smart) or rest when tired
        const gap = ev.day - c.day;
        for (let i = 0; i < Math.min(gap - 1, 3) && c.day < endDay; i++) {
          resolvePending();
          if (strat.train && c.player.fatigue < 55 && !c.player.injuries.some((x) => x.daysLeft > 0 && x.severity > 1)) { g.train(TRAIN_ORDER[(rep.trained + seed) % TRAIN_ORDER.length]); rep.trained++; }
          else { g.rest(); rep.rested++; }
          if (c.day >= ev.day) break;
        }
        resolvePending();
        if (c.day < ev.day) g.advanceToNextEvent();
        resolvePending();
        continue;
      }
      // show day
      if (g.rumbleAvailable()) {
        g.startRumble();
        playRumbleHeadless(g, strat);
        g.finishRumble(); rep.rumbles++;
        continue;
      }
      const opps = g.suggestOpponents();
      if (!opps.length) { g.advanceToNextEvent(); c.advanceDays(1); g._universeTick(); continue; }
      const pick = opps.find((o) => o.forced) || opps.find((o) => o.stakes === 'title') || opps[0];
      g.prepareMatch({ opponentId: pick.id, stakes: pick.stakes || null, type: pick.type || 'singles', plan: 'balanced' });
      g.startMatch();
      playMatchHeadless(g, strat);
      const res = g.finishMatch();
      rep.matches++;
      if (res.titleOutcome === 'won') rep.titleWins++;
      if (res.titleOutcome === 'retained') rep.titleDefenses++;
      const opts = g.postMatchOptions();
      if (opts.length && strat.scenario !== 'none') { try { g.postMatchChoose(rng.pick(opts).id); rep.posts++; } catch (e) { /* option may be unaffordable */ } }
      g.endPostMatch();
    }
  } catch (e) { errors.push(`${e.message} @day ${c.day}`); rep.crash = e.stack.split('\n').slice(0, 3).join(' | '); }
  rep.days = c.day; rep.years = +(c.day / 365).toFixed(2);
  const s = c.stats.s;
  Object.assign(rep, {
    wins: s.wins, losses: s.losses, draws: s.draws, titlesWon: s.titles.won, defenses: s.titles.defenses, bestStreak: s.streak.bestWin, avgRating: +(c.stats.avgRating).toFixed(2),
    popularity: Math.round(c.player.popularity), overall: c.overall(), money: c.player.money, events: c.memory.ledger.size, achievements: Object.keys(c.achievements.unlocked).length,
    injuries: s.injuries, retired: !!c.flags.retired, rumbleWins: s.rumble.wins, promos: s.promos,
  });
  rep.ms = Math.round(performance.now() - t0);
  rep.audit = audit(g);
  rep.errors = errors;
  rep.game = g;
  return rep;
}

/** Integrity invariants: everything derived must agree with the authoritative ledger. */
export function audit(g) {
  const c = g.career, problems = [];
  const ok = (cond, msg) => { if (!cond) problems.push(msg); };
  const v = c.memory.ledger.verify();
  ok(v.ok, `ledger chain: ${v.reason}`);
  const re = recomputeStats(c.memory.ledger, c.player.id);
  ok(JSON.stringify(re.s) === JSON.stringify(c.stats.s), 'live stats differ from recomputed stats');
  const w = c.memory.replayWorld();
  ok(JSON.stringify(w.relationships) === JSON.stringify(c.memory.world.relationships), 'relationships differ from ledger replay');
  ok(JSON.stringify(w.rivalries) === JSON.stringify(c.memory.world.rivalries), 'rivalries differ from ledger replay');
  ok(JSON.stringify(w.promises) === JSON.stringify(c.memory.world.promises), 'promises differ from ledger replay');
  ok(JSON.stringify(w.obligations.map((o) => [o.id, o.status])) === JSON.stringify(c.memory.world.obligations.map((o) => [o.id, o.status])), 'obligations differ from ledger replay');
  const lp = g.universe.lineageProblems();
  ok(!lp.length, `title lineage: ${lp.slice(0, 2).join('; ')}`);
  // every achievement unlock has evidence in the ledger and is derivable
  const stats = new CareerStats(c.player.id);
  let year = c.startYear;
  const replay = AchievementEngine.rebuildUnlocks(ACHIEVEMENT_DEFS.filter((d) => !d.id.startsWith('meta_')), c.memory, {
    reset() { stats.s = new CareerStats(c.player.id).s; }, apply(ev) { stats.apply(ev); year = parseInt(ev.date.slice(0, 4), 10); }, current() { return { stats, era: eraForYear(year).id, year }; },
  });
  const live = Object.keys(c.achievements.unlocked).filter((k) => !k.startsWith('meta_'));
  const missingInReplay = live.filter((k) => !replay[k]);
  ok(!missingInReplay.length, `achievements not derivable from ledger: ${missingInReplay.join(',')}`);
  for (const u of Object.values(c.achievements.unlocked)) ok(u.evidence.every((id) => c.memory.ledger.get(id)), `achievement ${u.id} cites missing evidence`);
  // title reigns of the player match ledger
  const pr = Object.values(g.universe.titles).flatMap((t) => t.reigns.filter((r) => r.holder === c.player.id));
  ok(pr.length === c.stats.s.titles.won, `player reigns ${pr.length} != title_win events ${c.stats.s.titles.won}`);
  // numeric sanity
  const p = c.player;
  ok(p.popularity >= 0 && p.popularity <= 100 && p.fatigue >= 0 && p.fatigue <= 100 && p.confidence >= 0 && p.confidence <= 100, 'player meters out of range');
  for (const k of Object.keys(p.attrs)) ok(p.attrs[k] >= 1 && p.attrs[k] <= 99.5, `attribute ${k} out of range: ${p.attrs[k]}`);
  ok(Number.isFinite(p.money), 'money is not finite');
  return problems;
}

if (process.argv[1] && process.argv[1].endsWith('careersim.js')) {
  const years = +process.argv[2] || 2, n = +process.argv[3] || 2;
  for (const strategy of ['smart', 'weak']) for (let i = 1; i <= n; i++) {
    const r = playCareer({ seed: 100 + i, years, strategy });
    const { game, scenarioIds, ...show } = r;
    console.log(JSON.stringify({ ...show, scenarioKinds: Object.keys(scenarioIds).length }));
  }
}
