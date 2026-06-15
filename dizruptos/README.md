# DIZRUPT — Resource Intelligence Platform, as a web OS

A premium enterprise command center for workforce capacity, project execution,
organizational memory, and AI-agent collaboration — delivered as **DizruptOS**, a
macOS-style **web operating system**. Built from `DIZRUPT_Supreme_PRD_v3.md` and the
DizruptOS UI inspiration brief.

## DizruptOS desktop shell

Signing in powers on an OS: **boot → lock → desktop**. The desktop (`/`) provides

- a **window manager** — drag, 8-way resize, edge-snap (half-tile / zoom), genie
  minimize-to-dock, z-order focus, and **per-user layout persistence**;
- a magnifying, **customizable Dock** (pin/unpin, launch-bounce, running dots);
- a **Menubar** with the  menu, app menus, a live **Control Center** (light/dark +
  accent + wallpaper + brightness), a grouped **Notification Center**, and a calendar;
- **Spotlight** (⌘Space), **Mission Control** (F3), **Launchpad** (F4), a desktop
  right-click context menu, and **window cycling** (⌘\`);
- **routes-as-windows** — every legacy product page opens in a draggable window
  (chromeless iframe), so nothing from the original dashboard was lost;
- native apps: **Home** (per-role Today/Pending/Critical task center, classified by
  project), **Project Matrix** (drag-and-drop Kanban), **Operative Directory**
  (people), **Knowledge Vault** (IndexedDB file store), and **System Settings**.

RBAC is enforced in **3 layers** (UI + OS surface + data-layer mutation denial, with
audited denials), apps hide/deny by the viewer's role permission
(`lib/desktop-apps.tsx` × `lib/personas.ts`). OS state lives in `lib/os.ts` (`useOS`);
the window engine is `components/desktop/use-desktop.ts`. The menubar carries live
**battery + network** status, a clickable **profile** (switch account), Control Center,
Notification Center and a calendar.

## Real auth (Supabase) — code-complete, env-gated

The demo runs on personas; **real authentication is fully wired** and activates the
moment Supabase is configured (the demo flow is untouched until then): magic-link +
Google/Microsoft login (`components/auth/real-auth-form.tsx`), session-validating
`middleware.ts`, `/auth/callback`, JWT claim reader (`lib/auth-supabase.ts`), and the
server-side **Auth Hook + first-signup auto-provision** in
`supabase/migrations/0012_auth_hook.sql`. Going live is a migration + one dashboard
toggle — see **`AUTH_SETUP.md`**.

## Run

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build (all routes verified)
npm test          # vitest — product laws + RBAC authority
npm run e2e       # Playwright smoke (login → command center, RBAC assertions)
```

## Backend (live Supabase)

Demo mode runs fully on the in-memory seed (no config needed). For live
persistence, set in `dizruptos/.env.local` (git-ignored, never committed):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # server-only
DATABASE_URL=...                      # use the Session Pooler URI (IPv4); the
                                      # direct db.*.supabase.co:5432 is IPv6-only
```

- Schema: `supabase/migrations/0001_core_schema.sql` + `0002_grants_and_rls_fixes.sql`
  (32 tables, RLS on every table, audit triggers, `reallocate_task` RPC).
- Seed: `supabase/seed.sql`. Health/mode: `GET /api/health`.
- **Domain model is schema-authoritative** (Option A): the DB is the source of
  truth; the app layer uses thin camelCase views (TanStack Query via `lib/query.ts`).
  Evidence: [`../BACKEND_READINESS_AUDIT.md`](../BACKEND_READINESS_AUDIT.md).

> Continuation manual: see [`../MASTER_EXECUTION_PLAN.md`](../MASTER_EXECUTION_PLAN.md)
> — full architecture, catalogs, debt register, and version-by-version roadmap.

## Stack

Next.js 14 App Router · TypeScript · Tailwind CSS · Radix primitives ·
Framer Motion · TanStack Table · cmdk · @xyflow/react · Recharts · Zustand.
Typography: IBM Plex Sans / IBM Plex Mono (tabular data) + Sora display.

## Surfaces

| Route | What it does |
|---|---|
| `/` | Command Center — over-allocation rate, capacity hotlist, agent inbox preview, portfolio health, live audit feed |
| `/capacity` | **The wedge.** Employees × 6-week heatmap. Drag task chips from red rows to green — optimistic update, ≥100% trips the hard-stop override modal, every move lands in the audit log |
| `/projects` · `/projects/[id]` | Portfolio cards → detail with "why this status" causal-signal panel, drag-between-column Kanban, linked risks & decisions |
| `/people` · `/people/[id]` | TanStack dense directory (skill search, load-sorted) → profile with capacity ring, expertise depth, manager-private burnout panel |
| `/executive` | Revenue-at-risk, strategy drift, OHI, burnout rate — every tile explains itself; drift-vs-OHI chart; AI morning brief with source links |
| `/proposals` | Agent Negotiation Inbox — priority hierarchy, coordinated-compromise cards, causal reasoning + pre-surface validation, 2-click approve/reject with 30-day rejection memory |
| `/risks` | Probability × impact severity matrix (auto-computed) + signal-carrying register |
| `/decisions` | Decision timeline — rationale, options weighed, expected vs actual outcome calibration |
| `/goals` | OKR scorecard with project traceability |
| `/graph` | React Flow organizational graph with canonical typed edges (`funds`, `threatened_by`, `causes`…) |
| `/audit` | Insert-only audit table — live-updates from your own actions, override reasons surfaced |

## Doctrine encoded in code

- **Never a score without a why** — `Explain` popover wraps every metric, health badge, and burnout flag with stored causal signals.
- **Two-Click Rule** — reallocate from heatmap drag or task-drawer shortlist; approve/reject proposals from one card.
- **Invisible guardrails** — capacity drops projecting ≥100% open a typed-override modal; the reason is written to the audit log (`store.ts`).
- **Atomic capacity math** — `utilization = Σ estimated hours due in week ÷ weekly capacity`; mutations are deltas, never overwrites.
- **Agents propose, humans decide** — approvals execute through the same reallocation path as manual drags; rejections write agent memory.

## Where the backend goes

`src/lib/data.ts` is a typed seed of the PRD's schema (§12). Swap it for
Supabase reads and replace the Zustand mutations in `src/lib/store.ts` with
the PRD's RPCs (`/tasks/reallocate` with advisory lock, dept-scoped Realtime
channels) — the optimistic-update / rollback shape is already in place.
