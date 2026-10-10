import type { ReactNode } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Redirect } from 'expo-router';
import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../../state/gameStore';
import { useI18n } from '../../i18n/useI18n';
import { useTheme } from '../../theme/ThemeProvider';
import { Icon, type IconName } from '../../ui/Icon';
import { Txt } from '../../ui/Txt';
import type { TKey } from '../../i18n/translate';
import { MIN_TOUCH } from '../../theme/tokens';
import { haptic } from '../../platform/haptics';

const TABS: { name: string; label: TKey; icon: IconName; testID: string }[] = [
  { name: 'index', label: 'tab.home', icon: 'home', testID: 'tab-home' },
  { name: 'squad', label: 'tab.squad', icon: 'users', testID: 'tab-squad' },
  { name: 'fixtures', label: 'tab.fixtures', icon: 'calendar', testID: 'tab-fixtures' },
  { name: 'market', label: 'tab.market', icon: 'swap', testID: 'tab-market' },
  { name: 'more', label: 'tab.more', icon: 'menu', testID: 'tab-more' },
];

function TabBar({ state, navigation }: BottomTabBarProps): ReactNode {
  const th = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={{ flexDirection: 'row', backgroundColor: th.colors.surface, borderTopWidth: 1, borderTopColor: th.colors.border, paddingBottom: insets.bottom, paddingStart: insets.left, paddingEnd: insets.right }}
    >
      {state.routes.map((route, index) => {
        const def = TABS.find((x) => x.name === route.name);
        if (!def) return null;
        const focused = state.index === index;
        const color = focused ? th.colors.primaryText : th.colors.textMuted;
        return (
          <Pressable
            key={route.key}
            testID={def.testID}
            accessibilityRole="tab"
            accessibilityLabel={t(def.label)}
            accessibilityState={{ selected: focused }}
            aria-selected={focused}
            onPress={() => {
              const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !e.defaultPrevented) { haptic('selection'); navigation.navigate(route.name, route.params); }
            }}
            style={{ flex: 1, minHeight: MIN_TOUCH + 12, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 6 }}
          >
            <Icon name={def.icon} size={22} color={color} />
            <Txt variant="caption" color={color} align="center" numberOfLines={1} style={{ fontWeight: focused ? '700' : '500' }}>{t(def.label)}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout(): ReactNode {
  const hasWorld = useGame((s) => s.hasWorld);
  if (!hasWorld) return <Redirect href="/start" />;
  return (
    <Tabs tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false, lazy: true, animation: Platform.OS === 'web' ? 'none' : 'fade' }}>
      {TABS.map((tab) => <Tabs.Screen key={tab.name} name={tab.name} />)}
    </Tabs>
  );
}
