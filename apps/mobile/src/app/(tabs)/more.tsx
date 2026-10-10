import type { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../i18n/useI18n';
import { Screen, Row, RowGroup, Section, Banner } from '../../ui/Layout';
import { Icon, type IconName } from '../../ui/Icon';
import { closeCareer, saveNow, useGame } from '../../state/gameStore';
import { useHumanClubId } from '../../state/queries';
import { hrefs } from '../../features/common';
import type { TKey } from '../../i18n/translate';

interface Item { key: TKey; sub: TKey; icon: IconName; href: string; testID: string }

export default function More(): ReactNode {
  const { t, clock } = useI18n();
  const router = useRouter();
  const id = useHumanClubId();
  const saveState = useGame((s) => s.saveState);
  const group = (items: Item[]): ReactNode => (
    <RowGroup>
      {items.map((it) => <Row key={it.testID} testID={it.testID} title={t(it.key)} subtitle={t(it.sub)} left={<Icon name={it.icon} />} chevron onPress={() => router.push(it.href as never)} />)}
    </RowGroup>
  );
  return (
    <Screen testID="screen-more" title={t('tab.more')} tabs>
      <Section title={t('more.club')}>
        {group([
          { key: 'nav.club', sub: 'nav.club.sub', icon: 'shield', href: id ? hrefs.club(id) : '/', testID: 'nav-club' },
          { key: 'nav.tactics', sub: 'nav.tactics.sub', icon: 'board', href: '/tactics', testID: 'nav-tactics' },
          { key: 'nav.lineup', sub: 'nav.lineup.sub', icon: 'users', href: '/lineup', testID: 'nav-lineup' },
          { key: 'nav.finances', sub: 'nav.finances.sub', icon: 'coin', href: '/finances', testID: 'nav-finances' },
          { key: 'nav.manager', sub: 'nav.manager.sub', icon: 'user', href: '/manager', testID: 'nav-manager' },
        ])}
      </Section>
      <Section title={t('more.world')}>
        {group([
          { key: 'nav.calendar', sub: 'nav.calendar.sub', icon: 'calendar', href: '/calendar', testID: 'nav-calendar' },
          { key: 'nav.competitions', sub: 'nav.competitions.sub', icon: 'trophy', href: '/competitions', testID: 'nav-competitions' },
          { key: 'nav.continental', sub: 'nav.continental.sub', icon: 'globe', href: '/continental', testID: 'nav-continental' },
          { key: 'nav.records', sub: 'nav.records.sub', icon: 'chart', href: '/records', testID: 'nav-records' },
        ])}
      </Section>
      <Section title={t('more.app')}>
        {group([
          { key: 'nav.saves', sub: 'nav.saves.sub', icon: 'save', href: '/saves', testID: 'nav-saves' },
          { key: 'nav.settings', sub: 'nav.settings.sub', icon: 'sliders', href: '/settings', testID: 'nav-settings' },
          { key: 'nav.about', sub: 'nav.about.sub', icon: 'info', href: '/about', testID: 'nav-about' },
        ])}
      </Section>
      <RowGroup>
        <Row testID="btn-save-now" title={t('saves.saveNow')} left={<Icon name="save" />} onPress={() => void saveNow()} subtitle={saveState.status === 'saving' ? t('saves.saving') : saveState.status === 'saved' ? t('saves.savedAt', { time: clock(saveState.at) }) : undefined} />
        <Row testID="btn-main-menu" title={t('more.mainMenu')} left={<Icon name="home" />} divider={false} onPress={async () => { await saveNow(); closeCareer(); router.replace('/start'); }} />
      </RowGroup>
      {saveState.status === 'error' ? <Banner tone="error" text={t('notice.saveFailed')} detail={saveState.message} /> : null}
    </Screen>
  );
}
