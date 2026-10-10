import { I18nManager, Platform } from 'react-native';

/**
 * Apply layout direction.
 *  - Web: set `dir`/`lang` on <html>; browsers + react-native-web then mirror flex rows and logical (start/end) styles.
 *  - Native: the root view also gets a `direction` style so a language switch re-lays-out immediately; additionally
 *    `I18nManager.forceRTL` is set so that native widgets (scroll indicators, text selection handles, alerts) follow the
 *    direction after the NEXT app restart. Returns true when such a restart is advisable.
 */
export function applyDirection(rtl: boolean, lang: string): boolean {
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', lang);
    }
    return false;
  }
  try {
    I18nManager.allowRTL(true);
    if (I18nManager.isRTL !== rtl) {
      I18nManager.forceRTL(rtl);
      return true;
    }
  } catch {
    /* some runtimes (Expo Go on certain devices) refuse; layout still follows the root direction style */
  }
  return false;
}
