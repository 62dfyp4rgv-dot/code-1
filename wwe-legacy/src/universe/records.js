// All-time records. DATA NOTE: the initial benchmark values below are well-known approximate
// milestones from wrestling history (not verified against an official database) and exist to give
// the player something to chase; everything after the start date is simulated.
import { dateOf } from './calendar.js';

export const RECORD_DEFS = {
  world_reign_days: { label: 'Longest world title reign (days)', category: 'championship', initial: { value: 2803, holder: 'Bruno Sammartino (benchmark)' } },
  world_reigns: { label: 'Most world title reigns', category: 'championship', initial: { value: 16, holder: 'Ric Flair / John Cena (benchmark)' } },
  rumble_wins: { label: 'Most Royal Rumble wins', category: 'rumble', initial: { value: 3, holder: 'Stone Cold Steve Austin (benchmark)' } },
  rumble_elims: { label: 'Most eliminations in one Rumble', category: 'rumble', initial: { value: 12, holder: 'Roman Reigns (benchmark)' } },
  rumble_survival: { label: 'Longest Rumble survival (seconds)', category: 'rumble', initial: { value: 3732, holder: 'Rey Mysterio (benchmark)' } },
  win_streak: { label: 'Longest winning streak', category: 'streak', initial: { value: 12, holder: 'Universe benchmark' } },
  five_star: { label: 'Most five-star matches', category: 'in-ring', initial: { value: 3, holder: 'Universe benchmark' } },
  title_defenses: { label: 'Most defenses in one reign', category: 'championship', initial: { value: 15, holder: 'Universe benchmark' } },
};

export function ensureRecords(u) {
  for (const [k, d] of Object.entries(RECORD_DEFS)) if (!u.records[k]) u.records[k] = { ...d.initial, label: d.label, category: d.category, day: 0, benchmark: true };
}

/** player's current value for each record */
export function playerValues(c) {
  const s = c.stats.s;
  const worldTitleIds = new Set(['world_a', 'world_b']);
  const worldReigns = s.titles.reigns.filter((r) => worldTitleIds.has(r.titleId));
  const nowDays = (r) => (r.endDay ?? c.day) - r.startDay;
  return {
    world_reign_days: Math.max(0, ...worldReigns.map(nowDays)),
    world_reigns: worldReigns.length,
    rumble_wins: s.rumble.wins,
    rumble_elims: s.rumble.bestEliminations,
    rumble_survival: s.rumble.longestSurvivalSec,
    win_streak: s.streak.bestWin,
    five_star: s.fiveStar,
    title_defenses: Math.max(0, ...s.titles.reigns.map((r) => r.defenses)),
  };
}

/** Compare player and universe; emits record_set / record_lost events. Safe to call any time (idempotent keys). */
export function checkRecords(c) {
  const u = c.universe;
  ensureRecords(u);
  const vals = playerValues(c);
  const out = [];
  const me = c.player.id;
  for (const [k, def] of Object.entries(RECORD_DEFS)) {
    const rec = u.records[k];
    const v = vals[k];
    if (v > rec.value && rec.holder !== me) {
      const prev = { ...rec };
      u.records[k] = { value: v, holder: me, day: c.day, label: def.label, category: def.category, previous: prev.value, previousHolder: prev.holder };
      const r = c.record({ key: `record:${k}:${v}`, category: 'career', type: 'record_set', summary: `${c.player.name} set a record: ${def.label} - ${v} (previous ${prev.value}, ${prev.holder}).`, importance: 4, data: { key: k, category: def.category, value: v, previous: prev.value, previousHolder: prev.holder } });
      out.push(r.event);
    } else if (rec.holder === me && v > rec.value) { rec.value = v; rec.day = c.day; }
  }
  return out;
}

/** AI results that may break records (called from the simulation). Returns events recorded for the player if they lost a record. */
export function noteAIRecord(c, key, value, holderId, day) {
  const u = c.universe;
  ensureRecords(u);
  const rec = u.records[key];
  if (!rec || value <= rec.value) return null;
  const holderName = u.get(holderId)?.name || holderId;
  const lost = rec.holder === c.player.id;
  const prev = { ...rec };
  u.records[key] = { value, holder: holderId, day, label: rec.label, category: rec.category, previous: prev.value, previousHolder: prev.holder };
  u.note(day, 'record', `${holderName} broke the record for "${rec.label}" (${value}).`, [holderId]);
  if (lost) {
    const r = c.memory.record({ key: `record_lost:${key}:${value}`, day, category: 'career', type: 'record_lost', scope: 'player', canon: false, participants: [c.player.id, holderId], summary: `${holderName} broke ${c.player.name}'s record: ${rec.label} (${value}).`, importance: 3, data: { key, value, by: holderId, previous: prev.value } });
    return r.event;
  }
  return null;
}

export const recordsHeld = (c) => Object.entries(c.universe.records).filter(([, r]) => r.holder === c.player.id).map(([k, r]) => ({ key: k, ...r }));
export const recordsLost = (c) => c.memory.ledger.ofType('record_lost');

export function yearOfDay(day, startYear) { return dateOf(day, startYear).getUTCFullYear(); }
