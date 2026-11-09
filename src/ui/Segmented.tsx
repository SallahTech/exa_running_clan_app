/**
 * Segmented controls. Two shapes, one rule: the active segment carries the
 * accent gradient with a white label, the inactive ones sit on a filled track
 * with a muted label.
 *
 *   <Segmented>      WEEKLY / RACES on the Schedule screen.
 *   <PaceSelector>   the pace groups, shared between the profile screen and
 *                    the run sheet. Optionally shows "N running" under each.
 */

import { Pressable, StyleSheet, View } from 'react-native';

import { PACE_GROUPS, paceShort, type PaceGroup } from '../data/types';
import { gradients, type Palette } from '../theme/tokens';
import { usePalette } from '../theme/ThemeProvider';
import { Gradient } from './Gradient';
import { Txt } from './Txt';
import { t } from '../i18n';

export interface SegmentedProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const p = usePalette();

  return (
    <View
      style={[styles.container, { backgroundColor: p.surface }]}
      accessibilityRole="tablist"
    >
      {options.map((o) => {
        const active = o.value === value;
        const inner = (
          <Txt role="button11" color={active ? '#ffffff' : p.muted}>
            {o.label}
          </Txt>
        );

        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={({ pressed }) => [styles.segment, { opacity: pressed ? 0.75 : 1 }]}
          >
            {active ? (
              <Gradient colors={gradients.primary} style={styles.segmentInner}>
                {inner}
              </Gradient>
            ) : (
              <View style={styles.segmentInner}>{inner}</View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const containerFill = (p: Palette) => (p.scheme === 'dark' ? p.raised : p.surface);

export interface PaceSelectorProps {
  value: PaceGroup;
  onChange: (value: PaceGroup) => void;
  /** Per-group RSVP counts — shown under each pace in the run sheet only. */
  counts?: Partial<Record<PaceGroup, number>>;
}

export function PaceSelector({ value, onChange, counts }: PaceSelectorProps) {
  const p = usePalette();

  return (
    <View
      style={[styles.container, { backgroundColor: containerFill(p) }]}
    >
      {PACE_GROUPS.map((g) => {
        const active = g === value;
        const count = counts?.[g];

        const inner = (
          <>
            <Txt role="stat15" color={active ? '#ffffff' : p.text} style={styles.paceLabel}>
              {paceShort(g)}
            </Txt>
            {count !== undefined ? (
              <Txt
                role="appMeta"
                color={active ? 'rgba(255,255,255,0.85)' : p.muted}
                style={styles.paceCount}
                numberOfLines={1}
              >
                {count}
              </Txt>
            ) : null}
          </>
        );

        return (
          <Pressable
            key={g}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${g === 'open' ? t('pace.ownLong') : t('pace.groupLabel', { pace: g })}${count !== undefined ? `, ${t('pace.running', { n: count })}` : ''}`}
            onPress={() => onChange(g)}
            style={({ pressed }) => [styles.segment, { opacity: pressed ? 0.75 : 1 }]}
          >
            {active ? (
              <Gradient
                colors={gradients.primary}
                style={[styles.paceInner, counts ? styles.paceTall : null]}
              >
                {inner}
              </Gradient>
            ) : (
              <View
                style={[
                  styles.paceInner,
                  counts ? styles.paceTall : null,
                ]}
              >
                {inner}
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 3, padding: 3 },
  segment: { flex: 1 },
  segmentInner: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paceInner: {
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paceTall: { minHeight: 56 },
  paceLabel: { fontSize: 15 },
  paceCount: { marginTop: 3 },
});
