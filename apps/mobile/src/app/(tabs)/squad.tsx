import { useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { squadView } from '@fu/engine';
import { useHumanClubId, useWorldQuery } from '../../state/queries';
import { useI18n } from '../../i18n/useI18n';
import { Screen, RowGroup, Empty, Spinner } from '../../ui/Layout';
import { Button, Chip, Field, ScrollChips } from '../../ui/Controls';
import { Txt } from '../../ui/Txt';
import { filterSquad, sortSquad, type PosFilter, type SortKey } from '../../features/squadUtils';
import { hrefs } from '../../features/common';
import { PlayerListRow } from '../../features/PlayerListRow';

export default function Squad(): ReactNode {
  const { t, dig, td } = useI18n();
  const router = useRouter();
  const id = useHumanClubId();
  const rows = useWorldQuery('squad', [id], (w) => (id ? squadView(w, id) : []));
  const [sort, setSort] = useState<SortKey>('position');
  const [filter, setFilter] = useState<PosFilter>('all');
  const [query, setQuery] = useState('');
  const shown = useMemo(() => sortSquad(filterSquad(rows ?? [], filter, query), sort), [rows, sort, filter, query]);
  if (!rows) return <Screen tabs><Spinner /></Screen>;
  const filters: PosFilter[] = ['all', 'GK', 'DEF', 'MID', 'FWD', 'unavailable'];
  const sorts: SortKey[] = ['position', 'ability', 'age', 'value', 'form', 'condition', 'goals'];
  return (
    <Screen testID="screen-squad" title={t('tab.squad')} subtitle={t('squad.count', { n: dig(rows.length) })} tabs
      right={<View style={{ flexDirection: 'row', gap: 8 }}>
        <Button label={t('nav.tactics')} variant="secondary" onPress={() => router.push('/tactics')} testID="btn-tactics" />
        <Button label={t('nav.lineup')} variant="secondary" onPress={() => router.push('/lineup')} testID="btn-lineup" />
      </View>}>
      <Field search label={t('squad.search')} value={query} onChangeText={setQuery} testID="squad-search" />
      <ScrollChips label={t('squad.filter')}>
        {filters.map((f) => <Chip key={f} label={t(`squad.f.${f}` as 'squad.f.all')} selected={filter === f} onPress={() => setFilter(f)} testID={`squad-filter-${f}`} />)}
      </ScrollChips>
      <ScrollChips label={t('squad.sort')}>
        <View style={{ justifyContent: 'center' }}><Txt variant="caption" color="muted" style={{ fontWeight: '700' }}>{t('squad.sort')}</Txt></View>
        {sorts.map((s) => <Chip key={s} label={t(`squad.s.${s}` as 'squad.s.age')} selected={sort === s} onPress={() => setSort(s)} testID={`squad-sort-${s}`} />)}
      </ScrollChips>
      <RowGroup testID="squad-list">
        {shown.length === 0 ? <Empty text={t('common.noResults')} /> : shown.map((r) => <PlayerListRow key={r.id} r={r} onPress={() => router.push(hrefs.player(r.id))} />)}
      </RowGroup>
      <Txt variant="caption" color="muted">{td('squad.legend', '')}</Txt>
    </Screen>
  );
}
