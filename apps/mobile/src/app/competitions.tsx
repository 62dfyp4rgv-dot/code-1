import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { competitionList } from '@fu/engine';
import { useWorldQuery } from '../state/queries';
import { useI18n } from '../i18n/useI18n';
import { Screen, RowGroup, Row, Section, Banner, Spinner, Empty } from '../ui/Layout';
import { Chip, ChipRow, Field } from '../ui/Controls';
import { Icon } from '../ui/Icon';
import { hrefs } from '../features/common';

type Kind = 'all' | 'league' | 'cup' | 'continental';

export default function Competitions(): ReactNode {
  const { t, td, dig } = useI18n();
  const router = useRouter();
  const list = useWorldQuery('complist', [], (w) => competitionList(w));
  const [kind, setKind] = useState<Kind>('all');
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    if (!list) return [];
    const ql = q.trim().toLowerCase();
    const match = (c: (typeof list)[number]): boolean => {
      if (kind === 'league' && c.kind !== 'league') return false;
      if (kind === 'cup' && c.kind !== 'cup' && c.kind !== 'superCup') return false;
      if (kind === 'continental' && c.kind !== 'continental' && c.kind !== 'intercontinental') return false;
      return !ql || c.name.toLowerCase().includes(ql) || (c.country ?? '').toLowerCase().includes(ql);
    };
    const filtered = list.filter(match);
    const order = ['league', 'cup', 'superCup', 'continental', 'intercontinental'];
    return order.map((k) => ({ kind: k, items: filtered.filter((c) => c.kind === k) })).filter((g) => g.items.length > 0);
  }, [list, kind, q]);
  if (!list) return <Screen back title={t('nav.competitions')}><Spinner /></Screen>;
  return (
    <Screen back title={t('nav.competitions')} subtitle={t('comp.count', { n: dig(list.length) })} testID="screen-competitions">
      <Banner tone="warn" text={t('verify.banner')} testID="verify-banner" />
      <Field search label={t('comp.search')} value={q} onChangeText={setQ} testID="comp-search" />
      <ChipRow>
        {(['all', 'league', 'cup', 'continental'] as Kind[]).map((k) => <Chip key={k} label={t(`comp.k.${k}` as 'comp.k.all')} selected={kind === k} onPress={() => setKind(k)} testID={`ck-${k}`} />)}
      </ChipRow>
      {groups.length === 0 ? <Empty text={t('common.noResults')} /> : null}
      {groups.map((g) => (
        <Section key={g.kind} title={`${td('kind.' + g.kind, g.kind)} (${dig(g.items.length)})`}>
          <RowGroup>
            {g.items.map((c) => (
              <Row key={c.id} testID={`comp-${c.id}`} title={c.name} subtitle={`${c.country ?? c.confederation ?? ''} · ${td('status.' + c.status, c.status)}`} left={<Icon name="trophy" size={20} />} chevron onPress={() => router.push(hrefs.competition(c.id))} />
            ))}
          </RowGroup>
        </Section>
      ))}
    </Screen>
  );
}
