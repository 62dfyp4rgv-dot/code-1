import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { dateInfo, competitionOverview, statLeaders, type CompetitionOverview } from '@fu/engine';
import { useWorldQuery } from '../state/queries';
import { useI18n } from '../i18n/useI18n';
import { useTheme } from '../theme/ThemeProvider';
import { Banner, Card, Empty, KeyValue, Row, RowGroup, Section, Spinner } from '../ui/Layout';
import { Chip, ChipRow, Segmented, Button } from '../ui/Controls';
import { Txt } from '../ui/Txt';
import { Crest } from '../ui/ClubVisuals';
import { LeagueTable, hrefs } from './common';
import { spacing } from '../theme/tokens';

export function VerificationNote({ v }: { v: CompetitionOverview['verification'] }): ReactNode {
  const { t, td } = useI18n();
  const verified = v.status === 'verified';
  return (
    <Banner testID="verification-note" tone={verified ? 'success' : 'warn'} text={td('verify.' + v.status, v.status)} detail={`${v.note} — ${t('verify.disclaimer')}`} />
  );
}

type View2 = 'tables' | 'fixtures' | 'leaders' | 'entrants';

export function CompetitionBody({ compId }: { compId: string }): ReactNode {
  const { t, td, dig, num, date } = useI18n();
  const router = useRouter();
  const th = useTheme();
  const [view, setView] = useState<View2>('tables');
  const [stageSel, setStageSel] = useState<number | null>(null);
  const [groupSel, setGroupSel] = useState<string | null>(null);
  const [round, setRound] = useState<number | null>(null);
  const [leader, setLeader] = useState<'goals' | 'assists' | 'rating'>('goals');
  const ov = useWorldQuery('comp', [compId], (w) => competitionOverview(w, compId));
  const lead = useWorldQuery('leaders', [compId, leader, view === 'leaders'], (w) => (view === 'leaders' ? statLeaders(w, compId, leader, 15) : []));
  const fixtures = useWorldQuery('comp-fixtures', [compId, view === 'fixtures'], (w) => {
    if (view !== 'fixtures') return [];
    const comp = w.competitions[compId];
    return (comp?.fixtures ?? []).map((f) => ({ id: f.id, day: f.day, stage: f.stageId, round: f.round, leg: f.leg, home: w.clubs[f.home]?.name ?? f.home, away: w.clubs[f.away]?.name ?? f.away, homeId: f.home, awayId: f.away, status: f.status, score: f.result ? `${f.result.homeGoals}-${f.result.awayGoals}${f.result.pens ? ` (${f.result.pens.home}-${f.result.pens.away}p)` : ''}` : null, group: f.group }));
  });
  const entrants = useWorldQuery('entrants', [compId, view === 'entrants'], (w) => (view === 'entrants' ? (w.competitions[compId]?.entrants ?? []).map((id) => ({ id, name: w.clubs[id]?.name ?? id, country: w.clubs[id]?.country ?? '' })) : []));
  if (!ov) return <Spinner />;
  if (ov.stages.length === 0) return <Empty text={t('comp.noStages')} />;
  const activeIdx = stageSel ?? Math.max(0, ov.stages.findIndex((s) => s.status === 'active') >= 0 ? ov.stages.findIndex((s) => s.status === 'active') : ov.stages.length - 1);
  const stage = ov.stages[activeIdx] ?? ov.stages[0]!;
  const group = stage.groups.find((g) => g.id === groupSel) ?? stage.groups[0];
  const stageFixtures = (fixtures ?? []).filter((f) => f.stage === stage.id);
  const rounds = [...new Set(stageFixtures.map((f) => f.round))].sort((a, b) => a - b);
  const curRound = round ?? (rounds.find((r) => stageFixtures.some((f) => f.round === r && f.status === 'scheduled')) ?? rounds[rounds.length - 1] ?? 1);
  const roundFx = stageFixtures.filter((f) => f.round === curRound).sort((a, b) => a.day - b.day);
  return (
    <View style={{ gap: spacing.lg }}>
      <VerificationNote v={ov.verification} />
      <Card>
        <KeyValue label={t('comp.status')} value={td('status.' + ov.status, ov.status)} testID="comp-status" />
        <KeyValue label={t('comp.kind')} value={`${td('kind.' + ov.kind, ov.kind)}${ov.confederation ? ` · ${ov.confederation}` : ''}`} />
        <KeyValue label={t('comp.entrants')} value={dig(ov.entrants)} />
        {ov.winner ? <KeyValue label={t('comp.winner')} value={ov.winner} valueColor={th.colors.accent} /> : null}
        {ov.runnerUp ? <KeyValue label={t('comp.runnerUp')} value={ov.runnerUp} /> : null}
      </Card>
      <Segmented<View2> label={t('comp.view')} value={view} onChange={setView} options={[
        { value: 'tables', label: t('comp.tables'), testID: 'cv-tables' }, { value: 'fixtures', label: t('comp.fixtures'), testID: 'cv-fixtures' },
        { value: 'leaders', label: t('comp.leaders'), testID: 'cv-leaders' }, { value: 'entrants', label: t('comp.entrantsTab'), testID: 'cv-entrants' },
      ]} />
      {ov.stages.length > 1 ? (
        <ChipRow>{ov.stages.map((s, i) => <Chip key={s.id} label={`${s.name} · ${td('status.' + s.status, s.status)}`} selected={i === activeIdx} onPress={() => { setStageSel(i); setGroupSel(null); setRound(null); }} testID={`stage-${s.id}`} />)}</ChipRow>
      ) : null}

      {view === 'tables' ? (
        <>
          {stage.groups.length > 1 ? (
            <ChipRow>{stage.groups.map((g) => <Chip key={g.id} label={groupLabel(g.id, t('comp.group'))} selected={g.id === group?.id} onPress={() => setGroupSel(g.id)} testID={`group-${g.id}`} />)}</ChipRow>
          ) : null}
          {group ? <LeagueTable rows={group.table} onClub={(c) => router.push(hrefs.club(c))} testID="comp-table" /> : null}
          {stage.rounds.length ? (
            <Section title={`${stage.name}`}>
              {stage.rounds.map((r) => (
                <Card key={r.round} padded={false}>
                  <View style={{ padding: spacing.md, paddingBottom: 0 }}><Txt variant="label" color="muted">{t('comp.round', { n: dig(r.round) })}</Txt></View>
                  {r.ties.map((tie, i) => (
                    <Row key={i} divider={i < r.ties.length - 1} title={`${tie.home} – ${tie.away}`} subtitle={`${tie.aggregate}${tie.winner ? ` · ${t('comp.advances')}: ${tie.winner}` : ''}`} />
                  ))}
                </Card>
              ))}
            </Section>
          ) : null}
          {!group && stage.rounds.length === 0 ? <Empty text={t('comp.stagePending')} icon="calendar" /> : null}
        </>
      ) : null}

      {view === 'fixtures' ? (
        <>
          {rounds.length > 1 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Button label="‹" small variant="secondary" disabled={curRound <= (rounds[0] ?? 1)} onPress={() => setRound(Math.max(rounds[0] ?? 1, curRound - 1))} testID="round-prev" />
              <Txt variant="bodyStrong" align="center" style={{ flex: 1 }} testID="round-label">{t('comp.round', { n: dig(curRound) })} / {dig(rounds[rounds.length - 1] ?? 1)}</Txt>
              <Button label="›" small variant="secondary" disabled={curRound >= (rounds[rounds.length - 1] ?? 1)} onPress={() => setRound(Math.min(rounds[rounds.length - 1] ?? 1, curRound + 1))} testID="round-next" />
            </View>
          ) : null}
          <RowGroup testID="comp-fixtures">
            {roundFx.length === 0 ? <Empty text={t('fixtures.none')} icon="calendar" /> : roundFx.map((f) => (
              <Row key={f.id} title={`${f.home}  ${f.score ?? t('fixtures.vs')}  ${f.away}`} subtitle={`${date(dateInfo(f.day).iso)}${f.group ? ` · ${groupLabel(f.group, t('comp.group'))}` : ''}${f.leg === 2 ? ` · ${t('comp.leg2')}` : ''}`}
                left={<Crest clubId={f.homeId} name={f.home} size={28} />} onPress={f.status === 'played' ? () => router.push(hrefs.match(f.id)) : undefined} chevron={f.status === 'played'} />
            ))}
          </RowGroup>
        </>
      ) : null}

      {view === 'leaders' ? (
        <>
          <Segmented<'goals' | 'assists' | 'rating'> label={t('comp.leaders')} value={leader} onChange={setLeader} options={[
            { value: 'goals', label: t('leaders.goals'), testID: 'ld-goals' }, { value: 'assists', label: t('leaders.assists'), testID: 'ld-assists' }, { value: 'rating', label: t('leaders.rating'), testID: 'ld-rating' },
          ]} />
          <RowGroup testID="leaders-list">
            {!lead || lead.length === 0 ? <Empty text={t('leaders.none')} icon="chart" /> : lead.map((l, i) => (
              <Row key={l.playerId} title={`${dig(i + 1)}. ${l.player}`} subtitle={`${l.club} · ${t('player.apps')} ${dig(l.apps)}`} onPress={() => router.push(hrefs.player(l.playerId))}
                right={<Txt variant="title" num color="primary">{leader === 'rating' ? num(l.value, 2) : dig(l.value)}</Txt>} />
            ))}
          </RowGroup>
        </>
      ) : null}

      {view === 'entrants' ? (
        <RowGroup testID="entrants-list">
          {!entrants || entrants.length === 0 ? <Empty text={t('comp.noEntrants')} /> : entrants.map((e) => (
            <Row key={e.id} title={e.name} subtitle={e.country} left={<Crest clubId={e.id} name={e.name} size={28} />} onPress={() => router.push(hrefs.club(e.id))} chevron />
          ))}
        </RowGroup>
      ) : null}
    </View>
  );
}

function groupLabel(id: string, word: string): string {
  return id === 'main' ? word : id.length <= 2 ? `${word} ${id}` : id.charAt(0).toUpperCase() + id.slice(1);
}
