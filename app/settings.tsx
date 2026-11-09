/**
 * Settings.
 *
 * Not in the handoff — added because three things the app can do had no way to
 * reach them: the light/dark choice (both skins are specified, but nothing let a
 * member pick), the two notification preferences already on the member row, and
 * the monthly target behind the Stats ring (§6 gap 1, which the handoff flags as
 * needing a screen).
 *
 * Pushed over the tabs rather than added as a sixth one — the tab bar is fixed
 * at five in the design, and settings is a place you leave again.
 */

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { kmWhole } from '@/data/format';
import { useAuth } from '@/state/AuthProvider';
import { useClan } from '@/state/ClanProvider';
import { APPEARANCE_OPTIONS, usePalette, useTheme } from '@/theme/ThemeProvider';
import { brand, space } from '@/theme/tokens';
import { ScreenIn } from '@/ui/Layout';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { Segmented } from '@/ui/Segmented';
import { SettingRow, SettingsSection, ToggleRow } from '@/ui/SettingRow';
import { SecondaryButton } from '@/ui/Button';
import { FormField } from '@/ui/Field';
import { Txt } from '@/ui/Txt';
import { t, useI18n } from '@/i18n';
import { notificationsAllowed, registerForPush } from '@/data/notifications';
import { useToast } from '@/ui/Toast';

/** Monthly volume targets, in kilometres. */
const TARGETS = [100, 125, 150, 175, 200, 250];
const KIT_OPTIONS = ['XS', 'S', 'M', 'L', 'XL'].map((value) => ({ value, label: value }));

export default function Settings() {
  const p = usePalette();
  const router = useRouter();
  const { preference, setPreference } = useTheme();
  const { me, stats, updateProfile } = useClan();
  const { signOut } = useAuth();
  const toast = useToast();
  const { preference: languagePreference, setPreference: setLanguagePreference } = useI18n();

  const [contactName, setContactName] = useState(me?.emergency_contact_name ?? '');
  const [contactPhone, setContactPhone] = useState(me?.emergency_contact_phone ?? '');
  // Settings can open before the profile has loaded, e.g. on a reload.
  useEffect(() => {
    setContactName(me?.emergency_contact_name ?? '');
    setContactPhone(me?.emergency_contact_phone ?? '');
  }, [me?.emergency_contact_name, me?.emergency_contact_phone]);
  const contactDirty =
    contactName.trim() !== (me?.emergency_contact_name ?? '') ||
    contactPhone.trim() !== (me?.emergency_contact_phone ?? '');

  const targetKm = Math.round((me?.monthly_target_m ?? 150000) / 1000);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: p.paper }]} edges={['top']}>
      {/* Settings can be the first screen in the history — a deep link, a
          notification, or a reload while sitting on it. Popping an empty stack
          does nothing, so fall back to the tab it belongs to. */}
      <ScreenHeader
        kicker={me ? t('settings.member', { n: me.member_number }) : undefined}
        title={t('settings.title')}
        actionLabel={t('common.back')}
        onAction={() =>
          router.canGoBack() ? router.back() : router.replace('/(tabs)/you')
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenIn>
          <SettingsSection title={t('settings.appearance')}>
            <View style={styles.control}>
              <Segmented
                options={APPEARANCE_OPTIONS.map((o) => ({ ...o, label: t(`settings.${o.value}`) }))}
                value={preference}
                onChange={setPreference}
              />
              <Txt role="appMeta" muted style={styles.help}>
                {t('settings.appearanceHelp')}
              </Txt>
            </View>
          </SettingsSection>

          <SettingsSection title={t('settings.language')}>
            <View style={styles.control}>
              <Segmented
                options={[
                  { value: 'system' as const, label: t('settings.langSystem') },
                  // Already capitals: each language's name keeps its own spelling.
                  { value: 'en' as const, label: 'ENGLISH' },
                  { value: 'tr' as const, label: 'TÜRKÇE' },
                ]}
                value={languagePreference}
                onChange={setLanguagePreference}
              />
              <Txt role="appMeta" muted style={styles.help}>
                {t('settings.langHelp')}
              </Txt>
            </View>
          </SettingsSection>

          <SettingsSection title={t('settings.notifications')}>
            <ToggleRow
              label={t('settings.runDay')}
              description={t('settings.runDayHelp')}
              value={me?.notify_run_day ?? true}
              onChange={(v) => {
                updateProfile({ notify_run_day: v });
                if (v) {
                  void notificationsAllowed(true).then((ok) => {
                    if (ok) void registerForPush();
                    else if (Platform.OS !== 'web') toast.show(t('settings.notifDenied'), 'info');
                  });
                }
              }}
            />
            <ToggleRow
              label={t('settings.comments')}
              description={t('settings.commentsHelp')}
              value={me?.notify_chat ?? true}
              onChange={(v) => updateProfile({ notify_chat: v })}
            />
          </SettingsSection>

          <SettingsSection title={t('settings.target')}>
            <View style={styles.control}>
              <View style={styles.targets}>
                {TARGETS.map((km) => {
                  const active = km === targetKm;
                  return (
                    <Pressable
                      key={km}
                      onPress={() => updateProfile({ monthly_target_m: km * 1000 })}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={t('settings.targetLabel', { km })}
                      style={({ pressed }) => [
                        styles.target,
                        {
                          backgroundColor: active ? brand.accent : p.surface,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Txt role="stat15" color={active ? '#ffffff' : p.text}>
                        {km}
                      </Txt>
                    </Pressable>
                  );
                })}
              </View>
              <Txt role="appMeta" muted style={styles.help}>
                {stats
                  ? t('settings.targetHelp', { km: kmWhole(stats.month_distance_m) })
                  : t('settings.targetHelpEmpty')}
              </Txt>
            </View>
          </SettingsSection>

          <SettingsSection title={t('settings.kit')}>
            <View style={styles.control}>
              <Segmented
                options={KIT_OPTIONS}
                value={me?.kit_size ?? ''}
                onChange={(kit_size) => updateProfile({ kit_size })}
              />
            </View>
          </SettingsSection>

          <SettingsSection title={t('settings.emergency')}>
            <View style={styles.control}>
              <FormField
                label={t('settings.contactName')}
                value={contactName}
                onChangeText={setContactName}
                autoComplete="name"
                textContentType="name"
              />
              <FormField
                label={t('settings.contactPhone')}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                helper={t('settings.contactHelp')}
              />
              <SecondaryButton
                label={t(contactDirty ? 'settings.saveContact' : 'common.saved')}
                disabled={!contactDirty || !contactName.trim() || !contactPhone.trim()}
                onPress={() =>
                  updateProfile({
                    emergency_contact_name: contactName.trim(),
                    emergency_contact_phone: contactPhone.trim(),
                  })
                }
              />
            </View>
          </SettingsSection>

          <SettingsSection title={t('settings.account')}>
            <SettingRow label={t('settings.memberNumber')} value={me ? `#${me.member_number}` : '—'} />
            <SettingRow label={t('settings.email')} value={me?.email ?? '—'} />
            <SettingRow
              label={t('settings.signOut')}
              danger
              onPress={() => {
                // Alert.alert does nothing in the browser.
                if (Platform.OS === 'web') {
                  if (window.confirm(t('settings.signOutConfirm'))) void signOut();
                  return;
                }
                Alert.alert(t('settings.signOut'), t('settings.signOutConfirm'), [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('settings.signOut'), style: 'destructive', onPress: () => void signOut() },
                ]);
              }}
            />
          </SettingsSection>
        </ScreenIn>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 40 },
  control: { paddingHorizontal: space.gutter, paddingTop: 8, paddingBottom: 18 },
  help: { marginTop: 10 },
  targets: { flexDirection: 'row', gap: 4 },
  target: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
