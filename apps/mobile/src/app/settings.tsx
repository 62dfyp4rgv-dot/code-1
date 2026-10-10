import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { runIntegrityCheck, useGame } from '../state/gameStore';
import { useSettings } from '../state/settings';
import { SAR_PER_EUR } from '../core/format';
import { useI18n } from '../i18n/useI18n';
import { Screen, Card, Section, Banner, KeyValue } from '../ui/Layout';
import { Button, Segmented, Switch, Slider } from '../ui/Controls';
import { Txt } from '../ui/Txt';
import { spacing } from '../theme/tokens';

export default function SettingsScreen(): ReactNode {
  const { t, num } = useI18n();
  const router = useRouter();
  const s = useSettings();
  const hasWorld = useGame((g) => g.hasWorld);
  const validation = useGame((g) => g.lastValidation);
  const storeKind = useGame((g) => g.storeKind);
  const [checking, setChecking] = useState(false);
  const check = (): void => {
    setChecking(true);
    setTimeout(() => { try { runIntegrityCheck(); } finally { setChecking(false); } }, 30);
  };
  return (
    <Screen back title={t('nav.settings')} testID="screen-settings">
      <Section title={t('settings.language')}>
        <Segmented<'en' | 'ar'> label={t('settings.language')} value={s.language} onChange={(v) => s.update({ language: v })}
          options={[{ value: 'en', label: 'English', testID: 'lang-en' }, { value: 'ar', label: 'العربية', testID: 'lang-ar' }]} />
        {s.language === 'ar' ? <Switch label={t('settings.arabicDigits')} value={s.arabicDigits} onChange={(v) => s.update({ arabicDigits: v })} testID="switch-arabic-digits" /> : null}
      </Section>
      <Section title={t('settings.theme')}>
        <Segmented<'system' | 'light' | 'dark'> label={t('settings.theme')} value={s.theme} onChange={(v) => s.update({ theme: v })}
          options={[{ value: 'system', label: t('settings.theme.system'), testID: 'theme-system' }, { value: 'light', label: t('settings.theme.light'), testID: 'theme-light' }, { value: 'dark', label: t('settings.theme.dark'), testID: 'theme-dark' }]} />
      </Section>
      <Section title={t('settings.textSize')}>
        <Card>
          <Slider label={t('settings.textSize')} value={Math.round(s.textScale * 100)} min={80} max={160} step={10} onChange={(v) => s.update({ textScale: v / 100 })} testID="slider-textsize" lowLabel="80%" highLabel="160%" />
          <Txt variant="body">{t('settings.textSample')}</Txt>
          <Switch label={t('settings.highContrast')} value={s.highContrast} onChange={(v) => s.update({ highContrast: v })} testID="switch-contrast" />
          <Switch label={t('settings.haptics')} hint={t('settings.hapticsHint')} value={s.haptics} onChange={(v) => s.update({ haptics: v })} testID="switch-haptics" />
        </Card>
      </Section>
      <Section title={t('settings.currency')}>
        <Segmented<'EUR' | 'SAR'> label={t('settings.currency')} value={s.currency} onChange={(v) => s.update({ currency: v })}
          options={[{ value: 'EUR', label: 'EUR €', testID: 'cur-eur' }, { value: 'SAR', label: 'SAR ر.س', testID: 'cur-sar' }]} />
        <Txt variant="caption" color="muted">{t('settings.currencyNote', { rate: num(SAR_PER_EUR, 2) })}</Txt>
      </Section>
      <Section title={t('settings.data')}>
        <Card>
          <KeyValue label={t('settings.storage')} value={storeKind === 'sqlite' ? 'SQLite (expo-sqlite)' : 'IndexedDB'} />
          <Switch label={t('saves.autosave')} value={s.autosave} onChange={(v) => s.update({ autosave: v })} testID="switch-autosave-2" />
          <View style={{ gap: spacing.sm }}>
            <Button label={t('settings.manageSaves')} variant="secondary" onPress={() => router.push('/saves')} testID="btn-manage-saves" />
            <Button label={t('settings.validate')} onPress={check} disabled={!hasWorld} loading={checking} testID="btn-validate" />
          </View>
          {!hasWorld ? <Txt variant="caption" color="muted">{t('settings.validateNeedsCareer')}</Txt> : null}
          {validation ? (
            <Banner testID="validate-result" tone={validation.violations.length === 0 ? 'success' : 'error'}
              text={validation.violations.length === 0 ? t('settings.validateOk') : t('settings.validateBad', { n: validation.violations.length })}
              detail={validation.violations.slice(0, 8).map((v) => `[${v.severity}] ${v.code}: ${v.message}`).join('\n') || undefined} />
          ) : null}
        </Card>
      </Section>
      <Button label={t('nav.about')} variant="ghost" onPress={() => router.push('/about')} />
    </Screen>
  );
}
