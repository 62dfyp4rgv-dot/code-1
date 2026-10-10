/**
 * Haptic feedback via expo-haptics. Every call is a safe no-op on web, when the user turned haptics off in Settings,
 * and when the native module is unavailable or throws (e.g. a simulator without a Taptic Engine). Never awaited by callers.
 */
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSettings } from '../state/settings';

export type HapticKind = 'selection' | 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function haptic(kind: HapticKind): void {
  if (Platform.OS === 'web') return;
  if (!useSettings.getState().haptics) return;
  try {
    let p: Promise<void>;
    switch (kind) {
      case 'selection': p = Haptics.selectionAsync(); break;
      case 'light': p = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
      case 'medium': p = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
      case 'heavy': p = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break;
      case 'success': p = Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
      case 'warning': p = Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); break;
      case 'error': p = Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); break;
    }
    void p.catch(() => undefined);
  } catch {
    /* haptics are decoration only */
  }
}
