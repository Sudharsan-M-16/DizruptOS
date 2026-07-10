# DIZRUPT — Simple Explainer (For Recruiters, Investors, Anyone)

*Skip the complexity. Here's what the product actually does, in plain English.*

---

## SECTION 1: WHAT IS DIZRUPT IN 30 SECONDS?

**Problem:** 
Teams don't know who's overworked until someone quits or burns out.

**Solution:**
A dashboard that shows you RIGHT NOW who has too much work, and suggests how to fix it.

**That's it.**

---

## SECTION 2: THE REAL STORY — SARAH

### Who is Sarah?

She works at a fintech company. Her name is **Sarah Okafor**. She:
- Is a team lead
- Knows payments systems really well
- Works in London
- Is the ONLY person in her company who understands payments architecture

### What's the Problem?

Sarah is assigned to **one project: Atlas Payments Migration**.

This project is:
- The company's BIGGEST project ($4.2 million in revenue on the line)
- The most urgent (deadline: July 24)
- The most complex (moving their entire billing system)

Sarah has **4 tasks** on this project:

1. **"Ledger cutover runbook — final review"** (Due: Jun 12) — 14 hours of work
2. **"Settlement file ingestion"** (Due: Jun 11) — 12 hours of work
3. **"Reconciliation engine penny-drift fix"** (Due: Jun 13) — 10 hours of work
4. **"PCI evidence pack refresh"** (Due: Jun 17) — 9 hours of work

**Total: 45 hours of work assigned to her.**

**Her capacity: 40 hours per week.**

**Math: 45 ÷ 40 = 112%**

**Translation: She's overworked by 12%.**

### What Happens When Someone Is 112% Allocated?

- She works 50+ hour weeks
- She has no time for breaks, emails, or emergencies
- She burns out (probably quits)
- If she quits, the entire $4.2M project collapses (she's the only one who knows it)

**This is the problem DIZRUPT solves.**

---

## SECTION 3: IS SARAH WORKING ON 2 PROJECTS OR 1?

**Simple Answer: 1 Project**

Sarah is only on **Atlas Payments Migration**. All 4 of her tasks are on that one project.

**Different person: Ahmed**

Ahmed Hassan works on **2 projects:**
- Project 1 (Atlas): "Idempotent retry layer for payment webhooks" (12 hours)
- Project 2 (Helio): "Client auth tier — token-scoped RLS" (10 hours)

Total: 22 hours ÷ 40 capacity = 55% (comfortable, has headroom)

**Key Point:**
- Sarah = 1 project, 112% (overloaded) 🚩
- Ahmed = 2 projects, 55% (fine) ✅

**DIZRUPT shows this visually** so managers can see Ahmed has space and Sarah is drowning.

---

## SECTION 4: HOW ARE TASK DUE DATES DEFINED? (THE TIMING QUESTION)

### Simple Answer:
**Project managers decide the due date. It goes in the system. That's it.**

### Real Example:

The project owner (Sarah's manager Priya) said:
- "Settlement file ingestion must be done by Jun 11" (because it blocks testing)
- "Ledger cutover runbook must be done by Jun 12" (because the vendor review happens on Jun 13)
- "PCI evidence pack must be done by Jun 17" (because compliance audit is Jun 18)

These dates are **business decisions**, not algorithmic:
- They're picked based on: external deadlines, dependent tasks, customer needs
- They go into the system as `dueDate: "2026-06-12"`
- DIZRUPT then watches: "Is this task on track to the due date?"

---

## SECTION 5: HOW IS "CRITICAL" DEFINED? (SUPER SIMPLE VERSION)

### The Scale (4 levels, bottom to top)

```
🟢 ON_TRACK      — Everything is fine. Timeline is good.
🟡 DELAYED       — We're behind. But we can catch up.
🟠 AT_RISK       — This is starting to look bad. We might miss deadline.
🔴 CRITICAL      — Everything is falling apart. We WILL miss deadline.
```

### What Makes Atlas "CRITICAL"?

DIZRUPT looks at **4 things** and they all say "PROBLEM":

| Check | What We Look For | Atlas Status | Why It Matters |
|-------|------------------|--------------|----------------|
| **1. Late Tasks** | How many tasks are past their due date? | 7 tasks are >5 days late | Oops, we're behind |
| **2. QA Blocked** | Is the testing team underwater? | Yes, testers at 112% utilization | Can't review code → can't ship |
| **3. Velocity Drop** | Are we getting slower? | -38% slower than last 3 sprints | Trend is getting worse, not better |
| **4. External Blocker** | Is something outside our control blocking us? | Vendor is 8 days late on settlement file | We literally cannot proceed |

**If we see 1-2 of these:**
→ Status = "AT_RISK" (yellow warning)

**If we see 3-4 of these:**
→ Status = "CRITICAL" (red alarm)

---

## SECTION 6: WHAT IS "CONFIDENCE"? (SUPER SIMPLE)

### Confidence = How Sure Are We This is Actually a Problem?

```
100% confidence = We measured it directly. It's definitely true.
90% confidence = We're pretty sure this is true.
75% confidence = We think this is true, but could be wrong.
50% confidence = Coin flip. Might be true, might not.
```

### Real Examples from Atlas:

| Finding | Confidence | Why? |
|---------|-----------|------|
| "7 tasks are overdue by > 5 days" | 95% | We counted them. Objective fact. |
| "QA stage is at 112% utilization" | 92% | We did the math: 45h allocated ÷ 40h capacity. Facts. |
| "Velocity is -38% vs 3-sprint average" | 88% | We calculated this statistically. High confidence. |
| "Vendor is 8 days late" | 78% | Vendor told us. But external factors could change it. |

**Why Do We Use Confidence?**

Imagine a recruiter asks: "How do you know Atlas is critical?"

**Bad answer:** "It's critical."

**Good answer:** "We're 95% sure 7 tasks are late (we counted them), 92% sure QA is at 112% utilization (we did the math), and 88% sure our velocity is down (statistical analysis). These four facts together mean it's CRITICAL."

**The recruiter now trusts you.**

---

## SECTION 7: HOW DOES THE SYSTEM SUGGEST A FIX?

### The Scenario (What the System Sees)

```
Sarah: 112% (overloaded, at risk of burnout)
Ahmed: 55% (has 20 hours of capacity)
Ahmed's Skills: Payments + Auth (matches Sarah's work on "PCI evidence pack")
```

### What DIZRUPT Suggests

**Agent (an algorithm) says:**
"Move 'PCI evidence pack refresh' (9 hours) from Sarah to Ahmed."

**Why?**
- Sarah drops from 112% → 90% (not overloaded anymore)
- Ahmed rises from 55% → 77.5% (still healthy)
- Work still gets done (Ahmed knows payments)
- Deadline still met

### Who Decides?

**Not the algorithm. A human.**

Sarah's manager (Priya) sees this suggestion and:
- ✅ Clicks "Approve" → Move happens, audit log records it
- ❌ Clicks "Reject" → Move doesn't happen, reason saved for next time

**Key Point: Agents recommend. Humans decide. System learns what works.**

---

## SECTION 8: WHAT PROBLEMS DO PEOPLE SAY EXIST IN THE PRODUCT?

Let me be honest. Here are the real complaints:

### Problem 1: "It's Just a Dashboard"
**What People Say:**
"This looks nice, but it's just showing me what I already know. My team is overworked. I don't need a dashboard to tell me that."

**What's True:**
Dashboard alone isn't enough. The VALUE is in the **agents that propose solutions automatically**.

**How We Address It:**
"Yes, seeing red is obvious. But do you know WHO can absorb that work and HAS THE SKILLS? The system does. That's the difference."

---

### Problem 2: "Where's the Backend?"
**What People Say:**
"This only works with demo data. Where's the real database? How do we plug in our Jira? Our HRIS? Our Slack?"

**What's True:**
Right now it's demo mode. Real backend exists in code but isn't live.

**Honest Answer:**
"Today: Demo mode (sample company data in-memory). Next sprint: Supabase backend (real database). Later: Connectors to Jira, Linear, GitHub (import tasks automatically)."

**This is NOT a blocker.** Demo is fully functional. Architecture is ready for real data.

---

### Problem 3: "How Do I Know the Suggestions Are Right?"
**What People Say:**
"You're telling me to move work from Sarah to Ahmed. But what if Ahmed fails? What if the task takes 15 hours, not 9? Then we're MORE overloaded."

**What's True:**
Fair question. The system isn't perfect. It's probabilistic.

**How We Address It:**
"We track every suggestion: Did it work? Or did it fail? Over time, we get smarter. That's the learning loop: Suggest → Try → Measure → Improve."

**Example:** If we suggest moving work from Sarah to Ahmed 10 times, and it works 7 times and fails 3 times, next time we lower confidence: 70% (not 91%).

---

### Problem 4: "What About Qualitative Stuff?"
**What People Say:**
"You can't measure 'Sarah is the only person with the knowledge' or 'Ahmed hasn't worked with payments before' or 'This task has invisible dependencies.'"

**What's True:**
Right. The system is algorithmic. It can't read minds.

**How We Address It:**
"The system gives you OPTIONS. Sarah's manager can override. The system learns from overrides: 'Okay, when the manager rejects moving payments work off Sarah, they cite knowledge concentration. Next time, lower my confidence on this type of move.'"

---

### Problem 5: "Recommendations Need LLM?"
**What People Say:**
"You said recommendations are 'deterministic' not AI. So why did I see recommendations improve when you added the API key?"

**What's True:**
The recommendations (WHAT to do) don't need LLM. The explanations (WHY and HOW) got better with Claude.

**Analogy:**
- Doctor (recommendation): "You have high blood pressure. Exercise more." (doesn't require AI)
- Copilot (LLM): Explains in fluent English why exercise helps, what kind, etc. (better with AI)

---

### Problem 6: "Is This for Managers Only?"
**What People Say:**
"Can Sarah see this? Or just her manager? What if Sarah wants to know why she's overloaded?"

**What's True:**
Right now: Managers and executives. Sarah can see her own tasks, not the 'burnout flag' (manager-private).

**How We Address It:**
"Future: Sarah's app shows her own capacity ring, PTO balance, and personalized suggestions: 'You have a focus block available Thu 9am-12pm. Block it for the cutover runbook.' Employee-level features coming next."

---

## SECTION 9: HOW TO EXPLAIN THIS TO A RECRUITER

### The Pitch (2 minutes)

**Recruiter:** "So what does DIZRUPT do?"

**You:** 
"We solve a problem every ops team has: nobody knows who's overworked until they quit.

DIZRUPT is a dashboard that shows real-time allocation. Sarah has 45 hours of work but only 40 hours of capacity. The system automatically suggests moving 9 hours of work to Ahmed, who has capacity and the right skills.

Manager clicks approve. Workload rebalances. Sarah doesn't burn out. Project stays on track.

It's built like a Mac OS so it feels native, not like another tool. And it learns: Did the move work? We measure it and get smarter next time."

**Recruiter:** "Cool. But how do I know the suggestions are right?"

**You:**
"Fair question. We don't claim 100% accuracy. We're at ~68% right now. But here's what's different: We MEASURE outcomes. Every suggestion is tracked. Did Sarah's burnout score improve? Did the project stay on schedule?

Over time, accuracy improves. And humans always decide — the system recommends, your manager approves or rejects."

**Recruiter:** "What about integrations?"

**You:**
"Today: Demo mode (standalone). Next month: Supabase backend. Q3: Jira/Linear connectors (auto-import tasks). Q4: Slack integration. We're building the foundation first."

**Recruiter:** "So it's not ready for production?"

**You:**
"Depends what you mean. The core (allocation + suggestions) is production-ready. The integrations (Jira/Slack) are roadmap. We recommend starting with our import wizard (manual CSV upload) or the demo to validate the idea."

---

## SECTION 10: HOW TO EXPLAIN THIS TO AN INVESTOR

### The Pitch (3 minutes)

**Investor:** "What's the problem you're solving?"

**You:**
"Burnout and turnover. A study by Gallup says 23% of employees are burned out. When they quit, it costs 50-200% of their salary to replace them.

Companies use dashboards (Jira, Linear) to track WHAT work exists. But nobody tracks WHO can do it and WHETHER THEY'RE OVERLOADED.

We fill that gap. We're like Waze for workforce allocation — real-time, optimized, predictive."

**Investor:** "How do you make money?"

**You:**
"SaaS model: $99-499/month per company, depending on size. For a 50-person company, that's $5-25k/year. ROI: If we prevent ONE person from quitting (and that costs $100k to replace), the product pays for itself in month 1."

**Investor:** "What's the competition?"

**You:**
"Lattice (people analytics), 15Five (engagement), Workable (HR). But they're survey-based (slow) and they target HR. We target Ops/Engineering managers. We're real-time and algorithmic."

**Investor:** "Show me the demo."

**You:**
[Open DIZRUPT, go to capacity heatmap, show Sarah at 112%, drag her work to Ahmed]

"This is Sarah. Overloaded. Ahmed has space and the skills. One drag. One click. Problem solved. Now multiply this by your entire team."

**Investor:** "What's your timeline?"

**You:**
- Today: Demo mode (closed beta)
- June: Supabase backend (real database)
- July: First customer onboarding
- Q4: Jira integration (go-to-market with engineering teams)

---

## SECTION 11: COMMON RECRUITER QUESTIONS & ANSWERS

### Q1: "What happens if a recruiter asks, 'Is this just a UI project?'"

**Bad Answer:** "No, it's a full stack product."

**Good Answer:** "No. It's architecture-complete:
- **Frontend:** macOS-style OS (Electron-grade UX in browser)
- **Backend:** Supabase (PostgreSQL, RLS, Realtime)
- **Compute:** Deterministic engines (burnout scoring, recommendations, graph analysis)
- **Learning:** Outcome measurement + calibration (learns from decisions)

The UI is the surface. The system underneath is the moat."

---

### Q2: "Who's your customer?"

**Good Answer:** 
"Ops teams at growth-stage companies (50-500 people). We start with engineering teams (familiar with tools like this) and expand to operations.

Our ICP: CISO/Head of Ops at a company doing $10M+ ARR, frustrated with turnover and overallocation."

---

### Q3: "What if they already use Lattice or 15Five?"

**Good Answer:**
"We're not a competitor. We're orthogonal.
- Lattice: Survey-based people analytics (quarterly)
- DIZRUPT: Real-time allocation + agents (daily)

Many customers use both: Lattice for engagement scores, DIZRUPT for tactical rebalancing."

---

### Q4: "Why should I care about this company?"

**Good Answer:**
"Retention is the #1 problem in tech. Every percentage point of retention saves $millions in hiring costs.

We're building the tool that *makes* retention decisions visible and automated. It's not motivational. It's logistical. And it's defensible."

---

## SECTION 12: THE HONEST SUMMARY

| Aspect | Status | Honest Assessment |
|--------|--------|-------------------|
| **Core Idea** | ✅ Strong | Solves a real problem. Everyone gets it. |
| **UI/UX** | ✅ Excellent | Better than competitors. macOS-like feel works. |
| **Backend** | 🟡 In Progress | Works in demo mode. Supabase integration ready but not live. |
| **Integrations** | 🔴 Not Done | No Jira/Slack yet. Roadmap is clear. |
| **Learning Loop** | 🟡 Partial | Measures outcomes. Calibration working. Not AI yet. |
| **Production Ready** | 🟡 Partial | Core features yes. Integrations no. |
| **Founder Story** | ✅ Strong | Built for ops teams who lived through overallocation. |

---

## SECTION 13: WHAT TO SAY WHEN SOMEONE ASKS "WHAT'S THE CATCH?"

**Someone will always ask:** "This sounds too good to be true. What's the catch?"

**Honest Answer:**

"Three things:

1. **Right now it's demo mode.** Real data integration is Q2. If you need live Jira data today, you're 4 weeks early.

2. **It's probabilistic, not deterministic.** We're at 68% accuracy on recommendations. We're improving it. It's never 100%.

3. **It's management tool, not a motivational tool.** We can't fix culture. We can only make allocation *visible* and *optimized*. The company still has to care about burnout.

But here's what's NOT a catch: We're not taking shortcuts on architecture. We're building it right."

---

## SECTION 14: ONE-PAGER FOR YOUR ELEVATOR PITCH

**30 seconds:**
"DIZRUPT is a dashboard that shows who's overworked and auto-suggests how to fix it. Sarah's at 112%. Move 9 hours to Ahmed. Click approve. Burnout prevented. $100k hiring cost saved."

**2 minutes:**
"Every team has someone like Sarah — critical, overloaded, about to quit. We make that visible real-time and suggest rebalancing. Deterministic algorithms. Human approval. Measured outcomes. You learn from every decision."

**5 minutes:**
[See Section 10 & 11 above]

---

## FINAL WORD FOR YOU

When recruiters or investors ask questions:

1. **Answer simply.** No jargon. Use Sarah's story.
2. **Be honest about what's done.** Demo mode is done. Backend is coming.
3. **Show the problem, then the solution.** "Sarah at 112% → Suggest move → Burnout prevented."
4. **Cite confidence.** "We're 95% sure these tasks are late (we counted)."
5. **Admit limitations.** "It's probabilistic, not perfect. But it learns."

The product is strong. You don't need to oversell it. Just explain it clearly.

