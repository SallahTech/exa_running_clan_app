/**
 * The three animated data marks on the Stats screen. Each animates once on
 * mount, from zero — never on every re-render, so a background refetch doesn't
 * make the screen twitch.
 *
 *   ProgressRing      104px, 9px stroke, accent→accent-deep on a raised track
 *   WeeklyBars        8 bars, fill from the bottom, 45ms stagger
 *   LeaderboardBar    3px proportional bar under each row
 */

import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { brand, gradients, motion } from '../theme/tokens';
import { usePalette } from '../theme/ThemeProvider';
import { Gradient } from './Gradient';
import { Txt } from './Txt';
import { useReducedMotion } from './useReducedMotion';
import { t as translate } from '../i18n';

/** cubic-bezier(.2,.8,.2,1) — the ring and bar easing. */
const EASE_OUT = Easing.bezier(0.2, 0.8, 0.2, 1);

export function ProgressRing({
  pct,
  size = 104,
  stroke = 9,
}: {
  pct: number;
  size?: number;
  stroke?: number;
}) {
  const p = usePalette();
  const r = size / 2 - stroke / 2;
  const circumference = 2 * Math.PI * r;
  const target = Math.max(0, Math.min(100, pct));

  // The sweep is driven through a listener into state rather than by wrapping
  // Circle in Animated.createAnimatedComponent: the animated wrapper forwards
  // `collapsable` to the SVG element, which is not a DOM attribute and warns on
  // web. One second of setState at 60fps on a single element is cheap, and this
  // keeps the ring identical on both platforms.
  const t = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    const id = t.addListener(({ value }) => setProgress(value));
    Animated.timing(t, {
      toValue: 1,
      duration: reduced ? 0 : motion.ring,
      easing: EASE_OUT,
      // strokeDashoffset is not a native-driver property
      useNativeDriver: false,
    }).start();

    return () => t.removeListener(id);
  }, [t, reduced]);

  const offset = circumference * (1 - (target / 100) * progress);

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityLabel={translate('stats.ringLabel', { n: Math.round(target) })}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: target }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringG" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={brand.accent} />
            <Stop offset="1" stopColor={brand.accentDeep} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={p.raised} strokeWidth={stroke} />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringG)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Txt role="stat20">{translate('stats.percent', { n: Math.round(target) })}</Txt>
      </View>
    </View>
  );
}

export interface Bar {
  /** Printed under the bar. */
  km: number;
  /** 0–100, relative to the tallest week. */
  pct: number;
}

export function WeeklyBars({ bars }: { bars: Bar[] }) {
  return (
    <View
      accessible
      accessibilityLabel={translate('stats.barsLabel', { list: bars.map((b) => b.km).join(', ') })}
    >
      <View style={styles.barRow}>
        {bars.map((b, i) => (
          <GrowBar key={i} pct={b.pct} index={i} current={i === bars.length - 1} />
        ))}
      </View>
      <View style={styles.barLabels}>
        {bars.map((b, i) => (
          <Txt key={i} role="appMeta" muted style={styles.barLabel}>
            {b.km}
          </Txt>
        ))}
      </View>
    </View>
  );
}

function GrowBar({ pct, index, current }: { pct: number; index: number; current: boolean }) {
  const p = usePalette();
  const t = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: reduced ? 0 : motion.bars,
      delay: reduced ? 0 : index * motion.barStagger,
      easing: EASE_OUT,
      useNativeDriver: false,
    }).start();
  }, [t, index, reduced]);

  const height = t.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${Math.max(0, Math.min(100, pct))}%`],
  });

  return (
    <Animated.View style={[styles.bar, { height, backgroundColor: p.raised }]}>
      {current ? (
        <Gradient colors={gradients.primary} angle="vertical" style={StyleSheet.absoluteFill} />
      ) : null}
    </Animated.View>
  );
}

/** The 3px proportional bar under each leaderboard row. */
export function LeaderboardBar({ pct }: { pct: number }) {
  const p = usePalette();
  const t = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: reduced ? 0 : motion.leaderboardBar,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [t, reduced]);

  const width = t.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${Math.max(0, Math.min(100, pct))}%`],
  });

  return (
    <View style={[styles.track, { backgroundColor: p.raised }]}>
      <Animated.View style={{ width, height: '100%' }}>
        <Gradient colors={gradients.primary} angle="horizontal" style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

/** The clan-challenge bar — 12px, warm gradient, filled to the given percent. */
export function ChallengeBar({ pct }: { pct: number }) {
  const p = usePalette();
  return (
    <View
      style={[styles.challengeTrack, { backgroundColor: p.raised }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
    >
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%' }}>
        <Gradient colors={gradients.challenge} angle="horizontal" style={StyleSheet.absoluteFill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  barRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 140,
  },
  bar: { flex: 1, overflow: 'hidden' },
  barLabels: { flexDirection: 'row', gap: 6, marginTop: 8 },
  barLabel: { flex: 1, textAlign: 'center', letterSpacing: 0 },
  track: { height: 3, marginTop: 8, overflow: 'hidden' },
  challengeTrack: { height: 12, marginTop: 12, marginBottom: 10, overflow: 'hidden' },
});
