import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { clubFixtures, dateInfo, fixturesOnDayView } from '@fu/engine';
import { useHumanClubId, useWorldQuery } from '../../state/queries';
import { getWorld } from '../../state/worldHost';
import { useI18n } from '../../i18n/useI18n';
import { Screen, RowGroup, Section, Empty, Spinner, Row } from '../../ui/Layout';
import { Button, Segmented } from '../../ui/Controls';
import { Txt } from '../../ui/Txt';
import { FixtureRow } from '../../features/common';
import { spacing } from '../../theme/tokens';

type Mode = 'upcoming' | 'results' | 'day';

export default function Fixtures(): ReactNode {
  const { t, date, dig } = useI18n();
  const id = useHumanClubId();
  const [mode, setMode] = useState<Mode>('upcoming');
  const [day, setDay] = useState<number | null>(null);
  const [all, setAll] = useState(false);
  const today = getWorld()?.day ?? 0;
  const shownDay = day ?? today;
  const mine = useWorldQuery('fixtures', [id, mode], (w) => {
    if (!id || mode === 'day') return [];
    return mode === 'upcoming' ? clubFixtures(w, id, { upcoming: true, limit: 60 }) : clubFixtures(w, id, { upcoming: false, limit: 60 }).reverse();
  });
  const onDay = useWorldQuery('fixtures-day', [shownDay, mode === 'day'], (w) => (mode === 'day' ? fixturesOnDayView(w, shownDay) : []));
  if (!mine || !onDay) return <Screen tabs><Spinner /></Screen>;
  const grouped = new Map<string, typeof onDay>();
  for (const f of onDay) grouped.set(f.competition, [...(grouped.get(f.competition) ?? []), f]);
  const groups = [...grouped.entries()].sort((a, b) => b[1].length - a[1].length);
  const info = dateInfo(shownDay);
  return (
    <Screen testID="screen-fixtures" title={t('tab.fixtures')} tabs>
      <Segmented<Mode>
        label={t('tab.fixtures')} value={mode} onChange={setMode}
        options={[
          { value: 'upcoming', label: t('fixtures.upcoming'), testID: 'fx-upcoming' },
          { value: 'results', label: t('fixtures.results'), testID: 'fx-results' },
          { value: 'day', label: t('fixtures.byDay'), testID: 'fx-day' },
        ]}
      />
      {mode !== 'day' ? (
        <RowGroup testID="fixtures-list">
          {mine.length === 0 ? <Empty text={t('fixtures.none')} icon="calendar" /> : mine.map((f) => <FixtureRow key={f.id} f={f} humanId={id} testID={`fx-${f.id}`} />)}
        </RowGroup>
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Button label="−7" variant="secondary" small onPress={() => setDay(shownDay - 7)} testID="day-minus-7" />
            <Button label="−1" variant="secondary" small onPress={() => setDay(shownDay - 1)} testID="day-minus-1" />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong" align="center" testID="day-label">{date(info.iso)}</Txt>
              <Txt variant="caption" color="muted" align="center">{shownDay === today ? t('fixtures.today') : t('fixtures.dayOffset', { n: dig(shownDay - today) })}</Txt>
            </View>
            <Button label="+1" variant="secondary" small onPress={() => setDay(shownDay + 1)} testID="day-plus-1" />
            <Button label="+7" variant="secondary" small onPress={() => setDay(shownDay + 7)} testID="day-plus-7" />
          </View>
          <Txt variant="caption" color="muted" testID="day-count">{t('fixtures.dayCount', { n: dig(onDay.length), c: dig(groups.length) })}</Txt>
          {groups.length === 0 ? <Empty text={t('fixtures.none')} icon="calendar" /> : null}
          {groups.map(([comp, list]) => (
            <Section key={comp} title={`${comp} (${dig(list.length)})`}>
              <RowGroup>{(all ? list : list.slice(0, 12)).map((f) => <FixtureRow key={f.id} f={f} humanId={id} />)}</RowGroup>
              {!all && list.length > 12 ? <Row divider={false} title={t('common.showMore', { n: dig(list.length - 12) })} onPress={() => setAll(true)} /> : null}
            </Section>
          ))}
        </>
      )}
    </Screen>
  );
}
