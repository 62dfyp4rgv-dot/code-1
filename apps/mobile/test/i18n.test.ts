import { describe, expect, it } from 'vitest';
import { en } from '../src/i18n/en';
import { ar } from '../src/i18n/ar';
import { translate, translateDynamic, hasKey } from '../src/i18n/translate';
import { makeI18n } from '../src/i18n/useI18n';
import { COMPETITIONS, FORMATIONS, ROLES, POSITIONS, ATTR_KEYS } from '@fu/engine';

const placeholders = (s: string): string[] => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1] as string).sort();

describe('dictionaries', () => {
  it('Arabic defines exactly the English keys', () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort());
  });
  it('no empty translations (except intentionally empty keys)', () => {
    for (const [k, v] of Object.entries(ar)) if ((en as Record<string, string>)[k] !== '') expect(v.trim(), k).not.toBe('');
  });
  it('placeholders match between languages', () => {
    for (const k of Object.keys(en) as (keyof typeof en)[]) expect(placeholders(ar[k]), k).toEqual(placeholders(en[k]));
  });
  it('Arabic strings contain Arabic script (except abbreviations kept Latin)', () => {
    const latinOk = new Set(['squad.legend', 'table.p']);
    let arabic = 0;
    for (const [k, v] of Object.entries(ar)) if (/[؀-ۿ]/.test(v)) arabic++; else if (!latinOk.has(k)) expect(v.length, k).toBeGreaterThan(0);
    expect(arabic).toBeGreaterThan(Object.keys(ar).length * 0.95);
  });
  it('covers every engine id the UI looks up dynamically', () => {
    for (const p of POSITIONS) expect(hasKey('ar', `pos.${p}`), p).toBe(true);
    for (const r of Object.keys(ROLES)) expect(hasKey('en', `role.${r}`), r).toBe(true);
    for (const a of ATTR_KEYS) expect(hasKey('ar', `attr.${a}`), a).toBe(true);
    for (const f of Object.keys(FORMATIONS)) expect(f).toMatch(/^\d(-\d)+$/);
    const verifs = new Set(Object.values(COMPETITIONS).map((c) => c.verification.status));
    for (const v of verifs) expect(hasKey('ar', `verify.${v}`), v).toBe(true);
    for (const k of new Set(Object.values(COMPETITIONS).map((c) => c.kind))) expect(hasKey('ar', `kind.${k}`), k).toBe(true);
  });
});

describe('translate', () => {
  it('interpolates parameters', () => {
    expect(translate('en', 'sim.stats', { days: 3, matches: 40 })).toBe('3 days · 40 matches played');
    expect(translate('ar', 'saves.deleteWarn', { name: 'X' })).toContain('X');
  });
  it('falls back to English then to the supplied fallback, never undefined', () => {
    expect(translateDynamic('ar', 'no.such.key', 'fallback')).toBe('fallback');
    expect(translateDynamic('en', 'pos.GK', 'x')).toBe('GK');
    expect(translate('en', 'nonexistent' as never)).toBe('nonexistent');
  });
  it('makeI18n exposes rtl and locale-aware helpers', () => {
    const a = makeI18n({ lang: 'ar', currency: 'SAR', arabicDigits: true });
    expect(a.rtl).toBe(true);
    expect(a.dig(2026)).toBe('٢٠٢٦');
    expect(a.t('tab.home')).toBe('الرئيسية');
    const e = makeI18n({ lang: 'en', currency: 'EUR', arabicDigits: false });
    expect(e.rtl).toBe(false);
    expect(e.money(1_500_000)).toBe('€1.5M');
  });
});
