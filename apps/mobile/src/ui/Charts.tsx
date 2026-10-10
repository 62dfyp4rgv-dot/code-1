import { useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Tiny line chart for a rank over time (rank 1 at the top). The time axis always runs left-to-right, also in RTL
 * (like the Slider track). Decorative for screen readers: pass a full sentence as `label`.
 */
export function RankSparkline({ values, total, height = 56, label, color }: { values: readonly number[]; total: number; height?: number; label: string; color?: string }): ReactNode {
  const { colors: c } = useTheme();
  const [w, setW] = useState(0);
  const stroke = color ?? c.primary;
  const pad = 6;
  const lo = Math.max(1, Math.min(...values) - 1);
  const hi = Math.min(Math.max(total, 2), Math.max(...values) + 1);
  const span = Math.max(hi - lo, 3);
  const x = (i: number): number => (values.length === 1 ? w / 2 : pad + (i / (values.length - 1)) * Math.max(0, w - pad * 2));
  const y = (v: number): number => pad + ((v - lo) / span) * (height - pad * 2);
  const d = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const lastI = values.length - 1;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ height, flex: 1, minWidth: 80, direction: 'ltr' }} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && values.length > 0 ? (
        <Svg width={w} height={height}>
          <Line x1={pad} x2={w - pad} y1={y(lo)} y2={y(lo)} stroke={c.border} strokeWidth={1} strokeDasharray="3 4" />
          <Line x1={pad} x2={w - pad} y1={y(lo + span)} y2={y(lo + span)} stroke={c.border} strokeWidth={1} strokeDasharray="3 4" />
          {values.length > 1 ? <Path d={d} stroke={stroke} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
          {values.map((v, i) => <Circle key={i} cx={x(i)} cy={y(v)} r={i === lastI ? 5 : 2.5} fill={i === lastI ? stroke : c.surface} stroke={stroke} strokeWidth={i === lastI ? 0 : 1.5} />)}
        </Svg>
      ) : null}
    </View>
  );
}
