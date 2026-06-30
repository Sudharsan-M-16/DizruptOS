# How Criticality is Defined & Multi-Project Work

---

## PART 1: HOW CRITICALITY IS DEFINED

### The Health Status Scale

Every project has ONE of five health statuses:

```
ON_TRACK → DELAYED → AT_RISK → BLOCKED → CRITICAL
   (good)    (late)   (risky)   (stuck)   (crisis)
```

**Each status is data-driven, not opinion.**

---

## 1. CRITICAL — What Makes It Red?

**Definition:** Project is on the critical path AND experiencing compound problems that *cascade downstream*.

### Atlas Payments Migration: CRITICAL (Real Example)

| Signal | Metric | Confidence | Why It Matters |
|--------|--------|------------|----------------|
| **Tasks overdue** | 7 tasks > 5 days late | 95% (rule-based) | Velocity is negative; finish line slipping |
| **QA bottleneck** | Stage at 112% utilization | 92% (rule-based) | Review queue blocked; can't ship anymore |
| **Velocity degradation** | -38% vs 3-sprint avg | 88% (statistical) | Trend is worsening, not improving |
| **Vendor blockage** | Settlement file 8 days late | 78% (observed) | External dependency blocking cutover |

**Why CRITICAL (not just AT_RISK)?**
- **Multiplicity:** 4 independent signals, not 1
- **Confidence:** All above 88% (high bar)
- **Compounding:** Each problem makes others worse:
  - Overdue tasks → QA queue blocks → velocity drops
  - Velocity down → deadline pressure rises → team burns out (Sarah at 112%)
  - Vendor late → can't test migration → cutover at risk
  - Risk grows → $4.2M ARR customer at risk

---

## 2. AT_RISK — What's Different?

**Definition:** Project has *directional problems* that will become critical if not addressed *this week*.

### Helio Client Portal: AT_RISK

| Signal | Metric | Confidence |
|--------|--------|------------|
| **Design slip** | Handoff 4 days late | 90% (rule-based) |
| **Downstream risk** | 2 of 9 tasks blocked on auth review | 86% (rule-based) |

**Why AT_RISK (not CRITICAL)?**
- Only 2 signals (not multiple compounding)
- Blocks are *resolvable* (auth review = 1 decision)
- No cascade yet (Helio doesn't feed Atlas, no external vendor)
- Still executing (velocity 18→22→25→24→26→23, stable)

**What moves it to CRITICAL?**
- If auth review decision *doesn't happen* → more tasks block → velocity degrades
- If we see a 3rd signal (e.g., "stakeholder sign-off delayed" + "team utilization exceeds 100%")

---

## 3. DELAYED — Slipping, But Contained

**Definition:** Behind schedule, but no *blocking* impact on other projects or people.

### Nimbus Infra Hardening: DELAYED

| Signal | Metric | Confidence |
|--------|--------|------------|
| **Vendor slip** | Pen-test start +2 weeks | 93% (observed) |
| **Compliance lag** | 3 tasks overdue | 91% (rule-based) |

**Why DELAYED (not AT_RISK)?**
- Fatima (owner) has capacity to absorb 2-week slip
- No other project depends on Nimbus delivering by Jul 24
- Velocity is steady (14→16→13→12→15→13, no collapse)
- Slippage is *known* and *contained* (vendor decision, not execution chaos)

---

## 4. ON_TRACK — Green

**Definition:** Executing within plan. All milestones on schedule. Velocity stable or improving.

### Pulse Intelligence Engine: ON_TRACK

| Signal | Metric | Confidence |
|--------|--------|------------|
| **Milestone execution** | All milestones green | 97% (rule-based) |
| **Velocity** | Within 6% of plan | 97% (statistical) |

**Why ON_TRACK?**
- No deviations
- Velocity trending up (20→24→26→28→27→29)
- Team has room to absorb surprises

---

## 5. BLOCKED — Complete Halt

**Definition:** A single blocker prevents *any* progress.

### Example (Not in Current Data)
- "Cannot ship until legal approves data residency terms"
- "Cannot deploy until security clearance completes"

**Difference from DELAYED:**
- DELAYED = we're working, but behind schedule
- BLOCKED = we cannot work at all

---

## How Criticality Is Computed (The Algorithm)

### Step 1: Collect Signals
From the project + tasks + capacity + risks + velocity data:

```
Signals = {
  overdue_tasks,
  utilization_per_stage,
  velocity_trend,
  external_dependencies,
  key_person_burnout,
  budget_overage,
  customer_risk,
  ...
}
```

### Step 2: Confidence Score Each Signal
- **Rule-based** (95%): "If N tasks overdue > M days, then signal fires"
- **Statistical** (88%): "If velocity ≤ (3-sprint avg - 20%), then signal fires"
- **Observed** (78%): "Vendor explicitly said they're X days late"

### Step 3: Aggregate & Threshold

| Health Status | Condition |
|---------------|-----------|
| **CRITICAL** | ≥3 signals with avg confidence ≥85% AND evidence of cascading |
| **AT_RISK** | ≥2 signals with avg confidence ≥80% AND downstream impact visible |
| **DELAYED** | 1-2 signals AND velocity degrading AND isolated to this project |
| **ON_TRACK** | ≤1 signal AND velocity within plan AND no negative trend |
| **BLOCKED** | A single hard blocker exists AND no workaround |

### Step 4: Store + Display

```javascript
{
  id: "p-atlas",
  name: "Atlas Payments Migration",
  health: "CRITICAL",  // ← The computed status
  healthReasons: [     // ← The proof (every reason cited)
    "7 tasks overdue by > 5 days (95% · rule)",
    "QA stage at 112% utilization (92% · rule)",
    "Velocity 38% below 3-sprint average (88% · statistical)",
    "Vendor settlement-file delivery 8 days late (78% · observed)"
  ]
}
```

**Key principle:** Users never see just "CRITICAL" — they see *why* it's critical, with confidence scores and evidence.

---

## Task-Level Criticality (Different From Project Health)

Tasks have **priority**, not health status:

```
URGENT > HIGH > MEDIUM > LOW
```

**URGENT tasks:**
- On critical path (if delayed, project deadline slips)
- Actively blocking others
- High-confidence dependencies

**HIGH tasks:**
- Important but have some slack
- Will become URGENT in 2-3 days

**MEDIUM tasks:**
- Important for quality but not time-critical
- Can slip 1-2 weeks without catastrophe

**LOW tasks:**
- Nice-to-have, can descope

---

## Mapping Task Priority → Project Health

| Task Signal | Contributes To Project Health? | Example |
|-------------|--------------------------------|---------|
| URGENT task blocked | YES (AT_RISK) | "Settlement file ingestion" blocked → project can't ship |
| URGENT task overdue | YES (CRITICAL if 3+ overdue) | "7 tasks overdue" → velocity down |
| HIGH task delayed | MAYBE (if on critical path) | "Load test" HIGH, but if it slips 2 days, OK |
| Assignee at 100%+ utilization | YES (CRITICAL if it's critical-path person) | Sarah at 112% on Atlas → throughput drops |

---

# PART 2: CAN A PERSON WORK ON 2+ PROJECTS?

## The Short Answer: YES, CONSTANTLY

In the sample org, **at least 6 people work on 2 projects simultaneously.**

---

## Evidence: Multi-Project Workers

### Ahmed Hassan (u-ahmed)
| Project | Task | Priority | Hours | Due Date |
|---------|------|----------|-------|----------|
| **p-atlas** | Idempotent retry layer for webhooks | HIGH | 12h | Jun 16 |
| **p-helio** | Client auth tier — token-scoped RLS | HIGH | 10h | Jun 17 |
| **Total allocation (week of Jun 8)** | | | **26/40h (65%)** | |

**Analysis:** Ahmed has capacity (65% = green), so dual-project work is fine.

---

### Diego Ruiz (u-diego)
| Project | Task | Priority | Hours | Status | Due Date |
|---------|------|----------|-------|--------|----------|
| **p-helio** | Milestone timeline component | HIGH | 12h | IN_PROGRESS (7h done) | Jun 15 |
| **p-orbit** | Dense table kit — virtual rows | HIGH | 9h | REVIEW | Jun 12 |
| **p-orbit** | Chart kit: tooltips | MEDIUM | 8h | TO_DO | Jun 24 |
| **Total allocation** | | | **33/40h** | | |

**Analysis:** Diego is at 82.5% across 2-3 projects. Working, but less headroom than Ahmed.

---

### Jonas Weber (u-jonas) — Multi-Project With Overallocation Risk

| Project | Task | Priority | Hours | Due Date |
|---------|------|----------|-------|----------|
| **p-atlas** | Load test: 5k TPS cutover | HIGH | 10h | Jun 19 |
| **p-atlas** | Rollback drill — staging rehearsal | URGENT | 8h | Jun 18 |
| **p-nimbus** | Single-session enforcement e2e | MEDIUM | 7h | Jun 25 |
| **Total allocation (week of Jun 22)** | | | **41-102%** (depending on week) | |

**Analysis:** Jonas spikes to 102% in the week of Jun 22. His dual-project work surfaces in the audit as a **capacity override decision** (Asha logged: "Release-gating test cannot slip past code freeze").

---

### Kofi Mensah (u-kofi) — Design Across Projects

| Project | Task | Priority | Hours | Due Date |
|---------|------|----------|-------|----------|
| **p-helio** | Portal empty-state & status explanations | MEDIUM | 6h | Jun 12 |
| **p-orbit** | Motion language spec | MEDIUM | 8h | Jun 16 |
| **p-orbit** | Chart kit: tooltips | MEDIUM | 8h | Jun 24 |

**Analysis:** Kofi works across Design System (Orbit) + Client Portal (Helio). Both are design-focused, so context switch is lower.

---

### Yuki Tanaka (u-yuki) — Project Manager Cross-Project

| Project | Task | Priority | Hours | Due Date |
|---------|------|----------|-------|----------|
| **p-atlas** | Acme Corp cutover comms plan | MEDIUM | 6h | Jun 15 |
| **p-quartz** | Guided setup flow — 4-step wizard | MEDIUM | 10h | Jul 8 |

**Analysis:** Yuki bridges two projects in different departments (Operations on both). Lighter load allows it.

---

### Elias Brandt (u-elias) — Admin Infrastructure Work

| Project | Task | Priority | Hours | Due Date |
|---------|------|----------|-------|----------|
| **p-nimbus** | Audit immutability — REVOKE verification | MEDIUM | 4h | Jun 4 |
| **p-nimbus** | Pen-test scope doc with vendor | HIGH | 5h | Jun 8 |

**Analysis:** Elias is admin/infrastructure. His work naturally spans security + compliance (Nimbus), but likely touches multiple projects implicitly.

---

## The Capacity Heatmap View

```
Week of Jun 8:        └─ Monday start

        | Alice | Ahmed | Mei | Diego | Jonas | Fatima | Sarah |
p-atlas |   -   |  12h  | 8h  |  -    |  10h  |  -     | 45h  |
p-helio |   -   |  10h  |  -  |  12h  |  -    |  -     |  -   |
p-orbit |   -   |   -   |  -  |  9h   |  -    |  -     |  -   |
p-nimbus|   -   |   -   |  -  |  -    |  7h   |  8h    |  -   |
────────┼───────┼───────┼─────┼───────┼───────┼────────┼──────┤
TOTAL   |   -   |  26h  | 8h  |  21h  |  17h  |  8h    |  45h |
────────┼───────┼───────┼─────┼───────┼───────┼────────┼──────┤
%       |   -   |  65%  | 20% |  52%  |  42%  |  26%   | 112% |
```

---

## Why Multi-Project Work Happens

### 1. **Specialists Exist Across Projects**
- Ahmed: Payments infrastructure (needed by both Atlas cutover + Helio auth)
- Diego: Frontend components (needed by both Helio portal + Orbit design system)
- Kofi: Design patterns (needed by both Helio UX + Orbit tokens)

### 2. **Capacity Math Requires It**
- No org has 100% dedicated people per project
- To maximize throughput, you cross-allocate idle capacity
- Ahmed at 65% on week of Jun 8 → he's the right person to help Helio

### 3. **Context Switching Cost Varies**
- **Low switching cost:** Design → Design, Infrastructure → Infrastructure, Backend → Backend
- **High switching cost:** Database schema change (needs deep context)

---

## The System's Approach to Multi-Project Work

### What DizruptOS Does

1. **Visualizes It Clearly**
   - Heatmap shows per-person, per-week allocation across all projects
   - Colors show which projects are consuming hours (task chips labeled p-atlas, p-helio)

2. **Tracks It**
   - Every task card shows: `[projectId] taskName`
   - Audit log records: "Ahmed moved from p-helio to p-atlas" (if reallocated)

3. **Manages It**
   - If allocation ≥100% → **hard-stop modal** (can't add more without reason)
   - Agents detect: "Jonas projected 102% week of Jun 22" → propose shifting p-nimbus work

4. **Measures It**
   - Capacity × project = "How many hours does Atlas consume per person this week?"
   - Utilization by project = "Is Atlas consuming 50% or 90% of Mei's week?"

---

## When Multi-Project Work Becomes a Problem

| Scenario | Signal | What Happens | Example |
|----------|--------|--------------|---------|
| **Overallocation** | Person ≥100% on multiple projects | Burnout + context switch loss | Sarah at 112% (Atlas mostly) |
| **Deep work blocked** | Person >75% on project A + >25% on project B | Neither project ships well | Diego 52% + 50% = high context switch |
| **Priority conflict** | Two projects have conflicting deadlines | Person chooses (political) | Jonas: Atlas Jun 18 rollback vs Nimbus Jun 25 e2e |
| **Knowledge silos** | Only one person knows X, spread across 2 projects | Bus factor on each project | Ahmed is only Payments + Auth person = risk |

---

## How Reallocation Works Across Projects

**Scenario:** Sarah is overallocated on Atlas (112%), Ahmed has headroom (65%) and matching skills.

### Option 1: Move Task Between Projects (Rare)
- Move "PCI evidence pack refresh" (9h, p-atlas) to Ahmed
- Sarah stays on Atlas, Ahmed still on both projects
- Sarah drops to 90%, Ahmed rises to 87%

### Option 2: Swap Projects (Reshuffling)
- Move Ahmed's Helio work to Diego
- Move Ahmed to focus on Atlas only (reduce Sarah's load via different task)
- Diego rises to higher allocation, Ahmed focused

### Option 3: Add Cross-Training (Long-term)
- Ahmed learns from Sarah on Payments architecture
- Over time, Ahmed can own some Payments-infrastructure tasks
- Distribution improves for future projects

---

## The Real-World Pattern

In the sample org:

- **Specialists (Ahmed, Diego, Kofi)** work on 2 projects naturally (both need their expertise)
- **Generalists (Yuki, Marcus)** work across functional areas (Operations → Atlas comms + Quartz onboarding)
- **Domain leads (Priya, Fatima)** stay deep in 1-2 projects (Architecture, Infrastructure)
- **Individual contributors** often start on 1 project, grow into 2 as capacity frees

**The system doesn't *prevent* multi-project work** — it *makes it visible* so managers can optimize allocation without burnout.

---

## Summary Table: Multi-Project Workers in Sample Org

| Person | Projects | Total Hours | Utilization | Status |
|--------|----------|-------------|-------------|--------|
| Ahmed | p-atlas + p-helio | 22h | 65% | ✅ Healthy |
| Diego | p-helio + p-orbit | 33h | 82% | ✅ Stretched but OK |
| Jonas | p-atlas + p-nimbus | 25h (avg) | ~62% (spikes 102%) | ⚠️ Watch week of Jun 22 |
| Kofi | p-helio + p-orbit | 22h | 55% | ✅ Healthy |
| Yuki | p-atlas + p-quartz | 16h | 40% | ✅ Headroom |
| Elias | p-nimbus (admin) | 9h | 23% | ✅ Headroom |

**Takeaway:** Multi-project work is the norm, not the exception. The system's job is to keep utilization visible and prevent the threshold where context switching becomes *destructive*.

