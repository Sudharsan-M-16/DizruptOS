# Real Auth — Supabase Auth setup (scaffolding is in place)

The code scaffolding for **real authentication** ships now and is **env-gated** — with
no Supabase config the app runs the demo persona flow exactly as before. Add the config
below and real sign-in activates with **no further code changes**.

## What's already wired
- `src/lib/auth-supabase.ts` — `browserClient()`, `serverClient()`, `claimsFromUser()`
  (reads `role` + `org_id` from the JWT), and `isAuthConfigured`.
- `src/app/auth/callback/route.ts` — exchanges the magic-link / OAuth `code` for a
  session cookie, then boots the desktop.
- `@supabase/ssr` + `@supabase/supabase-js` installed.

## To go live (≈15 min, needs your Supabase project)
1. **Create a Supabase project** and grab the URL + anon key.
2. In `dizruptos/.env.local` (git-ignored, never commit):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<service-role>     # server only
   DATABASE_URL=<Session Pooler URI (IPv4)>     # not the IPv6 direct host
   ```
3. **Auth → Providers**: enable **Email** (magic link) and/or Google / Microsoft.
4. **Auth → URL config**: add `http://localhost:3000/auth/callback` (and your prod
   origin) as a redirect URL.
5. **Mint role + org into the JWT** — add a Supabase **Auth Hook** (or a `before-token`
   SQL function) that copies `users.role` and `users.org_id` into
   `app_metadata.role` / `app_metadata.org_id`. This is what the OS-layer RBAC and RLS
   read (`claimsFromUser`).
6. Link `users.id` → `auth.users.id` so the seeded org maps to real accounts.

Once 1–6 are set, `isAuthConfigured` flips true, `/auth/callback` becomes live, and the
existing RBAC (now reading real JWT claims instead of demo personas) enforces against
real identities. RLS — already written in `supabase/migrations` — then protects data
for real, not just against demo JWTs.

## Why this is the P0 for the rating
The Security / Enterprise / Production scores are gated on *this* being live with real
users. The scaffolding removes the code work; what remains is your Supabase project +
provider config + one Auth Hook — infrastructure, not code.
