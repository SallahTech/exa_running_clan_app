/**
 * Welcome / splash — the logo at ~300px, the promise, and the two ways in.
 */

import { useRouter } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/state/AuthProvider';
import { brand } from '@/theme/tokens';
import { PrimaryButton, SecondaryButton } from '@/ui/Button';
import { Txt } from '@/ui/Txt';
import { t } from '@/i18n';

const LOGO = require('../../assets/exa-logo.png');

export default function Welcome() {
  const router = useRouter();
  const { configured } = useAuth();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.logoWrap}>
        <Image source={LOGO} style={styles.logo} accessibilityLabel={t('common.logo')} />
      </View>

      <View style={styles.copy}>
        <Txt role="kicker9" color={brand.accent} style={styles.kicker}>
          {t('welcome.place')}
        </Txt>
        <Txt role="authTitle" color="#f2f2f4" style={styles.headline}>
          {t('welcome.headline')}
        </Txt>
        <Txt role="body" color="#8d8d92" style={styles.body}>
          {t('welcome.body')}
        </Txt>

        <View style={styles.actions}>
          <PrimaryButton label={t('welcome.create')} onPress={() => router.push('/(auth)/register')} />
          <SecondaryButton
            label={t('welcome.have')}
            onDark
            onPress={() => router.push('/(auth)/sign-in')}
          />
        </View>

        {/* A fresh clone has no backend yet; say so here rather than letting
            sign-in fail with a generic network error. */}
        {!configured ? (
          <Txt role="micro" color={brand.accentOnDark} style={styles.setup}>
            {t('welcome.setup')}
          </Txt>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000', paddingHorizontal: 20, paddingBottom: 24 },
  logoWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 300, height: 300, resizeMode: 'contain' },
  copy: {},
  kicker: { letterSpacing: 1.62 },
  headline: { marginTop: 10, marginBottom: 8 },
  body: { marginBottom: 18 },
  actions: { gap: 10 },
  setup: { marginTop: 14 },
});
