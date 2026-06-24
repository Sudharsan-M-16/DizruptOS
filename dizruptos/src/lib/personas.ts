// Personas + permission matrix — server-safe module (no "use client").
// Imported by BOTH the client session store and server-side authz, so the
// trust boundary and the UX run on the same definitions.

import type { Role } from "./types";

/** Demo personas — one per role tier the PRD cares about. */
export const PERSONAS: {
  id: string;
  name: string;
  initials: string;
  title: string;
  role: Role;
  accent: string;
  /** For client logins: the customer name that links them to their project(s). */
  customer?: string;
}[] = [
  // One switchable login per role tier — titles match the seed (lib/data.ts).
  { id: "u-noor", name: "Noor Al-Rashid", initials: "NA", title: "CEO", role: "executive", accent: "#C084FC" },
  { id: "u-priya", name: "Priya Sharma", initials: "PS", title: "Head of Engineering", role: "dept_head", accent: "#2BD9FF" },
  { id: "u-asha", name: "Asha Venkat", initials: "AV", title: "Project Manager", role: "project_manager", accent: "#00ED82" },
  { id: "u-sarah", name: "Sarah Okafor", initials: "SO", title: "Backend Team Lead", role: "team_lead", accent: "#EF4444" },
  { id: "u-ahmed", name: "Ahmed Hassan", initials: "AH", title: "Backend Engineer", role: "employee", accent: "#10B981" },
  { id: "u-elias", name: "Elias Brandt", initials: "EB", title: "IT Admin", role: "admin", accent: "#94A3B8" },
  // Client login — sees only their own project (the AI Support Chatbot).
  { id: "c-acme", name: "Acme Support", initials: "AC", title: "Client · AI Support Chatbot", role: "client", accent: "#38BDF8", customer: "Acme Support" },
];

/* ------------------------- permission matrix (PRD §14.3) ------------------ */

export type Permission =
  | "view_capacity"
  | "reallocate"
  | "view_burnout"
  | "view_financials"
  | "view_audit"
  | "review_proposals"
  | "view_executive";

const MATRIX: Record<Permission, Role[]> = {
  view_capacity: ["admin", "executive", "dept_head", "project_manager", "team_lead"],
  reallocate: ["admin", "dept_head", "project_manager"],
  view_burnout: ["admin", "dept_head", "project_manager", "team_lead"],
  view_financials: ["admin", "executive", "dept_head"],
  view_audit: ["admin", "dept_head"],
  review_proposals: ["admin", "dept_head", "project_manager"],
  view_executive: ["admin", "executive", "dept_head"],
};

export const roleCan = (role: Role, perm: Permission) =>
  MATRIX[perm].includes(role);
