// Autonomous universe simulation. Every simulated day the AI roster works shows (real engine
// matches, AI vs AI), chases titles, forms feuds and alliances, betrays partners, turns, gets
// injured, improves, retires and is replaced. Results that touch the player are also written to
// the ledger as scope:'world', canon:false events (simulated alternate history).
import { Rng } from '../core/rng.js';
import { clamp } from '../core/util.js';
import { MatchEngine } from '../match/engine.js';
import { rateMatch } from '../match/rating.js';
import { generateWrestler } from '../data/generator.js';
import { eventsOn, dateOf } from './calendar.js';
import { ERAS, eraForYear } from '../data/eras.js';
import { getRel } from '../memory/world.js';

const profileOf = (w) => ({
  id: w.id, name: w.name, style: w.style, alignment: w.alignment, attrs: w.attrs, gender: w.gender, popularity: w.popularity, signatures: w.signatures, finisher: w.finisher,
  personality: w.personality, difficulty: 0.35 + w.tier * 0.13,
});
const fid = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

function yearOf(day, startYear) { return dateOf(day, startYear).getUTCFullYear(); }

/** Run one AI-vs-AI match and return a compact result */
export function runAIMatch(u, a, b, { type = 'singles', seed, title = null, ple = false } = {}) {
  const e = new MatchEngine({ seed, type, sides: [[profileOf(a)], [profileOf(b)]], playerId: null, difficulty: 0.5, timeLimit: ple ? 25 : 15 }, { human: [] });
  const r = e.state.result;
  const rating = rateMatch(e.state);
  const winner = r.winnerId ? (r.winnerId === a.id ? a : b) : null;
  return { winner, loser: winner ? (winner === a ? b : a) : null, finish: r.finish, durationSec: r.durationSec, rating: rating.stars, injuries: [a, b].map((w) => ({ id: w.id, inj: e.state.fighters[w.id].injuriesNew })), draw: !winner, finisherUsed: e.state.fighters[(winner || a).id].stats.usedFinisher };
}

export class UniverseSim {
  constructor(career, hooks = {}) {
    this.c = career;
    this.u = career.universe;
    this.hooks = hooks;
    this.stats = { matches: 0, titleChanges: 0, betrayals: 0, alliances: 0, retirements: 0, arrivals: 0, injuries: 0, turns: 0 };
  }

  /** Advance the universe up to and including `day`. */
  advanceTo(day) {
    const u = this.u, c = this.c;
    while (u.lastSimDay < day) {
      u.lastSimDay += 1;
      this.simulateDay(u.lastSimDay);
    }
  }

  simulateDay(day) {
    const u = this.u, c = this.c;
    const year = yearOf(day, c.startYear);
    const rng = new Rng(`sim:${u.seed}:${day}`);
    const dow = dateOf(day, c.startYear).getUTCDay();
    // era transitions & titles appear
    if (!u.split && year >= 2002 && day > 0 && c.era !== 'golden') { /* split handled in _transitions */ }
    this._transitions(day, year, rng);
    // shows
    const brandsDone = new Set();
    for (const key of ['main', 'second', 'dev']) {
      const show = u.brandName(key);
      if (key === 'second' && !u.split) continue;
      if (key === 'dev' && year < 2010) continue;
      const evs = eventsOn(day, c.startYear, show === 'WWF' ? 'WWF' : show);
      // pre-split shows may be named Raw/SmackDown/WWF: use any weekly show on that day for the shared roster
      let ev = evs.sort((a, b) => (b.tier || 0) - (a.tier || 0))[0];
      if (!ev && !u.split && key === 'main') {
        ev = ['WWF', 'Raw', 'SmackDown'].map((b) => eventsOn(day, c.startYear, b).sort((x, y) => (y.tier || 0) - (x.tier || 0))[0]).find(Boolean);
      }
      if (ev && !brandsDone.has(ev.id)) { brandsDone.add(ev.id); this.simulateShow(key, ev, day, rng); }
    }
    // weekly life events
    if (dow === 0) this._weekly(day, year, rng);
    this._healAndAge(day, year, rng);
  }

  // ---------------------------------------------------------------- shows
  simulateShow(key, ev, day, rng) {
    const u = this.u, c = this.c;
    const year = yearOf(day, c.startYear);
    const ple = ev.kind === 'ple';
    const me = c.player.id;
    const pool = u.available(day, (w) => w.brandKey === key && w.id !== me);
    // the player's own opponent is handled by the Game; AI sim skips the wrestler the player is booked against today
    const busy = new Set(c.flags.bookedToday && c.flags.bookedToday.day === day ? c.flags.bookedToday.ids : []);
    const free = pool.filter((w) => !busy.has(w.id));
    const matches = [];
    const used = new Set();
    // 1. title defenses due
    for (const t of u.titlesList().filter((x) => (key === 'dev' ? x.scope === 'dev' : key === 'second' ? x.scope === 'second' : x.scope === 'main') && x.holder && x.holder !== me)) {
      const champ = u.get(t.holder);
      if (!champ || champ.status !== 'active' || champ.injuredUntil > day || used.has(champ.id) || busy.has(champ.id)) continue;
      const due = day - t.lastDefenseDay >= (ple ? 14 : 24) + rng.int(0, 10);
      if (!due && !(ple && rng.chance(0.7))) continue;
      const contenders = free.filter((w) => w.gender === t.gender && w.id !== champ.id && !used.has(w.id) && w.tier >= Math.max(0, (t.cls === 'world' ? 2 : t.cls === 'secondary' ? 1 : 0)))
        .sort((a, b) => b.momentum + b.popularity / 4 - (a.momentum + a.popularity / 4));
      const ch = contenders[0];
      if (!ch) continue;
      used.add(champ.id); used.add(ch.id);
      matches.push({ a: champ, b: ch, title: t });
    }
    // 2. feuds
    for (const f of Object.values(u.feuds).filter((x) => x.status === 'active').sort((a, b) => b.heat - a.heat)) {
      if (matches.length >= (ple ? 7 : 5)) break;
      const a = u.get(f.a), b = u.get(f.b);
      if (!a || !b || a.brandKey !== key || b.brandKey !== key || used.has(a.id) || used.has(b.id) || a.injuredUntil > day || b.injuredUntil > day || a.id === me || b.id === me) continue;
      if (!rng.chance(ple ? 0.9 : 0.55)) continue;
      used.add(a.id); used.add(b.id); matches.push({ a, b, feud: f });
    }
    // 3. fill with random similar-tier pairings
    const rest = rng.shuffle(free.filter((w) => !used.has(w.id)));
    const target = ple ? 7 : 4;
    while (matches.length < target && rest.length >= 2) {
      const a = rest.shift();
      let j = rest.findIndex((x) => x.gender === a.gender && Math.abs(x.tier - a.tier) <= 1);
      if (j < 0) j = rest.findIndex((x) => x.gender === a.gender);
      if (j < 0) continue;
      const b = rest.splice(j, 1)[0];
      matches.push({ a, b });
    }
    for (const m of matches) this._playMatch(m, day, ev, rng);
  }

  _playMatch(m, day, ev, rng) {
    const u = this.u, c = this.c;
    const { a, b, title, feud } = m;
    const ple = ev.kind === 'ple';
    const seed = parseInt(`${a.id.length}${b.id.length}${day}${a.popularity}`, 10) + Math.floor(rng.next() * 1e6);
    const res = runAIMatch(u, a, b, { seed, title, ple });
    this.stats.matches += 1;
    for (const w of [a, b]) w.lastMatchDay = day;
    // injuries
    for (const x of res.injuries) for (const inj of x.inj) {
      const w = u.get(x.id); const days = inj.severity === 2 ? 45 + rng.int(0, 30) : 10 + rng.int(0, 14);
      w.injuredUntil = Math.max(w.injuredUntil, day + days); this.stats.injuries += 1;
      if (w.tier >= 3) u.note(day, 'injury', `${w.name} injured (${inj.part}).`, [w.id]);
    }
    if (res.draw) { feud && this._feudHeat(feud, 4); return; }
    const { winner, loser } = res;
    winner.record.w += 1; loser.record.l += 1;
    winner.streak = Math.max(0, winner.streak) + 1; loser.streak = Math.min(0, loser.streak) - 1;
    winner.momentum = clamp(winner.momentum + 7, 0, 100); loser.momentum = clamp(loser.momentum - 5, 0, 100);
    winner.popularity = clamp(winner.popularity + 0.15 * (ple ? 2 : 1), 1, 99); loser.popularity = clamp(loser.popularity - 0.05, 1, 99);
    // best match of the year (world level)
    const yr = yearOf(day, c.startYear);
    if (!u.yearBest[yr] || res.rating > u.yearBest[yr].rating) u.yearBest[yr] = { rating: res.rating, a: a.id, b: b.id, names: `${a.name} vs ${b.name}`, day };
    if (feud) {
      feud.matches += 1; this._feudHeat(feud, 6);
      if (feud.matches >= 3 || feud.heat > 90) { feud.status = ple ? 'ended' : feud.status; if (ple) u.note(day, 'feud_end', `${winner.name} ended the feud with ${loser.name}.`, [a.id, b.id]); }
    }
    // title result
    if (title) {
      const champ = u.get(title.holder);
      const decisive = ['pinfall', 'submission', 'objective', 'ten_count', 'falls'].includes(res.finish);
      // booking: champions are protected early in a reign (DQ finishes / interference), vulnerable late
      const reignDays = day - title.since;
      const changes = winner.id !== title.holder && decisive && rng.chance(reignDays < 90 ? 0.3 : reignDays < 180 ? 0.55 : 0.85);
      if (changes) {
        const r = u.setChampion(title.id, winner.id, day, { by: loser.id });
        this.stats.titleChanges += 1;
        u.note(day, 'title_change', `${winner.name} defeated ${loser.name} for the ${title.name}.`, [winner.id, loser.id]);
        this._ledgerWorld(day, 'world_title_change', `${winner.name} defeated ${loser.name} to win the ${title.name}.`, [winner.id, loser.id], { titleId: title.id, titleName: title.name, from: loser.id, to: winner.id });
        this.hooks.onTitleChange && this.hooks.onTitleChange(title, winner, loser, day);
      } else {
        u.recordDefense(title.id, day);
      }
    }
    // seed new feuds from notable results
    if (!feud && rng.chance(0.18) && winner.tier >= 1) this._startFeud(winner, loser, day);
  }

  _feudHeat(f, n) { f.heat = clamp(f.heat + n, 0, 100); }
  _startFeud(a, b, day) {
    const u = this.u, id = fid(a.id, b.id);
    if (u.feuds[id] && u.feuds[id].status === 'active') return;
    u.feuds[id] = { id, a: a.id, b: b.id, heat: 30, matches: 0, status: 'active', startDay: day };
    // only a bounded number of simultaneous feuds
    const act = Object.values(u.feuds).filter((x) => x.status === 'active');
    if (act.length > 10) { const old = act.sort((x, y) => x.startDay - y.startDay)[0]; old.status = 'ended'; }
  }

  // ---------------------------------------------------------------- weekly autonomy
  _weekly(day, year, rng) {
    const u = this.u, c = this.c;
    const act = u.list();
    // new alliances between compatible wrestlers
    if (rng.chance(0.35)) {
      const a = rng.pick(act), b = rng.pick(act.filter((w) => w.id !== a.id && w.brandKey === a.brandKey && w.alignment === a.alignment && w.gender === a.gender));
      if (a && b && !u.alliances[fid(a.id, b.id)]) {
        u.alliances[fid(a.id, b.id)] = { id: fid(a.id, b.id), a: a.id, b: b.id, since: day, strength: 50 };
        this.stats.alliances += 1; u.note(day, 'alliance', `${a.name} and ${b.name} formed an alliance.`, [a.id, b.id]);
        this._ledgerWorld(day, 'world_alliance', `${a.name} and ${b.name} formed an alliance.`, [a.id, b.id], {});
      }
    }
    // betrayals: ambitious, low-loyalty partners turn on allies (esp. with a title in the picture)
    for (const al of Object.values(u.alliances)) {
      const a = u.get(al.a), b = u.get(al.b);
      if (!a || !b || a.status !== 'active' || b.status !== 'active') { delete u.alliances[al.id]; continue; }
      const traitor = a.personality.ambition - a.personality.loyalty > b.personality.ambition - b.personality.loyalty ? a : b;
      const victim = traitor === a ? b : a;
      const pressure = (traitor.personality.ambition - traitor.personality.loyalty) / 100 + (u._holdsTitle(victim.id) ? 0.25 : 0) + (al.since && day - al.since > 240 ? 0.1 : 0);
      if (rng.chance(clamp(pressure * 0.05, 0, 0.12))) {
        delete u.alliances[al.id];
        this.stats.betrayals += 1;
        traitor.alignment = 'heel'; if (victim.alignment === 'heel') victim.alignment = 'face';
        this.stats.turns += 1;
        this._startFeud(victim, traitor, day);
        const msg = `${traitor.name} betrayed ${victim.name}.`;
        u.note(day, 'betrayal', msg, [traitor.id, victim.id]);
        this._ledgerWorld(day, 'world_betrayal', msg, [traitor.id, victim.id], { traitor: traitor.id, victim: victim.id });
      } else al.strength = clamp(al.strength + 1, 0, 100);
    }
    // random alignment turns for stale characters
    if (rng.chance(0.15)) {
      const w = rng.pick(act);
      if (w && w.tier >= 1 && w.streak >= 4 && w.alignment === 'face' && rng.chance(0.3)) { w.alignment = 'heel'; this.stats.turns += 1; u.note(day, 'turn', `${w.name} turned heel.`, [w.id]); }
      else if (w && w.streak <= -4 && w.alignment === 'heel' && rng.chance(0.3)) { w.alignment = 'face'; this.stats.turns += 1; u.note(day, 'turn', `${w.name} turned face.`, [w.id]); }
    }
    // skill drift: young improve, veterans decline
    for (const w of act) {
      const age = year - (w.debutYear || year);
      const d = age < 5 ? 0.04 : age > 18 ? -0.05 : 0.005;
      for (const k of Object.keys(w.attrs)) if (rng.chance(0.4)) w.attrs[k] = clamp(w.attrs[k] + d * (w.personality.ambition / 70), 15, 98);
      // tier changes with popularity
      w.tier = w.popularity > 80 ? Math.max(w.tier, 4) : w.popularity > 62 ? Math.max(w.tier, 3) : w.tier;
      w.momentum = clamp(w.momentum - 1.2, 0, 100);
    }
  }

  _healAndAge(day, year, rng) {
    const u = this.u;
    if (day % 30 === 0) {
      // real wrestlers come and go with their active windows; others retire after long careers
      for (const w of Object.values(u.roster)) {
        if (w.status === 'retired') continue;
        if (w.real && w.windows) {
          const inWin = w.windows.some(([x, y]) => year >= x && year <= y);
          const lastEnd = Math.max(...w.windows.map((q) => q[1]));
          if (w.status === 'away' && inWin) { w.status = 'active'; w.injuredUntil = 0; u.note(day, 'return', `${w.name} returns.`, [w.id]); this._ledgerWorld(day, 'world_return', `${w.name} returns to the roster.`, [w.id], {}); continue; }
          if (w.status === 'active' && !inWin && rng.chance(0.5)) {
            for (const t of u.titlesOf(w.id)) u.setChampion(t.id, null, day);
            if (year > lastEnd) { w.status = 'retired'; w.retiredDay = day; this.stats.retirements += 1; u.note(day, 'retire', `${w.name} retired.`, [w.id]); if (w.tier >= 3) this._ledgerWorld(day, 'world_retirement', `${w.name} retired from active competition.`, [w.id], {}); }
            else { w.status = 'away'; u.note(day, 'depart', `${w.name} left the roster for now.`, [w.id]); }
          }
          continue;
        }
        const age = year - (w.debutYear || year);
        if (w.status === 'active' && age > 15 + (w.tier >= 3 ? 8 : 0) && rng.chance(0.12)) {
          for (const t of u.titlesOf(w.id)) u.setChampion(t.id, null, day);
          w.status = 'retired'; w.retiredDay = day; this.stats.retirements += 1; u.note(day, 'retire', `${w.name} retired.`, [w.id]);
          if (w.tier >= 3) this._ledgerWorld(day, 'world_retirement', `${w.name} retired from active competition.`, [w.id], {});
        }
      }
      // arrivals keep the brands populated
      for (const key of ['main', 'second', 'dev']) {
        if (key === 'second' && !u.split) continue;
        if (key === 'dev' && year < 2010) continue;
        const have = u.list((w) => w.brandKey === key).length;
        const want = key === 'dev' ? 16 : 18;
        for (let i = have; i < want; i++) {
          const w = generateWrestler(u.rng, { id: `f${++u.counters.wrestlers}`, tier: key === 'dev' ? 0 : u.rng.pick([0, 1, 1, 2]), gender: u.rng.chance(year >= 2016 ? 0.34 : 0.15) ? 'F' : 'M' });
          w.brandKey = key; u._finalize(w, year, u.rng); w.debutYear = year; u.roster[w.id] = w; this.stats.arrivals += 1;
        }
      }
      u._syncBrandNames();
      // vacated titles get a new champion
      u.ensureTitles(year, day);
      for (const t of u.titlesList()) if (!t.holder) {
        const cand = u.available(day, (w) => w.gender === t.gender && w.brandKey === (t.scope === 'dev' ? 'dev' : t.scope) && !u._holdsTitle(w.id) && w.id !== this.c.player.id).sort((a, b) => u._classRank(t.cls, b) - u._classRank(t.cls, a))[0];
        if (cand) u.setChampion(t.id, cand.id, day, { by: 'vacancy' });
      }
    }
  }

  _transitions(day, year, rng) {
    const u = this.u;
    if (!u.split && year >= 2002 && dateOf(day, this.c.startYear).getUTCMonth() >= 2) {
      // brand extension: the shared roster is split into two brands
      u.split = true;
      let i = 0;
      for (const w of u.list((x) => x.brandKey === 'main').sort((a, b) => b.tier - a.tier)) w.brandKey = i++ % 2 ? 'second' : 'main';
      u._syncBrandNames();
      u.ensureTitles(year, day);
      u.note(day, 'era', 'The brand extension splits the roster into Raw and SmackDown.', []);
      this._ledgerWorld(day, 'world_era', 'The brand extension splits the roster into two brands.', [], {});
    }
    if (day % 90 === 0) u.ensureTitles(year, day);
    // NXT/dev brand appears
    if (year >= 2010 && !u.list((w) => w.brandKey === 'dev').length) {
      for (let i = 0; i < 16; i++) { const w = generateWrestler(u.rng, { id: `f${++u.counters.wrestlers}`, tier: 0 }); w.brandKey = 'dev'; u._finalize(w, year, u.rng); u.roster[w.id] = w; }
      u._syncBrandNames();
      u.ensureTitles(year, day);
    }
  }

  // ---------------------------------------------------------------- ledger bridge
  /** record a world event in the player's ledger only when it matters to the player (known relationships, rivals, top stars). */
  _ledgerWorld(day, type, summary, ids, data) {
    const c = this.c, me = c.player.id;
    const relevant = ids.some((id) => {
      const w = this.u.get(id);
      if (w && w.tier >= 3) return true;
      const rel = c.memory.world.relationships[id < me ? `${id}|${me}` : `${me}|${id}`];
      return !!rel;
    }) || type === 'world_era';
    if (!relevant) return null;
    const out = c.memory.record({ key: `world:${type}:${day}:${ids.join('+')}`, day, category: 'world', type, scope: 'world', canon: false, participants: ids, summary, importance: 2, data });
    return out.event;
  }
}
