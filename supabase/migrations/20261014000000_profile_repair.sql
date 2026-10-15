-- Accounts created before the first migration ran have no profile row, so
-- creating events or rating fails (events_created_by_fkey). This backfills
-- them and gives the app a safe way to create a missing profile on sign-in.

insert into public.profiles (id, username)
select u.id, 'vibe_' || substr(replace(u.id::text, '-', ''), 1, 8)
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

create or replace function public.ensure_my_profile()
returns void language sql security definer set search_path = public as $$
  insert into profiles (id, username)
  select auth.uid(), 'vibe_' || substr(replace(auth.uid()::text, '-', ''), 1, 8)
  where auth.uid() is not null
  on conflict (id) do nothing;
$$;
grant execute on function public.ensure_my_profile() to authenticated;
