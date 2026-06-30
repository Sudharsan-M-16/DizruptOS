# DIZRUPT — Complete Product Guide for the Maker
*A founder's manual: what every feature does, why it exists, and how it all fits together*

---

## The Elevator Pitch

**DizruptOS** is a macOS-style web operating system for enterprise operations teams. It solves **one critical problem**: *How do you make intelligent real-time workforce capacity decisions before burnout, delays, and risk cascade?*

The product is built as a **web OS** (not a dashboard) to make the interface **native-feeling, persistent, and trustworthy** — the same way people trust their real OS with critical daily work.

---

## SECTION 1: THE COMPANY DATA & PEOPLE

### Sample Org: Fintech Ops Company (18 people across 4 departments)

**Departments:**
- **Engineering** (7 people) — Priya Sharma (VP), led by Sarah Okafor + Ahmed Hassan
- **Design** (3 people) — Lena Novak (Head)
- **Data & AI** (3 people) — Tomás Eriksen (Head)
- **Client Operations** (5 people) — Marcus Bell (Director), Noor Al-Rashid (COO)

---

## SECTION 2: SARAH OKAFOR — THE REAL STORY

### Who She Is
- **Role:** Team Lead (Payments Lead)
- **Skills:** Go, Payments, PCI-DSS, Postgres
- **Expertise:** Payments architecture (0.93/1.0), PCI compliance (0.78/1.0)
- **Location:** London (GMT)
- **Status:** 🚩 **HIGH BURNOUT RISK** (0.64 flight risk)

### Projects She's Working On

**PRIMARY: Atlas Payments Migration** ← *This is the only project she owns*

Sarah is the **owner and lead** on Atlas — the company's most critical, highest-stakes project:

| Task | Status | Priority | Due | Hours |
|------|--------|----------|-----|-------|
| Ledger cutover runbook (final review) | IN_PROGRESS | URGENT | Jun 12 | 14h (9h logged) |
| Settlement file ingestion (vendor v3) | BLOCKED | URGENT | Jun 11 | 12h (4h logged) |
| Reconciliation engine (penny-drift fix) | IN_PROGRESS | HIGH | Jun 13 | 10h (6h logged) |
| PCI evidence pack refresh | TO_DO | MEDIUM | Jun 17 | 9h (0h logged) |

**Why This Matters:**
- Atlas is a **$4.2M ARR** customer cutover (Acme Corp)
- Sarah holds **93% of payments expertise** in the org — she's a single point of failure
- **QA is at 112% utilization** — review queue blocked, velocity down 38% vs 3-sprint avg
- Her capacity is **112% allocated** (45h allocated ÷ 40h capacity) for the current week
- She has **zero PTO used in 112 days** — burnout signals are all red

### Why Sarah Is the Central Story

The entire product was built around **Sarah's problem**:
- She owns the most critical path
- She's overallocated with no backup
- She has no visibility into solutions (cross-training, task reallocation, load balancing)
- Traditional dashboards fail her: they show *what* is broken but not *what to do about it*

**Solving Sarah's problem = solving the entire company's capacity crisis.**

---

## SECTION 3: HOW THE PRODUCT HELPS SARAH

### The Daily Loop (What Sarah Sees)

#### 1. **Morning Brief (Home App)**
- Opens to "Critical" tab: 2 overdue tasks, 6 in-critical projects
- One-liner: *"You're near your limit — 2 overdue · 6 critical. Atlas Payments needs your attention."*
- Burnout flag visible: "3 consecutive weeks logged > 50h"

#### 2. **Capacity Heatmap (/capacity)**
- 6-week grid, Sarah's row is **red** (> 100%)
- She sees the two drag targets: Ahmed Hassan (65% → 87%) or Mei Lin
- **One drag move** = task moves, proposal created, manager notified

#### 3. **Proposals Inbox (/proposals)**
- **Burnout Agent** proposes: "Move PCI evidence pack (9h) from Sarah to Ahmed"
- Shows: confidence (91%), reasoning, skill match (Ahmed: 0.81), validation checks
- Sarah's manager (Priya) reviews → 1 click to approve
- Move executes: Sarah drops to 90%, audit log records the change + reason

#### 4. **Executive Briefing (/executive)**
- Noor (COO) sees: "Payments expertise concentrated in Sarah — 0.64 flight risk"
- Revenue at risk: $4.2M if Sarah leaves mid-cutover
- Recommendation: "Cross-train Ahmed on ledger internals; document before July"

#### 5. **Audit Trail (/audit)**
- Every reallocation, override, risk escalation is logged + immutable
- Sarah's manager sees rejection memory: "Previous proposal to move X was rejected because..."

---

## SECTION 4: THE 9 CORE FEATURES & HOW THEY WORK

### 1. **Capacity Heatmap** (`/capacity`)
**What it does:** 6-week employee × allocation grid. Red means overallocated (>100%).

**How it works:**
- Drag task chips from red rows to green rows
- Optimistic update (instant feedback)
- If new allocation ≥100%, a **hard-stop override modal** appears
- You type the reason → it lands in the audit log
- Reallocates task, sends agent proposal, updates manager inbox

**Why it matters:**
- Capacity is the **wedge** — every other problem (burnout, delays, turnover) traces back to allocation
- Visible over-allocation = actionable (not just a number)
- Drag UX is faster than forms → managers actually use it

---

### 2. **Proposals Inbox** (`/proposals`)
**What it does:** Agent-generated recommendations + human approval workflow.

**How it works:**
- **Burnout Agent** detects Sarah at 112% → proposes moving PCI work to Ahmed
- **Delivery Agent** detects Atlas critical path at risk → proposes adding Mei as reviewer
- **Negotiation Coordinator** detects conflict → finds compromise (move Sarah's 9h, add Mei's 4h to runbook)
- Each proposal shows: confidence, reasoning, validation checks, skill match

**Why it matters:**
- Agents propose *at scale* (every capacity spike, every burnout, every blocked task)
- Humans approve *in batches* (not reactive firefighting)
- Rejection memory: "If you reject this again, here's why you rejected it last time"
- **Policy encoded:** Agents can *never* mutate operational tables — they only propose

---

### 3. **Project Matrix (Kanban)** (`/projects/[id]`)
**What it does:** Drag-and-drop task board per project.

**How it works:**
- 6 status columns: BACKLOG → TO_DO → IN_PROGRESS → REVIEW → BLOCKED → COMPLETED
- Drag tasks between columns = status change
- Each task card shows: assignee, due date, estimated hours, priority
- "Why is this CRITICAL?" popover explains causal signals

**Why it matters:**
- Kanban is the **lingua franca** of execution teams
- No context switch from OS to external tools
- Every task status change is audited

---

### 4. **People Directory** (`/people/[id]`)
**What it does:** Deep profile per person showing capacity, burnout, expertise, manager relationships.

**How it works:**
- Searchable by name, skill, or expertise depth
- Per-person view shows:
  - Capacity ring (visualizes allocated vs capacity)
  - Expertise matrix (proficiency by domain)
  - **Manager-private burnout panel** (3+ signals, flight risk score, PTO days used)
  - Reporting lines (who reports to whom)
  - Commitments to/from other people
- Load-sorted (highest load first, for quick triage)

**Why it matters:**
- Burnout is **personal, not abstract** — seeing Sarah's 112% + zero PTO makes it real
- Expertise map drives cross-training decisions
- Manager can act *before* burnout escalates to flight risk

---

### 5. **Risks Register** (`/risks`)
**What it does:** Probability × impact severity matrix. Auto-computed severity.

**How it works:**
- Matrix grid: Probability (low/medium/high) × Impact (low/medium/high/critical)
- Each risk carries **signals** (evidence): "Sarah holds 93% of payments expertise, bus factor 1, flight risk 0.64"
- Status workflow: OPEN → MITIGATING → MONITORING → CLOSED
- Mitigation plan is tracked (in_progress, not_started, complete)

**Why it matters:**
- Risk is the "shadow thread" of capacity — every overallocated person = risk
- Signals make risk *tangible* (not just intuition)
- Mitigation status drives the manager's agenda

---

### 6. **Decisions Register** (`/decisions`)
**What it does:** Timeline of major decisions with rationale, options, and **outcome calibration**.

**How it works:**
- Decision: "Adopt double-entry ledger before cutover, not after"
- Context + options weighed: "Fix-then-migrate vs. Migrate-then-fix"
- Chosen option + rationale
- Expected outcome (recorded when decided): "Zero reconciliation variance"
- Actual outcome (recorded later): "Variance 0.002% — within tolerance"
- Confidence level (high/medium/low) + hindsight (correct/misjudged/better-than-expected)

**Why it matters:**
- Most orgs **never** revisit decisions — they're lost to time
- Calibration creates a learning loop: "We said high confidence, it worked — keep that bias"
- Hindsight tags drive the **Recommendations engine** to flag misjudged decisions for review

---

### 7. **Agent Proposals & Negotiation** (in `/proposals`)
**What it does:** Multi-agent coordination → human approval inbox.

**How it works:**

Three types of agents run autonomously every 6 hours:

| Agent | Triggers On | Proposes |
|-------|------------|----------|
| **Burnout Safety** | Utilization ≥100% for 2+ days OR PTO debt ≥90 days | Move tasks off overallocated person |
| **Delivery Critical** | Task on critical path aged > threshold OR velocity degraded | Add reviewer, shift non-critical deadlines |
| **Risk Advisory** | Risk signal aged > threshold OR mitigation overdue | Escalate, request evidence, approve permission grants |

**Negotiation Coordinator** (meta-agent):
- Detects conflicts: "Burnout wants Sarah's hours down, Delivery wants more on Atlas"
- Finds compromise: "Move 9h off Sarah, pull Mei in for 4h review support"
- Presents to humans as one coordinated proposal, not three contradictions

**Approval workflow:**
- Manager sees proposals grouped by visibility (manager-only, executive-only, self-only)
- 2-click approve/reject
- Approved proposals execute through the same reallocate path as manual drags

**Why it matters:**
- Agents see patterns humans miss (e.g., "Jones has been overallocated 7 consecutive weeks")
- Humans handle ambiguity agents can't (e.g., "Is this project worth the PTO debt?")
- Rejection memory trains agents: "You proposed this before, they said no because X"

---

### 8. **Recommendations Engine** (`/api/v1/recommendations`)
**What it does:** Ranked, evidence-backed organizational actions.

### ⚠️ IMPORTANT: Why Recommendations Are NOT "Live" (LLM-Generated)

**The user's question: "Why not live recommendations? Is it because of missing API key?"**

**The answer: No.** Recommendations are *intentionally deterministic*, not AI-generated. Here's why:

**What "live recommendations" would mean:**
- Every time you ask for a recommendation, Claude AI generates it from scratch
- Problem: **not reproducible** (different answers each day), **not auditable** (why did it change?), **hallucination risk**

**What we actually do:**
- Recommendations are **computed deterministically** by a pure algorithm (`recommendations.ts`)
- Input: capabilities data, succession exposure, dependency hubs, decision outcomes
- Output: ranked list of actions with evidence cited (not LLM-guessed)
- These are **persisted** (stored in DB with lifecycle: pending → accepted → measured)
- Later, we can measure if the recommendation worked (baseline vs actual impact)

**Where the API key DOES matter:**
- The **Copilot** (chat interface) uses `ANTHROPIC_API_KEY` to enhance answers with Claude fluency
- But Copilot is *grounded* in the deterministic recommendations and data
- Copilot can't contradict the engine — it can only make phrasing prettier
- If API key is missing, Copilot falls back to the deterministic answer (always correct, just less fluent)

**Timeline:**
1. **Deterministic engine computes** recommendations based on live data
2. **New recommendations are persisted** as `pending` (idempotent, never overwrites)
3. **Lifecycle begins:** pending → accepted → measured (learning loop)
4. **Copilot enhances** the recommendation's explanation (optional LLM layer)
5. **Outcome is recorded:** did it work? accuracy score feeds calibration

**Why this architecture?**
- **Auditability:** Every recommendation cites evidence ("Sarah flight risk 0.64")
- **Determinism:** Same data = same recommendation (reproducible)
- **Measurability:** We track what was recommended, what happened, accuracy
- **No hallucination:** Engine can't invent; it only synthesizes computed signals

---

### 9. **Intelligence Engine** (The Secret Sauce)
**What it does:** Every score, badge, and warning is backed by **causal signals**.

**How it works:**

**Example:** Atlas project is "CRITICAL"

Instead of just a red badge, you see:
- 7 tasks overdue > 5 days (95% confidence · rule-based)
- QA stage at 112% utilization (92% confidence · rule-based)
- Velocity 38% below 3-sprint average (88% confidence · statistical)
- Vendor settlement file 8 days late (78% confidence · observed)

Each signal is:
- **Computed** from live data (not opinion)
- **Confidence-scored** (rule vs statistical vs observed)
- **Explainable** ("QA at 112%" = 45 allocated hours ÷ 40 capacity hours)
- **Auditable** (when did this signal appear?)

**Policy:** *"Never a score without a why"* — every metric in the product has an Explain popover.

---

## SECTION 5: HOW THE OS SHELL WORKS

### Why an OS, Not a Dashboard?

**Problem with dashboards:**
- Users context-switch out to Slack, email, Jira
- No persistence (window positions lost on refresh)
- No multitasking (one page at a time)
- Feels like a "tool," not a *workspace*

**OS solution:**
- Multiple windows open simultaneously (capacity heatmap + proposals + chat)
- Layouts persist per user (your window arrangement is saved)
- Native OS affordances (drag, resize, snap, minimize, z-order)
- Feels like a **native app**, not a web tool

### OS Features

| Feature | What It Does | Why It Matters |
|---------|-------------|----------------|
| **Boot Sequence** | Cinematic startup → lock → desktop | Makes login **feel important**, not throwaway |
| **Dock** | Customizable app launcher (pin/unpin, running dots) | Quick access to Home, Proposals, Capacity |
| **Menubar** | Live battery, network, Control Center, Notification Center | Always know org status + your own settings |
| **Spotlight** (⌘Space) | Fuzzy search across people, projects, tasks | Faster than forms for quick jumps |
| **Mission Control** (F3) | See all open windows at once | Manage clutter when you have 5+ windows open |
| **Launchpad** (F4) | Grid view of all apps (searchable) | Discover apps you forgot existed |
| **Window Management** | Drag, 8-way resize, snap halves, genie minimize, z-order | Native OS interactions (not reinvented) |
| **Layout Persistence** | Per-user window positions saved to localStorage | Open tomorrow and find your workspace intact |
| **Notification Center** | Grouped messages (Critical · Proposals · Audit) | Glanceable status without email/Slack noise |
| **Control Center** | Light/dark, accent color, wallpaper, brightness | Customization that feels *mine* |

### Apps Available

| App | What It Does | Who Uses It |
|-----|-------------|-------------|
| **Home** | Today/Pending/Critical tasks, grouped by project | Everyone (daily standup) |
| **Project Matrix** | Kanban board, drag tasks between status columns | Project managers, team leads |
| **Operative Directory** | People search, capacity ring, burnout panel, expertise | Managers (scheduling, cross-training) |
| **Knowledge Vault** | File store (IndexedDB), shared documents | Team leads (runbooks, post-mortems) |
| **Copilot** | Chat interface for strategic questions | Executives (morning briefing) |
| **Alert Center** | Escalations, critical alerts, acknowledgment queue | On-call rotation |
| **Simulation** (Monte Carlo) | "What if Ahmed left? What if we lose Payments capability?" | Executives, risk team |
| **Admin Console** | Tenants, SSO config, SCIM, audit log export | Admin, compliance |

---

## SECTION 6: THE STORY (How It All Fits)

### Act 1: The Problem
Sarah is overallocated (112%), has high flight risk (0.64), owns Atlas (our most critical project), holds 93% of payments expertise. Traditional dashboards show *what* but not *what to do*.

### Act 2: The System Wakes Up
- **Burnout Agent** detects Sarah at 112% → proposes reallocating PCI work (9h) to Ahmed
- **Delivery Agent** detects Atlas critical path at risk → proposes adding Mei as reviewer (4h)
- **Coordinator** finds conflict, merges into one compromise proposal
- Priya (VP Engineering) sees two proposals, not three contradictions
- **2-click approve:** Sarah drops to 90%, Ahmed rises to 87%, Mei protects the critical path

### Act 3: The Closed Loop
- Move is recorded in audit log (who, when, why, before/after states)
- Burnout signal clears (or improves)
- In 6 weeks, copilot asks: "Did that reallocation actually help?"
- Outcome is measured: "Sarah's flight risk dropped from 0.64 to 0.42"
- System learns: this type of compromise works → increases confidence on similar proposals

### The Larger Story
This *isn't* about automating decisions. It's about **making invisible patterns visible and actionable**.

Every decision (move Sarah's task, approve PTO, hire for Payments) needs:
1. **Visibility** (is there a problem?)
2. **Understanding** (why? quantified)
3. **Actionability** (what do I do about it? ranked by impact)
4. **Auditability** (did it work? how do we get smarter?)

DizruptOS provides all four layers.

---

## SECTION 7: HOW FEATURES ALIGN WITH COMPANY NEEDS

### The Fintech Ops Company's Core Tensions

| Tension | Problem | DizruptOS Solution |
|---------|---------|-------------------|
| **People vs. Projects** | Sarah's overload blocks Atlas; Atlas's risk puts Sarah at flight risk | Capacity heatmap makes the loop visible → agents find compromises |
| **Knowledge Concentration** | Payments expertise all in Sarah; if she leaves, cutover fails | Succession exposure signals drive cross-training recommendations |
| **Reactive Management** | Manager sees problems only when escalated (usually too late) | Burnout agent proactively flags Sarah 2 weeks before breakdown |
| **Decision Amnesia** | "Why did we make this choice?" is lost after 3 months | Decisions register captures rationale + outcome, closing the loop |
| **Risk Blindness** | Risks live in Jira comments; executives don't see signal propagation | Risk register + causal signals make downstream impact visible |
| **Audit Gaps** | "Who reallocated what?" can't be answered 6 months later | Every move lands in immutable audit log (for compliance + learning) |

---

## SECTION 8: KEY STATS & METRICS

### The Current Org State

**Capacity:**
- Sarah: **112% allocated** (45h ÷ 40h capacity) — 🚩 RED
- Ahmed: **65% allocated** — ✅ headroom available
- Mei: **85% allocated** — yellow, but has expertise

**Project Health:**
- **Atlas** (Payments Migration): CRITICAL (highest revenue at risk: $4.2M ARR)
- **Helio** (Client Portal): AT_RISK
- **Pulse** (Intelligence Engine): ON_TRACK
- **Nimbus** (SOC 2 Hardening): DELAYED
- **Orbit** (Design System): ON_TRACK
- **Quartz** (Onboarding): PLANNING

**Risk Profile:**
- **6 open risks** tracked, 4 with active mitigation plans
- **Single points of failure:** Sarah (Payments), Fatima (Infrastructure)
- **Bus factors:** Payments (1 person), Architecture (0.9 people)

**Decision Calibration:**
- **5 major decisions** recorded with rationale + options
- **1 misjudged decision** flagged by hindsight (triggers review recommendation)
- **Avg confidence:** 0.7 (medium-to-high)

---

## SECTION 9: TECHNICAL STORY (Why This Architecture Matters)

### Domain Model: Schema-Authoritative
- **Postgres is the source of truth** (not the app)
- App layer uses thin camelCase views (queries with TanStack)
- RLS on every table (row-level security, enforced at DB layer)
- Realtime channels broadcast safe data changes (Supabase Realtime)

**Why this matters:**
- Data can *never* be inconsistent (schema enforces it)
- Multi-user conflicts are resolved at the transaction level
- Audit trail is unbreakable (database-level triggers)

### Compute Engines (Server-Side)
These run on every request (or every 6 hours for agents):

| Engine | What It Computes | Used By |
|--------|-----------------|---------|
| **Org Health** | Overall health score (0-100) from capacity + risks + velocity | Executive dashboard |
| **Burnout Scorer** | Flight risk per person (0-1) from utilization + PTO + signals | Home app, Proposals |
| **Capability Graph** | Expertise depth, bus factor, succession risk per skill | People directory, Recommendations |
| **Dependency Graph** | Which people/projects depend on which — blast radius if one fails | Graph visualization, Risk analysis |
| **Recommendation Engine** | Ranked actions (cross-train, reallocate, escalate, revisit) | Proposals inbox |
| **Simulation Engine** | "What if Ahmed left?" Monte Carlo projection | Executive what-ifs |
| **Calibration Engine** | Accuracy of past recommendations → confidence adjustment | Learning loop |
| **Copilot LLM** | Enhanced (fluent) phrasing of engine answers | Chat interface |

### The Learning Loop
```
Compute Recs → Persist as Pending → Human Approves → Execute → Measure Outcome
       ↑                                                            ↓
       ←──────── Calibration (did it work? adjust confidence) ─────
```

---

## SECTION 10: RBAC (Role-Based Access Control)

### Roles in the System

| Role | Can See | Can Do | Can't Do |
|------|----------|--------|----------|
| **Employee** | Own tasks, own capacity, peers' skills | Accept task assignment, log time, view own capacity | Reallocate others, review proposals |
| **Team Lead** | Team's tasks + capacity, own risks + decisions | Reallocate within team, move statuses, log time | Cross-team moves, approve proposals |
| **Manager** (dept_head) | Dept's full view + risks + goals | Reallocate across dept, approve proposals, escalate risks | Access other depts (RLS) |
| **Executive** | Whole org view (multi-tenant if enabled) | Approve high-impact proposals, view all risks | Operational mutations |
| **Admin** | Audit log, SCIM provisioning, SSO config, session logs | Revoke sessions, export audit, grant permissions | Data mutations (restricted) |

**Enforced at 3 layers:**
1. **Login layer** — only authenticated users get a session
2. **OS layer** — apps hide/deny by role (App icon disappears from Dock)
3. **Data layer** — store mutations refuse unauthorized actions (not just hidden buttons)

---

## SECTION 11: WHAT MAKES THIS PRODUCT DIFFERENT

### vs. JIRA / Linear
- JIRA is task-centric; DizruptOS is capacity-centric
- DizruptOS optimizes for *human allocation*, not just ticket throughput
- Burnout signals alert *before* tickets pile up

### vs. Lattice / 15Five
- Those are survey-based (quarterly); DizruptOS is live (real-time signals)
- DizruptOS computes burnout from allocation math, not employee surveys
- Agents act on patterns, not just notifications

### vs. Workable / BambooHR
- Those are hiring-focused; DizruptOS is retention-focused
- DizruptOS prevents flight risk through visible reallocation + cross-training
- Succession risk is quantified and actionable (not just a job description)

### vs. Generic BI Tools
- BI tools show "Sarah is at 112%" — DizruptOS shows "Here's why + here's what to do about it"
- Agents propose solutions; humans decide; we measure accuracy

---

## SECTION 12: METRICS THAT MATTER

### Health Indicators
| Metric | Interpretation | Current State |
|--------|---------------|---------------|
| **Org Health Score** | 0-100 scale (capacity + risks + velocity) | ~65 (red, Atlas driving it down) |
| **Avg Utilization** | Org-wide allocated ÷ capacity | ~78% (healthy zone is 75-85%) |
| **Burnout Rate** | % of people with ≥2 burnout signals | ~12% (Sarah + Jonas) |
| **Proposal Accuracy** | Of accepted proposals, % with positive outcome | ~68% (learning: will improve) |
| **Flight Risk Avg** | Avg flight risk across all employees | 0.31 (Sarah at 0.64 is an outlier) |

### Operational Metrics
| Metric | Why It Matters |
|--------|---------------|
| **Velocity Trend** | Is team able to execute at plan speed? (Atlas: -38% is critical) |
| **Task Overdue Rate** | % of tasks exceeding due date | Atlas at 18% (7 of ~40 tasks) |
| **Proposal Cycle Time** | How fast do managers review & approve proposals | Target: 2 clicks, 30 seconds |
| **Audit Log Growth** | Are decisions actually being captured? (Should grow steadily) |
| **Cross-Train Coverage** | For each critical skill, how many people can do it? (Payments: 2 of 18) |

---

## SECTION 13: THE ROADMAP (What's Missing)

### Phase 1 (Now: MVP)
✅ Capacity heatmap + drag
✅ Proposals inbox (agents + human approval)
✅ OS shell (macOS-style UI)
✅ Decisions + Recommendations
✅ Audit trail

### Phase 2 (Next: Real Data)
🔄 Real Supabase backend (demo mode → live org data)
🔄 Real authentication (Supabase Auth + Google/Microsoft SSO)
🔄 Multi-tenancy (white-label for different orgs)

### Phase 3 (Later: Enterprise)
⏳ SCIM provisioning (sync users from Okta/Azure AD)
⏳ SAML SSO (enterprise single sign-on)
⏳ SOC 2 audit readiness
⏳ Advanced RBAC (attribute-based, per-tenant)

### Phase 4 (Future: Autonomy)
⏳ Offline-first (work without internet)
⏳ Advanced simulation (scenario planning, what-if export)
⏳ Agent escalation (agents can execute pre-approved actions autonomously)
⏳ Marketplace (integrate with Slack, Teams, calendar)

---

## SECTION 14: QUICK REFERENCE — ALL URLS & WHAT THEY DO

| URL | Purpose | Key Feature |
|-----|---------|-------------|
| `/` | **Home / Command Center** | Daily standup (Critical/Today/Pending tasks) |
| `/capacity` | **The Wedge** | 6-week heatmap, drag to reallocate |
| `/projects` | **Portfolio Overview** | All projects + health status |
| `/projects/[id]` | **Project Detail** | Kanban board, drag tasks, why-is-this-status popover |
| `/people` | **People Directory** | Searchable, load-sorted, skill search |
| `/people/[id]` | **Person Profile** | Capacity ring, expertise, burnout (manager-only), manager relationships |
| `/executive` | **C-Suite Dashboard** | Revenue at risk, burnout rate, OHI, drifts chart, morning brief |
| `/proposals` | **Agent Inbox** | Ranked proposals, confidence, reasoning, 2-click approve/reject |
| `/risks` | **Risk Matrix** | Probability × Impact, signals, mitigation status, escalation log |
| `/decisions` | **Decision Timeline** | Rationale, options, expected vs actual outcome, calibration |
| `/goals` | **OKR Scorecard** | Goals + key results, project traceability, progress tracking |
| `/graph` | **Dependency Graph** | Org relationships (funds, threatened_by, causes, owns_expertise) |
| `/audit` | **Audit Log** | Insert-only, immutable, every action + reason + before/after |
| `/login` | **Authentication** | Passwordless (magic link) or Google/Microsoft OAuth |
| `/welcome` | **Landing Page** | Hero + value prop + CTA to sign in |

---

## SECTION 15: THE CORE DESIGN PHILOSOPHY

### 1. **Never a Score Without a Why**
Every badge, metric, warning has an Explain popover backed by computed signals.

### 2. **Two-Click Rule**
Any critical action should take ≤2 clicks. Reallocate from heatmap drag, approve proposal from card.

### 3. **Invisible Guardrails**
Capacity drop projecting ≥100%? Modal appears. Reason required. Audit logged. No silent failures.

### 4. **Agents Propose, Humans Decide**
Agents identify patterns. Humans make value judgment. No autonomous mutations (proposal-only).

### 5. **Schema-Authoritative**
Postgres schema is the source of truth. App layer is thin views + TanStack queries. RLS everywhere.

### 6. **Closed-Loop Learning**
Recommend → Accept → Measure → Calibrate. Every recommendation tracks actual outcome.

### 7. **OS, Not Dashboard**
Multiple windows. Persistence. Native affordances. Feels like a *workspace*, not a tool.

---

## CONCLUSION: THE 30-Second Summary

**DizruptOS solves the capacity problem — the hidden thread behind burnout, delays, and turnover.**

It works by:
1. **Visualizing** allocation in a 6-week heatmap (Sarah's 112% is obvious)
2. **Computing** burnout signals from live data (not surveys)
3. **Recommending** actions algorithmically (not opinions)
4. **Proposing** at scale (agents work 24/7)
5. **Approving** in batches (humans make the call)
6. **Measuring** accuracy (did it work?)
7. **Learning** from outcomes (calibrate for next time)

All wrapped in a **macOS-style OS interface** so it *feels native* and becomes the place where capacity decisions live.

The story is Sarah's: from overallocated → reallocated → recovered. That loop, repeated across the org, *is* the product.

