# VIBES

Live, location-verified ratings of what's popping right now. Dallas first.

**Stack:** Next.js 15 (App Router) · Supabase (Postgres, Auth, Realtime, Storage) · MapLibre · Vercel

---

## Go live in about 15 minutes

### 1. Supabase (database, accounts, uploads)

1. Create a free project at [supabase.com](https://supabase.com). Pick the **US East** or **US Central** region.
2. Open **SQL Editor → New query**, paste all of `supabase/migrations/20261012000000_init.sql`, and click **Run**.
3. New query again: paste `supabase/seed.sql` and **Run**. This adds 10 Dallas launch spots and creates tonight's events.
4. **Project Settings → API**: copy the **Project URL**, the **anon / publishable key**, and the **service_role key**.

### 2. Vercel (hosting)

1. [vercel.com/new](https://vercel.com/new) → import this GitHub repo. Framework is detected as Next.js.
2. Before deploying, add these **Environment Variables**:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key (server only, never shared) |
   | `CRON_SECRET` | any long random string |
   | `NEXT_PUBLIC_SITE_URL` | your Vercel URL, e.g. `https://vibe-dallas.vercel.app` |

3. Click **Deploy**.

### 3. Connect sign-in to your URL

In Supabase → **Authentication → URL Configuration**:

- **Site URL:** your Vercel URL
- **Redirect URLs:** add `https://YOUR-APP.vercel.app/auth/callback` (and `http://localhost:3000/auth/callback` for local dev)

Email sign-in works immediately. Google and Apple are optional: enable them under **Authentication → Providers** when you're ready. Until then those buttons say they aren't set up yet.

### 4. Try it

1. Open the site on your phone, sign in with email.
2. Tap **+ → Create an event**. It's pinned where you're standing.
3. Open it, tap **Rate the vibe**. You pass the location check because you're actually there.
4. Open the same event from a second phone across town: you'll get "You have to be there to vibe."

The daily cron (`vercel.json`) creates each night's events for the launch spots at 10 AM Central.

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
cp .env.example .env.local   # fill in your Supabase values
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
