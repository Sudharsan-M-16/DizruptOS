# DIZRUPT — Features, Data & Math

A plain-English guide to every page and feature in DizruptOS: **what it does**, **how it works**, the **current demo data** behind it, the **math** (if any), what it becomes **in production**, and a **worked example**.

> **One-line product:** DizruptOS is a workforce + project management "operating system." It answers three questions live: *Who is doing what? Who is overloaded or free? What should we do next?* — and keeps every login seeing exactly what their role should.

---

## 0. How the data works (read this first)

There are two data layers, kept in sync on purpose:

- **The seed** lives in `src/lib/data.ts` — the people, projects, tasks, capacity, risks, decisions, goals, proposals. Single source of truth for the demo.
- **The live store** (`src/lib/store.ts`, Zustand) holds the *mutable* copy used while you click around — reassignments, new tasks, project stage changes, claimed work, notifications. Every change is broadcast to other tabs/logins over a `BroadcastChannel`, so the app updates **live**.
- **The API / engines** (alerts, narratives, recommendations, capabilities, copilot) read through repositories. With `DZ_DEMO_DATA=1` in `.env.local`, those repositories use the **same seed** as the UI, so the API and the screen never disagree. (Supabase still powers auth; flip the flag off once the database is reseeded for real persistence.)

**The demo story (so every screen reads as one situation):**
- **AI Support Chatbot** — *critical*. Overloaded: Sarah (115%) and Zara (110%); the AI model is *blocked* waiting on the database.
- **Sales Analytics Dashboard** — *at risk*. Just started, understaffed: several tasks have no owner.
- **Ray (45%) and Inés (50%)** are free and have exactly the skills the Dashboard needs.
- Other projects (Fitness App, Cloud Setup, Design System, Online Store) sit around this.

---

## 1. Logins & role-based access (RBAC)

One switchable login per role tier. The permission matrix lives in `src/lib/personas.ts` and is enforced both in the UI (apps hide) and on the server (API denies).

| Login | Role | Sees |
|---|---|---|
| Noor Al-Rashid | **executive (CEO)** | Everything strategic: Executive, Narratives, Alerts, Simulation, Capacity, Financials. Cannot reassign work (read-only by design). |
| Priya Sharma | **dept_head** | Same as executive **plus** Audit + reallocation. |
| Asha Venkat | **project_manager** | Capacity, reassign, proposals, recommendations, risks, people, graph, copilot. Not financials/executive. |
| Sarah Okafor | **team_lead** | Capacity + burnout (to spot strain) — but not reassign/proposals (leads surface issues; managers act). |
| Ahmed Hassan | **employee (IC)** | Their own tasks, the board, messages, vault, goals. **Not** capacity, graph, copilot, recommendations, risks, decisions, capabilities, import (those are higher-order/org-wide). |
| Elias Brandt | **admin** | Everything in the matrix + Admin Console + Audit. |
| Acme Support | **client** | **Only their project** via the Client Portal. No company data, ever. A `RoleGate` blocks every internal page. |

**Permissions:** `view_capacity`, `reallocate`, `view_burnout`, `view_financials`, `view_audit`, `review_proposals`, `view_executive`. Each app declares the permission it needs; the dock, Spotlight, and launch all honour it.

*Example:* sign in as Ahmed — the dock has no Dependency Graph or Copilot; sign in as Asha — they appear.

---

## 2. The desktop (Command Center, `/`)

**What:** A macOS-style desktop. Boots → lock → desktop. A menubar, a magnifying dock, draggable windows, Spotlight (⌘Space), Mission Control (F3), Launchpad (F4).

**Wallpaper quick-access (`DesktopGreeting`):** behind the windows sits a live block — the clock, a one-line brief ("2 overdue · 1 critical"), **"Needs you today"** (click a task → detail) and **"Your projects"** (click → board). Role-scoped and live; project pills recolour when a manager changes a stage. (Minimise the windows to see it, or it shows in the gaps.)

**How:** windows are real components; legacy routes open as chromeless iframes. State in `lib/os.ts` + `components/desktop/use-desktop.ts`.

**Production:** same, with real auth gating which windows appear.

---

## 3. Home (per-person command center)

**What:** "What's my day." Your workload, your tasks split into **Today / Pending / Critical** (each grouped under its project), what's blocked, your team, and what needs attention.

**How:** reads the live store, scoped by role — an IC sees their own tasks; a lead/manager also sees tasks on projects they own or in their department.

**Current data:** Ahmed has "Fix the message delivery bug" (overdue, urgent), "Add login to the chatbot", "Write the chatbot API docs", "Connect the chatbot to live chat" — so all three tabs populate.

**Self-service (the "free employee" feature):** if you're under ~75% loaded, a green banner offers skill-matched unowned tasks you can **pick up** yourself (no manager needed). Bounded: only unassigned work, only to you, only if it keeps you under 100%.

**Math:** *your load* = utilization (see §20). Tabs: Today = due ≤ today; Pending = To-Do/Backlog; Critical = urgent, blocked, or on an at-risk/critical project.

**Example:** Ahmed at 65% sees "You've got room — pick up 'Build the dashboard API'." One click assigns it and notifies him; his load and the graph update live.

---

## 4. Capacity (the heatmap + person sidebar)

**What:** A people × weeks grid of how loaded everyone is. Red ≥100%, amber 80–99%, green/blue under. The strip headline shows **overloaded / near-limit / healthy / free-for-work** counts. **This page absorbed the old Operative Directory** — click any person to open a sidebar with their tasks, projects, skills, expertise, location, burnout (manager-only), and **reassign/assign** controls.

**How:** drag a task chip from a busy row to a freer row to reassign (guardrail blocks ≥100% without a typed override). The sidebar's "Move" lists candidates ranked by skill match then spare capacity; underloaded people get an "Available work that fits" list.

**Current data:** Sarah 115%, Zara 110% (red); Diego 95%; Ahmed 65%; Ray 45%, Inés 50% (free).

**Math:** **utilization = allocated hours ÷ weekly capacity** (§20). Reassign moves the hours as ±delta on both people atomically.

**Production:** the same drag writes an atomic Postgres RPC; live updates over Supabase Realtime.

**Example:** click Sarah → "Move 'Set up the chatbot database' → Ahmed (fits, 65%)." Both get notified; both rows update instantly.

---

## 5. Project Matrix (Kanban)

**What:** Task cards in columns by stage (Backlog → To-Do → In Progress → Blocked → Review → Done). Drag to update. Click a card → the **task drawer** (details + skill-ranked reassign). **"+ New task"** and a manager-only **"Suggestions"** panel.

**Suggestions** = the task-recommendation engine: assign unowned work to the best-fit person, or add the standard build steps a project is missing — each one approve → creates/assigns + notifies.

**Current data:** all 30+ seed tasks, grouped by status; the AI Chatbot column is busy and partly blocked.

**Math:** skill match (§20) ranks candidates; drag respects the capacity guardrail.

**Example:** filter to Sales Dashboard → Suggestions → "Assign 'Build the data pipeline' → Ray." Approve; the card gains an owner and the graph redraws.

---

## 6. Tasks app

**What:** The enlarged "all my work" table with a filter rail (All / Today / Overdue / Pending / In Progress / Blocked / Critical / Done). Add tasks here too.

**How / data / scope:** same role-scoping as Home, reading the live store.

**Example:** Ahmed → "Overdue" shows "Fix the message delivery bug."

---

## 7. Projects (portfolio)

**What:** A card per project — health pill, open tasks, budget burn, target date, velocity sparkline, owner. Managers get a **Stage control** (status + health) on each card.

**How:** changing a stage writes a live override that reflects everywhere (Home, Graph, Client Portal) and across logins.

**Math:** **budget burn = consumed hours ÷ budget hours**; the sparkline is `velocityTrend` (§20, §21).

**Example:** mark "AI Support Chatbot" → On Track; the client's portal immediately stops saying "behind schedule."

---

## 8. Risks (Risk Register)

**What:** Risks as first-class items on a probability × impact severity matrix; managers can **Log risk**. Click an owner → their **person sidebar** (no more directory).

**Current data:** "Only one person knows how the AI model works" (people, critical), "Cloud security vendor is running late" (vendor, escalated), "The Sales Dashboard has no team yet" (operational), "Sarah is overloaded" (people), AI cost drift, chatbot data-leak.

**Math:** **severity = SEVERITY_MATRIX[probability][impact]** (`lib/risk.ts`) — e.g. high × critical = Critical. Employees see only risks that touch them; the full register is a manager tool.

**Example:** the vendor risk is "Escalated" → it also surfaces as a critical Alert and on the Executive brief.

---

## 9. Decisions

**What:** A decision log — context, the option chosen, rationale, options considered, confidence, expected vs actual outcome, linked risks. (Manager+.)

**Current data:** "Build the chatbot UI and AI model together", "Use one shared design system", "AI helpers only suggest — people approve", "Start the Sales Dashboard now with a small team", "Ship the Fitness App without offline first."

**Production:** the decision → outcome → learning chain powers Org Memory.

---

## 10. Goals & OKRs

**What:** The company's objectives with measurable key results, linked to projects. Answers "are we hitting our targets?"

**Current data:** "Launch the AI Support Chatbot by August" (62%), "Ship the Fitness App and Online Store" (41%), "Make the chatbot answer 80% correctly" (70%), "Make the cloud setup secure and reliable" (58%).

**Math:** goal progress = average of its key-result progress. The Dependency Graph draws project → goal lines.

**Is it needed?** Yes — it's the one place leadership sees outcomes (not just activity), and it ties projects to *why* they exist. Kept visible to everyone for alignment.

---

## 11. Dependency Graph (live)

**What:** A live map: **People → Projects → Goals**. A person→project line **is** a current task assignment, so reassigning work **redraws the lines**. People are coloured by live load, projects by live health, goals show progress.

**Lenses (simple, live):** **Overloaded people**, **Understaffed projects**, **Single point of failure** (a project riding on exactly one person). Click a node to open it.

**Current data:** 11 people, 6 projects, 4 goals, ~20 assignment lines.

**Math:** load colour from utilization; "single point of failure" = projects with exactly one distinct assignee.

**Example:** the "Single point of failure" lens lights up Zara + the Chatbot (she's the only one who can train the model) — the same story as risk r-1.

---

## 12. Recommendations ("What to do next")

**What:** Plain-language, seed-grounded suggestions in three groups: **Relieve overloaded people**, **Staff work with no owner**, **Suggested next steps** (missing build steps). Each names the best-fit person and why, with "Apply in Matrix."

**Math:** best fit = qualified by skill (§20), then most spare capacity.

**Do we need a separate tab?** *My recommendation:* **keep one Recommendations surface, but it's really "task recommendations."** The actionable, one-click version already lives in the **Project Matrix → Suggestions** (native, live). The Recommendations page is the read-only overview/CTA. There is no second *kind* of recommendation that needs its own home — so I would **not** add more recommendation tabs. (See §13 for why it's different from the Agent Inbox.)

---

## 13. Agent Inbox (proposals) vs Recommendations — the difference

They look similar but are different things:

| | **Recommendations** | **Agent Inbox (proposals)** |
|---|---|---|
| **Source** | A simple, deterministic scan of the current plan ("who's over 100%, what's unowned"). | Autonomous **agents** (burnout-safety, delivery-critical, allocation-optimizer, risk-advisory) that each argue a case, with reasoning, confidence, and a **conflict/compromise** when two agents disagree. |
| **Shape** | A list of "what to do next," you act in the Matrix. | A reviewable queue: each proposal has evidence, a confidence score, validation checks, and **approve / reject** with rejection-memory. |
| **Who** | Managers, as a planning aid. | Managers review the queue; employees see their *personal* requests ("can you take this task?"). |
| **Guarantee** | None — it's advice. | Every proposal is **re-validated at decision time** (the world moves while it waits) and can expire instead of corrupting capacity. |

**In one line:** Recommendations = a quick to-do list. Agent Inbox = AI agents negotiating staffing decisions that a human approves, with an audit trail.

---

## 14. Narratives

**What:** The auto-written **executive brief** — a weekly / monthly / quarterly memo composed live from the engines: the situation, what changed, what to do, risk posture, "are we getting smarter?" It's prose, grounded in real numbers (no made-up text). Executive/dept-head only.

**Why did it look unchanged after the seed change?** Because narratives reads through the **API/engine**, and before the fix the API was still reading the **old Supabase database** (Atlas Payments…). Setting `DZ_DEMO_DATA=1` points the engines at the new seed, so the brief now talks about the AI Chatbot, the understaffed Dashboard, and Sarah's overload — matching every other screen.

**Difference from Recommendations:** Narratives = "what happened and what it means" (a story). Recommendations = "what to do next" (a list).

---

## 15. Executive

**What:** The leadership cockpit: org-health headline, "what changed" feed, fragility map (bus-factor + burnout), critical-attention / review-required / no-action blocks, inline copilot quick-ask. Executive/dept-head only.

**Why have it?** Every other page is operational (tasks, capacity). The Executive view is the only **aggregation** — one screen that says "is the org healthy, what's on fire, what needs a decision." It's the CEO's home.

**Velocity here:** project velocity (§21) feeds the health and "what changed" signals; declining velocity (ratio < 1) is a warning the brief calls out.

---

## 16. Org Memory & Capabilities

**Org Memory:** the decision → outcome → learning graph — what we decided, what happened, what we learned (e.g. "one vendor removed our negotiating power").

**Capabilities:** the skills map and **bus-factor / succession** — who holds each capability and where we're one person deep. Manager+ (it exposes single-points-of-failure).

**Current data:** Backend & APIs (Sarah primary; Ahmed, Mei backup), Cloud & DevOps (Fatima), Frontend (Diego), **AI/ML (Zara only — bus factor 1)**, Vendor Management (Marcus).

---

## 17. Audit Trail

**What:** The immutable log of every consequential action — reassignments, overrides, approvals, role changes, project-stage changes, client sign-offs. Admin / dept-head only.

**Current data:** seeded events plus everything you do in the session (live).

**Production:** insert-only Postgres table; the backbone of SOC-2 evidence.

---

## 18. Data Import

**What:** Connectors (Jira / Linear / GitHub / HRIS / CSV) that pull tasks, projects, and people in. Manager+ (it's integration setup).

**How:** HMAC-verified webhook receivers write to the graph tables; idempotent; a retry/dead-letter queue handles failures.

---

## 19. Simulation, Copilot, Alert Center, Admin, Vault, Chat, Client Portal

- **What-If Simulation** *(exec)*: Monte-Carlo on staffing/deadline scenarios → p5–p95 outcome bands + risk flags.
- **AI Copilot** *(manager+)*: chat grounded on the live org data (capacity, risks, succession) with evidence chips; Gemini-enhanced when a key is set, deterministic otherwise.
- **Alert Center** *(exec)*: evaluates the org and produces severity-ranked alerts (escalated risks, overload, understaffing, project health, succession). Auto-evaluates on open. Now reads the new seed (e.g. "AI Support Chatbot is critical").
- **Admin Console** *(admin)*: tenants (suspend/activate), per-tenant SSO, SCIM token rotation, audit. Reads live tenant/audit data.
- **Knowledge Vault**: private file cabinet (IndexedDB) — folders, recent, trash.
- **Chat**: Teams-style DMs + group channels (e.g. the "AI Chatbot War Room").
- **Client Portal** *(client)*: their project only — friendly status, a progress ring, a **Design → Build → Test → Launch** timeline, happening-now / coming-up / done, the team, gentle "what we're watching," plus **Approve** deliverables and **Message the team**. A client approval completes the task live.

---

## 20. The math (reference)

| Quantity | Formula (demo) | In production, the inputs come from… |
|---|---|---|
| **Utilization** (how loaded) | allocated hours ÷ weekly capacity | `allocated` = Σ estimated hours of that person's tasks due that week (from the tasks table); `capacity` = their contracted hours/week (HRIS). Seed hardcodes the weekly grid. |
| **Reassignment** | move task hours −delta from one, +delta to another, atomically; block if target ≥100% | identical, but the ± writes are an atomic Postgres RPC inside a transaction; conflicts roll back. |
| **Skill match** | does the person's skills cover the task's required skills (from its labels)? qualified → 0.7–1.0 by overlap; else 0.15; generic → 0.5 | task "required skills" come from labels/tags set at creation or inferred from the connector (Jira components, GitHub paths); person skills from HRIS/profile. |
| **Risk severity** | `SEVERITY_MATRIX[probability][impact]` (high × critical = Critical) | probability/impact entered by the risk owner; the matrix is fixed policy. |
| **Budget burn** | consumed hours ÷ budget hours | `consumed` = Σ logged hours on the project (time tracking); `budget` = the project's planned hours. Seed hardcodes both. |
| **Completion** | completed tasks ÷ total tasks | counted live from the tasks table (status = Done). |
| **Velocity** (per sprint) | `velocity_ratio = latest ÷ avg(prior 3)` | each sprint's number = Σ story-points (or hours) of tasks **completed within that sprint window**, queried from the tasks table. Seed hardcodes the 6-number trend (see §21). |
| **Org health** | blended score from overload, overdue work, fragility (bus-factor) and risk posture | each input computed live from tasks/capacity/capabilities/risks; the blend weights are policy. |

> **Seeded vs computed:** in the demo every input above is in `lib/data.ts` (so it's deterministic and reviewable). In production the *formulas are identical* — only the **inputs** change from hardcoded numbers to live queries over the tasks / capacity / risk / HRIS tables. Nothing about the math changes when you flip to real data.

---

## 21. Velocity — the deep dive

**What it is:** how much a project gets done per sprint, tracked over the last 6 sprints (`project.velocityTrend`, e.g. the Chatbot is `[34, 38, 36, 29, 24, 21]`).

**Where you see it:** the sparkline on each **Projects** card; as a signal in the **Executive** brief and **Narratives**; and inside the AI **context compression**.

**How it's calculated (`compressProjectContext` in `lib/ai.ts`):**
- `current` = the latest sprint = last value (`21`).
- `rolling3` = average of the three sprints before the latest = `(36 + 29 + 24) / 3 = 29.7`.
- **`velocity_ratio = current ÷ rolling3`** = `21 / 29.7 ≈ 0.71`.

**How to read it:** ratio **< 1 = slowing down**, **≈ 1 = steady**, **> 1 = accelerating**. The Chatbot's `0.71` means it's running ~29% slower than its recent pace — which is exactly why it's flagged critical and why the brief says "work is going slower than planned."

**For the sparkline/graph:** the sparkline plots the 6 raw numbers; the *colour* follows the trend direction (declining → amber/red).

**In production:** `velocityTrend` is computed from real completed story-points (or hours) per sprint from the tasks table, not seeded.

---

## 22. Live updates — what propagates

Any of these, made by a permitted role, reflect across tabs/pages/logins immediately (store + BroadcastChannel):
- add a task, add a project, reassign/claim a task, change a task's status,
- change a **project's stage/health**, approve a proposal, a **client approves** a deliverable.

Surfaces that update live: Home, Tasks, Capacity, Project Matrix, Projects, Dependency Graph, Client Portal, the wallpaper quick-access, and (because the API now shares the seed) Alerts/Narratives/Recommendations on their next read.

**Notifications:** a reassignment notifies **both** the new owner and the person it left; creating a task for someone notifies them; an override that pushes someone ≥100% raises a manager alert; a client message/approval notifies the team.

---

## 23. Honest notes / what's next to decide

- **Too many features?** Plausible. The strongest, most legible core is: Home, Capacity (+ sidebar), Project Matrix (+ Suggestions), Dependency Graph, Risks, Executive, Client Portal, Agent Inbox. Candidates to merge or de-emphasise: Org Memory ↔ Decisions ↔ Capabilities could become one "Intelligence" area; People is now redundant with Capacity.
- **Reseed Supabase** to flip `DZ_DEMO_DATA` off for real persistence.
- Tell me which features to keep front-and-centre and I'll prune the dock accordingly.
