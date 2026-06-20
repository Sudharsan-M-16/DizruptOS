// POST /api/v1/import/linear — Linear.app webhook receiver.
//
// Configure in Linear: Settings → API → Webhooks → URL: <app>/api/v1/import/linear
// Verify the Linear-Signature header (HMAC-SHA256 of body with LINEAR_WEBHOOK_SECRET).
//
// Events: Issue, Project, Cycle (= sprint), Comment.

import { type NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { metrics } from "@/lib/telemetry";
import { log } from "@/server/lib/logger";
import { getRepositories } from "@/server/repositories";
import { upsertExternalTask, upsertExternalProject, resolveDefaultOrgId } from "@/server/services/graph-writer";

const WEBHOOK_SECRET = process.env.LINEAR_WEBHOOK_SECRET;

type LinearIssue = {
  id: string;
  title: string;
  identifier: string;
  priority: number;  // 0=none, 1=urgent, 2=high, 3=medium, 4=low
  state: { name: string; type: string };
  assignee: { id: string; name: string; email: string } | null;
  team: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
};

type LinearPayload = {
  action: "create" | "update" | "remove";
  type: "Issue" | "Project" | "Cycle" | "Comment";
  data: LinearIssue | Record<string, unknown>;
  createdAt: string;
  organizationId: string;
};

function verifyLinearSignature(body: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET) return true;  // open in demo
  if (!signature) return false;
  const expected = createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
  return signature === expected;
}

function linearPriorityToDizrupt(p: number): "low" | "medium" | "high" | "critical" {
  if (p === 1) return "critical";
  if (p === 2) return "high";
  if (p === 3) return "medium";
  return "low";
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("linear-signature");

  if (!verifyLinearSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: LinearPayload;
  try { payload = JSON.parse(rawBody); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { action, type, data } = payload;
  metrics.importRows.inc({ connector: "linear", type, action });

  const repos = getRepositories();
  const now = new Date().toISOString();

  const orgId = await resolveDefaultOrgId();
  let graphWrite = false;

  if (type === "Issue") {
    const issue = data as LinearIssue;
    const priority = linearPriorityToDizrupt(issue.priority);
    const statusRaw = issue.state?.type ?? "started";
    const status: "todo" | "in_progress" | "completed" | "blocked" =
      statusRaw === "completed" ? "completed"
      : statusRaw === "started" || statusRaw === "inProgress" ? "in_progress"
      : "todo";

    // 1. Audit trail
    await repos.audit.append({
      id: `aud-linear-${issue.identifier}-${Date.now()}`,
      actorId: issue.assignee?.id ?? "linear-system",
      actorRole: "employee",
      actionType: `linear_issue_${action}`,
      entityType: "task",
      entityLabel: `${issue.identifier}: ${issue.title}`,
      detail: JSON.stringify({
        identifier: issue.identifier,
        team: issue.team?.name,
        status,
        priority,
        assignee: issue.assignee?.name ?? "unassigned",
      }),
      at: now,
    });

    // 2. Graph write
    graphWrite = await upsertExternalTask({
      externalId:    issue.id,
      source:        "linear",
      title:         `${issue.identifier}: ${issue.title}`,
      status,
      priority,
      assigneeEmail: issue.assignee?.email ?? null,
      projectName:   issue.team?.name ?? null,
      orgId,
      updatedAt:     issue.updatedAt,
    });

  } else if (type === "Project") {
    const proj = data as { id: string; name: string; updatedAt?: string };
    graphWrite = await upsertExternalProject({
      externalId: proj.id,
      source:     "linear",
      name:       proj.name,
      orgId,
      updatedAt:  proj.updatedAt ?? now,
    });
  }

  return NextResponse.json({ ok: true, processed: `${type}.${action}`, graphWrite });
}

export async function GET() {
  return NextResponse.json({
    connector: "linear",
    status: WEBHOOK_SECRET ? "configured" : "open_no_auth",
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.dizrupt.com"}/api/v1/import/linear`,
    events: ["Issue", "Project", "Cycle"],
    setup: [
      "1. Go to Linear Settings → API → Webhooks",
      "2. Set URL to the webhookUrl above",
      "3. Set LINEAR_WEBHOOK_SECRET env var",
      "4. Copy the signing secret from Linear to the env var",
    ],
  });
}
