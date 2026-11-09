/**
 * Initials squares — a filled square with the member's initials, no radius and
 * no outline. Fills rather than borders keep a screen full of them quiet.
 */

import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { gradients } from '../theme/tokens';
import { usePalette } from '../theme/ThemeProvider';
import { Gradient } from './Gradient';
import { Txt } from './Txt';

export interface InitialsSquareProps {
  initials: string;
  size?: number;
  /** The signed-in member's chip carries the accent gradient and reads "YOU". */
  me?: boolean;
  /** Draws a gap around the square, for squares that overlap in a stack. */
  ringColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function InitialsSquare({
  initials,
  size = 36,
  me = false,
  ringColor,
  style,
}: InitialsSquareProps) {
  const p = usePalette();

  const fontSize = Math.max(10, Math.round(size * 0.33));
  const box: ViewStyle = {
    width: size,
    height: size,
    alignItems: 'center',
    justifyContent: 'center',
  };
  const text = { fontSize, lineHeight: Math.round(fontSize * 1.15) };

  if (me) {
    return (
      <Gradient colors={gradients.primary} style={[box, style]}>
        <Txt color="#ffffff" style={text} role="listTitle12">
          {initials}
        </Txt>
      </Gradient>
    );
  }

  return (
    <View
      style={[
        box,
        { backgroundColor: p.raised },
        ringColor ? { borderWidth: 2, borderColor: ringColor } : null,
        style,
      ]}
    >
      <Txt style={text} role="listTitle12">
        {initials}
      </Txt>
    </View>
  );
}

/** The overlapping stack on run tiles. `ringColor` should match what it sits on. */
export function CrewStack({ initials, ringColor }: { initials: string[]; ringColor: string }) {
  return (
    <View style={styles.stack}>
      {initials.map((i, idx) => (
        <InitialsSquare
          key={`${i}-${idx}`}
          initials={i}
          size={30}
          ringColor={ringColor}
          style={idx === 0 ? styles.first : styles.overlap}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { flexDirection: 'row', alignItems: 'center' },
  // The ring is drawn inside the square, so pull the stack back onto the text edge.
  first: { marginLeft: -2 },
  overlap: { marginLeft: -6 },
});
