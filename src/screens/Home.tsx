/**
 * Home — "know what the next run is and commit to it in one tap".
 *
 * The hero countdown ticks every second toward the next scheduled occurrence.
 * The RSVP button, the chip on that run's row in the list below, and the sheet
 * footer are three views of one record, so toggling any of them moves all three
 * and the going count at once.
 */

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { countdownTo, dayFull, km, kmWhole, movingTime, timeOfDay } from '@/data/format';
import { paceName, type RunSummary } from '@/data/types';
import { useClan } from '@/state/ClanProvider';
import { useScrollReset } from '@/ui/useScrollReset';
import { usePalette } from '@/theme/ThemeProvider';
import { brand, gradients, heroScrim, space } from '@/theme/tokens';
import { CrewStack } from '@/ui/Avatar';
import { PrimaryButton, StateChip } from '@/ui/Button';
import { ChallengeBar } from '@/ui/Charts';
import { Gradient } from '@/ui/Gradient';
import { ScreenIn, SectionHeader, StatBlock } from '@/ui/Layout';
import { Photo } from '@/ui/Photo';
import { Txt } from '@/ui/Txt';
import { t } from '@/i18n';

const HERO_FIELD = ['#7a0f18', '#3a070c', '#000000'] as const;

export function HomeScreen() {
  const p = usePalette();
  const { runs, nextRun, stats, challenge, me, pace, toggleRsvp, openRun, refresh } = useClan();
  const router = useRouter();
  const scroller = useScrollReset();
  const [refreshing, setRefreshing] = useState(false);
  const dayLetters = t('home.dayLetters').split(',');
  const dayNames = t('home.dayNames').split(',');
  const todayIndex = (new Date().getDay() + 6) % 7;

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
        {nextRun ? (
          <Hero run={nextRun} going={nextRun.my_rsvp?.state === 'going'} onRsvp={() => toggleRsvp(nextRun.occurrence_id)} />
        ) : null}

        <View style={styles.block}>
          <SectionHeader title={t('home.comingUp')} style={styles.blockHeader} />
          <View style={styles.tiles}>
            {runs.slice(0, 2).map((r) => (
              <RunRow key={r.occurrence_id} run={r} onPress={() => openRun(r.occurrence_id)} />
            ))}
          </View>
          {runs.length === 0 ? (
            <Txt role="appBody" muted>
              {t('home.noRuns')}
            </Txt>
          ) : null}
        </View>

        <View style={styles.block}>
          <SectionHeader
            title={t('home.yourWeek')}
            action={t('home.logRun')}
            onAction={() => router.push('/log-run')}
            style={styles.blockHeader}
          />

          <View style={styles.dayStrip}>
            {dayLetters.map((letter, i) => {
              const ran = stats?.week.days?.[i] ?? false;
              const today = i === todayIndex;
              const label = `${dayNames[i]}${today ? t('home.today') : ''}, ${t(ran ? 'home.ran' : 'home.noRun')}`;
              return ran ? (
                <Gradient
                  key={i}
                  colors={gradients.primary}
                  style={styles.dayCell}
                  accessible
                  accessibilityLabel={label}
                >
                  <Txt role="listTitle" color="#ffffff">
                    {letter}
                  </Txt>
                </Gradient>
              ) : (
                <View
                  key={i}
                  accessible
                  accessibilityLabel={label}
                  style={[styles.dayCell, { backgroundColor: today ? p.raised : p.surface }]}
                >
                  <Txt role="listTitle" color={today ? p.text : p.muted}>
                    {letter}
                  </Txt>
                </View>
              );
            })}
          </View>

          <View style={styles.threeUp}>
            <StatBlock value={km(stats?.week.distance_m ?? 0)} label={t('home.km')} style={styles.third} />
            <StatBlock value={String(stats?.week.runs ?? 0)} label={t('home.runs')} style={styles.third} />
            <StatBlock
              value={movingTime(stats?.week.moving_seconds ?? 0)}
              label={t('home.moving')}
              style={styles.third}
            />
          </View>
        </View>

        {challenge ? (
          <View style={[styles.challenge, { backgroundColor: p.surface }]}>
            <View style={styles.challengeHead}>
              <Txt role="appLabel" muted style={styles.challengeLabel}>
                {challenge.short_label}
              </Txt>
              <Txt role="appMetaBold">
                {kmWhole(challenge.progress_m)} / {kmWhole(challenge.target_m)} km
              </Txt>
            </View>
            <ChallengeBar pct={(challenge.progress_m / challenge.target_m) * 100} />
            <Txt role="appMeta" muted>
              {t('home.challengeLine', { n: challenge.days_left })}
            </Txt>
          </View>
        ) : null}
      </ScreenIn>
    </ScrollView>
  );
}

/** The opening block: the next run, the live countdown, and the one-tap commitment. */
function Hero({ run, going, onRsvp }: { run: RunSummary; going: boolean; onRsvp: () => void }) {
  const [now, setNow] = useState(() => Date.now());

  // The countdown is live — recomputed every second from the next occurrence.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const cd = countdownTo(run.starts_at, now);
  const cells = [
    { v: cd.days, l: t('home.days') },
    { v: cd.hours, l: t('home.hrs') },
    { v: cd.minutes, l: t('home.min') },
    { v: cd.seconds, l: t('home.sec') },
  ];

  return (
    <View style={styles.hero}>
      {/* Club photography when there is some; otherwise the profile's red field,
          never a placeholder, because this is the first thing a member sees. */}
      {run.hero_photo_path ? (
        <>
          <Photo path={run.hero_photo_path} style={StyleSheet.absoluteFill} />
          <Gradient
            colors={heroScrim}
            angle="vertical"
            style={StyleSheet.absoluteFill}
            locations={[0, 0.45, 1]}
          />
        </>
      ) : (
        <Gradient colors={HERO_FIELD} angle="vertical" style={StyleSheet.absoluteFill} />
      )}

      <View style={styles.heroBody}>
        <Txt role="appLabel" color="#ffffff">
          {t('home.next', { day: dayFull(run.starts_at), time: timeOfDay(run.starts_at) })}
        </Txt>
        <Txt role="heroTitle" color="#ffffff" style={styles.heroTitle}>
          {run.title}
        </Txt>
        <Txt role="appMeta" color="rgba(255,255,255,0.75)">
          {run.subtitle}
        </Txt>
        {run.override_notes || run.status === 'moved' ? (
          <View style={styles.heroNotice}>
            <Txt role="appMetaBold" color="#ffffff">
              {run.override_notes ?? t('run.changedBanner')}
            </Txt>
          </View>
        ) : null}

        <View
          style={styles.countdown}
          accessible
          accessibilityLabel={t('home.startsIn', { d: cd.days, h: cd.hours, m: cd.minutes })}
        >
          {cells.map((c) => (
            <View key={c.l} style={styles.countCell}>
              <Txt role="stat40" color="#ffffff">
                {c.v}
              </Txt>
              <Txt role="appLabel" color="rgba(255,255,255,0.65)" style={styles.countLabel}>
                {c.l}
              </Txt>
            </View>
          ))}
        </View>

        <View style={styles.rsvpRow}>
          <PrimaryButton
            label={going && run.my_rsvp ? t('run.youreInPace', { pace: paceName(run.my_rsvp.pace_group) }) : t('run.countMeIn')}
            trailing={going ? '✓' : '→'}
            committed={going}
            onPress={onRsvp}
            full={false}
            style={styles.rsvpButton}
          />
          <View style={styles.goingCount}>
            <Txt role="stat24" color="#ffffff">
              {run.going_count}
            </Txt>
            <Txt role="appLabel" color="rgba(255,255,255,0.65)" style={styles.goingLabel}>
              {t('run.goingCaps')}
            </Txt>
          </View>
        </View>
      </View>
    </View>
  );
}

/** One tile per run: day and time, title, where, who's going, and your state. */
function RunRow({ run, onPress }: { run: RunSummary; onPress: () => void }) {
  const p = usePalette();
  const going = run.my_rsvp?.state === 'going';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${run.title}, ${dayFull(run.starts_at)} ${timeOfDay(run.starts_at)}, ${t('run.going', { n: run.going_count })}${going ? t('run.youreIn') : ''}`}
      style={({ pressed }) => [
        styles.runRow,
        { backgroundColor: p.surface, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.runTop}>
        <Txt role="appLabel" color={p.accentText}>
          {dayFull(run.starts_at)} · {timeOfDay(run.starts_at)}
        </Txt>
        <StateChip going={going} status={run.status} />
      </View>
      <Txt
        role="appTitle"
        style={[styles.runTitle, run.status === 'cancelled' ? styles.struck : null]}
      >
        {run.title}
      </Txt>
      <Txt role="appMeta" muted style={styles.runSub}>
        {run.subtitle}
      </Txt>
      {run.override_notes ? (
        <Txt role="appMetaBold" color={p.accentText} style={styles.runSub}>
          {run.override_notes}
        </Txt>
      ) : null}

      <View style={styles.crewRow}>
        <CrewStack initials={run.crew.map((c) => c.initials)} ringColor={p.surface} />
        <Txt role="appMeta" muted style={styles.crewCount}>
          {t('run.going', { n: run.going_count })}
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: space.block },

  hero: { minHeight: 430, justifyContent: 'flex-end', overflow: 'hidden' },
  heroBody: { padding: space.gutter, paddingTop: 48 },
  heroTitle: { marginTop: 10, marginBottom: 8 },
  countdown: { flexDirection: 'row', marginTop: 28 },
  countCell: { flex: 1 },
  countLabel: { marginTop: 6 },

  rsvpRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 24 },
  rsvpButton: { flex: 1 },
  goingCount: { alignItems: 'flex-end' },
  goingLabel: { marginTop: 4 },

  block: { paddingHorizontal: space.gutter, paddingTop: space.block },
  blockHeader: { marginBottom: 14 },
  tiles: { gap: 8 },

  runRow: { padding: 16 },
  runTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  runTitle: { marginTop: 6 },
  struck: { textDecorationLine: 'line-through' },
  heroNotice: { marginTop: 12 },
  runSub: { marginTop: 3 },
  crewRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  crewCount: { marginLeft: 10 },

  dayStrip: { flexDirection: 'row', gap: 4, marginBottom: 22 },
  dayCell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  threeUp: { flexDirection: 'row' },
  third: { flex: 1 },

  challenge: { marginHorizontal: space.gutter, marginTop: space.block, padding: 16 },
  challengeHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 },
  challengeLabel: { flexShrink: 1 },
});
