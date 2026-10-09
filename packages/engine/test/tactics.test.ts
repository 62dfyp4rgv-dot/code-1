import { describe, expect, it } from 'vitest';
import { simulateMatch } from '../src/match';
import { syntheticMatch, syntheticSheet } from '../src/synth';
import { archetypeTactics, defaultTactics, FORMATIONS, ROLES, validateTactics, formationOf, type TacticalArchetype } from '../src/tactics';
import type { Tactics } from '../src/types';

function gd(a: Tactics, b: Tactics, n: number, seedTag: string): { gd: number; g: number } {
  let d = 0; let g = 0;
  for (let i = 0; i < n; i++) {
    const aHome = i % 2 === 0;
    const sa = syntheticSheet({ id: 'A', quality: 64, seed: `${seedTag}${i}`, tactics: a });
    const sb = syntheticSheet({ id: 'B', quality: 64, seed: `${seedTag}${i}`, tactics: b });
    const r = simulateMatch(aHome ? syntheticMatch(`m${i}`, `s${seedTag}${i}`, sa, sb) : syntheticMatch(`m${i}`, `s${seedTag}${i}`, sb, sa));
    const [x, y] = aHome ? [r.score.home, r.score.away] : [r.score.away, r.score.home];
    d += x - y; g += x + y;
  }
  return { gd: d / n, g: g / n };
}

describe('tactical consequences: no unexplained universal bonus', () => {
  const kinds: TacticalArchetype[] = ['balanced', 'possession', 'counter', 'highPress', 'lowBlock', 'direct'];
  const n = 450;
  const matrix = new Map<string, number>();
  const goals = new Map<string, number>();
  for (const a of kinds) for (const b of kinds) { const r = gd(archetypeTactics(a), archetypeTactics(b), n, `${a}-${b}`); matrix.set(`${a}|${b}`, r.gd); goals.set(`${a}|${b}`, r.g); }

  it('no archetype wins on average against the field by a large margin (row averages stay near zero)', () => {
    for (const a of kinds) {
      const row = kinds.map((b) => matrix.get(`${a}|${b}`) as number);
      const avg = row.reduce((x, y) => x + y, 0) / row.length;
      expect(Math.abs(avg), `${a} average GD ${avg.toFixed(3)}`).toBeLessThan(0.22);
    }
  });
  it('no archetype beats every other archetype by a clear margin (non-dominance)', () => {
    for (const a of kinds) {
      const others = kinds.filter((b) => b !== a).map((b) => matrix.get(`${a}|${b}`) as number);
      expect(others.every((x) => x > 0.08), `${a} dominates`).toBe(false);
      expect(others.every((x) => x < -0.08), `${a} is dominated`).toBe(false);
    }
  });
  it('matchups are genuinely different (tactics matter) and total goals respond to style', () => {
    const vals = [...matrix.values()];
    expect(Math.max(...vals) - Math.min(...vals)).toBeGreaterThan(0.25);
    expect(goals.get('lowBlock|lowBlock')!).toBeLessThan(goals.get('highPress|highPress')!);
  });
  it('mirrored matchups are close to antisymmetric (no hidden home/slot bias)', () => {
    for (const a of kinds) for (const b of kinds) {
      if (a >= b) continue;
      const ab = matrix.get(`${a}|${b}`) as number; const ba = matrix.get(`${b}|${a}`) as number;
      expect(Math.abs(ab + ba), `${a} vs ${b}`).toBeLessThan(0.45); // each cell has sampling error of ~0.08
    }
  });
});

describe('single instruction levers are not free upgrades', () => {
  const n = 1200;
  const base = defaultTactics('4-3-3');
  const levers: [string, Partial<Tactics>][] = [
    ['counterAttack', { counterAttack: true }], ['pressing 90', { pressing: 90 }], ['pressing 10', { pressing: 10 }],
    ['line 90', { defensiveLine: 90 }], ['line 10', { defensiveLine: 10 }], ['directness 90', { directness: 90 }], ['directness 10', { directness: 10 }],
    ['tempo 85', { tempo: 85 }], ['width 85', { width: 85 }], ['mentality 2', { mentality: 2 }], ['mentality -2', { mentality: -2 }],
  ];
  for (const [name, mod] of levers) {
    it(`${name}: |goal difference vs balanced| stays small`, () => {
      const r = gd({ ...base, ...mod }, base, n, `lev-${name}`);
      expect(Math.abs(r.gd), `${name} GD ${r.gd.toFixed(3)}`).toBeLessThan(0.2);
    });
  }
  it('no formation is a free upgrade: average goal difference against all formations stays near zero', () => {
    const ids = Object.keys(FORMATIONS);
    for (const id of ids) {
      const avg = ids.map((other) => gd(defaultTactics(id), defaultTactics(other), 200, `fm-${id}-${other}`).gd).reduce((x, y) => x + y, 0) / ids.length;
      expect(Math.abs(avg), `${id} average GD ${avg.toFixed(3)}`).toBeLessThan(0.2);
    }
  });
});

describe('tactic validation', () => {
  it('rejects roles that do not fit a slot and out-of-range sliders', () => {
    const t = defaultTactics('4-3-3');
    expect(validateTactics(t)).toEqual([]);
    expect(validateTactics({ ...t, roles: t.roles.map(() => 'poacher') }).length).toBeGreaterThan(0);
    expect(validateTactics({ ...t, pressing: 140 }).length).toBeGreaterThan(0);
    expect(validateTactics({ ...t, formation: 'nope' })[0]).toMatch(/unknown formation/);
  });
  it('every role is valid for at least one formation slot, every formation has 11 slots and one GK', () => {
    const slots = new Set(Object.values(FORMATIONS).flatMap((f) => f.slots));
    for (const r of Object.values(ROLES)) expect(r.positions.some((p) => slots.has(p))).toBe(true);
    for (const f of Object.values(FORMATIONS)) { expect(f.slots).toHaveLength(11); expect(f.slots.filter((s) => s === 'GK')).toHaveLength(1); }
    expect(() => formationOf('9-9-9')).toThrow();
  });
});
