/**
 * QA areas 1+3 at match level: football-rule plausibility of simulateMatch output and Monte-Carlo realism.
 * Uses src/synth helpers. [QA-006] documents the non-monotone minute labelling.
 */
import { describe, expect, it } from 'vitest';
import { simulateMatch, type MatchEvent, type MatchResult } from '../src/match';
import { syntheticMatch, syntheticSheet } from '../src/synth';
import { mean } from './helpers';

function run(i: number, qh: number, qa: number, ko = false, et = false): { res: MatchResult; home: ReturnType<typeof syntheticSheet>; away: ReturnType<typeof syntheticSheet> } {
  const home = syntheticSheet({ id: 'H', quality: qh, seed: 's' + (i % 50) });
  const away = syntheticSheet({ id: 'A', quality: qa, seed: 's' + (i % 50) });
  const res = simulateMatch(syntheticMatch('m' + i, 'seed' + i, home, away, { rules: { mustHaveWinner: ko, extraTime: et, maxSubsRegular: 5 } }));
  return { res, home, away };
}

describe('match output plausibility (3000 matches, mixed strengths, 1/2 knockout, 1/4 with ET)', () => {
  const N = 3000;
  const problems: Record<string, string[]> = {};
  const flag = (k: string, ex: string) => { (problems[k] ??= []).push(ex); };
  const results: MatchResult[] = [];
  for (let i = 0; i < N; i++) {
    const { res, home, away } = run(i, 50 + (i % 7) * 4, 50 + ((i * 3) % 7) * 4, i % 2 === 0, i % 4 === 0);
    results.push(res);
    const ev = res.events as (MatchEvent & Record<string, any>)[];
    const hs = new Set(home.players.map((p) => p.id)), as = new Set(away.players.map((p) => p.id));
    const goals = ev.filter((e) => e.type === 'goal');
    if (goals.filter((g) => g.side === 'home').length !== res.score.home || goals.filter((g) => g.side === 'away').length !== res.score.away) flag('score != goal events', res.id);
    let ph = 0, pa = 0;
    for (const g of goals) { if (g.home + g.away !== ph + pa + 1) flag('running score jump', res.id); ph = g.home; pa = g.away; }
    for (const g of goals) {
      const own = g.kind === 'ownGoal';
      const ok = own ? (g.side === 'home' ? as.has(g.scorerId) : hs.has(g.scorerId)) : (g.side === 'home' ? hs.has(g.scorerId) : as.has(g.scorerId));
      if (!ok) flag('scorer on wrong team', res.id);
      if (g.assistId === g.scorerId) flag('self assist', res.id);
      if (own && g.assistId) flag('own goal with assist', res.id);
      if (g.assistId && !(g.side === 'home' ? hs : as).has(g.assistId)) flag('assist from other team', res.id);
    }
    const og = goals.filter((g) => g.kind === 'ownGoal').length;
    if (res.players.reduce((a, p) => a + p.goals, 0) + og !== res.score.home + res.score.away) flag('player goals + OG != score', res.id);
    // cards
    const cards = new Map<string, string[]>();
    for (const e of ev) if (e.type === 'card') cards.set(e.playerId, [...(cards.get(e.playerId) ?? []), e.card]);
    for (const [pid, c] of cards) {
      if (c.filter((x) => x === 'yellow').length > 1) flag('two plain yellows', res.id + pid);
      if (c.includes('secondYellow') && c.filter((x) => x === 'yellow').length !== 1) flag('secondYellow without exactly one yellow', res.id + pid);
      if (c.includes('red') && c.includes('secondYellow')) flag('red + secondYellow', res.id + pid);
    }
    const sentOff = new Map<string, number>();
    ev.forEach((e, idx) => { if (e.type === 'card' && e.card !== 'yellow') sentOff.set(e.playerId, idx); });
    ev.forEach((e, idx) => {
      for (const id of [e.playerId, e.scorerId, e.assistId, e.onId]) {
        const o = id ? sentOff.get(id) : undefined;
        if (o !== undefined && idx > o && e.type !== 'shootout') flag('sent-off player acts afterwards', res.id + ':' + e.type);
      }
    });
    // substitutions: <=5 within regulation, <=6 overall when ET
    for (const side of ['home', 'away'] as const) {
      const regular = ev.filter((e) => e.type === 'sub' && e.side === side && e.period <= 2).length;
      const all = ev.filter((e) => e.type === 'sub' && e.side === side).length;
      if (regular > 5) flag('>5 subs in regulation', res.id);
      if (all > 6) flag('>6 subs incl. ET', res.id);
    }
    // ET / penalties rules
    const mustWin = i % 2 === 0, etAllowed = i % 4 === 0;
    if (res.extraTimePlayed && !(mustWin && etAllowed)) flag('ET when not allowed', res.id);
    if (res.extraTimePlayed && res.scoreRegular.home !== res.scoreRegular.away) flag('ET though not level', res.id);
    if (res.penalties && res.score.home !== res.score.away) flag('pens though not level', res.id);
    if (mustWin && !res.penalties && res.score.home === res.score.away) flag('knockout left drawn', res.id);
    if (!mustWin && (res.extraTimePlayed || res.penalties)) flag('ET/pens in non-knockout', res.id);
    if (res.penalties) {
      const so = ev.filter((e) => e.type === 'shootout');
      const hp = so.filter((e) => e.side === 'home' && e.scored).length, ap = so.filter((e) => e.side === 'away' && e.scored).length;
      if (hp !== res.penalties.home || ap !== res.penalties.away || hp === ap) flag('shoot-out mismatch', res.id);
      if (Math.abs(so.filter((e) => e.side === 'home').length - so.filter((e) => e.side === 'away').length) > 1) flag('uneven kicks', res.id);
    }
    for (const p of res.players) {
      if (p.minutes < 0 || p.minutes > 125) flag('minutes range', res.id);
      if (p.rating < 1 || p.rating > 10) flag('rating range', res.id);
      if (p.shotsOnTarget > p.shots || p.passesCompleted > p.passes) flag('player line inconsistent', res.id);
    }
    const dh = res.stats.home, da = res.stats.away;
    if (dh.shotsOnTarget > dh.shots || da.shotsOnTarget > da.shots) flag('SoT > shots', res.id);
    if (dh.possession + da.possession < 99.5 || dh.possession + da.possession > 100.5) flag('possession does not sum to 100', res.id);
    // event minute ordering (QA-006)
    for (let k = 1; k < ev.length; k++) if (ev[k]!.minute < ev[k - 1]!.minute) { flag('event minute decreases', res.id); break; }
    // impossible scorelines
    if (res.score.home + res.score.away > 14) flag('implausible total goals', `${res.id} ${res.score.home}-${res.score.away}`);
  }
  const clean = (k: string) => problems[k]?.length ?? 0;

  it('score, scorers, assists and goal events agree', () => {
    for (const k of ['score != goal events', 'running score jump', 'scorer on wrong team', 'self assist', 'own goal with assist', 'assist from other team', 'player goals + OG != score']) expect(problems[k] ?? [], k).toEqual([]);
  });
  it('card logic is coherent; sent-off players never act again', () => {
    for (const k of ['two plain yellows', 'secondYellow without exactly one yellow', 'red + secondYellow', 'sent-off player acts afterwards']) expect(problems[k] ?? [], k).toEqual([]);
  });
  it('substitution limits: 5 in regulation, 6 including extra time', () => {
    expect(problems['>5 subs in regulation'] ?? []).toEqual([]);
    expect(problems['>6 subs incl. ET'] ?? []).toEqual([]);
  });
  it('extra time and penalties occur only when the rules allow and the tie is level', () => {
    for (const k of ['ET when not allowed', 'ET though not level', 'pens though not level', 'knockout left drawn', 'ET/pens in non-knockout', 'shoot-out mismatch', 'uneven kicks']) expect(problems[k] ?? [], k).toEqual([]);
  });
  it('player lines, ratings, possession and scorelines are in range', () => {
    for (const k of ['minutes range', 'rating range', 'player line inconsistent', 'SoT > shots', 'possession does not sum to 100', 'implausible total goals']) expect(problems[k] ?? [], k).toEqual([]);
  });
  it('[QA-006] event minutes never decrease (stoppage time must not collide with the second half)', () => {
    expect(clean('event minute decreases'), `matches with a decreasing minute: ${clean('event minute decreases')}/${N}`).toBe(0);
  });
  it('calibration bands of docs/SIMULATION.md hold for mixed-strength matches', () => {
    const g = mean(results.map((r) => r.scoreRegular.home + r.scoreRegular.away));
    const yellow = mean(results.map((r) => r.stats.home.yellow + r.stats.away.yellow));
    const red = mean(results.map((r) => r.stats.home.red + r.stats.away.red));
    const cs = mean(results.flatMap((r) => [r.scoreRegular.home === 0 ? 1 : 0, r.scoreRegular.away === 0 ? 1 : 0]));
    const hw = mean(results.map((r) => (r.scoreRegular.home > r.scoreRegular.away ? 1 : 0)));
    expect(g).toBeGreaterThan(2.4); expect(g).toBeLessThan(3.3);
    expect(yellow).toBeGreaterThan(2.8); expect(yellow).toBeLessThan(4.6);
    expect(red).toBeGreaterThan(0.04); expect(red).toBeLessThan(0.18);
    expect(cs).toBeGreaterThan(0.2); expect(cs).toBeLessThan(0.36);
    expect(hw).toBeGreaterThan(0.36);
  });
});

describe('strength response and extremes (n=1500 per cell)', () => {
  const cell = (qh: number, qa: number, n = 1500) => {
    let h = 0, d = 0, a = 0, goals = 0;
    for (let i = 0; i < n; i++) {
      const { res } = run(10000 + i, qh, qa);
      goals += res.score.home + res.score.away;
      if (res.score.home > res.score.away) h++; else if (res.score.home < res.score.away) a++; else d++;
    }
    return { h: h / n, d: d / n, a: a / n, goals: goals / n };
  };
  it('home advantage between equal sides is positive but modest', () => {
    const c = cell(62, 62);
    expect(c.h - c.a).toBeGreaterThan(0.03);
    expect(c.h - c.a).toBeLessThan(0.25);
    expect(c.d).toBeGreaterThan(0.2); expect(c.d).toBeLessThan(0.32);
  });
  it('win probability is monotone in rating gap and the underdog still wins sometimes', () => {
    const w0 = cell(62, 62).h, w1 = cell(70, 62).h, w2 = cell(80, 62).h, w3 = cell(90, 40).h;
    expect(w0).toBeLessThan(w1); expect(w1).toBeLessThan(w2); expect(w2).toBeLessThanOrEqual(w3 + 0.02);
    const away = cell(55, 70);
    expect(away.h).toBeGreaterThan(0.05);   // upsets exist
    expect(away.h).toBeLessThan(0.3);
    expect(away.a).toBeGreaterThan(0.5);
  });
  it('extreme mismatch (95 vs 25) is lopsided; mean total goals stays below 14 (observed ~10.8)', () => {
    const c = cell(95, 25, 800);
    expect(c.h).toBeGreaterThan(0.9);
    expect(c.goals).toBeLessThan(14);
  });
  it('speed: simulateMatch averages under 10 ms', () => {
    const t = performance.now();
    for (let i = 0; i < 300; i++) run(20000 + i, 60, 60);
    expect((performance.now() - t) / 300).toBeLessThan(10);
  });
});
