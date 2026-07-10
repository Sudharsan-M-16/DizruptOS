# DIZRUPT — Deployment Guide

## Prerequisites
- Node 20+, a Supabase project.
- `dizruptos/.env.local` (git-ignored):
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - `DATABASE_URL` — **use the Session Pooler URI (IPv4)**; the direct
    `db.<ref>.supabase.co:5432` host is IPv6-only and will time out on IPv4 networks.

## Database (migrations in order)
Apply `dizruptos/supabase/migrations/0001…0008` then `seed.sql` + `seed_capabilities.sql`
(via Supabase SQL editor, `supabase db push`, or `psql`/pg against `DATABASE_URL`).
After applying over a direct connection, run `notify pgrst, 'reload schema';` so PostgREST
sees new tables. 0002 grants anon/authenticated/**service_role**; without it PostgREST 403s.

## Build & run
```
cd dizruptos
npm ci
npm run build        # verified green
npm start            # production server
```
With Supabase env set, `/api/health` reports `mode: production`. Without it, demo mode
(in-memory seed) — fully functional, no DB needed.

## CI
`.github/workflows/ci.yml` runs typecheck/lint/test/build on push/PR (working-dir dizruptos).

## Hosting
Vercel recommended (Next.js App Router). Set the four env vars as project secrets.
`SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` are server-only — never `NEXT_PUBLIC_*`.

## Rollback
Code: redeploy previous Git SHA. DB: migrations are additive; write down-migrations before
destructive changes (none to date). Keep a Supabase point-in-time backup before applying.
