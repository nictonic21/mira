# Circle

A private friendship audit app. Log what happens in your friendships, and see
which relationships are feeding you and which ones are draining you.

Lives alongside the Mira app in this repo but is completely standalone — its own
`package.json`, its own pages, its own tables.

## Stack

- Next.js (App Router) + Tailwind, deployable to Vercel
- Supabase for auth and database (client-side supabase-js + row level security,
  same pattern as Mira)
- Anthropic API (`claude-opus-5`) for entry scoring and plain-language summaries

## Getting started

1. `cd circle && npm install`
2. Create a Supabase project (or reuse an existing one) and run
   `supabase/schema.sql` in the SQL editor. It creates Circle's tables, row
   level security policies, and a trigger that creates a profile row on signup.
3. Copy `.env.example` to `.env.local` and fill in the Supabase URL, anon key,
   and your Anthropic API key.
4. `npm run dev` — the app runs on http://localhost:3001 (port 3001 so it can
   run next to Mira).

## What's built (MVP scope)

- **Auth and onboarding** — sign up, confirm, add your first friends
- **Add friends** — from onboarding or the dashboard
- **Quick log** — who, energy slider (drained → energised), who made the
  effort, optional tags; under fifteen seconds
- **Deep log** — expandable "what happened" / "how did you feel" free text,
  scored in the background by AI (sentiment, themes, one-line note)
- **Friend profile** — score out of 100, twelve-month trend line, effort
  balance, most common tags, frequency, AI summary in plain language, full
  moment history, easy archive/delete
- **Dashboard** — circle ranked by score, ones to protect, ones taking more
  than they give, friends going quiet (60+ days)

No score is shown for a friend until they have at least 5 entries — three
entries is not a pattern.

### How the score works

`lib/scoring.ts`: 55% average energy-after, 20% AI sentiment of deep logs
(falls back to energy when nothing is analysed), 25% effort balance (drops as
initiation becomes one-sided in either direction). The MVP computes this on
read; the `friend_scores` table is ready for the nightly recompute job when
that becomes worth doing.

### The AI layer

Two stateless API routes, tightly scoped so costs stay predictable:

- `POST /api/score-entry` — runs once per deep log. Structured JSON output
  (sentiment −1..1, themes, one-line note). The client stores the result in
  `entry_analysis`, so the route needs no database access.
- `POST /api/friend-summary` — on demand from a friend's profile. Reads the
  last ~30 days of entries and writes two or three warm sentences.

Both prompts enforce the tone rules: observation not verdict, never the word
"toxic", never advice to cut someone off.

## Deliberately left out (per the brief)

Notifications, yearly wrapped, contact syncing, reminders, any social feature —
plus Stripe subscriptions and Resend email. The `users.subscription_status`
column and the free-tier limits (5 friends, quick logs only) are ready to wire
up when monetisation lands.

One deviation from the build prompt: writes go through the client-side Supabase
client with row level security rather than server actions, matching how Mira is
already built. Swapping to server actions later means adding `@supabase/ssr`
cookie-based auth.
