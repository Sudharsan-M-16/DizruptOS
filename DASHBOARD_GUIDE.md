# The DIZRUPT Dashboard, Explained Simply

> This guide explains every feature in the dashboard and the logic behind it,
> in plain language — no jargon without an explanation right next to it.
> (For the engineering-flavored version, see [FEATURES.md](FEATURES.md).)

---

## The big idea (read this first)

Imagine your company is a big machine with lots of moving parts: people,
projects, deadlines, promises, and risks. Normally, nobody can see the whole
machine at once — the boss sees one part, a manager sees another, and problems
hide in the gaps between them.

**DIZRUPT is a screen that shows the whole machine at once.** And not just
shows it — it notices when a part is about to break (a person about to burn
out, a project about to miss its date) and *tells you before it happens*.

Three rules run through everything:

1. **Every number explains itself.** If the screen says a project is
   "Critical", you can always click the little ⓘ and see exactly *why* —
   the real signals that caused it. The app never just says "trust me."
2. **Different people see different things.** A regular employee, a manager,
   and an admin all open the same app — but each one sees their own version.
   This is called **RBAC** (Role-Based Access Control): your *role* decides
   what you can see and touch.
3. **Nothing is ever deleted or forgotten.** Every action anyone takes is
   written into a permanent logbook (the Audit Log) that can't be edited.

---

## Who's who (the roles)

| If you sign in as… | You are… | You can… |
|---|---|---|
| **Asha** | a Resource Manager | move work between people, approve agent suggestions for the team |
| **Priya** | a VP (department head) | everything Asha can, plus see the audit log and executive views |
| **Noor** | the COO (executive) | see the big-picture health of the whole company |
| **Ahmed** | an Employee | see his own work, his own load, and requests meant for *him* |
| **Elias** | the Admin | see and control **everything**, including security and permissions |

Try this: sign in as Asha, look at the home page, then switch to Ahmed (bottom
of the sidebar). The page completely changes. That's RBAC working.

---

## The pages, one by one

### 🏠 Command Center (the home page)
**What it is:** Your "Monday morning in one screen."

- **The red banner at the top** is the single most important problem right
  now. There is only ever ONE red banner — if everything glowed red, nothing
  would feel urgent.
- **The four numbers below it** are the pulse: how overloaded the team is,
  how many projects are in trouble, how many decisions are waiting, how many
  promises are overdue. *If you're an employee, these four numbers change to
  be about YOU: your load, your tasks, your requests, your projects.*
- **Capacity hotlist** (managers only): the people closest to overload, each
  with a segmented bar — 10 cells means 100%, and the red cells past the gap
  mean someone is over their limit.
- **"Needs your decision"** (managers) or **"Your requests"** (employees):
  the things waiting on you specifically.

**The logic:** the page asks "what matters right now?" and answers it in
under two seconds, for *your* role specifically.

### 🔥 Capacity Heatmap
**What it is:** a grid — people down the side, the next 8 weeks across the
top. Every cell is colored: green = healthy, amber = close to the limit
(80–99%), red = over 100% (too much work).

**The cool part:** you can literally **drag a task chip** from an overloaded
(red) person onto someone with room (green), and both their bars update
instantly. If your drop would push someone *over* 100%, a guardrail pops up
and demands you type a reason — and that reason is saved forever in the log.

**The logic:** load = hours of work assigned that week ÷ hours the person
actually has. Simple division, shown honestly.

### 📋 Projects
**What it is:** every project as a card, with a health badge (On Track / At
Risk / Critical…).

**The logic — this matters:** nobody *sets* the health by hand. The app
*computes* it from real signals: how many tasks are overdue, whether work is
blocked, whether the team is moving slower than usual. A manager can't make a
project "look green" for a meeting. Click any project to see its kanban
board, budget burn, and the exact reasons for its health.

### 👥 People
**What it is:** the team directory — each person's load this week, their free
hours, their skills, and how deep their expertise goes (a 0-to-1 score).

### 📊 Executive (bosses only)
**What it is:** the whole company compressed into one health trend for the
COO. Big picture first, details one click away.

### 🛡️ Risk Register
**What it is:** a list of things that could go wrong, treated seriously —
each risk has an owner, a plan, and a severity.

**The logic:** severity is computed from *how likely* the risk is × *how bad*
it would be. Like project health, no one can hand-pick it.

**RBAC here:** managers see the full register plus the probability×impact
matrix. **Employees see only the risks that touch their own work** — less
noise, nothing scary and irrelevant.

### 📜 Decisions
**What it is:** the company's memory. Every big decision is a record: what
the situation was, what options were considered (with the plus and minus of
each), what was chosen and *why*, what we expected to happen — and later,
what *actually* happened.

**Why it exists:** when someone leaves the company, their reasoning normally
leaves with them. Here it doesn't.

### 🎯 Goals · OKRs
**What it is:** the big targets (like "Protect $4.2M of revenue") with
progress bars, broken into measurable key results, each linked to the actual
projects doing the work. Every hour of work can be traced up to a goal.

### 🤖 Agent Inbox — the AI part
**What it is:** DIZRUPT has software "agents" — little AI watchdogs that each
care about one thing:

- **Burnout Safety** watches for people working too hard, too long.
- **Delivery Critical** watches deadlines on the most important projects.
- **Allocation** looks for smarter ways to spread the work.
- **Risk Advisory** watches vendors and blocked work.

When an agent spots something, it writes a **proposal**: "Move 9 hours from
Sarah to Ahmed — here's why, here's the proof it's safe." A human clicks
Approve or Reject. **The agents never act alone.**

**When agents disagree** (one wants to protect Sarah, another wants the
deadline held), a coordinator merges them into one compromise card. There's a
strict priority order: people's health (100) beats deadlines (70) beats
optimization (50).

**If you reject a proposal, the agent remembers for 30 days** and won't nag
you with the same idea.

**RBAC here — important:**
- **Managers** see proposals about their team and decide on them.
- **Employees** see a different inbox: only requests that concern *them
  personally* ("a task is moving to you — confirm you can absorb it"), with
  Accept / Flag-back buttons instead of Approve / Reject.
- **Admins** see everything, plus a governance queue nobody else sees
  (permission grants, suspicious login sessions) — full control.
- The same item never waits in two people's inboxes at once.

**One more safety net:** when a manager clicks Approve, the app re-checks the
proposal against the *live* numbers at that exact moment. If the world changed
while it sat in the inbox (maybe someone else already loaded Ahmed up), the
proposal expires instead of executing — it refuses to corrupt the data.

### 🕸️ Dependency Graph
**What it is:** a living map of how everything connects — goals fund
projects, projects depend on people, people hold expertise, vendors support
capabilities, risks threaten them.

**The two chips at the top are questions you can click:**
- **"What breaks if Sarah leaves?"** lights up everything within 3
  connections of Sarah and dims the rest — her *blast radius* (11 things!).
- **"Payments bus factor"** shows expertise concentration: Sarah holds 60% of
  the payments knowledge. ("Bus factor" = if this person got hit by a bus,
  does the capability die? 60% in one head = dangerously yes.)

### 🧾 Audit Log (managers/admins)
**What it is:** the permanent logbook. Every reallocation, override,
approval, and escalation — who did it, when, and why. The database physically
refuses edits and deletes on this table (INSERT-only). That's what
"tamper-proof" means here.

---

## The smaller details you might miss

- **⌘K** opens a search palette from anywhere.
- **?** shows all keyboard shortcuts.
- **The theme toggle** (top right) switches dark/light.
- **Open two browser tabs** and drag a task in one — watch the other tab
  update by itself. That's the realtime sync layer.
- **The bell** rolls up notifications by urgency class instead of spamming.
- **Hover any panel** and a soft light follows your cursor.

## Every control, explained — page by page

This section names **every button, badge, and number** on every page and what
it actually does.

### The frame around every page
- **Sidebar logo** → home. **Nav items** appear/disappear by role (employee
  never sees Capacity, Executive, or Audit Log).
- **Agent Inbox badge (green number)** = pending items *in your role's slice*,
  not the org total.
- **Persona block (bottom)** → click to "View as" any persona (the whole app
  re-scopes instantly) or **Sign out** (clears the session cookie).
- **Topbar title** = current page + one-line purpose. **Green toast** appears
  after any action ("Relieved Sarah 113%→90% · loaded Ahmed 65%→87%").
- **Dark/Light pill** switches theme (persisted). **Keyboard icon** = shortcut
  list (also `?`). **Search bar** = command palette (also `⌘K`): jump to any
  person/project/risk, or run actions. **Bell** = notifications grouped by
  urgency class (hard stop > critical > manager review > intelligence > info);
  "Mark all read" clears the count. Clicking one deep-links to its entity.

### Command Center
- **Red situation banner**: the one critical thing. Buttons inside are
  permission-gated: *Review compromise* (managers — opens the inbox),
  *Relieve <name>* (managers — opens the heatmap), *Open Atlas* (everyone).
- **Pulse strip (4 numbers)**: org numbers for managers; YOUR load / tasks /
  requests / projects for employees. The ⓘ beside each = the exact stored
  signals behind the number.
- **Capacity hotlist** (managers): top 4 loaded people; segmented bar = 10
  cells to 100% + 2 red overload cells; **burnout** chip is manager-private —
  click it for the private signals. Row click → heatmap. **"Most available"**
  footer = your three best reallocation targets.
- **Your week** (employees): your load meter + your open tasks; clicking a
  task opens its drawer.
- **Needs your decision / Your requests**: top pending items from your scoped
  inbox; card click → full inbox.
- **Portfolio health**: every project, velocity sparkline, % budget; click →
  project page. **Activity** (managers/admins): last 4 audit events.

### Capacity Heatmap
- **Org strip**: average load ticker + counts (overloaded / near limit /
  healthy). **Department chips** filter rows. **Legend**: green <80% · amber
  80–99% · red ≥100%.
- **"Now" column** carries draggable task chips (⋮⋮ handle). **Drag a chip**
  onto another person's row: both bars update in <50ms. If the target would
  cross 100%, the **guardrail modal** demands a typed override reason (stored
  on the audit event forever). After any move, a notification names BOTH
  people with before→after percentages.
- ✈ icon on a cell = that person has PTO that week.

### Projects
- Card: **code chip** (ATL…), name, **health pill** (computed, never set by
  hand — ⓘ shows why), **"yours" chip** (employees: projects you're on float
  to the top), description, open/blocked counts, budget burn %, target date,
  velocity sparkline, burn meter, owner.
- Project page adds: WHY-THIS-STATUS causal strip, kanban board (drag between
  columns; WIP-aware), linked risks and decisions.

### People
- **Search** matches names AND skills ("React"). Column headers sort.
- Columns: Person (red dot = burnout flag, manager-private), Department,
  **Utilization + Headroom (managers only — colleagues' load is private from
  employees)**, Skills chips, deepest expertise (0–1 score).
- Person page: profile, allocation, expertise depths, active work.

### Risk Register
- **Severity matrix** (managers): probability × impact grid; click a numbered
  marker to highlight its card. Severity is law: computed, never picked.
- **Risk cards**: colored left rail = severity; status pill (open/mitigating/
  escalated/monitoring); category chip; ⓘ = the signals that raised it;
  mitigation plan + state; project + owner links. Employees see only risks
  touching their work, full-width, no matrix.

### Decisions
- Timeline spine: dot color = status (green active, gray superseded, red
  reversed). Click a card to expand: **Context** (the situation), **Chosen —
  rationale**, **Options considered** (each + and −; green tint = the one
  picked), **Expected vs Actual outcome** (the calibration pair — green when
  reality has been recorded).

### Goals · OKRs
- Card: goal, owner, target date, big % (green ≥60 / amber ≥40 / red below),
  overall meter, key results each with its own meter and %, and **Executing
  projects** chips with live health → click through.

### Agent Inbox
- **Header**: your scope (PERSONAL / TEAM / FULL CONTROL) + pending count.
- **Priority strip** (managers): the conflict-resolution order.
- **Proposal card**: agent type chip, priority, confidence %, expiry timer;
  reallocation visual (who → who, hours); **coordinated compromise** box when
  two agents conflicted; "Show reasoning & validation" = causal signals +
  pre-surface checks. **Buttons**: managers *Approve & execute / Reject —
  remember 30d*; employees *Accept / Flag back*; admins *Approve / Deny* on
  everything including the governance queue.
- Approving re-validates against live data at that instant; stale proposals
  expire instead of executing.

### Dependency Graph
- **Two chips = clickable lenses**: blast radius (3-hop reachability from
  Sarah, with per-entity hop counts) and bus factor (expertise shares with
  red/amber/green bars). Click again or × to release.
- Hover any node → its direct edges ignite. Drag nodes freely. Edge width =
  strength; "·~" = inferred edge. Controls: zoom/fit; minimap pans.

### Audit Log
- Filter box + action-type dropdown. Columns: time, actor (with role),
  action chip, entity, detail; amber **override:** line shows the typed
  guardrail reason. Insert-only — the database refuses edits.

### The top bar (every page, top-right) — every button

- **Page title + hint** (left): the big page name and its one-line "what this
  screen is for." Animates in on each navigation.
- **Live presence pill**: "N live" — how many other sessions are viewing right
  now (your other tabs today; teammates in production). Hidden when you're alone.
- **Theme toggle**: a sliding pill — **Dark / Light**. Click either; the whole
  app recolors instantly (the choice is remembered before first paint, so no flash).
- **Keyboard shortcuts** (⌨ icon, or press `?`): opens the shortcut cheat-sheet.
- **Search** (the wide box, or `⌘K` / `Ctrl-K`): the command palette — jump to
  any person, project, or page; run actions.
- **Notifications** (🔔): the badge shows the unread count; **opening the panel
  marks everything seen so the number never nags twice**, and there's an explicit
  **Mark all read** button. Each item is class-coded by urgency (hard-stop,
  critical, review, intelligence, info) and links straight to the thing it's about.

## Signing in & the landing page

- **Sign-in (the "Nexus gateway")**: a glowing orb in the dark with a light
  circling its ring. Pick a demo persona (each is a different role), then
  **Enter the command center**. One session per user — a second login ends the
  first. The "Overview" link (top-left) goes back to the landing page.
- **Landing page**: top nav (**Product / Method / Customers / Manifesto** + a
  hard **ENTER** block). The hero's product preview is a *working miniature* —
  its sidebar tiles (**Command Center, Capacity, Agent Inbox, Risk Register,
  Graph**) all switch the live view; hover the heatmap, accept a proposal, watch
  the blast-radius graph draw itself.

---

## What's real and what's a demo stand-in

This is an MVP demo: the data is a realistic scripted company (so every demo
tells the same story), auth uses demo personas, and the AI agents' proposals
are pre-computed examples of what the agent tier produces. The *laws* are
real and enforced in code: RBAC scoping, guardrail overrides, audit
completeness, decision-time re-validation, computed (never hand-set) health
and severity. The production swap — Supabase database with row-level
security, real auth, live agent evaluation — plugs into the same contracts
without changing the screens.
