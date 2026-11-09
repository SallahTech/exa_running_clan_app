/**
 * Feed — one post per block, separated by 1px rules.
 *
 * Kudos is a per-post boolean that increments the displayed count. The toggle is
 * optimistic and reconciles against the server's count, like the RSVP.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { kmLabel, pace as paceLabel, relativeTime } from '@/data/format';
import type { FeedPost } from '@/data/types';
import { useClan } from '@/state/ClanProvider';
import { useScrollReset } from '@/ui/useScrollReset';
import { usePalette } from '@/theme/ThemeProvider';
import { brand, gradients, space } from '@/theme/tokens';
import { InitialsSquare } from '@/ui/Avatar';
import { Gradient } from '@/ui/Gradient';
import { ScreenIn, StatBlock } from '@/ui/Layout';
import { Photo } from '@/ui/Photo';
import { Txt } from '@/ui/Txt';
import { t } from '@/i18n';

export function FeedScreen() {
  const p = usePalette();
  const router = useRouter();
  const { feed, toggleKudos, refresh } = useClan();
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
          <Txt role="screenTitle">{t('feed.title')}</Txt>
          {/* The feed had no way to post to it — §6 gap 5. */}
          <Pressable
            onPress={() => router.push('/compose')}
            accessibilityRole="button"
            accessibilityLabel={t('feed.write')}
            hitSlop={10}
          >
            <Txt role="appMetaBold" color={p.accentText}>
              {t('feed.write')}
            </Txt>
          </Pressable>
        </View>

        {feed.map((post) => (
          <Post
            key={post.id}
            post={post}
            onKudos={() => toggleKudos(post.id)}
            onComments={() => router.push(`/post/${post.id}`)}
          />
        ))}

        {feed.length === 0 ? (
          <View style={styles.empty}>
            <Txt role="appBody" muted>
              {t('feed.empty')}
            </Txt>
          </View>
        ) : null}
      </ScreenIn>
    </ScrollView>
  );
}

function Post({
  post,
  onKudos,
  onComments,
}: {
  post: FeedPost;
  onKudos: () => void;
  onComments: () => void;
}) {
  const hasStats = post.distance_m !== null;

  return (
    <View style={styles.post}>
      <View style={styles.author}>
        <InitialsSquare initials={post.initials} size={40} />
        <View style={styles.authorText}>
          <Txt role="listTitle">{post.author}</Txt>
          <Txt role="appMeta" muted>
            {relativeTime(post.created_at)}
            {post.run_label ? ` · ${post.run_label}` : ''}
          </Txt>
        </View>
      </View>

      {post.photos.length > 0 ? (
        <Photo path={post.photos[0]} fallbackLabel={t('feed.photo')} height={260} />
      ) : null}

      {hasStats ? (
        <View style={styles.stats}>
          <StatBlock value={kmLabel(post.distance_m ?? 0)} label={t('feed.distance')} size="stat24" style={styles.stat} />
          <StatBlock value={paceLabel(post.avg_pace_s_per_km)} label={t('feed.pace')} size="stat24" style={styles.stat} />
        </View>
      ) : null}

      <Txt role="appBody" style={styles.body}>
        {post.body}
      </Txt>

      <View style={styles.actions}>
        <KudosButton on={post.i_gave_kudos} onPress={onKudos} />
        <Txt role="appMeta" muted>
          {t('feed.kudosCount', { n: post.kudos_count })}
        </Txt>
        <Pressable
          onPress={onComments}
          accessibilityRole="button"
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Txt role="appMetaBold">{t('feed.comments', { n: post.comment_count })}</Txt>
        </Pressable>
      </View>
    </View>
  );
}

/** Quiet fill when off; accent gradient and white when on. */
function KudosButton({ on, onPress }: { on: boolean; onPress: () => void }) {
  const p = usePalette();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={t(on ? 'feed.removeKudos' : 'feed.giveKudos')}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      {on ? (
        <Gradient colors={gradients.primary} style={styles.kudos}>
          <Txt role="button11" color="#ffffff">
            {t('feed.kudosOn')}
          </Txt>
        </Gradient>
      ) : (
        <View style={[styles.kudos, { backgroundColor: p.raised }]}>
          <Txt role="button11">{t('feed.kudos')}</Txt>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: space.block },
  head: {
    paddingHorizontal: space.gutter,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },

  post: { paddingTop: 20, paddingBottom: 16 },
  author: {
    paddingHorizontal: space.gutter,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authorText: { flex: 1, gap: 2 },

  stats: { flexDirection: 'row', paddingHorizontal: space.gutter, paddingTop: 16 },
  stat: { flex: 1 },

  body: { paddingHorizontal: space.gutter, paddingTop: 14, paddingBottom: 14 },

  actions: {
    paddingHorizontal: space.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  kudos: { minHeight: 44, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },

  empty: { padding: space.section },
});
