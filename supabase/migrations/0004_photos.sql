    -- Photography — the handoff's "Assets" section.
    --
    -- Two kinds, and they behave differently:
    --
    --   feed photos   uploaded by members, one bucket folder per member
    --   run photos    club photography for the Home hero, set by leaders
    --
    -- Both live in one private bucket. Private rather than public because the clan
    -- is a membership: "anyone signed in reads the feed" is the rule everywhere else
    -- in this schema, and a public bucket would hand every photo to anyone who
    -- guessed a URL. The client signs read URLs on demand.

    -- ---------------------------------------------------------------- hero photos
    --
    -- The Home hero shows a photograph of the next run. Nothing in the handoff says
    -- where it comes from, so it follows the same shape the meet point already
    -- uses: a default on the series, overridable for a single occurrence when a
    -- session moves somewhere with a better view.

    alter table public.run_series
      add column if not exists hero_photo_path text;

    alter table public.run_occurrence
      add column if not exists override_hero_photo_path text;

    comment on column public.run_series.hero_photo_path is
      'Storage path in the photos bucket. Null falls back to the labelled placeholder.';

    -- ---------------------------------------------------------------- bucket

    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'photos', 'photos', false,
      10485760,   -- 10 MB; the client downscales to ~1080px before upload
      array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    )
    on conflict (id) do nothing;

    -- ---------------------------------------------------------------- storage policies
    --
    -- Layout: posts/<member_id>/<uuid>.jpg  and  runs/<series_slug>/<uuid>.jpg
    -- A member may write only inside their own posts/ folder; leaders own runs/.

    drop policy if exists photos_read on storage.objects;
    create policy photos_read on storage.objects
      for select to authenticated
      using (bucket_id = 'photos');

    drop policy if exists photos_insert_own on storage.objects;
    create policy photos_insert_own on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'photos'
        and (storage.foldername(name))[1] = 'posts'
        and (storage.foldername(name))[2] = auth.uid()::text
      );

    drop policy if exists photos_update_own on storage.objects;
    create policy photos_update_own on storage.objects
      for update to authenticated
      using (
        bucket_id = 'photos'
        and (storage.foldername(name))[1] = 'posts'
        and (storage.foldername(name))[2] = auth.uid()::text
      );

    drop policy if exists photos_delete_own on storage.objects;
    create policy photos_delete_own on storage.objects
      for delete to authenticated
      using (
        bucket_id = 'photos'
        and (storage.foldername(name))[1] = 'posts'
        and (storage.foldername(name))[2] = auth.uid()::text
      );

    -- Club photography for the run heroes.
    drop policy if exists photos_runs_leader on storage.objects;
    create policy photos_runs_leader on storage.objects
      for all to authenticated
      using (
        bucket_id = 'photos'
        and (storage.foldername(name))[1] = 'runs'
        and public.is_leader()
      )
      with check (
        bucket_id = 'photos'
        and (storage.foldername(name))[1] = 'runs'
        and public.is_leader()
      );

    -- ---------------------------------------------------------------- api

    -- Hero photo on the upcoming-runs payload, so Home can render it without a
    -- second call. Replaces the version in 0003.
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

    -- Attaching a post to an activity and photos in one call, so a composer that
    -- fails halfway cannot leave a post with no body or photos with no post.
    create or replace function public.api_create_post(
      p_body          text,
      p_photo_paths   text[] default '{}',
      p_occurrence_id uuid default null,
      p_activity_id   uuid default null
    ) returns jsonb
      language plpgsql security definer set search_path = public
    as $$
    declare
      v_post uuid;
      v_path text;
      v_i    int := 0;
    begin
      if auth.uid() is null then
        raise exception 'not authenticated' using errcode = '28000';
      end if;

      if coalesce(trim(p_body), '') = '' and coalesce(array_length(p_photo_paths, 1), 0) = 0 then
        raise exception 'a post needs a body or a photo';
      end if;

      insert into public.post (author_id, body, occurrence_id, activity_id)
      values (auth.uid(), coalesce(p_body, ''), p_occurrence_id, p_activity_id)
      returning id into v_post;

      foreach v_path in array coalesce(p_photo_paths, '{}') loop
        -- Only paths inside the caller's own folder; a crafted request must not be
        -- able to attach someone else's upload to its post.
        if split_part(v_path, '/', 1) = 'posts' and split_part(v_path, '/', 2) = auth.uid()::text then
          insert into public.post_photo (post_id, storage_path, position)
          values (v_post, v_path, v_i);
          v_i := v_i + 1;
        end if;
      end loop;

      return jsonb_build_object('id', v_post);
    end;
    $$;

    revoke all on function public.api_create_post(text, text[], uuid, uuid) from public, anon;
    grant execute on function public.api_create_post(text, text[], uuid, uuid) to authenticated;
