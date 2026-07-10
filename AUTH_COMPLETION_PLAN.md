# DIZRUPT — Auth Completion Plan + EXACTLY what I need from you

> Honest status: real auth is NOT implemented. This is the precise, ready-to-execute
> plan + the external dependencies only you can provide. Once these are set, the code
> changes are ~½–1 day and verifiable end-to-end (except the parts noted "needs inbox").

## PART A — What YOU must configure (external; I cannot do or verify these)
In the **Supabase dashboard** (project `diobpspmycqffbuuedvz`):

### 1. Email / magic-link (no third party needed)
- **Authentication → Providers → Email**: ensure **Enabled**.
- **Authentication → Providers → Email → "Confirm email"**: **turn OFF** for now.
  *(Why: with it ON, sign-in fails until a confirmation email is clicked — which blocks
  automated verification. Turn back ON for production once SMTP is set.)*
- **Authentication → URL Configuration**:
  - **Site URL**: `http://localhost:5175`
  - **Redirect URLs**: add `http://localhost:5175/auth/callback`
  - (later, prod) add your deployed origin + `/auth/callback`.
- **Email magic-link verification** still **needs a real inbox** — give me ONE test email
  address you can check, or accept that I verify password sign-in (no inbox) and you
  manually click the magic link once.
- (Production only, optional now) **SMTP** under Auth → Emails, or magic-link emails are
  rate-limited by Supabase's shared sender.

### 2. Google OAuth (optional)
- Google Cloud Console → OAuth client (Web) → get **Client ID + Client Secret**.
- Authorized redirect URI: `https://diobpspmycqffbuuedvz.supabase.co/auth/v1/callback`.
- Supabase → Auth → Providers → **Google** → paste ID/secret → enable.
- Give me nothing secret; just **confirm it's enabled**.

### 3. Microsoft (Entra) OAuth (optional)
- Azure → App registration → client ID/secret + the same Supabase callback URI.
- Supabase → Auth → Providers → **Azure** → enable. Confirm when done.

### 4. Role + org claims (one-time, in Supabase)
Real RLS needs `app_metadata.role` and `app_metadata.org_id` on the JWT. Options:
- Simplest: I add a **DB trigger** on `auth.users` insert that creates a `public.users`
  row (org_id from the invite) and a **Postgres Auth Hook** (or `custom_access_token_hook`)
  that injects `role`/`org_id` into the JWT. *(I can write this migration; you just enable
  the hook in Auth → Hooks.)* — **confirm you'll enable the hook.**

## PART B — What I will implement once Part A is done (verifiable by me)
1. `npm i @supabase/supabase-js @supabase/ssr`.
2. `lib/supabase/{client,server}.ts` — browser + server (cookie-based) clients.
3. Login page: real **email/password + "email me a magic link"** forms (replaces persona picker).
4. `app/auth/callback/route.ts` — exchanges the code/token for a cookie session.
5. `middleware.ts` — validate the Supabase session (replaces `dz_session` persona cookie).
6. `lib/session.ts` + `AuthGate` — read the real user; remove demo-persona assumptions.
7. `server/services/authz.ts` `resolvePrincipal` — read `sub`/`role`/`org_id` from the
   verified JWT (RLS/tenancy then run on REAL identity — the whole point).
8. Migration: `auth.users`→`public.users` trigger + the claims hook.
9. Keep a `DEMO_MODE` fallback so the app still runs with no auth configured.

## PART C — What I can verify vs not
- **Can verify**: build/typecheck/tests; password sign-in→session→protected route→RLS
  scoping by real org (if "Confirm email" is OFF); logout; route protection; RLS/tenancy
  on real claims.
- **Cannot verify alone**: the magic-link email click (needs an inbox), OAuth round-trips
  (need providers enabled + a browser consent I can't complete), production SMTP.

## Minimal path to "a real org can sign up and use it" (your success criterion)
Do Part A #1 + #4 (email + claims hook; skip OAuth for now). Then I implement Part B and
verify password auth end-to-end on real identities. OAuth is additive afterward.

## One-line ask
Reply with: (a) "Confirm email is OFF + redirect URL added", (b) one test email you can
check (or "verify password-only"), and (c) "claims hook will be enabled". That unblocks
full, verifiable auth.
