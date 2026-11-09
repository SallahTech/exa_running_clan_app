/**
 * The app's single source of truth.
 *
 * README "Interactions & Behavior" asks for one authority per run id: toggling
 * the RSVP has to flip the Home button, the list chip and the sheet footer
 * together, and move the going count in all three. That only works if they all
 * read the same record — so every screen reads from here and nothing keeps its
 * own copy.
 *
 * Writes are optimistic. Each one applies locally, calls the server, then
 * reconciles against the count the server returns; a failure rolls the local
 * change back and says so, rather than leaving the UI quietly lying.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import * as api from '../data/api';
import { supabase } from '../data/supabase';
import type {
  Challenge,
  FeedPost,
  LeaderboardRow,
  Me,
  MyStats,
  PaceGroup,
  Race,
  RunDetail,
  RunSummary,
} from '../data/types';
import { feedback } from '../ui/feedback';
import { useToast } from '../ui/Toast';
import { useAuth } from './AuthProvider';
import { notificationsAllowed, registerForPush, syncRunReminders } from '../data/notifications';
import { t } from '../i18n';

interface ClanValue {
  loading: boolean;
  error: string | null;
  me: Me | null;
  runs: RunSummary[];
  /** The next scheduled run — drives the Home hero and its countdown. */
  nextRun: RunSummary | null;
  stats: MyStats | null;
  leaderboard: LeaderboardRow[];
  feed: FeedPost[];
  races: Race[];
  challenge: Challenge | null;

  /** The member's pace group, shared between the profile screen and the sheet. */
  pace: PaceGroup;
  setPace: (p: PaceGroup) => void;

  /** Settings writes — optimistic, rolls back and toasts on failure. */
  updateProfile: (patch: {
    notify_run_day?: boolean;
    notify_chat?: boolean;
    monthly_target_m?: number;
    kit_size?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  }) => void;

  openRunId: string | null;
  runDetail: RunDetail | null;
  openRun: (occurrenceId: string) => void;
  closeRun: () => void;

  toggleRsvp: (occurrenceId: string) => void;
  toggleKudos: (postId: string) => void;
  toggleRace: (raceId: string) => void;
  isLeader: boolean;
  /** Resolves false when the send failed, so the composer can keep the draft. */
  sendMessage: (body: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const ClanContext = createContext<ClanValue | null>(null);

export function ClanProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [stats, setStats] = useState<MyStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [openRunId, setOpenRunId] = useState<string | null>(null);
  const [runDetail, setRunDetail] = useState<RunDetail | null>(null);

  const pace: PaceGroup = me?.pace_group ?? 'open';

  // ---------------------------------------------------------------- load

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      setError(null);
      // Materialise the rolling occurrence window before reading it, so a fresh
      // database or a long-idle one still has runs to show.
      await api.ensureOccurrences(8).catch(() => undefined);

      const [meRow, runRows, statRow, board, posts, raceRows, ch] = await Promise.all([
        api.getMe(),
        api.getUpcomingRuns(8),
        api.getMyStats(),
        api.getLeaderboard('month'),
        api.getFeed(),
        api.getRaces(),
        api.getActiveChallenge(),
      ]);

      setMe(meRow);
      setRuns(runRows ?? []);
      setStats(statRow);
      setLeaderboard(board ?? []);
      setFeed(posts ?? []);
      setRaces(raceRows ?? []);
      setChallenge(ch);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      setLoading(true);
      void refresh();
    } else {
      setLoading(false);
      setMe(null);
      setRuns([]);
      setStats(null);
      setLeaderboard([]);
      setFeed([]);
      setRaces([]);
      setChallenge(null);
    }
  }, [session, refresh]);

  // A failed first load is ClanGate's to show; after that the screen is still
  // useful, so say the refresh failed and leave the last good data up.
  const hasLoaded = Boolean(me);
  const showToast = toast.show;
  useEffect(() => {
    if (error && hasLoaded) showToast(t('toast.refreshFailed'));
  }, [error, hasLoaded, showToast]);

  // Reminders follow the runs the member has joined.
  const remindersOn = me?.notify_run_day ?? false;
  const memberId = me?.id;
  const reminderKey = runs
    .map((r) => `${r.occurrence_id}:${r.my_rsvp?.state}:${r.status}:${r.starts_at}:${r.meet_point}`)
    .join('|');
  useEffect(() => {
    if (!memberId) return;
    void notificationsAllowed(false).then((ok) => {
      if (!ok) return;
      void registerForPush();
      void syncRunReminders(runs, remindersOn);
    });
    // reminderKey stands in for runs: refetching identical data shouldn't reschedule.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId, remindersOn, reminderKey]);

  // ---------------------------------------------------------------- run sheet

  const openRun = useCallback((occurrenceId: string) => {
    setOpenRunId(occurrenceId);
    setRunDetail(null);
    api
      .getRunDetail(occurrenceId)
      .then(setRunDetail)
      .catch(() => setRunDetail(null));
  }, []);

  const closeRun = useCallback(() => {
    setOpenRunId(null);
    setRunDetail(null);
  }, []);

  // Live run chat while the sheet is open.
  useEffect(() => {
    if (!openRunId) return;

    const channel = supabase
      .channel(`run_message:${openRunId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'run_message',
          filter: `occurrence_id=eq.${openRunId}`,
        },
        () => {
          // The row arrives without the author's name; re-reading the detail is
          // one small call and keeps the shape identical to the initial load.
          api.getRunDetail(openRunId).then(setRunDetail).catch(() => undefined);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [openRunId]);

  // ---------------------------------------------------------------- writes

  /** Applies a change to a run in both the list and the open sheet. */
  const patchRun = useCallback(
    (occurrenceId: string, patch: Partial<RunSummary>) => {
      setRuns((rs) => rs.map((r) => (r.occurrence_id === occurrenceId ? { ...r, ...patch } : r)));
      setRunDetail((d) =>
        d && d.occurrence_id === occurrenceId ? ({ ...d, ...patch } as RunDetail) : d,
      );
    },
    [],
  );

  const inFlight = useRef(new Set<string>());

  const toggleRsvp = useCallback(
    (occurrenceId: string) => {
      const run = runs.find((r) => r.occurrence_id === occurrenceId);
      if (!run || run.status === 'cancelled' || inFlight.current.has(occurrenceId)) return;

      const wasGoing = run.my_rsvp?.state === 'going';
      const next = wasGoing ? 'out' : 'going';
      const previous = { my_rsvp: run.my_rsvp, going_count: run.going_count };

      // optimistic
      patchRun(occurrenceId, {
        my_rsvp: { state: next, pace_group: pace },
        going_count: Math.max(0, run.going_count + (wasGoing ? -1 : 1)),
      });
      inFlight.current.add(occurrenceId);
      if (wasGoing) feedback.light();
      else {
        feedback.success();
        // Joining a run is the moment a reminder makes sense, so ask here.
        void notificationsAllowed(true).then((ok) => {
          if (ok) void registerForPush();
        });
      }

      api
        .setRsvp(occurrenceId, next, pace)
        .then((res) => {
          // reconcile against the server's count
          patchRun(occurrenceId, { going_count: res.going_count, my_rsvp: res.my_rsvp });
          if (openRunId === occurrenceId) {
            api.getRunDetail(occurrenceId).then(setRunDetail).catch(() => undefined);
          }
        })
        .catch(() => {
          patchRun(occurrenceId, previous);
          feedback.error();
          toast.show(t('toast.rsvpFailed'));
        })
        .finally(() => {
          inFlight.current.delete(occurrenceId);
        });
    },
    [runs, pace, patchRun, openRunId, toast],
  );

  const setPace = useCallback(
    (next: PaceGroup) => {
      const previous = me?.pace_group;
      if (!me || next === previous) return;

      setMe({ ...me, pace_group: next });
      feedback.selection();

      // The member's default and any RSVP they've already made move together —
      // picking 6:00 in the sheet shouldn't leave them listed under 6:30.
      const mine = runs.filter((r) => r.my_rsvp?.state === 'going' && r.status !== 'cancelled');

      Promise.all([
        api.updateMe({ pace_group: next }),
        ...mine.map((r) => api.setRsvp(r.occurrence_id, 'going', next)),
      ])
        .then(() => {
          mine.forEach((r) =>
            patchRun(r.occurrence_id, { my_rsvp: { state: 'going', pace_group: next } }),
          );
          if (openRunId) {
            api.getRunDetail(openRunId).then(setRunDetail).catch(() => undefined);
          }
        })
        .catch(() => {
          setMe((m) => (m && previous ? { ...m, pace_group: previous } : m));
          toast.show(t('toast.paceFailed'));
        });
    },
    [me, runs, patchRun, openRunId, toast],
  );

  const updateProfile = useCallback<ClanValue['updateProfile']>(
    (patch) => {
      if (!me) return;
      const previous = me;
      setMe({ ...me, ...patch });

      api.updateMe(patch).catch(() => {
        setMe(previous);
        toast.show(t('toast.settingFailed'));
      });

      // The Stats ring is a share of monthly_target_m, so changing the target
      // has to move the ring too, not just the settings row.
      if (patch.monthly_target_m !== undefined) {
        api.getMyStats().then(setStats).catch(() => undefined);
      }
    },
    [me, toast],
  );

  const toggleKudos = useCallback(
    (postId: string) => {
      const post = feed.find((p) => p.id === postId);
      if (!post) return;

      const on = !post.i_gave_kudos;
      const apply = (next: Partial<FeedPost>) =>
        setFeed((ps) => ps.map((p) => (p.id === postId ? { ...p, ...next } : p)));

      feedback.light();
      apply({
        i_gave_kudos: on,
        kudos_count: Math.max(0, post.kudos_count + (on ? 1 : -1)),
      });

      api
        .toggleKudos(postId, on)
        .then((res) => apply({ kudos_count: res.kudos_count, i_gave_kudos: res.i_gave_kudos }))
        .catch(() => {
          apply({ i_gave_kudos: post.i_gave_kudos, kudos_count: post.kudos_count });
          toast.show(t('toast.kudosFailed'));
        });
    },
    [feed, toast],
  );

  const toggleRace = useCallback(
    (raceId: string) => {
      const race = races.find((r) => r.id === raceId);
      if (!race) return;

      const on = !race.i_am_entered;
      const apply = (next: Partial<Race>) =>
        setRaces((rs) => rs.map((r) => (r.id === raceId ? { ...r, ...next } : r)));

      feedback.light();
      apply({ i_am_entered: on, entry_count: Math.max(0, race.entry_count + (on ? 1 : -1)) });

      api
        .setRaceEntry(raceId, on)
        .then((res) => apply(res))
        .catch(() => {
          apply({ i_am_entered: race.i_am_entered, entry_count: race.entry_count });
          toast.show(t('toast.raceFailed'));
        });
    },
    [races, toast],
  );

  const sendMessage = useCallback(
    async (body: string) => {
      if (!openRunId || !body.trim()) return false;
      try {
        await api.postRunMessage(openRunId, body.trim());
        // Don't rely on the realtime echo alone to show the sender their message.
        api.getRunDetail(openRunId).then(setRunDetail).catch(() => undefined);
        return true;
      } catch {
        toast.show(t('toast.messageFailed'));
        return false;
      }
    },
    [openRunId, toast],
  );

  const nextRun = runs.find((r) => r.status !== 'cancelled') ?? null;
  const isLeader = me?.role === 'leader' || me?.role === 'admin';

  const value = useMemo<ClanValue>(
    () => ({
      loading,
      error,
      me,
      runs,
      nextRun,
      stats,
      leaderboard,
      feed,
      races,
      challenge,
      pace,
      setPace,
      updateProfile,
      openRunId,
      runDetail,
      openRun,
      closeRun,
      toggleRsvp,
      toggleKudos,
      toggleRace,
      isLeader,
      sendMessage,
      refresh,
    }),
    [
      loading, error, me, runs, nextRun, stats, leaderboard, feed, races, challenge,
      pace, setPace, updateProfile, openRunId, runDetail, openRun, closeRun, toggleRsvp,
      toggleKudos, toggleRace, isLeader, sendMessage, refresh,
    ],
  );

  return <ClanContext.Provider value={value}>{children}</ClanContext.Provider>;
}

export function useClan(): ClanValue {
  const ctx = useContext(ClanContext);
  if (!ctx) throw new Error('useClan must be used inside <ClanProvider>');
  return ctx;
}
