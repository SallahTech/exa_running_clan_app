/** Leader tools: add a race to the calendar. */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as api from '@/data/api';
import { t } from '@/i18n';
import { useClan } from '@/state/ClanProvider';
import { usePalette } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';
import { PrimaryButton } from '@/ui/Button';
import { FormField } from '@/ui/Field';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { useToast } from '@/ui/Toast';

const isRealDate = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T12:00:00Z`).getTime());

export default function AddRace() {
  const p = usePalette();
  const router = useRouter();
  const toast = useToast();
  const { refresh } = useClan();

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [url, setUrl] = useState('');
  const [errors, setErrors] = useState<{ name?: string; date?: string }>({});
  const [busy, setBusy] = useState(false);

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/runs');
  };

  const submit = async () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = t('race.nameError');
    if (!isRealDate(date.trim())) next.date = t('race.dateError');
    setErrors(next);
    if (next.name || next.date) return;

    setBusy(true);
    try {
      await api.saveRace({ name, date: date.trim(), location, note, url });
      await refresh();
      leave();
    } catch {
      toast.show(t('race.failed'));
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: p.paper }]} edges={['top', 'bottom']}>
      <ScreenHeader kicker={t('race.kicker')} title={t('race.title')} actionLabel={t('common.cancel')} onAction={leave} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <FormField label={t('race.name')} value={name} onChangeText={setName} error={errors.name} />
          <FormField
            label={t('race.date')}
            value={date}
            onChangeText={setDate}
            error={errors.date}
            placeholder="2027-03-15"
            keyboardType="numbers-and-punctuation"
          />
          <FormField label={t('race.location')} value={location} onChangeText={setLocation} />
          <FormField label={t('race.note')} value={note} onChangeText={setNote} />
          <FormField
            label={t('race.link')}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </ScrollView>
        <View style={styles.footer}>
          <PrimaryButton label={busy ? t('race.busy') : t('race.submit')} onPress={submit} disabled={busy} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { padding: space.section },
  footer: { paddingHorizontal: space.gutter, paddingVertical: 12 },
});
