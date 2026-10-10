import { describe, expect, it } from 'vitest';
import { Rng } from '../src/rng';
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
      if (Math.abs(ab + ba) < 0.45) continue; // each cell has sampling error of ~0.08, so a pair can look worse by chance...
      // ...in which case it is re-measured with a much larger sample before it is allowed to fail
      const sum = gd(archetypeTactics(a), archetypeTactics(b), 2500, `re1${a}${b}`).gd + gd(archetypeTactics(b), archetypeTactics(a), 2500, `re2${a}${b}`).gd;
      expect(Math.abs(sum), `${a} vs ${b} re-measured`).toBeLessThan(0.25);
    }
  });
});

describe('single instruction levers are not free upgrades', () => {
  const n = 1200;
  const base = defaultTactics('4-3-3');
  const levers: [string, Partial<Tactics>][] = [
    ['counterAttack', { counterAttack: true }], ['pressing 90', { pressing: 90 }], ['pressing 10', { pressing: 10 }],
    ['line 90', { defensiveLine: 90 }], ['line 10', { defensiveLine: 10 }], ['directness 90', { directness: 90 }], ['directness 10', { directness: 10 }],
    ['tempo 85', { tempo: 85 }], ['marking man', { marking: 'man' }], ['marking mixed', { marking: 'mixed' }], ['width 85', { width: 85 }], ['mentality 2', { mentality: 2 }], ['mentality -2', { mentality: -2 }],
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

describe('marking and weather have measurable, non-free effects', () => {
  const base = defaultTactics('4-3-3');
  const run = (a: Partial<Tactics>, b: Partial<Tactics>, n: number, mk: (i: number) => { qa: number; qb: number }, over: Parameters<typeof syntheticMatch>[4] = {}) => {
    let fouls = 0; let g = 0; let fat = 0;
    for (let i = 0; i < n; i++) {
      const { qa, qb } = mk(i);
      const r = simulateMatch(syntheticMatch(`m${i}`, `mk${i}`, syntheticSheet({ id: 'A', quality: qa, seed: `${i}`, tactics: { ...base, ...a } }), syntheticSheet({ id: 'B', quality: qb, seed: `${i}`, tactics: { ...base, ...b } }), over));
      fouls += r.stats.home.fouls; g += r.score.home + r.score.away; fat += r.players.filter((p) => p.side === 'home').reduce((s2, p) => s2 + p.fatigueEnd, 0);
    }
    return { fouls: fouls / n, g: g / n, fat: fat / n };
  };
  it('man-marking costs fitness and commits more fouls than zonal marking', () => {
    const man = run({ marking: 'man' }, {}, 500, () => ({ qa: 62, qb: 62 }));
    const zonal = run({ marking: 'zonal' }, {}, 500, () => ({ qa: 62, qb: 62 }));
    expect(man.fouls).toBeGreaterThan(zonal.fouls);
    expect(man.fat).toBeGreaterThan(zonal.fat);
  });
  it('rain makes possession football harder than direct football', () => {
    const rain = { conditions: { neutral: true, attendanceFrac: 0.8, weather: 'rain' as const, refereeStrictness: 1, importance: 0.5 } };
    const clear = { conditions: { neutral: true, attendanceFrac: 0.8, weather: 'clear' as const, refereeStrictness: 1, importance: 0.5 } };
    const gdOf = (over: typeof rain | typeof clear): number => {
      let d = 0; const n = 900;
      for (let i = 0; i < n; i++) {
        const r = simulateMatch(syntheticMatch(`w${i}`, `w${i}`, syntheticSheet({ id: 'A', quality: 62, seed: `${i}`, tactics: { ...base, directness: 10 } }), syntheticSheet({ id: 'B', quality: 62, seed: `${i}`, tactics: { ...base, directness: 90 } }), over));
        d += r.score.home - r.score.away;
      }
      return d / n;
    };
    expect(gdOf(clear) - gdOf(rain)).toBeGreaterThan(0);
  });
});

describe('stacked tactical levers are not free upgrades (CR-009)', () => {
  it('no random slider combination beats the balanced default by 0.14 goals/match once re-tested on fresh seeds', () => {
    const rng = Rng.fromSeed('combo-sweep');
    const base = defaultTactics('4-3-3');
    const pick3 = (): number => rng.pick([10, 50, 90]);
    const configs: Tactics[] = [];
    // 100 random configurations (same formation as the opponent so only the tactical levers are measured)
    for (let k = 0; k < 100; k++) {
      configs.push({
        ...base, tempo: pick3(), width: pick3(), directness: pick3(), pressing: pick3(), defensiveLine: pick3(),
        mentality: rng.pick([-2, -1, 0, 1, 2]) as Tactics['mentality'], counterAttack: rng.chance(0.4),
        marking: rng.pick(['zonal', 'man', 'mixed'] as const),
      });
    }
    const screen = configs.map((t, k) => ({ t, gd: gd(t, base, 250, `sw${k}`).gd })).sort((a, b) => b.gd - a.gd);
    const control = gd(base, base, 3000, 'confirm').gd; // identical tactics: measures harness bias, not tactics
    for (const { t, gd: screened } of screen.slice(0, 3)) {
      const confirmed = gd(t, base, 3000, 'confirm').gd - control;
      expect(confirmed, `screened ${screened.toFixed(2)} -> confirmed ${confirmed.toFixed(3)} ${JSON.stringify([t.tempo, t.width, t.directness, t.pressing, t.defensiveLine, t.mentality, t.counterAttack, t.marking])}`).toBeLessThan(0.14); // measured worst 0.11 (se 0.04); was 0.14-0.20 before the tempo/line/mentality/press retune
    }
  }, 900_000);
});
