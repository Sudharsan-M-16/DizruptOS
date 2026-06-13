# BACKEND_PLATFORM_REVIEW.md — Platform Realization Sprint

> Honest record of the backend ascension sprint (June 2026): what is now real,
> what is scaffolded with production contracts, and what genuinely requires a
> live Supabase project. Companion: [PLAN.md](PLAN.md),
> [MASTER_EXECUTION_PLAN.md](MASTER_EXECUTION_PLAN.md).

## 1. Infrastructure audit findings (Phase 1)

| Finding | Severity | Status |
|---|---|---|
| All entity data in-memory, client-side only | critical | ✅ Repository layer introduced; server holds its own state; API serves it |
| Business laws (guardrail, atomic deltas) lived inside the Zustand store | high | ✅ Extracted to pure service functions with tests; store and API share them conceptually, API uses them directly |
| No server-side authorization — client checks only | critical | ✅ `resolvePrincipal` + `requirePermission` enforce RBAC at the route boundary; `/api/v1/*` returns 401/403 |
| Persona/permission definitions inside a `"use client"` module | high | ✅ Extracted to server-safe `lib/personas.ts`; client re-exports |
| No API surface beyond auth/health | high | ✅ Versioned `/api/v1` introduced (proposals, capacity) with typed envelopes |
| No API rate limiting | medium | ✅ 120 req/min/IP at the edge for `/api/v1`; login keeps its stricter 10/15min |
| API requests without a session got HTML redirects | medium | ✅ APIs now answer 401 JSON |
| Supabase schema exists but nothing speaks to it | high | 🟡 PostgREST repository implemented; activates on env config (needs a live project) |

## 2. Architecture now in the repo (Phases 2–8, 12)

```
UI (pages/components)
  └─ Zustand stores (optimistic UX state)           src/lib/store.ts
API routes /api/v1/* (typed envelopes, versioned)   src/app/api/v1/
  └─ Authz services (principal, permissions)        src/server/services/authz.ts
  └─ Domain services (capacity laws, pure)          src/server/services/allocation.ts
      └─ Repository factory (env-selected)          src/server/repositories/index.ts
          ├─ Memory impl (demo mode)                .../memory.ts
          └─ Supabase impl (PostgREST, typed)       .../supabase.ts
              └─ supabase/ SQL schema + RLS
```

- **Repositories** (`src/server/repositories/`): one interface set
  (`Repositories`), two implementations. The audit repository deliberately
  exposes no update/delete (insert-only law at the type level — tested).
  Reassignment is one atomic unit in both backends (memory: single pass;
  Supabase: `rpc/reassign_task` Postgres function).
- **Services** (`src/server/services/`): `planReallocation` computes
  projection + guardrail decision + the exact delta set *before* anything
  mutates; `applyDeltas` is conservative (tested: total hours preserved).
  `authz.ts` is the trust boundary: cookie → principal → permission check.
- **API v1** (expanded June 12 sprint — shared plumbing in `src/server/api.ts`:
  one envelope, one error contract — AuthzError→401/403, NOT_FOUND→404,
  INVALID_INPUT→422, CONFLICT→409, storage→503):
  - `GET /api/v1/proposals` — role-scoped server-side with the same
    `proposalsForRole` predicate the UI uses.
  - `PATCH /api/v1/proposals/:id` — `{action: approve|reject}`. Authorization
    is the visibility predicate itself; invisible ids return 404 (existence
    not leaked); non-pending verdicts return 409; every verdict appended to
    the audit ledger. **Verified live.**
  - `GET /api/v1/capacity?week=` — gated on `view_capacity`.
  - `POST /api/v1/tasks/:id/reassign` — `{toEmployeeId, overrideReason?}`,
    gated on `reallocate`. The ≥100% guardrail runs server-side: 409
    OVERRIDE_REQUIRED without a typed reason; override + reason commits
    atomically and lands in audit with `REALLOCATE_OVERRIDE`. **Verified
    live: same-assignee 409 → override-required 409 → override 200.**
  - `GET /api/v1/employees` + `/:id` — cost fields redacted unless
    `view_financials`.
  - `GET /api/v1/risks` — authenticated read; severity always computed
    server-side.
  - `GET /api/v1/audit?limit=` — gated on `view_audit` (verified 403 for
    project_manager); read-only by design — no write surface exists.

  Every response carries `apiVersion` and the live `backend` name.
- **Security**: edge auth + OWASP headers (existing) + API rate limiting +
  JSON 401s + server-side RBAC. CSRF posture: `sameSite: strict` cookie +
  `form-action 'self'` CSP.

## 3. Verification

`tsc` clean · lint clean · **75/75 tests** (allocation laws, repository
contracts, RBAC scoping, API contract suite — audit permissions per role,
verdict authorization + state machine, financial redaction matrix — risk
law, graph traversals, AI validation) · `next build` clean (19 routes).
Negative paths tested: guardrail trip, no-op move refusal, unknown-target
rejection, employee/admin inbox separation, double-verdict conflict,
invalid-action 422, invisible-proposal 404.

Run it: `cd dizruptos && npx next dev -p 5175` → http://localhost:5175.
No env vars needed (demo mode). Production mode: set
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-side
`SUPABASE_SERVICE_ROLE_KEY` — the repository factory switches automatically;
half-configuration fails loudly at boot (`lib/env.ts`).

## 4. What requires a live Supabase project (not fakeable honestly)

- Running the SQL in `supabase/` and the `reassign_task` function; verifying
  RLS by connecting as each role.
- Supabase Auth (signup/reset/magic links) replacing persona cookies.
- Realtime channels replacing BroadcastChannel (same publish points).
- pgvector for the AI retrieval layer (Phase 11) — embedding columns belong
  in a migration, not in demo code.

## 5. Remaining limitations & next moves

1. Client stores still mutate their own copy; next sprint points the store's
   actions at `/api/v1` mutations (the read path and laws are already shared;
   `@tanstack/react-query` is installed and ready to own the fetch layer).
2. ~~Proposal review API~~ ✅ shipped: `PATCH /api/v1/proposals/:id` with
   visibility-scoped authorization, verdict state machine, audit append.
3. Observability: structured logger exists (`lib/logger.ts`); tracing and
   external sinks are stubs.
4. Multi-tenancy, SSO/SCIM: schema headroom documented in PLAN.md; not begun.
5. No `GET /api/v1/tasks` list route yet — reassign consumers currently know
   task ids from page data; add when the store moves to server reads.
