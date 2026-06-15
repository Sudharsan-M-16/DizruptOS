# PLAN.md — PRD Coverage & Remaining Work

> Honest implementation status against `DIZRUPT_Supreme_PRD_v3.md` (30 sections),
> updated June 2026. ✅ implemented · 🟡 partial (demo-tier, contracts in place) ·
> ⬜ not started. Companion docs: [FEATURES.md](FEATURES.md) (engineering),
> [DASHBOARD_GUIDE.md](DASHBOARD_GUIDE.md) (plain-language).

## Status by PRD section

| § | Area | Status | Notes |
|---|---|---|---|
| 2 | Design doctrine | ✅ | Explain-everything, computed health/severity, restraint budgets enforced in components |
| 4 | Entity model / org graph | ✅ | Full typed entity model (`types.ts`), seed org in `data.ts` |
| 5 | Personas & role system | ✅ | 5 personas across admin/exec/dept-head/PM/employee, permission matrix |
| 6 | **Dynamic view architecture** | ✅ | Per-role scoping live: inbox (visibility+subjectId), command center, risks, people columns, projects ordering, nav |
| 7 | Epic catalogue | 🟡 | Capacity, projects/kanban, people, risks, decisions, goals, audit, graph, proposals shipped; timesheets/PTO/client portal ⬜ |
| 9 | UI/UX design system | ✅ | Token system, 12px readability floor, neutral-black Linear theme, motion tiers, segmented load meters |
| 9b | **DizruptOS web-OS shell** | ✅ | Dashboard `/` rebuilt as a macOS-style OS: boot/lock/desktop, window manager (drag/resize/snap/genie/persist), customizable Dock, Menubar + Control/Notification Centers + calendar, Spotlight/Mission Control/Launchpad, **routes-as-windows** (no functionality lost), native apps (Home/Matrix-DnD/Directory/Vault), **OS-layer RBAC**, light/dark + accent + wallpaper. Honest score: frontend/UX **8.5** (`SUPREME_PLATFORM_AUDIT.md`). Remaining: a11y audit + redesign the iframed legacy pages to the OS language. |
| 10 | Technical architecture | 🟡 | Next.js App Router + edge middleware + Zustand; Railway workers ⬜ |
| 11 | Concurrency & state | 🟡 | Optimistic mutations + atomic capacity deltas + cross-tab sync (BroadcastChannel); server arbitration ⬜ |
| 12 | Database schema | 🟡 | Executable SQL in `supabase/` (RLS, insert-only audit); not yet the live store |
| 13 | API endpoints | 🟡 | Auth + health + **20+ versioned `/api/v1` routes** including graph traversal, Monte Carlo, SCIM, admin, ingestion connectors (Jira/Linear/GitHub), metrics, copilot (LLM-enhanced). Full entity CRUD pending Supabase swap. |
| 14 | Security architecture | ✅ | Edge auth, httpOnly session, **OWASP headers + CSP in `vercel.json`**, single-session law, RBAC matrix + 3-layer enforcement + audited denials + idle auto-lock + **SOC2 controls map** |
| 14b | **Real auth (Supabase)** | ✅ code / ⬜ live | CODE COMPLETE. Live = apply migration + enable hook + real users. |
| 14c | **Enterprise auth (SSO/SCIM)** | ✅ scaffold | **SCIM 2.0** full Users + Groups CRUD (`/api/v1/scim/`). **SSO SAML** SP-initiated + ACS + OIDC redirect (`/api/auth/sso/`). Remaining: node-saml IdP testing, per-tenant SSO config in DB. |
| 15 | AI intelligence layer | 🟡 | **Copilot now LLM-enhanced** (Claude claude-sonnet-4-6 with engine-grounded context). Agent proposals seeded not live-generated. |
| 16 | Roadmap/MVP | ✅ | MVP demo complete and verifiable (174 tests, clean build, CI/CD) |
| 21 | Generic relationship layer | ✅ | Typed edges, BFS reachability, cycle guard, bus-factor + **recursive CTE traversal + betweenness centrality** (migration 0013) |
| 22 | Data ingestion | ✅ scaffold | **Jira + Linear + GitHub webhook receivers** (HMAC-verified, metric-instrumented). CSV import existed. |
| 23 | Causal intelligence | 🟡 | Stored causal signals behind every score; live causal engine ⬜ |
| 24 | Multi-agent negotiation | 🟡 | Coordinated-compromise cards + priority order; live negotiation loop ⬜ |
| 25 | CRDT conflict resolution | ⬜ | Last-write + atomic deltas today; CRDT math not implemented |
| 26 | Scenario simulation engine | ✅ | Graph lenses + departure/node-failure/staffing + **Monte Carlo** (4 scenario types, p5–p95 percentiles, risk flags) |
| 27 | Notification intelligence | 🟡 | Urgency classes + rollup UI + dual-sided reallocation notifications; **Supabase Realtime channels** (replacing BroadcastChannel); debounce engine ⬜ |
| 28 | Lifecycle state machines | 🟡 | Task/risk/decision/proposal statuses enforced in UI + data layer; server-side transitions ⬜ |
| 29 | Failure mode catalog | 🟡 | Stale-proposal expiry, guardrail overrides, cycle refusal implemented |
| 30 | Build readiness | ✅ | **Full CI/CD**: typecheck/lint/174 tests/build/E2E/security-audit/migration-lint/Vercel deploy/smoke test. **Docker + Prometheus + Grafana stack.** |

## What shipped in recent sprints

- Volt rebrand → Lumina login → **Nexus login** (black/orange/Newsreader serif, framer-driven eclipse animation immune to OS reduced-motion).
- Landing page (hero scrub, scrollytelling, bento) with midday-restraint pass.
- Linear-style **neutral-black theme** (blue cast removed) + **global type floor raised to 12px**.
- **RBAC data layer**: proposal `visibility`/`subjectId`, per-role inboxes (employee personal / manager team / admin governance with full control), scoped command center, risks, people columns, projects ordering, sidebar badge; actor-accurate audit events; 10 RBAC tests.
- Dual-sided reallocation notification (relieved X% → Y% · loaded A% → B%).
- Docs: FEATURES.md, DASHBOARD_GUIDE.md, this plan.

## Platform realization sprint (June 2026) — what changed

- **Repository layer** (`src/server/repositories/`): one contract, two
  backends (memory demo / Supabase PostgREST), env-selected, audit
  insert-only at the type level.
- **Service layer** (`src/server/services/`): capacity laws as pure tested
  functions; server-side authz (`resolvePrincipal`/`requirePermission`).
- **API v1**: role-scoped `/api/v1/proposals`, permission-gated
  `/api/v1/capacity` — RBAC enforced at the trust boundary, not just the UI.
- **Security**: API rate limiting (120/min/IP), JSON 401s for APIs,
  server-safe persona module.
- **Readability v3 + UX**: 13px global floor, bigger topbar/headers/graph
  nodes/inbox; notification badge clears on open; login "Access" removed;
  koki-kiko-scale hero + marquee; interactive ProductFrame.
- 58 tests. Full detail: [BACKEND_PLATFORM_REVIEW.md](BACKEND_PLATFORM_REVIEW.md).

## June 12 sprint — koki-kiko redesign + API expansion

- **Landing + login rebuilt** in the c2mtl.koki-kiko.com festival language:
  Three.js `ChromaField` shader (drifting stage-gel discs, cursor parallax,
  visibility-aware GPU loop), hard ink/volt poster plates with
  viewport-scale type, fixed vertical right-rail nav with the green ENTER
  block, GSAP ScrollTrigger scrubs (giant marquee, product-frame un-tilt),
  framer-motion entrances (GSAP from-tweens fight React StrictMode
  double-mount in dev — scrubbed `fromTo` self-heals, so scroll stays GSAP
  and one-shots are framer; see welcome/page.tsx comments).
- **ProductFrame is now operable**: sidebar switches views, heatmap cells
  report load on hover, agent proposals accept (with inbox-zero state),
  utilization breathes on an interval.
- **Readability v4**: token floor raised to 14px (2xs 14 / xs 15 / sm 16 /
  base 17 + enlarged lg–4xl); topbar 76px with 2xl title and 10px-grid
  controls; sidebar 256px; recharts/graph-edge/matrix-marker raw sizes
  lifted; graph nodes w-72 with base/sm type and `fitView minZoom 0.7`,
  canvas 640px.
- **API v1 expansion**: shared envelope/error plumbing (`server/api.ts`);
  employees (+detail, financial redaction), risks, audit (permission-gated),
  `PATCH proposals/:id` verdicts, `POST tasks/:id/reassign` with the
  server-side ≥100% override guardrail — all audited, all live-verified.
- **75 tests** (new API-contract suite), lint/typecheck/build clean.
- gsap + @gsap/react + @tanstack/react-query added (query layer reserved for
  the store→server migration).

## June 13 sprint — Nexus login, top-nav landing, dashboard polish

- **Login reborn as the Nexus gateway**: replaced the `ChromaField`/`SaturnField`
  background with `OrbitField` (`src/components/fx/orbit-field.tsx`) — a luminous
  amber orb in near-black with a **near-vertical orbit ring** and a light
  satellite tracing its circumference (comet-tail shader trailing the head),
  plus a faint crossing armillary ring and dust shell. Glass sign-in panel,
  **Newsreader** display serif, Nexus palette (#F97316 on #0A0A0A, #FED7AA
  buttons, white/amber hairlines, 24px blur), `cubic-bezier(.4,0,.2,1)` motion.
  Reduced-motion freezes the satellite; auth flow untouched.
- **Landing nav moved to a horizontal top bar** (`TopNav`) replacing the fixed
  vertical right-rail; section links + hard volt ENTER block; rail padding
  offsets stripped across all sections; hero meta repositioned under the bar.
- **ProductFrame Risk Register + Graph tiles now interactive** — both were
  disabled (`id: null`); added a ranked open-risk register view and a live
  blast-radius constellation (pulsing node, edges that draw in). All five
  preview tiles now switch views.
- **Dashboard polish (Linear/monday cues)**: panels gain a 1px lit top edge
  (`globals.css`); Command Center situation banner promoted to `text-xl`/bold;
  topbar + notification typography enlarged; per-page `2xs→xs` legibility pass
  on graph/capacity/decisions/risks/proposals; graph edge labels 14→16px.
- **Newsreader** wired via `next/font` (`--font-newsreader`, `font-serif`).
- Typecheck clean; `/login` + `/welcome` verified 200 + Playwright screenshots.

## June 13 — live Supabase backend + Option A (schema-authoritative)

**Live persistence is real.** Connected via the **session pooler** (direct
`db.*.supabase.co:5432` is IPv6-only → unreachable on IPv4; pooler is the path).
- Migrations applied live: `0001_core_schema.sql` (**32 tables**, full ontology +
  `entity_relationships`/`entity_paths`/`causal_signals`/`entity_embeddings
  vector(1536)`/`scenarios`, RLS, audit triggers, `reallocate_task` RPC) and
  `0002_grants_and_rls_fixes.sql` (anon/authenticated/**service_role** grants +
  `auth_dept()` recursion fix). Seed: `supabase/seed.sql` (5 users, 2 projects,
  **12 entity_relationships** graph, etc.).
- **RLS validated 10/10** (dept/user/anon isolation; admin sees all; audit
  denied to employees). **Audit + risk-severity triggers verified live.**
- **Live read proven**: authenticated `GET /api/v1/projects` returns Supabase rows.
- Full evidence: [BACKEND_READINESS_AUDIT.md](BACKEND_READINESS_AUDIT.md).

**DECISION — Option A: the database schema is the canonical ontology.** No
parallel domain model, no mapper-only fields. The app layer may use camelCase
(thin 1:1 column views), but the schema is the source of truth. Demo-only fields
(`code`, `velocityTrend`) are either modeled as real/derived columns or removed —
never synthesized in a mapper.

**TanStack Query foundation landed** (`src/lib/query.ts`, `components/providers.tsx`):
QueryClient mounted app-wide; **query-key factory `qk`** (tuple keys), `apiGet`
envelope fetcher, `invalidateDomain`. First vertical wired: `useProjects()`
(`lib/hooks/use-projects.ts`) — `LiveProject` mirrors the `projects` table 1:1.

**RBAC strengthened — graduated change authority** (`lib/rbac.ts`, +11 tests):
`authorizeChange()` → `direct | requires_approval | denied` + `approverRole` +
`notifyRoles`. Managers apply small changes directly (within capacity, <10%
budget), bigger ones escalate to the next senior role, and **higher-order is
always notified**. `canSeeEverything('admin')` — the top role is unrestricted.

### Schema-authoritative migration — sequenced (next sessions)
Per entity, app stays green throughout:
1. employees→**users** + capacity_cells→**capacity_logs** (fix repo table names + camelCase views).
2. Replace each page's store reads with `use<Entity>()` live hooks (projects → risks → people → capacity → proposals → audit).
3. Optimistic mutations + `invalidateDomain` on the reassign/verdict paths.
4. Remove `lib/data.ts` seed dependence once every route reads live.
5. Reconcile/justify demo fields as real columns (migration 0003) or drop them.

## Remaining — priority order for "enterprise-worthy"

1. **Supabase swap** (§10/12/13): wire the existing schema as the live store —
   auth, entity CRUD, RLS mirroring `rbac.ts`, realtime channels replacing
   BroadcastChannel. *Largest single credibility jump.*
2. **Live agent evaluation** (§15/24): hourly rule evaluation producing real
   proposals from live state (the validation/queue/memory plumbing already
   exists to receive them).
3. **Scenario simulation runner** (§26): "simulate budget −15%" → causal chain
   over the relationship layer → diff view; UI shell can reuse graph lenses.
4. **Admin console** (§5/14): user lifecycle, role grants (the governance
   queue already stages these), session management, data export.
5. **Notification debounce engine** (§27) and **timesheet/PTO epics** (§7).
6. **CRDT capacity math** (§25) once server arbitration exists.
7. Client portal persona (§7) — deliberately last.
