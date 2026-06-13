// In-memory repository — the demo-mode backend. Same contracts, same laws
// (atomic reassign, insert-only audit) as the Supabase implementation, so
// services and API routes cannot tell the difference.

import {
  auditEvents,
  capacity as seedCapacity,
  employees,
  proposals as seedProposals,
  tasks as seedTasks,
} from "@/lib/data";
import type {
  AuditEvent,
  CapacityCell,
  Proposal,
  Task,
} from "@/lib/types";
import { projects, risks } from "@/lib/data";
import {
  RepositoryError,
  type Approval,
  type Capability,
  type EmployeeCapability,
  type Repositories,
} from "./types";

// Capability graph seed — mirrors supabase/seed_capabilities.sql so demo mode
// computes the same intelligence as the live backend.
const capSeed: Capability[] = [
  { id: "cap-payments", name: "Payments Systems", category: "engineering", strategicImportance: "critical" },
  { id: "cap-cloud", name: "Cloud Infrastructure", category: "engineering", strategicImportance: "high" },
  { id: "cap-frontend", name: "Frontend Engineering", category: "engineering", strategicImportance: "medium" },
  { id: "cap-finance", name: "Finance & Modeling", category: "finance", strategicImportance: "high" },
  { id: "cap-vendor", name: "Vendor Negotiation", category: "operations", strategicImportance: "medium" },
];
const empCapSeed: EmployeeCapability[] = [
  { userId: "u-ahmed", userName: "Ahmed Hassan", capabilityId: "cap-payments", proficiency: 5, isPrimary: true },
  { userId: "u-priya", userName: "Priya Sharma", capabilityId: "cap-payments", proficiency: 3, isPrimary: false },
  { userId: "u-ahmed", userName: "Ahmed Hassan", capabilityId: "cap-cloud", proficiency: 4, isPrimary: true },
  { userId: "u-elias", userName: "Elias Brandt", capabilityId: "cap-cloud", proficiency: 4, isPrimary: true },
  { userId: "u-asha", userName: "Asha Venkat", capabilityId: "cap-frontend", proficiency: 4, isPrimary: true },
  { userId: "u-ahmed", userName: "Ahmed Hassan", capabilityId: "cap-frontend", proficiency: 3, isPrimary: false },
  { userId: "u-priya", userName: "Priya Sharma", capabilityId: "cap-frontend", proficiency: 3, isPrimary: false },
  { userId: "u-noor", userName: "Noor Al-Rashid", capabilityId: "cap-finance", proficiency: 5, isPrimary: true },
  { userId: "u-noor", userName: "Noor Al-Rashid", capabilityId: "cap-vendor", proficiency: 4, isPrimary: true },
];

// Server-side state: module-scope copies so API mutations persist for the
// process lifetime (the demo analogue of a database).
let tasks: Task[] = seedTasks.map((t) => ({ ...t }));
let capacity: CapacityCell[] = seedCapacity.map((c) => ({ ...c }));
let proposals: Proposal[] = seedProposals.map((p) => ({ ...p }));
const audit: AuditEvent[] = [...auditEvents];
const approvals: Approval[] = [];

export function createMemoryRepositories(): Repositories {
  return {
    backend: "memory",

    employees: {
      list: async () => employees,
      byId: async (id) => employees.find((e) => e.id === id) ?? null,
    },

    tasks: {
      list: async () => tasks,
      byId: async (id) => tasks.find((t) => t.id === id) ?? null,
      reassign: async (taskId, toEmployeeId) => {
        const task = tasks.find((t) => t.id === taskId);
        const target = employees.find((e) => e.id === toEmployeeId);
        if (!task) throw new RepositoryError("NOT_FOUND", `task ${taskId}`);
        if (!target) throw new RepositoryError("NOT_FOUND", `employee ${toEmployeeId}`);

        // Atomic unit: reassignment + both capacity deltas succeed together.
        const apply = (empId: string, delta: number) => {
          capacity = capacity.map((c) =>
            c.employeeId === empId && c.weekStart === task.weekStart
              ? { ...c, allocatedHours: Math.max(0, c.allocatedHours + delta) }
              : c
          );
        };
        if (task.assigneeId) apply(task.assigneeId, -task.estimatedHours);
        apply(toEmployeeId, task.estimatedHours);
        tasks = tasks.map((t) =>
          t.id === taskId ? { ...t, assigneeId: toEmployeeId } : t
        );
      },
    },

    capacity: {
      list: async () => capacity,
      forWeek: async (weekStart) => capacity.filter((c) => c.weekStart === weekStart),
    },

    proposals: {
      list: async () => proposals,
      setStatus: async (id, status) => {
        if (!proposals.some((p) => p.id === id))
          throw new RepositoryError("NOT_FOUND", `proposal ${id}`);
        proposals = proposals.map((p) => (p.id === id ? { ...p, status } : p));
      },
    },

    projects: {
      list: async () => projects,
      byId: async (id) => projects.find((p) => p.id === id) ?? null,
    },

    risks: {
      list: async () => risks,
    },

    audit: {
      list: async (limit = 100) => audit.slice(0, limit),
      append: async (event) => {
        audit.unshift(event);
      },
    },

    approvals: {
      list: async (limit = 100) => approvals.slice(0, limit),
      listPending: async (approverRole) =>
        approvals.filter((a) => a.status === "pending" && (!approverRole || a.approverRole === approverRole)),
      create: async (a) => {
        const rec = {
          id: `apr-${Date.now()}-${approvals.length}`,
          changeType: a.changeType,
          summary: a.summary,
          payload: a.payload ?? {},
          requesterId: a.requesterId,
          requesterRole: a.requesterRole,
          approverRole: a.approverRole,
          authorityTier: a.authorityTier,
          escalationPath: a.escalationPath ?? [],
          rationale: a.rationale ?? null,
          evidence: a.evidence ?? {},
          affectedEntities: a.affectedEntities ?? [],
          status: a.status ?? "pending",
          decidedBy: null,
          decidedAt: null,
          declineReason: null,
          createdAt: new Date().toISOString(),
        };
        approvals.unshift(rec);
        return rec;
      },
      decide: async (id, status, decidedBy, declineReason) => {
        const rec = approvals.find((a) => a.id === id);
        if (!rec) throw new RepositoryError("NOT_FOUND", `approval ${id}`);
        rec.status = status;
        rec.decidedBy = decidedBy;
        rec.decidedAt = new Date().toISOString();
        rec.declineReason = declineReason ?? null;
      },
    },

    capabilities: { list: async () => capSeed },
    employeeCapabilities: { list: async () => empCapSeed },
  };
}
