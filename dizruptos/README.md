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
moment Supabase is configured (the demo flow is untouched until then): email sign-in
link (passwordless) + Google/Microsoft login (`components/auth/real-auth-form.tsx`), session-validating
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

## Enterprise Scaling Considerations

While DizruptOS is built on a production-ready modern stack, the current architecture is optimized for demonstration and rapid evaluation. In a true Fortune 500 deployment, the following architectural upgrades would be implemented to handle massive scale:

1. **Authentication & Demo Bypass**: The `dz_session` fallback in `middleware.ts` exists strictly to remove friction for recruiters and evaluators reviewing this portfolio project. In a live production environment, this demo logic must be entirely removed, strictly enforcing Supabase JWT validation.
2. **Asynchronous Background Processing**: Currently, AI simulations and graph computations run synchronously on Next.js serverless functions. To prevent Vercel 504 timeout limits during complex organizational shifts, these heavy workloads would be moved to an asynchronous event-driven queue (like Temporal or Inngest) with WebSockets pushing updates back to the client.
3. **Graph Rendering Performance**: The organizational graph currently utilizes `@xyflow/react` (DOM-based rendering), which is beautiful and flawless for 100-300 nodes. For a massive enterprise graph (e.g., 50,000+ nodes), the rendering engine would be upgraded to a WebGL/Canvas solution to prevent browser lag.
4. **Database RLS Integration Testing**: The current test suite boasts 329 passing unit tests demonstrating logic and state management correctness. At an enterprise scale, this would be supplemented by hardcore database integration tests explicitly validating Supabase Row Level Security (RLS) policies against a live test database.

## Deploy

### Vercel (recommended)

1. **Import** the repo into Vercel. Set the **Root Directory** to `dizruptos`.
2. **Add environment variables** in Vercel → Project → Settings → Environment Variables:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | For real auth | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For real auth | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | For admin APIs | Keep server-only; never expose to client |
| `DATABASE_URL` | For Drizzle/direct queries | Use **Session Pooler** URI (port 5432 via pgBouncer) — the direct `db.*.supabase.co` is IPv6-only |
| `ANTHROPIC_API_KEY` | For AI copilot | Without it copilot falls back to deterministic answers |
| `SENTRY_DSN` | For error tracking | Get from sentry.io → Projects → your project |
| `JIRA_WEBHOOK_SECRET` | For Jira integration | Any random string; set same value in Jira webhook config |
| `LINEAR_WEBHOOK_SECRET` | For Linear integration | Provided by Linear in webhook settings |
| `GITHUB_WEBHOOK_SECRET` | For GitHub integration | Any random string; set same value in GitHub webhook config |
| `CORS_ALLOWED_ORIGINS` | Optional | Comma-separated list of additional allowed origins (e.g. your mobile app domain) |
| `NEXT_PUBLIC_APP_URL` | Recommended | Full URL of the deployment (e.g. `https://app.dizrupt.com`) |

3. **Deploy.** Vercel runs `next build` automatically.
4. **Apply Supabase migrations** (first deploy only):
   ```bash
   supabase db push --db-url "$DATABASE_URL"
   # or run dizruptos/supabase/setup_all.sql in the Supabase SQL editor
   ```
5. **Enable the Auth Hook** in Supabase dashboard → Authentication → Hooks → `custom_access_token_hook` → enable.
6. **Create your first admin user**: sign up via `/login`, then in Supabase SQL editor:
   ```sql
   UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';
   ```

### Docker

```bash
# Build
docker build -t dizruptos ./dizruptos

# Run (set env vars via --env-file or -e flags)
docker run -p 3000:3000 \
  --env-file .env.production \
  dizruptos

# Or with docker-compose (includes Redis + Prometheus + Grafana)
docker-compose up
```

The `Dockerfile` in `dizruptos/` is a multi-stage, non-root build. Port 3000.

### Health check

`GET /api/health` returns `{ ok: true, mode, services: { db, ai, realtime } }`. Use this as the load balancer health check endpoint.

---

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
