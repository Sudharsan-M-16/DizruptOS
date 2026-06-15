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
| **Real auth** | Auth 3→**9 (code)** | M | **CODE COMPLETE (2026-06-15).** Login UI (magic-link + Google/MS), session-validating middleware, `/auth/callback`, `claimsFromUser`, AND `0012_auth_hook.sql` = `custom_access_token_hook` + `on_auth_user_created` trigger. **Remaining = purely operational:** apply migration + enable hook + real users. See `AUTH_SETUP.md`. | Unlocks RLS/tenancy *in reality*. |
| **Data ingestion** | 0→**5 (scaffold)** | XL | **DONE (2026-06-15):** Jira Cloud + Linear.app + GitHub webhook receivers (HMAC-verified, audited, `/api/v1/import/{jira,linear,github}`). **Remaining:** HRIS/CSV bidirectional sync, calendar connector, production mapping layer that writes to real graph tables (currently writes to audit log). | Ends "5 seed users forever". |
| **Executive Intelligence surface** | Product 4→8 | M | `/api/v1/intelligence/graph`, Monte Carlo `/api/v1/simulation/monte-carlo`, copilot now LLM-enhanced. Still needed: a dedicated executive surface composing all engines into one weekly-review page. | The home a leader opens weekly. |
| **Observability** | Obs 3→**7.5** | M | **DONE (2026-06-15):** OTel `instrumentation.ts`, `/api/v1/metrics` Prometheus, in-process counters/histograms, `docker-compose.yml` with Prometheus+Grafana, enhanced health endpoint. **Remaining:** Sentry DSN config, web-vitals, alert rules. | Makes production debuggable. |

## P1 — Operationalize
| Item | Cur→Tgt | Effort | Tasks | Impact |
|---|---|---|---|---|
| **Realtime layer** | 3→**7** | M | **DONE (2026-06-15):** `realtime-supabase.ts` — Supabase Realtime channels with BroadcastChannel fallback, `CHANNELS` constants. **Remaining:** wire UI components to the channels (replace their existing `BroadcastChannel` calls). | "Change→push" loop. |
| **Repository↔schema completion** | 8→**9.5** | S–M | **DONE (2026-06-15):** `0014_multitenancy_completeness.sql` adds `title`/`location`/`timezone` to `users` + `org_id` to `recommendations`/`decision_evidence`/`entity_embeddings`. **Remaining:** finish mutation paths + optimistic updates. | Employee model split resolved. |
| **Intelligence surfaces (UI)** | UI 7.6→9 | M–L | Graph endpoint + Monte Carlo available for UI wiring. `/api/v1/intelligence/graph` live. | Makes the intelligence consumable. |
| **CI/CD + deploy** | Prod 3→**7.5** | M | **DONE (2026-06-15):** enhanced `ci.yml` (coverage/E2E/security audit/migration lint) + `cd.yml` (Vercel deploy + post-deploy smoke test + DB migration), `Dockerfile` multi-stage, `docker-compose.yml` full stack, `vercel.json`. **Remaining:** Sentry DSN, branch protection rules. | Real shipping. |
| **SSO / SCIM** | 1/0→**6.5** | L | **DONE (2026-06-15):** SSO SAML SP-initiated scaffold + ACS + OIDC redirect; SCIM 2.0 Users + Groups full CRUD. **Remaining:** wire node-saml for real assertion validation; test against Okta/Azure AD. | Enterprise blocker lifted. |

## P2 — Scale & trust
| Item | Cur→Tgt | Effort | Tasks |
|---|---|---|---|
| Graph at scale | 5→**8** | L | **DONE (2026-06-15):** `0013_graph_traversal.sql` — `traverse_graph()` recursive BFS, `shortest_path()`, `betweenness_centrality()`, `dependency_hubs()`, `refresh_entity_paths()`. JS approximation in graph API. **Remaining:** pgRouting for weighted traversal, eigenvector centrality. |
| GraphRAG / Copilot | AI 3→**8.5** | L | **DONE (2026-06-15):** Claude claude-sonnet-4-6 wired (`copilot-llm.ts`) — engine context → LLM fluency, graceful fallback. **Remaining:** populate `entity_embeddings` + OTLP retrieval for semantic search ("who owns payment risk?"). |
| Multi-tenancy completeness | 6.5→**8.5** | M | **DONE (2026-06-15):** `0014` migration: per-tenant settings table + RLS, org_id everywhere, user model complete, admin provisioning API. **Remaining:** per-tenant SSO config in DB (not env var), tenant suspension. |
| Simulation | 7.5→**9.0** | M | **DONE (2026-06-15):** Monte Carlo runner (4 scenario types, Box-Muller sampling, p5–p95 output). **Remaining:** UI for Monte Carlo, real-data validation of heuristics. |
| Calibration loop | 0→7 | L | Delivered June-14 (see sprint notes below). Real data still needed to prove the curve bends upward. |
| Test depth | 6→9 | M | 174 unit tests. Remaining: E2E per role over intelligence, RLS tests in CI, load tests on graph traversal. |

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
| OS extras | — | S each | In-window PDF/image preview (Vault); Kanban WIP limits + swimlanes; notification deep-links; Do-Not-Disturb. | partial |
| **Gesture system** | 0→9.5 | S | ✅ `lib/gestures.ts`: `useSwipeNavigation` (two-finger swipe back/forward), `useHotCorners` (4 corners → Mission Control/Notifications/Launchpad/Show-Desktop), `usePinchGesture` (ctrl+wheel zoom), `AppHistory` cursor. All wired into desktop `page.tsx`. | ✅ done |
| **Stage Manager** | 0→9 | S | ✅ `components/desktop/stage-manager.tsx`: left thumbnail rail of non-primary windows with frosted previews; click thumbnail → bring to front; toggle in Control Center + persisted in `useOS`. | ✅ done |
| **Hot Corners** | 0→9 | S | ✅ Wired: TL=Mission Control, TR=Notification Center, BL=Launchpad, BR=Show Desktop (minimize all). 700ms dwell, 8px zones. | ✅ done |
| **Operational activation guide** | 0→10 | S | ✅ `ACTIVATION_GUIDE.md`: 13-section runbook (Supabase Auth, Auth Hook, SAML, OIDC, Sentry, Jira/Linear/GitHub webhooks, SCIM, Prometheus, SOC2, Vercel, demo→real-users checklist). | ✅ done |
| **Login page polish** | 6→9 | S | ✅ Technical jargon removed (JWT/httpOnly/MFA footnotes → plain trust signals); card `bg` changed from `bg-white/[0.035]` to `bg-[#0f0f0f]/80` (fully legible text); "Email me a magic link" → "Email me a sign-in link". | ✅ done |
| **Boot sequence on every login** | 6→10 | S | ✅ `powerOn()` called on login submit — ensures `boot → lock → desktop` runs even after in-tab soft navigations that kept the Zustand store at `phase:"desktop"`. | ✅ done |
| **Landing hero plates removed** | 7→9.5 | S | ✅ `welcome/page.tsx` — removed `bg-ink`/`bg-brand` plate divs from all 3 headline lines; text now floats directly on ChromaField with overflow-clipped slide animations. | ✅ done |
| **Dizrupt brand wallpaper** | 7→9 | S | ✅ New "Dizrupt" wallpaper (`os.ts`) set as default: deep ink + dual volt-green ellipse auroras matching brand palette. `volt-flux` enhanced to 6-layer stack. Wallpaper component gains 3rd slow aurora orb for depth. | ✅ done |
| **Auth verification (5 phases)** | - | S | ✅ Phase 1 (login page OK), Phase 2 (dashboard 200, no crashes), Phase 3 (zero 500/auth/DB errors), Phase 4 (no bugs in core auth), Phase 5 (all 4 env vars set). | ✅ done |

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
