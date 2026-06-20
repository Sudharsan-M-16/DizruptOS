// Graph writer — persists ingested entities from external connectors (Jira,
// Linear, GitHub) into the org graph tables using the Supabase service-role key.
//
// Design:  connector receives webhook → validates → calls graphWriter.upsertTask()
//          → table row written (idempotent via external_id UNIQUE constraint from 0009)
//          → audit event also appended.
//
// In demo mode: all methods silently no-op so the connectors still work offline
// without Supabase, falling back to audit-only mode.

import { createClient } from "@supabase/supabase-js";
import { env, isDemoMode } from "@/lib/env";

/** One-shot service-role Supabase client for server-side writes. */
function serviceClient() {
  if (isDemoMode || !env.supabaseUrl) return null;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(env.supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface ExternalTask {
  externalId:   string;           // jira_key / linear_id / github issue #
  source:       "jira" | "linear" | "github";
  title:        string;
  status:       "todo" | "in_progress" | "completed" | "blocked";
  priority:     "low" | "medium" | "high" | "critical";
  assigneeEmail?: string | null;
  projectName?:   string | null;
  orgId?:         string | null;
  updatedAt:      string;         // ISO timestamp from source
}

export interface ExternalProject {
  externalId:  string;
  source:      "jira" | "linear" | "github";
  name:        string;
  status?:     string;
  orgId?:      string | null;
  updatedAt:   string;
}

export interface ExternalDecision {
  externalId:  string;
  source:      "github";
  title:       string;
  description: string;
  status:      string;
  orgId?:      string | null;
  decidedAt:   string;
}

/** Upsert a task from an external connector into the tasks table. */
export async function upsertExternalTask(task: ExternalTask): Promise<boolean> {
  const sb = serviceClient();
  if (!sb) return false; // demo mode / unconfigured — no-op

  // Resolve assignee by email (best-effort; null if not found)
  let assigneeId: string | null = null;
  if (task.assigneeEmail) {
    const { data: user } = await sb
      .from("users")
      .select("id")
      .ilike("email", task.assigneeEmail)
      .maybeSingle();
    assigneeId = user?.id ?? null;
  }

  // Resolve (or create) project by name
  let projectId: string | null = null;
  if (task.projectName) {
    const { data: existing } = await sb
      .from("projects")
      .select("id")
      .ilike("name", task.projectName)
      .maybeSingle();
    if (existing) {
      projectId = existing.id;
    } else if (task.orgId) {
      // Create a shell project so tasks are attached to something
      const { data: created } = await sb
        .from("projects")
        .insert({ name: task.projectName, org_id: task.orgId, status: "ACTIVE" })
        .select("id")
        .single();
      projectId = created?.id ?? null;
    }
  }

  // Upsert the task (idempotent via external_id unique constraint from 0009)
  const col = task.source === "jira" ? "jira_key"
            : task.source === "linear" ? "linear_id"
            : "github_id";

  const row: Record<string, unknown> = {
    title:      task.title,
    status:     task.status.toUpperCase(),
    priority:   task.priority.toUpperCase(),
    updated_at: task.updatedAt,
    [col]:      task.externalId,
  };
  if (assigneeId)  row.assignee_id = assigneeId;
  if (projectId)   row.project_id  = projectId;
  if (task.orgId)  row.org_id      = task.orgId;

  const { error } = await sb
    .from("tasks")
    .upsert(row, { onConflict: col, ignoreDuplicates: false });

  if (error) console.error("[graph-writer] task upsert failed:", error.message);
  return !error;
}

/** Upsert a project from an external connector. */
export async function upsertExternalProject(project: ExternalProject): Promise<boolean> {
  const sb = serviceClient();
  if (!sb) return false;

  const col = project.source === "jira" ? "jira_key"
            : project.source === "linear" ? "linear_id"
            : "github_id";

  const row: Record<string, unknown> = {
    name:       project.name,
    status:     project.status ?? "ACTIVE",
    updated_at: project.updatedAt,
    [col]:      project.externalId,
  };
  if (project.orgId) row.org_id = project.orgId;

  const { error } = await sb
    .from("projects")
    .upsert(row, { onConflict: col, ignoreDuplicates: false });

  if (error) console.error("[graph-writer] project upsert failed:", error.message);
  return !error;
}

/** Write a decision record from a GitHub PR merge. */
export async function upsertExternalDecision(decision: ExternalDecision): Promise<boolean> {
  const sb = serviceClient();
  if (!sb) return false;

  const { error } = await sb
    .from("decision_records")
    .upsert({
      title:       decision.title,
      description: decision.description,
      status:      decision.status,
      decided_at:  decision.decidedAt,
      source:      decision.source,
      github_id:   decision.externalId,
      org_id:      decision.orgId ?? null,
    }, { onConflict: "github_id", ignoreDuplicates: false });

  if (error) console.error("[graph-writer] decision upsert failed:", error.message);
  return !error;
}

/** Read the default org_id from the orgs table (used when connector doesn't send one). */
export async function resolveDefaultOrgId(): Promise<string | null> {
  const sb = serviceClient();
  if (!sb) return null;
  const { data } = await sb.from("organizations").select("id").limit(1).single();
  return data?.id ?? null;
}
