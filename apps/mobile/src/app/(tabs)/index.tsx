import type { ReactNode } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { clubFixtures, clubView, dateInfo, financeView, isWindowOpen, leagueTableView, newsView, squadSummary, squadView, windowDaysLeft } from '@fu/engine';
import { useWorldQuery, useHumanClubId } from '../../state/queries';
import { useI18n } from '../../i18n/useI18n';
import { useTheme } from '../../theme/ThemeProvider';
import { Screen, Card, RowGroup, Row, StatTile, Banner, Spinner, Section, Empty } from '../../ui/Layout';
import { Button } from '../../ui/Controls';
import { Txt } from '../../ui/Txt';
import { Icon, type IconName } from '../../ui/Icon';
import { Crest, FormChips } from '../../ui/ClubVisuals';
import { RankSparkline } from '../../ui/Charts';
import { FadeIn } from '../../ui/Motion';
import { FixtureRow, LeagueTable, NewsList, SimControls, SimSummaryBanner, hrefs, usePlay } from '../../features/common';
import { formEntries, formPoints, positionHistory } from '../../features/homeStats';
import { spacing } from '../../theme/tokens';
import { useGame } from '../../state/gameStore';

export default function Home(): ReactNode {
  const { t, date, dig, num, money, td, engineDate } = useI18n();
  const th = useTheme();
  const router = useRouter();
  const play = usePlay();
  const narrow = useWindowDimensions().width < 360;
  const id = useHumanClubId();
  const saveState = useGame((s) => s.saveState);
  const busy = useGame((s) => !!s.sim);
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
    const played = clubFixtures(w, id, { upcoming: false, limit: 40 });
    const hist = positionHistory(w, c.leagueId, id);
    const pos = cv?.position ?? null;
    if (pos && hist.length) hist[hist.length - 1] = pos; // pin to the engine's real table position
    return {
      cv, info: dateInfo(w.day), today: w.day, windowOpen: isWindowOpen(w, c), windowLeft: windowDaysLeft(w, c),
      next: clubFixtures(w, id, { upcoming: true, limit: 3 }), last: played.slice(-3).reverse(), form: formEntries(played, id).slice(-5), hist,
      mini: mini.filter((r, i, a) => a.findIndex((x) => x.clubId === r.clubId) === i), sum: squadSummary(w, id), fin: financeView(w, id), news: newsView(w, { clubId: id, limit: 4 }),
      injured: squad.filter((p) => p.injury).length, suspended: squad.filter((p) => p.suspended).length, tableSize: table.length, me, firstRun: played.length === 0,
    };
  });
  if (!data || !data.cv) return <Screen tabs><Spinner /></Screen>;
  const { cv, info } = data;
  const nextFx = data.next[0];
  const opp = nextFx ? (nextFx.home.id === cv.id ? nextFx.away : nextFx.home) : null;
  const atHome = nextFx ? nextFx.home.id === cv.id : false;
  const until = nextFx ? Math.max(0, nextFx.day - data.today) : 0;
  const untilText = until === 0 ? t('home.today') : until === 1 ? t('home.tomorrow') : t('home.inDays', { n: dig(until) });
  const pos = cv.position;
  const prev = data.hist.length > 1 ? (data.hist[data.hist.length - 2] as number) : null;
  const delta = pos && prev ? prev - pos : 0;
  const formChips = data.form.map((f) => ({ id: f.id, result: f.result, letter: t(`form.letter.${f.result}` as 'form.letter.W'), label: `${t(`form.${f.result}` as 'form.W')} ${dig(f.gf)}-${dig(f.ga)}, ${f.opponent}` }));
  const pts = formPoints(data.form);
  const steps: { icon: IconName; title: string; sub: string; href: string; testID: string }[] = [
    { icon: 'users', title: t('welcome.squad'), sub: t('welcome.squad.sub'), href: '/squad', testID: 'welcome-squad' },
    { icon: 'board', title: t('welcome.tactics'), sub: t('welcome.tactics.sub'), href: '/tactics', testID: 'welcome-tactics' },
    ...(data.windowOpen ? [{ icon: 'swap' as IconName, title: t('welcome.market'), sub: t('welcome.market.sub'), href: '/market', testID: 'welcome-market' }] : []),
  ];
  return (
    <Screen testID="screen-home" tabs>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Crest clubId={cv.id} name={cv.name} size={56} />
        <View style={{ flex: 1 }}>
          <Txt variant="h1" numberOfLines={2} testID="home-club-name" accessibilityRole="header" adjustsFontSizeToFit minimumFontScale={0.8}>{cv.name}</Txt>
          <Txt variant="small" color="muted" numberOfLines={2}>{cv.league}{pos ? ` · ${t('home.position', { n: dig(pos) })}` : ''}</Txt>
        </View>
      </View>

      <FadeIn>
        <Card testID="home-date-card" accent={th.colors.primary}>
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

          {nextFx && opp ? (
            <View
              testID="home-next-match" accessible accessibilityLabel={`${t('home.nextMatch')}: ${cv.name} ${t('fixtures.vs')} ${opp.name}, ${nextFx.competition}, ${engineDate(nextFx.date)}, ${untilText}, ${atHome ? t('home.matchHome') : t('home.matchAway')}`}
              style={{ gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: 1, borderBottomWidth: 1, borderColor: th.colors.border }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Txt variant="caption" color="muted" style={{ fontWeight: '700' }}>{t('home.nextMatch').toUpperCase()} · {nextFx.competition}</Txt>
                <Txt variant="caption" color={atHome ? 'success' : 'muted'} style={{ fontWeight: '700' }}>{atHome ? t('home.matchHome') : t('home.matchAway')}</Txt>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
                <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <Crest clubId={atHome ? cv.id : opp.id} name={atHome ? cv.name : opp.name} size={narrow ? 36 : 44} />
                  <Txt variant={narrow ? 'caption' : 'small'} align="center" numberOfLines={2} style={{ fontWeight: '600' }}>{atHome ? cv.name : opp.name}</Txt>
                </View>
                <View style={{ alignItems: 'center', minWidth: narrow ? 64 : 76 }}>
                  <Txt variant={narrow ? 'title' : 'h2'} align="center" numberOfLines={1} adjustsFontSizeToFit>{untilText}</Txt>
                  <Txt variant="caption" color="muted" align="center">{engineDate(nextFx.date)}</Txt>
                </View>
                <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <Crest clubId={atHome ? opp.id : cv.id} name={atHome ? opp.name : cv.name} size={narrow ? 36 : 44} />
                  <Txt variant={narrow ? 'caption' : 'small'} align="center" numberOfLines={2} style={{ fontWeight: '600' }}>{atHome ? opp.name : cv.name}</Txt>
                </View>
              </View>
            </View>
          ) : null}

          <Button label={t('sim.nextMatchday')} icon="play" onPress={() => void play({ kind: 'nextMatchday' })} disabled={busy} testID="sim-next-matchday" />
          <SimControls compact />
          {saveState.status === 'error' ? <Banner tone="error" text={t('notice.saveFailed')} detail={saveState.message} /> : null}
          <SimSummaryBanner />
        </Card>
      </FadeIn>

      {data.firstRun ? (
        <FadeIn delay={80}>
          <Card testID="welcome-card">
            <View style={{ gap: 2 }}>
              <Txt variant="h2" accessibilityRole="header">{t('welcome.title')}</Txt>
              <Txt variant="small" color="muted">{t('welcome.sub')}</Txt>
            </View>
            <View style={{ marginHorizontal: -spacing.lg, borderTopWidth: 1, borderColor: th.colors.border }}>
              {steps.map((st, i) => (
                <Row key={st.testID} testID={st.testID} title={st.title} subtitle={st.sub} chevron onPress={() => router.push(st.href as never)} divider={i < steps.length - 1}
                  left={<View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: th.colors.highlight, alignItems: 'center', justifyContent: 'center' }}><Icon name={st.icon} size={20} color={th.colors.primaryText} /></View>} />
              ))}
            </View>
          </Card>
        </FadeIn>
      ) : (
        <FadeIn delay={80}>
          <Card testID="home-glance">
            <Txt variant="title" accessibilityRole="header">{t('home.seasonGlance')}</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
              <View style={{ minWidth: 84 }}>
                <Txt variant="caption" color="muted">{t('home.positionTrend')}</Txt>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                  <Txt variant="display" num testID="home-position" style={{ fontSize: th.fs(30) }}>{pos ? dig(pos) : '–'}</Txt>
                  <Txt variant="caption" color="muted">{t('home.ofTotal', { total: dig(data.tableSize) })}</Txt>
                </View>
                {data.hist.length > 1 ? (
                  <Txt variant="caption" color={delta > 0 ? 'success' : delta < 0 ? 'danger' : 'muted'} style={{ fontWeight: '700' }}>
                    {delta > 0 ? '▲ ' : delta < 0 ? '▼ ' : ''}{delta > 0 ? t('home.moveUp', { n: dig(delta) }) : delta < 0 ? t('home.moveDown', { n: dig(-delta) }) : t('home.moveSame')}
                  </Txt>
                ) : null}
              </View>
              {data.hist.length ? (
                <RankSparkline values={data.hist} total={data.tableSize} label={t('home.positionTrendLabel', { list: data.hist.map((v) => dig(v)).join(', '), n: pos ? dig(pos) : '–', total: dig(data.tableSize) })} />
              ) : null}
            </View>
            <View style={{ borderTopWidth: 1, borderColor: th.colors.border, paddingTop: spacing.md, gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Txt variant="caption" color="muted">{t('home.formGuide')}</Txt>
                {formChips.length ? <Txt variant="caption" color="muted" num>{t('home.formPoints', { n: dig(pts), m: dig(formChips.length) })}</Txt> : null}
              </View>
              {formChips.length ? <FormChips items={formChips} onPress={(fid) => router.push(hrefs.match(fid) as never)} /> : <Txt variant="small" color="muted">{t('home.formNone')}</Txt>}
            </View>
          </Card>
        </FadeIn>
      )}

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
