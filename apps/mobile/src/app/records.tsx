import { useState, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { competitionList, newsView, recordsView, statLeaders } from '@fu/engine';
import { useHumanClubId, useWorldQuery } from '../state/queries';
import { useI18n } from '../i18n/useI18n';
import { Screen, Card, Section, Row, RowGroup, Empty, Spinner } from '../ui/Layout';
import { Chip, ChipRow, Segmented } from '../ui/Controls';
import { Txt } from '../ui/Txt';
import { NewsList, hrefs } from '../features/common';
import { getWorld } from '../state/worldHost';

type Tab = 'history' | 'leaders' | 'news';

export default function Records(): ReactNode {
  const { t, dig, num } = useI18n();
  const router = useRouter();
  const humanId = useHumanClubId();
  const [tab, setTab] = useState<Tab>('history');
  const [kind, setKind] = useState<'goals' | 'assists' | 'rating'>('goals');
  const [mine, setMine] = useState(false);
  const leagues = useWorldQuery('leagues-tier1', [], (w) => competitionList(w).filter((c) => c.kind === 'league'));
  const [comp, setComp] = useState<string | null>(null);
  const compId = comp ?? getWorld()?.clubs[humanId ?? '']?.leagueId ?? leagues?.[0]?.id ?? 'ENG1';
  const rec = useWorldQuery('records', [], (w) => recordsView(w));
  const lead = useWorldQuery('stat-leaders', [compId, kind, tab], (w) => (tab === 'leaders' ? statLeaders(w, compId, kind, 20) : []));
  const news = useWorldQuery('news', [mine, humanId, tab], (w) => (tab === 'news' ? newsView(w, { clubId: mine && humanId ? humanId : undefined, limit: 60 }) : []));
  if (!rec) return <Screen back title={t('nav.records')}><Spinner /></Screen>;
  return (
    <Screen back title={t('nav.records')} testID="screen-records">
      <Segmented<Tab> label={t('nav.records')} value={tab} onChange={setTab} options={[
        { value: 'history', label: t('records.history'), testID: 'rc-history' }, { value: 'leaders', label: t('records.leaders'), testID: 'rc-leaders' }, { value: 'news', label: t('records.news'), testID: 'rc-news' },
      ]} />
      {tab === 'history' ? (
        <>
          <Section title={t('records.champions')}>
            {rec.seasons.length === 0 ? <Empty text={t('records.noSeasons')} icon="trophy" /> : [...rec.seasons].reverse().map((s) => (
              <Card key={s.season} testID={`season-${s.season}`}>
                <Txt variant="bodyStrong">{dig(s.label)}</Txt>
                {s.champions.map((c, i) => <Txt key={i} variant="small">{c.competition}: {c.winner}{c.runnerUp ? ` (${c.runnerUp})` : ''}</Txt>)}
                {s.topScorer ? <Txt variant="caption" color="muted">{t('records.topScorer')}: {s.topScorer.player} ({s.topScorer.club}) {dig(s.topScorer.goals)}</Txt> : null}
              </Card>
            ))}
          </Section>
          <Section title={t('records.clubHonours')}>
            <RowGroup>{rec.clubHonours.length === 0 ? <Empty text={t('records.noSeasons')} /> : rec.clubHonours.map((c, i) => <Row key={i} title={c.club} right={<Txt variant="bodyStrong" num>{dig(c.titles)}</Txt>} />)}</RowGroup>
          </Section>
          <Section title={t('records.legends')}>
            <RowGroup>{rec.legends.length === 0 ? <Empty text={t('records.noLegends')} /> : rec.legends.map((l, i) => <Row key={i} title={l.name} subtitle={`${t('player.apps')} ${dig(l.apps)} · ${t('player.goals')} ${dig(l.goals)} · ${t('records.retired')} ${dig(l.retiredSeason)}`} />)}</RowGroup>
          </Section>
        </>
      ) : null}
      {tab === 'leaders' ? (
        <>
          <ChipRow>
            {(leagues ?? []).filter((l) => !l.id.endsWith('2')).slice(0, 14).map((l) => <Chip key={l.id} label={l.id} selected={l.id === compId} onPress={() => setComp(l.id)} testID={`lc-${l.id}`} />)}
          </ChipRow>
          <Segmented<'goals' | 'assists' | 'rating'> label={t('records.leaders')} value={kind} onChange={setKind} options={[
            { value: 'goals', label: t('leaders.goals'), testID: 'sl-goals' }, { value: 'assists', label: t('leaders.assists'), testID: 'sl-assists' }, { value: 'rating', label: t('leaders.rating'), testID: 'sl-rating' },
          ]} />
          <RowGroup testID="stat-leaders">
            {!lead || lead.length === 0 ? <Empty text={t('leaders.none')} icon="chart" /> : lead.map((l, i) => (
              <Row key={l.playerId} title={`${dig(i + 1)}. ${l.player}`} subtitle={`${l.club} · ${t('player.apps')} ${dig(l.apps)}`} right={<Txt variant="title" num color="primary">{kind === 'rating' ? num(l.value, 2) : dig(l.value)}</Txt>} onPress={() => router.push(hrefs.player(l.playerId))} />
            ))}
          </RowGroup>
        </>
      ) : null}
      {tab === 'news' ? (
        <>
          <Segmented<string> label={t('records.news')} value={mine ? 'mine' : 'all'} onChange={(v) => setMine(v === 'mine')} options={[{ value: 'all', label: t('records.newsAll'), testID: 'news-all' }, { value: 'mine', label: t('records.newsMine'), testID: 'news-mine' }]} />
          <Card padded={false} testID="news-list"><NewsList items={news ?? []} /></Card>
          <Txt variant="caption" color="muted">{t('match.engineText')}</Txt>
        </>
      ) : null}
    </Screen>
  );
}
