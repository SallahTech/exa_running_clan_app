/**
 * The app shell: persistent header, the five-tab content region, the tab bar,
 * and the run-detail sheet layered over all of it.
 *
 * Two rules from the handoff live here rather than in any screen: opening a run
 * sheet doesn't change tabs, and changing tabs closes the sheet.
 */

import { Tabs, usePathname, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { RunSheet } from '@/screens/RunSheet';
import { useClan } from '@/state/ClanProvider';
import { usePalette } from '@/theme/ThemeProvider';
import { AppHeader } from '@/ui/AppHeader';
import { TabBar, type TabItem } from '@/ui/TabBar';
import { t } from '@/i18n';

const TABS = [
  { name: 'index', label: 'tab.home', path: '/(tabs)' },
  { name: 'runs', label: 'tab.runs', path: '/(tabs)/runs' },
  { name: 'stats', label: 'tab.stats', path: '/(tabs)/stats' },
  { name: 'feed', label: 'tab.feed', path: '/(tabs)/feed' },
  { name: 'you', label: 'tab.you', path: '/(tabs)/you' },
] as const;

export default function TabsLayout() {
  const p = usePalette();
  const router = useRouter();
  const pathname = usePathname();
  const { me, closeRun } = useClan();

  const items: TabItem[] = TABS.map((tab) => ({
    key: tab.name,
    label: t(tab.label),
    focused: tab.name === 'index' ? pathname === '/' : pathname === `/${tab.name}`,
    onPress: () => {
      closeRun();
      router.navigate(tab.path as never);
    },
  }));

  return (
    <View style={[styles.root, { backgroundColor: p.paper }]}>
      <AppHeader initials={me?.initials ?? '··'} />

      <Tabs
        tabBar={() => <TabBar items={items} />}
        screenOptions={{
          headerShown: false,
          animation: 'none',
          sceneStyle: { backgroundColor: p.paper },
        }}
      >
        <Tabs.Screen name="index" options={{ title: t('tab.home') }} />
        <Tabs.Screen name="runs" options={{ title: t('tab.runs') }} />
        <Tabs.Screen name="stats" options={{ title: t('tab.stats') }} />
        <Tabs.Screen name="feed" options={{ title: t('tab.feed') }} />
        <Tabs.Screen name="you" options={{ title: t('tab.you') }} />
      </Tabs>

      {/* Above the tab bar — the sheet covers 80% of the screen, tab bar included. */}
      <RunSheet />
    </View>
  );
}

const styles = StyleSheet.create({
  // The sheet is parked off-screen at translateY(104%) when closed. Native
  // clips that; the web renderer counts it as scrollable overflow and gives the
  // whole page a second scrollbar, so clip it here.
  root: { flex: 1, overflow: 'hidden' },
});
