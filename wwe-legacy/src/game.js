// Game: the application layer. Pure logic (no DOM) that drives a career: creation, calendar,
// training, booking, the match flow, post-match decisions and persistence. The UI is a thin
// renderer over this class; tests drive the exact same methods the UI calls.
import { Rng } from './core/rng.js';
import { clamp, round1 } from './core/util.js';
import { Career } from './career/career.js';
import { gainPop } from './career/pace.js';
import { legacyScore, retirePlayer } from './career/legacy.js';
import { makeBooking, createEngine } from './career/booking.js';
import { MatchEngine } from './match/engine.js';
import { narrate } from './match/commentary.js';
import { getRuleset, MATCH_TYPE_IDS } from './match/rules.js';
import { STYLES, SIGNATURE_TEMPLATES, FINISHER_TEMPLATES, getMove } from './match/moves.js';
import { Universe, CLASS_LABEL } from './universe/universe.js';
import { UniverseSim } from './universe/sim.js';
import { RumbleEngine, createRumble, narrateRumble } from './match/rumble.js';
import { checkRecords, recordsHeld, recordsLost } from './universe/records.js';
import { maybeYearEnd } from './universe/awards.js';
import { ScenarioEngine } from './story/scenarios.js';
import { SCENARIO_TEMPLATES } from './story/scenarios/index.js';

export const scenarioEngine = new ScenarioEngine(SCENARIO_TEMPLATES);
import { generateRoster, TIERS, SIG_NAMES, FIN_NAMES } from './data/generator.js';
import { nextEvent, eventsOn, formatDate, brandsInYear, weekdayOf } from './universe/calendar.js';
import { eraForYear } from './data/eras.js';
import { getRel, getRivalry } from './memory/world.js';
import { memoryLines } from './story/dialogue.js';
import { deliverPromo, PROMO_TONES, CLAIMS } from './story/media.js';
import { appearanceOptions, startAppearance, answerAppearance, appearanceView, cancelAppearance, APPEARANCE_KINDS } from './story/appearances.js';

export const BACKGROUNDS = {
  prospect: { name: 'Performance Center Prospect', desc: 'Raw talent with the best coaching. Low experience, high ceiling.', base: 38, pop: 6, money: 3000, bonus: 22, difficulty: 0.45 },
  indie: { name: 'Independent Veteran', desc: 'Years on the road. Sharp ring skills, modest following.', base: 46, pop: 22, money: 6000, bonus: 16, difficulty: 0.5 },
  international: { name: 'International Star', desc: 'A big name overseas, new to this audience.', base: 52, pop: 38, money: 15000, bonus: 14, difficulty: 0.55 },
  established: { name: 'Established Talent', desc: 'A proven name entering a new era of your career.', base: 62, pop: 55, money: 60000, bonus: 10, difficulty: 0.6 },
};

export const TRAINING = {
  power: { label: 'Strength & Conditioning', attr: 'power' }, striking: { label: 'Striking Drills', attr: 'striking' }, grappling: { label: 'Grappling Mat Work', attr: 'grappling' },
  technical: { label: 'Technical Sparring', attr: 'technical' }, agility: { label: 'Agility & Aerial Training', attr: 'agility' }, endurance: { label: 'Cardio Endurance', attr: 'endurance' },
  toughness: { label: 'Toughness Training', attr: 'toughness' }, psychology: { label: 'Film Study & Ring Psychology', attr: 'psychology' },
  mic: { label: 'Promo Workshop', attr: 'mic' }, charisma: { label: 'Charisma Coaching', attr: 'charisma' },
};

export const PLANS = {
  balanced: { label: 'Balanced', desc: 'Adapt as the match unfolds.', tactics: {} },
  fast_start: { label: 'Fast Start', desc: 'Hit hard early: faster pace, more accuracy, burns stamina.', tactics: { pace: 'fast' } },
  wear_down: { label: 'Wear Them Down', desc: 'Work the body and drain stamina over time.', tactics: { pace: 'slow', target: 'torso' } },
  target_legs: { label: 'Cut Off the Ring', desc: 'Target the legs to blunt their mobility and aerial game.', tactics: { target: 'legs' } },
  target_head: { label: 'Go for the Head', desc: 'Aim at the head for knockdown power and finisher setups.', tactics: { target: 'head' } },
  target_arms: { label: 'Disarm Them', desc: 'Target the arms to weaken their strikes and holds.', tactics: { target: 'arms' } },
  safety_first: { label: 'Safety First', desc: 'Conservative pace, protect stamina.', tactics: { pace: 'slow' } },
};

export const ENTRANCES = {
  classic: { label: 'Classic Entrance', desc: 'Steady, professional.', heat: 4, momentum: 0 },
  showboat: { label: 'Showboat', desc: 'Milk the crowd: big heat, a little overconfidence.', heat: 12, momentum: 4, confidence: -3 },
  intense: { label: 'Silent & Intense', desc: 'Stare-down. Builds momentum, not heat.', heat: 1, momentum: 8 },
  fan_favorite: { label: 'High-Five the Fans', desc: 'Crowd connection (faces only).', heat: 10, momentum: 2, face: true },
  menace: { label: 'Menacing', desc: 'Make them hate you (heels).', heat: 9, momentum: 4, heel: true },
};

export const STIPULATION_HEAT = { singles: 0, tag: 0, no_dq: 40, submission: 30, iron_man: 55, last_man: 60, ladder: 65, cage: 65, hell_cell: 85 };

const POST_WIN = ['celebrate', 'show_respect', 'cut_promo', 'attack_rival', 'call_out', 'talk_management', 'seek_treatment', 'help_up'];
const POST_LOSS = ['show_respect', 'vow_revenge', 'request_rematch', 'argue_result', 'talk_management', 'seek_treatment', 'walk_away'];

export class Game {
  constructor({ saves = null } = {}) {
    this.saves = saves;
    this.career = null;
    this.engine = null;
    this.rumble = null;
    this.lastEvents = [];
  }

  get universe() { return this.career ? this.career.universe : null; }

  // ------------------------------------------------------------------ creation
  static creationOptions() {
    return {
      styles: STYLES, backgrounds: BACKGROUNDS, alignments: ['face', 'heel', 'tweener'], entrances: ENTRANCES,
      signatureTemplates: SIGNATURE_TEMPLATES.map((id) => ({ id, name: getMove(id).name, baseCat: getMove(id).baseCat, style: getMove(id).style })),
      finisherTemplates: FINISHER_TEMPLATES.map((id) => ({ id, name: getMove(id).name, baseCat: getMove(id).baseCat, style: getMove(id).style })),
      goals: ['Win the World Championship', 'Main event WrestleMania', 'Win the Royal Rumble', 'Become a Hall of Famer', 'Be the greatest technician', 'Build a stable and rule the locker room'],
      startYears: [1985, 1990, 1993, 1998, 2002, 2008, 2014, 2019, 2024, 2026], attrBudget: (bg) => BACKGROUNDS[bg].bonus,
      ringAttrs: ['power', 'striking', 'grappling', 'technical', 'agility', 'endurance', 'toughness', 'psychology'],
      SIG_NAMES, FIN_NAMES, tiers: TIERS,
    };
  }

  /** Create a new career. spec: { name, style, alignment, background, seed, startYear, bonus:{attr:points}, signatures:[{tpl,name}], finisher:{tpl,name}, entrance, goal } */
  newCareer(spec = {}) {
    const seed = spec.seed ?? Math.floor(Math.random() * 2 ** 31);
    const bg = BACKGROUNDS[spec.background || 'prospect'];
    if (!bg) throw new Error(`unknown background ${spec.background}`);
    const style = spec.style && STYLES.includes(spec.style) ? spec.style : 'allrounder';
    const rng = new Rng(`create:${seed}`);
    const attrs = {};
    const STYLE_HINT = { brawler: { striking: 8, toughness: 6, power: 4 }, technician: { technical: 9, grappling: 7, psychology: 4 }, highflyer: { agility: 10, technical: 3 }, powerhouse: { power: 10, toughness: 6 }, showman: { psychology: 8, striking: 3 }, submission: { grappling: 9, technical: 8 }, allrounder: {} };
    for (const k of ['power', 'striking', 'grappling', 'technical', 'agility', 'endurance', 'toughness', 'psychology']) attrs[k] = bg.base + (STYLE_HINT[style][k] || 0) + rng.int(-3, 3);
    let spent = 0;
    for (const [k, v] of Object.entries(spec.bonus || {})) {
      if (!(k in attrs)) throw new Error(`unknown attribute ${k}`);
      const add = Math.max(0, Math.min(v, bg.bonus - spent));
      attrs[k] += add; spent += add;
    }
    const sigs = (spec.signatures && spec.signatures.length ? spec.signatures : []).slice(0, 3).map((s, i) => ({ id: `player_sig${i + 1}`, name: s.name || getMove(s.tpl).name, tpl: s.tpl }));
    const fin = spec.finisher ? { id: 'player_fin', name: spec.finisher.name || 'Finisher', tpl: spec.finisher.tpl } : null;
    const startYear = spec.startYear || 2024;
    const brands = brandsInYear(startYear);
    const brand = spec.brand || (bg === BACKGROUNDS.prospect && brands.includes('NXT') ? 'NXT' : brands[0]);
    const career = new Career({
      seed, startYear, mode: spec.mode || (startYear >= 2024 ? 'modern' : 'historical'),
      player: {
        id: 'player', name: spec.name || 'The Rookie', nickname: spec.nickname, style, alignment: spec.alignment || 'face', attrs,
        signatures: sigs.length ? sigs : undefined, finisher: fin || undefined, popularity: bg.pop, money: bg.money, brand, background: spec.background || 'prospect',
        entrance: { style: spec.entrance || 'classic', music: spec.music || 'Theme' }, goals: spec.goal ? [spec.goal] : [], gender: spec.gender || 'M',
        mic: 30 + Math.round(bg.base / 3) + rng.int(0, 15), charisma: 30 + Math.round(bg.base / 3) + rng.int(0, 15),
        personality: spec.personality || { aggression: 50, ego: 50, loyalty: 50, ambition: 60 }, appearance: spec.appearance || {},
      },
    });
    career.player.difficulty = bg.difficulty;
    this.career = career;
    career.universe = Universe.create({ seed, mode: spec.mode === 'custom' ? 'custom' : career.mode, year: startYear });
    career.universe._mainBrand = brands.includes('WWF') ? 'WWF' : brands[0];
    career.universe._syncBrandNames();
    career.record({ key: 'debut', category: 'career', type: 'debut', summary: `${career.player.name} makes their professional debut${brand ? ` on ${brand}` : ''}.`, importance: 4, data: { brand, show: brand, background: spec.background || 'prospect', era: career.era } });
    career.player.contract = { endDay: career.day + 730, salary: Math.round(bg.money * 4), brand };
    career.record({ key: 'contract:initial', category: 'career', type: 'contract_signed', summary: `${career.player.name} signs a ${bg.name.toLowerCase()} contract.`, importance: 2, data: { years: 2, brand } });
    career.flags.phase = 'home';
    return career;
  }

  // ------------------------------------------------------------------ persistence
  async save(slot = 'slot1') {
    if (!this.saves) throw new Error('no save manager');
    this.career.activeMatch = this.engine ? this.engine.toJSON() : null;
    return this.saves.save(slot, this.career);
  }
  async autosave() {
    if (!this.saves || !this.career) return null;
    this.career.activeMatch = this.engine ? this.engine.toJSON() : null;
    return this.saves.autosave(this.career);
  }
  async load(slot = 'slot1') {
    const { career, recovered, error } = await this.saves.load(slot);
    this.adopt(career);
    return { recovered, error };
  }
  /** attach a career restored from a save; resumes an in-progress match exactly where it stopped */
  adopt(career) {
    this.career = career;
    this.engine = career.activeMatch ? new MatchEngine(career.activeMatch, { human: [career.player.id] }) : null;
    this.rumble = career.flags.activeRumble ? RumbleEngine.fromJSON(career.flags.activeRumble) : null;
    return this;
  }

  // ------------------------------------------------------------------ calendar / home
  get c() { return this.career; }
  today() { return formatDate(this.c.day, this.c.startYear); }
  nextEvent() { return nextEvent(this.c.day, this.c.startYear, this.c.player.brand); }
  eventToday() { const e = eventsOn(this.c.day, this.c.startYear, this.c.player.brand); return e.sort((a, b) => (b.tier || 0) - (a.tier || 0))[0] || null; }

  home() {
    const c = this.c, p = c.player;
    const ev = this.nextEvent();
    const injuries = p.injuries.filter((i) => i.daysLeft > 0);
    return {
      date: this.today(), day: c.day, era: eraForYear(c.year), phase: c.flags.phase, rumbleToday: this.rumbleAvailable(), next: ev ? { ...ev, inDays: ev.day - c.day, dateText: formatDate(ev.day, c.startYear) } : null,
      status: { fatigue: Math.round(p.fatigue), popularity: Math.round(p.popularity), confidence: Math.round(p.confidence), money: p.money, injuries, overall: c.overall() },
      record: { w: c.stats.s.wins, l: c.stats.s.losses, d: c.stats.s.draws },
      notifications: c.notifications.slice(-5), scenario: !!c.flags.scenario, lastScenario: c.flags.lastScenarioResult || null,
    };
  }

  // ------------------------------------------------------------------ time use
  _blockedByScenario() {
    if (this.c.flags.scenario) throw new Error('resolve the pending situation first');
    if (this.c.flags.retired && this.c.flags.phase !== 'retired' && typeof this.c.flags.retired === 'object') this.c.flags.phase = 'retired';
  }

  /** chance that something story-worthy happens while time passes; due obligations always surface */
  _rollScenario(days, contexts = ['weekly']) {
    const c = this.c;
    if (c.flags.scenario || c.flags.retired) return null;
    const hasDue = c.memory.world.obligations.some((o) => o.status === 'pending' && o.to === c.player.id && o.dueDay <= c.day);
    const p = 1 - Math.pow(1 - (hasDue ? 0.9 : 0.16), Math.max(1, Math.min(days, 14)));
    if (!hasDue && c.rng.next() >= p) return null;
    const inst = scenarioEngine.pick(c, { contexts, rng: c.rng });
    if (inst) c.flags.scenario = inst;
    return inst;
  }
  pendingScenario() { return this.c.flags.scenario || null; }
  resolveScenario(choiceId) {
    const c = this.c, inst = c.flags.scenario;
    if (!inst) throw new Error('no situation is waiting');
    const res = scenarioEngine.resolve(c, inst, choiceId);
    c.flags.scenario = null;
    c.flags.lastScenarioResult = { title: inst.title, text: res.text, day: c.day };
    return res;
  }

  rest() {
    const c = this.c, p = c.player;
    if (c.flags.phase !== 'home') throw new Error('finish the current match first');
    this._blockedByScenario();
    p.fatigue = clamp(p.fatigue - 22, 0, 100);
    for (const i of p.injuries) i.daysLeft = Math.max(0, i.daysLeft - 1);
    c.advanceDays(1); this._universeTick(); this._rollScenario(1);
    return { fatigue: Math.round(p.fatigue), message: 'You rested and recovered.' };
  }

  train(focus) {
    const c = this.c, p = c.player;
    const t = TRAINING[focus];
    if (!t) throw new Error(`unknown training ${focus}`);
    if (c.flags.phase !== 'home') throw new Error('finish the current match first');
    this._blockedByScenario();
    const rng = c.rng;
    const injured = p.injuries.some((i) => i.daysLeft > 0 && i.severity > 1);
    if (injured) return { ok: false, message: 'Your injury is too serious to train.' };
    const cur = t.attr === 'mic' || t.attr === 'charisma' ? p[t.attr] : p.attrs[t.attr];
    const gain = clamp((1.3 - cur / 100) * (0.6 + p.attrs.psychology / 200) * (1 - p.fatigue / 220) * (0.8 + rng.next() * 0.5), 0.05, 2.2);
    if (t.attr === 'mic' || t.attr === 'charisma') p[t.attr] = Math.min(99, p[t.attr] + gain); else p.attrs[t.attr] = Math.min(99, p.attrs[t.attr] + gain);
    const overwork = p.fatigue > 80 && rng.chance(0.18);
    p.fatigue = clamp(p.fatigue + 17, 0, 100);
    c.record({ key: `train:${c.day}`, category: 'personal', type: 'training', summary: `Training: ${t.label}.`, importance: 1, data: { focus, gain: round1(gain), fatigue: Math.round(p.fatigue) } });
    let injuryText = null;
    if (overwork) {
      const part = rng.pick(['arms', 'legs', 'torso']);
      const ev = c.record({ key: `injury:train:${c.day}`, category: 'career', type: 'injury', summary: `${p.name} strained their ${part} from overtraining.`, importance: 2, data: { part, severity: 1, days: 10, cause: 'training' } });
      p.injuries.push({ part, severity: 1, daysLeft: 10, total: 10, eventId: ev.event.id });
      injuryText = `Overtraining: you strained your ${part}.`;
    }
    c.checkMilestones();
    c.advanceDays(1); this._universeTick(); this._rollScenario(1);
    return { ok: true, gain: round1(gain), message: `${t.label}: +${round1(gain)} ${t.attr}.${injuryText ? ' ' + injuryText : ''}`, fatigue: Math.round(p.fatigue) };
  }

  advanceToNextEvent() {
    const c = this.c;
    if (c.flags.phase !== 'home') throw new Error('finish the current match first');
    this._blockedByScenario();
    const ev = this.nextEvent();
    if (!ev) throw new Error('no upcoming event');
    const n = ev.day - c.day;
    if (n > 0) { c.advanceDays(n); this._universeTick(); this._rollScenario(n, ['weekly', 'pre_show']); }
    return { day: c.day, event: ev };
  }
  _universeTick() {
    const c = this.c;
    const sim = new UniverseSim(c);
    sim.advanceTo(c.day);
    c.flags.simStats = sim.stats;
    const awards = maybeYearEnd(this);
    for (const a of awards) c.notifications.push({ kind: 'award', name: a.label, day: c.day });
    checkRecords(c);
  }

  // ------------------------------------------------------------------ booking / scouting
  suggestOpponents() {
    const c = this.c, me = c.player, u = this.universe;
    const ovr = c.overall();
    const rng = new Rng(`opp:${c.seed}:${c.day}`);
    const pool = u.available(c.day, (w) => w.id !== me.id && u.sameBrand(w, me.brand) && (w.gender === me.gender || rng.chance(0.15)));
    const cards = [];
    const seen = new Set();
    const add = (w, extra = {}) => { if (!w || seen.has(w.id)) return; seen.add(w.id); cards.push({ ...this.opponentCard(w), ...extra }); };
    // 1. matches scripted by scenarios (forced booking) come first
    const forced = c.flags.forcedMatch;
    if (forced && u.get(forced.who)) add(u.get(forced.who), { forced: true, type: forced.type, stakes: forced.stakes });
    // 1b. a Royal Rumble winner earns a WrestleMania title shot
    const todayEv = this.eventToday();
    const shot = c.flags.maniaShot;
    if (shot && todayEv && todayEv.id === 'wrestlemania' && shot.year === c.year) {
      const t = u.titles[shot.titleId];
      if (t && t.holder && t.holder !== me.id && u.get(t.holder)) add(u.get(t.holder), { title: this._titleInfo(t), stakes: 'title', forced: true, rumbleShot: true });
    }
    // 2. championship opportunities (as challenger or as champion)
    for (const t of u.titlesList()) {
      if (!this._titleApplies(t)) continue;
      if (t.holder === me.id) {
        if (c.day - t.lastDefenseDay >= 21) {
          const ch = pool.filter((w) => w.gender === t.gender && w.tier >= (t.cls === 'world' ? 2 : t.cls === 'secondary' ? 1 : 0)).sort((a, b) => b.momentum + b.popularity / 3 - (a.momentum + a.popularity / 3))[0];
          if (ch) add(ch, { title: this._titleInfo(t), stakes: 'title', defense: true });
        }
      } else if (t.holder && this._shotEligible(t)) add(u.get(t.holder), { title: this._titleInfo(t), stakes: 'title' });
    }
    // 3. ordinary opponents near your level
    const scored = pool.map((w) => ({ w, d: Math.abs(this._overall(w) - ovr) + rng.next() * 6 })).sort((a, b) => a.d - b.d);
    for (const { w } of scored) { if (cards.length >= 5) break; add(w); }
    return cards;
  }
  _titleApplies(t) {
    const me = this.c.player, u = this.universe;
    if (t.gender !== me.gender && t.cls === 'womens') return false;
    if (t.cls === 'womens' && me.gender !== 'F') return false;
    if (t.cls !== 'womens' && me.gender === 'F' && t.gender === 'M') return false;
    return t.scope === u.keyOfShow(me.brand) || (t.scope === 'main' && u.keyOfShow(me.brand) === 'main');
  }
  _titleInfo(t) { return { id: t.id, name: t.name, cls: t.cls, label: CLASS_LABEL[t.cls], holder: t.holder }; }
  _shotEligible(t) {
    const c = this.c, me = c.player;
    const last = c.flags.lastTitleShot ?? -999;
    if (c.day - last < 84) return false;
    const recent = c.memory.ledger.query({ types: ['match_result'], scope: 'player', newestFirst: true, limit: 5 });
    const wins = recent.filter((e) => e.data.result === 'win').length;
    const champ = this.universe.get(t.holder);
    return me.popularity >= t.minPop && wins >= 4 && champ && c.overall() >= this._overall(champ) - 14 && c.stats.s.matches >= 5;
  }
  _overall(w) { const v = Object.values(w.attrs); return v.reduce((a, b) => a + b, 0) / v.length; }
  opponentCard(w) {
    const c = this.c, me = c.player.id;
    const rel = getRel(c.memory.world, me, w.id), rv = getRivalry(c.memory.world, me, w.id);
    const st = c.stats.s.opponents[w.id];
    return {
      id: w.id, name: w.name, style: w.style, alignment: w.alignment, overall: Math.round(this._overall(w)), popularity: Math.round(w.popularity), tier: w.tier,
      record: st ? `${st.wins}-${st.losses}${st.draws ? `-${st.draws}` : ''}` : 'first meeting', rivalry: rv ? { heat: Math.round(rv.heat), status: rv.status } : null,
      tags: rel.tags, finisher: w.finisher?.name, titles: this.universe.titlesOf(w.id).map((t) => t.name),
    };
  }
  scout(opponentId) {
    const c = this.c, w = this.universe.get(opponentId);
    const entries = Object.entries(w.attrs).sort((a, b) => a[1] - b[1]);
    const weak = entries.slice(0, 2).map(([k]) => k), strong = entries.slice(-2).map(([k]) => k);
    const prefer = { brawler: 'strikes and corner attacks', technician: 'grapples and holds', highflyer: 'aerial attacks and counters', powerhouse: 'power moves and slams', showman: 'signature moves and taunts', submission: 'submission holds', allrounder: 'a bit of everything' }[w.style];
    const tips = [];
    if (w.attrs.endurance < 55) tips.push('Tires quickly: a slow, grinding pace can wear them down.');
    if (w.attrs.agility < 50) tips.push('Slow on their feet: dodging and aerial attacks should land.');
    if (w.attrs.toughness < 50) tips.push('Fragile: heavy strikes will hurt.');
    if (w.attrs.technical > 70) tips.push('Strong counter-wrestler: avoid predictable grapples.');
    if (w.attrs.power > 75) tips.push('Powerful: brace or block their big moves rather than trading.');
    if (!tips.length) tips.push('Well-rounded. Stay flexible.');
    const memory = memoryLines(c.memory, c.player.id, w.id, w.name, { speaker: 'player', max: 3 });
    return { id: w.id, name: w.name, style: w.style, favours: prefer, weak, strong, finisher: w.finisher?.name, tips, history: memory };
  }

  availableStipulations(opponentId) {
    const rv = getRivalry(this.c.memory.world, this.c.player.id, opponentId);
    const heat = rv ? rv.heat : 0;
    return MATCH_TYPE_IDS.filter((t) => t !== 'tag').map((t) => ({ id: t, name: getRuleset(t).name, desc: getRuleset(t).desc, unlocked: heat >= STIPULATION_HEAT[t], need: STIPULATION_HEAT[t], heat: Math.round(heat) }));
  }

  /** Book the match for the next event. Returns a booking summary. */
  prepareMatch({ opponentId, type = 'singles', plan = 'balanced', entrance, stakes = null } = {}) {
    const c = this.c;
    if (c.flags.phase !== 'home') throw new Error('a match is already in progress');
    this._blockedByScenario();
    const ev = this.nextEvent();
    if (!ev || ev.day !== c.day) throw new Error('there is no show today - advance to the next event first');
    const w = this.universe.get(opponentId);
    if (!w) throw new Error('unknown opponent');
    const stips = this.availableStipulations(opponentId);
    const forced = c.flags.forcedMatch && c.flags.forcedMatch.who === opponentId ? c.flags.forcedMatch : null;
    if (forced) { type = forced.type || type; stakes = forced.stakes || stakes; }
    if (type !== 'singles' && !forced && !stips.find((s) => s.id === type)?.unlocked) throw new Error(`${type} is not unlocked against this opponent yet`);
    let title = null;
    if (stakes === 'title') {
      title = this.universe.titlesList().find((t) => this._titleApplies(t) && (t.holder === opponentId || (t.holder === c.player.id && (this.suggestOpponents().some((o) => o.id === opponentId && o.defense) || forced))));
      // a Royal Rumble winner may challenge for a title of either brand at WrestleMania
      const shot = c.flags.maniaShot, shotTitle = shot && ev.id === 'wrestlemania' && shot.year === c.year ? this.universe.titles[shot.titleId] : null;
      if (!title && shotTitle && shotTitle.holder === opponentId) title = shotTitle;
      if (!title && forced) { stakes = null; /* the scripted title stakes lapsed (title changed hands): book it as a non-title match */ }
      else if (!title) throw new Error('no championship is available against this opponent');
      title = title ? this._titleInfo(title) : null;
    }
    if (!PLANS[plan]) throw new Error('unknown plan');
    const ent = entrance || c.player.entrance.style;
    let partners = [], oppPartners = [];
    if (type === 'tag') ({ partners, oppPartners } = this._tagPartners(w));
    const booking = makeBooking(c, [w], {
      partners, opponentPartners: oppPartners,
      type, show: ev.displayName || ev.name, ppv: ev.kind === 'ple' ? ev.displayName : null, ppvTier: ev.kind === 'ple' ? ev.tier : 0,
      mainEvent: ev.kind === 'ple' || c.player.popularity > 70, title, label: `${PLANS[plan].label} / ${ENTRANCES[ent].label}`, storyline: this._storylineWith(w.id),
    });
    booking.plan = plan; booking.entrance = ent;
    c.pendingMatch = booking;
    c.flags.bookedToday = { day: c.day, ids: [opponentId, ...booking.partners.map((p) => p.id), ...booking.opponentPartners.map((p) => p.id)] };
    if (title) c.flags.lastTitleShot = c.day;
    c.flags.phase = 'prematch';
    return booking;
  }
  /** Pick tag partners: the player's best ally (or a compatible same-brand wrestler) and the opponent's partner. */
  _tagPartners(opp) {
    const c = this.c, u = this.universe, me = c.player;
    const asProfile = (w) => ({ id: w.id, name: w.name, style: w.style, alignment: w.alignment, attrs: w.attrs, gender: w.gender, popularity: w.popularity, signatures: w.signatures, finisher: w.finisher, personality: w.personality, difficulty: 0.35 + (w.tier ?? 1) * 0.13 });
    const pool = u.available(c.day, (w) => w.id !== me.id && w.id !== opp.id && u.sameBrand(w, me.brand));
    const allies = pool.filter((w) => { const r = getRel(c.memory.world, me.id, w.id); return r.tags.includes('ally') || r.tags.includes('mentor'); });
    const mine = (allies[0] || pool.filter((w) => w.alignment === me.alignment).sort((a, b) => Math.abs(this._overall(a) - c.overall()) - Math.abs(this._overall(b) - c.overall()))[0] || pool[0]);
    if (!mine) throw new Error('no tag partner is available');
    const rest = pool.filter((w) => w.id !== mine.id);
    const alliance = Object.values(u.alliances).find((a) => (a.a === opp.id || a.b === opp.id) && rest.some((w) => w.id === (a.a === opp.id ? a.b : a.a)));
    const theirs = (alliance && u.get(alliance.a === opp.id ? alliance.b : alliance.a)) || rest.filter((w) => w.alignment === opp.alignment).sort((a, b) => Math.abs(this._overall(a) - this._overall(opp)) - Math.abs(this._overall(b) - this._overall(opp)))[0] || rest[0];
    if (!theirs) throw new Error('no opposing tag partner is available');
    return { partners: [asProfile(mine)], oppPartners: [asProfile(theirs)] };
  }
  _storylineWith(oppId) { const rv = getRivalry(this.c.memory.world, this.c.player.id, oppId); return rv ? rv.id : null; }

  // ------------------------------------------------------------------ Royal Rumble
  rumbleAvailable() {
    const c = this.c, ev = this.eventToday();
    if (!ev || !ev.rumble || c.flags.phase !== 'home') return false;
    return c.player.gender === 'M' || c.year >= 2018;
  }
  /** Draw an entry number, build the 30-wrestler field and start the Rumble. */
  startRumble({ entry } = {}) {
    const c = this.c, u = this.universe, me = c.player;
    if (!this.rumbleAvailable()) throw new Error('there is no Royal Rumble today');
    this._blockedByScenario();
    const women = me.gender === 'F';
    const rng = new Rng(`rumble:${c.seed}:${c.year}`);
    const pool = u.list((w) => w.id !== me.id && w.gender === (women ? 'F' : 'M') && w.injuredUntil <= c.day).sort((a, b) => b.tier - a.tier || b.popularity - a.popularity);
    const picks = pool.slice(0, 29);
    // top up with generated extras if the roster is short
    let gen = 0;
    while (picks.length < 29) { picks.push({ id: `rx${++gen}`, name: `Local Hopeful ${gen}`, attrs: { power: 40, striking: 40, grappling: 40, technical: 40, agility: 40, endurance: 50, toughness: 40, psychology: 40 }, tier: 0, alignment: 'tweener' }); }
    const rivals = Object.values(c.memory.world.rivalries).filter((r) => (r.a === me.id || r.b === me.id) && r.heat >= 20).map((r) => (r.a === me.id ? r.b : r.a)).filter((id) => picks.some((p) => p.id === id));
    const allies = [];
    const profile = { id: me.id, name: me.name, attrs: me.attrs, tier: Math.min(4, Math.floor(me.popularity / 25)), alignment: me.alignment };
    const entrants = [...picks.map((w) => ({ id: w.id, name: w.name, attrs: w.attrs, tier: w.tier, alignment: w.alignment })), profile];
    const number = entry || c.flags.rumbleEntry || rng.int(1, 30);
    c.flags.rumbleEntry = null;
    this.rumble = new RumbleEngine(createRumble({ seed: rng.int(1, 2 ** 30), year: c.year, entrants, playerId: me.id, playerEntry: number, rivals, allies, women }), { human: true });
    c.flags.phase = 'rumble'; c.flags.activeRumble = this.rumble.toJSON();
    c.flags.bookedToday = { day: c.day, ids: [] };
    return { entry: number, decision: this.rumble.getDecision() };
  }
  rumbleChoose(id) {
    const e = this.rumble;
    if (!e) throw new Error('no Rumble in progress');
    const evs = e.choose(id);
    this.c.flags.activeRumble = e.toJSON();
    const lines = evs.map((x) => ({ seq: x.seq, type: x.type, text: narrateRumble(e.state, x), actor: x.id || x.by })).filter((l) => l.text);
    return { lines, over: e.over, decision: e.getDecision() };
  }
  rumbleView() {
    const e = this.rumble; if (!e) return null;
    const s = e.state, me = s.fighters[s.playerId];
    return {
      t: s.t, entered: s.nextEntry, ringCount: s.ring.length, entry: me.entry, out: !!me.out, elims: me.elims,
      me: { stamina: Math.round(me.stamina), max: Math.round(me.max), momentum: Math.round(me.momentum), ally: me.ally ? s.fighters[me.ally].name : null },
      ring: s.ring.map((id) => ({ id, name: s.fighters[id].name, stamina: Math.round(s.fighters[id].stamina / s.fighters[id].max * 100), isMe: id === s.playerId, rival: s.rivals.includes(id), ally: me.ally === id })),
      next: s.nextEntry < 30 ? s.order[s.nextEntry] === s.playerId ? 'YOU' : `#${s.nextEntry + 1}` : null, year: s.year, women: s.women,
    };
  }
  recentRumbleLines(n = 10) {
    const e = this.rumble; if (!e) return [];
    return e.state.events.slice(-n * 2).map((x) => ({ seq: x.seq, type: x.type, text: narrateRumble(e.state, x), actor: x.id || x.by })).filter((l) => l.text).slice(-n);
  }
  finishRumble() {
    const c = this.c, e = this.rumble, me = c.player;
    if (!e || !e.over) throw new Error('the Rumble is not over');
    const sum = e.playerSummary();
    const winnerName = e.state.fighters[sum.winner].name;
    const out = c.record({
      key: `rumble:${c.year}`, category: 'match', type: 'rumble_result', participants: [me.id, ...(sum.eliminatedBy ? [sum.eliminatedBy] : []), ...(sum.winner !== me.id ? [sum.winner] : [])].filter((x) => !x.startsWith('rx')),
      summary: sum.won ? `${me.name} won the ${c.year} ${me.gender === 'F' ? "Women's " : ''}Royal Rumble!` : `${me.name} entered #${sum.entryNumber} in the ${c.year} Royal Rumble and lasted ${Math.round(sum.survivalSec / 60)} minutes (${sum.eliminations} eliminations). ${winnerName} won.`,
      importance: sum.won ? 5 : 3, data: { ...sum, ppv: 'Royal Rumble', ppvTier: 1, era: c.era },
    });
    gainPop(me, sum.won ? 6 : 0.4 * sum.eliminations + (sum.finalTwo ? 2 : 0.3));
    me.fatigue = clamp(me.fatigue + 35, 0, 100); me.money += 2500 + sum.eliminations * 400 + (sum.won ? 25000 : 0);
    if (sum.won) {
      const t = this.universe.titlesList('world').find((x) => this._titleApplies(x) && x.holder) || this.universe.titlesList().find((x) => this._titleApplies(x) && x.cls !== 'developmental' && x.holder);
      if (t) c.flags.maniaShot = { year: c.year, titleId: t.id };
    }
    checkRecords(c);
    const result = { ...sum, event: out.event, unlocked: out.unlocked, winnerName, summary: out.event.summary };
    c.flags.phase = 'home'; c.flags.activeRumble = null; this.rumble = null;
    c.advanceDays(1); this._universeTick();
    return result;
  }

  // ------------------------------------------------------------------ the match
  startMatch() {
    const c = this.c;
    if (c.flags.phase !== 'prematch') throw new Error('book a match first');
    const b = c.pendingMatch;
    const engine = createEngine(c, b);
    const me = engine.state.fighters[c.player.id];
    const plan = PLANS[b.plan];
    Object.assign(me.tactics, plan.tactics);
    const ent = ENTRANCES[b.entrance];
    const heelOk = c.player.alignment === 'heel', faceOk = c.player.alignment === 'face';
    if ((ent.face && !faceOk) || (ent.heel && !heelOk)) { /* mismatch: reduced effect */ engine.state.crowd.heat += ent.heat * 0.3; } else engine.state.crowd.heat += ent.heat;
    me.momentum += ent.momentum || 0; me.confidence = clamp(me.confidence + (ent.confidence || 0), 0, 100);
    this.engine = engine;
    c.flags.phase = 'match';
    c.activeMatch = engine.toJSON();
    this.lastEvents = [];
    return this.decision();
  }

  decision() {
    if (!this.engine) return null;
    const d = this.engine.getDecision();
    if (!d) return null;
    return d;
  }

  /** Make a choice; returns narrated lines for all events that followed. */
  choose(optionId) {
    const e = this.engine;
    if (!e) throw new Error('no active match');
    const evs = e.choose(optionId);
    this.c.activeMatch = e.toJSON();
    this.lastEvents = evs;
    const lines = evs.map((ev) => ({ seq: ev.seq, type: ev.type, text: narrate(e.state, ev), actor: ev.actor, round: ev.round })).filter((l) => l.text);
    return { lines, over: e.over, decision: this.decision() };
  }

  matchView() {
    const e = this.engine; if (!e) return null;
    const s = e.state, me = s.fighters[this.c.player.id];
    const opp = s.fighters[s.teams[1 - me.side][0]];
    const legalOpp = s.fighters[Object.values(s.fighters).find((f) => f.side !== me.side && f.legal)?.id] || opp;
    const view = (f) => ({ id: f.id, name: f.name, stamina: Math.round(f.stamina), maxStamina: f.maxStamina, momentum: Math.round(f.momentum), confidence: Math.round(f.confidence), dmg: Object.fromEntries(Object.entries(f.dmg).map(([k, v]) => [k, Math.round(v)])), pos: f.pos, legal: f.legal, alignment: f.alignment, dazed: f.dazed > 0, tactics: f.tactics, style: f.style });
    return {
      type: s.type, rules: s.rules, time: Math.round(s.time), timeLimit: s.timeLimit, phase: s.phase, round: s.round, crowd: Math.round(s.crowd.heat),
      referee: s.referee.state, me: view(me), opp: view(legalOpp), team: s.rules.tag ? { mine: s.teams[me.side].map((id) => view(s.fighters[id])), theirs: s.teams[1 - me.side].map((id) => view(s.fighters[id])) } : null,
      falls: s.falls, mySide: me.side, warnings: s.warnings, objective: s.objective, climb: { me: me.climb, opp: legalOpp.climb },
    };
  }

  /** After the engine reports over: write the result into the career. */
  finishMatch() {
    const c = this.c;
    if (!this.engine || !this.engine.over) throw new Error('match is not over');
    const booking = c.pendingMatch;
    const out = c.recordMatch(this.engine, booking);
    const st = this.engine.state;
    const result = {
      result: out.result, finish: st.result.finish, rating: out.rating, durationSec: st.result.durationSec, event: out.event, unlocked: [...out.unlocked, ...out.events.flatMap(() => [])],
      summary: out.event.summary, opponents: booking.opponents.map((o) => o.name), matchId: booking.matchId, finishMove: out.event.data.finishMoveName,
      stats: out.event.data.stats, injuries: st.fighters[c.player.id].injuriesNew,
    };
    result.titleOutcome = this._titleOutcome(booking, out);
    checkRecords(c);
    if (c.flags.forcedMatch && c.flags.forcedMatch.who === booking.opponents[0].id) c.flags.forcedMatch = null;
    c.flags.postMatch = { matchId: booking.matchId, result: out.result, opponentId: booking.opponents[0].id, done: [], eventId: out.event.id };
    c.flags.lastResult = { result: out.result, summary: out.event.summary };
    c.flags.phase = 'postmatch';
    c.pendingMatch = null; c.activeMatch = null; this.lastEngine = this.engine; this.engine = null;
    return result;
  }

  /** last N narrated lines of the active match (used to rebuild the feed after a reload) */
  recentLines(n = 12) {
    if (!this.engine) return [];
    const st = this.engine.state;
    return st.events.slice(-n * 2).map((ev) => ({ seq: ev.seq, type: ev.type, text: narrate(st, ev), actor: ev.actor, round: ev.round })).filter((l) => l.text).slice(-n);
  }

  /** Rebuild the result screen from the ledger (works after a reload while in the post-match phase). */
  resultView() {
    const c = this.c, pm = c.flags.postMatch;
    if (!pm) return null;
    const ev = c.memory.ledger.get(pm.eventId);
    const d = ev.data;
    const names = d.opponents.map((id) => this.universe.get(id)?.name || id);
    const unlocked = c.memory.ledger.query({ types: ['achievement_unlocked'], where: { 'data.trigger': pm.eventId } }).map((e) => ({ id: e.data.achievementId, name: e.data.name, explanation: e.data.explanation }));
    const injuries = c.memory.ledger.query({ types: ['injury'] }).filter((e) => e.refs.includes(pm.eventId)).map((e) => ({ part: e.data.part, severity: e.data.severity }));
    return { result: d.result, finish: d.finish, rating: { stars: d.rating, breakdown: d.ratingBreakdown }, durationSec: d.durationSec, event: ev, unlocked, summary: ev.summary, opponents: names, matchId: d.matchId, stats: d.stats, injuries };
  }

  /** championship consequences of a finished match (single place where titles change hands) */
  _titleOutcome(booking, out) {
    const c = this.c, u = this.universe, me = c.player.id;
    if (!booking.title) return null;
    const t = u.titles[booking.title.id];
    const ev = out.event, d = ev.data;
    const decisive = ['pinfall', 'submission', 'objective', 'ten_count', 'falls'].includes(d.finish);
    const mk = (type, data, summary) => c.record({ key: `${ev.key}:${type}`, category: 'career', type, refs: [ev.id], participants: [me, ...d.opponents], summary, importance: 4, data: { titleId: t.id, titleName: t.name, titleClass: t.cls, era: c.era, ppvTier: d.ppvTier, ...data } });
    if (t.holder === me) {
      if (d.result === 'loss' && decisive) {
        u.setChampion(t.id, d.opponents[0], c.day, { by: me });
        mk('title_loss', { to: d.opponents[0] }, `${c.player.name} lost the ${t.name} to ${booking.opponents[0].name}.`);
        return 'lost';
      }
      const success = d.result !== 'loss' || !decisive;
      u.recordDefense(t.id, c.day);
      mk('title_defense', { success: true, defenseNumber: t.defenses, opponent: d.opponents[0], retainedBy: d.finish }, `${c.player.name} retained the ${t.name} (defense #${t.defenses}).`);
      return 'retained';
    }
    if (d.result === 'win' && decisive) {
      u.setChampion(t.id, me, c.day, { by: d.opponents[0] });
      mk('title_win', { from: d.opponents[0], wmWin: d.ppvTier >= 2 }, `${c.player.name} won the ${t.name} from ${booking.opponents[0].name}!`);
      return 'won';
    }
    return 'no-change';
  }

  // ------------------------------------------------------------------ post-match decisions
  postMatchOptions() {
    const c = this.c, pm = c.flags.postMatch;
    if (!pm) return [];
    const oppId = pm.opponentId;
    const opp = this.universe.get(oppId);
    const win = pm.result === 'win';
    const ids = (win ? POST_WIN : POST_LOSS).filter((id) => !pm.done.includes(id));
    const injured = c.player.injuries.some((i) => i.daysLeft > 0);
    const rv = getRivalry(c.memory.world, c.player.id, oppId);
    const label = {
      celebrate: ['Celebrate with the Crowd', 'Soak it in. Popularity up; heels get more heat.'],
      show_respect: [`Show Respect to ${opp.name}`, 'Shake hands. Builds mutual respect and may open an alliance.'],
      cut_promo: ['Cut a Promo', 'Grab the mic while the crowd is hot.'],
      attack_rival: [`Attack ${opp.name} After the Bell`, 'Cheap shot. Raises rivalry heat. Risky for faces.'],
      call_out: ['Call Out the Champion', 'Publicly demand a title shot (a promise you must keep).'],
      talk_management: ['Talk to Management', 'Ask for feedback on your performance and push for a bigger spot.'],
      seek_treatment: ['See the Trainers', injured ? 'Speed up recovery for a fee.' : 'Get checked out and recover some fatigue.'],
      help_up: [`Help ${opp.name} Up`, 'Classy gesture. Crowd and opponent notice.'],
      vow_revenge: ['Vow Revenge', 'Promise to beat them next time. The promise is remembered.'],
      request_rematch: ['Demand a Rematch', 'Push management for a rematch; builds the rivalry.'],
      argue_result: ['Protest the Result', rv && pm.result === 'loss' ? 'Argue the finish. Heat with the opponent, small hit with management.' : 'Argue with the referee. Draws heat.'],
      walk_away: ['Walk Away Quietly', 'Take the loss on the chin. Preserves your dignity.'],
    };
    return ids.map((id) => ({ id, label: label[id][0], desc: label[id][1] }));
  }

  postMatchChoose(id) {
    const c = this.c, pm = c.flags.postMatch, p = c.player, rng = c.rng;
    if (!pm) throw new Error('no post-match decision pending');
    if (!this.postMatchOptions().some((o) => o.id === id)) throw new Error(`"${id}" is not available`);
    const opp = this.universe.get(pm.opponentId);
    const key = `post:${pm.matchId}:${id}`;
    const ref = [pm.eventId];
    const rec = (spec) => c.record({ key, refs: ref, participants: [p.id, opp.id], ...spec });
    let text = '';
    switch (id) {
      case 'celebrate': gainPop(p, 0.6); p.confidence = clamp(p.confidence + 3, 0, 100);
        rec({ category: 'personal', type: 'decision', summary: `${p.name} celebrated with the crowd.`, data: { choice: id } }); text = 'The crowd roars as you celebrate.'; break;
      case 'show_respect': case 'help_up':
        rec({ category: 'relationship', type: 'respect_shown', summary: `${p.name} showed respect to ${opp.name} after the match.`, importance: 2, data: { choice: id, matchId: pm.matchId } });
        gainPop(p, p.alignment === 'face' ? 0.4 : 0); text = `${opp.name} nods back. Respect earned.`; break;
      case 'attack_rival': {
        rec({ category: 'story', type: 'decision', summary: `${p.name} attacked ${opp.name} after the bell.`, importance: 3, data: { choice: id, effects: this._heatFx(opp.id, 12, { respect: -3 }) } });
        gainPop(p, p.alignment === 'heel' ? 0.5 : -0.8); text = `You blindside ${opp.name}. The arena erupts.`; break;
      }
      case 'cut_promo': text = 'You grab a microphone. (Open Media to deliver the promo.)'; c.flags.promoPending = { target: opp.id, context: 'post_match' }; break;
      case 'call_out': text = 'You call out the champion. (Open Media to make it official.)'; c.flags.promoPending = { target: null, context: 'call_out' }; break;
      case 'talk_management': {
        const stars = c.memory.ledger.get(pm.eventId).data.rating;
        const fb = stars >= 4 ? 'Management loved it - expect a bigger spot.' : stars >= 3 ? 'Solid work. Keep it up.' : 'They were underwhelmed. Tighten up your pacing.';
        rec({ category: 'story', type: 'decision', summary: `${p.name} discussed the performance with management: ${fb}`, importance: 2, data: { choice: id, rating: stars } });
        if (stars >= 4) gainPop(p, 0.5);
        text = fb; break;
      }
      case 'seek_treatment': {
        const cost = 400 + Math.round(p.fatigue * 4);
        if (p.money < cost) { text = 'You cannot afford treatment right now.'; return { ok: false, message: text }; }
        p.money -= cost; p.fatigue = clamp(p.fatigue - 15, 0, 100);
        for (const i of p.injuries) if (i.daysLeft > 0) i.daysLeft = Math.ceil(i.daysLeft * 0.7);
        rec({ category: 'personal', type: 'decision', summary: `${p.name} paid $${cost} for medical treatment.`, data: { choice: id, cost } }); text = `Treatment costs $${cost}. You feel better.`; break;
      }
      case 'vow_revenge':
        c.record({ key: `promise:${pm.matchId}:revenge`, category: 'promo', type: 'promise_made', refs: ref, participants: [p.id, opp.id], summary: `${p.name} vowed to beat ${opp.name}.`, importance: 3,
          data: { promiseId: `pr:revenge:${pm.matchId}`, kind: 'win_match', target: opp.id, text: `I will beat ${opp.name}`, deadlineDay: c.day + 120 } });
        rec({ category: 'story', type: 'decision', summary: `${p.name} vowed revenge on ${opp.name}.`, data: { choice: id } }); text = 'You promise the world you will get your win back.'; break;
      case 'request_rematch': rec({ category: 'story', type: 'decision', summary: `${p.name} demanded a rematch with ${opp.name}.`, importance: 3, data: { choice: id, effects: this._heatFx(opp.id, 8, {}) } }); text = 'Management notes your request.'; break;
      case 'argue_result': rec({ category: 'story', type: 'decision', summary: `${p.name} protested the result.`, data: { choice: id, effects: this._heatFx(opp.id, 5, {}) } }); p.popularity = clamp(p.popularity - 0.2, 0, 100); text = 'You make your case. Nobody changes their mind.'; break;
      case 'walk_away': p.confidence = clamp(p.confidence + 1, 0, 100); rec({ category: 'personal', type: 'decision', summary: `${p.name} walked away quietly.`, data: { choice: id } }); text = 'You leave with your head high.'; break;
      default: throw new Error(`unhandled post-match option ${id}`);
    }
    pm.done.push(id);
    return { ok: true, message: text };
  }

  /** declarative rivalry/relationship effects for a decision event (applied by memory/rules.js) */
  _heatFx(oppId, heat, rel = {}) {
    const me = this.c.player.id;
    return { rivalry: [{ a: me, b: oppId, heat }], rel: [{ from: oppId, to: me, heat, ...rel }] };
  }

  // ------------------------------------------------------------------ media
  promoOptions() { return { tones: PROMO_TONES, claims: CLAIMS, pending: this.c.flags.promoPending || null }; }
  promo(o) {
    const r = deliverPromo(this.c, o);
    this.c.flags.promoPending = null;
    return r;
  }

  // ---- legacy, retirement, Hall of Fame
  legacyPreview() { return legacyScore(this.c); }
  retire(reason = 'choice') {
    if (this.c.flags.retired && typeof this.c.flags.retired === 'object') throw new Error('already retired');
    this._blockedByScenario();
    if (this.c.flags.phase !== 'home') throw new Error('finish the current match first');
    const r = retirePlayer(this.c, reason);
    this.c.flags.phase = 'retired';
    return r;
  }
  get retired() { return !!this.c.flags.retired; }

  // ---- interviews, podcasts, press conferences
  appearanceOptions() { return appearanceOptions(this.c); }
  startAppearance(kind) { this._blockedByScenario(); return startAppearance(this.c, kind, { nextEvent: this.nextEvent() }); }
  answerAppearance(id) { return answerAppearance(this.c, id, { nextEvent: this.nextEvent() }); }
  appearanceView() { return appearanceView(this.c); }
  cancelAppearance() { cancelAppearance(this.c); }

  endPostMatch() {
    const c = this.c;
    c.flags.postMatch = null; c.flags.phase = 'home';
    c.advanceDays(1); this._universeTick(); this._rollScenario(1, ['weekly', 'post_match', 'post_show']);
    return this.home();
  }
}
