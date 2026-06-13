# DIZRUPT — Backend Readiness Audit (live Supabase)

> Evidence-based snapshot after wiring the live Supabase backend over the
> session pooler. No secrets are stored here. Date: 2026-06-13.

## Connectivity
- **Direct DB endpoint** `db.<ref>.supabase.co:5432` is **IPv6-only** (no A record); unreachable from IPv4-only hosts → use the **session pooler**.
- **Session pooler** `aws-0-<region>.pooler.supabase.com:5432` (user `postgres.<ref>`): **CONNECTED** ✓ (`db=postgres`).
- REST/PostgREST (`https://<ref>.supabase.co`): IPv4, reachable ✓.

## Infrastructure (applied live)
- **Migration 0001** applied → **32 public tables** created:
  departments, users, sessions, projects, sprints, tasks, task_collaborators,
  task_dependencies, capacity_logs, audit_events, risks, decisions, meetings,
  commitments, goals, knowledge_docs, customers, revenue_streams, services,
  entity_relationships, entity_paths, causal_signals, agent_proposals_staging,
  proposals, agent_memory, notifications, notification_dedup, dead_letter_jobs,
  entity_embeddings, scenarios, org_snapshots, org_snapshot_data.
- Extensions `pgcrypto` + `vector` enabled; `entity_embeddings.embedding vector(1536)`
  with ivfflat index created ✓.
- **Migration 0002** applied → role grants (anon/authenticated/service_role) +
  RLS recursion fix (see Security).
- Seed (`supabase/seed.sql`) applied — row counts:
  departments 2, users 5, projects 2, tasks 2, capacity_logs 3, risks 2,
  decisions 1, goals 1, customers 1, services 1, **entity_relationships 12**,
  causal_signals 1, audit_events 7 (trigger-generated).

## Domain laws verified live
- **Audit completeness (law 1):** 7 `audit_events` were written automatically by
  `write_audit_event()` triggers on project/task/risk/decision inserts — never
  inserted by hand. `UPDATE/DELETE` revoked from authenticated/anon (immutable).
- **Computed risk severity (law, §28.2):** `compute_risk_severity()` trigger
  produced Atlas (high/critical)=**Critical**, Northwind (medium/high)=**High**,
  matching `src/lib/risk.ts`.

## Auth
- Supabase auth helpers present (`auth.uid()`, `auth.jwt()`) ✓.
- App-level auth is still demo personas → httpOnly `dz_session` cookie (single
  session). **Supabase Auth (email/OAuth/MFA) is NOT yet wired** — see limitations.

## Security — RLS validation (10/10 pass)
Run as `authenticated`/`anon` with simulated JWT claims (the `postgres`
owner bypasses RLS, so tests switch role):

| Policy intent | Expected | Result |
|---|---|---|
| employee sees dept users | 3 | 3 ✓ |
| employee sees dept projects | 2 | 2 ✓ |
| employee denied audit_events | 0 | 0 ✓ |
| admin sees audit_events | >0 | 7 ✓ |
| exec sees all projects | 2 | 2 ✓ |
| cross-dept employee → projects (isolation) | 0 | 0 ✓ |
| employee sees only own notifications | 0 | 0 ✓ |
| anon → users / projects / audit (deny-by-default) | 0/0/0 | 0/0/0 ✓ |

Two real defects were found by these tests and fixed in **0002**:
1. **RLS recursion (54001):** `auth_dept()` queried `users` from inside the
   `users` policy → infinite recursion. Fixed via `SECURITY DEFINER` + pinned
   `search_path`.
2. **Missing grants (42501):** applying DDL over a direct connection skipped the
   anon/authenticated/**service_role** grants Supabase normally adds. Granted
   (RLS still governs rows; grants only open the table).

## Realtime
- `supabase_realtime` publication now includes **6 tables**: notifications,
  capacity_logs, proposals, audit_events, risks, tasks. ✓

## Live persistence
- App runs in `production` mode; repositories resolve to the Supabase backend.
- **Verified live read:** authenticated `GET /api/v1/projects` returns the live
  rows from Supabase (Atlas `CRITICAL`, Helix `ON_TRACK`) — not the in-memory seed. ✓

## Database quality findings
- **Money columns are `integer` (int4, ~2.1B max)** but documented as micro-units
  ($1 = 1e6) → overflows above ~$2.1K (hit on `customers.arr_micro_units`).
  **Recommendation: widen all `*_micro_units`/`*_amount` to `bigint`.**
- Indexes present on hot paths (tasks by project/assignee/week, FTS on tasks,
  capacity by week, audit by actor/entity, relationships by source/target,
  embeddings ivfflat). No N+1 in the repository layer (single-table reads).

## Repository ↔ schema mapping (remaining integration)
- The Supabase repository still references the **old table names** `employees`
  and `capacity_cells`; the live schema uses **`users`** and **`capacity_logs`**.
- Response shape differs: DB is **snake_case + UUID ids**; TS types are
  **camelCase + semantic ids** (`u-asha`), and the TS `Project` has fields the
  schema lacks (`code`, `velocityTrend`) while the schema has richer fields the
  TS model lacks. **A canonical-model decision + data mappers are required**
  before the frontend consumes live reads. Until then the UI runs on the
  client-seeded store (UX unaffected).

## Production readiness
**Score: ~5/10 — real backend, not yet a wired product.**
- ✅ Live schema, seed, RLS (validated), realtime, audit immutability, computed laws.
- 🟡 Live read path proven for one entity; full repository mapping pending.
- ❌ Supabase Auth (real login/MFA/sessions) not wired.
- ❌ Multi-tenant `org_id` not yet in the schema (dept-scoped today).
- ❌ Money columns int4 (bug).

### Blockers / next sprint
1. Repository mappers + canonical model reconciliation (TS types ↔ schema), fix table names.
2. Supabase Auth (replace demo personas; map `app_metadata.role` to JWT for RLS).
3. Widen money columns to bigint (migration 0003).
4. Add `organizations`/`org_id` for true multi-tenancy; extend RLS.
5. Wire TanStack Query for live reads in the UI; realtime subscriptions on the client.

## Commands / reproduction
- Connectivity/apply/seed/RLS scripts were run via `pg` against `DATABASE_URL` (pooler).
- Migrations: `supabase/migrations/0001_core_schema.sql`, `0002_grants_and_rls_fixes.sql`.
- Seed: `supabase/seed.sql`.
- Local app: `http://localhost:5175` (mode `production`).
