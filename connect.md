# DIZRUPT — The Complete Guide
## Everything you need to understand, use, and present DizruptOS

> Read this once and you will understand the entire product end-to-end: every screen,
> every button, every number, every feature, how they connect, and why they matter.
> Written for both technical and non-technical audiences. Presenter-ready.

---

## THE ONE-SENTENCE PITCH

> DIZRUPT is a macOS-style operating system for your organization — it runs in a browser,
> knows everything about your people, projects, and risks, and tells you what to do next
> before problems become crises.

---

# PART 1 — THE SEED ORGANIZATION

Every feature in DIZRUPT is best understood through a single fictional company that ships
with the product. All demo data is interconnected to tell one coherent story.

## The Company: FinTech Ops Co

```
Company:  FinTech Ops Co (Series B, ~$22M ARR, 18 people)
Demo date: Week of June 16, 2026
Industry:  Payments / Financial Infrastructure
```

### The 4 departments

```
Engineering        → VP Priya Sharma (dept_head)
Design             → Head Lena Novak (dept_head)
Data & AI          → Head Tomás Eriksen (dept_head)
Client Operations  → Director Marcus Bell (dept_head)
```

### The executive layer

```
Noor Al-Rashid    — Chief Operating Officer (executive)
Elias Brandt      — Systems Administrator (admin)
```

### The engineering team (where most of the action is)

```
Asha Venkat       — Resource Manager (project_manager)
Sarah Okafor      — Payments Lead (team_lead)    ← ⚠ 113% · burnout flag · flight risk
Ahmed Hassan      — Backend Engineer (employee)
Diego Ruiz        — Frontend Engineer (employee)
Mei Lin           — Senior Backend Engineer (employee)
Jonas Weber       — QA Engineer (employee)
Fatima Zahra      — Platform Engineer (employee)
```

### The other teams

```
Kofi Mensah       — Product Designer (Design)
Inés Castillo     — UX Researcher, 32h/wk part-time (Design)
Zara Iqbal        — ML Engineer (Data & AI)
Ray Donnelly      — Analytics Engineer (Data & AI)
Yuki Tanaka       — Delivery Coordinator (Client Ops)
```

### The 6 active projects

```
Atlas   — Payments Migration       health: CRITICAL   ← the crisis project
Helio   — Client Portal Redesign   health: AT_RISK
Pulse   — Analytics Dashboard      health: ON_TRACK
Nimbus  — Security Hardening       health: ON_TRACK
Orbit   — Mobile App               health: ON_TRACK
Quartz  — CRM Integration          health: AT_RISK
```

### Why this matters

Every surface in DIZRUPT surfaces a consequence of the same root problem: **Sarah Okafor
is overloaded and is a single point of failure.** The product demonstrates that one
overloaded person creates a visible chain reaction across 7+ different surfaces, each
offering a different lens and a different path to resolution.

---

## The Central Story: Why Sarah Is at 113%

Sarah Okafor has a **40h/week capacity**. This week she has **45h allocated**: 5h over.

```
Ledger cutover runbook — final review         14h  (IN_PROGRESS, critical path)
Settlement file ingestion — vendor format v3  12h  (BLOCKED, waiting on vendor)
Reconciliation engine — penny-drift fix       10h  (TO_DO, compliance deadline)
PCI evidence pack refresh                      9h  (TO_DO, compliance deadline)
─────────────────────────────────────────────────
TOTAL                                         45h  ÷ 40h = 113%
```

### Why this is more than a scheduling problem

Sarah is not just busy — she is a **structural single point of failure**:

- **Only person** with deep Payments Architecture knowledge (depth score: 93%)
- **Only person** with PCI-DSS compliance expertise (depth score: 78%)
- **Critical path** of Atlas project, which carries $4.2M ARR from Acme Corp
- **Flight risk score: 64%** — 64% probability of leaving within 6 months
- **Working >50h/week for 3 consecutive weeks** — formal burnout signal
- **No PTO in 112 days**
- Two of her 4 tasks are BLOCKED or at vendor risk

### How every surface in DIZRUPT connects to this story

```
Home app           → Sarah sees her 45h load, 4 tasks, red burnout warning (managers only)
Capacity page      → Red 113% utilization bar for Sarah's current week
Operative Directory → Sarah's profile: skills, burnout flag, flight risk (managers only)
Risks page         → Risk r-1: "Payments expertise concentrated in one person" (HIGH, ESCALATED)
Agent Inbox        → Proposal pr-1: "Move PCI evidence pack (9h) from Sarah to Ahmed"
                     Proposal pr-2 (Ahmed's view): "Accept the PCI task"
Executive page     → $4.2M revenue at risk · 6% burnout flag rate · 23% strategy drift
Dependency Graph   → Sarah node: blast radius = Atlas + Acme Corp if she leaves
AI Copilot         → Ask "who is overloaded?" → Sarah surfaces with full evidence + history
Alert Center       → Active alert: "Burnout risk — Sarah Okafor at 113%, 3 weeks"
Recommendations    → "Reduce Sarah's load below 100% within 2 weeks" (priority 100)
Simulation         → "What if Sarah leaves?" → p95 scenario: 14-week Atlas delay
```

This is the beating heart of DIZRUPT: **one overloaded person → visible chain reaction
across 10+ surfaces, each offering a different lens and a different action path**.

---

# PART 2 — THE OS SHELL

## What Is DizruptOS?

DizruptOS is a macOS-style operating system that runs entirely in the browser. When you
navigate to the app, you don't see a dashboard — you see a desktop operating environment
with a window manager, a Dock, a Menubar, overlays, and first-class apps.

Every legacy route (capacity, risks, executive, etc.) opens **inside a window** — not
as a separate page. The OS acts as a unified shell; no functionality was lost.

---

## The Boot Sequence

**Every time you log in**, the OS boots from scratch (never persisted, always resets):

```
Phase 1 — Boot screen (~1.5s):
  Dark background, "DIZRUPT" wordmark, animated loading bar across the bottom.
  This is a deliberate beat — the OS is "powering on."

Phase 2 — Lock screen:
  Blurred wallpaper, live clock (hours:minutes:seconds), date.
  "Unlock" button in the center.
  Clicking Unlock → transitions to the desktop.

Phase 3 — Desktop:
  Wallpaper animates in, Dock slides up from the bottom,
  Menubar appears at the top, windows restore to your last saved positions.
```

The boot sequence always runs — even if you navigate within the same browser tab.
This ensures the OS is always in a clean, predictable state on every session start.

---

## The Login Page (/login)

The login page is at `/login`. Design: Nexus design system (deep `#0A0A0A` background,
orange `#F97316` accents, Newsreader serif headings, frosted glass card).

**Background animation:** A canvas renders 3 amber light sources that drift across a
halftone dot field, illuminating dots in real-time. Every ~8 seconds: a supernova pulse
+ sweeping lens flare. HiDPI-aware (devicePixelRatio).

**Two tabs:**
- "Log in" — choose a demo persona or enter real credentials
- "Create account" — Supabase sign-up (live when `NEXT_PUBLIC_SUPABASE_URL` is set)

**Demo personas (5):** Each maps to a real seed employee. Clicking one sets the `dz_session`
cookie and navigates to `/` which triggers the boot sequence via `powerOn()`.

**Real auth (Supabase):** When env vars are configured, the form uses `supabase.auth.signInWithPassword()`.
The Supabase JWT is validated in middleware on every request, with `role` and `org_id`
claims embedded by the custom access-token hook (`0012_auth_hook.sql`).

**Session expiry handling:** If your Supabase session expires, middleware detects the stale JWT,
clears the cookie, and redirects to `/login?reason=session_expired` — which shows an inline
warning banner: "Your session expired. Sign in again."

**Brute-force protection:** The login API (`/api/auth/login`) is rate-limited per IP address:
5 attempts per 15-minute window. After 5 failures: exponential lockout — `2^(failures - 5)`
minutes, capped at 60 minutes. Every auth event (success / failure / logout) is written to the
security audit log via `securityEvent()`.

---

## The Welcome / Landing Page (/welcome)

The public-facing landing page at `/welcome`. Design: fullscreen dark canvas with:
- "DIZRUPT" in massive display type (overflow-clipped slide animations from below)
- "every person. every project." sub-headline
- "every consequence." tertiary line
- "EST. 2026 — RUNS YOUR ORG" top-right in small caps at 75% opacity
- "Get started" button → `/login`

---

## The Menubar (Top Bar)

The Menubar runs across the top of the screen at all times. It has 3 zones:

### Left zone

| Element | What it is | What it does |
|---------|-----------|--------------|
| Apple/Logo | DIZRUPT logo | Click → Apple Menu (About, Settings, Restart, Quit) |
| Active app name | Name of focused window's app | Changes as you click different windows |
| App menus | File, Edit, View, Window, Help | Pull-down menus for the active app |

### Right zone

| Element | What it is | What it does |
|---------|-----------|--------------|
| Clock | Live HH:MM:SS | Click → calendar popover with month view |
| ☁ (Control Center icon) | Cloud icon | Click → Control Center popover |
| Bell icon | Notification bell with badge count | Click → Notification Center slide-out |

---

## Control Center (the ☁ icon)

Control Center is the OS settings panel. Click the cloud icon in the Menubar to open it.

### Appearance section

| Toggle | What it does |
|--------|-------------|
| Light | Switches OS-wide theme to light mode; saves to localStorage |
| Dark | Switches to dark mode; saves to localStorage |
| Auto | Follows the OS system preference (`prefers-color-scheme`) |

### Accent Color section

6 colored dots — click any to change the accent color used across the entire OS.
This changes: active window borders, hover states, Dock indicators, slider fills,
and any component using `var(--os-accent)`.

**Available accents:** Emerald (default) · Cyan · Amber · Violet · Rose · Graphite

### Wallpaper section

7 wallpaper options shown as `16:10` thumbnail tiles. Each has a distinct color identity:

| Wallpaper | Color identity |
|-----------|---------------|
| Dizrupt Brand (default) | Deep ink + amber-orange auroras |
| Volt Flux | Lime-chartreuse / neon lime |
| Monterey | Sky blue gradient |
| Solar | Coral + magenta |
| Graphite | Achromatic silver / deep grey |
| Sequoia | Cool teal |
| Nocturne | Magenta-violet |

### Other controls

| Control | What it does |
|---------|-------------|
| Brightness slider | Dims the desktop with an overlay (45%–100%) |
| Volume slider | Audio volume (visual-only in current browser build) |
| Performance mode toggle | Disables backdrop blur + glass effects (reduces GPU load) |
| Do Not Disturb toggle | Suppresses notification toasts (bell still receives) |
| Stage Manager toggle | Enables left-side window thumbnail rail |
| Lock button | Lock screen immediately |

### System Status section (bottom of Control Center)

3 status dots fetched from `/api/health` on mount:

| Label | Checks | States |
|-------|--------|--------|
| Database | Supabase connection | Green / Amber / Pulsing (checking) |
| AI Copilot | Anthropic API key configured | Green / Amber |
| Realtime | Supabase Realtime | Green / Amber |

---

## The Notification Center

Click the bell icon in the Menubar to open the Notification Center slide-out.

**Groups:** Messages · Alerts · System

**Per-notification:** title · body · timestamp · colored type dot.
**Click** → routes to the relevant app (chat message → opens Messages app).
**"Clear all"** → dismisses all notifications.

The NotificationCenter subscribes to `CHANNELS.NOTIFICATIONS` via `realtimeChannel()` for
live push, and reads from `GET /api/v1/notifications` on mount for session persistence.

---

## The Dock (Bottom Bar)

The Dock lives at the bottom of the screen. It's the primary app launcher.

### Dock behaviors

| Interaction | Effect |
|------------|--------|
| Hover near Dock | Icons magnify near cursor (spring physics, rAF-throttled) |
| Hover over icon | App name tooltip appears |
| Click icon | Launch app (or bring to front if open) |
| Green dot below icon | App is currently open |
| Right-click icon | Context menu: Open / Pin / Unpin |

### Default Dock apps (all roles)

```
Home · Tasks · Project Matrix · Operative Directory · Messages · Knowledge Vault ·
Goals & OKRs · Dependency Graph · AI Copilot · System Settings
```

Role-gated Dock apps (appear only with required permission):
```
Executive (view_executive) · Exec Briefing (view_executive) · Narratives (view_executive)
Recommendations (review_proposals) · Capacity (view_capacity)
Risks (review_proposals) · Agent Inbox (review_proposals)
What-If Simulation (view_executive)
```

Alert Center and Admin Console are launched via Spotlight or Launchpad (not Dock by default).

---

## The Window Manager

Every app opens as a **floating window**. This is the core of the OS experience.

### Window anatomy

```
┌─ [●][●][●] ─── App Name ─────────────────────── [icon] ─┐
│ title bar (draggable)                                      │
├────────────────────────────────────────────────────────────┤
│                    app content                             │
└────────────────────────────────────────────────────────────┘
```

**Traffic lights (top-left):**
- `●` Red — close the window
- `●` Yellow — minimize with genie animation (shrinks into Dock)
- `●` Green — toggle fullscreen

### Window interactions

| Action | How |
|--------|-----|
| Move | Drag the title bar |
| Resize | Drag any edge or corner (8-way resize) |
| Snap to half-screen | Drag to left/right screen edge |
| Bring to front | Click anywhere in the window |
| Fullscreen | Green traffic light |

Multiple windows can be open simultaneously. No limit.

### Layout persistence

Window positions saved to `localStorage` under `dz-os-layout:<personaId>`. Next session
with the same persona: all windows restore to where you left them.

### Per-window error boundaries

Each window is wrapped in a `WindowErrorBoundary` React class component. If one app
crashes, only that window shows the error state — the rest of the OS continues working.
The crash UI: AlertTriangle icon + error message + "Reload window" button.

---

## Keyboard Shortcuts and Overlays

| Shortcut | Action |
|----------|--------|
| ⌘ Space (or Ctrl+Space) | Spotlight search |
| F3 | Mission Control |
| F4 | Launchpad |
| ⌘ ` | Cycle windows |
| Escape | Close active overlay |

### Hot corners (hold cursor for 700ms)

```
Top-Left     → Mission Control
Top-Right    → Notification Center
Bottom-Left  → Launchpad
Bottom-Right → Show Desktop (all windows minimize)
```

---

## Spotlight (⌘ Space)

Full-screen search overlay. Type any part of an app name to filter. Results update in
real time. Arrow keys navigate · Enter launches · Escape closes.

WCAG 2.1 ARIA listbox pattern with `aria-activedescendant`. Focus trapped within overlay
(SC 2.1.2 compliant). RBAC-gated apps you can't access show a toast on attempted launch.

---

## Mission Control (F3)

Bird's-eye view of all open windows in a scaled grid. Click any thumbnail → that window
comes to front. Focus trapped. Escape to close without changes.

---

## Launchpad (F4)

Fullscreen grid of ALL installed apps. Gated apps shown dimmed with lock icon.
Click any app → opens it, Launchpad closes. Focus trapped.

---

## Stage Manager (Control Center toggle)

When ON: non-primary windows slide to a left-side thumbnail rail. Click any thumbnail
to bring it to primary position. Great for single-app focus while keeping others accessible.

---

# PART 3 — RBAC: WHO CAN SEE WHAT

## The 6 Roles

| Role | Description |
|------|-------------|
| `executive` | Reads all strategic intelligence; no operational mutations |
| `dept_head` | Department capacity, burnout, risks; approves proposals in their dept |
| `project_manager` | Full capacity control, task reassignment, proposal approval |
| `team_lead` | Manages own team's tasks and capacity |
| `employee` | Sees own tasks, own capacity; accepts/rejects proposals about themselves |
| `admin` | Everything including audit, provisioning, SSO, tenant management |

## The 5 Demo Personas

| Persona | Name | Role | Key access |
|---------|------|------|-----------|
| COO | Noor Al-Rashid | executive | Sees all strategic intelligence, executive KPIs, simulation |
| Sys Admin | Elias Brandt | admin | Full access + audit + Admin Console |
| VP Eng | Priya Sharma | dept_head | Engineering capacity + burnout signals |
| Resource Mgr | Asha Venkat | project_manager | Reassign tasks + approve proposals |
| Payments Lead | Sarah Okafor | team_lead | Own team tasks; does NOT see her own burnout flag |
| Backend Eng | Ahmed Hassan | employee | Own tasks only; receives proposals offered to him |

## Three Enforcement Layers

```
Layer 1 — Login: persona → role. Demo: dz_session cookie. Live: Supabase JWT with role claim.

Layer 2 — OS: apps hidden from Dock/Spotlight/Launchpad without required permission.
   Attempting to launch a gated app shows an access-denied toast.

Layer 3 — Data: store mutations + API handlers check permissions.
   requestReallocate() → "Not permitted" without reallocate grant.
   reviewProposal() → refuses if not authorized.
   This is the actual security boundary.
```

## Permission Matrix

| Permission | employee | team_lead | project_manager | dept_head | executive | admin |
|-----------|----------|-----------|----------------|-----------|-----------|-------|
| view_capacity | own only | team | all | dept | all | all |
| view_burnout | ✗ | team | all | dept | all | all |
| view_executive | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| view_financial | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| reallocate | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ |
| review_proposals | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ |
| view_ai | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| view_audit | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |

---

# PART 4 — NATIVE OS APPS

These are first-class desktop apps — not iframes. They live entirely in the OS window manager.

---

## Home App

**Dock:** Always first. **Accent:** `#00ED82`. **RBAC:** All roles.

The Home app is your personal command surface for the day. It adapts completely per persona.

### Your Pulse (top section)

- Today's date
- **7-day org health sparkline** — trend arrow (↑ / → / ↓) + delta vs 7 days ago
- Your name, role, department
- **Capacity bar** — green (<80%) / amber (80–99%) / red (≥100%)

### Stats grid (4 clickable tiles)

| Tile | What it shows | Opens |
|------|--------------|-------|
| Today / Overdue | Tasks due today or overdue | Tasks app → today_overdue filter |
| In Progress | Active tasks | Tasks app → in_progress filter |
| Blocked | Blocked tasks you own | Tasks app → blocked filter |
| Critical | Urgent/critical-project tasks | Tasks app → critical filter |

### Morning Brief (managers+)

3-bucket AI summary (Critical / Review Required / No Action Needed).
Every line is a button → opens the relevant OS window.

### Agent Proposals (project_manager+)

Pending AI proposals with Accept / Decline buttons.
Each card: agent type chip · summary · confidence score (0–1).

---

## Tasks App

**Accent:** `#2BD9FF`. **RBAC:** All roles (scope by role).

### Filter rail (left)

All open · Due today · Overdue · Pending · In progress · Blocked · Critical · Done

### Task Drawer

Click any task row → drawer slides in from right.
Shows: full detail · hours progress · subtasks · dependency chains.
**Reassign button** (managers only) → triggers capacity guardrail.

### The Capacity Guardrail

```
If projected utilization ≥ 100%:
  → Override dialog: MUST type a reason (cannot bypass)
  → Reason written permanently to audit trail
If projected < 100%:
  → Auto-confirms · both sides updated · audit event written
```

---

## Project Matrix (Kanban)

**Accent:** `#7C6CFF`. **RBAC:** All roles (mutations require `reallocate`).

**7 columns:** BACKLOG · TO_DO · IN_PROGRESS · BLOCKED · REVIEW · CLIENT_REVIEW · COMPLETED

**Project filter pill:** All · ATLS · HELIO · PLSE · NMBS · ORBT · QRTZ

**Each card:** priority badge · title · assignee avatar · hours progress bar · subtask icon · labels

**Drag between columns** → updates status (optimistic, via `moveTask()`).
Managers drag any task; employees only their own.

---

## Operative Directory

**Accent:** `#38BDF8`. **RBAC:** All roles (burnout/flight risk data gated to managers).

**Left panel:** Roster with utilization % + burnout triangles (managers only).
Search by name/title/skill. Filter by department.

**Right panel:** Profile showing stats · capacity bar · skills tags · expertise bars (depth 0–100).

**Burnout section (managers only — NEVER shown to employees):**
- Specific burnout signals
- Flight risk percentage
- Last PTO date

---

## Messages (Chat)

**Accent:** `#2BD9FF`. **RBAC:** All roles.

Real-time team chat. Messages push to Notification Center badge when you're elsewhere.
Clicking a notification routes back to the Chat app.

---

## Knowledge Vault

**Accent:** `#FEBC2E`. **RBAC:** All roles.

IndexedDB-backed file vault. Browse, upload, preview org documents locally in the browser.
Files persist across sessions (IndexedDB survives page refresh).

---

## AI Copilot

**Accent:** `#00ED82`. **RBAC:** All roles.

The intelligence interface. Ask anything about your org. Answers are grounded in live data.

### Technical pipeline

```
1. You type → frontend sends POST /api/v1/copilot:
   { q: "question", history: [ { role, content }, ... ] }

2. Backend:
   a. TF-IDF semantic search → top-K relevant entities (cosine similarity)
   b. Deterministic engine → structured facts answer
   c. If ANTHROPIC_API_KEY set:
      → System prompt (org context: health, risks, recs, capabilities)
      → Prior conversation history (up to last 10 turns) ← MULTI-TURN MEMORY
      → Claude claude-sonnet-4-6 enhances delivery while grounded in step (b)
   d. If LLM unavailable: returns deterministic answer (always correct)

3. Frontend renders:
   → Answer text + evidence chips + Claude badge + follow-up chips
```

### Multi-turn conversation memory

The Copilot has true session memory. Each question you ask includes all prior turns:

```
You:  "Who is most overloaded?"
AI:   "Sarah Okafor is at 113%..." [evidence chips]

You:  "What tasks can we move to reduce her load?"
AI:   "Given Sarah's 45h load we just discussed..." ← references prior turn

You:  "What happens if we don't fix this in the next week?"
AI:   "Based on the flight risk of 64% and burnout signals..." ← full context
```

History is captured before each question is sent, so the API always receives a clean
snapshot of all completed prior turns.

### 6 starter prompts (empty state)

1. "Who is most overloaded this week?"
2. "What are our biggest risks right now?"
3. "Which projects are at risk of delay?"
4. "How should I prioritize my tasks today?"
5. "Who would we lose the most if they left?"
6. "How is our org health trending?"

### Follow-up chips (per intent)

After each answer, 3 contextual chips appear based on detected intent.
Click any chip → sends it as your next turn.

### Controls

| Element | Action |
|---------|--------|
| Starter prompt | Send that question |
| Text input | Type question |
| Enter | Send |
| Shift+Enter | New line without sending |
| Follow-up chip | Send follow-up |
| Clear button | Reset conversation + clear localStorage history |
| Evidence chip | Read-only — cites data source |
| Claude badge | Confirms LLM-enhanced (vs. deterministic) |

---

## What-If Simulation

**Accent:** `#FEBC2E`. **RBAC:** `view_executive`.

Monte Carlo simulations over live org state. 10,000 iterations. Returns p5/p50/p95.

### 4 scenario types

| Scenario | Models | Seed result |
|----------|--------|-------------|
| Delivery risk | Overloads + blocked tasks + critical dependencies | p50 = 4-week Atlas slip |
| Team attrition | Flight risk × dependency × capacity | p50 = 14-week delay (Sarah scenario) |
| Capacity crunch | Utilization + deliverables + planned absences | Week 3 hits 85% |
| Budget overrun | Consumed hours × cost rate × scope | p50 = 23% overrun (Atlas) |

**API response includes `calibration` object** with model accuracy and footnote data.

---

## Alert Center

**Accent:** `#FF5F57`. **RBAC:** `view_executive`.
**Launch:** Spotlight → "Alert Center" or Launchpad.

Automated monitoring. `AlertSync` in `providers.tsx` runs the engine on mount and every 5 minutes.

### Alert Engine (4 evaluators)

```
1. evalRiskAlerts:     ESCALATED risk → critical; open critical-impact risk → high
2. evalCapacityAlerts: burnoutFlag + ≥100% → critical; burnoutFlag + <100% → high
3. evalSuccessionAlerts: flightRisk ≥ 0.7 → succession medium alert
4. evalProjectHealth:  health CRITICAL → critical; AT_RISK/BLOCKED → high
```

### Alert card anatomy

Severity dot (color) · title · body · evidence chips · "View →" (opens relevant app) · "Dismiss"

### Header controls

| Button | Action |
|--------|--------|
| Filter tabs | All / risk / capacity / succession / project_health / recommendation |
| Evaluate | Run alert engine immediately |
| Dismiss all | Acknowledge all org alerts |

---

## Admin Console

**Accent:** `#F59E0B`. **RBAC:** `view_audit` (admin only).
**Launch:** Spotlight → "Admin Console".

### 4 tabs

**Tenants:** Table of orgs · Suspend / Reactivate per org.

**SSO:** Per-tenant SAML 2.0 or OIDC configuration.
Save → `PUT /api/v1/admin/tenants/[id]/sso`
Configured → `GET /api/auth/sso?tenant=<orgId>` routes to correct IdP automatically.

**SCIM:** Current token (masked) · "Rotate Token" button · "Copy" button.
Token stored hashed in DB; never recoverable after generation (industry standard).
SCIM endpoint: `POST/GET /api/v1/scim/Users`

**Audit:** Full tamper-evident event log + dead-letter import queue.
Append-only (SQL constraint: `REVOKE UPDATE, DELETE ON audit_events`).

---

# PART 5 — INTELLIGENCE APPS (Iframe Windows)

These apps open as OS windows but render Next.js routes in a chromeless iframe (`?embed=1`).
No navigation away from the OS shell — ever.

---

## Executive Workspace (/executive)

**RBAC:** `view_executive`.

### 4 KPI tiles

**Revenue at Risk — $4.2M**
Atlas → Acme Corp ($4.2M ARR) · Atlas health = CRITICAL → ARR at risk

**Strategy Drift — 23%**
23% of hours NOT linked to any active goal ÷ total hours.
Primary source: internal tooling requests (34h/week, no OKR link)

**Org Health Index — 72**
Weighted composite over 6 dimensions. Target > 75. Declining (was 78 six weeks ago).

**Burnout Flag Rate — 6%**
1 flagged / 17 active = 5.9%. Target < 5%. Sarah Okafor.

### Strategy drift vs OHI chart

7-week area chart: Drift % (amber) rises as OHI (green) falls.
**Pattern:** drift climbs first, OHI follows down ~2 weeks later. Leading indicator.

### Morning Brief

AI-structured summary. Every line is a button → opens the relevant OS window.

### Portfolio Matrix

All 6 projects: health badge · budget burn bar · velocity sparkline · "Why" chip (3 health reasons).

### Fragility Map (V2)

Bus-factor capabilities list + SPOF people list. Powered by the graph traversal engine.

### What Changed feed

`GET /api/v1/intelligence/delta?since=24h` — last 24h events ranked by impact score.
Each event is a button → opens the relevant app window.

### Inline Copilot quick-ask

Single-line input at the top of the Executive page → calls `/api/v1/copilot?q=` →
answer appears inline as dismissable card without opening the Copilot window.

---

## Exec Briefing (/briefing)

**RBAC:** `view_executive`.
Prose narrative briefing — 3-4 paragraphs of synthesized org intelligence. Most executive-readable.

---

## Narratives (/narratives)

**RBAC:** `view_executive`.
AI-generated narratives per intelligence dimension (Capacity / Risk / Performance).
Always accurate — generated from structured data + templates, not raw LLM.

---

## Recommendations (/recommendations)

**RBAC:** `review_proposals`.
4-pass AI analysis (Capacity → Risk → Dependency → Goal alignment).
Per-recommendation: priority score · evidence · suggested action · projected impact.

---

## Learning Loop (/learning)

Calibration data: forecast accuracy over time · blind spots · best decisions · calibration gap.
Shows how the agent's recommendations improve (or don't) over time.

---

## Capacity (/capacity)

**RBAC:** `view_capacity`.
Weekly grid. Rows = people, columns = 6 weeks (always from "this Monday").

```
Green  < 80%    — comfortable
Amber  80–99%   — approaching limit
Red    ≥ 100%   — must move something
```

Seed: Sarah WEEKS[0] = 113% (red) · Ahmed = 65% (green) · Inés = 81% (amber, part-time).

Task chips are draggable → triggers capacity guardrail if projected ≥ 100%.

---

## People (/people)

Same data as Operative Directory in a more data-dense tabular format.
Good for bulk scanning; Directory is better for deep individual profiles.

---

## Projects (/projects)

Project list with detail drill-downs. Health badge · owner · team size · budget burn · task counts.

---

## Dependency Graph (/graph)

**RBAC:** All roles.
Interactive force-directed graph of all org dependencies.

### Node types

Employee · Capability · Project · Risk · Customer · Assumption (Brain icon) · Policy (Shield icon)

### 4 lenses

| Lens | Algorithm | What it shows |
|------|-----------|--------------|
| Blast Radius | BFS from node | Downstream failure count; Sarah has highest = 4 |
| Bus Factor | Holder count | Single-holder capabilities in red; Payments Arch = bus factor 1 |
| Influence | Brandes betweenness centrality | "TOP" badge (green) on high-betweenness nodes |
| PageRank | Damped random walk (damping=0.85, 35 iterations) | "TOP" badge (orange) on high-pagerank nodes |

Stats row: node count · edge count · avg degree · top influencer count · top PageRank count

**Clicking a node** dispatches `dizrupt:launch` → opens the relevant OS app window.
Never navigates away from the OS shell.

---

## Org Memory (/memory)

Organizational intelligence archive. Synthesized knowledge about the org's history,
patterns, and learned intelligence. Interfaces with the learning engine.

---

## Risks (/risks)

**RBAC:** `review_proposals`.
The 6 seed risks. Severity formula: probability × impact (LOW < 0.3 / MEDIUM 0.3-0.6 / HIGH > 0.6).
r-1: 0.7 × 0.9 = 0.63 → HIGH. Expand any risk for: description · mitigation steps · affected projects.

---

## Goals & OKRs (/goals)

**RBAC:** All roles.

| Goal | Progress | State |
|------|---------|-------|
| Complete Payments Migration Launch | 28% | At risk (Atlas CRITICAL) |
| Achieve PCI-DSS Level 1 Certification | 45% | On track |
| Improve Org Health Index to 80 | 90% of target | Declining |
| Reduce time-to-deploy to 2 days | 61% | On track |

---

## Agent Inbox / Proposals (/proposals)

**RBAC:** `review_proposals`.

### The 5 agent types

burnout_safety · delivery_critical · skill_match · succession · risk_advisory

### The stale-check (critical security property)

Accept clicks re-verify target capacity AT APPROVAL TIME.
If capacity changed: proposal expires, no mutation. Prevents TOCTOU race conditions.

### When you click Accept

```
→ Re-check capacity · If still valid: task reassigned + capacity updated + audit written
→ If stale: proposal.status = "expired" · audit: proposal_stale · no changes
```

### When you click Decline

```
→ proposal.status = "rejected" · 30-day agent memory · no capacity changes
```

---

## Decisions (/decisions)

**RBAC:** All roles.
Institutional memory. 5 seed decisions (SUCCEEDED / FAILED / PENDING).
Full detail: description · rationale · alternatives · evidence · outcome · retrospective.
**GitHub merges with "decision:" → auto-create Decision records** (PR title = title, body = evidence).

---

## Capabilities (/capabilities)

**RBAC:** All roles.
Domain knowledge areas with depth scores, holder counts, fragility indicators.
Key fragile capabilities: Payments Architecture (Sarah only, 0.93) · PCI-DSS (Sarah only, 0.78).

---

## Audit Trail (/audit)

**RBAC:** `view_audit`.
Tamper-evident append-only log. Every mutation writes an event.
Also shows the import retry dead-letter queue (jobs that failed 3× and exhausted retries).

---

## Data Import (/import)

**RBAC:** All roles.

| Entity | What imports |
|--------|-------------|
| Employees | People + roles + capacity |
| Capabilities | Domain knowledge + depth |
| Projects | Project definitions + health |
| Tasks | Work items + assignees |
| HRIS Bulk | Full org structure from HRIS export |

Webhook URLs for Jira / Linear / GitHub (HMAC-SHA256 verified).

### Import retry queue

Failed imports retry automatically:
```
Attempt 1: immediate
Attempt 2: 2s later (2^1)
Attempt 3: 4s later (2^2)
After 3 failures: dead-lettered (visible in Audit Trail)
```

---

# PART 6 — THE INTELLIGENCE ENGINE

## Data Flow (Top to Bottom)

```
Data Sources → makeResilient() Proxy → Intelligence Services → Surfaces
```

**makeResilient() Proxy:** Every repository auto-falls back to in-memory seed on Supabase errors.
Zero 500s from DB unreachability across all 19 API routes. `X-Backend: "memory"|"live"` header.

## The Org Health Index

```
OHI = weighted average of 6 dimensions:
  Fairness (workload equity)            20%
  Manager effectiveness                 25%
  Stability                             15%
  Psychological safety                  20%
  Recognition                           10%
  Meeting health                        10%

Current: 72/100 · Target: >75 · Declining (was 78 six weeks ago)
Primary drag: workload fairness (Sarah 113%, uneven distribution)
```

## The Complete Traceability Chain

```
Goal: "Complete Payments Migration Launch"
  → Atlas project (CRITICAL)
    → Sarah's tasks: 45h this week
      → 113% utilization
        → burnout signal: 3 weeks >50h, 0 PTO in 112 days
          → Risk r-1: Payments SPOF (HIGH, ESCALATED)
          → Alert: "Burnout risk — Sarah Okafor"
            → Agent pr-1: "Move PCI task (9h) to Ahmed"
              → If approved: Sarah 113%→90%, Ahmed 65%→87%
                → g-1 progress improves toward 100%
```

---

# PART 7 — DATA & INTEGRATION

## Webhook Connectors

| Connector | URL | What it writes |
|-----------|-----|----------------|
| Jira | POST /api/v1/import/jira | Tasks + projects |
| Linear | POST /api/v1/import/linear | Tasks + projects |
| GitHub | POST /api/v1/import/github | Decision records (merged PRs) |

All webhooks: HMAC-SHA256 verified. Idempotent (duplicate events → no duplicates in DB).
Demo mode: validates HMAC, returns 200, writes to audit log but not DB.

## SCIM 2.0

Full provisioning from Okta / Azure AD. `GET/POST /api/v1/scim/Users`.
Token rotated via Admin Console. Stored hashed — never recoverable.

## SSO

SAML 2.0 SP-initiated + OIDC. Per-tenant config in `tenant_sso_configs` DB table.
`GET /api/auth/sso?tenant=<orgId>` → routes to correct IdP automatically.

## Export

`GET /api/v1/export?format=csv|json` — full org data export. RBAC: `view_audit`.

---

# PART 8 — AUTH & IDENTITY

## Demo vs Live

| Aspect | Demo | Live |
|--------|------|------|
| Auth | `dz_session` cookie (presence-only) | Supabase JWT (RS256, validated per request) |
| Users | 5 seed personas | Real Supabase users |
| Org data | In-memory seed | Supabase Postgres |
| RBAC | Persona role → matrix | JWT `role` claim → matrix |

Demo mode ALWAYS works — never broken by Supabase configuration.

## Real Auth Flow

```
Sign in → supabase.auth.signInWithPassword() → JWT with role + org_id claims
SupabaseAuthSync (providers.tsx) → onAuthStateChange listener → Zustand store stays in sync
middleware.ts → validates JWT on every request → role + org_id from claims
useSession.can(permission) → roleCan(role, permission) for real users
```

## Brute-Force Protection

5 attempts / 15-min window per IP. After 5 failures: `2^(failures-5)` minute lockout, max 60 min.
Every auth event written to security audit log.

## Invitations

New users added only via invitation (no open registration):
1. Admin → Admin Console → Members tab → "Invite Member" → email + role
2. `POST /api/v1/invitations` → Supabase sends magic-link email
3. Recipient clicks `/accept-invite?token=<token>` → auth → accepts → org_id + role set in DB
4. Invitations expire after 7 days. Duplicate pending invites blocked by DB unique index.

## Onboarding Wizard (/onboarding)

5-step wizard for new accounts before reaching the desktop:

| Step | Action |
|------|--------|
| 1 — Name your org | POST /api/v1/organizations |
| 2 — Invite team | Bulk email invite + role picker |
| 3 — Import data | HRIS Bulk CSV upload |
| 4 — Connect tools | Webhook URLs for Jira/Linear/GitHub |
| 5 — Ready | Summary → "Launch workspace" → redirect to / |

Middleware redirects here if `tenant_settings.onboarding_completed != true`.

## Password Reset

`/reset-password` → email → `supabase.auth.resetPasswordForEmail()` → email sent.
`/reset-password/confirm` → new password → `supabase.auth.updateUser()` → redirect to `/login`.

---

# PART 9 — ENTERPRISE & PRODUCTION

## Multi-Tenancy

Every DB table has `org_id`. Supabase Row-Level Security policies enforce
`org_id = auth.jwt()->'org_id'` on every query. No cross-tenant leakage possible.

## SOC2 Controls

Key controls implemented in code: CC6.1 (RBAC) · CC6.2 (auth + brute-force) ·
CC6.3 (SCIM deprovisioning) · CC7.2 (OTel + alert engine) · CC9.2 (risk register) ·
A1.2 (circuit breakers + resilient repos). Full mapping in `SOC2_CONTROLS.md`.

## Security

**OWASP headers:** X-Content-Type-Options · X-Frame-Options · CSP · HSTS · X-Request-ID.

**Rate limiting:**
- `/api/v1/intelligence/*`: 10 req/min per IP → 429 + Retry-After: 60
- All other `/api/v1/*`: 60 req/min per IP → 429 + Retry-After: 10
- Auth login: 5 attempts / 15min with exponential lockout

## Health Endpoint

`GET /api/health` — public, no auth. Returns `status · version · uptime · requestId · checks · capabilities`.
`X-Request-ID` header echoed for distributed tracing.

## Reliability

```
makeResilient() Proxy:  auto-fallback to seed on Supabase errors (all 19 routes)
Circuit breakers:       supabaseBreaker (5 failures, 30s probe) · anthropicBreaker (3 failures, 60s probe)
Import retry queue:     3 attempts with exponential backoff, then dead-letter
Per-window boundaries:  crash one window without affecting the rest of the OS
TanStack Query:         3 retries + exponential backoff + full jitter (4xx not retried)
```

---

# PART 10 — COMPLETE BUTTON REFERENCE

## Desktop

| Element | Action |
|---------|--------|
| "Unlock" (lock screen) | Boot to desktop |
| Red ● (title bar) | Close window |
| Yellow ● (title bar) | Minimize (genie) |
| Green ● (title bar) | Fullscreen |
| Dock icon | Launch or focus app |
| Right-click Dock icon | Pin/Unpin/Open |
| ⌘+Space | Spotlight |
| F3 | Mission Control |
| F4 | Launchpad |
| ⌘+` | Cycle windows |
| Escape | Close overlay |
| Hot corner (700ms) | Per-corner action |

## Control Center

| Control | Action |
|---------|--------|
| Light/Dark/Auto | OS theme |
| Accent dot | Change accent color |
| Wallpaper tile | Change wallpaper |
| Brightness slider | Dim desktop |
| Performance toggle | Disable blur |
| DND toggle | Mute toasts |
| Stage Manager toggle | Window rail |
| Lock button | Lock screen now |

## Home App

| Button | Action |
|--------|--------|
| Stat tile | Tasks app with filter |
| Morning brief line | Opens relevant app |
| Accept (proposal) | Apply reallocation (stale-check) |
| Decline (proposal) | Reject + log reason |

## AI Copilot

| Element | Action |
|---------|--------|
| Starter prompt | Send question |
| Text input → Enter | Send message |
| Shift+Enter | New line |
| Follow-up chip | Send follow-up |
| Clear | Reset conversation |
| Evidence chip | Read-only citation |
| Claude badge | LLM-enhanced indicator |

## Alert Center

| Button | Action |
|--------|--------|
| Filter tab | Category filter |
| View → | Launch relevant app |
| Dismiss | Acknowledge alert |
| Evaluate | Run engine now |
| Dismiss all | Acknowledge all |

## Dependency Graph

| Interaction | Action |
|------------|--------|
| Scroll | Zoom (0.2× – 3×) |
| Drag background | Pan |
| Click node | Open relevant OS app |
| Lens pill | Switch analytical lens |

## Capacity Guardrail Dialog

| Button | Action |
|--------|--------|
| Override reason input | Mandatory text — cannot bypass |
| Confirm Override | Apply + write audit with reason |
| Cancel | Abort, no changes |

---

# PART 11 — ALL API ROUTES

| Route | Method | Auth | What it does |
|-------|--------|------|-------------|
| `/api/v1/copilot` | GET | session | Stateless single-turn Q&A |
| `/api/v1/copilot` | POST | session | Multi-turn Q&A with conversation history |
| `/api/v1/search` | GET | session | TF-IDF semantic entity search |
| `/api/v1/intelligence/graph` | GET | session | Dependency graph data |
| `/api/v1/intelligence/org-health` | GET | session | OHI + narratives |
| `/api/v1/intelligence/health-history` | GET | session | 30-day health trend |
| `/api/v1/intelligence/delta` | GET | session | Last 24h change feed |
| `/api/v1/intelligence/digest` | GET | session | Daily/weekly executive digest |
| `/api/v1/simulation/monte-carlo` | POST | session | Monte Carlo simulation |
| `/api/v1/import/jira` | POST | HMAC | Jira webhook |
| `/api/v1/import/linear` | POST | HMAC | Linear webhook |
| `/api/v1/import/github` | POST | HMAC | GitHub webhook |
| `/api/v1/import/dead-letter` | GET/DELETE | audit | Dead-letter queue management |
| `/api/v1/export` | GET | audit | Data export (CSV/JSON) |
| `/api/v1/audit/nav` | POST | session | Navigation audit logging |
| `/api/v1/alerts` | GET | session | List org alerts |
| `/api/v1/alerts` | POST | session | Run alert engine / acknowledge all |
| `/api/v1/alerts/[id]` | PATCH | session | Acknowledge single alert |
| `/api/v1/alerts/escalation` | GET/POST | audit | Escalation rules |
| `/api/v1/invitations` | GET/POST | session | List / send invitations |
| `/api/v1/invitations/[token]` | GET/POST/DELETE | session | Validate / accept / revoke |
| `/api/v1/organizations` | GET/POST | session | List / create orgs |
| `/api/v1/notifications` | GET/PATCH | session | Notifications |
| `/api/v1/admin/tenants/[id]/sso` | PUT | admin | Per-tenant SSO config |
| `/api/v1/admin/tenants/[id]/suspend` | POST | admin | Tenant suspension |
| `/api/v1/scim/Users` | GET/POST | SCIM | User provisioning |
| `/api/v1/scim/token` | POST | admin | SCIM token rotation |
| `/api/v1/metrics` | GET | internal | Prometheus metrics |
| `/api/v1/metrics/vitals` | POST | internal | Web Vitals |
| `/api/v1/gdpr` | GET/POST | session | Data export / erasure |
| `/api/health` | GET | public | Health check + capabilities |
| `/api/ready` | GET | public | Readiness probe |
| `/api/auth/sso/saml` | GET | public | SAML SP flow |
| `/api/auth/sso/oidc` | GET | public | OIDC redirect |
| `/api/auth/sso/acs` | POST | public | SAML ACS callback |
| `/api/auth/callback` | GET | public | Supabase auth callback |
| `/api/auth/login` | POST | public | Demo + real login |
| `/api/auth/logout` | POST | session | Logout + session revocation |
| `/api/auth/reset-password` | POST | public | Trigger password reset |

---

# PART 12 — DESIGN TOKENS

| Token | Meaning |
|-------|---------|
| `--ink` | Base background (`bg-ink`) |
| `--ink-surface` | Card background (`bg-ink-surface`) |
| `--ink-elevated` | Raised surface (`bg-ink-elevated`) |
| `--ink-raised` | Floating surface (`bg-ink-raised`) |
| `--fg` | Primary text (`text-fg`) |
| `--fg-secondary` | Secondary text (`text-fg-secondary`) |
| `--fg-muted` | Muted text (`text-fg-muted`) |
| `--fg-faint` | Faintest text (`text-fg-faint`) |
| `--line` | Border (`border-line`) |
| `--ok` | Success green |
| `--warn` | Warning amber |
| `--danger` | Error red |
| `--brand` | Brand color |
| `--os-accent` | Current OS accent color (`style={{ color: "var(--os-accent)" }}`) |

**Never use:** `bg-bg`, `bg-surface`, `text-accent`, `text-success`, `bg-success` — undefined.

---

# PART 13 — PRESENTING DIZRUPT

## The Golden Rule

**Do NOT start with a feature tour. Start with one story:**

> "Sarah is at 113%. Here's why. Here's every consequence. Here's what the AI
> recommends. Here's how a manager fixes it in 90 seconds."

## The 3-Minute Demo Path

```
Step 1 (30s) — Home app:
  Point to morning brief. "Everything critical in one sentence."
  Click "Sarah Okafor burnout flag" → Operative Directory.
  "Our Payments Lead. At 113%. Only person who knows Payments Architecture."

Step 2 (30s) — Agent Inbox:
  Show proposal pr-1. Point to confidence: 91%.
  Show capacity before/after (113%→90%, 65%→87%).
  Click Accept. "Done. 90 seconds. Documented. Audited."

Step 3 (30s) — Dependency Graph:
  Find Sarah's node.
  Switch to Blast Radius lens: "Remove her → Atlas fails → Acme Corp → $4.2M."
  Switch to Bus Factor lens: "She's the only holder of Payments Architecture."

Step 4 (30s) — What-If Simulation:
  Select Team Attrition. Run.
  Point to p95: "14-week delay. $4.2M ARR at risk."
  "This is what the data says happens if we don't act."

Step 5 (30s) — AI Copilot:
  Type: "What should I do first this morning?"
  Show answer + evidence chips + follow-up chips + Claude badge.
  "This knows your entire org. Every project, every person, every risk.
   And it remembers what you asked earlier in the conversation."
```

Total: ~3 minutes. Audience has seen: **detection → root cause → action → consequence → AI synthesis.**

## The 30-Second Hallway Demo

```
1. Home app → morning brief
2. Click "Sarah burnout flag" → Operative Directory
3. Copilot → "Who is most overloaded?" → show answer
```

## What NOT to Show First

- Not the Capacity grid (too many numbers, no narrative)
- Not the Audit trail (interesting to security buyers, not operators)
- Not Settings
- Not more than 3 windows at once

## The 7 Questions People Always Ask

**"Is this real-time?"**
→ Demo: no (seed data). Live with Supabase Realtime: yes — changes propagate immediately.

**"How does it get the data?"**
→ 3 paths: (1) webhooks from Jira/Linear/GitHub auto-fire on every change;
  (2) SCIM sync from Okta/Azure AD; (3) CSV upload (manual, one-time).

**"Can it work for a smaller team?"**
→ Value floor ~8–10 people. Sweet spot: 15–150.

**"What happens when the AI is wrong?"**
→ Every proposal requires human approval. Declined proposals are logged; agent learns from them.

**"Can employees see their burnout flag?"**
→ No. Burnout flags visible only to managers (`view_burnout` permission).

**"What data does it need to get started?"**
→ Minimum: names + emails + roles (HRIS CSV, <5 min).
  Better: connect Jira/Linear (tasks auto-sync in <1 min).
  Best: connect GitHub too (decisions auto-created from merged PRs).

**"Is this secure?"**
→ Three-layer RBAC. HMAC-verified webhooks. Tamper-evident audit trail. OWASP headers.
  Brute-force protection. Per-org Row-Level Security. SOC2 controls documented.

## The Weekly Rhythm

```
Monday (Executive):
  Home → morning brief → Agent Inbox → approve proposals → Executive page →
  Simulation → 15 minutes to make the week's key decisions

Tuesday (Project Manager):
  Capacity page → identify overloads → Kanban → move blockers

Wednesday (Team Lead):
  Review team utilization → flag risks → update blocked statuses

Thursday (Everyone):
  Update task statuses → log hours → check Home stats

Friday (All Managers):
  Recommendations page → act on anything aged >3 days → check Alert Center
```

## When You Have Real Data (Not the Seed)

1. **Sarah's story becomes your story** — the system finds YOUR overloaded people
2. **The graph reveals your actual SPOFs** — who holds critical knowledge alone?
3. **Revenue at risk = your real ARR** — linked to your real projects and customers
4. **The Copilot knows your actual org** — "who is overloaded?" returns YOUR people's names
5. **Decisions build institutional memory** — after 3 months: complete org-intelligence history

---

*Last updated: 2026-06-21. For technical audit scores, see `SUPREME_PLATFORM_AUDIT.md`.
For remaining roadmap, see `ROAD_TO_10.md`. For auth setup, see `AUTH_SETUP.md`.*
