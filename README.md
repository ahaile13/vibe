# VIBES

Live, location-verified ratings of what's popping right now. Dallas first.

**Stack:** Next.js 15 (App Router) · Supabase (Postgres, Auth, Realtime, Storage) · MapLibre · Vercel

---

## Go live (no environment variables to type)

### 1. Deploy to Vercel

1. [vercel.com/new](https://vercel.com/new) → import `ahaile13/vibe` → **Deploy**.
   The first deploy shows a "Supabase isn't connected yet" banner. That's expected.

### 2. Add the database from inside Vercel

1. In your Vercel project, open **Storage → Create Database → Supabase**. Pick a US region and connect it to this project.
   Vercel fills in every setting the app needs (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). You don't copy anything.
2. Open the new database in Supabase (Vercel has an **Open in Supabase** button). Go to **SQL Editor → New query**, paste all of `supabase/migrations/20261012000000_init.sql`, and **Run**.
3. New query: paste `supabase/seed.sql` and **Run**. This adds 10 Dallas launch spots, creates tonight's events, and schedules new ones every morning.
4. Back in Vercel: **Deployments → ⋯ → Redeploy** so the app picks up the database.

### 3. Point sign-in at your site

In Supabase → **Authentication → URL Configuration**:

- **Site URL:** your Vercel address, e.g. `https://vibe-ahaile13.vercel.app`
- **Redirect URLs:** add the same address followed by `/auth/callback`

Then turn off email confirmation so people can sign up with a password instantly (Supabase's free email only sends 2 messages an hour, and only to your Supabase team):

- **Authentication → Sign In / Providers → Email** → switch **Confirm email** off → **Save**

Email + password sign-in then works for anyone. The "email me a link" option needs a custom email sender (Authentication → Emails → SMTP, e.g. Resend's free tier) before it works for the public. Google and Apple are optional, under **Authentication → Sign In / Providers**.

### 4. Try it

1. Open the site on your phone, sign in with email.
2. Tap **+ → Create an event**. It's pinned where you're standing.
3. Open it, tap **Rate the vibe**. You pass the location check because you're actually there.
4. Open the same event from a second phone across town: you'll get "You have to be there to vibe."

---

## How the important parts work

**Location verification lives in the database, not the browser.** Every rating, comment and upload starts with `verify_presence()`, which takes a fresh GPS fix and checks it server-side:

- the event is live right now
- GPS accuracy is 150 m or better
- you're inside the venue's radius or polygon (plus a small accuracy allowance)
- you didn't "teleport" more than 2 km at over ~250 km/h since your last check-in
- you're under 12 checks a minute

Pass, and you get a single-purpose token that lasts 3 minutes and covers 3 actions. `submit_rating`, `submit_comment` and `create_post` all spend that token, and the storage bucket only accepts uploads while you hold one for that event. Ratings can't be inserted any other way.

GPS can still be spoofed by a determined person with developer tools. These checks make that slow, noisy and detectable; they don't make it impossible. That's true of every location app.

**Privacy**

- Ratings are anonymous. Nobody, including other signed-in users, can see who rated what. Live updates go through `event_activity`, a table that only says "event X changed".
- The only stored location is each user's latest check (overwritten every time), used for the teleport check. No location history.
- Photos are re-encoded in the browser before upload, which strips EXIF and embedded GPS. Video clips are stored as recorded, and phone videos can carry location metadata; server-side transcoding (not built yet) would strip it.
- Private events don't appear in the feed or map, and their address and pin are hidden from everyone but the creator.

**Scoring** (`src/lib/scoring.ts`, all knobs in `SCORING`)

- Each rating fades over about an hour.
- Bayesian smoothing pulls small samples toward neutral, so 2 votes can't beat 200.
- Confidence: *Not enough data* under 5 ratings, *High* at ~18 effective ratings with 8+ in the last hour.
- Momentum (Heating up / Cooling down) compares the last 30 min to the 30 before, with at least 5 ratings in each.
- Feed rank: recent ratings 25%, VIBES Score 20%, 15-min velocity 20%, worth-it 15%, freshness 10%, distance 10%.

**Moderation:** Report and Block on every comment and post. Three independent reports hide an item until review. Organizers get no special power over ratings.

---

## Local development

```bash
npm install
cp .env.example .env.local   # paste your Supabase URL and anon key (local only)
npm run dev
```

Geolocation only works on `localhost` or HTTPS.

---

## Not built yet

- Following feed and public profiles
- Venue claiming and organizer tools
- Push notifications
- Server-side video transcoding (clips are stored as recorded, max 10 s / 50 MB)
- Address autocomplete when creating events (events pin to where you're standing)
- A moderation dashboard (reports are in the `reports` table for now)

The map uses CARTO's free dark basemap. For heavy traffic, set `NEXT_PUBLIC_MAP_STYLE` to a MapTiler or Mapbox style URL.

**Typecheck:** `npm run typecheck`. Builds don't fail on type errors (see `next.config.mjs`), so run it in CI.
