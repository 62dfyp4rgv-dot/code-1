import type { ReactNode } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

export type IconName =
  | 'chevronRight' | 'chevronLeft' | 'home' | 'users' | 'calendar' | 'swap' | 'menu' | 'check' | 'close' | 'plus' | 'trophy' | 'ball' | 'info' | 'alert'
  | 'search' | 'save' | 'play' | 'stop' | 'globe' | 'chart' | 'user' | 'board' | 'coin' | 'sliders' | 'news' | 'shield' | 'star' | 'flag' | 'download' | 'upload' | 'minus';

const PATHS: Record<IconName, string[]> = {
  chevronRight: ['M9 5l7 7-7 7'],
  chevronLeft: ['M15 5l-7 7 7 7'],
  home: ['M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z'],
  users: ['M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M2.5 20c0-3.5 2.7-5.5 6.5-5.5s6.5 2 6.5 5.5', 'M16 4.3a3.5 3.5 0 0 1 0 6.4', 'M18 14.8c2 .6 3.5 2.2 3.5 5.2'],
  calendar: ['M4 6h16v14H4z', 'M4 10h16', 'M8 3v4', 'M16 3v4'],
  swap: ['M7 8h12', 'M16 4l3 4-3 4', 'M17 16H5', 'M8 12l-3 4 3 4'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  check: ['M5 12.5l4.5 4.5L19 7'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  plus: ['M12 5v14', 'M5 12h14'],
  minus: ['M5 12h14'],
  trophy: ['M8 4h8v5a4 4 0 0 1-8 0z', 'M8 6H5a3 3 0 0 0 3 4', 'M16 6h3a3 3 0 0 1-3 4', 'M12 13v4', 'M8 20h8'],
  ball: ['M12 8l3.2 2.3-1.2 3.7h-4l-1.2-3.7z', 'M12 3v5', 'M15.2 10.3L20 8.7', 'M14 14l3 4', 'M10 14l-3 4', 'M8.8 10.3L4 8.7'],
  info: ['M12 11v6', 'M12 7.5v.01'],
  alert: ['M12 3l10 18H2z', 'M12 10v5', 'M12 18v.01'],
  search: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M20 20l-4-4'],
  save: ['M5 3h11l3 3v15H5z', 'M8 3v6h8V3', 'M8 21v-7h8v7'],
  play: ['M7 4l13 8-13 8z'],
  stop: ['M6 6h12v12H6z'],
  globe: ['M3 12h18', 'M12 3c3.5 3.2 3.5 14.8 0 18', 'M12 3c-3.5 3.2-3.5 14.8 0 18'],
  chart: ['M4 20V10', 'M10 20V4', 'M16 20v-8', 'M22 20H2'],
  user: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21c0-4 4-6 8-6s8 2 8 6'],
  board: ['M3 5h18v14H3z', 'M12 5v14', 'M3 12h4', 'M17 12h4'],
  coin: ['M12 7v10', 'M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.3 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.400 0-2.500-.5-3-1.5'],
  sliders: ['M4 7h9', 'M17 7h3', 'M4 17h3', 'M11 17h9', 'M15 4v6', 'M9 14v6'],
  news: ['M4 5h13v14H6a2 2 0 0 1-2-2z', 'M17 9h3v8a2 2 0 0 1-2 2', 'M8 9h5', 'M8 13h5'],
  shield: ['M12 3l8 3v6c0 4.5-3.4 7.5-8 9-4.6-1.5-8-4.5-8-9V6z'],
  star: ['M12 3l2.7 5.6 6.1.9-4.4 4.300 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.300 6.1-.9z'],
  flag: ['M5 21V4', 'M5 4h12l-2 4 2 4H5'],
  download: ['M12 4v11', 'M7 11l5 5 5-5', 'M5 20h14'],
  upload: ['M12 16V5', 'M7 9l5-5 5 5', 'M5 20h14'],
};

const CIRCLES: Partial<Record<IconName, { cx: number; cy: number; r: number }[]>> = {
  ball: [{ cx: 12, cy: 12, r: 9 }], info: [{ cx: 12, cy: 12, r: 9 }], globe: [{ cx: 12, cy: 12, r: 9 }], coin: [{ cx: 12, cy: 12, r: 9 }],
  sliders: [{ cx: 15, cy: 7, r: 2 }, { cx: 9, cy: 17, r: 2 }],
};

const FILLED: ReadonlySet<IconName> = new Set<IconName>(['play', 'stop']);
const MIRRORED: ReadonlySet<IconName> = new Set<IconName>(['chevronRight', 'chevronLeft']);

interface Props { name: IconName; size?: number; color?: string; strokeWidth?: number }

/** Simple stroke icons. Direction-sensitive glyphs (chevrons) flip in RTL. */
export function Icon({ name, size = 22, color, strokeWidth = 2 }: Props): ReactNode {
  const th = useTheme();
  const stroke = color ?? th.colors.text;
  const flip = th.rtl && MIRRORED.has(name);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={flip ? { transform: [{ scaleX: -1 }] } : undefined} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {(CIRCLES[name] ?? []).map((c, i) => <Circle key={`c${i}`} cx={c.cx} cy={c.cy} r={c.r} stroke={stroke} strokeWidth={strokeWidth} fill="none" />)}
      {(PATHS[name] ?? []).map((d, i) => (
        <Path key={i} d={d} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={FILLED.has(name) ? stroke : 'none'} />
      ))}
    </Svg>
  );
}
