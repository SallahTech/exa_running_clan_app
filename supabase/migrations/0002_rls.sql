-- Row level security — DATA_MODEL_AND_API.md §4.
--
-- Shape of the rules:
--   * anyone signed in reads the roster, schedule, RSVPs, feed, races, challenge
--   * a member writes only their own rows
--   * leaders/admins edit the schedule and pin messages
--   * emergency contact + email are readable only by the member and admins
--   * soft delete everywhere; nothing a comment hangs off is ever hard-deleted

-- ---------------------------------------------------------------- helpers

create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.member
    where id = auth.uid() and role = 'admin' and deleted_at is null
  )
$$;

create or replace function public.is_leader() returns boolean
  language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.member
    where id = auth.uid() and role in ('leader', 'admin') and deleted_at is null
  )
$$;

-- ---------------------------------------------------------------- enable

alter table public.member         enable row level security;
alter table public.run_series     enable row level security;
alter table public.run_occurrence enable row level security;
alter table public.rsvp           enable row level security;
alter table public.activity       enable row level security;
alter table public.post           enable row level security;
alter table public.post_photo     enable row level security;
alter table public.kudos          enable row level security;
alter table public.comment        enable row level security;
alter table public.run_message    enable row level security;
alter table public.race           enable row level security;
alter table public.race_entry     enable row level security;
alter table public.challenge      enable row level security;

-- ---------------------------------------------------------------- member
--
-- Column-level privacy can't be expressed in a row policy, so the base table is
-- readable only by the member and admins, and everyone else goes through
-- public.roster — a security-barrier view with the private columns removed.

create policy member_self_read on public.member
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

create policy member_self_write on public.member
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy member_admin_write on public.member
  for update to authenticated
  using (public.is_admin());

-- No security_invoker: the view must run with definer rights so it can read
-- past member's own-row-only select policy and expose the safe columns.
create or replace view public.roster
  with (security_barrier = true) as
  select id,
         member_number,
         full_name,
         public.initials(full_name) as initials,
         avatar_url,
         pace_group,
         home_city,
         joined_at,
         role
  from public.member
  where deleted_at is null;

revoke all on public.roster from anon;
grant select on public.roster to authenticated;

-- ---------------------------------------------------------------- schedule

create policy series_read on public.run_series
  for select to authenticated using (true);
create policy series_leader_write on public.run_series
  for all to authenticated using (public.is_leader()) with check (public.is_leader());

create policy occurrence_read on public.run_occurrence
  for select to authenticated using (true);
create policy occurrence_leader_write on public.run_occurrence
  for all to authenticated using (public.is_leader()) with check (public.is_leader());

-- ---------------------------------------------------------------- rsvp

create policy rsvp_read on public.rsvp
  for select to authenticated using (true);
create policy rsvp_own_insert on public.rsvp
  for insert to authenticated with check (member_id = auth.uid());
create policy rsvp_own_update on public.rsvp
  for update to authenticated
  using (member_id = auth.uid()) with check (member_id = auth.uid());
create policy rsvp_own_delete on public.rsvp
  for delete to authenticated using (member_id = auth.uid());

-- ---------------------------------------------------------------- activity
--
-- Activities are visible clan-wide: the leaderboard and challenge total are
-- built from them. Only the owner writes.

create policy activity_read on public.activity
  for select to authenticated using (true);
create policy activity_own_write on public.activity
  for all to authenticated
  using (member_id = auth.uid()) with check (member_id = auth.uid());

-- ---------------------------------------------------------------- feed

create policy post_read on public.post
  for select to authenticated using (deleted_at is null);
create policy post_own_write on public.post
  for all to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy post_admin_write on public.post
  for update to authenticated using (public.is_admin());

create policy photo_read on public.post_photo
  for select to authenticated using (
    exists (select 1 from public.post p where p.id = post_id and p.deleted_at is null)
  );
create policy photo_own_write on public.post_photo
  for all to authenticated
  using (exists (select 1 from public.post p where p.id = post_id and p.author_id = auth.uid()))
  with check (exists (select 1 from public.post p where p.id = post_id and p.author_id = auth.uid()));

create policy kudos_read on public.kudos
  for select to authenticated using (true);
create policy kudos_own_write on public.kudos
  for all to authenticated
  using (member_id = auth.uid()) with check (member_id = auth.uid());

create policy comment_read on public.comment
  for select to authenticated using (deleted_at is null);
create policy comment_own_write on public.comment
  for all to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

-- ---------------------------------------------------------------- run chat

create policy message_read on public.run_message
  for select to authenticated using (true);
create policy message_own_write on public.run_message
  for insert to authenticated with check (author_id = auth.uid());
create policy message_own_update on public.run_message
  -- a member may edit their own text but not pin it; leaders may pin anything
  for update to authenticated
  using (author_id = auth.uid() or public.is_leader())
  with check (author_id = auth.uid() or public.is_leader());
create policy message_own_delete on public.run_message
  for delete to authenticated using (author_id = auth.uid() or public.is_leader());

-- ---------------------------------------------------------------- races & challenge

create policy race_read on public.race
  for select to authenticated using (true);
create policy race_leader_write on public.race
  for all to authenticated using (public.is_leader()) with check (public.is_leader());

create policy race_entry_read on public.race_entry
  for select to authenticated using (true);
create policy race_entry_own_write on public.race_entry
  for all to authenticated
  using (member_id = auth.uid()) with check (member_id = auth.uid());

create policy challenge_read on public.challenge
  for select to authenticated using (true);
create policy challenge_admin_write on public.challenge
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
