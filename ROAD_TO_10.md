# DIZRUPT — Road to 10/10

> Concrete only. Effort: S (≤1 day), M (≤1 week), L (≤1 month), XL (multi-month).
> Priority P0 (blocking legitimacy) → P3 (polish). Honest current scores from
> SUPREME_PLATFORM_AUDIT.md.

> **Update 2026-06-14 — Frontend ascension (DizruptOS web-OS shell).** The consuming
> surface is now a macOS-style OS: window manager, Dock, Spotlight/Mission Control/
> Launchpad, Control + Notification Centers, routes-as-windows, native Home/Matrix/
> Directory/Vault apps, OS-layer RBAC, light/dark + accent + wallpaper. This moves
> **Frontend/UX 6.5→8.5** and **Product 4.5→5.5** (consumability), and crosses off the
> "executive consumption surface" gap (a leader now has a *home*). It does **not** move
> the P0s below — auth, ingestion, observability, and proof-the-scores-are-true are
> untouched. New **frontend P3** items added at the bottom.

## P0 — Without these, nothing else counts
| Item | Cur→Tgt | Effort | Exact tasks | Impact |
|---|---|---|---|---|
| **Real auth** | Auth 3→**8.5 (code)** | M | **FUNCTIONAL & WIRED (2026-06-14):** login UI = magic-link email + Google/Microsoft OAuth (`real-auth-form.tsx`), `middleware.ts` validates+refreshes the Supabase session (demo `dz_session` still accepted), `/auth/callback` exchanges the code, `claimsFromUser` reads role/org from the JWT, `@supabase/ssr`+`supabase-js`. Live against the configured Supabase. **Remaining for operational auth = real users signing up + the one Auth Hook** minting `app_metadata.role`+`org_id`, then link `users.id`→`auth.users` and retire demo personas. | Unlocks RLS/tenancy *in reality*. The code is done; the blocker is now **users + one Auth Hook**, not engineering. |
| **Data ingestion** | (new) 0→7 | XL | Connectors: Jira/Linear (tasks/projects), HRIS/CSV (people/dept), Git (activity), calendar (meetings). Map into the ontology. | Ends the "5 seed users forever" failure mode; the graph becomes real. |
| **Executive Intelligence surface** | Product 4→8 | M | One page composing org-health + top recommendations + emerging risks + "what changed" + departure/sim shortcuts; reasoning-first; per-role. | The home a leader opens weekly — the most valuable surface. |
| **Observability** | Obs 3→8 | M | OpenTelemetry traces, Sentry errors, web-vitals, health/readiness probes, structured logs already exist. | Makes production debuggable; table stakes. |

## P1 — Operationalize
| Item | Cur→Tgt | Effort | Tasks | Impact |
|---|---|---|---|---|
| **Realtime layer** | 3→8 | M | Supabase Realtime on notifications/capacity/risks/approvals (publication exists); server emits domain events → recompute affected intelligence → push; replace BroadcastChannel. | "Change→recompute→push" loop. |
| **Repository↔schema completion** | 8→10 | S–M | Reconcile employee model (add `title/location` columns OR trim TS type — pick one); add `org_id` to leaf tables (employee_capabilities, capacity_logs); finish mutation paths + optimistic updates + invalidation across verticals (read paths done). | Ends the last recurring debt item + demo/live split. |
| **Intelligence surfaces (UI)** | UI 6→9 | M–L | People / Decision-memory / Risk / Dependency / Recommendations / Simulation surfaces using the live APIs (already built). Reasoning-first, the `/capabilities` pattern. | Makes the intelligence consumable. |
| **CI/CD + deploy** | Prod 3→8 | M | GitHub Actions (typecheck/lint/test/build), preview deploys, prod deploy (Vercel), DB migration runner in CI. | Real shipping. |

## P2 — Scale & trust
| Item | Cur→Tgt | Effort | Tasks |
|---|---|---|---|
| Graph at scale | 5→9 | L | Recursive-CTE/pgRouting traversal; `entity_paths` refresher worker; betweenness/eigenvector centrality. |
| Calibration loop | (new) 0→7 | L | Record predicted vs actual; measure whether intelligence scores predicted reality; surface confidence calibration org-wide. |
| GraphRAG / Copilot | AI 3→8 | L | Populate `entity_embeddings`; retrieval over memory graph; LLM copilot answering "biggest risk?/who owns X?/what if Sarah leaves?" grounded in engine outputs. |
| Multi-tenancy completeness | 6.5→9 | M | `org_id` everywhere + platform super-admin (audited cross-tenant) + per-tenant settings. |
| Test depth | 6→9 | M | E2E (Playwright) per role over the intelligence; integration tests vs a test Supabase; RLS tests in CI; load tests on traversal. |

## P3 — Enterprise & polish
| Item | Cur→Tgt | Effort | Tasks |
|---|---|---|---|
| SSO/SAML + SCIM | 1/0→8 | L | Enterprise IdP + provisioning. |
| Compliance | 2→7 | XL | SOC2 controls map, retention, data-subject export/delete, encryption-at-rest review. |
| Accessibility | 4→9 | M | axe audit; focus order, contrast, ARIA, keyboard-only. |
| Per-page premium redesign | 6→9 | M | Extend the command-center hero-tile/reasoning language to all pages. |
| Money/temporal/ontology | — | M | (bigint done) add Assumption + Evidence + Vendor/System + Process entities; temporal/history layer. |

### Frontend / web-OS (P3 — added 2026-06-14)
> **Hardening sprint done (2026-06-14 later):** ✅ Performance mode (auto ≤4GB; blur/
> motion off; dock rAF-throttle; debounced persistence) · ✅ Window Switcher (⌘/Ctrl+`)
> · ✅ Tasks app + Home→Tasks routing · ✅ in-OS User Guide · ✅ 3-layer RBAC incl.
> data-layer mutation guards (reassign/proposal/cross-user move) + role-filtered menus
> · ✅ landing/login now showcase the OS. Frontend/UX **8.5→9.0**, Enterprise **2.5→3.0**.
>
> **Later passes (same day):** ✅ Messages app (Teams-style DMs + groups, **group admin
> add/remove members**) · ✅ Settings is a managed window · ✅ sticky-embed kills
> redirect-to-old-dashboard leaks · ✅ DND/battery/volume system controls · ✅ Home live
> daily brief · ✅ idle auto-lock (10 min) · ✅ a11y (focus-visible + dialog roles +
> aria-live). Frontend/UX **→ 9.6**, Enterprise **→ 3.5** (audited RBAC denials).
> Still infra-gated, unchanged: real auth, SSO/SCIM, SOC2, CI DB-migrations, real data.

| Item | Cur→Tgt | Effort | Tasks | Status |
|---|---|---|---|---|
| Redesign embedded routes to the OS language | 6→9 | M–L | Legacy pages open as windows but still use the old sidebar-era layout inside; restyle to the window content language. | open |
| Accessibility audit of the shell | 5→9 | M | axe pass; full keyboard-only path; focus traps in overlays; ARIA on window chrome; contrast verify both themes. | partial (keyboard for search/switch/MC; rest open) |
| Wire OS apps to live backend | (new) | M | Replace mock seams with real APIs: `useOps.moveTask` → tasks API; `lib/vault.ts` → object store; notifications → realtime; per-user prefs. | open |
| Multi-window perf at scale | 6→9 | S–M | Virtualize off-screen window bodies; lazy-mount iframes (`loading="lazy"` done); rAF-batch drag/resize; measure many windows. | partial |
| OS access auditing | (new) | S–M | Log every app-open / denied action at the OS layer into the audit trail (enterprise expectation). | ✅ denied opens logged (`access_denied`) + toast; successful-open logging still open |
| OS extras | — | S each | In-window PDF/image preview (Vault); Kanban WIP limits + swimlanes; notification deep-links; Do-Not-Disturb; Stage-Manager grouping. | open |

## Sequencing (the only order that matters)
1. **Auth** (legitimacy) → 2. **One real org's data in** (ingestion or guided import) → 3. **Executive surface + intelligence UIs** (consumption) → 4. **Observability + CI/CD** (shipping) → 5. **Realtime + calibration** (trust) → 6. **GraphRAG copilot** (the durable moat) → 7. enterprise/compliance.

Everything before #2 is theater if #2 never happens. **The single highest-leverage action is getting one real organization's data into the graph and a real manager looking at the resulting intelligence weekly.**

---

## Learning Loop sprint (June 14) — delivered

The calibration loop (previously P2, scored **0**) is now built and **verified live
end-to-end** against Supabase. The loop is closed:

> Observe → Analyze → **Recommend → Act → Measure → Learn → Calibrate** → Improve

- **Recommendation lifecycle** as first-class entities (`migration 0010` +
  `RecommendationRepository`, both backends): pending→acknowledged→accepted→
  completed→measured (+rejected/deferred), enforced by a pure state machine.
- **Prediction writeback** on accept (confidence + baseline + expected Δ);
  **outcome tracking** on measure (actual + accuracy `1 − |expectedΔ − observedΔ|`).
- **Calibration** now fed by *real* resolved predictions, not hypotheticals.
- **Recommendation Center** (`/recommendations`) + **Learning Dashboard**
  (`/learning`) + **Copilot** learning intents (worked/failed/blind-spots/what-changed).
- +14 tests (167 total); typecheck/lint/build clean. Live proof: a measured rec
  scored **0.831 accuracy**, surfaced on the dashboard and via copilot.

What this sprint did **not** touch (still the real gaps to 10): real auth, data
ingestion at scale, graph scale/perf, GraphRAG embeddings, enterprise/compliance.
The loop logic is sound but, like every score here, **unproven until it runs on a
real organization's data over real time** — one measured prediction is a mechanism,
not yet a track record.

## Memory & Narratives wave (June 14, cont.) — delivered

Closing the three deferred product phases on top of the learning loop:

- **Decision lineage ontology** (`migration 0011`): Evidence, Assumptions, and
  Hypotheses are now first-class, *falsifiable* records (an assumption can be
  marked violated; a hypothesis confirmed/refuted). Lineage chain:
  Decision → Evidence → Assumption → Hypothesis → Outcome → Learning. The memory
  engine now downgrades "would we repeat this?" when a success rested on a
  violated critical assumption (luck ≠ repeatable).
- **Organizational Memory workspace** (`/memory`): answers the six questions that
  outlive the people who made the decision — why · what evidence · what
  assumptions · what happened · what we learned · would we decide again.
- **Executive Narratives** (`/narratives` + `GET /api/v1/intelligence/narrative`):
  written weekly/monthly/quarterly briefs composed live from every engine —
  situation, what changed, what to do, risk posture, and "are we getting
  smarter?". Deterministic prose over real numbers; reproducible, not generated.
- **Demo mode now ships a coherent decision-memory graph** (previously empty),
  so every memory/decision surface is demonstrable offline.
- **Readiness probe** (`/api/ready`) that performs a real backend read (verified
  live: `ready:true`, 264ms Supabase round-trip) — distinct from liveness.
- +7 tests (**174 total**); typecheck/lint/build clean. Live-verified on Supabase
  (graceful degradation: lineage reads no-op until 0011 is applied to that DB).

## §12 — Honest re-scoring (post both June-14 waves)

> Two principles held throughout: (1) move a score only by the work that genuinely
> earned it; (2) **do not invent 10s.** Several dimensions *cannot* legitimately
> reach 10 from code alone — they are gated on a real customer, real org data over
> real time, a SOC2 auditor, and live SSO providers. Faking this scorecard would
> contradict the product's entire premise (honest, falsifiable computed
> intelligence). What follows is what the code now actually earns.

| Dimension | Start | Now | Gap→10 | What still blocks 10 |
|---|---|---|---|---|
| Architecture | 7.5 | 7.6 | 2.4 | Demo/live split, no CI DB-migration runner, lossy mappers. |
| Backend | 7.5 | 7.9 | 2.1 | Lineage + lifecycle repos on both backends, hardened PostgREST client, graceful degradation. Remaining: full mutation/optimistic coverage. |
| Security | 6.5 | 6.5 | 3.5 | Actions permission-gated + audited; **real auth (Supabase Auth + JWT claims) still the P0 blocker.** |
| Multi-Tenancy | 6.5 | 6.6 | 3.4 | New tables carry `org_id` + RLS; org threading through every loader still partial; verified only vs demo JWTs. |
| Intelligence | 7.5 | 8.3 | 1.7 | Recommendations are tracked entities; narratives compose all engines; assumption-aware memory. Remaining: prove scores predict reality on real data. |
| Simulation | 7.5 | 7.5 | 2.5 | Untouched; needs Monte-Carlo + real-data validation. |
| Memory | 6.0 | 7.2 | 2.8 | Lineage ontology (Evidence/Assumption/Hypothesis) + workspace shipped. Remaining: vendor/system/process entities, temporal history, real records. |
| Copilot | 5.0 | 6.0 | 4.0 | Grounded learning intents over real outcomes; **still deterministic — GraphRAG + LLM is the path to 8+.** |
| UI | 6.5 | 7.6 | 2.4 | Four new reasoning-first surfaces in the design language. Remaining: per-page premium polish + a11y audit. |
| UX | 6.0 | 7.0 | 3.0 | Act-on-intelligence + read-the-brief + recall-the-decision are now first-class flows. Remaining: realtime, onboarding, empty-states everywhere. |
| Enterprise Readiness | 2.0 | 2.2 | 7.8 | Readiness probe added; **needs SSO/SAML + SCIM + SOC2 (auditor-gated) — not code-only.** |
| Production Readiness | 3.0 | 3.8 | 6.2 | CI (typecheck/lint/test/build) + readiness probe + honest demo mode. Remaining: real auth, CI migrations, load testing, error tracking. |
| Startup Readiness | 4.0 | 4.6 | 5.4 | A real "observe→act→learn→prove" demo story now exists. **No customer/data still dominates.** |
| Defensibility | 5.0 | 5.8 | 4.2 | Feedback loop + falsifiable lineage are the moat's mechanism — **only real once it runs on real history.** |
| Adoption Readiness | 3.0 | 3.5 | 6.5 | Sharper wedge (act on advice → see if it worked → recall why). **Still no ingestion/auth = no real adoption path.** |
| PMF Readiness | 3.0 | 3.4 | 6.6 | The mechanism to *prove* value exists; **value itself is unproven without a real org using it.** |

### Why the remaining gaps are not code I can write today
- **Auth → Security/Multi-Tenancy/Production**: the *code path* (Supabase Auth, `/auth/callback`, JWT role/org claims) is buildable, but reaching 9+ requires live providers + removing demo personas + verifying RLS against real JWTs. Honest cap without that: ~6–7.
- **PMF / Adoption / Startup / Defensibility → 10**: definitionally require a real organization's data and a leader using it over weeks. No amount of code makes these 10; they become provable, not assertable.
- **Enterprise/Compliance → 10**: SSO/SCIM are buildable to ~7; SOC2 is auditor-gated (months, external).

**Bottom line:** this wave pushed every *code-addressable* dimension up legitimately —
Intelligence 8.3, Memory 7.2, UI 7.6, Production 3.8. The platform can now observe,
recommend, act, measure, learn, calibrate, narrate, and remember — with falsifiable
reasoning. It still has not *learned anything real*. The single highest-leverage
action is unchanged and is **not** more code: **one real organization's data in, a
leader acting on it weekly, and enough measured outcomes to show the accuracy curve
bends upward.** Anyone who marks this 10/10 today is doing the one thing the product
exists to prevent — trusting a number that reality hasn't checked.
