// Career statistics = a pure fold over player-scope ledger events. Nothing is stored that can't
// be recomputed from the ledger (see recomputeStats), and every headline number has an
// "evidence" predicate so the UI can list the exact events behind it.
import { matches } from '../memory/ledger.js';
import { matchPay } from './finance.js';

const blank = () => ({
  matches: 0, wins: 0, losses: 0, draws: 0,
  streak: { current: 0, bestWin: 0, bestLoss: 0, bestWinEnd: null, bestLossEnd: null },
  winsBy: {}, lossesBy: {},
  opponents: {}, partners: {},
  titles: { won: 0, defenses: 0, failedDefenses: 0, reigns: [], current: {}, longestReignDays: 0, longestReign: null, held: {}, maxSimultaneous: 0 },
  byYear: {}, ple: {}, mainEvents: 0, pleMatches: 0, wmMatches: 0,
  rumble: { entries: 0, eliminations: 0, bestEliminations: 0, longestSurvivalSec: 0, wins: 0, finalTwo: 0, bestEntryWin: null, consecutiveWins: 0, bestConsecutiveWins: 0 },
  bestMatch: null, bestPromo: null, bestInterview: null,
  promos: 0, podcasts: 0, pressConferences: 0, interviews: 0, viral: 0, socialPosts: 0,
  injuries: 0, comebacks: 0, upsets: 0, cleanWins: 0, finisherWins: 0, nonFinisherWins: 0,
  totalDurationSec: 0, matchesRated: 0, ratingSum: 0, fiveStar: 0,
  earnings: { matches: 0, salary: 0, merch: 0, spent: 0 },
  firsts: {}, milestones: [], days: { first: null, last: null },
});

const year = (ev) => parseInt(ev.date.slice(0, 4), 10);

export class CareerStats {
  constructor(playerId) { this.playerId = playerId; this.s = blank(); this.count = 0; }

  apply(ev) {
    if (ev.scope !== 'player') return;
    const s = this.s, me = this.playerId, d = ev.data;
    this.count++;
    if (s.days.first == null) s.days.first = ev.day;
    s.days.last = ev.day;
    const first = (k) => { if (!s.firsts[k]) s.firsts[k] = ev.id; };
    switch (ev.type) {
      case 'match_result': {
        s.matches++; s.earnings.matches += matchPay(d);
        const y = (s.byYear[year(ev)] ||= { matches: 0, wins: 0, losses: 0, draws: 0, titles: 0, ratingSum: 0, rated: 0, ple: 0 });
        y.matches++;
        s.totalDurationSec += d.durationSec || 0;
        if (d.rating != null) { s.matchesRated++; s.ratingSum += d.rating; y.ratingSum += d.rating; y.rated++; if (d.rating >= 5) s.fiveStar++; }
        if (!s.bestMatch || d.rating > s.bestMatch.rating) s.bestMatch = { id: ev.id, rating: d.rating, opponents: d.opponents };
        if (d.ppv) { s.pleMatches++; y.ple++; const p = (s.ple[d.ppv] ||= { matches: 0, wins: 0, ids: [] }); p.matches++; p.ids.push(ev.id); if (d.result === 'win') p.wins++; first('ple'); }
        if (d.ppvTier >= 2) s.wmMatches++;
        if (d.mainEvent) { s.mainEvents++; first('mainEvent'); }
        if (d.show) first(`show:${d.show}`);
        first('match');
        for (const o of d.opponents || []) {
          const r = (s.opponents[o] ||= { matches: 0, wins: 0, losses: 0, draws: 0, last: 0 });
          r.matches++; r.last = ev.day;
          if (d.result === 'win') r.wins++; else if (d.result === 'loss') r.losses++; else r.draws++;
        }
        for (const p of d.partners || []) {
          const r = (s.partners[p] ||= { matches: 0, wins: 0 });
          r.matches++; if (d.result === 'win') r.wins++;
        }
        if (d.result === 'win') {
          s.wins++; y.wins++;
          s.winsBy[d.finish] = (s.winsBy[d.finish] || 0) + 1;
          s.streak.current = s.streak.current > 0 ? s.streak.current + 1 : 1;
          if (s.streak.current > s.streak.bestWin) { s.streak.bestWin = s.streak.current; s.streak.bestWinEnd = ev.id; }
          first('win');
          if (d.clean) s.cleanWins++;
          if (d.upset) s.upsets++;
          if (d.comeback) s.comebacks++;
          if (d.finisherUsed) s.finisherWins++; else s.nonFinisherWins++;
        } else if (d.result === 'loss') {
          s.losses++; y.losses++;
          s.lossesBy[d.finish] = (s.lossesBy[d.finish] || 0) + 1;
          s.streak.current = s.streak.current < 0 ? s.streak.current - 1 : -1;
          if (-s.streak.current > s.streak.bestLoss) { s.streak.bestLoss = -s.streak.current; s.streak.bestLossEnd = ev.id; }
          first('loss');
        } else {
          s.draws++; y.draws++; s.streak.current = 0;
        }
        break;
      }
      case 'title_win': {
        s.titles.won++;
        const y = (s.byYear[year(ev)] ||= { matches: 0, wins: 0, losses: 0, draws: 0, titles: 0, ratingSum: 0, rated: 0, ple: 0 });
        y.titles++;
        s.titles.reigns.push({ titleId: d.titleId, name: d.titleName, startDay: ev.day, endDay: null, defenses: 0, startEvent: ev.id, endEvent: null });
        s.titles.current[d.titleId] = s.titles.reigns.length - 1;
        s.titles.held[d.titleId] = true;
        s.titles.maxSimultaneous = Math.max(s.titles.maxSimultaneous, Object.keys(s.titles.current).length);
        first('title');
        break;
      }
      case 'title_defense': {
        const i = s.titles.current[d.titleId];
        if (d.success) { s.titles.defenses++; if (i != null) s.titles.reigns[i].defenses++; }
        else s.titles.failedDefenses++;
        break;
      }
      case 'title_loss': case 'title_vacate': {
        const i = s.titles.current[d.titleId];
        if (i != null) {
          const r = s.titles.reigns[i];
          r.endDay = ev.day; r.endEvent = ev.id;
          const days = r.endDay - r.startDay;
          if (days > s.titles.longestReignDays) { s.titles.longestReignDays = days; s.titles.longestReign = { ...r }; }
          delete s.titles.current[d.titleId];
        }
        break;
      }
      case 'rumble_result': {
        const r = s.rumble;
        r.entries++; r.eliminations += d.eliminations || 0;
        r.bestEliminations = Math.max(r.bestEliminations, d.eliminations || 0);
        r.longestSurvivalSec = Math.max(r.longestSurvivalSec, d.survivalSec || 0);
        if (d.finalTwo) r.finalTwo++;
        if (d.won) {
          r.wins++; r.consecutiveWins++; r.bestConsecutiveWins = Math.max(r.bestConsecutiveWins, r.consecutiveWins);
          if (r.bestEntryWin == null || d.entryNumber > r.bestEntryWin) r.bestEntryWin = d.entryNumber;
        } else r.consecutiveWins = 0;
        first('rumble');
        break;
      }
      case 'promo_delivered':
        s.promos++; first('promo');
        if (!s.bestPromo || d.quality > s.bestPromo.quality) s.bestPromo = { id: ev.id, quality: d.quality };
        break;
      case 'podcast': s.podcasts++; first('podcast'); if (d.viral) { s.viral++; first('viral'); } break;
      case 'press_conference': s.pressConferences++; first('press'); break;
      case 'interview':
        s.interviews++; first('interview');
        if (d.viral) { s.viral++; first('viral'); }
        if (!s.bestInterview || d.quality > s.bestInterview.quality) s.bestInterview = { id: ev.id, quality: d.quality };
        break;
      case 'finance_month': s.earnings.salary += d.salary; s.earnings.merch += d.merch; s.earnings.spent += d.expenses; break;
      case 'social_post': s.socialPosts++; if (d.viral) { s.viral++; first('viral'); } break;
      case 'injury': s.injuries++; break;
      case 'debut': first('debut'); break;
      default: break;
    }
  }

  get winPct() { return this.s.matches ? this.s.wins / this.s.matches : 0; }
  get avgRating() { return this.s.matchesRated ? this.s.ratingSum / this.s.matchesRated : 0; }
  totalDaysChampion(today) {
    return this.s.titles.reigns.reduce((t, r) => t + ((r.endDay ?? today) - r.startDay), 0);
  }
}

export function recomputeStats(ledger, playerId) {
  const cs = new CareerStats(playerId);
  for (const ev of ledger.events) cs.apply(ev);
  return cs;
}

/** Evidence predicates: which events make up each headline statistic. */
export const EVIDENCE = {
  matches: { types: ['match_result'] },
  wins: { types: ['match_result'], where: { 'data.result': 'win' } },
  losses: { types: ['match_result'], where: { 'data.result': 'loss' } },
  draws: { types: ['match_result'], where: { 'data.result': 'draw' } },
  titleWins: { types: ['title_win'] },
  titleDefenses: { types: ['title_defense'], where: { 'data.success': true } },
  titleLosses: { types: ['title_loss'] },
  promos: { types: ['promo_delivered'] },
  podcasts: { types: ['podcast'] },
  interviews: { types: ['interview'] },
  pressConferences: { types: ['press_conference'] },
  injuries: { types: ['injury'] },
  rumbles: { types: ['rumble_result'] },
  mainEvents: { types: ['match_result'], where: { 'data.mainEvent': true } },
  pleMatches: { types: ['match_result'], where: { 'data.ppv': { exists: true } } },
  cleanWins: { types: ['match_result'], where: { 'data.result': 'win', 'data.clean': true } },
  upsets: { types: ['match_result'], where: { 'data.result': 'win', 'data.upset': true } },
  comebacks: { types: ['match_result'], where: { 'data.result': 'win', 'data.comeback': true } },
};

export function inspectStat(ledger, key, extra = {}) {
  const spec = EVIDENCE[key];
  if (!spec) throw new Error(`no evidence definition for ${key}`);
  return ledger.query({ ...spec, scope: 'player', ...extra });
}

export { matches };
