# DIZRUPT — Supreme Product Requirements Document v2.0
## AI-Enhanced Employee Operations & Resource Management Platform

> **Version:** Supreme v3.0 — Final Master Document  
> **Status:** Approved for Engineering Handoff  
> **Classification:** CONFIDENTIAL — Internal Use Only  
> **Owner:** Product Architecture · ideassion Enterprise  
> **Date:** June 2026  
> **Stack:** React (Next.js) · Node.js · Supabase (PostgreSQL) · Claude API · OpenAI  
> **Supersedes:** Supreme v2.0 — closes final review gaps: graph-native layer, Customer/Revenue/Service entities, causal architecture, multi-agent negotiation, CRDT math, scenario simulation, notification debounce, entity lifecycles, state machines, failure modes

---

## Table of Contents

1. [Executive Summary & Product Wedge](#1-executive-summary--product-wedge)
2. [Product Philosophy & Design Doctrine](#2-product-philosophy--design-doctrine)
3. [SWOT Analysis — Competitive Landscape](#3-swot-analysis--competitive-landscape)
4. [Entity Model — The Organizational Graph](#4-entity-model--the-organizational-graph)
5. [Target Personas & Role System](#5-target-personas--role-system)
6. [Dynamic View Architecture](#6-dynamic-view-architecture)
7. [Feature Architecture — Complete Epic Catalogue](#7-feature-architecture--complete-epic-catalogue)
8. [Wave 4 Additions — Strategic Expansion Layer](#8-wave-4-additions--strategic-expansion-layer)
9. [UI/UX Design System](#9-uiux-design-system)
10. [Technical Architecture](#10-technical-architecture)
11. [Concurrency, Consistency & State Management](#11-concurrency-consistency--state-management)
12. [Database Schema Reference](#12-database-schema-reference)
13. [API Endpoint Reference](#13-api-endpoint-reference)
14. [Security Architecture](#14-security-architecture)
15. [AI Intelligence Layer](#15-ai-intelligence-layer)
16. [Product Roadmap — 4 Phases + Realistic MVP](#16-product-roadmap--4-phases--realistic-mvp)
17. [Non-Functional Requirements](#17-non-functional-requirements)
18. [Success Metrics & KPIs (Precisely Defined)](#18-success-metrics--kpis-precisely-defined)
19. [Out of Scope (Permanent)](#19-out-of-scope-permanent)
20. [Pitch Summary](#20-pitch-summary)
21. [Generic Relationship Layer — Graph-Native Architecture](#21-generic-relationship-layer--graph-native-architecture)
22. [Customer, Revenue & Service Entities](#22-customer-revenue--service-entities)
23. [Causal Intelligence Architecture](#23-causal-intelligence-architecture)
24. [Multi-Agent Negotiation Protocol](#24-multi-agent-negotiation-protocol)
25. [CRDT Conflict Resolution — Exact Math](#25-crdt-conflict-resolution--exact-math)
26. [Scenario Simulation Engine](#26-scenario-simulation-engine)
27. [Notification Intelligence — Debounce & Rollup](#27-notification-intelligence--debounce--rollup)
28. [Entity Lifecycle Specifications & State Machines](#28-entity-lifecycle-specifications--state-machines)
29. [Failure Mode Catalog](#29-failure-mode-catalog)
30. [Build Readiness Supplement](#30-build-readiness-supplement)

---

## 1. Executive Summary & Product Wedge

### 1.1 The Wedge — Why This Wins First

Before listing features, state the single reason a company buys DIZRUPT *today*, before any other feature exists.

**The wedge:** A Resource Manager at a 50–500 person company currently spends 3+ hours every Monday morning cross-referencing a Google Sheet of capacity, Jira for task load, and Slack for availability. DIZRUPT collapses this into one screen where they can see every employee's real-time utilization, drag an overloaded task to an available person, and have the database confirm in under a second.

That is the purchase decision. Everything else is retention and expansion.

| Persona | Problem Solved Today | Why They Buy Now |
|---------|---------------------|-----------------|
| **Resource Manager (wedge buyer)** | 3+ hours/week wasted reconciling spreadsheets with task tools | Real-time capacity heatmap + drag-and-drop reallocation in one screen |
| **Project Manager (same buyer, different hat)** | No early warning before a deadline slips | Project health engine that auto-detects risk before the PM notices |
| **Dept Head / CTO (expansion buyer)** | No single view of organizational health across teams | Executive dashboard + burnout detection across all departments |

**Category definition:** DIZRUPT is a **Resource Intelligence Platform** — the system of record for human capacity and organizational execution. Not project management (Jira owns that). Not HR (Workday owns that). The gap between those two, where work meets people, is where DIZRUPT lives.

### 1.2 Product Vision

DIZRUPT is the **operational command center for modern organizations** — combining the workload visualization depth of Float, the execution power of Linear, the management-first UX of Notion, and AI-native organizational memory into a single, unified, premium dark-themed enterprise platform.

It is not a task tracker. It is not an HRMS. It is not a kanban tool.

### 1.3 The Three Core Problems

| Problem | Current Reality | Cost |
|---------|----------------|------|
| **Visibility Fragmentation** | Workforce availability, project health, and execution velocity live in disconnected spreadsheets, Slack, Jira, and HR tools | Managers waste up to 30% of their week manually cross-referencing silos |
| **Decision Latency** | By the time a manager realizes an employee is overloaded or a project is at risk, downstream damage is already in motion | Existing systems report the past; DIZRUPT predicts the future |
| **Organizational Amnesia** | When employees leave or projects close, institutional knowledge evaporates | No AI-searchable record survives the departure |

### 1.4 Solution Pillars

| Pillar | Description |
|--------|-------------|
| **Workforce Orchestration** | Real-time capacity heatmaps, drag-and-drop allocation, skill-matrix filtering, staffing forecasting, PTO-aware scheduling |
| **Execution Management** | Multi-view task governance (Kanban, Roadmap, List, Calendar) with hard-stop guardrails, dependency chains, sprint management, approval workflows |
| **Organizational Intelligence** | AI-powered semantic search, meeting extraction, risk prediction, and an organizational memory engine capturing decisions as searchable corporate knowledge |
| **Enterprise Governance** | Immutable audit trails, granular RBAC, SSO/SAML, MFA, single-session enforcement, financial intelligence, compliance-readiness |
| **Strategic Command** | OKR engine, initiative management, strategy drift detection, portfolio kill-switch analytics, executive operating systems |
| **Organizational Graph** | First-class entity model: People, Teams, Capabilities, Systems, Decisions, Risks, Vendors, Processes — connected relationally |

### 1.5 North Star Metric

> *Any manager must be able to identify who has capacity, assign work, and resolve a capacity conflict in under 2 clicks and under 30 seconds — from any view in the system.*

---

## 2. Product Philosophy & Design Doctrine

### 2.1 Management-First Design

Every screen, interaction model, and data schema is evaluated through a single lens: **does this reduce the time and cognitive load required for a manager to make a high-quality operational decision?**

The **Two-Click Rule** is non-negotiable — finding available staff, assigning a task, escalating a blocker, and reviewing project health must each be completable in no more than two clicks from any view.

### 2.2 Data as Infrastructure

Operational intelligence is derived automatically from normal daily usage. Task creation, status transitions, time logs, and capacity shifts generate the intelligence layer as a **byproduct of work** — zero additional administrative overhead required from any user.

### 2.3 Invisible Guardrails

The system prevents mistakes without interrupting flow. Hard-stop capacity alerts, dependency enforcement, and compliance validation fire contextually and immediately — within the manager's existing decision-making context, never as separate warning pages.

### 2.4 New Employee Comfort Principle

A new employee joining an organization should:
- Understand the interface within 10 minutes of first login
- Complete their profile, view their tasks, and log time without documentation
- Feel the system is helping them, not watching them

This is achieved through **progressive disclosure** — simple by default, powerful on demand. Advanced features surface naturally through use; they are never required on day one.

### 2.5 Premium Aesthetics Doctrine

The UI must be so visually compelling that a person stressed by their job feels relief opening DIZRUPT. Design targets:
- Dark enterprise theme as default (calming, professional, premium)
- Micro-animations that communicate change without noise
- Color-coded intelligence that communicates status at a glance
- Spatial hierarchy that guides the eye without cognitive overhead
- Typography that makes dense data feel readable

### 2.6 Intelligence Over Scores — The Explanation Principle

**v1.0 weakness addressed:** too many raw numeric scores, not enough explanation.

DIZRUPT's intelligence principle: **never show a score without showing why.**

| Bad | Good |
|-----|------|
| `Risk Score: 71` | `Risk elevated because: vendor delivery is 8 days late · dependency chain blocked on QA · Sarah is at 108% utilization` |
| `Project: At Risk` | `At Risk: 3 tasks overdue by >5 days · QA bottleneck detected · velocity 40% below 3-sprint average` |
| `EPS: 62` | `Predictability declining: sprint scope changed mid-sprint 3× this quarter · estimation accuracy 58% (target: 80%)` |

Every score surfaces its causal signals. The score is a summary; the reasons are the product.

### 2.7 What DIZRUPT Is and Is Not

| DIZRUPT IS | DIZRUPT IS NOT |
|------------|----------------|
| A management-first operational intelligence platform | An HRMS |
| A workforce orchestration system | A simple task tracker |
| An organizational memory engine | An attendance tool |
| A strategic command center | A replacement for dedicated payroll |
| An AI-enhanced execution layer | A video conferencing tool |
| A **Resource Intelligence Platform** — system of record for human capacity | A recruiting / ATS tool |

---

## 3. SWOT Analysis — Competitive Landscape

### 3.1 Competitor Analysis

| Competitor | Their Strengths | Key Weakness DIZRUPT Exploits |
|-----------|----------------|------------------------------|
| **Linear** | Beautiful minimalist UI, keyboard-first, developer beloved | No capacity management, no workforce intelligence, dev-only focus |
| **Monday.com** | Highly visual, many integrations, broad persona coverage | Chaotic at scale, no schema enforcement, poor management UX |
| **Asana** | Mature, enterprise-ready, good approval flows | Capacity planning is an add-on afterthought, no AI layer |
| **Jira** | Deep dev ecosystem, strong issue tracking | Engineer-oriented, management UX is hostile, no workforce visibility |
| **Workday / Rippling** | Deep HR, payroll, compliance | Not execution-focused, no task management, expensive, complex |
| **Float** | Best-in-class resource scheduling visualization | No task execution, no knowledge layer, no intelligence |
| **Notion** | Flexible, beloved UI, great docs | No capacity management, too freeform for enterprise at scale |

### 3.2 DIZRUPT SWOT

**Strengths** (built on competitors' structural weaknesses)
- Capacity heatmaps are the foundational layer — not an add-on (beats Asana)
- Management-first Two-Click Rule (beats Jira's hostile UX)
- Enforced schema maintains integrity at scale (beats Monday's chaos)
- Bridges workforce intelligence + execution in one interface (beats Float + Jira combined)
- AI-native from day one with explanatory intelligence — not just scores
- Premium dark UI that employees actually want to use (beats Workday)
- First-class entity model: Capabilities, Decisions, Risks, Systems, Vendors alongside People and Tasks
- Strategic layer: OKRs, initiatives, drift detection (beats everything at the executive layer)

**Weaknesses** (honest assessment)
- New entrant with no established enterprise trust or procurement history
- Feature breadth requires excellent onboarding to avoid overwhelming new users
- AI features depend on LLM uptime and introduce variable cost at scale
- Long enterprise procurement cycle; SMB market (50–500 people) is the realistic entry point

**Opportunities**
- Post-COVID remote work created sustained demand for organizational visibility tools
- AI-native management platforms are a nascent category — first-mover window is open
- SMBs underserved by enterprise platforms requiring 6-month deployments
- India's startup ecosystem primed for a homegrown premium tool that punches above its weight

**Threats**
- Linear, Notion, or Asana could add capacity management
- Microsoft/Google could bundle similar functionality into Teams/Workspace
- Enterprise procurement cycles are slow and conservative
- AI model costs could erode unit economics at scale if not governed

### 3.3 Competitive Positioning Matrix

| Feature | DIZRUPT | Linear | Monday | Asana | Jira | Float |
|---------|---------|--------|--------|-------|------|-------|
| Capacity heatmaps (native) | ✅ | ❌ | ❌ | ⚠️ Add-on | ❌ | ✅ |
| Task execution | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| AI intelligence layer | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ |
| OKR / strategy layer | ✅ | ❌ | ⚠️ | ⚠️ | ❌ | ❌ |
| First-class Decision entity | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| First-class Risk entity | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Org memory / knowledge ownership | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Explanatory AI (why, not just what) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Premium dark UI | ✅ | ✅ | ❌ | ❌ | ❌ | ⚠️ |
| Single-session enforcement | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Entity Model — The Organizational Graph

This section is **new in v2.0** and addresses the most significant architectural gap in v1.0: the entity model was too shallow. DIZRUPT models organizations as graphs of connected entities, not just lists of tasks and projects.

### 4.1 Why Entities Beat Features

Enterprise software becomes genuinely powerful when entities connect. The value is in the **relationships**, not the records.

```
Employee
  OWNS → System
  BELONGS_TO → Team
  HOLDS_EXPERTISE_IN → Capability
  MADE → Decision
  ASSIGNED_TO → Task

System
  SUPPORTS → Capability
  DEPENDS_ON → Vendor
  DOCUMENTED_BY → Knowledge

Capability
  DELIVERS → Project outcome
  THREATENED_BY → Risk
  ENABLED_BY → Team

Decision
  MITIGATES → Risk
  RATIONALE_REFERENCES → Knowledge
  MADE_IN → Meeting

Risk
  THREATENS → Capability
  OWNED_BY → Employee
  TRACKED_IN → Risk Register

Process
  OWNS → Workflow
  MEASURED_BY → SLA
  PRODUCES → Knowledge artifact
```

The organizational graph is what separates a tool from an operating system.

### 4.2 First-Class Entity Catalogue

| Entity | What It Models | Why It's First-Class |
|--------|---------------|---------------------|
| **Employee** | A person, their skills, capacity, lifecycle, expertise, and relationships | The atomic unit — everything connects to people |
| **Team** | A stable group with shared ownership, health, and velocity | Capabilities are delivered by teams, not individuals |
| **Project** | A time-bounded effort with budget, health, and delivery targets | The primary execution container |
| **Task** | A unit of work with assignee, status, and time tracking | The daily driver for contributors |
| **Capability** | An organizational function: Payments, Identity, Compliance, etc. | Capabilities outlive projects; budget flows to capabilities |
| **System** | A technical or business system: CRM, Payment Service, ERP | Systems are what projects build; their operational health matters |
| **Decision** | A formal, recorded organizational decision with rationale and outcome | Decisions are what organizations do; not tracking them causes amnesia |
| **Risk** | A potential negative event with probability, impact, owner, mitigation | Risks are real entities, not alerts on dashboards |
| **Process** | A repeatable workflow: Hiring, Deployment, Onboarding, Incident Response | Processes span projects and persist; they need health tracking |
| **Vendor** | An external supplier with contracts, performance, and renewal dates | Vendor dependency is organizational risk |
| **Meeting** | A recorded interaction with decisions, commitments, and action items | Meetings produce knowledge; currently they evaporate |
| **Commitment** | A promise made by a named individual to deliver something by a date | Commitments are promises, not tasks; they need separate tracking |
| **Expertise** | A domain of knowledge attributed to specific people with depth levels | Skills (can do) ≠ Expertise (has done; others rely on) |
| **Knowledge** | A decision record, lesson, SOP, or validated learning | Knowledge has owners, decay dates, and access paths |
| **Goal** | An OKR-style objective with linked key results and contributing projects | The strategic anchor for all work |

### 4.3 Knowledge vs. Documentation (Critical Distinction)

v1.0 treated documentation and knowledge as the same thing. They are not.

| Documentation | Knowledge |
|--------------|-----------|
| SOPs, wikis, guides | Lessons learned, decision rationale, outcomes |
| Created once, rarely updated | Living; updated as understanding deepens |
| No expiry | **Decays** — becomes wrong if not reviewed |
| No expertise link | Explicitly linked to who holds it |
| Stored | **Surfaced proactively** when relevant |

DIZRUPT captures both, but the intelligence layer treats them differently. Documentation is referenced. Knowledge is surfaced proactively when a user faces a similar situation.

### 4.4 The Organizational Relationship Graph

This is the graph DIZRUPT builds over time. Every operation adds an edge. The graph is what makes organizational intelligence possible.

```
[Employee] ──owns──────────────▶ [System]
[Employee] ──holds_expertise──▶ [Capability]
[Employee] ──assigned_to───────▶ [Task]
[Employee] ──made_commitment──▶ [Commitment]
[Employee] ──owns_risk─────────▶ [Risk]
[Team] ────delivers─────────────▶ [Capability]
[Team] ────executes─────────────▶ [Project]
[Project] ──produces────────────▶ [System]
[Project] ──linked_to───────────▶ [Goal]
[Project] ──exposes────────────▶ [Risk]
[Capability] ──threatened_by───▶ [Risk]
[Capability] ──depends_on───────▶ [Vendor]
[System] ──documented_by────────▶ [Knowledge]
[Decision] ──mitigates──────────▶ [Risk]
[Decision] ──made_in────────────▶ [Meeting]
[Meeting] ──produces────────────▶ [Commitment]
[Process] ──governs─────────────▶ [Workflow]
```

---

## 5. Target Personas & Role System

### 5.1 The Seven Roles

| Role | Type | Core Pain | Core Need | Default Landing |
|------|------|-----------|-----------|----------------|
| **Admin** | Internal — governance | Manual provisioning, access sprawl, no single truth | Full system control, audit, security | Organization command center with health overview, security alerts, and recent audit events |
| **Executive / C-Suite** | Secondary — strategic | No single cross-department health view | Executive dashboards, drill-down analytics, AI summaries | Executive Intelligence Command Center with portfolio health and OKR scorecard |
| **Department Head** | Secondary — operational | Siloed department visibility | Department-scoped analytics, team health, budget control | Department dashboard with team health, project status, and budget burn |
| **Project Manager / Resource Manager** | **PRIMARY — highest DAU** | Cross-referencing spreadsheets wastes 3+ hours daily | Real-time heatmaps + drag-and-drop reallocation in under 2 clicks | Team capacity heatmap + active sprint board split view |
| **Team Lead** | Secondary — operational | Unclear dependency chains, context switching | Roadmap + dependency viz + sprint velocity | Team kanban board + upcoming sprint view |
| **Employee / Contributor** | Tertiary — execution | Surprise assignments, unclear priorities | Personal task queue with PTO-protected calendar | Personal task queue + today's focus view |
| **Client Viewer** | External — view only | Opaque project status forces constant update emails | Sandboxed portal with milestone visibility | Clean project portal with milestone timeline |

### 5.2 Primary Persona Deep Profile — Resource / Project Manager

The Resource/Project Manager is the highest-frequency daily user. Their core workflow answers three questions every morning:
1. Who has capacity to absorb new work this sprint without going overload?
2. Which projects are at risk, and what is the root cause?
3. Can we accept the new client request without burning out a specific team?

All product decisions are evaluated from this persona's perspective first.

---

## 6. Dynamic View Architecture

Every screen, every data point, and every action is **filtered and shaped by the viewing user's role and context**. The same URL renders a completely different experience for an Admin vs. an Employee.

### 6.1 Role-Based View Mapping

**Admin View** — Sees: everything. Can do: everything. Landing: org command center with security alerts and audit events.

**Executive View** — Sees: cross-dept health matrix, portfolio status, OKR progress, financial roll-ups, AI briefings. Cannot do: mutate operational data. Landing: Executive Intelligence Command Center.

**Department Head View** — Sees: full control within their dept — projects, team, capacity, budgets, capability health. Cannot access: other departments' sensitive data. Landing: Department dashboard.

**Project Manager View** — Sees: capacity heatmaps for assigned teams, managed projects, sprint boards, time logs, forecasts. Cannot: edit employee profiles beyond skill tags, view payroll data. Landing: Team heatmap + sprint board split view.

**Team Lead View** — Sees: their team's tasks, capacity, roadmap, velocity. Cannot: cross-team allocation, financial data, audit logs. Landing: Team kanban + upcoming sprint.

**Employee View** — Sees: their own tasks, capacity calendar, PTO, skill profile, performance. Cannot: see other employees' capacity, financial data, or analytics. Landing: Personal task queue + today's focus.

**Client Viewer** — Sees: only explicitly shared milestones, timeline, deliverable status. Cannot: see internal employees, capacity, or financial data. Landing: Clean project portal.

### 6.2 Progressive Complexity — New Employee Onboarding

Guided setup on first login (4 steps, <10 minutes):
1. Complete profile (photo, bio, skills, timezone)
2. View assigned tasks
3. Log first time entry
4. Join team's Kanban board

Advanced features surface naturally through use. The automation engine, OKRs, and knowledge graph are discoverable but never required on day one.

---

## 7. Feature Architecture — Complete Epic Catalogue

### Epic 1 — Project Management Core

**1.1 Project Workspace & Metadata Engine**
- Project cards: title, description, objectives, department mapping, ownership, team avatar collection
- Project overview pages: milestone trees, stakeholder lists, linked documents, activity timelines
- Progress auto-aggregation via DB triggers: 0–100% from real-time task completions — no manual entry
- Status system: Active, Planning, On Hold, Completed, At Risk, Critical — color-coded throughout UI
- **Linked entities:** Projects link to Goals, Capabilities, Systems, Risks, and Vendors — not just tasks
- **Health explanation panel:** Every health status shows the specific signals that caused it — never just a color badge

**1.2 Project Portfolio Management (PPM)**
- Portfolio grouping: aggregate related projects into company initiatives or named client accounts
- Cross-project benchmarking: side-by-side executive comparison of scope, spend, and delivery health
- Executive portfolio overview: single-page health matrix across all active company initiatives

**1.3 Resource Budgeting & Cost Modeling**
- Estimated vs. consumed hours tracking per project
- Burn-rate visual gauges: budget exhaustion rate from seniority tiers and current allocation
- All financial values stored as integer micro-units — **zero floating-point arithmetic anywhere in the stack**

**1.4 Project Health Engine (Auto-Calculated)**
- Health statuses: On Track, Delayed, Blocked, Critical, At Risk — **auto-calculated, never manually set**
- Risk variables: overdue task ratio, stalled dependencies, workload imbalance, missing assignees, missed milestones
- **Explanatory output:** 'Delayed because: 3 tasks overdue by >5 days, QA bottleneck detected, velocity 40% below average'

**1.5 Smart Project Templates**
- Reusable blueprints: software sprints, client delivery, compliance reviews, hiring pipelines, marketing campaigns
- Template versioning and department-specific libraries

---

### Epic 2 — Task Governance & Execution Engine

**2.1 Multi-View Task Architecture**
- **Kanban Board:** Drag-and-drop columns (Backlog, To Do, In Progress, Review, Client Review, Blocked, Completed)
- **Roadmap / Gantt View:** Horizontal timeline with task blocks, dependency arrows, milestone markers
- **List View:** Tabular view grouped by status, priority, assignee, department, or sprint
- **Calendar View:** Due date overlay with leave periods, public holidays, and sprint schedules

**2.2 Granular Task Attributes**
- Core fields: title, rich-text description, project link, primary assignee, co-assignees, milestone, status, priority, due date, estimated hours
- Advanced: subtask nesting, checklists, file attachments, labels/tags, recurring tasks, dependency links, watchers
- Custom fields and custom status workflows per project type

**2.3 Sprint & Iteration Management**
- Formal sprint creation: date ranges, capacity limits, sprint goals, scope commitment
- Sprint close workflow: auto velocity calculation, incomplete task carryover prompt, retrospective log entry
- Velocity charts per sprint with rolling trend line

**2.4 Dependency Architecture with DAG Cycle Detection**
- Task relationship types: Blocked By, Depends On, Waiting For, Review Required, Parent-Child
- Roadmap cascade: moving a parent task shifts all downstream dependent task schedules
- **Server-side DFS cycle detection:** runs before any dependency edge is written — returns HTTP 422 with cycle path on violation
- **Phase 2:** `task_dependencies` relational table replaces JSONB array for proper O(1) edge queries

**2.5 Task Routing & Approval Workflows**
- Capacity-aware auto-routing: matches unassigned tasks to employees with lowest heatmap load + highest skill match
- Approval chains: Member Submission → Manager Review → Director Approval → Client Approval → Completed
- Escalation triggers: if approval pending beyond threshold, auto-escalate to next org tier

**2.6 Time Tracking**
- Manual time logging: start/stop timer or manual entry
- Timesheet submission workflow: manager approval with rejection-and-comment loop
- Overtime alerts: system flags when logged hours approach weekly thresholds
- Timelog immutability: every entry is append-only, attributed to user and timestamp

---

### Epic 3 — Capacity Intelligence & Workforce Orchestration

**3.1 Real-Time Capacity Heatmaps — Phased Implementation**

- **Phase 0 MVP:** Read-only daily aggregates served from a materialized view, refreshed every 5 minutes. No live drag-and-drop. Impresses buyers immediately without requiring complex state management.
- **Phase 1:** Live via department-scoped Supabase Realtime channels (not global table broadcasts)
- **Phase 2:** Full drag-and-drop reallocation with optimistic UI and atomic RPC updates

Display: Green (<80%), Yellow (80–99%), Red (≥100%)

**3.2 Capacity Calculation — Precise Mathematical Definition**

```
utilization_pct = SUM(estimated_hours for tasks WHERE due_date falls within week)
                  / users.capacity_hours_per_week

Over-allocated: utilization_pct >= 1.0
```

Capacity mutations use **atomic increment** — never full overwrite:
```sql
UPDATE capacity_logs
SET allocated_hours = allocated_hours + $delta,
    utilization_pct = (allocated_hours + $delta)::float / $capacity_limit
WHERE user_id = $uid AND week_start = $week;
```

**3.3 Drag-and-Drop Allocation Engine**
- Click task on red employee → drop onto green employee
- Optimistic UI: local state updates in <50ms; RPC confirms asynchronously
- Hard-stop guardrail: if drop would push target above 100%, modal requires typed override reason
- Override logged in `audit_events` with `override_reason` field
- Race condition handling: on concurrent conflict, roll back optimistic state and show "Task was modified — Refreshing board"

**3.4 Availability & Leave Integration**
- Unified availability calendar: PTO, sick leave, public holidays, timezone offsets feed the capacity planner
- Hard scheduling block: unavailable dates removed from the assignment canvas — impossible to assign on leave day

**3.5 Skill Matrix & Internal Talent Discovery**
- Boolean skill search: 'React AND fintech AND >15h available next week'
- **Expertise vs. Skills distinction:** Skills = "can do." Expertise = "has done at depth; others rely on them." Expertise carries a depth score (0.0–1.0) and a "last active" timestamp
- Skill gap reporting: identifies skills critically understaffed relative to upcoming pipeline demand

**3.6 Staffing Forecasting Engine**
- Demand prediction: analyzes backlog + pipeline to project future capacity strain
- Proactive gap alerts: 'Backend team projected at 142% utilization in 30 days. Recommended: +2 engineers.'
- What-if scenario modeling: ghost project shows capacity impact before committing

**3.7 Workforce Scenario Planning (4 Core Scenarios)**
- Headcount Addition / Headcount Loss / Project Addition / Budget Cut
- Each scenario outputs: capacity impact by dept, delivery timeline changes, burnout risk delta, financial impact, recommendation

---

### Epic 4 — Team & Organizational Structure

**4.1 Employee Directory Hub** — Card-based directory with deep-dive panel: active projects, capacity %, expertise domains, certifications, workload trend, career timeline.

**4.2 Interactive Org Chart Visualization** — Dynamic hierarchical tree. Phase 4: informal influence overlay from ONA data.

**4.3 Department Workspaces** — Scoped heatmaps, project health, analytics — no cross-department leakage below role threshold.

**4.4 Employee Lifecycle Tracking** — Onboarding → Probation → Active → Transferred → On Leave → Offboarding. Zero-touch onboarding auto-triggers IT provisioning, team assignments, training enrollment.

**4.5 Team Health & Burnout Scoring — Precise Signal Definitions**

Burnout flag triggers (independently evaluated):
- `consecutive_weeks_over_50h >= 3`
- `days_since_pto_used >= 90`
- `utilization_pct >= 1.0 for 7+ consecutive days`
- `task_reassignment_rate > 0.3 in 30-day window`

Burnout status is private to managers and HR only. The flagged employee is never shown their own flag.

---

### Epic 5 — Knowledge Systems & Organizational Memory

**5.1 Knowledge Hub — Expanded Entity Model**

| Knowledge Type | Behavior |
|---------------|---------|
| SOPs / Documentation | Static references, version-controlled, linked to tasks and processes |
| Decision Records | Formal decisions with rationale, alternatives considered, outcome, and review date |
| Lessons Learned | Post-incident learnings with improvement action tracking |
| Expertise Profiles | Who knows what at depth — surfaced when similar problems arise |
| Policies | Governance documents with mandatory review schedules and owner accountability |

**5.2 Knowledge Decay & Ownership**

Every knowledge artifact has: Owner, Reviewer, review_due_date, and an orphan detection mechanism. If the owner has left and no successor is assigned, the artifact is flagged as orphaned in the Blind Spot Dashboard.

**5.3 Contextual Knowledge Surfacing**
- Task creation surfaces relevant SOPs based on project type and department
- Blocker raised → system searches organizational memory for similar past blockers and surfaces resolution patterns
- Project starts → surfaces decisions and lessons from similar past projects

**5.4 Organizational Memory Engine** — Decision capture, AI-searchable, grows passively from retrospectives and blocker resolutions.

**5.5 Credential Lifecycle Management** — Supabase Vault + pgcrypto, expiry tracking, role-gated access logging.

---

### Epic 6 — AI & Operational Intelligence Layer

**6.1 AI Semantic Search** — Natural language queries across all entities via hybrid search (70% vector + 30% BM25). RLS-aware: users never see results outside their permission scope.

**6.2 AI Project Summaries & Executive Briefings** — One-click board-ready PDF in <30 seconds. **All summaries include source attribution** — every claim links to the specific entity that supports it.

**6.3 Predictive Risk & Delivery Analysis with Explanation**

Output format: `'Project X likely to miss deadline by 8 days. Causes: (1) QA team at 112% utilization, (2) payments dependency unresolved for 5 days, (3) velocity 40% below 3-sprint average'`

**Pre-suggestion validation:** Before surfacing any AI recommendation, Node.js validates it against hard database constraints (PTO blocks, dependency locks, capacity limits). Invalid suggestions are silently discarded.

**6.4 AI Meeting Intelligence** — Transcript ingestion → automatic extraction of tasks, owners, deadlines, blockers. Extracted tasks staged for manager review — AI is advisory at this stage.

**6.5 Smart Staffing Recommendations** — Ranked candidates by skill match, project history, availability. Validation layer confirms capacity and PTO against DB before displaying.

**6.6 Flight Risk Detection** — Private to HR and managers. Triggers: >50h for 3+ consecutive weeks, no PTO in 8 months, same role 2+ years without project shift, rising task reassignment rate.

**6.7 Autonomous Workflow Orchestration Agents (Phase 4)**
- Allocation, Risk, Burnout, Delivery agents — **write ONLY to `proposals` table, never to operational tables**
- **Agent conflict resolution:** Burnout protection outranks allocation optimization. Hard constraints outrank soft recommendations.
- **Rejection memory:** agents do not re-propose rejected actions for the same entity for 30 days

---

### Epics 7–16 — Summary Reference

| Epic | Name | Key Capability |
|------|------|---------------|
| **7** | Analytics & Executive Dashboards | Executive Intelligence Command Center with explanatory metrics; burnout dashboard; SLA tracking; one-click export |
| **8** | Collaboration & Communication | In-app notification center with causal explanations; threaded discussions on any entity; approval workflows; live presence |
| **9** | Automation Engine | IF/THEN rule builder with worker thread isolation; cycle detection (max 10 chain depth); recurring pipelines |
| **10** | Client & External Portal | Sandboxed milestone views; deliverable approvals; client-isolated auth tier with RLS |
| **11** | Authentication & Security | JWT RS256; single-session enforcement; MFA/TOTP; persistent login via httpOnly cookie; device fingerprinting |
| **12** | Enterprise Governance | SSO/SAML/SCIM; SOC 2 Type II; GDPR; HIPAA-compatible architecture |
| **13** | Financial & Billing Intelligence | Billable/non-billable tracking; live margin tracking; budget overrun alerts; integer micro-unit storage |
| **14** | Integrations | GitHub/GitLab, Slack/Teams, Google Calendar/Outlook, Okta/Azure AD, public API + webhooks (Phase 4) |
| **15** | Realtime Infrastructure | Department-scoped Supabase channels; optimistic UI; graceful degradation (30s polling fallback) |
| **16** | Premium UX / UI System | Command Palette (Ctrl+K); universal search across all entity types; inline editing; floating side panels; Framer Motion |

---

## 8. Wave 4 Additions — Strategic Expansion Layer

### 8.1 Strategic Layer

**Strategic Initiative Management** — Multi-year, multi-department efforts. Entity: sponsor, program manager, linked goals/projects/capabilities, budget, ROI estimate. Health auto-calculated from constituent project health.

**Strategy Drift Detection**
```
Drift Score = 100 - (Hours on tasks linked to active goals / Total hours logged × 100)
```
| Score | Classification | Action |
|-------|---------------|--------|
| 0–10% | Aligned | No action |
| 11–20% | Minor Drift | Review unlinked projects in next planning cycle |
| 21–35% | Moderate Drift | Immediate manager review |
| 36–50% | Significant Drift | Executive alert; strategic review triggered |
| > 50% | Critical Drift | Emergency strategic realignment |

**Portfolio Kill Switch Analytics** — Kill Score (0–100): ROI trajectory (30%), delivery velocity (20%), strategic alignment (20%), team health impact (15%), opportunity cost (15%).

**Decision Outcome Analytics** — Decision Quality Score (DQS) per individual and team. Confidence Calibration Report reveals overconfidence patterns over time.

### 8.2 Leadership & Management Systems

**Leadership Operating System** — WBR/MBR/QBR review cadence with auto-assembled pre-read package from live system data.

**Commitment Tracking System** — Tracks promises made by named individuals (not task assignments). Fulfillment rate, overdue queue, reliability score per person.

**Manager Operating System** — 1:1 tracking, team health, capacity, growth plans, escalations, recognition. Flags: manager has not held 1:1 with a direct report in >21 days.

**Leadership Accountability Layer** — Accountability Score: (fulfilled commitments on time / total due in period). Score <80% → manager notification. Score <65% → escalation.

### 8.3 Workforce & Capability Intelligence

**Knowledge Risk Engine**
```
KRS = (Critical signals × 3) + (High signals × 2) + (Medium signals × 1)
```
Critical: one person >80% of domain expertise; expert has flight risk >0.6.
High: no recorded successor; all decisions in domain by one person.

**Organizational Bus Factor Dashboard** — "What breaks if Sarah leaves?" Bus Factor Score per person (1–10), per project, per capability.

**Capability Maturity Framework** — Maturity 1–5 across: Process, Tool Coverage, Team Capability, Documentation, Monitoring. Connects investment to maturity outcomes.

**Internal Talent Marketplace** — Internal project opportunities matched to employee growth goals.

**Learning & Development Layer** — Career ladders, competency frameworks, promotion readiness (Ready Now / 6 months / Not yet on track).

### 8.4 Knowledge & Memory Systems

**Organizational Memory Timeline** — Visual chronological history for any entity (team, project, system, capability, employee). Creates institutional history that survives people leaving.

**Institutional Learning System** — Learning Record Schema: what happened → root cause → contributing factors → lesson → improvement action → improvement owner → status → validation.

**Organizational Knowledge Ownership** — Governance with explicit roles (Author, Owner, Reviewer, Steward). Orphaned knowledge surfaces as an organizational risk.

### 8.5 Process & Execution Intelligence

**Work Quality Intelligence**
```
WQS = 1 - ((Rework Rate × 0.35) + (Rejection Rate × 0.25) + (Defect Rate × 0.20) + (Reopen Rate × 0.20))
```

**Execution Predictability Index (EPS)**
Dimensions: Sprint Commitment Accuracy (30%), Estimation Accuracy (25%), Deadline Reliability (25%), Scope Stability (20%).

| EPS | Classification | Action |
|-----|---------------|--------|
| 90–100 | Highly predictable | No intervention |
| 75–89 | Reliable | Standard management |
| 60–74 | Developing | Coaching recommended |
| < 60 | Unpredictable | Intervention required |

**Organizational Friction Analytics** — Friction Score (0–100) measuring: approval delays, cross-team dependency waits, escalation frequency, task handoff delays, rework from unclear requirements, meeting-to-output ratio.

**Process Intelligence** — Cycle time, bottleneck stage, SLA compliance for: Employee Onboarding, Software Deployment, Budget Approval, Vendor Onboarding, Incident Response.

**Execution DNA Profiles** — Team archetypes: Precision Engine, Velocity Machine, Balanced Performer, Collaborative Builder, Experimental Team, Stabilization Crew. Used for work routing.

### 8.6 Organizational Health & Culture

**Organizational Health Index (OHI)**
Weighted composite: Workload Fairness (20%), Manager Effectiveness (25%), Team Stability (15%), Psychological Safety (20%), Recognition Health (10%), Meeting Health (10%).
Target: >75. Critical: <50.

**Cognitive Load Index (CLI)**
Distinct from burnout — measures information overload and context complexity.
```
CLI signals: concurrent project count, context switch frequency, meeting-to-deep-work ratio,
             open approval queue depth, unread notification backlog, open commitment count
CLI: 0–30 Healthy | 31–50 Moderate | 51–70 High | 71–100 Critical
```
An employee at normal utilization (38h/week) but spread across 7 projects with 200 unread notifications has extreme cognitive load.

### 8.7 Financial & Portfolio Intelligence

**Resource Economics** — Team ROI = (Value Generated) / (Fully-loaded Team Cost) × 100. Reveals under/over-invested teams. Value attribution: revenue from shipped features, cost savings, risk reduction value.

**Vendor & Partner Intelligence** — Renewal calendar (180-day horizon), risk matrix (Strategic Importance × Risk Level), dependency mapping showing which systems collapse if a vendor is unavailable.

### 8.8 Intake, Coordination & Planning

**Work Intake & Demand Management**
```
Intake Score (0–100) = Strategic Alignment (30%) + Business Impact (25%)
                     + Urgency (20%) + Feasibility (15%) + Dependencies Cleared (10%)
```

**Internal Request System** — Cross-functional service requests (Design, Legal, IT, HR, Finance, Marketing, Security) with category-specific SLAs and demand tracking.

**Cross-Functional Planning Workspace** — Shared Timeline, Cross-Team Dependency Board, Capacity Snapshot, Shared Decision Log, Stakeholder Alignment Tracker.

### 8.9 AI Intelligence Layer (Advanced)

**Organizational Blind Spot Detection** — AI-powered scan for entities without owners, sponsors, maintainers, or stewards.

Blind spot categories: capabilities with no owner, projects with no active sponsor, systems with no maintainer, knowledge domains with no expert, risks with departed owners, goals with no linked execution, commitments with inactive owners.

**Stakeholder Intelligence** — Stakeholder Map (2×2 Influence × Interest). Engagement Health. Disengagement Alert for high-influence stakeholders not engaged in >30 days on critical projects.

**Organizational Friction Map (AI Layer)** — AI traces friction chains across departments and quantifies total organizational cost.

---

## 9. UI/UX Design System

### 9.1 Design Philosophy

DIZRUPT's visual language: **dense data should never feel dense.** The UI communicates organizational complexity without overwhelming.

Inspiration: Linear's focus and polish, Vercel's dark theme sophistication, Figma's spatial hierarchy, Loom's warmth in an enterprise context.

### 9.2 Color System

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#0A0A0F` | Page background — near-black, cool undertone |
| `bg-surface` | `#111118` | Cards, panels |
| `bg-elevated` | `#1A1A25` | Modals, dropdowns, command palette |
| `border-subtle` | `#2A2A3A` | Card borders, dividers |
| `brand-primary` | `#6366F1` | CTAs, active states, brand accent |
| `brand-secondary` | `#8B5CF6` | Secondary actions, hover states |
| `success` | `#10B981` | On Track, capacity green (<80%) |
| `warning` | `#F59E0B` | At Risk, capacity yellow (80–99%) |
| `danger` | `#EF4444` | Critical, Blocked, capacity red (≥100%) |
| `text-primary` | `#F8F9FA` | Headings and primary content |
| `text-secondary` | `#9CA3AF` | Supporting text, labels, timestamps |
| `text-muted` | `#6B7280` | Tertiary text |

### 9.3 Typography

| Usage | Font | Weight | Size |
|-------|------|--------|------|
| Display / Hero | Inter Display | 600–700 | 48px+ |
| Headings | Inter | 500–600 | 18–32px |
| Body | Inter | 400 | 14px |
| Code / Mono | JetBrains Mono | 400 | 13px |
| Data Tables | Inter (tabular nums) | 400 | 13–14px |

### 9.4 Component Language

**Cards:** border-radius 12px, gradient border on hover `1px solid rgba(99,102,241,0.3)`, box-shadow `0 0 0 1px rgba(99,102,241,0.1), 0 4px 24px rgba(0,0,0,0.4)`

**Capacity Bars:** 8px height, rounded caps, smooth transition `0.3s cubic-bezier(0.4,0,0.2,1)`, red-state gradient `linear-gradient(90deg,#EF4444,#DC2626)`

**Status Pills:** border-radius 99px, color-coded background at reduced opacity, always icon + text for accessibility

**Buttons:** Primary (solid indigo with micro-shine), Secondary (outlined), Ghost (text only), Destructive (red with confirm); all 8px radius, 44px min touch target

### 9.5 Animation & Motion (Framer Motion)

| Event | Animation |
|-------|-----------|
| Page transition | `opacity:0→1, y:8→0` over 200ms |
| Card hover | `y:-2, scale:1.005` over 150ms |
| Drag-and-drop | Elevation shadow, 2deg rotation |
| Capacity bar fill | Spring animation on value change |
| Loading skeleton | Shimmer gradient sliding |
| Critical alert | Subtle red pulse glow |

### 9.6 Layout Architecture

**Left Sidebar:** 240px expanded / 64px collapsed. Active: indigo left border. User avatar + role at bottom.

**Main Content:** Full width minus sidebar. Page header: breadcrumb + right-aligned actions.

**Right Side Panel:** 420px, slides from right without pushing content. Task detail, employee profile, notification detail.

**Top Bar:** Ctrl+K → command palette. Notification bell. Quick actions. Avatar with role indicator.

### 9.7 Key Screens — Design Intent

**Capacity Heatmap:** Employees (Y) × weeks (X) matrix. Overloaded employees burn red. Drag tasks between cells. Feels like a live operations dashboard, not a spreadsheet.

**Kanban Board:** Premium card columns. Cards: priority color bar left, title, assignee avatar, due date, subtask count. Contextual right-click menu.

**Executive Dashboard:** Command center aesthetic. Large metric tiles with trend sparklines + one-line explanation under each metric. Portfolio health 2×2 grid. Real-time activity feed.

**Employee Profile:** LinkedIn-style card with enterprise intelligence. Capacity ring chart. Burnout indicator visible to managers only. Career timeline.

**Command Palette:** Full-width overlay. Results grouped by entity type. Keyboard navigation. Recent actions before typing.

---

## 10. Technical Architecture

### 10.1 Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, TanStack Query | SSR/SSG, composable UI, animated enterprise UX, optimistic state |
| Backend API | Node.js (Express/Fastify), TypeScript, Supabase Admin SDK | Central logic controller, JWT enforcement, RBAC middleware, capacity RPCs |
| Database | Supabase (PostgreSQL 15), RLS, RPC Functions, pgvector | Relational integrity, multi-tenant isolation, atomic business logic, AI embeddings |
| Realtime | Supabase Realtime — department-scoped channels | Live heatmap updates, presence, collaborative editing |
| Auth | Supabase Auth, JWT (RS256), custom sessions table, MFA/TOTP, httpOnly refresh cookie | Single-session enforcement, persistent login, device fingerprinting |
| AI Layer | Claude API, OpenAI GPT, pgvector, embeddings pipeline | NLP semantic search, meeting extraction, risk prediction, autonomous agents |
| Storage | Supabase Storage, Supabase Vault, pgcrypto | SOPs/attachments in buckets; secrets in Vault with column-level encryption |
| Workers | Railway.app persistent Node.js service | Automation engine (worker threads), embedding pipeline, AI agents, crons |
| Infrastructure | Vercel (frontend + API routes), Railway (persistent workers), Supabase Cloud | Global delivery, zero-config scaling |

### 10.2 Deployment Runtime Architecture (Critical)

**Vercel (serverless):** Auth, CRUD, capacity RPCs, search, client portal — short-lived (<10s) stateless.

**Railway (persistent process):** Automation rules, embedding pipeline, AI agent monitoring, scheduled crons — **cannot run on serverless due to lifecycle constraints.**

```
┌──────────────────────────────────────────────────────────────┐
│ VERCEL CDN + SERVERLESS FUNCTIONS                            │
│ Next.js frontend, API routes (auth, CRUD, search, capacity)  │
└────────────────────┬─────────────────────────────────────────┘
                     │ HTTPS + WebSocket
┌────────────────────▼─────────────────────────────────────────┐
│ SUPABASE CLOUD                                               │
│ PostgreSQL 15 + RLS + Auth + Realtime + Vault + pgvector     │
└────────────────────┬─────────────────────────────────────────┘
                     │ Supabase SDK (shared DB connection)
┌────────────────────▼─────────────────────────────────────────┐
│ RAILWAY WORKER SERVICE (Persistent Process)                  │
│ Automation engine · Embedding pipeline · AI agents · Crons   │
└──────────────────────────────────────────────────────────────┘
External: Claude API · OpenAI API · Sentry
```

### 10.3 RLS Performance Strategy — Avoiding Latency Degradation

**The problem:** Naive RLS with deep hierarchical joins causes nested loop joins at query time — blows the 300ms latency target.

**The solution:** Flatten access control boundaries at **write time**, not read time. Entities store a pre-computed `visibility_scope UUID[]` array maintained by a DB trigger. RLS becomes a simple array overlap check:

```sql
CREATE POLICY projects_select ON projects FOR SELECT USING (
  deleted_at IS NULL AND (
    auth.jwt()->>'role' IN ('admin','executive')
    OR auth.uid() = owner_id
    OR (SELECT department_id FROM users WHERE id = auth.uid()) = ANY(visibility_scope)
  )
);
```
O(1) indexed array lookup instead of a JOIN chain.

### 10.4 Architecture System Laws

1. **Audit Completeness:** Every state-changing operation MUST write to `audit_events` within the same DB transaction.
2. **RLS Coverage:** Every table MUST have RLS enabled. CI `rls:check` blocks merges on unprotected tables.
3. **No Autonomous AI Mutation:** Agents write ONLY to `proposals`. Never to operational tables.
4. **Session Singleton:** At most one `is_active=true` row per `user_id` in sessions at all times.
5. **Financial Integer Purity:** All monetary values stored as INTEGER micro-units. Float conversion only in API response serializer.
6. **Atomic Capacity:** Capacity mutations use `allocated_hours = allocated_hours + $delta`. Never full overwrites.
7. **Secrets Never in Client:** No API key or credential in React bundle or browser storage.
8. **State Transitions Only:** Status fields only transition to valid next states. Node.js validator runs before every status write.
9. **Idempotent Consumers:** Every queue consumer MUST be idempotent. `event_id` is the deduplication key.
10. **Graceful AI Degradation:** Every AI feature has a non-AI fallback. Core features have zero dependency on AI availability.
11. **Soft Deletes with Indexed Exclusion:** Use `deleted_at TIMESTAMPTZ`. Unique constraints include `WHERE deleted_at IS NULL`. All SELECT policies exclude soft-deleted rows.
12. **AI Validation Before Surface:** Every AI recommendation validated against hard DB constraints before display. Invalid suggestions discarded silently.

---

## 11. Concurrency, Consistency & State Management

This section is **new in v2.0** and addresses the most significant production-readiness gaps from the architectural review.

### 11.1 Frontend State Architecture

| State Category | Storage | Scope | Examples |
|---------------|---------|-------|---------|
| JWT / Auth | Module-level variable in `lib/auth.ts` | Session memory (wiped on page refresh → silent re-auth via httpOnly cookie) | jwt, user_id, role, expires_at |
| Server data | TanStack Query | Component tree / query cache | tasks[], projects[], capacity_logs[] |
| Realtime capacity | TanStack Query + Supabase Realtime | Global cache invalidation | capacity_logs delta events |
| Optimistic mutations | TanStack Query optimistic updates | Query cache with auto-rollback | task.assignee_id before server confirm |
| UI-only state | Zustand uiStore | Global | commandPaletteOpen, activeSidePanel, dragState |
| URL / filter state | Next.js searchParams | URL-persistent, shareable | `?status=in_progress&view=board` |

### 11.2 Realtime Heatmap — Correct Implementation

```
1. Initial load: GET /capacity/heatmaps?dept_id={id}&weeks=6
   → Reads from materialized view (pre-aggregated) → renders full heatmap

2. Subscribe to: 'capacity:dept:{dept_id}' Supabase channel

3. On task assignment anywhere:
   → Node.js RPC: UPDATE capacity_logs SET allocated_hours = allocated_hours + $delta
   → Supabase detects row change → broadcasts {user_id, week_start, new_pct}
   → React updates ONLY that employee's bar — no full re-render

4. On optimistic drag:
   → Local state updates source + target bars immediately
   → RPC confirms asynchronously
   → On conflict: rollback, show "Task was modified — Refreshing board"
```

O(1) writes and broadcasts per task change. Never O(n) re-aggregations on client actions.

### 11.3 Concurrent Capacity Write Safety

```sql
-- WRONG: last-write-wins data corruption under concurrent writes
UPDATE capacity_logs SET allocated_hours = $new_total WHERE user_id = $uid;

-- CORRECT: atomic increment survives concurrent writes
UPDATE capacity_logs
SET allocated_hours = allocated_hours + $delta,
    utilization_pct = (allocated_hours + $delta)::float /
                      (SELECT capacity_hours_per_week FROM users WHERE id = $uid)
WHERE user_id = $uid AND week_start = $week
RETURNING allocated_hours, utilization_pct;
```

For task reallocation, a PostgreSQL RPC with `pg_advisory_xact_lock(task_id::bigint)` ensures exactly-once execution per task per window.

### 11.4 Soft Delete Architecture (Corrected)

v1.0 used `is_deleted BOOLEAN`. v2.0 uses `deleted_at TIMESTAMPTZ`.

```sql
-- Correct: TIMESTAMPTZ soft delete
deleted_at TIMESTAMPTZ DEFAULT NULL;  -- NULL = active

-- Unique constraint that survives soft deletes
CREATE UNIQUE INDEX idx_projects_name_dept_active
  ON projects(name, department_id)
  WHERE deleted_at IS NULL;

-- RLS excludes soft-deleted rows
CREATE POLICY projects_select ON projects FOR SELECT USING (
  deleted_at IS NULL AND (auth.jwt()->>'role' IN ('admin','executive') OR owner_id = auth.uid())
);
```

Hard delete runs as a scheduled batch job 30 days after `deleted_at` is set, processing in batches of 500.

### 11.5 Event-Sourced Architecture — Phased Migration Strategy

v1.0 listed "Event-sourced architecture" as a Phase 4 add-on. You cannot retrofit event sourcing onto a state-mutation schema. The correct approach: **prepare the schema from Phase 1 without implementing it yet**.

Phase 1 preparation (zero runtime cost):
```sql
-- Add to tasks and projects in Phase 1
version_vector  JSONB DEFAULT '{}',    -- Lamport clock; populated but not acted upon
tombstone       BOOLEAN DEFAULT false, -- CRDT merge tombstone
event_sequence  BIGINT DEFAULT 0,      -- monotonic counter per entity
last_synced_at  TIMESTAMPTZ            -- last confirmed server sync
```

Phase 4: these columns become the foundation for the event stream. The schema migration adds an `entity_events` table. Tasks and projects become materialized views projected from the event stream. No data loss.

### 11.6 AI Context Compression — Token Cost Accuracy

Before any agent or summary call, raw data is compressed to a mathematical vector:

```javascript
// Compressed sprint context before LLM call
const sprintContext = {
  velocity_ratio:        current_velocity / rolling_3sprint_avg,     // float
  completion_pct:        completed_tasks / total_tasks,               // float
  overdue_pct:           overdue_tasks / total_tasks,                 // float
  critical_path_blocked: hasCriticalPathBlocker(tasks),               // bool
  team_max_utilization:  getMaxTeamUtilization(teamId, weekStart),    // float
  budget_burn_ratio:     consumed_amount / budget_amount,             // float
  days_ratio:            daysRemaining / sprintDuration,              // float
};
// NOT: raw JSON dumps of the entire sprint dataset
```

This keeps 90%+ of agent calls under 1,000 tokens, making cost estimates accurate.

---

## 12. Database Schema Reference

### Core Tables

```sql
-- DEPARTMENTS
CREATE TABLE departments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  head_user_id  UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- USERS
CREATE TABLE users (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id),
  email                   TEXT UNIQUE NOT NULL,
  full_name               TEXT NOT NULL,
  avatar_url              TEXT,
  role                    TEXT NOT NULL,               -- stored in app_metadata ONLY
  department_id           UUID REFERENCES departments(id),
  manager_id              UUID REFERENCES users(id),
  capacity_hours_per_week INTEGER DEFAULT 40,
  skill_tags              TEXT[],
  lifecycle_stage         TEXT DEFAULT 'ACTIVE',
  cost_per_hour           INTEGER DEFAULT 0,           -- micro-units ($1.00 = 1000000)
  contractor_flag         BOOLEAN DEFAULT false,
  timezone                TEXT DEFAULT 'UTC',
  deleted_at              TIMESTAMPTZ DEFAULT NULL,
  created_at              TIMESTAMPTZ DEFAULT now()
);

-- SESSIONS (single-session enforcement + persistent login)
CREATE TABLE sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token       TEXT NOT NULL UNIQUE,
  device_fingerprint  TEXT,
  ip_address          INET,
  user_agent          TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  last_active         TIMESTAMPTZ DEFAULT now(),
  is_active           BOOLEAN DEFAULT true
  -- INVARIANT: at most one is_active=true per user_id at all times
);

-- PROJECTS
CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  department_id   UUID REFERENCES departments(id),
  owner_id        UUID REFERENCES users(id),
  status          TEXT DEFAULT 'PLANNING',
  health_status   TEXT DEFAULT 'ON_TRACK',   -- auto-calculated
  health_reasons  TEXT[],                    -- signals that drove health status
  budget_hours    INTEGER DEFAULT 0,
  consumed_hours  INTEGER DEFAULT 0,
  budget_amount   INTEGER DEFAULT 0,         -- micro-units
  consumed_amount INTEGER DEFAULT 0,         -- micro-units
  portfolio_id    UUID,
  visibility_scope UUID[],                   -- pre-computed for RLS performance
  version_vector  JSONB DEFAULT '{}',        -- CRDT prep
  deleted_at      TIMESTAMPTZ DEFAULT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_projects_name_dept_active
  ON projects(name, department_id) WHERE deleted_at IS NULL;

-- TASKS
CREATE TABLE tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT,
  project_id       UUID REFERENCES projects(id),
  sprint_id        UUID REFERENCES sprints(id),
  assignee_id      UUID REFERENCES users(id),
  status           TEXT DEFAULT 'BACKLOG',
  priority         TEXT DEFAULT 'MEDIUM',
  estimated_hours  INTEGER DEFAULT 0,
  logged_hours     INTEGER DEFAULT 0,
  due_date         DATE,
  dependency_links JSONB DEFAULT '[]',       -- Phase 1; replaced by task_dependencies in Phase 2
  recurring_config JSONB,
  is_billable      BOOLEAN DEFAULT true,
  custom_fields    JSONB DEFAULT '{}',
  version_vector   JSONB DEFAULT '{}',       -- CRDT prep
  tombstone        BOOLEAN DEFAULT false,
  event_sequence   BIGINT DEFAULT 0,
  deleted_at       TIMESTAMPTZ DEFAULT NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- TASK_COLLABORATORS (join table — no UUID[] array)
CREATE TABLE task_collaborators (
  task_id   UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'co_assignee',
  added_by  UUID REFERENCES auth.users(id),
  added_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (task_id, user_id)
);

-- TASK_DEPENDENCIES (Phase 2: relational DAG)
CREATE TABLE task_dependencies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id           UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('blocks','depends_on','related_to')),
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (task_id, depends_on_id)
);

-- CAPACITY_LOGS (atomic increment only — never full overwrites)
CREATE TABLE capacity_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  week_start      DATE NOT NULL,
  allocated_hours INTEGER DEFAULT 0,   -- mutated via: allocated_hours = allocated_hours + $delta
  logged_hours    INTEGER DEFAULT 0,
  utilization_pct FLOAT DEFAULT 0,     -- recomputed on every write
  UNIQUE (user_id, week_start)
);

-- AUDIT_EVENTS (INSERT-only, tamper-proof)
CREATE TABLE audit_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      UUID REFERENCES auth.users(id),
  actor_role    TEXT,
  action_type   TEXT NOT NULL,
  entity_type   TEXT,
  entity_id     UUID,
  before_state  JSONB,
  after_state   JSONB,
  ip_address    INET,
  device_fp     TEXT,
  session_id    UUID,
  created_at    TIMESTAMPTZ DEFAULT now()
);
REVOKE UPDATE, DELETE ON audit_events FROM authenticated;

-- RISKS (first-class entity)
CREATE TABLE risks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  description         TEXT,
  category            TEXT NOT NULL,       -- security|vendor|operational|compliance|financial|people
  probability         TEXT NOT NULL,       -- high|medium|low
  impact              TEXT NOT NULL,       -- critical|high|medium|low
  severity            TEXT,                -- auto-computed: probability × impact matrix
  owner_id            UUID REFERENCES users(id),
  project_id          UUID REFERENCES projects(id),
  mitigation_plan     TEXT,
  mitigation_status   TEXT DEFAULT 'not_started',
  linked_decision_ids UUID[] DEFAULT '{}',
  status              TEXT DEFAULT 'open',
  deleted_at          TIMESTAMPTZ DEFAULT NULL,
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- DECISIONS (first-class entity)
CREATE TABLE decisions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT NOT NULL,
  description           TEXT,
  context               TEXT,
  options_considered    JSONB,             -- [{option, pros, cons}]
  chosen_option         TEXT,
  rationale             TEXT NOT NULL,
  expected_outcome      TEXT,
  actual_outcome        TEXT,              -- filled retrospectively
  outcome_recorded_at   TIMESTAMPTZ,
  confidence_level      TEXT,
  owner_id              UUID REFERENCES users(id),
  project_id            UUID REFERENCES projects(id),
  meeting_id            UUID,
  linked_risk_ids       UUID[] DEFAULT '{}',
  status                TEXT DEFAULT 'active',
  superseded_by         UUID REFERENCES decisions(id),
  deleted_at            TIMESTAMPTZ DEFAULT NULL,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- MEETINGS (first-class entity)
CREATE TABLE meetings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  meeting_type    TEXT,   -- standup|review|planning|retrospective|1:1|decision|escalation
  occurred_at     TIMESTAMPTZ NOT NULL,
  duration_mins   INTEGER,
  facilitator_id  UUID REFERENCES users(id),
  attendee_ids    UUID[] DEFAULT '{}',
  project_id      UUID REFERENCES projects(id),
  notes           TEXT,
  transcript_url  TEXT,
  summary         TEXT,   -- AI-generated and labeled as such
  decision_ids    UUID[] DEFAULT '{}',
  commitment_ids  UUID[] DEFAULT '{}',
  action_item_ids UUID[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- COMMITMENTS (first-class entity — promises, not tasks)
CREATE TABLE commitments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT NOT NULL,
  owner_id              UUID REFERENCES users(id),
  to_id                 UUID REFERENCES users(id),
  source_type           TEXT,  -- meeting|review|discussion|email|verbal
  source_id             UUID,
  due_date              DATE,
  status                TEXT DEFAULT 'open',  -- open|in_progress|fulfilled|overdue|withdrawn
  fulfillment_evidence  TEXT,
  linked_task_ids       UUID[] DEFAULT '{}',
  extracted_by          TEXT,  -- human|ai
  deleted_at            TIMESTAMPTZ DEFAULT NULL,
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- GOALS / OKRs
CREATE TABLE goals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  description         TEXT,
  owner_id            UUID REFERENCES users(id),
  department_id       UUID REFERENCES departments(id),
  target_date         DATE,
  progress            FLOAT DEFAULT 0,
  status              TEXT DEFAULT 'ACTIVE',
  parent_goal_id      UUID REFERENCES goals(id),
  linked_project_ids  UUID[] DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- KNOWLEDGE_DOCS
CREATE TABLE knowledge_docs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT NOT NULL,  -- sop|decision|lesson|expertise|policy|credential
  title           TEXT NOT NULL,
  content         TEXT,
  version         INTEGER DEFAULT 1,
  created_by      UUID REFERENCES users(id),
  owner_id        UUID REFERENCES users(id),
  reviewer_id     UUID REFERENCES users(id),
  review_due_date DATE,
  reviewed_at     TIMESTAMPTZ,
  linked_tasks    UUID[] DEFAULT '{}',
  linked_projects UUID[] DEFAULT '{}',
  vault_ref       TEXT,           -- Supabase Vault ID; never raw credential values
  tags            TEXT[],
  deleted_at      TIMESTAMPTZ DEFAULT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  type          TEXT NOT NULL,
  payload       JSONB NOT NULL,
  read          BOOLEAN DEFAULT false,
  entity_type   TEXT,
  entity_id     UUID,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- AI PROPOSALS (agents write here only)
CREATE TABLE proposals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type        TEXT NOT NULL,
  proposed_action   JSONB NOT NULL,
  validation_result JSONB,         -- pre-validation output stored with proposal
  confidence        FLOAT,
  entity_type       TEXT,
  entity_id         UUID,
  status            TEXT DEFAULT 'pending',
  reviewed_by       UUID REFERENCES users(id),
  reviewed_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  expires_at        TIMESTAMPTZ DEFAULT (now() + interval '48 hours'),
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (agent_type, entity_id, status) WHERE status = 'pending'
);

-- AGENT_MEMORY (rejection memory)
CREATE TABLE agent_memory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type      TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       UUID NOT NULL,
  memory_type     TEXT NOT NULL,   -- rejection|approval|context
  memory_payload  JSONB NOT NULL,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- DEAD_LETTER_JOBS
CREATE TABLE dead_letter_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type      TEXT NOT NULL,
  payload       JSONB NOT NULL,
  error_msg     TEXT,
  attempt_count INTEGER DEFAULT 0,
  first_failed  TIMESTAMPTZ DEFAULT now(),
  last_failed   TIMESTAMPTZ DEFAULT now(),
  resolved      BOOLEAN DEFAULT false,
  resolved_by   UUID REFERENCES users(id)
);

-- ENTITY_EMBEDDINGS (AI semantic search)
CREATE TABLE entity_embeddings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   TEXT NOT NULL,
  entity_id     UUID NOT NULL,
  embedding     vector(1536),
  content_hash  TEXT NOT NULL,     -- SHA-256; dedup prevents re-embedding unchanged content
  model         TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (entity_type, entity_id)
);
```

### Critical Indexes

```sql
-- USERS
CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_dept_role ON users(department_id, role) WHERE deleted_at IS NULL;

-- SESSIONS
CREATE UNIQUE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_user_active ON sessions(user_id) WHERE is_active = true;

-- TASKS
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_sprint ON tasks(sprint_id) WHERE sprint_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_tasks_fts ON tasks USING GIN(to_tsvector('english', title || ' ' || COALESCE(description,'')));

-- CAPACITY_LOGS
CREATE UNIQUE INDEX idx_cap_user_week ON capacity_logs(user_id, week_start);
CREATE INDEX idx_cap_dept_week ON capacity_logs(week_start, user_id);

-- AUDIT_EVENTS
CREATE INDEX idx_audit_actor_date ON audit_events(actor_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_events(entity_type, entity_id);

-- NOTIFICATIONS
CREATE INDEX idx_notif_user_unread ON notifications(user_id, read) WHERE read = false;

-- AI / ENTITIES
CREATE INDEX idx_embeddings_entity ON entity_embeddings(entity_type, entity_id);
CREATE INDEX idx_embeddings_ivfflat ON entity_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RISKS & DECISIONS
CREATE INDEX idx_risks_project ON risks(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_decisions_project ON decisions(project_id) WHERE deleted_at IS NULL;

-- COMMITMENTS
CREATE INDEX idx_commitments_owner ON commitments(owner_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_commitments_overdue ON commitments(due_date, status) WHERE status = 'open';

-- PROPOSALS
CREATE UNIQUE INDEX idx_proposals_pending ON proposals(agent_type, entity_id) WHERE status = 'pending';
```

---

## 13. API Endpoint Reference

All list endpoints use **cursor-based pagination exclusively** — offset pagination is prohibited.

### Authentication

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/login` | POST | None | Email + password; single-session enforcement; JWT + httpOnly cookie |
| `/auth/oauth/google` | POST | None | Google OAuth callback; same session enforcement applies |
| `/auth/forgot-password` | POST | None | Always returns 200 regardless of email existence (prevents enumeration) |
| `/auth/reset-password` | POST | Token | New password; invalidate ALL prior sessions; clear all refresh cookies |
| `/auth/refresh` | POST | Cookie | Silent JWT refresh via httpOnly cookie — no JWT required |
| `/auth/logout` | POST | JWT | Revoke session; clear refresh cookie |

### Core Operations

| Endpoint | Method | Min Role | Description |
|----------|--------|----------|-------------|
| `/users` | GET | Project Manager | Paginated employee directory (cursor-based) |
| `/users/:id` | GET | Team Lead | Employee profile with capacity, expertise, and skill data |
| `/users` | POST | Admin | Create user with role assignment |
| `/capacity/heatmaps` | GET | Project Manager | Department-scoped capacity data |
| `/tasks/reallocate` | POST | Project Manager | Atomic RPC reallocation with advisory lock |
| `/tasks/dependency-check` | POST | Team Lead | Server-side DAG cycle detection before saving edge |
| `/projects` | GET | Employee | Visible projects per RLS + visibility_scope |
| `/projects` | POST | Project Manager | Create from template or blank |
| `/analytics/executive` | GET | Executive | Org-wide health with explanatory signals |
| `/risks` | GET/POST/PATCH | Project Manager | Risk registry CRUD |
| `/decisions` | GET/POST/PATCH | Team Lead | Decision registry CRUD |
| `/meetings` | GET/POST | Employee | Meeting records with transcript linking |
| `/commitments` | GET/POST/PATCH | Employee | Commitment tracking CRUD |
| `/ai/search` | GET | Employee | Hybrid semantic search (vector + BM25) |
| `/ai/summarize` | POST | Project Manager | On-demand AI summary (sprint/project) |
| `/client-portal/:token` | GET | Client Viewer | Sandboxed portal |

---

## 14. Security Architecture

### 14.1 Authentication Flow

1. User submits email + password on the login screen
2. React sends `POST /auth/login` to Node.js — **NEVER directly to Supabase**
3. Node.js rate limits: max 10 attempts per IP per 15 minutes; returns 429 on breach
4. Node.js calls `supabase.auth.signInWithPassword()` via Admin SDK
5. On success: queries sessions table for any existing active session for this `user_id`
6. If found: invalidated immediately (`is_active=false`, Admin `signOut()` called)
7. New session row written: `{ user_id, session_token, device_fingerprint, ip_address, user_agent }`
8. JWT issued (RS256): `{ user_id, role, session_id, iat, exp: now+15min }`
9. **JWT stored in module-level memory variable ONLY — NEVER in localStorage, sessionStorage, or cookies**
10. httpOnly refresh cookie set: `{ maxAge: 7 days, sameSite: 'Strict', secure: true, path: '/auth/refresh' }`
11. On every page load / hard refresh: `silentRefresh()` → POST `/auth/refresh` → validates cookie → issues new 15-min JWT

### 14.2 Persistent Login ("Stay Signed In")

The httpOnly refresh cookie contains a session_id reference (opaque, not a JWT). On every page load:
```javascript
async function silentRefresh(): Promise<boolean> {
  const res = await fetch('/auth/refresh', {
    method: 'POST',
    credentials: 'include',  // sends the httpOnly cookie
  });
  if (!res.ok) return false;  // cookie expired or session revoked
  const { jwt } = await res.json();
  setJwtInMemory(jwt);
  return true;
}
```
User stays logged in automatically. Only re-authenticates on: explicit sign-out, admin force-logout, or password change.

### 14.3 RBAC Permission Matrix

| Permission | Admin | Exec | Dept Head | Proj Mgr | Team Lead | Employee | Client |
|-----------|-------|------|-----------|----------|-----------|----------|--------|
| View all projects | ✅ | ✅ | ✅ | ✅ | Own team | Own | ❌ |
| Create/delete projects | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View capacity heatmaps | ✅ | ✅ | ✅ | ✅ | Own team | ❌ | ❌ |
| Drag-and-drop reallocation | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View analytics/reports | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export reports (PDF/CSV) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View financial dashboards | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage user roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ❌ | Own dept | ❌ | ❌ | ❌ | ❌ |
| View/manage Risks | ✅ | ✅ | ✅ | ✅ | Own team | ❌ | ❌ |
| View/manage Decisions | ✅ | ✅ | ✅ | ✅ | ✅ | Read | ❌ |
| Force-revoke sessions | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Client portal only | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### 14.4 RLS

RLS is enabled on **every table**. CI `rls:check` script blocks any PR that introduces an unprotected table. `audit_events` has `REVOKE UPDATE, DELETE FROM authenticated` — physically immutable.

### 14.5 MFA & Session Lifecycle

- TOTP (Google Authenticator / Authy) — mandatory for Admin and Executive
- Email OTP — fallback
- Max 3 MFA failures → 15-minute lockout + email alert
- Recovery codes: 8 single-use backup codes as bcrypt hashes
- JWT expiry: 15 minutes (refreshed silently via cookie)
- Refresh cookie expiry: 7 days rolling
- Inactivity timeout: `last_active` older than 30 minutes → next refresh returns 401

---

## 15. AI Intelligence Layer

### 15.1 Embedding Pipeline

```
Entity created/updated → Node.js enqueues embedding job
         ↓
Railway embedding worker (polls every 30s, batches of 50):
  1. Fetch entity content (excluding PII and credential fields)
  2. Compress to ≤512 tokens
  3. SHA-256 content_hash dedup: skip if unchanged
  4. OpenAI text-embedding-3-small → vector[1536]
  5. UPSERT entity_embeddings
  On failure: retry 5× exponential backoff → dead_letter_jobs
  Fallback: tsvector full-text remains current throughout
```

PII and vault values are NEVER embedded.

### 15.2 Hybrid Search

```sql
SELECT entity_type, entity_id,
  (0.7 * (1 - (embedding <=> query_embedding)))
  + (0.3 * ts_rank(search_vector, plainto_tsquery(query_text)))
  AS score
FROM entity_embeddings
WHERE rls_scope_check(entity_type, entity_id, $user_role, $dept_id)
ORDER BY score DESC LIMIT 20;
```
When AI unavailable: falls back to full-text search only, labeled 'Basic search — AI unavailable'.

### 15.3 Agent Boundary Contracts

| Agent | Can Read | Writes To | Human Approval Required |
|-------|---------|-----------|------------------------|
| Burnout Agent | capacity_logs, tasks, time_entries | proposals only | Any reallocation, any manager notification |
| Allocation Agent | tasks (unassigned), skill_tags, capacity_logs | proposals only | Any task assignment, any capacity shift |
| Risk Agent | tasks.status, dependency_links, health_status, sprints | proposals only | Any deadline shift, any escalation |
| Delivery Agent | velocity, task hours, project budget | proposals only | Any scope change, any timeline adjustment |

**Conflict resolution:** Burnout/safety outranks optimization. Hard constraints outrank soft recommendations. Most recent human override outranks agent proposal.

### 15.4 AI Cost Governance

| Operation | Model | Est. Cost | Governance |
|-----------|-------|----------|------------|
| Entity embedding | text-embedding-3-small | ~$0.0001/entity | content_hash dedup |
| Semantic search | text-embedding-3-small | ~$0.001/query | 30 queries/user/min; 60s cache |
| Sprint summary | claude-sonnet | ~$0.01/sprint | On-demand only, not auto-generated |
| Meeting extraction | claude-sonnet | ~$0.05–0.20/transcript | Explicit confirmation + cost shown |
| Risk prediction | claude-sonnet | ~$0.003/project/day | Nightly; compressed context |
| **Daily org budget** | — | **$3–15/org** | Soft limit 80% → warning; Hard limit 100% → throttle non-critical AI |

### 15.5 AI Safety Principles

- All AI outputs labeled 'AI-Generated — verify before sharing'
- Outputs below 0.65 confidence: show 'Insufficient data' instead
- All summaries include source attribution (linked entities)
- User-controlled text is never injected as AI instructions — only as data context
- Rejection memory: agents do not re-propose rejected actions for same entity for 30 days
- Pre-surface validation: every recommendation validated against hard DB constraints before display

---

## 16. Product Roadmap — 4 Phases + Realistic MVP

### Phase 0 — MVP (Weeks 1–10)

**v1.0 had a 6–8 week target. 10 weeks is the realistic, production-quality MVP timeline.** The drag-and-drop heatmap is the most complex interaction; MVP ships the heatmap as a read-only daily aggregate (still differentiating, dramatically simpler to build correctly).

| Feature | Implementation Note |
|---------|-------------------|
| Auth (email + Google OAuth + persistent login) | httpOnly cookie + silentRefresh from day one |
| Employee directory + profiles | Static profiles; no real-time presence |
| Project creation + management | Full CRUD; health engine with explanation |
| Kanban board (multi-view task management) | Full multi-view; no real-time collab yet |
| Capacity heatmap **(read-only, daily aggregate)** | Materialized view, 5-min refresh; impresses buyers |
| Basic role system (Admin, PM, Employee, Client) | Full RLS from day one |
| Notification center | In-app inbox |
| Time tracking | Start/stop timer + manual entry |
| Risks and Decisions as first-class entities | Creatable and linkable immediately |
| Immutable audit log | INSERT-only from day one |

### Phase 1 — Foundation (Months 3–6)

- Live Realtime capacity heatmaps via department-scoped channels
- **Drag-and-drop reallocation** with atomic RPC + optimistic UI and rollback
- Hard-stop capacity guardrail (override modal + audit log)
- Dependency architecture: Blocked By, Depends On — with DAG cycle detection
- Sprint management: creation, velocity tracking, retrospective logging
- PTO and leave integration — scheduling hard blocks
- Full MFA for Admin/Executive
- Knowledge Hub: SOPs, Decision registry, credential vault
- Meetings as first-class entities with action item extraction

### Phase 2 — Intelligence (Months 7–9)

- Trigger-based automation with worker thread isolation and cycle detection
- Threaded discussions; approval workflows with escalation chains
- Team health scoring and burnout detection with signal attribution
- OKR Engine: goals, key results, progress tracking
- Commitment Tracking System
- Redis: session cache, rate limits, distributed capacity lock
- Organizational friction analytics
- Work Quality Intelligence + Execution Predictability Index
- Skill matrix, contractor management, SOW compliance

### Phase 3 — Enterprise (Months 10–15)

- AI hybrid semantic search
- AI project summaries and executive briefings with source attribution
- AI meeting transcript extraction with pre-surface validation
- Client access portal
- SSO/SAML + SCIM
- Financial forecasting dashboards
- Data import: Jira/Asana/Monday.com connectors
- Strategic Initiative Management + Strategy Drift Detection
- Leadership Operating System + Manager OS
- Capability Maturity Framework + Bus Factor Dashboard
- Organizational Memory Timeline + Institutional Learning System

### Phase 4 — Platform (Months 16–24)

- Autonomous multi-agent orchestration with conflict resolution and rejection memory
- Organizational Digital Twin and workforce simulation
- Organizational Network Analysis (ONA) — informal influence mapping
- Event-sourced architecture with time-machine activity replay
- No-code visual workflow builder
- Internal app marketplace and plugin architecture
- Offline-first CRDT sync
- Public REST + GraphQL API with webhooks
- All Wave 4 Phase D additions

---

## 17. Non-Functional Requirements

### 17.1 Performance

| Metric | Target | How Measured |
|--------|--------|-------------|
| Page load (TTI) | < 2.5s | Vercel Analytics |
| API response (p95) | < 300ms | OpenTelemetry traces |
| Capacity heatmap Realtime update | < 500ms end-to-end | Per-event measurement |
| Drag-and-drop optimistic UI | < 50ms perceived; server confirm < 800ms | Session action analytics |
| AI semantic search | < 3 seconds | Query duration logs |
| Executive report generation | < 30 seconds p95 | Report engine latency |
| RLS overhead vs. unprotected | < 20% latency increase | Benchmarked Phase 1 |

### 17.2 Scalability

- 10,000+ concurrent users per organization without degradation
- Realtime channels are department-scoped — not global broadcasts (prevents WAL broadcast storms)
- Background jobs isolated in Railway worker — never block Vercel API routes
- Embedding pipeline async — never blocks user-facing operations

### 17.3 Reliability

- Target SLA: 99.9% uptime
- RPO: < 1 hour | RTO: < 4 hours
- Automated hourly incremental + daily full DB snapshots
- Graceful degradation: AI → full-text fallback; Realtime → 30s polling; Redis → in-memory

### 17.4 Security

- Zero unprotected tables — enforced by CI `rls:check`
- All secrets in Supabase Vault — never in `.env` committed to source control
- Penetration testing: mandatory before Phase 3
- OWASP Top 10 mitigations on every API route
- No user-controlled content injected as AI instructions (prompt injection prevention)

### 17.5 Accessibility

- WCAG 2.1 AA compliance for all core management workflows
- Keyboard-first navigation
- Responsive from 1280px desktop to tablet breakpoints

---

## 18. Success Metrics & KPIs (Precisely Defined)

All KPIs have exact mathematical definitions for deterministic backend queries.

| KPI | Precise Definition | Baseline | Target (Q1) |
|-----|--------------------|----------|------------|
| **Time to staff** | Seconds from session open to `POST /tasks/reallocate` confirmation | >3600s | < 120s |
| **Over-allocation rate** | `COUNT(users WHERE utilization_pct >= 1.0) / COUNT(active_users)` over rolling 7-day window | ~35% | < 10% |
| **Over-allocation definition** | `utilization_pct = SUM(estimated_hours for tasks due this week) / capacity_hours_per_week >= 1.0` | — | Consistent throughout |
| **PM DAU** | Unique `user_id` with role `project_manager` creating a session in UTC calendar day | N/A | > 90% of active PMs |
| **Task reassignment error rate** | `COUNT(capacity_override with no reason) / COUNT(reallocations)` | High | < 1% |
| **New org onboarding** | Time from first admin login to first non-admin employee creating a task | Days | < 2 hours |
| **AI search relevance** | Result click-through rate (clicked / shown) | N/A | > 85% |
| **Session enforcement** | `COUNT(is_active=true rows) / COUNT(active users) = 1.0` | N/A | 100% always |
| **Employee platform NPS** | Monthly pulse: 'How satisfied are you with DIZRUPT (0–10)?' NPS = % Promoters − % Detractors | N/A | > 40 |
| **Manager time saved** | Self-reported monthly survey: hours saved per week by using DIZRUPT | 0 | > 5 hours/week |
| **Commitment fulfillment rate** | `fulfilled_on_time / total_due_in_period` | N/A (post Phase 2) | > 80% org-wide |
| **Burnout flag rate** | `COUNT(burnout_flagged_users) / COUNT(active_users)` | Unmeasured | < 5% |

---

## 19. Out of Scope (Permanent)

| Item | Reason |
|------|--------|
| Payroll processing, benefits administration | Jurisdiction complexity; dedicated systems required |
| Video conferencing | Infrastructure + network effects unwinnable |
| Full accounting / ERP | Different product category |
| Recruiting / ATS | DIZRUPT begins at onboarding |
| Customer CRM | Different product category |
| Dedicated LMS | DIZRUPT feeds L&D demand; does not deliver full courses |
| Innovation Management | Idea-to-experiment pipeline is a separate product category |
| Consumer-facing product management | DIZRUPT manages internal operations, not external product roadmaps |

---

## 20. Pitch Summary

### For a CEO / CTO (30 Seconds)

"DIZRUPT is an AI-powered operations platform that gives your leadership team real-time visibility into who is working on what, whether they're overloaded, and whether your projects will actually hit their deadlines. Unlike Jira which is for engineers, or Asana which is for teams, DIZRUPT is built for *managers* — the people who need to make staffing decisions, catch risks early, and understand organizational health at a glance. It replaces 4–5 disconnected tools and gives you an AI that explains *why* something is at risk, not just that it is."

### For a New Employee (30 Seconds)

"DIZRUPT is where all your work lives. Your manager assigns you tasks here. You can see exactly what you're working on, when things are due, and how much time you've spent. You log time here, see your team's projects, and find any company document or decision record. It's like Notion, Jira, and your calendar had a beautiful, fast, AI-powered child — and it's designed to feel easy from your very first day."

### For an Investor (60 Seconds)

"Every company between 50 and 5,000 employees has the same problem: their people, projects, and organizational knowledge live in five different tools that don't talk to each other. The Resource Manager runs the company from a Google Sheet. The CEO has no idea if the team is overloaded until someone burns out. And when a key employee leaves, the institutional knowledge walks out the door with them.

DIZRUPT solves this with a single platform that models the organization as a graph — people, teams, projects, decisions, risks, capabilities, and systems — and surfaces AI-powered intelligence about what's happening, why it's happening, and what should happen next.

Our entry wedge is the capacity heatmap: every Resource Manager immediately understands the value when they see their entire team's workload on one screen and can drag a task from an overloaded employee to an available one. That converts. The organizational intelligence, strategic layer, and decision memory are why they stay."

### The One-Line Pitch

> **"DIZRUPT is the operating system for your organization — the single platform where workforce capacity, project execution, organizational memory, and strategic intelligence connect."**

---

---

## 21. Generic Relationship Layer — Graph-Native Architecture

This section addresses the most structurally important remaining weakness: **the implementation was graph-inspired but not graph-native**. UUID arrays like `linked_risk_ids UUID[]` are relational storage with graph terminology. This section replaces all such arrays with a first-class relationship engine.

### 21.1 The Problem With UUID Arrays

```sql
-- v2.0 ANTI-PATTERN: relational storage pretending to be a graph
linked_risk_ids     UUID[] DEFAULT '{}'
linked_decision_ids UUID[] DEFAULT '{}'
linked_project_ids  UUID[] DEFAULT '{}'
```

Problems:
- No edge metadata (why are these linked? when? by whom? with what confidence?)
- No bidirectional traversal without application-layer logic
- No relationship lifecycle (can a link be deprecated? superseded? strength-scored?)
- No graph queries without expensive array unnesting
- Cannot model typed relationships (THREATENS vs. DEPENDS_ON vs. CAUSES are different)

### 21.2 The entity_relationships Table

```sql
-- ENTITY_RELATIONSHIPS (the generic graph edge table)
CREATE TABLE entity_relationships (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source node
  source_id         UUID NOT NULL,
  source_type       TEXT NOT NULL,   -- employee|team|project|task|capability|system|
                                     -- decision|risk|process|vendor|meeting|
                                     -- commitment|expertise|knowledge|goal|
                                     -- customer|service|revenue_stream

  -- Edge
  relationship_type TEXT NOT NULL,   -- see 21.3 for canonical type registry
  
  -- Target node
  target_id         UUID NOT NULL,
  target_type       TEXT NOT NULL,   -- same domain as source_type
  
  -- Edge metadata
  strength          FLOAT DEFAULT 1.0,   -- 0.0–1.0: weak → strong relationship
  confidence        FLOAT DEFAULT 1.0,   -- 0.0–1.0: derived vs. asserted
  evidence_type     TEXT,                -- observed|declared|inferred|ai_derived
  evidence_ref      JSONB,               -- { source: 'audit_event', id: uuid }
  
  -- Provenance
  created_by        UUID REFERENCES users(id),
  created_by_agent  TEXT,                -- agent_type if AI-derived
  valid_from        TIMESTAMPTZ DEFAULT now(),
  valid_until       TIMESTAMPTZ,         -- NULL = active; set to deprecate
  
  -- Index for traversal
  created_at        TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate active edges of the same type
  UNIQUE (source_id, source_type, target_id, target_type, relationship_type)
    DEFERRABLE INITIALLY DEFERRED
);

-- Bidirectional traversal indexes
CREATE INDEX idx_rel_source ON entity_relationships(source_id, source_type, relationship_type)
  WHERE valid_until IS NULL;
CREATE INDEX idx_rel_target ON entity_relationships(target_id, target_type, relationship_type)
  WHERE valid_until IS NULL;
CREATE INDEX idx_rel_type ON entity_relationships(relationship_type)
  WHERE valid_until IS NULL;
```

### 21.3 Canonical Relationship Type Registry

All relationship types must be drawn from this registry. Custom types are not permitted without a schema migration.

| Relationship Type | Source → Target | Description |
|------------------|----------------|-------------|
| `owns` | Employee → System | Employee is the operational owner |
| `belongs_to` | Employee → Team | Employment/membership |
| `reports_to` | Employee → Employee | Formal reporting line |
| `has_expertise_in` | Employee → Capability | Deep domain knowledge |
| `assigned_to` | Employee → Task | Task assignment |
| `made` | Employee → Decision | Decision author |
| `owns_risk` | Employee → Risk | Risk owner |
| `made_commitment` | Employee → Commitment | Commitment author |
| `delivers` | Team → Capability | Team's accountable capability |
| `executes` | Team → Project | Team delivers project |
| `produces` | Project → System | Project creates/maintains this system |
| `linked_to` | Project → Goal | Project contributes to goal |
| `exposes` | Project → Risk | Project creates this risk |
| `depends_on` | System → System | System-level dependency |
| `depends_on` | Project → Project | Project-level dependency |
| `documented_by` | System → Knowledge | Knowledge describes system |
| `implemented_by` | Service → System | Service is backed by system |
| `delivers_value_to` | Service → Customer | Service directly serves customer |
| `threatened_by` | Capability → Risk | Risk threatens this capability |
| `enabled_by` | Capability → Team | Capability delivered by team |
| `supported_by` | Capability → Vendor | Vendor supplies capability component |
| `mitigates` | Decision → Risk | Decision reduces risk |
| `made_in` | Decision → Meeting | Decision was made in this meeting |
| `causes` | Risk → Risk | One risk triggers another |
| `causes` | Event → Risk | Observed event creates risk |
| `governs` | Process → Workflow | Process defines how work flows |
| `produces` | Meeting → Commitment | Meeting generates commitment |
| `generates` | Meeting → Decision | Meeting formalizes a decision |
| `funds` | Revenue → Project | Revenue stream funds project work |
| `serves` | Project → Customer | Project ultimately serves this customer |
| `at_risk` | Customer → Risk | Customer relationship is a risk indicator |
| `supersedes` | Decision → Decision | New decision replaces old |
| `blocks` | Task → Task | Task dependency |

### 21.4 Graph Traversal Strategy — Solving the Recursive CTE Bottleneck

**The Gemini-identified problem:** Deep graph traversal via PostgreSQL recursive CTEs melts CPU at enterprise scale. A query like "which projects are at risk if Vendor X disappears?" requires traversing Vendor → Capability → System → Project — multiple hops.

**Three-layer strategy:**

**Layer 1 — Direct traversal (1-hop, <5ms):** Use `entity_relationships` directly for single-hop queries. All dashboards and real-time UI operate at this layer.

```sql
-- All risks threatening a specific capability (1-hop)
SELECT target_id, target_type, strength
FROM entity_relationships
WHERE source_id = $capability_id
  AND source_type = 'capability'
  AND relationship_type = 'threatened_by'
  AND valid_until IS NULL;
```

**Layer 2 — Materialized path table (2–4 hops, <50ms):** Pre-computed paths for common traversal patterns, refreshed by trigger on `entity_relationships` inserts.

```sql
-- ENTITY_PATHS (materialized traversal cache)
CREATE TABLE entity_paths (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  root_id       UUID NOT NULL,
  root_type     TEXT NOT NULL,
  leaf_id       UUID NOT NULL,
  leaf_type     TEXT NOT NULL,
  path_hops     INTEGER NOT NULL,       -- depth of traversal
  path_array    UUID[] NOT NULL,        -- ordered node IDs along path
  path_types    TEXT[] NOT NULL,        -- relationship types along path
  computed_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_paths_root ON entity_paths(root_id, root_type);
CREATE INDEX idx_paths_leaf ON entity_paths(leaf_id, leaf_type);
```

This table is populated by the Railway worker on a 5-minute schedule and on-demand when an entity_relationships row is inserted. AI agents read from this table instead of running live CTEs.

**Layer 3 — Graph database read replica (Phase 4, 5+ hops):** When traversal depth exceeds 4 hops (Organizational Network Analysis, Digital Twin simulations), a Neo4j or Apache AGE read replica syncs from `entity_relationships` and handles deep traversal queries. The PostgreSQL instance remains the system of record; the graph DB is a read-optimized projection.

### 21.5 Migration — Removing UUID Arrays

v2.0 schema columns that are replaced by `entity_relationships`:

| Table | Column Replaced | Replacement Query |
|-------|----------------|-------------------|
| `decisions` | `linked_risk_ids UUID[]` | `entity_relationships WHERE source_type='decision' AND relationship_type='mitigates'` |
| `decisions` | `linked_knowledge_ids UUID[]` | `entity_relationships WHERE source_type='decision' AND relationship_type='documented_by'` |
| `risks` | `linked_decision_ids UUID[]` | `entity_relationships WHERE source_type='decision' AND relationship_type='mitigates' AND target_id=$risk_id` |
| `goals` | `linked_project_ids UUID[]` | `entity_relationships WHERE source_type='project' AND relationship_type='linked_to' AND target_id=$goal_id` |
| `meetings` | `decision_ids UUID[]` | `entity_relationships WHERE relationship_type='generates' AND source_id=$meeting_id` |
| `meetings` | `commitment_ids UUID[]` | `entity_relationships WHERE relationship_type='produces' AND source_id=$meeting_id` |
| `commitments` | `linked_task_ids UUID[]` | `entity_relationships WHERE source_type='task' AND target_id=$commitment_id` |

All UUID array columns are deprecated in Phase 1 and removed in Phase 2. A migration script generates `entity_relationships` rows from existing array data before column removal.

---

## 22. Customer, Revenue & Service Entities

These three entities close the gap identified in both reviews: DIZRUPT models work and organizations but not the **business reason work exists**.

### 22.1 Customer Entity

Customer is NOT a CRM. It is a lightweight entity that answers: "Which customers depend on this project / capability / system?" — the minimum needed for organizational risk awareness.

```sql
CREATE TABLE customers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  tier              TEXT,               -- strategic|enterprise|standard|trial
  health_status     TEXT DEFAULT 'healthy',  -- healthy|at_risk|churning|churned
  health_reasons    TEXT[],             -- signals that drove health status
  owner_id          UUID REFERENCES users(id),  -- internal account owner
  arr_micro_units   INTEGER DEFAULT 0,  -- annual recurring revenue (micro-units)
  contract_end_date DATE,
  notes             TEXT,
  deleted_at        TIMESTAMPTZ DEFAULT NULL,
  created_at        TIMESTAMPTZ DEFAULT now()
);
```

**How Customer connects to the graph:**
- `Project SERVES Customer` via `entity_relationships (relationship_type='serves')`
- `Capability DELIVERS_VALUE_TO Customer` — which capabilities are customer-critical?
- `Risk AT_RISK Customer` — which customers are exposed to which risks?
- Customer health degrades automatically when: linked projects are Critical, linked capabilities have bus factor risk, or linked vendors have renewal gaps

**What Customer enables:**
- "Which active risks expose our top 3 customers?" — answerable in one graph query
- "Which capabilities are blocking delivery to Enterprise tier customers?" — cross-entity intelligence
- Customer health roll-up on executive dashboard without CRM sprawl

### 22.2 Revenue Entity (Revenue Stream)

Revenue is the business-level anchor that ties organizational work to financial outcomes. Without it, DIZRUPT models cost but not value.

```sql
CREATE TABLE revenue_streams (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  type                TEXT NOT NULL,   -- recurring|project|service|license|usage
  customer_id         UUID REFERENCES customers(id),
  amount_micro_units  INTEGER DEFAULT 0,  -- monthly value in micro-units
  currency            TEXT DEFAULT 'USD',
  status              TEXT DEFAULT 'active',  -- active|at_risk|churned|pipeline
  probability         FLOAT DEFAULT 1.0,      -- 0.0–1.0 for pipeline items
  linked_project_ids  UUID[] DEFAULT '{}',    -- kept here for direct FK; relationships table for traversal
  owner_id            UUID REFERENCES users(id),
  start_date          DATE,
  end_date            DATE,
  deleted_at          TIMESTAMPTZ DEFAULT NULL,
  created_at          TIMESTAMPTZ DEFAULT now()
);
```

**Revenue intelligence this enables:**
- **Revenue at Risk:** SUM(revenue_streams.amount WHERE linked project health = 'Critical')
- **Team ROI:** (revenue_streams contributed) / (fully-loaded team cost) — now calculable
- **Strategy alignment check:** % of revenue covered by work linked to active goals
- **Kill switch analytics:** projects with no revenue link and poor health are kill candidates

### 22.3 Service Entity

A Service sits between a System and a Customer. Systems are internal infrastructure. Customers consume Services. The Service entity closes the gap between "we built the Payments System" and "customers pay us because Payments Service works."

```sql
CREATE TABLE services (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  description       TEXT,
  service_type      TEXT,             -- api|web|internal|data|infrastructure
  status            TEXT DEFAULT 'operational',
                                       -- operational|degraded|incident|deprecated
  owner_id          UUID REFERENCES users(id),
  slo_target        FLOAT DEFAULT 0.999,  -- target uptime ratio
  slo_current       FLOAT,               -- measured current uptime
  runbook_url       TEXT,
  on_call_user_id   UUID REFERENCES users(id),
  deleted_at        TIMESTAMPTZ DEFAULT NULL,
  created_at        TIMESTAMPTZ DEFAULT now()
);
```

**Service relationships:**
- `Service IMPLEMENTED_BY System` (Service is the public contract; System is the implementation)
- `Service DELIVERS_VALUE_TO Customer`
- `Capability SUPPORTED_BY Service`
- Service SLO degradation triggers alerts to the capability owner

**The full value chain is now traceable:**
```
Goal → Project → Capability → Service → Customer → Revenue
```
Every unit of organizational work can be traced forward to customer value and backward to strategic intent.

---

## 23. Causal Intelligence Architecture

Both reviews identified that AI explanations are currently **generated text** — not stored relationships. When the AI says "Risk elevated because of vendor delay," that causal chain should be a first-class entity, not an ephemeral LLM output.

### 23.1 The Problem

Current v2.0 state:
- AI generates explanations on-demand from current data
- If the data changes, the explanation changes unpredictably
- No audit of why a decision was made based on a specific causal signal
- No tracking of whether a predicted cause actually caused the stated effect

### 23.2 causal_signals Table

```sql
CREATE TABLE causal_signals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What happened
  effect_entity_id   UUID NOT NULL,
  effect_entity_type TEXT NOT NULL,     -- risk|project|capability|employee
  effect_field       TEXT NOT NULL,     -- health_status|burnout_flag|utilization_pct
  effect_value       TEXT NOT NULL,     -- 'CRITICAL'|'true'|'1.12'
  
  -- Why it happened
  cause_type         TEXT NOT NULL,     -- entity_state|threshold_breach|
                                        -- velocity_drop|dependency_block|
                                        -- vendor_event|ai_inferred
  cause_entity_id    UUID,
  cause_entity_type  TEXT,
  cause_description  TEXT NOT NULL,     -- human-readable cause statement
  cause_evidence     JSONB,             -- { query_result: {...}, threshold: 0.8, actual: 1.12 }
  
  -- Confidence
  confidence         FLOAT NOT NULL,    -- 0.0–1.0
  derivation         TEXT NOT NULL,     -- rule_based|statistical|ai_inferred
  
  -- Lifecycle
  observed_at        TIMESTAMPTZ DEFAULT now(),
  resolved_at        TIMESTAMPTZ,       -- when the causal condition cleared
  validated_by       UUID REFERENCES users(id),  -- human confirmation
  validation_status  TEXT DEFAULT 'unvalidated',  -- unvalidated|confirmed|rejected
  
  created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_causal_effect ON causal_signals(effect_entity_id, effect_entity_type);
CREATE INDEX idx_causal_cause ON causal_signals(cause_entity_id, cause_entity_type)
  WHERE cause_entity_id IS NOT NULL;
CREATE INDEX idx_causal_unresolved ON causal_signals(effect_entity_id)
  WHERE resolved_at IS NULL;
```

### 23.3 How Causal Signals Are Created

**Rule-based derivation (highest confidence, 0.85–1.0):** Deterministic database queries create causal_signals automatically when thresholds are crossed:

```sql
-- Example: trigger when a project's health degrades to CRITICAL
CREATE OR REPLACE FUNCTION record_causal_signals()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.health_status = 'CRITICAL' AND OLD.health_status != 'CRITICAL' THEN
    -- Record each contributing cause
    INSERT INTO causal_signals
      (effect_entity_id, effect_entity_type, effect_field, effect_value,
       cause_type, cause_description, cause_evidence, confidence, derivation)
    VALUES
      -- Overdue tasks cause
      (NEW.id, 'project', 'health_status', 'CRITICAL',
       'threshold_breach',
       format('%s tasks overdue by >5 days',
         (SELECT COUNT(*) FROM tasks
          WHERE project_id = NEW.id AND due_date < now() AND status != 'COMPLETED')),
       jsonb_build_object('overdue_count',
         (SELECT COUNT(*) FROM tasks
          WHERE project_id = NEW.id AND due_date < now() AND status != 'COMPLETED')),
       0.95, 'rule_based');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Statistical derivation (medium confidence, 0.65–0.85):** Railway worker runs nightly correlation analysis — when metric X drops, does outcome Y follow? Patterns with sufficient sample size become causal_signal templates.

**AI-inferred derivation (lower confidence, 0.5–0.75):** LLM analysis of free-text fields (meeting notes, task descriptions) flags potential causal patterns for human review. These are marked `derivation='ai_inferred'` and `validation_status='unvalidated'` until a human confirms.

### 23.4 How AI Uses Stored Causality

Instead of generating fresh explanations, agents read from `causal_signals`:

```javascript
// BEFORE: AI generates explanation from raw data (expensive, non-deterministic)
const prompt = `Explain why Project ${id} is Critical. Data: ${JSON.stringify(rawProjectData)}`;

// AFTER: Read stored causal signals (cheap, deterministic, auditable)
const causes = await db.query(`
  SELECT cause_description, confidence, derivation
  FROM causal_signals
  WHERE effect_entity_id = $1 AND resolved_at IS NULL
  ORDER BY confidence DESC LIMIT 5
`, [projectId]);

const explanation = causes.map(c =>
  `${c.cause_description} (${Math.round(c.confidence * 100)}% confidence)`
).join(' · ');
// Output: "7 tasks overdue >5 days (95%) · QA team at 112% utilization (92%) · vendor payment delay (78%)"
```

This means explanations are: instantaneous (no LLM call), auditable (logged in audit_events), and persistent (survive data changes).

---

## 24. Multi-Agent Negotiation Protocol

This section addresses the Gemini-identified flaw: when agents write conflicting proposals to the `proposals` table, the human manager gets spammed with contradictions. Agents need a **shared negotiation layer** before surfacing anything to humans.

### 24.1 The Deadlock Scenario

```
Delivery Agent: "Project X will fail. Move 10 hours from Sarah to Project X."
Burnout Agent:  "Sarah is at risk. Do not add hours to Sarah."
Result (v2.0):  Two conflicting proposals appear in manager's inbox.
```

This is worse than no AI. It creates cognitive load instead of reducing it.

### 24.2 Agent Negotiation Architecture

Agents do not write directly to `proposals`. They write to an intermediate `agent_proposals_staging` table. A **Negotiation Coordinator** process runs before any proposal is promoted to the human-facing `proposals` table.

```sql
-- AGENT_PROPOSALS_STAGING (agents write here first)
CREATE TABLE agent_proposals_staging (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type        TEXT NOT NULL,
  proposed_action   JSONB NOT NULL,
  confidence        FLOAT NOT NULL,
  priority          INTEGER NOT NULL,  -- agent-assigned urgency 1–10
  entity_type       TEXT NOT NULL,
  entity_id         UUID NOT NULL,
  conflict_scope    TEXT[],            -- entity IDs this proposal touches
  created_at        TIMESTAMPTZ DEFAULT now(),
  negotiation_round INTEGER DEFAULT 0,
  status            TEXT DEFAULT 'staged'  -- staged|negotiating|promoted|superseded|withdrawn
);
```

### 24.3 Negotiation Protocol — Four Steps

**Step 1 — Conflict Detection:** The Coordinator scans `agent_proposals_staging` every 60 seconds for proposals that share `conflict_scope` entities. Proposals touching the same employee, project, or task are flagged as a conflict cluster.

**Step 2 — Priority Matrix Resolution:** The Coordinator applies the resolution hierarchy deterministically:

```javascript
const PRIORITY_HIERARCHY = {
  burnout_safety: 100,     // Burnout Agent signals always win
  hard_constraint: 90,     // PTO blocks, capacity hard caps
  legal_compliance: 85,    // SOW caps for contractors
  delivery_critical: 70,   // Delivery Agent on critical path
  allocation_optimize: 50, // Allocation Agent efficiency suggestions
  risk_advisory: 40,       // Risk Agent non-critical flags
};

function resolveConflictCluster(proposals) {
  const sorted = proposals.sort((a, b) =>
    PRIORITY_HIERARCHY[b.agent_type] - PRIORITY_HIERARCHY[a.agent_type]
  );
  const winner = sorted[0];
  const losers = sorted.slice(1);
  return { winner, losers, compromise: tryCompromise(winner, losers) };
}
```

**Step 3 — Compromise Generation:** If a compromise is mathematically possible (split the delta, extend the deadline, pull from a lower-priority task), the Coordinator generates a synthesized proposal that satisfies the highest-priority constraint while partially addressing secondary ones:

```javascript
// Delivery Agent wants +10h on Sarah. Burnout Agent blocks Sarah.
// Compromise: +5h Sarah (half delta) + seek alternative source for remaining 5h
function tryCompromise(winner, losers) {
  if (winner.agent_type === 'delivery' && losers[0].agent_type === 'burnout') {
    const maxSafeHours = getMaxSafeHoursWithoutBurnoutFlag(winner.entity_id);
    const shortfall = winner.proposed_action.delta_hours - maxSafeHours;
    if (shortfall > 0) {
      const alternative = findAlternativeCapacity(
        winner.proposed_action.project_id, shortfall
      );
      return {
        type: 'compromise',
        actions: [
          { ...winner.proposed_action, delta_hours: maxSafeHours },
          { type: 'find_alternative', shortfall_hours: shortfall, alternative }
        ],
        explanation: `Partial reallocation: ${maxSafeHours}h from Sarah (within safe threshold) + ${shortfall}h sourced from ${alternative?.name || 'open for manager decision'}`
      };
    }
  }
  return null; // No compromise possible; escalate to manager with both options
}
```

**Step 4 — Human Escalation (only unresolvable conflicts):** If the Coordinator cannot generate a compromise, it promotes ONE synthesized proposal to the `proposals` table with `conflict_type: 'unresolvable'` that presents both options and recommends a default. The human manager sees one card, not two conflicting ones.

### 24.4 Agent Memory Prevents Re-Convergence

After a proposal is resolved (human approves, rejects, or the Coordinator auto-resolves), the outcome is written to `agent_memory`. All subsequent agent evaluations check memory before re-proposing:

```javascript
const recentMemory = await getAgentMemory(agentType, entityId, '30 days');
if (recentMemory.some(m => m.memory_type === 'rejection' && isSimilarProposal(m, proposal))) {
  // Do not re-propose. Log suppression for observability.
  return null;
}
```

---

## 25. CRDT Conflict Resolution — Exact Math

This section closes the Gemini-identified gap: the v2.0 schema has `version_vector` and `tombstone` columns but no definition of the actual merge algorithm.

### 25.1 Why CRDT Matters

In Phase 4, DIZRUPT supports offline-first sync. Two managers can modify the same entity while disconnected. When they reconnect, the system must merge their changes without data loss and without requiring human intervention for every conflict.

### 25.2 Per-Field CRDT Algorithm Selection

Not all fields use the same CRDT. The algorithm is chosen per field type:

| Field Type | CRDT Algorithm | Rationale |
|-----------|----------------|-----------|
| Scalar (status, priority, title) | **Last-Write-Wins (LWW-Register)** based on logical clock | Simple; last meaningful action wins |
| Counter (allocated_hours, logged_hours) | **PN-Counter (Positive-Negative Counter)** | Supports both increment and decrement; commutative |
| Set (skill_tags, attendee_ids) | **OR-Set (Observed-Remove Set)** | Handles concurrent add + remove correctly |
| Sequence (task order in sprint) | **RGA (Replicated Growable Array)** | Preserves insertion order under concurrent edits |
| Free text (description, notes) | **YATA / Logoot (character-level CRDT)** | Character-level insertion preserves intent |
| Boolean flags (is_active, tombstone) | **Enable-Wins Register** | Enabling an entity wins over disabling |

### 25.3 The version_vector — Logical Clock Definition

The `version_vector JSONB` column stores a Lamport timestamp per client:

```javascript
// version_vector structure
{
  "client_id_1": 7,   // client_1 has made 7 mutations to this entity
  "client_id_2": 3,   // client_2 has made 3 mutations to this entity
  "server":      12   // server has processed 12 total mutations
}

// Merge algorithm for LWW-Register (scalar fields):
function mergeScalar(local, remote) {
  const localClock = maxClock(local.version_vector);
  const remoteClock = maxClock(remote.version_vector);
  if (remoteClock > localClock) return remote.value;
  if (localClock > remoteClock) return local.value;
  // Tie-break: lexicographically greater client_id wins (deterministic)
  return maxClientId(local, remote) === local.client_id ? local.value : remote.value;
}

// Merge algorithm for PN-Counter (numeric counters):
function mergeCounter(local, remote) {
  // Each client tracks their own increment/decrement deltas
  // Merge = sum of all positive deltas - sum of all negative deltas
  const mergedIncrements = mergeMaxVectors(local.increments, remote.increments);
  const mergedDecrements = mergeMaxVectors(local.decrements, remote.decrements);
  return sumVector(mergedIncrements) - sumVector(mergedDecrements);
}

// Merge for OR-Set (skill_tags):
function mergeSet(local, remote) {
  // Element is present if: it was added AND not subsequently removed
  // Concurrent add + remove: add wins (enable-wins semantics)
  const merged = new Set();
  for (const [item, addClock] of local.adds) {
    const removeClock = remote.removes.get(item) ?? 0;
    if (addClock > removeClock) merged.add(item);
  }
  for (const [item, addClock] of remote.adds) {
    const removeClock = local.removes.get(item) ?? 0;
    if (addClock > removeClock) merged.add(item);
  }
  return merged;
}
```

### 25.4 Tombstone Lifecycle

The `tombstone BOOLEAN` column marks entities deleted in an offline session. On sync:

```javascript
// Tombstone merge: if either side tombstoned, the entity is deleted
// Exception: if server has newer non-tombstone mutations, resolve as conflict
function mergeTombstone(local, remote) {
  if (local.tombstone || remote.tombstone) {
    const tombstoneTime = Math.max(local.tombstoneAt, remote.tombstoneAt);
    const lastMutationTime = Math.max(local.lastMutationAt, remote.lastMutationAt);
    if (lastMutationTime > tombstoneTime + GRACE_PERIOD_MS) {
      // Server received meaningful mutations after the tombstone — surface as conflict
      return { conflict: true, type: 'delete_vs_mutation' };
    }
    return { tombstone: true, deletedAt: tombstoneTime };
  }
  return { tombstone: false };
}
```

---

## 26. Scenario Simulation Engine

Both reviews flagged that the scenario modeling was shallow. This section adds a dedicated simulation architecture.

### 26.1 Scenario Entity

```sql
CREATE TABLE scenarios (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  description       TEXT,
  scenario_type     TEXT NOT NULL,    -- headcount_loss|headcount_add|vendor_failure|
                                      -- revenue_drop|project_delay|budget_cut|custom
  created_by        UUID REFERENCES users(id),
  base_snapshot_id  UUID,             -- FK to org_snapshots (point-in-time org state)
  input_params      JSONB NOT NULL,   -- scenario-specific parameters
  simulation_result JSONB,            -- computed output
  status            TEXT DEFAULT 'draft',  -- draft|running|complete|archived
  computed_at       TIMESTAMPTZ,
  deleted_at        TIMESTAMPTZ DEFAULT NULL,
  created_at        TIMESTAMPTZ DEFAULT now()
);
```

### 26.2 Scenario Parameter Schemas

Each `scenario_type` has a defined `input_params` schema:

**Headcount Loss:**
```javascript
{ employees: [uuid], departure_date: 'YYYY-MM-DD', reason: 'voluntary|involuntary' }
```

**Vendor Failure:**
```javascript
{ vendor_id: uuid, failure_date: 'YYYY-MM-DD', failure_type: 'complete|partial', partial_capacity: 0.4 }
```

**Revenue Drop:**
```javascript
{ revenue_stream_id: uuid, drop_pct: 0.15, effective_date: 'YYYY-MM-DD' }
```

**Project Delay:**
```javascript
{ project_id: uuid, delay_weeks: 6, cause: 'scope|resource|technical|external' }
```

### 26.3 Simulation Output Schema

Every simulation computes and stores a standardized result:

```javascript
{
  "impact_summary": {
    "projects_affected": 3,
    "capabilities_degraded": ["Payments", "Identity"],
    "customers_at_risk": ["Acme Corp", "TechCo"],
    "revenue_at_risk_micro_units": 4200000000,   // $4,200 monthly
    "bus_factor_change": { "Sarah": { "before": 4, "after": 9 } },
    "estimated_recovery_weeks": 8
  },
  "causal_chain": [
    { "event": "Sarah departs", "consequence": "Payments capability drops to 1 owner", "confidence": 1.0 },
    { "event": "Payments capability drops", "consequence": "Project X loses lead", "confidence": 0.92 },
    { "event": "Project X loses lead", "consequence": "Acme Corp delivery at risk", "confidence": 0.85 }
  ],
  "mitigations": [
    { "action": "Document Sarah's payment architecture before departure", "effort": "low", "impact": "high" },
    { "action": "Cross-train Ahmed on Payments service", "effort": "medium", "impact": "high" }
  ],
  "timeline": {
    "immediate": [...],    // 0–2 weeks
    "short_term": [...],   // 2–8 weeks
    "long_term": [...]     // 8+ weeks
  }
}
```

### 26.4 Org Snapshots (Temporal Intelligence)

Scenarios run against point-in-time snapshots of the organizational graph, not the live database. This answers the question: "What did the organization look like 6 months ago?"

```sql
CREATE TABLE org_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_at   TIMESTAMPTZ NOT NULL,
  snapshot_type TEXT NOT NULL,   -- auto_monthly|pre_scenario|manual
  created_by    UUID REFERENCES users(id),
  metadata      JSONB,           -- { entity_counts, graph_edge_count, active_projects }
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Snapshot data stored in compressed JSONB (or S3 for large orgs)
CREATE TABLE org_snapshot_data (
  snapshot_id   UUID NOT NULL REFERENCES org_snapshots(id),
  entity_type   TEXT NOT NULL,
  entity_data   JSONB NOT NULL,  -- full entity state at snapshot time
  PRIMARY KEY (snapshot_id, entity_type)
);
```

Auto snapshots are taken monthly by the Railway worker. Pre-scenario snapshots are taken automatically before any scenario is run. This enables: "Compare current org to what it was before we onboarded that enterprise client."

---

## 27. Notification Intelligence — Debounce & Rollup

The Gemini review identified a fundamental contradiction: DIZRUPT measures Cognitive Load Index (CLI) by unread notification count, but the automation engine and AI agents generate many automated systemic flags. **The system designed to reduce cognitive load was structurally positioned to cause it.**

### 27.1 Notification Classification

Every notification is assigned a class at creation time:

| Class | Description | Delivery Rule |
|-------|-------------|--------------|
| `hard_stop` | Capacity would breach SLA, contractor over hours, security alert | Immediate delivery, bypasses all muting |
| `critical_action` | Project status Critical, blocker on critical path | Immediate delivery during work hours only |
| `manager_review` | Agent proposals, burnout flags, approval requests | Batch: max 1 delivery per entity per 4 hours |
| `intelligence` | Trend alerts, EPS drops, drift score changes | Batch: morning briefing only |
| `informational` | Task status changes, comment replies, general updates | Async: in-app inbox only, no push |

### 27.2 Notification Debounce Rules

```javascript
// No metric notification fires more than once per entity per time window
const DEBOUNCE_RULES = {
  burnout_flag:        { window_hours: 24, max_per_entity: 1 },
  capacity_warning:    { window_hours: 4,  max_per_entity: 1 },
  health_degradation:  { window_hours: 8,  max_per_entity: 1 },
  strategy_drift:      { window_hours: 168, max_per_entity: 1 },  // weekly
  agent_proposal:      { window_hours: 2,  max_per_entity: 3 },
};

// Notification dedup table
CREATE TABLE notification_dedup (
  entity_id       UUID NOT NULL,
  notification_type TEXT NOT NULL,
  last_sent_at    TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (entity_id, notification_type)
);
```

### 27.3 Executive Morning Brief

All `intelligence` class notifications for Executives are aggregated into a single daily digest at 8:00am in the user's timezone:

```
DIZRUPT Daily Brief — Thursday, June 12

Critical Attention:
• Project X at risk: 3 causes identified [View]
• Sarah burnout flag raised [Review in private]

Review Required (4 items):
• 2 agent proposals awaiting approval [View queue]
• 1 budget approval pending >48h [Approve]

Trends:
• EPS down 8 pts this week (3 teams)
• Strategy drift at 23% — moderate
• 2 vendor renewals in 30-day window

No action needed: everything else is on track.
```

The brief is generated by the Railway worker at 7:45am per user timezone. Each item links to the source entity. The brief is the **only** delivery mechanism for `intelligence`-class notifications.

### 27.4 User-Controlled Thresholds

Users set their notification sensitivity per class:
- **Immediate alerts:** select which `hard_stop` and `critical_action` types reach them via push/email
- **Morning brief:** select which intelligence signals to include
- **Inbox only:** mark any category as inbox-only — never proactive delivery
- **Focus mode:** during focus hours (user-configured time block), only `hard_stop` class breaks through

---

## 28. Entity Lifecycle Specifications & State Machines

This section closes the PRD completeness gap: entities had schemas but no lifecycle specifications. Every entity needs defined: creation, transitions, archival, deletion, ownership transfer.

### 28.1 Universal Lifecycle Events

Every entity supports these operations regardless of type:

| Operation | Auth | Audit | Side Effects |
|-----------|------|-------|-------------|
| `CREATE` | Role-based (see RBAC matrix) | `audit_events` INSERT | Embedding queued; entity_relationships created; notifications triggered |
| `UPDATE` | Owner or manager | `audit_events` INSERT (before/after) | Content hash recomputed; embedding re-queued if significant change |
| `SOFT_DELETE` | Owner or Admin | `audit_events` INSERT | `deleted_at` set; embeddings purged; entity_relationships marked `valid_until = deleted_at` |
| `RESTORE` | Admin only | `audit_events` INSERT | `deleted_at` cleared; embeddings re-queued; relationships restored |
| `HARD_DELETE` | Scheduled job (30 days post soft delete) | Final audit entry | All associated entity_relationships permanently removed; embedding vectors deleted |
| `TRANSFER_OWNERSHIP` | Admin or current owner | `audit_events` INSERT | `owner_id` updated; entity_relationships updated; new owner notified |
| `ARCHIVE` | Owner or manager | `audit_events` INSERT | Status set to archived; removed from active dashboards but searchable |

### 28.2 State Machines — Critical Entities

**Project:**
```
PLANNING → ACTIVE → AT_RISK → CRITICAL → COMPLETED
                  ↘ ON_HOLD ↗ (can return to ACTIVE)
                  ↘ CANCELLED (terminal)
```
Transitions are validated server-side. `PLANNING → COMPLETED` is not a valid transition (must pass through ACTIVE).

**Task:**
```
BACKLOG → TO_DO → IN_PROGRESS → REVIEW → CLIENT_REVIEW → COMPLETED
              ↕            ↕         ↕
           BLOCKED ────────────────────→ (can be unblocked to any prior state)
BACKLOG → CANCELLED (terminal, any state can cancel)
```

**Risk:**
```
OPEN → MITIGATING → MONITORING → CLOSED
     ↘ ACCEPTED (risk acknowledged, no mitigation) → MONITORING → CLOSED
Any state → ESCALATED (triggers executive notification)
```

**Decision:**
```
DRAFT → PROPOSED → APPROVED → ACTIVE → SUPERSEDED (by another Decision)
                 ↘ REJECTED (back to DRAFT for revision)
ACTIVE → REVERSED (outcome was wrong; links to a new corrective Decision)
```

**Commitment:**
```
OPEN → IN_PROGRESS → FULFILLED (terminal)
     ↘ OVERDUE (auto-transition on due_date breach)
OVERDUE → FULFILLED (late, but completed)
        ↘ WITHDRAWN (by owner, with reason required)
```

**Risk Severity Matrix (auto-computed):**
```
                Impact
             LOW  MED  HIGH  CRITICAL
Probability
LOW         Low   Low  Med    High
MEDIUM      Low   Med  High   Critical
HIGH        Med   High Crit   Critical
```
`severity` field is auto-computed by trigger on `probability` or `impact` change.

### 28.3 Ownership Transfer Cascade

When an entity's owner leaves the organization (`lifecycle_stage` → `OFFBOARDING`):

1. All entities where `owner_id = departing_user_id` are flagged as `ownership_gap`
2. A task is auto-created: "Transfer ownership: [entity name]" assigned to departing user's manager
3. If unresolved in 7 days, entities surface in the Organizational Blind Spot Dashboard
4. Admin is alerted with a complete list of owned entities awaiting transfer

---

## 29. Failure Mode Catalog

This section ensures the system degrades gracefully under every realistic failure scenario. Every dependency has a documented fallback.

| Component | Failure Mode | Detection | Fallback | Recovery |
|-----------|-------------|-----------|----------|---------|
| **Supabase DB** | Connection timeout / outage | Health check endpoint; Sentry alert | Read-only cached state for all dashboards; writes queue in Railway worker with retry | Auto-recover on reconnect; queued writes replay in order |
| **Supabase Realtime** | WebSocket disconnect | `channel.onError` handler | React falls back to 30-second polling on `/capacity/heatmaps`; banner: 'Live sync paused — refreshing every 30s' | Reconnect with exponential backoff; re-subscribe to all active channels |
| **Vercel (API routes)** | Cold start timeout / serverless limit | 504 response | Client retries up to 3× with exponential backoff; user sees 'Taking longer than usual...' | Vercel auto-scales; persistent operations are on Railway, not Vercel |
| **Railway Worker** | Process crash / OOM | Railway restart policy; dead_letter_jobs table | Failed jobs written to `dead_letter_jobs`; admin alerted; manual requeue available | Process restarts automatically; jobs are idempotent — safe to replay |
| **Claude API** | Rate limit / outage | HTTP 429 / 503 response | AI features degrade gracefully: semantic search → full-text BM25 fallback; summaries → 'AI unavailable — using cached summary'; agent proposals suspended | Retry with exponential backoff; on recovery, re-queue pending agent cycles |
| **OpenAI Embeddings** | API outage | HTTP 5xx response | Embedding jobs enter `dead_letter_jobs`; full-text search continues functioning normally; new entities are searchable by title/description immediately | On recovery, batch-reprocess all queued embedding jobs |
| **Redis** (Phase 2+) | Connection failure | Connection error | Session cache falls back to DB session lookup; rate limiting falls back to in-memory counters (less precise but functional); distributed locks fall back to Postgres advisory locks | Auto-reconnect; cache is rebuilt from DB on recovery |
| **Google OAuth** | OAuth provider outage | 502 from Google | Email/password login remains fully available; OAuth button shows 'Google sign-in temporarily unavailable'; no data loss | User switches to email login; OAuth re-enables on provider recovery |
| **JWT / Auth** | Refresh cookie expired or session revoked | `silentRefresh()` returns 401 | User redirected to login page with: 'Your session has expired. Please sign in again.' | Standard re-authentication; session re-established |
| **Embedding Deduplication** | Content hash collision (SHA-256) | Practically impossible (2^256 space) | Accept collision risk as negligible; no fallback needed | N/A |
| **Agent Proposal Expiry** | Proposal not reviewed in 48 hours | `expires_at < now()` | Proposal auto-expires; agent re-evaluates on next cycle to determine if still relevant | Fresh proposal generated if condition persists |

---

## 30. Build Readiness Supplement

This section closes the Build Readiness gap (v2.0 score: 7.5/10). It provides the engineer-facing artifacts needed to translate the PRD into a buildable sprint plan.

### 30.1 Screen Inventory

A complete list of every view in the system. Not wireframes — just the inventory.

| Screen | Route | Min Role | Primary Component | Phase |
|--------|-------|----------|------------------|-------|
| Login | `/login` | None | EmailForm, GoogleOAuthButton | P0 |
| Forgot Password | `/forgot-password` | None | EmailForm | P0 |
| Dashboard / Home | `/` | Employee | RoleAdaptiveDashboard | P0 |
| Capacity Heatmap | `/capacity` | Proj Mgr | HeatmapGrid, EmployeeBar, AllocationDrawer | P0 (read-only), P1 (drag-drop) |
| Project List | `/projects` | Employee | ProjectCard, StatusBadge, HealthPill | P0 |
| Project Detail | `/projects/:id` | Employee | OverviewPanel, MilestoneTree, LinkedEntities | P0 |
| Kanban Board | `/projects/:id/board` | Employee | KanbanColumn, TaskCard, SprintSelector | P0 |
| Roadmap / Gantt | `/projects/:id/roadmap` | Team Lead | GanttBar, DependencyArrow, MilestoneMarker | P0 |
| Task Detail | `/tasks/:id` | Employee | TaskDrawer, TimeLogger, DependencyGraph | P0 |
| Employee Directory | `/people` | Proj Mgr | DirectoryGrid, SkillFilterPanel | P0 |
| Employee Profile | `/people/:id` | Team Lead | ProfileCard, CapacityRing, ExpertiseTags | P0 |
| Org Chart | `/org-chart` | Dept Head | OrgTreeViz, NodeDrawer | P1 |
| Executive Dashboard | `/executive` | Executive | MetricTile, PortfolioMatrix, BriefingPanel | P1 |
| Sprint Board | `/projects/:id/sprint` | Proj Mgr | SprintHeader, BacklogRail, VelocityChart | P1 |
| Knowledge Hub | `/knowledge` | Employee | DocTypeFilter, KnowledgeCard, SearchBar | P1 |
| Decision Registry | `/decisions` | Team Lead | DecisionList, DecisionDrawer | P1 |
| Risk Register | `/risks` | Proj Mgr | RiskMatrix, RiskDrawer, MitigationPanel | P1 |
| Meeting Records | `/meetings` | Employee | MeetingCard, TranscriptUploader, ActionItems | P1 |
| Commitments | `/commitments` | Employee | CommitmentList, FulfillmentTracker | P2 |
| Automation Rules | `/automations` | Proj Mgr | RuleBuilder, TriggerSelector, ActionChooser | P2 |
| OKR Dashboard | `/goals` | Dept Head | GoalTree, ProgressBar, LinkedProjects | P2 |
| AI Proposals | `/proposals` | Proj Mgr | ProposalCard, ApproveRejectPanel | P2 |
| Scenario Simulator | `/scenarios` | Dept Head | ScenarioForm, SimulationResult, CausalChain | P3 |
| Client Portal | `/client-portal/:token` | Client | MilestoneTimeline, DeliverableCard | P1 |
| Audit Log | `/audit` | Dept Head | AuditEventTable, FilterPanel | P0 |
| Settings | `/settings/*` | Admin | UserTable, RoleEditor, SSOConfig | P0 |

### 30.2 Core User Flows (Step-by-Step)

**Flow 1 — Task Reallocation (the North Star workflow)**
1. PM opens `/capacity` → heatmap renders from materialized view
2. PM identifies Sarah (red bar, 112%) → clicks task card on Sarah's bar
3. AllocationDrawer opens: shows task details + availability comparison
4. PM drags task to Ahmed (green bar, 65%)
5. Frontend: optimistic update (both bars rerender <50ms)
6. Frontend: `POST /tasks/reallocate { task_id, from_user_id, to_user_id }`
7. API: `pg_advisory_xact_lock(task_id)` acquired
8. API: `UPDATE capacity_logs SET allocated_hours = allocated_hours + delta` (both users)
9. API: `INSERT INTO audit_events` (actor, action, before/after state)
10. API: Supabase Realtime broadcasts delta to `capacity:dept:{dept_id}` channel
11. Other open sessions: their heatmap bars update in real-time
12. PM sees: Ahmed's bar updates to 73%, Sarah's bar drops to 94%
13. On conflict: API returns 409, frontend rolls back optimistic state, shows toast

**Flow 2 — AI Search**
1. User presses Ctrl+K → CommandPalette opens
2. User types: "who built payments and are they available?"
3. Frontend: `GET /ai/search?q=...` with JWT
4. API: generates query embedding via OpenAI
5. API: hybrid search query (70% vector + 30% BM25) with RLS scope filter
6. API: returns ranked results `[{entity_type, entity_id, score, preview}]`
7. CommandPalette: renders results grouped by type (Employees, Tasks, Knowledge)
8. User clicks result: side panel opens for entity

**Flow 3 — Agent Proposal Review**
1. Burnout Agent flags Sarah (3 consecutive weeks >50h)
2. Agent writes to `agent_proposals_staging` with `conflict_scope: ['sarah_uuid']`
3. Coordinator checks for conflicts in staging (Allocation Agent also touching Sarah?)
4. If conflict: negotiation protocol runs → compromise or unified proposal generated
5. If no conflict: proposal promoted to `proposals` table
6. PM notified (class: `manager_review`, debounced to 1/4h)
7. PM opens Proposals inbox → sees card: "Sarah burnout risk — review workload"
8. PM approves, rejects, or snoozes → outcome written to `agent_memory`

### 30.3 Acceptance Criteria — Core Features

**Feature: Capacity Heatmap (Phase 0)**
- Given: PM is logged in with role `project_manager`
- When: they navigate to `/capacity`
- Then: they see a grid of all employees in their assigned teams
- And: each employee shows a colored bar (green/yellow/red) based on `utilization_pct`
- And: bars load within 2.5 seconds using the materialized view
- And: no drag-and-drop is available in Phase 0

**Feature: Task Reallocation (Phase 1)**
- Given: PM sees an overloaded employee (red bar)
- When: they drag a task to an employee with green bar
- Then: the optimistic update renders both bars' new values in <50ms
- And: the backend RPC confirms within 800ms
- And: `audit_events` contains a row with `action_type='task_reallocated'` and `override_reason` populated if capacity guard was bypassed
- And: all other open sessions on the same department channel receive the Realtime delta and update their bars

**Feature: Soft Delete**
- Given: Admin soft-deletes a project
- When: the deletion is confirmed
- Then: `deleted_at` is set to `now()` on the projects row
- And: the project no longer appears in any `SELECT` query (RLS `deleted_at IS NULL` filter)
- And: all `entity_relationships` for this project have `valid_until` set
- And: all embeddings for this project are purged from `entity_embeddings`
- And: `audit_events` contains the deletion event
- And: the project is still recoverable by Admin for 30 days via `/admin/restore/:id`

### 30.4 API Contract — Critical Endpoints

**POST /tasks/reallocate**
```
Request:
{
  "task_id": "uuid",
  "to_user_id": "uuid",
  "override_reason": "string | null"    // required if target would exceed 100%
}

Response (200):
{
  "task_id": "uuid",
  "from_user_id": "uuid",
  "to_user_id": "uuid",
  "from_utilization_after": 0.94,
  "to_utilization_after": 0.73,
  "audit_event_id": "uuid"
}

Errors:
409 Conflict: { "code": "CONCURRENT_MODIFICATION", "message": "Task was modified by another session. Please refresh." }
422 Unprocessable: { "code": "CAPACITY_EXCEEDED", "message": "Target would exceed 100% utilization. Provide override_reason to proceed.", "target_utilization": 1.12 }
403 Forbidden: { "code": "INSUFFICIENT_ROLE", "message": "Project Manager role required." }
```

**POST /tasks/dependency-check**
```
Request:
{
  "task_id": "uuid",
  "depends_on_id": "uuid",
  "relationship_type": "blocks | depends_on | related_to"
}

Response (200):
{ "valid": true }

Response (422):
{
  "valid": false,
  "code": "DEPENDENCY_CYCLE_DETECTED",
  "cycle_path": ["uuid-A", "uuid-B", "uuid-C", "uuid-A"],
  "message": "Adding this dependency would create a circular chain."
}
```

**GET /ai/search**
```
Query params: q (string), types (comma-sep entity types), limit (int, default 20)

Response (200):
{
  "results": [
    {
      "entity_type": "employee",
      "entity_id": "uuid",
      "score": 0.847,
      "preview": "Ahmed Hassan — Backend Engineer, Payments team, 22h available this week",
      "highlight_fields": ["full_name", "skill_tags"]
    }
  ],
  "search_mode": "hybrid | full_text_fallback",  // full_text_fallback if AI unavailable
  "query_embedding_used": true,
  "latency_ms": 412
}
```

---

*DIZRUPT Supreme PRD v3.0 — June 2026 — ideassion Enterprise*  
*CONFIDENTIAL — Internal Use Only*  
*Supersedes v2.0. Incorporates: graph-native relationship layer, Customer/Revenue/Service entities, causal intelligence architecture, multi-agent negotiation protocol, CRDT resolution math, scenario simulation engine, notification intelligence, entity lifecycle specs, state machines, failure mode catalog, and build readiness supplement.*  
*Companion: Architecture Appendix v7.0 · Engineering Compendium v8.0 · Operations Doctrine v9.0*
