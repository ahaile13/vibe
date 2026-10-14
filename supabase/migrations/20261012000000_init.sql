-- VIBE initial schema
-- Location verification, rating rules and privacy are enforced here, in the
-- database, so no client can skip them. Coordinates are plain lat/lng with
-- haversine math (no PostGIS needed); swap to PostGIS when you outgrow it.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text not null unique check (username ~ '^[a-z0-9._]{3,20}$'),
  bio         text check (char_length(bio) <= 160),
  home_city   text not null default 'Dallas, TX',
  avatar_url  text,
  created_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'vibe_' || substr(replace(new.id::text, '-', ''), 1, 8))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- geo helpers
-- Great-circle distance in meters.
create or replace function public.vibe_distance_m(lat1 float8, lng1 float8, lat2 float8, lng2 float8)
returns float8 language sql immutable parallel safe as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ))
$$;

-- Point-in-polygon (ray casting). fence = [[lat,lng],[lat,lng],...]
create or replace function public.vibe_in_fence(p_lat float8, p_lng float8, fence jsonb)
returns boolean language plpgsql immutable as $$
declare
  n int := jsonb_array_length(fence);
  i int; j int; inside boolean := false;
  yi float8; xi float8; yj float8; xj float8;
begin
  if n < 3 then return false; end if;
  j := n - 1;
  for i in 0 .. n - 1 loop
    yi := (fence -> i ->> 0)::float8; xi := (fence -> i ->> 1)::float8;
    yj := (fence -> j ->> 0)::float8; xj := (fence -> j ->> 1)::float8;
    if ((yi > p_lat) <> (yj > p_lat)) and
       (p_lng < (xj - xi) * (p_lat - yi) / nullif(yj - yi, 0) + xi) then
      inside := not inside;
    end if;
    j := i;
  end loop;
  return inside;
end $$;

-- ---------------------------------------------------------------- venues & events
create table public.venues (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null check (category in ('Clubs','Bars','Restaurants','Parties','Concerts','Events','Sports')),
  area        text,
  address     text,
  lat         float8 not null check (lat between -90 and 90),
  lng         float8 not null check (lng between -180 and 180),
  radius_m    int not null default 75 check (radius_m between 20 and 2000),
  fence       jsonb,
  open_time   time,            -- local (America/Chicago) nightly hours, used for demo events
  hours       numeric(4,1),
  cover_charge text,
  age_rule    text,
  website     text,
  owner_id    uuid references public.profiles (id) on delete set null,
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now()
);

create table public.events (
  id           uuid primary key default gen_random_uuid(),
  venue_id     uuid references public.venues (id) on delete set null,
  name         text not null check (char_length(name) between 2 and 60),
  category     text not null check (category in ('Clubs','Bars','Restaurants','Parties','Concerts','Events','Sports')),
  description  text check (char_length(description) <= 500),
  area         text,
  address      text,
  lat          float8 not null check (lat between -90 and 90),
  lng          float8 not null check (lng between -180 and 180),
  radius_m     int not null default 75 check (radius_m between 20 and 2000),
  fence        jsonb,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  visibility   text not null default 'public' check (visibility in ('public','unlisted')),
  cover_charge text,
  age_rule     text,
  ticket_url   text,
  save_count   int not null default 0,
  created_by   uuid references public.profiles (id) on delete set null,
  is_demo      boolean not null default false,
  created_at   timestamptz not null default now(),
  check (ends_at > starts_at and ends_at - starts_at <= interval '48 hours')
);
create index events_time_idx on public.events (ends_at, starts_at);
create index events_geo_idx on public.events (lat, lng);
create index events_venue_idx on public.events (venue_id, starts_at);

-- Duplicate + spam guard for user-created events.
create or replace function public.events_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is null then return new; end if;
  if (select count(*) from events where created_by = new.created_by and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'VIBE:EVENT_LIMIT';
  end if;
  if exists (
    select 1 from events e
    where lower(e.name) = lower(new.name)
      and e.starts_at < new.ends_at and e.ends_at > new.starts_at
      and vibe_distance_m(e.lat, e.lng, new.lat, new.lng) < 150
  ) then
    raise exception 'VIBE:DUPLICATE_EVENT';
  end if;
  return new;
end $$;
create trigger events_guard before insert on public.events
  for each row execute function public.events_guard();

-- ---------------------------------------------------------------- contributions
create type public.vibe_level as enum ('popping','mid','dead');

-- One active rating per person per event. Never readable by other users.
create table public.ratings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  event_id    uuid not null references public.events (id) on delete cascade,
  vibe        public.vibe_level not null,
  worth       boolean not null,
  verified_at timestamptz not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, event_id)
);
create index ratings_event_idx on public.ratings (event_id, updated_at desc);

create table public.comments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  event_id      uuid not null references public.events (id) on delete cascade,
  body          text not null check (char_length(body) between 1 and 140),
  helpful_count int not null default 0,
  hidden        boolean not null default false,
  created_at    timestamptz not null default now()
);
create index comments_event_idx on public.comments (event_id, created_at desc);

create table public.posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  event_id    uuid not null references public.events (id) on delete cascade,
  kind        text not null check (kind in ('photo','video')),
  media_path  text not null,
  thumb_path  text,
  caption     text check (char_length(caption) <= 140),
  width       int,
  height      int,
  duration_s  numeric(4,1) check (duration_s is null or duration_s <= 10.5),
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index posts_event_idx on public.posts (event_id, created_at desc);

create table public.helpful_votes (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  comment_id uuid not null references public.comments (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, comment_id)
);

create table public.saves (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  event_id   uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  primary key (blocker_id, blocked_id)
);

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('comment','post','event','user')),
  target_id   uuid not null,
  reason      text not null check (reason in ('harassment','threat','nudity','spam','inaccurate','other')),
  created_at  timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

-- Live "something changed" signal per event. Public, contains no user data,
-- so realtime subscribers learn about new ratings without seeing who rated.
create table public.event_activity (
  event_id        uuid primary key references public.events (id) on delete cascade,
  last_rating_at  timestamptz,
  last_comment_at timestamptz,
  last_post_at    timestamptz,
  version         bigint not null default 0
);

-- ---------------------------------------------------------------- private bookkeeping (no client access)
create table public.contribution_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  event_id   uuid not null references public.events (id) on delete cascade,
  expires_at timestamptz not null,
  uses_left  int not null default 3
);
create index contribution_tokens_user_idx on public.contribution_tokens (user_id, event_id, expires_at);

-- Only the latest check per user (overwritten), used for impossible-travel
-- detection and rate limiting. Not a location history.
create table public.presence_state (
  user_id       uuid primary key references public.profiles (id) on delete cascade,
  lat           float8 not null,
  lng           float8 not null,
  checked_at    timestamptz not null,
  window_start  timestamptz not null,
  window_count  int not null
);

-- ---------------------------------------------------------------- triggers
create or replace function public.bump_activity()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into event_activity (event_id, last_rating_at, last_comment_at, last_post_at, version)
  values (
    new.event_id,
    case when tg_table_name = 'ratings'  then now() end,
    case when tg_table_name = 'comments' then now() end,
    case when tg_table_name = 'posts'    then now() end,
    1)
  on conflict (event_id) do update set
    last_rating_at  = case when tg_table_name = 'ratings'  then now() else event_activity.last_rating_at end,
    last_comment_at = case when tg_table_name = 'comments' then now() else event_activity.last_comment_at end,
    last_post_at    = case when tg_table_name = 'posts'    then now() else event_activity.last_post_at end,
    version         = event_activity.version + 1;
  return new;
end $$;
create trigger ratings_activity  after insert or update on public.ratings  for each row execute function public.bump_activity();
create trigger comments_activity after insert on public.comments for each row execute function public.bump_activity();
create trigger posts_activity    after insert on public.posts    for each row execute function public.bump_activity();

create or replace function public.helpful_count_sync()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update comments set helpful_count = helpful_count + 1 where id = new.comment_id;
  else
    update comments set helpful_count = greatest(0, helpful_count - 1) where id = old.comment_id;
  end if;
  return null;
end $$;
create trigger helpful_sync after insert or delete on public.helpful_votes
  for each row execute function public.helpful_count_sync();

create or replace function public.save_count_sync()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update events set save_count = save_count + 1 where id = new.event_id;
  else
    update events set save_count = greatest(0, save_count - 1) where id = old.event_id;
  end if;
  return null;
end $$;
create trigger save_sync after insert or delete on public.saves
  for each row execute function public.save_count_sync();

-- Three independent reports hide a comment or post until a moderator reviews it.
-- Organizers get no extra power here, so they can't bury honest bad ratings.
create or replace function public.report_autohide()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from reports where target_type = new.target_type and target_id = new.target_id) >= 3 then
    if new.target_type = 'comment' then update comments set hidden = true where id = new.target_id; end if;
    if new.target_type = 'post'    then update posts    set hidden = true where id = new.target_id; end if;
  end if;
  return null;
end $$;
create trigger report_autohide after insert on public.reports
  for each row execute function public.report_autohide();

-- ---------------------------------------------------------------- row level security
alter table public.profiles            enable row level security;
alter table public.venues              enable row level security;
alter table public.events              enable row level security;
alter table public.ratings             enable row level security;
alter table public.comments            enable row level security;
alter table public.posts               enable row level security;
alter table public.helpful_votes       enable row level security;
alter table public.saves               enable row level security;
alter table public.follows             enable row level security;
alter table public.blocks              enable row level security;
alter table public.reports             enable row level security;
alter table public.event_activity      enable row level security;
alter table public.contribution_tokens enable row level security;
alter table public.presence_state      enable row level security;

create policy "profiles are public"      on public.profiles for select using (true);
create policy "edit own profile"         on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "venues are public"        on public.venues for select using (true);

create policy "public events or mine"    on public.events for select using (visibility = 'public' or created_by = auth.uid());
create policy "create own events"        on public.events for insert to authenticated
  with check (created_by = auth.uid() and is_demo = false and venue_id is null);
create policy "edit own events"          on public.events for update using (created_by = auth.uid()) with check (created_by = auth.uid() and is_demo = false);
create policy "delete own events"        on public.events for delete using (created_by = auth.uid());

create policy "see only my ratings"      on public.ratings for select using (user_id = auth.uid());
-- no insert/update policies: ratings only arrive through submit_rating()

create policy "visible comments"         on public.comments for select using (not hidden or user_id = auth.uid());
create policy "delete own comments"      on public.comments for delete using (user_id = auth.uid());

create policy "visible posts"            on public.posts for select using (not hidden or user_id = auth.uid());
create policy "delete own posts"         on public.posts for delete using (user_id = auth.uid());

create policy "my helpful votes"         on public.helpful_votes for select using (user_id = auth.uid());
create policy "vote helpful, not own"    on public.helpful_votes for insert to authenticated
  with check (user_id = auth.uid() and not exists (select 1 from public.comments c where c.id = comment_id and c.user_id = auth.uid()));
create policy "unvote helpful"           on public.helpful_votes for delete using (user_id = auth.uid());

create policy "my saves"                 on public.saves for select using (user_id = auth.uid());
create policy "save"                     on public.saves for insert to authenticated with check (user_id = auth.uid());
create policy "unsave"                   on public.saves for delete using (user_id = auth.uid());

create policy "follows are public"       on public.follows for select using (true);
create policy "follow"                   on public.follows for insert to authenticated with check (follower_id = auth.uid());
create policy "unfollow"                 on public.follows for delete using (follower_id = auth.uid());

create policy "my blocks"                on public.blocks for select using (blocker_id = auth.uid());
create policy "block"                    on public.blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "unblock"                  on public.blocks for delete using (blocker_id = auth.uid());

create policy "report"                   on public.reports for insert to authenticated with check (reporter_id = auth.uid());

create policy "activity is public"       on public.event_activity for select using (true);
-- contribution_tokens, presence_state: no policies = no client access

-- ---------------------------------------------------------------- RPC: verification
-- Every contribution starts here: fresh GPS fix in, short-lived token out.
create or replace function public.verify_presence(p_event uuid, p_lat float8, p_lng float8, p_accuracy float8)
returns json language plpgsql security definer set search_path = public as $$
declare
  uid   uuid := auth.uid();
  ev    events%rowtype;
  st    presence_state%rowtype;
  dist  float8;
  moved float8;
  secs  float8;
  inside boolean;
  tok   contribution_tokens%rowtype;
begin
  if uid is null then raise exception 'VIBE:AUTH_REQUIRED'; end if;
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180
     or p_accuracy is null or p_accuracy <= 0 then
    raise exception 'VIBE:BAD_LOCATION';
  end if;

  -- rate limit: 12 checks per rolling minute window
  select * into st from presence_state where user_id = uid for update;
  if st.user_id is not null and st.window_start > now() - interval '1 minute' and st.window_count >= 12 then
    raise exception 'VIBE:RATE_LIMIT';
  end if;

  select * into ev from events where id = p_event;
  if not found then raise exception 'VIBE:NOT_FOUND'; end if;
  if now() < ev.starts_at then raise exception 'VIBE:NOT_STARTED'; end if;
  if now() > ev.ends_at   then raise exception 'VIBE:ENDED'; end if;

  -- impossible travel: >2 km at faster than ~250 km/h since the last check
  if st.user_id is not null and st.checked_at > now() - interval '6 hours' then
    moved := vibe_distance_m(st.lat, st.lng, p_lat, p_lng);
    secs  := greatest(extract(epoch from now() - st.checked_at), 1);
    if moved > 2000 and moved / secs > 70 then
      raise exception 'VIBE:IMPOSSIBLE_TRAVEL';
    end if;
  end if;

  insert into presence_state (user_id, lat, lng, checked_at, window_start, window_count)
  values (uid, p_lat, p_lng, now(), now(), 1)
  on conflict (user_id) do update set
    lat = excluded.lat, lng = excluded.lng, checked_at = now(),
    window_start = case when presence_state.window_start > now() - interval '1 minute' then presence_state.window_start else now() end,
    window_count = case when presence_state.window_start > now() - interval '1 minute' then presence_state.window_count + 1 else 1 end;

  if p_accuracy > 150 then raise exception 'VIBE:LOW_ACCURACY:%', round(p_accuracy); end if;

  dist := vibe_distance_m(ev.lat, ev.lng, p_lat, p_lng);
  if ev.fence is not null then
    inside := vibe_in_fence(p_lat, p_lng, ev.fence) or dist <= least(p_accuracy, 50);
  else
    inside := dist <= ev.radius_m + least(p_accuracy, 50);
  end if;
  if not inside then raise exception 'VIBE:OUTSIDE:%', round(dist); end if;

  delete from contribution_tokens where user_id = uid and expires_at < now();
  insert into contribution_tokens (user_id, event_id, expires_at, uses_left)
  values (uid, p_event, now() + interval '3 minutes', 3)
  returning * into tok;

  return json_build_object('token', tok.id, 'expires_at', tok.expires_at);
end $$;

-- Internal: spend one use of a token, return its event.
create or replace function public.vibe_spend_token(p_token uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  tok contribution_tokens%rowtype;
  ev_end timestamptz;
begin
  if uid is null then raise exception 'VIBE:AUTH_REQUIRED'; end if;
  select * into tok from contribution_tokens
   where id = p_token and user_id = uid and expires_at > now() and uses_left > 0
   for update;
  if not found then raise exception 'VIBE:TOKEN_INVALID'; end if;
  select ends_at into ev_end from events where id = tok.event_id;
  if ev_end < now() then raise exception 'VIBE:ENDED'; end if;
  update contribution_tokens set uses_left = uses_left - 1 where id = tok.id;
  return tok.event_id;
end $$;
revoke all on function public.vibe_spend_token(uuid) from public, anon, authenticated;

create or replace function public.vibe_insert_comment(uid uuid, ev uuid, p_body text, p_strict boolean default true)
returns uuid language plpgsql security definer set search_path = public as $$
declare cid uuid; body text := btrim(regexp_replace(coalesce(p_body,''), '\s+', ' ', 'g'));
begin
  if body = '' then return null; end if;
  if char_length(body) > 140 then raise exception 'VIBE:TOO_LONG'; end if;
  if exists (select 1 from comments where user_id = uid and event_id = ev and created_at > now() - interval '60 seconds') then
    if not p_strict then return null; end if;
    raise exception 'VIBE:SLOW_DOWN';
  end if;
  insert into comments (user_id, event_id, body) values (uid, ev, body) returning id into cid;
  return cid;
end $$;
revoke all on function public.vibe_insert_comment(uuid, uuid, text, boolean) from public, anon, authenticated;

-- ---------------------------------------------------------------- RPC: contributions
create or replace function public.submit_rating(p_token uuid, p_vibe public.vibe_level, p_worth boolean, p_comment text default null)
returns json language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  ev  uuid := vibe_spend_token(p_token);
  replaced boolean;
  cid uuid;
begin
  replaced := exists (select 1 from ratings where user_id = uid and event_id = ev);
  insert into ratings (user_id, event_id, vibe, worth, verified_at)
  values (uid, ev, p_vibe, p_worth, now())
  on conflict (user_id, event_id) do update
    set vibe = excluded.vibe, worth = excluded.worth, verified_at = now(), updated_at = now();
  cid := vibe_insert_comment(uid, ev, p_comment, false);
  return json_build_object('event_id', ev, 'replaced', replaced,
    'comment_saved', cid is not null or nullif(btrim(coalesce(p_comment, '')), '') is null);
end $$;

create or replace function public.submit_comment(p_token uuid, p_body text)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); ev uuid := vibe_spend_token(p_token); cid uuid;
begin
  cid := vibe_insert_comment(uid, ev, p_body);
  if cid is null then raise exception 'VIBE:EMPTY'; end if;
  return json_build_object('id', cid, 'event_id', ev);
end $$;

-- The file must already be uploaded (storage policy only accepts uploads
-- while a valid token exists for that event).
create or replace function public.create_post(
  p_token uuid, p_kind text, p_path text, p_thumb text default null, p_caption text default null,
  p_width int default null, p_height int default null, p_duration float8 default null)
returns json language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  ev  uuid := vibe_spend_token(p_token);
  prefix text;
  pid uuid;
  cap text := nullif(btrim(coalesce(p_caption, '')), '');
begin
  prefix := uid::text || '/' || ev::text || '/';
  if p_kind not in ('photo','video') then raise exception 'VIBE:BAD_MEDIA'; end if;
  if left(p_path, length(prefix)) <> prefix or (p_thumb is not null and left(p_thumb, length(prefix)) <> prefix) then
    raise exception 'VIBE:BAD_MEDIA';
  end if;
  if not exists (select 1 from storage.objects where bucket_id = 'media' and name = p_path) then
    raise exception 'VIBE:UPLOAD_MISSING';
  end if;
  if p_kind = 'video' and (p_duration is null or p_duration > 10.5) then raise exception 'VIBE:TOO_LONG'; end if;
  if (select count(*) from posts where user_id = uid and created_at > now() - interval '10 minutes') >= 6 then
    raise exception 'VIBE:SLOW_DOWN';
  end if;
  insert into posts (user_id, event_id, kind, media_path, thumb_path, caption, width, height, duration_s)
  values (uid, ev, p_kind, p_path, p_thumb, left(cap, 140), p_width, p_height, round(p_duration::numeric, 1))
  returning id into pid;
  return json_build_object('id', pid, 'event_id', ev);
end $$;

-- ---------------------------------------------------------------- RPC: reads
-- Anonymous rating rows for scoring. No user ids leave the database.
create or replace function public.event_rating_rows(p_events uuid[])
returns table (event_id uuid, vibe public.vibe_level, worth boolean, at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.event_id, r.vibe, r.worth, r.updated_at
  from ratings r
  where r.event_id = any (p_events[1:300])
$$;

-- Single event for the detail page. Unlisted events open by link, but the
-- exact address and pin stay hidden from everyone except the creator.
create or replace function public.get_event(p_id uuid)
returns json language sql stable security definer set search_path = public as $$
  select case
    when e.visibility = 'public' or e.created_by = auth.uid() then to_json(e)
    else (to_jsonb(e) - 'address' || jsonb_build_object('lat', null, 'lng', null, 'fence', null))::json
  end
  from events e where e.id = p_id
$$;

-- ---------------------------------------------------------------- demo events
-- Creates tonight's events for demo venues. Called by seed and a daily Vercel cron.
create or replace function public.ensure_demo_events(p_day date default (now() at time zone 'America/Chicago')::date)
returns int language plpgsql security definer set search_path = public as $$
declare v venues%rowtype; s timestamptz; made int := 0;
begin
  for v in select * from venues where is_demo and open_time is not null loop
    s := (p_day + v.open_time) at time zone 'America/Chicago';
    if not exists (select 1 from events where venue_id = v.id and starts_at = s) then
      insert into events (venue_id, name, category, area, address, lat, lng, radius_m, fence,
                          starts_at, ends_at, cover_charge, age_rule, is_demo)
      values (v.id, v.name, v.category, v.area, v.address, v.lat, v.lng, v.radius_m, v.fence,
              s, s + make_interval(mins => (v.hours * 60)::int), v.cover_charge, v.age_rule, true);
      made := made + 1;
    end if;
  end loop;
  return made;
end $$;
revoke all on function public.ensure_demo_events(date) from public, anon, authenticated;
grant execute on function public.ensure_demo_events(date) to service_role;

grant execute on function public.verify_presence(uuid, float8, float8, float8) to authenticated;
grant execute on function public.submit_rating(uuid, public.vibe_level, boolean, text) to authenticated;
grant execute on function public.submit_comment(uuid, text) to authenticated;
grant execute on function public.create_post(uuid, text, text, text, text, int, int, float8) to authenticated;
grant execute on function public.event_rating_rows(uuid[]) to anon, authenticated;
grant execute on function public.get_event(uuid) to anon, authenticated;

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800,
        array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime','video/webm'])
on conflict (id) do nothing;

-- Path: <user id>/<event id>/<file>. Upload only while holding a live token for that event.
create or replace function public.vibe_can_upload(p_event text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from contribution_tokens t
    where t.user_id = auth.uid() and t.event_id::text = p_event and t.expires_at > now()
  )
$$;
grant execute on function public.vibe_can_upload(text) to authenticated;

create policy "upload with live token" on storage.objects for insert to authenticated
with check (
  bucket_id = 'media'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.vibe_can_upload((storage.foldername(name))[2])
);
create policy "media is public" on storage.objects for select using (bucket_id = 'media');
create policy "delete own media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------- realtime
alter publication supabase_realtime add table public.event_activity, public.comments, public.posts;
