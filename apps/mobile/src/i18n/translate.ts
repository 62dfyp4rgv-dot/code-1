import { en } from './en';
import { ar } from './ar';
import type { Lang } from './types';

export type TKey = keyof typeof en;
export type TParams = Record<string, string | number>;

const DICTS: Record<Lang, Record<string, string>> = { en, ar };

function interpolate(s: string, params?: TParams): string {
  if (!params) return s;
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}

/** Pure translate: falls back to English, then to the key itself (never throws, never returns undefined). */
export function translate(lang: Lang, key: TKey, params?: TParams): string {
  return interpolate(DICTS[lang][key] ?? en[key] ?? key, params);
}

/** Dynamic lookup for engine ids (positions, roles, attributes ...). Returns `fallback` when no entry exists. */
export function translateDynamic(lang: Lang, key: string, fallback: string, params?: TParams): string {
  const s = DICTS[lang][key] ?? (en as Record<string, string>)[key];
  return s === undefined ? fallback : interpolate(s, params);
}

export function hasKey(lang: Lang, key: string): boolean {
  return key in DICTS[lang];
}
