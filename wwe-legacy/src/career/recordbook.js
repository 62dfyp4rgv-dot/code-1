// The Career Record Book: every number is derived from ledger-backed projections and carries the
// event ids that produced it, so the UI can open any statistic and show its evidence.
import { inspectStat } from './stats.js';
import { getRivalry } from '../memory/world.js';

const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);

export function buildRecordBook(career, nameOf = (x) => x) {
  const s = career.stats.s;
  const ledger = career.memory.ledger;
  const me = career.player.id;
  const item = (label, value, evidence = null, extra = {}) => ({ label, value, evidence, ...extra });
  const evidenceOf = (key) => inspectStat(ledger, key).map((e) => e.id);

  const opp = Object.entries(s.opponents).sort((a, b) => b[1].matches - a[1].matches);
  const rivals = Object.values(career.memory.world.rivalries).filter((r) => r.a === me || r.b === me)
    .map((r) => ({ r, other: r.a === me ? r.b : r.a, score: r.matches + r.heat / 20 })).sort((a, b) => b.score - a.score);
  const partners = Object.entries(s.partners).sort((a, b) => b[1].wins - a[1].wins || b[1].matches - a[1].matches);
  const years = Object.entries(s.byYear).sort((a, b) => b[1].wins - a[1].wins);
  const ples = Object.entries(s.ple).sort((a, b) => b[1].wins - a[1].wins || b[1].matches - a[1].matches);
  const bestPle = ples[0];
  const days = career.stats.totalDaysChampion(career.day);

  const sections = [];
  sections.push({
    id: 'overview', title: 'Overview', items: [
      item('Total matches', s.matches, evidenceOf('matches')),
      item('Wins', s.wins, evidenceOf('wins')), item('Losses', s.losses, evidenceOf('losses')), item('Draws', s.draws, evidenceOf('draws')),
      item('Win percentage', `${pct(s.wins, s.matches)}%`, evidenceOf('wins')),
      item('Average match rating', s.matchesRated ? `${(s.ratingSum / s.matchesRated).toFixed(2)}★` : '—', evidenceOf('matches')),
      item('Five-star matches', s.fiveStar, ledger.query({ types: ['match_result'], where: { 'data.rating': { gte: 5 } }, scope: 'player' }).map((e) => e.id)),
      item('Main events', s.mainEvents, evidenceOf('mainEvents')), item('PLE matches', s.pleMatches, evidenceOf('pleMatches')),
      item('Clean wins', s.cleanWins, evidenceOf('cleanWins')), item('Upset wins', s.upsets, evidenceOf('upsets')), item('Comeback wins', s.comebacks, evidenceOf('comebacks')),
    ],
  });
  sections.push({
    id: 'titles', title: 'Championships', items: [
      item('Championships won', s.titles.won, evidenceOf('titleWins')),
      item('Championship reigns', s.titles.reigns.length, s.titles.reigns.map((r) => r.startEvent)),
      item('Total days as champion', days, s.titles.reigns.map((r) => r.startEvent)),
      item('Successful title defenses', s.titles.defenses, evidenceOf('titleDefenses')),
      item('Longest reign', s.titles.longestReignDays ? `${s.titles.longestReignDays} days (${s.titles.longestReign.name})` : '—', s.titles.longestReign ? [s.titles.longestReign.startEvent, s.titles.longestReign.endEvent].filter(Boolean) : []),
      item('Currently holding', Object.keys(s.titles.current).length, Object.values(s.titles.current).map((i) => s.titles.reigns[i].startEvent)),
    ],
  });
  sections.push({
    id: 'streaks', title: 'Streaks & Rivals', items: [
      item('Longest winning streak', s.streak.bestWin, s.streak.bestWinEnd ? [s.streak.bestWinEnd] : []),
      item('Longest losing streak', s.streak.bestLoss, s.streak.bestLossEnd ? [s.streak.bestLossEnd] : []),
      item('Current streak', s.streak.current > 0 ? `${s.streak.current}W` : s.streak.current < 0 ? `${-s.streak.current}L` : '—', s.streak.current ? ledger.query({ types: ['match_result'], scope: 'player', newestFirst: true, limit: Math.abs(s.streak.current) }).map((e) => e.id) : []),
      item('Most frequent opponent', opp[0] ? `${nameOf(opp[0][0])} (${opp[0][1].matches})` : '—', opp[0] ? ledger.query({ types: ['match_result'], allParticipants: [me, opp[0][0]] }).map((e) => e.id) : []),
      item('Greatest rival', rivals[0] ? `${nameOf(rivals[0].other)} (heat ${Math.round(rivals[0].r.heat)}, ${rivals[0].r.matches} matches)` : '—', rivals[0] ? rivals[0].r.events : []),
      item('Best tag-team partner', partners[0] ? `${nameOf(partners[0][0])} (${partners[0][1].wins} wins together)` : '—', partners[0] ? ledger.query({ types: ['match_result'], allParticipants: [me, partners[0][0]], where: { 'data.result': 'win' } }).map((e) => e.id) : []),
    ],
  });
  sections.push({
    id: 'bests', title: 'Bests', items: [
      item('Highest-rated match', s.bestMatch ? `${s.bestMatch.rating}★ vs ${(s.bestMatch.opponents || []).map(nameOf).join(' & ')}` : '—', s.bestMatch ? [s.bestMatch.id] : []),
      item('Highest-rated promo', s.bestPromo ? `${s.bestPromo.quality}/100` : '—', s.bestPromo ? [s.bestPromo.id] : []),
      item('Highest-rated interview', s.bestInterview ? `${s.bestInterview.quality}/100` : '—', s.bestInterview ? [s.bestInterview.id] : []),
      item('Best calendar year', years[0] ? `${years[0][0]} (${years[0][1].wins}-${years[0][1].losses})` : '—', years[0] ? ledger.query({ types: ['match_result'], fromDay: 0, scope: 'player' }).filter((e) => e.date.startsWith(years[0][0])).map((e) => e.id).slice(0, 50) : []),
      item('Most successful PLE', bestPle ? `${bestPle[0]} (${bestPle[1].wins}-${bestPle[1].matches - bestPle[1].wins})` : '—', bestPle ? bestPle[1].ids : []),
    ],
  });
  const r = s.rumble;
  sections.push({
    id: 'rumble', title: 'Royal Rumble', items: [
      item('Appearances', r.entries, evidenceOf('rumbles')), item('Wins', r.wins, ledger.query({ types: ['rumble_result'], where: { 'data.won': true } }).map((e) => e.id)),
      item('Total eliminations', r.eliminations, evidenceOf('rumbles')), item('Most eliminations (one match)', r.bestEliminations, ledger.query({ types: ['rumble_result'], scope: 'player' }).filter((e) => (e.data.eliminations || 0) === r.bestEliminations).map((e) => e.id)),
      item('Longest survival', r.longestSurvivalSec ? `${Math.floor(r.longestSurvivalSec / 60)}m ${r.longestSurvivalSec % 60}s` : '—', ledger.query({ types: ['rumble_result'], scope: 'player' }).filter((e) => (e.data.survivalSec || 0) === r.longestSurvivalSec).map((e) => e.id)),
      item('Final-two finishes', r.finalTwo, ledger.query({ types: ['rumble_result'], scope: 'player', where: { 'data.finalTwo': true } }).map((e) => e.id)),
    ],
  });
  sections.push({
    id: 'media', title: 'Promos & Media', items: [
      item('Promos', s.promos, evidenceOf('promos')), item('Podcasts', s.podcasts, evidenceOf('podcasts')), item('Press conferences', s.pressConferences, evidenceOf('pressConferences')),
      item('Interviews', s.interviews, evidenceOf('interviews')), item('Viral moments', s.viral),
      item('Promises kept', ledger.ofType('promise_kept').length, ledger.ofType('promise_kept').map((e) => e.id)),
      item('Promises broken', ledger.ofType('promise_broken').length, ledger.ofType('promise_broken').map((e) => e.id)),
    ],
  });
  const list = career.achievements.list();
  const unlocked = list.filter((a) => a.unlocked);
  const inProg = list.filter((a) => !a.unlocked && a.eligible && a.progress && a.progress.ratio > 0 && !a.secret).sort((a, b) => b.progress.ratio - a.progress.ratio);
  sections.push({
    id: 'achievements', title: 'Achievements', items: [
      item('Unlocked', `${unlocked.length} / ${list.length}`, unlocked.map((a) => a.record.event)),
      ...inProg.slice(0, 5).map((a) => item(`In progress: ${a.name}`, `${Math.floor(a.progress.value)}/${a.progress.target}`, (a.progress.evidence || []).filter((id) => ledger.get(id)), { achievementId: a.id })),
    ],
  });
  const milestones = ledger.query({ types: ['debut', 'title_win', 'rumble_result', 'award', 'hall_of_fame', 'retirement', 'injury', 'return'], scope: 'player' })
    .filter((e) => e.type !== 'rumble_result' || e.data.won);
  sections.push({ id: 'milestones', title: 'Career Milestones', items: milestones.slice(-12).map((e) => item(e.date, e.summary, [e.id])) });
  sections.push({ id: 'universe', title: 'Records', items: [
    item('Records held', (career.recordsHeld ? career.recordsHeld() : []).length || 0, null),
    item('Records broken by others', (career.recordsLost ? career.recordsLost() : []).length || 0, null),
  ] });
  return { player: career.player.name, asOf: career.date, sections };
}

/** Open a statistic: resolve its evidence ids to full ledger events. */
export function inspectItem(career, item) {
  return (item.evidence || []).map((id) => career.memory.ledger.get(id)).filter(Boolean);
}

export { getRivalry };
