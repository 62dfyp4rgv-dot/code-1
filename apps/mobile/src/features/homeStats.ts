/** Pure helpers for the Home quick-glance visuals (form guide, league-position trend). */
import type { FixtureView, WorldState } from '@fu/engine';

export type Result = 'W' | 'D' | 'L';
export interface FormEntry { id: string; result: Result; gf: number; ga: number; opponent: string; home: boolean }

/** Form guide (oldest first) for `clubId` from played fixtures; penalties decide a level knockout tie. */
export function formEntries(fixtures: readonly FixtureView[], clubId: string): FormEntry[] {
  const out: FormEntry[] = [];
  for (const f of fixtures) {
    if (f.status !== 'played' || !f.score) continue;
    const m = /^(\d+)-(\d+)/.exec(f.score);
    if (!m) continue;
    const home = f.home.id === clubId;
    if (!home && f.away.id !== clubId) continue;
    const hg = Number(m[1]);
    const ag = Number(m[2]);
    const gf = home ? hg : ag;
    const ga = home ? ag : hg;
    let result: Result = gf > ga ? 'W' : gf < ga ? 'L' : 'D';
    const p = f.pens ? /^(\d+)-(\d+)/.exec(f.pens) : null;
    if (result === 'D' && p) {
      const pf = Number(home ? p[1] : p[2]);
      const pa = Number(home ? p[2] : p[1]);
      result = pf > pa ? 'W' : 'L';
    }
    out.push({ id: f.id, result, gf, ga, opponent: home ? f.away.name : f.home.name, home });
  }
  return out;
}

export function formPoints(form: readonly FormEntry[]): number {
  return form.reduce((s, e) => s + (e.result === 'W' ? 3 : e.result === 'D' ? 1 : 0), 0);
}

/**
 * League position of `clubId` after each of its own league matches this season (oldest first), rebuilt from the played
 * fixtures (3-1-0 points, goal difference, goals for, then name as tie-breaks). The engine does not store a position
 * history, so this is an approximation of its table rules; callers should pin the last point to the real position.
 */
export function positionHistory(world: Pick<WorldState, 'competitions'>, leagueId: string, clubId: string): number[] {
  const comp = world.competitions[leagueId];
  if (!comp) return [];
  const firstStage = comp.fixtures[0]?.stageId;
  const played = comp.fixtures.filter((f) => f.status === 'played' && f.result && f.season === comp.season && f.stageId === firstStage).sort((a, b) => a.day - b.day);
  const stats = new Map<string, { pts: number; gf: number; ga: number }>();
  for (const id of comp.entrants) stats.set(id, { pts: 0, gf: 0, ga: 0 });
  const out: number[] = [];
  const positionOf = (): number => {
    const me = stats.get(clubId);
    if (!me) return 0;
    let better = 0;
    for (const [id, s] of stats) {
      if (id === clubId) continue;
      const d = s.pts - me.pts || s.gf - s.ga - (me.gf - me.ga) || s.gf - me.gf;
      if (d > 0 || (d === 0 && id < clubId)) better++;
    }
    return better + 1;
  };
  let i = 0;
  while (i < played.length) {
    const day = (played[i] as (typeof played)[number]).day;
    let mine = false;
    while (i < played.length && (played[i] as (typeof played)[number]).day === day) {
      const f = played[i] as (typeof played)[number];
      const r = f.result as NonNullable<typeof f.result>;
      const h = stats.get(f.home);
      const a = stats.get(f.away);
      if (h && a) {
        h.gf += r.homeGoals; h.ga += r.awayGoals; a.gf += r.awayGoals; a.ga += r.homeGoals;
        if (r.homeGoals > r.awayGoals) h.pts += 3; else if (r.homeGoals < r.awayGoals) a.pts += 3; else { h.pts += 1; a.pts += 1; }
      }
      if (f.home === clubId || f.away === clubId) mine = true;
      i++;
    }
    if (mine) out.push(positionOf());
  }
  return out;
}

/** Days from `today` to a fixture day (0 = today). */
export function daysUntil(fixtureDay: number, today: number): number {
  return Math.max(0, fixtureDay - today);
}
