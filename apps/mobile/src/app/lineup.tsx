import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { clubView, formationOf, positionalOverall, setLineup, squadView, type Position } from '@fu/engine';
import { useHumanClubId, useWorldQuery } from '../state/queries';
import { mutate } from '../state/gameStore';
import { getWorld } from '../state/worldHost';
import { useI18n } from '../i18n/useI18n';
import { Screen, Banner, Row, RowGroup, Section, Spinner, Empty } from '../ui/Layout';
import { Button } from '../ui/Controls';
import { Sheet } from '../ui/Sheet';
import { Txt } from '../ui/Txt';
import { RatingPill, PosBadge } from '../ui/ClubVisuals';
import { FormationPitch } from '../features/FormationPitch';
import { spacing } from '../theme/tokens';
import { suggestXi } from '../features/lineupUtils';

function fit(id: string, pos: Position): number {
  const p = getWorld()?.players[id];
  return p ? Math.round(positionalOverall(p, pos)) : 0;
}

export default function LineupScreen(): ReactNode {
  const { t, td, dig } = useI18n();
  const id = useHumanClubId();
  const data = useWorldQuery('lineup', [id], (w) => {
    if (!id) return null;
    const c = clubView(w, id);
    return c ? { formation: c.tactics.formation, squad: squadView(w, id), override: w.clubs[id]?.lineupOverride ?? null } : null;
  });
  const [xi, setXi] = useState<(string | null)[] | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const slots = useMemo(() => (data ? formationOf(data.formation).slots : []), [data]);
  useEffect(() => {
    if (data && !xi) setXi(data.override && data.override.length === slots.length ? [...data.override] : suggestXi(slots, data.squad, fit));
  }, [data, xi, slots]);
  if (!data || !xi) return <Screen back title={t('nav.lineup')}><Spinner /></Screen>;
  const byId = new Map(data.squad.map((p) => [p.id, p]));
  const nameOf = (pid: string | null): string => (pid ? (byId.get(pid)?.name.split(' ').slice(-1)[0] ?? '?') : '—');
  const complete = xi.every((x) => x !== null);
  const choose = (pid: string): void => {
    if (slot === null) return;
    const next = [...xi];
    const existing = next.indexOf(pid);
    if (existing >= 0) next[existing] = next[slot] ?? null; // swap places
    next[slot] = pid;
    setXi(next);
    setMsg(null);
    setSlot(null);
  };
  const apply = (): void => {
    const res = mutate((w) => setLineup(w, xi as string[]));
    setMsg(res.ok ? { tone: 'success', text: t('lineup.saved') } : { tone: 'error', text: res.error });
  };
  const auto = (): void => {
    const res = mutate((w) => setLineup(w, null));
    setXi(suggestXi(slots, data.squad, fit));
    setMsg(res.ok ? { tone: 'success', text: t('lineup.auto') } : { tone: 'error', text: res.error });
  };
  const candidates = slot === null ? [] : [...data.squad].sort((a, b) => fit(b.id, slots[slot] as Position) - fit(a.id, slots[slot] as Position));
  return (
    <Screen back title={t('nav.lineup')} subtitle={`${data.formation} · ${data.override ? t('lineup.manual') : t('lineup.automatic')}`} testID="screen-lineup">
      <Txt variant="small" color="muted">{t('lineup.hint')}</Txt>
      <FormationPitch testID="lineup-pitch" slots={slots} selected={slot} onSelect={setSlot} items={slots.map((p, i) => ({ pos: p, label: td('pos.' + p, p), sub: nameOf(xi[i] ?? null) }))} height={400} />
      <Section title={t('lineup.xi')}>
        <RowGroup testID="lineup-list">
          {slots.map((p, i) => {
            const pl = xi[i] ? byId.get(xi[i] as string) : undefined;
            return <Row key={i} testID={`lineup-slot-${i}`} title={pl?.name ?? t('lineup.empty')} subtitle={td('pos.' + p, p)} chevron onPress={() => setSlot(i)}
              right={pl ? <RatingPill value={fit(pl.id, p)} label={t('lineup.fit')} /> : undefined} />;
          })}
        </RowGroup>
      </Section>
      {msg ? <Banner tone={msg.tone} text={msg.text} testID="lineup-msg" /> : null}
      <View style={{ gap: spacing.sm }}>
        <Button label={t('lineup.apply')} icon="check" onPress={apply} disabled={!complete} testID="btn-apply-lineup" />
        <Button label={t('lineup.useAuto')} variant="secondary" onPress={auto} testID="btn-auto-lineup" />
      </View>
      <Sheet visible={slot !== null} title={slot !== null ? `${td('pos.' + slots[slot], slots[slot] as string)} — ${t('lineup.pick')}` : ''} onClose={() => setSlot(null)} testID="sheet-pick">
        {candidates.length === 0 ? <Empty text={t('common.noResults')} /> : (
          <RowGroup>
            {candidates.map((p) => (
              <Row key={p.id} testID={`pick-${p.id}`} title={p.name} selected={slot !== null && xi[slot] === p.id}
                subtitle={`${td('pos.' + p.position, p.position)}${p.injury ? ' · ' + t('player.injured') : ''}${p.suspended ? ' · ' + t('player.suspended') : ''}${xi.includes(p.id) ? ' · ' + t('lineup.inXi') : ''} · ${t('player.condition')} ${dig(100 - p.fatigue)}%`}
                left={<PosBadge pos={p.position} label={td('pos.' + p.position, p.position)} />}
                right={<RatingPill value={slot !== null ? fit(p.id, slots[slot] as Position) : p.ability} label={t('lineup.fit')} />} onPress={() => choose(p.id)} />
            ))}
          </RowGroup>
        )}
      </Sheet>
    </Screen>
  );
}
