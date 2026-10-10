import type { ReactNode } from 'react';
import { View } from 'react-native';
import { dateInfo, type PlayerRow } from '@fu/engine';
import { useI18n } from '../i18n/useI18n';
import { useTheme } from '../theme/ThemeProvider';
import { Row, ProgressBar } from '../ui/Layout';
import { Txt } from '../ui/Txt';
import { Avatar, PosBadge, RatingPill } from '../ui/ClubVisuals';
import { getWorld } from '../state/worldHost';

export function PlayerListRow({ r, onPress }: { r: PlayerRow; onPress: () => void }): ReactNode {
  const { t, td, dig, engineDate, date } = useI18n();
  const th = useTheme();
  const w = getWorld();
  const listed = w?.transferList[r.id];
  const status = r.injury
    ? `${t('player.injured')}: ${r.injury.kind} (${t('player.returns')} ${date(dateInfo(r.injury.returnDay).iso, true)})`
    : r.suspended ? t('player.suspended') : null;
  return (
    <Row
      testID={`player-${r.id}`}
      title={r.name}
      left={<Avatar name={r.name} size={38} />}
      subtitle={[`${r.nationality} · ${dig(r.age)} ${t('player.yrs')}`, r.contractEnd ? `${t('player.contract')} ${engineDate(r.contractEnd)}` : null, r.loanFrom ? t('player.onLoan') : null, listed ? t('player.listed') : null].filter(Boolean).join(' · ')}
      onPress={onPress}
      accessibilityLabel={`${r.name}, ${td('pos.' + r.position, r.position)}, ${t('player.ability')} ${r.ability}${status ? ', ' + status : ''}`}
      right={
        <View style={{ alignItems: 'flex-end', gap: 4, minWidth: 64 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <PosBadge pos={r.position} label={td('pos.' + r.position, r.position)} />
            <RatingPill value={r.exact ? r.ability : `~${r.ability}`} label={t('player.ability')} />
          </View>
          {status ? <Txt variant="caption" color={r.injury ? 'danger' : 'warning'} numberOfLines={1} style={{ maxWidth: 120 }}>{r.injury ? t('player.injured') : t('player.suspended')}</Txt>
            : <View style={{ width: 64 }}><ProgressBar value={1 - r.fatigue / 100} color={r.fatigue > 60 ? th.colors.danger : r.fatigue > 30 ? th.colors.warning : th.colors.success} label={t('player.condition')} height={5} /></View>}
        </View>
      }
    />
  );
}

