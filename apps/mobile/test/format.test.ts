import { afterEach, describe, expect, it } from 'vitest';
import {
  SAR_PER_EUR, __setIntlOverride, engineDateKey, formatDateIso, formatMoney, formatNumber, formatPercent, localiseEngineDate, parseNumber, seasonLabelOf, toArabicIndic, type FormatPrefs,
} from '../src/core/format';

const en: FormatPrefs = { lang: 'en', currency: 'EUR', arabicDigits: false };
const enSar: FormatPrefs = { ...en, currency: 'SAR' };
const ar: FormatPrefs = { lang: 'ar', currency: 'SAR', arabicDigits: false };
const arDigits: FormatPrefs = { lang: 'ar', currency: 'SAR', arabicDigits: true };

afterEach(() => __setIntlOverride(null));

describe('money', () => {
  it.each([true, false])('formats compact EUR amounts (Intl=%s)', (intl) => {
    __setIntlOverride(intl);
    expect(formatMoney(12_400_000, en)).toBe('€12.4M');
    expect(formatMoney(1_000_000, en)).toBe('€1M');
    expect(formatMoney(2_500_000_000, en)).toBe('€2.5B');
    expect(formatMoney(45_000, en)).toBe('€45K');
    expect(formatMoney(999, en)).toBe('€999');
    expect(formatMoney(-3_200_000, en)).toBe('-€3.2M');
    expect(formatMoney(5_000_000, en, { signed: true })).toBe('+€5M');
    expect(formatMoney(1234567, en, { compact: false })).toBe('€1,234,567');
  });
  it('converts to SAR with the documented fixed approximate rate', () => {
    expect(SAR_PER_EUR).toBeCloseTo(4.06, 5);
    expect(formatMoney(10_000_000, enSar)).toBe('SAR 40.6M');
    expect(formatMoney(10_000_000, ar)).toBe('40.6 م ر.س');
    expect(formatMoney(10_000_000, arDigits)).toBe('٤٠٫٦ م ر.س');
  });
  it('never returns undefined/NaN text', () => {
    expect(formatMoney(Number.NaN, en)).toBe('–');
    expect(formatNumber(Number.POSITIVE_INFINITY, en)).toBe('–');
  });
});

describe('numbers & digits', () => {
  it('groups digits with and without Intl', () => {
    for (const intl of [true, false]) {
      __setIntlOverride(intl);
      expect(formatNumber(1234567, en)).toBe('1,234,567');
      expect(formatNumber(3.14159, en, 2)).toBe('3.14');
      expect(formatNumber(1234, arDigits)).toBe('١٬٢٣٤');
    }
  });
  it('arabic-indic conversion and parsing round-trip', () => {
    expect(toArabicIndic('1,234.5')).toBe('١٬٢٣٤٫٥');
    expect(parseNumber('١٢٫٥')).toBe(12.5);
    expect(parseNumber('12,5')).toBe(12.5);
    expect(parseNumber('abc')).toBeNaN();
    expect(parseNumber('')).toBeNaN();
    expect(parseNumber('40')).toBe(40);
  });
  it('percent', () => expect(formatPercent(0.256, en, 1)).toBe('25.6%'));
});

describe('dates', () => {
  it('formats ISO dates in English (day first) with and without Intl', () => {
    for (const intl of [true, false]) {
      __setIntlOverride(intl);
      expect(formatDateIso('2026-08-01', en)).toMatch(/^1 Aug(?:ust)? 2026$/);
    }
  });
  it('formats Gregorian Arabic dates, optionally with Arabic-Indic digits', () => {
    __setIntlOverride(false);
    expect(formatDateIso('2026-08-01', ar)).toBe('1 أغسطس 2026');
    expect(formatDateIso('2026-08-01', arDigits)).toBe('١ أغسطس ٢٠٢٦');
    __setIntlOverride(true);
    const viaIntl = formatDateIso('2026-08-01', arDigits);
    expect(viaIntl).toMatch(/٢٠٢٦/); // Gregorian 2026, not Hijri 1448
    expect(viaIntl).not.toMatch(/١٤٤/);
  });
  it('re-localises engine English date labels', () => {
    __setIntlOverride(false);
    expect(localiseEngineDate('14 Aug 2026', en)).toBe('14 Aug 2026');
    expect(localiseEngineDate('14 Aug 2026', ar)).toBe('14 أغسطس 2026');
    expect(localiseEngineDate('weird', en)).toBe('weird');
    expect(localiseEngineDate(null, en)).toBe('–');
  });
  it('sorts engine labels chronologically', () => {
    expect(engineDateKey('9 Jun 2027') > engineDateKey('30 Jul 2026')).toBe(true);
    expect(engineDateKey('x')).toBe('');
    expect(seasonLabelOf(1)).toBe('2026/27');
    expect(seasonLabelOf(3)).toBe('2028/29');
  });
});
