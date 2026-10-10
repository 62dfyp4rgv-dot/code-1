/**
 * Locale-aware formatting. Uses Intl when the JS engine provides it (feature-detected once; Hermes builds may ship
 * without full ICU) and otherwise falls back to small hand-written formatters so the UI never crashes or shows
 * `undefined`. Currency conversion lives here: engine money is always EUR.
 */
import type { Lang } from '../i18n/types';

/** Approximate FIXED display rate used for the SAR option. It is NOT a live exchange rate. */
export const SAR_PER_EUR = 4.06;

export type Currency = 'EUR' | 'SAR';

export interface FormatPrefs {
  lang: Lang;
  currency: Currency;
  /** Show Arabic-Indic digits (٠١٢٣…) when the language is Arabic. */
  arabicDigits: boolean;
}

export const DEFAULT_PREFS: FormatPrefs = { lang: 'en', currency: 'EUR', arabicDigits: false };

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function toArabicIndic(s: string): string {
  return s.replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)] as string).replace(/\./g, '٫').replace(/,/g, '٬');
}

// ---------------------------------------------------------------- Intl feature detection

let intlOverride: boolean | null = null;
let intlCache: boolean | null = null;

/** Test hook: force Intl on/off (null = autodetect). */
export function __setIntlOverride(v: boolean | null): void {
  intlOverride = v;
  intlCache = null;
}

export function intlAvailable(): boolean {
  if (intlOverride !== null) return intlOverride;
  if (intlCache !== null) return intlCache;
  try {
    const out = new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(1234.56);
    const d = new Intl.DateTimeFormat('en', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(0));
    intlCache = out === '1,234.6' && d.length > 0;
  } catch {
    intlCache = false;
  }
  return intlCache;
}

function localeFor(prefs: FormatPrefs, extra = '', dates = false): string {
  // English dates use the day-first en-GB pattern (the `en-SA` locale resolves to US month-first order in current ICU data).
  const base = prefs.lang === 'ar' ? 'ar-SA' : dates ? 'en-GB' : 'en-SA';
  const nu = prefs.lang === 'ar' && prefs.arabicDigits ? 'arab' : 'latn';
  return `${base}-u-${extra}nu-${nu}`;
}

const nfCache = new Map<string, Intl.NumberFormat>();

function intlNumber(n: number, decimals: number, prefs: FormatPrefs): string | null {
  if (!intlAvailable()) return null;
  try {
    const key = `${localeFor(prefs)}|${decimals}`;
    let nf = nfCache.get(key);
    if (!nf) {
      nf = new Intl.NumberFormat(localeFor(prefs), { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      nfCache.set(key, nf);
    }
    return nf.format(n);
  } catch {
    return null;
  }
}

function manualNumber(n: number, decimals: number, prefs: FormatPrefs): string {
  const fixed = Math.abs(n).toFixed(decimals);
  const [int = '0', frac] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const s = (n < 0 && Number(fixed) !== 0 ? '-' : '') + grouped + (frac ? `.${frac}` : '');
  return prefs.lang === 'ar' && prefs.arabicDigits ? toArabicIndic(s) : s;
}

export function formatNumber(n: number, prefs: FormatPrefs = DEFAULT_PREFS, decimals = 0): string {
  if (!Number.isFinite(n)) return '–';
  return intlNumber(n, decimals, prefs) ?? manualNumber(n, decimals, prefs);
}

/** A digit-only string (ages, minutes, positions) in the user's digit style. */
export function digits(n: number | string, prefs: FormatPrefs = DEFAULT_PREFS): string {
  const s = String(n);
  return prefs.lang === 'ar' && prefs.arabicDigits ? s.replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)] as string) : s;
}

// ---------------------------------------------------------------- money

const SUFFIX: Record<Lang, [string, string, string]> = { en: ['B', 'M', 'K'], ar: [' مليار', ' م', ' ألف'] };

export function convertMoney(eur: number, currency: Currency): number {
  return currency === 'SAR' ? eur * SAR_PER_EUR : eur;
}

function trimZeros(s: string): string {
  return /[.٫]/.test(s) ? s.replace(/[0٠]+$/, '').replace(/[.٫]$/, '') : s;
}

/** Compact money, e.g. `€12.4M`, `SAR 50.3M`, `١٢٫٤ م ر.س`. */
export function formatMoney(eur: number, prefs: FormatPrefs = DEFAULT_PREFS, opts: { compact?: boolean; signed?: boolean } = {}): string {
  if (!Number.isFinite(eur)) return '–';
  const compact = opts.compact ?? true;
  const v = convertMoney(eur, prefs.currency);
  const abs = Math.abs(v);
  let body: string;
  if (compact && abs >= 1e3) {
    const [b, m, k] = SUFFIX[prefs.lang];
    const [div, suf] = abs >= 1e9 ? [1e9, b] : abs >= 1e6 ? [1e6, m] : [1e3, k];
    const x = abs / div;
    body = trimZeros(formatNumber(x, prefs, x >= 100 ? 0 : x >= 10 ? 1 : 2)) + suf;
  } else {
    body = formatNumber(abs, prefs, 0);
  }
  const sign = v < 0 ? '-' : opts.signed && v > 0 ? '+' : '';
  if (prefs.currency === 'EUR') return `${sign}€${body}`;
  return prefs.lang === 'ar' ? `${sign}${body} ر.س` : `${sign}SAR ${body}`;
}

export function formatWage(eurPerWeek: number, prefs: FormatPrefs = DEFAULT_PREFS): string {
  return formatMoney(eurPerWeek, prefs) + (prefs.lang === 'ar' ? '/أسبوع' : '/wk');
}

// ---------------------------------------------------------------- dates

const MONTHS: Record<Lang, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

export function parseIso(iso: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) } : null;
}

/** Format an ISO date (yyyy-mm-dd, treated as UTC) e.g. `1 Aug 2026` / `١ أغسطس ٢٠٢٦`. Gregorian calendar always. */
export function formatDateIso(iso: string, prefs: FormatPrefs = DEFAULT_PREFS, opts: { short?: boolean } = {}): string {
  const p = parseIso(iso);
  if (!p) return iso;
  if (intlAvailable()) {
    try {
      const dtf = new Intl.DateTimeFormat(localeFor(prefs, 'ca-gregory-', true), {
        day: 'numeric', month: 'short', ...(opts.short ? {} : { year: 'numeric' }), timeZone: 'UTC',
      });
      const out = dtf.format(new Date(Date.UTC(p.y, p.m - 1, p.d)));
      if (out && !/Invalid/i.test(out)) return out;
    } catch {
      /* fall through to manual */
    }
  }
  const month = MONTHS[prefs.lang][p.m - 1] ?? '';
  const s = opts.short ? `${p.d} ${month}` : `${p.d} ${month} ${p.y}`;
  return prefs.lang === 'ar' && prefs.arabicDigits ? s.replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)] as string) : s;
}

const EN_MONTH_INDEX: Record<string, number> = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };

/** Engine view-models contain preformatted English labels like `14 Aug 2026`; re-localise them. */
export function localiseEngineDate(label: string | null | undefined, prefs: FormatPrefs = DEFAULT_PREFS): string {
  if (!label) return '–';
  const m = /^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4})$/.exec(label);
  const mon = m ? EN_MONTH_INDEX[m[2] as string] : undefined;
  if (!m || !mon) return label;
  const iso = `${m[3]}-${String(mon).padStart(2, '0')}-${String(Number(m[1])).padStart(2, '0')}`;
  return formatDateIso(iso, prefs);
}

export function formatPercent(x: number, prefs: FormatPrefs = DEFAULT_PREFS, decimals = 0): string {
  return `${formatNumber(x * 100, prefs, decimals)}%`;
}

/** Parse user-typed numbers: accepts Arabic-Indic digits and `,`/`٫` decimal separators. Returns NaN when invalid. */
export function parseNumber(text: string): number {
  const latin = text
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
    .replace(/[٫,]/g, '.')
    .replace(/[٬\s]/g, '')
    .trim();
  if (latin === '' || !/^-?\d*\.?\d+$/.test(latin)) return Number.NaN;
  return Number(latin);
}

/** `2026/27` for engine season number 1. */
export function seasonLabelOf(season: number): string {
  return `${2025 + season}/${String((2026 + season) % 100).padStart(2, '0')}`;
}

/** Sort key (yyyy-mm-dd) for an engine English date label, or '' if unparseable. */
export function engineDateKey(label: string | null | undefined): string {
  const m = label ? /^(\d{1,2}) ([A-Z][a-z]{2}) (\d{4})$/.exec(label) : null;
  const mon = m ? EN_MONTH_INDEX[m[2] as string] : undefined;
  return m && mon ? `${m[3]}-${String(mon).padStart(2, '0')}-${String(Number(m[1])).padStart(2, '0')}` : '';
}

/** Local clock time for an ISO timestamp, localised (Intl when available). */
export function formatClock(iso: string, prefs: FormatPrefs = DEFAULT_PREFS): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  if (intlAvailable()) {
    try {
      return new Intl.DateTimeFormat(localeFor(prefs, 'ca-gregory-'), { hour: '2-digit', minute: '2-digit' }).format(d);
    } catch { /* fall through */ }
  }
  const s = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return prefs.lang === 'ar' && prefs.arabicDigits ? s.replace(/[0-9]/g, (x) => ARABIC_DIGITS[Number(x)] as string) : s;
}
