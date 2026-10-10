import { useState, type ReactNode } from 'react';
import { clubFixtures, dateInfo, isWindowOpen, windowDaysLeft } from '@fu/engine';
import { useHumanClubId, useWorldQuery } from '../state/queries';

import { useI18n } from '../i18n/useI18n';
import { Screen, Card, Section, KeyValue, ProgressBar, RowGroup, Empty, Spinner } from '../ui/Layout';
import { Button, Stepper } from '../ui/Controls';
import { Txt } from '../ui/Txt';
import { FixtureRow, SimControls, usePlay } from '../features/common';

export default function Calendar(): ReactNode {
  const { t, date, dig } = useI18n();
  const id = useHumanClubId();
  const [days, setDays] = useState(14);
  const play = usePlay();
  const data = useWorldQuery('calendar', [id], (w) => {
    if (!id) return null;
    const c = w.clubs[id]!;
    return { info: dateInfo(w.day), open: isWindowOpen(w, c), left: windowDaysLeft(w, c), next: clubFixtures(w, id, { upcoming: true, limit: 8 }) };
  });
  if (!data) return <Screen back title={t('nav.calendar')}><Spinner /></Screen>;
  const { info } = data;
  return (
    <Screen back title={t('nav.calendar')} testID="screen-calendar">
      <Card>
        <Txt variant="h2" testID="cal-date">{date(info.iso)}</Txt>
        <KeyValue label={t('home.season')} value={dig(info.seasonLabel)} />
        <KeyValue label={t('calendar.dayOfSeason')} value={`${dig(info.dayOfSeason + 1)} / 364`} />
        <ProgressBar value={info.dayOfSeason / 364} label={t('calendar.dayOfSeason')} />
        <KeyValue label={t('market.window')} value={data.open ? t('market.windowOpen', { n: dig(data.left) }) : t('market.windowClosed')} />
        <Txt variant="caption" color="muted">{t('calendar.driftNote')}</Txt>
      </Card>
      <Section title={t('calendar.advance')}>
        <SimControls />
        <Card>
          <Stepper label={t('calendar.customDays')} value={days} min={1} max={90} step={1} onChange={setDays} format={dig} testID="stepper-days" />
          <Button label={t('calendar.advanceN', { n: dig(days) })} variant="secondary" onPress={() => void play({ kind: 'days', days })} testID="sim-custom" />
        </Card>
        <Txt variant="caption" color="muted">{t('sim.hint')}</Txt>
      </Section>
      <Section title={t('home.nextMatches')}>
        <RowGroup>{data.next.length ? data.next.map((f) => <FixtureRow key={f.id} f={f} humanId={id} />) : <Empty text={t('home.noFixtures')} icon="calendar" />}</RowGroup>
      </Section>
    </Screen>
  );
}
