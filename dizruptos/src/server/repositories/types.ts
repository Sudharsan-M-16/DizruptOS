// Repository layer contracts — the seam between business logic and storage.
//
//   UI → services → repositories → (memory seed | PostgREST/Supabase) → rows
//
// Every implementation must satisfy these interfaces exactly; services and
// API routes import ONLY from here and the factory, never a concrete impl.

import type {
  AuditEvent,
  CapacityCell,
  Employee,
  Project,
  Proposal,
  Risk,
  Task,
} from "@/lib/types";

export class RepositoryError extends Error {
  constructor(
    public readonly code:
      | "NOT_FOUND"
      | "CONFLICT"
      | "STORAGE_UNAVAILABLE"
      | "INVALID_INPUT",
    message: string
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

export interface EmployeeRepository {
  list(): Promise<Employee[]>;
  byId(id: string): Promise<Employee | null>;
}

export interface TaskRepository {
  list(): Promise<Task[]>;
  byId(id: string): Promise<Task | null>;
  /** Reassign + apply both capacity deltas as ONE unit (PRD §11 atomicity). */
  reassign(taskId: string, toEmployeeId: string): Promise<void>;
}

export interface CapacityRepository {
  list(): Promise<CapacityCell[]>;
  forWeek(weekStart: string): Promise<CapacityCell[]>;
}

export interface ProposalRepository {
  list(): Promise<Proposal[]>;
  setStatus(id: string, status: Proposal["status"]): Promise<void>;
}

export interface ProjectRepository {
  list(): Promise<Project[]>;
  byId(id: string): Promise<Project | null>;
}

export interface RiskRepository {
  list(): Promise<Risk[]>;
}

export interface AuditRepository {
  list(limit?: number): Promise<AuditEvent[]>;
  /** INSERT-only by law — there is intentionally no update/delete surface. */
  append(event: AuditEvent): Promise<void>;
}

/** A governance decision as a durable object (migration 0003) — the substrate
 *  for decision lineage, audit, and organizational memory. */
export interface Approval {
  id: string;
  changeType: string;
  summary: string;
  payload: unknown;
  requesterId: string | null;
  requesterRole: string;
  approverRole: string;
  authorityTier: "direct" | "requires_approval" | "denied";
  escalationPath: string[];
  rationale: string | null;
  evidence: unknown;
  affectedEntities: unknown;
  status: "pending" | "approved" | "declined" | "applied_direct";
  decidedBy: string | null;
  decidedAt: string | null;
  declineReason: string | null;
  createdAt: string;
}

export interface NewApproval {
  changeType: string;
  summary: string;
  payload?: unknown;
  requesterId: string | null;
  requesterRole: string;
  approverRole: string;
  authorityTier: Approval["authorityTier"];
  escalationPath?: string[];
  rationale?: string | null;
  evidence?: unknown;
  affectedEntities?: unknown;
  status?: Approval["status"];
}

export interface ApprovalRepository {
  /** The queue a senior role sees (optionally scoped to a tier). */
  listPending(approverRole?: string): Promise<Approval[]>;
  /** Full record for lineage/memory. */
  list(limit?: number): Promise<Approval[]>;
  create(a: NewApproval): Promise<Approval>;
  decide(
    id: string,
    status: "approved" | "declined",
    decidedBy: string | null,
    declineReason?: string
  ): Promise<void>;
}

/** A capability as a first-class node (migration 0004). */
export interface Capability {
  id: string;
  name: string;
  category: string | null;
  strategicImportance: "low" | "medium" | "high" | "critical";
}

/** A rated person↔capability edge. `userName` is embedded for the engine. */
export interface EmployeeCapability {
  userId: string;
  userName: string | null;
  capabilityId: string;
  proficiency: number;
  isPrimary: boolean;
}

export interface CapabilityRepository {
  list(): Promise<Capability[]>;
}

export interface EmployeeCapabilityRepository {
  list(): Promise<EmployeeCapability[]>;
}

export interface Repositories {
  employees: EmployeeRepository;
  tasks: TaskRepository;
  capacity: CapacityRepository;
  projects: ProjectRepository;
  proposals: ProposalRepository;
  risks: RiskRepository;
  audit: AuditRepository;
  approvals: ApprovalRepository;
  capabilities: CapabilityRepository;
  employeeCapabilities: EmployeeCapabilityRepository;
  /** Which backend is live — surfaced in /api/health for operability. */
  backend: "memory" | "supabase";
}
