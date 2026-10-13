// Career: the persistent aggregate for one wrestler. Owns the memory (ledger + world), the stats
// projection and the achievement engine, and exposes ONE pipeline - record() - through which every
// meaningful thing that happens is written down, projected and evaluated.
import { Rng } from '../core/rng.js';
import { clamp, deepClone, round1 } from '../core/util.js';
import { Memory } from '../memory/memory.js';
import { dayToDate } from '../memory/ledger.js';
import { CareerStats, recomputeStats } from './stats.js';
import { AchievementEngine } from '../achievements/engine.js';
import { ACHIEVEMENT_DEFS } from '../achievements/defs.js';
import { eraForYear } from '../data/eras.js';
import { summarizeMatch, rateMatch } from '../match/rating.js';
import { damageFraction } from '../match/state.js';
import { getMove } from '../match/moves.js';
import { Universe } from '../universe/universe.js';
import { gainPop } from './pace.js';

export const CAREER_VERSION = 1;

const ATTRS = ['power', 'striking', 'grappling', 'technical', 'agility', 'endurance', 'toughness', 'psychology'];

export class Career {
  constructor({ id, seed = 1, player, startYear = 2024, mode = 'modern', era } = {}) {
    this.id = id || `career_${seed}`;
    this.version = CAREER_VERSION;
    this.seed = seed;
    this.rng = new Rng(seed);
    this.startYear = startYear;
    this.mode = mode;
    this.day = 0;
    this.era = era || eraForYear(startYear).id;
    this.player = Career.normalizePlayer(player);
    this.memory = new Memory(this.player.id);
    this.stats = new CareerStats(this.player.id);
    this.achievements = new AchievementEngine(ACHIEVEMENT_DEFS, this.memory, () => this.env());
    this.achievements.listeners.push((rec) => this._applyReward(rec));
    this.universe = null;         // wrestling universe (roster, titles, AI); owned by the career so it saves with it
    this.activeMatch = null;      // saved MatchEngine state while a match is in progress
    this.pendingMatch = null;     // booking info for the match being played
    this.flags = {};
    this.notifications = [];      // transient UI feed (not authoritative)
    this.log = [];
  }

  static normalizePlayer(p) {
    const attrs = Object.fromEntries(ATTRS.map((k) => [k, p.attrs?.[k] ?? 40]));
    return {
      id: p.id || 'player', name: p.name || 'The Rookie', nickname: p.nickname || '', gender: p.gender || 'M', alignment: p.alignment || 'face',
      style: p.style || 'allrounder', attrs, signatures: p.signatures || [], finisher: p.finisher || null, extraMoves: p.extraMoves || [],
      popularity: p.popularity ?? 10, confidence: p.confidence ?? 50, fatigue: 0, injuries: [], money: p.money ?? 5000, charisma: p.charisma ?? 40, mic: p.mic ?? 40,
      brand: p.brand || 'NXT', background: p.background || 'prospect', personality: p.personality || { aggression: 50, ego: 50, loyalty: 50, ambition: 60 },
      appearance: p.appearance || {}, entrance: p.entrance || { style: 'classic', music: 'Rising' }, goals: p.goals || [], contract: p.contract || null,
      xp: {}, difficulty: 0.5, peakAttrs: {},
    };
  }

  get year() { return this.startYear + Math.floor(this.day / 365.25); }
  get date() { return dayToDate(this.day, this.startYear); }
  env() { return { stats: this.stats, era: this.era, year: this.year }; }

  // -------------------------------------------------------------- the one pipeline
  /**
   * Record any event. Returns { event, duplicate, unlocked:[...], extra:[...] }.
   * Idempotent on spec.key: a duplicate changes nothing (stats, relationships, achievements).
   */
  record(spec) {
    const base = { day: this.day, date: this.date, participants: [this.player.id], scope: 'player', ...spec };
    const { event, duplicate, resolvedPromises } = this.memory.record(base);
    if (duplicate) return { event, duplicate: true, unlocked: [], extra: [] };
    this.stats.apply(event);
    const extra = [];
    for (const p of resolvedPromises) {
      const r = this.record({
        key: `promise:${p.id}:${p.status}`, category: 'promo', type: p.status === 'kept' ? 'promise_kept' : 'promise_broken',
        participants: [this.player.id, ...(p.target ? [p.target] : [])], refs: [p.madeEvent, event.id], day: event.day, date: event.date,
        summary: `Promise ${p.status}: "${p.text}"`, importance: 4, data: { promiseId: p.id, kind: p.kind, text: p.text, target: p.target, status: p.status, reason: p.reason || null },
      });
      extra.push(r.event, ...r.unlocked.map((u) => ({ type: 'achievement', ...u })));
    }
    const unlocked = this.achievements.processEvent(event);
    for (const u of unlocked) this.notifications.push({ kind: 'achievement', id: u.id, name: u.name, day: this.day });
    return { event, duplicate: false, unlocked, extra };
  }

  _applyReward(rec) {
    const r = rec.reward;
    if (!r) return;
    if (r.popularity) this.player.popularity = clamp(this.player.popularity + r.popularity, 0, 100);
    if (r.money) this.player.money += r.money;
  }

  // -------------------------------------------------------------- player model
  overall(p = this.player) { return Math.round(ATTRS.reduce((s, k) => s + p.attrs[k], 0) / ATTRS.length); }

  /** profile handed to the match engine */
  fighterProfile() {
    const p = this.player;
    const attrs = Object.fromEntries(ATTRS.map((k) => [k, Math.round(p.attrs[k])]));
    return {
      id: p.id, name: p.name, style: p.style, alignment: p.alignment, attrs, gender: p.gender, popularity: p.popularity,
      confidence: p.confidence, fatigue: p.fatigue, injuries: p.injuries.filter((i) => i.daysLeft > 0).map((i) => ({ part: i.part, severity: i.severity })),
      signatures: p.signatures, finisher: p.finisher, extraMoves: p.extraMoves, personality: p.personality,
    };
  }

  // -------------------------------------------------------------- match results
  /**
   * Convert a finished MatchEngine into ledger events. `booking` describes context:
   * { opponents:[profiles], partners:[profiles], show, ppv, ppvTier, mainEvent, title, matchId, storyline, label }
   * Returns { event, unlocked, summary }
   */
  recordMatch(engine, booking) {
    const st = engine.state;
    if (!st.result) throw new Error('match is not finished');
    const me = this.player.id;
    const res = st.result;
    const f = st.fighters[me];
    const myTeam = f.side;
    const result = res.winnerSide === null ? 'draw' : res.winnerSide === myTeam ? 'win' : 'loss';
    const sum = summarizeMatch(st)[me];
    const rating = rateMatch(st);
    const opponents = booking.opponents.map((o) => o.id);
    const partners = (booking.partners || []).map((o) => o.id);
    const dqBy = res.dqBy;
    const interference = st.events.some((e) => e.type === 'interference');
    const clean = !(['dq', 'countout'].includes(res.finish)) && !interference;
    const oppFs = opponents.map((id) => st.fighters[id]);
    const myDmg = damageFraction(f);
    const oppDmg = oppFs.reduce((s, o) => s + damageFraction(o), 0) / Math.max(1, oppFs.length);
    const oppOverall = booking.opponents.reduce((s, o) => s + this.overall(o), 0) / Math.max(1, opponents.length);
    const upset = result === 'win' && oppOverall >= this.overall() + 12;
    const comeback = result === 'win' && (st.peakDeficit?.[me] ?? 0) >= 0.28;
    const cats = f.stats.categories;
    const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const rivalIds = new Set(Object.values(this.memory.world.rivalries).filter((r) => (r.a === me || r.b === me) && r.heat >= 20).map((r) => (r.a === me ? r.b : r.a)));
    const vsRival = opponents.some((o) => rivalIds.has(o));
    const streakBefore = Math.max(0, this.stats.s.streak.current);
    const streakAfter = result === 'win' ? streakBefore + 1 : 0;
    const finisherMoveId = f.finisherId;
    const trustedPartner = partners.some((p) => {
      const r = this.memory.rel(me, p); const i = r.a === me ? 0 : 1; return r.trust[i] >= 40 && r.trust[1 - i] >= 40;
    });
    const nearFallsSurvived = st.events.filter((e) => e.type === 'pin_kickout' && e.actor === me && e.nearFall).length;
    const finisherReversalsMade = st.events.filter((e) => e.type === 'finisher_reversed' && e.target === me).length;
    const title = booking.title || null;
    const titleOnLine = !!title;
    const iAmChampion = title && title.holder === me;
    const titleChange = titleOnLine && result === 'win' && !iAmChampion && ['pinfall', 'submission', 'objective', 'ten_count', 'falls'].includes(res.finish);
    const winnerId = res.winnerId;
    const key = `match:${booking.matchId}`;
    const oppNames = booking.opponents.map((o) => o.name).join(' & ');
    const verb = result === 'win' ? 'defeated' : result === 'loss' ? 'lost to' : 'drew with';
    const finishName = res.finishMove ? getMoveName(res.finishMove) : null;
    const summary = `${this.player.name} ${verb} ${oppNames}${res.finish && result !== 'draw' ? ` by ${String(res.finish).replace(/_/g, ' ')}${finishName ? ` (${finishName})` : ''}` : ''} on ${booking.show || 'a show'} - ${rating.stars}★.`;
    const out = this.record({
      key, category: 'match', type: 'match_result', participants: [me, ...opponents, ...partners], where: { show: booking.show || null, venue: booking.venue || null },
      storyline: booking.storyline || null, action: booking.label || 'match', outcome: result, summary, importance: titleOnLine ? 4 : booking.ppvTier >= 2 ? 4 : booking.mainEvent ? 3 : 2,
      data: {
        matchId: booking.matchId, matchType: st.type, show: booking.show || null, ppv: booking.ppv || null, ppvTier: booking.ppvTier || 0, mainEvent: !!booking.mainEvent,
        opponents, partners, result, winner: winnerId || null, finish: res.finish, finishMove: res.finishMove || null, finishMoveName: finishName,
        finishMoveIsFinisher: res.finishMove === finisherMoveId || res.finishCat === 'finisher', durationSec: res.durationSec, rounds: res.rounds,
        rating: rating.stars, ratingBreakdown: rating.breakdown, titleId: title ? title.id : null, titleOnLine, titleChange, clean, dqBy: dqBy || null, interference,
        dominant: result === 'win' && myDmg < 0.15 && oppDmg > 0.4, upset, comeback, vsRival, finisherUsed: f.stats.usedFinisher,
        playerTopCategory: topCat, reversalsMade: sum.reversalsMade, finisherReversalsMade, damageTaken: sum.damageTaken, staminaLeft: sum.staminaLeft,
        nearFallsSurvived, winStreak: streakAfter, winStreakBefore: streakBefore, trustedPartner, era: this.era,
        stats: { ...sum, categories: cats }, falls: res.falls, opponentOverall: Math.round(oppOverall), playerOverall: this.overall(),
        respectShown: f.stats.respectShown || 0,
      },
    });
    const events = [out.event];
    if (!out.duplicate) {
      for (const inj of f.injuriesNew) events.push(this.recordInjury(inj, out.event));
      if (f.stats.respectShown && opponents.length) {
        const r = this.record({ key: `${key}:respect`, category: 'relationship', type: 'respect_shown', participants: [me, ...opponents], refs: [out.event.id], summary: `${this.player.name} showed respect to ${oppNames} during the match.`, importance: 2, data: { matchId: booking.matchId } });
        events.push(r.event);
      }
      this._postMatchProgress(out.event, f, booking, result, rating, opponents);
    }
    return { ...out, events, rating, result };
  }

  recordInjury(inj, matchEvent) {
    const days = Math.round((inj.severity === 2 ? 42 : 14) * (0.8 + (matchEvent.seq % 5) / 10));
    const rec = { part: inj.part, severity: inj.severity, daysLeft: days, total: days, eventId: null };
    const out = this.record({
      key: `injury:${matchEvent.id}:${inj.part}`, category: 'career', type: 'injury', refs: [matchEvent.id], summary: `${this.player.name} injured their ${inj.part} (${inj.severity === 2 ? 'serious' : 'minor'}, ~${days} days).`,
      importance: inj.severity === 2 ? 4 : 2, data: { part: inj.part, severity: inj.severity, days },
    });
    rec.eventId = out.event.id;
    if (!out.duplicate) this.player.injuries.push(rec);
    return out.event;
  }

  _postMatchProgress(ev, f, booking, result, rating, opponents) {
    const p = this.player;
    const d = ev.data;
    // experience: attributes actually used grow slowly (fractional, so progress is visible but gradual)
    const used = f.stats.categories;
    const gain = (k, n) => { p.attrs[k] = Math.min(99, p.attrs[k] + n * (1 - p.attrs[k] / 130)); };
    const total = Object.values(used).reduce((a, b) => a + b, 0) || 1;
    const catAttr = { strike_light: 'striking', strike_heavy: 'striking', combo: 'striking', grapple: 'grappling', technical: 'technical', power: 'power', submission: 'technical', corner: 'power', aerial: 'agility', signature: 'psychology', finisher: 'psychology', environmental: 'toughness', illegal: 'psychology', positioning: 'grappling' };
    for (const [c, n] of Object.entries(used)) gain(catAttr[c] || 'psychology', 0.5 * (n / total) * (result === 'win' ? 1.2 : 1));
    gain('endurance', d.durationSec / 3600 * 0.6); gain('toughness', d.damageTaken / 400 * 0.4);
    p.xp.matches = (p.xp.matches || 0) + 1;
    // popularity / money / fatigue
    const tierMul = 1 + (booking.ppvTier || 0) * 0.6 + (booking.mainEvent ? 0.5 : 0);
    const base = result === 'win' ? 0.5 : result === 'loss' ? -0.35 : 0.05;
    gainPop(p, (base + (rating.stars - 2.5) * 0.25 + (d.upset ? 1.0 : 0)) * tierMul);
    p.confidence = clamp(p.confidence + (result === 'win' ? 3 : result === 'loss' ? -4 : 0), 0, 100);
    p.fatigue = clamp(p.fatigue + 8 + d.durationSec / 120 + d.damageTaken / 40, 0, 100);
    p.money += Math.round(800 * tierMul + (result === 'win' ? 200 : 0));
    // milestones
    this.checkMilestones();
  }

  checkMilestones() {
    const p = this.player;
    const marks = [50, 80, 95];
    for (const m of marks) if (p.popularity >= m) this.record({ key: `milestone:pop:${m}`, category: 'career', type: 'milestone', summary: `Popularity reached ${m}.`, importance: 3, data: { kind: 'popularity', value: m } });
    for (const k of ATTRS) {
      for (const m of [80, 95]) if (p.attrs[k] >= m) this.record({ key: `milestone:attr:${k}:${m}`, category: 'career', type: 'milestone', summary: `${k} reached ${m}.`, importance: 3, data: { kind: 'attribute', attr: k, value: m } });
    }
    const years = Math.floor(this.day / 365.25);
    for (const y of [5, 10, 20]) if (years >= y) this.record({ key: `milestone:years:${y}`, category: 'career', type: 'milestone', summary: `${y} years in the business.`, importance: 3, data: { kind: 'career_years', value: y } });
    if (p.money >= 1_000_000) this.record({ key: 'milestone:savings_million', category: 'personal', type: 'milestone', summary: 'Savings passed $1,000,000.', importance: 3, data: { kind: 'savings_million', value: p.money } });
  }

  // -------------------------------------------------------------- time
  advanceDays(n = 1) {
    for (let i = 0; i < n; i++) {
      this.day += 1;
      const p = this.player;
      p.fatigue = clamp(p.fatigue - 4, 0, 100);
      for (const inj of p.injuries) if (inj.daysLeft > 0) {
        inj.daysLeft -= 1;
        if (inj.daysLeft === 0) {
          this.record({ key: `return:${inj.eventId}`, category: 'career', type: 'return', refs: [inj.eventId], summary: `${p.name} recovered from a ${inj.part} injury.`, importance: 3, data: { part: inj.part, daysOut: inj.total } });
        }
      }
    }
  }

  recordsHeld() { return this.universe ? Object.entries(this.universe.records).filter(([, r]) => r.holder === this.player.id).map(([k, r]) => ({ key: k, ...r })) : []; }
  recordsLost() { return this.memory.ledger.ofType('record_lost'); }

  // -------------------------------------------------------------- views
  timeline({ minImportance = 1, types, limit = 100, newestFirst = true } = {}) {
    const evs = this.memory.ledger.query({ types, scope: 'player', newestFirst }).filter((e) => e.importance >= minImportance);
    return evs.slice(0, limit);
  }

  // -------------------------------------------------------------- persistence
  toJSON() {
    return {
      v: this.version, id: this.id, seed: this.seed, rng: this.rng.state, startYear: this.startYear, mode: this.mode, day: this.day, era: this.era,
      player: this.player, memory: this.memory.toJSON(), achievements: this.achievements.toJSON(), activeMatch: this.activeMatch,
      pendingMatch: this.pendingMatch, flags: this.flags, notifications: this.notifications.slice(-30),
      universe: this.universe ? this.universe.toJSON() : null,
    };
  }

  static fromJSON(j) {
    const c = new Career({ id: j.id, seed: j.seed, player: j.player, startYear: j.startYear, mode: j.mode, era: j.era });
    c.rng.state = j.rng; c.day = j.day; c.player = j.player;
    c.memory = Memory.fromJSON(j.memory);
    c.stats = recomputeStats(c.memory.ledger, c.player.id);           // projections are always re-derived from the ledger
    c.achievements = new AchievementEngine(ACHIEVEMENT_DEFS, c.memory, () => c.env());
    c.achievements.listeners.push((rec) => c._applyReward(rec));
    c.achievements.load(j.achievements);
    c.activeMatch = j.activeMatch || null; c.pendingMatch = j.pendingMatch || null; c.flags = j.flags || {};
    c.notifications = j.notifications || [];
    c.universe = j.universe ? Universe.fromJSON(j.universe) : null;
    return c;
  }
}

function getMoveName(id) { try { return getMove(id).name; } catch { return id; } }
