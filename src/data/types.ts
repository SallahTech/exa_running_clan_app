/**
 * The shapes the API returns. These mirror the RPC payloads in
 * supabase/migrations/0003_api.sql one-for-one — if you change a function's
 * jsonb_build_object there, change the matching interface here.
 *
 * Distances are metres and durations are seconds all the way through; formatting
 * to "24.6 KM" or "2:11" happens once, in src/data/format.ts.
 */

import { t } from '../i18n';

export const PACE_GROUPS = ['4:45', '6:00', '6:30', '7:00', 'open'] as const;
export type PaceGroup = (typeof PACE_GROUPS)[number];

/** 'open' is for members who run at whatever feels comfortable. */
export const paceShort = (g: PaceGroup): string => (g === 'open' ? t('pace.own') : g);
export const paceName = (g: PaceGroup): string =>
  g === 'open' ? t('pace.ownName') : t('pace.groupName', { pace: g });

export type RsvpState = 'going' | 'out';
export type OccurrenceStatus = 'scheduled' | 'cancelled' | 'moved';

export interface MyRsvp {
  state: RsvpState;
  pace_group: PaceGroup;
}

export interface RunSummary {
  occurrence_id: string;
  series_id: string;
  slug: 'wed' | 'sun' | string;
  title: string;
  subtitle: string;
  starts_at: string;
  status: OccurrenceStatus;
  meet_point: string;
  meet_lat: number | null;
  meet_lng: number | null;
  distance_label: string;
  surface: string;
  after_label: string;
  description: string;
  override_notes: string | null;
  /** Club photograph for the Home hero. Null falls back to the placeholder. */
  hero_photo_path: string | null;
  going_count: number;
  my_rsvp: MyRsvp | null;
  pace_group_counts: Partial<Record<PaceGroup, number>>;
  crew: { initials: string }[];
}

export interface RosterEntry {
  member_id: string;
  initials: string;
  name: string;
  pace_group: PaceGroup;
  is_me: boolean;
}

export interface RunMessage {
  id: string;
  author: string;
  initials: string;
  body: string;
  pinned: boolean;
  created_at: string;
}

export interface RunDetail extends Omit<RunSummary, 'series_id' | 'crew'> {
  roster: RosterEntry[];
  messages: RunMessage[];
}

export interface WeekBucket {
  week_start: string;
  distance_m: number;
}

export interface MyStats {
  week: {
    distance_m: number;
    runs: number;
    moving_seconds: number;
    /** Monday-first, seven booleans. */
    days: boolean[];
  };
  weeks8: WeekBucket[];
  month_distance_m: number;
  monthly_target_m: number;
  month_progress_pct: number;
  year_distance_m: number;
  streak_weeks: number;
  clan_runs: number;
  rank: number | null;
}

export interface LeaderboardRow {
  member_id: string;
  rank: number;
  name: string;
  initials: string;
  distance_m: number;
  is_me: boolean;
  bar_pct: number;
}

export interface FeedPost {
  id: string;
  author_id: string;
  author: string;
  initials: string;
  created_at: string;
  body: string;
  run_label: string | null;
  distance_m: number | null;
  avg_pace_s_per_km: number | null;
  photos: string[];
  kudos_count: number;
  i_gave_kudos: boolean;
  comment_count: number;
}

export interface Race {
  id: string;
  name: string;
  race_date: string;
  location: string | null;
  note: string | null;
  signup_url: string | null;
  entry_count: number;
  i_am_entered: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  short_label: string;
  target_m: number;
  progress_m: number;
  days_left: number;
  ends_on: string;
}

export interface Me {
  id: string;
  member_number: number;
  full_name: string;
  initials: string;
  email: string;
  pace_group: PaceGroup;
  joined_at: string;
  kit_size: string | null;
  membership_status: 'active' | 'lapsed' | 'trial';
  membership_renews_on: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notify_run_day: boolean;
  notify_chat: boolean;
  strava_connected: boolean;
  default_days: string[];
  monthly_target_m: number;
  role: 'member' | 'leader' | 'admin';
  clan_runs: number;
  year_distance_m: number;
}

export interface PostComment {
  id: string;
  author: string;
  initials: string;
  body: string;
  created_at: string;
  is_mine: boolean;
}

export interface RunContact {
  member_id: string;
  name: string;
  pace_group: PaceGroup;
  contact_name: string | null;
  contact_phone: string | null;
}

export interface SeriesDetails {
  id: string;
  title: string;
  start_time: string;
  meet_point_name: string;
  meet_lat: number | null;
  meet_lng: number | null;
  after_label: string;
  description: string;
}
