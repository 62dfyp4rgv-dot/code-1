import type { ReactNode } from 'react';
import { COMPETITIONS, LEAGUE_PROFILES } from '@fu/engine';
import { useI18n } from '../i18n/useI18n';
import { Screen, Card, Section, KeyValue } from '../ui/Layout';
import { Txt } from '../ui/Txt';
import { SAR_PER_EUR } from '../core/format';
import { getWorld } from '../state/worldHost';
import { useGame } from '../state/gameStore';
import type { TKey } from '../i18n/translate';

const LIMITS: TKey[] = ['about.l1', 'about.l2', 'about.l3', 'about.l4', 'about.l5', 'about.l6', 'about.l7', 'about.l8', 'about.l9', 'about.l10', 'about.l11', 'about.l12', 'about.l13'];

export default function About(): ReactNode {
  const { t, dig, num } = useI18n();
  useGame((s) => s.version); // re-read the loaded career's data pack when it changes
  const pack = getWorld()?.dataPack ?? null;
  return (
    <Screen back title={t('nav.about')} testID="screen-about">
      <Card>
        <Txt variant="h2">Football Universe</Txt>
        <Txt variant="small" color="muted">v0.1.0</Txt>
        <Txt variant="body">{t('about.intro')}</Txt>
        <KeyValue label={t('about.competitions')} value={dig(Object.keys(COMPETITIONS).length)} />
        <KeyValue label={t('about.leagues')} value={dig(LEAGUE_PROFILES.length)} />
        {pack ? <Txt variant="small" testID="about-pack">{t('pack.career', { name: pack.name })} · {t('pack.counts', { clubs: dig(pack.applied.clubs), players: dig(pack.applied.players), managers: dig(pack.applied.managers), crests: dig(pack.applied.crests) })}</Txt> : null}
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
