-- Aggregate RPCs — DATA_MODEL_AND_API.md §2 (derived values) and §3 (API surface).
--
-- Everything the designs show as a number is computed here rather than stored,
-- so there is one definition of "this week" and it is the club's week, not the
-- device's. Each screen maps to one call:
--
--   Home + Schedule -> api_upcoming_runs
--   Run sheet       -> api_run_detail
--   Stats           -> api_my_stats + api_leaderboard
--   Feed            -> api_feed
--   Runs / races    -> api_races
--   Challenge bar   -> api_active_challenge

-- ---------------------------------------------------------------- date helpers

-- Monday-start ISO week containing the given instant, in club time.
create or replace function public.club_week_start(p_at timestamptz default now())
  returns date language sql stable parallel safe
as $$
  select date_trunc('week', p_at at time zone public.app_tz())::date
$$;

create or replace function public.club_month_start(p_at timestamptz default now())
  returns date language sql stable parallel safe
as $$
  select date_trunc('month', p_at at time zone public.app_tz())::date
$$;

-- Club-local date of an activity, used for the day strip and weekly buckets.
create or replace function public.club_date(p_at timestamptz)
  returns date language sql stable parallel safe
as $$ select (p_at at time zone public.app_tz())::date $$;

-- ---------------------------------------------------------------- runs

-- One call feeds Home ("THIS WEEK — 3 CLAN RUNS") and Schedule.
-- Returns the next p_limit scheduled occurrences with everything the rows show:
-- going count, my RSVP, per-pace-group counts and a four-avatar crew preview.
create or replace function public.api_upcoming_runs(p_limit int default 8)
  returns jsonb
  language sql stable security definer set search_path = public
as $$
  -- Columns are listed rather than `o.*, s.*` because both tables have an `id`.
  with upcoming as (
    select o.id          as occurrence_id,
           o.series_id,
           o.starts_at,
           o.status,
           o.override_meet_point_name,
           o.override_meet_lat,
           o.override_meet_lng,
           o.override_notes,
           s.slug,
           s.title,
           s.subtitle,
           s.meet_point_name,
           s.meet_lat,
           s.meet_lng,
           s.distance_label,
           s.surface,
           s.after_label,
           s.description
    from public.run_occurrence o
    join public.run_series s on s.id = o.series_id
    where o.starts_at > now()
      and o.status = 'scheduled'
      and s.active
    order by o.starts_at
    limit p_limit
  )
  select coalesce(jsonb_agg(row order by starts_at), '[]'::jsonb) from (
    select
      u.starts_at,
      jsonb_build_object(
        'occurrence_id', u.occurrence_id,
        'series_id',     u.series_id,
        'slug',          u.slug,
        'title',         u.title,
        'subtitle',      u.subtitle,
        'starts_at',     u.starts_at,
        'status',        u.status,
        'meet_point',    coalesce(u.override_meet_point_name, u.meet_point_name),
        'meet_lat',      coalesce(u.override_meet_lat, u.meet_lat),
        'meet_lng',      coalesce(u.override_meet_lng, u.meet_lng),
        'distance_label', u.distance_label,
        'surface',       u.surface,
        'after_label',   u.after_label,
        'description',   u.description,
        'override_notes', u.override_notes,
        'going_count', (
          select count(*) from public.rsvp r
          where r.occurrence_id = u.occurrence_id and r.state = 'going'
        ),
        'my_rsvp', (
          select jsonb_build_object('state', r.state, 'pace_group', r.pace_group)
          from public.rsvp r
          where r.occurrence_id = u.occurrence_id and r.member_id = auth.uid()
        ),
        'pace_group_counts', (
          select coalesce(jsonb_object_agg(g, n), '{}'::jsonb) from (
            select r.pace_group as g, count(*) as n
            from public.rsvp r
            where r.occurrence_id = u.occurrence_id and r.state = 'going'
            group by r.pace_group
          ) pg
        ),
        'crew', (
          select coalesce(jsonb_agg(jsonb_build_object('initials', c.initials)), '[]'::jsonb)
          from (
            select public.initials(m.full_name) as initials
            from public.rsvp r
            join public.member m on m.id = r.member_id
            where r.occurrence_id = u.occurrence_id and r.state = 'going' and m.deleted_at is null
            order by r.created_at
            limit 4
          ) c
        )
      ) as row
    from upcoming u
  ) x;
$$;

-- The bottom sheet: everything above plus the full roster and recent chat.
create or replace function public.api_run_detail(p_occurrence uuid)
  returns jsonb
  language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'occurrence_id',  o.id,
    'slug',           s.slug,
    'title',          s.title,
    'subtitle',       s.subtitle,
    'starts_at',      o.starts_at,
    'status',         o.status,
    'meet_point',     coalesce(o.override_meet_point_name, s.meet_point_name),
    'meet_lat',       coalesce(o.override_meet_lat, s.meet_lat),
    'meet_lng',       coalesce(o.override_meet_lng, s.meet_lng),
    'distance_label', s.distance_label,
    'surface',        s.surface,
    'after_label',    s.after_label,
    'description',    s.description,
    'override_notes', o.override_notes,
    'going_count', (
      select count(*) from public.rsvp r where r.occurrence_id = o.id and r.state = 'going'
    ),
    'my_rsvp', (
      select jsonb_build_object('state', r.state, 'pace_group', r.pace_group)
      from public.rsvp r where r.occurrence_id = o.id and r.member_id = auth.uid()
    ),
    'pace_group_counts', (
      select coalesce(jsonb_object_agg(g, n), '{}'::jsonb) from (
        select r.pace_group as g, count(*) as n
        from public.rsvp r
        where r.occurrence_id = o.id and r.state = 'going'
        group by r.pace_group
      ) pg
    ),
    'roster', (
      -- signed-in member first, so their accent "YOU" chip leads the grid
      select coalesce(jsonb_agg(x order by x->>'sort'), '[]'::jsonb) from (
        select jsonb_build_object(
          'member_id',  m.id,
          'initials',   public.initials(m.full_name),
          'name',       m.full_name,
          'pace_group', r.pace_group,
          'is_me',      m.id = auth.uid(),
          'sort',       case when m.id = auth.uid() then '0' else '1' || m.full_name end
        ) as x
        from public.rsvp r
        join public.member m on m.id = r.member_id
        where r.occurrence_id = o.id and r.state = 'going' and m.deleted_at is null
      ) roster
    ),
    'messages', (
      select coalesce(jsonb_agg(x order by x->>'created_at'), '[]'::jsonb) from (
        select jsonb_build_object(
          'id',         msg.id,
          'author',     m.full_name,
          'initials',   public.initials(m.full_name),
          'body',       msg.body,
          'pinned',     msg.pinned,
          'created_at', msg.created_at
        ) as x
        from public.run_message msg
        join public.member m on m.id = msg.author_id
        where msg.occurrence_id = o.id
        order by msg.created_at desc
        limit 50
      ) chat
    )
  )
  from public.run_occurrence o
  join public.run_series s on s.id = o.series_id
  where o.id = p_occurrence;
$$;

-- Idempotent RSVP. Returns the authoritative count so the client can reconcile
-- its optimistic toggle (README "Interactions": optimistic, single source of
-- truth per run id).
create or replace function public.api_set_rsvp(
  p_occurrence uuid,
  p_state      text,
  p_pace_group text default null
) returns jsonb
  language plpgsql security definer set search_path = public
as $$
declare
  v_pace public.pace_group;
  v_me   uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  v_pace := coalesce(
    nullif(p_pace_group, '')::public.pace_group,
    (select pace_group from public.member where id = v_me)
  );

  -- The row survives a cancel so counts and history stay honest.
  insert into public.rsvp (occurrence_id, member_id, pace_group, state)
  values (p_occurrence, v_me, v_pace, p_state::public.rsvp_state)
  on conflict (occurrence_id, member_id) do update
    set state = excluded.state,
        pace_group = excluded.pace_group,
        updated_at = now();

  return jsonb_build_object(
    'going_count', (
      select count(*) from public.rsvp
      where occurrence_id = p_occurrence and state = 'going'
    ),
    'my_rsvp', jsonb_build_object('state', p_state, 'pace_group', v_pace)
  );
end;
$$;

-- ---------------------------------------------------------------- stats

-- One call feeds the whole Stats screen and Home's "YOUR WEEK" panel.
create or replace function public.api_my_stats()
  returns jsonb
  language sql stable security definer set search_path = public
as $$
  with me as (
    select id, monthly_target_m from public.member where id = auth.uid()
  ),
  wk as (
    select a.* from public.activity a, me
    where a.member_id = me.id
      and public.club_date(a.started_at) >= public.club_week_start()
      and public.club_date(a.started_at) <  public.club_week_start() + 7
  ),
  -- 8 weekly buckets, oldest -> current
  weeks as (
    select gs.i,
           public.club_week_start() - ((7 - gs.i) * 7) as w_start
    from generate_series(0, 7) as gs(i)
  ),
  weeks8 as (
    select w.i,
           w.w_start,
           coalesce((
             select sum(a.distance_m) from public.activity a, me
             where a.member_id = me.id
               and public.club_date(a.started_at) >= w.w_start
               and public.club_date(a.started_at) <  w.w_start + 7
           ), 0)::bigint as distance_m
    from weeks w
  ),
  -- streak: consecutive ISO weeks with >= 1 activity, ending this week or last.
  -- A week that is still in progress shouldn't break the streak, so counting
  -- starts from last week when this one has no run in it yet.
  weekset as (
    select distinct date_trunc('week', a.started_at at time zone public.app_tz())::date as w
    from public.activity a, me where a.member_id = me.id
  ),
  anchor as (
    select case
      when exists (select 1 from weekset where w = public.club_week_start())
        then public.club_week_start()
      when exists (select 1 from weekset where w = public.club_week_start() - 7)
        then public.club_week_start() - 7
    end as w0
  ),
  -- Walking back from the anchor, the nth row is on the streak only while its
  -- week is exactly n-1 weeks earlier. After any gap that equality can never
  -- hold again, so this counts the unbroken run and nothing past it.
  streak as (
    select count(*)::int as n
    from (
      select ws.w, (row_number() over (order by ws.w desc))::int as rn
      from weekset ws, anchor
      where anchor.w0 is not null and ws.w <= anchor.w0
    ) s, anchor
    where s.w = anchor.w0 - ((s.rn - 1) * 7)
  ),
  month_m as (
    select coalesce(sum(a.distance_m), 0)::bigint as m
    from public.activity a, me
    where a.member_id = me.id
      and public.club_date(a.started_at) >= public.club_month_start()
  ),
  year_m as (
    select coalesce(sum(a.distance_m), 0)::bigint as m
    from public.activity a, me
    where a.member_id = me.id
      and public.club_date(a.started_at) >= date_trunc('year', now() at time zone public.app_tz())::date
  ),
  rank_row as (
    select rank from (
      select a.member_id,
             rank() over (order by sum(a.distance_m) desc, count(*) desc) as rank
      from public.activity a
      where public.club_date(a.started_at) >= public.club_month_start()
      group by a.member_id
    ) r, me where r.member_id = me.id
  )
  select jsonb_build_object(
    'week', jsonb_build_object(
      'distance_m',     coalesce((select sum(distance_m) from wk), 0),
      'runs',           (select count(*) from wk),
      'moving_seconds', coalesce((select sum(moving_seconds) from wk), 0),
      -- Monday..Sunday booleans for the 7-cell day strip
      'days', (
        select jsonb_agg(d.hit order by d.i) from (
          select gs.i,
                 exists (
                   select 1 from wk
                   where public.club_date(wk.started_at) = public.club_week_start() + gs.i
                 ) as hit
          from generate_series(0, 6) as gs(i)
        ) d
      )
    ),
    'weeks8', (select jsonb_agg(jsonb_build_object('week_start', w_start, 'distance_m', distance_m) order by i) from weeks8),
    'month_distance_m', (select m from month_m),
    'monthly_target_m', (select monthly_target_m from me),
    'month_progress_pct', least(100, round(
      (select m from month_m)::numeric / nullif((select monthly_target_m from me), 0) * 100
    ))::int,
    'year_distance_m', (select m from year_m),
    'streak_weeks',    coalesce((select n from streak), 0),
    'clan_runs', (
      select count(*) from public.activity a, me
      where a.member_id = me.id and a.occurrence_id is not null
    ),
    'rank', (select rank from rank_row)
  );
$$;

-- Top p_limit for the period, plus the signed-in member's own row even when
-- they rank below the cut — the design tints "You" on this list, so it has to
-- be on it. With a 300-member clan, returning the whole board would be a
-- megabyte of JSON to render ten rows.
create or replace function public.api_leaderboard(
  p_period text default 'month',
  p_limit  int  default 10
) returns jsonb
  language sql stable security definer set search_path = public
as $$
  with since as (
    select case p_period
             when 'week'  then public.club_week_start()
             when 'year'  then date_trunc('year', now() at time zone public.app_tz())::date
             else public.club_month_start()
           end as d
  ),
  totals as (
    select a.member_id,
           sum(a.distance_m)::bigint as distance_m,
           count(*) as runs
    from public.activity a, since
    where public.club_date(a.started_at) >= since.d
    group by a.member_id
  ),
  ranked as (
    select t.*,
           m.full_name,
           row_number() over (order by t.distance_m desc, t.runs desc, m.full_name) as rank,
           max(t.distance_m) over () as top_m
    from totals t
    join public.member m on m.id = t.member_id
    where m.deleted_at is null
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'member_id',  member_id,
    'rank',       rank,
    'name',       case when member_id = auth.uid() then 'You' else full_name end,
    'initials',   public.initials(full_name),
    'distance_m', distance_m,
    'is_me',      member_id = auth.uid(),
    -- bar width = km / top km, as a percentage
    'bar_pct',    round(distance_m::numeric / nullif(top_m, 0) * 100)::int
  ) order by rank), '[]'::jsonb)
  from ranked
  where rank <= p_limit or member_id = auth.uid();
$$;

-- ---------------------------------------------------------------- feed

create or replace function public.api_feed(
  p_cursor timestamptz default null,
  p_limit  int default 20
) returns jsonb
  language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(x order by (x->>'created_at') desc), '[]'::jsonb) from (
    select jsonb_build_object(
      'id',            p.id,
      'author_id',     p.author_id,
      'author',        m.full_name,
      'initials',      public.initials(m.full_name),
      'created_at',    p.created_at,
      'body',          p.body,
      'run_label',     s.title,
      'distance_m',    a.distance_m,
      'avg_pace_s_per_km', a.avg_pace_s_per_km,
      'photos', (
        select coalesce(jsonb_agg(ph.storage_path order by ph.position), '[]'::jsonb)
        from public.post_photo ph where ph.post_id = p.id
      ),
      'kudos_count',   (select count(*) from public.kudos k where k.post_id = p.id),
      'i_gave_kudos',  exists (
        select 1 from public.kudos k where k.post_id = p.id and k.member_id = auth.uid()
      ),
      'comment_count', (
        select count(*) from public.comment c where c.post_id = p.id and c.deleted_at is null
      )
    ) as x
    from public.post p
    join public.member m on m.id = p.author_id
    left join public.activity a on a.id = p.activity_id
    left join public.run_occurrence o on o.id = p.occurrence_id
    left join public.run_series s on s.id = o.series_id
    where p.deleted_at is null
      and (p_cursor is null or p.created_at < p_cursor)
    order by p.created_at desc
    limit p_limit
  ) f;
$$;

create or replace function public.api_toggle_kudos(p_post uuid, p_on boolean)
  returns jsonb
  language plpgsql security definer set search_path = public
as $$
declare v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if p_on then
    insert into public.kudos (post_id, member_id) values (p_post, v_me)
    on conflict do nothing;
  else
    delete from public.kudos where post_id = p_post and member_id = v_me;
  end if;

  return jsonb_build_object(
    'kudos_count', (select count(*) from public.kudos where post_id = p_post),
    'i_gave_kudos', p_on
  );
end;
$$;

-- ---------------------------------------------------------------- races & challenge

create or replace function public.api_races(p_upcoming boolean default true)
  returns jsonb
  language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',          r.id,
    'name',        r.name,
    'race_date',   r.race_date,
    'location',    r.location,
    'note',        r.note,
    'signup_url',  r.signup_url,
    'entry_count', (select count(*) from public.race_entry e where e.race_id = r.id),
    'i_am_entered', exists (
      select 1 from public.race_entry e where e.race_id = r.id and e.member_id = auth.uid()
    )
  ) order by r.race_date), '[]'::jsonb)
  from public.race r
  where not p_upcoming or r.race_date >= (now() at time zone public.app_tz())::date;
$$;

create or replace function public.api_active_challenge()
  returns jsonb
  language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'id',          c.id,
    'title',       c.title,
    'short_label', c.short_label,
    'target_m',    c.target_m,
    'progress_m', (
      -- solo runs included when the challenge says so — the caption promises it
      select coalesce(sum(a.distance_m), 0)
      from public.activity a
      where public.club_date(a.started_at) between c.starts_on and c.ends_on
        and (c.counts_solo_runs or a.occurrence_id is not null)
    ),
    'days_left', greatest(0, c.ends_on - (now() at time zone public.app_tz())::date),
    'ends_on',   c.ends_on
  )
  from public.challenge c
  where c.active
  order by c.ends_on
  limit 1;
$$;

-- ---------------------------------------------------------------- profile

create or replace function public.api_me()
  returns jsonb
  language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'id',                m.id,
    'member_number',     m.member_number,
    'full_name',         m.full_name,
    'initials',          public.initials(m.full_name),
    'email',             m.email,
    'pace_group',        m.pace_group,
    'joined_at',         m.joined_at,
    'kit_size',          m.kit_size,
    'membership_status', m.membership_status,
    'membership_renews_on', m.membership_renews_on,
    'emergency_contact_name',  m.emergency_contact_name,
    'emergency_contact_phone', m.emergency_contact_phone,
    'notify_run_day',    m.notify_run_day,
    'notify_chat',       m.notify_chat,
    'strava_connected',  m.strava_athlete_id is not null,
    'default_days',      m.default_days,
    'monthly_target_m',  m.monthly_target_m,
    'role',              m.role,
    'clan_runs', (
      select count(*) from public.activity a
      where a.member_id = m.id and a.occurrence_id is not null
    ),
    'year_distance_m', (
      select coalesce(sum(a.distance_m), 0) from public.activity a
      where a.member_id = m.id
        and public.club_date(a.started_at) >= date_trunc('year', now() at time zone public.app_tz())::date
    )
  )
  from public.member m
  where m.id = auth.uid();
$$;

-- §6 gap 3: the Home panel's "LOG A RUN +" affordance had no screen behind it.
create or replace function public.api_log_activity(
  p_started_at     timestamptz,
  p_distance_m     int,
  p_moving_seconds int,
  p_occurrence_id  uuid default null,
  p_note           text default null
) returns jsonb
  language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  insert into public.activity (member_id, occurrence_id, started_at, distance_m, moving_seconds, source, note)
  values (auth.uid(), p_occurrence_id, p_started_at, p_distance_m, p_moving_seconds, 'manual', p_note)
  returning id into v_id;

  return jsonb_build_object('id', v_id);
end;
$$;

-- ---------------------------------------------------------------- grants

revoke all on function
  public.api_upcoming_runs(int),
  public.api_run_detail(uuid),
  public.api_set_rsvp(uuid, text, text),
  public.api_my_stats(),
  public.api_leaderboard(text, int),
  public.api_feed(timestamptz, int),
  public.api_toggle_kudos(uuid, boolean),
  public.api_races(boolean),
  public.api_active_challenge(),
  public.api_me(),
  public.api_log_activity(timestamptz, int, int, uuid, text),
  public.ensure_occurrences(int)
from public, anon;

grant execute on function
  public.api_upcoming_runs(int),
  public.api_run_detail(uuid),
  public.api_set_rsvp(uuid, text, text),
  public.api_my_stats(),
  public.api_leaderboard(text, int),
  public.api_feed(timestamptz, int),
  public.api_toggle_kudos(uuid, boolean),
  public.api_races(boolean),
  public.api_active_challenge(),
  public.api_me(),
  public.api_log_activity(timestamptz, int, int, uuid, text),
  public.ensure_occurrences(int)
to authenticated;
