// One-shot reseed of the live Supabase DB with the NEW story (service role).
// Idempotent upserts. Run: node reseed-supabase.mjs
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

// read env from .env.local
const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n")
    .map((l) => l.trim()).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Missing Supabase URL / service role key"); process.exit(1); }
const sb = createClient(url, key, { auth: { persistSession: false } });

const ORG = "00000000-0000-0000-0000-000000000001";
const U = (h) => `00000000-0000-0000-0000-0000000000${h}`;
const D = (h) => `00000000-0000-0000-0000-0000000000d${h}`;
const P = (h) => `00000000-0000-0000-0000-0000000000b${h}`;
const T = (h) => `00000000-0000-0000-0000-00000000f0${h}`;
const today = new Date(); const day = today.getDay();
today.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
const week = today.toISOString().slice(0, 10);

async function step(name, fn) {
  try { const { error } = await fn(); if (error) { console.log(`✗ ${name}: ${error.message}`); return false; } console.log(`✓ ${name}`); return true; }
  catch (e) { console.log(`✗ ${name}: ${String(e).slice(0, 120)}`); return false; }
}

// connection test
{
  const { error } = await sb.from("organizations").select("id").limit(1);
  console.log(error ? `CONNECTION FAILED: ${error.message}` : "CONNECTION OK");
  if (error) process.exit(1);
}

await step("organizations", () => sb.from("organizations").upsert([{ id: ORG, name: "Dizrupt Studio", slug: "dizrupt-studio" }]));
await step("departments", () => sb.from("departments").upsert([
  { id: D(1), name: "Engineering", org_id: ORG }, { id: D(2), name: "Design", org_id: ORG },
  { id: D(3), name: "Data & AI", org_id: ORG }, { id: D(4), name: "Product", org_id: ORG },
]));
await step("users", () => sb.from("users").upsert([
  { id: U("a2"), email: "noor@dizrupt.io", full_name: "Noor Al-Rashid", role: "executive", department_id: D(4), org_id: ORG, capacity_hours_per_week: 40, skill_tags: ["strategy", "roadmap"] },
  { id: U("a3"), email: "priya@dizrupt.io", full_name: "Priya Sharma", role: "dept_head", department_id: D(1), org_id: ORG, capacity_hours_per_week: 40, skill_tags: ["architecture", "leadership", "backend"] },
  { id: U("a1"), email: "asha@dizrupt.io", full_name: "Asha Venkat", role: "project_manager", department_id: D(1), org_id: ORG, capacity_hours_per_week: 40, skill_tags: ["planning", "coordination"] },
  { id: U("a6"), email: "sarah@dizrupt.io", full_name: "Sarah Okafor", role: "team_lead", department_id: D(1), org_id: ORG, capacity_hours_per_week: 40, skill_tags: ["backend", "apis", "databases"] },
  { id: U("a4"), email: "ahmed@dizrupt.io", full_name: "Ahmed Hassan", role: "employee", department_id: D(1), org_id: ORG, capacity_hours_per_week: 40, skill_tags: ["backend", "apis", "databases"] },
  { id: U("a7"), email: "mei@dizrupt.io", full_name: "Mei Lin", role: "employee", department_id: D(1), org_id: ORG, capacity_hours_per_week: 40, skill_tags: ["backend", "apis", "databases"] },
  { id: U("a8"), email: "diego@dizrupt.io", full_name: "Diego Ruiz", role: "employee", department_id: D(1), org_id: ORG, capacity_hours_per_week: 40, skill_tags: ["frontend", "react", "ui"] },
  { id: U("a9"), email: "jonas@dizrupt.io", full_name: "Jonas Weber", role: "employee", department_id: D(1), org_id: ORG, capacity_hours_per_week: 40, skill_tags: ["testing", "qa"] },
  { id: U("aa"), email: "fatima@dizrupt.io", full_name: "Fatima Zahra", role: "employee", department_id: D(1), org_id: ORG, capacity_hours_per_week: 40, skill_tags: ["devops", "cloud", "cicd"] },
  { id: U("a5"), email: "elias@dizrupt.io", full_name: "Elias Brandt", role: "admin", department_id: D(1), org_id: ORG, capacity_hours_per_week: 40, skill_tags: ["it", "security", "access"] },
  { id: U("ab"), email: "kofi@dizrupt.io", full_name: "Kofi Mensah", role: "employee", department_id: D(2), org_id: ORG, capacity_hours_per_week: 40, skill_tags: ["ui-design", "figma"] },
  { id: U("ac"), email: "ines@dizrupt.io", full_name: "Inés Castillo", role: "employee", department_id: D(2), org_id: ORG, capacity_hours_per_week: 32, skill_tags: ["ux-research", "ui-design"] },
  { id: U("ad"), email: "zara@dizrupt.io", full_name: "Zara Iqbal", role: "employee", department_id: D(3), org_id: ORG, capacity_hours_per_week: 40, skill_tags: ["ai-ml", "python"] },
  { id: U("ae"), email: "ray@dizrupt.io", full_name: "Ray Donnelly", role: "employee", department_id: D(3), org_id: ORG, capacity_hours_per_week: 40, skill_tags: ["data-pipelines", "sql"] },
  { id: U("af"), email: "marcus@dizrupt.io", full_name: "Marcus Bell", role: "dept_head", department_id: D(4), org_id: ORG, capacity_hours_per_week: 40, skill_tags: ["product", "strategy"] },
  { id: U("b0"), email: "yuki@dizrupt.io", full_name: "Yuki Tanaka", role: "employee", department_id: D(4), org_id: ORG, capacity_hours_per_week: 40, skill_tags: ["coordination", "qa"] },
]));
await step("customers", () => sb.from("customers").upsert([{ id: U("c1"), name: "Acme Support", tier: "enterprise", health_status: "at_risk", owner_id: U("af"), arr_micro_units: 300000000 }]));
await step("projects", () => sb.from("projects").upsert([
  { id: P(1), name: "AI Support Chatbot", department_id: D(1), owner_id: U("a6"), status: "ACTIVE", health_status: "CRITICAL", health_reasons: ["3 tasks overdue", "Sarah & Zara over 100%", "pace slipping"], budget_hours: 1200, consumed_hours: 998, customer_id: U("c1"), visibility_scope: [D(1)] },
  { id: P(2), name: "Fitness Mobile App", department_id: D(1), owner_id: U("a1"), status: "ACTIVE", health_status: "ON_TRACK", health_reasons: ["On schedule"], budget_hours: 640, consumed_hours: 312, visibility_scope: [D(1)] },
  { id: P(3), name: "Sales Analytics Dashboard", department_id: D(3), owner_id: U("ad"), status: "ACTIVE", health_status: "AT_RISK", health_reasons: ["Understaffed", "tasks unassigned"], budget_hours: 880, consumed_hours: 84, visibility_scope: [D(3)] },
  { id: P(4), name: "Cloud & Deployment Setup", department_id: D(1), owner_id: U("aa"), status: "ACTIVE", health_status: "DELAYED", health_reasons: ["Security review blocked on vendor"], budget_hours: 520, consumed_hours: 305, visibility_scope: [D(1)] },
  { id: P(5), name: "App Design System", department_id: D(2), owner_id: U("ab"), status: "ACTIVE", health_status: "ON_TRACK", health_reasons: ["Core components built"], budget_hours: 400, consumed_hours: 238, visibility_scope: [D(2)] },
  { id: P(6), name: "Online Store", department_id: D(4), owner_id: U("af"), status: "PLANNING", health_status: "ON_TRACK", health_reasons: ["Kickoff scheduled"], budget_hours: 360, consumed_hours: 18, visibility_scope: [D(4)] },
]));
await step("tasks", () => sb.from("tasks").upsert([
  { id: T("01"), title: "Build the chat window UI", project_id: P(1), assignee_id: U("a8"), status: "IN_PROGRESS", priority: "HIGH", estimated_hours: 12, week_start: week },
  { id: T("02"), title: "Build the message API", project_id: P(1), assignee_id: U("a6"), status: "IN_PROGRESS", priority: "URGENT", estimated_hours: 14, week_start: week },
  { id: T("03"), title: "Set up the chatbot database", project_id: P(1), assignee_id: U("a6"), status: "TO_DO", priority: "HIGH", estimated_hours: 9, week_start: week },
  { id: T("04"), title: "Train the AI reply model", project_id: P(1), assignee_id: U("ad"), status: "BLOCKED", priority: "URGENT", estimated_hours: 16, week_start: week },
  { id: T("05"), title: "Connect the chatbot to live chat", project_id: P(1), assignee_id: U("a4"), status: "IN_PROGRESS", priority: "HIGH", estimated_hours: 10, week_start: week },
  { id: T("15"), title: "Build the dashboard layout", project_id: P(3), assignee_id: null, status: "TO_DO", priority: "HIGH", estimated_hours: 12, week_start: week },
  { id: T("16"), title: "Build the sales data pipeline", project_id: P(3), assignee_id: null, status: "TO_DO", priority: "HIGH", estimated_hours: 14, week_start: week },
  { id: T("18"), title: "Connect the dashboard to the database", project_id: P(3), assignee_id: U("ae"), status: "IN_PROGRESS", priority: "MEDIUM", estimated_hours: 8, week_start: week },
  { id: T("24"), title: "Security review of the cloud setup", project_id: P(4), assignee_id: U("a5"), status: "BLOCKED", priority: "HIGH", estimated_hours: 6, week_start: week },
]));
await step("capacity_logs", () => sb.from("capacity_logs").upsert([
  { user_id: U("a6"), week_start: week, allocated_hours: 46, utilization_pct: 1.15 },
  { user_id: U("ad"), week_start: week, allocated_hours: 44, utilization_pct: 1.10 },
  { user_id: U("a4"), week_start: week, allocated_hours: 26, utilization_pct: 0.65 },
  { user_id: U("ae"), week_start: week, allocated_hours: 18, utilization_pct: 0.45 },
  { user_id: U("ac"), week_start: week, allocated_hours: 16, utilization_pct: 0.50 },
], { onConflict: "user_id,week_start" }));
const R = (n) => `00000000-0000-0000-0000-00000000e00${n}`;
const G = (n) => `00000000-0000-0000-0000-0000000090${n}`;
await step("risks", () => sb.from("risks").upsert([
  { id: R(1), title: "Only one person knows how the AI model works", category: "people", probability: "high", impact: "critical", owner_id: U("ad"), project_id: P(1), status: "MITIGATING", signals: ["Zara is the only one who can train the model", "overloaded at 110%"] },
  { id: R(2), title: "Cloud security vendor is running late", category: "vendor", probability: "high", impact: "high", owner_id: U("af"), project_id: P(4), status: "ESCALATED", signals: ["review blocked 2 days"] },
  { id: R(3), title: "The Sales Dashboard has no team yet", category: "operational", probability: "high", impact: "high", owner_id: U("a1"), project_id: P(3), status: "OPEN", signals: ["3 tasks unowned"] },
]));
await step("goals", () => sb.from("goals").upsert([
  { id: G("01"), title: "Launch the AI Support Chatbot by August", owner_id: U("a2"), department_id: D(4), target_date: "2026-08-31", progress: 0.62, key_results: [{ title: "Answers real questions", progress: 0.55 }] },
]));

// verify read-back
const { data: pj } = await sb.from("projects").select("name,health_status").eq("id", P(1)).single();
console.log("READBACK project b1:", JSON.stringify(pj));
console.log("done");
