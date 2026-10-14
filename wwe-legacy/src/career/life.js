// Personal life: wellbeing, family and social life are real, persistent numbers that pull on the career.
//   - The player spends off-days on activities (one day each), each recorded as a `life_activity` ledger event.
//   - Time erodes family closeness and drags wellbeing back toward neutral; exhaustion drains it.
//   - Wellbeing changes how fast fatigue recovers; a neglected home life costs confidence; scenarios can trigger on both numbers.
import { clamp } from '../core/util.js';

export const LIFE_DEFAULT = { wellbeing: 60, family: 50, social: 40 };

export const LIFE_ACTIVITIES = {
  family: { label: 'Time with family', desc: 'A day at home. Closeness grows; the road makes it fade.', fx: { family: 14, wellbeing: 4, fatigue: -8 }, cost: 0 },
  hobby: { label: 'Pursue a hobby', desc: 'Something that has nothing to do with wrestling.', fx: { wellbeing: 10, fatigue: -6, social: 2 }, cost: 60 },
  physio: { label: 'Physio & recovery', desc: 'Treatment, stretching, ice. Speeds healing.', fx: { wellbeing: 2, fatigue: -14 }, cost: 150, heal: 2 },
  night_out: { label: 'Night out with friends', desc: 'Good for the soul, hard on the body.', fx: { social: 14, wellbeing: 6, fatigue: 8, confidence: 1 }, cost: 120 },
  old_gym: { label: 'Visit the old gym', desc: 'Where it started. Humbling and warming.', fx: { wellbeing: 6, confidence: 2, family: 3 }, cost: 0 },
};

export const ensureLife = (p) => (p.life ||= { ...LIFE_DEFAULT });

/** how much faster (positive) or slower (negative) fatigue wears off each day */
export const recoveryBonus = (p) => ((ensureLife(p).wellbeing - 50) / 50) * 1.5;

/** called once per in-game day by Career.advanceDays (cheap; no ledger writes) */
export function lifeDay(career) {
  const p = career.player, l = ensureLife(p);
  if (p.fatigue > 75) l.wellbeing = clamp(l.wellbeing - 0.15, 0, 100);
  if (career.day % 30 === 0) {
    l.family = clamp(l.family - 5, 0, 100);
    l.social = clamp(l.social - 3, 0, 100);
    l.wellbeing = clamp(l.wellbeing + (50 - l.wellbeing) * 0.08, 0, 100);
    if (l.family < 20) p.confidence = clamp(p.confidence - 1, 0, 100);
  }
}

export function lifeView(career) {
  const p = career.player, l = ensureLife(p);
  const mood = l.wellbeing >= 75 ? 'Thriving' : l.wellbeing >= 55 ? 'Good' : l.wellbeing >= 35 ? 'Frayed' : 'Burnt out';
  return { ...l, wellbeing: Math.round(l.wellbeing), family: Math.round(l.family), social: Math.round(l.social), mood, recovery: Math.round(recoveryBonus(p) * 10) / 10, activities: LIFE_ACTIVITIES };
}

/** perform an activity (the caller advances time). Returns { message, event, unlocked, deltas } */
export function doLifeActivity(career, id) {
  const a = LIFE_ACTIVITIES[id];
  if (!a) throw new Error(`unknown activity ${id}`);
  const p = career.player, l = ensureLife(p);
  if (p.money < a.cost) throw new Error('you cannot afford that right now');
  const before = { wellbeing: l.wellbeing, family: l.family, social: l.social, fatigue: p.fatigue, confidence: p.confidence };
  for (const k of ['wellbeing', 'family', 'social']) if (a.fx[k]) l[k] = clamp(l[k] + a.fx[k], 0, 100);
  if (a.fx.fatigue) p.fatigue = clamp(p.fatigue + a.fx.fatigue, 0, 100);
  if (a.fx.confidence) p.confidence = clamp(p.confidence + a.fx.confidence, 0, 100);
  p.money -= a.cost;
  if (a.heal) for (const i of p.injuries) if (i.daysLeft > 0) i.daysLeft = Math.max(0, i.daysLeft - a.heal);
  const idx = (career.flags.lifeSeq = (career.flags.lifeSeq || 0) + 1);
  const out = career.record({
    key: `life:${career.day}:${idx}`, category: 'personal', type: 'life_activity', summary: `${p.name}: ${a.label.toLowerCase()}.`, importance: 1,
    data: { activity: id, wellbeing: Math.round(l.wellbeing), family: Math.round(l.family), social: Math.round(l.social), cost: a.cost },
  });
  return { message: `${a.label}. You feel it.`, event: out.event, unlocked: out.unlocked, deltas: { wellbeing: Math.round(l.wellbeing - before.wellbeing), family: Math.round(l.family - before.family), social: Math.round(l.social - before.social) } };
}
