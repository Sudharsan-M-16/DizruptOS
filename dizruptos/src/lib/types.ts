// DIZRUPT entity model — mirrors PRD §4 (Organizational Graph) and §12 (schema)

export type Role =
  | "admin"
  | "executive"
  | "dept_head"
  | "project_manager"
  | "team_lead"
  | "employee"
  | "client";

export type TaskStatus =
  | "BACKLOG"
  | "TO_DO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "CLIENT_REVIEW"
  | "BLOCKED"
  | "COMPLETED";

export type TaskPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW";

export type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export type HealthStatus =
  | "ON_TRACK"
  | "DELAYED"
  | "AT_RISK"
  | "BLOCKED"
  | "CRITICAL";

export interface Department {
  id: string;
  name: string;
  headId: string;
}

export interface Employee {
  id: string;
  name: string;
  initials: string;
  role: Role;
  title: string;
  departmentId: string;
  managerId?: string;
  capacityHoursPerWeek: number;
  skills: string[];
  expertise: { domain: string; depth: number }[]; // depth 0–1
  timezone: string;
  location: string;
  joinedAt: string;
  ptoDays: string[]; // ISO dates blocked
  burnoutFlag?: boolean;
  burnoutSignals?: string[];
  flightRisk?: number; // 0–1, manager-private
  accent: string; // avatar hue
}

export interface CapacityCell {
  employeeId: string;
  weekStart: string; // ISO Monday
  allocatedHours: number;
  loggedHours: number;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  departmentId: string;
  ownerId: string;
  status: ProjectStatus;
  health: HealthStatus;
  healthReasons: string[];
  budgetHours: number;
  consumedHours: number;
  budgetMicro: number; // micro-units; $1 = 1_000_000
  consumedMicro: number;
  startDate: string;
  targetDate: string;
  customer?: string;
  goalId?: string;
  velocityTrend: number[]; // last 6 sprints
}

export interface Task {
  id: string;
  title: string;
  projectId: string;
  assigneeId?: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedHours: number;
  loggedHours: number;
  dueDate: string;
  weekStart: string; // which capacity week it lands in
  labels: string[];
  dependsOn: string[]; // task ids
  subtasks?: { done: number; total: number };
}

export type RiskProbability = "low" | "medium" | "high";
export type RiskImpact = "low" | "medium" | "high" | "critical";
export type RiskSeverity = "Low" | "Medium" | "High" | "Critical";
export type RiskStatus =
  | "OPEN"
  | "MITIGATING"
  | "MONITORING"
  | "ACCEPTED"
  | "ESCALATED"
  | "CLOSED";

export interface Risk {
  id: string;
  title: string;
  category:
    | "security"
    | "vendor"
    | "operational"
    | "compliance"
    | "financial"
    | "people";
  probability: RiskProbability;
  impact: RiskImpact;
  ownerId: string;
  projectId?: string;
  mitigationPlan: string;
  mitigationStatus: "not_started" | "in_progress" | "complete";
  status: RiskStatus;
  createdAt: string;
  signals: string[];
}

export type DecisionStatus =
  | "DRAFT"
  | "PROPOSED"
  | "APPROVED"
  | "ACTIVE"
  | "SUPERSEDED"
  | "REVERSED";

export interface Decision {
  id: string;
  title: string;
  context: string;
  chosenOption: string;
  rationale: string;
  optionsConsidered: { option: string; pros: string; cons: string }[];
  confidence: "low" | "medium" | "high";
  ownerId: string;
  projectId?: string;
  status: DecisionStatus;
  decidedAt: string;
  expectedOutcome: string;
  actualOutcome?: string;
  linkedRiskIds: string[];
}

export type AgentType =
  | "burnout_safety"
  | "allocation_optimize"
  | "delivery_critical"
  | "risk_advisory";

export type ProposalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "compromise";

export interface Proposal {
  id: string;
  agentType: AgentType;
  title: string;
  summary: string;
  /** RBAC: which roles see this in their inbox. Admin always sees everything. */
  visibility: Role[];
  /** The employee this proposal concerns — employees see exactly the items
   *  where subjectId is them, framed as personal requests. */
  subjectId?: string;
  reasoning: string[]; // causal signals, each with confidence inline
  action: {
    kind: "reallocate" | "reduce_load" | "escalate" | "shift_deadline";
    taskId?: string;
    fromEmployeeId?: string;
    toEmployeeId?: string;
    deltaHours?: number;
    projectId?: string;
  };
  confidence: number;
  priority: number; // PRIORITY_HIERARCHY value
  entityLabel: string;
  status: ProposalStatus;
  createdAt: string;
  expiresAt: string;
  conflict?: {
    withAgent: AgentType;
    resolution: string; // negotiation coordinator output
  };
  validation: { check: string; pass: boolean }[];
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorRole: Role;
  actionType: string;
  entityType: string;
  entityLabel: string;
  detail: string;
  overrideReason?: string;
  at: string;
}

export interface Goal {
  id: string;
  title: string;
  ownerId: string;
  progress: number;
  targetDate: string;
  keyResults: { title: string; progress: number }[];
}

export interface Commitment {
  id: string;
  title: string;
  ownerId: string;
  toId: string;
  dueDate: string;
  status: "open" | "in_progress" | "fulfilled" | "overdue" | "withdrawn";
  source: string;
}

export interface NotificationItem {
  id: string;
  klass:
    | "hard_stop"
    | "critical_action"
    | "manager_review"
    | "intelligence"
    | "informational";
  title: string;
  body: string;
  at: string;
  read: boolean;
  entityRef?: string;
}

export interface CausalSignal {
  id: string;
  effectLabel: string;
  causeDescription: string;
  confidence: number;
  derivation: "rule_based" | "statistical" | "ai_inferred";
}
