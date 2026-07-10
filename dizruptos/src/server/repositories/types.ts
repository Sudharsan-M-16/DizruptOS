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
  create(e: Omit<Employee, "id" | "initials" | "accent" | "expertise" | "ptoDays" | "burnoutScore">): Promise<Employee>;
}

export interface TaskRepository {
  list(): Promise<Task[]>;
  byId(id: string): Promise<Task | null>;
  /** Reassign + apply both capacity deltas as ONE unit (PRD §11 atomicity). */
  reassign(taskId: string, toEmployeeId: string): Promise<void>;
  create(t: Omit<Task, "id" | "loggedHours" | "labels" | "dependsOn">): Promise<Task>;
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
  create(p: Omit<Project, "id" | "code" | "velocityTrend">): Promise<Project>;
}

export interface RiskRepository {
  list(): Promise<Risk[]>;
  create(r: Omit<Risk, "id">): Promise<Risk>;
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

export interface DecisionRecord {
  id: string;
  title: string;
  rationale: string | null;
  context: string | null;
  confidenceLevel: "low" | "medium" | "high" | null;
  status: string;
  ownerId: string | null;
  projectId: string | null;
  supersededBy: string | null;
  createdAt: string;
}
export interface OutcomeRecord {
  id: string;
  decisionId: string;
  expected: string | null;
  actual: string | null;
  measured: string | null;
  status: "pending" | "succeeded" | "partial" | "failed" | "reversed";
  confidence: number | null;
  projectId: string | null;
  capabilityId: string | null;
  createdAt: string;
}
export interface LearningRecord {
  id: string;
  title: string;
  insight: string;
  decisionId: string | null;
  outcomeId: string | null;
  capabilityId: string | null;
  projectId: string | null;
  createdAt: string;
}

/** A recommendation persisted as a first-class operational entity (migration
 *  0010). Carries its lifecycle state, the prediction written on accept, and the
 *  measured outcome — the substrate that closes the learning loop. */
export type RecommendationStatus =
  | "pending" | "acknowledged" | "accepted" | "rejected" | "deferred" | "completed" | "measured";

export interface RecommendationRecord {
  id: string;
  type: string;
  title: string;
  rationale: string | null;
  impact: string | null;
  priority: number | null;
  evidence: string[];
  traceKind: string | null;
  traceId: string | null;
  traceLabel: string | null;
  status: RecommendationStatus;
  actorId: string | null;
  // prediction (written on accept)
  confidence: number | null;
  baselineValue: number | null;
  expectedDelta: number | null;
  // outcome (written on measure)
  actualValue: number | null;
  accuracy: number | null;
  acceptedAt: string | null;
  decidedAt: string | null;
  measuredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Idempotent seed of a computed recommendation (stable engine key as `id`). */
export interface NewRecommendation {
  id: string;
  type: string;
  title: string;
  rationale?: string | null;
  impact?: string | null;
  priority?: number | null;
  evidence?: string[];
  traceKind?: string | null;
  traceId?: string | null;
  traceLabel?: string | null;
}

/** Fields a lifecycle transition may write (prediction on accept, outcome on
 *  measure). The repository stamps timestamps and the new status. */
export interface RecommendationPatch {
  actorId?: string | null;
  confidence?: number | null;
  baselineValue?: number | null;
  expectedDelta?: number | null;
  actualValue?: number | null;
  accuracy?: number | null;
  acceptedAt?: string | null;
  decidedAt?: string | null;
  measuredAt?: string | null;
}

export interface RecommendationRepository {
  list(): Promise<RecommendationRecord[]>;
  byId(id: string): Promise<RecommendationRecord | null>;
  /** Insert computed recs that don't exist yet; never clobbers lifecycle state. */
  upsertComputed(recs: NewRecommendation[]): Promise<void>;
  /** Apply a validated lifecycle transition + any prediction/outcome fields. */
  transition(id: string, status: RecommendationStatus, patch: RecommendationPatch): Promise<RecommendationRecord>;
}

/** Decision lineage ontology (migration 0011) — the reasoning behind a decision
 *  as first-class, falsifiable records. */
export interface EvidenceRecord {
  id: string;
  decisionId: string;
  source: string | null;
  summary: string;
  strength: "weak" | "moderate" | "strong";
  createdAt: string;
}
export interface AssumptionRecord {
  id: string;
  decisionId: string;
  statement: string;
  status: "holds" | "violated" | "unknown";
  criticality: "low" | "medium" | "high" | "critical";
  createdAt: string;
}
export interface HypothesisRecord {
  id: string;
  decisionId: string;
  statement: string;
  status: "open" | "confirmed" | "refuted";
  confidence: number | null;
  createdAt: string;
}

export interface DecisionRepository {
  list(): Promise<DecisionRecord[]>;
  byId(id: string): Promise<DecisionRecord | null>;
}
export interface OutcomeRepository {
  list(): Promise<OutcomeRecord[]>;
}
export interface LearningRepository {
  list(): Promise<LearningRecord[]>;
}
export interface LineageRepository {
  evidence(): Promise<EvidenceRecord[]>;
  assumptions(): Promise<AssumptionRecord[]>;
  hypotheses(): Promise<HypothesisRecord[]>;
}

export interface GraphRelationship {
  sourceId: string;
  sourceType: string;
  targetId: string;
  targetType: string;
  relationshipType: string;
}

export interface RelationshipRepository {
  list(): Promise<GraphRelationship[]>;
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
  relationships: RelationshipRepository;
  decisions: DecisionRepository;
  outcomes: OutcomeRepository;
  learnings: LearningRepository;
  lineage: LineageRepository;
  recommendations: RecommendationRepository;
  /** Which backend is live — surfaced in /api/health for operability. */
  backend: "memory" | "supabase";
}
