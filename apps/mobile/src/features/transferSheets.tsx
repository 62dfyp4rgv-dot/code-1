import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import {
  bidForPlayer, bidLoan, financeView, isWindowOpen, listForTransfer, offerRenewal, signFreeAgentAction, suggestTerms, unlistFromTransfer, windowDaysLeft,
  type ActionResult, type BidOutcome, type PlayerProfile, type WorldState,
} from '@fu/engine';
import { useI18n } from '../i18n/useI18n';
import { mutate } from '../state/gameStore';
import { getWorld } from '../state/worldHost';
import { SAR_PER_EUR, parseNumber } from '../core/format';
import { eurToMillions, millionsToEur } from './squadUtils';
import { Sheet } from '../ui/Sheet';
import { Banner, KeyValue } from '../ui/Layout';
import { Button, Field, Stepper } from '../ui/Controls';
import { Txt } from '../ui/Txt';
import type { TKey } from '../i18n/translate';

export type SheetKind = 'bid' | 'loan' | 'free' | 'renew' | 'list' | 'release' | null;

function useRate(): number {
  const { prefs } = useI18n();
  return prefs.currency === 'SAR' ? SAR_PER_EUR : 1;
}

export function OutcomeBanner({ outcome, onAcceptCounter, onRaiseWage }: { outcome: BidOutcome | null; onAcceptCounter?: (fee: number) => void; onRaiseWage?: (w: number) => void }): ReactNode {
  const { t, money, wage } = useI18n();
  if (!outcome) return null;
  const tone = outcome.status === 'completed' ? 'success' : outcome.status === 'counter' ? 'info' : 'warn';
  const text = t(`outcome.${outcome.status}` as TKey);
  return (
    <Banner
      testID={`outcome-${outcome.status}`} tone={tone} text={text}
      detail={[outcome.reason, outcome.counterFee ? `${t('outcome.counterFee')}: ${money(outcome.counterFee, { compact: false })}` : null, outcome.demandedWage ? `${t('outcome.demandedWage')}: ${wage(outcome.demandedWage)}` : null].filter(Boolean).join(' · ') || undefined}
      action={
        outcome.status === 'counter' && outcome.counterFee && onAcceptCounter ? <Button small label={t('outcome.acceptCounter')} onPress={() => onAcceptCounter(outcome.counterFee as number)} testID="btn-accept-counter" />
        : outcome.status === 'rejectedByPlayer' && outcome.demandedWage && onRaiseWage ? <Button small label={t('outcome.raiseWage')} onPress={() => onRaiseWage(outcome.demandedWage as number)} testID="btn-raise-wage" /> : undefined
      }
    />
  );
}

interface Props { kind: SheetKind; profile: PlayerProfile; onClose: () => void }

export function TransferSheets({ kind, profile, onClose }: Props): ReactNode {
  const { t, money, prefs, wage } = useI18n();
  const rate = useRate();
  const id = profile.row.id;
  const unit = prefs.currency === 'SAR' ? 'SAR' : 'EUR';
  const w = getWorld();
  const humanId = w?.config.humanClubId ?? null;
  const club = humanId ? w?.clubs[humanId] : undefined;
  const fin = useMemo(() => (w && humanId ? financeView(w, humanId) : null), [w, humanId, kind]);
  const windowOpen = !!(w && club && isWindowOpen(w, club));
  const left = w && club ? windowDaysLeft(w, club) : 0;

  const [fee, setFee] = useState('0');
  const [wk, setWk] = useState('0');
  const [years, setYears] = useState(3);
  const [share, setShare] = useState(50);
  const [weeks, setWeeks] = useState(26);
  const [ask, setAsk] = useState('0');
  const [outcome, setOutcome] = useState<BidOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Prefill from the engine's suggested terms whenever a sheet opens.
  useEffect(() => {
    setOutcome(null);
    setError(null);
    if (!kind || !w) return;
    const s = suggestTerms(w, id);
    if (s.ok) {
      setFee(String(eurToMillions(s.value.fee, rate)));
      setWk(String(Math.round((s.value.wageWeekly * rate) / 1000)));
      setYears(s.value.years);
    }
    if (kind === 'renew') {
      const cur = profile.contract?.wageWeekly ?? 0;
      setWk(String(Math.round(((cur * 1.1) * rate) / 1000)));
    }
    if (kind === 'list') setAsk(String(eurToMillions(profile.row.value * 1.2, rate)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, id]);

  const feeEur = (): number => millionsToEur(parseNumber(fee), rate);
  const wageEur = (): number => Math.round((parseNumber(wk) * 1000) / rate);
  const apply = (fn: (x: WorldState) => ActionResult<BidOutcome> | ActionResult): void => {
    const res = mutate(fn);
    if (!res.ok) { setError(res.error); setOutcome(null); return; }
    setError(null);
    setOutcome((res.value as BidOutcome | undefined) ?? { status: 'completed' });
  };
  const validNumbers = (needFee: boolean): boolean => {
    if (needFee && !(parseNumber(fee) >= 0)) { setError(t('sheet.invalidNumber')); return false; }
    if (!(parseNumber(wk) > 0)) { setError(t('sheet.invalidNumber')); return false; }
    return true;
  };

  const common = (needFee: boolean): ReactNode => (
    <>
      {needFee ? <Field label={t('sheet.fee', { unit })} value={fee} onChangeText={setFee} keyboardType="decimal-pad" testID="input-fee" /> : null}
      <Field label={t('sheet.wage', { unit })} value={wk} onChangeText={setWk} keyboardType="decimal-pad" testID="input-wage" />
      <Stepper label={t('sheet.years')} value={years} min={1} max={5} onChange={setYears} testID="stepper-years" />
    </>
  );
  const budget = fin ? (
    <View>
      <KeyValue label={t('finance.transferBudget')} value={money(fin.transferBudget)} />
      <KeyValue label={t('finance.wageBudget')} value={wage(fin.wageBudgetWeekly)} />
      <KeyValue label={t('player.value')} value={money(profile.row.value)} />
    </View>
  ) : null;
  const windowNote = !windowOpen ? <Banner tone="warn" text={t('market.windowClosed')} /> : <Txt variant="caption" color="muted">{t('market.windowOpen', { n: left })}</Txt>;
  const err = error ? <Banner tone="error" text={error} testID="sheet-error" /> : null;

  if (kind === 'bid') {
    return (
      <Sheet visible title={t('sheet.bidTitle', { name: profile.row.name })} onClose={onClose} testID="sheet-bid"
        footer={outcome?.status === 'completed' ? <Button label={t('common.done')} onPress={onClose} testID="btn-sheet-done" /> : <Button label={t('sheet.submitBid')} onPress={() => { if (validNumbers(true)) apply((x) => bidForPlayer(x, id, feeEur(), wageEur(), years)); }} disabled={!windowOpen} testID="btn-submit-bid" />}>
        {windowNote}{budget}{common(true)}{err}
        <OutcomeBanner outcome={outcome}
          onAcceptCounter={(f) => { setFee(String(eurToMillions(f, rate))); apply((x) => bidForPlayer(x, id, f, wageEur(), years)); }}
          onRaiseWage={(wg) => { setWk(String(Math.ceil((wg * rate) / 1000))); }} />
      </Sheet>
    );
  }
  if (kind === 'free') {
    return (
      <Sheet visible title={t('sheet.freeTitle', { name: profile.row.name })} onClose={onClose} testID="sheet-free"
        footer={outcome?.status === 'completed' ? <Button label={t('common.done')} onPress={onClose} /> : <Button label={t('sheet.submitOffer')} onPress={() => { if (validNumbers(false)) apply((x) => signFreeAgentAction(x, id, wageEur(), years)); }} testID="btn-submit-free" />}>
        {budget}{common(false)}{err}
        <OutcomeBanner outcome={outcome} onRaiseWage={(wg) => setWk(String(Math.ceil((wg * rate) / 1000)))} />
      </Sheet>
    );
  }
  if (kind === 'loan') {
    return (
      <Sheet visible title={t('sheet.loanTitle', { name: profile.row.name })} onClose={onClose} testID="sheet-loan"
        footer={outcome?.status === 'completed' ? <Button label={t('common.done')} onPress={onClose} /> : <Button label={t('sheet.submitLoan')} onPress={() => apply((x) => bidLoan(x, id, share / 100, x.day + weeks * 7))} disabled={!windowOpen} testID="btn-submit-loan" />}>
        {windowNote}
        <Stepper label={t('sheet.parentShare')} value={share} min={0} max={100} step={10} onChange={setShare} format={(v) => `${v}%`} testID="stepper-share" />
        <Stepper label={t('sheet.loanWeeks')} value={weeks} min={8} max={40} step={4} onChange={setWeeks} testID="stepper-weeks" />
        {err}<OutcomeBanner outcome={outcome} />
      </Sheet>
    );
  }
  if (kind === 'renew') {
    const cur = profile.contract;
    return (
      <Sheet visible title={t('sheet.renewTitle', { name: profile.row.name })} onClose={onClose} testID="sheet-renew"
        footer={outcome?.status === 'completed' ? <Button label={t('common.done')} onPress={onClose} /> : <Button label={t('sheet.submitOffer')} onPress={() => { if (validNumbers(false)) apply((x) => offerRenewal(x, id, wageEur(), years)); }} testID="btn-submit-renew" />}>
        {cur ? <KeyValue label={t('player.currentWage')} value={wage(cur.wageWeekly)} /> : null}
        {common(false)}{err}
        <OutcomeBanner outcome={outcome} onRaiseWage={(wg) => setWk(String(Math.ceil((wg * rate) / 1000)))} />
      </Sheet>
    );
  }
  if (kind === 'list') {
    const listed = !!w?.transferList[id];
    return (
      <Sheet visible title={t('sheet.listTitle', { name: profile.row.name })} onClose={onClose} testID="sheet-list"
        footer={<>
          <Button label={t('sheet.listPlayer')} onPress={() => { const p = parseNumber(ask); if (!(p >= 0)) { setError(t('sheet.invalidNumber')); return; } apply((x) => listForTransfer(x, id, millionsToEur(p, rate))); }} testID="btn-submit-list" />
          {listed ? <Button label={t('sheet.unlist')} variant="secondary" onPress={() => { mutate((x) => unlistFromTransfer(x, id)); onClose(); }} testID="btn-unlist" /> : null}
        </>}>
        <Field label={t('sheet.askingPrice', { unit })} value={ask} onChangeText={setAsk} keyboardType="decimal-pad" testID="input-ask" />
        {err}{outcome ? <Banner tone="success" text={t('sheet.listed')} testID="outcome-listed" /> : null}
      </Sheet>
    );
  }
  return null;

}
