/**
 * Photo and map placeholders.
 *
 * Every photograph and the meet-point map in the handoff are placeholders —
 * diagonal-stripe blocks labelled with what belongs there. They stay
 * placeholders here rather than being filled with stock imagery, so it stays
 * obvious what still needs real assets. Real photography should be rendered
 * grayscale as in the design; the map should become a real map view centred on
 * `meet_lat`/`meet_lng`, which the API already returns.
 */

import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';

import { usePalette } from '../theme/ThemeProvider';
import { Txt } from './Txt';

export interface PlaceholderProps {
  /** What belongs here — "photo — sunrise at Molos", "map — GSO Track". */
  label?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function Placeholder({ label, height, style, children }: PlaceholderProps) {
  const p = usePalette();
  const [dark, lightStripe] = p.placeholder;

  return (
    <View style={[styles.block, height !== undefined ? { height } : null, style]}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          {/* 135° stripes, 6px on 6px — matches the prototype's repeating gradient */}
          <Pattern id="stripes" width="12" height="12" patternUnits="userSpaceOnUse">
            <Rect width="12" height="12" fill={lightStripe} />
            <Path d="M-3,3 l6,-6 M0,12 l12,-12 M9,15 l6,-6" stroke={dark} strokeWidth="6" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#stripes)" />
      </Svg>

      {label ? (
        <Txt role="micro" color={p.placeholderText} style={styles.label}>
          {label}
        </Txt>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    width: '100%',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  label: {
    padding: 8,
    fontSize: 9,
    letterSpacing: 0.36,
  },
});
