/** Single source of design tokens. Contrast ratios were checked against WCAG AA (4.5:1 text) — see test/theme.test.ts. */
export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  /** primary-coloured TEXT on `bg`/`surface` (must have AA contrast on them) */
  primaryText: string;
  accent: string;
  onAccent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  win: string;
  draw: string;
  loss: string;
  zoneChampion: string;
  zoneEurope: string;
  zonePlayoff: string;
  zoneRelegation: string;
  highlight: string;
  overlay: string;
  pitch: string;
}

export const lightPalette: Palette = {
  bg: '#F2F5F3', surface: '#FFFFFF', surfaceAlt: '#E8EEEA', border: '#CBD5CF', text: '#10201A', textMuted: '#4A5B53',
  primary: '#0B6B3A', onPrimary: '#FFFFFF', primaryText: '#0B6B3A', accent: '#855C00', onAccent: '#FFFFFF',
  success: '#166A31', warning: '#9A5B00', danger: '#B3261E', info: '#1F5FA8',
  win: '#166A31', draw: '#6B7A72', loss: '#B3261E',
  zoneChampion: '#C9A227', zoneEurope: '#2E7D32', zonePlayoff: '#1F5FA8', zoneRelegation: '#C62828',
  highlight: '#DDF1E4', overlay: 'rgba(8,18,13,0.55)', pitch: '#1E7A46',
};

export const darkPalette: Palette = {
  bg: '#0C1411', surface: '#141F1A', surfaceAlt: '#1D2B24', border: '#2D4036', text: '#E8F1EC', textMuted: '#A3B5AB',
  primary: '#3CCB82', onPrimary: '#04170D', primaryText: '#4BD68F', accent: '#F0C24B', onAccent: '#1C1400',
  success: '#4BD68F', warning: '#F0B35A', danger: '#FF8A80', info: '#7DB7FF',
  win: '#4BD68F', draw: '#98A8A0', loss: '#FF8A80',
  zoneChampion: '#F0C24B', zoneEurope: '#4BD68F', zonePlayoff: '#7DB7FF', zoneRelegation: '#FF8A80',
  highlight: '#183A29', overlay: 'rgba(0,0,0,0.65)', pitch: '#1E7A46',
};

export const highContrastLight: Partial<Palette> = { text: '#000000', textMuted: '#2B3832', border: '#6B7A72', primary: '#064D29', primaryText: '#064D29' };
export const highContrastDark: Partial<Palette> = { text: '#FFFFFF', textMuted: '#D3DED8', border: '#8BA397' };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radii = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
export const MIN_TOUCH = 44;

export type TextVariant = 'display' | 'h1' | 'h2' | 'title' | 'body' | 'bodyStrong' | 'small' | 'caption' | 'label';

/** size / line-height / weight. Sizes are multiplied by the user's text scale. */
export const typography: Record<TextVariant, { size: number; line: number; weight: '400' | '500' | '600' | '700' | '800' }> = {
  display: { size: 34, line: 40, weight: '800' },
  h1: { size: 26, line: 32, weight: '700' },
  h2: { size: 20, line: 26, weight: '700' },
  title: { size: 17, line: 23, weight: '600' },
  body: { size: 15, line: 21, weight: '400' },
  bodyStrong: { size: 15, line: 21, weight: '600' },
  small: { size: 13, line: 18, weight: '400' },
  caption: { size: 12, line: 16, weight: '500' },
  label: { size: 12, line: 16, weight: '700' },
};

export const MAX_CONTENT_WIDTH = 760;

/** WCAG relative luminance contrast ratio. */
export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string): number => {
    const h = hex.replace('#', '');
    const [r, g, bl] = [0, 2, 4].map((i) => {
      const c = parseInt(h.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Readable text colour (black/white) for an arbitrary club colour. */
export function readableOn(bg: string): string {
  return contrastRatio(bg, '#FFFFFF') >= contrastRatio(bg, '#10201A') ? '#FFFFFF' : '#10201A';
}
