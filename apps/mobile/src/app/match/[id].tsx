import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { dateInfo, matchView, type MatchView } from '@fu/engine';
import { useWorldQuery } from '../../state/queries';
import { useI18n } from '../../i18n/useI18n';
import { useTheme } from '../../theme/ThemeProvider';
import { Screen, Card, Section, Empty, RowGroup, Row } from '../../ui/Layout';
import { Segmented, Switch } from '../../ui/Controls';
import { Txt } from '../../ui/Txt';
import { Crest, PosBadge, RatingPill } from '../../ui/ClubVisuals';
import { hrefs } from '../../features/common';
import { spacing } from '../../theme/tokens';

type Tab = 'summary' | 'timeline' | 'lineups';

function StatRow({ label, home, away, fmt }: { label: string; home: number; away: number; fmt?: (n: number) => string }): ReactNode {
  const th = useTheme();
  const { num } = useI18n();
  const f = fmt ?? ((n: number) => num(n));
  const total = home + away;
  const hp = total > 0 ? home / total : 0.5;
  return (
    <View style={{ gap: 3 }} accessible accessibilityLabel={`${label}: ${f(home)} - ${f(away)}`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
        <Txt variant="small" num style={{ fontWeight: '700', minWidth: 44 }}>{f(home)}</Txt>
        <Txt variant="small" color="muted" align="center" style={{ flex: 1 }}>{label}</Txt>
        <Txt variant="small" num align="end" style={{ fontWeight: '700', minWidth: 44 }}>{f(away)}</Txt>
      </View>
      <View style={{ flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: th.colors.surfaceAlt, direction: 'ltr' }}>
        <View style={{ flex: hp, backgroundColor: th.colors.primary }} />
        <View style={{ flex: 1 - hp, backgroundColor: th.colors.info }} />
      </View>
    </View>
  );
}

export default function MatchScreen(): ReactNode {
  const { id: raw } = useLocalSearchParams<{ id: string }>();
  const id = decodeURIComponent(raw ?? '');
  const { t, td, dig, engineDate, num } = useI18n();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('summary');
  const [keyOnly, setKeyOnly] = useState(true);
  const data = useWorldQuery('match', [id], (w) => {
    const mv = matchView(w, id);
    if (mv) return { mv, fallback: null as null };
    // The match record was not archived (only recent / human-club matches are kept in full): show what the fixture itself knows.
    const comp = w.competitions[id.split(':')[0] ?? ''];
    const f = comp?.fixtures.find((x) => x.id === id);
    if (!f) return null;
    return { mv: null as MatchView | null, fallback: { home: w.clubs[f.home]?.name ?? f.home, away: w.clubs[f.away]?.name ?? f.away, homeId: f.home, awayId: f.away, score: f.result ? `${f.result.homeGoals}-${f.result.awayGoals}` : null, date: dateInfo(f.day).label, comp: comp?.id ?? '' } };
  });
  if (!data) return <Screen back title={t('match.notFound')}><Empty text={t('match.notFound')} /></Screen>;
  const mv = data.mv;
  const fb = data.fallback;
  const homeName = mv?.fixture.home.name ?? fb?.home ?? '';
  const awayName = mv?.fixture.away.name ?? fb?.away ?? '';
  const homeId = mv?.fixture.home.id ?? fb?.homeId ?? '';
  const awayId = mv?.fixture.away.id ?? fb?.awayId ?? '';
  const score = mv?.fixture.score ?? fb?.score ?? '–';
  return (
    <Screen back title={t('match.title')} subtitle={mv ? `${mv.fixture.competition} · ${engineDate(mv.fixture.date)}` : undefined} testID="screen-match">
      <Card accent={undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
          <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Crest clubId={homeId} name={homeName} size={52} />
            <Txt variant="small" align="center" numberOfLines={2} onPress={() => router.push(hrefs.club(homeId))} accessibilityRole="link">{homeName}</Txt>
          </View>
          <View style={{ alignItems: 'center', minWidth: 90 }}>
            <Txt variant="display" num align="center" testID="match-score" style={{ direction: 'ltr' }}>{score.replace('-', ' - ')}</Txt>
            {mv?.fixture.pens ? <Txt variant="small" color="muted">{mv.fixture.pens}</Txt> : null}
            <Txt variant="caption" color="muted">{mv ? `${mv.fixture.stage}` : ''}</Txt>
          </View>
          <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
            <Crest clubId={awayId} name={awayName} size={52} />
            <Txt variant="small" align="center" numberOfLines={2} onPress={() => router.push(hrefs.club(awayId))} accessibilityRole="link">{awayName}</Txt>
          </View>
        </View>
      </Card>

      {!mv ? <Empty text={t('match.notArchived')} icon="info" /> : (
        <>
          <Segmented<Tab> label={t('match.title')} value={tab} onChange={setTab} options={[
            { value: 'summary', label: t('match.summary'), testID: 'mt-summary' }, { value: 'timeline', label: t('match.timeline'), testID: 'mt-timeline' }, { value: 'lineups', label: t('match.lineups'), testID: 'mt-lineups' },
          ]} />

          {tab === 'summary' ? (
            <>
              <Section title={t('match.goals')}>
                <RowGroup testID="match-goals">
                  {mv.goals.length === 0 ? <Empty text={t('match.noGoals')} icon="ball" /> : mv.goals.map((g, i) => (
                    <Row key={i} title={`${dig(g.minute)}'  ${g.scorer}`} subtitle={`${g.side === 'home' ? homeName : awayName} · ${td('goal.kind.' + g.kind, g.kind)}`} />
                  ))}
                </RowGroup>
                {mv.motm ? <Txt variant="small" color="muted">{t('match.motm')}: {mv.motm}</Txt> : null}
              </Section>
              <Section title={t('match.stats')}>
                <Card testID="match-stats">
                  <StatRow label={t('stat.possession')} home={mv.stats.home.possession} away={mv.stats.away.possession} fmt={(n) => `${num(n, 0)}%`} />
                  <StatRow label={t('stat.shots')} home={mv.stats.home.shots} away={mv.stats.away.shots} />
                  <StatRow label={t('stat.onTarget')} home={mv.stats.home.shotsOnTarget} away={mv.stats.away.shotsOnTarget} />
                  <StatRow label={t('stat.xg')} home={mv.stats.home.xg} away={mv.stats.away.xg} fmt={(n) => num(n, 2)} />
                  <StatRow label={t('stat.passes')} home={mv.stats.home.passes} away={mv.stats.away.passes} />
                  <StatRow label={t('stat.corners')} home={mv.stats.home.corners} away={mv.stats.away.corners} />
                  <StatRow label={t('stat.fouls')} home={mv.stats.home.fouls} away={mv.stats.away.fouls} />
                  <StatRow label={t('stat.yellow')} home={mv.stats.home.yellow} away={mv.stats.away.yellow} />
                  <StatRow label={t('stat.red')} home={mv.stats.home.red} away={mv.stats.away.red} />
                  <StatRow label={t('stat.offsides')} home={mv.stats.home.offsides} away={mv.stats.away.offsides} />
                  <StatRow label={t('stat.saves')} home={mv.stats.home.saves} away={mv.stats.away.saves} />
                  <StatRow label={t('stat.tackles')} home={mv.stats.home.tackles} away={mv.stats.away.tackles} />
                </Card>
              </Section>
            </>
          ) : null}

          {tab === 'timeline' ? (
            mv.events ? (
              <>
                <Switch label={t('match.keyOnly')} value={keyOnly} onChange={setKeyOnly} testID="switch-key-events" />
                <RowGroup testID="match-timeline">
                  {mv.events.filter((e) => !keyOnly || ['goal', 'card', 'sub', 'injury', 'kickoff', 'halftime', 'fulltime', 'shootout', 'extraTimeStart'].includes(e.type)).map((e, i) => (
                    <Row key={i} title={e.text} subtitle={`${dig(e.minute)}' · ${e.side === 'home' ? homeName : awayName}`} />
                  ))}
                </RowGroup>
                <Txt variant="caption" color="muted">{t('match.engineText')}</Txt>
              </>
            ) : <Empty text={t('match.noTimeline')} icon="info" />
          ) : null}

          {tab === 'lineups' ? (
            mv.lineups ? (
              (['home', 'away'] as const).map((side) => (
                <Section key={side} title={side === 'home' ? homeName : awayName}>
                  <RowGroup testID={`lineup-${side}`}>
                    {mv.lineups![side].map((p, i) => (
                      <Row key={i} title={p.name} left={<PosBadge pos={p.position} label={td('pos.' + p.position, p.position)} />}
                        subtitle={`${dig(p.minutes)}' ${p.goals ? `· ⚽ ${dig(p.goals)}` : ''}`} right={<RatingPill value={num(p.rating, 1)} label={t('match.rating')} />} />
                    ))}
                  </RowGroup>
                </Section>
              ))
            ) : <Empty text={t('match.noLineups')} icon="info" />
          ) : null}
        </>
      )}
    </Screen>
  );
}
