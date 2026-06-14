// Seed organizational graph — a believable 18-person product company, June 2026.
// All capacity math follows PRD §3.2: utilization = allocated / capacity_hours_per_week.

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

export const TODAY = "2026-06-10";
export const WEEKS = [
  "2026-06-08",
  "2026-06-15",
  "2026-06-22",
  "2026-06-29",
  "2026-07-06",
  "2026-07-13",
];

export const departments: Department[] = [
  { id: "d-eng", name: "Engineering", headId: "u-priya" },
  { id: "d-design", name: "Design", headId: "u-lena" },
  { id: "d-data", name: "Data & AI", headId: "u-tomas" },
  { id: "d-ops", name: "Client Operations", headId: "u-marcus" },
];

export const employees: Employee[] = [
  {
    id: "u-asha", name: "Asha Venkat", initials: "AV", role: "project_manager",
    title: "Resource Manager", departmentId: "d-eng", capacityHoursPerWeek: 40,
    skills: ["Capacity planning", "Agile", "Stakeholders"],
    expertise: [{ domain: "Delivery orchestration", depth: 0.9 }],
    timezone: "IST", location: "Chennai", joinedAt: "2023-02-13", ptoDays: [], accent: "#00ED82",
  },
  {
    id: "u-priya", name: "Priya Sharma", initials: "PS", role: "dept_head",
    title: "VP Engineering", departmentId: "d-eng", capacityHoursPerWeek: 40,
    skills: ["Architecture", "Org design"],
    expertise: [{ domain: "Platform architecture", depth: 0.95 }],
    timezone: "IST", location: "Bengaluru", joinedAt: "2021-08-02", ptoDays: [], accent: "#2BD9FF",
  },
  {
    id: "u-sarah", name: "Sarah Okafor", initials: "SO", role: "team_lead",
    title: "Payments Lead", departmentId: "d-eng", capacityHoursPerWeek: 40,
    skills: ["Go", "Payments", "PCI-DSS", "Postgres"],
    expertise: [{ domain: "Payments architecture", depth: 0.93 }, { domain: "PCI compliance", depth: 0.78 }],
    timezone: "GMT", location: "London", joinedAt: "2022-04-11", ptoDays: [],
    burnoutFlag: true,
    burnoutSignals: [
      "3 consecutive weeks logged > 50h",
      "No PTO used in 112 days",
      "Utilization ≥ 100% for 9 consecutive days",
    ],
    flightRisk: 0.64, accent: "#EF4444",
  },
  {
    id: "u-ahmed", name: "Ahmed Hassan", initials: "AH", role: "employee",
    title: "Backend Engineer", departmentId: "d-eng", capacityHoursPerWeek: 40,
    skills: ["Go", "Kubernetes", "Postgres", "Payments"],
    expertise: [{ domain: "Billing pipelines", depth: 0.61 }],
    timezone: "CET", location: "Berlin", joinedAt: "2024-01-08", ptoDays: [], accent: "#10B981",
  },
  {
    id: "u-diego", name: "Diego Ruiz", initials: "DR", role: "employee",
    title: "Frontend Engineer", departmentId: "d-eng", capacityHoursPerWeek: 40,
    skills: ["React", "TypeScript", "Design systems"],
    expertise: [{ domain: "Component architecture", depth: 0.72 }],
    timezone: "CST", location: "Mexico City", joinedAt: "2023-09-18", ptoDays: ["2026-06-18", "2026-06-19"], accent: "#38BDF8",
  },
  {
    id: "u-mei", name: "Mei Lin", initials: "ML", role: "employee",
    title: "Senior Backend Engineer", departmentId: "d-eng", capacityHoursPerWeek: 40,
    skills: ["Rust", "Go", "Event streaming", "Fintech"],
    expertise: [{ domain: "Ledger systems", depth: 0.84 }],
    timezone: "SGT", location: "Singapore", joinedAt: "2022-11-01", ptoDays: [], accent: "#F59E0B",
  },
  {
    id: "u-jonas", name: "Jonas Weber", initials: "JW", role: "employee",
    title: "QA Engineer", departmentId: "d-eng", capacityHoursPerWeek: 40,
    skills: ["Playwright", "Load testing", "CI"],
    expertise: [{ domain: "Release verification", depth: 0.66 }],
    timezone: "CET", location: "Munich", joinedAt: "2023-05-22", ptoDays: [],
    burnoutFlag: false, flightRisk: 0.31, accent: "#A78BFA",
  },
  {
    id: "u-fatima", name: "Fatima Zahra", initials: "FZ", role: "employee",
    title: "Platform Engineer", departmentId: "d-eng", capacityHoursPerWeek: 40,
    skills: ["Terraform", "AWS", "Kubernetes", "Security"],
    expertise: [{ domain: "Infrastructure", depth: 0.81 }],
    timezone: "GST", location: "Dubai", joinedAt: "2022-07-04", ptoDays: ["2026-07-06", "2026-07-07", "2026-07-08"], accent: "#34D399",
  },
  {
    id: "u-lena", name: "Lena Novak", initials: "LN", role: "dept_head",
    title: "Head of Design", departmentId: "d-design", capacityHoursPerWeek: 40,
    skills: ["Design systems", "Research"],
    expertise: [{ domain: "Enterprise UX", depth: 0.88 }],
    timezone: "CET", location: "Prague", joinedAt: "2021-10-12", ptoDays: [], accent: "#F472B6",
  },
  {
    id: "u-kofi", name: "Kofi Mensah", initials: "KM", role: "employee",
    title: "Product Designer", departmentId: "d-design", capacityHoursPerWeek: 40,
    skills: ["Figma", "Prototyping", "Data viz"],
    expertise: [{ domain: "Dashboard design", depth: 0.69 }],
    timezone: "GMT", location: "Accra", joinedAt: "2023-12-04", ptoDays: [], accent: "#FB923C",
  },
  {
    id: "u-ines", name: "Inés Castillo", initials: "IC", role: "employee",
    title: "UX Researcher", departmentId: "d-design", capacityHoursPerWeek: 32,
    skills: ["Interviews", "Usability", "Synthesis"],
    expertise: [{ domain: "Field research", depth: 0.74 }],
    timezone: "CET", location: "Madrid", joinedAt: "2024-03-11", ptoDays: [], accent: "#E879F9",
  },
  {
    id: "u-tomas", name: "Tomás Eriksen", initials: "TE", role: "dept_head",
    title: "Head of Data & AI", departmentId: "d-data", capacityHoursPerWeek: 40,
    skills: ["ML systems", "Forecasting"],
    expertise: [{ domain: "Predictive modelling", depth: 0.9 }],
    timezone: "CET", location: "Copenhagen", joinedAt: "2022-01-17", ptoDays: [], accent: "#60A5FA",
  },
  {
    id: "u-zara", name: "Zara Iqbal", initials: "ZI", role: "employee",
    title: "ML Engineer", departmentId: "d-data", capacityHoursPerWeek: 40,
    skills: ["Python", "LLM ops", "Vector search"],
    expertise: [{ domain: "Retrieval systems", depth: 0.77 }],
    timezone: "PKT", location: "Lahore", joinedAt: "2023-06-26", ptoDays: [], accent: "#2DD4BF",
  },
  {
    id: "u-ray", name: "Ray Donnelly", initials: "RD", role: "employee",
    title: "Analytics Engineer", departmentId: "d-data", capacityHoursPerWeek: 40,
    skills: ["dbt", "SQL", "Metrics layer"],
    expertise: [{ domain: "Metrics governance", depth: 0.58 }],
    timezone: "EST", location: "Toronto", joinedAt: "2024-05-06", ptoDays: [], accent: "#FACC15",
  },
  {
    id: "u-marcus", name: "Marcus Bell", initials: "MB", role: "dept_head",
    title: "Director, Client Ops", departmentId: "d-ops", capacityHoursPerWeek: 40,
    skills: ["Accounts", "Escalation", "SLAs"],
    expertise: [{ domain: "Enterprise accounts", depth: 0.85 }],
    timezone: "EST", location: "New York", joinedAt: "2021-06-21", ptoDays: [], accent: "#F87171",
  },
  {
    id: "u-yuki", name: "Yuki Tanaka", initials: "YT", role: "employee",
    title: "Delivery Coordinator", departmentId: "d-ops", capacityHoursPerWeek: 40,
    skills: ["Scheduling", "Client comms"],
    expertise: [{ domain: "Launch coordination", depth: 0.62 }],
    timezone: "JST", location: "Tokyo", joinedAt: "2023-03-13", ptoDays: [], accent: "#4ADE80",
  },
  {
    id: "u-noor", name: "Noor Al-Rashid", initials: "NA", role: "executive",
    title: "Chief Operating Officer", departmentId: "d-ops", capacityHoursPerWeek: 40,
    skills: ["Strategy", "Portfolio"],
    expertise: [{ domain: "Operating cadence", depth: 0.92 }],
    timezone: "GST", location: "Abu Dhabi", joinedAt: "2021-04-05", ptoDays: [], accent: "#C084FC",
  },
  {
    id: "u-elias", name: "Elias Brandt", initials: "EB", role: "admin",
    title: "Systems Administrator", departmentId: "d-eng", capacityHoursPerWeek: 40,
    skills: ["IAM", "Audit", "Provisioning"],
    expertise: [{ domain: "Access governance", depth: 0.7 }],
    timezone: "CET", location: "Oslo", joinedAt: "2022-09-19", ptoDays: [], accent: "#94A3B8",
  },
];

export const projects: Project[] = [
  {
    id: "p-atlas", name: "Atlas Payments Migration", code: "ATL",
    description: "Migrate legacy billing onto the new double-entry ledger with zero-downtime cutover for enterprise accounts.",
    departmentId: "d-eng", ownerId: "u-sarah", status: "ACTIVE", health: "CRITICAL",
    healthReasons: [
      "7 tasks overdue by > 5 days (95% · rule)",
      "QA stage at 112% utilization — review queue blocked (92% · rule)",
      "Velocity 38% below 3-sprint average (88% · statistical)",
      "Vendor settlement-file delivery 8 days late (78% · observed)",
    ],
    budgetHours: 1200, consumedHours: 998, budgetMicro: 180_000_000_000, consumedMicro: 161_400_000_000,
    startDate: "2026-02-02", targetDate: "2026-07-24", customer: "Acme Corp", goalId: "g-revenue",
    velocityTrend: [34, 38, 36, 29, 24, 21],
  },
  {
    id: "p-helio", name: "Helio Client Portal", code: "HEL",
    description: "Sandboxed external portal: milestone timeline, deliverable approvals, client-isolated auth tier.",
    departmentId: "d-eng", ownerId: "u-asha", status: "ACTIVE", health: "AT_RISK",
    healthReasons: [
      "Design handoff slipped 4 days — downstream FE idle risk (90% · rule)",
      "2 of 9 milestone tasks blocked on auth review (86% · rule)",
    ],
    budgetHours: 640, consumedHours: 312, budgetMicro: 96_000_000_000, consumedMicro: 47_500_000_000,
    startDate: "2026-04-06", targetDate: "2026-08-28", customer: "TechCo", goalId: "g-expansion",
    velocityTrend: [18, 22, 25, 24, 26, 23],
  },
  {
    id: "p-pulse", name: "Pulse Intelligence Engine", code: "PLS",
    description: "Hybrid semantic search and causal-signal pipeline powering explanatory dashboards.",
    departmentId: "d-data", ownerId: "u-tomas", status: "ACTIVE", health: "ON_TRACK",
    healthReasons: ["All milestones green · velocity within 6% of plan (97% · rule)"],
    budgetHours: 880, consumedHours: 414, budgetMicro: 132_000_000_000, consumedMicro: 60_900_000_000,
    startDate: "2026-03-16", targetDate: "2026-09-11", goalId: "g-ai",
    velocityTrend: [20, 24, 26, 28, 27, 29],
  },
  {
    id: "p-nimbus", name: "Nimbus Infra Hardening", code: "NMB",
    description: "SOC 2 Type II controls: RLS coverage, vault rotation, single-session enforcement, audit immutability.",
    departmentId: "d-eng", ownerId: "u-fatima", status: "ACTIVE", health: "DELAYED",
    healthReasons: [
      "Pen-test vendor start date moved +2 weeks (93% · observed)",
      "3 compliance tasks overdue (91% · rule)",
    ],
    budgetHours: 520, consumedHours: 305, budgetMicro: 78_000_000_000, consumedMicro: 46_800_000_000,
    startDate: "2026-01-12", targetDate: "2026-08-07", goalId: "g-trust",
    velocityTrend: [14, 16, 13, 12, 15, 13],
  },
  {
    id: "p-orbit", name: "Orbit Design System v2", code: "ORB",
    description: "Token-driven dark design system: dense tables, side panels, motion language, chart kit.",
    departmentId: "d-design", ownerId: "u-lena", status: "ACTIVE", health: "ON_TRACK",
    healthReasons: ["Component coverage 74% vs 70% plan (96% · rule)"],
    budgetHours: 400, consumedHours: 238, budgetMicro: 56_000_000_000, consumedMicro: 33_000_000_000,
    startDate: "2026-02-23", targetDate: "2026-07-31", goalId: "g-expansion",
    velocityTrend: [12, 13, 15, 14, 16, 16],
  },
  {
    id: "p-quartz", name: "Quartz Onboarding Revamp", code: "QRZ",
    description: "Sub-2-hour org onboarding: guided setup, role templates, zero-touch provisioning.",
    departmentId: "d-ops", ownerId: "u-marcus", status: "PLANNING", health: "ON_TRACK",
    healthReasons: ["Kickoff scheduled · staffing confirmed (99% · rule)"],
    budgetHours: 360, consumedHours: 22, budgetMicro: 54_000_000_000, consumedMicro: 3_100_000_000,
    startDate: "2026-06-22", targetDate: "2026-10-16", customer: "Meridian Group", goalId: "g-expansion",
    velocityTrend: [0, 0, 0, 0, 2, 4],
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
  // Atlas (critical) — Sarah overloaded
  t({ title: "Ledger cutover runbook — final review", projectId: "p-atlas", assigneeId: "u-sarah", status: "IN_PROGRESS", priority: "URGENT", estimatedHours: 14, loggedHours: 9, dueDate: "2026-06-12", weekStart: WEEKS[0], labels: ["ledger", "cutover"], subtasks: { done: 5, total: 8 } }),
  t({ title: "Settlement file ingestion — vendor format v3", projectId: "p-atlas", assigneeId: "u-sarah", status: "BLOCKED", priority: "URGENT", estimatedHours: 12, loggedHours: 4, dueDate: "2026-06-11", weekStart: WEEKS[0], labels: ["vendor"], dependsOn: ["t-4"] }),
  t({ title: "Reconciliation engine — penny-drift fix", projectId: "p-atlas", assigneeId: "u-sarah", status: "IN_PROGRESS", priority: "HIGH", estimatedHours: 10, loggedHours: 6, dueDate: "2026-06-13", weekStart: WEEKS[0], labels: ["ledger"] }),
  t({ title: "Vendor settlement spec sign-off", projectId: "p-atlas", assigneeId: "u-marcus", status: "BLOCKED", priority: "URGENT", estimatedHours: 4, loggedHours: 2, dueDate: "2026-06-09", weekStart: WEEKS[0], labels: ["vendor", "external"] }),
  t({ title: "Idempotent retry layer for payment webhooks", projectId: "p-atlas", assigneeId: "u-ahmed", status: "IN_PROGRESS", priority: "HIGH", estimatedHours: 12, loggedHours: 5, dueDate: "2026-06-16", weekStart: WEEKS[0], labels: ["webhooks"] }),
  t({ title: "Double-entry invariant property tests", projectId: "p-atlas", assigneeId: "u-mei", status: "REVIEW", priority: "HIGH", estimatedHours: 8, loggedHours: 8, dueDate: "2026-06-12", weekStart: WEEKS[0], labels: ["ledger", "testing"] }),
  t({ title: "Load test: 5k TPS cutover window", projectId: "p-atlas", assigneeId: "u-jonas", status: "TO_DO", priority: "HIGH", estimatedHours: 10, dueDate: "2026-06-19", weekStart: WEEKS[1], labels: ["testing"], dependsOn: ["t-1"] }),
  t({ title: "Rollback drill — staging full rehearsal", projectId: "p-atlas", assigneeId: "u-jonas", status: "TO_DO", priority: "URGENT", estimatedHours: 8, dueDate: "2026-06-18", weekStart: WEEKS[1], dependsOn: ["t-1", "t-6"] }),
  t({ title: "Enterprise account migration batching", projectId: "p-atlas", assigneeId: "u-mei", status: "TO_DO", priority: "MEDIUM", estimatedHours: 12, dueDate: "2026-06-24", weekStart: WEEKS[2], labels: ["ledger"] }),
  t({ title: "PCI evidence pack refresh", projectId: "p-atlas", assigneeId: "u-sarah", status: "TO_DO", priority: "MEDIUM", estimatedHours: 9, dueDate: "2026-06-17", weekStart: WEEKS[1], labels: ["compliance"] }),
  t({ title: "Acme Corp cutover comms plan", projectId: "p-atlas", assigneeId: "u-yuki", status: "IN_PROGRESS", priority: "MEDIUM", estimatedHours: 6, loggedHours: 2, dueDate: "2026-06-15", weekStart: WEEKS[0], labels: ["client"] }),
  t({ title: "Ledger read-replica failover test", projectId: "p-atlas", status: "BACKLOG", priority: "MEDIUM", estimatedHours: 8, dueDate: "2026-07-01", weekStart: WEEKS[3] }),

  // Helio
  t({ title: "Client auth tier — token-scoped RLS", projectId: "p-helio", assigneeId: "u-ahmed", status: "IN_PROGRESS", priority: "HIGH", estimatedHours: 10, loggedHours: 4, dueDate: "2026-06-17", weekStart: WEEKS[1], labels: ["auth"] }),
  t({ title: "Milestone timeline component", projectId: "p-helio", assigneeId: "u-diego", status: "IN_PROGRESS", priority: "HIGH", estimatedHours: 12, loggedHours: 7, dueDate: "2026-06-15", weekStart: WEEKS[0], labels: ["frontend"] }),
  t({ title: "Deliverable approval flow", projectId: "p-helio", assigneeId: "u-diego", status: "TO_DO", priority: "MEDIUM", estimatedHours: 10, dueDate: "2026-06-23", weekStart: WEEKS[2], dependsOn: ["t-14"] }),
  t({ title: "Portal empty-state & status explanations", projectId: "p-helio", assigneeId: "u-kofi", status: "REVIEW", priority: "MEDIUM", estimatedHours: 6, loggedHours: 6, dueDate: "2026-06-12", weekStart: WEEKS[0], labels: ["design"] }),
  t({ title: "Client usability study — 6 sessions", projectId: "p-helio", assigneeId: "u-ines", status: "IN_PROGRESS", priority: "MEDIUM", estimatedHours: 14, loggedHours: 6, dueDate: "2026-06-19", weekStart: WEEKS[1], labels: ["research"] }),
  t({ title: "Share-link audit events", projectId: "p-helio", status: "BACKLOG", priority: "LOW", estimatedHours: 5, dueDate: "2026-07-03", weekStart: WEEKS[3] }),

  // Pulse
  t({ title: "Hybrid search: 70/30 vector-BM25 blend tuning", projectId: "p-pulse", assigneeId: "u-zara", status: "IN_PROGRESS", priority: "HIGH", estimatedHours: 12, loggedHours: 8, dueDate: "2026-06-16", weekStart: WEEKS[0], labels: ["search"] }),
  t({ title: "Causal-signal trigger functions", projectId: "p-pulse", assigneeId: "u-tomas", status: "REVIEW", priority: "HIGH", estimatedHours: 10, loggedHours: 10, dueDate: "2026-06-11", weekStart: WEEKS[0], labels: ["causality"] }),
  t({ title: "Embedding dedup via content hash", projectId: "p-pulse", assigneeId: "u-zara", status: "COMPLETED", priority: "MEDIUM", estimatedHours: 6, loggedHours: 5, dueDate: "2026-06-05", weekStart: WEEKS[0] }),
  t({ title: "Metrics layer: utilization marts", projectId: "p-pulse", assigneeId: "u-ray", status: "IN_PROGRESS", priority: "MEDIUM", estimatedHours: 10, loggedHours: 3, dueDate: "2026-06-18", weekStart: WEEKS[1], labels: ["dbt"] }),
  t({ title: "Morning-brief digest renderer", projectId: "p-pulse", assigneeId: "u-ray", status: "TO_DO", priority: "LOW", estimatedHours: 8, dueDate: "2026-06-26", weekStart: WEEKS[2] }),

  // Nimbus
  t({ title: "RLS coverage CI gate (rls:check)", projectId: "p-nimbus", assigneeId: "u-fatima", status: "IN_PROGRESS", priority: "HIGH", estimatedHours: 8, loggedHours: 4, dueDate: "2026-06-15", weekStart: WEEKS[0], labels: ["security"] }),
  t({ title: "Vault secret rotation schedule", projectId: "p-nimbus", assigneeId: "u-fatima", status: "TO_DO", priority: "HIGH", estimatedHours: 6, dueDate: "2026-06-22", weekStart: WEEKS[2], labels: ["security"] }),
  t({ title: "Single-session enforcement e2e", projectId: "p-nimbus", assigneeId: "u-jonas", status: "TO_DO", priority: "MEDIUM", estimatedHours: 7, dueDate: "2026-06-25", weekStart: WEEKS[2], dependsOn: ["t-24"] }),
  t({ title: "Audit immutability — REVOKE verification", projectId: "p-nimbus", assigneeId: "u-elias", status: "COMPLETED", priority: "MEDIUM", estimatedHours: 4, loggedHours: 4, dueDate: "2026-06-04", weekStart: WEEKS[0] }),
  t({ title: "Pen-test scope doc with vendor", projectId: "p-nimbus", assigneeId: "u-elias", status: "BLOCKED", priority: "HIGH", estimatedHours: 5, loggedHours: 1, dueDate: "2026-06-08", weekStart: WEEKS[0], labels: ["vendor"] }),

  // Orbit
  t({ title: "Dense table kit — virtual rows + row actions", projectId: "p-orbit", assigneeId: "u-diego", status: "REVIEW", priority: "HIGH", estimatedHours: 9, loggedHours: 9, dueDate: "2026-06-12", weekStart: WEEKS[0], labels: ["components"] }),
  t({ title: "Motion language spec (drag, drawers, pulses)", projectId: "p-orbit", assigneeId: "u-kofi", status: "IN_PROGRESS", priority: "MEDIUM", estimatedHours: 8, loggedHours: 5, dueDate: "2026-06-16", weekStart: WEEKS[0], labels: ["motion"] }),
  t({ title: "Chart kit: explanatory tooltips", projectId: "p-orbit", assigneeId: "u-kofi", status: "TO_DO", priority: "MEDIUM", estimatedHours: 8, dueDate: "2026-06-24", weekStart: WEEKS[2] }),
  t({ title: "Token audit vs WCAG AA contrast", projectId: "p-orbit", assigneeId: "u-lena", status: "IN_PROGRESS", priority: "MEDIUM", estimatedHours: 6, loggedHours: 2, dueDate: "2026-06-18", weekStart: WEEKS[1] }),

  // Quartz
  t({ title: "Role-template provisioning matrix", projectId: "p-quartz", assigneeId: "u-marcus", status: "TO_DO", priority: "MEDIUM", estimatedHours: 6, dueDate: "2026-06-26", weekStart: WEEKS[2] }),
  t({ title: "Guided setup flow — 4-step wizard", projectId: "p-quartz", assigneeId: "u-yuki", status: "BACKLOG", priority: "MEDIUM", estimatedHours: 10, dueDate: "2026-07-08", weekStart: WEEKS[4] }),
];

// ---- Capacity grid -----------------------------------------------------------
// Hand-tuned to make the wedge story visible: Sarah burns red, Ahmed has room.
const cap = (employeeId: string, hours: number[], logged?: number[]): CapacityCell[] =>
  hours.map((h, i) => ({
    employeeId,
    weekStart: WEEKS[i],
    allocatedHours: h,
    loggedHours: logged?.[i] ?? Math.max(0, Math.round(h * (i === 0 ? 0.55 : 0))),
  }));

export const capacity: CapacityCell[] = [
  ...cap("u-sarah", [45, 42, 38, 30, 26, 24]),
  ...cap("u-ahmed", [26, 24, 28, 30, 22, 18]),
  ...cap("u-mei", [34, 33, 36, 28, 24, 22]),
  ...cap("u-diego", [33, 30, 34, 26, 22, 20]),
  ...cap("u-jonas", [30, 38, 41, 32, 24, 20]),
  ...cap("u-fatima", [31, 28, 30, 24, 8, 6]),
  ...cap("u-kofi", [27, 25, 29, 22, 18, 14]),
  ...cap("u-ines", [26, 27, 22, 18, 14, 10]),
  ...cap("u-zara", [33, 31, 28, 26, 22, 18]),
  ...cap("u-ray", [21, 26, 28, 24, 18, 12]),
  ...cap("u-yuki", [24, 22, 26, 20, 16, 12]),
  ...cap("u-marcus", [28, 26, 24, 22, 18, 16]),
  ...cap("u-asha", [30, 28, 26, 24, 20, 18]),
  ...cap("u-priya", [25, 24, 26, 22, 18, 16]),
  ...cap("u-lena", [27, 26, 24, 20, 18, 14]),
  ...cap("u-tomas", [29, 28, 26, 24, 20, 16]),
  ...cap("u-elias", [18, 20, 22, 18, 14, 10]),
  ...cap("u-noor", [16, 14, 12, 10, 8, 8]),
];

// ---- Risks -------------------------------------------------------------------
export const risks: Risk[] = [
  {
    id: "r-1", title: "Payments expertise concentrated in one person",
    category: "people", probability: "high", impact: "critical",
    ownerId: "u-priya", projectId: "p-atlas",
    mitigationPlan: "Cross-train Ahmed on ledger internals; document cutover architecture before July.",
    mitigationStatus: "in_progress", status: "MITIGATING", createdAt: "2026-05-21",
    signals: ["Sarah holds 93% of payments expertise depth", "Bus factor 1 on Atlas critical path", "Sarah flight risk 0.64"],
  },
  {
    id: "r-2", title: "Settlement vendor delivery slippage",
    category: "vendor", probability: "high", impact: "high",
    ownerId: "u-marcus", projectId: "p-atlas",
    mitigationPlan: "Escalate to vendor account director; prepare format-v2 fallback parser.",
    mitigationStatus: "in_progress", status: "ESCALATED", createdAt: "2026-06-02",
    signals: ["Vendor 8 days late on settlement file spec", "2 Atlas tasks blocked downstream"],
  },
  {
    id: "r-3", title: "QA capacity bottleneck across releases",
    category: "operational", probability: "medium", impact: "high",
    ownerId: "u-asha",
    mitigationPlan: "Stagger Atlas and Nimbus test windows; borrow verification hours from Data.",
    mitigationStatus: "not_started", status: "OPEN", createdAt: "2026-06-05",
    signals: ["Jonas projected at 102% in week of Jun 22", "Two release-gating test tasks share one owner"],
  },
  {
    id: "r-4", title: "SOC 2 evidence window at risk",
    category: "compliance", probability: "medium", impact: "high",
    ownerId: "u-fatima", projectId: "p-nimbus",
    mitigationPlan: "Re-baseline pen-test start; pre-collect control evidence in parallel.",
    mitigationStatus: "in_progress", status: "MITIGATING", createdAt: "2026-05-28",
    signals: ["Pen-test vendor start +2 weeks", "3 compliance tasks overdue"],
  },
  {
    id: "r-5", title: "LLM cost drift above daily org budget",
    category: "financial", probability: "low", impact: "medium",
    ownerId: "u-tomas", projectId: "p-pulse",
    mitigationPlan: "Enforce context compression; cache search embeddings 60s; alert at 80% soft limit.",
    mitigationStatus: "complete", status: "MONITORING", createdAt: "2026-04-30",
    signals: ["Daily spend peaked at $11.40 vs $15 hard limit", "Compression keeps 92% of calls < 1k tokens"],
  },
  {
    id: "r-6", title: "Client-portal token leakage surface",
    category: "security", probability: "low", impact: "critical",
    ownerId: "u-elias", projectId: "p-helio",
    mitigationPlan: "Short-lived scoped tokens, audit on share-link issue, IP pinning option for enterprise.",
    mitigationStatus: "in_progress", status: "OPEN", createdAt: "2026-06-07",
    signals: ["External share links bypass SSO context", "No anomaly alerting on portal reads yet"],
  },
];

// ---- Decisions ----------------------------------------------------------------
export const decisions: Decision[] = [
  {
    id: "dec-1", title: "Adopt double-entry ledger before cutover, not after",
    context: "Legacy billing accrues penny drift under concurrent retries. Two paths: migrate then fix, or fix then migrate.",
    chosenOption: "Fix-then-migrate: ship double-entry ledger first",
    rationale: "Reconciliation debt compounds with each migrated account. A correct ledger makes cutover verifiable account-by-account.",
    optionsConsidered: [
      { option: "Migrate first, repair later", pros: "Earlier headline date", cons: "Drift baked into migrated balances; audit risk" },
      { option: "Fix-then-migrate", pros: "Verifiable cutover; clean audit trail", cons: "6-week delay to start" },
    ],
    confidence: "high", ownerId: "u-sarah", projectId: "p-atlas", status: "ACTIVE",
    decidedAt: "2026-03-04", expectedOutcome: "Zero reconciliation variance on migrated accounts",
    actualOutcome: "Variance 0.002% across first 3 batches — within tolerance", linkedRiskIds: ["r-1"],
  },
  {
    id: "dec-2", title: "Department-scoped Realtime channels over global broadcast",
    context: "Live heatmap updates could broadcast globally or per-department.",
    chosenOption: "Department-scoped channels",
    rationale: "Global broadcasts create WAL storms at enterprise scale; scoping bounds fan-out and respects RLS visibility.",
    optionsConsidered: [
      { option: "Global table broadcast", pros: "Simple", cons: "O(org) fan-out; leaks cross-dept signal" },
      { option: "Dept-scoped channels", pros: "Bounded fan-out; RLS-aligned", cons: "Channel lifecycle management" },
    ],
    confidence: "high", ownerId: "u-priya", projectId: "p-pulse", status: "ACTIVE",
    decidedAt: "2026-04-15", expectedOutcome: "Heatmap update < 500ms end-to-end at 10k users", linkedRiskIds: [],
  },
  {
    id: "dec-3", title: "Agents write to proposals only — never operational tables",
    context: "Phase-4 agents could mutate tasks directly or stage suggestions for human review.",
    chosenOption: "Proposal-only writes with human approval",
    rationale: "Autonomous mutation breaks audit completeness and manager trust. The negotiation coordinator dedupes conflicting agent intents before humans see them.",
    optionsConsidered: [
      { option: "Direct mutation with undo", pros: "Faster effect", cons: "Trust collapse on first bad call; audit gaps" },
      { option: "Proposal inbox", pros: "Human override in 2 clicks; rejection memory", cons: "Review latency" },
    ],
    confidence: "high", ownerId: "u-noor", status: "ACTIVE",
    decidedAt: "2026-05-09", expectedOutcome: "> 60% proposal acceptance with zero unaudited mutations", linkedRiskIds: ["r-3"],
  },
  {
    id: "dec-4", title: "Defer offline CRDT sync to Phase 4, prep schema now",
    context: "Offline-first demands per-field CRDTs; retrofitting event sourcing is near-impossible.",
    chosenOption: "Add version_vector/tombstone columns now; implement merge in Phase 4",
    rationale: "Zero runtime cost today, preserves the migration path to event-sourced entities.",
    optionsConsidered: [
      { option: "Full CRDT now", pros: "Offline early", cons: "Months of complexity before wedge value" },
      { option: "Schema prep only", pros: "Optionality preserved", cons: "Discipline needed to keep columns populated" },
    ],
    confidence: "medium", ownerId: "u-priya", status: "APPROVED",
    decidedAt: "2026-05-27", expectedOutcome: "Phase-4 migration without data loss", linkedRiskIds: [],
  },
  {
    id: "dec-5", title: "Read-only heatmap for MVP; drag-and-drop in Phase 1",
    context: "Drag-drop reallocation is the hardest interaction; MVP timeline is 10 weeks.",
    chosenOption: "Materialized-view read-only heatmap first",
    rationale: "The heatmap sells on sight. Optimistic drag with atomic RPCs needs conflict handling that deserves its own phase.",
    optionsConsidered: [
      { option: "Ship drag-drop in MVP", pros: "Full wedge demo", cons: "Race conditions under deadline pressure" },
      { option: "Read-only first", pros: "Reliable wow; correct foundation", cons: "Demo needs narration for the drag story" },
    ],
    confidence: "high", ownerId: "u-asha", status: "SUPERSEDED",
    decidedAt: "2026-02-11", expectedOutcome: "MVP on time with credible capacity story",
    actualOutcome: "Phase 1 drag-drop shipped May 2026; this record superseded by live reallocation.", linkedRiskIds: [],
  },
];

// ---- Agent proposals (negotiation inbox) ---------------------------------------
export const proposals: Proposal[] = [
  {
    id: "pr-1", agentType: "burnout_safety",
    title: "Reduce Sarah Okafor's load below 100% this week",
    summary: "Move 'PCI evidence pack refresh' (9h) from Sarah to Ahmed. Sarah drops 112% → 90%; Ahmed rises 65% → 87%.",
    reasoning: [
      "Sarah logged > 50h for 3 consecutive weeks (rule · 98%)",
      "Utilization ≥ 100% for 9 consecutive days (rule · 96%)",
      "Ahmed has matching skills: Payments, Postgres, compliance exposure (skill-match 0.81 · 84%)",
      "No PTO conflict for Ahmed in target window (validated against calendar)",
    ],
    action: { kind: "reallocate", taskId: "t-10", fromEmployeeId: "u-sarah", toEmployeeId: "u-ahmed", deltaHours: 9, projectId: "p-atlas" },
    confidence: 0.91, priority: 100, entityLabel: "Sarah Okafor · Atlas",
    visibility: ["project_manager", "dept_head"], subjectId: "u-sarah",
    status: "pending", createdAt: "2026-06-10T05:40:00Z", expiresAt: "2026-06-12T05:40:00Z",
    conflict: {
      withAgent: "delivery_critical",
      resolution:
        "Delivery agent requested +10h on Sarah for cutover runbook. Coordinator compromise: burnout cap wins — 9h moved off Sarah, runbook deadline held by pulling Mei in for 4h review support.",
    },
    validation: [
      { check: "Target under 100% after move", pass: true },
      { check: "No PTO block in window", pass: true },
      { check: "Skill match ≥ 0.6", pass: true },
      { check: "No dependency lock on task", pass: true },
    ],
  },
  {
    id: "pr-2", agentType: "delivery_critical",
    title: "Protect Atlas cutover: add reviewer to runbook",
    summary: "Assign Mei Lin 4h review support on 'Ledger cutover runbook' to hold the Jun 12 date without raising Sarah's load.",
    reasoning: [
      "Runbook is on the critical path for Jul 24 cutover (rule · 97%)",
      "Velocity 38% below 3-sprint average — slack exhausted (statistical · 88%)",
      "Mei has ledger expertise depth 0.84 and 15% headroom this week (rule · 93%)",
    ],
    action: { kind: "reallocate", taskId: "t-1", toEmployeeId: "u-mei", deltaHours: 4, projectId: "p-atlas" },
    confidence: 0.87, priority: 70, entityLabel: "Atlas critical path",
    visibility: ["project_manager", "dept_head"], subjectId: "u-mei",
    status: "pending", createdAt: "2026-06-10T05:41:00Z", expiresAt: "2026-06-12T05:41:00Z",
    validation: [
      { check: "Mei under 100% after +4h", pass: true },
      { check: "No review-stage WIP limit breach", pass: true },
    ],
  },
  {
    id: "pr-3", agentType: "risk_advisory",
    title: "Escalate vendor settlement slippage to account director",
    summary: "Vendor is 8 days late on settlement spec; two Atlas tasks blocked. Recommend formal escalation plus fallback parser spike (6h, Mei).",
    reasoning: [
      "Blocked-task age exceeds 5-day threshold (rule · 95%)",
      "Similar 2025 vendor delay resolved only after director escalation (memory · 72%)",
    ],
    action: { kind: "escalate", projectId: "p-atlas" },
    confidence: 0.78, priority: 40, entityLabel: "Vendor: ClearSettle Ltd",
    visibility: ["project_manager", "dept_head", "executive"],
    status: "pending", createdAt: "2026-06-09T16:02:00Z", expiresAt: "2026-06-11T16:02:00Z",
    validation: [{ check: "Escalation path exists (Marcus Bell)", pass: true }],
  },
  {
    id: "pr-4", agentType: "allocation_optimize",
    title: "Stagger QA windows to relieve Jonas in week of Jun 22",
    summary: "Shift 'Single-session enforcement e2e' (7h) one week later. Jonas drops 102% → 85% with no milestone impact.",
    reasoning: [
      "Jonas projected at 102% in week of Jun 22 (rule · 94%)",
      "Nimbus milestone has 9 days of float (schedule · 90%)",
    ],
    action: { kind: "shift_deadline", taskId: "t-26", deltaHours: 0, projectId: "p-nimbus" },
    confidence: 0.83, priority: 50, entityLabel: "Jonas Weber · QA",
    visibility: ["project_manager", "dept_head"], subjectId: "u-jonas",
    status: "pending", createdAt: "2026-06-09T11:20:00Z", expiresAt: "2026-06-11T11:20:00Z",
    validation: [
      { check: "No downstream dependency violated", pass: true },
      { check: "Milestone float ≥ shift", pass: true },
    ],
  },
  {
    id: "pr-5", agentType: "allocation_optimize",
    title: "Route unassigned 'Ledger read-replica failover test'",
    summary: "Best match: Fatima Zahra (skill 0.77, 24h headroom in target week). Second: Ahmed (0.71).",
    reasoning: [
      "Task unassigned 11 days with due date approaching (rule · 92%)",
      "Fatima: infra + failover expertise, lowest load in window (skill-match · 89%)",
    ],
    action: { kind: "reallocate", taskId: "t-12", toEmployeeId: "u-fatima", deltaHours: 8, projectId: "p-atlas" },
    confidence: 0.74, priority: 50, entityLabel: "Atlas backlog",
    visibility: ["project_manager", "dept_head"], subjectId: "u-fatima",
    status: "approved", createdAt: "2026-06-08T09:15:00Z", expiresAt: "2026-06-10T09:15:00Z",
    validation: [
      { check: "Fatima under 100% after +8h", pass: true },
      { check: "PTO check (Jul 6–8 outside window)", pass: true },
    ],
  },
  {
    id: "pr-6", agentType: "burnout_safety",
    title: "Nudge: Sarah has not used PTO in 112 days",
    summary: "Suggest manager raises PTO in next 1:1. No reallocation attached.",
    reasoning: ["days_since_pto ≥ 90 threshold breached (rule · 99%)"],
    action: { kind: "reduce_load" },
    confidence: 0.95, priority: 100, entityLabel: "Sarah Okafor",
    visibility: ["project_manager", "dept_head"], subjectId: "u-sarah",
    status: "rejected", createdAt: "2026-06-03T07:30:00Z", expiresAt: "2026-06-05T07:30:00Z",
    validation: [{ check: "Manager-private delivery", pass: true }],
  },

  // ---- employee-facing requests (personal scope: subjectId is the viewer) ----
  {
    id: "pr-7", agentType: "allocation_optimize",
    title: "Incoming transfer: 'PCI evidence pack refresh' (9h) — confirm you can absorb it",
    summary: "Your manager is reviewing a move of this task from Sarah to you. Accepting confirms you have the headroom; flagging routes it back with your reason.",
    reasoning: [
      "Your utilization rises 65% → 87% if accepted (rule · 96%)",
      "Skill match on Payments + compliance exposure: 0.81 (skill-match · 84%)",
      "No PTO conflict in the target window (calendar · validated)",
    ],
    action: { kind: "reallocate", taskId: "t-10", toEmployeeId: "u-ahmed", deltaHours: 9, projectId: "p-atlas" },
    confidence: 0.84, priority: 70, entityLabel: "Your week · Atlas",
    visibility: ["employee"], subjectId: "u-ahmed",
    status: "pending", createdAt: "2026-06-10T06:05:00Z", expiresAt: "2026-06-12T06:05:00Z",
    validation: [
      { check: "You stay under 90% after the move", pass: true },
      { check: "No overlap with your existing Atlas deadline", pass: true },
    ],
  },
  {
    id: "pr-8", agentType: "burnout_safety",
    title: "Protect a focus block before your Jun 16 deadline",
    summary: "Your 'Idempotent retry layer' (12h) lands Jun 16. The agent suggests blocking Thursday morning — your calendar shows 6 meeting-free hours.",
    reasoning: [
      "Deadline within 4 working days with 12h remaining (rule · 93%)",
      "Historical: your throughput doubles in pre-blocked windows (memory · 76%)",
    ],
    action: { kind: "reduce_load", taskId: "t-14", projectId: "p-atlas" },
    confidence: 0.79, priority: 50, entityLabel: "Your focus · Atlas",
    visibility: ["employee"], subjectId: "u-ahmed",
    status: "pending", createdAt: "2026-06-10T07:10:00Z", expiresAt: "2026-06-13T07:10:00Z",
    validation: [{ check: "Block fits inside working hours", pass: true }],
  },

  // ---- admin-only governance queue ------------------------------------------
  {
    id: "pr-9", agentType: "risk_advisory",
    title: "Approve permission grant: audit-export for Priya Sharma",
    summary: "Priya (VP Engineering) requested audit-log export for the SOC 2 evidence window. Grant expires automatically Aug 31.",
    reasoning: [
      "Request matches an active compliance milestone (rule · 97%)",
      "Least-privilege check: export-only, no UPDATE/DELETE surface (policy · 100%)",
    ],
    action: { kind: "escalate" },
    confidence: 0.92, priority: 80, entityLabel: "RBAC grant · governance",
    visibility: ["admin"],
    status: "pending", createdAt: "2026-06-10T04:30:00Z", expiresAt: "2026-06-14T04:30:00Z",
    validation: [
      { check: "Grant is time-boxed (expires Aug 31)", pass: true },
      { check: "No standing-privilege escalation", pass: true },
    ],
  },
  {
    id: "pr-10", agentType: "risk_advisory",
    title: "Concurrent session anomaly: revoke stale session for Ray Torres",
    summary: "Two live sessions detected for u-ray (Chrome/Windows + Safari/macOS, 40 min apart, different cities). Single-session law says the older one dies.",
    reasoning: [
      "Geo-velocity between logins exceeds plausible travel (rule · 99%)",
      "Single-session enforcement is a hard invariant (policy · 100%)",
    ],
    action: { kind: "escalate" },
    confidence: 0.97, priority: 100, entityLabel: "Session security · u-ray",
    visibility: ["admin"],
    status: "pending", createdAt: "2026-06-10T08:55:00Z", expiresAt: "2026-06-10T20:55:00Z",
    validation: [{ check: "Newer session keeps continuity", pass: true }],
  },
];

// ---- Goals, commitments, audit, notifications ----------------------------------
export const goals: Goal[] = [
  {
    id: "g-revenue", title: "Protect $4.2M ARR through Atlas cutover", ownerId: "u-noor",
    progress: 0.62, targetDate: "2026-07-31",
    keyResults: [
      { title: "Zero-variance migration for top 20 accounts", progress: 0.55 },
      { title: "Cutover with < 5 min write freeze", progress: 0.4 },
      { title: "Acme Corp renewal signed", progress: 0.9 },
    ],
  },
  {
    id: "g-expansion", title: "Land 3 enterprise logos via portal + onboarding", ownerId: "u-marcus",
    progress: 0.41, targetDate: "2026-10-30",
    keyResults: [
      { title: "Client portal GA", progress: 0.48 },
      { title: "Onboarding < 2 hours", progress: 0.1 },
      { title: "Meridian Group pilot live", progress: 0.65 },
    ],
  },
  {
    id: "g-ai", title: "Explanatory intelligence on every score", ownerId: "u-tomas",
    progress: 0.7, targetDate: "2026-09-15",
    keyResults: [
      { title: "Causal signals behind 100% of health badges", progress: 0.85 },
      { title: "Search p95 < 3s", progress: 0.75 },
      { title: "Agent proposal acceptance > 60%", progress: 0.5 },
    ],
  },
  {
    id: "g-trust", title: "SOC 2 Type II readiness", ownerId: "u-priya",
    progress: 0.58, targetDate: "2026-08-31",
    keyResults: [
      { title: "RLS coverage 100% with CI gate", progress: 0.9 },
      { title: "Pen-test complete, criticals closed", progress: 0.2 },
      { title: "Vault rotation automated", progress: 0.65 },
    ],
  },
];

export const commitments: Commitment[] = [
  { id: "c-1", title: "Deliver settlement spec sign-off to Sarah", ownerId: "u-marcus", toId: "u-sarah", dueDate: "2026-06-09", status: "overdue", source: "Atlas vendor sync · Jun 2" },
  { id: "c-2", title: "Cross-training plan for ledger internals", ownerId: "u-sarah", toId: "u-priya", dueDate: "2026-06-13", status: "in_progress", source: "Risk review · May 21" },
  { id: "c-3", title: "Portal auth review decision", ownerId: "u-priya", toId: "u-asha", dueDate: "2026-06-12", status: "open", source: "Helio standup · Jun 8" },
  { id: "c-4", title: "Pen-test re-baseline dates to Fatima", ownerId: "u-elias", toId: "u-fatima", dueDate: "2026-06-11", status: "in_progress", source: "Nimbus weekly · Jun 5" },
  { id: "c-5", title: "Q3 staffing scenario for Data team", ownerId: "u-asha", toId: "u-noor", dueDate: "2026-06-17", status: "open", source: "WBR · Jun 6" },
];

export const auditEvents: AuditEvent[] = [
  { id: "a-1", actorId: "u-asha", actorRole: "project_manager", actionType: "task_reallocated", entityType: "task", entityLabel: "Ledger read-replica failover test", detail: "Unassigned → Fatima Zahra (+8h, week of Jun 22). Source: approved proposal pr-5.", at: "2026-06-10T06:12:00Z" },
  { id: "a-2", actorId: "u-asha", actorRole: "project_manager", actionType: "capacity_override", entityType: "employee", entityLabel: "Jonas Weber", detail: "Allocation pushed to 102% for week of Jun 22.", overrideReason: "Release-gating test cannot slip past code freeze.", at: "2026-06-09T14:03:00Z" },
  { id: "a-3", actorId: "u-elias", actorRole: "admin", actionType: "session_revoked", entityType: "session", entityLabel: "u-ray · Chrome/Windows", detail: "Concurrent login detected; prior session invalidated (single-session law).", at: "2026-06-09T08:47:00Z" },
  { id: "a-4", actorId: "u-priya", actorRole: "dept_head", actionType: "risk_escalated", entityType: "risk", entityLabel: "Settlement vendor delivery slippage", detail: "Status OPEN → ESCALATED. Executive notification dispatched.", at: "2026-06-08T17:25:00Z" },
  { id: "a-5", actorId: "u-sarah", actorRole: "team_lead", actionType: "decision_recorded", entityType: "decision", entityLabel: "Adopt double-entry ledger before cutover", detail: "Actual outcome recorded: variance 0.002% across first 3 batches.", at: "2026-06-08T10:11:00Z" },
  { id: "a-6", actorId: "u-marcus", actorRole: "dept_head", actionType: "project_status_changed", entityType: "project", entityLabel: "Quartz Onboarding Revamp", detail: "Created in PLANNING with staffing template 'Client Delivery'.", at: "2026-06-06T09:30:00Z" },
  { id: "a-7", actorId: "u-elias", actorRole: "admin", actionType: "role_changed", entityType: "user", entityLabel: "Ray Donnelly", detail: "Granted metrics-layer write scope (dbt prod).", at: "2026-06-05T13:55:00Z" },
];

export const notifications: NotificationItem[] = [
  { id: "n-1", klass: "hard_stop", title: "Capacity guardrail tripped", body: "Drop would push Jonas Weber to 109% in week of Jun 22 — override reason required.", at: "2026-06-10T06:05:00Z", read: false, entityRef: "/capacity" },
  { id: "n-2", klass: "manager_review", title: "2 agent proposals await review", body: "Burnout-safety and delivery agents reached a coordinated compromise on Sarah Okafor.", at: "2026-06-10T05:45:00Z", read: false, entityRef: "/proposals" },
  { id: "n-3", klass: "critical_action", title: "Atlas Payments Migration is CRITICAL", body: "7 tasks overdue · QA at 112% · velocity −38% vs 3-sprint average.", at: "2026-06-10T05:00:00Z", read: false, entityRef: "/projects/p-atlas" },
  { id: "n-4", klass: "intelligence", title: "Morning brief ready", body: "1 critical project · 2 proposals pending · 2 vendor renewals inside 30 days.", at: "2026-06-10T04:45:00Z", read: true },
  { id: "n-5", klass: "informational", title: "Decision outcome recorded", body: "Double-entry ledger decision: variance 0.002% — within tolerance.", at: "2026-06-08T10:12:00Z", read: true, entityRef: "/decisions" },
  { id: "n-6", klass: "critical_action", title: "Commitment overdue", body: "Marcus → Sarah: vendor settlement spec sign-off is 5 days late.", at: "2026-06-10T05:30:00Z", read: false, entityRef: "/commitments" },
  { id: "n-7", klass: "informational", title: "Commitment due today", body: "Asha → Priya: capacity rebalance plan for the week of Jun 22.", at: "2026-06-10T03:10:00Z", read: false, entityRef: "/commitments" },
];

// ---- Lookup helpers -------------------------------------------------------------
export const employeeById = (id?: string) => employees.find((e) => e.id === id);
export const projectById = (id?: string) => projects.find((p) => p.id === id);
export const departmentById = (id?: string) => departments.find((d) => d.id === id);
