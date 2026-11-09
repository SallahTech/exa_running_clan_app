/**
 * Stats — the month's progress ring, eight weeks of volume, and the clan
 * leaderboard. Every mark animates once on mount, from zero.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { kmWhole, monthName } from '@/data/format';
import type { LeaderboardRow } from '@/data/types';
import { useClan } from '@/state/ClanProvider';
import { useScrollReset } from '@/ui/useScrollReset';
import { usePalette } from '@/theme/ThemeProvider';
import { brand, space } from '@/theme/tokens';
import { InitialsSquare } from '@/ui/Avatar';
import { LeaderboardBar, ProgressRing, WeeklyBars, type Bar } from '@/ui/Charts';
import { ScreenIn, SectionHeader } from '@/ui/Layout';
import { SecondaryButton } from '@/ui/Button';
import { Txt } from '@/ui/Txt';
import { t } from '@/i18n';

export function StatsScreen() {
  const p = usePalette();
  const router = useRouter();
  const { stats, leaderboard, refresh } = useClan();
  const scroller = useScrollReset();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Bars are drawn relative to the tallest of the eight weeks, so a light month
  // still fills the chart rather than flattening into the baseline.
  const peak = Math.max(1, ...(stats?.weeks8 ?? []).map((w) => w.distance_m));
  const bars: Bar[] = (stats?.weeks8 ?? []).map((w) => ({
    km: Math.round(w.distance_m / 1000),
    pct: (w.distance_m / peak) * 100,
  }));

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
          <View style={styles.headText}>
            <Txt role="screenTitle">{monthName()}</Txt>
            <Txt role="appBody" muted style={styles.headSub}>
              {t('stats.logged', { km: kmWhole(stats?.month_distance_m ?? 0), n: stats?.streak_weeks ?? 0 })}
            </Txt>
          </View>
          {/* §6 gap 1: the denominator is member.monthly_target_m, defaulted in
              the schema because no screen in the handoff sets it. */}
          <ProgressRing pct={stats?.month_progress_pct ?? 0} />
        </View>

        <View style={styles.section}>
          <SectionHeader title={t('stats.weekly')} action={t('stats.last8')} style={styles.sectionTitle} />
          {bars.some((b) => b.km > 0) ? (
            <WeeklyBars bars={bars} />
          ) : (
            <View style={styles.emptyChart}>
              <Txt role="appBody" muted>
                {t('stats.empty')}
              </Txt>
              <SecondaryButton label={t('home.logRun')} trailing="+" onPress={() => router.push('/log-run')} />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title={t('stats.board')}
            action={stats?.rank ? t('stats.rank', { n: stats.rank }) : t('stats.kmMonth')}
            style={styles.sectionTitle}
          />
          {leaderboard.map((row) => (
            <BoardRow key={row.member_id} row={row} />
          ))}
          {leaderboard.length === 0 ? (
            <Txt role="appBody" muted>
              {t('stats.boardEmpty')}
            </Txt>
          ) : null}
        </View>
      </ScreenIn>
    </ScrollView>
  );
}

function BoardRow({ row }: { row: LeaderboardRow }) {
  const p = usePalette();

  return (
    <View
      style={[styles.boardRow, row.is_me ? { backgroundColor: p.youTint } : null]}
      accessible
      accessibilityLabel={t('stats.rowLabel', { rank: row.rank, name: row.name, km: kmWhole(row.distance_m) })}
    >
      <View style={styles.boardMain}>
        <Txt role="appMetaBold" muted style={styles.rank}>
          {row.rank}
        </Txt>
        <InitialsSquare initials={row.initials} size={36} />
        <Txt role="listTitle" style={styles.boardName} numberOfLines={1}>
          {row.is_me ? t('compose.you') : row.name}
        </Txt>
        <Txt role="stat18">{kmWhole(row.distance_m)}</Txt>
      </View>
      <LeaderboardBar pct={row.bar_pct} />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyChart: { gap: 14 },
  scroll: { paddingBottom: space.block },
  head: {
    paddingHorizontal: space.gutter,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headText: { flex: 1 },
  headSub: { marginTop: 8 },

  section: { paddingHorizontal: space.gutter, paddingTop: space.block },
  sectionTitle: { marginBottom: 16 },

  boardRow: { paddingVertical: 12, paddingHorizontal: 12, marginHorizontal: -12 },
  boardMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rank: { width: 28, textAlign: 'left' },
  boardName: { flex: 1 },
});
