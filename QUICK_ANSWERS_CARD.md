# Quick Answers Card — Copy & Paste Responses

*Use this when you get rapid-fire questions.*

---

## Q: "Is Sarah on 1 project or 2?"

**A: 1 project (Atlas).**

All 4 of her tasks are on Atlas Payments Migration:
- Ledger cutover (14h, due Jun 12)
- Settlement file ingestion (12h, due Jun 11)
- Reconciliation fix (10h, due Jun 13)
- PCI evidence pack (9h, due Jun 17)

**Total: 45h assigned ÷ 40h capacity = 112%.**

Ahmed works on 2 projects (Atlas + Helio), but only at 55% total.

---

## Q: "How are task due dates set?"

**A: Project manager decides.**

Priya (Sarah's manager) said:
- "Settlement file ingestion needs to be done by Jun 11 because it blocks testing"
- "Ledger cutover runbook needs to be done by Jun 12 because vendor reviews it Jun 13"

These are business decisions, not algorithmic. Dates go into the system. Done.

---

## Q: "What is 'Confidence'?"

**A: How sure are we this is actually true?**

| Score | Meaning |
|-------|---------|
| 95% | We counted/measured it. Objective fact. |
| 90% | We calculated it. Pretty sure. |
| 88% | We analyzed statistics. High confidence. |
| 78% | Someone told us. Could change. |

**Example:**
- "7 tasks overdue" = 95% (we counted them)
- "QA at 112%" = 92% (we did the math)
- "Vendor 8 days late" = 78% (they said so, but could change)

---

## Q: "Why is CRITICAL different from AT_RISK?"

**A: CRITICAL = multiple bad things. AT_RISK = one or two problems.**

### Atlas = CRITICAL (4 signals)
- ✅ 7 tasks late (95% confident)
- ✅ QA at 112% (92% confident)
- ✅ Velocity down -38% (88% confident)
- ✅ Vendor 8 days late (78% confident)

**Result: Everything is compounding. Deadline will slip.**

### Helio = AT_RISK (2 signals)
- Design handoff slipped 4 days
- 2 tasks blocked on auth review

**Result: Directional problem. If we fix auth review, we're fine.**

---

## Q: "How does the system suggest a fix?"

**A: Look at capacity + skills. Recommend a move.**

System sees:
- Sarah: 112% (overloaded) ✗
- Ahmed: 55% (headroom) ✓
- Ahmed's skills: Payments + Auth ✓ (matches Sarah's work)

System suggests: "Move PCI evidence pack (9h) from Sarah to Ahmed"

**Result:**
- Sarah: 112% → 90% ✅
- Ahmed: 55% → 77.5% ✅
- Both healthy

Sarah's manager clicks "Approve". Move happens. Done.

---

## Q: "But what if Ahmed fails? What if it takes 15h instead of 9h?"

**A: We measure it. We learn from it.**

If the move fails:
- We measure: Did Sarah's burnout score improve or not?
- We learn: Next time, lower confidence on "move work from Sarah to Ahmed"
- We calibrate: Over 10 moves, if 7 work and 3 fail, our confidence is 70%.

This is the **learning loop**: Suggest → Try → Measure → Improve.

---

## Q: "Is Sarah working on Helio too?"

**A: No. Only Atlas.**

You might be thinking of Ahmed (he works on both Atlas and Helio).

**Clear breakdown:**
- **Sarah:** 1 project (Atlas) ← Overloaded
- **Ahmed:** 2 projects (Atlas + Helio) ← Healthy
- **Diego:** 2-3 projects (Helio + Orbit) ← Stretched but OK

---

## Q: "Where are task timings defined?"

**A: In the database. Project manager sets them.**

Each task has:
```
{
  id: "t-1",
  title: "Ledger cutover runbook",
  projectId: "p-atlas",
  assigneeId: "u-sarah",
  estimatedHours: 14,
  dueDate: "2026-06-12",      ← Manager sets this
  weekStart: "2026-06-08",
  status: "IN_PROGRESS",
  priority: "URGENT"
}
```

System then:
- Calculates: 14h estimated for a 40h/week person in 1 week = 35% of capacity
- Monitors: Is it on track to Jun 12? How many hours have been logged?
- Alerts: "This is due in 3 days and only 9h of 14h are done" (at risk)

---

## Q: "What problems do people say about the product?"

**A: Here are the honest ones:**

| Problem | Truth | How We Address |
|---------|-------|----------------|
| "Just a dashboard" | Partly true | No, we have agents that recommend fixes automatically |
| "No real backend yet" | True | Demo works. Supabase backend ready next sprint. |
| "How do I know suggestions are right?" | Fair point | 68% accuracy today. We measure and improve. |
| "Can't measure qualitative stuff" | True | System is algorithmic. Manager can override. |
| "Need LLM for recommendations?" | No | LLM just improves explanation. Recommendations are deterministic. |
| "Only for managers?" | Today yes | Sarah gets her own features later. |

---

## Q: "So what can be done about these problems?"

**A: Here's the roadmap (honest version):**

| Problem | Fix | Timeline |
|---------|-----|----------|
| No real data | Build Supabase backend | June 2026 |
| Manual task entry | Jira/Linear connectors | July 2026 |
| Low confidence | Measure outcomes → calibrate | Continuous |
| Qualitative blindness | Manager overrides + feedback loop | Q3 2026 |
| Manager-only features | Employee app (Sarah sees her own burnout) | Q3 2026 |

**Honest answer:** We're not trying to solve everything at once. Core feature (allocation) works. Integrations come next.

---

## Q: "What should I tell a recruiter?"

**Pitch (30 seconds):**
"DIZRUPT shows you who's overworked. Sarah has 45 hours of work, 40 hours of capacity. System suggests moving 9 hours to Ahmed. Manager clicks approve. Burnout prevented. $100k hiring cost saved."

**Pitch (2 minutes):**
"We solve burnout at the allocation level. Real-time, algorithmic, measurable. We don't motivate people. We rebalance workload. Humans decide. System learns."

---

## Q: "What should I tell an investor?"

**Problem:** 23% of employees are burned out. Replacing one costs $100k-$300k.

**Solution:** Dashboard + agents auto-rebalance work. ROI: Prevent one resignation = product pays for itself month 1.

**Business Model:** SaaS $99-499/month. 50-person company = $5-25k/year.

**Traction:** Demo is production-ready. First customer onboarding July 2026.

---

## Q: "What if they ask 'What's the catch?'"

**Answer:**
1. **Demo mode today, real DB in June.** If you need live Jira today, you're early.
2. **68% accuracy, not 100%.** We're improving it. It's probabilistic.
3. **It's management tool, not culture fix.** We can only make allocation visible. Company still needs to care.

**What's NOT a catch:** We're not cutting corners on architecture. We're building it right.

---

## Q: "How do I handle 'Prove this works'?"

**Answer:**

In the sample org (18 people):
- Sarah: 112% → at burnout risk (0.64 flight risk score)
- Ahmed: 55% → has headroom + skills
- System suggests: Move 9h from Sarah to Ahmed
- Result: Sarah 90%, Ahmed 77.5% — both healthy

This is a real scenario in the test data. In production:
- We track: Did Sarah's flight risk improve?
- We measure: Did the project stay on schedule?
- We learn: What % of these moves actually work?

**That's the proof: Measurement.**

---

## Q: "Is this product too early?"

**Honest answer:**
- Core (allocation visibility + recommendations): **Ready**
- UI/UX (macOS desktop): **Ready**
- Backend (real database): **Ready in code, live in June**
- Integrations (Jira/Slack): **Not ready, Q3**
- Learning loop (measure accuracy): **Working**

**Verdict:** Not too early for early adopters. A bit early for mainstream.

---

## Q: "Why should I join this company?"

**Because:**
1. **Real problem.** Burnout is #1 reason people quit.
2. **Founders understand it.** Built for ops teams who lived it.
3. **Clear product.** Not vague. Not chasing trends. Solves one thing well.
4. **Defensible moat.** Learning loop + outcomes measurement = competitors can't copy.
5. **Honest about roadmap.** We say what's done and what's coming. No BS.

---

## Quick Fact Sheet

| Fact | Answer |
|------|--------|
| **Company in demo** | Fintech ops startup, 18 people |
| **Sarah's role** | Team lead, payments specialist |
| **Sarah's project** | 1 (Atlas) |
| **Sarah's allocation** | 112% (overloaded) |
| **System recommendation** | Move 9h to Ahmed (who has 55% utilization) |
| **Cost of Sarah leaving** | ~$200k (salary + hiring) |
| **ROI if prevented** | 12 months of SaaS fees |
| **Current status** | Demo mode (production-ready) |
| **Real backend** | June 2026 |
| **First customer** | July 2026 |

---

## Copy-Paste Responses (For Slack/Email)

### When Someone Asks: "Can people work on 2 projects?"

> Yes, constantly. Ahmed works on Atlas (payments) + Helio (auth), 55% total. Sarah works only on Atlas, 112% total. The system shows who has headroom (Ahmed) and who's drowning (Sarah) so you can rebalance.

### When Someone Asks: "How is criticality computed?"

> Four things: late tasks, team utilization, velocity trend, external blockers. If all four are bad → CRITICAL. If two are bad → AT_RISK. If none → ON_TRACK. Each signal has a confidence score (90%+).

### When Someone Asks: "Isn't this just a dashboard?"

> No, it's dashboard + agents. The agents recommend moves automatically. Sarah at 112% → move 9h to Ahmed → manager clicks approve → system learns if it worked. That's the moat.

### When Someone Asks: "Why should I care?"

> Because one employee quitting costs $100k-$300k to replace. We prevent that by making overallocation visible and rebalancing it automatically. ROI is first month.

---

**That's it. Bookmark this page. Copy-paste as needed. Done.**

