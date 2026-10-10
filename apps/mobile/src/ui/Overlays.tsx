import { useEffect, type ReactNode } from 'react';
import { Modal, View } from 'react-native';
import { useGame, dismissNotice, cancelSim } from '../state/gameStore';
import { useI18n } from '../i18n/useI18n';
import { useTheme } from '../theme/ThemeProvider';
import { dateInfo } from '@fu/engine';
import { radii, spacing } from '../theme/tokens';
import { Banner, ProgressBar } from './Layout';
import { Button } from './Controls';
import { Txt } from './Txt';

export function NoticeHost(): ReactNode {
  const notice = useGame((s) => s.notice);
  const { t } = useI18n();
  useEffect(() => {
    if (!notice || notice.tone === 'error') return;
    const id = setTimeout(dismissNotice, 9000);
    return () => clearTimeout(id);
  }, [notice]);
  if (!notice) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: 8, start: 8, end: 8, zIndex: 100, alignItems: 'center' }}>
      <View style={{ width: '100%', maxWidth: 720 }}>
        <Banner testID="notice" tone={notice.tone} text={t(notice.key, notice.params)} detail={notice.detail} onDismiss={dismissNotice} />
      </View>
    </View>
  );
}

/** Blocking progress dialog while a simulation runs. Cancel stops after the current day. */
export function SimOverlay(): ReactNode {
  const sim = useGame((s) => s.sim);
  const { t, dig, date, num } = useI18n();
  const th = useTheme();
  if (!sim) return null;
  const info = dateInfo(sim.day);
  const target = sim.daysTarget;
  const frac = target ? sim.daysDone / target : sim.plan.kind === 'nextMatchday' ? Math.min(0.9, sim.daysDone / 7) : 0;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={cancelSim}>
      <View style={{ flex: 1, backgroundColor: th.colors.overlay, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, direction: th.rtl ? 'rtl' : 'ltr' }} testID="sim-overlay">
        <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 420, backgroundColor: th.colors.surface, borderRadius: radii.lg, padding: spacing.xl, gap: spacing.md }}>
          <Txt variant="h2" accessibilityRole="header">{t('sim.running')}</Txt>
          <Txt variant="body" color="muted" testID="sim-date">{date(info.iso)} · {t('home.season')} {dig(info.seasonLabel)}</Txt>
          <ProgressBar value={frac} label={t('sim.progress')} height={10} />
          <Txt variant="small" color="muted" num testID="sim-stats">{t('sim.stats', { days: dig(sim.daysDone), matches: num(sim.matchesPlayed) })}</Txt>
          <Button label={sim.cancelled ? t('sim.cancelling') : t('common.cancel')} variant="secondary" onPress={cancelSim} disabled={sim.cancelled} testID="sim-cancel" />
        </View>
      </View>
    </Modal>
  );
}
