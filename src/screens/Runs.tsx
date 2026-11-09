/**
 * Schedule — the two standing weekly runs, plus the race calendar.
 *
 * Weekly rows are the same records Home shows, so an RSVP made here moves the
 * count on Home too.
 */

import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { dayFull, raceDate, timeOfDay } from '@/data/format';
import type { Race, RunSummary } from '@/data/types';
import { useClan } from '@/state/ClanProvider';
import { useScrollReset } from '@/ui/useScrollReset';
import { usePalette } from '@/theme/ThemeProvider';
import { brand, space } from '@/theme/tokens';
import { SecondaryButton, StateChip } from '@/ui/Button';
import { ScreenIn } from '@/ui/Layout';
import { Segmented } from '@/ui/Segmented';
import { Txt } from '@/ui/Txt';
import { t } from '@/i18n';
import * as api from '@/data/api';

type Tab = 'weekly' | 'races';

export function RunsScreen() {
  const p = usePalette();
  const router = useRouter();
  const { runs, races, openRun, refresh, toggleRace, isLeader } = useClan();
  const [tab, setTab] = useState<Tab>('weekly');
  const scroller = useScrollReset();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

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
        <View style={styles.head}>
          <Txt role="screenTitle">{t('runs.title')}</Txt>
          <Txt role="appBody" muted style={styles.subtitle}>
            {t('runs.sub')}
          </Txt>
        </View>

        <View style={styles.segmentWrap}>
          <Segmented
            options={[
              { value: 'weekly' as const, label: t('runs.weekly') },
              { value: 'races' as const, label: t('runs.races') },
            ]}
            value={tab}
            onChange={setTab}
          />
        </View>

        {tab === 'weekly'
          ? runs.slice(0, 2).map((r) => (
              <WeeklyBlock key={r.occurrence_id} run={r} onPress={() => openRun(r.occurrence_id)} />
            ))
          : races.map((r) => (
              <RaceRow
                key={r.id}
                race={r}
                onToggle={() => toggleRace(r.id)}
                onRemove={
                  isLeader
                    ? async () => {
                        await api.deleteRace(r.id).catch(() => undefined);
                        await refresh();
                      }
                    : undefined
                }
              />
            ))}

        {tab === 'races' && isLeader ? (
          <View style={styles.addRace}>
            <SecondaryButton label={t('runs.addRace')} trailing="+" onPress={() => router.push('/add-race')} />
          </View>
        ) : null}

        {tab === 'weekly' && runs.length === 0 ? (
          <View style={styles.empty}>
            <Txt role="appBody" muted>
              {t('home.noRuns')}
            </Txt>
          </View>
        ) : null}

        {tab === 'races' && races.length === 0 ? (
          <View style={styles.empty}>
            <Txt role="appBody" muted>
              {t('runs.noRaces')}
            </Txt>
          </View>
        ) : null}
      </ScreenIn>
    </ScrollView>
  );
}

function WeeklyBlock({ run, onPress }: { run: RunSummary; onPress: () => void }) {
  const p = usePalette();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${run.title}, ${dayFull(run.starts_at)} ${timeOfDay(run.starts_at)}, ${t('run.going', { n: run.going_count })}${run.my_rsvp?.state === 'going' ? t('run.youreIn') : ''}`}
      style={({ pressed }) => [
        styles.block,
        { backgroundColor: p.surface, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.blockHead}>
        <Txt role="appLabel" color={p.accentText}>
          {dayFull(run.starts_at)} · {timeOfDay(run.starts_at)}
        </Txt>
        <StateChip going={run.my_rsvp?.state === 'going'} status={run.status} />
      </View>

      <Txt
        role="cardTitle24"
        style={[styles.blockTitle, run.status === 'cancelled' ? styles.struck : null]}
      >
        {run.title}
      </Txt>
      <Txt role="appMeta" muted style={styles.blockMeta}>
        {run.meet_point} · {run.distance_label} · {run.surface}
      </Txt>

      {run.override_notes ? (
        <Txt role="appMeta" color={p.accentText} style={styles.notes}>
          {run.override_notes}
        </Txt>
      ) : null}

      <View style={styles.blockFoot}>
        <Txt role="appMetaBold">{t('run.going', { n: run.going_count })}</Txt>
        <Txt role="appMeta" muted style={styles.after} numberOfLines={1}>
          {t('run.after', { what: run.after_label })}
        </Txt>
      </View>
    </Pressable>
  );
}

function RaceRow({
  race,
  onToggle,
  onRemove,
}: {
  race: Race;
  onToggle: () => void;
  onRemove?: () => void;
}) {
  const p = usePalette();
  const details = [race.location, race.note, t('runs.signedUp', { n: race.entry_count })]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.block, { backgroundColor: p.surface }]}>
      <View style={styles.blockHead}>
        <Txt role="appLabel" color={p.accentText}>
          {raceDate(race.race_date)}
        </Txt>
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityState={{ selected: race.i_am_entered }}
          accessibilityLabel={`${race.name}, ${t(race.i_am_entered ? 'runs.joined' : 'runs.join')}`}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <StateChip going={race.i_am_entered} label={t(race.i_am_entered ? 'runs.joined' : 'runs.join')} />
        </Pressable>
      </View>
      <Txt role="appTitle" style={styles.blockTitle}>
        {race.name}
      </Txt>
      <Txt role="appMeta" muted style={styles.blockMeta}>
        {details}
      </Txt>

      {race.signup_url || onRemove ? (
        <View style={styles.blockFoot}>
          {race.signup_url ? (
            <Pressable
              onPress={() => void Linking.openURL(race.signup_url ?? '').catch(() => undefined)}
              accessibilityRole="link"
              hitSlop={12}
            >
              <Txt role="appMetaBold" color={p.accentText}>
                {t('runs.signupPage')}
              </Txt>
            </Pressable>
          ) : (
            <View />
          )}
          {onRemove ? (
            <Pressable onPress={onRemove} accessibilityRole="button" hitSlop={12}>
              <Txt role="appMeta" muted>
                {t('runs.removeRace')}
              </Txt>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: space.block },
  head: { paddingHorizontal: space.gutter, paddingTop: 16, paddingBottom: 20 },
  subtitle: { marginTop: 8 },
  segmentWrap: { paddingHorizontal: space.gutter, marginBottom: 16 },

  block: { marginHorizontal: space.gutter, marginBottom: 8, padding: 16 },
  blockHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  blockTitle: { marginTop: 8 },
  blockMeta: { marginTop: 4 },
  notes: { marginTop: 8 },
  blockFoot: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  after: { flexShrink: 1 },

  struck: { textDecorationLine: 'line-through' },
  addRace: { paddingHorizontal: space.gutter, paddingTop: 8 },

  empty: { paddingHorizontal: space.gutter },
});
