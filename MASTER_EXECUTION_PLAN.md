# DIZRUPT — MASTER EXECUTION PLAN
### The definitive operating manual for the repository

> **Audience:** any future contributor — junior engineers, contractors, weaker
> AI models, open-source agents — with **zero prior context**. The PRD,
> inspiration docs, and chat history are assumed gone. This document plus the
> repository is enough to continue.
>
> **Repo root:** `C:\Users\sudha\DizruptOS` (git; CI in `.github/workflows/ci.yml`)
> **App:** `dizruptos/` — Next.js 14 App Router · TypeScript · Tailwind
> **Companion docs in repo:** `CONTRIBUTING.md` (mechanics), `DIZRUPT_Supreme_PRD_v3.md` + `dizruptos-ui-inspiration.md` (originals, versioned but no longer required)
> **Status date:** June 2026 · Titan + Frontend Ascension sprints complete
> **Design & motion system reference:** `FRONTEND_ASCENSION_REVIEW.md`

---

# PART I — WHAT THIS IS

## 1. Executive Summary

**DIZRUPT is a Resource Intelligence Platform** — the system of record for
human capacity and organizational execution, positioned between project
management (Jira) and HR (Workday). The buying wedge: a Resource Manager at a
50–500 person company wastes 3+ hours every Monday reconciling spreadsheets,
Jira, and Slack to answer *"who can absorb more work?"*. DIZRUPT collapses
that into one live capacity heatmap with drag-to-reassign and sub-second
confirmation. Everything else — explanatory health engines, agent proposals,
organizational memory, the relationship graph — is retention and expansion.

**Three product laws govern every line of code:**
1. **Never show a score without showing why.** Every metric carries stored
   causal signals (the `Explain` component). Explanations are assembled from
   data, never regenerated free-text.
2. **Two-Click Rule.** Staffing, escalation, and review complete in ≤2
   interactions from any view. Keyboard paths exist for everything.
3. **Agents propose, humans decide.** AI writes only to a proposals inbox.
   Proposals are validated against hard constraints before surfacing AND
   re-validated at decision time. Rejections are remembered for 30 days.

**What runs today (demo mode, zero env vars):** the full 16-surface product on
a typed in-memory seed organization — real session enforcement at the edge
(httpOnly cookie + middleware), real RBAC view shaping, real cross-tab
realtime sync, real AI validation/ranking/compression logic (deterministic,
no API key), light/dark/system theming, 40 passing tests, CI, structured
logging, security headers, and a complete executable Postgres schema waiting
for a Supabase project.

**What is blocked on external credentials:** live persistence (Supabase),
verified identity (Supabase Auth), cross-browser realtime (Supabase
channels), model calls (Anthropic/OpenAI). Section 14 (T1–T4) gives
step-ordered instructions for each.

## 2. Run It

```bash
cd dizruptos
npm install
npm run dev          # http://localhost:3000 (or the port Next picks)
```

No environment variables are needed — **demo mode is a feature**: full UI,
persona auth, cross-tab sync, deterministic AI. To enable production tiers,
copy `.env.example` → `.env.local` and fill the documented variables.

Quality gates (CI runs the same four):
```bash
npm run lint && npm run typecheck && npm test && npm run build
```

Sign in at `/login` as any persona (one per role tier). Two browser tabs =
live sync demo: drag a task in one, watch the other update with a presence
badge.

## 3. Current State Assessment (honest)

| Area | State | Grade |
|---|---|---|
| Frontend surfaces & design system | 16 routes, dual theme, tokenized, three-tier motion architecture, signature components, verified | 9.8 |
| Product architecture | Laws encoded in shared libs, pinned by tests | 9.5 |
| Domain modeling | 17 entities typed; mirrors production schema | 9.5 |
| Graph architecture | Closed registry, traversal, cycle detection, blast radius, bus factor — tested | 9.5 |
| Auth | Edge-enforced httpOnly sessions, rate-limited issuance, RBAC matrix; identity not yet *verified* (no password check) | 8.5 |
| Persistence | Complete executable schema + RPC + RLS + triggers; app still in-memory | 8.5 |
| Security | CSP/headers/middleware/rate-limit/audit-immutability designed in; server RBAC awaits DB | 8.5 |
| Realtime | Working transport abstraction (BroadcastChannel) + presence; single swap point for Supabase | 8.5 |
| AI foundations | Deterministic validation/compression/ranking/explanation, wired into the product; no model calls yet | 8 |
| Testing | 40 tests across 6 suites pinning every product law incl. adversarial stale-proposal | 8.5 |
| Observability | Structured logger at every mutation, error boundaries, mode-aware health probe | 8 |
| Developer experience | 4-gate CI, typecheck, CONTRIBUTING, env validation, .env.example, this manual | 9 |
| Production readiness | One `supabase db push` + four env vars from live persistence | 8.5 |

**Verified this sprint (do not re-verify blindly — re-run instead):**
lint 0 warnings · `tsc --noEmit` clean · 40/40 tests · build 18 routes +
27.4 kB middleware · browser flows: middleware redirect `/ → /login?from=%2F`,
login → cookie → dashboard, RBAC nav gating, health endpoint mode report,
light/dark themes, heatmap drag + guardrail, proposal review, graph blast
radius.

---

# PART II — ARCHITECTURE

## 4. Repository Architecture

```
DizruptOS/
├─ MASTER_EXECUTION_PLAN.md      ← this manual
├─ CONTRIBUTING.md               ← change mechanics + working agreements
├─ .github/workflows/ci.yml      ← lint · typecheck · test · build
├─ DIZRUPT_Supreme_PRD_v3.md     ← original spec (everything load-bearing is mirrored here)
├─ dizruptos-ui-inspiration.md   ← original design brief
└─ dizruptos/
   ├─ .env.example               ← documented env contract; absent vars = demo mode
   ├─ supabase/migrations/0001_core_schema.sql   ← COMPLETE executable schema
   ├─ src/middleware.ts          ← edge session check + security headers (CSP etc.)
   ├─ src/app/
   │  ├─ login/                  ← persona sign-in (calls /api/auth/login)
   │  ├─ api/auth/{login,logout} ← httpOnly cookie issuance/revocation, rate-limited
   │  ├─ api/health/             ← mode-aware liveness probe
   │  ├─ (shell)/                ← all product surfaces inside the chrome shell
   │  │  ├─ layout.tsx           ← AuthGate→Sidebar→Topbar→palette/guardrail/drawer/shortcuts
   │  │  ├─ error.tsx loading.tsx← boundary + skeleton for every route
   │  │  └─ page.tsx capacity/ projects/ projects/[id]/ people/ people/[id]/
   │  │     executive/ risks/ decisions/ goals/ proposals/ graph/ audit/
   │  └─ layout.tsx globals.css not-found.tsx   ← fonts, theme tokens, no-flash script
   ├─ src/components/
   │  ├─ shell/   sidebar topbar command-palette guardrail-modal task-drawer
   │  │           shortcuts auth-gate
   │  └─ ui/      primitives.tsx (pills/bars/tiles/Explain/avatars) spark.tsx (charts)
   └─ src/lib/    ← THE DOMAIN LAYER (read this folder first, in this order)
      ├─ types.ts     entity model — the cross-stack contract
      ├─ data.ts      seed organization (18 people · 6 projects · 35 tasks ·
      │               capacity grid · 6 risks · 5 decisions · 6 proposals ·
      │               4 goals · 5 commitments · audit · notifications)
      ├─ store.ts     ops mutations: optimistic reallocation, guardrail,
      │               kanban, proposal review w/ re-validation, audit, realtime publish
      ├─ session.ts   viewer identity, RBAC matrix (roleCan), theme
      ├─ graph.ts     relationship registry + traversal + cycle/bus-factor math
      ├─ ai.ts        validation engine, context compression, ranking, explanations
      ├─ realtime.ts  transport abstraction (BroadcastChannel ⇄ Supabase swap point)
      ├─ risk.ts      severity law (single source; DB trigger mirrors it)
      ├─ utils.ts     formatting + capacity color law
      ├─ env.ts       env validation; defines demo vs production mode
      ├─ logger.ts    structured JSON logging chokepoint
      └─ __tests__/   40 tests: utils, risk, graph, store, ai, session
```

**The one fact that prevents a rewrite:** `lib/data.ts` + `lib/store.ts` are
shaped exactly like the production system (same field names as the SQL schema,
same mutation semantics as the `reallocate_task` RPC). Backend integration is
substitution at marked swap points, never restructuring of pages.

## 4b. Design & Motion Architecture (binding)

Full reference with rationale and critique record: `FRONTEND_ASCENSION_REVIEW.md`.
The rules that bind every UI change:

- **T0 — the living layer** (`src/components/fx/`): one Three.js neural-field
  constellation behind the entire product (code-split, theme-aware, idle-parks
  after 8s, reduced-motion = static frame, never carries information), plus
  the delegated cursor spotlight on every `.panel` and `RevealText` for hero
  text. Budget: exactly one WebGL scene product-wide. Full spec:
  `FRONTEND_ASCENSION_REVIEW.md` §2b.
- **Motion is a three-tier system** (`src/lib/motion.ts`): T1 ambient (route
  entrances via `app/(shell)/template.tsx` — free for every new route),
  T2 structural (exactly two springs: 380/36, 500/34), T3 signal (critical
  pulses, guardrail trips). A new animation must name its tier. All tiers
  collapse under `prefers-reduced-motion`.
- **Signature components** (`src/components/ui/ascension.tsx`):
  `NumberTicker` for decision numbers, `CriticalFrame` (animated gradient
  border — budget **one per view**), `AuroraBackdrop` (login only — cinema is
  a spice). Exceeding these budgets is a design regression.
- **Hierarchy of attention** on dashboards: situation banner → metric tiles →
  work queues → feeds. Every dashboard must answer "what matters right now?"
  before the first scroll, with computed one-click actions.
- **Tables**: sticky headers (`table-sticky`, docks under the 56px topbar);
  density scrolls horizontally below its minimum width — never compresses
  (`min-w` on dense matrices).
- **Graph**: hover ignites connected edges and recedes the rest (12% opacity);
  edge width ∝ strength; `·~` marks inferred edges; minimap always on.
- Tokens/type/surfaces/spacing and the per-screen restraint budgets are
  specified in `FRONTEND_ASCENSION_REVIEW.md` §3 — read it before styling
  anything.

## 5. Target Infrastructure (build toward, never deviate)

```
Vercel: Next.js frontend + short-lived API routes (auth, CRUD, search, capacity RPC calls)
   │ HTTPS + WebSocket
Supabase Cloud: Postgres 15 · RLS · Auth · Realtime · Vault · pgvector
   │ shared connection
Railway worker (persistent Node): automation rules · embedding pipeline ·
   agents + negotiation coordinator · morning briefs · entity_paths refresh ·
   monthly org snapshots · dead-letter retries
External: Claude API (summaries/extraction/risk) · OpenAI (embeddings) · Sentry
```

**The Twelve Architecture Laws** (CI should grow checks for each):
1. Every state change writes `audit_events` in the same transaction.
2. Every table has RLS. A CI `rls:check` must block unprotected tables.
3. Agents write ONLY to proposals tables — never operational data.
4. At most one active session per user (enforced by partial unique index `idx_sessions_singleton`).
5. Money is INTEGER micro-units ($1 = 1,000,000). Floats only in API serializers.
6. Capacity mutations are atomic deltas (`allocated_hours + $delta`), never overwrites.
7. No secrets in client bundles or browser storage. `NEXT_PUBLIC_` prefix is a publication decision.
8. Status fields follow the state machines (§9). Server validates every transition.
9. Queue consumers are idempotent; `event_id` deduplicates.
10. Every AI feature has a non-AI fallback (health probe reports `deterministic_fallback`).
11. Soft deletes via `deleted_at TIMESTAMPTZ`; partial unique indexes; RLS excludes deleted.
12. AI recommendations validate against hard constraints before display AND at decision time (`validateProposal` — already enforced in `store.reviewProposal`).

## 6. Auth & Security Architecture

**Implemented now (demo identity, production session mechanics):**
- `POST /api/auth/login`: validates input, rate-limits 10/IP/15min (in-memory —
  production must move to Redis/Postgres because serverless instances don't
  share memory), sets `dz_session` httpOnly SameSite=Strict cookie (7d).
- `src/middleware.ts`: every non-public route requires the cookie or 307s to
  `/login?from=…`; every response gets CSP (`'unsafe-eval'` is dev-only for
  Fast Refresh — **never add it to production CSP**), X-Frame-Options DENY,
  nosniff, Referrer-Policy, Permissions-Policy.
- `POST /api/auth/logout` revokes the cookie; sidebar sign-out calls it.
- Client: `AuthGate` (UX-level), `useSession.can()` RBAC checks shaping nav
  and manager-private data (burnout, flight risk, financials).

**RBAC matrix** (in `session.ts`, pinned by `session.test.ts`, shipped to RLS
in the migration): admin = everything; executive = read-everything strategic,
**cannot reallocate** (read-only by design); dept_head = full in-dept;
project_manager = capacity + reallocate + proposals + burnout, **no financial
dashboards, no audit**; team_lead = own-team reads; employee = own work only;
client = sandboxed portal only (no portal screen yet — V0.5).

**Production swap (T2, §14):** login route calls Supabase Auth, writes the
`sessions` row (singleton index enforces law 4), issues 15-min JWT held in
module memory + the cookie becomes the opaque refresh reference; middleware
adds introspection. Component boundaries do not change.

**Threat notes for whoever continues:** password reset must always return 200
(no enumeration); user text is data, never AI instructions; client-portal
tokens need short life + scoped RLS + read-anomaly alerting; the persona
switcher must become admin-only impersonation once identity is real.

## 7. Database Architecture

The schema is **written and executable**: `supabase/migrations/0001_core_schema.sql`.
32 tables in dependency order; highlights a contributor must not break:

- `capacity_logs` UNIQUE (user_id, week_start) — mutate only via the
  `reallocate_task(p_task_id, p_to_user_id, p_override_reason)` RPC at the
  bottom of the migration: advisory lock per task, hard-stop exception
  `CAPACITY_EXCEEDED` (errcode P0003) when projected ≥100% without a reason,
  atomic ± deltas, audit row in-transaction. The client 409/422 handling in
  `store.ts` maps onto these errors.
- `audit_events`: `REVOKE UPDATE, DELETE FROM authenticated` — physically
  immutable. Generic `write_audit_event()` trigger attached to projects,
  tasks, risks, decisions; attach to every new operational table.
- `compute_risk_severity()` trigger mirrors `src/lib/risk.ts` cell-for-cell.
  Tests pin the TS side; if you change one, change both and cite the spec.
- `entity_relationships`: the closed registry CHECK constraint lists the same
  31 types as the TS union in `graph.ts`. Extending = migration in BOTH.
- RLS enabled on all 32 tables; representative policies included
  (`auth_role()` / `auth_dept()` helpers read JWT app_metadata). Tighten
  per-table as features land — never ship a new table without a policy.
- CRDT prep columns (`version_vector`, `tombstone`, `event_sequence`,
  `last_synced_at`) exist on tasks/projects from day one; populate, don't act,
  until the offline phase.
- Retention: soft-deleted rows are hard-deleted by a 30-day worker batch job
  (to build with the worker, T4). Backups: enable Supabase PITR; RPO <1h /
  RTO <4h targets.
- **Multi-tenancy (V0.5):** add `org_id uuid not null` to every table +
  composite indexes + an `org_id = auth_org()` term in every policy. Do it as
  one migration before any second customer touches the system.

## 8. Realtime Architecture

`src/lib/realtime.ts` is the **only** transport-aware file:
`createChannel<T>(name)` (publish/subscribe/close) and
`startPresence(name, onPeerCount)`. Today both run on BroadcastChannel —
working cross-tab sync (mutations in `store.ts` publish state slices;
receivers apply without re-publishing, so no echo loops) and a live presence
badge in the topbar.

Production swap: `createChannel` returns a Supabase channel scoped
per-department (`capacity:dept:{id}`) — **never global broadcasts** (WAL storm
at scale; this was an explicit architecture decision, see ADR-2). Receivers
then patch only affected rows instead of slices. Degradation path: on
WebSocket failure fall back to 30s polling with a visible "Live sync paused"
banner.

## 9. State Machines & Intelligence Formulas (product law — exact)

```
Project:    PLANNING → ACTIVE → AT_RISK → CRITICAL → COMPLETED
                     ↘ ON_HOLD ↔ ACTIVE      ↘ CANCELLED (terminal)
            PLANNING → COMPLETED is INVALID (must pass ACTIVE)
Task:       BACKLOG → TO_DO → IN_PROGRESS → REVIEW → CLIENT_REVIEW → COMPLETED
            BLOCKED ↔ any active state · CANCELLED terminal from anywhere
Risk:       OPEN → MITIGATING → MONITORING → CLOSED · OPEN → ACCEPTED → MONITORING
            any → ESCALATED (notifies executives)
Decision:   DRAFT → PROPOSED → APPROVED → ACTIVE → SUPERSEDED
            PROPOSED → REJECTED → DRAFT · ACTIVE → REVERSED (links corrective)
Commitment: OPEN → IN_PROGRESS → FULFILLED · auto-OVERDUE on breach
            OVERDUE → FULFILLED | WITHDRAWN (reason required)
Proposal:   pending → approved | rejected | expired(48h or failed re-validation)
```

- **Utilization** = Σ(estimated hours due in week) ÷ weekly capacity.
  **<80% green · 80–99% yellow · ≥100% red (inclusive)** — `utils.test.ts`.
- **Burnout** (any trigger, manager-private, never shown to the person):
  3 weeks >50h · 90d no PTO · 7d at ≥100% · reassignment rate >0.3/30d.
- **Severity matrix** (`risk.ts` + DB trigger): low×low=Low … high×critical=Critical
  — full table pinned in `risk.test.ts`.
- **Strategy Drift** = 100 − goal-linked-hours%; bands 10/20/35/50.
- **OHI** = fairness 20 + manager 25 + stability 15 + psych-safety 20 +
  recognition 10 + meetings 10; target >75.
- **CLI** (≠ burnout): projects, switches, meeting ratio, queue depth, unread,
  commitments; 0–30 healthy … 71–100 critical.
- **WQS** = 1 − (rework .35 + rejection .25 + defect .20 + reopen .20).
- **EPS** = commitment 30 + estimation 25 + deadline 25 + scope 20.
- **Kill Score** = ROI 30 + velocity 20 + alignment 20 + team-health 15 + opportunity 15.
- **Agent priority** (deterministic conflict resolution): burnout_safety 100 ›
  hard_constraint 90 › legal_compliance 85 › delivery_critical 70 ›
  allocation_optimize 50 › risk_advisory 40.
- **Staffing rank** (`ai.rankCandidates`): skillMatch×0.45 + availability×0.55 —
  shared by the TaskDrawer and the future Allocation Agent.
- **Context compression** (`ai.compressProjectContext`): 7 floats + 1 bool,
  ~<150 tokens — raw entity dumps NEVER reach a model.
- **Explanation assembly** (`ai.buildExplanation`): stored signals only,
  confidence <0.65 suppressed, descending, max 5, `"… (92%) · … (78%)"` format;
  zero signals → literally `"Insufficient data"` — never guess.
- **Notification classes & debounce:** hard_stop (immediate, bypasses muting) ·
  critical_action (work hours) · manager_review (1/entity/4h) · intelligence
  (morning brief ONLY) · informational (inbox only). Debounce: burnout 24h ·
  capacity 4h · health 8h · drift weekly · proposals 3/2h.

## 10. Graph Architecture

`src/lib/graph.ts` is the generic relationship layer (mirrors
`entity_relationships`): 17 entity types × 31-type closed edge registry, edges
carry strength/confidence/evidence. Utilities (all tested in
`graph.test.ts`): `edgesFrom/edgesTo` (1-hop, the only layer dashboards use),
`reachable` (bounded BFS ≤4 hops = in-memory `entity_paths`),
`wouldCreateCycle` (DFS returning a **closed** path `[A,B,C,A]` for the 422
response), `expertiseConcentration` (bus factor). The `/graph` screen derives
its nodes/edges from this registry and displays the live "what breaks if
Sarah leaves" blast radius — it is a consumer, not a source.

**Rules:** never link entities with loose ID arrays — add a typed edge. Never
invent edge types — extend the union AND the SQL CHECK in the same change.
5+ hop analytics (ONA, digital twin) belong on a graph-DB read replica
(Phase 4), never on live recursive CTEs.

## 11. Decision Register / ADRs

| # | Decision | Why | Revisit when |
|---|---|---|---|
| ADR-1 | In-memory domain layer shaped as production twin | Ship the wedge UX before infra; substitution > rewrite | Never — this worked |
| ADR-2 | Dept-scoped realtime channels, no global broadcasts | Bounded fan-out, RLS-aligned | Only with load evidence |
| ADR-3 | Agents → proposals only; coordinator merges conflicts pre-human | Trust; one card not two contradictions | Never |
| ADR-4 | CSS-variable tokens; signal colors theme-invariant | Status must read identically in both themes | Never |
| ADR-5 | HTML5 DnD + drawer keyboard fallback (not Pragmatic DnD yet) | Zero deps; a11y path exists | When touch support is demanded |
| ADR-6 | BroadcastChannel as first realtime transport | Real working sync without infra; one swap point | At T1 (Supabase) |
| ADR-7 | Demo persona auth with production session mechanics (httpOnly + middleware) | Edge enforcement testable today | At T2 |
| ADR-8 | Severity/capacity laws duplicated TS + SQL, pinned by tests both sides | Each layer must self-protect | Never — keep in lockstep |
| ADR-9 | Schema-first CRDT prep, no merge logic | Event sourcing can't be retrofitted; columns are cheap | Phase 4 offline |
| ADR-10 | `'unsafe-eval'` in CSP gated to dev | Fast Refresh requires it; production stays strict | Never relax in prod |

## 12. Technical Debt Register

| ID | Debt | Sev | Repayment |
|---|---|---|---|
| TD-1 | Ops data resets on refresh (in-memory) | High | T1 |
| TD-2 | RBAC server-side only via future RLS; API routes don't check roles yet | High | T1/T2 |
| TD-3 | Login rate limit is per-instance memory | Med | Redis/Postgres counter at T2 |
| TD-4 | DnD lacks touch; keyboard path is the drawer | Med | Pragmatic DnD when prioritized |
| TD-5 | Graph node positions hand-placed (`NODE_META`) | Low | dagre/elk auto-layout |
| TD-6 | Palette search is client substring | Med | `/ai/search` at T4 |
| TD-7 | No E2E tests (unit-only) | Med | Playwright: login→drag→override→audit; proposal approve |
| TD-8 | Executive OHI/drift series are static arrays | Med | Derive when warehoused |
| TD-9 | Realtime sync ships whole slices | Low | Row-level patches at T1 |
| TD-10 | Demo cookie value is the personaId (unsigned) | High-if-misread | It's demo identity by design; T2 replaces it — do NOT ship as-is |

## 13. Project Risk Register

| Risk | L | I | Mitigation |
|---|---|---|---|
| Weaker model "fixes" a law to pass a test | High | High | Tests are law; CONTRIBUTING rule 1; cite spec to change thresholds |
| Backend drifts from TS contract | Med | High | Generate DB types at T1, diff against `types.ts` in CI |
| Approval bypasses guardrail | Low | High | Decision-time re-validation already enforced + adversarial test |
| AI cost runaway | Med | Med | Compression ≤1k tokens, $3–15/org/day, 80% warn / 100% throttle |
| Scope creep into HRMS/CRM/payroll/ATS/LMS | Med | Med | Permanently out of scope — refuse |
| WAL storms from global realtime | Med | High | ADR-2; dept scoping only |

---

# PART III — EXECUTION

## 14. The Four Unblock Tasks (full decomposition)

### T1 — Live persistence (Supabase substitution)
- **Purpose:** survive refresh; unblock everything else. **Priority P0 · Complexity L · Risk Med.**
- **Dependencies:** Supabase project; env vars per `.env.example`.
- **Steps:**
  1. `supabase db push` the existing migration; verify all 32 tables + RPC.
  2. Seed: write `scripts/seed.ts` translating `lib/data.ts` to inserts (keep IDs).
  3. `npx supabase gen types typescript` → reconcile with `types.ts` (DB wins).
  4. Add `src/lib/db/client.ts` (browser anon client; service client server-only).
  5. Introduce TanStack Query hooks per entity; **fall back to seed when
     `isDemoMode`** so demo mode survives forever.
  6. Point `store.confirmReallocate` at the `reallocate_task` RPC; keep the
     optimistic shape; map P0003→override modal, serialization conflicts→
     rollback + "Task was modified — refreshing".
  7. Swap `realtime.createChannel` to Supabase channels (dept-scoped).
- **Acceptance:** all 40 tests pass (store tests become integration against a
  test DB); reallocation round-trip <800ms; audit row provably transactional
  (kill the trigger in a test branch → mutation must fail); demo mode still
  boots with zero env.
- **Validation:** two browsers (not tabs) see each other's drags. **Rollback:**
  `isDemoMode` flag flips the app back to seed instantly; keep it.

### T2 — Verified identity
- **Purpose:** real credentials; enterprise conversations. **P0 · M · Med.** Depends: T1.
- **Steps:** enable Supabase Auth (email+password, Google) → on login API
  route: `signInWithPassword` via Admin SDK → invalidate prior session rows
  (singleton index makes races safe) → write session row → issue 15-min JWT
  (module memory) + httpOnly refresh cookie → middleware introspects →
  `silentRefresh()` on boot → password reset (always-200) → email verification
  → MFA/TOTP for admin+exec → persona switcher becomes admin-only "view as".
- **Acceptance:** second login revokes first (exactly one `is_active` per
  user); refresh survives hard reload; reset invalidates all sessions; 429 on
  11th attempt. **Rollback:** demo cookie path retained behind
  `isDemoMode`.

### T3 — Negotiation coordinator + first agents (Railway worker)
- **Purpose:** the differentiating AI feature; UI + data shapes are final, this builds the producer. **P1 · L · Med-High.** Depends: T1.
- **Steps:** Railway Node service → Burnout + Allocation agents read
  **compressed contexts** (`ai.compressProjectContext`) → write
  `agent_proposals_staging` with `conflict_scope` → coordinator (60s): cluster
  by scope overlap → resolve by the priority hierarchy → compromise generator
  (split delta within burnout cap / `rankCandidates` alternative / consume
  schedule float) → promote exactly ONE card to `proposals` with
  `validation_result` → review writes `agent_memory` (rejections: 30-day
  suppression) → expiry at 48h.
- **Acceptance:** the Sarah scenario (delivery wants +10h, burnout caps her)
  yields one compromise card, never two; rejected proposals stay suppressed
  30 days; every promoted card passes `validateProposal` server-side.
- **Security:** worker uses a dedicated service role that can write ONLY
  staging/proposals/memory (law 3). **Rollback:** stop the worker; inbox
  empties via expiry; no operational data touched by design.

### T4 — Intelligence pipelines
- **Purpose:** live causal signals, search, briefs. **P1 · L · Med.** Depends: T1, T3 infra.
- **Steps:** DB triggers populate `causal_signals` on health degradation →
  `Explain` reads stored rows (UI contract unchanged) → embedding worker
  (content-hash dedup → OpenAI → upsert; failures → `dead_letter_jobs`;
  full-text remains the fallback) → `/ai/search` hybrid 0.7 vector + 0.3 BM25,
  RLS-scoped, labeled fallback mode → palette wiring → morning brief 7:45am
  per timezone (sole `intelligence` channel) → health engine auto-calculation
  → notification debounce table.
- **Acceptance:** search p95 <3s; killing the AI key degrades to labeled
  full-text with zero feature loss; brief renders with per-claim entity links.

## 15. Version Sequence & Time Horizons

- **V0.2 (now → 30d, no credentials):** Playwright smoke (TD-7) · saved
  filters in URL params · touch DnD decision · `rls:check` CI script skeleton ·
  remaining empty states. *Everything else is already done.*
- **V0.3 (30–90d):** T1 + T2. Exit: real org data, verified identity, two-browser realtime.
- **V0.4 (90–180d):** T3 + T4 + client portal + financial dashboards (micro-unit purity end-to-end).
- **V0.5 (180d+):** multi-tenancy migration · SSO/SAML + SCIM · SOC 2 evidence
  automation · scenario engine (schemas exist in migration) · Customer/Service/
  Revenue CRUD screens · org chart · knowledge hub · meetings · import connectors.
- **Phase 4 (vision):** event sourcing onto the prep columns · per-field CRDT
  offline (LWW scalars · PN-Counter hours · OR-Set tags · RGA ordering) ·
  graph-DB replica for 5+ hops · ONA · digital twin · public API + webhooks.

**Dependency spine:** T1 → T2 → (T3 ∥ T4) → portal/financials → multi-tenancy → enterprise identity.
**Priority tie-break:** anything protecting the wedge (capacity correctness) outranks anything else.

## 16. Immediate Next Actions

1. `cd dizruptos && npm run lint && npm run typecheck && npm test && npm run build` — confirm the green baseline before touching anything.
2. Read `src/lib/` top to bottom in the order listed in §4 (~1 hour, everything else follows).
3. If you have credentials: start T1 step 1. If not: V0.2 items, starting with Playwright smoke tests.
4. Update §3, §12, and §15 of this document with every meaningful merge — it is the source of truth, not chat history.

## 17. Working Agreements (binding on all contributors, human or model)

1. The tests encode product law — a failing test means your change is wrong until you can cite spec.
2. No naked scores: every new metric gets `Explain` with real signals.
3. No raw neutral hex: tokens only; both themes verified before merge.
4. Entity links are typed graph edges, never ID arrays.
5. Every mutation writes audit, in the same change.
6. Agent-sourced actions pass `validateProposal` at decision time, always.
7. Secrets never get a `NEXT_PUBLIC_` prefix; client bundles are public.
8. Demo mode must keep working forever — it is the sales demo and the dev loop.
9. When this manual and convenience disagree, the manual wins; change the manual deliberately, in the same PR, with reasoning.

---

*Titan sprint, June 2026. lint 0 · types 0 · tests 40/40 · build 18 routes ·
auth, RBAC, realtime, theming, and graph flows browser-verified. The only
things standing between this repository and production are four credentials
and the step lists in §14.*

---

## ADDENDUM — Platform Realization (June 2026)

The operating manual now includes a real backend architecture. Read
BACKEND_PLATFORM_REVIEW.md for the full record; the operational facts:

- Data access goes through `src/server/repositories/` (factory: `getRepositories()`),
  selected by env: demo = in-memory seed, production = Supabase PostgREST.
- Business laws live in `src/server/services/allocation.ts` (pure, tested).
- Server-side RBAC: `src/server/services/authz.ts` — every `/api/v1/*` route
  resolves the principal from the `dz_session` cookie and enforces the
  permission matrix (`src/lib/personas.ts`, shared with the client).
- API v1 surface (shared plumbing `src/server/api.ts` — one envelope, one
  error map: 401/403/404/409/422/503):
  - `GET /api/v1/proposals` (role-scoped) · `PATCH /api/v1/proposals/:id`
    (verdicts; the visibility predicate IS the authorization; invisible →
    404, existence not leaked; non-pending → 409; audited)
  - `GET /api/v1/capacity?week=` (gated, validated)
  - `POST /api/v1/tasks/:id/reassign` (gated on `reallocate`; server-side
    ≥100% guardrail → 409 OVERRIDE_REQUIRED without a typed reason; atomic;
    audited as REALLOCATE / REALLOCATE_OVERRIDE)
  - `GET /api/v1/employees` + `/:id` (cost redacted without `view_financials`)
  - `GET /api/v1/risks` · `GET /api/v1/audit?limit=` (gated on `view_audit`)
  Typed envelopes carry `apiVersion` + live `backend`.
- Rate limits: 120 req/min/IP on /api/v1 (edge), 10/15min on login.
- Launch: `cd dizruptos && npx next dev -p 5175` (demo, no env). Production:
  NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (+ server-only
  SUPABASE_SERVICE_ROLE_KEY); half-config fails at boot by design.
- Verification gate: typecheck + lint + 75 vitest + next build (19 routes),
  all clean.
- Never run `next build` while `next dev` is running (shared .next).

---

## ADDENDUM 2 — koki-kiko frontend + readability v4 (June 12, 2026)

- `/welcome` and `/login` rebuilt in the c2mtl.koki-kiko.com poster language:
  `src/components/fx/chroma-field.tsx` (Three.js fullscreen shader — the
  brand palette as drifting stage-gel discs, cursor parallax, pauses when
  off-screen or tab-hidden, freezes time under prefers-reduced-motion),
  hard ink/volt plates carrying viewport-scale type, fixed right rail with
  vertical section links + the green ENTER block.
- **Engine law (learned the hard way):** GSAP owns scroll scrubs only —
  `fromTo` + ScrollTrigger self-heals from scroll position. framer-motion
  owns one-shot entrances: `gsap.from` intro timelines die under React 18
  StrictMode double-mount in dev and freeze elements at their from-state.
  Corollary: never put `whileInView` on an element that translates fully
  outside its own `overflow-hidden` parent (clipped → IntersectionObserver
  never fires); observe the wrapper, animate the child via variants.
- ProductFrame (landing preview) is now operable: sidebar view switching,
  heatmap hover readouts, acceptable agent proposals, breathing KPIs.
- Readability v4: tailwind fontSize tokens 14/15/16/17 (+ enlarged lg–4xl);
  topbar 76px with text-2xl title; sidebar 256px (shell layout padding
  matches); graph nodes w-72 with fitView minZoom 0.7 on a 640px canvas;
  recharts ticks 12/13; risk-matrix markers h-8.
- New deps: gsap, @gsap/react, @tanstack/react-query (query layer reserved
  for the store→server read migration).

---

## June 13 — Live backend + Option A + Change-Authority workflow

**Live Supabase (session pooler).** Migrations `0001_core_schema.sql` (32 tables,
RLS, audit triggers, `reallocate_task` RPC, pgvector) + `0002_grants_and_rls_fixes.sql`
applied live; `supabase/seed.sql` seeded (12-edge org graph). RLS validated 10/10
(dept/user/anon isolation; admin unrestricted). Live read proven via
`GET /api/v1/projects`. Full evidence: `BACKEND_READINESS_AUDIT.md`.

**Canonical model = the database schema (Option A).** No parallel domain model /
mapper-only fields. App layer uses thin camelCase views. TanStack Query foundation:
`lib/query.ts` (`qk` key factory, `apiGet`, `invalidateDomain`), `components/providers.tsx`
mounted app-wide, `lib/hooks/use-projects.ts` (`LiveProject` = `projects` table 1:1)
as the reference vertical. Migration is sequenced entity-by-entity (see PLAN.md),
app green throughout.

**Graduated change authority + approval workflow** (`lib/rbac.ts`,
`server/services/change-authority.ts`; 19 tests across rbac-authority + change-authority):
- `authorizeChange(req)` → `direct | requires_approval | denied` + `approverRole` + `notifyRoles`.
- `submitChange()` applies small changes directly (notifying higher order), **stages**
  bigger ones for a senior role, denies computed-field writes.
- `decideChange()` lets a senior role (or admin — unrestricted via `canApprove`)
  **accept/decline**; accept applies, decline records a reason; requester + oversight
  notified; every step audited. Side-effects are injected (memory now, Supabase next).
- Thresholds: reassign direct <100% / approval ≥100%; budget direct <10% / executive
  ≥10%; role-grant & headcount → admin only; `project_health` denied (computed).

**Verification:** `tsc` clean, **94/94 vitest**, app `mode=production` healthy at
http://localhost:5175 (`/login`,`/welcome` 200; `/`→login when unauth).

**Next (sequenced):** replicate `use<Entity>()` across people/risks/capacity/decisions/
knowledge + mutation/optimistic/invalidation; wire the approval queue to a senior-role
**Approvals** surface + `proposals` table; then Organizational Intelligence surfaces
(expertise/bus-factor → impact/blast-radius → decision lineage → risk propagation →
scenario simulation) on the live graph.

### June 13 (cont.) — Approvals as first-class governance objects + CTO review

- **Migration 0003 applied live** — `approvals` table (17 cols): requester/approver,
  authority_tier, escalation_path, rationale, evidence, affected_entities, status,
  decided_by/at, decline_reason, timestamps. Indexed for queue + lineage; RLS +
  grants. The substrate for decision lineage / governance intelligence / org memory.
- **`ApprovalRepository`** wired across contract + memory + Supabase (snake↔camel
  mapper, schema-authoritative). `change-authority` effects can now persist through it.
- **Verified live**: PostgREST insert `201`; dept_head pending-queue query returns the
  staged approval with escalation_path; cleanup OK. `tsc` clean, **94/94 tests**.
- **`CTO_REVIEW.md`** added — brutally honest audit (two-model drift, int4 money bug,
  no org/tenant, demo auth, seeded-not-computed intelligence; missing entities:
  Organization, Capability, Team; missing systems: identity, capability, computation
  engine, simulation, org-memory). Roadmap prioritizes the computation engine + auth
  + org_id + Capability as the real moat.
- Deferred (logged in ENTERPRISE_IMPROVEMENTS.md): Google/Microsoft OAuth, full
  Linear-grade dashboard redesign (blocked on inspiration assets — folder not in repo),
  role-specific feature set.

### June 13 (cont.) — Org/Team/Capability ontology + Computation Engine

- **Migration 0004 applied live** (DB now 40 tables): `organizations`, `teams`,
  `team_members`, **`capabilities`** (first-class, strategic_importance), rated
  **`employee_capabilities`** (proficiency 1–5), **`project_capabilities`**.
  `departments.org_id` added (multi-tenancy foundation). RLS + grants on all.
- **Seeded** (`supabase/seed_capabilities.sql`): 1 org, 1 team, 5 capabilities,
  9 person↔capability edges shaped to produce real signals (Finance/Vendor =
  bus factor 1; Frontend = 3 healthy).
- **Computation Engine** (`src/server/engine/capability-intelligence.ts`, 6 tests):
  PURE functions — `busFactor`, `concentration` (HHI + top-holder share),
  `successionRisk`, `analyzeCapability`, `rankByRisk`, `capabilityHealth`.
  Intelligence is now COMPUTED, not stored.
- **Verified on live data**: SQL bus-factor cross-check matches the engine
  (Finance/Vendor fragile bf=1; Payments bf=2; Frontend bf=3). `tsc` clean, **100/100 tests**.
- Next: capability/employee repositories + `/api/v1/capabilities/intelligence` route →
  People vertical live migration → **Capability Intelligence surface** (the questions:
  which capabilities are fragile / unbacked / concentrated / strategic / at-risk).

### June 13 (cont.) — Decision Intelligence + Org Memory engines + #13 closed

- **Migration 0005**: `outcomes` + `learnings` first-class entities (live, seeded:
  the ledger-first decision now has a partial outcome + a learning). DB at 42 tables.
- **`decision-intelligence.ts`** (engine): importance, confidence (grounded by
  outcomes), blast radius, influence, evidence quality, stakeholder coverage, risk —
  shared contract (score + evidence + explanation).
- **`org-memory.ts`** (engine): `decisionMemory()` composes why / who / evidence /
  what-happened / learned / would-we-repeat + decision→outcome→learning lineage;
  `governanceSignals()` (approval concentration). Registered as `decision` + `orgMemory`
  engine modules.
- **Repository task #13 CLOSED**: `employees→users` and `capacity→capacity_logs`
  live mappers (snake→camel; demo-only fields default per Option A). **Verified live**:
  `/api/v1/employees` → 5 users, `/api/v1/capacity` → 3 cells. With projects/capabilities/
  employeeCapabilities/relationships/approvals, the repository layer now reads live.
- 8 new engine tests. Pending (honest): decision-memory live API route + repos
  (decisions/outcomes/learnings) and the dependency/risk/org-health engines.

Verification: `tsc` clean, **117/117 tests**, app `mode=production` at http://localhost:5175.

### June 13 (cont.) — Decision memory live end-to-end

- `DecisionRepository`/`OutcomeRepository`/`LearningRepository` added (contract +
  memory + Supabase with snake→camel mappers).
- `server/services/decision-loader.ts` assembles each decision with its
  approvals/outcomes/learnings/graph links → `decision` + `orgMemory` engines.
- `GET /api/v1/decisions/memory` — **verified live**: ledger-first decision returns
  confidence 0.73 / risk low / evidenceQuality 0.80, rationale (why), outcome
  (partial), learning, repeat="yes_with_changes", and the Decision→Outcome→Learning
  lineage. Governance concentration computed from the approval stream.
- DIZRUPT now answers: why decided / what happened / what learned / would we repeat.
- `tsc` clean, 117/117 tests, app mode=production at http://localhost:5175.

**Still open (honest):** dependency/risk/org-health engine modules (Phases 7–9),
DECISION_INTELLIGENCE.md / ORGANIZATIONAL_MEMORY.md / ARCHITECTURE_REVIEW_V2.md docs,
deeper hardening (int4→bigint money, constraint/cascade audit, security pen-tests),
and the in-app Decision/Memory surface UI.

### June 13 (cont.) — Dependency/Risk/Org-Health engines + DB hardening + docs

- **Engines added** (pure, shared contract, registered in the barrel):
  - `dependency-intelligence.ts` — transitive blast radius (BFS), criticality, concentration.
  - `risk-intelligence.ts` — dependency-adjusted risk (severity × blast-radius amplification), ranking.
  - `org-health.ts` — weighted rollup of capability fragility / succession / dependency
    concentration / workload / governance / decision grounding → 0–100 score + band + top concerns.
  - 7 tests (`graph-intelligence.test.ts`). Engine now: capability · people · decision ·
    orgMemory · dependency · risk · orgHealth.
- **DB hardening (migration 0006, live)**: all money columns int4 → **bigint** (fixes the
  CTO_REVIEW overflow bug; verified via information_schema).
- **Docs**: `DECISION_INTELLIGENCE.md`, `ORGANIZATIONAL_MEMORY.md`, `ARCHITECTURE_REVIEW_V2.md`.
- Verification: `tsc` clean, **124/124 tests**, app mode=production at http://localhost:5175.

**Still open (honest):** live API routes/surfaces for dependency/risk/org-health (engines are
pure + tested, not yet exposed); real auth + org_id; full constraint/cascade audit + security
pen-tests; memory-mode demo repos degraded vs live.

### June 13 (cont.) — Multi-tenancy + tenant isolation + secured intelligence routes

- **Migration 0007**: `org_id` on users/projects/tasks/risks/decisions/outcomes/learnings/
  approvals (+ capabilities/teams), backfilled; `auth_org()` (SECURITY DEFINER);
  **RESTRICTIVE** tenant RLS on 10 tables (AND-ed with role policies — admin cannot cross orgs).
- **Tenant-escape tested live**: 2nd org "Rival Corp"; Org A admin sees 0 Rival projects/users;
  Org B user sees only theirs. Isolation enforced at the DB.
- **Secured intelligence routes** (Phase 8): `/api/v1/org-health`, `/api/v1/intelligence/risk`,
  `/api/v1/intelligence/dependency` — guarded (401 unauth). Verified live: org-health 71/100
  "watch"; risk dependency-adjusted; dependency hubs ranked by blast radius.
- **Docs**: AUTH_ARCHITECTURE.md, TENANCY_ARCHITECTURE.md, SECURITY_REVIEW.md.
- `tsc` clean, **124/124 tests**, app mode=production at http://localhost:5175.

**Blocked (needs you):** Google/Microsoft OAuth requires provider client IDs/secrets +
redirect URLs configured in the Supabase dashboard — can't be set/verified from here. The
RLS/tenancy layer is built to receive role+org JWT claims the moment real auth issues them.

### June 13 (cont.) — Simulation engine + retrospectives + intelligence surfaces (API)

- **`simulation.ts`** engine: `simulateDeparture` (lost/weakened capabilities + fragility
  Δ + mitigation), `simulateStaffing` (backup-gap closure), `simulateNodeFailure` (blast
  radius). Pure; composes capability + dependency engines. Live route
  `GET /api/v1/simulation/departure?personId=` — verified: Noor's departure loses Finance
  & Vendor Negotiation; Ahmed's only weakens.
- **Decision retrospectives** (`retrospective()`): successScore, confidenceAccuracy,
  hindsight (validated/mixed/misjudged) — the platform grades its own judgment.
- **Intelligence surfaces exposed (API)**: org-health, dependency, risk, decision-memory,
  capability, people, departure-simulation — all secured + tenant-aware. Reasoning-first
  (evidence + explanation). See INTELLIGENCE_SURFACES.md.
- **Docs**: SIMULATION_ARCHITECTURE.md, ORGANIZATIONAL_MEMORY_COMPLETION.md, INTELLIGENCE_SURFACES.md.
- `tsc` clean, **131/131 tests**, app mode=production at http://localhost:5175.

**Still open (honest):** bespoke surface UIs for people/decision/risk/dependency/health/
simulation (data live; UI paused by request); staffing/project-slip live routes (engines
done+tested); real auth (OAuth blocked on provider config) to put real role+org JWT claims
behind the tenant isolation.

### June 13 (cont.) — Learning loop closed (outcome/learning/recommendation engines)

- **Engines** (pure, shared contract, in barrel): `outcome-intelligence` (success/variance/
  quality), `learning-intelligence` (reusable/repeated/capability lessons), `recommendations`
  (evidence-backed, traceable, ranked), plus `retrospective()` (confidence calibration +
  hindsight). Simulation expanded: staffing + node-failure routes.
- **Live routes** (secured): `/api/v1/recommendations`, `/api/v1/simulation/node-failure`,
  `/api/v1/simulation/staffing` (+ departure). Verified: 6 ranked recommendations
  (top: reduce Payments-API reliance / cross-train Finance); node-failure → 5 downstream.
- **Loop closed**: Decision → Outcome → Learning → Recommendation → Future Decision.
- **Docs**: RETROSPECTIVES.md, LEARNING_INTELLIGENCE.md, RECOMMENDATION_ENGINE.md.
- `tsc` clean, **137/137 tests**, app mode=production at http://localhost:5175.

**Still open:** Assumption + Evidence-source entities (Phase 4/5 — need decision-history
volume to be meaningful); bespoke surface UIs (data live; UI paused); real auth/OAuth
(blocked on provider config); dependency-hub label resolution (cosmetic).

### June 13 (cont.) — Final ascension: model split closed + CI + build verified
- **P0 repo↔schema model split CLOSED** (migration 0008): users gains title/location/
  pto_days/burnout_flag/burnout_signals/flight_risk/accent (backfilled); employees mapper
  no longer lossy — one domain model (Option A). Verified live.
- **CI/CD**: `.github/workflows/ci.yml` (typecheck·lint·test·build).
- **Production build VERIFIED** (`npm run build` green; all routes + middleware compile).
- `tsc` clean, **137/137 tests**, 8 migrations live.
- Docs: FINAL_PLATFORM_REVIEW.md, FINAL_GAP_ANALYSIS.md, FINAL_DEPLOYMENT_GUIDE.md,
  FINAL_OPERATIONS_GUIDE.md.
- **NOT done (honest):** real auth (multi-day; OAuth externally blocked), admin/exec/
  intelligence UIs (UI paused), realtime event loop, observability, a11y, data import,
  GraphRAG, active pen-test. See FINAL_GAP_ANALYSIS.md.

### June 13 (cont.) — Repository↔schema mappers COMPLETE (task #13 closed)
Found the real residual drift: tasks/projects/risks/audit/proposals repos returned raw
PostgREST snake_case cast as camelCase TS types (+ audit ordered by non-existent `at`).
Added snake→camel mappers for all of them (TaskRow/ProjectRow/RiskRow/AuditRow/ProposalRow
→ fromXRow). Fixed audit ordering `at`→`created_at`. With employees(0008)/capacity/
capabilities/employee_capabilities/relationships/approvals/decisions/outcomes/learnings,
**every Supabase repository read now maps to the camelCase domain model — one source of
truth (Option A), no parallel models, no remaining drift.**
- Verified against LIVE rows: projects→{health:CRITICAL, code:ATL}, risks→camelCase,
  audit→camelCase — no snake keys leak. `tsc` clean, 137/137 tests.
- Demo-only fields the schema doesn't carry (project code/velocityTrend/dates, task
  dependsOn) default in the mapper, documented; not a second truth.
- NOTE: page-level "live reads" (frontend consuming /api/v1 instead of the Zustand seed)
  is the separate, paused UI-consumption work — distinct from this repository-layer task.

### June 13 (cont.) — Executive Briefing workspace (Phase 1 of activation sprint)
- Built `/briefing` (Intelligence ▸ Exec Briefing, view_executive): live org-health (score +
  band + driver breakdown + top concerns) and ROI-ranked recommendations (rationale/evidence/
  impact/trace), reasoning-first, via `useOrgHealth`/`useRecommendations` (TanStack) →
  /api/v1/org-health + /api/v1/recommendations. Loading/error/empty states.
- Verified: `tsc` clean, production build compiles+prerenders `/briefing`, 137/137 tests.
- Docs: EXECUTIVE_INTELLIGENCE_REVIEW.md, PLATFORM_ACTIVATION_REPORT.md.
- NOT done (honest): realtime loop, notification center, **CSV import** (highest business
  ROI, buildable next), integrations, onboarding (auth-gated), observability, security-audit-v3,
  performance-review. Did NOT write docs for unbuilt systems (would be inflation).

### June 13 (cont.) — CSV data import (data activation, verified)
- `lib/import/csv.ts` — dependency-free parser + per-entity validate/transform (capabilities,
  employees, employee_capabilities); 6 unit tests.
- `server/services/import.ts` + `POST /api/v1/import` — upsert to live DB (PostgREST merge);
  `GET ?template=` downloads CSV templates. `/import` UI (sidebar ▸ Data).
- Migration **0009**: plain unique constraints (capabilities org_id+name, users email) so
  upsert on_conflict works — a real bug found during live verification (prior indexes were
  expression/partial). Applied live.
- **Verified live end-to-end**: CSV → upsert → capabilities 5→6 (201) → cleanup; tsc clean,
  production build compiles /import + /api/v1/import, **143/143 tests**.
- Doc: DATA_IMPORT_ARCHITECTURE.md.
- NOT done: mapping workspace, preview/dry-run, conflict-resolution UI, import history,
  remaining entities, integrations, onboarding (auth-gated). Did not write docs for unbuilt
  systems (no inflation).

### June 14 — Calibration + Executive Copilot (learning-system foundations)
- `calibration.ts`: scorePrediction + calibrationReport (accuracy, calibration gap,
  per-kind, trend) — "are we getting smarter?". Tested.
- `copilot.ts` + `GET /api/v1/copilot?q=`: deterministic graph-grounded advisor; intent →
  engine output → answer + evidence + source. **Verified LIVE** (prod build on :5188):
  "what should I do" → recommendations; "most fragile" → capability-intel; "what if Noor
  leaves" → simulation; "who is irreplaceable" → people-intel. No LLM, no hallucination.
- Engine barrel now: capability·people·decision·orgMemory·dependency·risk·orgHealth·
  simulation·outcome·learning·recommendations·calibration·copilot.
- Verified: tsc clean, **153/153 tests**, production build compiles /api/v1/copilot.
- Doc: INTELLIGENCE_VALIDATION.md.
- NOT done (honest): prediction write-back loop + `predictions` table (needs recommendation-
  action UI); GraphRAG semantic retrieval (needs embeddings API key — external); executive
  narratives (Phase 8); Assumption/Hypothesis/Observation entities (Phase 4). Self-improving
  requires real longitudinal customer usage, not more code. Cosmetic: dependency-hub labels
  show UUIDs in copilot/recommendation output (label-resolution lookup pending).
