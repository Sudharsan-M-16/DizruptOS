# DIZRUPT — MASTER EXECUTION PLAN
### The complete continuation manual for the platform

> **Audience:** any future contributor — junior engineers, contractors, small AI
> models, open-source agents. This document assumes you have **never read the
> PRD** and know nothing about the project. Everything needed to continue is
> here or in the repository.
>
> **Repo root:** `C:\Users\sudha\DizruptOS` (git-initialized, first commit `d6c94f8`)
> **App:** `dizruptos/` — Next.js 14 App Router, TypeScript, Tailwind
> **Source docs (versioned in repo):** `DIZRUPT_Supreme_PRD_v3.md`, `dizruptos-ui-inspiration.md`
> **Status date:** June 2026

---

## 1. Executive Summary

**What DIZRUPT is.** A *Resource Intelligence Platform* — the system of record
for human capacity and organizational execution. It sits between project
management (Jira's territory) and HR (Workday's territory). The purchase wedge:
a Resource Manager at a 50–500 person company wastes 3+ hours every Monday
reconciling spreadsheets, Jira, and Slack to answer "who can take more work?"
DIZRUPT collapses that into one screen: a live capacity heatmap where they drag
an overloaded task to an available person and the system confirms in under a
second.

**Three product laws that govern every decision:**
1. **Never show a score without showing why** — every metric, health badge, and
   flag carries its causal signals (rendered via the `Explain` component).
2. **Two-Click Rule** — staffing, escalation, and review actions complete in ≤2
   interactions from any view.
3. **Agents propose, humans decide** — AI writes only to a proposals inbox,
   never to operational data; rejections are remembered for 30 days.

**What exists today.** A production-quality frontend implementing all 16 core
surfaces with a typed in-memory domain layer that mirrors the production
Postgres schema. Light/dark/system theming, role-based dynamic views, keyboard-
first navigation, optimistic drag-and-drop with hard-stop guardrails, an agent
negotiation inbox, a graph-native relationship layer with traversal utilities,
22 passing unit tests pinning the product laws, structured logging, error
boundaries, and a health endpoint. **No real backend yet** — that is the next
frontier (Section 12).

**The single most important fact for continuation:** the in-memory layer
(`src/lib/data.ts` + `src/lib/store.ts`) is intentionally shaped like the
production system. Replacing it with Supabase is a *substitution*, not a
rewrite. Do not restructure the UI to add the backend.

---

## 2. Current State Assessment

| Area | State | Grade |
|---|---|---|
| Frontend surfaces | 16 routes, all PRD P0/P1 screens, visually verified both themes | A |
| Design system | Token-driven (CSS variables), dual theme, motion language, a11y baseline | A− |
| Domain modeling | Typed entities mirroring PRD schema; graph relationship layer with registry | B+ |
| State management | Zustand ops store (optimistic mutations, audit, guardrails) + session store | A− |
| Auth | Demo persona auth + RBAC permission matrix + route gate. No real identity | C |
| Backend | None. All data in-memory | D |
| Database | Schema fully specified in PRD §12 + §21–22; not provisioned | D |
| Realtime | Patterns designed (optimistic + rollback shape in store); no transport | D |
| AI | Proposal/negotiation/causal-signal data structures real; no model calls | C− |
| Testing | 22 unit tests on product laws (capacity, severity, guardrail, cycle detection, agent review) | B− |
| Observability | Structured logger, error boundaries, `/api/health` | C+ |
| Security | RBAC view gating client-side only; no server enforcement | D+ |
| CI/CD | None | F |

**Verification status:** `npm run build` clean (16 routes), `npm test` 22/22,
zero browser console errors, both themes screenshot-verified.

---

## 3. Architecture Overview

### 3.1 Today (implemented)

```
┌────────────────────────────────────────────────────────────┐
│ Next.js 14 App Router (dizruptos/)                         │
│                                                            │
│  src/app/(shell)/*        16 routes inside chrome shell    │
│  src/app/login            persona auth                     │
│  src/app/api/health       liveness probe                   │
│                                                            │
│  src/components/shell/*   sidebar·topbar·palette·drawer·   │
│                           guardrail modal·shortcuts·gate   │
│  src/components/ui/*      primitives (pills, bars, tiles,  │
│                           Explain popover, avatars, spark) │
│                                                            │
│  src/lib/                 THE DOMAIN LAYER                 │
│    types.ts    entity model (mirrors PRD schema)           │
│    data.ts     seed organization (18 people, 6 projects,   │
│                35 tasks, capacity grid, risks, decisions,  │
│                proposals, goals, commitments, audit)       │
│    store.ts    ops mutations: reallocation, guardrail,     │
│                kanban moves, proposal review, audit        │
│    session.ts  viewer identity, RBAC matrix, theme         │
│    graph.ts    relationship registry + traversal           │
│    risk.ts     severity law (single source of truth)       │
│    utils.ts    formatting + capacity color law             │
│    logger.ts   structured logging chokepoint               │
└────────────────────────────────────────────────────────────┘
```

### 3.2 Target (PRD §10 — build toward this, do not deviate)

```
Vercel (Next.js frontend + short-lived API routes: auth, CRUD, search, capacity RPCs)
   │ HTTPS/WebSocket
Supabase Cloud (Postgres 15 + RLS + Auth + Realtime + Vault + pgvector)
   │ shared DB connection
Railway worker (persistent Node: automation engine, embedding pipeline,
                AI agents, negotiation coordinator, crons, snapshots)
External: Claude API · OpenAI embeddings · Sentry
```

**Twelve architecture laws (memorize; CI should enforce):**
1. Every state change writes `audit_events` in the same transaction.
2. Every table has RLS; CI `rls:check` blocks unprotected tables.
3. Agents write ONLY to `proposals` — never operational tables.
4. At most one active session per user (sessions singleton).
5. Money is INTEGER micro-units ($1 = 1,000,000); floats only at the API serializer.
6. Capacity mutations are `allocated_hours = allocated_hours + $delta` — never overwrites.
7. No secrets in client bundles or browser storage.
8. Status fields transition only to valid next states (state machines, §8 below).
9. Queue consumers are idempotent; `event_id` deduplicates.
10. Every AI feature has a non-AI fallback.
11. Soft deletes via `deleted_at TIMESTAMPTZ`; unique indexes filter `WHERE deleted_at IS NULL`.
12. AI recommendations are validated against DB constraints before display.

---

## 4. Domain Architecture & Bounded Contexts

Five bounded contexts. Keep module boundaries aligned to these as the codebase
grows; do not let "capacity" code import from "knowledge" internals.

| Context | Entities | Owns | Current home |
|---|---|---|---|
| **Workforce & Capacity** | Employee, Team, CapacityCell, PTO | utilization math, allocation, burnout signals | `lib/data.ts`, `lib/store.ts`, `/capacity`, `/people` |
| **Execution** | Project, Task, Sprint, Dependency | kanban, health engine, velocity | `lib/store.ts`, `/projects` |
| **Intelligence & Memory** | Risk, Decision, Knowledge, CausalSignal, Goal, Commitment | severity law, decision lifecycle, drift | `lib/risk.ts`, `/risks`, `/decisions`, `/goals` |
| **Agents & Review** | Proposal, AgentMemory, NegotiationCluster | priority hierarchy, compromise, rejection memory | `lib/types.ts (Proposal)`, `/proposals` |
| **Platform** | Session, AuditEvent, Notification, Relationship | RBAC, theming, audit, graph | `lib/session.ts`, `lib/graph.ts`, `/audit` |

### Entity Catalog (17 first-class entities)

Employee · Team · Project · Task · Capability · System · Decision · Risk ·
Process · Vendor · Meeting · Commitment · Expertise · Knowledge · Goal ·
Customer · Service · RevenueStream. (Capability/System/Process/Meeting/
Customer/Service/Revenue exist in the PRD schema and the graph registry but do
not yet have dedicated CRUD screens — see Feature Matrix.)

### Relationship Catalog

Canonical closed registry in `src/lib/graph.ts` (`RelationshipType`): `owns`,
`belongs_to`, `reports_to`, `has_expertise_in`, `assigned_to`, `made`,
`owns_risk`, `made_commitment`, `delivers`, `executes`, `executed_by`,
`produces`, `linked_to`, `exposes`, `depends_on`, `documented_by`,
`implemented_by`, `delivers_value_to`, `threatened_by`, `enabled_by`,
`supported_by`, `mitigates`, `made_in`, `causes`, `governs`, `generates`,
`funds`, `serves`, `at_risk`, `supersedes`, `blocks`.
Edges carry `strength` (0–1), `confidence` (0–1), `evidence`
(observed|declared|inferred|ai_derived). **Never add an ad-hoc string type** —
extend the union and treat it as a schema migration.

Traversal utilities already implemented and tested: `edgesFrom`, `edgesTo`,
`neighbors`, `reachable(maxHops)` (bounded BFS = in-memory analogue of the
`entity_paths` cache), `wouldCreateCycle` (DFS, returns closed cycle path for
the 422 response), `expertiseConcentration` (bus-factor math).

---

## 5. Database Catalog (production target — PRD §12, §21–27)

Tables to create in Supabase, in dependency order:
`departments`, `users`, `sessions`, `projects`, `sprints`, `tasks`,
`task_collaborators`, `task_dependencies`, `capacity_logs`, `audit_events`
(INSERT-only; `REVOKE UPDATE, DELETE FROM authenticated`), `risks`,
`decisions`, `meetings`, `commitments`, `goals`, `knowledge_docs`,
`notifications`, `notification_dedup`, `proposals`,
`agent_proposals_staging`, `agent_memory`, `dead_letter_jobs`,
`entity_embeddings` (pgvector 1536), `entity_relationships`, `entity_paths`,
`causal_signals`, `customers`, `revenue_streams`, `services`, `scenarios`,
`org_snapshots`, `org_snapshot_data`.

Critical implementation notes:
- `capacity_logs` UNIQUE (user_id, week_start); mutate by atomic delta only.
- RLS strategy: pre-computed `visibility_scope UUID[]` maintained by trigger,
  policy is an array-overlap check (avoids join-chain latency).
- Soft-delete pattern everywhere: `deleted_at TIMESTAMPTZ`, partial unique
  indexes, RLS excludes deleted rows, 30-day hard-delete batch job.
- CRDT prep columns on tasks/projects from day one: `version_vector JSONB`,
  `tombstone BOOLEAN`, `event_sequence BIGINT`, `last_synced_at` — populated,
  not acted on, until Phase 4 offline sync.
- All indexes from PRD §12 "Critical Indexes" verbatim.

---

## 6. API Catalog (production target — PRD §13, §30.4)

Cursor pagination only. Key endpoints with contracts already specified:

| Endpoint | Notes |
|---|---|
| `POST /auth/login` | rate-limit 10/IP/15min; single-session enforcement; RS256 JWT 15-min + httpOnly refresh cookie (7d, SameSite=Strict, path=/auth/refresh) |
| `POST /auth/refresh` | silent re-auth on page load; JWT lives in module memory ONLY |
| `POST /tasks/reallocate` | `pg_advisory_xact_lock(task_id)`; 409 CONCURRENT_MODIFICATION; 422 CAPACITY_EXCEEDED (override_reason required) — response shape already mirrored by `store.confirmReallocate` |
| `POST /tasks/dependency-check` | server DFS; 422 with `cycle_path` — logic already implemented client-side in `graph.wouldCreateCycle`; port it |
| `GET /capacity/heatmaps` | materialized view, dept-scoped |
| `GET /ai/search` | hybrid 0.7·vector + 0.3·BM25, RLS-scoped, `search_mode: "full_text_fallback"` when AI down |
| CRUD | `/projects`, `/risks`, `/decisions`, `/meetings`, `/commitments`, `/users` |

---

## 7. Screen & Component Catalog (implemented)

| Route | Screen | Key components | Role gate |
|---|---|---|---|
| `/` | Command Center | MetricTile×4, capacity hotlist, proposals preview, portfolio cards, audit feed | all |
| `/capacity` | Heatmap (drag-drop) | matrix rows, task chips (HTML5 DnD), PTO icons, dept filters | view_capacity |
| `/projects` | Portfolio cards | HealthPill+Explain, burn bars, velocity sparks | all |
| `/projects/[id]` | Detail + Kanban | causal-signal panel, 6-column motion kanban, linked risks/decisions | all |
| `/people` | Directory | TanStack table, skill search, load-sorted | all (burnout dot gated) |
| `/people/[id]` | Profile | CapacityRing, expertise depth bars, manager-private panel (gated) | all |
| `/executive` | Exec intelligence | revenue-at-risk, drift vs OHI chart, morning brief | view_executive |
| `/risks` | Register + matrix | probability×impact grid (from `SEVERITY_MATRIX`), signal explains | all |
| `/decisions` | Registry timeline | expandable rationale, options weighed, outcome calibration | all |
| `/goals` | OKR scorecard | KR progress, linked projects | all |
| `/proposals` | Agent inbox | compromise banners, validation checklists, 2-click review | review_proposals |
| `/graph` | Dependency graph | React Flow from `relationships`, blast radius, bus factor | all |
| `/audit` | Audit table | live insert-only feed, override surfacing | view_audit |
| `/login` | Persona auth | role selection, simulated session | public |
| Shell | — | CommandPalette (⌘K, /), ShortcutManager (g-sequences, ?), GuardrailModal, TaskDrawer, ThemeToggle, notifications popover | — |

**UI primitives** (`components/ui/primitives.tsx`): `EmpAvatar`, `HealthPill`,
`TaskStatusPill`, `PriorityDot`, `CapacityBar` (80% threshold tick), `Explain`
(the why-popover — REQUIRED next to any new metric), `MetricTile`, `Button`,
`SectionHeader`, `EmptyState`, `SeverityBadge`. Charts in `ui/spark.tsx`.

**Design tokens:** all neutrals are CSS variables (`--ink*`, `--line*`,
`--fg*`, `--shadow-*`) defined per-theme in `globals.css`; signal colors
(brand `#6366F1`, ok `#10B981`, warn `#F59E0B`, danger `#EF4444`, info
`#38BDF8`) are theme-invariant. Fonts: IBM Plex Sans (body, tabular nums),
IBM Plex Mono (data), Sora (display). **Never hardcode a neutral hex in a
component** — use the token classes; chart inline styles use
`rgb(var(--token))`.

---

## 8. State Machines (enforce server-side when backend lands)

```
Project:    PLANNING → ACTIVE → AT_RISK → CRITICAL → COMPLETED
                     ↘ ON_HOLD ↔ ACTIVE      ↘ CANCELLED (terminal)
            (PLANNING → COMPLETED is INVALID)
Task:       BACKLOG → TO_DO → IN_PROGRESS → REVIEW → CLIENT_REVIEW → COMPLETED
            BLOCKED reachable from/returnable to any active state; CANCELLED terminal
Risk:       OPEN → MITIGATING → MONITORING → CLOSED; OPEN → ACCEPTED → MONITORING;
            any → ESCALATED (notifies executives)
Decision:   DRAFT → PROPOSED → APPROVED → ACTIVE → SUPERSEDED; PROPOSED → REJECTED → DRAFT;
            ACTIVE → REVERSED (links corrective decision)
Commitment: OPEN → IN_PROGRESS → FULFILLED; auto-OVERDUE on due-date breach;
            OVERDUE → FULFILLED | WITHDRAWN (reason required)
Proposal:   pending → approved | rejected | expired(48h) | superseded
```

---

## 9. Intelligence Formulas (already partially encoded; keep exact)

- **Utilization** = Σ(estimated_hours of tasks due in week) ÷ capacity_hours_per_week.
  Colors: <80% green, 80–99% yellow, **≥100% red (inclusive)** — tested in `utils.test.ts`.
- **Burnout flags** (independent triggers): ≥3 consecutive weeks >50h · ≥90 days
  no PTO · ≥7 consecutive days at ≥100% · reassignment rate >0.3/30d.
  Manager-private; flagged employee NEVER sees their own flag (gate exists:
  `can("view_burnout")`).
- **Severity matrix** — `lib/risk.ts`, pinned cell-by-cell in tests.
- **Strategy Drift** = 100 − (goal-linked hours ÷ total hours × 100);
  bands: ≤10 aligned · 11–20 minor · 21–35 moderate · 36–50 significant (exec alert) · >50 critical.
- **Kill Score** = ROI 30% + velocity 20% + alignment 20% + team-health 15% + opportunity-cost 15%.
- **WQS** = 1 − (rework·0.35 + rejection·0.25 + defect·0.20 + reopen·0.20).
- **EPS** = commitment-accuracy 30% + estimation 25% + deadline 25% + scope-stability 20%.
- **OHI** = fairness 20% + manager-effectiveness 25% + stability 15% + psych-safety 20% + recognition 10% + meetings 10%; target >75.
- **CLI** (cognitive load ≠ burnout): concurrent projects, context switches,
  meeting ratio, approval queue depth, unread backlog, open commitments; 0–30 healthy … 71–100 critical.
- **Agent priority hierarchy** (deterministic conflict resolution):
  burnout_safety 100 › hard_constraint 90 › legal_compliance 85 ›
  delivery_critical 70 › allocation_optimize 50 › risk_advisory 40.
- **Notification classes**: hard_stop (immediate, bypasses muting) ·
  critical_action (work hours) · manager_review (batch 1/entity/4h) ·
  intelligence (morning brief ONLY) · informational (inbox only).
  Debounce: burnout 24h · capacity 4h · health 8h · drift weekly · proposals 3/2h.

---

## 10. Technical Debt Register

| ID | Debt | Severity | Where | Repayment |
|---|---|---|---|---|
| TD-1 | All data in-memory; refresh resets ops state (theme/session persist) | High | `lib/data.ts`, `lib/store.ts` | Supabase swap (V0.3) |
| TD-2 | RBAC enforced client-side only | High | `lib/session.ts` | Server middleware + RLS (V0.3) |
| TD-3 | Auth is simulated persona selection | High | `app/login` | Supabase Auth + session table (V0.3) |
| TD-4 | HTML5 DnD lacks keyboard/touch path | Med | capacity, kanban | Pragmatic Drag & Drop + keyboard reassign via TaskDrawer (exists as fallback) |
| TD-5 | Graph node positions hand-placed | Low | `graph/page.tsx NODE_META` | dagre/elk auto-layout when node count grows |
| TD-6 | Command palette search is client substring, not hybrid | Med | `command-palette.tsx` | `/ai/search` when backend lands; keep palette UI |
| TD-7 | No component/E2E tests | Med | — | Playwright on the 3 critical flows (V0.4) |
| TD-8 | `next lint` not configured (no `.eslintrc`) | Low | repo | add eslint-config-next |
| TD-9 | Sparkline `SparkArea` gradient id collides if two same-color charts share a view | Low | `ui/spark.tsx` | suffix id with `useId()` |
| TD-10 | Several mock metrics (OHI, drift series) are static arrays | Med | `executive/page.tsx` | derive from real data when warehoused |

## 11. Risk Register (project risks, not product)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Backend swap drifts from UI shapes | Med | High | Types in `lib/types.ts` are the contract; generate DB types and diff in CI |
| Weaker models break product laws while editing | High | High | Tests pin the laws — run `npm test` before any merge; do not edit `risk.ts`/`utils.ts` thresholds without PRD citation |
| Realtime fan-out storms at scale | Med | High | Dept-scoped channels only (decision dec-2); never global broadcasts |
| AI cost runaway | Med | Med | Context compression (≤1k tokens/call), $3–15/org/day budget, 80% soft / 100% hard throttle |
| Scope creep into HRMS/CRM/payroll | Med | Med | PRD §19 permanent out-of-scope list — refuse |

---

## 12. Roadmap — Version-by-Version Build Sequence

### V0.2 — Hardening (NOW → 30 days) — no backend required
1. **ESLint config** + CI script (`lint`, `test`, `build` on push). *Complexity: S, Risk: low.*
2. **Keyboard reassignment parity** — TaskDrawer shortlist is the a11y path; add focus management + `aria-live` on optimistic updates. *S–M.*
3. **Saved views & filters** — persist capacity dept filter, people search, audit filters in URL params (shareable) + localStorage. *S.*
4. **Empty states everywhere** — `EmptyState` exists; cover kanban columns, filtered tables, zero-risk projects. *S.*
5. **SparkArea gradient id fix (TD-9).** *XS.*
6. **Playwright smoke**: login → drag task → override modal → audit row appears; proposal approve → capacity changes. *M.*

### V0.3 — Real backend (30–90 days) — THE critical version
**Step order matters; each step keeps the app shippable:**
1. Provision Supabase; run schema (Section 5) + indexes + RLS policies + triggers (audit, visibility_scope, severity auto-compute, causal signals).
2. Generate TS types from DB; reconcile with `lib/types.ts` (DB is source of truth from here).
3. Introduce TanStack Query data hooks (`useTasks`, `useCapacity`, …) that read Supabase but **fall back to seed data when env vars absent** — keeps demo mode working.
4. Port mutations: `store.requestReallocate/confirmReallocate` → `POST /tasks/reallocate` RPC with advisory lock; keep optimistic shape + rollback toast ("Task was modified — refreshing board").
5. Supabase Auth: email+password, Google OAuth; sessions table + single-session enforcement; httpOnly refresh cookie + silentRefresh; replace `AuthGate` internals (component boundary unchanged); Next middleware for route protection.
6. Server RBAC: JWT role claim checked in API routes; client `can()` becomes a UX hint only.
7. Realtime: `capacity:dept:{id}` channels; on broadcast update only the affected row; 30s polling fallback banner.
8. Acceptance gates: heatmap p95 <2.5s from materialized view; reallocate server confirm <800ms; audit row in same transaction (verify with failing-trigger test).

### V0.4 — Intelligence live (90–180 days)
1. Railway worker: embedding pipeline (content-hash dedup, dead-letter queue), nightly risk prediction, morning-brief generator (7:45am per timezone), entity_paths refresher, monthly org snapshots.
2. Hybrid search behind `/ai/search`; wire command palette; label fallback mode.
3. Causal signals: DB triggers write `causal_signals`; `Explain` popovers read stored rows (UI contract unchanged — signals become live).
4. Agents v1 (Burnout, Allocation) → `agent_proposals_staging` → negotiation coordinator (priority matrix + compromise generator, 60s scan) → `proposals`. Rejection memory in `agent_memory` (30-day suppression).
5. Health engine: auto-calculated `health_status` + `health_reasons` from overdue ratio, stalled deps, velocity — remove any manual setting path.
6. Notification intelligence: classes, debounce table, morning brief as sole `intelligence` channel.

### V0.5 — Enterprise (180+ days)
MFA/TOTP (mandatory admin+exec) · SSO/SAML + SCIM · client portal
(`/client-portal/:token`, sandboxed RLS tier) · financial dashboards (micro-unit
integrity end-to-end) · scenario simulation engine (schemas in PRD §26) ·
multi-tenancy (org_id on every table + RLS) · SOC 2 evidence automation ·
data import connectors (Jira/Asana/Monday) · Customer/Service/Revenue CRUD
screens · Org chart + Knowledge Hub + Meetings screens (PRD screens not yet built).

### Beyond (Phase 4 of PRD)
Event sourcing migration (prep columns already specified) · offline CRDT sync
(per-field algorithms specified in PRD §25: LWW scalars, PN-Counter hours,
OR-Set tags, RGA ordering) · Neo4j/Apache AGE read replica for 5+ hop
traversal · ONA influence overlay · digital twin simulations · public API +
webhooks · plugin marketplace.

---

## 13. Task Decomposition — the three highest-leverage tasks

### T1. Supabase substitution (V0.3 steps 1–4)
- **Purpose:** real persistence without UI rewrite.
- **Dependencies:** Supabase project + env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, server `SUPABASE_SERVICE_ROLE_KEY` — never client-side).
- **Files affected:** new `src/lib/db/` (client, queries, mutations), `src/lib/store.ts` (mutations delegate), all pages swap direct `data.ts` imports for hooks; `data.ts` becomes `seed.ts` consumed by a `supabase db seed` script.
- **Acceptance:** all 22 existing tests still pass against a test DB (convert store tests to integration); drag-drop round-trip <800ms; audit row transactional; demo mode (no env) still boots.
- **Security:** RLS on from the first migration; service-role key only in API routes.
- **Complexity M–L · Risk Med · Priority P0.** Blockers: credentials only.

### T2. Real authentication (V0.3 step 5)
- **Purpose:** replace persona simulation with verifiable identity; unblock every enterprise conversation.
- **Steps:** Supabase Auth config → `sessions` table + invalidate-prior trigger → `/auth/*` API routes per Section 6 → middleware.ts protecting `(shell)` → swap `AuthGate` internals → keep persona switcher as admin-only "view as" impersonation (it is genuinely useful — gate it behind `role === "admin"`).
- **Acceptance:** second login revokes first (query: exactly one `is_active` per user); refresh works across hard reload; logout clears cookie; rate limit returns 429.
- **Testing:** Playwright auth flows + unit tests on session invariant.
- **Complexity M · Risk Med · Priority P0.**

### T3. Negotiation coordinator worker (V0.4 step 4)
- **Purpose:** the differentiating AI feature — conflicting agent intents merged before humans see them. UI and data shapes (`Proposal.conflict`, validation arrays, priority numbers) are already final; this implements the producer.
- **Steps:** Railway service skeleton → agent runners read compressed context vectors (≤1k tokens; see PRD §11.6 compression example) → staging writes with `conflict_scope` → coordinator: cluster by scope overlap → resolve by priority hierarchy → `tryCompromise` (split delta / find alternative capacity / extend with float) → promote ONE card → memory writes on review.
- **Acceptance:** Sarah-scenario integration test produces exactly one compromise card, never two conflicting cards; rejected proposal not re-proposed within 30 days; proposals expire at 48h.
- **Performance:** coordinator scan ≤60s cycle; validation against live constraints before promote.
- **Complexity L · Risk Med-High · Priority P1** (after T1/T2).

---

## 14. Assessments (concise, honest)

- **Security:** client gating is UX, not security, until T1/T2 land. Threat
  model essentials: token-scoped client portal links (risk r-6 in seed mirrors
  this), prompt-injection isolation (user text is data, never instructions),
  enumeration-safe password reset (always 200), audit immutability via REVOKE.
- **Accessibility:** Radix primitives keyboard-complete; `aria-current` nav,
  labeled icon buttons, reduced-motion media query, dual-encoded status
  (icon+text). Gaps: DnD keyboard path (use drawer), heatmap screen-reader
  table semantics, focus trap audit on drawer.
- **Performance:** worst route 283kB first-load (acceptable); React Flow
  isolated to `/graph` (59.5kB route). Watch: capacity matrix re-renders on
  every store change — memoize rows if employee count grows past ~100;
  virtualize people table past ~500 rows.
- **Testing:** laws are pinned; flows are not. Playwright is the next dollar.
- **Realtime/AI/Graph:** designed and data-shaped, not transported — see roadmap.

---

## 15. Immediate Next Actions (do these first, in order)

1. `cd dizruptos && npm install && npm test && npm run build` — confirm green baseline.
2. Add `.eslintrc.json` (`{"extends": "next/core-web-vitals"}`) + GitHub Actions running lint/test/build.
3. Fix TD-9 (gradient `useId`).
4. Provision Supabase project → begin T1 step 1 (schema migration file).
5. Read PRD §30.2 Flow 1 before touching reallocation code — it is the product.

**Working agreements for all future contributors (human or model):**
- Run `npm test` before and after every change; the tests encode product law.
- New metric on screen ⇒ wrap it with `Explain` and real signals. No naked scores.
- New color ⇒ token first, never hex in a component.
- New entity link ⇒ add to `graph.ts` registry, never a loose ID array.
- Mutation ⇒ audit event in the same change.
- When the PRD and convenience disagree, the PRD wins; cite the section in the commit message.

---

*Maintained at repo root. Update the Feature Matrix, Debt Register, and version
sections with every meaningful merge — this document is the source of truth for
continuation, not the chat history that produced it.*
