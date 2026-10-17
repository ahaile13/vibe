-- Test data for all 20 cities: launch spots in each city (in that city's time zone),
-- nightly events for them, and sample ratings (tied to no account) so scores show.
-- Everything here is marked demo and can be removed (see the bottom of this file).
-- Safe to run more than once.

-- ---------------------------------------------------------------- per-city time zones
alter table public.venues add column if not exists tz text not null default 'America/Chicago';

-- Creates today's and tomorrow's event for every demo venue, in the venue's own time zone.
-- Pass a date to create just that day.
create or replace function public.ensure_demo_events(p_day date default null)
returns int language plpgsql security definer set search_path = public as $$
declare v venues%rowtype; d date; s timestamptz; made int := 0; k int;
begin
  for v in select * from venues where is_demo and open_time is not null loop
    for k in 0 .. (case when p_day is null then 1 else 0 end) loop
      d := coalesce(p_day, (now() at time zone v.tz)::date + k);
      s := (d + v.open_time) at time zone v.tz;
      if not exists (select 1 from events where venue_id = v.id and starts_at = s) then
        insert into events (venue_id, name, category, area, address, lat, lng, radius_m, fence,
                            starts_at, ends_at, cover_charge, age_rule, is_demo)
        values (v.id, v.name, v.category, v.area, v.address, v.lat, v.lng, v.radius_m, v.fence,
                s, s + make_interval(mins => (v.hours * 60)::int), v.cover_charge, v.age_rule, true);
        made := made + 1;
      end if;
    end loop;
  end loop;
  return made;
end $$;
revoke all on function public.ensure_demo_events(date) from public, anon, authenticated;
grant execute on function public.ensure_demo_events(date) to service_role;

-- ---------------------------------------------------------------- launch spots, 19 more cities
-- Dallas already has its 10 from seed.sql. Neighborhoods and districts, with a daytime spot in
-- most cities so something is live at any hour.
insert into public.venues (name, category, area, address, lat, lng, radius_m, open_time, hours, cover_charge, age_rule, tz, is_demo)
select * from (values
  -- New York
  ('Bryant Park',                 'Events',      'Midtown',          '6th Ave & W 42nd St',               40.7536, -73.9832, 160, time '09:00', 12.0, 'Free',      'All ages', 'America/New_York', true),
  ('Lower East Side Bars',        'Bars',        'Lower East Side',  'Ludlow St & Rivington St',          40.7205, -73.9884, 200, time '17:00',  9.0, 'Mostly free','21+',     'America/New_York', true),
  ('Meatpacking District',        'Clubs',       'Meatpacking',      'Gansevoort St & Washington St',     40.7397, -74.0080, 220, time '21:00',  6.0, 'Varies',    '21+',      'America/New_York', true),
  ('Williamsburg Bedford Ave',    'Bars',        'Williamsburg',     'Bedford Ave & N 7th St',            40.7176, -73.9575, 220, time '16:00', 10.0, 'Free',      '21+',      'America/New_York', true),
  ('Garden District Game Night',  'Sports',      'Midtown',          '7th Ave & W 33rd St',               40.7505, -73.9934, 160, time '18:00',  5.0, 'Free',      'All ages', 'America/New_York', true),
  -- Los Angeles
  ('Santa Monica Pier',           'Events',      'Santa Monica',     'Colorado Ave & Ocean Ave',          34.0094, -118.4973, 220, time '10:00', 12.0, 'Free',     'All ages', 'America/Los_Angeles', true),
  ('Sunset Strip',                'Clubs',       'West Hollywood',   'Sunset Blvd & N Clark St',          34.0901, -118.3870, 260, time '21:00',  5.0, 'Varies',   '21+',      'America/Los_Angeles', true),
  ('Arts District Bars',          'Bars',        'Arts District',    'E 3rd St & S Hewitt St',            34.0459, -118.2350, 220, time '17:00',  9.0, 'Free',     '21+',      'America/Los_Angeles', true),
  ('Broadway Historic Core Eats', 'Restaurants', 'Downtown',         'S Broadway & W 3rd St',             34.0508, -118.2489, 160, time '11:00',  9.0, 'No cover', 'All ages', 'America/Los_Angeles', true),
  ('South Park Game Night',       'Sports',      'Downtown',         'W Olympic Blvd & S Figueroa St',    34.0446, -118.2654, 200, time '18:00',  5.0, 'Free',     'All ages', 'America/Los_Angeles', true),
  -- Chicago
  ('Navy Pier',                   'Events',      'Streeterville',    'E Grand Ave & N Streeter Dr',       41.8917, -87.6086, 260, time '10:00', 12.0, 'Free',      'All ages', 'America/Chicago', true),
  ('River North Nightlife',       'Clubs',       'River North',      'W Hubbard St & N Clark St',         41.8899, -87.6313, 220, time '21:00',  5.0, 'Varies',    '21+',      'America/Chicago', true),
  ('Wicker Park Bars',            'Bars',        'Wicker Park',      'N Milwaukee Ave & W North Ave',     41.9104, -87.6776, 220, time '17:00',  9.0, 'Free',      '21+',      'America/Chicago', true),
  ('Randolph Restaurant Row',     'Restaurants', 'West Loop',        'W Randolph St & N Peoria St',       41.8843, -87.6496, 220, time '17:00',  6.0, 'No cover',  'All ages', 'America/Chicago', true),
  ('Wrigleyville',                'Sports',      'Lakeview',         'N Clark St & W Addison St',         41.9484, -87.6553, 240, time '15:00',  8.0, 'Free',      '21+',      'America/Chicago', true),
  -- Houston
  ('Discovery Green',             'Events',      'Downtown',         'McKinney St & La Branch St',        29.7535, -95.3597, 200, time '10:00', 11.0, 'Free',      'All ages', 'America/Chicago', true),
  ('Washington Avenue',           'Bars',        'Washington Ave',   'Washington Ave & Shepherd Dr',      29.7704, -95.4093, 260, time '17:00',  9.0, 'Varies',    '21+',      'America/Chicago', true),
  ('Midtown Houston',             'Clubs',       'Midtown',          'Main St & Gray St',                 29.7445, -95.3780, 220, time '21:00',  5.0, 'Varies',    '21+',      'America/Chicago', true),
  ('Montrose Eats',               'Restaurants', 'Montrose',         'Westheimer Rd & Montrose Blvd',     29.7432, -95.3911, 220, time '17:00',  6.0, 'No cover',  'All ages', 'America/Chicago', true),
  ('EaDo Game Night',             'Sports',      'EaDo',             'Texas Ave & Hutchins St',           29.7522, -95.3517, 220, time '18:00',  5.0, 'Free',      'All ages', 'America/Chicago', true),
  -- Phoenix
  ('Roosevelt Row',               'Events',      'Downtown',         'N 5th St & E Roosevelt St',         33.4588, -112.0659, 220, time '16:00',  7.0, 'Free',     'All ages', 'America/Phoenix', true),
  ('Old Town Scottsdale',         'Clubs',       'Scottsdale',       'E Indian Plaza & N Scottsdale Rd',  33.4950, -111.9260, 260, time '21:00',  5.0, 'Varies',   '21+',      'America/Phoenix', true),
  ('Mill Avenue',                 'Bars',        'Tempe',            'S Mill Ave & E 5th St',             33.4255, -111.9400, 220, time '17:00',  9.0, 'Free',     '21+',      'America/Phoenix', true),
  ('Downtown Phoenix Game Night', 'Sports',      'Downtown',         'E Jefferson St & S 1st St',         33.4457, -112.0712, 220, time '18:00',  5.0, 'Free',     'All ages', 'America/Phoenix', true),
  -- Philadelphia
  ('Reading Terminal Market',     'Restaurants', 'Center City',      'N 12th St & Arch St',               39.9533, -75.1590, 120, time '08:00', 10.0, 'No cover',  'All ages', 'America/New_York', true),
  ('Fishtown Bars',               'Bars',        'Fishtown',         'Frankford Ave & E Girard Ave',      39.9690, -75.1340, 220, time '17:00',  9.0, 'Free',      '21+',      'America/New_York', true),
  ('Old City Nightlife',          'Clubs',       'Old City',         'Market St & N 2nd St',              39.9502, -75.1433, 220, time '21:00',  5.0, 'Varies',    '21+',      'America/New_York', true),
  ('Penn''s Landing Waterfront',  'Events',      'Penn''s Landing',  'S Columbus Blvd & Spruce St',       39.9442, -75.1414, 180, time '11:00', 11.0, 'Free',      'All ages', 'America/New_York', true),
  ('South Philly Game Night',     'Sports',      'South Philly',     'S Broad St & Pattison Ave',         39.9012, -75.1720, 300, time '17:00',  6.0, 'Free',      'All ages', 'America/New_York', true),
  -- San Antonio
  ('River Walk',                  'Events',      'Downtown',         'E Commerce St & Losoya St',         29.4233, -98.4880, 260, time '10:00', 13.0, 'Free',      'All ages', 'America/Chicago', true),
  ('The Pearl',                   'Restaurants', 'Pearl',            'Pearl Pkwy & Avenue A',             29.4425, -98.4799, 220, time '11:00', 11.0, 'No cover',  'All ages', 'America/Chicago', true),
  ('St. Mary''s Strip',           'Bars',        'Tobin Hill',       'N St Mary''s St & E Grayson St',    29.4413, -98.4870, 220, time '17:00',  9.0, 'Varies',    '21+',      'America/Chicago', true),
  ('East Side Game Night',        'Sports',      'East Side',        'AT&T Center Pkwy & E Houston St',   29.4270, -98.4375, 220, time '18:00',  5.0, 'Free',      'All ages', 'America/Chicago', true),
  -- San Diego
  ('Gaslamp Quarter',             'Clubs',       'Gaslamp',          '5th Ave & Market St',               32.7114, -117.1600, 260, time '21:00',  5.0, 'Varies',   '21+',      'America/Los_Angeles', true),
  ('Pacific Beach Garnet Ave',    'Bars',        'Pacific Beach',    'Garnet Ave & Mission Blvd',         32.7975, -117.2530, 220, time '15:00', 11.0, 'Free',     '21+',      'America/Los_Angeles', true),
  ('Little Italy',                'Restaurants', 'Little Italy',     'India St & W Date St',              32.7230, -117.1688, 220, time '11:00', 11.0, 'No cover', 'All ages', 'America/Los_Angeles', true),
  ('Balboa Park',                 'Events',      'Balboa Park',      'El Prado & Park Blvd',              32.7314, -117.1500, 300, time '10:00',  8.0, 'Free',     'All ages', 'America/Los_Angeles', true),
  ('East Village Game Night',     'Sports',      'East Village',     'Park Blvd & K St',                  32.7073, -117.1566, 220, time '18:00',  5.0, 'Free',     'All ages', 'America/Los_Angeles', true),
  -- Fort Worth
  ('Sundance Square',             'Events',      'Downtown',         'Main St & 3rd St',                  32.7540, -97.3318, 220, time '11:00', 12.0, 'Free',      'All ages', 'America/Chicago', true),
  ('Stockyards',                  'Bars',        'Stockyards',       'E Exchange Ave & N Main St',        32.7890, -97.3477, 260, time '12:00', 12.0, 'Varies',    '21+ after 9 PM', 'America/Chicago', true),
  ('West 7th',                    'Clubs',       'West 7th',         'W 7th St & Crockett St',            32.7515, -97.3567, 220, time '21:00',  5.0, 'Varies',    '21+',      'America/Chicago', true),
  ('Magnolia Avenue',             'Restaurants', 'Near Southside',   'W Magnolia Ave & 8th Ave',          32.7300, -97.3380, 220, time '17:00',  6.0, 'No cover',  'All ages', 'America/Chicago', true),
  -- Jacksonville
  ('Jax Beach',                   'Bars',        'Jacksonville Beach','1st St N & Beach Blvd',            30.2869, -81.3920, 260, time '15:00', 11.0, 'Free',      '21+',      'America/New_York', true),
  ('Five Points',                 'Bars',        'Riverside',        'Park St & Margaret St',             30.3128, -81.6849, 220, time '17:00',  8.0, 'Free',      '21+',      'America/New_York', true),
  ('Southbank Riverwalk',         'Events',      'Downtown',         'Southbank Riverwalk & Main St',     30.3195, -81.6580, 220, time '10:00', 11.0, 'Free',      'All ages', 'America/New_York', true),
  ('Sports Complex Game Night',   'Sports',      'Sports Complex',   'A Philip Randolph Blvd & E Adams St',30.3239, -81.6373, 260, time '17:00',  6.0, 'Free',     'All ages', 'America/New_York', true),
  -- Austin
  ('Sixth Street',                'Bars',        'Downtown',         'E 6th St & Trinity St',             30.2672, -97.7395, 260, time '18:00',  8.0, 'Varies',    '21+',      'America/Chicago', true),
  ('Rainey Street',               'Bars',        'Rainey',           'Rainey St & Davis St',              30.2589, -97.7386, 200, time '16:00', 10.0, 'Free',      '21+',      'America/Chicago', true),
  ('Red River District',          'Concerts',    'Red River',        'Red River St & E 7th St',           30.2682, -97.7362, 220, time '19:00',  7.0, 'Varies',    '18+',      'America/Chicago', true),
  ('South Congress',              'Restaurants', 'SoCo',             'S Congress Ave & E Monroe St',      30.2496, -97.7497, 260, time '10:00', 12.0, 'No cover',  'All ages', 'America/Chicago', true),
  ('Zilker Park',                 'Events',      'Zilker',           'Barton Springs Rd & Azie Morton Rd',30.2669, -97.7729, 300, time '08:00', 11.0, 'Free',      'All ages', 'America/Chicago', true),
  -- San Jose
  ('SoFA District',               'Bars',        'Downtown',         'S 1st St & E San Carlos St',        37.3318, -121.8863, 220, time '17:00',  9.0, 'Free',     '21+',      'America/Los_Angeles', true),
  ('San Pedro Square',            'Restaurants', 'Downtown',         'N San Pedro St & W St John St',     37.3363, -121.8944, 160, time '11:00', 11.0, 'No cover', 'All ages', 'America/Los_Angeles', true),
  ('Santana Row',                 'Events',      'West San Jose',    'Santana Row & Olsen Dr',            37.3210, -121.9480, 260, time '10:00', 12.0, 'Free',     'All ages', 'America/Los_Angeles', true),
  ('Arena District Game Night',   'Sports',      'Downtown',         'W Santa Clara St & N Autumn St',    37.3328, -121.9012, 220, time '18:00',  5.0, 'Free',     'All ages', 'America/Los_Angeles', true),
  -- Charlotte
  ('NoDa',                        'Bars',        'NoDa',             'N Davidson St & E 36th St',         35.2484, -80.8015, 220, time '17:00',  9.0, 'Free',      '21+',      'America/New_York', true),
  ('South End',                   'Restaurants', 'South End',        'Camden Rd & W Park Ave',            35.2140, -80.8590, 260, time '11:00', 11.0, 'No cover',  'All ages', 'America/New_York', true),
  ('Uptown Nightlife',            'Clubs',       'Uptown',           'E Trade St & S College St',         35.2265, -80.8418, 200, time '21:00',  5.0, 'Varies',    '21+',      'America/New_York', true),
  ('Uptown Game Night',           'Sports',      'Uptown',           'S Mint St & W Stonewall St',        35.2258, -80.8528, 260, time '17:00',  6.0, 'Free',      'All ages', 'America/New_York', true),
  -- Columbus
  ('Short North',                 'Bars',        'Short North',      'N High St & W Buttles Ave',         39.9780, -83.0030, 260, time '17:00',  9.0, 'Free',      '21+',      'America/New_York', true),
  ('German Village',              'Restaurants', 'German Village',   'S 3rd St & E Kossuth St',           39.9483, -82.9955, 220, time '11:00', 11.0, 'No cover',  'All ages', 'America/New_York', true),
  ('Arena District',              'Clubs',       'Arena District',   'N Front St & W Nationwide Blvd',    39.9690, -83.0060, 220, time '21:00',  5.0, 'Varies',    '21+',      'America/New_York', true),
  ('North Market',                'Events',      'Downtown',         'Spruce St & N Park St',             39.9720, -83.0042, 140, time '09:00', 10.0, 'Free',      'All ages', 'America/New_York', true),
  -- Indianapolis
  ('Mass Ave',                    'Bars',        'Mass Ave',         'Massachusetts Ave & E St Clair St', 39.7748, -86.1500, 220, time '17:00',  9.0, 'Free',      '21+',      'America/Indiana/Indianapolis', true),
  ('Fountain Square',             'Clubs',       'Fountain Square',  'Shelby St & Virginia Ave',          39.7520, -86.1400, 220, time '20:00',  6.0, 'Varies',    '21+',      'America/Indiana/Indianapolis', true),
  ('Monument Circle',             'Events',      'Downtown',         'Monument Cir & N Meridian St',      39.7684, -86.1581, 160, time '10:00', 11.0, 'Free',      'All ages', 'America/Indiana/Indianapolis', true),
  ('Georgia Street Game Night',   'Sports',      'Downtown',         'Georgia St & S Pennsylvania St',    39.7638, -86.1570, 220, time '17:00',  6.0, 'Free',      'All ages', 'America/Indiana/Indianapolis', true),
  -- San Francisco
  ('Mission District Bars',       'Bars',        'Mission',          'Valencia St & 16th St',             37.7650, -122.4216, 260, time '17:00',  9.0, 'Free',     '21+',      'America/Los_Angeles', true),
  ('SoMa Nightlife',              'Clubs',       'SoMa',             'Folsom St & 11th St',               37.7713, -122.4130, 220, time '21:00',  5.0, 'Varies',   '21+',      'America/Los_Angeles', true),
  ('Embarcadero Waterfront',      'Restaurants', 'Embarcadero',      'The Embarcadero & Market St',       37.7955, -122.3937, 160, time '09:00', 10.0, 'No cover', 'All ages', 'America/Los_Angeles', true),
  ('Dolores Park',                'Events',      'Mission',          'Dolores St & 19th St',              37.7596, -122.4269, 260, time '10:00',  9.0, 'Free',     'All ages', 'America/Los_Angeles', true),
  ('China Basin Game Night',      'Sports',      'SoMa',             'King St & 3rd St',                  37.7786, -122.3893, 220, time '18:00',  5.0, 'Free',     'All ages', 'America/Los_Angeles', true),
  -- Seattle
  ('Capitol Hill',                'Bars',        'Capitol Hill',     'E Pike St & Broadway',              47.6142, -122.3208, 260, time '17:00',  9.0, 'Free',     '21+',      'America/Los_Angeles', true),
  ('Pike Place Market',           'Restaurants', 'Downtown',         'Pike St & Pike Pl',                 47.6097, -122.3422, 160, time '09:00',  9.0, 'No cover', 'All ages', 'America/Los_Angeles', true),
  ('Belltown Nightlife',          'Clubs',       'Belltown',         '2nd Ave & Blanchard St',            47.6145, -122.3446, 220, time '21:00',  5.0, 'Varies',   '21+',      'America/Los_Angeles', true),
  ('Ballard Ave',                 'Bars',        'Ballard',          'Ballard Ave NW & 22nd Ave NW',      47.6670, -122.3830, 220, time '16:00', 10.0, 'Free',     '21+',      'America/Los_Angeles', true),
  ('Seattle Center',              'Events',      'Seattle Center',   'Harrison St & 5th Ave N',           47.6205, -122.3493, 260, time '10:00', 12.0, 'Free',     'All ages', 'America/Los_Angeles', true),
  -- Denver
  ('LoDo Larimer Square',         'Bars',        'LoDo',             'Larimer St & 15th St',              39.7486, -104.9998, 220, time '17:00',  9.0, 'Free',     '21+',      'America/Denver', true),
  ('RiNo Art District',           'Events',      'RiNo',             'Larimer St & 27th St',              39.7621, -104.9822, 260, time '11:00', 11.0, 'Free',     'All ages', 'America/Denver', true),
  ('Ballpark Game Night',         'Sports',      'LoDo',             'Blake St & 20th St',                39.7559, -104.9942, 220, time '17:00',  6.0, 'Free',     'All ages', 'America/Denver', true),
  ('Union Station Plaza',         'Restaurants', 'Union Station',    'Wynkoop St & 17th St',              39.7530, -105.0002, 180, time '10:00', 12.0, 'No cover', 'All ages', 'America/Denver', true),
  ('Colfax Nightlife',            'Clubs',       'Capitol Hill',     'E Colfax Ave & N Washington St',    39.7400, -104.9790, 220, time '21:00',  5.0, 'Varies',   '21+',      'America/Denver', true),
  -- Nashville
  ('Lower Broadway',              'Bars',        'Downtown',         'Broadway & 4th Ave S',              36.1606, -86.7769, 260, time '11:00', 15.0, 'Free',      '21+ after 6 PM', 'America/Chicago', true),
  ('The Gulch',                   'Restaurants', 'The Gulch',        '12th Ave S & Division St',          36.1515, -86.7843, 220, time '11:00', 11.0, 'No cover',  'All ages', 'America/Chicago', true),
  ('Midtown Nashville',           'Clubs',       'Midtown',          'Division St & 20th Ave S',          36.1500, -86.7990, 220, time '21:00',  5.0, 'Varies',    '21+',      'America/Chicago', true),
  ('East Nashville',              'Bars',        'East Nashville',   'Fatherland St & S 11th St',         36.1730, -86.7510, 220, time '17:00',  9.0, 'Free',      '21+',      'America/Chicago', true),
  ('Music Row Live',              'Concerts',    'Music Row',        '16th Ave S & Demonbreun St',        36.1540, -86.7930, 200, time '19:00',  5.0, 'Varies',    'All ages', 'America/Chicago', true)
) as v(name, category, area, address, lat, lng, radius_m, open_time, hours, cover_charge, age_rule, tz, is_demo)
where not exists (select 1 from public.venues x where x.is_demo and x.name = v.name);

-- ---------------------------------------------------------------- sample ratings
-- Sample ratings belong to no account (user_id is null), so the only accounts in the database are
-- real people. Row security already hides them from everyone; only the anonymous score feed reads them.
alter table public.ratings alter column user_id drop not null;
delete from auth.users where email like 'demo.rater%@vibes.invalid';  -- older test setup used bot accounts

-- Every live demo event gets a personality for the night (popping, mid or dead) that drifts as the
-- night goes on, so scores, worth-it and heating-up/cooling-down all move. Each run tops up events
-- that are short on recent ratings (backdated across the last hour), adds a few fresh ones, and
-- clears sample ratings older than four hours.
create or replace function public.seed_demo_ratings()
returns int language plpgsql security definer set search_path = public as $$
declare
  e record; made int := 0;
  h int; base float8; p float8; prog float8; drift float8;
  tgt int; recent int; k int; i int; span float8; t timestamptz; x float8; lvl vibe_level;
begin
  delete from ratings where user_id is null and updated_at < now() - interval '4 hours';

  for e in select id, starts_at, ends_at from events where is_demo and now() >= starts_at and now() < ends_at loop
    h := abs(('x' || substr(md5(e.id::text), 1, 8))::bit(32)::int);
    base := (h % 1000) / 1000.0;
    p := case when base < 0.45 then 0.62 + base * 0.5      -- popping tonight
              when base < 0.82 then 0.28 + (base - 0.45)   -- mid
              else 0.06 + (base - 0.82) end;               -- dead
    prog := extract(epoch from now() - e.starts_at) / greatest(1, extract(epoch from e.ends_at - e.starts_at));
    drift := case when (h / 1000) % 2 = 0 then 0.22 else -0.18 end;
    p := least(0.95, greatest(0.03, p + drift * (prog - 0.5)));

    tgt := case when base < 0.45 then 16 when base < 0.82 then 10 else 6 end;
    select count(*) into recent from ratings where event_id = e.id and updated_at > now() - interval '60 minutes';
    k := case when recent < tgt then tgt - recent else 1 + floor(random() * 3)::int end;
    span := least(55, greatest(1, extract(epoch from now() - e.starts_at) / 60));

    for i in 1 .. k loop
      t := case when recent < tgt then now() - make_interval(secs => (random() * span * 60)::int) else now() end;
      x := random();
      lvl := case when x < p then 'popping' when x < p + (1 - p) * 0.6 then 'mid' else 'dead' end;
      insert into ratings (user_id, event_id, vibe, worth, verified_at, created_at, updated_at)
      values (null, e.id, lvl, random() < 0.25 + 0.7 * p, t, t, t);
      made := made + 1;
    end loop;
  end loop;
  return made;
end $$;
revoke all on function public.seed_demo_ratings() from public, anon, authenticated;
grant execute on function public.seed_demo_ratings() to service_role;

-- ---------------------------------------------------------------- run now, then on a schedule
select public.ensure_demo_events();
select public.seed_demo_ratings();

do $$
begin
  execute 'create extension if not exists pg_cron';
  begin perform cron.unschedule('vibes-demo-events'); exception when others then null; end;
  begin perform cron.unschedule('vibes-demo-ratings'); exception when others then null; end;
  perform cron.schedule('vibes-demo-events', '7 * * * *', 'select public.ensure_demo_events()');
  perform cron.schedule('vibes-demo-ratings', '*/10 * * * *', 'select public.seed_demo_ratings()');
exception when others then
  raise notice 'pg_cron not available (%). Run ensure_demo_events() and seed_demo_ratings() on a schedule some other way.', sqlerrm;
end $$;

-- ---------------------------------------------------------------- to remove all test data later
-- select cron.unschedule('vibes-demo-ratings');
-- delete from public.ratings where user_id is null;
-- To drop the launch spots too: delete from public.events where is_demo; delete from public.venues where is_demo;
