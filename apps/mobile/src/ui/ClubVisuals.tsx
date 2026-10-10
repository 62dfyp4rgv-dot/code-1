import { useState, type ReactNode } from 'react';
import { Image, Pressable, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Rect } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { readableOn, radii, spacing } from '../theme/tokens';
import { Txt } from './Txt';
import { clubColors, clubCrestUri, isRenderableCrest } from '../state/lookups';
import { hashStr, initialsOf } from '../core/identity';

export { hashStr, initialsOf };

const SHIELD = 'M12 1.5 L21.5 4.5 V12 C21.5 17.5 17.5 21 12 22.8 C6.5 21 2.5 17.5 2.5 12 V4.5 Z';

/**
 * Club crest. Shows the data pack's local/embedded crest image when the club has one and it loads; otherwise (no image, an
 * `asset:` URI, a load error) the original generated crest: a shield in the club's two colours with a deterministic pattern and
 * initials. Remote URLs are never fetched (`clubCrestUri` only returns file:// and data:image URIs).
 */
export function Crest({ clubId, name, size = 36, colors, crest }: { clubId?: string | null; name: string; size?: number; colors?: [string, string]; crest?: string | null }): ReactNode {
  // `crest`/`colors` let a screen that holds the club record itself (the new-career picker, whose pending world is not the loaded one) bypass the lookup
  const uri = crest !== undefined ? (crest && isRenderableCrest(crest) ? crest : null) : clubCrestUri(clubId);
  const [failed, setFailed] = useState<string | null>(null);
  if (uri && failed !== uri) {
    return (
      <View style={{ width: size, height: size }} accessible accessibilityRole="image" accessibilityLabel={name}>
        <Image
          source={{ uri }} style={{ width: size, height: size }} resizeMode="contain" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
          onError={() => setFailed(uri)} testID="crest-image"
        />
      </View>
    );
  }
  return <GeneratedCrest clubId={clubId} name={name} size={size} colors={colors} />;
}

function GeneratedCrest({ clubId, name, size, colors }: { clubId?: string | null; name: string; size: number; colors?: [string, string] }): ReactNode {
  const [c0, c1] = colors ?? clubColors(clubId);
  const variant = hashStr(clubId ?? name) % 4;
  const ink = readableOn(c0);
  const uid = `cl${hashStr((clubId ?? name) + size)}`;
  return (
    <View style={{ width: size, height: size }} accessible accessibilityRole="image" accessibilityLabel={name}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Defs>
          <ClipPath id={uid}><Path d={SHIELD} /></ClipPath>
        </Defs>
        <G clipPath={`url(#${uid})`}>
          <Rect x="0" y="0" width="24" height="24" fill={c0} />
          {variant === 0 ? <Rect x="12" y="0" width="12" height="24" fill={c1} /> : null}
          {variant === 1 ? <Rect x="0" y="9" width="24" height="6" fill={c1} /> : null}
          {variant === 2 ? <Path d="M0 0 L24 0 L24 8 L12 16 L0 8 Z" fill={c1} /> : null}
          {variant === 3 ? <Path d="M-2 22 L22 -2 L26 2 L2 26 Z" fill={c1} /> : null}
        </G>
        <Path d={SHIELD} fill="none" stroke={readableOn(c1) === '#FFFFFF' ? '#10201A' : '#FFFFFF'} strokeOpacity={0.55} strokeWidth={1} />
      </Svg>
      <View style={{ position: 'absolute', top: size * 0.3, start: size * 0.2, end: size * 0.2, height: size * 0.4, borderRadius: size * 0.1, backgroundColor: c0, alignItems: 'center', justifyContent: 'center' }}>
        <Txt variant="label" color={ink} align="center" style={{ fontSize: Math.max(8, size * 0.26), lineHeight: Math.max(10, size * 0.32), fontWeight: '800' }} allowFontScaling={false} maxFontSizeMultiplier={1}>
          {initialsOf(name)}
        </Txt>
      </View>
    </View>
  );
}

function hsl(h: number, sPct: number, lPct: number): string {
  const s = sPct / 100;
  const l = lPct / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number): string => {
    const k = (n + h / 30) % 12;
    const col = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * col).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Initials avatar with a stable colour derived from the name (no photos are ever used). */
export function Avatar({ name, size = 40 }: { name: string; size?: number }): ReactNode {
  const bg = hsl(hashStr(name) % 360, 42, 38);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={name} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Txt variant="label" color="#FFFFFF" align="center" allowFontScaling={false} style={{ fontSize: size * 0.34, lineHeight: size * 0.4, fontWeight: '800' }}>{initialsOf(name)}</Txt>
    </View>
  );
}

export function FormDots({ form }: { form: ('W' | 'D' | 'L')[] }): ReactNode {
  const { colors: c } = useTheme();
  const col = { W: c.win, D: c.draw, L: c.loss };
  return (
    <View style={{ flexDirection: 'row', gap: 3 }} accessible accessibilityLabel={form.join(' ')}>
      {form.map((r, i) => (
        <View key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: col[r], alignItems: 'center', justifyContent: 'center' }}>
          <Txt variant="caption" color={r === 'W' ? c.bg : '#FFFFFF'} allowFontScaling={false} style={{ fontSize: 9, lineHeight: 11, fontWeight: '800' }}>{r}</Txt>
        </View>
      ))}
    </View>
  );
}

export function PosBadge({ pos, label }: { pos: string; label?: string }): ReactNode {
  const { colors: c } = useTheme();
  const group = pos === 'GK' ? c.warning : ['CB', 'LB', 'RB'].includes(pos) ? c.info : ['DM', 'CM', 'AM'].includes(pos) ? c.success : c.danger;
  return (
    <View style={{ minWidth: 34, paddingHorizontal: 5, height: 22, borderRadius: radii.sm, borderWidth: 1.5, borderColor: group, alignItems: 'center', justifyContent: 'center' }}>
      <Txt variant="caption" color={group} allowFontScaling={false} style={{ fontWeight: '800', fontSize: 11, lineHeight: 14 }}>{label ?? pos}</Txt>
    </View>
  );
}

/** Colour-coded numeric pill for abilities and ratings. */
export function RatingPill({ value, max = 100, label }: { value: number | string; max?: number; label?: string }): ReactNode {
  const { colors: c } = useTheme();
  const n = typeof value === 'number' ? value / max : 0;
  const tone = n >= 0.75 ? c.success : n >= 0.55 ? c.info : n >= 0.4 ? c.warning : c.danger;
  return (
    <View accessible accessibilityLabel={label} style={{ minWidth: 38, paddingHorizontal: 6, height: 26, borderRadius: radii.sm, backgroundColor: c.surfaceAlt, borderBottomWidth: 3, borderBottomColor: tone, alignItems: 'center', justifyContent: 'center' }}>
      <Txt variant="small" num align="center" style={{ fontWeight: '800' }}>{value}</Txt>
    </View>
  );
}

export function Dot({ color, size = 8 }: { color: string; size?: number }): ReactNode {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, marginEnd: spacing.xs }} />;
}

export interface FormChipData { id: string; result: 'W' | 'D' | 'L'; label: string; letter: string }

/** Large W/D/L chips (letter + colour, so it never relies on colour alone). Tapping a chip opens that match. */
export function FormChips({ items, onPress, size = 32 }: { items: FormChipData[]; onPress?: (id: string) => void; size?: number }): ReactNode {
  const { colors: c } = useTheme();
  const col = { W: c.win, D: c.draw, L: c.loss };
  return (
    <View style={{ flexDirection: 'row', gap: spacing.md }} testID="form-chips">
      {items.map((it) => {
        const bg = col[it.result];
        return (
          <Pressable
            key={it.id} accessibilityRole={onPress ? 'button' : 'text'} accessibilityLabel={it.label} onPress={onPress ? () => onPress(it.id) : undefined} hitSlop={6}
            style={({ pressed }) => ({ width: size, height: size, borderRadius: size / 3, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}
          >
            <Txt variant="label" color={readableOn(bg)} align="center" allowFontScaling={false} style={{ fontSize: 13, lineHeight: 16, fontWeight: '800' }}>{it.letter}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
