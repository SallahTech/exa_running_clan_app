/** Opened from the password reset email, once its link has signed the member in. */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/data/supabase';
import { t } from '@/i18n';
import { useAuth } from '@/state/AuthProvider';
import { PrimaryButton } from '@/ui/Button';
import { Field } from '@/ui/Field';
import { useToast } from '@/ui/Toast';
import { Txt } from '@/ui/Txt';

export default function ResetPassword() {
  const router = useRouter();
  const toast = useToast();
  const { finishRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (password.length < 8) {
      setError(t('reg.passwordRule'));
      return;
    }
    setBusy(true);
    const { error: failed } = await supabase.auth.updateUser({ password });
    if (failed) {
      setError(t('reset.failed'));
      setBusy(false);
      return;
    }
    finishRecovery();
    toast.show(t('reset.saved'), 'info');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.body}>
          <Txt role="authTitle" color="#f2f2f4" style={styles.title}>
            {t('reset.title')}
          </Txt>
          <Field
            label={t('reset.field')}
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setError(null);
            }}
            error={error}
            helper={t('reg.passwordRule')}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
          />
        </View>
        <View style={styles.footer}>
          <PrimaryButton label={busy ? t('reset.busy') : t('reset.submit')} onPress={submit} disabled={busy} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  flex: { flex: 1 },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  title: { marginBottom: 24 },
  footer: { paddingHorizontal: 20, paddingVertical: 12 },
});
