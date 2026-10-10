import type { ReactNode } from 'react';
import { COMPETITIONS, LEAGUE_PROFILES } from '@fu/engine';
import { useI18n } from '../i18n/useI18n';
import { Screen, Card, Section, KeyValue } from '../ui/Layout';
import { Txt } from '../ui/Txt';
import { SAR_PER_EUR } from '../core/format';
import type { TKey } from '../i18n/translate';

const LIMITS: TKey[] = ['about.l1', 'about.l2', 'about.l3', 'about.l4', 'about.l5', 'about.l6', 'about.l7'];

export default function About(): ReactNode {
  const { t, dig, num } = useI18n();
  return (
    <Screen back title={t('nav.about')} testID="screen-about">
      <Card>
        <Txt variant="h2">Football Universe</Txt>
        <Txt variant="small" color="muted">v0.1.0</Txt>
        <Txt variant="body">{t('about.intro')}</Txt>
        <KeyValue label={t('about.competitions')} value={dig(Object.keys(COMPETITIONS).length)} />
        <KeyValue label={t('about.leagues')} value={dig(LEAGUE_PROFILES.length)} />
        <KeyValue label={t('settings.currency')} value={`1 EUR ≈ ${num(SAR_PER_EUR, 2)} SAR`} />
      </Card>
      <Section title={t('about.limits')}>
        <Card testID="about-limits">
          {LIMITS.map((k) => <Txt key={k} variant="small">• {t(k)}</Txt>)}
        </Card>
      </Section>
    </Screen>
  );
}
