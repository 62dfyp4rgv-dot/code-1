import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import type { Position } from '@fu/engine';
import { useTheme } from '../theme/ThemeProvider';
import { Txt } from '../ui/Txt';
import { layoutSlots } from './pitchLayout';

export interface PitchSlot { pos: Position; label: string; sub?: string }

/** Schematic pitch with one tappable marker per formation slot. */
export function FormationPitch({ slots, items, selected, onSelect, height = 300, testID }: { slots: readonly Position[]; items: PitchSlot[]; selected?: number | null; onSelect?: (i: number) => void; height?: number; testID?: string }): ReactNode {
  const th = useTheme();
  const pts = layoutSlots(slots);
  return (
    <View testID={testID} style={{ height, borderRadius: 14, backgroundColor: th.colors.pitch, overflow: 'hidden', borderWidth: 2, borderColor: '#FFFFFF55', direction: 'ltr' }}>
      <View style={{ position: 'absolute', top: '50%', start: 0, end: 0, height: 2, backgroundColor: '#FFFFFF55' }} />
      <View style={{ position: 'absolute', top: '50%', start: '50%', width: 70, height: 70, marginStart: -35, marginTop: -35, borderRadius: 35, borderWidth: 2, borderColor: '#FFFFFF55' }} />
      {items.map((it, i) => {
        const pt = pts[i] as { x: number; y: number };
        const sel = selected === i;
        return (
          <Pressable
            key={i} testID={`pitch-slot-${i}`} accessibilityRole="button" accessibilityLabel={`${it.label}${it.sub ? ', ' + it.sub : ''}`} accessibilityState={{ selected: sel }} aria-selected={sel}
            onPress={() => onSelect?.(i)}
            style={{ position: 'absolute', left: `${pt.x * 100}%`, top: `${pt.y * 100}%`, width: 64, minHeight: 44, marginLeft: -32, marginTop: -22, alignItems: 'center', justifyContent: 'center' }}
          >
            <View style={{ minWidth: 34, height: 34, borderRadius: 17, paddingHorizontal: 4, backgroundColor: sel ? th.colors.accent : '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: sel ? '#FFFFFF' : '#0B3D2E' }}>
              <Txt variant="caption" color="#10201A" align="center" allowFontScaling={false} style={{ fontWeight: '800', fontSize: 11, lineHeight: 14 }}>{it.label}</Txt>
            </View>
            {it.sub ? <Txt variant="caption" color="#FFFFFF" align="center" numberOfLines={1} allowFontScaling={false} style={{ fontSize: 10, lineHeight: 12, maxWidth: 64 }}>{it.sub}</Txt> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
