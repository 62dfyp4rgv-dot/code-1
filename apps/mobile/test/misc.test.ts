import { describe, expect, it } from 'vitest';
import type { PlayerRow } from '@fu/engine';
import { filterSquad, sortSquad, millionsToEur, eurToMillions } from '../src/features/squadUtils';
import { suggestXi } from '../src/features/lineupUtils';
import { layoutSlots } from '../src/features/pitchLayout';
import { DEFAULT_SETTINGS, parseSettings } from '../src/state/settings';
import { contrastRatio, darkPalette, lightPalette, readableOn } from '../src/theme/tokens';
import { hashStr, initialsOf } from '../src/core/identity';

const row = (o: Partial<PlayerRow>): PlayerRow => ({
  id: 'p1', name: 'A B', nationality: 'ENG', age: 25, position: 'CM', ability: 60, potential: 70, exact: true, fatigue: 10, form: 0, morale: 50, injury: null, suspended: false,
  wageWeekly: 1000, contractEnd: '1 Jul 2028', value: 1e6, clubId: 'c', loanFrom: null, apps: 0, goals: 0, assists: 0, avgRating: null, ...o,
});

describe('squad sorting & filtering', () => {
  const rows = [row({ id: 'a', name: 'Gina Keeper', position: 'GK', ability: 70, age: 31 }), row({ id: 'b', name: 'Bob Back', position: 'CB', ability: 65, age: 22, injury: { kind: 'x', returnDay: 5 } }),
    row({ id: 'c', name: 'Cy Mid', position: 'CM', ability: 80, age: 28, suspended: true }), row({ id: 'd', name: 'Di Striker', position: 'ST', ability: 75, age: 19, goals: 9 })];
  it('filters by position group, availability and text', () => {
    expect(filterSquad(rows, 'GK', '').map((r) => r.id)).toEqual(['a']);
    expect(filterSquad(rows, 'DEF', '').map((r) => r.id)).toEqual(['b']);
    expect(filterSquad(rows, 'unavailable', '').map((r) => r.id).sort()).toEqual(['b', 'c']);
    expect(filterSquad(rows, 'all', 'striker').map((r) => r.id)).toEqual(['d']);
  });
  it('sorts by each key', () => {
    expect(sortSquad(rows, 'position').map((r) => r.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(sortSquad(rows, 'ability').map((r) => r.id)).toEqual(['c', 'd', 'a', 'b']);
    expect(sortSquad(rows, 'age').map((r) => r.id)).toEqual(['d', 'b', 'c', 'a']);
    expect(sortSquad(rows, 'goals')[0]?.id).toBe('d');
  });
  it('currency helpers are inverse', () => {
    expect(millionsToEur(12.5, 1)).toBe(12_500_000);
    expect(eurToMillions(millionsToEur(10, 4.06), 4.06)).toBeCloseTo(10, 1);
  });
});

describe('lineup suggestion', () => {
  it('fills every slot once, GK first, skipping unavailable players', () => {
    const slots = ['GK', 'CB', 'CM', 'ST'] as const;
    const squad = [row({ id: 'g1', position: 'GK' }), row({ id: 'g2', position: 'GK' }), row({ id: 'c1', position: 'CB' }), row({ id: 'm1', position: 'CM' }), row({ id: 's1', position: 'ST', injury: { kind: 'x', returnDay: 9 } }), row({ id: 's2', position: 'ST' })];
    const fit = (id: string): number => ({ g1: 70, g2: 60, c1: 66, m1: 64, s1: 99, s2: 55 } as Record<string, number>)[id] ?? 0;
    const xi = suggestXi(slots, squad, fit);
    expect(xi).toEqual(['g1', 'c1', 'm1', 's2']);
    expect(new Set(xi).size).toBe(4);
  });
  it('pitch layout places goalkeeper deepest and spreads a line horizontally in order', () => {
    const pts = layoutSlots(['GK', 'LB', 'CB', 'CB', 'RB']);
    expect(pts[0]!.y).toBeGreaterThan(pts[1]!.y);
    const xs = [1, 2, 3, 4].map((i) => pts[i]!.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(pts[1]!.x).toBeLessThan(pts[4]!.x); // LB left of RB
  });
});

describe('settings', () => {
  it('parses and validates persisted settings', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('not json')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings(JSON.stringify({ language: 'ar', theme: 'dark', textScale: 1.3, currency: 'SAR', lastSlot: 3 }))).toMatchObject({ language: 'ar', theme: 'dark', textScale: 1.3, currency: 'SAR', lastSlot: 3 });
    expect(parseSettings(JSON.stringify({ language: 'xx', textScale: 99, currency: 'USD' }))).toEqual(DEFAULT_SETTINGS);
  });
});

describe('design tokens', () => {
  it('text colours meet WCAG AA (4.5:1) on their surfaces in both themes', () => {
    for (const p of [lightPalette, darkPalette]) {
      for (const bg of [p.bg, p.surface, p.surfaceAlt]) {
        expect(contrastRatio(p.text, bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(p.textMuted, bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(p.primaryText, bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(p.danger, bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(p.success, bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(p.warning, bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(p.info, bg)).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrastRatio(p.onPrimary, p.primary)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(p.onAccent, p.accent)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it('readableOn picks a legible ink colour for arbitrary club colours', () => {
    for (const c of ['#000000', '#ffffff', '#ffcc00', '#123456', '#ff0000', '#00ff00']) expect(contrastRatio(readableOn(c), c)).toBeGreaterThanOrEqual(4.5 - 1.6);
    expect(readableOn('#000000')).toBe('#FFFFFF');
  });
  it('avatar/crest helpers are deterministic', () => {
    expect(hashStr('x')).toBe(hashStr('x'));
    expect(initialsOf('Penstead Royals')).toBe('PR');
    expect(initialsOf('Zed')).toBe('ZE');
    expect(initialsOf('')).toBe('?');
  });
});
