import { describe, expect, it } from 'vitest';
import { deriveStatsFromEvents, simulateMatch, type MatchResult } from '../src/match';
import { syntheticMatch, syntheticSheet } from '../src/synth';
import { archetypeTactics } from '../src/tactics';

function run(i: number, qh = 62, qa = 62, over: Parameters<typeof syntheticMatch>[4] = {}): MatchResult {
  return simulateMatch(syntheticMatch(`m${i}`, `seed${i}`, syntheticSheet({ id: 'H', quality: qh, seed: String(i) }), syntheticSheet({ id: 'A', quality: qa, seed: String(i) }), over));
}

describe('match engine consistency', () => {
  const results = Array.from({ length: 250 }, (_, i) => run(i, 55 + (i % 20), 55 + ((i * 7) % 20)));

  it('score equals the number of goal events and the sum of player goals', () => {
    for (const r of results) {
      const goals = r.events.filter((e) => e.type === 'goal');
      expect(goals.filter((g) => g.side === 'home')).toHaveLength(r.score.home);
      expect(goals.filter((g) => g.side === 'away')).toHaveLength(r.score.away);
      expect(r.players.filter((p) => p.side === 'home').reduce((a, p) => a + p.goals, 0)).toBe(r.score.home);
      expect(r.players.filter((p) => p.side === 'away').reduce((a, p) => a + p.goals, 0)).toBe(r.score.away);
    }
  });

  it('team statistics are exactly derivable from the event log', () => {
    for (const r of results) {
      const d = deriveStatsFromEvents(r.events);
      for (const side of ['home', 'away'] as const) {
        const s = r.stats[side];
        expect(d[side].shots).toBe(s.shots);
        expect(d[side].shotsOnTarget).toBe(s.shotsOnTarget);
        expect(d[side].saves).toBe(s.saves);
        expect(d[side].corners).toBe(s.corners);
        expect(d[side].fouls).toBe(s.fouls);
        expect(d[side].yellow).toBe(s.yellow);
        expect(d[side].red).toBe(s.red);
        expect(d[side].offsides).toBe(s.offsides);
        expect(d[side].substitutions).toBe(s.substitutions);
        expect(d[side].xg).toBeCloseTo(s.xg, 1);
      }
    }
  });

  it('shots on target = goals + saves, and player lines add up to team totals', () => {
    for (const r of results) {
      for (const side of ['home', 'away'] as const) {
        const s = r.stats[side];
        const other = r.stats[side === 'home' ? 'away' : 'home'];
        expect(s.shotsOnTarget).toBe(r.score[side] + other.saves);
        const lines = r.players.filter((p) => p.side === side);
        expect(lines.reduce((a, p) => a + p.shots, 0)).toBe(s.shots);
        expect(lines.reduce((a, p) => a + p.shotsOnTarget, 0)).toBe(s.shotsOnTarget);
        expect(lines.reduce((a, p) => a + p.passes, 0)).toBe(s.passes);
        expect(lines.reduce((a, p) => a + p.passesCompleted, 0)).toBe(s.passesCompleted);
        expect(lines.reduce((a, p) => a + p.saves, 0)).toBe(s.saves);
        expect(s.passesCompleted).toBeLessThanOrEqual(s.passes);
        expect(s.shotsOnTarget).toBeLessThanOrEqual(s.shots);
      }
      expect(r.stats.home.possession + r.stats.away.possession).toBeCloseTo(100, 0);
    }
  });

  it('assists never exceed goals, scorers differ from assisters, ratings are bounded', () => {
    for (const r of results) {
      for (const g of r.events) if (g.type === 'goal' && g.assistId) expect(g.assistId).not.toBe(g.scorerId);
      for (const side of ['home', 'away'] as const) {
        const lines = r.players.filter((p) => p.side === side);
        expect(lines.reduce((a, p) => a + p.assists, 0)).toBeLessThanOrEqual(r.score[side]);
      }
      for (const p of r.players) { expect(p.rating).toBeGreaterThanOrEqual(3); expect(p.rating).toBeLessThanOrEqual(10); }
      expect(r.motm).toBeTruthy();
    }
  });

  it('respects substitution limits, minutes, and never uses a player on both sides', () => {
    for (const r of results) {
      for (const side of ['home', 'away'] as const) expect(r.stats[side].substitutions).toBeLessThanOrEqual(5);
      const ids = r.players.map((p) => p.playerId);
      expect(new Set(ids).size).toBe(ids.length);
      for (const p of r.players) { expect(p.minutes).toBeGreaterThanOrEqual(0); expect(p.minutes).toBeLessThanOrEqual(125); }
      const starters = r.players.filter((p) => p.started);
      expect(starters.filter((p) => p.side === 'home')).toHaveLength(11);
      expect(starters.filter((p) => p.side === 'away')).toHaveLength(11);
    }
  });

  it('no player acts after being sent off or substituted off', () => {
    for (const r of results) {
      const gone = new Map<string, number>();
      r.events.forEach((e, idx) => {
        if (e.type === 'card' && (e.card === 'red' || e.card === 'secondYellow')) gone.set(e.playerId, idx);
        if (e.type === 'sub') gone.set(e.offId, idx);
      });
      r.events.forEach((e, idx) => {
        const actor = e.type === 'shot' ? e.playerId : e.type === 'goal' ? e.scorerId : e.type === 'foul' ? e.playerId : null;
        if (actor && gone.has(actor)) expect(idx, `${actor} acted after leaving in ${r.id}`).toBeLessThan(gone.get(actor)!);
      });
    }
  });

  it('minutes in events are non-decreasing within a period', () => {
    for (const r of results.slice(0, 60)) {
      let last = 0; let period = 1;
      for (const e of r.events) {
        if (e.period !== period) { period = e.period; last = 0; }
        expect(e.minute).toBeGreaterThanOrEqual(last - 0);
        last = e.minute;
      }
    }
  });
});

describe('determinism and replay', () => {
  it('re-simulating the same MatchInput gives a byte-identical result', () => {
    const input = syntheticMatch('rep', 'seed', syntheticSheet({ id: 'H', quality: 66, seed: 'a' }), syntheticSheet({ id: 'A', quality: 60, seed: 'b' }));
    const a = JSON.stringify(simulateMatch(input)); const b = JSON.stringify(simulateMatch(JSON.parse(JSON.stringify(input))));
    expect(a).toBe(b);
  });
  it('different seeds give different matches', () => {
    const h = syntheticSheet({ id: 'H', quality: 66, seed: 'a' }); const a = syntheticSheet({ id: 'A', quality: 60, seed: 'b' });
    const outcomes = new Set(Array.from({ length: 30 }, (_, i) => `${simulateMatch(syntheticMatch('x', `s${i}`, h, a)).score.home}-${simulateMatch(syntheticMatch('x', `s${i}`, h, a)).score.away}`));
    expect(outcomes.size).toBeGreaterThan(3);
  });
});

describe('knockout rules', () => {
  it('always produces a winner when required, via extra time and penalties', () => {
    let et = 0; let pens = 0;
    for (let i = 0; i < 400; i++) {
      const r = run(i, 62, 62, { rules: { mustHaveWinner: true, extraTime: true, maxSubsRegular: 5 } });
      expect(r.winner === 'draw').toBe(false);
      if (r.extraTimePlayed) et++;
      if (r.penalties) { pens++; expect(r.penalties.home).not.toBe(r.penalties.away); expect(r.scoreRegular.home + 0).toBeGreaterThanOrEqual(0); }
      if (!r.extraTimePlayed) expect(r.score).toEqual(r.scoreRegular);
      if (r.extraTimePlayed) expect(r.duration).toBe(120);
    }
    expect(et).toBeGreaterThan(40); expect(pens).toBeGreaterThan(10); expect(pens).toBeLessThan(et);
  });
  it('decides on aggregate in the second leg', () => {
    for (let i = 0; i < 100; i++) {
      const r = run(i, 62, 62, { rules: { mustHaveWinner: true, extraTime: true, maxSubsRegular: 5, aggregateOffset: { home: 0, away: 2 } } });
      const homeAgg = r.score.home; const awayAgg = r.score.away + 2;
      if (homeAgg > awayAgg) expect(r.winner).toBe('home'); else if (awayAgg > homeAgg) expect(r.winner).toBe('away'); else expect(r.penalties).toBeTruthy();
    }
  });
});

describe('football logic', () => {
  it('stronger teams win more often; weaker teams still win sometimes; home advantage exists', () => {
    let strongWins = 0; let weakWins = 0; let homeGoals = 0; let awayGoals = 0;
    const n = 400;
    for (let i = 0; i < n; i++) {
      const r = run(i, 72, 56);
      if (r.score.home > r.score.away) strongWins++; else if (r.score.home < r.score.away) weakWins++;
    }
    expect(strongWins / n).toBeGreaterThan(0.6); expect(weakWins / n).toBeGreaterThan(0.03);
    for (let i = 0; i < n; i++) { const r = run(i + 1000, 62, 62); homeGoals += r.score.home; awayGoals += r.score.away; }
    expect(homeGoals).toBeGreaterThan(awayGoals * 1.05);
  });
  it('a neutral venue removes home advantage', () => {
    let h = 0; let a = 0;
    for (let i = 0; i < 1200; i++) { const r = run(i, 62, 62, { conditions: { neutral: true, attendanceFrac: 0.9, weather: 'clear', refereeStrictness: 1, importance: 0.5 } }); h += r.score.home; a += r.score.away; }
    expect(Math.abs(h - a) / (h + a)).toBeLessThan(0.05);
  });
  it('conceding a red card early costs a team goals relative to the opponent (statistical)', () => {
    let scoredByDismissed = 0; let scoredAgainstDismissed = 0; let k = 0;
    for (let i = 0; i < 2500 && k < 80; i++) {
      const r = run(i + 5000, 62, 62);
      for (const e of r.events) {
        if (e.type === 'card' && (e.card === 'red' || e.card === 'secondYellow') && e.minute < 45) {
          const goalsAfter = r.events.filter((g) => g.type === 'goal' && g.minute >= e.minute);
          scoredByDismissed += goalsAfter.filter((g) => g.side === e.side).length;
          scoredAgainstDismissed += goalsAfter.filter((g) => g.side !== e.side).length;
          k++;
        }
      }
    }
    expect(k).toBeGreaterThan(30);
    expect(scoredAgainstDismissed).toBeGreaterThan(scoredByDismissed);
  });
  it('attacking mentality scales risk both ways: more goals overall', () => {
    let g0 = 0; let g2 = 0;
    for (let i = 0; i < 500; i++) {
      const t0 = archetypeTactics('balanced'); const t2 = { ...t0, mentality: 2 as const };
      g0 += simulateMatch(syntheticMatch('a', `s${i}`, syntheticSheet({ id: 'H', quality: 62, seed: String(i), tactics: t0 }), syntheticSheet({ id: 'A', quality: 62, seed: String(i), tactics: t0 }))).score.home;
      g2 += simulateMatch(syntheticMatch('a', `s${i}`, syntheticSheet({ id: 'H', quality: 62, seed: String(i), tactics: t2 }), syntheticSheet({ id: 'A', quality: 62, seed: String(i), tactics: t2 }))).score.home;
    }
    expect(g2).toBeGreaterThan(g0);
  });
});
