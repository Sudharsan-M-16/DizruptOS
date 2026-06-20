// POST /api/v1/import/github — GitHub webhook receiver.
//
// Ingests developer activity signals into the org graph:
//   • push / pull_request / pull_request_review → contributor activity
//   • issues → cross-org dependency signals
//   • member → team membership changes
//
// Configure in GitHub: Settings → Webhooks → URL: <app>/api/v1/import/github
// Set content-type to application/json and the secret to GITHUB_WEBHOOK_SECRET.

import { type NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { metrics } from "@/lib/telemetry";
import { log } from "@/server/lib/logger";
import { getRepositories } from "@/server/repositories";
import { upsertExternalDecision, resolveDefaultOrgId } from "@/server/services/graph-writer";

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

function verifyGitHubSignature(body: string, header: string | null): boolean {
  if (!WEBHOOK_SECRET) return true;
  if (!header || !header.startsWith("sha256=")) return false;
  const expected = "sha256=" + createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  } catch { return false; }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("x-hub-signature-256");
  const event = req.headers.get("x-github-event") ?? "unknown";

  if (!verifyGitHubSignature(rawBody, sig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try { payload = JSON.parse(rawBody); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  metrics.importRows.inc({ connector: "github", event });
  const repos = getRepositories();
  const now = new Date().toISOString();
  const sender = (payload.sender as Record<string, string>)?.login ?? "github";

  // Extract org intelligence signals by event type.
  let entityLabel = `GitHub ${event}`;
  let detail = "";

  switch (event) {
    case "push": {
      const commits = (payload.commits as unknown[])?.length ?? 0;
      const ref = payload.ref as string ?? "";
      const branch = ref.replace("refs/heads/", "");
      entityLabel = `Push to ${branch} (${commits} commits)`;
      detail = JSON.stringify({ repo: (payload.repository as Record<string, string>)?.full_name, branch, commits });
      break;
    }
    case "pull_request": {
      const pr = payload.pull_request as Record<string, unknown>;
      entityLabel = `PR #${pr?.number}: ${pr?.title}`;
      detail = JSON.stringify({ action: payload.action, state: pr?.state, additions: pr?.additions, deletions: pr?.deletions });
      break;
    }
    case "pull_request_review": {
      const review = payload.review as Record<string, unknown>;
      entityLabel = `PR Review: ${review?.state}`;
      detail = JSON.stringify({ pr: (payload.pull_request as Record<string, unknown>)?.number, state: review?.state });
      break;
    }
    case "member": {
      const member = payload.member as Record<string, string>;
      entityLabel = `Member ${payload.action}: ${member?.login}`;
      detail = JSON.stringify({ action: payload.action, member: member?.login });
      break;
    }
  }

  await repos.audit.append({
    id: `aud-github-${event}-${Date.now()}`,
    actorId: sender,
    actorRole: "employee",
    actionType: `github_${event}`,
    entityType: "activity",
    entityLabel,
    detail,
    at: now,
  });

  // Write merged PRs as decision records (a PR merge IS a technical decision)
  let graphWrite = false;
  if (event === "pull_request") {
    const pr = payload.pull_request as Record<string, unknown>;
    const isMerged = payload.action === "closed" && pr?.merged === true;
    if (isMerged) {
      const orgId = await resolveDefaultOrgId();
      graphWrite = await upsertExternalDecision({
        externalId:  String(pr.number ?? `gh-${Date.now()}`),
        source:      "github",
        title:       String(pr.title ?? entityLabel),
        description: `PR #${pr.number} merged by ${sender}. +${pr.additions ?? 0}/-${pr.deletions ?? 0} lines.`,
        status:      "decided",
        orgId,
        decidedAt:   String(pr.merged_at ?? now),
      });
    }
  }

  return NextResponse.json({ ok: true, event, processed: entityLabel, graphWrite });
}

export async function GET() {
  return NextResponse.json({
    connector: "github",
    status: WEBHOOK_SECRET ? "configured" : "open_no_auth",
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.dizrupt.com"}/api/v1/import/github`,
    events: ["push", "pull_request", "pull_request_review", "member", "issues"],
    setup: [
      "1. Go to GitHub repo/org Settings → Webhooks",
      "2. Set Payload URL to the webhookUrl above",
      "3. Content type: application/json",
      "4. Set GITHUB_WEBHOOK_SECRET env var + paste into GitHub webhook secret field",
      "5. Select events: Pushes, Pull requests, Pull request reviews, Members",
    ],
  });
}
