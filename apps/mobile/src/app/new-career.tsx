import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { DataPackError, REAL_CLUBS_WITH_SQUADS, REAL_CLUB_NAMES, leagueIdsByCountry, squadSummary, LEAGUE_PROFILES } from '@fu/engine';
import { applyDataPackToPending, firstFreeSlot, generateWorldForSelection, importCrestsToPending, startCareer, useGame, notify } from '../state/gameStore';
import { pickImageFiles, pickTextFile } from '../core/files';
import type { CrestReport } from '../core/crestImport';
import { getPendingWorld, setPendingWorld } from '../state/worldHost';
import { useI18n } from '../i18n/useI18n';
import { useTheme } from '../theme/ThemeProvider';
import { Screen, Banner, Card, Row, RowGroup, Section, Spinner, ProgressBar, Empty } from '../ui/Layout';
import { Button, Field, Segmented } from '../ui/Controls';
import { Txt } from '../ui/Txt';
import { Crest } from '../ui/ClubVisuals';
import { spacing } from '../theme/tokens';

type Step = 'setup' | 'league' | 'club';

function randomSeed(): string {
  return `universe-${Math.floor(Math.random() * 90000 + 10000)}`;
}

export default function NewCareer(): ReactNode {
  const { t, money, num, dig } = useI18n();
  const th = useTheme();
  const router = useRouter();
  const busy = useGame((s) => s.busy);
  const slots = useGame((s) => s.slots);
  const [step, setStep] = useState<Step>('setup');
  const [seed, setSeed] = useState(randomSeed);
  const [preset, setPreset] = useState<'compact' | 'standard'>('compact');
  const [leagueId, setLeagueId] = useState<string | null>(null);
  const [clubId, setClubId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [generated, setGenerated] = useState(0); // bump to re-read the pending world
  const [packError, setPackError] = useState<{ text: string; detail?: string } | null>(null);
  const [crestReport, setCrestReport] = useState<CrestReport | null>(null);

  // The pending world is only meaningful while this screen is open (and is cleared by startCareer); free it when leaving.
  useEffect(() => () => setPendingWorld(null), []);
  const world = getPendingWorld();
  const noSlot = firstFreeSlot(slots) === null;

  const leagues = useMemo(() => {
    if (!world) return [];
    const q = filter.trim().toLowerCase();
    return leagueIdsByCountry(world)
      .filter((l) => !q || l.name.toLowerCase().includes(q) || l.country.toLowerCase().includes(q))
      .sort((a, b) => (a.id === 'SAU1' ? -1 : b.id === 'SAU1' ? 1 : a.tier - b.tier || a.country.localeCompare(b.country)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, filter, generated]);

  const clubs = useMemo(() => {
    if (!world || !leagueId) return [];
    const ids = world.leagueMembers[leagueId] ?? [];
    const list = ids.map((id) => world.clubs[id]).filter((c): c is NonNullable<typeof c> => !!c).sort((a, b) => b.reputation - a.reputation);
    return list.map((c, i) => ({ club: c, rank: i, sum: squadSummary(world, c.id) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, leagueId, generated]);

  const generate = async (): Promise<void> => {
    const s = seed.trim() || randomSeed();
    await generateWorldForSelection(s, preset);
    setGenerated((n) => n + 1);
    setLeagueId(null);
    setClubId(null);
    setPackError(null);
    setCrestReport(null);
    setStep('league');
  };

  /** Apply (or, with null, remove) a data pack on the pending world. On any failure the pending world is untouched and the reason is shown. */
  const applyPack = async (input: Parameters<typeof applyDataPackToPending>[0]): Promise<void> => {
    setPackError(null);
    setCrestReport(null); // rebuilding the pending world drops imported crests
    try {
      await applyDataPackToPending(input);
      setGenerated((n) => n + 1);
    } catch (e) {
      setPackError(e instanceof DataPackError ? { text: t('pack.invalid'), detail: e.message } : { text: t('pack.failed'), detail: (e as Error).message });
    }
  };

  const importPack = async (): Promise<void> => {
    let text: string | null;
    try {
      text = await pickTextFile();
    } catch (e) {
      setPackError({ text: t('pack.readFailed'), detail: (e as Error).message });
      return;
    }
    if (text === null) return; // cancelled
    await applyPack(text);
  };

  const importCrests = async (): Promise<void> => {
    setPackError(null);
    try {
      const files = await pickImageFiles();
      if (!files) return; // cancelled
      setCrestReport(importCrestsToPending(files));
      setGenerated((n) => n + 1);
    } catch (e) {
      setPackError({ text: t('pack.readFailed'), detail: (e as Error).message });
    }
  };

  const packChoice: 'none' | 'names' | 'squads' | 'custom' = !world?.dataPack || world.dataPack.id === 'user-crest-images' ? 'none'
    : world.dataPack.id === REAL_CLUB_NAMES.id ? 'names' : world.dataPack.id === REAL_CLUBS_WITH_SQUADS.id ? 'squads' : 'custom';
  const choosePack = (v: 'none' | 'names' | 'squads' | 'custom'): void => {
    if (busy === 'generating' || v === 'custom') return;
    if (v === 'none' && !world?.dataPack) return; // already fictional: keep imported state
    if (v !== 'none' && v === packChoice) return;
    void applyPack(v === 'none' ? null : v === 'names' ? REAL_CLUB_NAMES : REAL_CLUBS_WITH_SQUADS);
  };

  const begin = async (): Promise<void> => {
    if (!clubId) return;
    try {
      await startCareer(clubId);
      if (useGame.getState().hasWorld) router.replace('/');
    } catch (e) {
      notify('error', 'notice.saveFailed', undefined, (e as Error).message);
    }
  };

  const tierLabel = (rank: number, n: number): string => {
    const f = rank / Math.max(1, n - 1);
    return f < 0.2 ? t('career.tier.contender') : f < 0.6 ? t('career.tier.midTable') : t('career.tier.underdog');
  };

  return (
    <Screen title={t('career.title')} subtitle={t(step === 'setup' ? 'career.step1' : step === 'league' ? 'career.step2' : 'career.step3')} back testID="screen-new-career">
      {noSlot ? <Banner tone="warn" text={t('notice.noFreeSlot')} /> : null}
      {step === 'setup' ? (
        <>
          <Card>
            <Field label={t('career.seed')} value={seed} onChangeText={setSeed} autoCapitalize="none" autoCorrect={false} testID="input-seed" />
            <Txt variant="caption" color="muted">{t('career.seedHint')}</Txt>
            <Button label={t('career.randomSeed')} variant="ghost" small onPress={() => setSeed(randomSeed())} testID="btn-random-seed" />
          </Card>
          <Section title={t('career.preset')}>
            <Segmented
              label={t('career.preset')} value={preset} onChange={setPreset}
              options={[{ value: 'compact', label: t('career.compact'), testID: 'preset-compact' }, { value: 'standard', label: t('career.standard'), testID: 'preset-standard' }]}
            />
            <Txt variant="small" color="muted">{preset === 'compact' ? t('career.compactHint') : t('career.standardHint')}</Txt>
            {preset === 'standard' ? <Banner tone="warn" text={t('career.standardWarn')} testID="standard-warning" /> : null}
          </Section>
          {busy === 'generating' ? <Spinner label={t('career.generating')} /> : <Button label={t('career.generate')} icon="globe" onPress={generate} disabled={noSlot} testID="btn-generate" />}
        </>
      ) : null}

      {step === 'league' && world ? (
        <>
          <Section title={t('pack.title')}>
            <Card testID="pack-section">
              <Segmented
                label={t('pack.title')} value={packChoice} onChange={choosePack}
                options={[
                  { value: 'none', label: t('pack.choice.none'), testID: 'pack-choice-none' },
                  { value: 'names', label: t('pack.choice.names'), testID: 'pack-choice-names' },
                  { value: 'squads', label: t('pack.choice.squads'), testID: 'pack-choice-squads' },
                ]}
              />
              <Txt variant="caption" color="muted" testID="pack-choice-hint">{t(packChoice === 'names' ? 'pack.switchHint' : packChoice === 'squads' ? 'pack.hint.squads' : 'pack.hint.none')}</Txt>
              <Button label={t('pack.import')} variant="secondary" icon="save" onPress={importPack} disabled={busy === 'generating'} testID="btn-import-pack" />
              <Txt variant="caption" color="muted">{t('pack.importHint')}</Txt>
              <Button label={t('pack.crests.import')} variant="secondary" icon="plus" onPress={importCrests} disabled={busy === 'generating'} testID="btn-import-crests" />
              <Txt variant="caption" color="muted">{t('pack.crests.hint')}</Txt>
              {crestReport ? (
                <View style={{ gap: spacing.xs }} testID="crest-report">
                  <Txt variant="small" style={{ fontWeight: '700' }}>{t('pack.crests.result', { matched: dig(crestReport.matched), unmatched: dig(crestReport.unmatched), tooBig: dig(crestReport.tooBig), unsupported: dig(crestReport.unsupported) })}</Txt>
                  {crestReport.matched === 0 ? <Txt variant="small">{t('pack.crests.none')}</Txt> : null}
                  {crestReport.unmatchedFiles.length ? <Txt variant="caption" color="muted">{t('pack.crests.unmatchedNames', { names: crestReport.unmatchedFiles.slice(0, 5).join(', ') })}</Txt> : null}
                  {crestReport.tooBigFiles.length ? <Txt variant="caption" color="muted">{t('pack.crests.tooBigNames', { names: crestReport.tooBigFiles.slice(0, 5).join(', ') })}</Txt> : null}
                </View>
              ) : null}
              {busy === 'generating' ? <Spinner label={t('pack.applying')} /> : null}
              {packError ? <Banner tone="error" text={packError.text} detail={packError.detail} testID="pack-error" /> : null}
              <PackSummary />
            </Card>
          </Section>
          <Field search label={t('career.searchLeague')} value={filter} onChangeText={setFilter} testID="input-league-filter" />
          <Txt variant="caption" color="muted" testID="league-count">{t('career.leagueCount', { n: dig(leagues.length), clubs: dig(Object.keys(world.clubs).length) })}</Txt>
          <RowGroup>
            {leagues.length === 0 ? <Empty text={t('common.noResults')} /> : null}
            {leagues.map((l) => {
              const prof = LEAGUE_PROFILES.find((p) => p.id === l.id);
              return (
                <Row
                  key={l.id} testID={`league-${l.id}`} title={l.name} subtitle={`${l.country} · ${t('career.tier', { n: dig(l.tier) })} · ${dig((world.leagueMembers[l.id] ?? []).length)} ${t('common.clubs')}${prof?.confederation ? ` · ${prof.confederation}` : ''}`}
                  chevron onPress={() => { setLeagueId(l.id); setClubId(null); setStep('club'); }}
                />
              );
            })}
          </RowGroup>
          <Button label={t('career.back')} variant="ghost" onPress={() => setStep('setup')} />
        </>
      ) : null}

      {step === 'club' && world && leagueId ? (
        <>
          {world.dataPack ? <Txt variant="caption" color="muted" testID="club-pack-note">{t('pack.applied', { name: world.dataPack.name })} · {t('pack.remainder')}</Txt> : null}
          <Txt variant="small" color="muted">{t('career.clubHint')}</Txt>
          <RowGroup>
            {clubs.map(({ club, rank, sum }) => (
              <Row
                key={club.id} testID={`club-${club.id}`} selected={clubId === club.id}
                left={<Crest clubId={club.id} name={club.name} size={40} colors={club.colors} crest={club.crest ?? null} />}
                title={club.name}
                subtitle={`${tierLabel(rank, clubs.length)} · ${t('club.reputation')} ${dig(club.reputation)} · ${t('career.cash')} ${money(club.finance.cash)} · ${t('career.squadAvg')} ${num(sum.avgOverall, 1)}`}
                onPress={() => setClubId(club.id)}
                right={clubId === club.id ? <Txt variant="small" color="primary">✓</Txt> : undefined}
              />
            ))}
          </RowGroup>
          {clubId ? (
            <Card accent={th.colors.primary}>
              <ClubBrief clubId={clubId} />
            </Card>
          ) : null}
          <View style={{ gap: spacing.sm }}>
            {busy === 'starting' ? <Spinner label={t('career.starting')} /> : <Button label={t('career.start')} icon="play" onPress={begin} disabled={!clubId || noSlot} testID="btn-start-career" />}
            <Button label={t('career.back')} variant="ghost" onPress={() => setStep('league')} testID="btn-career-back" />
          </View>
        </>
      ) : null}
      {step !== 'setup' && !world ? <Empty text={t('common.noResults')} /> : null}
    </Screen>
  );

  function PackSummary(): ReactNode {
    const dp = getPendingWorld()?.dataPack;
    if (!dp) return <Txt variant="small" color="muted" testID="pack-none">{t('pack.noneApplied')}</Txt>;
    const a = dp.applied;
    return (
      <View style={{ gap: spacing.xs }} testID="pack-applied">
        <Txt variant="small" style={{ fontWeight: '700' }}>{t('pack.applied', { name: dp.name })}</Txt>
        <Txt variant="small" testID="pack-counts">{t('pack.counts', { clubs: dig(a.clubs), players: dig(a.players), managers: dig(a.managers), crests: dig(a.crests), competitions: dig(a.competitions ?? 0) })}</Txt>
        <Txt variant="small">{t('pack.remainder')}</Txt>
        <Txt variant="caption" color="muted">{t('pack.source', { source: dp.source })}</Txt>
        <Txt variant="caption" color="muted">{t('pack.licence', { licence: dp.licence })}</Txt>
        <Txt variant="caption" color="muted">{t('pack.unofficial')}</Txt>
      </View>
    );
  }

  function ClubBrief({ clubId: id }: { clubId: string }): ReactNode {
    const w = getPendingWorld();
    const c = w?.clubs[id];
    if (!w || !c) return null;
    return (
      <View style={{ gap: spacing.xs }}>
        <Txt variant="title">{c.name}</Txt>
        <Txt variant="small" color="muted">{c.city} · {c.stadium.name} ({num(c.stadium.capacity)})</Txt>
        <Txt variant="small">{t('club.reputation')}</Txt>
        <ProgressBar value={c.reputation / 100} label={t('club.reputation')} />
        <Txt variant="small" color="muted">{t('career.budget', { transfer: money(c.finance.transferBudget), wage: money(c.finance.wageBudgetWeekly) })}</Txt>
      </View>
    );
  }
}
