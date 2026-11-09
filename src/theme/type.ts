/**
 * Typography — README.md "Typography — Archivo", weights 400 / 800 only.
 *
 * The spec gives letter-spacing in em; React Native's `letterSpacing` is in
 * points, so every role below states its tracking as `em * fontSize` already
 * multiplied out. `tabular` marks the roles that must use tabular figures —
 * every numeral in this app does, so counts don't jitter as they tick.
 */

import type { TextStyle } from 'react-native';

export const fonts = {
  regular: 'Archivo_400Regular',
  bold: 'Archivo_800ExtraBold',
} as const;

/** Tabular figures. RN honours this on both iOS and Android. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

const bold = (
  size: number,
  lineHeight: number,
  trackingEm = 0,
): TextStyle => ({
  fontFamily: fonts.bold,
  fontSize: size,
  lineHeight: Math.round(size * lineHeight),
  letterSpacing: size * trackingEm,
});

const regular = (
  size: number,
  lineHeight: number,
  trackingEm = 0,
): TextStyle => ({
  fontFamily: fonts.regular,
  fontSize: size,
  lineHeight: Math.round(size * lineHeight),
  letterSpacing: size * trackingEm,
});

export const type = {
  /** Screen title — 800, 30px, uppercase. */
  screenTitle: { ...bold(38, 1.0, -0.02), textTransform: 'uppercase' } as TextStyle,
  /** Hero title over the run photograph. */
  heroTitle: { ...bold(46, 0.96, -0.025), textTransform: 'uppercase' } as TextStyle,
  /** Auth headline — 800, 30px on the welcome and confirmation screens. */
  authTitle: { ...bold(30, 1.02, -0.01), textTransform: 'uppercase' } as TextStyle,
  /** Register step headline — 800, 26px. */
  stepTitle: { ...bold(26, 1.05), textTransform: 'uppercase' } as TextStyle,
  /** Sheet title — 800, 28px. */
  sheetTitle: { ...bold(32, 1.0, -0.01), textTransform: 'uppercase' } as TextStyle,
  /** Profile name — 800, 32px on two lines. */
  profileName: { ...bold(40, 0.98, -0.02), textTransform: 'uppercase' } as TextStyle,

  /** Big stat — the countdown, week totals, hero numbers. */
  stat26: { ...bold(26, 1.0), ...tabular } as TextStyle,
  stat22: { ...bold(22, 1.0), ...tabular } as TextStyle,
  stat20: { ...bold(20, 1.0), ...tabular } as TextStyle,
  stat18: { ...bold(18, 1.0), ...tabular } as TextStyle,
  stat15: { ...bold(15, 1.0), ...tabular } as TextStyle,

  /** Card titles. */
  cardTitle24: bold(24, 1.05),
  cardTitle18: bold(18, 1.1),
  /** List row titles. */
  listTitle: bold(15, 1.2),
  listTitle14: bold(14, 1.2),
  listTitle12: bold(12, 1.2),

  /** Kicker / label — 800, 9–10px, wide tracking, uppercase. */
  kicker10: { ...bold(10, 1.2, 0.14), textTransform: 'uppercase' } as TextStyle,
  kicker9: { ...bold(9, 1.35, 0.16), textTransform: 'uppercase' } as TextStyle,
  /** The 8px labels under every big stat. */
  statLabel: { ...bold(8, 1.2, 0.14), textTransform: 'uppercase' } as TextStyle,
  /** Tab bar labels. */
  tabLabel: { ...bold(10, 1.2, 0.04), textTransform: 'uppercase' } as TextStyle,

  /** Body copy. */
  body: regular(13, 1.5),
  body125: regular(12.5, 1.4),
  body12: regular(12, 1.4),
  /** Micro / meta. */
  micro: regular(11, 1.4),
  micro115: regular(11.5, 1.5),

  /**
   * In-app scale. The auth screens keep the handoff's sizes above; the app needs
   * a larger step between levels because it carries far more on one screen.
   */
  section: { ...bold(20, 1.1, -0.01), textTransform: 'uppercase' } as TextStyle,
  rowTitle: bold(17, 1.2, -0.005),
  appTitle: bold(21, 1.15, -0.01),
  appBody: regular(15, 1.45),
  appMeta: regular(13, 1.35),
  appMetaBold: bold(13, 1.35),
  appLabel: { ...bold(11, 1.25, 0.1), textTransform: 'uppercase' } as TextStyle,
  stat40: { ...bold(40, 1.0, -0.02), ...tabular } as TextStyle,
  stat30: { ...bold(30, 1.0, -0.01), ...tabular } as TextStyle,
  stat24: { ...bold(24, 1.0), ...tabular } as TextStyle,

  /** Button label — 800, uppercase, wide tracking, left-aligned. */
  button13: { ...bold(13, 1.2, 0.08), textTransform: 'uppercase' } as TextStyle,
  button12: { ...bold(12, 1.2, 0.08), textTransform: 'uppercase' } as TextStyle,
  button11: { ...bold(11, 1.2, 0.06), textTransform: 'uppercase' } as TextStyle,
  /** State chip on run rows. */
  chip: { ...bold(10, 1.2, 0.08), textTransform: 'uppercase' } as TextStyle,

  /** Form field input text. */
  input: regular(14, 1.3),
} as const;
