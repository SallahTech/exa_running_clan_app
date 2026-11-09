/** One post's comments, opened from its comment count in the feed. */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as api from '@/data/api';
import { relativeTime } from '@/data/format';
import type { PostComment } from '@/data/types';
import { t } from '@/i18n';
import { useClan } from '@/state/ClanProvider';
import { usePalette } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';
import { InitialsSquare } from '@/ui/Avatar';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { useToast } from '@/ui/Toast';
import { Txt } from '@/ui/Txt';

export default function PostComments() {
  const p = usePalette();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { feed, refresh } = useClan();
  const post = feed.find((x) => x.id === id);

  const [comments, setComments] = useState<PostComment[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setComments(await api.getComments(id));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const canSend = draft.trim().length > 0 && !busy;

  const send = async () => {
    if (!canSend || !id) return;
    setBusy(true);
    try {
      await api.addComment(id, draft);
      api.notify({ type: 'new_comment', post_id: id });
      setDraft('');
      await load();
      void refresh();
    } catch {
      toast.show(t('comments.failed'));
    }
    setBusy(false);
  };

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/feed');
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: p.paper }]} edges={['top', 'bottom']}>
      <ScreenHeader title={t('comments.title')} actionLabel={t('common.back')} onAction={leave} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          {post ? (
            <View style={[styles.post, { backgroundColor: p.surface }]}>
              <Txt role="listTitle">{post.author}</Txt>
              <Txt role="appBody" style={styles.postBody}>
                {post.body}
              </Txt>
            </View>
          ) : null}

          {failed ? (
            <Txt role="appBody" muted>
              {t('comments.loadFailed')}
            </Txt>
          ) : null}
          {comments?.length === 0 ? (
            <Txt role="appBody" muted>
              {t('comments.empty')}
            </Txt>
          ) : null}

          {comments?.map((c) => (
            <View key={c.id} style={styles.comment}>
              <InitialsSquare initials={c.initials} size={36} me={c.is_mine} />
              <View style={styles.commentText}>
                <View style={styles.commentHead}>
                  <Txt role="listTitle14" style={styles.author} numberOfLines={1}>
                    {c.author}
                  </Txt>
                  <Txt role="appMeta" muted>
                    {relativeTime(c.created_at)}
                  </Txt>
                </View>
                <Txt role="appBody">{c.body}</Txt>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t('comments.placeholder')}
            placeholderTextColor={p.muted}
            accessibilityLabel={t('comments.placeholder')}
            maxFontSizeMultiplier={1.6}
            multiline
            style={[styles.input, { color: p.text, backgroundColor: p.surface }]}
          />
          <Pressable
            onPress={send}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel={t('comments.sendLabel')}
            accessibilityState={{ disabled: !canSend }}
            style={({ pressed }) => [styles.send, { opacity: !canSend ? 0.45 : pressed ? 0.6 : 1 }]}
          >
            <Txt role="button11" color={p.accentText}>
              {t('run.send')}
            </Txt>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: space.gutter, paddingBottom: 20 },
  post: { padding: 16, marginBottom: 20 },
  postBody: { marginTop: 6 },
  comment: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  commentText: { flex: 1, gap: 3 },
  commentHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  author: { flexShrink: 1 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingHorizontal: space.gutter,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: 'Archivo_400Regular',
    fontSize: 16,
  },
  send: { minHeight: 48, paddingHorizontal: 12, justifyContent: 'center' },
});
