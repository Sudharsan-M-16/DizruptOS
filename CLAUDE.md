# CLAUDE.md — DIZRUPT Project Rules

## Current project reality (read first)
- The product is a **Next.js 14 App Router app in `dizruptos/`** (not a static site).
- **The dashboard (`/`) is a macOS-style web OS — "DizruptOS".** It boots (boot → lock → desktop), runs a window manager (drag / 8-way resize / snap / genie-minimize / z-order / per-persona layout persistence in `localStorage` `dz-os-layout:<personaId>`), a magnifying customizable Dock, a Menubar ( menu + app menus + Control Center + Notification Center + calendar), and overlays: Spotlight (⌘Space), Mission Control (F3), Launchpad (F4). **Every legacy route opens *as a window*** (chromeless iframe via `?embed=1` — see `shell-frame.tsx` embed mode + `frame-ancestors 'self'` in `middleware.ts`), so no functionality was lost in the redesign. Native apps: **Home** (per-role task command center), **Project Matrix** (DnD Kanban), **Operative Directory** (people), **Knowledge Vault** (IndexedDB files). App registry + RBAC gating live in `lib/desktop-apps.tsx`; OS state in `lib/os.ts` (`useOS`); window manager in `components/desktop/use-desktop.ts`. Launch any app by dispatching `CustomEvent("dizrupt:launch",{detail:{id}})`.
- **Run:** `cd dizruptos && npm run dev` → **http://localhost:3000** (plain `next dev` default; the old 5175 note is stale). Build `npm run build`, tests `npm test` (vitest), `npm run e2e` (Playwright smoke).
- **Backend:** live **Supabase** when `dizruptos/.env.local` is set (URL/anon/service-role/`DATABASE_URL`); otherwise demo mode on the in-memory seed. `DATABASE_URL` must be the **Session Pooler** URI (IPv4) — direct `db.*.supabase.co:5432` is IPv6-only. **Never print/commit secrets.** Migrations + seed live in `dizruptos/supabase/`.
- **Domain model is schema-authoritative (Option A):** the Postgres schema is the source of truth; app layer uses thin camelCase views + TanStack Query (`lib/query.ts`). RBAC: `lib/personas.ts` (matrix) + `useSession.can()`, now also enforced at the OS layer (apps hide/deny by `perm`).
- Key docs: `SUPREME_PLATFORM_AUDIT.md` (honest ratings — frontend/UX **9.9**, design **9.1**, auth code-readiness **9**, enterprise **6.5**, production **7.6**, architecture **9**, copilot **8.5**), `ROAD_TO_10.md`, `PLAN.md`, `README.md`, `AUTH_SETUP.md`, `SOC2_CONTROLS.md`.
- **Real auth (Supabase) is code-complete & env-gated:** `lib/auth-supabase.ts`, `components/auth/real-auth-form.tsx`, `app/auth/callback/route.ts`, async session-validating `middleware.ts`, **`supabase/migrations/0012_auth_hook.sql`** (custom access-token hook + auto-provision trigger). Going live = apply migration + enable the dashboard hook + real users.
- **Enterprise scaffolding (2026-06-15):** SCIM 2.0 full provisioning API (`/api/v1/scim/`), SSO SAML SP-initiated + ACS + OIDC (`/api/auth/sso/`), `SOC2_CONTROLS.md`, per-tenant settings DB (`0014`), admin provisioning API (`/api/v1/admin/`).
- **AI Copilot (2026-06-15):** `server/engine/copilot-llm.ts` wires Claude claude-sonnet-4-6 — engine builds grounded context, Claude enhances delivery with 8s timeout + deterministic fallback. Set `ANTHROPIC_API_KEY` to enable.
- **Production stack (2026-06-15):** `Dockerfile` (multi-stage/non-root), `docker-compose.yml` (app+Redis+Prometheus+Grafana), `vercel.json` (OWASP headers/CSP/crons), `/api/v1/metrics` Prometheus, `instrumentation.ts` OTel hook, enhanced `/api/health` capabilities manifest.
- **Graph at scale (2026-06-15):** `0013_graph_traversal.sql` — recursive CTE BFS + betweenness centrality + dependency hubs + path materialization. `/api/v1/intelligence/graph` with JS fallback.
- **Ingestion connectors (2026-06-15):** `/api/v1/import/{jira,linear,github}` — HMAC-verified webhook receivers that write to audit trail. Monte Carlo simulation: `/api/v1/simulation/monte-carlo`.
- **Realtime (2026-06-15):** `lib/realtime-supabase.ts` — Supabase Realtime channels with BroadcastChannel fallback. `CHANNELS` constants for org-level topics.
- **Login page:** `/login` — Nexus design system (dark `#0A0A0A`, orange `#F97316`, Newsreader serif, glass card `bg-[#0f0f0f]/80`, "Email me a sign-in link" (not "magic link"), plain-language trust signals, no tech jargon). `powerOn()` called on submit so boot sequence always runs.
- **Boot sequence:** `phase` is NOT persisted — always starts `"boot"`. Login page calls `powerOn()` before navigating to ensure the sequence resets on in-tab navigation too.
- **Wallpaper:** default is "dizrupt-brand" (deep ink + volt-green ellipse auroras). "Volt Flux" has 6-layer radial stack. Wallpaper component has 3 animated aurora orbs.
- **Landing hero:** `/welcome` — text ("DIZRUPT", "every person. every project.", "every consequence.") uses overflow-clipped slide animations directly on type with NO colored plate backgrounds.
- **Standing routine (this session):** every prompt → re-read `SUPREME_PLATFORM_AUDIT.md` + `ROAD_TO_10.md`, push every metric toward 10 in code where possible, then update those two docs + `PLAN.md` + `README.md` + this file. Be honest: don't inflate infra-gated scores (real auth live, SSO live, SOC2 auditor, real users) — code-readiness ≠ operational.

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the app: `cd dizruptos && npm run dev` → **http://localhost:3000**. Start it in the background before screenshots.
- If a server is already running, do not start a second instance. Beware orphaned `next dev` processes piling up and serving 500s — kill project Next procs + clear `.next/cache` before a clean start.

## Screenshot Workflow (DizruptOS desktop)
- Screenshot the running dev server with the **cached Playwright Chromium** via a small `playwright-core` script (`dizruptos/shot.mjs` is the reusable helper); the Chromium binary is at `%LOCALAPPDATA%/ms-playwright/chromium-*/chrome-win64/chrome.exe`.
- Auth: middleware needs a `dz_session` cookie (presence-checked) — set it via `ctx.addCookies`. The desktop powers on, so wait ~3s through boot, then click `button[aria-label="Unlock"]`.
- Useful selectors: dock items `button[title="<App>"]`; menubar `aria-label`s "Control Center" / "Notifications"; theme buttons "Light"/"Dark" need `exact:true`; windows are `section[aria-label="<title>"]`. Note "Graphite" is both an accent AND a wallpaper (ambiguous selector).
- Embedded route windows can take ~7s to first-compile in dev — wait before screenshotting an iframe window. Don't use Playwright `addInitScript` to clear `localStorage` (it re-runs on reload and breaks persistence tests) — a fresh browser context already has empty storage.
- After screenshotting, read the PNG with the Read tool — Claude sees the image directly. Be specific when comparing (exact px / hex / spacing).

## Output Defaults
- Single `index.html` file, all styles inline, unless user says otherwise
- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`
- Mobile-first responsive

## Brand Assets
- Always check the `brand_assets/` folder before designing. It may contain logos, color guides, style guides, or images.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- If a logo is present, use it. If a color palette is defined, use those exact values — do not invent brand colors.

## Anti-Generic Guardrails
- **Colors:** Never use default Tailwind palette (indigo-500, blue-600, etc.). Pick a custom brand color and derive from it.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never use the same font for headings and body. Pair a display/serif with a clean sans. Apply tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Use spring-style easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`.
- **Spacing:** Use intentional, consistent spacing tokens — not random Tailwind steps.
- **Depth:** Surfaces should have a layering system (base → elevated → floating), not all sit at the same z-plane.

## Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color
