-- Location rule: rating, commenting and posting are open to anyone within ONE MILE of the event
-- (was the venue's own small radius or fence). Checked here, on the server, so no app can skip it.
-- The check passes or fails on the spot: there is no "pending until your location matches" state.

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

  -- A one-mile rule tolerates an ordinary phone fix; only reject fixes too vague to place you.
  if p_accuracy > 500 then raise exception 'VIBE:LOW_ACCURACY:%', round(p_accuracy); end if;

  -- The rule: you can rate, comment and post when you are within one mile of the event.
  dist := vibe_distance_m(ev.lat, ev.lng, p_lat, p_lng);
  inside := dist <= 1609.344;
  if not inside then raise exception 'VIBE:OUTSIDE:%', round(dist); end if;

  delete from contribution_tokens where user_id = uid and expires_at < now();
  insert into contribution_tokens (user_id, event_id, expires_at, uses_left)
  values (uid, p_event, now() + interval '3 minutes', 3)
  returning * into tok;

  return json_build_object('token', tok.id, 'expires_at', tok.expires_at);
end $$;

grant execute on function public.verify_presence(uuid, float8, float8, float8) to authenticated;
