/**
 * Sign in.
 *
 * The prototype implements no validation; this does the minimum production
 * needs — an email that looks like one, a non-empty password, and a readable
 * message when the server rejects the pair.
 */

import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/state/AuthProvider';
import { brand } from '@/theme/tokens';
import { PrimaryButton } from '@/ui/Button';
import { Field } from '@/ui/Field';
import { Txt } from '@/ui/Txt';
import { t } from '@/i18n';

const LOGO = require('../../assets/exa-logo.png');

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function SignIn() {
  const router = useRouter();
  const { signIn, resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const submit = async () => {
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = t('auth.emailInvalid');
    if (!password) next.password = t('signin.passwordMissing');
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      await signIn(email, password);
      // The guard in app/_layout.tsx moves us into the app once the session lands.
    } catch (e) {
      setErrors({ form: readable(e) });
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!EMAIL_RE.test(email.trim())) {
      setErrors({ email: t('signin.forgotNeedsEmail') });
      return;
    }
    try {
      await resetPassword(email);
      setErrors({ form: t('signin.resetSent') });
    } catch (e) {
      setErrors({ form: readable(e) });
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Image source={LOGO} style={styles.mark} accessibilityLabel={t('common.logo')} />
          <Txt role="kicker9" color="#8d8d92">
            {t('common.clubName')}
          </Txt>
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <Txt role="authTitle" color="#f2f2f4" style={styles.title}>
            {t('signin.headline')}
          </Txt>
          <Txt role="body" color="#8d8d92" style={styles.sub}>
            {t('signin.sub')}
          </Txt>

          <Field
            label={t('auth.email')}
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              setErrors((e) => ({ ...e, email: undefined }));
            }}
            error={errors.email}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <Field
            label={t('auth.password')}
            inputRef={passwordRef}
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setErrors((e) => ({ ...e, password: undefined }));
            }}
            error={errors.password}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={submit}
            returnKeyType="go"
          />

          <View style={styles.rememberRow}>
            <Pressable onPress={forgot} accessibilityRole="button" style={styles.forgot}>
              <Txt role="button11" color={brand.accent}>
                {t('signin.forgot')}
              </Txt>
            </Pressable>
          </View>

          {errors.form ? (
            <Txt role="micro" color={brand.accentOnDark} style={styles.formError}>
              {errors.form}
            </Txt>
          ) : null}

          <PrimaryButton label={t(busy ? 'signin.busy' : 'signin.submit')} onPress={submit} disabled={busy} />
        </ScrollView>

        <Pressable
          onPress={() => router.replace('/(auth)/register')}
          accessibilityRole="button"
          style={styles.footer}
        >
          <Txt role="body12" color="#8d8d92">
            {t('signin.newHere')}{' '}
            <Txt role="listTitle12" color={brand.accent}>
              {t('signin.create')}
            </Txt>
          </Txt>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function readable(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/invalid login credentials/i.test(msg)) return t('signin.badCredentials');
  if (/email not confirmed/i.test(msg)) return t('signin.unconfirmed');
  if (/fetch|network/i.test(msg)) return t('auth.offline');
  return msg;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  mark: { width: 52, height: 52, resizeMode: 'contain' },
  body: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 24, flexGrow: 1, justifyContent: 'center' },
  title: { marginBottom: 6, fontSize: 32 },
  sub: { marginBottom: 22 },
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
  },
  forgot: { minHeight: 44, paddingLeft: 12, justifyContent: 'center' },
  formError: { marginBottom: 12 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
});
