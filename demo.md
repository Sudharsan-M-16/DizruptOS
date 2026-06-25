# DIZRUPT — The Demo Story

> Read this top to bottom and you can present the whole product as one story.
> Plain language. Every feature appears where it naturally belongs, tied to the
> live demo data and the people who use it. Each moment has a **▶ You'd use it
> when…** line so a non-technical audience always knows *why* it matters.

---

## The problem (say this first)

Every company runs on two questions that never quite line up:

1. **Who's doing what, and who has time?** (workforce)
2. **What's happening on each project, and what does it need next?** (projects)

Normally these live in different tools — a spreadsheet for people, a board for
tasks, Slack for "is anyone free?", a deck for the executive summary. Nobody has
one honest picture. So people get overloaded silently, projects stall waiting on
one person, and the client finds out late.

**DIZRUPT puts both into one place** — a workplace that runs like an operating
system in your browser. One source of truth: who's free, who's drowning, what
each project needs, and what to do about it — live, for everyone, scoped to what
their role should see.

> **The one-sentence pitch:** *DIZRUPT shows you who's overloaded, who's free,
> and what to do about it — and everyone, from the CEO to the client, sees exactly
> the right slice of the same live truth.*

---

## The world of the demo (our seed)

A small software studio building real things you recognise:

- **AI Support Chatbot** — the flagship. It's **on fire**: behind schedule, the
  two key people (Sarah, Zara) are over 100%, and the AI model is *blocked*
  waiting on a database task.
- **Sales Analytics Dashboard** — just started, **understaffed**: several tasks
  have nobody on them.
- **Ray (45% busy) and Inés (50%)** are sitting with spare time — and they have
  exactly the skills the Dashboard needs.
- Plus a Fitness App, a Cloud setup (blocked on a vendor), a Design System, and
  an Online Store in planning.

That tension — *one team drowning, one project starving, and the right free
people right there* — is the whole story. Watch how DIZRUPT makes it obvious and
fixable in seconds.

---

## Seven logins, one truth (this is the magic)

Everyone signs into the **same desktop**, but **role-based access** means each
person sees only what they should. Switch logins live in the demo — it's the
strongest thing to show.

### 1. Noor — the CEO (executive)
Opens to the **Executive** cockpit: one screen — org health, what changed this
week, what's on fire (the Chatbot), what needs a decision. A **Weekly Brief** tab
writes the story in plain prose. She can see everything strategic; she *can't*
reassign work (that's not her job).
> **▶ You'd use it when** you have five minutes before a board call and need the
> honest state of the company without chasing six people.

### 2. Asha — the Project Manager
The operator. Opens **Capacity** — a colour grid of the whole team by week. Red =
overloaded (Sarah 115%, Zara 110%), blue/green = free (Ray 45%, Inés 50%). She
clicks **Sarah** → a sidebar shows Sarah's tasks, skills, and a one-click **Move**
that lists the *best-fit* people first (right skills + most room). She moves
"Set up the chatbot database" to **Ahmed** — both get notified, both rows update
instantly.
> **▶ You'd use it when** someone's drowning and you need to hand work to the
> right person — not just *anyone*, the one who actually has the skill and the time.

### 3. Sarah — the Team Lead
Sees her team's load and burnout flags (she's flagged herself — 115%, no time off
in 112 days). She can *surface* problems but not reassign — leads raise, managers
act. The system already nudged a fix for her overload into the manager's inbox.
> **▶ You'd use it when** you're slammed and want the system to notice and route
> help, instead of suffering quietly until something breaks.

### 4. Ahmed — the Engineer (employee)
Opens **Home** — just *his* world: today's work, what's pending, what's critical,
and what's blocking him. Because he's only ~65% loaded, a green banner appears:
**"You've got room this week — want to pick up more?"** with skill-matched
unowned tasks he can claim himself, no manager needed. He sees a task **⛔ blocked
by** a teammate's work, and gets a **🔓 you're unblocked** ping the moment it's done.
He cannot see Capacity, Executive, the org graph, or anyone's salary — that's RBAC.
> **▶ You'd use it when** you finish early and want to help move the project
> forward — the system hands you work that fits, instead of you pinging "anything
> I can do?".

### 5. Acme Support — the Client
A completely separate, locked-down **portal**. They see *only their project* (the
Chatbot): a friendly status ("Behind schedule"), a progress ring, a
**Design → Build → Test → Launch** timeline, what's happening now / next / done,
the team's names, and a calm "what we're watching." They can **approve** a
deliverable (it completes live for the team) and **message the team**. No company
data, no other projects, no internal capacity — ever.
> **▶ You'd use it when** you're the customer and you just want to know "is my
> thing on track, who's on it, and what do you need from me?" — without a status call.

### 6. Elias — the IT Admin
Full access plus the **Admin Console** (tenants, SSO, SCIM) and the **Audit Trail**
— every consequential action is logged (who moved what, who overrode a limit, who
approved).
> **▶ You'd use it when** you need to prove what happened, manage accounts, or pass
> a security review.

### 7. Priya — the Head of Engineering (dept head)
The bridge: the executive view *and* the power to reassign — the org-wide picture
with the operational controls.

---

## The magic moment (do this live)

This 30-second flow is the demo's punchline:

1. As **Asha**, open **Capacity**. The Chatbot team is red. Ray and Inés are blue
   ("free for work").
2. Open **Recommendations** → *"What to do next."* It already says, in plain
   English: **"Staff the Sales Dashboard — assign 'Build the data pipeline' to Ray
   (Data Engineer, 45% loaded — best fit)"** and **"Relieve Sarah — move a task to
   Ahmed."** Nobody wrote those; the system read the live plan.
3. Apply one. Now switch to **Ahmed's** login → the task is on his Home, he's
   notified. Switch to the **Client** → the project status reflects it. Switch to
   the **CEO** → the brief updates.

**One change, true everywhere, instantly — scoped to each person's role.** That's
the product.

> **▶ You'd use it when** you want to stop guessing. The system surfaces the move,
> you approve it, and the whole org stays in sync without a single status meeting.

---

## How it maps to the original ask (say this to close the loop)

The brief was: *workforce management + project management, clubbed into one; free
people flagged to higher-ups; the underloaded can take on more; skill-based
allocation; managers see status and what everyone's doing; employees see what's
done, what's left, and what's next.* Point by point:

| The ask | Where it lives in DIZRUPT |
|---|---|
| Workforce + projects in **one** thing | The desktop — Capacity (people) and Project Matrix/Projects (work) share one live store |
| See **what each person did / is doing** | Click anyone in Capacity → their tasks, projects, skills, load |
| See **who's free / can contribute more** | Capacity's "free for work" count + the blue rows; Recommendations lists them |
| **Flag free people** to higher-ups | Underload signal on Capacity + the "people are free" notification |
| Free employees can **take on more themselves** | Home's "You've got room — pick up" self-service (no manager needed) |
| **Skill-based** allocation | Every reassign/suggestion ranks by skill match (a UI task never goes to a database expert) |
| Move a person to where their **skill is needed** | Recommendations + Capacity sidebar route the right person to the understaffed project |
| Managers know **status of project + people** | Executive, Projects (health), Capacity, Agent Inbox |
| Employees know **done / to-do / next** | Home (Today / Pending / Critical) + blocked-by/blocking |

**Yes — the problem statement is solved, end to end, and visible from every seat.**

---

## Why this over a spreadsheet + a board + Slack

- **It's one truth, not four tools.** Capacity, tasks, risks, decisions, and the
  executive summary all read the same live data — change it once, it's right
  everywhere.
- **It tells you what to do, not just what is.** Recommendations and the AI agents
  turn "Sarah's at 115%" into "move this task to Ahmed — he fits."
- **It respects who you are.** The CEO, an engineer, and a client open the *same*
  app and each see a correct, safe slice. That's hard to fake and impossible in a
  spreadsheet.
- **Nobody's stuck or invisible.** Overload is flagged, free time is offered,
  blocked work pings the people involved, and the client is never in the dark.
- **It's calm.** A clean desktop, plain words, one click to act.

---

## A 3-minute script (if you only have one slot)

1. **Sign in as the CEO.** "One screen: is the company healthy? The AI Chatbot is
   critical." (Executive)
2. **Switch to the PM.** "Here's why — Sarah and Zara are over 100%. And look,
   Ray's free with the right skills." (Capacity) "The system already knows what to
   do." (Recommendations → apply one.)
3. **Switch to the Engineer.** "Ahmed only sees his work — and because he's free,
   it's offering him the task we just routed." (Home self-service)
4. **Switch to the Client.** "Acme sees only their project, in plain English, and
   can approve work — nothing else." (Client portal)
5. **Land it:** "One team, one truth, the right view for everyone — that's DIZRUPT."

---

*Tip: keep the demo on the built-in data (it's deterministic and fully
interactive — every click works and stays in sync). Switch logins from the
profile menu to tell the story.*
