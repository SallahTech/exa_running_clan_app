/**
 * Photography and maps are rendered grayscale, as the design specifies.
 *
 * React Native takes `filter` as an array of filter objects; react-native-web
 * passes the value through to CSS and wants a string. Same visual result, two
 * spellings, so the platform split lives here rather than in every component
 * that shows an image.
 */

import { Platform, type ViewStyle } from 'react-native';

type FilterStyle = Pick<ViewStyle, 'filter'>;

/** Fully desaturate, with an optional contrast lift to keep it from going flat. */
export function grayscale(contrast?: number): FilterStyle {
  if (Platform.OS === 'web') {
    return {
      filter: contrast ? `grayscale(1) contrast(${contrast})` : 'grayscale(1)',
    } as FilterStyle;
  }

  return {
    filter: contrast ? [{ grayscale: 1 }, { contrast }] : [{ grayscale: 1 }],
  } as FilterStyle;
}
