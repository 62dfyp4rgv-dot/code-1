import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { MAX_CONTENT_WIDTH, MIN_TOUCH, radii, spacing } from '../theme/tokens';
import { useI18n } from '../i18n/useI18n';
import { Txt } from './Txt';
import { Icon } from './Icon';

interface Props { visible: boolean; title: string; onClose: () => void; children?: ReactNode; testID?: string; footer?: ReactNode }

/** Bottom sheet dialog (React Native Modal: works on iOS, Android and web). */
export function Sheet({ visible, title, onClose, children, testID, footer }: Props): ReactNode {
  const th = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent supportedOrientations={['portrait', 'landscape']}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: th.colors.overlay, direction: th.rtl ? 'rtl' : 'ltr' }} testID={testID}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityRole="button" accessibilityLabel={t('common.close')} />
        <View
          accessibilityViewIsModal accessibilityLabel={title}
          style={{ backgroundColor: th.colors.surface, borderTopStartRadius: radii.lg, borderTopEndRadius: radii.lg, maxHeight: '88%', width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', paddingBottom: Math.max(insets.bottom, spacing.md) }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm }}>
            <Txt variant="h2" style={{ flex: 1 }} accessibilityRole="header">{title}</Txt>
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} testID="sheet-close" onPress={onClose} style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="close" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.md }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
          {footer ? <View style={{ padding: spacing.lg, paddingTop: 0, gap: spacing.sm }}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}
