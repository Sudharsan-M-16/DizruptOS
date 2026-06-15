// POST /api/v1/import/linear — Linear.app webhook receiver.
//
// Configure in Linear: Settings → API → Webhooks → URL: <app>/api/v1/import/linear
// Verify the Linear-Signature header (HMAC-SHA256 of body with LINEAR_WEBHOOK_SECRET).
//
// Events: Issue, Project, Cycle (= sprint), Comment.

import { type NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { metrics } from "@/lib/telemetry";
import { getRepositories } from "@/server/repositories";

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

  if (type === "Issue") {
    const issue = data as LinearIssue;
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
        status: issue.state?.type,
        priority: linearPriorityToDizrupt(issue.priority),
        assignee: issue.assignee?.name ?? "unassigned",
      }),
      at: now,
    });
  }

  return NextResponse.json({ ok: true, processed: `${type}.${action}` });
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
