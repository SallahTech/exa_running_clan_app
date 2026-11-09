/**
 * Gradient fills. The design uses three angles and nothing else:
 *   135deg  primary fills (buttons, chips, selected pace groups)
 *   90deg   the clan-challenge progress bar
 *   150deg  the profile header field
 *   180deg  the hero scrim and the stats bars
 *
 * CSS `linear-gradient(135deg, …)` runs top-left to bottom-right, which maps to
 * start {0,0} / end {1,1}. The helpers below spell that out so call sites read
 * as the spec does.
 */

import { LinearGradient, type LinearGradientProps } from 'expo-linear-gradient';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

type Colors = readonly [ColorValue, ColorValue, ...ColorValue[]];

const ANGLES = {
  /** 135deg — top-left to bottom-right. */
  diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  /** 150deg — the profile header, slightly steeper. */
  profile: { start: { x: 0, y: 0 }, end: { x: 0.75, y: 1 } },
  /** 90deg — left to right. */
  horizontal: { start: { x: 0, y: 0 }, end: { x: 1, y: 0 } },
  /** 180deg — top to bottom. */
  vertical: { start: { x: 0, y: 0 }, end: { x: 0, y: 1 } },
} as const;

export type GradientAngle = keyof typeof ANGLES;

export interface GradientProps
  extends Omit<LinearGradientProps, 'colors' | 'start' | 'end' | 'style'> {
  colors: Colors;
  angle?: GradientAngle;
  style?: StyleProp<ViewStyle>;
}

export function Gradient({ colors, angle = 'diagonal', ...rest }: GradientProps) {
  return <LinearGradient colors={colors} {...ANGLES[angle]} {...rest} />;
}
