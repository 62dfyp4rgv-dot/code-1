import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { clubFixtures, clubView, squadSummary, squadView } from '@fu/engine';
import { useWorldQuery } from '../../state/queries';
import { useI18n } from '../../i18n/useI18n';
import { Screen, Card, Section, KeyValue, ProgressBar, Empty, RowGroup, Row, Banner } from '../../ui/Layout';
import { Txt } from '../../ui/Txt';
import { Crest } from '../../ui/ClubVisuals';
import { PlayerListRow } from '../../features/PlayerListRow';
import { FixtureRow, hrefs } from '../../features/common';
import { spacing } from '../../theme/tokens';
import { seasonLabelOf } from '../../core/format';

export default function ClubScreen(): ReactNode {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, td, dig, num, money } = useI18n();
  const router = useRouter();
  const data = useWorldQuery('club', [id], (w) => {
    const cv = clubView(w, id);
    if (!cv) return null;
    return {
      cv, human: w.config.humanClubId === id, squad: squadView(w, id), sum: squadSummary(w, id),
      next: clubFixtures(w, id, { upcoming: true, limit: 3 }), last: clubFixtures(w, id, { upcoming: false, limit: 3 }).reverse(),
      
    };
  });
  if (!data) return <Screen back title={t('club.notFound')}><Empty text={t('club.notFound')} /></Screen>;
  const { cv } = data;
  const fac = Object.entries(cv.facilities) as [string, number][];
  return (
    <Screen back title={cv.name} subtitle={`${cv.city} · ${cv.country}`} testID="screen-club">
      <Card>
        <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
          <Crest clubId={cv.id} name={cv.name} size={72} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt variant="h2" testID="club-name">{cv.name}</Txt>
            <Txt variant="small" color="muted">{cv.league}{cv.position ? ` · ${t('home.position', { n: dig(cv.position) })}` : ''}</Txt>
            {data.human ? <Txt variant="caption" color="primary">{t('club.yourClub')}</Txt> : null}
          </View>
        </View>
        <KeyValue label={t('club.stadium')} value={`${cv.stadium.name} (${num(cv.stadium.capacity)})`} />
        <KeyValue label={t('club.ownership')} value={td('ownership.' + cv.ownership.kind, cv.ownership.kind)} />
        <KeyValue label={t('club.philosophy')} value={td('philosophy.' + cv.philosophy, cv.philosophy)} />
        <KeyValue label={t('club.manager')} value={cv.manager ? cv.manager.name : '–'} />
        <KeyValue label={t('club.reputation')} value={dig(cv.reputation)} />
        <ProgressBar value={cv.reputation / 100} label={t('club.reputation')} />
      </Card>

      <Section title={t('club.squadSummary')}>
        <Card>
          <KeyValue label={t('squad.players')} value={dig(data.sum.players)} />
          <KeyValue label={t('home.squadRating')} value={num(data.sum.avgOverall, 1)} />
          <KeyValue label={t('home.avgAge')} value={num(data.sum.avgAge, 1)} />
          <KeyValue label={t('club.annualWages')} value={money(data.sum.wageBill)} />
          {!data.human ? <Txt variant="caption" color="muted">{t('club.scoutedNote')}</Txt> : null}
        </Card>
      </Section>

      <Section title={t('club.facilities')}>
        <Card>
          {fac.map(([k, v]) => (
            <View key={k} style={{ gap: 2 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Txt variant="small">{td('facility.' + k, k)}</Txt><Txt variant="small" num>{dig(v)}</Txt></View>
              <ProgressBar value={v / 100} height={6} />
            </View>
          ))}
        </Card>
      </Section>

      <Section title={t('club.honours')}>
        <Card>
          {cv.honours.length === 0 ? <Txt variant="small" color="muted">{t('club.noHonours')}</Txt> : cv.honours.map((h) => (
            <KeyValue key={h.competition} label={h.competition} value={`${dig(h.seasons.length)} (${h.seasons.map((x) => dig(seasonLabelOf(x))).join(', ')})`} />
          ))}
        </Card>
      </Section>

      {cv.rivals.length ? <Section title={t('club.rivals')}><Card><Txt variant="body">{cv.rivals.join(', ')}</Txt></Card></Section> : null}

      <Section title={t('home.nextMatches')}>
        <RowGroup>{data.next.length ? data.next.map((f) => <FixtureRow key={f.id} f={f} humanId={cv.id} />) : <Empty text={t('home.noFixtures')} />}</RowGroup>
      </Section>
      <Section title={t('home.lastResults')}>
        <RowGroup>{data.last.length ? data.last.map((f) => <FixtureRow key={f.id} f={f} humanId={cv.id} />) : <Empty text={t('home.noResults')} />}</RowGroup>
      </Section>

      <Section title={t('tab.squad')}>
        {!data.human ? <Banner tone="info" text={t('club.scoutedNote')} /> : null}
        <RowGroup>{data.squad.map((p) => <PlayerListRow key={p.id} r={p} onPress={() => router.push(hrefs.player(p.id))} />)}</RowGroup>
      </Section>
      <Row divider={false} title={t('club.openLeague')} onPress={() => router.push(hrefs.competition(cv.leagueId))} chevron />
    </Screen>
  );
}
