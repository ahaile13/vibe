-- Admins: accounts that can delete any event, whoever created it.
-- Granting admin is SQL-editor only (no insert/update policies), so nobody can make themselves an admin from the app.
-- To grant:  insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';
-- To revoke: delete from public.admins where user_id = (select id from auth.users where email = 'you@example.com');

create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
drop policy if exists "see my admin row" on public.admins;
create policy "see my admin row" on public.admins for select using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

-- Admins can see (and so delete) unlisted events too.
drop policy if exists "public events or mine" on public.events;
create policy "public events or mine" on public.events for select
  using (visibility = 'public' or created_by = auth.uid() or public.is_admin());

drop policy if exists "delete own events" on public.events;
drop policy if exists "delete own events or admin" on public.events;
create policy "delete own events or admin" on public.events for delete
  using (created_by = auth.uid() or public.is_admin());
