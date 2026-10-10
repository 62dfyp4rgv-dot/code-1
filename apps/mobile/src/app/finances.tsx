import type { ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { financeView, squadView } from '@fu/engine';
import { useHumanClubId, useWorldQuery } from '../state/queries';
import { useI18n } from '../i18n/useI18n';
import { useTheme } from '../theme/ThemeProvider';
import { Screen, Card, Section, KeyValue, ProgressBar, Banner, Row, RowGroup, Spinner, Empty } from '../ui/Layout';
import { Txt } from '../ui/Txt';
import { hrefs } from '../features/common';
import { engineDateKey } from '../core/format';

export default function Finances(): ReactNode {
  const { t, td, money, wage, dig, pct, engineDate } = useI18n();
  const th = useTheme();
  const router = useRouter();
  const id = useHumanClubId();
  const data = useWorldQuery('fin', [id], (w) => (id ? { fin: financeView(w, id), squad: squadView(w, id) } : null));
  if (!data || !data.fin) return <Screen back title={t('nav.finances')}><Spinner /></Screen>;
  const f = data.fin;
  const wageUse = f.wageBudgetWeekly > 0 ? f.wageBillWeekly / f.wageBudgetWeekly : 0;
  const contracts = [...data.squad].filter((p) => p.contractEnd).sort((a, b) => engineDateKey(a.contractEnd).localeCompare(engineDateKey(b.contractEnd))).slice(0, 12);
  const ledger = (rec: Record<string, number>): ReactNode => {
    const entries = Object.entries(rec).sort((a, b) => b[1] - a[1]);
    return entries.length ? entries.map(([k, v]) => <KeyValue key={k} label={td('ledger.' + k, k)} value={money(v)} />) : <Txt variant="small" color="muted">{t('finance.noEntries')}</Txt>;
  };
  return (
    <Screen back title={t('nav.finances')} testID="screen-finances">
      {f.embargoed ? <Banner tone="error" text={t('finance.embargo')} /> : null}
      {f.overLimit ? <Banner tone="warn" text={t('finance.overLimit')} /> : null}
      <Card testID="fin-balance">
        <KeyValue label={t('finance.cash')} value={money(f.cash, { compact: false })} valueColor={f.cash < 0 ? th.colors.danger : undefined} testID="fin-cash" />
        <KeyValue label={t('finance.debt')} value={money(f.debt)} />
        <KeyValue label={t('finance.transferBudget')} value={money(f.transferBudget)} />
        <KeyValue label={t('finance.netSeason')} value={money(f.netThisSeason, { signed: true })} valueColor={f.netThisSeason < 0 ? th.colors.danger : th.colors.success} />
      </Card>
      <Section title={t('finance.wages')}>
        <Card>
          <KeyValue label={t('finance.wageBill')} value={wage(f.wageBillWeekly)} />
          <KeyValue label={t('finance.wageBudget')} value={wage(f.wageBudgetWeekly)} />
          <ProgressBar value={wageUse} color={wageUse > 1 ? th.colors.danger : th.colors.primary} label={t('finance.wageBill')} />
          {f.squadCostRatio !== null ? <KeyValue label={t('finance.squadCost')} value={`${pct(f.squadCostRatio)}${f.ratioLimit ? ` / ${pct(f.ratioLimit)}` : ''}`} valueColor={f.overLimit ? th.colors.danger : undefined} /> : null}
        </Card>
      </Section>
      <Section title={t('finance.income')}><Card>{ledger(f.income)}</Card></Section>
      <Section title={t('finance.expenses')}><Card>{ledger(f.expenses)}</Card></Section>
      <Section title={t('finance.installments')}>
        <Card padded={false}>
          {f.upcomingInstallments.length === 0 ? <Empty text={t('finance.noInstallments')} /> : f.upcomingInstallments.map((i, k) => (
            <Row key={k} title={i.memo} subtitle={t('finance.dueIn', { n: dig(i.dueIn) })} right={<Txt variant="bodyStrong" num color={i.amount < 0 ? 'danger' : 'success'}>{money(i.amount, { signed: true })}</Txt>} divider={k < f.upcomingInstallments.length - 1} />
          ))}
        </Card>
      </Section>
      <Section title={t('finance.contracts')}>
        <RowGroup testID="contracts-list">
          {contracts.map((p) => <Row key={p.id} title={p.name} subtitle={`${t('player.contractUntil')} ${engineDate(p.contractEnd)}`} right={<Txt variant="small" num>{p.wageWeekly !== null ? wage(p.wageWeekly) : ''}</Txt>} chevron onPress={() => router.push(hrefs.player(p.id))} />)}
        </RowGroup>
        <Txt variant="caption" color="muted">{t('finance.contractsHint')}</Txt>
      </Section>
    </Screen>
  );
}
