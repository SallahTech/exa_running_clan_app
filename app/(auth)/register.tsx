/**
 * Register — three steps behind one progress track.
 *
 * The prototype steps through without validating anything. Production needs
 * more, and the handoff says which: email format, password length ≥ 8, and a
 * required pace group before continuing past step 2. Each is enforced on the
 * step that collects it, so nobody reaches step 3 with a broken account.
 */

import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PACE_GROUPS, type PaceGroup } from '@/data/types';
import { useAuth } from '@/state/AuthProvider';
import { brand, motion } from '@/theme/tokens';
import { PrimaryButton } from '@/ui/Button';
import { Field } from '@/ui/Field';
import { Txt } from '@/ui/Txt';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { EMAIL_RE } from './sign-in';
import { t } from '@/i18n';

const LOGO = require('../../assets/exa-logo.png');

/** Typical turnout per group, shown as "N runners". */
const DAYS = [
  { id: 'wed' as const, day: 'reg.wed' as const, label: 'reg.wedLabel' as const },
  { id: 'sun' as const, day: 'reg.sun' as const, label: 'reg.sunLabel' as const },
];

export default function Register() {
  const router = useRouter();
  const { register } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pace, setPace] = useState<PaceGroup | null>(null);
  const [days, setDays] = useState({ wed: true, sun: true });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [busy, setBusy] = useState(false);

  const bar = useRef(new Animated.Value(1 / 3)).current;
  useEffect(() => {
    Animated.timing(bar, {
      toValue: step / 3,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step, bar]);

  const back = () => {
    setErrors({});
    if (step === 1) router.replace('/(auth)/welcome');
    else setStep((s) => (s - 1) as 1 | 2);
  };

  const next = async () => {
    if (step === 1) {
      const e: Record<string, string> = {};
      if (name.trim().length < 2) e.name = t('reg.nameMissing');
      if (!EMAIL_RE.test(email.trim())) e.email = t('auth.emailInvalid');
      if (password.length < 8) e.password = t('reg.passwordRule');
      setErrors(e);
      if (Object.keys(e).length === 0) setStep(2);
      return;
    }

    if (step === 2) {
      // A pace group is required before continuing.
      if (!pace) {
        setErrors({ pace: t('reg.paceMissing') });
        return;
      }
      setErrors({});
      setStep(3);
      return;
    }

    setBusy(true);
    try {
      const { needsConfirmation } = await register({
        fullName: name,
        email,
        password,
        paceGroup: pace ?? 'open',
        days,
      });
      router.replace({
        pathname: '/(auth)/done',
        params: {
          name: name.trim().split(' ')[0] ?? '',
          pace: pace ?? 'open',
          ...(needsConfirmation ? { confirmEmail: email.trim() } : null),
        },
      });
    } catch (e) {
      setErrors({ form: readable(e) });
      setBusy(false);
    }
  };

  const width = bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={LOGO} style={styles.mark} accessibilityLabel={t('common.logo')} />
            <View>
              <Txt role="kicker9" color={brand.accent}>
                {t('reg.step', { n: step })}
              </Txt>
              <Txt role="listTitle14" color="#f2f2f4">
                {t('reg.join')}
              </Txt>
            </View>
          </View>
          <Pressable onPress={back} accessibilityRole="button" style={styles.back}>
            <Txt role="button11" color="#8d8d92">
              {t('common.back')}
            </Txt>
          </Pressable>
        </View>

        <View
          style={styles.track}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: 3, now: step }}
        >
          <Animated.View style={[styles.trackFill, { width }]} />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          <StepIn key={step}>
            {step === 1 ? (
              <>
                <Txt role="stepTitle" color="#f2f2f4" style={styles.title}>
                  {t('reg.who')}
                </Txt>
                <Field
                  label={t('reg.fullName')}
                  value={name}
                  onChangeText={(v) => {
                    setName(v);
                    setErrors((e) => ({ ...e, name: '' }));
                  }}
                  error={errors.name}
                  placeholder={t('reg.namePlaceholder')}
                  autoComplete="name"
                  textContentType="name"
                />
                <Field
                  label={t('auth.email')}
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    setErrors((e) => ({ ...e, email: '' }));
                  }}
                  error={errors.email}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
                <Field
                  label={t('auth.password')}
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    setErrors((e) => ({ ...e, password: '' }));
                  }}
                  error={errors.password}
                  helper={t('reg.passwordRule')}
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                />
                <Txt role="micro115" color="#8d8d92" style={styles.helper}>
                  {t('reg.emailUse')}
                </Txt>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <Txt role="stepTitle" color="#f2f2f4" style={styles.titleTight}>
                  {t('reg.paceTitle')}
                </Txt>
                <Txt role="body125" color="#8d8d92" style={styles.sub}>
                  {t('reg.paceSub')}
                </Txt>

                <View style={styles.options}>
                  {PACE_GROUPS.map((g) => (
                    <OptionRow
                      key={g}
                      selected={pace === g}
                      onPress={() => {
                        setPace(g);
                        setErrors({});
                      }}
                      accessibilityLabel={g === 'open' ? t('reg.ownPaceLabel') : t('reg.minKmLabel', { pace: g })}
                      left={
                        <Txt role="stat18" color={pace === g ? '#ffffff' : '#f2f2f4'} style={styles.paceLabel}>
                          {g === 'open' ? t('pace.ownLong') : g}
                        </Txt>
                      }
                      right={
                        <Txt
                          role="micro"
                          color={pace === g ? 'rgba(255,255,255,0.72)' : '#8d8d92'}
                        >
                          {g === 'open' ? t('reg.ownPaceHint') : t('reg.minKm')}
                        </Txt>
                      }
                    />
                  ))}
                </View>

                {errors.pace ? (
                  <Txt role="micro" color={brand.accentOnDark} style={styles.helper}>
                    {errors.pace}
                  </Txt>
                ) : (
                  <Txt role="micro115" color="#8d8d92" style={styles.helper}>
                    {t('reg.paceHelp')}
                  </Txt>
                )}
              </>
            ) : null}

            {step === 3 ? (
              <>
                <Txt role="stepTitle" color="#f2f2f4" style={styles.titleTight}>
                  {t('reg.runsTitle')}
                </Txt>
                <Txt role="body125" color="#8d8d92" style={styles.sub}>
                  {t('reg.runsSub')}
                </Txt>

                <View style={styles.options}>
                  {DAYS.map((d) => (
                    <OptionRow
                      key={d.id}
                      selected={days[d.id]}
                      onPress={() => setDays((s) => ({ ...s, [d.id]: !s[d.id] }))}
                      accessibilityLabel={`${t(d.day)}, ${t(d.label)}`}
                      left={
                        <View>
                          <Txt role="listTitle" color={days[d.id] ? '#ffffff' : '#f2f2f4'}>
                            {t(d.day)}
                          </Txt>
                          <Txt
                            role="micro115"
                            color={days[d.id] ? 'rgba(255,255,255,0.75)' : '#8d8d92'}
                          >
                            {t(d.label)}
                          </Txt>
                        </View>
                      }
                      right={
                        days[d.id] ? (
                          <Txt role="listTitle12" color="#ffffff">
                            ✓
                          </Txt>
                        ) : null
                      }
                    />
                  ))}
                </View>

                {errors.form ? (
                  <Txt role="micro" color={brand.accentOnDark} style={styles.helper}>
                    {errors.form}
                  </Txt>
                ) : null}
              </>
            ) : null}
          </StepIn>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={step === 3 ? t(busy ? 'reg.busy' : 'reg.submit') : t('reg.continue')}
            onPress={next}
            disabled={busy}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Each step fades and rises in — `scin`, 300ms. */
function StepIn({ children }: { children: React.ReactNode }) {
  const t = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    Animated.timing(t, {
      toValue: 1,
      duration: reduced ? 0 : motion.screenIn,
      useNativeDriver: true,
    }).start();
  }, [t, reduced]);

  return (
    <Animated.View
      style={{
        opacity: t,
        transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

function OptionRow({
  selected,
  onPress,
  left,
  right,
  accessibilityLabel,
}: {
  selected: boolean;
  onPress: () => void;
  left: React.ReactNode;
  right: React.ReactNode;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.option,
        {
          backgroundColor: selected ? brand.accent : 'transparent',
          borderColor: selected ? brand.accent : 'rgba(255,255,255,0.22)',
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {left}
      {right}
    </Pressable>
  );
}

function readable(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/already registered|already exists/i.test(msg))
    return t('reg.emailTaken');
  if (/password/i.test(msg)) return t('reg.passwordRejected');
  if (/fetch|network/i.test(msg)) return t('auth.offline');
  return msg;
}

const styles = StyleSheet.create({
  back: { minHeight: 44, minWidth: 44, alignItems: 'flex-end', justifyContent: 'center' },
  root: { flex: 1, backgroundColor: '#000000' },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mark: { width: 40, height: 40, resizeMode: 'contain' },

  track: { height: 3, backgroundColor: '#1b1b1f' },
  trackFill: { height: 3, backgroundColor: brand.accent },

  body: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 24 },
  title: { marginBottom: 18 },
  titleTight: { marginBottom: 6 },
  sub: { marginBottom: 18 },
  helper: { marginTop: 12 },

  options: { gap: 8 },
  option: {
    borderWidth: 1,
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paceLabel: { fontSize: 17 },


  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
});
