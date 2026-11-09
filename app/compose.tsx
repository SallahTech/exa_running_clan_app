/**
 * Post composer — §6 gap 5, which the handoff lists as having no screen.
 *
 * Undesigned, so it is laid out as the thing it produces: author row, then
 * photograph, then words, in the same order and at the same measurements the
 * feed uses. Composing looks like the post that will appear, which means there
 * is no separate preview to build and nothing to be surprised by afterwards.
 *
 * The photograph is shown desaturated here for the same reason — that is how it
 * will be rendered in the feed, so what you choose is what you get.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
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

import * as api from '@/data/api';
import { dayFull, timeOfDay } from '@/data/format';
import { pickPhoto, uploadPostPhoto, type PickedPhoto } from '@/data/photos';
import type { RunSummary } from '@/data/types';
import { useClan } from '@/state/ClanProvider';
import { usePalette } from '@/theme/ThemeProvider';
import { brand, gradients, space } from '@/theme/tokens';
import { InitialsSquare } from '@/ui/Avatar';
import { PrimaryButton } from '@/ui/Button';
import { grayscale } from '@/ui/filters';
import { Gradient } from '@/ui/Gradient';
import { Placeholder } from '@/ui/Placeholder';
import { ScreenHeader } from '@/ui/ScreenHeader';
import { useToast } from '@/ui/Toast';
import { Txt } from '@/ui/Txt';
import { t } from '@/i18n';

const MAX_BODY = 600;

export default function Compose() {
  const p = usePalette();
  const router = useRouter();
  const toast = useToast();
  const { me, runs, refresh } = useClan();

  const [body, setBody] = useState('');
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [attached, setAttached] = useState<RunSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(false);

  // Runs the member said they were going to are the likely subjects.
  const recent = runs.filter((r) => r.my_rsvp?.state === 'going').slice(0, 3);

  const canPost = (body.trim().length > 0 || photo !== null) && !busy;
  const remaining = MAX_BODY - body.length;

  // Compose can be the first screen in the history — a deep link, or a reload
  // while writing. Popping an empty stack does nothing, so fall back to the feed.
  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/feed');
  };

  const choosePhoto = async () => {
    const picked = await pickPhoto();
    if (picked.status === 'picked') {
      setPhoto(picked.photo);
    } else if (picked.status === 'denied') {
      // Silence here is what made this look broken on device.
      toast.show(
        picked.canAskAgain
          ? t('compose.photoDenied')
          : t('compose.photoBlocked'),
      );
    }
  };

  const submit = async () => {
    if (!canPost || !me) return;
    setBusy(true);

    try {
      const paths: string[] = [];
      if (photo) {
        const uploaded = await uploadPostPhoto(photo, me.id);
        paths.push(uploaded.path);
      }

      await api.createPost({
        body: body.trim(),
        photoPaths: paths,
        occurrenceId: attached?.occurrence_id ?? null,
      });

      await refresh();
      leave();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : t('compose.failed'));
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: p.paper }]} edges={['top']}>
      <ScreenHeader
        kicker={t('compose.kicker')}
        title={t('compose.title')}
        actionLabel={t('common.cancel')}
        onAction={leave}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* The feed's own author row, so the post is composed in place. */}
          <View style={styles.author}>
            <InitialsSquare initials={me?.initials ?? '··'} size={40} />
            <View style={styles.authorText}>
              <Txt role="listTitle14">{me?.full_name ?? t('compose.you')}</Txt>
              <Txt role="appMeta" muted>
                {t('compose.now')}{attached ? ` · ${attached.title}` : ''}
              </Txt>
            </View>
          </View>

          {photo ? (
            <View>
              <View style={styles.photoWrap}>
                <Image source={{ uri: photo.uri }} style={styles.photo} accessibilityIgnoresInvertColors />
              </View>
              <View style={[styles.photoActions, { borderBottomColor: p.hairlineStrong }]}>
                <Txt role="appLabel" muted style={styles.photoNote}>
                  {t('compose.bwNote')}
                </Txt>
                <View style={styles.photoButtons}>
                  <Pressable onPress={choosePhoto} accessibilityRole="button" hitSlop={8}>
                    <Txt role="button11" color={brand.accent}>
                      {t('compose.change')}
                    </Txt>
                  </Pressable>
                  <Pressable
                    onPress={() => setPhoto(null)}
                    accessibilityRole="button"
                    hitSlop={8}
                  >
                    <Txt role="button11" muted>
                      {t('compose.remove')}
                    </Txt>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={choosePhoto}
              accessibilityRole="button"
              accessibilityLabel={t('compose.addPhoto')}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Placeholder height={190}>
                <View style={styles.addOverlay}>
                  <Gradient colors={gradients.primary} style={styles.addMark}>
                    <Txt role="cardTitle24" color="#ffffff" style={styles.plus}>
                      +
                    </Txt>
                  </Gradient>
                  <Txt role="appLabel" style={styles.addLabel}>
                    {t('compose.addPhoto')}
                  </Txt>
                  <Txt role="appMeta" muted>
                    {t('compose.photoOptional')}
                  </Txt>
                </View>
              </Placeholder>
            </Pressable>
          )}

          <View style={styles.bodySection}>
            <Txt role="appLabel" muted style={styles.bodyLabel}>
              {t('compose.how')}
            </Txt>
            <TextInput
              value={body}
              onChangeText={setBody}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={t('compose.placeholder')}
              placeholderTextColor={p.muted}
              multiline
              maxLength={MAX_BODY}
              accessibilityLabel={t('compose.bodyLabel')}
              style={[
                styles.input,
                {
                  color: p.text,
                  borderColor: focused ? p.muted : 'transparent',
                  backgroundColor: p.surface,
                },
              ]}
            />
            <View style={styles.counterRow}>
              <Txt role="appMeta" muted>
                {t('compose.foot')}
              </Txt>
              <Txt
                role="button11"
                color={remaining < 60 ? brand.accent : p.muted}
                style={styles.counter}
              >
                {remaining}
              </Txt>
            </View>
          </View>

          {recent.length > 0 ? (
            <>
              <View style={styles.attach}>
                <Txt role="appLabel" muted style={styles.attachTitle}>
                  {t('compose.attach')}
                </Txt>
                {recent.map((r) => {
                  const on = attached?.occurrence_id === r.occurrence_id;
                  return (
                    <Pressable
                      key={r.occurrence_id}
                      onPress={() => setAttached(on ? null : r)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`${r.title}, ${dayFull(r.starts_at)}`}
                      style={({ pressed }) => [
                        styles.runRow,
                        {
                          borderColor: on ? brand.accent : 'transparent',
                          backgroundColor: on ? p.youTint : p.surface,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <View style={styles.runMain}>
                        <Txt role="appLabel" color={on ? brand.accent : p.muted}>
                          {dayFull(r.starts_at)} · {timeOfDay(r.starts_at)}
                        </Txt>
                        <Txt role="listTitle" style={styles.runTitle}>
                          {r.title}
                        </Txt>
                      </View>
                      {on ? (
                        <Gradient colors={gradients.primary} style={styles.tick}>
                          <Txt role="listTitle12" color="#ffffff">
                            ✓
                          </Txt>
                        </Gradient>
                      ) : (
                        <View style={[styles.tick, { backgroundColor: p.raised }]} />
                      )}
                    </Pressable>
                  );
                })}
                <Txt role="appMeta" muted style={styles.attachHelp}>
                  {t('compose.attachHelp')}
                </Txt>
              </View>
            </>
          ) : null}
        </ScrollView>

        <View>
          <View style={styles.footer}>
            <PrimaryButton
              label={t(busy ? 'compose.busy' : 'compose.submit')}
              onPress={submit}
              disabled={!canPost}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingBottom: 24 },

  author: {
    paddingHorizontal: space.gutter,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorText: { flex: 1, gap: 2 },

  photoWrap: { height: 190, width: '100%', overflow: 'hidden' },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    ...grayscale(),
  },
  photoActions: {
    paddingHorizontal: space.gutter,
    paddingVertical: 10,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  photoNote: { flex: 1, letterSpacing: 0.9 },
  photoButtons: { flexDirection: 'row', gap: 14 },

  addOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addMark: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  plus: { lineHeight: 26 },
  addLabel: { marginTop: 4 },

  bodySection: { padding: space.section },
  bodyLabel: { marginBottom: 10 },
  input: {
    minHeight: 132,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontFamily: 'Archivo_400Regular',
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
    // react-native-web draws a browser focus ring over the border otherwise.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  counterRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  counter: { fontVariant: ['tabular-nums'] },

  attach: { padding: space.section },
  attachTitle: { marginBottom: 10 },
  runRow: {
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  runMain: { flex: 1 },
  runTitle: { marginTop: 3 },
  tick: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  attachHelp: { marginTop: 4 },

  footer: { paddingHorizontal: space.gutter, paddingTop: 12, paddingBottom: 16 },
});
