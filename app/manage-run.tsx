/**
 * Leader tools for one run. Two scopes, kept visibly apart: what happens on this
 * date (cancel it, change it, tell people why), and what the run is every week.
 * Emergency contacts for the people going sit underneath, for leaders only.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as api from '@/data/api';
import { dayFull, timeOfDay } from '@/data/format';
import type { OccurrenceStatus, RunContact } from '@/data/types';
import { t } from '@/i18n';
import { useClan } from '@/state/ClanProvider';
import { usePalette } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';
import { PrimaryButton, SecondaryButton } from '@/ui/Button';
import { FormField } from '@/ui/Field';
import { SectionHeader } from '@/ui/Layout';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { Segmented } from '@/ui/Segmented';
import { useToast } from '@/ui/Toast';
import { Txt } from '@/ui/Txt';

const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

/** Reads "35.33, 33.31" or the @lat,lng / q=lat,lng in a full Google Maps link. */
export function parseLocation(input: string): { lat: number; lng: number } | null {
  const m = input.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

export default function ManageRun() {
  const p = usePalette();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { runs, isLeader, refresh } = useClan();
  const run = runs.find((r) => r.occurrence_id === id);

  const [status, setStatus] = useState<OccurrenceStatus>(run?.status ?? 'scheduled');
  const [notes, setNotes] = useState(run?.override_notes ?? '');
  const [dateMeet, setDateMeet] = useState('');
  const [busyDate, setBusyDate] = useState(false);

  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [location, setLocation] = useState('');
  const [after, setAfter] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [busyWeekly, setBusyWeekly] = useState(false);

  const [contacts, setContacts] = useState<RunContact[] | null>(null);
  const [contactsFailed, setContactsFailed] = useState(false);

  const seriesId = run?.series_id;

  useEffect(() => {
    if (!isLeader || !seriesId || !id) return;

    api
      .getSeries(seriesId)
      .then((s) => {
        setTitle(s.title);
        setTime(s.start_time.slice(0, 5));
        setPlace(s.meet_point_name);
        setLocation(s.meet_lat !== null ? `${s.meet_lat}, ${s.meet_lng}` : '');
        setAfter(s.after_label);
        setDescription(s.description);
      })
      .catch(() => toast.show(t('manage.failed')));
    api
      .getOccurrenceOverrides(id)
      .then((o) => setDateMeet(o.override_meet_point_name ?? ''))
      .catch(() => undefined);
    api
      .getRunContacts(id)
      .then(setContacts)
      .catch(() => setContactsFailed(true));
    // Loaded once: a background refresh must not overwrite what is being typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLeader, seriesId, id]);

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/runs');
  };

  const saveDate = async () => {
    if (!id) return;
    setBusyDate(true);
    try {
      await api.manageOccurrence({ occurrenceId: id, status, notes, meetPoint: dateMeet });
      api.notify({ type: 'run_changed', occurrence_id: id });
      await refresh();
      toast.show(t('manage.savedDate'), 'info');
      leave();
    } catch {
      toast.show(t('manage.failed'));
      setBusyDate(false);
    }
  };

  const saveWeekly = async () => {
    const next: typeof errors = {};
    if (!title.trim()) next.title = t('manage.nameError');
    if (!TIME_RE.test(time.trim())) next.time = t('manage.timeError');
    if (!place.trim()) next.place = t('manage.placeError');
    const coords = location.trim() ? parseLocation(location) : null;
    if (location.trim() && !coords) next.location = t('manage.locationError');
    setErrors(next);
    if (Object.values(next).some(Boolean) || !seriesId) return;

    setBusyWeekly(true);
    try {
      await api.updateSeries({
        seriesId,
        title,
        startTime: time.trim(),
        meetPoint: place,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        after,
        description,
      });
      await refresh();
      toast.show(t('manage.savedWeekly'), 'info');
    } catch {
      toast.show(t('manage.failed'));
    }
    setBusyWeekly(false);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: p.paper }]} edges={['top', 'bottom']}>
      <ScreenHeader
        kicker={t('manage.kicker')}
        title={run?.title ?? t('run.detailsFallback')}
        actionLabel={t('common.back')}
        onAction={leave}
      />

      {!isLeader || !run ? (
        <Txt role="appBody" muted style={styles.notAllowed}>
          {t('manage.notAllowed')}
        </Txt>
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            <SectionHeader title={t('manage.date')} action={`${dayFull(run.starts_at)} ${timeOfDay(run.starts_at)}`} style={styles.header} />
            <View style={styles.control}>
              <Segmented
                options={[
                  { value: 'scheduled' as const, label: t('manage.onTrack') },
                  { value: 'moved' as const, label: t('manage.statusChanged') },
                  { value: 'cancelled' as const, label: t('manage.statusCancelled') },
                ]}
                value={status}
                onChange={setStatus}
              />
            </View>
            <FormField
              label={t('manage.notice')}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('manage.noticePlaceholder')}
              multiline
            />
            <FormField
              label={t('manage.meetDate')}
              value={dateMeet}
              onChangeText={setDateMeet}
              helper={t('manage.meetDateHelp')}
            />
            <PrimaryButton
              label={busyDate ? t('manage.busy') : t('manage.saveDate')}
              onPress={saveDate}
              disabled={busyDate}
            />

            <SectionHeader title={t('manage.weekly')} style={styles.section} />
            <Txt role="appMeta" muted style={styles.help}>
              {t('manage.weeklyHelp')}
            </Txt>
            <FormField label={t('manage.name')} value={title} onChangeText={setTitle} error={errors.title} />
            <FormField
              label={t('manage.time')}
              value={time}
              onChangeText={setTime}
              error={errors.time}
              placeholder="19:00"
              keyboardType="numbers-and-punctuation"
            />
            <FormField label={t('manage.place')} value={place} onChangeText={setPlace} error={errors.place} />
            <FormField
              label={t('manage.location')}
              value={location}
              onChangeText={setLocation}
              error={errors.location}
              helper={t('manage.locationHelp')}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <FormField label={t('manage.after')} value={after} onChangeText={setAfter} />
            <FormField label={t('manage.description')} value={description} onChangeText={setDescription} multiline />
            <SecondaryButton
              label={busyWeekly ? t('manage.busy') : t('manage.saveWeekly')}
              onPress={saveWeekly}
              disabled={busyWeekly}
            />

            <SectionHeader title={t('manage.contacts')} style={styles.section} />
            <Txt role="appMeta" muted style={styles.help}>
              {contactsFailed ? t('manage.contactsFailed') : t('manage.contactsHelp')}
            </Txt>
            {contacts?.length === 0 ? (
              <Txt role="appBody" muted>
                {t('manage.nobody')}
              </Txt>
            ) : null}
            {contacts?.map((c) => (
              <View key={c.member_id} style={[styles.contact, { borderBottomColor: p.hairline }]}>
                <View style={styles.contactText}>
                  <Txt role="listTitle">{c.name}</Txt>
                  <Txt role="appMeta" muted>
                    {c.contact_name ?? t('manage.noContact')}
                  </Txt>
                </View>
                {c.contact_phone ? (
                  <Pressable
                    onPress={() => void Linking.openURL(`tel:${c.contact_phone?.replace(/\s/g, '')}`)}
                    accessibilityRole="button"
                    accessibilityLabel={t('manage.callLabel', { name: c.contact_name ?? c.name })}
                    style={({ pressed }) => [styles.call, { opacity: pressed ? 0.6 : 1 }]}
                  >
                    <Txt role="appMetaBold" color={p.accentText}>
                      {c.contact_phone}
                    </Txt>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: space.gutter, paddingBottom: space.block },
  notAllowed: { paddingHorizontal: space.gutter },
  header: { marginTop: 8, marginBottom: 14 },
  control: { marginBottom: 18 },
  section: { marginTop: space.block, marginBottom: 8 },
  help: { marginBottom: 16 },
  contact: {
    minHeight: 56,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contactText: { flex: 1, gap: 2 },
  call: { minHeight: 44, justifyContent: 'center' },
});
