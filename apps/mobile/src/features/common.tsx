import type { ReactNode } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import type { FixtureView, TableRowView } from '@fu/engine';
import { useI18n } from '../i18n/useI18n';
import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../theme/tokens';
import { Txt } from '../ui/Txt';
import { Row, Card, Banner, Empty } from '../ui/Layout';
import { Button } from '../ui/Controls';
import { Crest, FormDots } from '../ui/ClubVisuals';
import { DataTable, type Column } from '../ui/Table';
import { runSim, useGame } from '../state/gameStore';

export const hrefs = {
  club: (id: string) => `/club/${id}`,
  player: (id: string) => `/player/${id}`,
  match: (id: string) => `/match/${encodeURIComponent(id)}`,
  competition: (id: string) => `/competition/${id}`,
} as const;

/** Display name for a competition: engine short names stay as generated, kind labels are localised elsewhere. */
export function FixtureRow({ f, humanId, testID }: { f: FixtureView; humanId?: string | null; testID?: string }): ReactNode {
  const { t, engineDate } = useI18n();
  const router = useRouter();
  const played = f.status === 'played';
  const home = humanId && f.home.id === humanId;
  const label = played ? `${f.home.name} ${f.score ?? ''} ${f.away.name}` : `${f.home.name} – ${f.away.name}`;
  return (
    <Row
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

/** Advance-time buttons shared by Home and the Calendar screen. */
export function SimControls({ showSeason = true }: { showSeason?: boolean }): ReactNode {
  const { t, dig } = useI18n();
  const sim = useGame((s) => s.sim);
  const last = useGame((s) => s.lastSim);
  const busy = !!sim;
  return (
    <View style={{ gap: spacing.sm }}>
      <Button label={t('sim.nextMatchday')} icon="play" onPress={() => void runSim({ kind: 'nextMatchday' })} disabled={busy} testID="sim-next-matchday" />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Button label={t('sim.oneDay')} variant="secondary" onPress={() => void runSim({ kind: 'days', days: 1 })} disabled={busy} style={{ flex: 1 }} testID="sim-one-day" />
        <Button label={t('sim.oneWeek')} variant="secondary" onPress={() => void runSim({ kind: 'days', days: 7 })} disabled={busy} style={{ flex: 1 }} testID="sim-one-week" />
      </View>
      {showSeason ? <Button label={t('sim.endSeason')} variant="secondary" onPress={() => void runSim({ kind: 'endOfSeason' })} disabled={busy} testID="sim-end-season" /> : null}
      {last ? (
        <Banner
          testID="sim-summary" tone={last.error ? 'error' : last.cancelled ? 'warn' : 'success'}
          text={last.error ? t('sim.failed') : last.cancelled ? t('sim.cancelled', { days: dig(last.daysDone) }) : t('sim.done', { days: dig(last.daysDone), matches: dig(last.matchesPlayed) })}
          detail={last.seasonEnded ? t('sim.seasonEnded') : last.humanMatches > 0 ? t('sim.humanPlayed', { n: dig(last.humanMatches) }) : undefined}
        />
      ) : null}
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
