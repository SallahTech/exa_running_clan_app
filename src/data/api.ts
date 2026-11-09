/**
 * The API surface — DATA_MODEL_AND_API.md §3.
 *
 * Every call is one RPC. The aggregates live in Postgres rather than being
 * assembled on the device: the Stats screen is one round trip, not four, and
 * "this week" is defined once, in the club's timezone.
 */

import { supabase } from './supabase';
import type {
  Challenge,
  FeedPost,
  LeaderboardRow,
  Me,
  MyStats,
  PaceGroup,
  Race,
  RunDetail,
  PostComment,
  RunContact,
  RunSummary,
  RsvpState,
  SeriesDetails,
} from './types';

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args ?? {});
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data as T;
}

// ---------------------------------------------------------------- runs

/** One call feeds Home's "THIS WEEK" list and the Schedule screen. */
export function getUpcomingRuns(limit = 8): Promise<RunSummary[]> {
  return rpc<RunSummary[]>('api_upcoming_runs', { p_limit: limit });
}

export function getRunDetail(occurrenceId: string): Promise<RunDetail> {
  return rpc<RunDetail>('api_run_detail', { p_occurrence: occurrenceId });
}

/**
 * Idempotent. Returns the authoritative going count so an optimistic toggle can
 * reconcile — or roll back, if the write failed.
 */
export function setRsvp(
  occurrenceId: string,
  state: RsvpState,
  paceGroup?: PaceGroup,
): Promise<{ going_count: number; my_rsvp: { state: RsvpState; pace_group: PaceGroup } }> {
  return rpc('api_set_rsvp', {
    p_occurrence: occurrenceId,
    p_state: state,
    p_pace_group: paceGroup ?? null,
  });
}

export async function postRunMessage(occurrenceId: string, body: string): Promise<void> {
  // author_id has no default, and the insert policy requires it to be the caller.
  const { data } = await supabase.auth.getSession();
  const authorId = data.session?.user.id;
  if (!authorId) throw new Error('not authenticated');

  const { error } = await supabase
    .from('run_message')
    .insert({ occurrence_id: occurrenceId, author_id: authorId, body });
  if (error) throw new Error(error.message);
}

/** Materialises the rolling occurrence window. Safe to call on every launch. */
export function ensureOccurrences(weeks = 8): Promise<number> {
  return rpc<number>('ensure_occurrences', { p_weeks: weeks });
}

// ---------------------------------------------------------------- stats

/** Feeds the whole Stats screen and Home's "YOUR WEEK" panel. */
export function getMyStats(): Promise<MyStats> {
  return rpc<MyStats>('api_my_stats');
}

export function getLeaderboard(period: 'week' | 'month' | 'year' = 'month'): Promise<LeaderboardRow[]> {
  return rpc<LeaderboardRow[]>('api_leaderboard', { p_period: period });
}

/** §6 gap 3 — the "LOG A RUN +" affordance now has something behind it. */
export function logActivity(input: {
  startedAt: Date;
  distanceM: number;
  movingSeconds: number;
  occurrenceId?: string | null;
  note?: string | null;
}): Promise<{ id: string }> {
  return rpc('api_log_activity', {
    p_started_at: input.startedAt.toISOString(),
    p_distance_m: Math.round(input.distanceM),
    p_moving_seconds: Math.round(input.movingSeconds),
    p_occurrence_id: input.occurrenceId ?? null,
    p_note: input.note ?? null,
  });
}

// ---------------------------------------------------------------- feed

export function getFeed(cursor?: string, limit = 20): Promise<FeedPost[]> {
  return rpc<FeedPost[]>('api_feed', { p_cursor: cursor ?? null, p_limit: limit });
}

export function toggleKudos(
  postId: string,
  on: boolean,
): Promise<{ kudos_count: number; i_gave_kudos: boolean }> {
  return rpc('api_toggle_kudos', { p_post: postId, p_on: on });
}

/**
 * Post and photo rows are written in one call so a composer that fails partway
 * can't leave a post with no photos, or orphan photo rows with no post.
 */
export function createPost(input: {
  body: string;
  photoPaths?: string[];
  activityId?: string | null;
  occurrenceId?: string | null;
}): Promise<{ id: string }> {
  return rpc('api_create_post', {
    p_body: input.body,
    p_photo_paths: input.photoPaths ?? [],
    p_occurrence_id: input.occurrenceId ?? null,
    p_activity_id: input.activityId ?? null,
  });
}

// ---------------------------------------------------------------- races, challenge, profile

export function getRaces(upcoming = true): Promise<Race[]> {
  return rpc<Race[]>('api_races', { p_upcoming: upcoming });
}

export function setRaceEntry(
  raceId: string,
  on: boolean,
): Promise<{ entry_count: number; i_am_entered: boolean }> {
  return rpc('api_set_race_entry', { p_race: raceId, p_on: on });
}

export function saveRace(input: {
  name: string;
  date: string;
  location?: string;
  note?: string;
  url?: string;
}): Promise<{ id: string }> {
  return rpc('api_save_race', {
    p_name: input.name,
    p_date: input.date,
    p_location: input.location ?? null,
    p_note: input.note ?? null,
    p_url: input.url ?? null,
  });
}

export function deleteRace(raceId: string): Promise<{ ok: boolean }> {
  return rpc('api_delete_race', { p_race: raceId });
}

export function getActiveChallenge(): Promise<Challenge | null> {
  return rpc<Challenge | null>('api_active_challenge');
}

export function getMe(): Promise<Me> {
  return rpc<Me>('api_me');
}

/** Registration steps 2 and 3 write pace_group and default_days here. */
export async function updateMe(patch: {
  pace_group?: PaceGroup;
  default_days?: string[];
  kit_size?: string;
  notify_run_day?: boolean;
  notify_chat?: boolean;
  monthly_target_m?: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}): Promise<void> {
  const { data: session } = await supabase.auth.getUser();
  const id = session.user?.id;
  if (!id) throw new Error('not authenticated');

  const { error } = await supabase.from('member').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------- comments

export function getComments(postId: string): Promise<PostComment[]> {
  return rpc<PostComment[]>('api_post_comments', { p_post: postId });
}

export function addComment(postId: string, body: string): Promise<{ id: string }> {
  return rpc('api_add_comment', { p_post: postId, p_body: body });
}

// ---------------------------------------------------------------- leader tools

export async function getSeries(seriesId: string): Promise<SeriesDetails> {
  const { data, error } = await supabase
    .from('run_series')
    .select('id, title, start_time, meet_point_name, meet_lat, meet_lng, after_label, description')
    .eq('id', seriesId)
    .single();
  if (error) throw new Error(error.message);
  return data as SeriesDetails;
}

export async function getOccurrenceOverrides(
  occurrenceId: string,
): Promise<{ override_meet_point_name: string | null }> {
  const { data, error } = await supabase
    .from('run_occurrence')
    .select('override_meet_point_name')
    .eq('id', occurrenceId)
    .single();
  if (error) throw new Error(error.message);
  return data as { override_meet_point_name: string | null };
}

export function manageOccurrence(input: {
  occurrenceId: string;
  status: 'scheduled' | 'cancelled' | 'moved';
  notes: string;
  meetPoint: string;
}): Promise<{ ok: boolean }> {
  return rpc('api_manage_occurrence', {
    p_occurrence: input.occurrenceId,
    p_status: input.status,
    p_notes: input.notes,
    p_meet_point: input.meetPoint,
  });
}

export function updateSeries(input: {
  seriesId: string;
  title: string;
  startTime: string;
  meetPoint: string;
  lat: number | null;
  lng: number | null;
  after: string;
  description: string;
}): Promise<{ ok: boolean }> {
  return rpc('api_update_series', {
    p_series: input.seriesId,
    p_title: input.title,
    p_start_time: input.startTime,
    p_meet_point: input.meetPoint,
    p_lat: input.lat,
    p_lng: input.lng,
    p_after: input.after,
    p_description: input.description,
  });
}

export function getRunContacts(occurrenceId: string): Promise<RunContact[]> {
  return rpc<RunContact[]>('api_run_contacts', { p_occurrence: occurrenceId });
}

// ---------------------------------------------------------------- push

export function savePushToken(token: string, platform: string, locale: string): Promise<unknown> {
  return rpc('api_save_push_token', { p_token: token, p_platform: platform, p_locale: locale });
}

export function deletePushToken(token: string): Promise<unknown> {
  return rpc('api_delete_push_token', { p_token: token });
}

/** Best effort: the change is already saved, and the alert must not block it. */
export function notify(body: { type: 'run_changed'; occurrence_id: string } | { type: 'new_comment'; post_id: string }) {
  void supabase.functions.invoke('notify', { body }).catch(() => undefined);
}
