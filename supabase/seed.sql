-- Demo venues for the Dallas launch market. Marked is_demo = true so they are
-- easy to find and remove. No fake ratings, comments or posts: every number
-- the app shows comes from real people.
insert into public.venues (name, category, area, address, lat, lng, radius_m, fence, open_time, hours, cover_charge, age_rule, is_demo) values
  ('Katy Trail Ice House',        'Bars',        'Uptown',           '3127 Routh St',               32.8063, -96.8081,  90, null, '11:00', 13,   'Free',                 'All ages until 9 PM', true),
  ('Henderson Ave Nightlife',     'Bars',        'Knox-Henderson',   'N Henderson Ave & McMillan',  32.8215, -96.7892, 160, null, '17:00',  9,   'Varies by bar',        '21+',                 true),
  ('Deep Ellum Main Street',      'Parties',     'Deep Ellum',       'Elm St & Malcolm X Blvd',     32.7840, -96.7810, 60,
      '[[32.7855,-96.7860],[32.7862,-96.7765],[32.7825,-96.7760],[32.7818,-96.7856]]'::jsonb,
                                                                                                    '18:00',  8,   'Varies',               '21+ at most spots',   true),
  ('Lower Greenville Strip',      'Bars',        'Lower Greenville', 'Greenville Ave & Bell Ave',   32.8138, -96.7697, 220, null, '17:00',  9,   'Mostly free',          '21+ after 10 PM',     true),
  ('Bishop Arts District',        'Events',      'Bishop Arts',      'N Bishop Ave & W Davis St',   32.7486, -96.8285, 170, null, '16:00',  7,   'Free',                 'All ages',            true),
  ('Trinity Groves',              'Restaurants', 'West Dallas',      '3011 Gulden Ln',              32.7786, -96.8360, 140, null, '17:00',  6,   'No cover',             'All ages',            true),
  ('Victory Park Plaza',          'Sports',      'Victory Park',     '2500 Victory Ave',            32.7905, -96.8101, 180, null, '18:00',  5,   'Free',                 'All ages',            true),
  ('Klyde Warren Park',           'Events',      'Downtown',         '2012 Woodall Rodgers Fwy',    32.7894, -96.8016, 60,
      '[[32.7903,-96.8045],[32.7908,-96.7990],[32.7886,-96.7988],[32.7882,-96.8043]]'::jsonb,
                                                                                                    '10:00', 12,   'Free',                 'All ages',            true),
  ('Design District Galleries',   'Events',      'Design District',  '1525 Turtle Creek Blvd',      32.7967, -96.8243, 200, null, '18:00',  4,   'Free',                 'All ages',            true),
  ('Uptown McKinney Ave',         'Clubs',       'Uptown',           'McKinney Ave & Lemmon Ave',   32.8079, -96.7993, 180, null, '21:00',  5,   'Varies by club',       '21+',                 true);

select public.ensure_demo_events();
select public.ensure_demo_events(((now() at time zone 'America/Chicago')::date + 1));

-- Create each night's events automatically, inside the database (no Vercel cron
-- or secrets needed). 15:00 UTC = 10 AM Central. Skipped quietly if pg_cron
-- isn't available on your plan.
do $$
begin
  execute 'create extension if not exists pg_cron';
  perform cron.schedule(
    'vibes-demo-events',
    '0 15 * * *',
    $job$select public.ensure_demo_events(); select public.ensure_demo_events(((now() at time zone 'America/Chicago')::date + 1));$job$
  );
exception when others then
  raise notice 'pg_cron not available (%). Run ensure_demo_events() daily some other way.', sqlerrm;
end $$;
