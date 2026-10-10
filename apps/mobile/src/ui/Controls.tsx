import { useCallback, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator, PanResponder, Pressable, TextInput, View, type AccessibilityActionEvent, type GestureResponderEvent, type LayoutChangeEvent, type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { MIN_TOUCH, radii, spacing } from '../theme/tokens';
import { Txt } from './Txt';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  /** Stretch to the container width. */
  block?: boolean;
  testID?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = 'primary', icon, disabled, loading, small, block, testID, accessibilityHint, style }: ButtonProps): ReactNode {
  const { colors: c, isDark } = useTheme();
  const bg = variant === 'primary' ? c.primary : variant === 'danger' ? c.danger : variant === 'secondary' ? c.surfaceAlt : 'transparent';
  const fg = variant === 'primary' ? c.onPrimary : variant === 'danger' ? (isDark ? '#2A0A07' : '#FFFFFF') : variant === 'secondary' ? c.text : c.primaryText;
  const off = disabled || loading;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      aria-disabled={!!off}
      aria-busy={!!loading}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: small ? 36 : MIN_TOUCH, minWidth: MIN_TOUCH, paddingHorizontal: small ? spacing.md : spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: bg,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, opacity: off ? 0.5 : pressed ? 0.8 : 1,
          borderWidth: variant === 'ghost' ? 1 : 0, borderColor: c.border,
        },
        block ? { alignSelf: 'stretch' } : null,
        style,
      ]}
      hitSlop={small ? { top: 4, bottom: 4, left: 4, right: 4 } : undefined}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <Txt variant="bodyStrong" color={fg} align="center" style={{ flexShrink: 1 }}>{label}</Txt>
    </Pressable>
  );
}

interface ChipProps { label: string; selected?: boolean; onPress?: () => void; testID?: string; tone?: 'default' | 'danger' }

export function Chip({ label, selected, onPress, testID, tone = 'default' }: ChipProps): ReactNode {
  const { colors: c } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!selected }}
      aria-selected={!!selected}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: MIN_TOUCH, minWidth: MIN_TOUCH, paddingHorizontal: spacing.md, borderRadius: radii.pill, justifyContent: 'center', alignItems: 'center',
        backgroundColor: selected ? c.primary : c.surfaceAlt, borderWidth: 1, borderColor: selected ? c.primary : tone === 'danger' ? c.danger : c.border, opacity: pressed ? 0.8 : 1,
      })}
    >
      <Txt variant="small" color={selected ? c.onPrimary : c.text} style={{ fontWeight: '600' }} align="center">{label}</Txt>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }): ReactNode {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{children}</View>;
}

interface SegmentedProps<T extends string | number> { options: { value: T; label: string; testID?: string }[]; value: T; onChange: (v: T) => void; label?: string }

export function Segmented<T extends string | number>({ options, value, onChange, label }: SegmentedProps<T>): ReactNode {
  const { colors: c } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', backgroundColor: c.surfaceAlt, borderRadius: radii.md, padding: 3, gap: 3 }}>
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            testID={o.testID}
            accessibilityRole="radio"
            accessibilityLabel={o.label}
            accessibilityState={{ selected: sel, checked: sel }}
            aria-checked={sel}
            onPress={() => onChange(o.value)}
            style={{ flex: 1, minHeight: MIN_TOUCH - 6, paddingHorizontal: 6, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? c.surface : 'transparent', borderWidth: sel ? 1 : 0, borderColor: c.border }}
          >
            <Txt variant="small" color={sel ? 'primary' : 'muted'} align="center" style={{ fontWeight: sel ? '700' : '500' }} numberOfLines={2}>{o.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

interface FieldProps extends Omit<TextInputProps, 'style'> { label: string; error?: string | null; testID?: string }

export function Field({ label, error, testID, ...rest }: FieldProps): ReactNode {
  const th = useTheme();
  const c = th.colors;
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 4 }}>
      <Txt variant="caption" color="muted">{label}</Txt>
      <TextInput
        testID={testID}
        accessibilityLabel={label}
        placeholderTextColor={c.textMuted}
        {...rest}
        onFocus={(e) => { setFocus(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocus(false); rest.onBlur?.(e); }}
        style={{
          minHeight: MIN_TOUCH, borderRadius: radii.md, borderWidth: 1.5, borderColor: error ? c.danger : focus ? c.primary : c.border, backgroundColor: c.surface, color: c.text,
          paddingHorizontal: spacing.md, fontSize: th.fs(15), textAlign: th.rtl ? 'right' : 'left',
        }}
      />
      {error ? <Txt variant="caption" color="danger">{error}</Txt> : null}
    </View>
  );
}

interface StepperProps { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; format?: (v: number) => string; testID?: string }

/** A discrete +/- control for numeric values (years, weeks). */
export function Stepper({ label, value, min, max, step = 1, onChange, format, testID }: StepperProps): ReactNode {
  const { colors: c } = useTheme();
  const btn = (sign: 1 | -1, icon: IconName, name: string): ReactNode => (
    <Pressable
      accessibilityRole="button" accessibilityLabel={`${label} ${name}`} testID={testID ? `${testID}-${sign > 0 ? 'inc' : 'dec'}` : undefined}
      disabled={sign > 0 ? value >= max : value <= min}
      onPress={() => onChange(Math.min(max, Math.max(min, value + sign * step)))}
      style={{ width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: radii.md, backgroundColor: c.surfaceAlt, alignItems: 'center', justifyContent: 'center', opacity: (sign > 0 ? value >= max : value <= min) ? 0.4 : 1 }}
    >
      <Icon name={icon} size={20} />
    </Pressable>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
      <Txt variant="body" style={{ flex: 1 }}>{label}</Txt>
      {btn(-1, 'minus', '−')}
      <Txt variant="bodyStrong" num align="center" style={{ minWidth: 48 }} testID={testID ? `${testID}-value` : undefined}>{format ? format(value) : String(value)}</Txt>
      {btn(1, 'plus', '+')}
    </View>
  );
}

interface SliderProps { label: string; value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void; lowLabel?: string; highLabel?: string; testID?: string }

/**
 * Accessible slider: drag or tap the track, use the ± buttons, or adjust via screen-reader increment/decrement actions.
 * The track itself is always drawn left-to-right (low → high) regardless of UI direction.
 */
export function Slider({ label, value, min = 0, max = 100, step = 5, onChange, lowLabel, highLabel, testID }: SliderProps): ReactNode {
  const { colors: c, fs } = useTheme();
  const width = useRef(0);
  const startX = useRef(0);
  const clampStep = useCallback((v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step)), [min, max, step]);
  const fromX = useCallback((x: number) => (width.current > 0 ? clampStep(min + (Math.min(Math.max(x, 0), width.current) / width.current) * (max - min)) : value), [clampStep, min, max, value]);
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e: GestureResponderEvent) => { startX.current = e.nativeEvent.locationX; onChangeRef.current(fromXRef.current(startX.current)); },
      onPanResponderMove: (_e, g) => { onChangeRef.current(fromXRef.current(startX.current + g.dx)); },
    }),
  ).current;
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange;
  const fromXRef = useRef(fromX); fromXRef.current = fromX;
  const pct = ((value - min) / (max - min)) * 100;
  const adjust = (e: AccessibilityActionEvent): void => {
    if (e.nativeEvent.actionName === 'increment') onChange(clampStep(value + step));
    if (e.nativeEvent.actionName === 'decrement') onChange(clampStep(value - step));
  };
  return (
    <View style={{ gap: 2 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Txt variant="body">{label}</Txt>
        <Txt variant="bodyStrong" num color="primary" testID={testID ? `${testID}-value` : undefined}>{value}</Txt>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, direction: 'ltr' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${label} −`} testID={testID ? `${testID}-dec` : undefined} onPress={() => onChange(clampStep(value - step))} style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
          <Txt variant="title" color="muted">−</Txt>
        </Pressable>
        <View
          testID={testID}
          accessible accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ min, max, now: value, text: String(value) }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]} onAccessibilityAction={adjust}
          onLayout={(e: LayoutChangeEvent) => { width.current = e.nativeEvent.layout.width; }}
          style={{ flex: 1, height: MIN_TOUCH, justifyContent: 'center' }}
          {...responder.panHandlers}
        >
          <View style={{ height: 6, borderRadius: 3, backgroundColor: c.surfaceAlt, borderWidth: 1, borderColor: c.border }}>
            <View style={{ width: `${pct}%`, height: '100%', borderRadius: 3, backgroundColor: c.primary }} />
          </View>
          <View style={{ position: 'absolute', left: `${pct}%`, marginLeft: -11, width: 22, height: 22, borderRadius: 11, backgroundColor: c.primary, borderWidth: 3, borderColor: c.surface }} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`${label} +`} testID={testID ? `${testID}-inc` : undefined} onPress={() => onChange(clampStep(value + step))} style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
          <Txt variant="title" color="muted">+</Txt>
        </Pressable>
      </View>
      {lowLabel || highLabel ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: MIN_TOUCH }}>
          <Txt variant="caption" color="muted" style={{ fontSize: fs(11) }}>{lowLabel}</Txt>
          <Txt variant="caption" color="muted" style={{ fontSize: fs(11) }}>{highLabel}</Txt>
        </View>
      ) : null}
    </View>
  );
}

export function Switch({ label, value, onChange, hint, testID }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string; testID?: string }): ReactNode {
  const { colors: c } = useTheme();
  return (
    <Pressable
      testID={testID} accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }} aria-checked={value} onPress={() => onChange(!value)}
      style={{ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs }}
    >
      <View style={{ flex: 1 }}>
        <Txt variant="body">{label}</Txt>
        {hint ? <Txt variant="caption" color="muted">{hint}</Txt> : null}
      </View>
      <View style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: value ? c.primary : c.border, padding: 3, alignItems: value ? 'flex-end' : 'flex-start', justifyContent: 'center' }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: value ? c.onPrimary : c.surface }} />
      </View>
    </Pressable>
  );
}
