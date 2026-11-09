/**
 * Persistent 5-tab bar. Square-capped Lucide icons, so they share the app's zero
 * radius, over a short label. The active tab is the accent; nothing else moves.
 */

import {
  CalendarDays,
  ChartColumn,
  House,
  Newspaper,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePalette } from '../theme/ThemeProvider';
import { Txt } from './Txt';

const ICONS: Record<string, LucideIcon> = {
  index: House,
  runs: CalendarDays,
  stats: ChartColumn,
  feed: Newspaper,
  you: UserRound,
};

export interface TabItem {
  key: string;
  label: string;
  focused: boolean;
  onPress: () => void;
}

export function TabBar({ items }: { items: TabItem[] }) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 12);

  return (
    <View style={[styles.row, { backgroundColor: p.paper, borderTopColor: p.hairline }]}>
      {items.map((t) => {
        const Icon = ICONS[t.key];
        const color = t.focused ? p.accentText : p.muted;
        return (
          <Pressable
            key={t.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: t.focused }}
            accessibilityLabel={t.label}
            onPress={t.onPress}
            // The press area runs down through the inset, so a tap just below the
            // label still lands.
            style={({ pressed }) => [
              styles.tab,
              { paddingBottom: bottomPad, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            {Icon ? (
              <Icon
                size={23}
                color={color}
                strokeWidth={2.25}
                strokeLinecap="square"
                strokeLinejoin="miter"
              />
            ) : null}
            <Txt role="tabLabel" color={color}>
              {t.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, paddingTop: 10, alignItems: 'center', gap: 5 },
});
