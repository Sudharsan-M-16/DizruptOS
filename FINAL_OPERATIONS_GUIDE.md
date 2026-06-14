# DIZRUPT — Operations Guide

## Health & readiness
- `GET /api/health` → `{ status, mode, database, realtime, ai }`. `mode=production` confirms
  Supabase env is loaded; `mode=demo` = in-memory fallback.
- Every `/api/v1` response carries `x-request-id` (honored from upstream or minted) and a
  structured JSON log line (method/path/status/ms) — the seam for an OTel/Sentry exporter.

## Common operational issues
- **PostgREST `PGRST205` (table not in schema cache)** after a migration → run
  `notify pgrst, 'reload schema';`.
- **`42501` permission denied** → role grant missing (see migration 0002; grant to the
  failing role).
- **DB connect `28P01`** = wrong password; **`timeout`/IPv6-only** = use the Session Pooler URI.
- **Intelligence route 401** = expected when unauthenticated (auth gate working).

## Backups & recovery
- Supabase automated backups + PITR. Before any destructive migration: manual snapshot.
- Audit log (`audit_events`) is insert-only (UPDATE/DELETE revoked) — tamper-resistant record.

## Monitoring (TODO — not yet implemented)
No metrics/tracing/error-tracking/alerting yet (gap in FINAL_GAP_ANALYSIS). Add OTel +
Sentry + uptime checks before real production traffic. This guide documents the *intended*
operational surface; the instrumentation itself is unbuilt.

## Incident response (foundations)
- Triage via `x-request-id` correlation in logs.
- RLS + restrictive tenancy contain blast radius of a compromised authenticated session to
  its own org. A leaked `service_role` key is full-access → rotate immediately in Supabase.
