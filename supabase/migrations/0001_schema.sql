-- Exa Running Clan — core schema
-- Mirrors design_handoff_exa_running_clan/DATA_MODEL_AND_API.md §1.
-- All timestamps are stored UTC; every user-facing boundary (week, day, month)
-- is computed in the club timezone, not the device's. See app_tz().

create extension if not exists "pgcrypto";

-- The club runs on Cyprus time. Centralised so §2's timezone note holds everywhere.
create or replace function public.app_tz() returns text
  language sql immutable parallel safe
as $$ select 'Asia/Nicosia'::text $$;

-- ---------------------------------------------------------------- enums

create type public.membership_status as enum ('active', 'lapsed', 'trial');
create type public.member_role       as enum ('member', 'leader', 'admin');
create type public.occurrence_status as enum ('scheduled', 'cancelled', 'moved');
create type public.rsvp_state        as enum ('going', 'out');
create type public.activity_source   as enum ('manual', 'strava', 'import');

-- Pace groups are a closed set in the designs (five segmented options).
create domain public.pace_group as text
  check (value in ('4:30', '5:00', '5:30', '6:00', '6:30'));

-- ---------------------------------------------------------------- member

create sequence if not exists public.member_number_seq start 1;

create table public.member (
  id                       uuid primary key references auth.users (id) on delete cascade,
  member_number            int  not null unique default nextval('public.member_number_seq'),
  full_name                text not null,
  email                    text not null unique,
  avatar_url               text,
  pace_group               public.pace_group not null default '5:30',
  home_city                text not null default 'Limassol',
  joined_at                timestamptz not null default now(),
  kit_size                 text,
  emergency_contact_name   text,
  emergency_contact_phone  text,
  membership_status        public.membership_status not null default 'trial',
  membership_renews_on     date,
  notify_run_day           boolean not null default true,
  notify_chat              boolean not null default true,
  strava_athlete_id        text unique,
  default_days             text[] not null default '{tue,thu,sat}',
  -- §6 gap 1: the Stats ring needs a denominator and no screen in the handoff
  -- sets one. Defaulted to 150 km/month — roughly what the clan's three weekly
  -- sessions come to — so the ring renders sensibly for a new member. Needs a
  -- settings row before launch.
  monthly_target_m         int not null default 150000,
  role                     public.member_role not null default 'member',
  deleted_at               timestamptz
);

create index member_active_idx on public.member (deleted_at) where deleted_at is null;

-- Initials fallback for the avatar squares: first letters of first + last name.
create or replace function public.initials(p_name text) returns text
  language sql immutable parallel safe
as $$
  select upper(
    left(coalesce(split_part(p_name, ' ', 1), ''), 1) ||
    case
      when array_length(string_to_array(trim(p_name), ' '), 1) > 1
        then left(split_part(trim(p_name), ' ', array_length(string_to_array(trim(p_name), ' '), 1)), 1)
      else ''
    end
  )
$$;

-- New auth user -> roster row. full_name / pace_group ride in on the signup metadata.
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public
as $$
begin
  insert into public.member (id, full_name, email, pace_group, default_days, membership_status)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'pace_group', ''), '5:30'),
    coalesce(
      (select array_agg(value::text) from jsonb_array_elements_text(
        case jsonb_typeof(new.raw_user_meta_data -> 'default_days')
          when 'array' then new.raw_user_meta_data -> 'default_days'
          else '["tue","thu","sat"]'::jsonb
        end) as value),
      '{tue,thu,sat}'
    ),
    'trial'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- runs

create table public.run_series (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  weekday         int  not null check (weekday between 1 and 7),  -- ISO: 1 = Monday
  start_time      time not null,
  timezone        text not null default 'Asia/Nicosia',
  meet_point_name text not null,
  meet_lat        numeric(9, 6),
  meet_lng        numeric(9, 6),
  distance_label  text not null,
  surface         text not null,
  after_label     text not null,
  description     text not null,
  subtitle        text not null default '',   -- "GSO Track · 6 × 800m" on the Home row
  pace_groups     text[] not null default '{4:30,5:00,5:30,6:00,6:30}',
  active          boolean not null default true
);

create table public.run_occurrence (
  id                        uuid primary key default gen_random_uuid(),
  series_id                 uuid not null references public.run_series (id) on delete cascade,
  starts_at                 timestamptz not null,
  status                    public.occurrence_status not null default 'scheduled',
  override_meet_point_name  text,
  override_meet_lat         numeric(9, 6),
  override_meet_lng         numeric(9, 6),
  override_notes            text,
  weather_temp_c            int,
  unique (series_id, starts_at)
);

create index run_occurrence_starts_idx on public.run_occurrence (starts_at);

create table public.rsvp (
  id            uuid primary key default gen_random_uuid(),
  occurrence_id uuid not null references public.run_occurrence (id) on delete cascade,
  member_id     uuid not null references public.member (id) on delete cascade,
  pace_group    public.pace_group not null,
  state         public.rsvp_state not null default 'going',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (occurrence_id, member_id)
);

create index rsvp_going_idx on public.rsvp (occurrence_id) where state = 'going';

-- ---------------------------------------------------------------- activity

create table public.activity (
  id             uuid primary key default gen_random_uuid(),
  member_id      uuid not null references public.member (id) on delete cascade,
  occurrence_id  uuid references public.run_occurrence (id) on delete set null,
  started_at     timestamptz not null,
  distance_m     int not null check (distance_m > 0),
  moving_seconds int not null check (moving_seconds > 0),
  avg_pace_s_per_km int generated always as
    (round(moving_seconds::numeric / (distance_m::numeric / 1000))::int) stored,
  source         public.activity_source not null default 'manual',
  external_id    text unique,
  is_pb          boolean not null default false,
  note           text
);

create index activity_member_time_idx on public.activity (member_id, started_at desc);
create index activity_time_idx on public.activity (started_at desc);

-- ---------------------------------------------------------------- feed

create table public.post (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references public.member (id) on delete cascade,
  activity_id   uuid references public.activity (id) on delete set null,
  occurrence_id uuid references public.run_occurrence (id) on delete set null,
  body          text not null,
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create index post_feed_idx on public.post (created_at desc) where deleted_at is null;

create table public.post_photo (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.post (id) on delete cascade,
  storage_path text not null,
  width        int,
  height       int,
  position     int not null default 0
);

create table public.kudos (
  post_id    uuid not null references public.post (id) on delete cascade,
  member_id  uuid not null references public.member (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, member_id)
);

create table public.comment (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.post (id) on delete cascade,
  author_id  uuid not null references public.member (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index comment_post_idx on public.comment (post_id, created_at);

-- Per-run chat. Separate lifecycle from comments — different notification rules.
create table public.run_message (
  id            uuid primary key default gen_random_uuid(),
  occurrence_id uuid not null references public.run_occurrence (id) on delete cascade,
  author_id     uuid not null references public.member (id) on delete cascade,
  body          text not null,
  created_at    timestamptz not null default now(),
  pinned        boolean not null default false
);

create index run_message_idx on public.run_message (occurrence_id, created_at);

-- ---------------------------------------------------------------- races & challenge

create table public.race (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  race_date  date not null,
  location   text,
  note       text,
  signup_url text
);

create table public.race_entry (
  race_id        uuid not null references public.race (id) on delete cascade,
  member_id      uuid not null references public.member (id) on delete cascade,
  distance_label text,
  created_at     timestamptz not null default now(),
  primary key (race_id, member_id)
);

create table public.challenge (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  short_label      text not null,
  target_m         bigint not null,
  starts_on        date not null,
  ends_on          date not null,
  counts_solo_runs boolean not null default true,
  active           boolean not null default true
);

-- ---------------------------------------------------------------- occurrence generation

-- Materialises a rolling window of dated instances from each active series.
-- Idempotent: safe to call on every app start or from a cron job.
create or replace function public.ensure_occurrences(p_weeks int default 8)
  returns int
  language plpgsql security definer set search_path = public
as $$
declare
  s        public.run_series;
  d        date;
  horizon  date := (now() at time zone public.app_tz())::date + (p_weeks * 7);
  made     int  := 0;
begin
  for s in select * from public.run_series where active loop
    -- first occurrence of this weekday on or after today, in club time
    d := (now() at time zone s.timezone)::date;
    d := d + ((s.weekday - extract(isodow from d)::int + 7) % 7);

    while d <= horizon loop
      insert into public.run_occurrence (series_id, starts_at)
      values (s.id, ((d + s.start_time) at time zone s.timezone))
      on conflict (series_id, starts_at) do nothing;
      if found then made := made + 1; end if;
      d := d + 7;
    end loop;
  end loop;

  return made;
end;
$$;
