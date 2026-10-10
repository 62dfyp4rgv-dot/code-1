import { useMemo } from 'react';
import { useSettings, prefsOf } from '../state/settings';
import { translate, translateDynamic, type TKey, type TParams } from './translate';
import { digits, formatClock, formatDateIso, formatMoney, formatNumber, formatPercent, formatWage, localiseEngineDate, type FormatPrefs } from '../core/format';
import { isRtl, type Lang } from './types';

export interface I18n {
  lang: Lang;
  rtl: boolean;
  prefs: FormatPrefs;
  t: (key: TKey, params?: TParams) => string;
  /** Lookup engine ids with a fallback (positions, roles, attributes, styles ...). */
  td: (key: string, fallback?: string, params?: TParams) => string;
  num: (n: number, decimals?: number) => string;
  dig: (n: number | string) => string;
  money: (eur: number, opts?: { compact?: boolean; signed?: boolean }) => string;
  wage: (eurPerWeek: number) => string;
  date: (iso: string, short?: boolean) => string;
  engineDate: (label: string | null | undefined) => string;
  pct: (x: number, decimals?: number) => string;
  clock: (iso: string) => string;
}

export function makeI18n(prefs: FormatPrefs): I18n {
  const { lang } = prefs;
  return {
    lang, rtl: isRtl(lang), prefs,
    t: (key, params) => translate(lang, key, params),
    td: (key, fallback, params) => translateDynamic(lang, key, fallback ?? key, params),
    num: (n, d = 0) => formatNumber(n, prefs, d),
    dig: (n) => digits(n, prefs),
    money: (eur, opts) => formatMoney(eur, prefs, opts),
    wage: (w) => formatWage(w, prefs),
    date: (iso, short) => formatDateIso(iso, prefs, { short }),
    engineDate: (l) => localiseEngineDate(l, prefs),
    pct: (x, d) => formatPercent(x, prefs, d),
    clock: (iso) => formatClock(iso, prefs),
  };
}

export function useI18n(): I18n {
  const language = useSettings((s) => s.language);
  const currency = useSettings((s) => s.currency);
  const arabicDigits = useSettings((s) => s.arabicDigits);
  return useMemo(() => makeI18n(prefsOf({ language, currency, arabicDigits })), [language, currency, arabicDigits]);
}
