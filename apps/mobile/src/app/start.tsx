import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSettings } from '../state/settings';
import { loadSlot, useGame } from '../state/gameStore';
import { useI18n } from '../i18n/useI18n';
import { useTheme } from '../theme/ThemeProvider';
import { Screen, Banner, Card, Spinner } from '../ui/Layout';
import { Button } from '../ui/Controls';
import { Txt } from '../ui/Txt';
import { Icon } from '../ui/Icon';
import { radii, spacing } from '../theme/tokens';

export default function Start(): ReactNode {
  const { t, dig, date } = useI18n();
  const th = useTheme();
  const router = useRouter();
  const slots = useGame((s) => s.slots);
  const bootError = useGame((s) => s.bootError);
  const busy = useGame((s) => s.busy);
  const storeKind = useGame((s) => s.storeKind);
  const lastSlot = useSettings((s) => s.lastSlot);
  const last = slots.find((s) => s.slot === lastSlot) ?? [...slots].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0];

  const onContinue = async (): Promise<void> => {
    if (!last) return;
    if (await loadSlot(last.slot)) router.replace('/');
  };

  return (
    <Screen testID="screen-start">
      <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl }}>
        <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: th.colors.pitch, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: th.colors.surface }}>
          <Icon name="ball" size={56} color="#FFFFFF" strokeWidth={1.6} />
        </View>
        <Txt variant="display" align="center" accessibilityRole="header">Football Universe</Txt>
        <Txt variant="body" color="muted" align="center">{t('start.tagline')}</Txt>
      </View>
      {bootError ? <Banner tone="error" text={t('start.storageError')} detail={bootError} /> : null}
      {busy === 'loading' ? <Spinner label={t('start.loading')} /> : null}
      <View style={{ gap: spacing.md }}>
        {last ? (
          <Card testID="continue-card" accent={th.colors.primary}>
            <Txt variant="caption" color="muted">{t('start.lastSave')}</Txt>
            <Txt variant="title">{last.name}</Txt>
            <Txt variant="small" color="muted">
              {last.clubName ?? ''} · {t('home.season')} {dig(2025 + last.season)}/{dig(String((2026 + last.season) % 100).padStart(2, '0'))} · {date(new Date(last.updatedAt).toISOString().slice(0, 10))}
            </Txt>
            <Button label={t('start.continue')} icon="play" onPress={onContinue} loading={busy === 'loading'} testID="btn-continue" />
          </Card>
        ) : null}
        <Button label={t('start.newCareer')} variant={last ? 'secondary' : 'primary'} icon="plus" onPress={() => router.push('/new-career')} testID="btn-new-career" />
        <Button label={t('start.loadGame')} variant="secondary" icon="save" onPress={() => router.push('/saves')} testID="btn-load" />
        <Button label={t('nav.settings')} variant="ghost" icon="sliders" onPress={() => router.push('/settings')} testID="btn-settings" />
        <Button label={t('nav.about')} variant="ghost" icon="info" onPress={() => router.push('/about')} testID="btn-about" />
      </View>
      <View style={{ padding: spacing.md, borderRadius: radii.md, backgroundColor: th.colors.surfaceAlt, gap: 4 }}>
        <Txt variant="caption" color="muted">{t('start.fictional')}</Txt>
        <Txt variant="caption" color="muted">{t('start.storage', { kind: storeKind === 'sqlite' ? 'SQLite' : 'IndexedDB' })}</Txt>
      </View>
    </Screen>
  );
}
