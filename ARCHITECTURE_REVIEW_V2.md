# DIZRUPT — Architecture Review V2 (CTO pass)

> Brutally honest, optimized for correctness. Successor to `CTO_REVIEW.md`,
> written against the live state after the Decision-Intelligence sprint. 2026-06-13.

## What changed since V1 (verified)
- **Live Supabase backend**, 42 tables, RLS validated 10/10, audit + severity triggers live.
- **Repository layer reads live across the board** (#13 closed): projects, capabilities,
  employee-capabilities, relationships, approvals, employees(`users`), capacity(`capacity_logs`),
  decisions, outcomes, learnings — snake→camel mappers, schema-authoritative (Option A).
- **Intelligence Engine** generalized: `capability`, `people`, `decision`, `orgMemory`,
  `dependency`, `risk`, `orgHealth` — one barrel, shared `score+evidence+explanation` contract.
- **Approvals + Outcomes + Learnings** are first-class persisted objects → decision memory.
- **Money columns widened to bigint** (V1's int4 overflow bug — fixed, migration 0006).
- **124 tests** across intelligence/graph/RBAC/RLS/contracts.

## Strengths
- The graph + ontology + computed-engine substrate is genuinely hard to replicate.
- Clean layering: repository → loader/service → engine → API. No computation in routes,
  no fetching in engines. Engines are pure → trivially testable, reused by future surfaces.
- Decisions now explain themselves and remember their outcomes — the differentiator.

## Weaknesses / technical debt (honest)
1. **Auth is still demo personas.** RLS assumes `auth.uid()`/`app_metadata.role` that no
   real identity issues. This is the single biggest gap to "deployable". (Tier-1.)
2. **No `org_id` / tenant** on most tables — dept-scoped only. Multi-tenancy retrofit looms.
3. **Memory-mode divergence**: demo (in-memory) repos use string ids; live uses uuid. Several
   demo repos now return `[]` (decisions/outcomes/learnings) — demo mode is degraded vs live.
4. **`entity_paths` traversal cache has no refresher** — dependency/blast-radius compute
   on-read (fine at current N; needs a worker or materialization at scale).
5. **Engine loaders re-query per request** — no caching server-side; TanStack caches client-side
   only. Fine now; add request memoization before scale.
6. **Lossy employee mapper**: `users` lacks title/location/expertise/pto/burnout that the TS
   `Employee` type carries — defaulted. Either add columns or trim the type (model still split).

## Ontology gaps (still)
- **Capability** is modeled (good); **org/tenant**, **Team**(partial), **Vendor/System** distinct
  from `services`, **Process/Policy/Control** still missing for governance/compliance depth.

## Security gaps
- Real auth + MFA + SSO absent. RLS is correct *given* a JWT, but nothing issues the role claim
  in app flows yet. No CSRF tokens on mutations; CSP not strict. Pen-testing not yet performed.

## Scalability risks
- PostgREST per-entity reads (no batching/embedding beyond a couple of joins).
- Graph traversal in JS (fine ≤ thousands of edges; plan pgRouting/recursive CTE beyond).

## Highest-value next steps (leverage order)
1. **Real auth** (Supabase Auth + role→JWT) — unblocks RLS in practice + multi-tenant.
2. **`org_id` everywhere** + tenant RLS.
3. **Dependency/Risk/OrgHealth live API routes + surfaces** (engines done; expose them).
4. **Reconcile the employee model** (add columns or trim type) to end the split.
5. **GraphRAG / Organizational Copilot** over the now-rich memory graph.
6. Worker for `entity_paths` + server-side query caching.

## Verdict
Architecture score materially up from V1: the platform now *computes, explains, and
remembers*. The remaining gap is no longer cognitive — it's **identity/tenancy and
exposing the computed intelligence through more surfaces**.
