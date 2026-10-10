import { useCallback, useState, type ReactNode } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import type { FixtureView, TableRowView } from '@fu/engine';
import { useI18n } from '../i18n/useI18n';
import { useTheme } from '../theme/ThemeProvider';
import { readableOn, spacing } from '../theme/tokens';
import { Txt } from '../ui/Txt';
import { Row, Card, Banner, Empty } from '../ui/Layout';
import { Button } from '../ui/Controls';
import { Sheet } from '../ui/Sheet';
import { Crest, FormDots } from '../ui/ClubVisuals';
import { haptic } from '../platform/haptics';
import type { SimPlan } from '../core/simRunner';
import { formEntries } from './homeStats';
import { DataTable, type Column } from '../ui/Table';
import { runSim, useGame } from '../state/gameStore';

export const hrefs = {
  club: (id: string) => `/club/${id}`,
  player: (id: string) => `/player/${id}`,
  match: (id: string, reveal = false) => `/match/${encodeURIComponent(id)}${reveal ? '?reveal=1' : ''}`,
  competition: (id: string) => `/competition/${id}`,
} as const;

/** Display name for a competition: engine short names stay as generated, kind labels are localised elsewhere. */
export function FixtureRow({ f, humanId, testID }: { f: FixtureView; humanId?: string | null; testID?: string }): ReactNode {
  const { t, engineDate } = useI18n();
  const th = useTheme();
  const router = useRouter();
  const played = f.status === 'played';
  const home = humanId && f.home.id === humanId;
  const label = played ? `${f.home.name} ${f.score ?? ''} ${f.away.name}` : `${f.home.name} – ${f.away.name}`;
  const res = played && humanId ? formEntries([f], humanId)[0] : undefined;
  const resColor = res ? (res.result === 'W' ? th.colors.win : res.result === 'D' ? th.colors.draw : th.colors.loss) : undefined;
  return (
    <Row
      right={res && resColor ? (
        <View accessible accessibilityLabel={t(`form.${res.result}` as 'form.W')} style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: resColor, alignItems: 'center', justifyContent: 'center' }}>
          <Txt variant="label" color={readableOn(resColor)} allowFontScaling={false} style={{ fontSize: 12, lineHeight: 15, fontWeight: '800' }}>{t(`form.letter.${res.result}` as 'form.letter.W')}</Txt>
        </View>
      ) : undefined}
      testID={testID}
      accessibilityLabel={`${label}, ${engineDate(f.date)}, ${f.competition}`}
      title={`${f.home.name}  ${played ? (f.score ?? '') : t('fixtures.vs')}  ${f.away.name}`}
      subtitle={`${engineDate(f.date)} · ${f.competition} · ${f.stage}${f.pens ? ` · ${f.pens}` : ''}${f.neutral ? ` · ${t('fixtures.neutral')}` : ''}${humanId ? ` · ${home ? t('fixtures.home') : t('fixtures.away')}` : ''}`}
      left={<Crest clubId={humanId && f.home.id === humanId ? f.away.id : f.home.id} name={humanId && f.home.id === humanId ? f.away.name : f.home.name} size={32} />}
      onPress={played ? () => router.push(hrefs.match(f.id)) : undefined}
      chevron={played}
    />
  );
}

export function LeagueTable({ rows, onClub, testID, compact }: { rows: TableRowView[]; onClub?: (id: string) => void; testID?: string; compact?: boolean }): ReactNode {
  const { t, dig } = useI18n();
  const th = useTheme();
  const { width } = useWindowDimensions();
  const cols: Column<TableRowView>[] = [
    { key: 'pos', title: '#', width: 26, align: 'center', render: (r) => <Txt variant="small" num align="center" style={{ fontWeight: '700' }}>{dig(r.position)}</Txt> },
    {
      key: 'club', title: t('table.club'),
      render: (r) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Crest clubId={r.clubId} name={r.clubName} size={22} />
          <Txt variant="small" numberOfLines={1} style={{ flexShrink: 1, fontWeight: r.isHuman ? '800' : '500' }}>{width < 380 ? r.shortName : r.clubName}</Txt>
        </View>
      ),
    },
    { key: 'p', title: t('table.p'), width: 26, align: 'center', accessibilityLabel: t('table.played'), render: (r) => <Txt variant="small" num align="center">{dig(r.played)}</Txt> },
    { key: 'w', title: t('table.w'), width: 24, align: 'center', minWidth: 360, render: (r) => <Txt variant="small" num align="center">{dig(r.won)}</Txt> },
    { key: 'd', title: t('table.d'), width: 24, align: 'center', minWidth: 360, render: (r) => <Txt variant="small" num align="center">{dig(r.drawn)}</Txt> },
    { key: 'l', title: t('table.l'), width: 24, align: 'center', minWidth: 360, render: (r) => <Txt variant="small" num align="center">{dig(r.lost)}</Txt> },
    { key: 'gd', title: t('table.gd'), width: 32, align: 'center', accessibilityLabel: t('table.goalDiff'), render: (r) => <Txt variant="small" num align="center">{r.goalDifference > 0 ? '+' : ''}{dig(r.goalDifference)}</Txt> },
    { key: 'pts', title: t('table.pts'), width: 32, align: 'center', accessibilityLabel: t('table.points'), render: (r) => <Txt variant="small" num align="center" style={{ fontWeight: '800' }}>{dig(r.points)}</Txt> },
    ...(compact ? [] : [{ key: 'form', title: t('table.form'), width: 82, align: 'center' as const, minWidth: 440, render: (r: TableRowView) => <FormDots form={r.form} /> }]),
  ];
  return (
    <DataTable
      testID={testID} columns={cols} rows={rows} rowKey={(r) => r.clubId} windowWidth={width}
      rowHighlight={(r) => r.isHuman} rowAccent={(r) => (r.position === 1 && r.played > 0 ? th.colors.zoneChampion : undefined)}
      onRowPress={onClub ? (r) => onClub(r.clubId) : undefined}
      rowLabel={(r) => `${r.position}. ${r.clubName}, ${t('table.points')} ${r.points}, ${t('table.played')} ${r.played}`}
    />
  );
}

export function NewsList({ items }: { items: { day: string; kind: string; text: string; ref: string | null }[] }): ReactNode {
  const { t, engineDate, td } = useI18n();
  if (items.length === 0) return <Empty text={t('news.none')} icon="news" />;
  return (
    <View>
      {items.map((n, i) => (
        <Row key={i} title={n.text} subtitle={`${engineDate(n.day)} · ${td(`news.kind.${n.kind}`, n.kind)}`} divider={i < items.length - 1} />
      ))}
    </View>
  );
}

/**
 * Runs a simulation plan. When it stops because the human club played (next match / single day), opens the animated match
 * report for that fixture, so "Play" always ends on the result instead of silently on Home.
 */
export function usePlay(): (plan: SimPlan) => Promise<void> {
  const router = useRouter();
  return useCallback(async (plan: SimPlan) => {
    const s = await runSim(plan);
    if (!s) return;
    if (s.error) { haptic('error'); return; }
    haptic(s.cancelled ? 'warning' : 'success');
    const single = plan.kind === 'nextMatchday' || (plan.kind === 'days' && plan.days === 1);
    if (single && !s.cancelled && s.humanFixtureId) {
      await new Promise((r) => setTimeout(r, 120)); // let the progress dialog finish dismissing before pushing a screen
      router.push(hrefs.match(s.humanFixtureId, true) as never);
    }
  }, [router]);
}

export function SimSummaryBanner(): ReactNode {
  const { t, dig } = useI18n();
  const last = useGame((s) => s.lastSim);
  if (!last) return null;
  return (
    <Banner
      testID="sim-summary" tone={last.error ? 'error' : last.cancelled ? 'warn' : 'success'}
      text={last.error ? t('sim.failed') : last.cancelled ? t('sim.cancelled', { days: dig(last.daysDone) }) : t('sim.done', { days: dig(last.daysDone), matches: dig(last.matchesPlayed) })}
      detail={last.seasonEnded ? t('sim.seasonEnded') : last.humanMatches > 0 ? t('sim.humanPlayed', { n: dig(last.humanMatches) }) : undefined}
    />
  );
}

/** Advance-time buttons shared by Home (`compact`: the primary "Play" button lives in the hero card) and the Calendar screen. */
export function SimControls({ showSeason = true, compact = false }: { showSeason?: boolean; compact?: boolean }): ReactNode {
  const { t } = useI18n();
  const sim = useGame((s) => s.sim);
  const play = usePlay();
  const [confirm, setConfirm] = useState(false);
  const busy = !!sim;
  const confirmSheet = (
    <Sheet visible={confirm} title={t('sim.confirmEnd.title')} onClose={() => setConfirm(false)} testID="sheet-confirm-end"
      footer={<><Button label={t('sim.confirmEnd.go')} onPress={() => { setConfirm(false); void play({ kind: 'endOfSeason' }); }} testID="btn-confirm-endseason" /><Button label={t('common.cancel')} variant="secondary" onPress={() => setConfirm(false)} /></>}>
      <Txt variant="body">{t('sim.confirmEnd.body')}</Txt>
    </Sheet>
  );
  if (compact) {
    return (
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button fit label={t('sim.oneDay')} variant="secondary" onPress={() => void play({ kind: 'days', days: 1 })} disabled={busy} style={{ flex: 1 }} testID="sim-one-day" />
        <Button fit label={t('sim.oneWeek')} variant="secondary" onPress={() => void play({ kind: 'days', days: 7 })} disabled={busy} style={{ flex: 1 }} testID="sim-one-week" />
        {showSeason ? <Button fit label={t('sim.endSeasonShort')} variant="secondary" onPress={() => setConfirm(true)} disabled={busy} style={{ flex: 1.3 }} testID="sim-end-season" /> : null}
        {confirmSheet}
      </View>
    );
  }
  return (
    <View style={{ gap: spacing.sm }}>
      <Button label={t('sim.nextMatchday')} icon="play" onPress={() => void play({ kind: 'nextMatchday' })} disabled={busy} testID="sim-next-matchday" />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button label={t('sim.oneDay')} variant="secondary" onPress={() => void play({ kind: 'days', days: 1 })} disabled={busy} style={{ flex: 1 }} testID="sim-one-day" />
        <Button label={t('sim.oneWeek')} variant="secondary" onPress={() => void play({ kind: 'days', days: 7 })} disabled={busy} style={{ flex: 1 }} testID="sim-one-week" />
      </View>
      {showSeason ? <Button label={t('sim.endSeason')} variant="secondary" onPress={() => setConfirm(true)} disabled={busy} testID="sim-end-season" /> : null}
      {confirmSheet}
      <SimSummaryBanner />
    </View>
  );
}

export function SectionCard({ children, title, right }: { children: ReactNode; title?: string; right?: ReactNode }): ReactNode {
  return (
    <Card>
      {title || right ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
          {title ? <Txt variant="title" style={{ flex: 1 }} accessibilityRole="header">{title}</Txt> : null}
          {right}
        </View>
      ) : null}
      {children}
    </Card>
  );
}
