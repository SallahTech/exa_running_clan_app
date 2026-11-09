-- What the app needs to stop pretending: cancelled and moved runs reach members,
-- leaders can run the schedule from the app, comments and race entries work, and
-- devices can register for push.

-- ---------------------------------------------------------------- cancelled runs

-- Upcoming runs now include cancelled and moved ones. Hiding a cancelled run is
-- how someone ends up standing at the track alone.
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
           o.override_hero_photo_path,
           s.slug,
           s.title,
           s.subtitle,
           s.meet_point_name,
           s.meet_lat,
           s.meet_lng,
           s.distance_label,
           s.surface,
           s.after_label,
           s.description,
           s.hero_photo_path
    from public.run_occurrence o
    join public.run_series s on s.id = o.series_id
    where o.starts_at > now()
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
        'hero_photo_path', coalesce(u.override_hero_photo_path, u.hero_photo_path),
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

-- Nobody can commit to a cancelled run, whichever client they use.
create or replace function public.rsvp_not_cancelled() returns trigger
  language plpgsql as $$
begin
  if new.state = 'going' and exists (
    select 1 from public.run_occurrence o where o.id = new.occurrence_id and o.status = 'cancelled'
  ) then
    raise exception 'this run is cancelled' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger rsvp_not_cancelled before insert or update on public.rsvp
  for each row execute function public.rsvp_not_cancelled();

-- ---------------------------------------------------------------- leader tools

create or replace function public.require_leader() returns void
  language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_leader() then
    raise exception 'leaders only' using errcode = '42501';
  end if;
end;
$$;

-- One date: its status, a notice, and a meeting point for this date only.
create or replace function public.api_manage_occurrence(
  p_occurrence uuid,
  p_status     text,
  p_notes      text default null,
  p_meet_point text default null
) returns jsonb
  language plpgsql security definer set search_path = public as $$
begin
  perform public.require_leader();
  update public.run_occurrence set
    status = p_status::public.occurrence_status,
    override_notes = nullif(trim(coalesce(p_notes, '')), ''),
    override_meet_point_name = nullif(trim(coalesce(p_meet_point, '')), '')
  where id = p_occurrence;
  return jsonb_build_object('ok', found);
end;
$$;

-- The weekly run itself. Future dates move with the new start time, keeping their
-- RSVPs; otherwise ensure_occurrences would add a second run beside each old one.
create or replace function public.api_update_series(
  p_series      uuid,
  p_title       text,
  p_start_time  text,
  p_meet_point  text,
  p_lat         numeric default null,
  p_lng         numeric default null,
  p_after       text default null,
  p_description text default null
) returns jsonb
  language plpgsql security definer set search_path = public as $$
declare
  v_time time := p_start_time::time;
begin
  perform public.require_leader();

  update public.run_series set
    title = trim(p_title),
    start_time = v_time,
    meet_point_name = trim(p_meet_point),
    meet_lat = p_lat,
    meet_lng = p_lng,
    after_label = coalesce(nullif(trim(coalesce(p_after, '')), ''), after_label),
    description = coalesce(nullif(trim(coalesce(p_description, '')), ''), description)
  where id = p_series;

  update public.run_occurrence o set
    starts_at = ((public.club_date(o.starts_at) + v_time) at time zone s.timezone)
  from public.run_series s
  where s.id = o.series_id and s.id = p_series and o.starts_at > now();

  return jsonb_build_object('ok', true);
end;
$$;

-- Emergency contacts of the people going on a run. Leaders only: nobody else can
-- read these, and the member table's own policy stays as it is.
create or replace function public.api_run_contacts(p_occurrence uuid)
  returns jsonb
  language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  perform public.require_leader();
  select coalesce(jsonb_agg(jsonb_build_object(
    'member_id', m.id,
    'name', m.full_name,
    'pace_group', r.pace_group,
    'contact_name', m.emergency_contact_name,
    'contact_phone', m.emergency_contact_phone
  ) order by m.full_name), '[]'::jsonb) into v
  from public.rsvp r
  join public.member m on m.id = r.member_id
  where r.occurrence_id = p_occurrence and r.state = 'going' and m.deleted_at is null;
  return v;
end;
$$;

create or replace function public.api_save_race(
  p_name     text,
  p_date     text,
  p_location text default null,
  p_note     text default null,
  p_url      text default null
) returns jsonb
  language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  perform public.require_leader();
  insert into public.race (name, race_date, location, note, signup_url)
  values (trim(p_name), p_date::date, nullif(trim(coalesce(p_location, '')), ''),
          nullif(trim(coalesce(p_note, '')), ''), nullif(trim(coalesce(p_url, '')), ''))
  returning id into v_id;
  return jsonb_build_object('id', v_id);
end;
$$;

create or replace function public.api_delete_race(p_race uuid) returns jsonb
  language plpgsql security definer set search_path = public as $$
begin
  perform public.require_leader();
  delete from public.race where id = p_race;
  return jsonb_build_object('ok', found);
end;
$$;

-- ---------------------------------------------------------------- race entries

create or replace function public.api_set_race_entry(p_race uuid, p_on boolean)
  returns jsonb
  language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if p_on then
    insert into public.race_entry (race_id, member_id) values (p_race, auth.uid())
    on conflict do nothing;
  else
    delete from public.race_entry where race_id = p_race and member_id = auth.uid();
  end if;

  return jsonb_build_object(
    'entry_count', (select count(*) from public.race_entry e where e.race_id = p_race),
    'i_am_entered', p_on
  );
end;
$$;

-- ---------------------------------------------------------------- comments

create or replace function public.api_post_comments(p_post uuid)
  returns jsonb
  language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id,
    'author', m.full_name,
    'initials', public.initials(m.full_name),
    'body', c.body,
    'created_at', c.created_at,
    'is_mine', c.author_id = auth.uid()
  ) order by c.created_at), '[]'::jsonb)
  from public.comment c
  join public.member m on m.id = c.author_id
  where c.post_id = p_post and c.deleted_at is null;
$$;

create or replace function public.api_add_comment(p_post uuid, p_body text)
  returns jsonb
  language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if length(trim(coalesce(p_body, ''))) = 0 then
    raise exception 'empty comment' using errcode = '22023';
  end if;
  insert into public.comment (post_id, author_id, body)
  values (p_post, auth.uid(), trim(p_body))
  returning id into v_id;
  return jsonb_build_object('id', v_id);
end;
$$;

-- ---------------------------------------------------------------- push

-- One row per device. `locale` is so an alert arrives in the member's language.
create table public.push_token (
  token      text primary key,
  member_id  uuid not null references public.member (id) on delete cascade,
  platform   text not null,
  locale     text not null default 'en',
  updated_at timestamptz not null default now()
);

create index push_token_member_idx on public.push_token (member_id);
alter table public.push_token enable row level security;
-- No client policies: only the functions below and the notify function touch it.
revoke all on public.push_token from anon, authenticated;

create or replace function public.api_save_push_token(
  p_token text, p_platform text, p_locale text default 'en'
) returns jsonb
  language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  insert into public.push_token (token, member_id, platform, locale)
  values (p_token, auth.uid(), p_platform, p_locale)
  on conflict (token) do update set
    member_id = auth.uid(), platform = excluded.platform,
    locale = excluded.locale, updated_at = now();
  return jsonb_build_object('ok', true);
end;
$$;

-- Called on sign-out, so a shared phone stops receiving the last member's alerts.
create or replace function public.api_delete_push_token(p_token text) returns jsonb
  language plpgsql security definer set search_path = public as $$
begin
  delete from public.push_token where token = p_token and member_id = auth.uid();
  return jsonb_build_object('ok', true);
end;
$$;

-- ---------------------------------------------------------------- access

do $$
declare f text;
begin
  foreach f in array array[
    'api_upcoming_runs(int)',
    'api_manage_occurrence(uuid, text, text, text)',
    'api_update_series(uuid, text, text, text, numeric, numeric, text, text)',
    'api_run_contacts(uuid)',
    'api_save_race(text, text, text, text, text)',
    'api_delete_race(uuid)',
    'api_set_race_entry(uuid, boolean)',
    'api_post_comments(uuid)',
    'api_add_comment(uuid, text)',
    'api_save_push_token(text, text, text)',
    'api_delete_push_token(text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

revoke all on function public.require_leader() from public, anon;
