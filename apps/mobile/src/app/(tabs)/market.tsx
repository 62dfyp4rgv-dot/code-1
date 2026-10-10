import { useMemo, useState, type ReactNode } from 'react';
import { transferMarketView, financeView, isWindowOpen, windowDaysLeft, POSITIONS, type MarketFilter, type Position } from '@fu/engine';
import { useHumanClubId, useWorldQuery } from '../../state/queries';
import { useI18n } from '../../i18n/useI18n';
import { Screen, Card, RowGroup, Section, Empty, Spinner, KeyValue, Banner } from '../../ui/Layout';
import { Chip, ChipRow, Field, Segmented, Stepper } from '../../ui/Controls';
import { Txt } from '../../ui/Txt';
import { PlayerListRow } from '../../features/PlayerListRow';
import { useRouter } from 'expo-router';
import { hrefs } from '../../features/common';
import { SAR_PER_EUR } from '../../core/format';

type Mode = 'all' | 'listed' | 'free';
const VALUE_STEPS_M = [0, 1, 2, 5, 10, 20, 50, 100, 200];

export default function Market(): ReactNode {
  const { t, td, dig, money, wage, prefs } = useI18n();
  const router = useRouter();
  const id = useHumanClubId();
  const [mode, setMode] = useState<Mode>('all');
  const [pos, setPos] = useState<Position | null>(null);
  const [query, setQuery] = useState('');
  const [minAge, setMinAge] = useState(16);
  const [maxAge, setMaxAge] = useState(40);
  const [minAbility, setMinAbility] = useState(0);
  const [valueIdx, setValueIdx] = useState(0);
  const rate = prefs.currency === 'SAR' ? SAR_PER_EUR : 1;
  const maxValueEur = VALUE_STEPS_M[valueIdx] ? (VALUE_STEPS_M[valueIdx] as number) * 1e6 / rate : undefined;
  const filter = useMemo<MarketFilter>(() => ({
    position: pos ?? undefined, minAge, maxAge, minAbility: minAbility || undefined, maxValue: maxValueEur,
    listedOnly: mode === 'listed', freeAgentsOnly: mode === 'free', limit: query.trim() ? 800 : 40,
  }), [pos, minAge, maxAge, minAbility, maxValueEur, mode, query]);
  const info = useWorldQuery('market-info', [id], (w) => {
    if (!id) return null;
    const c = w.clubs[id]!;
    return { open: isWindowOpen(w, c), left: windowDaysLeft(w, c), fin: financeView(w, id) };
  });
  const rows = useWorldQuery('market', [filter], (w) => transferMarketView(w, filter));
  if (!info || !rows) return <Screen tabs><Spinner /></Screen>;
  const q = query.trim().toLowerCase();
  const shown = (q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows).slice(0, 40);
  return (
    <Screen testID="screen-market" title={t('tab.market')} tabs>
      <Card>
        <Txt variant="bodyStrong" color={info.open ? 'success' : 'warning'} testID="market-window">{info.open ? t('market.windowOpen', { n: dig(info.left) }) : t('market.windowClosed')}</Txt>
        {info.fin ? (
          <>
            <KeyValue label={t('finance.transferBudget')} value={money(info.fin.transferBudget)} />
            <KeyValue label={t('finance.wageRoom')} value={wage(Math.max(0, info.fin.wageBudgetWeekly - info.fin.wageBillWeekly))} />
          </>
        ) : null}
        {info.fin?.embargoed ? <Banner tone="error" text={t('finance.embargo')} /> : null}
      </Card>
      <Segmented<Mode> label={t('tab.market')} value={mode} onChange={setMode} options={[
        { value: 'all', label: t('market.all'), testID: 'mk-all' }, { value: 'listed', label: t('market.listed'), testID: 'mk-listed' }, { value: 'free', label: t('market.free'), testID: 'mk-free' },
      ]} />
      <Field label={t('market.searchName')} value={query} onChangeText={setQuery} testID="market-search" />
      <Section title={t('market.position')}>
        <ChipRow>
          <Chip label={t('squad.f.all')} selected={pos === null} onPress={() => setPos(null)} testID="mk-pos-all" />
          {POSITIONS.map((p) => <Chip key={p} label={td('pos.' + p, p)} selected={pos === p} onPress={() => setPos(p)} testID={`mk-pos-${p}`} />)}
        </ChipRow>
      </Section>
      <Card>
        <Stepper label={t('market.minAge')} value={minAge} min={16} max={maxAge} onChange={setMinAge} format={dig} testID="mk-minage" />
        <Stepper label={t('market.maxAge')} value={maxAge} min={minAge} max={42} onChange={setMaxAge} format={dig} testID="mk-maxage" />
        <Stepper label={t('market.minAbility')} value={minAbility} min={0} max={90} step={5} onChange={setMinAbility} format={dig} testID="mk-minability" />
        <Stepper label={t('market.maxValue')} value={valueIdx} min={0} max={VALUE_STEPS_M.length - 1} onChange={setValueIdx} format={(i) => (VALUE_STEPS_M[i] ? money((VALUE_STEPS_M[i] as number) * 1e6 / rate) : t('market.any'))} testID="mk-maxvalue" />
      </Card>
      <Txt variant="caption" color="muted" testID="market-count">{t('market.results', { n: dig(shown.length) })}</Txt>
      <RowGroup testID="market-list">
        {shown.length === 0 ? <Empty text={t('common.noResults')} /> : shown.map((r) => <PlayerListRow key={r.id} r={r} onPress={() => router.push(hrefs.player(r.id))} />)}
      </RowGroup>
      <Txt variant="caption" color="muted">{t('market.scoutNote')}</Txt>
    </Screen>
  );
}
