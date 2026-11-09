/**
 * Settings rows.
 *
 * The handoff has no switches anywhere and no radius at all, so a stock
 * platform Switch would be the only rounded thing in the app. These reuse the
 * shapes the design already establishes: a square mark for on/off, and the
 * label-left / value-right row from the profile screen.
 */

import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { brand, space } from '../theme/tokens';
import { usePalette } from '../theme/ThemeProvider';
import { Txt } from './Txt';

/** Label on the left, muted value on the right. Tappable when onPress is given. */
export function SettingRow({
  label,
  value,
  onPress,
  trailing,
  danger = false,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  /** Draws a chevron on rows that lead somewhere. */
  trailing?: boolean;
  danger?: boolean;
}) {
  const p = usePalette();

  const body = (
    <>
      <Txt role="rowTitle" color={danger ? p.accentText : undefined}>
        {label}
      </Txt>
      <View style={styles.valueSlot}>
        {value ? (
          <Txt role="appBody" muted numberOfLines={1}>
            {value}
          </Txt>
        ) : null}
        {trailing ? (
          <ChevronRight
            size={18}
            color={p.muted}
            strokeWidth={2.5}
            strokeLinecap="square"
            style={styles.trailing}
          />
        ) : null}
      </View>
    </>
  );

  if (!onPress) {
    return <View style={[styles.row, { borderBottomColor: p.hairline }]}>{body}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: p.hairline, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      {body}
    </Pressable>
  );
}

/** A row that toggles — square mark, accent fill and a ✓ when on. */
export function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  const p = usePalette();

  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: p.hairline, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <View style={styles.toggleText}>
        <Txt role="rowTitle">{label}</Txt>
        {description ? (
          <Txt role="appMeta" muted style={styles.description}>
            {description}
          </Txt>
        ) : null}
      </View>

      <View
        style={[
          styles.mark,
          {
            backgroundColor: value ? brand.accent : p.raised,
          },
        ]}
      >
        {value ? (
          <Txt role="listTitle12" color="#ffffff" style={styles.tick}>
            ✓
          </Txt>
        ) : null}
      </View>
    </Pressable>
  );
}

/** A titled block of settings. */
export function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Txt role="section" style={styles.sectionTitle}>
        {title}
      </Txt>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    paddingVertical: 14,
    paddingHorizontal: space.gutter,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  valueSlot: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  trailing: { marginLeft: 8 },
  toggleText: { flex: 1 },
  description: { marginTop: 3 },
  mark: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: { fontSize: 12, lineHeight: 14 },
  section: { paddingTop: space.block },
  sectionTitle: { paddingHorizontal: space.gutter, marginBottom: 8 },
});
