/**
 * Buttons — README.md "Typography": the label is left-aligned with the trailing
 * glyph pushed right (`space-between`), never centred.
 *
 * Primary carries the accent gradient. When the member is already committed to a
 * run it inverts to the near-black "committed" gradient with a ✓ — same button,
 * different state, so the RSVP reads as one control that flipped rather than two
 * controls that swapped.
 */

import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { OccurrenceStatus } from '../data/types';
import { t } from '../i18n';
import { gradients } from '../theme/tokens';
import { usePalette } from '../theme/ThemeProvider';
import { Gradient } from './Gradient';
import { Txt } from './Txt';

export interface PrimaryButtonProps {
  label: string;
  /** Right-hand glyph — "→" by default, "✓" when committed. */
  trailing?: string;
  /** Inverts to the near-black fill. */
  committed?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
  /** 13px is the default; the compact variants use 12. */
  size?: 'md' | 'sm';
  /** Trailing content that is a value rather than a glyph, e.g. the pace group. */
  trailingTabular?: boolean;
}

export function PrimaryButton({
  label,
  trailing = '→',
  committed = false,
  onPress,
  disabled = false,
  full = true,
  style,
  size = 'md',
  trailingTabular = false,
}: PrimaryButtonProps) {
  const colors = committed ? gradients.committed : gradients.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: committed }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        full ? styles.full : null,
        { opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      <Gradient colors={colors} style={size === 'md' ? styles.padMd : styles.padSm}>
        <Txt role={size === 'md' ? 'button13' : 'button12'} color="#ffffff" style={styles.flexLabel}>
          {label}
        </Txt>
        {trailing ? (
          <Txt
            role={trailingTabular ? 'stat15' : size === 'md' ? 'button13' : 'button12'}
            color="#ffffff"
          >
            {trailing}
          </Txt>
        ) : null}
      </Gradient>
    </Pressable>
  );
}

export interface SecondaryButtonProps {
  label: string;
  trailing?: string;
  onPress?: () => void;
  disabled?: boolean;
  /** On the black auth screens the border is a white alpha rather than ink. */
  onDark?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SecondaryButton({
  label,
  trailing,
  onPress,
  disabled,
  onDark = false,
  style,
}: SecondaryButtonProps) {
  const p = usePalette();
  const border = onDark ? 'rgba(255,255,255,0.28)' : 'transparent';
  const fg = onDark ? '#f2f2f4' : p.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.full,
        styles.padSecondary,
        { borderColor: border, backgroundColor: onDark ? 'transparent' : p.raised, opacity: disabled ? 0.45 : pressed ? 0.7 : 1 },
        style,
      ]}
    >
      <Txt role="button12" color={fg} style={styles.flexLabel}>
        {label}
      </Txt>
      {trailing ? (
        <Txt role="button12" color={fg}>
          {trailing}
        </Txt>
      ) : null}
    </Pressable>
  );
}

/**
 * The small state chip on run rows. A cancelled or changed run says so first,
 * because that matters more than whether you joined it.
 */
export function StateChip({
  going,
  label,
  status,
}: {
  going: boolean;
  label?: string;
  status?: OccurrenceStatus;
}) {
  const p = usePalette();

  if (status === 'cancelled' || status === 'moved') {
    return (
      <View style={[styles.chip, { borderWidth: 1, borderColor: p.accentText }]}>
        <Txt role="chip" color={p.accentText}>
          {t(status === 'cancelled' ? 'run.cancelled' : 'run.moved')}
        </Txt>
      </View>
    );
  }

  const text = label ?? t(going ? 'run.in' : 'run.rsvp');

  if (going) {
    return (
      <Gradient colors={gradients.primary} style={styles.chip}>
        <Txt role="chip" color="#ffffff">
          {text}
        </Txt>
      </Gradient>
    );
  }

  return (
    <View style={[styles.chip, { backgroundColor: p.raised }]}>
      <Txt role="chip">{text}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { width: '100%' },
  flexLabel: { flex: 1 },
  padMd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 14,
  },
  padSm: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  padSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
