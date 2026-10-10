import { create } from 'zustand';
import type { Currency, FormatPrefs } from '../core/format';
import type { Lang } from '../i18n/types';
import type { SaveStore } from '../core/saves/types';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface Settings {
  theme: ThemeMode;
  language: Lang;
  /** Multiplier on all text sizes, on top of the OS font scale. */
  textScale: number;
  currency: Currency;
  arabicDigits: boolean;
  autosave: boolean;
  highContrast: boolean;
  lastSlot: number | null;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system', language: 'en', textScale: 1, currency: 'EUR', arabicDigits: false, autosave: true, highContrast: false, lastSlot: null,
};

const KEY = 'ui.settings.v1';

export function parseSettings(raw: string | null): Settings {
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    const o = JSON.parse(raw) as Partial<Settings>;
    const s: Settings = { ...DEFAULT_SETTINGS };
    if (o.theme === 'light' || o.theme === 'dark' || o.theme === 'system') s.theme = o.theme;
    if (o.language === 'en' || o.language === 'ar') s.language = o.language;
    if (typeof o.textScale === 'number' && o.textScale >= 0.8 && o.textScale <= 1.6) s.textScale = o.textScale;
    if (o.currency === 'EUR' || o.currency === 'SAR') s.currency = o.currency;
    if (typeof o.arabicDigits === 'boolean') s.arabicDigits = o.arabicDigits;
    if (typeof o.autosave === 'boolean') s.autosave = o.autosave;
    if (typeof o.highContrast === 'boolean') s.highContrast = o.highContrast;
    if (typeof o.lastSlot === 'number' || o.lastSlot === null) s.lastSlot = o.lastSlot ?? null;
    return s;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

interface SettingsState extends Settings {
  loaded: boolean;
  hydrate(store: SaveStore): Promise<void>;
  update(patch: Partial<Settings>): void;
  attach(store: SaveStore | null): void;
}

let storeRef: SaveStore | null = null;

export const useSettings = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  loaded: false,
  attach(store) {
    storeRef = store;
  },
  async hydrate(store) {
    storeRef = store;
    let raw: string | null = null;
    try { raw = await store.getSetting(KEY); } catch { /* start with defaults */ }
    set({ ...parseSettings(raw), loaded: true });
  },
  update(patch) {
    set(patch);
    const s = get();
    const snapshot: Settings = {
      theme: s.theme, language: s.language, textScale: s.textScale, currency: s.currency, arabicDigits: s.arabicDigits,
      autosave: s.autosave, highContrast: s.highContrast, lastSlot: s.lastSlot,
    };
    void storeRef?.setSetting(KEY, JSON.stringify(snapshot)).catch(() => undefined);
  },
}));

export function prefsOf(s: Pick<Settings, 'language' | 'currency' | 'arabicDigits'>): FormatPrefs {
  return { lang: s.language, currency: s.currency, arabicDigits: s.arabicDigits };
}
