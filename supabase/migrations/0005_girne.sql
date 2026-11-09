-- The club's real shape: two weekly runs and the paces it actually runs at, plus
-- 'open' for members who run at whatever feels comfortable. Older pace values map
-- to the nearest real group.

alter domain public.pace_group drop constraint pace_group_check;

update public.member set pace_group = case
  when pace_group in ('4:30', '5:00') then '4:45'
  when pace_group = '5:30' then '6:00'
  else pace_group end;

update public.rsvp set pace_group = case
  when pace_group in ('4:30', '5:00') then '4:45'
  when pace_group = '5:30' then '6:00'
  else pace_group end;

alter domain public.pace_group add constraint pace_group_check
  check (value in ('4:45', '6:00', '6:30', '7:00', 'open'));

alter table public.member alter column pace_group set default 'open';
alter table public.member alter column default_days set default '{wed,sun}';
alter table public.run_series alter column pace_groups set default '{4:45,6:00,6:30,7:00,open}';
update public.run_series set pace_groups = '{4:45,6:00,6:30,7:00,open}';

create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public
as $$
begin
  insert into public.member (id, full_name, email, pace_group, default_days, membership_status)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)),
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'pace_group', ''), 'open'),
    coalesce(
      (select array_agg(value::text) from jsonb_array_elements_text(
        case jsonb_typeof(new.raw_user_meta_data -> 'default_days')
          when 'array' then new.raw_user_meta_data -> 'default_days'
          else '["wed","sun"]'::jsonb
        end) as value),
      '{wed,sun}'
    ),
    'trial'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
