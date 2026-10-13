// Year-end awards. The player competes against simulated wrestlers on the same scoring formula.
// Awards are written to the ledger as `award` events (achievements read them) and the universe log.
import { yearOfDay } from './records.js';

const score = (w, l, titles, rating, pop) => w * 1 - l * 0.4 + titles * 8 + (rating - 2.5) * 10 + pop / 10;

export function processYearEnd(game, year) {
  const c = game.c, u = c.universe, me = c.player;
  const led = c.memory.ledger;
  const yMatches = led.query({ types: ['match_result'], scope: 'player' }).filter((e) => e.date.startsWith(String(year)));
  const wins = yMatches.filter((e) => e.data.result === 'win').length, losses = yMatches.filter((e) => e.data.result === 'loss').length;
  const titles = led.query({ types: ['title_win'], scope: 'player' }).filter((e) => e.date.startsWith(String(year))).length;
  const rating = yMatches.length ? yMatches.reduce((s, e) => s + (e.data.rating || 0), 0) / yMatches.length : 0;
  const myScore = score(wins, losses, titles, rating, me.popularity);
  const results = [];
  const give = (kind, label, my, best, bestName) => {
    const won = yMatches.length >= 8 && my >= best;
    if (won) {
      const r = c.record({ key: `award:${kind}:${year}`, category: 'career', type: 'award', summary: `${me.name} won ${label} ${year}.`, importance: 5, data: { kind, year, score: Math.round(my) } });
      results.push({ kind, label, year, won: true, event: r.event });
    } else u.note(c.day, 'award', `${bestName || 'A rival'} won ${label} ${year}.`, []);
  };
  // AI season scores: derived from their season record deltas
  const act = u.list();
  const aiScore = (w) => { const yr = w.yr && w.yr.y === year ? w.yr : { w: 0, l: 0 }; const tw = u.titlesOf(w.id).length; return score(yr.w, yr.l, tw, 3, w.popularity); };
  const best = act.map((w) => ({ w, s: aiScore(w) })).sort((a, b) => b.s - a.s)[0];
  give('wrestler_of_the_year', 'Wrestler of the Year', myScore, best ? best.s : 0, best?.w.name);
  // rookie: debuted this year
  const myDebut = led.ofType('debut')[0];
  if (myDebut && myDebut.date.startsWith(String(year))) {
    const rookies = act.filter((w) => w.debutYear === year).map((w) => ({ w, s: aiScore(w) })).sort((a, b) => b.s - a.s)[0];
    give('rookie_of_the_year', 'Rookie of the Year', myScore, rookies ? rookies.s : 0, rookies?.w.name);
  }
  // breakout: biggest popularity gain from a modest base
  const startPop = c.flags.yearStartPop?.[year] ?? me.popularity;
  const gain = me.popularity - startPop;
  if (startPop < 60 && gain >= 8) give('breakout_star', 'Breakout Superstar', gain, 8 + (u.rng.next() * 4), 'A rising star');
  // comeback: returned from a 60+ day injury this year and won more than they lost afterwards
  const returns = led.ofType('return').filter((e) => e.date.startsWith(String(year)) && (e.data.daysOut || 0) >= 60);
  if (returns.length) {
    const after = yMatches.filter((e) => e.seq > returns[0].seq);
    if (after.length >= 5 && after.filter((e) => e.data.result === 'win').length / after.length >= 0.6) give('comeback_of_the_year', 'Comeback of the Year', 100, 0, null);
  }
  // match of the year
  const myBest = yMatches.reduce((b, e) => (e.data.rating > (b?.data.rating ?? -1) ? e : b), null);
  const aiBest = u.yearBest[year];
  if (myBest) give('match_of_the_year', 'Match of the Year', myBest.data.rating, aiBest ? aiBest.rating : 0, aiBest?.names);
  c.flags.yearStartPop = { ...(c.flags.yearStartPop || {}), [year + 1]: me.popularity };
  for (const w of u.list()) w.yr = { y: year + 1, w: 0, l: 0 };
  c.flags.lastAwardYear = year;
  return results;
}

/** called every simulated day by the Game: runs awards once when a calendar year turns over */
export function maybeYearEnd(game) {
  const c = game.c;
  const year = yearOfDay(c.day, c.startYear);
  if (c.flags.lastAwardYear == null) { c.flags.lastAwardYear = year - 1; c.flags.yearStartPop = { [year]: c.player.popularity }; }
  const out = [];
  while (c.flags.lastAwardYear < year - 1) out.push(...processYearEnd(game, c.flags.lastAwardYear + 1));
  return out;
}
