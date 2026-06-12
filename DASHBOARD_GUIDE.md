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

## What's real and what's a demo stand-in

This is an MVP demo: the data is a realistic scripted company (so every demo
tells the same story), auth uses demo personas, and the AI agents' proposals
are pre-computed examples of what the agent tier produces. The *laws* are
real and enforced in code: RBAC scoping, guardrail overrides, audit
completeness, decision-time re-validation, computed (never hand-set) health
and severity. The production swap — Supabase database with row-level
security, real auth, live agent evaluation — plugs into the same contracts
without changing the screens.
