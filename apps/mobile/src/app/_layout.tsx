import { useEffect, type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LocaleProvider, Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { useSettings } from '../state/settings';
import { boot, notify, useGame } from '../state/gameStore';
import { applyDirection } from '../platform/direction';
import { useAutosaveOnBackground } from '../platform/useAppLifecycle';
import { NoticeHost, SimOverlay } from '../ui/Overlays';
import { Spinner } from '../ui/Layout';
import { AppErrorBoundary } from '../ui/ErrorBoundary';

export { AppErrorBoundary as ErrorBoundary };

const PUBLIC_ROUTES = ['/start', '/new-career', '/saves', '/settings', '/about'];

function Shell(): ReactNode {
  const th = useTheme();
  const booted = useGame((s) => s.booted);
  const loaded = useSettings((s) => s.loaded);
  const hasWorld = useGame((s) => s.hasWorld);
  const language = useSettings((s) => s.language);
  const pathname = usePathname();
  const router = useRouter();
  useAutosaveOnBackground();

  useEffect(() => { void boot(); }, []);

  useEffect(() => {
    const needsRestart = applyDirection(th.rtl, language);
    if (needsRestart) notify('info', 'notice.restartForRtl');
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.title = 'Football Universe';
  }, [th.rtl, language]);

  // Without a loaded career only the start/save/settings routes make sense (e.g. after a browser reload on /squad).
  useEffect(() => {
    if (booted && loaded && !hasWorld && !PUBLIC_ROUTES.includes(pathname)) router.replace('/start');
  }, [booted, loaded, hasWorld, pathname, router]);

  if (!booted || !loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: th.colors.bg, alignItems: 'center', justifyContent: 'center' }} testID="boot-splash">
        <Spinner label="Football Universe" />
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: th.colors.bg, direction: th.rtl ? 'rtl' : 'ltr' }}>
      <StatusBar style={th.isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: th.colors.bg } }} />
      <NoticeHost />
      <SimOverlay />
    </View>
  );
}

export default function RootLayout(): ReactNode {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedLocale />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedLocale(): ReactNode {
  const th = useTheme();
  return (
    <LocaleProvider direction={th.rtl ? 'rtl' : 'ltr'}>
      <Shell />
    </LocaleProvider>
  );
}

