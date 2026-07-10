// Seed organizational graph — a small software product studio, June 2026.
// One connected story: the AI Support Chatbot is overloaded and on fire, the
// Sales Analytics Dashboard just started and has no team, and the people with
// free time have exactly the skills the dashboard needs. Every feature
// (capacity, recommendations, proposals, notifications) tells this one story.
//
// Capacity math (PRD §3.2): utilization = allocated hours ÷ weekly capacity.

import type {
  AuditEvent,
  CapacityCell,
  Commitment,
  Decision,
  Department,
  Employee,
  Goal,
  NotificationItem,
  Project,
  Proposal,
  Risk,
  Task,
} from "./types";

// Derive today's date dynamically so overdue/due-today filters stay accurate.
function toISO(d: Date) { return d.toISOString().slice(0, 10); }
function thisMonday(): Date {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}
export const TODAY = toISO(new Date());
export const WEEKS: string[] = (() => {
  const start = thisMonday();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    return toISO(d);
  });
})();

// A short date a few days out / overdue, relative to today — keeps the demo fresh.
function days(n: number) { return toISO(new Date(Date.now() + n * 86_400_000)); }

export const departments: Department[] = [
  { id: "d-eng", name: "Engineering", headId: "u-priya" },
  { id: "d-design", name: "Design", headId: "u-lena" },
  { id: "d-data", name: "Data & AI", headId: "u-tomas" },
  { id: "d-ops", name: "Product", headId: "u-marcus" },
];

export const employees: Employee[] = [
  // ── Leadership ────────────────────────────────────────────────────────────
  {
    id: "u-noor", name: "Noor Al-Rashid", initials: "NA", role: "executive",
    title: "CEO", departmentId: "d-ops", capacityHoursPerWeek: 40,
    skills: ["Strategy", "Roadmap"],
    expertise: [{ domain: "Company strategy", depth: 0.92 }],
    timezone: "GST", location: "Abu Dhabi", joinedAt: "2021-04-05", ptoDays: [], accent: "#C084FC",
  },
  {
    id: "u-priya", name: "Priya Sharma", initials: "PS", role: "dept_head",
    title: "Head of Engineering", departmentId: "d-eng", capacityHoursPerWeek: 40,
    skills: ["Architecture", "Leadership", "Backend"],
    expertise: [{ domain: "Engineering leadership", depth: 0.95 }],
    timezone: "IST", location: "Bengaluru", joinedAt: "2021-08-02", ptoDays: [], accent: "#2BD9FF",
  },
  {
    id: "u-marcus", name: "Marcus Bell", initials: "MB", role: "dept_head",
    title: "Head of Product", departmentId: "d-ops", capacityHoursPerWeek: 40,
    skills: ["Product", "Strategy", "Planning"],
    expertise: [{ domain: "Product management", depth: 0.85 }],
    timezone: "EST", location: "New York", joinedAt: "2021-06-21", ptoDays: [], accent: "#F87171",
  },
  {
    id: "u-lena", name: "Lena Novak", initials: "LN", role: "dept_head",
    title: "Head of Design", departmentId: "d-design", capacityHoursPerWeek: 40,
    skills: ["UI Design", "Leadership"],
    expertise: [{ domain: "Product design", depth: 0.88 }],
    timezone: "CET", location: "Prague", joinedAt: "2021-10-12", ptoDays: [], accent: "#F472B6",
  },
  {
    id: "u-tomas", name: "Tomás Eriksen", initials: "TE", role: "dept_head",
    title: "Head of Data & AI", departmentId: "d-data", capacityHoursPerWeek: 40,
    skills: ["AI/ML", "Leadership", "Data Pipelines"],
    expertise: [{ domain: "Data & AI leadership", depth: 0.9 }],
    timezone: "CET", location: "Copenhagen", joinedAt: "2022-01-17", ptoDays: [], accent: "#60A5FA",
  },
  {
    id: "u-asha", name: "Asha Venkat", initials: "AV", role: "project_manager",
    title: "Project Manager", departmentId: "d-eng", capacityHoursPerWeek: 40,
    skills: ["Planning", "Coordination"],
    expertise: [{ domain: "Planning & staffing", depth: 0.9 }],
    timezone: "IST", location: "Chennai", joinedAt: "2023-02-13", ptoDays: [], accent: "#00ED82",
  },

  // ── Engineering ───────────────────────────────────────────────────────────
  {
    id: "u-sarah", name: "Sarah Okafor", initials: "SO", role: "team_lead",
    title: "Backend Team Lead", departmentId: "d-eng", capacityHoursPerWeek: 40,
    skills: ["Backend", "APIs", "Databases"],
    expertise: [{ domain: "Backend & APIs", depth: 0.93 }],
    timezone: "GMT", location: "London", joinedAt: "2022-04-11", ptoDays: [],
    burnoutFlag: true,
    burnoutSignals: [
      "Worked over 50 hours for 3 weeks straight",
      "Hasn't taken time off in 112 days",
      "Over 100% capacity for 9 days straight",
    ],
    flightRisk: 0.64, accent: "#EF4444",
  },
  {
    id: "u-ahmed", name: "Ahmed Hassan", initials: "AH", role: "employee",
    title: "Backend Engineer", departmentId: "d-eng", capacityHoursPerWeek: 40,
    skills: ["Backend", "APIs", "Databases"],
    expertise: [{ domain: "Backend services", depth: 0.7 }],
    timezone: "CET", location: "Berlin", joinedAt: "2024-01-08", ptoDays: [], accent: "#10B981",
  },
  {
    id: "u-mei", name: "Mei Lin", initials: "ML", role: "employee",
    title: "Senior Backend Engineer", departmentId: "d-eng", capacityHoursPerWeek: 40,
    skills: ["Backend", "APIs", "Databases"],
    expertise: [{ domain: "Backend systems", depth: 0.84 }],
    timezone: "SGT", location: "Singapore", joinedAt: "2022-11-01", ptoDays: [], accent: "#F59E0B",
  },
  {
    id: "u-diego", name: "Diego Ruiz", initials: "DR", role: "employee",
    title: "Frontend Engineer", departmentId: "d-eng", capacityHoursPerWeek: 40,
    skills: ["Frontend", "React", "UI"],
    expertise: [{ domain: "Frontend / React", depth: 0.78 }],
    timezone: "CST", location: "Mexico City", joinedAt: "2023-09-18", ptoDays: [], accent: "#38BDF8",
  },
  {
    id: "u-jonas", name: "Jonas Weber", initials: "JW", role: "employee",
    title: "QA Engineer", departmentId: "d-eng", capacityHoursPerWeek: 40,
    skills: ["Testing", "QA"],
    expertise: [{ domain: "Testing & QA", depth: 0.66 }],
    timezone: "CET", location: "Munich", joinedAt: "2023-05-22", ptoDays: [],
    burnoutFlag: false, flightRisk: 0.31, accent: "#A78BFA",
  },
  {
    id: "u-fatima", name: "Fatima Zahra", initials: "FZ", role: "employee",
    title: "DevOps Engineer", departmentId: "d-eng", capacityHoursPerWeek: 40,
    skills: ["DevOps", "Cloud", "CI/CD"],
    expertise: [{ domain: "Cloud & deployment", depth: 0.81 }],
    timezone: "GST", location: "Dubai", joinedAt: "2022-07-04", ptoDays: ["2026-07-06", "2026-07-07", "2026-07-08"], accent: "#34D399",
  },
  {
    id: "u-elias", name: "Elias Brandt", initials: "EB", role: "admin",
    title: "IT Admin", departmentId: "d-eng", capacityHoursPerWeek: 40,
    skills: ["IT", "Security", "Access"],
    expertise: [{ domain: "IT & security", depth: 0.7 }],
    timezone: "CET", location: "Oslo", joinedAt: "2022-09-19", ptoDays: [], accent: "#94A3B8",
  },

  // ── Design ────────────────────────────────────────────────────────────────
  {
    id: "u-kofi", name: "Kofi Mensah", initials: "KM", role: "employee",
    title: "Product Designer", departmentId: "d-design", capacityHoursPerWeek: 40,
    skills: ["UI Design", "Figma"],
    expertise: [{ domain: "UI design", depth: 0.74 }],
    timezone: "GMT", location: "Accra", joinedAt: "2023-12-04", ptoDays: [], accent: "#FB923C",
  },
  {
    id: "u-ines", name: "Inés Castillo", initials: "IC", role: "employee",
    title: "UX Designer", departmentId: "d-design", capacityHoursPerWeek: 32,
    skills: ["UX Research", "UI Design"],
    expertise: [{ domain: "UX research", depth: 0.74 }],
    timezone: "CET", location: "Madrid", joinedAt: "2024-03-11", ptoDays: [], accent: "#E879F9",
  },

  // ── Data & AI ─────────────────────────────────────────────────────────────
  {
    id: "u-zara", name: "Zara Iqbal", initials: "ZI", role: "employee",
    title: "AI / ML Engineer", departmentId: "d-data", capacityHoursPerWeek: 40,
    skills: ["AI/ML", "Python"],
    expertise: [{ domain: "AI models", depth: 0.82 }],
    timezone: "PKT", location: "Lahore", joinedAt: "2023-06-26", ptoDays: [], accent: "#2DD4BF",
  },
  {
    id: "u-ray", name: "Ray Donnelly", initials: "RD", role: "employee",
    title: "Data Engineer", departmentId: "d-data", capacityHoursPerWeek: 40,
    skills: ["Data Pipelines", "SQL"],
    expertise: [{ domain: "Data pipelines", depth: 0.62 }],
    timezone: "EST", location: "Toronto", joinedAt: "2024-05-06", ptoDays: [], accent: "#FACC15",
  },

  // ── Product ───────────────────────────────────────────────────────────────
  {
    id: "u-yuki", name: "Yuki Tanaka", initials: "YT", role: "employee",
    title: "Product Coordinator", departmentId: "d-ops", capacityHoursPerWeek: 40,
    skills: ["Coordination", "QA"],
    expertise: [{ domain: "Launch coordination", depth: 0.62 }],
    timezone: "JST", location: "Tokyo", joinedAt: "2023-03-13", ptoDays: [], accent: "#4ADE80",
  },
];

export const projects: Project[] = [
  {
    id: "p-atlas", name: "AI Support Chatbot", code: "CHAT",
    description: "Build an AI chatbot that answers customer support questions automatically, so the support team only handles the hard ones.",
    departmentId: "d-eng", ownerId: "u-sarah", status: "ACTIVE", health: "CRITICAL",
    healthReasons: [
      "3 tasks are overdue",
      "The team is overloaded — Sarah and Zara are both over 100% this week",
      "Work is going slower than planned (38% below the usual pace)",
    ],
    budgetHours: 1200, consumedHours: 998, budgetMicro: 180_000_000_000, consumedMicro: 161_400_000_000,
    startDate: "2026-02-02", targetDate: "2026-08-24", customer: "Acme Support", goalId: "g-revenue",
    velocityTrend: [34, 38, 36, 29, 24, 21],
  },
  {
    id: "p-helio", name: "Fitness Mobile App", code: "FIT",
    description: "Build a mobile app where people can log workouts, track progress, and see their stats over time.",
    departmentId: "d-eng", ownerId: "u-asha", status: "ACTIVE", health: "ON_TRACK",
    healthReasons: ["On schedule — all screens and the workout API are on track"],
    budgetHours: 640, consumedHours: 312, budgetMicro: 96_000_000_000, consumedMicro: 47_500_000_000,
    startDate: "2026-04-06", targetDate: "2026-09-28", goalId: "g-expansion",
    velocityTrend: [18, 22, 25, 24, 26, 23],
  },
  {
    id: "p-pulse", name: "Sales Analytics Dashboard", code: "DASH",
    description: "Build a dashboard that shows the sales team their numbers and trends in real time, in plain charts.",
    departmentId: "d-data", ownerId: "u-tomas", status: "ACTIVE", health: "AT_RISK",
    healthReasons: [
      "Just started and has almost no team yet",
      "Several tasks have no one assigned — needs a frontend, a backend, a data engineer, and a designer",
    ],
    budgetHours: 880, consumedHours: 84, budgetMicro: 132_000_000_000, consumedMicro: 12_600_000_000,
    startDate: "2026-06-08", targetDate: "2026-09-11", goalId: "g-ai",
    velocityTrend: [0, 0, 2, 4, 6, 8],
  },
  {
    id: "p-nimbus", name: "Cloud & Deployment Setup", code: "CLOUD",
    description: "Set up the servers, automatic deployments, and monitoring so the apps run reliably and ship safely.",
    departmentId: "d-eng", ownerId: "u-fatima", status: "ACTIVE", health: "DELAYED",
    healthReasons: [
      "The security review is blocked — waiting on the outside vendor",
      "2 setup tasks are behind schedule",
    ],
    budgetHours: 520, consumedHours: 305, budgetMicro: 78_000_000_000, consumedMicro: 46_800_000_000,
    startDate: "2026-01-12", targetDate: "2026-08-07", goalId: "g-trust",
    velocityTrend: [14, 16, 13, 12, 15, 13],
  },
  {
    id: "p-orbit", name: "App Design System", code: "DESIGN",
    description: "Build a set of reusable buttons, forms, and tables so every app looks the same and gets built faster.",
    departmentId: "d-design", ownerId: "u-lena", status: "ACTIVE", health: "ON_TRACK",
    healthReasons: ["On track — most core components are built and in review"],
    budgetHours: 400, consumedHours: 238, budgetMicro: 56_000_000_000, consumedMicro: 33_000_000_000,
    startDate: "2026-02-23", targetDate: "2026-07-31", goalId: "g-expansion",
    velocityTrend: [12, 13, 15, 14, 16, 16],
  },
  {
    id: "p-quartz", name: "Online Store", code: "SHOP",
    description: "Build an online store where customers can browse products, add them to a cart, and pay.",
    departmentId: "d-ops", ownerId: "u-marcus", status: "PLANNING", health: "ON_TRACK",
    healthReasons: ["Kickoff scheduled — team being lined up"],
    budgetHours: 360, consumedHours: 18, budgetMicro: 54_000_000_000, consumedMicro: 2_700_000_000,
    startDate: "2026-06-22", targetDate: "2026-10-16", customer: "Meridian Retail", goalId: "g-expansion",
    velocityTrend: [0, 0, 0, 0, 1, 3],
  },
];

// ---- Tasks ------------------------------------------------------------------
let T = 0;
const t = (
  p: Partial<Task> & Pick<Task, "title" | "projectId" | "status" | "priority" | "estimatedHours" | "dueDate" | "weekStart">
): Task => ({
  id: `t-${++T}`,
  loggedHours: 0,
  labels: [],
  dependsOn: [],
  ...p,
});

export const tasks: Task[] = [
  // ── AI Support Chatbot (CHAT) — overloaded, on fire ───────────────────────
  // t-1
  t({ title: "Build the chat window UI", projectId: "p-atlas", assigneeId: "u-diego", status: "IN_PROGRESS", priority: "HIGH", estimatedHours: 12, loggedHours: 7, dueDate: days(2), weekStart: WEEKS[0], labels: ["frontend"], subtasks: { done: 4, total: 7 } }),
  // t-2
  t({ title: "Build the message API", projectId: "p-atlas", assigneeId: "u-sarah", status: "IN_PROGRESS", priority: "URGENT", estimatedHours: 14, loggedHours: 9, dueDate: days(-1), weekStart: WEEKS[0], labels: ["backend"] }),
  // t-3 — the relief task: backend work sitting on an overloaded lead, perfect for Ahmed
  t({ title: "Set up the chatbot database", projectId: "p-atlas", assigneeId: "u-sarah", status: "TO_DO", priority: "HIGH", estimatedHours: 9, dueDate: days(4), weekStart: WEEKS[0], labels: ["backend", "database"] }),
  // t-4 — blocked: the model can't finish training until the database (t-3) is ready
  t({ title: "Train the AI reply model", projectId: "p-atlas", assigneeId: "u-zara", status: "BLOCKED", priority: "URGENT", estimatedHours: 16, loggedHours: 10, dueDate: days(1), weekStart: WEEKS[0], labels: ["ai"], dependsOn: ["t-3"] }),
  // t-5
  t({ title: "Connect the chatbot to live chat", projectId: "p-atlas", assigneeId: "u-ahmed", status: "IN_PROGRESS", priority: "HIGH", estimatedHours: 10, loggedHours: 4, dueDate: days(5), weekStart: WEEKS[0], labels: ["backend"] }),
  // t-6
  t({ title: "Add typing indicators and read receipts", projectId: "p-atlas", assigneeId: "u-diego", status: "TO_DO", priority: "MEDIUM", estimatedHours: 8, dueDate: days(8), weekStart: WEEKS[1], labels: ["frontend"], dependsOn: ["t-1"] }),
  // t-7
  t({ title: "Test the chatbot's answers for accuracy", projectId: "p-atlas", assigneeId: "u-jonas", status: "TO_DO", priority: "HIGH", estimatedHours: 10, dueDate: days(6), weekStart: WEEKS[0], labels: ["testing"], dependsOn: ["t-4"] }),
  // t-8
  t({ title: "Handle messages the AI isn't sure about", projectId: "p-atlas", assigneeId: "u-zara", status: "TO_DO", priority: "HIGH", estimatedHours: 12, dueDate: days(9), weekStart: WEEKS[1], labels: ["ai"] }),
  // t-9
  t({ title: "Write the launch checklist", projectId: "p-atlas", assigneeId: "u-sarah", status: "TO_DO", priority: "MEDIUM", estimatedHours: 6, dueDate: days(7), weekStart: WEEKS[1], labels: ["launch"] }),

  // ── Fitness Mobile App (FIT) — healthy ────────────────────────────────────
  // t-10
  t({ title: "Build the workout home screen", projectId: "p-helio", assigneeId: "u-diego", status: "IN_PROGRESS", priority: "HIGH", estimatedHours: 10, loggedHours: 3, dueDate: days(6), weekStart: WEEKS[0], labels: ["frontend"] }),
  // t-11
  t({ title: "Build the workout tracking API", projectId: "p-helio", assigneeId: "u-mei", status: "IN_PROGRESS", priority: "HIGH", estimatedHours: 12, loggedHours: 6, dueDate: days(5), weekStart: WEEKS[0], labels: ["backend"] }),
  // t-12
  t({ title: "Sync workouts across devices", projectId: "p-helio", assigneeId: "u-mei", status: "TO_DO", priority: "MEDIUM", estimatedHours: 10, dueDate: days(12), weekStart: WEEKS[1], labels: ["backend"], dependsOn: ["t-11"] }),
  // t-13
  t({ title: "Design the progress charts", projectId: "p-helio", assigneeId: "u-kofi", status: "REVIEW", priority: "MEDIUM", estimatedHours: 6, loggedHours: 6, dueDate: days(1), weekStart: WEEKS[0], labels: ["design"] }),
  // t-14
  t({ title: "Test the workout data is accurate", projectId: "p-helio", assigneeId: "u-jonas", status: "TO_DO", priority: "MEDIUM", estimatedHours: 7, dueDate: days(13), weekStart: WEEKS[1], labels: ["testing"] }),

  // ── Sales Analytics Dashboard (DASH) — understaffed, needs people ──────────
  // t-15 — unassigned, needs a frontend engineer
  t({ title: "Build the dashboard layout", projectId: "p-pulse", status: "TO_DO", priority: "HIGH", estimatedHours: 12, dueDate: days(9), weekStart: WEEKS[1], labels: ["frontend"] }),
  // t-16 — unassigned, needs a data engineer (→ Ray)
  t({ title: "Build the sales data pipeline", projectId: "p-pulse", status: "TO_DO", priority: "HIGH", estimatedHours: 14, dueDate: days(10), weekStart: WEEKS[1], labels: ["data"] }),
  // t-17 — unassigned, needs a designer
  t({ title: "Design the dashboard charts", projectId: "p-pulse", status: "BACKLOG", priority: "MEDIUM", estimatedHours: 8, dueDate: days(14), weekStart: WEEKS[2], labels: ["design"] }),
  // t-18 — Ray has made a start; he has room for more
  t({ title: "Connect the dashboard to the database", projectId: "p-pulse", assigneeId: "u-ray", status: "IN_PROGRESS", priority: "MEDIUM", estimatedHours: 8, loggedHours: 2, dueDate: days(11), weekStart: WEEKS[0], labels: ["data"] }),
  // t-19 — unassigned backlog
  t({ title: "Set up the daily sales report", projectId: "p-pulse", status: "BACKLOG", priority: "LOW", estimatedHours: 6, dueDate: days(20), weekStart: WEEKS[2], labels: ["data"] }),

  // ── Cloud & Deployment Setup (CLOUD) — delayed ────────────────────────────
  // t-20
  t({ title: "Set up the production servers", projectId: "p-nimbus", assigneeId: "u-fatima", status: "IN_PROGRESS", priority: "HIGH", estimatedHours: 10, loggedHours: 5, dueDate: days(3), weekStart: WEEKS[0], labels: ["devops"] }),
  // t-21
  t({ title: "Set up automatic deployments (CI/CD)", projectId: "p-nimbus", assigneeId: "u-fatima", status: "TO_DO", priority: "HIGH", estimatedHours: 8, dueDate: days(8), weekStart: WEEKS[1], labels: ["devops"] }),
  // t-22
  t({ title: "Add server monitoring and alerts", projectId: "p-nimbus", assigneeId: "u-fatima", status: "TO_DO", priority: "MEDIUM", estimatedHours: 7, dueDate: days(12), weekStart: WEEKS[1], labels: ["devops"] }),
  // t-23
  t({ title: "Set up automatic database backups", projectId: "p-nimbus", assigneeId: "u-elias", status: "COMPLETED", priority: "MEDIUM", estimatedHours: 5, loggedHours: 5, dueDate: days(-4), weekStart: WEEKS[0] }),
  // t-24 — blocked on the vendor (drives the risk story)
  t({ title: "Security review of the cloud setup", projectId: "p-nimbus", assigneeId: "u-elias", status: "BLOCKED", priority: "HIGH", estimatedHours: 6, loggedHours: 1, dueDate: days(-2), weekStart: WEEKS[0], labels: ["security", "vendor"] }),

  // ── App Design System (DESIGN) — healthy ──────────────────────────────────
  // t-25
  t({ title: "Build the button and input components", projectId: "p-orbit", assigneeId: "u-kofi", status: "REVIEW", priority: "HIGH", estimatedHours: 8, loggedHours: 8, dueDate: days(1), weekStart: WEEKS[0], labels: ["design"] }),
  // t-26
  t({ title: "Build the data table component", projectId: "p-orbit", assigneeId: "u-kofi", status: "TO_DO", priority: "MEDIUM", estimatedHours: 8, dueDate: days(10), weekStart: WEEKS[1], labels: ["design"] }),
  // t-27
  t({ title: "Write the component usage guide", projectId: "p-orbit", assigneeId: "u-ines", status: "IN_PROGRESS", priority: "LOW", estimatedHours: 6, loggedHours: 2, dueDate: days(14), weekStart: WEEKS[1], labels: ["docs"] }),

  // ── Online Store (SHOP) — planning, unstaffed ─────────────────────────────
  // t-28
  t({ title: "Build the product pages", projectId: "p-quartz", status: "BACKLOG", priority: "MEDIUM", estimatedHours: 10, dueDate: days(24), weekStart: WEEKS[3], labels: ["frontend"] }),
  // t-29
  t({ title: "Build the shopping cart", projectId: "p-quartz", status: "BACKLOG", priority: "MEDIUM", estimatedHours: 10, dueDate: days(28), weekStart: WEEKS[4], labels: ["frontend"] }),

  // t-30 — unstaffed backend work on the Dashboard (appended so existing task ids
  // stay stable). A backend engineer with room (e.g. Ahmed) can pick this up.
  t({ title: "Build the dashboard API", projectId: "p-pulse", status: "TO_DO", priority: "MEDIUM", estimatedHours: 8, dueDate: days(12), weekStart: WEEKS[1], labels: ["backend"] }),

  // t-31 — a deliverable waiting on the customer's sign-off (drives the client
  // portal's Approvals section). Acme can approve it, which completes it live.
  t({ title: "Review & approve the chat screens", projectId: "p-atlas", assigneeId: "u-diego", status: "CLIENT_REVIEW", priority: "MEDIUM", estimatedHours: 4, loggedHours: 4, dueDate: days(2), weekStart: WEEKS[0], labels: ["design"] }),

  // t-32..t-34 — a fuller plate for Ahmed (the employee demo login) so the Home
  // and Tasks views are populated across Today / Pending / Critical.
  t({ title: "Fix the message delivery bug", projectId: "p-atlas", assigneeId: "u-ahmed", status: "IN_PROGRESS", priority: "URGENT", estimatedHours: 6, loggedHours: 2, dueDate: days(-1), weekStart: WEEKS[0], labels: ["backend"] }),
  t({ title: "Add login to the chatbot", projectId: "p-atlas", assigneeId: "u-ahmed", status: "TO_DO", priority: "HIGH", estimatedHours: 8, dueDate: days(3), weekStart: WEEKS[0], labels: ["backend"] }),
  t({ title: "Write the chatbot API docs", projectId: "p-atlas", assigneeId: "u-ahmed", status: "TO_DO", priority: "MEDIUM", estimatedHours: 5, dueDate: days(6), weekStart: WEEKS[1], labels: ["backend", "docs"] }),
];

// ---- Capacity grid -----------------------------------------------------------
// Hand-tuned so the story is visible at a glance:
//   • Sarah & Zara are over 100% (overloaded, red) — the Chatbot is on fire.
//   • Ahmed has clear headroom (~65%) — the right person to take Sarah's task.
//   • Ray (~45%) & Inés (~50%) are underloaded — free for the Dashboard.
const cap = (employeeId: string, hours: number[], logged?: number[]): CapacityCell[] =>
  hours.map((h, i) => ({
    employeeId,
    weekStart: WEEKS[i],
    allocatedHours: h,
    loggedHours: logged?.[i] ?? Math.max(0, Math.round(h * (i === 0 ? 0.55 : 0))),
  }));

export const capacity: CapacityCell[] = [
  ...cap("u-sarah", [46, 44, 40, 32, 28, 24]),   // 115% — overloaded
  ...cap("u-zara", [44, 42, 38, 30, 26, 22]),    // 110% — overloaded
  ...cap("u-diego", [38, 36, 34, 28, 24, 20]),   // 95%  — near limit
  ...cap("u-jonas", [34, 32, 30, 26, 22, 18]),   // 85%
  ...cap("u-fatima", [33, 34, 30, 24, 18, 14]),  // 82%
  ...cap("u-mei", [30, 30, 32, 26, 22, 18]),     // 75%
  ...cap("u-kofi", [28, 27, 26, 22, 18, 14]),    // 70%
  ...cap("u-ahmed", [26, 28, 30, 28, 22, 18]),   // 65% — headroom (relief target)
  ...cap("u-yuki", [20, 22, 24, 20, 16, 12]),    // 50%
  ...cap("u-ines", [16, 18, 20, 18, 14, 10]),    // 50% (cap 32) — underloaded
  ...cap("u-ray", [18, 20, 24, 22, 18, 14]),     // 45% — underloaded (→ Dashboard)
  ...cap("u-asha", [26, 24, 22, 20, 18, 16]),
  ...cap("u-priya", [24, 22, 20, 18, 16, 14]),
  ...cap("u-lena", [24, 22, 20, 18, 16, 14]),
  ...cap("u-tomas", [26, 24, 22, 20, 18, 16]),
  ...cap("u-marcus", [22, 20, 18, 16, 14, 12]),
  ...cap("u-elias", [20, 22, 24, 18, 14, 10]),
  ...cap("u-noor", [14, 12, 10, 10, 8, 8]),
];

// ---- Risks -------------------------------------------------------------------
export const risks: Risk[] = [
  {
    id: "r-1", title: "Only one person knows how the AI model works",
    category: "people", probability: "high", impact: "critical",
    ownerId: "u-tomas", projectId: "p-atlas",
    mitigationPlan: "Have Zara write down how the model is built and trained, and pair another engineer with her before launch.",
    mitigationStatus: "in_progress", status: "MITIGATING", createdAt: "2026-05-21",
    signals: ["Zara is the only person who can train the model", "She is overloaded at 110% this week", "If she's out, the Chatbot stalls"],
  },
  {
    id: "r-2", title: "Cloud security vendor is running late",
    category: "vendor", probability: "high", impact: "high",
    ownerId: "u-marcus", projectId: "p-nimbus",
    mitigationPlan: "Escalate to the vendor's manager and line up a backup vendor in case they slip again.",
    mitigationStatus: "in_progress", status: "ESCALATED", createdAt: "2026-06-02",
    signals: ["Security review has been blocked for 2 days", "The vendor missed the agreed start date"],
  },
  {
    id: "r-3", title: "The Sales Dashboard has no team yet",
    category: "operational", probability: "high", impact: "high",
    ownerId: "u-asha", projectId: "p-pulse",
    mitigationPlan: "Assign the 3 unassigned tasks to people with free time: Ray for the data pipeline, plus a frontend and a designer.",
    mitigationStatus: "not_started", status: "OPEN", createdAt: "2026-06-12",
    signals: ["3 tasks have no owner", "Only Ray is working on it part-time", "Deadline is Sep 11"],
  },
  {
    id: "r-4", title: "Sarah is overloaded and hasn't taken a break",
    category: "people", probability: "high", impact: "high",
    ownerId: "u-priya", projectId: "p-atlas",
    mitigationPlan: "Move some of Sarah's work to Ahmed and make sure she takes time off after the launch.",
    mitigationStatus: "in_progress", status: "MITIGATING", createdAt: "2026-05-28",
    signals: ["Sarah is at 115% this week", "No time off in 112 days", "She owns the most critical Chatbot work"],
  },
  {
    id: "r-5", title: "AI running costs are creeping above budget",
    category: "financial", probability: "low", impact: "medium",
    ownerId: "u-tomas", projectId: "p-atlas",
    mitigationPlan: "Cache common answers and set a daily spending alert at 80% of the limit.",
    mitigationStatus: "complete", status: "MONITORING", createdAt: "2026-04-30",
    signals: ["Daily AI spend peaked at $11.40 of a $15 limit", "Caching keeps most answers cheap"],
  },
  {
    id: "r-6", title: "The chatbot could leak customer information",
    category: "security", probability: "low", impact: "critical",
    ownerId: "u-elias", projectId: "p-atlas",
    mitigationPlan: "Strip personal details before they reach the AI, and review what the chatbot is allowed to say.",
    mitigationStatus: "in_progress", status: "OPEN", createdAt: "2026-06-07",
    signals: ["Chat messages may contain personal data", "No review yet of what the AI can repeat back"],
  },
];

// ---- Decisions ----------------------------------------------------------------
export const decisions: Decision[] = [
  {
    id: "dec-1", title: "Build the chatbot UI and the AI model at the same time",
    context: "We could build the chat screen first and add the AI later, or build both at once to hit the August launch.",
    chosenOption: "Build both at the same time",
    rationale: "The launch date is tight. Building them in parallel is the only way to make August, as long as the two teams sync weekly.",
    optionsConsidered: [
      { option: "UI first, AI later", pros: "Simpler to manage", cons: "Misses the August launch" },
      { option: "Both at once", pros: "Hits the deadline", cons: "Needs tight coordination" },
    ],
    confidence: "high", ownerId: "u-sarah", projectId: "p-atlas", status: "ACTIVE",
    decidedAt: "2026-03-04", expectedOutcome: "Chatbot ready to launch in August",
    actualOutcome: "On track so far, but the team is stretched thin", linkedRiskIds: ["r-4"],
  },
  {
    id: "dec-2", title: "Use one shared design system across all our apps",
    context: "Each app was getting its own buttons and forms, which was slow and looked inconsistent.",
    chosenOption: "Build one shared component library",
    rationale: "Reusing the same components makes every app faster to build and look consistent.",
    optionsConsidered: [
      { option: "Each app builds its own", pros: "No upfront work", cons: "Slow and inconsistent" },
      { option: "One shared library", pros: "Faster, consistent", cons: "Some upfront work" },
    ],
    confidence: "high", ownerId: "u-lena", projectId: "p-orbit", status: "ACTIVE",
    decidedAt: "2026-04-15", expectedOutcome: "New screens built 30% faster", linkedRiskIds: [],
  },
  {
    id: "dec-3", title: "AI helpers can only suggest changes — people approve them",
    context: "The AI helpers could change tasks and assignments on their own, or just suggest changes for a manager to approve.",
    chosenOption: "Suggestions only, with human approval",
    rationale: "Managers need to trust the system. The AI suggests; a person always makes the final call.",
    optionsConsidered: [
      { option: "AI changes things directly", pros: "Faster", cons: "Managers lose trust on the first mistake" },
      { option: "AI suggests, human approves", pros: "Safe and trusted", cons: "Slightly slower" },
    ],
    confidence: "high", ownerId: "u-noor", status: "ACTIVE",
    decidedAt: "2026-05-09", expectedOutcome: "Managers accept over 60% of suggestions", linkedRiskIds: ["r-3"],
  },
  {
    id: "dec-4", title: "Start the Sales Dashboard now, even with a small team",
    context: "The sales team needs this dashboard, but most engineers are on the Chatbot.",
    chosenOption: "Start now with Ray, staff up soon",
    rationale: "Getting the data pipeline started early de-risks the deadline; we add a frontend and designer as people free up.",
    optionsConsidered: [
      { option: "Wait until the Chatbot ships", pros: "Full team available", cons: "Misses the Sep deadline" },
      { option: "Start now, small", pros: "Keeps the deadline alive", cons: "Understaffed at first" },
    ],
    confidence: "medium", ownerId: "u-asha", projectId: "p-pulse", status: "APPROVED",
    decidedAt: "2026-06-08", expectedOutcome: "Dashboard ready by September", linkedRiskIds: ["r-3"],
  },
  {
    id: "dec-5", title: "Ship the Fitness App without offline mode first",
    context: "Offline mode is hard to build. We could delay launch for it, or ship without it and add it later.",
    chosenOption: "Ship online-only first",
    rationale: "Most users have a connection at the gym. We can add offline mode after launch based on real feedback.",
    optionsConsidered: [
      { option: "Build offline mode now", pros: "Complete on day one", cons: "Months of extra work" },
      { option: "Ship online-only", pros: "Launch sooner", cons: "Some users want offline" },
    ],
    confidence: "high", ownerId: "u-marcus", projectId: "p-helio", status: "ACTIVE",
    decidedAt: "2026-05-27", expectedOutcome: "Fitness App launches on time", linkedRiskIds: [],
  },
];

// ---- Agent proposals (negotiation inbox) ---------------------------------------
export const proposals: Proposal[] = [
  {
    id: "pr-1", agentType: "burnout_safety",
    title: "Move a task off Sarah — she's overloaded",
    summary: "Move 'Set up the chatbot database' (9h) from Sarah to Ahmed. Sarah drops 115% → 92%; Ahmed rises 65% → 87%. Both do backend work, so it's a clean fit.",
    reasoning: [
      "Sarah is at 115% this week — over the safe limit (rule · 98%)",
      "She hasn't taken time off in 112 days (rule · 96%)",
      "Ahmed has the same skills (Backend, Databases) and room to spare (skill-match 0.95 · 90%)",
      "Ahmed has no time off booked this week (calendar · checked)",
    ],
    action: { kind: "reallocate", taskId: "t-3", fromEmployeeId: "u-sarah", toEmployeeId: "u-ahmed", deltaHours: 9, projectId: "p-atlas" },
    confidence: 0.92, priority: 100, entityLabel: "Sarah Okafor · Chatbot",
    visibility: ["project_manager", "dept_head"], subjectId: "u-sarah",
    status: "pending", createdAt: "2026-06-10T05:40:00Z", expiresAt: "2026-06-12T05:40:00Z",
    conflict: {
      withAgent: "delivery_critical",
      resolution:
        "The delivery helper wanted to add more work to Sarah for the launch. The coordinator chose the safer option: move the database task to Ahmed, and have Mei spend 4h reviewing the launch work instead.",
    },
    validation: [
      { check: "Sarah under 100% after the move", pass: true },
      { check: "No time-off clash for Ahmed", pass: true },
      { check: "Ahmed has the right skills", pass: true },
      { check: "Task isn't blocked by another", pass: true },
    ],
  },
  {
    id: "pr-2", agentType: "delivery_critical",
    title: "Protect the Chatbot launch — add a reviewer",
    summary: "Have Mei spend 4h reviewing 'Build the message API' so it stays on track for launch, without adding more to Sarah's plate.",
    reasoning: [
      "The message API is on the critical path for the August launch (rule · 97%)",
      "Work is going 38% slower than usual — no slack left (stats · 88%)",
      "Mei knows backend well and has room this week (rule · 93%)",
    ],
    action: { kind: "reallocate", taskId: "t-2", toEmployeeId: "u-mei", deltaHours: 4, projectId: "p-atlas" },
    confidence: 0.87, priority: 70, entityLabel: "Chatbot critical path",
    visibility: ["project_manager", "dept_head"], subjectId: "u-mei",
    status: "pending", createdAt: "2026-06-10T05:41:00Z", expiresAt: "2026-06-12T05:41:00Z",
    validation: [
      { check: "Mei under 100% after +4h", pass: true },
      { check: "Review won't overload the queue", pass: true },
    ],
  },
  {
    id: "pr-3", agentType: "risk_advisory",
    title: "Escalate the late cloud security vendor",
    summary: "The security review has been blocked for 2 days because the vendor is late. Recommend escalating to the vendor's manager and starting a backup plan.",
    reasoning: [
      "The task has been blocked longer than 2 days (rule · 95%)",
      "A similar vendor delay last year only moved after we escalated (memory · 72%)",
    ],
    action: { kind: "escalate", projectId: "p-nimbus" },
    confidence: 0.78, priority: 40, entityLabel: "Vendor: SecureCloud Ltd",
    visibility: ["project_manager", "dept_head", "executive"],
    status: "pending", createdAt: "2026-06-09T16:02:00Z", expiresAt: "2026-06-11T16:02:00Z",
    validation: [{ check: "There's someone to escalate to (Marcus Bell)", pass: true }],
  },
  {
    id: "pr-4", agentType: "allocation_optimize",
    title: "Even out Jonas's testing load",
    summary: "Move 'Test the workout data is accurate' (7h) to next week. Jonas stays under 100% and the Fitness App has plenty of time before its deadline.",
    reasoning: [
      "Jonas would tip over 100% if both test tasks land in the same week (rule · 94%)",
      "The Fitness App test has 13 days of slack (schedule · 90%)",
    ],
    action: { kind: "shift_deadline", taskId: "t-14", deltaHours: 0, projectId: "p-helio" },
    confidence: 0.83, priority: 50, entityLabel: "Jonas Weber · Testing",
    visibility: ["project_manager", "dept_head"], subjectId: "u-jonas",
    status: "pending", createdAt: "2026-06-09T11:20:00Z", expiresAt: "2026-06-11T11:20:00Z",
    validation: [
      { check: "Nothing else depends on this task", pass: true },
      { check: "Deadline still met after the shift", pass: true },
    ],
  },
  {
    id: "pr-5", agentType: "allocation_optimize",
    title: "Staff the Sales Dashboard — assign the data pipeline to Ray",
    summary: "The Dashboard needs a data engineer for 'Build the sales data pipeline'. Best match: Ray (data skills, only 45% loaded — the most free). He's already on this project.",
    reasoning: [
      "The task has had no owner for several days and the deadline is close (rule · 92%)",
      "Ray has data pipeline skills and the most free time (skill-match · 89%)",
      "He's already working on the Dashboard, so there's no ramp-up (context · 85%)",
    ],
    action: { kind: "reallocate", taskId: "t-16", toEmployeeId: "u-ray", deltaHours: 14, projectId: "p-pulse" },
    confidence: 0.86, priority: 60, entityLabel: "Sales Dashboard · understaffed",
    visibility: ["project_manager", "dept_head"], subjectId: "u-ray",
    status: "pending", createdAt: "2026-06-10T09:15:00Z", expiresAt: "2026-06-13T09:15:00Z",
    validation: [
      { check: "Ray under 100% after the work", pass: true },
      { check: "Ray has the right skills", pass: true },
    ],
  },
  {
    id: "pr-6", agentType: "burnout_safety",
    title: "Reminder: Sarah hasn't taken time off in 112 days",
    summary: "Suggest her manager brings up time off in their next 1:1. No task change attached.",
    reasoning: ["No time off in over 90 days — past the healthy limit (rule · 99%)"],
    action: { kind: "reduce_load" },
    confidence: 0.95, priority: 100, entityLabel: "Sarah Okafor",
    visibility: ["project_manager", "dept_head"], subjectId: "u-sarah",
    status: "rejected", createdAt: "2026-06-03T07:30:00Z", expiresAt: "2026-06-05T07:30:00Z",
    validation: [{ check: "Sent privately to the manager", pass: true }],
  },

  // ---- employee-facing requests (personal scope: subjectId is the viewer) ----
  {
    id: "pr-7", agentType: "allocation_optimize",
    title: "Incoming task: 'Set up the chatbot database' (9h) — can you take it?",
    summary: "Your manager wants to move this task from Sarah to you. Accepting confirms you have room; flagging sends it back with your reason.",
    reasoning: [
      "Your load goes from 65% to 87% if you accept (rule · 96%)",
      "It matches your skills: Backend and Databases (skill-match 0.95 · 90%)",
      "No clash with your time off this week (calendar · checked)",
    ],
    action: { kind: "reallocate", taskId: "t-3", toEmployeeId: "u-ahmed", deltaHours: 9, projectId: "p-atlas" },
    confidence: 0.9, priority: 70, entityLabel: "Your week · Chatbot",
    visibility: ["employee"], subjectId: "u-ahmed",
    status: "pending", createdAt: "2026-06-10T06:05:00Z", expiresAt: "2026-06-12T06:05:00Z",
    validation: [
      { check: "You stay under 90% after taking it", pass: true },
      { check: "No clash with your other Chatbot deadline", pass: true },
    ],
  },
  {
    id: "pr-8", agentType: "burnout_safety",
    title: "Block focus time before your deadline",
    summary: "Your task 'Connect the chatbot to live chat' (10h) is due soon. The helper suggests blocking Thursday morning — your calendar is free then.",
    reasoning: [
      "Deadline is within a few working days with hours still left (rule · 93%)",
      "You finish faster in blocked, meeting-free time (memory · 76%)",
    ],
    action: { kind: "reduce_load", taskId: "t-5", projectId: "p-atlas" },
    confidence: 0.79, priority: 50, entityLabel: "Your focus · Chatbot",
    visibility: ["employee"], subjectId: "u-ahmed",
    status: "pending", createdAt: "2026-06-10T07:10:00Z", expiresAt: "2026-06-13T07:10:00Z",
    validation: [{ check: "The block fits in your working hours", pass: true }],
  },

  // ---- admin-only governance queue ------------------------------------------
  {
    id: "pr-9", agentType: "risk_advisory",
    title: "Approve access: audit-log export for Priya",
    summary: "Priya (Head of Engineering) asked for permission to export the audit log for the security review. The access turns off automatically on Aug 31.",
    reasoning: [
      "The request matches an active security task (rule · 97%)",
      "It's export-only — she can't change or delete anything (policy · 100%)",
    ],
    action: { kind: "escalate" },
    confidence: 0.92, priority: 80, entityLabel: "Access request · governance",
    visibility: ["admin"],
    status: "pending", createdAt: "2026-06-10T04:30:00Z", expiresAt: "2026-06-14T04:30:00Z",
    validation: [
      { check: "Access expires automatically (Aug 31)", pass: true },
      { check: "No permanent permission increase", pass: true },
    ],
  },
  {
    id: "pr-10", agentType: "risk_advisory",
    title: "Suspicious login: sign out Ray's old session",
    summary: "Ray is logged in from two places at once (Chrome/Windows and Safari/Mac, 40 min apart, different cities). The rule is one session at a time, so the older one should be signed out.",
    reasoning: [
      "The two logins are too far apart to be the same person travelling (rule · 99%)",
      "One-session-at-a-time is a hard security rule (policy · 100%)",
    ],
    action: { kind: "escalate" },
    confidence: 0.97, priority: 100, entityLabel: "Login security · Ray",
    visibility: ["admin"],
    status: "pending", createdAt: "2026-06-10T08:55:00Z", expiresAt: "2026-06-10T20:55:00Z",
    validation: [{ check: "The newer session stays signed in", pass: true }],
  },
];

// ---- Goals, commitments, audit, notifications ----------------------------------
export const goals: Goal[] = [
  {
    id: "g-revenue", title: "Launch the AI Support Chatbot by August", ownerId: "u-noor",
    progress: 0.62, targetDate: "2026-08-31",
    keyResults: [
      { title: "Chatbot answers real customer questions", progress: 0.55 },
      { title: "Support team's workload drops by 30%", progress: 0.4 },
      { title: "Acme Support signs off on launch", progress: 0.9 },
    ],
  },
  {
    id: "g-expansion", title: "Ship the Fitness App and start the Online Store", ownerId: "u-marcus",
    progress: 0.41, targetDate: "2026-10-30",
    keyResults: [
      { title: "Fitness App live in the app stores", progress: 0.48 },
      { title: "Online Store team staffed and kicked off", progress: 0.1 },
      { title: "Design system used by both apps", progress: 0.65 },
    ],
  },
  {
    id: "g-ai", title: "Make the chatbot answer 80% of questions correctly", ownerId: "u-tomas",
    progress: 0.7, targetDate: "2026-09-15",
    keyResults: [
      { title: "AI model trained on real support chats", progress: 0.85 },
      { title: "Chatbot replies in under 3 seconds", progress: 0.75 },
      { title: "Managers accept over 60% of AI suggestions", progress: 0.5 },
    ],
  },
  {
    id: "g-trust", title: "Make the cloud setup secure and reliable", ownerId: "u-priya",
    progress: 0.58, targetDate: "2026-08-31",
    keyResults: [
      { title: "Automatic deployments working", progress: 0.9 },
      { title: "Security review passed", progress: 0.2 },
      { title: "Monitoring and backups in place", progress: 0.65 },
    ],
  },
];

export const commitments: Commitment[] = [
  { id: "c-1", title: "Send Sarah the chatbot launch requirements", ownerId: "u-marcus", toId: "u-sarah", dueDate: days(-2), status: "overdue", source: "Chatbot planning · Jun 2" },
  { id: "c-2", title: "Write down how the message API works", ownerId: "u-sarah", toId: "u-priya", dueDate: days(2), status: "in_progress", source: "Risk review · May 21" },
  { id: "c-3", title: "Staff the Sales Dashboard team", ownerId: "u-asha", toId: "u-tomas", dueDate: days(1), status: "open", source: "Dashboard kickoff · Jun 8" },
  { id: "c-4", title: "Get a new timeline from the cloud security vendor", ownerId: "u-fatima", toId: "u-marcus", dueDate: days(0), status: "in_progress", source: "Cloud weekly · Jun 5" },
  { id: "c-5", title: "Next month's staffing plan", ownerId: "u-asha", toId: "u-noor", dueDate: days(5), status: "open", source: "Weekly review · Jun 6" },
];

export const auditEvents: AuditEvent[] = [
  { id: "a-1", actorId: "u-asha", actorRole: "project_manager", actionType: "task_reallocated", entityType: "task", entityLabel: "Connect the dashboard to the database", detail: "Assigned to Ray Donnelly to get the Sales Dashboard started.", at: "2026-06-10T06:12:00Z" },
  { id: "a-2", actorId: "u-asha", actorRole: "project_manager", actionType: "capacity_override", entityType: "employee", entityLabel: "Jonas Weber", detail: "Allowed Jonas to go to 102% for one week.", overrideReason: "A release test couldn't wait until after the code freeze.", at: "2026-06-09T14:03:00Z" },
  { id: "a-3", actorId: "u-elias", actorRole: "admin", actionType: "session_revoked", entityType: "session", entityLabel: "Ray · Chrome/Windows", detail: "Signed out an older session after a login from a second location.", at: "2026-06-09T08:47:00Z" },
  { id: "a-4", actorId: "u-priya", actorRole: "dept_head", actionType: "risk_escalated", entityType: "risk", entityLabel: "Cloud security vendor is running late", detail: "Raised the vendor delay to leadership.", at: "2026-06-08T17:25:00Z" },
  { id: "a-5", actorId: "u-sarah", actorRole: "team_lead", actionType: "decision_recorded", entityType: "decision", entityLabel: "Build the chatbot UI and AI model at the same time", detail: "Noted that the team is on track but stretched thin.", at: "2026-06-08T10:11:00Z" },
  { id: "a-6", actorId: "u-marcus", actorRole: "dept_head", actionType: "project_status_changed", entityType: "project", entityLabel: "Online Store", detail: "Created the project in planning.", at: "2026-06-06T09:30:00Z" },
  { id: "a-7", actorId: "u-elias", actorRole: "admin", actionType: "role_changed", entityType: "user", entityLabel: "Ray Donnelly", detail: "Gave Ray write access to the sales data pipeline.", at: "2026-06-05T13:55:00Z" },
];

export const notifications: NotificationItem[] = [
  { id: "n-1", klass: "hard_stop", title: "Capacity limit reached", body: "Moving this task would push Jonas to 109% next week — you'll need to give a reason to override.", at: "2026-06-10T06:05:00Z", read: false, entityRef: "/capacity" },
  { id: "n-2", klass: "manager_review", title: "2 suggestions need your review", body: "The safety and delivery helpers agreed on a plan to take work off Sarah.", at: "2026-06-10T05:45:00Z", read: false, entityRef: "/proposals" },
  { id: "n-3", klass: "critical_action", title: "AI Support Chatbot is in trouble", body: "3 tasks overdue · Sarah and Zara are both over 100% · work is going slower than planned.", at: "2026-06-10T05:00:00Z", read: false, entityRef: "/projects/p-atlas" },
  { id: "n-4", klass: "intelligence", title: "Morning brief is ready", body: "1 project in trouble · 2 suggestions waiting · the Sales Dashboard still needs a team.", at: "2026-06-10T04:45:00Z", read: true },
  { id: "n-5", klass: "informational", title: "People are free for new work", body: "Ray (45%) and Inés (50%) have spare time this week — good fit for the Sales Dashboard.", at: "2026-06-10T04:30:00Z", read: false, entityRef: "/capacity" },
  { id: "n-6", klass: "critical_action", title: "A commitment is overdue", body: "Marcus owes Sarah the chatbot launch requirements — 2 days late.", at: "2026-06-10T05:30:00Z", read: false, entityRef: "/commitments" },
  { id: "n-7", klass: "informational", title: "Decision saved", body: "Recorded: build the chatbot UI and AI model at the same time.", at: "2026-06-08T10:12:00Z", read: true, entityRef: "/decisions" },
];

// ---- Lookup helpers -------------------------------------------------------------
export const employeeById = (id?: string) => employees.find((e) => e.id === id);
export const projectById = (id?: string) => projects.find((p) => p.id === id);
export const departmentById = (id?: string) => departments.find((d) => d.id === id);
