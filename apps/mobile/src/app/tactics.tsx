import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { FORMATIONS, ROLES, archetypeTactics, clubView, defaultTactics, formationOf, setTactics, validateTactics, type Tactics, type TacticalArchetype } from '@fu/engine';
import { useHumanClubId, useWorldQuery } from '../state/queries';
import { mutate } from '../state/gameStore';
import { useI18n } from '../i18n/useI18n';
import { Screen, Card, Section, Banner, Row, RowGroup, Spinner } from '../ui/Layout';
import { Button, Chip, ChipRow, Segmented, Slider, Switch, Stepper } from '../ui/Controls';
import { Sheet } from '../ui/Sheet';
import { Txt } from '../ui/Txt';
import { FormationPitch } from '../features/FormationPitch';
import { useRouter } from 'expo-router';
import { spacing } from '../theme/tokens';

const ARCHETYPES: TacticalArchetype[] = ['balanced', 'possession', 'counter', 'highPress', 'lowBlock', 'direct'];

export default function TacticsScreen(): ReactNode {
  const { t, td, dig } = useI18n();
  const router = useRouter();
  const id = useHumanClubId();
  const current = useWorldQuery('tactics', [id], (w) => (id ? clubView(w, id)?.tactics ?? null : null));
  const [draft, setDraft] = useState<Tactics | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);
  useEffect(() => { if (current && !draft) setDraft({ ...current, roles: [...current.roles] }); }, [current, draft]);
  const errors = useMemo(() => (draft ? validateTactics(draft) : []), [draft]);
  if (!draft) return <Screen back title={t('nav.tactics')}><Spinner /></Screen>;
  const fm = formationOf(draft.formation);
  const change = (patch: Partial<Tactics>): void => { setDraft({ ...draft, ...patch }); setSaved(false); setEngineError(null); };
  const pickFormation = (f: string): void => { const base = defaultTactics(f); change({ formation: f, roles: base.roles }); setSlot(null); };
  const apply = (): void => {
    const res = mutate((w) => setTactics(w, draft));
    if (res.ok) { setSaved(true); setEngineError(null); } else { setSaved(false); setEngineError(res.error); }
  };
  const roleName = (rid: string): string => td('role.' + rid, ROLES[rid]?.name ?? rid);
  const slotRoles = slot !== null ? Object.values(ROLES).filter((r) => r.positions.includes(fm.slots[slot] as never)) : [];
  const dirty = JSON.stringify(draft) !== JSON.stringify(current);
  return (
    <Screen back title={t('nav.tactics')} subtitle={`${draft.formation} · ${t('tactics.mentality.' + draft.mentality as 'tactics.mentality.0')}`} testID="screen-tactics">
      <Section title={t('tactics.formation')}>
        <ChipRow>{Object.keys(FORMATIONS).map((f) => <Chip key={f} label={f} selected={f === draft.formation} onPress={() => pickFormation(f)} testID={`formation-${f}`} />)}</ChipRow>
      </Section>
      <FormationPitch testID="pitch" slots={fm.slots} selected={slot} onSelect={setSlot}
        items={fm.slots.map((p, i) => ({ pos: p, label: td('pos.' + p, p), sub: roleName(draft.roles[i] ?? '') }))} />
      <Section title={t('tactics.roles')}>
        <Txt variant="caption" color="muted">{t('tactics.roleHint')}</Txt>
        <RowGroup testID="role-list">
          {fm.slots.map((p, i) => (
            <Row key={i} testID={`role-slot-${i}`} title={`${td('pos.' + p, p)} · ${roleName(draft.roles[i] ?? '')}`} subtitle={t(`tactics.duty.${ROLES[draft.roles[i] ?? '']?.duty ?? 'support'}` as 'tactics.duty.support')} chevron onPress={() => setSlot(i)} />
          ))}
        </RowGroup>
      </Section>
      <Section title={t('tactics.presets')}>
        <ChipRow>{ARCHETYPES.map((a) => <Chip key={a} label={t(`tactics.preset.${a}` as 'tactics.preset.balanced')} onPress={() => { change(archetypeTactics(a, draft.formation)); }} testID={`preset-${a}`} />)}</ChipRow>
      </Section>
      <Card>
        <Slider label={t('tactics.tempo')} value={draft.tempo} onChange={(v) => change({ tempo: v })} lowLabel={t('tactics.tempo.lo')} highLabel={t('tactics.tempo.hi')} testID="slider-tempo" />
        <Slider label={t('tactics.width')} value={draft.width} onChange={(v) => change({ width: v })} lowLabel={t('tactics.width.lo')} highLabel={t('tactics.width.hi')} testID="slider-width" />
        <Slider label={t('tactics.directness')} value={draft.directness} onChange={(v) => change({ directness: v })} lowLabel={t('tactics.directness.lo')} highLabel={t('tactics.directness.hi')} testID="slider-directness" />
        <Slider label={t('tactics.pressing')} value={draft.pressing} onChange={(v) => change({ pressing: v })} lowLabel={t('tactics.pressing.lo')} highLabel={t('tactics.pressing.hi')} testID="slider-pressing" />
        <Slider label={t('tactics.line')} value={draft.defensiveLine} onChange={(v) => change({ defensiveLine: v })} lowLabel={t('tactics.line.lo')} highLabel={t('tactics.line.hi')} testID="slider-line" />
      </Card>
      <Section title={t('tactics.mentality')}>
        <Segmented<number> label={t('tactics.mentality')} value={draft.mentality} onChange={(v) => change({ mentality: v as Tactics['mentality'] })}
          options={[-2, -1, 0, 1, 2].map((m) => ({ value: m, label: t(`tactics.mentality.${m}` as 'tactics.mentality.0'), testID: `mentality-${m}` }))} />
      </Section>
      <Card>
        <Switch label={t('tactics.counter')} hint={t('tactics.counter.hint')} value={draft.counterAttack} onChange={(v) => change({ counterAttack: v })} testID="switch-counter" />
        <Switch label={t('tactics.adaptive')} hint={t('tactics.adaptive.hint')} value={draft.adaptive} onChange={(v) => change({ adaptive: v })} testID="switch-adaptive" />
        <Stepper label={t('tactics.maxSubs')} value={draft.maxSubs} min={0} max={9} onChange={(v) => change({ maxSubs: v })} format={dig} testID="stepper-subs" />
      </Card>
      <Section title={t('tactics.marking')}>
        <Segmented<Tactics['marking']> label={t('tactics.marking')} value={draft.marking} onChange={(v) => change({ marking: v })}
          options={(['zonal', 'man', 'mixed'] as const).map((m) => ({ value: m, label: t(`tactics.marking.${m}` as 'tactics.marking.zonal'), testID: `marking-${m}` }))} />
      </Section>
      <Section title={t('tactics.setPieces')}>
        <Segmented<Tactics['setPieceFocus']> label={t('tactics.setPieces')} value={draft.setPieceFocus} onChange={(v) => change({ setPieceFocus: v })}
          options={(['near', 'far', 'short', 'mixed'] as const).map((m) => ({ value: m, label: t(`tactics.sp.${m}` as 'tactics.sp.near'), testID: `sp-${m}` }))} />
      </Section>
      {errors.length ? <Banner tone="error" text={t('tactics.invalid')} detail={errors.join('; ')} testID="tactics-errors" /> : null}
      {engineError ? <Banner tone="error" text={t('tactics.rejected')} detail={engineError} testID="tactics-engine-error" /> : null}
      {saved ? <Banner tone="success" text={t('tactics.saved')} testID="tactics-saved" /> : null}
      <View style={{ gap: spacing.sm }}>
        <Button label={t('tactics.apply')} onPress={apply} disabled={errors.length > 0 || !dirty} testID="btn-apply-tactics" icon="check" />
        <Button label={t('nav.lineup')} variant="secondary" onPress={() => router.push('/lineup')} />
      </View>

      <Sheet visible={slot !== null} title={slot !== null ? `${td('pos.' + fm.slots[slot], fm.slots[slot] as string)} — ${t('tactics.pickRole')}` : ''} onClose={() => setSlot(null)} testID="sheet-role">
        <RowGroup>
          {slotRoles.map((r) => (
            <Row key={r.id} testID={`role-${r.id}`} title={roleName(r.id)} subtitle={t(`tactics.duty.${r.duty}` as 'tactics.duty.support')} selected={slot !== null && draft.roles[slot] === r.id}
              onPress={() => { if (slot === null) return; const roles = [...draft.roles]; roles[slot] = r.id; change({ roles }); setSlot(null); }} />
          ))}
        </RowGroup>
      </Sheet>
    </Screen>
  );
}
