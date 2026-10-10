import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { darkPalette, highContrastDark, highContrastLight, lightPalette, typography, type Palette, type TextVariant } from './tokens';
import { useSettings } from '../state/settings';
import { isRtl } from '../i18n/types';

export interface Theme {
  colors: Palette;
  isDark: boolean;
  rtl: boolean;
  /** Scale a base font size by the user's text-size setting. */
  fs: (size: number) => number;
  /** Line height for a variant, scaled consistently. */
  textStyle: (v: TextVariant) => { fontSize: number; lineHeight: number; fontWeight: '400' | '500' | '600' | '700' | '800' };
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }): ReactNode {
  const system = useColorScheme();
  const mode = useSettings((s) => s.theme);
  const scale = useSettings((s) => s.textScale);
  const language = useSettings((s) => s.language);
  const highContrast = useSettings((s) => s.highContrast);
  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';
  const value = useMemo<Theme>(() => {
    const colors = { ...(isDark ? darkPalette : lightPalette), ...(highContrast ? (isDark ? highContrastDark : highContrastLight) : {}) };
    const fs = (size: number): number => Math.round(size * scale * 10) / 10;
    return {
      colors, isDark, rtl: isRtl(language), fs,
      textStyle: (v) => ({ fontSize: fs(typography[v].size), lineHeight: Math.round(typography[v].line * scale), fontWeight: typography[v].weight }),
    };
  }, [isDark, scale, language, highContrast]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const t = useContext(ThemeContext);
  if (!t) throw new Error('useTheme outside ThemeProvider');
  return t;
}
