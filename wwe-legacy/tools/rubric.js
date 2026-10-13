// Rubric: turns measured metrics into 0-10 scores for the 12 Gauntlet categories.
// Every criterion has a weight, a measured value, a 0..1 score and an evidence string.
// Missing or unmeasured inputs score 0 (never assumed). Declared-but-unimplemented features score 0.
const clamp01 = (x) => Math.max(0, Math.min(1, x));
/** Linear ramp: lo -> 0, hi -> 1 (works for lower-is-better when lo > hi). */
const ramp = (v, lo, hi) => (v == null || Number.isNaN(v) ? 0 : clamp01((v - lo) / (hi - lo)));
/** Triangle: best between [a,b], falling to 0 at lo/hi. */
const band = (v, lo, a, b, hi) => (v == null ? 0 : v < a ? ramp(v, lo, a) : v > b ? ramp(v, hi, b) : 1);
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const crit = (id, label, weight, value, score, evidence = '', status = 'measured') => ({ id, label, weight, value, score: +clamp01(score).toFixed(3), evidence, status });

export const CATEGORIES = [
  'matchEngine', 'playerAgency', 'memoryConsistency', 'achievementIntegrity', 'scenarioDiversity', 'narrativeQuality',
  'universeSimulation', 'careerProgression', 'mobileUsability', 'technicalReliability', 'performance', 'replayability',
];
export const CATEGORY_LABELS = {
  matchEngine: 'Match engine', playerAgency: 'Player agency', memoryConsistency: 'Memory consistency', achievementIntegrity: 'Achievement integrity',
  scenarioDiversity: 'Scenario diversity', narrativeQuality: 'Narrative quality', universeSimulation: 'WWE universe simulation', careerProgression: 'Career progression',
  mobileUsability: 'Mobile usability', technicalReliability: 'Technical reliability', performance: 'Performance', replayability: 'Replayability',
};

export function score(M) {
  const { tests, match, career, universe, scenario, ach, ui, review, features, save } = M;
  const reps = career?.reps || [];
  const by = (s) => reps.filter((r) => r.strategy === s && r.startYear === 2024 && !r.cfg.gender && !r.cfg.background);
  const rate = (rs) => { const w = rs.reduce((a, r) => a + r.wins, 0), l = rs.reduce((a, r) => a + r.losses, 0); return w / Math.max(1, w + l); };
  const auditProblems = reps.reduce((a, r) => a + r.audit.length, 0);
  const crashes = reps.reduce((a, r) => a + r.errors.length, 0);
  const types = Object.entries(match?.types || {});
  const drawRates = types.map(([k, t]) => [k, t.draws / Math.max(1, t.n)]);
  const worstDraw = drawRates.reduce((a, b) => (b[1] > a[1] ? b : a), ['-', 0]);
  const reviewFor = (cat) => {
    const v = review?.latest?.[cat];
    return v == null ? { v: null, sc: 0 } : { v, sc: v / 10 };
  };
  const feat = (id) => features.rows.find((r) => r.id === id);
  const featScore = (id) => { const f = feat(id); return !f ? 0 : f.status === 'complete' ? 1 : f.status === 'partial' ? 0.5 : 0; };
  const featStatus = (id) => (feat(id) ? feat(id).status : 'unimplemented');
  const out = {};

  out.matchEngine = [
    crit('me_tests', 'Match engine unit/acceptance tests pass', 3, `${tests.pass}/${tests.total}`, ramp(tests.pass / Math.max(1, tests.total), 0.9, 1), 'node --test'),
    crit('me_valid', 'Every simulated match ends in a valid, rule-conformant finish', 3, types.reduce((a, [, t]) => a + t.invalid, 0), 1 - ramp(types.reduce((a, [, t]) => a + t.invalid, 0), 0, 3), `${types.reduce((a, [, t]) => a + t.n, 0)} sims across ${types.length} types`),
    crit('me_draws', 'Worst match type time-limit draw rate (lower is better)', 2.5, `${worstDraw[0]} ${(worstDraw[1] * 100).toFixed(0)}%`, ramp(worstDraw[1], 0.3, 0.08), 'time-limit draws should be rare outside iron man'),
    crit('me_finishers', 'Finishers used per singles match (target ~1)', 2, +(match.singles.finishersPerMatch).toFixed(2), band(match.singles.finishersPerMatch, 0.2, 0.8, 1.6, 3), 'finisher_* events / match'),
    crit('me_balance', 'Mirror-match side balance (no first-side bias)', 1.5, +(match.mirrorShare).toFixed(3), 1 - ramp(Math.abs(match.mirrorShare - 0.5), 0.05, 0.12), '800 mirror sims (sampling sd ~1.8%)'),
    crit('me_variety', 'Finish-type variety in singles (distinct finishes)', 1, Object.keys(match.singles.finish).length, ramp(Object.keys(match.singles.finish).length, 1, 4), 'pinfall/submission/dq/countout/...'),
    crit('me_types', 'Match-type coverage vs target list (singles, tag, sub, no-DQ, last man, iron man, ladder, cage, hell cell, triple threat, fatal four-way, rumble; chamber missing)', 2, `${types.length + (featStatus('mt_rumble') === 'complete' ? 1 : 0) + (featStatus('mt_chamber') === 'complete' ? 1 : 0)}/12`, Math.min(1, (types.length + (featStatus('mt_rumble') === 'complete' ? 1 : 0) + (featStatus('mt_chamber') === 'complete' ? 1 : 0)) / 12), 'features manifest'),
    crit('me_rating', 'Match rating spread (std of stars; shows quality varies with play)', 1, +(match.singles.ratingStd).toFixed(2), band(match.singles.ratingStd, 0.2, 0.55, 1.1, 1.8), 'rateMatch'),
    crit('me_len', 'Average singles match length (minutes, target 7-14)', 1, +(match.singles.avgMins).toFixed(1), band(match.singles.avgMins, 3, 7, 14, 24), 'simulated minutes'),
  ];

  out.playerAgency = [
    crit('pa_menu', 'Featured action options per decision within 6-12', 3, `${(match.featured.inRange * 100).toFixed(0)}% in range (mean ${match.featured.mean.toFixed(1)})`, ramp(match.featured.inRange, 0.8, 1), 'human-driven sample'),
    crit('pa_def', 'Defender options per defence decision >= 6', 2, `min ${match.defense.min}`, ramp(match.defense.min, 3, 6), 'stance menu'),
    crit('pa_decisions', 'Player decisions per singles match', 1.5, +match.decisionsPerMatch.toFixed(1), band(match.decisionsPerMatch, 6, 14, 60, 140), 'agency without drudgery'),
    crit('pa_skill_match', 'Smart play beats random play in matches (win share)', 2.5, +match.skillGap.toFixed(2), ramp(match.skillGap, 0.5, 0.85), '160 mirror-stat sims'),
    crit('pa_skill_career', 'Career win-rate: smart vs weak vs random strategies ordered with clear gaps', 2.5, `smart ${(rate(by('smart')) * 100).toFixed(0)} / avg ${(rate(by('average')) * 100).toFixed(0)} / weak ${(rate(by('weak')) * 100).toFixed(0)} / random ${(rate(by('random')) * 100).toFixed(0)}`, mean([ramp(rate(by('smart')) - rate(by('weak')), 0.02, 0.15), ramp(rate(by('weak')) - rate(by('random')), 0.05, 0.25)]), '3-year careers'),
    crit('pa_scenario_choice', 'Scenario choices carry real consequences (templates with >=2 weighted outcomes & distinct effects)', 2, `${scenario.authored} authored`, ramp(scenario.consequential ?? 0, 0.5, 0.95), 'validator: dominant/trivial choice flags'),
    crit('pa_prep', 'Pre/post-match decision surface (plans, entrances, stipulations, training options, post-match actions, promo, scenario choices)', 1.5, `${ui.prep.plans} plans / ${ui.prep.entrances} entrances / ${ui.prep.stipulations} stipulations / ${ui.prep.training} training`, mean([ramp(ui.prep.plans, 1, 4), ramp(ui.prep.entrances, 1, 4), ramp(ui.prep.stipulations, 2, 8), ramp(ui.prep.training, 3, 8), ui.prep.postMatch ? 1 : 0, ui.prep.promo ? 1 : 0, ui.prep.scenarios ? 1 : 0]), 'Game facade surface'),
  ];

  out.memoryConsistency = [
    crit('mc_tests', 'Memory tests pass', 3, `${tests.pass}/${tests.total}`, ramp(tests.pass / Math.max(1, tests.total), 0.9, 1), 'memory.test.js etc.'),
    crit('mc_audit', 'Career audits: ledger chain, world replay equals live state, no double counting', 4, `${auditProblems} problems over ${reps.length} careers`, 1 - ramp(auditProblems, 0, 2), 'tools/careersim.js audit()'),
    crit('mc_memory_driven', 'Share of scenario templates that read ledger memory (mem trigger / memory block / rivalry / obligation)', 2, +(scenario.memoryShare ?? 0).toFixed(2), ramp(scenario.memoryShare ?? 0, 0.2, 0.7), 'static template analysis'),
    crit('mc_years', 'Long-horizon retrievability: ledger events retained and verifiable after 3 simulated years', 2, `${Math.min(...reps.map((r) => r.events))}+ events`, reps.length && reps.every((r) => r.audit.length === 0) ? 1 : 0, 'verify() + replay over 3-year careers'),
    crit('mc_scenario_recall', 'Scenarios actually recalling prior events in play (share of resolved scenarios with recalled memory)', 2, +(career.recallShare ?? 0).toFixed(2), ramp(career.recallShare ?? 0, 0.05, 0.4), 'ledger scenario events with recalled refs'),
    crit('mc_review', 'Independent reviewer score', 1.5, reviewFor('memoryConsistency').v ?? 'none', reviewFor('memoryConsistency').sc, 'docs/gauntlet/reviews.json', reviewFor('memoryConsistency').v == null ? 'unverified' : 'measured'),
  ];

  out.achievementIntegrity = [
    crit('ai_count', 'Achievement definitions (target >= 150)', 1.5, ach.total, ramp(ach.total, 50, 150), 'defs.js'),
    crit('ai_prove', 'Every achievement provable by a synthesised legal event sequence', 4, `${ach.provable}/${ach.total}`, ach.provable / Math.max(1, ach.total), 'tools/prover.js'),
    crit('ai_audit', 'Live unlocks derivable from ledger with valid evidence (careers)', 3, `${auditProblems} problems`, 1 - ramp(auditProblems, 0, 2), 'audit()'),
    crit('ai_secret', 'Secret and era-gated achievements present', 1, `${ach.secret} secret / ${ach.eraGated} era-gated`, mean([ramp(ach.secret, 0, 8), ramp(ach.eraGated, 0, 6)]), 'defs'),
    crit('ai_spread', 'Achievement unlock spread across 8 careers (distinct unlocked / total)', 1.5, `${career.achievementsUnlocked.length}/${ach.total}`, ramp(career.achievementsUnlocked.length / ach.total, 0.2, 0.7), 'reachable in play, not only in theory'),
    crit('ai_recordbook', 'Record Book: every numeric stat opens to evidence events', 2, `${career.recordBookCoverage ?? 'n/a'}`, career.recordBookCoverage == null ? 0 : career.recordBookCoverage, 'inspectItem over every item', career.recordBookCoverage == null ? 'unverified' : 'measured'),
  ];

  const topShare = (() => { const v = Object.values(career.scenarioCounts); const t = v.reduce((a, b) => a + b, 0); return t ? Math.max(...v) / t : 1; })();
  out.scenarioDiversity = [
    crit('sd_authored', 'Authored, validated templates (target 2,000 would be complete)', 3, scenario.authored, ramp(scenario.authored, 100, 2000), 'authored templates reported separately from generated configs'),
    crit('sd_configs', 'Validated generated configurations (slot combinations; target >= 2,000)', 2.5, scenario.configs, ramp(scenario.configs, 500, 2000), 'validator resolves tokens for every combination'),
    crit('sd_valid', 'Validator errors/warnings (lower is better)', 2, `${scenario.errors} errors / ${scenario.warnings} warnings`, 1 - ramp(scenario.errors + scenario.warnings, 0, 3), 'scenarioValidator'),
    crit('sd_categories', 'Category breadth', 1.5, scenario.categories, ramp(scenario.categories, 8, 25), 'distinct categories'),
    crit('sd_seen', 'Distinct templates seen across 8 sample careers / authored', 2, `${Object.keys(career.scenarioCounts).length}/${scenario.authored}`, ramp(Object.keys(career.scenarioCounts).length / scenario.authored, 0.3, 0.9), 'coverage in play'),
    crit('sd_repeat', 'Most-repeated template share of all scenarios shown (lower is better)', 1.5, `${(topShare * 100).toFixed(1)}%`, ramp(topShare, 0.06, 0.015), 'repetition control'),
  ];

  out.narrativeQuality = [
    crit('nq_cover', 'Commentary covers every observed engine event type', 2.5, `${match.commentary.eventTypes} types, ${match.commentary.silent.length} silent`, 1 - ramp(match.commentary.silent.length, 0, 4), 'narrate() over 60 sims'),
    crit('nq_open', 'Scenario opener diversity', 1.5, +scenario.openerDiversity.toFixed(2), ramp(scenario.openerDiversity, 0.6, 0.95), 'first three words unique'),
    crit('nq_vocab', 'Scenario vocabulary size (distinct words)', 1.5, scenario.vocab, ramp(scenario.vocab, 800, 3500), 'authored text'),
    crit('nq_commvar', 'Commentary variety: distinct lines per 1,000 narrated events', 2.5, +(match.commentary.variety ?? 0).toFixed(0), ramp(match.commentary.variety ?? 0, 60, 300), 'repetition within and across matches'),
    crit('nq_grounded', 'Dialogue/promo claims validated against ledger (no invented history)', 2, career.promoGrounded ?? 'n/a', career.promoGrounded == null ? 0 : career.promoGrounded, 'validateLines over sampled promos', career.promoGrounded == null ? 'unverified' : 'measured'),
    crit('nq_review', 'Independent reviewer score', 3, reviewFor('narrativeQuality').v ?? 'none', reviewFor('narrativeQuality').sc, 'docs/gauntlet/reviews.json', reviewFor('narrativeQuality').v == null ? 'unverified' : 'measured'),
    crit('nq_standalone', 'Standalone interview/podcast/press flows', 1.5, featStatus('s_interview'), featScore('s_interview'), 'features manifest', featStatus('s_interview') === 'unimplemented' ? 'unimplemented' : 'measured'),
  ];

  out.universeSimulation = [
    crit('us_lineage', 'Title lineage problems after multi-year sim (target 0)', 3, universe.lineageProblems, 1 - ramp(universe.lineageProblems, 0, 2), 'lineageProblems()'),
    crit('us_det', 'Universe simulation deterministic for a given seed', 2, universe.deterministic, universe.deterministic ? 1 : 0, 'JSON equality across two runs'),
    crit('us_autonomy', 'AI autonomy: feuds, alliances, betrayals, turns, injuries per simulated year', 2.5, `${Math.round(universe.stats.b.betrayals / 3)} betrayals/yr, ${Math.round(universe.stats.b.alliances / 3)} alliances/yr`, mean([ramp(universe.stats.b.betrayals / 3, 2, 8), ramp(universe.stats.b.alliances / 3, 4, 15), ramp(universe.stats.b.turns / 3, 3, 10)]), 'sim.stats'),
    crit('us_churn', 'Roster churn: retirements and arrivals both occur', 2, `ret ${universe.stats.b.retirements + universe.stats.a.retirements} / arr ${universe.stats.b.arrivals + universe.stats.a.arrivals}`, mean([ramp(universe.stats.a.retirements + universe.stats.b.retirements, 0, 6), ramp(universe.stats.a.arrivals + universe.stats.b.arrivals, 0, 6)]), 'arrivals are required to keep a roster alive over decades'),
    crit('us_reigns', 'Title reign length plausibility (mean reigns per title per 3 years in 1.5-6)', 2, +mean(universe.reigns[1]).toFixed(1), band(mean(universe.reigns[1]), 0.5, 2, 6, 12), 'reign counts'),
    crit('us_rosters', 'Roster size in 1998 start (>= 45) and 2024 start (>= 80)', 1.5, universe.rosterSizes.join('/'), mean([ramp(universe.rosterSizes[0], 25, 45), ramp(universe.rosterSizes[1], 60, 80)]), 'active roster'),
    crit('us_history', 'Verified historical data', 2, featStatus('u_history'), featStatus('u_history') === 'complete' ? 1 : 0, 'approximate data is flagged and NOT counted as verified', featStatus('u_history') === 'complete' ? 'measured' : 'unverified'),
    crit('us_tagtitles', 'Tag-team championships', 1, featStatus('u_tagtitles'), featScore('u_tagtitles'), 'features manifest', featStatus('u_tagtitles') === 'unimplemented' ? 'unimplemented' : 'measured'),
    crit('us_factions', 'Faction mechanics', 1, featStatus('u_factions'), featScore('u_factions'), 'features manifest', featStatus('u_factions') === 'unimplemented' ? 'unimplemented' : 'measured'),
  ];

  const midPop = mean(reps.filter((r) => r.strategy !== 'random' && r.snap?.[1]).map((r) => r.snap[1].popularity));
  const smartTitles = mean(by('smart').map((r) => r.titlesWon).concat(reps.filter((r) => r.strategy === 'smart' && r.cfg.startYear === 1998).map((r) => r.titlesWon)));
  const overallGain = mean(reps.filter((r) => r.strategy === 'smart').map((r) => r.overall));
  out.careerProgression = [
    crit('cp_pop', 'Popularity pacing: mean popularity at end of year 2 for non-random strategies (not saturated)', 3, Math.round(midPop), ramp(midPop, 98, 70), 'snap[1]'),
    crit('cp_titles', 'Title wins in 3 years for smart play (target 1-5)', 2.5, +smartTitles.toFixed(1), band(smartTitles, 0, 1, 5, 14), 'championship pacing'),
    crit('cp_growth', 'Attribute growth: overall rating increases through training (smart > weak)', 2, `smart ${Math.round(mean(by('smart').map((r) => r.overall)))} vs weak ${Math.round(mean(by('weak').map((r) => r.overall)))}`, ramp(mean(by('smart').map((r) => r.overall)) - mean(by('weak').map((r) => r.overall)), 2, 15), 'overall()'),
    crit('cp_injury', 'Injuries per career-year in plausible band (3-9)', 1.5, +mean(reps.map((r) => r.injuries / r.years)).toFixed(1), band(mean(reps.map((r) => r.injuries / r.years)), 0, 3, 9, 20), 'injury events'),
    crit('cp_money', 'Money progression non-degenerate (all careers finite & positive)', 1, reps.every((r) => r.money > 0), reps.every((r) => r.money > 0) ? 1 : 0, 'player.money'),
    crit('cp_retire', 'Retirement + Hall of Fame legacy', 1.5, featStatus('c_retire'), featScore('c_retire'), 'features manifest', featStatus('c_retire') === 'unimplemented' ? 'unimplemented' : 'measured'),
    crit('cp_finance', 'Finance depth', 1, featStatus('c_finance'), featScore('c_finance'), 'features manifest'),
    crit('cp_modes', 'Historical + modern modes; custom/alt-history', 1.5, `${featStatus('u_modes')}/${featStatus('u_custom')}`, (featScore('u_modes') + featScore('u_custom')) / 2, 'features manifest'),
    crit('cp_complete', 'Careers run to completion without crash', 2, `${crashes} crashes`, 1 - ramp(crashes, 0, 1), '3-year careers'),
  ];

  const e2e = ui.e2e;
  out.mobileUsability = [
    crit('mu_e2e', 'End-to-end iPhone-viewport checks pass (headless Chromium, 390px)', 4, e2e ? `${e2e.passed}/${e2e.total}` : 'not run', e2e ? e2e.passed / e2e.total : 0, 'tools/e2e.js', e2e ? 'measured' : 'unverified'),
    crit('mu_overflow', 'No horizontal overflow on any screen', 1.5, e2e ? e2e.overflowChecks : 0, e2e && e2e.overflowChecks ? 1 : 0, 'e2e overflow checks', e2e ? 'measured' : 'unverified'),
    crit('mu_tap', 'Tap targets >= 44px audit', 2, e2e?.tapAudit ?? 'not run', e2e?.tapAudit == null ? 0 : e2e.tapAudit, 'e2e tap-target audit', e2e?.tapAudit == null ? 'unverified' : 'measured'),
    crit('mu_a11y', 'Accessibility features: 4 text sizes, 3 themes, safe-area insets, reduced motion', 1.5, `${ui.textSizes} sizes / ${ui.themes} themes`, ui.a11y ? 1 : 0.6, 'static check', 'measured'),
    crit('mu_offline', 'Offline PWA (manifest + service worker + single-file artifact)', 1.5, `bundle ${ui.bundleBytes ? Math.round(ui.bundleBytes / 1024) + ' KB' : 'missing'}`, ui.bundleBytes ? 1 : 0, 'dist/'),
    crit('mu_screens', 'Required screens present in UI (Home, Career, Matches, Calendar, Roster, Rivalries, Media, Achievements, Statistics, Relationships, Settings)', 2, `${ui.screens?.found ?? '?'}/${ui.screens?.total ?? 11}`, ui.screens ? ui.screens.found / ui.screens.total : 0, 'static scan of ui/views.js', ui.screens ? 'measured' : 'unverified'),
    crit('mu_review', 'Independent reviewer score', 2, reviewFor('mobileUsability').v ?? 'none', reviewFor('mobileUsability').sc, 'docs/gauntlet/reviews.json', reviewFor('mobileUsability').v == null ? 'unverified' : 'measured'),
  ];

  out.technicalReliability = [
    crit('tr_tests', 'Automated tests passing', 4, `${tests.pass}/${tests.total}`, ramp(tests.pass / Math.max(1, tests.total), 0.9, 1) * (tests.fail ? 0.5 : 1), 'node --test'),
    crit('tr_crash', 'Career simulation crashes (0)', 3, crashes, 1 - ramp(crashes, 0, 2), '8 careers x 3 years'),
    crit('tr_audit', 'Invariant audit problems (0)', 2.5, auditProblems, 1 - ramp(auditProblems, 0, 2), 'audit()'),
    crit('tr_save', 'Save round-trip with checksum + chain verification', 2, save.ok, save.ok ? 1 : 0, 'envelope encode/decode'),
    crit('tr_e2e', 'E2E reload/continue mid-match identical', 2, e2e ? 'yes' : 'not run', e2e && e2e.passed === e2e.total ? 1 : 0, 'e2e', e2e ? 'measured' : 'unverified'),
    crit('tr_det', 'Deterministic replay of seeded sims', 1, universe.deterministic, universe.deterministic ? 1 : 0, 'universe sim'),
  ];

  out.performance = [
    crit('pf_match', 'Headless match simulation time (ms per match, lower better)', 2, +(match.ms / (types.reduce((a, [, t]) => a + t.n, 0) + 800 + 160 + 60)).toFixed(1), ramp(match.ms / (types.reduce((a, [, t]) => a + t.n, 0) + 800 + 160 + 60), 25, 6), 'all match sims in matchMetrics'),
    crit('pf_year', 'Universe simulation cost (ms per simulated year; budget < 1,200 on a desktop core, roughly 3x that on a phone)', 3, Math.round(universe.msPerYear), ramp(universe.msPerYear, 3500, 1200), 'AI-vs-AI matches ~700/yr'),
    crit('pf_career', 'Career playthrough speed (seconds per simulated 3-year career)', 2, +(mean(reps.map((r) => r.ms)) / 1000).toFixed(1), ramp(mean(reps.map((r) => r.ms)) / 1000, 25, 8), 'includes universe'),
    crit('pf_bundle', 'Single-file bundle size, gzip transfer (KB; budget 450, the raw size is also reported)', 1.5, ui.bundleGzBytes ? `${Math.round(ui.bundleGzBytes / 1024)} gz / ${Math.round(ui.bundleBytes / 1024)} raw` : null, ui.bundleGzBytes ? ramp(ui.bundleGzBytes / 1024, 1000, 450) : 0, 'dist/artifact.html'),
    crit('pf_save', 'Compressed save size at 3 years (KB; budget 400)', 1.5, save.kb, ramp(save.kb, 1200, 400), 'gzip envelope'),
  ];

  const sets = reps.map((r) => new Set(Object.keys(r.scenarioIds)));
  const jacc = []; for (let i = 0; i < sets.length; i++) for (let j = i + 1; j < sets.length; j++) { const a = sets[i], b = sets[j]; const inter = [...a].filter((x) => b.has(x)).length; jacc.push(inter / (a.size + b.size - inter)); }
  const meanJ = mean(jacc);
  const cvOf = (f) => { const v = reps.map(f); const m = mean(v); return m ? std(v) / m : 0; };
  const std = (v) => { const m = mean(v); return Math.sqrt(mean(v.map((x) => (x - m) ** 2))); };
  const cv = mean([cvOf((r) => r.wins), cvOf((r) => r.popularity), cvOf((r) => r.money), cvOf((r) => r.overall), cvOf((r) => r.titlesWon + 1)]);
  out.replayability = [
    crit('rp_distinct', 'Different careers see different scenario sets (1 - mean Jaccard overlap)', 3, +(1 - meanJ).toFixed(2), ramp(1 - meanJ, 0.3, 0.7), '8 careers'),
    crit('rp_outcomes', 'Outcome spread across 8 careers (mean coefficient of variation of wins, popularity, money, overall, titles+1)', 2, +cv.toFixed(2), ramp(cv, 0.08, 0.35), 'careers end in different places depending on build and play'),
    crit('rp_ach', 'Achievements unlocked across careers (breadth)', 2, career.achievementsUnlocked.length, ramp(career.achievementsUnlocked.length, 40, 130), 'union of unlocked'),
    crit('rp_starts', 'Distinct start configurations (era x background x style x gender)', 1.5, `${ui.startConfigs ?? 0}`, ramp(ui.startConfigs ?? 0, 8, 100), 'creator options'),
    crit('rp_eras', 'Eras selectable with era-specific rosters, titles, shows', 1.5, `${ui.eras ?? 0}`, ramp(ui.eras ?? 0, 2, 6), 'data/eras.js'),
    crit('rp_modes', 'Game modes (historical, modern, alternate, custom)', 1.5, `${featStatus('u_modes')}/${featStatus('u_custom')}`, (featScore('u_modes') + featScore('u_custom')) / 2, 'features manifest'),
  ];

  const result = {};
  for (const cat of CATEGORIES) {
    const list = out[cat];
    const W = list.reduce((a, c) => a + c.weight, 0);
    const s = list.reduce((a, c) => a + c.weight * c.score, 0) / W;
    result[cat] = { score: +(s * 10).toFixed(2), criteria: list, unimplemented: list.filter((c) => c.status === 'unimplemented').length, unverified: list.filter((c) => c.status === 'unverified').length };
  }
  const scores = CATEGORIES.map((c) => result[c].score);
  const weakest = CATEGORIES.map((c) => ({ cat: c, score: result[c].score })).sort((a, b) => a.score - b.score);
  return { categories: result, mean: +mean(scores).toFixed(2), min: Math.min(...scores), weakest: weakest.slice(0, 3), reached9: CATEGORIES.filter((c) => result[c].score >= 9).length };
}

/** Lowest-scoring criteria across all categories (what to fix next), excluding ones no code change can fix. */
export function worstCriteria(res, n = 8) {
  const rows = [];
  for (const cat of CATEGORIES) for (const c of res.categories[cat].criteria) rows.push({ cat, ...c, loss: c.weight * (1 - c.score) });
  return rows.sort((a, b) => b.loss - a.loss).slice(0, n);
}
