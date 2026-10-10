import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';
import { Txt } from './Txt';

export interface Column<R> {
  key: string;
  title: string;
  /** Fixed width in px. Columns without width share the remaining space (flex 1). */
  width?: number;
  align?: 'start' | 'center' | 'end';
  render: (row: R, index: number) => ReactNode;
  /** Hide below this window width (progressive disclosure at 320px). */
  minWidth?: number;
  accessibilityLabel?: string;
}

interface Props<R> {
  columns: Column<R>[];
  rows: R[];
  rowKey: (row: R, i: number) => string;
  onRowPress?: (row: R) => void;
  rowHighlight?: (row: R) => boolean;
  rowAccent?: (row: R) => string | undefined;
  rowLabel?: (row: R) => string;
  windowWidth: number;
  testID?: string;
}

/** Dense, scannable table that never scrolls horizontally: columns collapse by `minWidth`. */
export function DataTable<R>({ columns, rows, rowKey, onRowPress, rowHighlight, rowAccent, rowLabel, windowWidth, testID }: Props<R>): ReactNode {
  const { colors: c } = useTheme();
  const cols = columns.filter((col) => (col.minWidth ?? 0) <= windowWidth);
  const jc = (a?: 'start' | 'center' | 'end'): 'flex-start' | 'center' | 'flex-end' => (a === 'center' ? 'center' : a === 'end' ? 'flex-end' : 'flex-start');
  return (
    <View testID={testID} style={{ borderRadius: 12, borderWidth: 1, borderColor: c.border, overflow: 'hidden', backgroundColor: c.surface }}>
      <View style={{ flexDirection: 'row', backgroundColor: c.surfaceAlt, paddingVertical: 6, paddingHorizontal: spacing.sm, gap: 4 }}>
        {cols.map((col) => (
          <View key={col.key} style={[col.width ? { width: col.width } : { flex: 1 }, { justifyContent: 'center', alignItems: jc(col.align) }]}>
            <Txt variant="label" color="muted" align={col.align} numberOfLines={1} accessibilityLabel={col.accessibilityLabel}>{col.title}</Txt>
          </View>
        ))}
      </View>
      {rows.map((row, i) => {
        const hi = rowHighlight?.(row);
        const accent = rowAccent?.(row);
        const inner = (
          <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingHorizontal: spacing.sm, gap: 4, backgroundColor: hi ? c.highlight : 'transparent', borderBottomWidth: i === rows.length - 1 ? 0 : 1, borderBottomColor: c.border, borderStartWidth: 4, borderStartColor: accent ?? 'transparent' }}>
            {cols.map((col) => (
              <View key={col.key} style={[col.width ? { width: col.width } : { flex: 1 }, { justifyContent: 'center', alignItems: jc(col.align) }]}>{col.render(row, i)}</View>
            ))}
          </View>
        );
        return onRowPress ? (
          <Pressable key={rowKey(row, i)} accessibilityRole="button" accessibilityLabel={rowLabel?.(row)} onPress={() => onRowPress(row)}>{inner}</Pressable>
        ) : (
          <View key={rowKey(row, i)} accessible={!!rowLabel} accessibilityLabel={rowLabel?.(row)}>{inner}</View>
        );
      })}
    </View>
  );
}
