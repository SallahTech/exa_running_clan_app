/**
 * Text primitive. Every string in the app goes through this so no screen has to
 * remember which of the two Archivo weights it wants, or that numerals are
 * tabular.
 */

import type { ReactNode } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { language, upper } from '../i18n';

import { usePalette } from '../theme/ThemeProvider';
import { type } from '../theme/type';

type Role = keyof typeof type;

// `role` here is the design-system text role, not the ARIA `role` on TextProps.
export interface TxtProps extends Omit<TextProps, 'role'> {
  role?: Role;
  /** Overrides the palette default. */
  color?: string;
  /** Shorthand for the two most common colour choices. */
  muted?: boolean;
  faint?: boolean;
  /** Extra optical opacity, used for the 65% labels on dark hero fields. */
  dim?: number;
}

function upperChildren(node: ReactNode): ReactNode {
  if (typeof node === 'string') return upper(node);
  return Array.isArray(node) ? node.map(upperChildren) : node;
}

export function Txt({
  role = 'body',
  color,
  muted,
  faint,
  dim,
  style,
  children,
  ...rest
}: TxtProps) {
  const p = usePalette();
  const resolved = color ?? (faint ? p.faint : muted ? p.muted : p.text);

  const base: TextStyle = {
    ...type[role],
    color: resolved,
    ...(dim !== undefined ? { opacity: dim } : null),
  };

  // The native uppercase style has no Turkish rules and turns i into I, not İ.
  // Uppercase the text ourselves in Turkish; English still uses the style.
  if (base.textTransform === 'uppercase' && language() === 'tr') {
    base.textTransform = 'none';
    children = upperChildren(children);
  }

  // Follows Dynamic Type, capped so the fixed-grid stat rows still hold together.
  return (
    <Text maxFontSizeMultiplier={1.6} {...rest} style={[base, style]}>
      {children}
    </Text>
  );
}
