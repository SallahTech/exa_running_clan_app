/**
 * Design tokens — README.md "Brand & Design Tokens".
 *
 * Two skins are specified. Neutral paper + ink for light, true black with
 * #0d0d10 surfaces for dark; the accent is identical in both.
 *
 * Radius is 0 everywhere. There is no shadow in the UI itself — the drop shadow
 * in the design canvas only lifts the device frame off the page.
 */

export const RADIUS = 0;

/** Fixed across both skins. */
export const brand = {
  accent: '#ee1c2a',
  accentDeep: '#a70d18',
  /** Gradient end on the clan-challenge bar only. */
  accentWarm: '#ff7a4d',
  /** Small accent labels on near-black fields (hero kicker, profile kicker). */
  accentOnDark: '#ff8a90',
  white: '#ffffff',
  black: '#000000',
} as const;

export const gradients = {
  /** Primary fill: buttons, active chips, selected pace groups. */
  primary: [brand.accent, brand.accentDeep] as const,
  /** The "you're in" state — the primary button inverts to near-black. */
  committed: ['#0b0b0d', '#3a0a0f'] as const,
  /** Clan challenge progress bar. */
  challenge: [brand.accent, brand.accentWarm] as const,
  /** Profile header field. */
  profile: ['#0b0b0d', '#2a0508', '#6b0d15'] as const,
} as const;

/** Hero photo scrim, bottom-anchored over the run photograph. */
export const heroScrim = [
  'rgba(0,0,0,0)',
  'rgba(120,12,20,0.42)',
  'rgba(0,0,0,0.96)',
] as const;

// muted and faint are darkened from the handoff's #7a7a80 / #96969c (light) and
// #6f6f75 (dark): those fell short of the 4.5:1 AA minimum for small text.
export type Scheme = 'light' | 'dark';

export interface Palette {
  scheme: Scheme;
  /** Screen background. */
  paper: string;
  /** Tinted panels, unselected chips, chart tracks. */
  surface: string;
  /** Controls and tiles that sit on a surface: avatars, day cells, past chart bars. */
  raised: string;
  /** Small accent text — red dark enough for 4.5:1 on either ground. */
  accentText: string;
  /** Sheet background. */
  sheet: string;
  /** Primary text. */
  text: string;
  /** Secondary text. */
  muted: string;
  /** Faintest text — helper copy under form fields. */
  faint: string;
  /** Section dividers. */
  hairline: string;
  /** Stronger dividers between list rows. */
  hairlineStrong: string;
  /** The 2px rules under the header and above the tab bar. */
  rule: string;
  /** Border on avatar squares and unselected chips. */
  border: string;
  /** Fill behind the segmented-control gaps. */
  segmentTrack: string;
  /** Unselected segment fill. */
  segmentOff: string;
  /** "You" row highlight on the leaderboard. */
  youTint: string;
  /** Placeholder photo block — two stripe colours. */
  placeholder: [string, string];
  placeholderText: string;
  /** Scrim behind the run-detail sheet. */
  scrim: string;
  /** Text that sits on an accent fill. */
  onAccent: string;
}

const light: Palette = {
  scheme: 'light',
  paper: '#ffffff',
  surface: '#f3f3f4',
  raised: '#e4e4e7',
  accentText: '#d3121f',
  sheet: '#ffffff',
  text: '#0b0b0d',
  muted: '#6b6b71',
  faint: '#707076',
  hairline: 'rgba(11,11,13,0.16)',
  hairlineStrong: 'rgba(11,11,13,0.22)',
  rule: '#0b0b0d',
  border: '#0b0b0d',
  segmentTrack: 'rgba(11,11,13,0.4)',
  segmentOff: 'transparent',
  youTint: '#ffe3e5',
  placeholder: ['#d6d4d1', '#f0efed'],
  placeholderText: '#6b6b71',
  scrim: 'rgba(11,11,13,0.5)',
  onAccent: '#fafafa',
};

const dark: Palette = {
  scheme: 'dark',
  paper: '#000000',
  surface: '#141417',
  raised: '#26262b',
  accentText: brand.accent,
  sheet: '#141417',
  text: '#f2f2f4',
  muted: '#9c9ca2',
  faint: '#85858b',
  hairline: 'rgba(255,255,255,0.13)',
  hairlineStrong: 'rgba(255,255,255,0.22)',
  rule: 'rgba(255,255,255,0.22)',
  border: 'rgba(255,255,255,0.3)',
  segmentTrack: 'rgba(255,255,255,0.22)',
  segmentOff: 'transparent',
  youTint: 'rgba(238,28,42,0.24)',
  placeholder: ['#17171b', '#212126'],
  placeholderText: '#8d8d92',
  scrim: 'rgba(0,0,0,0.6)',
  onAccent: '#ffffff',
};

export const palettes: Record<Scheme, Palette> = { light, dark };

/**
 * Spacing — screen gutter 16 (20 on auth), section padding 16,
 * list row vertical 12–16, gaps 6/8/10/12.
 */
export const space = {
  gutter: 20,
  authGutter: 20,
  section: 20,
  /** Between the major blocks of a screen — space, not rules, separates them. */
  block: 36,
  row: 14,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
} as const;

/** Motion — README "Interactions & Behavior". */
export const motion = {
  /** Content enter: opacity 0→1, translateY 10→0. */
  screenIn: 300,
  /** Bottom sheet slide. */
  sheet: 360,
  scrim: 300,
  /** Chip / button state changes. */
  state: 180,
  /** Tab colour + border. */
  tab: 180,
  /** Bar chart fill, with a 45ms per-bar stagger. */
  bars: 700,
  barStagger: 45,
  /** Progress ring sweep and leaderboard bar widths. */
  ring: 1000,
  leaderboardBar: 800,
} as const;
