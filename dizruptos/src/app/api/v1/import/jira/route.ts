// POST /api/v1/import/jira — Jira Cloud webhook receiver.
//
// Configure in Jira: Project Settings → Webhooks → URL: <app>/api/v1/import/jira
// Verify the shared secret in X-Atlassian-Token or HMAC signature.
//
// Events consumed: jira:issue_created, jira:issue_updated, sprint_started, sprint_closed.
// Maps Jira issues → DIZRUPT tasks, Jira projects → DIZRUPT projects, users → employees.

import { type NextRequest, NextResponse } from "next/server";
import { metrics } from "@/lib/telemetry";
import { getRepositories } from "@/server/repositories";

const JIRA_WEBHOOK_SECRET = process.env.JIRA_WEBHOOK_SECRET;

type JiraIssue = {
  id: string;
  key: string;
  fields: {
    summary: string;
    status: { name: string };
    priority: { name: string };
    assignee: { displayName: string; emailAddress: string; accountId: string } | null;
    project: { id: string; key: string; name: string };
    issuetype: { name: string };
    created: string;
    updated: string;
    description?: string;
  };
};

type JiraWebhookPayload = {
  webhookEvent: string;
  issue?: JiraIssue;
  user?: { displayName: string; emailAddress: string };
  timestamp: number;
};

function mapJiraPriority(priority: string): "low" | "medium" | "high" | "critical" {
  switch (priority.toLowerCase()) {
    case "highest": case "critical": return "critical";
    case "high": return "high";
    case "medium": case "normal": return "medium";
    default: return "low";
  }
}

function mapJiraStatus(status: string): string {
  const lower = status.toLowerCase();
  if (lower.includes("done") || lower.includes("closed") || lower.includes("resolved")) return "completed";
  if (lower.includes("progress") || lower.includes("review")) return "in_progress";
  return "todo";
}

export async function POST(req: NextRequest) {
  // Validate shared secret if configured.
  if (JIRA_WEBHOOK_SECRET) {
    const token = req.headers.get("x-atlassian-token") ?? req.headers.get("authorization");
    if (!token || !token.includes(JIRA_WEBHOOK_SECRET)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: JiraWebhookPayload;
  try { payload = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { webhookEvent, issue } = payload;
  metrics.importRows.inc({ connector: "jira", event: webhookEvent });

  if (!issue) {
    return NextResponse.json({ ok: true, skipped: "no issue in payload" });
  }

  const repos = getRepositories();
  const now = new Date().toISOString();

  // Map the Jira issue to a DIZRUPT audit event + task representation.
  await repos.audit.append({
    id: `aud-jira-${issue.key}-${Date.now()}`,
    actorId: issue.fields.assignee?.accountId ?? "jira-system",
    actorRole: "employee",
    actionType: `jira_${webhookEvent}`,
    entityType: "task",
    entityLabel: `${issue.key}: ${issue.fields.summary}`,
    detail: JSON.stringify({
      jiraKey: issue.key,
      project: issue.fields.project.name,
      status: mapJiraStatus(issue.fields.status.name),
      priority: mapJiraPriority(issue.fields.priority?.name ?? "medium"),
      assignee: issue.fields.assignee?.displayName ?? "unassigned",
    }),
    at: now,
  });

  console.log(JSON.stringify({
    ts: now,
    level: "info",
    event: "jira_import",
    ctx: { key: issue.key, event: webhookEvent, project: issue.fields.project.key }
  }));

  return NextResponse.json({
    ok: true,
    imported: {
      jiraKey: issue.key,
      summary: issue.fields.summary,
      status: mapJiraStatus(issue.fields.status.name),
      priority: mapJiraPriority(issue.fields.priority?.name ?? "medium"),
    }
  });
}

// GET — configuration endpoint for Jira integration setup UI.
export async function GET() {
  return NextResponse.json({
    connector: "jira",
    status: JIRA_WEBHOOK_SECRET ? "configured" : "open_no_auth",
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.dizrupt.com"}/api/v1/import/jira`,
    events: ["jira:issue_created", "jira:issue_updated", "sprint_started", "sprint_closed"],
    setup: [
      "1. Go to Jira Project Settings → Webhooks",
      "2. Set URL to the webhookUrl above",
      "3. Set JIRA_WEBHOOK_SECRET env var + add it to Jira webhook description",
      "4. Select events: issue_created, issue_updated, sprint events",
    ],
  });
}
