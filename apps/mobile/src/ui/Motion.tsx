import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, type StyleProp, type ViewStyle } from 'react-native';

const native = Platform.OS !== 'web';

/** True when the OS asks for reduced motion (always false until the async query resolves, which is fine for decoration). */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { if (alive) setReduce(!!v); }).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => setReduce(!!v));
    return () => { alive = false; sub.remove(); };
  }, []);
  return reduce;
}

/** Fades and slides its children up on mount. Respects Reduce Motion. */
export function FadeIn({ children, delay = 0, distance = 10, duration = 260, style }: { children?: ReactNode; delay?: number; distance?: number; duration?: number; style?: StyleProp<ViewStyle> }): ReactNode {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) { v.setValue(1); return; }
    const a = Animated.timing(v, { toValue: 1, duration, delay, easing: Easing.out(Easing.cubic), useNativeDriver: native });
    a.start();
    return () => a.stop();
  }, [v, reduce, delay, duration]);
  return (
    <Animated.View style={[{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }] }, style]}>
      {children}
    </Animated.View>
  );
}

/** Springs a value change (e.g. a score) with a short scale pulse. */
export function usePulse(trigger: unknown): Animated.Value {
  const scale = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    scale.setValue(1.35);
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: native }).start();
  }, [trigger, scale]);
  return scale;
}
