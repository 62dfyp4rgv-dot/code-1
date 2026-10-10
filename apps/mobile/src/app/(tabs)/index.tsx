import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { clubFixtures, clubView, dateInfo, financeView, isWindowOpen, leagueTableView, newsView, squadSummary, squadView, windowDaysLeft } from '@fu/engine';
import { useWorldQuery, useHumanClubId } from '../../state/queries';
import { useI18n } from '../../i18n/useI18n';
import { useTheme } from '../../theme/ThemeProvider';
import { Screen, Card, RowGroup, StatTile, Banner, Spinner, Section, Empty } from '../../ui/Layout';
import { Button } from '../../ui/Controls';
import { Txt } from '../../ui/Txt';
import { Crest } from '../../ui/ClubVisuals';
import { FixtureRow, LeagueTable, NewsList, SimControls, hrefs } from '../../features/common';
import { spacing } from '../../theme/tokens';
import { useGame } from '../../state/gameStore';

export default function Home(): ReactNode {
  const { t, date, dig, num, money, td } = useI18n();
  const th = useTheme();
  const router = useRouter();
  const id = useHumanClubId();
  const saveState = useGame((s) => s.saveState);
  const data = useWorldQuery('home', [id], (w) => {
    if (!id) return null;
    const c = w.clubs[id]!;
    const cv = clubView(w, id);
    const table = leagueTableView(w, c.leagueId);
    const me = table.findIndex((r) => r.clubId === id);
    // mini-table: top 3 + a window around the human club
    const from = Math.max(0, Math.min(me - 1, table.length - 5));
    const mini = table.length <= 6 ? table : [...table.slice(0, 2), ...table.slice(Math.max(2, from), Math.max(2, from) + 4)];
    const squad = squadView(w, id);
    return {
      cv, info: dateInfo(w.day), windowOpen: isWindowOpen(w, c), windowLeft: windowDaysLeft(w, c),
      next: clubFixtures(w, id, { upcoming: true, limit: 3 }), last: clubFixtures(w, id, { upcoming: false, limit: 3 }).reverse(),
      mini: mini.filter((r, i, a) => a.findIndex((x) => x.clubId === r.clubId) === i), sum: squadSummary(w, id), fin: financeView(w, id), news: newsView(w, { clubId: id, limit: 4 }),
      injured: squad.filter((p) => p.injury).length, suspended: squad.filter((p) => p.suspended).length, tableSize: table.length, me,
    };
  });
  if (!data || !data.cv) return <Screen tabs><Spinner /></Screen>;
  const { cv, info } = data;
  return (
    <Screen testID="screen-home" tabs>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Crest clubId={cv.id} name={cv.name} size={56} />
        <View style={{ flex: 1 }}>
          <Txt variant="h1" numberOfLines={2} testID="home-club-name" accessibilityRole="header">{cv.name}</Txt>
          <Txt variant="small" color="muted" numberOfLines={2}>{cv.league}{cv.position ? ` · ${t('home.position', { n: dig(cv.position) })}` : ''}</Txt>
        </View>
      </View>

      <Card testID="home-date-card">
        <View style={{ gap: spacing.sm }}>
          <View>
            <Txt variant="caption" color="muted">{t('home.today')}</Txt>
            <Txt variant="title" testID="home-date">{date(info.iso)}</Txt>
            <Txt variant="small" color="muted" testID="home-season">{t('home.season')} {dig(info.seasonLabel)} · {t('home.week', { n: dig(info.week + 1) })}</Txt>
          </View>
          <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: data.windowOpen ? th.colors.highlight : th.colors.surfaceAlt, borderWidth: 1, borderColor: data.windowOpen ? th.colors.success : th.colors.border }}>
            <Txt variant="caption" color={data.windowOpen ? 'success' : 'muted'} testID="home-window">
              {data.windowOpen ? t('market.windowOpen', { n: dig(data.windowLeft) }) : t('market.windowClosed')}
            </Txt>
          </View>
        </View>
        <SimControls />
        {saveState.status === 'error' ? <Banner tone="error" text={t('notice.saveFailed')} detail={saveState.message} /> : null}
      </Card>

      {data.injured + data.suspended > 0 ? (
        <Banner tone="warn" text={t('home.availability', { inj: dig(data.injured), sus: dig(data.suspended) })} action={<Button label={t('tab.squad')} small variant="ghost" onPress={() => router.push('/squad')} />} />
      ) : null}

      <Section title={t('home.nextMatches')}>
        <RowGroup>
          {data.next.length ? data.next.map((f) => <FixtureRow key={f.id} f={f} humanId={cv.id} />) : <Empty text={t('home.noFixtures')} icon="calendar" />}
        </RowGroup>
      </Section>

      <Section title={t('home.lastResults')}>
        <RowGroup>
          {data.last.length ? data.last.map((f) => <FixtureRow key={f.id} f={f} humanId={cv.id} testID={`result-${f.id}`} />) : <Empty text={t('home.noResults')} icon="ball" />}
        </RowGroup>
      </Section>

      <Section title={t('home.table')} right={<Button label={t('common.viewAll')} variant="ghost" small onPress={() => router.push(hrefs.competition(cv.leagueId))} testID="home-table-all" />}>
        <LeagueTable rows={data.mini} compact onClub={(c) => router.push(hrefs.club(c))} testID="home-mini-table" />
      </Section>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <StatTile label={t('home.squadRating')} value={num(data.sum.avgOverall, 1)} />
        <StatTile label={t('home.avgAge')} value={num(data.sum.avgAge, 1)} />
        <StatTile label={t('finance.cash')} value={data.fin ? money(data.fin.cash) : '–'} tone={data.fin && data.fin.cash < 0 ? th.colors.danger : undefined} />
        <StatTile label={t('finance.transferBudget')} value={data.fin ? money(data.fin.transferBudget) : '–'} />
      </View>

      <Section title={t('home.news')} right={<Button label={t('common.viewAll')} variant="ghost" small onPress={() => router.push('/records')} />}>
        <Card padded={false}><NewsList items={data.news} /></Card>
      </Section>
      <Txt variant="caption" color="muted">{td('philosophy.' + cv.philosophy, cv.philosophy)}</Txt>
    </Screen>
  );
}
