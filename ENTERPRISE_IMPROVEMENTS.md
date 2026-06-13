# DIZRUPT — Enterprise Improvement Backlog

> A deep, exhaustive catalogue of what a deployable enterprise platform of this
> class should contain, and where DIZRUPT stands against it. Companion to
> [PLAN.md](PLAN.md) (PRD coverage) and [BACKEND_PLATFORM_REVIEW.md](BACKEND_PLATFORM_REVIEW.md).
> Legend: ✅ done · 🟡 partial · ⬜ not started.

---

## 1. Login & authentication experience

### Visual / motion (the gateway)
- ✅ Orbital object suspended in the dark (upper-right negative space), slow bob + cursor parallax, satellite circling its circumference (comet trail), reduced-motion safe.
- ✅ Nexus material system: Newsreader display serif, amber `#F97316` on `#0A0A0A`, glass panel, hairline borders, 24px blur.
- ✅ "Engage" warp transition on submit (amber bloom flood + flash) before routing.
- ⬜ Page-load orchestration: stagger the orb ignition → ring draw-in → satellite launch → panel rise as one timed sequence.
- ⬜ Per-persona accent: the orb tints to the selected persona's role color on hover.
- ⬜ Sound design (optional, opt-in): a soft sub-bass "engage" cue on enter.
- ⬜ Error state choreography: failed login shakes the panel + flares the orb red.
- ⬜ Idle easter egg: after N seconds untouched, the satellite speeds up / a second body appears.

### Auth functionality (currently demo personas)
- 🟡 Demo persona sign-in → httpOnly session cookie, single-session enforcement.
- ⬜ Real credential auth (email + password) via Supabase Auth.
- ⬜ Magic-link / passwordless email sign-in.
- ⬜ OAuth (Google, Microsoft/Entra, GitHub) social sign-in.
- ⬜ SSO / SAML + OIDC for enterprise tenants.
- ⬜ SCIM user provisioning / deprovisioning.
- ⬜ MFA (TOTP + WebAuthn/passkeys); step-up auth for admin/exec actions.
- ⬜ Password reset, email verification, account recovery flows.
- ⬜ Device/session management UI ("you're signed in on 3 devices · revoke").
- ⬜ Brute-force lockout + CAPTCHA after repeated failures.
- ⬜ Org/tenant selector for users belonging to multiple organizations.
- ⬜ Invitation acceptance flow (token → set password → join org with role).
- ⬜ "Remember this device" + trusted-device skip-MFA.
- ⬜ Audit every auth event (login, logout, failure, MFA, role switch).

---

## 2. Dashboard & product UX (the "(c)" deep polish backlog)

### Global shell
- ✅ 14px type floor; enlarged topbar title/hint; notification text.
- ✅ Lit-edge panels (Linear/monday surface cue).
- ✅ Notification badge clears on open + "mark all read".
- 🟡 Command palette (⌘K) — exists; ⬜ fuzzy search across all entities + recent/quick actions + keyboard-only flows.
- ⬜ Global breadcrumb + back/forward affordance for deep drill-downs.
- ⬜ Density toggle (comfortable / compact) persisted per user.
- ⬜ Per-user saved views / filters / pinned items.
- ⬜ Skeleton loaders + optimistic transitions on every async surface.
- ⬜ Empty states with a clear first action on every page.
- ⬜ Right-side context drawer (entity peek without losing place) — pattern exists for tasks; extend to people/projects/risks/decisions.
- ⬜ Toast/inline confirmation system unified across all mutations.
- ⬜ Full keyboard map (j/k navigation, `g then p` go-to, `c` create) + a discoverable cheat-sheet.
- ⬜ Responsive/mobile pass for the authenticated shell (currently desktop-first).

### Per page (deep polish — page by page)
- **Command Center**: ✅ banner promoted; ⬜ make pulse-stat tiles clickable to filtered drill-downs; ⬜ "what changed since you last looked" diff ribbon; ⬜ per-role default layout.
- **Capacity Heatmap**: ✅ drag-drop; ⬜ multi-week range select, ⬜ undo/redo stack, ⬜ "auto-balance" suggestion, ⬜ keyboard cell navigation, ⬜ hover tooltips with the exact hour math.
- **Projects / Kanban**: ⬜ swimlanes, WIP limits, inline edit, bulk move, dependency arrows between cards.
- **People**: ⬜ skills matrix heatmap, availability calendar, 1:1 / PTO overlay, expertise search.
- **Risk Register + Matrix**: ⬜ interactive likelihood×impact matrix (drag to re-score with audit), ⬜ mitigation owners + due dates, ⬜ trend sparkline per risk, ⬜ link risks to graph entities.
- **Decision Registry**: ⬜ decision detail timeline, supersede chains, "decisions affecting X" reverse lookup, export to PDF.
- **Goals / OKRs**: ⬜ check-in cadence, confidence trend, key-result drill to contributing projects.
- **Agent Inbox**: 🟡 approve/reject/flag; ⬜ bulk triage, ⬜ counter-propose editor, ⬜ full causal-chain expander, ⬜ snooze/defer with reason.
- **Dependency Graph**: ✅ lenses + hover blast radius; ⬜ search-to-focus, ⬜ saved layouts, ⬜ time-scrubber (graph over time), ⬜ export/share a lens.
- **Executive Intelligence**: ⬜ narrative summary generation, ⬜ drill-down from every KPI, ⬜ scheduled email digest.
- **Audit Log**: ✅ filter + override reasons; ⬜ export (CSV/JSON), ⬜ saved filters, ⬜ tamper-evidence hash chain UI.

### Theming / brand cohesion
- 🟡 Login is amber (Nexus); app + landing are volt-green. ⬜ **Decide**: keep amber as a deliberate gateway, or harmonize (amber accents + green CTA / roll one palette across).
- ⬜ White-label theming per tenant (logo, primary color) driven by CSS vars already in place.

---

## 3. Data & persistence (backend "(b)")

- 🟡 Repository contract with memory + Supabase backends (env-selected).
- 🟡 Service layer (capacity laws, authz) as pure tested functions.
- 🟡 Executable SQL schema in `supabase/` (RLS, insert-only audit) — not yet the live store.
- ⬜ **Wire Supabase as the live store** (the single biggest credibility jump): real client, env config, typed generated types, migrations, seed.
- ⬜ Row-Level Security policies mirroring `rbac.ts`, tested against privilege-escalation attempts.
- ⬜ Full entity CRUD through repositories → services → API (not just reads + 2 mutations).
- ⬜ Optimistic concurrency / transactional capacity deltas server-side.
- ⬜ Soft deletes, versioning, archival & retention policies.
- ⬜ Data export / import + backup & restore runbook.
- ⬜ Migration system + rollback strategy + seed-vs-prod separation.

---

## 4. Authorization & security

- ✅ Edge auth middleware, httpOnly session, OWASP headers, single-session law, RBAC matrix + UI scoping + tests.
- 🟡 API rate limiting, JSON 401s, server-side permission checks on 2 routes.
- ⬜ RLS enforced at the database (defense in depth beyond app checks).
- ⬜ CSRF tokens on mutations; strict CSP with nonces; XSS audit.
- ⬜ Permission checks on **every** API route + feature flags per role.
- ⬜ Role inheritance + org-level + resource-level permissions.
- ⬜ Secret management (vault/env separation, rotation), no secrets client-side.
- ⬜ Audit log tamper-evidence (hash chain / append-only proof).
- ⬜ Pen-test pass: privilege escalation, tenant escape, IDOR, mass-assignment.
- ⬜ Data encryption at rest + field-level encryption for sensitive fields.
- ⬜ Compliance scaffolding (SOC2 controls map, GDPR data-subject export/delete).

---

## 5. Multi-tenancy & enterprise readiness

- ⬜ Tenant model + tenant isolation (every query scoped by org_id, enforced by RLS).
- ⬜ Org settings, billing/seats, usage metering.
- ⬜ Admin console: user lifecycle, role grants, session management, data export.
- ⬜ SSO/SCIM (see §1), domain capture, just-in-time provisioning.
- ⬜ Per-tenant white-label theming + custom domains.
- ⬜ Governance: data residency, retention policy, legal hold.

---

## 6. Realtime & collaboration

- 🟡 Cross-tab sync (BroadcastChannel) + presence heartbeat UI.
- ⬜ Supabase Realtime channels (live capacity, assignments, dashboards, notifications, audit feed).
- ⬜ Live presence avatars + cursors on shared surfaces.
- ⬜ Conflict resolution / CRDT for concurrent capacity edits.
- ⬜ Optimistic UI reconciled against server broadcasts.
- ⬜ Comments / @mentions / threads on entities.

---

## 7. AI intelligence layer

- 🟡 Proposal schema, validation, priority hierarchy, rejection memory, decision-time re-validation, per-role queues — proposals are **seeded, not generated**.
- ⬜ Live agent evaluation loop (rules over live state → real proposals).
- ⬜ Embeddings + vector search (expertise, similar decisions, knowledge retrieval).
- ⬜ Retrieval layer + memory architecture for explanations.
- ⬜ Recommendation engine with evidence + confidence + explainability surfaced in UI.
- ⬜ Scenario simulation runner ("budget −15%" → causal chain diff over the graph).
- ⬜ Natural-language query over the org graph.
- ⬜ Guardrails: every AI action re-validated, reversible, audited.

---

## 8. Observability & operations

- 🟡 Structured logger exists.
- ⬜ Tracing + telemetry (OpenTelemetry), request IDs end-to-end.
- ⬜ Error monitoring (Sentry) + frontend RUM/web-vitals.
- ⬜ Health/readiness probes, uptime monitoring, alerting.
- ⬜ Audit/operational dashboards; failure reporting.
- ⬜ Feature flags + gradual rollout.

---

## 9. Performance

- 🟡 Idle-aware GPU loops, visibility-paused canvases, memoized selectors.
- ⬜ TanStack Query for server cache (dep installed, not yet wired) — replace ad-hoc fetches.
- ⬜ Route-level code splitting + lazy WebGL fields.
- ⬜ Virtualized long lists/tables.
- ⬜ DB query/index tuning; N+1 elimination at the repository layer.
- ⬜ Image/font optimization budget; Lighthouse/CWV targets enforced in CI.

---

## 10. Testing & quality

- ✅ 75 tests (unit, RBAC, API-contract), typecheck, lint, build in CI.
- ⬜ Integration tests against a real (test) Supabase.
- ⬜ RLS policy tests (attempt unauthorized access, assert denial).
- ⬜ E2E (Playwright) covering auth, each role's dashboard, key mutations.
- ⬜ Visual regression snapshots for login/landing/dashboard.
- ⬜ Load/soak tests on realtime + capacity mutations.
- ⬜ Accessibility audit (axe) — focus order, contrast, ARIA, keyboard-only.

---

## 11. Deployment & docs

- 🟡 Operating manual (PLAN, FEATURES, DASHBOARD_GUIDE, BACKEND_PLATFORM_REVIEW).
- ⬜ Environment setup + secrets documentation.
- ⬜ Infrastructure-as-code + CI/CD pipeline (preview deploys, prod promote).
- ⬜ Operational runbooks + recovery/DR procedures.
- ⬜ One-command local bootstrap (db + seed + dev).
- ⬜ Architecture diagrams kept in-repo.

---

## Suggested execution order (highest leverage first)

1. **Supabase live store + RLS** (§3, §4) — turns the prototype into real software.
2. **Full auth** (§1) — Supabase Auth, MFA, sessions, invitations.
3. **Realtime channels** (§6) replacing BroadcastChannel.
4. **Per-page dashboard depth** (§2) — the "(c)" backlog, page by page.
5. **Live agent loop + scenario runner** (§7).
6. **Multi-tenancy + admin console** (§5).
7. **Observability + E2E/RLS testing + CI/CD** (§8, §10, §11).

---

## Captured requests — revisit (not yet implemented)

> Logged 2026-06-13 so these aren't lost while backend/migration work proceeds.

- **Social login (Google / Microsoft OAuth)** on `/login` — deferred by request.
  Lands with the real Supabase Auth system (§1): `signInWithOAuth({provider})` +
  callback route + `app_metadata.role` mapping into the JWT for RLS.
- **Full dashboard redesign (enterprise-grade, Linear-inspired).** The current
  shell reads as "a good dashboard," not yet "enterprise-worthy / something an
  employee is glad to open." Wants: less cramped, more premium, emotionally
  inviting. **Blocked on inspiration assets** — the screenshots folder the user
  is uploading was NOT found in the repo (`dizruptos/` has no inspiration/
  screenshots/images dir). Action: ask for the folder path / commit the images,
  then do a dedicated redesign sprint studying them + Linear.
- **Role-specific feature set (brainstorm + build).** Distinct capabilities per
  tier — manager / regional manager / regional head vs employee (employee may get
  a deliberately lean surface). Pairs with the approvals/authority work already
  landed. Needs a design session enumerating per-role features.
- See `CTO_REVIEW.md` for the architectural gaps that should precede breadth:
  org/tenant model, Capability as a first-class entity, the computation engine,
  bigint money, real auth.
