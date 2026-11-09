/**
 * Header for screens pushed over the tabs: the way back on the left, where the
 * platform puts it, and a large title below.
 */

import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { space } from '../theme/tokens';
import { usePalette } from '../theme/ThemeProvider';
import { Txt } from './Txt';

export interface ScreenHeaderProps {
  /** Small tracked line above the title. */
  kicker?: string;
  title: string;
  /** Left-hand text action — "Cancel", "Back". */
  actionLabel?: string;
  onAction?: () => void;
}

export function ScreenHeader({ kicker, title, actionLabel, onAction }: ScreenHeaderProps) {
  const p = usePalette();

  return (
    <View style={{ backgroundColor: p.paper }}>
      {actionLabel ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={({ pressed }) => [styles.action, { opacity: pressed ? 0.5 : 1 }]}
        >
          {actionLabel === 'Back' ? (
            <ChevronLeft size={20} color={p.muted} strokeWidth={2.5} strokeLinecap="square" />
          ) : null}
          <Txt role="button11" muted>
            {actionLabel}
          </Txt>
        </Pressable>
      ) : null}

      <View style={styles.text}>
        {kicker ? (
          <Txt role="appLabel" color={p.accentText} style={styles.kicker}>
            {kicker}
          </Txt>
        ) : null}
        <Txt role="screenTitle">{title}</Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: space.gutter,
  },
  text: { paddingHorizontal: space.gutter, paddingTop: 4, paddingBottom: 16 },
  kicker: { marginBottom: 6 },
});
