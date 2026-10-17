-- Top every city up to 10 rated test spots (Dallas already has 10). Mostly daytime and afternoon
-- hours, so more cities show live scores during the day. Safe to run more than once.
insert into public.venues (name, category, area, address, lat, lng, radius_m, open_time, hours, cover_charge, age_rule, tz, is_demo)
select * from (values
  -- New York
  ('Greenwich Village Jazz', 'Concerts', 'Greenwich Village', 'W 3rd St & MacDougal St', 40.7303, -74.0003, 180, time '19:00', 6.0, 'Varies', '21+', 'America/New_York', true),
  ('Chelsea Market', 'Restaurants', 'Chelsea', '9th Ave & W 15th St', 40.7424, -74.006, 140, time '08:00', 12.0, 'No cover', 'All ages', 'America/New_York', true),
  ('East Village Bars', 'Bars', 'East Village', 'St Marks Pl & 2nd Ave', 40.729, -73.9875, 200, time '16:00', 10.0, 'Free', '21+', 'America/New_York', true),
  ('Hudson River Park Pier', 'Events', 'Hudson Square', 'Pier 40 & West St', 40.7295, -74.0115, 220, time '07:00', 12.0, 'Free', 'All ages', 'America/New_York', true),
  ('Bushwick Warehouses', 'Parties', 'Bushwick', 'Morgan Ave & Johnson Ave', 40.7071, -73.933, 260, time '22:00', 6.0, 'Varies', '21+', 'America/New_York', true),
  -- Los Angeles
  ('Venice Boardwalk', 'Events', 'Venice', 'Ocean Front Walk & Windward Ave', 33.985, -118.4695, 260, time '08:00', 11.0, 'Free', 'All ages', 'America/Los_Angeles', true),
  ('Silver Lake Bars', 'Bars', 'Silver Lake', 'Sunset Blvd & Silver Lake Blvd', 34.087, -118.27, 220, time '16:00', 10.0, 'Free', '21+', 'America/Los_Angeles', true),
  ('Koreatown Late Night', 'Restaurants', 'Koreatown', 'Wilshire Blvd & S Western Ave', 34.0617, -118.309, 240, time '18:00', 8.0, 'No cover', 'All ages', 'America/Los_Angeles', true),
  ('Hollywood Boulevard', 'Clubs', 'Hollywood', 'Hollywood Blvd & N Highland Ave', 34.1017, -118.3387, 260, time '21:00', 6.0, 'Varies', '21+', 'America/Los_Angeles', true),
  ('Echo Park Lake', 'Events', 'Echo Park', 'Echo Park Ave & Park Ave', 34.0729, -118.2606, 220, time '09:00', 9.0, 'Free', 'All ages', 'America/Los_Angeles', true),
  -- Chicago
  ('Millennium Park', 'Events', 'The Loop', 'N Michigan Ave & E Washington St', 41.8826, -87.6226, 260, time '08:00', 12.0, 'Free', 'All ages', 'America/Chicago', true),
  ('Logan Square Bars', 'Bars', 'Logan Square', 'N Milwaukee Ave & W Logan Blvd', 41.9289, -87.7075, 220, time '16:00', 10.0, 'Free', '21+', 'America/Chicago', true),
  ('Pilsen Murals Walk', 'Events', 'Pilsen', 'W 18th St & S Blue Island Ave', 41.8577, -87.66, 220, time '11:00', 8.0, 'Free', 'All ages', 'America/Chicago', true),
  ('Uptown Jazz Corridor', 'Concerts', 'Uptown', 'N Broadway & W Lawrence Ave', 41.969, -87.6597, 180, time '19:00', 6.0, 'Varies', '21+', 'America/Chicago', true),
  ('Fulton Market Late Night', 'Clubs', 'West Loop', 'W Fulton Market & N Halsted St', 41.8867, -87.6476, 220, time '22:00', 5.0, 'Varies', '21+', 'America/Chicago', true),
  -- Houston
  ('Buffalo Bayou Park', 'Events', 'Buffalo Bayou', 'Allen Pkwy & Sabine St', 29.762, -95.378, 280, time '07:00', 11.0, 'Free', 'All ages', 'America/Chicago', true),
  ('Rice Village', 'Restaurants', 'Rice Village', 'Kirby Dr & University Blvd', 29.717, -95.417, 240, time '11:00', 10.0, 'No cover', 'All ages', 'America/Chicago', true),
  ('Heights 19th Street', 'Bars', 'The Heights', 'W 19th St & Yale St', 29.803, -95.399, 220, time '15:00', 10.0, 'Free', '21+', 'America/Chicago', true),
  ('Main Street Square Nights', 'Clubs', 'Downtown', 'Main St & Prairie St', 29.7605, -95.3625, 220, time '22:00', 5.0, 'Varies', '21+', 'America/Chicago', true),
  ('Third Ward Live', 'Concerts', 'Third Ward', 'Emancipation Ave & Elgin St', 29.738, -95.366, 200, time '19:00', 5.0, 'Varies', 'All ages', 'America/Chicago', true),
  -- Phoenix
  ('Downtown Phoenix Food Hall', 'Restaurants', 'Downtown', 'N 1st St & E Adams St', 33.449, -112.072, 160, time '10:00', 10.0, 'No cover', 'All ages', 'America/Phoenix', true),
  ('Melrose District', 'Bars', 'Melrose', 'N 7th Ave & W Indian School Rd', 33.495, -112.083, 220, time '15:00', 10.0, 'Free', '21+', 'America/Phoenix', true),
  ('Arcadia Patios', 'Restaurants', 'Arcadia', 'N 40th St & E Campbell Ave', 33.5015, -111.9965, 220, time '08:00', 8.0, 'No cover', 'All ages', 'America/Phoenix', true),
  ('Scottsdale Waterfront', 'Events', 'Scottsdale', 'N Scottsdale Rd & E Camelback Rd', 33.501, -111.926, 240, time '10:00', 10.0, 'Free', 'All ages', 'America/Phoenix', true),
  ('Tempe Town Lake', 'Events', 'Tempe', 'N Mill Ave & W Rio Salado Pkwy', 33.432, -111.94, 280, time '07:00', 12.0, 'Free', 'All ages', 'America/Phoenix', true),
  ('Grand Avenue Arts', 'Concerts', 'Grand Ave', 'W Grand Ave & N 13th Ave', 33.46, -112.088, 200, time '19:00', 5.0, 'Varies', 'All ages', 'America/Phoenix', true),
  -- Philadelphia
  ('Rittenhouse Square', 'Events', 'Rittenhouse', 'Walnut St & S 18th St', 39.9496, -75.1718, 200, time '08:00', 12.0, 'Free', 'All ages', 'America/New_York', true),
  ('East Passyunk Avenue', 'Restaurants', 'East Passyunk', 'E Passyunk Ave & Tasker St', 39.929, -75.164, 220, time '11:00', 11.0, 'No cover', 'All ages', 'America/New_York', true),
  ('Northern Liberties Bars', 'Bars', 'Northern Liberties', 'N 2nd St & Fairmount Ave', 39.964, -75.141, 220, time '16:00', 10.0, 'Free', '21+', 'America/New_York', true),
  ('Avenue of the Arts Live', 'Concerts', 'Avenue of the Arts', 'S Broad St & Locust St', 39.948, -75.165, 180, time '19:00', 5.0, 'Varies', 'All ages', 'America/New_York', true),
  ('Manayunk Main Street', 'Bars', 'Manayunk', 'Main St & Green Ln', 40.025, -75.222, 220, time '15:00', 10.0, 'Free', '21+', 'America/New_York', true),
  -- San Antonio
  ('Southtown Bars', 'Bars', 'Southtown', 'S Alamo St & S St Mary''s St', 29.414, -98.493, 220, time '16:00', 10.0, 'Free', '21+', 'America/Chicago', true),
  ('Market Square', 'Events', 'Downtown', 'W Commerce St & N Santa Rosa Ave', 29.424, -98.499, 200, time '10:00', 10.0, 'Free', 'All ages', 'America/Chicago', true),
  ('Hemisfair', 'Events', 'Hemisfair', 'S Alamo St & E Market St', 29.419, -98.483, 240, time '08:00', 12.0, 'Free', 'All ages', 'America/Chicago', true),
  ('Alamo Heights Patios', 'Restaurants', 'Alamo Heights', 'Broadway & Austin Hwy', 29.484, -98.465, 220, time '11:00', 10.0, 'No cover', 'All ages', 'America/Chicago', true),
  ('Houston Street Late Night', 'Clubs', 'Downtown', 'E Houston St & N Presa St', 29.426, -98.49, 200, time '22:00', 5.0, 'Varies', '21+', 'America/Chicago', true),
  ('Tobin Hill Live', 'Concerts', 'Tobin Hill', 'N St Mary''s St & E Euclid Ave', 29.447, -98.488, 180, time '19:00', 5.0, 'Varies', '18+', 'America/Chicago', true),
  -- San Diego
  ('North Park 30th Street', 'Bars', 'North Park', '30th St & University Ave', 32.748, -117.13, 220, time '15:00', 10.0, 'Free', '21+', 'America/Los_Angeles', true),
  ('Ocean Beach Pier', 'Events', 'Ocean Beach', 'Niagara Ave & Abbott St', 32.748, -117.251, 240, time '07:00', 12.0, 'Free', 'All ages', 'America/Los_Angeles', true),
  ('Liberty Station', 'Restaurants', 'Point Loma', 'Historic Decatur Rd & Truxtun Rd', 32.739, -117.214, 240, time '09:00', 12.0, 'No cover', 'All ages', 'America/Los_Angeles', true),
  ('Hillcrest Nightlife', 'Clubs', 'Hillcrest', 'University Ave & 5th Ave', 32.748, -117.16, 220, time '21:00', 6.0, 'Varies', '21+', 'America/Los_Angeles', true),
  ('La Jolla Cove', 'Events', 'La Jolla', 'Coast Blvd & Girard Ave', 32.85, -117.272, 260, time '08:00', 10.0, 'Free', 'All ages', 'America/Los_Angeles', true),
  -- Fort Worth
  ('Cultural District', 'Events', 'Cultural District', 'W Lancaster Ave & Montgomery St', 32.749, -97.365, 260, time '10:00', 8.0, 'Free', 'All ages', 'America/Chicago', true),
  ('Near Southside Bars', 'Bars', 'Near Southside', 'S Main St & W Magnolia Ave', 32.731, -97.327, 220, time '16:00', 10.0, 'Free', '21+', 'America/Chicago', true),
  ('Clearfork', 'Restaurants', 'Clearfork', 'Edwards Ranch Rd & Monahans Ave', 32.699, -97.395, 240, time '11:00', 10.0, 'No cover', 'All ages', 'America/Chicago', true),
  ('Trinity Park Trails', 'Events', 'Trinity Park', 'University Dr & W 7th St', 32.75, -97.355, 280, time '07:00', 11.0, 'Free', 'All ages', 'America/Chicago', true),
  ('Stockyards Live', 'Concerts', 'Stockyards', 'Rodeo Plaza & E Exchange Ave', 32.7895, -97.3485, 200, time '19:00', 6.0, 'Varies', 'All ages', 'America/Chicago', true),
  ('Sundance Late Night', 'Clubs', 'Downtown', 'Houston St & 4th St', 32.7545, -97.333, 200, time '22:00', 5.0, 'Varies', '21+', 'America/Chicago', true),
  -- Jacksonville
  ('San Marco Square', 'Restaurants', 'San Marco', 'San Marco Blvd & Atlantic Blvd', 30.307, -81.653, 220, time '11:00', 10.0, 'No cover', 'All ages', 'America/New_York', true),
  ('Riverside Arts Market', 'Events', 'Riverside', 'Riverside Ave & Forest St', 30.317, -81.677, 220, time '09:00', 8.0, 'Free', 'All ages', 'America/New_York', true),
  ('Atlantic Beach Town Center', 'Bars', 'Atlantic Beach', 'Atlantic Blvd & Ocean Blvd', 30.326, -81.398, 220, time '15:00', 10.0, 'Free', '21+', 'America/New_York', true),
  ('Bay Street Late Night', 'Clubs', 'Downtown', 'E Bay St & N Laura St', 30.326, -81.657, 200, time '22:00', 5.0, 'Varies', '21+', 'America/New_York', true),
  ('Murray Hill', 'Bars', 'Murray Hill', 'Edgewood Ave S & Post St', 30.307, -81.712, 200, time '16:00', 9.0, 'Free', '21+', 'America/New_York', true),
  ('Jax Beach Pier', 'Events', 'Jacksonville Beach', '6th Ave S & 1st St S', 30.283, -81.387, 240, time '07:00', 12.0, 'Free', 'All ages', 'America/New_York', true),
  -- Austin
  ('East Austin Bars', 'Bars', 'East Austin', 'E 6th St & Chicon St', 30.262, -97.725, 240, time '15:00', 11.0, 'Free', '21+', 'America/Chicago', true),
  ('Lady Bird Lake Trail', 'Events', 'Downtown', 'S Lamar Blvd & W Cesar Chavez St', 30.265, -97.755, 300, time '06:00', 12.0, 'Free', 'All ages', 'America/Chicago', true),
  ('Domain Northside', 'Restaurants', 'The Domain', 'Domain Dr & Rock Rose Ave', 30.402, -97.725, 260, time '11:00', 11.0, 'No cover', 'All ages', 'America/Chicago', true),
  ('Warehouse District', 'Clubs', 'Downtown', 'W 4th St & Colorado St', 30.2665, -97.744, 220, time '22:00', 5.0, 'Varies', '21+', 'America/Chicago', true),
  ('South Lamar Live', 'Concerts', 'South Lamar', 'S Lamar Blvd & Barton Springs Rd', 30.26, -97.76, 200, time '19:00', 5.0, 'Varies', 'All ages', 'America/Chicago', true),
  -- San Jose
  ('Japantown San Jose', 'Restaurants', 'Japantown', 'N 5th St & Jackson St', 37.349, -121.895, 200, time '11:00', 10.0, 'No cover', 'All ages', 'America/Los_Angeles', true),
  ('Willow Glen Lincoln Ave', 'Bars', 'Willow Glen', 'Lincoln Ave & Willow St', 37.309, -121.9, 220, time '15:00', 10.0, 'Free', '21+', 'America/Los_Angeles', true),
  ('Guadalupe River Park', 'Events', 'Downtown', 'W Santa Clara St & N Autumn St', 37.334, -121.899, 280, time '07:00', 12.0, 'Free', 'All ages', 'America/Los_Angeles', true),
  ('Downtown SJ Late Night', 'Clubs', 'Downtown', 'S 2nd St & E San Fernando St', 37.334, -121.887, 200, time '22:00', 5.0, 'Varies', '21+', 'America/Los_Angeles', true),
  ('Plaza de Cesar Chavez', 'Events', 'Downtown', 'S Market St & Park Ave', 37.332, -121.89, 200, time '10:00', 9.0, 'Free', 'All ages', 'America/Los_Angeles', true),
  ('SoFA Live', 'Concerts', 'Downtown', 'S 1st St & E Reed St', 37.329, -121.885, 180, time '19:00', 5.0, 'Varies', 'All ages', 'America/Los_Angeles', true),
  -- Charlotte
  ('Plaza Midwood', 'Bars', 'Plaza Midwood', 'Central Ave & The Plaza', 35.221, -80.811, 220, time '16:00', 10.0, 'Free', '21+', 'America/New_York', true),
  ('Freedom Park', 'Events', 'Dilworth', 'East Blvd & Cumberland Ave', 35.194, -80.844, 280, time '07:00', 12.0, 'Free', 'All ages', 'America/New_York', true),
  ('Optimist Park Eats', 'Restaurants', 'Optimist Park', 'N Brevard St & E 16th St', 35.237, -80.83, 200, time '10:00', 11.0, 'No cover', 'All ages', 'America/New_York', true),
  ('Romare Bearden Park', 'Events', 'Uptown', 'S Church St & W 3rd St', 35.227, -80.849, 220, time '09:00', 10.0, 'Free', 'All ages', 'America/New_York', true),
  ('NoDa Live', 'Concerts', 'NoDa', 'N Davidson St & E 35th St', 35.247, -80.803, 180, time '19:00', 5.0, 'Varies', 'All ages', 'America/New_York', true),
  ('South End Rooftops', 'Clubs', 'South End', 'South Blvd & W Bland St', 35.216, -80.856, 220, time '21:00', 6.0, 'Varies', '21+', 'America/New_York', true),
  -- Columbus
  ('Scioto Mile', 'Events', 'Downtown', 'W Broad St & Civic Center Dr', 39.961, -83.004, 280, time '07:00', 12.0, 'Free', 'All ages', 'America/New_York', true),
  ('Brewery District', 'Bars', 'Brewery District', 'S High St & W Frankfort St', 39.948, -83.0, 220, time '15:00', 10.0, 'Free', '21+', 'America/New_York', true),
  ('Gay Street Patios', 'Restaurants', 'Downtown', 'E Gay St & N High St', 39.964, -83.0, 200, time '11:00', 10.0, 'No cover', 'All ages', 'America/New_York', true),
  ('Short North Live', 'Concerts', 'Short North', 'N High St & E 5th Ave', 39.986, -83.006, 200, time '19:00', 5.0, 'Varies', 'All ages', 'America/New_York', true),
  ('University District Nights', 'Clubs', 'University District', 'N High St & E 15th Ave', 39.998, -83.008, 240, time '21:00', 6.0, 'Varies', '21+', 'America/New_York', true),
  ('Franklin Park', 'Events', 'Franklin Park', 'E Broad St & Franklin Park W', 39.965, -82.955, 240, time '10:00', 7.0, 'Varies', 'All ages', 'America/New_York', true),
  -- Indianapolis
  ('Broad Ripple Village', 'Bars', 'Broad Ripple', 'Broad Ripple Ave & Guilford Ave', 39.868, -86.142, 240, time '15:00', 10.0, 'Free', '21+', 'America/Indiana/Indianapolis', true),
  ('Canal Walk', 'Events', 'Downtown', 'W Ohio St & N West St', 39.771, -86.168, 280, time '07:00', 12.0, 'Free', 'All ages', 'America/Indiana/Indianapolis', true),
  ('Fletcher Place Eats', 'Restaurants', 'Fletcher Place', 'Virginia Ave & S East St', 39.759, -86.148, 200, time '11:00', 10.0, 'No cover', 'All ages', 'America/Indiana/Indianapolis', true),
  ('Mass Ave Live', 'Concerts', 'Mass Ave', 'Massachusetts Ave & N College Ave', 39.776, -86.146, 180, time '19:00', 5.0, 'Varies', 'All ages', 'America/Indiana/Indianapolis', true),
  ('Downtown Indy Late Night', 'Clubs', 'Downtown', 'S Meridian St & W Maryland St', 39.766, -86.158, 200, time '22:00', 5.0, 'Varies', '21+', 'America/Indiana/Indianapolis', true),
  ('City Market', 'Restaurants', 'Downtown', 'E Market St & N Delaware St', 39.769, -86.155, 160, time '08:00', 9.0, 'No cover', 'All ages', 'America/Indiana/Indianapolis', true),
  -- San Francisco
  ('Hayes Valley', 'Restaurants', 'Hayes Valley', 'Hayes St & Octavia Blvd', 37.7765, -122.424, 200, time '11:00', 10.0, 'No cover', 'All ages', 'America/Los_Angeles', true),
  ('North Beach Bars', 'Bars', 'North Beach', 'Columbus Ave & Broadway', 37.798, -122.407, 220, time '16:00', 10.0, 'Free', '21+', 'America/Los_Angeles', true),
  ('Golden Gate Park', 'Events', 'Golden Gate Park', 'JFK Dr & Stanyan St', 37.77, -122.456, 320, time '07:00', 12.0, 'Free', 'All ages', 'America/Los_Angeles', true),
  ('Fillmore Live', 'Concerts', 'Fillmore', 'Fillmore St & Geary Blvd', 37.784, -122.433, 180, time '19:00', 5.0, 'Varies', 'All ages', 'America/Los_Angeles', true),
  ('Castro Nightlife', 'Clubs', 'Castro', 'Castro St & Market St', 37.762, -122.435, 220, time '21:00', 6.0, 'Varies', '21+', 'America/Los_Angeles', true),
  -- Seattle
  ('Fremont', 'Bars', 'Fremont', 'N 35th St & Fremont Ave N', 47.651, -122.35, 220, time '15:00', 10.0, 'Free', '21+', 'America/Los_Angeles', true),
  ('Waterfront Park', 'Events', 'Waterfront', 'Alaskan Way & Union St', 47.607, -122.341, 260, time '07:00', 12.0, 'Free', 'All ages', 'America/Los_Angeles', true),
  ('International District Eats', 'Restaurants', 'Chinatown-ID', 'S King St & 6th Ave S', 47.598, -122.326, 220, time '11:00', 10.0, 'No cover', 'All ages', 'America/Los_Angeles', true),
  ('Capitol Hill Live', 'Concerts', 'Capitol Hill', 'E Pine St & 10th Ave', 47.615, -122.319, 180, time '19:00', 5.0, 'Varies', '21+', 'America/Los_Angeles', true),
  ('Georgetown Nights', 'Clubs', 'Georgetown', 'Airport Way S & S Vale St', 47.548, -122.322, 220, time '21:00', 6.0, 'Varies', '21+', 'America/Los_Angeles', true),
  -- Denver
  ('Highlands 32nd Ave', 'Restaurants', 'Highlands', 'W 32nd Ave & Lowell Blvd', 39.762, -105.034, 220, time '11:00', 10.0, 'No cover', 'All ages', 'America/Denver', true),
  ('South Broadway Bars', 'Bars', 'Baker', 'S Broadway & W Bayaud Ave', 39.715, -104.987, 240, time '15:00', 11.0, 'Free', '21+', 'America/Denver', true),
  ('City Park', 'Events', 'City Park', 'E 17th Ave & York St', 39.747, -104.95, 320, time '07:00', 12.0, 'Free', 'All ages', 'America/Denver', true),
  ('Five Points Live', 'Concerts', 'Five Points', 'Larimer St & 22nd St', 39.754, -104.989, 180, time '19:00', 5.0, 'Varies', 'All ages', 'America/Denver', true),
  ('Cherry Creek North', 'Events', 'Cherry Creek', 'E 2nd Ave & Fillmore St', 39.719, -104.953, 240, time '10:00', 9.0, 'Free', 'All ages', 'America/Denver', true),
  -- Nashville
  ('12 South', 'Restaurants', '12South', '12th Ave S & Linden Ave', 36.125, -86.79, 220, time '08:00', 12.0, 'No cover', 'All ages', 'America/Chicago', true),
  ('Germantown Nashville', 'Bars', 'Germantown', '5th Ave N & Monroe St', 36.179, -86.788, 200, time '15:00', 10.0, 'Free', '21+', 'America/Chicago', true),
  ('Printers Alley', 'Clubs', 'Downtown', 'Printers Alley & Church St', 36.163, -86.779, 160, time '21:00', 6.0, 'Varies', '21+', 'America/Chicago', true),
  ('Centennial Park', 'Events', 'West End', 'West End Ave & 25th Ave N', 36.149, -86.812, 300, time '07:00', 12.0, 'Free', 'All ages', 'America/Chicago', true),
  ('The Nations', 'Events', 'The Nations', '51st Ave N & Centennial Blvd', 36.168, -86.849, 220, time '10:00', 9.0, 'Free', 'All ages', 'America/Chicago', true)
) as v(name, category, area, address, lat, lng, radius_m, open_time, hours, cover_charge, age_rule, tz, is_demo)
where not exists (select 1 from public.venues x where x.is_demo and x.name = v.name);

select public.ensure_demo_events();
select public.seed_demo_ratings();
