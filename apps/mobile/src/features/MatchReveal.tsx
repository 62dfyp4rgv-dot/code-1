import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, View } from 'react-native';
import type { MatchView } from '@fu/engine';
import { useI18n } from '../i18n/useI18n';
import { useTheme } from '../theme/ThemeProvider';
import { radii, spacing } from '../theme/tokens';
import { Card } from '../ui/Layout';
import { Button } from '../ui/Controls';
import { Txt } from '../ui/Txt';
import { Icon } from '../ui/Icon';
import { Crest } from '../ui/ClubVisuals';
import { usePulse, useReduceMotion } from '../ui/Motion';
import { haptic } from '../platform/haptics';
import { buildTimeline, minuteLabel, scoreAfter, visibleCount, type TLItem } from './matchTimeline';

export type Phase = 'idle' | 'playing' | 'done';

interface Props {
  mv: MatchView | null;
  homeId: string; awayId: string; homeName: string; awayName: string;
  /** Authoritative final score text from the engine (e.g. "2-1", "1-1 aet"), or "–". */
  finalScore: string;
  /** Which side the human manages (drives the haptic / emphasis for own goals vs conceded). */
  humanSide: 'home' | 'away' | null;
  autoPlay: boolean;
  onOpenClub: (id: string) => void;
  /** Reports the reveal phase so the screen can hide spoilers (summary, goals) while the match is being replayed. */
  onPhase?: (p: Phase) => void;
}

/** Total real-time length of the reveal; stoppages (goals/cards) add short holds on top. */
const PLAY_MS = 9000;
const TICK_MS = 50;
const native = Platform.OS !== 'web';

/**
 * Score in *visual* order. In RTL the home side sits on the right (crests mirror), so the numbers are swapped and laid out as three
 * separate left-to-right flex items; no single run of mixed digits/dash text ever reaches the bidi algorithm (which reorders
 * Arabic-Indic digits unpredictably).
 */
export function ScoreText({ h, a, rtl, variant = 'display', sep = ' - ', testID, color }: { h: string; a: string; rtl: boolean; variant?: 'display' | 'h2' | 'caption' | 'small'; sep?: string; testID?: string; color?: string }): ReactNode {
  const [l, r] = rtl ? [a, h] : [h, a];
  return (
    <View testID={testID} style={{ flexDirection: 'row', direction: 'ltr', alignItems: 'baseline', justifyContent: 'center' }}>
      <Txt variant={variant} num color={color} align="center">{l}</Txt>
      <Txt variant={variant} num color={color} align="center">{sep}</Txt>
      <Txt variant={variant} num color={color} align="center">{r}</Txt>
    </View>
  );
}

function Moment({ item, mine, homeName, awayName }: { item: TLItem; mine: boolean | null; homeName: string; awayName: string }): ReactNode {
  const th = useTheme();
  const { t, td, dig, rtl } = useI18n();
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) { v.setValue(1); return; }
    Animated.timing(v, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: native }).start();
  }, [v, reduce]);
  const c = th.colors;
  const team = item.side === 'home' ? homeName : awayName;
  const anim = { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] };
  if (item.kind === 'halftime' || item.kind === 'fulltime' || item.kind === 'extraTime' || item.kind === 'kickoff') {
    const label = t(item.kind === 'halftime' ? 'match.halftime' : item.kind === 'fulltime' ? 'match.fulltime' : item.kind === 'extraTime' ? 'match.extraTime' : 'match.kickoff');
    return (
      <Animated.View style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 }, anim]} accessible accessibilityLabel={`${label}, ${item.score[0]} - ${item.score[1]}`}>
        <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
        <Txt variant="caption" color="muted" style={{ fontWeight: '700' }}>{label}</Txt>
        {item.kind === 'kickoff' ? null : <ScoreText h={dig(item.score[0])} a={dig(item.score[1])} rtl={rtl} variant="caption" color={c.textMuted} />}
        <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
      </Animated.View>
    );
  }
  const goal = item.kind === 'goal';
  const title = goal ? t('match.goal') : t(item.kind === 'yellow' ? 'match.card.yellow' : item.kind === 'red' ? 'match.card.red' : 'match.card.secondYellow');
  const sub = goal ? `${team}${item.detail ? ` · ${td('goal.kind.' + item.detail, item.detail)}` : ''}` : team;
  return (
    <Animated.View
      accessible accessibilityLabel={`${minuteLabel(item)} ${title}, ${item.player ?? ''}, ${sub}${goal ? `, ${item.score[0]} - ${item.score[1]}` : ''}`}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radii.md, backgroundColor: goal && mine ? c.highlight : c.surface, borderWidth: 1, borderColor: goal ? (mine === false ? c.danger : c.success) : c.border, minHeight: 56 }, anim]}
    >
      <Txt variant="bodyStrong" num style={{ minWidth: 40 }} color="muted">{minuteLabel(item)}</Txt>
      {goal ? <Icon name="ball" size={24} color={mine === false ? c.danger : c.success} /> : (
        <View style={{ width: 16, height: 22, borderRadius: 3, backgroundColor: item.kind === 'red' ? '#D32F2F' : '#F2C318', borderWidth: item.kind === 'secondYellow' ? 3 : 0, borderColor: '#D32F2F' }} />
      )}
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong" numberOfLines={1}>{goal ? `${item.player ?? ''}` : `${item.player ?? title}`}</Txt>
        <Txt variant="caption" color="muted" numberOfLines={1}>{goal ? `${title} · ${sub}` : `${title} · ${sub}`}</Txt>
      </View>
      {goal ? <ScoreText h={dig(item.score[0])} a={dig(item.score[1])} rtl={rtl} variant="h2" sep="-" /> : null}
    </Animated.View>
  );
}

/**
 * Scoreboard card with an optional animated match reveal: the clock runs 0 → full-time in ~9 s, the score ticks up at each
 * goal (with a spring pulse + haptic), and goals/cards slide into a "key moments" feed. Reduce Motion skips straight to
 * full-time. The result is never hidden: the final score is the engine's, the reveal only re-presents the recorded events.
 */
export function MatchReveal({ mv, homeId, awayId, homeName, awayName, finalScore, humanSide, autoPlay, onOpenClub, onPhase }: Props): ReactNode {
  const th = useTheme();
  const { t, dig, rtl } = useI18n();
  const c = th.colors;
  const tl = useMemo(() => (mv ? buildTimeline(mv) : { items: [], endClock: 90 }), [mv]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [paused, setPaused] = useState(false);
  const [clock, setClock] = useState(0);
  const [shown, setShown] = useState(0);
  const clockRef = useRef(0);
  const holdRef = useRef(0);
  const shownRef = useRef(0);
  const pausedRef = useRef(false);
  const startedAuto = useRef(false);
  pausedRef.current = paused;
  useEffect(() => { onPhase?.(autoPlay && phase === 'idle' && !startedAuto.current ? 'playing' : phase); }, [phase, autoPlay, onPhase]);

  const finish = useCallback((fromPlay: boolean) => {
    clockRef.current = tl.endClock;
    shownRef.current = tl.items.length;
    setClock(tl.endClock);
    setShown(tl.items.length);
    setPhase('done');
    setPaused(false);
    if (fromPlay) {
      const [h, a] = finalScore.match(/^(\d+)-(\d+)/)?.slice(1).map(Number) ?? [0, 0];
      const mine = humanSide === 'home' ? [h, a] : humanSide === 'away' ? [a, h] : null;
      haptic(!mine ? 'medium' : (mine[0] as number) > (mine[1] as number) ? 'success' : (mine[0] as number) < (mine[1] as number) ? 'warning' : 'light');
    }
  }, [tl, finalScore, humanSide]);

  const start = useCallback(() => {
    void AccessibilityInfo.isReduceMotionEnabled().catch(() => false).then((r) => {
      if (r) { finish(false); return; }
      clockRef.current = 0; shownRef.current = 0; holdRef.current = 500;
      setClock(0); setShown(0); setPaused(false); setPhase('playing');
    });
  }, [finish]);

  useEffect(() => {
    if (autoPlay && mv && !startedAuto.current) { startedAuto.current = true; start(); }
  }, [autoPlay, mv, start]);

  useEffect(() => {
    if (phase !== 'playing') return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const dt = now - last;
      last = now;
      if (pausedRef.current) return;
      if (holdRef.current > 0) { holdRef.current -= dt; return; }
      const prev = shownRef.current;
      let next = clockRef.current + (dt * tl.endClock) / PLAY_MS;
      let v = visibleCount(tl.items, next);
      if (v > prev + 1) { v = prev + 1; next = (tl.items[prev] as TLItem).clock; } // reveal one moment at a time
      if (v > prev) {
        const item = tl.items[v - 1] as TLItem;
        next = Math.max(next, item.clock);
        holdRef.current = item.kind === 'goal' ? 1300 : item.kind === 'halftime' ? 700 : 450;
        const mine = humanSide ? item.side === humanSide : null;
        if (item.kind === 'goal') {
          haptic(mine === null ? 'medium' : mine ? 'success' : 'warning');
          if (item.player) AccessibilityInfo.announceForAccessibility(t('match.announceGoal', { team: item.side === 'home' ? homeName : awayName, player: item.player, m: dig(item.minute), score: `${item.score[0]} - ${item.score[1]}` }));
        } else if (item.kind === 'red' || item.kind === 'secondYellow') haptic('heavy');
        else if (item.kind === 'yellow') haptic('light');
      }
      clockRef.current = next;
      shownRef.current = v;
      setClock(next);
      setShown(v);
      if (next >= tl.endClock && v >= tl.items.length) finish(true);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [phase, tl, humanSide, homeName, awayName, dig, t, finish]);

  const live = phase === 'playing';
  const showFeed = phase !== 'idle';
  const [rh, ra] = live ? scoreAfter(tl.items, shown) : phase === 'done' ? (finalScore.match(/^(\d+)-(\d+)/)?.slice(1).map(Number) as [number, number] | undefined) ?? scoreAfter(tl.items, tl.items.length) : [0, 0];
  const base = /^(\d+)-(\d+)/.exec(finalScore);
  const pulse = usePulse(live ? `${rh}-${ra}` : 'static');
  const minute = Math.min(Math.floor(clock), tl.endClock);
  const frac = Math.min(1, clock / tl.endClock);
  const mineOf = (i: TLItem): boolean | null => (humanSide ? i.side === humanSide : null);
  const pensNote = mv?.fixture.pens ?? null;

  return (
    <View style={{ gap: spacing.md }}>
      <Card>
        <View style={{ alignItems: 'center', minHeight: 22 }}>
          {live ? (
            <View accessible accessibilityLabel={`${t('match.live')} ${dig(minute)}'`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 99, backgroundColor: c.surfaceAlt }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.danger }} />
              <Txt variant="caption" color="danger" style={{ fontWeight: '800' }}>{t('match.live')}</Txt>
              <Txt variant="caption" num testID="match-clock" style={{ fontWeight: '700' }}>{dig(minute)}'</Txt>
            </View>
          ) : phase === 'done' || mv ? (
            <Txt variant="caption" color="muted" style={{ fontWeight: '700' }} testID="match-ft">{t('match.ft')}</Txt>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
          <Pressable accessibilityRole="button" accessibilityLabel={homeName} onPress={() => onOpenClub(homeId)} style={{ flex: 1, alignItems: 'center', gap: 4, minHeight: 44 }}>
            <Crest clubId={homeId} name={homeName} size={52} />
            <Txt variant="small" align="center" numberOfLines={2} style={{ fontWeight: '600' }}>{homeName}</Txt>
          </Pressable>
          <View style={{ alignItems: 'center', minWidth: 96 }}>
            <Animated.View style={{ transform: [{ scale: pulse }] }} accessible accessibilityLiveRegion={live ? 'none' : 'polite'} accessibilityLabel={phase === 'idle' ? t('match.scoreLabel', { home: homeName, away: awayName, h: base ? dig(Number(base[1])) : '–', a: base ? dig(Number(base[2])) : '–' }) : t('match.scoreLabel', { home: homeName, away: awayName, h: dig(rh), a: dig(ra) })}>
              {phase === 'idle' ? (base ? <ScoreText testID="match-score" h={dig(Number(base[1]))} a={dig(Number(base[2]))} rtl={rtl} /> : <Txt variant="display" testID="match-score">–</Txt>) : <ScoreText testID="match-score" h={dig(rh)} a={dig(ra)} rtl={rtl} />}
            </Animated.View>
            {pensNote ? <Txt variant="small" color="muted">{pensNote}</Txt> : null}
            {phase !== 'playing' && finalScore.includes('aet') ? <Txt variant="caption" color="muted">{t('match.extraTime')}</Txt> : null}
            <Txt variant="caption" color="muted" align="center">{mv ? mv.fixture.stage : ''}</Txt>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={awayName} onPress={() => onOpenClub(awayId)} style={{ flex: 1, alignItems: 'center', gap: 4, minHeight: 44 }}>
            <Crest clubId={awayId} name={awayName} size={52} />
            <Txt variant="small" align="center" numberOfLines={2} style={{ fontWeight: '600' }}>{awayName}</Txt>
          </Pressable>
        </View>

        {showFeed ? (
          <View accessible accessibilityRole="progressbar" accessibilityLabel={t('match.progress')} accessibilityValue={{ min: 0, max: 100, now: Math.round(frac * 100) }} style={{ height: 26, justifyContent: 'center', direction: 'ltr' }} testID="match-track">
            <View style={{ height: 6, borderRadius: 3, backgroundColor: c.surfaceAlt, overflow: 'hidden' }}>
              <View style={{ width: `${frac * 100}%`, height: '100%', backgroundColor: c.primary }} />
            </View>
            <View style={{ position: 'absolute', left: `${(45 / tl.endClock) * 100}%`, width: 2, height: 14, marginLeft: -1, backgroundColor: c.border }} />
            {tl.items.slice(0, shown).filter((i) => i.kind === 'goal' || i.kind === 'red' || i.kind === 'secondYellow').map((i) => (
              <View key={i.key} style={{ position: 'absolute', left: `${Math.min(100, (i.clock / tl.endClock) * 100)}%`, marginLeft: -7, width: 14, height: 14, borderRadius: i.kind === 'goal' ? 7 : 3, backgroundColor: i.kind === 'goal' ? (i.side === 'home' ? c.primary : c.info) : c.danger, borderWidth: 2, borderColor: c.surface }} />
            ))}
          </View>
        ) : null}

        {mv ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {live ? (
              <>
                <Button label={paused ? t('match.resume') : t('match.pause')} variant="secondary" icon={paused ? 'play' : 'stop'} onPress={() => setPaused((p) => !p)} style={{ flex: 1 }} fit testID="match-pause" />
                <Button label={t('match.skip')} variant="secondary" onPress={() => finish(false)} style={{ flex: 1.4 }} fit testID="match-skip" />
              </>
            ) : (
              <Button label={phase === 'done' ? t('match.replay') : t('match.watch')} variant={phase === 'done' ? 'ghost' : 'secondary'} icon="play" onPress={start} block testID="match-watch" />
            )}
          </View>
        ) : null}
      </Card>

      {showFeed && tl.items.length ? (
        <View style={{ gap: spacing.sm }} testID="match-feed">
          <Txt variant="title" accessibilityRole="header">{t('match.keyMoments')}</Txt>
          {tl.items.slice(0, shown).filter((i) => i.kind !== 'kickoff').map((i) => (
            <Moment key={i.key} item={i} mine={mineOf(i)} homeName={homeName} awayName={awayName} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
