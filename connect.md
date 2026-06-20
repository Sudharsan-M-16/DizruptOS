# DIZRUPT — Everything Connected
## The Complete Guide: How Every Feature Works, How They All Connect, and Why It Matters

> This document is the single source of truth for understanding DIZRUPT end-to-end.
> It explains every screen, every button, every number, every recommendation — and how
> they all connect through the live seed organization. Read it once and you will understand
> the entire product, the data model, the org-intelligence engine, and how a real company
> should use it.

---

## The Seed Organization ("FinTech Ops Co")

DIZRUPT ships with a fully-populated fictional 18-person product company.
Every risk, task, proposal, goal, decision, and dependency is interconnected to tell a
coherent, realistic story. The fastest way to understand the product is to understand this story.

```
Company: FinTech Ops Co (Series B, ~$22M ARR, 18 people)
Date in the demo: Week of June 16, 2026

Departments:
  Engineering        → VP Priya Sharma (dept_head)
  Design             → Head Lena Novak (dept_head)
  Data & AI          → Head Tomás Eriksen (dept_head)
  Client Operations  → Director Marcus Bell (dept_head)

Executive layer:
  Noor Al-Rashid    — Chief Operating Officer (executive)
  Elias Brandt      — Systems Administrator (admin)

Engineering team (most of the action):
  Asha Venkat       — Resource Manager (project_manager)
  Sarah Okafor      — Payments Lead (team_lead)    ← ⚠ 113% · burnout flag · flight risk
  Ahmed Hassan      — Backend Engineer
  Diego Ruiz        — Frontend Engineer
  Mei Lin           — Senior Backend Engineer
  Jonas Weber       — QA Engineer
  Fatima Zahra      — Platform Engineer

Design team:
  Kofi Mensah       — Product Designer
  Inés Castillo     — UX Researcher (32h/wk part-time)

Data & AI team:
  Zara Iqbal        — ML Engineer
  Ray Donnelly      — Analytics Engineer

Client Ops team:
  Yuki Tanaka       — Delivery Coordinator

Active Projects (6):
  Atlas   — Payments Migration (CRITICAL)   ← the crisis project
  Helio   — Client Portal Redesign (AT_RISK)
  Pulse   — Analytics Dashboard (ON_TRACK)
  Nimbus  — Security Hardening (ON_TRACK)
  Orbit   — Mobile App (ON_TRACK)
  Quartz  — CRM Integration (AT_RISK)
```

The entire product's intelligence is built around detecting, explaining, and resolving
the pressure that Atlas and Sarah create in the organization.

---

## §1 — Why Sarah Is at 113% (The Central Story)

This is the most important data point in the demo. Every surface in DIZRUPT connects to it.

### The math

Sarah Okafor has a **40h/week capacity**. In WEEKS[0] (the current week), she has
**45 hours allocated**:

```
45h allocated ÷ 40h capacity = 112.5% → displayed as 113%
```

Her 45h come from four tasks this week:

| Task | Status | Hours | Notes |
|------|--------|-------|-------|
| Ledger cutover runbook — final review | IN_PROGRESS | 14h | Critical path |
| Settlement file ingestion — vendor format v3 | BLOCKED | 12h | Blocked on vendor |
| Reconciliation engine — penny-drift fix | TO_DO | 10h | Compliance deadline |
| PCI evidence pack refresh | TO_DO | 9h | Compliance deadline |
| **Total** | | **45h** | **5h over capacity** |

### Why this is more than just a scheduling problem

Sarah is not simply overloaded — she is a **single point of failure** for the entire org:

- She is the **only person** with deep Payments Architecture knowledge (93% depth score)
- She is the **only person** who can do PCI-DSS compliance work (78% depth)
- She is on the **critical path** of Atlas, which carries **$4.2M ARR** from Acme Corp
- She has a **flight risk score of 0.64** (64% probability of leaving within 6 months)
- She has been working **>50h/week for 3 consecutive weeks**
- She has had **no PTO in 112 days**
- Two of her 4 tasks are BLOCKED or at risk from vendor delays

### How every DIZRUPT surface connects to this one story

```
Home app           → Sarah sees her 45h load, her 4 tasks, the red burnout warning
Capacity page      → Red 113% bar for Sarah's current week
Operative Directory → Sarah's profile: skills, burnout flag, flight risk, expertise bars
Risks page         → Risk r-1: "Payments expertise concentrated in one person" (HIGH severity)
Agent Inbox        → Proposal pr-1: "Move PCI evidence pack (9h) from Sarah to Ahmed"
                     Proposal pr-2 (Ahmed's view): "Accept the PCI task" (+22% capacity)
Executive page     → $4.2M revenue at risk, 6% burnout flag rate, 23% strategy drift
Dependency Graph   → Sarah node: blast radius = Atlas + Acme Corp if she leaves
AI Copilot         → Ask "who is overloaded?" → Sarah surfaces with full context
Recommendations    → "Reduce Sarah's load below 100% within 2 weeks"
Simulation         → Run "what if Sarah leaves?" → p95 scenario shows 14-week Atlas delay
```

This is the beating heart of the product: **one overloaded person = visible chain reaction
across 7 surfaces, each offering a different lens and a different action path**.

---

## §2 — The Desktop OS Shell (DizruptOS)

DIZRUPT's interface is a macOS-style web operating system. When you log in:

### Boot sequence (always happens)
```
1. Boot screen    — "DIZRUPT" wordmark, loading bar (~1.5s)
2. Lock screen    — blurred wallpaper, clock, "Unlock" button
3. Desktop        — wallpaper, Dock, Menubar, and all windows
```

The boot sequence runs every time you log in (even within the same browser tab). This
ensures the OS is always in a clean, predictable state.

### The Menubar (top bar)

| Zone | What it is | What it does |
|------|-----------|--------------|
| Apple  menu | Logo left-corner | About, Help, Quit |
| App name | Active app title | Switches per focused window |
| Control Center (☁ icon) | Click top-right | Light/dark mode, wallpaper, accent color, brightness, Do Not Disturb, Stage Manager |
| Clock | Live time | Click to open calendar popover |
| Notification bell | Badge count | Click to open Notification Center |

### The Dock (bottom bar)

The Dock contains all installed apps, pinned in your persona's default layout.
- **Hover** over an icon → app name tooltip appears
- **Click** → launches the app in a window (or brings existing window to front)
- **Running indicator** → green dot beneath icon = app window is open
- The Dock magnifies icons near the cursor (macOS-style spring effect)
- Right-click a Dock icon → Pin/Unpin from Dock

Apps in the Dock (default, all roles):
```
Home · Project Matrix · Operative Directory · AI Copilot · Simulation
```
Plus role-gated apps visible only when you have the required permission.

### Windows (the window manager)

Every app opens in a **floating window** with:
- **Traffic lights** (top-left): close (red) · minimize to genie animation (yellow) · fullscreen (green)
- **Drag** by the title bar to move
- **Resize** from any edge or corner (8-way)
- **Snap** to screen halves by dragging to an edge
- **Z-order** — clicking a window brings it to the front
- **Per-persona layout persistence** — your window positions are saved in localStorage
  per persona ID, restored next session

Multiple windows can be open simultaneously. There is no limit.

### Keyboard shortcuts and overlays

| Shortcut | Action |
|----------|--------|
| ⌘ Space (or Ctrl+Space) | Spotlight search |
| F3 | Mission Control (bird's-eye of all open windows) |
| F4 | Launchpad (full-screen app grid) |
| ⌘ ` (backtick) | Cycle between open windows |
| Escape | Close active overlay (Spotlight / Mission Control / Launchpad) |

### Hot Corners

Move your mouse to any corner of the screen (700ms dwell):
```
Top-Left     → Mission Control
Top-Right    → Notification Center
Bottom-Left  → Launchpad
Bottom-Right → Show Desktop (all windows minimize)
```

### Stage Manager (Control Center → toggle)

When Stage Manager is on, non-primary windows slide to a left-side thumbnail rail.
Click any thumbnail to bring that window to the primary position.

---

## §3 — RBAC: Who Can See What

Every persona in the demo is a different real employee from the seed org.
Their role determines what apps appear, what data is visible, and what actions are allowed.

### The six roles

| Role | Example in seed | What they can do |
|------|-----------------|-----------------|
| `executive` | Noor Al-Rashid (COO) | Read everything strategic; no operational mutations |
| `dept_head` | Priya Sharma (VP Eng) | See department capacity, burnout, risks; approve proposals in their dept |
| `project_manager` | Asha Venkat (Resource Mgr) | Full capacity control, task reassignment, proposal approval |
| `team_lead` | Sarah Okafor | Manage own team's tasks and capacity |
| `employee` | Ahmed Hassan | See own tasks, own capacity, accept/reject proposals about themselves |
| `admin` | Elias Brandt | Everything including audit and provisioning |

### The three enforcement layers

RBAC is enforced at **three independent layers** — passing one doesn't help if you fail another:

```
Layer 1 — Login: which persona you pick determines your role (Supabase auth in production)

Layer 2 — OS layer: apps are hidden from the Dock, Spotlight, and Launchpad
           if you don't have the required permission.
           e.g. "AI Copilot" requires view_ai. "Simulation" requires view_executive.
           Attempting to launch a gated app from a URL shows an access-denied toast.

Layer 3 — Data mutations: store mutations check useSession.can() before executing.
           e.g. requestReallocate() returns "Not permitted" if you lack the 'reallocate' grant.
           reviewProposal() refuses if you're not authorized.
           This layer is the actual security boundary — the UI hiding is cosmetic defense.
```

### The permission matrix

| Permission | employee | team_lead | project_manager | dept_head | executive | admin |
|-----------|----------|-----------|----------------|-----------|-----------|-------|
| view_capacity | own only | team | all | dept | all | all |
| view_burnout | ✗ | team | all | dept | all | all |
| view_executive | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| view_financial | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| reallocate | ✗ | ✗ | ✓ | ✓ | ✗ | ✓ |
| view_ai | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| view_audit | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## §4 — The Home App (Per-Role Command Surface)

**What it is:** The first thing you see after unlocking. It adapts completely per persona.

### What every persona sees

**Your Pulse section:**
- Today's date and a live org health sparkline (7-day trend with arrow + delta)
- Your name, role, and department
- Capacity this week as a bar: color-coded green (<80%) / amber (80–99%) / red (≥100%)

**Your stats grid (4 tiles, clickable):**
| Tile | What it shows | What clicking does |
|------|--------------|-------------------|
| Today / Overdue | Count of tasks due today or already overdue | Opens Tasks app → today_overdue filter |
| In Progress | Count of your active tasks | Opens Tasks app → in_progress filter |
| Blocked | Count of blocked tasks you own | Opens Tasks app → blocked filter |
| Critical | Count of urgent or critical-project tasks | Opens Tasks app → critical filter |

**Morning Brief (for managers and above):**
A live AI-generated summary of the three most important things this morning:
- Critical attention (red): Atlas at CRITICAL, Sarah's burnout flag
- Review required (amber): proposals awaiting decision, escalated risks
- No action needed (green): projects on track

**Daily Goals row:** Shows active OKRs as progress bars. Click any goal to open the Home app's goal detail.

**Agent Proposals (for project_manager and above):**
Shows pending AI proposals. Each proposal has:
- A summary (what the agent recommends and why)
- An Accept and Decline button
- Confidence score (e.g. 0.91)

### How Home connects to everything else

```
Today/Overdue tile → Tasks app (with today_overdue pre-filter)
Project tiles      → Project Matrix (filtered to that project)
Burnout warning    → Operative Directory (opens Sarah's profile)
Morning brief      → Links to the relevant app (Executive, Matrix, Directory)
Agent proposals    → Proposal detail (see §11)
Org Health graph   → Fetched from /api/v1/intelligence/health-history (30-day LCG trend)
```

---

## §5 — Tasks App

**What it is:** A full-screen task table with a filter rail. Shows all work in your scope.

### The filter rail (left side)

| Filter | What it shows |
|--------|--------------|
| All open | Everything not COMPLETED in your scope |
| Due today | `dueDate === TODAY` and not completed |
| Overdue | `dueDate < TODAY` and not completed |
| Pending | Status is TO_DO or BACKLOG |
| In progress | Status is IN_PROGRESS or REVIEW |
| Blocked | Status is BLOCKED |
| Critical | Priority URGENT, or blocked, or on a CRITICAL/AT_RISK/DELAYED project |
| Done | Status is COMPLETED |

There is also a synthetic `today_overdue` filter (dispatched from the Home app stat tile)
that shows `dueDate <= TODAY` — covering both due-today and overdue in one click.

### Scope by role

The tasks you see depend on your persona:
- **employee** → only tasks assigned to you personally
- **team_lead / project_manager** → your tasks + tasks on projects you own
- **dept_head / executive / admin** → your tasks + all tasks in your department (or all departments)

### The task row

Each row shows: task title (with status dot) · project code · status label · priority badge · due date (red if overdue) · hours logged/estimated · assignee avatar.

**Click any row** → opens the Task Drawer.

### Task Drawer

The drawer slides in from the right and shows:
- Full task title, description, labels
- Status, priority, due date, week bucket
- Assignee avatar + name
- Hours progress bar (logged ÷ estimated)
- Subtask progress (e.g. 3/5 done)
- Dependencies: tasks this one blocks or is blocked by
- For managers: **Reassign** button → triggers the capacity guardrail flow

### The capacity guardrail (North Star flow)

When a manager tries to reassign a task, the system:
```
1. Computes projected utilization = (current allocated + task hours) ÷ capacity
2. If projected ≥ 100%:
   → Parks the move in "pendingDrop" state (nothing applied yet)
   → Shows a warning dialog: "This will put [person] at [X]% — type a reason to override"
   → Manager MUST type an override reason (e.g. "Release-gating — cannot slip code freeze")
   → Reason is written to the audit trail with the actor's ID
3. If projected < 100%:
   → Auto-confirms immediately
   → Capacity cells updated atomically on both sides (from: -hours, to: +hours)
   → Audit event written
```

This is the core enforcement mechanism. The override reason is mandatory — you can't
click through it without explaining yourself.

---

## §6 — Project Matrix (Kanban Board)

**What it is:** A drag-and-drop Kanban board across 7 columns, showing all tasks grouped
by status.

### The 7 columns

```
BACKLOG → TO_DO → IN_PROGRESS → BLOCKED → REVIEW → CLIENT_REVIEW → COMPLETED
```

Each column has a colored dot matching the status tone, a task count, and a drop zone.

### Project filter

A pill-based filter bar at the top lets you scope to one project or see all.
Default: **All** (shows all 35 seed tasks across 6 projects).
Options: All · ATLS (Atlas) · HELIO (Helio) · PLSE (Pulse) · NMBS (Nimbus) · ORBT (Orbit) · QRTZ (Quartz)

### Cards

Each Kanban card shows:
- Priority badge (Urgent=red · High=amber · Medium=blue · Low=grey)
- Task title
- Assignee avatar
- Hours progress (logged/estimated as a bar at the bottom)
- Subtask progress (e.g. 3/5 icon)
- Labels (compliance · frontend · security · research...)

### Drag and drop

- **Any manager** (reallocate permission) can drag any task between columns
- **An employee** can only drag tasks assigned to themselves
- Dragging updates task status immediately (optimistic) via `moveTask()` in the store
- Column drop zones highlight in green while dragging

### How cards connect to everything else

A card in BLOCKED column for a task assigned to Sarah → that task appears in:
- Sarah's Tasks app blocked filter
- The Home app "Blocked" stat tile
- The risks page as a contributing factor to r-1

---

## §7 — Capacity Surface

**What it is:** A weekly capacity grid. Rows = people, columns = weeks. Each cell shows
allocated hours and a utilization bar.

### Reading the grid

```
Green  < 80%    — comfortable, has room for more
Amber  80–99%   — approaching limit, prioritize before adding more
Red    ≥ 100%   — over-allocated, something must move or be cut
```

Sarah's cell for Week 0 is red at 113%.
Inés Castillo (part-time at 32h/wk) shows 26/32 = 81% amber.

### The drag-to-reallocate seam

Each task chip in a cell is draggable. Dragging it to another person's cell triggers
the same capacity guardrail as the Task Drawer reassign button (see §5).

### Weeks

The grid shows 6 weeks: WEEKS[0] (current) through WEEKS[5] (5 weeks out).
These are computed dynamically at runtime — always starting from "this Monday" —
so the capacity data never becomes stale regardless of when you open the app.

### How capacity connects to everything else

```
Capacity data feeds → utilization() in the store
utilization() feeds → every persona's "this week" percentage in the roster list
utilization() feeds → the Home app pulse bar
utilization() feeds → burnout detection (≥100% for multiple weeks = burnout signal)
utilization() feeds → the Operative Directory profile capacity bar
utilization() feeds → the Agent's proposal reasoning ("Ahmed rises 65% → 87%")
```

---

## §8 — Operative Directory (People)

**What it is:** A master/detail directory of all 18 employees. Searchable, department-filtered.

### The roster (left side)

Shows every person with:
- Avatar (initials + accent color)
- Name and title
- Utilization % for the current week (color-coded)
- Burnout warning triangle (⚠) if the person has a burnout flag

Search box: filter by name, title, or any skill in real time.
Department chips: filter to Engineering, Design, Data & AI, Client Ops.

The view opens on YOUR team by default (filtered to your department). Executives and
admins see everyone.

### The profile (right side)

Clicking a person opens their full profile:

**Header:** Name, title, department, location, timezone, role label

**Stats grid (3 tiles):**
| Tile | What it shows |
|------|--------------|
| This week | Utilization % with color |
| Open tasks | Count of incomplete assigned tasks |
| Owns | Count of projects this person owns |

**Capacity bar:** Full-width bar showing this week's utilization at a glance

**Skills:** Tags for every skill the person has declared (e.g. Go · Payments · PCI-DSS · Postgres)

**Expertise:** Domain bars with depth scores (0–100)
- Depth 93 = Sarah's Payments Architecture mastery
- Depth 78 = Sarah's PCI compliance knowledge
- These scores drive the AI agent's skill-match reasoning

**Burnout signals (manager-private, RBAC-gated):**
Only visible to `dept_head`, `project_manager`, `admin` — never to `employee` role.
Shows:
- The specific burnout signals (e.g. "Logged >50h for 3 consecutive weeks")
- Flight risk percentage (e.g. 64%)

### Why the RBAC gate matters here

An employee should never see their own burnout flag surfaced as a formal risk — that
would be a performance management violation. Only managers see it. In the seed data,
Sarah herself (logged in as `team_lead`) does NOT see her own burnout section.

---

## §9 — Executive Intelligence Suite

**What it is:** A command center visible only to `executive` and `admin` roles.
It composes all intelligence engines into one weekly-review page.

### The 4 metric tiles

**Revenue at risk — $4.2M**
- Definition: Σ ARR of customers whose critical projects are delayed
- In the demo: Acme Corp ($4.2M ARR) is linked to Atlas Payments Migration (CRITICAL)
- The chip trail: Acme Corp → Project Atlas → Project health = CRITICAL → ARR at risk

**Strategy drift — 23%**
- Definition: hours spent on work NOT linked to any active goal ÷ total hours
- 23% drift = 77% goal-aligned (above the 65% minimum, below the 80% target)
- The biggest unlinked block is internal tooling requests (34h last week)

**Org Health Index — 72**
- Weighted composite: fairness 20% · manager effectiveness 25% · stability 15% ·
  psychological safety 20% · recognition 10% · meeting health 10%
- Target > 75. Current = 72 (declining — OHI was 78 six weeks ago)
- Primary drag: workload fairness degraded (Gini of utilization up 0.08), Sarah's burnout flag

**Burnout flag rate — 6%**
- 1 flagged out of 17 active employees = 5.9% ≈ 6%
- Target < 5%. Currently above threshold.
- The flagged employee is Sarah Okafor.

### The strategy drift vs OHI chart

A 7-week area chart showing two lines:
- **Drift %** (amber): rises from 12% → 23% over 7 weeks
- **OHI** (green): falls from 78 → 72 over the same period

The pattern the chart reveals: **drift climbs first, OHI follows it down 2 weeks later**.
This is the leading indicator the executive page was built to surface.

### The morning brief

An AI-generated structured summary with three severity buckets:
- **Critical attention** → Atlas CRITICAL, Sarah burnout
- **Review required** → 2 proposals awaiting decision, escalated vendor risk
- **No action needed** → Pulse and Orbit on track, Helio recovering

Every line in the brief is a button — clicking it opens the relevant OS app window.

### The portfolio matrix

A table of all 6 projects with:
- Health badge (CRITICAL / AT_RISK / ON_TRACK)
- Budget burn bar (consumed hours ÷ budget hours)
- Velocity sparkline (trending up or down)
- "Why" explain chip (click to see the 3 health reasons)

### The OKR scorecard

4 active goals shown as progress bars. Click any goal to open it in the Home app.

---

## §10 — Risks

**What it is:** A structured risk register. Every risk has severity, probability, impact,
ownership, status, and mitigation steps.

### The seed risks (6)

| ID | Title | Severity | Status |
|----|-------|----------|--------|
| r-1 | Payments expertise concentrated in one person | HIGH | ESCALATED |
| r-2 | Atlas migration slippage beyond July 31 | HIGH | MONITORING |
| r-3 | Third-party vendor integration delay | MEDIUM | ESCALATED |
| r-4 | QA coverage gap before code freeze | MEDIUM | MONITORING |
| r-5 | Design-to-dev handoff delays | LOW | OPEN |
| r-6 | Data pipeline schema misalignment | LOW | OPEN |

### Severity matrix

```
Severity = Probability × Impact × Vulnerability modifier

LOW     < 0.3
MEDIUM  0.3 – 0.6
HIGH    > 0.6
```

Risk r-1 (Sarah as SPOF): probability=0.7 × impact=0.9 = 0.63 → HIGH

### How risks connect

```
r-1 (Sarah SPOF) →
  appears in: Operative Directory (her profile) + Executive page signals
  drives: Agent Inbox proposal pr-1 (redistribute her PCI task)
  shows in: Dependency Graph (Sarah node highlighted as bus-factor risk)
  copied to: AI Copilot context ("risks: Sarah Okafor — concentration risk")

r-2 (Atlas slippage) →
  appears in: Executive page portfolio matrix (Atlas = CRITICAL)
  drives: $4.2M revenue at risk tile
  connected to: Acme Corp customer edge in the graph
  tracked by: Goal g-1 (Payments Migration launch) at 28% progress
```

### The risk detail panel

Click any risk to expand it:
- Full description and context
- Mitigation steps (ordered action plan)
- Affected projects
- Owner name
- Status tag (OPEN / MONITORING / ESCALATED / RESOLVED)

Risks auto-escalate when their severity crosses a threshold (computed, not manually set).

---

## §11 — Agent Inbox (Proposals)

**What it is:** The AI agent's decision queue. The agent detects problems, proposes
solutions, and waits for a human to approve or reject each one.

### The agent types

| Agent | What it watches | Example action |
|-------|----------------|----------------|
| `burnout_safety` | Overloaded employees with burnout signals | Redistribute tasks |
| `delivery_critical` | Projects that will miss deadline | Reassign or reschedule |
| `skill_match` | Tasks assigned to people without the right skills | Suggest better assignee |
| `succession` | Capabilities held by only 1 person | Expand knowledge, cross-train |
| `risk_advisory` | Emerging security / access anomalies | Revoke session, alert manager |

### The seed proposals (10)

The most important ones:

**pr-1 (burnout_safety — for managers):**
"Reduce Sarah Okafor's load below 100% this week"
→ Move PCI evidence pack (9h) from Sarah to Ahmed
→ Sarah drops 112% → 90%; Ahmed rises 65% → 87%
→ Confidence: 0.91

**pr-2 (burnout_safety — for Ahmed):**
Ahmed's employee-level view of the same move: "You've been offered 9h of PCI work"
→ Ahmed accepts or declines from his own Home screen
→ His view shows: how it affects his own utilization, what skills it needs

**pr-4 (delivery_critical):**
"Atlas is 7 tasks overdue — consider a scope reduction or timeline extension"

**pr-5 (succession):**
"Payments architecture knowledge is concentrated in Sarah — propose cross-training plan"

### The proposal card

Each card shows:
- Agent type chip (burnout_safety / delivery_critical / etc.)
- Title and summary
- Reasoning list (e.g. "Sarah logged >50h for 3 weeks", "Ahmed has skill-match 0.81")
- Confidence score (0–1, shown as a percentage ring)
- Validation checklist (green ✓ / red ✗ for each guardrail)
- Accept / Decline buttons

### What happens when you Accept

```
1. The store's reviewProposal("pr-1", "approved") is called
2. It checks the current capacity AGAIN (the stale-check):
   If Ahmed is NOW at 100% (filled up between proposal and approval):
   → proposal.status = "expired" (not applied — security property)
   → Audit event: proposal_stale
   → Nothing else changes

3. If Ahmed still has room:
   → Task t-10 reassigned: assigneeId: "u-sarah" → "u-ahmed"
   → Capacity cells updated: Sarah WEEKS[1] − 9h, Ahmed WEEKS[1] + 9h
   → proposal.status = "approved"
   → Audit event: proposal_approved (with actorId, taskId, deltaHours, both sides % before/after)
```

The stale-check is a **security property**: approving a proposal cannot bypass the
capacity guardrail even if time passed between creation and approval.

### What happens when you Decline

```
→ proposal.status = "rejected"
→ Audit event: proposal_rejected (with the reason stored for 30 days of agent memory)
→ The agent uses the decline reason to avoid making the same mistake again
→ No capacity or task changes
```

---

## §12 — Decisions (Org Memory)

**What it is:** A structured log of strategic decisions the org has made, with evidence,
outcomes, and retrospectives. This is the org's institutional memory.

### The seed decisions (5)

| ID | Title | Outcome |
|----|-------|---------|
| d-1 | Adopt Go for all new backend services | SUCCEEDED (9 months later, high confidence) |
| d-2 | Delay mobile launch 6 weeks for security audit | SUCCEEDED |
| d-3 | Sunset legacy ETL pipeline before Q3 | PENDING (in progress) |
| d-4 | Hire 2 backend engineers before Atlas cutover | FAILED (missed hire deadline) |
| d-5 | Implement PCI-DSS Level 1 controls | PENDING |

### Decision detail

Each decision has:
- **Description:** the full context of why this decision was made
- **Rationale:** the reasoning at decision time
- **Alternatives considered:** what else was on the table
- **Evidence:** supporting data points (3–5 items per decision)
- **Outcome:** SUCCEEDED / FAILED / PENDING
- **Outcome date:** when the result was known
- **Retrospective:** what was learned after the fact

### How decisions connect to everything else

Decisions are the "institutional memory" layer:
- When the AI Copilot is asked "why did we choose Go?", it pulls from d-1's rationale
- When a similar architectural question comes up, the agent references relevant past decisions
- The GitHub importer writes new decisions automatically: every merged PR with "decision:" in
  the title or body creates a decision record with the PR description as evidence
- Decisions link back to the projects and capabilities they affected

---

## §13 — Recommendations Engine

**What it is:** The AI engine's outbound recommendations — things the system thinks you
should do this week, ranked by priority and urgency.

### How recommendations are generated

The recommendation engine runs a 4-pass analysis:

```
Pass 1: Capacity scan
  For each employee: utilization ≥ 100% → priority 100 recommendation to reduce load
  For each employee: utilization ≥ 80% → lower-priority heads-up

Pass 2: Risk scan
  For each risk: severity HIGH and status OPEN → recommend immediate mitigation
  For each risk: escalated and no mitigation action in 5 days → escalation recommendation

Pass 3: Dependency analysis
  For each capability held by only 1 person: recommend cross-training or documentation
  For each task on a CRITICAL project with no assignee: recommend urgent assignment

Pass 4: Goal alignment scan
  For each active goal with progress < 40%: recommend reviewing linked project health
  For any goal with zero linked active tasks: flag as "strategy drift contributor"
```

### What a recommendation looks like

```
Priority: 100
Type: capacity
Title: Reduce Sarah Okafor's load this week (current: 112%)
Evidence: 45h allocated vs 40h capacity
          PCI task (9h) is the lowest-risk task to move (skill-match: Ahmed 0.81)
Action: Use the Agent Inbox proposal pr-1 or manually reassign via Task Drawer
Impact: Sarah drops to 90%, Atlas risk reduces, r-1 severity decreases
```

### How recommendations connect

Recommendations don't create new data — they surface patterns from existing data:
```
Sarah's 113% → Recommendation: reduce load → links to pr-1 → links to Task Drawer
r-1 severity → Recommendation: cross-train → links to Decisions page (d-5)
Atlas CRITICAL → Recommendation: review blockers → links to Project Matrix (Atlas filter)
```

---

## §14 — What-If Simulation (Monte Carlo)

**What it is:** A native OS window that runs Monte Carlo simulations over the org's
current state. 10,000 iterations per scenario. Returns p5/p50/p95 confidence intervals.

### The 4 scenario types

**1. Delivery risk (default)**
Models: current overloads + blocked tasks + critical project dependencies
Output: probability distribution of "how many weeks will Atlas slip?"
Seed result: p50 = 4 weeks slip, p95 = 11 weeks slip

**2. Team attrition**
Models: flight risk scores × dependency concentration × current capacity
Output: "if we lose X random people in the next 6 months, what % of projects are delayed?"
Seed result (Sarah scenario): p50 = 14-week Atlas delay, p95 = project cancellation

**3. Capacity crunch**
Models: current utilization distribution + upcoming deliverables + planned absences
Output: "at what point does the team's aggregate utilization exceed 85%?"
Seed result: Week 3 (2 weeks from now) — Fatima and Mei join Sarah in red zone

**4. Budget overrun**
Models: consumed hours × loaded cost rate × remaining scope
Output: probability distribution of % budget overrun at project completion
Seed result (Atlas): p50 = 23% overrun, p95 = 41% overrun

### How to use the simulation

1. Open Simulation from the Dock or Spotlight
2. Select a scenario type from the left panel
3. Adjust parameters (probability slider, impact slider, confidence threshold)
4. Click "Run Simulation"
5. Read the output:
   - **Percentile bars** (p5 = best case, p50 = median, p95 = worst case)
   - **Risk flags** (red chips for conditions that push toward the worst case)
   - **Recommendations** (actions that would shift the distribution left)

### How simulation connects to the rest

```
Flight risk input  → comes from employee.flightRisk scores in seed data
Capacity input     → comes from the same capacity store as the Capacity page
Delivery input     → reads project health, overdue counts, blocked task counts
Output             → doesn't write back to the org; it's read-only intelligence
```

The simulation is RBAC-gated (`view_executive`) because the outputs are sensitive:
a p95 scenario showing "Sarah leaving delays Atlas 14 weeks" should not be visible
to Sarah herself.

---

## §15 — AI Copilot

**What it is:** A native OS window chat app that connects to the intelligence backend.
You ask questions in natural language; the Copilot answers with evidence-backed responses.

### How it works technically

```
1. You type a question and press Enter (or click a starter prompt)
2. Frontend sends GET /api/v1/copilot?q=<your question>
3. Backend (copilot-llm.ts):
   a. Runs TF-IDF semantic search across all entities (employees, projects, tasks, risks,
      decisions, recommendations, capabilities)
   b. Selects the top-K most relevant results (cosine similarity over TF-IDF vectors)
   c. Builds a context window: "SEMANTIC CONTEXT: [top-K results]" + system prompt
   d. Calls Claude claude-sonnet-4-6 with the context + your question
   e. Returns: { answer, evidence, intent, llmEnhanced: true }
4. Frontend renders the answer with:
   - Evidence chips (one per piece of cited data)
   - Claude badge (shows "Claude" label when LLM enhanced the answer)
   - Intent-aware follow-up chips (3 chips based on what the API detected your intent was)
5. If LLM is unavailable (no ANTHROPIC_API_KEY or timeout):
   → Deterministic fallback: direct query against seed data, returns structured answer
   → Still shows evidence chips; llmEnhanced: false
```

### The 6 starter prompts (empty state)

When you open the Copilot with no conversation, you see a grid of 6 one-click starters:
1. "Who is most overloaded this week?"
2. "What are our biggest risks right now?"
3. "Which projects are at risk of delay?"
4. "How should I prioritize my tasks today?"
5. "Who would we lose the most if they left?"
6. "How is our org health trending?"

### Intent-aware follow-up chips

After each answer, the Copilot generates 3 contextual chips based on detected intent:

| Detected intent | Example chips generated |
|----------------|------------------------|
| capacity_overview | "Show burnout risks" · "Which dept is most strained?" · "Who has room this week?" |
| burnout_risk | "How do I reassign Sarah's tasks?" · "Which tasks can move to Ahmed?" · "View the proposal" |
| project_health | "What's blocking Atlas?" · "Show blocked tasks" · "Revenue at risk?" |
| succession | "Who else knows payments?" · "Show fragile capabilities" · "Graph bus-factor view" |
| org_health | "What's dragging it down?" · "Show the drift chart" · "Which team is healthiest?" |

### Live example Q&A using seed data

**Q: "Who is most overloaded right now?"**
A: "Sarah Okafor (Payments Lead) is at 113% utilization this week — 45h allocated against
   a 40h capacity. She has 4 active tasks this week: [evidence chips: Ledger runbook 14h /
   Settlement ingestion 12h / Reconciliation 10h / PCI pack 9h]. Agent pr-1 proposes
   moving the PCI task to Ahmed Hassan, which would bring her to 90%."
→ Follow-up chips: "View proposal pr-1" · "Show Ahmed's capacity" · "Run attrition simulation"

**Q: "What risks should I worry about today?"**
A: "Two HIGH risks: r-1 (Payments expertise concentrated in Sarah — ESCALATED) and
   r-2 (Atlas migration slippage beyond July 31 — MONITORING). r-1 is directly connected
   to Sarah's flight risk of 64% and the $4.2M Acme Corp ARR dependency."
→ Follow-up chips: "What mitigation exists?" · "Cross-training options?" · "Show dependency graph"

---

## §16 — Dependency Graph

**What it is:** An interactive force-directed graph that maps every dependency in the org:
people → capabilities → projects → risks → customers.

### The nodes (what's on the graph)

```
🟢 Employee nodes    — each person; sized by how many capabilities they hold
🔵 Capability nodes  — domain knowledge areas (Payments Architecture, PCI-DSS, etc.)
🟡 Project nodes     — 6 active projects; sized by budget
🔴 Risk nodes        — 6 risks; colored by severity
🟠 Customer nodes    — key accounts (Acme Corp, Meridian Bank)
```

### The edges (what connects to what)

```
Employee → Capability    "Sarah HOLDS Payments Architecture (depth 0.93)"
Project  → Capability    "Atlas REQUIRES Payments Architecture"
Risk     → Capability    "r-1 THREATENS Payments Architecture"
Project  → Customer      "Atlas SERVES Acme Corp"
Employee → Project       "Sarah OWNS Atlas"
Task     → Task          "t-6 BLOCKS t-1 (dependency chain)"
```

### The 4 analytical lenses

Switch between lenses using the pill buttons below the graph:

**1. Blast Radius**
Highlights nodes that, if removed, would cascade failures to the most other nodes.
Sarah's node shows: removing her affects Atlas → affects Acme Corp → $4.2M ARR.
Blast radius is computed via BFS: `blast_radius(node) = count of all nodes reachable from it`.

**2. Bus Factor**
Highlights capabilities held by only 1 person. These are the red nodes — a single
departure would leave a capability gap.
In the seed: Payments Architecture (only Sarah, depth 0.93) = bus factor 1.

**3. Influence Map (Betweenness Centrality)**
Highlights nodes that sit on the most paths between other nodes.
Formula: Brandes BFS with backpropagation. Runs in-browser at mount.
High-betweenness nodes wear a green "TOP" badge.
Asha Venkat (Resource Manager) is high-betweenness: she sits between most people and
most projects because she's the scheduling hub.

**4. PageRank (Eigenvector Centrality)**
Highlights nodes that are "important because they're connected to important things".
Formula: damped random walk, damping=0.85, 35 iterations, dangling-node redistribution.
High-PageRank nodes wear an orange "TOP" badge.
Atlas project scores highest PageRank: it has the most high-value inbound connections
(Sarah, Ahmed, Mei, Jonas, Yuki all work on it; it serves Acme Corp).

### Interacting with the graph

- **Zoom** with scroll wheel (range 0.2× to 3×)
- **Pan** by clicking and dragging the background
- **Click a node** → opens the relevant OS app window (not a navigation — stays in-OS)
  - Employee node → Operative Directory, opens that person's profile
  - Project node → Project Matrix, filtered to that project
  - Risk node → Risks page, expanded to that risk
- **Hover a node** → shows a tooltip with key stats
- Stats row above the graph: node count · edge count · avg degree · top influencer count · top PageRank count

---

## §17 — Dependency Graph: Why Sarah Appears Critical on All 4 Lenses

This section shows exactly how the seed data causes Sarah to rank high on every graph lens.

**Blast Radius:**
Sarah → holds → Payments Architecture (depth 0.93)
Payments Architecture → required by → Atlas project
Atlas project → serves → Acme Corp ($4.2M ARR)
Atlas project → affected by → Risk r-1 (HIGH)
Blast radius = 4 downstream nodes (capability + project + customer + risk).
No other employee has a blast radius of 4. Most employees have 1–2.

**Bus Factor:**
Payments Architecture has exactly 1 holder with depth > 0.7: Sarah (0.93).
Ahmed has depth 0 for Payments Architecture (he has billing pipelines, 0.61).
Bus factor for Payments Architecture = 1. Sarah is the single point of failure.

**Betweenness Centrality:**
Sarah is on the shortest path between:
- Fatima (Platform) and Atlas (Fatima's Kubernetes work serves Atlas infra)
- Compliance auditors and the PCI capability
- Acme Corp and any Atlas team member (she's the account contact)
High betweenness = Sarah is a communication/coordination bottleneck.

**PageRank:**
Sarah's PageRank is high because she is linked to by:
- Atlas (high-value project, itself linked to by Acme Corp)
- Risk r-1 (which is linked to by the risk management system)
- PCI-DSS capability (which is linked to by the compliance goal)
All her inbound links are themselves important, which compounds her PageRank score.

---

## §18 — Import System (Data Ingestion)

**What it is:** HMAC-verified webhook receivers for Jira, Linear, and GitHub.
When connected, these automatically write to the DIZRUPT graph tables.

### Jira webhook

URL: `POST /api/v1/import/jira`
What it writes:
- Issue created → new Task record
- Issue updated (status change) → updates task status
- Project created → new Project record
- HMAC-256 signature verified against `JIRA_WEBHOOK_SECRET`

### Linear webhook

URL: `POST /api/v1/import/linear`
What it writes:
- IssueCreated → new Task record
- IssueUpdated → status/assignee update
- ProjectCreated → new Project record
- HMAC-256 signature verified against `LINEAR_WEBHOOK_SECRET`

### GitHub webhook

URL: `POST /api/v1/import/github`
What it writes:
- `pull_request` event with action `closed` and `merged: true` →
  new Decision record (PR title = decision title, PR body = evidence)
- HMAC-256 signature verified against `GITHUB_WEBHOOK_SECRET`

### Idempotency

All three webhooks are idempotent: processing the same event twice does not create
duplicate records. The deduplication key is the external source ID (Jira issue key,
Linear issue ID, GitHub PR number).

### Demo mode behavior

In demo mode (no Supabase), webhooks validate the HMAC signature and return 200,
but do not write to DB (they write to the audit log instead). This allows testing
webhook delivery without a live database.

---

## §19 — How It All Connects: The Complete Data Flow

This section traces a single real event through the entire system.

### Scenario: Sarah's settlement task gets blocked by a vendor

```
External event: Vendor fails to deliver API spec → task t-3 (Settlement file ingestion) 
               moves from IN_PROGRESS to BLOCKED

Step 1: Task status updates
  → If connected to Jira: webhook fires, Linear/Jira status=BLOCKED → /api/v1/import
  → Demo mode: manager manually moves card in Project Matrix
  → store.moveTaskStatus("t-3", "BLOCKED") is called
  → Task status = BLOCKED in store

Step 2: Project health recalculates
  → Atlas project now has 3 BLOCKED tasks (t-3, t-6, t-7)
  → Automated rule: project with ≥3 blocked critical tasks → health = CRITICAL
  → Atlas.health = "CRITICAL"

Step 3: Risk activates
  → Risk r-3 (Third-party vendor integration delay) status → ESCALATED
  → Risk r-2 (Atlas slippage) probability increases → still HIGH

Step 4: Intelligence surfaces update
  → Executive page: Atlas row in portfolio matrix goes red
  → Executive page: "Revenue at risk" stays $4.2M (already CRITICAL)
  → Morning brief: "Atlas at CRITICAL: 7 overdue · QA 112% · velocity −38%"
  → OHI: workload fairness drops slightly (more pressure on remaining team)

Step 5: Agent fires a new proposal
  → delivery_critical agent: detects Atlas has ≥3 blockers with no resolution
  → Creates proposal pr-4: "Atlas is 7 tasks overdue — consider scope reduction"
  → Proposal appears in Home app's Agent Inbox for Asha Venkat (project_manager)

Step 6: AI Copilot answers change
  → Ask "what are our biggest risks?" → r-3 now appears at top with ESCALATED status
  → Ask "what's blocking Atlas?" → t-3 appears with vendor context

Step 7: Dependency graph updates
  → Atlas node re-renders (health=CRITICAL color applies)
  → Blast radius from Atlas increases (more dependencies now threatened)

Step 8: Recommendations update
  → New recommendation: "Resolve vendor blocker on t-3 or reassign to unblock Atlas"
```

Everything in DIZRUPT is connected through the same shared store + derived intelligence.
One event → cascades through 8 surfaces automatically.

---

## §20 — How a Real Organization Uses DIZRUPT

### Day 0: Onboarding

```
1. Connect your tools:
   - Jira/Linear → paste webhook URL from Settings → tasks + projects auto-import
   - GitHub → paste webhook URL → merged PRs auto-create decision records
   - Optional: Slack webhook for notifications

2. Import your people:
   - SCIM 2.0: connect your IdP (Okta, Azure AD) → employees sync automatically
   - OR: CSV upload → employees created with roles

3. Set capacity:
   - Each person's capacityHoursPerWeek is set at import or in the Operative Directory
   - Weekly capacity allocations are seeded from current task assignments

4. Connect goals:
   - Create OKRs in the Goals section (or let the AI suggest them from your project set)
   - Link projects to goals: Atlas → "Complete Payments Migration" goal
```

### Week 1: The first Monday morning review

```
Executive opens the OS at 9am:
1. Home app → reads the morning brief: what needs attention today
2. Clicks "Sarah Okafor burnout flag" → Operative Directory opens, sees flight risk 64%
3. Clicks "2 proposals awaiting decision" → Agent Inbox opens
4. Reviews pr-1: Move Sarah's PCI task to Ahmed. Checks Ahmed's capacity bar (65% → 87%).
   Accepts. Done in 90 seconds.
5. Opens Executive page → reviews portfolio matrix, sees Atlas still CRITICAL
6. Opens Simulation → runs "Delivery risk" scenario → p50 = 4-week slip confirmed
7. Makes decision: extend Atlas timeline 4 weeks, communicate to Acme Corp

Total time for the above: ~15 minutes. The org's most important decisions made with
full data context, in one place, with no tab-switching.
```

### The ongoing weekly rhythm

```
Monday (Executive): Morning brief → Agent Inbox → Simulation → decision
Tuesday (Project Manager): Capacity review → Kanban board → reassign blockers
Wednesday (Team Lead): Check your team's utilization → flag risks to manager
Thursday (everyone): Review your own tasks → update statuses → log hours
Friday (all managers): Review Recommendations → act on anything that aged > 3 days
```

### When you have real data (not the seed)

With your real people, projects, and tasks imported:

1. **Sarah's story becomes your story.** The system will find YOUR overloaded people
   and surface them with the same evidence trail.

2. **The dependency graph reveals your actual SPOFs.** Who in YOUR org holds critical
   knowledge that no one else has? The system will find them.

3. **The executive intelligence becomes predictive.** Revenue at risk = your real ARR
   linked to your real critical projects and real customers.

4. **The AI Copilot knows your actual org.** "Who is overloaded?" returns your people's
   names with your actual hours.

5. **Decisions build institutional memory.** Every GitHub merge + Jira status update +
   capacity change is logged. After 3 months you have a complete org-intelligence history.

---

## §21 — How to Not Overwhelm First-Time Users

### The "one story" principle

When showing DIZRUPT to someone for the first time, do NOT start with a feature tour.
Start with one story:

> "Sarah is at 113%. Here's why. Here's every consequence. Here's what the AI recommends.
> Here's how a manager fixes it in 90 seconds."

Then let the person explore from there.

### The 30-second demo path

```
1. Open the Home app → point to the morning brief → "everything critical in one sentence"
2. Click "Sarah Okafor burnout flag" → Operative Directory opens → "this is why she matters"
3. Open Agent Inbox → show pr-1 → "the AI already knows what to do, click Accept"
4. Open Dependency Graph → Sarah node → "here's the blast radius if she leaves"
5. Open Simulation → run attrition scenario → "$4.2M ARR, 14-week delay"
```

Total time: 3 minutes. The audience has seen: problem detection → root cause → action → consequence → simulation.

### What NOT to show first

- Do NOT start with the Capacity grid (too many numbers, no narrative)
- Do NOT start with the Audit trail (interesting to security buyers, not to operators)
- Do NOT start with the Settings (obviously not)
- Do NOT open more than 3 windows at once (the OS is powerful but can look complex)

### The first 5 questions people ask

**"Is this real-time?"**
→ In demo mode: no — it's seed data. In production with Supabase Realtime wired up:
  yes — task status changes, capacity updates, and proposals propagate immediately.

**"How does it get the data?"**
→ Two paths: (1) webhooks from Jira/Linear/GitHub fire automatically on every change;
  (2) the SCIM IdP connector syncs people from Okta/Azure AD every 15 minutes.

**"Can it work for a smaller team?"**
→ Yes. The value floor is around 8–10 people. Below that, a spreadsheet works fine.
  The sweet spot is 15–150 people (too complex for a spreadsheet, too small for Workday).

**"What happens when the AI is wrong?"**
→ Every proposal requires human approval. The AI suggests; a human decides.
  Declined proposals are logged with the reason, so the agent learns not to repeat them.

**"Can employees see their burnout flag?"**
→ No. Burnout flags are visible only to managers (RBAC-gated). Employees see their
  capacity bar and task load, but not the formal burnout risk score.

---

## §22 — Every Button and What It Does

### Desktop-level controls

| Button / Control | Location | What it does |
|-----------------|----------|-------------|
| Unlock | Lock screen | Transitions from lock phase to desktop |
| Traffic light: red × | Window title bar | Closes the window |
| Traffic light: yellow − | Window title bar | Minimizes with genie animation |
| Traffic light: green □ | Window title bar | Toggles fullscreen |
| App icon | Dock | Launches app (or focuses if already open) |
| ⌘+Space | Keyboard | Opens Spotlight |
| F3 | Keyboard | Opens Mission Control |
| F4 | Keyboard | Opens Launchpad |
| ⌘+` | Keyboard | Cycles windows |

### Spotlight controls

| Element | What it does |
|---------|-------------|
| Search input | Filters apps by name/description in real time |
| App result row | Click → closes Spotlight + opens that app |
| Escape | Closes Spotlight |
| Arrow keys | Navigate results |
| Enter | Opens highlighted result |

### Control Center controls

| Toggle | What it does |
|--------|-------------|
| Light / Dark | Switches OS-wide theme (saved to localStorage) |
| Wallpaper thumbnail | Changes desktop wallpaper (7 options) |
| Accent color dot | Changes OS accent color (6 options) |
| Reduce Transparency | Disables backdrop blur (performance mode) |
| Do Not Disturb | Mutes notification toasts |
| Stage Manager | Toggles the left-side window rail |
| Brightness slider | Dims the desktop (opacity overlay) |

### Home app controls

| Button | What it does |
|--------|-------------|
| Today/Overdue tile | Opens Tasks app with today_overdue filter |
| In Progress tile | Opens Tasks app with in_progress filter |
| Blocked tile | Opens Tasks app with blocked filter |
| Critical tile | Opens Tasks app with critical filter |
| Brief line (any) | Opens the relevant app (Executive / Matrix / Directory) |
| Accept (proposal card) | Calls reviewProposal("approved") — applies reallocation |
| Decline (proposal card) | Calls reviewProposal("rejected") — logs to audit |
| View all proposals | Opens Agent Inbox app |

### Project Matrix controls

| Button | What it does |
|--------|-------------|
| Project filter pill | Scopes board to one project (or All) |
| Drag card to column | Calls moveTask() — updates status |
| Drag card to person (capacity view) | Triggers capacity guardrail flow |

### Capacity guardrail dialog

| Button | What it does |
|--------|-------------|
| Override reason input | Text field — REQUIRED to be filled before confirming |
| Confirm Override | Applies move + writes audit event with override reason |
| Cancel | Clears pendingDrop, nothing changes |

### Task Drawer controls

| Button | What it does |
|--------|-------------|
| Status dropdown | Changes task status |
| Reassign button | Triggers capacity guardrail flow |
| Mark done | Sets status = COMPLETED |
| Close (×) | Closes the drawer |

### Operative Directory controls

| Element | What it does |
|---------|-------------|
| Search box | Filters roster by name/title/skill |
| Department chip | Filters roster to that department |
| Person row | Selects and shows their profile on right |
| Skill tag | No action (read-only) |
| Expertise bar | No action (read-only) |

### Agent Inbox controls

| Button | What it does |
|--------|-------------|
| Accept | reviewProposal("approved") — checks staleness, applies if safe |
| Decline | reviewProposal("rejected") — logs 30-day agent memory |
| Conflict alert | Shows conflicting proposal detail (coordinated compromise) |

### AI Copilot controls

| Element | What it does |
|---------|-------------|
| Starter prompt card | Sends that question, starts conversation |
| Text input | Type your question |
| Enter key | Sends the message |
| Shift+Enter | Inserts newline without sending |
| Follow-up chip | Sends that follow-up question with one click |
| Clear button | Resets the conversation thread |
| Evidence chip | Read-only — shows what data the AI cited |
| Claude badge | Indicates LLM enhanced the response |

### Dependency Graph controls

| Control | What it does |
|---------|-------------|
| Scroll wheel | Zoom in/out (0.2× – 3×) |
| Click + drag background | Pan the graph |
| Click a node | Opens the relevant OS app for that entity |
| Lens pill: Blast Radius | Colors nodes by blast radius size |
| Lens pill: Bus Factor | Highlights single-holder capabilities |
| Lens pill: Influence | Shows betweenness centrality (TOP badges) |
| Lens pill: PageRank | Shows eigenvector centrality (TOP badges) |

---

## §23 — Complete Data Model (What the Seed Contains)

### Employees (18)
Full fields per employee:
```
id, name, initials, role, title, departmentId, capacityHoursPerWeek,
skills[], expertise[{domain, depth}],
burnoutFlag, burnoutSignals[], flightRisk,
location, timezone, accent (avatar color), managerId
```

### Projects (6)
```
id, code, name, health, ownerId, departmentId,
budgetHours, consumedHours,
velocityTrend[], healthReasons[],
milestones[]
```

### Tasks (35)
```
id, title, projectId, assigneeId, status, priority,
estimatedHours, loggedHours,
dueDate, weekStart,
labels[], dependsOn[], subtasks{done, total}
```

### Capacity Cells (6 people × 6 weeks = 36 cells)
```
employeeId, weekStart, allocatedHours, loggedHours
```
Key values:
- Sarah WEEKS[0]: 45h allocated (113%)
- Ahmed WEEKS[0]: 26h allocated (65%)
- Inés WEEKS[0]: 26h allocated (81% — she's part-time at 32h)

### Risks (6)
```
id, title, description, probability, impact, severity,
status (OPEN/MONITORING/ESCALATED/RESOLVED),
ownerId, affectedProjectIds[], mitigationSteps[]
```

### Proposals (10)
```
id, agentType, title, summary, reasoning[],
action{kind, taskId, fromEmployeeId, toEmployeeId, deltaHours, projectId},
confidence, priority, visibility[roles],
status (pending/approved/rejected/expired),
conflict{withAgent, conflictType, resolution}
```

### Goals (4)
```
id, title, description, progress (0–1),
linkedProjectIds[], keyResults[{title, target, current}]
```

Key goals:
- g-1: "Complete Payments Migration Launch" → 28% progress (Atlas is CRITICAL)
- g-2: "Achieve PCI-DSS Level 1 Certification" → 45% progress
- g-3: "Improve Org Health Index to 80" → 72/80 = 90% of target
- g-4: "Reduce time-to-deploy to 2 days" → 61% progress

### Decisions (5)
```
id, title, description, rationale,
alternatives[], evidence[{type, value, confidence}],
outcome (SUCCEEDED/FAILED/PENDING), outcomeDate, retrospective,
linkedProjectIds[], linkedCapabilityIds[]
```

### Capabilities (linked to employees and projects)
Capabilities are domain knowledge areas. Key ones in the seed:
```
Payments Architecture — held by Sarah (0.93), partially by Ahmed (0.0 — none)
PCI-DSS Compliance    — held by Sarah (0.78)
Go backend            — held by Ahmed (0.8), Mei (0.75), Sarah (0.6)
Kubernetes            — held by Fatima (0.81)
ML/LLM ops            — held by Zara (0.77)
```

### Audit Trail (seed: 12+ events)
```
id, timestamp, actorId, actionType, targetId, targetType,
detail, overrideReason (if capacity override)
```

---

## §24 — The Goals ↔ Projects ↔ Capacity ↔ Tasks Chain

This is the full traceability chain that connects strategic intent to daily work.

```
Goal g-1: "Complete Payments Migration Launch"
  ↓ linked to
Project p-atlas: Atlas Payments Migration
  ↓ contains
Tasks: 12 tasks assigned to Sarah (45h), Ahmed (26h), Mei, Jonas, Yuki
  ↓ consumes
Capacity cells: Sarah WEEKS[0] = 45/40 → 113%
  ↓ triggers
Burnout signal: >50h × 3 weeks, 0 PTO in 112 days
  ↓ surfaces as
Risk r-1: Payments SPOF
  ↓ activates
Agent pr-1: "Move 9h from Sarah to Ahmed"
  ↓ if approved
Capacity update: Sarah WEEKS[1] -= 9h (45→36, 113%→90%)
                Ahmed WEEKS[1] += 9h (26→35, 65%→87%)
  ↓ goal progress improves
g-1 progress: tracks remaining task completions vs total → currently 28%
```

This is what "full traceability" means: you can follow a thread from
**a strategic goal all the way down to an individual's hour allocation** and back up.

---

## §25 — The PRD Story (How the Design Connects to the Product)

DIZRUPT's PRD defines 31 laws (architectural invariants). The key ones that
explain the product design decisions:

**PRD §3.3 — The capacity guardrail:**
"A reallocation that would push any employee's utilization ≥ 100% requires a typed
override reason. This reason is permanent and audited. No silent over-allocations."
→ This is why the reassign dialog asks you to type a reason. It's not UX friction —
  it's an architectural law.

**PRD §6.7 — The stale-check:**
"An approved proposal must re-verify the target employee's capacity at approval time,
not at proposal-creation time. If the situation changed, the proposal expires."
→ This is why `reviewProposal("approved")` re-checks utilization before applying.

**PRD §22.2 — Revenue at risk:**
"Revenue at risk = Σ ARR of accounts linked to CRITICAL projects via Project→serves→Customer edges."
→ This is why the Executive page shows $4.2M (not a made-up number — it's computed from
  the Atlas→Acme Corp edge and Acme Corp's ARR value in the seed).

**PRD §28.2 — The severity matrix:**
"Severity = probability × impact. LOW < 0.3, MEDIUM 0.3–0.6, HIGH > 0.6."
→ This is why r-1 (0.7 × 0.9 = 0.63) is HIGH, and r-5 (0.3 × 0.4 = 0.12) is LOW.

---

## §26 — Appendix: All API Routes

| Route | Method | Auth | What it does |
|-------|--------|------|-------------|
| `/api/v1/copilot` | GET | session | AI Q&A over org data |
| `/api/v1/search` | GET | session | TF-IDF semantic entity search |
| `/api/v1/intelligence/graph` | GET | session | Dependency graph data |
| `/api/v1/intelligence/org-health` | GET | session | Org health scores + narratives |
| `/api/v1/intelligence/health-history` | GET | session | 30-day health trend |
| `/api/v1/simulation/monte-carlo` | POST | session | Monte Carlo simulation |
| `/api/v1/import/jira` | POST | HMAC | Jira webhook receiver |
| `/api/v1/import/linear` | POST | HMAC | Linear webhook receiver |
| `/api/v1/import/github` | POST | HMAC | GitHub webhook receiver |
| `/api/v1/export` | GET | audit | Data export (CSV/JSON) |
| `/api/v1/audit/nav` | POST | session | Navigation audit logging |
| `/api/v1/admin/tenants/[id]/sso` | PUT | admin | Per-tenant SSO config |
| `/api/v1/admin/tenants/[id]/suspend` | POST | admin | Tenant suspension |
| `/api/v1/scim/token` | POST | admin | SCIM token rotation |
| `/api/v1/metrics` | GET | internal | Prometheus metrics endpoint |
| `/api/v1/metrics/vitals` | POST | internal | Web Vitals reporting |
| `/api/health` | GET | public | Health check + capabilities manifest |
| `/api/auth/sso/saml` | GET | public | SAML SP-initiated flow |
| `/api/auth/sso/oidc` | GET | public | OIDC redirect |
| `/api/auth/callback` | GET | public | Supabase auth callback |

---

## §27 — Appendix: CSS Design Tokens

| Token | Meaning | Tailwind class |
|-------|---------|---------------|
| `--ink` | Base background | `bg-ink` |
| `--ink-surface` | Card background | `bg-ink-surface` |
| `--ink-elevated` | Raised/hover surface | `bg-ink-elevated` |
| `--ink-raised` | Floating surface | `bg-ink-raised` |
| `--fg` | Primary text | `text-fg` |
| `--fg-secondary` | Secondary text | `text-fg-secondary` |
| `--fg-muted` | Muted text | `text-fg-muted` |
| `--fg-faint` | Faintest text | `text-fg-faint` |
| `--line` | Border | `border-line` |
| `--ok` | Green / success | `text-ok bg-ok` |
| `--warn` | Amber / warning | `text-warn bg-warn` |
| `--danger` | Red / error | `text-danger bg-danger` |
| `--brand` | Brand color | `text-brand bg-brand` |
| `--os-accent` | Current accent (CSS var, not Tailwind) | `style={{ color: "var(--os-accent)" }}` |

**Never use:** `bg-bg`, `bg-surface`, `text-accent`, `text-success`, `bg-success`.
These are NOT defined in the design system. Always use the tokens above.

---

## §28 — Appendix: Performance Architecture

| Technique | Where | What it does |
|-----------|-------|-------------|
| `next/dynamic` with `ssr: false` | All heavy apps | Splits each app into its own JS chunk, loaded only when first opened |
| `React.memo` | HomeApp, CopilotApp, SimulationApp, DockItem | Prevents re-render on z-order changes |
| Visibility API | Canvas animations | Pauses login canvas animation when tab is hidden |
| Performance mode (auto ≤4GB RAM) | OS shell | Disables backdrop blur + wallpaper motion on low-end hardware |
| Debounced persistence | use-desktop.ts | Window positions saved at most every 400ms, not on every drag event |
| rAF-throttled Dock magnification | dock.tsx | Animation runs in requestAnimationFrame, not on every mousemove |
| `stale-while-revalidate` | Intelligence routes | 60s cache + 30s SWR prevents loading flicker on revisit |
| makeResilient() proxy | repositories/index.ts | All 19 API routes fall back to in-memory seed on Supabase errors |
| TF-IDF in-process | embeddings.ts | Semantic search runs in Node.js process memory (no vector DB needed in demo) |
| Exponential backoff + jitter | lib/query.ts, lib/retry.ts | Prevents thundering-herd on reconnect; caps at 30s |
| Circuit breaker | server/lib/circuit-breaker.ts | Trips after 5 failures; half-open probe after 30s |
| Skeleton shimmer | app/(shell)/loading.tsx, org-health-sparkline | Immediate visual feedback on every route transition |
| Pagination (limit param) | /api/v1/audit, all list routes | Prevents unbounded scans; default 100, max 500 |

---

## §29 — Appendix: Image Optimization

DIZRUPT uses **no raster images** — all visual elements are CSS/SVG/icon fonts. This means:
- No `<img>` tags exist in the codebase (zero to convert to `next/image`)
- Avatar initials are CSS-rendered colored circles — no PNG, no layout shift
- All icons are Lucide React components (SVG, inline, zero network requests)
- The login canvas animation is a `<canvas>` element rendered entirely in JavaScript

When adding real images in future (e.g. user avatar uploads, company logos):
- Use `next/image` with `sizes` prop to prevent layout shift
- Set `width` and `height` explicitly for CLS score
- Upload to Supabase Storage → serve via CDN with `image/avif, image/webp` Accept headers
- For below-the-fold content: use `loading="lazy"` (next/image default for non-priority images)

---

## §30 — Appendix: Database Index Strategy

All hot-path columns are indexed in `supabase/migrations/0001_core_schema.sql` and supplemented by `0018_performance_indexes.sql`. Index naming convention: `idx_<table>_<columns_purpose>`.

### Key indexes and what they cover

| Index | Table | Purpose |
|-------|-------|---------|
| `idx_tasks_assignee` | tasks | `WHERE assignee_id = ? AND status = ?` — task list per person |
| `idx_tasks_project_status` | tasks | `WHERE project_id = ? AND status = ?` — Kanban board |
| `idx_tasks_week` | tasks | `WHERE assignee_id = ? AND week_start = ?` — capacity grid |
| `idx_tasks_fts` | tasks | GIN full-text search on title + description |
| `idx_cap_user_week` | capacity_logs | `WHERE user_id = ? AND week_start = ?` — utilization calculation |
| `idx_audit_org_time` | audit_events | `WHERE org_id = ? ORDER BY created_at DESC` — ledger pagination |
| `idx_approvals_org_status` | approvals | `WHERE org_id = ? AND status = 'pending'` — Agent Inbox |
| `idx_risks_org_severity` | risks | `WHERE org_id = ? ORDER BY severity DESC` — risk register |
| `idx_rel_org_source` | entity_relationships | BFS traversal from source nodes |
| `idx_rel_org_target` | entity_relationships | BFS traversal to target nodes |

### How to verify index usage

```sql
-- After applying 0018_performance_indexes.sql:
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
  SELECT * FROM tasks
  WHERE org_id = '<your_org_id>'
    AND assignee_id = '<user_id>'
    AND status != 'COMPLETED'
    AND deleted_at IS NULL;
-- Look for "Index Scan using idx_tasks_assignee" — not "Seq Scan"
```

### Pagination pattern

Every unbounded list route accepts `?limit=N&offset=M`:
- Default limit: 100 rows
- Max limit: 500 rows (enforced server-side, not just by client)
- Cursor-based pagination (by `id` or `created_at`) preferred for real-time data

---

## §31 — Appendix: Security Architecture

### Input sanitization & injection prevention

All user input enters the system through two paths:
1. **API bodies** — parsed via `req.json()` then validated before use. No raw string interpolation into SQL (Supabase client uses parameterized queries exclusively).
2. **Query params** — extracted via `req.nextUrl.searchParams.get(...)`. Never interpolated into SQL or HTML.

Content security: `middleware.ts` sets OWASP headers including `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (with `frame-ancestors 'self'` for embed mode), and `Content-Security-Policy`.

Webhook payloads: all three import routes (`/jira`, `/linear`, `/github`) verify HMAC-SHA256 signatures before processing. Invalid signatures → 401, no body parsed.

### Authentication & session management

```
Demo mode:  dz_session cookie (presence-only, never validated against DB)
Live mode:  Supabase JWT (RS256) validated in middleware.ts via supabase.auth.getUser()
            Session expiry: configured in Supabase dashboard (default 1 hour with refresh)
            Refresh: handled by @supabase/ssr cookie rotation on every request
```

Single-session enforcement: `sessions` table has a `UNIQUE INDEX WHERE is_active = true` (migration 0001 law 4). Only one active session per user is allowed in production.

Token expiry: JWTs expire per the Supabase project setting. The custom access-token hook (`0012_auth_hook.sql`) embeds the user's `role` and `org_id` claims into the JWT so the middleware can authorize without a DB round-trip.

### Secrets management

| Secret | Where it lives | How it's used |
|--------|----------------|---------------|
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` only (never committed) | Server-side DB operations; never sent to browser |
| `ANTHROPIC_API_KEY` | `.env.local` | LLM calls from server only |
| `JIRA_WEBHOOK_SECRET` | `.env.local` | HMAC-SHA256 verification |
| `LINEAR_WEBHOOK_SECRET` | `.env.local` | HMAC-SHA256 verification |
| `GITHUB_WEBHOOK_SECRET` | `.env.local` | HMAC-SHA256 verification |
| `SCIM_TOKEN` | Generated via `/api/v1/scim/token` | Rotatable; stored hashed in DB |

`.env.local` is `.gitignore`d. `AUTH_SETUP.md` contains the steps to provision secrets without printing them in chat.

### Rate limiting & abuse prevention

| Route class | Limit | Response |
|-------------|-------|----------|
| `/api/v1/intelligence/*` | 10 req/min per IP | `429 Too Many Requests` + `Retry-After: 60` |
| All other `/api/v1/*` | 60 req/min per IP | `429` + `Retry-After: 10` |
| Audit + nav routes | Exempt (internal telemetry) | — |
| Import webhooks | HMAC-gated (not rate-limited) | 401 on bad sig |

Rate limit state is stored in memory (single-instance). For multi-instance production: replace with Cloudflare KV or Redis (the middleware code is isolated for this swap).

### Multi-tenancy & data isolation

Every table has an `org_id` column (migration 0007). Supabase Row-Level Security policies enforce `org_id = auth.jwt()->'org_id'` on every SELECT/INSERT/UPDATE/DELETE. No cross-tenant data leakage is possible even with a compromised application query.

Per-tenant SSO: `tenant_sso_configs` table (migration 0017) stores IdP config per org. `middleware.ts` routes `GET /api/auth/sso?tenant=<orgId>` to the correct SAML/OIDC IdP.

### PII handling, data retention & deletion

PII fields in the system: `email`, `full_name`, `avatar_url`, `ip_address` (sessions table).

Retention policy:
- User data: retained until deletion request or account termination
- Audit events: immutable for 90 days (audit compliance), then archiveable
- Session tokens: purged on logout; `last_active` updated on every request

GDPR Art.17 (right to erasure): `POST /api/v1/gdpr` — soft-deletes user profile, anonymizes task assignee and audit actor fields, revokes active sessions. Returns a `confirmationToken` + 30-day completion estimate (audit trail retention window).

GDPR Art.20 (data portability): `GET /api/v1/gdpr?action=export&userId=<id>` — returns full user data package as JSON.

### Audit trail & tamper-evident logging

The `audit_events` table is append-only: `REVOKE UPDATE, DELETE ON audit_events FROM authenticated` is applied in migration 0001. No application code can modify audit records.

Every mutation in the system writes an audit event:
- `proposal_approved` / `proposal_rejected` — with actor, subject, before/after capacity
- `capacity_override` — with the mandatory override reason text
- `task_reassigned` — with from/to employee IDs and delta hours
- `nav_audit` — every page transition (fire-and-forget via `/api/v1/audit/nav`)

Structured JSON logging (`server/lib/logger.ts`) formats every `log()` call as `{ level, msg, ts, ...meta }` for ingestion by Datadog / CloudWatch / Loki / Grafana Loki.

### Dependency scanning

Run periodically:
```bash
# Check for known vulnerabilities in npm packages
npm audit

# Check for outdated packages with breaking changes
npm outdated

# Automated: add to CI pipeline
npm audit --audit-level=high --fail
```

All Supabase client libraries, Next.js, and React are pinned to minor versions in `package.json`. Major upgrades require a dedicated PR with regression testing.

---

## §32 — Appendix: Testing Strategy

### Test pyramid

```
              [E2E]          e2e/desktop.mjs (5 checks, requires dev server)
           [Integration]     src/lib/__tests__/api-contract.test.ts (19 tests)
          [Unit]             src/lib/__tests__/*.test.ts (177 tests, 196 total)
```

### What each layer covers

**Unit tests** (`npm test` — 196 tests, ~1s):
- Store mutations: `store.test.ts` — capacity delta, guardrail, proposal stale-check
- RBAC matrix: `api-contract.test.ts` — role permissions, proposal visibility
- Risk severity: `risk.test.ts` — severity formula (probability × impact)
- Accessibility: `accessibility.test.ts` — WCAG AA contrast ratios for 8 token pairs
- Retry logic: `retry.test.ts` — exponential backoff, 4xx short-circuit
- In-memory repos: consistency and invariant checks

**E2E tests** (`node e2e/desktop.mjs` — 5 checks, requires dev server):
1. Boot → unlock → dock renders
2. Health API structure (status, version, uptime, requestId, capabilities)
3. SSO routing (unknown tenant → 404, known tenant → 3xx)
4. Graph API (200 + nodes/edges arrays)
5. Copilot API (200 + non-empty answer)

**Load test scaffold** (`node load-test.mjs` — requires dev server):
- Health: 50 concurrent × 5 iterations → p95 target < 50ms
- Graph: 10 concurrent × 3 iterations → p95 target < 800ms
- Copilot: 5 concurrent × 2 iterations → p95 target < 10s

### Coverage thresholds (enforced in CI)

```typescript
// vitest.config.ts
thresholds: { lines: 70, functions: 65, branches: 60, statements: 70 }
```

Run with: `npm test -- --coverage`

### Regression test approach

The `store.test.ts` regression tests specifically cover:
- **BUG-8**: `applyDelta()` with no existing cell must insert a new cell (not crash)
- **Stale-check**: `reviewProposal("approved")` re-verifies capacity at approval time
- **Guardrail**: `requestReallocate()` returns `{ ok: false }` when projected ≥ 100%

Any bug fix adds a regression test before the fix is merged (no exceptions).

### Chaos engineering approach

The `makeResilient()` proxy IS the chaos engineering layer for Supabase. It simulates a Supabase outage automatically when the DB is unreachable. Every API response includes `X-Backend: memory|live` so you can tell which path you're on.

For manual chaos testing:
1. Remove `NEXT_PUBLIC_SUPABASE_URL` from `.env.local`
2. Reload the app — all routes should fall back to seed data with no 500s
3. Restore the env var — app should recover without a restart

For Anthropic chaos testing:
1. Remove `ANTHROPIC_API_KEY`
2. Ask the Copilot anything — should return deterministic seed-data answer (no crash)

---

## §33 — Appendix: Reliability Architecture

### RTO and RPO

| Tier | RTO | RPO | How achieved |
|------|-----|-----|-------------|
| Demo mode (in-memory) | 0s | N/A (seed data only) | No external dependency |
| Production (Supabase) | < 5 min | < 1 min | Supabase managed + Vercel auto-redeploy |
| Intelligence routes | < 30s degraded | N/A (read-only) | makeResilient() fallback to seed |
| AI Copilot | < 8s (timeout) | N/A (read-only) | Deterministic fallback if LLM times out |

### Disaster recovery plan

**Scenario 1: Supabase region outage**
- Impact: Live org data unavailable
- Response: makeResilient() auto-activates, app serves seed data
- Recovery: Monitor Supabase status; when available, reconnect automatically (no restart needed)
- RTO: Instant (automatic fallback). RPO: All data in Supabase is persisted — no data lost.

**Scenario 2: Vercel deployment failure**
- Impact: New deployment breaks production
- Response: Vercel instant rollback (`vercel rollback`) to last known good deployment
- RTO: < 3 minutes. RPO: 0 (DB not affected).

**Scenario 3: Supabase data corruption**
- Impact: Production data inconsistent
- Response: Supabase managed backups (point-in-time recovery, every 15 minutes)
- Recovery: Restore from backup, re-apply any missed webhook events via import routes
- RTO: < 1 hour. RPO: 15 minutes.

**Scenario 4: Anthropic API unavailable**
- Impact: Copilot shows deterministic fallback instead of LLM-enhanced answers
- Response: `anthropicBreaker` (server/lib/circuit-breaker.ts) trips after 3 failures; auto-resets after 60s
- RTO: Instant (fallback). LLM restored: automatic probe after 60s.

### Error handling & graceful degradation

Every surface has a defined degraded state:

| Surface | Normal | Degraded (Supabase down) | Degraded (LLM down) |
|---------|--------|--------------------------|---------------------|
| Home app | Live org data | Seed data | N/A |
| Copilot | LLM-enhanced answer + evidence | — | Deterministic seed answer |
| Graph | Live relationship graph | Seed graph | N/A |
| Simulation | Live capacity + project data | Seed scenarios | N/A |
| Executive | Live composite metrics | Seed metrics | N/A |

React Error Boundary (`src/components/error-boundary.tsx`) catches any render crash and shows a recovery UI. `app/global-error.tsx` handles root-level crashes.

### Retry logic

**Client-side** (`lib/query.ts`): TanStack Query retries failed API calls 3 times with exponential backoff + full jitter. 4xx errors are not retried (client errors are final).

**Server-side** (`lib/retry.ts`): `withRetry()` utility for any server-side operation that needs explicit retry control outside of TanStack Query (e.g., webhook delivery, OTel export).

**Circuit breaker** (`server/lib/circuit-breaker.ts`):
- `supabaseBreaker`: trips after 5 failures, probes after 30s
- `anthropicBreaker`: trips after 3 failures, probes after 60s

### Concurrency & race condition prevention

**Capacity guardrail**: The `requestReallocate()` store mutation uses a stale-check pattern. The proposal system re-verifies Ahmed's capacity AT APPROVAL TIME, not at proposal-creation time. This prevents TOCTOU (time-of-check/time-of-use) race conditions.

**Proposal staleness**: `reviewProposal("approved")` checks if capacity conditions changed between proposal creation and approval. If so, status = "expired" and no mutation occurs.

**Idempotent webhooks**: All three import routes (`/jira`, `/linear`, `/github`) are idempotent — processing the same event twice creates no duplicate records. Deduplication key = external source ID.

---

## §34 — Appendix: Architecture Decision Records (ADRs)

All architectural decisions are documented in `docs/adrs/`. Key decisions:

| ADR | Decision | Status |
|-----|----------|--------|
| ADR-001 | Schema-authoritative domain model (Postgres as source of truth) | Accepted |
| ADR-002 | makeResilient() Proxy pattern for resilient repositories | Accepted |
| ADR-003 | macOS-style web OS shell (DizruptOS) | Accepted |
| ADR-004 | TF-IDF in-process semantic search (no vector DB in demo) | Accepted |
| ADR-005 | Three-layer RBAC enforcement (OS + API + Store) | Accepted |
| ADR-006 | Seed-first product development (FinTech Ops Co) | Accepted |

Architecture diagrams (Mermaid): `docs/architecture.md`
- System overview
- Data flow / intelligence pipeline
- Request lifecycle (with circuit breaker)
- RBAC enforcement model
- Multi-tenancy model
- Realtime architecture
- Deployment architecture

---

*Last updated: 2026-06-19. For the technical audit, see `SUPREME_PLATFORM_AUDIT.md`.
For the remaining work and scoring, see `ROAD_TO_10.md`.*
