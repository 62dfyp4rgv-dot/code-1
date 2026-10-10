import type { ReactNode } from 'react';
import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { TextVariant } from '../theme/tokens';

export type TextColor = 'text' | 'muted' | 'primary' | 'danger' | 'success' | 'warning' | 'accent' | 'onPrimary' | 'info';

interface Props extends Omit<TextProps, 'style'> {
  variant?: TextVariant;
  color?: TextColor | (string & {});
  align?: 'start' | 'center' | 'end';
  /** Tabular figures for columns of numbers. */
  num?: boolean;
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
}

export function Txt({ variant = 'body', color = 'text', align = 'start', num, style, children, ...rest }: Props): ReactNode {
  const th = useTheme();
  const c = th.colors;
  const named: Record<TextColor, string> = {
    text: c.text, muted: c.textMuted, primary: c.primaryText, danger: c.danger, success: c.success, warning: c.warning, accent: c.accent, onPrimary: c.onPrimary, info: c.info,
  };
  const resolved = (named as Record<string, string>)[color] ?? color;
  const textAlign: TextStyle['textAlign'] = align === 'center' ? 'center' : (align === 'start') === th.rtl ? 'right' : 'left';
  return (
    <Text
      maxFontSizeMultiplier={1.7}
      {...rest}
      style={[th.textStyle(variant), { color: resolved, textAlign }, num ? { fontVariant: ['tabular-nums'] } : null, style]}
    >
      {children}
    </Text>
  );
}
