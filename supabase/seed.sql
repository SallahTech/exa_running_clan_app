-- Development seed — DATA_MODEL_AND_API.md §5.
--
-- Creates the two standing series, a demo roster of 120 invented members, twelve
-- weeks of activity history, RSVPs, feed posts, run chat and a clan challenge.
-- Everyone and everything here is demo data, not the real club.
--
-- PLACEHOLDERS: the start times and meeting points of the two series below are
-- not the club's real ones yet.
--
-- Every demo account signs in with the password `exaclan2026`.
-- Ayşe Demir <ayse@exaclan.test> is the demo member to sign in as.
--
-- Run with:  supabase db reset      (local)
--            psql "$DATABASE_URL" -f supabase/seed.sql
--
-- Numbers note: the prototype's figures are illustrative and not mutually
-- consistent (its bar chart shows 34 km for the current week while the panel
-- beside it says 24.6). Here the history is seeded and every displayed number is
-- genuinely derived from it, so the screens agree with each other.

begin;

-- ---------------------------------------------------------------- series

insert into public.run_series
  (slug, title, weekday, start_time, meet_point_name, meet_lat, meet_lng,
   distance_label, surface, after_label, subtitle, description, pace_groups)
values
  ('wed', 'Trackday', 3, '19:00', 'Meeting point to be confirmed', null, null,
   'Track session', 'Track', 'Coffee', 'Track session · every pace welcome',
   'Track session for every pace. Coffee together afterwards.',
   '{4:45,6:00,6:30,7:00,open}'),
  ('sun', 'Long Run', 7, '07:00', 'Meeting point to be confirmed', null, null,
   'Long run', 'Road', 'Coffee', 'Your distance · every pace welcome',
   'The week''s long run at your own distance and pace. Coffee together afterwards.',
   '{4:45,6:00,6:30,7:00,open}')
on conflict (slug) do nothing;

-- eight weeks forward, plus the last four weeks back so history can attach to runs
select public.ensure_occurrences(8);

insert into public.run_occurrence (series_id, starts_at)
select s.id, ((d.day + s.start_time) at time zone s.timezone)
from public.run_series s
cross join lateral (
  select generate_series(
    (date_trunc('week', now() at time zone s.timezone)::date - 28)
      + ((s.weekday - 1) % 7),
    (now() at time zone s.timezone)::date,
    interval '7 days'
  )::date as day
) d
on conflict (series_id, starts_at) do nothing;

-- ---------------------------------------------------------------- roster

-- The trigger assigns a member_number from the sequence on insert, and this
-- seed then overwrites it with the number from the designs. Park the sequence
-- above every number the seed claims (1–147 for the named members, 201–310 for
-- the rest) so the two never collide mid-run; it is wound back to the real high
-- water mark at the end.
select setval('public.member_number_seq', 1000);

-- Demo auth users. Password for every account: exaclan2026
create or replace function pg_temp.make_member(
  p_name   text,
  p_email  text,
  p_pace   text,
  p_number int default null,
  p_role   public.member_role default 'member'
) returns uuid
  language plpgsql
as $$
declare v_id uuid := gen_random_uuid();
begin
  -- The token columns must be '' rather than NULL. GoTrue scans them into
  -- non-nullable Go strings, and a NULL makes every login fail with
  -- "Database error querying schema" — including logins for accounts this seed
  -- never touched, because the failure is in the row scan, not the lookup.
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    p_email, crypt('exaclan2026', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_name, 'pace_group', p_pace),
    now(), now(),
    '', '', '', '', '', '', '', ''
  );

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
  values (
    gen_random_uuid(), v_id, v_id::text,
    jsonb_build_object('sub', v_id::text, 'email', p_email, 'email_verified', true),
    'email', now(), now()
  );

  -- the on_auth_user_created trigger has already inserted the member row
  update public.member set
    member_number        = coalesce(p_number, member_number),
    role                 = p_role,
    joined_at            = now() - (random() * 270 + 30) * interval '1 day',
    membership_status    = 'active',
    membership_renews_on = (now() + interval '1 year')::date
  where id = v_id;

  return v_id;
end;
$$;

do $$
declare
  v_anna uuid;
  v_first text[] := array[
    'Mehmet','Elif','Hasan','Zeynep','Mustafa','Fatma','Ali','Emine','Hüseyin','Deniz',
    'Emre','Selin','Can','Ece','Kemal','Aylin','Murat','Sevgi','Ahmet','Derya',
    'James','Emma','Oleg','Anna','David','Sarah','Ibrahim','Nadia','Tom','Leyla'];
  v_last text[] := array[
    'Yılmaz','Kaya','Şahin','Çelik','Öztürk','Arslan','Doğan','Kılıç','Aslan','Kurt',
    'Özkan','Polat','Erdem','Aydın','Smith','Jones','Ivanov','Hassan','Taylor','Güneş'];
  v_paces text[] := array['4:45','6:00','6:30','7:00','open'];
  i int;
  v_name text;
begin
  -- the demo member to sign in as
  v_anna := pg_temp.make_member('Ayşe Demir', 'ayse@exaclan.test', '6:30', 147);
  update public.member set
    kit_size = 'S',
    emergency_contact_name = 'Ali Demir',
    emergency_contact_phone = '+90 533 000 0147',
    joined_at = date '2025-06-01',
    strava_athlete_id = 'demo-strava-147'
  where id = v_anna;

  -- the members named on the leaderboard, feed and run chat
  perform pg_temp.make_member('Kemal Aydın',   'kemal@exaclan.test',   '4:45', 12, 'leader');
  perform pg_temp.make_member('Selin Kaya',    'selin@exaclan.test',   '6:00', 31, 'leader');
  perform pg_temp.make_member('Mehmet Şahin',  'mehmet@exaclan.test',  '7:00', 4,  'leader');
  perform pg_temp.make_member('Zeynep Çelik',  'zeynep@exaclan.test',  '6:30', 88);
  perform pg_temp.make_member('James Taylor',  'james@exaclan.test',   'open', 53);
  perform pg_temp.make_member('Elif Arslan',   'elif@exaclan.test',    '6:00', 66);
  perform pg_temp.make_member('Hasan Doğan',   'hasan@exaclan.test',   '6:30', 91);
  perform pg_temp.make_member('Emma Jones',    'emma@exaclan.test',    'open', 104);
  perform pg_temp.make_member('Oleg Ivanov',   'oleg@exaclan.test',    '4:45', 27);

  -- enough of the rest of the clan for the going counts to be honest
  for i in 1..110 loop
    v_name := v_first[1 + ((i * 7) % array_length(v_first, 1))] || ' ' ||
              v_last[1 + ((i * 13) % array_length(v_last, 1))];
    perform pg_temp.make_member(
      v_name,
      'runner' || lpad(i::text, 3, '0') || '@exaclan.test',
      v_paces[1 + ((i * 3) % 5)],
      200 + i
    );
  end loop;
end $$;

-- ---------------------------------------------------------------- activity history
--
-- p_weekly is km per week, oldest first, ending with the current week. Each week
-- is spread over three sessions so the day strip and "N runs" read plausibly.

create or replace function pg_temp.seed_history(p_member uuid, p_weekly numeric[])
  returns void
  language plpgsql
as $$
declare
  n        int := array_length(p_weekly, 1);
  w        int;
  week_km  numeric;
  parts    numeric[] := array[0.30, 0.28, 0.42];   -- easy / tempo / long
  p        int;
  day_off  int;
  v_start  timestamptz;
  v_dist   int;
  v_occ    uuid;
  v_pace   int;
begin
  for w in 1..n loop
    week_km := p_weekly[w];
    if week_km <= 0 then continue; end if;

    for p in 1..3 loop
      -- Monday easy, Wednesday track, Sunday long
      day_off := case p when 1 then 0 when 2 then 2 else 6 end;

      -- current week: only seed sessions that have already happened
      if w = n and day_off > extract(isodow from (now() at time zone public.app_tz()))::int - 1 then
        continue;
      end if;

      v_start := ((public.club_week_start() - ((n - w) * 7) + day_off)
                  + time '07:00') at time zone public.app_tz();
      v_dist  := round(week_km * parts[p] * 1000)::int;
      if v_dist < 1000 then continue; end if;

      -- pace in seconds per km, a little slower on the long run
      v_pace := case p when 2 then 265 when 3 then 340 else 310 end + (random() * 20)::int;

      -- attach to that day's clan run when there is one
      select o.id into v_occ
      from public.run_occurrence o
      where public.club_date(o.starts_at) = public.club_date(v_start)
      limit 1;

      insert into public.activity
        (member_id, occurrence_id, started_at, distance_m, moving_seconds, source, note)
      values (
        p_member,
        case when p = 2 then v_occ else null end,
        v_start, v_dist, round(v_dist / 1000.0 * v_pace)::int, 'manual',
        case when p = 2 and v_occ is null then 'Solo easy · Girne' else null end
      );
    end loop;
  end loop;
end;
$$;

do $$
declare
  v record;
begin
  -- The demo member: a varied twelve weeks, so the streak and chart have something to show.
  perform pg_temp.seed_history(
    (select id from public.member where member_number = 147),
    array[23, 26, 20, 17, 18, 24, 12, 31, 27, 9, 29, 26]::numeric[]);

  -- the six members above her on the board, in order
  perform pg_temp.seed_history((select id from public.member where email = 'kemal@exaclan.test'),
    array[38, 41, 36, 44, 40, 47, 39, 45, 43, 48, 44, 46]::numeric[]);
  perform pg_temp.seed_history((select id from public.member where email = 'selin@exaclan.test'),
    array[35, 39, 33, 41, 37, 44, 36, 42, 40, 45, 41, 43]::numeric[]);
  perform pg_temp.seed_history((select id from public.member where email = 'mehmet@exaclan.test'),
    array[32, 35, 30, 38, 34, 40, 33, 39, 37, 41, 38, 39]::numeric[]);
  perform pg_temp.seed_history((select id from public.member where email = 'zeynep@exaclan.test'),
    array[29, 32, 27, 34, 31, 36, 30, 35, 33, 37, 34, 35]::numeric[]);
  perform pg_temp.seed_history((select id from public.member where email = 'james@exaclan.test'),
    array[28, 31, 26, 33, 30, 35, 29, 34, 32, 36, 33, 34]::numeric[]);
  perform pg_temp.seed_history((select id from public.member where email = 'elif@exaclan.test'),
    array[27, 29, 25, 31, 28, 33, 28, 32, 30, 34, 31, 32]::numeric[]);

  -- everyone else, so the challenge total and the tail of the board are real
  for v in
    select id, member_number from public.member
    where member_number >= 200 or email in ('hasan@exaclan.test','emma@exaclan.test','oleg@exaclan.test')
  loop
    perform pg_temp.seed_history(v.id, array[
      10 + (v.member_number % 13), 12 + (v.member_number % 11), 9 + (v.member_number % 15),
      14 + (v.member_number % 9),  11 + (v.member_number % 12), 13 + (v.member_number % 10)
    ]::numeric[]);
  end loop;
end $$;

-- ---------------------------------------------------------------- rsvps
--
-- 42 going Wednesday, 58 Sunday.

do $$
declare
  v_target record;
  v_member uuid;
  v_n int;
begin
  for v_target in
    select o.id, s.slug,
           case s.slug when 'wed' then 42 else 58 end as want
    from public.run_occurrence o
    join public.run_series s on s.id = o.series_id
    where o.starts_at > now()
    order by o.starts_at
    limit 2
  loop
    v_n := 0;
    -- the demo member is in for Wednesday
    if v_target.slug = 'wed' then
      insert into public.rsvp (occurrence_id, member_id, pace_group, state)
      select v_target.id, id, pace_group, 'going' from public.member where member_number = 147
      on conflict do nothing;
      v_n := 1;
    end if;

    for v_member in
      select id from public.member
      where member_number <> 147
      order by md5(id::text || v_target.slug)
      limit greatest(0, v_target.want - v_n)
    loop
      insert into public.rsvp (occurrence_id, member_id, pace_group, state)
      select v_target.id, v_member, pace_group, 'going'
      from public.member where id = v_member
      on conflict do nothing;
    end loop;
  end loop;
end $$;

-- ---------------------------------------------------------------- feed

do $$
declare
  v_selin   uuid := (select id from public.member where email = 'selin@exaclan.test');
  v_mehmet uuid := (select id from public.member where email = 'mehmet@exaclan.test');
  v_zeynep   uuid := (select id from public.member where email = 'zeynep@exaclan.test');
  v_post    uuid;
  v_act     uuid;
  v_occ     uuid;
  v_who     uuid;
  r         record;
begin
  for r in
    select * from (values
      (1, 'Sunday miles along the coast, then the best coffee of the week.', 16200, 345, 'sun', 26, 24, 'photo — sunday long run'),
      (2, 'Welcome to the four new runners on the track tonight. You all finished every rep.', 6200, 300, 'wed', 74, 41, 'photo — track session'),
      (3, 'First half marathon distance ever. The 6:30 group stayed with me the whole way.', 21100, 395, 'sun', 194, 63, 'photo — long run finish')
    ) as t(n, body, dist, pace_s, slug, hours_ago, kudos, photo)
  loop
    v_who := case r.n when 1 then v_selin when 2 then v_mehmet else v_zeynep end;

    select o.id into v_occ
    from public.run_occurrence o join public.run_series s on s.id = o.series_id
    where s.slug = r.slug and o.starts_at < now()
    order by o.starts_at desc limit 1;

    insert into public.activity (member_id, occurrence_id, started_at, distance_m, moving_seconds, source)
    values (v_who, v_occ, now() - (r.hours_ago * interval '1 hour'), r.dist,
            round(r.dist / 1000.0 * r.pace_s)::int, 'strava')
    returning id into v_act;

    insert into public.post (author_id, activity_id, occurrence_id, body, created_at)
    values (v_who, v_act, v_occ, r.body, now() - (r.hours_ago * interval '1 hour'))
    returning id into v_post;

    insert into public.post_photo (post_id, storage_path, width, height, position)
    values (v_post, 'placeholder://' || r.photo, 1080, 720, 0);

    -- kudos from a deterministic slice of the roster
    insert into public.kudos (post_id, member_id)
    select v_post, m.id from public.member m
    where m.id <> v_who
    order by md5(m.id::text || v_post::text)
    limit r.kudos
    on conflict do nothing;

    insert into public.comment (post_id, author_id, body, created_at)
    select v_post, m.id,
           (array['Strong.', 'Well run!', 'See you Sunday.', 'Beast mode.', 'Proud of you.',
                  'That pace though.', 'Next time I''m coming.'])[1 + (row_number() over () % 7)::int],
           now() - (r.hours_ago * interval '1 hour') + (row_number() over () * interval '11 minutes')
    from public.member m
    where m.id <> v_who
    order by md5(m.id::text || 'c' || v_post::text)
    limit (case r.n when 1 then 6 when 2 then 12 else 9 end);
  end loop;
end $$;

-- ---------------------------------------------------------------- run chat

insert into public.run_message (occurrence_id, author_id, body, pinned, created_at)
select o.id, m.id, t.body, t.pinned, now() - t.mins * interval '1 minute'
from (values
  ('Spare spikes, size 42, if anyone wants to try them tonight.', false, 240, 'mehmet@exaclan.test'),
  ('First time? Say hello to a leader when you arrive.',           true,  180, 'zeynep@exaclan.test'),
  ('Coffee after, as always. First timers come with us.',          false, 90,  'selin@exaclan.test')
) as t(body, pinned, mins, email)
join public.member m on m.email = t.email
cross join lateral (
  select o.id from public.run_occurrence o
  join public.run_series s on s.id = o.series_id
  where s.slug = 'wed' and o.starts_at > now()
  order by o.starts_at limit 1
) o;

-- ---------------------------------------------------------------- challenge
--
-- No races are seeded: the real calendar is the club's to add. The challenge
-- target is demo data, set so the demo roster is genuinely partway through it.
insert into public.challenge (title, short_label, target_m, starts_on, ends_on, counts_solo_runs, active)
values (
  'Clan Kilometres', 'CLAN KM · TOGETHER', 10000000,
  (now() at time zone public.app_tz())::date - 21,
  (now() at time zone public.app_tz())::date + 9,
  true, true
);

-- Next real signup continues from the roster rather than from 1001.
select setval('public.member_number_seq', (select max(member_number) from public.member));

commit;
