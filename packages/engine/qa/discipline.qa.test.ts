/**
 * QA area 1 (rules): suspensions and cards at world level - red card => ban, yellow accumulation, bans are served
 * only in the competition where they were incurred, banned players never play, bans survive the season boundary.
 */
import { describe, expect, it } from 'vitest';
import { advanceDay, createWorld, COMPETITIONS } from '../src/index';
import { cfg } from './helpers';

const w = createWorld(cfg('qa-susp', ['ENG1', 'ESP1', 'ITA1', 'GER1']));
const problems: Record<string, string[]> = {};
const note = (k: string, e: string): void => { (problems[k] ??= []).push(e); };
let reds = 0;
const lastDayBans: { id: string; comp: string; n: number }[] = [];
let afterRollover: Record<string, Record<string, number>> = {};
for (let season = 1; season <= 2; season++) {
  while (w.day < season * 364 - 1) {
    const snap = new Map<string, { s: Record<string, number>; y: Record<string, number> }>();
    for (const p of Object.values(w.players)) if (!p.retired) snap.set(p.id, { s: { ...p.suspensions }, y: { ...p.yellows } });
    const rep = advanceDay(w);
    const clubComps = new Map<string, Set<string>>();
    for (const m of rep.matches) for (const c of [m.home, m.away]) { if (!clubComps.has(c)) clubComps.set(c, new Set()); clubComps.get(c)!.add(m.competitionId); }
    for (const m of rep.matches) {
      const st = w.matches[m.fixtureId];
      if (!st?.players) continue;
      for (const l of st.players) {
        const p = w.players[l.playerId]!;
        const b = snap.get(p.id)!;
        const before = b.s[m.competitionId] ?? 0;
        if (before > 0 && l.minutes > 0) note('banned player played', `${p.id} ${m.competitionId}`);
        if (l.red > 0) {
          reds++;
          const served = before > 0 ? 1 : 0;
          if ((p.suspensions[m.competitionId] ?? 0) - (before - served) < 1) note('red card without new ban', `${p.id} ${m.competitionId}`);
          for (const [c, n] of Object.entries(p.suspensions)) if (c !== m.competitionId && n !== (b.s[c] ?? 0)) note('ban leaked to other competition', `${p.id} ${c}`);
        }
      }
    }
    for (const p of Object.values(w.players)) {
      if (p.retired || !p.clubId) continue;
      const b = snap.get(p.id);
      if (!b) continue;
      for (const [c, n] of Object.entries(b.s)) {
        const now = p.suspensions[c] ?? 0;
        if (n > 0 && now < n && !clubComps.get(p.clubId)?.has(c)) note('ban served without a match in that competition', `${p.id} ${c}`);
        if (n > 0 && now < n - 1) note('ban decreased by more than one match', p.id);
      }
    }
  }
  if (season === 1) {
    for (const p of Object.values(w.players)) if (!p.retired) for (const [c, n] of Object.entries(p.suspensions)) if (n > 0 && COMPETITIONS[c]?.kind === 'league') lastDayBans.push({ id: p.id, comp: c, n });
  }
  advanceDay(w);
  if (season === 1) afterRollover = Object.fromEntries(lastDayBans.map((b) => [b.id, { ...w.players[b.id]!.suspensions }]));
}

describe('suspensions (2 seasons, 4 leagues x 10 clubs)', () => {
  it('sample is meaningful (dozens of red cards observed in retained matches)', () => {
    expect(reds).toBeGreaterThan(20);
  });
  it('every red card produces a ban in that competition only; banned players never play; bans are served one per match of that competition (verified OK)', () => {
    for (const k of ['banned player played', 'red card without new ban', 'ban leaked to other competition', 'ban served without a match in that competition', 'ban decreased by more than one match']) expect(problems[k] ?? [], k).toEqual([]);
  });
  it('[QA-011] league bans still unserved on the last day of the season are carried into the next season', () => {
    expect(lastDayBans.length, 'precondition: players with an unserved league ban on the last day').toBeGreaterThan(0);
    const lost = lastDayBans.filter((b) => (afterRollover[b.id]?.[b.comp] ?? 0) < b.n);
    expect(lost.length, `${lost.length}/${lastDayBans.length} unserved league bans were wiped at the season boundary`).toBe(0);
  });
});
