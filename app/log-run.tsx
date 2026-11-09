/**
 * Log a run — §6 gap 3. The form asks for the two numbers a runner has to hand
 * and shows the pace they imply, so a typo reads as wrong before it is saved.
 * Home, Stats and the leaderboard all derive from the activity this writes.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as api from '@/data/api';
import { pace } from '@/data/format';
import { useClan } from '@/state/ClanProvider';
import { usePalette } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';
import { PrimaryButton } from '@/ui/Button';
import { feedback } from '@/ui/feedback';
import { FormField } from '@/ui/Field';
import { Segmented } from '@/ui/Segmented';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { useToast } from '@/ui/Toast';
import { Txt } from '@/ui/Txt';
import { t } from '@/i18n';

type Day = 'today' | 'yesterday';

/** Accepts the comma a Turkish keypad offers as well as a point. */
const parse = (s: string) => Number(s.trim().replace(',', '.'));

export default function LogRun() {
  const p = usePalette();
  const router = useRouter();
  const toast = useToast();
  const { refresh } = useClan();

  const [day, setDay] = useState<Day>('today');
  const [distance, setDistance] = useState('');
  const [minutes, setMinutes] = useState('');
  const [errors, setErrors] = useState<{ distance?: string; minutes?: string }>({});
  const [busy, setBusy] = useState(false);

  const km = parse(distance);
  const mins = parse(minutes);
  const impliedPace = km > 0 && mins > 0 ? pace((mins * 60) / km) : null;

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const submit = async () => {
    const next: typeof errors = {};
    if (!(km > 0 && km <= 200)) next.distance = t('log.distanceError');
    if (!(mins > 0 && mins <= 1440)) next.minutes = t('log.timeError');
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      const startedAt = new Date(Date.now() - (day === 'yesterday' ? 86400000 : 0) - mins * 60000);
      await api.logActivity({ startedAt, distanceM: km * 1000, movingSeconds: mins * 60 });
      await refresh();
      feedback.success();
      toast.show(t('log.done', { km }), 'info');
      leave();
    } catch {
      feedback.error();
      toast.show(t('log.failed'));
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: p.paper }]} edges={['top', 'bottom']}>
      <ScreenHeader kicker={t('log.kicker')} title={t('log.title')} actionLabel={t('common.cancel')} onAction={leave} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View style={styles.day}>
            <Segmented
              options={[
                { value: 'today' as const, label: t('log.today') },
                { value: 'yesterday' as const, label: t('log.yesterday') },
              ]}
              value={day}
              onChange={setDay}
            />
          </View>

          <FormField
            label={t('log.distance')}
            value={distance}
            onChangeText={(v) => {
              setDistance(v);
              setErrors((e) => ({ ...e, distance: undefined }));
            }}
            error={errors.distance}
            placeholder="8.5"
            keyboardType="decimal-pad"
          />
          <FormField
            label={t('log.time')}
            value={minutes}
            onChangeText={(v) => {
              setMinutes(v);
              setErrors((e) => ({ ...e, minutes: undefined }));
            }}
            error={errors.minutes}
            placeholder="45"
            keyboardType="decimal-pad"
          />

          <Txt role="appLabel" muted>
            {t('log.pace')}
          </Txt>
          <Txt role="stat26" style={styles.pace} accessibilityLiveRegion="polite">
            {impliedPace ?? '—'}
          </Txt>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton label={t(busy ? 'log.busy' : 'log.submit')} onPress={submit} disabled={busy} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { padding: space.section },
  day: { marginBottom: 20 },
  pace: { marginTop: 6 },
  footer: { paddingHorizontal: space.gutter, paddingVertical: 12 },
});
