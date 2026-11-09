/**
 * Run detail — the bottom sheet that opens from any run row, on any tab.
 *
 * Contains the meet-point map, the 2×2 fact grid, the pace-group picker, the
 * roster, run chat, and a sticky RSVP footer. The footer button and the pace
 * picker write to the same records the list rows read, so the sheet and the
 * screen behind it never disagree.
 */

import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { dayFull, timeOfDay } from '@/data/format';
import { addRunToCalendar } from '@/data/calendar';
import { paceShort, type RunSummary } from '@/data/types';
import { useClan } from '@/state/ClanProvider';
import { usePalette } from '@/theme/ThemeProvider';
import { brand, space } from '@/theme/tokens';
import { InitialsSquare } from '@/ui/Avatar';
import { BottomSheet } from '@/ui/BottomSheet';
import { PrimaryButton, SecondaryButton } from '@/ui/Button';
import { MeetMap } from '@/ui/MeetMap';
import { PaceSelector } from '@/ui/Segmented';
import { Txt } from '@/ui/Txt';
import { t, upper } from '@/i18n';

const ROSTER_PREVIEW = 15;

export function RunSheet() {
  const p = usePalette();
  const router = useRouter();
  const { openRunId, runDetail, runs, closeRun, pace, setPace, toggleRsvp, sendMessage, isLeader } = useClan();
  const [draft, setDraft] = useState('');

  // The list row already has everything the header needs, so the sheet opens with
  // real content immediately and fills in the roster and chat when they arrive.
  const summary = runs.find((r) => r.occurrence_id === openRunId);
  const run = runDetail ?? summary ?? null;
  const going = run?.my_rsvp?.state === 'going';
  const cancelled = run?.status === 'cancelled';
  const changed = cancelled || run?.status === 'moved';

  // The sheet is reused across runs, so its scroll offset survives a close and
  // reopen — and on web the browser also scrolls the freshly focused content
  // into view. Either way it must open on the title, not halfway down.
  const scroller = useRef<ScrollView>(null);
  useEffect(() => {
    if (openRunId) scroller.current?.scrollTo({ y: 0, animated: false });
  }, [openRunId]);

  // Forty initials would push the chat off the sheet. You first, then two rows.
  const [rosterOpen, setRosterOpen] = useState(false);
  useEffect(() => setRosterOpen(false), [openRunId]);
  const roster = [...(runDetail?.roster ?? [])].sort((a, b) => Number(b.is_me) - Number(a.is_me));
  const visibleRoster = rosterOpen ? roster : roster.slice(0, ROSTER_PREVIEW);
  const hiddenCount = roster.length - visibleRoster.length;

  const send = async () => {
    const body = draft;
    setDraft('');
    const sent = await sendMessage(body);
    if (!sent) setDraft(body);
  };

  return (
    <BottomSheet
      open={Boolean(openRunId)}
      onClose={closeRun}
      accessibilityLabel={run ? t('run.details', { title: run.title }) : t('run.detailsFallback')}
      footer={
        run ? (
          <View style={styles.footer}>
            <PrimaryButton
              label={
                cancelled
                  ? t('run.isCancelled')
                  : going
                    ? t('run.tapToCancel')
                    : t('run.countMeIn')
              }
              trailing={cancelled ? '' : paceShort(pace)}
              trailingTabular
              committed={going}
              size="sm"
              disabled={cancelled}
              onPress={() => toggleRsvp(run.occurrence_id)}
            />
          </View>
        ) : null
      }
    >
      {run ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            ref={scroller}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            <View style={styles.head}>
              <Txt role="appLabel" color={p.accentText}>
                {dayFull(run.starts_at)} · {timeOfDay(run.starts_at)}
              </Txt>
              <Txt role="sheetTitle" style={styles.title}>
                {run.title}
              </Txt>
              <Txt role="appBody" muted style={styles.desc}>
                {run.description}
              </Txt>
              {changed || run.override_notes ? (
                <View style={[styles.banner, { borderLeftColor: brand.accent, backgroundColor: p.raised }]}>
                  {changed ? (
                    <Txt role="appMetaBold">
                      {t(cancelled ? 'run.isCancelled' : 'run.changedBanner')}
                    </Txt>
                  ) : null}
                  {run.override_notes ? <Txt role="appMeta">{run.override_notes}</Txt> : null}
                </View>
              ) : null}

              <View style={styles.actions}>
                {!cancelled ? (
                  <SecondaryButton
                    label={t('run.addCalendar')}
                    onPress={() => addRunToCalendar(run as RunSummary)}
                    style={styles.action}
                  />
                ) : null}
                {isLeader ? (
                  <SecondaryButton
                    label={t('run.manage')}
                    onPress={() => {
                      closeRun();
                      router.push({ pathname: '/manage-run', params: { id: run.occurrence_id } });
                    }}
                    style={styles.action}
                  />
                ) : null}
              </View>
            </View>

            <View style={styles.map}>
              <MeetMap lat={run.meet_lat} lng={run.meet_lng} label={run.meet_point} height={130} />
            </View>

            <View style={styles.facts}>
              <Fact label={t('run.meet')} value={run.meet_point} />
              <Fact label={t('run.distance')} value={run.distance_label} />
              <Fact label={t('run.surface')} value={run.surface} />
              <Fact label={t('run.afterLabel')} value={run.after_label} />
            </View>

            <View style={styles.section}>
              <Txt role="section" style={styles.sectionTitle}>
                {t('run.pickPace')}
              </Txt>
              <PaceSelector
                value={pace}
                onChange={setPace}
                counts={run.pace_group_counts}
              />
            </View>

            <View style={styles.section}>
              <Txt role="section" style={styles.sectionTitle}>
                {t('run.going', { n: run.going_count })}
              </Txt>
              <View style={styles.roster}>
                {visibleRoster.map((m) => (
                  <InitialsSquare
                    key={m.member_id}
                    initials={m.is_me ? upper(t('compose.you')) : m.initials}
                    size={36}
                    me={m.is_me}
                  />
                ))}
                {hiddenCount > 0 ? (
                  <Pressable
                    onPress={() => setRosterOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel={t('run.moreRunners', { n: hiddenCount })}
                    style={({ pressed }) => [
                      styles.more,
                      { backgroundColor: p.raised, opacity: pressed ? 0.6 : 1 },
                    ]}
                  >
                    <Txt role="listTitle12">+{hiddenCount}</Txt>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={styles.chat}>
              <Txt role="section" style={styles.chatTitle}>
                {t('run.chat')}
              </Txt>
              {(runDetail?.messages ?? []).map((m) => (
                <View key={m.id} style={styles.message}>
                  <Txt role="listTitle12">
                    {m.author}
                    {m.pinned ? ` · ${t('run.pinned')}` : ''}
                  </Txt>
                  <Txt role="appMeta" muted style={styles.messageBody}>
                    {m.body}
                  </Txt>
                </View>
              ))}

              <View style={styles.composer}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={t('run.messagePlaceholder')}
                  placeholderTextColor={p.muted}
                  onSubmitEditing={send}
                  returnKeyType="send"
                  accessibilityLabel={t('run.messagePlaceholder')}
                  maxFontSizeMultiplier={1.6}
                  style={[
                    styles.input,
                    { color: p.text, backgroundColor: p.raised },
                  ]}
                />
                <Pressable
                  onPress={send}
                  disabled={!draft.trim()}
                  accessibilityRole="button"
                  accessibilityLabel={t('run.sendLabel')}
                  accessibilityState={{ disabled: !draft.trim() }}
                  style={({ pressed }) => [
                    styles.send,
                    { opacity: !draft.trim() ? 0.45 : pressed ? 0.6 : 1 },
                  ]}
                >
                  <Txt role="button11" color={p.accentText}>
                    {t('run.send')}
                  </Txt>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : null}
    </BottomSheet>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const p = usePalette();
  return (
    <View style={[styles.fact, { backgroundColor: p.raised }]}>
      <Txt role="appLabel" muted>
        {label}
      </Txt>
      <Txt role="listTitle" style={styles.factValue}>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: 12 },

  head: { paddingHorizontal: space.gutter, paddingBottom: 20 },
  title: { marginTop: 8 },
  desc: { marginTop: 10 },
  banner: { marginTop: 14, padding: 12, gap: 3, borderLeftWidth: 3 },
  actions: { marginTop: 14, gap: 8 },
  action: {},

  map: { marginHorizontal: space.gutter, marginBottom: 8 },

  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: space.gutter,
  },
  fact: { flexBasis: '47%', flexGrow: 1, padding: 14 },
  factValue: { marginTop: 6 },

  section: { paddingHorizontal: space.gutter, paddingTop: 28 },
  sectionTitle: { marginBottom: 12 },

  roster: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  more: { minWidth: 44, minHeight: 36, alignItems: 'center', justifyContent: 'center' },

  chat: { paddingHorizontal: space.gutter, paddingTop: 28, paddingBottom: 20 },
  chatTitle: { marginBottom: 12 },
  message: { paddingBottom: 14 },
  messageBody: { marginTop: 3 },

  composer: { flexDirection: 'row', gap: 4, marginTop: 4 },
  send: { minHeight: 48, paddingHorizontal: 12, justifyContent: 'center' },
  input: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontFamily: 'Archivo_400Regular',
    fontSize: 16,
  },

  footer: { paddingHorizontal: space.gutter, paddingTop: 12, paddingBottom: 16 },
});
