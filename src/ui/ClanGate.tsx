/**
 * What a tab shows before it has data. Without this, a slow load or a failed one
 * renders the screen's chrome around nothing, which reads as "the clan has no
 * runs". Once a member has loaded, a failed refresh keeps the screen and toasts.
 */

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useClan } from '../state/ClanProvider';
import { space } from '../theme/tokens';
import { usePalette } from '../theme/ThemeProvider';
import { SecondaryButton } from './Button';
import { Txt } from './Txt';
import { t } from '../i18n';

export function ClanGate({ children }: { children: React.ReactNode }) {
  const p = usePalette();
  const { me, loading, error, refresh } = useClan();
  const [retrying, setRetrying] = useState(false);

  if (me) return <>{children}</>;

  if (error && !loading) {
    const retry = async () => {
      setRetrying(true);
      await refresh();
      setRetrying(false);
    };

    return (
      <View style={[styles.root, styles.error, { backgroundColor: p.paper }]}>
        <Txt role="cardTitle24">{t('gate.title')}</Txt>
        <Txt role="appBody" muted style={styles.message}>
          {t('gate.body')}
        </Txt>
        <SecondaryButton
          label={t(retrying ? 'common.tryingAgain' : 'common.tryAgain')}
          onPress={retry}
          disabled={retrying}
        />
      </View>
    );
  }

  // Blocks in the shape of the Home hero and rows, so content lands without a jump.
  return (
    <View
      style={[styles.root, { backgroundColor: p.paper }]}
      accessible
      accessibilityLabel={t('common.loading')}
    >
      <View style={[styles.hero, { backgroundColor: p.surface }]} />
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.row, { borderBottomColor: p.hairline }]}>
          <View style={[styles.lineShort, { backgroundColor: p.surface }]} />
          <View style={[styles.lineLong, { backgroundColor: p.surface }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  error: { padding: space.section, justifyContent: 'center' },
  message: { marginTop: 8, marginBottom: 18 },
  hero: { height: 290 },
  row: { padding: space.section, borderBottomWidth: 1, gap: 8 },
  lineShort: { width: '30%', height: 10 },
  lineLong: { width: '65%', height: 18 },
});
