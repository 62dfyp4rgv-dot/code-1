import { useCallback, type ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, RefreshControl, ScrollView, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { MAX_CONTENT_WIDTH, MIN_TOUCH, radii, spacing } from '../theme/tokens';
import { useI18n } from '../i18n/useI18n';
import { Txt } from './Txt';
import { Icon, type IconName } from './Icon';

interface ScreenProps {
  title?: string;
  subtitle?: string;
  /** Show a back button (stack screens). */
  back?: boolean;
  right?: ReactNode;
  /** Render children without wrapping in a ScrollView (for screens with virtualised lists). */
  noScroll?: boolean;
  children?: ReactNode;
  testID?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  /** Reserve space for the bottom tab bar. */
  tabs?: boolean;
}

export function Screen({ title, subtitle, back, right, noScroll, children, testID, onRefresh, refreshing, tabs }: ScreenProps): ReactNode {
  const th = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const goBack = useCallback(() => { if (router.canGoBack()) router.back(); else router.replace('/'); }, [router]);
  const large = !!title && !back;
  const largeHeader = large ? (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, minHeight: 48 }}>
      <View style={{ flex: 1 }}>
        <Txt variant="display" numberOfLines={2} accessibilityRole="header" adjustsFontSizeToFit minimumFontScale={0.75}>{title}</Txt>
        {subtitle ? <Txt variant="small" color="muted" numberOfLines={1}>{subtitle}</Txt> : null}
      </View>
      {right}
    </View>
  ) : null;
  const header = back ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: 56, borderBottomWidth: 1, borderBottomColor: th.colors.border, backgroundColor: th.colors.surface }}>
      {back ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} testID="back-button" onPress={goBack} hitSlop={8} style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevronLeft" />
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        {title ? <Txt variant="h2" numberOfLines={1} accessibilityRole="header">{title}</Txt> : null}
        {subtitle ? <Txt variant="caption" color="muted" numberOfLines={1}>{subtitle}</Txt> : null}
      </View>
      {right}
    </View>
  ) : null;
  const pad = { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl + (tabs ? 0 : insets.bottom), gap: spacing.lg };
  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: th.colors.bg, paddingTop: insets.top, paddingStart: insets.left, paddingEnd: insets.right }}>
      {header}
      {noScroll ? (
        <View style={{ flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }}>{largeHeader ? <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>{largeHeader}</View> : null}{children}</View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[pad, { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined}
        >
          {largeHeader}
          {children}
        </ScrollView>
      )}
    </View>
  );
}

export function Card({ children, style, padded = true, testID, accent }: { children?: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean; testID?: string; accent?: string }): ReactNode {
  const { colors: c } = useTheme();
  return (
    <View
      testID={testID}
      style={[{ backgroundColor: c.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: c.border, padding: padded ? spacing.lg : 0, gap: spacing.md, overflow: 'hidden' }, accent ? { borderTopWidth: 4, borderTopColor: accent } : null, style]}
    >
      {children}
    </View>
  );
}

export function Section({ title, right, children, testID }: { title?: string; right?: ReactNode; children?: ReactNode; testID?: string }): ReactNode {
  return (
    <View style={{ gap: spacing.sm }} testID={testID}>
      {title || right ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
          {title ? <Txt variant="title" accessibilityRole="header" style={{ flex: 1 }}>{title}</Txt> : <View style={{ flex: 1 }} />}
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

interface RowProps {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  testID?: string;
  selected?: boolean;
  accessibilityLabel?: string;
  divider?: boolean;
}

export function Row({ title, subtitle, left, right, onPress, chevron, testID, selected, accessibilityLabel, divider = true }: RowProps): ReactNode {
  const { colors: c } = useTheme();
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH + 4, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}>
      {left}
      <View style={{ flex: 1, gap: 1 }}>
        <Txt variant="bodyStrong" numberOfLines={2}>{title}</Txt>
        {subtitle ? <Txt variant="small" color="muted" numberOfLines={2}>{subtitle}</Txt> : null}
      </View>
      {right}
      {chevron ? <Icon name="chevronRight" size={18} color={c.textMuted} /> : null}
    </View>
  );
  const border = divider ? { borderBottomWidth: 1, borderBottomColor: c.border } : null;
  if (!onPress) return <View testID={testID} style={[border, selected ? { backgroundColor: c.highlight } : null]}>{body}</View>;
  return (
    <Pressable
      testID={testID} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}, ${subtitle}` : title)} onPress={onPress}
      style={({ pressed }) => [border, { backgroundColor: selected ? c.highlight : pressed ? c.surfaceAlt : 'transparent' }]}
    >
      {body}
    </Pressable>
  );
}

/** A Card containing Rows (zero padding, hairline dividers). */
export function RowGroup({ children, testID }: { children?: ReactNode; testID?: string }): ReactNode {
  return <Card padded={false} style={{ gap: 0 }} testID={testID}>{children}</Card>;
}

export function Banner({ tone = 'info', text, detail, onDismiss, testID, action }: { tone?: 'info' | 'warn' | 'error' | 'success'; text: string; detail?: string; onDismiss?: () => void; testID?: string; action?: ReactNode }): ReactNode {
  const { colors: c } = useTheme();
  const t = useI18n().t;
  const color = tone === 'error' ? c.danger : tone === 'warn' ? c.warning : tone === 'success' ? c.success : c.info;
  const icon: IconName = tone === 'error' || tone === 'warn' ? 'alert' : tone === 'success' ? 'check' : 'info';
  return (
    <View
      testID={testID} accessibilityRole="alert" accessibilityLiveRegion="polite"
      style={{ flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radii.md, backgroundColor: c.surface, borderWidth: 1.5, borderColor: color, alignItems: 'flex-start' }}
    >
      <Icon name={icon} size={20} color={color} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt variant="small" style={{ fontWeight: '600' }}>{text}</Txt>
        {detail ? <Txt variant="caption" color="muted">{detail}</Txt> : null}
        {action}
      </View>
      {onDismiss ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.dismiss')} onPress={onDismiss} hitSlop={10} style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="close" size={16} color={c.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function Divider(): ReactNode {
  const { colors: c } = useTheme();
  return <View style={{ height: 1, backgroundColor: c.border }} />;
}

export function Empty({ text, icon = 'info' }: { text: string; icon?: IconName }): ReactNode {
  const { colors: c } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: spacing.sm, padding: spacing.xl }}>
      <Icon name={icon} size={28} color={c.textMuted} />
      <Txt variant="small" color="muted" align="center">{text}</Txt>
    </View>
  );
}

export function Spinner({ label }: { label?: string }): ReactNode {
  const { colors: c } = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: spacing.md, padding: spacing.xl }} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator size="large" color={c.primary} />
      {label ? <Txt variant="small" color="muted" align="center">{label}</Txt> : null}
    </View>
  );
}

export function KeyValue({ label, value, valueColor, testID }: { label: string; value: string; valueColor?: string; testID?: string }): ReactNode {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.md, paddingVertical: 3 }} testID={testID}>
      <Txt variant="small" color="muted" style={{ flexShrink: 1 }}>{label}</Txt>
      <Txt variant="bodyStrong" num color={valueColor ?? 'text'} style={{ flexShrink: 1 }} align="end">{value}</Txt>
    </View>
  );
}

export function ProgressBar({ value, color, label, height = 8 }: { value: number; color?: string; label?: string; height?: number }): ReactNode {
  const { colors: c } = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }} style={{ height, borderRadius: height / 2, backgroundColor: c.surfaceAlt, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: color ?? c.primary, borderRadius: height / 2 }} />
    </View>
  );
}

export function StatTile({ label, value, tone, testID }: { label: string; value: string; tone?: string; testID?: string }): ReactNode {
  const { colors: c } = useTheme();
  return (
    <View testID={testID} style={{ flex: 1, minWidth: 96, backgroundColor: c.surfaceAlt, borderRadius: radii.md, padding: spacing.md, gap: 2 }}>
      <Txt variant="caption" color="muted" numberOfLines={1}>{label}</Txt>
      <Txt variant="h2" num color={tone ?? 'text'} numberOfLines={1} adjustsFontSizeToFit>{value}</Txt>
    </View>
  );
}

export function useIsNarrow(): boolean {
  return useWindowDimensions().width < 360;
}
export function useIsWide(): boolean {
  return useWindowDimensions().width >= 420;
}
