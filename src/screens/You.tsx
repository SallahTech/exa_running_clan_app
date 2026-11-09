/**
 * You — the profile header field, the pace-group control, and settings rows.
 *
 * The pace-group selection here is the same value the run sheet edits: one
 * selection, shared. Changing it also moves any RSVP the member has already made
 * so they don't end up listed under a group they've left.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { kmWhole, monthYear } from '@/data/format';
import { paceShort } from '@/data/types';
import { useClan } from '@/state/ClanProvider';
import { useScrollReset } from '@/ui/useScrollReset';
import { usePalette, useTheme } from '@/theme/ThemeProvider';
import { brand, gradients, space } from '@/theme/tokens';
import { Gradient } from '@/ui/Gradient';
import { ScreenIn, SectionHeader, StatBlock } from '@/ui/Layout';
import { PaceSelector } from '@/ui/Segmented';
import { SettingRow } from '@/ui/SettingRow';
import { Txt } from '@/ui/Txt';
import { t, useI18n } from '@/i18n';

export function YouScreen() {
  const p = usePalette();
  const router = useRouter();
  const { me, pace, setPace, refresh } = useClan();
  const { preference } = useTheme();
  const { preference: languagePreference } = useI18n();
  const scroller = useScrollReset();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const rows = [
    {
      label: t('you.emergency'),
      value: me?.emergency_contact_name ? t('you.added') : t('common.notSet'),
    },
    { label: t('you.kit'), value: me?.kit_size ?? t('common.notSet') },
    {
      label: t('you.notifications'),
      value: notificationLabel(me?.notify_run_day, me?.notify_chat),
    },
  ];

  const [first = '', ...rest] = (me?.full_name ?? '').split(' ');

  return (
    <ScrollView
      ref={scroller}
      style={{ backgroundColor: p.paper }}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={brand.accent} />
      }
    >
      <ScreenIn>
        <Gradient colors={gradients.profile} angle="profile" style={styles.header}>
          <Txt role="appLabel" color="#ffffff">
            {t('you.since', { n: me?.member_number ?? '—', date: me ? monthYear(me.joined_at) : '—' })}
          </Txt>
          <Txt role="profileName" color="#fafafa" style={styles.name}>
            {first}
            {rest.length ? `\n${rest.join(' ')}` : ''}
          </Txt>

          <View style={styles.headerStats}>
            <StatBlock value={paceShort(pace)} label={t('you.paceGroup')} size="stat24" color="#fafafa" labelColor="rgba(250,250,250,0.65)" style={styles.third} />
            <StatBlock
              value={String(me?.clan_runs ?? 0)}
              label={t('you.clanRuns')}
              size="stat24"
              color="#fafafa"
              labelColor="rgba(250,250,250,0.65)"
              style={styles.third}
            />
            <StatBlock
              value={kmWhole(me?.year_distance_m ?? 0)}
              label={t('you.kmYear', { year: new Date().getFullYear() })}
              size="stat24"
              color="#fafafa"
              labelColor="rgba(250,250,250,0.65)"
              style={styles.third}
            />
          </View>
        </Gradient>

        <View style={styles.paceSection}>
          <SectionHeader title={t('you.paceGroup')} action={t('you.minKm')} style={styles.paceTitle} />
          <PaceSelector value={pace} onChange={setPace} />
          <Txt role="appMeta" muted style={styles.paceHelp}>
            {t('you.paceHelp')}
          </Txt>
        </View>

        <View style={styles.rowsGap} />

        {/* Every one of them is something Settings can
            change, so they lead there rather than sitting as dead text. */}
        {rows.map((r) => (
          <SettingRow
            key={r.label}
            label={r.label}
            value={r.value}
            trailing
            onPress={() => router.push('/settings')}
          />
        ))}

        <SettingRow
          label={t('you.language')}
          value={languagePreference === 'system' ? t('settings.langSystem') : languagePreference === 'tr' ? 'Türkçe' : 'English'}
          trailing
          onPress={() => router.push('/settings')}
        />
        <SettingRow
          label={t('you.appearance')}
          value={t(preference === 'system' ? 'settings.system' : preference === 'dark' ? 'settings.dark' : 'settings.light')}
          trailing
          onPress={() => router.push('/settings')}
        />
        <SettingRow label={t('common.settings')} trailing onPress={() => router.push('/settings')} />
      </ScreenIn>
    </ScrollView>
  );
}

function notificationLabel(runDay?: boolean, chat?: boolean): string {
  if (runDay && chat) return t('you.runDayChat');
  if (runDay) return t('you.runDay');
  if (chat) return t('you.chat');
  return t('you.off');
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: space.block },
  header: { paddingHorizontal: space.gutter, paddingTop: 32, paddingBottom: 24 },
  name: { marginTop: 10 },
  headerStats: { flexDirection: 'row', marginTop: 32 },
  third: { flex: 1 },

  paceSection: { paddingHorizontal: space.gutter, paddingTop: space.block },
  paceTitle: { marginBottom: 14 },
  paceHelp: { marginTop: 10 },
  rowsGap: { height: 20 },
});
