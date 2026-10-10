import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { dateInfo, playerProfile, releasePlayerAction, scoutReport, type PlayerProfile } from '@fu/engine';
import { useWorldQuery } from '../../state/queries';
import { mutate, notify } from '../../state/gameStore';
import { useI18n } from '../../i18n/useI18n';
import { useTheme } from '../../theme/ThemeProvider';
import { Screen, Card, Section, KeyValue, ProgressBar, Banner, Row, RowGroup, Empty } from '../../ui/Layout';
import { Button, Chip, ChipRow } from '../../ui/Controls';
import { Sheet } from '../../ui/Sheet';
import { Txt } from '../../ui/Txt';
import { Avatar, Crest, PosBadge, RatingPill } from '../../ui/ClubVisuals';
import { TransferSheets, type SheetKind } from '../../features/transferSheets';
import { hrefs } from '../../features/common';
import { seasonLabelOf } from '../../core/format';
import { spacing } from '../../theme/tokens';
import { getWorld } from '../../state/worldHost';

function AttrBar({ name, value }: { name: string; value: number }): ReactNode {
  const { td } = useI18n();
  const th = useTheme();
  const tone = value >= 75 ? th.colors.success : value >= 55 ? th.colors.info : value >= 40 ? th.colors.warning : th.colors.danger;
  return (
    <View style={{ gap: 2 }} accessible accessibilityLabel={`${td('attr.' + name, name)} ${value}`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Txt variant="small">{td('attr.' + name, name)}</Txt>
        <Txt variant="small" num style={{ fontWeight: '700' }}>{value}</Txt>
      </View>
      <ProgressBar value={value / 100} color={tone} height={6} />
    </View>
  );
}

export default function PlayerScreen(): ReactNode {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, td, dig, money, wage, date, engineDate, num } = useI18n();
  const router = useRouter();
  const th = useTheme();
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const data = useWorldQuery('player', [id], (w) => {
    const p = playerProfile(w, id);
    if (!p) return null;
    const sr = scoutReport(w, id);
    return { p, scout: sr.ok ? sr.value : null, clubName: p.row.clubId ? (w.clubs[p.row.clubId]?.name ?? '') : null, humanId: w.config.humanClubId, listed: w.transferList[id] ?? null, nameOf: Object.fromEntries(p.history.map((h) => [h.clubId, w.clubs[h.clubId]?.name ?? h.clubId])) as Record<string, string> };
  });
  if (!data) return <Screen back title={t('player.notFound')}><Empty text={t('player.notFound')} /></Screen>;
  const { p, scout } = data;
  const r = p.row;
  const own = r.clubId !== null && r.clubId === data.humanId;
  const free = r.clubId === null;
  const season = getWorld()?.season ?? 1;
  const doRelease = (): void => {
    const res = mutate((w) => releasePlayerAction(w, r.id));
    setConfirmRelease(false);
    if (res.ok) { notify('info', 'player.released', { name: r.name }); router.back(); } else notify('error', 'player.releaseFailed', undefined, res.error);
  };
  const groups: ('technical' | 'mental' | 'physical' | 'goalkeeping')[] = ['technical', 'mental', 'physical', ...(r.position === 'GK' ? (['goalkeeping'] as const) : [])];
  return (
    <Screen back title={r.name} subtitle={`${td('pos.' + r.position, r.position)} · ${r.nationality}`} testID="screen-player">
      <Card>
        <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
          <Avatar name={r.name} size={64} />
          <View style={{ flex: 1, gap: 4 }}>
            <Txt variant="h2" numberOfLines={2} testID="player-name">{r.name}</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <PosBadge pos={r.position} label={td('pos.' + r.position, r.position)} />
              <Txt variant="small" color="muted">{dig(r.age)} {t('player.yrs')} · {p.foot === 'L' ? t('player.footL') : p.foot === 'R' ? t('player.footR') : t('player.footB')} · {t('player.weakFoot')} {dig(p.weakFoot)}★</Txt>
            </View>
            {r.clubId ? (
              <Row divider={false} title={data.clubName ?? ''} left={<Crest clubId={r.clubId} name={data.clubName ?? ''} size={24} />} onPress={() => router.push(hrefs.club(r.clubId as string))} chevron testID="player-club-link" />
            ) : <Txt variant="small" color="muted">{t('player.freeAgent')}</Txt>}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt variant="caption" color="muted">{t('player.ability')}</Txt>
            <RatingPill value={r.exact ? r.ability : scout ? `${scout.abilityLow}–${scout.abilityHigh}` : `~${r.ability}`} label={t('player.ability')} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt variant="caption" color="muted">{t('player.potential')}</Txt>
            <RatingPill value={r.exact ? r.potential : scout ? `${scout.potentialLow}–${scout.potentialHigh}` : `~${r.potential}`} label={t('player.potential')} />
          </View>
        </View>
        {!r.exact && scout ? (
          <View style={{ gap: 4 }} testID="scout-report">
            <Txt variant="caption" color="muted">{t('player.scoutConfidence', { n: dig(Math.round(scout.confidence * 100)) })}</Txt>
            <ProgressBar value={scout.confidence} label={t('player.scoutConfidence', { n: Math.round(scout.confidence * 100) })} color={th.colors.info} />
            <Txt variant="caption" color="muted">{t('player.unscoutedNote')}</Txt>
          </View>
        ) : null}
      </Card>

      {r.injury ? <Banner tone="error" text={`${t('player.injured')}: ${r.injury.kind}`} detail={`${t('player.returns')} ${date(dateInfo(r.injury.returnDay).iso)}`} /> : null}
      {r.suspended ? <Banner tone="warn" text={t('player.suspended')} /> : null}
      {r.loanFrom ? <Banner tone="info" text={t('player.onLoanFrom', { club: getWorld()?.clubs[r.loanFrom]?.name ?? '' })} /> : null}
      {data.listed ? <Banner tone="info" text={t('player.listedAt', { price: money(data.listed.askingPrice) })} /> : null}

      <Section title={t('player.actions')}>
        <View style={{ gap: spacing.sm }}>
          {own ? (
            <>
              <Button label={t('player.renew')} onPress={() => setSheet('renew')} testID="btn-renew" />
              <Button label={data.listed ? t('player.editListing') : t('player.listForTransfer')} variant="secondary" onPress={() => setSheet('list')} testID="btn-list" />
              <Button label={t('player.release')} variant="danger" onPress={() => setConfirmRelease(true)} testID="btn-release" />
            </>
          ) : free ? (
            <Button label={t('player.signFree')} onPress={() => setSheet('free')} testID="btn-sign-free" />
          ) : (
            <>
              <Button label={t('player.makeBid')} onPress={() => setSheet('bid')} testID="btn-bid" />
              <Button label={t('player.askLoan')} variant="secondary" onPress={() => setSheet('loan')} testID="btn-loan" />
            </>
          )}
        </View>
      </Section>

      <Card>
        <KeyValue label={t('player.value')} value={money(r.value)} />
        <KeyValue label={t('player.wage')} value={r.wageWeekly !== null ? wage(r.wageWeekly) : t('player.hidden')} />
        <KeyValue label={t('player.contractUntil')} value={r.contractEnd ? engineDate(r.contractEnd) : '–'} />
        {p.contract ? <KeyValue label={t('player.role')} value={td('role.squad.' + p.contract.role, p.contract.role)} /> : null}
        <KeyValue label={t('player.form')} value={num(r.form, 1)} />
        <KeyValue label={t('player.morale')} value={dig(r.morale)} />
        <KeyValue label={t('player.condition')} value={`${dig(100 - r.fatigue)}%`} />
      </Card>

      {p.traits.length ? (
        <Section title={t('player.traits')}><ChipRow>{p.traits.map((x) => <Chip key={x} label={td('trait.' + x, x)} />)}</ChipRow></Section>
      ) : null}

      <Section title={t('player.attributes')}>
        {!r.exact ? <Txt variant="caption" color="muted">{t('player.coarse')}</Txt> : null}
        {groups.map((g) => (
          <Card key={g} testID={`attrs-${g}`}>
            <Txt variant="bodyStrong">{t(`attr.group.${g}` as 'attr.group.technical')}</Txt>
            <View style={{ gap: spacing.sm }}>{p.attributes[g].map((a) => <AttrBar key={a.name} name={a.name} value={a.value} />)}</View>
          </Card>
        ))}
      </Section>

      <Section title={t('player.positions')}>
        <Card>
          {p.positions.map((x) => (
            <View key={x.position} style={{ gap: 2 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Txt variant="small">{td('pos.' + x.position, x.position)}</Txt>
                <Txt variant="small" num>{dig(Math.round(x.familiarity * 100))}% · {dig(x.rating)}</Txt>
              </View>
              <ProgressBar value={x.familiarity} height={6} />
            </View>
          ))}
        </Card>
      </Section>

      <Section title={t('player.history')}>
        <RowGroup testID="player-history">
          {p.history.length === 0 ? <Empty text={t('player.noHistory')} /> : [...p.history].reverse().map((h, i) => (
            <Row key={i} title={`${dig(seasonLabelOf(h.season))}${h.season === season ? ` (${t('player.current')})` : ''} · ${data.nameOf[h.clubId] ?? h.clubId}`}
              subtitle={`${t('player.apps')} ${dig(h.apps)} · ${t('player.goals')} ${dig(h.goals)} · ${t('player.assists')} ${dig(h.assists)} · ${t('player.avgRating')} ${h.apps ? num(h.ratingSum / h.apps, 2) : '–'}`} />
          ))}
        </RowGroup>
        <KeyValue label={t('player.career')} value={`${dig(p.career.apps)} / ${dig(p.career.goals)} / ${dig(p.career.assists)}`} />
      </Section>

      <Section title={t('player.transfers')}>
        <RowGroup testID="player-transfers">
          {p.transfers.length === 0 ? <Empty text={t('player.noTransfers')} /> : [...p.transfers].reverse().map((x, i) => (
            <Row key={i} title={`${x.from ?? t('player.freeAgent')} → ${x.to ?? t('player.freeAgent')}`} subtitle={`${engineDate(x.day)} · ${td('transfer.kind.' + x.kind, x.kind)}${x.fee ? ` · ${money(x.fee)}` : ''}`} />
          ))}
        </RowGroup>
      </Section>

      <TransferSheets kind={sheet} profile={p as PlayerProfile} onClose={() => setSheet(null)} />
      <Sheet visible={confirmRelease} title={t('player.releaseConfirm', { name: r.name })} onClose={() => setConfirmRelease(false)} testID="sheet-release"
        footer={<><Button label={t('player.release')} variant="danger" onPress={doRelease} testID="btn-confirm-release" /><Button label={t('common.cancel')} variant="secondary" onPress={() => setConfirmRelease(false)} /></>}>
        <Txt variant="body">{t('player.releaseWarn')}</Txt>
      </Sheet>
    </Screen>
  );
}
