/**
 * Structural pieces. Section boundaries in this design are 1px hairlines; the
 * header and tab bar use a 2px rule. Nothing has a radius and nothing has a
 * shadow, so structure is carried entirely by rules and fills — which makes it
 * worth having these as named parts rather than ad-hoc borders per screen.
 */

import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { motion, space } from '../theme/tokens';
import { usePalette } from '../theme/ThemeProvider';
import { Txt } from './Txt';
import { useReducedMotion } from './useReducedMotion';

/** 1px section divider. */
export function Rule({ strong = false, style }: { strong?: boolean; style?: StyleProp<ViewStyle> }) {
  const p = usePalette();
  return (
    <View
      style={[{ height: 1, backgroundColor: strong ? p.hairlineStrong : p.hairline }, style]}
    />
  );
}

/** The 2px rule under the header and above the tab bar. */
export function HeavyRule({ style }: { style?: StyleProp<ViewStyle> }) {
  const p = usePalette();
  return <View style={[{ height: 2, backgroundColor: p.rule }, style]} />;
}

/** 16px-gutter block with an optional hairline above it. */
export function Section({
  children,
  topRule = true,
  style,
}: {
  children: React.ReactNode;
  topRule?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <>
      {topRule ? <Rule /> : null}
      <View style={[styles.section, style]}>{children}</View>
    </>
  );
}

/** The heading that opens a block, with an optional action or note on the right. */
export function SectionHeader({
  title,
  action,
  onAction,
  style,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const p = usePalette();
  return (
    <View style={[styles.sectionHeader, style]}>
      <Txt role="section" style={styles.sectionTitle}>
        {title}
      </Txt>
      {action ? (
        <Pressable
          onPress={onAction}
          disabled={!onAction}
          accessibilityRole={onAction ? 'button' : undefined}
          hitSlop={{ top: 14, bottom: 14 }}
          style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Txt role="appMetaBold" color={onAction ? p.accentText : p.muted}>
            {action}
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}

/** A big tabular number over a tracked label — the app's unit of measure. */
export function StatBlock({
  value,
  label,
  size = 'stat30',
  color,
  labelColor,
  style,
}: {
  value: string;
  label: string;
  size?: 'stat40' | 'stat30' | 'stat24' | 'stat20';
  color?: string;
  labelColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={style}>
      <Txt role={size} color={color}>
        {value}
      </Txt>
      <Txt role="appLabel" color={labelColor} muted={!labelColor} style={styles.statLabel}>
        {label}
      </Txt>
    </View>
  );
}

/**
 * Content enter animation — `scin` in the prototype: opacity 0→1 with a 10px
 * rise, 300ms. Applied when a tab's content mounts.
 */
export function ScreenIn({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: reduced ? 0 : motion.screenIn,
      useNativeDriver: true,
    }).start();
  }, [t, reduced]);

  return (
    <Animated.View
      style={[
        {
          opacity: t,
          transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: { padding: space.section },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitle: { flexShrink: 1 },
  action: { paddingLeft: 12 },
  statLabel: { marginTop: 6 },
});
