# DIZRUPT — Feature Documentation

> The operating system for your organization: capacity, execution, memory, and
> strategy in one command center. This document describes every feature in the
> current build, who it serves, how it behaves, and where it lives in the code.
>
> App root: [`dizruptos/`](dizruptos/) · run with `cd dizruptos && npx next dev -p 5175`

---

## 1. Audience & roles

DIZRUPT is a multi-persona product. Every screen reshapes itself by role
(dynamic view architecture): the same URL shows a different system depending
on who is looking.

| Persona (demo) | Role | What they get |
|---|---|---|
| Asha Venkat | `project_manager` | Capacity, reallocation, proposals review |
| Noor Al-Rashid | `executive` | Executive intelligence, financials |
| Priya Sharma | `dept_head` | Everything operational + audit + executive |
| Ahmed Hassan | `employee` | Own work; no capacity/burnout/audit views |
| Elias Brandt | `admin` | Full access including audit and overrides |

The permission matrix lives in [`src/lib/session.ts`](dizruptos/src/lib/session.ts)
(`MATRIX`): `view_capacity`, `reallocate`, `view_burnout`, `view_financials`,
`view_audit`, `review_proposals`, `view_executive`. Navigation items, page
sections, and burnout flags all check `can(permission)` — UI never trusts
itself; the production swap point is Supabase Auth claims.

---

## 2. Public surfaces

### 2.1 Landing page — `/welcome`
Cinematic marketing page. Hero headline with word-reveal, **45° perspective
product frame** that scroll-scrubs flat (`useScroll`/`useTransform`), a
**sticky scrollytelling section** (four chapters: capacity, graph, agents,
memory — active copy ignites, visuals crossfade), bento feature grid, live
number-ticker stats band, method cards, testimonial carousel, aurora CTA.
Full-bleed **dot-matrix WebGL field** (custom shaders, breathing pulse,
pointer drift) plus a cursor-following mouse glow.
Code: [`src/app/welcome/page.tsx`](dizruptos/src/app/welcome/page.tsx),
[`src/components/landing/product-frame.tsx`](dizruptos/src/components/landing/product-frame.tsx).

### 2.2 Login — `/login` ("Disruption Entry")
- **Chromatic glitch-in**: the card RGB-splits (cyan/magenta) for ~0.5s and
  snaps sharp (`.glitch-in`, steps-based keyframes).
- **Encrypted-to-cleartext titles**: `DIZRUPT // ACCESS` scrambles to
  legibility on mount (`TextScramble`).
- **Glitch submit**: hovering the CTA emits a rapid chromatic flicker
  (`.btn-glitch`).
- **Seismic auth transition**: on success the card fractures along a diagonal
  fault line — two glass shards slide apart with a volt flash — then the
  command center loads.
- **Side animation**: the left brand stage runs the self-healing neural mesh
  (WebGL constellation; edges ignite between drifting nodes) under an
  electromagnetic-interference sweep at ~3% opacity.
- Auth flow: `POST /api/auth/login` issues an httpOnly `dz_session` cookie;
  edge middleware refuses shell routes without it. Single-session model
  documented in PRD §14.1.

---

## 3. The operating shell

Sidebar (3 nav groups: Operate / Intelligence / Review), topbar (route title
with reveal animation, optimistic-action toast, presence badge, theme toggle,
keyboard-shortcuts panel, ⌘K search, notification inbox), command palette
(`cmdk`), task drawer, guardrail modal. Every route entrance is choreographed
by [`(shell)/template.tsx`](dizruptos/src/app/(shell)/template.tsx) (~220ms
rise, 30ms stagger), and route loading shows an instant **volt bar-loader**
pulse over a skeleton that matches the dashboard layout.

- **Theme**: explicit Light/Dark slider toggle (spring pill). Persisted in
  `dizrupt-session` localStorage; a no-flash script resolves theme before
  first paint. All neutrals are CSS-variable RGB triplets — components never
  hardcode a neutral.
- **Keyboard**: `?` opens the shortcuts panel; `⌘K` the palette; list/grid
  navigation per page.
- **Realtime**: cross-tab presence + state sync via BroadcastChannel
  ([`src/lib/realtime.ts`](dizruptos/src/lib/realtime.ts)); the production
  swap is Supabase Realtime on the same contract.

---

## 4. Screens (Operate)

### 4.1 Command Center — `/`
The Resource Manager's Monday morning in one screen, tuned for a **two-second
first glance**:
1. **Situation banner** (the single `CriticalFrame` of the view): the one
   thing that matters now, with three computed one-click actions.
2. **Pulse strip**: four numbers on one calm line — over-allocation %,
   projects at risk, decisions awaiting, commitments overdue. Every number
   carries an `Explain` popover with the causal signals behind it; detail
   never crowds the glance.
3. **Capacity hotlist** (top 4): segmented load meters per person (see §7),
   burnout flags (manager-private, permission-gated).
4. **Needs your decision**: top agent proposals, two clicks from resolution.
5. Portfolio health cards + live audit feed below the fold.

### 4.2 Capacity Heatmap — `/capacity`
8-week × person matrix. Cells color by load (<80% green · 80–99% amber ·
≥100% red); the "now" column is brand-tinted and carries draggable task
chips. **Drag a chip onto a green row** and both load bars update in <50ms
(optimistic, with guardrail interception). Org-load headline strip with
ticking average; department filter chips; min-width matrix so density never
collapses — it scrolls horizontally instead.

### 4.3 Projects — `/projects`, `/projects/[id]`
Portfolio cards with computed health (never manually set: overdue ratio,
stalled dependencies, velocity). Detail page: kanban board with drag,
velocity trend, budget burn, health reasons, task drawer.

### 4.4 People — `/people`, `/people/[id]`
TanStack-table directory: utilization this week, headroom hours, skills,
expertise depth scores. Sticky header inside its own scroll container.
Sortable columns, search across name/skill. Detail page: profile, allocation,
expertise, active work.

## 5. Screens (Intelligence)

### 5.1 Executive — `/executive`
OHI (Org Health Index) trend, drift series, attention list. Summary first,
drill-down always. Permission-gated (`view_executive`).

### 5.2 Risk Register — `/risks`
Probability × impact **severity matrix** (severity is computed law, never
hand-set — [`src/lib/risk.ts`](dizruptos/src/lib/risk.ts)) and the register:
each risk card carries a **severity color rail** on its left edge, status +
category chips, mitigation plan with status-colored state, owner and project
links, and the signals that raised it behind an `Explain`. Clicking a matrix
marker highlights its card.

### 5.3 Decisions — `/decisions`
The decision ledger: who decided, when, rationale, status
(Active/Superseded), linkage to entities. Institutional memory that survives
reorgs.

### 5.4 Goals & OKRs — `/goals`
Strategic intents with progress; every hour of work traces to one.

## 6. Screens (Review)

### 6.1 Agent Negotiation Inbox — `/proposals`
AI agents (burnout safety, delivery critical, risk advisory, negotiation
coordinator) stage proposals with confidence scores and full causal chains.
Conflicting proposals are merged into a single **coordinated compromise**
card. Actions: accept / reject — each lands in the audit log. AI output is
validated before render ([`src/lib/ai.ts`](dizruptos/src/lib/ai.ts)).

### 6.2 Dependency Graph — `/graph`
React Flow rendering of the **generic relationship layer**
([`src/lib/graph.ts`](dizruptos/src/lib/graph.ts)): typed edges (canonical
registry — `funds`, `produces`, `threatened_by`, `causes`, `mitigates`, …)
with strength, confidence, and evidence provenance (`·~` marks inferred).

The two chips above the canvas are **interactive lenses**:
- **"What breaks if Sarah leaves?"** — click to run the 3-hop blast-radius
  traversal (`reachable()`): affected entities stay lit, everything else
  recedes to 10%, and a breakdown panel lists each entity with hop distance.
- **"Payments bus factor"** — click to see expertise concentration
  (`expertiseConcentration()`): the capability and its holders highlight, and
  the panel shows each holder's share of depth as a bar (red >60%, amber
  >40%) plus the live mitigation (the cross-training edge).
Click the active chip (or ×) to release the lens. Hovering any node still
ignites its direct edges. Cycle prevention for dependency edges is
server-side DFS (`wouldCreateCycle`).

### 6.3 Audit Log — `/audit`
Insert-only, tamper-proof event stream (UPDATE/DELETE revoked at the
database). Filter by text and action type. The table lives in its own scroll
container with a pinned header — rows can never escape above it. Live-updates
as you act elsewhere (reallocations, overrides, proposal reviews land here
instantly).

---

## 7. Design-system components

[`src/components/ui/primitives.tsx`](dizruptos/src/components/ui/primitives.tsx):
- **CapacityBar** — segmented load meter: ten cells to 100%, a gap (the
  threshold gate), then two red overload cells. Discrete, scannable state;
  the leading cell glows.
- **HealthPill / TaskStatusPill / SeverityBadge** — icon + text, never color
  alone.
- **Explain** — the doctrine component: no score ships without the "why"
  popover listing stored causal signals.
- **MetricTile, EmpAvatar, SectionHeader, EmptyState, Button** (primary
  volt-on-dark-text, secondary, ghost, danger).

FX layer ([`src/components/fx/`](dizruptos/src/components/fx/)):
`DotMatrixField` (shader dot plane), `NeuralField` (constellation mesh,
container-scoped, idle-parking), `RevealText`, `TextScramble`, `BarLoader`,
`FxProvider` (cursor spotlight on `.panel`s). All collapse under
`prefers-reduced-motion`. Budget rules: ≤1 `CriticalFrame` per view; WebGL
only on public pages; the shell stays flat and solid.

---

## 8. Backend & data architecture (current tier → production map)

- **Data layer**: deterministic in-memory dataset
  ([`src/lib/data.ts`](dizruptos/src/lib/data.ts)) mirroring the production
  schema; [`supabase/`](dizruptos/supabase/) holds the executable SQL schema
  (RLS, insert-only audit, RBAC).
- **State**: Zustand stores — `useOps` (operational state, optimistic
  mutations, audit emission) and `useSession` (identity, theme,
  permissions). Cross-tab sync via BroadcastChannel.
- **API routes**: `/api/auth/login`, `/api/auth/logout` (httpOnly cookie
  session), `/api/health`.
- **Edge middleware**: route protection + OWASP security headers (CSP,
  frame-ancestors none, nosniff, referrer-policy, permissions-policy).
- **AI validation**: every agent proposal passes schema + bounds validation
  before render; confidence and evidence are first-class fields.
- **Guardrails**: reallocation that pushes a person past the threshold trips
  the guardrail modal and requires an override reason — which is stored on
  the audit event.

## 9. Verification

`npm run typecheck` · `npm run lint` · `npm test` (Vitest, 40 tests across
risk law, graph traversals, AI validation, store logic) · `next build`
(19 routes + middleware). Do **not** run `next build` while the dev server is
running — they share `.next`.

## 10. Known seams / next

- Scenario engine UI (budget-cut / headcount simulations) — graph utilities
  are already shared with it.
- Admin feature tier (user lifecycle, role management, data export).
- Supabase production swap (auth, realtime, RLS) — all contracts in place.
