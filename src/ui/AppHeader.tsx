/**
 * Persistent app header — the same logo-and-name lockup as the sign-in screen,
 * and the member's initials square. Sits above the content on all five tabs.
 */

import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { space } from '../theme/tokens';
import { usePalette } from '../theme/ThemeProvider';
import { InitialsSquare } from './Avatar';
import { Txt } from './Txt';
import { t } from '../i18n';

const LOGO = require('../../assets/exa-logo.png');

export function AppHeader({ initials }: { initials: string }) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={{ backgroundColor: p.paper, paddingTop: insets.top }}>
      <View style={styles.row}>
        <View style={styles.lockup}>
          <Image source={LOGO} style={styles.mark} accessibilityLabel={t('common.logo')} />
          <Txt role="appLabel" muted>
            {t('common.clubName')}
          </Txt>
        </View>

        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel={t('common.settings')}
          hitSlop={6}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <InitialsSquare initials={initials} size={36} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.gutter,
    paddingVertical: 8,
  },
  lockup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 36, height: 36, resizeMode: 'cover' },
});
