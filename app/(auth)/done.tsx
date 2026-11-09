/**
 * You're in — the confirmation screen after registration.
 *
 * The member number, the next session and its going count are read back from
 * the server rather than assumed, so this screen tells the truth about the
 * account that was just created.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as api from '@/data/api';
import { dayFull, timeOfDay } from '@/data/format';
import { paceShort, type PaceGroup, type Me, type RunSummary } from '@/data/types';
import { brand } from '@/theme/tokens';
import { PrimaryButton } from '@/ui/Button';
import { Txt } from '@/ui/Txt';
import { lower, t, upper } from '@/i18n';

const LOGO = require('../../assets/exa-logo.png');

export default function Done() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; pace?: string; confirmEmail?: string }>();

  const [me, setMe] = useState<Me | null>(null);
  const [next, setNext] = useState<RunSummary | null>(null);

  useEffect(() => {
    // Before the email is confirmed there's no session, so nothing can be read yet.
    if (params.confirmEmail) return;
    api.getMe().then(setMe).catch(() => undefined);
    api
      .getUpcomingRuns(1)
      .then((rs) => setNext(rs[0] ?? null))
      .catch(() => undefined);
  }, [params.confirmEmail]);

  const firstName = upper(params.name || me?.full_name?.split(' ')[0] || t('done.runner'));
  const pace = (params.pace ?? me?.pace_group ?? 'open') as PaceGroup;
  const paceLine =
    pace === 'open' ? t('done.ownPace') : t('done.lookFor', { pace });
  const day = next ? dayFull(next.starts_at) : upper(t('done.dayFallback'));

  if (params.confirmEmail) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.body}>
          <View style={styles.logoWrap}>
            <Image source={LOGO} style={styles.logo} accessibilityLabel={t('common.logo')} />
          </View>
          <Txt role="kicker9" color={brand.accent}>
            {t('done.confirmKicker')}
          </Txt>
          <Txt role="authTitle" color="#f2f2f4" style={styles.headline}>
            {t('done.confirmTitle')}
          </Txt>
          <Txt role="body" color="#8d8d92" style={styles.copy}>
            {t('done.confirmBody', { email: params.confirmEmail })}
          </Txt>
        </View>
        <View style={styles.footer}>
          <PrimaryButton label={t('done.toSignIn')} onPress={() => router.replace('/(auth)/sign-in')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <View style={styles.logoWrap}>
          <Image source={LOGO} style={styles.logo} accessibilityLabel={t('common.logo')} />
        </View>

        <Txt role="kicker9" color={brand.accent}>
          {t('done.kicker', { n: me?.member_number ?? '—' })}
        </Txt>
        <Txt role="authTitle" color="#f2f2f4" style={styles.headline}>
          {t('done.headline', { day: lower(day), name: firstName })}
        </Txt>

        <Txt role="body" color="#8d8d92" style={styles.copy}>
          {next
            ? t('done.runLine', { title: next.title, time: timeOfDay(next.starts_at), place: next.meet_point, pace: paceLine })
            : paceLine}
        </Txt>

        <View style={styles.panel}>
          <View style={[styles.panelCell, styles.panelCellDivided]}>
            <Txt role="stat20" color="#f2f2f4">
              {paceShort(pace)}
            </Txt>
            <Txt role="statLabel" color="#8d8d92" style={styles.panelLabel}>
              {t('done.paceGroup')}
            </Txt>
          </View>
          <View style={styles.panelCell}>
            <Txt role="stat20" color="#f2f2f4">
              {next?.going_count ?? 0}
            </Txt>
            <Txt role="statLabel" color="#8d8d92" style={styles.panelLabel}>
              {t('done.going', { day: lower(day) })}
            </Txt>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton label={t('done.open')} onPress={() => router.replace('/(tabs)')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  logoWrap: { alignSelf: 'center', marginBottom: 26 },
  logo: { width: 210, height: 210, resizeMode: 'contain' },
  headline: { marginTop: 10, marginBottom: 10 },
  copy: { marginBottom: 20 },
  panel: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  panelCell: { flex: 1, paddingVertical: 12, paddingHorizontal: 14 },
  panelCellDivided: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.16)' },
  panelLabel: { marginTop: 3 },
  footer: { paddingHorizontal: 20, paddingBottom: 8, paddingTop: 16 },
});
